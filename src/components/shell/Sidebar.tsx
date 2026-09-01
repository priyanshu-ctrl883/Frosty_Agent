

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Smartphone, Headphones, UserRound, BookOpen, FileText,
  BarChart3, Plug, Calendar, CreditCard, Settings, Menu, X, MoreVertical,
  LogOut, ChevronRight, Lock, Plus, History, HelpCircle, UsersRound,
  CalendarCheck, Building2, SlidersHorizontal, Webhook, Globe, MessageCircle,
  FlaskConical, LineChart, Inbox, Mail, Pencil, Trash2, Cookie, Shield
} from "lucide-react";
import { openConsentPreferencesModal } from "@/lib/useConsentGate";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import type { NavItem, SidebarNavGroup, SidebarNavItem } from "@/lib/nav";
import { roleLabel } from "@/lib/permissions";
import { apiRequest } from "@/lib/api";
import type { Agent, AgentMode, Me } from "@/lib/types";
import { signOut } from "@/lib/session";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/lib/toast";
import BrandLogo from "@/components/BrandLogo";

const iconMap: Record<string, any> = {
  "dashboard": LayoutDashboard,
  "insights": BarChart3,
  "smart_toy": Smartphone,
  "science": FlaskConical,
  "menu_book": BookOpen,
  "widgets": SlidersHorizontal,
  "language": Globe,
  "chat": MessageCircle,
  "dynamic_feed": Smartphone,
  "inbox": Inbox,
  "mail": Mail,
  "headphones": Headphones,
  "person_search": UserRound,
  "event_available": CalendarCheck,
  "request_quote": FileText,
  "payments": CreditCard,
  "group": UsersRound,
  "extension": Plug,
  "apartment": Building2,
  "webhook": Webhook,
  "sliders": SlidersHorizontal,
  "history": History,
  "settings": Settings,
  "help": HelpCircle,
};

/** Channel hub nav → agent mode(s) listed under that collapsible. */
const AGENT_NAV_MODES: Record<string, AgentMode[]> = {
  "/website": ["website"],
  "/whatsapp": ["whatsapp"],
  "/unified": ["unified"],
  "/email": ["email"],
};

export type SidebarProps = {
  groups?: SidebarNavGroup[];
  me?: Me | null;
  tenant?: { owner_name?: string; plan?: string; [key: string]: any } | null;
  planLabel?: string;
  isCollapsed?: boolean;
  setIsCollapsed?: (v: boolean) => void;
  isExpanded?: boolean;
  setIsExpanded?: (v: boolean) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (v: boolean) => void;
  open?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
  onboardingMode?: boolean;
  sidebarBottomNode?: React.ReactNode;
};

export function Sidebar({
  groups,
  me,
  tenant,
  planLabel,
  isCollapsed,
  setIsCollapsed,
  isExpanded: isExpandedProp,
  setIsExpanded: setIsExpandedProp,
  isMobileOpen,
  setIsMobileOpen,
  open: openProp,
  onClose,
  onLogout,
  onboardingMode,
  sidebarBottomNode,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Resolve expand state
  const isExpanded = isExpandedProp !== undefined
    ? isExpandedProp
    : isCollapsed !== undefined
      ? !isCollapsed
      : true;

  const handleSetExpanded = useCallback((expanded: boolean) => {
    if (setIsExpandedProp) setIsExpandedProp(expanded);
    if (setIsCollapsed) setIsCollapsed(!expanded);
  }, [setIsExpandedProp, setIsCollapsed]);

  // Resolve mobile open state
  const mobileOpen = openProp !== undefined
    ? openProp
    : Boolean(isMobileOpen);

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    if (setIsMobileOpen) setIsMobileOpen(false);
  }, [onClose, setIsMobileOpen]);

  const [optimisticPath, setOptimisticPath] = useState(pathname);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [expandedSubmenus, setExpandedSubmenus] = useState<Record<string, boolean>>({});
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingAgentDelete, setPendingAgentDelete] = useState<{
    agent: Agent;
    hubHref: string;
  } | null>(null);
  const [deletingAgent, setDeletingAgent] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  const displayName = tenant?.owner_name || me?.display_name || me?.email || "User";
  const userPlan = tenant?.plan || planLabel || "free";
  const initial = (displayName.charAt(0) || "U").toUpperCase();

  const loadAgents = useCallback(async () => {
    try {
      const list = await apiRequest<Agent[]>("/v1/agents");
      setAgents(Array.isArray(list) ? list : []);
    } catch {
      setAgents([]);
    }
  }, []);

  const agentParam = searchParams?.get("agent") ?? null;

  useEffect(() => {
    setOptimisticPath(pathname);
    setSelectedAgentId(agentParam);
  }, [pathname, agentParam]);

  // Close mobile drawer whenever pathname or searchParams change
  useEffect(() => {
    handleClose();
  }, [pathname, searchParams, handleClose]);

  // Listen for Escape key to close mobile drawer
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  // Close mobile drawer on window resize to desktop
  useEffect(() => {
    if (!mobileOpen) return;
    const onResize = () => {
      if (window.innerWidth > 768) {
        handleClose();
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileOpen, handleClose]);

  useEffect(() => {
    if (onboardingMode) return;
    void loadAgents();
    const onChanged = () => void loadAgents();
    window.addEventListener("frosty:agents-changed", onChanged);
    return () => window.removeEventListener("frosty:agents-changed", onChanged);
  }, [onboardingMode, loadAgents]);

  const confirmDeleteAgent = useCallback(async () => {
    if (!pendingAgentDelete || deletingAgent) return;
    const { agent, hubHref } = pendingAgentDelete;
    setDeletingAgent(true);
    try {
      await apiRequest(`/v1/agents/${agent.id}`, { method: "DELETE" });
      setPendingAgentDelete(null);
      setAgents((prev) => prev.filter((a) => a.id !== agent.id));
      window.dispatchEvent(new Event("frosty:agents-changed"));
      await loadAgents();
      if (selectedAgentId === agent.id) {
        setSelectedAgentId(null);
        router.push(hubHref);
      }
      toastSuccess(`“${agent.agent_name || "Agent"}” deleted.`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not delete the agent.");
    } finally {
      setDeletingAgent(false);
    }
  }, [
    pendingAgentDelete,
    deletingAgent,
    loadAgents,
    router,
    selectedAgentId,
    toastError,
    toastSuccess,
  ]);

  const renderAgentQuickMenu = (
    agent: Agent,
    hubHref: string,
    childActive: boolean,
  ) => (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${agent.agent_name || "agent"}`}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-none transition-colors",
            childActive
              ? "text-[#F7F5F1] opacity-100 hover:bg-white/15"
              : "text-[rgba(247,245,241,0.55)] opacity-100 hover:bg-white/10 hover:text-[#F7F5F1]",
          )}
        >
          <MoreVertical size={14} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="right"
          align="start"
          sideOffset={6}
          className="z-[200] min-w-[140px] overflow-hidden rounded-xl p-1 shadow-2xl animate-in fade-in-80 zoom-in-95"
          style={{
            border: "1px solid var(--lt-border)",
            background: "var(--lt-card)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu.Item
            onSelect={() => {
              router.push(`/agents/${agent.id}`);
              handleClose();
            }}
            className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors"
            style={{ color: "var(--lt-text-primary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(3,150,166,0.07)";
              e.currentTarget.style.color = "var(--lt-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--lt-text-primary)";
            }}
          >
            <Pencil className="mr-2 h-3.5 w-3.5 shrink-0" style={{ color: "var(--lt-text-muted)" }} />
            <span>Edit</span>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px" style={{ background: "var(--lt-border)" }} />
          <DropdownMenu.Item
            onSelect={(e) => {
              e.preventDefault();
              setPendingAgentDelete({ agent, hubHref });
            }}
            className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors"
            style={{ color: "var(--lt-error)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(217,100,100,0.07)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5 shrink-0" style={{ color: "var(--lt-error)" }} />
            <span>Delete</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );

  useEffect(() => {
    for (const href of Object.keys(AGENT_NAV_MODES)) {
      if (pathname === href || pathname.startsWith(`${href}/`)) {
        const modes = AGENT_NAV_MODES[href];
        if (!modes) continue;
        const count = agents.filter((a) => modes.includes(a.mode as AgentMode)).length;
        if (count > 1) {
          setExpandedSubmenus((prev) => (prev[href] ? prev : { ...prev, [href]: true }));
        }
      }
    }
  }, [pathname, agents]);

  function isActive(href: string) {
    if (onboardingMode) {
      return href === "/onboarding";
    }
    if (href === "/home" || href === "/" || href === "/dashboard") {
      return (
        optimisticPath === "/home" ||
        optimisticPath === "/" ||
        optimisticPath === "/dashboard"
      );
    }
    if (href === "/dashboard/combined" || href === "/unified") {
      return optimisticPath.startsWith("/dashboard/combined") || optimisticPath.startsWith("/unified");
    }
    if (href === "/dashboard/handoffs" || href === "/inbox") {
      return optimisticPath.startsWith("/dashboard/handoffs") || optimisticPath.startsWith("/inbox");
    }
    if (href === "/dashboard/leads" || href === "/leads") {
      return optimisticPath.startsWith("/dashboard/leads") || optimisticPath.startsWith("/leads");
    }
    if (href === "/dashboard/knowledge" || href === "/knowledge") {
      return optimisticPath.startsWith("/dashboard/knowledge") || optimisticPath.startsWith("/knowledge");
    }
    if (href === "/dashboard/proposals" || href === "/quotes") {
      return optimisticPath.startsWith("/dashboard/proposals") || optimisticPath.startsWith("/quotes");
    }
    if (href === "/dashboard/analytics" || href === "/analytics") {
      return optimisticPath.startsWith("/dashboard/analytics") || optimisticPath.startsWith("/analytics");
    }
    if (href === "/dashboard/integrations" || href === "/integrations") {
      return optimisticPath.startsWith("/dashboard/integrations") || optimisticPath.startsWith("/integrations");
    }
    if (href === "/dashboard/workspace" || href === "/workspace") {
      return (
        optimisticPath.startsWith("/dashboard/workspace") ||
        optimisticPath.startsWith("/workspace") ||
        optimisticPath.startsWith("/team") ||
        optimisticPath.startsWith("/meetings")
      );
    }
    if (href === "/dashboard/billing" || href === "/billing") {
      return optimisticPath.startsWith("/dashboard/billing") || optimisticPath.startsWith("/billing");
    }
    if (href === "/dashboard/settings" || href === "/settings") {
      return optimisticPath.startsWith("/dashboard/settings") || optimisticPath.startsWith("/settings");
    }
    return optimisticPath === href || optimisticPath.startsWith(`${href}/`);
  }

  const agentsByHref = useMemo(() => {
    const map: Record<string, Agent[]> = {};
    const activeAgents = agents.filter((a) => a.is_active !== false);
    for (const [href, modes] of Object.entries(AGENT_NAV_MODES)) {
      map[href] = activeAgents.filter((a) => modes.includes(a.mode as AgentMode));
    }
    return map;
  }, [agents]);

  // Fallback nav items if groups is not passed
  const fallbackNavItems = [
    { icon: <LayoutDashboard size={18} />, label: "Overview", href: "/home", active: isActive("/home") },
    { icon: <Smartphone size={18} />, label: "Unified Agent", href: "/unified", active: isActive("/unified") },
    { icon: <Headphones size={18} />, label: "Human Handoff", href: "/inbox", active: isActive("/inbox") },
    { icon: <UserRound size={18} />, label: "Leads CRM", href: "/leads", active: isActive("/leads") },
    { icon: <BookOpen size={18} />, label: "Knowledge Base", href: "/knowledge", active: isActive("/knowledge") },
    { icon: <FileText size={18} />, label: "Proposals", href: "/quotes", active: isActive("/quotes") },
    { icon: <BarChart3 size={18} />, label: "Analytics", href: "/analytics", active: isActive("/analytics") },
    { icon: <Plug size={18} />, label: "Integrations", href: "/integrations", active: isActive("/integrations") },
    { icon: <Calendar size={18} />, label: "Workspace", href: "/workspace", active: isActive("/workspace") },
    { icon: <CreditCard size={18} />, label: "Billing", href: "/billing", active: isActive("/billing") },
    { icon: <Settings size={18} />, label: "Settings", href: "/settings", active: isActive("/settings") },
  ];

  const accountMenu = (side: "top" | "right", align: "end", isMobile = false) => (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        side={side}
        align={align}
        sideOffset={side === "right" ? 12 : 8}
        className="z-[200] min-w-[190px] overflow-hidden rounded-xl p-1.5 shadow-2xl animate-in fade-in-80 zoom-in-95"
        style={{
          border: "1px solid var(--lt-border)",
          background: "var(--lt-card)",
        }}
      >
        <div
          className="px-2.5 py-1.5 mb-1 rounded-md"
          style={{ borderBottom: "1px solid var(--lt-border)" }}
        >
          <p className="text-[12px] font-semibold truncate" style={{ color: "var(--lt-text-primary)" }}>
            {displayName}
          </p>
          <p className="text-[10px] capitalize" style={{ color: "var(--lt-text-muted)" }}>
            {userPlan} plan
          </p>
        </div>

        <DropdownMenu.Item
          onSelect={() => {
            router.push("/settings");
            if (isMobile) handleClose();
          }}
          className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors"
          style={{ color: "var(--lt-text-primary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(3,150,166,0.07)";
            e.currentTarget.style.color = "var(--lt-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--lt-text-primary)";
          }}
        >
          <Settings className="mr-2.5 h-4 w-4 shrink-0" style={{ color: "var(--lt-text-muted)" }} />
          <span>Settings</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item
          onSelect={() => {
            router.push("/help");
            if (isMobile) handleClose();
          }}
          className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors"
          style={{ color: "var(--lt-text-primary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(3,150,166,0.07)";
            e.currentTarget.style.color = "var(--lt-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--lt-text-primary)";
          }}
        >
          <HelpCircle className="mr-2.5 h-4 w-4 shrink-0" style={{ color: "var(--lt-text-muted)" }} />
          <span>Help hub</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item
          onSelect={() => {
            router.push("/privacy");
            if (isMobile) handleClose();
          }}
          className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors"
          style={{ color: "var(--lt-text-primary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(3,150,166,0.07)";
            e.currentTarget.style.color = "var(--lt-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--lt-text-primary)";
          }}
        >
          <Shield className="mr-2.5 h-4 w-4 shrink-0" style={{ color: "var(--lt-text-muted)" }} />
          <span>Privacy &amp; legal</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item
          onSelect={() => {
            openConsentPreferencesModal();
            if (isMobile) handleClose();
          }}
          className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors"
          style={{ color: "var(--lt-text-primary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(3,150,166,0.07)";
            e.currentTarget.style.color = "var(--lt-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--lt-text-primary)";
          }}
        >
          <Cookie className="mr-2.5 h-4 w-4 shrink-0" style={{ color: "var(--lt-text-muted)" }} />
          <span>Cookie preferences</span>
        </DropdownMenu.Item>

        <DropdownMenu.Separator className="h-px my-1" style={{ background: "var(--lt-border)" }} />

        <DropdownMenu.Item
          onSelect={(e) => {
            e.preventDefault();
            setShowLogoutConfirm(true);
          }}
          className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors"
          style={{ color: "var(--lt-error)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(217,100,100,0.07)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut className="mr-2.5 h-4 w-4 shrink-0" style={{ color: "var(--lt-error)" }} />
          <span>Log out</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );

  const renderAgentGroup = (item: NavItem & { locked: boolean }, isMobile = false) => {
    const Icon = iconMap[item.icon] || LayoutDashboard;
    const locked = item.locked;
    const groupAgents = agentsByHref[item.href] || [];
    const multi = groupAgents.length > 1;
    const alone = groupAgents[0];
    const sectionActive = isActive(item.href);
    const showChevron = !locked && groupAgents.length > 0;
    const effectiveExpanded = isMobile ? true : isExpanded;
    const open = Boolean(expandedSubmenus[item.href]) && effectiveExpanded && showChevron;
    const hubHref = locked ? "#" : alone ? `${item.href}?agent=${alone.id}` : item.href;
    const newHref = `/agents/new?mode=${AGENT_NAV_MODES[item.href]?.[0] ?? "website"}`;
    const rowLabel = item.label;

    return (
      <div key={item.href} className="w-full shrink-0">
        <div
          className={`sidebar-nav-item ${sectionActive ? "active" : ""}`}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            borderRadius: 10,
            border: "none",
            cursor: locked ? "not-allowed" : "pointer",
            marginBottom: 2,
            fontSize: 13.5,
            lineHeight: "21px",
            textAlign: "left",
            background: sectionActive ? "var(--sidebar-active)" : "transparent",
            color: sectionActive ? "#F7F5F1" : "#D4DBD0",
            fontWeight: 600,
            opacity: locked ? 0.6 : 1,
            transition: "background 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (sectionActive || locked) return;
            (e.currentTarget as HTMLElement).style.background = "rgba(247,245,241,0.08)";
            (e.currentTarget as HTMLElement).style.color = "#F7F5F1";
          }}
          onMouseLeave={(e) => {
            if (sectionActive || locked) return;
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#D4DBD0";
          }}
        >
          <div
            onClick={() => {
              if (locked) return;
              setOptimisticPath(item.href);
              router.push(hubHref);
              if (isMobile) handleClose();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: effectiveExpanded ? "flex-start" : "center",
              flex: 1,
              minWidth: 0,
              gap: 10,
            }}
          >
            <div style={{ flexShrink: 0, opacity: sectionActive ? 1 : 0.7 }}>
              <Icon size={17} />
            </div>
            {effectiveExpanded && (
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                {rowLabel}
              </span>
            )}
          </div>

          {effectiveExpanded && (
            locked ? (
              <Lock size={13} style={{ color: "#0396A6", flexShrink: 0 }} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <Link
                  href={newHref}
                  title={`New ${item.label.replace(/ Agent$/i, "").toLowerCase()} agent`}
                  aria-label={`New ${item.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isMobile) handleClose();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    color: "rgba(247,245,241,0.65)",
                  }}
                  className="hover:text-[#F7F5F1] hover:bg-white/10 transition-colors"
                >
                  <Plus size={13} />
                </Link>
                {showChevron ? (
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-label={open ? `Collapse ${item.label}` : `Expand ${item.label}`}
                    title={open ? "Collapse" : "Show agents"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedSubmenus((prev) => ({ ...prev, [item.href]: !prev[item.href] }));
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: "transparent",
                      border: "none",
                      color: "rgba(247,245,241,0.65)",
                      cursor: "pointer",
                    }}
                    className="hover:text-[#F7F5F1] hover:bg-white/10 transition-colors"
                  >
                    <ChevronRight
                      size={13}
                      style={{
                        transform: open ? "rotate(90deg)" : "none",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </button>
                ) : null}
              </div>
            )
          )}
        </div>

        <AnimatePresence initial={false}>
          {open && effectiveExpanded && (
            <motion.div
              key={`${item.href}-children`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="ml-3 pl-3 border-l border-white/10 flex flex-col gap-0.5 py-1">
                {groupAgents.map((agent) => {
                  const childHref = `${item.href}?agent=${agent.id}`;
                  const childActive =
                    sectionActive &&
                    (selectedAgentId === agent.id || (!selectedAgentId && alone?.id === agent.id));
                  return (
                    <div
                      key={agent.id}
                      className="group sidebar-sub-item"
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        marginBottom: 1,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOptimisticPath(item.href);
                          setSelectedAgentId(agent.id);
                          router.push(childHref);
                          if (isMobile) handleClose();
                        }}
                        className="flex min-w-0 flex-1 items-center"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 10px",
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                          background: childActive ? "rgba(255,255,255,0.1)" : "transparent",
                          color: childActive ? "#F7F5F1" : "rgba(247,245,241,0.7)",
                          fontSize: 12,
                          textAlign: "left",
                        }}
                        title={agent.agent_name || agent.slug}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: agent.is_active ? "#0396A6" : "rgba(247,245,241,0.3)",
                          }}
                        />
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                          {agent.agent_name || "Untitled"}
                        </span>
                      </button>
                      {renderAgentQuickMenu(agent, item.href, childActive)}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderNavLinks = (items: SidebarNavItem[], isMobile = false) => {
    return items.map((item) => {
      if (AGENT_NAV_MODES[item.href]) {
        return renderAgentGroup(item, isMobile);
      }

      const active = isActive(item.href);
      const Icon = iconMap[item.icon] || LayoutDashboard;
      const locked = item.locked;
      const effectiveExpanded = isMobile ? true : isExpanded;

      return (
        <button
          key={item.href}
          className={`sidebar-nav-item ${active ? "active" : ""}`}
          onClick={() => {
            if (locked) return;
            setOptimisticPath(item.href);
            router.push(item.href);
            if (isMobile) handleClose();
          }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            borderRadius: 10,
            border: "none",
            cursor: locked ? "not-allowed" : "pointer",
            marginBottom: 2,
            fontSize: 13.5,
            lineHeight: "21px",
            textAlign: "left",
            background: active ? "var(--sidebar-active)" : "transparent",
            color: active ? "#F7F5F1" : "#D4DBD0",
            fontWeight: 600,
            opacity: locked ? 0.6 : 1,
            transition: "background 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (active || locked) return;
            e.currentTarget.style.background = "rgba(247,245,241,0.08)";
            e.currentTarget.style.color = "#F7F5F1";
          }}
          onMouseLeave={(e) => {
            if (active || locked) return;
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#D4DBD0";
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: effectiveExpanded ? "flex-start" : "center",
              width: "100%",
              gap: 10,
            }}
          >
            <div style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}>
              <Icon size={17} />
            </div>
            {effectiveExpanded && (
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                {item.label}
              </span>
            )}
            {effectiveExpanded && locked && (
              <Lock size={13} style={{ color: "#0396A6", flexShrink: 0 }} />
            )}
          </div>
        </button>
      );
    });
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={handleClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100001 }}
          className="md:hidden lg:hidden"
        />
      )}

      {/* Desktop Aside */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 select-none relative"
        style={{
          height: "100%",
          width: isExpanded ? 280 : 80,
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
          zIndex: 40,
          transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
        }}
      >
        {/* Logo / Brand Header */}
        <div
          style={{
            padding: isExpanded ? "22px 18px 16px 20px" : "22px 16px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: isExpanded ? "space-between" : "center",
            gap: "16px",
          }}
        >
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", minWidth: 0, flex: 1 }}>
            <BrandLogo collapsed={!isExpanded} forceLight />
          </Link>
          {isExpanded && (
            <button
              onClick={() => handleSetExpanded(false)}
              style={{
                background: "transparent",
                border: "none",
                borderRadius: 6,
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "rgba(247,245,241,0.75)",
                flexShrink: 0,
                marginLeft: "auto",
                transition: "all 0.2s ease",
              }}
              className="hover:text-[#F7F5F1] hover:bg-white/10 active:scale-95"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <Menu size={20} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Collapsed Mode Expand Button */}
        {!isExpanded && (
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
            <button
              onClick={() => handleSetExpanded(true)}
              style={{
                background: "transparent",
                border: "none",
                borderRadius: 8,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "rgba(247,245,241,0.75)",
                transition: "all 0.2s ease",
              }}
              className="hover:text-[#F7F5F1] hover:bg-white/10 active:scale-95"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <Menu size={20} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Navigation List */}
        <nav style={{ flex: 1, padding: "4px 10px", overflowY: "auto", overflowX: "hidden" }} className="no-scrollbar flex flex-col gap-0.5">
          {groups ? (
            renderNavLinks(groups.flatMap((group) => group.items), false)
          ) : (
            fallbackNavItems.map((item) => (
              <button
                key={item.href}
                className={`sidebar-nav-item ${item.active ? "active" : ""}`}
                onClick={() => {
                  router.push(item.href);
                  handleClose();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  marginBottom: 2,
                  fontSize: 13.5,
                  lineHeight: "21px",
                  textAlign: "left",
                  background: item.active ? "var(--sidebar-active)" : "transparent",
                  color: item.active ? "#F7F5F1" : "#D4DBD0",
                  fontWeight: 600,
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (item.active) return;
                  e.currentTarget.style.background = "rgba(247,245,241,0.08)";
                  e.currentTarget.style.color = "#F7F5F1";
                }}
                onMouseLeave={(e) => {
                  if (item.active) return;
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#D4DBD0";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isExpanded ? "flex-start" : "center",
                    width: "100%",
                    gap: 10,
                  }}
                >
                  <div style={{ flexShrink: 0, opacity: item.active ? 1 : 0.7 }}>{item.icon}</div>
                  {isExpanded && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
                </div>
              </button>
            ))
          )}
        </nav>

        {/* Bottom Profile Section */}
        <div style={{ padding: "8px 10px", borderTop: "1px solid var(--sidebar-border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <div
              onClick={() => {
                router.push("/settings");
                handleClose();
              }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "7px 10px",
                borderRadius: 10,
                cursor: "pointer",
                overflow: "hidden",
              }}
              className="hover:bg-white/[0.06] transition-colors"
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#336B55",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#F7F5F1",
                  flexShrink: 0,
                }}
              >
                {initial}
              </div>
              {isExpanded && (
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#F7F5F1",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {displayName}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(247,245,241,0.5)", textTransform: "capitalize" }}>
                    {userPlan}
                  </div>
                </div>
              )}
            </div>

            {isExpanded ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    style={{
                      width: 32,
                      height: 32,
                      background: "transparent",
                      border: "none",
                      borderRadius: 8,
                      color: "rgba(247,245,241,0.7)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                    className="hover:bg-white/10 transition-colors"
                    aria-label="User menu"
                  >
                    <MoreVertical size={16} />
                  </button>
                </DropdownMenu.Trigger>
                {accountMenu("top", "end", false)}
              </DropdownMenu.Root>
            ) : (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                    }}
                    aria-label="User menu"
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "#336B55",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#F7F5F1",
                      }}
                    >
                      {initial}
                    </div>
                  </button>
                </DropdownMenu.Trigger>
                {accountMenu("right", "end", false)}
              </DropdownMenu.Root>
            )}
          </div>
          {sidebarBottomNode}
        </div>
      </aside>

      {/* Mobile Drawer (Slide in from left) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 bottom-0 left-0 z-[100002] w-[80vw] max-w-[280px] h-full flex flex-col text-white select-none md:hidden shadow-2xl"
            style={{
              background: "var(--sidebar-bg)",
              borderRight: "1px solid var(--sidebar-border)",
            }}
            aria-label="Mobile navigation"
          >
            {/* Header with branding and Close button */}
            <div className="flex items-center justify-between p-3.5 mb-1 shrink-0 border-b border-white/[0.08] gap-3">
              <Link href="/" onClick={handleClose} className="flex items-center gap-2.5 no-underline min-w-0">
                <BrandLogo collapsed={false} forceLight />
              </Link>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#F7F5F1]/70 hover:text-[#F7F5F1] hover:bg-white/10 active:bg-white/20 transition-colors shrink-0"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation List */}
            <nav style={{ flex: 1, padding: "4px 10px", overflowY: "auto" }} className="no-scrollbar flex flex-col gap-0.5">
              {groups ? (
                renderNavLinks(groups.flatMap((group) => group.items), true)
              ) : (
                fallbackNavItems.map((item) => (
                  <button
                    key={item.href}
                    className={`sidebar-nav-item ${item.active ? "active" : ""}`}
                    onClick={() => {
                      router.push(item.href);
                      handleClose();
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "none",
                      cursor: "pointer",
                      marginBottom: 2,
                      fontSize: 13.5,
                      textAlign: "left",
                      background: item.active ? "var(--sidebar-active)" : "transparent",
                      color: item.active ? "#F7F5F1" : "#D4DBD0",
                      fontWeight: item.active ? 600 : 500,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", width: "100%", gap: 10 }}>
                      <div style={{ flexShrink: 0, opacity: item.active ? 1 : 0.7 }}>{item.icon}</div>
                      <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
                    </div>
                  </button>
                ))
              )}
            </nav>

            {/* Bottom Profile Section */}
            <div style={{ padding: "8px 10px", borderTop: "1px solid var(--sidebar-border)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                <div
                  onClick={() => {
                    router.push("/settings");
                    handleClose();
                  }}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "7px 10px",
                    borderRadius: 10,
                    cursor: "pointer",
                    overflow: "hidden",
                  }}
                  className="hover:bg-white/[0.06] transition-colors"
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#336B55",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#F7F5F1",
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#F7F5F1",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {displayName}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(247,245,241,0.5)", textTransform: "capitalize" }}>
                      {userPlan}
                    </div>
                  </div>
                </div>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      style={{
                        width: 32,
                        height: 32,
                        background: "transparent",
                        border: "none",
                        borderRadius: 8,
                        color: "rgba(247,245,241,0.7)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                      aria-label="User menu"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenu.Trigger>
                  {accountMenu("top", "end", true)}
                </DropdownMenu.Root>
              </div>
              {sidebarBottomNode}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <ConfirmModal
        show={showLogoutConfirm}
        icon={<LogOut size={20} />}
        tone="danger"
        title="Log Out"
        message="Are you sure you want to log out of your merchant workspace?"
        confirmText="Log Out"
        cancelText="Cancel"
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          if (onLogout) {
            onLogout();
          } else {
            await signOut();
            router.replace("/login");
          }
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <ConfirmModal
        show={Boolean(pendingAgentDelete)}
        icon={<Trash2 size={20} />}
        tone="danger"
        title="Delete agent"
        message={
          pendingAgentDelete
            ? `Delete “${pendingAgentDelete.agent.agent_name || "Untitled"}”? It will stop answering on all channels. This cannot be undone.`
            : ""
        }
        confirmText={deletingAgent ? "Deleting…" : "Delete"}
        cancelText="Cancel"
        onConfirm={() => void confirmDeleteAgent()}
        onCancel={() => {
          if (!deletingAgent) setPendingAgentDelete(null);
        }}
      />
    </>
  );
}
