"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, ApiClientError } from "@/lib/api";
import { canFeature, type Entitlements, type MerchantFeature } from "@/lib/entitlements";
import { getToken, signOut } from "@/lib/session";
import { captureFromUrl, isImpersonating } from "@/lib/impersonation";
import type { Me, MerchantMe } from "@/lib/types";

/**
 * The workspace context: who you are, which merchant you are in, and what that merchant has paid
 * for. Fetched ONCE per page load, above the shell, and shared by the shell and the screen.
 *
 * ⚠️ THIS EXISTS BECAUSE OF TWO BUGS ONLY A BROWSER FOUND. The first arrangement put an
 * `EntitlementsProvider` *inside* `AppShell` — but a screen RETURNS `<AppShell>`, so the screen's
 * own `useEntitlements()` call sits OUTSIDE that provider and silently received the fail-closed
 * default: `loading: true` forever, `entitlements: null`. `GET /v1/entitlements` was never issued at
 * all, so the plan chip read "Free" for a Growth merchant and the 80% quota banner could never
 * appear. `tsc` was perfectly happy; the network panel showed the call missing.
 *
 * The second was duplication: the shell, the switcher and the screen each fetched
 * `/v1/merchants/me`, so one page load made three identical requests. Hoisting the fetch here makes
 * it one.
 *
 * The lesson is the general one: a React context is only shared by components BELOW the provider,
 * and "below" means below in the rendered tree, not below in the file.
 */

export type WorkspaceError = {
  message: string;
  code?: string;
  status?: number;
  step?: string;
};

export type Workspace = {
  me: Me | null;
  merchant: MerchantMe | null;
  entitlements: Entitlements | null;
  loading: boolean;
  error: string | null;
  errorDetail: WorkspaceError | null;
  /** Signed in but a member of no merchant — the Master's "user in 0 merchants" state. */
  needsMerchant: boolean;
  allowed: (feature: MerchantFeature) => boolean;
  isOverride: (feature: MerchantFeature) => boolean;
  reload: () => void;
};

const EMPTY: Workspace = {
  me: null,
  merchant: null,
  entitlements: null,
  loading: true,
  error: null,
  errorDetail: null,
  needsMerchant: false,
  // FAIL CLOSED while loading. Consumers must check `loading` first — see `EntitlementGate`, which
  // renders a neutral state rather than the children, because flashing an unentitled screen for one
  // paint is how a merchant learns a feature exists and then loses it.
  allowed: () => false,
  isOverride: () => false,
  reload: () => {},
};

const WorkspaceContext = createContext<Workspace>(EMPTY);

function describeWorkspaceFailure(err: unknown, step: string): WorkspaceError {
  if (err instanceof ApiClientError) {
    const genericInternal =
      err.code === "internal_error" &&
      err.message === "An unexpected error occurred.";
    const message = genericInternal
      ? `We could not load your ${step}. The server hit an internal error — try again in a moment. If this keeps happening, contact support.`
      : err.code === "network_error"
        ? `${err.message} Check your connection and that the API is reachable.`
        : err.message;
    return { message, code: err.code, status: err.status, step };
  }
  return {
    message: err instanceof Error ? err.message : "Could not load your account",
    step,
  };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [merchant, setMerchant] = useState<MerchantMe | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<WorkspaceError | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setErrorDetail(null);
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    captureFromUrl();
    (async () => {
      try {
        setError(null);
        setErrorDetail(null);
        const impersonating = isImpersonating();
        const token = impersonating ? null : await getToken();
        if (cancelled || (!token && !impersonating)) {
          if (!cancelled) setMe(null);
          return;
        }
        let identity: Me;
        try {
          identity = await apiRequest<Me>("/v1/me");
        } catch (err) {
          throw describeWorkspaceFailure(err, "account profile");
        }
        if (cancelled) return;
        let resolved = identity;
        if (!resolved.active_merchant_id) {
          try {
            const resumed = await apiRequest<{ resumed: boolean }>("/v1/iam/bootstrap/resume", {
              method: "POST",
            });
            if (resumed.resumed) {
              resolved = await apiRequest<Me>("/v1/me");
            }
          } catch {
            // No staged company, or already a member of nothing — shell shows create-workspace.
          }
        }
        if (cancelled) return;
        setMe(resolved);
        if (!resolved.active_merchant_id) return;

        let m: MerchantMe;
        let ent: Entitlements;
        try {
          m = await apiRequest<MerchantMe>("/v1/merchants/me");
        } catch (err) {
          throw describeWorkspaceFailure(err, "workspace settings");
        }
        try {
          ent = await apiRequest<Entitlements>("/v1/entitlements");
        } catch (err) {
          throw describeWorkspaceFailure(err, "plan and entitlements");
        }
        if (cancelled) return;
        setMerchant(m);
        setEntitlements(ent);
        setError(null);
        setErrorDetail(null);
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 401 && !isImpersonating()) {
          const localToken =
            typeof window !== "undefined" ? localStorage.getItem("frosty.auth_token") : null;
          if (!localToken) {
            void signOut();
          }
        }
        const detail =
          err && typeof err === "object" && "message" in err && "step" in err
            ? (err as WorkspaceError)
            : describeWorkspaceFailure(err, "workspace");
        if (!cancelled) {
          setError(detail.message);
          setErrorDetail(detail);
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  // Real-time synchronization: polls entitlements in background, listens to window focus,
  // storage events, and cross-tab broadcast notifications when admin updates overrides.
  useEffect(() => {
    if (!me?.active_merchant_id) return;
    let active = true;

    const poll = async () => {
      try {
        const ent = await apiRequest<Entitlements>("/v1/entitlements");
        if (!active) return;
        setEntitlements((prev) => {
          if (!prev || JSON.stringify(prev) !== JSON.stringify(ent)) {
            return ent;
          }
          return prev;
        });
      } catch {
        // fail silent on background polling
      }
    };

    const interval = setInterval(poll, 60_000);

    const onFocus = () => { void poll(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        bc = new BroadcastChannel("frosty_sync");
        bc.onmessage = (ev) => {
          if (ev.data?.type === "entitlements_updated") {
            void poll();
          }
        };
      } catch {
        // ignore
      }
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "frosty_sync_entitlements") {
        void poll();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("storage", onStorage);
      if (bc) bc.close();
    };
  }, [me?.active_merchant_id]);

  const value = useMemo<Workspace>(
    () => ({
      me,
      merchant,
      entitlements,
      loading,
      error,
      errorDetail,
      needsMerchant: Boolean(me) && me?.active_merchant_id === null,
      allowed: (feature) => canFeature(entitlements, feature),
      isOverride: (feature) => Boolean(entitlements?.overridden?.includes(feature)),
      reload,
    }),
    [me, merchant, entitlements, loading, error, errorDetail, reload],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): Workspace {
  return useContext(WorkspaceContext);
}
