import { APP_URL } from "@/lib/constants";

const BLOCKED_HOSTS = new Set(["0.0.0.0"]);

const isUsableOrigin = (origin: string): boolean => {
  try {
    return !BLOCKED_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
};

/** Public dashboard origin for auth redirects and Razorpay callbacks.
 * Prefers build-time NEXT_PUBLIC_APP_URL so Docker bind (0.0.0.0) never leaks into checkout. */
export const getPublicAppOrigin = (): string => {
  const fromEnv = (APP_URL || "").replace(/\/+$/, "");
  if (fromEnv && isUsableOrigin(fromEnv)) return fromEnv;

  if (typeof window !== "undefined") {
    const live = window.location.origin.replace(/\/+$/, "");
    if (isUsableOrigin(live)) return live;
  }

  return "http://localhost:3000";
};

export const billingRazorpayReturnUrl = (returnTo?: string): string => {
  const base = `${getPublicAppOrigin()}/billing/razorpay-return`;
  if (!returnTo?.trim()) return base;
  return `${base}?return_to=${encodeURIComponent(returnTo.trim())}`;
};
