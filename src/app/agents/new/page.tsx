'use client';

import React, { FormEvent, Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Globe, Smartphone, Layers, Bot, ArrowLeft, Mail,
  CheckCircle2, AlertTriangle, ArrowRight,
  Zap, RefreshCw, ChevronRight, Check, Sparkles,
  ShieldCheck, MessageSquare, Flame, FileText, Lock, type LucideIcon
} from 'lucide-react';
import { AppShell } from '@/components/shell/AppShell';
import { ErrorBox } from '@/components/ui/PageState';
import { Select } from '@/components/ui/Select';
import { apiRequest } from '@/lib/api';
import { completeOnboardingStep } from '@/lib/onboarding';
import { OnboardingStepBar } from '@/components/onboarding/OnboardingStepBar';
import type { Agent, AgentMode } from '@/lib/types';
import { afterCreateHref, modeLabel } from '@/lib/publishWaAgent';

interface ModeOption {
  value: AgentMode;
  label: string;
  shortLabel: string;
  blurb: string;
  icon: LucideIcon;
  gradient: string;
  borderActive: string;
  iconColor: string;
  iconBg: string;
}

const MODES: ModeOption[] = [
  {
    value: 'website',
    label: 'Website Assistant',
    shortLabel: 'Web Storefront',
    blurb: 'Interacts with web visitors in real time inside the customizable storefront chat widget.',
    icon: Globe,
    gradient: 'from-[#0396A6]/10 to-transparent',
    borderActive: 'border-[#0396A6] ring-2 ring-[#0396A6]/20 bg-gradient-to-br from-[#FAFDFD] to-[#F2F9F9]',
    iconColor: 'text-[#0396A6]',
    iconBg: 'bg-[#0396A6]/10 border-[#0396A6]/20',
  },
  {
    value: 'whatsapp',
    label: 'WhatsApp Assistant',
    shortLabel: 'WhatsApp Cloud',
    blurb: 'Handles inbound customer messaging on an official Meta WhatsApp Business phone number.',
    icon: Smartphone,
    gradient: 'from-emerald-500/10 to-transparent',
    borderActive: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-gradient-to-br from-emerald-50/40 to-emerald-50/10',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 border-emerald-200',
  },
  {
    value: 'unified',
    label: 'Unified Omnichannel',
    shortLabel: 'Web + WhatsApp',
    blurb: 'Omnichannel bot pairing website conversations with seamless continuation on WhatsApp.',
    icon: Layers,
    gradient: 'from-purple-500/10 to-transparent',
    borderActive: 'border-purple-500 ring-2 ring-purple-500/20 bg-gradient-to-br from-purple-50/40 to-purple-50/10',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 border-purple-200',
  },
  {
    value: 'email',
    label: 'Email Agent',
    shortLabel: 'Gmail Inbox',
    blurb: 'Classifies, drafts and auto-replies to a dedicated Gmail inbox, grounded in your knowledge base.',
    icon: Mail,
    gradient: 'from-[#0396A6]/10 to-transparent',
    borderActive: 'border-[#0396A6] ring-2 ring-[#0396A6]/20 bg-gradient-to-br from-[#FAFDFD] to-[#F2F9F9]',
    iconColor: 'text-[#0396A6]',
    iconBg: 'bg-[#0396A6]/10 border-[#0396A6]/20',
  },
];

const SUGGESTED_ROLES = [
  'Sales Specialist',
  'Customer Concierge',
  'Lead Qualifier',
  'Support Specialist',
  'Catalog Guide',
];

type ConfigFrom = 'website' | 'whatsapp';
type UnifiedCreated = Agent & { warnings?: string[] };

function isAgentMode(v: string | null): v is AgentMode {
  return v === 'website' || v === 'whatsapp' || v === 'unified' || v === 'email';
}

function suggestName(mode: AgentMode, existing: Agent[]): string {
  const inMode = existing.filter((a) => a.mode === mode && a.is_active !== false);
  const base =
    mode === 'website' ? 'Website Assistant'
    : mode === 'whatsapp' ? 'WhatsApp Assistant'
    : mode === 'email' ? 'Email Assistant'
    : 'Unified Agent';
  if (inMode.length === 0) return base;
  const taken = new Set(
    inMode.map((a) => (a.agent_name || '').trim().toLowerCase()).filter(Boolean),
  );
  if (!taken.has(base.toLowerCase())) return base;
  for (let n = 2; n < 50; n++) {
    const candidate = `${base} ${n}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return `${base} ${Date.now().toString(36).slice(-4)}`;
}

function NewAgentForm() {
  const params = useSearchParams();
  const preset = params.get('mode');
  const lockedMode = isAgentMode(preset) ? preset : null;

  const [mode, setMode] = useState<AgentMode>(lockedMode ?? 'website');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoaded, setAgentsLoaded] = useState(false);
  const [websiteAgentId, setWebsiteAgentId] = useState('');
  const [whatsappAgentId, setWhatsappAgentId] = useState('');
  const [configFrom, setConfigFrom] = useState<ConfigFrom>("website");
  const [copyVersion, setCopyVersion] = useState(true);
  const [copyWidget, setCopyWidget] = useState(true);
  const [copyKb, setCopyKb] = useState(false);
  const [startBlank, setStartBlank] = useState(false);

  useEffect(() => {
    if (lockedMode) setMode(lockedMode);
  }, [lockedMode]);

  useEffect(() => {
    void (async () => {
      try {
        const list = await apiRequest<Agent[]>('/v1/agents');
        const rows = list || [];
        setAgents(rows);
        const firstWeb = rows.find((a) => a.mode === 'website');
        const firstWa = rows.find((a) => a.mode === 'whatsapp');
        if (firstWeb) setWebsiteAgentId(firstWeb.id);
        if (firstWa) setWhatsappAgentId(firstWa.id);
        setName(suggestName(lockedMode ?? 'website', rows));
      } catch {
        setAgents([]);
        setName(suggestName(lockedMode ?? 'website', []));
      } finally {
        setAgentsLoaded(true);
      }
    })();
  }, [lockedMode]);

  useEffect(() => {
    if (!agentsLoaded || lockedMode) return;
    setName(suggestName(mode, agents));
  }, [mode, agentsLoaded, lockedMode]);

  const websiteAgents = useMemo(
    () => agents.filter((a) => a.mode === 'website'),
    [agents],
  );
  const whatsappAgents = useMemo(
    () => agents.filter((a) => a.mode === 'whatsapp'),
    [agents],
  );
  const hasPair = websiteAgents.length > 0 && whatsappAgents.length > 0;
  const usePairFlow = mode === 'unified' && hasPair && !startBlank;

  const currentModeConfig = MODES.find((m) => m.value === mode) || MODES[0]!;
  const CurrentIcon = currentModeConfig.icon;

  const handleSubmit = useCallback(async () => {
    setBusy(true);
    setError(null);
    setWarnings([]);
    const agentName = name.trim() || suggestName(mode, agents);
    try {
      let agent: Agent;
      if (usePairFlow) {
        if (!websiteAgentId || !whatsappAgentId) {
          setError('Please select both an active Website agent and a WhatsApp agent.');
          setBusy(false);
          return;
        }
        const created = await apiRequest<UnifiedCreated>('/v1/agents/unified-from-pair', {
          method: 'POST',
          body: {
            agent_name: agentName,
            website_agent_id: websiteAgentId,
            whatsapp_agent_id: whatsappAgentId,
            config_from: configFrom,
            include: {
              version: copyVersion,
              widget: copyWidget,
              kb: copyKb,
            },
          },
        });
        agent = created;
        if (Array.isArray(created.warnings) && created.warnings.length > 0) {
          setWarnings(created.warnings);
        }
      } else {
        agent = await apiRequest<Agent>('/v1/agents', {
          method: 'POST',
          body: { mode, agent_name: agentName },
        });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('frosty:agents-changed'));
      }
      void completeOnboardingStep("create_agent").catch(() => null);
      window.location.assign(afterCreateHref(agent));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create that agent');
      setBusy(false);
    }
  }, [
    name, mode, agents, usePairFlow, websiteAgentId, whatsappAgentId,
    configFrom, copyVersion, copyWidget, copyKb
  ]);

  // Keyboard shortcut Ctrl+Enter to submit (no UI hint)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!busy) {
          handleSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, handleSubmit]);

  const handleShuffleName = () => {
    setName(suggestName(mode, agents) + ' ' + Math.floor(Math.random() * 90 + 10));
  };

  const displayName = name.trim() || suggestName(mode, agents);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 sm:space-y-7 pb-36 sm:pb-28 animate-in fade-in duration-300">
      {/* ── HERO BANNER ── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-white via-[#FAFDFD] to-[#F2F9F9] rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-8 shadow-[0_4px_24px_rgba(3,150,166,0.06),0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#0396A6]/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-56 h-56 rounded-full bg-gradient-to-tr from-[#67C9CE]/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl text-[#0396A6] flex items-center justify-center shrink-0">
              <CurrentIcon size={24} className="sm:w-7 sm:h-7" />
            </div>

            <div className="space-y-0.5 sm:space-y-1">
              <h1 className="text-lg sm:text-2xl font-black text-foreground tracking-tight">
                {lockedMode ? `New ${modeLabel(lockedMode)} Agent` : 'Create AI Agent'}
              </h1>
              <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                Configure deployment boundaries, knowledge connections, and communication channels.
              </p>
            </div>
          </div>

          <Link href="/agents" className="self-start sm:self-auto">
            <button
              type="button"
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white hover:bg-muted/30 text-muted-foreground hover:text-foreground border border-[#D9EDEE] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft size={13} />
              <span>All Agents</span>
            </button>
          </Link>
        </div>
      </header>

      {/* ── 2-COLUMN STUDIO LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* ── MAIN FORM COLUMN (7 COLS ON DESKTOP) ── */}
        <div className="lg:col-span-7 space-y-5 sm:space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
            className="space-y-5 sm:space-y-6"
          >
            {error && (
              <div className="animate-in zoom-in-95">
                <ErrorBox message={error} />
              </div>
            )}

            {warnings.length > 0 && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-medium space-y-1 animate-in zoom-in-95">
                <span className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0" /> Created with notes:
                </span>
                <ul className="list-disc pl-5 space-y-0.5">
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── STEP 1: CHOOSE CHANNEL / MODE ── */}
            <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] space-y-3.5 sm:space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAF2F2]">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0396A6] text-white text-[11px] sm:text-xs font-black flex items-center justify-center shadow-xs">
                    1
                  </span>
                  <h2 className="text-xs sm:text-base font-bold text-foreground tracking-tight">
                    Deployment Channel
                  </h2>
                </div>

                {lockedMode ? (
                  <Link
                    href="/agents/new"
                    className="text-xs font-bold text-[#0396A6] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Switch Channel</span>
                    <ChevronRight size={12} />
                  </Link>
                ) : (
                  <span className="text-[11px] sm:text-xs text-muted-foreground">Select operation channel</span>
                )}
              </div>

              {/* If Mode is Locked from sidebar: render clean focused single card */}
              {lockedMode ? (
                <div className="p-3.5 sm:p-5 rounded-2xl border border-[#D9EDEE] bg-white shadow-xs flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                    <CurrentIcon size={20} className="sm:w-5 sm:h-5 text-[#0396A6] shrink-0 mt-0.5" />
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-black text-foreground">{currentModeConfig.label}</h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                        {currentModeConfig.blurb}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-[#0396A6] font-semibold pt-0.5">
                        Extra bots start offline so active traffic is unaffected until you choose to go live.
                      </p>
                    </div>
                  </div>

                  <div className="w-5 h-5 rounded-full bg-[#0396A6] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Check size={12} className="stroke-[3]" />
                  </div>
                </div>
              ) : (
                /* Unlocked: Full Interactive 3-Card Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  {MODES.map((m) => {
                    const Icon = m.icon;
                    const isSelected = mode === m.value;

                    return (
                      <div
                        key={m.value}
                        onClick={() => {
                          setMode(m.value);
                          setStartBlank(false);
                        }}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between gap-2.5 sm:gap-3 ${
                          isSelected
                            ? m.borderActive + ' shadow-md'
                            : 'border-[#D9EDEE] bg-white hover:border-[#BCE3E5] hover:bg-[#FAFDFD] cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${m.iconBg} ${m.iconColor} flex items-center justify-center font-bold shadow-2xs`}>
                            <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </div>

                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-[#0396A6] text-white flex items-center justify-center shadow-xs">
                              <Check size={12} className="stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-zinc-300" />
                          )}
                        </div>

                        <div className="space-y-0.5 sm:space-y-1">
                          <h3 className="text-xs sm:text-sm font-black text-foreground">{m.label}</h3>
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                            {m.blurb}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── STEP 2: AGENT IDENTITY & NAME STUDIO ── */}
            <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] space-y-3.5 sm:space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAF2F2]">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0396A6] text-white text-[11px] sm:text-xs font-black flex items-center justify-center shadow-xs">
                    2
                  </span>
                  <h2 className="text-xs sm:text-base font-bold text-foreground tracking-tight">
                    Agent Identity
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleShuffleName}
                  className="text-[11px] sm:text-xs text-[#0396A6] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={11} className="sm:w-3 sm:h-3" />
                  <span>Randomize name</span>
                </button>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-[#0396A6] pointer-events-none">
                    <Bot size={18} />
                  </div>
                  <input
                    id="agent-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sales Assistant Pro"
                    required
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#FAFDFD] border border-[#D9EDEE] rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-foreground outline-none hover:border-[#BCE3E5] focus:border-[#0396A6] focus:bg-white focus:ring-4 focus:ring-[#0396A6]/10 transition-all placeholder:text-muted-foreground/50 shadow-2xs"
                  />
                </div>

                {/* Quick Role Fill Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground mr-1">Quick roles:</span>
                  {SUGGESTED_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setName(role)}
                      className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#FAFDFD] hover:bg-[#0396A6]/10 text-muted-foreground hover:text-[#0396A6] border border-[#D9EDEE] text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ── STEP 3: KNOWLEDGE BASE ── */}
            <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] space-y-3.5 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-2.5 pb-3 border-b border-[#EAF2F2]">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0396A6] text-white text-[11px] sm:text-xs font-black flex items-center justify-center shadow-xs">
                  3
                </span>
                <h2 className="text-xs sm:text-base font-bold text-foreground tracking-tight">
                  Knowledge Base
                </h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                After creation, upload PDFs, documents, and website URLs on the agent setup page so RAG answers stay grounded in your catalog and policies.
              </p>
              <ul className="text-[11px] sm:text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                <li>File uploads (PDF, DOCX, TXT, CSV, Markdown)</li>
                <li>Website crawl and Q&amp;A pairs</li>
                <li>Scoped to this agent&apos;s retrieval index</li>
              </ul>
            </section>

            {/* ── STEP 4: UNIFIED AGENT ASSEMBLY (IF UNIFIED) ── */}
            {mode === 'unified' && hasPair && (
              <section className="bg-white rounded-2xl sm:rounded-3xl border border-purple-200 p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(168,85,247,0.05)] space-y-3.5 sm:space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-600 text-white text-[11px] sm:text-xs font-black flex items-center justify-center shadow-xs">
                      4
                    </span>
                    <h2 className="text-xs sm:text-base font-bold text-foreground tracking-tight">
                      Omnichannel Pair Assembly
                    </h2>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                    Pairing Enabled
                  </span>
                </div>

                {!startBlank ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Website Bot Selector */}
                      <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAFDFD] border border-[#D9EDEE] space-y-1.5">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Globe size={13} className="text-[#0396A6]" />
                          <span>Source Website Bot</span>
                        </label>
                        <Select
                          value={websiteAgentId}
                          onChange={(val) => setWebsiteAgentId(String(val))}
                          options={websiteAgents.map((a) => ({
                            value: a.id,
                            label: a.agent_name || a.slug || 'Website Agent',
                          }))}
                        />
                      </div>

                      {/* WhatsApp Bot Selector */}
                      <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAFDFD] border border-[#D9EDEE] space-y-1.5">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Smartphone size={13} className="text-emerald-600" />
                          <span>Source WhatsApp Bot</span>
                        </label>
                        <Select
                          value={whatsappAgentId}
                          onChange={(val) => setWhatsappAgentId(String(val))}
                          options={whatsappAgents.map((a) => ({
                            value: a.id,
                            label: a.agent_name || a.slug || 'WhatsApp Agent',
                          }))}
                        />
                      </div>
                    </div>

                    {/* Configuration Inheritance */}
                    <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAFDFD] border border-[#D9EDEE] space-y-2.5 sm:space-y-3">
                      <span className="text-xs font-bold text-foreground">Copy Persona &amp; Tools From:</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setConfigFrom('website')}
                          className={`p-2.5 sm:p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                            configFrom === 'website'
                              ? 'bg-[#0396A6] text-white border-[#0396A6] shadow-xs'
                              : 'bg-white text-foreground border-[#D9EDEE] hover:bg-muted/20'
                          }`}
                        >
                          <Globe size={14} /> <span>Website Bot</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfigFrom('whatsapp')}
                          className={`p-2.5 sm:p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                            configFrom === 'whatsapp'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-foreground border-[#D9EDEE] hover:bg-muted/20'
                          }`}
                        >
                          <Smartphone size={14} /> <span>WhatsApp Bot</span>
                        </button>
                      </div>

                      {/* Components to include */}
                      <div className="pt-1.5 space-y-2">
                        <label className="flex items-start sm:items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={copyVersion}
                            onChange={(e) => setCopyVersion(e.target.checked)}
                            className="rounded accent-[#0396A6] w-4 h-4 mt-0.5 sm:mt-0 shrink-0 cursor-pointer"
                          />
                          <span>Persona, tools, system instructions, and voice</span>
                        </label>

                        <label className="flex items-start sm:items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={copyWidget}
                            onChange={(e) => setCopyWidget(e.target.checked)}
                            className="rounded accent-[#0396A6] w-4 h-4 mt-0.5 sm:mt-0 shrink-0 cursor-pointer"
                          />
                          <span>Widget theme appearance &amp; greeting prompts</span>
                        </label>

                        <label className="flex items-start sm:items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={copyKb}
                            onChange={(e) => setCopyKb(e.target.checked)}
                            className="rounded accent-[#0396A6] w-4 h-4 mt-0.5 sm:mt-0 shrink-0 cursor-pointer"
                          />
                          <span>Knowledge base sources &amp; indexed documents</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Starting blank — no config will be copied.</p>
                )}

                <button
                  type="button"
                  onClick={() => setStartBlank(!startBlank)}
                  className="text-xs font-bold text-purple-700 hover:underline cursor-pointer pt-1 inline-block"
                >
                  {startBlank ? 'Use Website + WhatsApp pair instead' : 'Start with a blank unified bot instead'}
                </button>
              </section>
            )}

            {/* ── ACTIONS BAR ── */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 sm:gap-3 pt-2">
              <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">
                <Link href="/agents" className="flex-1 sm:flex-none">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-4 sm:px-5 py-2.5 bg-white hover:bg-muted/30 text-muted-foreground hover:text-foreground border border-[#D9EDEE] hover:border-[#BCE3E5] font-bold rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
                  >
                    Cancel
                  </button>
                </Link>

                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 sm:flex-none px-6 sm:px-7 py-2.5 bg-gradient-to-r from-[#0396A6] via-[#058492] to-[#028391] hover:from-[#028391] hover:to-[#016874] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(3,150,166,0.3)] transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {busy ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Initializing…
                    </>
                  ) : (
                    <>
                      <span>{usePairFlow ? 'Create Unified from Pair' : `Create ${modeLabel(mode)} Agent`}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ── RIGHT COMPANION COLUMN: LIVE AGENT SIMULATOR PREVIEW (5 COLS ON DESKTOP) ── */}
        <aside className="lg:col-span-5 space-y-4 sm:space-y-5 lg:sticky lg:top-6">
          {/* Live Agent Card Preview */}
          <div className="bg-gradient-to-br from-white via-[#FAFDFD] to-[#F2F9F9] rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-6 shadow-[0_4px_24px_rgba(3,150,166,0.06),0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAF2F2]">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#0396A6]" /> Live Agent Simulator
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
                Draft (Offline)
              </span>
            </div>

            {/* Avatar & Dynamic Title */}
            <div className="flex items-center gap-3 sm:gap-3.5 pt-0.5">
              <CurrentIcon size={22} className="sm:w-6 sm:h-6 text-[#0396A6] shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-base font-black text-foreground truncate">
                  {displayName}
                </h4>
                <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1">
                  <span>{currentModeConfig.label}</span>
                  <span>•</span>
                  <span className="text-[#0396A6] font-semibold">Ready to configure</span>
                </p>
              </div>
            </div>

            {/* Mock Chat Balloon */}
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-[#D9EDEE] shadow-2xs space-y-1">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Greeting Preview
              </span>
              <p className="text-[11px] sm:text-xs text-zinc-700 leading-relaxed italic">
                &ldquo;Hello! I&apos;m {displayName}. How can I assist you with products, pricing, or orders today?&rdquo;
              </p>
            </div>

            {/* Capabilities Pill Matrix */}
            <div className="space-y-1.5 pt-0.5">
              <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Included Capabilities
              </span>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-[#D9EDEE] text-[10px] sm:text-[11px] font-semibold text-foreground flex items-center gap-1.5 shadow-2xs truncate">
                  <FileText size={12} className="text-[#0396A6] shrink-0" />
                  <span className="truncate">RAG Knowledge</span>
                </div>
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-[#D9EDEE] text-[10px] sm:text-[11px] font-semibold text-foreground flex items-center gap-1.5 shadow-2xs truncate">
                  <Flame size={12} className="text-[#0396A6] shrink-0" />
                  <span className="truncate">Lead Discovery</span>
                </div>
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-[#D9EDEE] text-[10px] sm:text-[11px] font-semibold text-foreground flex items-center gap-1.5 shadow-2xs truncate">
                  <MessageSquare size={12} className="text-[#0396A6] shrink-0" />
                  <span className="truncate">Human Handoff</span>
                </div>
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-[#D9EDEE] text-[10px] sm:text-[11px] font-semibold text-foreground flex items-center gap-1.5 shadow-2xs truncate">
                  <ShieldCheck size={12} className="text-[#0396A6] shrink-0" />
                  <span className="truncate">Tool Guardrails</span>
                </div>
              </div>
            </div>
          </div>

          {/* Setup Roadmap Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-5 shadow-xs space-y-2.5 sm:space-y-3">
            <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Zap size={14} className="text-[#0396A6]" /> Setup Milestones
            </h5>
            <ol className="space-y-2 text-[11px] sm:text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#0396A6]/10 text-[#0396A6] font-bold text-[9px] sm:text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>Initialize identity &amp; channel (current step)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-zinc-100 text-muted-foreground font-bold text-[9px] sm:text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>Craft system persona instructions &amp; configure AI model</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-zinc-100 text-muted-foreground font-bold text-[9px] sm:text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>Test in playground and publish live channel</span>
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function NewAgentPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="New agent" subtitle="Loading…" requires="agent:config">
          <div />
        </AppShell>
      }
    >
      <NewAgentPageInner />
    </Suspense>
  );
}

function NewAgentPageInner() {
  const params = useSearchParams();
  const preset = params.get('mode');
  const locked = isAgentMode(preset) ? preset : null;
  const title = locked ? `New ${modeLabel(locked)} Agent` : 'New AI Agent';
  const subtitle = locked
    ? `Creates another ${modeLabel(locked)} bot. It starts offline until you enable it.`
    : 'Pick the channel it answers on.';

  return (
    <AppShell title={title} subtitle={subtitle} requires="agent:config">
      {!locked ? (
        <OnboardingStepBar
          stepKey="create_agent"
          stepTitle="Create your first AI agent"
          stepOrder={2}
          nextPath="/knowledge"
        />
      ) : null}
      <NewAgentForm />
    </AppShell>
  );

}
