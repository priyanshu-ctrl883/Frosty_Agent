"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { relative } from "@/lib/format";
import {
  formatInboxHeaderLabel,
  formatInboxListLabel,
  formatInboxSessionCode,
  isWhatsAppWindowExpired,
  isWhatsAppQueueItemLikelyExpired,
} from "./inboxDisplay";
import { InboxContactAvatar } from "./InboxContactAvatar";
import type { QueueItem } from "@/lib/types";
import { apiPage } from "@/lib/api";
import { motion, useReducedMotion } from "framer-motion";
import {
  UserCheck,
  MessageSquare,
  MessageCircle,
  Globe,
  Clock,
  ShieldAlert,
  ArrowRight,
  RefreshCcw,
  Search,
  X,
  AlertCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./inbox.module.css";
import { InboxChannelFilterPills } from "./InboxChannelFilterPills";
import { InboxWhatsAppTemplateModal } from "./InboxWhatsAppTemplateModal";
import { useToast } from "@/lib/toast";

const classifyPreviewSender = (senderType: string | undefined) => {
  const type = (senderType || "").toLowerCase();
  if (type === "ai" || type === "bot") return "ai" as const;
  if (type === "agent") return "agent" as const;
  if (type === "system" || type === "note") return "system" as const;
  return "user" as const;
};

type Props = {
  queue: QueueItem[];
  loading: boolean;
  onClaim: (conversationId: string) => Promise<void>;
  busy: boolean;
  canReply: boolean;
  onRefresh: () => void;
  channelFilter?: "all" | "whatsapp" | "website";
  setChannelFilter?: (next: "all" | "whatsapp" | "website") => void;
  showChannelFilter?: boolean;
  agentScope?: string;
};

function formatReason(reason: string | null | undefined): string {
  if (!reason) return "Human assistance requested";
  if (reason === "user_request" || reason === "user_requested" || reason === "customer_requested") {
    return "Customer requested human agent";
  }
  if (reason === "low_confidence" || reason === "ai_unsure") {
    return "AI low confidence — human assistance needed";
  }
  if (reason === "vip") {
    return "VIP priority account routing";
  }
  if (reason === "safety") {
    return "Compliance / Data policy verification";
  }
  if (reason === "not_entitled") {
    return "Plan upgrade & billing inquiry";
  }
  if (reason === "manual") {
    return "Manual operator escalation";
  }
  if (reason === "unsupported_tool" || reason === "complex_inquiry") {
    return "Complex request requiring agent assistance";
  }
  if (reason === "billing_issue") {
    return "Billing inquiry escalated to human";
  }
  return reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatCard({
  value,
  label,
  icon,
  delay = 0,
}: {
  value: number | string;
  label: string;
  icon: React.ReactNode;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      className="p-3 sm:p-3.5 rounded-2xl bg-white border border-border shadow-xs flex flex-col justify-between hover:border-[#03A8CB]/40 hover:shadow-md transition-all"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay }}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
        <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
          {label}
        </span>
        <motion.div
          className="text-[#03A8CB] flex items-center justify-center shrink-0"
          whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.div>
      </div>
      <div>
        <div
          style={{ fontFamily: "Outfit, sans-serif" }}
          className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight leading-none"
        >
          {value}
        </div>
      </div>
    </motion.div>
  );
}

export function InboxHandoffRequestsTab({
  queue,
  loading,
  onClaim,
  busy,
  canReply,
  onRefresh,
  channelFilter = "all",
  setChannelFilter,
  showChannelFilter = false,
  agentScope = "all",
}: Props) {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [templateTarget, setTemplateTarget] = useState<QueueItem | null>(null);
  const [windowExpiredById, setWindowExpiredById] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedDetailsItem, setSelectedDetailsItem] = useState<QueueItem | null>(null);
  const [modalTab, setModalTab] = useState<"preview" | "details">("preview");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, channelFilter, agentScope]);

  useEffect(() => {
    if (selectedDetailsItem) {
      setModalTab("preview");
      setLoadingChat(true);
      setChatMessages([]);
      apiPage<any[]>(
        `/v1/inbox/conversations/${selectedDetailsItem.conversation_id}/messages?limit=200&newest=true`,
      )
        .then((res) => setChatMessages(res.data || []))
        .catch((err) => console.error("Failed to load chat", err))
        .finally(() => setLoadingChat(false));
    }
  }, [selectedDetailsItem]);

  useEffect(() => {
    if (modalTab === "preview" && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, modalTab]);

  const whatsappCount = useMemo(() => queue.filter((q) => q.channel === "whatsapp").length, [queue]);
  const websiteCount = useMemo(() => queue.filter((q) => q.channel === "website").length, [queue]);
  const oldestWait = useMemo(() => {
    if (!queue.length) return "None";
    const oldest = queue.reduce((prev, curr) =>
      new Date(curr.waiting_since) < new Date(prev.waiting_since) ? curr : prev
    );
    return relative(oldest.waiting_since);
  }, [queue]);

  const filteredQueue = queue.filter((item) => {
    if (agentScope !== "all" && item.agent_id !== agentScope) return false;
    if (channelFilter !== "all" && item.channel !== channelFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      if (item.contact_label?.toLowerCase().includes(s)) return true;
      if (item.trigger_reason?.toLowerCase().includes(s)) return true;
      return false;
    }
    return true;
  });

  const paginatedQueue = filteredQueue.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const modalWindowExpired =
    selectedDetailsItem?.channel === "whatsapp" &&
    (chatMessages.length
      ? isWhatsAppWindowExpired(chatMessages, "whatsapp")
      : isWhatsAppQueueItemLikelyExpired(selectedDetailsItem));

  const resolveWindowExpired = async (item: QueueItem): Promise<boolean> => {
    if (item.channel !== "whatsapp") return false;
    if (selectedDetailsItem?.conversation_id === item.conversation_id && chatMessages.length) {
      return isWhatsAppWindowExpired(chatMessages, "whatsapp");
    }
    if (windowExpiredById[item.conversation_id] !== undefined) {
      return windowExpiredById[item.conversation_id]!;
    }
    try {
      const res = await apiPage<any[]>(
        `/v1/inbox/conversations/${item.conversation_id}/messages?limit=80&newest=true`,
      );
      const expired = isWhatsAppWindowExpired(res.data || [], "whatsapp");
      setWindowExpiredById((prev) => ({ ...prev, [item.conversation_id]: expired }));
      return expired;
    } catch {
      const likely = isWhatsAppQueueItemLikelyExpired(item);
      setWindowExpiredById((prev) => ({ ...prev, [item.conversation_id]: likely }));
      return likely;
    }
  };

  const isItemWindowExpired = (item: QueueItem): boolean => {
    if (item.channel !== "whatsapp") return false;
    if (selectedDetailsItem?.conversation_id === item.conversation_id && chatMessages.length) {
      return isWhatsAppWindowExpired(chatMessages, "whatsapp");
    }
    if (windowExpiredById[item.conversation_id] !== undefined) {
      return windowExpiredById[item.conversation_id]!;
    }
    return isWhatsAppQueueItemLikelyExpired(item);
  };

  useEffect(() => {
    if (!paginatedQueue.length) return;
    const waItems = paginatedQueue.filter((q) => q.channel === "whatsapp");
    if (!waItems.length) return;
    void (async () => {
      for (const item of waItems) {
        if (windowExpiredById[item.conversation_id] !== undefined) continue;
        await resolveWindowExpired(item);
      }
    })();
  }, [paginatedQueue]);

  const handleClaim = async (item: QueueItem) => {
    if (item.channel === "whatsapp") {
      const expired = await resolveWindowExpired(item);
      if (expired) {
        showToast(
          "Send an approved template and wait for the customer to reply before claiming.",
          { type: "info" },
        );
        setTemplateTarget(item);
        return;
      }
    }
    setClaimingId(item.conversation_id);
    try {
      await onClaim(item.conversation_id);
    } finally {
      setClaimingId(null);
    }
  };

  const handleOpenTemplate = (item: QueueItem) => {
    setTemplateTarget(item);
  };

  return (
    <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden">
      <div className="flex flex-col gap-3 sm:gap-3.5 w-full h-full flex-1 min-h-0 max-w-[1280px] mx-auto overflow-hidden px-3 sm:px-4 md:px-6 pt-2 sm:pt-3 pb-2 sm:pb-3">
        {/* 4 Overview Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 shrink-0">
          <StatCard
            value={queue.length}
            label="Pending Handoffs"
            icon={<ShieldAlert size={17} />}
            delay={0.05}
          />
          <StatCard
            value={whatsappCount}
            label="WhatsApp Requests"
            icon={<MessageSquare size={17} />}
            delay={0.1}
          />
          <StatCard
            value={websiteCount}
            label="Website Requests"
            icon={<Globe size={17} />}
            delay={0.15}
          />
          <StatCard
            value={oldestWait}
            label="Oldest Waiting"
            icon={<Clock size={17} />}
            delay={0.2}
          />
        </div>

        {/* Main Container Card */}
        <div className="bg-white rounded-2xl shadow-xs border border-border flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Header and Filters */}
          <div className="p-3 sm:p-4 border-b border-border bg-muted/10 flex flex-col gap-2.5 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2
                    style={{ fontFamily: "Outfit, sans-serif" }}
                    className="text-base sm:text-lg font-bold text-foreground"
                  >
                    Pending Handoff Requests
                  </h2>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Conversations where customers asked for human assistance or AI requested escalation.
                </p>
              </div>
            </div>

            {/* Search, Filter & Refresh row */}
            <div className="flex items-center gap-2 sm:gap-3 w-full flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by customer or reason…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground outline-none focus:border-[#0396A6] transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-0.5"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <button
                onClick={onRefresh}
                className="h-[34px] w-[34px] hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors border border-border cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
                title="Refresh Queue"
                aria-label="Refresh Queue"
                disabled={busy || loading}
              >
                <RefreshCcw size={14} className={loading ? "animate-spin text-[#0396A6]" : ""} />
              </button>
            </div>

            {showChannelFilter && setChannelFilter ? (
              <InboxChannelFilterPills value={channelFilter} onChange={setChannelFilter} />
            ) : null}
          </div>

          {/* Content Body */}
          <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-2 text-xs sm:text-sm text-muted-foreground my-auto">
                <span className="block w-6 h-6 border-2 border-[#0396A6]/30 border-t-[#0396A6] rounded-full animate-spin" />
                Loading handoffs…
              </div>
            ) : !filteredQueue.length ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center gap-2 animate-in fade-in my-auto">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-1 text-emerald-600">
                  <UserCheck size={28} />
                </div>
                <div
                  style={{ fontFamily: "Outfit, sans-serif" }}
                  className="text-sm sm:text-base font-bold text-foreground"
                >
                  No pending handoffs!
                </div>
                <p className="text-xs text-muted-foreground max-w-sm">
                  All clear! Your AI agents are resolving inquiries automatically.
                </p>
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* ── MOBILE CARD VIEW (< md) ─────────────────────────────────── */}
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar scroll-smooth flex flex-col divide-y divide-border/60 md:hidden">
                  {paginatedQueue.map((item) => {
                    const label = formatInboxListLabel(
                      item.contact_label,
                      item.conversation_id,
                      item.channel,
                    );
                    const reason = formatReason(item.trigger_reason);
                    const isThisClaiming = claimingId === item.conversation_id;
                    const waExpiredLikely = isItemWindowExpired(item);

                    return (
                      <div
                        key={item.handoff_id || item.conversation_id}
                        className="p-3.5 sm:p-4 flex flex-col gap-2.5 bg-card hover:bg-muted/10 transition-colors"
                      >
                        {/* Top Visitor + Channel Row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <InboxContactAvatar
                              contactLabel={item.contact_label}
                              channel={item.channel}
                              compact
                            />
                            <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                              {label}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-foreground shrink-0">
                            {item.channel === "whatsapp" ? "WhatsApp" : "Website"}
                          </span>
                        </div>

                        {/* Reason Plain Black Text */}
                        <div className="text-xs font-semibold text-foreground leading-snug">
                          {reason}
                        </div>
                        {waExpiredLikely && (
                          <div className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 leading-snug">
                            24h window expired — send a template first. Claim unlocks after the customer replies.
                          </div>
                        )}

                        {/* Waiting time + Action Buttons Row */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                            <Clock size={12} className="text-[#111827]" /> {relative(item.waiting_since)}
                          </span>

                          <div className="flex gap-2 items-center">
                            <button
                              type="button"
                              onClick={() => setSelectedDetailsItem(item)}
                              className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 border border-border rounded-xl transition-all active:scale-95 cursor-pointer"
                            >
                              <span>View & Chat</span>
                            </button>
                            {waExpiredLikely ? (
                              <Button
                                type="button"
                                size="sm"
                                disabled={busy || !canReply}
                                onClick={() => handleOpenTemplate(item)}
                                className="text-xs h-8 px-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-xs active:scale-95 transition-all"
                              >
                                <MessageCircle size={13} className="inline mr-1" />
                                Send Template
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                disabled={busy || !canReply}
                                loading={isThisClaiming}
                                onClick={() => void handleClaim(item)}
                                className="text-xs h-8 px-3.5 bg-[#0396A6] hover:bg-[#0396A6]/90 text-white font-bold rounded-xl shadow-xs active:scale-95 transition-all"
                              >
                                Claim
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── DESKTOP TABLE VIEW (>= md) ──────────────────────────────── */}
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar scroll-smooth hidden md:block">
                  <table className="w-full text-left border-collapse">
                    <thead className={styles.handoffTableHead}>
                      <tr className={styles.handoffTableHeadRow}>
                        <th className={styles.handoffTableHeadCell}>Visitor</th>
                        <th className={styles.handoffTableHeadCell}>Channel</th>
                        <th className={styles.handoffTableHeadCell}>Handoff Reason</th>
                        <th className={styles.handoffTableHeadCell}>Waiting Since</th>
                        <th className={`${styles.handoffTableHeadCell} text-right`}>Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 text-xs bg-white">
                      {paginatedQueue.map((item) => {
                        const label = formatInboxListLabel(
                          item.contact_label,
                          item.conversation_id,
                          item.channel,
                        );
                        const reason = formatReason(item.trigger_reason);
                        const isThisClaiming = claimingId === item.conversation_id;
                        const waExpiredLikely = isItemWindowExpired(item);

                        return (
                          <tr
                            key={item.handoff_id || item.conversation_id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-2.5">
                                <InboxContactAvatar
                                  contactLabel={item.contact_label}
                                  channel={item.channel}
                                  compact
                                />
                                <span className="font-bold text-foreground">{label}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5">
                              <span className="text-xs font-semibold text-foreground">
                                {item.channel === "whatsapp" ? "WhatsApp" : "Website"}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 max-w-[240px] text-xs">
                              <div className="font-semibold text-foreground truncate">{reason}</div>
                              {waExpiredLikely && (
                                <div className="text-[10px] text-amber-700 font-medium mt-1 leading-snug">
                                  Send template first · claim after customer replies
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-5 text-foreground font-semibold text-xs">
                              {relative(item.waiting_since)}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedDetailsItem(item)}
                                  className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground border border-border bg-muted/10 hover:bg-muted/30 transition-all cursor-pointer rounded-xl font-semibold"
                                >
                                  View & Chat
                                </Button>
                                {waExpiredLikely ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={busy || !canReply}
                                    onClick={() => handleOpenTemplate(item)}
                                    className="text-xs h-8 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold shadow-xs transition-all cursor-pointer"
                                  >
                                    Send Template
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={busy || !canReply}
                                    loading={isThisClaiming}
                                    onClick={() => void handleClaim(item)}
                                    className="text-xs h-8 px-3 bg-[#0396A6] hover:bg-[#0396A6]/90 text-white font-semibold shadow-xs transition-all cursor-pointer"
                                  >
                                    Claim
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pinned Pagination at Bottom (Matching KB) */}
                <Pagination
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalItems={filteredQueue.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20, 25, 50]}
                  itemLabel="requests"
                  className="shrink-0 border-t border-border mt-auto bg-transparent px-3.5 sm:px-5 py-2.5"
                />
              </div>
            )}
          </div>
        </div>

        {/* Details & Live Chat Preview Modal */}
        {selectedDetailsItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setSelectedDetailsItem(null)}
            />
            <div
              className="relative bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-border flex flex-col md:flex-row overflow-hidden h-[90vh] sm:h-[85vh] max-h-[720px] my-auto animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── MOBILE HEADER WITH TAB SWITCHER (< md) ─────────────── */}
              <div className="flex md:hidden flex-col border-b border-border bg-muted/20 shrink-0">
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <InboxContactAvatar
                      contactLabel={selectedDetailsItem.contact_label}
                      channel={selectedDetailsItem.channel}
                      compact
                    />
                    <div className="truncate text-xs sm:text-sm font-bold text-foreground">
                      {formatInboxHeaderLabel(
                        selectedDetailsItem.contact_label,
                        selectedDetailsItem.conversation_id,
                        selectedDetailsItem.channel,
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDetailsItem(null)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Segmented Switcher for Mobile */}
                <div className="grid grid-cols-2 p-1 bg-muted/40 mx-3 mb-2.5 rounded-xl border border-border/60">
                  <button
                    type="button"
                    onClick={() => setModalTab("preview")}
                    className={cn(
                      "py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                      modalTab === "preview"
                        ? "bg-card text-[#0396A6] shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <MessageSquare size={13} />
                    <span>Chat Preview</span>
                    {chatMessages.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#0396A6]/15 text-[#0396A6]">
                        {chatMessages.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab("details")}
                    className={cn(
                      "py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                      modalTab === "details"
                        ? "bg-card text-[#0396A6] shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FileText size={13} />
                    <span>Details</span>
                  </button>
                </div>
              </div>

              {/* ── LEFT PANEL (Details) ─────────────────────────────────── */}
              <div
                className={cn(
                  "w-full md:w-[42%] bg-muted/20 p-4 sm:p-6 border-b md:border-b-0 md:border-r border-border flex flex-col overflow-y-auto",
                  modalTab !== "details" ? "hidden md:flex" : "flex flex-1"
                )}
              >
                <div className="hidden md:flex items-center justify-between mb-5">
                  <h3
                    style={{ fontFamily: "Outfit, sans-serif" }}
                    className="text-base sm:text-lg font-bold text-foreground"
                  >
                    Action Required
                  </h3>
                </div>

                <div className="space-y-3.5 flex-1">
                  <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      Customer
                    </div>
                    <div className="text-sm font-bold text-foreground truncate">
                      {formatInboxHeaderLabel(
                        selectedDetailsItem.contact_label,
                        selectedDetailsItem.conversation_id,
                        selectedDetailsItem.channel,
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-foreground">
                        {selectedDetailsItem.channel === "whatsapp" ? "WhatsApp" : "Website"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatInboxSessionCode(
                          selectedDetailsItem.conversation_id,
                          selectedDetailsItem.channel,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Trigger Reason
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed">
                      {formatReason(selectedDetailsItem.trigger_reason)}
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Waiting Since
                      </div>
                      <div className="text-xs font-bold text-foreground">
                        {new Date(selectedDetailsItem.waiting_since).toLocaleString()}
                      </div>
                    </div>
                    <Clock size={16} className="text-[#111827]" />
                  </div>

                  {modalWindowExpired && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed">
                      <strong>24h WhatsApp window expired.</strong> Send an approved template
                      first. Claiming is blocked until the customer replies and reopens the chat
                      window.
                    </div>
                  )}
                </div>

                {/* Desktop bottom claim action */}
                <div className="hidden md:block mt-auto pt-6">
                  {modalWindowExpired ? (
                    <Button
                      disabled={busy || !canReply}
                      onClick={() => handleOpenTemplate(selectedDetailsItem)}
                      className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm h-10 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <MessageCircle size={15} />
                      <span>Send Template</span>
                    </Button>
                  ) : (
                    <Button
                      disabled={busy || !canReply}
                      loading={claimingId === selectedDetailsItem.conversation_id}
                      onClick={() => {
                        void handleClaim(selectedDetailsItem);
                        setSelectedDetailsItem(null);
                      }}
                      className="w-full bg-[#0396A6] hover:bg-[#0396A6]/90 text-white font-bold text-xs sm:text-sm h-10 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.99] transition-all"
                    >
                      <span>Claim Conversation</span>
                      <ArrowRight size={15} />
                    </Button>
                  )}
                </div>
              </div>

              {/* ── RIGHT PANEL (Chat Preview) ───────────────────────────── */}
              <div
                className={cn(
                  "w-full md:w-[58%] flex flex-col bg-background min-h-0 flex-1",
                  modalTab !== "preview" ? "hidden md:flex" : "flex"
                )}
              >
                {/* Desktop Header */}
                <div className="hidden md:flex px-4 py-3 border-b border-border bg-card justify-between items-center z-10 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <InboxContactAvatar
                      contactLabel={selectedDetailsItem.contact_label}
                      channel={selectedDetailsItem.channel}
                      compact
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">
                        {formatInboxHeaderLabel(
                          selectedDetailsItem.contact_label,
                          selectedDetailsItem.conversation_id,
                          selectedDetailsItem.channel,
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground truncate">
                        {formatInboxSessionCode(
                          selectedDetailsItem.conversation_id,
                          selectedDetailsItem.channel,
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDetailsItem(null)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label="Close"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Scrollable messages container */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto p-3.5 sm:p-4 flex flex-col gap-2.5 bg-muted/15 min-h-0"
                >
                  {loadingChat ? (
                    <div className="m-auto text-center py-10 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                      <span className="block w-5 h-5 border-2 border-[#0396A6]/30 border-t-[#0396A6] rounded-full animate-spin" />
                      Loading conversation messages…
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="m-auto text-center p-6">
                      <div className="text-xs font-semibold text-muted-foreground">No recent messages in preview.</div>
                    </div>
                  ) : (
                    [...chatMessages].reverse().map((msg, i) => {
                      const kind = classifyPreviewSender(msg.sender_type);
                      const isAi = kind === "ai";
                      const isAgent = kind === "agent";
                      const isOutgoing = isAi || isAgent;

                      if (kind === "system") {
                        return (
                          <div key={msg.id ?? i} className={styles.systemEvent}>
                            <span>{msg.body}</span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id ?? i}
                          className={cn(
                            styles.messageRow,
                            isOutgoing ? styles.messageRowRight : styles.messageRowLeft,
                          )}
                        >
                          <div
                            className={cn(
                              styles.bubble,
                              isAi
                                ? styles.sender_ai
                                : isAgent
                                ? styles.sender_agent
                                : styles.sender_user,
                              "max-w-[85%] px-3.5 py-2 text-xs leading-relaxed shadow-xs",
                            )}
                          >
                            <div
                              className={cn(
                                "text-[10px] font-bold mb-1 uppercase tracking-wide",
                                isAi
                                  ? "text-[#0396A6]"
                                  : isAgent
                                  ? "text-white/90"
                                  : "text-[#0A1A2F]",
                              )}
                            >
                              {isAi ? "Frosty AI" : isAgent ? "Human Agent" : "Customer"}
                            </div>
                            <div className="whitespace-pre-wrap break-words">{msg.body}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ── MOBILE STICKY BOTTOM ACTION BAR (< md) ──────────────── */}
              <div className="p-3 border-t border-border bg-card flex items-center gap-2 md:hidden shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedDetailsItem(null)}
                  className="flex-1 text-xs h-10 rounded-xl border border-border text-muted-foreground"
                >
                  Close
                </Button>
                {modalWindowExpired ? (
                  <Button
                    disabled={busy || !canReply}
                    onClick={() => handleOpenTemplate(selectedDetailsItem)}
                    className="flex-[2] bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm h-10 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <MessageCircle size={14} />
                    <span>Send Template</span>
                  </Button>
                ) : (
                  <Button
                    disabled={busy || !canReply}
                    loading={claimingId === selectedDetailsItem.conversation_id}
                    onClick={() => {
                      void handleClaim(selectedDetailsItem);
                      setSelectedDetailsItem(null);
                    }}
                    className="flex-[2] bg-[#0396A6] hover:bg-[#0396A6]/90 text-white font-bold text-xs sm:text-sm h-10 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Claim Conversation</span>
                    <ArrowRight size={14} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {templateTarget && (
          <InboxWhatsAppTemplateModal
            open={Boolean(templateTarget)}
            conversationId={templateTarget.conversation_id}
            contactName={formatInboxHeaderLabel(
              templateTarget.contact_label,
              templateTarget.conversation_id,
              templateTarget.channel,
            )}
            onClose={() => setTemplateTarget(null)}
            onSuccess={() => {
              showToast(
                "Template sent. Wait for the customer to reply — then you can claim this conversation.",
                { type: "success" },
              );
              setTemplateTarget(null);
              onRefresh();
            }}
          />
        )}
      </div>
    </div>
  );
}
