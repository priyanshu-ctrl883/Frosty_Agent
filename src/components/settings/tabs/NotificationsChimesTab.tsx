'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell, Volume2, Moon, BellOff, Play, Activity,
  Smartphone, MonitorSmartphone, Mail, CheckCircle2,
  ChevronRight, Save, RefreshCw, Sparkles, Shield, Zap,
  VolumeX, Flame, Users, FileSpreadsheet, MessageSquare,
  CreditCard, ShieldAlert, Check, Sliders, Radio, AlertCircle,
  RotateCcw
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import type { MerchantSettings } from '@/lib/types';
import {
  DEFAULT_CLIENT_PREFS,
  buildNotificationPrefsPatch,
  loadClientPrefs,
  mergeServerIntoClient,
  parseServerNotificationPrefs,
  playNotificationChime,
  requestBrowserNotificationPermission,
  saveClientPrefs,
  type ClientNotificationPrefs,
} from '@/lib/notificationPrefs';
import { useToast } from '@/lib/toast';

interface NotificationsChimesTabProps {
  settings: MerchantSettings;
  canConfig: boolean;
  readOnly: boolean;
  onRefresh: () => Promise<void>;
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

export function NotificationsChimesTab({
  settings,
  canConfig,
  readOnly,
  onRefresh,
}: NotificationsChimesTabProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  // Local Client Preferences (Sound, Chimes, Focus)
  const [prefs, setPrefs] = useState<ClientNotificationPrefs>(DEFAULT_CLIENT_PREFS);
  const [testPlaying, setTestPlaying] = useState(false);
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission>('default');

  // Server Notification Triggers
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [prefHotLead, setPrefHotLead] = useState(true);
  const [prefHandoff, setPrefHandoff] = useState(true);
  const [prefQuotes, setPrefQuotes] = useState(true);
  const [prefWa, setPrefWa] = useState(true);
  const [prefBilling, setPrefBilling] = useState(true);

  // In-App Dashboard Triggers
  const [prefInApp, setPrefInApp] = useState(true);
  const [prefInAppHotLead, setPrefInAppHotLead] = useState(true);
  const [prefInAppHandoff, setPrefInAppHandoff] = useState(true);
  const [prefInAppQuotes, setPrefInAppQuotes] = useState(true);
  const [prefInAppWa, setPrefInAppWa] = useState(true);
  const [prefInAppBilling, setPrefInAppBilling] = useState(true);
  const [prefDesktopToast, setPrefDesktopToast] = useState(true);
  const [prefBrowserNotifs, setPrefBrowserNotifs] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isJustSaved, setIsJustSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Initial State Snapshot for Discard
  const [initialSnapshot, setInitialSnapshot] = useState<any>(null);

  const applyServerSettings = useCallback((servSettings: MerchantSettings) => {
    if (servSettings.notification_prefs) {
      const server = parseServerNotificationPrefs(servSettings.notification_prefs as Record<string, unknown>);
      const initialEmail = server.email !== false;
      const initialHotLead = server.hot_lead !== false;
      const initialHandoff = server.handoff !== false;
      const initialQuotes = server.quotes !== false;
      const initialWa = server.wa !== false;
      const initialBilling = server.billing !== false;
      const initialInApp = server.in_app !== false;
      const initialInAppHotLead = server.in_app_hot_lead !== false;
      const initialInAppHandoff = server.in_app_handoff !== false;
      const initialInAppQuotes = server.in_app_quotes !== false;
      const initialInAppWa = server.in_app_wa !== false;
      const initialInAppBilling = server.in_app_billing !== false;
      const initialBrowser = server.browser_notifications === true;
      const initialDesktop = server.desktop_toast !== false;

      setEmailNotifs(initialEmail);
      setPrefHotLead(initialHotLead);
      setPrefHandoff(initialHandoff);
      setPrefQuotes(initialQuotes);
      setPrefWa(initialWa);
      setPrefBilling(initialBilling);
      setPrefInApp(initialInApp);
      setPrefInAppHotLead(initialInAppHotLead);
      setPrefInAppHandoff(initialInAppHandoff);
      setPrefInAppQuotes(initialInAppQuotes);
      setPrefInAppWa(initialInAppWa);
      setPrefInAppBilling(initialInAppBilling);
      setPrefBrowserNotifs(initialBrowser);
      setPrefDesktopToast(initialDesktop);

      const client = loadClientPrefs();
      const merged = mergeServerIntoClient(server, client);
      setPrefs(merged);
      saveClientPrefs(merged);
      setIsDirty(false);

      setInitialSnapshot({
        emailNotifs: initialEmail,
        prefHotLead: initialHotLead,
        prefHandoff: initialHandoff,
        prefQuotes: initialQuotes,
        prefWa: initialWa,
        prefBilling: initialBilling,
        prefInApp: initialInApp,
        prefInAppHotLead: initialInAppHotLead,
        prefInAppHandoff: initialInAppHandoff,
        prefInAppQuotes: initialInAppQuotes,
        prefInAppWa: initialInAppWa,
        prefInAppBilling: initialInAppBilling,
        prefBrowserNotifs: initialBrowser,
        prefDesktopToast: initialDesktop,
        prefs: merged,
      });
    }
  }, []);

  // Load server prefs on mount/change
  useEffect(() => {
    applyServerSettings(settings);
  }, [settings, applyServerSettings]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPerm(Notification.permission);
    }
  }, []);

  // Update local client pref (Chimes & volume)
  const updatePref = useCallback(
    <K extends keyof ClientNotificationPrefs>(key: K, value: ClientNotificationPrefs[K]) => {
      setPrefs(p => {
        const next = { ...p, [key]: value };
        saveClientPrefs(next);
        return next;
      });
      setIsDirty(true);
    },
    []
  );

  // Play synthetic Web Audio chime
  const playTestSound = useCallback(() => {
    if (typeof window === 'undefined') return;
    setTestPlaying(true);
    playNotificationChime(prefs.volume, 'urgent');
    setTimeout(() => setTestPlaying(false), 700);
  }, [prefs.volume]);

  // Discard changes
  const handleDiscard = useCallback(() => {
    if (!initialSnapshot) return;
    setEmailNotifs(initialSnapshot.emailNotifs);
    setPrefHotLead(initialSnapshot.prefHotLead);
    setPrefHandoff(initialSnapshot.prefHandoff);
    setPrefQuotes(initialSnapshot.prefQuotes);
    setPrefWa(initialSnapshot.prefWa);
    setPrefBilling(initialSnapshot.prefBilling);
    setPrefInApp(initialSnapshot.prefInApp);
    setPrefInAppHotLead(initialSnapshot.prefInAppHotLead);
    setPrefInAppHandoff(initialSnapshot.prefInAppHandoff);
    setPrefInAppQuotes(initialSnapshot.prefInAppQuotes);
    setPrefInAppWa(initialSnapshot.prefInAppWa);
    setPrefInAppBilling(initialSnapshot.prefInAppBilling);
    setPrefBrowserNotifs(initialSnapshot.prefBrowserNotifs);
    setPrefDesktopToast(initialSnapshot.prefDesktopToast);
    setPrefs(initialSnapshot.prefs);
    saveClientPrefs(initialSnapshot.prefs);
    setIsDirty(false);
    toastSuccess('Unsaved preferences discarded.');
  }, [initialSnapshot, toastSuccess]);

  // Save everything to server
  const handleSave = useCallback(async () => {
    if (readOnly) {
      toastError('Workspace is suspended or read-only.');
      return;
    }
    if (!canConfig) {
      toastError('You do not have permission to update workspace configuration.');
      return;
    }

    setIsSaving(true);
    try {
      if (prefBrowserNotifs && browserPerm !== 'granted') {
        const perm = await requestBrowserNotificationPermission();
        setBrowserPerm(perm);
        if (perm !== 'granted') {
          setPrefBrowserNotifs(false);
        }
      }

      saveClientPrefs(prefs);

      const patch = buildNotificationPrefsPatch({
        email: emailNotifs,
        prefHotLead,
        prefHandoff,
        prefQuotes,
        prefWa,
        prefBilling,
        prefInApp,
        prefInAppHotLead,
        prefInAppHandoff,
        prefInAppQuotes,
        prefInAppWa,
        prefInAppBilling,
        prefBrowserNotifs: prefBrowserNotifs && browserPerm === 'granted',
        prefDesktopToast,
        prefs,
      });

      await apiRequest('/v1/settings', {
        method: 'PATCH',
        body: { notification_prefs: patch },
      });

      window.dispatchEvent(new CustomEvent('frosty:notification-prefs-updated'));
      setIsDirty(false);
      await onRefresh();
      toastSuccess('Notification & Chime preferences saved successfully.');
      setIsJustSaved(true);
      setTimeout(() => setIsJustSaved(false), 2500);
    } catch (err: any) {
      console.error('Failed to save notification preferences', err);
      toastError(err?.message || 'Failed to save notification preferences.');
    } finally {
      setIsSaving(false);
    }
  }, [
    readOnly, canConfig, prefBrowserNotifs, browserPerm, prefs,
    emailNotifs, prefHotLead, prefHandoff, prefQuotes, prefWa,
    prefBilling, prefInApp, prefInAppHotLead, prefInAppHandoff,
    prefInAppQuotes, prefInAppWa, prefInAppBilling, prefDesktopToast,
    onRefresh, toastError, toastSuccess
  ]);

  // Keyboard shortcut Cmd+S / Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && !isSaving && !readOnly && canConfig) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, isSaving, readOnly, canConfig, handleSave]);

  const isSnoozed = prefs.snoozedUntil !== null && prefs.snoozedUntil > Date.now();

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden space-y-5 sm:space-y-7 pb-6 sm:pb-8 animate-in fade-in duration-300">
      {/* ── HERO BANNER: NOTIFICATIONS & SENSORY CHIMES ── */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-[#D9EDEE] p-4 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-5">
          <Bell size={28} className="text-[#0396A6] shrink-0" />

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">
                Notifications &amp; Chimes
              </h1>
              <span className="text-xs font-semibold text-muted-foreground">
                Audio Engine: {prefs.soundEnabled ? `${prefs.volume}% Level` : 'Muted'}
              </span>
              <span className="text-xs font-semibold text-[#0396A6]">
                Focus Mode: {isSnoozed ? 'Snoozed' : 'Live'}
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
              Audio sensory feedback, deep focus quiet hours, live in-app notifications, and instant email alerts.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* ── SECTION 1: AUDIO CHIMES & SENSORY FEEDBACK ── */}
        <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-5">
          <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-[#EAF2F2]">
            <div className="flex items-center gap-3">
              <Volume2 size={20} className="text-[#0396A6] shrink-0" />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                  Audio Sensory Chimes
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Synthesized Web Audio chimes alerting teammates in real time.
                </p>
              </div>
            </div>

            {/* Master Sound Toggle */}
            <ToggleSwitch
              size="md"
              checked={prefs.soundEnabled}
              onChange={val => updatePref('soundEnabled', val)}
              disabled={readOnly}
              ariaLabel="Toggle sound alerts"
            />
          </div>

          <div className={`space-y-4 transition-opacity ${prefs.soundEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {/* Volume Control & Chime Tester */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#F7F5F1] border border-[#D9EDEE] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sliders size={13} className="text-[#0396A6]" />
                  Volume Level: <span className="text-[#0396A6]">{prefs.volume}%</span>
                </span>
                <button
                  type="button"
                  onClick={playTestSound}
                  disabled={testPlaying || !prefs.soundEnabled}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#0396A6] hover:text-white text-[#0396A6] border border-[#D9EDEE] hover:border-[#0396A6] text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
                >
                  {testPlaying ? <Activity size={13} className="animate-spin" /> : <Play size={13} />}
                  <span>Test Chime</span>
                </button>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={prefs.volume}
                onChange={e => updatePref('volume', parseInt(e.target.value, 10))}
                className="w-full accent-[#0396A6] cursor-pointer h-2 bg-[#D9EDEE] rounded-lg"
              />
            </div>

            {/* Event Triggers List */}
            <div className="space-y-2">
              {[
                {
                  key: 'alertOnNewSession' as const,
                  label: 'Visitor Arrivals',
                  desc: 'Soft chime when a new customer session begins on your website.',
                  icon: Zap,
                },
                {
                  key: 'alertOnHandoff' as const,
                  label: 'Human Handoff Requests',
                  desc: 'Urgent chime alert when a visitor requests human teammate assistance.',
                  icon: ShieldAlert,
                },
                {
                  key: 'alertOnEveryMessage' as const,
                  label: 'Every Message Turn',
                  desc: 'Audible tick on all incoming visitor conversational turns.',
                  icon: Activity,
                },
              ].map(item => {
                const active = prefs[item.key];
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="p-3 rounded-xl bg-[#F7F5F1] border border-[#D9EDEE] flex items-center justify-between gap-3 hover:border-[#BCE3E5] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-[#D9EDEE] text-[#0396A6] flex items-center justify-center shadow-2xs shrink-0">
                        <Icon size={15} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">{item.label}</div>
                        <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>

                    <ToggleSwitch
                      checked={active}
                      onChange={val => updatePref(item.key, val)}
                      ariaLabel={`Toggle ${item.label}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SECTION 2: DEEP FOCUS & QUIET HOURS ── */}
        <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-5">
          <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-[#EAF2F2]">
            <div className="flex items-center gap-3">
              <Moon size={20} className="text-[#0396A6] shrink-0" />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                  Deep Focus &amp; Quiet Hours
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Temporarily silence workspace audio chimes during focused work.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 sm:p-5 rounded-2xl transition-all space-y-3.5 ${
              isSnoozed
                ? 'bg-zinc-900 text-white border border-zinc-800 shadow-md'
                : 'bg-[#F7F5F1] border border-[#D9EDEE]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isSnoozed ? 'bg-white/10 text-white' : 'bg-white border border-[#D9EDEE] text-[#0396A6]'
                }`}
              >
                {isSnoozed ? <Moon size={20} /> : <BellOff size={20} />}
              </div>
              <div>
                <h3 className="text-sm font-black m-0">
                  {isSnoozed ? 'Deep Focus Mode Active' : 'Silence Workspace Alerts'}
                </h3>
                <p className={`text-xs mt-0.5 ${isSnoozed ? 'text-zinc-300' : 'text-muted-foreground'}`}>
                  {isSnoozed
                    ? `Audio notifications muted until ${new Date(
                        prefs.snoozedUntil!
                      ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Select a duration to temporarily silence sound triggers.'}
                </p>
              </div>
            </div>

            {isSnoozed ? (
              <button
                type="button"
                onClick={() => updatePref('snoozedUntil', null)}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
              >
                Resume Sound Alerts
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '15 Minutes', val: 15 * 60000 },
                  { label: '1 Hour', val: 3600000 },
                  { label: '4 Hours', val: 14400000 },
                  { label: 'Until Tomorrow', val: 86400000 },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => updatePref('snoozedUntil', Date.now() + opt.val)}
                    className="py-2 px-2.5 rounded-xl bg-white hover:bg-[#0396A6] hover:text-white text-foreground border border-[#D9EDEE] hover:border-[#0396A6] text-xs font-bold transition-all cursor-pointer text-center shadow-2xs"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Browser Push OS Notification Card */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#F7F5F1] border border-[#D9EDEE] flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-foreground">Browser / OS System Notifications</span>
              <p className="text-[11px] text-muted-foreground">
                {browserPerm === 'granted'
                  ? 'Active — push alerts appear when the dashboard tab is in background.'
                  : browserPerm === 'denied'
                    ? 'Blocked by browser permissions — allow in site settings.'
                    : 'Requires permission prompt on save.'}
              </p>
            </div>

            <ToggleSwitch
              checked={prefBrowserNotifs && browserPerm === 'granted'}
              onChange={async (val) => {
                if (val) {
                  const perm = await requestBrowserNotificationPermission();
                  setBrowserPerm(perm);
                  setPrefBrowserNotifs(perm === 'granted');
                } else {
                  setPrefBrowserNotifs(false);
                }
                setIsDirty(true);
              }}
              disabled={browserPerm === 'denied' || readOnly}
              ariaLabel="Toggle browser notifications"
            />
          </div>
        </section>
      </div>

      {/* ── SECTION 3: IN-APP & EMAIL NOTIFICATION TRIGGERS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* In-App Notifications Card */}
        <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-4">
          <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-[#EAF2F2]">
            <div className="flex items-center gap-3">
              <Smartphone size={20} className="text-[#0396A6] shrink-0" />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                  In-App Dashboard Alerts
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Floating desktop toasts and activity alerts inside the workspace.
                </p>
              </div>
            </div>

            <ToggleSwitch
              size="md"
              checked={prefInApp}
              onChange={val => {
                setPrefInApp(val);
                setIsDirty(true);
              }}
              disabled={readOnly}
              ariaLabel="Toggle in-app alerts"
            />
          </div>

          <div className={`space-y-2 transition-opacity ${prefInApp ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {[
              {
                label: 'Hot Leads Identified',
                checked: prefInAppHotLead,
                toggle: () => { setPrefInAppHotLead(!prefInAppHotLead); setIsDirty(true); },
                hint: 'High purchase intent visitor detected.',
                icon: Flame,
              },
              {
                label: 'Human Handoff Interventions',
                checked: prefInAppHandoff,
                toggle: () => { setPrefInAppHandoff(!prefInAppHandoff); setIsDirty(true); },
                hint: 'Customer requests a live team member.',
                icon: Users,
              },
              {
                label: 'Quotation Approvals Pending',
                checked: prefInAppQuotes,
                toggle: () => { setPrefInAppQuotes(!prefInAppQuotes); setIsDirty(true); },
                hint: 'Generated sales quotes waiting for review.',
                icon: FileSpreadsheet,
              },
              {
                label: 'WhatsApp Issues & Delivery Drops',
                checked: prefInAppWa,
                toggle: () => { setPrefInAppWa(!prefInAppWa); setIsDirty(true); },
                hint: 'Meta webhook delivery drops or rate limits.',
                icon: MessageSquare,
              },
              {
                label: 'Billing & Quota Thresholds',
                checked: prefInAppBilling,
                toggle: () => { setPrefInAppBilling(!prefInAppBilling); setIsDirty(true); },
                hint: 'Credit balance below 20% and monthly receipts.',
                icon: CreditCard,
              },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="p-3 rounded-xl bg-[#F7F5F1] border border-[#D9EDEE] flex items-center justify-between gap-3 hover:border-[#BCE3E5] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white border border-[#D9EDEE] text-[#0396A6] flex items-center justify-center shadow-2xs shrink-0">
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{item.label}</div>
                      <p className="text-[11px] text-muted-foreground">{item.hint}</p>
                    </div>
                  </div>

                  <ToggleSwitch
                    checked={item.checked}
                    onChange={() => item.toggle()}
                    ariaLabel={`Toggle ${item.label}`}
                  />
                </div>
              );
            })}

            <div className="pt-2">
              <Link
                href="/notifications"
                className="text-xs font-bold text-[#0396A6] hover:underline inline-flex items-center gap-1"
              >
                <span>Open Notifications Inbox</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {/* Email Notification Triggers Card */}
        <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-4">
          <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-[#EAF2F2]">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-[#0396A6] shrink-0" />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                  Email Notifications
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Direct inbox dispatches sent to workspace owners and team members.
                </p>
              </div>
            </div>

            <ToggleSwitch
              size="md"
              checked={emailNotifs}
              onChange={val => {
                setEmailNotifs(val);
                setIsDirty(true);
              }}
              disabled={readOnly}
              ariaLabel="Toggle email notifications"
            />
          </div>

          <div className={`space-y-2 transition-opacity ${emailNotifs ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {[
              {
                label: 'Hot Leads Instant Email',
                checked: prefHotLead,
                toggle: () => { setPrefHotLead(!prefHotLead); setIsDirty(true); },
                hint: 'Real-time alert with visitor lead profile and intent.',
                icon: Flame,
              },
              {
                label: 'Human Handoff Request Email',
                checked: prefHandoff,
                toggle: () => { setPrefHandoff(!prefHandoff); setIsDirty(true); },
                hint: 'Email notification when customer escalates for support.',
                icon: Users,
              },
              {
                label: 'Quotation Approvals Pending',
                checked: prefQuotes,
                toggle: () => { setPrefQuotes(!prefQuotes); setIsDirty(true); },
                hint: 'Itemized sales proposal awaiting confirmation.',
                icon: FileSpreadsheet,
              },
              {
                label: 'WhatsApp WABA Alert Email',
                checked: prefWa,
                toggle: () => { setPrefWa(!prefWa); setIsDirty(true); },
                hint: 'Critical webhook drops and template status.',
                icon: MessageSquare,
              },
              {
                label: 'Billing & Low Credit Alerts',
                checked: prefBilling,
                toggle: () => { setPrefBilling(!prefBilling); setIsDirty(true); },
                hint: 'Monthly tax invoices, top-up alerts, and usage receipts.',
                icon: CreditCard,
              },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="p-3 rounded-xl bg-[#F7F5F1] border border-[#D9EDEE] flex items-center justify-between gap-3 hover:border-[#BCE3E5] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white border border-[#D9EDEE] text-[#0396A6] flex items-center justify-center shadow-2xs shrink-0">
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{item.label}</div>
                      <p className="text-[11px] text-muted-foreground">{item.hint}</p>
                    </div>
                  </div>

                  <ToggleSwitch
                    checked={item.checked}
                    onChange={() => item.toggle()}
                    ariaLabel={`Toggle ${item.label}`}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── ACTION BAR ── */}
      <div className="bg-white border border-[#D9EDEE] rounded-xl sm:rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3.5 transition-all mt-6">
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {isDirty ? (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50/90 px-3.5 py-1.5 rounded-xl border border-amber-200 shadow-2xs animate-in zoom-in-95">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>You have unsaved notification preferences</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground px-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>All alert preferences are synchronized</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <kbd className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold text-muted-foreground bg-[#F7F5F1] border border-[#D9EDEE] rounded-lg shadow-2xs">
            <span className="text-xs">⌘</span>S
          </kbd>

          {isDirty && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isSaving || readOnly}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-muted/30 text-[#5F6B73] hover:text-foreground border border-[#D9EDEE] hover:border-[#BCE3E5] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs animate-in zoom-in-95"
            >
              <RotateCcw size={14} /> Discard
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving || readOnly || !canConfig}
            className={`flex-1 sm:flex-none px-6 py-2.5 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_2px_10px_rgba(3,150,166,0.25)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer ${
              isJustSaved
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[#0396A6] hover:bg-[#028391] text-white'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin text-white" /> Saving…
              </>
            ) : isJustSaved ? (
              <>
                <Check size={15} className="stroke-[3] text-white" /> Preferences Saved
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
  );
}
