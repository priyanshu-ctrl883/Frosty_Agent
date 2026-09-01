"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Responsive, type Layout, type LayoutItem } from "react-grid-layout";
import { motion } from "framer-motion";
import Link from "next/link";
import { Pencil, Check, RotateCcw, BarChart2, Sparkles, RefreshCw, ChevronDown, Settings, ArrowRight } from "lucide-react";

import { AppShell } from "@/components/shell/AppShell";
import { ErrorBox } from "@/components/ui/PageState";
import { apiRequest } from "@/lib/api";
import { can } from "@/lib/permissions";
import type { AnalyticsOverview, Wallet, AnalyticsQuality, AnalyticsUsage } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import { isCancelled, isSuspended } from "@/lib/entitlements";

import { KpiGrid } from "@/components/home/KpiGrid";
import { WidgetCard, type WidgetData } from "@/components/home/WidgetCard";
import { AddWidgetPanel } from "@/components/home/AddWidgetPanel";
import { ActivityFeed } from "@/components/home/ActivityFeed";
import { QuickActions } from "@/components/home/QuickActions";
import { HomeAttentionStrip } from "@/components/home/HomeAttentionStrip";
import { HomeUnmetDemand } from "@/components/home/HomeUnmetDemand";

import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import { LenisProvider } from "@/components/home/LenisProvider";
import { TimelineFilter } from "@/components/ui/TimelineFilter";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

import {
  DEFAULT_LAYOUT,
  autoFormatLayout,
  getWidgetDef,
  loadLayout,
  saveLayout,
  type WidgetInstance,
  type ChartType,
} from "@/components/home/widgetRegistry";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

function recentWindow(series: { day: string; conversations: number }[]) {
  const WEEK_DAYS = 7;
  const days = series.slice(-WEEK_DAYS);
  return {
    days,
    today: days.length ? (days[days.length - 1]?.conversations ?? 0) : 0,
    week: days.reduce((n, d) => n + d.conversations, 0),
  };
}

const COLS = { lg: 2, md: 2, sm: 1, xs: 1 };
const ROW_HEIGHT = 185;
const MARGIN: [number, number] = [20, 20];

export default function HomePage() {
  const { me, entitlements } = useWorkspace();
  const { mutate: globalMutate } = useSWRConfig();
  // Callback ref: fires when the div actually mounts (after loading=false).
  // This avoids the useEffect+[] timing bug where the div doesn't exist yet.
  const roRef = useRef<ResizeObserver | null>(null);
  const rafRef = useRef<number | null>(null);
  // When true, the ResizeObserver callback does nothing — used during
  // breakpoint transitions so the old viewport width can't race-overwrite the reset.
  const pauseRORef = useRef(false);
  const [width, setWidth] = useState(0);

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (roRef.current) { roRef.current.disconnect(); roRef.current = null; }
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (!el) return;

    const measure = () => {
      if (pauseRORef.current) return;           // paused during breakpoint transition
      const rect = el.getBoundingClientRect();
      const next = Math.floor(rect.width);
      if (next > 0) {
        setWidth(prev => Math.abs(prev - next) > 3 ? next : prev);
      }
    };

    const ro = new ResizeObserver(() => {
      if (pauseRORef.current) return;           // paused during breakpoint transition
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    });
    ro.observe(el);
    roRef.current = ro;
    measure();                                  // initial synchronous measurement
  }, []);

  /* ---- Data Fetching ---- */
  const [days, setDays] = useState(30);
  const canBilling = can(me?.permissions, "billing:view");
  const swrOpts = { refreshInterval: 60_000, revalidateOnFocus: true as const };

  const { data: overview = null, error: overviewErr, isLoading: overviewLoading } = useSWR<AnalyticsOverview | null>(
    me ? `/v1/analytics/overview?days=${days}` : null,
    (url: string): Promise<AnalyticsOverview | null> => apiRequest<AnalyticsOverview>(url),
    swrOpts,
  );

  const { data: quality = null, error: qualityErr, isLoading: qualityLoading } = useSWR<AnalyticsQuality | null>(
    me ? `/v1/analytics/quality?days=${days}` : null,
    (url: string): Promise<AnalyticsQuality | null> => apiRequest<AnalyticsQuality>(url),
    swrOpts,
  );

  const { data: usage = null, error: usageErr, isLoading: usageLoading } = useSWR<AnalyticsUsage | null>(
    me && canBilling ? `/v1/analytics/usage?days=${days}` : null,
    (url: string): Promise<AnalyticsUsage | null> => apiRequest<AnalyticsUsage>(url),
    swrOpts,
  );

  const { data: wallet = null, error: walletErr, isLoading: walletLoading } = useSWR<Wallet | null>(
    me && canBilling ? `/v1/billing/wallet` : null,
    (url: string): Promise<Wallet | null> => apiRequest<Wallet>(url),
    swrOpts,
  );

  const partialErrors: string[] = [];
  if (qualityErr) partialErrors.push("Quality metrics unavailable");
  if (canBilling && usageErr) partialErrors.push("Usage metrics unavailable");
  if (canBilling && walletErr) partialErrors.push("Wallet unavailable");

  const error = overviewErr
    ? overviewErr instanceof Error
      ? overviewErr.message
      : "Could not load analytics"
    : null;
  const loading = overviewLoading || (!overview && qualityLoading);

  /* ---- Derived KPI values ---- */
  const balance = wallet ? Math.floor(Number(wallet.unallocated_credits)) : null;
  const usedThisPeriod = wallet ? Math.floor(Number(wallet.credits_used_this_period)) : 0;
  // Conversation plan cap — for conversation widgets only, never credit pies.
  const included = entitlements?.limits?.max_conversations_per_month;
  const conversationQuota = included && included > 0 ? included : null;
  const creditPool = (balance ?? 0) + usedThisPeriod;
  const usedPct =
    creditPool > 0 ? Math.min(100, Math.floor((usedThisPeriod / creditPool) * 100)) : 0;

  const series = overview?.conversations_by_day || [];
  const recent = recentWindow(series);

  const planChosen =
    !isSuspended(entitlements) &&
    !isCancelled(entitlements) &&
    Boolean(entitlements?.plan_slug);

  const hideTrialCard =
    Boolean(entitlements?.plan_slug && entitlements.plan_slug !== "free") ||
    ["trialing", "active", "past_due"].includes(
      (entitlements?.subscription_status || "").toLowerCase(),
    );

  const isDayZero = Boolean(
    overview &&
      overview.conversations === 0 &&
      overview.leads === 0 &&
      overview.ai_runs === 0,
  );

  const widgetData: WidgetData = useMemo(
    () => ({
      overview,
      quality,
      usage,
      wallet,
      quotaBase: conversationQuota,
      usedPct,
      usedThisPeriod,
      recentConversationsWeek: recent.week,
      recentConversationsToday: recent.today,
      creditBalance: balance,
    }),
    [
      overview,
      quality,
      usage,
      wallet,
      conversationQuota,
      usedPct,
      usedThisPeriod,
      recent.week,
      recent.today,
      balance,
    ],
  );

  /* ---- Editable Charts Layout State ---- */
  const [widgets, setWidgets] = useState<WidgetInstance[]>(() => {
    const loaded = loadLayout();
    const items = loaded ? autoFormatLayout(loaded, 2) : DEFAULT_LAYOUT;
    return items.map(w => w.chartType === ("progress" as any) ? { ...w, chartType: w.id.startsWith("kpi_") ? "area" : "donut" } : w);
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAllMobile, setShowAllMobile] = useState(false);
  const [widgetToDelete, setWidgetToDelete] = useState<{ id: string; label: string } | null>(null);

  // isMobile derived from measured width; 0 means not yet measured.
  // prevIsMobileRef holds the last known breakpoint for the skeleton so it
  // renders with the correct column count even while width is reset to 0.
  const isMobile = width > 0 && width < 768;
  const prevIsMobileRef = useRef(false);
  useEffect(() => { if (width > 0) prevIsMobileRef.current = isMobile; }, [width, isMobile]);

  // ── Breakpoint-crossing: skeleton + clean remount ──────────────────────────
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [isGridTransitioning, setIsGridTransitioning] = useState(false);
  const prevIsDesktop = useRef<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    prevIsDesktop.current = mq.matches;

    const handleChange = (e: MediaQueryListEvent) => {
      const nowDesktop = e.matches;
      if (prevIsDesktop.current === nowDesktop) return;   // no real crossing
      prevIsDesktop.current = nowDesktop;

      // 1. Pause ResizeObserver so the old viewport width can't race back in
      pauseRORef.current = true;
      // 2. Show skeleton and kill the grid
      setIsGridTransitioning(true);
      setWidth(0);
      setLayoutVersion(v => v + 1);
      setIsEditMode(false);

      // 3. Two rAFs: first lets the browser resize DOM, second lets RO fire.
      //    Then un-pause and force-measure from the actual container element.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        pauseRORef.current = false;
        const containerEl = document.querySelector('[data-grid-container]') as HTMLDivElement | null;
        if (containerEl) {
          const next = Math.floor(containerEl.getBoundingClientRect().width);
          if (next > 0) setWidth(next);
        }
      }));
    };

    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hide skeleton once ResizeObserver has updated width to the correct new value
  useEffect(() => {
    if (!isGridTransitioning || width === 0) return;
    // Wait one extra frame so React has committed the grid render at new size
    const id = requestAnimationFrame(() => setIsGridTransitioning(false));
    return () => cancelAnimationFrame(id);
  }, [isGridTransitioning, width]);

  const persistWidgets = useCallback((next: WidgetInstance[]) => {
    setWidgets(next);
    saveLayout(next);
  }, []);

  const visibleWidgets = useMemo(() => {
    if (isMobile && !showAllMobile && !isEditMode) {
      return widgets.slice(0, 2);
    }
    return widgets;
  }, [widgets, isMobile, showAllMobile, isEditMode]);

  const rglLayouts = useMemo(() => {
    const lg: LayoutItem[] = visibleWidgets.map((w) => {
      const def = getWidgetDef(w.id);
      return {
        i: w.id,
        x: w.x,
        y: w.y,
        w: w.w,
        h: w.h,
        minW: def?.minSize.minW ?? 1,
        minH: def?.minSize.minH ?? 1,
        maxW: 2,
        maxH: 3,
      };
    });

    const md: LayoutItem[] = visibleWidgets.map((w) => {
      const def = getWidgetDef(w.id);
      return {
        i: w.id,
        x: Math.min(w.x, 1),
        y: w.y,
        w: Math.min(w.w, 2),
        h: Math.min(w.h, 3),
        minW: 1,
        minH: def?.minSize.minH ?? 1,
        maxW: 2,
        maxH: 3,
      };
    });

    const sm: LayoutItem[] = visibleWidgets.map((w, idx) => {
      const def = getWidgetDef(w.id);
      return {
        i: w.id,
        x: 0,
        y: idx * Math.min(w.h, 3),
        w: 1,
        h: Math.min(w.h, 3),
        minW: 1,
        minH: def?.minSize.minH ?? 1,
        maxW: 1,
        maxH: 3,
      };
    });

    return { lg, md, sm, xs: sm };
  // NOTE: deliberately exclude isEditMode/isMobile from deps — draggable/resizable
  // are passed as top-level <Responsive> props, not embedded in layout items.
  // Including them here would create a new layouts object on every edit-mode toggle
  // which triggers RGL's internal useEffect → infinite setState loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleWidgets]);

  // Use a ref so the callback always sees the latest isEditMode/widgets
  // without needing to be recreated (which would cause RGL to re-subscribe).
  const isEditModeRef = useRef(isEditMode);
  const widgetsRef = useRef(widgets);
  useEffect(() => { isEditModeRef.current = isEditMode; }, [isEditMode]);
  useEffect(() => { widgetsRef.current = widgets; }, [widgets]);

  const handleLayoutChange = useCallback(
    (layout: Layout) => {
      if (!isEditModeRef.current) return;
      const current = widgetsRef.current;
      // Guard: only persist if a position/size actually changed.
      // RGL fires onLayoutChange on mount and on internal reconciliation;
      // without this guard, every fire calls setWidgets → re-render → RGL fires again.
      let changed = false;
      const next = current.map((w) => {
        const l = layout.find((li: LayoutItem) => li.i === w.id);
        if (!l) return w;
        if (l.x !== w.x || l.y !== w.y || l.w !== w.w || l.h !== w.h) {
          changed = true;
          return { ...w, x: l.x, y: l.y, w: l.w, h: l.h };
        }
        return w;
      });
      if (changed) persistWidgets(next);
    },
    [persistWidgets]
  );

  const handleAddWidget = useCallback(
    (widgetId: string) => {
      const def = getWidgetDef(widgetId);
      if (!def) return;
      const nextList = [...widgets, {
        id: widgetId,
        chartType: def.defaultChartType,
        x: 0,
        y: 100,
        w: def.defaultSize.w,
        h: def.defaultSize.h,
      }];
      const formatted = autoFormatLayout(nextList, 2);
      persistWidgets(formatted);
    },
    [widgets, persistWidgets]
  );

  const handleRequestRemoveWidget = useCallback((widgetId: string) => {
    const def = getWidgetDef(widgetId);
    setWidgetToDelete({
      id: widgetId,
      label: def?.label || "this widget",
    });
  }, []);

  const handleConfirmRemoveWidget = useCallback(() => {
    if (!widgetToDelete) return;
    const filtered = widgets.filter((w) => w.id !== widgetToDelete.id);
    const formatted = autoFormatLayout(filtered, 2);
    persistWidgets(formatted);
    setWidgetToDelete(null);
  }, [widgetToDelete, widgets, persistWidgets]);

  const handleChartTypeChange = useCallback(
    (widgetId: string, ct: ChartType) => {
      persistWidgets(widgets.map((w) => (w.id === widgetId ? { ...w, chartType: ct } : w)));
    },
    [widgets, persistWidgets]
  );

  const handleResizeWidget = useCallback(
    (widgetId: string, dw: number, dh: number) => {
      const def = getWidgetDef(widgetId);
      const minW = def?.minSize.minW ?? 1;
      const minH = def?.minSize.minH ?? 1;
      const maxCols = 2;

      const updated = widgets.map((w) => {
        if (w.id !== widgetId) return w;
        const newW = Math.max(minW, Math.min(maxCols, w.w + dw));
        const newH = Math.max(minH, Math.min(3, w.h + dh));
        return { ...w, w: newW, h: newH };
      });
      persistWidgets(updated);
    },
    [widgets, persistWidgets]
  );

  const handleAutoFormat = useCallback(() => {
    const formatted = autoFormatLayout(widgets, 2);
    persistWidgets(formatted);
  }, [widgets, persistWidgets]);

  const handleUpdateWidget = useCallback(
    (widgetId: string, updates: Partial<WidgetInstance>) => {
      persistWidgets(widgets.map((w) => (w.id === widgetId ? { ...w, ...updates } : w)));
    },
    [widgets, persistWidgets]
  );

  const handleReset = useCallback(() => {
    persistWidgets(DEFAULT_LAYOUT);
  }, [persistWidgets]);

  const activeWidgetIds = useMemo(() => new Set(widgets.map((w) => w.id)), [widgets]);

  // Memoize drag/resize configs — inline object literals would create new references
  // on every render, causing RGL's internal useEffect to fire repeatedly.
  const canEdit = isEditMode && !isMobile;
  const dragConfig = useMemo(() => ({ enabled: canEdit, handle: ".drag-handle" }), [canEdit]);
  const resizeConfig = useMemo(() => ({ enabled: canEdit }), [canEdit]);

  return (
    <AppShell
      title="Overview"
      requires="dashboard:view"
    >
      <LenisProvider>
        <div className="w-full pb-32 min-w-0 overflow-x-hidden">
          {error ? <ErrorBox message={error} /> : null}
          {!error && partialErrors.length > 0 ? (
            <div className="mb-4 rounded-xl border border-[#0396A6]/25 bg-[#0396A6]/8 px-3 py-2 text-xs text-[#0396A6] font-medium">
              {partialErrors.join(" · ")}
            </div>
          ) : null}

          {loading ? (
            <DashboardSkeleton />
          ) : (
          <>
          <HomeUnmetDemand days={days} />

          <HomeEmptyState isEmpty={isDayZero} hideTrialCard={hideTrialCard} />

          {/* Needs Attention strip replaces old Analytics header — shown at top */}
          <HomeAttentionStrip overview={overview} />

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mb-10 sm:mb-12">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => globalMutate(() => true, undefined, { revalidate: true })}
                disabled={loading}
                className="flex items-center justify-center px-4 h-10 rounded-full border border-[var(--line)] bg-card text-muted-foreground hover:text-foreground hover:bg-[#0396A6]/5 hover:border-[#0396A6]/30 disabled:opacity-50 transition-all shadow-xs shrink-0 text-xs font-semibold active:scale-95 gap-2"
                title="Clear cache and refresh data"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#0396A6]" />
                <span>Clear Cache</span>
              </button>

              <Link
                href="/settings"
                className="flex items-center justify-center px-4 sm:px-5 h-10 rounded-full bg-[#0396A6] hover:bg-[#027D8A] text-white text-xs font-bold transition-all shadow-[0_6px_20px_rgba(3,150,166,0.25)] hover:shadow-[0_8px_25px_rgba(3,150,166,0.35)] shrink-0 gap-1.5 active:scale-95"
                title="Workspace settings"
              >
                <span>Configure Bot</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </Link>
            </div>

            <TimelineFilter value={days} onChange={setDays} />
          </div>

          {/* 1. KPI STATS */}
          <div className="mb-12 sm:mb-16">
            <KpiGrid
              overview={overview}
              recentConversationsWeek={recent.week}
              recentConversationsToday={recent.today}
              balance={balance}
              usedThisPeriod={usedThisPeriod}
              usedPct={usedPct}
              quotaBase={conversationQuota}
              hideCredits={!canBilling}
              loading={false}
              series={series}
            />
          </div>

          {/* 2. CUSTOMIZABLE CHARTS WORKSPACE */}
          <div className="mb-16 sm:mb-20">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-[var(--line-divider)]">
              <div className="flex items-center gap-3.5">
                <BarChart2 className="w-6 h-6 text-[#0396A6] shrink-0" />
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-foreground font-sans">
                    Conversations & Analytics
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    Daily activity over the last {days} days
                  </p>
                </div>
              </div>

              {/* Action Toolbar (Disabled on mobile view to prevent mobile layout alterations) */}
              <div className="hidden md:flex flex-wrap items-center gap-2">
                {isEditMode && <AddWidgetPanel activeWidgetIds={activeWidgetIds} onAdd={handleAddWidget} />}
                
                {isEditMode && (
                  <>
                    <button
                      onClick={handleAutoFormat}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--surf-1)] border border-[var(--line)] text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-[#0396A6]/30 transition-all shadow-xs"
                      title="Automatically pack & fill all empty grid spaces"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#0396A6]" />
                      <span className="hidden sm:inline">Auto Format</span>
                    </button>

                    <button
                      onClick={handleReset}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-card border border-[var(--line)] text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-[#0396A6]/5 transition-all shadow-xs"
                      title="Reset to default layout"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#0396A6]" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all shadow-sm ${
                    isEditMode
                      ? "bg-[#0396A6] text-white shadow-[0_4px_15px_rgba(3,150,166,0.3)]"
                      : "bg-card border border-[var(--line)] text-foreground hover:border-[#0396A6]/40 hover:shadow-xs"
                  }`}
                >
                  {isEditMode ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Pencil className="w-3.5 h-3.5 text-[#0396A6]" />}
                  <span>{isEditMode ? "Done Editing" : "Edit Layout"}</span>
                </button>
              </div>
            </div>

            {/* Grid Container */}
            <div ref={containerRef} data-grid-container className="w-full max-w-full min-h-[300px] min-w-0">
              {/* Skeleton overlay while viewport is transitioning */}
              {isGridTransitioning && (
                <div className="grid gap-5" style={{ gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)" }}>
                  {visibleWidgets.map((w) => (
                    <div
                      key={w.id}
                      className="rounded-[26px] sm:rounded-[30px] border border-[var(--line)] overflow-hidden"
                      style={{
                        gridColumn: (!isMobile && w.w > 1) ? "span 2" : "span 1",
                        height: `${w.h * (isMobile ? 240 : ROW_HEIGHT) + (w.h - 1) * MARGIN[1]}px`,
                      }}
                    >
                      <div className="w-full h-full bg-[var(--line-soft)] relative overflow-hidden">
                        <div className="skeleton-shimmer" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Real grid — only rendered when width is known and stable */}
              {!isGridTransitioning && width > 0 && (
                <Responsive
                  key={`chart-grid-${layoutVersion}`}
                  layouts={rglLayouts}
                  breakpoints={{ lg: 1200, md: 900, sm: 600, xs: 0 }}
                  cols={COLS}
                  rowHeight={isMobile ? 240 : ROW_HEIGHT}
                  width={width}
                  margin={isMobile ? [0, 18] : MARGIN}
                  containerPadding={[0, 0]}
                  onLayoutChange={handleLayoutChange}
                  dragConfig={dragConfig}
                  resizeConfig={resizeConfig}
                >
                  {visibleWidgets.map((w) => {
                    const def = getWidgetDef(w.id);
                    if (!def) return null;
                    
                    const getWidgetLoading = (id: string) => {
                      if (id === "ai_grounding" || id === "kb_gap_rate") return qualityLoading;
                      if (id === "ai_model_usage") return usageLoading;
                      if (id === "credits_usage" || id === "kpi_credits_balance") return walletLoading;
                      return overviewLoading;
                    };

                    const getWidgetError = (id: string) => {
                      if ((id === "ai_grounding" || id === "kb_gap_rate") && qualityErr) return "Data unavailable";
                      if (id === "ai_model_usage" && usageErr) return "Data unavailable";
                      if ((id === "credits_usage" || id === "kpi_credits_balance") && walletErr) return "Data unavailable";
                      if (overviewErr) return "Data unavailable";
                      return undefined;
                    };

                    return (
                      <div key={w.id} className="w-full h-full min-w-0">
                        <WidgetCard
                          widgetDef={def}
                          widgetInstance={w}
                          data={widgetData}
                          isEditMode={isEditMode && !isMobile}
                          isLoading={getWidgetLoading(w.id)}
                          dataError={getWidgetError(w.id)}
                          onRemove={() => handleRequestRemoveWidget(w.id)}
                          onUpdateWidget={(updates) => handleUpdateWidget(w.id, updates)}
                          onResizeWidget={(dw, dh) => handleResizeWidget(w.id, dw, dh)}
                        />
                      </div>
                    );
                  })}
                </Responsive>
              )}
            </div>

            {/* Mobile "View More" Toggle Button */}
            {isMobile && widgets.length > 2 && !isEditMode && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setShowAllMobile(!showAllMobile)}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-card border border-[var(--line)] text-xs font-bold text-foreground hover:bg-[#0396A6]/5 hover:border-[#0396A6]/30 shadow-xs hover:shadow-sm transition-all active:scale-95 group"
                >
                  <span>{showAllMobile ? "Show Fewer Charts" : `View All ${widgets.length} Charts`}</span>
                  <ChevronDown className={`w-4 h-4 text-[#0396A6] transition-transform duration-300 ${showAllMobile ? "rotate-180" : "group-hover:translate-y-0.5"}`} />
                </button>
              </div>
            )}
          </div>

          {/* 3. QUICK ACTIONS & LIVE ACTIVITY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 pt-12 sm:pt-16 border-t border-[var(--line)]">
            <div className="h-fit self-start overflow-hidden rounded-[28px] sm:rounded-[32px] border border-[var(--line)] bg-card p-6 sm:p-8 shadow-[0_4px_25px_rgba(3,150,166,0.03)] hover:border-[#0396A6]/30 transition-all">
              <QuickActions />
            </div>
            <div className="overflow-hidden rounded-[28px] sm:rounded-[32px] border border-[var(--line)] bg-card p-6 sm:p-8 shadow-[0_4px_25px_rgba(3,150,166,0.03)] hover:border-[#0396A6]/30 transition-all">
              <ActivityFeed />
            </div>
          </div>
          </>
          )}

          {/* Remove Widget Confirmation Dialog */}
          <ConfirmModal
            show={!!widgetToDelete}
            title="Remove Widget"
            message={`Are you sure you want to remove "${widgetToDelete?.label}" from your dashboard? You can easily add it back anytime using the "+ Add Widget" menu.`}
            tone="danger"
            confirmText="Remove Widget"
            cancelText="Cancel"
            onConfirm={handleConfirmRemoveWidget}
            onCancel={() => setWidgetToDelete(null)}
          />

        </div>
      </LenisProvider>
    </AppShell>
  );
}
