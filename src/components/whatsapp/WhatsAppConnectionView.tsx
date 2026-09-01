'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Trash2,
  Lock,
  HelpCircle,
  Activity,
  Send,
  Eye,
  EyeOff,
  Radio,
  AlertCircle,
  PhoneCall,
  Edit2,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { useWorkspace } from '@/lib/workspace';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Select } from '@/components/ui/Select';
import type { WaAccount, WaTemplate, WaDeliveryIssue, Agent } from '@/lib/types';
import Link from 'next/link';
import { useMetaEmbeddedSignup } from '@/hooks/useMetaEmbeddedSignup';

interface WhatsAppConnectionViewProps {
  tenantId: string;
  waAgentId?: string | null;
  onRefreshParent?: () => void;
}

export function WhatsAppConnectionView({
  tenantId,
  waAgentId,
  onRefreshParent,
}: WhatsAppConnectionViewProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const { allowed, isOverride } = useWorkspace();
  const {
    launchEmbeddedSignup,
    isConnecting: isEmbeddedConnecting,
    isConfigured: isEmbeddedConfigured,
    configLoading: isEmbeddedConfigLoading,
    requiresHttps,
  } = useMetaEmbeddedSignup();

  // Accounts state
  const [accounts, setAccounts] = useState<WaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [waAgents, setWaAgents] = useState<Agent[]>([]);

  // Modals & Panels
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);
  const [activeGuideStep, setActiveGuideStep] = useState<number | null>(0);
  const [disconnectAccountId, setDisconnectAccountId] = useState<number | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [editLabelAccount, setEditLabelAccount] = useState<WaAccount | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [isSavingLabel, setIsSavingLabel] = useState(false);

  // Form State for Connect
  const [formAgentId, setFormAgentId] = useState<string>(waAgentId || '');
  const [wabaId, setWabaId] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [accountLabel, setAccountLabel] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Quick Action States
  const [syncingTemplatesId, setSyncingTemplatesId] = useState<number | null>(null);
  const [updatingDefaultId, setUpdatingDefaultId] = useState<number | null>(null);
  const [togglingActiveId, setTogglingActiveId] = useState<number | null>(null);

  // Diagnostics State
  const [deliveryIssues, setDeliveryIssues] = useState<WaDeliveryIssue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  // Copy Feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Webhook URLs
  const metaApiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.frosty.frostrek.com';
  const webhookUrl = `${metaApiBase}/v1/webhooks/meta`;
  const verifyToken = `assistant_whatsapp_${tenantId ? tenantId.slice(0, 8) : 'default'}`;

  // Fetch Accounts & Agents
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsRes, agentsRes] = await Promise.all([
        apiRequest<WaAccount[]>('/v1/wa/accounts'),
        apiRequest<Agent[]>('/v1/agents').catch(() => []),
      ]);

      const waOnly = (Array.isArray(agentsRes) ? agentsRes : []).filter(
        (a) => a.mode === 'whatsapp' || a.mode === 'unified'
      );
      setWaAgents(waOnly);

      const accountsList = Array.isArray(accountsRes) ? accountsRes : [];
      setAccounts(accountsList);

      if (!formAgentId && waOnly.length > 0) {
        setFormAgentId(waAgentId || waOnly[0]?.id || '');
      }
    } catch (err: unknown) {
      console.error('Failed to load WhatsApp data', err);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [waAgentId, formAgentId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (waAgentId) {
      setFormAgentId(waAgentId);
    }
  }, [waAgentId]);

  // Load diagnostics when drawer is opened
  const loadDeliveryIssues = async () => {
    setLoadingIssues(true);
    try {
      const res = await apiRequest<WaDeliveryIssue[]>('/v1/wa/delivery-issues?limit=25');
      setDeliveryIssues(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch delivery issues', err);
      setDeliveryIssues([]);
    } finally {
      setLoadingIssues(false);
    }
  };

  const handleOpenDiagnostics = () => {
    setIsDiagnosticsOpen(true);
    void loadDeliveryIssues();
  };

  // Copy helper
  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toastSuccess('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Paste helper for form inputs
  const handlePasteInto = async (setter: (val: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setter(text.trim());
        toastSuccess('Pasted from clipboard');
      }
    } catch {
      // Ignore clipboard read errors
    }
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhoneId = phoneId.trim();
    const cleanWabaId = wabaId.trim();
    const cleanToken = accessToken.trim();
    const cleanLabel = accountLabel.trim();
    const targetAgentId = formAgentId || waAgentId;

    if (!cleanPhoneId || !cleanWabaId || !cleanToken) {
      toastError('Please fill in Phone Number ID, WABA ID, and Permanent Access Token.');
      return;
    }

    if (!targetAgentId) {
      toastError('Please select a WhatsApp agent to bind this number to.');
      return;
    }

    setIsConnecting(true);
    try {
      await apiRequest('/v1/wa/connect', {
        method: 'POST',
        body: {
          phone_number_id: cleanPhoneId,
          waba_id: cleanWabaId,
          access_token: cleanToken,
          label: cleanLabel || undefined,
          agent_id: targetAgentId,
        },
      });

      toastSuccess('WhatsApp account connected successfully.');
      setIsConnectModalOpen(false);
      setPhoneId('');
      setWabaId('');
      setAccessToken('');
      setAccountLabel('');
      await fetchData();
      onRefreshParent?.();
    } catch (err: any) {
      toastError(err?.message || 'Connection failed. Please check your credentials.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Set Default Account
  const handleSetDefault = async (accountId: number) => {
    setUpdatingDefaultId(accountId);
    try {
      await apiRequest(`/v1/wa/accounts/${accountId}`, {
        method: 'PATCH',
        body: { is_default: true },
      });
      toastSuccess('Primary line updated.');
      await fetchData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to update default account.');
    } finally {
      setUpdatingDefaultId(null);
    }
  };

  // Toggle Account Active / Inactive
  const handleToggleActive = async (account: WaAccount) => {
    setTogglingActiveId(account.id);
    try {
      await apiRequest(`/v1/wa/accounts/${account.id}`, {
        method: 'PATCH',
        body: { is_active: !account.is_active },
      });
      toastSuccess(
        account.is_active ? 'WhatsApp line paused.' : 'WhatsApp line activated.'
      );
      await fetchData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to update account status.');
    } finally {
      setTogglingActiveId(null);
    }
  };

  // Sync Meta Templates
  const handleSyncTemplates = async (accountId: number) => {
    setSyncingTemplatesId(accountId);
    try {
      const res = await apiRequest<WaTemplate[]>('/v1/wa/templates/sync', {
        method: 'POST',
        body: { wa_account_id: accountId },
      });
      const count = Array.isArray(res) ? res.length : 0;
      toastSuccess(`Template sync complete (${count} templates).`);
    } catch (err: any) {
      toastError(err?.message || 'Failed to sync templates from Meta.');
    } finally {
      setSyncingTemplatesId(null);
    }
  };

  // Save Account Label
  const handleSaveLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLabelAccount) return;
    setIsSavingLabel(true);
    try {
      await apiRequest(`/v1/wa/accounts/${editLabelAccount.id}`, {
        method: 'PATCH',
        body: { label: newLabel.trim() || null },
      });
      toastSuccess('Label updated.');
      setEditLabelAccount(null);
      await fetchData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to update label.');
    } finally {
      setIsSavingLabel(false);
    }
  };

  // Disconnect Account Handler
  const handleConfirmDisconnect = async () => {
    if (!disconnectAccountId) return;
    setDisconnecting(true);
    try {
      await apiRequest(`/v1/wa/accounts/${disconnectAccountId}`, {
        method: 'DELETE',
      });
      toastSuccess('WhatsApp account disconnected.');
      setDisconnectAccountId(null);
      await fetchData();
      onRefreshParent?.();
    } catch (err: any) {
      toastError(err?.message || 'Failed to disconnect account.');
    } finally {
      setDisconnecting(false);
    }
  };

  const hasConnectedAccounts = accounts.length > 0;
  const isMultiAllowed = allowed('multi_whatsapp');
  const isMultiOverridden = isOverride('multi_whatsapp');
  const canConnectNew = isMultiAllowed || accounts.length === 0;

  const handleConnectClick = async () => {
    if (!canConnectNew) return;

    const targetAgentId = formAgentId || waAgentId;
    if (!targetAgentId) {
      toastError('Select a WhatsApp agent before connecting a number.');
      setIsConnectModalOpen(true);
      return;
    }

    if (isEmbeddedConfigLoading) {
      toastError('Loading Meta signup configuration…');
      return;
    }

    if (!isEmbeddedConfigured || requiresHttps) {
      if (requiresHttps) {
        toastError('Meta Embedded Signup needs HTTPS. Enter credentials manually, or use an HTTPS tunnel.');
      }
      setIsConnectModalOpen(true);
      return;
    }

    try {
      await launchEmbeddedSignup({
        agentId: targetAgentId,
        label: accountLabel.trim() || undefined,
        onSuccess: async () => {
          toastSuccess('WhatsApp account connected successfully.');
          setAccountLabel('');
          await fetchData();
          onRefreshParent?.();
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Embedded signup failed.';
      if (/cancelled/i.test(message)) return;
      toastError(message);
      setIsConnectModalOpen(true);
    }
  };

  const guideSteps = [
    {
      title: '1. Create Meta Developer App',
      description:
        'Create a "Business" type app in Meta for Developers and add the WhatsApp product.',
      linkText: 'Meta Developer Portal',
      linkUrl: 'https://developers.facebook.com/apps',
    },
    {
      title: '2. Get Phone Number ID & WABA ID',
      description:
        'In App Dashboard → WhatsApp → API Setup, copy your Phone Number ID and WhatsApp Business Account ID.',
      linkText: 'Meta API Setup',
      linkUrl: 'https://developers.facebook.com/apps',
    },
    {
      title: '3. Configure Webhook Endpoint',
      description:
        'In WhatsApp → Configuration, paste the Callback URL and Verify Token below, then subscribe to "messages".',
      linkText: 'Meta Webhooks',
      linkUrl: 'https://developers.facebook.com/apps',
    },
    {
      title: '4. Generate Permanent System User Token',
      description:
        'In Meta Business Suite → System Users, generate a permanent token with "whatsapp_business_messaging" and "whatsapp_business_management" permissions.',
      linkText: 'Meta System Users',
      linkUrl: 'https://business.facebook.com/settings/system-users',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ── 1. MINIMAL & PROFESSIONAL HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            WhatsApp Connection
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Meta WhatsApp Cloud API integration for automated customer messaging.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenDiagnostics}
            className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted/50 text-xs font-medium text-foreground transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Activity size={13} className="text-muted-foreground" />
            <span>Diagnostics</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGuideExpanded(!isGuideExpanded)}
            className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted/50 text-xs font-medium text-foreground transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <HelpCircle size={13} className="text-muted-foreground" />
            <span>Setup Guide</span>
            {isGuideExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <button
            type="button"
            onClick={() => void handleConnectClick()}
            disabled={!canConnectNew || isEmbeddedConnecting || isEmbeddedConfigLoading}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
              canConnectNew
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
            }`}
          >
            {isEmbeddedConnecting ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            <span>{isEmbeddedConnecting ? 'Connecting…' : 'Connect Number'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. COLLAPSIBLE STEP-BY-STEP META SETUP GUIDE ── */}
      {isGuideExpanded && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-xs font-semibold text-foreground">
              Meta Cloud API Configuration Steps
            </span>
            <button
              type="button"
              onClick={() => setIsGuideExpanded(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {guideSteps.map((step, idx) => (
              <div
                key={idx}
                onClick={() => setActiveGuideStep(activeGuideStep === idx ? null : idx)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  activeGuideStep === idx
                    ? 'bg-muted/40 border-emerald-500/40'
                    : 'bg-muted/10 border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">{step.title}</span>
                  <a
                    href={step.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <span>{step.linkText}</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-normal">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. CONNECTED PHONE NUMBERS LIST ── */}
      <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border/70">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Connected Phone Numbers
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Active WhatsApp Business lines linked to this workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchData()}
            disabled={loading}
            className="px-2.5 py-1 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin text-emerald-600' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Multi-Line Limitation Banner */}
        {accounts.length >= 1 && !isMultiAllowed && (
          <div className="px-5 py-3 bg-amber-500/5 border-b border-amber-500/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Lock size={13} className="shrink-0" />
              <span>
                {isMultiOverridden
                  ? 'Connecting multiple WhatsApp numbers is switched off for this workspace.'
                  : 'Your current plan supports 1 active WhatsApp line. Upgrade to add more lines.'}
              </span>
            </div>
            {!isMultiOverridden && (
              <Link
                href="/billing"
                className="font-semibold text-amber-800 dark:text-amber-300 hover:underline shrink-0"
              >
                Upgrade Plan
              </Link>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <RefreshCw size={18} className="animate-spin text-emerald-600" />
            <span>Loading accounts...</span>
          </div>
        ) : accounts.length === 0 ? (
          /* Clean Empty State */
          <div className="p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground mx-auto flex items-center justify-center">
              <Smartphone size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">No phone number connected</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Connect your Meta Cloud API number to enable automated WhatsApp responses.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleConnectClick()}
              disabled={isEmbeddedConnecting}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isEmbeddedConnecting ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Plus size={13} />
              )}
              <span>{isEmbeddedConnecting ? 'Connecting…' : 'Connect Number'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsConnectModalOpen(true)}
              className="block mx-auto text-[11px] font-medium text-muted-foreground hover:text-foreground underline-offset-2 hover:underline cursor-pointer"
            >
              Enter credentials manually
            </button>
          </div>
        ) : (
          /* Clean Row-based Account List */
          <div className="divide-y divide-border/60">
            {accounts.map((acc) => {
              const cleanNumber = (acc.phone_number || acc.phone_number_id || '').replace(
                /[^0-9]/g,
                ''
              );
              const waDirectUrl = cleanNumber
                ? `https://wa.me/${cleanNumber}?text=Hi`
                : null;

              return (
                <div
                  key={acc.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <Smartphone size={16} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {acc.phone_number || acc.phone_number_id}
                        </span>
                        {acc.is_default && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            Primary
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-medium ${
                            acc.is_active ? 'text-emerald-600' : 'text-muted-foreground'
                          }`}
                        >
                          ({acc.is_active ? 'Active' : 'Paused'})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5 font-mono">
                        <span className="flex items-center gap-1 font-sans">
                          {acc.label || 'WhatsApp Business'}
                          <button
                            type="button"
                            onClick={() => {
                              setEditLabelAccount(acc);
                              setNewLabel(acc.label || '');
                            }}
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Edit label"
                          >
                            <Edit2 size={11} />
                          </button>
                        </span>
                        <span>WABA: {acc.waba_id || 'N/A'}</span>
                        <span>Phone ID: {acc.phone_number_id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {waDirectUrl && (
                      <a
                        href={waDirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-md border border-border hover:bg-muted/50 text-xs font-medium text-foreground transition-colors flex items-center gap-1"
                        title="Test live on WhatsApp"
                      >
                        <Send size={11} className="text-muted-foreground" />
                        <span>Test Chat</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => void handleSyncTemplates(acc.id)}
                      disabled={syncingTemplatesId === acc.id}
                      className="px-2.5 py-1 rounded-md border border-border hover:bg-muted/50 text-xs font-medium text-foreground transition-colors flex items-center gap-1 cursor-pointer"
                      title="Sync templates"
                    >
                      <RefreshCw
                        size={11}
                        className={syncingTemplatesId === acc.id ? 'animate-spin text-emerald-600' : 'text-muted-foreground'}
                      />
                      <span>Sync</span>
                    </button>

                    {!acc.is_default && (
                      <button
                        type="button"
                        onClick={() => void handleSetDefault(acc.id)}
                        disabled={updatingDefaultId === acc.id}
                        className="px-2.5 py-1 rounded-md border border-border hover:bg-muted/50 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        Make Primary
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => void handleToggleActive(acc)}
                      disabled={togglingActiveId === acc.id}
                      className="px-2.5 py-1 rounded-md border border-border hover:bg-muted/50 text-xs font-medium text-foreground transition-colors cursor-pointer"
                    >
                      {acc.is_active ? 'Pause' : 'Activate'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDisconnectAccountId(acc.id)}
                      className="p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Disconnect"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. WEBHOOK GATEWAY CONFIGURATION ── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Radio size={15} className="text-muted-foreground" />
            Meta Webhook Configuration
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Provide these credentials in Meta App Dashboard → WhatsApp → Configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">
              Callback URL
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs font-mono text-foreground outline-none select-all"
              />
              <button
                type="button"
                onClick={() => handleCopy(webhookUrl, 'webhook')}
                className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/50 text-xs font-medium text-foreground transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedField === 'webhook' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedField === 'webhook' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">
              Verify Token
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={verifyToken}
                className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs font-mono text-foreground outline-none select-all"
              />
              <button
                type="button"
                onClick={() => handleCopy(verifyToken, 'token')}
                className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/50 text-xs font-medium text-foreground transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedField === 'token' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedField === 'token' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Subscribed fields:</span>
          <span className="px-2 py-0.5 rounded-md bg-muted/40 border border-border text-[11px] font-mono">
            messages
          </span>
          <span className="px-2 py-0.5 rounded-md bg-muted/40 border border-border text-[11px] font-mono">
            message_deliveries
          </span>
          <span className="px-2 py-0.5 rounded-md bg-muted/40 border border-border text-[11px] font-mono">
            message_reads
          </span>
        </div>
      </div>

      {/* ── MODAL: CONNECT NUMBER ── */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Connect Meta WhatsApp Number
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Manual fallback — use Connect Number for Meta Embedded Signup.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleConnectSubmit} className="space-y-3.5">
              {waAgents.length > 1 && (
                <div className="space-y-1">
                  <Select
                    label="Target WhatsApp Agent"
                    required
                    value={formAgentId}
                    onChange={(val) => setFormAgentId(val)}
                    size="sm"
                    options={waAgents.map((a) => ({
                      value: a.id,
                      label: `${a.agent_name || a.slug} (${a.mode})`,
                    }))}
                  />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Phone Number ID *
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePasteInto(setPhoneId)}
                    className="text-[11px] font-medium text-emerald-600 hover:underline cursor-pointer"
                  >
                    Paste
                  </button>
                </div>
                <input
                  type="text"
                  value={phoneId}
                  onChange={(e) => setPhoneId(e.target.value)}
                  placeholder="e.g. 10482910481920"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    WhatsApp Business Account ID (WABA) *
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePasteInto(setWabaId)}
                    className="text-[11px] font-medium text-emerald-600 hover:underline cursor-pointer"
                  >
                    Paste
                  </button>
                </div>
                <input
                  type="text"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  placeholder="e.g. 29384729104819"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    System User Access Token *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                    >
                      {showToken ? <EyeOff size={11} /> : <Eye size={11} />}
                      <span>{showToken ? 'Hide' : 'Show'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePasteInto(setAccessToken)}
                      className="text-[11px] font-medium text-emerald-600 hover:underline cursor-pointer"
                    >
                      Paste
                    </button>
                  </div>
                </div>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EAAB..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Line Label (Optional)
                </label>
                <input
                  type="text"
                  value={accountLabel}
                  onChange={(e) => setAccountLabel(e.target.value)}
                  placeholder="e.g. Support Hotline"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Save &amp; Connect</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT LABEL ── */}
      {editLabelAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl space-y-3.5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-xs font-bold text-foreground">Edit Line Label</h3>
              <button
                type="button"
                onClick={() => setEditLabelAccount(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveLabel} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Custom Label
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Sales Team Line"
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditLabelAccount(null)}
                  className="px-3 py-1 rounded-lg border border-border text-xs font-medium text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLabel}
                  className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer"
                >
                  {isSavingLabel ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DIAGNOSTICS ── */}
      {isDiagnosticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-xl max-h-[80vh] flex flex-col rounded-2xl border border-border bg-card p-5 shadow-xl space-y-3.5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Delivery Diagnostics
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recent WhatsApp delivery failures and webhook logs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDiagnosticsOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
              {loadingIssues ? (
                <div className="py-10 text-center flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw size={16} className="animate-spin text-emerald-600" />
                  <span>Checking delivery status...</span>
                </div>
              ) : deliveryIssues.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-dashed border-border bg-muted/10 space-y-1.5">
                  <CheckCircle2 size={20} className="mx-auto text-emerald-600" />
                  <p className="text-xs font-semibold text-foreground">No issues detected</p>
                  <p className="text-xs text-muted-foreground">
                    All recent message deliveries and webhook events processed normally.
                  </p>
                </div>
              ) : (
                deliveryIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-border bg-background space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {issue.source}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {issue.created_at}
                      </span>
                    </div>
                    {issue.detail && (
                      <p className="text-xs text-foreground font-mono bg-muted/30 p-2 rounded break-all">
                        {issue.detail}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setIsDiagnosticsOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM DISCONNECT ── */}
      <ConfirmModal
        isOpen={Boolean(disconnectAccountId)}
        title="Disconnect WhatsApp Number?"
        description="This removes the Meta Cloud API integration for this line. Incoming customer chats to this number will no longer reach Frosty."
        confirmText={disconnecting ? 'Disconnecting...' : 'Disconnect'}
        tone="danger"
        onConfirm={() => void handleConfirmDisconnect()}
        onClose={() => setDisconnectAccountId(null)}
      />
    </div>
  );
}
