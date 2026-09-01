"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Globe,
  Layers,
  MessageCircle,
  MoreVertical,
  RefreshCw,
  Search,
  Settings2,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TableDateFilter, type TableDatePreset } from "@/components/ui/TableDateFilter";
import { DynamicFilterPopover } from "./DynamicFilterPopover";
import type { ColumnId, DynamicFilterRule } from "../types/filter";
import { applyDynamicFilters } from "../utils/filterEngine";
import { LeadsChannelAgentFilter, type LeadsChannelFilter } from "./LeadsChannelAgentFilter";
import type { Agent, Lead } from "@/lib/types";
import { dateTime, relative, titleCase } from "@/lib/format";
import styles from "../leads.module.css";

type ChannelFilter = LeadsChannelFilter;
type StatusFilter = "all" | "new" | "contacted" | "qualified" | "converted" | "lost";
type SortField = "name" | "channel" | "score" | "status" | "follow_up_sent" | "created_at";

const OUTREACH_VISIBLE_COLUMNS: ColumnId[] = [
  "name",
  "email",
  "phone",
  "channel",
  "status",
  "score",
  "temperature",
  "interest",
  "budget",
  "created_at",
];

const STATUSES: Lead["status"][] = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];

interface Props {
  leads: Lead[];
  loading: boolean;
  agents: Agent[];
  channelFilter: ChannelFilter;
  agentScope: string;
  onChannelChange: (next: ChannelFilter) => void;
  onAgentChange: (agentId: string) => void;
  onRefresh: () => void;
  onOpenOutreachDrawer: (lead: Lead) => void;
  onOpenWhatsAppTemplateModal: (lead: Lead) => void;
  onOpenFollowUpSettings: () => void;
  onUpdateLeadStatus: (leadId: number, status: string) => Promise<void>;
  canWrite: boolean;
}

export function OutreachTab({
  leads,
  loading,
  agents,
  channelFilter,
  agentScope,
  onChannelChange,
  onAgentChange,
  onRefresh,
  onOpenOutreachDrawer,
  onOpenWhatsAppTemplateModal,
  onOpenFollowUpSettings,
  onUpdateLeadStatus,
  canWrite,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionDropdownOpenId, setActionDropdownOpenId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  // Time-Wise Date Filter State
  const [datePreset, setDatePreset] = useState<TableDatePreset>("all");
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

  // Dynamic More Filters State
  const [filterRules, setFilterRules] = useState<DynamicFilterRule[]>([]);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const filterPopoverAnchorRef = useRef<HTMLDivElement>(null);

  // Sorting State
  const [sortField, setSortField] = useState<SortField | null>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>("desc");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, channelFilter, agentScope, statusFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") {
        setSortField(null);
        setSortDir(null);
      } else setSortDir("asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  // Filtered and Sorted Leads
  const filteredLeads = useMemo(() => {
    let list = leads.filter((l) => {
      // Only show leads that have been sent outreach
      if (!l.follow_up_sent) return false;

      // Status
      if (statusFilter !== "all" && l.status !== statusFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const terms = q.split(/\s+/).filter(Boolean);
        const searchTarget = [l.name, l.email, l.phone, l.interest, l.budget, l.source]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const match = terms.every((t) => searchTarget.includes(t));
        if (!match) return false;
      }

      // Time-wise Date Filter
      if (datePreset !== "all" || fromDate || toDate) {
        const leadDate = new Date(l.created_at || 0);
        const now = new Date();

        if (datePreset === "yesterday") {
          const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, -1);
          if (leadDate < yesterdayStart || leadDate > yesterdayEnd) return false;
        } else if (datePreset === "week" || datePreset === "14d") {
          const days = datePreset === "week" ? 7 : 14;
          const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          if (leadDate < cutoff) return false;
        } else if (datePreset === "month" || datePreset === "this_month") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          if (leadDate < startOfMonth) return false;
        } else if (datePreset === "last_month") {
          const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          if (leadDate < firstDayLastMonth || leadDate > lastDayLastMonth) return false;
        } else if (datePreset === "custom" || fromDate || toDate) {
          if (fromDate) {
            const f = new Date(fromDate + "T00:00:00");
            if (leadDate < f) return false;
          }
          if (toDate) {
            const t = new Date(toDate + "T23:59:59.999");
            if (leadDate > t) return false;
          }
        }
      }

      return true;
    });

    // Dynamic Column Filters
    if (filterRules.length > 0) {
      list = applyDynamicFilters(list, filterRules, [], {}, OUTREACH_VISIBLE_COLUMNS);
    }

    if (sortField && sortDir) {
      return [...list].sort((a, b) => {
        if (sortField === "score") {
          const numA = a.score ?? 0;
          const numB = b.score ?? 0;
          return sortDir === "asc" ? numA - numB : numB - numA;
        }
        if (sortField === "created_at") {
          const timeA = new Date(a.created_at || 0).getTime();
          const timeB = new Date(b.created_at || 0).getTime();
          return sortDir === "asc" ? timeA - timeB : timeB - timeA;
        }
        const strA = String(a[sortField] || "").toLowerCase();
        const strB = String(b[sortField] || "").toLowerCase();
        return sortDir === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return list;
  }, [leads, statusFilter, searchQuery, datePreset, fromDate, toDate, filterRules, sortField, sortDir]);

  // Pagination calculations
  const totalLeads = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalLeads / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const startIndex = (clampedPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalLeads);

  const paginatedLeads = useMemo(() => {
    return filteredLeads.slice(startIndex, endIndex);
  }, [filteredLeads, startIndex, endIndex]);

  // Quick Action Handlers
  const handleOutreachAction = (lead: Lead) => {
    if (lead.channel === "whatsapp") {
      onOpenWhatsAppTemplateModal(lead);
    } else {
      onOpenOutreachDrawer(lead);
    }
  };

  const handleStatusChange = async (leadId: number, newStatus: string) => {
    setUpdatingStatusId(leadId);
    try {
      await onUpdateLeadStatus(leadId, newStatus);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleExportCSV = () => {
    if (!filteredLeads.length) return;
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Channel",
      "Score",
      "Temperature",
      "Status",
      "Interest",
      "Budget",
      "Follow-up Sent",
      "Follow-up Date",
      "Created At",
    ];

    const rows = filteredLeads.map((l) => [
      l.id,
      `"${(l.name || "").replace(/"/g, '""')}"`,
      `"${(l.email || "").replace(/"/g, '""')}"`,
      `"${(l.phone || "").replace(/"/g, '""')}"`,
      l.channel || "website",
      l.score ?? 0,
      l.temperature || "cold",
      l.status || "new",
      `"${(l.interest || "").replace(/"/g, '""')}"`,
      `"${(l.budget || "").replace(/"/g, '""')}"`,
      l.follow_up_sent ? "Yes" : "No",
      l.updated_at || l.created_at,
      l.created_at,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `outreach_leads_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for generating page numbers
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (clampedPage > 3) pages.push("...");
      const start = Math.max(2, clampedPage - 1);
      const end = Math.min(totalPages - 1, clampedPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (clampedPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={11} className={styles.sortIconInactive} />;
    }
    return sortDir === "asc" ? (
      <ArrowUp size={12} className={styles.sortIconActive} />
    ) : (
      <ArrowDown size={12} className={styles.sortIconActive} />
    );
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (channelFilter !== "all" ? 1 : 0) +
    (agentScope !== "all" ? 1 : 0) +
    (datePreset !== "all" || fromDate || toDate ? 1 : 0) +
    filterRules.length;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      {/* ── Top Workspace Controls ── */}
      <div className={styles.workspaceHeader}>
        <div className={styles.toolbar}>
          {/* Search */}
          <div className={styles.search}>
            <Search className={styles.searchIcon} size={15} />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search outreach leads…"
              aria-label="Search outreach leads"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="w-36">
            <Select
              size="sm"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val as StatusFilter);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "new", label: "New" },
                { value: "contacted", label: "Contacted" },
                { value: "qualified", label: "Qualified" },
                { value: "converted", label: "Converted" },
                { value: "lost", label: "Lost" },
              ]}
            />
          </div>

          {/* Time-Wise Date Filter */}
          <TableDateFilter
            preset={datePreset}
            fromDate={fromDate || undefined}
            toDate={toDate || undefined}
            onChange={(val) => {
              setDatePreset(val.preset);
              setFromDate(val.fromDate || null);
              setToDate(val.toDate || null);
              setPage(1);
            }}
          />

          {/* Dynamic Column-Driven Filters Popover (More Filters) */}
          <div className="relative" ref={filterPopoverAnchorRef}>
            <button
              type="button"
              className={`${styles.filterToggleBtn} ${
                showFilterPopover || filterRules.length > 0 ? styles.filterToggleActive : ""
              }`}
              onClick={() => setShowFilterPopover((v) => !v)}
              aria-label="Toggle dynamic filters"
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {filterRules.length > 0 && (
                <span className={styles.filterBadge}>{filterRules.length}</span>
              )}
              {showFilterPopover ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            <DynamicFilterPopover
              isOpen={showFilterPopover}
              onClose={() => setShowFilterPopover(false)}
              visibleColumns={OUTREACH_VISIBLE_COLUMNS}
              customFields={[]}
              appliedRules={filterRules}
              onApplyRules={(rules) => {
                setFilterRules(rules);
                setPage(1);
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={onOpenFollowUpSettings}
              className="text-xs h-8 px-2.5 border border-border bg-background hover:bg-muted font-bold flex items-center gap-1.5"
            >
              <Settings2 size={13} />
              <span>Settings</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onRefresh}
              disabled={loading}
              className="text-xs h-8 px-2.5 border border-border bg-background hover:bg-muted font-bold flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleExportCSV}
              disabled={!filteredLeads.length}
              className="text-xs h-8 px-2.5 border border-border bg-background hover:bg-muted font-bold flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Channel + agent filter */}
        <LeadsChannelAgentFilter
          channel={channelFilter}
          agentScope={agentScope}
          agents={agents}
          onChannelChange={(ch) => {
            onChannelChange(ch);
            setPage(1);
          }}
          onAgentChange={(id) => {
            onAgentChange(id);
            setPage(1);
          }}
        />

        {/* ─── Active Filter Chips Bar ─── */}
        {activeFiltersCount > 0 && (
          <div className={styles.activeChipsRow}>
            <span className="text-xs text-muted-foreground font-semibold mr-1">Active filters:</span>
            {searchQuery && (
              <span className={styles.activeChip}>
                Search: &ldquo;{searchQuery}&rdquo;
                <button
                  type="button"
                  className={styles.activeChipRemove}
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {statusFilter !== "all" && (
              <span className={styles.activeChip}>
                Status: {titleCase(statusFilter)}
                <button
                  type="button"
                  className={styles.activeChipRemove}
                  onClick={() => setStatusFilter("all")}
                  aria-label="Clear status filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {channelFilter !== "all" && (
              <span className={styles.activeChip}>
                Channel: {channelFilter === "whatsapp" ? "WhatsApp" : "Website"}
                <button
                  type="button"
                  className={styles.activeChipRemove}
                  onClick={() => onChannelChange("all")}
                  aria-label="Clear channel filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {agentScope !== "all" && (
              <span className={styles.activeChip}>
                Agent: {agents.find((a) => a.id === agentScope)?.agent_name || "Selected"}
                <button
                  type="button"
                  className={styles.activeChipRemove}
                  onClick={() => onAgentChange("all")}
                  aria-label="Clear agent filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {(datePreset !== "all" || fromDate || toDate) && (
              <span className={styles.activeChip}>
                Date: {datePreset.toUpperCase()}
                <button
                  type="button"
                  className={styles.activeChipRemove}
                  onClick={() => {
                    setDatePreset("all");
                    setFromDate(null);
                    setToDate(null);
                  }}
                  aria-label="Clear date filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {filterRules.map((rule) => (
              <span key={rule.id} className={styles.activeChip}>
                {titleCase(rule.columnId)}: {rule.operator} {rule.value ? `"${rule.value}"` : ""}
                <button
                  type="button"
                  className={styles.activeChipRemove}
                  onClick={() => setFilterRules((prev) => prev.filter((r) => r.id !== rule.id))}
                  aria-label="Remove filter rule"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              type="button"
              className={styles.clearAllFiltersBtn}
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                onChannelChange("all");
                onAgentChange("all");
                setDatePreset("all");
                setFromDate(null);
                setToDate(null);
                setFilterRules([]);
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Outreach Table ── */}
      {loading ? (
        <div className={styles.tableOuter}>
          <div className={`${styles.tableWrap} no-scrollbar`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Lead</th>
                  <th className={styles.th}>Contact</th>
                  <th className={styles.th}>Channel</th>
                  <th className={styles.th}>Score</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Follow-up</th>
                  <th className={styles.th}>Last Active</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <td key={idx} className={styles.td}>
                        <div className="h-4 w-24 bg-muted/40 rounded" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center justify-center gap-3 flex-1 border border-border rounded-xl bg-background">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground opacity-60">
            <Users size={20} />
          </div>
          <div className="text-sm font-bold text-foreground">No outreach leads found</div>
          <p className="text-xs text-muted-foreground max-w-xs">
            {searchQuery || channelFilter !== "all" || agentScope !== "all" || statusFilter !== "all"
              ? "No leads matched your current filters."
              : "Leads with outreach follow-ups will appear here."}
          </p>
          {(searchQuery || channelFilter !== "all" || agentScope !== "all" || statusFilter !== "all") && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearchQuery("");
                onChannelChange("all");
                onAgentChange("all");
                setStatusFilter("all");
                setPage(1);
              }}
              className="text-xs font-bold border border-border"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.tableOuter}>
          <div className={`${styles.tableWrap} no-scrollbar`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} style={{ minWidth: "200px" }}>
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort("name")}
                      title="Sort by Lead"
                    >
                      <span>Lead</span>
                      {renderSortIcon("name")}
                    </button>
                  </th>
                  <th className={styles.th} style={{ minWidth: "180px" }}>
                    <span className="truncate">Contact</span>
                  </th>
                  <th className={styles.th} style={{ minWidth: "120px" }}>
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort("channel")}
                      title="Sort by Channel"
                    >
                      <span>Channel</span>
                      {renderSortIcon("channel")}
                    </button>
                  </th>
                  <th className={styles.th} style={{ minWidth: "90px" }}>
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort("score")}
                      title="Sort by Score"
                    >
                      <span>Score</span>
                      {renderSortIcon("score")}
                    </button>
                  </th>
                  <th className={styles.th} style={{ minWidth: "140px" }}>
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort("status")}
                      title="Sort by Status"
                    >
                      <span>Status</span>
                      {renderSortIcon("status")}
                    </button>
                  </th>
                  <th className={styles.th} style={{ minWidth: "140px" }}>
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort("follow_up_sent")}
                      title="Sort by Follow-up"
                    >
                      <span>Follow-up</span>
                      {renderSortIcon("follow_up_sent")}
                    </button>
                  </th>
                  <th className={styles.th} style={{ minWidth: "145px" }}>
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort("created_at")}
                      title="Sort by Last Active"
                    >
                      <span>Last Active</span>
                      {renderSortIcon("created_at")}
                    </button>
                  </th>
                  <th className={styles.th} style={{ minWidth: "64px", textAlign: "right" }}>
                    <span className="truncate">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeads.map((lead) => {
                  const isWa = lead.channel === "whatsapp";
                  const chatHref = isWa
                    ? `/whatsapp?tab=chats${lead.conversation_id ? `&c=${lead.conversation_id}` : ""}`
                    : `/website?tab=chats${lead.conversation_id ? `&c=${lead.conversation_id}` : ""}`;

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onOpenOutreachDrawer(lead)}
                      className="cursor-pointer"
                    >
                      {/* Lead */}
                      <td className={styles.td}>
                        <div className="min-w-0 max-w-[220px]">
                          <Link
                            href={`/leads/${lead.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-semibold text-foreground hover:underline block truncate"
                          >
                            {lead.name || "Unnamed Lead"}
                          </Link>
                          {lead.interest && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5" title={lead.interest}>
                              {lead.interest}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className={styles.td}>
                        <div className="space-y-0.5 text-xs text-foreground">
                          {lead.email && <div className="truncate max-w-[180px]">{lead.email}</div>}
                          {lead.phone && <div className="font-mono text-muted-foreground">{lead.phone}</div>}
                          {!lead.email && !lead.phone && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>

                      {/* Channel */}
                      <td className={styles.td}>
                        <span className="text-xs font-medium text-foreground">
                          {isWa ? "WhatsApp" : "Website"}
                        </span>
                      </td>

                      {/* Score */}
                      <td className={styles.td}>
                        {(() => {
                          const s = lead.score ?? 0;
                          const scoreColor =
                            s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444";
                          return (
                            <span className="text-xs font-semibold" style={{ color: scoreColor }}>
                              {s}
                            </span>
                          );
                        })()}
                      </td>

                      {/* CRM Status Dropdown */}
                      <td className={styles.td} onClick={(e) => e.stopPropagation()}>
                        <div className="w-32">
                          <Select
                            size="sm"
                            disabled={!canWrite || updatingStatusId === lead.id}
                            value={lead.status}
                            onChange={(val) => handleStatusChange(lead.id, val)}
                            options={STATUSES.map((s) => ({
                              value: s,
                              label: titleCase(s),
                            }))}
                          />
                        </div>
                      </td>

                      {/* Follow-up Status */}
                      <td className={styles.td}>
                        {lead.follow_up_sent ? (
                          <div>
                            <span className="text-xs font-medium text-foreground">Followed Up</span>
                            <div className="text-[10px] text-muted-foreground">
                              {relative(lead.updated_at)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Pending outreach</span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className={styles.td}>
                        <div className="text-xs text-foreground">{dateTime(lead.created_at)}</div>
                        <div className="text-[10px] text-muted-foreground">{relative(lead.updated_at || lead.created_at)}</div>
                      </td>

                      {/* ── 3-Dots Unified Actions Dropdown ── */}
                      <td className={styles.td} style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setActionDropdownOpenId(actionDropdownOpenId === lead.id ? null : lead.id)
                            }
                            aria-label="Lead actions"
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              actionDropdownOpenId === lead.id
                                ? "bg-[#0396A6]/15 text-[#0396A6]"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            }`}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {actionDropdownOpenId === lead.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setActionDropdownOpenId(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-xl p-1.5 shadow-2xl z-50 min-w-[170px] text-left animate-in zoom-in-95 duration-150">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionDropdownOpenId(null);
                                    onOpenOutreachDrawer(lead);
                                  }}
                                  className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-[#0396A6]/10 hover:text-[#0396A6] transition-colors cursor-pointer"
                                >
                                  <span>Outreach</span>
                                </button>

                                <a
                                  href={chatHref}
                                  onClick={() => setActionDropdownOpenId(null)}
                                  className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-[#0396A6]/10 hover:text-[#0396A6] transition-colors cursor-pointer"
                                >
                                  <span>Open Chat</span>
                                </a>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ─── Pagination Footer ─── */}
          {totalLeads > 0 && (
            <div className={styles.paginationContainer}>
              <div className={styles.paginationInfo}>
                <span>
                  Showing <strong>{startIndex + 1}–{endIndex}</strong> of{" "}
                  <strong>{totalLeads}</strong> leads
                </span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Rows per page:</span>
                  <div className="w-20">
                    <Select
                      size="sm"
                      value={String(pageSize)}
                      onChange={(val) => {
                        const newSize = Number(val);
                        setPageSize(newSize);
                        setPage(1);
                      }}
                      options={[
                        { value: "10", label: "10" },
                        { value: "25", label: "25" },
                        { value: "50", label: "50" },
                        { value: "100", label: "100" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.paginationControls}>
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  disabled={clampedPage === 1}
                  className={styles.pageBtn}
                  title="First page"
                  aria-label="First page"
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={clampedPage === 1}
                  className={styles.pageBtn}
                  title="Previous page"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>

                {getPageNumbers().map((pNum, idx) => {
                  if (pNum === "...") {
                    return (
                      <span key={`ellipsis-${idx}`} className={styles.pageEllipsis}>
                        …
                      </span>
                    );
                  }
                  const isCurrent = pNum === clampedPage;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(Number(pNum))}
                      className={`${styles.pageBtn} ${isCurrent ? styles.pageBtnActive : ""}`}
                      aria-label={`Go to page ${pNum}`}
                      aria-current={isCurrent ? "page" : undefined}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={clampedPage === totalPages}
                  className={styles.pageBtn}
                  title="Next page"
                  aria-label="Next page"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  disabled={clampedPage === totalPages}
                  className={styles.pageBtn}
                  title="Last page"
                  aria-label="Last page"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
