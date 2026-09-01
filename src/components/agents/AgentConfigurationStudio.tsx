'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import { 
  Bot, Sliders, Sparkles, Layers, RefreshCw, Save, CheckCircle, 
  ExternalLink, ShieldCheck, Trash2, Globe, Smartphone, Play, History, Volume2,
  CheckCircle2, AlertTriangle
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { 
  Agent, AgentChannel, AgentConfig, AgentVersion, 
  HandoffMode, PromptTone, ToolMode 
} from '@/lib/types';
import { LanguageCodesField } from '@/components/agents/LanguageCodesField';

interface AgentConfigurationStudioProps {
  agentId: string | null;
  onAgentDeleted?: () => void;
}

const TONES: { value: PromptTone; label: string }[] = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
];

const HANDOFF_MODES: { value: HandoffMode; label: string }[] = [
  { value: 'manual_claim', label: 'Agents claim from a shared queue' },
  { value: 'auto_least_load', label: 'Assign to whoever has fewest chats' },
  { value: 'auto_round_robin', label: 'Round robin' },
];

const TOOL_FEATURES: { key: 'meetings' | 'quotes' | 'whatsapp'; label: string; hint: string }[] = [
  {
    key: 'meetings',
    label: 'Book meetings',
    hint: 'Book, reschedule and cancel meetings on the connected calendar.',
  },
  {
    key: 'quotes',
    label: 'Send quotations',
    hint: 'Draft quotations from your catalog. Approval mode is set in Automation Controls.',
  },
  {
    key: 'whatsapp',
    label: 'Reply on WhatsApp',
    hint: 'Answer on the connected WhatsApp number, subject to the WhatsApp channel toggle.',
  },
];

const TOOL_MODE_LABELS: Record<ToolMode, string> = {
  off: 'Off — do not touch this capability',
  human: 'Human — prepare and wait for your approval',
  ai: 'AI — act autonomously (subject to caps)',
};

const TOOL_MODES: ToolMode[] = ['ai', 'human', 'off'];

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

export function AgentConfigurationStudio({ agentId, onAgentDeleted }: AgentConfigurationStudioProps) {
  const { toast, success: toastSuccess, error: toastError } = useToast();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [channels, setChannels] = useState<AgentChannel[]>([]);
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishingVersionId, setPublishingVersionId] = useState<string | null>(null);
  const [togglingChannelId, setTogglingChannelId] = useState<string | null>(null);
  const [patching, setPatching] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Guided vs Raw form state
  const [promptMode, setPromptMode] = useState<'guided' | 'raw'>('guided');
  const [rawPrompt, setRawPrompt] = useState<string>('');
  const [welcomeMessage, setWelcomeMessage] = useState<string>('Hi! How can I help you today?');
  const [fallbackMessage, setFallbackMessage] = useState<string>("I don't have that in my knowledge base yet — drop your email and our team will follow up!");
  const [languages, setLanguages] = useState<string>('en');
  const [rawPromptEntitled, setRawPromptEntitled] = useState<boolean>(false);

  const isAnyActionBusy = savingDraft || publishingVersionId !== null || togglingChannelId !== null || patching;

  const load = useCallback(async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [a, vs, chs, entRes] = await Promise.all([
        apiRequest<Agent>(`/v1/agents/${agentId}`),
        apiRequest<AgentVersion[]>(`/v1/agents/${agentId}/versions`),
        apiRequest<AgentChannel[]>(`/v1/agents/${agentId}/channels`),
        apiRequest<{ features?: Record<string, boolean> }>('/v1/entitlements').catch(() => null),
      ]);

      setAgent(a);
      setVersions(Array.isArray(vs) ? vs : []);
      setChannels(Array.isArray(chs) ? chs : []);

      const isEntitled = Boolean(entRes?.features?.raw_prompt);
      setRawPromptEntitled(isEntitled);

      const current = vs.find((v) => v.id === a.current_version_id) || vs[0];
      const cfg = current?.config || emptyConfig(a.agent_name || '');
      setConfig(cfg);
      setPromptMode(cfg.prompt_mode || 'guided');
      setRawPrompt(cfg.raw_prompt || '');
      setWelcomeMessage(
        cfg.guided?.welcome_message || cfg.messages?.kb_miss_fallback || 'Hi! How can I help you today?'
      );
      setFallbackMessage(
        cfg.guided?.fallback_message ||
          cfg.messages?.kb_miss_fallback ||
          "I don't have that in my knowledge base yet — drop your email and our team will follow up!"
      );
      setLanguages(cfg.guided?.languages?.join(', ') || 'en');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Could not load this agent');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

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

  async function saveDraft(e: FormEvent) {
    e.preventDefault();
    if (!config || !agentId) return;
    setSavingDraft(true);
    setError(null);
    setNotice(null);

    const langList = languages
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);

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
      const version = await apiRequest<AgentVersion>(`/v1/agents/${agentId}/versions`, {
        method: 'POST',
        body: payload,
      });
      toastSuccess(`Saved as draft version v${version.version_number}`);
      setNotice(
        `Saved as version ${version.version_number}. It is a DRAFT — visitors still get ` +
          `${agent?.current_version_id ? 'the live version' : 'the active configuration'} until you publish it.`
      );
      await load();
    } catch (err: any) {
      toastError(err instanceof Error ? err.message : 'Could not save version');
      setError(err instanceof Error ? err.message : 'Could not save version');
    } finally {
      setSavingDraft(false);
    }
  }

  async function publish(versionId: string, isRollback: boolean) {
    if (!agentId) return;
    setPublishingVersionId(versionId);
    setError(null);
    setNotice(null);
    try {
      if (isRollback) {
        await apiRequest<Agent>(`/v1/agents/${agentId}/versions/${versionId}/rollback`, {
          method: 'POST',
        });
        toastSuccess('Rolled back to selected version');
      } else {
        await apiRequest<Agent>(`/v1/agents/${agentId}/versions/${versionId}/publish`, {
          method: 'POST',
        });
        toastSuccess('Published live version successfully!');
      }
      setNotice(
        isRollback
          ? 'Rolled back. Visitors will receive this version from their next message.'
          : 'Published. Visitors will receive this version immediately.'
      );
      await load();
    } catch (err: any) {
      toastError(err instanceof Error ? err.message : 'Could not publish');
      setError(err instanceof Error ? err.message : 'Could not publish');
    } finally {
      setPublishingVersionId(null);
    }
  }

  async function patchAgent(body: Record<string, unknown>) {
    if (!agentId) return;
    setPatching(true);
    setError(null);
    try {
      await apiRequest<Agent>(`/v1/agents/${agentId}`, { method: 'PATCH', body });
      toastSuccess('Agent updated');
      await load();
    } catch (err: any) {
      toastError(err instanceof Error ? err.message : 'Could not update the agent');
      setError(err instanceof Error ? err.message : 'Could not update the agent');
    } finally {
      setPatching(false);
    }
  }

  async function toggleChannel(channel: AgentChannel) {
    if (!agentId) return;
    setTogglingChannelId(channel.id);
    setError(null);
    try {
      await apiRequest<AgentChannel>(`/v1/agents/${agentId}/channels/${channel.channel}`, {
        method: 'PATCH',
        body: { enabled: !channel.enabled },
      });
      toastSuccess(`Channel ${channel.channel} ${channel.enabled ? 'disabled' : 'enabled'}`);
      setNotice(
        channel.enabled
          ? 'Channel disabled. The agent stops answering there immediately.'
          : 'Channel enabled.'
      );
      await load();
    } catch (err: any) {
      toastError(err instanceof Error ? err.message : 'Could not change that channel');
      setError(err instanceof Error ? err.message : 'Could not change that channel');
    } finally {
      setTogglingChannelId(null);
    }
  }

  async function handleDeleteAgent() {
    if (!agentId) return;
    setPatching(true);
    try {
      await apiRequest(`/v1/agents/${agentId}`, { method: 'DELETE' });
      toastSuccess('Agent deleted');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('frosty:agents-changed'));
      }
      if (onAgentDeleted) {
        onAgentDeleted();
      }
    } catch (err: any) {
      toastError(err instanceof Error ? err.message : 'Could not delete agent');
    } finally {
      setPatching(false);
      setDeleteOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
        <RefreshCw size={18} className="animate-spin text-[#0396A6]" />
        <span className="text-sm font-semibold">Loading agent configuration studio...</span>
      </div>
    );
  }

  if (!agent || !config) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-border text-center space-y-3">
        <Bot size={36} className="mx-auto text-muted-foreground/50" />
        <h3 className="text-sm font-bold text-foreground">No agent selected</h3>
        <p className="text-xs text-muted-foreground">Select an agent from the multi-agent selector above to configure.</p>
      </div>
    );
  }

  const published = versions.find((v) => v.id === agent.current_version_id);
  const latest = versions[0];
  const hasUnpublishedDraft = Boolean(latest && latest.id !== agent.current_version_id);

  return (
    <div className="h-full flex flex-col min-h-0 space-y-4 pb-2">
      {/* Notice Banner */}
      {notice && (
        <div className="shrink-0 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="shrink-0 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2 shadow-2xs">
          <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch overflow-y-auto lg:overflow-hidden no-scrollbar pr-0.5">
        {/* Left Column: Main Configuration Form (8 cols) */}
        <form
          onSubmit={saveDraft}
          className="lg:col-span-8 bg-white border border-border rounded-2xl p-4 sm:p-6 shadow-2xs space-y-6 lg:h-full lg:overflow-y-auto no-scrollbar lg:pr-4"
        >
          {/* Header & Prompt Mode Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
            <div>
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Sliders size={18} className="text-[#0396A6]" />
                Agent Configuration Studio
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure prompt instructions, versioning, voice synthesis, and platform tools.
              </p>
            </div>

            {rawPromptEntitled ? (
              <div className="inline-flex p-1 bg-white rounded-xl border-[1.5px] border-[#0396A6]/35 text-xs shrink-0 self-start sm:self-auto shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPromptMode('guided')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all border ${
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
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all border ${
                    promptMode === 'raw'
                      ? 'bg-[#0396A6] text-white border-[#0396A6] shadow-xs'
                      : 'bg-white text-[#0396A6] border-[#0396A6]/30 hover:border-[#0396A6]/60 hover:bg-[#0396A6]/5'
                  }`}
                >
                  Raw Mode
                </button>
              </div>
            ) : null}
          </div>

          {/* Mode 1: Raw Prompt Mode */}
          {promptMode === 'raw' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-800 flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Platform Safety Guardrail:</span> Platform guardrails are automatically wrapped around your raw instructions first and cannot be bypassed.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                  System Instructions (Raw)
                </label>
                <textarea
                  value={rawPrompt}
                  maxLength={4000}
                  rows={10}
                  onChange={(e) => setRawPrompt(e.target.value)}
                  placeholder="Write your custom free-text system instructions here..."
                  className="w-full bg-muted/10 border border-border rounded-xl p-3.5 text-xs text-foreground font-mono leading-relaxed outline-none focus:border-[#0396A6] focus:ring-1 focus:ring-[#0396A6] resize-none"
                />
                <div className="text-[10px] text-muted-foreground text-right">{rawPrompt.length} / 4000 characters</div>
              </div>
            </div>
          ) : (
            /* Mode 2: Guided Mode */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                    Name It Uses with Customers
                  </label>
                  <input
                    type="text"
                    value={config.persona.agent_name}
                    onChange={(e) => setPersona('agent_name', e.target.value)}
                    className="w-full bg-muted/10 border border-border rounded-xl px-3.5 py-2 text-xs text-foreground outline-none focus:border-[#0396A6]"
                    placeholder="e.g. Frosty Assistant"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                    Conversational Tone
                  </label>
                  <Select
                    value={config.persona.tone}
                    onChange={(val) => setPersona('tone', val as PromptTone)}
                    options={TONES.map((t) => ({ value: t.value, label: t.label }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                  Languages (Comma-separated ISO codes)
                </label>
                <LanguageCodesField value={languages} onChange={setLanguages} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                  About the Business & Goals
                </label>
                <textarea
                  value={config.persona.business_info}
                  maxLength={4000}
                  rows={4}
                  onChange={(e) => setPersona('business_info', e.target.value)}
                  placeholder="What you sell, who you sell it to, anything a new hire would need on day one."
                  className="w-full bg-muted/10 border border-border rounded-xl p-3.5 text-xs text-foreground leading-relaxed outline-none focus:border-[#0396A6] resize-none"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Context, not knowledge. Document facts and FAQs belong in Knowledge Base.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                    Welcome Greeting
                  </label>
                  <textarea
                    value={welcomeMessage}
                    maxLength={4000}
                    rows={2}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Welcome message sent when a customer starts a chat."
                    className="w-full bg-muted/10 border border-border rounded-xl p-3 text-xs text-foreground leading-relaxed outline-none focus:border-[#0396A6] resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                    Fallback Message
                  </label>
                  <textarea
                    value={fallbackMessage}
                    maxLength={4000}
                    rows={2}
                    onChange={(e) => setFallbackMessage(e.target.value)}
                    placeholder="Fallback message when knowledge base has no answer."
                    className="w-full bg-muted/10 border border-border rounded-xl p-3 text-xs text-foreground leading-relaxed outline-none focus:border-[#0396A6] resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                    Always Do (Guidelines)
                  </label>
                  <textarea
                    value={config.persona.dos.join('\n')}
                    rows={3}
                    onChange={(e) =>
                      setPersona(
                        'dos',
                        e.target.value.split('\n').map((l) => l.slice(0, 200)).slice(0, 30)
                      )
                    }
                    placeholder="One per line. e.g. Offer a callback when someone asks about pricing."
                    className="w-full bg-muted/10 border border-border rounded-xl p-3 text-xs text-foreground leading-relaxed outline-none focus:border-[#0396A6] resize-none"
                  />
                  <span className="text-[10px] text-muted-foreground block">Up to 30 lines, 200 characters each.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                    Never Do (Restrictions)
                  </label>
                  <textarea
                    value={config.persona.donts.join('\n')}
                    rows={3}
                    onChange={(e) =>
                      setPersona(
                        'donts',
                        e.target.value.split('\n').map((l) => l.slice(0, 200)).slice(0, 30)
                      )
                    }
                    placeholder="One per line. e.g. Never quote a discount without manager approval."
                    className="w-full bg-muted/10 border border-border rounded-xl p-3 text-xs text-foreground leading-relaxed outline-none focus:border-[#0396A6] resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Capabilities & Tools Override */}
          <div className="pt-4 border-t border-border/60 space-y-4">
            <div>
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Agent Capabilities & Tools</h3>
              <p className="text-[11px] text-muted-foreground">Override workspace tool behaviors for this specific agent version.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TOOL_FEATURES.map(({ key, label, hint }) => {
                const entry = config.tools?.[key] ?? {};
                const inherit = entry.use_merchant_default !== false;
                const mode = (inherit ? 'ai' : entry.mode ?? 'ai') as ToolMode;
                return (
                  <div key={key} className="p-3 bg-muted/20 border border-border/70 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{label}</span>
                      <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inherit}
                          onChange={(e) =>
                            setToolField(key, {
                              use_merchant_default: e.target.checked,
                              ...(e.target.checked ? {} : { mode: entry.mode ?? 'ai' }),
                            })
                          }
                          className="rounded border-border text-[#0396A6] focus:ring-[#0396A6]"
                        />
                        <span>Default</span>
                      </label>
                    </div>

                    {!inherit ? (
                      <Select
                        value={mode}
                        onChange={(val) => setToolField(key, { mode: val as ToolMode, use_merchant_default: false })}
                        options={TOOL_MODES.map((m) => ({ value: m, label: TOOL_MODE_LABELS[m] }))}
                      />
                    ) : (
                      <div className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                        Using Workspace Default
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground leading-tight">{hint}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice & Speech Synthesis */}
          <div className="pt-4 border-t border-border/60 space-y-4">
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-[#0396A6]" />
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Voice & Neural Speech</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                  Voice Reply Mode
                </label>
                <Select
                  value={config.voice?.reply_mode ?? 'off'}
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
                  options={[
                    { value: 'off', label: 'Off — Text replies only' },
                    { value: 'auto', label: 'Auto — Voice reply when visitor sends audio' },
                    { value: 'on', label: 'On — Always reply with voice and text' },
                  ]}
                />
              </div>

              {config.voice?.reply_mode && config.voice.reply_mode !== 'off' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                    Preferred Voice Tone / Variant
                  </label>
                  <Select
                    value={config.voice?.voice_name ?? 'en-IN-Chirp3-HD-Aoede'}
                    onChange={(val) =>
                      setConfig((c) =>
                        c
                          ? {
                              ...c,
                              voice: {
                                ...c.voice,
                                voice_name: val,
                              },
                            }
                          : c
                      )
                    }
                    options={[
                      { value: 'en-IN-Chirp3-HD-Aoede', label: 'Aoede (English - Indian / Warm & Professional)' },
                      { value: 'hi-IN-Chirp3-HD-Aoede', label: 'Aoede (Hindi / Natural & Expressive)' },
                      { value: 'ta-IN-Chirp3-HD-Aoede', label: 'Aoede (Tamil / Clear & Articulate)' },
                      { value: 'te-IN-Chirp3-HD-Aoede', label: 'Aoede (Telugu / Friendly & Natural)' },
                      { value: 'bn-IN-Chirp3-HD-Aoede', label: 'Aoede (Bengali / Warm & Engaging)' },
                    ]}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Idle Timeout */}
          <div className="pt-4 border-t border-border/60 space-y-2">
            <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider block">
              Human Idle Timeout (Minutes)
            </label>
            <input
              type="number"
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
                          agent_idle_timeout_minutes: Math.min(
                            30,
                            Math.max(2, Number(e.target.value) || 5)
                          ),
                        },
                      }
                    : c
                )
              }
              className="w-32 bg-muted/10 border border-border rounded-xl px-3.5 py-2 text-xs text-foreground outline-none focus:border-[#0396A6]"
            />
            <p className="text-[10px] text-muted-foreground">
              If an assigned teammate does not reply within this duration, Frosty automatically resumes AI assistance.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border/60 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isAnyActionBusy}
              className="px-5 py-2.5 bg-[#0396A6] hover:bg-[#028391] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {savingDraft ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Save as Draft</span>
            </button>

            {hasUnpublishedDraft && latest ? (
              <button
                type="button"
                disabled={isAnyActionBusy}
                onClick={() => void publish(latest.id, false)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {publishingVersionId === latest.id ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                <span>Publish Version v{latest.version_number}</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="px-4 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-all ml-auto flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              <span>Delete Agent</span>
            </button>
          </div>
        </form>

        {/* Right Column: Live Traffic, Channels & Versions (4 cols) */}
        <div className="lg:col-span-4 space-y-6 lg:h-full lg:overflow-y-auto no-scrollbar lg:pr-2 pb-6 lg:pb-0">
          {/* Card 1: Live Traffic & Handoff Routing */}
          <div className="bg-white border border-border rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Play size={14} className="text-[#0396A6]" />
              Live Traffic & Routing
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Control how customer conversations are assigned when handed off to human team members.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Handoff Routing</label>
              <Select
                value={agent.handoff_mode}
                disabled={patching}
                onChange={(val) => void patchAgent({ handoff_mode: val })}
                options={HANDOFF_MODES.map((m) => ({ value: m.value, label: m.label }))}
              />
            </div>
          </div>

          {/* Card 2: Channels */}
          <div className="bg-white border border-border rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Globe size={14} className="text-[#0396A6]" />
              Bound Channels
            </h3>
            {!channels.length ? (
              <p className="text-[11px] text-muted-foreground">No channels bound to this agent.</p>
            ) : (
              <div className="space-y-2">
                {channels.map((c) => (
                  <div key={c.id} className="p-3 bg-muted/20 border border-border/60 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {c.channel === 'whatsapp' ? <Smartphone size={14} className="text-emerald-600" /> : <Globe size={14} className="text-[#0396A6]" />}
                      <div>
                        <div className="text-xs font-extrabold text-foreground uppercase">{c.channel}</div>
                        <div className={`text-[10px] font-bold ${c.enabled ? 'text-emerald-600' : 'text-zinc-500'}`}>
                          {c.enabled ? '● Active Live' : '○ Paused'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAnyActionBusy}
                      onClick={() => void toggleChannel(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        c.enabled
                          ? 'border border-border text-foreground hover:bg-muted/40'
                          : 'bg-[#0396A6] text-white hover:bg-[#028391]'
                      }`}
                    >
                      {togglingChannelId === c.id ? (
                        <RefreshCw size={11} className="animate-spin" />
                      ) : c.enabled ? (
                        'Disable'
                      ) : (
                        'Enable'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: Versions History */}
          <div className="bg-white border border-border rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <History size={14} className="text-[#0396A6]" />
                Version History
              </h3>
              <Link href={`/agents/${agentId}/versions`} className="text-[11px] font-bold text-[#0396A6] hover:underline flex items-center gap-1">
                <span>All</span>
                <ExternalLink size={10} />
              </Link>
            </div>

            {!versions.length ? (
              <p className="text-[11px] text-muted-foreground">No versions saved yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar pr-1">
                {versions.map((v) => {
                  const isLive = v.id === agent.current_version_id;
                  const modeTag = v.prompt_mode || v.config?.prompt_mode || 'guided';
                  return (
                    <div key={v.id} className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${isLive ? 'bg-emerald-50/50 border-emerald-200' : 'bg-muted/10 border-border/50'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-foreground">v{v.version_number}</span>
                        <span className="text-[9px] font-extrabold uppercase text-muted-foreground">
                          {modeTag}
                        </span>
                        {isLive && (
                          <span className="text-[9px] font-extrabold uppercase text-emerald-600">
                            Live
                          </span>
                        )}
                      </div>

                      {!isLive && (
                        <button
                          type="button"
                          disabled={isAnyActionBusy}
                          onClick={() => void publish(v.id, true)}
                          className="text-[10px] font-extrabold text-[#0396A6] hover:underline px-2 py-1"
                        >
                          Rollback
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteOpen && (
        <ConfirmModal
          title="Delete Agent"
          description="Are you sure you want to delete this agent? This cannot be undone."
          confirmText="Delete Agent"
          tone="danger"
          isOpen={deleteOpen}
          onConfirm={() => void handleDeleteAgent()}
          onClose={() => setDeleteOpen(false)}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}
