import type { MerchantFeature } from "./entitlements";
import type { MerchantPermission } from "./permissions";

export type NavSection = "home" | "agents" | "insights" | "pipeline" | "account" | "hidden";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  /** Any one of these unlocks the item. Omitted = visible to any active member. */
  permissions?: MerchantPermission[];
  /**
   * A plan feature the DESTINATION'S API ACTUALLY ENFORCES.
   */
  feature?: MerchantFeature;
  /** Extra command-palette terms. Label is always searched; these catch CRM / Zoho / webhooks. */
  keywords?: string[];
  section: NavSection;
  /** When false, command palette still lists it; the left rail does not. Default true. */
  sidebar?: boolean;
};

export const SIDEBAR_SECTION_ORDER: { id: Exclude<NavSection, "hidden">; label: string | null }[] = [
  { id: "home", label: null },
  { id: "agents", label: "Agents" },
  { id: "insights", label: "Insights" },
  { id: "pipeline", label: "Pipeline" },
  { id: "account", label: "Account" },
];

/**
 * The merchant nav, gated on what the DESTINATION SCREEN'S first call really requires.
 */
export const MERCHANT_NAV: NavItem[] = [
  {
    href: "/home",
    label: "Overview",
    icon: "dashboard",
    permissions: ["dashboard:view"],
    section: "home",
  },
  {
    href: "/website",
    feature: "channel_web",
    label: "Web Agent",
    icon: "language",
    permissions: ["agent:config"],
    section: "agents",
  },
  {
    href: "/whatsapp",
    feature: "channel_whatsapp",
    label: "WA Agent",
    icon: "chat",
    permissions: ["agent:config"],
    section: "agents",
  },
  {
    href: "/unified",
    feature: "channel_unified",
    label: "Unified Agent",
    icon: "dynamic_feed",
    permissions: ["dashboard:view"],
    section: "agents",
  },
  {
    href: "/email",
    label: "Email Agent",
    icon: "mail",
    permissions: ["dashboard:view"],
    keywords: ["gmail", "email", "email automation", "inbox", "auto-reply"],
    section: "agents",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: "insights",
    permissions: ["dashboard:view"],
    section: "insights",
  },
  {
    href: "/knowledge",
    feature: "knowledge_base",
    label: "Knowledge Base",
    icon: "menu_book",
    permissions: ["kb:view"],
    section: "insights",
  },
  {
    href: "/inbox",
    label: "Inbox",
    icon: "inbox",
    permissions: ["inbox:read"],
    feature: "human_handoff",
    section: "pipeline",
  },
  {
    href: "/leads",
    feature: "lead_capture",
    label: "Leads",
    icon: "person_search",
    permissions: ["leads:read"],
    section: "pipeline",
  },
  {
    href: "/quotes",
    feature: "quotations",
    label: "Quotations",
    icon: "request_quote",
    permissions: ["quotations:view"],
    section: "pipeline",
  },
  {
    href: "/workspace",
    label: "Workspace",
    icon: "apartment",
    permissions: ["dashboard:view"],
    section: "account",
  },
  {
    href: "/billing",
    label: "Billing",
    icon: "payments",
    permissions: ["billing:view"],
    section: "account",
  },
  {
    href: "/tickets",
    label: "Tickets",
    icon: "confirmation_number",
    permissions: ["dashboard:view"],
    section: "hidden",
    sidebar: false,
    keywords: ["support", "helpdesk", "ticket"],
  },

  /* Command palette / deep links — not on the rail */
  {
    href: "/widget",
    feature: "channel_web",
    label: "Widget",
    icon: "widgets",
    permissions: ["widget:config"],
    section: "hidden",
    sidebar: false,
  },
  {
    href: "/team",
    feature: "team_rbac",
    label: "Team",
    icon: "group",
    permissions: ["team:manage"],
    section: "hidden",
    sidebar: false,
  },
  {
    href: "/integrations",
    feature: "webhooks",
    label: "Integrations",
    icon: "webhook",
    permissions: ["webhooks:manage"],
    keywords: ["webhooks", "zoho", "crm", "zapier", "hubspot"],
    section: "hidden",
    sidebar: false,
  },
  {
    href: "/settings?tab=activity",
    label: "Activity",
    icon: "history",
    permissions: ["team:manage"],
    section: "hidden",
    sidebar: false,
    keywords: ["audit", "log", "history"],
  },
  {
    href: "/settings",
    label: "Settings",
    icon: "settings",
    permissions: ["dashboard:view"],
    keywords: ["integrations", "webhooks", "api keys", "privacy", "guardrails", "activity"],
    section: "hidden",
    sidebar: false,
  },
  {
    href: "/help",
    label: "Help Hub",
    icon: "help",
    permissions: ["dashboard:view"],
    section: "hidden",
    sidebar: false,
  },
];

export type SidebarNavItem = NavItem & { locked: boolean };

export type SidebarNavGroup = {
  id: Exclude<NavSection, "hidden">;
  label: string | null;
  items: SidebarNavItem[];
};

export const groupSidebarNav = (visible: SidebarNavItem[]): SidebarNavGroup[] =>
  SIDEBAR_SECTION_ORDER.map((sec) => ({
    ...sec,
    items: visible.filter((n) => n.sidebar !== false && n.section === sec.id),
  })).filter((g) => g.items.length > 0);

/** Best-match nav label for route-level loading shells. */
export const pageTitleFromPath = (pathname: string): string => {
  const match = MERCHANT_NAV.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Frosty Agent";
};
