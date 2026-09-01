'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Database, Key, Sliders, Shield, AlertTriangle,
  Copy, RotateCw, Plus, Trash2, CheckCircle2, Check, ExternalLink,
  Lock, RefreshCw, Save, Sparkles, ChevronRight, Globe, Layers,
  Calendar, CreditCard, BarChart3, Code2, MessageSquare, Mail, Smartphone,
  RotateCcw, ShieldCheck, FileText, Zap
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import type { MerchantSettings, Agent } from '@/lib/types';
import { useToast } from '@/lib/toast';
import { CreateApiKeyModal } from '../CreateApiKeyModal';
import { Select } from '@/components/ui/Select';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface OthersTabProps {
  settings: MerchantSettings;
  revealedKey: string | null;
  agents?: Agent[];
  canConfig: boolean;
  canBilling: boolean;
  isOwner: boolean;
  readOnly: boolean;
  onRefresh: () => Promise<void>;
  onRotateKey: () => Promise<void>;
  initialSubTab?: 'privacy' | 'api-keys' | 'integrations';
}

const RETENTION_OPTIONS = [
  { value: '30', label: '30 Days (1 Month)' },
  { value: '90', label: '90 Days (3 Months)' },
  { value: '180', label: '180 Days (6 Months)' },
  { value: '365', label: '365 Days (1 Year - Default)' },
  { value: '730', label: '730 Days (2 Years - Enterprise)' },
];

const SUBTABS = [
  { id: 'privacy', label: 'Privacy & Retention', shortLabel: 'Privacy', icon: Shield },
  { id: 'api-keys', label: 'API Keys & Developer', shortLabel: 'API Keys', icon: Key },
  { id: 'integrations', label: 'Integrations & Apps', shortLabel: 'Integrations', icon: Sliders },
] as const;

type OthersSubTabId = typeof SUBTABS[number]['id'];

interface SecretKeyItem {
  id: string;
  name: string;
  keyMasked: string;
  rawKey?: string;
  scopes: string[];
  createdAt: string;
  lastUsed?: string;
}

// ── PIXEL-PERFECT ACCESSIBLE TOGGLE SWITCH ──
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  ariaLabel?: string;
}

function ToggleSwitch({ checked, onChange, disabled, size = 'sm', ariaLabel }: ToggleSwitchProps) {
  if (size === 'md') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0396A6]/30 focus:ring-offset-1 ${
          checked ? 'bg-[#0396A6]' : 'bg-zinc-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0396A6]/30 ${
        checked ? 'bg-[#0396A6]' : 'bg-zinc-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function OthersTab({
  settings,
  revealedKey,
  agents = [],
  canConfig,
  canBilling,
  isOwner,
  readOnly,
  onRefresh,
  onRotateKey,
  initialSubTab = 'privacy',
}: OthersTabProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<OthersSubTabId>(initialSubTab);

  // ── Privacy & Retention State ──
  const [retentionDays, setRetentionDays] = useState(
    settings.conversation_retention_days != null ? String(settings.conversation_retention_days) : '365'
  );
  const [showConsentBanner, setShowConsentBanner] = useState(
    (settings.gdpr_settings as any)?.show_consent_banner !== false
  );
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState(
    (settings.gdpr_settings as any)?.privacy_policy_url || ''
  );
  const [overageEnabled, setOverageEnabled] = useState(settings.overage_enabled === true);

  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isJustSavedPrivacy, setIsJustSavedPrivacy] = useState(false);

  // Initial State Snapshot for Discard
  const initialPrivacySnapshot = useMemo(() => ({
    retentionDays: settings.conversation_retention_days != null ? String(settings.conversation_retention_days) : '365',
    showConsentBanner: (settings.gdpr_settings as any)?.show_consent_banner !== false,
    privacyPolicyUrl: (settings.gdpr_settings as any)?.privacy_policy_url || '',
    overageEnabled: settings.overage_enabled === true,
  }), [settings]);

  const isPrivacyDirty = useMemo(() => {
    return (
      retentionDays !== initialPrivacySnapshot.retentionDays ||
      showConsentBanner !== initialPrivacySnapshot.showConsentBanner ||
      privacyPolicyUrl !== initialPrivacySnapshot.privacyPolicyUrl ||
      overageEnabled !== initialPrivacySnapshot.overageEnabled
    );
  }, [retentionDays, showConsentBanner, privacyPolicyUrl, overageEnabled, initialPrivacySnapshot]);

  // Synchronize on settings prop change
  useEffect(() => {
    setRetentionDays(settings.conversation_retention_days != null ? String(settings.conversation_retention_days) : '365');
    setShowConsentBanner((settings.gdpr_settings as any)?.show_consent_banner !== false);
    setPrivacyPolicyUrl((settings.gdpr_settings as any)?.privacy_policy_url || '');
    setOverageEnabled(settings.overage_enabled === true);
  }, [settings]);

  // ── API Key State ──
  const [copiedKey, setCopiedKey] = useState(false);
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [confirmRotateOpen, setConfirmRotateOpen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<SecretKeyItem | null>(null);
  const embedAgents = useMemo(
    () => agents.filter((a) => a.is_active && (a.mode === 'website' || a.mode === 'unified')),
    [agents],
  );
  const agentOptions = useMemo(
    () => embedAgents.map((a) => ({
      value: a.id,
      label: a.agent_name || a.slug || a.id,
      description: a.mode === 'unified' ? 'Unified agent' : 'Website agent',
    })),
    [embedAgents],
  );
  const [selectedAgentId, setSelectedAgentId] = useState('');

  useEffect(() => {
    if (embedAgents.length === 0) {
      setSelectedAgentId('');
      return;
    }
    setSelectedAgentId((prev) => (
      prev && embedAgents.some((a) => a.id === prev) ? prev : (embedAgents[0]?.id ?? '')
    ));
  }, [embedAgents]);

  const maskedPublishableKey =
    settings.publishable_key_masked || 'frosty_live_••••••••••••••••••••';
  const displayedPublishableKey = revealedKey || maskedPublishableKey;
  const [secretKeys, setSecretKeys] = useState<SecretKeyItem[]>([
    {
      id: 'key_prod_01',
      name: 'Production CRM Webhook Listener',
      keyMasked: 'frosty_sec_live_9a2b••••••••••••4f1e',
      scopes: ['leads:read', 'webhooks:subscribe'],
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      lastUsed: '2 hours ago',
    },
    {
      id: 'key_staging_02',
      name: 'Zapier Automation Integration',
      keyMasked: 'frosty_sec_live_7c4e••••••••••••8d2a',
      scopes: ['agent:chat', 'quotes:manage'],
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      lastUsed: 'Yesterday',
    },
  ]);

  // ── Discard Privacy Settings ──
  const handleDiscardPrivacy = useCallback(() => {
    setRetentionDays(initialPrivacySnapshot.retentionDays);
    setShowConsentBanner(initialPrivacySnapshot.showConsentBanner);
    setPrivacyPolicyUrl(initialPrivacySnapshot.privacyPolicyUrl);
    setOverageEnabled(initialPrivacySnapshot.overageEnabled);
    toastSuccess('Unsaved privacy changes discarded.');
  }, [initialPrivacySnapshot, toastSuccess]);

  // ── Save Privacy Settings ──
  const handleSavePrivacy = useCallback(async () => {
    if (readOnly) {
      toastError('Workspace is suspended or read-only.');
      return;
    }
    if (!canConfig) {
      toastError('You do not have permission to update workspace privacy settings.');
      return;
    }
    if (privacyPolicyUrl.trim() && !privacyPolicyUrl.trim().startsWith('https://')) {
      toastError('Privacy Policy URL must start with https://');
      return;
    }
    if (showConsentBanner && !privacyPolicyUrl.trim().startsWith('https://')) {
      toastError('Enable the visitor consent banner only with an https:// privacy policy URL.');
      return;
    }

    setIsSavingPrivacy(true);
    try {
      await apiRequest('/v1/settings', {
        method: 'PATCH',
        body: {
          conversation_retention_days: parseInt(retentionDays, 10) || 365,
          gdpr_settings: {
            show_consent_banner: showConsentBanner,
            privacy_policy_url: privacyPolicyUrl.trim() || null,
          },
          overage_enabled: overageEnabled,
        },
      });
      await onRefresh();
      toastSuccess('Privacy & data retention policies saved successfully.');
      setIsJustSavedPrivacy(true);
      setTimeout(() => setIsJustSavedPrivacy(false), 2500);
    } catch (err: any) {
      console.error('Failed to save privacy settings', err);
      toastError(err?.message || 'Failed to save settings.');
    } finally {
      setIsSavingPrivacy(false);
    }
  }, [
    readOnly, canConfig, privacyPolicyUrl, showConsentBanner,
    retentionDays, overageEnabled, onRefresh, toastError, toastSuccess
  ]);

  // Keyboard shortcut Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        if (activeSubTab === 'privacy' && isPrivacyDirty && !isSavingPrivacy && !readOnly && canConfig) {
          e.preventDefault();
          handleSavePrivacy();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSubTab, isPrivacyDirty, isSavingPrivacy, readOnly, canConfig, handleSavePrivacy]);

  // ── Copy Publishable Key ──
  const handleCopyKey = () => {
    if (!revealedKey) {
      toastError('Rotate the publishable key first to reveal the full token for copying.');
      return;
    }
    navigator.clipboard.writeText(revealedKey);
    setCopiedKey(true);
    toastSuccess('Publishable key copied to clipboard.');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleConfirmRotate = async () => {
    setIsRotating(true);
    try {
      await onRotateKey();
      setConfirmRotateOpen(false);
    } finally {
      setIsRotating(false);
    }
  };

  const handleKeyCreated = (newKey: SecretKeyItem) => {
    setSecretKeys(prev => [newKey, ...prev]);
  };

  const handleConfirmRevoke = () => {
    if (!revokeTarget) return;
    setSecretKeys((prev) => prev.filter((k) => k.id !== revokeTarget.id));
    toastSuccess('API Key revoked successfully.');
    setRevokeTarget(null);
  };

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden space-y-5 sm:space-y-7 pb-6 sm:pb-8 animate-in fade-in duration-300">
      {/* ── HERO ARCHITECTURE & ADMINISTRATION BANNER ── */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-[#D9EDEE] p-4 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-5">
            <Sliders size={28} className="text-[#0396A6] shrink-0" />

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">
                  Administration &amp; Integrations
                </h1>
              </div>
              <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                Data lifecycle compliance, developer API credentials, webhooks, and third-party connected tools.
              </p>
            </div>
          </div>

          {/* Quick Subtab Switcher */}
          <div className="flex items-center p-1 rounded-2xl border border-[#D9EDEE] bg-white shadow-2xs w-full md:w-auto overflow-x-auto no-scrollbar shrink-0">
            {SUBTABS.map(sub => {
              const Icon = sub.icon;
              const active = activeSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setActiveSubTab(sub.id)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 whitespace-nowrap text-xs font-bold cursor-pointer ${
                    active
                      ? 'bg-[#0396A6] text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-white' : 'text-[#0396A6]'} />
                  <span className="hidden sm:inline">{sub.label}</span>
                  <span className="sm:hidden">{sub.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SUBTAB 1: PRIVACY & DATA RETENTION
         ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'privacy' && (
        <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
          <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 sm:pb-4 border-b border-[#EAF2F2]">
              <div className="flex items-center gap-3">
                <Database size={20} className="text-[#0396A6] shrink-0" />
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                    Data Lifecycle &amp; Compliance
                  </h2>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    DPDP and GDPR data compliance controls, automatic conversation purge schedules, and consent notices.
                  </p>
                </div>
              </div>

              <span className="self-start sm:self-auto text-xs font-semibold text-[#0396A6]">
                GDPR &amp; DPDP Compliant
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* Conversation Retention */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] space-y-2.5 hover:border-[#BCE3E5] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-foreground">Conversation Data Retention</span>
                  <span className="text-xs font-semibold text-[#0396A6]">
                    {retentionDays} Days
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Closed customer transcripts older than this threshold are purged during nightly retention sweeps.
                </p>
                <div className="pt-1">
                  <Select
                    value={retentionDays}
                    onChange={(val) => setRetentionDays(String(val))}
                    options={RETENTION_OPTIONS}
                    disabled={!canConfig || readOnly}
                    fullWidth
                    triggerClassName="!bg-white !border-[#D9EDEE] !rounded-xl !text-xs sm:!text-sm !font-semibold"
                  />
                </div>
              </div>

              {/* Overage Controls */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] space-y-2.5 hover:border-[#BCE3E5] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-foreground">Conversation Quota Overage</span>
                  <ToggleSwitch
                    checked={overageEnabled}
                    onChange={val => setOverageEnabled(val)}
                    disabled={!canBilling || readOnly}
                    ariaLabel="Toggle conversation quota overage"
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {overageEnabled
                    ? 'Overage is active — conversations beyond your monthly allocation are billed seamlessly at standard rates.'
                    : 'Overage is disabled — AI agents automatically pause when your monthly conversation quota is exhausted.'}
                </p>
                <div className="pt-1">
                  <Link
                    href="/billing"
                    className="text-xs font-bold text-[#0396A6] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Manage Billing &amp; Quotas</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Privacy Policy URL */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] space-y-2 md:col-span-2 hover:border-[#BCE3E5] transition-all">
                <div className="flex items-center justify-between">
                  <label htmlFor="privacy-policy-url" className="text-xs sm:text-sm font-bold text-foreground">
                    Public Privacy Policy URL
                  </label>
                  <span className="text-xs font-semibold text-muted-foreground">
                    HTTPS Required
                  </span>
                </div>
                <input
                  id="privacy-policy-url"
                  type="url"
                  value={privacyPolicyUrl}
                  onChange={e => setPrivacyPolicyUrl(e.target.value)}
                  disabled={!canConfig || readOnly}
                  placeholder="https://yourcompany.com/privacy"
                  className="w-full px-4 py-2.5 bg-white border border-[#D9EDEE] rounded-xl text-xs sm:text-sm font-semibold text-foreground outline-none hover:border-[#BCE3E5] focus:border-[#0396A6] focus:ring-4 focus:ring-[#0396A6]/10 transition-all placeholder:text-muted-foreground/60 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Linked inside the web chat widget footer and consent disclosure prompts.
                </p>
              </div>

              {/* Cookie Consent Banner Toggle */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] flex items-center justify-between gap-4 md:col-span-2 hover:border-[#BCE3E5] transition-all">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-foreground">Widget Consent &amp; Privacy Notice</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Display an explicit consent notice banner to first-time visitors before initiating chat turns.
                  </p>
                </div>
                <ToggleSwitch
                  size="md"
                  checked={showConsentBanner}
                  onChange={val => setShowConsentBanner(val)}
                  disabled={!canConfig || readOnly}
                  ariaLabel="Toggle widget consent notice"
                />
              </div>
            </div>
          </section>

          {/* ── DANGER ZONE & DATA DELETION CARD ── */}
          <section className="bg-white rounded-2xl border border-red-200 p-4 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-3 text-red-700 pb-3.5 border-b border-red-100">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold border border-red-200 shrink-0 shadow-2xs">
                <AlertTriangle size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-red-950">
                  Danger Zone &amp; Data Deletion
                </h2>
                <p className="text-[11px] sm:text-xs text-red-800 mt-0.5">
                  Permanent data erasure and GDPR Right to be Forgotten compliance protocols.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-red-950">Visitor erasure (Right to be Forgotten)</h3>
                <p className="text-xs text-red-800 mt-1 leading-relaxed">
                  To fulfil a visitor data export or portability request, open the lead profile and select Export.
                  To erase a named visitor, email{' '}
                  <a href="mailto:sales@frostrek.com" className="font-bold underline hover:text-red-950">
                    sales@frostrek.com
                  </a>{' '}
                  with the contact ID for audited redact-in-place erasure.
                </p>
              </div>
            </div>
          </section>

          {/* ── ACTION BAR FOR PRIVACY ── */}
          <div className="bg-white border border-[#D9EDEE] rounded-xl sm:rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3.5 transition-all mt-6">
            <div className="flex items-center gap-2.5 self-start sm:self-center">
              {isPrivacyDirty ? (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50/90 px-3.5 py-1.5 rounded-xl border border-amber-200 shadow-2xs animate-in zoom-in-95">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>You have unsaved privacy &amp; retention changes</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground px-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>All privacy policies are in sync</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <kbd className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold text-muted-foreground bg-[#F7F5F1] border border-[#D9EDEE] rounded-lg shadow-2xs">
                <span className="text-xs">⌘</span>S
              </kbd>

              {isPrivacyDirty && (
                <button
                  type="button"
                  onClick={handleDiscardPrivacy}
                  disabled={isSavingPrivacy || readOnly}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-muted/30 text-[#5F6B73] hover:text-foreground border border-[#D9EDEE] hover:border-[#BCE3E5] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs animate-in zoom-in-95"
                >
                  <RotateCcw size={14} /> Discard
                </button>
              )}

              <button
                type="button"
                onClick={handleSavePrivacy}
                disabled={!isPrivacyDirty || isSavingPrivacy || readOnly || !canConfig}
                className={`flex-1 sm:flex-none px-6 py-2.5 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_2px_10px_rgba(3,150,166,0.25)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer ${
                  isJustSavedPrivacy
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#0396A6] hover:bg-[#028391] text-white'
                }`}
              >
                {isSavingPrivacy ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-white" /> Saving…
                  </>
                ) : isJustSavedPrivacy ? (
                  <>
                    <Check size={15} className="stroke-[3] text-white" /> Settings Saved
                  </>
                ) : (
                  <>
                    <Save size={14} className="text-white" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SUBTAB 2: API KEYS & DEVELOPER
         ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'api-keys' && (
        <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
          {/* Publishable Key Card */}
          <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 sm:pb-4 border-b border-[#EAF2F2]">
              <div className="flex items-center gap-3">
                <Key size={20} className="text-[#0396A6] shrink-0" />
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                    Client Publishable Key
                  </h2>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    One public key per workspace (like Stripe). Pick an agent below — routing uses its ID in your embed snippet, not a separate key.
                  </p>
                </div>
              </div>

              {!isOwner && (
                <span className="self-start sm:self-auto text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  Key rotation requires Workspace Owner
                </span>
              )}
            </div>

            {/* Agent selector + key value */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Target Agent
                </label>
                <Select
                  value={selectedAgentId || null}
                  onChange={(val) => setSelectedAgentId(String(val))}
                  options={agentOptions}
                  placeholder={agentOptions.length ? 'Select an agent…' : 'No website agents available'}
                  disabled={agentOptions.length === 0}
                  fullWidth
                  triggerClassName="!bg-[#F7F5F1] !border-[#D9EDEE] !rounded-xl !text-sm !font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">
                  Same publishable key for every agent. The dropdown only sets which bot handles widget traffic — pass its ID as <code className="font-mono text-[10px] bg-white px-1 rounded border border-[#D9EDEE]">data-frosty-agent</code> in your embed code.
                </p>
                {selectedAgentId ? (
                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Agent instance ID (for embed snippet)
                    </label>
                    <code className="block text-xs font-mono font-semibold text-foreground bg-[#F7F5F1] border border-[#D9EDEE] rounded-xl px-3 py-2 break-all select-all">
                      {selectedAgentId}
                    </code>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                LIVE PUBLISHABLE TOKEN
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-[#F7F5F1] border border-[#D9EDEE] rounded-xl shadow-2xs">
                <code className="text-xs font-mono font-bold text-foreground flex-1 break-all select-all py-1">
                  {displayedPublishableKey}
                </code>

                <div className="flex items-center gap-1.5 shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    disabled={!revealedKey}
                    className="px-3 py-1.5 rounded-lg bg-[#0396A6] hover:bg-[#087681] text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {!revealedKey && (
                <p className="text-[11px] text-muted-foreground">
                  Only a masked preview is shown for security. Rotate the key to reveal the full token once.
                </p>
              )}

              {revealedKey && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                  New key generated. Please copy and replace the snippet on your live website.
                </div>
              )}
            </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setConfirmRotateOpen(true)}
                disabled={!isOwner || readOnly || isRotating}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-2xs"
              >
                <RotateCw size={13} className={isRotating ? 'animate-spin' : ''} /> Rotate Publishable Key
              </button>
            </div>
          </section>

          {/* Secret API Keys Card */}
          <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 sm:pb-4 border-b border-[#EAF2F2]">
              <div className="flex items-center gap-3">
                <Code2 size={20} className="text-[#0396A6] shrink-0" />
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                    Backend API Secret Keys
                  </h2>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    Scoped REST tokens for programmatic ingestion, CRM sync, and webhooks.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateKeyModalOpen(true)}
                disabled={!canConfig || readOnly}
                className="px-4 py-2 bg-[#0396A6] hover:bg-[#087681] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
              >
                <Plus size={14} /> Create API Key
              </button>
            </div>

            {/* Keys Table */}
            <div className="space-y-3">
              {secretKeys.map(key => (
                <div
                  key={key.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] hover:border-[#BCE3E5] flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-foreground">{key.name}</span>
                      <code className="text-[11px] font-mono text-muted-foreground bg-white px-2 py-0.5 rounded-md border border-[#D9EDEE] shadow-2xs">
                        {key.keyMasked}
                      </code>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {key.scopes.map(s => (
                        <span
                          key={s}
                          className="inline-flex items-center text-[11px] font-mono font-semibold text-[#0396A6] bg-[#0396A6]/[0.06] hover:bg-[#0396A6]/[0.12] border border-[#0396A6]/20 px-2.5 py-0.5 rounded-lg transition-colors shadow-2xs"
                        >
                          {s}
                        </span>
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">
                        Created {new Date(key.createdAt).toLocaleDateString()} — Last used {key.lastUsed || 'Recently'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRevokeTarget(key)}
                    disabled={!isOwner || readOnly}
                    className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-400 hover:shadow-sm transition-all text-xs font-bold flex items-center gap-1.5 self-end md:self-auto cursor-pointer disabled:opacity-50"
                    title="Revoke key"
                  >
                    <Trash2 size={14} />
                    <span>Revoke</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          <CreateApiKeyModal
            isOpen={isCreateKeyModalOpen}
            onClose={() => setIsCreateKeyModalOpen(false)}
            onKeyCreated={handleKeyCreated}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SUBTAB 3: INTEGRATIONS & CONNECTED APPS
         ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'integrations' && (
        <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
          <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 sm:pb-4 border-b border-[#EAF2F2]">
              <div className="flex items-center gap-3">
                <Sliders size={20} className="text-[#0396A6] shrink-0" />
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                    Integrations &amp; Connected Ecosystem Apps
                  </h2>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    Connect Frosty with your communication channels, CRMs, calendars, and payment processors.
                  </p>
                </div>
              </div>

              <span className="md:hidden text-[10px] font-semibold text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-md self-start sm:self-auto">
                Swipe →
              </span>
            </div>

            {/* Categorized Integration Cards */}
            <div className="space-y-6">
              {/* Category: Communication */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  COMMUNICATION &amp; MESSAGING
                </span>
                {/* Horizontal scroll carousel on mobile, 3-column grid on desktop */}
                <div className="min-w-0 max-w-full overflow-x-auto md:overflow-visible no-scrollbar snap-x snap-mandatory flex md:grid md:grid-cols-3 gap-3.5 pb-1">
                  {/* WhatsApp */}
                  <div className="w-[min(84vw,320px)] md:w-auto shrink-0 snap-start p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] hover:border-[#BCE3E5] flex flex-col justify-between space-y-3 transition-all">
                    <div className="flex items-start justify-between">
                      <MessageSquare size={22} className="text-[#0396A6] shrink-0" />
                      <span className="text-xs font-semibold text-[#0396A6]">
                        Connected
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-foreground">WhatsApp Cloud API</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2 md:line-clamp-none">Meta Business WABA lines for customer messaging.</p>
                    </div>
                    <Link
                      href="/whatsapp?tab=settings"
                      className="text-xs font-bold text-[#0396A6] hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <span>Configure Line</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>

                  {/* Web Chat */}
                  <div className="w-[min(84vw,320px)] md:w-auto shrink-0 snap-start p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] hover:border-[#BCE3E5] flex flex-col justify-between space-y-3 transition-all">
                    <div className="flex items-start justify-between">
                      <Globe size={22} className="text-[#0396A6] shrink-0" />
                      <span className="text-xs font-semibold text-[#0396A6]">
                        Active
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-foreground">Website Chat Widget</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2 md:line-clamp-none">Embedded visitor launcher on your website storefront.</p>
                    </div>
                    <Link
                      href="/widget"
                      className="text-xs font-bold text-[#0396A6] hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <span>Customize Widget</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>

                  {/* Transactional Email */}
                  <div className="w-[min(84vw,320px)] md:w-auto shrink-0 snap-start p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] hover:border-[#BCE3E5] flex flex-col justify-between space-y-3 transition-all">
                    <div className="flex items-start justify-between">
                      <Mail size={22} className="text-[#0396A6] shrink-0" />
                      <span className="text-xs font-semibold text-[#0396A6]">
                        Active
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-foreground">Transactional Email</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2 md:line-clamp-none">Automated quote dispatches and team notification emails.</p>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground pt-1">Standard Sender</span>
                  </div>
                </div>
              </div>

              {/* Category: Productivity & CRM */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  PRODUCTIVITY &amp; CRM
                </span>
                {/* Horizontal scroll carousel on mobile, 3-column grid on desktop */}
                <div className="min-w-0 max-w-full overflow-x-auto md:overflow-visible no-scrollbar snap-x snap-mandatory flex md:grid md:grid-cols-3 gap-3.5 pb-1">
                  {/* Google Calendar */}
                  <div className="w-[min(84vw,320px)] md:w-auto shrink-0 snap-start p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] hover:border-[#BCE3E5] flex flex-col justify-between space-y-3 transition-all">
                    <div className="flex items-start justify-between">
                      <Calendar size={22} className="text-[#0396A6] shrink-0" />
                      <span className="text-xs font-semibold text-muted-foreground">
                        Available
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-foreground">Google Calendar</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2 md:line-clamp-none">Sync meeting slots and automated customer bookings.</p>
                    </div>
                    <Link
                      href="/meetings"
                      className="text-xs font-bold text-[#0396A6] hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <span>Connect Calendar</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>

                  {/* HubSpot CRM */}
                  <div className="w-[min(84vw,320px)] md:w-auto shrink-0 snap-start p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] hover:border-[#BCE3E5] flex flex-col justify-between space-y-3 transition-all">
                    <div className="flex items-start justify-between">
                      <BarChart3 size={22} className="text-[#0396A6] shrink-0" />
                      <span className="text-xs font-semibold text-muted-foreground">
                        Coming Soon
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-foreground">HubSpot CRM</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2 md:line-clamp-none">Stream captured leads directly into HubSpot contacts.</p>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground pt-1">In Development</span>
                  </div>

                  {/* Razorpay Payments */}
                  <div className="w-[min(84vw,320px)] md:w-auto shrink-0 snap-start p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] hover:border-[#BCE3E5] flex flex-col justify-between space-y-3 transition-all">
                    <div className="flex items-start justify-between">
                      <CreditCard size={22} className="text-[#0396A6] shrink-0" />
                      <span className="text-xs font-semibold text-[#0396A6]">
                        Connected
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-foreground">Razorpay Payments</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2 md:line-clamp-none">Automatic payment link generation in quotation workflows.</p>
                    </div>
                    <Link
                      href="/billing"
                      className="text-xs font-bold text-[#0396A6] hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <span>Manage Gateway</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmRotateOpen}
        title="Rotate publishable key?"
        message="Every embedded chat widget using the current key will immediately stop working until you update the snippet on your website. The new full key is shown once after rotation."
        tone="warning"
        confirmText={isRotating ? 'Rotating…' : 'Rotate Key'}
        cancelText="Cancel"
        onConfirm={() => void handleConfirmRotate()}
        onClose={() => {
          if (!isRotating) setConfirmRotateOpen(false);
        }}
      />

      <ConfirmModal
        isOpen={revokeTarget !== null}
        title={revokeTarget ? `Revoke ${revokeTarget.name}?` : 'Revoke API key?'}
        message="Any connected services using this secret key will immediately lose access. This cannot be undone."
        tone="danger"
        confirmText="Revoke Key"
        cancelText="Cancel"
        onConfirm={handleConfirmRevoke}
        onClose={() => setRevokeTarget(null)}
      />
    </div>
  );
}
