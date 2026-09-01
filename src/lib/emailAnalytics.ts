import { apiRequest, qs } from "./api";
import type { EmailMessage } from "./emailAutomation";

export type EmailAnalyticsDayPoint = {
  day: string; // 'YYYY-MM-DD'
  received: number;
  replied: number;
};

export type EmailIntentCount = {
  intent: string;
  count: number;
};

/** The Email Agent's Analytics tab payload over a trailing `window_days` window. */
export type EmailAnalytics = {
  window_days: number;
  received: number;
  classified: number;
  needs_review: number;
  replied: number;
  awaiting: number;
  reply_rate: number; // 0..1
  replies_sent: number;
  auto_sent: number;
  manual_sent: number;
  ack_sent: number;
  tickets_opened: number;
  tickets_open: number;
  by_day: EmailAnalyticsDayPoint[];
  by_intent: EmailIntentCount[];
  recent: EmailMessage[];
};

export const getEmailAnalytics = (agent: string, days: number) =>
  apiRequest<EmailAnalytics>(`/v1/email/analytics/overview${qs({ agent, days })}`);
