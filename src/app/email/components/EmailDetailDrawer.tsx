"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  type EmailMessage,
  intentLabel,
  intentTone,
  outboundLabel,
  outboundTone,
  processingLabel,
  processingTone,
  replyLabel,
  replyTone,
} from "@/lib/emailAutomation";
import styles from "../email.module.css";
import { ReplyComposer } from "./ReplyComposer";

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
        : "Manual";
const sourceTone = (source: string): "pine" | "info" | "warning" =>
  source === "auto" ? "pine" : source === "ticket_ack" || source === "ticket_close" ? "warning" : "info";

const OutboundItem = ({ item }: { item: NonNullable<EmailMessage["outbound"]>[number] }) => {
  const [open, setOpen] = useState(item.source === "auto");
  return (
    <div className="rounded-xl border border-[#EAF3F3] bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="min-w-0 flex-1 break-words text-sm font-semibold text-zinc-800">
          {item.subject}
        </span>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <StatusBadge
            label={sourceLabel(item.source)}
            tone={sourceTone(item.source)}
            dot={false}
          />
          <StatusBadge label={outboundLabel(item.status)} tone={outboundTone(item.status)} dot={false} />
        </div>
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
        <span className="min-w-0 break-all">To: {item.to_email}</span>
        <span>·</span>
        <span>{formatWhen(item.sent_at ?? item.created_at)}</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto font-medium text-emerald-600 hover:underline"
        >
          {open ? "Hide" : "View"}
        </button>
      </div>
      {item.status === "failed" && item.error ? (
        <p className="mt-1 text-xs text-red-600">Send failed: {item.error}</p>
      ) : null}
      {open ? (
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-[#F8FBFB] p-2 text-xs text-zinc-700">
          {item.body}
        </pre>
      ) : null}
    </div>
  );
};

type Props = {
  open: boolean;
  message: EmailMessage | null;
  canManage: boolean;
  onClose: () => void;
  onGenerate: (id: string, prompt?: string) => Promise<EmailMessage>;
  onSend: (id: string, subject: string, body: string) => Promise<void>;
};

export const EmailDetailDrawer = ({
  open,
  message,
  canManage,
  onClose,
  onGenerate,
  onSend,
}: Props) => {
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!message) return;
    setHistoryOpen(false);
  }, [message?.id]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const outbound = message?.outbound ?? [];
  const historyPreview = 2;
  const visibleHistory = historyOpen ? outbound : outbound.slice(0, historyPreview);
  const hiddenHistory = Math.max(0, outbound.length - historyPreview);

  return (
    <AnimatePresence>
      {open && message ? (
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
            aria-labelledby="email-drawer-title"
          >
            <div className={styles.drawerHeader}>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {message.intent ? (
                    <StatusBadge label={intentLabel(message.intent)} tone={intentTone(message.intent)} />
                  ) : null}
                  <StatusBadge
                    label={processingLabel(message.processing_status)}
                    tone={processingTone(message.processing_status)}
                  />
                  {message.reply_status !== "none" ? (
                    <StatusBadge
                      label={replyLabel(message.reply_status)}
                      tone={replyTone(message.reply_status)}
                    />
                  ) : null}
                  {typeof message.intent_confidence === "number" ? (
                    <span className="text-xs text-zinc-500">
                      {Math.round(message.intent_confidence * 100)}% confidence
                    </span>
                  ) : null}
                </div>
                <h2 id="email-drawer-title" className="break-words text-lg font-semibold text-zinc-900">
                  {message.subject || "(no subject)"}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {message.sender_name ? `${message.sender_name} · ` : ""}
                  {message.sender_email}
                </p>
                <p className="text-xs text-zinc-400">{formatWhen(message.received_at)}</p>
              </div>
              <button type="button" className={styles.drawerClose} onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className={`${styles.drawerBody} flex flex-col`}>
              {message.summary ? (
                <div className="mx-5 mt-4 rounded-xl bg-[#F3F9F9] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    AI Summary
                  </p>
                  <p className="mt-1 text-sm text-zinc-700">{message.summary}</p>
                </div>
              ) : null}

              <div className="p-5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Email</p>
                <pre className="whitespace-pre-wrap break-words rounded-xl border border-[#EAF3F3] bg-white p-3 text-sm text-zinc-800">
                  {message.body || "(empty body)"}
                </pre>
              </div>

              {outbound.length > 0 ? (
                <div className="px-5 pb-1">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Sent emails ({outbound.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {visibleHistory.map((o) => (
                      <OutboundItem key={o.id} item={o} />
                    ))}
                  </div>
                  {hiddenHistory > 0 ? (
                    <button
                      type="button"
                      className={styles.showMoreBtn}
                      onClick={() => setHistoryOpen((v) => !v)}
                    >
                      {historyOpen ? "Show less" : `Show more (${hiddenHistory} more)`}
                    </button>
                  ) : null}
                </div>
              ) : null}

              <ReplyComposer
                message={message}
                canManage={canManage}
                newFollowup={outbound.length > 0}
                onGenerate={onGenerate}
                onSend={onSend}
              />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};
