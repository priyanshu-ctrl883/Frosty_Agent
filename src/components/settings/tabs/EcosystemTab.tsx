'use client';

import React from 'react';
import Link from 'next/link';
import {
  Globe, Smartphone, Layers, Bot, Database, SlidersHorizontal,
  Clock, CheckCircle2, AlertCircle, ChevronRight, ExternalLink,
  ShieldCheck, Zap, Radio, RefreshCw, Lock, Link as LinkIcon,
  FileText, Check, Cpu, Activity, Calendar, Code2,
  FileCheck, Shield, MessageSquare, ArrowUpRight
} from 'lucide-react';
import type { Agent, CalendarStatus, WaAccount } from '@/lib/types';

interface EcosystemTabProps {
  agents: Agent[];
  waAccounts: WaAccount[];
  calendar: CalendarStatus | null;
  onNavigateTab?: (tabId: string, subTabId?: string) => void;
}

export function EcosystemTab({
  agents,
  waAccounts,
  calendar,
  onNavigateTab,
}: EcosystemTabProps) {
  const webAgent = agents.find(a => a.mode === 'website' || a.mode === 'unified') || null;
  const waAgent = agents.find(a => a.mode === 'whatsapp' || a.mode === 'unified') || null;

  const isWebActive = webAgent ? webAgent.is_active : false;
  const isWaConnected = waAccounts.length > 0;
  const isCalendarConnected = Boolean(calendar?.connected_providers && calendar.connected_providers.length > 0);

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden space-y-5 sm:space-y-7 pb-6 sm:pb-8 animate-in fade-in duration-300">
      {/* ── HERO ARCHITECTURE & ECOSYSTEM BANNER ── */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-[#D9EDEE] p-4 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-5">
          <Cpu size={28} className="text-[#0396A6] shrink-0" />

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">
                Ecosystem &amp; Architecture
              </h1>
              <span className="text-xs font-semibold text-muted-foreground">
                {agents.length} Configured
              </span>
              <span className="text-xs font-semibold text-[#0396A6]">
                Omnichannel Synced
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
              Centralized merchant hub. Channel-specific parameters are isolated inside dedicated agent dashboards.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: AI CONVERSATIONAL AGENTS ── */}
      <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 sm:pb-4 border-b border-[#EAF2F2]">
          <div className="flex items-center gap-3">
            <Bot size={20} className="text-[#0396A6] shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                AI Conversational Agents
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Active AI assistant channels deployed across your web storefront and messaging apps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-muted-foreground">
              {agents.length} Active
            </span>
          </div>
        </div>

        {/* Horizontal scroll on mobile (< lg), 3-column grid on desktop (lg:) */}
        <div className="min-w-0 max-w-full overflow-x-auto lg:overflow-visible no-scrollbar snap-x snap-mandatory flex lg:grid lg:grid-cols-3 gap-3.5 sm:gap-5 pb-1">
          {/* 1. Web Agent Card */}
          <div className="w-[min(84vw,320px)] lg:w-auto shrink-0 snap-start p-4 sm:p-6 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] hover:border-[#0396A6]/40 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group/card">
            <div className="space-y-3.5 sm:space-y-4">
              <div className="flex items-start justify-between gap-2">
                <Globe size={24} className="text-[#0396A6] shrink-0" />
                <span className="text-xs font-semibold text-[#0396A6]">
                  {isWebActive ? 'Live & Active' : 'Paused'}
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-[15px] font-bold text-foreground group-hover/card:text-[#0396A6] transition-colors">
                  {webAgent?.agent_name || 'Website Web Agent'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                  Interactive web chat assistant for website visitors, lead generation, and instant RAG knowledge responses.
                </p>
              </div>

              <div className="pt-2.5 sm:pt-3 border-t border-[#EAF2F2] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground text-[11px] sm:text-xs">
                  <span>Channel:</span>
                  <span className="font-semibold text-foreground">Embedded Widget</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[11px] sm:text-xs">
                  <span>Knowledge RAG:</span>
                  <span className="font-semibold text-[#0396A6]">
                    Connected
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#EAF2F2]">
              <Link
                href="/website?tab=settings"
                className="w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl bg-white hover:bg-[#0396A6] hover:text-white text-foreground border border-[#D9EDEE] hover:border-[#0396A6] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs group-hover/card:shadow-xs no-underline"
              >
                <span>Manage Web Agent</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {/* 2. WhatsApp Agent Card */}
          <div className="w-[min(84vw,320px)] lg:w-auto shrink-0 snap-start p-4 sm:p-6 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] hover:border-[#0396A6]/40 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group/card">
            <div className="space-y-3.5 sm:space-y-4">
              <div className="flex items-start justify-between gap-2">
                <Smartphone size={24} className="text-[#0396A6] shrink-0" />
                <span className="text-xs font-semibold text-[#0396A6]">
                  {isWaConnected ? `${waAccounts.length} Connected` : 'Not Connected'}
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-[15px] font-bold text-foreground group-hover/card:text-[#0396A6] transition-colors">
                  {waAgent?.agent_name || 'WhatsApp Business Agent'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                  Official Meta WhatsApp Cloud API integration for automated 24/7 messaging, client updates, and quote dispatch.
                </p>
              </div>

              <div className="pt-2.5 sm:pt-3 border-t border-[#EAF2F2] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground text-[11px] sm:text-xs">
                  <span>Lines Active:</span>
                  <span className="font-semibold text-foreground truncate max-w-[130px]">
                    {waAccounts.length > 0 ? waAccounts[0]?.phone_number || `${waAccounts.length} Line(s)` : 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[11px] sm:text-xs">
                  <span>Phone Quality:</span>
                  <span className="font-semibold text-[#0396A6]">
                    {waAccounts[0]?.quality_rating || 'HIGH'} Tier
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#EAF2F2]">
              <Link
                href="/whatsapp?tab=settings"
                className="w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl bg-white hover:bg-[#0396A6] hover:text-white text-foreground border border-[#D9EDEE] hover:border-[#0396A6] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs group-hover/card:shadow-xs no-underline"
              >
                <span>Manage WhatsApp Agent</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {/* 3. Unified Orchestrator Card */}
          <div className="w-[min(84vw,320px)] lg:w-auto shrink-0 snap-start p-4 sm:p-6 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] hover:border-[#0396A6]/40 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group/card">
            <div className="space-y-3.5 sm:space-y-4">
              <div className="flex items-start justify-between gap-2">
                <Layers size={24} className="text-[#0396A6] shrink-0" />
                <span className="text-xs font-semibold text-[#0396A6]">
                  Orchestrator
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-[15px] font-bold text-foreground group-hover/card:text-[#0396A6] transition-colors">
                  Unified Agent Brain
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                  Omnichannel memory synchronizing visitor context and qualification history seamlessly between Web &amp; WhatsApp.
                </p>
              </div>

              <div className="pt-2.5 sm:pt-3 border-t border-[#EAF2F2] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground text-[11px] sm:text-xs">
                  <span>Shared Memory:</span>
                  <span className="font-semibold text-[#0396A6]">
                    Active Sync
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[11px] sm:text-xs">
                  <span>Cross-Channel:</span>
                  <span className="font-semibold text-foreground">Enabled</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#EAF2F2]">
              <Link
                href="/unified"
                className="w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl bg-white hover:bg-[#0396A6] hover:text-white text-foreground border border-[#D9EDEE] hover:border-[#0396A6] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs group-hover/card:shadow-xs no-underline"
              >
                <span>Manage Orchestration</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: KNOWLEDGE BASE & RETRIEVAL PIPELINE ── */}
      <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 sm:pb-4 border-b border-[#EAF2F2]">
          <div className="flex items-center gap-3">
            <Database size={20} className="text-[#0396A6] shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                Knowledge Base &amp; Semantic Retrieval
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Centralized knowledge ingestion, documents, website scraping, and vector search health.
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-muted-foreground">
            Vector Indexing
          </span>
        </div>

        {/* Horizontal scroll on mobile (< sm), 3-column grid on desktop (sm:) */}
        <div className="min-w-0 max-w-full overflow-x-auto sm:overflow-visible no-scrollbar snap-x snap-mandatory flex sm:grid sm:grid-cols-3 gap-3 sm:gap-5 pb-1">
          <div className="w-[76vw] max-w-[280px] sm:max-w-none sm:w-auto shrink-0 snap-start p-3.5 sm:p-5 rounded-xl bg-[#F7F5F1] border border-[#D9EDEE] space-y-1.5">
            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Connected Documents &amp; URLs
            </span>
            <div className="text-base sm:text-lg font-bold text-foreground">Active</div>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              Documents, web pages, and product catalogs indexed into semantic vector storage.
            </p>
          </div>

          <div className="w-[76vw] max-w-[280px] sm:max-w-none sm:w-auto shrink-0 snap-start p-3.5 sm:p-5 rounded-xl bg-[#F7F5F1] border border-[#D9EDEE] space-y-1.5">
            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Sync &amp; Vector Index Health
            </span>
            <div className="text-base sm:text-lg font-bold text-[#0396A6]">
              Healthy
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              Automated RAG search threshold tau: 0.40, top-k: 6 semantic passages.
            </p>
          </div>

          <div className="w-[76vw] max-w-[280px] sm:max-w-none sm:w-auto shrink-0 snap-start p-3.5 sm:p-5 rounded-xl bg-[#F7F5F1] border border-[#D9EDEE] flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Knowledge Routing
              </span>
              <div className="text-xs sm:text-sm font-bold text-foreground mt-0.5">Multi-Channel Ingest</div>
            </div>
            <Link
              href="/website?tab=settings"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0396A6] hover:text-[#087681] transition-colors pt-1"
            >
              <span>Open Knowledge Manager</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CONNECTED ECOSYSTEM TOOLS ── */}
      <section className="group bg-white rounded-2xl border border-[#D9EDEE] hover:border-[#BCE3E5] p-4 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_6px_20px_rgba(3,150,166,0.03)] transition-all duration-200 space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-[#EAF2F2]">
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-[#0396A6] shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                Ecosystem Tools &amp; Capabilities
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Connected tools providing autonomous actions and integrations to all agents.
              </p>
            </div>
          </div>
        </div>

        {/* Horizontal scroll on mobile (< sm), 2-column grid on desktop (sm:) */}
        <div className="min-w-0 max-w-full overflow-x-auto sm:overflow-visible no-scrollbar snap-x snap-mandatory flex sm:grid sm:grid-cols-2 gap-3 sm:gap-5 pb-1">
          {/* Google Calendar */}
          <div className="w-[min(84vw,320px)] sm:w-auto shrink-0 snap-start p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] flex flex-col justify-between space-y-3 sm:space-y-4 hover:border-[#BCE3E5] transition-all">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <Calendar size={22} className="text-[#0396A6] shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-foreground">Google Calendar</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Autonomous meeting booking &amp; slot confirmation.</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#0396A6]">
                {isCalendarConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            <div className="pt-2.5 sm:pt-3 border-t border-[#EAF2F2] flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] text-muted-foreground">Google OAuth 2.0</span>
              <Link
                href="/meetings"
                className="text-xs font-bold text-[#0396A6] hover:underline inline-flex items-center gap-1"
              >
                <span>Manage Calendars</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {/* Web Chat Widget Customizer */}
          <div className="w-[min(84vw,320px)] sm:w-auto shrink-0 snap-start p-4 sm:p-5 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE] flex flex-col justify-between space-y-3 sm:space-y-4 hover:border-[#BCE3E5] transition-all">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <SlidersHorizontal size={22} className="text-[#0396A6] shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-foreground">Web Chat Widget Customizer</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Embed launcher snippet, live bubble, and custom colors.</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#0396A6]">
                Active
              </span>
            </div>

            <div className="pt-2.5 sm:pt-3 border-t border-[#EAF2F2] flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] text-muted-foreground">Snippet Ready</span>
              <Link
                href="/widget"
                className="text-xs font-bold text-[#0396A6] hover:underline inline-flex items-center gap-1"
              >
                <span>Customize Appearance</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
