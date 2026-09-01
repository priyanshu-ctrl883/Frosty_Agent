'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Smartphone, Bot, Database, Save, CheckCircle, ShieldCheck,
  RefreshCw, Copy, Check, ExternalLink, Globe,   FlaskConical, FileText, Trash2,
  Sliders
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { AgentConfig, Agent, AgentVersion } from '@/lib/types';
import { WhatsAppConnectionView } from '@/components/whatsapp/WhatsAppConnectionView';
import { WebsiteKnowledgeTab } from '@/components/website/WebsiteKnowledgeTab';
import { SandboxTab } from '@/components/website/tabs/SandboxTab';
import { UsageLogsTab } from '@/components/website/tabs/UsageLogsTab';
import { AgentConfigurationStudio } from '@/components/agents/AgentConfigurationStudio';
import { LanguageCodesField } from '@/components/agents/LanguageCodesField';

interface WhatsAppSettingsTabProps {
  tenantId: string;
  waAgentId?: string | null;
  initialSettingSubTab?: 'persona' | 'knowledge' | 'connection' | 'sandbox' | 'logs' | 'config';
  onViewChat?: (conversationId: string) => void;
  onAgentDeleted?: () => void;
}

const SETTINGS_SUBTABS = [
  { id: 'persona', label: 'Agent Personality', icon: Bot },
  { id: 'knowledge', label: 'Knowledge Base', icon: Database },
  { id: 'connection', label: 'WhatsApp Connection', icon: Smartphone },
  { id: 'sandbox', label: 'Sandbox', icon: FlaskConical },
  { id: 'logs', label: 'Usage & Logs', icon: FileText },
  { id: 'config', label: 'Configuration', icon: Sliders },
] as const;

type SubTabId = typeof SETTINGS_SUBTABS[number]['id'];

export function WhatsAppSettingsTab({
  tenantId,
  waAgentId,
  initialSettingSubTab = 'persona',
  onViewChat,
  onAgentDeleted,
}: WhatsAppSettingsTabProps) {
  const { toast, success: toastSuccess, error: toastError } = useToast();
  const [activeSettingTab, setActiveSettingTab] = useState<SubTabId>(initialSettingSubTab);

  // ── Personality State ──
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
  const [rawConfig, setRawConfig] = useState<AgentConfig | null>(null);
  const [publishedVersionId, setPublishedVersionId] = useState<string | null>(null);
  const [latestVersionId, setLatestVersionId] = useState<string | null>(null);
  const [configNotice, setConfigNotice] = useState<string | null>(null);
  const [isSavingCfg, setIsSavingCfg] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch personality configuration
  const loadAgentConfig = useCallback(async (signal?: AbortSignal) => {
    if (!waAgentId) return;
    setIsConfigLoading(true);
    try {
      const [agentData, versions] = await Promise.all([
        apiRequest<Agent>(`/v1/agents/${waAgentId}`, { signal }),
        apiRequest<AgentVersion[]>(`/v1/agents/${waAgentId}/versions`, { signal }),
      ]);
      setPublishedVersionId(agentData.current_version_id || null);
      const versionList = Array.isArray(versions) ? versions : [];
      const latest = versionList[0] || null;
      setLatestVersionId(latest ? latest.id : null);

      const config = latest?.config;
      if (config) {
        setRawConfig(config);
        setCfg({
          bot_name: config.persona?.agent_name || agentData.agent_name || 'Frosty',
          persona: config.persona?.business_info || '',
          tone: config.persona?.tone || 'friendly',
          language: config.guided?.languages?.join(', ') || 'en',
          welcome_message: config.guided?.welcome_message || 'Hi! How can I help you on WhatsApp today?',
          fallback_message: config.guided?.fallback_message || "I don't have that in my knowledge base yet - drop your email and our team will follow up!",
          dos: config.persona?.dos || [],
          donts: config.persona?.donts || [],
        });
      } else {
        setCfg(prev => ({ ...prev, bot_name: agentData.agent_name || 'Frosty' }));
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return;
      console.error('Failed to load WA agent config', e);
    } finally {
      setIsConfigLoading(false);
    }
  }, [waAgentId]);

  useEffect(() => {
    loadAgentConfig();
  }, [loadAgentConfig]);

  // Save personality configuration
  const handleSaveConfig = async () => {
    if (!waAgentId) {
      toastError('No active WA Agent found. Please refresh the page.');
      return;
    }
    setIsSavingCfg(true);
    setConfigNotice(null);
    try {
      await apiRequest(`/v1/agents/${waAgentId}`, {
        method: 'PATCH',
        body: { agent_name: cfg.bot_name },
      });

      const langList = cfg.language
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload: AgentConfig = rawConfig ? {
        ...rawConfig,
        prompt_mode: 'guided',
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
        }
      } : {
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
        rag: { tau: 0.40, top_k: 6, mode: 'lenient' },
        tools: {},
        handoff: { agent_idle_timeout_minutes: 5, on_agent_idle: 'resume_frosty_agent' },
        messages: {
          kb_miss_fallback: cfg.fallback_message || '',
          capacity_fallback: '',
          pace_fallback: '',
        },
      };

      if ('voice' in payload) {
        delete (payload as any).voice;
      }

      const version = await apiRequest<AgentVersion>(`/v1/agents/${waAgentId}/versions`, {
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

  const handleDeleteAgent = async () => {
    if (!waAgentId || deleting) return;
    setDeleting(true);
    try {
      await apiRequest(`/v1/agents/${waAgentId}`, { method: 'DELETE' });
      toastSuccess('Agent deleted.');
      setDeleteOpen(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('frosty:agents-changed'));
      }
      onAgentDeleted?.();
    } catch (e: any) {
      toastError('Could not delete agent: ' + (e?.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  if (isConfigLoading && !rawConfig) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground animate-in fade-in">
        <RefreshCw size={20} className="animate-spin text-[#0396A6]" />
        Loading Settings...
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden space-y-4 animate-in fade-in duration-300">
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

      {/* Internal Scrollable Content Workspace */}
      <div className={`flex-1 min-h-0 ${
        activeSettingTab === 'sandbox' || activeSettingTab === 'logs' || activeSettingTab === 'config'
          ? 'flex flex-col overflow-hidden h-full'
          : 'overflow-y-auto no-scrollbar pb-24 md:pb-6'
      }`} style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* SUBTAB 1: Agent Personality */}
        {activeSettingTab === 'persona' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
            {/* Identity Summary Column */}
            <div className="lg:col-span-5 space-y-5">
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight leading-snug">
                  Agent Personality &amp; Identity
                </h2>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Configure the assistant name, conversational tone, business background, and welcome messages for your WhatsApp contacts.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-border shadow-xs space-y-5">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-bold shadow-xs border border-[#0396A6]/15">
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
                    <Smartphone size={12} className="text-[#0396A6]" /> Channel: WhatsApp
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
                  onChange={e => setCfg({...cfg, bot_name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:border-[#0396A6]"
                  placeholder="Frosty"
                />
              </div>

              {/* Tone Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CONVERSATIONAL TONE</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {['professional', 'friendly', 'casual', 'formal', 'enthusiastic'].map(tone => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setCfg({...cfg, tone})}
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
                  onChange={e => setCfg({...cfg, persona: e.target.value})}
                  className="w-full p-3 bg-muted/20 border border-border rounded-xl text-xs text-foreground outline-none focus:border-[#0396A6] placeholder:text-muted-foreground resize-none"
                  placeholder="Describe your company, products, target audience, and primary customer goals on WhatsApp."
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
                    onChange={e => setCfg({...cfg, welcome_message: e.target.value})}
                    className="w-full p-2.5 bg-muted/20 border border-border rounded-xl text-xs text-foreground outline-none focus:border-[#0396A6] resize-none"
                    placeholder="Hi! How can I help you today?"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">FALLBACK MESSAGE</label>
                  <textarea
                    rows={2}
                    value={cfg.fallback_message}
                    onChange={e => setCfg({...cfg, fallback_message: e.target.value})}
                    className="w-full p-2.5 bg-muted/20 border border-border rounded-xl text-xs text-foreground outline-none focus:border-[#0396A6] resize-none"
                    placeholder="I don't have that in my knowledge base yet."
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isSavingCfg}
                className="w-full py-3.5 bg-[#0396A6] hover:bg-[#02808E] text-white rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
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
              {waAgentId ? (
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="w-full py-3 border border-red-200 text-red-600 rounded-xl font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-red-50"
                >
                  <Trash2 size={14} /> Delete agent
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* SUBTAB 2: KNOWLEDGE BASE */}
        {activeSettingTab === 'knowledge' && (
          <div className="h-full flex flex-col">
            <WebsiteKnowledgeTab webAgentId={waAgentId} />
          </div>
        )}

        {/* SUBTAB 3: WHATSAPP CONNECTION */}
        {activeSettingTab === 'connection' && (
          <WhatsAppConnectionView
            tenantId={tenantId}
            waAgentId={waAgentId}
          />
        )}

        {/* SUBTAB 4: SANDBOX */}
        {activeSettingTab === 'sandbox' && (
          <div className="h-full flex flex-col">
            <SandboxTab agentId={waAgentId ?? null} preferMode="whatsapp" channelLabel="WhatsApp agent" />
          </div>
        )}

        {/* SUBTAB 5: USAGE & LOGS */}
        {activeSettingTab === 'logs' && (
          <div className="h-full flex flex-col">
            <UsageLogsTab agentId={waAgentId ?? null} onViewChat={onViewChat} />
          </div>
        )}

        {/* SUBTAB 6: CONFIGURATION STUDIO */}
        {activeSettingTab === 'config' && (
          <div className="h-full flex flex-col">
            <AgentConfigurationStudio agentId={waAgentId ?? null} onAgentDeleted={onAgentDeleted} />
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={deleteOpen}
        title="Delete this agent?"
        description="This retires the WhatsApp agent. Another enabled bot on this channel can take live traffic."
        confirmText={deleting ? "Deleting…" : "Delete"}
        tone="danger"
        onConfirm={() => void handleDeleteAgent()}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
