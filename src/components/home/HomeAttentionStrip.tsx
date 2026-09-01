"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Headphones,
  CalendarClock,
  MessageSquare,
} from "lucide-react";
import type { AnalyticsOverview } from "@/lib/types";

type Props = {
  overview: AnalyticsOverview | null;
};

/**
 * Peer-style "needs attention" strip — live ops counts from overview (not windowed).
 */
export function HomeAttentionStrip({ overview }: Props) {
  if (!overview) return null;

  const items = [
    {
      id: "handoffs",
      count: overview.handoffs_queued ?? 0,
      label: "Handoffs waiting",
      href: "/inbox",
      icon: Headphones,
      iconColor: "text-amber-500 dark:text-amber-400",
      iconBg: "bg-transparent border-transparent",
      hoverBorder: "hover:border-amber-500/40 hover:shadow-[0_6px_24px_rgba(245,158,11,0.15)]",
      countColor: "group-hover:text-amber-500 dark:group-hover:text-amber-400",
      arrowColor: "text-amber-500/50 group-hover:text-amber-500",
    },
    {
      id: "meetings",
      count: overview.meetings_pending_confirm ?? 0,
      label: "Meetings need confirm",
      href: "/meetings?filter=pending_approval",
      icon: CalendarClock,
      iconColor: "text-violet-500 dark:text-violet-400",
      iconBg: "bg-transparent border-transparent",
      hoverBorder: "hover:border-violet-500/40 hover:shadow-[0_6px_24px_rgba(139,92,246,0.15)]",
      countColor: "group-hover:text-violet-500 dark:group-hover:text-violet-400",
      arrowColor: "text-violet-500/50 group-hover:text-violet-500",
    },
    {
      id: "open",
      count: overview.conversations_open ?? 0,
      label: "Open conversations",
      href: "/inbox",
      icon: MessageSquare,
      iconColor: "text-sky-500 dark:text-sky-400",
      iconBg: "bg-transparent border-transparent",
      hoverBorder: "hover:border-sky-500/40 hover:shadow-[0_6px_24px_rgba(14,165,233,0.15)]",
      countColor: "group-hover:text-sky-500 dark:group-hover:text-sky-400",
      arrowColor: "text-sky-500/50 group-hover:text-sky-500",
    },
  ].filter((i) => i.count > 0);

  if (items.length === 0) return null;

  return (
    <div className="mb-8 sm:mb-10 relative overflow-hidden rounded-[28px] sm:rounded-[32px] border border-amber-500/20 bg-gradient-to-br from-amber-500/6 via-violet-500/4 to-transparent backdrop-blur-md p-5 sm:p-7 shadow-[0_0_30px_rgba(245,158,11,0.06)]">
      {/* Decorative glow orb */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
        {/* Left: Label + subtitle */}
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
          <div>
            <h2 className="text-sm sm:text-base font-extrabold font-sans text-foreground tracking-tight leading-tight">
              Needs Attention
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              {items.length} live item{items.length !== 1 ? "s" : ""} require your action
            </p>
          </div>
        </div>

        {/* Right: Action pill cards */}
        <div className="flex flex-wrap gap-3 sm:gap-3.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`group relative flex items-center gap-3 px-4 sm:px-5 py-3 rounded-[18px] bg-card border border-[var(--line)] ${item.hoverBorder} transition-all duration-200 active:scale-[0.98]`}
              >
                {/* Icon bubble */}
                <div
                  className={`w-7 h-7 flex items-center justify-center shrink-0 transition-all ${item.iconBg}`}
                >
                  <Icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span
                    className={`text-xl font-black font-sans text-foreground tabular-nums leading-none tracking-tight ${item.countColor} transition-colors`}
                  >
                    {item.count}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground mt-0.5 whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
                <ArrowRight
                  className={`w-3.5 h-3.5 ${item.arrowColor} group-hover:translate-x-0.5 transition-all ml-1 shrink-0`}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
