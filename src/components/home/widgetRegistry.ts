"use client";

/**
 * Chart Registry — defines all customizable charts available for the analytics grid.
 */

import type { AnalyticsOverview, AnalyticsQuality, Wallet } from "@/lib/types";

export type WidgetSize = { w: number; h: number };
export type WidgetMinSize = { minW: number; minH: number };
export type ChartType = "area" | "bar" | "line" | "pie" | "donut" | "progress";

export type WidgetDef = {
  id: string;
  label: string;
  description: string;
  category: "conversations" | "leads" | "ai" | "billing" | "knowledge";
  defaultSize: WidgetSize;
  minSize: WidgetMinSize;
  chartTypes: ChartType[];
  defaultChartType: ChartType;
};

export const WIDGET_REGISTRY: WidgetDef[] = [
  {
    id: "conversations_volume",
    label: "Conversation Volume",
    description: "Daily conversation trend over the last 30 days",
    category: "conversations",
    defaultSize: { w: 1, h: 2 },
    minSize: { minW: 1, minH: 2 },
    chartTypes: ["area", "bar", "line"],
    defaultChartType: "area",
  },
  {
    id: "leads_temperature",
    label: "Lead Intent & Temperature",
    description: "Breakdown of Cold, Warm, and Hot leads",
    category: "leads",
    defaultSize: { w: 1, h: 2 },
    minSize: { minW: 1, minH: 2 },
    chartTypes: ["bar", "pie", "donut"],
    defaultChartType: "bar",
  },
  {
    id: "open_by_channel",
    label: "Open Conversations by Channel",
    description: "Active conversations split across Website and WhatsApp",
    category: "conversations",
    defaultSize: { w: 1, h: 2 },
    minSize: { minW: 1, minH: 2 },
    chartTypes: ["donut", "pie", "bar"],
    defaultChartType: "donut",
  },
  {
    id: "ai_grounding",
    label: "AI Knowledge Base Accuracy",
    description: "Rate of AI responses grounded in your knowledge base",
    category: "ai",
    defaultSize: { w: 1, h: 2 },
    minSize: { minW: 1, minH: 2 },
    chartTypes: ["donut", "pie"],
    defaultChartType: "donut",
  },
  {
    id: "credits_usage",
    label: "Billing Period Credit Usage",
    description: "Consumption of plan quota in current billing period",
    category: "billing",
    defaultSize: { w: 1, h: 2 },
    minSize: { minW: 1, minH: 2 },
    chartTypes: ["donut", "pie"],
    defaultChartType: "donut",
  },
  {
    id: "kb_gap_rate",
    label: "Knowledge Gap Frequency",
    description: "Percentage of queries hitting ungrounded knowledge gaps",
    category: "knowledge",
    defaultSize: { w: 1, h: 2 },
    minSize: { minW: 1, minH: 2 },
    chartTypes: ["donut", "pie"],
    defaultChartType: "donut",
  },
  {
    id: "kpi_conversations_7d",
    label: "Conversations (7d)",
    description: "Total conversations in the last 7 days and active count",
    category: "conversations",
    defaultSize: { w: 1, h: 1 },
    minSize: { minW: 1, minH: 1 },
    chartTypes: ["area", "bar", "line", "donut"],
    defaultChartType: "area",
  },
  {
    id: "kpi_hot_leads",
    label: "Hot Leads Metric",
    description: "Count of hot leads and total pipeline in 30 days",
    category: "leads",
    defaultSize: { w: 1, h: 1 },
    minSize: { minW: 1, minH: 1 },
    chartTypes: ["area", "bar", "line", "donut"],
    defaultChartType: "area",
  },
  {
    id: "kpi_meetings_upcoming",
    label: "Meetings Upcoming Metric",
    description: "Total upcoming meetings and confirmation status",
    category: "knowledge",
    defaultSize: { w: 1, h: 1 },
    minSize: { minW: 1, minH: 1 },
    chartTypes: ["area", "bar", "line", "donut"],
    defaultChartType: "area",
  },
  {
    id: "kpi_credits_balance",
    label: "Credits Balance Metric",
    description: "Available credit balance and period consumption",
    category: "billing",
    defaultSize: { w: 1, h: 1 },
    minSize: { minW: 1, minH: 1 },
    chartTypes: ["area", "bar", "line", "donut"],
    defaultChartType: "area",
  },
  {
    id: "kpi_kb_gaps_open",
    label: "KB Gaps Open Metric",
    description: "Open knowledge gap count against total AI runs",
    category: "knowledge",
    defaultSize: { w: 1, h: 1 },
    minSize: { minW: 1, minH: 1 },
    chartTypes: ["area", "bar", "line", "donut"],
    defaultChartType: "area",
  },
  {
    id: "kpi_agents_active",
    label: "Agents Active Metric",
    description: "Active AI agents count and queued handoffs",
    category: "ai",
    defaultSize: { w: 1, h: 1 },
    minSize: { minW: 1, minH: 1 },
    chartTypes: ["area", "bar", "line", "donut"],
    defaultChartType: "area",
  },
];

export function getWidgetDef(id: string): WidgetDef | undefined {
  return WIDGET_REGISTRY.find((w) => w.id === id);
}

export type WidgetCustomColors = {
  primary?: string;
  secondary?: string;
  grid?: string;
  axis?: string;
  segments?: Record<string, string>; // category key -> hex color
};

export type WidgetChartStyles = {
  strokeWidth?: number;     // 1 to 6
  fillOpacity?: number;     // 0 to 1
  borderRadius?: number;    // 0 to 16
  innerRadiusPct?: number;  // 0 to 80 (0 = full pie, 50-70 = donut)
  paddingAngle?: number;    // 0 to 10
  showLegend?: boolean;
  legendPosition?: "top" | "bottom" | "right";
  showAxis?: boolean;
  showDots?: boolean;
  dotSize?: number;
  gradient?: boolean;
};

export type PresetPalette = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  colors: string[];
};

export const PRESET_PALETTES: PresetPalette[] = [
  {
    id: "frosty",
    name: "Frosty Default",
    primary: "#0396A6",
    secondary: "#67C9CE",
    colors: ["#0396A6", "#67C9CE", "#C89A57", "#065E6A", "#A7EBEC", "#087681"],
  },
  {
    id: "indigo",
    name: "Indigo",
    primary: "#6366f1",
    secondary: "#818cf8",
    colors: ["#6366f1", "#818cf8", "#a5b4fc", "#4f46e5", "#c7d2fe", "#3730a3"],
  },
  {
    id: "purple",
    name: "Purple",
    primary: "#8b5cf6",
    secondary: "#a78bfa",
    colors: ["#8b5cf6", "#a78bfa", "#c4b5fd", "#7c3aed", "#ddd6fe", "#5b21b6"],
  },
  {
    id: "ocean",
    name: "Ocean",
    primary: "#0284c7",
    secondary: "#38bdf8",
    colors: ["#0284c7", "#38bdf8", "#7dd3fc", "#0369a1", "#bae6fd", "#075985"],
  },
  {
    id: "emerald",
    name: "Emerald",
    primary: "#10b981",
    secondary: "#34d399",
    colors: ["#10b981", "#34d399", "#6ee7b7", "#059669", "#a7f3d0", "#047857"],
  },
  {
    id: "sunset",
    name: "Sunset",
    primary: "#ea580c",
    secondary: "#f97316",
    colors: ["#ea580c", "#f97316", "#fb923c", "#c2410c", "#fed7aa", "#9a3412"],
  },
  {
    id: "warm",
    name: "Warm",
    primary: "#d97706",
    secondary: "#f59e0b",
    colors: ["#d97706", "#f59e0b", "#fbbf24", "#b45309", "#fde68a", "#78350f"],
  },
  {
    id: "rose",
    name: "Rose",
    primary: "#e11d48",
    secondary: "#f43f5e",
    colors: ["#e11d48", "#f43f5e", "#fb7185", "#be123c", "#fecdd3", "#881337"],
  },
  {
    id: "monochrome",
    name: "Monochrome",
    primary: "#334155",
    secondary: "#64748b",
    colors: ["#334155", "#475569", "#64748b", "#1e293b", "#94a3b8", "#0f172a"],
  },
];

export type WidgetInstance = {
  id: string;
  chartType: ChartType;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  showGrid?: boolean;
  smooth?: boolean;
  timeframe?: "day" | "week" | "month";
  customColors?: WidgetCustomColors;
  chartStyles?: WidgetChartStyles;
};

// Default layout structured across 2 columns
export const DEFAULT_LAYOUT: WidgetInstance[] = [
  { id: "conversations_volume", chartType: "area",     x: 0, y: 0, w: 1, h: 2, color: "emerald" },
  { id: "leads_temperature",    chartType: "bar",      x: 1, y: 0, w: 1, h: 2, color: "indigo" },
  { id: "open_by_channel",      chartType: "donut",    x: 0, y: 2, w: 1, h: 2, color: "cyan" },
  { id: "ai_grounding",         chartType: "donut",    x: 1, y: 2, w: 1, h: 2, color: "emerald" },
  { id: "credits_usage",        chartType: "donut",    x: 0, y: 4, w: 1, h: 2, color: "purple" },
  { id: "kb_gap_rate",          chartType: "donut",    x: 1, y: 4, w: 1, h: 2, color: "amber" },
];

/**
 * Clean Auto-Format packing that preserves item dimensions and sorts by visual (Y, X) position.
 */
export function autoFormatLayout(widgets: WidgetInstance[], maxCols: number = 2): WidgetInstance[] {
  const sorted = [...widgets].sort((a, b) => a.y - b.y || a.x - b.x);

  let curX = 0;
  let curY = 0;
  let curRowMaxH = 0;

  return sorted.map((w) => {
    const width = Math.min(w.w, maxCols);

    if (curX + width > maxCols) {
      curY += curRowMaxH || 2;
      curX = 0;
      curRowMaxH = 0;
    }

    const formatted: WidgetInstance = {
      ...w,
      x: curX,
      y: curY,
      w: width,
    };

    curX += width;
    curRowMaxH = Math.max(curRowMaxH, w.h);

    if (curX >= maxCols) {
      curY += curRowMaxH;
      curX = 0;
      curRowMaxH = 0;
    }

    return formatted;
  });
}

const STORAGE_KEY = "frosty_charts_layout";

export function loadLayout(): WidgetInstance[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: WidgetInstance[] = JSON.parse(raw);
    // Drop widgets removed from the registry (e.g. after chart deprecation).
    return parsed
      .filter((w) => getWidgetDef(w.id))
      .map((w) => ({
      ...w,
      w: Math.min(w.w, 2),
      h: Math.min(w.h, 3),
    }));
  } catch {
    return null;
  }
}

export function saveLayout(layout: WidgetInstance[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // fail silently
  }
}
