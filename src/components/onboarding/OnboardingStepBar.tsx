"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FastForward,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { skipOnboardingStep, completeOnboardingStep } from "@/lib/onboarding";

interface OnboardingStepBarProps {
  stepKey: string;
  stepTitle: string;
  stepOrder: number;
  totalSteps?: number;
  nextPath?: string;
  isCompleted?: boolean;
  isFinal?: boolean;
}

export function OnboardingStepBar({
  stepKey,
  stepTitle,
  stepOrder,
  totalSteps = 6,
  nextPath = "/home",
  isCompleted = false,
  isFinal = false,
}: OnboardingStepBarProps) {
  const router = useRouter();
  const [skipping, setSkipping] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleSkip = async () => {
    if (skipping) return;
    setSkipping(true);
    setToastMsg(null);
    try {
      await skipOnboardingStep(stepKey);
      await mutate("onboarding_checklist");
      setToastMsg("Step skipped — you can finish it later from the Dashboard.");
      setTimeout(() => {
        router.push(nextPath);
      }, 500);
    } catch {
      // Fallback navigation even if offline
      router.push(nextPath);
    } finally {
      setSkipping(false);
    }
  };

  return (
    <div className="w-full mb-6 rounded-2xl bg-white border border-[#D9EDEE] p-3.5 sm:p-4 shadow-[0_4px_20px_rgba(3,150,166,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
      {/* Step Info */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/home"
          className="w-8 h-8 rounded-xl bg-[#F7FDFD] border border-[#D9EDEE] hover:bg-[#EAF8F8] text-slate-600 hover:text-[#0396A6] flex items-center justify-center transition-colors shrink-0"
          title="Return to Setup Checklist on Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF8F8] text-[#0396A6] border border-[#B8E0E2]">
              Step {stepOrder} of {totalSteps}
            </span>
            {isFinal && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#0396A6] text-white flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3" /> Final Step
              </span>
            )}
            {isCompleted && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Completed
              </span>
            )}
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
            {stepTitle}
          </h2>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
        {toastMsg && (
          <span className="text-xs font-semibold text-[#0396A6] animate-in fade-in-50">
            {toastMsg}
          </span>
        )}

        <button
          type="button"
          disabled={skipping}
          onClick={handleSkip}
          className="px-3 py-1.5 rounded-xl border border-[#D9EDEE] bg-[#F7FDFD] hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {skipping ? (
            <>
              <RotateCw className="w-3 h-3 animate-spin" />
              <span>Skipping…</span>
            </>
          ) : (
            <>
              <FastForward className="w-3.5 h-3.5 text-[#0396A6]" />
              <span>Skip for now</span>
            </>
          )}
        </button>

        <Link
          href="/home"
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#0396A6] hover:bg-[#EAF8F8] transition-colors"
        >
          View Checklist
        </Link>
      </div>
    </div>
  );
}
