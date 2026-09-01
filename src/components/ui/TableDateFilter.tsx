'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronDown, Check, RotateCcw, X } from 'lucide-react';

export type TableDatePreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'week'
  | '14d'
  | 'month'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface TableDateFilterValue {
  preset: TableDatePreset;
  fromDate: string; // YYYY-MM-DD
  toDate: string;   // YYYY-MM-DD
  label: string;
}

export interface TableDateFilterProps {
  preset: TableDatePreset;
  fromDate?: string;
  toDate?: string;
  onChange: (value: TableDateFilterValue) => void;
  disabled?: boolean;
  className?: string;
}

export function formatDateIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return iso;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return iso || '';
  }
}

export function calculateDaysBetween(fromIso?: string, toIso?: string): number {
  if (!fromIso || !toIso) return 1;
  try {
    const d1 = new Date(fromIso + 'T00:00:00');
    const d2 = new Date(toIso + 'T00:00:00');
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  } catch {
    return 1;
  }
}

const PRESET_OPTIONS: { key: TableDatePreset; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'Past 7 Days' },
  { key: '14d', label: 'Past 14 Days' },
  { key: 'month', label: 'Past 30 Days' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
];

export function TableDateFilter({
  preset = 'all',
  fromDate = '',
  toDate = '',
  onChange,
  disabled = false,
  className = '',
}: TableDateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const todayIso = useMemo(() => formatDateIso(new Date()), []);

  // Local draft state for popover inputs
  const [draftPreset, setDraftPreset] = useState<TableDatePreset>(preset);
  const [draftFrom, setDraftFrom] = useState<string>(fromDate);
  const [draftTo, setDraftTo] = useState<string>(toDate);

  // Sync draft state on open or prop change
  useEffect(() => {
    setDraftPreset(preset);
    setDraftFrom(fromDate);
    setDraftTo(toDate);
  }, [preset, fromDate, toDate, isOpen]);

  // Click outside and Escape handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectPresetInDraft = (p: TableDatePreset) => {
    setDraftPreset(p);
    const now = new Date();
    if (p === 'all') {
      setDraftFrom('');
      setDraftTo('');
    } else if (p === 'today') {
      const iso = formatDateIso(now);
      setDraftFrom(iso);
      setDraftTo(iso);
    } else if (p === 'yesterday') {
      const y = new Date();
      y.setDate(now.getDate() - 1);
      const iso = formatDateIso(y);
      setDraftFrom(iso);
      setDraftTo(iso);
    } else if (p === 'week') {
      const start = new Date();
      start.setDate(now.getDate() - 6);
      setDraftFrom(formatDateIso(start));
      setDraftTo(formatDateIso(now));
    } else if (p === '14d') {
      const start = new Date();
      start.setDate(now.getDate() - 13);
      setDraftFrom(formatDateIso(start));
      setDraftTo(formatDateIso(now));
    } else if (p === 'month') {
      const start = new Date();
      start.setDate(now.getDate() - 29);
      setDraftFrom(formatDateIso(start));
      setDraftTo(formatDateIso(now));
    } else if (p === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setDraftFrom(formatDateIso(firstDay));
      setDraftTo(formatDateIso(now));
    } else if (p === 'last_month') {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setDraftFrom(formatDateIso(firstDayLastMonth));
      setDraftTo(formatDateIso(lastDayLastMonth));
    }
  };

  const handleApply = () => {
    let f = draftFrom;
    let t = draftTo;

    if (draftPreset === 'custom' || (!draftPreset && (f || t))) {
      if (f && t && f > t) {
        const swap = f;
        f = t;
        t = swap;
      }
    }

    let displayLabel = 'All Time';
    if (draftPreset === 'today') displayLabel = 'Today';
    else if (draftPreset === 'yesterday') displayLabel = 'Yesterday';
    else if (draftPreset === 'week') displayLabel = 'Past 7 Days';
    else if (draftPreset === '14d') displayLabel = 'Past 14 Days';
    else if (draftPreset === 'month') displayLabel = 'Past 30 Days';
    else if (draftPreset === 'this_month') displayLabel = 'This Month';
    else if (draftPreset === 'last_month') displayLabel = 'Last Month';
    else if (draftPreset === 'custom' || (f && t)) {
      displayLabel = f && t ? `${formatDisplayDate(f)} – ${formatDisplayDate(t)}` : f ? `From ${formatDisplayDate(f)}` : `Until ${formatDisplayDate(t)}`;
    }

    onChange({
      preset: draftPreset,
      fromDate: f,
      toDate: t,
      label: displayLabel,
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    setDraftPreset('all');
    setDraftFrom('');
    setDraftTo('');
    onChange({
      preset: 'all',
      fromDate: '',
      toDate: '',
      label: 'All Time',
    });
    setIsOpen(false);
  };

  const isActive = preset !== 'all' || Boolean(fromDate) || Boolean(toDate);

  const buttonLabel = useMemo(() => {
    if (preset === 'all' && !fromDate && !toDate) return 'All Time';
    if (preset === 'today') return 'Today';
    if (preset === 'yesterday') return 'Yesterday';
    if (preset === 'week') return 'Past 7 Days';
    if (preset === '14d') return 'Past 14 Days';
    if (preset === 'month') return 'Past 30 Days';
    if (preset === 'this_month') return 'This Month';
    if (preset === 'last_month') return 'Last Month';
    if (fromDate && toDate) return `${formatDisplayDate(fromDate)} – ${formatDisplayDate(toDate)}`;
    if (fromDate) return `From ${formatDisplayDate(fromDate)}`;
    if (toDate) return `Until ${formatDisplayDate(toDate)}`;
    return 'All Time';
  }, [preset, fromDate, toDate]);

  const customDays = useMemo(() => {
    if (draftFrom && draftTo) {
      return calculateDaysBetween(draftFrom, draftTo);
    }
    return null;
  }, [draftFrom, draftTo]);

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={popoverRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`h-8 sm:h-8.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
          isActive || isOpen
            ? 'bg-[#0396A6]/10 text-[#0396A6] border-[#0396A6] shadow-xs'
            : 'bg-white dark:bg-zinc-900 border-border text-foreground hover:bg-muted/40 hover:border-border'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Filter by date range"
        aria-label="Filter by date range"
      >
        <Calendar size={13} className="text-[#0396A6] shrink-0" />
        <span className="truncate max-w-[140px] sm:max-w-[190px]">{buttonLabel}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-150 text-muted-foreground shrink-0 ${
            isOpen ? 'rotate-180 text-[#0396A6]' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Card */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[320px] sm:w-[350px] bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl z-[100] p-4 animate-in fade-in zoom-in-95 duration-150 space-y-3.5 backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-bold text-xs">
                <Calendar size={13} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                Filter by Date
              </span>
            </div>
            {isActive && (
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] font-bold text-[#0396A6] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-1.5">
              Quick Presets
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {PRESET_OPTIONS.map((p) => {
                const isSelected = draftPreset === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => selectPresetInDraft(p.key)}
                    className={`py-1.5 px-1.5 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#0396A6] text-white shadow-xs'
                        : 'bg-muted/20 hover:bg-[#0396A6]/10 text-slate-700 dark:text-zinc-300 hover:text-[#0396A6] border border-border/50'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Pickers */}
          <div className="space-y-2 bg-[#F7FDFD] dark:bg-zinc-950/50 p-3 rounded-xl border border-[#D9EDEE] dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Custom Range
              </span>
              {customDays !== null && (
                <span className="text-[10px] font-bold text-[#0396A6]">
                  {customDays} {customDays === 1 ? 'day' : 'days'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9.5px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={draftFrom}
                  max={draftTo || todayIso}
                  onChange={(e) => {
                    setDraftFrom(e.target.value);
                    setDraftPreset('custom');
                  }}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-foreground outline-none focus:border-[#0396A6] focus:ring-1 focus:ring-[#0396A6]"
                />
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={draftTo}
                  min={draftFrom}
                  max={todayIso}
                  onChange={(e) => {
                    setDraftTo(e.target.value);
                    setDraftPreset('custom');
                  }}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-foreground outline-none focus:border-[#0396A6] focus:ring-1 focus:ring-[#0396A6]"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 bg-[#0396A6] hover:bg-[#028391] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check size={13} />
              <span>Apply</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
