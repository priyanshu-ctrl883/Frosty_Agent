"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerUpRight, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
  type EmailTicketDetail,
  closeTicket,
  getTicket,
  ticketReasonLabel,
  ticketReasonTone,
  ticketStatusLabel,
  ticketStatusTone,
} from "@/lib/emailTickets";
import styles from "../email.module.css";
import { ReplyComposer } from "./ReplyComposer";

const ACCENT = "#0396A6";

const formatWhen = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const sourceLabel = (source: string): string =>
  source === "auto"
    ? "Auto-reply"
    : source === "ticket_ack"
      ? "Ticket opened"
      : source === "ticket_close"
        ? "Ticket closed"
        : "You sent";

const InboundBubble = ({ msg }: { msg: EmailMessage }) => (
  <div className="flex w-full justify-start">
    <div className="max-w-[92%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
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

const OutboundBubble = ({ item }: { item: EmailOutbound }) => (
  <div className="flex w-full justify-end">
    <div
      className="max-w-[92%] rounded-2xl rounded-tr-sm border px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
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
      {item.subject ? <p className="text-[13px] font-semibold text-slate-900">{item.subject}</p> : null}
      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white/70 p-2 text-[12px] leading-relaxed text-slate-700">
        {item.body || "(empty body)"}
      </pre>
      {item.status === "failed" && item.error ? (
        <p className="mt-1 text-xs text-red-600">Send failed: {item.error}</p>
      ) : null}
      <div className="mt-2 text-right text-[10px] font-bold text-slate-400">
        {formatWhen(item.sent_at || item.created_at)}
      </div>
    </div>
  </div>
);

type Props = {
  open: boolean;
  agentId: string;
  ticketId: string | null;
  canManage: boolean;
  onClose: () => void;
  onGenerate: (id: string, prompt?: string) => Promise<EmailMessage>;
  onSend: (id: string, subject: string, body: string) => Promise<void>;
  /** Called after the ticket is closed, so the list can refresh. */
  onClosed?: () => void;
};

export const TicketDetailDrawer = ({
  open,
  agentId,
  ticketId,
  canManage,
  onClose,
  onGenerate,
  onSend,
  onClosed,
}: Props) => {
  const [detail, setDetail] = useState<EmailTicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ticketId) return;
    try {
      const d = await getTicket(agentId, ticketId);
      setDetail(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the ticket");
    }
  }, [agentId, ticketId]);

  useEffect(() => {
    if (!open || !ticketId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const d = await getTicket(agentId, ticketId);
        if (!cancelled) setDetail(d);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the ticket");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, agentId, ticketId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const messages = detail?.messages ?? [];
  const latest = messages.length > 0 ? messages[messages.length - 1] : null;
  const hasOutbound =
    (latest?.outbound?.length ?? 0) > 0 || latest?.reply_status === "sent";

  const threadItems = useMemo(() => {
    const items: Array<{ key: string; when: number; node: ReactNode }> = [];
    for (const msg of messages) {
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
  }, [messages]);

  const onCloseTicket = async () => {
    if (!detail || detail.status !== "open") return;
    setClosing(true);
    setError(null);
    try {
      await closeTicket(agentId, detail.id);
      await refresh();
      onClosed?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not close the ticket");
    } finally {
      setClosing(false);
    }
  };

  return (
    <AnimatePresence>
      {open && ticketId ? (
        <div className={styles.drawerOverlay} onClick={onClose}>
          <motion.div
            className={styles.drawerContent}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-drawer-title"
          >
            <div className={styles.drawerHeader}>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {detail ? (
                    <>
                      <StatusBadge label={intentLabel(detail.intent)} tone={intentTone(detail.intent)} />
                      <StatusBadge
                        label={ticketReasonLabel(detail.reason)}
                        tone={ticketReasonTone(detail.reason)}
                      />
                      <StatusBadge
                        label={ticketStatusLabel(detail.status)}
                        tone={ticketStatusTone(detail.status)}
                      />
                      <span className="text-xs text-zinc-500">
                        {detail.message_count} email{detail.message_count === 1 ? "" : "s"}
                      </span>
                    </>
                  ) : null}
                </div>
                <h2 id="ticket-drawer-title" className="break-words text-lg font-semibold text-zinc-900">
                  {detail?.ticket_number ? `${detail.ticket_number} · ` : ""}
                  {detail?.subject || (detail ? intentLabel(detail.intent) : "Ticket")}
                </h2>
                {detail ? (
                  <p className="mt-1 text-sm text-zinc-600">
                    {detail.sender_name ? `${detail.sender_name} · ` : ""}
                    {detail.sender_email}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {detail && detail.status === "open" && canManage ? (
                  <Button variant="ghost" size="sm" loading={closing} onClick={() => void onCloseTicket()}>
                    Close ticket
                  </Button>
                ) : null}
                <button type="button" className={styles.drawerClose} onClick={onClose} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className={`${styles.drawerBody} flex flex-col`}>
              {loading ? (
                <div className="p-6 text-center text-sm text-zinc-500">Loading ticket…</div>
              ) : error && !detail ? (
                <div className="p-6 text-center text-sm text-red-600">{error}</div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Conversation ({threadItems.length})
                    </p>
                    {error ? <p className="text-sm text-red-600">{error}</p> : null}
                    {threadItems.map((item) => (
                      <div key={item.key}>{item.node}</div>
                    ))}
                  </div>

                  {latest && detail?.status === "open" ? (
                    <ReplyComposer
                      message={latest}
                      canManage={canManage}
                      newFollowup={hasOutbound}
                      onGenerate={onGenerate}
                      onSend={onSend}
                      onAfterSend={() => void refresh()}
                    />
                  ) : detail?.status === "closed" ? (
                    <p className="border-t border-[#EAF3F3] px-5 py-4 text-sm text-zinc-500">
                      This ticket is closed. A confirmation was sent to the customer. A similar
                      follow-up will open a new ticket with a new ID.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};
