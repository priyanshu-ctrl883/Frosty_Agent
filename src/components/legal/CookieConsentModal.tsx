'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  BarChart3,
  Megaphone,
  Sliders,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  getCookieConsent,
  setCookieConsent,
  CookiePreferences,
  ALL_ACCEPTED_PREFERENCES,
  ESSENTIAL_ONLY_PREFERENCES,
  DEFAULT_PREFERENCES,
} from '@/lib/cookies';

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

export const CookieConsentModal: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local preferences state for customize panel
  const [prefs, setPrefs] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  const checkConsent = useCallback(() => {
    const existing = getCookieConsent();
    if (!existing) {
      setIsOpen(true);
    } else {
      setPrefs(existing.preferences);
    }
  }, []);

  useEffect(() => {
    checkConsent();

    // Listen for manual preference trigger (e.g. from footer or settings)
    const handleOpen = () => {
      const existing = getCookieConsent();
      if (existing) {
        setPrefs(existing.preferences);
      }
      setIsCustomizing(true);
      setIsOpen(true);
    };

    window.addEventListener('frosty:open-cookie-preferences', handleOpen);
    return () => window.removeEventListener('frosty:open-cookie-preferences', handleOpen);
  }, [checkConsent]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  // Don't show modal on dedicated legal reading pages
  if (!isOpen || pathname === '/privacy' || pathname === '/terms' || pathname === '/acceptable-use') {
    return null;
  }

  const handleAcceptAll = async () => {
    setIsSaving(true);
    try {
      await setCookieConsent('accepted', ALL_ACCEPTED_PREFERENCES);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEssentialOnly = async () => {
    setIsSaving(true);
    try {
      await setCookieConsent('rejected', ESSENTIAL_ONLY_PREFERENCES);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCustom = async () => {
    setIsSaving(true);
    try {
      await setCookieConsent('custom', { ...prefs, essential: true });
      setIsOpen(false);
      setIsCustomizing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-modal="true"
      data-lenis-prevent
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs transition-all duration-300 animate-in fade-in"
    >
      <div
        style={{ fontFamily: '"Times New Roman", Times, serif' }}
        className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl border border-[#D9EDEE] shadow-[0_20px_50px_rgba(3,150,166,0.12),0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 pb-3 border-b border-[#EAF2F2] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0396A6]/15 to-[#0396A6]/5 text-[#0396A6] border border-[#0396A6]/20 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="cookie-consent-title" className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  Privacy &amp; Cookie Preferences
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF8F8] text-[#0396A6] border border-[#B8E0E2]">
                  DPDP &amp; GDPR
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                We respect your data privacy and give you full control over how cookies and telemetry operate.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close dialog"
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
            Frosty Agent uses essential cookies for secure authentication (Supabase session), workspace isolation, and core functionality. With your permission, we also use functional, analytics, and product advisory cookies to improve your AI experience.
          </p>

          {/* Granular Categories Accordion */}
          {isCustomizing && (
            <div className="space-y-2.5 pt-2 border-t border-[#EAF2F2] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="text-xs font-bold text-foreground uppercase tracking-wider pb-1">
                Cookie Categories &amp; Purposes
              </div>

              {/* 1. Essential */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-[#F7F5F1] border border-[#D9EDEE] flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#D9EDEE] text-[#0396A6] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Lock size={13} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">Strictly Necessary &amp; Security</span>
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Always Active
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Required for session authentication, tenant isolation, CSRF protection, and load balancing. Cannot be disabled.
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={true}
                  disabled={true}
                  onChange={() => {}}
                  ariaLabel="Strictly Necessary Cookies (Always Active)"
                />
              </div>

              {/* 2. Functional & Sensory */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-[#F7F5F1] border border-[#D9EDEE] flex items-start justify-between gap-3 hover:border-[#BCE3E5] transition-all">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#D9EDEE] text-[#0396A6] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sliders size={13} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground">Functional &amp; Audio Preferences</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Remembers your workspace docking states, audio alert volumes, and custom sound chime synthesizers.
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={prefs.functional}
                  onChange={val => setPrefs(p => ({ ...p, functional: val }))}
                  ariaLabel="Toggle Functional Cookies"
                />
              </div>

              {/* 3. Analytics & Telemetry */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-[#F7F5F1] border border-[#D9EDEE] flex items-start justify-between gap-3 hover:border-[#BCE3E5] transition-all">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#D9EDEE] text-[#0396A6] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <BarChart3 size={13} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground">Analytics &amp; Telemetry</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Helps us measure feature usage, AI latency benchmarks, and error rates to improve agent response reliability.
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={prefs.analytics}
                  onChange={val => setPrefs(p => ({ ...p, analytics: val }))}
                  ariaLabel="Toggle Analytics Cookies"
                />
              </div>

              {/* 4. Marketing & Announcements */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-[#F7F5F1] border border-[#D9EDEE] flex items-start justify-between gap-3 hover:border-[#BCE3E5] transition-all">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#D9EDEE] text-[#0396A6] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Megaphone size={13} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground">Product Advisories &amp; Model Releases</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Used to deliver in-app changelog notifications, AI model release announcements, and promotional perks.
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={prefs.marketing}
                  onChange={val => setPrefs(p => ({ ...p, marketing: val }))}
                  ariaLabel="Toggle Marketing Cookies"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Info size={12} className="text-[#0396A6] shrink-0" />
            <span>
              You can modify or withdraw your consent anytime in{' '}
              <Link href="/settings?tab=others" className="font-bold text-[#0396A6] hover:underline">
                Settings &gt; Others
              </Link>{' '}
              or review our{' '}
              <Link href="/privacy#section-8" className="font-bold text-[#0396A6] hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3.5 sm:p-5 bg-[#F7F5F1] border-t border-[#EAF2F2] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => setIsCustomizing(prev => !prev)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D9EDEE] bg-white text-xs font-bold text-foreground hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Sliders size={13} className="text-[#0396A6]" />
            <span>{isCustomizing ? 'Hide Preferences' : 'Customize'}</span>
            {isCustomizing ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
            {isCustomizing ? (
              <>
                <button
                  type="button"
                  onClick={handleEssentialOnly}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-[#D9EDEE] bg-white text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-[#0396A6] hover:bg-[#02808E] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} />
                  <span>Save Preferences</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleEssentialOnly}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-[#D9EDEE] bg-white text-xs font-bold text-foreground hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-[#0396A6] hover:bg-[#02808E] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Accept All</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
