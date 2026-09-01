'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FileText, Zap, MessageSquare, Search, Filter, RefreshCw, 
  MoreVertical, ExternalLink, Copy, Check, Download, AlertCircle, Sparkles, ChevronLeft, ChevronRight,
  Globe, Smartphone
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { listAllConversations } from '@/lib/conversations';
import { useToast } from '@/lib/toast';
import { TableContainer, Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Dropdown } from '@/components/ui/Dropdown';
import type { Conversation } from '@/lib/types';

interface UsageRecord {
  id: string; // conversation ID
  sessionCode: string; // e.g. #WB-WFUAU7 or #WA-8891AB
  contactLabel: string;
  channel: 'website' | 'whatsapp' | string;
  creditsUsed: number;
  createdAt: string;
  status: 'open' | 'closed' | 'archived' | string;
  lastMessagePreview?: string;
}

interface UsageLogsTabProps {
  agentId?: string | null;
  channel?: 'website' | 'whatsapp' | 'unified';
  onViewChat?: (conversationId: string) => void;
}

export function UsageLogsTab({ agentId, channel = 'website', onViewChat }: UsageLogsTabProps) {
  const { toast, success: toastSuccess, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [usageSummary, setUsageSummary] = useState({
    totalConversations: 0,
    totalCredits: 0,
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'website' | 'whatsapp'>('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Active action menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Usage & Conversations Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const convList = await listAllConversations({
        channel: channel === 'unified' ? undefined : (channel as 'website' | 'whatsapp'),
        agent_id: agentId || undefined,
      });

      const mappedRecords: UsageRecord[] = convList.map((c) => {
        const rawCode = c.id.replace(/-/g, '').slice(0, 6).toUpperCase();
        const cChannel = c.channel === 'whatsapp' ? 'whatsapp' : 'website';
        const prefix = cChannel === 'whatsapp' ? '#WA' : '#WB';
        const sessionCode = `${prefix}-${rawCode}`;

        // Every conversation counts as 1 CR (open or closed).
        const credits =
          c.credits_charged != null && c.credits_charged > 0
            ? Math.round(c.credits_charged)
            : 1;
        const defaultLabel = cChannel === 'whatsapp' ? 'WhatsApp Contact' : 'Website Visitor';

        return {
          id: c.id,
          sessionCode,
          contactLabel: c.contact_label || defaultLabel,
          channel: cChannel,
          creditsUsed: credits,
          createdAt: c.created_at,
          status: c.status,
          lastMessagePreview: c.last_message_preview || '',
        };
      });

      const totalConvs = mappedRecords.length;
      const totalCreds = mappedRecords.reduce((acc, r) => acc + r.creditsUsed, 0);

      setRecords(mappedRecords);
      setUsageSummary({
        totalConversations: totalConvs,
        totalCredits: totalCreds,
      });
    } catch (err: any) {
      console.error('Failed to load usage logs:', err);
      setError(err.message || 'Unable to retrieve conversation usage logs');
    } finally {
      setLoading(false);
    }
  }, [channel, agentId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    const now = new Date();
    return records.filter((r) => {
      // Channel Filter (when unified)
      if (channel === 'unified' && channelFilter !== 'all' && r.channel !== channelFilter) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = r.sessionCode.toLowerCase().includes(q);
        const matchesId = r.id.toLowerCase().includes(q);
        const matchesContact = r.contactLabel.toLowerCase().includes(q);
        if (!matchesCode && !matchesId && !matchesContact) return false;
      }

      // Status
      if (statusFilter && r.status !== statusFilter) return false;

      // Date
      if (dateFilter !== 'all') {
        const d = new Date(r.createdAt);
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        if (dateFilter === 'today' && diffDays > 1) return false;
        if (dateFilter === '7d' && diffDays > 7) return false;
        if (dateFilter === '30d' && diffDays > 30) return false;
      }

      return true;
    });
  }, [records, searchQuery, channel, channelFilter, statusFilter, dateFilter]);

  // Pagination
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const copySessionId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    toastSuccess('Session ID copied to clipboard');
  };

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;
    const headers = ['Session Code', 'Channel', 'Conversation ID', 'Credits Used (CR)', 'Status', 'Date'];
    const rows = filteredRecords.map(r => [
      r.sessionCode,
      r.channel,
      r.id,
      r.creditsUsed,
      r.status,
      new Date(r.createdAt).toISOString()
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${channel}_agent_usage_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Usage logs exported to CSV');
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-xs flex flex-col h-full flex-1 min-h-0 overflow-hidden animate-in fade-in duration-300 mb-24 md:mb-0">
      {/* SECTION HEADER */}
      <div className="px-6 py-4 border-b border-border bg-muted/10 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Usage & Logs</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {channel === 'unified'
              ? 'Track conversations and credits consumed across Web and WhatsApp channels.'
              : channel === 'whatsapp'
              ? 'Track conversations and credits consumed by your WhatsApp Agent.'
              : 'Track conversations and credits consumed by your Web Agent.'}
          </p>
        </div>

        {/* HEADER ACTIONS */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-foreground bg-white hover:bg-muted/50 border border-border rounded-xl transition-colors disabled:opacity-40 shadow-2xs cursor-pointer"
            title="Export CSV"
          >
            <Download size={13} className="text-muted-foreground" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => void fetchData()}
            disabled={loading}
            className="p-2 hover:bg-muted/60 bg-white border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors shadow-2xs cursor-pointer"
            title="Refresh Logs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-[#0396A6]' : ''} />
          </button>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="px-6 py-4 border-b border-border bg-muted/5 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        {/* Total Conversations */}
        <div className="p-3.5 rounded-2xl bg-white border border-border/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conversations</span>
          <div className="text-lg font-black text-foreground mt-0.5">{usageSummary.totalConversations.toLocaleString()}</div>
        </div>

        {/* Credits Used */}
        <div className="p-3.5 rounded-2xl bg-white border border-border/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Credits Used</span>
          <div className="text-lg font-black text-foreground mt-0.5">{Math.round(usageSummary.totalCredits).toLocaleString()} CR</div>
        </div>

        {/* Rate */}
        <div className="p-3.5 rounded-2xl bg-white border border-border/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rate</span>
          <div className="text-lg font-black text-foreground mt-0.5">1 CR / Convo</div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-border bg-white shrink-0">
        {/* ── Mobile: Search row + Filter button ── */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-muted/20 border border-border rounded-xl text-xs outline-none focus:border-[#0396A6] transition-all"
            />
          </div>
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="relative flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-xl text-xs font-bold text-foreground shadow-2xs shrink-0 hover:bg-muted/30 transition-colors"
          >
            <Filter size={13} className="text-[#0396A6]" />
            Filters
            {(statusFilter || dateFilter !== 'all' || channelFilter !== 'all') && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#0396A6] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                {[statusFilter, dateFilter !== 'all', channelFilter !== 'all'].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* ── Desktop: Full inline filter row ── */}
        <div className="hidden lg:flex flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              type="text"
              placeholder={channel === 'unified' ? "Search by session code (#WB-... / #WA-...) or contact..." : "Search by session code or contact..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-muted/20 border border-border rounded-xl text-xs outline-none focus:border-[#0396A6] transition-all"
            />
          </div>

          {/* Filter Dropdowns & Pills */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {channel === 'unified' && (
              <div className="flex items-center p-1 bg-muted/40 rounded-xl border border-border/60 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => { setChannelFilter('all'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${channelFilter === 'all' ? 'bg-white text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  All ({records.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setChannelFilter('website'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${channelFilter === 'website' ? 'bg-white text-[#0396A6] shadow-2xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Globe size={12} /> Web ({records.filter((r) => r.channel === 'website').length})
                </button>
                <button
                  type="button"
                  onClick={() => { setChannelFilter('whatsapp'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${channelFilter === 'whatsapp' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Smartphone size={12} /> WA ({records.filter((r) => r.channel === 'whatsapp').length})
                </button>
              </div>
            )}

            {/* Status */}
            <Dropdown
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(String(val));
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: "All Statuses" },
                { value: "open", label: "Open" },
                { value: "closed", label: "Closed" },
                { value: "archived", label: "Archived" },
              ]}
              size="sm"
              leadingIcon={<Filter size={12} />}
              fullWidth={false}
              style={{ minWidth: 145 }}
            />

            {/* Date Range */}
            <Dropdown
              value={dateFilter}
              onChange={(val) => {
                setDateFilter(String(val));
                setCurrentPage(1);
              }}
              options={[
                { value: "all", label: "All Time" },
                { value: "today", label: "Today" },
                { value: "7d", label: "Last 7 Days" },
                { value: "30d", label: "Last 30 Days" },
              ]}
              size="sm"
              fullWidth={false}
              style={{ minWidth: 140 }}
            />

            {/* Clear Filters */}
            {(() => {
              const hasActiveFilters = Boolean(searchQuery || statusFilter || dateFilter !== 'all' || channelFilter !== 'all');
              return (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('');
                    setDateFilter('all');
                    setChannelFilter('all');
                    setCurrentPage(1);
                  }}
                  disabled={!hasActiveFilters}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    hasActiveFilters ? 'text-[#0396A6] hover:bg-[#0396A6]/10 cursor-pointer' : 'text-muted-foreground/40 cursor-not-allowed opacity-50'
                  }`}
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
        <div className="lg:hidden fixed inset-0 z-[100000] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl shadow-2xl p-5 pb-10 space-y-4 animate-in slide-in-from-bottom duration-300" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-1" />
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Filter size={15} className="text-[#0396A6]" />
                Filters
              </h3>
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter(''); setDateFilter('all'); setChannelFilter('all'); setCurrentPage(1); }}
                disabled={!(statusFilter || dateFilter !== 'all' || channelFilter !== 'all')}
                className="text-xs font-bold text-[#0396A6] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
              <div className="grid grid-cols-4 gap-2">
                {[{ v: '', label: 'All' }, { v: 'open', label: 'Open' }, { v: 'closed', label: 'Closed' }, { v: 'archived', label: 'Archived' }].map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => { setStatusFilter(v); setCurrentPage(1); }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${statusFilter === v ? 'bg-[#0396A6] text-white border-[#0396A6]' : 'bg-muted/20 text-foreground border-border'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date Range</label>
              <div className="grid grid-cols-4 gap-2">
                {[{ v: 'all', label: 'All Time' }, { v: 'today', label: 'Today' }, { v: '7d', label: '7 Days' }, { v: '30d', label: '30 Days' }].map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => { setDateFilter(v); setCurrentPage(1); }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${dateFilter === v ? 'bg-[#0396A6] text-white border-[#0396A6]' : 'bg-muted/20 text-foreground border-border'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full py-3 bg-[#0396A6] text-white text-sm font-extrabold rounded-2xl hover:bg-[#0396A6]/90 transition-colors mt-2"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* SCROLLABLE TABLE AREA */}
      <TableContainer>
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <RefreshCw size={20} className="animate-spin text-[#0396A6]" />
            <span>Loading usage logs...</span>
          </div>
        ) : error ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div className="text-sm font-bold text-foreground">Unable to load usage logs</div>
            <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
            <button
              onClick={() => void fetchData()}
              className="px-4 py-2 bg-[#0396A6] hover:bg-[#0396A6]/90 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              Retry
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center gap-3 animate-in fade-in">
            <div className="w-14 h-14 bg-muted/40 rounded-full flex items-center justify-center mb-1">
              <FileText size={26} className="text-muted-foreground opacity-50" />
            </div>
            <div className="text-sm font-bold text-foreground">No usage logs found</div>
            <p className="text-xs text-muted-foreground max-w-sm">
              {records.length === 0
                ? 'Conversation and credit usage will appear here once your agent starts handling conversations.'
                : 'There are no usage records matching your current filter criteria.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Session</TableHead>
                {channel === 'unified' && <TableHead>Channel</TableHead>}
                <TableHead>Credits Consumed</TableHead>
                <TableHead>Date &amp; Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Action</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {paginatedRecords.map((record) => {
                const isWA = record.channel === 'whatsapp';
                return (
                  <TableRow key={record.id}>
                    {/* Session */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center border shrink-0 ${
                            isWA
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : 'bg-[#EAF8F8] text-[#0396A6] border-[#D9EDEE]'
                          }`}
                        >
                          {isWA ? <Smartphone size={13} /> : <Globe size={13} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-foreground text-xs">{record.sessionCode}</span>
                            {onViewChat && (
                              <button
                                onClick={() => onViewChat?.(record.id)}
                                className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                                title="Open Chat Transcript"
                                aria-label={`View chat for ${record.sessionCode}`}
                              >
                                <ExternalLink size={11} />
                              </button>
                            )}
                            <button
                              onClick={(e) => copySessionId(record.id, e)}
                              className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                              title="Copy full Conversation ID"
                              aria-label={`Copy session ID for ${record.sessionCode}`}
                            >
                              {copiedId === record.id ? <Check size={11} className="text-[#0396A6]" /> : <Copy size={11} />}
                            </button>
                          </div>
                          <span className="text-[11px] text-muted-foreground block truncate max-w-[150px]">
                            {record.contactLabel}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Channel Column (Unified Mode) */}
                    {channel === 'unified' && (
                      <TableCell>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase inline-flex items-center gap-1 border ${
                            isWA
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-[#EAF8F8] text-[#0396A6] border-[#D9EDEE]'
                          }`}
                        >
                          {isWA ? <Smartphone size={10} /> : <Globe size={10} />}
                          {isWA ? 'WhatsApp' : 'Website'}
                        </span>
                      </TableCell>
                    )}

                    {/* Credits */}
                    <TableCell>
                      <span className="text-xs font-semibold text-foreground">
                        {record.creditsUsed} CR
                      </span>
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{formatDateTime(record.createdAt)}</span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wide ${
                          record.status === 'open'
                            ? 'text-emerald-600'
                            : record.status === 'closed'
                            ? 'text-muted-foreground'
                            : 'text-amber-600'
                        }`}
                      >
                        {record.status}
                      </span>
                    </TableCell>

                    {/* Action */}
                    <TableCell align="right">
                      {onViewChat ? (
                        <button
                          type="button"
                          onClick={() => onViewChat?.(record.id)}
                          className="text-xs font-bold text-[#0396A6] hover:text-[#027582] hover:underline transition-colors cursor-pointer inline-flex items-center gap-1 bg-transparent p-0 border-0"
                        >
                          <span>View Chat</span>
                          <ExternalLink size={11} />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => copySessionId(record.id, e)}
                          className="p-1.5 hover:bg-muted/50 rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                          title="Copy ID"
                        >
                          <Copy size={13} />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* PAGINATION */}
      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredRecords.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
        itemLabel="records"
      />
    </div>
  );
}
