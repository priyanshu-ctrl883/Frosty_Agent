import { NextRequest, NextResponse } from "next/server";

const BLOCKED_HOSTS = new Set(["0.0.0.0"]);

const canonicalOrigin = (): string | null => {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
  if (!raw.startsWith("http")) return null;
  try {
    return BLOCKED_HOSTS.has(new URL(raw).hostname) ? null : raw;
  } catch {
    return null;
  }
};

const safeReturnPath = (raw: string | null): string | null => {
  if (!raw?.trim()) return null;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
};

/** Razorpay hosted checkout POSTs or GETs here; send the merchant back to app UI. */
const redirectAfterCheckout = (req: NextRequest) => {
  const returnTo = safeReturnPath(req.nextUrl.searchParams.get("return_to"));
  const origin = canonicalOrigin();
  const url = origin
    ? new URL(returnTo ?? "/billing?checkout=done", origin)
    : (() => {
        const next = req.nextUrl.clone();
        if (returnTo) {
          const parsed = new URL(returnTo, "http://local.invalid");
          next.pathname = parsed.pathname;
          next.search = parsed.search;
        } else {
          next.pathname = "/billing";
          next.search = "checkout=done";
        }
        next.hash = "";
        if (BLOCKED_HOSTS.has(next.hostname)) {
          next.hostname = "localhost";
          next.protocol = "http:";
          next.port = "3000";
        }
        return next;
      })();
  if (!returnTo) {
    url.searchParams.set("checkout", "done");
  }
  return NextResponse.redirect(url, 303);
};

export const GET = (req: NextRequest) => redirectAfterCheckout(req);
export const POST = (req: NextRequest) => redirectAfterCheckout(req);
