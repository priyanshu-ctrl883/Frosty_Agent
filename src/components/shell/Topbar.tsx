"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Search, Menu, MoreVertical } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import type { Me } from "@/lib/types";
import { NotificationPopover } from "./NotificationPopover";

// ─── TopbarTabs helper ─────────────────────────────────────────────────────────
// Usage in any page:
//
//   import { TopbarTabs, type TopbarTab } from "@/components/shell/Topbar";
//
//   const tabs: TopbarTab[] = [
//     { key: "overview",       label: "Overview",       icon: <BarChart2 className="w-3.5 h-3.5" /> },
//     { key: "conversations",  label: "Conversations",  icon: <MessageCircle className="w-3.5 h-3.5" /> },
//   ];
//
//   // Pass to AppShell:
//   <AppShell title="My Page" headerTabs={<TopbarTabs tabs={tabs} activeTab={tab} onTabChange={setTab} />}>
//
// To add / remove tabs later: just add or remove an entry from the `tabs` array.
// To remove tabs entirely: remove the `headerTabs` prop from AppShell — the header stays the same.

import { MobileBottomNav } from "./MobileBottomNav";

export { MobileBottomNav, type MobileBottomNavTab } from "./MobileBottomNav";

export type TopbarTab = {
  /** Unique key for this tab. */
  key: string;
  /** Display label. */
  label: string;
  /** Optional icon rendered before the label. */
  icon?: React.ReactNode;
  /** If set, clicking navigates instead of calling onTabChange. */
  href?: string;
  /** Optional badge count or indicator. */
  badge?: number | string | React.ReactNode;
};

type TopbarTabsProps = {
  tabs: TopbarTab[];
  /** Key of the currently-active tab. */
  activeTab: string;
  /** Called when a tab without `href` is clicked. */
  onTabChange?: (key: string) => void;
  /** Optional: hide mobile bottom nav dock (e.g. when chat thread is open on mobile) */
  hideMobileBottomNav?: boolean;
};

export function TopbarTabs({ tabs, activeTab, onTabChange, hideMobileBottomNav = false }: TopbarTabsProps) {
  return (
    <>
      <div className="flex items-center justify-center h-full gap-0.5 sm:gap-1 lg:gap-2 overflow-x-auto no-scrollbar max-w-full" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const inner = (
            <>
              {tab.icon && <span className="shrink-0 flex items-center justify-center">{tab.icon}</span>}
              <span className="truncate">{tab.label}</span>
              {Boolean(tab.badge) && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#0396A6]/15 text-[#0396A6] text-[10px] font-bold">
                  {tab.badge}
                </span>
              )}
              {/* Active underline sits flush at the bottom of the header */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-sm bg-[#0396A6]" />
              )}
            </>
          );

          const cls = cn(
            "relative flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 lg:px-4 h-full text-[13px] sm:text-[14px] font-semibold transition-all whitespace-nowrap select-none focus-visible:outline-none shrink-0",
            isActive
              ? "text-[#0396A6]"
              : "text-muted-foreground hover:text-foreground"
          );

          if (tab.href) {
            return (
              <Link key={tab.key} href={tab.href} role="tab" aria-selected={isActive} className={cls}>
                {inner}
              </Link>
            );
          }

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange?.(tab.key)}
              className={cls}
            >
              {inner}
            </button>
          );
        })}
      </div>

      {!hideMobileBottomNav && (
        <MobileBottomNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          usePortal={true}
        />
      )}
    </>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

type Props = {
  me: Me;
  unread: number;
  /** Page title shown on the left. */
  title?: React.ReactNode;
  /** Optional small line below the title. */
  subtitle?: string;
  /**
   * Optional tab strip rendered inline after the title.
   * Use the exported `TopbarTabs` helper or supply any React node.
   * Omit (or pass null) for pages that have no tabs.
   */
  tabs?: React.ReactNode;
  /**
   * Page-specific actions rendered on the right, just before the bell.
   * E.g. credit balance chip, ACTIVE toggle, export button.
   */
  actions?: React.ReactNode;
  /** Toolbar controls placed immediately before the search button. */
  beforeSearch?: React.ReactNode;
  onboardingMode?: boolean;
  openCommandPalette?: () => void;
  hideSidebar?: boolean;
  setIsMobileOpen?: (v: boolean) => void;
  /** Wider centered tab strip — fits 6+ long labels (e.g. Settings) without clipping. */
  wideHeaderTabs?: boolean;
  onUnreadChange?: () => void;
};

export function Topbar({
  me,
  unread,
  title,
  subtitle,
  tabs,
  actions,
  beforeSearch,
  onboardingMode,
  openCommandPalette,
  hideSidebar,
  setIsMobileOpen,
  wideHeaderTabs,
  onUnreadChange,
}: Props) {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between w-full px-2.5 sm:px-4 md:px-5 relative select-none"
      style={{
        borderBottom: "1px solid var(--lt-border)",
        background: "var(--lt-card)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* ── Left: menu + title block ─────────────────────────── */}
      <div
        className={cn(
          "flex items-center min-w-0 shrink-0 gap-1.5 sm:gap-3",
          hideSidebar || onboardingMode ? "sm:pl-1" : ""
        )}
      >
        {!hideSidebar && !onboardingMode && (
          <button
            type="button"
            onClick={() => setIsMobileOpen?.(true)}
            className="md:hidden flex items-center justify-center w-8 h-8 shrink-0 rounded-lg text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus-visible:outline-none"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center min-w-0 pr-1 sm:pr-2">
          {typeof title === "string" ? (
            <h1
              className="text-base sm:text-lg md:text-3xl font-bold tracking-tight text-[var(--foreground)] truncate"
              title={title}
            >
              {title}
            </h1>
          ) : (
            title
          )}
        </div>
      </div>

      {/* ── Center: optional tab strip (desktop only) - Absolute Centered ─────────────── */}
      {tabs && !onboardingMode ? (
        <div
          className={cn(
            "hidden md:flex items-center justify-center absolute left-1/2 top-0 -translate-x-1/2 h-full z-10 pointer-events-auto",
            wideHeaderTabs
              ? "max-w-[min(980px,calc(100%-10rem))] min-w-0 overflow-x-auto no-scrollbar"
              : "max-w-[60%] overflow-x-auto no-scrollbar",
          )}
        >
          {tabs}
        </div>
      ) : null}

      <div className="flex-1 min-w-0" />

      {/* ── Desktop Right: search + bell + actions ─────────────────── */}
      <div className="hidden md:flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
        {/* Page-specific actions (toggle, filters, etc.) */}
        {actions && (
          <div className="flex items-center gap-1.5 sm:gap-2 mr-0.5 sm:mr-1 shrink-0">
            {actions}
          </div>
        )}

        {beforeSearch && (
          <div className="flex items-center gap-1.5 shrink-0">
            {beforeSearch}
          </div>
        )}

        {openCommandPalette && (
          <button
            onClick={openCommandPalette}
            className="relative inline-flex shrink-0 items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-200 focus-visible:outline-none"
            aria-label="Search"
            style={{ color: "var(--lt-text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--lt-surface)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Search className="w-4 h-4 sm:w-[17px] sm:h-[17px]" />
          </button>
        )}

        {/* Notification popover */}
        <NotificationPopover unreadCount={unread} onUnreadChange={onUnreadChange} />
      </div>

      {/* ── Mobile Right: 3-dot dropdown menu ───────────────────────── */}
      <div className="md:hidden flex items-center pr-2.5 sm:pr-3 pl-1 shrink-0">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 focus-visible:outline-none active:scale-95 shadow-sm"
              style={{
                border: "1px solid var(--lt-border)",
                background: "var(--lt-surface)",
                color: "var(--lt-text-primary)",
              }}
              aria-label="More options"
            >
              <MoreVertical className="w-5 h-5" />
              {unread > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full shadow-[0_0_8px_rgba(3,150,166,0.6)]"
                  style={{ background: "var(--lt-primary)" }}
                />
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[220px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl p-1.5 shadow-2xl animate-in fade-in-80 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2"
              align="end"
              sideOffset={8}
              style={{
                border: "1px solid var(--lt-border)",
                background: "var(--lt-card)",
                backdropFilter: "blur(16px)",
              }}
            >
              {beforeSearch && (
                <>
                  <DropdownMenu.Separator className="h-px my-1.5" style={{ background: "var(--lt-border)" }} />
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--lt-text-muted)" }}>
                    Agent &amp; Channel
                  </div>
                  <div className="p-2 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    {beforeSearch}
                  </div>
                </>
              )}

              {/* Search item */}
              {openCommandPalette && (
                <DropdownMenu.Item
                  onClick={openCommandPalette}
                  className="relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-2 text-sm font-medium outline-none transition-colors"
                  style={{ color: "var(--lt-text-primary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(3,150,166,0.08)";
                    e.currentTarget.style.color = "var(--lt-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--lt-text-primary)";
                  }}
                >
                  <Search className="mr-2.5 h-4 w-4" style={{ color: "var(--lt-text-muted)" }} />
                  <span>Search</span>
                </DropdownMenu.Item>
              )}

              {/* Notifications item */}
              <DropdownMenu.Item
                onClick={() => router.push("/notifications")}
                className="relative flex cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium outline-none transition-colors"
                style={{ color: "var(--lt-text-primary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(3,150,166,0.08)";
                  e.currentTarget.style.color = "var(--lt-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--lt-text-primary)";
                }}
              >
                <div className="flex items-center">
                  <Bell className="mr-2.5 h-4 w-4" style={{ color: "var(--lt-text-muted)" }} />
                  <span>Notifications</span>
                </div>
                {unread > 0 && (
                  <span
                    className="ml-2 px-1.5 py-0.5 text-[11px] font-bold rounded-full text-white"
                    style={{ background: "var(--lt-primary)" }}
                  >
                    {unread}
                  </span>
                )}
              </DropdownMenu.Item>

              {/* Page-specific actions (if provided) */}
              {actions && (
                <>
                  <DropdownMenu.Separator className="h-px my-1.5" style={{ background: "var(--lt-border)" }} />
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--lt-text-muted)" }}>
                    Page Actions
                  </div>
                  <div
                    className="p-1 flex flex-col gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {actions}
                  </div>
                </>
              )}

              {/* Tabs navigation (if provided and not onboarding) */}
              {tabs && !onboardingMode && (
                <>
                  <DropdownMenu.Separator className="h-px my-1.5" style={{ background: "var(--lt-border)" }} />
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--lt-text-muted)" }}>
                    Navigation
                  </div>
                  <div
                    className="p-1 flex flex-col gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {tabs}
                  </div>
                </>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
