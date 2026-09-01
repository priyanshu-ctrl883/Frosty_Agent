"use client";

import type { ReactNode } from "react";
import { Loading, PageState } from "@/components/ui/PageState";
import type { MerchantFeature } from "@/lib/entitlements";
import { currentPlanLockReason } from "@/lib/entitlements";
import { useWorkspace } from "@/lib/workspace";

type Props = {
  feature: MerchantFeature;
  children: ReactNode;
  title?: string;
  description?: string;
  icon?: string;
};

/**
 * Per-feature copy for the soft lock. Ported from the parallel build's `ENTITLEMENT_COPY`, re-keyed
 * onto OUR feature keys — theirs is keyed on the Master's prose names (`features.meetings_calendar`,
 * `channels.whatsapp`), which resolve to nothing against `plan_feature_defaults`.
 *
 * The wording matters more than it looks. The Master's rule is "Soft lock — 'Not on your plan.
 * Contact support / upgrade.' **Never silent fail**", and a generic "feature locked" tells a
 * merchant nothing about what they would be buying.
 */
const COPY: Partial<Record<MerchantFeature, { icon: string; title: string; body: string }>> = {
  human_handoff: {
    icon: "inbox",
    title: "The live inbox is not on your plan",
    body:
      "With the inbox, your team can take over a conversation from the agent — claim it, reply, " +
      "add internal notes, transfer it to a colleague, and hand it back.",
  },
  meeting_scheduling: {
    icon: "event_available",
    title: "Meeting booking is not on your plan",
    body:
      "Connect Google Calendar and the agent can offer real free slots and book them during a " +
      "conversation, with a Meet link on the invite.",
  },
  quotations: {
    icon: "request_quote",
    title: "Quotations are not on your plan",
    body:
      "The agent can draft a priced quote from your catalogue, you approve it, and it goes out as " +
      "a GST-compliant PDF.",
  },
  webhooks: {
    icon: "webhook",
    title: "CRM and webhooks are not on your plan",
    body:
      "Send new leads to Zoho, HubSpot, or Salesforce through Zapier, or to your own backend " +
      "as a signed HTTP callback, with retries.",
  },
  channel_whatsapp: {
    icon: "chat",
    title: "WhatsApp is not on your plan",
    body:
      "Connect a Meta WhatsApp number and the same agent answers there, with delivery tracking " +
      "and template sync.",
  },
  channel_unified: {
    icon: "dynamic_feed",
    title: "Continue-on-WhatsApp is not on your plan",
    body:
      "A visitor who starts on your website can carry the same conversation — and the same " +
      "history — over to WhatsApp with one tap.",
  },
  advanced_analytics: {
    icon: "insights",
    title: "Advanced analytics is not on your plan",
    body: "Deeper breakdowns of conversations, grounding quality and lead conversion over time.",
  },
  channel_web: {
    icon: "language",
    title: "The website agent is not on your plan",
    body: "Deploy an AI chat and live voice agent on your website via embeddable widget.",
  },
  knowledge_base: {
    icon: "menu_book",
    title: "Knowledge Base is not on your plan",
    body: "Upload documents, sync FAQs, and let the agent answer questions grounded in your content.",
  },
  lead_capture: {
    icon: "person_search",
    title: "Lead capture is not on your plan",
    body: "Automatically identify, capture, and score qualified customer leads from conversations.",
  },
  api_access: {
    icon: "key",
    title: "API access is not on your plan",
    body: "Generate publishable API keys and developer integration tokens.",
  },
  sandbox_preview: {
    icon: "science",
    title: "The sandbox is not on your plan",
    body: "Chat against a draft version of your agent before publishing it to a live channel.",
  },
  team_rbac: {
    icon: "group",
    title: "Team RBAC is not on your plan",
    body: "Invite team members, assign granular roles (Manager, Agent, Viewer), and manage seat assignments.",
  },
};

/**
 * Soft-lock a page body when the merchant's plan does not include the feature.
 *
 * ⚠️ WHY LOCK THE BODY RATHER THAN HIDE THE NAV. Their build does both and the Master's §3 says
 * "hide nav"; we lock instead, because on OUR API most of these flags are not enforced at all yet
 * (see `lib/nav.ts` and migration 0039's footer). Hiding a screen the API serves is the D44c defect
 * — it teaches the merchant the feature does not exist rather than that it is purchasable — and it
 * would also make the missing enforcement invisible to us. Locking is honest in both directions: the
 * merchant sees what they could buy, and the lock is a client-side courtesy we never present as a
 * security boundary.
 *
 * `loading` renders a neutral state, never the children: flashing an unentitled screen for one paint
 * is how a merchant learns a feature exists and then loses it.
 */
export function EntitlementGate({ feature, children, title, description, icon }: Props) {
  const { loading, allowed, isOverride, entitlements } = useWorkspace();
  const copy = COPY[feature];

  if (loading) return <Loading label="Checking your plan…" />;

  if (!allowed(feature)) {
    const overridden = isOverride(feature);
    const reason = overridden
      ? "Switched off for this workspace by Frostrek — contact support."
      : currentPlanLockReason(entitlements);
    return (
      <PageState
        icon={icon || copy?.icon || "lock"}
        title={overridden ? "Feature Disabled" : (title || copy?.title || "Not on your plan")}
        description={
          overridden
            ? "This feature has been switched off for this workspace by Frostrek."
            : (description || copy?.body || "This feature is not included in your current plan.")
        }
        lockedReason={reason}
        primaryHref={overridden ? undefined : "/billing"}
        primaryLabel={overridden ? undefined : "See plans"}
        secondaryHref="/home"
        secondaryLabel="Back to home"
      />
    );
  }

  return <>{children}</>;
}
