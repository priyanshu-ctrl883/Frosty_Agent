'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  FlaskConical, Bot, User, Send, RefreshCw, Copy, Check, Sparkles, Globe, Shield, AlertCircle, Info, MessageSquare
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { API_URL } from '@/lib/constants';
import { getToken } from '@/lib/session';
import { impersonationHeader } from '@/lib/impersonation';
import { useWorkspace } from '@/lib/workspace';
import { useToast } from '@/lib/toast';
import type { Agent, AgentVersion } from '@/lib/types';
import {
  clearSandboxSession,
  loadSandboxSession,
  saveSandboxSession,
  type SandboxLine,
} from '@/lib/sandboxSession';

type Line = SandboxLine & {
  id?: string;
  eventType?: 'refuse' | 'handoff' | 'tool' | 'capacity' | 'paced' | 'paused' | 'error' | 'default';
  timestamp?: string;
  meta?: string;
};

type BrainEvent =
  | { event: 'run.started'; data: Record<string, unknown> }
  | { event: 'token'; data: { text?: string } }
  | { event: 'message.completed'; data: { text?: string } }
  | { event: 'sandbox.session'; data: { conversation_id?: string } }
  | { event: 'suggested_replies'; data: { replies?: string[] } }
  | { event: 'handoff_requested'; data: Record<string, unknown> }
  | { event: 'capacity'; data: { message?: string; reason?: string } }
  | { event: 'paced'; data: Record<string, unknown> }
  | { event: 'paused'; data: Record<string, unknown> }
  | { event: 'refuse'; data: { reason_code?: string } }
  | { event: 'conversation_closed'; data: Record<string, unknown> }
    | { event: 'brain.trace'; data: Record<string, unknown> }
  | { event: 'error'; data: { code?: string; reason?: string } };

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English (US / Global)',
  hi: 'Hindi (हिंदी)',
  'hi-Latn': 'Hinglish (Hindi in Latin script)',
  ar: 'Arabic (العربية)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
};

const QUICK_PROMPTS = [
  'What services or products do you offer?',
  'What are your working hours?',
  'Can I schedule an appointment?',
  'How do I contact customer support?',
];

function renderInlineFormatting(str: string) {
  const parts: React.ReactNode[] = [];
  let remaining = str;
  let keyIndex = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    if (!boldMatch && !codeMatch) {
      parts.push(remaining);
      break;
    }

    const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;
    const codeIndex = codeMatch ? remaining.indexOf(codeMatch[0]) : -1;

    let useBold = false;
    if (boldIndex !== -1 && (codeIndex === -1 || boldIndex < codeIndex)) {
      useBold = true;
    }

    if (useBold && boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(
        <strong key={`b-${keyIndex++}`} className="font-semibold text-[#111827]">
          {boldMatch[1]}
        </strong>,
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(remaining.slice(0, codeMatch.index));
      }
      parts.push(
        <code
          key={`c-${keyIndex++}`}
          className="px-1.5 py-0.5 rounded bg-black/5 text-[#0396A6] font-mono text-xs"
        >
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return <>{parts}</>;
}

function FormattedMessageText({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed text-xs">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.slice(2);
          return (
            <div key={idx} className="flex items-start gap-2 ml-1">
              <span className="text-[10px] text-[#0396A6] mt-1 shrink-0">•</span>
              <span>{renderInlineFormatting(content)}</span>
            </div>
          );
        }

        const matchNum = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (matchNum) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1">
              <span className="text-xs font-semibold text-[#0396A6] mt-0.5 shrink-0">
                {matchNum[1]}.
              </span>
              <span>{renderInlineFormatting(matchNum[2] || '')}</span>
            </div>
          );
        }

        return <p key={idx}>{renderInlineFormatting(line)}</p>;
      })}
    </div>
  );
}

interface SandboxTabProps {
  agentId?: string | null;
  activeAgentId?: string | null;
  preferMode?: 'website' | 'whatsapp' | 'unified';
  channelLabel?: string;
}

export function SandboxTab({
  agentId: propAgentId,
  activeAgentId: activeAgentIdProp,
  preferMode,
  channelLabel,
}: SandboxTabProps = {}) {
  const { merchant } = useWorkspace();
  const merchantId = merchant?.id ?? null;
  const { toast, success: toastSuccess, error: toastError } = useToast();

  const resolvedInitialId = propAgentId || activeAgentIdProp || '';
  const [activeAgentId, setActiveAgentId] = useState<string>(resolvedInitialId);
  const [agentLanguages, setAgentLanguages] = useState<string[]>(['en', 'hi', 'hi-Latn']);
  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replies, setReplies] = useState<string[]>([]);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [trace, setTrace] = useState<Record<string, unknown> | null>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const freshSessionRef = useRef(false);
  const restoredRef = useRef(false);

  // If propAgentId changes, update activeAgentId
  useEffect(() => {
    if (propAgentId) {
      setActiveAgentId(propAgentId);
    }
  }, [propAgentId]);

  // Fallback: Resolve agent if activeAgentId is empty
  useEffect(() => {
    if (activeAgentId) return;
    let cancelled = false;
    apiRequest<Agent[]>('/v1/agents')
      .then((list) => {
        if (cancelled || !Array.isArray(list) || list.length === 0) return;
        const preferred =
          (preferMode && list.find((a) => a.mode === preferMode)) ||
          list.find((a) => a.is_active && (a.mode === 'website' || a.mode === 'unified')) ||
          list[0];
        if (preferred) {
          setActiveAgentId(preferred.id);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeAgentId, preferMode]);

  // Load language settings from active agent
  useEffect(() => {
    if (!activeAgentId) return;
    let cancelled = false;
    apiRequest<AgentVersion[]>(`/v1/agents/${activeAgentId}/versions`)
      .then((vers) => {
        if (cancelled || !Array.isArray(vers) || vers.length === 0) return;
        const latest = vers[0];
        const langs = (latest?.config as { guided?: { languages?: string[] } })?.guided?.languages;
        if (Array.isArray(langs) && langs.length > 0) {
          setAgentLanguages(langs);
          if (!langs.includes(selectedLang)) {
            setSelectedLang(langs[0] || 'en');
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeAgentId, selectedLang]);

  // Restore saved session from sessionStorage (scoped per agentId)
  useEffect(() => {
    if (!merchantId || !activeAgentId) return;
    const saved = loadSandboxSession(merchantId, activeAgentId);
    if (saved && saved.agentId === activeAgentId) {
      setConversationId(saved.conversationId);
      setLines(saved.lines);
      setReplies(saved.replies);
      freshSessionRef.current = !saved.conversationId;
    } else {
      setConversationId(null);
      setLines([]);
      setReplies([]);
      freshSessionRef.current = true;
    }
  }, [merchantId, activeAgentId]);

  // Persist session to sessionStorage
  useEffect(() => {
    if (!merchantId || !activeAgentId) return;
    saveSandboxSession(merchantId, {
      agentId: activeAgentId,
      conversationId,
      lines,
      replies,
    });
  }, [merchantId, activeAgentId, conversationId, lines, replies]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [lines, busy]);

  const handleClear = useCallback(() => {
    if (merchantId && activeAgentId) clearSandboxSession(merchantId, activeAgentId);
    setLines([]);
    setReplies([]);
    setConversationId(null);
    freshSessionRef.current = true;
    setError(null);
    toastSuccess('Sandbox session reset');
  }, [merchantId, activeAgentId, toastSuccess]);

  const pushLine = (
    kind: Line['who'],
    text: string,
    meta?: string,
    eventType?: Line['eventType']
  ) => {
    setLines((l) => [
      ...l,
      {
        who: kind,
        text,
        meta,
        eventType: eventType || 'default',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const resolveTargetAgentId = async (): Promise<string | null> => {
    if (activeAgentId) return activeAgentId;
    if (propAgentId) {
      setActiveAgentId(propAgentId);
      return propAgentId;
    }
    try {
      const list = await apiRequest<Agent[]>('/v1/agents');
      if (Array.isArray(list) && list.length > 0) {
        const preferred =
          list.find((a) => a.is_active && (a.mode === 'website' || a.mode === 'unified')) ||
          list.find((a) => a.mode === 'website' || a.mode === 'unified') ||
          list[0];
        if (preferred) {
          setActiveAgentId(preferred.id);
          return preferred.id;
        }
      }
    } catch (err) {
      console.error('Failed to resolve agent for sandbox:', err);
    }
    return null;
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || draft).trim();
    if (!text || busy) return;

    const agentIdToUse = await resolveTargetAgentId();
    if (!agentIdToUse) {
      setError('No Agent found. Please configure your Agent in Settings first.');
      return;
    }

    setDraft('');
    setError(null);
    setReplies([]);
    setTrace(null);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLines((l) => [
      ...l,
      { who: 'user', text, timestamp: now },
      { who: 'ai', text: '', timestamp: now },
    ]);
    setBusy(true);

    const isFresh = freshSessionRef.current;
    if (isFresh) {
      freshSessionRef.current = false;
    }

    const token = await getToken();
    let res: Response;

    try {
      res = await fetch(`${API_URL}/v1/agents/${agentIdToUse}/sandbox/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...impersonationHeader(),
        },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId ?? undefined,
          fresh: isFresh,
        }),
      });
    } catch (err: any) {
      console.error('Sandbox API connection error:', err);
      setError(`Cannot reach the API at ${API_URL}.`);
      setBusy(false);
      return;
    }

    if (!res.ok || !res.body) {
      let message = `The sandbox request failed (${res.status}).`;
      try {
        const body = (await res.json()) as { error?: { message?: string } };
        if (body.error?.message) message = body.error.message;
      } catch {}
      setError(message);
      setBusy(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const onEvent = (evt: BrainEvent) => {
      switch (evt.event) {
        case 'sandbox.session':
          if (evt.data.conversation_id) setConversationId(evt.data.conversation_id);
          break;
        case 'token':
          if (evt.data.text) {
            setLines((l) => {
              const targetIdx = l.map((line) => line.who).lastIndexOf('ai');
              if (targetIdx === -1) {
                return [...l, { who: 'ai', text: evt.data.text!, timestamp: now }];
              }
              return l.map((line, i) =>
                i === targetIdx ? { ...line, text: line.text + evt.data.text! } : line,
              );
            });
          }
          break;
        case 'message.completed':
          if (evt.data.text) {
            setLines((l) => {
              const targetIdx = l.map((line) => line.who).lastIndexOf('ai');
              if (targetIdx === -1) {
                return [...l, { who: 'ai', text: evt.data.text!, timestamp: now }];
              }
              return l.map((line, i) => (i === targetIdx ? { ...line, text: evt.data.text! } : line));
            });
          }
          break;
        case 'suggested_replies':
          setReplies((evt.data.replies || []).filter((r) => typeof r === 'string' && r.trim()));
          break;
        case 'handoff_requested':
          pushLine(
            'system',
            'Human Handoff Triggered: The agent requested an escalation. In production, this queues in your inbox.',
            undefined,
            'handoff',
          );
          break;
        case 'capacity':
          pushLine(
            'system',
            evt.data.message
              ? String(evt.data.message)
              : `Capacity limit reached (${String(evt.data.reason || 'unknown')}). Click Reset to restart session.`,
            undefined,
            'capacity',
          );
          break;
        case 'paced':
          pushLine(
            'system',
            'Turn Cap Reached: The agent has reached the maximum configured turns for a single session.',
            undefined,
            'paced',
          );
          break;
        case 'paused':
          pushLine('system', 'The agent is currently paused for this conversation session.', undefined, 'paused');
          break;
        case 'refuse': {
          const reason = typeof evt.data.reason_code === 'string' ? evt.data.reason_code : 'refused';
          const copy =
            reason === 'ungrounded_defer'
              ? 'Grounding Gate: nothing in the index matched this question closely enough (Knowledge can still show crawl COMPLETED). The refuse copy should appear in the bubble.'
              : reason === 'off_topic_defer'
                ? 'The brain labelled this off-topic and will not answer as a business FAQ.'
                : `The turn was refused (${reason}).`;
          pushLine('system', copy, undefined, 'refuse');
          break;
        }
        case 'conversation_closed':
          pushLine('system', 'The conversation session has ended.', undefined, 'default');
          break;
        case 'brain.trace':
          setTrace(evt.data || {});
          break;
        case 'error':
          pushLine(
            'system',
            `The turn ended with ${evt.data.code || 'an error'}${evt.data.reason ? `: ${evt.data.reason}` : ''}.`,
            undefined,
            'error',
          );
          break;
        default:
          break;
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';
        for (const frame of frames) {
          let name = '';
          let data = '';
          for (const line of frame.split('\n')) {
            if (line.startsWith('event:')) name = line.slice(6).trim();
            else if (line.startsWith('data:')) data += line.slice(5).trim();
          }
          if (!name) continue;
          try {
            onEvent({ event: name, data: data ? JSON.parse(data) : {} } as BrainEvent);
          } catch {}
        }
      }
    } catch (err: any) {
      console.error('Streaming connection error:', err);
      pushLine('system', 'The streaming connection stopped early.', undefined, 'error');
    } finally {
      setLines((l) => {
        const targetIdx = l.map((line) => line.who).lastIndexOf('ai');
        if (targetIdx === -1) return l;
        const last = l[targetIdx];
        if (!last || (last.text || '').trim()) return l;
        return l.map((line, i) =>
          i === targetIdx
            ? { ...line, text: '(No streamed reply — the turn ended without tokens.)' }
            : line,
        );
      });
      setBusy(false);
    }
  };

  const copyTranscript = () => {
    if (lines.length === 0) return;
    const text = lines
      .map((l) => `[${l.who.toUpperCase()}]: ${l.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
    toastSuccess('Transcript copied to clipboard');
  };

  const copyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-xs flex flex-col h-full flex-1 min-h-0 overflow-hidden animate-in fade-in duration-300">
      {/* SECTION HEADER */}
      <div className="px-6 py-4 border-b border-border bg-muted/10 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-bold shadow-2xs border border-[#0396A6]/15">
            <FlaskConical size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Sandbox</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Test this {channelLabel || 'agent'} with the same brain as live visitors. After each reply, the panel shows TTFT, retrieval, critic, and tools.
            </p>
          </div>
        </div>

        {/* HEADER CONTROLS */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-border rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Globe size={13} className="text-muted-foreground" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="text-xs font-semibold text-foreground bg-transparent outline-none cursor-pointer"
            >
              {agentLanguages.map((code) => (
                <option key={code} value={code}>
                  {LANGUAGE_LABELS[code] || code}
                </option>
              ))}
            </select>
          </div>

          {/* Copy Transcript */}
          <button
            onClick={copyTranscript}
            disabled={lines.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-foreground bg-white hover:bg-muted/50 border border-border rounded-xl transition-colors disabled:opacity-40 shadow-2xs"
            title="Copy Conversation Transcript"
          >
            {copiedTranscript ? <Check size={13} className="text-[#0396A6]" /> : <Copy size={13} className="text-muted-foreground" />}
            <span className="hidden sm:inline">Transcript</span>
          </button>

          {/* Reset / New Session */}
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-foreground bg-white hover:bg-muted/50 border border-border rounded-xl transition-colors shadow-2xs"
            title="Clear and Start Fresh Session"
          >
            <RefreshCw size={13} className="text-muted-foreground" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* WORKSPACE BODY: 2-COLUMN LAYOUT */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-background/50">
        {/* LEFT COLUMN: Test Prompts & Info */}
        <div className="lg:col-span-4 border-r border-border p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar bg-background shrink-0">
          {/* Environment Safety Card */}
          <div className="p-4 rounded-2xl bg-white border border-border/80 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0396A6]">
              <Shield size={15} />
              <span>Safe Testing Environment</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sandbox runs against your latest draft prompts and knowledge base without affecting live website visitors.
            </p>
          </div>

          {/* Quick Test Questions */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-foreground tracking-tight flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#0396A6]" />
              Quick Test Prompts
            </label>
            <div className="flex flex-col gap-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  disabled={busy}
                  className="text-left px-3.5 py-2.5 rounded-xl border border-border/70 bg-white hover:bg-[#0396A6]/5 hover:border-[#0396A6]/30 text-xs font-medium text-foreground transition-all flex items-center justify-between group disabled:opacity-50 shadow-2xs"
                >
                  <span className="truncate pr-2">{prompt}</span>
                  <Send size={12} className="text-muted-foreground/50 group-hover:text-[#0396A6] transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {trace ? (
            <div className="p-4 rounded-2xl bg-white border border-border/80 shadow-2xs space-y-2 text-[11px]">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Info size={14} className="text-[#0396A6]" />
                This turn
              </div>
              <p>
                TTFT: <strong>{trace.ttft_ms != null ? `${String(trace.ttft_ms)} ms` : '—'}</strong>
                {trace.retrieve_ms != null ? ` · retrieve ${String(trace.retrieve_ms)} ms` : ''}
              </p>
              <p>
                RAG: {trace.retrieval_hit ? 'hit' : 'miss'}
                {trace.reranked ? ' · reranked' : ''}
                {trace.cached_tokens ? ` · cache ${String(trace.cached_tokens)} tok` : ''}
              </p>
              <p>
                Critic: {String(trace.critic || '—')}
                {trace.overlap != null ? ` · overlap ${Number(trace.overlap).toFixed(2)}` : ''}
              </p>
              {trace.tool ? <p>Tool armed: {String(trace.tool)}</p> : <p>No side-effect tool this turn.</p>}
              {Array.isArray(trace.chunks) && trace.chunks.length > 0 ? (
                <ul className="space-y-1 text-muted-foreground">
                  {(trace.chunks as { score?: number; preview?: string }[]).map((c, i) => (
                    <li key={i} className="truncate">
                      {c.score} · {c.preview}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  No chunks on this turn — either retrieval skipped (chitchat) or cosine stayed
                  below tau. A COMPLETED crawl in Knowledge is not the same as a hit.
                </p>
              )}
            </div>
          ) : null}

          {/* Session Details */}
          {conversationId && (
            <div className="mt-auto pt-3 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Session ID:</span>
              <span className="font-mono font-bold text-foreground truncate max-w-[150px]" title={conversationId}>
                #{conversationId.slice(0, 8)}
              </span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Chat Studio Preview */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0 bg-white overflow-hidden">
          {/* Chat Messages Container */}
          <div 
            ref={transcriptRef}
            className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar bg-[#F7F5F1]"
          >
            {lines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground my-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center mb-3 shadow-2xs border border-[#0396A6]/20">
                  <Bot size={26} />
                </div>
                <h3 className="text-sm font-bold text-foreground">Sandbox Live Preview</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Type a message below or click a quick test prompt to simulate a real conversation with your Agent.
                </p>
              </div>
            ) : (
              lines
                .filter((line) => line.who === 'system' || line.who === 'user' || (line.who === 'ai' && line.text.trim().length > 0))
                .map((line, idx) => {
                  const isUser = line.who === 'user';
                  const isSystem = line.who === 'system';

                  if (isSystem) {
                    return (
                      <div key={idx} className="flex justify-center my-2">
                        <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-amber-700 flex items-center gap-1.5">
                          <Info size={13} />
                          <span>{line.text}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
                          isUser ? 'bg-zinc-800 text-white' : 'bg-[#0396A6] text-white'
                        }`}
                      >
                        {isUser ? <User size={14} /> : <Bot size={15} />}
                      </div>

                      {/* Bubble */}
                      <div className="group relative max-w-[80%] sm:max-w-[70%]">
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isUser
                              ? 'bg-zinc-900 text-white rounded-tr-none'
                              : 'bg-white border border-border text-foreground shadow-2xs rounded-tl-none'
                          }`}
                        >
                          {isUser ? (
                            <p className="whitespace-pre-wrap">{line.text}</p>
                          ) : (
                            <FormattedMessageText text={line.text} />
                          )}
                        </div>

                        {/* Timestamp & Copy Action */}
                        <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                          {line.timestamp && (
                            <span className="text-[10px] text-muted-foreground font-medium">{line.timestamp}</span>
                          )}
                          <button
                            onClick={() => copyMessage(line.text, idx)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-foreground"
                            title="Copy Message"
                          >
                            {copiedIdx === idx ? <Check size={11} className="text-[#0396A6]" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}

            {/* Busy / Typing Indicator (shown when waiting for AI tokens to begin) */}
            {busy &&
              (lines.length === 0 ||
                (lines[lines.length - 1]?.who === 'ai' && !(lines[lines.length - 1]?.text || '').trim())) && (
              <div className="flex items-start gap-3 animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-full bg-[#0396A6] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  <Bot size={15} />
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-border text-foreground shadow-2xs rounded-tl-none flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#0396A6] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#0396A6] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#0396A6] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Suggested Replies */}
            {replies.length > 0 && !busy && (
              <div className="flex items-center gap-2 flex-wrap pt-2">
                <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <Sparkles size={12} className="text-[#0396A6]" /> Suggestions:
                </span>
                {replies.map((rep, rIdx) => (
                  <button
                    key={rIdx}
                    onClick={() => handleSend(rep)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-white hover:bg-[#0396A6]/10 border border-[#0396A6]/30 text-[#0396A6] font-semibold transition-all shadow-2xs"
                  >
                    {rep}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sticky Input Bar at Bottom */}
          <div className="p-3.5 sm:p-4 border-t border-border bg-white shrink-0">
            {error && (
              <div className="mb-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="text-rose-600 font-bold hover:underline">Dismiss</button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              className="flex items-center gap-2 bg-muted/20 border border-border focus-within:border-[#0396A6] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0396A6]/10 rounded-full p-1.5 pl-4 transition-all"
            >
              <input
                type="text"
                placeholder="Ask your agent anything in Sandbox..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={busy}
                style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                className="flex-1 bg-transparent py-1 text-xs text-foreground border-none outline-none focus:outline-none focus:ring-0 focus:border-none ring-0 placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!draft.trim() || busy}
                className="w-8 h-8 flex items-center justify-center bg-[#0396A6] hover:bg-[#0396A6]/90 disabled:opacity-40 text-white rounded-full transition-all shrink-0 shadow-xs"
                title="Send test message"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
