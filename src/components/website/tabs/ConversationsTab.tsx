import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, RefreshCw, X, Smartphone, Globe, User as UserIcon, Check, Send, Bot, Loader2, ArrowLeft,
  MoreVertical, CheckCheck, MessageSquare, Filter, Calendar, Clock, RotateCcw,
  SlidersHorizontal, ChevronRight, ChevronLeft, Copy
} from 'lucide-react';
import { useToast } from "@/lib/toast";
import { isInboxChangeEvent, subscribeInboxRealtime } from "@/lib/inboxRealtime";
import { parseApiDate } from "@/lib/format";
import {
  formatActivityTime,
  formatContactLabel,
  getConversationSummary,
  listSessionRowsWithCursor,
  getConversationDetail,
  loadTranscriptPage,
  sendHumanReply,
  summarizeConversation,
  handoffToAI,
  handoffToHuman,
  sendPresenceHeartbeat,
  LegacyMessageRow,
  LegacySessionRow,
} from '@/lib/conversations';
import { AiHumanModeToggle } from '@/components/conversations/AiHumanModeToggle';

const THREAD_PAGE = 80;
const PRESENCE_HEARTBEAT_MS = 30_000;
const isPersistedMessageId = (id?: number) =>
  typeof id === 'number' && Number.isFinite(id) && id > 0 && id < 1_000_000_000_000;

const dedupeMessages = (rows: LegacyMessageRow[]) => {
  const seen = new Set<string>();
  return rows.filter((m) => {
    const key = String(m.message_id ?? m.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

function getInitials(label?: string | null): string {
  if (!label) return "V";
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "V";
  if (parts.length === 1 && parts[0]) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0]?.[0] || "";
  const last = parts[parts.length - 1]?.[0] || "";
  return (first + last).toUpperCase() || "V";
}

function formatDateIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return iso;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso || "";
  }
}

function calculateDaysBetween(fromIso?: string, toIso?: string): number {
  if (!fromIso || !toIso) return 1;
  try {
    const d1 = new Date(fromIso + "T00:00:00");
    const d2 = new Date(toIso + "T00:00:00");
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  } catch {
    return 1;
  }
}

import type { HubChannelFilter } from '@/components/shell/TopbarHubAgentPicker';

interface ConversationsTabProps {
  /** @deprecated Hub dashboards share AppShell's inbox socket; ticks are ignored. */
  wsTick?: number;
  initialConversationId?: string | null;
  channel?: 'website' | 'whatsapp' | 'unified';
  agentId?: string | null;
  /** When viewing all agents from the topbar, filter by channel */
  hubChannelFilter?: HubChannelFilter;
  onActiveChatChange?: (active: boolean) => void;
}

export function ConversationsTab({
  initialConversationId,
  channel = 'website',
  agentId,
  hubChannelFilter = 'all',
  onActiveChatChange,
}: ConversationsTabProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const searchParams = useSearchParams();
  const urlConvoId = searchParams?.get('c') || searchParams?.get('session_id') || searchParams?.get('conversation_id');

  const [sessions, setSessions] = useState<LegacySessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsCursor, setSessionsCursor] = useState<string | null>(null);
  const [convos, setConvos] = useState<LegacyMessageRow[]>([]);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [channelSubFilter, setChannelSubFilter] = useState<'all' | 'website' | 'whatsapp'>('all');

  /* ── Filter Popover State & Date Filter ── */
  const [filterOpen, setFilterOpen] = useState(false);
  const [modeFilter, setModeFilter] = useState<'all' | 'ai' | 'human'>('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'this_month' | 'custom'>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'website' | 'whatsapp'>('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const todayIso = useMemo(() => formatDateIso(new Date()), []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [filterOpen]);

  // Inbox claim requires an online presence heartbeat (same as /inbox page).
  useEffect(() => {
    const beat = async () => {
      try {
        await sendPresenceHeartbeat(true);
      } catch {
        /* quiet */
      }
    };
    void beat();
    const id = window.setInterval(beat, PRESENCE_HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, []);

  const applyDatePreset = (preset: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'this_month' | 'custom') => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'all') {
      setFromDate('');
      setToDate('');
    } else if (preset === 'today') {
      const iso = formatDateIso(now);
      setFromDate(iso);
      setToDate(iso);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(now.getDate() - 1);
      const iso = formatDateIso(y);
      setFromDate(iso);
      setToDate(iso);
    } else if (preset === 'week') {
      const start = new Date();
      start.setDate(now.getDate() - 6);
      setFromDate(formatDateIso(start));
      setToDate(formatDateIso(now));
    } else if (preset === 'month') {
      const start = new Date();
      start.setDate(now.getDate() - 29);
      setFromDate(formatDateIso(start));
      setToDate(formatDateIso(now));
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(formatDateIso(firstDay));
      setToDate(formatDateIso(now));
    }
  };

  const handleClearDates = () => {
    setDatePreset('all');
    setFromDate('');
    setToDate('');
  };

  const handleClearAllFilters = () => {
    setModeFilter('all');
    setDatePreset('all');
    setFromDate('');
    setToDate('');
    setChannelFilter('all');
    setConvSearch('');
  };

  const isDateFilterActive = datePreset !== 'all' || Boolean(fromDate) || Boolean(toDate);

  const activeDateLabel = useMemo(() => {
    if (!isDateFilterActive) return null;
    if (datePreset === 'today') return 'Today';
    if (datePreset === 'yesterday') return 'Yesterday';
    if (datePreset === 'week') return 'Past 7 Days';
    if (datePreset === 'month') return 'Past 30 Days';
    if (datePreset === 'this_month') return 'This Month';
    if (fromDate && toDate) {
      if (fromDate === toDate) return formatDisplayDate(fromDate);
      return `${formatDisplayDate(fromDate)} – ${formatDisplayDate(toDate)}`;
    }
    if (fromDate) return `From ${formatDisplayDate(fromDate)}`;
    if (toDate) return `Until ${formatDisplayDate(toDate)}`;
    return 'Custom Range';
  }, [isDateFilterActive, datePreset, fromDate, toDate]);

  const activeFilterCount = (modeFilter !== 'all' ? 1 : 0) + (isDateFilterActive ? 1 : 0) + (channelFilter !== 'all' ? 1 : 0);

  const customRangeDurationDays = useMemo(() => {
    if (!fromDate && !toDate) return null;
    return calculateDaysBetween(fromDate || todayIso, toDate || todayIso);
  }, [fromDate, toDate, todayIso]);
  
  const [activeContactId, setActiveContactId] = useState<string | null>(initialConversationId || urlConvoId || null);
  const activeContactIdRef = useRef<string | null>(initialConversationId || urlConvoId || null);
  useEffect(() => { 
    activeContactIdRef.current = activeContactId; 
    onActiveChatChange?.(Boolean(activeContactId));
  }, [activeContactId, onActiveChatChange]);

  useEffect(() => {
    if (urlConvoId && urlConvoId !== activeContactId) {
      setActiveContactId(urlConvoId);
    }
  }, [urlConvoId, activeContactId]);

  const convosRef = useRef<LegacyMessageRow[]>([]);
  useEffect(() => { convosRef.current = convos; }, [convos]);
  
  const sessionsRef = useRef<LegacySessionRow[]>([]);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);

  const [messagesLoading, setMessagesLoading] = useState(false);
  const [convSearch, setConvSearch] = useState('');
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeContactPhone, setActiveContactPhone] = useState<string | null>(null);

  useEffect(() => {
    if (!activeContactId) {
      setActiveContactPhone(null);
      return;
    }
    const session = sessionsRef.current.find((s) => s.session_id === activeContactId);
    const sChan = session?.channel === 'whatsapp' || session?._channel === 'whatsapp' || channel === 'whatsapp' ? 'whatsapp' : 'website';
    if (sChan === 'whatsapp') {
      getConversationDetail(activeContactId)
        .then(detail => {
          const phone = detail.bridge?.user_phone || detail.contact?.primary_phone || detail.wa_account?.phone_number;
          setActiveContactPhone(phone || null);
        })
        .catch(err => {
          console.error("Failed to fetch conversation details for phone number", err);
          setActiveContactPhone(null);
        });
    } else {
      setActiveContactPhone(null);
    }
  }, [activeContactId, channel]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stickToBottomRef = useRef(true);

  const sessionMode = (sessionId: string) => {
    const session = sessionsRef.current.find((s) => s.session_id === sessionId);
    return session?.bot_paused || session?.mode === 'human' ? 'human' : 'ai';
  };

  const resolveListChannel = useCallback((): "website" | "whatsapp" | undefined => {
    if (channel === "unified") return undefined;
    if (!agentId && hubChannelFilter !== "all") {
      return hubChannelFilter;
    }
    if (!agentId && hubChannelFilter === "all") {
      return undefined;
    }
    return channel === "whatsapp" ? "whatsapp" : "website";
  }, [agentId, channel, hubChannelFilter]);

  const fetchSessions = useCallback(async (isInitial = false) => {
    if (isInitial) setSessionsLoading(true);
    try {
      const data = await listSessionRowsWithCursor({
        channel: resolveListChannel(),
        agent_id: agentId || undefined,
        limit: 50,
      });
      setSessions(data.rows);
      setSessionsCursor(data.nextCursor);
      
      if (data.rows.length > 0 && !activeContactIdRef.current) {
        const preferred = initialConversationId || urlConvoId;
        if (preferred && data.rows.some((r) => r.session_id === preferred)) {
          setActiveContactId(preferred);
        }
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    } finally {
      if (isInitial) setSessionsLoading(false);
    }
  }, [initialConversationId, urlConvoId, agentId, resolveListChannel]);

  const loadMoreSessions = async () => {
    if (!sessionsCursor) return;
    try {
      const data = await listSessionRowsWithCursor({
        channel: resolveListChannel(),
        agent_id: agentId || undefined,
        cursor: sessionsCursor,
      });
      setSessions((prev) => {
        const existingIds = new Set(prev.map((s) => s.session_id));
        return [...prev, ...data.rows.filter((s) => !existingIds.has(s.session_id))];
      });
      setSessionsCursor(data.nextCursor);
    } catch (e) {
      console.error("Failed to load more conversations", e);
    }
  };

  const loadMessages = useCallback(async (conversationId: string, kind: 'latest' | 'newer' = 'latest') => {
    const mode = sessionMode(conversationId);
    if (kind === 'latest') setMessagesLoading(true);
    try {
      let afterId: number | undefined;
      if (kind === 'newer') {
        const existing = convosRef.current.filter((c) => c.session_id === conversationId);
        const last = [...existing].reverse().find((m) => isPersistedMessageId(m.message_id));
        if (!last?.message_id) return;
        afterId = last.message_id;
      }

      const page = await loadTranscriptPage(conversationId, mode, {
        limit: THREAD_PAGE,
        newest: kind === 'latest',
        afterId,
      });
      if (kind === 'newer' && page.rows.length === 0) return;

      setConvos((prev) => {
        const others = prev.filter((c) => c.session_id !== conversationId);
        const base = kind === 'latest' ? [] : prev.filter((c) => c.session_id === conversationId);
        return [...others, ...dedupeMessages([...base, ...page.rows])];
      });
      if (kind === 'latest') setHasOlderMessages(Boolean(page.prevCursor));

      if (page.rows.length > 0) {
        const last = page.rows[page.rows.length - 1]!;
        setSessions((prev) =>
          prev.map((s) =>
            s.session_id === conversationId
              ? { ...s, content: last.content, created_at: last.created_at }
              : s,
          ),
        );
      }
    } catch (e) { 
      console.error("Failed to load messages", e); 
    } finally { 
      if (kind === 'latest') setMessagesLoading(false); 
    }
  }, []);

  const loadOlderMessages = async () => {
    if (!activeContactId || !hasOlderMessages || loadingOlder) return;
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    const prevTop = el?.scrollTop ?? 0;
    setLoadingOlder(true);
    try {
      const existing = convosRef.current.filter((c) => c.session_id === activeContactId);
      const first = existing.find((m) => isPersistedMessageId(m.message_id));
      if (!first?.message_id) return;
      const page = await loadTranscriptPage(activeContactId, sessionMode(activeContactId), {
        limit: THREAD_PAGE,
        beforeId: first.message_id,
      });
      setHasOlderMessages(Boolean(page.prevCursor));
      setConvos((prev) => {
        const others = prev.filter((c) => c.session_id !== activeContactId);
        const current = prev.filter((c) => c.session_id === activeContactId);
        return [...others, ...dedupeMessages([...page.rows, ...current])];
      });
      requestAnimationFrame(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight + prevTop;
      });
    } catch (e) {
      console.error("Failed to load older messages", e);
    } finally {
      setLoadingOlder(false);
    }
  };

  const loadSummary = useCallback(async (conversationId: string) => {
    try {
      const row = await getConversationSummary(conversationId);
      if (row.summary) {
        setSummaries((prev) => ({ ...prev, [conversationId]: row.summary as string }));
      }
    } catch { }
  }, []);

  useEffect(() => {
    void fetchSessions(true);
    let t: number | null = null;
    const unsub = subscribeInboxRealtime({
      onEvent: (evt) => {
        if (!isInboxChangeEvent(evt)) return;
        if (t !== null) window.clearTimeout(t);
        t = window.setTimeout(() => {
          t = null;
          void fetchSessions();
          const id = evt.conversation_id;
          if (id && id === activeContactIdRef.current) {
            void loadMessages(id, 'newer');
          }
        }, 400);
      },
    });
    return () => {
      if (t !== null) window.clearTimeout(t);
      unsub();
    };
  }, [fetchSessions, loadMessages]);

  useEffect(() => {
    if (!activeContactId) return;
    stickToBottomRef.current = true;
    void loadMessages(activeContactId, 'latest');
    void loadSummary(activeContactId);
    inputRef.current?.focus();
  }, [activeContactId, loadMessages, loadSummary]);

  useEffect(() => {
    if (initialConversationId && initialConversationId !== activeContactIdRef.current) {
      setActiveContactId(initialConversationId);
    }
  }, [initialConversationId]);

  useEffect(() => {
    if (!stickToBottomRef.current || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [convos, activeContactId, messagesLoading]);

  const handleSwitchToAI = async (sessionId: string) => {
    if (handoffLoading) return;
    const session = sessionsRef.current.find((s) => s.session_id === sessionId);
    const isManual = Boolean(session?.bot_paused || session?.mode === 'human');
    if (!isManual) return; // already in AI mode

    setHandoffLoading(true);
    // Optimistic UI update
    setSessions((prev) =>
      prev.map((s) =>
        s.session_id === sessionId ? { ...s, bot_paused: false, mode: 'ai' } : s,
      ),
    );

    try {
      await handoffToAI(sessionId);
      toastSuccess('Conversation handed back to AI.');
      await loadMessages(sessionId, 'latest');
    } catch (e: any) {
      // Revert on failure
      setSessions((prev) =>
        prev.map((s) =>
          s.session_id === sessionId ? { ...s, bot_paused: true, mode: 'human' } : s,
        ),
      );
      toastError(e?.message || 'Unable to switch handoff mode. Please try again.');
    } finally {
      setHandoffLoading(false);
    }
  };

  const handleSwitchToManual = async (sessionId: string) => {
    if (handoffLoading) return;
    const session = sessionsRef.current.find((s) => s.session_id === sessionId);
    const isManual = Boolean(session?.bot_paused || session?.mode === 'human');
    if (isManual) return; // already in manual mode

    setHandoffLoading(true);
    // Optimistic UI update
    setSessions((prev) =>
      prev.map((s) =>
        s.session_id === sessionId ? { ...s, bot_paused: true, mode: 'human' } : s,
      ),
    );

    try {
      const out = await handoffToHuman(sessionId);
      if (!out.claimed) {
        throw new Error('Someone else claimed this conversation first.');
      }
      toastSuccess(
        session?.status === 'closed'
          ? 'Conversation reopened and handed off to you.'
          : 'Conversation handed off to a human agent.',
      );
      setSessions((prev) =>
        prev.map((s) =>
          s.session_id === sessionId
            ? { ...s, bot_paused: true, mode: 'human', status: 'open' }
            : s,
        ),
      );
      await loadMessages(sessionId, 'latest');
    } catch (e: any) {
      // Revert on failure
      setSessions((prev) =>
        prev.map((s) =>
          s.session_id === sessionId ? { ...s, bot_paused: false, mode: 'ai' } : s,
        ),
      );
      toastError(e?.message || 'Unable to switch handoff mode. Please try again.');
    } finally {
      setHandoffLoading(false);
    }
  };

  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContactId || !inputText.trim()) return;
    const txt = inputText.trim();
    setInputText('');

    // Derive mode from session state
    const session = sessionsRef.current.find((s) => s.session_id === activeContactId);
    const mode = session?.bot_paused || session?.mode === 'human' ? 'human' : 'ai';

    // Optimistic UI update
    const optimisticId = `optimistic-${crypto.randomUUID()}`;
    const optimisticMsg: LegacyMessageRow = {
      id: optimisticId,
      session_id: activeContactId,
      role: 'assistant',
      sender_type: 'agent',
      content: txt,
      created_at: new Date().toISOString(),
    };
    stickToBottomRef.current = true;
    setConvos((prev) => [...prev, optimisticMsg]);

    try {
      await sendHumanReply(activeContactId, txt, mode);
      // If conversation was AI-mode, sending a human reply automatically claims it (switches to human mode)
      if (mode !== 'human') {
        setSessions((prev) =>
          prev.map((s) =>
            s.session_id === activeContactId ? { ...s, bot_paused: true, mode: 'human' } : s,
          ),
        );
      }
      await loadMessages(activeContactId, 'newer');
      await fetchSessions();
    } catch (e: any) {
      toastError('Failed to send message: ' + e.message);
      // Remove optimistic message on failure
      setConvos((prev) => prev.filter((m) => m.id !== optimisticId));
      setInputText(txt);
    }
  };

  const handleSummarize = async (conversationId: string) => {
    try {
      setSummaries(prev => ({...prev, [conversationId]: 'LOADING'}));
      const result = await summarizeConversation(conversationId);
      setSummaries(prev => ({...prev, [conversationId]: result.summary ?? ''}));
    } catch (e: any) {
      setSummaries(prev => {
        const next = {...prev};
        delete next[conversationId];
        return next;
      });
      toastError("Failed to summarize: " + e.message);
    }
  };

  /* ── Filtered Conversations List ── */
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // 1. Handling Mode filter (AI vs Human)
      const isManual = Boolean(s.bot_paused || s.mode === 'human');
      if (modeFilter === 'ai' && isManual) return false;
      if (modeFilter === 'human' && !isManual) return false;

      // 2. Channel sub-filter
      const sChannel = s.channel || s._channel || 'website';
      if (channelFilter !== 'all' && sChannel !== channelFilter) return false;
      if (channel === 'unified' && channelSubFilter !== 'all' && sChannel !== channelSubFilter) return false;

      // 3. Date filter
      if (isDateFilterActive && s.created_at) {
        const sDate = parseApiDate(s.created_at);
        if (sDate) {
          const now = new Date();
          const sDateIso = formatDateIso(sDate);
          const todayIsoStr = formatDateIso(now);

          if (datePreset === 'today') {
            if (sDateIso !== todayIsoStr) return false;
          } else if (datePreset === 'yesterday') {
            const y = new Date();
            y.setDate(now.getDate() - 1);
            if (sDateIso !== formatDateIso(y)) return false;
          } else if (datePreset === 'week') {
            const diff = now.getTime() - sDate.getTime();
            if (diff < 0 || diff > 7 * 24 * 60 * 60 * 1000) return false;
          } else if (datePreset === 'month') {
            const diff = now.getTime() - sDate.getTime();
            if (diff < 0 || diff > 30 * 24 * 60 * 60 * 1000) return false;
          } else if (datePreset === 'this_month') {
            if (sDate.getFullYear() !== now.getFullYear() || sDate.getMonth() !== now.getMonth()) return false;
          } else if (datePreset === 'custom' || fromDate || toDate) {
            if (fromDate) {
              const f = new Date(fromDate + 'T00:00:00');
              if (sDate < f) return false;
            }
            if (toDate) {
              const t = new Date(toDate + 'T23:59:59.999');
              if (sDate > t) return false;
            }
          }
        }
      }

      // 4. Search query
      if (!convSearch) return true;
      const q = convSearch.toLowerCase().trim();
      return (
        s.session_id.toLowerCase().includes(q) ||
        (s.contact_label || '').toLowerCase().includes(q) ||
        (s.content || '').toLowerCase().includes(q)
      );
    });
  }, [sessions, modeFilter, channelFilter, channel, channelSubFilter, isDateFilterActive, datePreset, fromDate, toDate, convSearch]);

  return (
    <div className="overflow-hidden sm:rounded-tl-[20px] sm:rounded-tr-[20px] sm:rounded-b-[20px] sm:border border-border h-full flex-1 min-h-0 flex bg-white dark:bg-zinc-950 shadow-sm relative z-10 animate-in fade-in duration-300">
      {/* Sidebar: Conversation List */}
      <div className={`flex flex-col border-r border-border shrink-0 z-20 h-full overflow-hidden transition-all duration-200 ${isSidebarCollapsed ? 'w-[48px] hidden md:flex bg-white dark:bg-zinc-950' : `w-full md:w-[330px] lg:w-[350px] bg-white dark:bg-zinc-950 ${activeContactId ? 'hidden md:flex' : 'flex'}`}`}>
        {isSidebarCollapsed ? (
          <button 
            onClick={() => setIsSidebarCollapsed(false)} 
            className="w-full h-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Expand Sidebar"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        ) : (
          <>
            <div className="p-3.5 sm:p-4 border-b border-border bg-white dark:bg-zinc-950 space-y-3 shrink-0 relative z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-black text-xs">
                <MessageSquare size={13} />
              </div>
              <h3 className="font-extrabold text-xs text-foreground tracking-wider uppercase">Conversations</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => fetchSessions()} 
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-all cursor-pointer"
                title="Refresh conversations list"
              >
                <RefreshCw size={14} className={sessionsLoading ? "animate-spin text-[#0396A6]" : ""} />
              </button>
              <button 
                onClick={() => setIsSidebarCollapsed(true)} 
                className="hidden md:flex p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-all cursor-pointer"
                title="Collapse Sidebar"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Unified Channel Filter Pills */}
          {channel === 'unified' && (
            <div className="flex items-center p-1 bg-muted/40 rounded-xl border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setChannelSubFilter('all')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  channelSubFilter === 'all'
                    ? 'bg-white dark:bg-zinc-800 text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({sessions.length})
              </button>
              <button
                type="button"
                onClick={() => setChannelSubFilter('website')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  channelSubFilter === 'website'
                    ? 'bg-white dark:bg-zinc-800 text-[#0396A6] shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Globe size={11} />
                Web ({sessions.filter((s) => (s.channel || s._channel) === 'website').length})
              </button>
              <button
                type="button"
                onClick={() => setChannelSubFilter('whatsapp')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  channelSubFilter === 'whatsapp'
                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone size={11} />
                WA ({sessions.filter((s) => (s.channel || s._channel) === 'whatsapp').length})
              </button>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="relative flex items-center gap-1.5" ref={filterRef}>
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search name, message, ID..."
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-7 py-2 text-xs outline-none focus:border-[#0396A6] focus:ring-1 focus:ring-[#0396A6] transition-all placeholder:text-muted-foreground/70"
              />
              {convSearch && (
                <button
                  type="button"
                  onClick={() => setConvSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-full hover:bg-muted"
                  title="Clear search query"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center shrink-0 relative cursor-pointer ${
                filterOpen || activeFilterCount > 0
                  ? 'bg-[#0396A6]/10 border-[#0396A6] text-[#0396A6] shadow-xs'
                  : 'bg-background hover:bg-muted/40 border-border text-muted-foreground hover:text-foreground'
              }`}
              title="Filter conversations by mode, date range, or channel"
            >
              <Filter size={14} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0396A6] text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs animate-in zoom-in">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Dropdown Popover */}
            {filterOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 w-[300px] max-w-[calc(100vw-2rem)] p-3.5 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200/90 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150 space-y-3 backdrop-blur-md">
                {/* Popover Header */}
                <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <SlidersHorizontal size={14} className="text-[#0396A6] shrink-0" />
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">Filter</span>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllFilters}
                      className="shrink-0 text-[11px] font-bold text-[#0396A6] hover:underline cursor-pointer whitespace-nowrap"
                    >
                      Reset all
                    </button>
                  )}
                </div>

                {/* Section 1: Handling Mode */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Handling Mode
                    </span>
                    {modeFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setModeFilter('all')}
                        className="text-[10px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => setModeFilter('all')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        modeFilter === 'all'
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xs'
                          : 'bg-muted/20 border-border text-slate-600 dark:text-zinc-400 hover:bg-muted/50'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setModeFilter('ai')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        modeFilter === 'ai'
                          ? 'bg-[#0396A6] text-white border-[#0396A6] shadow-xs'
                          : 'bg-muted/20 border-border text-[#0396A6] hover:bg-[#0396A6]/10'
                      }`}
                    >
                      AI
                    </button>
                    <button
                      type="button"
                      onClick={() => setModeFilter('human')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        modeFilter === 'human'
                          ? 'bg-[#FF7A5E] text-white border-[#FF7A5E] shadow-xs'
                          : 'bg-muted/20 border-border text-[#FF7A5E] hover:bg-[#FF7A5E]/10'
                      }`}
                    >
                      Manual
                    </button>
                  </div>
                </div>

                {/* Section 2: Date Period & From/To Date Range */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      <Calendar size={11} className="text-[#0396A6]" />
                      <span>Date Filter</span>
                    </div>
                    {isDateFilterActive && (
                      <button
                        type="button"
                        onClick={handleClearDates}
                        className="text-[10px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Clear Date
                      </button>
                    )}
                  </div>

                  {/* Quick Presets Grid */}
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { key: 'all', label: 'All Time' },
                      { key: 'today', label: 'Today' },
                      { key: 'yesterday', label: 'Yesterday' },
                      { key: 'week', label: 'Past 7 Days' },
                      { key: 'month', label: 'Past 30 Days' },
                      { key: 'this_month', label: 'This Month' },
                    ].map((d) => {
                      const isSelected = datePreset === d.key;
                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => applyDatePreset(d.key as any)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-center cursor-pointer ${
                            isSelected
                              ? 'bg-[#0396A6] text-white border-[#0396A6] shadow-xs'
                              : 'bg-muted/20 border-border text-slate-600 dark:text-zinc-400 hover:bg-muted/50'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom From Date and To Date Inputs Card */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-[#0396A6] uppercase tracking-wider flex items-center gap-1">
                        <Clock size={10} />
                        Custom Date Range
                      </span>
                      {datePreset === 'custom' && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-[#0396A6]/10 text-[#0396A6] rounded">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* From Date */}
                      <div>
                        <label className="text-[9.5px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                          From Date
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={fromDate}
                            max={toDate || todayIso}
                            onChange={(e) => {
                              setFromDate(e.target.value);
                              setDatePreset('custom');
                            }}
                            className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-[11px] font-semibold text-foreground outline-none focus:border-[#0396A6] focus:ring-1 focus:ring-[#0396A6]"
                          />
                        </div>
                      </div>

                      {/* To Date */}
                      <div>
                        <label className="text-[9.5px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                          To Date
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={toDate}
                            min={fromDate}
                            max={todayIso}
                            onChange={(e) => {
                              setToDate(e.target.value);
                              setDatePreset('custom');
                            }}
                            className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-[11px] font-semibold text-foreground outline-none focus:border-[#0396A6] focus:ring-1 focus:ring-[#0396A6]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Date Duration Summary */}
                    {(fromDate || toDate) && (
                      <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-zinc-400 pt-0.5 border-t border-slate-200/60 dark:border-zinc-700/60 font-medium">
                        <span>Duration:</span>
                        <span className="font-bold text-[#0396A6]">
                          {customRangeDurationDays} {customRangeDurationDays === 1 ? 'day' : 'days'}
                          {fromDate && toDate ? ` (${formatDisplayDate(fromDate)} – ${formatDisplayDate(toDate)})` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Channel (Unified mode) */}
                {channel === 'unified' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        Channel
                      </span>
                      {channelFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setChannelFilter('all')}
                          className="text-[10px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => setChannelFilter('all')}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                          channelFilter === 'all'
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xs'
                            : 'bg-muted/20 border-border text-slate-600 dark:text-zinc-400 hover:bg-muted/50'
                        }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setChannelFilter('website')}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                          channelFilter === 'website'
                            ? 'bg-[#0396A6] text-white border-[#0396A6] shadow-xs'
                            : 'bg-muted/20 border-border text-[#0396A6] hover:bg-[#0396A6]/10'
                        }`}
                      >
                        <Globe size={12} />
                        <span>Website</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setChannelFilter('whatsapp')}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                          channelFilter === 'whatsapp'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-muted/20 border-border text-emerald-600 hover:bg-emerald-600/10'
                        }`}
                      >
                        <Smartphone size={12} />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Popover Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    {filteredSessions.length} {filteredSessions.length === 1 ? 'chat matches' : 'chats match'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="px-3.5 py-1.5 bg-[#0396A6] hover:bg-[#028391] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Check size={12} />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Filter Chips Bar */}
          {(modeFilter !== 'all' || isDateFilterActive || channelFilter !== 'all' || convSearch) && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {modeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-muted/40 border border-border text-foreground shadow-2xs">
                  Mode: <span style={{ color: modeFilter === 'ai' ? '#0396A6' : '#FF7A5E' }}>{modeFilter === 'ai' ? 'AI' : 'Manual'}</span>
                  <button type="button" onClick={() => setModeFilter('all')} className="hover:text-rose-500 ml-0.5 cursor-pointer" title="Remove mode filter"><X size={10} /></button>
                </span>
              )}
              {isDateFilterActive && activeDateLabel && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#0396A6]/10 border border-[#0396A6]/30 text-[#0396A6] shadow-2xs">
                  <Calendar size={10} />
                  <span>{activeDateLabel}</span>
                  <button type="button" onClick={handleClearDates} className="hover:text-rose-500 ml-0.5 cursor-pointer" title="Remove date filter"><X size={10} /></button>
                </span>
              )}
              {channelFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-muted/40 border border-border text-foreground shadow-2xs">
                  Channel: {channelFilter === 'whatsapp' ? 'WhatsApp' : 'Website'}
                  <button type="button" onClick={() => setChannelFilter('all')} className="hover:text-rose-500 ml-0.5 cursor-pointer" title="Remove channel filter"><X size={10} /></button>
                </span>
              )}
              {convSearch && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-muted/40 border border-border text-foreground shadow-2xs">
                  Search: "{convSearch}"
                  <button type="button" onClick={() => setConvSearch('')} className="hover:text-rose-500 ml-0.5 cursor-pointer" title="Clear search"><X size={10} /></button>
                </span>
              )}
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-[10px] font-bold text-muted-foreground hover:text-[#0396A6] ml-auto underline cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Conversation List Scroll Area */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative bg-white dark:bg-zinc-950 overscroll-contain pb-24 md:pb-0 px-2 pt-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {sessionsLoading && sessions.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-xs font-bold gap-2">
              <RefreshCw size={18} className="animate-spin text-[#0396A6]" />
              <span>Loading conversations...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3 text-muted-foreground/60 border border-border/50">
                <Smartphone size={22} />
              </div>
              <p className="text-xs font-bold text-foreground">No conversations yet</p>
              <p className="text-[10px] mt-1 max-w-[210px] leading-relaxed">
                {channel === 'unified'
                  ? "When visitors chat via your website or WhatsApp, they'll appear here."
                  : channel === 'whatsapp'
                  ? "When contacts chat via your WhatsApp Business account, they'll appear here."
                  : "When visitors chat via your website, they'll appear here."}
              </p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF8F8] dark:bg-teal-950/40 text-[#0396A6] dark:text-teal-400 flex items-center justify-center shadow-2xs border border-[#D9EDEE] dark:border-teal-900/40">
                <Filter size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">No matching conversations</p>
                <p className="text-[10px] text-muted-foreground mt-1 max-w-[210px] leading-relaxed">
                  No conversations match your selected date range or filter criteria.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="px-3.5 py-1.5 bg-[#0396A6]/10 text-[#0396A6] text-[11px] font-bold rounded-xl border border-[#0396A6]/20 hover:bg-[#0396A6]/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw size={11} />
                <span>Reset all filters</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 pb-2">
              {filteredSessions.map((s) => {
                const sChannel = s.channel === 'whatsapp' || s._channel === 'whatsapp' ? 'whatsapp' : 'website';
                const isWA = sChannel === 'whatsapp';
                const isActive = activeContactId === s.session_id;
                const isManual = Boolean(s.bot_paused || s.mode === 'human');

                return (
                  <button
                    key={s.session_id}
                    onClick={() => setActiveContactId(s.session_id)}
                    className={`w-full flex items-center gap-3 px-3.5 sm:px-4 py-3.5 transition-all duration-200 border border-slate-200 dark:border-zinc-800 rounded-xl text-left relative group cursor-pointer hover:-translate-y-[1px] hover:shadow-sm hover:z-10 overflow-hidden ${
                      isActive
                        ? isWA
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 shadow-sm z-10 border-l-4 border-l-emerald-600'
                          : 'bg-[#EAF8F8] dark:bg-teal-950/20 shadow-sm z-10 border-l-[6px] border-l-[#0396A6]'
                        : 'bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {/* Contact Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full font-bold text-[13px] flex items-center justify-center shrink-0 border transition-transform duration-150 group-hover:scale-105 ${
                        isWA
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                          : 'bg-[#EAF8F8]/60 text-[#0396A6] border-[#0396A6]/30 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/50'
                      }`}
                    >
                      {(() => {
                        const name = formatContactLabel(s.contact_label, { channel: sChannel });
                        const isGeneric = name === 'WhatsApp contact' || name === 'Visitor' || name.startsWith('#WEB-') || name.replace(/[^a-zA-Z]/g, '').length < 2;
                        return isGeneric ? <UserIcon size={18} /> : getInitials(name);
                      })()}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-extrabold text-[13px] text-foreground truncate max-w-[150px]">
                          {formatContactLabel(s.contact_label, { channel: sChannel })}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold shrink-0 uppercase tracking-wider">
                          {formatActivityTime(s.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[11.5px] font-medium text-slate-500/90 dark:text-zinc-400 truncate flex-1 leading-normal">
                          {s.content || "Started a conversation"}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          {channel === 'unified' && (
                            <span
                              className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5 border ${
                                isWA
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/40'
                                  : 'bg-[#EAF8F8] text-[#0396A6] border-[#D9EDEE] dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900/40'
                              }`}
                            >
                              {isWA ? <Smartphone size={9} /> : <Globe size={9} />}
                              {isWA ? 'WA' : 'WEB'}
                            </span>
                          )}

                          {isManual ? (
                            <span className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider">
                              Manual
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#0396A6] uppercase tracking-wider">
                              Agent
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {sessionsCursor && (
            <button
              onClick={() => void loadMoreSessions()}
              className="w-full py-3 text-xs font-bold text-[#0396A6] hover:bg-[#0396A6]/5 transition-colors border-t border-border/30 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Load older conversations</span>
              <ChevronRight size={13} />
            </button>
          )}
        </div>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 min-h-0 flex flex-col bg-[#EFEAE2]/60 dark:bg-[#0b141a] relative overflow-hidden h-full ${activeContactId ? 'flex' : 'hidden md:flex'}`}>
        {activeContactId ? (
          <div className="flex flex-col h-full min-h-0 relative">
            {(() => {
              const activeSession = sessions.find((s) => s.session_id === activeContactId);
              const isManual = Boolean(activeSession?.bot_paused || activeSession?.mode === 'human');
              const isClosed = activeSession?.status === 'closed';
              const sessionChannel = activeSession?.channel === 'whatsapp' || activeSession?._channel === 'whatsapp' || channel === 'whatsapp' ? 'whatsapp' : 'website';
              const isWA = sessionChannel === 'whatsapp';
              const contactName = formatContactLabel(activeSession?.contact_label, { channel: sessionChannel });
              const initials = getInitials(contactName);

              return (
                <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-border bg-white dark:bg-zinc-900 shrink-0 z-20 gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <button 
                      onClick={() => setActiveContactId(null)} 
                      className="md:hidden p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-all shrink-0 cursor-pointer"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <div className="relative shrink-0" onClick={() => setShowInfoPanel(!showInfoPanel)} style={{ cursor: 'pointer' }}>
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#EAF8F8] dark:bg-teal-950/40 text-[#0396A6] dark:text-teal-400 flex items-center justify-center font-black text-sm border border-[#D9EDEE] dark:border-teal-900/40 shadow-xs">
                        {(() => {
                          const isGeneric = contactName === 'WhatsApp contact' || contactName === 'Visitor' || contactName.startsWith('#WEB-') || contactName.replace(/[^a-zA-Z]/g, '').length < 2;
                          return isGeneric ? <UserIcon size={20} strokeWidth={2.5} /> : initials;
                        })()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background flex items-center justify-center ${isWA ? 'bg-emerald-500' : 'bg-[#0396A6]'}`} title={isWA ? 'WhatsApp' : 'Website'}>
                        {isWA ? <Smartphone size={7} className="text-white" /> : <Globe size={7} className="text-white" />}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-extrabold text-foreground truncate flex items-center gap-2">
                        <span>
                          {(() => {
                            const isGeneric = contactName === 'WhatsApp contact' || contactName === 'Visitor' || contactName.startsWith('#WEB-') || contactName.replace(/[^a-zA-Z]/g, '').length < 2;
                            return (isGeneric && isWA && activeContactPhone) ? activeContactPhone : contactName;
                          })()}
                        </span>
                        {isClosed ? (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
                            Closed
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <AiHumanModeToggle
                      mode={isManual ? "human" : "ai"}
                      loading={handoffLoading}
                      onSelect={(next) => {
                        if (next === "ai") void handleSwitchToAI(activeContactId);
                        else void handleSwitchToManual(activeContactId);
                      }}
                    />

                    <button 
                      onClick={() => setShowInfoPanel(!showInfoPanel)} 
                      className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                      title="User Details"
                    >
                      <UserIcon size={18} strokeWidth={2} />
                    </button>


                  </div>
                </div>
              );
            })()}

            {/* Chat Messages Transcript */}
            <div
              className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4"
              ref={scrollRef}
              onScroll={() => {
                const el = scrollRef.current;
                if (!el) return;
                stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
                if (el.scrollTop < 40) void loadOlderMessages();
              }}
            >
              {hasOlderMessages && (
                <button
                  type="button"
                  onClick={() => void loadOlderMessages()}
                  disabled={loadingOlder}
                  className="w-full text-[11px] font-bold text-[#0396A6] py-1.5 hover:underline cursor-pointer flex items-center justify-center gap-1"
                >
                  {loadingOlder ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Loading earlier messages…</span>
                    </>
                  ) : (
                    <span>Load earlier messages</span>
                  )}
                </button>
              )}

              {messagesLoading && convos.filter(c => c.session_id === activeContactId).length === 0 ? (
                <div className="space-y-4 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                      <div className={`rounded-2xl max-w-[70%] ${i % 2 === 0 ? 'rounded-tl-none' : 'rounded-tr-none'}`}>
                        <div className={`h-10 rounded-2xl ${i % 2 === 0 ? 'bg-muted/40 w-48 rounded-tl-none' : 'bg-[#0396A6]/20 w-56 rounded-tr-none'}`} />
                        <div className={`h-3 mt-1 rounded ${i % 2 === 0 ? 'bg-muted/30 w-16' : 'bg-[#0396A6]/10 w-14 ml-auto'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                (() => {
                  const activeConvos = convos.filter(c => c.session_id === activeContactId);
                  if (activeConvos.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground my-auto">
                        <div className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-2xs border border-border/60 flex items-center justify-center mb-2.5 text-[#0396A6]">
                          <MessageSquare size={20} />
                        </div>
                        <p className="text-xs font-bold text-foreground">No messages yet</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Start the conversation or wait for incoming user activity.</p>
                      </div>
                    );
                  }

                  const activeSession = sessions.find((s) => s.session_id === activeContactId);
                  const sChan = activeSession?.channel || activeSession?._channel || channel;
                  const contactName = formatContactLabel(activeSession?.contact_label, { channel: sChan });

                  return activeConvos.map((m) => {
                    const sender = m.sender_type ?? (m.role === 'user' ? 'user' : 'agent');
                    const isUser = sender === 'user';
                    const isAi = sender === 'ai';
                    return (
                      <div
                        key={String(m.message_id ?? m.id)}
                        className={`flex w-full ${isUser ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`relative max-w-[85%] sm:max-w-[72%] px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] rounded-2xl ${
                            isUser ? 'rounded-tl-sm' : 'rounded-tr-sm'
                          }`}
                        >
                          {isUser && (
                            <div className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 mb-1 select-none">
                              <span>{contactName}</span>
                            </div>
                          )}

                          {!isUser && (
                            <div
                              className={`text-[11px] font-extrabold mb-1 select-none uppercase tracking-wide ${
                                isAi ? 'text-[#0396A6]' : 'text-[#028391]'
                              }`}
                            >
                              <span>{isAi ? 'AI' : 'Human'}</span>
                            </div>
                          )}

                          <div className="text-[13px] leading-relaxed break-words whitespace-pre-wrap font-medium text-slate-900 dark:text-slate-100">
                            {m.content}
                          </div>

                          <div className="flex items-center justify-end gap-1.5 mt-2 select-none">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {formatActivityTime(m.created_at)}
                            </span>
                            {!isUser && (
                              <CheckCheck size={14} className="text-[#0396A6] shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>

            {/* Bottom Bar: Chat Input (disabled when AI auto-reply is on) */}
            {(() => {
              const activeSession = sessions.find((s) => s.session_id === activeContactId);
              const isManual = Boolean(activeSession?.bot_paused || activeSession?.mode === 'human');

              return (
                <div className="bg-white dark:bg-zinc-900 px-3 sm:px-4 py-2.5 sm:py-3 shrink-0 border-t border-border sticky bottom-0 z-20 space-y-2">
                  {!isManual && (
                    <div className="flex items-center justify-center gap-2 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0396A6] animate-pulse" />
                      <span className="text-[11px] font-bold text-muted-foreground">AI auto-reply is active — toggle off to type</span>
                    </div>
                  )}
                  {isManual && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#FF7A5E]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A5E] animate-pulse" />
                        <span>Manual Handling Active</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSwitchToAI(activeContactId)}
                        disabled={handoffLoading}
                        className="text-[11px] font-bold text-[#0396A6] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {handoffLoading && <Loader2 size={11} className="animate-spin" />}
                        <span>Return to AI</span>
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleSendManual} className="flex items-center gap-2">
                    <input 
                      ref={inputRef}
                      type="text" 
                      value={inputText} 
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={isManual ? "Type a reply to the visitor..." : "Turn off AI auto-reply to type..."} 
                      disabled={!isManual}
                      className={`flex-1 bg-muted/20 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-[#0396A6] focus:border-[#0396A6] text-foreground ${!isManual ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <button 
                      type="submit" 
                      disabled={!inputText.trim() || !isManual}
                      className="p-2.5 bg-[#0396A6] hover:bg-[#028391] disabled:opacity-50 text-white rounded-xl transition-all shrink-0 cursor-pointer"
                      title="Send reply"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground bg-white dark:bg-zinc-950/40">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF8F8] dark:bg-teal-950/40 text-[#0396A6] dark:text-teal-400 flex items-center justify-center mb-3 shadow-2xs border border-[#D9EDEE] dark:border-teal-900/40">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-sm font-bold text-[#18181B] dark:text-zinc-100 mb-1">No conversation selected</h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-[220px]">Choose a conversation from the sidebar to view full transcript and details.</p>
          </div>
        )}
      </div>

      {/* Contact Info Panel */}
      {showInfoPanel && activeContactId && (
        <div className="w-[300px] bg-white border-l border-border/60 shrink-0 flex flex-col h-full overflow-y-auto no-scrollbar z-30 animate-in slide-in-from-right-4 duration-300 relative">
          {(() => {
            const s = sessions.find((x) => x.session_id === activeContactId);
            const sChan = s?.channel === 'whatsapp' || s?._channel === 'whatsapp' || channel === 'whatsapp' ? 'whatsapp' : 'website';
            const isWA = sChan === 'whatsapp';
            const contactName = formatContactLabel(s?.contact_label, { channel: sChan });
            const isGeneric = contactName === 'WhatsApp contact' || contactName === 'Visitor' || contactName.startsWith('#WEB-') || contactName.replace(/[^a-zA-Z]/g, '').length < 2;
            const initials = getInitials(contactName);
            const isManual = Boolean(s?.bot_paused || s?.mode === 'human');

            return (
              <>
                <button 
                  onClick={() => setShowInfoPanel(false)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer z-10"
                  title="Close Profile"
                >
                  <X size={16} />
                </button>
                
                <div className="p-6 border-b border-border bg-white dark:bg-zinc-900 flex flex-col items-center pt-8">
                  <div className="w-20 h-20 rounded-full bg-[#EAF8F8] dark:bg-teal-950/40 text-[#0396A6] dark:text-teal-400 flex items-center justify-center font-black text-2xl mb-4 border-2 border-[#D9EDEE] dark:border-teal-900/40 relative shadow-xs">
                    {isGeneric ? <UserIcon size={36} strokeWidth={2} /> : initials}
                    <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center ${isWA ? 'bg-emerald-500' : 'bg-[#0396A6]'}`} title={isWA ? 'WhatsApp' : 'Website'}>
                      {isWA ? <Smartphone size={12} className="text-white" /> : <Globe size={12} className="text-white" />}
                    </div>
                  </div>
                  
                  <h3 className="font-extrabold text-foreground text-lg mb-1 text-center truncate w-full px-4">
                    {(isGeneric && isWA && activeContactPhone) ? activeContactPhone : contactName}
                  </h3>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-[0.05em]">Lead Captured</span>
                  
                  <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono bg-slate-50 dark:bg-zinc-900 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800">
                    <span className="truncate max-w-[170px]">
                      {isWA ? 
                        (activeContactPhone 
                          ? (activeContactPhone.startsWith('+') ? activeContactPhone : `+${activeContactPhone}`)
                          : "Loading Number...") 
                        : activeContactId}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => {
                        const valToCopy = isWA ? (activeContactPhone ? (activeContactPhone.startsWith('+') ? activeContactPhone : `+${activeContactPhone}`) : null) : activeContactId;
                        if (valToCopy) {
                          navigator.clipboard.writeText(valToCopy);
                          toastSuccess(isWA ? "Mobile number copied to clipboard" : "Session ID copied to clipboard");
                        }
                      }}
                      className={`text-slate-400 transition-colors ${(!isWA || activeContactPhone) ? 'hover:text-[#0396A6] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      title={isWA ? "Copy Mobile Number" : "Copy Session ID"}
                      disabled={isWA && !activeContactPhone}
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 border-b border-border/40 flex flex-col gap-3">
                  <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-[0.05em]">AI CONVERSATION DISCOVERY</h4>
                  
                  {summaries[activeContactId] === 'LOADING' ? (
                    <div className="p-4 rounded-xl border border-[#0396A6]/20 bg-white flex justify-center items-center shadow-sm">
                      <Loader2 className="animate-spin text-[#0396A6]" size={20} />
                    </div>
                  ) : summaries[activeContactId] ? (
                    <div className="p-4 rounded-xl border border-[#0396A6]/20 bg-white shadow-[0_2px_10px_rgba(3,150,166,0.05)]">
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed italic font-medium">
                        "{typeof summaries[activeContactId] === 'object' ? (summaries[activeContactId] as any).summary : summaries[activeContactId]}"
                      </p>
                    </div>
                  ) : null}

                  {summaries[activeContactId] !== 'LOADING' && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-white flex justify-center items-center">
                      <button 
                        onClick={() => handleSummarize(activeContactId)}
                        className="px-6 py-2.5 rounded-lg bg-[#F7FBFB] text-[#296066] text-[11px] font-extrabold tracking-wide uppercase transition-colors hover:bg-[#EAF5F5] border border-[#E1F0F0] shadow-sm cursor-pointer"
                      >
                        {summaries[activeContactId] ? 'Regenerate Summary' : 'Generate Summary'}
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex-1 bg-slate-50/50 dark:bg-zinc-900/20">
                  <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-[0.05em] mb-4">Metadata</h4>
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm">
                      <span className="text-[12px] text-slate-500 font-medium">Status</span>
                      <span className={`text-[12px] font-bold ${isManual ? 'text-[#FF7A5E]' : 'text-[#1B5758]'}`}>
                        {isManual ? 'Manual' : 'Automated'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm">
                      <span className="text-[12px] text-slate-500 font-medium">Platform</span>
                      <span className="text-[12px] font-bold text-slate-700 dark:text-zinc-300">
                        {(() => {
                          const rawChan = (s?.channel || s?._channel || channel) as string;
                          if (rawChan === 'whatsapp') return 'WhatsApp API';
                          if (rawChan === 'instagram') return 'Instagram';
                          if (rawChan === 'facebook' || rawChan === 'messenger') return 'Facebook Messenger';
                          return 'Website Widget';
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm">
                      <span className="text-[12px] text-slate-500 font-medium">Language</span>
                      <span className="text-[12px] font-bold text-slate-700 dark:text-zinc-300">English (Inferred)</span>
                    </div>
                  </div>
                </div>

              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
