/**
 * Client-side impersonation session store (Prompt 7 — true token-based impersonation).
 *
 * Replaces the old session-ID-only approach with a full token payload. The impersonation
 * token is a short-lived JWT issued by the backend with scope=impersonation. When present
 * it is sent as `Authorization: Bearer <token>` INSTEAD of the normal Supabase token,
 * because the backend's auth middleware recognises it by the scope claim and resolves
 * the merchant context from the embedded session_id.
 *
 * Storage: sessionStorage only — per-tab, dies with the window, never leaks to other tabs.
 *
 * See: apps/api/app/core/security.py :: decode_principal (scope == "impersonation")
 */

const KEY = "frosty.impersonation_v2";

export type ImpersonationPayload = {
  /** The short-lived JWT with scope=impersonation. Sent as Authorization: Bearer. */
  token: string;
  session_id: string;
  merchant_id: string;
  admin_name: string | null;
  reason: string | null;
  ticket_id: string | null;
  expires_at: string;
  /** ISO timestamp when this was stored — used for local expiry check. */
  stored_at: string;
};

// ── persistence ──────────────────────────────────────────────────────────────

export function storeImpersonation(payload: ImpersonationPayload): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(payload));
}

export function loadImpersonation(): ImpersonationPayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as ImpersonationPayload;
    // Local expiry guard — server will also reject, but this avoids a round-trip.
    if (p.expires_at && new Date(p.expires_at) < new Date()) {
      clearImpersonation();
      return null;
    }
    return p;
  } catch {
    clearImpersonation();
    return null;
  }
}

export function clearImpersonation(): void {
  if (typeof window !== "undefined") sessionStorage.removeItem(KEY);
}

export function isImpersonating(): boolean {
  return loadImpersonation() !== null;
}

// ── API header helpers ───────────────────────────────────────────────────────

/**
 * Returns the Authorization header value when an impersonation session is active.
 * `api.ts` calls this and, when truthy, substitutes it for the normal Supabase token.
 *
 * We also keep X-Impersonation-Session for server-side logging/tracing.
 */
export function impersonationHeaders(): Record<string, string> {
  const p = loadImpersonation();
  if (!p) return {};
  return {
    "Authorization": `Bearer ${p.token}`,
    "X-Impersonation-Session": p.session_id,
  };
}

// ── back-compat shims (old header-only approach, kept for the action page) ───

/** @deprecated Use impersonationHeaders() instead. */
export function impersonationHeader(): Record<string, string> {
  return impersonationHeaders();
}

/** @deprecated Use loadImpersonation()?.session_id. */
export function currentSession(): string | null {
  return loadImpersonation()?.session_id ?? null;
}

/** @deprecated Use clearImpersonation(). */
export function clearSession(): void {
  clearImpersonation();
}

/**
 * @deprecated Used by the old `?impersonate=<id>` entry point.
 * The new flow uses /impersonate/callback?token=... — this is kept only so
 * workspace.tsx compiles without changes.
 */
export function captureFromUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const id = url.searchParams.get("impersonate");
  if (!id) return;
  // Old-style session-id flow — just strip it from the URL; the new flow
  // stores a full payload via storeImpersonation() in the callback page.
  url.searchParams.delete("impersonate");
  window.history.replaceState({}, "", url.toString());
}

// ── Activity tracking helper ────────────────────────────────────────────────

export function formatPageLabel(path: string): string {
  const clean = (path.split("?")[0] || "").replace(/^\//, "");
  if (!clean || clean === "home") return "Overview page";
  const parts = clean.split("/");
  return parts
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " ") : ""))
    .filter(Boolean)
    .join(" → ") + " page";
}

export async function recordPageViewActivity(path: string, label?: string): Promise<void> {
  const p = loadImpersonation();
  if (!p) return;
  const pageLabel = label || `Viewed ${formatPageLabel(path)}`;

  try {
    const { API_URL } = await import("./constants");
    await fetch(`${API_URL}/v1/impersonation/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${p.token}`,
        "X-Impersonation-Session": p.session_id,
      },
      body: JSON.stringify({
        action: "viewed_page",
        entity: "page",
        path,
        label: pageLabel,
      }),
    });
  } catch {
    // Non-critical background telemetry; fail silently
  }
}
