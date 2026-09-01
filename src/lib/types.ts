/**
 * The API as OUR server actually shapes it. Hand-written, on purpose.
 *
 * ⚠️ THIS FILE IS THE ONE D44a WARNED ABOUT. The parallel build's `types.ts` describes ITS backend
 * — bcrypt sessions carrying `merchant_id`, a `{data, error}` envelope, paged wrappers where ours
 * returns bare arrays, 153 endpoints on paths we do not serve. Copying it would have COMPILED
 * CLEANLY and rendered `undefined` in production, which is the worst available outcome: TypeScript
 * enforcing a description of a server that does not exist. Every type below was read off the
 * router, schema or repository that produces it.
 *
 * ⚠️ AND `tsc` CANNOT CHECK ANY OF IT. This file is a hand-written claim about the API and nothing
 * in the TypeScript toolchain verifies it. `apps/api/tests/test_merchant_dashboard_api_contract.py`
 * is what does — from the Python side, where the routes live.
 */

/* ---- envelope ---------------------------------------------------------------------------- */

export type ApiEnvelope<T> = {
  data?: T;
  error?: { code: string; message: string; details?: unknown };
  meta?: { request_id?: string; next_cursor?: string | null };
};

/* ---- identity (iam, tenancy) -------------------------------------------------------------- */

export type Membership = {
  merchant_id: string | null;
  role: string | null;
  is_owner: boolean;
};

export type Me = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  phone: string | null;
  phone_verified_at: string | null;
  memberships: Membership[];
  active_merchant_id: string | null;
  is_owner: boolean;
  role: string | null;
  /** Resolved per request from the caller's membership. Presentation only — the API re-checks. */
  permissions: string[];
  /**
   * Present ONLY inside a Frostrek support session (D74). Its absence is what makes an ordinary
   * session ordinary, so the banner is rendered on presence rather than on a boolean flag.
   */
  impersonation: Impersonation | null;
};

export type Impersonation = {
  session_id: string;
  merchant_id: string;
  merchant_name: string | null;
  staff_email: string | null;
  expires_at: string | null;
};

export type BootstrapResult = { merchant_id: string; created: boolean };
export type BootstrapResume = { resumed: boolean; merchant_id?: string };

/** `GET /v1/merchants/me` — the shell's merchant context. `api_key` is deliberately absent. */
export type MerchantMe = {
  id: string;
  company_name: string | null;
  plan: string;
  status: string;
  industry: string | null;
  phone: string | null;
  gstin: string | null;
  connected_to_whatsapp: boolean | null;
  conversation_retention_days: number;
  created_at: string;
  membership_id: string;
  is_owner: boolean;
  role_name: string | null;
  timezone: string | null;
  locale: string | null;
  business_hours: Record<string, unknown> | null;
  notification_prefs: Record<string, unknown> | null;
};

/* ---- analytics -------------------------------------------------------------------------- */

export type AnalyticsOverview = {
  conversations: number;
  conversations_open: number;
  /** All message rows in the window (any sender_type). Prefer charts.messages_by_day for UI “Messages”. */
  total_messages: number;
  ai_runs: number;
  ai_runs_grounded: number;
  kb_gaps: number;
  leads: number;
  leads_hot: number;
  meetings: number;
  handoffs: number;
  handoffs_queued: number;
  agents_active: number;
  window_days: number;
  conversations_by_day: { day: string; conversations: number }[];
  /* Added for the merchant Home screen (Phase E) — the KPIs the Master's §C names. Grouped in the
     service from columns of ONE row, so the parts always sum to the whole. */
  leads_by_temperature: { hot: number; warm: number; cold: number };
  /** Open RIGHT NOW, not windowed — the question is "what needs attention". */
  open_by_channel: { website: number; whatsapp: number };
  /** Looks FORWARD, unlike every other counter here. Excludes cancelled. */
  meetings_upcoming: number;
  meetings_pending_confirm: number;
  quotes_sent: number;
};

/** Campaign attribution card (D265) — conversations by ad/UTM, not leads. */
export type AttributionCampaignRow = {
  campaign_key: string;
  display_label: string | null;
  source_id: string | null;
  utm_campaign: string | null;
  utm_source: string | null;
  conversations: number;
  leads: number;
  attributed: number;
  unknown: number;
  whatsapp: number;
  website: number;
  spend_amount: string | null;
  spend_currency: string | null;
  cost_per_conversation: string | null;
  cost_per_lead: string | null;
};

export type AttributionReport = {
  window_days: number;
  period_month: string;
  totals: { conversations: number; attributed: number; unknown: number };
  campaigns: AttributionCampaignRow[];
  spend: Array<Record<string, unknown>>;
};

/* ---- notifications ---------------------------------------------------------------------- */

export type AlertCounts = { unread: number; unresolved: number; total: number };

export type MerchantAlert = {
  id: number;
  alert_type: string;
  status: string;
  resolved: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
  sent_at: string | null;
};

export type AlertPage = {
  items: MerchantAlert[];
  total: number;
  limit: number;
  offset: number;
};

/**
 * The only two values `PATCH /v1/notifications/{id}` accepts.
 *
 * ⚠️ NOT `"read"`. D50a: that value shipped in the server's own allow-list and the CHECK
 * constraint rejects it. And per the service docstring, a merchant may set `status` but never the
 * separate `resolved` boolean — that is whether the underlying CONDITION cleared, which only the
 * writer of the alert (or Frostrek) can know.
 */
export const ALERT_ACK_STATUSES = ["dismissed", "resolved"] as const;
export type AlertAckStatus = (typeof ALERT_ACK_STATUSES)[number];

/* ---- agents ----------------------------------------------------------------------------- */

export type AgentMode = "website" | "whatsapp" | "unified" | "email";
export type HandoffMode = "manual_claim" | "auto_least_load" | "auto_round_robin";

export type Agent = {
  id: string;
  merchant_id: string;
  slug: string;
  agent_name: string | null;
  mode: string;
  is_active: boolean;
  handoff_mode: string;
  current_version_id: string | null;
  use_shared_kb?: boolean;
  channels?: AgentChannel[];
};

/**
 * `agent_versions.config`, as `agent/schemas.py: AgentConfig` defines it.
 *
 * ⚠️ THERE IS NO RAW PROMPT FIELD AND THERE MUST NOT BE (D7). The merchant fills structured
 * fields; `ai_runtime/prompt/assemble.py` composes the system prompt from them. `AgentConfig` is
 * `extra='forbid'`, so an invented field is a 422 — which is why the agent screen explains the
 * absence rather than offering an editor.
 *
 * `tools` mirrors `ToolControlCfg` (`agent/schemas.py`), NOT a free-form dict. The AI runtime
 * reads `tools.meetings.mode` for capability and `tools.meetings.require_approval` for D126's
 * hold-until-approve gate. Quotes/WhatsApp carry `mode` only — quote-send approval is a merchant
 * setting (`autonomous_quote_sending`), never `tools.quotes.require_approval`.
 */
export const TOOL_MODES = ["off", "human", "ai"] as const;
export type ToolMode = (typeof TOOL_MODES)[number];

export type PromptTone = "friendly" | "professional" | "casual" | "formal" | "enthusiastic";

export type GuidedConfig = {
  persona: string;
  tone: PromptTone;
  languages: string[];
  welcome_message: string;
  fallback_message: string;
  business_hours?: Record<string, unknown>;
};

export type AutomationPolicy = {
  control_key: string;
  label: string;
  description: string;
  mode: ToolMode;
  entitlement: string | null;
  default_mode: ToolMode;
  tools: string[];
};

export type AutomationPoliciesResponse = {
  policies: AutomationPolicy[];
};

export type AgentActionRequest = {
  id: string;
  merchant_id: string;
  agent_id: string | null;
  conversation_id: string | null;
  tool_name: string;
  control_key: string;
  status: string;
  payload: Record<string, unknown>;
  resource_type: string | null;
  resource_id: string | null;
  requested_at: string;
  expires_at: string | null;
  decided_at: string | null;
  decided_by?: string | null;
  decision_note?: string | null;
};

export type AutomationRequestsResponse = {
  items: AgentActionRequest[];
  /** Total matching records in the database — used for pagination. */
  total?: number;
  limit: number;
  offset: number;
};

export type AgentConfig = {
  prompt_mode?: "guided" | "raw";
  guided?: GuidedConfig;
  raw_prompt?: string | null;
  guardrail_version?: number;

  persona: {
    agent_name: string;
    tone: PromptTone;
    business_info: string;
    dos: string[];
    donts: string[];
  };
  model: { model_id: string };
  generation: { temperature: number; max_output_tokens: number };
  rag: { tau: number; top_k: number; mode: "lenient" | "strict" };
  tools: {
    meetings?: { mode?: ToolMode; require_approval?: boolean; use_merchant_default?: boolean };
    quotes?: { mode?: ToolMode; use_merchant_default?: boolean };
    whatsapp?: { mode?: ToolMode; use_merchant_default?: boolean };
  } & Record<string, unknown>;
  handoff: { agent_idle_timeout_minutes: number; on_agent_idle: string };
  messages: {
    kb_miss_fallback: string;
    capacity_fallback: string;
    pace_fallback: string;
  };
  voice?: {
    reply_mode?: "off" | "on" | "auto";
    voice_name?: string | null;
    tts_model?: string | null;
    stt_model?: string | null;
  };
};

export type AgentVersion = {
  id: string;
  agent_id: string;
  version_number: number;
  prompt_mode?: "guided" | "raw";
  config: AgentConfig;
};


export type AgentChannel = {
  id: string;
  agent_id: string;
  channel: string;
  enabled: boolean;
  settings: Record<string, unknown>;
};

/* ---- knowledge base ---------------------------------------------------------------------- */

export type KbSource = {
  source_id: string;
  filename: string | null;
  status: string;
  progress: number | null;
  size_bytes: number | null;
  error: string | null;
  agent_id?: string | null;
  source_type?: string;
  chunk_count?: number | null;
  scrape_url?: string | null;
  total_pages?: number | null;
  pages_scraped?: number | null;
  stopped_reason?: string | null;
  pages_stopped_at?: number | null;
  max_depth?: number | null;
};

export type KbGap = {
  id: string;
  agent_id: string | null;
  conversation_id: string | null;
  query_text: string;
  status: string;
  created_at: string;
};

export type KbSchedule = {
  id: string;
  agent_id: string | null;
  scrape_url: string;
  interval: string;
  is_active: boolean;
  last_run_at: string | null;
};

export type KbSearchResult = {
  chunk_id: string;
  chunk_text: string;
  source_name: string;
  score: number;
  page_type: string | null;
};

/* ---- widget (channels_web) --------------------------------------------------------------- */

export type QuickLink = { label: string; url?: string | null };

export type WidgetAppearance = {
  title: string;
  greeting: string;
  color: string;
  logo_url: string;
  position: "bottom-right" | "bottom-left";
  launcher_label: string;
  consent_notice: string;
  quick_links: QuickLink[];
};

export type WidgetSettings = {
  appearance: WidgetAppearance;
  /** §G: "Website channel disabled → snippet page warns 'channel off'". Only the server knows. */
  channel_enabled: boolean;
  /** Website agent these settings belong to (D206). */
  agent_id?: string | null;
  /** In FULL, and deliberately unlike `/v1/settings`, which masks it (D58/D59). */
  publishable_key: string | null;
  embed_snippet: string;
};

export type WidgetKeyRotation = {
  publishable_key: string;
  publishable_key_masked: string;
  widget_needs_update: boolean;
};

/* ---- WhatsApp ---------------------------------------------------------------------------- */

export type WaAccount = {
  id: number;
  merchant_id: string;
  phone_number_id: string;
  waba_id: string;
  phone_number: string | null;
  label: string | null;
  is_default: boolean;
  is_active: boolean;
  quality_rating: string | null;
  created_at: string;
  agent_id?: string | null;
};

export type WaTemplate = {
  id: number;
  wa_account_id: number;
  template_name: string;
  meta_template_id: string | null;
  status: string;
  category: string | null;
  language: string;
  last_synced_at: string | null;
};

export type WaDeliveryIssue = {
  source: string;
  from_number: string | null;
  to_number: string | null;
  message_id: string | null;
  detail: string | null;
  created_at: string;
};

/* ---- unified ----------------------------------------------------------------------------- */

export type UnifiedSettings = {
  enabled: boolean;
  cta_label: string;
  wa_number: string | null;
  /** Resolved server-side. `false` means the PATCH will refuse with `entitlement_required`. */
  entitled: boolean;
  redemption_wired: boolean;
};

/* ---- inbox (handoff) --------------------------------------------------------------------- */

export type QueueItem = {
  handoff_id: string;
  conversation_id: string;
  trigger_reason: string | null;
  channel: string;
  contact_label: string | null;
  agent_id?: string | null;
  waiting_since: string;
  last_message_at: string | null;
};

export type ActiveConversation = {
  conversation_id: string;
  channel: string;
  mode: string;
  contact_label: string | null;
  assigned_to_member_id: string | null;
  handoff_status: string | null;
  agent_id?: string | null;
  last_message_at: string | null;
  last_message_preview?: string | null;
  created_at: string;
};

export type InboxMessage = {
  id: number;
  sender_type: string;
  body: string | null;
  created_at: string;
  author_name?: string | null;
};

export type ClaimResult = {
  conversation_id: string;
  claimed: boolean;
  idle_deadline_at: string | null;
};

export type ReplyResult = {
  conversation_id: string;
  sent: boolean;
  wamid: string | null;
  duplicate: boolean;
};

export type ResolveResult = {
  conversation_id: string;
  disposition: string;
  closed: boolean;
  already_closed: boolean;
};

export type HeartbeatResult = { online: boolean; changed: boolean };

/** One frame off `GET /v1/inbox/ws`. `kind: "ready"` is the handshake, not an event. */
export type InboxEvent = {
  id?: number;
  kind: string;
  conversation_id?: string | null;
  handoff_id?: string | null;
  actor_member_id?: string | null;
  created_at?: string;
  replayed?: boolean;
  generation?: number;
  membership_id?: string | null;
  payload?: Record<string, unknown>;
};

/* ---- conversations ---------------------------------------------------------------------- */

export type Conversation = {
  id: string;
  contact_id: string | null;
  agent_id: string | null;
  channel: string;
  mode: string;
  status: string;
  credit_settled: boolean;
  credits_charged: number;
  idle_expires_at: string | null;
  created_at: string;
  updated_at?: string | null;
  contact_label?: string | null;
  last_message_preview?: string | null;
  last_message_at?: string | null;
};

export type ConversationMessage = {
  id: number;
  sender_type: string;
  text: string;
  created_at: string;
};

/* ---- leads ------------------------------------------------------------------------------ */

export const LEAD_TEMPERATURES = ["cold", "warm", "hot"] as const;
export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
] as const;

export type LeadTemperature = (typeof LEAD_TEMPERATURES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type Lead = {
  id: number;
  merchant_id: string;
  contact_id: string | null;
  conversation_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  interest: string | null;
  budget: string | null;
  source: string | null;
  channel: string | null;
  score: number;
  temperature: string;
  status: string;
  verification_grade?: string;
  marketing_opt_out?: boolean;
  follow_up_sent: boolean;
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, unknown>;
};

export type LeadCustomField = {
  id: string;
  merchant_id: string;
  field_key: string;
  label: string;
  field_type: string;
  options: string[];
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TableColumnPref = {
  key: string;
  visible: boolean;
  width: number;
  order: number;
  label_override: string | null;
};

export type TablePreferences = {
  columns: TableColumnPref[];
  default_sort?: { key: string; dir: "asc" | "desc" };
  default_filters?: Record<string, unknown>;
  density?: "comfortable" | "compact";
  updated_at?: string | null;
};

export type LeadStats = {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  new_today: number;
  converted: number;
};

export type FollowUpDelivery = {
  id: string;
  lead_id?: number;
  channel: string;
  status: string;
  sequence_step: number;
  trigger_kind: string;
  scheduled_at: string;
  sent_at: string | null;
  error: string | null;
  created_at: string;
  subject?: string | null;
  body?: string | null;
  recipient?: string | null;
};

export type FollowUpSettings = {
  auto_enabled: boolean;
  step_days: number[];
  channels: string[];
  email_subject_template: string;
  email_body_template: string;
  whatsapp_body_template: string;
  updated_at?: string | null;
};

export type LeadScoringEvent = {
  id: number;
  lead_id: number;
  previous_score: number | null;
  new_score: number;
  previous_temperature: LeadTemperature | null;
  new_temperature: LeadTemperature;
  reason: string;
  triggered_by: "system" | "manual" | "ai";
  actor_id: string | null;
  created_at: string;
};

export type LeadDetail = {
  lead: Lead;
  score_history: LeadScoringEvent[];
};

/* ---- meetings + calendar ---------------------------------------------------------------- */

export const MEETING_STATUSES = [
  "pending_approval",
  "scheduled",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
  "rescheduled",
] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export type Meeting = {
  id: string;
  merchant_id: string;
  title: string;
  description: string | null;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  timezone: string | null;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
  conversation_id: string | null;
  /** 0087 — the contact this meeting is with, resolved at insert. Erasure reaches this row. */
  contact_id: string | null;
  meet_link: string | null;
  google_event_id: string | null;
  calendly_event_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  /** Not a column: what the last calendar sync did, so "saved" and "on the calendar" differ. */
  calendar_sync: string | null;
};

export type CalendarConnection = {
  id: number;
  merchant_id: string;
  owner_membership_id: string | null;
  provider: string;
  email: string | null;
  token_expiry: string | null;
  scope: string | null;
  calendly_user_uri: string | null;
  connected: boolean;
  created_at: string;
  updated_at: string;
};

export type CalendarStatus = {
  connections: CalendarConnection[];
  connected_providers: string[];
  /** `false` = the Google credentials are absent, so the consent flow cannot complete (D53c). */
  oauth_configured: boolean;
};

/* ---- quotations + catalog --------------------------------------------------------------- */

export const QUOTE_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
  "revised",
] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export type QuoteLineItem = {
  id: string;
  product_id: string | null;
  description: string | null;
  /** Money and quantities arrive as exact numeric strings. Never parse them into a float. */
  quantity: string;
  unit_price: string;
  line_total: string;
  sort_order: number;
};

export type Quotation = {
  id: string;
  merchant_id: string;
  title: string;
  content: string | null;
  status: string;
  currency: string;
  amount: string;
  gst_rate: string;
  gst_amount: string;
  total_with_gst: string;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  conversation_id: string | null;
  lead_id: number | null;
  expires_at: string | null;
  viewed_at?: string | null;
  followup_opt_out?: boolean;
  revised_from_id?: string | null;
  pdf_file_object_id: string | null;
  created_at: string;
  updated_at: string;
  tax_treatment?: string;
  pending_approval?: boolean;
  can_approve?: boolean;
  followup?: QuoteFollowupState | null;
  items: QuoteLineItem[];
};

export type QuoteFollowupDelivery = {
  id: string;
  channel: string;
  sequence_step: number;
  status: string;
  scheduled_at?: string | null;
  sent_at?: string | null;
  error?: string | null;
};

export type QuoteFollowupState = {
  status: "none" | "active" | "paused" | "cancelled" | "completed";
  next_step?: number | null;
  next_scheduled_at?: string | null;
  recent_deliveries?: QuoteFollowupDelivery[];
};

export type QuoteTemplate = {
  id: string;
  merchant_id: string;
  name: string;
  intro: string;
  terms: string;
  footer: string;
  validity_days: number;
  variables: string[];
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type QuoteSendResult = {
  delivery_id: string;
  status: string;
  channel: string;
  recipient: string | null;
  /** `false` for WhatsApp — it still needs an approved template (D53b). */
  transport_configured: boolean;
};

export type Product = {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  unit_price: string;
  currency: string;
  sku?: string | null;
  category?: string | null;
  is_active: boolean;
  created_at: string;
};

/* ---- billing ---------------------------------------------------------------------------- */

export type Plan = {
  id: string;
  slug: string;
  name: string;
  plan_family?: "trial" | "core" | "commerce" | "enterprise" | string;
  market?: "in" | "intl";
  currency?: "INR" | "USD";
  price_monthly?: string;
  price_quarterly?: string | null;
  price_semi_annual?: string | null;
  price_annual?: string;
  monthly_available?: boolean;
  price_monthly_inr: string;
  price_quarterly_inr?: string | null;
  price_semi_annual_inr?: string | null;
  price_annual_inr: string;
  price_monthly_usd?: string | null;
  price_quarterly_usd?: string | null;
  price_semi_annual_usd?: string | null;
  price_annual_usd?: string | null;
  setup_fee_inr: string;
  setup_fee_required?: boolean;
  included_conversations: number | null;
  allows_whatsapp: boolean;
  is_active: boolean;
  overage_rate?: string | null;
  overage_rate_inr?: string | null;
  overage_rate_usd?: string | null;
  included_seats?: number | null;
  sandbox_limit?: number | null;
  list_price_monthly?: string | null;
  list_price_monthly_inr?: string | null;
  show_launch_badge?: boolean;
};

export type Wallet = {
  merchant_id: string;
  unallocated_credits: string;
  total_credits_purchased: string;
  total_credits_spent: string;
  /** Spend inside the CURRENT billing period. The quota bar must use this, never the lifetime one. */
  credits_used_this_period: string;
  /** Accrued overage this period, invoiced at renewal. */
  overage_spend_inr?: string;
  /** When the period figure resets. Null for a merchant with no subscription row yet. */
  period_end: string | null;
};

export type LedgerEntry = {
  id: number;
  transaction_type: string;
  credits: string;
  balance_after: string | null;
  amount_inr: string | null;
  conversation_id: string | null;
  agent_id: string | null;
  notes: string | null;
  created_at: string;
};

export type Subscription = {
  id: string;
  plan_id: string;
  plan_slug: string | null;
  status: string;
  billing_cycle: string;
  razorpay_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  setup_fee_paid: boolean;
  autopay_state?: string | null;
  merchant_can_cancel?: boolean;
  cancel_at?: string | null;
  payment_method_id?: string | null;
  created_at: string;
};

export type SubscribeResult = {
  subscription_id: string;
  razorpay_subscription_id: string;
  short_url: string;
  status: string;
};

export type AddonCheckoutResult = {
  payment_link_id: string;
  short_url: string;
  reference_id: string;
  addon_type: string;
  amount_inr: string;
};

export type TopupResult = {
  payment_link_id: string;
  short_url: string;
  credits: number;
  amount_inr: string;
};

export type CancelResult = { status: string; cancel_at: string | null };

export type PaymentMethod = {
  id: string;
  method_type: string;
  display_last4: string | null;
  display_network: string | null;
  display_bank: string | null;
  display_label: string | null;
  is_primary: boolean;
  is_default: boolean;
  authenticated_at: string | null;
  created_at: string;
};

export type AddPaymentMethodOut = {
  status?: string;
  setup_intent_id?: string | null;
  razorpay_order_id?: string | null;
  razorpay_key_id?: string | null;
  razorpay_customer_id?: string | null;
  payment_method?: PaymentMethod | null;
  setup_intent?: {
    order_id: string;
    key_id: string;
    amount: number;
    currency: string;
    customer_id?: string;
  } | null;
};


/* ---- settings --------------------------------------------------------------------------- */

export type MerchantSettings = {
  merchant_id: string;
  company_name: string;
  industry: string | null;
  phone: string | null;
  gstin: string | null;
  plan: string;
  status: string;
  timezone: string | null;
  locale: string | null;
  autonomous_quote_sending: boolean | null;
  /** Off by default — when true, minting a lead with email sends a confirm link (no OTP). */
  require_lead_verification?: boolean | null;
  gst_rate: number | null;
  business_hours: Record<string, unknown> | null;
  notification_prefs: Record<string, unknown> | null;
  gdpr_settings: Record<string, unknown> | null;
  conversation_retention_days: number | null;
  overage_enabled: boolean | null;
  overage_cap_inr: number | null;
  newsletter_opt_in?: boolean | null;
  newsletter_channels?: { email?: boolean; whatsapp?: boolean; sms?: boolean } | null;
  newsletter_opted_at?: string | null;
  /** The MASK. The full key comes only from the rotate call, or from `/v1/widget/settings`. */
  publishable_key_masked: string | null;
  updated_at: string | null;
};

export type ApiKeyRotation = {
  publishable_key: string;
  publishable_key_masked: string;
  widget_needs_update: boolean;
};

/* ---- team ------------------------------------------------------------------------------- */

export type TeamMember = {
  membership_id: string;
  user_id: string;
  email: string;
  display_name: string;
  role_name: string | null;
  is_owner: boolean;
  is_active: boolean;
  created_at: string;
  /** `false` = the user row exists but has no Supabase identity yet, so they cannot sign in. */
  can_sign_in: boolean;
};

export type PendingInvite = {
  invite_id: string;
  invited_email: string;
  role_name: string | null;
  expires_at: string;
  created_at: string;
};

export type Team = {
  members: TeamMember[];
  pending_invites: PendingInvite[];
  /** Server-authoritative seat count (active members + pending invites). */
  seats_used?: number;
};

/**
 * `invite_token` is returned ONCE and never stored — only its SHA-256 is.
 * `delivery: "not_sent"` because there is no email provider on this path: the merchant sends the
 * link themselves, and the UI has to say so rather than implying an email went out.
 */
export type InviteCreated = {
  invite_id: string;
  invited_email: string;
  role_name: string;
  expires_at: string;
  invite_token: string;
  delivery: string;
};

export type InvitePreview = {
  company_name: string;
  invited_email: string;
  expires_at: string;
};

export type InviteAccepted = {
  membership_id: string;
  merchant_id: string;
  accepted: boolean;
};

export type Role = {
  id: string;
  name: string;
  label: string;
  permissions: string[];
};

/* ---- webhooks --------------------------------------------------------------------------- */

export type WebhookEndpoint = {
  id: string;
  merchant_id: string;
  event_type: string;
  target_url: string;
  /** The MASK. `signing_secret` on the create response is the only full disclosure. */
  secret: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WebhookCreated = WebhookEndpoint & { signing_secret: string };

/** `POST /v1/webhooks/{id}/ping` queues a test; it does not wait for the HTTP POST. */
export type WebhookPing = {
  delivery_id: string;
  status: string;
  queued: boolean;
};

export type WebhookDelivery = {
  id: string;
  endpoint_id: string;
  merchant_id: string;
  event_type: string;
  status: string;
  attempt_count: number;
  response_code: number | null;
  response_body: string | null;
  next_retry_at: string | null;
  created_at: string;
};

/* ---- audit ------------------------------------------------------------------------------ */

export type AuditEvent = {
  id: number;
  action: string;
  actor_id: string | null;
  actor_type: string | null;
  resource_type: string | null;
  resource_id: string | null;
  status: string | null;
  details: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
};

export type AuditPage = {
  items: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
};

/* ---- contacts --------------------------------------------------------------------------- */

export type TimelineEntry = Record<string, unknown> & {
  kind?: string;
  created_at?: string;
};

/** GET /v1/analytics/quality — Master §15's signals. Percentiles are NULL when there is no data:
 *  "no data" and "0 ms" are different facts and the screen must render them differently. */
export type AnalyticsQuality = {
  window_days: number;
  runs: number;
  /** The percentile denominator: runs that streamed a token AND recorded an end-to-end latency.
   *  Refusals are in `runs` and not here, which is why all four percentiles are comparable. */
  timed_runs: number;
  ttft_p50_ms: number | null;
  ttft_p95_ms: number | null;
  latency_p50_ms: number | null;
  latency_p95_ms: number | null;
  /** ⚠️ NOT `1 - grounding_fail_rate`. `grounding_ok` is three-valued and NULL means the gate never
   *  decided, so the complement counts every un-decided turn as a KB success. Render THIS. */
  grounded_rate: number;
  grounding_fail_rate: number;
  refuse_rate: number;
  kb_gap_rate: number;
  feedback_count: number;
  thumbs_down_rate: number;
  /** Present only when ?advanced=true AND the merchant has `advanced_analytics`. */
  by_day?: { day: string; runs: number; grounding_fails: number }[];
};

/** GET /v1/analytics/usage — credits at CONVERSATION grain, cost at MODEL CALL grain. */
export type AnalyticsUsage = {
  window_days: number;
  conversations: number;
  credits_charged: number;
  credits_balance: number;
  by_model: { model: string; calls: number; prompt_tokens: number; completion_tokens: number }[];
};

/** GET /v1/analytics/charts — time-series payloads for the Analytics page. */
export type AnalyticsCharts = {
  window_days: number;
  messages_by_day: { day: string; messages: number }[];
  topics: {
    total: number;
    items: { label: string; count: number; color: string }[];
  };
  leads: {
    by_day: { day: string; new: number; followed: number }[];
    period_leads: number;
    followed_up: number;
  };
  peak_hours: {
    by_hour: number[];
    peak_hour: number;
    peak_label: string;
  };
  heatmap: { dow: number; hour: number; count: number }[];
  sessions: {
    total_sessions: number;
    leads_captured: number;
    resolved: number;
    avg_msgs_per_session: number;
    engagement_score_pct: number;
    busiest_day: string;
  };
  conversion_trend: {
    by_day: { day: string; rate_pct: number; conversations: number; leads: number }[];
    avg_rate_pct: number;
    peak_rate_pct: number;
  };
  credits_by_day: { day: string; credits: number }[];
  burn_rate_per_day: number;
};

/* ---- Billing config 0095 ----------------------------------------------------------------- */

/** GET /v1/billing/config — platform-wide billing defaults (singleton billing_config table). */
export type BillingConfig = {
  sandbox_conversation_limit: number;
  included_seats: number;
  /** Exact numeric as text — floats never touch money. */
  additional_seat_price_inr: string;
  /** Usage % at which the warning banner fires (1–100). */
  usage_warning_threshold_pct: number;
  extra_channel_price_inr?: string | null;
  extra_channel_price_usd?: string | null;
  extra_channel_bonus_conversations?: number | null;
  guarantee_usage_threshold_pct?: number | null;
  guarantee_refund_window_days?: number | null;
  require_autopay_before_trial?: boolean;
  self_cancel_allowed?: boolean;
};

/** GET /v1/billing/overage — per-merchant overage toggle state. */
export type OverageSettings = {
  overage_enabled: boolean;
  overage_cap_inr: string | null;
};

/** GET /v1/billing/seats — seat counts and estimated charge (display only). */
export type SeatsInfo = {
  included_seats: number;
  seats_used: number;
  additional_seats: number;
  /** Exact numeric as text. */
  additional_seat_price_inr: string;
  /** Exact numeric as text. */
  estimated_seat_charge_inr: string;
  /** True when extra seats check out via POST /addons/checkout. */
  seat_billing_active: boolean;
};

export type TaxInvoice = {
  id: string;
  invoice_number: string;
  invoice_type: string;
  status: string;
  subtotal_inr: string;
  gst_amount_inr: string;
  total_inr: string;
  gst_rate: string;
  tax_treatment?: string | null;
  billing_period_start?: string | null;
  billing_period_end?: string | null;
  issued_at?: string | null;
  paid_at?: string | null;
};

export interface TicketNotification {
  id: string;
  ticket_id: string;
  ticket_number?: string | null;
  subject?: string | null;
  priority?: string | null;
  status?: string | null;
  merchant_id: string;
  merchant_name?: string | null;
  recipient_role: string;
  recipient_user_id?: string | null;
  event_type: string;
  title: string;
  message: string;
  actor_name: string;
  actor_user_id?: string | null;
  is_internal: boolean;
  read_at?: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

