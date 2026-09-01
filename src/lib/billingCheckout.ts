"use client";

import { apiRequest } from "@/lib/api";
import type { SubscribeResult } from "@/lib/types";
import type { SetupPath } from "@/components/billing/SetupChoice";

const ASSISTED_URL_KEY = "frosty_pending_assisted_setup_url";
const PROCESSING_KEY = "frosty_billing_processing";
const SUBSCRIPTION_CHECKOUT_CONTEXT_KEY = "frosty_subscription_checkout_context";

/** Shown on /billing/pay — Razorpay charges ₹5 now when billing is deferred (7-day trial). */
export type SubscriptionCheckoutContext = {
  planLabel: string;
  gstInclusiveInr: number;
  billingPeriodLabel: string;
  trialDays: number;
};

export const MANDATE_AUTH_INR = 5;

export const stashSubscriptionCheckoutContext = (ctx: SubscriptionCheckoutContext): void => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SUBSCRIPTION_CHECKOUT_CONTEXT_KEY, JSON.stringify(ctx));
};

export const peekSubscriptionCheckoutContext = (): SubscriptionCheckoutContext | null => {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SUBSCRIPTION_CHECKOUT_CONTEXT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SubscriptionCheckoutContext;
    if (
      typeof parsed.planLabel === "string" &&
      Number.isFinite(parsed.gstInclusiveInr) &&
      typeof parsed.billingPeriodLabel === "string" &&
      Number.isFinite(parsed.trialDays)
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
};

export const clearSubscriptionCheckoutContext = (): void => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SUBSCRIPTION_CHECKOUT_CONTEXT_KEY);
};

export type CouponPreview = {
  code: string;
  discount_type: string;
  discount_value: number;
};

export function discountedAmount(
  baseInr: number,
  coupon: CouponPreview | null | undefined,
): number {
  if (!coupon || !Number.isFinite(baseInr)) return baseInr;
  if (coupon.discount_type === "percentage") {
    return Math.max(0, baseInr * (1 - coupon.discount_value / 100));
  }
  if (coupon.discount_type === "fixed_amount") {
    return Math.max(0, baseInr - coupon.discount_value);
  }
  return baseInr;
}

export function markBillingProcessing() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PROCESSING_KEY, String(Date.now()));
}

export function clearBillingProcessing() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PROCESSING_KEY);
}

export function isBillingProcessing(maxAgeMs = 15 * 60 * 1000): boolean {
  if (typeof window === "undefined") return false;
  const raw = sessionStorage.getItem(PROCESSING_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts) || Date.now() - ts > maxAgeMs) {
    sessionStorage.removeItem(PROCESSING_KEY);
    return false;
  }
  return true;
}

export function stashAssistedSetupUrl(url: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ASSISTED_URL_KEY, url);
}

export function takeAssistedSetupUrl(): string | null {
  if (typeof window === "undefined") return null;
  const url = sessionStorage.getItem(ASSISTED_URL_KEY);
  if (url) sessionStorage.removeItem(ASSISTED_URL_KEY);
  return url;
}

export function peekAssistedSetupUrl(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ASSISTED_URL_KEY);
}

/** Same-tab payment link (top-up / add-on). Subscriptions use openSubscriptionCheckout. */
export const openRazorpayCheckout = (url: string): void => {
  window.location.assign(url);
};

export const openSubscriptionCheckout = (
  subscriptionId: string,
  context?: SubscriptionCheckoutContext,
): void => {
  if (context) stashSubscriptionCheckoutContext(context);
  window.location.assign(`/billing/pay?subscription_id=${encodeURIComponent(subscriptionId)}`);
};

/** Subscribe, optionally request assisted setup, open plan checkout. */
export async function subscribeWithSetupChoice(opts: {
  planSlug: string;
  billingCycle?: "monthly" | "quarterly" | "semiannual" | "semi_annual" | "annual";
  couponCode?: string;
  setupPath: SetupPath | null;
  checkoutContext?: SubscriptionCheckoutContext;
  openCheckout?: (url: string) => void;
}): Promise<{ subscribe: SubscribeResult; assistedUrl: string | null }> {
  const open = opts.openCheckout ?? openRazorpayCheckout;

  const cycleMapped =
    opts.billingCycle === "semiannual" ? "semi_annual" : (opts.billingCycle || "monthly");

  const payload: Record<string, string> = {
    plan_slug: opts.planSlug,
    billing_cycle: cycleMapped,
  };
  if (opts.couponCode?.trim()) payload.coupon_code = opts.couponCode.trim();

  const subscribe = await apiRequest<SubscribeResult>("/v1/billing/subscribe", {
    method: "POST",
    body: payload,
  });

  let assistedUrl: string | null = null;
  if (opts.setupPath === "assisted") {
    try {
      const assisted = await apiRequest<{
        short_url: string;
        already_requested: boolean;
      }>("/v1/billing/setup-fee/request-assisted", { method: "POST" });
      assistedUrl = assisted.short_url || null;
      if (assistedUrl) stashAssistedSetupUrl(assistedUrl);
    } catch {
      assistedUrl = null;
    }
  }

  markBillingProcessing();
  if (subscribe.razorpay_subscription_id) {
    openSubscriptionCheckout(subscribe.razorpay_subscription_id, opts.checkoutContext);
  } else if (subscribe.short_url) {
    open(subscribe.short_url);
  }
  return { subscribe, assistedUrl };
}
