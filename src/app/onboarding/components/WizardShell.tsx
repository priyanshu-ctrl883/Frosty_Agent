"use client";

import Link from "next/link";
import { FrostrekLogo } from "@/components/FrostrekLogo";
import { ArrowLeft } from "lucide-react";

interface WizardShellProps {
  currentStep: number;
  totalSteps: number;
  onSkip?: () => void;
  onBack?: () => void;
  showBack?: boolean;
  skipLabel?: string;
  skipping?: boolean;
  children: React.ReactNode;
}

export function WizardShell({
  currentStep,
  totalSteps,
  onSkip,
  onBack,
  showBack = false,
  skipLabel = "Skip",
  skipping = false,
  children,
}: WizardShellProps) {
  return (
    <div className="min-h-screen w-full bg-[#FAFCFC] text-slate-800 flex flex-col justify-between selection:bg-[#0396A6]/20 font-sans relative">
      {/* Subtle top ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-[#0396A6]/6 via-[#0396A6]/2 to-transparent rounded-full blur-3xl opacity-70" />
      </div>

      {/* ─── Fixed Locked Top Navigation Bar ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full px-5 sm:px-8 py-3 flex items-center justify-between border-b border-[#E8F3F3] bg-white/95 backdrop-blur-md shadow-2xs">
        {/* Left: Logo & optional Back */}
        <div className="flex items-center gap-3">
          {showBack && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-lg border border-[#D9EDEE] bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all shadow-2xs"
              title="Go back"
              aria-label="Previous step"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <Link href="/home" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-[#0396A6] text-white flex items-center justify-center shadow-xs shadow-[#0396A6]/20 group-hover:scale-105 transition-transform">
              <FrostrekLogo size={18} color="#ffffff" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 font-sans">
              Frostrek
            </span>
          </Link>
        </div>

        {/* Center: Step Progress Indicators */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            return (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-7 bg-[#0396A6] shadow-xs shadow-[#0396A6]/30"
                    : isCompleted
                    ? "w-2 bg-[#0396A6]/50"
                    : "w-2 bg-slate-200"
                }`}
                title={`Step ${idx + 1} of ${totalSteps}`}
              />
            );
          })}
        </div>

        {/* Right: Skip button */}
        <div className="flex items-center gap-2">
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-100/80 transition-colors"
            >
              {skipLabel}
            </button>
          )}
        </div>
      </header>

      {/* ─── Main Content Area (with pt-14 for fixed header clearance) ─── */}
      <main className="flex-1 flex flex-col items-center justify-start pt-16 pb-6 px-4 sm:px-6 md:px-10 xl:px-16 relative z-10 w-full mx-auto">
        {children}
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-3 text-center text-[11px] text-slate-400 relative z-10">
        © {new Date().getFullYear()} Frostrek Inc. · Enterprise AI Sales & Operations
      </footer>
    </div>
  );
}
