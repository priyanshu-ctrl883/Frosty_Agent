"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Bot,
  Users,
  Target,
  Activity,
  Clock,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronUp,
  Plus,
  MessageCircle,
  Smartphone,
} from "lucide-react";
import {
  P,
  LeadsChart,
  ConvTrendChart,
  ConvMsgsChart,
  CreditUsageChart,
  TopicsDonut,
  ConversionFunnelDonut,
  PeakHoursChart,
  HeatmapChart,
  SessionInsightsGrid,
  BurnRateCard,
  CreditBalanceDonut,
} from "@/components/analytics/charts";
import { AgentSelector } from "@/components/analytics/AgentSelector";
import { AttributionCard } from "@/components/analytics/AttributionCard";
import {
  AnalyticsDateFilter,
  type DateRangeValue,
} from "@/components/analytics/AnalyticsDateFilter";
import type {
  AnalyticsOverview,
  AnalyticsCharts,
  AnalyticsUsage,
  Agent,
} from "@/lib/types";
import styles from "@/app/analytics/analytics.module.css";

const dayLabel = (isoDay: string) => isoDay.split("-").slice(1).join("/");

export interface AnalyticsViewProps {
  channel: "overview" | "website" | "whatsapp" | "unified";
  days: number;
  fromDate?: string;
  toDate?: string;
  onDateRangeChange?: (range: DateRangeValue) => void;
  onDaysChange: (days: number) => void;
  onRefresh: () => void;
  fetching: boolean;
  overview: AnalyticsOverview | null;
  chartsData: AnalyticsCharts | null;
  usageData: AnalyticsUsage | null;
  error?: string | null;
  partialWarn?: string | null;
  lastUpdated?: Date | null;
  agents?: Agent[];
  selectedAgentId?: string;
  onSelectAgent?: (agentId: string) => void;
}

export function AnalyticsView({
  channel,
  days,
  fromDate,
  toDate,
  onDateRangeChange,
  onDaysChange,
  onRefresh,
  fetching,
  overview,
  chartsData,
  usageData,
  error,
  partialWarn,
  lastUpdated,
  agents = [],
  selectedAgentId = "all",
  onSelectAgent,
}: AnalyticsViewProps) {
  const [showMoreMobile, setShowMoreMobile] = useState(false);

  // If agent channel tab has 0 agents configured
  const hasAgents = channel === "overview" || agents.length > 0;

  const totalConvs = overview?.conversations ?? chartsData?.sessions?.total_sessions ?? 0;
  const totalLeads = overview?.leads ?? chartsData?.sessions?.leads_captured ?? 0;
  const convRate = totalConvs > 0 ? Math.round((totalLeads / totalConvs) * 100) : 0;

  const msgByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of chartsData?.messages_by_day ?? []) {
      map.set(row.day, row.messages);
    }
    return map;
  }, [chartsData?.messages_by_day]);

  const axisDays =
    overview?.conversations_by_day?.map((d) => d.day) ??
    chartsData?.messages_by_day?.map((d) => d.day) ??
    chartsData?.conversion_trend?.by_day?.map((d) => d.day) ??
    [];

  const convByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of overview?.conversations_by_day ?? [])
      map.set(row.day, row.conversations);
    if (map.size === 0) {
      for (const row of chartsData?.conversion_trend?.by_day ?? [])
        map.set(row.day, row.conversations);
    }
    return map;
  }, [overview?.conversations_by_day, chartsData?.conversion_trend?.by_day]);

  const apiChartLabels = axisDays.map(dayLabel);
  const dynamicConvSeries = axisDays.map((day) => convByDay.get(day) ?? 0);
  const dynamicMsgSeries = axisDays.map((day) => msgByDay.get(day) ?? 0);

  const periodMsgsFromCharts = (chartsData?.messages_by_day ?? []).reduce(
    (a, b) => a + b.messages,
    0
  );
  const totalMsgs =
    chartsData != null
      ? periodMsgsFromCharts
      : overview?.total_messages ?? 0;

  const avgSession =
    chartsData?.sessions?.avg_msgs_per_session != null
      ? String(chartsData.sessions.avg_msgs_per_session)
      : totalConvs > 0
      ? (totalMsgs / totalConvs).toFixed(1)
      : "0.0";

  const peakHour =
    chartsData?.peak_hours?.peak_label?.split("·")[0]?.trim() || "-";

  const periodConvs = dynamicConvSeries.reduce((a, b) => a + b, 0);
  const periodMsgs = dynamicMsgSeries.reduce((a, b) => a + b, 0);

  const chargedCredits =
    usageData?.credits_charged !== undefined
      ? Math.round(usageData.credits_charged)
      : 0;
  const balanceCredits =
    usageData?.credits_balance !== undefined
      ? Math.round(usageData.credits_balance)
      : 0;

  const dynamicTopTopics = chartsData?.topics || {
    total: 0,
    items: [] as { label: string; count: number; color: string }[],
  };

  const dynamicLeads = {
    xLabels: chartsData?.leads?.by_day?.map((d) => dayLabel(d.day)) || [],
    newSeries: chartsData?.leads?.by_day?.map((d) => d.new) || [],
    followedSeries: chartsData?.leads?.by_day?.map((d) => d.followed) || [],
    periodLeads: chartsData?.leads?.period_leads || 0,
    followedUp: chartsData?.leads?.followed_up || 0,
  };

  const dynamicPeakHours = {
    bars: chartsData?.peak_hours?.by_hour || Array(24).fill(0),
    peakLabel: chartsData?.peak_hours?.peak_label || "-",
  };

  const dynamicSessionInsights = chartsData?.sessions
    ? [
        {
          label: "Total Sessions",
          val: String(chartsData.sessions.total_sessions),
          sub: "sessions",
          color: "#6366f1",
        },
        {
          label: "Leads Captured",
          val: String(chartsData.sessions.leads_captured),
          sub: "captured",
          color: P.amber,
        },
        {
          label: "Resolved",
          val: String(chartsData.sessions.resolved),
          sub: "closed status",
          color: P.teal,
        },
        {
          label: "Avg Msgs/Session",
          val: String(chartsData.sessions.avg_msgs_per_session),
          sub: "user+ai+agent",
          color: "#0ea5e9",
        },
        {
          label: "Engagement Score",
          val: `${chartsData.sessions.engagement_score_pct}%`,
          sub: "≥2 msgs / session",
          color: P.purpleDeep,
        },
        {
          label: "Busiest Day",
          val: chartsData.sessions.busiest_day,
          sub: "peak traffic (UTC)",
          color: P.rose,
        },
      ]
    : [];

  const dynamicConvTrend = {
    xLabels:
      chartsData?.conversion_trend?.by_day?.map((d) => dayLabel(d.day)) || [],
    series:
      chartsData?.conversion_trend?.by_day?.map((d) => d.rate_pct) || [],
    avgRate: `${chartsData?.conversion_trend?.avg_rate_pct || 0}%`,
    peakRate: `${chartsData?.conversion_trend?.peak_rate_pct || 0}%`,
  };

  const dynamicHeatmap =
    chartsData?.heatmap ||
    ([] as { dow: number; hour: number; count: number }[]);
  const burnRate = chartsData?.burn_rate_per_day || 0;

  const updatedLabel = lastUpdated
    ? `Updated ${lastUpdated.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} · cached ≤5m`
    : null;

  // Empty State for specific channel when no agents exist
  if (!hasAgents) {
    const emptyConfig = {
      website: {
        title: "No Web Agents Found",
        desc: "There are currently no Web Agents configured for this workspace.",
        actionLabel: "Create Web Agent",
        href: "/agents",
        icon: Bot,
      },
      whatsapp: {
        title: "No WhatsApp Agents Found",
        desc: "There are currently no WhatsApp Agents configured for this workspace.",
        actionLabel: "Connect WhatsApp Agent",
        href: "/whatsapp/connect",
        icon: MessageCircle,
      },
      unified: {
        title: "No Unified Agent Found",
        desc: "Combine Web and WhatsApp capabilities into a single Unified Agent.",
        actionLabel: "Create Unified Agent",
        href: "/unified",
        icon: Smartphone,
      },
    }[channel] || {
      title: "No Agents Found",
      desc: "There are no agents configured for this channel.",
      actionLabel: "View Agents",
      href: "/agents",
      icon: Bot,
    };

    const EmptyIcon = emptyConfig.icon;

    return (
      <div className="rounded-2xl border border-border bg-white dark:bg-zinc-900 p-10 sm:p-16 text-center flex flex-col items-center justify-center animate-in fade-in duration-150">
        <div className="text-[#0396A6] flex items-center justify-center mb-4">
          <EmptyIcon size={28} />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
          {emptyConfig.title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          {emptyConfig.desc}
        </p>
        <Link
          href={emptyConfig.href}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0396A6] hover:bg-[#027582] text-white text-xs font-bold transition-colors shadow-sm"
        >
          <Plus size={14} />
          <span>{emptyConfig.actionLabel}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {error ? (
        <div
          style={{
            padding: 16,
            background: "#fef2f2",
            border: "1px solid #ef4444",
            borderRadius: 12,
            color: "#ef4444",
            marginBottom: 24,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      {!error && partialWarn ? (
        <div
          style={{
            padding: 12,
            background: "#fffbeb",
            border: "1px solid #f59e0b",
            borderRadius: 12,
            color: "#92400e",
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          Some analytics data could not load: {partialWarn}
        </div>
      ) : null}

      {channel === "overview" ? (
        <AttributionCard days={days} />
      ) : channel === "website" || channel === "whatsapp" ? (
        <AttributionCard days={days} channel={channel} />
      ) : null}

      {fetching && !overview && !chartsData ? (
        <div className={styles.analyticsContainer} style={{ opacity: 0.7 }}>
          <div
            style={{
              height: 160,
              background: "#e5e7eb",
              borderRadius: 20,
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
          <div className={styles.analyticsGrid}>
            <div
              style={{
                height: 260,
                background: "#e5e7eb",
                borderRadius: 20,
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
            <div
              style={{
                height: 260,
                background: "#e5e7eb",
                borderRadius: 20,
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
          </div>
        </div>
      ) : (
        <>
          <div className={styles.filterBar}>
            <div className={styles.stickyFilterInner}>
              <div className={styles.stickyFilterControls}>
                <AnalyticsDateFilter
                  days={days}
                  fromDate={fromDate}
                  toDate={toDate}
                  disabled={fetching}
                  onChange={(range) => {
                    if (onDateRangeChange) {
                      onDateRangeChange(range);
                    } else {
                      onDaysChange(range.days);
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={onRefresh}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: `1px solid ${P.border}`,
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: P.textMuted,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                  title="Refresh data"
                >
                  <RefreshCw
                    size={14}
                    style={{
                      animation: fetching ? "spin 1s linear infinite" : "none",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className={styles.analyticsContainer}>
          {/* ── Hero Card with Title, Agent Dropdown & KPIs ────── */}
          <div className={styles.heroCard}>
            <div className={styles.heroHeader}>
              <div className={styles.heroTitleArea}>
                <div className="text-[#0396A6] flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-foreground truncate m-0">
                      {channel === "overview"
                        ? "Overview Analytics"
                        : channel === "website"
                        ? "Web Agent Analytics"
                        : channel === "whatsapp"
                        ? "WhatsApp Analytics"
                        : "Unified Agent Analytics"}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate m-0">
                    {updatedLabel || "Real-time insights and metrics"}
                  </p>
                </div>
              </div>

              {/* Controls: Agent Selector (if channel tab) */}
              <div className={styles.heroControls}>
                {channel !== "overview" && onSelectAgent && (
                  <AgentSelector
                    channel={channel}
                    agents={agents}
                    selectedAgentId={selectedAgentId}
                    onSelectAgent={onSelectAgent}
                    disabled={fetching}
                    className="w-full sm:w-auto"
                  />
                )}
              </div>
            </div>

            {/* 6 Hero KPI Metric Cards */}
            <div style={{ paddingBottom: 4 }}>
              <div className={styles.heroMetricsGrid}>
                {/* 1. Conversations */}
                <Link
                  href="/inbox"
                  className={styles.kpiTile}
                  title="Open inbox"
                >
                  <div className={styles.kpiIconWrap}>
                    <MessageSquare size={16} />
                  </div>
                  <div className={styles.kpiContent}>
                    <div className={styles.kpiLabel}>Conversations</div>
                    <div className={styles.kpiValue}>{totalConvs}</div>
                    <div className={styles.kpiSub}>sessions</div>
                  </div>
                </Link>

                {/* 2. Messages */}
                <div className={styles.kpiTile}>
                  <div className={styles.kpiIconWrap}>
                    <Bot size={16} />
                  </div>
                  <div className={styles.kpiContent}>
                    <div className={styles.kpiLabel}>Messages</div>
                    <div className={styles.kpiValue}>
                      {totalMsgs.toLocaleString()}
                    </div>
                    <div className={styles.kpiSub}>user + AI + agent</div>
                  </div>
                </div>

                {/* 3. Leads */}
                <Link
                  href="/leads"
                  className={styles.kpiTile}
                  title="Open leads"
                >
                  <div className={styles.kpiIconWrap}>
                    <Users size={16} />
                  </div>
                  <div className={styles.kpiContent}>
                    <div className={styles.kpiLabel}>Leads</div>
                    <div className={styles.kpiValue}>{totalLeads}</div>
                    <div className={styles.kpiSub}>captured</div>
                  </div>
                </Link>

                {/* 4. Conversion */}
                <div
                  className={styles.kpiTile}
                  title="Leads ÷ conversations for this period"
                >
                  <div className={styles.kpiIconWrap}>
                    <Target size={16} />
                  </div>
                  <div className={styles.kpiContent}>
                    <div className={styles.kpiLabel}>Conversion</div>
                    <div className={styles.kpiValue}>{convRate}%</div>
                    <div className={styles.kpiSub}>leads ÷ convs</div>
                  </div>
                </div>

                {/* 5. Avg/Session */}
                <div
                  className={styles.kpiTile}
                  title="Average user+AI+agent messages per conversation"
                >
                  <div className={styles.kpiIconWrap}>
                    <Activity size={16} />
                  </div>
                  <div className={styles.kpiContent}>
                    <div className={styles.kpiLabel}>Avg/Session</div>
                    <div className={styles.kpiValue}>{avgSession}</div>
                    <div className={styles.kpiSub}>messages</div>
                  </div>
                </div>

                {/* 6. Peak Hour */}
                <div
                  className={styles.kpiTile}
                  title={chartsData?.peak_hours?.peak_label || "Busiest UTC hour"}
                >
                  <div className={styles.kpiIconWrap}>
                    <Clock size={16} />
                  </div>
                  <div className={styles.kpiContent}>
                    <div className={styles.kpiLabel}>Peak Hour</div>
                    <div className={styles.kpiValue}>{peakHour}</div>
                    <div className={styles.kpiSub}>UTC · busiest</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Primary Charts Grid ────────────────────────────────────────── */}
          <div className={styles.analyticsGrid}>
            <div className={styles.chartCard} style={{ position: "relative" }}>
              <div className={styles.cardHeader}>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: P.textDark,
                    margin: 0,
                  }}
                >
                  Conversations & Messages
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    fontSize: 12,
                    color: P.textMuted,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: P.purpleDeep,
                      }}
                    />{" "}
                    Conversations
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: P.amber,
                      }}
                    />{" "}
                    Messages
                  </span>
                </div>
              </div>
              {apiChartLabels.length > 0 && (periodConvs > 0 || periodMsgs > 0) ? (
                <ConvMsgsChart
                  xLabels={apiChartLabels}
                  convSeries={
                    dynamicConvSeries.length
                      ? dynamicConvSeries
                      : apiChartLabels.map(() => 0)
                  }
                  msgSeries={dynamicMsgSeries}
                  periodConvs={periodConvs || totalConvs}
                  periodMsgs={periodMsgs || totalMsgs}
                  days={days}
                />
              ) : (
                <div
                  style={{
                    flex: 1,
                    minHeight: 200,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: P.purpleBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MessageSquare size={22} color={P.purpleLight} />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: P.textMuted,
                    }}
                  >
                    No conversation data yet
                  </span>
                  <span style={{ fontSize: 11, color: P.textMuted }}>
                    Series appear as traffic arrives
                  </span>
                </div>
              )}
            </div>

            <div className={styles.chartCard}>
              <div className={styles.cardHeader}>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: P.textDark,
                    margin: 0,
                  }}
                >
                  Top Topics
                </h3>
                <span
                  style={{ fontSize: 12, color: P.textMuted, fontWeight: 500 }}
                >
                  {dynamicTopTopics.items.length} categories
                </span>
              </div>
              {dynamicTopTopics.items.length > 0 ? (
                <TopicsDonut
                  items={dynamicTopTopics.items}
                  total={dynamicTopTopics.total}
                />
              ) : (
                <div
                  style={{
                    flex: 1,
                    minHeight: 200,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: P.purpleBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BarChart3 size={22} color={P.purpleLight} />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: P.textMuted,
                    }}
                  >
                    No topics yet
                  </span>
                  <span style={{ fontSize: 11, color: P.textMuted }}>
                    Topics appear as conversations come in
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Secondary Charts & Deep Analytics ──────────────────────────── */}
          <div
            className={
              showMoreMobile
                ? styles.moreChartsContainer
                : `${styles.moreChartsContainer} ${styles.moreChartsHidden}`
            }
          >
            <div className={styles.analyticsGridTriple}>
              <div className={styles.chartCard}>
                <div className={styles.cardHeader}>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: P.textDark,
                      margin: 0,
                    }}
                  >
                    <Link
                      href="/leads"
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      Leads
                    </Link>
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      fontSize: 11,
                      color: P.textMuted,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: P.amber,
                        }}
                      />{" "}
                      New
                    </span>
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: P.teal,
                        }}
                      />{" "}
                      Followed
                    </span>
                  </div>
                </div>
                {dynamicLeads.xLabels.length > 0 ? (
                  <LeadsChart
                    xLabels={dynamicLeads.xLabels}
                    newSeries={dynamicLeads.newSeries}
                    followedSeries={dynamicLeads.followedSeries}
                    periodLeads={dynamicLeads.periodLeads}
                    followedUp={dynamicLeads.followedUp}
                    days={days}
                  />
                ) : (
                  <div
                    style={{
                      flex: 1,
                      minHeight: 160,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: P.amberLight,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Users size={20} color={P.amber} />
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: P.textMuted,
                      }}
                    >
                      No leads data
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.chartCard}>
                <div className={styles.cardHeader}>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: P.textDark,
                      margin: 0,
                    }}
                  >
                    Conversion Funnel
                  </h3>
                  <span
                    style={{
                      fontSize: 12,
                      color: P.textMuted,
                      fontWeight: 500,
                    }}
                    title="Leads ÷ conversations"
                  >
                    {convRate}% period
                  </span>
                </div>
                {Number(totalConvs) > 0 || Number(totalLeads) > 0 ? (
                  <ConversionFunnelDonut
                    totalConvs={totalConvs}
                    totalLeads={totalLeads}
                  />
                ) : (
                  <div
                    style={{
                      flex: 1,
                      minHeight: 160,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: P.purpleBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Target size={20} color={P.purpleLight} />
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: P.textMuted,
                      }}
                    >
                      No funnel data
                    </span>
                    <span style={{ fontSize: 11, color: P.textMuted }}>
                      Data appears after conversations start
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.chartCard}>
                <div className={styles.cardHeader}>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: P.textDark,
                      margin: 0,
                    }}
                  >
                    Peak Hours
                  </h3>
                  <span
                    style={{
                      fontSize: 12,
                      color: P.textMuted,
                      fontWeight: 500,
                    }}
                  >
                    UTC · 24h
                  </span>
                </div>
                {dynamicPeakHours.bars.some((v: number) => v > 0) ? (
                  <PeakHoursChart
                    bars={dynamicPeakHours.bars}
                    peakLabel={dynamicPeakHours.peakLabel}
                  />
                ) : (
                  <div
                    style={{
                      flex: 1,
                      minHeight: 160,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: P.purpleBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Clock size={20} color={P.purpleLight} />
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: P.textMuted,
                      }}
                    >
                      No peak hour data
                    </span>
                    <span style={{ fontSize: 11, color: P.textMuted }}>
                      Hourly patterns emerge over time
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.analyticsGrid}>
              <div className={styles.chartCard}>
                <div className={styles.cardHeader}>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: P.textDark,
                      margin: 0,
                    }}
                  >
                    Session Insights
                  </h3>
                  <span
                    style={{
                      fontSize: 12,
                      color: P.textMuted,
                      fontWeight: 500,
                    }}
                  >
                    Performance KPIs
                  </span>
                </div>
                {dynamicSessionInsights.length > 0 ? (
                  <SessionInsightsGrid items={dynamicSessionInsights} />
                ) : (
                  <div
                    style={{
                      flex: 1,
                      minHeight: 160,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: P.purpleBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Zap size={20} color={P.purpleLight} />
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: P.textMuted,
                      }}
                    >
                      No session data
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.chartCard}>
                <div className={styles.cardHeader}>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: P.textDark,
                      margin: 0,
                    }}
                  >
                    Conversion Rate Trend
                  </h3>
                  <span
                    style={{
                      fontSize: 11,
                      color: P.textMuted,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    title="Avg is the mean of daily rates (not period leads÷convs)"
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: P.teal,
                      }}
                    />{" "}
                    daily % · avg ≠ period
                  </span>
                </div>
                {dynamicConvTrend.xLabels.length > 0 ? (
                  <ConvTrendChart
                    xLabels={dynamicConvTrend.xLabels}
                    series={dynamicConvTrend.series}
                    avgRate={dynamicConvTrend.avgRate}
                    peakRate={dynamicConvTrend.peakRate}
                    days={days}
                  />
                ) : (
                  <div
                    style={{
                      flex: 1,
                      minHeight: 160,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "rgba(13,148,136,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <TrendingUp size={20} color={P.teal} />
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: P.textMuted,
                      }}
                    >
                      No trend data
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Credit & Wallet Usage Cards (Shown in overview and when usage data exists) */}
            {channel === "overview" && (
              <div className={styles.analyticsGridTriple}>
                <div className={styles.chartCard}>
                  <div className={styles.cardHeader}>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: P.textDark,
                        margin: 0,
                      }}
                    >
                      Credit Balance
                    </h3>
                    <span
                      style={{
                        fontSize: 12,
                        color: P.textMuted,
                        fontWeight: 500,
                      }}
                    >
                      Live wallet
                    </span>
                  </div>
                  {usageData ? (
                    <CreditBalanceDonut
                      usedCredits={chargedCredits}
                      balanceCredits={balanceCredits}
                    />
                  ) : (
                    <div
                      style={{
                        flex: 1,
                        minHeight: 160,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: 13, color: P.textMuted }}>
                        Credit data unavailable
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.chartCard}>
                  <div className={styles.cardHeader}>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: P.textDark,
                        margin: 0,
                      }}
                    >
                      Burn Rate
                    </h3>
                    <span
                      style={{
                        fontSize: 12,
                        color: P.textMuted,
                        fontWeight: 500,
                      }}
                    >
                      Daily avg
                    </span>
                  </div>
                  <BurnRateCard
                    burnRate={burnRate}
                    balanceCredits={balanceCredits}
                  />
                </div>

                <div className={styles.chartCard}>
                  <div className={styles.cardHeader}>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: P.textDark,
                        margin: 0,
                      }}
                    >
                      Credit Usage
                    </h3>
                    <span
                      style={{
                        fontSize: 12,
                        color: P.textMuted,
                        fontWeight: 500,
                      }}
                    >
                      Volume breakdown
                    </span>
                  </div>
                  {(chartsData?.credits_by_day?.length ?? 0) > 0 ? (
                    <CreditUsageChart data={chartsData!.credits_by_day} />
                  ) : (
                    <div
                      style={{
                        flex: 1,
                        height: 160,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: 13, color: P.textMuted }}>
                        No credit usage data
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Heatmap Card */}
            <div className={styles.chartCardFull} style={{ position: "relative" }}>
              <div className={styles.cardHeader}>
                <div>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: P.textDark,
                      margin: 0,
                    }}
                  >
                    Activity Heatmap
                  </h3>
                  <p
                    style={{
                      fontSize: 12,
                      color: P.textMuted,
                      margin: "2px 0 0",
                    }}
                  >
                    Hourly customer message volume across days of the week (UTC)
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    color: P.textMuted,
                  }}
                >
                  <Activity size={14} color={P.purple} />
                  <span>Aggregated · cached ≤5m</span>
                </div>
              </div>
              {dynamicHeatmap.length > 0 ? (
                <HeatmapChart data={dynamicHeatmap} />
              ) : (
                <div
                  style={{
                    minHeight: 180,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: P.purpleBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Activity size={22} color={P.purpleLight} />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: P.textMuted,
                    }}
                  >
                    No activity data yet
                  </span>
                  <span style={{ fontSize: 11, color: P.textMuted }}>
                    The heatmap populates as conversations come in
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile See More Toggle */}
          <button
            type="button"
            onClick={() => setShowMoreMobile((prev) => !prev)}
            className={styles.seeMoreButton}
            aria-expanded={showMoreMobile}
          >
            <span>
              {showMoreMobile
                ? "Show Less Charts"
                : "See More Charts (Leads, Heatmap & More)"}
            </span>
            {showMoreMobile ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        </div>
        </>
      )}
    </div>
  );
}
