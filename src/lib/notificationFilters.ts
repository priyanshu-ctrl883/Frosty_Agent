import type { MerchantAlert } from "@/lib/types";
import { isUnread } from "@/lib/alerts";

export type NotificationChannel =
  | "all"
  | "website"
  | "whatsapp"
  | "inbox"
  | "meetings"
  | "billing"
  | "leads"
  | "knowledge"
  | "system";

export type NotificationStatusFilter = "all" | "unread" | "dismissed" | "resolved";

export const NOTIFICATION_CHANNEL_OPTIONS: { value: NotificationChannel; label: string }[] = [
  { value: "all", label: "All channels" },
  { value: "website", label: "Website agent" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "inbox", label: "Inbox & handoffs" },
  { value: "meetings", label: "Meetings & calendar" },
  { value: "billing", label: "Billing & credits" },
  { value: "leads", label: "Leads" },
  { value: "knowledge", label: "Knowledge base" },
  { value: "system", label: "System & support" },
];

export const NOTIFICATION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "hot_lead_detected", label: "Hot lead detected" },
  { value: "custom", label: "Custom / handoff" },
  { value: "wa_send_failed", label: "WhatsApp delivery" },
  { value: "calendar_sync_failed", label: "Calendar sync failed" },
  { value: "erasure_calendar_failed", label: "GDPR calendar removal" },
  { value: "credit_warning_80", label: "Credits at 80%" },
  { value: "credit_warning_100", label: "Credits exhausted" },
  { value: "payment_failed", label: "Payment failed" },
  { value: "handoff_queue_full", label: "Handoff queue full" },
  { value: "handoff_sla_breach", label: "Handoff SLA breach" },
  { value: "kb_ingestion_failed", label: "KB ingestion failed" },
  { value: "kb_storage_warning", label: "KB storage warning" },
  { value: "impersonation_request", label: "Support access request" },
];

export const NOTIFICATION_STATUS_OPTIONS: { value: NotificationStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "unread", label: "Unread only" },
  { value: "dismissed", label: "Dismissed" },
  { value: "resolved", label: "Resolved" },
];

export const NOTIFICATION_DATE_OPTIONS: { value: string; label: string; days: number | null }[] = [
  { value: "all", label: "All time", days: null },
  { value: "7", label: "Last 7 days", days: 7 },
  { value: "14", label: "Last 14 days", days: 14 },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
];

export const inferNotificationChannel = (alert: MerchantAlert): NotificationChannel => {
  const type = alert.alert_type;
  const kind = String(alert.data?.kind || "");

  if (type === "hot_lead_detected") return "leads";
  if (type.startsWith("wa_")) return "whatsapp";
  if (kind === "handoff_requested" || type.includes("handoff")) return "inbox";
  if (
    kind === "meeting_needs_approval" ||
    type.includes("calendar") ||
    type.includes("meeting") ||
    type === "erasure_calendar_failed"
  ) {
    return "meetings";
  }
  if (type.includes("credit") || type === "payment_failed") return "billing";
  if (type.startsWith("kb_")) return "knowledge";
  if (type.includes("agent_probe") || kind.includes("agent_probe")) return "website";
  if (type === "impersonation_request") return "system";
  if (type === "custom" && kind === "handoff_requested") return "inbox";
  return "system";
};

export const matchesNotificationChannel = (
  alert: MerchantAlert,
  channel: NotificationChannel,
): boolean => channel === "all" || inferNotificationChannel(alert) === channel;

export const matchesNotificationAgent = (
  alert: MerchantAlert,
  agentId: string,
): boolean => {
  if (!agentId || agentId === "all") return true;
  const raw = alert.data?.agent_id ?? alert.data?.agentId;
  return raw != null && String(raw) === agentId;
};

export const matchesNotificationDate = (
  alert: MerchantAlert,
  days: number | null,
): boolean => {
  if (days == null) return true;
  const created = new Date(alert.created_at).getTime();
  if (Number.isNaN(created)) return true;
  return created >= Date.now() - days * 86_400_000;
};

export const matchesNotificationStatus = (
  alert: MerchantAlert,
  status: NotificationStatusFilter,
): boolean => {
  if (status === "all") return true;
  if (status === "unread") return isUnread(alert);
  return alert.status === status;
};

export const applyNotificationFilters = (
  items: MerchantAlert[],
  filters: {
    channel: NotificationChannel;
    agentId: string;
    dateDays: number | null;
    status: NotificationStatusFilter;
  },
): MerchantAlert[] =>
  items.filter(
    (item) =>
      matchesNotificationChannel(item, filters.channel) &&
      matchesNotificationAgent(item, filters.agentId) &&
      matchesNotificationDate(item, filters.dateDays) &&
      matchesNotificationStatus(item, filters.status),
  );

export const usesClientSideNotificationFilters = (filters: {
  channel: NotificationChannel;
  agentId: string;
  dateDays: number | null;
  status: NotificationStatusFilter;
}): boolean =>
  filters.channel !== "all" ||
  filters.agentId !== "all" ||
  filters.dateDays != null ||
  filters.status === "dismissed" ||
  filters.status === "resolved";
