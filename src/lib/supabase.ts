"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_CONFIGURED, SUPABASE_URL } from "./constants";

/**
 * One browser client for the whole app.
 *
 * Session is stored in cookies (via `@supabase/ssr`), not localStorage. Cookies are
 * SameSite=Lax and host-only, so they are not sent to the FastAPI origin. They are
 * still JavaScript-readable (true httpOnly isolation requires a BFF). The primary
 * XSS mitigation layer is the strict Content-Security-Policy in next.config.ts,
 * which blocks inline script injection from untrusted origins.
 *
 * Lazily constructed so a build with no Supabase env still compiles and renders the
 * login screen's configuration error instead of throwing during hydration.
 */
let client: SupabaseClient | null = null;

export const supabase = (): SupabaseClient => {
  if (!SUPABASE_CONFIGURED) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  if (client === null) {
    client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookieOptions: {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
};
