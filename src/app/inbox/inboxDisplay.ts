/** Shared inbox contact labels, session codes, and avatar rules. */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PHONE_LIKE_RE = /^\+?\d[\d\s()-]{7,}$/;

export type InboxChannel = "whatsapp" | "website" | string | null | undefined;

export const formatInboxSessionCode = (
  conversationId: string,
  channel: InboxChannel,
): string => {
  const raw = conversationId.replace(/-/g, "").slice(-6).toUpperCase();
  const prefix = channel === "whatsapp" ? "#WA" : "#WB";
  return `${prefix}-${raw}`;
};

export const isPhoneLikeLabel = (label: string | null | undefined): boolean => {
  const trimmed = label?.trim();
  if (!trimmed) return false;
  return PHONE_LIKE_RE.test(trimmed.replace(/\s/g, ""));
};

export const isGenericInboxContact = (
  label: string | null | undefined,
  channel?: InboxChannel,
): boolean => {
  const trimmed = label?.trim();
  if (!trimmed || UUID_RE.test(trimmed)) return true;
  if (trimmed === "Visitor" || trimmed === "WhatsApp contact") return true;
  if (channel === "whatsapp" && isPhoneLikeLabel(trimmed)) return true;
  if (trimmed.startsWith("#WB-") || trimmed.startsWith("#WA-") || trimmed.startsWith("#WEB-")) {
    return true;
  }
  return trimmed.replace(/[^a-zA-Z]/g, "").length < 2;
};

export const isInboxPersonName = (
  label: string | null | undefined,
  channel?: InboxChannel,
): boolean => {
  const trimmed = label?.trim();
  if (!trimmed || UUID_RE.test(trimmed)) return false;
  if (trimmed === "Visitor" || trimmed === "WhatsApp contact") return false;
  if (channel === "whatsapp" && isPhoneLikeLabel(trimmed)) return false;
  return trimmed.replace(/[^a-zA-Z]/g, "").length >= 2;
};

/** Sidebar / list row — never show raw phone numbers for WhatsApp. */
export const formatInboxListLabel = (
  contactLabel: string | null | undefined,
  conversationId: string,
  channel: InboxChannel,
): string => {
  if (isInboxPersonName(contactLabel, channel)) return contactLabel!.trim();
  return formatInboxSessionCode(conversationId, channel);
};

/** Thread / modal header — website falls back to session code; WhatsApp falls back to phone. */
export const formatInboxHeaderLabel = (
  contactLabel: string | null | undefined,
  conversationId: string,
  channel: InboxChannel,
  phoneFallback?: string | null,
): string => {
  if (isInboxPersonName(contactLabel, channel)) return contactLabel!.trim();
  if (channel === "whatsapp") {
    const phone = phoneFallback?.trim() || (isPhoneLikeLabel(contactLabel) ? contactLabel!.trim() : "");
    if (phone) return phone.startsWith("+") ? phone : `+${phone.replace(/^\+/, "")}`;
    return formatInboxSessionCode(conversationId, channel);
  }
  return formatInboxSessionCode(conversationId, channel);
};

export const getInboxInitials = (label: string): string => {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "V";
  if (parts.length === 1 && parts[0]) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0]?.[0] || "";
  const last = parts[parts.length - 1]?.[0] || "";
  return (first + last).toUpperCase() || "V";
};

export const shouldUseInboxUserIcon = (
  contactLabel: string | null | undefined,
  channel: InboxChannel,
): boolean => isGenericInboxContact(contactLabel, channel);

const WA_CSW_MS = 24 * 60 * 60 * 1000;

/** True when the WhatsApp 24h customer-service window has expired (no recent inbound user message). */
export const isWhatsAppWindowExpired = (
  messages: { sender_type: string; created_at: string }[],
  channel: InboxChannel,
): boolean => {
  if (channel !== "whatsapp") return false;
  const inbound = messages.filter(
    (m) => m.sender_type === "user" || m.sender_type === "contact",
  );
  if (!inbound.length) return false;
  const lastInbound = inbound.reduce((latest, m) =>
    new Date(m.created_at).getTime() > new Date(latest.created_at).getTime() ? m : latest,
  );
  return Date.now() - new Date(lastInbound.created_at).getTime() > WA_CSW_MS;
};

/** Heuristic for handoff queue rows before messages are loaded. */
export const isWhatsAppQueueItemLikelyExpired = (item: {
  channel: string;
  last_message_at?: string | null;
  waiting_since?: string | null;
}): boolean => {
  if (item.channel !== "whatsapp") return false;
  if (item.last_message_at) {
    return Date.now() - new Date(item.last_message_at).getTime() > WA_CSW_MS;
  }
  if (item.waiting_since) {
    return Date.now() - new Date(item.waiting_since).getTime() > WA_CSW_MS;
  }
  return false;
};
