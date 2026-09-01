"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { API_URL } from "@/lib/constants";
import { impersonationHeader } from "@/lib/impersonation";
import { getToken } from "@/lib/session";
import type { Agent, KbSource } from "@/lib/types";
import { markSandboxTested, readSandboxTested, completeOnboardingStep } from "@/lib/onboarding";

import {
  Bot,
  User,
  Send,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  Info,
} from "lucide-react";

interface Props {
  onCompleted?: () => void;
  onRefreshWorkspace?: () => void;
}

type BrainEvent =
  | { event: "run.started"; data: Record<string, unknown> }
  | { event: "token"; data: { text?: string } }
  | { event: "message.completed"; data: { text?: string } }
  | { event: "sandbox.session"; data: { conversation_id?: string } }
  | { event: "suggested_replies"; data: { replies?: string[] } }
  | { event: "handoff_requested"; data: Record<string, unknown> }
  | { event: "error"; data: { code?: string; reason?: string; message?: string } };

type Line = { who: "user" | "ai" | "system"; text: string };

const DEFAULT_REPLIES = [
  "What services do you offer?",
  "How do I get started?",
  "Can you share your pricing?",
];

const ERROR_COPY = {
  no_draft: "This agent has no draft version yet — save Create agent first.",
  no_published: "This agent has nothing published yet.",
  bad_request: "The sandbox could not read that agent.",
  llm_failed: "The model did not answer. Try again in a moment.",
  stream_failed: "The stream broke before the answer finished.",
  sandbox_quota_exceeded: "Sandbox conversation limit reached for this billing period.",
  rate_limited: "Too many sandbox requests — wait a minute and try again.",
} as const;

type SandboxErrorCode = keyof typeof ERROR_COPY;

function sandboxErrorCopy(code: string | undefined | null): string | undefined {
  if (!code || !(code in ERROR_COPY)) return undefined;
  return ERROR_COPY[code as SandboxErrorCode];
}

function isReadySource(status: string) {
  return status === "completed" || status === "ready";
}

export function StepSandboxTest({ onCompleted, onRefreshWorkspace }: Props) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replies, setReplies] = useState<string[]>(DEFAULT_REPLIES);
  const [readySources, setReadySources] = useState(0);
  const [totalSources, setTotalSources] = useState(0);
  const [hasReplied, setHasReplied] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const freshSessionRef = useRef(true);

  const resetChat = useCallback(() => {
    setLines([]);
    setConversationId(null);
    freshSessionRef.current = true;
    setReplies(DEFAULT_REPLIES);
    setError(null);
    setHasReplied(false);
  }, []);

  useEffect(() => {
    setConversationId(null);
    freshSessionRef.current = true;
    setLines([]);
    setReplies(DEFAULT_REPLIES);
    setHasReplied(false);
    setHasConfirmed(readSandboxTested(agentId || null));
    setError(null);
  }, [agentId]);

  useEffect(() => {
    let cancelled = false;
    apiRequest<Agent[]>("/v1/agents")
      .then((list) => {
        if (cancelled) return;
        setAgents(list || []);
        if ((list || []).length > 0) {
          const preferred =
            (list || []).find((a) => a.is_active && a.mode !== "whatsapp") || list![0];
          if (preferred) setAgentId(preferred.id);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load agents");
      });

    apiRequest<KbSource[]>("/v1/kb/sources")
      .then((list) => {
        if (cancelled) return;
        const rows = Array.isArray(list) ? list : [];
        setTotalSources(rows.length);
        setReadySources(rows.filter((s) => isReadySource(s.status)).length);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = transcriptRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines, busy]);

  const confirmLooksGood = () => {
    if (!agentId) return;
    markSandboxTested(agentId);
    setHasConfirmed(true);
    void completeOnboardingStep("test_sandbox").catch(() => null);
    if (onRefreshWorkspace) onRefreshWorkspace();
    if (onCompleted) onCompleted();
  };


  const send = useCallback(
    async (text: string) => {
      if (!agentId || !text.trim()) return;
      const fresh = freshSessionRef.current;
      freshSessionRef.current = false;
      setBusy(true);
      setError(null);
      setReplies([]);

      let aiIndex = -1;
      setLines((l) => {
        aiIndex = l.length + 1;
        return [...l, { who: "user", text }, { who: "ai", text: "" }];
      });

      const token = await getToken();
      let res: Response;
      try {
        res = await fetch(`${API_URL}/v1/agents/${agentId}/sandbox/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...impersonationHeader(),
          },
          body: JSON.stringify({
            message: text,
            conversation_id: conversationId ?? undefined,
            fresh,
          }),
        });
      } catch {
        setError("Cannot reach the sandbox API.");
        setLines((l) => l.slice(0, -2));
        setBusy(false);
        return;
      }

      if (!res.ok || !res.body) {
        let message = `Sandbox request returned status ${res.status}`;
        try {
          const raw = await res.text();
          const json = raw ? JSON.parse(raw) : null;
          const code = json?.error?.code as string | undefined;
          const apiMsg = json?.error?.message as string | undefined;
          const mapped = sandboxErrorCopy(code);
          if (mapped) message = mapped;
          else if (apiMsg) message = apiMsg;
          else if (res.status === 429) message = ERROR_COPY.rate_limited;
        } catch {
          if (res.status === 429) message = ERROR_COPY.rate_limited;
        }
        setError(message);
        setLines((l) => l.slice(0, -2));
        setBusy(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answered = false;
      let streamError: string | null = null;

      function onEvent(evt: BrainEvent) {
        switch (evt.event) {
          case "sandbox.session":
            if (evt.data.conversation_id) {
              setConversationId(String(evt.data.conversation_id));
            }
            break;
          case "token":
            if (evt.data.text) {
              answered = true;
              setLines((l) =>
                l.map((line, i) =>
                  i === aiIndex ? { ...line, text: line.text + evt.data.text } : line,
                ),
              );
            }
            break;
          case "message.completed":
            if (evt.data.text) {
              answered = true;
              setLines((l) =>
                l.map((line, i) =>
                  i === aiIndex ? { ...line, text: String(evt.data.text) } : line,
                ),
              );
            }
            break;
          case "suggested_replies":
            setReplies(
              (evt.data.replies || []).filter((r) => typeof r === "string" && r.trim()),
            );
            break;
          case "error": {
            const code = evt.data.code || "";
            streamError =
              sandboxErrorCopy(code) ||
              evt.data.reason ||
              evt.data.message ||
              "Sandbox error";
            break;
          }
        }
      }

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) {
            let name = "";
            let data = "";
            for (const line of frame.split("\n")) {
              if (line.startsWith("event:")) name = line.slice(6).trim();
              else if (line.startsWith("data:")) data += line.slice(5).trim();
            }
            if (!name) continue;
            try {
              onEvent({ event: name, data: data ? JSON.parse(data) : {} } as BrainEvent);
            } catch {
              // ignore malformed frames
            }
          }
        }
      } catch {
        streamError = streamError || ERROR_COPY.stream_failed;
      } finally {
        if (streamError) {
          setError(streamError);
          if (!answered) {
            setLines((l) => l.slice(0, -2));
          }
        } else if (!answered) {
          setLines((l) =>
            l.filter((line, i) => !(i === aiIndex && line.who === "ai" && !line.text)),
          );
        } else {
          setHasReplied(true);
        }
        setBusy(false);
      }
    },
    [agentId, conversationId],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await send(text);
  }

  const activeAgent = agents.find((a) => a.id === agentId);
  const agentName = activeAgent?.agent_name || "Frosty Agent";
  const kbWeak = readySources === 0;

  return (
    <div className="space-y-5">
      <div className="p-3.5 rounded-xl border border-border/80 bg-surface-container-low flex gap-3 text-xs text-on-surface-variant leading-relaxed">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>
            <span className="font-semibold text-on-surface">Draft preview</span> — this uses
            your unpublished agent config. Bookings, quotes, and calendar actions are not
            executed here (answers only).
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {readySources} of {totalSources} knowledge sources ready
            </span>
            {kbWeak && (
              <span className="text-amber-800 font-medium">
                With no ready sources, replies may refuse or stay generic — fix knowledge first
                if you need grounded answers.
              </span>
            )}
            <Link href="/knowledge" className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5">
              Knowledge
              <ExternalLink className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {hasConfirmed && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-950">Sandbox preview confirmed</p>
              <p className="text-xs text-emerald-700">
                You reviewed a draft reply. You can re-test anytime before publish.
              </p>
            </div>
          </div>
          {onCompleted && (
            <button
              type="button"
              onClick={onCompleted}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>Next: Publish agent</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {!hasConfirmed && hasReplied && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-950">Review the reply above</p>
            <p className="text-xs text-amber-800 mt-0.5">
              A reply is not automatic approval. Confirm only if tone and grounding look right for
              your business.
            </p>
          </div>
          <button
            type="button"
            onClick={confirmLooksGood}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:brightness-110 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span>Looks good — continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {agents.length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-on-surface-variant">Agent</label>
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            disabled={busy}
            className="h-9 px-3 rounded-lg border border-border bg-surface text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.agent_name || a.id}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-border/90 overflow-hidden shadow-sm flex flex-col h-[480px]">
        <div className="p-3.5 px-5 bg-surface-container-low border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-on-surface font-display">{agentName}</h4>
              <span className="text-[10px] text-amber-800 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Draft preview · not live traffic
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={resetChat}
            disabled={busy || (lines.length === 0 && !conversationId)}
            className="p-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1.5 disabled:opacity-40"
            title="Start a new sandbox conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div
          className="flex-1 p-5 overflow-y-auto space-y-4 bg-surface-container-lowest"
          ref={transcriptRef}
        >
          {lines.length === 0 && !busy && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-on-surface-variant/70">
              <Sparkles className="w-8 h-8 text-primary/40 mb-2" />
              <p className="text-sm font-semibold text-on-surface">Try a customer question</p>
              <p className="text-xs max-w-sm mt-1">
                Ask something a visitor would ask. Judge the reply yourself before confirming this
                step.
              </p>
            </div>
          )}

          {lines.map((l, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${l.who === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  l.who === "user"
                    ? "bg-surface-container text-on-surface"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {l.who === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div
                className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                  l.who === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-surface border border-border/80 text-on-surface rounded-tl-sm shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">
                  {l.text || (busy && i === lines.length - 1 ? "…" : "")}
                </p>
              </div>
            </div>
          ))}

          {busy && lines[lines.length - 1]?.who === "user" && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-3 rounded-2xl bg-surface border border-border/80 rounded-tl-sm flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>

        {replies.length > 0 && !busy && (
          <div className="px-5 py-2 bg-surface border-t border-border/60 flex flex-wrap gap-2">
            {replies.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => void send(r)}
                className="px-3 py-1 bg-surface-container-low hover:bg-primary/10 hover:text-primary border border-border/60 rounded-full text-xs text-on-surface-variant transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <div className="p-3 bg-surface border-t border-border/80">
          <form onSubmit={(e) => void onSubmit(e)} className="relative flex items-center">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={busy || !agentId}
              placeholder={
                agentId ? `Ask ${agentName} something…` : "Create an agent first…"
              }
              className="w-full h-11 px-4 pr-12 bg-surface-container-lowest border border-border rounded-xl text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim() || !agentId}
              className="absolute right-2 w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
