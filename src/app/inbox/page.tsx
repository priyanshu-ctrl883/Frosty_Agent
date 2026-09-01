"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState, Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { TopbarTabs, type TopbarTab } from "@/components/shell/Topbar";
import { TopbarInboxAgentPicker, type HubChannelFilter } from "@/components/shell/TopbarHubAgentPicker";
import { EntitlementGate } from "@/components/entitlements/EntitlementGate";
import { Skeleton } from "@/components/ui/Skeleton";
import { MessageSquare, UserCheck } from "lucide-react";
import { apiRequest, apiPage, ApiClientError } from "@/lib/api";
import {
  addConversationNote,
  inboxRelease,
  inboxClaim,
  inboxReply,
  inboxTransfer,
  sendPresenceHeartbeat,
  postMessageFeedback,
  getConversationDetail,
  type ConversationDetail,
} from "@/lib/conversations";
import { isInboxChangeEvent, subscribeInboxRealtime } from "@/lib/inboxRealtime";
import { can } from "@/lib/permissions";
import { relative } from "@/lib/format";
import { formatInboxHeaderLabel, isWhatsAppWindowExpired } from "./inboxDisplay";
import type {
  ActiveConversation,
  Agent,
  InboxMessage,
  QueueItem,
} from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import { useToast } from "@/lib/toast";
import styles from "./inbox.module.css";
import { InboxSidebar } from "./InboxSidebar";
import { InboxThread } from "./InboxThread";
import { InboxHandoffRequestsTab } from "./InboxHandoffRequestsTab";

const REFETCH_DEBOUNCE_MS = 120;
const FALLBACK_POLL_MS = 4_000;
const HEARTBEAT_MS = 30_000;

type PrimaryTab = "conversations" | "handoffs";

export default function InboxPage() {
  return (
    <Suspense fallback={null}>
      <InboxPageInner />
    </Suspense>
  );
}

function InboxPageInner() {
  const searchParams = useSearchParams();
  const queryTab = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState<PrimaryTab>(
    queryTab === "handoffs" || queryTab === "handoff" ? "handoffs" : "conversations"
  );
  const [queueCount, setQueueCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [agentScope, setAgentScope] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<HubChannelFilter>("all");

  useEffect(() => {
    apiRequest<Agent[]>("/v1/agents")
      .then((list) => setAgentsList(list || []))
      .catch(() => setAgentsList([]));
  }, []);

  const handleAgentScopeChange = (nextId: string) => {
    setAgentScope(nextId);
    setSelected(null);
    if (nextId !== "all") {
      setChannelFilter("all");
    }
  };

  // Sync activeTab if searchParam changes
  useEffect(() => {
    if (queryTab === "handoffs" || queryTab === "handoff") {
      setActiveTab("handoffs");
    } else if (queryTab === "conversations" || queryTab === "chats") {
      setActiveTab("conversations");
    }
  }, [queryTab]);

  // Fetch queue count for the badge + active poll
  useEffect(() => {
    const fetchQueue = () => {
      apiRequest<QueueItem[]>("/v1/inbox/queue?limit=50")
        .then((q) => setQueueCount(q.length))
        .catch(() => {});
    };
    fetchQueue();
    const id = window.setInterval(fetchQueue, 3000);
    return () => window.clearInterval(id);
  }, []);

  // Listen for realtime changes to keep badge updated
  useEffect(() => {
    return subscribeInboxRealtime({
      onEvent: (evt) => {
        if (!isInboxChangeEvent(evt)) return;
        apiRequest<QueueItem[]>("/v1/inbox/queue?limit=50")
          .then((q) => setQueueCount(q.length))
          .catch(() => {});
      },
    });
  }, []);

  const tabs: TopbarTab[] = [
    {
      key: "conversations",
      label: "Conversations",
      icon: <MessageSquare className="w-3.5 h-3.5" />,
    },
    {
      key: "handoffs",
      label: "Handoff Requests",
      icon: <UserCheck className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <AppShell
      title="Inbox"
      requires="inbox:read"
      workspace={true}
      beforeSearch={
        agentsList.length > 0 ? (
          <TopbarInboxAgentPicker
            agents={agentsList}
            selectedAgentId={agentScope}
            onSelectAgent={handleAgentScopeChange}
            agentScopeLabel="All Agents"
          />
        ) : null
      }
      headerTabs={
        <TopbarTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as PrimaryTab)}
          hideMobileBottomNav={Boolean(selected && activeTab === "conversations")}
        />
      }
    >
      <EntitlementGate feature="human_handoff">
        <InboxBodyWithTab
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setQueueCount={setQueueCount}
          selected={selected}
          setSelected={setSelected}
          agentScope={agentScope}
          channelFilter={channelFilter}
          setChannelFilter={setChannelFilter}
          showChannelFilter={agentScope === "all"}
        />
      </EntitlementGate>
    </AppShell>
  );
}

/**
 * Main Inbox component
 */
function InboxBodyWithTab({
  activeTab,
  setActiveTab,
  setQueueCount,
  selected,
  setSelected,
  agentScope,
  channelFilter,
  setChannelFilter,
  showChannelFilter,
}: {
  activeTab: PrimaryTab;
  setActiveTab: (t: PrimaryTab) => void;
  setQueueCount: (n: number) => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
  agentScope: string;
  channelFilter: HubChannelFilter;
  setChannelFilter: (next: HubChannelFilter) => void;
  showChannelFilter: boolean;
}) {
  const { me, merchant } = useWorkspace();
  const searchParams = useSearchParams();
  const queryConversationId = searchParams?.get("c") || searchParams?.get("conversation_id");

  const refetchTimer = useRef<number | null>(null);

  const { showToast } = useToast();
  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    showToast(message, { type });
  }, [showToast]);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [conversations, setConversations] = useState<ActiveConversation[]>([]);
  const [conversationsCursor, setConversationsCursor] = useState<string | null>(null);
  const [loadingMoreConversations, setLoadingMoreConversations] = useState(false);

  useEffect(() => {
    if (queryConversationId && queryConversationId !== selected) {
      setSelected(queryConversationId);
    }
  }, [queryConversationId]);
  const [selectedDetail, setSelectedDetail] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const [waWindowExpired, setWaWindowExpired] = useState(false);

  const [status, setStatus] = useState<"connecting" | "live" | "closed">("connecting");
  const [statusDetail, setStatusDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const [messageFeedback, setMessageFeedback] = useState<Record<string, string>>({});
  const messagesRef = useRef<HTMLDivElement>(null);

  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const messagesCursorRef = useRef<string | null>(null);

  const canReply = can(me?.permissions, "inbox:reply");
  const canTransfer = can(me?.permissions, "handoff:manage");

  /* ── Data loading ─────────────────────────────────────────────── */

  const loadLists = useCallback(async () => {
    try {
      const [q, cPage] = await Promise.all([
        apiRequest<QueueItem[]>("/v1/inbox/queue?limit=50"),
        apiPage<ActiveConversation[]>("/v1/inbox/conversations?limit=50"),
      ]);
      setQueue(q);
      setQueueCount(q.length);
      setConversations(cPage.data || []);
      setConversationsCursor(cPage.meta?.next_cursor || null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Could not load the inbox", "error");
    } finally {
      setLoading(false);
    }
  }, [setQueueCount, addToast]);

  const loadMoreConversations = useCallback(async () => {
    if (!conversationsCursor || loadingMoreConversations) return;
    setLoadingMoreConversations(true);
    try {
      const res = await apiPage<ActiveConversation[]>(
        `/v1/inbox/conversations?limit=50&cursor=${conversationsCursor}`
      );
      setConversations((prev) => [...prev, ...(res.data || [])]);
      setConversationsCursor(res.meta?.next_cursor || null);
    } catch (err) {
      console.error("Failed to load more conversations", err);
    } finally {
      setLoadingMoreConversations(false);
    }
  }, [conversationsCursor, loadingMoreConversations]);

  const loadMessages = useCallback(async (conversationId: string, opts?: { signal?: AbortSignal; silent?: boolean }) => {
    if (!opts?.silent) setMessagesLoading(true);
    try {
      const [msgEnv, notes, detail] = await Promise.all([
        apiPage<InboxMessage[]>(
          `/v1/inbox/conversations/${conversationId}/messages?limit=80&newest=true`
        ),
        apiRequest<any[]>(`/v1/conversations/${conversationId}/notes`).catch(() => [] as any[]),
        getConversationDetail(conversationId).catch(() => null),
      ]);
      if (opts?.signal?.aborted) return;

      if (detail) setSelectedDetail(detail);

      const combined = [
        ...(Array.isArray(msgEnv.data) ? msgEnv.data : []),
        ...notes.map((n) => ({
          id: n.id as any,
          sender_type: "note",
          body: n.note,
          created_at: n.created_at,
          author_name: n.author_name,
        })),
      ].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setMessages(combined as InboxMessage[]);
      setHasMoreMessages(!!msgEnv.meta?.prev_cursor);
      messagesCursorRef.current = msgEnv.meta?.prev_cursor || null;

      if (combined.length > 0) {
        const realMsgs = combined.filter(
          (m) => m.sender_type === "user" || m.sender_type === "ai" || m.sender_type === "agent"
        );
        const lastMsg = realMsgs.length > 0 ? realMsgs[realMsgs.length - 1] : null;
        if (lastMsg?.body?.trim()) {
          setConversations((prev) =>
            prev.map((c) =>
              c.conversation_id === conversationId
                ? { ...c, last_message_preview: lastMsg.body }
                : c
            )
          );
        }
      }
    } catch (err) {
      if (opts?.signal?.aborted) return;
      addToast(err instanceof Error ? err.message : "Could not load that conversation", "error");
    } finally {
      if (!opts?.signal?.aborted && !opts?.silent) setMessagesLoading(false);
    }
  }, [addToast]);

  const loadMoreMessages = useCallback(async () => {
    if (!selectedRef.current || !messagesCursorRef.current || loadingMoreMessages) return;
    setLoadingMoreMessages(true);
    try {
      const msgEnv = await apiPage<InboxMessage[]>(
        `/v1/inbox/conversations/${selectedRef.current}/messages?limit=80&before_id=${messagesCursorRef.current}`
      );

      setMessages((prev) => {
        const seen = new Set(prev.map((m) => String(m.id)));
        const older = msgEnv.data.filter((m) => !seen.has(String(m.id)));
        const combined = [...older, ...prev].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        return combined as InboxMessage[];
      });
      setHasMoreMessages(!!msgEnv.meta?.prev_cursor);
      messagesCursorRef.current = msgEnv.meta?.prev_cursor || null;
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Could not load more messages", "error");
    } finally {
      setLoadingMoreMessages(false);
    }
  }, [loadingMoreMessages, addToast]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  useEffect(() => {
    const controller = new AbortController();

    if (selected) {
      setMessages([]);
      setSelectedDetail(null);
      setWaWindowExpired(false);
      void loadMessages(selected, { signal: controller.signal });
    } else {
      setMessages([]);
      setSelectedDetail(null);
      setWaWindowExpired(false);
      setMessagesLoading(false);
      setMessageFeedback({});
    }

    return () => {
      controller.abort();
    };
  }, [selected, loadMessages]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (!selected) {
      setWaWindowExpired(false);
      return;
    }
    const active = conversations.find((c) => c.conversation_id === selected);
    const channel = selectedDetail?.channel ?? active?.channel;
    if (channel !== "whatsapp") {
      setWaWindowExpired(false);
      return;
    }
    setWaWindowExpired(isWhatsAppWindowExpired(messages, channel));
  }, [selected, messages, selectedDetail?.channel, conversations]);

  const selectedRef = useRef<string | null>(null);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  /* ── WebSocket realtime ──────────────────────────────────────── */

  useEffect(() => {
    const close = subscribeInboxRealtime({
      onStatus: (s, detail) => {
        setStatus(s);
        setStatusDetail(detail ?? null);
      },
      onEvent: (evt) => {
        if (!isInboxChangeEvent(evt)) return;
        if (refetchTimer.current !== null) window.clearTimeout(refetchTimer.current);
        const conversationId = evt.conversation_id;
        refetchTimer.current = window.setTimeout(() => {
          refetchTimer.current = null;
          void loadLists();
          if (selectedRef.current && (!conversationId || conversationId === selectedRef.current)) {
            void loadMessages(selectedRef.current, { silent: true });
          }
        }, REFETCH_DEBOUNCE_MS);
      },
    });
    return () => {
      if (refetchTimer.current !== null) window.clearTimeout(refetchTimer.current);
      close();
    };
  }, [loadLists, loadMessages]);

  // Active sync loop: silently refresh list & active conversation every 3s so queue & messages are always 100% up to date
  useEffect(() => {
    const id = window.setInterval(() => {
      void loadLists();
      if (selectedRef.current) {
        void loadMessages(selectedRef.current, { silent: true });
      }
    }, 3000);
    return () => window.clearInterval(id);
  }, [loadLists, loadMessages]);

  // Presence heartbeat
  useEffect(() => {
    const beat = async () => {
      try {
        await sendPresenceHeartbeat(true);
      } catch {
        // quiet fail
      }
    };
    void beat();
    const id = window.setInterval(beat, HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, []);

  /* ── Inbox actions ────────────────────────────────────────────── */

  async function refreshSelectedDetail(conversationId: string) {
    try {
      const detail = await getConversationDetail(conversationId);
      setSelectedDetail(detail);
    } catch {
      /* detail refresh is best-effort */
    }
  }

  async function claim(conversationId: string) {
    setBusy(true);
    try {
      const out = await inboxClaim(conversationId);
      if (!out.claimed) {
        addToast("Someone else claimed that conversation first.", "error");
      } else {
        setActiveTab("conversations");
        setSelected(conversationId);
        setSelectedDetail((prev) =>
          prev
            ? {
                ...prev,
                mode: "human",
                assigned_agent: {
                  membership_id: currentMemId || (out as any).assigned_to_member_id || "",
                  display_name: (me as any)?.display_name || (me as any)?.name || "You",
                },
              }
            : null
        );
        addToast(
          out.idle_deadline_at
            ? `Conversation claimed · AI paused · Human handling active (Auto-release: ${relative(out.idle_deadline_at)})`
            : "Conversation claimed · AI paused · Human handling active"
        );
      }
      await Promise.all([
        loadLists(),
        loadMessages(conversationId),
        refreshSelectedDetail(conversationId),
      ]);
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === "window_expired") {
        addToast(
          err.message || "Send a template and wait for the customer to reply before claiming.",
          "error",
        );
      } else if (err instanceof ApiClientError && (err.code === "already_claimed" || err.status === 409)) {
        addToast("Already claimed by another team member.", "error");
      } else if (err instanceof ApiClientError && (err.code === "not_found" || err.status === 404)) {
        addToast(err.message || "Handoff request not found or already claimed.", "error");
      } else {
        addToast(err instanceof Error ? err.message : "Could not claim that conversation", "error");
      }
      await loadLists();
    } finally {
      setBusy(false);
    }
  }

  async function reply(e: FormEvent) {
    e.preventDefault();
    const textToSend = draft.trim();
    if (!selected || !textToSend) return;

    // Optimistic UI update: instant send experience like WhatsApp
    const tempId = -Date.now();
    const optimisticMessage: InboxMessage = {
      id: tempId,
      sender_type: "agent",
      body: textToSend,
      created_at: new Date().toISOString(),
      author_name: me?.display_name || "You",
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setDraft("");
    setConversations((prev) =>
      prev.map((c) =>
        c.conversation_id === selected
          ? { ...c, last_message_preview: textToSend }
          : c
      )
    );

    try {
      const out = await inboxReply(selected, textToSend);
      if (out.duplicate) addToast("Already sent — not sent twice.", "error");
      await loadMessages(selected, { silent: true });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(textToSend);
      if (err instanceof ApiClientError && err.code === "window_expired") {
        setWaWindowExpired(true);
      }
      addToast(err instanceof Error ? err.message : "Could not send that reply", "error");
    }
  }

  async function addNoteHandler(e: FormEvent) {
    e.preventDefault();
    const noteText = note.trim();
    if (!selected || !noteText) return;

    const tempId = -Date.now();
    const optimisticNote: InboxMessage = {
      id: tempId,
      sender_type: "note",
      body: noteText,
      created_at: new Date().toISOString(),
      author_name: me?.display_name || "You",
    };
    setMessages((prev) => [...prev, optimisticNote]);
    setNote("");

    try {
      await addConversationNote(selected, noteText);
      addToast("Internal note added (visible only to teammates).");
      await loadMessages(selected, { silent: true });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNote(noteText);
      addToast(err instanceof Error ? err.message : "Could not add that note", "error");
    }
  }

  async function rateMessage(messageId: string | number, rating: "thumbs_up" | "thumbs_down") {
    if (!selected || !canReply) return;
    setBusy(true);
    try {
      await postMessageFeedback(selected, Number(messageId), rating);
      setMessageFeedback((prev) => ({ ...prev, [String(messageId)]: rating }));
      addToast(rating === "thumbs_up" ? "Feedback recorded — helpful." : "Feedback recorded.");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Could not record feedback", "error");
    } finally {
      setBusy(false);
    }
  }

  async function releaseToAgent() {
    if (!selected) return;
    setBusy(true);
    try {
      await inboxRelease(selected);
      setSelectedDetail((prev) =>
        prev ? { ...prev, mode: "ai", assigned_agent: null } : null
      );
      addToast("Conversation released back to AI.");
      await loadLists();
      if (selected) {
        await Promise.all([loadMessages(selected), refreshSelectedDetail(selected)]);
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Could not release that conversation", "error");
    } finally {
      setBusy(false);
    }
  }

  async function resolve(disposition: "return_to_ai" | "close") {
    if (!selected) return;
    setBusy(true);
    try {
      await apiRequest(`/v1/inbox/conversations/${selected}/resolve`, {
        method: "POST",
        body: { disposition },
      });
      addToast(disposition === "return_to_ai" ? "Handed back to AI." : "Conversation closed.");
      if (disposition === "close") setSelected(null);
      await loadLists();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Could not resolve that conversation", "error");
    } finally {
      setBusy(false);
    }
  }

  async function transferHandler(toMembershipId: string) {
    if (!selected) return;
    setBusy(true);
    try {
      await inboxTransfer(selected, toMembershipId);
      addToast("Conversation transferred to teammate.");
      await loadLists();
      if (selected) {
        await Promise.all([loadMessages(selected), refreshSelectedDetail(selected)]);
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Could not transfer that conversation", "error");
    } finally {
      setBusy(false);
    }
  }

  /* ── Derived state ───────────────────────────────────────────── */

  const selectedActive = conversations.find((c) => c.conversation_id === selected);
  const selectedQueue = queue.find((q) => q.conversation_id === selected);
  const headerChannel = selectedDetail?.channel ?? selectedActive?.channel ?? selectedQueue?.channel;
  const headerContactLabel =
    selectedDetail?.contact?.display_name ??
    selectedActive?.contact_label ??
    selectedQueue?.contact_label ??
    null;
  const headerLabel = formatInboxHeaderLabel(
    headerContactLabel,
    selected ?? "",
    headerChannel,
    selectedDetail?.contact?.primary_phone ?? undefined,
  );
  const currentMemId = (merchant as any)?.membership_id || (me as any)?.membership_id || "";
  const mine =
    selectedActive?.assigned_to_member_id === currentMemId;

  /* ── Render ──────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className={styles.layout}>
        <div className={styles.listPane}>
          <div className={styles.sidebarHeader}>
            <Skeleton w="w-20" h="h-5" rounded="rounded" />
          </div>
          <ul className={styles.list}>
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className={styles.card}>
                <div className={styles.cardInner}>
                  <Skeleton w="w-10" h="h-10" rounded="rounded-full" />
                  <div style={{ flex: 1 }}>
                    <Skeleton w="w-32" h="h-4" rounded="rounded" className="mb-2" />
                    <Skeleton w="w-20" h="h-3" rounded="rounded" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.thread}>
          <div className={styles.threadHead}>
            <Skeleton w="w-48" h="h-6" rounded="rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {activeTab === "conversations" ? (
        <div className={`${styles.layout} ${selected ? styles.layoutHasSelected : styles.layoutNoSelected}`}>
          <InboxSidebar
            conversations={conversations}
            queue={queue}
            selected={selected}
            onSelect={setSelected}
            channelFilter={channelFilter}
            setChannelFilter={setChannelFilter}
            showChannelFilter={showChannelFilter}
            agentScope={agentScope}
            currentMembershipId={currentMemId}
            hasMore={!!conversationsCursor}
            loadingMore={loadingMoreConversations}
            onLoadMore={loadMoreConversations}
          />

          <InboxThread
            selected={selected}
            selectedActive={selectedActive}
            selectedDetail={selectedDetail}
            headerLabel={headerLabel}
            headerContactLabel={headerContactLabel}
            messages={messages}
            messagesLoading={messagesLoading}
            draft={draft}
            setDraft={setDraft}
            note={note}
            setNote={setNote}
            busy={busy}
            canReply={canReply}
            canTransfer={canTransfer}
            mine={mine}
            currentMembershipId={currentMemId}
            currentUserDisplayName={me?.display_name || "You"}
            onClaim={claim}
            onReply={reply}
            onAddNote={addNoteHandler}
            onRateMessage={rateMessage}
            onRelease={releaseToAgent}
            onResolve={resolve as any}
            onTransfer={transferHandler}
            messageFeedback={messageFeedback}
            messagesRef={messagesRef}
            hasMoreMessages={hasMoreMessages}
            loadingMore={loadingMoreMessages}
            onLoadMore={loadMoreMessages}
            onBack={() => setSelected(null)}
            waWindowExpired={waWindowExpired}
            onTemplateSent={() => {
              if (selected) void loadMessages(selected, { silent: true });
            }}
          />
        </div>
      ) : (
        <InboxHandoffRequestsTab
          queue={queue}
          loading={loading}
          onClaim={claim}
          busy={busy}
          canReply={canReply}
          onRefresh={loadLists}
          channelFilter={channelFilter}
          setChannelFilter={setChannelFilter}
          showChannelFilter={showChannelFilter}
          agentScope={agentScope}
        />
      )}
    </>
  );
}
