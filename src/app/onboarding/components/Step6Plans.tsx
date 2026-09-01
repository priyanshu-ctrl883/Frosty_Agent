"use client";

import { ArrowRight, Check, Sparkles, Mail, Building2 } from "lucide-react";
import type { Plan } from "@/lib/types";
import { inr } from "@/lib/format";
import {
  CORE_PLAN_TERMS,
  sortCorePlans,
  type BillingTerm,
} from "@/lib/corePlans";
import { planDisplayPricing, planOverageRate } from "@/lib/planPricing";

export type { BillingTerm };

interface Step6PlansProps {
  plans: Plan[];
  billingCycle: BillingTerm;
  selectedPlan: Plan | null;
  onCycleChange: (cycle: BillingTerm) => void;
  onSelectPlan: (plan: Plan) => void;
  onContinueToCheckout: () => void;
  onSkip?: () => void;
}

const TERMS = CORE_PLAN_TERMS;

const ENTERPRISE_CONTACT_URL =
  "mailto:sales@frostrek.com?subject=Frostrek%20Enterprise%20Custom%20Plan%20Inquiry";

export function Step6Plans({
  plans,
  billingCycle,
  selectedPlan,
  onCycleChange,
  onSelectPlan,
  onContinueToCheckout,
  onSkip,
}: Step6PlansProps) {
  const currentSlug = selectedPlan?.slug || "growth";
  const displayPlans = sortCorePlans(plans);

  const handleChoosePlan = (plan: Plan) => {
    onSelectPlan(plan);
    onContinueToCheckout();
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center text-center animate-in fade-in-50 duration-300">
      <div className="text-[11px] font-semibold tracking-wider text-[#0396A6] uppercase mb-1.5">
        Step 6 of 6 · Core Plans (India)
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
        Choose your plan to <span className="text-[#0396A6]">launch</span>
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1 font-medium leading-relaxed">
        Start with a 7-day free trial. No charge until your trial ends — cancel anytime.
      </p>
      <p className="text-[10px] text-slate-400 mt-1">All rates from the plan catalog (ex GST).</p>

      <div className="mt-5 inline-flex items-center p-1 rounded-full bg-slate-100 border border-[#D9EDEE] text-xs font-bold">
        {TERMS.map((t) => {
          const isActive = billingCycle === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onCycleChange(t.id)}
              className={`px-4 sm:px-5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                isActive
                  ? "bg-[#0396A6] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>{t.label}</span>
              {t.badge && (
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ${
                    isActive ? "bg-white text-[#0396A6]" : "bg-emerald-500 text-white"
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {displayPlans.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">Loading plan catalog…</p>
      ) : null}

      <div className="w-full mt-7 overflow-x-auto pb-2">
        <div className="flex gap-3.5 min-w-max lg:min-w-0 lg:grid lg:grid-cols-4 items-stretch">
          {displayPlans.map((plan) => {
            const isSelected = currentSlug === plan.slug;
            const isGrowth = plan.slug === "growth";
            const display = planDisplayPricing(plan, billingCycle);
            const {
              exGstPerMonth: perMonth,
              termSavings,
              strikethroughPerMonth,
              showLaunchBadge,
              exGstPeriodTotal: periodTotal,
            } = display;
            const convos = plan.included_conversations ?? 0;
            const seats = plan.included_seats ?? (plan.slug === "starter" ? 2 : plan.slug === "growth" ? 3 : plan.slug === "scale" ? 4 : 7);
            const overage = planOverageRate(plan);

            const billedLabel =
              billingCycle === "annual"
                ? `Billed annually (${inr(periodTotal)})`
                : billingCycle === "semiannual"
                  ? `Billed every 6 months (${inr(periodTotal)})`
                  : billingCycle === "quarterly"
                    ? `Billed quarterly (${inr(periodTotal)})`
                    : "Billed monthly";

            return (
              <div
                key={plan.id || plan.slug}
                onClick={() => onSelectPlan(plan)}
                className={`w-[220px] lg:w-auto rounded-2xl p-4 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative border bg-white ${
                  isSelected && !isGrowth
                    ? "border-[#0396A6] ring-2 ring-[#0396A6]/20 shadow-md shadow-[#0396A6]/5"
                    : isGrowth
                      ? "border-violet-400 ring-2 ring-violet-400/20 shadow-md shadow-violet-500/10"
                      : "border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div>
                  {isGrowth && (
                    <div className="-mt-0.5 mb-2">
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 uppercase tracking-wide">
                        ✦ Most Popular
                      </span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <h3 className={`text-base font-extrabold tracking-tight ${isGrowth ? "text-violet-700" : "text-slate-900"}`}>
                      {plan.name}
                    </h3>
                    {termSavings > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 leading-tight">
                        <Sparkles className="w-2 h-2 text-emerald-600" />
                        Save {inr(termSavings)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 flex flex-col gap-0.5">
                    {strikethroughPerMonth ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[11px] font-semibold text-slate-400 line-through decoration-slate-400">
                          {strikethroughPerMonth}/mo
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">Standard rate</span>
                      </div>
                    ) : null}
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className="text-[22px] font-black text-slate-900 tracking-tight">
                        {inr(Math.round(perMonth))}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">/mo</span>
                      {showLaunchBadge ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#0396A6]/10 text-[#0396A6] border border-[#0396A6]/20 uppercase tracking-wide">
                          Launch rate
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-snug">{billedLabel}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">+ 18% GST at payment</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                    <div>
                      <div className="flex items-start gap-1.5 text-slate-700 font-medium leading-snug">
                        <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0 mt-0.5" />
                        <span>{convos.toLocaleString()} monthly conversations</span>
                      </div>
                      {overage > 0 ? (
                        <div className="text-[10px] font-bold text-[#0396A6] pl-4.5 mt-0.5">
                          Extra: {inr(overage)} / extra
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-700 font-medium leading-snug">
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0 mt-0.5" />
                      <span>{seats} team seats included</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-700 font-medium leading-snug">
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0 mt-0.5" />
                      <span>1 website channel included</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-700 font-medium leading-snug">
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0 mt-0.5" />
                      <span>1 WhatsApp channel included</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-700 font-medium leading-snug">
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0 mt-0.5" />
                      <span>All platform features included</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-700 font-medium leading-snug">
                      <Sparkles className="w-3 h-3 text-[#0396A6] shrink-0 mt-0.5" />
                      <span>7-day free trial (up to 50 convos)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChoosePlan(plan);
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected && !isGrowth
                        ? "bg-[#0396A6] hover:bg-[#087681] text-white shadow-sm shadow-[#0396A6]/20 active:scale-[0.99]"
                        : isGrowth
                          ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-500/20 active:scale-[0.99]"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>Start 7-Day Free Trial</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full mt-5 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-extrabold text-slate-900">Enterprise</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#EAF8F8] text-[#0396A6] border border-[#B8E0E2]/60 uppercase tracking-wide">Custom</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Custom volume, dedicated infrastructure, and tailored integrations.</p>
          </div>
        </div>
        <a
          href={ENTERPRISE_CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-xs"
        >
          <Mail className="w-3.5 h-3.5" />
          Contact Sales
        </a>
      </div>

      {onSkip && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
          >
            Skip — I&apos;ll choose a plan later
          </button>
        </div>
      )}
    </div>
  );
}
