"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  CouponPreview,
  discountedAmount,
  subscribeWithSetupChoice,
} from "@/lib/billingCheckout";
import { inr } from "@/lib/format";
import type { Plan, Subscription } from "@/lib/types";
import { isServingSubscriptionStatus } from "@/lib/entitlements";
import { useWorkspace } from "@/lib/workspace";
import { SetupChoice, needsSetupChoice, type SetupPath } from "@/components/billing/SetupChoice";
import { AutopaySetupCard } from "@/components/billing/AutopaySetupCard";
import { completeOnboardingStep } from "@/lib/onboarding";
import { CheckCircle2, ShieldAlert, Check, ArrowRight, Tag, Mail, Sparkles } from "lucide-react";

const ENTERPRISE_MAIL =
  "mailto:sales@frostrek.com?subject=Frosty%20Agent%20Enterprise%20Plan%20Inquiry";

const PLAN_ORDER: Record<string, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  scale: 3,
  max: 4,
  enterprise: 5,
};

const isEnterprisePlan = (plan: Plan) => plan.slug === "enterprise";

const isSelfServeFree = (plan: Plan) =>
  plan.slug === "free" ||
  (Number(plan.price_monthly_inr || 0) === 0 && !isEnterprisePlan(plan));

interface Props {
  onCompleted?: () => void;
  onRefreshWorkspace?: () => void;
}

export function StepPlanChoice({ onCompleted, onRefreshWorkspace }: Props) {
  const { entitlements, reload: reloadWorkspace } = useWorkspace();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [setupPath, setSetupPath] = useState<SetupPath | null>(null);
  const [planFilter, setPlanFilter] = useState<"all" | "starter" | "growth">("all");
  const [autopayPlan, setAutopayPlan] = useState<Plan | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly" | "semiannual" | "annual">("monthly");

  const refreshWorkspace = () => {
    if (reloadWorkspace) void reloadWorkspace();
    if (onRefreshWorkspace) onRefreshWorkspace();
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiRequest<Plan[] | { data?: Plan[] }>("/v1/billing/plans");
      const fetched: Plan[] = Array.isArray(res)
        ? res
        : Array.isArray((res as { data?: Plan[] })?.data)
          ? ((res as { data: Plan[] }).data)
          : [];

      const active = fetched
        .filter((p) => p.is_active !== false && p.slug && p.plan_family !== "commerce" && !p.slug.startsWith("commerce_"))
        .sort(
          (a, b) =>
            (PLAN_ORDER[a.slug] ?? 99) - (PLAN_ORDER[b.slug] ?? 99) ||
            Number(a.price_monthly_inr || 0) - Number(b.price_monthly_inr || 0),
        );

      if (active.length === 0) {
        setError("No active plans are available. Please try again or contact support.");
        setPlans([]);
      } else {
        setPlans(active);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load plans");
      setPlans([]);
      setLoading(false);
      return;
    }
    try {
      const sub = await apiRequest<Subscription>("/v1/billing/subscription");
      setSubscription(sub);
      if (sub?.plan_slug) setSelectedSlug(sub.plan_slug);
    } catch {
      setSubscription(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
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

  async function handleSelectPlan(plan: Plan) {
    setError(null);
    setNotice(null);

    // Sales-only — never fake-activate a ₹0 Enterprise row from the catalog.
    if (isEnterprisePlan(plan) || (Number(plan.price_monthly_inr || 0) === 0 && plan.slug !== "free")) {
      window.location.href = ENTERPRISE_MAIL;
      return;
    }

    if (needsSetupChoice(plan) && !setupPath) {
      setSelectedSlug(plan.slug);
      setError("Choose self-serve or assisted setup before continuing.");
      return;
    }

    // Enter mandatory autopay card setup stage
    setAutopayPlan(plan);
  }


  const isCurrentPlanActive =
    !!entitlements?.plan_slug && isServingSubscriptionStatus(entitlements.subscription_status);

  const filteredPlans = plans.filter((p) => {
    if (planFilter === "starter") return p.slug === "free" || p.slug === "starter";
    if (planFilter === "growth") {
      return p.slug === "growth" || p.slug === "scale" || p.slug === "max" || p.slug === "enterprise";
    }
    return true;
  });

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">Loading all available Frosty plans…</p>
      </div>
    );
  }

  if (autopayPlan) {
    return (
      <AutopaySetupCard
        plan={autopayPlan}
        billingCycle={billingCycle}
        couponCode={coupon?.code || couponCode}
        onSuccess={(_sub) => {
          void completeOnboardingStep("select_plan_trial").catch(() => null);
          setNotice("Your 7-day free trial is now active with Autopay.");
          refreshWorkspace();
          if (onCompleted) onCompleted();
        }}
        onBack={() => setAutopayPlan(null)}
      />
    );
  }

  return (
    <div className="space-y-6">

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {notice && (
        <div className="p-4 bg-primary/10 text-primary text-sm font-medium rounded-xl border border-primary/20">
          {notice}
        </div>
      )}

      {isCurrentPlanActive && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-900">
                Active Tier: {entitlements?.plan_name || subscription?.plan_slug || "Selected"}
              </p>
              <p className="text-xs text-emerald-700">
                {entitlements?.plan_slug === "free"
                  ? "Your 7-day free trial is active. Upgrade anytime, or continue to create your agent."
                  : "Your plan is registered. You can switch plans or proceed to the next step."}
              </p>
            </div>
          </div>
          {onCompleted && (
            <button
              type="button"
              onClick={onCompleted}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>Next Task</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-surface-container-low rounded-xl border border-border/80">
        <div className="flex items-center gap-1.5 bg-surface p-1 rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => setPlanFilter("all")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              planFilter === "all"
                ? "bg-primary text-white shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            All Plans ({plans.length})
          </button>
          <button
            type="button"
            onClick={() => setPlanFilter("starter")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              planFilter === "starter"
                ? "bg-primary text-white shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Trial & Starter
          </button>
          <button
            type="button"
            onClick={() => setPlanFilter("growth")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              planFilter === "growth"
                ? "bg-primary text-white shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Growth & Scale
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
          <input
            type="text"
            placeholder="PROMO CODE"
            className="h-8 px-2.5 text-xs uppercase bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none max-w-[130px]"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase());
              setCoupon(null);
              setCouponError(null);
            }}
          />
          <button
            type="button"
            className="h-8 px-3 bg-surface-container border border-border text-on-surface hover:bg-surface-container-high rounded-lg text-xs font-semibold transition-colors"
            onClick={() => void applyCoupon()}
          >
            Apply
          </button>
        </div>
      </div>

      {couponError && <p className="text-xs text-red-600">{couponError}</p>}
      {coupon && (
        <p className="text-xs text-emerald-700 font-medium">✓ Coupon {coupon.code} applied!</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPlans.map((p) => {
          const planLive = isServingSubscriptionStatus(subscription?.status);
          const isCurrent =
            planLive &&
            p.slug === subscription?.plan_slug &&
            (p.slug !== "free" || entitlements?.plan_slug === "free");
          const enterprise = isEnterprisePlan(p);
          const base = Number(p.price_monthly_inr || 0);
          const disc = discountedAmount(base, coupon);
          const showStrike = Boolean(coupon && disc < base && base > 0);
          const isSelected = selectedSlug === p.slug;
          const isPopular = p.slug === "growth";

          return (
            <div
              key={p.id || p.slug}
              onClick={() => setSelectedSlug(p.slug)}
              className={`relative bg-surface-container-lowest p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20 shadow-md bg-primary/5"
                  : isPopular
                    ? "border-amber-400 shadow-sm"
                    : "border-border hover:border-primary/40 hover:shadow-sm"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-3 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider shadow-sm">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-base text-on-surface font-display">{p.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant uppercase">
                    {p.slug === "free" ? "Trial" : enterprise ? "Sales" : p.slug}
                  </span>
                </div>

                <div className="my-3">
                  <div className="flex items-baseline gap-1">
                    {showStrike && (
                      <span className="text-xs text-muted-foreground line-through mr-1">
                        {inr(base)}
                      </span>
                    )}
                    <span className="text-2xl font-bold tracking-tight text-on-surface">
                      {enterprise ? "Custom" : base > 0 ? inr(showStrike ? disc : base) : "Free"}
                    </span>
                    {base > 0 && !enterprise && (
                      <span className="text-xs text-on-surface-variant">/mo</span>
                    )}
                  </div>
                  {enterprise && (
                    <p className="text-[11px] text-on-surface-variant mt-1">
                      Custom volume, seats, and invoicing — talk to sales.
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-6 text-xs text-on-surface-variant">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      {p.included_conversations
                        ? `Up to ${p.included_conversations} conversations/mo`
                        : "Custom conversation volume"}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      {p.allows_whatsapp
                        ? "WhatsApp & Website Channels"
                        : "Website Chat Widget Only"}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      {enterprise
                        ? "Custom team seats"
                        : `${p.included_seats ?? "—"} included team seats`}
                    </span>
                  </li>
                  {!enterprise && Number(p.setup_fee_inr) > 0 ? (
                      <li className="flex items-center gap-2 text-muted-foreground">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span>
                          Setup fee: {inr(Number(p.setup_fee_inr))}{" "}
                          {p.setup_fee_required ? "(Required)" : "(Optional)"}
                        </span>
                      </li>
                    ) : !enterprise ? (
                      <li className="flex items-center gap-2 text-emerald-700 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>No setup fee</span>
                      </li>
                    ) : null}
                </ul>

                {isSelected && needsSetupChoice(p) && (
                  <div className="mb-4">
                    <SetupChoice
                      planSlug={p.slug}
                      setupFeeInr={Number(p.setup_fee_inr || 0)}
                      setupFeeRequired={Boolean(p.setup_fee_required)}
                      value={setupPath}
                      onChange={setSetupPath}
                      disabled={busy}
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={busy || (Boolean(isCurrent) && !enterprise && !isSelfServeFree(p))}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleSelectPlan(p);
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isCurrent && !enterprise
                    ? "bg-surface-container text-muted-foreground cursor-default border border-border"
                    : isSelected || enterprise
                      ? "bg-primary text-primary-foreground shadow-sm hover:brightness-110"
                      : "bg-surface border border-border text-on-surface hover:bg-surface-container"
                }`}
              >
                {enterprise ? (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    <span>Talk to sales</span>
                  </>
                ) : isCurrent ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Current Plan Active</span>
                  </>
                ) : isSelected ? (
                  <>
                    <span>Set Up Autopay ({p.name})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <span>Select {p.name} & Set Up Autopay</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
