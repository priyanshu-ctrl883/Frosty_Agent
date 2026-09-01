"use client";

import React, { useEffect } from "react";
import { X, Filter, RotateCcw, Calendar, Users, Layers, Check } from "lucide-react";
import { ACTIVITY_GROUPS, type ActivityGroup } from "@/lib/activityCopy";
import type { Team } from "@/lib/types";

export type RangeId = "7d" | "30d" | "90d" | "all";

export const RANGES = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "all", label: "All time", days: 0 },
] as const;

interface ActivityFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  range: RangeId;
  setRange: (r: RangeId) => void;
  group: ActivityGroup;
  setGroup: (g: ActivityGroup) => void;
  actorId: string;
  setActorId: (id: string) => void;
  members: Team["members"];
  onClear: () => void;
  activeFilterCount: number;
}

export function ActivityFilterSheet({
  isOpen,
  onClose,
  range,
  setRange,
  group,
  setGroup,
  actorId,
  setActorId,
  members,
  onClear,
  activeFilterCount,
}: ActivityFilterSheetProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300 ease-out border border-[var(--line)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
      >
        {/* Drag Handle (Mobile) */}
        <div className="sm:hidden w-full flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[var(--line)] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#0396A6]" />
            <h2 id="filter-sheet-title" className="text-base font-bold text-[var(--ink)]">
              Filter Activity
            </h2>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#EAF8F8] text-[#0396A6]">
                {activeFilterCount} active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-semibold text-[#0396A6] hover:underline flex items-center gap-1 px-2 py-1 rounded"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line-soft)] transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 1. Date Range */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
              <Calendar className="w-3.5 h-3.5 text-[#0396A6]" />
              <span>Timeframe</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RANGES.map((r) => {
                const active = range === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRange(r.id)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      active
                        ? "bg-[#EAF8F8] border-[#0396A6] text-[#0396A6] shadow-xs"
                        : "bg-white border-[var(--line)] text-[var(--ink)] hover:border-slate-300"
                    }`}
                  >
                    <span>{r.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-[#0396A6]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Category / Action Group */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
              <Layers className="w-3.5 h-3.5 text-[#0396A6]" />
              <span>Action Category</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {ACTIVITY_GROUPS.map((g) => {
                const active = group === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGroup(g.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                      active
                        ? "bg-[#EAF8F8] border-[#0396A6] text-[#0396A6] shadow-xs"
                        : "bg-white border-[var(--line)] text-[var(--ink)] hover:border-slate-300"
                    }`}
                  >
                    <span className="truncate">{g.id === "all" ? "All categories" : g.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-[#0396A6] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Team Member / Performed By */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
              <Users className="w-3.5 h-3.5 text-[#0396A6]" />
              <span>Performed By</span>
            </label>
            <select
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-[var(--line)] bg-white text-sm font-semibold text-[var(--ink)] focus:border-[#0396A6] focus:ring-1 focus:ring-[#0396A6] outline-none"
            >
              <option value="">All users & bots</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name ? `${m.display_name} (${m.email})` : m.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-container-lowest)] flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClear}
            className="flex-1 py-2.5 text-xs font-bold text-[var(--ink)] bg-[var(--surface-container-low)] hover:bg-[var(--line)] rounded-xl transition-colors"
          >
            Reset Filters
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold text-white bg-[#0396A6] hover:bg-[#087681] rounded-xl transition-all shadow-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
