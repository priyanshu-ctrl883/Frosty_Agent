"use client";

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell } from "@/components/shell/AppShell";
import { Loading, ErrorBox } from "@/components/ui/PageState";
import { SettingsSkeleton } from "@/components/ui/Skeleton";
import { apiRequest } from "@/lib/api";
import type {
  ApiKeyRotation, CalendarStatus, MerchantSettings,
  AutomationPoliciesResponse, AutomationRequestsResponse,
  AgentActionRequest, WaAccount, Agent,
} from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import { isServiceStopped, isSuspended } from "@/lib/entitlements";
import { useToast, ToastProvider } from "@/lib/toast";
import {
  Building2, Globe, Bot, Bell, Sliders, History,
  RefreshCw
} from 'lucide-react';

import { CompanyProfileTab } from '@/components/settings/tabs/CompanyProfileTab';
import { EcosystemTab } from '@/components/settings/tabs/EcosystemTab';
import { AutomationGuardrailsTab } from '@/components/settings/tabs/AutomationGuardrailsTab';
import { NotificationsChimesTab } from '@/components/settings/tabs/NotificationsChimesTab';
import { OthersTab } from '@/components/settings/tabs/OthersTab';
import { SettingsActivityTab } from '@/components/settings/tabs/SettingsActivityTab';


/* ── Primary 5 Top-Level Navigation Tabs ── */
const SETTINGS_TABS = [
  { id: 'profile', label: 'Company Profile', icon: Building2, aliases: ['general'] },
  { id: 'ecosystem', label: 'Ecosystem', icon: Globe, aliases: ['hours'] },
  { id: 'automation', label: 'Automation & Guardrails', icon: Bot, aliases: [] },
  { id: 'notifications', label: 'Notifications & Chimes', icon: Bell, aliases: ['alerts'] },
  { id: 'activity', label: 'Activity', icon: History, aliases: ['audit', 'log'] },
  { id: 'others', label: 'Others', icon: Sliders, aliases: ['privacy', 'developer', 'integrations'] },
] as const;

type TabId = typeof SETTINGS_TABS[number]['id'];

function resolveTab(param: string | null): TabId {
  if (!param) return 'profile';
  for (const tab of SETTINGS_TABS) {
    if (tab.id === param || (tab.aliases as readonly string[]).includes(param)) {
      return tab.id;
    }
  }
  return 'profile';
}

function hasPerm(me: { permissions: string[]; is_owner: boolean } | null, code: string): boolean {
  if (!me) return false;
  if (me.is_owner) return true;
  return me.permissions.includes(code);
}

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <Suspense fallback={<Loading label="Loading settings..." />}>
      <ToastProvider>
        <SettingsPageInner />
      </ToastProvider>
    </Suspense>
  );
}

function SettingsPageInner() {
  const { me, merchant, entitlements } = useWorkspace();
  const searchParams = useSearchParams();
  const { success: toastSuccess, error: toastError } = useToast();

  const readOnly = isServiceStopped(entitlements);
  const canConfig = hasPerm(me, 'agent:config');
  const canBilling = hasPerm(me, 'billing:manage');
  const isOwner = me?.is_owner ?? false;

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabId>(resolveTab(tabParam));

  // ── Backend Settings State ──
  const [data, setData] = useState<MerchantSettings | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [policies, setPolicies] = useState<AutomationPoliciesResponse["policies"]>([]);
  const [pendingReqs, setPendingReqs] = useState<AgentActionRequest[]>([]);
  const [calendar, setCalendar] = useState<CalendarStatus | null>(null);
  const [waAccounts, setWaAccounts] = useState<WaAccount[]>([]);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Load All Data ──
  const load = useCallback(async () => {
    setError(null);
    try {
      const [snap, pol, reqs, cal, wa, ag] = await Promise.all([
        apiRequest<MerchantSettings>("/v1/settings"),
        apiRequest<AutomationPoliciesResponse>("/v1/automation/policies").catch(() => ({ policies: [] })),
        apiRequest<AutomationRequestsResponse>("/v1/automation/requests?status=pending&limit=50").catch(() => ({ items: [], limit: 50, offset: 0 })),
        apiRequest<CalendarStatus>("/v1/calendar/status").catch(() => null),
        apiRequest<WaAccount[]>("/v1/wa/accounts").catch(() => []),
        apiRequest<Agent[]>("/v1/agents").catch(() => []),
      ]);

      setData(snap);
      setPolicies(pol.policies);
      setPendingReqs(reqs.items);
      setCalendar(cal);
      setWaAccounts(Array.isArray(wa) ? wa : []);
      setAgents(Array.isArray(ag) ? ag : []);
    } catch (err) {
      console.error("Failed to load settings", err);
      setError(err instanceof Error ? err.message : "Failed to load workspace settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  // Sync tab with URL query parameter
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

  // Rotate Key — confirmation handled in OthersTab
  const handleRotateKey = async () => {
    try {
      const rotated = await apiRequest<ApiKeyRotation>("/v1/settings/api-key/rotate", { method: "POST" });
      setRevealedKey(rotated.publishable_key);
      toastSuccess(rotated.widget_needs_update
        ? "Key rotated. Live chat widgets using the old key are offline until updated."
        : "Key rotated successfully — copy it now, it is shown once.");
      await load();
    } catch (err: any) {
      toastError(err instanceof Error ? err.message : "Key rotation failed");
      throw err;
    }
  };

  const pendingCount = pendingReqs.length;

  // Mobile Bottom Navigation Bar
  const MobileNav = (
    <nav
      className="md:hidden"
      style={{
        position: 'fixed',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 20px)',
        maxWidth: 420,
        zIndex: 99999,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          borderRadius: 28,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          background: 'rgba(239,236,231,0.85)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {SETTINGS_TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                flex: 1,
                minWidth: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '2px 0',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive ? '#0396A6' : 'transparent',
                  boxShadow: isActive ? '0 3px 10px rgba(3,150,166,0.35)' : 'none',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                <tab.icon
                  size={16}
                  style={{ color: isActive ? '#fff' : '#8B847B', transition: 'color 0.2s' }}
                />
              </div>
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: isActive ? '#0396A6' : '#8B847B',
                  opacity: isActive ? 1 : 0.8,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {tab.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      <AppShell
        wide
        wideHeaderTabs
        noScroll
        title="Settings"
        subtitle="Configure company profile, ecosystem connections, AI tool guardrails, and alert preferences."
        requires="dashboard:view"
        headerTabs={
          <div className="flex items-center h-full flex-nowrap gap-2 sm:gap-4 lg:gap-5 overflow-x-auto no-scrollbar max-w-full px-1">
            {SETTINGS_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                className={`relative h-full transition-all flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-[13px] font-bold tracking-tight whitespace-nowrap cursor-pointer select-none px-1 sm:px-0 shrink-0 ${
                  activeTab === tab.id ? 'text-[#0396A6]' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon size={15} />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0396A6] rounded-t-md" />
                )}
              </button>
            ))}
          </div>
        }
      >
        <div className="flex flex-col h-full min-h-0 min-w-0 overflow-x-hidden animate-in fade-in duration-300">
          {/* Workspace Suspension / Read-Only Alert */}
          {readOnly && (
            <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-900 text-xs font-semibold flex items-center justify-between shadow-xs">
              <div>
                <strong>{isSuspended(entitlements) ? "Workspace suspended" : "Subscription cancelled"}.</strong>{" "}
                Settings are currently in read-only mode.
              </div>
              <Link href="/billing" className="font-bold underline text-red-900 hover:text-red-700">
                Go to Billing
              </Link>
            </div>
          )}

          {/* Global Error Box */}
          {error && <ErrorBox message={error} onRetry={() => void load()} />}

          {/* ── CONTENT AREA ── */}
          {loading || !data ? (
            <div className="w-full max-w-6xl mx-auto pt-5 sm:pt-6 px-3 sm:px-6">
              <SettingsSkeleton />
            </div>
          ) : activeTab === 'activity' ? (
            /* Activity tab: flex-1 so only table rows scroll, page stays locked */
            <div className="flex-1 min-h-0 flex flex-col w-full overflow-hidden pt-5 px-3 sm:px-6">
              <SettingsActivityTab canAudit={hasPerm(me, 'team:manage')} />
            </div>
          ) : (
            /* All other tabs: full-page inner scroll within the noScroll shell */
            <div className="w-full max-w-6xl mx-auto flex-1 min-w-0 overflow-y-auto overflow-x-hidden pt-5 sm:pt-6 pb-12 px-3 sm:px-6">
              {/* 1. Company Profile */}
              {activeTab === 'profile' && (
                <CompanyProfileTab
                  settings={data}
                  canConfig={canConfig}
                  canBilling={canBilling}
                  readOnly={readOnly}
                  onRefresh={load}
                  merchantId={merchant?.id}
                  userEmail={me?.email}
                />
              )}

              {/* 2. Ecosystem */}
              {activeTab === 'ecosystem' && (
                <EcosystemTab
                  agents={agents}
                  waAccounts={waAccounts}
                  calendar={calendar}
                  onNavigateTab={(tabId, subTab) => {
                    if (tabId === 'others') {
                      selectTab('others');
                    }
                  }}
                />
              )}

              {/* 3. Automation & Guardrails */}
              {activeTab === 'automation' && (
                <AutomationGuardrailsTab
                  settings={data}
                  policies={policies}
                  pendingReqs={pendingReqs}
                  canConfig={canConfig}
                  readOnly={readOnly}
                  onRefresh={load}
                />
              )}

              {/* 4. Notifications & Chimes */}
              {activeTab === 'notifications' && (
                <NotificationsChimesTab
                  settings={data}
                  canConfig={canConfig}
                  readOnly={readOnly}
                  onRefresh={load}
                />
              )}

              {/* 5. Others */}
              {activeTab === 'others' && (
                <OthersTab
                  settings={data}
                  revealedKey={revealedKey}
                  agents={agents}
                  canConfig={canConfig}
                  canBilling={canBilling}
                  isOwner={isOwner}
                  readOnly={readOnly}
                  onRefresh={load}
                  onRotateKey={handleRotateKey}
                  initialSubTab={
                    tabParam === 'developer' || tabParam === 'api-keys'
                      ? 'api-keys'
                      : tabParam === 'integrations'
                        ? 'integrations'
                        : 'privacy'
                  }
                />
              )}
            </div>
          )}

        </div>
      </AppShell>

      {MobileNav}
    </>
  );
}
