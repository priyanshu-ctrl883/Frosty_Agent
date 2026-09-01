"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FastForward,
  RotateCcw,
  Check,
  Zap,
  Building2,
  Bot,
  BookOpen,
  Globe,
  MessageSquare,
  CreditCard,
  PartyPopper,
  X,
  Layers,
  List,
} from "lucide-react";
import {
  fetchOnboardingChecklist,
  skipOnboardingStep,
  completeOnboardingStep,
  resetOnboardingStep,
  type OnboardingChecklist,
} from "@/lib/onboarding";

interface HomeOnboardingChecklistProps {
  isOwnerOrAdmin?: boolean;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  profile: Building2,
  create_agent: Bot,
  add_knowledge: BookOpen,
  configure_channels: Globe,
  test_sandbox: MessageSquare,
  select_plan_trial: CreditCard,
};

const cardVariants = {
  initial: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.95,
  }),
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
    scale: 0.95,
  }),
};

export function HomeOnboardingChecklist({ isOwnerOrAdmin = true }: HomeOnboardingChecklistProps) {
  const [viewMode, setViewMode] = useState<"stack" | "list">("stack");
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [activeDeckIndex, setActiveDeckIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [collapsed, setCollapsed] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [dismissCelebration, setDismissCelebration] = useState(false);

  const { data: checklist, error, isLoading } = useSWR<OnboardingChecklist>(
    "onboarding_checklist",
    fetchOnboardingChecklist,
    {
      revalidateOnFocus: true,
      refreshInterval: 60_000,
    }
  );

  // Filter steps according to toggle
  const visibleSteps = checklist
    ? checklist.steps.filter((s) => {
        if (filter === "all") return true;
        return s.status === "pending";
      })
    : [];

  // Keep active index in bounds whenever visibleSteps changes
  useEffect(() => {
    if (activeDeckIndex >= visibleSteps.length && visibleSteps.length > 0) {
      setActiveDeckIndex(Math.max(0, visibleSteps.length - 1));
    }
  }, [visibleSteps.length, activeDeckIndex]);

  // If user does not have permission, don't show the checklist
  if (!isOwnerOrAdmin) return null;

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="mb-8 rounded-3xl border border-[var(--line)] bg-card p-5 sm:p-6 shadow-[var(--shadow)] animate-pulse relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--line-soft)]" />
            <div className="space-y-2">
              <div className="w-40 h-4 bg-[var(--line-soft)] rounded-md" />
              <div className="w-64 h-3 bg-[var(--line-soft)] rounded-md" />
            </div>
          </div>
          <div className="w-24 h-6 bg-[var(--line-soft)] rounded-full" />
        </div>
        <div className="w-full h-2 bg-[var(--line-soft)] rounded-full mb-6" />
        <div className="w-full h-28 bg-[var(--line-soft)] rounded-2xl" />
        <div className="skeleton-shimmer" />
      </div>
    );
  }

  if (error || !checklist) {
    return null; // Gracefully degrade if endpoint is unavailable
  }

  // All Done Celebration State
  if (checklist.is_all_completed) {
    if (dismissCelebration) return null;
    return (
      <div className="mb-8 rounded-3xl border border-[#0396A6]/30 bg-gradient-to-r from-[#0396A6]/8 via-[#0396A6]/4 to-[#0396A6]/8 p-5 sm:p-6 shadow-[0_4px_20px_rgba(3,150,166,0.08)] relative flex items-center justify-between gap-4 animate-in fade-in-50 duration-300">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#0396A6] text-white flex items-center justify-center shadow-md shadow-[#0396A6]/20 shrink-0">
            <PartyPopper className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-foreground">
              Setup Complete • Workspace Live!
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              You&apos;ve completed all 6 setup steps. Your AI assistant is fully configured and ready for live visitors.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissCelebration(true)}
          className="p-1.5 rounded-full text-[#0396A6] hover:bg-[#0396A6]/10 transition-colors shrink-0 cursor-pointer"
          title="Dismiss"
          aria-label="Dismiss completion banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const handleSkip = async (stepKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActionLoadingKey(`skip_${stepKey}`);
    setSlideDirection(1);

    // If in "all" filter mode, advance to next index
    if (filter === "all" && visibleSteps.length > 1) {
      setActiveDeckIndex((prev) => (prev + 1) % visibleSteps.length);
    }

    try {
      // Optimistic update
      const optimistic: OnboardingChecklist = {
        ...checklist,
        steps: checklist.steps.map((s) =>
          s.key === stepKey ? { ...s, status: "skipped" as const, skipped_at: new Date().toISOString() } : s
        ),
        pending_steps: Math.max(0, checklist.pending_steps - 1),
        skipped_steps: checklist.skipped_steps + 1,
      };
      await mutate("onboarding_checklist", skipOnboardingStep(stepKey), {
        optimisticData: optimistic,
        rollbackOnError: true,
        revalidate: true,
      });
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleReset = async (stepKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActionLoadingKey(`reset_${stepKey}`);
    try {
      await mutate("onboarding_checklist", resetOnboardingStep(stepKey), {
        revalidate: true,
      });
    } finally {
      setActionLoadingKey(null);
    }
  };

  const currentStep = visibleSteps[activeDeckIndex] || visibleSteps[0];
  const nextStepPreview = visibleSteps[(activeDeckIndex + 1) % visibleSteps.length];
  const thirdStepPreview = visibleSteps[(activeDeckIndex + 2) % visibleSteps.length];

  const handleNextCard = () => {
    setSlideDirection(1);
    setActiveDeckIndex((prev) => (prev + 1) % visibleSteps.length);
  };

  const handlePrevCard = () => {
    setSlideDirection(-1);
    setActiveDeckIndex((prev) => (prev - 1 + visibleSteps.length) % visibleSteps.length);
  };

  return (
    <div className="mb-8 rounded-3xl border border-[#D9EDEE] bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(3,150,166,0.05)] transition-all duration-300">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#EAF8F8] text-[#0396A6] border border-[#B8E0E2] flex items-center justify-center shrink-0 shadow-sm shadow-[#0396A6]/10">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Complete your setup
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF8F8] text-[#0396A6] border border-[#B8E0E2]">
                {checklist.completed_steps} of {checklist.total_steps} completed
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Follow these recommended steps to configure and launch your AI agents.
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-full border border-[#D9EDEE] text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            title={collapsed ? "Expand checklist" : "Collapse checklist"}
            aria-label={collapsed ? "Expand checklist" : "Collapse checklist"}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ─── Smooth Progress Bar ─── */}
      <div className="mt-4 mb-5">
        <div className="w-full h-2.5 bg-[#F0F7F7] rounded-full overflow-hidden p-0.5 border border-[#D9EDEE]">
          <div
            className="h-full bg-gradient-to-r from-[#0396A6] to-[#087681] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(checklist.percent_completed, 4)}%` }}
          />
        </div>
      </div>

      {/* ─── Overlapping Stacked Deck View vs Classic List ─── */}
      {!collapsed && (
        <>
          {visibleSteps.length === 0 ? (
            <div className="py-7 px-4 text-center bg-[#F7FDFD] rounded-2xl border border-dashed border-[#D9EDEE]">
              <div className="w-9 h-9 mx-auto rounded-full bg-[#EAF8F8] text-[#0396A6] flex items-center justify-center mb-2">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                {checklist.skipped_steps > 0
                  ? "All remaining steps have been skipped or completed!"
                  : "All setup steps completed!"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {checklist.skipped_steps > 0
                  ? "You can view or resume skipped steps anytime."
                  : "Your AI assistant is fully configured and live."}
              </p>
              {checklist.skipped_steps > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0396A6] text-white hover:bg-[#087681] shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>View All Steps ({checklist.total_steps})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : viewMode === "stack" && currentStep ? (
            /* ─── Stacked / Overlapping Card Deck ─── */
            <div className="relative pt-2 pb-6 px-1">
              {/* Deck Navigation Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-700">
                    Step {activeDeckIndex + 1} of {visibleSteps.length}
                  </span>
                  {/* Step Dot Indicators */}
                  <div className="flex items-center gap-1 ml-1">
                    {visibleSteps.map((s, idx) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => {
                          setSlideDirection(idx > activeDeckIndex ? 1 : -1);
                          setActiveDeckIndex(idx);
                        }}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          idx === activeDeckIndex
                            ? "w-5 bg-[#0396A6]"
                            : s.status === "completed"
                            ? "w-1.5 bg-[#0396A6]/60"
                            : "w-1.5 bg-slate-200 hover:bg-slate-300"
                        }`}
                        title={`Go to step ${idx + 1}: ${s.title}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Deck Prev / Next Buttons */}
                {visibleSteps.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevCard}
                      className="w-7 h-7 rounded-lg border border-[#D9EDEE] bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="Previous card"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextCard}
                      className="w-7 h-7 rounded-lg border border-[#D9EDEE] bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="Next card"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* ─── Stack Layer Container ─── */}
              <div className="relative min-h-[110px] select-none">
                {/* 3rd Layer Background Card (Deep Stack) */}
                {visibleSteps.length > 2 && thirdStepPreview && (
                  <div
                    className="absolute inset-x-0 top-0 h-full rounded-2xl border border-slate-200/60 bg-slate-100/80 shadow-2xs pointer-events-none transition-transform duration-300"
                    style={{
                      transform: "translateY(16px) scale(0.94)",
                      opacity: 0.5,
                      zIndex: 1,
                    }}
                  />
                )}

                {/* 2nd Layer Background Card (Middle Stack) */}
                {visibleSteps.length > 1 && nextStepPreview && (
                  <div
                    className="absolute inset-x-0 top-0 h-full rounded-2xl border border-[#D9EDEE] bg-[#F7FDFD] shadow-xs pointer-events-none transition-transform duration-300"
                    style={{
                      transform: "translateY(8px) scale(0.97)",
                      opacity: 0.85,
                      zIndex: 2,
                    }}
                  >
                    <div className="p-4 flex items-center justify-between opacity-50">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">
                          {nextStepPreview.order}
                        </div>
                        <span className="text-xs font-bold text-slate-600 truncate">
                          {nextStepPreview.title}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── 1st Layer Active Top Card (Animated with AnimatePresence) ─── */}
                <AnimatePresence mode="popLayout" custom={slideDirection}>
                  <motion.div
                    key={currentStep.key}
                    custom={slideDirection}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 28,
                      mass: 0.8,
                    }}
                    className={`relative rounded-2xl p-4 sm:p-5 transition-colors border bg-white shadow-md shadow-[#0396A6]/5 ${
                      currentStep.status === "completed"
                        ? "border-[#0396A6]/30 bg-[#0396A6]/5"
                        : currentStep.is_prominent
                        ? "border-[#0396A6] ring-2 ring-[#0396A6]/20 bg-gradient-to-r from-[#EAF8F8]/60 via-white to-white"
                        : checklist.next_step_key === currentStep.key
                        ? "border-[#0396A6] ring-1 ring-[#0396A6]/20 bg-white"
                        : "border-[#D9EDEE] bg-white hover:border-[#0396A6]/50"
                    }`}
                    style={{ zIndex: 10 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Step Left Details */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Order / Status Badge */}
                        <div className="mt-0.5 shrink-0">
                          {currentStep.status === "completed" ? (
                            <div className="w-8 h-8 rounded-full bg-[#0396A6]/15 text-[#0396A6] flex items-center justify-center font-bold">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          ) : currentStep.status === "skipped" ? (
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs" title="Skipped">
                              <FastForward className="w-4 h-4" />
                            </div>
                          ) : currentStep.is_prominent ? (
                            <div className="w-8 h-8 rounded-full bg-[#0396A6] text-white flex items-center justify-center font-extrabold text-xs shadow-sm shadow-[#0396A6]/30">
                              {currentStep.order}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#EAF8F8] text-[#0396A6] border border-[#B8E0E2] flex items-center justify-center font-extrabold text-xs">
                              {currentStep.order}
                            </div>
                          )}
                        </div>

                        {/* Title, Badges & Description */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <h3 className={`text-sm sm:text-base font-extrabold ${currentStep.status === "completed" ? "text-slate-600 line-through" : "text-slate-900"}`}>
                              {currentStep.title}
                            </h3>

                            {currentStep.is_prominent && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0396A6] text-white shadow-xs">
                                <Sparkles className="w-3 h-3" /> Final Step • 7-day free trial
                              </span>
                            )}

                            {currentStep.status === "skipped" && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                                Skipped
                              </span>
                            )}

                            {currentStep.status === "completed" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#0396A6]/10 text-[#0396A6]">
                                Completed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                            {currentStep.description}
                          </p>
                        </div>
                      </div>

                      {/* Step Right Actions */}
                      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                        {currentStep.status !== "completed" ? (
                          <>
                            {/* Skip Button */}
                            {currentStep.is_skippable && currentStep.status !== "skipped" && (
                              <button
                                type="button"
                                disabled={actionLoadingKey === `skip_${currentStep.key}`}
                                onClick={(e) => handleSkip(currentStep.key, e)}
                                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {actionLoadingKey === `skip_${currentStep.key}` ? "Skipping..." : "Skip for now"}
                              </button>
                            )}

                            {/* Resume Button if Skipped */}
                            {currentStep.status === "skipped" && (
                              <button
                                type="button"
                                disabled={actionLoadingKey === `reset_${currentStep.key}`}
                                onClick={(e) => handleReset(currentStep.key, e)}
                                className="px-3 py-2 rounded-xl text-xs font-semibold text-[#0396A6] hover:bg-[#EAF8F8] transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Resume</span>
                              </button>
                            )}

                            {/* Primary Continue Button */}
                            <Link
                              href={currentStep.deep_link}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98] ${
                                currentStep.is_prominent
                                  ? "bg-[#0396A6] hover:bg-[#087681] text-white shadow-[#0396A6]/20"
                                  : "bg-[#0396A6] hover:bg-[#087681] text-white shadow-[#0396A6]/15"
                              }`}
                            >
                              <span>{currentStep.is_prominent ? "Select Plan & Start Trial" : "Continue"}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#0396A6] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-[#0396A6]" /> Done
                            </span>
                            <Link
                              href={currentStep.deep_link}
                              className="text-xs font-semibold text-slate-400 hover:text-slate-700 hover:underline ml-1"
                            >
                              View
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          ) : (
            /* ─── Classic List View ─── */
            <div className="space-y-3">
              {visibleSteps.map((step) => {
                const isNext = checklist.next_step_key === step.key;
                const isProminent = step.is_prominent;
                const isDone = step.status === "completed";
                const isSkipped = step.status === "skipped";

                return (
                  <div
                    key={step.key}
                    className={`rounded-2xl p-3.5 sm:p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
                      isDone
                        ? "bg-[#F9FCFC] border-[#E2EFF0] opacity-80"
                        : isProminent
                        ? "bg-gradient-to-r from-[#EAF8F8]/70 via-white to-[#EAF8F8]/40 border-[#0396A6] shadow-sm shadow-[#0396A6]/10"
                        : isNext
                        ? "bg-white border-[#0396A6]/60 ring-1 ring-[#0396A6]/20 shadow-xs"
                        : "bg-[#FAFCFC] border-[#D9EDEE] hover:border-slate-300"
                    }`}
                  >
                    {/* Step Left: Icon + Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Status Circle */}
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <div className="w-7 h-7 rounded-full bg-[#EAF8F8] text-[#0396A6] flex items-center justify-center font-bold">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : isSkipped ? (
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs" title="Skipped">
                            <FastForward className="w-3.5 h-3.5" />
                          </div>
                        ) : isNext ? (
                          <div className="w-7 h-7 rounded-full bg-[#FF7A5E] text-white flex items-center justify-center font-bold text-xs shadow-xs animate-pulse">
                            {step.order}
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
                            {step.order}
                          </div>
                        )}
                      </div>

                      {/* Text Details */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h3 className={`text-xs sm:text-sm font-bold ${isDone ? "text-slate-600 line-through" : "text-slate-900"}`}>
                            {step.title}
                          </h3>

                          {isProminent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0396A6] text-white shadow-xs">
                              <Sparkles className="w-3 h-3" /> Final Step • 7-day free trial
                            </span>
                          )}

                          {isSkipped && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                              Skipped
                            </span>
                          )}

                          {isDone && step.is_auto_detected && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EAF8F8] text-[#0396A6]">
                              Auto-detected
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Step Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {!isDone ? (
                        <>
                          {/* Skip Button */}
                          {step.is_skippable && !isSkipped && (
                            <button
                              type="button"
                              disabled={actionLoadingKey === `skip_${step.key}`}
                              onClick={(e) => handleSkip(step.key, e)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {actionLoadingKey === `skip_${step.key}` ? "Skipping..." : "Skip for now"}
                            </button>
                          )}

                          {/* Resume Button if Skipped */}
                          {isSkipped && (
                            <button
                              type="button"
                              disabled={actionLoadingKey === `reset_${step.key}`}
                              onClick={(e) => handleReset(step.key, e)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#0396A6] hover:bg-[#EAF8F8] transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Resume</span>
                            </button>
                          )}

                          {/* Primary Continue Button */}
                          <Link
                            href={step.deep_link}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] ${
                              isProminent
                                ? "bg-[#0396A6] hover:bg-[#087681] text-white shadow-[#0396A6]/20"
                                : isNext
                                ? "bg-[#0396A6] hover:bg-[#087681] text-white"
                                : "bg-[#EAF8F8] hover:bg-[#0396A6] text-[#0396A6] hover:text-white"
                            }`}
                          >
                            <span>{isProminent ? "Select Plan & Start Trial" : "Continue"}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0396A6] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0396A6]" /> Done
                          </span>
                          <Link
                            href={step.deep_link}
                            className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 hover:underline"
                          >
                            View
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
