"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { PageState } from "@/components/ui/PageState";
import { Button } from "@/components/ui/Button";
import { apiRequest, ApiClientError } from "@/lib/api";
import { isInboxChangeEvent, subscribeInboxRealtime } from "@/lib/inboxRealtime";
import { canFeature, isCancelled, isPastDue, isSuspended, planBadgeLabel } from "@/lib/entitlements";
import { MERCHANT_NAV, groupSidebarNav, type NavItem } from "@/lib/nav";
import { can, roleLabel, type MerchantPermission } from "@/lib/permissions";
import { getToken, signOut } from "@/lib/session";
import type { AlertCounts } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { recordPageViewActivity } from "@/lib/impersonation";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { SupportAccessIndicator } from "./SupportAccessModal";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

// Lazy-load heavy shell children that aren't visible at first paint.
// This cuts ~2000+ modules from the per-page compile path in dev.
const CommandMenu = dynamic(() => import("./CommandMenu").then(m => ({ default: m.CommandMenu })), { ssr: false });
const InAppNotificationHost = dynamic(() => import("./InAppNotificationHost").then(m => ({ default: m.InAppNotificationHost })), { ssr: false });
const GlobalChatWidget = dynamic(() => import("./GlobalChatWidget").then(m => ({ default: m.GlobalChatWidget })), { ssr: false });
const MerchantPromoBanner = dynamic(() => import("@/components/banners/MerchantPromoBanner").then(m => ({ default: m.MerchantPromoBanner })), { ssr: false });


type Props = {
  children: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  /** Controls before the topbar search button (agent picker, channel filter). */
  beforeSearch?: React.ReactNode;
  requires?: MerchantPermission | MerchantPermission[];
  onboardingMode?: boolean;
  /** Full-width content area (no max-w-7xl cap) — used by Settings sub-nav layout. */
  wide?: boolean;
  /** Hide the left nav (immersive pages). */
  hideSidebar?: boolean;
  /** Alias used by inbox/leads layouts for edge-to-edge content. */
  fullWidth?: boolean;
  /** Fixed viewport workspace mode with internal scrolling container */
  workspace?: boolean;
  /** Hide default top title & actions header bar if custom header is in children */
  hideHeader?: boolean;
  hideTopbar?: boolean;
  headerTabs?: React.ReactNode;
  /** Wider top tab strip for pages with many long labels (Settings). */
  wideHeaderTabs?: boolean;
  /** Disable outer overflow-y:auto so the page can manage its own internal scroll (e.g. Leads). */
  noScroll?: boolean;
};

const UNREAD_POLL_MS = 30_000;

export function AppShell({
  children,
  title,
  subtitle,
  actions,
  beforeSearch,
  requires,
  onboardingMode,
  wide,
  hideSidebar,
  fullWidth,
  workspace,
  hideHeader,
  hideTopbar,
  headerTabs,
  wideHeaderTabs,
  noScroll,
}: Props) {
  const pathname = usePathname();
  const ws = useWorkspace();
  const { isImpersonating } = useImpersonation();

  // Automatic page-view activity tracking when impersonating
  useEffect(() => {
    if (!pathname || !isImpersonating) return;
    const label = typeof title === "string" ? `Viewed ${title}` : undefined;
    void recordPageViewActivity(pathname, label);
  }, [pathname, isImpersonating, title]);
  const { me, loading, needsMerchant, entitlements } = ws;
  const [unread, setUnread] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const refreshUnread = useCallback(async () => {
    if (!me || !can(me.permissions, "dashboard:view")) return;
    try {
      const out = await apiRequest<AlertCounts>("/v1/notifications/unread-count");
      setUnread(out.unread || 0);
    } catch {
      /* badge is best-effort */
    }
  }, [me]);

  useEffect(() => {
    // Don't redirect during an active impersonation session — the admin uses a JWT
    // instead of a Supabase session, so `me` is always null for them.
    if (!loading && !me && !isImpersonating) {
      window.location.href = "/login";
    }
  }, [loading, me, isImpersonating]);

  useEffect(() => {
    if (!me || !can(me.permissions, "dashboard:view")) return;
    let cancelled = false;
    let intervalId: number | null = null;

    async function tick() {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const out = await apiRequest<AlertCounts>("/v1/notifications/unread-count");
        if (!cancelled) setUnread(out.unread || 0);
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 401) {
          cancelled = true;
          if (intervalId !== null) window.clearInterval(intervalId);
          void signOut().finally(() => {
            window.location.href = "/login";
          });
        }
      }
    }

    void tick();
    intervalId = window.setInterval(() => {
      if (!cancelled) void tick();
    }, UNREAD_POLL_MS);
    const onFocus = () => {
      if (!cancelled) void tick();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      if (intervalId !== null) window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [me]);

  // Real-time bell badge: handoff queue events also write merchant_alerts — refresh immediately.
  useEffect(() => {
    if (!me || !can(me.permissions, "dashboard:view")) return;
    if (!canFeature(entitlements, "human_handoff")) return;
    return subscribeInboxRealtime({
      onEvent: (evt) => {
        if (!isInboxChangeEvent(evt)) return;
        void apiRequest<AlertCounts>("/v1/notifications/unread-count")
          .then((out) => setUnread(out.unread || 0))
          .catch(() => {});
      },
    });
  }, [me, entitlements]);

  if (ws.error) {
    const detail = ws.errorDetail;
    const technical =
      detail?.code || detail?.status
        ? [
            detail.step ? `Failed while loading: ${detail.step}` : null,
            detail.code ? `Code: ${detail.code}` : null,
            detail.status ? `HTTP ${detail.status}` : null,
          ]
            .filter(Boolean)
            .join(" · ")
        : undefined;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <PageState
          icon="lock"
          tone="error"
          title="Workspace Unavailable"
          description={ws.error}
          lockedReason={technical}
          action={
            <Button type="button" onClick={() => ws.reload()}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  if (loading || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)', color: 'var(--lt-text-muted)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--lt-primary)', borderTopColor: 'transparent' }} />
          <p className="text-sm font-medium">Loading Frosty…</p>
        </div>
      </div>
    );
  }

  if (needsMerchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <PageState
          icon="storefront"
          title="You are not part of a workspace yet"
          description={
            "Create one to get started, or ask whoever invited you to send the link again — an " +
            "invitation has to be accepted while it is still valid."
          }
          primaryHref="/signup/google"
          primaryLabel="Create a workspace"
        />
      </div>
    );
  }

  const visible: (NavItem & { locked: boolean })[] = MERCHANT_NAV.filter(
    (item) => !item.permissions || can(me.permissions, item.permissions),
  ).map((item) => ({
    ...item,
    locked: Boolean(item.feature) && !loading && !ws.allowed(item.feature!),
  }));

  const navGroups = groupSidebarNav(visible);

  const allowed = requires === undefined || can(me.permissions, requires);
  const planLabel = planBadgeLabel(entitlements, loading);

  const banner = isSuspended(entitlements)
    ? {
        tone: "bg-red-500 text-white",
        text: "This workspace is suspended for non-payment. Your agents have stopped answering and configuration is read-only. Settle billing or contact support to restore it.",
      }
    : isCancelled(entitlements)
      ? {
          tone: "bg-zinc-800 text-white",
          text: "Your subscription is cancelled. Agents are not answering. Choose a plan on Billing to restore service.",
        }
      : isPastDue(entitlements)
        ? {
            tone: "bg-amber-500 text-white",
            text: "Payment is overdue. Your agents are still answering for now — settle the invoice to avoid suspension.",
          }
        : entitlements?.subscription_status === "trialing"
          ? {
              tone: "bg-blue-600 text-white",
              text:
                entitlements.plan_slug &&
                entitlements.plan_slug !== "free" &&
                entitlements.plan_slug !== "trial"
                  ? `Your ${entitlements.plan_name ?? entitlements.plan_slug} trial is active. First plan charge runs after 7 days — cancel anytime before then.`
                  : "You are currently on a 7-day free trial. Choose a plan in Billing before it expires to avoid interruption.",
            }
          : null;

  return (
    <div className="flex flex-col h-[100dvh] w-screen max-w-full overflow-hidden bg-background text-foreground selection:bg-primary/20">
      {banner && (
        <div className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm shrink-0 w-full ${banner.tone}`} role="status">
          <AlertTriangle className="w-4 h-4" />
          <span>{banner.text}</span>
        </div>
      )}

      <ImpersonationBanner />

      <MerchantPromoBanner placement="top_banner" />

      <div className="flex flex-1 min-h-0 w-full overflow-hidden relative">
        {!onboardingMode && !hideSidebar && (
          <Sidebar 
            groups={navGroups} 
            me={me} 
            planLabel={planLabel} 
            isCollapsed={isCollapsed} 
            setIsCollapsed={setIsCollapsed} 
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
            onboardingMode={onboardingMode}
          />
        )}

        <div className={`flex-1 flex flex-col min-h-0 min-w-0 relative overscroll-contain overflow-hidden h-full`} style={{ WebkitOverflowScrolling: 'touch' }}>
          {!hideTopbar && (
            <Topbar
              me={me}
              unread={unread}
              openCommandPalette={() => setCommandOpen(true)}
              onboardingMode={onboardingMode}
              title={title}
              subtitle={subtitle}
              actions={actions}
              beforeSearch={beforeSearch}
              tabs={headerTabs}
              wideHeaderTabs={wideHeaderTabs}
              hideSidebar={hideSidebar}
              setIsMobileOpen={setIsMobileOpen}
              onUnreadChange={refreshUnread}
            />
          )}
          
          <CommandMenu open={commandOpen} setOpen={setCommandOpen} />

          <div
            data-lenis-prevent
            className={
              (noScroll || workspace)
                ? "flex-1 min-h-0 flex flex-col overflow-y-auto md:overflow-hidden w-full h-full"
                : fullWidth || hideSidebar || wide
                  ? "px-3 sm:px-6 lg:px-8 pb-4 sm:pb-6 pt-4 sm:pt-6 w-full flex-1 overflow-y-auto"
                  : "px-3 sm:px-6 lg:px-10 pb-4 sm:pb-8 pt-5 sm:pt-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto"
            }
          >

          <AnimatePresence mode="wait">
            <motion.main 
              key={pathname}
              initial={(wide || noScroll || workspace) ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={(wide || noScroll || workspace) ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: (wide || noScroll || workspace) ? 0 : 0.2, ease: "easeOut" }}
              className={(noScroll || workspace) ? "w-full min-h-full md:h-full md:flex-1 md:min-h-0 md:flex md:flex-col md:overflow-hidden relative" : "w-full relative"}
            >
              {allowed ? (
                children
              ) : (
                <PageState
                  icon="lock"
                  tone="error"
                  title="You don't hold this permission"
                  description={
                    "This screen needs a permission your role does not carry. Ask an owner to grant " +
                    "it — permissions come from the database, so the change takes effect on your next " +
                    "request with no need to sign in again."
                  }
                  lockedReason={`Signed in as ${roleLabel(me.role, me.is_owner)}`}
                  secondaryHref="/home"
                  secondaryLabel="Back to home"
                />
              )}
            </motion.main>
          </AnimatePresence>
          </div>
        </div>
      </div>
      <MerchantPromoBanner placement="modal" />
      <MerchantPromoBanner placement="floating_toast" />
      <InAppNotificationHost />
      {!onboardingMode && Boolean(pathname?.startsWith("/help")) && <GlobalChatWidget />}
    </div>
  );
}

