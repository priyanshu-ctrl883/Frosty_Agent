"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Area, AreaChart, Bar, BarChart, Line, LineChart,
  Pie, PieChart, Cell, Tooltip,
  CartesianGrid, XAxis, YAxis
} from "recharts";
import { StableChartContainer } from "./StableChartContainer";
import {
  SlidersHorizontal, X, Activity, BarChart3, LineChart as LineChartIcon,
  PieChart as PieChartIcon, Check, RotateCcw, Palette, Sparkles, Layout,
  Eye, CheckCircle2
} from "lucide-react";
import {
  type ChartType,
  type WidgetDef,
  type WidgetInstance,
  type WidgetCustomColors,
  type WidgetChartStyles,
  PRESET_PALETTES,
} from "./widgetRegistry";
import type { WidgetData } from "./WidgetCard";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  widgetDef: WidgetDef;
  widgetInstance: WidgetInstance;
  data: WidgetData;
  onApply: (updates: Partial<WidgetInstance>) => void;
  onReset: () => void;
};

const MARGIN_DEFAULT = { top: 10, right: 10, left: -15, bottom: 0 };
const MARGIN_BAR_V = { top: 10, right: 10, left: 10, bottom: 0 };

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(15, 23, 42, 0.95)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "12px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
  color: "#fff",
};

const TICK_STYLE = { fill: "#8A8D98", fontSize: 10 };

// Color sanitization helper
function normalizeHex(hex: string, fallback = "#0396A6"): string {
  if (!hex) return fallback;
  let clean = hex.trim();
  if (!clean.startsWith("#")) clean = `#${clean}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(clean)) return clean;
  if (/^#[0-9A-Fa-f]{3}$/.test(clean)) {
    const r = clean[1], g = clean[2], b = clean[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return clean;
}

// Dynamically extract categories that actually exist in this widget's dataset
export function getDynamicSegmentCategories(
  widgetDefId: string,
  data: WidgetData,
  primaryFallback = "#0396A6"
): { key: string; label: string; defaultColor: string }[] {
  const { overview } = data;

  switch (widgetDefId) {
    case "open_by_channel": {
      const ch = overview?.open_by_channel;
      const channels: string[] = [];

      if (ch && typeof ch === "object") {
        Object.keys(ch).forEach((k) => {
          if (ch[k as keyof typeof ch] !== undefined && !channels.includes(k.toLowerCase())) {
            channels.push(k.toLowerCase());
          }
        });
      }

      // If overview is empty or no keys found, fallback strictly to the 2 active channels
      const activeChannels = channels.length > 0 ? channels : ["website", "whatsapp"];

      const channelColorMap: Record<string, string> = {
        website: "#818cf8",
        whatsapp: "#9B7FD4",
        instagram: "#ec4899",
        facebook: "#2563eb",
      };

      return activeChannels.map((c) => ({
        key: c,
        label: c.charAt(0).toUpperCase() + c.slice(1),
        defaultColor: channelColorMap[c] || "#6366f1",
      }));
    }

    case "leads_temperature": {
      return [
        { key: "cold", label: "Cold Leads", defaultColor: "#63b6d0" },
        { key: "warm", label: "Warm Leads", defaultColor: "#e8b76a" },
        { key: "hot", label: "Hot Leads", defaultColor: "#e8805e" },
      ];
    }

    case "ai_grounding": {
      return [
        { key: "grounded", label: "Grounded in KB", defaultColor: primaryFallback },
        { key: "ungrounded", label: "Ungrounded", defaultColor: "#64748b" },
      ];
    }

    case "credits_usage": {
      return [
        { key: "used", label: "Credits Used", defaultColor: primaryFallback },
        { key: "remaining", label: "Remaining Balance", defaultColor: "#94a3b8" },
      ];
    }

    case "kb_gap_rate": {
      return [
        { key: "gap", label: "Gap Queries", defaultColor: "#e11d48" },
        { key: "grounded", label: "Answered", defaultColor: primaryFallback },
      ];
    }

    default:
      // Single series charts (Conversation volume, Sparkline KPIs) have no category slices
      return [];
  }
}

export function ChartCustomizationModal({
  isOpen,
  onClose,
  widgetDef,
  widgetInstance,
  data,
  onApply,
  onReset,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Navigation tabs inside customize modal
  const [activeTab, setActiveTab] = useState<"chart" | "appearance" | "display">("chart");

  // Local staging state
  const [stagedChartType, setStagedChartType] = useState<ChartType>(
    widgetInstance.chartType || widgetDef.defaultChartType
  );
  const [stagedTimeframe, setStagedTimeframe] = useState<"day" | "week" | "month">(
    widgetInstance.timeframe || "day"
  );
  const [stagedShowGrid, setStagedShowGrid] = useState<boolean>(
    widgetInstance.showGrid ?? true
  );
  const [stagedSmooth, setStagedSmooth] = useState<boolean>(
    widgetInstance.smooth ?? true
  );

  // Custom Colors staging
  const [stagedColors, setStagedColors] = useState<WidgetCustomColors>(() => {
    const existing = widgetInstance.customColors || {};
    return {
      primary: existing.primary || (widgetInstance.color === "emerald" ? "#0396A6" : widgetInstance.color ? PRESET_PALETTES.find(p => p.id === widgetInstance.color)?.primary || "#6366f1" : "#0396A6"),
      secondary: existing.secondary || "#67C9CE",
      grid: existing.grid || "rgba(103,62,190,0.1)",
      axis: existing.axis || "#8A8D98",
      segments: existing.segments ? { ...existing.segments } : {},
    };
  });

  // Chart Styles staging
  const [stagedStyles, setStagedStyles] = useState<WidgetChartStyles>(() => {
    const existing = widgetInstance.chartStyles || {};
    return {
      strokeWidth: existing.strokeWidth ?? 2.5,
      fillOpacity: existing.fillOpacity ?? 0.35,
      borderRadius: existing.borderRadius ?? 6,
      innerRadiusPct: existing.innerRadiusPct ?? (widgetInstance.chartType === "pie" ? 0 : 60),
      paddingAngle: existing.paddingAngle ?? 4,
      showLegend: existing.showLegend ?? true,
      legendPosition: existing.legendPosition ?? "right",
      showAxis: existing.showAxis ?? true,
      showDots: existing.showDots ?? (widgetInstance.chartType === "line"),
      dotSize: existing.dotSize ?? 3,
      gradient: existing.gradient ?? true,
    };
  });

  // Dynamically computed categories for this widget
  const dynamicCategories = useMemo(() => {
    return getDynamicSegmentCategories(widgetDef.id, data, stagedColors.primary || "#0396A6");
  }, [widgetDef.id, data, stagedColors.primary]);

  // Re-sync on open
  useEffect(() => {
    if (isOpen) {
      setStagedChartType(widgetInstance.chartType || widgetDef.defaultChartType);
      setStagedTimeframe(widgetInstance.timeframe || "day");
      setStagedShowGrid(widgetInstance.showGrid ?? true);
      setStagedSmooth(widgetInstance.smooth ?? true);

      const existing = widgetInstance.customColors || {};
      const prim = existing.primary || (widgetInstance.color === "emerald" ? "#0396A6" : widgetInstance.color ? PRESET_PALETTES.find(p => p.id === widgetInstance.color)?.primary || "#6366f1" : "#0396A6");
      const sec = existing.secondary || "#67C9CE";

      setStagedColors({
        primary: prim,
        secondary: sec,
        grid: existing.grid || "rgba(103,62,190,0.1)",
        axis: existing.axis || "#8A8D98",
        segments: existing.segments ? { ...existing.segments } : {},
      });

      const s = widgetInstance.chartStyles || {};
      setStagedStyles({
        strokeWidth: s.strokeWidth ?? 2.5,
        fillOpacity: s.fillOpacity ?? 0.35,
        borderRadius: s.borderRadius ?? 6,
        innerRadiusPct: s.innerRadiusPct ?? (widgetInstance.chartType === "pie" ? 0 : 60),
        paddingAngle: s.paddingAngle ?? 4,
        showLegend: s.showLegend ?? true,
        legendPosition: s.legendPosition ?? "right",
        showAxis: s.showAxis ?? true,
        showDots: s.showDots ?? (widgetInstance.chartType === "line"),
        dotSize: s.dotSize ?? 3,
        gradient: s.gradient ?? true,
      });
    }
  }, [isOpen, widgetInstance, widgetDef]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Apply Preset Palette
  const handleApplyPreset = (palette: (typeof PRESET_PALETTES)[number]) => {
    const updatedSegmentsMap: Record<string, string> = {};
    dynamicCategories.forEach((seg, idx) => {
      const col = palette.colors[idx % palette.colors.length] || palette.primary;
      updatedSegmentsMap[seg.key] = col;
    });

    setStagedColors({
      ...stagedColors,
      primary: palette.primary,
      secondary: palette.secondary,
      segments: {
        ...stagedColors.segments,
        ...updatedSegmentsMap,
      },
    });
  };

  // Update segment color only
  const handleSetSegmentColor = (key: string, color: string) => {
    setStagedColors((prev) => ({
      ...prev,
      segments: {
        ...prev.segments,
        [key]: color,
      },
    }));
  };

  // Final Apply handler
  const handleSaveAndApply = () => {
    onApply({
      chartType: stagedChartType,
      timeframe: stagedTimeframe,
      showGrid: stagedShowGrid,
      smooth: stagedSmooth,
      customColors: stagedColors,
      chartStyles: stagedStyles,
    });
    onClose();
  };

  const isCircularChart = stagedChartType === "donut" || stagedChartType === "pie";

  // Data prepared for the Live Preview
  const previewData = useMemo(() => {
    const { overview, quality, usedThisPeriod, quotaBase } = data;

    switch (widgetDef.id) {
      case "conversations_volume": {
        const series = overview?.conversations_by_day || [
          { day: "2026-08-14", conversations: 12 },
          { day: "2026-08-15", conversations: 19 },
          { day: "2026-08-16", conversations: 24 },
          { day: "2026-08-17", conversations: 18 },
          { day: "2026-08-18", conversations: 29 },
          { day: "2026-08-19", conversations: 35 },
          { day: "2026-08-20", conversations: 28 },
        ];
        return { type: "timeseries", data: series };
      }

      case "leads_temperature": {
        const lt = overview?.leads_by_temperature;
        const d = [
          { name: "Cold", value: lt?.cold ?? 14, fill: normalizeHex(stagedColors.segments?.cold || "#63b6d0") },
          { name: "Warm", value: lt?.warm ?? 26, fill: normalizeHex(stagedColors.segments?.warm || "#e8b76a") },
          { name: "Hot", value: lt?.hot ?? 42, fill: normalizeHex(stagedColors.segments?.hot || "#e8805e") },
        ];
        return { type: isCircularChart ? "pie" : "bar_vertical", data: d };
      }

      case "open_by_channel": {
        const ch = overview?.open_by_channel;
        const items = dynamicCategories.map((c) => {
          const val = ch?.[c.key as keyof typeof ch] ?? (c.key === "website" ? 38 : 24);
          return {
            name: c.label,
            value: Number(val) || (c.key === "website" ? 38 : 24),
            fill: normalizeHex(stagedColors.segments?.[c.key] || c.defaultColor),
          };
        });
        return { type: isCircularChart ? "pie" : "bar_vertical", data: items };
      }

      case "ai_grounding": {
        const rate = quality ? Math.round(quality.grounded_rate * 100) : 88;
        const d = [
          { name: "Grounded", value: rate, fill: normalizeHex(stagedColors.segments?.grounded || stagedColors.primary || "#0396A6") },
          { name: "Ungrounded", value: 100 - rate, fill: normalizeHex(stagedColors.segments?.ungrounded || "#64748b") },
        ];
        return { type: isCircularChart ? "pie" : "bar_vertical", data: d };
      }

      case "credits_usage": {
        const used = usedThisPeriod || 620;
        const quota = quotaBase || 1000;
        const rem = Math.max(0, quota - used);
        const d = [
          { name: "Used", value: used, fill: normalizeHex(stagedColors.segments?.used || stagedColors.primary || "#0396A6") },
          { name: "Remaining", value: rem, fill: normalizeHex(stagedColors.segments?.remaining || "#94a3b8") },
        ];
        return { type: isCircularChart ? "pie" : "bar_vertical", data: d };
      }

      case "kb_gap_rate": {
        const d = [
          { name: "Gap Queries", value: 12, fill: normalizeHex(stagedColors.segments?.gap || "#e11d48") },
          { name: "Answered", value: 88, fill: normalizeHex(stagedColors.segments?.grounded || stagedColors.primary || "#0396A6") },
        ];
        return { type: isCircularChart ? "pie" : "bar_vertical", data: d };
      }

      default: {
        const series = [
          { day: "Mon", conversations: 12, val: 12 },
          { day: "Tue", conversations: 19, val: 19 },
          { day: "Wed", conversations: 24, val: 24 },
          { day: "Thu", conversations: 18, val: 18 },
          { day: "Fri", conversations: 29, val: 29 },
          { day: "Sat", conversations: 35, val: 35 },
          { day: "Sun", conversations: 28, val: 28 },
        ];
        return { type: "timeseries", data: series };
      }
    }
  }, [widgetDef.id, isCircularChart, data, stagedColors, dynamicCategories]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div
        data-lenis-prevent
        className="fixed inset-0 z-[999999] bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto"
      >
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-5xl h-[88vh] max-h-[760px] my-auto overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl flex flex-col text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/15 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ backgroundColor: stagedColors.primary || "#0396A6" }}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-foreground truncate">
                    {widgetDef.label} Customization
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-0.5 rounded-full bg-muted/40 border border-border">
                    {widgetDef.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  Personalize chart type, colors, stroke, and live visual settings.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted/30 text-xs font-bold text-muted-foreground hover:text-foreground transition-all shadow-2xs"
                title="Reset all settings to factory default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/30 transition-colors"
                title="Close (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Split Grid */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* LEFT COLUMN: Categorized Controls */}
            <div className="w-full md:w-[52%] lg:w-[50%] flex flex-col border-b md:border-b-0 md:border-r border-border bg-background min-h-0">
              {/* Category Pill Tabs */}
              <div className="p-3 border-b border-border bg-muted/10 shrink-0">
                <div className="grid grid-cols-3 gap-1.5 bg-muted/30 p-1 rounded-xl border border-border">
                  {[
                    { id: "chart", label: "Chart", icon: Layout },
                    { id: "appearance", label: "Appearance", icon: Palette },
                    { id: "display", label: "Display", icon: Eye },
                  ].map((t) => {
                    const Icon = t.icon;
                    const active = activeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTab(t.id as any)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${
                          active
                            ? "bg-card text-foreground shadow-xs border border-border"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable Control Panes */}
              <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                {/* ─── TAB 1: CHART TYPE & GROUPING ─── */}
                {activeTab === "chart" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3">
                        Chart Type
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {widgetDef.chartTypes.map((ct) => {
                          const isSelected = stagedChartType === ct;
                          return (
                            <button
                              key={ct}
                              type="button"
                              onClick={() => {
                                setStagedChartType(ct);
                                if (ct === "pie") {
                                  setStagedStyles((s) => ({ ...s, innerRadiusPct: 0 }));
                                } else if (ct === "donut") {
                                  setStagedStyles((s) => ({ ...s, innerRadiusPct: 64 }));
                                }
                              }}
                              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? "border-2 text-foreground shadow-sm"
                                  : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/20"
                              }`}
                              style={{
                                borderColor: isSelected ? stagedColors.primary || "#0396A6" : undefined,
                                backgroundColor: isSelected ? `${stagedColors.primary || "#0396A6"}12` : undefined,
                              }}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white ${
                                  isSelected ? "" : "bg-muted text-muted-foreground"
                                }`}
                                style={{
                                  backgroundColor: isSelected ? stagedColors.primary || "#0396A6" : undefined,
                                }}
                              >
                                {ct === "area" && <Activity className="w-4 h-4" />}
                                {ct === "bar" && <BarChart3 className="w-4 h-4" />}
                                {ct === "line" && <LineChartIcon className="w-4 h-4" />}
                                {ct === "pie" && <PieChartIcon className="w-4 h-4" />}
                                {ct === "donut" && <PieChartIcon className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-extrabold capitalize text-foreground flex items-center gap-1.5">
                                  {ct} Chart
                                  {isSelected && <Check className="w-3 h-3 text-[#0396A6]" />}
                                </div>
                                <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                                  {ct === "area" && "Filled gradient area line"}
                                  {ct === "bar" && "Vertical column comparison"}
                                  {ct === "line" && "Crisp continuous trendline"}
                                  {ct === "pie" && "Solid circular proportion"}
                                  {ct === "donut" && "Ring distribution with center stat"}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Data Grouping */}
                    <div className="pt-4 border-t border-border">
                      <label className="block text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3">
                        Data Grouping
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["day", "week", "month"] as const).map((tf) => {
                          const isSelected = stagedTimeframe === tf;
                          return (
                            <button
                              key={tf}
                              type="button"
                              onClick={() => setStagedTimeframe(tf)}
                              className={`py-2.5 text-xs font-extrabold rounded-xl border transition-all capitalize ${
                                isSelected
                                  ? "bg-card text-foreground border-2 shadow-xs"
                                  : "border-border bg-muted/15 text-muted-foreground hover:text-foreground"
                              }`}
                              style={{
                                borderColor: isSelected ? stagedColors.primary || "#0396A6" : undefined,
                              }}
                            >
                              {tf}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 2: APPEARANCE (PALETTES, PICKERS, SLIDERS) ─── */}
                {activeTab === "appearance" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Color Presets */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <label className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#0396A6]" /> Curated Presets
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {PRESET_PALETTES.map((p) => {
                          const isActive = stagedColors.primary?.toLowerCase() === p.primary.toLowerCase();
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleApplyPreset(p)}
                              className={`p-2 rounded-xl border flex flex-col gap-1.5 text-left transition-all ${
                                isActive
                                  ? "bg-muted/40 border-2 shadow-xs"
                                  : "border-border bg-card hover:bg-muted/20"
                              }`}
                              style={{ borderColor: isActive ? p.primary : undefined }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-foreground truncate">
                                  {p.name}
                                </span>
                                {isActive && <CheckCircle2 className="w-3 h-3 text-[#0396A6] shrink-0" />}
                              </div>
                              <div className="flex items-center gap-1">
                                {p.colors.slice(0, 4).map((c, i) => (
                                  <div
                                    key={i}
                                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Primary & Secondary Colors */}
                    <div className="pt-4 border-t border-border space-y-4">
                      <label className="block text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                        Custom Color Palette
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Primary Color */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Primary Color
                          </span>
                          <div className="flex items-center gap-3 p-2 rounded-xl border border-border bg-card">
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-border/80 shrink-0 shadow-inner cursor-pointer">
                              <input
                                type="color"
                                value={normalizeHex(stagedColors.primary || "#0396A6")}
                                onChange={(e) =>
                                  setStagedColors({ ...stagedColors, primary: e.target.value })
                                }
                                className="absolute -top-3 -left-3 w-14 h-14 cursor-pointer"
                              />
                            </div>
                            <input
                              type="text"
                              value={stagedColors.primary || "#0396A6"}
                              onChange={(e) =>
                                setStagedColors({ ...stagedColors, primary: e.target.value })
                              }
                              className="w-full bg-transparent text-xs font-mono font-bold text-foreground uppercase outline-none"
                            />
                          </div>
                        </div>

                        {/* Secondary Color */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Secondary / Fill
                          </span>
                          <div className="flex items-center gap-3 p-2 rounded-xl border border-border bg-card">
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-border/80 shrink-0 shadow-inner cursor-pointer">
                              <input
                                type="color"
                                value={normalizeHex(stagedColors.secondary || "#67C9CE")}
                                onChange={(e) =>
                                  setStagedColors({ ...stagedColors, secondary: e.target.value })
                                }
                                className="absolute -top-3 -left-3 w-14 h-14 cursor-pointer"
                              />
                            </div>
                            <input
                              type="text"
                              value={stagedColors.secondary || "#67C9CE"}
                              onChange={(e) =>
                                setStagedColors({ ...stagedColors, secondary: e.target.value })
                              }
                              className="w-full bg-transparent text-xs font-mono font-bold text-foreground uppercase outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category & Segment Colors (Only shown if this widget actually has categories) */}
                    {dynamicCategories.length > 0 && (
                      <div className="pt-4 border-t border-border space-y-3">
                        <div>
                          <label className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground block">
                            Category &amp; Segment Colors
                          </label>
                          <span className="text-[10px] text-muted-foreground">
                            Customize colors for each active data category
                          </span>
                        </div>

                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {dynamicCategories.map((cat) => {
                            const curColor = stagedColors.segments?.[cat.key] || cat.defaultColor;
                            return (
                              <div
                                key={cat.key}
                                className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/15 gap-3"
                              >
                                <span className="text-xs font-bold text-foreground truncate min-w-0 flex-1">
                                  {cat.label}
                                </span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="relative w-7 h-7 rounded-md overflow-hidden border border-border shrink-0 shadow-xs cursor-pointer">
                                    <input
                                      type="color"
                                      value={normalizeHex(curColor, "#0396A6")}
                                      onChange={(e) => handleSetSegmentColor(cat.key, e.target.value)}
                                      className="absolute -top-3 -left-3 w-14 h-14 cursor-pointer"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={curColor}
                                    onChange={(e) => handleSetSegmentColor(cat.key, e.target.value)}
                                    className="text-[11px] font-mono uppercase font-bold text-muted-foreground w-16 bg-transparent outline-none"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Geometry & Geometry Fine-tuning */}
                    <div className="pt-4 border-t border-border space-y-4">
                      <label className="block text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                        Geometry &amp; Styling
                      </label>

                      {/* Stroke Width (Line / Area) */}
                      {(stagedChartType === "line" || stagedChartType === "area") && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-foreground">
                            <span>Line Thickness</span>
                            <span className="font-mono text-muted-foreground">{stagedStyles.strokeWidth}px</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="6"
                            step="0.5"
                            value={stagedStyles.strokeWidth ?? 2.5}
                            onChange={(e) =>
                              setStagedStyles({ ...stagedStyles, strokeWidth: parseFloat(e.target.value) })
                            }
                            className="w-full accent-[#0396A6] cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Fill Opacity (Area) */}
                      {stagedChartType === "area" && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-foreground">
                            <span>Area Fill Opacity</span>
                            <span className="font-mono text-muted-foreground">
                              {Math.round((stagedStyles.fillOpacity ?? 0.35) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.05"
                            max="0.9"
                            step="0.05"
                            value={stagedStyles.fillOpacity ?? 0.35}
                            onChange={(e) =>
                              setStagedStyles({ ...stagedStyles, fillOpacity: parseFloat(e.target.value) })
                            }
                            className="w-full accent-[#0396A6] cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Bar Corner Radius (Bar) */}
                      {stagedChartType === "bar" && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-foreground">
                            <span>Bar Corner Radius</span>
                            <span className="font-mono text-muted-foreground">{stagedStyles.borderRadius}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="16"
                            step="2"
                            value={stagedStyles.borderRadius ?? 6}
                            onChange={(e) =>
                              setStagedStyles({ ...stagedStyles, borderRadius: parseInt(e.target.value, 10) })
                            }
                            className="w-full accent-[#0396A6] cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Donut Thickness */}
                      {isCircularChart && (
                        <>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-foreground">
                              <span>Donut Ring Hole</span>
                              <span className="font-mono text-muted-foreground">{stagedStyles.innerRadiusPct ?? 64}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="75"
                              step="5"
                              value={stagedStyles.innerRadiusPct ?? 64}
                              onChange={(e) =>
                                setStagedStyles({ ...stagedStyles, innerRadiusPct: parseInt(e.target.value, 10) })
                              }
                              className="w-full accent-[#0396A6] cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-foreground">
                              <span>Segment Gap Angle</span>
                              <span className="font-mono text-muted-foreground">{stagedStyles.paddingAngle ?? 3}°</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="8"
                              step="1"
                              value={stagedStyles.paddingAngle ?? 3}
                              onChange={(e) =>
                                setStagedStyles({ ...stagedStyles, paddingAngle: parseInt(e.target.value, 10) })
                              }
                              className="w-full accent-[#0396A6] cursor-pointer"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── TAB 3: DISPLAY OPTIONS ─── */}
                {activeTab === "display" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3">
                      Visibility &amp; Elements
                    </label>

                    {/* For Pie / Donut Charts: Clean circular options */}
                    {isCircularChart ? (
                      <>
                        {/* Interactive Side Legend */}
                        <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/20 transition-colors">
                          <div>
                            <div className="text-xs font-extrabold text-foreground">Interactive Side Legend</div>
                            <div className="text-[11px] text-muted-foreground">Display metric breakdown cards on the side</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={stagedStyles.showLegend ?? true}
                            onChange={(e) => setStagedStyles({ ...stagedStyles, showLegend: e.target.checked })}
                            className="w-4 h-4 rounded text-[#0396A6] focus:ring-[#0396A6] accent-[#0396A6] cursor-pointer"
                          />
                        </label>

                        {/* Center Metric Label (For Donut) */}
                        <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/20 transition-colors">
                          <div>
                            <div className="text-xs font-extrabold text-foreground">Center Metric Display</div>
                            <div className="text-[11px] text-muted-foreground">Show total metric sum inside donut center</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={stagedStyles.showAxis ?? true}
                            onChange={(e) => setStagedStyles({ ...stagedStyles, showAxis: e.target.checked })}
                            className="w-4 h-4 rounded text-[#0396A6] focus:ring-[#0396A6] accent-[#0396A6] cursor-pointer"
                          />
                        </label>
                      </>
                    ) : (
                      /* For Line / Area / Bar: Grid & Axis options */
                      <>
                        {/* Gridlines Toggle */}
                        <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/20 transition-colors">
                          <div>
                            <div className="text-xs font-extrabold text-foreground">Show Gridlines</div>
                            <div className="text-[11px] text-muted-foreground">Background coordinate grid lines</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={stagedShowGrid}
                            onChange={(e) => setStagedShowGrid(e.target.checked)}
                            className="w-4 h-4 rounded text-[#0396A6] focus:ring-[#0396A6] accent-[#0396A6] cursor-pointer"
                          />
                        </label>

                        {/* Show Axis */}
                        <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/20 transition-colors">
                          <div>
                            <div className="text-xs font-extrabold text-foreground">Show Axis Labels</div>
                            <div className="text-[11px] text-muted-foreground">Show X and Y numerical axis markers</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={stagedStyles.showAxis ?? true}
                            onChange={(e) => setStagedStyles({ ...stagedStyles, showAxis: e.target.checked })}
                            className="w-4 h-4 rounded text-[#0396A6] focus:ring-[#0396A6] accent-[#0396A6] cursor-pointer"
                          />
                        </label>

                        {/* Smooth Curves */}
                        {(stagedChartType === "area" || stagedChartType === "line") && (
                          <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/20 transition-colors">
                            <div>
                              <div className="text-xs font-extrabold text-foreground">Smooth Curves</div>
                              <div className="text-[11px] text-muted-foreground">Interpolate data with cubic splines</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={stagedSmooth}
                              onChange={(e) => setStagedSmooth(e.target.checked)}
                              className="w-4 h-4 rounded text-[#0396A6] focus:ring-[#0396A6] accent-[#0396A6] cursor-pointer"
                            />
                          </label>
                        )}

                        {/* Point Dots */}
                        {(stagedChartType === "line" || stagedChartType === "area") && (
                          <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/20 transition-colors">
                            <div>
                              <div className="text-xs font-extrabold text-foreground">Data Point Markers</div>
                              <div className="text-[11px] text-muted-foreground">Render circular dots on data coordinates</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={stagedStyles.showDots ?? true}
                              onChange={(e) => setStagedStyles({ ...stagedStyles, showDots: e.target.checked })}
                              className="w-4 h-4 rounded text-[#0396A6] focus:ring-[#0396A6] accent-[#0396A6] cursor-pointer"
                            />
                          </label>
                        )}

                        {/* Gradient Fill */}
                        {stagedChartType === "area" && (
                          <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/20 transition-colors">
                            <div>
                              <div className="text-xs font-extrabold text-foreground">Gradient Fill Effect</div>
                              <div className="text-[11px] text-muted-foreground">Smoothly blend primary and secondary colors</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={stagedStyles.gradient ?? true}
                              onChange={(e) => setStagedStyles({ ...stagedStyles, gradient: e.target.checked })}
                              className="w-4 h-4 rounded text-[#0396A6] focus:ring-[#0396A6] accent-[#0396A6] cursor-pointer"
                            />
                          </label>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Live Interactive Chart Preview */}
            <div className="flex-1 flex flex-col p-5 sm:p-6 bg-muted/10 min-h-[320px] overflow-hidden">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                    Live Chart Preview
                  </h4>
                  <p className="text-[11px] text-muted-foreground">Real-time design reflection</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"
                    style={{ backgroundColor: stagedColors.primary || "#0396A6" }}
                  />
                  <span className="text-[11px] font-extrabold capitalize text-foreground font-mono">
                    {stagedChartType}
                  </span>
                </div>
              </div>

              {/* Preview Card Frame */}
              <div className="flex-1 w-full rounded-2xl border border-border bg-card p-4 sm:p-6 flex flex-col overflow-hidden shadow-sm relative">
                {/* Header in Preview */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60 shrink-0">
                  <span className="text-sm font-extrabold text-foreground truncate">
                    {widgetDef.label}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase px-2 py-0.5 rounded-md bg-muted/40">
                    {stagedTimeframe}
                  </span>
                </div>

                {/* Chart Graphic Area */}
                <div className="flex-1 w-full min-h-0 relative">
                <StableChartContainer minHeight={120} minWidth={100}>
                    {previewData.type === "pie" ? (
                      <PieChart>
                        <Pie
                          data={previewData.data as any}
                          cx="50%"
                          cy="50%"
                          innerRadius={`${stagedStyles.innerRadiusPct ?? (stagedChartType === "pie" ? 0 : 64)}%`}
                          outerRadius="84%"
                          paddingAngle={stagedStyles.paddingAngle ?? 3}
                          cornerRadius={(stagedStyles.innerRadiusPct ?? (stagedChartType === "pie" ? 0 : 64)) > 0 ? 4 : 0}
                          dataKey="value"
                          animationDuration={500}
                          stroke="var(--card, #fff)"
                          strokeWidth={2}
                        >
                          {previewData.data.map((entry: any, index: number) => (
                            <Cell key={`preview-cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    ) : previewData.type === "bar_vertical" ? (
                      <BarChart data={previewData.data as any} layout="vertical" margin={MARGIN_BAR_V}>
                        {stagedShowGrid && <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={stagedColors.grid || "rgba(103,62,190,0.1)"} />}
                        {stagedStyles.showAxis && <XAxis type="number" tick={TICK_STYLE} axisLine={false} tickLine={false} />}
                        {stagedStyles.showAxis && <YAxis type="category" dataKey="name" tick={TICK_STYLE} axisLine={false} tickLine={false} width={60} />}
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar
                          dataKey="value"
                          radius={[0, stagedStyles.borderRadius ?? 6, stagedStyles.borderRadius ?? 6, 0]}
                          animationDuration={500}
                        >
                          {previewData.data.map((entry: any, index: number) => (
                            <Cell key={`bar-cell-${index}`} fill={entry.fill || stagedColors.primary || "#0396A6"} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : stagedChartType === "bar" ? (
                      <BarChart data={previewData.data as any} margin={MARGIN_DEFAULT}>
                        <defs>
                          <linearGradient id="preview-bg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={stagedColors.primary || "#0396A6"} />
                            <stop offset="100%" stopColor={stagedColors.secondary || stagedColors.primary || "#67C9CE"} stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        {stagedShowGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={stagedColors.grid || "rgba(103,62,190,0.1)"} />}
                        {stagedStyles.showAxis && <XAxis dataKey="day" tick={TICK_STYLE} axisLine={false} tickLine={false} />}
                        {stagedStyles.showAxis && <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />}
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar
                          dataKey="conversations"
                          fill="url(#preview-bg)"
                          radius={[stagedStyles.borderRadius ?? 6, stagedStyles.borderRadius ?? 6, 0, 0]}
                          animationDuration={500}
                        />
                      </BarChart>
                    ) : stagedChartType === "line" ? (
                      <LineChart data={previewData.data as any} margin={MARGIN_DEFAULT}>
                        {stagedShowGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={stagedColors.grid || "rgba(103,62,190,0.1)"} />}
                        {stagedStyles.showAxis && <XAxis dataKey="day" tick={TICK_STYLE} axisLine={false} tickLine={false} />}
                        {stagedStyles.showAxis && <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />}
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Line
                          type={stagedSmooth ? "monotone" : "linear"}
                          dataKey="conversations"
                          stroke={stagedColors.primary || "#0396A6"}
                          strokeWidth={stagedStyles.strokeWidth ?? 2.5}
                          dot={
                            stagedStyles.showDots
                              ? { fill: stagedColors.secondary || stagedColors.primary || "#0396A6", r: stagedStyles.dotSize ?? 3, strokeWidth: 0 }
                              : false
                          }
                          animationDuration={500}
                        />
                      </LineChart>
                    ) : (
                      /* Area Chart Default */
                      <AreaChart data={previewData.data as any} margin={MARGIN_DEFAULT}>
                        <defs>
                          <linearGradient id="preview-cg" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="5%"
                              stopColor={stagedColors.primary || "#0396A6"}
                              stopOpacity={stagedStyles.fillOpacity ?? 0.35}
                            />
                            <stop
                              offset="95%"
                              stopColor={stagedColors.secondary || stagedColors.primary || "#67C9CE"}
                              stopOpacity={stagedStyles.gradient ? ((stagedStyles.fillOpacity ?? 0.35) * 0.4) : (stagedStyles.fillOpacity ?? 0.35)}
                            />
                          </linearGradient>
                        </defs>
                        {stagedShowGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={stagedColors.grid || "rgba(103,62,190,0.1)"} />}
                        {stagedStyles.showAxis && <XAxis dataKey="day" tick={TICK_STYLE} axisLine={false} tickLine={false} />}
                        {stagedStyles.showAxis && <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />}
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Area
                          type={stagedSmooth ? "monotone" : "linear"}
                          dataKey="conversations"
                          stroke={stagedColors.primary || "#0396A6"}
                          strokeWidth={stagedStyles.strokeWidth ?? 2.5}
                          fillOpacity={1}
                          fill="url(#preview-cg)"
                          dot={
                            stagedStyles.showDots
                              ? { fill: stagedColors.secondary || stagedColors.primary || "#0396A6", r: stagedStyles.dotSize ?? 3, strokeWidth: 0 }
                              : false
                          }
                          animationDuration={500}
                        />
                      </AreaChart>
                    )}
                </StableChartContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="px-6 py-4 border-t border-border bg-muted/15 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-bold text-muted-foreground hover:text-[#0396A6] transition-colors"
            >
              Reset to Default
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/30 text-xs font-bold text-foreground transition-all shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAndApply}
                className="px-6 py-2.5 rounded-xl text-white text-xs font-extrabold transition-all shadow-md active:scale-95 hover:opacity-95 flex items-center gap-2"
                style={{ backgroundColor: stagedColors.primary || "#0396A6" }}
              >
                <Check className="w-4 h-4 stroke-[3]" /> Done &amp; Apply
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
