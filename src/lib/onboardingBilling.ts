import { apiRequest } from "@/lib/api";
import type { SubscribeResult } from "@/lib/types";
import type { BillingTerm } from "@/lib/corePlans";
import { billingRazorpayReturnUrl } from "@/lib/appOrigin";
import { markBillingProcessing } from "@/lib/billingCheckout";
import { refreshFrostySessionCookie } from "@/lib/session";

export type SubscriptionStatus = {
  plan_slug?: string | null;
  status?: string;
  billing_cycle?: string;
  autopay_state?: string | null;
  razorpay_subscription_id?: string | null;
};

const MANDATE_READY = new Set(["mandate_active", "active"]);

export const mapBillingTermToApi = (
  cycle: BillingTerm,
): "monthly" | "quarterly" | "semi_annual" | "annual" => {
  if (cycle === "semiannual") return "semi_annual";
  return cycle;
};

export const isMandateReady = (sub: SubscriptionStatus | null | undefined): boolean =>
  Boolean(sub?.autopay_state && MANDATE_READY.has(sub.autopay_state));

export const isOnFreeSignupTrial = (sub: SubscriptionStatus | null | undefined): boolean =>
  !sub?.plan_slug || sub.plan_slug === "free" || !sub.razorpay_subscription_id;

export type AutopayBadge = "active" | "pending" | "not_required";

/** UI badge for Payment Methods section — must match backend autopay_state, not trialing alone. */
export const autopayBadgeState = (
  sub: SubscriptionStatus | null | undefined,
  paymentMethodCount: number,
): AutopayBadge => {
  if (isMandateReady(sub)) return "active";
  if (
    sub?.autopay_state === "pending_mandate" ||
    sub?.status === "pending_subscribe" ||
    (sub?.plan_slug && sub.plan_slug !== "free" && sub.status === "trialing")
  ) {
    return "pending";
  }
  if (isOnFreeSignupTrial(sub) && paymentMethodCount === 0) return "not_required";
  return paymentMethodCount > 0 ? "active" : "not_required";
};

export const trialAutopayStatusLine = (sub: SubscriptionStatus | null | undefined): string => {
  if (isOnFreeSignupTrial(sub)) {
    return "7-Day Free Trial active · Choose a plan and set up autopay before it expires";
  }
  if (isMandateReady(sub)) {
    return "7-Day Free Trial active · Autopay configured";
  }
  if (sub?.autopay_state === "pending_mandate" || sub?.status === "pending_subscribe") {
    return "7-Day Free Trial · Complete autopay setup to activate your plan";
  }
  return "7-Day Free Trial active";
};

export const pollSubscriptionUntilMandateReady = async (
  opts: { maxAttempts?: number; intervalMs?: number } = {},
): Promise<SubscriptionStatus> => {
  const maxAttempts = opts.maxAttempts ?? 40;
  const intervalMs = opts.intervalMs ?? 1500;
  let last: SubscriptionStatus | null = null;

  for (let i = 0; i < maxAttempts; i += 1) {
    const res = await apiRequest<{ data?: SubscriptionStatus } | SubscriptionStatus>(
      "/v1/billing/subscription",
    );
    const sub = (res as { data?: SubscriptionStatus })?.data ?? (res as SubscriptionStatus);
    last = sub;
    if (isMandateReady(sub)) return sub;
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(
    last?.autopay_state
      ? `Payment setup still pending (${last.autopay_state}). Complete Razorpay checkout or retry.`
      : "Could not confirm autopay mandate. Please retry from Billing.",
  );
};

/** Redirect to hosted subscription auth (production Razorpay path). */
export const redirectToSubscriptionAuth = async (
  subscribe: SubscribeResult,
  returnTo: string,
): Promise<void> => {
  if (!subscribe.razorpay_subscription_id) {
    throw new Error("Missing Razorpay subscription id.");
  }
  await refreshFrostySessionCookie();
  markBillingProcessing();
  const returnPath = `/billing/pay?subscription_id=${encodeURIComponent(subscribe.razorpay_subscription_id)}&return_to=${encodeURIComponent(returnTo)}`;
  window.location.assign(returnPath);
};

export const openSubscriptionAuthInModal = async (
  subscriptionId: string,
  returnTo: string,
): Promise<void> => {
  const { key_id } = await apiRequest<{ key_id: string }>("/v1/billing/razorpay-key");
  await new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const el = document.createElement("script");
    el.src = "https://checkout.razorpay.com/v1/checkout.js";
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Could not load Razorpay Checkout"));
    document.body.appendChild(el);
  });
  const Checkout = window.Razorpay;
  if (!Checkout) throw new Error("Razorpay Checkout did not load");

  markBillingProcessing();
  return new Promise((resolve, reject) => {
    const rzp = new Checkout({
      key: key_id,
      subscription_id: subscriptionId,
      name: "Frosty Agent",
      description: "Confirm autopay for your trial",
      callback_url: billingRazorpayReturnUrl(returnTo),
      redirect: true,
      theme: { color: "#0396A6" },
      modal: {
        ondismiss: () => reject(new Error("Razorpay checkout was closed before mandate confirmation.")),
      },
    });
    try {
      rzp.open();
      resolve();
    } catch (err) {
      reject(err instanceof Error ? err : new Error("Could not open Razorpay checkout"));
    }
  });
};

export const confirmStubMandateIfNeeded = async (): Promise<void> => {
  await apiRequest("/v1/billing/subscription/confirm-mandate-stub", { method: "POST" });
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}
