"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  CornerUpRight,
  Filter,
  Mail,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Ticket as TicketIcon,
  User as UserIcon,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  type EmailMessage,
  type EmailOutbound,
  intentLabel,
  intentTone,
  outboundLabel,
  outboundTone,
} from "@/lib/emailAutomation";
import {
  type EmailConversation,
  type EmailConversationDetail,
  getConversation,
  listConversations,
} from "@/lib/emailConversations";
import {
  ticketReasonLabel,
  ticketReasonTone,
  ticketStatusLabel,
  ticketStatusTone,
} from "@/lib/emailTickets";

const ACCENT = "#0396A6";

type TicketFilter = "all" | "open" | "none";
type DatePreset = "all" | "today" | "yesterday" | "week" | "month" | "this_month" | "custom";

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "Past 7 Days" },
  { key: "month", label: "Past 30 Days" },
  { key: "this_month", label: "This Month" },
];

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const parseWhen = (iso: string | null): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatWhen = (iso: string | null): string => {
  const d = parseWhen(iso);
  if (!d) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatActivity = (iso: string | null): string => {
  const d = parseWhen(iso);
  if (!d) return "";
  const now = Date.now();
  const diff = now - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day && d.getDate() === new Date().getDate()) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const initials = (label: string): string => {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return ((parts[0]![0] || "") + (parts[parts.length - 1]![0] || "")).toUpperCase();
};

/** The outbound source as a short human label — mirrors the email detail drawer. */
const sourceLabel = (source: string): string =>
  source === "auto"
    ? "Auto-reply"
    : source === "ticket_ack"
      ? "Ticket opened"
      : source === "ticket_close"
        ? "Ticket closed"
        : "Manual";

/** Inbound email from the customer (left-aligned card in the thread). */
const InboundBubble = ({ msg }: { msg: EmailMessage }) => (
  <div className="flex w-full justify-start">
    <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700">
          {msg.sender_name || msg.sender_email || "Customer"}
        </span>
        {msg.intent ? (
          <StatusBadge label={intentLabel(msg.intent)} tone={intentTone(msg.intent)} dot={false} />
        ) : null}
      </div>
      <p className="text-[13px] font-semibold text-slate-900">{msg.subject || "(no subject)"}</p>
      {msg.summary ? <p className="mt-0.5 text-[11px] italic text-slate-500">{msg.summary}</p> : null}
      {msg.body ? (
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#F8FBFB] p-2 text-[12px] leading-relaxed text-slate-700">
          {msg.body}
        </pre>
      ) : null}
      <div className="mt-2 text-right text-[10px] font-bold text-slate-400">
        {formatWhen(msg.received_at)}
      </div>
    </div>
  </div>
);

/** Outbound reply from the business (right-aligned card). */
const OutboundBubble = ({ item }: { item: EmailOutbound }) => (
  <div className="flex w-full justify-end">
    <div
      className="max-w-[88%] rounded-2xl rounded-tr-sm border px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
      style={{ borderColor: `${ACCENT}33`, background: `${ACCENT}0D` }}
    >
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide"
          style={{ color: ACCENT }}
        >
          <CornerUpRight size={12} />
          {sourceLabel(item.source)}
        </span>
        <StatusBadge label={outboundLabel(item.status)} tone={outboundTone(item.status)} dot={false} />
      </div>
      {item.subject ? (
        <p className="text-[13px] font-semibold text-slate-900">{item.subject}</p>
      ) : null}
      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white/70 p-2 text-[12px] leading-relaxed text-slate-700">
        {item.body || "(empty body)"}
      </pre>
      <div className="mt-2 text-right text-[10px] font-bold text-slate-400">
        {formatWhen(item.sent_at || item.created_at)}
      </div>
    </div>
  </div>
);

type Props = {
  /** The selected Email Agent (Multi Email Agent — D269). */
  agentId: string;
  /** Passed for API parity with the other tabs; this view is read-only and does not send. */
  canManage?: boolean;
};

export const ConversationsTab = ({ agentId }: Props) => {
  const [conversations, setConversations] = useState<EmailConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const filterRef = useRef<HTMLDivElement>(null);

  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const [detail, setDetail] = useState<EmailConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const rows = await listConversations(agentId);
      setConversations(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!activeEmail) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const d = await getConversation(agentId, activeEmail);
        if (!cancelled) setDetail(d);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load the conversation");
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agentId, activeEmail]);

  useEffect(() => {
    if (!filterOpen) return;
    const onClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [filterOpen]);

  const dateBounds = useMemo((): { from: Date | null; to: Date | null } => {
    const now = new Date();
    switch (datePreset) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "yesterday": {
        const y = new Date(now);
        y.setDate(now.getDate() - 1);
        return { from: startOfDay(y), to: endOfDay(y) };
      }
      case "week": {
        const f = startOfDay(now);
        f.setDate(f.getDate() - 6);
        return { from: f, to: endOfDay(now) };
      }
      case "month": {
        const f = startOfDay(now);
        f.setDate(f.getDate() - 29);
        return { from: f, to: endOfDay(now) };
      }
      case "this_month":
        return { from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: endOfDay(now) };
      case "custom":
        return {
          from: fromDate ? startOfDay(new Date(`${fromDate}T00:00:00`)) : null,
          to: toDate ? endOfDay(new Date(`${toDate}T00:00:00`)) : null,
        };
      default:
        return { from: null, to: null };
    }
  }, [datePreset, fromDate, toDate]);

  const dateFilterActive = datePreset !== "all" || !!fromDate || !!toDate;
  const activeFilterCount = (ticketFilter !== "all" ? 1 : 0) + (dateFilterActive ? 1 : 0);

  const resetFilters = useCallback(() => {
    setTicketFilter("all");
    setDatePreset("all");
    setFromDate("");
    setToDate("");
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (ticketFilter === "open" && c.open_ticket_count === 0) return false;
      if (ticketFilter === "none" && c.open_ticket_count > 0) return false;
      if (dateBounds.from || dateBounds.to) {
        const when = c.last_email_at ? new Date(c.last_email_at).getTime() : NaN;
        if (Number.isNaN(when)) return false;
        if (dateBounds.from && when < dateBounds.from.getTime()) return false;
        if (dateBounds.to && when > dateBounds.to.getTime()) return false;
      }
      if (!q) return true;
      return [c.sender_name, c.sender_email, c.last_subject, c.last_snippet]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [conversations, search, ticketFilter, dateBounds]);

  // Interleave each inbound email with the replies it received, oldest first — the whole history.
  const threadItems = useMemo(() => {
    if (!detail) return [];
    const items: Array<{ key: string; when: number; node: ReactNode }> = [];
    for (const msg of detail.messages) {
      const inboundWhen = new Date(msg.received_at || msg.created_at || 0).getTime();
      items.push({ key: `in-${msg.id}`, when: inboundWhen, node: <InboundBubble msg={msg} /> });
      const replies = [...(msg.outbound ?? [])].sort(
        (a, b) =>
          new Date(a.sent_at || a.created_at || 0).getTime() -
          new Date(b.sent_at || b.created_at || 0).getTime(),
      );
      for (const r of replies) {
        const when = new Date(r.sent_at || r.created_at || 0).getTime() || inboundWhen + 1;
        items.push({ key: `out-${r.id}`, when, node: <OutboundBubble item={r} /> });
      }
    }
    return items;
  }, [detail]);

  return (
    <div
      className="flex h-full min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#EAF3F3] bg-white shadow-sm"
      data-lenis-prevent
    >
      {/* Left: conversation list */}
      <div
        className={`flex h-full w-full flex-col border-r border-[#EAF3F3] bg-white md:w-[340px] ${
          activeEmail ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="shrink-0 space-y-3 border-b border-[#EAF3F3] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{ background: `${ACCENT}1A`, color: ACCENT }}
              >
                <Mail size={13} />
              </span>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700">
                Conversations
              </h3>
            </div>
            <button
              type="button"
              onClick={() => void load(true)}
              className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
              title="Refresh conversations"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} style={refreshing ? { color: ACCENT } : undefined} />
            </button>
          </div>

          <div className="relative flex items-center gap-1.5" ref={filterRef}>
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sender, subject…"
                className="w-full rounded-xl border border-[#D9EDEE] bg-white py-2 pl-9 pr-8 text-xs outline-none focus:border-[#0396A6] focus:ring-1 focus:ring-[#0396A6]"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-100"
                >
                  <X size={12} />
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className="relative flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl border transition-all"
              style={
                filterOpen || activeFilterCount > 0
                  ? { borderColor: ACCENT, color: ACCENT, background: `${ACCENT}14` }
                  : { borderColor: "#D9EDEE", color: "#71717a", background: "#fff" }
              }
              title="Filter conversations"
            >
              <Filter size={14} />
              {activeFilterCount > 0 ? (
                <span
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-extrabold text-white"
                  style={{ background: ACCENT }}
                >
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            {filterOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-[320px] space-y-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal size={14} style={{ color: ACCENT }} />
                    <span className="text-xs font-bold text-slate-800">Filter Conversations</span>
                    {activeFilterCount > 0 ? (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-extrabold"
                        style={{ background: `${ACCENT}1A`, color: ACCENT }}
                      >
                        {activeFilterCount} active
                      </span>
                    ) : null}
                  </div>
                  {activeFilterCount > 0 ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="flex items-center gap-1 text-[11px] font-bold hover:underline"
                      style={{ color: ACCENT }}
                    >
                      <RotateCcw size={11} />
                      Reset all
                    </button>
                  ) : null}
                </div>

                {/* Tickets */}
                <div>
                  <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <TicketIcon size={11} style={{ color: ACCENT }} />
                    <span>Tickets</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { key: "all", label: "All" },
                      { key: "open", label: "Open ticket" },
                      { key: "none", label: "No ticket" },
                    ] as { key: TicketFilter; label: string }[]).map((o) => {
                      const active = ticketFilter === o.key;
                      return (
                        <button
                          key={o.key}
                          type="button"
                          onClick={() => setTicketFilter(o.key)}
                          className="rounded-xl border px-2 py-1.5 text-center text-[11px] font-bold transition-all"
                          style={
                            active
                              ? { background: ACCENT, borderColor: ACCENT, color: "#fff" }
                              : { background: "#f8fafc", borderColor: "#e2e8f0", color: "#475569" }
                          }
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date filter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Calendar size={11} style={{ color: ACCENT }} />
                      <span>Date Filter</span>
                    </div>
                    {dateFilterActive ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDatePreset("all");
                          setFromDate("");
                          setToDate("");
                        }}
                        className="text-[10px] font-semibold text-slate-400 hover:text-slate-600"
                      >
                        Clear Date
                      </button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {DATE_PRESETS.map((d) => {
                      const active = datePreset === d.key;
                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => {
                            setDatePreset(d.key);
                            setFromDate("");
                            setToDate("");
                          }}
                          className="truncate rounded-xl border px-2 py-1.5 text-center text-[11px] font-bold transition-all"
                          style={
                            active
                              ? { background: ACCENT, borderColor: ACCENT, color: "#fff" }
                              : { background: "#f8fafc", borderColor: "#e2e8f0", color: "#475569" }
                          }
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50 p-2.5">
                    <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: ACCENT }}>
                      <Clock size={10} />
                      Custom Date Range
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[9.5px] font-bold text-slate-500">From Date</label>
                        <input
                          type="date"
                          value={fromDate}
                          max={toDate || undefined}
                          onChange={(e) => {
                            setFromDate(e.target.value);
                            setDatePreset("custom");
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none focus:border-[#0396A6] focus:ring-1 focus:ring-[#0396A6]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[9.5px] font-bold text-slate-500">To Date</label>
                        <input
                          type="date"
                          value={toDate}
                          min={fromDate || undefined}
                          onChange={(e) => {
                            setToDate(e.target.value);
                            setDatePreset("custom");
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none focus:border-[#0396A6] focus:ring-1 focus:ring-[#0396A6]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {filtered.length} {filtered.length === 1 ? "chat matches" : "chats match"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white transition-all"
                    style={{ background: ACCENT }}
                  >
                    <Check size={12} />
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {activeFilterCount > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {ticketFilter !== "all" ? (
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {ticketFilter === "open" ? "Open ticket" : "No ticket"}
                  <button type="button" onClick={() => setTicketFilter("all")} className="hover:text-rose-500">
                    <X size={10} />
                  </button>
                </span>
              ) : null}
              {dateFilterActive ? (
                <span
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold"
                  style={{ borderColor: `${ACCENT}4D`, background: `${ACCENT}14`, color: ACCENT }}
                >
                  <Calendar size={10} />
                  {DATE_PRESETS.find((d) => d.key === datePreset)?.label ?? "Custom range"}
                  <button
                    type="button"
                    onClick={() => {
                      setDatePreset("all");
                      setFromDate("");
                      setToDate("");
                    }}
                    className="hover:text-rose-500"
                  >
                    <X size={10} />
                  </button>
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2" data-lenis-prevent>
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-xs font-semibold text-zinc-400">
              <RefreshCw size={18} className="animate-spin" style={{ color: ACCENT }} />
              Loading conversations…
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-zinc-400">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D9EDEE] bg-[#EAF8F8]" style={{ color: ACCENT }}>
                <MessageSquare size={22} />
              </div>
              <p className="text-xs font-bold text-zinc-700">No conversations yet</p>
              <p className="mt-1 max-w-[220px] text-[11px] leading-relaxed">
                As emails arrive, each sender's full history will be grouped here.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center text-xs font-semibold text-zinc-400">
              <span>No conversations match your search or filters.</span>
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold"
                  style={{ borderColor: `${ACCENT}33`, background: `${ACCENT}14`, color: ACCENT }}
                >
                  <RotateCcw size={11} />
                  Reset filters
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((c) => {
                const name = c.sender_name || c.sender_email || "Unknown sender";
                const isActive = activeEmail === c.sender_email;
                return (
                  <button
                    key={c.sender_email}
                    type="button"
                    onClick={() => setActiveEmail(c.sender_email)}
                    className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:-translate-y-px hover:shadow-sm ${
                      isActive
                        ? "border-l-4 bg-[#EAF8F8]"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                    style={isActive ? { borderLeftColor: ACCENT } : undefined}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold"
                      style={{ background: `${ACCENT}14`, color: ACCENT, borderColor: `${ACCENT}4D` }}
                    >
                      {c.sender_name ? initials(name) : <UserIcon size={18} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-extrabold text-zinc-800">{name}</span>
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                          {formatActivity(c.last_email_at)}
                        </span>
                      </div>
                      <p className="truncate text-[11.5px] font-medium text-zinc-500">
                        {c.last_subject || c.last_snippet || "No subject"}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">
                          {c.message_count} email{c.message_count === 1 ? "" : "s"}
                        </span>
                        {c.open_ticket_count > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                            style={{ background: "#FEF3C7", color: "#B45309" }}
                          >
                            <TicketIcon size={10} />
                            {c.open_ticket_count}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: read-only mail history */}
      <div className={`min-h-0 flex-1 flex-col bg-[#F7FAFA] ${activeEmail ? "flex" : "hidden md:flex"}`}>
        {!activeEmail ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-zinc-400">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D9EDEE] bg-[#EAF8F8]" style={{ color: ACCENT }}>
              <MessageSquare size={24} />
            </div>
            <h3 className="mb-1 text-sm font-bold text-zinc-800">No conversation selected</h3>
            <p className="max-w-[240px] text-xs text-zinc-500">
              Choose a sender from the list to read their full email history — every message, reply,
              and ticket.
            </p>
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col">
            {/* Header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-[#EAF3F3] bg-white px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setActiveEmail(null)}
                className="-ml-1.5 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 md:hidden"
              >
                <ChevronLeft size={20} />
              </button>
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-black"
                style={{ background: `${ACCENT}14`, color: ACCENT, borderColor: `${ACCENT}4D` }}
              >
                {detail?.sender_name ? initials(detail.sender_name) : <UserIcon size={20} />}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-extrabold text-zinc-900">
                  {detail?.sender_name || detail?.sender_email || activeEmail}
                </h2>
                <p className="truncate text-xs text-zinc-500">
                  {detail?.sender_email || activeEmail}
                  {detail ? ` · ${detail.message_count} email${detail.message_count === 1 ? "" : "s"}` : ""}
                </p>
              </div>
              <span className="hidden shrink-0 rounded-full border border-[#D9EDEE] bg-[#F7FBFB] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500 sm:inline">
                Read-only
              </span>
            </div>

            {/* Tickets strip */}
            {detail && detail.tickets.length > 0 ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#EAF3F3] bg-white px-4 py-2.5 sm:px-6">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-zinc-400">
                  <TicketIcon size={12} /> Tickets
                </span>
                {detail.tickets.map((t) => (
                  <span key={t.id} className="inline-flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold text-zinc-600">{t.ticket_number}</span>
                    <StatusBadge label={intentLabel(t.intent)} tone={intentTone(t.intent)} dot={false} />
                    <StatusBadge label={ticketReasonLabel(t.reason)} tone={ticketReasonTone(t.reason)} dot={false} />
                    <StatusBadge label={ticketStatusLabel(t.status)} tone={ticketStatusTone(t.status)} dot={false} />
                  </span>
                ))}
              </div>
            ) : null}

            {/* Thread */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-6" data-lenis-prevent>
              {detailLoading && !detail ? (
                <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                  Loading history…
                </div>
              ) : threadItems.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                  No messages in this conversation.
                </div>
              ) : (
                threadItems.map((it) => <div key={it.key}>{it.node}</div>)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
