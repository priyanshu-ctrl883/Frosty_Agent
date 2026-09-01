"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart2, CalendarDays, Mail, MessageSquare, Plus, RefreshCw, Search, Settings, Ticket } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { AgentHeadingSelector } from "@/components/shell/AgentHeadingSelector";
import { TopbarTabs, type TopbarTab } from "@/components/shell/Topbar";
import { Button } from "@/components/ui/Button";
import { Loading, PageState } from "@/components/ui/PageState";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Toast } from "@/components/ui/Toast";
import { ApiClientError, apiRequest } from "@/lib/api";
import type { Agent } from "@/lib/types";
import {
  INTENT_LABELS,
  type EmailMessage,
  type EmailProcessingStatus,
  type EmailReplyStatus,
  type EmailStatus,
  generateEmailReply,
  getEmail,
  getEmailStatus,
  intentLabel,
  intentTone,
  listEmails,
  processingLabel,
  processingTone,
  replyLabel,
  replyTone,
  sendEmailReply,
  setAutoReply,
  startEmailGoogleConnect,
} from "@/lib/emailAutomation";
import { can } from "@/lib/permissions";
import { useWorkspace } from "@/lib/workspace";
import { ConversationsTab } from "./components/ConversationsTab";
import { EmailAnalyticsTab } from "./components/EmailAnalyticsTab";
import { EmailDetailDrawer } from "./components/EmailDetailDrawer";
import { EmailSettingsTab } from "./components/EmailSettingsTab";
import { TicketsTab } from "./components/TicketsTab";
import styles from "./email.module.css";

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

const formatDay = (iso: string | null): string => {
  const d = parseWhen(iso);
  if (!d) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatTime = (iso: string | null): string => {
  const d = parseWhen(iso);
  if (!d) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};

const INTENT_OPTIONS = [
  { value: "all", label: "All intents" },
  ...Object.entries(INTENT_LABELS).map(([value, label]) => ({ value, label })),
];
const REPLY_OPTIONS: { value: EmailReplyStatus | "all"; label: string }[] = [
  { value: "all", label: "All replies" },
  { value: "none", label: "No reply" },
  { value: "pending", label: "Queued" },
  { value: "sent", label: "Replied" },
  { value: "failed", label: "Reply failed" },
];
type DatePreset = "all" | "today" | "7d" | "30d" | "custom";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom" },
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

const EMAIL_TABS = [
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "conversations", label: "Conversations", icon: MessageSquare },
  { id: "emails", label: "Emails", icon: Mail },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type EmailTabId = (typeof EMAIL_TABS)[number]["id"];

const PROCESSING_OPTIONS: { value: EmailProcessingStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Analyzing" },
  { value: "classified", label: "Classified" },
  { value: "needs_review", label: "Needs review" },
  { value: "failed", label: "Failed" },
];

const AutoReplyToggle = ({
  status,
  canManage,
  onChange,
}: {
  status: EmailStatus | null;
  canManage: boolean;
  onChange: (enabled: boolean) => Promise<void>;
}) => {
  const [busy, setBusy] = useState(false);
  if (!status || status.state !== "ok") return null;
  const enabled = status.auto_reply_enabled;
  return (
    <button
      type="button"
      disabled={!canManage || busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onChange(!enabled);
        } finally {
          setBusy(false);
        }
      }}
      className="flex items-center gap-2 rounded-full border border-[#D9EDEE] bg-white px-3 py-1.5 text-sm font-medium shadow-xs disabled:opacity-60"
      aria-pressed={enabled}
      title={canManage ? "Toggle automatic replies" : "You do not have permission to change this"}
    >
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          enabled ? "bg-emerald-500" : "bg-zinc-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-4" : "translate-x-1"
          }`}
        />
      </span>
      <span className={styles.toggleLabel}>
        <span className={styles.togglePrefix}>Auto-Reply </span>
        {enabled ? "On" : "Off"}
      </span>
    </button>
  );
};

export default function EmailPage() {
  return (
    <Suspense fallback={<Loading label="Loading email agent…" />}>
      <EmailPageInner />
    </Suspense>
  );
}

function EmailPageInner() {
  const { me } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canManage = can(me?.permissions, "inbox:reply");
  const canEditKb = can(me?.permissions, "kb:edit");

  // Multi Email Agent (D269): the page is scoped to ONE Email Agent. Resolve the selected agent from
  // `?agent=`, falling back to the first email agent the merchant owns.
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoaded, setAgentsLoaded] = useState(false);
  const preferredAgentId = searchParams?.get("agent") ?? null;
  const agentId = useMemo(() => {
    if (agents.length === 0) return null;
    return (preferredAgentId && agents.find((a) => a.id === preferredAgentId)?.id) || agents[0]!.id;
  }, [agents, preferredAgentId]);

  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<EmailMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [intentFilter, setIntentFilter] = useState("all");
  const [replyFilter, setReplyFilter] = useState<EmailReplyStatus | "all">("all");
  const [processingFilter, setProcessingFilter] = useState<EmailProcessingStatus | "all">("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [listTotal, setListTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [hubTab, setHubTab] = useState<EmailTabId>("emails");

  const headerTabs: TopbarTab[] = EMAIL_TABS.map((tab) => {
    const Icon = tab.icon;
    return {
      key: tab.id,
      label: tab.label,
      icon: <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />,
    };
  });

  const listRow = useMemo(
    () => messages.find((m) => m.id === selectedId) ?? null,
    [messages, selectedId],
  );
  const selected = detail && detail.id === selectedId ? detail : listRow;

  const dateBounds = useMemo(() => {
    const now = new Date();
    if (datePreset === "today") return { from: startOfDay(now), to: endOfDay(now) };
    if (datePreset === "7d") {
      const from = startOfDay(now);
      from.setDate(from.getDate() - 6);
      return { from, to: endOfDay(now) };
    }
    if (datePreset === "30d") {
      const from = startOfDay(now);
      from.setDate(from.getDate() - 29);
      return { from, to: endOfDay(now) };
    }
    if (datePreset === "custom") {
      const fromDay = customFrom ? startOfDay(new Date(`${customFrom}T00:00:00`)) : null;
      const toDay = customTo ? endOfDay(new Date(`${customTo}T00:00:00`)) : null;
      // Only the start date: that calendar day. Only the end date: that calendar day.
      if (fromDay && !toDay) return { from: fromDay, to: endOfDay(fromDay) };
      if (!fromDay && toDay) return { from: startOfDay(toDay), to: toDay };
      return { from: fromDay, to: toDay };
    }
    return { from: null, to: null };
  }, [datePreset, customFrom, customTo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter((m) => {
      if (intentFilter !== "all" && m.intent !== intentFilter) return false;
      if (replyFilter !== "all" && m.reply_status !== replyFilter) return false;
      if (processingFilter !== "all" && m.processing_status !== processingFilter) return false;
      if (dateBounds.from || dateBounds.to) {
        if (!m.received_at) return false;
        const when = new Date(m.received_at).getTime();
        if (Number.isNaN(when)) return false;
        if (dateBounds.from && when < dateBounds.from.getTime()) return false;
        if (dateBounds.to && when > dateBounds.to.getTime()) return false;
      }
      if (!q) return true;
      const hay = [m.sender_name, m.sender_email, m.subject, m.summary]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [messages, query, intentFilter, replyFilter, processingFilter, dateBounds]);

  const filtersActive =
    query.trim() !== "" ||
    intentFilter !== "all" ||
    replyFilter !== "all" ||
    processingFilter !== "all" ||
    datePreset !== "all";

  useEffect(() => {
    setPage(1);
  }, [query, intentFilter, replyFilter, processingFilter, datePreset, customFrom, customTo, pageSize]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleError = useCallback((err: unknown, fallback: string) => {
    if (err instanceof ApiClientError && err.status === 401) {
      window.location.href = "/login";
      return;
    }
    setError(err instanceof Error ? err.message : fallback);
  }, []);

  // Load the merchant's Email Agents once. The sidebar create ("+") dispatches
  // `frosty:agents-changed`; listen so a freshly created agent shows up without a full reload.
  const loadAgents = useCallback(async () => {
    try {
      const rows = (await apiRequest<Agent[]>("/v1/agents")) || [];
      setAgents(rows.filter((a) => a.mode === "email" && a.is_active !== false));
    } catch (err) {
      handleError(err, "Failed to load email agents");
    } finally {
      setAgentsLoaded(true);
    }
  }, [handleError]);

  useEffect(() => {
    void loadAgents();
    const onChange = () => void loadAgents();
    window.addEventListener("frosty:agents-changed", onChange);
    return () => window.removeEventListener("frosty:agents-changed", onChange);
  }, [loadAgents]);

  const onSelectAgent = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("agent", id);
      router.replace(`/email?${params.toString()}`);
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    try {
      const [st, list] = await Promise.all([
        getEmailStatus(agentId),
        listEmails(agentId, { limit: 100 }),
      ]);
      setStatus(st);
      setMessages(list.messages);
      setListTotal(list.total);
      setPage(1);
    } catch (err) {
      handleError(err, "Failed to load emails");
    } finally {
      setLoading(false);
    }
  }, [agentId, handleError]);

  useEffect(() => {
    if (agentId) void load();
  }, [agentId, load]);

  useEffect(() => {
    if (!selectedId || !agentId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const d = await getEmail(agentId, selectedId);
        if (!cancelled) setDetail(d);
      } catch (err) {
        if (!cancelled) handleError(err, "Failed to load email");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agentId, selectedId, handleError]);

  const pendingOutbound = (detail?.outbound ?? []).some(
    (o) => o.status === "pending" || o.status === "sending",
  );
  useEffect(() => {
    if (!selectedId || !pendingOutbound || !agentId) return;
    const t = setInterval(async () => {
      try {
        const d = await getEmail(agentId, selectedId);
        setDetail((prev) => (prev && prev.id === d.id ? d : prev));
        const stillPending = (d.outbound ?? []).some(
          (o) => o.status === "pending" || o.status === "sending",
        );
        if (!stillPending) {
          const list = await listEmails(agentId, { limit: 100 });
          setMessages(list.messages);
          setListTotal(list.total);
        }
      } catch {
        /* transient — the next tick retries */
      }
    }, 5000);
    return () => clearInterval(t);
  }, [agentId, selectedId, pendingOutbound]);

  const refreshStatus = useCallback(async () => {
    if (!agentId) return;
    try {
      setStatus(await getEmailStatus(agentId));
    } catch (err) {
      handleError(err, "Failed to refresh status");
    }
  }, [agentId, handleError]);

  const refreshList = useCallback(async () => {
    if (!agentId) return;
    setRefreshing(true);
    try {
      const [st, list] = await Promise.all([
        getEmailStatus(agentId),
        listEmails(agentId, { limit: 100 }),
      ]);
      setStatus(st);
      setMessages(list.messages);
      setListTotal(list.total);
    } catch (err) {
      handleError(err, "Failed to refresh emails");
    } finally {
      setRefreshing(false);
    }
  }, [agentId, handleError]);

  const onToggleAuto = useCallback(
    async (enabled: boolean) => {
      if (!agentId) return;
      try {
        const st = await setAutoReply(agentId, enabled);
        setStatus(st);
        setNotice(
          enabled
            ? "Auto-Reply is on — new emails will be answered automatically."
            : "Auto-Reply is off.",
        );
      } catch (err) {
        handleError(err, "Failed to update setting");
      }
    },
    [agentId, handleError],
  );

  const onConnect = useCallback(async () => {
    if (!agentId) return;
    try {
      const { authorization_url } = await startEmailGoogleConnect(agentId);
      window.location.href = authorization_url;
    } catch (err) {
      handleError(err, "Could not start Google connection");
    }
  }, [agentId, handleError]);

  // The dedicated Gmail OAuth callback returns here with `?connected=1` (success) or
  // `?connected=failed&reason=…` (cancel/error). Toast it, refresh status, and strip the params so
  // a refresh does not re-toast.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    if (!connected) return;
    if (connected === "1") {
      setNotice("Gmail connected. Your email agent is ready.");
      void refreshStatus();
    } else {
      const reason = params.get("reason");
      setError(reason ? `Could not connect Gmail: ${reason}` : "Could not connect Gmail.");
    }
    setHubTab("settings");
    params.delete("connected");
    params.delete("reason");
    const qsRest = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${qsRest ? `?${qsRest}` : ""}`,
    );
  }, [refreshStatus]);

  const onGenerate = useCallback(
    async (id: string, prompt?: string): Promise<EmailMessage> => {
      if (!agentId) throw new Error("No email agent selected");
      try {
        const updated = await generateEmailReply(agentId, id, prompt);
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
        setDetail((prev) => (prev && prev.id === id ? { ...prev, ...updated } : prev));
        return updated;
      } catch (err) {
        handleError(err, "Could not draft a reply");
        throw err;
      }
    },
    [agentId, handleError],
  );

  const onSend = useCallback(
    async (id: string, subject: string, body: string) => {
      if (!agentId) return;
      try {
        const updated = await sendEmailReply(agentId, id, body, subject);
        setDetail((prev) => (prev && prev.id === id ? updated : prev));
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, ...updated, outbound: undefined } : m)),
        );
        setNotice("Email queued — sending via Gmail.");
      } catch (err) {
        handleError(err, "Could not send the email");
      }
    },
    [agentId, handleError],
  );

  const openEmail = (id: string) => setSelectedId(id);
  const closeDrawer = () => setSelectedId(null);

  const connectPanel = () => {
    if (!status) return null;
    if (status.state === "oauth_unconfigured") {
      return (
        <PageState
          icon="mail"
          title="Email automation is not available yet"
          description="Google sign-in has not been configured for this deployment, so Gmail cannot be connected."
        />
      );
    }
    if (status.state === "not_connected") {
      return (
        <PageState
          icon="mail"
          title="Connect Gmail to automate your inbox"
          description="Connect the Gmail account this agent should manage — separate from your calendar/workspace Google connection. Frosty reads incoming emails, classifies and summarizes them, and drafts replies. You control whether replies are sent automatically."
          action={
            <Button onClick={() => void onConnect()} disabled={!canManage}>
              Connect Gmail
            </Button>
          }
        />
      );
    }
    if (status.state === "needs_reconnect") {
      return (
        <PageState
          icon="sync_problem"
          title="Reconnect to enable email reading"
          description="This inbox is connected for sending, but has not granted permission to READ your mail yet. Reconnect once to enable email automation."
          action={
            <Button onClick={() => void onConnect()} disabled={!canManage}>
              Reconnect Gmail
            </Button>
          }
        />
      );
    }
    return null;
  };

  const ready = status?.state === "ok";
  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === agentId) ?? null,
    [agents, agentId],
  );
  const goCreate = useCallback(() => router.push("/agents/new?mode=email"), [router]);

  // No Email Agent yet — the merchant creates one (subject to their plan's max_email_agents cap on
  // the create endpoint). The sidebar "+" leads here too.
  if (agentsLoaded && agents.length === 0) {
    return (
      <AppShell title="Email Agent" requires="dashboard:view" workspace>
        <div className="mx-auto max-w-xl py-10">
          <PageState
            icon="mail"
            title="Create your first Email Agent"
            description="An Email Agent connects its own dedicated Gmail inbox and answers it from your knowledge base. Create one to get started — you can add more up to your plan's limit."
            action={
              <Button onClick={goCreate} disabled={!canManage}>
                <Plus size={15} /> New Email Agent
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  if (!agentId) {
    return <Loading label="Loading email agent…" />;
  }

  return (
    <AppShell
      title={
        <AgentHeadingSelector
          agentName={selectedAgent?.agent_name || selectedAgent?.slug || "Email Agent"}
          agents={agents}
          selectedAgentId={agentId}
          onSelectAgent={onSelectAgent}
        />
      }
      requires="dashboard:view"
      workspace
      headerTabs={
        <TopbarTabs
          tabs={headerTabs}
          activeTab={hubTab}
          onTabChange={(key) => setHubTab(key as EmailTabId)}
        />
      }
      actions={
        <div className="flex items-center gap-2">
          {hubTab === "emails" && ready ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={refreshing}
              onClick={() => void refreshList()}
              title={refreshing ? "Refreshing emails…" : "Refresh emails"}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : undefined} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
          ) : null}
          {canManage ? (
            <Button variant="ghost" size="sm" onClick={goCreate} title="Create another Email Agent">
              <Plus size={14} /> New
            </Button>
          ) : null}
        </div>
      }
    >
      {hubTab === "settings" ? (
        <EmailSettingsTab
          agentId={agentId}
          status={status}
          canEditKb={canEditKb}
          canManage={canManage}
          onStatusChange={() => void refreshStatus()}
        />
      ) : hubTab === "tickets" ? (
        <TicketsTab agentId={agentId} canManage={canManage} onGenerate={onGenerate} onSend={onSend} />
      ) : hubTab === "conversations" ? (
        <ConversationsTab agentId={agentId} canManage={canManage} />
      ) : hubTab === "analytics" ? (
        <EmailAnalyticsTab agentId={agentId} onViewEmails={() => setHubTab("emails")} />
      ) : hubTab !== "emails" ? (
        <div className={styles.blankTab} />
      ) : (
      <>
      <Toast message={error} type="error" onClose={() => setError(null)} />
      <Toast message={notice} type="success" onClose={() => setNotice(null)} />

      {loading ? (
        <div className="p-10 text-center text-sm text-zinc-500">Loading emails…</div>
      ) : !ready ? (
        <div className="mx-auto max-w-xl py-10">{connectPanel()}</div>
      ) : messages.length === 0 ? (
        <PageState
          icon="inbox"
          title="No emails yet"
          description={`Connected as ${status?.connected_email ?? "your Gmail"}. New unread emails will appear here as they arrive and are analyzed.`}
        />
      ) : (
        <div className={styles.page} data-lenis-prevent>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sender, subject…"
                className={styles.searchInput}
              />
            </div>
            <Select
              value={intentFilter}
              onChange={setIntentFilter}
              options={INTENT_OPTIONS}
              size="md"
              fullWidth={false}
              className={styles.filterSelect}
              id="email-intent-filter"
            />
            <Select
              value={replyFilter}
              onChange={(v) => setReplyFilter(v as EmailReplyStatus | "all")}
              options={REPLY_OPTIONS}
              size="md"
              fullWidth={false}
              className={styles.filterSelect}
              id="email-reply-filter"
            />
            <Select
              value={processingFilter}
              onChange={(v) => setProcessingFilter(v as EmailProcessingStatus | "all")}
              options={PROCESSING_OPTIONS}
              size="md"
              fullWidth={false}
              className={styles.filterSelect}
              id="email-status-filter"
            />
            <div className={styles.toolbarToggle}>
              <AutoReplyToggle status={status} canManage={canManage} onChange={onToggleAuto} />
            </div>
            {filtersActive ? (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => {
                  setQuery("");
                  setIntentFilter("all");
                  setReplyFilter("all");
                  setProcessingFilter("all");
                  setDatePreset("all");
                  setCustomFrom("");
                  setCustomTo("");
                }}
              >
                Clear filters
              </button>
            ) : null}
            <div className={styles.dateBar}>
              <CalendarDays size={15} color="#8b847b" />
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`${styles.dateChip} ${datePreset === p.value ? styles.dateChipActive : ""}`}
                  onClick={() => setDatePreset(p.value)}
                >
                  {p.label}
                </button>
              ))}
              {datePreset === "custom" ? (
                <div className={styles.dateInputs}>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className={styles.dateInput}
                    aria-label="From date"
                  />
                  <span className="text-xs text-zinc-400">to</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className={styles.dateInput}
                    aria-label="To date"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.metaRow}>
            <span>
              {filtered.length} email{filtered.length === 1 ? "" : "s"}
              {filtered.length !== messages.length ? ` of ${listTotal || messages.length}` : ""}
            </span>
            {status?.connected_email ? (
              <span className={styles.connectedAs}>Connected as {status.connected_email}</span>
            ) : null}
          </div>

          <div className={styles.tableCard}>
            {filtered.length === 0 ? (
              <div className={styles.emptyFilter}>No emails match these filters.</div>
            ) : (
              <>
                <div className={styles.listScroll} data-lenis-prevent>
                <div className={styles.desktopTable}>
                  <Table className={styles.fixedTable}>
                    <TableHeader>
                      <tr>
                        <TableHead className={styles.colFrom}>From</TableHead>
                        <TableHead className={styles.colSubject}>Subject</TableHead>
                        <TableHead className={styles.colIntent}>Intent</TableHead>
                        <TableHead className={`${styles.colStatus} ${styles.hideTablet}`}>
                          Status
                        </TableHead>
                        <TableHead className={styles.colReply}>Reply</TableHead>
                        <TableHead className={styles.colDate}>Received</TableHead>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {pageRows.map((m) => (
                        <TableRow
                          key={m.id}
                          onClick={() => openEmail(m.id)}
                          className={m.id === selectedId ? styles.rowActive : ""}
                        >
                          <TableCell className={styles.tightCell}>
                            <span className={styles.fromName}>
                              {m.sender_name || m.sender_email || "Unknown sender"}
                            </span>
                            {m.sender_name && m.sender_email ? (
                              <span className={styles.fromEmail}>{m.sender_email}</span>
                            ) : null}
                          </TableCell>
                          <TableCell className={styles.tightCell}>
                            <span className={styles.subjectCell}>{m.subject || "(no subject)"}</span>
                          </TableCell>
                          <TableCell className={styles.tightCell}>
                            {m.intent ? (
                              <StatusBadge
                                label={intentLabel(m.intent)}
                                tone={intentTone(m.intent)}
                                dot={false}
                              />
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className={`${styles.tightCell} ${styles.hideTablet}`}>
                            <StatusBadge
                              label={processingLabel(m.processing_status)}
                              tone={processingTone(m.processing_status)}
                              dot={false}
                            />
                          </TableCell>
                          <TableCell className={styles.tightCell}>
                            {m.reply_status !== "none" ? (
                              <StatusBadge
                                label={replyLabel(m.reply_status)}
                                tone={replyTone(m.reply_status)}
                                dot={false}
                              />
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className={`${styles.tightCell} ${styles.colDate}`}>
                            <span className={styles.dateCell}>
                              <span className={styles.dateDay}>{formatDay(m.received_at)}</span>
                              {formatTime(m.received_at) ? (
                                <span className={styles.dateTime}>{formatTime(m.received_at)}</span>
                              ) : null}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className={styles.mobileList}>
                  {pageRows.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`${styles.mobileCard} ${m.id === selectedId ? styles.rowActive : ""}`}
                      onClick={() => openEmail(m.id)}
                    >
                      <div className={styles.mobileCardTop}>
                        <div className="min-w-0">
                          <span className={styles.fromName}>
                            {m.sender_name || m.sender_email || "Unknown sender"}
                          </span>
                          {m.sender_email ? (
                            <span className={styles.fromEmail}>{m.sender_email}</span>
                          ) : null}
                        </div>
                        <span className={styles.dateCell}>{formatWhen(m.received_at)}</span>
                      </div>
                      <p className={styles.mobileSubject}>{m.subject || "(no subject)"}</p>
                      <div className={styles.mobileBadges}>
                        {m.intent ? (
                          <StatusBadge
                            label={intentLabel(m.intent)}
                            tone={intentTone(m.intent)}
                            dot={false}
                          />
                        ) : null}
                        <StatusBadge
                          label={processingLabel(m.processing_status)}
                          tone={processingTone(m.processing_status)}
                          dot={false}
                        />
                        {m.reply_status !== "none" ? (
                          <StatusBadge
                            label={replyLabel(m.reply_status)}
                            tone={replyTone(m.reply_status)}
                            dot={false}
                          />
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
                </div>

                <div className={styles.paginationBar}>
                  <Pagination
                    currentPage={safePage}
                    pageSize={pageSize}
                    totalItems={filtered.length}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    pageSizeOptions={[10, 20]}
                    itemLabel="emails"
                  />
                </div>
              </>
            )}
          </div>

          <EmailDetailDrawer
            open={!!selectedId}
            message={selected}
            canManage={canManage}
            onClose={closeDrawer}
            onGenerate={onGenerate}
            onSend={onSend}
          />
        </div>
      )}
      </>
      )}
    </AppShell>
  );
}
