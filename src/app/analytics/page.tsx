"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Bot, MessageCircle, Smartphone } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { TopbarTabs, type TopbarTab } from "@/components/shell/Topbar";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { Loading } from "@/components/ui/PageState";
import { apiRequest, ApiClientError } from "@/lib/api";
import type {
  AnalyticsOverview,
  AnalyticsCharts,
  AnalyticsUsage,
  Agent,
} from "@/lib/types";

export type AnalyticsTabId = "overview" | "website" | "whatsapp" | "unified";

const TABS: TopbarTab[] = [
  {
    key: "overview",
    label: "Overview",
    icon: <BarChart3 className="w-4 h-4 shrink-0" strokeWidth={1.8} />,
  },
  {
    key: "website",
    label: "Web Agent",
    icon: <Bot className="w-4 h-4 shrink-0" strokeWidth={1.8} />,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: <MessageCircle className="w-4 h-4 shrink-0" strokeWidth={1.8} />,
  },
  {
    key: "unified",
    label: "Unified Agent",
    icon: <Smartphone className="w-4 h-4 shrink-0" strokeWidth={1.8} />,
  },
];

type TabDataCache = {
  overview: AnalyticsOverview | null;
  charts: AnalyticsCharts | null;
  usage: AnalyticsUsage | null;
  lastUpdated: Date | null;
};

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<Loading label="Loading analytics..." />}>
      <AnalyticsPageInner />
    </Suspense>
  );
}

function AnalyticsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial tab from URL query params or fallback to 'overview'
  const initialTab = (searchParams?.get("tab") as AnalyticsTabId) || "overview";
  const validTab: AnalyticsTabId = ["overview", "website", "whatsapp", "unified"].includes(
    initialTab
  )
    ? initialTab
    : "overview";

  const [activeTab, setActiveTab] = useState<AnalyticsTabId>(validTab);
  const [days, setDays] = useState<number>(7);
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [toDate, setToDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [fetching, setFetching] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [partialWarn, setPartialWarn] = useState<string>("");

  // Agent lists fetched once
  const [agents, setAgents] = useState<Agent[]>([]);

  // Selected agent IDs per channel (independent state)
  const [selectedWebAgentId, setSelectedWebAgentId] = useState<string>("all");
  const [selectedWaAgentId, setSelectedWaAgentId] = useState<string>("all");
  const [selectedUnifiedAgentId, setSelectedUnifiedAgentId] = useState<string>("all");

  // Client-side cache per cacheKey for fast tab switching
  const [cache, setCache] = useState<Record<string, TabDataCache>>({});

  // ── 1. Fetch Agents List on Mount ──────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    apiRequest<Agent[]>("/v1/agents")
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setAgents(data);
        }
      })
      .catch(() => {
        // quiet fallback
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Filter agents by channel mode
  const webAgents = useMemo(
    () => agents.filter((a) => a.mode === "website"),
    [agents]
  );
  const waAgents = useMemo(
    () => agents.filter((a) => a.mode === "whatsapp"),
    [agents]
  );
  const unifiedAgents = useMemo(
    () => agents.filter((a) => a.mode === "unified"),
    [agents]
  );

  // Compute current tab's active agent ID and agent list
  const currentAgentId = useMemo(() => {
    if (activeTab === "website") return selectedWebAgentId;
    if (activeTab === "whatsapp") return selectedWaAgentId;
    if (activeTab === "unified") return selectedUnifiedAgentId;
    return "all";
  }, [activeTab, selectedWebAgentId, selectedWaAgentId, selectedUnifiedAgentId]);

  const currentTabAgents = useMemo(() => {
    if (activeTab === "website") return webAgents;
    if (activeTab === "whatsapp") return waAgents;
    if (activeTab === "unified") return unifiedAgents;
    return [];
  }, [activeTab, webAgents, waAgents, unifiedAgents]);

  // Compute unique cache key for current view
  const currentCacheKey = `${activeTab}:${currentAgentId}:${fromDate}:${toDate}:${days}`;

  // ── 2. Data Fetching Logic ────────────────────────────────────────────────
  const fetchData = useCallback(
    async (
      tab: AnalyticsTabId,
      agentId: string,
      numDays: number,
      fDate?: string,
      tDate?: string,
      forceRefresh = false
    ) => {
      const f = fDate || fromDate;
      const t = tDate || toDate;
      const key = `${tab}:${agentId}:${f}:${t}:${numDays}`;
      setFetching(true);
      setError("");
      setPartialWarn("");

      let overviewUrl = `/v1/analytics/overview?days=${numDays}`;
      let chartsUrl = `/v1/analytics/charts?days=${numDays}`;
      const usageUrl = `/v1/analytics/usage?days=${numDays}`;

      if (tab !== "overview") {
        if (agentId && agentId !== "all") {
          overviewUrl += `&agent_id=${encodeURIComponent(agentId)}`;
          chartsUrl += `&agent_id=${encodeURIComponent(agentId)}`;
        } else {
          overviewUrl += `&channel=${encodeURIComponent(tab)}`;
          chartsUrl += `&channel=${encodeURIComponent(tab)}`;
        }
      }

      const promises: [
        Promise<AnalyticsOverview>,
        Promise<AnalyticsUsage | null>,
        Promise<AnalyticsCharts>
      ] = [
        apiRequest<AnalyticsOverview>(overviewUrl),
        tab === "overview"
          ? apiRequest<AnalyticsUsage>(usageUrl).catch(() => null)
          : Promise.resolve(null),
        apiRequest<AnalyticsCharts>(chartsUrl),
      ];

      const settled = await Promise.allSettled(promises);
      const [ovRes, usRes, chRes] = settled;

      let fetchedOverview: AnalyticsOverview | null = null;
      let fetchedUsage: AnalyticsUsage | null = null;
      let fetchedCharts: AnalyticsCharts | null = null;
      const fails: string[] = [];

      if (ovRes.status === "fulfilled") {
        fetchedOverview = ovRes.value;
      } else {
        fails.push(
          ovRes.reason instanceof ApiClientError
            ? ovRes.reason.message
            : "Overview failed"
        );
      }

      if (usRes.status === "fulfilled") {
        fetchedUsage = usRes.value;
      }

      if (chRes.status === "fulfilled") {
        fetchedCharts = chRes.value;
      } else {
        fails.push(
          chRes.reason instanceof ApiClientError
            ? chRes.reason.message
            : "Charts failed"
        );
      }

      if (fetchedOverview || fetchedCharts) {
        const newEntry: TabDataCache = {
          overview: fetchedOverview,
          charts: fetchedCharts,
          usage: fetchedUsage,
          lastUpdated: new Date(),
        };
        setCache((prev) => ({ ...prev, [key]: newEntry }));
        if (fails.length > 0) {
          setPartialWarn(fails.join(" · "));
        }
      } else {
        setError(fails.join(" · ") || "Failed to load analytics data");
      }

      setFetching(false);
    },
    [fromDate, toDate]
  );

  // Trigger fetch when tab, agent, date range, or days change
  useEffect(() => {
    const key = `${activeTab}:${currentAgentId}:${fromDate}:${toDate}:${days}`;
    if (!cache[key]) {
      fetchData(activeTab, currentAgentId, days, fromDate, toDate);
    }
  }, [activeTab, currentAgentId, days, fromDate, toDate, cache, fetchData]);

  // Handle Tab Switch
  const handleTabChange = (key: string) => {
    const newTab = key as AnalyticsTabId;
    setActiveTab(newTab);
    // Update URL query param cleanly without full reload
    const currentParams = new URLSearchParams(searchParams?.toString() || "");
    currentParams.set("tab", newTab);
    router.replace(`/analytics?${currentParams.toString()}`, { scroll: false });
  };

  // Handle Agent Selection
  const handleSelectAgent = (agentId: string) => {
    if (activeTab === "website") {
      setSelectedWebAgentId(agentId);
    } else if (activeTab === "whatsapp") {
      setSelectedWaAgentId(agentId);
    } else if (activeTab === "unified") {
      setSelectedUnifiedAgentId(agentId);
    }
  };

  // Handle Date Range Change (applied to all tabs)
  const handleDateRangeChange = (range: { days: number; fromDate: string; toDate: string }) => {
    setDays(range.days);
    setFromDate(range.fromDate);
    setToDate(range.toDate);
  };

  // Handle Manual Refresh
  const handleRefresh = () => {
    fetchData(activeTab, currentAgentId, days, fromDate, toDate, true);
  };

  // Get current active view data from cache
  const activeData = cache[currentCacheKey] || {
    overview: null,
    charts: null,
    usage: null,
    lastUpdated: null,
  };

  return (
    <AppShell
      title="Analytics"
      subtitle="Real-time insights and metrics"
      headerTabs={
        <TopbarTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      }
    >
      <AnalyticsView
        channel={activeTab}
        days={days}
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={handleDateRangeChange}
        onDaysChange={setDays}
        onRefresh={handleRefresh}
        fetching={fetching}
        overview={activeData.overview}
        chartsData={activeData.charts}
        usageData={activeData.usage}
        error={error}
        partialWarn={partialWarn}
        lastUpdated={activeData.lastUpdated}
        agents={currentTabAgents}
        selectedAgentId={currentAgentId}
        onSelectAgent={handleSelectAgent}
      />
    </AppShell>
  );
}
