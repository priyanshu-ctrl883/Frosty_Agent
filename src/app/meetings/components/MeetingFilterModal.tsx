'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Check, Calendar } from 'lucide-react';
import { formatDateIso } from '@/components/ui/TableDateFilter';
import type { FilterStatus, ChannelTag, ViewMode } from './MeetingToolbar';

interface MeetingFilterModalProps {
  open: boolean;
  onClose: () => void;
  filterStatus: FilterStatus;
  onFilterStatusChange: (status: FilterStatus) => void;
  channelFilter: ChannelTag;
  onChannelFilterChange: (channel: ChannelTag) => void;
  fromDate?: string;
  onFromDateChange?: (d: string) => void;
  toDate?: string;
  onToDateChange?: (d: string) => void;
  viewMode: ViewMode;
}

const STATUS_OPTIONS: { id: FilterStatus; label: string }[] = [
  { id: 'all', label: 'All Statuses' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'pending_approval', label: 'Pending Approval' },
  { id: 'rescheduled', label: 'Rescheduled' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const CHANNEL_OPTIONS: { id: ChannelTag; label: string }[] = [
  { id: 'all', label: 'All Channels' },
  { id: 'web', label: 'Web Agent' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'unified', label: 'Unified' },
];

const openDatePicker = (input: HTMLInputElement | null) => {
  if (!input) return;
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker();
      return;
    } catch {
      // showPicker can throw if not triggered by user gesture
    }
  }
  input.focus();
  input.click();
};

type DatePickerFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
};

const formatDateDisplay = (iso: string): string => {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return '';
  return `${day}-${month}-${year}`;
};

const DatePickerField = ({ id, label, value, onChange, min, max }: DatePickerFieldProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const displayValue = formatDateDisplay(value);

  return (
    <label
      htmlFor={id}
      className="relative block bg-[#F7FBFB] p-2.5 rounded-xl border border-border cursor-pointer hover:bg-[#EAF8F8] transition-colors min-h-[4.25rem]"
    >
      <span className="block text-[10px] text-muted-foreground font-black uppercase mb-1 pointer-events-none select-none">
        {label}
      </span>
      <div className="flex items-center justify-between gap-2 pointer-events-none select-none">
        <span
          className={`text-xs font-bold truncate ${
            displayValue ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {displayValue || 'dd-mm-yyyy'}
        </span>
        <Calendar size={16} className="shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <input
        ref={inputRef}
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => openDatePicker(inputRef.current)}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        aria-label={label.replace(':', '')}
      />
    </label>
  );
};

export function MeetingFilterModal({
  open,
  onClose,
  filterStatus,
  onFilterStatusChange,
  channelFilter,
  onChannelFilterChange,
  fromDate = '',
  onFromDateChange,
  toDate = '',
  onToDateChange,
  viewMode,
}: MeetingFilterModalProps) {
  // Temporary state for pending filter selection before applying
  const [tempStatus, setTempStatus] = React.useState<FilterStatus>(filterStatus);
  const [tempChannel, setTempChannel] = React.useState<ChannelTag>(channelFilter);
  const [tempFromDate, setTempFromDate] = React.useState<string>(fromDate);
  const [tempToDate, setTempToDate] = React.useState<string>(toDate);

  // Sync state when opening
  React.useEffect(() => {
    if (open) {
      setTempStatus(filterStatus);
      setTempChannel(channelFilter);
      setTempFromDate(fromDate);
      setTempToDate(toDate);
    }
  }, [open, filterStatus, channelFilter, fromDate, toDate]);

  if (!open) return null;

  const activeCount =
    (tempStatus !== 'all' ? 1 : 0) +
    (tempChannel !== 'all' ? 1 : 0) +
    (tempFromDate || tempToDate ? 1 : 0);

  const handleResetAll = () => {
    setTempStatus('all');
    setTempChannel('all');
    setTempFromDate('');
    setTempToDate('');
  };

  const handleApply = () => {
    onFilterStatusChange(tempStatus);
    onChannelFilterChange(tempChannel);
    if (onFromDateChange) onFromDateChange(tempFromDate);
    if (onToDateChange) onToDateChange(tempToDate);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Modal Sheet Content */}
        <motion.div
          initial={{ y: '100%', opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border overflow-hidden z-[1001] flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border bg-[#F7FBFB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                  Filter Meetings
                </h3>
                <p className="text-[11px] text-muted-foreground font-semibold">
                  {activeCount > 0 ? `${activeCount} filter(s) active` : 'No filters applied'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 divide-y divide-border/60">
            {/* Section 1: Meeting Status */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-2.5">
                Meeting Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected = tempStatus === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTempStatus(opt.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0396A6] text-white border-[#0396A6] shadow-xs'
                          : 'bg-[#F7FBFB] text-foreground border-border hover:bg-[#EAF8F8]'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Agent / Channel */}
            <div className="pt-4">
              <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-2.5">
                Agent / Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CHANNEL_OPTIONS.map((ch) => {
                  const isSelected = tempChannel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setTempChannel(ch.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0396A6] text-white border-[#0396A6] shadow-xs'
                          : 'bg-[#F7FBFB] text-foreground border-border hover:bg-[#EAF8F8]'
                      }`}
                    >
                      <span className="truncate">{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Date Range */}
            <div className="pt-4">
              <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-2.5">
                Date Range
              </label>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                {[
                  {
                    label: 'All Time',
                    action: () => {
                      setTempFromDate('');
                      setTempToDate('');
                    },
                    active: !tempFromDate && !tempToDate,
                  },
                  {
                    label: 'Today',
                    action: () => {
                      const iso = formatDateIso(new Date());
                      setTempFromDate(iso);
                      setTempToDate(iso);
                    },
                    active: tempFromDate === formatDateIso(new Date()) && tempToDate === formatDateIso(new Date()),
                  },
                  {
                    label: '7 Days',
                    action: () => {
                      const now = new Date();
                      const start = new Date();
                      start.setDate(now.getDate() - 6);
                      setTempFromDate(formatDateIso(start));
                      setTempToDate(formatDateIso(now));
                    },
                    active: false,
                  },
                  {
                    label: '30 Days',
                    action: () => {
                      const now = new Date();
                      const start = new Date();
                      start.setDate(now.getDate() - 29);
                      setTempFromDate(formatDateIso(start));
                      setTempToDate(formatDateIso(now));
                    },
                    active: false,
                  },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={p.action}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      p.active
                        ? 'bg-[#0396A6] text-white border-[#0396A6]'
                        : 'bg-[#F7FBFB] text-foreground border-border hover:bg-[#EAF8F8]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <DatePickerField
                  id="meeting-filter-from-date"
                  label="From Date:"
                  value={tempFromDate}
                  max={tempToDate || undefined}
                  onChange={setTempFromDate}
                />
                <DatePickerField
                  id="meeting-filter-to-date"
                  label="To Date:"
                  value={tempToDate}
                  min={tempFromDate || undefined}
                  onChange={setTempToDate}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-border bg-[#F7FBFB] flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border bg-white hover:bg-slate-50 text-foreground font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-2 py-2.5 px-4 rounded-xl bg-[#0396A6] hover:bg-[#087681] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(3,150,166,0.3)] active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check size={14} />
              <span>Apply Filters {activeCount > 0 ? `(${activeCount})` : ''}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
