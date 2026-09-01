'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Sector,
} from 'recharts';
import { Calendar, MessageSquare } from 'lucide-react';
import { AnalyticsDateFilter, type DateRangeValue } from '@/components/analytics/AnalyticsDateFilter';
import { chartAxisTicks } from '@/lib/chartAxis';
import { apiRequest } from '@/lib/api';
import { listSessionRows, type LegacySessionRow } from '@/lib/conversations';

/* ─────────────────────────────────────────────────────── types ── */

interface AnalyticsOverviewData {
  total_messages: number;
  conversations: number;
  conversations_open?: number;
  ai_runs: number;
  leads: number;
  meetings: number;
  handoffs: number;
  conversations_by_day: { day: string; conversations: number }[];
  open_by_channel?: { website?: number; whatsapp?: number };
}

interface DayPoint {
  name: string;
  fullDate: string;
  count: number;
  rawDay: string;
}

interface DonutEntry {
  name: string;
  value: number;
  color: string;
  actualValue: number;
}

export interface AnalyticsTabProps {
  days?: number;
  fromDate?: string;
  toDate?: string;
  agentId?: string | null;
  channel?: string;
  onViewChat?: (convoId: string) => void;
  onViewAll?: () => void;
  onDateRangeChange?: (range: DateRangeValue) => void;
  onDaysChange?: (days: number) => void;
}

/* ─────────────────────────────────────────────── helpers ── */

function fmtDateIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtShort(iso: string) {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

function formatConvoTime(iso?: string | null) {
  if (!iso) return '';
  try {
    const s = iso.includes(' ') && !iso.includes('T') ? iso.replace(' ', 'T') : iso;
    const d = new Date(s);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}

/* ── Custom Tooltips for Charts ───────────────────────────────────────── */
function FunnelChartTooltip({ active, payload, conversations, totalLeads, totalMeetings }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const name = entry?.payload?.name || '';
  const value = entry?.value ?? 0;
  const color = entry?.payload?.fill || '#0396A6';

  let conversionText = '';
  if (name === 'Leads' && conversations > 0) {
    conversionText = `${((totalLeads / conversations) * 100).toFixed(1)}% conversion from chats`;
  } else if (name === 'Meetings' && totalLeads > 0) {
    conversionText = `${((totalMeetings / totalLeads) * 100).toFixed(1)}% booking rate from leads`;
  } else if (name === 'Chats') {
    conversionText = 'Top of funnel visitor engagements';
  }

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
      }}
      className="!bg-white dark:!bg-zinc-900 text-slate-900 dark:text-white px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 min-w-[160px] animate-in fade-in zoom-in-95 duration-150 relative z-50 pointer-events-none"
    >
      <div className="flex items-center gap-2 pb-1.5 mb-1.5 border-b border-slate-100 dark:border-zinc-800">
        <span className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0" style={{ background: color }} />
        <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">{name}</span>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Total Count:</span>
        <span className="text-sm font-extrabold" style={{ color }}>{value}</span>
      </div>
      {conversionText && (
        <p className="text-[10.5px] font-semibold text-slate-400 dark:text-zinc-500 mt-1 pt-1 border-t border-slate-100/60 dark:border-zinc-800/60">
          {conversionText}
        </p>
      )}
    </div>
  );
}

function AreaChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  const fullDate = point?.payload?.fullDate || label;
  const count = point?.value ?? 0;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
      }}
      className="!bg-white dark:!bg-zinc-900 text-slate-900 dark:text-white px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 min-w-[150px] animate-in fade-in zoom-in-95 duration-150 relative z-50 pointer-events-none"
    >
      <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 pb-1 mb-1.5 border-b border-slate-100 dark:border-zinc-800">
        {fullDate}
      </p>
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full shadow-xs bg-[#0396A6]" />
          <span className="text-slate-600 dark:text-zinc-300 font-semibold">Conversations:</span>
        </div>
        <span className="font-extrabold text-[#0396A6] text-sm">{count}</span>
      </div>
    </div>
  );
}

function DonutChartTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const name = entry?.name || '';
  const actualVal = entry?.payload?.actualValue ?? entry?.value ?? 0;
  const color = entry?.payload?.color || '#0396A6';
  const pct = total > 0 ? ((actualVal / total) * 100).toFixed(0) : 0;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
      }}
      className="!bg-white dark:!bg-zinc-900 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-zinc-800 min-w-[130px] animate-in fade-in zoom-in-95 duration-150 relative z-50 pointer-events-none"
    >
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ background: color }} />
          <span className="text-slate-600 dark:text-zinc-300 font-semibold">{name}:</span>
        </div>
        <span className="font-extrabold text-foreground">{actualVal} <span className="text-xs text-muted-foreground font-normal">({pct}%)</span></span>
      </div>
    </div>
  );
}

/* ── Donut active shape for sector expansion ───────────────────── */
function ActivePieSector(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
      />
    </g>
  );
}

/* ══════════════════════════════════════════════════════════════════
   AnalyticsTab — Modern, spacious, interactive charts
══════════════════════════════════════════════════════════════════ */

export function AnalyticsTab({
  days = 30,
  fromDate,
  toDate,
  agentId,
  channel = 'website',
  onViewChat,
  onViewAll,
  onDateRangeChange,
  onDaysChange,
}: AnalyticsTabProps) {
  /* ── state ── */
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState(0);
  const [convOpen, setConvOpen] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [byDay, setByDay] = useState<DayPoint[]>([]);

  /* latest conversations */
  const [sessions, setSessions] = useState<LegacySessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  /* active donut & bar hover states */
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined);
  const [activeBarIndex, setActiveBarIndex] = useState<number | undefined>(undefined);

  /* ── fetch overview ── */
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const aq = agentId ? `&agent_id=${encodeURIComponent(agentId)}` : '';
        const cq = channel ? `&channel=${encodeURIComponent(channel)}` : '';
        const data = await apiRequest<AnalyticsOverviewData>(
          `/v1/analytics/overview?days=${days}${aq}${cq}`
        );
        if (!active || !data) return;

        setConversations(data.conversations || 0);
        setConvOpen(data.conversations_open ?? 0);
        setTotalLeads(data.leads ?? 0);
        setTotalMeetings(data.meetings ?? 0);

        const points: DayPoint[] = (data.conversations_by_day || []).map((d) => {
          let name = d.day;
          let fullDate = d.day;
          try {
            const dateObj = new Date(d.day + 'T00:00:00');
            name = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            fullDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
          } catch { /* fallback */ }
          return { name, fullDate, count: d.conversations || 0, rawDay: d.day };
        });
        setByDay(points);
      } catch (e) {
        console.error('[AnalyticsTab] fetch failed', e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [days, agentId, channel]);

  /* ── fetch latest conversations ── */
  useEffect(() => {
    let active = true;
    (async () => {
      setSessionsLoading(true);
      try {
        const rows = await listSessionRows({
          channel: channel === 'unified' ? undefined : (channel as any),
          agent_id: agentId || undefined,
          limit: 5,
        });
        if (active) {
          setSessions(rows);
        }
      } catch (e) {
        console.error('[AnalyticsTab] failed to fetch latest conversations', e);
        if (active) setSessions([]);
      } finally {
        if (active) setSessionsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [channel, agentId]);

  /* ── derived ── */
  const readChats = Math.max(0, conversations - convOpen);
  const unreadChats = convOpen;

  // Conversion Funnel Data for Recharts BarChart
  const funnelData = useMemo(() => [
    { name: 'Chats', value: conversations, fill: '#0396A6' },
    { name: 'Leads', value: totalLeads, fill: '#22d3ee' },
    { name: 'Meetings', value: totalMeetings, fill: '#0ea5e9' },
  ], [conversations, totalLeads, totalMeetings]);

  // Inbox Donut Data
  const donutData: DonutEntry[] = useMemo(() => {
    if (conversations === 0) {
      return [
        { name: 'Read', value: 1, color: '#16283D', actualValue: 0 },
        { name: 'Unread', value: 0, color: '#0396A6', actualValue: 0 },
      ];
    }
    return [
      { name: 'Read', value: Math.max(readChats, 0.001), color: '#16283D', actualValue: readChats },
      { name: 'Unread', value: Math.max(unreadChats, 0.001), color: '#0396A6', actualValue: unreadChats },
    ];
  }, [conversations, readChats, unreadChats]);

  // Peak day
  const peakDay = useMemo(() =>
    byDay.length ? [...byDay].sort((a, b) => b.count - a.count)[0] ?? null : null
  , [byDay]);

  const convOverTimeTicks = useMemo(
    () => chartAxisTicks(byDay, days, 'name'),
    [byDay, days],
  );

  // Date range label for the chart header badge
  const dateRangeLabel = useMemo(() => {
    if (fromDate && toDate) {
      return `${fmtShort(fromDate)} – ${fmtShort(toDate)}`;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    return `${fmtShort(fmtDateIso(start))} – ${fmtShort(fmtDateIso(end))}`;
  }, [fromDate, toDate, days]);

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div
      className={`space-y-6 animate-in fade-in duration-300 pb-20 sm:pb-12 flex-1 overflow-y-auto no-scrollbar min-h-0 transition-opacity ${
        loading ? 'opacity-60 pointer-events-none' : ''
      }`}
      style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {(onDateRangeChange || onDaysChange) && (
        <div className="flex justify-end pb-1 pt-1 w-full bg-[#F7F5F1] -mx-0 px-0">
          <AnalyticsDateFilter
            days={days}
            fromDate={fromDate}
            toDate={toDate}
            disabled={loading}
            onChange={(range) => {
              if (onDateRangeChange) onDateRangeChange(range);
              else if (onDaysChange) onDaysChange(range.days);
            }}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════
          ROW 1 — Conversion Funnel (50%) + Inbox Status (50%)
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── CONVERSION FUNNEL (50% width) ── */}
        <div className="w-full p-6 rounded-[32px] border border-slate-200/80 dark:border-zinc-800 bg-[#FAFDFD]/60 hover:bg-white dark:bg-zinc-900/60 dark:hover:bg-zinc-900 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-200 flex flex-col justify-between">
          {/* header */}
          <div className="mb-6 flex items-center justify-between">
            <span
              style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif", lineHeight: "20px" }}
              className="text-[14px] font-[700] text-[#18181B] dark:text-zinc-100 tracking-tight"
            >
              Conversion Funnel
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 text-slate-500 dark:text-zinc-400">
              LAST {days} DAYS
            </span>
          </div>

          {/* Recharts Bar Chart */}
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap="12%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#8B9DA4' }}
                />
                <YAxis hide />
                <Tooltip
                  wrapperStyle={{ zIndex: 100 }}
                  content={
                    <FunnelChartTooltip
                      conversations={conversations}
                      totalLeads={totalLeads}
                      totalMeetings={totalMeetings}
                    />
                  }
                  cursor={{ fill: 'rgba(3,150,166,0.06)', radius: 8 }}
                />
                <Bar
                  dataKey="value"
                  name="Count"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={72}
                  onMouseEnter={(_, index) => setActiveBarIndex(index)}
                  onMouseLeave={() => setActiveBarIndex(undefined)}
                >
                  {funnelData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      opacity={activeBarIndex === undefined || activeBarIndex === index ? 1 : 0.4}
                      style={{
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── INBOX STATUS (50% width) ── */}
        <div className="w-full p-6 rounded-[32px] border border-slate-200/80 dark:border-zinc-800 bg-[#FAFDFD]/60 hover:bg-white dark:bg-zinc-900/60 dark:hover:bg-zinc-900 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-200 flex flex-col justify-between">
          {/* header */}
          <div className="mb-4 flex items-center justify-between">
            <span
              style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif", lineHeight: "20px" }}
              className="text-[14px] font-[700] text-[#18181B] dark:text-zinc-100 tracking-tight"
            >
              Inbox Status
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 text-slate-500 dark:text-zinc-400">
              LAST {days} DAYS
            </span>
          </div>

          {/* Donut chart */}
          <div className="flex-1 w-full relative flex flex-col items-center justify-center min-h-[180px]">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={78}
                  paddingAngle={conversations > 0 && readChats > 0 && unreadChats > 0 ? 3 : 0}
                  dataKey="value"
                  {...({ activeIndex: activePieIndex, activeShape: ActivePieSector } as any)}
                  onMouseEnter={(_, idx) => setActivePieIndex(idx)}
                  onMouseLeave={() => setActivePieIndex(undefined)}
                  stroke="none"
                >
                  {donutData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip wrapperStyle={{ zIndex: 100, pointerEvents: 'none' }} content={<DonutChartTooltip total={conversations} />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Centre label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300 z-10">
              <span
                style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}
                className="text-3xl font-bold text-slate-900 dark:text-white leading-none"
              >
                {activePieIndex !== undefined ? donutData[activePieIndex]?.actualValue ?? conversations : conversations}
              </span>
              <span
                style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}
                className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-widest mt-2"
              >
                {activePieIndex !== undefined ? donutData[activePieIndex]?.name ?? 'TOTAL CHATS' : 'TOTAL CHATS'}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 relative z-10">
            <div
              className="flex items-center gap-2 cursor-pointer transition-opacity"
              style={{ opacity: activePieIndex === undefined || activePieIndex === 0 ? 1 : 0.4 }}
              onMouseEnter={() => setActivePieIndex(0)}
              onMouseLeave={() => setActivePieIndex(undefined)}
            >
              <div className="w-3 h-3 rounded-full bg-[#16283D]" />
              <span className="text-[13px] font-semibold text-slate-500 dark:text-zinc-400">
                Read <span className="text-slate-900 dark:text-white font-bold">({readChats})</span>
              </span>
            </div>
            <div
              className="flex items-center gap-2 cursor-pointer transition-opacity"
              style={{ opacity: activePieIndex === undefined || activePieIndex === 1 ? 1 : 0.4 }}
              onMouseEnter={() => setActivePieIndex(1)}
              onMouseLeave={() => setActivePieIndex(undefined)}
            >
              <div className="w-3 h-3 rounded-full bg-[#0396A6]" />
              <span className="text-[13px] font-semibold text-slate-500 dark:text-zinc-400">
                Unread <span className="text-slate-900 dark:text-white font-bold">({unreadChats})</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════
          ROW 2 — Conversations Over Time
      ═══════════════════════════════════════════ */}
      <div className="p-6 rounded-[32px] border border-slate-200/80 dark:border-zinc-800 bg-[#FAFDFD]/60 hover:bg-white dark:bg-zinc-900/60 dark:hover:bg-zinc-900 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-200 space-y-4">
        {/* header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span
              style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif", lineHeight: "20px" }}
              className="text-[14px] font-[700] text-[#18181B] dark:text-zinc-100 tracking-tight"
            >
              Conversations Over Time
            </span>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500 font-normal">
              {conversations} total · {days}d window
              {peakDay && peakDay.count > 0 && (
                <span className="ml-2 text-[#0396A6] font-semibold hidden sm:inline">
                  Peak: {peakDay.count} on {peakDay.name}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-zinc-700 bg-black/5 dark:bg-white/5">
            <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">{dateRangeLabel}</span>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-[250px] w-full">
          {byDay.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={byDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0396A6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0396A6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" vertical={false} />
                <XAxis
                  dataKey="name"
                  ticks={convOverTimeTicks}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#8B9DA4', fontWeight: 600 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#8B9DA4', fontWeight: 600 }}
                  allowDecimals={false}
                />
                <Tooltip
                  wrapperStyle={{ zIndex: 100 }}
                  content={<AreaChartTooltip />}
                  cursor={{ stroke: '#0396A6', strokeWidth: 1.5, strokeDasharray: '4 2' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Conversations"
                  stroke="#0396A6"
                  strokeWidth={2.8}
                  fill="url(#colorCount)"
                  dot={{ r: 3.5, strokeWidth: 2, fill: '#0396A6', stroke: '#fff' }}
                  activeDot={{ r: 6.5, strokeWidth: 3, fill: '#0396A6', stroke: '#fff', style: { filter: 'drop-shadow(0 2px 6px rgba(3,150,166,0.5))' } }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/40 text-slate-400 dark:text-zinc-600 text-xs font-medium gap-2">
              <MessageSquare className="w-8 h-8 opacity-40" />
              No conversations recorded in this date range
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ROW 3 — Latest Conversations
      ═══════════════════════════════════════════ */}
      <div className="p-6 rounded-[32px] border border-slate-200/80 dark:border-zinc-800 bg-[#FAFDFD]/60 hover:bg-white dark:bg-zinc-900/60 dark:hover:bg-zinc-900 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-200 space-y-4">
        {/* header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span
            style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif", lineHeight: "20px" }}
            className="text-[14px] font-[700] text-[#18181B] dark:text-zinc-100 tracking-tight"
          >
            Latest Conversations
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 text-slate-500 dark:text-zinc-400">
              LAST {days} DAYS
            </span>
            {onViewAll && (
              <button
                type="button"
                onClick={onViewAll}
                className="text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-[#0396A6] px-3 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-2xs hover:border-[#0396A6]/40 transition-all cursor-pointer"
              >
                View All
              </button>
            )}
          </div>
        </div>

        {/* list */}
        <div className="space-y-3 pt-1">
          {sessionsLoading ? (
            <div className="space-y-2.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/60 animate-pulse flex items-center justify-between">
                  <div className="flex items-center gap-3.5 flex-1">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800 shrink-0" />
                    <div className="space-y-1.5 flex-1 max-w-sm">
                      <div className="h-3.5 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
                      <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
                    </div>
                  </div>
                  <div className="w-14 h-6 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-2xl border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 text-slate-400 dark:text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
              <MessageSquare className="w-7 h-7 opacity-40 text-[#0396A6]" />
              <p>No conversations found for this bot yet.</p>
            </div>
          ) : (
            sessions.slice(0, 5).map((s, idx) => {
              const avatarLabel = s.session_id ? s.session_id.replace(/[^a-zA-Z0-9]/g, '').slice(-2) || '55' : '55';
              const userTitle = s.contact_label
                ? (s.contact_label.startsWith('User #') ? s.contact_label : `User #${s.contact_label}`)
                : `User #${s.session_id ? s.session_id.slice(0, 8) : 'guest'}`;
              const previewText = s.content ? `"${s.content}"` : '"Started conversation"';

              return (
                <div
                  key={s.session_id || idx}
                  className="p-3.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-900 hover:border-[#0396A6]/30 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#EAF8F8] dark:bg-teal-950/40 text-[#0396A6] dark:text-teal-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-[#D9EDEE] dark:border-teal-900/50">
                      {avatarLabel}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#18181B] dark:text-zinc-100 truncate">
                        {userTitle}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5 font-normal">
                        {previewText}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                      {formatConvoTime(s.created_at)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (onViewChat) {
                          onViewChat(s.session_id);
                        } else if (onViewAll) {
                          onViewAll();
                        }
                      }}
                      className="px-3.5 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-[#0396A6]/60 text-slate-700 dark:text-zinc-200 hover:text-[#0396A6] text-xs font-bold rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                    >
                      Open
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
