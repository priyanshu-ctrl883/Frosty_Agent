'use client';

import React, { FormEvent, use, useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Globe, Smartphone, Layers, Bot,
  CheckCircle2, AlertTriangle,
  Zap, RefreshCw, ChevronRight,
  ShieldCheck, MessageSquare, FileText,
  History, Users, Trash2,
  Volume2, AlertCircle, Lock, BookOpen, type LucideIcon
} from 'lucide-react';
import { AgentAnalyticsSection } from '@/components/agents/AgentAnalyticsSection';
import { WebsiteKnowledgeTab } from '@/components/website/WebsiteKnowledgeTab';
import { AppShell } from '@/components/shell/AppShell';
import { Select } from '@/components/ui/Select';
import { AgentHeadingSelector } from '@/components/shell/AgentHeadingSelector';
import { ErrorBox, PageState } from '@/components/ui/PageState';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { useWorkspace } from '@/lib/workspace';
import { AGENT_LANGUAGE_OPTIONS } from '@/lib/publishWaAgent';
import type {
  Agent,
  AgentChannel,
  AgentConfig,
  AgentVersion,
  HandoffMode,
  PromptTone,
  ToolMode,
} from '@/lib/types';
import { TOOL_MODES } from '@/lib/types';

const TONES: { value: PromptTone; label: string; desc: string }[] = [
  { value: 'friendly', label: 'Friendly', desc: 'Warm, approachable, and helpful' },
  { value: 'professional', label: 'Professional', desc: 'Crisp, articulate, and business-first' },
  { value: 'casual', label: 'Casual', desc: 'Relaxed, conversational, and direct' },
  { value: 'formal', label: 'Formal', desc: 'Polite, structured, and traditional' },
  { value: 'enthusiastic', label: 'Enthusiastic', desc: 'High energy, vibrant, and encouraging' },
];

const HANDOFF_MODES: { value: HandoffMode; label: string; desc: string }[] = [
  { value: 'auto_round_robin', label: 'Round Robin', desc: 'Evenly distributes incoming chats across team members' },
  { value: 'auto_least_load', label: 'Least Loaded', desc: 'Routes to the teammate with fewest active conversations' },
  { value: 'manual_claim', label: 'Manual Claim', desc: 'Teammates claim conversations from a shared queue' },
];

const TOOL_FEATURES: { key: 'meetings' | 'quotes' | 'whatsapp'; label: string; hint: string; icon: LucideIcon }[] = [
  {
    key: 'meetings',
    label: 'Meeting Bookings',
    hint: 'Book, reschedule, and sync meeting slots on connected calendars.',
    icon: Zap,
  },
  {
    key: 'quotes',
    label: 'Sales Quotations',
    hint: 'Calculate itemized price proposals and dispatch PDFs to visitors.',
    icon: FileText,
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp Messaging',
    hint: 'Answer incoming customer queries on connected Meta WhatsApp numbers.',
    icon: Smartphone,
  },
];

const TOOL_MODE_LABELS: Record<ToolMode, string> = {
  ai: 'AI Autonomous — Agent handles end-to-end',
  human: 'Human Only — Always escalate to teammate',
  off: 'Disabled — Refuse this action entirely',
};

const TONE_OPTIONS = TONES.map((t) => ({
  value: t.value,
  label: `${t.label} (${t.desc})`,
}));

const HANDOFF_MODE_OPTIONS = HANDOFF_MODES.map((m) => ({
  value: m.value,
  label: `${m.label} (${m.desc})`,
}));

const TOOL_MODE_OPTIONS = TOOL_MODES.map((m) => ({
  value: m,
  label: TOOL_MODE_LABELS[m],
}));

const VOICE_REPLY_OPTIONS = [
  { value: 'off' as const, label: 'Off — Text replies only' },
  { value: 'auto' as const, label: 'Auto — Reply with voice when visitor sends audio' },
  { value: 'on' as const, label: 'On — Always reply with voice + text' },
];

const VOICE_PERSONA_OPTIONS = [
  { value: 'en-IN-Chirp3-HD-Aoede', label: 'Aoede HD (English - Indian / Warm & Professional)' },
  { value: 'hi-IN-Chirp3-HD-Aoede', label: 'Aoede HD (Hindi / Natural & Expressive)' },
  { value: 'ta-IN-Chirp3-HD-Aoede', label: 'Aoede HD (Tamil / Clear & Articulate)' },
  { value: 'te-IN-Chirp3-HD-Aoede', label: 'Aoede HD (Telugu / Friendly & Natural)' },
  { value: 'bn-IN-Chirp3-HD-Aoede', label: 'Aoede HD (Bengali / Warm & Engaging)' },
];

const isPresetLanguage = (code: string) =>
  AGENT_LANGUAGE_OPTIONS.some((option) => option.value === code);

const parseLanguageCodes = (raw: string): string[] =>
  raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

function emptyConfig(name: string): AgentConfig {
  return {
    prompt_mode: 'guided',
    guided: {
      persona: 'Helpful customer assistant',
      tone: 'friendly',
      languages: ['en'],
      welcome_message: 'Hi! How can I help you today?',
      fallback_message: "I don't have that in my knowledge base yet — drop your email and our team will follow up!",
    },
    raw_prompt: null,
    persona: { agent_name: name || 'Frosty', tone: 'friendly', business_info: '', dos: [], donts: [] },
    model: { model_id: 'gemini-3.5-flash' },
    generation: { temperature: 0.3, max_output_tokens: 1024 },
    rag: { tau: 0.55, top_k: 6, mode: 'lenient' },
    tools: {},
    handoff: { agent_idle_timeout_minutes: 5, on_agent_idle: 'resume_frosty_agent' },
    messages: { kb_miss_fallback: '', capacity_fallback: '', pace_fallback: '' },
    voice: {
      reply_mode: 'off',
      voice_name: 'en-IN-Chirp3-HD-Aoede',
      tts_model: 'chirp3-hd',
      stt_model: 'gemini-3.5-flash',
    },
  };
}

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const { allowed, isOverride } = useWorkspace();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [channels, setChannels] = useState<AgentChannel[]>([]);
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishingVersionId, setPublishingVersionId] = useState<string | null>(null);
  const [togglingChannelId, setTogglingChannelId] = useState<string | null>(null);
  const [patching, setPatching] = useState(false);

  // Guided vs Raw form state
  const [promptMode, setPromptMode] = useState<'guided' | 'raw'>('guided');
  const [rawPrompt, setRawPrompt] = useState<string>('');
  const [welcomeMessage, setWelcomeMessage] = useState<string>('Hi! How can I help you today?');
  const [fallbackMessage, setFallbackMessage] = useState<string>(
    "I don't have that in my knowledge base yet — drop your email and our team will follow up!"
  );
  const [languages, setLanguages] = useState<string>('en');
  const [languageCustom, setLanguageCustom] = useState<string>('');
  const [useCustomLanguage, setUseCustomLanguage] = useState(false);
  const [rawPromptEntitled, setRawPromptEntitled] = useState<boolean>(false);

  // Dirty State Tracking
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');

  const resolvedLanguages = useMemo((): string[] => {
    if (useCustomLanguage) {
      const parsed = parseLanguageCodes(languageCustom);
      return parsed.length > 0 ? parsed : ['en'];
    }
    return [languages.trim() || 'en'];
  }, [useCustomLanguage, languageCustom, languages]);

  const resolvedLanguageKey = resolvedLanguages.join(',');

  const isAnyActionBusy = savingDraft || publishingVersionId !== null || togglingChannelId !== null || patching;

  const load = useCallback(async () => {
    setError(null);
    try {
      void apiRequest<{ balance?: { unallocated_credits: number }; unallocated_credits?: number }>('/v1/billing/balance')
        .then((resp) => {
          const unallocated = resp.unallocated_credits ?? resp.balance?.unallocated_credits ?? 0;
          setBalance(unallocated);
        })
        .catch(() => {});

      const [a, vs, chs, entRes, allA] = await Promise.all([
        apiRequest<Agent>(`/v1/agents/${id}`),
        apiRequest<AgentVersion[]>(`/v1/agents/${id}/versions`),
        apiRequest<AgentChannel[]>(`/v1/agents/${id}/channels`),
        apiRequest<{ features?: Record<string, boolean> }>('/v1/entitlements').catch(() => null),
        apiRequest<Agent[]>('/v1/agents').catch(() => []),
      ]);

      setAgent(a);
      setVersions(vs || []);
      setChannels(chs || []);
      setAllAgents(Array.isArray(allA) ? allA : []);

      const isEntitled = Boolean(entRes?.features?.raw_prompt);
      setRawPromptEntitled(isEntitled);

      const current = vs?.find((v) => v.id === a.current_version_id) || vs?.[0];
      const cfg = current?.config || emptyConfig(a.agent_name || '');
      setConfig(cfg);
      setPromptMode(cfg.prompt_mode || 'guided');
      setRawPrompt(cfg.raw_prompt || '');
      const welcome = cfg.guided?.welcome_message || cfg.messages?.kb_miss_fallback || 'Hi! How can I help you today?';
      const fallback =
        cfg.guided?.fallback_message ||
        cfg.messages?.kb_miss_fallback ||
        "I don't have that in my knowledge base yet — drop your email and our team will follow up!";
      const langs = cfg.guided?.languages?.length ? cfg.guided.languages : ['en'];
      const primaryLang = langs[0] ?? 'en';
      const singlePreset = langs.length === 1 && isPresetLanguage(primaryLang);

      setWelcomeMessage(welcome);
      setFallbackMessage(fallback);
      setUseCustomLanguage(!singlePreset);
      setLanguageCustom(singlePreset ? '' : langs.join(', '));
      setLanguages(singlePreset ? primaryLang : 'en');

      setInitialSnapshot(
        JSON.stringify({
          cfg,
          promptMode: cfg.prompt_mode || 'guided',
          rawPrompt: cfg.raw_prompt || '',
          welcomeMessage: welcome,
          fallbackMessage: fallback,
          resolvedLanguage: langs.join(','),
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this agent');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const isDirty = useMemo(() => {
    if (!config || !initialSnapshot) return false;
    const current = JSON.stringify({
      cfg: config,
      promptMode,
      rawPrompt,
      welcomeMessage,
      fallbackMessage,
      resolvedLanguage: resolvedLanguageKey,
    });
    return current !== initialSnapshot;
  }, [config, promptMode, rawPrompt, welcomeMessage, fallbackMessage, resolvedLanguageKey, initialSnapshot]);

  function setPersona<K extends keyof AgentConfig['persona']>(
    key: K,
    value: AgentConfig['persona'][K]
  ) {
    setConfig((c) => (c ? { ...c, persona: { ...c.persona, [key]: value } } : c));
  }

  function setToolField<K extends 'meetings' | 'quotes' | 'whatsapp'>(
    feature: K,
    patch: NonNullable<AgentConfig['tools'][K]>
  ) {
    setConfig((c) => {
      if (!c) return c;
      const existing = (c.tools?.[feature] ?? {}) as NonNullable<AgentConfig['tools'][K]>;
      return {
        ...c,
        tools: { ...c.tools, [feature]: { ...existing, ...patch } },
      };
    });
  }

  const handleDiscard = useCallback(() => {
    if (!initialSnapshot) return;
    try {
      const snap = JSON.parse(initialSnapshot);
      setConfig(snap.cfg);
      setPromptMode(snap.promptMode);
      setRawPrompt(snap.rawPrompt);
      setWelcomeMessage(snap.welcomeMessage);
      setFallbackMessage(snap.fallbackMessage);
      const lang = snap.resolvedLanguage || 'en';
      const langs = parseLanguageCodes(lang);
      const primaryLang = langs[0] ?? 'en';
      const singlePreset = langs.length === 1 && isPresetLanguage(primaryLang);
      setUseCustomLanguage(!singlePreset);
      setLanguageCustom(singlePreset ? '' : langs.join(', '));
      setLanguages(singlePreset ? primaryLang : 'en');
      toastSuccess('Unsaved changes discarded.');
    } catch {
      // ignore
    }
  }, [initialSnapshot, toastSuccess]);

  async function saveDraft(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!config || isAnyActionBusy) return;
    setSavingDraft(true);
    setError(null);
    setNotice(null);

    const langList = resolvedLanguages;

    const payload: AgentConfig = {
      ...config,
      prompt_mode: promptMode,
      raw_prompt: promptMode === 'raw' ? rawPrompt : null,
      guided: {
        persona: config.persona.business_info || config.persona.agent_name || 'Frosty',
        tone: (config.persona.tone as PromptTone) || 'friendly',
        languages: langList.length > 0 ? langList : ['en'],
        welcome_message: welcomeMessage,
        fallback_message: fallbackMessage,
        business_hours: {},
      },
    };

    try {
      const version = await apiRequest<AgentVersion>(`/v1/agents/${id}/versions`, {
        method: 'POST',
        body: payload,
      });
      toastSuccess(`Saved version ${version.version_number} draft.`);
      setNotice(
        `Saved as version ${version.version_number} (Draft). Publish when ready to update live customers.`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save version draft');
      toastError(err instanceof Error ? err.message : 'Could not save version draft');
    } finally {
      setSavingDraft(false);
    }
  }

  // Keyboard shortcut Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && !isAnyActionBusy) {
          saveDraft();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, isAnyActionBusy]);

  async function publish(versionId: string, isRollback: boolean) {
    setPublishingVersionId(versionId);
    setError(null);
    setNotice(null);
    try {
      if (isRollback) {
        await apiRequest<Agent>(`/v1/agents/${id}/versions/${versionId}/rollback`, {
          method: 'POST',
        });
        toastSuccess('Rolled back version successfully.');
      } else {
        await apiRequest<Agent>(`/v1/agents/${id}/versions/${versionId}/publish`, {
          method: 'POST',
        });
        toastSuccess('Published live release successfully.');
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish version');
      toastError(err instanceof Error ? err.message : 'Could not publish');
    } finally {
      setPublishingVersionId(null);
    }
  }

  async function patchAgent(body: Record<string, unknown>) {
    setPatching(true);
    setError(null);
    try {
      await apiRequest<Agent>(`/v1/agents/${id}`, { method: 'PATCH', body });
      toastSuccess('Agent configuration updated.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the agent');
      toastError(err instanceof Error ? err.message : 'Could not update');
    } finally {
      setPatching(false);
    }
  }

  async function deleteAgent() {
    setPatching(true);
    setError(null);
    try {
      await apiRequest(`/v1/agents/${id}`, { method: 'DELETE' });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('frosty:agents-changed'));
      }
      toastSuccess('Agent deleted.');
      window.location.href = '/agents';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the agent');
      toastError(err instanceof Error ? err.message : 'Could not delete');
      setPatching(false);
    }
  }

  async function toggleChannel(channel: AgentChannel) {
    setTogglingChannelId(channel.id);
    setError(null);
    try {
      await apiRequest<AgentChannel>(`/v1/agents/${id}/channels/${channel.channel}`, {
        method: 'PATCH',
        body: { enabled: !channel.enabled },
      });
      toastSuccess(
        channel.enabled
          ? `Paused ${channel.channel} channel.`
          : `Activated ${channel.channel} channel live.`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change that channel');
      toastError(err instanceof Error ? err.message : 'Channel toggle failed');
    } finally {
      setTogglingChannelId(null);
    }
  }

  if (loading) {
    return (
      <AppShell title="Agent Studio" requires="agent:config">
        <div className="pt-6">
          <PageSkeleton />
        </div>
      </AppShell>
    );
  }

  if (error && !agent) {
    return (
      <AppShell title="Agent Studio" requires="agent:config">
        <ErrorBox message={error} onRetry={() => void load()} />
      </AppShell>
    );
  }

  if (!agent || !config) {
    return (
      <AppShell title="Agent Studio" requires="agent:config">
        <PageState
          icon="smart_toy"
          title="Agent not found"
          description="This agent may have been removed or belongs to another workspace."
          primaryHref="/agents"
          primaryLabel="Back to Agents"
        />
      </AppShell>
    );
  }

  const published = versions.find((v) => v.id === agent.current_version_id);
  const latest = versions[0];
  const hasUnpublishedDraft = Boolean(latest && latest.id !== agent.current_version_id);

  const ModeIcon = agent.mode === 'whatsapp' ? Smartphone : agent.mode === 'unified' ? Layers : Globe;

  return (
    <AppShell
      title={
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="text-[#0396A6] flex items-center justify-center shrink-0">
            <ModeIcon size={18} className="sm:w-5 sm:h-5" />
          </div>
          <AgentHeadingSelector
            agentName={agent.agent_name || agent.slug}
            agents={allAgents}
            selectedAgentId={agent.id}
            onSelectAgent={(targetId) => router.push(`/agents/${targetId}`)}
          />
        </div>
      }
      subtitle={`${agent.mode.toUpperCase()} Agent • ${
        published
          ? `Version ${published.version_number} Live (${published.prompt_mode || published.config?.prompt_mode || 'Guided'})`
          : 'Draft Setup (Offline)'
      }`}
      requires="agent:config"
      actions={
        balance !== null ? (
          <Link
            href="/billing"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/80 text-foreground text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Available Wallet Credits"
          >
            <span className="text-muted-foreground text-[11px] font-medium hidden xs:inline">Credits:</span>
            <span className="text-[#0396A6] font-extrabold">{balance.toLocaleString()} CR</span>
          </Link>
        ) : undefined
      }
    >
      <div className="w-full space-y-5 sm:space-y-7 pb-24 sm:pb-28 animate-in fade-in duration-300">
        {error && <ErrorBox message={error} onRetry={() => void load()} />}

        {/* ── 2-COLUMN STUDIO WORKSPACE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* ── MAIN STUDIO CONFIGURATION (7 COLS) ── */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            <form onSubmit={(e) => void saveDraft(e)} className="space-y-5 sm:space-y-6">
              {/* ── PROMPT MODE SEGMENTED PICKER ── */}
              {rawPromptEntitled && (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">Prompt Instruction Mode</h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">Choose structured guided controls or raw system instructions.</p>
                  </div>

                  <div className="p-1 rounded-xl bg-white border-[1.5px] border-[#0396A6]/35 flex items-center gap-1 shrink-0 self-start sm:self-auto shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setPromptMode('guided')}
                      className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        promptMode === 'guided'
                          ? 'bg-[#0396A6] text-white border-[#0396A6] shadow-xs'
                          : 'bg-white text-[#0396A6] border-[#0396A6]/30 hover:border-[#0396A6]/60 hover:bg-[#0396A6]/5'
                      }`}
                    >
                      Guided Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromptMode('raw')}
                      className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        promptMode === 'raw'
                          ? 'bg-[#0396A6] text-white border-[#0396A6] shadow-xs'
                          : 'bg-white text-[#0396A6] border-[#0396A6]/30 hover:border-[#0396A6]/60 hover:bg-[#0396A6]/5'
                      }`}
                    >
                      Raw Mode
                    </button>
                  </div>
                </div>
              )}

              {/* ── RAW MODE STUDIO ── */}
              {promptMode === 'raw' ? (
                <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] space-y-3.5 sm:space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EAF2F2]">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-bold">
                        <FileText size={15} />
                      </div>
                      <h2 className="text-xs sm:text-base font-bold text-foreground">Raw System Instructions</h2>
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-muted-foreground bg-white px-2 py-0.5 rounded border border-[#D9EDEE]">
                      {rawPrompt.length} / 4000
                    </span>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950 text-xs flex items-start gap-2.5">
                    <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-[11px] sm:text-xs">
                      <strong>Platform Safety Shield Active:</strong> Injection defense and hallucination constraints are automatically enforced around your raw prompt.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <textarea
                      value={rawPrompt}
                      maxLength={4000}
                      rows={12}
                      onChange={(e) => setRawPrompt(e.target.value)}
                      placeholder="Write your custom system instructions and persona parameters here..."
                      className="w-full p-3.5 sm:p-4 bg-[#FAFDFD] border border-[#D9EDEE] rounded-xl sm:rounded-2xl text-xs sm:text-sm font-mono text-foreground outline-none focus:border-[#0396A6] focus:bg-white focus:ring-4 focus:ring-[#0396A6]/10 transition-all placeholder:text-muted-foreground/50 shadow-2xs leading-relaxed resize-none"
                    />
                  </div>
                </section>
              ) : (
                /* ── GUIDED MODE STUDIO ── */
                <>
                  {/* Persona & Brand Identity Card */}
                  <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] space-y-3.5 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-2.5 pb-3 border-b border-[#EAF2F2]">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-bold">
                        <Bot size={15} />
                      </div>
                      <h2 className="text-xs sm:text-base font-bold text-foreground">Persona &amp; Voice Tone</h2>
                    </div>

                    <div className="space-y-3.5 sm:space-y-4">
                      {/* Name it uses with customers */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Name Used with Customers</label>
                        <div className="relative flex items-center">
                          <Bot size={16} className="absolute left-3.5 text-[#0396A6] pointer-events-none" />
                          <input
                            type="text"
                            value={config.persona.agent_name}
                            onChange={(e) => setPersona('agent_name', e.target.value)}
                            placeholder="e.g. Frosty Assistant"
                            className="w-full pl-10 pr-4 py-2.5 bg-[#FAFDFD] border border-[#D9EDEE] rounded-xl text-xs sm:text-sm font-bold text-foreground outline-none focus:border-[#0396A6] focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      {/* Tone & Multi-lingual ISO Codes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground">Conversation Tone</label>
                          <Select
                            value={config.persona.tone}
                            onChange={(val) => setPersona('tone', val as PromptTone)}
                            options={TONE_OPTIONS}
                            fullWidth
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-foreground">Supported Languages</label>
                          {useCustomLanguage ? (
                            <input
                              type="text"
                              value={languageCustom}
                              onChange={(e) => setLanguageCustom(e.target.value)}
                              placeholder="e.g. sw, pt-BR, ja — comma-separated ISO codes"
                              className="w-full px-3.5 py-2.5 bg-[#FAFDFD] border border-[#D9EDEE] rounded-xl text-xs sm:text-sm font-semibold text-foreground outline-none focus:border-[#0396A6]"
                            />
                          ) : (
                            <Select
                              value={languages}
                              onChange={(val) => setLanguages(String(val))}
                              options={AGENT_LANGUAGE_OPTIONS}
                              searchable
                              searchPlaceholder="Search languages…"
                              fullWidth
                            />
                          )}
                          <label className="flex items-start gap-2.5 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useCustomLanguage}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setUseCustomLanguage(checked);
                                if (checked) {
                                  setLanguageCustom(
                                    useCustomLanguage
                                      ? languageCustom
                                      : languages.trim() || 'en'
                                  );
                                } else {
                                  const first = parseLanguageCodes(languageCustom)[0];
                                  if (first && isPresetLanguage(first)) {
                                    setLanguages(first);
                                  }
                                }
                              }}
                              className="mt-0.5 rounded accent-[#0396A6] w-4 h-4 cursor-pointer"
                            />
                            <span className="text-muted-foreground leading-relaxed">
                              <span className="font-semibold text-foreground">
                                Language not listed — enter ISO code(s)
                              </span>
                              <span className="block mt-0.5">
                                Type one or more BCP-47 codes separated by commas when your language
                                is not in the dropdown.
                              </span>
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* About the Business */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-foreground">Business Context &amp; Purpose</label>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            Facts belong in{' '}
                            <Link href={`/knowledge?agent=${id}`} className="text-[#0396A6] underline">
                              Knowledge Base
                            </Link>
                          </span>
                        </div>
                        <textarea
                          value={config.persona.business_info}
                          maxLength={4000}
                          rows={3}
                          onChange={(e) => setPersona('business_info', e.target.value)}
                          placeholder="What your company sells, target customers, and core value proposition."
                          className="w-full p-3 sm:p-3.5 bg-[#FAFDFD] border border-[#D9EDEE] rounded-xl text-xs sm:text-sm text-foreground outline-none focus:border-[#0396A6] focus:bg-white leading-relaxed resize-none"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Customer Greetings & Fallbacks Card */}
                  <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] space-y-3.5 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-2.5 pb-3 border-b border-[#EAF2F2]">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-bold">
                        <MessageSquare size={15} />
                      </div>
                      <h2 className="text-xs sm:text-base font-bold text-foreground">Customer Messages</h2>
                    </div>

                    <div className="space-y-3.5 sm:space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Initial Welcome Greeting</label>
                        <textarea
                          value={welcomeMessage}
                          maxLength={4000}
                          rows={2}
                          onChange={(e) => setWelcomeMessage(e.target.value)}
                          placeholder="Sent automatically when customer opens a conversation."
                          className="w-full p-3 bg-[#FAFDFD] border border-[#D9EDEE] rounded-xl text-xs sm:text-sm text-foreground outline-none focus:border-[#0396A6] focus:bg-white leading-relaxed resize-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Knowledge Fallback Response</label>
                        <textarea
                          value={fallbackMessage}
                          maxLength={4000}
                          rows={2}
                          onChange={(e) => setFallbackMessage(e.target.value)}
                          placeholder="Sent when the knowledge base cannot find an answer to the customer's query."
                          className="w-full p-3 bg-[#FAFDFD] border border-[#D9EDEE] rounded-xl text-xs sm:text-sm text-foreground outline-none focus:border-[#0396A6] focus:bg-white leading-relaxed resize-none"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Behavioral Guardrails (Always Do / Never Do) */}
                  <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] space-y-3.5 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-2.5 pb-3 border-b border-[#EAF2F2]">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-200">
                        <ShieldCheck size={15} />
                      </div>
                      <div>
                        <h2 className="text-xs sm:text-base font-bold text-foreground">Behavioral Directives</h2>
                        <p className="text-[11px] sm:text-xs text-muted-foreground">Specific rules to enforce on every conversation turn.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                      {/* Always Do */}
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-2">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          <span>Always Do (One per line)</span>
                        </span>
                        <textarea
                          value={config.persona.dos.join('\n')}
                          rows={3}
                          onChange={(e) =>
                            setPersona(
                              'dos',
                              e.target.value.split('\n').map((l) => l.slice(0, 200)).slice(0, 30)
                            )
                          }
                          placeholder="e.g. Always offer a callback if the query is urgent."
                          className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-xs text-foreground outline-none focus:border-emerald-500 leading-relaxed resize-none"
                        />
                      </div>

                      {/* Never Do */}
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/40 border border-rose-200 space-y-2">
                        <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                          <AlertCircle size={14} className="text-rose-600 shrink-0" />
                          <span>Never Do (One per line)</span>
                        </span>
                        <textarea
                          value={config.persona.donts.join('\n')}
                          rows={3}
                          onChange={(e) =>
                            setPersona(
                              'donts',
                              e.target.value.split('\n').map((l) => l.slice(0, 200)).slice(0, 30)
                            )
                          }
                          placeholder="e.g. Never promise discounts not in catalog."
                          className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-xs text-foreground outline-none focus:border-rose-500 leading-relaxed resize-none"
                        />
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* ── AUTONOMOUS TOOL PERMISSIONS ── */}
              <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] space-y-3.5 sm:space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#EAF2F2]">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-bold">
                      <Zap size={15} />
                    </div>
                    <div>
                      <h2 className="text-xs sm:text-base font-bold text-foreground">Tool &amp; Action Permissions</h2>
                      <p className="text-[11px] sm:text-xs text-muted-foreground">Override workspace default tool autonomy for this agent.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  {TOOL_FEATURES.map(({ key, label, hint, icon: Icon }) => {
                    const entry = config.tools?.[key] ?? {};
                    const inherit = entry.use_merchant_default !== false;
                    const toolModeVal = (inherit ? 'ai' : entry.mode ?? 'ai') as ToolMode;

                    return (
                      <div
                        key={key}
                        className="p-3.5 sm:p-4 rounded-2xl bg-[#FAFDFD] border border-[#D9EDEE] hover:border-[#BCE3E5] transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                            <Icon size={14} className="text-[#0396A6]" />
                            <span>{label}</span>
                          </span>

                          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={inherit}
                              onChange={(e) =>
                                setToolField(key, {
                                  use_merchant_default: e.target.checked,
                                  ...(e.target.checked ? {} : { mode: entry.mode ?? 'ai' }),
                                })
                              }
                              className="rounded accent-[#0396A6] w-4 h-4 cursor-pointer"
                            />
                            <span>Use Workspace Default</span>
                          </label>
                        </div>

                        {!inherit ? (
                          <div className="pt-1">
                            <Select
                              value={toolModeVal}
                              onChange={(val) =>
                                setToolField(key, { mode: val as ToolMode, use_merchant_default: false })
                              }
                              options={TOOL_MODE_OPTIONS}
                              fullWidth
                            />
                          </div>
                        ) : null}

                        <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── VOICE & SPEECH SYNTHESIS ── */}
              <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] space-y-3.5 sm:space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#EAF2F2]">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-bold">
                      <Volume2 size={15} />
                    </div>
                    <div>
                      <h2 className="text-xs sm:text-base font-bold text-foreground">Voice &amp; Neural Audio</h2>
                      <p className="text-[11px] sm:text-xs text-muted-foreground">Multi-lingual HD speech replies for website and WhatsApp audio.</p>
                    </div>
                  </div>
                  {!allowed('voice_replies') && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted/40 border border-border rounded-lg px-2 py-1">
                      <Lock size={12} /> Locked
                    </span>
                  )}
                </div>
                {!allowed('voice_replies') && (
                  <p className="text-[11px] text-muted-foreground">
                    {isOverride('voice_replies')
                      ? 'Voice replies are locked on this workspace override.'
                      : 'Voice replies are not included in your current plan.'}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Voice Reply Mode</label>
                    <Select
                      value={allowed('voice_replies') ? (config.voice?.reply_mode ?? 'off') : 'off'}
                      disabled={!allowed('voice_replies')}
                      onChange={(val) =>
                        setConfig((c) =>
                          c
                            ? {
                                ...c,
                                voice: {
                                  ...c.voice,
                                  reply_mode: val as 'off' | 'on' | 'auto',
                                },
                              }
                            : c
                        )
                      }
                      options={VOICE_REPLY_OPTIONS}
                      fullWidth
                    />
                  </div>

                  {allowed('voice_replies') && config.voice?.reply_mode && config.voice.reply_mode !== 'off' ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Neural Voice Persona</label>
                      <Select
                        value={config.voice?.voice_name ?? 'en-IN-Chirp3-HD-Aoede'}
                        onChange={(val) =>
                          setConfig((c) =>
                            c
                              ? {
                                  ...c,
                                  voice: {
                                    ...c.voice,
                                    voice_name: String(val),
                                  },
                                }
                              : c
                          )
                        }
                        options={VOICE_PERSONA_OPTIONS}
                        fullWidth
                      />
                    </div>
                  ) : null}
                </div>
              </section>

              {/* ── HUMAN HANDOFF TIMEOUT ── */}
              <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] space-y-3.5 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-2.5 pb-3 border-b border-[#EAF2F2]">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-bold">
                    <Users size={15} />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-base font-bold text-foreground">Human Handoff &amp; Idle Timeout</h2>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">Controls agent re-engagement if a human teammate becomes inactive.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Teammate Idle Timeout</label>
                    <span className="text-xs font-mono font-bold text-[#0396A6]">
                      {config.handoff.agent_idle_timeout_minutes} Minutes
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={30}
                    value={config.handoff.agent_idle_timeout_minutes}
                    onChange={(e) =>
                      setConfig((c) =>
                        c
                          ? {
                              ...c,
                              handoff: {
                                ...c.handoff,
                                agent_idle_timeout_minutes: Number(e.target.value) || 5,
                              },
                            }
                          : c
                      )
                    }
                    className="w-full accent-[#0396A6] cursor-pointer h-2 bg-[#D9EDEE] rounded-lg"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    If an assigned teammate does not reply within this window, Frosty automatically resumes handling the conversation.
                  </p>
                </div>
              </section>
            </form>

            {/* ── KNOWLEDGE BASE ── */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 sm:gap-2.5 pb-1">
                <BookOpen size={16} className="text-[#0396A6] shrink-0" />
                <div>
                  <h2 className="text-xs sm:text-base font-bold text-foreground">Knowledge Base</h2>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    Upload documents, crawl pages, and add Q&amp;A so this agent can answer from your content.
                  </p>
                </div>
              </div>
              <WebsiteKnowledgeTab
                webAgentId={id}
                afterSources={
                  <div className="mt-4 p-4 sm:p-5 rounded-2xl border border-[#D9EDEE] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {isDirty
                        ? 'Unsaved version draft changes'
                        : published
                          ? `Version ${published.version_number} is live`
                          : 'All changes saved to draft'}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end">
                      {isDirty ? (
                        <button
                          type="button"
                          onClick={handleDiscard}
                          disabled={isAnyActionBusy}
                          className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Discard
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => void saveDraft()}
                        disabled={!isDirty || isAnyActionBusy}
                        className={`text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          !isDirty ? 'text-muted-foreground' : 'text-[#0396A6] hover:text-[#087681]'
                        }`}
                      >
                        {savingDraft ? 'Saving…' : 'Save Draft'}
                      </button>

                      {hasUnpublishedDraft && latest ? (
                        <button
                          type="button"
                          disabled={isAnyActionBusy}
                          onClick={() => void publish(latest.id, false)}
                          className="text-xs sm:text-sm font-semibold text-[#0396A6] hover:text-[#087681] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {publishingVersionId === latest.id
                            ? 'Publishing…'
                            : `Publish v${latest.version_number}`}
                        </button>
                      ) : null}
                    </div>
                  </div>
                }
              />
            </section>
          </div>

          {/* ── RIGHT COMPANION: OPERATIONS & RELEASES (5 COLS) ── */}
          <aside className="lg:col-span-5 space-y-4 sm:space-y-5 lg:sticky lg:top-6">
            {/* ── LIVE CHANNELS & ROUTING CARD ── */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] space-y-3.5 sm:space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAF2F2]">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-[#0396A6]" />
                  <h3 className="text-xs sm:text-sm font-bold text-foreground">Deployment Channels</h3>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  Live Traffic
                </span>
              </div>

              {!channels.length ? (
                <p className="text-xs text-muted-foreground">No channels bound to this agent.</p>
              ) : (
                <div className="space-y-2.5">
                  {channels.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 sm:p-3.5 rounded-2xl bg-[#FAFDFD] border border-[#D9EDEE] flex items-center justify-between gap-2.5 sm:gap-3 hover:border-[#BCE3E5] transition-all"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground uppercase tracking-wider">{c.channel}</span>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {c.enabled ? 'Live' : 'Paused'}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                          {c.enabled ? 'Taking live customer traffic' : 'Offline — not receiving chats'}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isAnyActionBusy}
                        onClick={() => void toggleChannel(c)}
                        className="text-xs font-semibold text-[#0396A6] hover:text-[#087681] hover:underline transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {togglingChannelId === c.id ? (
                          <RefreshCw size={12} className="animate-spin inline" />
                        ) : c.enabled ? (
                          'Pause'
                        ) : (
                          'Go Live'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Handoff Routing Mode */}
              <div className="pt-2 space-y-1.5 border-t border-[#EAF2F2]">
                <label className="text-xs font-bold text-foreground">Handoff Routing Policy</label>
                <Select
                  value={agent.handoff_mode}
                  disabled={patching}
                  onChange={(val) => void patchAgent({ handoff_mode: val })}
                  options={HANDOFF_MODE_OPTIONS}
                  fullWidth
                />
              </div>
            </div>

            {/* ── IMMUTABLE VERSION RELEASES CARD ── */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#D9EDEE] p-4 sm:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] space-y-3.5 sm:space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAF2F2]">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-[#0396A6]" />
                  <h3 className="text-xs sm:text-sm font-bold text-foreground">Release Timeline</h3>
                </div>
                <Link
                  href={`/agents/${id}/versions`}
                  className="text-xs font-bold text-[#0396A6] hover:underline flex items-center gap-1"
                >
                  <span>All ({versions.length})</span>
                  <ChevronRight size={12} />
                </Link>
              </div>

              {!versions.length ? (
                <p className="text-xs text-muted-foreground">No versions saved yet.</p>
              ) : (
                <div className="space-y-2 max-h-[260px] overflow-y-auto no-scrollbar">
                  {versions.slice(0, 5).map((v) => {
                    const isLive = v.id === agent.current_version_id;
                    const modeTag = v.prompt_mode || v.config?.prompt_mode || 'guided';

                    return (
                      <div
                        key={v.id}
                        className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2.5 sm:gap-3 transition-all ${
                          isLive
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-[#FAFDFD] border-[#D9EDEE] hover:border-[#BCE3E5]'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-foreground">v{v.version_number}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                              {modeTag}
                            </span>
                            {isLive && (
                              <span className="text-[10px] font-extrabold uppercase text-emerald-600">
                                Live
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">Immutable snapshot</p>
                        </div>

                        {!isLive ? (
                          <button
                            type="button"
                            disabled={isAnyActionBusy}
                            onClick={() =>
                              void publish(v.id, Boolean(published && v.version_number < published.version_number))
                            }
                            className="text-xs font-semibold text-[#0396A6] hover:text-[#087681] hover:underline transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {publishingVersionId === v.id ? (
                              <RefreshCw size={12} className="animate-spin inline" />
                            ) : published && v.version_number < published.version_number ? (
                              'Roll back'
                            ) : (
                              'Publish'
                            )}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── PLATFORM SAFETY SHIELD ── */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#FAFDFD] to-[#F2F9F9] border border-[#D9EDEE] flex items-start gap-3 shadow-2xs">
              <ShieldCheck size={18} className="text-[#0396A6] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground">Enterprise Platform Guardrails</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Real-time prompt injection defense, PII masking, and anti-hallucination bounds are automatically active.
                </p>
              </div>
            </div>

            {/* ── DANGER ZONE ── */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-red-200 p-4 sm:p-5 shadow-xs space-y-3 text-red-950">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle size={16} />
                <h3 className="text-xs sm:text-sm font-bold">Danger Zone</h3>
              </div>

              {agent.mode === 'unified' ? (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-red-800 leading-relaxed">
                    <strong>Decombine</strong> retires this unified agent while preserving the source website and WhatsApp bots.
                  </p>
                  <button
                    type="button"
                    disabled={isAnyActionBusy}
                    onClick={() => {
                      if (
                        confirm(
                          'Decombine this Unified agent? Source website and WhatsApp bots will remain working.'
                        )
                      ) {
                        void (async () => {
                          setPatching(true);
                          try {
                            await apiRequest(`/v1/agents/${id}/decombine`, { method: 'POST' });
                            if (typeof window !== 'undefined') {
                              window.dispatchEvent(new Event('frosty:agents-changed'));
                            }
                            window.location.href = '/agents';
                          } catch (err) {
                            toastError(err instanceof Error ? err.message : 'Could not decombine');
                            setPatching(false);
                          }
                        })();
                      }
                    }}
                    className="w-full py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    Decombine Agent
                  </button>
                </div>
              ) : null}

              <div className="pt-2 border-t border-red-100 space-y-2">
                <p className="text-xs text-red-800 leading-relaxed">
                  Permanently deletes this agent and stops all answering across channels.
                </p>
                <button
                  type="button"
                  disabled={isAnyActionBusy}
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
                      void deleteAgent();
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Trash2 size={13} className="inline mr-1.5" />
                  Delete Agent
                </button>
              </div>
            </div>
          </aside>
        </div>

        {published ? (
          <AgentAnalyticsSection agentId={id} agentMode={agent.mode} />
        ) : null}
      </div>
    </AppShell>
  );
}
