'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe, Smartphone, Layers, ShieldCheck, ArrowRight, Bot, Database,
  CheckCircle2, Sparkles, RefreshCw, Lock, ExternalLink, FlaskConical,
  Save, CheckCircle, Plus, Trash2, FileText, Sliders
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { Agent, AgentConfig, AgentVersion, WaAccount, KbSource } from '@/lib/types';
import { WebsiteKnowledgeTab } from '@/components/website/WebsiteKnowledgeTab';
import { SandboxTab } from '@/components/website/tabs/SandboxTab';
import { UsageLogsTab } from '@/components/website/tabs/UsageLogsTab';
import { AgentConfigurationStudio } from '@/components/agents/AgentConfigurationStudio';
import { LanguageCodesField } from '@/components/agents/LanguageCodesField';

const SETTINGS_SUBTABS = [
  { id: 'persona', label: 'Agent Personality', icon: Bot },
  { id: 'knowledge', label: 'Knowledge Base', icon: Database },
  { id: 'overview', label: 'Orchestration Overview', icon: Layers },
  { id: 'sandbox', label: 'Sandbox', icon: FlaskConical },
  { id: 'logs', label: 'Usage & Logs', icon: FileText },
  { id: 'config', label: 'Configuration', icon: Sliders },
] as const;

type SubTabId = typeof SETTINGS_SUBTABS[number]['id'];

interface UnifiedSettingsTabProps {
  unifiedAgentId?: string | null;
  onViewChat?: (conversationId: string) => void;
  onAgentDeleted?: () => void;
}

export function UnifiedSettingsTab({ unifiedAgentId, onViewChat, onAgentDeleted }: UnifiedSettingsTabProps = {}) {
  const router = useRouter();
  const { toast, success: toastSuccess, error: toastError } = useToast();
  const [activeSettingTab, setActiveSettingTab] = useState<SubTabId>('persona');

  const [loading, setLoading] = useState(true);
  const [unifiedAgent, setUnifiedAgent] = useState<Agent | null>(null);
  const [webAgent, setWebAgent] = useState<Agent | null>(null);
  const [waAgent, setWaAgent] = useState<Agent | null>(null);
  const [webConfig, setWebConfig] = useState<AgentConfig | null>(null);
  const [waConfig, setWaConfig] = useState<AgentConfig | null>(null);
  const [waAccounts, setWaAccounts] = useState<WaAccount[]>([]);
  const [webKbCount, setWebKbCount] = useState<number>(0);
  const [waKbCount, setWaKbCount] = useState<number>(0);

  // ── Personality & Configuration State for Unified Agent ──
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [cfg, setCfg] = useState({
    bot_name: '',
    persona: '',
    tone: 'friendly',
    language: 'en',
    welcome_message: '',
    fallback_message: '',
    dos: [] as string[],
    donts: [] as string[],
  });
  const [newDo, setNewDo] = useState('');
  const [newDont, setNewDont] = useState('');
  const [rawConfig, setRawConfig] = useState<AgentConfig | null>(null);
  const [publishedVersionId, setPublishedVersionId] = useState<string | null>(null);
  const [latestVersionId, setLatestVersionId] = useState<string | null>(null);
  const [configNotice, setConfigNotice] = useState<string | null>(null);
  const [isSavingCfg, setIsSavingCfg] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [decombineOpen, setDecombineOpen] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const agents = await apiRequest<Agent[]>('/v1/agents');
      let uni: Agent | null | undefined = null;
      if (unifiedAgentId) {
        uni = agents.find(a => a.id === unifiedAgentId);
      }
      if (!uni) {
        uni = agents.find((a) => a.mode === 'unified');
      }
      if (!uni) {
        try {
          uni = await apiRequest<Agent>('/v1/agents', {
            method: 'POST',
            body: { agent_name: 'Unified Agent', mode: 'unified' }
          });
        } catch {
          uni = null;
        }
      }

      const web = agents.find((a) => a.mode === 'website') || null;
      const wa = agents.find((a) => a.mode === 'whatsapp') || null;

      setUnifiedAgent(uni ?? null);
      setWebAgent(web);
      setWaAgent(wa);

      if (uni) {
        setPublishedVersionId(uni.current_version_id || null);
        try {
          const versions = await apiRequest<AgentVersion[]>(`/v1/agents/${uni.id}/versions`);
          const latest = Array.isArray(versions) ? versions[0] : null;
          setLatestVersionId(latest?.id || null);
          const config = latest?.config;
          if (config) {
            setRawConfig(config);
            setCfg({
              bot_name: config.persona?.agent_name || uni.agent_name || 'Frosty',
              persona: config.persona?.business_info || '',
              tone: config.persona?.tone || 'friendly',
              language: config.guided?.languages?.join(', ') || 'en',
              welcome_message: config.guided?.welcome_message || 'Hi! How can I help you today?',
              fallback_message: config.guided?.fallback_message || "I don't have that in my knowledge base yet - drop your email and our team will follow up!",
              dos: config.persona?.dos || [],
              donts: config.persona?.donts || [],
            });
          } else {
            setCfg((prev) => ({ ...prev, bot_name: uni.agent_name || 'Frosty' }));
          }
        } catch (err) {
          console.error('Failed to load unified agent versions', err);
        }
      }

      const promises: Promise<any>[] = [];

      if (web) {
        promises.push(
          apiRequest<any>(`/v1/agents/${web.id}/versions/latest`)
            .then((res) => setWebConfig(res?.config ?? null))
            .catch(() => setWebConfig(null))
        );
        promises.push(
          apiRequest<KbSource[]>(`/v1/agents/${web.id}/kb/sources`)
            .then((res) => setWebKbCount(Array.isArray(res) ? res.length : 0))
            .catch(() => setWebKbCount(0))
        );
      }

      if (wa) {
        promises.push(
          apiRequest<any>(`/v1/agents/${wa.id}/versions/latest`)
            .then((res) => setWaConfig(res?.config ?? null))
            .catch(() => setWaConfig(null))
        );
        promises.push(
          apiRequest<KbSource[]>(`/v1/agents/${wa.id}/kb/sources`)
            .then((res) => setWaKbCount(Array.isArray(res) ? res.length : 0))
            .catch(() => setWaKbCount(0))
        );
      }

      promises.push(
        apiRequest<WaAccount[]>('/v1/wa/accounts')
          .then((res) => setWaAccounts(Array.isArray(res) ? res : []))
          .catch(() => setWaAccounts([]))
      );

      await Promise.allSettled(promises);
    } catch (e) {
      console.error('Failed to load Unified overview', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleSaveConfig = async () => {
    if (!unifiedAgent) {
      toastError('No active Unified Agent found. Please refresh the page.');
      return;
    }
    setIsSavingCfg(true);
    setConfigNotice(null);
    try {
      await apiRequest(`/v1/agents/${unifiedAgent.id}`, {
        method: 'PATCH',
        body: { agent_name: cfg.bot_name },
      });

      const langList = cfg.language
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const payload: AgentConfig = rawConfig
        ? {
            ...rawConfig,
            guided: {
              ...rawConfig.guided,
              persona: cfg.persona || cfg.bot_name || 'Frosty',
              tone: cfg.tone as any,
              languages: langList.length > 0 ? langList : ['en'],
              welcome_message: cfg.welcome_message || 'Hi! How can I help you today?',
              fallback_message: cfg.fallback_message || "I don't have that in my knowledge base yet.",
            },
            persona: {
              ...rawConfig.persona,
              agent_name: cfg.bot_name || 'Frosty',
              tone: cfg.tone as any,
              business_info: cfg.persona || '',
              dos: cfg.dos || [],
              donts: cfg.donts || [],
            },
            messages: {
              ...rawConfig.messages,
              kb_miss_fallback: cfg.fallback_message || '',
            },
          }
        : {
            prompt_mode: 'guided',
            guided: {
              persona: cfg.persona || cfg.bot_name || 'Frosty',
              tone: cfg.tone as any,
              languages: langList.length > 0 ? langList : ['en'],
              welcome_message: cfg.welcome_message || 'Hi! How can I help you today?',
              fallback_message: cfg.fallback_message || "I don't have that in my knowledge base yet.",
              business_hours: {},
            },
            raw_prompt: null,
            persona: {
              agent_name: cfg.bot_name || 'Frosty',
              tone: cfg.tone as any,
              business_info: cfg.persona || '',
              dos: cfg.dos || [],
              donts: cfg.donts || [],
            },
            model: { model_id: 'gemini-1.5-flash' },
            generation: { temperature: 0.3, max_output_tokens: 1024 },
            rag: { tau: 0.4, top_k: 6, mode: 'lenient' },
            tools: {},
            handoff: { agent_idle_timeout_minutes: 5, on_agent_idle: 'resume_frosty_agent' },
            messages: {
              kb_miss_fallback: cfg.fallback_message || '',
              capacity_fallback: '',
              pace_fallback: '',
            },
          };

      const version = await apiRequest<AgentVersion>(`/v1/agents/${unifiedAgent.id}/versions`, {
        method: 'POST',
        body: payload,
      });

      setLatestVersionId(version.id);
      setConfigNotice(`Draft version v${version.version_number} saved!`);
      toastSuccess(`Draft saved as version v${version.version_number}.`);
      setRawConfig(payload);
    } catch (e: any) {
      console.error('Save config error', e);
      toastError('Could not save: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsSavingCfg(false);
    }
  };

  const handlePublish = async () => {
    if (!unifiedAgent || !latestVersionId) return;
    setIsPublishing(true);
    try {
      await apiRequest(`/v1/agents/${unifiedAgent.id}/publish`, {
        method: 'POST',
        body: { version_id: latestVersionId },
      });
      setPublishedVersionId(latestVersionId);
      toastSuccess('Agent version successfully published and live!');
    } catch (e: any) {
      console.error('Publish error', e);
      toastError('Publish failed: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDecombine = async () => {
    if (!unifiedAgent) return;
    try {
      await apiRequest(`/v1/agents/${unifiedAgent.id}/decombine`, { method: 'POST' });
      toastSuccess('Unified agent retired. Website and WhatsApp bots are unchanged.');
      setDecombineOpen(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('frosty:agents-changed'));
      }
      onAgentDeleted?.();
    } catch (e: any) {
      toastError(e?.message || 'Could not decombine this agent');
    }
  };

  const addDo = () => {
    if (newDo.trim()) {
      setCfg((prev) => ({ ...prev, dos: [...prev.dos, newDo.trim()] }));
      setNewDo('');
    }
  };

  const removeDo = (index: number) => {
    setCfg((prev) => ({ ...prev, dos: prev.dos.filter((_, i) => i !== index) }));
  };

  const addDont = () => {
    if (newDont.trim()) {
      setCfg((prev) => ({ ...prev, donts: [...prev.donts, newDont.trim()] }));
      setNewDont('');
    }
  };

  const removeDont = (index: number) => {
    setCfg((prev) => ({ ...prev, donts: prev.donts.filter((_, i) => i !== index) }));
  };

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground animate-in fade-in">
        <RefreshCw size={20} className="animate-spin text-[#0396A6]" />
        Loading Orchestration Settings...
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden h-full space-y-4 animate-in fade-in duration-300">
      {/* Horizontal Settings Pill Navigation Bar */}
      <div className="flex items-center justify-start md:justify-center overflow-x-auto no-scrollbar w-full shrink-0 pb-1 px-2 md:px-0">
        <div className="flex items-center gap-1.5 p-1 rounded-full border border-border bg-muted/20 shadow-2xs w-max">
          {SETTINGS_SUBTABS.map((sub) => {
            const Icon = sub.icon;
            const active = activeSettingTab === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setActiveSettingTab(sub.id)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full transition-all duration-200 whitespace-nowrap text-xs font-bold ${
                  active
                    ? 'bg-[#0396A6] text-white shadow-sm font-extrabold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/60'
                }`}
              >
                <Icon size={15} className={active ? 'text-white' : 'text-muted-foreground'} />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBTAB 1: AGENT PERSONALITY */}
      {activeSettingTab === 'persona' && (
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar workspace-scrollable pr-1 pb-24 md:pb-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Identity Summary Card */}
            <div className="lg:col-span-5 space-y-5">
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight leading-snug">
                  Unified Personality &amp; Identity
                </h2>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Configure default brand name, conversational tone, instructions, and welcome greetings across your unified channels.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-border shadow-xs space-y-5">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-bold shadow-xs border border-[#0396A6]/20">
                    <Bot size={24} />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wider text-[#0396A6] bg-[#0396A6]/10 px-3 py-1 rounded-full border border-[#0396A6]/20 uppercase">
                    {cfg.tone}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">AGENT NAME</span>
                  <h4 className="text-lg font-black text-foreground mt-0.5">{cfg.bot_name || 'Frosty'}</h4>
                  <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5 mt-2">
                    <ShieldCheck size={12} className="text-[#0396A6]" /> Channels: Web Live Chat + WhatsApp
                  </span>
                </div>

                <div className="pt-4 border-t border-border/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Active Version:</span>
                    <span className="font-bold text-[#0396A6]">
                      {publishedVersionId ? 'Live Published' : 'Draft Mode'}
                    </span>
                  </div>
                </div>

                {latestVersionId && latestVersionId !== publishedVersionId && (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {isPublishing ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" /> Publishing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={13} /> Publish Latest Version Live
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-border shadow-xs space-y-5">
              {configNotice && (
                <div className="px-4 py-3 rounded-xl bg-[#0396A6]/10 border border-[#0396A6]/30 text-[#0396A6] text-xs font-semibold">
                  {configNotice}
                </div>
              )}

              {/* Bot Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">BOT NAME</label>
                <input
                  type="text"
                  value={cfg.bot_name}
                  onChange={(e) => setCfg({ ...cfg, bot_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:border-[#0396A6]"
                  placeholder="Frosty"
                />
              </div>

              {/* Tone Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CONVERSATIONAL TONE</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {['professional', 'friendly', 'casual', 'formal', 'enthusiastic'].map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setCfg({ ...cfg, tone })}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all capitalize ${
                        cfg.tone === tone
                          ? 'bg-[#0396A6]/10 border-[#0396A6] text-[#0396A6]'
                          : 'bg-muted/10 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Business Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ABOUT THE BUSINESS &amp; GOALS</label>
                <textarea
                  rows={3}
                  value={cfg.persona}
                  onChange={(e) => setCfg({ ...cfg, persona: e.target.value })}
                  className="w-full p-3 bg-muted/20 border border-border rounded-xl text-xs text-foreground outline-none focus:border-[#0396A6] placeholder:text-muted-foreground resize-none"
                  placeholder="Describe your company, products, target audience, and primary customer goals."
                />
              </div>

              {/* Languages */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">LANGUAGES (comma-separated ISO codes)</label>
                <LanguageCodesField
                  value={cfg.language}
                  onChange={(language) => setCfg({ ...cfg, language })}
                />
              </div>

              {/* Welcome & Fallback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">WELCOME GREETING</label>
                  <textarea
                    rows={2}
                    value={cfg.welcome_message}
                    onChange={(e) => setCfg({ ...cfg, welcome_message: e.target.value })}
                    className="w-full p-2.5 bg-muted/20 border border-border rounded-xl text-xs text-foreground outline-none focus:border-[#0396A6] resize-none"
                    placeholder="Hi! How can I help you today?"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">FALLBACK MESSAGE</label>
                  <textarea
                    rows={2}
                    value={cfg.fallback_message}
                    onChange={(e) => setCfg({ ...cfg, fallback_message: e.target.value })}
                    className="w-full p-2.5 bg-muted/20 border border-border rounded-xl text-xs text-foreground outline-none focus:border-[#0396A6] resize-none"
                    placeholder="I don't have that in my knowledge base yet."
                  />
                </div>
              </div>

              {/* Dos and Don'ts */}
              <div className="space-y-4 pt-2 border-t border-border/50">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">RULES TO FOLLOW (DOs)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDo}
                      onChange={(e) => setNewDo(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDo())}
                      placeholder="e.g. Always offer to schedule a meeting"
                      className="flex-1 px-3 py-2 bg-muted/20 border border-border rounded-xl text-xs outline-none focus:border-[#0396A6]"
                    />
                    <button
                      type="button"
                      onClick={addDo}
                      className="px-3 py-2 bg-[#0396A6]/10 hover:bg-[#0396A6]/20 text-[#0396A6] font-bold text-xs rounded-xl flex items-center gap-1"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  {cfg.dos.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {cfg.dos.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border text-xs">
                          <span>{item}</span>
                          <button type="button" onClick={() => removeDo(idx)} className="text-rose-500 hover:text-rose-700">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">RULES TO AVOID (DONTs)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDont}
                      onChange={(e) => setNewDont(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDont())}
                      placeholder="e.g. Never promise exact delivery dates without confirmation"
                      className="flex-1 px-3 py-2 bg-muted/20 border border-border rounded-xl text-xs outline-none focus:border-[#0396A6]"
                    />
                    <button
                      type="button"
                      onClick={addDont}
                      className="px-3 py-2 bg-[#0396A6]/10 hover:bg-[#0396A6]/20 text-[#0396A6] font-bold text-xs rounded-xl flex items-center gap-1"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  {cfg.donts.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {cfg.donts.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border text-xs">
                          <span>{item}</span>
                          <button type="button" onClick={() => removeDont(idx)} className="text-rose-500 hover:text-rose-700">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isSavingCfg}
                className="w-full py-3.5 bg-[#0396A6] hover:bg-[#02808E] text-white rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSavingCfg ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Saving Configuration...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save Draft
                  </>
                )}
              </button>
              {unifiedAgent ? (
                <button
                  type="button"
                  onClick={() => setDecombineOpen(true)}
                  className="w-full py-3 border border-red-200 text-red-600 rounded-xl font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-red-50"
                >
                  <Trash2 size={14} /> Decombine Unified
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: KNOWLEDGE BASE */}
      {activeSettingTab === 'knowledge' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden h-full">
          <WebsiteKnowledgeTab webAgentId={unifiedAgent?.id ?? null} />
        </div>
      )}

      {/* SUBTAB 3: ORCHESTRATION OVERVIEW */}
      {activeSettingTab === 'overview' && (
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar workspace-scrollable pr-1 pb-24 md:pb-6 space-y-5 max-w-7xl mx-auto w-full">
          {/* Header Summary Banner */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-bold shrink-0 shadow-2xs border border-[#0396A6]/20">
                <Layers size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                    Unified Multi-Channel Hub
                  </h2>
                  <span className="text-[10px] font-extrabold tracking-wider text-[#0396A6] bg-[#0396A6]/10 px-2.5 py-0.5 rounded-full border border-[#0396A6]/20 uppercase">
                    Active Orchestration
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  Central coordination for Website Live Chat and WhatsApp Cloud API. Core agent personalities, knowledge bases, and tools can also be customized directly per channel.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 bg-muted/20 px-3.5 py-2 rounded-xl border border-border/60 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground font-medium">Status:</span>
              <span className="font-bold text-emerald-600">Synchronized</span>
            </div>
          </div>

          {/* Balanced 2-Column Section for Web Agent & WA Agent */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Web Agent Card */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-border shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-bold border border-[#0396A6]/20 shrink-0">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Web Agent Configuration</h3>
                      <p className="text-[11px] text-muted-foreground">Website Live Chat Widget</p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                      webAgent?.is_active
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : 'bg-muted/40 text-muted-foreground border-border'
                    }`}
                  >
                    {webAgent?.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Bot Name:</span>
                    <span className="font-bold text-foreground">{webConfig?.persona?.agent_name || webAgent?.agent_name || 'Frosty'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Conversational Tone:</span>
                    <span className="font-bold text-foreground capitalize">{(webConfig?.persona?.tone || 'Friendly').toLowerCase()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Knowledge Base:</span>
                    <span className="font-bold text-foreground">{webKbCount} Source{webKbCount === 1 ? '' : 's'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Primary Language:</span>
                    <span className="font-bold text-foreground">{webConfig?.guided?.languages?.[0] || 'English'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Managed In:</span>
                    <span className="font-semibold text-[#0396A6] flex items-center gap-1">
                      <Lock size={11} /> Web Agent Workspace
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/website?tab=settings')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0396A6] text-white text-xs font-bold hover:bg-[#02808E] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Manage Web Agent Settings</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* WA Agent Card */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-border shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold border border-emerald-500/20 shrink-0">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">WA Agent Configuration</h3>
                      <p className="text-[11px] text-muted-foreground">Meta WhatsApp Cloud API</p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                      waAccounts.length > 0 && waAgent?.is_active
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : 'bg-muted/40 text-muted-foreground border-border'
                    }`}
                  >
                    {waAccounts.length > 0 && waAgent?.is_active ? 'Connected' : waAgent?.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Bot Name:</span>
                    <span className="font-bold text-foreground">{waConfig?.persona?.agent_name || waAgent?.agent_name || 'Frosty'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Connected Phone:</span>
                    <span className="font-bold text-foreground">{waAccounts[0]?.phone_number || (waAccounts.length > 0 ? 'Connected' : 'Not Linked')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Knowledge Base:</span>
                    <span className="font-bold text-foreground">{waKbCount} Source{waKbCount === 1 ? '' : 's'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Conversational Tone:</span>
                    <span className="font-bold text-foreground capitalize">{(waConfig?.persona?.tone || 'Friendly').toLowerCase()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Managed In:</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <Lock size={11} /> WA Agent Workspace
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/whatsapp?tab=settings')}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Manage WA Agent Settings</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Bottom Card: Cross-Channel Orchestration Rules */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-border shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#0396A6]" />
              <h3 className="text-sm font-bold text-foreground">Cross-Channel Orchestration Rules & Sync</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Customer interactions, lead capture, and appointment scheduling are automatically consolidated across all active channels.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              <div className="p-4 rounded-xl bg-muted/20 border border-border/80 text-xs space-y-1.5">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#0396A6]" /> Shared Lead Capture
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Leads from Website and WhatsApp flow directly into the unified CRM with automatic origin tags.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-muted/20 border border-border/80 text-xs space-y-1.5">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#0396A6]" /> Unified Inbox
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Monitor conversations in real-time with single-click manual takeover from AI to Human agents.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-muted/20 border border-border/80 text-xs space-y-1.5">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#0396A6]" /> Master Calendar
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Slot booking prevents double-booking across channels against your connected master calendar.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: SANDBOX */}
      {activeSettingTab === 'sandbox' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden h-full">
          <SandboxTab agentId={unifiedAgent?.id ?? null} preferMode="unified" channelLabel="unified agent" />
        </div>
      )}

      {/* SUBTAB 5: USAGE & LOGS */}
      {activeSettingTab === 'logs' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden h-full">
          <UsageLogsTab agentId={unifiedAgent?.id ?? null} channel="unified" onViewChat={onViewChat} />
        </div>
      )}

      {/* SUBTAB 6: CONFIGURATION STUDIO */}
      {activeSettingTab === 'config' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto h-full">
          <AgentConfigurationStudio agentId={unifiedAgent?.id ?? null} onAgentDeleted={onAgentDeleted} />
        </div>
      )}
      <ConfirmModal
        isOpen={decombineOpen}
        title="Decombine Unified?"
        description="Retires only this Unified agent. Website and WhatsApp bots stay as they are."
        confirmText="Decombine"
        tone="danger"
        onConfirm={() => void handleDecombine()}
        onClose={() => setDecombineOpen(false)}
      />
    </div>
  );
}
