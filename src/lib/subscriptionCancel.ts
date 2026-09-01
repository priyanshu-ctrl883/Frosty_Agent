import type { BillingConfig, Subscription } from "@/lib/types";

export type SubscriptionCancelKind = "pending" | "trial" | "paid" | "none";

export type SubscriptionCancelUi = {
  showSection: boolean;
  canCancel: boolean;
  kind: SubscriptionCancelKind;
  blockedReason: string | null;
  scheduledEnd: string | null;
  mfaRequired: boolean;
};

export function isPendingPayment(sub: Subscription | null | undefined): boolean {
  return Boolean(
    sub && (sub.status === "pending_subscribe" || sub.autopay_state === "pending_mandate"),
  );
}

/** Whether the merchant dashboard may offer a self-serve cancel control. */
export function subscriptionCancelUi(
  subscription: Subscription | null | undefined,
  billingConfig: BillingConfig | null | undefined,
  canManage: boolean,
): SubscriptionCancelUi {
  const empty: SubscriptionCancelUi = {
    showSection: false,
    canCancel: false,
    kind: "none",
    blockedReason: null,
    scheduledEnd: null,
    mfaRequired: false,
  };

  if (!canManage || !subscription || subscription.status === "cancelled") {
    return empty;
  }

  if (subscription.plan_slug === "free") {
    return empty;
  }

  const scheduledEnd = subscription.cancel_at ?? null;
  if (scheduledEnd && subscription.status !== "cancelled") {
    return {
      showSection: true,
      canCancel: false,
      kind: "none",
      blockedReason: null,
      scheduledEnd,
      mfaRequired: false,
    };
  }

  if (isPendingPayment(subscription)) {
    return {
      showSection: true,
      canCancel: true,
      kind: "pending",
      blockedReason: null,
      scheduledEnd: null,
      mfaRequired: false,
    };
  }

  const platformAllows = billingConfig?.self_cancel_allowed !== false;
  const merchantCanCancel = subscription.merchant_can_cancel;
  if (merchantCanCancel === false || (merchantCanCancel == null && !platformAllows)) {
    const autopayLocked =
      subscription.autopay_state === "mandate_active" || merchantCanCancel === false;
    return {
      showSection: true,
      canCancel: false,
      kind: "none",
      blockedReason: autopayLocked
        ? "This subscription uses autopay. Contact support to cancel and release your payment mandate."
        : "Self-service cancellation is turned off for this workspace. Contact support if you need help.",
      scheduledEnd: null,
      mfaRequired: false,
    };
  }

  if (subscription.status === "trialing") {
    return {
      showSection: true,
      canCancel: true,
      kind: "trial",
      blockedReason: null,
      scheduledEnd: null,
      mfaRequired: true,
    };
  }

  if (["active", "past_due", "grace", "suspended"].includes(subscription.status)) {
    return {
      showSection: true,
      canCancel: true,
      kind: "paid",
      blockedReason: null,
      scheduledEnd: null,
      mfaRequired: true,
    };
  }

  return {
    showSection: true,
    canCancel: false,
    kind: "none",
    blockedReason: null,
    scheduledEnd: null,
    mfaRequired: false,
  };
}

export function cancelActionLabel(kind: SubscriptionCancelKind): string {
  if (kind === "pending") return "Cancel pending checkout";
  if (kind === "trial") return "Cancel trial";
  return "Cancel subscription";
}

export function cancelSectionDescription(ui: SubscriptionCancelUi): string {
  if (ui.scheduledEnd) {
    return `Your subscription is scheduled to end on ${ui.scheduledEnd}. Agents keep answering until then, then stop.`;
  }
  if (ui.blockedReason) {
    return ui.blockedReason;
  }
  if (ui.kind === "pending") {
    return "Abandon an unpaid checkout so you can pick a different plan. No charge has been taken.";
  }
  if (ui.kind === "trial") {
    return "End your free trial anytime before the first plan charge. Agents stop when the trial ends.";
  }
  if (ui.kind === "paid") {
    return "Cancel at the end of the current billing period. Agents keep answering until then. Paid subscriptions require a quick sign-in confirmation (authenticator app).";
  }
  return "Manage or cancel your Frosty subscription.";
}
