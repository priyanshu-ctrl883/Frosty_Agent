/**
 * Human labels for outbound webhook events. Keys must match the server allowlist
 * (`GET /v1/webhooks/events`); this file never invents an event the API will not emit.
 */

export const WEBHOOK_EVENT_LABELS: Record<string, string> = {
  "*": "Every event",
  "lead.created": "New lead",
  "meeting.created": "Meeting booked",
  "meeting.cancelled": "Meeting cancelled",
  "meeting.rescheduled": "Meeting rescheduled",
  "quote.approved": "Quote approved",
  "quote.rejected": "Quote rejected",
  "quote.expired": "Quote expired",
  "webhook.ping": "Test ping",
};

/**
 * Prefer a specific event as the create-form default so a first-time merchant does not
 * subscribe to `*` and firehose their CRM.
 */
export const preferredWebhookEvent = (eventTypes: string[]): string => {
  if (eventTypes.includes("lead.created")) return "lead.created";
  const specific = eventTypes.find((ev) => ev !== "*");
  return specific || eventTypes[0] || "lead.created";
};

/** Label for the create form and delivery list. Unknown types fall back to the raw key. */
export const webhookEventLabel = (eventType: string): string =>
  WEBHOOK_EVENT_LABELS[eventType] || eventType;
