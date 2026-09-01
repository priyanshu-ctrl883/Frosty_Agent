'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar, Plus,
  Search, CalendarDays, CalendarRange, List, ChevronLeft, ChevronRight, X,
  RefreshCw, Filter, RotateCcw
} from 'lucide-react';
import type { Meeting, CalendarStatus, CalendarConnection } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/lib/toast';

import { MeetingListView } from '@/app/meetings/components/MeetingListView';
import { MeetingCalendarView } from '@/app/meetings/components/MeetingCalendarView';
import { MeetingDetailsDrawer } from '@/app/meetings/components/MeetingDetailsDrawer';
import { NewMeetingModal } from '@/app/meetings/components/NewMeetingModal';
import { RescheduleModal } from '@/app/meetings/components/RescheduleModal';
import { CalendarIntegrationsModal } from '@/app/meetings/components/CalendarIntegrationsModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Pagination } from '@/components/ui/Pagination';
import { MeetingFilterModal } from '@/app/meetings/components/MeetingFilterModal';
import { TableDateFilter } from '@/components/ui/TableDateFilter';

interface WorkspaceMeetingsTabProps {
  meetings: Meeting[];
  calendar: CalendarStatus | null;
  canManage: boolean;
  loading: boolean;
  onRefresh: () => Promise<void>;
  isScheduleModalOpen?: boolean;
  onCloseScheduleModal?: () => void;
  onOpenScheduleModal?: () => void;
}

export type ViewMode = 'list' | 'month' | 'week' | 'day';
export type FilterStatus =
  | 'all'
  | 'upcoming'
  | 'scheduled'
  | 'confirmed'
  | 'pending_approval'
  | 'rescheduled'
  | 'completed'
  | 'cancelled';

export type ChannelTag = 'all' | 'web' | 'whatsapp' | 'unified';

export function detectMeetingChannel(m: Meeting): 'web' | 'whatsapp' | 'unified' {
  const conv = (m.conversation_id || '').toLowerCase();
  const notes = (m.notes || '').toLowerCase();
  const desc = (m.description || '').toLowerCase();
  const title = (m.title || '').toLowerCase();
  const combined = `${conv} ${notes} ${desc} ${title}`;
  if (
    combined.includes('whatsapp') ||
    combined.includes('wa_') ||
    conv.startsWith('wa-') ||
    (m.attendee_phone && !m.attendee_email)
  ) {
    return 'whatsapp';
  }
  if (
    combined.includes('web') ||
    combined.includes('widget') ||
    conv.startsWith('web_') ||
    conv.startsWith('widget_')
  ) {
    return 'web';
  }
  return 'unified';
}

export function WorkspaceMeetingsTab({
  meetings,
  calendar,
  canManage,
  loading,
  onRefresh,
  isScheduleModalOpen: externalScheduleOpen,
  onCloseScheduleModal: externalCloseSchedule,
  onOpenScheduleModal: externalOpenSchedule,
}: WorkspaceMeetingsTabProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  // View & Filter State
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelTag>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Filter popup modal state
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Pagination State (Used in List View)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, channelFilter, fromDate, toDate, searchQuery, viewMode]);

  // Modal & Drawer State
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const [createInitialDate, setCreateInitialDate] = useState<Date | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Meeting | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ meeting: Meeting; isDecline: boolean } | null>(null);
  const [integrationsModalOpen, setIntegrationsModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [calBusy, setCalBusy] = useState(false);

  const isCreateOpen = externalScheduleOpen !== undefined ? externalScheduleOpen : internalCreateOpen;
  const handleCloseCreate = () => {
    if (externalCloseSchedule) externalCloseSchedule();
    setInternalCreateOpen(false);
    setCreateInitialDate(null);
  };
  const handleOpenCreate = (initialDate?: Date) => {
    if (initialDate) setCreateInitialDate(initialDate);
    else setCreateInitialDate(null);

    if (externalOpenSchedule) externalOpenSchedule();
    else setInternalCreateOpen(true);
  };

  // Active filter count
  const activeFiltersCount =
    (filterStatus !== 'all' ? 1 : 0) +
    (channelFilter !== 'all' ? 1 : 0) +
    (fromDate || toDate ? 1 : 0);

  // Date Navigation (Used in Month View)
  const handlePrevDate = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() - 1);
    setCurrentDate(next);
  };

  const handleNextDate = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const handleTodayDate = () => {
    const now = new Date();
    setCurrentDate(now);
  };

  // Format Month Year Label (for Month view)
  const formattedMonthLabel = useMemo(() => {
    return currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Filter Pipeline
  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = m.title?.toLowerCase().includes(q);
        const matchesName = m.attendee_name?.toLowerCase().includes(q);
        const matchesEmail = m.attendee_email?.toLowerCase().includes(q);
        const matchesPhone = m.attendee_phone?.toLowerCase().includes(q);
        const matchesNotes = m.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesName && !matchesEmail && !matchesPhone && !matchesNotes) {
          return false;
        }
      }

      // 2. Status Filter
      if (filterStatus === 'upcoming') {
        const isFuture = new Date(m.scheduled_start).getTime() >= Date.now() - 3600000;
        const isNotCancelled = m.status !== 'cancelled';
        if (!isFuture || !isNotCancelled) return false;
      } else if (filterStatus !== 'all') {
        if (m.status !== filterStatus) return false;
      }

      // 3. Agent / Channel Filter
      if (channelFilter !== 'all') {
        if (detectMeetingChannel(m) !== channelFilter) return false;
      }

      // 4. Custom Date Range Filter (Applied in List View)
      if (viewMode === 'list') {
        if (fromDate) {
          const [y, mth, d] = fromDate.split('-').map(Number);
          const fromTs = new Date(y!, mth! - 1, d!).getTime();
          if (new Date(m.scheduled_start).getTime() < fromTs) return false;
        }
        if (toDate) {
          const [y, mth, d] = toDate.split('-').map(Number);
          const toTs = new Date(y!, mth! - 1, d!, 23, 59, 59, 999).getTime();
          if (new Date(m.scheduled_start).getTime() > toTs) return false;
        }
      }

      return true;
    });
  }, [meetings, filterStatus, channelFilter, fromDate, toDate, searchQuery, viewMode]);

  // Paginated slice for List View
  const paginatedMeetings = useMemo(() => {
    if (viewMode !== 'list') return filteredMeetings;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMeetings.slice(startIndex, startIndex + pageSize);
  }, [filteredMeetings, currentPage, pageSize, viewMode]);

  // Actions
  const handleCreateMeeting = async (payload: {
    title: string;
    attendee_name: string | null;
    attendee_email: string | null;
    attendee_phone: string | null;
    scheduled_start: string;
    scheduled_end: string;
    durationMin: number;
    description: string | null;
    notes: string | null;
    timezone: string;
  }) => {
    setBusy(true);
    try {
      await apiRequest('/v1/meetings', {
        method: 'POST',
        body: payload,
      });
      toastSuccess('Meeting scheduled successfully.');
      handleCloseCreate();
      await onRefresh();
    } catch (err: any) {
      toastError(err?.message || 'Failed to schedule meeting.');
    } finally {
      setBusy(false);
    }
  };

  const handleRescheduleMeeting = async (id: string, newStartIso: string, newEndIso: string) => {
    setBusy(true);
    try {
      await apiRequest(`/v1/meetings/${id}`, {
        method: 'PATCH',
        body: { scheduled_start: newStartIso, scheduled_end: newEndIso, status: 'rescheduled' },
      });
      toastSuccess('Meeting rescheduled.');
      setRescheduleTarget(null);
      await onRefresh();
    } catch (err: any) {
      toastError(err?.message || 'Failed to reschedule meeting.');
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (id: string) => {
    setBusy(true);
    try {
      await apiRequest(`/v1/meetings/${id}/approve`, {
        method: 'POST',
      });
      toastSuccess('Meeting approved and invite sent.');
      await onRefresh();
    } catch (err: any) {
      toastError(err?.message || 'Failed to approve meeting.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async (id: string) => {
    setBusy(true);
    try {
      await apiRequest(`/v1/meetings/${id}`, {
        method: 'PATCH',
        body: { status: 'confirmed' },
      });
      toastSuccess('Meeting confirmed.');
      await onRefresh();
    } catch (err: any) {
      toastError(err?.message || 'Failed to confirm meeting.');
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async (id: string) => {
    setBusy(true);
    try {
      await apiRequest(`/v1/meetings/${id}`, {
        method: 'PATCH',
        body: { status: 'completed' },
      });
      toastSuccess('Meeting marked as completed.');
      await onRefresh();
    } catch (err: any) {
      toastError(err?.message || 'Failed to complete meeting.');
    } finally {
      setBusy(false);
    }
  };

  const handleSendInvite = async (id: string, email: string | null) => {
    setBusy(true);
    try {
      await apiRequest(`/v1/meetings/${id}/send-invite`, {
        method: 'POST',
      });
      toastSuccess(email ? `Calendar invite sent to ${email}.` : 'Calendar invite sent.');
    } catch (err: any) {
      toastError(err?.message || 'Failed to send invite.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancelMeeting = async () => {
    if (!cancelTarget) return;
    setBusy(true);
    try {
      await apiRequest(`/v1/meetings/${cancelTarget.meeting.id}`, {
        method: 'PATCH',
        body: { status: 'cancelled' },
      });
      toastSuccess(cancelTarget.isDecline ? 'Booking declined.' : 'Meeting cancelled.');
      setCancelTarget(null);
      await onRefresh();
    } catch (err: any) {
      toastError(err?.message || 'Failed to cancel meeting.');
    } finally {
      setBusy(false);
    }
  };

  // Calendar Integrations
  const handleConnectGoogle = async () => {
    setCalBusy(true);
    try {
      const out = await apiRequest<{ authorization_url: string }>('/v1/calendar/google/oauth/start');
      if (out?.authorization_url) {
        window.location.href = out.authorization_url;
      }
    } catch (err: any) {
      toastError(err?.message || 'Google Calendar connection failed');
    } finally {
      setCalBusy(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setCalBusy(true);
    try {
      await apiRequest('/v1/calendar/google/disconnect', { method: 'POST' });
      toastSuccess('Google Calendar disconnected.');
      await onRefresh();
    } catch (err: any) {
      toastError(err?.message || 'Disconnect failed');
    } finally {
      setCalBusy(false);
    }
  };

  const handleConnectCalendly = async (email: string, token: string) => {
    setCalBusy(true);
    try {
      const out = await apiRequest<CalendarConnection>('/v1/calendar/calendly/connect', {
        method: 'POST',
        body: { email, access_token: token },
      });
      toastSuccess(out.connected ? `Calendly connected as ${out.email || email}.` : 'Calendly credentials saved.');
      await onRefresh();
    } catch (err: any) {
      toastError(err?.message || 'Calendly connect failed');
    } finally {
      setCalBusy(false);
    }
  };

  const handleDisconnectCalendly = async () => {
    setCalBusy(true);
    try {
      await apiRequest('/v1/calendar/calendly/disconnect', { method: 'POST' });
      toastSuccess('Calendly disconnected.');
      await onRefresh();
    } catch (err: any) {
      toastError(err?.message || 'Disconnect failed');
    } finally {
      setCalBusy(false);
    }
  };

  const isCalendarConnected = Boolean(
    calendar?.connections?.some((c) => c.connected) ||
    (calendar?.connected_providers && calendar.connected_providers.length > 0)
  );

  return (
    <div className="space-y-3 pb-28 sm:pb-8 animate-in fade-in duration-300">
      {/* ── ROW 1: Premium Dashboard Toolbar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Left Section: Search Input + Date Filter + Filter Pop-up Trigger */}
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
          {/* Search Pill */}
          <div className="relative flex-1 min-w-[130px]">
            <Search size={13} className="absolute left-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings…"
              className="w-full pl-9 pr-8 py-2 bg-white border border-border rounded-full text-xs font-semibold text-foreground outline-none focus:border-[#0396A6] shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Date Filter Dropdown */}
          <TableDateFilter
            preset={!fromDate && !toDate ? "all" : "custom"}
            fromDate={fromDate}
            toDate={toDate}
            onChange={(val) => {
              setFromDate(val.fromDate);
              setToDate(val.toDate);
            }}
          />

          {/* Filter Pop-up Pill Button */}
          <button
            type="button"
            onClick={() => setFilterModalOpen(true)}
            className={`py-2 px-4 rounded-full border text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs ${
              activeFiltersCount > 0
                ? 'bg-[#0396A6] text-white border-[#0396A6] shadow-[0_4px_14px_rgba(3,150,166,0.3)]'
                : 'bg-white hover:bg-[#F7FBFB] text-foreground border-border'
            }`}
            title="Filter Meetings by Status, Agent, or Date"
          >
            <Filter size={13} className={activeFiltersCount > 0 ? "text-white" : "text-[#0396A6]"} />
            <span>Filter</span>
          </button>
        </div>

        {/* Right Section: Date Navigation (when not in list view) + View Switcher + Action Buttons */}
        <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 flex-wrap">
          {/* Month / Date Navigator (when not in list view) */}
          {viewMode !== 'list' && (
            <div className="flex items-center gap-1 bg-white border border-border rounded-2xl p-1 shadow-xs">
              <button
                type="button"
                onClick={handlePrevDate}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-[#F7FBFB] transition-colors cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-black text-foreground px-1.5 select-none whitespace-nowrap">
                {formattedMonthLabel}
              </span>
              <button
                type="button"
                onClick={handleNextDate}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-[#F7FBFB] transition-colors cursor-pointer"
                title="Next month"
              >
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={handleTodayDate}
                className="ml-0.5 px-2.5 py-1 text-xs font-extrabold text-foreground bg-[#F7FBFB] hover:bg-[#0396A6]/10 hover:text-[#0396A6] border border-border rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Today
              </button>
            </div>
          )}

          {/* View Switcher Pill Container (matching 7d/14d/30d/90d) */}
          <div className="bg-white p-1 rounded-2xl border border-border shadow-xs flex items-center gap-1 shrink-0">
            {[
              { id: 'list' as ViewMode, label: 'List', icon: <List size={13} /> },
              { id: 'month' as ViewMode, label: 'Month', icon: <CalendarDays size={13} /> },
              { id: 'week' as ViewMode, label: 'Week', icon: <CalendarRange size={13} /> },
              { id: 'day' as ViewMode, label: 'Day', icon: <Calendar size={13} /> },
            ].map((v) => {
              const active = viewMode === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setViewMode(v.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#0396A6] text-white shadow-sm font-extrabold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-[#F7FBFB]'
                  }`}
                  title={`${v.label} View`}
                >
                  {v.icon}
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Synced Button */}
            <button
              type="button"
              onClick={() => setIntegrationsModalOpen(true)}
              className="py-2 px-3.5 rounded-full bg-white hover:bg-[#F7FBFB] text-foreground border border-border text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs group shrink-0"
              title="Configure Google Calendar & Calendly"
            >
              <span className="font-extrabold text-xs">
                {isCalendarConnected ? 'Synced' : 'Sync'}
              </span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={loading}
              className="p-2 rounded-full bg-white hover:bg-[#F7FBFB] text-foreground border border-border text-xs font-bold transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-xs"
              title="Refresh Meetings"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-[#0396A6]' : 'text-muted-foreground'} />
            </button>

            {/* New Meeting Button */}
            {canManage && (
              <button
                type="button"
                onClick={() => handleOpenCreate()}
                className="py-2 px-4 bg-[#0396A6] hover:bg-[#087681] text-white font-extrabold rounded-full text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(3,150,166,0.35)] transition-all active:scale-98 cursor-pointer shrink-0"
              >
                <Plus size={14} />
                <span>New Meeting</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN VIEW CONTENT (LIST OR CALENDAR VIEWS) ── */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          <MeetingListView
            meetings={paginatedMeetings}
            loading={loading}
            canManage={canManage}
            busy={busy}
            onSelectMeeting={setSelectedMeeting}
            onApprove={(id) => void handleApprove(id)}
            onConfirm={(id) => void handleConfirm(id)}
            onSendInvite={(id, email) => void handleSendInvite(id, email)}
            onRescheduleStart={(m) => setRescheduleTarget(m)}
            onCancelStart={(m, isDecline) => setCancelTarget({ meeting: m, isDecline })}
            onComplete={(id) => void handleComplete(id)}
            filterStatus={filterStatus}
            searchQuery={searchQuery}
            onOpenCreate={() => handleOpenCreate()}
            hasMore={false}
            onLoadMore={() => {}}
          />

          {/* Pagination Controls for List View */}
          {filteredMeetings.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
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
          onSelectMeeting={setSelectedMeeting}
          onCreateAtDate={(d) => {
            handleOpenCreate(d);
          }}
          hasMore={false}
          onLoadMore={() => {}}
          busy={busy}
          loading={loading}
        />
      )}

      {/* ── FILTER POPUP MODAL ── */}
      <MeetingFilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        channelFilter={channelFilter}
        onChannelFilterChange={setChannelFilter}
        fromDate={fromDate}
        onFromDateChange={setFromDate}
        toDate={toDate}
        onToDateChange={setToDate}
        viewMode={viewMode}
      />

      {/* ── MODALS & DRAWERS ── */}
      <NewMeetingModal
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseCreate();
        }}
        busy={busy}
        onCreate={handleCreateMeeting}
        initialDate={createInitialDate}
      />

      <RescheduleModal
        meeting={rescheduleTarget}
        open={Boolean(rescheduleTarget)}
        onOpenChange={(open) => {
          if (!open) setRescheduleTarget(null);
        }}
        busy={busy}
        onReschedule={handleRescheduleMeeting}
      />

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

      <ConfirmModal
        show={Boolean(cancelTarget)}
        title={cancelTarget?.isDecline ? 'Decline Meeting Request' : 'Cancel Scheduled Meeting'}
        message={`Are you sure you want to cancel the meeting "${cancelTarget?.meeting.title || 'Meeting'}" with ${cancelTarget?.meeting.attendee_name || 'the attendee'}?`}
        tone="danger"
        confirmText={cancelTarget?.isDecline ? 'Decline Request' : 'Cancel Meeting'}
        onConfirm={handleCancelMeeting}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
