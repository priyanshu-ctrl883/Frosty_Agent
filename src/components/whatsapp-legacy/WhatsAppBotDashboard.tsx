import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Bot, Search, Calendar, RefreshCw, X, MessageSquare, Smartphone, User as UserIcon, Users, Target, TrendingUp, ArrowRight, Sparkles, Save, Smile, Check, Send, Paperclip as Attachment, ExternalLink, Clock, ShieldCheck, Mail, Phone, Trash2
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, CartesianGrid, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { apiRequest, API_URL } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type {
  WaAccount,
  WaTemplate,
  Agent,
  AgentConfig,
  AgentVersion,
  PromptTone,
  Lead,
  Meeting,
  AnalyticsOverview
} from '@/lib/types';
import {
  CONVERSATION_LIST_POLL_MS,
  formatActivityTime,
  formatContactLabel,
  getConversationSummary,
  listSessionRows,
  loadTranscript,
  sendHumanReply,
  summarizeConversation,
  toggleHumanHandoff,
  LegacySessionRow,
  LegacyMessageRow,
} from '@/lib/conversations';

interface WhatsAppBotDashboardProps {
  tenantId: string;
  allocatedCredits?: number;
  mainBalance?: number;
  isEnabled?: boolean;
  hubTab?: 'analytics' | 'chats' | 'leads' | 'meetings' | 'settings';
  onHubTabChange?: (tab: 'analytics' | 'chats' | 'leads' | 'meetings' | 'settings') => void;
  onManageCredits?: () => void;
  refreshBalances?: () => void;
  /** Resolved WA agent ID from the parent page â€” used for config saves. */
  waAgentId?: string | null;
  days?: number;
  initialSettingTab?: 'persona' | 'connection' | 'messaging' | 'templates';
  onAgentDeleted?: () => void;
}

export default function WhatsAppBotDashboard({
  tenantId,
  isEnabled = true,
  hubTab = 'analytics',
  onHubTabChange,
  waAgentId = null,
  days = 30,
  initialSettingTab = 'persona',
  onAgentDeleted,
}: WhatsAppBotDashboardProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [activeSettingTab, setActiveSettingTab] = useState<'persona' | 'connection' | 'messaging' | 'templates'>(initialSettingTab);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // â”€â”€â”€ BOT CONFIG STATE â”€â”€â”€
  const [cfg, setCfg] = useState({
    bot_name: 'Frosty',
    persona: 'Define the AI assistant logic on WhatsApp...',
    tone: 'PROFESSIONAL',
    language: 'English',
    fallback_message: "I'm sorry, I don't have that in my knowledge base yet.",
    active_model: 'gemini-3.5-flash'
  });
  const [baseConfig, setBaseConfig] = useState<AgentConfig | null>(null);
  const [isSavingCfg, setIsSavingCfg] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // â”€â”€â”€ WHATSAPP CREDENTIALS STATE â”€â”€â”€
  const [credentials, setCredentials] = useState({
    access_token: '',
    phone_number_id: '',
    waba_id: '',
    label: '',
    verify_token: 'assistant_whatsapp_' + (tenantId ? tenantId.slice(0, 8) : 'default')
  });
  const [connectedAccounts, setConnectedAccounts] = useState<WaAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [isSyncingTemplates, setIsSyncingTemplates] = useState(false);

  // â”€â”€â”€ ANALYTICS & HISTORY STATE â”€â”€â”€
  const [analytics, setAnalytics] = useState({
    total_messages: 0,
    unique_users: 0,
    active_sessions: 0,
    unread_messages: 0,
    total_leads: 0,
    meetings_scheduled: 0,
    response_rate: 100,
    daily_burned_credits: 0,
    weekly_activity: [] as { name: string; count: number }[],
    unique_contacts_trend: [] as { name: string; count: number }[]
  });

  const [sessions, setSessions] = useState<LegacySessionRow[]>([]);
  const [convos, setConvos] = useState<LegacyMessageRow[]>([]);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [meetingsList, setMeetingsList] = useState<Meeting[]>([]);

  // Cutstruct Integration State
  const searchParams = useSearchParams();
  const urlConvoId = searchParams?.get('c') || searchParams?.get('session_id') || searchParams?.get('conversation_id');
  const [activeContactId, setActiveContactId] = useState<string | null>(urlConvoId || null);

  useEffect(() => {
    if (urlConvoId && urlConvoId !== activeContactId) {
      setActiveContactId(urlConvoId);
    }
  }, [urlConvoId]);

  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [inputText, setInputText] = useState('');

  // New Chat Modal State
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sendingNewChat, setSendingNewChat] = useState(false);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // â”€â”€â”€ API HANDLERS â”€â”€â”€

  const loadAgentConfig = useCallback(async (agentId: string) => {
    setIsLoadingConfig(true);
    try {
      const [agent, versions] = await Promise.all([
        apiRequest<Agent>(`/v1/agents/${agentId}`),
        apiRequest<AgentVersion[]>(`/v1/agents/${agentId}/versions`).catch(() => []),
      ]);

      const vs = Array.isArray(versions) ? versions : [];
      const current = vs.find(v => v.id === agent.current_version_id) || vs[0];
      const agentCfg = current?.config;

      if (agentCfg) {
        setBaseConfig(agentCfg);
        setCfg({
          bot_name: agent.agent_name || agentCfg.persona?.agent_name || 'Frosty',
          persona: agentCfg.guided?.persona || agentCfg.persona?.business_info || '',
          tone: (agentCfg.guided?.tone || agentCfg.persona?.tone || 'Professional').toUpperCase(),
          language: agentCfg.guided?.languages?.[0] || 'English',
          fallback_message: agentCfg.guided?.fallback_message || agentCfg.messages?.kb_miss_fallback || "I'm sorry, I don't have that in my knowledge base yet.",
          active_model: agentCfg.model?.model_id || 'gemini-3.5-flash',
        });
      } else if (agent) {
        setCfg(prev => ({
          ...prev,
          bot_name: agent.agent_name || prev.bot_name,
        }));
      }
    } catch (e) {
      console.error("Failed to load agent configuration", e);
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  const fetchWaAccounts = useCallback(async () => {
    if (!waAgentId) {
      setConnectedAccounts([]);
      return;
    }
    setAccountsLoading(true);
    try {
      const data = await apiRequest<WaAccount[]>(
        `/v1/wa/accounts?agent_id=${encodeURIComponent(waAgentId)}`,
      );
      setConnectedAccounts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch WA accounts', e);
      setAccountsError('Could not load connected numbers.');
      setConnectedAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  }, [waAgentId]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await apiRequest<AnalyticsOverview>(`/v1/analytics/overview?days=${days}`);
      if (data) {
        const dailyActivity = Array.isArray(data.conversations_by_day)
          ? data.conversations_by_day.map(d => ({
            name: d.day ? d.day.slice(5) : '',
            count: d.conversations || 0,
          }))
          : [];

        const computedResponseRate = data.ai_runs > 0
          ? Math.round((data.ai_runs_grounded / data.ai_runs) * 100)
          : 100;

        setAnalytics(prev => ({
          ...prev,
          total_messages: data.open_by_channel?.whatsapp ?? data.conversations ?? prev.total_messages,
          total_leads: data.leads ?? prev.total_leads,
          meetings_scheduled: data.meetings ?? prev.meetings_scheduled,
          response_rate: computedResponseRate,
          weekly_activity: dailyActivity,
          unique_contacts_trend: dailyActivity,
        }));
      }
    } catch (err) {
      console.warn("Could not fetch analytics overview", err);
    }
  }, [days]);

  const fetchLeads = useCallback(async () => {
    try {
      const data = await apiRequest<any>('/v1/leads');
      const list: Lead[] = Array.isArray(data) ? data : data?.items || data?.leads || [];
      setLeadsList(list);
      setAnalytics(prev => ({ ...prev, total_leads: list.length }));
    } catch (e) {
      console.error("Failed to fetch leads", e);
    }
  }, []);

  const fetchMeetings = useCallback(async () => {
    try {
      const data = await apiRequest<any>('/v1/meetings').catch(() => []);
      const list: Meeting[] = Array.isArray(data) ? data : data?.items || [];
      setMeetingsList(list);
      setAnalytics(prev => ({ ...prev, meetings_scheduled: list.length }));
    } catch (e) {
      // Ignored if meetings not entitled
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await apiRequest<any>('/v1/wa/templates');
      const list = Array.isArray(data) ? data : (data?.data || data?.items || []);
      setTemplates(list);
    } catch (e) {
      console.error('Failed to fetch templates', e);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const sessionList = await listSessionRows({ channel: 'whatsapp', limit: 50 });
      setSessions(sessionList);
      if (sessionList.length > 0) {
        setActiveContactId((prev) => prev ?? sessionList[0]!.session_id);
      }
      setAnalytics((prev) => ({
        ...prev,
        active_sessions: sessionList.length,
        unique_users: sessionList.length,
      }));
    } catch (e) {
      console.error("Failed to fetch WhatsApp conversations", e);
    }
  }, []);

  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

  const loadMessages = useCallback(async (conversationId: string) => {
    const session = sessionsRef.current.find((s) => s.session_id === conversationId);
    const mode = session?.bot_paused ? "human" : "ai";
    try {
      const rows = await loadTranscript(conversationId, mode);
      setConvos((prev) => {
        const others = prev.filter((c) => c.session_id !== conversationId);
        return [...others, ...rows];
      });
      if (rows.length > 0) {
        const last = rows[rows.length - 1]!;
        setSessions((prev) =>
          prev.map((s) =>
            s.session_id === conversationId
              ? { ...s, content: last.content, created_at: last.created_at }
              : s,
          ),
        );
      }
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  }, []);

  const loadSummary = useCallback(async (conversationId: string) => {
    try {
      const row = await getConversationSummary(conversationId);
      if (row.summary) {
        setSummaries((prev) => ({ ...prev, [conversationId]: row.summary as string }));
      }
    } catch {
      // no summary yet
    }
  }, []);

  // Initial Data Loading
  useEffect(() => {
    void fetchWaAccounts();
    void fetchSessions();
    void fetchLeads();
    void fetchMeetings();
    void fetchTemplates();
    void fetchAnalytics();
  }, [fetchWaAccounts, fetchSessions, fetchLeads, fetchMeetings, fetchTemplates, fetchAnalytics]);

  // Load Agent Version Config
  useEffect(() => {
    if (waAgentId) {
      void loadAgentConfig(waAgentId);
    }
  }, [waAgentId, loadAgentConfig]);

  useEffect(() => {
    if (activeSettingTab === 'connection') void fetchWaAccounts();
  }, [activeSettingTab, fetchWaAccounts]);

  // Periodic session list polling (only when on chats or analytics tab)
  useEffect(() => {
    if (!tenantId || (hubTab !== 'chats' && hubTab !== 'analytics')) return;
    const id = window.setInterval(() => void fetchSessions(), CONVERSATION_LIST_POLL_MS);
    return () => window.clearInterval(id);
  }, [tenantId, hubTab, fetchSessions]);

  useEffect(() => {
    if (!activeContactId || hubTab !== 'chats') return;
    void loadMessages(activeContactId);
    void loadSummary(activeContactId);
  }, [activeContactId, hubTab, loadMessages, loadSummary]);

  useEffect(() => {
    if (!activeContactId || hubTab !== 'chats') return;
    const session = sessionsRef.current.find((s) => s.session_id === activeContactId);
    if (session?.bot_paused) return;
    const id = window.setInterval(() => void loadMessages(activeContactId), CONVERSATION_LIST_POLL_MS);
    return () => window.clearInterval(id);
  }, [activeContactId, hubTab, loadMessages]);

  const handleSaveConfig = async () => {
    if (!waAgentId) {
      alert("âš ï¸ No WhatsApp agent found. Create one under Agents first.");
      return;
    }

    setIsSavingCfg(true);
    try {
      // 1. Update Agent Name
      await apiRequest(`/v1/agents/${waAgentId}`, {
        method: 'PATCH',
        body: { agent_name: cfg.bot_name },
      });

      // 2. Build full AgentConfig payload and save new version
      const toneVal = (cfg.tone.toLowerCase() as PromptTone) || 'professional';
      const payload: AgentConfig = {
        ...(baseConfig || {}),
        prompt_mode: 'guided',
        persona: {
          agent_name: cfg.bot_name,
          tone: toneVal,
          business_info: cfg.persona || '',
          dos: baseConfig?.persona?.dos || [],
          donts: baseConfig?.persona?.donts || [],
        },
        guided: {
          persona: cfg.persona || cfg.bot_name || 'Frosty',
          tone: toneVal,
          languages: baseConfig?.guided?.languages || ['en'],
          welcome_message: baseConfig?.guided?.welcome_message || 'Hi! How can I help you on WhatsApp today?',
          fallback_message: cfg.fallback_message || "I don't have that in my knowledge base yet.",
          business_hours: baseConfig?.guided?.business_hours || {},
        },
        model: {
          model_id: cfg.active_model || 'gemini-3.5-flash',
        },
        generation: baseConfig?.generation || { temperature: 0.3, max_output_tokens: 1024 },
        rag: baseConfig?.rag || { tau: 0.40, top_k: 6, mode: 'lenient' },
        tools: baseConfig?.tools || { meetings: {}, quotes: {}, whatsapp: {} },
        handoff: baseConfig?.handoff || { agent_idle_timeout_minutes: 5, on_agent_idle: 'resume_frosty_agent' },
        messages: {
          kb_miss_fallback: cfg.fallback_message || "I don't have that in my knowledge base yet.",
          capacity_fallback: baseConfig?.messages?.capacity_fallback || "",
          pace_fallback: baseConfig?.messages?.pace_fallback || "",
        }
      };

      const newVer = await apiRequest<AgentVersion>(`/v1/agents/${waAgentId}/versions`, {
        method: 'POST',
        body: payload,
      });

      if (newVer?.id) {
        await apiRequest(`/v1/agents/${waAgentId}/versions/${newVer.id}/publish`, {
          method: 'POST',
        });
      }

      setBaseConfig(payload);
      alert("âœ… AI Identity & Instructions saved and published successfully!");
    } catch (e: any) {
      console.error("Save config error", e);
      alert("âŒ Could not save: " + (e?.message || "Unknown error"));
    } finally {
      setIsSavingCfg(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!waAgentId || deleting) return;
    setDeleting(true);
    try {
      await apiRequest(`/v1/agents/${waAgentId}`, { method: 'DELETE' });
      toastSuccess(`Deleted ${cfg.bot_name || 'agent'}.`);
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

  const handleSyncTemplates = async () => {
    const targetAccount = connectedAccounts.find(a => a.is_default) || connectedAccounts[0];
    if (!targetAccount) {
      alert("âš ï¸ Please connect a WhatsApp Business number first under Settings â†’ Meta Connection.");
      return;
    }

    setIsSyncingTemplates(true);
    try {
      await apiRequest('/v1/wa/templates/sync', {
        method: 'POST',
        body: { wa_account_id: targetAccount.id }
      });
      await fetchTemplates();
      alert("âœ… Templates synced successfully from Meta!");
    } catch (e: any) {
      console.error("Failed to sync templates", e);
      alert("âŒ Sync failed: " + (e?.message || "Unknown error"));
    } finally {
      setIsSyncingTemplates(false);
    }
  };

  const handleSaveCredentials = async () => {
    setIsSavingCredentials(true);
    setConnectionError('');
    try {
      if (!waAgentId) {
        setConnectionError("Select a WhatsApp agent before connecting a number.");
        return;
      }
      if (!credentials.phone_number_id || !credentials.waba_id || !credentials.access_token) {
        setConnectionError("Please enter Phone Number ID, WABA ID, and Permanent Access Token.");
        return;
      }
      await apiRequest('/v1/wa/connect', {
        method: 'POST',
        body: {
          phone_number_id: credentials.phone_number_id.trim(),
          waba_id: credentials.waba_id.trim(),
          access_token: credentials.access_token.trim(),
          label: credentials.label.trim() || undefined,
          agent_id: waAgentId,
        }
      });
      alert("âœ… WhatsApp Cloud API credentials connected successfully!");
      setCredentials(prev => ({ ...prev, access_token: '', phone_number_id: '', waba_id: '', label: '' }));
      setShowUpdateForm(false);
      await fetchWaAccounts();
    } catch (e: any) {
      console.error("Save credentials error", e);
      setConnectionError(e?.message || "Connection failed. Please check your Meta credentials.");
    } finally {
      setIsSavingCredentials(false);
    }
  };

  const handleSetDefaultAccount = async (accountId: number) => {
    try {
      await apiRequest(`/v1/wa/accounts/${accountId}`, {
        method: 'PATCH',
        body: { is_default: true }
      });
      await fetchWaAccounts();
    } catch (e: any) {
      alert("Failed to set default account: " + (e?.message || "Unknown error"));
    }
  };

  const handleDisconnectAccount = async (accountId: number) => {
    if (!confirm("Are you sure you want to disconnect this WhatsApp number? AI replies will stop until reconnected.")) return;
    try {
      await apiRequest(`/v1/wa/accounts/${accountId}`, { method: 'DELETE' });
      alert("WhatsApp account disconnected.");
      setShowUpdateForm(false);
      await fetchWaAccounts();
    } catch (e: any) {
      alert("Failed to disconnect: " + (e?.message || "Unknown error"));
    }
  };

  const handleToggleBotPause = async (sid: string, currentPaused: boolean) => {
    try {
      const out = await toggleHumanHandoff(sid, currentPaused);
      if (!currentPaused && out.claimed === false) {
        alert("Someone else claimed this conversation first.");
        return;
      }
      setSessions((prev) =>
        prev.map((s) =>
          s.session_id === sid
            ? { ...s, bot_paused: out.human, mode: out.human ? 'human' : 'ai' }
            : s,
        ),
      );
      if (out.human) await loadMessages(sid);
    } catch (e: any) {
      alert(e?.message || "Could not toggle handoff mode.");
    }
  };

  const handleSendManual = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !activeContactId) return;

    const session = sessions.find((s) => s.session_id === activeContactId);
    const optimisticMsg: LegacyMessageRow = {
      id: 'optimistic-' + Date.now(),
      session_id: activeContactId,
      content: text,
      role: 'assistant',
      sender_type: 'agent',
      created_at: new Date().toISOString(),
      status: 'sending'
    };

    setConvos(prev => [...prev, optimisticMsg]);
    setInputText('');
    if (inputRef.current) inputRef.current.focus();

    try {
      await sendHumanReply(activeContactId, text, session?.bot_paused ? 'human' : 'ai');
      setSessions((prev) =>
        prev.map((s) =>
          s.session_id === activeContactId
            ? { ...s, bot_paused: true, mode: 'human' }
            : s,
        ),
      );
      await loadMessages(activeContactId);
    } catch (err: any) {
      console.error("Send failed", err);
      alert(err?.message || "Could not send message.");
      setConvos((prev) => prev.filter((c) => c.id !== optimisticMsg.id));
    }
  };

  const handleNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      "New WhatsApp chats start when a customer messages your number. Pick an existing conversation from the list, or use the Inbox after a handoff.",
    );
  };

  const handleSummarize = async (sid: string) => {
    try {
      const data = await summarizeConversation(sid);
      if (data.summary) {
        setSummaries((prev) => ({ ...prev, [sid]: data.summary as string }));
      }
    } catch (e) {
      console.error("Summarize failed", e);
      alert("Could not summarize this conversation.");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [convos]);

  // Dynamic Donut chart data for Conversation Status
  const activeChatCount = sessions.filter(s => !s.bot_paused).length;
  const manualChatCount = sessions.filter(s => s.bot_paused).length;
  const donutData = [
    { name: 'AI Active', value: activeChatCount || (sessions.length === 0 ? 1 : 0), color: '#0396A6' },
    { name: 'Manual / Paused', value: manualChatCount, color: '#67C9CE' }
  ];

  // Dynamic Half donut data for Avg Response Rate
  const gaugeData = [
    { name: 'Completion', value: analytics.response_rate, color: '#509753' },
    { name: 'Remaining', value: Math.max(0, 100 - analytics.response_rate), color: '#E8F8EA' }
  ];

  // Conversion Funnel Radar Chart Data with Dynamic Visual Scaling
  const convosCount = sessions.length || analytics.total_messages || 0;
  const leadsCount = analytics.total_leads || 0;
  const meetingsCount = analytics.meetings_scheduled || 0;
  const engagedCount = sessions.filter(s => !s.bot_paused).length || sessions.length || 0;

  const maxRaw = Math.max(1, convosCount, leadsCount, meetingsCount, engagedCount);
  const logMax = Math.log10(maxRaw + 1);

  const getVisualScale = (val: number) => {
    if (val <= 0) return 12;
    const ratio = Math.log10(val + 1) / logMax;
    return Math.round(25 + 75 * ratio);
  };

  const radarFunnelData = [
    {
      metric: 'Conversations',
      label: `Conversations (${convosCount})`,
      actualValue: convosCount,
      value: getVisualScale(convosCount),
      color: '#4663AC',
    },
    {
      metric: 'Leads',
      label: `Leads (${leadsCount})`,
      actualValue: leadsCount,
      value: getVisualScale(leadsCount),
      color: '#67C9CE',
    },
    {
      metric: 'Meetings',
      label: `Meetings (${meetingsCount})`,
      actualValue: meetingsCount,
      value: getVisualScale(meetingsCount),
      color: '#8B5CF6',
    },
    {
      metric: 'Engaged',
      label: `Engaged (${engagedCount})`,
      actualValue: engagedCount,
      value: getVisualScale(engagedCount),
      color: '#F59E0B',
    },
  ];

  // Callback URL for Webhook card
  const webhookCallbackUrl = `${API_URL}/v1/webhooks/meta`;

  return (
    <div className="font-sans space-y-6">
      
      {/* â”€â”€â”€ TAB 1: ANALYTICS â”€â”€â”€ */}
      {hubTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Row 1: Conversion Funnel & Inbox Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Conversion Funnel Radar Card */}
            <div className="bg-background hover:bg-white transition-all duration-200 p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-foreground tracking-tight">Conversion Funnel</h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/40 px-2 py-1 rounded">LAST {days} DAYS</span>
              </div>

              <div className="h-52 w-full my-auto flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarFunnelData}>
                    <defs>
                      <linearGradient id="radarMultiRegion" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#4663AC" stopOpacity={0.45} />
                        <stop offset="35%" stopColor="#10B981" stopOpacity={0.45} />
                        <stop offset="70%" stopColor="#8B5CF6" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.45} />
                      </linearGradient>
                      <linearGradient id="radarStrokeMulti" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#4663AC" />
                        <stop offset="35%" stopColor="#10B981" />
                        <stop offset="70%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#F59E0B" />
                      </linearGradient>
                    </defs>
                    <PolarGrid stroke="var(--border)" strokeOpacity={0.6} />
                    <PolarAngleAxis 
                      dataKey="label" 
                      tick={(props: any) => {
                        const { x, y, textAnchor, payload } = props;
                        const item = radarFunnelData.find(d => d.label === payload.value);
                        return (
                          <text
                            x={x}
                            y={y}
                            textAnchor={textAnchor}
                            fill={item?.color || '#8A8D98'}
                            fontSize={10}
                            fontWeight={700}
                          >
                            {payload.value}
                          </text>
                        );
                      }} 
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      stroke="transparent" 
                      tick={false} 
                    />
                    <Radar 
                      name="Conversion Funnel" 
                      dataKey="value" 
                      stroke="url(#radarStrokeMulti)" 
                      strokeWidth={2.5}
                      fill="url(#radarMultiRegion)" 
                      fillOpacity={0.5} 
                      dot={(props: any) => {
                        const { cx, cy, index } = props;
                        const item = radarFunnelData[index];
                        return (
                          <circle
                            key={`radar-dot-${index}`}
                            cx={cx}
                            cy={cy}
                            r={5}
                            fill={item?.color || '#4663AC'}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        );
                      }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        borderRadius: '8px', 
                        borderColor: 'var(--border)',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      }} 
                      formatter={(value: any, name: any, item: any) => [item.payload.actualValue, item.payload.metric]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Distinct Legend for each variable */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40 text-xs font-bold">
                {radarFunnelData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.metric}:</span>
                    <span className="text-foreground font-extrabold">{item.actualValue}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Inbox Status Donut Chart Card */}
            <div className="bg-background hover:bg-white transition-all duration-200 p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-foreground tracking-tight">Active Sessions Mode</h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/40 px-2 py-1 rounded">LAST {days} DAYS</span>
              </div>
              <div className="relative h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-foreground">{sessions.length}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">TOTAL SESSIONS</span>
                </div>
              </div>
              <div className="flex justify-center items-center gap-6 mt-2 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0396A6]" />
                  <span className="text-muted-foreground">AI ({activeChatCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#67C9CE]" />
                  <span className="text-muted-foreground">Manual ({manualChatCount})</span>
                </div>
              </div>
            </div>

          </div>

          {/* Row 2: Messages Over Time Chart */}
          <div className="bg-background p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-foreground tracking-tight">Activity Over Time</h3>
              <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/40 px-2 py-1 rounded">Last {days} Days</span>
            </div>
            <div className="h-56 w-full">
              {analytics.weekly_activity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.weekly_activity}>
                    <defs>
                      <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0396A6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0396A6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8A8D98' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8A8D98' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', borderColor: 'var(--border)' }} />
                    <Area type="monotone" dataKey="count" stroke="#0396A6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMsg)" dot={{ r: 4, fill: '#0396A6' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border border-dashed rounded-xl bg-muted/10 text-xs text-muted-foreground font-medium">
                  No message activity recorded in this time period
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Avg. Response Rate & Unique Contacts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Avg Response Rate Gauge Card */}
            <div className="lg:col-span-6 bg-background p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-foreground tracking-tight">AI Assistant Reliability</h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/40 px-2 py-1 rounded">LAST {days} DAYS</span>
              </div>
              <div className="relative h-40 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx="50%"
                      cy="75%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {gaugeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-4 flex flex-col items-center">
                  <span className="text-2xl font-black text-foreground">{analytics.response_rate}%</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">OPERATIONAL</span>
                </div>
              </div>
            </div>

            {/* Unique Contacts Card */}
            <div className="lg:col-span-6 bg-background p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-foreground tracking-tight">Active Contacts</h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/40 px-2 py-1 rounded">LAST {days} DAYS</span>
              </div>
              <div className="mb-2">
                <span className="text-2xl font-black text-foreground">{sessions.length}</span>
                <span className="text-xs text-muted-foreground ml-2 font-medium">Engaged Conversations</span>
              </div>
              <div className="h-32 w-full">
                {analytics.unique_contacts_trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.unique_contacts_trend}>
                      <defs>
                        <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4663AC" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4663AC" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="count" stroke="#4663AC" strokeWidth={2} fillOpacity={1} fill="url(#colorContacts)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center border border-dashed rounded-xl bg-muted/10 text-xs text-muted-foreground font-medium">
                    No contact activity recorded
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Row 4: Latest Conversations List */}
          <div className="bg-background p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-foreground tracking-tight">Latest Conversations</h3>
              <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/40 px-2 py-1 rounded">LIVE</span>
            </div>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-xl bg-muted/10 text-muted-foreground text-xs">
                  No active WhatsApp conversations found yet. When a customer messages your number, conversations will appear here.
                </div>
              ) : (
                sessions.slice(0, 5).map((s, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border/60 bg-muted/10 flex items-center justify-between hover:border-[#0396A6]/40 transition-all">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-[#EAF8F8] text-[#0396A6] font-black text-xs flex items-center justify-center shrink-0 border border-[#D9EDEE]">
                        {(() => {
                          const name = formatContactLabel(s.contact_label, { channel: "whatsapp" });
                          const isGeneric = name === 'WhatsApp contact' || name === 'Visitor' || name.startsWith('#WEB-') || name.replace(/[^a-zA-Z]/g, '').length < 2;
                          return isGeneric ? <UserIcon size={18} strokeWidth={2.5} /> : getInitials(name);
                        })()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-foreground">
                          {formatContactLabel(s.contact_label, { channel: "whatsapp" })}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">&quot;{s.content || 'Started conversation'}&quot;</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {formatActivityTime(s.created_at)}
                      </span>
                      <button
                        onClick={() => {
                          setActiveContactId(s.session_id);
                          if (onHubTabChange) onHubTabChange('chats');
                        }}
                        className="px-3 py-1 bg-background border border-border text-foreground hover:bg-muted text-xs font-bold rounded-lg transition-all"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* â”€â”€â”€ TAB 2: CONVERSATIONS â”€â”€â”€ */}
      {hubTab === 'chats' && (
        <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col h-[720px] animate-in fade-in duration-300">
          <div className="flex flex-1 overflow-hidden">

            {/* Left Column: Contact List Sidebar */}
            <div className="w-full lg:w-[320px] border-r border-border flex flex-col bg-background shrink-0">
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="text-xs font-bold text-foreground tracking-tight flex items-center gap-2">
                  <MessageSquare size={15} className="text-[#0396A6]" /> ACTIVE SESSIONS
                </div>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="p-1.5 bg-[#0396A6]/10 text-[#0396A6] rounded-lg hover:bg-[#0396A6]/20 transition-all"
                  title="Start New Chat"
                >
                  <Send size={15} />
                </button>
              </div>

              <div className="p-3 border-b border-border/40">
                <div className="bg-muted/30 rounded-xl flex items-center px-3 py-1.5 gap-2 border border-border">
                  <Search size={14} className="text-muted-foreground" />
                  <input type="text" placeholder="Filter contacts" className="bg-transparent text-xs w-full outline-none text-foreground placeholder:text-muted-foreground" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {sessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No active sessions found.
                  </div>
                ) : (
                  sessions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setActiveContactId(s.session_id);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all border-b border-border/30 text-left group ${activeContactId === s.session_id ? 'bg-[#0396A6]/10 border-l-4 border-l-[#0396A6]' : 'hover:bg-muted/20'}`}
                    >
                      <div className="w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border transition-colors bg-[#EAF8F8] text-[#0396A6] border-[#D9EDEE] group-hover:bg-[#D9EDEE] group-hover:text-[#028391]">
                        {(() => {
                          const name = formatContactLabel(s.contact_label, { channel: "whatsapp" });
                          const isGeneric = name === 'WhatsApp contact' || name === 'Visitor' || name.startsWith('#WEB-') || name.replace(/[^a-zA-Z]/g, '').length < 2;
                          return isGeneric ? <UserIcon size={18} strokeWidth={2.5} /> : getInitials(name);
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-foreground truncate">
                            {formatContactLabel(s.contact_label, { channel: "whatsapp" })}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatActivityTime(s.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">{s.content || 'New message'}</span>
                          {s.bot_paused ? (
                            <span className="text-[8px] font-extrabold text-amber-700 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200">MANUAL</span>
                          ) : (
                            <span className="text-[8px] font-extrabold text-[#0396A6] bg-[#EAF8F8] px-1.5 py-0.5 rounded border border-[#D9EDEE]">AGENT</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Middle Column: Active Chat View */}
            <div className="flex-1 flex flex-col bg-[#F5F3FB] dark:bg-[#0b141a] relative overflow-hidden" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'overlay' }}>
              {activeContactId ? (
                <div className="flex flex-col h-full">

                  {/* Chat Header */}
                  <div className="bg-background px-6 py-3 flex items-center justify-between shrink-0 shadow-sm border-b border-border z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#EAF8F8] text-[#0396A6] font-bold text-xs flex items-center justify-center border border-[#D9EDEE] shadow-sm cursor-pointer" onClick={() => setShowInfoPanel(!showInfoPanel)}>
                        {(() => {
                          const contactLabel = sessions.find((s) => s.session_id === activeContactId)?.contact_label;
                          const name = formatContactLabel(contactLabel, { channel: "whatsapp" });
                          const isGeneric = name === 'WhatsApp contact' || name === 'Visitor' || name.startsWith('#WEB-') || name.replace(/[^a-zA-Z]/g, '').length < 2;
                          return isGeneric ? <UserIcon size={16} strokeWidth={2.5} /> : getInitials(name);
                        })()}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-foreground">
                          {formatContactLabel(
                            sessions.find((s) => s.session_id === activeContactId)?.contact_label,
                            { channel: "whatsapp" },
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#0396A6] animate-pulse" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                            {sessions.find(s => s.session_id === activeContactId)?.bot_paused ? 'PAUSED AI - MANUAL CONTROL' : 'AI ASSISTANT LIVE STREAM'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => handleToggleBotPause(activeContactId, !!sessions.find(s => s.session_id === activeContactId)?.bot_paused)}
                        className="flex items-center bg-muted/40 border border-border rounded-full px-3 py-1 gap-2 cursor-pointer hover:bg-muted/70 transition-all"
                      >
                        <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                          {sessions.find(s => s.session_id === activeContactId)?.bot_paused ? 'MANUAL MODE' : 'AI MODE'}
                        </span>
                        <div className={`w-7 h-3.5 rounded-full relative transition-colors ${sessions.find(s => s.session_id === activeContactId)?.bot_paused ? 'bg-amber-500' : 'bg-[#0396A6]'}`}>
                          <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all ${sessions.find(s => s.session_id === activeContactId)?.bot_paused ? 'left-0.5' : 'right-0.5'}`} />
                        </div>
                      </div>
                      <button onClick={() => setShowInfoPanel(!showInfoPanel)} className="p-1.5 text-muted-foreground hover:text-foreground">
                        <UserIcon size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                    {convos.filter(c => c.session_id === activeContactId).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground text-xs font-semibold">
                        No messages loaded in this session yet.
                      </div>
                    ) : (
                      convos.filter(c => c.session_id === activeContactId).map((m, i) => {
                        const sender = m.sender_type ?? (m.role === 'user' ? 'user' : 'agent');
                        const isUser = sender === 'user';
                        const isAi = sender === 'ai';
                        return (
                        <div key={i} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                          <div className={`p-3.5 rounded-2xl max-w-[85%] bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${isUser ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}>
                            
                            {!isUser && (
                              <div
                                className={`text-[9px] font-extrabold mb-1 select-none uppercase tracking-wide ${
                                  isAi ? 'text-[#0396A6]' : 'text-[#028391]'
                                }`}
                              >
                                <span>{isAi ? 'AI' : 'Human'}</span>
                              </div>
                            )}

                            <div className="text-xs leading-relaxed break-words font-medium text-slate-900 dark:text-slate-100">
                              {m.content}
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-1.5">
                              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                {formatActivityTime(m.created_at)}
                              </span>
                              {!isUser && (
                                <Check size={12} className="text-[#0396A6]" />
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input Bar */}
                  {(() => {
                    const activeSession = sessions.find((s) => s.session_id === activeContactId);
                    const isManual = Boolean(activeSession?.bot_paused);

                    return (
                      <div className="bg-background px-4 py-3 shrink-0 flex flex-col gap-2 border-t border-border z-10">
                        {!isManual && (
                          <div className="flex items-center justify-center gap-2 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0396A6] animate-pulse" />
                            <span className="text-[11px] font-bold text-muted-foreground">AI auto-reply is active — toggle off to type</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Smile size={20} className="hover:text-foreground cursor-pointer" />
                            <Attachment size={20} className="hover:text-foreground cursor-pointer rotate-45" />
                          </div>
                          <form onSubmit={handleSendManual} className="flex-1 flex items-center gap-2">
                            <input
                              ref={inputRef}
                              type="text"
                              value={inputText}
                              onChange={(e) => setInputText(e.target.value)}
                              placeholder={isManual ? "Type a manual message..." : "Turn off AI auto-reply to type..."}
                              disabled={!isManual}
                              className={`w-full bg-muted/20 border border-border rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 focus:ring-[#0396A6] text-foreground ${!isManual ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <button type="submit" disabled={!inputText.trim() || !isManual} className="p-2 bg-[#0396A6] hover:bg-[#5D21CB] text-white rounded-xl transition-all shrink-0 disabled:opacity-50">
                              <Send size={16} />
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                  <Smartphone size={36} className="mb-3 text-[#0396A6]" />
                  <p className="text-xs font-bold">Select a contact to open conversation</p>
                </div>
              )}
            </div>

            {/* Right Column: Contact Details / Info Panel */}
            {showInfoPanel && activeContactId && (
              <div className="w-[280px] border-l border-border bg-background flex flex-col overflow-y-auto shrink-0 animate-in slide-in-from-right duration-200">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Contact Details</span>
                  <button onClick={() => setShowInfoPanel(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                </div>

                <div className="p-6 flex flex-col items-center border-b border-border/40">
                  <div className="w-16 h-16 rounded-full bg-[#EAF8F8] text-[#0396A6] font-black text-xl flex items-center justify-center mb-3 border border-[#D9EDEE] shadow-xs shrink-0 relative">
                    {(() => {
                      const contactLabel = sessions.find((s) => s.session_id === activeContactId)?.contact_label;
                      const name = formatContactLabel(contactLabel, { channel: "whatsapp" });
                      const isGeneric = name === 'WhatsApp contact' || name === 'Visitor' || name.startsWith('#WEB-') || name.replace(/[^a-zA-Z]/g, '').length < 2;
                      return isGeneric ? <UserIcon size={32} strokeWidth={2.5} /> : getInitials(name);
                    })()}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0396A6] rounded-full border-2 border-background flex items-center justify-center shadow-xs" title="WhatsApp"></div>
                  </div>
                  <h3 className="font-bold text-xs text-foreground">+{activeContactId}</h3>
                  <span className="text-[9px] font-extrabold text-[#0396A6] bg-[#EAF8F8] px-2 py-0.5 rounded mt-1 border border-[#D9EDEE]">
                    WHATSAPP USER
                  </span>
                </div>

                <div className="p-4 space-y-5 text-xs">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AI Conversation Discovery</span>
                    <div className="p-3 bg-muted/20 rounded-xl border border-border/60">
                      {summaries[activeContactId] ? (
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic">&quot;{summaries[activeContactId]}&quot;</p>
                      ) : (
                        <button
                          onClick={() => handleSummarize(activeContactId)}
                          className="w-full py-1.5 bg-[#0396A6]/10 text-[#0396A6] text-[10px] font-bold rounded-lg border border-[#0396A6]/20 hover:bg-[#0396A6]/20 transition-all"
                        >
                          GENERATE AI PROFILE
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Metadata</span>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between bg-muted/10 p-2 rounded">
                        <span className="text-muted-foreground">Channel</span>
                        <span className="font-bold text-[#0396A6]">WhatsApp</span>
                      </div>
                      <div className="flex justify-between bg-muted/10 p-2 rounded">
                        <span className="text-muted-foreground">Mode</span>
                        <span className="font-bold text-foreground">
                          {sessions.find(s => s.session_id === activeContactId)?.bot_paused ? 'Manual' : 'AI Autonomous'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ——— TAB 3: LEADS ——— */}
      {hubTab === 'leads' && (
        <div className="bg-background p-6 rounded-2xl border border-border shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">WhatsApp Captured Leads</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Leads gathered autonomously during WhatsApp conversations</p>
            </div>
            <span className="text-xs font-bold text-[#0396A6] bg-[#EAF8F8] px-2.5 py-1 rounded-full border border-[#D9EDEE]">
              {leadsList.length || sessions.length} Total Leads
            </span>
          </div>

          <div className="space-y-3">
            {leadsList.length > 0 ? (
              leadsList.map((lead) => (
                <div key={lead.id} className="p-4 rounded-xl border border-border/60 bg-muted/10 flex items-center justify-between hover:border-[#0396A6]/40 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EAF8F8] text-[#0396A6] font-bold text-xs flex items-center justify-center border border-[#D9EDEE]">
                      {(lead.name || lead.phone || 'L').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{lead.name || lead.phone || `Lead #${lead.id}`}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {lead.email && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail size={10} /> {lead.email}</span>}
                        {lead.phone && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone size={10} /> {lead.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${lead.temperature === 'hot' ? 'bg-red-100 text-red-700' : lead.temperature === 'warm' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {lead.temperature || 'Warm'} Intent
                    </span>
                    <span className="text-[10px] font-bold uppercase bg-muted/40 text-muted-foreground px-2 py-0.5 rounded">
                      {lead.status || 'New'}
                    </span>
                  </div>
                </div>
              ))
            ) : sessions.length > 0 ? (
              sessions.map((s, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border/60 bg-muted/10 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border transition-colors bg-[#EAF8F8] text-[#0396A6] border-[#D9EDEE] group-hover:bg-[#D9EDEE] group-hover:text-[#028391]">
                      {(() => {
                        const name = formatContactLabel(s.contact_label, { channel: "whatsapp" });
                        const isGeneric = name === 'WhatsApp contact' || name === 'Visitor' || name.startsWith('#WEB-') || name.replace(/[^a-zA-Z]/g, '').length < 2;
                        return isGeneric ? <UserIcon size={18} strokeWidth={2.5} /> : getInitials(name);
                      })()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">+{s.session_id}</h4>
                      <span className="text-[10px] text-muted-foreground">Discovered via WhatsApp Assistant</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveContactId(s.session_id);
                      if (onHubTabChange) onHubTabChange('chats');
                    }}
                    className="px-3 py-1 text-xs font-bold bg-[#0396A6] text-white rounded-lg hover:bg-[#5D21CB] transition-colors"
                  >
                    View Chat
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border border-dashed rounded-xl bg-muted/20">
                <p className="text-xs text-muted-foreground font-medium">No leads captured on WhatsApp yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* â”€â”€â”€ TAB 4: MEETINGS â”€â”€â”€ */}
      {hubTab === 'meetings' && (
        <div className="bg-background p-6 rounded-2xl border border-border shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">Scheduled WhatsApp Meetings</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Appointments booked directly through the AI Assistant</p>
            </div>
            <span className="text-xs font-bold text-muted-foreground">{meetingsList.length} Scheduled</span>
          </div>

          {meetingsList.length > 0 ? (
            <div className="space-y-3">
              {meetingsList.map(m => (
                <div key={m.id} className="p-4 rounded-xl border border-border/60 bg-muted/10 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-foreground">{m.title}</h4>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Clock size={12} /> {new Date(m.scheduled_start).toLocaleString()}
                    </p>
                    {m.attendee_name && (
                      <p className="text-[10px] text-muted-foreground">Attendee: {m.attendee_name} ({m.attendee_email || m.attendee_phone})</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                      {m.status}
                    </span>
                    {m.meet_link && (
                      <a href={m.meet_link} target="_blank" rel="noreferrer" className="px-3 py-1 bg-[#0396A6] text-white text-xs font-bold rounded-lg flex items-center gap-1">
                        Join <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center text-center opacity-70">
              <Calendar size={36} className="text-[#0396A6] mb-2" />
              <p className="text-xs font-bold text-foreground">No meetings scheduled for today</p>
              <p className="text-[11px] text-muted-foreground mt-1">When users book calendar calls on WhatsApp, they will be listed here.</p>
            </div>
          )}
        </div>
      )}

      {/* â”€â”€â”€ TAB 5: SETTINGS â”€â”€â”€ */}
      {hubTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Sub-navigation tabs */}
          <div className="flex gap-3 bg-muted/20 p-1.5 rounded-xl border border-border/60 w-fit">
            {[
              { id: 'persona', label: 'AI Persona' },
              { id: 'connection', label: 'Meta Connection' },
              { id: 'messaging', label: 'Automated Messaging' },
              { id: 'templates', label: 'Message Templates' },
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setActiveSettingTab(sub.id as any)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSettingTab === sub.id
                    ? 'bg-background text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* AI Persona Sub-tab */}
          {activeSettingTab === 'persona' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left Column: Heading & Preview Card */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-foreground tracking-tight leading-snug">
                    Define Your<br />WhatsApp AI Identity.
                  </h2>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Configure the name, conversational tone, and response persona for your WhatsApp assistant.
                  </p>
                </div>

                {/* Preview Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#EAF8F8] to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-[#D9EDEE] shadow-sm space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-[#0396A6] text-white flex items-center justify-center shadow-md">
                      <Bot size={22} />
                    </div>
                    <span className="text-[10px] font-extrabold tracking-wider text-[#0396A6] bg-white dark:bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-200 uppercase">
                      {cfg.tone}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">WHATSAPP ASSISTANT</span>
                    <h4 className="text-xl font-extrabold text-foreground mt-0.5">{cfg.bot_name || 'Frosty'}</h4>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-2 block">CHANNEL: WHATSAPP</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Form */}
              <div className="lg:col-span-7 bg-background p-6 rounded-2xl border border-border shadow-sm space-y-6">
                {isLoadingConfig && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw size={12} className="animate-spin" /> Loading saved configurationâ€¦
                  </div>
                )}

                {/* BOT NAME */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">BOT NAME</label>
                  <input
                    type="text"
                    value={cfg.bot_name}
                    onChange={e => setCfg({ ...cfg, bot_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:border-[#0396A6]"
                    placeholder="Frosty"
                  />
                </div>

                {/* CONVERSATIONAL TONE */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CONVERSATIONAL TONE</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['PROFESSIONAL', 'FRIENDLY', 'CASUAL'].map(tone => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setCfg({ ...cfg, tone })}
                        className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${cfg.tone.toUpperCase() === tone
                            ? 'bg-[#0396A6]/10 border-[#0396A6] text-[#0396A6]'
                            : 'bg-muted/10 border-border text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PROFILE / INSTRUCTIONS */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">PROFILE / INSTRUCTIONS</label>
                  <textarea
                    rows={5}
                    value={cfg.persona}
                    onChange={e => setCfg({ ...cfg, persona: e.target.value })}
                    className="w-full p-4 bg-muted/20 border border-border rounded-xl text-xs text-foreground outline-none focus:border-[#0396A6] placeholder:text-muted-foreground"
                    placeholder="Define the AI assistant logic on WhatsApp..."
                  />
                </div>

                {/* SAVE BUTTON */}
                <button
                  onClick={handleSaveConfig}
                  disabled={isSavingCfg || isLoadingConfig}
                  className="w-full py-3.5 bg-[#0396A6] hover:bg-[#5D21CB] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSavingCfg ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} SAVE AI IDENTITY & PUBLISH
                </button>
              </div>

            </div>
          )}

          {/* Meta Connection Sub-tab */}
          {activeSettingTab === 'connection' && (
            <div className="space-y-6 max-w-2xl">
              {/* Connected Accounts List */}
              <div className="bg-background p-6 rounded-2xl border border-border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${connectedAccounts.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                    <h3 className="text-sm font-bold text-foreground tracking-tight">Connected WhatsApp Numbers</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-[#EAF8F8] text-[#0396A6] font-extrabold text-[10px] uppercase rounded-full tracking-wider">
                      {connectedAccounts.length} {connectedAccounts.length === 1 ? 'Number' : 'Numbers'} Connected
                    </span>
                    <button
                      type="button"
                      onClick={() => void fetchWaAccounts()}
                      className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground"
                      title="Refresh connected numbers"
                      aria-label="Refresh connected numbers"
                    >
                      <RefreshCw size={14} className={accountsLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                      onClick={() => setShowUpdateForm(prev => !prev)}
                      className="px-3 py-1 bg-[#0396A6] hover:bg-[#5D21CB] text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1"
                    >
                      {showUpdateForm ? "Cancel" : "âž• Add Number"}
                    </button>
                  </div>
                </div>

                {accountsError ? (
                  <p className="text-xs text-red-600 py-2 px-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    {accountsError}
                  </p>
                ) : null}

                {accountsLoading ? (
                  <p className="text-xs text-muted-foreground py-4 text-center flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin" /> Loading connected numbersâ€¦
                  </p>
                ) : connectedAccounts.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    {connectedAccounts.map((acc) => (
                      <div key={acc.id} className="p-4 bg-muted/20 border border-border rounded-xl space-y-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground">
                              {acc.label || acc.phone_number || `WhatsApp Line (${acc.phone_number_id.slice(-4)})`}
                            </span>
                            {acc.is_default ? (
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 font-extrabold text-[9px] uppercase rounded-md tracking-wider">
                                Default Number
                              </span>
                            ) : null}
                            <span className={`px-2 py-0.5 font-extrabold text-[9px] uppercase rounded-md tracking-wider ${acc.is_active
                                ? 'bg-emerald-500/20 text-emerald-600'
                                : 'bg-amber-500/20 text-amber-700'
                              }`}>
                              {acc.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <span className="capitalize text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded shrink-0">
                            Quality: {acc.quality_rating || 'Unknown'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Phone Number ID</span>
                            <span className="font-mono text-foreground font-semibold">{acc.phone_number_id}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase block">WABA ID</span>
                            <span className="font-mono text-foreground font-semibold">{acc.waba_id}</span>
                          </div>
                          {acc.phone_number ? (
                            <div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Display Number</span>
                              <span className="font-mono text-foreground font-semibold">{acc.phone_number}</span>
                            </div>
                          ) : null}
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Connected</span>
                            <span className="text-foreground font-semibold">
                              {new Date(acc.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                          {!acc.is_default ? (
                            <button
                              onClick={() => handleSetDefaultAccount(acc.id)}
                              className="text-xs font-bold text-[#0396A6] hover:underline flex items-center gap-1"
                            >
                              â­ Set as Default Number
                            </button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">Receives default outbound messages</span>
                          )}
                          <button
                            onClick={() => handleDisconnectAccount(acc.id)}
                            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold text-[11px] rounded-lg transition-colors"
                          >
                            Disconnect Number
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !accountsError ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No WhatsApp numbers connected yet. Click <strong>&quot;âž• Add Number&quot;</strong> below to connect your Meta Cloud API credentials.
                  </p>
                ) : null}
              </div>

              {/* Cloud API Credentials Form */}
              {(connectedAccounts.length === 0 || showUpdateForm) && (
                <div className="bg-background p-6 rounded-2xl border border-[#0396A6]/30 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div>
                    <h3 className="text-sm font-bold text-foreground tracking-tight">
                      Connect Meta WhatsApp Account
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Connect a new WhatsApp Business number to your AI Agent using Meta Cloud API credentials.
                    </p>
                  </div>

                  {connectionError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-medium">
                      âš ï¸ {connectionError}
                    </div>
                  )}

                  <div className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Account Label (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Sales Line - India or Customer Support"
                        value={credentials.label}
                        onChange={e => setCredentials({ ...credentials, label: e.target.value })}
                        className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl text-xs text-foreground outline-none focus:border-[#0396A6]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Phone Number ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 1087073191148693"
                        value={credentials.phone_number_id}
                        onChange={e => setCredentials({ ...credentials, phone_number_id: e.target.value })}
                        className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl text-xs text-foreground font-mono outline-none focus:border-[#0396A6]"
                      />
                      <span className="text-[10px] text-muted-foreground">Found in Meta Developer Portal â†’ WhatsApp â†’ API Setup</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">WhatsApp Business Account ID (WABA ID)</label>
                      <input
                        type="text"
                        placeholder="e.g. 102290828860727"
                        value={credentials.waba_id}
                        onChange={e => setCredentials({ ...credentials, waba_id: e.target.value })}
                        className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl text-xs text-foreground font-mono outline-none focus:border-[#0396A6]"
                      />
                      <span className="text-[10px] text-muted-foreground">Found in Meta Business Manager â†’ WhatsApp Accounts</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Permanent Access Token (System User Token)</label>
                      <input
                        type="password"
                        placeholder="EAAG..."
                        value={credentials.access_token}
                        onChange={e => setCredentials({ ...credentials, access_token: e.target.value })}
                        className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl text-xs text-foreground font-mono outline-none focus:border-[#0396A6]"
                      />
                      <span className="text-[10px] text-muted-foreground">Generated in Meta Business Manager â†’ System Users â†’ Generate Token</span>
                    </div>

                    <button
                      onClick={handleSaveCredentials}
                      disabled={isSavingCredentials}
                      className="w-full py-2.5 bg-[#0396A6] hover:bg-[#087681] text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {isSavingCredentials ? <RefreshCw size={14} className="animate-spin" /> : null}
                      {isSavingCredentials ? "Connecting to Meta API..." : "Save Connection"}
                    </button>
                  </div>
                </div>
              )}

              {/* Webhook Instructions Card */}
              <div className="bg-background p-6 rounded-2xl border border-border shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#0396A6]" />
                  <span>Meta Webhook Configuration</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Paste these exact webhook settings in your Meta Developer Portal under <strong>WhatsApp â†’ Configuration â†’ Webhook</strong>:
                </p>
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 bg-muted/30 border border-border rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block font-sans">Callback URL</span>
                    <span className="text-foreground select-all font-semibold break-all">{webhookCallbackUrl}</span>
                  </div>
                  <div className="p-3 bg-muted/30 border border-border rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block font-sans">Verify Token</span>
                    <span className="text-foreground select-all font-semibold">{credentials.verify_token}</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-xl text-xs space-y-1 font-medium">
                  <p><strong>Steps to complete in Meta:</strong></p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Click <strong>Verify and Save</strong> in Meta Portal</li>
                    <li>Under Webhook Fields, click <strong>Subscribe</strong> next to <strong>messages</strong></li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Automated Messaging Sub-tab */}
          {activeSettingTab === 'messaging' && (
            <div className="bg-background p-6 rounded-2xl border border-border shadow-sm space-y-4 max-w-xl">
              <div>
                <h3 className="text-sm font-bold text-foreground">Automated Responders</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Custom fallback message when the knowledge base doesn't match an inquiry.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Fallback Message</label>
                <textarea
                  rows={3}
                  value={cfg.fallback_message}
                  onChange={e => setCfg({ ...cfg, fallback_message: e.target.value })}
                  className="w-full p-3 bg-muted/20 border border-border rounded-xl text-xs text-foreground outline-none focus:border-[#0396A6]"
                />
              </div>
              <button
                onClick={handleSaveConfig}
                disabled={isSavingCfg}
                className="px-4 py-2.5 bg-[#0396A6] hover:bg-[#087681] text-white text-xs font-bold rounded-xl flex items-center gap-2"
              >
                {isSavingCfg ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save Automation
              </button>
            </div>
          )}

          {/* Templates Sub-tab */}
          {activeSettingTab === 'templates' && (
            <div className="bg-background p-6 rounded-2xl border border-border shadow-sm space-y-6 max-w-4xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Message Templates</h3>
                  <p className="text-xs text-muted-foreground mt-1">Manage WhatsApp approved message templates synced from Meta</p>
                </div>
                <button
                  onClick={handleSyncTemplates}
                  disabled={isSyncingTemplates}
                  className="px-4 py-2 bg-[#0396A6] hover:bg-[#087681] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSyncingTemplates ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Sync from Meta
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-xl bg-muted/20 space-y-2">
                  <p className="text-xs text-muted-foreground">No message templates found.</p>
                  <p className="text-[11px] text-muted-foreground">Click <strong>Sync from Meta</strong> to pull your verified WhatsApp templates from Meta Business Manager.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(t => (
                    <div key={t.id} className="p-4 border border-border/80 rounded-xl bg-card space-y-2.5 shadow-sm">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold truncate pr-2 text-foreground">{t.template_name || (t as any).name}</h4>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-extrabold tracking-wider ${t.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {t.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>Category: <strong className="text-foreground capitalize">{t.category || 'Standard'}</strong></span>
                        <span>â€¢</span>
                        <span>Language: <strong className="text-foreground uppercase">{t.language || 'en'}</strong></span>
                      </div>
                      {t.meta_template_id && (
                        <div className="text-[10px] text-muted-foreground font-mono">
                          Meta ID: {t.meta_template_id}
                        </div>
                      )}
                      {t.last_synced_at && (
                        <div className="text-[9px] text-muted-foreground">
                          Last Synced: {new Date(t.last_synced_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {waAgentId ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/60 px-5 py-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Trash2 size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-red-700 tracking-tight">Delete this agent</h3>
                  <p className="text-xs text-red-700/80 mt-1 leading-relaxed">
                    Removes <span className="font-bold">{cfg.bot_name || 'this agent'}</span> from your workspace.
                    It will stop answering on WhatsApp. Past conversations stay in history.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <Trash2 size={14} /> Delete agent
              </button>
            </div>
          ) : null}

        </div>
      )}

      <ConfirmModal
        isOpen={deleteOpen}
        tone="danger"
        title="Delete this agent?"
        message={`“${cfg.bot_name || 'This agent'}” will be removed from WA Agent and stop taking live traffic. This cannot be undone from the dashboard.`}
        confirmText={deleting ? 'Deleting…' : 'Delete agent'}
        cancelText="Keep agent"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDeleteAgent()}
      />

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-foreground">Launch New Conversation</h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleNewChat} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Recipient Phone Number</label>
                <input
                  type="text"
                  placeholder="919876543210"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-xl text-xs text-foreground mt-1 outline-none focus:border-[#0396A6]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Initial Message</label>
                <textarea
                  rows={3}
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="w-full p-3 bg-muted/20 border border-border rounded-xl text-xs text-foreground mt-1 outline-none focus:border-[#0396A6]"
                />
              </div>
              <button type="submit" disabled={sendingNewChat} className="w-full py-3 bg-[#0396A6] hover:bg-[#087681] text-white font-bold rounded-xl text-xs flex justify-center items-center gap-2">
                {sendingNewChat ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />} START CHATTING
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}