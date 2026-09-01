/**
 * Plan entitlements — what the merchant has PAID for, as distinct from what their role permits.
 *
 * The two are different refusals and the Master says so: `forbidden` is a role problem and gets
 * "ask your owner"; `feature_not_entitled` is a plan problem and gets the upgrade CTA ("Soft lock —
 * 'Not on your plan.' Never silent fail"). `app/core/authz.py` keeps them as two distinct error
 * codes for exactly this reason.
 *
 * ⚠️ THE KEYS ARE OUR DATABASE'S, NOT THE MASTER'S PROSE. The doc writes `channels.whatsapp` and
 * `features.meetings_calendar`; `tenant_admin.plan_feature_defaults` holds `channel_whatsapp` and
 * `meeting_scheduling`. The parallel build's nav gates on the doc's spelling, which resolves to
 * `undefined` against our API — falsy, so it would have hidden WhatsApp, Unified, Meetings, Quotes
 * and Webhooks from every merchant on every plan. Migration 0039 documents the mapping;
 * `test_merchant_dashboard_api_contract.py` asserts this list against the table.
 */

export const MERCHANT_FEATURES = [
  "advanced_analytics",
  "api_access",
  "channel_unified",
  "channel_web",
  "channel_whatsapp",
  "human_handoff",
  "knowledge_base",
  "lead_capture",
  "live_voice",
  "meeting_scheduling",
  "multi_calendar",
  "multi_whatsapp",
  "quotations",
  "raw_prompt",
  "sandbox_preview",
  "team_rbac",
  "voice_messages",
  "voice_replies",
  "webhooks",
] as const;

export type MerchantFeature = (typeof MERCHANT_FEATURES)[number];

export type Entitlements = {
  plan_slug: string | null;
  plan_name: string | null;
  subscription_status: string | null;
  setup_fee_paid: boolean | null;
  setup_fee_required?: boolean | null;
  features: Record<string, boolean>;
  overridden: string[];
  limits: Record<string, number>;
  /** Per limit (D78) — `max_team_members` and `max_kb_mb` are applied by the API;
   *  `max_conversations_per_month` is bounded by the credit wallet instead. */
  limits_enforced: Record<string, boolean>;
  // ─── Added by billing config 0095 ──────────────────────────────────────────
  /** True when the merchant is at >= usage_warning_threshold_pct of their plan allocation. */
  warn_80?: boolean;
  /** True when the conversation wallet is exhausted (balance < 1). UI may still allow AI if overage is on. */
  warn_100?: boolean;
  /** True when the wallet is empty AND overage is disabled — AI is blocked. */
  at_capacity?: boolean;
  /** Whether overage billing is currently enabled for this merchant. */
  overage_enabled?: boolean;
  /** Sandbox conversations consumed this billing period. */
  sandbox_conversations_used?: number | null;
  /** Platform-configured sandbox conversation limit per period. */
  sandbox_conversation_limit?: number | null;
  /** Number of seats included in the plan. */
  included_seats?: number | null;
  /**
   * Merchant tax position for Frostrek invoices / add-on pricing (domestic GST vs zero-rated export).
   * Same vocabulary as `invoices.tax_treatment` / `quotations.tax_treatment`.
   */
    tax_treatment?: "domestic" | "export" | null;
  /** Active agent count per enforced channel limit (website includes unified). */
  limit_usage?: Record<string, number>;
  /** Agents counted toward each channel limit — for billing/downgrade clarity. */
  channel_limit_agents?: Record<string, Array<{ name: string; mode: string }>>;
};

/**
 * Is this feature on the merchant's plan?
 *
 * Absent is FALSE, deliberately and not by accident: `GET /v1/entitlements` returns a total map
 * over the catalogue, so a missing key means the client and the server disagree about the
 * vocabulary — and in that situation the safe answer is "no". `resolve_entitlement` fails closed
 * the same way.
 */
export function canFeature(
  ent: Entitlements | null | undefined,
  feature: MerchantFeature,
): boolean {
  return Boolean(ent?.features?.[feature]);
}

/** Merchant/subscription halted for non-payment (dunning). Not the same as cancelled. */
export function isSuspended(ent: Entitlements | null | undefined): boolean {
  return ent?.subscription_status === "suspended";
}

/** Subscription ended — plan_slug may still name the last paid tier; do not treat it as live. */
export function isCancelled(ent: Entitlements | null | undefined): boolean {
  return ent?.subscription_status === "cancelled";
}

/** Agents should not be answering / config is read-only. */
export function isServiceStopped(ent: Entitlements | null | undefined): boolean {
  return isSuspended(ent) || isCancelled(ent);
}

export function isPastDue(ent: Entitlements | null | undefined): boolean {
  const s = ent?.subscription_status;
  return s === "past_due" || s === "grace";
}

/**
 * Is this subscription status one where the plan_slug is the merchant's LIVE plan?
 * Cancelled/suspended keep the last plan_slug on the row — never treat that as "Current plan".
 */
export function isLiveSubscriptionStatus(status: string | null | undefined): boolean {
  const s = (status || "").toLowerCase();
  return s === "active" || s === "past_due" || s === "grace" || s === "trialing";
}

/** Paid/serving (excludes unpaid staged checkout). */
export function isServingSubscriptionStatus(status: string | null | undefined): boolean {
  const s = (status || "").toLowerCase();
  return s === "active" || s === "past_due" || s === "grace" || s === "trialing";
}

/** Sidebar / header chip: never show a live plan name when the sub is ended. */
export function planBadgeLabel(ent: Entitlements | null | undefined, loading = false): string {
  if (loading && !ent) return "…";
  if (isCancelled(ent)) return "Cancelled";
  if (isSuspended(ent)) return "Suspended";
  if (isPastDue(ent)) return ent?.plan_name ? `${ent.plan_name} · Past due` : "Past due";
  if (ent?.subscription_status === "trialing") {
    return ent.plan_name ? `${ent.plan_name} · Pending` : "Pending payment";
  }
  return ent?.plan_name || "Free";
}

/** Copy for entitlement lock screens — never claim a cancelled slug is the current plan. */
export function currentPlanLockReason(ent: Entitlements | null | undefined): string | undefined {
  if (isCancelled(ent)) {
    return ent?.plan_name
      ? `Subscription cancelled (was ${ent.plan_name}). Choose a plan to restore access.`
      : "Subscription cancelled. Choose a plan to restore access.";
  }
  if (isSuspended(ent)) {
    return ent?.plan_name
      ? `Workspace suspended (${ent.plan_name}). Settle billing to restore access.`
      : "Workspace suspended. Settle billing to restore access.";
  }
  if (ent?.plan_name) return `Current plan: ${ent.plan_name}`;
  return undefined;
}

/**
 * Human wording for a numeric limit. `-1` is the Master's "unlimited" sentinel
 * (`plans.entitlements` uses it for Enterprise).
 *
 * ⚠️ Callers must pair this with `limits_enforced[key]` — which is per LIMIT, not one flag. Two
 * of the three caps are applied by the API (D78); `max_conversations_per_month` is not, because
 * the credit wallet bounds it. A screen must not claim the server will stop at a cap it will not.
 */
export function limitLabel(value: number | undefined): string {
  if (value === undefined) return "—";
  return value < 0 ? "Unlimited" : String(value);
}
