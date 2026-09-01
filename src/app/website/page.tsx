"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from "@/components/shell/AppShell";
import { TopbarTabs, type TopbarTab } from "@/components/shell/Topbar";
import { AgentHeadingSelector } from "@/components/shell/AgentHeadingSelector";
import { EntitlementGate } from "@/components/entitlements/EntitlementGate";
import WebsiteBotDashboard from '@/components/website/WebsiteBotDashboard';
import { useWorkspace } from '@/lib/workspace';
import { apiRequest } from '@/lib/api';
import type { Agent } from '@/lib/types';
import { BarChart2, MessageSquare, ClipboardIcon, Calendar, Settings, Bot } from 'lucide-react';
import { Loading } from '@/components/ui/PageState';
import { useToast, ToastProvider } from "@/lib/toast";

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'chats', label: 'Conversations', icon: MessageSquare },
  { id: 'leads', label: 'Leads', icon: ClipboardIcon },
  { id: 'meetings', label: 'Meetings', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];

export const dynamic = "force-dynamic";

export default function WebsitePage() {
  return (
    <Suspense fallback={<Loading label="Loading workspace..." />}>
      <WebsitePageInner />
    </Suspense>
  );
}

function WebsitePageInner() {
  const { me, merchant, loading } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get("tab") as TabId) || 'analytics';
  const initialSettingSubTab = searchParams?.get("subtab") as
    | 'install'
    | 'persona'
    | 'knowledge'
    | 'widget'
    | 'sandbox'
    | 'usage'
    | 'config'
    | null;

  const [webAgent, setWebAgent] = useState<Agent | null>(null);
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [isWebEnabled, setIsWebEnabled] = useState<boolean>(true);
  const [togglingAgent, setTogglingAgent] = useState(false);
  const [days, setDays] = useState(30);
  const [fromDate, setFromDate] = useState<string | undefined>(undefined);
  const [toDate, setToDate] = useState<string | undefined>(undefined);
  const [hubTab, setHubTab] = useState<TabId>(initialTab);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [allocatedCredits, setAllocatedCredits] = useState<number>(0);
  const { error: toastError } = useToast();

  const handleSelectAgent = async (agentId: string) => {
    const selected = agentsList.find((a) => a.id === agentId) || null;
    setWebAgent(selected);
    if (selected) {
      const { agentLiveOnHub } = await import("@/lib/agentLive");
      setIsWebEnabled(agentLiveOnHub(selected));
    }
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (agentId) {
      params.set("agent", agentId);
    } else {
      params.delete("agent");
    }
    router.replace(params.toString() ? `/website?${params.toString()}` : "/website");
  };

  /**
   * Website agents only (unified lives under Unified Agent nav — D205).
   */
  const resolveWebAgent = useCallback(async () => {
    try {
      const { listAgentsWithChannels, agentLiveOnHub } = await import("@/lib/agentLive");
      const web = await listAgentsWithChannels("website");
      setAgentsList(web);
      const preferredId = searchParams?.get("agent");
      const selected =
        (preferredId && web.find((a) => a.id === preferredId)) || web[0] || null;
      setWebAgent(selected);
      setIsWebEnabled(agentLiveOnHub(selected));
    } catch (err) {
      console.error("Failed to resolve Web agent", err);
    }
  }, [searchParams]);

  /**
   * Pause / resume live website traffic via channel `enabled` (D210).
   * Never PATCH is_active — that soft-deletes and the agent disappears with no reactivate path.
   */
  const handleToggleAgent = async () => {
    if (!webAgent) return;
    setTogglingAgent(true);
    try {
      const { setAgentHubLive, agentLiveOnHub } = await import("@/lib/agentLive");
      const next = await setAgentHubLive(webAgent, !isWebEnabled);
      setWebAgent(next);
      setAgentsList((prev) => prev.map((a) => (a.id === next.id ? next : a)));
      setIsWebEnabled(agentLiveOnHub(next));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("frosty:agents-changed"));
      }
    } catch (err) {
      console.error("Failed to toggle agent", err);
      toastError("Failed to pause or resume this agent. Please try again.");
    } finally {
      setTogglingAgent(false);
    }
  };

  const fetchBalances = async () => {
    try {
      const data = await apiRequest<any>('/v1/billing/wallet');
      const unallocated = Number(data?.unallocated_credits ?? 0) || 0;
      setBalance(unallocated);
      // The wallet API (WalletOut) has no per-feature credit allocation breakdown.
      // allocatedCredits stays 0 until the backend exposes per-feature allocation data.
      setAllocatedCredits(0);
    } catch (err) {
      console.error('Failed to fetch balances', err);
    }
  };

  useEffect(() => {
    void resolveWebAgent();
  }, [resolveWebAgent]);

  useEffect(() => {
    if (me) void fetchBalances();
  }, [me]);

  if (loading) return <Loading label="Loading workspace..." />;

  const MobileNav = (
    <nav
      className="md:hidden"
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 400,
        zIndex: 99999,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '10px 12px',
          borderRadius: 32,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          background: 'rgba(239,236,231,0.55)',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {TABS.map(tab => {
          const isActive = hubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setHubTab(tab.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                minWidth: 52,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive
                    ? '#0396A6'
                    : 'transparent',
                  boxShadow: isActive ? '0 4px 14px rgba(3,150,166,0.35)' : 'none',
                  transform: isActive ? 'scale(1.06)' : 'scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                <tab.icon
                  size={20}
                  style={{ color: isActive ? '#fff' : '#8B847B', transition: 'color 0.2s' }}
                />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: isActive ? '#0396A6' : '#8B847B',
                  opacity: isActive ? 1 : 0.75,
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  const websiteHeaderTabs: TopbarTab[] = TABS.map((tab) => {
    const Icon = tab.icon;
    return {
      key: tab.id,
      label: tab.label,
      icon: <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />,
    };
  });

  return (
    <>
      <AppShell
        title={
          <AgentHeadingSelector
            agentName="Web Agent"
            agents={agentsList}
            selectedAgentId={webAgent?.id}
            onSelectAgent={handleSelectAgent}
          />
        }
        requires="agent:config"
        workspace
        headerTabs={
          <TopbarTabs
            tabs={websiteHeaderTabs}
            activeTab={hubTab}
            onTabChange={(key: string) => setHubTab(key as TabId)}
          />
        }
        actions={
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Left/Available Credits Chip */}
            <Link
              href="/billing"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/80 text-foreground text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Available Wallet Credits"
            >
              <span className="text-muted-foreground text-[11px] font-medium hidden xs:inline">Credits:</span>
              <span className="text-[#0396A6] font-extrabold">{balance.toLocaleString()} CR</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
                {isWebEnabled ? 'Agent Live' : 'Agent Paused'}
              </span>
              <button
                type="button"
                onClick={handleToggleAgent}
                disabled={togglingAgent}
                aria-label={isWebEnabled ? "Pause website agent" : "Resume website agent"}
                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                  isWebEnabled
                    ? 'bg-[#0396A6]'
                    : 'bg-zinc-300 border border-zinc-400'
                } ${togglingAgent ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] shadow-sm transition-transform ${
                    isWebEnabled ? 'right-[3px]' : 'left-[3px]'
                  }`}
                />
              </button>
            </div>
          </div>
        }
      >
        <EntitlementGate feature="channel_web">
          <div className={`flex-1 min-h-0 flex flex-col ${hubTab === 'chats' ? 'pl-2 sm:pl-4 lg:pl-6 pr-2 sm:pr-4 lg:pr-6 pb-3 sm:pb-6' : 'pt-1.5 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6'}`}>
          <div className="hidden">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setHubTab(tab.id)}
                className={`relative py-1.5 transition-all flex items-center gap-2 text-sm font-bold tracking-tight whitespace-nowrap ${hubTab === tab.id ? 'text-[#0396A6]' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <tab.icon size={16} /> {tab.label}
                {hubTab === tab.id && (
                  <span className="absolute -bottom-[9px] left-0 right-0 h-[2.5px] bg-[#0396A6] rounded-t-md" />
                )}
              </button>
            ))}
          </div>

          <div className={`flex-1 min-h-0 flex flex-col ${
            hubTab === 'chats' ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar md:overflow-hidden'
          }`} style={{ WebkitOverflowScrolling: 'touch' }}>
            <Suspense fallback={<Loading label="Loading Dashboard..." />}>
              <WebsiteBotDashboard
                hubTab={hubTab}
                onHubTabChange={setHubTab as any}
                tenantId={merchant?.id ?? me?.active_merchant_id ?? ''}
                isEnabled={isWebEnabled}
                webAgentId={webAgent?.id ?? null}
                allocatedCredits={allocatedCredits}
                mainBalance={balance}
                refreshBalances={fetchBalances}
                days={days}
                fromDate={fromDate}
                toDate={toDate}
                onDaysChange={setDays}
                onDateRangeChange={(range) => {
                  setDays(range.days);
                  setFromDate(range.fromDate);
                  setToDate(range.toDate);
                }}
                initialAgents={agentsList}
                onActiveChatChange={setIsChatOpen}
                initialSettingSubTab={initialSettingSubTab ?? undefined}
                onAgentDeleted={() => {
                  const params = new URLSearchParams(searchParams?.toString() || '');
                  params.delete('agent');
                  router.replace(params.toString() ? `/website?${params.toString()}` : '/website');
                  void resolveWebAgent();
                }}
              />
            </Suspense>
          </div>
          </div>
        </EntitlementGate>
      </AppShell>

      {!(hubTab === 'chats' && isChatOpen) && MobileNav}
    </>
  );
}
