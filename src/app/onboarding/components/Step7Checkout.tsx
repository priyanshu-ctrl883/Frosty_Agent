"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Plan } from "@/lib/types";
import type { SubscribeResult } from "@/lib/types";
import { inr } from "@/lib/format";
import { planChargeDisplay, billingCycleShortLabel } from "@/lib/planPricing";
import { AutopaySetupCard } from "@/components/billing/AutopaySetupCard";

import type { BillingTerm } from "./Step6Plans";

interface Step7CheckoutProps {
  plan: Plan;
  billingCycle: BillingTerm;
  userEmail?: string;
  orgName?: string;
  couponCode?: string;
  onBack: () => void;
  onSuccess: (subscription: SubscribeResult) => void;
}

export function Step7Checkout({
  plan,
  billingCycle,
  userEmail = "merchant@frostrek.com",
  orgName = "Frostrek AI Hub Inc.",
  couponCode = "",
  onBack,
  onSuccess,
}: Step7CheckoutProps) {
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState(couponCode);

  // Compute trial dates
  const today = new Date();
  const trialEndDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const formattedEndDate = trialEndDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const charge = planChargeDisplay(plan, billingCycle);
  const usdDisplay = Math.round(charge.exGstPerMonth / 99.53);
  const afterTrialSummary =
    billingCycle === "monthly"
      ? `${inr(charge.exGstPerMonth)} per month (ex GST)`
      : `${inr(charge.exGstPeriodTotal)} ${billingCycleShortLabel(billingCycle)} (ex GST)`;

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in-50 duration-300">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to plan selection</span>
      </button>

      {/* 2-Column Checkout Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Order Summary — unchanged */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9EDEE] shadow-sm space-y-5 text-left">
          {/* Org Header */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="w-5 h-5 rounded-lg bg-[#EAF8F8] text-[#0396A6] flex items-center justify-center font-bold text-[10px]">
              F
            </span>
            <span>{orgName}</span>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-500">Try {plan.name}</div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
              7 days free
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Then {currency === "INR" ? afterTrialSummary : `$${usdDisplay}/mo equivalent (ex GST)`} starting{" "}
              <span className="font-bold text-slate-800">{formattedEndDate}</span>
            </p>
            <p className="text-[10px] text-slate-500 font-medium mt-1">
              + 18% GST at payment ({inr(charge.gstInclusivePeriodTotal)} incl. GST per billing period)
            </p>
          </div>

          {/* Currency Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-[#D9EDEE] text-xs font-bold">
            <button
              type="button"
              onClick={() => setCurrency("INR")}
              className={`px-3 py-1 rounded-lg transition-all ${
                currency === "INR" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
              }`}
            >
              🇮🇳 INR (₹)
            </button>
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={`px-3 py-1 rounded-lg transition-all ${
                currency === "USD" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
              }`}
            >
              🇺🇸 USD ($)
            </button>
          </div>

          <p className="text-[10px] text-slate-400 font-medium">
            1 USD ≈ 99.53 INR (includes standard processing). Charges occur automatically on trial expiry.
          </p>

          {/* Line items breakdown */}
          <div className="pt-4 border-t border-slate-100 space-y-3 text-xs font-medium text-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">{plan.name} Plan</span>
                <div className="text-[10px] text-slate-400">
                  {currency === "INR" ? afterTrialSummary : `$${usdDisplay}/mo equivalent`} after trial
                </div>
              </div>
              <span className="font-bold text-[#0396A6]">7 days free</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800">
                {currency === "INR" ? inr(charge.exGstPeriodTotal) : `$${usdDisplay}`}
              </span>
            </div>

            {showPromo ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo code"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#D9EDEE] text-xs uppercase"
                />
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-[#0396A6] text-white text-xs font-bold"
                >
                  Apply
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPromo(true)}
                className="text-[11px] font-bold text-[#0396A6] hover:underline"
              >
                + Add promotion code
              </button>
            )}

            {/* Total due today */}
            <div className="pt-3 border-t-2 border-slate-900 flex items-center justify-between text-sm">
              <div>
                <div className="font-extrabold text-slate-900">Total due today</div>
                <div className="text-[10px] text-slate-400">Zero charge during 7-day trial</div>
              </div>
              <span className="text-xl font-black text-emerald-600">₹0.00</span>
            </div>
          </div>
        </div>

        {/* Right Column: Real Autopay mandate setup via Razorpay */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9EDEE] shadow-sm">
          <AutopaySetupCard
            plan={plan}
            billingCycle={billingCycle}
            couponCode={promoCode || couponCode}
            onSuccess={onSuccess}
            onBack={onBack}
          />
        </div>
      </div>
    </div>
  );
}
