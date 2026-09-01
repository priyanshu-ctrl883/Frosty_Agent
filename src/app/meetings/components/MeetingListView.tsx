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
  Sparkles,
  User,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageState } from "@/components/ui/PageState";
import type { Meeting } from "@/lib/types";
import styles from "../meetings.module.css";

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "info" | "neutral" | "pine" | "warm"> = {
  scheduled: "info",
  confirmed: "success",
  pending_approval: "warm",
  cancelled: "danger",
  completed: "pine",
  no_show: "neutral",
  rescheduled: "warning",
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

function getInitials(label: string | null): string {
  if (!label) return "C";
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "C";
  if (parts.length === 1 && parts[0]) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0]?.[0] || "";
  const last = parts[parts.length - 1]?.[0] || "";
  return (first + last).toUpperCase() || "C";
}

function durationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000);
}

function formatTimePart(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

function detectMeetingChannel(m: Meeting): "web" | "whatsapp" | "unified" {
  const conv = (m.conversation_id || "").toLowerCase();
  const notes = (m.notes || "").toLowerCase();
  const desc = (m.description || "").toLowerCase();
  const title = (m.title || "").toLowerCase();
  const combined = `${conv} ${notes} ${desc} ${title}`;

  if (
    combined.includes("whatsapp") ||
    combined.includes("wa_") ||
    conv.startsWith("wa-") ||
    (m.attendee_phone && !m.attendee_email)
  ) {
    return "whatsapp";
  }
  if (
    combined.includes("web") ||
    combined.includes("widget") ||
    conv.startsWith("web_") ||
    conv.startsWith("widget_")
  ) {
    return "web";
  }
  return "unified";
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
  meetings: Meeting[];
  loading: boolean;
  canManage: boolean;
  busy: boolean;
  onSelectMeeting: (m: Meeting) => void;
  onApprove: (id: string) => void;
  onConfirm: (id: string) => void;
  onSendInvite: (id: string, email: string | null) => void;
  onRescheduleStart: (m: Meeting) => void;
  onCancelStart: (m: Meeting, isDecline: boolean) => void;
  onComplete: (id: string) => void;
  filterStatus: string;
  searchQuery: string;
  onOpenCreate: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
};

export function MeetingListView({
  meetings,
  loading,
  canManage,
  busy,
  onSelectMeeting,
  onApprove,
  onConfirm,
  onSendInvite,
  onRescheduleStart,
  onCancelStart,
  onComplete,
  filterStatus,
  searchQuery,
  onOpenCreate,
  hasMore,
  onLoadMore,
}: Props) {
  // Group meetings chronologically
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, Meeting[]> = {};
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Sort meetings by scheduled_start ascending
    const sorted = [...meetings].sort(
      (a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime(),
    );

    sorted.forEach((m) => {
      const d = new Date(m.scheduled_start);
      let dateKey = d.toLocaleDateString("en-IN", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      if (d.toDateString() === today.toDateString()) {
        dateKey = `Today · ${d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`;
      } else if (d.toDateString() === tomorrow.toDateString()) {
        dateKey = `Tomorrow · ${d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`;
      }

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey]!.push(m);
    });
    return Object.entries(groups);
  }, [meetings]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 bg-white border border-border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
          >
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-slate-200/80 animate-pulse shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-44 h-4 rounded-md bg-slate-200/80 animate-pulse" />
                  <div className="w-20 h-4 rounded-full bg-slate-100 animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-3.5 rounded bg-slate-100 animate-pulse" />
                  <div className="w-24 h-3.5 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <div className="w-20 h-8 rounded-xl bg-slate-100 animate-pulse" />
              <div className="w-24 h-8 rounded-xl bg-slate-200/70 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!meetings.length) {
    const isFiltered = filterStatus !== "all" || Boolean(searchQuery);
    return (
      <PageState
        icon="event_available"
        title={
          searchQuery
            ? "No meetings match your search"
            : filterStatus !== "all"
              ? `No ${filterStatus.replace("_", " ")} meetings`
              : "No meetings scheduled yet"
        }
        description={
          searchQuery
            ? `No results found for "${searchQuery}". Try refining your keywords.`
            : filterStatus !== "all"
              ? `There are currently no meetings with status "${filterStatus.replace("_", " ")}".`
              : "When AI agents book appointments or you schedule manually, they appear here."
        }
        action={
          canManage && !isFiltered ? (
            <Button onClick={onOpenCreate}>
              <Calendar className="w-4 h-4" /> Schedule First Meeting
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className={styles.listContainer}>
      <AnimatePresence>
        {groupedItems.map(([dateKey, groupMeetings]) => (
          <motion.div
            key={dateKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={styles.dateGroup}
          >
            <div className={styles.dateGroupHeader}>
              <h4 className={styles.dateGroupTitle}>{dateKey}</h4>
              <span className={styles.dateGroupCount}>
                {groupMeetings.length} {groupMeetings.length === 1 ? "meeting" : "meetings"}
              </span>
            </div>

            <ul className={styles.meetingCardList}>
              {groupMeetings.map((m) => {
                const dur = durationMinutes(m.scheduled_start, m.scheduled_end);
                const sync = syncLabel(m.calendar_sync);
                const attendeeDisplay = m.attendee_name || m.attendee_email || "Customer";
                const initials = getInitials(attendeeDisplay);

                return (
                  <motion.li
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className={styles.card}
                    onClick={() => onSelectMeeting(m)}
                  >
                    {/* Left: Main Details */}
                    <div className={styles.cardMain}>
                      <div className={styles.cardHeaderRow}>
                        <div className="w-8 h-8 rounded-full bg-[#E2F6F9] text-[#0A1A2F] border border-[#8CE2EE] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {initials}
                        </div>
                        <h3 className={styles.cardTitle}>{m.title}</h3>
                        <StatusBadge
                          label={STATUS_LABEL[m.status] ?? m.status}
                          tone={STATUS_TONE[m.status] ?? "neutral"}
                        />
                      </div>

                      {/* Time & Duration */}
                      <div className={styles.cardTimeRow}>
                        <span className={styles.timePill}>
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimePart(m.scheduled_start)} — {formatTimePart(m.scheduled_end)}
                        </span>
                        <span className={styles.durationPill}>{dur} min</span>

                        {m.meet_link ? (
                          <a
                            href={m.meet_link}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.meetLinkBtn}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join</span>
                          </a>
                        ) : null}
                      </div>

                      {/* Attendee Details */}
                      <div className={styles.cardAttendeeRow}>
                        {m.attendee_name ? (
                          <span className={styles.cardAttendeeItem}>
                            <User className="w-3.5 h-3.5" /> {m.attendee_name}
                          </span>
                        ) : null}
                        {m.attendee_email ? (
                          <span className={styles.cardAttendeeItem}>
                            <Mail className="w-3.5 h-3.5" /> {m.attendee_email}
                          </span>
                        ) : null}
                        {m.attendee_phone ? (
                          <span className={styles.cardAttendeeItem}>
                            <Phone className="w-3.5 h-3.5" /> {m.attendee_phone}
                          </span>
                        ) : null}
                        {m.contact_id ? (
                          <a
                            href={`/leads?contact=${m.contact_id}`}
                            className={styles.cardAttendeeItem}
                            style={{ color: "var(--brand, #0396A6)", textDecoration: "none" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link2 className="w-3.5 h-3.5" /> View contact
                          </a>
                        ) : null}
                        {m.conversation_id ? (
                          <a
                            href={`/inbox?thread=${m.conversation_id}`}
                            className={styles.cardAttendeeItem}
                            style={{ color: "var(--brand, #0396A6)", textDecoration: "none" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Open chat
                          </a>
                        ) : null}
                      </div>

                      {/* Notes snippet */}
                      {m.notes ? (
                        <div className={styles.cardNotes}>
                          <strong>Notes:</strong> {m.notes}
                        </div>
                      ) : null}
                    </div>

                    {/* Right: Sync Badge & Action Buttons */}
                    <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                      <div className={styles.cardStatusPillGroup}>
                        {(m.google_event_id || m.calendly_event_id) && (
                          <span className={sync.style}>
                            <Calendar className="w-3 h-3" />
                            {sync.text}
                          </span>
                        )}
                      </div>

                      <div className={styles.cardButtonsRow}>
                        {/* Pending Approval Actions */}
                        {m.status === "pending_approval" ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              disabled={busy || !canManage}
                              onClick={() => onApprove(m.id)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; invite
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={busy || !canManage}
                              onClick={() => onCancelStart(m, true)}
                            >
                              <X className="w-3.5 h-3.5" /> Decline
                            </Button>
                          </>
                        ) : null}

                        {/* Scheduled / Rescheduled Actions */}
                        {m.status === "scheduled" || m.status === "rescheduled" ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              disabled={busy}
                              onClick={() => onConfirm(m.id)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {m.attendee_email ? "Confirm & invite" : "Confirm"}
                            </Button>
                            {m.attendee_email ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={busy || !canManage}
                                onClick={() => onSendInvite(m.id, m.attendee_email)}
                              >
                                <Send className="w-3.5 h-3.5" /> Send invite
                              </Button>
                            ) : null}
                          </>
                        ) : null}

                        {/* Confirmed Actions */}
                        {m.status === "confirmed" ? (
                          <>
                            {m.attendee_email ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={busy || !canManage}
                                onClick={() => onSendInvite(m.id, m.attendee_email)}
                              >
                                <Send className="w-3.5 h-3.5" /> Send invite
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() => onComplete(m.id)}
                            >
                              <CalendarCheck className="w-3.5 h-3.5" /> Mark done
                            </Button>
                          </>
                        ) : null}

                        {/* Active Non-terminal Actions: Reschedule & Cancel */}
                        {m.status !== "cancelled" &&
                        m.status !== "completed" &&
                        m.status !== "pending_approval" ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() => onRescheduleStart(m)}
                            >
                              <CalendarClock className="w-3.5 h-3.5" /> Reschedule
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() => onCancelStart(m, false)}
                            >
                              <CalendarX className="w-3.5 h-3.5" /> Cancel
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        ))}
      </AnimatePresence>

      {hasMore && (
        <div className="flex justify-center mt-8 mb-12">
          <Button variant="ghost" onClick={onLoadMore} disabled={busy || loading}>
            {busy || loading ? "Loading..." : "Load More Meetings"}
          </Button>
        </div>
      )}
    </div>
  );
}
