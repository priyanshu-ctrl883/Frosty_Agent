import { apiRequest, qs } from "./api";
import type { EmailMessage } from "./emailAutomation";
import type { EmailTicket } from "./emailTickets";

/** One sender's whole email relationship, summarised for the Conversations list. Keyed on the
 *  sender's email; the snippet is the latest subject/summary, and `open_ticket_count` flags a live
 *  ticket. Read-only — this view never sends. */
export type EmailConversation = {
  sender_email: string;
  sender_name: string | null;
  message_count: number;
  reply_count: number;
  open_ticket_count: number;
  last_subject: string | null;
  last_snippet: string | null;
  first_email_at: string | null;
  last_email_at: string | null;
};

/** A sender's full mail history: every inbound email with its outbound replies attached (each
 *  message carries `outbound`), plus the tickets opened for them. */
export type EmailConversationDetail = {
  sender_email: string;
  sender_name: string | null;
  message_count: number;
  first_email_at: string | null;
  last_email_at: string | null;
  messages: EmailMessage[];
  tickets: EmailTicket[];
};

export const listConversations = (agent: string) =>
  apiRequest<EmailConversation[]>(`/v1/email/conversations${qs({ agent })}`);

export const getConversation = (agent: string, email: string) =>
  apiRequest<EmailConversationDetail>(
    `/v1/email/conversations/thread${qs({ agent, email })}`,
  );
