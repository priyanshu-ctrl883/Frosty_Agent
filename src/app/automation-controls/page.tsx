"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageState } from "@/components/ui/PageState";
import { apiRequest } from "@/lib/api";
import { dateTime } from "@/lib/format";
import type {
  AgentActionRequest,
  AutomationPoliciesResponse,
  AutomationRequestsResponse,
  ToolMode,
} from "@/lib/types";
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  ExternalLink,
  Eye,
  FileText,
  HelpCircle,
  Inbox,
  Mail,
  RefreshCw,
  Share2,
  Sliders,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import styles from "./automation-controls.module.css";

const MODE_LABELS: Record<ToolMode, string> = {
  ai: "AI",
  human: "Human",
  off: "Off",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  completed: "Approved",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
  failed: "Failed",
};

const PAGE_SIZE = 10;

type Tab = "pending" | "history";

type FormattedField = {
  label: string;
  value: string;
};

type TableSummary = {
  title: string;
  highlightPill?: {
    label: string;
    value: string;
    isAccent?: boolean;
  };
};

function formatToolTitle(toolName: string): string {
  if (!toolName) return "Action Request";
  const clean = toolName.replace(/_/g, " ").trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function getToolIcon(toolName: string, controlKey: string) {
  const t = (toolName + " " + controlKey).toLowerCase();
  if (t.includes("quote")) return <FileText className="w-4 h-4" />;
  if (t.includes("meeting")) return <Calendar className="w-4 h-4" />;
  if (t.includes("email") || t.includes("mail")) return <Mail className="w-4 h-4" />;
  if (t.includes("wa") || t.includes("whatsapp") || t.includes("link")) return <Share2 className="w-4 h-4" />;
  return <Sparkles className="w-4 h-4" />;
}

// ── Compact summary for the main table row ─────────────────────────────────
function getTableSummary(
  toolName: string,
  controlKey: string,
  payload: Record<string, unknown> | null | undefined,
): TableSummary {
  if (!payload || typeof payload !== "object" || Object.keys(payload).length === 0) {
    return { title: formatToolTitle(toolName) };
  }

  const p = payload;
  const tool = (toolName || "").toLowerCase();
  const control = (controlKey || "").toLowerCase();

  // Quote
  if (tool.includes("quote") || control.includes("quote")) {
    const title = p.title ?? p.name ?? "Quote";
    let total = "";
    if (p.total != null) {
      total = typeof p.total === "number" ? `₹${p.total.toLocaleString("en-IN")}` : String(p.total);
    } else if (p.amount != null) {
      total = typeof p.amount === "number" ? `₹${p.amount.toLocaleString("en-IN")}` : String(p.amount);
    }
    return {
      title: String(title || "Quote"),
      highlightPill: total ? { label: "Total", value: total, isAccent: true } : undefined,
    };
  }

  // Meeting
  if (tool.includes("meeting") || control.includes("meeting")) {
    const title = p.title ?? p.name ?? "Meeting Hold";
    let time = "";
    if (p.scheduled_start) {
      try {
        time = dateTime(String(p.scheduled_start));
      } catch {
        time = String(p.scheduled_start);
      }
    }
    return {
      title: String(title || "Meeting"),
      highlightPill: time ? { label: "Scheduled", value: time, isAccent: false } : undefined,
    };
  }

  // Email
  if (tool.includes("email") || control.includes("email")) {
    const subject = p.subject ?? p.title ?? "Outbound Email";
    const to = p.to ?? p.recipient_email ?? p.email ?? "";
    return {
      title: String(subject || "Email"),
      highlightPill: to ? { label: "To", value: String(to), isAccent: false } : undefined,
    };
  }

  // Generic
  const title = (p.title ?? p.name ?? p.subject ?? formatToolTitle(toolName)) as string;
  return { title: String(title || "Action Request") };
}

// ── Complete details extraction for the Details Dialog ─────────────────────
function extractCardFields(
  toolName: string,
  controlKey: string,
  payload: Record<string, unknown> | null | undefined,
): FormattedField[] {
  if (!payload || typeof payload !== "object" || Object.keys(payload).length === 0) {
    return [{ label: "Details", value: "No payload details provided" }];
  }

  const p = payload;
  const tool = (toolName || "").toLowerCase();
  const control = (controlKey || "").toLowerCase();
  const fields: FormattedField[] = [];

  // Quote Structure
  if (tool.includes("quote") || control.includes("quote")) {
    fields.push({ label: "Title", value: String(p.title ?? p.name ?? "—") });
    let total = "—";
    if (p.total != null) total = typeof p.total === "number" ? `₹${p.total.toLocaleString("en-IN")}` : String(p.total);
    else if (p.amount != null) total = typeof p.amount === "number" ? `₹${p.amount.toLocaleString("en-IN")}` : String(p.amount);
    fields.push({ label: "Total Amount", value: total });
    fields.push({ label: "Recipient Name", value: String(p.recipient_name ?? p.recipient ?? p.customer_name ?? "—") });
    fields.push({ label: "Recipient Email", value: String(p.recipient_email ?? p.email ?? "—") });
    if (p.notes) fields.push({ label: "Notes", value: String(p.notes) });
    if (p.expires_at) fields.push({ label: "Valid Until", value: dateTime(String(p.expires_at)) });
  }
  // Meeting Structure
  else if (tool.includes("meeting") || control.includes("meeting")) {
    fields.push({ label: "Title", value: String(p.title ?? p.name ?? "Meeting Hold") });
    let time = "—";
    if (p.scheduled_start) {
      try {
        time = dateTime(String(p.scheduled_start));
      } catch {
        time = String(p.scheduled_start);
      }
    }
    fields.push({ label: "Scheduled Start", value: time });
    fields.push({ label: "Attendee Name", value: String(p.attendee_name ?? p.name ?? p.recipient_name ?? "—") });
    fields.push({ label: "Attendee Email", value: String(p.attendee_email ?? p.email ?? "—") });
    if (p.timezone) fields.push({ label: "Timezone", value: String(p.timezone) });
    if (p.duration_minutes) fields.push({ label: "Duration", value: `${p.duration_minutes} minutes` });
    if (p.location) fields.push({ label: "Location", value: String(p.location) });
  }
  // Email Structure
  else if (tool.includes("email") || control.includes("email")) {
    fields.push({ label: "Recipient", value: String(p.to ?? p.recipient_email ?? p.email ?? "—") });
    fields.push({ label: "Subject", value: String(p.subject ?? p.title ?? "—") });
    if (p.body) fields.push({ label: "Message Body", value: String(p.body) });
  }

  // Any remaining uncaptured properties
  const capturedKeys = new Set([
    "title", "name", "total", "amount", "recipient_name", "recipient", "customer_name",
    "recipient_email", "email", "notes", "expires_at", "scheduled_start", "attendee_name",
    "attendee_email", "timezone", "duration_minutes", "location", "to", "subject", "body",
    "merchant_id", "id",
  ]);

  for (const [k, v] of Object.entries(p)) {
    if (k.startsWith("_") || capturedKeys.has(k)) continue;
    let val = "—";
    if (v === null || v === undefined || v === "") {
      val = "—";
    } else if (typeof v === "boolean") {
      val = v ? "Yes" : "No";
    } else if (typeof v === "number") {
      val = String(v);
    } else if (typeof v === "string") {
      if (v.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        try {
          val = dateTime(v);
        } catch {
          val = v;
        }
      } else {
        val = v;
      }
    } else if (typeof v === "object") {
      val = JSON.stringify(v);
    }

    const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    fields.push({ label, value: val });
  }

  return fields.length > 0 ? fields : [{ label: "Details", value: "—" }];
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  if (currentPage > 3) pages.push("...");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

export default function AutomationControlsPage() {
  // ── Policies ────────────────────────────────────────────────────────────────
  const [policies, setPolicies] = useState<AutomationPoliciesResponse["policies"]>([]);
  const [dirty, setDirty] = useState(false);

  // ── Pending approvals state with page number ────────────────────────────────
  const [pending, setPending] = useState<AgentActionRequest[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingPage, setPendingPage] = useState(1);

  // ── History tab state with page number ──────────────────────────────────────
  const [history, setHistory] = useState<AgentActionRequest[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Details Dialog state ─────────────────────────────────────────────────────
  const [selectedRequest, setSelectedRequest] = useState<AgentActionRequest | null>(null);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Rejection dialog ─────────────────────────────────────────────────────────
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function showNotice(msg: string) {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4000);
  }

  // ── Data fetchers ─────────────────────────────────────────────────────────────
  const loadPolicies = useCallback(async (signal?: AbortSignal) => {
    const pol = await apiRequest<AutomationPoliciesResponse>("/v1/automation/policies", { signal });
    setPolicies(pol.policies);
  }, []);

  const loadRequests = useCallback(
    async (signal?: AbortSignal, targetPage: number = 1) => {
      const off = (targetPage - 1) * PAGE_SIZE;
      const reqs = await apiRequest<AutomationRequestsResponse>(
        `/v1/automation/requests?status=pending&limit=${PAGE_SIZE}&offset=${off}`,
        { signal },
      );
      setPending(reqs.items);
      setPendingTotal(
        reqs.total ?? (off + reqs.items.length + (reqs.items.length === PAGE_SIZE ? 1 : 0)),
      );
      setPendingPage(targetPage);
    },
    [],
  );

  const loadHistory = useCallback(
    async (signal?: AbortSignal, targetPage: number = 1) => {
      const off = (targetPage - 1) * PAGE_SIZE;
      setHistoryLoading(true);
      try {
        const reqs = await apiRequest<AutomationRequestsResponse>(
          `/v1/automation/requests?limit=${PAGE_SIZE}&offset=${off}`,
          { signal },
        );
        setHistory(reqs.items);
        setHistoryTotal(
          reqs.total ?? (off + reqs.items.length + (reqs.items.length === PAGE_SIZE ? 1 : 0)),
        );
        setHistoryPage(targetPage);
      } finally {
        if (!signal || !signal.aborted) setHistoryLoading(false);
      }
    },
    [],
  );

  const load = useCallback(
    async (signal: AbortSignal) => {
      setError(null);
      try {
        await Promise.all([loadPolicies(signal), loadRequests(signal, 1)]);
        setDirty(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load automation settings");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [loadPolicies, loadRequests],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    void load(ctrl.signal);
    return () => {
      ctrl.abort();
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [load]);

  useEffect(() => {
    if (activeTab !== "history") return;
    const ctrl = new AbortController();
    void loadHistory(ctrl.signal, 1);
    return () => ctrl.abort();
  }, [activeTab, loadHistory]);

  function setMode(controlKey: string, mode: ToolMode) {
    setPolicies((rows) =>
      rows.map((p) => (p.control_key === controlKey ? { ...p, mode } : p)),
    );
    setDirty(true);
  }

  async function onSavePolicies() {
    setBusyId("save-policies");
    setError(null);
    try {
      const updated = await apiRequest<AutomationPoliciesResponse>("/v1/automation/policies", {
        method: "PUT",
        body: {
          policies: policies.map((p) => ({ control_key: p.control_key, mode: p.mode })),
        },
      });
      setPolicies(updated.policies);
      setDirty(false);
      showNotice("Workspace automation defaults saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onApprove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await apiRequest(`/v1/automation/requests/${id}/approve`, { method: "POST" });
      showNotice("Approved and executed.");
      await loadRequests(undefined, pendingPage);
      if (activeTab === "history") {
        await loadHistory(undefined, historyPage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  function onRejectClick(id: string, name: string) {
    setRejectTarget({ id, name });
    setRejectNote("");
  }

  async function onConfirmReject() {
    if (!rejectTarget) return;
    const { id } = rejectTarget;
    setBusyId(id);
    setError(null);
    try {
      await apiRequest(`/v1/automation/requests/${id}/reject`, {
        method: "POST",
        body: { note: rejectNote.trim() || null },
      });
      setRejectTarget(null);
      setRejectNote("");
      showNotice("Request rejected.");
      await loadRequests(undefined, pendingPage);
      if (activeTab === "history") {
        await loadHistory(undefined, historyPage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  const saveBusy = busyId === "save-policies";
  const anyBusy = busyId !== null;

  const totalPendingPages = Math.max(1, Math.ceil(pendingTotal / PAGE_SIZE));
  const totalHistoryPages = Math.max(1, Math.ceil(historyTotal / PAGE_SIZE));

  const pendingStartIdx = pendingTotal === 0 ? 0 : (pendingPage - 1) * PAGE_SIZE + 1;
  const pendingEndIdx = Math.min(pendingTotal, pendingPage * PAGE_SIZE);

  const historyStartIdx = historyTotal === 0 ? 0 : (historyPage - 1) * PAGE_SIZE + 1;
  const historyEndIdx = Math.min(historyTotal, historyPage * PAGE_SIZE);

  return (
    <AppShell
      title="Automation Controls"
      subtitle="Choose how the AI handles side effects workspace-wide. Human mode queues actions for your approval."
      requires="agent:config"
    >
      <div className={styles.container}>
        {/* ── Status Alerts ── */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div className={styles.noticeBanner} role="status">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* ── Quick Help Explainer ── */}
        <div className={styles.helpBanner}>
          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
          <div>
            <strong>AI</strong> executes automatically when entitled.{" "}
            <strong>Human</strong> prepares the action and holds it in the approval queue below.{" "}
            <strong>Off</strong> blocks the capability server-side. Agent-specific overrides can be configured on each{" "}
            <Link href="/agents">agent&apos;s detail page</Link>.
          </div>
        </div>

        {loading ? (
          <PageState
            icon="sliders"
            title="Loading settings…"
            description="Fetching automation policies and pending action requests."
          />
        ) : (
          <>
            {/* ── Section 1: Workspace Defaults ── */}
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div className={styles.panelHeaderLeft}>
                  <h2 className={styles.panelTitle}>Workspace defaults</h2>
                  <p className={styles.panelSubtitle}>
                    Configure default handling modes for autonomous agent capabilities.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={saveBusy || !dirty}
                  loading={saveBusy}
                  onClick={() => void onSavePolicies()}
                >
                  Save defaults
                </Button>
              </div>

              {policies.length === 0 ? (
                <div className={styles.emptyCard}>
                  <div className={styles.emptyIconBox}>
                    <Sliders className="w-5 h-5" />
                  </div>
                  <h3 className={styles.emptyTitle}>No policies configured</h3>
                  <p className={styles.emptyDesc}>
                    Automation policies have not been initialised. Re-apply migration 0090 or contact workspace support.
                  </p>
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Capability</th>
                        <th>Default Mode</th>
                        <th>Plan Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {policies.map((p) => (
                        <tr key={p.control_key}>
                          <td>
                            <div className={styles.capName}>{p.label}</div>
                            <p className={styles.capDesc}>{p.description}</p>
                          </td>
                          <td>
                            <div className={styles.modeGroup} role="group" aria-label={`${p.label} mode`}>
                              {(["ai", "human", "off"] as ToolMode[]).map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  className={`${styles.modeBtn} ${p.mode === m ? styles.modeBtnActive : ""}`}
                                  disabled={saveBusy}
                                  onClick={() => setMode(p.control_key, m)}
                                >
                                  {MODE_LABELS[m]}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span className={styles.badge}>{p.entitlement ?? "core"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {dirty && (
                <div className={styles.saveFooter}>
                  <span className={styles.saveNotice}>You have unsaved policy changes.</span>
                  <Button
                    type="button"
                    size="sm"
                    disabled={saveBusy}
                    loading={saveBusy}
                    onClick={() => void onSavePolicies()}
                  >
                    Save defaults
                  </Button>
                </div>
              )}
            </section>

            {/* ── Section 2: Automation Approvals Table ── */}
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div className={styles.panelHeaderLeft}>
                  <h2 className={styles.panelTitle}>Automation approvals</h2>
                  <p className={styles.panelSubtitle}>
                    Review and manage actions that require your approval.
                  </p>
                </div>
              </div>

              {/* Minimalist Tabs Navigation */}
              <div className={styles.tabBar} role="tablist">
                <div className={styles.tabList}>
                  <button
                    role="tab"
                    aria-selected={activeTab === "pending"}
                    type="button"
                    className={`${styles.tabBtn} ${activeTab === "pending" ? styles.tabBtnActive : ""}`}
                    onClick={() => setActiveTab("pending")}
                  >
                    <span>Pending approvals</span>
                    {pendingTotal > 0 && (
                      <span
                        className={`${styles.tabCount} ${
                          activeTab === "pending" ? "" : styles.tabCountInactive
                        }`}
                      >
                        {pendingTotal}
                      </span>
                    )}
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === "history"}
                    type="button"
                    className={`${styles.tabBtn} ${activeTab === "history" ? styles.tabBtnActive : ""}`}
                    onClick={() => setActiveTab("history")}
                  >
                    <span>History</span>
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.refreshBtn}
                  onClick={() =>
                    activeTab === "pending"
                      ? void loadRequests(undefined, pendingPage)
                      : void loadHistory(undefined, historyPage)
                  }
                  title="Refresh items"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* ── Pending Approvals Table ── */}
              {activeTab === "pending" && (
                <div role="tabpanel">
                  {pending.length === 0 ? (
                    <div className={styles.emptyCard}>
                      <div className={styles.emptyIconBox}>
                        <Inbox className="w-5 h-5" />
                      </div>
                      <h3 className={styles.emptyTitle}>Inbox clear</h3>
                      <p className={styles.emptyDesc}>
                        No pending actions require manual review. When the AI prepares a meeting, quote, email, or link in Human mode, it will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className={styles.dataTableWrapper}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>Capability / Action</th>
                            <th>Summary</th>
                            <th>Requested</th>
                            <th>Status</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pending.map((r) => {
                            const summary = getTableSummary(r.tool_name, r.control_key, r.payload);
                            const isProcessing = busyId === r.id;

                            return (
                              <tr key={r.id}>
                                {/* Col 1: Action / Type */}
                                <td>
                                  <div className={styles.actionCell}>
                                    <div className={styles.actionIconBox}>
                                      {getToolIcon(r.tool_name, r.control_key)}
                                    </div>
                                    <div className={styles.actionMeta}>
                                      <span className={styles.actionTitle}>
                                        {formatToolTitle(r.tool_name)}
                                      </span>
                                      <span className={styles.actionKey}>{r.control_key}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Col 2: High-Level Summary */}
                                <td>
                                  <div className={styles.summaryCell}>
                                    <span className={styles.summaryTitle}>{summary.title}</span>
                                    {summary.highlightPill && (
                                      <span
                                        className={`${styles.summaryPill} ${
                                          summary.highlightPill.isAccent
                                            ? styles.summaryPillAccent
                                            : ""
                                        }`}
                                      >
                                        <span className={styles.detailPillLabel}>
                                          {summary.highlightPill.label}:
                                        </span>
                                        <span>{summary.highlightPill.value}</span>
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Col 3: Requested Time & Chat */}
                                <td>
                                  <div className={styles.timeCell}>
                                    <span className={styles.timeReq}>
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      {dateTime(r.requested_at)}
                                    </span>
                                    {r.conversation_id && (
                                      <Link
                                        href={`/inbox?conversation=${r.conversation_id}`}
                                        className={styles.chatLink}
                                      >
                                        View chat <ExternalLink className="w-3 h-3" />
                                      </Link>
                                    )}
                                  </div>
                                </td>

                                {/* Col 4: Status */}
                                <td>
                                  <span className={`${styles.statusBadge} ${styles.status_pending}`}>
                                    <Clock className="w-3 h-3" />
                                    Pending
                                  </span>
                                </td>

                                {/* Col 5: Actions */}
                                <td>
                                  <div className={`${styles.btnGroup} ${styles.hoverReveal} ${isProcessing ? styles.isProcessing : ""}`}>
                                    <button
                                      type="button"
                                      className={styles.detailsBtn}
                                      onClick={() => setSelectedRequest(r)}
                                      title="View full action details"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Details</span>
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.approveBtn}
                                      disabled={anyBusy}
                                      onClick={() => void onApprove(r.id)}
                                    >
                                      {isProcessing ? (
                                        "Working…"
                                      ) : (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          Approve
                                        </>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.rejectBtn}
                                      disabled={anyBusy}
                                      onClick={() => onRejectClick(r.id, formatToolTitle(r.tool_name))}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Pagination Footer */}
                      <div className={styles.paginationBar}>
                        <div className={styles.paginationInfo}>
                          Showing <strong>{pendingStartIdx}</strong> to <strong>{pendingEndIdx}</strong> of{" "}
                          <strong>{pendingTotal}</strong> pending requests
                        </div>

                        <div className={styles.paginationNav}>
                          <button
                            type="button"
                            className={styles.pageBtn}
                            disabled={pendingPage <= 1 || anyBusy}
                            onClick={() => void loadRequests(undefined, pendingPage - 1)}
                            title="Previous page"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          {getPageNumbers(pendingPage, totalPendingPages).map((pNum, idx) => {
                            if (pNum === "...") {
                              return (
                                <span key={`ell-${idx}`} className={styles.pageEllipsis}>
                                  …
                                </span>
                              );
                            }
                            const isCurrent = pNum === pendingPage;
                            return (
                              <button
                                key={pNum}
                                type="button"
                                className={`${styles.pageBtn} ${isCurrent ? styles.pageBtnActive : ""}`}
                                disabled={anyBusy}
                                onClick={() => void loadRequests(undefined, Number(pNum))}
                              >
                                {pNum}
                              </button>
                            );
                          })}

                          <button
                            type="button"
                            className={styles.pageBtn}
                            disabled={pendingPage >= totalPendingPages || anyBusy}
                            onClick={() => void loadRequests(undefined, pendingPage + 1)}
                            title="Next page"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── History Table ── */}
              {activeTab === "history" && (
                <div role="tabpanel">
                  {historyLoading && history.length === 0 ? (
                    <PageState
                      icon="sliders"
                      title="Loading history…"
                      description="Fetching past approval records."
                    />
                  ) : history.length === 0 ? (
                    <div className={styles.emptyCard}>
                      <div className={styles.emptyIconBox}>
                        <Inbox className="w-5 h-5" />
                      </div>
                      <h3 className={styles.emptyTitle}>No history yet</h3>
                      <p className={styles.emptyDesc}>
                        Approved, rejected, and expired actions will be recorded here for auditing.
                      </p>
                    </div>
                  ) : (
                    <div className={styles.dataTableWrapper}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>Capability / Action</th>
                            <th>Summary</th>
                            <th>Requested</th>
                            <th>Status</th>
                            <th style={{ textAlign: "right" }}>Decision / Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((r) => {
                            const summary = getTableSummary(r.tool_name, r.control_key, r.payload);
                            const statusKey = String(r.status || "").toLowerCase();
                            const isPending = statusKey === "pending";
                            const isProcessing = busyId === r.id;

                            return (
                              <tr key={r.id}>
                                {/* Col 1: Action / Type */}
                                <td>
                                  <div className={styles.actionCell}>
                                    <div className={styles.actionIconBox}>
                                      {getToolIcon(r.tool_name, r.control_key)}
                                    </div>
                                    <div className={styles.actionMeta}>
                                      <span className={styles.actionTitle}>
                                        {formatToolTitle(r.tool_name)}
                                      </span>
                                      <span className={styles.actionKey}>{r.control_key}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Col 2: High-Level Summary */}
                                <td>
                                  <div className={styles.summaryCell}>
                                    <span className={styles.summaryTitle}>{summary.title}</span>
                                    {summary.highlightPill && (
                                      <span
                                        className={`${styles.summaryPill} ${
                                          summary.highlightPill.isAccent
                                            ? styles.summaryPillAccent
                                            : ""
                                        }`}
                                      >
                                        <span className={styles.detailPillLabel}>
                                          {summary.highlightPill.label}:
                                        </span>
                                        <span>{summary.highlightPill.value}</span>
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Col 3: Requested Time & Chat */}
                                <td>
                                  <div className={styles.timeCell}>
                                    <span className={styles.timeReq}>
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      {dateTime(r.requested_at)}
                                    </span>
                                    {r.conversation_id && (
                                      <Link
                                        href={`/inbox?conversation=${r.conversation_id}`}
                                        className={styles.chatLink}
                                      >
                                        View chat <ExternalLink className="w-3 h-3" />
                                      </Link>
                                    )}
                                  </div>
                                </td>

                                {/* Col 4: Status */}
                                <td>
                                  <span
                                    className={`${styles.statusBadge} ${
                                      styles[`status_${statusKey}`] || styles.status_expired
                                    }`}
                                  >
                                    {isPending && <Clock className="w-3 h-3" />}
                                    {statusKey === "completed" || statusKey === "approved" ? (
                                      <Check className="w-3 h-3" />
                                    ) : null}
                                    {statusKey === "rejected" && <X className="w-3 h-3" />}
                                    {STATUS_LABELS[r.status] ?? r.status}
                                  </span>
                                </td>

                                {/* Col 5: Actions / Status Stamp */}
                                <td>
                                  <div className={`${styles.btnGroup} ${isPending ? styles.hoverReveal : ""} ${isProcessing ? styles.isProcessing : ""}`}>
                                    <button
                                      type="button"
                                      className={styles.detailsBtn}
                                      onClick={() => setSelectedRequest(r)}
                                      title="View full action details"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Details</span>
                                    </button>

                                    {isPending ? (
                                      <>
                                        <button
                                          type="button"
                                          className={styles.approveBtn}
                                          disabled={anyBusy}
                                          onClick={() => void onApprove(r.id)}
                                        >
                                          {isProcessing ? (
                                            "Working…"
                                          ) : (
                                            <>
                                              <Check className="w-3.5 h-3.5" />
                                              Approve
                                            </>
                                          )}
                                        </button>
                                        <button
                                          type="button"
                                          className={styles.rejectBtn}
                                          disabled={anyBusy}
                                          onClick={() => onRejectClick(r.id, formatToolTitle(r.tool_name))}
                                        >
                                          <X className="w-3.5 h-3.5" />
                                          Reject
                                        </button>
                                      </>
                                    ) : statusKey === "completed" || statusKey === "approved" ? (
                                      <div className={`${styles.statusStamp} ${styles.stampApproved}`}>
                                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        <div className={styles.stampTextGroup}>
                                          <span className={styles.stampTitle}>Approved</span>
                                          <span className={styles.stampSubtitle}>
                                            {r.decided_at ? dateTime(r.decided_at) : "Executed"}
                                          </span>
                                        </div>
                                      </div>
                                    ) : statusKey === "rejected" ? (
                                      <div className={`${styles.statusStamp} ${styles.stampRejected}`}>
                                        <XCircle className="w-4 h-4 shrink-0" />
                                        <div className={styles.stampTextGroup}>
                                          <span className={styles.stampTitle}>Rejected</span>
                                          {r.decision_note && (
                                            <span className={styles.stampSubtitle} title={r.decision_note}>
                                              {r.decision_note}
                                            </span>
                                          )}
                                          {r.decided_at && (
                                            <span className={styles.stampSubtitle}>
                                              {dateTime(r.decided_at)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className={`${styles.statusStamp} ${styles.stampExpired}`}>
                                        <Clock className="w-4 h-4 shrink-0" />
                                        <div className={styles.stampTextGroup}>
                                          <span className={styles.stampTitle}>Expired</span>
                                          <span className={styles.stampSubtitle}>
                                            {r.expires_at ? dateTime(r.expires_at) : "Closed"}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Pagination Footer */}
                      <div className={styles.paginationBar}>
                        <div className={styles.paginationInfo}>
                          Showing <strong>{historyStartIdx}</strong> to <strong>{historyEndIdx}</strong> of{" "}
                          <strong>{historyTotal}</strong> records
                        </div>

                        <div className={styles.paginationNav}>
                          <button
                            type="button"
                            className={styles.pageBtn}
                            disabled={historyPage <= 1 || anyBusy}
                            onClick={() => void loadHistory(undefined, historyPage - 1)}
                            title="Previous page"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          {getPageNumbers(historyPage, totalHistoryPages).map((pNum, idx) => {
                            if (pNum === "...") {
                              return (
                                <span key={`ell-${idx}`} className={styles.pageEllipsis}>
                                  …
                                </span>
                              );
                            }
                            const isCurrent = pNum === historyPage;
                            return (
                              <button
                                key={pNum}
                                type="button"
                                className={`${styles.pageBtn} ${isCurrent ? styles.pageBtnActive : ""}`}
                                disabled={anyBusy}
                                onClick={() => void loadHistory(undefined, Number(pNum))}
                              >
                                {pNum}
                              </button>
                            );
                          })}

                          <button
                            type="button"
                            className={styles.pageBtn}
                            disabled={historyPage >= totalHistoryPages || anyBusy}
                            onClick={() => void loadHistory(undefined, historyPage + 1)}
                            title="Next page"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {/* ── Request Details Modal ── */}
        {selectedRequest && (
          <Modal
            open={Boolean(selectedRequest)}
            onOpenChange={(open) => !open && setSelectedRequest(null)}
            title={`${formatToolTitle(selectedRequest.tool_name)} Details`}
            description={`Action request for capability "${selectedRequest.control_key}"`}
            width="lg"
            footer={
              <div className={styles.dialogActions}>
                {selectedRequest.status === "pending" && (
                  <>
                    <button
                      type="button"
                      className={styles.approveBtn}
                      disabled={anyBusy}
                      onClick={() => {
                        const id = selectedRequest.id;
                        setSelectedRequest(null);
                        void onApprove(id);
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve request
                    </button>
                    <button
                      type="button"
                      className={styles.rejectBtn}
                      disabled={anyBusy}
                      onClick={() => {
                        const target = {
                          id: selectedRequest.id,
                          name: formatToolTitle(selectedRequest.tool_name),
                        };
                        setSelectedRequest(null);
                        onRejectClick(target.id, target.name);
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedRequest(null)}
                >
                  Close
                </Button>
              </div>
            }
          >
            <div className={styles.dialogContent}>
              {/* Metadata Overview */}
              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Status</span>
                  <span className={styles.metaValue}>
                    <span
                      className={`${styles.statusBadge} ${
                        styles[`status_${selectedRequest.status.toLowerCase()}`] ||
                        styles.status_expired
                      }`}
                    >
                      {STATUS_LABELS[selectedRequest.status] ?? selectedRequest.status}
                    </span>
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Requested At</span>
                  <span className={styles.metaValue}>
                    {dateTime(selectedRequest.requested_at)}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Expires At</span>
                  <span className={styles.metaValue}>
                    {selectedRequest.expires_at ? dateTime(selectedRequest.expires_at) : "Never"}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Linked Conversation</span>
                  <span className={styles.metaValue}>
                    {selectedRequest.conversation_id ? (
                      <Link
                        href={`/inbox?conversation=${selectedRequest.conversation_id}`}
                        className={styles.chatLink}
                      >
                        Open conversation in inbox <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              </div>

              {/* Formatted Parameters Grid */}
              <div>
                <h4 className={styles.sectionTitle}>Full Parameters & Payload</h4>
                <div className={styles.payloadBox}>
                  {extractCardFields(
                    selectedRequest.tool_name,
                    selectedRequest.control_key,
                    selectedRequest.payload,
                  ).map((f, idx) => (
                    <div key={idx} className={styles.metaItem}>
                      <span className={styles.metaLabel}>{f.label}</span>
                      <span className={styles.metaValue}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON Collapsible */}
              <details className={styles.jsonDetails}>
                <summary className={styles.jsonSummary}>
                  <Code2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Raw JSON Payload</span>
                </summary>
                <pre className={styles.jsonCode}>
                  {JSON.stringify(selectedRequest.payload, null, 2)}
                </pre>
              </details>
            </div>
          </Modal>
        )}

        {/* ── Rejection Confirmation Dialog ── */}
        {rejectTarget && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-dialog-title"
            onClick={(e) => {
              if (e.target === e.currentTarget && !anyBusy) setRejectTarget(null);
            }}
          >
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2 id="reject-dialog-title" className={styles.modalTitle}>
                  Reject {rejectTarget.name}
                </h2>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => !anyBusy && setRejectTarget(null)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className={styles.modalDesc}>
                Add an optional rejection note for the audit log. The visitor will not see this reason.
              </p>

              <textarea
                className={styles.noteArea}
                placeholder="Reason for rejection (optional, max 500 characters)"
                maxLength={500}
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                disabled={anyBusy}
              />

              <div className={styles.charCount}>{rejectNote.length}/500</div>

              <div className={styles.modalActions}>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={anyBusy}
                  onClick={() => setRejectTarget(null)}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  className={styles.confirmRejectBtn}
                  disabled={anyBusy}
                  onClick={() => void onConfirmReject()}
                >
                  {busyId === rejectTarget.id ? "Rejecting…" : "Confirm rejection"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
