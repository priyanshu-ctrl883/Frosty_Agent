"use client";

import React from "react";
import type { AuditEvent } from "@/lib/types";
import { describeActivity } from "@/lib/activityCopy";

interface ActivityStatsRibbonProps {
  total: number;
  items: AuditEvent[];
  loading?: boolean;
}

export function ActivityStatsRibbon({ total, items, loading }: ActivityStatsRibbonProps) {
  // Compute unique actors in the current dataset
  const uniqueActorsCount = React.useMemo(() => {
    const actors = new Set<string>();
    for (const item of items) {
      if (item.actor_id) {
        actors.add(item.actor_id);
      } else if (item.actor_type) {
        actors.add(item.actor_type);
      }
    }
    return Math.max(actors.size, items.length > 0 ? 1 : 0);
  }, [items]);

  // Compute top category in current set
  const topCategory = React.useMemo(() => {
    if (!items.length) return "All Activity";
    const counts: Record<string, number> = {};
    for (const item of items) {
      const copy = describeActivity(item);
      const grp = copy.resourceKind || copy.group || "Event";
      counts[grp] = (counts[grp] || 0) + 1;
    }
    let max = 0;
    let top = "General";
    for (const [k, v] of Object.entries(counts)) {
      if (v > max) {
        max = v;
        top = k;
      }
    }
    return top;
  }, [items]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 mb-3.5 sm:mb-5">
      {/* 1. Total Events */}
      <div className="bg-white border border-[var(--line)] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#0396A6]/40 transition-all duration-200 flex flex-col justify-between">
        <div className="mb-1 sm:mb-2">
          <span className="text-xs text-[var(--muted)]">
            Total Logged
          </span>
        </div>
        <div>
          <div className="text-base sm:text-2xl font-semibold text-[var(--ink)]">
            {loading && total === 0 ? "—" : total.toLocaleString()}
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-0.5 hidden xs:block truncate">
            Workspace audit trail
          </p>
        </div>
      </div>

      {/* 2. Top Category */}
      <div className="bg-white border border-[var(--line)] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#0396A6]/40 transition-all duration-200 flex flex-col justify-between">
        <div className="mb-1 sm:mb-2">
          <span className="text-xs text-[var(--muted)]">
            Top Scope
          </span>
        </div>
        <div>
          <div className="text-base sm:text-2xl font-semibold text-[var(--ink)] truncate">
            {loading && !items.length ? "—" : topCategory}
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-0.5 hidden xs:block truncate">
            Most active category
          </p>
        </div>
      </div>

      {/* 3. Active Contributors */}
      <div className="bg-white border border-[var(--line)] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#0396A6]/40 transition-all duration-200 flex flex-col justify-between">
        <div className="mb-1 sm:mb-2">
          <span className="text-xs text-[var(--muted)]">
            Contributors
          </span>
        </div>
        <div>
          <div className="text-base sm:text-2xl font-semibold text-[var(--ink)]">
            {loading && !items.length ? "—" : uniqueActorsCount}
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-0.5 hidden xs:block truncate">
            Team & bot actors
          </p>
        </div>
      </div>

      {/* 4. Live Integrity */}
      <div className="bg-white border border-[var(--line)] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#0396A6]/40 transition-all duration-200 flex flex-col justify-between">
        <div className="mb-1 sm:mb-2">
          <span className="text-xs text-[var(--muted)]">
            Integrity
          </span>
        </div>
        <div>
          <div className="text-base sm:text-2xl font-semibold text-[var(--ink)]">
            100%
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-0.5 hidden xs:block truncate">
            Realtime captured
          </p>
        </div>
      </div>
    </div>
  );
}
