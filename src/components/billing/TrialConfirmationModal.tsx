"use client";

import { useState } from "react";
import {
  Calendar,
  Check,
  CreditCard,
  Lock,
  RotateCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { Plan } from "@/lib/types";
import { inr } from "@/lib/format";

interface TrialConfirmationModalProps {
  isOpen: boolean;
  plan: Plan | null;
  billingCycle: "monthly" | "quarterly" | "semi_annual" | "annual";
  priceMonthly: number;
  totalCyclePrice: number;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  busy?: boolean;
}

export function TrialConfirmationModal({
  isOpen,
  plan,
  billingCycle,
  priceMonthly,
  totalCyclePrice,
  onConfirm,
  onClose,
  busy = false,
}: TrialConfirmationModalProps) {
  if (!isOpen || !plan) return null;

  // Calculate 7-day trial end date
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const trialEndStr = trialEnd.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const reminderDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const reminderDateStr = reminderDate.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#D9EDEE] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#EAF8F8] to-[#F7FDFD] border-b border-[#D9EDEE] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0396A6] text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-[#B8E0E2] text-[10px] font-extrabold uppercase tracking-wider text-[#0396A6] mb-0.5">
                <span>7-Day Free Trial</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-display">
                Start your {plan.name} Trial
              </h3>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-[#D9EDEE]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-[#F7FDFD] border border-[#D9EDEE] flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500 font-medium">Selected Tier</p>
              <p className="text-sm font-bold text-slate-900">{plan.name} Plan</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">After trial</p>
              <p className="text-sm font-black text-[#0396A6] font-display">
                {inr(priceMonthly)}
                <span className="text-xs font-normal text-slate-500">/mo</span>
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Trial & Billing Schedule
            </h4>

            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#D9EDEE]">
              {/* Step 1: Today */}
              <div className="flex items-start gap-3.5 relative">
                <div className="w-7 h-7 rounded-full bg-[#0396A6] text-white flex items-center justify-center shrink-0 shadow-xs z-10">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">Today</p>
                    <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                      ₹0 Due Now
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Instant full access to {plan.name} features, AI agent creation, knowledge base, and live channels.
                  </p>
                </div>
              </div>

              {/* Step 2: Reminder */}
              <div className="flex items-start gap-3.5 relative">
                <div className="w-7 h-7 rounded-full bg-[#EAF8F8] border border-[#B8E0E2] text-[#0396A6] flex items-center justify-center shrink-0 z-10">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Day 5 ({reminderDateStr})
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    We&apos;ll send an email reminder before your trial ends. Cancel anytime with 1-click in Settings.
                  </p>
                </div>
              </div>

              {/* Step 3: Billing Starts */}
              <div className="flex items-start gap-3.5 relative">
                <div className="w-7 h-7 rounded-full bg-[#EAF8F8] border border-[#B8E0E2] text-[#0396A6] flex items-center justify-center shrink-0 z-10">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Day 7 ({trialEndStr})
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Autopay activates at {inr(priceMonthly)}/month (billed {billingCycle}). No surprise fees.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-[#0396A6] shrink-0" />
            <span>Cancel anytime during the 7 days without being charged.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Choose Different Plan
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => void onConfirm()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0396A6] hover:bg-[#027E8C] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {busy ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Setting up trial…</span>
              </>
            ) : (
              <>
                <span>Start Free Trial & Setup Autopay</span>
                <Lock className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
