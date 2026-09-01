'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  RefreshCw,
  MessageSquare,
  Bot,
  Users,
  Target,
  Activity,
  Clock,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Sector,
} from 'recharts';
import { apiRequest } from '@/lib/api';
import { Select } from '@/components/ui/Select';
import { chartAxisTicks } from '@/lib/chartAxis';
import type { AnalyticsOverview, AnalyticsCharts } from '@/lib/types';

const ANALYTICS_DAY_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

const fmtDay = (iso: string) => {
  if (!iso) return '';
  const parts = iso.split('-');
  const m = parts[1] || '1';
  const d = parts[2] || '1';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m,10)-1] || ''} ${parseInt(d,10) || ''}`;
};

/* ── Skeleton shimmer ───────────────────────────────────────────── */
function Shimmer({ h = 200, r = 20 }: { h?: number; r?: number }) {
  return (
    <div
      style={{
        height: h,
        borderRadius: r,
        background: 'linear-gradient(90deg,#f0f4f4 25%,#e2ecec 50%,#f0f4f4 75%)',
        backgroundSize: '200% 100%',
        animation: 'aaSectionPulse 1.4s ease infinite',
      }}
    />
  );
}

/* ── Custom tooltip shared ──────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #D9EDEE',
      borderRadius: 12,
      padding: '10px 14px',
      fontSize: 12,
      boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
      minWidth: 130,
    }}>
      <div style={{ fontWeight: 700, color: '#111', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: '#666' }}>{p.name}:</span>
          <strong style={{ color: '#111' }}>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

/* ── Donut active shape for Inbox Status ───────────────────────── */
function ActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 3} outerRadius={outerRadius + 5}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
}

/* ── Empty placeholder ─────────────────────────────────────────── */
function Empty({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[180px] gap-3 text-center">
      <div className="w-10 h-10 rounded-2xl bg-[#EAF8F8] text-[#0396A6] flex items-center justify-center">
        <Icon size={20} />
      </div>
      <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">{text}</p>
    </div>
  );
}

interface Props {
  agentId: string;
  agentMode?: string;
}

export function AgentAnalyticsSection({ agentId, agentMode = 'website' }: Props) {
  const [days, setDays] = useState(14);
  const [fetching, setFetching] = useState(false);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [charts, setCharts] = useState<AnalyticsCharts | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [activeDonut, setActiveDonut] = useState<number | undefined>(undefined);

  const fetchData = useCallback(async (numDays: number) => {
    setFetching(true);
    setError('');
    try {
      const [ov, ch] = await Promise.allSettled([
        apiRequest<AnalyticsOverview>(`/v1/analytics/overview?days=${numDays}&agent_id=${encodeURIComponent(agentId)}`),
        apiRequest<AnalyticsCharts>(`/v1/analytics/charts?days=${numDays}&agent_id=${encodeURIComponent(agentId)}`),
      ]);
      if (ov.status === 'fulfilled') setOverview(ov.value);
      if (ch.status === 'fulfilled') setCharts(ch.value);
      if (ov.status === 'rejected' && ch.status === 'rejected') setError('Could not load analytics data.');
      setLastUpdated(new Date());
    } catch {
      setError('Could not load analytics data.');
    } finally {
      setFetching(false);
    }
  }, [agentId]);

  useEffect(() => { void fetchData(days); }, [fetchData, days]);

  /* ── Derived values ─────────────────────────────────────────── */
  const totalConvs = overview?.conversations ?? 0;
  const totalLeads = overview?.leads ?? 0;
  const convRate = totalConvs > 0 ? Math.round((totalLeads / totalConvs) * 100) : 0;
  const periodMsgs = (charts?.messages_by_day ?? []).reduce((a, b) => a + b.messages, 0);
  const totalMsgs = charts != null ? periodMsgs : overview?.total_messages ?? 0;
  const avgSession = charts?.sessions?.avg_msgs_per_session != null
    ? String(charts.sessions.avg_msgs_per_session)
    : totalConvs > 0 ? (totalMsgs / totalConvs).toFixed(1) : '0.0';
  const peakHour = charts?.peak_hours?.peak_label?.split('·')[0]?.trim() || '-';

  /* ── Conversations Over Time ─────────────────────────────────── */
  const convTimeData = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const r of overview?.conversations_by_day ?? []) byDay.set(r.day, r.conversations);
    for (const r of charts?.conversion_trend?.by_day ?? []) {
      if (!byDay.has(r.day)) byDay.set(r.day, r.conversations);
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ date: fmtDay(day), count }));
  }, [overview?.conversations_by_day, charts?.conversion_trend?.by_day]);

  const convTimeTicks = useMemo(
    () => chartAxisTicks(convTimeData, days, 'date'),
    [convTimeData, days],
  );

  /* ── Conversion Funnel ───────────────────────────────────────── */
  const funnelData = useMemo(() => {
    const totalMeetings = charts?.sessions?.resolved ?? 0;
    return [
      { name: 'Chats', value: totalConvs, fill: '#0396A6' },
      { name: 'Leads', value: totalLeads, fill: '#22d3ee' },
      { name: 'Meetings', value: totalMeetings, fill: '#a5f3fc' },
    ];
  }, [totalConvs, totalLeads, charts?.sessions?.resolved]);

  /* ── Inbox Status donut ──────────────────────────────────────── */
  const readCount = charts?.sessions?.total_sessions ?? totalConvs;
  const unreadCount = 0; // API doesn't expose unread separately yet
  const donutData = [
    { name: 'Read', value: Math.max(readCount, 1), fill: '#0f172a' },
    { name: 'Unread', value: Math.max(unreadCount, 0.01), fill: '#06b6d4' },
  ];

  const analyticsTabMode = agentMode === 'whatsapp' ? 'whatsapp' : agentMode === 'unified' ? 'unified' : 'website';
  const isLoading = fetching && !overview && !charts;
  const updatedLabel = lastUpdated
    ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : null;

  /* ── KPI tiles config ────────────────────────────────────────── */
  const kpis = [
    { label: 'Conversations', value: totalConvs.toLocaleString(), sub: 'sessions', icon: MessageSquare },
    { label: 'Messages', value: totalMsgs.toLocaleString(), sub: 'total', icon: Bot },
    { label: 'Leads', value: totalLeads.toLocaleString(), sub: 'captured', icon: Users },
    { label: 'Conversion', value: `${convRate}%`, sub: 'leads / convs', icon: Target },
    { label: 'Avg / Session', value: avgSession, sub: 'messages', icon: Activity },
    { label: 'Peak Hour', value: peakHour, sub: 'UTC busiest', icon: Clock },
  ];

  return (
    <>
      <style>{`
        @keyframes aaSectionPulse {
          0%,100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .aa-card {
          background: #FAFDFD;
          border-radius: 24px;
          border: 1px solid #E8F0F0;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02), 0 4px 16px rgba(3,150,166,0.03);
          transition: all 0.2s ease;
        }
        .aa-card:hover {
          background: #ffffff;
          border-color: #BCE3E5;
          box-shadow: 0 6px 20px rgba(3,150,166,0.07);
        }
        .aa-card-title {
          font-family: var(--font-outfit), 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 700;
          line-height: 20px;
          color: #18181B;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .aa-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 8px;
          background: rgba(0,0,0,0.05);
          color: #888;
        }
        .aa-kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) {
          .aa-kpi-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .aa-kpi-grid { grid-template-columns: repeat(6, 1fr); }
        }
        .aa-kpi-tile {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid #EAF2F2;
          background: #FAFDFD;
          transition: all 0.18s ease;
          cursor: default;
        }
        .aa-kpi-tile:hover {
          border-color: #BCE3E5;
          background: #fff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(3,150,166,0.06);
        }
        .aa-section-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .aa-row-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .aa-row-2 { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <section className="w-full">
        {/* ── Sticky Bar ─────────────────────────────────────────── */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          background: '#F7F5F1',
          borderBottom: '1px solid #EAF2F2',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ color: '#0396A6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BarChart3 size={14} />
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Agent Analytics</span>
                {updatedLabel && <span style={{ fontSize: 10, color: '#999', marginLeft: 8 }}>{updatedLabel}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Select
                value={days}
                onChange={(value) => setDays(Number(value))}
                options={ANALYTICS_DAY_OPTIONS}
                disabled={fetching}
                fullWidth={false}
                className="min-w-[130px]"
                aria-label="Analytics date range"
              />
              <button type="button" onClick={() => void fetchData(days)} disabled={fetching}
                style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #D9EDEE', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', cursor: 'pointer', transition: 'all 0.18s' }}
                title="Refresh"
              >
                <RefreshCw size={12} style={{ animation: fetching ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <Link href={`/analytics?tab=${analyticsTabMode}`}
                style={{ display: 'none' }}
                className="sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D9EDEE] bg-white text-xs font-bold text-[#0396A6] hover:bg-[#EAF8F8] transition-all"
              >
                <ExternalLink size={11} /> Full Report
              </Link>
            </div>
          </div>
        </div>

        <div className="aa-section-stack">
          {error && (
            <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #ef4444', borderRadius: 12, color: '#ef4444', fontSize: 12 }}>
              {error}
            </div>
          )}

          {/* ── KPI Tiles ────────────────────────────────────────── */}
          <div className="aa-card" style={{ padding: '20px 24px' }}>
            {isLoading ? (
              <div className="aa-kpi-grid">
                {Array.from({ length: 6 }).map((_, i) => <Shimmer key={i} h={76} r={14} />)}
              </div>
            ) : (
              <div className="aa-kpi-grid">
                {kpis.map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={kpi.label} className="aa-kpi-tile">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, color: '#0396A6' }}>
                        <Icon size={16} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: 2 }}>{kpi.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#111', lineHeight: 1.1 }}>{kpi.value}</div>
                        <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>{kpi.sub}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Conversations Over Time ───────────────────────────── */}
          <div className="aa-card">
            <div className="aa-card-title">
              <span>Conversations Over Time</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, border: '1px solid #E8F0F0', background: 'rgba(0,0,0,0.03)' }}>
                <Calendar size={12} style={{ color: '#999' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#999' }}>Last {days} Days</span>
              </div>
            </div>
            <div style={{ height: 250, width: '100%' }}>
              {isLoading ? <Shimmer h={230} r={16} /> : convTimeData.length === 0 ? (
                <Empty icon={BarChart3} text="Analytics will appear once this agent receives conversations." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={convTimeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="aaConvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0396A6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0396A6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAF2F2" vertical={false} />
                    <XAxis
                      dataKey="date"
                      ticks={convTimeTicks}
                      tick={{ fontSize: 11, fill: '#aaa', fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#aaa', fontWeight: 600 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#0396A6', strokeWidth: 1, strokeDasharray: '4 2' }} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Conversations"
                      stroke="#0396A6"
                      strokeWidth={2.5}
                      fill="url(#aaConvGrad)"
                      dot={{ r: 4, fill: '#0396A6', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#0396A6', stroke: '#fff', strokeWidth: 2.5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Conversion Funnel + Inbox Status ─────────────────── */}
          <div className="aa-row-2">
            {/* Conversion Funnel */}
            <div className="aa-card">
              <div className="aa-card-title">
                <span>Conversion Funnel</span>
                <span className="aa-badge">LAST {days} DAYS</span>
              </div>
              <div style={{ height: 200, width: '100%' }}>
                {isLoading ? <Shimmer h={180} r={16} /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                      barCategoryGap="12%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#EAF2F2" horizontal={true} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#aaa', fontWeight: 600 }} tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(3,150,166,0.05)', radius: 8 }} />
                      <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]} maxBarSize={72}>
                        {funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Inbox Status */}
            <div className="aa-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="aa-card-title">
                <span>Inbox Status</span>
                <span className="aa-badge">LAST {days} DAYS</span>
              </div>
              <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
                {isLoading ? <Shimmer h={160} r={80} /> : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={56}
                          outerRadius={78}
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={2}
                          dataKey="value"
                          {...({ activeIndex: activeDonut, activeShape: ActiveShape } as any)}
                          onMouseEnter={(_, idx) => setActiveDonut(idx)}
                          onMouseLeave={() => setActiveDonut(undefined)}
                          stroke="none"
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centre label */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', transition: 'all 0.3s' }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: '#111', lineHeight: 1 }}>
                        {activeDonut !== undefined ? donutData[activeDonut]?.value ?? readCount : readCount}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginTop: 6 }}>
                        {activeDonut !== undefined ? donutData[activeDonut]?.name ?? 'Read' : 'Read'}
                      </span>
                    </div>
                  </>
                )}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
                {donutData.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: d.fill, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#888' }}>
                      {d.name} <span style={{ color: '#111', fontWeight: 700 }}>({d.name === 'Unread' ? unreadCount : readCount})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>{/* end aa-section-stack */}
      </section>
    </>
  );
}
