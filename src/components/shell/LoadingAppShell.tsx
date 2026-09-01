"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MERCHANT_NAV, groupSidebarNav, pageTitleFromPath } from "@/lib/nav";
import { useWorkspace } from "@/lib/workspace";
import { can } from "@/lib/permissions";

export const PageLoadingSpinner = ({ label = "Loading…" }: { label?: string }) => (
  <div className="flex flex-1 min-h-[60vh] w-full items-center justify-center">
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <div className="w-9 h-9 rounded-full border-2 border-[#0396A6] border-t-transparent animate-spin" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  </div>
);

export function LoadingAppShell(_props?: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const ws = useWorkspace();
  const { me, loading, entitlements } = ws;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pageTitle = pageTitleFromPath(pathname || "");

  if (loading || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 rounded-full border-2 border-[#0396A6] border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Loading Frosty…</p>
        </div>
      </div>
    );
  }

  const visible = MERCHANT_NAV.filter(
    (item) => !item.permissions || can(me.permissions, item.permissions),
  ).map((item) => ({
    ...item,
    locked: Boolean(item.feature) && !loading && !ws.allowed(item.feature!),
  }));

  const navGroups = groupSidebarNav(visible);
  const planLabel = entitlements?.plan_name || (loading ? "…" : "Free");

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground selection:bg-primary/20">
      <Sidebar
        groups={navGroups}
        me={me}
        planLabel={planLabel}
        isCollapsed={false}
        setIsCollapsed={() => {}}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <Topbar
          title={pageTitle}
          me={me}
          unread={0}
          openCommandPalette={() => {}}
        />

        <PageLoadingSpinner label={`Loading ${pageTitle}…`} />
      </div>
    </div>
  );
}
