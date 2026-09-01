'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2, Globe, Mail, Phone, MapPin,
  Languages, Clock, AlertCircle, RefreshCw, Save,
  RotateCcw, Lock, Check, Copy,
  Sparkles, FileText, ShieldCheck,
  Tag, Landmark, Compass, HelpCircle, ArrowUpRight,
  SlidersHorizontal, CheckCircle2, Shield, Info,
  Layers, Hash, Navigation
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { completeOnboardingStep } from '@/lib/onboarding';
import type { MerchantSettings } from '@/lib/types';

import { useToast } from '@/lib/toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Select } from '@/components/ui/Select';

interface CompanyProfileTabProps {
  settings: MerchantSettings;
  canConfig: boolean;
  canBilling: boolean;
  readOnly: boolean;
  onRefresh: () => Promise<void>;
  merchantId?: string | null;
  userEmail?: string | null;
}

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PHONE_RE = /^\+?[0-9]{10,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_DESCRIPTION_LENGTH = 500;

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
  { value: 'UTC', label: 'UTC (Universal Coordinated Time)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT -5:00)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT -8:00)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST +0:00)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST +1:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT +8:00)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST +9:00)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT +10:00)' },
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR — Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', label: 'USD — US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR — Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP — British Pound (£)' },
  { code: 'AED', symbol: 'د.إ', label: 'AED — UAE Dirham (AED)' },
  { code: 'SGD', symbol: 'S$', label: 'SGD — Singapore Dollar (S$)' },
];

const LOCALES = [
  { code: 'en', label: 'English (en)' },
  { code: 'hi', label: 'Hindi (hi)' },
  { code: 'en-in', label: 'English - India (en-in)' },
  { code: 'es', label: 'Spanish (es)' },
  { code: 'fr', label: 'French (fr)' },
  { code: 'de', label: 'German (de)' },
  { code: 'ar', label: 'Arabic (ar)' },
];

const INDUSTRIES = [
  'Real Estate & Property',
  'Software & SaaS',
  'E-Commerce & Retail',
  'Healthcare & Clinics',
  'Financial Services & Fintech',
  'Education & EdTech',
  'Solar & Renewable Energy',
  'Hospitality & Tourism',
  'Legal & Professional Services',
  'Automotive & Dealerships',
  'Other / General Services',
];

const INDUSTRY_OPTIONS = INDUSTRIES.map((ind) => ({ value: ind, label: ind }));
const TIMEZONE_OPTIONS = TIMEZONES.map((tz) => ({ value: tz.value, label: tz.label }));
const CURRENCY_OPTIONS = CURRENCIES.map((curr) => ({ value: curr.code, label: curr.label }));
const LOCALE_OPTIONS = LOCALES.map((loc) => ({ value: loc.code, label: loc.label }));

const SETTINGS_SELECT_TRIGGER =
  '!bg-[#F7F5F1] hover:!bg-white !border-[#D9EDEE] !rounded-xl !text-sm !font-medium';

export function CompanyProfileTab({
  settings,
  canConfig,
  canBilling,
  readOnly,
  onRefresh,
  merchantId,
  userEmail,
}: CompanyProfileTabProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  // Snapshot initial values from settings prop
  const initialValues = useMemo(() => {
    const bh = (settings.business_hours as Record<string, any>) || {};
    return {
      companyName: settings.company_name || '',
      legalName: bh._legal_name || settings.company_name || '',
      industry: settings.industry || 'Software & SaaS',
      businessCategory: bh._category || 'B2B & Enterprise Services',
      website: bh._website || '',
      email: bh._email || userEmail || '',
      phone: settings.phone || '',
      description: bh._description || settings.industry || '',
      street: bh._street || '',
      city: bh._city || 'Bangalore',
      state: bh._state || 'Karnataka',
      country: bh._country || 'India',
      postalCode: bh._postal || '',
      timezone: settings.timezone || 'Asia/Kolkata',
      currency: bh._currency || 'INR',
      locale: settings.locale || 'en',
      gstin: settings.gstin || '',
    };
  }, [settings, userEmail]);

  // Form State
  const [companyName, setCompanyName] = useState(initialValues.companyName);
  const [legalName, setLegalName] = useState(initialValues.legalName);
  const [industry, setIndustry] = useState(initialValues.industry);
  const [businessCategory, setBusinessCategory] = useState(initialValues.businessCategory);
  const [website, setWebsite] = useState(initialValues.website);
  const [email, setEmail] = useState(initialValues.email);
  const [phone, setPhone] = useState(initialValues.phone);
  const [description, setDescription] = useState(initialValues.description);
  const [street, setStreet] = useState(initialValues.street);
  const [city, setCity] = useState(initialValues.city);
  const [state, setState] = useState(initialValues.state);
  const [country, setCountry] = useState(initialValues.country);
  const [postalCode, setPostalCode] = useState(initialValues.postalCode);
  const [timezone, setTimezone] = useState(initialValues.timezone);
  const [currency, setCurrency] = useState(initialValues.currency);
  const [locale, setLocale] = useState(initialValues.locale);
  const [gstin, setGstin] = useState(initialValues.gstin);

  // UI / Status States
  const [isSaving, setIsSaving] = useState(false);
  const [isJustSaved, setIsJustSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetModal, setShowResetModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Sync state when initialValues change from external update
  useEffect(() => {
    setCompanyName(initialValues.companyName);
    setLegalName(initialValues.legalName);
    setIndustry(initialValues.industry);
    setBusinessCategory(initialValues.businessCategory);
    setWebsite(initialValues.website);
    setEmail(initialValues.email);
    setPhone(initialValues.phone);
    setDescription(initialValues.description);
    setStreet(initialValues.street);
    setCity(initialValues.city);
    setState(initialValues.state);
    setCountry(initialValues.country);
    setPostalCode(initialValues.postalCode);
    setTimezone(initialValues.timezone);
    setCurrency(initialValues.currency);
    setLocale(initialValues.locale);
    setGstin(initialValues.gstin);
    setErrors({});
  }, [initialValues]);

  // Calculate dirty state
  const isDirty = useMemo(() => {
    return (
      companyName !== initialValues.companyName ||
      legalName !== initialValues.legalName ||
      industry !== initialValues.industry ||
      businessCategory !== initialValues.businessCategory ||
      website !== initialValues.website ||
      email !== initialValues.email ||
      phone !== initialValues.phone ||
      description !== initialValues.description ||
      street !== initialValues.street ||
      city !== initialValues.city ||
      state !== initialValues.state ||
      country !== initialValues.country ||
      postalCode !== initialValues.postalCode ||
      timezone !== initialValues.timezone ||
      currency !== initialValues.currency ||
      locale !== initialValues.locale ||
      gstin !== initialValues.gstin
    );
  }, [
    companyName, legalName, industry, businessCategory,
    website, email, phone, description,
    street, city, state, country, postalCode,
    timezone, currency, locale, gstin,
    initialValues,
  ]);

  // Calculate profile completeness score
  const completeness = useMemo(() => {
    const fields = [
      Boolean(companyName.trim()),
      Boolean(legalName.trim()),
      Boolean(industry.trim()),
      Boolean(website.trim()),
      Boolean(email.trim()),
      Boolean(phone.trim()),
      Boolean(description.trim()),
      Boolean(street.trim()),
      Boolean(city.trim()),
      Boolean(timezone.trim()),
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [companyName, legalName, industry, website, email, phone, description, street, city, timezone]);

  // Warn user before closing window if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Validation function
  const validate = useCallback(() => {
    const errs: Record<string, string> = {};

    if (!companyName.trim() || companyName.trim().length < 2) {
      errs.companyName = 'Company name must be at least 2 characters.';
    }

    if (website.trim() && !/^https?:\/\//i.test(website.trim())) {
      errs.website = 'Website must start with http:// or https:// (e.g. https://example.com)';
    }

    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      errs.email = 'Please enter a valid business email address.';
    }

    if (phone.trim()) {
      const cleaned = phone.trim().replace(/[\s-]/g, '');
      if (!PHONE_RE.test(cleaned)) {
        errs.phone = 'Enter a valid telephone number with country code (e.g. +91 98765 43210).';
      }
    }

    if (gstin.trim()) {
      if (!GSTIN_RE.test(gstin.trim().toUpperCase())) {
        errs.gstin = 'Invalid GSTIN format. Expected format: 07AAAAA0000A1Z5.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [companyName, website, email, phone, gstin]);

  // Handle Save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (readOnly) {
      toastError('Workspace is currently suspended or read-only.');
      return;
    }
    if (!canConfig) {
      toastError('You do not have permission to update workspace configuration.');
      return;
    }
    if (!validate()) {
      toastError('Please resolve the highlighted validation errors before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const currentBh = (settings.business_hours as Record<string, any>) || {};
      const updatedBh = {
        ...currentBh,
        _legal_name: legalName.trim(),
        _description: description.trim(),
        _category: businessCategory.trim(),
        _website: website.trim(),
        _email: email.trim(),
        _street: street.trim(),
        _city: city.trim(),
        _state: state.trim(),
        _country: country.trim(),
        _postal: postalCode.trim(),
        _currency: currency,
      };

      const body: Record<string, unknown> = {
        company_name: companyName.trim() || null,
        industry: industry.trim() || null,
        phone: phone.trim() || null,
        timezone: timezone.trim() || 'Asia/Kolkata',
        locale: locale.trim() || 'en',
        business_hours: updatedBh,
      };

      if (canBilling) {
        body.gstin = gstin.trim() ? gstin.trim().toUpperCase() : null;
      }

      await apiRequest('/v1/settings', {
        method: 'PATCH',
        body,
      });

      await onRefresh();
      void completeOnboardingStep("profile").catch(() => null);
      toastSuccess('Company profile updated successfully.');
      setIsJustSaved(true);
      setTimeout(() => setIsJustSaved(false), 2500);
    } catch (err: any) {
      console.error('Failed to save company profile', err);
      toastError(err?.message || 'Failed to update company profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut (Cmd/Ctrl + S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isDirty && !isSaving && !readOnly && canConfig) {
          void handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, isSaving, readOnly, canConfig, validate]);

  // Handle Reset to Initial
  const handleConfirmReset = () => {
    setCompanyName(initialValues.companyName);
    setLegalName(initialValues.legalName);
    setIndustry(initialValues.industry);
    setBusinessCategory(initialValues.businessCategory);
    setWebsite(initialValues.website);
    setEmail(initialValues.email);
    setPhone(initialValues.phone);
    setDescription(initialValues.description);
    setStreet(initialValues.street);
    setCity(initialValues.city);
    setState(initialValues.state);
    setCountry(initialValues.country);
    setPostalCode(initialValues.postalCode);
    setTimezone(initialValues.timezone);
    setCurrency(initialValues.currency);
    setLocale(initialValues.locale);
    setGstin(initialValues.gstin);
    setErrors({});
    setShowResetModal(false);
    toastSuccess('Changes discarded.');
  };

  const handleCopyId = () => {
    if (!merchantId) return;
    navigator.clipboard.writeText(merchantId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isFormDisabled = !canConfig || readOnly || isSaving;

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden space-y-6 sm:space-y-7 pb-6 sm:pb-8 animate-in fade-in duration-300">
      {/* ── WORKSPACE IDENTITY HERO ── */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-[#D9EDEE] p-5 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Brand Logo Avatar */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#0396A6]/10 text-[#0396A6] border border-[#0396A6]/20 flex items-center justify-center font-black text-xl sm:text-2xl shrink-0">
              {(companyName || 'W').charAt(0).toUpperCase()}
            </div>

            {/* Title & Core Meta */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
                  {companyName || 'Company Profile'}
                </h1>
                <span className="text-xs font-semibold text-muted-foreground">
                  {settings.plan ? `${settings.plan} Plan` : 'Enterprise Plan'}
                </span>
                <span className="text-xs font-semibold text-[#0396A6]">
                  {settings.status ? settings.status.charAt(0).toUpperCase() + settings.status.slice(1) : 'Active'}
                </span>
              </div>

              <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed line-clamp-2 max-w-2xl">
                Configure your organization details, official branding, and localization preferences used across AI copilot conversations and live customer documents.
              </p>
            </div>
          </div>

          {/* Quick Meta Chips & Profile Strength */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#E4F0F0]">
            <div className="flex items-center gap-2 flex-wrap">
              {merchantId && (
                <button
                  type="button"
                  onClick={handleCopyId}
                  title="Click to copy Workspace ID"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F7F5F1] border border-[#D9EDEE] hover:border-[#BCE3E5] rounded-xl text-xs font-mono font-medium text-foreground transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="text-muted-foreground text-[11px]">ID:</span>
                  <span className="font-semibold">{merchantId.slice(0, 10)}…</span>
                  {copiedId ? (
                    <Check size={13} className="text-[#0396A6] animate-in zoom-in-75" />
                  ) : (
                    <Copy size={13} className="text-[#0396A6] group-hover:text-foreground transition-colors" />
                  )}
                </button>
              )}

              {!canConfig && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold shadow-2xs">
                  <Lock size={12} className="text-amber-800" /> Read-Only
                </span>
              )}
            </div>

            {/* Profile Health / Config Completeness Bar */}
            <div className="w-full sm:w-48 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span className="flex items-center gap-1 text-foreground">
                  <CheckCircle2 size={12} className="text-[#0396A6]" /> Profile Strength
                </span>
                <span className="font-bold text-[#0396A6]">{completeness}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#E4F0F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0396A6] to-[#67C9CE] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 sm:space-y-7">
        {/* ── SECTION 1: COMPANY IDENTITY ── */}
        <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-5 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAF2F2]">
            <div className="flex items-center gap-3.5">
              <Building2 size={20} className="text-[#0396A6] shrink-0" />
              <div>
                <h2 className="text-[15px] sm:text-base font-bold text-foreground tracking-tight">
                  Company Identity
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Brand name, official legal registration, and industry classification.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Company / Brand Name */}
            <div className="space-y-1.5">
              <label htmlFor="company-name" className="text-xs sm:text-[13px] font-bold text-[#334155] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  Company / Brand Name <span className="text-red-500 font-bold">*</span>
                </span>
                <span className="text-[11px] font-normal text-muted-foreground">Required</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#0396A6] pointer-events-none">
                  <Building2 size={16} />
                </div>
                <input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: '' }));
                  }}
                  onBlur={() => {
                    if (!companyName.trim() || companyName.trim().length < 2) {
                      setErrors((prev) => ({ ...prev, companyName: 'Company name must be at least 2 characters.' }));
                    }
                  }}
                  disabled={isFormDisabled}
                  placeholder="e.g. Acme Corporation"
                  aria-required="true"
                  aria-invalid={Boolean(errors.companyName)}
                  className={`h-11 w-full pl-10 pr-3.5 bg-[#F7F5F1] hover:bg-white focus:bg-white border rounded-xl text-sm font-medium text-foreground outline-none transition-all placeholder:text-[#8B9DA4] placeholder:font-normal hover:border-[#B8E0E2] focus:border-[#0396A6] focus:ring-4 focus:ring-[#0396A6]/10 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed ${
                    errors.companyName ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200/50' : 'border-[#D9EDEE]'
                  }`}
                />
              </div>
              {errors.companyName && (
                <p role="alert" className="text-xs text-red-600 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
                  <AlertCircle size={13} className="shrink-0" /> {errors.companyName}
                </p>
              )}
            </div>

            {/* Legal Business Name */}
            <div className="space-y-1.5">
              <label htmlFor="legal-name" className="text-xs sm:text-[13px] font-bold text-[#334155] flex items-center justify-between">
                <span>Legal Business Name</span>
                <span className="text-[11px] font-normal text-muted-foreground">For contracts &amp; invoices</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#0396A6] pointer-events-none">
                  <Landmark size={16} />
                </div>
                <input
                  id="legal-name"
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  disabled={isFormDisabled}
                  placeholder="e.g. Acme Technologies Private Limited"
                  className="h-11 w-full pl-10 pr-3.5 bg-[#F7F5F1] hover:bg-white focus:bg-white border border-[#D9EDEE] rounded-xl text-sm font-medium text-foreground outline-none transition-all placeholder:text-[#8B9DA4] placeholder:font-normal hover:border-[#B8E0E2] focus:border-[#0396A6] focus:ring-4 focus:ring-[#0396A6]/10 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Primary Industry */}
            <div className="space-y-1.5">
              <label htmlFor="primary-industry" className="text-xs sm:text-[13px] font-bold text-[#334155]">
                Primary Industry
              </label>
              <Select
                id="primary-industry"
                value={industry}
                onChange={(val) => setIndustry(String(val))}
                options={INDUSTRY_OPTIONS}
                disabled={isFormDisabled}
                leadingIcon={<Layers size={16} className="text-[#0396A6]" />}
                size="lg"
                fullWidth
                triggerClassName={SETTINGS_SELECT_TRIGGER}
              />
            </div>

            {/* Business Category */}
            <div className="space-y-1.5">
              <label htmlFor="business-category" className="text-xs sm:text-[13px] font-bold text-[#334155]">
                Business Category
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#0396A6] pointer-events-none">
                  <Tag size={16} />
                </div>
                <input
                  id="business-category"
                  type="text"
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  disabled={isFormDisabled}
                  placeholder="e.g. B2B & Enterprise SaaS"
                  className="h-11 w-full pl-10 pr-3.5 bg-[#F7F5F1] hover:bg-white focus:bg-white border border-[#D9EDEE] rounded-xl text-sm font-medium text-foreground outline-none transition-all placeholder:text-[#8B9DA4] placeholder:font-normal hover:border-[#B8E0E2] focus:border-[#0396A6] focus:ring-4 focus:ring-[#0396A6]/10 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: CONTACT & BUSINESS INFORMATION ── */}
        <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-5 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAF2F2]">
            <div className="flex items-center gap-3.5">
              <Mail size={20} className="text-[#0396A6] shrink-0" />
              <div>
                <h2 className="text-[15px] sm:text-base font-bold text-foreground tracking-tight">
                  Contact &amp; Business Information
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Official communication links used in AI meeting invites and quote delivery.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Company Website */}
            <div className="space-y-1.5">
              <label htmlFor="company-website" className="text-xs sm:text-[13px] font-bold text-[#334155]">
                Company Website
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#0396A6] pointer-events-none">
                  <Globe size={16} />
                </div>
                <input
                  id="company-website"
                  type="url"
                  value={website}
                  onChange={(e) => {
                    setWebsite(e.target.value);
                    if (errors.website) setErrors((prev) => ({ ...prev, website: '' }));
                  }}
                  onBlur={() => {
                    if (website.trim() && !/^https?:\/\//i.test(website.trim())) {
                      setErrors((prev) => ({ ...prev, website: 'Website must start with http:// or https:// (e.g. https://example.com)' }));
                    }
                  }}
                  disabled={isFormDisabled}
                  placeholder="https://example.com"
                  aria-invalid={Boolean(errors.website)}
                  className={`h-11 w-full pl-10 pr-3.5 bg-[#F7F5F1] hover:bg-white focus:bg-white border rounded-xl text-sm font-medium text-foreground outline-none transition-all placeholder:text-[#8B9DA4] placeholder:font-normal hover:border-[#B8E0E2] focus:border-[#0396A6] focus:ring-4 focus:ring-[#0396A6]/10 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed ${
                    errors.website ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200/50' : 'border-[#D9EDEE]'
                  }`}
                />
              </div>
              {errors.website && (
                <p role="alert" className="text-xs text-red-600 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
                  <AlertCircle size={13} className="shrink-0" /> {errors.website}
                </p>
              )}
            </div>

            {/* Business Contact Phone */}
            <div className="space-y-1.5">
              <label htmlFor="contact-phone" className="text-xs sm:text-[13px] font-bold text-[#334155]">
                Business Contact Phone
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#0396A6] pointer-events-none">
                  <Phone size={16} />
                </div>
                <input
                  id="contact-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  onBlur={() => {
                    if (phone.trim()) {
                      const cleaned = phone.trim().replace(/[\s-]/g, '');
                      if (!PHONE_RE.test(cleaned)) {
                        setErrors((prev) => ({ ...prev, phone: 'Enter a valid telephone number (e.g. +91 98765 43210).' }));
                      }
                    }
                  }}
                  disabled={isFormDisabled}
                  placeholder="+91 98765 43210"
                  aria-invalid={Boolean(errors.phone)}
                  className={`h-11 w-full pl-10 pr-3.5 bg-[#F7F5F1] hover:bg-white focus:bg-white border rounded-xl text-sm font-medium text-foreground outline-none transition-all placeholder:text-[#8B9DA4] placeholder:font-normal hover:border-[#B8E0E2] focus:border-[#0396A6] focus:ring-4 focus:ring-[#0396A6]/10 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed ${
                    errors.phone ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200/50' : 'border-[#D9EDEE]'
                  }`}
                />
              </div>
              {errors.phone && (
                <p role="alert" className="text-xs text-red-600 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
                  <AlertCircle size={13} className="shrink-0" /> {errors.phone}
                </p>
              )}
            </div>

            {/* Business Inquiry Email (Full Width) */}
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="business-email" className="text-xs sm:text-[13px] font-bold text-[#334155]">
                Business Inquiry Email
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#0396A6] pointer-events-none">
                  <Mail size={16} />
                </div>
                <input
                  id="business-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  onBlur={() => {
                    if (email.trim() && !EMAIL_RE.test(email.trim())) {
                      setErrors((prev) => ({ ...prev, email: 'Please enter a valid business email address.' }));
                    }
                  }}
                  disabled={isFormDisabled}
                  placeholder="contact@company.com"
                  aria-invalid={Boolean(errors.email)}
                  className={`h-11 w-full pl-10 pr-3.5 bg-[#F7F5F1] hover:bg-white focus:bg-white border rounded-xl text-sm font-medium text-foreground outline-none transition-all placeholder:text-[#8B9DA4] placeholder:font-normal hover:border-[#B8E0E2] focus:border-[#0396A6] focus:ring-4 focus:ring-[#0396A6]/10 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed ${
                    errors.email ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200/50' : 'border-[#D9EDEE]'
                  }`}
                />
              </div>
              {errors.email && (
                <p role="alert" className="text-xs text-red-600 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
                  <AlertCircle size={13} className="shrink-0" /> {errors.email}
                </p>
              )}
            </div>

            {/* Business Description & Value Proposition (Full Width) */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label htmlFor="business-description" className="text-xs sm:text-[13px] font-bold text-[#334155] flex items-center gap-1.5">
                  <span>Business Description &amp; Value Proposition</span>
                </label>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                  description.length > MAX_DESCRIPTION_LENGTH
                    ? 'text-red-600 bg-red-50 font-bold'
                    : 'text-muted-foreground bg-[#F7F5F1] border border-[#D9EDEE]'
                }`}>
                  {description.length} / {MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
              <textarea
                id="business-description"
                rows={4}
                maxLength={MAX_DESCRIPTION_LENGTH}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isFormDisabled}
                placeholder="Describe your company's mission, products or services, target customers, and key differentiators."
                className="w-full p-3.5 bg-[#F7F5F1] hover:bg-white focus:bg-white border border-[#D9EDEE] rounded-xl text-sm font-medium text-foreground outline-none transition-all placeholder:text-[#8B9DA4] placeholder:font-normal hover:border-[#B8E0E2] focus:border-[#0396A6] focus:ring-4 focus:ring-[#0396A6]/10 min-h-[120px] max-h-[260px] resize-y disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed leading-relaxed"
              />
            </div>
          </div>
        </section>

        {/* ── SECTION 3: BUSINESS ADDRESS ── */}
        <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-5 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAF2F2]">
            <div className="flex items-center gap-3.5">
              <MapPin size={20} className="text-[#0396A6] shrink-0" />
              <div>
                <h2 className="text-[15px] sm:text-base font-bold text-foreground tracking-tight">
                  Business Address
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Official operating address printed on billing receipts and formal quotes.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Street Address (Full Width) */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <label htmlFor="street-address" className="text-xs sm:text-[13px] font-bold text-[#334155]">
                Street Address
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#0396A6] pointer-events-none">
                  <MapPin size={16} />
                </div>
                <input
                  id="street-address"
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={isFormDisabled}
                  placeholder="e.g. 100 Innovation Boulevard, Suite 400"
                  className="h-11 w-full pl-10 pr-3.5 bg-[#F7F5F1] hover:bg-white focus:bg-white border border-[#D9EDEE] rounded-xl text-sm font-medium text-foreground outline-none transition-all placeholder:text-[#8B9DA4] placeholder:font-normal hover:border-[#B8E0E2] focus:border-[#0396A6] focus:ring-4 focus:ring-[#0396A6]/10 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label htmlFor="city" className="text-xs sm:text-[13px] font-bold text-[#334155]">
                City
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#0396A6] pointer-events-none">
                  <Building2 size={16} />
                </div>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={isFormDisabled}
                  placeholder="e.g. Bangalore"
                  className="h-11 w-full pl-10 pr-3.5 bg-[#F7F5F1] hover:bg-white focus:bg-white border border-[#D9EDEE] rounded-xl text-sm font-medium text-foreground outline-none transition-all placeholder:text-[#8B9DA4] placeholder:font-normal hover:border-[#B8E0E2] focus:border-[#0396A6] focus:ring-4 focus:ring-[#0396A6]/10 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* State / Province */}
            <div className="space-y-1.5">
              <label htmlFor="state" className="text-xs sm:text-[13px] font-bold text-[#334155]">
                State / Province
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#0396A6] pointer-events-none">
                  <Navigation size={16} />
                </div>
                <input
                  id="state"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={isFormDisabled}
                  placeholder="e.g. Karnataka"
                  className="h-11 w-full pl-10 pr-3.5 bg-[#F7F5F1] hover:bg-white focus:bg-white border border-[#D9EDEE] rounded-xl text-sm font-medium text-foreground outline-none transition-all placeholder:text-[#8B9DA4] placeholder:font-normal hover:border-[#B8E0E2] focus:border-[#0396A6] focus:ring-4 focus:ring-[#0396A6]/10 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Postal / ZIP Code */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <label htmlFor="postal-code" className="text-xs sm:text-[13px] font-bold text-[#334155]">
                Postal / ZIP Code
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#0396A6] pointer-events-none">
                  <Hash size={16} />
                </div>
                <input
                  id="postal-code"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  disabled={isFormDisabled}
                  placeholder="e.g. 560001"
                  className="h-11 w-full pl-10 pr-3.5 bg-[#F7F5F1] hover:bg-white focus:bg-white border border-[#D9EDEE] rounded-xl text-sm font-medium text-foreground outline-none transition-all placeholder:text-[#8B9DA4] placeholder:font-normal hover:border-[#B8E0E2] focus:border-[#0396A6] focus:ring-4 focus:ring-[#0396A6]/10 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: REGIONAL & TAX CONFIGURATION ── */}
        <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-5 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAF2F2]">
            <div className="flex items-center gap-3.5">
              <Globe size={20} className="text-[#0396A6] shrink-0" />
              <div>
                <h2 className="text-[15px] sm:text-base font-bold text-foreground tracking-tight">
                  Regional &amp; Tax Configuration
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Timezone normalization, operational billing currency, and statutory tax parameters.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Default Timezone */}
            <div className="space-y-1.5">
              <label htmlFor="timezone" className="text-xs sm:text-[13px] font-bold text-[#334155]">
                Default Timezone
              </label>
              <Select
                id="timezone"
                value={timezone}
                onChange={(val) => setTimezone(String(val))}
                options={TIMEZONE_OPTIONS}
                disabled={isFormDisabled}
                leadingIcon={<Clock size={16} className="text-[#0396A6]" />}
                searchable
                searchPlaceholder="Search timezones…"
                size="lg"
                fullWidth
                triggerClassName={SETTINGS_SELECT_TRIGGER}
              />
            </div>

            {/* Operational Currency */}
            <div className="space-y-1.5">
              <label htmlFor="currency" className="text-xs sm:text-[13px] font-bold text-[#334155]">
                Operational Currency
              </label>
              <Select
                id="currency"
                value={currency}
                onChange={(val) => setCurrency(String(val))}
                options={CURRENCY_OPTIONS}
                disabled={isFormDisabled}
                leadingIcon={<Landmark size={16} className="text-[#0396A6]" />}
                size="lg"
                fullWidth
                triggerClassName={SETTINGS_SELECT_TRIGGER}
              />
            </div>

            {/* Interface & Greeting Locale */}
            <div className="space-y-1.5">
              <label htmlFor="locale" className="text-xs sm:text-[13px] font-bold text-[#334155]">
                Interface &amp; Greeting Locale
              </label>
              <Select
                id="locale"
                value={locale}
                onChange={(val) => setLocale(String(val))}
                options={LOCALE_OPTIONS}
                disabled={isFormDisabled}
                leadingIcon={<Languages size={16} className="text-[#0396A6]" />}
                size="lg"
                fullWidth
                triggerClassName={SETTINGS_SELECT_TRIGGER}
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label htmlFor="country" className="text-xs sm:text-[13px] font-bold text-[#334155]">
                Country
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#0396A6] pointer-events-none">
                  <Globe size={16} />
                </div>
                <input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={isFormDisabled}
                  placeholder="e.g. India"
                  className="h-11 w-full pl-10 pr-3.5 bg-[#F7F5F1] hover:bg-white focus:bg-white border border-[#D9EDEE] rounded-xl text-sm font-medium text-foreground outline-none transition-all placeholder:text-[#8B9DA4] placeholder:font-normal hover:border-[#B8E0E2] focus:border-[#0396A6] focus:ring-4 focus:ring-[#0396A6]/10 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* GSTIN / Tax ID */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="gstin" className="text-xs sm:text-[13px] font-bold text-[#334155]">
                  GSTIN / Tax ID
                </label>
                {!canBilling && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <Lock size={10} /> Requires billing:manage
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#0396A6] pointer-events-none">
                  <ShieldCheck size={16} />
                </div>
                <input
                  id="gstin"
                  type="text"
                  value={gstin}
                  onChange={(e) => {
                    setGstin(e.target.value.toUpperCase());
                    if (errors.gstin) setErrors((prev) => ({ ...prev, gstin: '' }));
                  }}
                  onBlur={() => {
                    if (gstin.trim()) {
                      if (!GSTIN_RE.test(gstin.trim().toUpperCase())) {
                        setErrors((prev) => ({ ...prev, gstin: 'Invalid GSTIN format. Expected: 07AAAAA0000A1Z5.' }));
                      }
                    }
                  }}
                  disabled={!canBilling || readOnly || isSaving}
                  placeholder="07AAAAA0000A1Z5"
                  aria-invalid={Boolean(errors.gstin)}
                  className={`h-11 w-full pl-10 pr-3.5 bg-[#F7F5F1] hover:bg-white focus:bg-white border rounded-xl text-sm font-medium text-foreground outline-none transition-all placeholder:text-[#8B9DA4] placeholder:font-normal hover:border-[#B8E0E2] focus:border-[#0396A6] focus:ring-4 focus:ring-[#0396A6]/10 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed ${
                    errors.gstin ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200/50' : 'border-[#D9EDEE]'
                  }`}
                />
              </div>
              {errors.gstin && (
                <p role="alert" className="text-xs text-red-600 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
                  <AlertCircle size={13} className="shrink-0" /> {errors.gstin}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── ACTION BAR (BELOW REGIONAL & TAX CONFIGURATION) ── */}
        <div className="bg-white border border-[#D9EDEE] rounded-xl sm:rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3.5 transition-all mt-6">
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {isDirty ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50/90 px-3.5 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>You have unsaved changes</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground px-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0396A6]" />
                <span>All company profile settings are in sync</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <kbd className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold text-muted-foreground bg-[#F7F5F1] border border-[#D9EDEE] rounded-lg shadow-2xs">
              <span className="text-xs">⌘</span>S
            </kbd>

            <button
              type="button"
              onClick={() => {
                if (isDirty) {
                  setShowResetModal(true);
                }
              }}
              disabled={!isDirty || isSaving || readOnly}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-muted/30 text-[#5F6B73] hover:text-foreground border border-[#D9EDEE] hover:border-[#BCE3E5] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            >
              <RotateCcw size={14} className="text-[#0396A6]" /> Discard
            </button>

            <button
              type="submit"
              disabled={!isDirty || isSaving || readOnly || !canConfig}
              className={`flex-1 sm:flex-none px-6 py-2.5 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_2px_10px_rgba(3,150,166,0.25)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer ${
                isJustSaved
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-[#0396A6] hover:bg-[#028391] text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-white" /> Saving Changes…
                </>
              ) : isJustSaved ? (
                <>
                  <Check size={15} className="stroke-[3] text-white" /> Saved Successfully
                </>
              ) : (
                <>
                  <Save size={14} className="text-white" /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ── RESET / DISCARD CONFIRMATION MODAL ── */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Discard unsaved changes?"
        message="You have unsaved changes on your company profile that will be lost. Are you sure you want to discard them and revert to your last saved workspace settings?"
        tone="warning"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        onConfirm={handleConfirmReset}
        onClose={() => setShowResetModal(false)}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
}
