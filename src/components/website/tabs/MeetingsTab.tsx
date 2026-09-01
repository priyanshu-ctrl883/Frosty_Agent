import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, RefreshCw, Video, Mail, Phone, CalendarDays, MoreHorizontal, CheckCircle2, XCircle, X, Filter, Download } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import type { Meeting } from '@/lib/types';
import { useToast } from "@/lib/toast";
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { TableContainer, Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Dropdown } from '@/components/ui/Dropdown';
import { TableDateFilter, type TableDatePreset, formatDateIso } from '@/components/ui/TableDateFilter';

interface MeetingsTabProps {
  channel?: 'website' | 'whatsapp' | 'unified';
  agentId?: string | null;
}

const meetingStatusTextClass = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'text-[#0396A6]';
    case 'pending_approval':
      return 'text-amber-600';
    case 'completed':
      return 'text-emerald-600';
    case 'cancelled':
      return 'text-red-600';
    case 'scheduled':
      return 'text-blue-600';
    default:
      return 'text-muted-foreground';
  }
};

const formatMeetingStatus = (status: string) => status.replace(/_/g, ' ');

export function MeetingsTab({ channel = 'website', agentId }: MeetingsTabProps = {}) {
  const { toast, error: toastError, success } = useToast();
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingSearch, setMeetingSearch] = useState('');
  const [meetingStatusFilter, setMeetingStatusFilter] = useState('');
  const [datePreset, setDatePreset] = useState<TableDatePreset>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [meetingPage, setMeetingPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isUpdatingMeeting, setIsUpdatingMeeting] = useState(false);
  const [confirmState, setConfirmState] = useState<{isOpen: boolean, action: (() => void) | null, message: string}>({ isOpen: false, action: null, message: '' });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const fetchMeetingsData = useCallback(async () => {
    setMeetingsLoading(true);
    try {
      const params = new URLSearchParams();
      if (channel) params.set('channel', channel);
      if (agentId && agentId !== 'all') params.set('agent_id', agentId);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const data = await apiRequest<Meeting[]>(`/v1/meetings${queryStr}`);
      const list = Array.isArray(data) ? data : [];
      setMeetings(list);
    } catch (e) {
      console.error("Failed to fetch meetings", e);
      setMeetings([]);
    } finally {
      setMeetingsLoading(false);
    }
  }, [channel, agentId]);

  useEffect(() => {
    fetchMeetingsData();
  }, [fetchMeetingsData]);

  const handleApproveMeeting = async (meetingId: string) => {
    setIsUpdatingMeeting(true);
    try {
      await apiRequest(`/v1/meetings/${meetingId}/approve`, { method: 'POST' });
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, status: 'confirmed' } : m));
      if (selectedMeeting?.id === meetingId) {
        setSelectedMeeting(prev => prev ? { ...prev, status: 'confirmed' } : null);
      }
      success("Meeting booking approved!");
    } catch (err: any) {
      toastError("Failed to approve meeting: " + (err?.message || "Unknown error"));
    } finally {
      setIsUpdatingMeeting(false);
    }
  };

  const handleCancelMeeting = (meetingId: string) => {
    setConfirmState({
      isOpen: true,
      message: "Are you sure you want to cancel this scheduled meeting?",
      action: async () => {
        setIsUpdatingMeeting(true);
        try {
          await apiRequest(`/v1/meetings/${meetingId}`, {
            method: 'PATCH',
            body: { status: 'cancelled' },
          });
          setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, status: 'cancelled' } : m));
          if (selectedMeeting?.id === meetingId) {
            setSelectedMeeting(prev => prev ? { ...prev, status: 'cancelled' } : null);
          }
          toast("Meeting has been marked as cancelled.");
        } catch (err: any) {
          toastError("Failed to cancel meeting: " + (err?.message || "Unknown error"));
        } finally {
          setIsUpdatingMeeting(false);
        }
      }
    });
  };

  const exportCsv = () => {
    if (filteredMeetings.length === 0) return;
    const headers = ["ID", "Title", "Attendee Name", "Attendee Email", "Attendee Phone", "Scheduled Start", "Scheduled End", "Status", "Meet Link", "Notes", "Created At"];
    const rows = filteredMeetings.map(m => [
      m.id,
      `"${(m.title || "").replace(/"/g, '""')}"`,
      `"${(m.attendee_name || "").replace(/"/g, '""')}"`,
      `"${(m.attendee_email || "").replace(/"/g, '""')}"`,
      `"${(m.attendee_phone || "").replace(/"/g, '""')}"`,
      m.scheduled_start || "",
      m.scheduled_end || "",
      m.status || "",
      `"${(m.meet_link || "").replace(/"/g, '""')}"`,
      `"${(m.notes || m.description || "").replace(/"/g, '""')}"`,
      m.created_at || ""
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `frosty_meetings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredMeetings = meetings.filter(m => {
    if (meetingSearch && !m.title?.toLowerCase().includes(meetingSearch.toLowerCase()) && 
        !m.attendee_name?.toLowerCase().includes(meetingSearch.toLowerCase()) &&
        !m.attendee_email?.toLowerCase().includes(meetingSearch.toLowerCase())) return false;

    if (meetingStatusFilter === 'upcoming') {
      const now = Date.now();
      const meetStart = new Date(m.scheduled_start || m.created_at).getTime();
      if (meetStart < now - 3600000 || m.status === 'cancelled') return false;
    } else if (meetingStatusFilter && m.status !== meetingStatusFilter) {
      return false;
    }

    const isDateActive = datePreset !== 'all' || Boolean(fromDate) || Boolean(toDate);
    if (isDateActive) {
      const meetDateStr = m.scheduled_start || m.created_at;
      if (!meetDateStr) return false;
      const meetDate = new Date(meetDateStr);
      if (!isNaN(meetDate.getTime())) {
        const now = new Date();
        const meetDateIso = formatDateIso(meetDate);
        const todayIsoStr = formatDateIso(now);

        if (datePreset === 'today') {
          if (meetDateIso !== todayIsoStr) return false;
        } else if (datePreset === 'yesterday') {
          const y = new Date();
          y.setDate(now.getDate() - 1);
          if (meetDateIso !== formatDateIso(y)) return false;
        } else if (datePreset === 'week') {
          const diff = Math.abs(now.getTime() - meetDate.getTime());
          if (diff > 7 * 24 * 60 * 60 * 1000) return false;
        } else if (datePreset === '14d') {
          const diff = Math.abs(now.getTime() - meetDate.getTime());
          if (diff > 14 * 24 * 60 * 60 * 1000) return false;
        } else if (datePreset === 'month') {
          const diff = Math.abs(now.getTime() - meetDate.getTime());
          if (diff > 30 * 24 * 60 * 60 * 1000) return false;
        } else if (datePreset === 'this_month') {
          if (meetDate.getFullYear() !== now.getFullYear() || meetDate.getMonth() !== now.getMonth()) return false;
        } else if (datePreset === 'last_month') {
          const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          if (meetDate < firstDayLastMonth || meetDate > lastDayLastMonth) return false;
        } else if (datePreset === 'custom' || fromDate || toDate) {
          if (fromDate) {
            const f = new Date(fromDate + 'T00:00:00');
            if (meetDate < f) return false;
          }
          if (toDate) {
            const t = new Date(toDate + 'T23:59:59.999');
            if (meetDate > t) return false;
          }
        }
      }
    }

    return true;
  });

  const paginatedMeetings = filteredMeetings.slice((meetingPage - 1) * pageSize, meetingPage * pageSize);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-border flex flex-col flex-1 min-h-0 h-full overflow-hidden animate-in fade-in duration-300" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-muted/10 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Calendar size={18} className="text-[#0396A6]" />
            Meetings
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upcoming meetings and scheduled appointments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={filteredMeetings.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-foreground bg-white hover:bg-muted/50 border border-border rounded-xl transition-colors disabled:opacity-40 shadow-2xs cursor-pointer"
            title="Export CSV"
          >
            <Download size={13} className="text-muted-foreground" />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={fetchMeetingsData} 
            className="p-2 hover:bg-muted/60 bg-white border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors shadow-2xs cursor-pointer"
            title="Refresh"
            disabled={meetingsLoading}
          >
            <RefreshCw size={14} className={meetingsLoading ? "animate-spin text-[#0396A6]" : ""} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-border bg-white shrink-0">

        {/* ── Mobile: Search row + Filter button ── */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
            <input
              type="text"
              placeholder="Search meetings..."
              value={meetingSearch}
              onChange={(e) => { setMeetingSearch(e.target.value); setMeetingPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-muted/20 border border-border rounded-xl text-xs outline-none focus:border-[#0396A6] transition-all"
            />
          </div>
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="relative flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-xl text-xs font-bold text-foreground shadow-2xs shrink-0 hover:bg-muted/30 transition-colors"
          >
            <Filter size={13} className="text-[#0396A6]" />
            Filters
            {(meetingStatusFilter || datePreset !== 'all' || fromDate || toDate) && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#0396A6] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                {[meetingStatusFilter, datePreset !== 'all' || fromDate || toDate ? 'date' : ''].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* ── Desktop: Full inline filter row ── */}
        <div className="hidden md:flex flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              type="text"
              placeholder="Search meetings by attendee or title..."
              value={meetingSearch}
              onChange={(e) => { setMeetingSearch(e.target.value); setMeetingPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-muted/20 border border-border rounded-xl text-xs outline-none focus:border-[#0396A6] transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Dropdown
              value={meetingStatusFilter}
              onChange={(val) => { setMeetingStatusFilter(String(val)); setMeetingPage(1); }}
              options={[
                { value: "", label: "All Statuses" },
                { value: "confirmed", label: "Confirmed" },
                { value: "pending_approval", label: "Pending Approval" },
                { value: "scheduled", label: "Scheduled" },
                { value: "cancelled", label: "Cancelled" },
                { value: "completed", label: "Completed" },
              ]}
              size="sm"
              leadingIcon={<Filter size={12} />}
              fullWidth={false}
              style={{ minWidth: 155 }}
            />
            <TableDateFilter
              preset={datePreset}
              fromDate={fromDate}
              toDate={toDate}
              onChange={(val) => {
                setDatePreset(val.preset);
                setFromDate(val.fromDate);
                setToDate(val.toDate);
                setMeetingPage(1);
              }}
            />
            {(() => {
              const hasActiveFilters = Boolean(meetingSearch || meetingStatusFilter || datePreset !== 'all' || fromDate || toDate);
              return (
                <button
                  type="button"
                  onClick={() => {
                    setMeetingSearch('');
                    setMeetingStatusFilter('');
                    setDatePreset('all');
                    setFromDate('');
                    setToDate('');
                    setMeetingPage(1);
                  }}
                  disabled={!hasActiveFilters}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${hasActiveFilters ? 'text-[#0396A6] hover:bg-[#0396A6]/10 cursor-pointer' : 'text-muted-foreground/40 cursor-not-allowed opacity-50'}`}
                >
                  Clear Filters
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Bottom Drawer ── */}
      {mobileFilterOpen && (
        <div className="md:hidden fixed inset-0 z-[100000] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setMobileFilterOpen(false)}
          />
          {/* Drawer */}
          <div className="relative bg-white rounded-t-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}>
            {/* Handle bar */}
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-1" />

            {/* Drawer Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Filter size={15} className="text-[#0396A6]" />
                Filters
              </h3>
              <button
                onClick={() => {
                  setMeetingSearch('');
                  setMeetingStatusFilter('');
                  setDatePreset('all');
                  setFromDate('');
                  setToDate('');
                  setMeetingPage(1);
                }}
                disabled={!meetingStatusFilter && datePreset === 'all' && !fromDate && !toDate}
                className="text-xs font-bold text-[#0396A6] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ v: '', label: 'All' }, { v: 'confirmed', label: 'Confirmed' }, { v: 'pending_approval', label: 'Pending' }, { v: 'scheduled', label: 'Scheduled' }, { v: 'cancelled', label: 'Cancelled' }, { v: 'completed', label: 'Completed' }].map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => { setMeetingStatusFilter(v); setMeetingPage(1); }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${meetingStatusFilter === v ? 'bg-[#0396A6] text-white border-[#0396A6]' : 'bg-muted/20 text-foreground border-border'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Presets */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date Presets</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { key: 'all', label: 'All Time' },
                  { key: 'today', label: 'Today' },
                  { key: 'yesterday', label: 'Yesterday' },
                  { key: 'week', label: '7 Days' },
                  { key: '14d', label: '14 Days' },
                  { key: 'month', label: '30 Days' },
                  { key: 'this_month', label: 'This Month' },
                  { key: 'last_month', label: 'Last Month' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const p = key as TableDatePreset;
                      setDatePreset(p);
                      const now = new Date();
                      if (p === 'all') {
                        setFromDate('');
                        setToDate('');
                      } else if (p === 'today') {
                        const iso = formatDateIso(now);
                        setFromDate(iso);
                        setToDate(iso);
                      } else if (p === 'yesterday') {
                        const y = new Date();
                        y.setDate(now.getDate() - 1);
                        setFromDate(formatDateIso(y));
                        setToDate(formatDateIso(y));
                      } else if (p === 'week') {
                        const start = new Date();
                        start.setDate(now.getDate() - 6);
                        setFromDate(formatDateIso(start));
                        setToDate(formatDateIso(now));
                      } else if (p === '14d') {
                        const start = new Date();
                        start.setDate(now.getDate() - 13);
                        setFromDate(formatDateIso(start));
                        setToDate(formatDateIso(now));
                      } else if (p === 'month') {
                        const start = new Date();
                        start.setDate(now.getDate() - 29);
                        setFromDate(formatDateIso(start));
                        setToDate(formatDateIso(now));
                      } else if (p === 'this_month') {
                        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                        setFromDate(formatDateIso(firstDay));
                        setToDate(formatDateIso(now));
                      } else if (p === 'last_month') {
                        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                        setFromDate(formatDateIso(firstDayLastMonth));
                        setToDate(formatDateIso(lastDayLastMonth));
                      }
                      setMeetingPage(1);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                      datePreset === key
                        ? 'bg-[#0396A6] text-white border-[#0396A6]'
                        : 'bg-muted/20 text-foreground border-border'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Range */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Custom Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setDatePreset('custom');
                    setMeetingPage(1);
                  }}
                  className="bg-muted/20 border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-[#0396A6]"
                />
                <input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setDatePreset('custom');
                    setMeetingPage(1);
                  }}
                  className="bg-muted/20 border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-[#0396A6]"
                />
              </div>
            </div>

            {/* Apply button */}
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full py-3 bg-[#0396A6] text-white text-sm font-extrabold rounded-2xl hover:bg-[#0396A6]/90 transition-colors mt-2"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Table Body Area */}
      <TableContainer>
        {meetingsLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-2 text-xs text-muted-foreground">
            <RefreshCw size={20} className="animate-spin text-[#0396A6]" />
            Loading Meetings...
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-3 animate-in fade-in">
            <div className="w-14 h-14 bg-muted/40 rounded-full flex items-center justify-center mb-1">
              <Calendar size={28} className="text-muted-foreground opacity-50" />
            </div>
            <div className="text-sm font-bold text-foreground">
              No meetings found
            </div>
            <p className="text-xs text-muted-foreground max-w-sm">
              {channel === 'whatsapp'
                ? 'When WhatsApp contacts book time on your calendar through the chat assistant, scheduled meetings will show up here.'
                : channel === 'unified'
                ? 'When contacts book time across Web or WhatsApp through your assistant, scheduled meetings will show up here.'
                : 'When website visitors book time on your calendar through the chat assistant, scheduled meetings will show up here.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Meeting / Title</TableHead>
                <TableHead>Attendee Info</TableHead>
                <TableHead>Date &amp; Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {paginatedMeetings.map((m) => (
                <TableRow 
                  key={m.id}
                  onClick={() => setSelectedMeeting(m)}
                >
                  <TableCell>
                    <div className="font-bold text-foreground flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center shrink-0">
                        <Video size={13} />
                      </div>
                      <span className="truncate max-w-[200px]">{m.title || "Sales Consultation"}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-bold text-foreground truncate max-w-[180px]">{m.attendee_name || "Website Visitor"}</div>
                      {m.attendee_email && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate max-w-[180px]">
                          <Mail size={11} className="shrink-0 text-muted-foreground/70" /> {m.attendee_email}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <CalendarDays size={13} className="text-muted-foreground" />
                      {new Date(m.scheduled_start).toLocaleString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: 'numeric', minute: '2-digit'
                      })}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className={`text-xs font-bold capitalize ${meetingStatusTextClass(m.status)}`}>
                      {formatMeetingStatus(m.status)}
                    </span>
                  </TableCell>

                  <TableCell align="right" className="whitespace-nowrap">
                    <span className="text-[11px] font-bold text-[#0396A6] group-hover:underline uppercase tracking-wider">
                      View
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Pagination Footer */}
      <Pagination
        currentPage={meetingPage}
        pageSize={pageSize}
        totalItems={filteredMeetings.length}
        onPageChange={setMeetingPage}
        onPageSizeChange={setPageSize}
        itemLabel="meetings"
      />

      {/* Meeting Details Modal Dialog */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-white border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[88vh]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h3 className="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2">
                <Calendar size={14} className="text-[#0396A6]" /> Meeting Details
              </h3>
              <button 
                onClick={() => setSelectedMeeting(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-5 flex-1 overflow-y-auto no-scrollbar">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">TITLE</span>
                <div className="font-extrabold text-base text-foreground flex items-center gap-2">
                  <Video size={16} className="text-[#0396A6]" />
                  {selectedMeeting.title || "Sales Consultation"}
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-border/50">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ATTENDEE</span>
                <div className="bg-muted/10 border border-border rounded-xl p-3.5 space-y-1.5">
                  <div className="font-bold text-xs text-foreground">{selectedMeeting.attendee_name || "Website Visitor"}</div>
                  {selectedMeeting.attendee_email && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Mail size={12} /> {selectedMeeting.attendee_email}
                    </div>
                  )}
                  {selectedMeeting.attendee_phone && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                      <Phone size={12} /> {selectedMeeting.attendee_phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-border/50">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">SCHEDULED TIME</span>
                <div className="text-xs font-semibold text-foreground bg-muted/10 border border-border rounded-xl p-3">
                  {new Date(selectedMeeting.scheduled_start).toLocaleString(undefined, {
                    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric',
                    hour: 'numeric', minute: '2-digit'
                  })}
                  <div className="text-[11px] text-muted-foreground font-normal mt-0.5">
                    Duration: {Math.round((new Date(selectedMeeting.scheduled_end).getTime() - new Date(selectedMeeting.scheduled_start).getTime()) / 60000)} minutes
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-border/50">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">STATUS</span>
                <div>
                  <span className={`text-xs font-bold capitalize ${meetingStatusTextClass(selectedMeeting.status)}`}>
                    {formatMeetingStatus(selectedMeeting.status)}
                  </span>
                </div>
              </div>

              {selectedMeeting.meet_link && (
                <div className="space-y-1 pt-2 border-t border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">MEETING LINK</span>
                  <div>
                    <a href={selectedMeeting.meet_link} target="_blank" rel="noreferrer" className="text-xs text-[#0396A6] hover:underline break-all font-semibold flex items-center gap-1.5">
                      <Video size={13} /> {selectedMeeting.meet_link}
                    </a>
                  </div>
                </div>
              )}
              
              <div className="space-y-2 pt-4 border-t border-border">
                {selectedMeeting.status === 'pending_approval' && (
                  <button
                    onClick={() => handleApproveMeeting(selectedMeeting.id)}
                    disabled={isUpdatingMeeting}
                    className="w-full py-2.5 bg-[#0396A6] text-white font-bold text-xs rounded-xl hover:bg-[#02808E] disabled:opacity-50 transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={14} /> Approve Meeting
                  </button>
                )}
                {selectedMeeting.status !== 'cancelled' && (
                  <button
                    onClick={() => handleCancelMeeting(selectedMeeting.id)}
                    disabled={isUpdatingMeeting}
                    className="w-full py-2.5 border border-red-200 bg-red-50/50 text-red-600 font-bold text-xs rounded-xl hover:bg-red-100/60 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={14} /> Cancel Meeting
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title="Confirm Action"
        message={confirmState.message}
        onConfirm={() => {
          if (confirmState.action) confirmState.action();
          setConfirmState({ isOpen: false, action: null, message: '' });
        }}
        onCancel={() => setConfirmState({ isOpen: false, action: null, message: '' })}
      />
    </div>
  );
}
