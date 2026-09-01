import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Mail, Phone, Flame, Sun, Snowflake, Target, Filter, Download, X, Check, MessageSquare, User, Sparkles } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import type { Lead } from '@/lib/types';
import { useToast } from "@/lib/toast";
import { TableContainer, Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Dropdown } from '@/components/ui/Dropdown';
import { TableDateFilter, type TableDatePreset, type TableDateFilterValue, formatDateIso } from '@/components/ui/TableDateFilter';

interface LeadsTabProps {
  channel?: 'website' | 'whatsapp' | 'unified';
  agentId?: string | null;
}

export function LeadsTab({ channel = 'website', agentId }: LeadsTabProps = {}) {
  const { error: toastError, success } = useToast();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('');
  const [leadTempFilter, setLeadTempFilter] = useState('');
  const [datePreset, setDatePreset] = useState<TableDatePreset>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLeadStatus, setEditingLeadStatus] = useState<string>('');
  const [isUpdatingLead, setIsUpdatingLead] = useState(false);
  const [leadPage, setLeadPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const fetchLeadsData = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const params = new URLSearchParams();
      if (channel) params.set('channel', channel);
      if (agentId && agentId !== 'all') params.set('agent_id', agentId);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const data = await apiRequest<Lead[]>(`/v1/leads${queryStr}`);
      const list = Array.isArray(data) ? data : [];
      setLeads(list);
    } catch (e) {
      console.error("Failed to fetch leads", e);
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [channel, agentId]);

  useEffect(() => {
    fetchLeadsData();
  }, [fetchLeadsData]);

  const handleUpdateLeadStatus = async (leadId: number, newStatus: string) => {
    setIsUpdatingLead(true);
    try {
      await apiRequest(`/v1/leads/${leadId}`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
      }
      success("Lead status updated.");
    } catch (err: any) {
      toastError("Failed to update lead status: " + (err?.message || "Unknown error"));
    } finally {
      setIsUpdatingLead(false);
      setEditingLeadStatus('');
    }
  };

  const exportCsv = () => {
    if (filteredLeads.length === 0) return;
    const headers = ["ID", "Name", "Email", "Phone", "Interest", "Temperature", "Status", "Created At"];
    const rows = filteredLeads.map(l => [
      l.id,
      `"${(l.name || "").replace(/"/g, '""')}"`,
      `"${(l.email || "").replace(/"/g, '""')}"`,
      `"${(l.phone || "").replace(/"/g, '""')}"`,
      `"${(l.interest || l.budget || "").replace(/"/g, '""')}"`,
      l.temperature || "",
      l.status || "",
      l.created_at || ""
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `frosty_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter(l => {
    if (leadSearch && !l.name?.toLowerCase().includes(leadSearch.toLowerCase()) && 
        !l.email?.toLowerCase().includes(leadSearch.toLowerCase()) && 
        !l.phone?.includes(leadSearch)) return false;
    if (leadStatusFilter && l.status !== leadStatusFilter) return false;
    if (leadTempFilter && l.temperature !== leadTempFilter) return false;

    const isDateActive = datePreset !== 'all' || Boolean(fromDate) || Boolean(toDate);
    if (isDateActive && l.created_at) {
      const leadDate = new Date(l.created_at);
      if (!isNaN(leadDate.getTime())) {
        const now = new Date();
        const leadDateIso = formatDateIso(leadDate);
        const todayIsoStr = formatDateIso(now);

        if (datePreset === 'today') {
          if (leadDateIso !== todayIsoStr) return false;
        } else if (datePreset === 'yesterday') {
          const y = new Date();
          y.setDate(now.getDate() - 1);
          if (leadDateIso !== formatDateIso(y)) return false;
        } else if (datePreset === 'week') {
          const diff = now.getTime() - leadDate.getTime();
          if (diff < 0 || diff > 7 * 24 * 60 * 60 * 1000) return false;
        } else if (datePreset === '14d') {
          const diff = now.getTime() - leadDate.getTime();
          if (diff < 0 || diff > 14 * 24 * 60 * 60 * 1000) return false;
        } else if (datePreset === 'month') {
          const diff = now.getTime() - leadDate.getTime();
          if (diff < 0 || diff > 30 * 24 * 60 * 60 * 1000) return false;
        } else if (datePreset === 'this_month') {
          if (leadDate.getFullYear() !== now.getFullYear() || leadDate.getMonth() !== now.getMonth()) return false;
        } else if (datePreset === 'last_month') {
          const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          if (leadDate < firstDayLastMonth || leadDate > lastDayLastMonth) return false;
        } else if (datePreset === 'custom' || fromDate || toDate) {
          if (fromDate) {
            const f = new Date(fromDate + 'T00:00:00');
            if (leadDate < f) return false;
          }
          if (toDate) {
            const t = new Date(toDate + 'T23:59:59.999');
            if (leadDate > t) return false;
          }
        }
      }
    }
    return true;
  });

  const paginatedLeads = filteredLeads.slice((leadPage - 1) * pageSize, leadPage * pageSize);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-border flex flex-col flex-1 min-h-0 h-full overflow-hidden animate-in fade-in duration-300" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Workspace Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-muted/10 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Target size={18} className="text-[#0396A6]" />
            Leads
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Contact information captured by your assistant on your website.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportCsv}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-foreground bg-white hover:bg-muted/50 border border-border rounded-xl transition-colors disabled:opacity-40 shadow-2xs"
            title="Export CSV"
          >
            <Download size={14} className="text-muted-foreground" />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={fetchLeadsData} 
            className="p-2 hover:bg-muted/60 bg-white border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors shadow-2xs"
            title="Refresh Leads"
            disabled={leadsLoading}
          >
            <RefreshCw size={14} className={leadsLoading ? "animate-spin text-[#0396A6]" : ""} />
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-border bg-white shrink-0">

        {/* ── Mobile: Search row + Filter button ── */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
            <input
              type="text"
              placeholder="Search leads..."
              value={leadSearch}
              onChange={(e) => { setLeadSearch(e.target.value); setLeadPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-muted/20 border border-border rounded-xl text-xs outline-none focus:border-[#0396A6] transition-all"
            />
          </div>
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="relative flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-xl text-xs font-bold text-foreground shadow-2xs shrink-0 hover:bg-muted/30 transition-colors"
          >
            <Filter size={13} className="text-[#0396A6]" />
            Filters
            {(leadStatusFilter || leadTempFilter || datePreset !== 'all' || fromDate || toDate) && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#0396A6] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                {[leadStatusFilter, leadTempFilter, datePreset !== 'all' || fromDate || toDate ? 'date' : ''].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* ── Desktop: Full inline filter row using custom Dropdown ── */}
        <div className="hidden md:flex flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              type="text"
              placeholder="Search leads by name, email, or phone..."
              value={leadSearch}
              onChange={(e) => { setLeadSearch(e.target.value); setLeadPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-muted/20 border border-border rounded-xl text-xs outline-none focus:border-[#0396A6] transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Dropdown
              value={leadStatusFilter}
              onChange={(val) => { setLeadStatusFilter(String(val)); setLeadPage(1); }}
              options={[
                { value: "", label: "All Statuses" },
                { value: "new", label: "New" },
                { value: "contacted", label: "Contacted" },
                { value: "qualified", label: "Qualified" },
                { value: "converted", label: "Converted" },
                { value: "lost", label: "Lost" },
              ]}
              size="sm"
              leadingIcon={<Filter size={12} />}
              fullWidth={false}
              style={{ minWidth: 145 }}
            />
            <Dropdown
              value={leadTempFilter}
              onChange={(val) => { setLeadTempFilter(String(val)); setLeadPage(1); }}
              options={[
                { value: "", label: "All Temperatures" },
                { value: "hot", label: "Hot", icon: <Flame size={13} className="text-amber-500" /> },
                { value: "warm", label: "Warm", icon: <Sun size={13} className="text-amber-400" /> },
                { value: "cold", label: "Cold", icon: <Snowflake size={13} className="text-cyan-500" /> },
              ]}
              size="sm"
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
                setLeadPage(1);
              }}
            />
            {(() => {
              const hasActiveFilters = Boolean(leadSearch || leadStatusFilter || leadTempFilter || datePreset !== 'all' || fromDate || toDate);
              return (
                <button
                  type="button"
                  onClick={() => {
                    setLeadSearch('');
                    setLeadStatusFilter('');
                    setLeadTempFilter('');
                    setDatePreset('all');
                    setFromDate('');
                    setToDate('');
                    setLeadPage(1);
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
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-1" />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Filter size={15} className="text-[#0396A6]" />
                Filters
              </h3>
              <button
                onClick={() => {
                  setLeadSearch('');
                  setLeadStatusFilter('');
                  setLeadTempFilter('');
                  setDatePreset('all');
                  setFromDate('');
                  setToDate('');
                  setLeadPage(1);
                }}
                disabled={!leadStatusFilter && !leadTempFilter && datePreset === 'all' && !fromDate && !toDate}
                className="text-xs font-bold text-[#0396A6] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ v: '', label: 'All' }, { v: 'new', label: 'New' }, { v: 'contacted', label: 'Contacted' }, { v: 'qualified', label: 'Qualified' }, { v: 'converted', label: 'Converted' }, { v: 'lost', label: 'Lost' }].map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => { setLeadStatusFilter(v); setLeadPage(1); }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${leadStatusFilter === v ? 'bg-[#0396A6] text-white border-[#0396A6]' : 'bg-muted/20 text-foreground border-border'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Temperature</label>
              <div className="grid grid-cols-4 gap-2">
                {[{ v: '', label: 'All' }, { v: 'hot', label: '🔥 Hot' }, { v: 'warm', label: '⚡ Warm' }, { v: 'cold', label: '❄️ Cold' }].map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => { setLeadTempFilter(v); setLeadPage(1); }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${leadTempFilter === v ? 'bg-[#0396A6] text-white border-[#0396A6]' : 'bg-muted/20 text-foreground border-border'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

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
                      setLeadPage(1);
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

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Custom Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setDatePreset('custom');
                    setLeadPage(1);
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
                    setLeadPage(1);
                  }}
                  className="bg-muted/20 border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-[#0396A6]"
                />
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

      {/* Table Body Area */}
      <TableContainer>
        {leadsLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-2 text-xs text-muted-foreground">
            <RefreshCw size={20} className="animate-spin text-[#0396A6]" />
            Loading Leads...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-3 animate-in fade-in">
            <div className="w-14 h-14 bg-muted/40 rounded-full flex items-center justify-center mb-1">
              <User size={28} className="text-muted-foreground opacity-50" />
            </div>
            <div className="text-sm font-bold text-foreground">
              No leads found
            </div>
            <p className="text-xs text-muted-foreground max-w-sm">
              Your Frosty agent will capture leads during conversations and they will appear here.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Contact / Name</TableHead>
                <TableHead>Interest &amp; Budget</TableHead>
                <TableHead>Temperature</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Captured</TableHead>
                <TableHead align="right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((l) => (
                <TableRow 
                  key={l.id}
                  onClick={() => setSelectedLead(l)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0396A6]/10 text-[#0396A6] font-bold text-xs flex items-center justify-center border border-[#0396A6]/20 shrink-0">
                        {String(l.name || 'U').slice(0, 1).toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-foreground truncate max-w-[160px]">{l.name || "Anonymous Visitor"}</div>
                        {l.email && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate max-w-[160px]">
                            <Mail size={11} className="shrink-0 text-muted-foreground/70" /> {l.email}
                          </div>
                        )}
                        {l.phone && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                            <Phone size={11} className="shrink-0 text-muted-foreground/70" /> {l.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="text-foreground font-semibold truncate max-w-[180px]">{l.interest || "General inquiry"}</div>
                      {l.budget && (
                        <div className="text-[11px] font-medium text-muted-foreground">
                          Budget: {l.budget}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className={`text-xs font-bold capitalize ${
                      l.temperature === 'hot'
                        ? 'text-red-600'
                        : l.temperature === 'warm'
                        ? 'text-amber-600'
                        : 'text-blue-600'
                    }`}>
                      {l.temperature || 'Warm'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-extrabold text-foreground text-xs">
                      {l.score || 0}/100
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className={`text-xs font-bold capitalize ${
                      l.status === 'new' ? 'text-blue-600' :
                      l.status === 'contacted' ? 'text-purple-600' :
                      l.status === 'qualified' ? 'text-[#0396A6]' :
                      l.status === 'converted' ? 'text-emerald-600' :
                      'text-muted-foreground'
                    }`}>
                      {l.status}
                    </span>
                  </TableCell>

                  <TableCell className="text-muted-foreground font-medium whitespace-nowrap">
                    {new Date(l.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>

                  <TableCell align="right" className="whitespace-nowrap">
                    <span className="text-[11px] font-bold text-[#0396A6] group-hover:underline uppercase tracking-wider">
                      View Details
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
        currentPage={leadPage}
        pageSize={pageSize}
        totalItems={filteredLeads.length}
        onPageChange={setLeadPage}
        onPageSizeChange={setPageSize}
        itemLabel="leads"
      />

      {/* Lead Details Modal Dialog */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-white border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[88vh]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h3 className="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2">
                <Target size={14} className="text-[#0396A6]" /> Lead Profile
              </h3>
              <button 
                onClick={() => setSelectedLead(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-5 flex-1 overflow-y-auto no-scrollbar">
              {/* Header info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0396A6]/10 text-[#0396A6] font-black text-lg flex items-center justify-center border border-[#0396A6]/20 shadow-xs shrink-0">
                  {String(selectedLead.name || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-base text-foreground truncate">{selectedLead.name || "Anonymous Visitor"}</div>
                  <div className="text-[11px] text-muted-foreground font-medium">Captured {new Date(selectedLead.created_at).toLocaleString()}</div>
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">STATUS</span>
                {editingLeadStatus ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex-1 min-w-[140px]">
                      <Dropdown
                        value={editingLeadStatus}
                        onChange={(val) => setEditingLeadStatus(String(val))}
                        options={[
                          { value: "new", label: "New" },
                          { value: "contacted", label: "Contacted" },
                          { value: "qualified", label: "Qualified" },
                          { value: "converted", label: "Converted" },
                          { value: "lost", label: "Lost" },
                        ]}
                        size="sm"
                      />
                    </div>
                    <button 
                      onClick={() => handleUpdateLeadStatus(selectedLead.id, editingLeadStatus)}
                      disabled={isUpdatingLead}
                      className="bg-[#0396A6] text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[#02808E] disabled:opacity-50 transition-all shadow-xs"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setEditingLeadStatus('')}
                      className="border border-border px-3 py-2 rounded-xl text-xs font-bold hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold capitalize ${
                      selectedLead.status === 'new' ? 'text-blue-600' :
                      selectedLead.status === 'contacted' ? 'text-purple-600' :
                      selectedLead.status === 'qualified' ? 'text-[#0396A6]' :
                      selectedLead.status === 'converted' ? 'text-emerald-600' :
                      'text-muted-foreground'
                    }`}>
                      {selectedLead.status}
                    </span>
                    <button 
                      onClick={() => setEditingLeadStatus(selectedLead.status)}
                      className="text-xs text-[#0396A6] hover:underline font-bold"
                    >
                      Edit Status
                    </button>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CONTACT INFO</span>
                <div className="bg-muted/10 border border-border rounded-xl p-3.5 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <Mail size={14} className="text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-[9px] font-bold text-muted-foreground uppercase">Email</div>
                      <div className={`text-xs font-bold ${selectedLead.email ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                        {selectedLead.email || 'Not provided'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone size={14} className="text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-[9px] font-bold text-muted-foreground uppercase">Phone</div>
                      <div className={`text-xs font-bold font-mono ${selectedLead.phone ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                        {selectedLead.phone || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intelligence */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">LEAD DETAILS &amp; INTEREST</span>
                <div className="space-y-3 bg-muted/10 border border-border rounded-xl p-3.5 shadow-2xs">
                  <div>
                    <div className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Temperature</div>
                    <div className="flex items-center gap-1.5">
                      {selectedLead.temperature === 'hot' ? <Flame size={16} className="text-red-500" /> : 
                       selectedLead.temperature === 'warm' ? <Sun size={16} className="text-amber-500" /> : 
                       <Snowflake size={16} className="text-blue-500" />}
                      <span className="text-xs font-bold capitalize">{selectedLead.temperature}</span>
                    </div>
                  </div>
                  
                  {selectedLead.budget && (
                    <div>
                      <div className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Budget / Scope</div>
                      <div className="text-xs font-medium text-foreground">{selectedLead.budget}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Stated Interest</div>
                    <div className="text-xs text-foreground bg-white border border-border p-3 rounded-lg italic font-medium">
                      "{selectedLead.interest || "User engaged with the chat assistant."}"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
