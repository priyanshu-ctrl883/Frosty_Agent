/**
 * Canonical invite URL builder — the SINGLE source of truth for the accept-link shape.
 *
 * ⚠️ Task 1 fix: the accept page at `/invite` reads `useSearchParams().get('token')`, so the
 * URL MUST use a query param (?token=), not a path param (/invite/<token>). A path-param URL
 * produces a 404 because there is no [token] dynamic route in Next.js.
 *
 * Import this helper everywhere an invite URL is constructed (the email backend already uses
 * `?token=` directly; this helper ensures the dashboard copy-link button matches exactly).
 */
export function buildInviteUrl(base: string, token: string): string {
  return `${base.replace(/\/$/, "")}/invite?token=${encodeURIComponent(token)}`;
}
