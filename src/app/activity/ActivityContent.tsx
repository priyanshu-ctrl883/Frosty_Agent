"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  RotateCw,
  Download,
  Filter,
  Calendar,
  Users,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/PageState";
import { API_URL, apiRequest } from "@/lib/api";
import {
  ACTIVITY_GROUPS,
  GROUP_META,
  actorInfo,
  describeActivity,
  type ActivityGroup,
} from "@/lib/activityCopy";
import { dateTime, relative } from "@/lib/format";
import { roleLabel } from "@/lib/permissions";
import { getToken } from "@/lib/session";
import { impersonationHeader } from "@/lib/impersonation";
import type { AuditPage, AuditEvent, Team } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import { useToast } from "@/lib/toast";
import { ActivityStatsRibbon } from "./components/ActivityStatsRibbon";
import { ActivitySearchBar } from "./components/ActivitySearchBar";
import { EventDetailDrawer } from "./components/EventDetailDrawer";
import {
  ActivityFilterSheet,
  type RangeId,
  RANGES,
} from "./components/ActivityFilterSheet";
import styles from "./activity.module.css";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function pageNumbers(current: number, total: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current - 1, current, current + 1]);
  return [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
}

/**
 * Full activity UI — no AppShell wrapper.
 * Used both by the standalone /activity page and embedded in Settings > Activity tab.
 */
export function ActivityContent({ showActions = false }: { showActions?: boolean }) {
  const { merchant } = useWorkspace();
  const { success: toastSuccess, error: toastError } = useToast();

  const [items, setItems] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [group, setGroup] = useState<ActivityGroup>("all");
  const [actorId, setActorId] = useState("");
  const [range, setRange] = useState<RangeId>("7d");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failure">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Team["members"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [exporting, setExporting] = useState(false);

  // Inspector & Mobile Filter Sheet State
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const membersByUserId = useMemo(() => {
    const map = new Map<string, { display_name: string; email: string; role: string }>();
    for (const m of members) {
      map.set(m.user_id, {
        display_name: m.display_name,
        email: m.email,
        role: roleLabel(m.role_name, m.is_owner),
      });
    }
    return map;
  }, [members]);

  const fromDate = useMemo(() => {
    if (range === "all") return "";
    const days = RANGES.find((r) => r.id === range)?.days || 7;
    return isoDaysAgo(days);
  }, [range]);

  const load = useCallback(async (isManualRefresh = false) => {
    setError(null);
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const qs = new URLSearchParams({
        limit: String(pageSize),
        offset: String(offset),
      });
      if (actorId) qs.set("actor_id", actorId);
      if (fromDate) qs.set("from_date", fromDate);
      if (group !== "all") qs.set("resource_type", group);

      const page = await apiRequest<AuditPage>(`/v1/audit?${qs}`);
      setItems(page.items || []);
      setTotal(page.total || 0);

      if (isManualRefresh) {
        toastSuccess("Activity log updated");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load activity log");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [actorId, fromDate, offset, group, pageSize, toastSuccess]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void apiRequest<Team>("/v1/team")
      .then((team) => setMembers(team.members || []))
      .catch(() => {});
  }, []);

  // Filter items locally for search and status
  const displayedItems = useMemo(() => {
    let list = items;

    if (statusFilter === "success") {
      list = list.filter((ev) => !ev.status || ev.status === "success");
    } else if (statusFilter === "failure") {
      list = list.filter((ev) => ev.status && ev.status !== "success");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((ev) => {
        const copy = describeActivity(ev);
        const who = actorInfo(ev, membersByUserId);
        return (
          copy.title.toLowerCase().includes(q) ||
          copy.summary.toLowerCase().includes(q) ||
          copy.resourceName.toLowerCase().includes(q) ||
          copy.resourceKind.toLowerCase().includes(q) ||
          who.name.toLowerCase().includes(q) ||
          ev.action.toLowerCase().includes(q) ||
          (ev.actor_id && ev.actor_id.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [items, statusFilter, searchQuery, membersByUserId]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.floor(offset / pageSize) + 1;
  const fromRow = total === 0 ? 0 : offset + 1;
  const toRow = Math.min(offset + items.length, total);

  // Active filters count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (group !== "all") count++;
    if (actorId !== "") count++;
    if (range !== "7d") count++;
    if (statusFilter !== "all") count++;
    if (searchQuery.trim() !== "") count++;
    return count;
  }, [group, actorId, range, statusFilter, searchQuery]);

  function clearAllFilters() {
    setGroup("all");
    setActorId("");
    setRange("7d");
    setStatusFilter("all");
    setSearchQuery("");
    setOffset(0);
  }

  async function handleExport(format: "csv" | "json" = "csv") {
    setExporting(true);
    setError(null);
    try {
      const token = await getToken();
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
        ...impersonationHeader(),
      };

      const qs = new URLSearchParams({ format, limit: "10000" });
      if (actorId) qs.set("actor_id", actorId);
      if (fromDate) qs.set("from_date", fromDate);
      if (group !== "all") qs.set("resource_type", group);

      const res = await fetch(`${API_URL}/v1/audit/export?${qs}`, { headers });
      if (!res.ok) throw new Error(`Could not export the activity log as ${format.toUpperCase()}.`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileSuffix = group !== "all" ? `-${group}` : "";
      a.download = `frosty-activity${fileSuffix}-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toastSuccess(`Exported activity log as ${format.toUpperCase()}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not export activity log";
      setError(msg);
      toastError(msg);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      {/* Inline action buttons — shown when embedded in Settings (showActions=true) */}
      {showActions && (
        <div className="flex items-center justify-end gap-2 mb-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void load(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold border border-[var(--line)] rounded-lg bg-white hover:bg-[#FAF9F7] shadow-2xs"
            title="Refresh activity feed"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? styles.spinning : ""}`} />
            Refresh
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleExport("csv")}
            disabled={exporting || loading}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold border border-[var(--line)] rounded-lg bg-white hover:bg-[#FAF9F7] shadow-2xs"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? "Exporting…" : "Export"}
          </Button>
        </div>
      )}

      <div className={styles.pageContainer}>
        {error ? <ErrorBox message={error} onRetry={() => void load()} /> : null}

        {/* 1. Top Section: Stats & Search & Category Carousel */}
        <div className="w-full md:shrink-0 space-y-2.5 sm:space-y-3.5 mb-3">
          {/* Search & Filter Toolbar */}
          <div className="flex items-center justify-between gap-2">
            {/* Enhanced Activity Search Bar */}
            <ActivitySearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              totalMatches={displayedItems.length}
              totalItems={total}
              isSearching={Boolean(searchQuery.trim())}
            />

            {/* Mobile Filter Button (< 768px) - sits in the same row as Search */}
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              className="md:hidden flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl border border-[var(--line)] bg-white text-xs font-bold text-[var(--ink)] shadow-2xs shrink-0 hover:bg-[#F7FBFB] active:scale-95 transition-all"
            >
              <Filter className="w-3.5 h-3.5 shrink-0" style={{ color: '#0A1A2F' }} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#0396A6] text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Desktop Filters (>= 768px) */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {/* Date Range Dropdown */}
              <label className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-[var(--line)] bg-white text-xs font-medium text-[var(--ink)] shadow-2xs">
                <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: '#0A1A2F' }} />
                <select
                  value={range}
                  onChange={(e) => {
                    setRange(e.target.value as RangeId);
                    setOffset(0);
                  }}
                  className="bg-transparent border-0 font-inherit text-xs font-medium text-[var(--ink)] outline-none cursor-pointer pr-1"
                  aria-label="Date range"
                >
                  {RANGES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Team Member Dropdown */}
              <label className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-[var(--line)] bg-white text-xs font-medium text-[var(--ink)] shadow-2xs max-w-[170px]">
                <Users className="w-3.5 h-3.5 shrink-0" style={{ color: '#0A1A2F' }} />
                <select
                  value={actorId}
                  onChange={(e) => {
                    setActorId(e.target.value);
                    setOffset(0);
                  }}
                  className="bg-transparent border-0 font-inherit text-xs font-medium text-[var(--ink)] outline-none cursor-pointer truncate"
                  aria-label="Filter by user"
                >
                  <option value="">All users</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.display_name || m.email}
                    </option>
                  ))}
                </select>
              </label>

              {/* Status Dropdown */}
              <label className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-[var(--line)] bg-white text-xs font-medium text-[var(--ink)] shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: '#0A1A2F' }} />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as "all" | "success" | "failure");
                  }}
                  className="bg-transparent border-0 font-inherit text-xs font-medium text-[var(--ink)] outline-none cursor-pointer pr-1"
                  aria-label="Filter by status"
                >
                  <option value="all">All statuses</option>
                  <option value="success">Success only</option>
                  <option value="failure">Errors / Failed</option>
                </select>
              </label>

              {/* Clear Filters (Desktop) */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="h-10 px-3 text-xs font-bold text-[#0396A6] hover:text-[#087681] hover:bg-[#EAF8F8] rounded-xl transition-colors shrink-0"
                >
                  Reset all
                </button>
              )}
            </div>
          </div>

          {/* Horizontal Category Pills Carousel */}
          <div className={styles.pillsScroll}>
            {ACTIVITY_GROUPS.map((g) => {
              const active = group === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setGroup(g.id);
                    setOffset(0);
                  }}
                  className={`${styles.categoryPill} ${active ? styles.categoryPillActive : ""}`}
                >
                  <span>{g.id === "all" ? "All events" : g.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Middle Section: Scrollable Table Body / Mobile Cards List with Inner Scrollbar */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Loading Skeleton State */}
          {loading && !displayedItems.length && (
            <div className="space-y-2.5 sm:space-y-3 flex-1 overflow-y-auto pr-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="w-full h-16 sm:h-20 bg-white border border-[var(--line)] rounded-xl sm:rounded-2xl animate-pulse p-3 sm:p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 shrink-0" />
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="w-32 sm:w-60 h-3.5 sm:h-4 bg-slate-100 rounded" />
                      <div className="w-20 sm:w-40 h-2.5 sm:h-3 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="w-16 h-3 bg-slate-100 rounded hidden sm:block" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !displayedItems.length && !error && (
            <div className="bg-white border border-[var(--line)] rounded-2xl p-6 sm:p-12 text-center flex flex-col items-center justify-center my-auto shadow-2xs">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#EAF8F8] text-[#0396A6] flex items-center justify-center mb-3 sm:mb-4">
                <Activity className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-[var(--ink)] mb-1">
                {activeFiltersCount > 0 ? "No activity matching filters" : "No activity recorded yet"}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--muted)] max-w-md mb-4 sm:mb-5 leading-relaxed">
                {activeFiltersCount > 0
                  ? "Try broadening your search keyword, adjusting the date range, or switching categories."
                  : "Workspace actions like agent publishing, team invitations, and inbox events will be logged here."}
              </p>
              {activeFiltersCount > 0 ? (
                <Button type="button" variant="primary" size="sm" onClick={clearAllFilters}>
                  Clear all filters
                </Button>
              ) : (
                <Link href="/agents">
                  <Button type="button" variant="primary" size="sm">
                    Go to Agents Studio
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Main Content: Desktop Table & Mobile Cards */}
          {displayedItems.length > 0 && (
            <div className="w-full md:flex-1 md:min-h-0 md:flex md:flex-col md:overflow-hidden">
              {/* Desktop Table View (>= 768px) with Fixed Header & Inner Scrollbar */}
              <div className="hidden md:flex flex-col flex-1 min-h-0">
                <div className={styles.tableContainer}>
                  {/* Pinned Table Header */}
                  <div className={styles.tableHeader} aria-hidden="true">
                    <span>Event & Summary</span>
                    <span>Resource</span>
                    <span>Performed By</span>
                    <span className="text-right">Timestamp</span>
                    <span className="text-center">View</span>
                  </div>

                  {/* Inner Scrollable Table Body (Desktop Only) */}
                  <div className={`${styles.tableBody} ${styles.innerScrollbar} divide-y divide-[var(--line-soft)]`}>
                    {displayedItems.map((ev) => {
                      const copy = describeActivity(ev);
                      const who = actorInfo(ev, membersByUserId);
                      const failed = Boolean(ev.status && ev.status !== "success");

                      return (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={styles.tableRow}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setSelectedEvent(ev);
                            }
                          }}
                        >
                          {/* Event Title & Summary */}
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <span
                              className={`material-symbols-outlined text-[20px] shrink-0 ${
                                failed ? "text-red-600" : "text-[#0396A6]"
                              }`}
                            >
                              {copy.icon}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-[var(--ink)] truncate hover:text-[#0396A6]">
                                  {copy.title}
                                </span>
                                {failed && (
                                  <span className="text-[10px] font-semibold text-red-600 shrink-0">
                                    Failed
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[var(--muted)] truncate">
                                {copy.summary}
                              </p>
                            </div>
                          </div>

                          {/* Resource */}
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-[var(--ink)] truncate block">
                              {copy.resourceName}
                            </span>
                            {copy.resourceKind && copy.resourceKind.toLowerCase() !== copy.resourceName.toLowerCase() ? (
                              <span className="text-[11px] text-[var(--muted)] block">
                                {copy.resourceKind}
                              </span>
                            ) : null}
                          </div>

                          {/* Performed By (Actor) */}
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-[var(--ink)] truncate block">
                              {who.name}
                            </span>
                            <span className="text-[11px] text-[var(--muted)] block">
                              {who.role}
                            </span>
                          </div>

                          {/* Timestamp */}
                          <div className="text-right">
                            <span className="text-xs font-medium text-[var(--ink)] block whitespace-nowrap">
                              {relative(ev.created_at)}
                            </span>
                            <span className="text-[11px] text-[var(--muted)] block whitespace-nowrap">
                              {dateTime(ev.created_at, merchant?.timezone)}
                            </span>
                          </div>

                          {/* Action Chevron */}
                          <div className="flex items-center justify-center text-[var(--muted)] hover:text-[#0396A6]">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Integrated Table Footer (Desktop - Sticky at bottom of table container) */}
                  <div className={styles.tableFooter}>
                    {/* Left: Summary text & Page Size Selector */}
                    <div className="flex items-center gap-2.5 text-xs text-[var(--muted)] font-medium">
                      <span>
                        Showing <strong className="text-[var(--ink)] font-bold">{fromRow}</strong>–
                        <strong className="text-[var(--ink)] font-bold">{toRow}</strong> of{" "}
                        <strong className="text-[var(--ink)] font-bold">{total}</strong> events
                      </span>

                      <div className="flex items-center gap-1.5 border-l border-[var(--line)] pl-3">
                        <span>Rows:</span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setOffset(0);
                          }}
                          className="bg-white border border-[var(--line)] rounded-lg px-2 py-0.5 text-xs font-bold text-[var(--ink)] outline-none cursor-pointer hover:border-[#0396A6] transition-colors"
                        >
                          {PAGE_SIZE_OPTIONS.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Right: Page Navigation Buttons */}
                    {pageCount > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setOffset((o) => Math.max(0, o - pageSize))}
                          disabled={currentPage === 1}
                          className="p-1 px-2 py-0.5 rounded-lg border border-[var(--line)] bg-white text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-container-low)] disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-1">
                          {pageNumbers(currentPage, pageCount).map((n, i, arr) => {
                            const prev = arr[i - 1];
                            return (
                              <div key={n} className="flex items-center gap-1">
                                {prev != null && n - prev > 1 ? (
                                  <span className="px-1 text-xs text-[var(--muted)]">…</span>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => setOffset((n - 1) * pageSize)}
                                  className={`min-w-[30px] h-7 px-2 rounded-lg text-xs font-bold transition-all ${
                                    n === currentPage
                                      ? "bg-[#0396A6] text-white shadow-xs"
                                      : "bg-white border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface-container-low)]"
                                  }`}
                                >
                                  {n}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => setOffset((o) => o + pageSize)}
                          disabled={currentPage === pageCount}
                          className="p-1 px-2 py-0.5 rounded-lg border border-[var(--line)] bg-white text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-container-low)] disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
                          aria-label="Next page"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile View (< 768px): Cards Feed + Clean Pagination */}
              <div className="md:hidden space-y-3 pb-8">
                {displayedItems.map((ev) => {
                  const copy = describeActivity(ev);
                  const who = actorInfo(ev, membersByUserId);
                  const failed = Boolean(ev.status && ev.status !== "success");

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={styles.mobileCard}
                      role="button"
                      tabIndex={0}
                    >
                      {/* Top Row: Icon + Category Badge + Relative Time */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`material-symbols-outlined text-[16px] shrink-0 ${
                              failed ? "text-red-600" : "text-[#0396A6]"
                            }`}
                          >
                            {copy.icon}
                          </span>
                          <span className="text-[10px] font-medium text-[var(--muted)]">
                            {copy.resourceKind}
                          </span>
                        </div>

                        <span className="text-[10px] font-semibold text-[var(--muted)] flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3 text-[var(--muted)]" />
                          {relative(ev.created_at)}
                        </span>
                      </div>

                      {/* Middle Row: Event Title & Summary */}
                      <div className="mb-2">
                        <h4 className="text-xs sm:text-sm font-medium text-[var(--ink)] mb-0.5 leading-snug">
                          {copy.title}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-[var(--muted)] leading-relaxed line-clamp-2">
                          {copy.summary}
                        </p>
                      </div>

                      {/* Bottom Row: User Chip & Resource Name */}
                      <div className="pt-1.5 border-t border-[var(--line-soft)] flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-medium text-[var(--ink)] truncate max-w-[110px]">
                            {who.name}
                          </span>
                          {who.role && (
                            <span className="text-[var(--muted)] text-[10px] truncate">
                              ({who.role})
                            </span>
                          )}
                        </div>

                        <div className="text-[var(--muted)] truncate max-w-[130px]">
                          <span className="font-medium truncate">{copy.resourceName}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Mobile Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-[var(--line)]">
                  <div className="text-xs text-[var(--muted)] font-medium">
                    Showing <strong className="text-[var(--ink)] font-bold">{fromRow}</strong>–
                    <strong className="text-[var(--ink)] font-bold">{toRow}</strong> of{" "}
                    <strong className="text-[var(--ink)] font-bold">{total}</strong>
                  </div>

                  {pageCount > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setOffset((o) => Math.max(0, o - pageSize))}
                        disabled={currentPage === 1}
                        className="p-1 px-2 py-0.5 rounded-lg border border-[var(--line)] bg-white text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-container-low)] disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1">
                        {pageNumbers(currentPage, pageCount).map((n, i, arr) => {
                          const prev = arr[i - 1];
                          return (
                            <div key={n} className="flex items-center gap-1">
                              {prev != null && n - prev > 1 ? (
                                <span className="px-1 text-xs text-[var(--muted)]">…</span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => setOffset((n - 1) * pageSize)}
                                className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold transition-all ${
                                  n === currentPage
                                    ? "bg-[#0396A6] text-white shadow-xs"
                                    : "bg-white border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface-container-low)]"
                                }`}
                              >
                                {n}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => setOffset((o) => o + pageSize)}
                        disabled={currentPage === pageCount}
                        className="p-1 px-2 py-0.5 rounded-lg border border-[var(--line)] bg-white text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-container-low)] disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
                        aria-label="Next page"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Slide-over Event Detail Inspector Drawer */}
      <EventDetailDrawer
        event={selectedEvent}
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        membersByUserId={membersByUserId}
        timezone={merchant?.timezone}
      />

      {/* 5. Mobile Filter Bottom Sheet */}
      <ActivityFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        range={range}
        setRange={(r) => {
          setRange(r);
          setOffset(0);
        }}
        group={group}
        setGroup={(g) => {
          setGroup(g);
          setOffset(0);
        }}
        actorId={actorId}
        setActorId={(id) => {
          setActorId(id);
          setOffset(0);
        }}
        members={members}
        onClear={clearAllFilters}
        activeFilterCount={activeFiltersCount}
      />
    </>
  );
}
