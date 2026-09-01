import type { MerchantAlert } from "@/lib/types";

/**
 * Human copy for a `merchant_alerts` row, and where to go about it.
 *
 * ⚠️ THEIR ALERT TYPE CARRIES `title` AND `body` AS COLUMNS. Ours does not — `merchant_alerts` has
 * `alert_type` and a `data` jsonb, and the words are the reader's problem. So this file is the words.
 *
 * ⚠️ AND THERE ARE ONLY THREE TYPES ANYTHING ACTUALLY WRITES, which is worth stating because the
 * server's own docstring claims four. Grepped for `INSERT INTO tenant_admin.merchant_alerts` across
 * the whole API:
 *
 *   * `hot_lead_detected`  — `leads/repository.py:124`
 *   * `custom`             — `contacts/repository.py:29`, always with `data.kind`, today only
 *                            `handoff_requested`
 *   * `wa_send_failed`     — `channels_wa/repository.py:488` and `:514`, with `data.kind` telling a
 *                            dead token from an exhausted event
 *
 * `credit_warning_80` is named in `notifications/service.py`'s docstring and in two tests, and
 * **nothing raises it** — see DECISIONS. The Master's §C does ask for a quota alert, so the entry
 * below stays: the day a sweep raises it, this renders without another edit. An unknown type falls
 * back to its raw name rather than being hidden, because an alert nobody can read is still an alert
 * somebody should see.
 */
type AlertCopy = { title: string; body: string; href: string | null; icon: string };

export function alertCopy(alert: MerchantAlert): AlertCopy {
  const data = alert.data || {};
  const kind = String(data.kind || "");

  switch (alert.alert_type) {
    case "hot_lead_detected":
      return {
        title: "A hot lead came in",
        body:
          [data.name, data.email, data.phone].filter(Boolean).join(" · ") ||
          "The agent scored a conversation as a hot lead.",
        href: "/leads",
        icon: "local_fire_department",
      };

    case "wa_send_failed":
      if (kind === "wa_events_exhausted") {
        return {
          title: "WhatsApp event processing backlog",
          body: data.unprocessed_count
            ? `${data.unprocessed_count} WhatsApp events are pending reconciliation.`
            : "WhatsApp event processing is falling behind.",
          href: "/whatsapp",
          icon: "chat_error",
        };
      }
      return {
        title: "WhatsApp message delivery failed",
        body: String(data.detail || data.error || "A WhatsApp message could not be delivered to the customer."),
        href: "/whatsapp",
        icon: "chat_error",
      };

    case "calendar_sync_failed":
      return {
        title: "Calendar sync failed",
        body:
          data.reason === "provider_auth"
            ? "Google Calendar authorization expired. Reconnect your calendar in Settings."
            : "A scheduled meeting could not be synchronized to Google Calendar.",
        href: "/calendar",
        icon: "event_busy",
      };

    case "erasure_calendar_failed":
      return {
        title: "GDPR calendar removal required",
        body:
          [
            data.scheduled_start ? `Meeting at ${String(data.scheduled_start)}` : null,
            data.google_event_id ? `Event ID: ${String(data.google_event_id)}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "A deleted contact's calendar event must be manually removed from Google Calendar.",
        href: "/calendar",
        icon: "event_busy",
      };

    case "credit_warning_80":
    case "credit_warning_100":
      return {
        title:
          alert.alert_type === "credit_warning_100"
            ? "You are out of conversation credits"
            : "You have used 80% of your credits",
        body:
          alert.alert_type === "credit_warning_100"
            ? "The agent has stopped answering new conversations. Top up to resume."
            : "Top up before you run out, or the agent will stop answering new conversations.",
        href: "/billing",
        icon: "account_balance_wallet",
      };

    case "custom":
      if (kind === "meeting_needs_approval") {
        return {
          title: "A booking needs your approval",
          body:
            [data.when ? `Requested time: ${String(data.when)}` : null]
              .filter(Boolean)
              .join(" · ") || "A customer requested a meeting that requires your confirmation.",
          href: "/meetings?filter=pending_approval",
          icon: "calendar_clock",
        };
      }
      if (kind === "agent_probe_down") {
        return {
          title: "Web agent health check failed",
          body:
            firstString(data, "message", "detail", "reason") ||
            agentProbeContext(data) ||
            "Your agent did not respond to a health probe. Visitors may not get replies.",
          href: "/website",
          icon: "monitor_heart",
        };
      }
      if (kind === "agent_probe_recovered") {
        return {
          title: "Web agent is healthy again",
          body:
            firstString(data, "message", "detail", "reason") ||
            agentProbeContext(data) ||
            "Health checks are passing again and the agent is responding normally.",
          href: "/website",
          icon: "monitor_heart",
        };
      }
      if (kind === "handoff_requested") {
        // ⚠️ adj 12 IS A TWO-HALVES RULE AND THIS CARD READS BOTH — from the alert itself, not
        // from a live entitlements lookup. `persist` records WHY nobody could be queued at the
        // moment the customer asked, which is the state that matters: a plan changed since then
        // must not rewrite what happened.
        //
        // The two halves need OPPOSITE advice. `handoff/service.py`'s enqueue refuses on either
        // a missing entitlement OR no member with `accepts_handoff`, and pointing the second at
        // /billing would try to sell someone a feature they already bought — the same mistake the
        // upsell whitelist exists to prevent.
        const blocked = data.handoff_block_reason;
        if (blocked === "not_entitled") {
          return {
            title: "Someone asked for a human",
            body:
              "A visitor asked to speak to a person. Your plan doesn't include live handoff, " +
              "so nobody could pick it up — upgrade to route these to your inbox.",
            href: "/billing",
            icon: "support_agent",
          };
        }
        if (blocked === "no_taker") {
          return {
            title: "Someone asked for a human — nobody could take it",
            body:
              "A visitor asked to speak to a person. Your plan includes live handoff, but no " +
              "active team member accepts handoffs yet, so it was not queued.",
            href: "/team",
            icon: "support_agent",
          };
        }
        if (blocked === "disabled_by_staff") {
          // Frostrek turned this off for THIS merchant, overriding a plan that may well include
          // it. Never an upgrade prompt — they are already paying. Support is the honest route.
          return {
            title: "Someone asked for a human — handoff is switched off",
            body:
              "A visitor asked to speak to a person. Live handoff is currently disabled on your " +
              "account, so it was not queued. Contact support if that is unexpected.",
            href: "/settings",
            icon: "support_agent",
          };
        }
        // `unresolved` (our own probe failed) and any future reason fall through to the neutral
        // copy: we do not know that nobody came, so we must not say so.
        return {
          title: "Someone asked for a human",
          body: "A visitor asked to speak to a person. The conversation is waiting in the inbox.",
          href: "/inbox",
          icon: "support_agent",
        };
      }
      return {
        title: kind ? humanise(kind) : "Notification",
        body: describe(data),
        href: null,
        icon: "notifications",
      };

    case "impersonation_request":
      return {
        title: "Frostrek Support Access Request",
        body: `${data.staff_email || "Support staff"} requested temporary ${data.ttl_minutes || 30}-min access${data.reason ? `: "${data.reason}"` : "."}`,
        href: "/settings",
        icon: "shield_person",
      };

    case "payment_failed":
      return {
        title: "Payment failed",
        body: firstString(data, "message", "detail", "reason") || "We could not process your last payment. Update billing to avoid interruption.",
        href: "/billing",
        icon: "payments",
      };

    case "wa_account_disconnected":
      return {
        title: "WhatsApp disconnected",
        body: firstString(data, "message", "detail") || "Your WhatsApp Business account needs to be reconnected.",
        href: "/whatsapp",
        icon: "chat_error",
      };

    case "wa_session_expired":
      return {
        title: "WhatsApp session expired",
        body: firstString(data, "message", "detail") || "Reconnect WhatsApp so the agent can keep messaging customers.",
        href: "/whatsapp",
        icon: "chat_error",
      };

    case "kb_ingestion_failed":
    case "kb_storage_warning":
      return {
        title: alert.alert_type === "kb_ingestion_failed" ? "Knowledge base ingestion failed" : "Knowledge base storage warning",
        body: firstString(data, "message", "detail", "reason") || "Check your knowledge base sources in Settings.",
        href: "/knowledge",
        icon: "menu_book",
      };

    case "handoff_queue_full":
    case "handoff_sla_breach":
      return {
        title: alert.alert_type === "handoff_queue_full" ? "Handoff queue is full" : "Handoff SLA breached",
        body: firstString(data, "message", "detail") || "A customer is waiting for a human — check your inbox.",
        href: "/inbox",
        icon: "support_agent",
      };

    default:
      if (alert.alert_type === "agent_probe_down" || alert.alert_type === "agent_probe_recovered") {
        const down = alert.alert_type === "agent_probe_down";
        return {
          title: down ? "Web agent health check failed" : "Web agent is healthy again",
          body:
            firstString(data, "message", "detail", "reason") ||
            agentProbeContext(data) ||
            (down
              ? "Your agent did not respond to a health probe."
              : "Health checks are passing again."),
          href: "/website",
          icon: "monitor_heart",
        };
      }
      return {
        title: humanise(alert.alert_type),
        body: describe(data),
        href: null,
        icon: "notifications",
      };
  }
}

function firstString(data: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const val = data[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return null;
}

function agentProbeContext(data: Record<string, unknown>): string | null {
  const parts = [
    typeof data.agent_name === "string" ? data.agent_name : null,
    typeof data.url === "string" ? data.url : null,
    typeof data.channel === "string" ? `${String(data.channel)} channel` : null,
    typeof data.status_code === "number" ? `HTTP ${data.status_code}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** `handoff_requested` -> "Handoff requested". Used only for types this file does not know. */
function humanise(raw: string): string {
  const words = raw.replace(/[_.]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Last resort for an unknown alert's body — prefer short safe strings over raw key lists.
 * `data` can hold PII, so only whitelisted fields are rendered as values.
 */
function describe(data: Record<string, unknown> | unknown[] | null | undefined): string {
  if (!data) return "No further detail.";

  if (Array.isArray(data)) {
    const text = data
      .map((v) => (typeof v === "string" ? v.trim() : null))
      .filter(Boolean)
      .slice(0, 2)
      .join(" · ");
    return text || "Open for full details.";
  }

  const msg = firstString(data, "message", "detail", "reason", "summary", "body", "description", "error");
  if (msg) return msg;

  const parts = [
    typeof data.name === "string" ? data.name : null,
    typeof data.agent_name === "string" ? data.agent_name : null,
    typeof data.when === "string" ? data.when : null,
    typeof data.channel === "string" ? String(data.channel) : null,
    typeof data.score === "number" ? `Score ${data.score}` : null,
    typeof data.unprocessed_count === "number" ? `${data.unprocessed_count} pending` : null,
  ].filter(Boolean);

  if (parts.length) return parts.join(" · ");

  const keys = Object.keys(data).filter((k) => k !== "kind" && !/^(id|contact_id|conversation_id|merchant_id)$/.test(k));
  if (!keys.length) return "No further detail.";

  const shortPairs = keys.slice(0, 2).map((k) => {
    const v = data[k];
    if (typeof v === "string" && v.length <= 72) return v;
    if (typeof v === "number" || typeof v === "boolean") return `${humanise(k)}: ${v}`;
    return null;
  }).filter(Boolean);

  return shortPairs.length ? shortPairs.join(" · ") : "Open for full details.";
}

/** Unread means the recipient has not acted: `pending` (raised). */
export function isUnread(alert: MerchantAlert): boolean {
  return alert.status === "pending";
}
