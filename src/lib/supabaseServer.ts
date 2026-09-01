import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_CONFIGURED, SUPABASE_URL } from "./constants";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

/** Paths reachable without a valid Supabase session (marketing site + auth flows). */
const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/status",
  "/acceptable-use",
  "/experience",
  "/accessibility",
  "/cookies",
  "/invite",
  "/onboarding",
  "/billing/razorpay-return",
  "/billing/pay",
];

const FROSTY_AUTH_COOKIE = "frosty_auth_token";

const hasFrostySessionCookie = (request: NextRequest): boolean => {
  const raw = request.cookies.get(FROSTY_AUTH_COOKIE)?.value;
  return Boolean(raw?.trim());
};

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Refresh the auth cookies on every matched request so a stale access token is
 * rotated before a client `getSession()` reads it.
 *
 * Cookie storage is SameSite=Lax and host-only. The cookies are still readable
 * by JavaScript (the dashboard sends the access token as `Authorization: Bearer`
 * to a cross-origin API, so a true httpOnly-only refresh would need a BFF).
 * XSS remains the residual threat; this is not httpOnly isolation.
 */
export const updateSession = async (request: NextRequest): Promise<NextResponse> => {
  const pathname = request.nextUrl.pathname;

  // Reverse-proxy paths to FastAPI / demo backends — must stay reachable without a session
  // (e.g. POST /v1/iam/login is called before any auth cookie exists).
  // Public marketing API routes (pricing, contact, schedule) are read from the landing page
  // before login — do not redirect them to /login or fetch() receives HTML and JSON parse fails.
  if (
    pathname.startsWith("/api-proxy")
    || pathname.startsWith("/demo-api")
    || pathname.startsWith("/api/pricing-data")
    || pathname.startsWith("/api/contact")
    || pathname.startsWith("/api/schedule")
  ) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  if (!SUPABASE_CONFIGURED) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: CookieToSet[], headers: Record<string, string>) => {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const { error } = await supabase.auth.getUser();

  // Frosty IAM JWT (email OTP signup) lives in frosty_auth_token — not Supabase cookies.
  // Razorpay return and other top-level navigations must not sign the merchant out mid-flow.
  if (error && hasFrostySessionCookie(request)) {
    return response;
  }

  // If the refresh token is invalid/expired, clear stale auth cookies and
  // redirect to login — but only when the user is NOT already on a public page
  // (avoids redirect loops).
  if (error) {
    const pathname = request.nextUrl.pathname;
    if (!isPublicPath(pathname) && !pathname.startsWith("/(marketing)")) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      const redirectResponse = NextResponse.redirect(loginUrl);

      // Remove every Supabase auth cookie so the next request starts clean
      request.cookies.getAll().forEach(({ name }) => {
        if (name.startsWith("sb-")) {
          redirectResponse.cookies.delete(name);
        }
      });

      return redirectResponse;
    }
  }

  return response;
};
