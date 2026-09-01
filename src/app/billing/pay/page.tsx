"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ErrorBox } from "@/components/ui/PageState";
import { apiRequest } from "@/lib/api";
import { billingRazorpayReturnUrl } from "@/lib/appOrigin";
import { refreshFrostySessionCookie } from "@/lib/session";
import {
  MANDATE_AUTH_INR,
  peekSubscriptionCheckoutContext,
  type SubscriptionCheckoutContext,
} from "@/lib/billingCheckout";
import { inr } from "@/lib/format";
import styles from "./pay.module.css";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const loadCheckoutScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
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

const formatCheckoutSummary = (ctx: SubscriptionCheckoutContext | null): string => {
  if (!ctx) {
    return `Autopay verification — refundable ₹${MANDATE_AUTH_INR} now, plan charge after your free trial.`;
  }
  return `${ctx.planLabel} — refundable ₹${MANDATE_AUTH_INR} verification now`;
};

export default function BillingPayPage() {
  const params = useSearchParams();
  const subscriptionId = params.get("subscription_id")?.trim() || "";
  const returnTo = params.get("return_to")?.trim() || "";
  const [error, setError] = useState<string | null>(null);
  const [checkoutContext] = useState<SubscriptionCheckoutContext | null>(() =>
    peekSubscriptionCheckoutContext(),
  );
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!subscriptionId) {
      setError("Missing subscription. Go back to Billing and start checkout again.");
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        setOpening(true);
        await refreshFrostySessionCookie();
        const { key_id } = await apiRequest<{ key_id: string }>("/v1/billing/razorpay-key");
        await loadCheckoutScript();
        if (cancelled) return;
        const Checkout = window.Razorpay;
        if (!Checkout) throw new Error("Razorpay Checkout did not load");
        const rzp = new Checkout({
          key: key_id,
          subscription_id: subscriptionId,
          name: "Frosty",
          description: formatCheckoutSummary(checkoutContext),
          callback_url: billingRazorpayReturnUrl(returnTo || undefined),
          redirect: true,
          theme: { color: "#111827" },
        });
        rzp.open();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not open payment");
        }
      } finally {
        if (!cancelled) setOpening(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [subscriptionId, returnTo, checkoutContext]);

  if (error) {
    return (
      <AppShell title="Complete payment">
        <ErrorBox message={error} />
      </AppShell>
    );
  }

  const ctx = checkoutContext;
  const trialDays = ctx?.trialDays ?? 7;

  return (
    <AppShell title="Complete autopay setup">
      <div className={styles.wrap}>
        <div className={styles.card}>
          <p className={styles.kicker}>Secure checkout · Razorpay</p>
          <h1 className={styles.title}>Verify autopay for your plan</h1>

          <div className={styles.amountRow}>
            <span className={styles.amountLabel}>Due now</span>
            <span className={styles.amountValue}>{inr(MANDATE_AUTH_INR)}</span>
          </div>
          <p className={styles.refundNote}>
            This is a <strong>refundable ₹{MANDATE_AUTH_INR} verification charge</strong> from Razorpay
            to confirm your card or UPI for autopay. It is not your plan price and is automatically
            refunded after verification.
          </p>

          {ctx ? (
            <div className={styles.futureCharge}>
              <p className={styles.futureLabel}>After your {trialDays}-day trial</p>
              <p className={styles.futureAmount}>
                {inr(ctx.gstInclusiveInr)} incl. 18% GST, billed {ctx.billingPeriodLabel}
              </p>
              <p className={styles.futurePlan}>{ctx.planLabel} plan</p>
            </div>
          ) : (
            <p className={styles.genericFuture}>
              Your plan amount (incl. GST) is charged automatically when your {trialDays}-day trial
              ends — not during this ₹{MANDATE_AUTH_INR} verification step.
            </p>
          )}

          <p className={styles.statusLine}>
            {opening ? "Opening Razorpay checkout…" : "If checkout did not open, refresh this page."}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
