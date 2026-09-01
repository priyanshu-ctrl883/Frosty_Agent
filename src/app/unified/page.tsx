"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from "@/components/shell/AppShell";
import { TopbarTabs, type TopbarTab } from "@/components/shell/Topbar";
import { AgentHeadingSelector } from "@/components/shell/AgentHeadingSelector";
import { EntitlementGate } from "@/components/entitlements/EntitlementGate";
import UnifiedBotDashboard from '@/components/unified/UnifiedBotDashboard';
import { useWorkspace } from '@/lib/workspace';
import { apiRequest } from '@/lib/api';
import type { Agent } from '@/lib/types';
import { BarChart2, MessageSquare, ClipboardIcon, Calendar, Settings, Bot } from 'lucide-react';
import { Loading } from '@/components/ui/PageState';

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'chats', label: 'Conversations', icon: MessageSquare },
  { id: 'leads', label: 'Leads', icon: ClipboardIcon },
  { id: 'meetings', label: 'Meetings', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];

export const dynamic = "force-dynamic";

export default function UnifiedPage() {
  return (
    <Suspense fallback={<Loading label="Loading workspace..." />}>
      <UnifiedPageInner />
    </Suspense>
  );
}

function UnifiedPageInner() {
  const { me, loading } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get("tab") as TabId) || 'analytics';

  const [balance, setBalance] = useState<number>(0);
  const [allocatedCredits, setAllocatedCredits] = useState<number>(0);
  const [isUnifiedEnabled, setIsUnifiedEnabled] = useState<boolean>(true);
  const [days, setDays] = useState(30);
  const [hubTab, setHubTab] = useState<TabId>(initialTab);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [unifiedAgent, setUnifiedAgent] = useState<Agent | null>(null);
  const [agentsResolved, setAgentsResolved] = useState(false);

  const fetchBalances = async () => {
    try {
      const data = await apiRequest<any>('/v1/billing/wallet');
      const unallocated = Number(data?.unallocated_credits ?? 0) || 0;
      setBalance(unallocated);
      setAllocatedCredits(unallocated);
    } catch (err) {
      console.error('Failed to fetch balances', err);
    }
  };

  const [togglingAgent, setTogglingAgent] = useState(false);

  const resolveUnifiedAgent = useCallback(async () => {
    setAgentsResolved(false);
    try {
      const { listAgentsWithChannels, agentLiveOnHub } = await import("@/lib/agentLive");
      const list = await listAgentsWithChannels("unified");
      setAgentsList(list);
      const preferredId = searchParams?.get("agent");
      const selected =
        (preferredId && list.find((a) => a.id === preferredId)) || list[0] || null;
      setUnifiedAgent(selected);
      setIsUnifiedEnabled(agentLiveOnHub(selected));
    } catch (err) {
      console.error("Failed to resolve Unified agent", err);
    } finally {
      setAgentsResolved(true);
    }
  }, [searchParams]);

  const handleSelectAgent = async (agentId: string) => {
    const selected = agentsList.find((a) => a.id === agentId) || null;
    setUnifiedAgent(selected);
    if (selected) {
      const { agentLiveOnHub } = await import("@/lib/agentLive");
      setIsUnifiedEnabled(agentLiveOnHub(selected));
    }
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (agentId) {
      params.set("agent", agentId);
    } else {
      params.delete("agent");
    }
    router.replace(params.toString() ? `/unified?${params.toString()}` : "/unified");
  };

  const handleToggleAgent = async () => {
    if (!unifiedAgent) return;
    setTogglingAgent(true);
    try {
      const { setAgentHubLive, agentLiveOnHub } = await import("@/lib/agentLive");
      const updated = await setAgentHubLive(unifiedAgent, !isUnifiedEnabled);
      setUnifiedAgent(updated);
      setAgentsList((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setIsUnifiedEnabled(agentLiveOnHub(updated));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("frosty:agents-changed"));
      }
    } catch (err) {
      console.error("Failed to toggle Unified agent", err);
    } finally {
      setTogglingAgent(false);
    }
  };

  useEffect(() => {
    if (me) {
      void fetchBalances();
      void resolveUnifiedAgent();
    }
  }, [me, resolveUnifiedAgent]);

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

  const unifiedHeaderTabs: TopbarTab[] = TABS.map((tab) => {
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
            agentName="Unified Agent"
            agents={agentsList}
            selectedAgentId={unifiedAgent?.id}
            onSelectAgent={handleSelectAgent}
          />
        }
        requires="agent:config"
        workspace
        headerTabs={
          <TopbarTabs
            tabs={unifiedHeaderTabs}
            activeTab={hubTab}
            onTabChange={(key) => setHubTab(key as TabId)}
          />
        }
        actions={
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Left/Available Credits Chip */}
            <Link
              href="/billing"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/80 text-foreground text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Available Wallet Credits"
            >
              <span className="text-muted-foreground text-[11px] font-medium hidden xs:inline">Credits:</span>
              <span className="text-[#0396A6] font-extrabold">{balance.toLocaleString()} CR</span>
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] shrink-0">
              <span className="hidden sm:inline text-[10px] font-bold tracking-widest text-[#0396A6] uppercase">{isUnifiedEnabled ? 'Active' : 'Paused'}</span>
              <button
                type="button"
                disabled={!unifiedAgent || togglingAgent}
                onClick={() => void handleToggleAgent()}
                title={isUnifiedEnabled ? "Active — click to pause unified agent" : "Paused — click to activate unified agent"}
                aria-label={isUnifiedEnabled ? "Pause unified agent" : "Resume unified agent"}
                className={`w-9 h-5 rounded-full transition-all relative focus:outline-none shrink-0 cursor-pointer ${
                  isUnifiedEnabled
                    ? 'bg-[#0396A6]'
                    : 'bg-zinc-300 border border-zinc-400'
                } ${togglingAgent ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] shadow-sm transition-transform ${
                    isUnifiedEnabled ? 'right-[3px]' : 'left-[3px]'
                  }`}
                />
              </button>
            </div>
          </div>
        }
      >
        <EntitlementGate feature="channel_unified">
          <div className="flex flex-1 min-h-0 flex-col pt-1.5 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
          {agentsResolved && !unifiedAgent ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 mb-6 max-w-xl">
              <p className="text-sm text-muted-foreground">
                No unified agent yet.{" "}
                <Link href="/agents/new?mode=unified" className="text-[#0396A6] font-semibold underline">
                  Create one
                </Link>
                .
              </p>
            </div>
          ) : null}
          {/* Internal Tabs Navigation - hidden on desktop since we use topbar tabs now */}
          <div className="hidden">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setHubTab(tab.id)}
                className={`relative py-1.5 transition-all flex items-center gap-2 text-sm font-bold tracking-tight whitespace-nowrap ${hubTab === tab.id ? 'text-[var(--pine)]' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <tab.icon size={16} /> {tab.label}
                {hubTab === tab.id && (
                  <span className="absolute -bottom-[9px] left-0 right-0 h-[2.5px] bg-[var(--pine)] rounded-t-md" />
                )}
              </button>
            ))}
          </div>

          {/* On mobile: allow full page scroll for non-chat tabs; lock for chat */}
          <div className={`flex-1 min-h-0 flex flex-col ${
            hubTab === 'chats' ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar md:overflow-hidden'
          }`} style={{ WebkitOverflowScrolling: 'touch' }}>
            <Suspense fallback={<Loading label="Loading Dashboard..." />}>
              <UnifiedBotDashboard
                hubTab={hubTab}
                onHubTabChange={setHubTab as any}
                tenantId={me?.active_merchant_id ?? ''}
                allocatedCredits={allocatedCredits}
                mainBalance={balance}
                isEnabled={isUnifiedEnabled}
                refreshBalances={fetchBalances}
                unifiedAgentId={unifiedAgent?.id ?? null}
                days={days}
                onDaysChange={setDays}
                onActiveChatChange={setIsChatOpen}
                onAgentDeleted={() => {
                  const params = new URLSearchParams(searchParams?.toString() || '');
                  params.delete('agent');
                  router.replace(params.toString() ? `/unified?${params.toString()}` : '/unified');
                  void resolveUnifiedAgent();
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
