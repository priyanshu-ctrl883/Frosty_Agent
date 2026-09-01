/**
 * Merchant-facing copy for audit_log rows.
 * The API stores machine actions (`agent.version_published`); this file is the only place
 * those become sentences. Never put a UUID in title or summary.
 */

import type { AuditEvent } from "./types";

export type ActivityGroup =
  | "all"
  | "agent"
  | "knowledge"
  | "widget"
  | "inbox"
  | "leads"
  | "meetings"
  | "quotes"
  | "team"
  | "billing"
  | "webhooks"
  | "settings";

export const ACTIVITY_GROUPS: { id: ActivityGroup; label: string }[] = [
  { id: "all", label: "All events" },
  { id: "agent", label: "Agent" },
  { id: "widget", label: "Widget" },
  { id: "inbox", label: "Inbox" },
  { id: "leads", label: "Leads" },
  { id: "meetings", label: "Meetings & calendar" },
  { id: "quotes", label: "Quotes & catalogue" },
  { id: "team", label: "Team" },
  { id: "webhooks", label: "Webhooks" },
  { id: "settings", label: "Settings" },
];

export type ActivityCopy = {
  title: string;
  summary: string;
  icon: string;
  href: string | null;
  group: Exclude<ActivityGroup, "all">;
  resourceKind: string;
  resourceName: string;
  tone: "green" | "purple" | "blue" | "orange" | "pink" | "teal";
};

type TitleDef = {
  title: string;
  icon: string;
  href: string | null;
  group: Exclude<ActivityGroup, "all">;
};

export const GROUP_META: Record<
  Exclude<ActivityGroup, "all">,
  { kind: string; tone: ActivityCopy["tone"]; icon: string }
> = {
  agent: { kind: "Agent", tone: "green", icon: "smart_toy" },
  knowledge: { kind: "Knowledge", tone: "purple", icon: "menu_book" },
  widget: { kind: "Widget", tone: "blue", icon: "code" },
  inbox: { kind: "Inbox", tone: "orange", icon: "inbox" },
  leads: { kind: "Lead", tone: "orange", icon: "person" },
  meetings: { kind: "Meeting", tone: "teal", icon: "calendar_month" },
  quotes: { kind: "Quote", tone: "purple", icon: "request_quote" },
  team: { kind: "Member", tone: "pink", icon: "group" },
  billing: { kind: "Billing", tone: "green", icon: "payments" },
  webhooks: { kind: "Integration", tone: "blue", icon: "webhook" },
  settings: { kind: "Settings", tone: "purple", icon: "settings" },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function str(details: Record<string, unknown> | null | undefined, key: string): string | null {
  const v = details?.[key];
  if (typeof v === "string" && v.trim() && !UUID_RE.test(v)) return v.trim();
  if (typeof v === "number") return String(v);
  return null;
}

function humanList(values: unknown): string | null {
  if (!Array.isArray(values) || values.length === 0) return null;
  const words = values
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.replace(/[_-]+/g, " "));
  if (!words.length) return null;
  return words.join(", ");
}

const TITLES: Record<string, TitleDef> = {
  "agent.version_saved": { title: "Agent saved", icon: "smart_toy", href: "/agents", group: "agent" },
  "agent.version_published": { title: "Agent published", icon: "rocket_launch", href: "/agents", group: "agent" },
  "agent.version_rolled_back": { title: "Agent rolled back", icon: "history", href: "/agents", group: "agent" },
  "widget.settings_updated": { title: "Widget updated", icon: "web", href: "/widget", group: "widget" },
  "settings.updated": { title: "Settings changed", icon: "settings", href: "/settings", group: "settings" },
  "settings.api_key_rotated": { title: "Widget key rotated", icon: "key", href: "/widget", group: "widget" },
  "calendar.connected": { title: "Google Calendar connected", icon: "event_available", href: "/meetings", group: "meetings" },
  "calendar.disconnected": { title: "Google Calendar disconnected", icon: "event_busy", href: "/meetings", group: "meetings" },
  "meeting.created": { title: "Meeting booked", icon: "calendar_month", href: "/meetings", group: "meetings" },
  "meeting.updated": { title: "Meeting updated", icon: "edit_calendar", href: "/meetings", group: "meetings" },
  "meeting.cancelled": { title: "Meeting cancelled", icon: "event_busy", href: "/meetings", group: "meetings" },
  "meeting.approved": { title: "Meeting approved", icon: "event_available", href: "/meetings", group: "meetings" },
  "meeting.invited": { title: "Meeting invite sent", icon: "forward_to_inbox", href: "/meetings", group: "meetings" },
  "meeting.invite_requested": { title: "Meeting invite requested", icon: "forward_to_inbox", href: "/meetings", group: "meetings" },
  "lead.created": { title: "Lead created", icon: "person_add", href: "/leads", group: "leads" },
  "lead.updated": { title: "Lead updated", icon: "person", href: "/leads", group: "leads" },
  "quotation.created": { title: "Quote created", icon: "request_quote", href: "/quotes", group: "quotes" },
  "quotation.updated": { title: "Quote updated", icon: "request_quote", href: "/quotes", group: "quotes" },
  "quotation.approved": { title: "Quote approved", icon: "check_circle", href: "/quotes", group: "quotes" },
  "quotation.sent": { title: "Quote sent", icon: "send", href: "/quotes", group: "quotes" },
  "quotation.expired": { title: "Quote expired", icon: "schedule", href: "/quotes", group: "quotes" },
  "catalog.created": { title: "Catalogue item added", icon: "inventory_2", href: "/quotes", group: "quotes" },
  "catalog.updated": { title: "Catalogue item updated", icon: "inventory_2", href: "/quotes", group: "quotes" },
  "catalog.deleted": { title: "Catalogue item removed", icon: "inventory_2", href: "/quotes", group: "quotes" },
  "catalog.restored": { title: "Catalogue item restored", icon: "inventory_2", href: "/quotes", group: "quotes" },
  "catalog.imported_csv": { title: "Catalogue imported", icon: "upload", href: "/quotes", group: "quotes" },
  "team.invited": { title: "Teammate invited", icon: "group_add", href: "/team", group: "team" },
  "team.invite_refreshed": { title: "Invite resent", icon: "group_add", href: "/team", group: "team" },
  "team.invite_revoked": { title: "Invite revoked", icon: "person_off", href: "/team", group: "team" },
  "team.invite_accepted": { title: "Invite accepted", icon: "how_to_reg", href: "/team", group: "team" },
  "team.member_removed": { title: "Teammate removed", icon: "person_off", href: "/team", group: "team" },
  "team.member_reactivated": { title: "Teammate restored", icon: "person_add", href: "/team", group: "team" },
  "team.member_role_changed": { title: "Role changed", icon: "admin_panel_settings", href: "/team", group: "team" },
  "team.role_created": { title: "Custom role created", icon: "badge", href: "/team/roles", group: "team" },
  "team.role_updated": { title: "Custom role updated", icon: "badge", href: "/team/roles", group: "team" },
  "team.role_deleted": { title: "Custom role deleted", icon: "badge", href: "/team/roles", group: "team" },
  "webhook.created": { title: "Webhook added", icon: "webhook", href: "/webhooks", group: "webhooks" },
  "webhook.updated": { title: "Webhook updated", icon: "webhook", href: "/webhooks", group: "webhooks" },
  "webhook.deleted": { title: "Webhook removed", icon: "webhook", href: "/webhooks", group: "webhooks" },
  "webhook.secret_rotated": { title: "Webhook secret rotated", icon: "key", href: "/webhooks", group: "webhooks" },
  "webhook_delivery.retried": { title: "Webhook delivery retried", icon: "replay", href: "/webhooks", group: "webhooks" },
  "handoff.claim": { title: "Chat claimed", icon: "support_agent", href: "/inbox", group: "inbox" },
  "handoff.release": { title: "Chat handed back to the AI", icon: "support_agent", href: "/inbox", group: "inbox" },
  "handoff.idle_release": { title: "Chat returned after idle", icon: "support_agent", href: "/inbox", group: "inbox" },
  "handoff.resolve": { title: "Chat resolved", icon: "support_agent", href: "/inbox", group: "inbox" },
  "handoff.close": { title: "Chat closed", icon: "support_agent", href: "/inbox", group: "inbox" },
  "handoff.transfer": { title: "Chat transferred", icon: "support_agent", href: "/inbox", group: "inbox" },
  "unified.settings_updated": { title: "Continue-on-WhatsApp settings updated", icon: "chat", href: "/unified", group: "widget" },
  "unified.link_created": { title: "WhatsApp continue-link created", icon: "chat", href: "/unified", group: "widget" },
  "unified.links_revoked": { title: "WhatsApp continue-link revoked", icon: "chat", href: "/unified", group: "widget" },
  "unified.link_redeemed": { title: "Visitor continued on WhatsApp", icon: "chat", href: "/unified", group: "widget" },
  "auth.bootstrap": { title: "Workspace created", icon: "apartment", href: "/settings", group: "settings" },
  "contact.merged": { title: "Contacts merged", icon: "call_merge", href: "/leads", group: "leads" },
};

function fallbackTitle(action: string): string {
  const last = action.split(".").pop() || action;
  return last.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fallbackGroup(action: string): Exclude<ActivityGroup, "all"> {
  const prefix = action.split(".")[0];
  if (prefix === "agent") return "agent";
  if (prefix === "widget" || prefix === "unified") return "widget";
  if (prefix === "handoff") return "inbox";
  if (prefix === "lead" || prefix === "contact") return "leads";
  if (prefix === "meeting" || prefix === "calendar") return "meetings";
  if (prefix === "quotation" || prefix === "catalog") return "quotes";
  if (prefix === "team") return "team";
  if (prefix === "webhook" || prefix === "webhook_delivery") return "webhooks";
  if (prefix === "billing" || prefix === "invoice") return "billing";
  return "settings";
}

function summaryFor(ev: AuditEvent): string {
  const d = ev.details || {};
  switch (ev.action) {
    case "agent.version_published": {
      const n = str(d, "version_number");
      return n ? `Version ${n} was published successfully.` : "An agent version was published.";
    }
    case "agent.version_saved": {
      const n = str(d, "version_number");
      return n ? `Version ${n} was saved.` : "An agent version was saved.";
    }
    case "agent.version_rolled_back": {
      const n = str(d, "version_number");
      return n ? `Rolled back to version ${n}.` : "An agent version was rolled back.";
    }
    case "widget.settings_updated": {
      const fields = humanList(d.changed);
      return fields ? `Updated ${fields}.` : "Widget appearance or greeting changed.";
    }
    case "settings.api_key_rotated":
      return "The public widget key was rotated. Update the snippet on your site.";
    case "calendar.connected":
      return str(d, "email") ? `Connected ${str(d, "email")}.` : "Google Calendar is connected.";
    case "calendar.disconnected":
      return "Google Calendar was disconnected.";
    case "lead.created": {
      const src = str(d, "source");
      const temp = str(d, "temperature");
      return [src && src !== "manual" ? `From ${src}` : "Added to the pipeline", temp].filter(Boolean).join(" · ");
    }
    case "team.invited":
    case "team.invite_refreshed": {
      const email = str(d, "invited_email");
      const role = str(d, "role_name");
      return [email, role].filter(Boolean).join(" · ") || "A teammate was invited.";
    }
    case "team.member_role_changed": {
      const role = str(d, "role_name") || str(d, "new_role");
      return role ? `Now ${role}.` : "A teammate’s role changed.";
    }
    case "team.role_created": {
      const name = str(d, "role_name") || str(d, "name");
      return name ? `Role "${name}" created.` : "Custom role created.";
    }
    case "team.role_updated": {
      const name = str(d, "role_name") || str(d, "name");
      return name ? `Role "${name}" updated.` : "Custom role updated.";
    }
    case "team.role_deleted": {
      const name = str(d, "role_name") || str(d, "name");
      return name ? `Role "${name}" deleted.` : "Custom role deleted.";
    }
    case "quotation.sent":
      return "The customer was emailed the PDF.";
    case "catalog.imported_csv":
      return "Products were imported from a CSV.";
    default:
      break;
  }

  const named =
    str(d, "invited_email") ||
    str(d, "email") ||
    str(d, "role_name") ||
    str(d, "name") ||
    str(d, "title");
  if (named) return named;
  const version = str(d, "version_number");
  if (version) return `Version ${version}`;
  return "Workspace change recorded.";
}

function resourceNameFor(ev: AuditEvent, kind: string): string {
  const d = ev.details || {};
  return (
    str(d, "invited_email") ||
    str(d, "email") ||
    str(d, "role_name") ||
    str(d, "name") ||
    str(d, "title") ||
    (str(d, "version_number") ? `Version ${str(d, "version_number")}` : null) ||
    kind
  );
}

function withMeta(partial: TitleDef, ev: AuditEvent): ActivityCopy {
  const meta = GROUP_META[partial.group];
  return {
    ...partial,
    summary: summaryFor(ev),
    resourceKind: meta.kind,
    resourceName: resourceNameFor(ev, meta.kind),
    tone: meta.tone,
  };
}

export function describeActivity(ev: AuditEvent): ActivityCopy {
  const known = TITLES[ev.action];
  if (known) return withMeta(known, ev);
  return withMeta(
    {
      title: fallbackTitle(ev.action),
      icon: "history",
      href: null,
      group: fallbackGroup(ev.action),
    },
    ev,
  );
}

export function groupForAction(action: string): ActivityGroup {
  return TITLES[action]?.group ?? fallbackGroup(action);
}

export function eventMatchesGroup(action: string, group: ActivityGroup): boolean {
  if (group === "all") return true;
  return groupForAction(action) === group;
}

export type ActorInfo = {
  name: string;
  role: string;
  initial: string;
};

export function actorInfo(
  ev: AuditEvent,
  membersByUserId: Map<string, { display_name: string; email: string; role: string }>,
): ActorInfo {
  if (ev.actor_type === "system") return { name: "Frosty", role: "System", initial: "F" };
  if (ev.actor_type === "super_admin") return { name: "Frostrek", role: "Support", initial: "S" };
  if (ev.actor_type === "impersonated_admin") {
    return { name: "Frostrek", role: "Support", initial: "S" };
  }
  if (ev.actor_type === "api_key") return { name: "API", role: "Key", initial: "A" };
  if (ev.actor_id) {
    const member = membersByUserId.get(ev.actor_id);
    if (member) {
      const name = member.display_name || member.email || "Teammate";
      return {
        name,
        role: member.role,
        initial: name.charAt(0).toUpperCase(),
      };
    }
  }
  return { name: "A teammate", role: "Member", initial: "?" };
}

export function actorLabel(
  ev: AuditEvent,
  membersByUserId: Map<string, { display_name: string; email: string; role?: string }>,
): string {
  return actorInfo(ev, membersByUserId as Map<string, { display_name: string; email: string; role: string }>).name;
}

