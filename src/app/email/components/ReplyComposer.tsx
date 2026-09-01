"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { EmailMessage } from "@/lib/emailAutomation";
import styles from "../email.module.css";

const defaultSubject = (original: string | null) => {
  const s = (original ?? "").trim();
  if (!s) return "Re:";
  return s.toLowerCase().startsWith("re:") ? s : `Re: ${s}`;
};

type Props = {
  /** The inbound email being replied to — generate/send are keyed on its id. */
  message: EmailMessage;
  canManage: boolean;
  /** True when the message already has sent replies, so the header reads "New follow-up". */
  newFollowup?: boolean;
  onGenerate: (id: string, prompt?: string) => Promise<EmailMessage>;
  onSend: (id: string, subject: string, body: string) => Promise<void>;
  /** Called after a successful send, so a parent (e.g. the ticket thread) can refresh. */
  onAfterSend?: () => void;
};

/** The compose footer shared by the email detail drawer and the ticket thread drawer: subject +
 *  body, "Generate with AI", an optional prompt, and Send via Gmail. It seeds its draft from the
 *  message's stored `generated_reply` and from whatever `onGenerate` returns, so it works whether or
 *  not the caller keeps the message in a wider list state. */
export const ReplyComposer = ({
  message,
  canManage,
  newFollowup = false,
  onGenerate,
  onSend,
  onAfterSend,
}: Props) => {
  const [subject, setSubject] = useState("");
  const [draft, setDraft] = useState("");
  const [promptOpen, setPromptOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setSubject(defaultSubject(message.subject));
    setDraft(message.generated_reply ?? "");
    setPromptOpen(false);
    setPrompt("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.id]);

  useEffect(() => {
    setDraft(message.generated_reply ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.generated_reply]);

  const canSend = canManage && !!draft.trim() && !!subject.trim();

  return (
    <div className={`${styles.composeFooter} mt-auto border-t border-[#EAF3F3]`}>
      <div className={styles.composeHead}>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {newFollowup ? "New follow-up" : "Reply"}
        </p>
        {canManage ? (
          <div className={styles.composeActions}>
            <Button
              variant="ghost"
              size="sm"
              loading={generating && !promptOpen}
              onClick={async () => {
                setGenerating(true);
                try {
                  const updated = await onGenerate(message.id);
                  setDraft(updated.generated_reply ?? "");
                } finally {
                  setGenerating(false);
                }
              }}
            >
              {draft.trim() ? "Regenerate with AI" : "Generate with AI"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPromptOpen((v) => !v)}>
              {promptOpen ? "Hide prompt" : "Regenerate with prompt"}
            </Button>
          </div>
        ) : null}
      </div>

      {promptOpen && canManage ? (
        <div className={styles.promptBox}>
          <p className={styles.promptLabel}>Your prompt</p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="e.g. Keep it short, mention our 14-day trial, and ask for their company size."
            className={styles.promptInput}
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              loading={generating}
              disabled={!prompt.trim()}
              onClick={async () => {
                setGenerating(true);
                try {
                  const updated = await onGenerate(message.id, prompt.trim());
                  setDraft(updated.generated_reply ?? "");
                } finally {
                  setGenerating(false);
                }
              }}
            >
              Generate from prompt
            </Button>
          </div>
        </div>
      ) : null}

      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        disabled={!canManage}
        placeholder="Subject"
        className="mb-2 w-full rounded-xl border border-[#D9EDEE] bg-white px-3 py-2 text-sm text-zinc-800 focus:border-emerald-400 focus:outline-none disabled:opacity-60"
      />
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={!canManage}
        rows={7}
        placeholder="Write your email, or generate one with AI, then send it via Gmail."
        className="w-full resize-y rounded-xl border border-[#D9EDEE] bg-white p-3 text-sm text-zinc-800 focus:border-emerald-400 focus:outline-none disabled:opacity-60"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <Button
          size="sm"
          loading={sending}
          disabled={!canSend}
          onClick={async () => {
            setSending(true);
            try {
              await onSend(message.id, subject.trim(), draft.trim());
              setDraft("");
              onAfterSend?.();
            } finally {
              setSending(false);
            }
          }}
        >
          Send via Gmail
        </Button>
      </div>
    </div>
  );
};
