import { apiRequest, qs } from "./api";
import type { BadgeTone, EmailMessage } from "./emailAutomation";

export type EmailTicketStatus = "open" | "closed";
export type EmailTicketReason = "repeat_intent" | "kb_miss";

export type EmailTicket = {
  id: string;
  ticket_number: string;
  sender_email: string;
  sender_name: string | null;
  intent: string;
  subject: string | null;
  status: EmailTicketStatus;
  reason: EmailTicketReason;
  message_count: number;
  first_email_at: string | null;
  last_email_at: string | null;
  created_at: string | null;
};

/** A ticket plus its member emails (this sender's messages of this intent, oldest first). Each
 *  message carries `outbound` so replies sent from this drawer show in the thread. Reply via
 *  generateEmailReply / sendEmailReply, keyed on the inbound message id. */
export type EmailTicketDetail = EmailTicket & {
  messages: EmailMessage[];
};

export const listTickets = (agent: string, opts: { status?: EmailTicketStatus } = {}) =>
  apiRequest<EmailTicket[]>(`/v1/email/tickets${qs({ agent, status: opts.status })}`);

export const getTicket = (agent: string, id: string) =>
  apiRequest<EmailTicketDetail>(`/v1/email/tickets/${id}${qs({ agent })}`);

export const closeTicket = (agent: string, id: string) =>
  apiRequest<EmailTicket>(`/v1/email/tickets/${id}/close${qs({ agent })}`, { method: "POST" });

/** Why a ticket opened, as a short human label. */
export const ticketReasonLabel = (reason: EmailTicketReason): string =>
  reason === "kb_miss" ? "Not in knowledge base" : "Repeat request";

export const ticketReasonTone = (reason: EmailTicketReason): BadgeTone =>
  reason === "kb_miss" ? "warning" : "info";

export const ticketStatusLabel = (status: EmailTicketStatus): string =>
  status === "closed" ? "Closed" : "Open";

export const ticketStatusTone = (status: EmailTicketStatus): BadgeTone =>
  status === "closed" ? "neutral" : "success";
