import React, { useState, useMemo } from 'react';
import { Flame, TrendingUp, Zap, ArrowUpRight, Clock, Users, MessageSquare, Bot, Target, Activity, Calendar, CheckCircle2 } from 'lucide-react';
import { chartLabelStep } from '@/lib/chartAxis';

// â”€â”€ AQUA TEAL GLOBAL THEME â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const P = {
  purple: '#0396A6',
  purpleDeep: '#065E6A',
  purpleLight: '#67C9CE',
  purpleBg: '#EAF8F8',
  purpleSubtle: '#B8E0E2',
  teal: '#0d9488',
  tealLight: '#5eead4',
  amber: '#f59e0b',
  amberLight: '#fef3c7',
  amberDark: '#d97706',
  rose: '#ef4444',
  cardBg: '#ffffff',
  pageBg: '#FCFDFD',
  border: '#D9EDEE',
  borderDark: '#D5CBBD',
  textMuted: '#8B9DA4',
  textDark: '#111827',
};

// â”€â”€ FRITSCH-CARLSON MONOTONE CUBIC SPLINE GENERATOR (INDUSTRY STANDARD) â”€â”€
// Eliminates overshoot/undershoot, loops, and dips below 0 or above max.
export function getSplinePath(pts: { x: number; y: number }[], minY?: number, maxY?: number): string {
  if (!pts || pts.length === 0 || !pts[0]) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  if (pts.length === 2 && pts[1]) return `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)} L ${pts[1].x.toFixed(2)},${pts[1].y.toFixed(2)}`;

  const n = pts.length;
  const dxs: number[] = [];
  const dys: number[] = [];
  const ms: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    const pCurrent = pts[i];
    const pNext = pts[i + 1];
    if (!pCurrent || !pNext) continue;
    const dx = pNext.x - pCurrent.x;
    const dy = pNext.y - pCurrent.y;
    dxs.push(dx);
    dys.push(dy);
    ms.push(dx === 0 ? 0 : dy / dx);
  }

  if (ms.length === 0) return '';
  const tangents: number[] = [ms[0] ?? 0];
  for (let i = 1; i < ms.length; i++) {
    const mPrev = ms[i - 1] ?? 0;
    const mCurr = ms[i] ?? 0;
    if (mPrev * mCurr <= 0) {
      tangents.push(0);
    } else {
      tangents.push((mPrev + mCurr) / 2);
    }
  }
  tangents.push(ms[ms.length - 1] ?? 0);

  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    if (!p1 || !p2) continue;
    const dx = dxs[i] ?? 0;
    const t1 = tangents[i] ?? 0;
    const t2 = tangents[i + 1] ?? 0;
    const cp1x = p1.x + dx / 3;
    let cp1y = p1.y + (t1 * dx) / 3;
    const cp2x = p2.x - dx / 3;
    let cp2y = p2.y - (t2 * dx) / 3;

    if (minY !== undefined && maxY !== undefined) {
      cp1y = Math.max(minY, Math.min(maxY, cp1y));
      cp2y = Math.max(minY, Math.min(maxY, cp2y));
    }

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

export function getAreaSplinePath(pts: { x: number; y: number }[], bottomY: number, minY?: number, maxY?: number): string {
  if (!pts || pts.length === 0 || !pts[0]) return '';
  const linePath = getSplinePath(pts, minY, maxY);
  const firstX = pts[0].x;
  const lastPt = pts[pts.length - 1];
  const lastX = lastPt ? lastPt.x : firstX;
  return `${linePath} L ${lastX.toFixed(2)},${bottomY.toFixed(2)} L ${firstX.toFixed(2)},${bottomY.toFixed(2)} Z`;
}

function niceYTicks(dataMax: number, count: number = 5): number[] {
  if (dataMax <= 0) return Array.from({ length: count }, (_, i) => i);
  const rough = dataMax / (count - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(rough, 1))));
  const candidates = [1, 2, 2.5, 5, 10];
  const step = candidates.find(c => c * mag >= rough)! * mag;
  const niceMax = Math.ceil(dataMax / step) * step;
  return Array.from({ length: count }, (_, i) => Math.round(niceMax - i * (niceMax / (count - 1))));
}

// â”€â”€ 1. CONVERSATIONS & MESSAGES SVG CHART â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function ConvMsgsChart({ xLabels, convSeries, msgSeries, periodConvs, periodMsgs, days }: { xLabels: string[]; convSeries: number[]; msgSeries: number[]; periodConvs?: number; periodMsgs?: number; days?: number }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 600;
  const height = 220;
  const pad = { top: 14, right: 20, bottom: 28, left: 36 };
  const cW = width - pad.left - pad.right;
  const cH = height - pad.top - pad.bottom;

  const maxY = useMemo(() => {
    const dataMax = Math.max(...msgSeries, ...convSeries, 1);
    return Math.ceil(dataMax * 1.15);
  }, [msgSeries, convSeries]);

  const yTicks = useMemo(() => niceYTicks(maxY, 4), [maxY]);
  const chartMax = yTicks[0] || maxY;

  const getPt = (i: number, val: number) => ({
    x: pad.left + (i / Math.max(xLabels.length - 1, 1)) * cW,
    y: pad.top + cH - (val / chartMax) * cH,
  });

  const convPts = convSeries.map((v, i) => getPt(i, v));
  const msgPts = msgSeries.map((v, i) => getPt(i, v));
  const labelStep = chartLabelStep(xLabels.length, days);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', justifyContent: 'space-between', width: '100%' }}>
      <div style={{ height: 220, position: 'relative' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', overflow: 'visible', cursor: 'crosshair' }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const idx = Math.min(Math.max(Math.round(relX * (xLabels.length - 1)), 0), xLabels.length - 1);
            setHoverIdx(idx);
          }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="amberMsgAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={P.amber} stopOpacity="0.22" />
              <stop offset="100%" stopColor={P.amber} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="convAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={P.purpleDeep} stopOpacity="0.12" />
              <stop offset="100%" stopColor={P.purpleDeep} stopOpacity="0.0" />
            </linearGradient>
            <filter id="chartShadow"><feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.08" /></filter>
          </defs>

          {/* Y Grid Lines */}
          {yTicks.map((v, i) => {
            const y = pad.top + cH - (v / chartMax) * cH;
            return (
              <g key={i}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke={P.border} strokeWidth="0.8" strokeDasharray="3 3" />
                <text x={pad.left - 6} y={y + 3.5} fill={P.textMuted} fontSize="9.5" fontWeight="500" textAnchor="end">{v}</text>
              </g>
            );
          })}

          {/* X Labels */}
          {xLabels.map((lbl, i) => {
            if (i % labelStep !== 0 && i !== xLabels.length - 1) return null;
            const x = pad.left + (i / Math.max(xLabels.length - 1, 1)) * cW;
            return (
              <text key={i} x={x} y={height - 6} fill={P.textMuted} fontSize="9.5" fontWeight="500" textAnchor="middle">{lbl}</text>
            );
          })}

          {/* Messages Area & Line */}
          <path d={getAreaSplinePath(msgPts, pad.top + cH, pad.top, pad.top + cH)} fill="url(#amberMsgAreaGrad)" />
          <path d={getSplinePath(msgPts, pad.top, pad.top + cH)} fill="none" stroke={P.amber} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3" filter="url(#chartShadow)" />
          {msgPts.map((pt, i) => (
            <circle key={`m-${i}`} cx={pt.x} cy={pt.y} r={hoverIdx === i ? 5.5 : 2.5} fill={P.amber} stroke="#ffffff" strokeWidth="1.5" style={{ transition: 'r 0.15s ease' }} />
          ))}

          {/* Conversations Area & Line */}
          <path d={getAreaSplinePath(convPts, pad.top + cH, pad.top, pad.top + cH)} fill="url(#convAreaGrad)" />
          <path d={getSplinePath(convPts, pad.top, pad.top + cH)} fill="none" stroke={P.purpleDeep} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" filter="url(#chartShadow)" />
          {convPts.map((pt, i) => (
            <circle key={`c-${i}`} cx={pt.x} cy={pt.y} r={hoverIdx === i ? 6 : 3} fill={P.purpleDeep} stroke="#ffffff" strokeWidth="1.5" style={{ transition: 'r 0.15s ease' }} />
          ))}

          {/* Hover Line */}
          {hoverIdx !== null && msgPts[hoverIdx] && (
            <line x1={msgPts[hoverIdx].x} y1={pad.top} x2={msgPts[hoverIdx].x} y2={pad.top + cH} stroke={P.textMuted} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          )}
        </svg>

        {hoverIdx !== null && msgPts[hoverIdx] && (
          <div style={{
            position: 'absolute',
            left: Math.min(Math.max((msgPts[hoverIdx]?.x ?? 0) * (100 / width) - 5, 2), 75) + '%',
            top: 4,
            background: 'rgba(31,41,55,0.95)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '8px 12px',
            borderRadius: 10,
            fontSize: 11.5,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
            zIndex: 20,
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: 130,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3, opacity: 0.7, fontSize: 9.5, letterSpacing: '0.03em' }}>{xLabels[hoverIdx]}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: P.purpleDeep, display: 'inline-block' }} />
                Convs: <strong>{convSeries[hoverIdx]}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginTop: 2 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: P.amber, display: 'inline-block' }} />
                Msgs: <strong>{msgSeries[hoverIdx]}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Section Anchored to Bottom */}
      {(periodConvs !== undefined && periodMsgs !== undefined) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingTop: 12,
          borderTop: `1px solid ${P.border}`,
          marginTop: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={16} color={P.purpleDeep} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 12, color: P.textMuted, fontWeight: 500 }}>Total Convs:</span>
              <strong style={{ fontSize: 16, color: P.textDark, fontWeight: 800 }}>{periodConvs}</strong>
            </div>
          </div>
          <div style={{ width: 1, height: 22, background: P.border }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={16} color={P.amber} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 12, color: P.textMuted, fontWeight: 500 }}>Total Msgs:</span>
              <strong style={{ fontSize: 16, color: P.textDark, fontWeight: 800 }}>{periodMsgs}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 2. TOP TOPICS CENTERED DONUT WITH MINIMAL 2-COLUMN ROWS ───────────────────
const TOPIC_PALETTE = ['#0396A6', '#f59e0b', '#0d9488', '#8b5cf6', '#ef4444', '#3b82f6', '#ec4899', '#6366f1'];

export function TopicsDonut({ items, total }: { items: { label: string; count: number; color: string }[]; total: number }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const r = 63;
  const C = 2 * Math.PI * r; // ~395.84
  const strokeWidth = 11;

  const normalizedItems = useMemo(() => {
    return items.map((it, i) => ({
      ...it,
      color: it.color && !it.color.startsWith('#8b5cf6') && !it.color.startsWith('#7c3aed') && !it.color.startsWith('#a78bfa')
        ? it.color
        : TOPIC_PALETTE[i % TOPIC_PALETTE.length],
    }));
  }, [items]);

  const segments = useMemo(() => {
    if (!normalizedItems.length || total <= 0) return [];
    let offset = 0;
    const gapSize = normalizedItems.length > 1 ? 5 : 0;
    return normalizedItems.map((item, i) => {
      const frac = item.count / total;
      const len = Math.max(frac * C - gapSize, 2);
      const seg = { ...item, len, offset: offset + gapSize / 2, frac, idx: i };
      offset += frac * C;
      return seg;
    });
  }, [normalizedItems, total, C]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', flex: 1, justifyContent: 'space-between' }}>
      {/* Centered Donut */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, width: 160 }}>
        <svg viewBox="0 0 160 160" style={{ width: 160, height: 160, overflow: 'visible' }}>
          {/* Background track */}
          <circle cx="80" cy="80" r={r} fill="none" stroke={P.purpleBg} strokeWidth={strokeWidth} />

          {/* Slices rotated from 12 o'clock */}
          <g transform="rotate(-90 80 80)">
            {segments.map((seg) => {
              const isHovered = hoverIdx === seg.idx;
              return (
                <circle
                  key={seg.idx}
                  cx="80" cy="80" r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 2.5 : strokeWidth}
                  strokeDasharray={`${seg.len} ${C}`}
                  strokeDashoffset={-seg.offset}
                  strokeLinecap="butt"
                  style={{
                    transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                    cursor: 'pointer',
                    opacity: hoverIdx === null || isHovered ? 1 : 0.3,
                    filter: isHovered ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))' : 'none',
                  }}
                  onMouseEnter={() => setHoverIdx(seg.idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                />
              );
            })}
          </g>
        </svg>

        {/* Center Stat Badge */}
        <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: 108, width: 108, padding: 2 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: P.textDark, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {hoverIdx !== null && normalizedItems[hoverIdx] ? normalizedItems[hoverIdx].count : total}
          </div>
          <div style={{ fontSize: 8.5, color: P.textMuted, fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100, lineHeight: 1.2 }}>
            {hoverIdx !== null && normalizedItems[hoverIdx] ? normalizedItems[hoverIdx].label : 'total topics'}
          </div>
          {hoverIdx !== null && normalizedItems[hoverIdx] && (
            <div style={{ fontSize: 10.5, color: normalizedItems[hoverIdx].color, fontWeight: 700, marginTop: 1 }}>
              {Math.round((normalizedItems[hoverIdx].count / (total || 1)) * 100)}%
            </div>
          )}
        </div>
      </div>

      {/* Clean Simple Minimal 2-Column Rows with Tight Gaps */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '4px 14px',
        width: '100%',
      }}>
        {normalizedItems.slice(0, 6).map((item, i) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const isHovered = hoverIdx === i;
          return (
            <div
              key={i}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '3px 4px',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isHovered ? P.purpleBg : 'transparent',
                opacity: hoverIdx === null || isHovered ? 1 : 0.5,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: isHovered ? item.color : P.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: item.color,
                  flexShrink: 0,
                  transition: 'transform 0.15s ease',
                  transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                }} />
                {item.label}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: P.textDark, flexShrink: 0, marginLeft: 4 }}>
                {item.count} <span style={{ fontWeight: 500, color: P.textMuted, fontSize: 11 }}>({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 3. CONVERSION FUNNEL DONUT WITH PERFECT GAP BETWEEN ARCS ─────────────
export function ConversionFunnelDonut({ totalConvs, totalLeads }: { totalConvs: number; totalLeads: number }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const convRate = totalConvs > 0 ? Math.round((totalLeads / totalConvs) * 100) : 0;

  const r = 63;
  const C = 2 * Math.PI * r;
  const strokeWidth = 11;
  const gap = 6;
  // Proportional arcs: leads vs non-converted conversations (not decorative 50/50).
  const denom = Math.max(totalConvs, 1);
  const leadsFrac = Math.min(Math.max(totalLeads, 0) / denom, 1);
  const restFrac = 1 - leadsFrac;
  const leadsLen = Math.max(leadsFrac * C - gap, leadsFrac > 0 ? 2 : 0);
  const restLen = Math.max(restFrac * C - gap, restFrac > 0 ? 2 : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', flex: 1, justifyContent: 'space-between' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, width: 160 }}>
        <svg viewBox="0 0 160 160" style={{ width: 160, height: 160, overflow: 'visible' }}>
          <circle cx="80" cy="80" r={r} fill="none" stroke={P.purpleBg} strokeWidth={strokeWidth} />
          <g transform="rotate(-90 80 80)">
            {/* Conversations (full period) — remainder after leads */}
            <circle
              cx="80" cy="80" r={r}
              fill="none"
              stroke={P.purpleDeep}
              strokeWidth={hoverIdx === 0 ? strokeWidth + 2.5 : strokeWidth}
              strokeDasharray={`${restLen} ${C}`}
              strokeDashoffset={-(gap / 2)}
              strokeLinecap="butt"
              style={{
                transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                cursor: 'pointer',
                opacity: hoverIdx === null || hoverIdx === 0 ? 1 : 0.35,
                filter: hoverIdx === 0 ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))' : 'none',
              }}
              onMouseEnter={() => setHoverIdx(0)}
              onMouseLeave={() => setHoverIdx(null)}
            />
            {/* Leads share of conversations */}
            <circle
              cx="80" cy="80" r={r}
              fill="none"
              stroke={P.amber}
              strokeWidth={hoverIdx === 1 ? strokeWidth + 2.5 : strokeWidth}
              strokeDasharray={`${leadsLen} ${C}`}
              strokeDashoffset={-(restFrac * C + gap / 2)}
              strokeLinecap="butt"
              style={{
                transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                cursor: 'pointer',
                opacity: hoverIdx === null || hoverIdx === 1 ? 1 : 0.35,
                filter: hoverIdx === 1 ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))' : 'none',
              }}
              onMouseEnter={() => setHoverIdx(1)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          </g>
        </svg>

        {/* Center Stat Badge with generous internal clearance */}
        <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: 108, width: 108 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: P.textDark, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {hoverIdx === 0 ? totalConvs : hoverIdx === 1 ? totalLeads : `${convRate}%`}
          </div>
          <div style={{ fontSize: 8.5, color: P.textMuted, fontWeight: 700, marginTop: 3.5, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.2, maxWidth: 100 }}>
            {hoverIdx === 0 ? 'Conversations' : hoverIdx === 1 ? 'Leads Captured' : 'Conversion'}
          </div>
        </div>
      </div>

      {/* Clean Minimal Topic Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        <div
          onMouseEnter={() => setHoverIdx(0)}
          onMouseLeave={() => setHoverIdx(null)}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '5px 8px', borderRadius: 8, cursor: 'pointer',
            background: hoverIdx === 0 ? P.purpleBg : 'transparent',
            transition: 'all 0.15s ease',
            opacity: hoverIdx === null || hoverIdx === 0 ? 1 : 0.5,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: hoverIdx === 0 ? P.purpleDeep : P.textDark }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: P.purpleDeep, flexShrink: 0,
              transition: 'transform 0.15s ease', transform: hoverIdx === 0 ? 'scale(1.3)' : 'scale(1)'
            }} />
            Conversations
          </span>
          <strong style={{ color: P.textDark, fontSize: 13, fontWeight: 700 }}>{totalConvs}</strong>
        </div>

        <div
          onMouseEnter={() => setHoverIdx(1)}
          onMouseLeave={() => setHoverIdx(null)}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '5px 8px', borderRadius: 8, cursor: 'pointer',
            background: hoverIdx === 1 ? P.purpleBg : 'transparent',
            transition: 'all 0.15s ease',
            opacity: hoverIdx === null || hoverIdx === 1 ? 1 : 0.5,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: hoverIdx === 1 ? P.amber : P.textDark }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: P.amber, flexShrink: 0,
              transition: 'transform 0.15s ease', transform: hoverIdx === 1 ? 'scale(1.3)' : 'scale(1)'
            }} />
            Leads Captured
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: P.textDark }}>
            {totalLeads} <span style={{ fontWeight: 500, color: P.textMuted, fontSize: 11 }}>({convRate}%)</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ 4. LEADS SVG CHART â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function LeadsChart({ xLabels, newSeries, followedSeries, periodLeads, followedUp, days }: { xLabels: string[]; newSeries: number[]; followedSeries: number[]; periodLeads?: number; followedUp?: number; days?: number }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 400;
  const height = 215;
  const pad = { top: 14, right: 20, bottom: 26, left: 34 };
  const cW = width - pad.left - pad.right;
  const cH = height - pad.top - pad.bottom;

  const maxY = useMemo(() => {
    const dataMax = Math.max(...newSeries, ...followedSeries, 1);
    return Math.ceil(dataMax * 1.15);
  }, [newSeries, followedSeries]);

  const yTicks = useMemo(() => niceYTicks(maxY, 4), [maxY]);
  const chartMax = yTicks[0] || maxY;

  const getPt = (i: number, val: number) => ({
    x: pad.left + (i / Math.max(xLabels.length - 1, 1)) * cW,
    y: pad.top + cH - (val / chartMax) * cH,
  });

  const newPts = newSeries.map((v, i) => getPt(i, v));
  const followedPts = followedSeries.map((v, i) => getPt(i, v));
  const labelStep = chartLabelStep(xLabels.length, days);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', justifyContent: 'space-between', width: '100%' }}>
      <div style={{ height: 215, position: 'relative' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', overflow: 'visible', cursor: 'crosshair' }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const idx = Math.min(Math.max(Math.round(relX * (xLabels.length - 1)), 0), xLabels.length - 1);
            setHoverIdx(idx);
          }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="amberLeadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={P.amber} stopOpacity="0.25" />
              <stop offset="100%" stopColor={P.amber} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="tealFollowedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={P.teal} stopOpacity="0.22" />
              <stop offset="100%" stopColor={P.teal} stopOpacity="0.0" />
            </linearGradient>
            <filter id="leadsShadow"><feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.08" /></filter>
          </defs>

          {/* Y Grid Lines & Labels */}
          {yTicks.map((v, i) => {
            const y = pad.top + cH - (v / chartMax) * cH;
            return (
              <g key={i}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke={P.border} strokeWidth="0.8" strokeDasharray="3 3" />
                <text x={pad.left - 6} y={y + 3.5} fill={P.textMuted} fontSize="9" fontWeight="500" textAnchor="end">{v}</text>
              </g>
            );
          })}

          {/* X Date Labels */}
          {xLabels.map((lbl, i) => {
            if (i % labelStep !== 0 && i !== xLabels.length - 1) return null;
            const x = pad.left + (i / Math.max(xLabels.length - 1, 1)) * cW;
            return (
              <text key={i} x={x} y={height - 6} fill={P.textMuted} fontSize="9" fontWeight="500" textAnchor="middle">{lbl}</text>
            );
          })}

          {/* Followed Up Series */}
          <path d={getAreaSplinePath(followedPts, pad.top + cH, pad.top, pad.top + cH)} fill="url(#tealFollowedGrad)" />
          <path d={getSplinePath(followedPts, pad.top, pad.top + cH)} fill="none" stroke={P.teal} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3" filter="url(#leadsShadow)" />
          {followedPts.map((pt, i) => (
            <circle key={`f-${i}`} cx={pt.x} cy={pt.y} r={hoverIdx === i ? 5 : 2.5} fill={P.teal} stroke="#ffffff" strokeWidth="1.5" style={{ transition: 'r 0.15s ease' }} />
          ))}

          {/* New Leads Series */}
          <path d={getAreaSplinePath(newPts, pad.top + cH, pad.top, pad.top + cH)} fill="url(#amberLeadGrad)" />
          <path d={getSplinePath(newPts, pad.top, pad.top + cH)} fill="none" stroke={P.amber} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#leadsShadow)" />
          {newPts.map((pt, i) => (
            <circle key={`n-${i}`} cx={pt.x} cy={pt.y} r={hoverIdx === i ? 5.5 : 3} fill={P.amber} stroke="#ffffff" strokeWidth="1.5" style={{ transition: 'r 0.15s ease' }} />
          ))}

          {/* Hover Line */}
          {hoverIdx !== null && newPts[hoverIdx] && (
            <line x1={newPts[hoverIdx].x} y1={pad.top} x2={newPts[hoverIdx].x} y2={pad.top + cH} stroke={P.textMuted} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          )}
        </svg>

        {hoverIdx !== null && newPts[hoverIdx] && (
          <div style={{
            position: 'absolute',
            left: Math.min(Math.max((newPts[hoverIdx]?.x ?? 0) * (100 / width) - 8, 2), 70) + '%',
            top: 4,
            background: 'rgba(31,41,55,0.95)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '8px 12px',
            borderRadius: 10,
            fontSize: 11,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            zIndex: 10,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3, opacity: 0.7, fontSize: 9.5 }}>{xLabels[hoverIdx]}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span>New: <strong style={{ color: P.amber }}>{newSeries[hoverIdx]}</strong></span>
              <span>Followed: <strong style={{ color: P.tealLight }}>{followedSeries[hoverIdx]}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Integrated Bottom Summary (Tight Flush Spacing) */}
      {(periodLeads !== undefined && followedUp !== undefined) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingTop: 8,
          borderTop: `1px solid ${P.border}`,
          marginTop: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: P.amber }} />
            <span style={{ fontSize: 11.5, color: P.textMuted, fontWeight: 500 }}>New Leads:</span>
            <strong style={{ fontSize: 14, color: P.textDark, fontWeight: 800 }}>{periodLeads}</strong>
          </div>
          <div style={{ width: 1, height: 18, background: P.border }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: P.teal }} />
            <span style={{ fontSize: 11.5, color: P.textMuted, fontWeight: 500 }}>Followed:</span>
            <strong style={{ fontSize: 14, color: P.textDark, fontWeight: 800 }}>{followedUp}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ 5. CONVERSION TREND SVG CHART (WIDE 600px, LEFT-ALIGNED SPLINE) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function ConvTrendChart({ xLabels, series, avgRate, peakRate, days }: { xLabels: string[]; series: number[]; avgRate?: string; peakRate?: string; days?: number }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 600;
  const height = 220;
  const pad = { top: 14, right: 20, bottom: 28, left: 36 };
  const cW = width - pad.left - pad.right;
  const cH = height - pad.top - pad.bottom;

  const maxY = useMemo(() => {
    const dataMax = Math.max(...series, 1);
    return Math.max(Math.ceil(dataMax * 1.2), 20);
  }, [series]);

  const yTicks = useMemo(() => niceYTicks(maxY, 4), [maxY]);
  const chartMax = yTicks[0] || maxY;

  const getPt = (i: number, val: number) => ({
    x: pad.left + (i / Math.max(xLabels.length - 1, 1)) * cW,
    y: pad.top + cH - (Math.min(Math.max(val, 0), chartMax) / chartMax) * cH,
  });

  const pts = series.map((v, i) => getPt(i, v));
  const labelStep = chartLabelStep(xLabels.length, days);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', justifyContent: 'space-between', width: '100%' }}>
      <div style={{ height: 220, position: 'relative' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', overflow: 'visible', cursor: 'crosshair' }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const idx = Math.min(Math.max(Math.round(relX * (xLabels.length - 1)), 0), xLabels.length - 1);
            setHoverIdx(idx);
          }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="convTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={P.teal} stopOpacity="0.25" />
              <stop offset="100%" stopColor={P.teal} stopOpacity="0.0" />
            </linearGradient>
            <filter id="trendShadow"><feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.08" /></filter>
          </defs>

          {/* Y Grid Lines & Labels */}
          {yTicks.map((v, i) => {
            const y = pad.top + cH - (v / chartMax) * cH;
            return (
              <g key={i}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke={P.border} strokeWidth="0.8" strokeDasharray="3 3" />
                <text x={pad.left - 6} y={y + 3.5} fill={P.textMuted} fontSize="9.5" fontWeight="500" textAnchor="end">{v}%</text>
              </g>
            );
          })}

          {/* X Date Labels */}
          {xLabels.map((lbl, i) => {
            if (i % labelStep !== 0 && i !== xLabels.length - 1) return null;
            const x = pad.left + (i / Math.max(xLabels.length - 1, 1)) * cW;
            return (
              <text key={i} x={x} y={height - 6} fill={P.textMuted} fontSize="9.5" fontWeight="500" textAnchor="middle">{lbl}</text>
            );
          })}

          {/* Area & Line */}
          <path d={getAreaSplinePath(pts, pad.top + cH, pad.top, pad.top + cH)} fill="url(#convTrendGrad)" />
          <path d={getSplinePath(pts, pad.top, pad.top + cH)} fill="none" stroke={P.teal} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" filter="url(#trendShadow)" />

          {/* Data Dots */}
          {pts.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={hoverIdx === i ? 6 : 3} fill={P.teal} stroke="#ffffff" strokeWidth="1.5" style={{ transition: 'r 0.15s ease' }} />
          ))}

          {/* Hover Line */}
          {hoverIdx !== null && pts[hoverIdx] && (
            <line x1={pts[hoverIdx].x} y1={pad.top} x2={pts[hoverIdx].x} y2={pad.top + cH} stroke={P.textMuted} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          )}
        </svg>

        {hoverIdx !== null && pts[hoverIdx] && (
          <div style={{
            position: 'absolute',
            left: Math.min(Math.max((pts[hoverIdx]?.x ?? 0) * (100 / width) - 8, 2), 70) + '%',
            top: 4,
            background: 'rgba(31,41,55,0.95)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '8px 12px',
            borderRadius: 10,
            fontSize: 11.5,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
            zIndex: 10,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3, opacity: 0.7, fontSize: 9.5 }}>{xLabels[hoverIdx]}</div>
            <div>Conversion Rate: <strong style={{ color: P.tealLight }}>{series[hoverIdx]}%</strong></div>
          </div>
        )}
      </div>

      {/* Integrated Bottom Summary */}
      {(avgRate !== undefined || peakRate !== undefined) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingTop: 10,
          borderTop: `1px solid ${P.border}`,
          marginTop: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={14} color={P.teal} />
            <span style={{ fontSize: 12, color: P.textMuted, fontWeight: 500 }}>Avg Rate:</span>
            <strong style={{ fontSize: 15, color: P.textDark, fontWeight: 800 }}>{avgRate}</strong>
          </div>
          <div style={{ width: 1, height: 18, background: P.border }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={14} color={P.amber} />
            <span style={{ fontSize: 12, color: P.textMuted, fontWeight: 500 }}>Peak Rate:</span>
            <strong style={{ fontSize: 15, color: P.textDark, fontWeight: 800 }}>{peakRate}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ 6. PEAK HOURS BAR CHART (CLEAN THEME, #065E6A ON HOVER) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function PeakHoursChart({ bars, peakLabel }: { bars: number[]; peakLabel: string }) {
  const [hoverHour, setHoverHour] = useState<number | null>(null);
  const maxBar = useMemo(() => Math.max(...bars, 1), [bars]);
  const peakHourIdx = useMemo(() => bars.indexOf(Math.max(...bars)), [bars]);

  const formatHour = (h: number) => {
    if (h === 0) return '12a';
    if (h < 12) return `${h}a`;
    if (h === 12) return '12p';
    return `${h - 12}p`;
  };

  const formatFullHour = (h: number) => {
    if (h === 0) return '12:00 AM';
    if (h < 12) return `${h}:00 AM`;
    if (h === 12) return '12:00 PM';
    return `${h - 12}:00 PM`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', justifyContent: 'space-between', gap: 10, width: '100%' }}>
      {/* Bars Area with Clean Tooltip */}
      <div style={{ height: 175, display: 'flex', alignItems: 'flex-end', gap: 3, padding: '0 2px', position: 'relative' }}>
        {bars.map((v: number, i: number) => {
          const pct = Math.max((v / maxBar) * 100, 3);
          const isHovered = hoverHour === i;
          const isPeak = i === peakHourIdx && v > 0;
          return (
            <div
              key={i}
              onMouseEnter={() => setHoverHour(i)}
              onMouseLeave={() => setHoverHour(null)}
              style={{
                flex: 1,
                height: `${pct}%`,
                background: isHovered
                  ? '#065E6A'
                  : isPeak
                    ? `linear-gradient(to top, ${P.purpleDeep}, #408066)`
                    : (v > 0 ? `${P.purpleDeep}99` : `${P.border}88`),
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                opacity: hoverHour === null || isHovered ? 1 : 0.4,
                transform: isHovered ? 'scaleY(1.06)' : 'none',
                transformOrigin: 'bottom',
                minWidth: 0,
                boxShadow: isHovered ? '0 0 10px rgba(42,90,71,0.35)' : 'none',
              }}
            />
          );
        })}

        {/* Floating Tooltip */}
        {hoverHour !== null && (
          <div style={{
            position: 'absolute',
            top: 4,
            left: `${((hoverHour + 0.5) / 24) * 100}%`,
            transform: 'translateX(-50%)',
            background: 'rgba(31,41,55,0.95)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: 8,
            fontSize: 11,
            boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 9.5, opacity: 0.7 }}>{formatFullHour(hoverHour)}</div>
            <div><strong style={{ color: '#5eead4' }}>{bars[hoverHour] ?? 0}</strong> messages</div>
          </div>
        )}
      </div>

      {/* Ticks along bottom */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: P.textMuted, padding: '0 4px' }}>
        {[0, 3, 6, 9, 12, 15, 18, 21, 23].map(h => (
          <span key={h} style={{ fontWeight: 500 }}>{formatHour(h)}</span>
        ))}
      </div>

      {/* Footer info using bottom space */}
      <div style={{
        background: P.purpleBg, borderRadius: 10, padding: '8px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12,
        border: `1px solid ${P.purpleLight}33`, marginTop: 'auto'
      }}>
        <span style={{ color: P.textDark, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} color={P.purpleDeep} />
          {hoverHour !== null ? `${formatFullHour(hoverHour)} Activity` : 'Peak Time'}
        </span>
        <strong style={{ color: P.purpleDeep, fontSize: 13 }}>
          {hoverHour !== null ? `${bars[hoverHour] ?? 0} msgs` : peakLabel}
        </strong>
      </div>
    </div>
  );
}

// â”€â”€ 7. CREDIT USAGE BAR CHART (RESPONSIVE SVG - SUPPORTS 7d TO 90d) â”€â”€
export function CreditUsageChart({ data }: { data: { day: string; credits: number }[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 400;
  const height = 215;
  const pad = { top: 16, right: 16, bottom: 22, left: 32 };
  const cW = width - pad.left - pad.right;
  const cH = height - pad.top - pad.bottom;

  const maxCredit = useMemo(() => {
    const m = Math.max(...data.map(d => d.credits), 1);
    return Math.ceil(m * 1.15);
  }, [data]);

  const yTicks = useMemo(() => niceYTicks(maxCredit, 4), [maxCredit]);
  const chartMax = yTicks[0] || maxCredit;
  const totalUsed = useMemo(() => data.reduce((acc, d) => acc + d.credits, 0), [data]);
  const avgUsage = data.length > 0 ? (totalUsed / data.length).toFixed(1) : '0';

  const n = data.length;
  const barGap = n > 50 ? 0.8 : n > 25 ? 1.5 : 3;
  const totalGaps = Math.max(n - 1, 0) * barGap;
  const barW = Math.max((cW - totalGaps) / Math.max(n, 1), 1.2);
  const labelStep = chartLabelStep(n, n);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', justifyContent: 'space-between', width: '100%' }}>
      {/* SVG Bars Area with Taller Height & Top Breathing Room */}
      <div style={{ height: 215, position: 'relative' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="creditBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#408066" />
              <stop offset="100%" stopColor={P.purpleDeep} />
            </linearGradient>
            <linearGradient id="creditBarHoverGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5eead4" />
              <stop offset="100%" stopColor={P.purpleDeep} />
            </linearGradient>
          </defs>

          {/* Y Grid Lines & Labels */}
          {yTicks.map((v, i) => {
            const y = pad.top + cH - (v / chartMax) * cH;
            return (
              <g key={i}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke={P.border} strokeWidth="0.8" strokeDasharray="3 3" />
                <text x={pad.left - 5} y={y + 3} fill={P.textMuted} fontSize="8.5" fontWeight="500" textAnchor="end">{v}</text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const bH = Math.max((d.credits / chartMax) * cH, d.credits > 0 ? 2.5 : 1);
            const x = pad.left + i * (barW + barGap);
            const y = pad.top + cH - bH;
            const isHovered = hoverIdx === i;

            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barW}
                height={bH}
                rx={n > 40 ? 1 : 2.5}
                fill={isHovered ? 'url(#creditBarHoverGrad)' : (d.credits > 0 ? 'url(#creditBarGrad)' : `${P.border}88`)}
                opacity={hoverIdx === null || isHovered ? 1 : 0.4}
                style={{ transition: 'opacity 0.15s ease', cursor: 'pointer' }}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              />
            );
          })}

          {/* X Axis Date Labels */}
          {data.map((d, i) => {
            if (i % labelStep !== 0 && i !== n - 1) return null;
            const x = pad.left + i * (barW + barGap) + barW / 2;
            return (
              <text key={i} x={x} y={height - 5} fill={P.textMuted} fontSize="8.5" fontWeight="500" textAnchor="middle">
                {d.day.split('-').slice(1).join('/')}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoverIdx !== null && data[hoverIdx] && (
          <div style={{
            position: 'absolute',
            top: 4,
            left: `${Math.min(Math.max(((hoverIdx + 0.5) / n) * 100, 10), 85)}%`,
            transform: 'translateX(-50%)',
            background: 'rgba(31,41,55,0.95)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: 8,
            fontSize: 11,
            boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 9.5, opacity: 0.7 }}>{data[hoverIdx]?.day.split('-').slice(1).join('/')}</div>
            <div><strong style={{ color: '#5eead4' }}>{data[hoverIdx]?.credits.toFixed(1)}</strong> credits</div>
          </div>
        )}
      </div>

      {/* Integrated Bottom Summary with Flush Spacing */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 10,
        borderTop: `1px solid ${P.border}`,
        marginTop: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11.5, color: P.textMuted, fontWeight: 500 }}>Total:</span>
          <strong style={{ fontSize: 14, color: P.textDark, fontWeight: 800 }}>{totalUsed.toFixed(1)} cr</strong>
        </div>
        <div style={{ width: 1, height: 18, background: P.border }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11.5, color: P.textMuted, fontWeight: 500 }}>Daily Avg:</span>
          <strong style={{ fontSize: 14, color: P.textDark, fontWeight: 800 }}>{avgUsage} cr</strong>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ 8. ACTIVITY HEATMAP (TALLER CELLS, 5 TIER COLORS, CLEAN TOOLTIPS) â”€â”€â”€
export function HeatmapChart({ data }: { data: { dow: number; hour: number; count: number }[] }) {
  const [hoverCell, setHoverCell] = useState<{ dow: number; hour: number; count: number } | null>(null);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const { grid, maxCount } = useMemo(() => {
    const g: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let mx = 1;
    for (const d of data) {
      if (g[d.dow]) g[d.dow]![d.hour] = d.count;
      if (d.count > mx) mx = d.count;
    }
    return { grid: g, maxCount: mx };
  }, [data]);

  const getColor = (count: number) => {
    if (count === 0) return '#f3f4f6';
    const ratio = count / maxCount;
    if (ratio < 0.25) return '#c2e2d2';
    if (ratio < 0.50) return '#7ebca0';
    if (ratio < 0.75) return '#408066';
    return '#234f3e';
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ width: '100%', overflowX: 'auto', paddingBottom: 6, WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 480, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {dayNames.map((day, dow) => (
            <div key={dow} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ width: 34, fontSize: 11, color: P.textMuted, fontWeight: 600, flexShrink: 0 }}>{day}</span>
              <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                {Array.from({ length: 24 }).map((_, hour) => {
                  const count = grid[dow]?.[hour] ?? 0;
                  const isHovered = hoverCell?.dow === dow && hoverCell?.hour === hour;
                  return (
                    <div
                      key={hour}
                      onMouseEnter={() => setHoverCell({ dow, hour, count })}
                      onMouseLeave={() => setHoverCell(null)}
                      style={{
                        flex: 1,
                        height: 26,
                        background: getColor(count),
                        borderRadius: 6,
                        cursor: count > 0 ? 'pointer' : 'default',
                        transition: 'all 0.15s ease',
                        outline: isHovered ? `2px solid ${P.purpleDeep}` : 'none',
                        outlineOffset: -1,
                        transform: isHovered ? 'scale(1.15)' : 'none',
                        zIndex: isHovered ? 2 : 1,
                        position: 'relative',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Hour markers */}
          <div style={{ display: 'flex', gap: 4, paddingLeft: 38, marginTop: 4 }}>
            {Array.from({ length: 24 }).map((_, hour) => (
              <span key={hour} style={{ flex: 1, fontSize: 9, color: P.textMuted, textAlign: 'center', fontWeight: 600 }}>
                {hour % 3 === 0 ? (hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`) : ''}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, justifyContent: 'flex-end', fontSize: 11, color: P.textMuted, flexWrap: 'wrap' }}>
        <span>Less active</span>
        {['#f3f4f6', '#c2e2d2', '#7ebca0', '#408066', '#234f3e'].map((col, i) => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: col }} />
        ))}
        <span>More active</span>
      </div>

      {hoverCell && hoverCell.count > 0 && (
        <div style={{
          position: 'absolute',
          top: Math.min(hoverCell.dow * 30, 140),
          left: `${((hoverCell.hour + 0.5) / 24) * 88 + 6}%`,
          transform: 'translate(-50%, -115%)',
          background: 'rgba(31,41,55,0.95)',
          backdropFilter: 'blur(8px)',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: 10,
          fontSize: 11.5,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          pointerEvents: 'none',
          zIndex: 20,
          whiteSpace: 'nowrap',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <strong>{dayNames[hoverCell.dow]}</strong> at <strong>{hoverCell.hour === 0 ? '12:00 AM' : hoverCell.hour < 12 ? `${hoverCell.hour}:00 AM` : hoverCell.hour === 12 ? '12:00 PM' : `${hoverCell.hour - 12}:00 PM`}</strong>
          <div style={{ marginTop: 2 }}><strong style={{ color: P.tealLight }}>{hoverCell.count}</strong> messages exchanged</div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ 9. SESSION INSIGHTS GRID (NO EMOJIS, CLEAN SAAS KPI TILES) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function SessionInsightsGrid({ items }: { items: { label: string; val: string | number; sub: string; color: string }[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const getIcon = (label: string, color: string) => {
    const l = label.toLowerCase();
    if (l.includes('session') || l.includes('total')) return <MessageSquare size={13} color={color} />;
    if (l.includes('lead')) return <Users size={13} color={color} />;
    if (l.includes('conv') || l.includes('rate') || l.includes('resolv')) return <Target size={13} color={color} />;
    if (l.includes('msg') || l.includes('avg') || l.includes('dur')) return <Bot size={13} color={color} />;
    if (l.includes('score') || l.includes('engag')) return <Activity size={13} color={color} />;
    if (l.includes('day') || l.includes('busy') || l.includes('time')) return <Calendar size={13} color={color} />;
    return <Zap size={13} color={color} />;
  };

  return (
    <div className="grid grid-cols-2 min-[900px]:grid-cols-3 gap-2.5 sm:gap-3 w-full flex-1">
      {items.map((item, i) => {
        const isHovered = hoverIdx === i;
        return (
          <div
            key={i}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{
              display: 'flex', flexDirection: 'column', gap: 4,
              padding: '10px 12px',
              background: isHovered ? P.purpleBg : '#FAFAF8',
              borderRadius: 14,
              border: `1px solid ${isHovered ? item.color + '66' : P.border}`,
              transition: 'all 0.18s ease',
              cursor: 'default',
              transform: isHovered ? 'translateY(-2px)' : 'none',
              boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
              <span style={{ fontSize: 10, color: P.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                background: `${item.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {getIcon(item.label, item.color)}
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: P.textDark, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {item.val}
            </div>
            <div style={{ fontSize: 10.5, color: P.textMuted, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// â”€â”€ 10. AWWWARDS-CALIBER BURN RATE CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function BurnRateCard({ burnRate, balanceCredits }: { burnRate: number; balanceCredits: number }) {
  const daysRemaining = burnRate > 0 ? Math.round(balanceCredits / burnRate) : null;
  const projectedMonthly = Math.round(burnRate * 30);
  // Bar = estimated 30d burn as a share of (balance + 30d burn) — not a hardcoded /10 scale.
  const burnBarWidth = balanceCredits + projectedMonthly > 0
    ? Math.min(Math.round((projectedMonthly / Math.max(balanceCredits + projectedMonthly, 1)) * 100), 100)
    : 0;
  const burnBarDisplay = Math.max(burnBarWidth, burnRate > 0 ? 8 : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: 14 }}>
      {/* Hero Glassmorphic Consumption Display */}
      <div style={{
        padding: '18px 20px',
        background: 'linear-gradient(135deg, #EAF8F8 0%, #E0F5F6 100%)',
        borderRadius: 18,
        border: `1px solid ${P.purpleLight}44`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 4px 16px -2px rgba(42,90,71,0.06)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: P.purpleDeep, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Daily Velocity
          </span>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 10.5, fontWeight: 700, color: P.purpleDeep,
            background: '#ffffff', padding: '3px 9px', borderRadius: 20,
            border: `1px solid ${P.purpleLight}33`, boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            Active
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 40, fontWeight: 900, color: P.purpleDeep, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {burnRate.toFixed(1)}
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: P.purple }}>credits / day</span>
        </div>

        {/* Visual Velocity Indicator Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ width: '100%', height: 6, borderRadius: 99, background: '#D9EDEE88', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              width: `${burnBarDisplay}%`,
              height: '100%',
              borderRadius: 99,
              background: `linear-gradient(90deg, ${P.purple}, #f59e0b)`,
              transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: P.textMuted, fontWeight: 500 }}>
            <span>0 cr</span>
            <span>Est. 30d: {projectedMonthly.toLocaleString()} cr</span>
          </div>
        </div>
      </div>

      {/* Runway and Projection Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ padding: '12px 14px', background: '#FAFAF8', borderRadius: 14, border: `1px solid ${P.border}`, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: P.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Est. Monthly</span>
          <strong style={{ fontSize: 15, color: P.textDark, fontWeight: 800 }}>{projectedMonthly.toLocaleString()} cr</strong>
        </div>
        <div style={{
          padding: '12px 14px',
          background: daysRemaining && daysRemaining < 14 ? '#FEF2F2' : P.purpleBg,
          borderRadius: 14,
          border: `1px solid ${daysRemaining && daysRemaining < 14 ? '#FECACA' : P.purpleLight + '33'}`,
          display: 'flex', flexDirection: 'column', gap: 3
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: daysRemaining && daysRemaining < 14 ? P.rose : P.purpleDeep, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Runway</span>
          <strong style={{ fontSize: 15, color: daysRemaining && daysRemaining < 14 ? P.rose : P.purpleDeep, fontWeight: 800 }}>
            {daysRemaining !== null ? `~${daysRemaining} days` : 'Healthy'}
          </strong>
        </div>
      </div>
    </div>
  );
}

// ── 11. CREDIT BALANCE DONUT (PERFECTED 2-ARC / MULTI-ARC DONUT) ─────────────
export function CreditBalanceDonut({
  usedCredits,
  balanceCredits,
}: {
  usedCredits: number;
  balanceCredits: number;
  tokensLabel?: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const safeUsed = Math.round(usedCredits || 0);
  const safeBalance = Math.round(balanceCredits || 0);
  const ringItems = [
    { label: 'Used This Period', shortLabel: 'Used Period', val: `${safeUsed.toLocaleString()} CR`, num: Math.max(safeUsed, 0), color: P.purpleDeep, idx: 0 },
    { label: 'Available Balance', shortLabel: 'Available Balance', val: `${safeBalance.toLocaleString()} CR`, num: Math.max(safeBalance, 0), color: P.purple, idx: 1 },
  ];
  const listItems = ringItems;

  const total = Math.max(safeUsed, 0) + Math.max(safeBalance, 0) || 1;

  const r = 63;
  const C = 2 * Math.PI * r;
  const strokeWidth = 11;
  const activeCount = ringItems.filter(it => it.num > 0).length;
  const gapSize = activeCount > 1 ? 6 : 0;

  let currentOffset = 0;
  const segments = ringItems.map((item) => {
    if (item.num === 0) return { ...item, dashArray: `0 ${C}`, dashOffset: 0, pct: 0 };
    const fraction = item.num / total;
    const len = Math.max(fraction * C - gapSize, 2);
    const seg = {
      ...item,
      dashArray: `${len} ${C}`,
      dashOffset: -currentOffset,
      pct: Math.round(fraction * 100),
    };
    currentOffset += fraction * C;
    return seg;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', flex: 1, justifyContent: 'space-between' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, width: 160 }}>
        <svg viewBox="0 0 160 160" style={{ width: 160, height: 160, overflow: 'visible' }}>
          <circle cx="80" cy="80" r={r} fill="none" stroke={P.purpleBg} strokeWidth={strokeWidth} />
          <g transform="rotate(-90 80 80)">
            {segments.map((seg) => (
              <circle
                key={seg.idx}
                cx="80" cy="80" r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={hoverIdx === seg.idx ? strokeWidth + 2.5 : strokeWidth}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="butt"
                style={{
                  transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                  cursor: 'pointer',
                  opacity: hoverIdx === null || hoverIdx === seg.idx ? 1 : 0.35,
                  filter: hoverIdx === seg.idx ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))' : 'none',
                }}
                onMouseEnter={() => setHoverIdx(seg.idx)}
                onMouseLeave={() => setHoverIdx(null)}
              />
            ))}
          </g>
        </svg>

        <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: 108, width: 108 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2.5 }}>
            <span style={{ fontSize: 21, fontWeight: 800, color: P.textDark, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {hoverIdx !== null && hoverIdx < 2 ? ringItems[hoverIdx]?.num.toLocaleString() : safeBalance.toLocaleString()}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: P.textMuted }}>
              CR
            </span>
          </div>
          <div style={{ fontSize: 8.5, color: P.textMuted, fontWeight: 700, marginTop: 3.5, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.2, maxWidth: 100 }}>
            {hoverIdx === 0 ? 'Used' : hoverIdx === 1 ? 'Available' : 'Available'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        {listItems.map((item) => (
          <div
            key={item.idx}
            onMouseEnter={() => setHoverIdx(item.idx < 2 ? item.idx : null)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '5px 8px', borderRadius: 8, cursor: item.idx < 2 ? 'pointer' : 'default',
              background: hoverIdx === item.idx ? P.purpleBg : 'transparent',
              transition: 'all 0.15s ease',
              opacity: hoverIdx === null || hoverIdx === item.idx || item.idx === 2 ? 1 : 0.5,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: hoverIdx === item.idx ? P.purpleDeep : P.textDark }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0,
                transition: 'transform 0.15s ease', transform: hoverIdx === item.idx ? 'scale(1.3)' : 'scale(1)'
              }} />
              {item.label}
            </span>
            <strong style={{ color: P.textDark, fontSize: 13, fontWeight: 700 }}>{item.val}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}