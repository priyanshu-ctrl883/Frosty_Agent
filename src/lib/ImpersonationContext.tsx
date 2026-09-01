"use client";

/**
 * ImpersonationContext — makes the active support session visible to the entire
 * Merchant Dashboard component tree without prop-drilling.
 *
 * Handles:
 *   1. Local impersonation state (stored in sessionStorage when admin uses a callback link).
 *   2. Live presence via Support WebSocket (`/v1/support/ws`) for both merchants & admins.
 *   3. Session start / end notifications and real-time state synchronization.
 *   4. Recent activity buffer for live feed (Prompt 9).
 *
 * Provided by <ImpersonationProvider> in the root layout.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  clearImpersonation,
  loadImpersonation,
  type ImpersonationPayload,
} from "./impersonation";
import { API_URL } from "./constants";
import { apiRequest } from "./api";
import {
  openSupportSocket,
  type SupportAccessRequestedEvent,
  type SupportActivityEvent,
  type SupportCoBrowseEvent,
  type SupportWsFrame,
} from "./supportSocket";
import { useToast } from "./toast";
import { SupportApprovalModal } from "@/components/shell/SupportApprovalModal";
import { useCoBrowse } from "@/lib/coBrowse/useCoBrowse";
import { CoBrowseOverlay } from "@/components/coBrowse/CoBrowseOverlay";
import type { DrivingMode } from "@/lib/coBrowse/types";

// ── context shape ────────────────────────────────────────────────────────────

export type ImpersonationSessionData = {
  sessionId: string;
  adminName: string | null;
  reason: string | null;
  ticketId: string | null;
  expiresAt: string;
  startedAt?: string;
};

export type ImpersonationContextValue = {
  /** True if this browser tab is currently acting under an impersonation token. */
  isImpersonating: boolean;
  /** True if a support session is currently active (either as admin or on the merchant side). */
  isSupportActive: boolean;
  sessionId: string | null;
  adminName: string | null;
  reason: string | null;
  ticketId: string | null;
  expiresAt: string | null;
  merchantId: string | null;
  /** Active session metadata received from live WS presence or local storage. */
  activeSession: ImpersonationSessionData | null;
  /** Recent activity events stream (buffer of up to 50 items). */
  recentActivities: SupportActivityEvent[];
  pendingRequest: SupportAccessRequestedEvent | null;
  /** Real-time co-browse driving mode: "admin" | "merchant" | "both" */
  drivingMode: DrivingMode;
  /** True if local user is the current driver in co-browse mode */
  isDriver: boolean;
  setDrivingMode: (mode: DrivingMode) => void;
  approvePendingRequest: (sessionId: string) => Promise<void>;
  denyPendingRequest: (sessionId: string, reason?: string) => Promise<void>;
  /** Ends/revokes the session and cleans up local state. */
  endSession: () => Promise<void>;
  /** Re-read from sessionStorage (e.g. after the callback page stores the payload). */
  refresh: () => void;
};

const ImpersonationContext = createContext<ImpersonationContextValue>({
  isImpersonating: false,
  isSupportActive: false,
  sessionId: null,
  adminName: null,
  reason: null,
  ticketId: null,
  expiresAt: null,
  merchantId: null,
  activeSession: null,
  recentActivities: [],
  pendingRequest: null,
  drivingMode: "admin",
  isDriver: false,
  setDrivingMode: () => {},
  approvePendingRequest: async () => {},
  denyPendingRequest: async () => {},
  endSession: async () => {},
  refresh: () => {},
});

// ── provider ────────────────────────────────────────────────────────────────

export function ImpersonationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { showToast } = useToast();
  const [payload, setPayload] = useState<ImpersonationPayload | null>(null);
  const [remoteSession, setRemoteSession] =
    useState<ImpersonationSessionData | null>(null);
  const [pendingRequest, setPendingRequest] =
    useState<SupportAccessRequestedEvent | null>(null);
  const [activities, setActivities] = useState<SupportActivityEvent[]>([]);

  const effectiveSession = useMemo(() => {
    if (payload) {
      return {
        sessionId: payload.session_id,
        adminName: payload.admin_name,
        reason: payload.reason,
        ticketId: payload.ticket_id,
        expiresAt: payload.expires_at,
        startedAt: payload.stored_at,
      };
    }
    return remoteSession;
  }, [payload, remoteSession]);

  const coBrowse = useCoBrowse({
    sessionId: effectiveSession?.sessionId ?? null,
    isImpersonating: payload !== null,
    adminName: effectiveSession?.adminName ?? null,
    active: effectiveSession !== null,
  });

  const coBrowseRef = useRef(coBrowse);
  coBrowseRef.current = coBrowse;

  // Read from sessionStorage on mount and whenever refresh() is called.
  const refresh = useCallback(() => {
    const p = loadImpersonation();
    setPayload(p);
    if (p) {
      setRemoteSession({
        sessionId: p.session_id,
        adminName: p.admin_name,
        reason: p.reason,
        ticketId: p.ticket_id,
        expiresAt: p.expires_at,
        startedAt: p.stored_at,
      });
    }
  }, []);

  useEffect(() => {
    refresh();
    const handler = (e: StorageEvent) => {
      if (e.key?.includes("impersonation")) refresh();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refresh]);

  // ── Support WebSocket lifecycle ──────────────────────────────────────────
  useEffect(() => {
    const cleanup = openSupportSocket({
      onEvent: (frame: SupportWsFrame) => {
        if (frame.type === "support_access_requested") {
          setPendingRequest(frame);
          if (!frame.snapshot) {
            showToast(
              `Frostrek Support (${frame.admin.name || "Engineer"}) is requesting access`,
              { type: "info", duration: 8000 }
            );
          }
        } else if (frame.type === "support_access_approved") {
          setPendingRequest(null);
        } else if (frame.type === "support_access_denied") {
          setPendingRequest(null);
          showToast("Support access request was denied or timed out", {
            type: "info",
            duration: 5000,
          });
        } else if (frame.type === "support_session_started") {
          setPendingRequest(null);
          setRemoteSession({
            sessionId: frame.session_id,
            adminName: frame.admin_name,
            reason: frame.reason,
            ticketId: frame.ticket_id,
            expiresAt: frame.expires_at,
            startedAt: frame.started_at,
          });
          if (!frame.snapshot) {
            showToast(
              `Frostrek support session started by ${frame.admin_name || "Support"}`,
              { type: "info", duration: 6000 }
            );
          }
        } else if (frame.type === "support_session_ended") {
          // Capture whether THIS tab is the impersonating admin before we clear everything.
          // `payload` is captured by the closure; if it's non-null the admin opened this
          // tab via /impersonate/callback and their JWT is now invalid.
          setPayload((currentPayload) => {
            if (currentPayload !== null) {
              // Admin's tab: clear session storage and eject to the session-ended page.
              clearImpersonation();
              // Defer navigation one tick so React can flush the state update first.
              setTimeout(() => {
                window.location.href = "/impersonate/session-ended";
              }, 0);
            } else {
              // Merchant observer tab: clear remote session and show toast.
              clearImpersonation();
            }
            return null;
          });
          setRemoteSession(null);
          showToast("Frostrek support session ended", {
            type: "info",
            duration: 6000,
          });
        } else if (frame.type === "support_activity") {
          setActivities((prev) => [frame, ...prev.slice(0, 49)]);
        } else if (frame.type === "co_browse") {
          coBrowseRef.current.handleInboundCoBrowse(frame);
        }
      },
    });

    return () => {
      cleanup();
    };
  }, [showToast]);

  // Proactive periodic validity check for active impersonating admin tab
  useEffect(() => {
    if (!payload?.token) return;
    let active = true;

    async function checkSession() {
      try {
        const res = await fetch(`${API_URL}/v1/impersonation/session`, {
          headers: {
            Authorization: `Bearer ${payload!.token}`,
            Accept: "application/json",
          },
        });
        if (res.status === 401 || res.status === 403) {
          if (!active) return;
          clearImpersonation();
          setPayload(null);
          setRemoteSession(null);
          window.location.href = "/impersonate/session-ended";
        }
      } catch {
        // Transient network blip — next interval retries
      }
    }

    const interval = setInterval(checkSession, 2500);
    const onFocus = () => { void checkSession(); };
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [payload?.token]);

  const approvePendingRequest = useCallback(
    async (sessionId: string) => {
      await apiRequest(`/v1/impersonation/sessions/${sessionId}/approve`, {
        method: "POST",
      });
      setPendingRequest(null);
      showToast("Support access approved", { type: "info", duration: 5000 });
    },
    [showToast]
  );

  const denyPendingRequest = useCallback(
    async (sessionId: string, reason?: string) => {
      await apiRequest(`/v1/impersonation/sessions/${sessionId}/deny`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setPendingRequest(null);
      showToast("Support access denied", { type: "info", duration: 5000 });
    },
    [showToast]
  );

  const endSession = useCallback(async () => {
    const isLocalAdmin = payload !== null;
    const activeMid = payload?.merchant_id;
    const activeToken = payload?.token;
    const activeSid = payload?.session_id || remoteSession?.sessionId;

    try {
      if (activeMid && activeToken) {
        // Admin impersonating — call DELETE /platform/merchants/{id}/impersonate
        await fetch(
          `${API_URL}/v1/platform/merchants/${activeMid}/impersonate`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${activeToken}`,
              "X-Impersonation-Session": activeSid || "",
            },
          },
        );
      } else {
        // Merchant revoking — call POST /v1/impersonation/active-session/revoke
        await apiRequest("/v1/impersonation/active-session/revoke", {
          method: "POST",
        });
      }
    } catch {
      // Swallow error; local cleanup below ensures UI doesn't lock up
    } finally {
      clearImpersonation();
      setPayload(null);
      setRemoteSession(null);
      if (isLocalAdmin) {
        window.location.href = "/impersonate/session-ended";
      }
    }
  }, [payload, remoteSession]);

  const value = useMemo<ImpersonationContextValue>(
    () => ({
      isImpersonating: payload !== null,
      isSupportActive: effectiveSession !== null,
      sessionId: effectiveSession?.sessionId ?? null,
      adminName: effectiveSession?.adminName ?? null,
      reason: effectiveSession?.reason ?? null,
      ticketId: effectiveSession?.ticketId ?? null,
      expiresAt: effectiveSession?.expiresAt ?? null,
      merchantId: payload?.merchant_id ?? null,
      activeSession: effectiveSession,
      recentActivities: activities,
      pendingRequest,
      drivingMode: coBrowse.drivingMode,
      isDriver: coBrowse.isDriver,
      setDrivingMode: coBrowse.setDrivingMode,
      approvePendingRequest,
      denyPendingRequest,
      endSession,
      refresh,
    }),
    [
      payload,
      effectiveSession,
      activities,
      pendingRequest,
      coBrowse.drivingMode,
      coBrowse.isDriver,
      coBrowse.setDrivingMode,
      approvePendingRequest,
      denyPendingRequest,
      endSession,
      refresh,
    ],
  );

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
      <SupportApprovalModal
        request={pendingRequest}
        onApprove={approvePendingRequest}
        onDeny={denyPendingRequest}
      />
      {effectiveSession && (
        <CoBrowseOverlay
          remoteCursor={coBrowse.remoteCursor}
          remoteClicks={coBrowse.remoteClicks}
          remoteFocus={coBrowse.remoteFocus}
        />
      )}
    </ImpersonationContext.Provider>
  );
}

// ── hook ────────────────────────────────────────────────────────────────────

export function useImpersonation(): ImpersonationContextValue {
  return useContext(ImpersonationContext);
}
