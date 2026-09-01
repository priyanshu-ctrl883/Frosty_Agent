"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import {
  Area, AreaChart, Bar, BarChart, Line, LineChart,
  Pie, PieChart, Cell, Tooltip,
  CartesianGrid, XAxis, YAxis
} from "recharts";
import { StableChartContainer } from "./StableChartContainer";
import {
  Activity, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon,
  X, GripVertical, SlidersHorizontal, Check, Eye, Palette, ArrowLeft, ArrowRight, Trash2, AlertTriangle,
  Flame, Sun, Snowflake, Target, Sparkles, TrendingUp
} from "lucide-react";
import type { ChartType, WidgetDef, WidgetInstance } from "./widgetRegistry";
import type { AnalyticsOverview, AnalyticsQuality, AnalyticsUsage, Wallet } from "@/lib/types";
import { ChartCustomizationModal } from "./ChartCustomizationModal";

export type WidgetData = {
  overview: AnalyticsOverview | null;
  quality: AnalyticsQuality | null;
  usage: AnalyticsUsage | null;
  wallet: Wallet | null;
  /** @deprecated Conversation plan cap — do not use for credit widgets. */
  quotaBase: number | null;
  usedPct: number;
  usedThisPeriod: number;
  recentConversationsWeek?: number;
  recentConversationsToday?: number;
  /** Available wallet credits (for credit pie remaining). */
  creditBalance?: number | null;
};

type Props = {
  widgetDef: WidgetDef;
  widgetInstance: WidgetInstance;
  data: WidgetData;
  isEditMode: boolean;
  onRemove: () => void;
  onUpdateWidget: (updates: Partial<WidgetInstance>) => void;
  onResizeWidget?: (dw: number, dh: number) => void;
  isLoading?: boolean;
  dataError?: string;
};

export const COLOR_PALETTES: Record<string, { hex: string; name: string; bg: string }> = {
  cyan:    { hex: "#06b6d4", name: "Neon Cyan", bg: "bg-[#06b6d4]" },
  indigo:  { hex: "#6366f1", name: "Electric Indigo", bg: "bg-[#6366f1]" },
  emerald: { hex: "#10b981", name: "Emerald Mint", bg: "bg-[#10b981]" },
  amber:   { hex: "#f59e0b", name: "Sunset Amber", bg: "bg-[#f59e0b]" },
  rose:    { hex: "#f43f5e", name: "Vibrant Rose", bg: "bg-[#f43f5e]" },
  purple:  { hex: "#8b5cf6", name: "Vivid Purple", bg: "bg-[#8b5cf6]" },
  teal:    { hex: "#0396A6", name: "Frosty Teal", bg: "bg-[#0396A6]" },
};

const PIE_COLORS = {
  hot: "#f43f5e",
  warm: "#f59e0b",
  cold: "#3b82f6",
  website: "#06b6d4",
  whatsapp: "#10b981",
};

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(10, 10, 10, 0.9)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(3,150,166,0.25)",
  borderRadius: "14px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
};

// Recharts 3 dispatches tooltip settings on every new object identity. Inline
// `{ fill, fontSize }` / `{ color }` literals here used to loop until React
// threw "Maximum update depth exceeded" on the home dashboard.
const TICK_MUTED = { fill: "#8A8D98", fontSize: 10 };
const TICK_CATEGORY = { fill: "#6B6970", fontSize: 11 };
const ITEM_STYLE = { color: "#fff", fontWeight: 600 };
const LABEL_STYLE = { color: "#6B6970", fontSize: 12 };
const CURSOR_FILL = { fill: "rgba(3,150,166,0.06)" };
const CHART_MARGIN = { top: 8, right: 0, left: -28, bottom: 0 };
const BAR_H_MARGIN = { top: 0, right: 8, left: 0, bottom: 0 };
const MODEL_BAR_MARGIN = { top: 8, right: 8, left: -15, bottom: 0 };
const KPI_MARGIN = { top: 4, right: 2, left: 2, bottom: 0 };

const RADIUS_KPI: [number, number, number, number] = [3, 3, 0, 0];

function formatLeadsTooltip(value: number | string | ReadonlyArray<number | string> | undefined) {
  const n = Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0);
  return [n, "Leads"] as [number, string];
}
function formatOpenTooltip(value: number | string | ReadonlyArray<number | string> | undefined) {
  const n = Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0);
  return [n, "Open"] as [number, string];
}

function formatXAxis(isoStr: string) {
  const d = new Date(`${isoStr}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

type PieDataItem = {
  name: string;
  value: number;
  fill: string;
};

function AwwwardsPieChart({
  data,
  centerTitle = "Total",
  valueUnit = "",
  innerRadius = "64%",
  paddingAngle = 3,
  showLegend = true,
}: {
  data: PieDataItem[];
  centerTitle?: string;
  valueUnit?: string;
  innerRadius?: string | number;
  paddingAngle?: number;
  showLegend?: boolean;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalValue = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);

  // Determine if it is a donut (has hole > 0) or solid pie
  const isDonut = useMemo(() => {
    if (typeof innerRadius === "string") {
      const num = parseFloat(innerRadius);
      return !isNaN(num) && num > 0;
    }
    return typeof innerRadius === "number" && innerRadius > 0;
  }, [innerRadius]);

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;
  const displayVal = activeItem ? activeItem.value : totalValue;
  const displayLabel = activeItem ? activeItem.name : centerTitle;
  const displayPct = activeItem
    ? `${totalValue > 0 ? ((activeItem.value / totalValue) * 100).toFixed(1) : 0}%`
    : "100%";

  const handleMouseEnter = useCallback((_: any, index: number) => {
    setHoveredIndex(index);
  }, []);
  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  return (
    <div className="flex flex-col w-full h-full p-1 gap-2 min-w-0 overflow-hidden select-none">
      {/* Top: Interactive Donut/Pie Chart with Centered Metric */}
      <div className="relative w-full flex-1 min-h-[120px] flex items-center justify-center min-w-0">
        <StableChartContainer minHeight={110} minWidth={110}>
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length || !payload[0]?.payload) return null;
                const pData = payload[0].payload as PieDataItem;
                const pPct = totalValue > 0 ? ((pData.value / totalValue) * 100).toFixed(1) : "0";
                return (
                  <div className="px-3 py-1.5 rounded-xl bg-popover/95 backdrop-blur-md border border-border shadow-xl text-xs flex flex-col gap-1 z-50 pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: pData.fill }} />
                      <span className="font-semibold text-foreground">{pData.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-muted-foreground font-mono text-[11px]">
                      <span>Value: <strong className="text-foreground">{pData.value.toLocaleString()}{valueUnit}</strong></span>
                      <span className="text-primary font-bold">{pPct}%</span>
                    </div>
                  </div>
                );
              }}
              wrapperStyle={{ outline: "none", zIndex: 50 }}
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius="84%"
              paddingAngle={paddingAngle}
              cornerRadius={isDonut ? 4 : 0}
              dataKey="value"
              animationDuration={600}
              stroke="var(--card, #fff)"
              strokeWidth={2}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="cursor-pointer focus:outline-none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.35}
                  style={{
                    filter: hoveredIndex === index ? "brightness(1.08) drop-shadow(0 2px 8px rgba(0,0,0,0.15))" : "none",
                    transition: "opacity 0.2s ease, filter 0.2s ease",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </StableChartContainer>

        {/* Center Text Overlay — only rendered for Donut charts where inner hole exists */}
        {isDonut && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
            <motion.div
              key={String(displayVal) + displayLabel}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="flex flex-col items-center justify-center"
            >
              {/* Clean hero number */}
              <span className="text-2xl sm:text-3xl font-extrabold font-sans text-foreground tracking-tight leading-none tabular-nums">
                {typeof displayVal === "number" ? displayVal.toLocaleString() : displayVal}
                {valueUnit}
              </span>

              {/* Sub-label cleanly positioned under the number */}
              <div className="flex items-center justify-center gap-1 mt-1 max-w-[100px] px-1">
                <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider truncate">
                  {displayLabel}
                </span>
                {activeItem && totalValue > 0 && (
                  <span className="text-[9px] font-mono font-bold text-primary shrink-0">
                    ({displayPct})
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Bottom: Legend & stats breakdown */}
      {showLegend && (
        <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 w-full min-w-0 shrink-0 mt-auto pt-1">
          {data.map((item, idx) => {
            const isSelected = hoveredIndex === idx;
            const pct = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
            return (
              <div
                key={item.name}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 border-primary/40 shadow-xs scale-[1.01]"
                    : "bg-muted/15 border-border/60 hover:bg-muted/30 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs transition-transform duration-200"
                    style={{
                      backgroundColor: item.fill,
                      transform: isSelected ? "scale(1.25)" : "scale(1)",
                      boxShadow: isSelected ? `0 0 8px ${item.fill}` : undefined
                    }}
                  />
                  <span className="text-[11px] sm:text-xs font-semibold text-foreground truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pl-1 shrink-0">
                  <span className="text-[11px] sm:text-xs font-bold text-foreground font-mono tabular-nums">
                    {item.value.toLocaleString()}{valueUnit}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono font-medium">
                    ({pct}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LeadIntentBreakdown({
  hot,
  warm,
  cold,
}: {
  hot: number;
  warm: number;
  cold: number;
}) {
  const total = hot + warm + cold;
  const hotPct = total > 0 ? Math.round((hot / total) * 100) : 0;
  const warmPct = total > 0 ? Math.round((warm / total) * 100) : 0;
  const coldPct = total > 0 ? Math.max(0, 100 - hotPct - warmPct) : 0;

  const tiers = [
    {
      key: "hot",
      label: "Hot Leads",
      sublabel: "High Intent · Ready to convert",
      count: hot,
      pct: hotPct,
      color: "#ef4444",
      bgClass: "bg-rose-500/8 border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/12",
      badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      dotClass: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]",
      barGradient: "linear-gradient(90deg, #f43f5e, #ef4444)",
      icon: <Flame className="w-4 h-4 text-rose-500 shrink-0" />,
    },
    {
      key: "warm",
      label: "Warm Leads",
      sublabel: "Evaluating · Needs follow-up",
      count: warm,
      pct: warmPct,
      color: "#f59e0b",
      bgClass: "bg-amber-500/8 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/12",
      badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      dotClass: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
      barGradient: "linear-gradient(90deg, #f59e0b, #f97316)",
      icon: <Sun className="w-4 h-4 text-amber-500 shrink-0" />,
    },
    {
      key: "cold",
      label: "Cold Leads",
      sublabel: "Early stage · Browsing",
      count: cold,
      pct: coldPct,
      color: "#3b82f6",
      bgClass: "bg-sky-500/8 border-sky-500/20 hover:border-sky-500/40 hover:bg-sky-500/12",
      badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
      dotClass: "bg-sky-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]",
      barGradient: "linear-gradient(90deg, #3b82f6, #06b6d4)",
      icon: <Snowflake className="w-4 h-4 text-sky-500 shrink-0" />,
    },
  ];

  return (
    <div className="flex flex-col justify-between h-full gap-3 py-0.5">
      {/* Top Stacked Proportional Distribution Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
          <span>Intent Distribution</span>
          <span className="font-mono text-foreground font-bold">{total} Total Leads</span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-muted/40 p-[1.5px] gap-[2px] border border-[var(--line)]">
          {total > 0 ? (
            <>
              {hotPct > 0 && (
                <div
                  style={{
                    width: `${hotPct}%`,
                    background: "linear-gradient(90deg, #f43f5e, #ef4444)",
                  }}
                  className="h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                  title={`Hot: ${hot} (${hotPct}%)`}
                />
              )}
              {warmPct > 0 && (
                <div
                  style={{
                    width: `${warmPct}%`,
                    background: "linear-gradient(90deg, #f59e0b, #f97316)",
                  }}
                  className="h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                  title={`Warm: ${warm} (${warmPct}%)`}
                />
              )}
              {coldPct > 0 && (
                <div
                  style={{
                    width: `${coldPct}%`,
                    background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
                  }}
                  className="h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                  title={`Cold: ${cold} (${coldPct}%)`}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full rounded-full bg-muted/30" />
          )}
        </div>
      </div>

      {/* 3 Tier Cards */}
      <div className="grid grid-cols-1 gap-2">
        {tiers.map((tier) => (
          <div
            key={tier.key}
            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 ${tier.bgClass}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-card border border-[var(--line)] flex items-center justify-center shadow-xs shrink-0">
                {tier.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                    {tier.label}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${tier.dotClass}`} />
                </div>
                <span className="text-[10px] text-muted-foreground/80 truncate hidden sm:inline">
                  {tier.sublabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-base sm:text-lg font-black font-sans text-foreground tabular-nums">
                <CountUp end={tier.count} duration={1.2} />
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${tier.badgeClass}`}
              >
                {tier.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiSparklineCard({
  val,
  hint,
  seriesData,
  chartType,
  accentColor,
  id
}: {
  val: number;
  hint: string;
  seriesData: { day: string; val: number }[];
  chartType: string;
  accentColor: string;
  id: string;
}) {
  return (
    <div className="flex flex-col h-full w-full p-2 sm:p-1 gap-1 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
      {/* Big number & hint */}
      <div className="flex flex-row sm:flex-col items-baseline sm:items-start justify-between sm:justify-center gap-2 sm:gap-0 shrink-0 sm:min-w-[90px]">
        <span className="text-2xl sm:text-3xl font-bold text-foreground font-sans tracking-tight leading-none">
          <CountUp end={val} duration={1.5} />
        </span>
        <span className="text-[10px] sm:text-xs text-muted-foreground/70 font-medium sm:mt-1 truncate max-w-[130px] sm:max-w-[110px]">
          {hint}
        </span>
      </div>

      {/* Sparkline graph */}
      <div className="flex-1 h-[52px] sm:h-full sm:min-h-[55px] sm:max-h-[70px] relative min-w-0">
        <StableChartContainer minHeight={48} minWidth={60}>
          {chartType === "bar" ? (
            <BarChart data={seriesData} margin={KPI_MARGIN}>
              <Bar dataKey="val" fill={accentColor} radius={RADIUS_KPI} animationDuration={800} />
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart data={seriesData} margin={KPI_MARGIN}>
              <Line type="monotone" dataKey="val" stroke={accentColor} strokeWidth={2} dot={false} animationDuration={800} />
            </LineChart>
          ) : chartType === "donut" ? (
            <PieChart>
              <Pie
                data={seriesData}
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="80%"
                dataKey="val"
                stroke="none"
              >
                {seriesData.map((e, idx) => (
                  <Cell key={idx} fill={idx % 2 === 0 ? accentColor : "rgba(103,62,190,0.1)"} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <AreaChart data={seriesData} margin={KPI_MARGIN}>
              <defs>
                <linearGradient id={`kpi-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="val"
                stroke={accentColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#kpi-grad-${id})`}
                animationDuration={800}
              />
            </AreaChart>
          )}
        </StableChartContainer>
      </div>
    </div>
  );
}

export function WidgetCard({ widgetDef, widgetInstance, data, isEditMode, isLoading, dataError, onRemove, onUpdateWidget, onResizeWidget }: Props) {
  const { overview, quality, usage, usedPct, usedThisPeriod, quotaBase, recentConversationsWeek, recentConversationsToday, creditBalance } = data;
  const [showSettings, setShowSettings] = useState(false);

  const { id } = widgetDef;
  const chartType = widgetInstance.chartType || widgetDef.defaultChartType;
  
  // Per-widget custom styling and color overrides
  const customColors = widgetInstance.customColors;
  const chartStyles = widgetInstance.chartStyles;

  const currentColorKey = widgetInstance.color || "emerald";
  const defaultPaletteHex = COLOR_PALETTES[currentColorKey]?.hex || "#0396A6";
  const accentColor = customColors?.primary || defaultPaletteHex;
  const secondaryColor = customColors?.secondary || "#14B8A6";
  const gridColor = customColors?.grid || "rgba(3,150,166,0.08)";
  const axisColor = customColors?.axis || "#8A8D98";

  const showGrid = widgetInstance.showGrid ?? true;
  const smooth = widgetInstance.smooth ?? true;
  const strokeWidth = chartStyles?.strokeWidth ?? 2.5;
  const fillOpacity = chartStyles?.fillOpacity ?? 0.35;
  const borderRadius = chartStyles?.borderRadius ?? 6;
  const innerRadiusPct = chartStyles?.innerRadiusPct !== undefined ? `${chartStyles.innerRadiusPct}%` : (chartType === "pie" ? "0%" : "64%");
  const paddingAngle = chartStyles?.paddingAngle ?? 3;
  const showLegend = chartStyles?.showLegend ?? true;
  const showDots = chartStyles?.showDots ?? (chartType === "line");
  const dotSize = chartStyles?.dotSize ?? 3;
  const gradient = chartStyles?.gradient ?? true;
  const showAxis = chartStyles?.showAxis ?? true;

  const dotConfig = useMemo(() => (
    showDots ? { fill: secondaryColor || accentColor, r: dotSize, strokeWidth: 0 } : false
  ), [showDots, secondaryColor, accentColor, dotSize]);

  const radiusTop = useMemo<[number, number, number, number]>(
    () => [borderRadius, borderRadius, 0, 0],
    [borderRadius]
  );
  const radiusRight = useMemo<[number, number, number, number]>(
    () => [0, borderRadius, borderRadius, 0],
    [borderRadius]
  );

  const getSegmentFill = (key: string, fallback: string) => {
    return customColors?.segments?.[key] || fallback;
  };

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex w-full h-full p-4 gap-4 overflow-hidden relative border border-dashed border-[var(--line)] rounded-2xl items-center">
          <div className="w-16 h-16 rounded-full bg-[var(--line-soft)] shrink-0" />
          <div className="flex-1 flex flex-col gap-2 justify-center">
            <div className="h-4 w-3/4 bg-[var(--line-soft)] rounded" />
            <div className="h-3 w-1/2 bg-[var(--line-soft)] rounded" />
          </div>
          <div className="skeleton-shimmer" />
        </div>
      );
    }

    switch (id) {
      case "conversations_volume": {
        let series = overview?.conversations_by_day || [];
        if (!series.length) return <EmptyState />;
        const curveType = smooth ? "monotone" : "linear";
        return (
          <StableChartContainer minHeight={120} minWidth={100}>
            {chartType === "area" ? (
              <AreaChart data={series} margin={CHART_MARGIN}>
                <defs>
                  <linearGradient id={`cg-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={fillOpacity}/>
                    <stop offset="95%" stopColor={secondaryColor || accentColor} stopOpacity={gradient ? (fillOpacity * 0.4) : fillOpacity}/>
                  </linearGradient>
                </defs>
                {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>}
                {showAxis && <XAxis dataKey="day" tickFormatter={formatXAxis} axisLine={false} tickLine={false} tick={TICK_MUTED} dy={8}/>}
                {showAxis && <YAxis axisLine={false} tickLine={false} tick={TICK_MUTED}/>}
                <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={ITEM_STYLE} labelStyle={LABEL_STYLE}/>
                <Area
                  type={curveType}
                  dataKey="conversations"
                  stroke={accentColor}
                  strokeWidth={strokeWidth}
                  fillOpacity={1}
                  fill={`url(#cg-${id})`}
                  dot={dotConfig}
                  animationDuration={800}
                />
              </AreaChart>
            ) : chartType === "bar" ? (
              <BarChart data={series} margin={CHART_MARGIN}>
                <defs>
                  <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor}/>
                    <stop offset="100%" stopColor={secondaryColor || accentColor} stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>}
                {showAxis && <XAxis dataKey="day" tickFormatter={formatXAxis} axisLine={false} tickLine={false} tick={TICK_MUTED} dy={8}/>}
                {showAxis && <YAxis axisLine={false} tickLine={false} tick={TICK_MUTED}/>}
                <Tooltip cursor={CURSOR_FILL} contentStyle={TOOLTIP_STYLE} itemStyle={ITEM_STYLE} labelStyle={LABEL_STYLE}/>
                <Bar dataKey="conversations" fill={`url(#bg-${id})`} radius={radiusTop} animationDuration={800}/>
              </BarChart>
            ) : (
              <LineChart data={series} margin={CHART_MARGIN}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>}
                {showAxis && <XAxis dataKey="day" tickFormatter={formatXAxis} axisLine={false} tickLine={false} tick={TICK_MUTED} dy={8}/>}
                {showAxis && <YAxis axisLine={false} tickLine={false} tick={TICK_MUTED}/>}
                <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={ITEM_STYLE} labelStyle={LABEL_STYLE}/>
                <Line
                  type={curveType}
                  dataKey="conversations"
                  stroke={accentColor}
                  strokeWidth={strokeWidth}
                  dot={dotConfig}
                  animationDuration={800}
                />
              </LineChart>
            )}
          </StableChartContainer>
        );
      }

      case "leads_temperature": {
        const lt = overview?.leads_by_temperature;
        const hot = lt?.hot ?? 0;
        const warm = lt?.warm ?? 0;
        const cold = lt?.cold ?? 0;
        const total = hot + warm + cold;

        if (total === 0 && !overview) return <EmptyState />;

        if (chartType === "donut" || chartType === "pie") {
          const d = [
            { name: "Cold", value: cold, fill: getSegmentFill("cold", PIE_COLORS.cold) },
            { name: "Warm", value: warm, fill: getSegmentFill("warm", PIE_COLORS.warm) },
            { name: "Hot", value: hot, fill: getSegmentFill("hot", PIE_COLORS.hot) },
          ];
          return (
            <AwwwardsPieChart
              data={d}
              centerTitle="Total Leads"
              innerRadius={innerRadiusPct}
              paddingAngle={paddingAngle}
              showLegend={showLegend}
            />
          );
        }

        return <LeadIntentBreakdown hot={hot} warm={warm} cold={cold} />;
      }

      case "open_by_channel": {
        let ch = overview?.open_by_channel;
        const d = [
          { name: "Website", value: ch?.website ?? 0, fill: getSegmentFill("website", PIE_COLORS.website) },
          { name: "WhatsApp", value: ch?.whatsapp ?? 0, fill: getSegmentFill("whatsapp", PIE_COLORS.whatsapp) },
        ];
        if (!d.some(x => x.value > 0)) return <EmptyState />;
        return chartType === "bar" ? (
          <StableChartContainer minHeight={120} minWidth={100}>
            <BarChart data={d} layout="vertical" margin={BAR_H_MARGIN}>
              <XAxis type="number" hide/>
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={TICK_CATEGORY} width={65}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={ITEM_STYLE} formatter={formatOpenTooltip}/>
              <Bar dataKey="value" radius={radiusRight} animationDuration={800}>{d.map((e, i) => <Cell key={i} fill={e.fill}/>)}</Bar>
            </BarChart>
          </StableChartContainer>
        ) : (
          <AwwwardsPieChart
            data={d}
            centerTitle="Open Total"
            innerRadius={innerRadiusPct}
            paddingAngle={paddingAngle}
            showLegend={showLegend}
          />
        );
      }

      case "ai_grounding": {
        let rate = quality ? Math.round(quality.grounded_rate * 100) : null;
        if (rate === null) return <EmptyState />;
        const d = [
          { name: "Grounded", value: rate, fill: getSegmentFill("grounded", accentColor) },
          { name: "Ungrounded", value: 100 - rate, fill: getSegmentFill("ungrounded", "rgba(103,62,190,0.1)") },
        ];
        return (
          <AwwwardsPieChart
            data={d}
            centerTitle="Accuracy"
            valueUnit="%"
            innerRadius={innerRadiusPct}
            paddingAngle={paddingAngle}
            showLegend={showLegend}
          />
        );
      }

      case "ai_model_usage": {
        let models = (usage?.by_model && usage.by_model.length > 0) ? usage.by_model : [];
        if (!models.length) return <EmptyState />;
        const modelDefaultColors = ["#818cf8", "#9B7FD4", "#f59e0b", "#ef4444", "#673EBE"];
        const d = models.map((m, i) => {
          const modelName = m.model.split('/').pop() || m.model;
          return {
            name: modelName,
            value: m.prompt_tokens,
            fill: getSegmentFill(modelName.toLowerCase().replace(/[^a-z0-9]/g, '_'), modelDefaultColors[i % modelDefaultColors.length] || "#818cf8")
          };
        });
        return chartType === "pie" || chartType === "donut" ? (
          <AwwwardsPieChart
            data={d}
            centerTitle="Token Usage"
            innerRadius={innerRadiusPct}
            paddingAngle={paddingAngle}
            showLegend={showLegend}
          />
        ) : (
          <StableChartContainer minHeight={120} minWidth={100}>
            <BarChart data={d} margin={MODEL_BAR_MARGIN}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>}
              {showAxis && <XAxis dataKey="name" axisLine={false} tickLine={false} tick={TICK_MUTED}/>}
              {showAxis && <YAxis axisLine={false} tickLine={false} tick={TICK_MUTED}/>}
              <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={ITEM_STYLE}/>
              <Bar dataKey="value" name="Prompt Tokens" fill={accentColor} radius={radiusTop} animationDuration={800}/>
            </BarChart>
          </StableChartContainer>
        );
      }

      case "credits_usage": {
        // Credit units only — never invent a 1000 quota or mix conversation plan caps.
        const displayUsed = usedThisPeriod || 0;
        const remaining = Math.max(0, creditBalance ?? 0);
        const pool = displayUsed + remaining;
        if (pool <= 0) {
          return <EmptyState />;
        }
        const displayPct = pool > 0 ? Math.min(100, Math.round((displayUsed / pool) * 100)) : 0;
        const d = [
          { name: "Credits Used", value: displayUsed, fill: getSegmentFill("used", displayPct > 80 ? "#ef4444" : accentColor) },
          { name: "Available", value: remaining, fill: getSegmentFill("remaining", "rgba(103,62,190,0.1)") },
        ];
        return (
          <AwwwardsPieChart
            data={d}
            centerTitle="Credit Usage"
            innerRadius={innerRadiusPct}
            paddingAngle={paddingAngle}
            showLegend={showLegend}
          />
        );
      }

      case "kb_gap_rate": {
        if (!quality) {
          return <EmptyState />;
        }
        let kbr = Math.round(quality.kb_gap_rate * 100);
        const d = [
          { name: "Gap Rate", value: kbr, fill: getSegmentFill("gap", kbr > 15 ? "#ef4444" : "#673EBE") },
          { name: "Grounded", value: 100 - kbr, fill: getSegmentFill("grounded", "rgba(103,62,190,0.1)") },
        ];
        return (
          <AwwwardsPieChart
            data={d}
            centerTitle="Gap Rate"
            valueUnit="%"
            innerRadius={innerRadiusPct}
            paddingAngle={paddingAngle}
            showLegend={showLegend}
          />
        );
      }

      case "kpi_conversations_7d": {
        const val = (recentConversationsWeek && recentConversationsWeek > 0) ? recentConversationsWeek : 0;
        const hint = (recentConversationsToday && recentConversationsToday > 0) ? `${recentConversationsToday} today · ${overview?.conversations_open ?? 0} open` : "0 today · 0 open";
        const rawSeries = (overview?.conversations_by_day && overview.conversations_by_day.length > 0)
          ? overview.conversations_by_day.slice(-7)
          : [];
        const seriesData = rawSeries.map(s => ({ day: s.day, val: s.conversations }));

        return (
          <KpiSparklineCard
            val={val}
            hint={hint}
            seriesData={seriesData}
            chartType={chartType}
            accentColor={accentColor}
            id={id}
          />
        );
      }

      case "kpi_hot_leads": {
        const val = (overview?.leads_by_temperature?.hot && overview.leads_by_temperature.hot > 0) ? overview.leads_by_temperature.hot : 0;
        const hint = (overview?.leads && overview.leads > 0) ? `${overview.leads} in the last 30 days` : "0 in the last 30 days";
        const rawSeries = (overview?.conversations_by_day && overview.conversations_by_day.length > 0) ? overview.conversations_by_day.slice(-7) : Array.from({length: 7}).map((_, i) => ({ day: `Day ${i}`, conversations: 0 }));
        const shape = [0.2, 0.4, 0.3, 0.6, 0.5, 0.8, 1.0];
        const seriesData = rawSeries.map((s, i) => ({ day: s.day, val: val * (shape[i % shape.length] ?? 1) }));

        return (
          <KpiSparklineCard
            val={val}
            hint={hint}
            seriesData={seriesData}
            chartType={chartType}
            accentColor={accentColor}
            id={id}
          />
        );
      }

      case "kpi_meetings_upcoming": {
        const val = (overview?.meetings_upcoming && overview.meetings_upcoming > 0) ? overview.meetings_upcoming : 0;
        const hint = (overview?.meetings_pending_confirm && overview.meetings_pending_confirm > 0) ? `${overview.meetings_pending_confirm} awaiting confirm` : "0 awaiting confirm";
        const rawSeries = (overview?.conversations_by_day && overview.conversations_by_day.length > 0) ? overview.conversations_by_day.slice(-7) : Array.from({length: 7}).map((_, i) => ({ day: `Day ${i}`, conversations: 0 }));
        const shape = [0.1, 0.3, 0.2, 0.5, 0.4, 0.7, 1.0];
        const seriesData = rawSeries.map((s, i) => ({ day: s.day, val: val * (shape[i % shape.length] ?? 1) }));

        return (
          <KpiSparklineCard
            val={val}
            hint={hint}
            seriesData={seriesData}
            chartType={chartType}
            accentColor={accentColor}
            id={id}
          />
        );
      }

      case "kpi_credits_balance": {
        const val = (data.wallet && Number(data.wallet.unallocated_credits) > 0) ? Math.floor(Number(data.wallet.unallocated_credits)) : 0;
        const displayUsed = usedThisPeriod || 0;
        const hint = `${displayUsed} used this period`;
        const rawSeries = (overview?.conversations_by_day && overview.conversations_by_day.length > 0) ? overview.conversations_by_day.slice(-7) : Array.from({length: 7}).map((_, i) => ({ day: `Day ${i}`, conversations: 0 }));
        const seriesData = rawSeries.map((s, i) => ({ day: s.day, val: val + ((6 - i) * (displayUsed / 6)) }));

        return (
          <KpiSparklineCard
            val={val}
            hint={hint}
            seriesData={seriesData}
            chartType={chartType}
            accentColor={accentColor}
            id={id}
          />
        );
      }

      case "kpi_kb_gaps_open": {
        const val = (overview?.kb_gaps && overview.kb_gaps > 0) ? overview.kb_gaps : 0;
        const hint = (overview?.ai_runs && overview.ai_runs > 0) ? `${overview.ai_runs} AI runs` : "0 AI runs";
        const rawSeries = (overview?.conversations_by_day && overview.conversations_by_day.length > 0) ? overview.conversations_by_day.slice(-7) : Array.from({length: 7}).map((_, i) => ({ day: `Day ${i}`, conversations: 0 }));
        const shape = [0.8, 0.6, 0.9, 0.4, 0.7, 0.5, 1.0];
        const seriesData = rawSeries.map((s, i) => ({ day: s.day, val: val * (shape[i % shape.length] ?? 1) }));

        return (
          <KpiSparklineCard
            val={val}
            hint={hint}
            seriesData={seriesData}
            chartType={chartType}
            accentColor={accentColor}
            id={id}
          />
        );
      }

      case "kpi_agents_active": {
        const val = (overview?.agents_active && overview.agents_active > 0) ? overview.agents_active : 0;
        const hint = (overview?.handoffs && overview.handoffs > 0) ? `${overview.handoffs} handoffs queued` : "0 handoffs queued";
        const rawSeries = (overview?.conversations_by_day && overview.conversations_by_day.length > 0) ? overview.conversations_by_day.slice(-7) : Array.from({length: 7}).map((_, i) => ({ day: `Day ${i}`, conversations: 0 }));
        const shape = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]; // Agents active is usually flat
        const seriesData = rawSeries.map((s, i) => ({ day: s.day, val: val * (shape[i % shape.length] ?? 1) }));

        return (
          <KpiSparklineCard
            val={val}
            hint={hint}
            seriesData={seriesData}
            chartType={chartType}
            accentColor={accentColor}
            id={id}
          />
        );
      }

      default:
        return <AwaitingApiState endpoint="/v1/analytics/unknown" />;
    }
  }, [
    id, chartType, overview, quality, usage, usedPct, usedThisPeriod, quotaBase,
    accentColor, secondaryColor, gridColor, axisColor, showGrid, smooth, strokeWidth,
    fillOpacity, borderRadius, innerRadiusPct, paddingAngle, showLegend, showDots,
    dotSize, gradient, showAxis, recentConversationsWeek, recentConversationsToday, customColors, creditBalance
  ]);

  return (
    <div 
      className={`w-full max-w-full h-full flex flex-col rounded-[26px] sm:rounded-[30px] border border-[var(--line)] bg-card transition-all duration-300 group/card relative overflow-hidden min-w-0 ${
        isEditMode ? "ring-2 ring-[#0396A6]/40 ring-dashed shadow-md" : "hover:-translate-y-1 hover:border-[#0396A6]/30 hover:shadow-[0_16px_40px_rgba(3,150,166,0.08)]"
      }`}
      style={{ 
        boxShadow: isEditMode ? undefined : `0 4px 25px rgba(3,150,166,0.04), 0 1px 3px rgba(0,0,0,0.02)`
      }}
    >
      {/* Top accent gradient line in #0396A6 */}
      <div
        className="absolute top-0 left-0 right-0 h-[2.5px] opacity-60 group-hover/card:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, #0396A6, transparent)` }}
      />

      {/* Ambient background glow on hover in #0396A6 */}
      <div 
        className="absolute -top-14 -right-14 w-36 h-36 rounded-full pointer-events-none opacity-0 group-hover/card:opacity-15 blur-2xl transition-opacity duration-500 bg-[#0396A6]"
      />

      <div className="p-5 sm:p-7 flex flex-col flex-1 min-h-0 min-w-0 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-5 shrink-0 gap-2 w-full min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isEditMode && (
              <div className="drag-handle cursor-grab active:cursor-grabbing text-[#0396A6] hover:text-[#027D8A] p-1 rounded-lg hover:bg-[#0396A6]/10 transition-colors shrink-0">
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            <span className="text-xs sm:text-sm font-sans font-bold text-foreground tracking-tight truncate block" title={widgetDef.label}>
              {widgetDef.label}
            </span>
            {dataError && (
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-md bg-[#0396A6]/10 text-[#0396A6] shrink-0 border border-[#0396A6]/20 flex items-center gap-1" title={dataError}>
                <AlertTriangle className="w-3 h-3 text-[#0396A6]" />
                <span className="hidden sm:inline leading-none mt-px">Data unavailable</span>
              </span>
            )}
          </div>

          {/* Header Actions (Only rendered in Edit Mode) */}
          {isEditMode && (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Customize Settings Button */}
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className={`flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                  showSettings
                    ? "bg-[#0396A6]/20 border-[#0396A6]/40 text-[#0396A6]"
                    : "bg-card border-[var(--line)] text-muted-foreground hover:text-foreground hover:bg-[#0396A6]/5 hover:border-[#0396A6]/30"
                }`}
                title="Customize Chart Appearance & Settings"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#0396A6]" />
                <span className="hidden md:inline text-[11px]">Customize</span>
              </button>

              {/* Resize Toolbar */}
              {onResizeWidget && (
                <div className="flex items-center gap-0.5 bg-card p-0.5 rounded-xl border border-[var(--line)] shadow-sm">
                  <button
                    type="button"
                    onClick={() => onResizeWidget(1, 0)}
                    className="hidden sm:inline-block px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold text-muted-foreground hover:text-foreground hover:bg-[#0396A6]/5 transition-all"
                    title="Expand Width (+1 Col)"
                  >
                    +W
                  </button>
                  <button
                    type="button"
                    onClick={() => onResizeWidget(-1, 0)}
                    className="hidden sm:inline-block px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold text-muted-foreground hover:text-foreground hover:bg-[#0396A6]/5 transition-all"
                    title="Shrink Width (-1 Col)"
                  >
                    -W
                  </button>
                  <div className="hidden sm:block w-[1px] h-3 bg-[var(--line)] mx-0.5" />
                  <button
                    type="button"
                    onClick={() => onResizeWidget(0, 1)}
                    className="px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold text-muted-foreground hover:text-foreground hover:bg-[#0396A6]/5 transition-all"
                    title="Expand Height (+1 Row)"
                  >
                    +H
                  </button>
                  <button
                    type="button"
                    onClick={() => onResizeWidget(0, -1)}
                    className="px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold text-muted-foreground hover:text-foreground hover:bg-[#0396A6]/5 transition-all"
                    title="Shrink Height (-1 Row)"
                  >
                    -H
                  </button>
                </div>
              )}

              {/* Remove Widget Button */}
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 rounded-xl bg-[#0396A6]/10 border border-[#0396A6]/20 text-[#0396A6] hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-500 transition-all"
                title="Remove widget from dashboard"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Chart Body */}
        <div className="flex-1 min-h-0 min-h-[160px] sm:min-h-0 relative overflow-hidden rounded-xl">
          {content}
        </div>

        {/* Dedicated Chart Customization Studio Modal */}
        <ChartCustomizationModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          widgetDef={widgetDef}
          widgetInstance={widgetInstance}
          data={data}
          onApply={onUpdateWidget}
          onReset={() => {
            onUpdateWidget({
              chartType: widgetDef.defaultChartType,
              color: "emerald",
              customColors: undefined,
              chartStyles: undefined,
              showGrid: true,
              smooth: true,
              timeframe: "day",
            });
            setShowSettings(false);
          }}
        />
      </div>{/* end inner padding wrapper */}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl relative overflow-hidden p-6">
      {/* Subtle animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0396A6]/10 via-transparent to-[var(--surf-1)] opacity-60" />
      <div className="absolute inset-0">
        <svg className="w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="emptyDots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#0396A6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#emptyDots)" />
        </svg>
      </div>
      <div className="z-10 flex flex-col items-center gap-2.5">
        <div className="p-3.5 rounded-2xl bg-[#0396A6]/10 border border-[#0396A6]/20">
          <BarChart3 className="w-5 h-5 text-[#0396A6]" />
        </div>
        <span className="text-sm font-bold font-sans text-foreground">No data yet</span>
        <span className="text-xs text-muted-foreground/70 max-w-[200px] text-center leading-relaxed">
          Data will appear here once activity is recorded
        </span>
      </div>
    </div>
  );
}

function AwaitingApiState({ endpoint }: { endpoint: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#0396A6]/20 relative overflow-hidden p-6 text-center">
      {/* Grid paper background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0396A6]/10 to-transparent" />
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="gridPat" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#0396A6" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gridPat)" />
      </svg>
      
      <div className="z-10 flex flex-col items-center gap-2.5">
        <div className="p-3.5 rounded-2xl bg-[#0396A6]/10 border border-[#0396A6]/20 shadow-sm">
          <Activity className="w-5 h-5 text-[#0396A6] animate-pulse" />
        </div>
        <span className="text-sm font-bold font-sans text-foreground">Awaiting API</span>
        <span className="text-[11px] font-mono text-[#0396A6] bg-[#0396A6]/10 px-3 py-1 rounded-xl border border-[#0396A6]/20 break-all max-w-full">
          {endpoint}
        </span>
      </div>
    </div>
  );
}
