"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Calendar,
  CheckCircle2,
  Inbox,
  Mail,
  Send,
  Ticket as TicketIcon,
} from "lucide-react";
import { intentLabel } from "@/lib/emailAutomation";
import { type EmailAnalytics, getEmailAnalytics } from "@/lib/emailAnalytics";
import styles from "../email.module.css";

const TEAL = "#0396A6";
const NAVY = "#16283D";
const INTENT_PALETTE = ["#0396A6", "#22d3ee", "#0ea5e9", "#14b8a6", "#38bdf8", "#2dd4bf", "#0891b2", "#5eead4", "#67e8f9"];

const RANGES = [7, 14, 30, 90] as const;

const OUTFIT = { fontFamily: "var(--font-outfit), 'Outfit', sans-serif" } as const;

type Props = {
  agentId: string;
  onViewEmails?: () => void;
};

function fmtDateIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtShort(iso: string) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function formatConvoTime(iso?: string | null) {
  if (!iso) return "";
  try {
    const s = iso.includes(" ") && !iso.includes("T") ? iso.replace(" ", "T") : iso;
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/* ── tooltips ─────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FunnelTip({ active, payload, received }: any) {
  if (!active || !payload?.length) return null;
  const e = payload[0];
  const name = e?.payload?.name ?? "";
  const value = e?.value ?? 0;
  const color = e?.payload?.fill ?? TEAL;
  const pct = received > 0 ? ((value / received) * 100).toFixed(0) : 0;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg min-w-[150px] pointer-events-none">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 mb-1.5">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="text-xs font-bold text-slate-700">{name}</span>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-xs font-medium text-slate-500">Count</span>
        <span className="text-sm font-extrabold" style={{ color }}>
          {value} <span className="text-[11px] font-semibold text-slate-400">({pct}%)</span>
        </span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AreaTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg min-w-[160px] pointer-events-none">
      <p className="text-[11px] font-bold text-slate-400 border-b border-slate-100 pb-1 mb-1.5">{p?.fullDate}</p>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: TEAL }} /> Received
        </span>
        <span className="font-extrabold text-sm" style={{ color: TEAL }}>{p?.received ?? 0}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: NAVY }} /> Replied
        </span>
        <span className="font-extrabold text-sm" style={{ color: NAVY }}>{p?.replied ?? 0}</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DonutTip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const e = payload[0];
  const name = e?.name ?? "";
  const val = e?.payload?.actualValue ?? e?.value ?? 0;
  const color = e?.payload?.color ?? TEAL;
  const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg min-w-[130px] pointer-events-none">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} /> {name}
        </span>
        <span className="font-extrabold text-slate-800">
          {val} <span className="text-[11px] font-normal text-slate-400">({pct}%)</span>
        </span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function IntentTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg min-w-[150px] pointer-events-none">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-1.5 text-slate-700 font-bold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p?.fill ?? TEAL }} /> {p?.label}
        </span>
        <span className="font-extrabold" style={{ color: p?.fill ?? TEAL }}>{p?.count ?? 0}</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ActiveSector(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius - 2}
      outerRadius={outerRadius + 5}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" }}
    />
  );
}

/* ── stat card ────────────────────────────────────────────────────── */
function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-[#FAFDFD]/60 p-5 shadow-sm transition-all duration-200 hover:bg-white hover:shadow-md">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `${accent}14`, color: accent }}
        >
          {icon}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <div className="mt-3 text-3xl font-bold leading-none text-slate-900" style={OUTFIT}>
        {value}
      </div>
      {sub ? <p className="mt-1.5 text-xs font-medium text-slate-400">{sub}</p> : null}
    </div>
  );
}

const CardShell = ({ children }: { children: ReactNode }) => (
  <div className="rounded-[32px] border border-slate-200/80 bg-[#FAFDFD]/60 p-6 shadow-sm transition-all duration-200 hover:border-slate-300/80 hover:bg-white hover:shadow-md">
    {children}
  </div>
);

const CardTitle = ({ title, badge }: { title: string; badge?: string }) => (
  <div className="mb-5 flex items-center justify-between">
    <span className="text-[14px] font-bold tracking-tight text-[#18181B]" style={OUTFIT}>
      {title}
    </span>
    {badge ? (
      <span className="rounded-md bg-black/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {badge}
      </span>
    ) : null}
  </div>
);

/* ══════════════════════════════════════════════════════════════════ */

export const EmailAnalyticsTab = ({ agentId, onViewEmails }: Props) => {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<EmailAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pieIdx, setPieIdx] = useState<number | undefined>(undefined);
  const [barIdx, setBarIdx] = useState<number | undefined>(undefined);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const res = await getEmailAnalytics(agentId, days);
        if (active) {
          setData(res);
          setError(null);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load analytics");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [agentId, days]);

  const received = data?.received ?? 0;
  const replied = data?.replied ?? 0;
  const awaiting = data?.awaiting ?? 0;

  const funnelData = useMemo(
    () => [
      { name: "Received", value: received, fill: TEAL },
      { name: "Classified", value: data?.classified ?? 0, fill: "#22d3ee" },
      { name: "Replied", value: replied, fill: "#0ea5e9" },
    ],
    [received, replied, data?.classified],
  );

  const donutData = useMemo(() => {
    if (received === 0) {
      return [
        { name: "Answered", value: 1, color: NAVY, actualValue: 0 },
        { name: "Awaiting", value: 0, color: TEAL, actualValue: 0 },
      ];
    }
    return [
      { name: "Answered", value: Math.max(replied, 0.001), color: NAVY, actualValue: replied },
      { name: "Awaiting", value: Math.max(awaiting, 0.001), color: TEAL, actualValue: awaiting },
    ];
  }, [received, replied, awaiting]);

  const byDay = useMemo(() => {
    return (data?.by_day ?? []).map((d) => {
      let name = d.day;
      let fullDate = d.day;
      try {
        const dt = new Date(d.day + "T00:00:00");
        name = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        fullDate = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      } catch {
        /* keep raw */
      }
      return { name, fullDate, received: d.received, replied: d.replied };
    });
  }, [data?.by_day]);

  const intentData = useMemo(
    () =>
      (data?.by_intent ?? []).map((r, i) => ({
        label: intentLabel(r.intent),
        count: r.count,
        fill: INTENT_PALETTE[i % INTENT_PALETTE.length],
      })),
    [data?.by_intent],
  );

  const peak = useMemo(() => (byDay.length ? [...byDay].sort((a, b) => b.received - a.received)[0] ?? null : null), [byDay]);

  const dateRangeLabel = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    return `${fmtShort(fmtDateIso(start))} – ${fmtShort(fmtDateIso(end))}`;
  }, [days]);

  const replyRatePct = received > 0 ? Math.round((replied / received) * 100) : 0;

  return (
    <div className={styles.page} data-lenis-prevent>
      {/* range pills */}
      <div className={styles.toolbar}>
        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDays(r)}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all ${
                days === r ? "bg-[#0396A6] text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {r}D
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-black/5 px-3 py-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[11px] font-bold text-slate-600">{dateRangeLabel}</span>
        </div>
      </div>

      {/* scroll region */}
      <div
        className={`space-y-6 pb-8 transition-opacity ${loading ? "opacity-60" : ""}`}
        style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none" }}
        data-lenis-prevent
      >
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<Mail size={18} />}
            label="Emails received"
            value={received}
            sub={`${data?.needs_review ?? 0} need review`}
            accent={TEAL}
          />
          <StatCard
            icon={<Send size={18} />}
            label="Replies sent"
            value={data?.replies_sent ?? 0}
            sub={`${data?.auto_sent ?? 0} auto · ${data?.manual_sent ?? 0} manual`}
            accent="#0ea5e9"
          />
          <StatCard
            icon={<CheckCircle2 size={18} />}
            label="Reply rate"
            value={`${replyRatePct}%`}
            sub={`${replied} of ${received} answered`}
            accent="#14b8a6"
          />
          <StatCard
            icon={<TicketIcon size={18} />}
            label="Tickets opened"
            value={data?.tickets_opened ?? 0}
            sub={`${data?.tickets_open ?? 0} open now`}
            accent="#f59e0b"
          />
        </div>

        {/* Row 1 — funnel + donut */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <CardShell>
            <CardTitle title="Resolution Funnel" badge={`Last ${days} days`} />
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: "#8B9DA4" }} />
                  <YAxis hide />
                  <Tooltip content={<FunnelTip received={received} />} cursor={{ fill: "rgba(3,150,166,0.06)" }} />
                  <Bar
                    dataKey="value"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={52}
                    onMouseEnter={(_, i) => setBarIdx(i)}
                    onMouseLeave={() => setBarIdx(undefined)}
                  >
                    {funnelData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.fill}
                        opacity={barIdx === undefined || barIdx === i ? 1 : 0.4}
                        style={{ transition: "opacity 0.2s ease", cursor: "pointer" }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardShell>

          <CardShell>
            <CardTitle title="Inbox Status" badge={`Last ${days} days`} />
            <div className="relative flex min-h-[180px] w-full flex-1 flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={78}
                    paddingAngle={received > 0 && replied > 0 && awaiting > 0 ? 3 : 0}
                    dataKey="value"
                    stroke="none"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    {...({ activeIndex: pieIdx, activeShape: ActiveSector } as any)}
                    onMouseEnter={(_, i) => setPieIdx(i)}
                    onMouseLeave={() => setPieIdx(undefined)}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTip total={received} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold leading-none text-slate-900" style={OUTFIT}>
                  {pieIdx !== undefined ? donutData[pieIdx]?.actualValue ?? received : received}
                </span>
                <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {pieIdx !== undefined ? donutData[pieIdx]?.name ?? "Total" : "Total emails"}
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: NAVY }} />
                <span className="text-[13px] font-semibold text-slate-500">
                  Answered <span className="font-bold text-slate-900">({replied})</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: TEAL }} />
                <span className="text-[13px] font-semibold text-slate-500">
                  Awaiting <span className="font-bold text-slate-900">({awaiting})</span>
                </span>
              </div>
            </div>
          </CardShell>
        </div>

        {/* Row 2 — emails over time */}
        <CardShell>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[14px] font-bold tracking-tight text-[#18181B]" style={OUTFIT}>
                Emails Over Time
              </span>
              <p className="mt-0.5 text-xs font-normal text-slate-400">
                {received} received · {days}d window
                {peak && peak.received > 0 ? (
                  <span className="ml-2 hidden font-semibold text-[#0396A6] sm:inline">
                    Peak: {peak.received} on {peak.name}
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-black/5 px-3 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-[11px] font-bold text-slate-600">{dateRangeLabel}</span>
            </div>
          </div>
          <div className="h-[250px] w-full">
            {byDay.some((d) => d.received > 0 || d.replied > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={byDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emailRecv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={TEAL} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8B9DA4", fontWeight: 600 }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8B9DA4", fontWeight: 600 }} allowDecimals={false} />
                  <Tooltip content={<AreaTip />} cursor={{ stroke: TEAL, strokeWidth: 1.5, strokeDasharray: "4 2" }} />
                  <Area
                    type="monotone"
                    dataKey="received"
                    stroke={TEAL}
                    strokeWidth={2.8}
                    fill="url(#emailRecv)"
                    dot={{ r: 3, strokeWidth: 2, fill: TEAL, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 3, fill: TEAL, stroke: "#fff" }}
                  />
                  <Area type="monotone" dataKey="replied" stroke={NAVY} strokeWidth={2} fill="transparent" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-400">
                <Inbox className="h-8 w-8 opacity-40" />
                No emails received in this date range
              </div>
            )}
          </div>
        </CardShell>

        {/* Row 3 — intent breakdown */}
        <CardShell>
          <CardTitle title="Emails by Intent" badge={`Last ${days} days`} />
          {intentData.length === 0 ? (
            <div className="flex h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-400">
              <Mail className="h-7 w-7 opacity-40" />
              No classified emails yet
            </div>
          ) : (
            <div style={{ height: Math.max(140, intentData.length * 42) }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intentData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" horizontal={false} />
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={130}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fontWeight: 600, fill: "#5b6b72" }}
                  />
                  <Tooltip content={<IntentTip />} cursor={{ fill: "rgba(3,150,166,0.06)" }} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={26}>
                    {intentData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardShell>

        {/* Row 4 — latest emails */}
        <CardShell>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[14px] font-bold tracking-tight text-[#18181B]" style={OUTFIT}>
              Latest Emails
            </span>
            {onViewEmails ? (
              <button
                type="button"
                onClick={onViewEmails}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:border-[#0396A6]/40 hover:text-[#0396A6]"
              >
                View All
              </button>
            ) : null}
          </div>
          <div className="space-y-3 pt-4">
            {(data?.recent ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs text-slate-400">
                <Inbox className="h-7 w-7 text-[#0396A6] opacity-40" />
                <p>No emails received yet.</p>
              </div>
            ) : (
              (data?.recent ?? []).map((m) => {
                const who = m.sender_name || m.sender_email || "Unknown sender";
                const avatar = (m.sender_name || m.sender_email || "?").trim().slice(0, 2).toUpperCase();
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={onViewEmails}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/80 p-3.5 text-left transition-all hover:border-[#0396A6]/30 hover:bg-white hover:shadow-xs"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D9EDEE] bg-[#EAF8F8] text-xs font-extrabold text-[#0396A6]">
                        {avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-xs font-bold text-[#18181B]">{who}</h4>
                        <p className="mt-0.5 truncate text-xs font-normal text-slate-500">
                          {m.subject || "(no subject)"}
                          {m.intent ? <span className="ml-1.5 text-[#0396A6]">· {intentLabel(m.intent)}</span> : null}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                      {formatConvoTime(m.received_at ?? m.created_at)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </CardShell>
      </div>
    </div>
  );
};
