'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  ExternalLink,
  Mail,
  User,
  Video,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Meeting } from '@/lib/types';
import type { ViewMode } from './MeetingToolbar';

const STATUS_CHIP_COLORS: Record<string, string> = {
  confirmed: 'bg-[#0396A6]/15 text-[#0396A6] border-[#0396A6]/30',
  scheduled: 'bg-[#0396A6]/15 text-[#0396A6] border-[#0396A6]/30',
  pending_approval: 'bg-[#0396A6]/15 text-[#0396A6] border-[#0396A6]/30',
  completed: 'bg-[#0396A6]/15 text-[#0396A6] border-[#0396A6]/30',
  cancelled: 'bg-[#0396A6]/15 text-[#0396A6] border-[#0396A6]/30',
  rescheduled: 'bg-[#0396A6]/15 text-[#0396A6] border-[#0396A6]/30',
};

const STATUS_DOT_COLORS: Record<string, string> = {
  confirmed: 'bg-[#0396A6]',
  scheduled: 'bg-[#0396A6]',
  pending_approval: 'bg-[#0396A6]',
  completed: 'bg-[#0396A6]',
  cancelled: 'bg-[#0396A6]',
  rescheduled: 'bg-[#0396A6]',
};

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'pine' | 'warm'> = {
  scheduled: 'info',
  confirmed: 'success',
  pending_approval: 'warm',
  cancelled: 'danger',
  completed: 'pine',
  no_show: 'neutral',
  rescheduled: 'warning',
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  pending_approval: 'Pending Approval',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No Show',
  rescheduled: 'Rescheduled',
};

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

function formatHour(h: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const num = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${num} ${period}`;
}

function formatTimePart(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

type Props = {
  viewMode: ViewMode;
  currentDate: Date;
  meetings: Meeting[];
  fromDate?: string;
  toDate?: string;
  onSelectMeeting: (m: Meeting) => void;
  onCreateAtDate?: (d: Date) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  busy?: boolean;
  loading?: boolean;
};

export function MeetingCalendarView({
  viewMode,
  currentDate,
  meetings,
  fromDate = '',
  toDate = '',
  onSelectMeeting,
  onCreateAtDate,
  hasMore,
  onLoadMore,
  busy,
  loading = false,
}: Props) {
  const today = React.useMemo(() => new Date(), []);

  // Helper to check if a day falls within the active from-to range in Week view
  const isDateInRange = React.useCallback(
    (d: Date): boolean => {
      const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (fromDate) {
        const [y, m, day] = fromDate.split('-').map(Number);
        const fromMidnight = new Date(y!, m! - 1, day!).getTime();
        if (dMidnight < fromMidnight) return false;
      }
      if (toDate) {
        const [y, m, day] = toDate.split('-').map(Number);
        const toMidnight = new Date(y!, m! - 1, day!, 23, 59, 59, 999).getTime();
        if (dMidnight > toMidnight) return false;
      }
      return true;
    },
    [fromDate, toDate]
  );

  /* ── Month Grid Computations ──────────────────────────────────────────────── */
  const monthData = React.useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLast - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill standard 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  /* ── Week Grid Computations (Directly spans selected range when fromDate is set) ── */
  const weekDays = React.useMemo(() => {
    if (fromDate) {
      const [y, m, day] = fromDate.split('-').map(Number);
      const start = new Date(y!, m! - 1, day!);
      const days: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        days.push(d);
      }
      return days;
    }

    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate, fromDate]);

  /* ── Filter Meetings for Specific Date ────────────────────────────────────── */
  function getMeetingsForDate(d: Date): Meeting[] {
    return meetings.filter((m) => {
      const start = new Date(m.scheduled_start);
      return (
        start.getFullYear() === d.getFullYear() &&
        start.getMonth() === d.getMonth() &&
        start.getDate() === d.getDate()
      );
    });
  }

  /* ── Skeleton Loading Grid ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="grid grid-cols-7 border-b border-border bg-[#F7FBFB]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name) => (
            <div
              key={name}
              className="py-2.5 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              <span className="hidden sm:inline">{name}</span>
              <span className="sm:hidden">{name.charAt(0)}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[75px] sm:min-h-[110px] p-1.5 sm:p-2 bg-white flex flex-col gap-1.5">
              <div className="w-5 h-5 rounded-full bg-slate-100 animate-pulse" />
              <div className="w-full h-4 rounded-md bg-slate-100 animate-pulse hidden sm:block" />
              <div className="w-3/4 h-4 rounded-md bg-slate-50 animate-pulse hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── 1. Month View (Google Calendar Style with Mobile Horizontal Scroll) ───── */
  if (viewMode === 'month') {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-2xl border border-border overflow-x-auto shadow-xs">
        <div className="min-w-[620px] sm:min-w-0">
          {/* Day Name Headers */}
          <div className="grid grid-cols-7 border-b border-border bg-[#F7FBFB]">
            {dayNames.map((name) => (
              <div
                key={name}
                className="py-2 sm:py-2.5 text-center text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none"
              >
                <span>{name}</span>
              </div>
            ))}
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border border-b border-border">
            {monthData.map(({ date, isCurrentMonth }, idx) => {
              const isToday = date.toDateString() === today.toDateString();
              const isGrayedOut = !isCurrentMonth;

              const dayMeetings = getMeetingsForDate(date);
              const visibleMeetings = dayMeetings.slice(0, 3);
              const hiddenCount = Math.max(0, dayMeetings.length - 3);

              return (
                <div
                  key={idx}
                  className={`min-h-[85px] sm:min-h-[115px] p-1.5 sm:p-2 flex flex-col gap-1 transition-all overflow-hidden ${
                    isGrayedOut
                      ? 'bg-[#F1F5F9]/85 opacity-50 grayscale select-none cursor-not-allowed'
                      : isToday
                      ? 'bg-[#0396A6]/5 cursor-pointer hover:bg-[#0396A6]/10'
                      : 'bg-white hover:bg-[#EAF8F8]/40 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!isGrayedOut) onCreateAtDate?.(date);
                  }}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full select-none ${
                        isToday && !isGrayedOut
                          ? 'bg-[#0396A6] text-white font-black shadow-xs'
                          : !isGrayedOut
                          ? 'text-foreground'
                          : 'text-slate-400 font-normal'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Mobile & Desktop Event Chips */}
                  {!isGrayedOut && (
                    <div className="flex flex-col gap-1 overflow-hidden">
                      {visibleMeetings.map((m) => {
                        const colorClass = STATUS_CHIP_COLORS[m.status] || 'bg-[#0396A6]/15 text-[#0396A6] border-[#0396A6]/30';
                        return (
                          <div
                            key={m.id}
                            className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-[10.5px] sm:text-[11px] font-bold border transition-all cursor-pointer truncate flex items-center gap-1 shadow-2xs hover:opacity-90 ${colorClass}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectMeeting(m);
                            }}
                            title={`${m.title} (${formatTimePart(m.scheduled_start)}) - ${m.attendee_name || m.attendee_email || 'Customer'}`}
                          >
                            <span className="text-[10px] font-medium opacity-80 shrink-0">
                              {formatTimePart(m.scheduled_start)}
                            </span>
                            <span className="truncate">{m.title}</span>
                          </div>
                        );
                      })}

                      {hiddenCount > 0 && (
                        <div
                          className="text-[10px] sm:text-[10.5px] font-bold text-[#0396A6] hover:underline px-1 py-0.5 cursor-pointer select-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (dayMeetings[0]) onSelectMeeting(dayMeetings[0]);
                          }}
                        >
                          +{hiddenCount} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ── 2. Week View (Compact Centered Times & Selected Week Range Highlights) ── */
  if (viewMode === 'week') {
    const hasCustomRange = Boolean(fromDate || toDate);

    return (
      <div className="bg-white rounded-2xl border border-border overflow-x-auto shadow-xs">
        <div className="min-w-[680px]">
          {/* Header Row */}
          <div className="grid grid-cols-8 border-b border-border bg-[#F7FBFB]">
            <div className="p-2 sm:p-2.5 text-center flex items-center justify-center text-xs font-bold text-muted-foreground uppercase border-r border-border sticky left-0 bg-[#F7FBFB] z-10 select-none">
              Time
            </div>
            {weekDays.map((d, i) => {
              const isToday = d.toDateString() === today.toDateString();
              const inRange = isDateInRange(d);
              const isDayGrayed = hasCustomRange && !inRange;

              return (
                <div
                  key={i}
                  className={`p-2 sm:p-2.5 text-center border-r border-border last:border-r-0 transition-colors ${
                    isDayGrayed
                      ? 'bg-[#F1F5F9]/85 text-slate-400 opacity-60'
                      : isToday
                      ? 'bg-[#0396A6]/10 text-[#0396A6]'
                      : 'bg-white text-foreground'
                  }`}
                >
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase">
                    {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                  </div>
                  <div className="text-xs sm:text-sm font-black">{d.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Hourly Slots (Reduced height & centered times) */}
          <div className="divide-y divide-border">
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-8 min-h-[42px]">
                {/* Centered Time Label */}
                <div className="flex items-center justify-center text-center p-1 text-[11px] font-semibold text-muted-foreground bg-[#F7FBFB]/90 border-r border-border select-none sticky left-0 z-10">
                  {formatHour(hour)}
                </div>

                {weekDays.map((d, dayIdx) => {
                  const inRange = isDateInRange(d);
                  const isDayGrayed = hasCustomRange && !inRange;

                  const dayMeetings = getMeetingsForDate(d);
                  const hourMeetings = dayMeetings.filter((m) => {
                    const s = new Date(m.scheduled_start);
                    return s.getHours() === hour;
                  });

                  return (
                    <div
                      key={dayIdx}
                      className={`p-1 border-r border-border last:border-r-0 transition-colors relative min-h-[42px] ${
                        isDayGrayed
                          ? 'bg-[#F1F5F9]/70 opacity-40 pointer-events-none cursor-not-allowed'
                          : 'hover:bg-[#EAF8F8]/30 cursor-pointer bg-white'
                      }`}
                      onClick={() => {
                        if (!isDayGrayed) {
                          const slotDate = new Date(d);
                          slotDate.setHours(hour, 0, 0, 0);
                          onCreateAtDate?.(slotDate);
                        }
                      }}
                    >
                      {!isDayGrayed &&
                        hourMeetings.map((m) => {
                          const colorClass = STATUS_CHIP_COLORS[m.status] || 'bg-[#0396A6]/15 text-[#0396A6] border-[#0396A6]/30';
                          return (
                            <div
                              key={m.id}
                              className={`p-1 rounded-md border text-[11px] font-bold cursor-pointer transition-all shadow-2xs mb-0.5 ${colorClass}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectMeeting(m);
                              }}
                              title={`${m.title} (${formatTimePart(m.scheduled_start)})`}
                            >
                              <div className="truncate font-bold leading-tight">{m.title}</div>
                              <div className="text-[9.5px] opacity-80 leading-tight">{formatTimePart(m.scheduled_start)}</div>
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── 3. Day View ──────────────────────────────────────────────────────────── */
  const dayMeetings = getMeetingsForDate(currentDate);

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-xs">
      <div className="p-3 sm:p-3.5 border-b border-border bg-[#F7FBFB] flex items-center justify-between flex-wrap gap-2">
        <span className="font-extrabold text-xs sm:text-sm text-foreground">
          {currentDate.toLocaleDateString('en-IN', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <span className="text-xs font-bold text-muted-foreground">
          {dayMeetings.length} {dayMeetings.length === 1 ? 'meeting' : 'meetings'}
        </span>
      </div>

      <div className="divide-y divide-border">
        {HOURS.map((hour) => {
          const hourMeetings = dayMeetings.filter((m) => {
            const s = new Date(m.scheduled_start);
            return s.getHours() === hour;
          });

          return (
            <div key={hour} className="flex min-h-[48px]">
              {/* Centered Hour */}
              <div className="w-16 sm:w-20 p-2 flex items-center justify-center text-center text-xs font-semibold text-muted-foreground bg-[#F7FBFB]/50 border-r border-border shrink-0 select-none">
                {formatHour(hour)}
              </div>
              <div
                className="flex-1 p-1.5 hover:bg-[#EAF8F8]/30 transition-colors cursor-pointer flex flex-col gap-1"
                onClick={() => {
                  const slotDate = new Date(currentDate);
                  slotDate.setHours(hour, 0, 0, 0);
                  onCreateAtDate?.(slotDate);
                }}
              >
                {hourMeetings.map((m) => {
                  const colorClass = STATUS_CHIP_COLORS[m.status] || 'bg-[#0396A6]/15 text-[#0396A6] border-[#0396A6]/30';
                  return (
                    <div
                      key={m.id}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-3 shadow-xs cursor-pointer ${colorClass}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMeeting(m);
                      }}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate">{m.title}</div>
                        <div className="text-[10px] sm:text-[11px] opacity-80 truncate">
                          {formatTimePart(m.scheduled_start)} — {formatTimePart(m.scheduled_end)} · {m.attendee_name || m.attendee_email || 'Customer'}
                        </div>
                      </div>
                      <StatusBadge label={STATUS_LABEL[m.status] ?? m.status} tone={STATUS_TONE[m.status] ?? 'neutral'} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}