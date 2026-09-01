import { apiRequest, qs } from "./api";

export type EmailAutomationState =
  | "ok"
  | "not_connected"
  | "needs_reconnect"
  | "oauth_unconfigured";

export type EmailStatus = {
  google_connected: boolean;
  connected_email: string | null;
  has_read_scope: boolean;
  oauth_configured: boolean;
  auto_reply_enabled: boolean;
  state: EmailAutomationState;
  // The agent whose Knowledge Base grounds email replies. The Settings tab binds its KB uploader
  // to this id so uploaded email files become the source of truth for replies.
  agent_id: string | null;
  agent_name: string | null;
};

export type EmailProcessingStatus =
  | "pending"
  | "processing"
  | "classified"
  | "needs_review"
  | "failed";

export type EmailReplyStatus = "none" | "pending" | "sending" | "sent" | "failed";

export type EmailOutboundStatus = "pending" | "sending" | "sent" | "failed";

export type EmailOutbound = {
  id: string;
  message_id: string;
  to_email: string;
  subject: string;
  body: string;
  source: string;
  status: EmailOutboundStatus;
  error: string | null;
  gmail_id: string | null;
  sent_at: string | null;
  created_at: string | null;
};

export type EmailMessage = {
  id: string;
  sender_name: string | null;
  sender_email: string | null;
  subject: string | null;
  body: string | null;
  received_at: string | null;
  intent: string | null;
  intent_confidence: number | null;
  summary: string | null;
  generated_reply: string | null;
  processing_status: EmailProcessingStatus;
  reply_status: EmailReplyStatus;
  reply_error: string | null;
  reply_sent_at: string | null;
  created_at: string | null;
  // Present on the detail response (GET /messages/{id}, and send response): full send history.
  outbound?: EmailOutbound[];
};

export type EmailList = {
  messages: EmailMessage[];
  total: number;
  limit: number;
  offset: number;
};

// Every email call is scoped to ONE Email Agent (D269, Multi Email Agent). The dashboard resolves
// the selected `agent` id from `?agent=` and passes it here; the backend validates ownership.

export const getEmailStatus = (agent: string) =>
  apiRequest<EmailStatus>(`/v1/email/status${qs({ agent })}`);

export const setAutoReply = (agent: string, auto_reply_enabled: boolean) =>
  apiRequest<EmailStatus>(`/v1/email/settings${qs({ agent })}`, {
    method: "PUT",
    body: { auto_reply_enabled },
  });

export const listEmails = (
  agent: string,
  opts: { limit?: number; offset?: number; status?: string } = {},
) =>
  apiRequest<EmailList>(
    `/v1/email/messages${qs({ agent, limit: opts.limit ?? 25, offset: opts.offset ?? 0, status: opts.status })}`,
  );

export const getEmail = (agent: string, id: string) =>
  apiRequest<EmailMessage>(`/v1/email/messages/${id}${qs({ agent })}`);

export const generateEmailReply = (agent: string, id: string, prompt?: string) =>
  apiRequest<EmailMessage>(`/v1/email/messages/${id}/generate-reply${qs({ agent })}`, {
    method: "POST",
    body: { prompt: prompt?.trim() || null },
  });

/** Send a manual outbound email. Unlimited — a prior reply never blocks a new send. Returns the
 *  message detail with its full send history. */
export const sendEmailReply = (agent: string, id: string, body: string, subject?: string) =>
  apiRequest<EmailMessage>(`/v1/email/messages/${id}/send-reply${qs({ agent })}`, {
    method: "POST",
    body: { body, subject },
  });

export const startGoogleConnect = () =>
  apiRequest<{ authorization_url: string; expires_in: number }>(
    "/v1/calendar/google/oauth/start",
  );

/** Begin connecting this Email Agent's DEDICATED Gmail inbox (D268/D269) — separate from the
 *  workspace/calendar Google connection, and per-agent. The caller assigns `authorization_url` to
 *  `window.location`; Google returns the merchant to `/email?connected=1&agent=<id>`. */
export const startEmailGoogleConnect = (agent: string) =>
  apiRequest<{ authorization_url: string; expires_in: number }>(
    `/v1/email/google/oauth/start${qs({ agent })}`,
  );

/** Disconnect ONLY this Email Agent's dedicated Gmail connection. */
export const disconnectEmailGoogle = (agent: string) =>
  apiRequest<{ provider: string; disconnected: number }>(
    `/v1/email/google/disconnect${qs({ agent })}`,
    { method: "POST" },
  );

/** Human labels + badge tone for the semantic intent taxonomy. */
export const INTENT_LABELS: Record<string, string> = {
  enquiry: "Enquiry",
  feedback: "Feedback",
  proposal_request: "Proposal Request",
  sales_inquiry: "Sales Inquiry",
  support_request: "Support Request",
  partnership_request: "Partnership",
  complaint: "Complaint",
  general_information: "General Info",
  other: "Other",
};

export const intentLabel = (intent: string | null): string =>
  intent ? INTENT_LABELS[intent] ?? intent : "—";

export type BadgeTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "pine"
  | "warm"
  | "purple";

export const intentTone = (intent: string | null): BadgeTone => {
  switch (intent) {
    case "complaint":
      return "danger";
    case "sales_inquiry":
    case "proposal_request":
      return "success";
    case "partnership_request":
      return "purple";
    case "support_request":
      return "warning";
    case "feedback":
      return "info";
    case "other":
      return "neutral";
    default:
      return "pine";
  }
};

export const processingTone = (status: EmailProcessingStatus): BadgeTone => {
  switch (status) {
    case "classified":
      return "success";
    case "needs_review":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
};

export const processingLabel = (status: EmailProcessingStatus): string => {
  switch (status) {
    case "pending":
      return "Pending";
    case "processing":
      return "Analyzing";
    case "classified":
      return "Classified";
    case "needs_review":
      return "Needs Review";
    case "failed":
      return "Failed";
    default:
      return status;
  }
};

export const replyTone = (status: EmailReplyStatus): BadgeTone => {
  switch (status) {
    case "sent":
      return "success";
    case "pending":
    case "sending":
      return "info";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
};

export const replyLabel = (status: EmailReplyStatus): string => {
  switch (status) {
    case "none":
      return "No reply";
    case "pending":
      return "Queued";
    case "sending":
      return "Sending";
    case "sent":
      return "Replied";
    case "failed":
      return "Reply failed";
    default:
      return status;
  }
};

export const outboundTone = (status: EmailOutboundStatus): BadgeTone => {
  switch (status) {
    case "sent":
      return "success";
    case "pending":
    case "sending":
      return "info";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
};

export const outboundLabel = (status: EmailOutboundStatus): string => {
  switch (status) {
    case "pending":
      return "Queued";
    case "sending":
      return "Sending";
    case "sent":
      return "Sent";
    case "failed":
      return "Failed";
    default:
      return status;
  }
};
