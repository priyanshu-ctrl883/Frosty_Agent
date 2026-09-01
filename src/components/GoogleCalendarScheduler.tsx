'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const DEFAULT_GOOGLE_CALENDAR_URL =
  'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0a5VG991XaptfJ-qtvwFTARjISUm_loRBSHuSJlNnTyViFMuh7w3yppLrANmFzwxvoWNAxWqTq';

interface GoogleCalendarSchedulerProps {
  calendarUrl?: string;
  hostName?: string;
  meetingTitle?: string;
  duration?: string;
}

/**
 * Sanitizes Google Calendar URL to remove user session indexes like /u/0/ or /u/1/
 * and ensure standard public embed format.
 */
function sanitizeGoogleCalendarUrl(rawUrl?: string): string {
  const url = (rawUrl || '').trim() || DEFAULT_GOOGLE_CALENDAR_URL;
  return url.replace(/\/u\/\d+\//g, '/');
}

/* ── Shimmer Skeleton Loader ── */
const CalendarSkeleton = () => {
  const base = 'bg-slate-100';
  const shimmer = 'before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent';
  const pulse = `relative overflow-hidden before:absolute before:inset-0 before:animate-[shimmer_1.6s_infinite] ${shimmer}`;

  return (
    <div className="flex flex-col gap-4 p-6 sm:p-8 bg-white h-full min-h-[660px] justify-start" aria-hidden="true">
      {/* Header placeholder */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${base} ${pulse}`} />
          <div className="space-y-1.5">
            <div className={`h-4 w-28 rounded-md ${base} ${pulse}`} />
            <div className={`h-3 w-40 rounded-md ${base} ${pulse}`} />
          </div>
        </div>
        <div className={`h-6 w-20 rounded-full ${base} ${pulse}`} />
      </div>

      {/* Select date title */}
      <div className="flex items-center justify-between pt-2">
        <div className={`h-5 w-32 rounded-md ${base} ${pulse}`} />
        <div className="flex gap-2">
          <div className={`w-8 h-8 rounded-xl ${base} ${pulse}`} />
          <div className={`w-8 h-8 rounded-xl ${base} ${pulse}`} />
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 my-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={`sk-h-${i}`} className={`h-4 rounded-md ${base} ${pulse}`} />
        ))}
      </div>

      {/* Calendar grid */}
      {Array.from({ length: 5 }).map((_, r) => (
        <div key={`sk-r-${r}`} className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, c) => (
            <div key={`sk-c-${r}-${c}`} className={`h-10 rounded-xl ${base} ${pulse}`} />
          ))}
        </div>
      ))}

      {/* Time slot pills placeholder */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className={`h-4 w-36 rounded-md ${base} ${pulse}`} />
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`sk-slot-${i}`} className={`h-9 rounded-xl ${base} ${pulse}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function GoogleCalendarScheduler({
  calendarUrl = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL || DEFAULT_GOOGLE_CALENDAR_URL,
}: GoogleCalendarSchedulerProps) {
  const [iframeLoading, setIframeLoading] = useState(true);
  const activeUrl = sanitizeGoogleCalendarUrl(calendarUrl);

  useEffect(() => {
    // Safety fallback timer to hide loader if iframe onload doesn't bubble in some browsers
    const timer = setTimeout(() => {
      setIframeLoading(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, [activeUrl]);

  const handleOpenDirect = () => {
    try {
      trackEvent('calendar_open_external', { url: activeUrl });
    } catch (_) {}
    window.open(activeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between h-full relative">
      {/* Top Accent Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0396A6] via-[#14B8A6] to-[#FF7A5E] z-20" />

      {/* ── Sleek Card Sub-Header Bar ── */}
      <div className="px-5 sm:px-6 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 via-white to-slate-50/50 flex items-center justify-between gap-2 relative z-10">
        {/* Google Calendar & Meet Brand Mark */}
        <div className="inline-flex items-center gap-2">
          <svg className="w-4 h-4 drop-shadow-xs" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="17" rx="3" fill="#FFFFFF" stroke="#4285F4" strokeWidth="1.8" />
            <path d="M3 8.5H21" stroke="#4285F4" strokeWidth="1.8" />
            <path d="M7.5 2V5" stroke="#EA4335" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M16.5 2V5" stroke="#FBBC04" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="8" cy="13" r="1.2" fill="#34A853" />
            <circle cx="12" cy="13" r="1.2" fill="#4285F4" />
            <circle cx="16" cy="13" r="1.2" fill="#EA4335" />
            <circle cx="8" cy="17" r="1.2" fill="#FBBC04" />
            <circle cx="12" cy="17" r="1.2" fill="#34A853" />
            <circle cx="16" cy="17" r="1.2" fill="#4285F4" />
          </svg>
          <span className="text-xs font-bold text-slate-800 tracking-tight">Google Calendar &amp; Meet</span>
        </div>

        {/* Action Controls & Instant Confirmation Badge */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0396A6]/10 text-[#0396A6] border border-[#0396A6]/20 text-[10.5px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>INSTANT CONFIRMATION</span>
          </div>

          <button
            type="button"
            onClick={handleOpenDirect}
            title="Open in full page"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-[#0396A6] px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span>Full screen</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Body: Google Calendar Live Native Iframe Embed ── */}
      <div className="relative w-full flex-1 min-h-[660px] sm:min-h-[700px] lg:min-h-[720px] bg-white">
        {iframeLoading && (
          <div className="absolute inset-0 z-10 bg-white">
            <CalendarSkeleton />
          </div>
        )}

        <iframe
          src={activeUrl}
          onLoad={() => setIframeLoading(false)}
          className="w-full h-full min-h-[660px] sm:min-h-[700px] lg:min-h-[720px] border-0 rounded-b-3xl"
          title="Google Calendar Appointment Scheduling"
          allow="camera; microphone; fullscreen; display-capture"
        />
      </div>

      {/* Shimmer CSS Animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
