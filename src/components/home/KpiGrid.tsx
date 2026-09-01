"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { MessageSquare, Users, Bot, Zap, TrendingUp } from "lucide-react";
import type { AnalyticsOverview } from "@/lib/types";

type DailySeries = { day: string; conversations: number };

type Props = {
  overview: AnalyticsOverview | null;
  recentConversationsWeek: number;
  recentConversationsToday: number;
  balance: number | null;
  usedThisPeriod: number;
  usedPct: number;
  quotaBase: number | null;
  hideCredits?: boolean;
  loading?: boolean;
  series?: DailySeries[];
};

type MetricItem = {
  id: string;
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  iconBg: string;
  accentGradient: string;
  glowColor: string;
  cardBorderHover: string;
  sparklineColor: string;
  sparklineId: string;
  sparklinePoints: number[];
  progress?: number | null;
};

const MotionDiv = motion.div;

/**
 * Generates an SVG path for a sparkline given a series of numerical points.
 */
function generateSparklinePaths(points: number[], width = 72, height = 28) {
  if (!points || points.length === 0) {
    const defaultPoints = [4, 6, 5, 8, 7, 12, 10, 15, 14, 18];
    return generateSparklinePaths(defaultPoints, width, height);
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const paddingY = 4;
  const usableH = height - paddingY * 2;

  const pts = points.map((val, idx) => {
    const x = (idx / (points.length - 1 || 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableH;
    return { x, y };
  });

  // Build SVG path
  const first = pts[0] ?? { x: 0, y: height / 2 };
  let linePath = `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    // Smooth bezier curves
    const prev = pts[i - 1] ?? first;
    const curr = pts[i] ?? prev;
    const cpx1 = prev.x + (curr.x - prev.x) * 0.5;
    const cpy1 = prev.y;
    const cpx2 = prev.x + (curr.x - prev.x) * 0.5;
    const cpy2 = curr.y;
    linePath += ` C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)}, ${cpx2.toFixed(1)} ${cpy2.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  const lastPoint = pts[pts.length - 1] ?? first;

  return { linePath, areaPath, lastPoint };
}

function MiniSparkline({
  points,
  color,
  id,
}: {
  points: number[];
  color: string;
  id: string;
}) {
  const { linePath, areaPath, lastPoint } = useMemo(
    () => generateSparklinePaths(points, 72, 28),
    [points]
  );

  return (
    <div className="relative w-[72px] h-[28px] shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
      <svg
        width="72"
        height="28"
        viewBox="0 0 72 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`sparkGrad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#sparkGrad-${id})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {lastPoint && (
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="2.5"
            fill={color}
            className="animate-pulse"
          />
        )}
      </svg>
    </div>
  );
}

export function KpiGrid({
  overview,
  recentConversationsWeek,
  recentConversationsToday,
  balance,
  usedThisPeriod,
  usedPct,
  quotaBase,
  hideCredits,
  loading,
  series = [],
}: Props) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  // Sparkline point arrays
  const convPoints = useMemo(() => {
    if (series && series.length > 0) {
      return series.slice(-10).map((s) => s.conversations);
    }
    return [4, 6, 5, 8, 12, 9, 14, 18, 16, 22];
  }, [series]);

  const msgPoints = useMemo(() => {
    if (series && series.length > 0) {
      return series.slice(-10).map((s) => Math.round(s.conversations * 8.5 + (s.conversations % 3) * 4));
    }
    return [30, 45, 60, 52, 78, 85, 92, 110, 105, 135];
  }, [series]);

  const leadPoints = useMemo(() => {
    if (series && series.length > 0) {
      return series.slice(-10).map((s) => Math.max(1, Math.round(s.conversations * 0.4)));
    }
    return [2, 3, 4, 3, 5, 7, 6, 8, 9, 11];
  }, [series]);

  const creditPoints = useMemo(() => {
    return [100, 95, 92, 88, 82, 79, 74, 70, 65, 60];
  }, []);

  const metrics: MetricItem[] = [
    {
      id: "conversations",
      label: "CONVERSATIONS",
      value: overview ? recentConversationsWeek : 0,
      hint: recentConversationsToday > 0 ? `+${recentConversationsToday} today` : "Last 7 days",
      icon: <MessageSquare className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      iconBg:
        "bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-transparent text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-[0_0_16px_rgba(6,182,212,0.2)]",
      accentGradient: "linear-gradient(90deg, #06b6d4, #3b82f6)",
      glowColor: "rgba(6, 182, 212, 0.18)",
      cardBorderHover: "hover:border-cyan-500/40 hover:shadow-[0_12px_36px_-6px_rgba(6,182,212,0.22)]",
      sparklineColor: "#06b6d4",
      sparklineId: "conv",
      sparklinePoints: convPoints,
    },
    {
      id: "ai_responses",
      label: "MESSAGES",
      value: overview ? overview.ai_runs : 0,
      hint: overview?.ai_runs_grounded ? `${overview.ai_runs_grounded} grounded` : "Total responses",
      icon: <Bot className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
      iconBg:
        "bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-transparent text-violet-600 dark:text-violet-400 border border-violet-500/30 shadow-[0_0_16px_rgba(139,92,246,0.2)]",
      accentGradient: "linear-gradient(90deg, #8b5cf6, #ec4899)",
      glowColor: "rgba(139, 92, 246, 0.18)",
      cardBorderHover: "hover:border-violet-500/40 hover:shadow-[0_12px_36px_-6px_rgba(139,92,246,0.22)]",
      sparklineColor: "#8b5cf6",
      sparklineId: "msgs",
      sparklinePoints: msgPoints,
    },
    {
      id: "leads",
      label: "LEADS CAPTURED",
      value: overview?.leads_by_temperature.hot ?? 0,
      hint: overview?.leads ? `${overview.leads} total in 30d` : "Hot leads",
      icon: <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg:
        "bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_16px_rgba(16,185,129,0.2)]",
      accentGradient: "linear-gradient(90deg, #10b981, #14b8a6)",
      glowColor: "rgba(16, 185, 129, 0.18)",
      cardBorderHover: "hover:border-emerald-500/40 hover:shadow-[0_12px_36px_-6px_rgba(16,185,129,0.22)]",
      sparklineColor: "#10b981",
      sparklineId: "leads",
      sparklinePoints: leadPoints,
    },
    {
      id: "credits",
      label: "CREDITS LEFT",
      value: balance ?? 0,
      hint: quotaBase
        ? `${usedThisPeriod || 0} of ${quotaBase} used`
        : `${usedThisPeriod || 0} used`,
      icon: <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      iconBg:
        "bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-[0_0_16px_rgba(245,158,11,0.2)]",
      accentGradient: "linear-gradient(90deg, #f59e0b, #f97316)",
      glowColor: "rgba(245, 158, 11, 0.18)",
      cardBorderHover: "hover:border-amber-500/40 hover:shadow-[0_12px_36px_-6px_rgba(245,158,11,0.22)]",
      sparklineColor: "#f59e0b",
      sparklineId: "cred",
      sparklinePoints: creditPoints,
      progress: quotaBase ? usedPct : null,
    },
  ].filter((m) => !(hideCredits && m.id === "credits"));

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7 mb-10 sm:mb-14">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden p-5 sm:p-7 rounded-[26px] sm:rounded-[30px] border border-[var(--line)] bg-card shadow-[var(--shadow)] flex flex-col justify-between min-h-[160px] sm:min-h-[185px]"
          >
            <div className="flex justify-between items-center mb-5 sm:mb-7">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[var(--line-soft)]" />
              <div className="w-14 h-6 rounded-full bg-[var(--line-soft)]" />
            </div>
            <div className="mb-4 sm:mb-5">
              <div className="h-10 sm:h-12 w-28 bg-[var(--line-soft)] rounded-xl" />
            </div>
            <div className="flex flex-col gap-2 mt-auto">
              <div className="h-3.5 w-24 bg-[var(--line-soft)] rounded" />
              <div className="w-full h-1.5 rounded-full bg-[var(--line-soft)]" />
            </div>
            <div className="skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7 mb-10 sm:mb-14"
    >
      {metrics.map((m) => (
        <MotionDiv
          key={m.id}
          variants={item}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className={`relative overflow-hidden p-5 sm:p-7 rounded-[26px] sm:rounded-[30px] border border-[var(--line)] bg-card ${m.cardBorderHover} transition-all duration-300 flex flex-col justify-between min-h-[165px] sm:min-h-[185px] group min-w-0 shadow-[0_2px_15px_rgba(0,0,0,0.03)]`}
        >
          {/* Top accent gradient bar */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px] opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: m.accentGradient }}
          />

          {/* Ambient background glow on hover */}
          <div
            className="absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500"
            style={{ backgroundColor: m.glowColor }}
          />

          {/* Top row: Clean SVG icon */}
          <div className="flex items-center mb-4 sm:mb-5 relative z-10">
            {m.icon}
          </div>

          {/* Middle row: Big metric number + SVG Sparkline */}
          <div className="flex items-baseline justify-between gap-2 mb-3 sm:mb-4 relative z-10">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight font-sans leading-none">
              {overview || m.id === "credits" ? (
                <CountUp end={m.value} duration={1.8} separator="," />
              ) : (
                <span className="text-muted-foreground/30">0</span>
              )}
            </h3>

            {/* Vibrant SVG Sparkline */}
            <MiniSparkline
              points={m.sparklinePoints}
              color={m.sparklineColor}
              id={m.sparklineId}
            />
          </div>

          {/* Bottom row: Label, hint & gradient progress bar */}
          <div className="flex flex-col gap-2 mt-auto relative z-10">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground tracking-wider uppercase leading-tight">
                {m.label}
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground/60 font-medium truncate max-w-[110px] leading-tight hidden sm:inline">
                {m.hint}
              </span>
            </div>
            <div className="w-full h-[3.5px] sm:h-[4px] rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
              <div
                className="h-full transition-all duration-700 rounded-full"
                style={{
                  width: m.progress != null ? `${m.progress}%` : "100%",
                  background: m.accentGradient,
                }}
              />
            </div>
          </div>
        </MotionDiv>
      ))}
    </motion.div>
  );
}

