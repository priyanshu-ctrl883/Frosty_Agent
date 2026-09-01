'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Bot, ShieldCheck, Zap, AlertTriangle, CheckCircle2,
  XCircle, CheckSquare, Clock, RefreshCw, Save, Info,
  Sliders, Users, FileText, ArrowRight, Mail,
  ChevronRight, Shield, Check, Ban, UserCheck, Calendar,
  MessageSquare, FileSpreadsheet, Timer, RotateCcw
} from 'lucide-react';
import { apiRequest, ApiClientError } from '@/lib/api';
import type {
  MerchantSettings, AutomationPoliciesResponse,
  AgentActionRequest, ToolMode
} from '@/lib/types';
import { parseServerNotificationPrefs } from '@/lib/notificationPrefs';
import { useToast } from '@/lib/toast';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { MetaCapiSettingsPanel } from '@/components/settings/MetaCapiSettingsPanel';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface AutomationGuardrailsTabProps {
  settings: MerchantSettings;
  policies: AutomationPoliciesResponse['policies'];
  pendingReqs: AgentActionRequest[];
  canConfig: boolean;
  readOnly: boolean;
  onRefresh: () => Promise<void>;
}

const OUTSIDE_HOURS_OPTIONS = [
  { value: 'ai_assistant', label: 'Full AI Assistant (Respond normally 24/7)' },
  { value: 'take_details_only', label: 'Lead Capture Only (Collect contact & resume tomorrow)' },
  { value: 'offline_notice', label: 'Offline Notice (Display operating hours notice)' },
];

const MODE_CONFIG: Record<ToolMode, { label: string; shortLabel: string; desc: string; badge: string; color: string; icon: typeof Bot }> = {
  ai: {
    label: 'AI Autonomous',
    shortLabel: 'Autonomous',
    desc: 'Executes immediately via AI runtime without human gating.',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    color: '#0396A6',
    icon: Bot,
  },
  human: {
    label: 'Human Approval',
    shortLabel: 'Approval',
    desc: 'Intercepted and held in Pending Approvals queue for review.',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    color: '#D97706',
    icon: UserCheck,
  },
  off: {
    label: 'Disabled',
    shortLabel: 'Disabled',
    desc: 'Tool execution blocked; graceful fallback provided.',
    badge: 'bg-red-50 text-red-700 border-red-200',
    color: '#DC2626',
    icon: Ban,
  },
};

const TOOL_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  meetings: Calendar,
  quotes: FileSpreadsheet,
  whatsapp_broadcast: MessageSquare,
  default: Bot,
};

export function AutomationGuardrailsTab({
  settings,
  policies: initialPolicies,
  pendingReqs,
  canConfig,
  readOnly,
  onRefresh,
}: AutomationGuardrailsTabProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  // ── Policies State ──
  const [policies, setPolicies] = useState<AutomationPoliciesResponse['policies']>(initialPolicies || []);
  const [isPoliciesDirty, setIsPoliciesDirty] = useState(false);

  // ── Automation Controls State ──
  const [autoQuoteSending, setAutoQuoteSending] = useState(settings.autonomous_quote_sending === true);
  const [requireLeadVerification, setRequireLeadVerification] = useState(
    settings.require_lead_verification === true
  );
  const [handoffEmailNotify, setHandoffEmailNotify] = useState(
    () => parseServerNotificationPrefs(settings.notification_prefs as Record<string, unknown> | null).handoff
  );
  const [outsideHoursAction, setOutsideHoursAction] = useState<string>(
    (settings.business_hours as any)?.outside_hours_action || 'ai_assistant'
  );
  const [idleTimeout, setIdleTimeout] = useState<number>(
    (settings.business_hours as any)?.idle_timeout_minutes || 5
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isJustSaved, setIsJustSaved] = useState(false);

  // ── Pending Approvals Pagination State ──
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);

  // Synchronize state on settings/policies update
  useEffect(() => {
    setPolicies(initialPolicies || []);
    setIsPoliciesDirty(false);
    setAutoQuoteSending(settings.autonomous_quote_sending === true);
    setRequireLeadVerification(settings.require_lead_verification === true);
    setOutsideHoursAction((settings.business_hours as any)?.outside_hours_action || 'ai_assistant');
    setIdleTimeout((settings.business_hours as any)?.idle_timeout_minutes || 5);
    setHandoffEmailNotify(
      parseServerNotificationPrefs(settings.notification_prefs as Record<string, unknown> | null).handoff
    );
  }, [settings, initialPolicies]);

  // Compute Paginated Requests
  const totalRequests = pendingReqs.length;
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    return pendingReqs.slice(start, start + pageSize);
  }, [pendingReqs, page, pageSize]);

  // Adjust page if totalItems drops below current page bounds
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalRequests / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [totalRequests, pageSize, page]);

  // Check if automation controls are dirty
  const isAutomationDirty = useMemo(() => {
    const initBh = (settings.business_hours as Record<string, any>) || {};
    const initAutoQuote = settings.autonomous_quote_sending === true;
    const initRequireLeadVerification = settings.require_lead_verification === true;
    const initOutsideAction = initBh.outside_hours_action || 'ai_assistant';
    const initTimeout = initBh.idle_timeout_minutes || 5;

    const initHandoff = parseServerNotificationPrefs(
      settings.notification_prefs as Record<string, unknown> | null
    ).handoff;

    return (
      autoQuoteSending !== initAutoQuote ||
      requireLeadVerification !== initRequireLeadVerification ||
      outsideHoursAction !== initOutsideAction ||
      idleTimeout !== initTimeout ||
      handoffEmailNotify !== initHandoff
    );
  }, [settings, autoQuoteSending, requireLeadVerification, outsideHoursAction, idleTimeout, handoffEmailNotify]);

  const isDirty = isPoliciesDirty || isAutomationDirty;

  // Update policy mode
  const handleSetMode = (controlKey: string, mode: ToolMode) => {
    if (!canConfig || readOnly) return;
    setPolicies(rows =>
      rows.map(p => (p.control_key === controlKey ? { ...p, mode } : p))
    );
    setIsPoliciesDirty(true);
  };

  const handleHandoffEnabled = (enabled: boolean) => {
    handleSetMode('handoff', enabled ? 'ai' : 'off');
  };

  const handleDiscard = useCallback(() => {
    setPolicies(initialPolicies || []);
    setIsPoliciesDirty(false);
    setAutoQuoteSending(settings.autonomous_quote_sending === true);
    setRequireLeadVerification(settings.require_lead_verification === true);
    setOutsideHoursAction((settings.business_hours as any)?.outside_hours_action || 'ai_assistant');
    setIdleTimeout((settings.business_hours as any)?.idle_timeout_minutes || 5);
    setHandoffEmailNotify(
      parseServerNotificationPrefs(settings.notification_prefs as Record<string, unknown> | null).handoff
    );
    toastSuccess('Unsaved automation changes discarded.');
  }, [initialPolicies, settings, toastSuccess]);

  const handleSaveAll = useCallback(async () => {
    if (!canConfig || readOnly) {
      toastError('You do not have permission to update workspace configuration.');
      return;
    }

    setIsSaving(true);
    try {
      const promises: Promise<any>[] = [];

      if (isPoliciesDirty) {
        promises.push(
          apiRequest<AutomationPoliciesResponse>('/v1/automation/policies', {
            method: 'PUT',
            body: {
              policies: policies.map(p => ({
                control_key: p.control_key,
                mode: p.control_key === 'handoff' && p.mode === 'human' ? 'ai' : p.mode,
              })),
            },
          })
        );
      }

      if (isAutomationDirty) {
        const currentBh = (settings.business_hours as Record<string, any>) || {};
        const updatedBh = {
          ...currentBh,
          outside_hours_action: outsideHoursAction,
          idle_timeout_minutes: idleTimeout,
        };
        const currentPrefs = (settings.notification_prefs as Record<string, unknown> | null) || {};

        promises.push(
          apiRequest('/v1/settings', {
            method: 'PATCH',
            body: {
              autonomous_quote_sending: autoQuoteSending,
              require_lead_verification: requireLeadVerification,
              business_hours: updatedBh,
              notification_prefs: {
                ...currentPrefs,
                handoff: handoffEmailNotify,
              },
            },
          })
        );
      }

      await Promise.all(promises);
      setIsPoliciesDirty(false);
      await onRefresh();
      toastSuccess('Automation settings & guardrail policies saved successfully.');
      setIsJustSaved(true);
      setTimeout(() => setIsJustSaved(false), 2500);
    } catch (err: any) {
      console.error('Failed to save automation settings', err);
      toastError(err?.message || 'Failed to save automation settings.');
    } finally {
      setIsSaving(false);
    }
  }, [
    canConfig, readOnly, isPoliciesDirty, isAutomationDirty,
    policies, settings, outsideHoursAction, idleTimeout, autoQuoteSending,
    requireLeadVerification, handoffEmailNotify, onRefresh, toastError, toastSuccess
  ]);

  // Keyboard shortcut Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && !isSaving && !readOnly && canConfig) {
          handleSaveAll();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, isSaving, readOnly, canConfig, handleSaveAll]);

  // Queue Approval Handlers
  const handleApprove = async (id: string) => {
    if (actioningId) return;
    setActioningId(id);
    try {
      await apiRequest(`/v1/automation/requests/${id}/approve`, { method: 'POST' });
      toastSuccess('Action request approved and dispatched.');
      await onRefresh();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.status === 409) {
        toastSuccess('This request was already processed.');
        await onRefresh();
      } else {
        toastError(err?.message || 'Failed to approve request.');
      }
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (actioningId) return;
    setActioningId(id);
    try {
      await apiRequest(`/v1/automation/requests/${id}/reject`, { method: 'POST' });
      toastSuccess('Action request rejected.');
      await onRefresh();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.status === 409) {
        toastSuccess('This request was already processed.');
        await onRefresh();
      } else {
        toastError(err?.message || 'Failed to reject request.');
      }
    } finally {
      setActioningId(null);
      setRejectTarget(null);
    }
  };

  const onRejectClick = (id: string, name: string) => {
    setRejectTarget({ id, name });
  };

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden space-y-5 sm:space-y-7 pb-6 sm:pb-8 animate-in fade-in duration-300">
      {/* ── HERO BANNER: AUTONOMY & GUARDRAILS ── */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-[#D9EDEE] p-4 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-5">
          <ShieldCheck size={28} className="text-[#0396A6] shrink-0" />

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">
                Automation &amp; Tool Guardrails
              </h1>
              <span className="text-xs font-semibold text-muted-foreground">
                {totalRequests} Actions Pending
              </span>
              <span className="text-xs font-semibold text-[#0396A6]">
                {policies.length} Policies Active
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
              Define execution boundaries, high-stakes human approval requirements, and timeout behaviors for autonomous AI actions.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: MERCHANT WORKFLOW AUTOMATION ── */}
      <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 sm:pb-4 border-b border-[#EAF2F2]">
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-[#0396A6] shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                Merchant Workflow Automation
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Automated quotation generation, business-hour fallbacks, and human agent handoff triggers.
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-muted-foreground">
            Workflow Triggers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Autonomous Quote Sending */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] flex items-start justify-between gap-4 hover:border-[#BCE3E5] transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-foreground">Autonomous Quote Sending</span>
                <span className="text-xs font-semibold text-[#0396A6]">
                  Sales
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When enabled, calculated PDF sales proposals and itemized quotations are dispatched directly to visitors without waiting for manual team approval.
              </p>
            </div>

            {/* Standard Accessible Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={autoQuoteSending}
              onClick={() => canConfig && !readOnly && setAutoQuoteSending(!autoQuoteSending)}
              disabled={!canConfig || readOnly}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0396A6]/30 focus:ring-offset-1 ${
                autoQuoteSending ? 'bg-[#0396A6]' : 'bg-zinc-300'
              } ${!canConfig || readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Toggle autonomous quote sending"
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  autoQuoteSending ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Lead email verification (no OTP) — toggle gates email confirm only (D270 Option A) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] flex items-start justify-between gap-4 hover:border-[#BCE3E5] transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-foreground">Require Lead Email Verification</span>
                <span className="text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/20">
                  CRM
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Off by default. When on, a confirm link is emailed at lead capture (no phone OTP). Does not block chat or page load.
                Format, WhatsApp channel, and reachable grades are always computed for CRM — this toggle only controls the email confirm step.
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-0.5">
                Reachable means the number exists on WhatsApp. It does not guarantee that the person who submitted the form owns the number.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={requireLeadVerification}
              onClick={() => canConfig && !readOnly && setRequireLeadVerification(!requireLeadVerification)}
              disabled={!canConfig || readOnly}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0396A6]/30 focus:ring-offset-1 ${
                requireLeadVerification ? 'bg-[#0396A6]' : 'bg-zinc-300'
              } ${!canConfig || readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Toggle require lead email verification"
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  requireLeadVerification ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Handoff email notification */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] flex items-start justify-between gap-4 hover:border-[#BCE3E5] transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#0396A6]" />
                <span className="text-xs sm:text-sm font-bold text-foreground">Handoff Email Alerts</span>
                <span className="text-xs font-semibold text-[#0396A6]">
                  Human Escalation
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Email your connected Google account or workspace owner when a visitor asks for human assistance.
                Uses the same toggle as Notifications → Human Handoff Request Email.
              </p>
            </div>
            <input
              type="checkbox"
              className="toggle shrink-0"
              checked={handoffEmailNotify}
              onChange={(e) => setHandoffEmailNotify(e.target.checked)}
              disabled={!canConfig || readOnly}
              aria-label="Send email when a visitor requests human assistance"
            />
          </div>

          {/* Outside Hours Behavior */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] space-y-2 hover:border-[#BCE3E5] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-foreground">Outside-Hours Action</span>
              <span className="text-xs font-semibold text-muted-foreground">
                Schedule
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Define how your agents respond to incoming customer messages outside scheduled business hours.
            </p>
            <div className="pt-1">
              <Select
                value={outsideHoursAction}
                onChange={(val) => setOutsideHoursAction(String(val))}
                options={OUTSIDE_HOURS_OPTIONS}
                disabled={!canConfig || readOnly}
                fullWidth
                triggerClassName="!bg-white !border-[#D9EDEE] !rounded-xl !text-xs sm:!text-sm !font-semibold"
              />
            </div>
          </div>

          {/* Human Escalation Timeout */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] space-y-2.5 md:col-span-2 hover:border-[#BCE3E5] transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <span className="text-xs sm:text-sm font-bold text-foreground">Agent Inactivity &amp; Handoff Idle Timeout</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  If a claimed human agent does not reply to a customer within this window, the AI assistant automatically resumes conversation management.
                </p>
              </div>
              <span className="self-start sm:self-auto text-xs font-semibold text-[#0396A6] shrink-0">
                {idleTimeout} Minutes
              </span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <input
                type="range"
                min={2}
                max={30}
                value={idleTimeout}
                onChange={e => setIdleTimeout(parseInt(e.target.value, 10))}
                disabled={!canConfig || readOnly}
                className="flex-1 accent-[#0396A6] cursor-pointer h-2 bg-[#D9EDEE] rounded-lg"
              />
              <span className="text-[11px] text-muted-foreground font-semibold shrink-0">Range: 2–30 mins</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: AI TOOL GUARDRAILS & AUTONOMY POLICIES ── */}
      <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 sm:pb-4 border-b border-[#EAF2F2]">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-[#0396A6] shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                AI Tool Guardrails &amp; Autonomy Policies
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Set boundaries and human approval requirements for tool executions across all channels.
              </p>
            </div>
          </div>

          {/* Mode Legend with Rich Hover Info Tooltips */}
          <div className="flex items-center gap-2.5 sm:gap-4 text-xs font-semibold flex-wrap self-start sm:self-auto">
            {/* Autonomous */}
            <div className="relative group/tooltip cursor-help py-1">
              <span className="text-[#0396A6] flex items-center gap-1 hover:underline underline-offset-4 decoration-[#0396A6]/40 transition-colors">
                <Bot size={12} className="text-[#0396A6]" />
                <span>Autonomous</span>
              </span>
              <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 w-64 p-3 bg-white/95 backdrop-blur-md rounded-xl border border-[#D9EDEE] shadow-[0_8px_24px_rgba(0,0,0,0.12)] opacity-0 scale-95 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-200 ease-out z-30">
                <div className="flex items-center gap-2 pb-1.5 border-b border-[#EAF2F2]">
                  <Bot size={14} className="text-[#0396A6] shrink-0" />
                  <span className="text-xs font-bold text-foreground">Autonomous Execution</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed font-normal">
                  AI executes tool actions immediately in real-time without requiring human sign-off.
                </p>
              </div>
            </div>

            {/* Human Approval */}
            <div className="relative group/tooltip cursor-help py-1">
              <span className="text-muted-foreground hover:text-foreground flex items-center gap-1 hover:underline underline-offset-4 decoration-muted-foreground/40 transition-colors">
                <UserCheck size={12} className="text-[#0396A6]" />
                <span>Human Approval</span>
              </span>
              <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 w-64 p-3 bg-white/95 backdrop-blur-md rounded-xl border border-[#D9EDEE] shadow-[0_8px_24px_rgba(0,0,0,0.12)] opacity-0 scale-95 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-200 ease-out z-30">
                <div className="flex items-center gap-2 pb-1.5 border-b border-[#EAF2F2]">
                  <UserCheck size={14} className="text-[#0396A6] shrink-0" />
                  <span className="text-xs font-bold text-foreground">Human Approval Queue</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed font-normal">
                  Actions are intercepted and held in the Pending Approvals queue for review and sign-off before running.
                </p>
              </div>
            </div>

            {/* Disabled */}
            <div className="relative group/tooltip cursor-help py-1">
              <span className="text-muted-foreground hover:text-foreground flex items-center gap-1 hover:underline underline-offset-4 decoration-muted-foreground/40 transition-colors">
                <Ban size={12} className="text-[#0396A6]" />
                <span>Disabled</span>
              </span>
              <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 w-64 p-3 bg-white/95 backdrop-blur-md rounded-xl border border-[#D9EDEE] shadow-[0_8px_24px_rgba(0,0,0,0.12)] opacity-0 scale-95 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-200 ease-out z-30">
                <div className="flex items-center gap-2 pb-1.5 border-b border-[#EAF2F2]">
                  <Ban size={14} className="text-[#0396A6] shrink-0" />
                  <span className="text-xs font-bold text-foreground">Disabled Policy</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed font-normal">
                  Tool execution is blocked. The AI provides a graceful fallback response to the customer.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Rows */}
        <div className="space-y-3 sm:space-y-3.5">
          {policies.map(policy => {
            const currentMode = policy.mode;
            const ToolIcon = TOOL_ICONS[policy.control_key] || Bot;

            return (
              <div
                key={policy.control_key}
                className="p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] hover:border-[#BCE3E5] flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 transition-all"
              >
                <div className="min-w-0 space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ToolIcon size={16} className="text-[#0396A6] shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-foreground">{policy.label}</span>
                    <span className="text-xs font-mono font-medium text-muted-foreground">
                      {policy.control_key}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Web &amp; WhatsApp
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {policy.description || `Autonomy policy governing execution of ${policy.label}.`}
                  </p>
                </div>

                {policy.control_key === 'handoff' ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-muted-foreground">
                      {currentMode === 'off' ? 'Disabled' : 'Enabled'}
                    </span>
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={currentMode !== 'off'}
                      onChange={e => handleHandoffEnabled(e.target.checked)}
                      disabled={!canConfig || readOnly}
                      aria-label="Enable live human handoff"
                    />
                  </div>
                ) : (
                <div className="grid grid-cols-3 sm:flex sm:items-center gap-1 p-1 bg-white border border-[#D9EDEE] rounded-xl shrink-0 shadow-2xs">
                  {(['ai', 'human', 'off'] as ToolMode[]).map(mode => {
                    const isActive = currentMode === mode;
                    const ModeIcon = MODE_CONFIG[mode].icon;

                    return (
                      <div key={mode} className="relative group/btn-tooltip">
                        <button
                          type="button"
                          onClick={() => handleSetMode(policy.control_key, mode)}
                          disabled={!canConfig || readOnly}
                          className={`w-full sm:w-auto px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isActive
                              ? 'bg-[#0396A6] text-white shadow-2xs'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                          } ${!canConfig || readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <ModeIcon size={12} className={isActive ? 'text-white' : 'text-[#0396A6]'} />
                          <span>{MODE_CONFIG[mode].shortLabel}</span>
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-xl opacity-0 scale-95 pointer-events-none group-hover/btn-tooltip:opacity-100 group-hover/btn-tooltip:scale-100 transition-all duration-150 ease-out z-40 text-center">
                          <p className="text-[11px] font-bold text-white mb-0.5">{MODE_CONFIG[mode].label}</p>
                          <p className="text-[10px] text-slate-300 leading-tight font-normal">{MODE_CONFIG[mode].desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SECTION 3: PENDING APPROVALS QUEUE WITH PAGINATION ── */}
      <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-5 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 sm:pb-4 border-b border-[#EAF2F2]">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-[#0396A6] shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                Pending Approvals Queue {totalRequests > 0 && `(${totalRequests})`}
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                High-stakes actions intercepted by 'Human Approval' guardrails awaiting team review before execution.
              </p>
            </div>
          </div>

          {totalRequests > 0 && (
            <span className="self-start sm:self-auto text-xs font-semibold text-[#0396A6]">
              {totalRequests} Action{totalRequests === 1 ? '' : 's'} Pending
            </span>
          )}
        </div>

        {totalRequests === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[#F7F5F1] border border-dashed border-[#D9EDEE] space-y-2.5">
            <CheckSquare size={32} className="text-[#0396A6] mx-auto" />
            <h3 className="text-sm font-bold text-foreground">Approval Queue is Clear</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              When AI actions require human verification, intercepted requests will appear here in real time for approval or rejection.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedRequests.map(req => (
              <div
                key={req.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFC] border border-[#D9EDEE] hover:border-[#0396A6]/40 space-y-3 transition-all shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-semibold text-[#0396A6] uppercase">
                      {req.control_key}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-foreground font-mono">{req.tool_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(req.requested_at).toLocaleString()}
                  </span>
                </div>

                {req.resource_type && (
                  <div className="text-xs text-muted-foreground">
                    Target Resource: <code className="font-mono font-medium text-foreground bg-white px-2 py-0.5 rounded-lg border border-[#D9EDEE]">{req.resource_type} ({req.resource_id})</code>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleApprove(req.id)}
                    disabled={actioningId === req.id || !canConfig}
                    className="px-4 py-2 rounded-xl bg-[#0396A6] hover:bg-[#028391] text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    <CheckCircle2 size={14} className="text-white" /> Approve &amp; Execute
                  </button>
                  <button
                    type="button"
                    onClick={() => onRejectClick(req.id, req.tool_name)}
                    disabled={actioningId === req.id || !canConfig}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    <XCircle size={14} className="text-red-600" /> Reject Action
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalRequests > 0 && (
              <div className="pt-2">
                <Pagination
                  currentPage={page}
                  pageSize={pageSize}
                  totalItems={totalRequests}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                  itemLabel="requests"
                  className="rounded-xl border border-[#D9EDEE] bg-[#F7F5F1]"
                />
              </div>
            )}
          </div>
        )}
      </section>

      <MetaCapiSettingsPanel canConfig={canConfig} readOnly={readOnly} />

      {/* ── FIXED SAVE ACTION BAR ── */}
      <div className="fixed bottom-5 left-0 right-0 max-w-6xl mx-auto z-40 px-4 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 dark:bg-card/95 backdrop-blur-xl border border-[#D9EDEE] dark:border-border rounded-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.14),0_4px_16px_rgba(3,150,166,0.08)] ring-1 ring-black/[0.04] p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3.5 transition-all">
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {isDirty ? (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50/90 px-3.5 py-1.5 rounded-xl border border-amber-200 shadow-2xs animate-in zoom-in-95">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>You have unsaved automation &amp; guardrail changes</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground px-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>All automation &amp; guardrail policies are in sync</span>
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
            onClick={handleSaveAll}
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
                <Check size={15} className="stroke-[3] text-white" /> Settings Saved
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

      <ConfirmModal
        isOpen={rejectTarget !== null}
        title={rejectTarget ? `Reject ${rejectTarget.name}?` : 'Reject action?'}
        message="This will permanently reject the pending action. The visitor will not see a rejection reason."
        tone="danger"
        confirmText="Reject Action"
        cancelText="Cancel"
        onConfirm={() => {
          if (rejectTarget) void handleReject(rejectTarget.id);
        }}
        onClose={() => {
          if (!actioningId) setRejectTarget(null);
        }}
      />
    </div>
  );
}
