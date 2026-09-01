"use client";

import Link from "next/link";
import { Rocket, ArrowRight, CheckCircle2 } from "lucide-react";
import type { OnboardingStatus } from "@/lib/onboarding";

type Props = {
  status: OnboardingStatus | null;
  planChosen: boolean;
};

/**
 * Setup nudge when website go-live path is incomplete (D201).
 * Does not block the rest of Home from rendering.
 */
export function HomeSetupNudge({ status, planChosen }: Props) {
  if (!status) return null;
  if (status.allDone && planChosen) return null;

  const steps = [
    { ok: planChosen, label: "Choose a plan" },
    { ok: status.hasAgent, label: "Create an agent" },
    { ok: status.hasPublished, label: "Publish a version" },
    { ok: status.hasChannel, label: "Enable website channel" },
    { ok: status.hasTested, label: "Confirm sandbox preview" },
  ];
  const next = steps.find((s) => !s.ok);

  return (
    <div className="mb-6 rounded-2xl border border-[#0396A6]/25 bg-[#0396A6]/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-[#0396A6]/15 text-[#0396A6] flex items-center justify-center shrink-0">
          <Rocket className="w-5 h-5 text-[#0396A6]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground font-display">
            Finish setup to go live
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {next
              ? `Next: ${next.label}. Visitors will not get a published agent until setup is complete.`
              : "Almost there — open onboarding to confirm channels and install."}
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {steps.map((s) => (
              <li
                key={s.label}
                className={`text-[10px] font-semibold inline-flex items-center gap-1 ${
                  s.ok ? "text-[#0396A6]" : "text-muted-foreground"
                }`}
              >
                {s.ok ? <CheckCircle2 className="w-3 h-3 text-[#0396A6]" /> : <span className="w-3 h-3 rounded-full border border-current opacity-40" />}
                {s.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Link
        href="/home"
        className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0396A6] hover:bg-[#027D8A] text-white text-xs font-bold transition-all shadow-xs"
      >
        View setup checklist
        <ArrowRight className="w-3.5 h-3.5 text-white" />
      </Link>
    </div>
  );
}
