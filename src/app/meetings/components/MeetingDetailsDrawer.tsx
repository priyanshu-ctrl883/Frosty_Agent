"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  Clock,
  Globe,
  Link2,
  Mail,
  MessageSquare,
  Phone,
  Send,
  User,
  Video,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatWhen } from "@/lib/format";
import type { Meeting } from "@/lib/types";
import styles from "../meetings.module.css";

const STATUS_COLOR_TEXT: Record<string, string> = {
  scheduled: "text-[#0396A6]",
  confirmed: "text-emerald-600",
  pending_approval: "text-amber-600",
  cancelled: "text-rose-600",
  completed: "text-emerald-600",
  no_show: "text-slate-500",
  rescheduled: "text-amber-600",
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  pending_approval: "Pending Approval",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No Show",
  rescheduled: "Rescheduled",
};

function durationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000);
}

function syncLabel(sync: string | null): { text: string; style: string } {
  if (!sync || sync === "synced" || sync === "no_sync_needed")
    return { text: "Synced", style: styles.syncBadgeSynced || "" };
  if (sync === "never_synced")
    return { text: "Not synced", style: styles.syncBadgeNone || "" };
  if (sync === "no_calendar_connected")
    return { text: "No calendar", style: styles.syncBadgeNone || "" };
  if (sync === "provider_error")
    return { text: "Sync error", style: styles.syncBadgeError || "" };
  if (sync === "already_invited")
    return { text: "Invited", style: styles.syncBadgeSynced || "" };
  return { text: sync, style: styles.syncBadgeNone || "" };
}

type Props = {
  meeting: Meeting | null;
  onClose: () => void;
  canManage: boolean;
  busy: boolean;
  onApprove: (id: string) => void;
  onConfirm: (id: string) => void;
  onSendInvite: (id: string, email: string | null) => void;
  onRescheduleStart: (m: Meeting) => void;
  onCancelStart: (m: Meeting, isDecline: boolean) => void;
  onComplete: (id: string) => void;
};

export function MeetingDetailsDrawer({
  meeting,
  onClose,
  canManage,
  busy,
  onApprove,
  onConfirm,
  onSendInvite,
  onRescheduleStart,
  onCancelStart,
  onComplete,
}: Props) {
  if (!meeting) return null;

  const dur = durationMinutes(meeting.scheduled_start, meeting.scheduled_end);
  const sync = syncLabel(meeting.calendar_sync);

  return (
    <AnimatePresence>
      <div className={styles.drawerOverlay} onClick={onClose}>
        <motion.div
          className={styles.drawerContent}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles.drawerHeader}>
            <div className={styles.drawerTitleArea}>
              <div className="flex items-center gap-3">
                {(meeting.google_event_id || meeting.calendly_event_id || meeting.calendar_sync) && (
                  <span className="text-xs font-bold text-[#0396A6] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#0396A6]" />
                    <span>{sync.text}</span>
                  </span>
                )}
                <span className={`text-xs font-extrabold uppercase tracking-wider ${STATUS_COLOR_TEXT[meeting.status] || "text-foreground"}`}>
                  {STATUS_LABEL[meeting.status] ?? meeting.status}
                </span>
              </div>
              <h2 className={styles.drawerTitle}>{meeting.title}</h2>
            </div>
            <button
              type="button"
              className={styles.drawerCloseBtn}
              onClick={onClose}
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className={styles.drawerBody}>
            {/* Time & Meeting Links Section */}
            <div className={styles.drawerSection}>
              <div className={styles.drawerSectionHeading}>Meeting Schedule</div>
              <div className={styles.drawerCard}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold text-sm text-foreground">
                      {formatWhen(meeting.scheduled_start, meeting.scheduled_end)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#0396A6]">
                    {dur}m
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Timezone: {meeting.timezone || "Local"}</span>
                  </div>

                  {meeting.meet_link && (
                    <a
                      href={meeting.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0396A6] hover:bg-[#087681] text-white font-extrabold text-xs tracking-wider shadow-2xs transition-all cursor-pointer active:scale-98 shrink-0"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Attendee Details */}
            <div className={styles.drawerSection}>
              <div className={styles.drawerSectionHeading}>Attendee Details</div>
              <div className={styles.drawerCard}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0396A6]/15 text-[#0396A6] font-black text-sm flex items-center justify-center">
                    {meeting.attendee_name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-foreground">
                      {meeting.attendee_name || "Unnamed Attendee"}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" />
                      <span>{meeting.attendee_email || "No email provided"}</span>
                    </div>
                  </div>
                </div>

                {meeting.attendee_phone && (
                  <div className="flex items-center gap-2 text-xs text-foreground bg-white p-2 rounded-lg border border-border">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-semibold">{meeting.attendee_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes / Description */}
            {(meeting.description || meeting.notes) && (
              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionHeading}>Notes & Agenda</div>
                <div className={styles.drawerCard}>
                  {meeting.description && (
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase">Description</span>
                      <p className="text-xs text-foreground mt-0.5">{meeting.description}</p>
                    </div>
                  )}
                  {meeting.notes && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase">Notes</span>
                      <p className="text-xs text-foreground mt-0.5">{meeting.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata & Integration Info */}
            <div className={styles.drawerSection}>
              <div className={styles.drawerSectionHeading}>System Details</div>
              <div className={styles.drawerCard}>
                <div className={styles.drawerMetaGrid}>
                  <div className={styles.drawerMetaItem}>
                    <span className={styles.drawerMetaLabel}>Meeting ID</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{meeting.id.slice(0, 12)}…</span>
                  </div>
                  <div className={styles.drawerMetaItem}>
                    <span className={styles.drawerMetaLabel}>Created</span>
                    <span className="text-xs">{new Date(meeting.created_at).toLocaleDateString()}</span>
                  </div>
                  {meeting.google_event_id && (
                    <div className={styles.drawerMetaItem}>
                      <span className={styles.drawerMetaLabel}>Google Calendar</span>
                      <span className="font-mono text-[11px] text-[#0396A6]">
                        {meeting.google_event_id.slice(0, 14)}…
                      </span>
                    </div>
                  )}
                  {meeting.calendly_event_id && (
                    <div className={styles.drawerMetaItem}>
                      <span className={styles.drawerMetaLabel}>Calendly</span>
                      <span className="font-mono text-[11px] text-purple-600">
                        {meeting.calendly_event_id.slice(0, 14)}…
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cohesive Footer Action Toolbar */}
          <div className="p-4 sm:p-5 border-t border-border bg-[#F7FBFB] flex flex-col gap-2.5 pb-10 sm:pb-6 z-20">
            {/* 1. Pending Approval Actions */}
            {meeting.status === "pending_approval" && (
              <>
                <button
                  type="button"
                  disabled={busy || !canManage}
                  onClick={() => onApprove(meeting.id)}
                  className="w-full py-2.5 px-4 bg-[#0396A6] hover:bg-[#087681] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Send Invite</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onRescheduleStart(meeting)}
                    className="py-2 px-3 rounded-xl border border-border bg-white hover:bg-slate-50 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Reschedule</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy || !canManage}
                    onClick={() => onCancelStart(meeting, true)}
                    className="py-2 px-3 rounded-xl border border-border bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-rose-500" />
                    <span>Decline</span>
                  </button>
                </div>
              </>
            )}

            {/* 2. Scheduled / Rescheduled Actions */}
            {(meeting.status === "scheduled" || meeting.status === "rescheduled") && (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onConfirm(meeting.id)}
                  className="py-2.5 px-3 bg-[#0396A6] hover:bg-[#087681] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 truncate"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">{meeting.attendee_email ? "Confirm" : "Confirm"}</span>
                </button>
                {meeting.attendee_email ? (
                  <button
                    type="button"
                    disabled={busy || !canManage}
                    onClick={() => onSendInvite(meeting.id, meeting.attendee_email)}
                    className="py-2.5 px-3 rounded-xl border border-border bg-white hover:bg-slate-50 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer truncate"
                    title="Send calendar invite"
                  >
                    <Send className="w-3.5 h-3.5 text-[#0396A6] shrink-0" />
                    <span className="truncate">Send Invite</span>
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRescheduleStart(meeting)}
                  className="py-2.5 px-3 rounded-xl border border-border bg-white hover:bg-slate-50 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer truncate"
                >
                  <CalendarClock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">Reschedule</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onCancelStart(meeting, false)}
                  className="py-2.5 px-3 rounded-xl border border-border bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer truncate"
                >
                  <CalendarX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">Cancel</span>
                </button>
              </div>
            )}

            {/* 3. Confirmed Actions */}
            {meeting.status === "confirmed" && (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onComplete(meeting.id)}
                  className="py-2.5 px-3 bg-[#0396A6] hover:bg-[#087681] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 truncate"
                >
                  <CalendarCheck className="w-4 h-4 shrink-0" />
                  <span className="truncate">Mark Done</span>
                </button>
                {meeting.attendee_email ? (
                  <button
                    type="button"
                    disabled={busy || !canManage}
                    onClick={() => onSendInvite(meeting.id, meeting.attendee_email)}
                    className="py-2.5 px-3 rounded-xl border border-border bg-white hover:bg-slate-50 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer truncate"
                  >
                    <Send className="w-3.5 h-3.5 text-[#0396A6] shrink-0" />
                    <span className="truncate">Resend</span>
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRescheduleStart(meeting)}
                  className="py-2.5 px-3 rounded-xl border border-border bg-white hover:bg-slate-50 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer truncate"
                >
                  <CalendarClock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">Reschedule</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onCancelStart(meeting, false)}
                  className="py-2.5 px-3 rounded-xl border border-border bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer truncate"
                >
                  <CalendarX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">Cancel</span>
                </button>
              </div>
            )}

            {/* 4. Cancelled or Completed */}
            {(meeting.status === "cancelled" || meeting.status === "completed") && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl border border-border bg-white hover:bg-slate-50 text-foreground font-bold text-xs transition-colors cursor-pointer"
              >
                Close Details
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}