/** Environment constants. All three are read at build time by Next (NEXT_PUBLIC_*). */

/**
 * Base URL for API requests.
 *
 * Browser-side: uses the Next.js reverse proxy (/api-proxy/*) so requests are
 * same-origin (localhost:3000 → localhost:3000). This eliminates cross-origin
 * fetch failures caused by Chrome's CORS preflight / Private Network Access
 * checks. The proxy in next.config.ts forwards to NEXT_PUBLIC_API_URL.
 *
 * Server-side (SSR): hits the API directly using the absolute URL, because the
 * proxy only runs in the browser.
 *
 * Production: set NEXT_PUBLIC_API_URL to the absolute API origin (e.g.
 * https://api.frostrek.ai) — the proxy destination updates automatically.
 */
export const API_URL =
  typeof window !== "undefined"
    ? "/api-proxy"
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Merchant sign-in goes through Supabase Auth, exactly as staff sign-in does.
 *
 * ⚠️ THIS IS THE ONE PLACE THE PORT COULD NOT FOLLOW THE PARALLEL BUILD AT ALL. Theirs posts an
 * email and password to its own `/v1/auth/login`, gets back an HS256 token **carrying
 * `merchant_id`**, and switches tenants with an `X-Merchant-Id` header. Ours refuses `merchant_id`
 * as a claim on purpose (`app/core/security.py`) and resolves the tenant from
 * `tenant_admin.memberships` on every request. So there is no login endpoint to call, no password
 * for this app to handle, and no header that selects a merchant — see `lib/nav.ts` on the switcher.
 */
export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Where the widget's embed snippet points. Only the widget screen reads it. */
export const WIDGET_HOST =
  process.env.NEXT_PUBLIC_WIDGET_HOST || "http://localhost:5173";

/**
 * Public origin of this dashboard (no trailing slash). Baked into the client bundle at build time
 * for deployed environments. Used for Supabase auth redirects (password reset) so the email link
 * targets testing/staging/prod even when Supabase's Site URL is still localhost from early setup.
 * Falls back to `window.location.origin` in the browser when unset (local dev).
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";
