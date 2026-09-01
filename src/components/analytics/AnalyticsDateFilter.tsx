"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Calendar, ChevronDown, Check, RotateCcw, X, Clock } from "lucide-react";
import { TimelineFilter } from "@/components/ui/TimelineFilter";

export interface DateRangeValue {
  days: number;
  fromDate: string; // YYYY-MM-DD
  toDate: string;   // YYYY-MM-DD
  label?: string;
}

export interface AnalyticsDateFilterProps {
  days: number;
  fromDate?: string;
  toDate?: string;
  onChange: (range: DateRangeValue) => void;
  disabled?: boolean;
  className?: string;
}

function formatDateIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(iso: string): string {
  if (!iso) return "";
  try {
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return iso;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function calculateDaysBetween(fromIso: string, toIso: string): number {
  if (!fromIso || !toIso) return 7;
  try {
    const p1 = fromIso.split("-");
    const p2 = toIso.split("-");
    if (p1.length !== 3 || p2.length !== 3) return 7;
    const y1 = Number(p1[0]);
    const m1 = Number(p1[1]);
    const d1 = Number(p1[2]);
    const y2 = Number(p2[0]);
    const m2 = Number(p2[1]);
    const d2 = Number(p2[2]);
    if (isNaN(y1) || isNaN(m1) || isNaN(d1) || isNaN(y2) || isNaN(m2) || isNaN(d2)) return 7;
    const date1 = new Date(y1, m1 - 1, d1);
    const date2 = new Date(y2, m2 - 1, d2);
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, Math.min(365, diffDays));
  } catch {
    return 7;
  }
}

const PRESET_BUTTONS = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

export function AnalyticsDateFilter({
  days,
  fromDate,
  toDate,
  onChange,
  disabled = false,
  className = "",
}: AnalyticsDateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const todayIso = useMemo(() => formatDateIso(new Date()), []);

  // Compute effective current from/to
  const effectiveToDate = toDate || todayIso;
  const effectiveFromDate = useMemo(() => {
    if (fromDate) return fromDate;
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    return formatDateIso(d);
  }, [fromDate, days]);

  // Local draft state for popover inputs
  const [tempFromDate, setTempFromDate] = useState<string>(effectiveFromDate);
  const [tempToDate, setTempToDate] = useState<string>(effectiveToDate);
  const [tempPreset, setTempPreset] = useState<string | null>(null);

  // Sync draft state when opened or props change
  useEffect(() => {
    setTempFromDate(effectiveFromDate);
    setTempToDate(effectiveToDate);
  }, [effectiveFromDate, effectiveToDate, isOpen]);

  // Handle outside click & escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isPresetActive = (numDays: number) => {
    return (
      days === numDays &&
      effectiveToDate === todayIso &&
      calculateDaysBetween(effectiveFromDate, effectiveToDate) === numDays
    );
  };

  const handleQuickPresetClick = (presetDays: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (presetDays - 1));

    const fIso = formatDateIso(start);
    const tIso = formatDateIso(end);

    onChange({
      days: presetDays,
      fromDate: fIso,
      toDate: tIso,
      label: `${presetDays}d`,
    });
    setIsOpen(false);
  };

  const applyCustomPresetInPopover = (presetKey: string) => {
    setTempPreset(presetKey);
    const now = new Date();

    if (presetKey === "today") {
      const iso = formatDateIso(now);
      setTempFromDate(iso);
      setTempToDate(iso);
    } else if (presetKey === "yesterday") {
      const y = new Date();
      y.setDate(now.getDate() - 1);
      const iso = formatDateIso(y);
      setTempFromDate(iso);
      setTempToDate(iso);
    } else if (presetKey === "7d") {
      const start = new Date();
      start.setDate(now.getDate() - 6);
      setTempFromDate(formatDateIso(start));
      setTempToDate(formatDateIso(now));
    } else if (presetKey === "14d") {
      const start = new Date();
      start.setDate(now.getDate() - 13);
      setTempFromDate(formatDateIso(start));
      setTempToDate(formatDateIso(now));
    } else if (presetKey === "30d") {
      const start = new Date();
      start.setDate(now.getDate() - 29);
      setTempFromDate(formatDateIso(start));
      setTempToDate(formatDateIso(now));
    } else if (presetKey === "90d") {
      const start = new Date();
      start.setDate(now.getDate() - 89);
      setTempFromDate(formatDateIso(start));
      setTempToDate(formatDateIso(now));
    } else if (presetKey === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setTempFromDate(formatDateIso(firstDay));
      setTempToDate(formatDateIso(now));
    } else if (presetKey === "last_month") {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setTempFromDate(formatDateIso(firstDayLastMonth));
      setTempToDate(formatDateIso(lastDayLastMonth));
    }
  };

  const calculatedDraftDays = useMemo(() => {
    return calculateDaysBetween(tempFromDate, tempToDate);
  }, [tempFromDate, tempToDate]);

  const handleApply = () => {
    let f = tempFromDate;
    let t = tempToDate;

    // Safety fallback
    if (!f || !t) {
      f = effectiveFromDate;
      t = effectiveToDate;
    }

    // Ensure f <= t
    if (f > t) {
      const swap = f;
      f = t;
      t = swap;
    }

    const calculated = calculateDaysBetween(f, t);

    onChange({
      days: calculated,
      fromDate: f,
      toDate: t,
      label: `${formatDisplayDate(f)} – ${formatDisplayDate(t)}`,
    });
    setIsOpen(false);
  };

  const isCustomRangeActive = !PRESET_BUTTONS.some((p) => isPresetActive(p.days));

  const displayRangeLabel = `${formatDisplayDate(effectiveFromDate)} – ${formatDisplayDate(effectiveToDate)}`;

  return (
    <div className={`relative inline-flex items-center gap-2.5 flex-wrap ${className}`} ref={popoverRef}>
      {/* 1. Date Range Picker Trigger Button (on the left) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 flex items-center gap-2 px-3.5 rounded-full border text-xs font-bold transition-all duration-150 shadow-2xs cursor-pointer ${isCustomRangeActive || isOpen
            ? "bg-[#EAF8F8] dark:bg-[#0396A6]/15 border-[#0396A6] text-[#0396A6]"
            : "bg-white dark:bg-zinc-900 border-[#D9EDEE] dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-[#0396A6] hover:text-[#0396A6]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        title="Custom date range filter (From Date to To Date)"
      >
        <Calendar className="w-3.5 h-3.5 text-[#0396A6] shrink-0" />
        <span className="truncate max-w-[150px] sm:max-w-[200px]">
          {displayRangeLabel}
        </span>
        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#0396A6]/10 text-[#0396A6] shrink-0">
          {days}d
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-[#0396A6]" : "text-slate-400"
            }`}
        />
      </button>

      {/* 2. Quick Preset Buttons (7 Days, 14 Days, 30 Days, 90 Days) */}
      <TimelineFilter
        value={days}
        onChange={handleQuickPresetClick}
        disabled={disabled}
      />

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[340px] sm:w-[380px] bg-white dark:bg-zinc-900 border border-[#D9EDEE] dark:border-zinc-800 rounded-2xl shadow-2xl z-[100] p-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D9EDEE] dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EAF8F8] dark:bg-[#0396A6]/20 text-[#0396A6] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Day by Day Filter
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  Select start and end dates
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Preset Chips */}
          <div className="mb-3.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
              Quick Presets
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { key: "today", label: "Today" },
                { key: "yesterday", label: "Yesterday" },
                { key: "7d", label: "7 Days" },
                { key: "14d", label: "14 Days" },
                { key: "30d", label: "30 Days" },
                { key: "90d", label: "90 Days" },
                { key: "this_month", label: "This Month" },
                { key: "last_month", label: "Last Month" },
              ].map((p) => {
                const isSelected = tempPreset === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => applyCustomPresetInPopover(p.key)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${isSelected
                        ? "bg-[#0396A6] text-white shadow-xs"
                        : "bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-[#EAF8F8] dark:hover:bg-[#0396A6]/20 hover:text-[#0396A6]"
                      }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Pickers */}
          <div className="space-y-2.5 mb-3.5 bg-[#F7FDFD] dark:bg-zinc-950/50 p-3 rounded-xl border border-[#D9EDEE] dark:border-zinc-800">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-extrabold text-[#0396A6] uppercase tracking-wider block mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={tempFromDate}
                  max={tempToDate || todayIso}
                  onChange={(e) => {
                    setTempFromDate(e.target.value);
                    setTempPreset(null);
                  }}
                  className="w-full bg-white dark:bg-zinc-900 border border-[#D9EDEE] dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-[#0396A6] focus:ring-1 focus:ring-[#0396A6]"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-[#0396A6] uppercase tracking-wider block mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={tempToDate}
                  min={tempFromDate}
                  max={todayIso}
                  onChange={(e) => {
                    setTempToDate(e.target.value);
                    setTempPreset(null);
                  }}
                  className="w-full bg-white dark:bg-zinc-900 border border-[#D9EDEE] dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-[#0396A6] focus:ring-1 focus:ring-[#0396A6]"
                />
              </div>
            </div>

            {/* Calculated Window Notice */}
            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 dark:text-zinc-400 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#0396A6]" />
                Duration:
              </span>
              <span className="font-bold text-[#0396A6]">
                {calculatedDraftDays} {calculatedDraftDays === 1 ? "day" : "days"} (
                {formatDisplayDate(tempFromDate)} – {formatDisplayDate(tempToDate)})
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                applyCustomPresetInPopover("7d");
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset (7d)
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0396A6] hover:bg-[#027582] text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Filter ({calculatedDraftDays}d)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
