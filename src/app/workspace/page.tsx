"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { TopbarTabs, type TopbarTab } from "@/components/shell/Topbar";
import { Loading, ErrorBox } from "@/components/ui/PageState";
import { apiRequest } from "@/lib/api";
import { can } from "@/lib/permissions";
import { useWorkspace } from "@/lib/workspace";
import { useToast, ToastProvider } from "@/lib/toast";
import type {
  MerchantSettings,
  Meeting,
  CalendarStatus,
  Team,
  Role,
} from "@/lib/types";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  RefreshCw,
} from "lucide-react";

import { WorkspaceOverviewTab } from "@/components/workspace/tabs/WorkspaceOverviewTab";
import { WorkspaceMeetingsTab } from "@/components/workspace/tabs/WorkspaceMeetingsTab";
import { WorkspaceTeamTab } from "@/components/workspace/tabs/WorkspaceTeamTab";

/* ── Primary 3 Workspace Tabs ── */
const WORKSPACE_TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "meetings", label: "Meetings", icon: Calendar },
  { id: "team", label: "Team", icon: Users },
] as const;

type TabId = (typeof WORKSPACE_TABS)[number]["id"];

function resolveTab(param: string | null): TabId {
  if (param === "meetings") return "meetings";
  if (param === "team") return "team";
  return "overview";
}

export const dynamic = "force-dynamic";

export default function WorkspacePage() {
  return (
    <Suspense fallback={<Loading label="Loading workspace..." />}>
      <WorkspacePageInner />
    </Suspense>
  );
}

function WorkspacePageInner() {
  const { me, merchant } = useWorkspace();
  const searchParams = useSearchParams();
  const { error: toastError } = useToast();

  const canManageTeam = can(me?.permissions, "team:manage") || Boolean(me?.is_owner);
  const canManageMeetings = can(me?.permissions, "meetings:manage") || Boolean(me?.is_owner);
  const isOwner = Boolean(me?.is_owner);

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabId>(resolveTab(tabParam));

  // Global modals triggered across tabs
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // ── Workspace State ──
  const [settings, setSettings] = useState<MerchantSettings | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [calendar, setCalendar] = useState<CalendarStatus | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  const [loading, setLoading] = useState(true);
  const setError = useCallback(
    (msg: string | null) => {
      if (msg) toastError(msg);
    },
    [toastError]
  );

  // ── Load All Workspace Data ──
  const load = useCallback(async () => {
    setError(null);
    try {
      const [settSnap, meetSnap, calSnap, teamSnap, rolesSnap] =
        await Promise.all([
          apiRequest<MerchantSettings>("/v1/settings").catch(() => null),
          apiRequest<Meeting[]>("/v1/meetings?limit=50").catch(() => []),
          apiRequest<CalendarStatus>("/v1/calendar/status").catch(() => null),
          apiRequest<Team>("/v1/team").catch(() => null),
          apiRequest<Role[]>("/v1/team/roles").catch(() => []),
        ]);

      setSettings(settSnap);
      setMeetings(Array.isArray(meetSnap) ? meetSnap : []);
      setCalendar(calSnap);
      setTeam(teamSnap);
      setRoles(Array.isArray(rolesSnap) ? rolesSnap : []);
    } catch (err) {
      console.error("Failed to load workspace data", err);
      setError(err instanceof Error ? err.message : "Failed to load workspace data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(resolveTab(tab));
    }
  }, [searchParams]);

  const selectTab = useCallback((id: TabId) => {
    setActiveTab(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", id);
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  const upcomingCount = meetings.filter(
    (m) => m.status === "scheduled" || m.status === "confirmed" || m.status === "pending_approval"
  ).length;
  const teamCount = team?.members?.length || 0;

  const workspaceTabs: TopbarTab[] = WORKSPACE_TABS.map((tab) => ({
    key: tab.id,
    label: tab.label,
    icon: <tab.icon className="w-3.5 h-3.5 text-[#0396A6]" />,
  }));

  return (
    <AppShell
      wide
      title="Workspace"
      subtitle="Manage your company workspace, meetings, and team members."
      requires="dashboard:view"
      headerTabs={
        <TopbarTabs
          tabs={workspaceTabs}
          activeTab={activeTab}
          onTabChange={(key) => selectTab(key as TabId)}
        />
      }
    >
      <div className="flex-1 min-h-0 flex flex-col space-y-6 animate-in fade-in duration-300 pb-8">
        {/* ── CONTENT AREA ── */}
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <RefreshCw size={20} className="animate-spin text-[#0396A6]" />
            Loading Workspace...
          </div>
        ) : (
          <div className="w-full">
            {/* 1. Overview Tab */}
            {activeTab === "overview" && (
              <WorkspaceOverviewTab
                settings={settings}
                meetings={meetings}
                team={team}
                canManageTeam={canManageTeam}
                canManageMeetings={canManageMeetings}
                onNavigateTab={(tab) => selectTab(tab)}
                onOpenScheduleModal={() => {
                  selectTab("meetings");
                  setIsScheduleModalOpen(true);
                }}
                onOpenInviteModal={() => {
                  selectTab("team");
                  setIsInviteModalOpen(true);
                }}
              />
            )}

            {/* 2. Meetings Tab */}
            {activeTab === "meetings" && (
              <WorkspaceMeetingsTab
                meetings={meetings}
                calendar={calendar}
                canManage={canManageMeetings}
                loading={loading}
                onRefresh={load}
                isScheduleModalOpen={isScheduleModalOpen}
                onCloseScheduleModal={() => setIsScheduleModalOpen(false)}
                onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
              />
            )}

            {/* 3. Team Tab */}
            {activeTab === "team" && (
              <WorkspaceTeamTab
                team={team}
                roles={roles}
                canManageTeam={canManageTeam}
                isOwner={isOwner}
                currentUserId={me?.user_id}
                loading={loading}
                onRefresh={load}
                isInviteModalOpen={isInviteModalOpen}
                onCloseInviteModal={() => setIsInviteModalOpen(false)}
                onOpenInviteModal={() => setIsInviteModalOpen(true)}
              />
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}