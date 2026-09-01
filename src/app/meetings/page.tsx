"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { EntitlementGate } from "@/components/entitlements/EntitlementGate";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { apiRequest, ApiClientError } from "@/lib/api";
import { can } from "@/lib/permissions";
import { useToast } from "@/lib/toast";
import type { CalendarConnection, CalendarStatus, Meeting } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";

import {
  MeetingToolbar,
  type ViewMode,
  type FilterStatus,
  type ChannelTag,
} from "./components/MeetingToolbar";
import { detectMeetingChannel } from "@/components/workspace/tabs/WorkspaceMeetingsTab";
import { MeetingListView } from "./components/MeetingListView";
import { MeetingCalendarView } from "./components/MeetingCalendarView";
import { MeetingDetailsDrawer } from "./components/MeetingDetailsDrawer";
import { NewMeetingModal } from "./components/NewMeetingModal";
import { RescheduleModal } from "./components/RescheduleModal";
import { CalendarIntegrationsModal } from "./components/CalendarIntegrationsModal";
import { MeetingAutomationToggle } from "./components/MeetingAutomationToggle";
import { Pagination } from "@/components/ui/Pagination";
import styles from "./meetings.module.css";

/* ── Main Meetings Page Inner ─────────────────────────────────────────────── */

function MeetingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { me } = useWorkspace();
  const canManage = can(me?.permissions, "meetings:manage");

  const [items, setItems] = useState<Meeting[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [calendar, setCalendar] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [calBusy, setCalBusy] = useState(false);

  // Notifications
  const { showToast } = useToast();
  const setError = useCallback(
    (msg: string | null) => {
      if (msg) showToast(msg, { type: "error" });
    },
    [showToast]
  );
  const setNotice = useCallback(
    (msg: string | null) => {
      if (msg) showToast(msg, { type: "success" });
    },
    [showToast]
  );

  // View & Filter State
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelTag>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, channelFilter, fromDate, toDate, searchQuery]);

  // Modals & Drawer State
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createInitialDate, setCreateInitialDate] = useState<Date | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Meeting | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{
    meeting: Meeting;
    isDecline: boolean;
  } | null>(null);
  const [integrationsModalOpen, setIntegrationsModalOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  /* ── Error & Notice Handler ── */
  const handleError = useCallback((err: unknown, defaultMsg: string) => {
    if (err instanceof ApiClientError && err.status === 401) {
      window.location.href = "/login";
      return;
    }
    setError(err instanceof Error ? err.message : defaultMsg);
  }, []);

  /* ── API Loaders ── */
  const loadCalendar = useCallback(async () => {
    try {
      const snap = await apiRequest<CalendarStatus>("/v1/calendar/status");
      setCalendar(snap);
    } catch {
      setCalendar(null);
    }
  }, []);

  const reload = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ limit: "10", offset: "0" });
      if (filterStatus === "upcoming") qs.set("upcoming_only", "true");
      else if (filterStatus !== "all") qs.set("status", filterStatus);

      const data = await apiRequest<Meeting[]>(`/v1/meetings?${qs}`, {
        signal: abortRef.current.signal,
      });
      setItems(data);
      setHasMore(data.length === 10);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      handleError(err, "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, handleError]);

  const loadMore = useCallback(async () => {
    if (busy || loading || !hasMore) return;
    setBusy(true);
    try {
      const qs = new URLSearchParams({ limit: "10", offset: items.length.toString() });
      if (filterStatus === "upcoming") qs.set("upcoming_only", "true");
      else if (filterStatus !== "all") qs.set("status", filterStatus);

      const data = await apiRequest<Meeting[]>(`/v1/meetings?${qs}`);
      setItems((prev) => [...prev, ...data]);
      if (data.length < 10) setHasMore(false);
    } catch (err) {
      handleError(err, "Failed to load more meetings");
    } finally {
      setBusy(false);
    }
  }, [items.length, hasMore, busy, loading, filterStatus, handleError]);

  useEffect(() => {
    void reload();
    void loadCalendar();
  }, [reload, loadCalendar]);

  // Synchronize URL params if given (e.g. ?filter=confirmed or ?calendar=connected)
  useEffect(() => {
    const wanted = searchParams.get("filter");
    if (
      wanted === "pending_approval" ||
      wanted === "scheduled" ||
      wanted === "confirmed" ||
      wanted === "rescheduled" ||
      wanted === "completed" ||
      wanted === "cancelled" ||
      wanted === "all" ||
      wanted === "upcoming"
    ) {
      setFilterStatus(wanted as FilterStatus);
    }
  }, [searchParams]);

  useEffect(() => {
    const flag = searchParams.get("calendar");
    if (!flag) return;
    if (flag === "connected") {
      setNotice("Google Calendar connected — new bookings sync automatically.");
      void loadCalendar();
    } else if (flag === "failed") {
      const reason = searchParams.get("reason") || "unknown";
      setError(`Google Calendar connection failed (${reason}).`);
    }
    router.replace("/meetings");
  }, [searchParams, router, loadCalendar]);

  /* ── KPI & Summary Computations ── */
  const kpiCounts = useMemo(() => {
    const total = items.length;
    const upcoming = items.filter(
      (m) => new Date(m.scheduled_start) > new Date() && m.status !== "cancelled",
    ).length;
    const pending = items.filter((m) => m.status === "pending_approval").length;
    const completed = items.filter((m) => m.status === "completed").length;
    return { total, upcoming, pending, completed };
  }, [items]);

  /* ── Search & Filter Pipeline ── */
  const filteredMeetings = useMemo(() => {
    let list = items;

    // Status filter
    if (filterStatus === "upcoming") {
      const now = Date.now();
      list = list.filter(
        (m) => new Date(m.scheduled_start).getTime() >= now - 3600000 && m.status !== "cancelled",
      );
    } else if (filterStatus !== "all") {
      list = list.filter((m) => m.status === filterStatus);
    }

    // Agent / Channel filter
    if (channelFilter !== "all") {
      list = list.filter((m) => detectMeetingChannel(m) === channelFilter);
    }

    // Custom date range filter (Applied in List View)
    if (viewMode === "list") {
      if (fromDate) {
        const [y, m, d] = fromDate.split("-").map(Number);
        const fromTs = new Date(y!, m! - 1, d!).getTime();
        list = list.filter((m) => new Date(m.scheduled_start).getTime() >= fromTs);
      }
      if (toDate) {
        const [y, m, d] = toDate.split("-").map(Number);
        const toTs = new Date(y!, m! - 1, d!, 23, 59, 59, 999).getTime();
        list = list.filter((m) => new Date(m.scheduled_start).getTime() <= toTs);
      }
    }

    // Search query filter (client-side debounced search over loaded meetings)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) => {
        const titleMatch = m.title.toLowerCase().includes(q);
        const nameMatch = m.attendee_name?.toLowerCase().includes(q);
        const emailMatch = m.attendee_email?.toLowerCase().includes(q);
        const phoneMatch = m.attendee_phone?.toLowerCase().includes(q);
        const descMatch = m.description?.toLowerCase().includes(q);
        const notesMatch = m.notes?.toLowerCase().includes(q);
        return (
          titleMatch ||
          nameMatch ||
          emailMatch ||
          phoneMatch ||
          descMatch ||
          notesMatch
        );
      });
    }

    return list;
  }, [items, filterStatus, channelFilter, fromDate, toDate, searchQuery]);

  const paginatedMeetings = useMemo(() => {
    if (viewMode !== "list") return filteredMeetings;
    const start = (currentPage - 1) * pageSize;
    return filteredMeetings.slice(start, start + pageSize);
  }, [filteredMeetings, currentPage, pageSize, viewMode]);

  /* ── Calendar Sync Notice Helper ── */
  function inviteNotice(out: Meeting, email: string | null | undefined): string {
    const sync = out.calendar_sync;
    if (sync === "already_invited") {
      return `Calendar invite sent previously to ${email ?? "attendee"}. Use Send Invite to re-notify.`;
    }
    if (sync === "no_calendar_connected") {
      return "Saved. Connect Google Calendar to auto-send calendar invites.";
    }
    if (sync === "never_synced" || sync === "provider_error") {
      return `Saved. Could not sync to Google Calendar (${sync ?? "error"}).`;
    }
    if (sync === "synced" || !sync || sync === "no_sync_needed") {
      return email ? `Calendar invite sent to ${email}.` : "Meeting saved successfully.";
    }
    return `Calendar sync: ${sync}.`;
  }

  /* ── Action Handlers ── */

  async function handleCreate(payload: {
    title: string;
    attendee_name: string | null;
    attendee_email: string | null;
    attendee_phone: string | null;
    scheduled_start: string;
    scheduled_end: string;
    description: string | null;
    notes: string | null;
    timezone: string;
  }) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const out = await apiRequest<Meeting>("/v1/meetings", {
        method: "POST",
        body: payload,
      });
      setNotice(inviteNotice(out, payload.attendee_email));
      setCreateModalOpen(false);
      await reload();
    } catch (err) {
      handleError(err, "Failed to create meeting");
    } finally {
      setBusy(false);
    }
  }

  async function handleReschedule(
    id: string,
    newStartIso: string,
    newEndIso: string,
  ) {
    setBusy(true);
    setError(null);
    try {
      const out = await apiRequest<Meeting>(`/v1/meetings/${id}`, {
        method: "PATCH",
        body: {
          scheduled_start: newStartIso,
          scheduled_end: newEndIso,
          status: "rescheduled",
        },
      });
      setNotice("Meeting rescheduled successfully.");
      if (selectedMeeting?.id === id) {
        setSelectedMeeting(out);
      }
      await reload();
    } catch (err) {
      handleError(err, "Failed to reschedule meeting");
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove(id: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const out = await apiRequest<Meeting>(`/v1/meetings/${id}/approve`, {
        method: "POST",
      });
      setNotice("Meeting approved — invitation sent to attendee.");
      if (selectedMeeting?.id === id) {
        setSelectedMeeting(out);
      }
      await reload();
    } catch (err) {
      handleError(err, "Failed to approve meeting");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm(id: string) {
    setBusy(true);
    setError(null);
    try {
      const out = await apiRequest<Meeting>(`/v1/meetings/${id}`, {
        method: "PATCH",
        body: { status: "confirmed" },
      });
      setNotice(inviteNotice(out, out.attendee_email));
      if (selectedMeeting?.id === id) {
        setSelectedMeeting(out);
      }
      await reload();
    } catch (err) {
      handleError(err, "Failed to confirm meeting");
    } finally {
      setBusy(false);
    }
  }

  async function handleSendInvite(id: string, email: string | null) {
    setBusy(true);
    setError(null);
    try {
      const out = await apiRequest<Meeting>(`/v1/meetings/${id}/send-invite`, {
        method: "POST",
      });
      setNotice(inviteNotice(out, email ?? out.attendee_email));
      if (selectedMeeting?.id === id) {
        setSelectedMeeting(out);
      }
      await reload();
    } catch (err) {
      handleError(err, "Could not send calendar invite");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete(id: string) {
    setBusy(true);
    setError(null);
    try {
      const out = await apiRequest<Meeting>(`/v1/meetings/${id}`, {
        method: "PATCH",
        body: { status: "completed" },
      });
      setNotice("Meeting marked as completed.");
      if (selectedMeeting?.id === id) {
        setSelectedMeeting(out);
      }
      await reload();
    } catch (err) {
      handleError(err, "Failed to mark meeting as completed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel(id: string) {
    setBusy(true);
    setError(null);
    try {
      const out = await apiRequest<Meeting>(`/v1/meetings/${id}`, {
        method: "PATCH",
        body: { status: "cancelled" },
      });
      setNotice("Meeting cancelled.");
      setCancelTarget(null);
      if (selectedMeeting?.id === id) {
        setSelectedMeeting(out);
      }
      await reload();
    } catch (err) {
      handleError(err, "Failed to cancel meeting");
    } finally {
      setBusy(false);
    }
  }

  /* ── Calendar Integration Handlers ── */

  async function handleConnectGoogle() {
    setCalBusy(true);
    setError(null);
    try {
      const data = await apiRequest<{ authorization_url: string; expires_in: number }>(
        "/v1/calendar/google/oauth/start",
      );
      window.location.href = data.authorization_url;
    } catch (err) {
      handleError(err, "Google OAuth start failed");
      setCalBusy(false);
    }
  }

  async function handleDisconnectGoogle() {
    setCalBusy(true);
    setError(null);
    try {
      await apiRequest("/v1/calendar/google/disconnect", { method: "POST" });
      setNotice("Google Calendar disconnected.");
      await loadCalendar();
    } catch (err) {
      handleError(err, "Disconnect failed");
    } finally {
      setCalBusy(false);
    }
  }

  async function handleConnectCalendly(email: string, token: string) {
    setCalBusy(true);
    setError(null);
    try {
      const out = await apiRequest<CalendarConnection>("/v1/calendar/calendly/connect", {
        method: "POST",
        body: { email, access_token: token },
      });
      setNotice(
        out.connected
          ? `Calendly connected as ${out.email || email}.`
          : "Calendly credentials saved.",
      );
      await loadCalendar();
    } catch (err) {
      handleError(err, "Calendly connect failed");
    } finally {
      setCalBusy(false);
    }
  }

  async function handleDisconnectCalendly() {
    setCalBusy(true);
    setError(null);
    try {
      await apiRequest("/v1/calendar/calendly/disconnect", { method: "POST" });
      setNotice("Calendly disconnected.");
      await loadCalendar();
    } catch (err) {
      handleError(err, "Disconnect failed");
    } finally {
      setCalBusy(false);
    }
  }

  return (
    <AppShell
      title="Meetings"
      subtitle="Complete appointment scheduling, AI bookings, and calendar synchronization."
      requires="meetings:view"
      actions={<MeetingAutomationToggle />}
    >
      <EntitlementGate feature="meeting_scheduling">
        <div className={styles.container}>
          {/* Workspace Google Calendar Style Toolbar (Just above calendar) */}
          <MeetingToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            channelFilter={channelFilter}
            onChannelFilterChange={setChannelFilter}
            fromDate={fromDate}
            onFromDateChange={setFromDate}
            toDate={toDate}
            onToDateChange={setToDate}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            canManage={canManage}
            onOpenCreate={() => {
              setCreateInitialDate(null);
              setCreateModalOpen(true);
            }}
            onOpenIntegrations={() => setIntegrationsModalOpen(true)}
            calendarStatus={calendar}
            onRefresh={() => void reload()}
            loading={loading}
          />

          {/* 3. Main View: List or Calendar Views */}
          {viewMode === "list" ? (
            <div className="space-y-4">
              <MeetingListView
                meetings={paginatedMeetings}
                loading={loading}
                canManage={canManage}
                busy={busy}
                onSelectMeeting={(m) => setSelectedMeeting(m)}
                onApprove={(id) => void handleApprove(id)}
                onConfirm={(id) => void handleConfirm(id)}
                onSendInvite={(id, email) => void handleSendInvite(id, email)}
                onRescheduleStart={(m) => setRescheduleTarget(m)}
                onCancelStart={(m, isDecline) => setCancelTarget({ meeting: m, isDecline })}
                onComplete={(id) => void handleComplete(id)}
                filterStatus={filterStatus}
                searchQuery={searchQuery}
                onOpenCreate={() => setCreateModalOpen(true)}
                hasMore={hasMore}
                onLoadMore={() => void loadMore()}
              />

              {filteredMeetings.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-[#D9EDEE] shadow-xs">
                  <Pagination
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={filteredMeetings.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    pageSizeOptions={[10, 20, 30, 50]}
                    itemLabel="meetings"
                  />
                </div>
              )}
            </div>
          ) : (
            <MeetingCalendarView
              viewMode={viewMode}
              currentDate={currentDate}
              meetings={filteredMeetings}
              fromDate={fromDate}
              toDate={toDate}
              onSelectMeeting={(m) => setSelectedMeeting(m)}
              onCreateAtDate={(d) => {
                if (!canManage) return;
                setCreateInitialDate(d);
                setCreateModalOpen(true);
              }}
              hasMore={hasMore}
              onLoadMore={() => void loadMore()}
              busy={busy}
              loading={loading}
            />
          )}

          {/* 4. Slide-Over Details Drawer */}
          <MeetingDetailsDrawer
            meeting={selectedMeeting}
            onClose={() => setSelectedMeeting(null)}
            canManage={canManage}
            busy={busy}
            onApprove={(id) => void handleApprove(id)}
            onConfirm={(id) => void handleConfirm(id)}
            onSendInvite={(id, email) => void handleSendInvite(id, email)}
            onRescheduleStart={(m) => {
              setSelectedMeeting(null);
              setRescheduleTarget(m);
            }}
            onCancelStart={(m, isDecline) => {
              setSelectedMeeting(null);
              setCancelTarget({ meeting: m, isDecline });
            }}
            onComplete={(id) => void handleComplete(id)}
          />

          {/* 5. Create Meeting Modal */}
          <NewMeetingModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            busy={busy}
            onCreate={handleCreate}
            initialDate={createInitialDate}
          />

          {/* 6. Reschedule Modal */}
          <RescheduleModal
            meeting={rescheduleTarget}
            open={Boolean(rescheduleTarget)}
            onOpenChange={(open) => {
              if (!open) setRescheduleTarget(null);
            }}
            busy={busy}
            onReschedule={handleReschedule}
          />

          {/* 7. Cancel / Decline Confirmation Dialog */}
          <ConfirmModal
            show={Boolean(cancelTarget)}
            title={
              cancelTarget?.isDecline
                ? "Decline Booking Request?"
                : "Cancel This Meeting?"
            }
            message={
              cancelTarget?.isDecline
                ? "The attendee will not receive an invite. This cannot be undone."
                : "The meeting will be marked as cancelled and any synced calendar events will be removed."
            }
            tone="danger"
            confirmText={
              cancelTarget?.isDecline ? "Decline Booking" : "Cancel Meeting"
            }
            onConfirm={() => {
              if (cancelTarget) void handleCancel(cancelTarget.meeting.id);
            }}
            onCancel={() => setCancelTarget(null)}
          />

          {/* 8. Calendar Integrations Modal */}
          <CalendarIntegrationsModal
            open={integrationsModalOpen}
            onOpenChange={setIntegrationsModalOpen}
            status={calendar}
            calBusy={calBusy}
            onConnectGoogle={() => void handleConnectGoogle()}
            onDisconnectGoogle={() => void handleDisconnectGoogle()}
            onConnectCalendly={handleConnectCalendly}
            onDisconnectCalendly={() => void handleDisconnectCalendly()}
          />
        </div>
      </EntitlementGate>
    </AppShell>
  );
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={null}>
      <MeetingsPageInner />
    </Suspense>
  );
}
