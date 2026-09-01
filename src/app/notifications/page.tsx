"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { PageState, ErrorBox } from "@/components/ui/PageState";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { alertCopy, isUnread } from "@/lib/alerts";
import { apiRequest } from "@/lib/api";
import { isInboxChangeEvent, subscribeInboxRealtime } from "@/lib/inboxRealtime";
import { relative } from "@/lib/format";
import {
  applyNotificationFilters,
  NOTIFICATION_CHANNEL_OPTIONS,
  NOTIFICATION_DATE_OPTIONS,
  NOTIFICATION_STATUS_OPTIONS,
  NOTIFICATION_TYPE_OPTIONS,
  usesClientSideNotificationFilters,
  type NotificationChannel,
  type NotificationStatusFilter,
} from "@/lib/notificationFilters";
import type { Agent, AlertPage, MerchantAlert } from "@/lib/types";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  ExternalLink,
  Flame,
  MessageSquare,
  Calendar,
  CreditCard,
  MessageCircle,
  SlidersHorizontal,
  Clock,
  History,
  X,
} from "lucide-react";

const CLIENT_FETCH_LIMIT = 200;

function getCategoryTheme(type: string, kind?: string) {
  if (type.includes("hot_lead") || type.includes("lead")) {
    return {
      icon: Flame,
      badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50",
    };
  }
  if (type.includes("handoff") || kind === "handoff_requested") {
    return {
      icon: MessageSquare,
      badge: "bg-[#0396A6]/10 text-[#0396A6] border-[#0396A6]/20",
      iconBg: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800/50",
    };
  }
  if (type.includes("meeting") || type.includes("calendar") || kind === "meeting_needs_approval") {
    return {
      icon: Calendar,
      badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50",
    };
  }
  if (type.includes("credit") || type.includes("billing") || type === "payment_failed") {
    return {
      icon: CreditCard,
      badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50",
    };
  }
  if (type.includes("wa_")) {
    return {
      icon: MessageCircle,
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
    };
  }
  return {
    icon: Bell,
    badge: "bg-muted text-muted-foreground border-border/40",
    iconBg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<MerchantAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [agents, setAgents] = useState<Agent[]>([]);

  const [alertType, setAlertType] = useState("all");
  const [channel, setChannel] = useState<NotificationChannel>("all");
  const [agentId, setAgentId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<NotificationStatusFilter>("all");
  const [dateRange, setDateRange] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const dateDays = useMemo(
    () => NOTIFICATION_DATE_OPTIONS.find((o) => o.value === dateRange)?.days ?? null,
    [dateRange],
  );

  const agentOptions = useMemo(
    () => [
      { value: "all", label: "All agents" },
      ...agents.map((a) => ({
        value: a.id,
        label: a.agent_name || a.slug || a.id,
      })),
    ],
    [agents],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (alertType !== "all") count += 1;
    if (channel !== "all") count += 1;
    if (agentId !== "all") count += 1;
    if (statusFilter !== "all") count += 1;
    if (dateRange !== "all") count += 1;
    return count;
  }, [alertType, channel, agentId, statusFilter, dateRange]);

  const clientSideMode = useMemo(
    () =>
      usesClientSideNotificationFilters({
        channel,
        agentId,
        dateDays,
        status: statusFilter,
      }),
    [channel, agentId, dateDays, statusFilter],
  );

  useEffect(() => {
    void apiRequest<Agent[]>("/v1/agents")
      .then((rows) => setAgents(Array.isArray(rows) ? rows : []))
      .catch(() => setAgents([]));
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const alertTypeParam =
        alertType !== "all" ? `&alert_type=${encodeURIComponent(alertType)}` : "";
      const unreadParam = statusFilter === "unread" ? "&unread_only=true" : "";

      if (clientSideMode) {
        const page = await apiRequest<AlertPage>(
          `/v1/notifications?limit=${CLIENT_FETCH_LIMIT}&offset=0${unreadParam}${alertTypeParam}`,
        );
        const filtered = applyNotificationFilters(page.items || [], {
          channel,
          agentId,
          dateDays,
          status: statusFilter,
        });
        const start = (currentPage - 1) * pageSize;
        setItems(filtered.slice(start, start + pageSize));
        setTotal(filtered.length);
      } else {
        const offset = (currentPage - 1) * pageSize;
        const page = await apiRequest<AlertPage>(
          `/v1/notifications?limit=${pageSize}&offset=${offset}${unreadParam}${alertTypeParam}`,
        );
        setItems(page.items || []);
        setTotal(page.total || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load workspace notifications.");
    } finally {
      setLoading(false);
    }
  }, [
    alertType,
    channel,
    agentId,
    statusFilter,
    dateDays,
    dateRange,
    currentPage,
    pageSize,
    clientSideMode,
  ]);

  useEffect(() => {
    setLoading(true);
    void load();
    const interval = window.setInterval(() => void load(), 30_000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    const unsub = subscribeInboxRealtime({
      onEvent: (evt) => {
        if (!isInboxChangeEvent(evt)) return;
        void load();
      },
    });
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      unsub();
    };
  }, [load]);

  const resetFilters = () => {
    setAlertType("all");
    setChannel("all");
    setAgentId("all");
    setStatusFilter("all");
    setDateRange("all");
    setCurrentPage(1);
  };

  const onFilterChange = <T,>(setter: (v: T) => void, value: T) => {
    setter(value);
    setCurrentPage(1);
  };

  async function onAcknowledge(id: number, status: "dismissed" | "resolved") {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest(`/v1/notifications/${id}`, {
        method: "PATCH",
        body: { status },
      });
      setNotice(`Notification marked as ${status}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update notification status.");
    } finally {
      setBusy(false);
    }
  }

  async function onDismissAll() {
    const unreadItems = items.filter((a) => isUnread(a));
    if (unreadItems.length === 0) return;

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await Promise.all(
        unreadItems.map((a) =>
          apiRequest(`/v1/notifications/${a.id}`, {
            method: "PATCH",
            body: { status: "dismissed" },
          }),
        ),
      );
      setNotice(`Dismissed ${unreadItems.length} notification${unreadItems.length === 1 ? "" : "s"}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not dismiss notifications.");
    } finally {
      setBusy(false);
    }
  }

  const unreadCount = items.filter((a) => isUnread(a)).length;

  return (
    <AppShell
      title="Notifications"
      subtitle={
        total
          ? `${total} alert${total === 1 ? "" : "s"} matching your filters`
          : "Workspace alerts for handoffs, meetings, billing, and channel delivery"
      }
      requires="dashboard:view"
    >
      <div className="w-full max-w-6xl mx-auto min-w-0 overflow-x-hidden space-y-4 pb-24">
        {error ? <ErrorBox message={error} onRetry={() => void load()} /> : null}
        {notice ? (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs hover:underline opacity-80"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#D9EDEE] bg-white dark:bg-zinc-900 p-4 sm:p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#0396A6]" />
              <h2 className="text-sm font-bold text-foreground">Filters</h2>
              {activeFilterCount > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0396A6]/10 text-[#0396A6] border border-[#0396A6]/20">
                  {activeFilterCount} active
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground border border-border/80 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear filters
                </button>
              ) : null}
              <Link
                href="/settings?tab=activity"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0396A6] hover:text-[#027582] hover:underline transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                Activity log
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Channel</label>
              <Select
                value={channel}
                onChange={(val) => onFilterChange(setChannel, String(val) as NotificationChannel)}
                options={NOTIFICATION_CHANNEL_OPTIONS}
                fullWidth
                triggerClassName="!bg-[#F7F5F1] !border-[#D9EDEE] !rounded-xl !text-xs !font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Agent</label>
              <Select
                value={agentId}
                onChange={(val) => onFilterChange(setAgentId, String(val))}
                options={agentOptions}
                searchable={agentOptions.length > 6}
                searchPlaceholder="Search agents…"
                fullWidth
                triggerClassName="!bg-[#F7F5F1] !border-[#D9EDEE] !rounded-xl !text-xs !font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Alert type</label>
              <Select
                value={alertType}
                onChange={(val) => onFilterChange(setAlertType, String(val))}
                options={NOTIFICATION_TYPE_OPTIONS}
                searchable
                searchPlaceholder="Search types…"
                fullWidth
                triggerClassName="!bg-[#F7F5F1] !border-[#D9EDEE] !rounded-xl !text-xs !font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</label>
              <Select
                value={statusFilter}
                onChange={(val) => onFilterChange(setStatusFilter, String(val) as NotificationStatusFilter)}
                options={NOTIFICATION_STATUS_OPTIONS}
                fullWidth
                triggerClassName="!bg-[#F7F5F1] !border-[#D9EDEE] !rounded-xl !text-xs !font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date</label>
              <Select
                value={dateRange}
                onChange={(val) => onFilterChange(setDateRange, String(val))}
                options={NOTIFICATION_DATE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                fullWidth
                triggerClassName="!bg-[#F7F5F1] !border-[#D9EDEE] !rounded-xl !text-xs !font-semibold"
              />
            </div>
          </div>

          {clientSideMode ? (
            <p className="text-[11px] text-muted-foreground">
              Channel, agent, date, and status filters scan the latest {CLIENT_FETCH_LIMIT} alerts. Use alert type alone for full server pagination.
            </p>
          ) : null}
        </div>

        {/* ── Action toolbar ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-border shadow-2xs">
          <div className="flex flex-wrap items-center gap-3">
            {unreadCount > 0 ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDismissAll()}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0396A6] hover:text-[#027582] disabled:opacity-50 transition-colors cursor-pointer px-2.5 py-1 rounded-lg bg-[#0396A6]/10 hover:bg-[#0396A6]/15"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Dismiss unread on this page ({unreadCount})</span>
              </button>
            ) : (
              <span className="text-xs text-muted-foreground font-medium">No unread alerts on this page</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={busy}
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-foreground bg-muted/40 hover:bg-muted border border-border/80 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/settings?tab=notifications"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1 transition-colors"
            >
              Notification prefs
            </Link>
          </div>
        </div>

        {/* ── List ─────────────────────────────────────────────────────────── */}
        {loading && items.length === 0 ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-border bg-white dark:bg-zinc-900 shadow-xs animate-pulse flex flex-col sm:flex-row gap-3 items-start justify-between"
              >
                <div className="flex gap-3 items-start w-full sm:w-2/3">
                  <div className="w-9 h-9 rounded-xl bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted/60 rounded w-full" />
                  </div>
                </div>
                <div className="h-8 bg-muted rounded w-24 self-end sm:self-center" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && !items.length ? (
          <div className="rounded-2xl border border-border bg-white dark:bg-zinc-900 p-8 sm:p-12 text-center">
            <PageState
              icon="notifications"
              title="No alerts match your filters"
              description="Try clearing filters or widening the date range. Handoffs, meetings, billing, and delivery errors appear here when they occur."
              primaryHref="/settings?tab=notifications"
              primaryLabel="Alert preferences"
            />
          </div>
        ) : null}

        {!loading && items.length > 0 ? (
          <div className="rounded-2xl border border-border bg-white dark:bg-zinc-900 shadow-xs overflow-hidden flex flex-col min-w-0">
            <ul className="divide-y divide-border/60">
              {items.map((a) => {
                const copy = alertCopy(a);
                const unread = isUnread(a);
                const kind = String(a.data?.kind || "");
                const theme = getCategoryTheme(a.alert_type, kind);
                const IconComponent = theme.icon;

                return (
                  <li
                    key={a.id}
                    className={`p-3.5 sm:p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      unread
                        ? "bg-[#0396A6]/[0.025] hover:bg-[#0396A6]/[0.05]"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${theme.iconBg}`}
                      >
                        <IconComponent size={17} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${theme.badge}`}
                          >
                            {a.alert_type.replace(/_/g, " ")}
                          </span>

                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                            <Clock size={11} className="opacity-70" />
                            {relative(a.created_at)}
                          </span>

                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground">
                            {a.status}
                          </span>

                          {unread ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#0396A6] text-white">
                              New
                            </span>
                          ) : null}
                        </div>

                        <h2 className="text-sm font-bold text-foreground mb-0.5 leading-snug">{copy.title}</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed break-words">{copy.body}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 w-full sm:w-auto justify-end">
                      {copy.href ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => router.push(copy.href!)}
                          className="text-xs font-semibold inline-flex items-center gap-1 bg-[#0396A6] hover:bg-[#027582] text-white rounded-lg h-8 px-3"
                        >
                          <span>Open</span>
                          <ExternalLink size={12} />
                        </Button>
                      ) : null}

                      {unread ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void onAcknowledge(a.id, "dismissed")}
                            className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-border/80 hover:bg-muted transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void onAcknowledge(a.id, "resolved")}
                            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 transition-colors cursor-pointer"
                          >
                            Resolve
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={total}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 20, 30, 50]}
              itemLabel="notifications"
              className="bg-muted/10 border-t border-border"
            />
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
