"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ErrorBox } from "@/components/ui/PageState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ApiClientError, apiRequest } from "@/lib/api";
import { inr } from "@/lib/format";
import type { Plan, Subscription } from "@/lib/types";

import { useWorkspace } from "@/lib/workspace";
import { completeOnboardingStep } from "@/lib/onboarding";
import { OnboardingStepBar } from "@/components/onboarding/OnboardingStepBar";
import { TrialConfirmationModal } from "@/components/billing/TrialConfirmationModal";
import {
  type CouponPreview,
  discountedAmount,
  subscribeWithSetupChoice,
  markBillingProcessing,
  openRazorpayCheckout,
  openSubscriptionCheckout,
} from "@/lib/billingCheckout";
import {
  Check,
  ArrowRight,
  Mail,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Clock,
} from "lucide-react";

import { planChargeDisplay, planOverageRate, type ApiBillingCycle } from "@/lib/planPricing";
import { toCoreBillingTerm } from "@/lib/corePlans";
import { isPendingPayment } from "@/lib/subscriptionCancel";

/** Curated, scannable feature highlights per plan tier */
const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    "1 AI assistant (Website widget)",
    "Up to 500 conversations / mo",
    "Standard knowledge base (10 docs)",
    "Live inbox & handoff",
    "Email support",
  ],
  growth: [
    "3 AI assistants (Website + WhatsApp)",
    "Up to 2,500 conversations / mo",
    "Unlimited knowledge base & URLs",
    "Human agent handoff & team routing",
    "Priority AI response latency",
    "Dedicated onboarding assistance",
  ],
  scale: [
    "Unlimited AI assistants & bots",
    "Up to 10,000 conversations / mo",
    "Multi-channel (Web, WhatsApp, APIs)",
    "Custom AI guardrails & SLAs",
    "Team permissions & audit logs",
    "24/7 Priority support manager",
  ],
  max: [
    "High-volume message processing",
    "Up to 30,000 conversations / mo",
    "Custom LLM fine-tuning & RAG",
    "Dedicated VPS infrastructure",
    "99.9% uptime SLA guarantee",
  ],
  enterprise: [
    "Custom conversation volume",
    "On-premise / private cloud deploy",
    "Custom integrations & ERP sync",
    "Enterprise security & SOC2 compliance",
    "Dedicated Account Executive",
  ],
  free: [
    "Full feature exploration",
    "7-day trial period",
    "Website chatbot & sandbox",
    "Sample knowledge uploads",
  ],
};

const ENTERPRISE_MAIL =
  "mailto:sales@frostrek.com?subject=Frosty%20Agent%20Enterprise%20Plan%20Inquiry";

export default function PlansPage() {
  const ws = useWorkspace();
  const { entitlements, reload } = ws;

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [cycle, setCycle] = useState<ApiBillingCycle>("annual");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Trial confirmation modal state
  const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, sub] = await Promise.all([
        apiRequest<Plan[]>("/v1/billing/plans"),
        apiRequest<Subscription>("/v1/billing/subscription").catch(() => null),
      ]);
      setPlans(list.filter((p) => p.is_active));
      setSubscription(sub);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load plans");
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    void load();
  }, [load]);

  async function applyCoupon() {
    const code = couponCode.trim();
    if (!code) return;
    setCouponError(null);
    try {
      const res = await apiRequest<{
        code: string;
        discount_type: string;
        discount_value: string;
      }>(`/v1/billing/coupons/${encodeURIComponent(code)}`);
      setCoupon({
        code: res.code || code,
        discount_type: res.discount_type,
        discount_value: Number(res.discount_value),
      });
    } catch (err) {
      setCoupon(null);
      setCouponError(err instanceof Error ? err.message : "Invalid coupon");
    }
  }

  async function handlePlanClick(plan: Plan) {
    if (plan.slug === "enterprise" || (Number(plan.price_monthly_inr || 0) === 0 && plan.slug !== "free")) {
      window.location.href = ENTERPRISE_MAIL;
      return;
    }
    setConfirmPlan(plan);
  }

  async function executeSubscription(plan: Plan) {
    setError(null);
    setNotice(null);
    setBusy(true);

    try {
      if (plan.slug === "free") {
        void completeOnboardingStep("select_plan_trial").catch(() => null);
        await reload();
        setConfirmPlan(null);
        window.location.assign("/home");
        return;
      }

      if (isPendingPayment(subscription)) {
        const out = await apiRequest<{
          short_url: string | null;
          razorpay_subscription_id?: string | null;
        }>("/v1/billing/subscription/resume", { method: "POST" });
        markBillingProcessing();
        if (out?.razorpay_subscription_id) {
          openSubscriptionCheckout(out.razorpay_subscription_id);
        } else if (out?.short_url) {
          openRazorpayCheckout(out.short_url);
        }
        return;
      }

      if (subscription && subscription.status !== "cancelled" && subscription.status !== "trialing") {
        const out = await apiRequest<{
          short_url: string | null;
          effective_at: string | null;
          razorpay_subscription_id?: string | null;
        }>("/v1/billing/plan-change", {
          method: "POST",
          body: { plan_slug: plan.slug, billing_cycle: cycle },
        });
        markBillingProcessing();
        void completeOnboardingStep("select_plan_trial").catch(() => null);
        await reload();
        setConfirmPlan(null);
        if (out.effective_at) {
          setNotice(`Plan change scheduled. It takes effect on ${out.effective_at}.`);
        } else if (out.razorpay_subscription_id) {
          openSubscriptionCheckout(out.razorpay_subscription_id);
        } else if (out.short_url) {
          openRazorpayCheckout(out.short_url);
        } else {
          setNotice("Plan updated successfully.");
          window.location.assign("/billing");
        }
        return;
      }

      const { assistedUrl } = await subscribeWithSetupChoice({
        planSlug: plan.slug,
        billingCycle: cycle,
        couponCode: coupon?.code || couponCode,
        setupPath: null,
      });

      markBillingProcessing();
      void completeOnboardingStep("select_plan_trial").catch(() => null);
      await reload();
      setConfirmPlan(null);

      if (assistedUrl) {
        window.location.assign(assistedUrl);
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Could not initialize checkout");
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Select Plan & Start Trial" requires="billing:view">
        <PageSkeleton />
      </AppShell>
    );
  }

  const currentSlug = entitlements?.plan_slug || "";

  // Filter out free placeholder from primary pricing cards
  const displayPlans = plans.filter((p) => p.slug !== "free" && p.slug !== "starter_plus");

  return (
    <AppShell
      title="Select Plan & Start Free Trial"
      subtitle="Start your 7-day free trial on any plan. Cancel anytime before the trial ends with 0 charges."
      requires="billing:view"
    >
      <div className="w-full max-w-6xl mx-auto space-y-6 pb-16">
        {/* Onboarding Step Bar Header */}
        <OnboardingStepBar
          stepKey="select_plan_trial"
          stepTitle="Select plan & start 7-day free trial"
          stepOrder={6}
          nextPath="/home"
          isFinal
        />

        {/* Notices & Errors */}
        {error && <ErrorBox message={error} onRetry={() => void load()} />}
        {notice && (
          <div className="p-4 rounded-2xl bg-[#EAF8F8] border border-[#B8E0E2] text-[#0396A6] text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs text-[#0396A6] font-bold px-2 py-0.5 hover:opacity-75"
            >
              ✕
            </button>
          </div>
        )}

        {/* Value Proposition Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0396A6] via-[#02808E] to-[#026B76] text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 blur-3xl pointer-events-none" />
          <div className="max-w-2xl relative z-10 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold tracking-wide backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>7-Day Full Access Free Trial</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight leading-tight">
              Unlock Autonomous AI Customer Engagement
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
              Choose the right capacity for your business. Autopay is set up securely today so you never experience interruption, but you won&apos;t be charged a single rupee during your 7-day trial.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>No charge today</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>7 days full access</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Cancel anytime in 1-click</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Instant AI deployment</span>
            </div>
          </div>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner">
            <button
              type="button"
              onClick={() => setCycle("annual")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                cycle === "annual"
                  ? "bg-white text-[#0396A6] shadow-sm ring-1 ring-black/5"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-full bg-[#EAF8F8] text-[#0396A6] text-[10px] font-extrabold border border-[#B8E0E2]">
                Save 20%
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                cycle === "monthly"
                  ? "bg-white text-[#0396A6] shadow-sm ring-1 ring-black/5"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Monthly Billing</span>
            </button>
          </div>

          {/* Coupon Code Input */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Promo coupon code"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setCoupon(null);
                setCouponError(null);
              }}
              className="h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0396A6]/20 focus:border-[#0396A6] uppercase tracking-wider"
            />
            <button
              type="button"
              disabled={busy || !couponCode.trim()}
              onClick={() => void applyCoupon()}
              className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>

        {coupon && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Coupon applied: {coupon.code} ({coupon.discount_type === "percentage" ? `${coupon.discount_value}% off` : `${inr(coupon.discount_value)} off`})</span>
          </div>
        )}
        {couponError && (
          <p className="text-xs font-semibold text-rose-600 px-1">{couponError}</p>
        )}

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {displayPlans.map((plan) => {
            const isGrowth = plan.slug === "growth";
            const isCurrent = plan.slug === currentSlug && entitlements?.subscription_status === "active";
            const billingTerm = toCoreBillingTerm(cycle);
            const charge = planChargeDisplay(plan, billingTerm);
            const perMonth = charge.exGstPerMonth;
            const total = charge.exGstPeriodTotal;
            const displayPrice = coupon ? discountedAmount(perMonth, coupon) : perMonth;
            const features = PLAN_FEATURES[plan.slug] || [
              "Multi-turn AI conversations",
              "Knowledge base integration",
              "Website chat widget",
              "Analytics & reporting",
            ];

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all relative ${
                  isGrowth
                    ? "bg-white border-2 border-[#0396A6] shadow-[0_12px_40px_rgba(3,150,166,0.12)] ring-4 ring-[#0396A6]/5"
                    : "bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                }`}
              >
                {/* Most Popular Badge */}
                {isGrowth && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#0396A6] text-white text-[10px] font-extrabold uppercase tracking-widest shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Most Popular</span>
                  </div>
                )}

                <div>
                  {/* Tier Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-xl font-black text-slate-900 font-display">
                      {plan.name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EAF8F8] text-[#0396A6] border border-[#B8E0E2]">
                      7-Day Trial
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 min-h-[32px] leading-snug">
                    {plan.slug === "starter"
                      ? "Best for single website customer support & lead capture."
                      : plan.slug === "growth"
                        ? "Ideal for growing teams with Web + WhatsApp support."
                        : "High-volume autonomous agent deployment with advanced SLAs."}
                  </p>


                  {/* Pricing Box */}
                  <div className="my-5 p-4 rounded-2xl bg-[#F7FDFD] border border-[#D9EDEE]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
                        {inr(displayPrice)}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">/month</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mt-1">
                      <span>{cycle === "annual" ? `Billed ${inr(total)}/yr` : "Billed monthly"}</span>
                      <span className="text-emerald-700 font-bold">₹0 due today</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      What&apos;s included:
                    </p>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5 leading-snug">
                          <div className="w-4 h-4 rounded-full bg-[#EAF8F8] text-[#0396A6] flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Primary Plan CTA Button */}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handlePlanClick(plan)}
                  className={`w-full py-3 px-5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    isGrowth
                      ? "bg-[#0396A6] hover:bg-[#027E8C] text-white shadow-md hover:shadow-lg active:scale-[0.98]"
                      : "bg-[#0396A6]/10 hover:bg-[#0396A6] text-[#0396A6] hover:text-white border border-[#0396A6]/30 active:scale-[0.98]"
                  }`}
                >
                  <span>{isCurrent ? "Current Plan" : "Start 7-Day Free Trial"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Enterprise Callout Banner */}
        <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="space-y-1">
            <h4 className="text-base sm:text-lg font-black font-display">
              Looking for custom volume or Enterprise SLAs?
            </h4>
            <p className="text-xs text-slate-300">
              Get dedicated account management, custom RAG pipelines, on-premise deployments, and tailored contracts.
            </p>
          </div>
          <a
            href={ENTERPRISE_MAIL}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold shrink-0 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Enterprise Sales</span>
          </a>
        </div>
      </div>

      {/* Trial Confirmation Modal */}
      <TrialConfirmationModal
        isOpen={Boolean(confirmPlan)}
        plan={confirmPlan}
        billingCycle={cycle}
        priceMonthly={confirmPlan ? planChargeDisplay(confirmPlan, toCoreBillingTerm(cycle)).exGstPerMonth : 0}
        totalCyclePrice={confirmPlan ? planChargeDisplay(confirmPlan, toCoreBillingTerm(cycle)).exGstPeriodTotal : 0}
        busy={busy}
        onConfirm={async () => {
          if (confirmPlan) await executeSubscription(confirmPlan);
        }}
        onClose={() => setConfirmPlan(null)}
      />
    </AppShell>
  );
}
