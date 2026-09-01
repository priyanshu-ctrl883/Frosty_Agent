import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bot, RefreshCw, Save, CheckCircle, Database, Palette, MessageCircle, CheckCircle2, Copy, Sparkles, Globe, Shield,
  FlaskConical, FileText, Trash2, Code2, Sliders, Key, ShieldCheck, Terminal, ExternalLink
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import type { Agent, AgentConfig, AgentVersion, WidgetSettings } from '@/lib/types';
import { useToast } from "@/lib/toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { WebsiteKnowledgeTab } from '../WebsiteKnowledgeTab';
import { SandboxTab } from './SandboxTab';
import { UsageLogsTab } from './UsageLogsTab';
import { WidgetInstallMethods } from '@/components/widget/WidgetInstallMethods';
import { AgentConfigurationStudio } from '@/components/agents/AgentConfigurationStudio';
import { LanguageCodesField } from '@/components/agents/LanguageCodesField';

interface SettingsTabProps {
  agentId: string | null;
  mainBalance: number;
  allocatedCredits: number;
  refreshBalances: () => void;
  onViewChat?: (conversationId: string) => void;
  onAgentDeleted?: () => void;
  initialSettingSubTab?: SettingsSubTabId;
}

const SETTINGS_SUBTABS = [
  { id: 'install', label: 'Website install', icon: Code2 },
  { id: 'persona', label: 'Agent Personality', icon: Bot },
  { id: 'knowledge', label: 'Knowledge Base', icon: Database },
  { id: 'widget', label: 'Widget Styling', icon: Palette },
  { id: 'sandbox', label: 'Sandbox', icon: FlaskConical },
  { id: 'usage', label: 'Usage & Logs', icon: FileText },
  { id: 'config', label: 'Configuration', icon: Sliders },
] as const;

type SettingsSubTabId = typeof SETTINGS_SUBTABS[number]['id'];

export function SettingsTab({ agentId, onViewChat, onAgentDeleted, initialSettingSubTab }: SettingsTabProps) {
  const { toast, success: toastSuccess, error: toastError } = useToast();
  
  const [activeSettingTab, setActiveSettingTab] = useState<SettingsSubTabId>(initialSettingSubTab ?? 'install');

  useEffect(() => {
    if (initialSettingSubTab) {
      setActiveSettingTab(initialSettingSubTab);
    }
  }, [initialSettingSubTab]);
  
  // Agent Config State
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
  const [isPublishing, setIsPublishing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Widget Settings State
  const [isWidgetLoading, setIsWidgetLoading] = useState(false);
  const [widgetCfg, setWidgetCfg] = useState({
    color: '#0396A6',
    title: 'Chat with us',
    greeting: 'Hi! How can we help you today?',
    launcher_label: 'Open chat',
    logo_url: '',
    consent_notice: '',
    position: 'bottom-right' as 'bottom-right' | 'bottom-left'
  });
  const [widgetKey, setWidgetKey] = useState<string | null>(null);
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings | null>(null);
  const [widgetLoadError, setWidgetLoadError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedBotId, setCopiedBotId] = useState(false);
  const [isSavingWidget, setIsSavingWidget] = useState(false);

  const loadAgentConfig = useCallback(async (signal?: AbortSignal) => {
    if (!agentId) return;
    setIsConfigLoading(true);
    try {
      const [agentData, versions] = await Promise.all([
        apiRequest<Agent>(`/v1/agents/${agentId}`, { signal }),
        apiRequest<AgentVersion[]>(`/v1/agents/${agentId}/versions`, { signal }),
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
          welcome_message: config.guided?.welcome_message || 'Hi! How can I help you today?',
          fallback_message: config.guided?.fallback_message || "I don't have that in my knowledge base yet - drop your email and our team will follow up!",
          dos: config.persona?.dos || [],
          donts: config.persona?.donts || [],
        });
      } else {
        setCfg(prev => ({ ...prev, bot_name: agentData.agent_name || 'Frosty' }));
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return;
      console.error("Failed to load agent config", e);
    } finally {
      setIsConfigLoading(false);
    }
  }, [agentId]);

  const fetchWidgetSettings = useCallback(async (signal?: AbortSignal) => {
    if (!agentId) return;
    setIsWidgetLoading(true);
    setWidgetLoadError(null);
    try {
      const data = await apiRequest<WidgetSettings>(
        `/v1/widget/settings?agent_id=${encodeURIComponent(agentId)}`,
        { signal },
      );
      setWidgetSettings(data);
      const appearance = data.appearance;
      setWidgetCfg({
        color: appearance.color || '#0396A6',
        title: appearance.title || 'Chat with us',
        greeting: appearance.greeting || '',
        launcher_label: appearance.launcher_label || '',
        logo_url: appearance.logo_url || '',
        consent_notice: appearance.consent_notice || '',
        position: appearance.position === 'bottom-left' ? 'bottom-left' : 'bottom-right',
      });
      if (data.publishable_key) setWidgetKey(data.publishable_key);
    } catch (e: any) {
      if (e instanceof Error && e.name === 'AbortError') return;
      if (e.code === 'no_website_channel') {
        setWidgetLoadError(e.message || 'This agent has no website channel yet.');
        return;
      }
      setWidgetLoadError(e?.message || 'Could not load install snippet.');
      console.error("Failed to fetch widget settings", e);
    } finally {
      setIsWidgetLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    const controller = new AbortController();
    loadAgentConfig(controller.signal);
    fetchWidgetSettings(controller.signal);
    return () => controller.abort();
  }, [loadAgentConfig, fetchWidgetSettings]);

  const handleSaveConfig = async () => {
    if (!agentId) {
      toastError("No active Web Agent found. Please refresh the page.");
      return;
    }
    setIsSavingCfg(true);
    setConfigNotice(null);
    try {
      await apiRequest(`/v1/agents/${agentId}`, {
        method: 'PATCH',
        body: { agent_name: cfg.bot_name },
      });
      
      const langList = cfg.language.split(',').map(l => l.trim()).filter(Boolean);
      
      const payload: AgentConfig = rawConfig ? {
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

      const version = await apiRequest<AgentVersion>(`/v1/agents/${agentId}/versions`, {
        method: 'POST',
        body: payload,
      });
      setLatestVersionId(version.id);
      setConfigNotice(`Draft version v${version.version_number} saved! Click Publish to make it live.`);
      toastSuccess(`Draft saved as version v${version.version_number}.`);
      setRawConfig(payload);
    } catch (e: any) {
      console.error("Save config error", e);
      toastError("Could not save: " + (e?.message || "Unknown error"));
    } finally {
      setIsSavingCfg(false);
    }
  };

  const handlePublishVersion = async () => {
    if (!agentId || !latestVersionId) return;
    setIsPublishing(true);
    try {
      await apiRequest(`/v1/agents/${agentId}/versions/${latestVersionId}/publish`, { method: 'POST' });
      setPublishedVersionId(latestVersionId);
      setConfigNotice('Published! Customers get this version from their next message.');
      toastSuccess('Version published live! Active on your website.');
    } catch (e: any) {
      toastError("Failed to publish version: " + (e?.message || "Unknown error"));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!agentId || deleting) return;
    setDeleting(true);
    try {
      await apiRequest(`/v1/agents/${agentId}`, { method: 'DELETE' });
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

  const handleSaveWidgetSettings = async () => {
    if (!agentId) {
      toastError("Select a website agent first.");
      return;
    }
    setIsSavingWidget(true);
    try {
      const data = await apiRequest<WidgetSettings>(
        `/v1/widget/settings?agent_id=${encodeURIComponent(agentId)}`,
        {
          method: 'PATCH',
          body: {
            title: widgetCfg.title,
            greeting: widgetCfg.greeting,
            color: widgetCfg.color,
            logo_url: widgetCfg.logo_url,
            position: widgetCfg.position === 'bottom-left' ? 'bottom-left' : 'bottom-right',
            launcher_label: widgetCfg.launcher_label,
            consent_notice: widgetCfg.consent_notice,
          },
        },
      );
      setWidgetSettings(data);
      if (data.publishable_key) setWidgetKey(data.publishable_key);
      toast("Widget settings updated! Changes are live immediately.");
    } catch (e: any) {
      toastError("Failed to save widget settings: " + (e?.message || "Unknown error"));
    } finally {
      setIsSavingWidget(false);
    }
  };

  const generateWidgetKey = async () => {
    try {
      const data = await apiRequest<{ api_key?: string; publishable_key?: string }>(
        `/v1/widget/key`,
        { method: 'POST' },
      );
      const next = data.publishable_key || data.api_key || null;
      if (next) setWidgetKey(next);
      toast("New embed key generated. Re-copy this agent's snippet.");
      await fetchWidgetSettings();
    } catch (e: any) {
      toastError("Failed to generate key: " + (e?.message || "Unknown error"));
    }
  };

  const handleCopyKey = async () => {
    const key = widgetSettings?.publishable_key || widgetKey;
    if (!key) return;
    await navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyBotId = async () => {
    const bid = widgetSettings?.agent_id || agentId;
    if (!bid) return;
    await navigator.clipboard.writeText(bid);
    setCopiedBotId(true);
    setTimeout(() => setCopiedBotId(false), 2000);
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
        activeSettingTab === 'sandbox' || activeSettingTab === 'usage' || activeSettingTab === 'config'
          ? 'flex flex-col overflow-hidden h-full'
          : 'overflow-y-auto no-scrollbar pb-24 md:pb-6 workspace-scrollable pr-1'
      }`} style={{ WebkitOverflowScrolling: 'touch' }}>
        {activeSettingTab === 'install' && (
          <div className="max-w-4xl mx-auto w-full space-y-5 animate-in fade-in duration-300">
            {/* Credentials / Keys Dual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Publishable Key Card */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-xs p-4 sm:p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-foreground">
                    Publishable Key
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Authorizes your chat widget securely. Safe to use in public website code.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] font-mono truncate bg-muted/40 dark:bg-zinc-800/40 rounded-xl px-3 py-2 border border-border text-foreground">
                    {widgetSettings?.publishable_key || widgetKey || 'Loading…'}
                  </code>
                  <button
                    type="button"
                    onClick={() => void handleCopyKey()}
                    disabled={!widgetSettings?.publishable_key && !widgetKey}
                    className="px-3 py-2 rounded-xl border border-border/80 text-xs font-bold flex items-center gap-1.5 hover:bg-muted/40 transition-colors disabled:opacity-40 shrink-0 cursor-pointer shadow-2xs"
                  >
                    {copiedKey ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Bot Routing ID Card */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-xs p-4 sm:p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-foreground">
                    Agent Instance ID
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Ties conversations directly to this agent&apos;s personality and knowledge base.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] font-mono truncate bg-muted/40 dark:bg-zinc-800/40 rounded-xl px-3 py-2 border border-border text-foreground">
                    {widgetSettings?.agent_id || agentId || 'Default Agent'}
                  </code>
                  <button
                    type="button"
                    onClick={() => void handleCopyBotId()}
                    disabled={!widgetSettings?.agent_id && !agentId}
                    className="px-3 py-2 rounded-xl border border-border/80 text-xs font-bold flex items-center gap-1.5 hover:bg-muted/40 transition-colors disabled:opacity-40 shrink-0 cursor-pointer shadow-2xs"
                  >
                    {copiedBotId ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedBotId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Widget Snippet Installation Container */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-xs p-5 sm:p-6 space-y-4">
              <div>
                <h3 className="text-sm font-black text-foreground tracking-tight flex items-center gap-2">
                  <Terminal size={16} className="text-[#0396A6]" />
                  <span>Embed Code Snippet</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose your platform or framework recipe below to copy the drop-in installation script.
                </p>
              </div>

              <WidgetInstallMethods
                embedSnippet={widgetSettings?.embed_snippet}
                publishableKey={widgetSettings?.publishable_key || widgetKey}
                position={widgetSettings?.appearance?.position || widgetCfg.position}
                agentId={widgetSettings?.agent_id || agentId}
                loadError={widgetLoadError}
              />
            </div>
          </div>
        )}

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
                  Configure the assistant name, conversational tone, business background, and welcome messages for your website visitors.
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
                    <Globe size={12} className="text-[#0396A6]" /> Channel: Website Widget
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
                  placeholder="e.g. Frosty Support"
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

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-border/50">
                <button
                  onClick={handleSaveConfig}
                  disabled={isSavingCfg || isPublishing}
                  className="flex-1 py-3 bg-[#0396A6] hover:bg-[#02808E] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
                >
                  {isSavingCfg ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save Draft
                </button>
                {latestVersionId && latestVersionId !== publishedVersionId && (
                  <button
                    onClick={handlePublishVersion}
                    disabled={isSavingCfg || isPublishing}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
                  >
                    {isPublishing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />} Publish Live
                  </button>
                )}
                {agentId ? (
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="py-3 px-4 border border-red-200 text-red-600 font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: Knowledge Base */}
        {activeSettingTab === 'knowledge' && (
          <div className="w-full animate-in fade-in duration-300">
            <WebsiteKnowledgeTab webAgentId={agentId || null} />
          </div>
        )}

        {/* SUBTAB 3: Widget Styling */}
        {activeSettingTab === 'widget' && (
          <div className="w-full flex flex-col lg:flex-row gap-6 animate-in fade-in duration-300 items-start">
            {/* LEFT: Configuration Form */}
            <div className="w-full lg:w-[48%] shrink-0 space-y-5">
              <div>
                <h3 className="text-2xl font-black text-foreground tracking-tight">
                  Widget Styling &amp; Embed
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Design your chat widget appearance and generate embed snippets for your website.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden relative">
                {isWidgetLoading && (
                  <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-xs flex items-center justify-center">
                    <RefreshCw className="animate-spin text-[#0396A6]" />
                  </div>
                )}

                <div className="p-6 space-y-5">
                  {/* Brand Color */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Brand Accent Color
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-inner border border-border group shrink-0 cursor-pointer">
                        <input
                          type="color"
                          value={widgetCfg.color}
                          onChange={(e) => setWidgetCfg({ ...widgetCfg, color: e.target.value })}
                          className="absolute -top-4 -left-4 w-20 h-20 cursor-pointer"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-mono font-extrabold uppercase text-foreground">
                          {widgetCfg.color}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Click swatch to pick custom color</span>
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Presets:</span>
                      {[
                        { hex: "#0396A6", name: "Frosty Teal" },
                        { hex: "#0f172a", name: "Navy Slate" },
                        { hex: "#2563eb", name: "Royal Blue" },
                        { hex: "#16a34a", name: "Emerald" },
                        { hex: "#7c3aed", name: "Purple" },
                        { hex: "#ea580c", name: "Orange" },
                      ].map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          title={preset.name}
                          onClick={() => setWidgetCfg({ ...widgetCfg, color: preset.hex })}
                          className={`w-5 h-5 rounded-full transition-transform hover:scale-110 shadow-xs ${
                            widgetCfg.color === preset.hex ? 'ring-2 ring-offset-2 ring-[#0396A6] scale-110' : ''
                          }`}
                          style={{ backgroundColor: preset.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Title & Launcher */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Widget Title
                      </label>
                      <input
                        type="text"
                        value={widgetCfg.title}
                        onChange={e => setWidgetCfg({...widgetCfg, title: e.target.value})}
                        placeholder="Chat with us"
                        className="w-full px-3 py-2 bg-muted/20 border border-border rounded-xl text-xs font-semibold text-foreground outline-none focus:border-[#0396A6]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Launcher Button Label
                      </label>
                      <input
                        type="text"
                        value={widgetCfg.launcher_label}
                        onChange={e => setWidgetCfg({...widgetCfg, launcher_label: e.target.value})}
                        placeholder="Open chat"
                        className="w-full px-3 py-2 bg-muted/20 border border-border rounded-xl text-xs font-semibold text-foreground outline-none focus:border-[#0396A6]"
                      />
                    </div>
                  </div>

                  {/* Greeting */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Greeting Message
                    </label>
                    <input
                      type="text"
                      value={widgetCfg.greeting}
                      onChange={e => setWidgetCfg({...widgetCfg, greeting: e.target.value})}
                      placeholder="Hi! How can we help you today?"
                      className="w-full px-3 py-2 bg-muted/20 border border-border rounded-xl text-xs font-semibold text-foreground outline-none focus:border-[#0396A6]"
                    />
                  </div>

                  {/* Position */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Screen Position
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['bottom-left', 'bottom-right'] as const).map(pos => {
                        const active = widgetCfg.position === pos;
                        return (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => setWidgetCfg({...widgetCfg, position: pos})}
                            className={`py-2 px-3 border rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold ${
                              active 
                                ? 'border-[#0396A6] bg-[#0396A6]/10 text-[#0396A6]' 
                                : 'border-border bg-white text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <span className="capitalize">{pos.replace('-', ' ')}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Logo URL */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Logo URL (optional)
                    </label>
                    <input
                      type="text"
                      value={widgetCfg.logo_url}
                      onChange={e => setWidgetCfg({...widgetCfg, logo_url: e.target.value})}
                      placeholder="https://yourwebsite.com/logo.png"
                      className="w-full px-3 py-2 bg-muted/20 border border-border rounded-xl text-xs text-foreground outline-none focus:border-[#0396A6]"
                    />
                  </div>

                  {/* Consent Notice */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Consent / Privacy Notice (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={widgetCfg.consent_notice}
                      onChange={e => setWidgetCfg({...widgetCfg, consent_notice: e.target.value})}
                      placeholder="By chatting you agree to our privacy policy."
                      className="w-full px-3 py-2 bg-muted/20 border border-border rounded-xl text-xs text-foreground outline-none focus:border-[#0396A6] resize-none"
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted/10 border-t border-border">
                  <button
                    onClick={handleSaveWidgetSettings}
                    disabled={isSavingWidget || isWidgetLoading}
                    className="w-full py-3 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 hover:opacity-95"
                    style={{ backgroundColor: widgetCfg.color || '#0396A6' }}
                  >
                    {isSavingWidget ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save Widget Settings
                  </button>
                </div>
              </div>

              {/* Snippet lives on Website install — keep a pointer here */}
              <div className="rounded-2xl border border-border bg-muted/10 px-5 py-4 space-y-2">
                <p className="text-xs font-bold text-foreground">Need the embed snippet?</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Copy HTML / React / GTM for this bot on the Website install tab. Each agent
                  snippet includes that bot&apos;s id.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSettingTab('install')}
                  className="text-[11px] font-bold text-[#0396A6] hover:underline"
                >
                  Open Website install →
                </button>
              </div>
            </div>

            {/* RIGHT: Live Preview Canvas (Hidden on mobile/tablet, visible on desktop PC) */}
            <div className="hidden lg:block flex-1 w-full min-w-0 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-foreground">Live Widget Simulator</h4>
                  <p className="text-[11px] text-muted-foreground">Interactive preview updated in real-time.</p>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase px-2.5 py-1 rounded-full bg-muted/30 border border-border">
                  {widgetCfg.position}
                </span>
              </div>

              {/* Mock Browser Frame */}
              <div className="w-full h-[580px] rounded-2xl border border-border overflow-hidden relative shadow-lg flex flex-col bg-white">
                <div className="h-9 border-b border-gray-200 flex items-center px-4 gap-3 bg-gray-100/90 shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="mx-auto h-5 w-3/5 rounded-md bg-white border border-gray-200 shadow-2xs flex items-center justify-center px-3">
                    <span className="text-[10px] text-gray-500 font-medium truncate">https://yourstore.com</span>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden relative bg-[#F7F5F1]">
                  {/* Decorative Background */}
                  <div className="p-8 space-y-5 opacity-40 select-none pointer-events-none">
                    <div className="w-44 h-5 rounded-md bg-gray-300" />
                    <div className="w-2/3 h-10 rounded-xl bg-gray-200" />
                    <div className="w-1/2 h-4 rounded-md bg-gray-200" />
                    <div className="grid grid-cols-3 gap-4 pt-3">
                      <div className="h-24 rounded-xl bg-white border border-gray-200 shadow-2xs" />
                      <div className="h-24 rounded-xl bg-white border border-gray-200 shadow-2xs" />
                      <div className="h-24 rounded-xl bg-white border border-gray-200 shadow-2xs" />
                    </div>
                  </div>

                  {/* Absolutely Contained Chat Widget */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden p-4">
                    <div className={`absolute bottom-4 ${widgetCfg.position === 'bottom-left' ? 'left-4 items-start' : 'right-4 items-end'} flex flex-col gap-3 pointer-events-auto max-w-[320px] sm:max-w-[340px]`}>
                      {/* Window */}
                      <div className="w-[300px] sm:w-[320px] h-[410px] rounded-2xl shadow-2xl bg-white border border-gray-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div
                          className="h-[60px] flex items-center px-4 text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: widgetCfg.color || '#336B55' }}
                        >
                          <div className="flex items-center gap-2.5 w-full">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-inner border border-white/20">
                              {widgetCfg.logo_url ? (
                                <img src={widgetCfg.logo_url} alt="Logo" className="w-full h-full object-cover" />
                              ) : (
                                <Bot size={18} className="text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-extrabold text-xs truncate text-white">
                                {widgetCfg.title || "Chat with us"}
                              </h5>
                              <span className="text-[10px] text-white/80 flex items-center gap-1 mt-0.5 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> 
                                Replies instantly
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Thread */}
                        <div className="flex-1 p-3.5 flex flex-col justify-end gap-3 bg-gray-50/70 overflow-y-auto no-scrollbar">
                          <div className="flex items-end gap-2 max-w-[90%]">
                            <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 flex items-center justify-center overflow-hidden">
                              {widgetCfg.logo_url ? (
                                <img src={widgetCfg.logo_url} alt="Logo" className="w-full h-full object-cover" />
                              ) : (
                                <Bot size={12} className="text-gray-600" />
                              )}
                            </div>
                            <div className="p-2.5 rounded-2xl rounded-bl-xs text-xs shadow-2xs leading-relaxed bg-white text-gray-800 border border-gray-200">
                              {widgetCfg.greeting || cfg.welcome_message || "Hi! How can we help you today?"}
                            </div>
                          </div>
                        </div>

                        {widgetCfg.consent_notice && (
                          <div className="px-3 py-1.5 bg-gray-50 text-center border-t border-gray-100">
                            <p className="text-[9px] text-gray-400 leading-tight truncate">
                              {widgetCfg.consent_notice}
                            </p>
                          </div>
                        )}
                        
                        {/* Input bar */}
                        <div className="p-2.5 bg-white shrink-0 border-t border-gray-200">
                          <div className="w-full h-8 rounded-full border border-gray-200 px-3 flex items-center justify-between text-xs text-gray-400 bg-gray-50">
                            <span className="text-[11px]">Type a message...</span>
                            <div 
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                              style={{ backgroundColor: widgetCfg.color || '#336B55' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Launcher */}
                      <div className="flex items-center gap-2 self-end">
                        {widgetCfg.launcher_label && widgetCfg.position === 'bottom-right' && (
                          <div className="px-3 py-1 bg-white rounded-full shadow-md border border-gray-200 text-xs font-bold text-gray-700">
                            {widgetCfg.launcher_label}
                          </div>
                        )}
                        
                        <div
                          className="w-11 h-11 rounded-full shadow-lg flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform"
                          style={{ backgroundColor: widgetCfg.color || '#336B55' }}
                        >
                          <MessageCircle size={20} className="text-white" />
                        </div>

                        {widgetCfg.launcher_label && widgetCfg.position === 'bottom-left' && (
                          <div className="px-3 py-1 bg-white rounded-full shadow-md border border-gray-200 text-xs font-bold text-gray-700">
                            {widgetCfg.launcher_label}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: Sandbox */}
        {activeSettingTab === 'sandbox' && (
          <SandboxTab agentId={agentId} preferMode="website" channelLabel="website agent" />
        )}

        {/* SUBTAB 5: Usage & Logs */}
        {activeSettingTab === 'usage' && (
          <UsageLogsTab 
            agentId={agentId} 
            onViewChat={(convoId) => {
              if (onViewChat) {
                onViewChat(convoId);
              }
            }} 
          />
        )}

        {/* SUBTAB 6: Configuration Studio */}
        {activeSettingTab === 'config' && (
          <AgentConfigurationStudio agentId={agentId} onAgentDeleted={onAgentDeleted} />
        )}
      </div>
      <ConfirmModal
        isOpen={deleteOpen}
        title="Delete this agent?"
        description="This retires the agent. Live traffic on this channel will fall back to another enabled bot if one exists."
        confirmText={deleting ? "Deleting…" : "Delete"}
        tone="danger"
        onConfirm={() => void handleDeleteAgent()}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
