"use client";

import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api";
import { inr } from "@/lib/format";
import type { Plan, PaymentMethod, AddPaymentMethodOut, SubscribeResult } from "@/lib/types";
import type { BillingTerm } from "@/lib/corePlans";
import {
  billingCycleShortLabel,
  planChargeDisplay,
} from "@/lib/planPricing";
import {
  confirmStubMandateIfNeeded,
  mapBillingTermToApi,
  pollSubscriptionUntilMandateReady,
  redirectToSubscriptionAuth,
} from "@/lib/onboardingBilling";
import {
  stashSubscriptionCheckoutContext,
  type SubscriptionCheckoutContext,
} from "@/lib/billingCheckout";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Sparkles,
  Info,
  RefreshCw,
  Zap,
} from "lucide-react";

// Window.Razorpay type is declared globally in billing/pay/page.tsx

interface Props {
  plan: Plan;
  billingCycle?: BillingTerm;
  couponCode?: string;
  onSuccess: (subscription: SubscribeResult) => void;
  onBack: () => void;
}

const ONBOARDING_RETURN = "/onboarding?billing=done";

const checkoutContextForPlan = (
  plan: Plan,
  billingCycle: BillingTerm,
): SubscriptionCheckoutContext => ({
  planLabel: plan.name,
  gstInclusiveInr: planChargeDisplay(plan, billingCycle).gstInclusivePeriodTotal,
  billingPeriodLabel:
    billingCycle === "annual"
      ? "every year"
      : billingCycle === "semiannual"
        ? "every 6 months"
        : billingCycle === "quarterly"
          ? "every 3 months"
          : "every month",
  trialDays: 7,
});

export function AutopaySetupCard({ plan, billingCycle = "monthly", couponCode, onSuccess, onBack }: Props) {
  const [stage, setStage] = useState<
    "idle" | "authorizing" | "confirming" | "activating" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMethod, setSavedMethod] = useState<PaymentMethod | null>(null);

  const charge = planChargeDisplay(plan, billingCycle);
  const billingCycleLabel = billingCycleShortLabel(billingCycle);
  const afterTrialLine =
    charge.cycle === "monthly"
      ? `${inr(charge.exGstPerMonth)} / month (ex GST)`
      : `${inr(charge.exGstPeriodTotal)} / ${billingCycleLabel} (ex GST)`;

  const finalizeTrialActivation = useCallback(
    async (sub: SubscribeResult, usedStubShortcut: boolean) => {
      if (usedStubShortcut) {
        await confirmStubMandateIfNeeded();
        await pollSubscriptionUntilMandateReady();
        setStage("success");
        setTimeout(() => onSuccess(sub), 800);
        return;
      }
      stashSubscriptionCheckoutContext(checkoutContextForPlan(plan, billingCycle));
      await redirectToSubscriptionAuth(sub, ONBOARDING_RETURN);
    },
    [onSuccess, plan, billingCycle],
  );

  const handleStartAutopay = useCallback(async () => {
    setErrorMessage(null);
    setStage("authorizing");

    try {
      const subPayload: Record<string, string> = {
        plan_slug: plan.slug,
        billing_cycle: mapBillingTermToApi(billingCycle),
      };
      if (couponCode?.trim()) {
        subPayload.coupon_code = couponCode.trim();
      }

      setStage("activating");
      const sub = await apiRequest<SubscribeResult>("/v1/billing/subscribe", {
        method: "POST",
        body: subPayload,
      });

      await finalizeTrialActivation(sub, false);
    } catch (err) {
      setStage("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Could not start autopay checkout. Please try again.",
      );
    }
  }, [plan, billingCycle, couponCode, finalizeTrialActivation]);

  const handleAuthorizeTestCard = useCallback(async () => {
    setErrorMessage(null);
    setStage("confirming");
    try {
      const attachRes = await apiRequest<{ data?: AddPaymentMethodOut } | AddPaymentMethodOut>(
        "/v1/billing/payment-methods",
        {
          method: "POST",
          body: {
            razorpay_token_id: `tok_dev_${Math.random().toString(36).substring(2, 10)}`,
            display_last4: "4242",
            display_network: "Visa",
            display_bank: "HDFC Bank",
            display_label: "Visa •••• 4242 (Dev Test)",
            make_default: true,
          },
        }
      );

      const attachData =
        (attachRes as { data?: AddPaymentMethodOut })?.data || (attachRes as AddPaymentMethodOut);
      if (attachData.payment_method) {
        setSavedMethod(attachData.payment_method);
      }

      setStage("activating");
      const subPayload: Record<string, string> = {
        plan_slug: plan.slug,
        billing_cycle: mapBillingTermToApi(billingCycle),
      };
      if (couponCode?.trim()) {
        subPayload.coupon_code = couponCode.trim();
      }

      const sub = await apiRequest<SubscribeResult>("/v1/billing/subscribe", {
        method: "POST",
        body: subPayload,
      });

      await finalizeTrialActivation(sub, true);
    } catch (err) {
      setStage("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to attach test payment method."
      );
    }
  }, [plan, billingCycle, couponCode, finalizeTrialActivation]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={stage === "authorizing" || stage === "confirming" || stage === "activating"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Plan</span>
        </button>
        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Mandatory Trial Autopay</span>
        </span>
      </div>

      {/* Plan & Trial Summary Card */}
      <div className="bg-surface-container-lowest border border-border/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-on-surface font-display">{plan.name} Plan</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase">
                7-Day Free Trial
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Full access to AI agents, knowledge base, and autonomous workflows.
            </p>
          </div>
          <div className="text-right sm:text-right">
            <div className="text-xs text-on-surface-variant line-through">
              {charge.exGstPeriodTotal > 0 ? afterTrialLine : "Free"}
            </div>
            <div className="text-xl font-bold text-emerald-600 font-display">₹0 Today</div>
          </div>
        </div>

        {/* Pricing / Trial Terms Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-surface-container-low/60 rounded-xl border border-border/60">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
              Today&apos;s Charge
            </span>
            <p className="text-sm font-bold text-on-surface mt-0.5">₹0.00</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Trial starts immediately upon card authentication.
            </p>
          </div>
          <div className="p-3 bg-surface-container-low/60 rounded-xl border border-border/60">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
              After 7 Days
            </span>
            <p className="text-sm font-bold text-on-surface mt-0.5">
              {charge.exGstPeriodTotal > 0 ? afterTrialLine : "Free"}
            </p>
            {charge.exGstPeriodTotal > 0 ? (
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                + 18% GST at payment ({inr(charge.gstInclusivePeriodTotal)} incl. GST per billing period)
              </p>
            ) : null}
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Renews automatically. Manage cards in dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Autopay Information & Guarantee Disclosure */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2.5">
        <div className="flex items-center gap-2 text-primary font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>Why Autopay is required for your free trial</span>
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Frosty uses Razorpay subscription autopay. During your 7-day trial, Razorpay charges a
          refundable ₹5 to verify your card or UPI — not your plan price. Your plan (incl. GST) is
          charged automatically when the trial ends.
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-on-surface-variant/80 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>256-Bit Bank-Grade Encryption</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>RBI e-Mandate Compliant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>24/7 Card Management</span>
          </div>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {stage === "error" && errorMessage && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs space-y-2 flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold">Card Authorization Incomplete</p>
            <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Confirmation State */}
      {stage === "success" && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-center space-y-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h4 className="text-base font-bold font-display">Autopay Activated Successfully!</h4>
          <p className="text-xs text-emerald-700">
            Your 7-Day Free Trial for the {plan.name} tier is now live. Advancing to setup your agent…
          </p>
        </div>
      )}

      {/* Action Button & Loading States */}
      {stage !== "success" && (
        <div className="space-y-3 pt-2">
          <button
            type="button"
            disabled={stage === "authorizing" || stage === "confirming" || stage === "activating"}
            onClick={() => void handleStartAutopay()}
            className="w-full py-3.5 px-5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            {stage === "authorizing" || stage === "activating" ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Opening Razorpay checkout…</span>
              </>
            ) : stage === "confirming" ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Confirming test card…</span>
              </>
            ) : stage === "error" ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Retry autopay setup</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Set Up Autopay & Start 7-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {stage === "error" && process.env.NODE_ENV === "development" && (
            <button
              type="button"
              onClick={() => void handleAuthorizeTestCard()}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 text-xs font-semibold hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-700" />
              <span>⚡ Authorize with Test Card (Dev / Test Mode)</span>
            </button>
          )}

          <p className="text-[11px] text-center text-on-surface-variant">
            By setting up autopay, you authorize Frostrek to initiate recurring charges at the end of
            your 7-day trial in accordance with the selected plan terms.
          </p>
        </div>
      )}
    </div>
  );
}
