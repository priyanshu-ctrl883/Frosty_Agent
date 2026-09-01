/**
 * Merchant-facing conversation + inbox helpers.
 * Maps `/v1/conversations/*` and `/v1/inbox/*` to the legacy session/message shapes
 * still used by the WhatsApp and Unified hub dashboards.
 */
import { apiPage, apiRequest } from "@/lib/api";
import {
  formatActivityTime,
  formatContactLabel,
  parseApiDate,
} from "@/lib/format";
import type {
  ClaimResult,
  Conversation,
  ConversationMessage,
  InboxMessage,
  ReplyResult,
  ResolveResult,
} from "@/lib/types";

export type ContactBrief = {
  id: string;
  display_name?: string | null;
  primary_email?: string | null;
  primary_phone?: string | null;
  primary_channel?: string | null;
};

export type AgentBrief = {
  id: string;
  agent_name?: string | null;
  slug?: string | null;
};

export type AssignedAgent = {
  membership_id: string;
  display_name?: string | null;
};

export type HandoffBrief = {
  handoff_id: string;
  status: string;
  trigger_reason?: string | null;
  event_type?: string | null;
};

export type ConversationDetail = Conversation & {
  channel_status: string;
  assigned_agent_id?: string | null;
  wa_account_id?: number | null;
  pinned_agent_version_id?: string | null;
  pinned_version_number?: number | null;
  turns_in_window: number;
  turn_window_started_at?: string | null;
  contact?: ContactBrief | null;
  agent?: AgentBrief | null;
  assigned_agent?: AssignedAgent | null;
  wa_account?: { id: number; phone_number?: string | null; label?: string | null } | null;
  summary?: string | null;
  bridge?: ConversationBridge | null;
  handoff?: HandoffBrief | null;
};

export type LegacySessionRow = {
  session_id: string;
  content: string;
  role: string;
  created_at: string;
  bot_paused: boolean;
  mode?: string;
  status?: string;
  channel?: "website" | "whatsapp";
  _channel?: "website" | "whatsapp";
  contact_label?: string | null;
};

export type LegacyMessageRow = {
  id: string;
  message_id?: number;
  session_id: string;
  content: string;
  role: string;
  sender_type?: string;
  created_at: string;
  status?: string;
};

export type ConversationBridge = {
  conversation_id: string;
  website_conversation_id: string;
  wa_conversation_id: string;
  linked_conversation_id: string;
  linked_channel: string;
  user_phone: string;
  thread_id: string | null;
  created_at: string;
};

export interface ActiveWaAccount {
  id: string;
  phone_number: string;
  label?: string | null;
  account_name?: string | null;
}

export type MerchantOverview = {
  active_bot_channels: {
    website: boolean;
    whatsapp: boolean;
    instagram: boolean;
    messenger: boolean;
  };
  has_website_widget: boolean;
  wa_accounts: ActiveWaAccount[];
  unhandled_handoff_count: number;
  total_conversations_count: number;
  thirty_day_conversations_count: number;
  active_agents_count: number;
};

export type Message = {
  id: number;
  sender_type: "user" | "agent" | "ai" | "system";
  text: string;
  created_at: string;
};

export type ConversationSummary = {
  summary: string | null;
  updated_at: string | null;
  last_summarized_msg_id: number;
};

export type SummarizeResult = {
  summary: string | null;
  messages_summarized: number;
  last_summarized_msg_id: number;
};

export type ConversationNote = {
  id: string;
  source: string;
  note: string;
  pinned: boolean;
  author_member_id: string;
  author_name: string | null;
  created_at: string;
  updated_at: string;
};

export type TimelineEvent = {
  at: string;
  kind: string;
  ref: string;
  label: string | null;
  detail: string | null;
};

export type ConversationTimeline = {
  events: TimelineEvent[];
};

export type AiRun = {
  id: number;
  model: string;
  message_id: number | null;
  ttft_ms: number | null;
  latency_ms: number | null;
  grounding_ok: boolean | null;
  deny_code: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  created_at: string;
};

export type MessageFeedbackRating = "thumbs_up" | "thumbs_down";

/** Poll interval for legacy hub sidebars — new chats appear without a manual refresh. */
export const CONVERSATION_LIST_POLL_MS = 5000;

export function conversationToSession(
  c: Conversation,
  preview?: string,
  contactLabel?: string | null,
): LegacySessionRow {
  const activityAt = c.last_message_at || c.updated_at || c.created_at;
  return {
    session_id: c.id,
    content: preview ?? c.last_message_preview ?? "",
    role: "user",
    created_at: activityAt,
    bot_paused: c.mode === "human",
    mode: c.mode,
    status: c.status,
    channel: c.channel === "whatsapp" ? "whatsapp" : "website",
    _channel: c.channel === "whatsapp" ? "whatsapp" : "website",
    contact_label: formatContactLabel(contactLabel ?? c.contact_label, {
      channel: c.channel,
    }),
  };
}

export function merchantMessageToLegacy(
  m: ConversationMessage | InboxMessage,
  sessionId: string,
): LegacyMessageRow {
  const text = "text" in m ? m.text : m.body;
  const role =
    m.sender_type === "user"
      ? "user"
      : m.sender_type === "agent"
        ? "assistant"
        : "assistant";
  return {
    id: String(m.id),
    message_id: Number(m.id),
    session_id: sessionId,
    content: text || "",
    role,
    sender_type: m.sender_type,
    created_at: m.created_at,
    status: "read",
  };
}

export async function listConversations(opts?: {
  channel?: "website" | "whatsapp";
  agent_id?: string;
  limit?: number;
  signal?: AbortSignal;
}): Promise<Conversation[]> {
  const q = new URLSearchParams();
  if (opts?.channel) q.set("channel", opts.channel);
  if (opts?.agent_id) q.set("agent_id", opts.agent_id);
  q.set("limit", String(Math.min(opts?.limit ?? 50, 100)));
  const page = await apiPage<Conversation[]>(`/v1/conversations?${q}`, { signal: opts?.signal });
  return page.data;
}

/** Fetch every conversation page (API caps limit at 100 per request). */
export async function listAllConversations(opts?: {
  channel?: "website" | "whatsapp";
  agent_id?: string;
  signal?: AbortSignal;
  maxPages?: number;
}): Promise<Conversation[]> {
  const out: Conversation[] = [];
  let cursor: string | null = null;
  const maxPages = opts?.maxPages ?? 20;
  for (let page = 0; page < maxPages; page += 1) {
    const q = new URLSearchParams();
    if (opts?.channel) q.set("channel", opts.channel);
    if (opts?.agent_id) q.set("agent_id", opts.agent_id);
    q.set("limit", "100");
    if (cursor) q.set("cursor", cursor);
    const res = await apiPage<Conversation[]>(`/v1/conversations?${q}`, { signal: opts?.signal });
    out.push(...res.data);
    cursor = res.meta?.next_cursor ?? null;
    if (!cursor || res.data.length === 0) break;
  }
  return out;
}

/** Conversation list mapped to the legacy sidebar row shape. */
export async function listSessionRows(opts?: {
  channel?: "website" | "whatsapp";
  agent_id?: string;
  limit?: number;
  signal?: AbortSignal;
}): Promise<LegacySessionRow[]> {
  const rows = await listConversations(opts);
  return rows.map((c) => conversationToSession(c));
}

/** Paginated variant that also returns the next_cursor for load-more support. */
export async function listSessionRowsWithCursor(opts?: {
  channel?: "website" | "whatsapp";
  agent_id?: string;
  limit?: number;
  cursor?: string | null;
  signal?: AbortSignal;
}): Promise<{ rows: LegacySessionRow[]; nextCursor: string | null }> {
  const q = new URLSearchParams();
  if (opts?.channel) q.set("channel", opts.channel);
  if (opts?.agent_id) q.set("agent_id", opts.agent_id);
  q.set("limit", String(opts?.limit ?? 50));
  if (opts?.cursor) q.set("cursor", opts.cursor);
  const page = await apiPage<Conversation[]>(`/v1/conversations?${q}`, { signal: opts?.signal });
  return {
    rows: page.data.map((c) => conversationToSession(c)),
    nextCursor: page.meta?.next_cursor ?? null,
  };
}

export async function getConversationDetail(conversationId: string): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/v1/conversations/${conversationId}`);
}

export type TranscriptPage = {
  rows: LegacyMessageRow[];
  nextCursor: string | null;
  prevCursor: string | null;
};

export async function getConversationMessages(
  conversationId: string,
  limit = 100,
  afterId?: number,
): Promise<ConversationMessage[]> {
  const q = new URLSearchParams({ limit: limit.toString() });
  if (afterId !== undefined) q.set("cursor", afterId.toString());
  const page = await apiPage<ConversationMessage[]>(
    `/v1/conversations/${conversationId}/messages?${q.toString()}`,
  );
  return page.data;
}

export async function getConversationMessagePage(
  conversationId: string,
  opts: { limit?: number; afterId?: number; beforeId?: number; newest?: boolean } = {},
): Promise<TranscriptPage> {
  const q = new URLSearchParams({ limit: String(opts.limit ?? 80) });
  if (opts.newest) q.set("newest", "true");
  if (opts.afterId !== undefined) q.set("cursor", String(opts.afterId));
  if (opts.beforeId !== undefined) q.set("before", String(opts.beforeId));
  const page = await apiPage<ConversationMessage[]>(
    `/v1/conversations/${conversationId}/messages?${q.toString()}`,
  );
  return {
    rows: page.data.map((m) => merchantMessageToLegacy(m, conversationId)),
    nextCursor: page.meta?.next_cursor ?? null,
    prevCursor: page.meta?.prev_cursor ?? null,
  };
}

export async function getInboxMessages(
  conversationId: string,
  limit = 100,
  afterId?: number,
): Promise<InboxMessage[]> {
  const q = new URLSearchParams({ limit: limit.toString() });
  if (afterId !== undefined) q.set("after_id", afterId.toString());
  const page = await apiPage<InboxMessage[]>(
    `/v1/inbox/conversations/${conversationId}/messages?${q.toString()}`,
  );
  return page.data;
}

export async function getInboxMessagePage(
  conversationId: string,
  opts: { limit?: number; afterId?: number; beforeId?: number; newest?: boolean } = {},
): Promise<TranscriptPage> {
  const q = new URLSearchParams({ limit: String(opts.limit ?? 80) });
  if (opts.newest) q.set("newest", "true");
  if (opts.afterId !== undefined) q.set("after_id", String(opts.afterId));
  if (opts.beforeId !== undefined) q.set("before_id", String(opts.beforeId));
  const page = await apiPage<InboxMessage[]>(
    `/v1/inbox/conversations/${conversationId}/messages?${q.toString()}`,
  );
  return {
    rows: page.data.map((m) => merchantMessageToLegacy(m, conversationId)),
    nextCursor: page.meta?.next_cursor ?? null,
    prevCursor: page.meta?.prev_cursor ?? null,
  };
}

export async function loadTranscript(
  conversationId: string,
  mode: string,
  afterId?: number,
): Promise<LegacyMessageRow[]> {
  const page = await loadTranscriptPage(conversationId, mode, { afterId });
  return page.rows;
}

export async function loadTranscriptPage(
  conversationId: string,
  mode: string,
  opts: { limit?: number; afterId?: number; beforeId?: number; newest?: boolean } = {},
): Promise<TranscriptPage> {
  return mode === "human"
    ? getInboxMessagePage(conversationId, opts)
    : getConversationMessagePage(conversationId, opts);
}

export async function summarizeConversation(conversationId: string): Promise<SummarizeResult> {
  return apiRequest<SummarizeResult>(`/v1/conversations/${conversationId}/summarize`, {
    method: "POST",
  });
}

export async function getConversationSummary(conversationId: string): Promise<ConversationSummary> {
  return apiRequest<ConversationSummary>(`/v1/conversations/${conversationId}/summary`);
}

export async function getConversationBridge(
  conversationId: string,
): Promise<ConversationBridge | null> {
  return apiRequest<ConversationBridge | null>(`/v1/conversations/${conversationId}/bridge`);
}

/** Campaign attribution for one conversation (D265). Null when no row / unknown source. */
export type ConversationAttribution = {
  channel: "website" | "whatsapp" | string;
  attribution_status: "attributed" | "unknown" | string;
  click_id: string | null;
  click_id_kind: "ctwa_clid" | "gclid" | "fbclid" | string | null;
  source_id: string | null;
  campaign: string | null;
  campaign_name: string | null;
  ad_name: string | null;
  adset_id: string | null;
  campaign_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landing_page: string | null;
  display_label: string | null;
  captured_at: string | null;
  raw_referral?: Record<string, unknown> | null;
  raw_web?: Record<string, unknown> | null;
};

export async function getConversationAttribution(
  conversationId: string,
): Promise<ConversationAttribution | null> {
  return apiRequest<ConversationAttribution | null>(
    `/v1/conversations/${conversationId}/attribution`,
  );
}

export { formatActivityTime, formatContactLabel, parseApiDate };

export async function listConversationNotes(conversationId: string): Promise<ConversationNote[]> {
  return apiRequest<ConversationNote[]>(`/v1/conversations/${conversationId}/notes`);
}

export async function addConversationNote(
  conversationId: string,
  note: string,
  opts?: { pinned?: boolean },
): Promise<ConversationNote> {
  return apiRequest<ConversationNote>(`/v1/conversations/${conversationId}/notes`, {
    method: "POST",
    body: { note, pinned: opts?.pinned ?? false },
  });
}

export async function getConversationTimeline(
  conversationId: string,
  limit = 100,
): Promise<ConversationTimeline> {
  return apiRequest<ConversationTimeline>(
    `/v1/conversations/${conversationId}/timeline?limit=${limit}`,
  );
}

export async function listAiRuns(conversationId: string, limit = 50): Promise<AiRun[]> {
  return apiRequest<AiRun[]>(`/v1/conversations/${conversationId}/ai-runs?limit=${limit}`);
}

export async function patchConversation(
  conversationId: string,
  patch: { status?: "closed" | "archived"; channel_status?: "active" | "paused" },
) {
  return apiRequest<Record<string, unknown>>(`/v1/conversations/${conversationId}`, {
    method: "PATCH",
    body: patch,
  });
}

export async function postMessageFeedback(
  conversationId: string,
  messageId: number,
  rating: MessageFeedbackRating,
  correctionText?: string,
) {
  return apiRequest<{ id: number; rating: MessageFeedbackRating }>(
    `/v1/conversations/${conversationId}/messages/feedback`,
    {
      method: "POST",
      body: {
        message_id: messageId,
        rating,
        correction_text: correctionText ?? null,
      },
    },
  );
}

export async function inboxClaim(conversationId: string): Promise<ClaimResult> {
  return apiRequest<ClaimResult>(`/v1/inbox/conversations/${conversationId}/claim`, {
    method: "POST",
  });
}

export async function inboxRelease(conversationId: string): Promise<ResolveResult> {
  return apiRequest<ResolveResult>(`/v1/inbox/conversations/${conversationId}/release`, {
    method: "POST",
  });
}

export async function inboxTransfer(
  conversationId: string,
  toMembershipId: string,
): Promise<{ conversation_id: string; transferred: boolean }> {
  return apiRequest<{ conversation_id: string; transferred: boolean }>(
    `/v1/inbox/conversations/${conversationId}/transfer`,
    {
      method: "POST",
      body: { to_membership_id: toMembershipId },
    },
  );
}

export async function sendPresenceHeartbeat(online: boolean): Promise<{ online: boolean; changed: boolean }> {
  return apiRequest<{ online: boolean; changed: boolean }>(`/v1/inbox/presence/heartbeat`, {
    method: "POST",
    body: { online },
  });
}


export async function inboxReply(conversationId: string, text: string): Promise<ReplyResult> {
  return apiRequest<ReplyResult>(`/v1/inbox/conversations/${conversationId}/reply`, {
    method: "POST",
    body: { text, client_reply_id: crypto.randomUUID() },
  });
}

export async function inboxSendTemplate(
  conversationId: string,
  payload: {
    template_name: string;
    language: string;
    body_parameters?: string[];
  },
): Promise<ReplyResult> {
  return apiRequest<ReplyResult>(`/v1/inbox/conversations/${conversationId}/template`, {
    method: "POST",
    body: {
      template_name: payload.template_name,
      language: payload.language,
      body_parameters: payload.body_parameters ?? [],
      client_reply_id: crypto.randomUUID(),
    },
  });
}

/** Toggle human handoff: claim when entering manual mode, release when returning to AI. */
export async function toggleHumanHandoff(
  conversationId: string,
  currentlyHuman: boolean,
): Promise<{ human: boolean; claimed?: boolean }> {
  if (currentlyHuman) {
    await inboxRelease(conversationId);
    return { human: false };
  }
  const out = await inboxClaim(conversationId);
  return { human: out.claimed, claimed: out.claimed };
}

/** Hand off conversation back to the AI Agent */
export async function handoffToAI(conversationId: string): Promise<ResolveResult> {
  return inboxRelease(conversationId);
}

/** Hand off conversation to a human/manual agent (claims the thread) */
export async function handoffToHuman(conversationId: string): Promise<ClaimResult> {
  return inboxClaim(conversationId);
}

/** Send as a human agent — claims first when the conversation is still AI-owned. */
export async function sendHumanReply(conversationId: string, text: string, mode: string) {
  if (mode !== "human") {
    const claim = await inboxClaim(conversationId);
    if (!claim.claimed) {
      throw new Error("Someone else claimed this conversation first.");
    }
  }
  return inboxReply(conversationId, text);
}
