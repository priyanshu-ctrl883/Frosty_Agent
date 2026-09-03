"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
  Video,
  Users,
  Bell,
  Zap,
  Globe,
  Flame,
  ArrowRight,
  Check,
  Search,
  Headphones,
  Watch,
  Volume2,
  Camera,
  Bot,
  CalendarCheck,
  CalendarDays,
  UserCheck,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Activity,
  User as UserIcon,
  MessageCircle,
  CreditCard,
  PhoneCall,
  Radio,
  FileSpreadsheet,
  ShoppingBag,
  LifeBuoy,
  Mail,
  Layers,
  Receipt,
  BarChart3,
  Filter,
  RefreshCw,
  LayoutGrid,
  BookOpen,
  Building2,
  Inbox,
  ChevronRight,
  Settings as SettingsIcon,
  SlidersHorizontal,
  X,
  GripVertical,
  RotateCcw,
  Palette,
  Eye,
  PieChart as PieChartIcon,
  AlertTriangle,
} from "lucide-react";

import FrostyIcon from "./FrostyIcon";
import { FrostyAgentMark } from "./FrostyAgentMark";

/* ═══════════════════════════════════════════════════════════════════
   BRAND SVG LOGOS
   ═══════════════════════════════════════════════════════════════════ */
function GoogleCalendarLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="4" width="18" height="17" rx="3.5" fill="#4285F4" />
      <path d="M3 8.5H21" stroke="#FFF" strokeWidth="1.6" />
      <rect x="7" y="2" width="2" height="3.5" rx="1" fill="#EA4335" />
      <rect x="15" y="2" width="2" height="3.5" rx="1" fill="#EA4335" />
      <circle cx="7.5" cy="12.5" r="1.2" fill="#FFF" />
      <circle cx="12" cy="12.5" r="1.2" fill="#FBBC04" />
      <circle cx="16.5" cy="12.5" r="1.2" fill="#34A853" />
      <circle cx="7.5" cy="16.5" r="1.2" fill="#FFF" />
      <circle cx="12" cy="16.5" r="1.2" fill="#FFF" />
      <circle cx="16.5" cy="16.5" r="1.2" fill="#FFF" />
    </svg>
  );
}

function OutlookLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="4" width="18" height="16" rx="3" fill="#0078D4" />
      <path d="M3 8L12 14L21 8" stroke="#FFF" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.2" fill="#FFF" fillOpacity="0.25" />
    </svg>
  );
}

function GoogleMeetLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="2.5" y="5" width="13" height="14" rx="2.5" fill="#00AC47" />
      <path d="M15.5 9.5L21.5 5.5V18.5L15.5 14.5V9.5Z" fill="#00832D" />
      <circle cx="9" cy="12" r="2.2" fill="#FFF" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS & TOKENS
   ═══════════════════════════════════════════════════════════════════ */
const TEAL = "#0396A6";
const DARK = "#0F172A";
const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/* ═══════════════════════════════════════════════════════════════════
   BEAT DEFINITIONS
   Each beat has an array of phase durations (ms).
   The master timer advances phase within a beat, then advances beat.
   ═══════════════════════════════════════════════════════════════════ */
interface BeatDef {
  id: string;
  label: string;
  heading: string;
  frameGroup: "browser" | "whatsapp" | "splash" | "merchantConsole" | "meeting" | "transition" | "knowledge" | "dashboard" | "closing";
  phases: number[];
}

const BEATS: BeatDef[] = [
  /* Beat 0 */ { id: "website-opens", label: "WEBSITE AGENT", heading: "Your site, instantly intelligent", frameGroup: "browser", phases: [800, 1500, 500, 1700] },
  /* Beat 1 */ { id: "visitor-engages", label: "LIVE CHAT", heading: "Questions answered in real time", frameGroup: "browser", phases: [800, 600, 3500, 1200, 2500, 1200] },
  /* Beat 2 */ { id: "channel-switch", label: "WHATSAPP AGENT", heading: "Same thread, now on WhatsApp", frameGroup: "whatsapp", phases: [2200, 1600] },
  /* Beat 3 */ { id: "human-handoff", label: "HUMAN HANDOFF", heading: "A real person steps in", frameGroup: "whatsapp", phases: [3000, 1000, 1100, 1400, 1800, 1400, 1100] },
  /* Beat 4 */ { id: "handoff-splash", label: "SEAMLESS TRANSITION", heading: "Seamlessly transition from AI to Human", frameGroup: "splash", phases: [3000, 1000] },
  /* Beat 5 */ { id: "dashboard-takeover", label: "MERCHANT TAKEOVER", heading: "Priya confirms the meeting from the console", frameGroup: "merchantConsole", phases: [1600, 1400, 2800, 1200] },
  /* Beat 6 */ { id: "whatsapp-booking", label: "SLOT SELECTION", heading: "Pick time directly in WhatsApp", frameGroup: "whatsapp", phases: [800, 1000, 600, 1400, 1100] },
  /* Beat 7 */ { id: "meeting-confirmed", label: "MEETING LOCKED", heading: "Instant Google Meet & CRM sync", frameGroup: "meeting", phases: [3000, 800, 1500, 1800, 1400] },
  /* Beat 8 */ { id: "merchant-chaos", label: "TOO MANY TOOLS", heading: "Fragmented tools vs. One unified AI", frameGroup: "transition", phases: [2000, 3200, 1800, 450] },
  /* Beat 9 */ { id: "shared-brain", label: "SHARED MEMORY", heading: "One brain across website & WhatsApp", frameGroup: "knowledge", phases: [1800, 2600, 2200] },
  /* Beat 10 */ { id: "crm-dashboard", label: "MERCHANT INBOX", heading: "Unified multi-channel command", frameGroup: "dashboard", phases: [1600, 1400, 1400, 1500, 3000, 2400] },
  /* Beat 11 */ { id: "analytics", label: "ANALYTICS", heading: "Turn every conversation into actionable insights", frameGroup: "dashboard", phases: [2200, 2200, 3400, 2600, 4400] },
  /* Beat 12 */ { id: "closing-verdict", label: "THE CHOICE", heading: "Stay fragmented. Or scale with Frosty.", frameGroup: "closing", phases: [2400, 2600, 2600, 2400] },
];

const TOTAL_BEATS = BEATS.length;
const BEAT_DURATIONS = BEATS.map((b) => b.phases.reduce((a, c) => a + c, 0));

const TAGLINES = [
  "One agent. Every channel.",
  "Zero context lost.",
  "From chat to converted.",
  "See every lead. Act fast.",
];

/* Dashboard data — copied exactly from DashboardSection.tsx */
const DX_NAV = [["layers", "Overview"], ["plug", "Services"], ["doc", "Knowledge Base"], ["chart", "Analytics"], ["infinity", "Integrations"], ["bank", "Billing"], ["model", "Settings"]];
const DX_STATS: [string, string, string][] = [["CONVERSATIONS", "214", "sessions"], ["MESSAGES", "1,480", "exchanged"], ["LEADS", "96", "captured"], ["CONVERSION", "45%", "lead rate"], ["AVG/SESSION", "6.9", "messages"], ["PEAK HOUR", "7pm", "Tue busiest"]];
const DX_TOPICS: [string, number, string][] = [["Pricing", 11, TEAL], ["Delivery", 9, TEAL], ["Booking", 6, "#FFB09F"], ["Sizing", 6, "#2DD4BF"], ["Warranty", 5, "#5EEAD4"], ["Other", 3, "#99F6E4"]];
const DX_SESSIONS: [string, string, string, string][] = [["AM", "Arjun Mehta", "Bulk order — 50 units Sony WH-1000XM5", "03:42 PM"], ["4C", "Visitor #4c1a", "Do you deliver to Pune?", "02:59 PM"], ["9B", "Visitor #9be3", "What's in the package?", "01:06 PM"], ["2D", "Visitor #2dd8", "Can I speak to someone?", "11:30 AM"]];

/* ═══════════════════════════════════════════════════════════════════
   DYNAMIC SCHEDULING & LIVE CLOCK HELPER (11:00 AM – 7:00 PM Engine)
   ═══════════════════════════════════════════════════════════════════ */
export interface DynamicScheduleData {
  phoneClock: string;
  msgTime1: string;
  msgTime2: string;
  msgTime3: string;
  isTomorrow: boolean;
  targetDayLabel: string;
  dayTabs: { d: string; a: boolean }[];
  slots: {
    timeRange: string;
    sub: string;
    tag: string;
    isRecommended: boolean;
    shortLabel: string;
  }[];
  selectedSlot: {
    timeRange: string;
    shortLabel: string;
    meetLabel: string;
    userConfirmMsg: string;
    lockMsg: string;
    crmMeetingTag: string;
    crmSummary: string;
  };
}

function getDynamicSchedule(): DynamicScheduleData {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Format 12-hour clock for phone status bar e.g. "6:55"
  const clockH = hours % 12 || 12;
  const clockM = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const ampm = hours >= 12 ? "PM" : "AM";
  const phoneClock = `${clockH}:${clockM}`;
  const msgTime1 = `${clockH}:${clockM} ${ampm}`;

  // Sequential minutes for replies
  const m2 = (minutes + 1) % 60;
  const h2 = minutes + 1 >= 60 ? (hours + 1) % 24 : hours;
  const clockH2 = h2 % 12 || 12;
  const clockM2 = m2 < 10 ? `0${m2}` : `${m2}`;
  const ampm2 = h2 >= 12 ? "PM" : "AM";
  const msgTime2 = `${clockH2}:${clockM2} ${ampm2}`;

  const m3 = (minutes + 2) % 60;
  const h3 = minutes + 2 >= 60 ? (hours + 1) % 24 : hours;
  const clockH3 = h3 % 12 || 12;
  const clockM3 = m3 < 10 ? `0${m3}` : `${m3}`;
  const ampm3 = h3 >= 12 ? "PM" : "AM";
  const msgTime3 = `${clockH3}:${clockM3} ${ampm3}`;

  // Business hours logic: 11:00 AM - 7:00 PM IST
  // If current time is past 5:30 PM (17:30) or early morning before 10:00 AM, today's business slots are over.
  // Frosty intelligently offers Tomorrow's verified open slots!
  const isLate = hours > 17 || (hours === 17 && minutes >= 30) || hours < 10;
  const isTomorrow = isLate;
  const targetDayLabel = isTomorrow ? "Tomorrow" : "Today";

  // Day tabs computation matching the active day
  const prev = new Date(now);
  prev.setDate(now.getDate() - 1);
  const next = new Date(now);
  next.setDate(now.getDate() + 1);
  const next2 = new Date(now);
  next2.setDate(now.getDate() + 2);

  const fmtDay = (d: Date, label?: string) => {
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = d.getDate();
    return label ? `${weekday} ${dayNum} (${label})` : `${weekday} ${dayNum}`;
  };

  const dayTabs = isTomorrow
    ? [
      { d: fmtDay(now, "Today"), a: false },
      { d: fmtDay(next, "Tomorrow"), a: true },
      { d: fmtDay(next2), a: false },
    ]
    : [
      { d: fmtDay(prev), a: false },
      { d: fmtDay(now, "Today"), a: true },
      { d: fmtDay(next), a: false },
    ];

  let slots;
  let selectedSlot;

  if (!isTomorrow) {
    // Current time is during business day (before 5:30 PM)
    slots = [
      {
        timeRange: "03:00 PM – 03:30 PM IST",
        sub: "Available · 30m Video Call",
        tag: "Open",
        isRecommended: false,
        shortLabel: "Today · 3:00 PM",
      },
      {
        timeRange: "05:30 PM – 06:00 PM IST",
        sub: "Optimal Time · 0 Calendar Conflicts",
        tag: "RECOMMENDED",
        isRecommended: true,
        shortLabel: "Today · 5:30 PM",
      },
      {
        timeRange: "Tomorrow · 11:00 AM IST",
        sub: "Available · 30m Video Call",
        tag: "Open",
        isRecommended: false,
        shortLabel: "Tomorrow · 11:00 AM",
      },
    ];

    selectedSlot = {
      timeRange: "05:30 PM – 06:00 PM IST",
      shortLabel: "Today · 5:30 PM",
      meetLabel: "Today · 5:30 PM – 6:00 PM IST",
      userConfirmMsg: "Today at 5:30 PM works perfectly.",
      lockMsg: "Locking today at 5:30 PM on the calendar right now!",
      crmMeetingTag: "📅 Today 5:30 PM · Google Meet 🔗",
      crmSummary: "Calculated 14% bulk tier. Google Meet scheduled for today 5:30 PM for final contract.",
    };
  } else {
    // Current time is late evening (e.g. 6:55 PM) or night -> Offer tomorrow's slots
    slots = [
      {
        timeRange: "11:30 AM – 12:00 PM IST",
        sub: "Available · 30m Video Call",
        tag: "Open",
        isRecommended: false,
        shortLabel: "Tomorrow · 11:30 AM",
      },
      {
        timeRange: "03:30 PM – 04:00 PM IST",
        sub: "Optimal Time · 0 Calendar Conflicts",
        tag: "RECOMMENDED",
        isRecommended: true,
        shortLabel: "Tomorrow · 3:30 PM",
      },
      {
        timeRange: "05:30 PM – 06:00 PM IST",
        sub: "Available · 30m Video Call",
        tag: "Open",
        isRecommended: false,
        shortLabel: "Tomorrow · 5:30 PM",
      },
    ];

    selectedSlot = {
      timeRange: "03:30 PM – 04:00 PM IST",
      shortLabel: "Tomorrow · 3:30 PM",
      meetLabel: "Tomorrow · 3:30 PM – 4:00 PM IST",
      userConfirmMsg: "Tomorrow at 3:30 PM works perfectly.",
      lockMsg: "Locking tomorrow at 3:30 PM on the calendar right now!",
      crmMeetingTag: "📅 Tomorrow 3:30 PM · Google Meet 🔗",
      crmSummary: "Calculated 14% bulk tier. Google Meet scheduled for tomorrow 3:30 PM for final contract.",
    };
  }

  return {
    phoneClock,
    msgTime1,
    msgTime2,
    msgTime3,
    isTomorrow,
    targetDayLabel,
    dayTabs,
    slots,
    selectedSlot,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   SIMULATED CURSOR (Awwwards Grade)
   ═══════════════════════════════════════════════════════════════════ */
function SimCursor({ x, y, clicking, visible }: { x: number; y: number; clicking: boolean; visible: boolean }) {
  return (
    <motion.div
      animate={{ left: `${x}%`, top: `${y}%`, opacity: visible ? 1 : 0 }}
      transition={{
        left: { duration: 0.72, ease: [0.16, 1, 0.3, 1] },
        top: { duration: 0.72, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.18 },
      }}
      style={{
        position: "absolute",
        zIndex: 250,
        pointerEvents: "none",
        width: 24,
        height: 24,
        transform: "translate(-3px, -2px)",
        filter: "drop-shadow(0 4px 10px rgba(15, 23, 42, 0.35))",
      }}
    >
      <motion.svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        animate={{
          scale: clicking ? 0.8 : 1,
          rotate: clicking ? -4 : 0,
        }}
        transition={{ type: "spring", stiffness: 600, damping: 28 }}
      >
        {/* Sleek Dark Pointer with Crisp White Border */}
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L5.85 2.36a.5.5 0 0 0-.35.85z"
          fill="#0F172A"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </motion.svg>

      {/* Dual Click Ripple Waves */}
      <AnimatePresence>
        {clicking && (
          <>
            <motion.div
              key="ripple-1"
              initial={{ scale: 0.2, opacity: 0.8 }}
              animate={{ scale: 2.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: 1,
                left: 1,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "rgba(3, 150, 166, 0.55)",
              }}
            />
            <motion.div
              key="ripple-2"
              initial={{ scale: 0.2, opacity: 0.6 }}
              animate={{ scale: 3.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
              style={{
                position: "absolute",
                top: 1,
                left: 1,
                width: 12,
                height: 12,
                borderRadius: "50%",
                border: "1.5px solid rgba(45, 212, 191, 0.7)",
              }}
            />
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


function getCursorState(beat: number, phase: number): { x: number; y: number; clicking: boolean; visible: boolean } {
  if (beat === 0) {
    if (phase <= 0) return { x: 50, y: 50, clicking: false, visible: false };
    if (phase === 1) return { x: 42, y: 5.5, clicking: true, visible: true };
    if (phase === 2) return { x: 42, y: 5.5, clicking: false, visible: true };
    return { x: 50, y: 50, clicking: false, visible: false };
  }
  if (beat === 1) {
    if (phase === 0) return { x: 93, y: 92, clicking: false, visible: true };
    if (phase === 1) return { x: 93, y: 92, clicking: true, visible: true }; // clicks Frosty agent widget
    if (phase === 2) return { x: 76, y: 92, clicking: true, visible: true }; // types user question
    if (phase === 3) return { x: 76, y: 80, clicking: false, visible: true }; // thinking
    if (phase === 4) return { x: 70, y: 67.5, clicking: false, visible: true }; // hovers right on green CTA button
    // Phase 5: Clicks the green CTA button before transitioning!
    return { x: 70, y: 67.5, clicking: true, visible: true };
  }
  // Beat 2: Cinematic WhatsApp Agent (Lockscreen swipe & action card interaction)
  if (beat === 2) {
    if (phase === 1) return { x: 74, y: 36, clicking: true, visible: true }; // Swipe lockscreen notification upward
    if (phase === 4) return { x: 70, y: 78, clicking: true, visible: true }; // Tap [View plan]
    return { x: 50, y: 50, clicking: false, visible: false };
  }
  // Beat 5: Merchant Console Takeover (cursor managed locally inside the component)
  if (beat === 5) {
    return { x: 50, y: 50, clicking: false, visible: false };
  }
  // Beat 6: Selecting 5:30 PM slot in WhatsApp
  if (beat === 6) {
    if (phase === 0) return { x: 74, y: 73, clicking: false, visible: true };
    if (phase === 1) return { x: 74, y: 73, clicking: false, visible: true }; // Hover on 5:30 PM slot
    if (phase === 2) return { x: 74, y: 73, clicking: true, visible: true }; // Clicks 5:30 PM slot!
    return { x: 74, y: 73, clicking: false, visible: false };
  }
  // Beat 8: Shifting / dragging the scattered whiteboard canvas
  if (beat === 8) {
    if (phase === 1) return { x: 52, y: 56, clicking: true, visible: true }; // Dragging canvas to reveal right tools
    return { x: 50, y: 50, clicking: false, visible: false };
  }
  // Beats 10, 11, 12: Managed by local precision-synced cursor in respective beats
  if (beat >= 10) {
    return { x: 50, y: 50, clicking: false, visible: false };
  }
  return { x: 50, y: 50, clicking: false, visible: false };
}

/* ═══════════════════════════════════════════════════════════════════
   SMALL REUSABLE COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 3.5, padding: "7px 12px" }}>
      {[0, 1, 2].map((i) => (
        <motion.div key={i} animate={{ y: [0, -3, 0] }} transition={{ duration: 0.45, repeat: Infinity, delay: i * 0.12 }} style={{ width: 5, height: 5, borderRadius: "50%", background: "#94A3B8" }} />
      ))}
    </div>
  );
}

function useTypingText(text: string, active: boolean, speed = 40): string {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!active) { setTyped(""); return; }
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTyped(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, speed + Math.random() * 15);
    return () => clearInterval(iv);
  }, [text, active, speed]);
  return typed;
}

function ChatBubble({ children, side, variant = "ai", delay = 0, style: s }: {
  children: React.ReactNode; side: "left" | "right"; variant?: "ai" | "human" | "user"; delay?: number; style?: React.CSSProperties;
}) {
  const isL = side === "left";
  const bg: Record<string, string> = { ai: "#F1F5F9", human: "#E0F2FE", user: TEAL };
  const fg: Record<string, string> = { ai: "#1E293B", human: "#0C4A6E", user: "#FFF" };
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.3, delay, ease: EASE }}
      style={{ alignSelf: isL ? "flex-start" : "flex-end", maxWidth: "85%", padding: "7px 11px", borderRadius: isL ? "11px 11px 11px 3px" : "11px 11px 3px 11px", background: bg[variant], color: fg[variant], fontSize: 9.5, lineHeight: 1.45, fontWeight: 500, position: "relative", border: variant === "human" ? "1px solid #BAE6FD" : "none", ...s }}>
      {variant === "human" && <span style={{ position: "absolute", top: -7, left: 8, fontSize: 7, fontWeight: 700, color: "#0284C7", background: "#E0F2FE", padding: "1px 5px", borderRadius: 3, border: "1px solid #BAE6FD" }}>Human</span>}
      {children}
    </motion.div>
  );
}

function CountUp({ target, suffix = "", durationMs = 800 }: { target: number; suffix?: string; durationMs?: number }) {
  const [value, setValue] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / durationMs, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, durationMs]);
  return <>{value.toLocaleString()}{suffix}</>;
}

/* Dashboard Icon — copied from DashboardSection.tsx with strict inline dimensions */
function DxIcon({ n, size = 12 }: { n: string; size?: number }) {
  const p: Record<string, React.ReactNode> = {
    layers: <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" />,
    plug: <path d="M9 3v6M15 3v6M7 9h10v3a5 5 0 01-10 0V9zM12 17v4" />,
    doc: <path d="M7 3h7l4 4v14H7V3zM14 3v4h4M9 12h7M9 16h7" />,
    chart: <path d="M4 20V4M4 20h16M8 16l3-4 3 2 4-6" />,
    infinity: <path d="M6 9a3 3 0 100 6c2 0 3-2 6-3s4-3 6-3a3 3 0 110 6c-2 0-3-2-6-3S8 9 6 9z" />,
    bank: <path d="M3.4 9.6L12 4.8l8.6 4.8M5.6 10.4v7.8M9.8 10.4v7.8M14.2 10.4v7.8M18.4 10.4v7.8M3 19.4h18" />,
    model: <path d="M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v10M7 12h10M8.5 8.5l7 7M15.5 8.5l-7 7" />,
  };
  return (
    <svg
      style={{ width: size, height: size, minWidth: size, minHeight: size, flexShrink: 0, display: "inline-block" }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {p[n]}
    </svg>
  );
}
/* ═══════════════════════════════════════════════════════════════════
   KINETIC TYPOGRAPHY SYSTEM
   Silky word-by-word masked de-blur with spring physics
   ═══════════════════════════════════════════════════════════════════ */
function KineticBadge({
  icon,
  text,
  variant = "success",
  delay = 0.05,
}: {
  icon?: React.ReactNode;
  text: string;
  variant?: "error" | "success" | "teal" | "cyan" | "amber";
  delay?: number;
}) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    error: { bg: "rgba(254,226,226,0.7)", color: "#DC2626", border: "rgba(239,68,68,0.25)" },
    success: { bg: "rgba(220,252,231,0.7)", color: "#166534", border: "rgba(34,197,94,0.3)" },
    teal: { bg: "rgba(204,251,241,0.7)", color: "#0F766E", border: "rgba(20,184,166,0.3)" },
    cyan: { bg: "rgba(224,242,254,0.7)", color: "#0369A1", border: "rgba(14,165,233,0.3)" },
    amber: { bg: "rgba(254,243,199,0.7)", color: "#B45309", border: "rgba(245,158,11,0.3)" },
  };
  const theme = (styles[variant ?? "success"] ?? styles.success)!;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12, filter: "blur(6px)", scale: 0.94 }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)", scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.02em",
        color: theme.color,
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        padding: "3px 10px",
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        width: "fit-content",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      {icon && <span style={{ fontSize: 11, fontWeight: 900 }}>{icon}</span>}
      <span>{text}</span>
    </motion.div>
  );
}

interface KineticWordItem {
  text: string;
  highlight?: boolean;
  number?: boolean;
  breakAfter?: boolean;
}

function KineticWordHeadline({
  words,
  highlightColor = TEAL,
  delay = 0.15,
  fontSize = "clamp(20px, 2.4vw, 26px)",
  centered = false,
}: {
  words: (string | KineticWordItem)[];
  highlightColor?: string;
  delay?: number;
  fontSize?: string | number;
  centered?: boolean;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.042,
            delayChildren: delay,
          },
        },
      }}
      style={{
        fontSize,
        fontWeight: 800,
        color: DARK,
        lineHeight: 1.16,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
        flexWrap: "wrap",
        rowGap: 2,
        columnGap: 5.5,
        alignItems: "baseline",
        justifyContent: centered ? "center" : "flex-start",
      }}
    >
      {words.map((w, idx) => {
        const isObj = typeof w === "object";
        const text = isObj ? w.text : w;
        const isHigh = isObj && w.highlight;
        const isNum = isObj && w.number;
        const breakAfter = isObj && w.breakAfter;

        return (
          <React.Fragment key={idx}>
            <span
              style={{
                display: "inline-block",
                overflow: "hidden",
                paddingBottom: 2,
                verticalAlign: "bottom",
              }}
            >
              <motion.span
                variants={{
                  hidden: {
                    opacity: 0,
                    y: 22,
                    filter: "blur(8px)",
                    scale: 0.94,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    scale: 1,
                    transition: {
                      duration: 0.55,
                      ease: [0.16, 1, 0.3, 1],
                    },
                  },
                }}
                style={{
                  display: "inline-block",
                  color: isHigh ? highlightColor : isNum ? TEAL : "inherit",
                  fontFamily: isNum ? "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" : undefined,
                  fontWeight: 800,
                }}
              >
                {text}
              </motion.span>
            </span>
            {breakAfter && <div style={{ width: "100%", height: 0, flexBasis: "100%" }} />}
          </React.Fragment>
        );
      })}
    </motion.div>
  );
}

function KineticDescription({
  text,
  delay = 0.32,
}: {
  text: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ fontSize: 10.5, color: "#64748B", lineHeight: 1.45 }}
    >
      {text}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONTENT GROUP: BROWSER (Beats 0–1)
   Website opens → visitor engages chat → CTA appears
   ═══════════════════════════════════════════════════════════════════ */
function BrowserGroupContent({ beat, phase }: { beat: number; phase: number }) {
  const siteVisible = beat > 0 || phase >= 1;
  const chatOpen = beat >= 1 && phase >= 1;
  const urlText = useTypingText("www.techmart.in", beat === 0 && phase >= 1);
  const questionText = useTypingText("I want sony silver headphone, can you update me on whatsapp +91 12345XXXXX", beat === 1 && phase >= 2);
  const showTypingDots = beat === 1 && phase === 3;
  const showReply = beat === 1 && phase >= 4;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* ── Browser Chrome ── */}
      {/* Tab bar */}
      <div style={{ background: "#DFE1E5", padding: "8px 12px 0", display: "flex", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: 6, paddingBottom: 10, paddingLeft: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F56", border: "0.5px solid #E0443E" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E", border: "0.5px solid #DEA123" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27C93F", border: "0.5px solid #1AAB29" }} />
        </div>
        {/* Active Tab */}
        <div style={{ background: "#FFF", borderRadius: "8px 8px 0 0", padding: "6px 16px", fontSize: 9.5, fontWeight: 400, color: "#333", display: "flex", alignItems: "center", gap: 8, zIndex: 1, boxShadow: "0 -1px 4px rgba(0,0,0,0.04)", minWidth: 160, position: "relative" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Globe style={{ width: 9, height: 9, color: "#64748B" }} />
          </div>
          <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 140 }}>
            {siteVisible ? "TechMart — Electronics & Audio Gear" : "New Tab"}
          </span>
          <X style={{ width: 10, height: 10, color: "#94A3B8", marginLeft: "auto" }} />
        </div>
      </div>
      {/* Address bar area */}
      <div style={{ background: "#FFF", borderBottom: "1px solid #DADCE0", padding: "6px 12px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {/* Nav controls */}
        <div style={{ display: "flex", gap: 10, color: "#5F6368" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DADCE0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          <RotateCcw style={{ width: 12, height: 12, strokeWidth: 2.5 }} />
        </div>
        {/* URL Input */}
        <div style={{ flex: 1, background: "#F1F3F4", borderRadius: 999, padding: "5px 14px", fontSize: 10, color: "#202124", display: "flex", alignItems: "center", gap: 8, border: beat === 0 && phase === 1 ? `1.5px solid ${TEAL}` : "1px solid transparent", transition: "all 0.2s" }}>
          {siteVisible ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#5F6368"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" /></svg>
          ) : (
            <Search style={{ width: 10, height: 10, color: "#5F6368" }} />
          )}
          <span style={{ fontWeight: 400, fontSize: 10, flex: 1 }}>{urlText || (siteVisible ? "techmart.in" : "")}</span>
          {beat === 0 && phase === 1 && urlText.length < 15 && (
            <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.45, repeat: Infinity }} style={{ width: 1.5, height: 11, background: TEAL, marginLeft: 1 }} />
          )}
          {siteVisible && <span style={{ color: "#5F6368" }}>☆</span>}
        </div>
      </div>


      {/* ── Viewport ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#FAFAFA", display: "flex", flexDirection: "column" }}>
        {/* Loading */}
        {!siteVisible && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, zIndex: 5, background: "#FAFAFA" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }} style={{ width: 18, height: 18, border: `2.5px solid ${TEAL}20`, borderTop: `2.5px solid ${TEAL}`, borderRadius: "50%" }} />
            <span style={{ fontSize: 9.5, color: "#94A3B8", fontWeight: 500, fontFamily: "system-ui, sans-serif" }}>Loading…</span>
          </div>
        )}

        {/* Faux TechMart-style website */}
        {siteVisible && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", overflow: "hidden", background: "#F5F5F5" }}>

            {/* ── TechMart Nav ── */}
            <div style={{ background: "#FFFFFF", padding: "10px 16px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0, borderBottom: "1px solid #F1F5F9" }}>
              {/* Logo */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                <div style={{ width: 22, height: 22, background: "#0F172A", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap style={{ width: 12, height: 12, color: "#38BDF8", fill: "#38BDF8" }} />
                </div>
                <span style={{ color: "#0F172A", fontWeight: 900, fontSize: 13, letterSpacing: "-0.4px" }}>TechMart</span>
              </div>
              {/* Modern Search */}
              <div style={{ flex: 1, maxWidth: 300, margin: "0 auto", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 999, display: "flex", alignItems: "center", padding: "6px 12px", gap: 8, boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)" }}>
                <Search style={{ width: 11, height: 11, color: "#94A3B8" }} />
                <span style={{ fontSize: 9.5, color: "#94A3B8", fontWeight: 500 }}>Search for anything...</span>
              </div>
              {/* Icons (Account, Cart) */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, color: "#475569" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <UserIcon style={{ width: 14, height: 14 }} />
                  <span style={{ fontSize: 6.5, fontWeight: 600 }}>Sign In</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, position: "relative" }}>
                  <ShoppingBag style={{ width: 14, height: 14 }} />
                  <span style={{ fontSize: 6.5, fontWeight: 600 }}>Cart</span>
                  <span style={{ position: "absolute", top: -4, right: -4, background: "#EF4444", color: "#FFF", fontSize: 6, fontWeight: 800, width: 12, height: 12, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #FFF" }}>2</span>
                </div>
              </div>
            </div>



            {/* ── Product Grid ── */}
            <div style={{ flex: 1, padding: "8px 8px 6px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, overflow: "hidden" }}>
              {[
                { n: "Sony WH-1000XM5", p: "₹24,990", mrp: "₹29,999", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80", badge: "Sale", badgeCol: "#FEE2E2", badgeText: "#EF4444", rating: "4.9", reviews: "2.8k" },
                { n: "Galaxy Watch Ultra", p: "₹44,999", mrp: "₹49,999", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80", badge: "New", badgeCol: "#DCFCE7", badgeText: "#22C55E", rating: "4.7", reviews: "1.2k" },
                { n: "Marshall Stanmore", p: "₹39,999", mrp: "₹44,999", img: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&auto=format&fit=crop&q=80", badge: "Hot", badgeCol: "#FFEDD5", badgeText: "#F97316", rating: "4.8", reviews: "950" },
                { n: "Canon EOS R6 Mark II", p: "₹1,69,990", mrp: "₹1,85,000", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80", badge: "Pro", badgeCol: "#F3E8FF", badgeText: "#A855F7", rating: "4.9", reviews: "410" },
              ].map((prod) => (
                <div key={prod.n} style={{ background: "#FFF", borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)" }}>
                  {/* Image block */}
                  <div style={{ position: "relative", flex: 1, minHeight: 0, overflow: "hidden", background: "#F8FAFC" }}>
                    <img src={prod.img} alt={prod.n} loading="eager" style={{ width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "multiply" }} />
                  </div>
                  {/* Info block */}
                  <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <span style={{ color: "#FACC15", fontSize: 8 }}>★</span>
                      <span style={{ fontSize: 7.5, fontWeight: 700, color: "#475569" }}>{prod.rating}</span>
                      <span style={{ fontSize: 7.5, color: "#94A3B8" }}>({prod.reviews})</span>
                    </div>
                    <span style={{ fontSize: 8, fontWeight: 600, color: "#1E293B", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{prod.n}</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#0F172A" }}>{prod.p}</span>
                      <span style={{ fontSize: 7.5, color: "#94A3B8", textDecoration: "line-through" }}>{prod.mrp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Frosty widget button */}
        {siteVisible && !chatOpen && (
          <motion.div
            style={{ position: "absolute", bottom: 12, right: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 95 }}>
            <img src="/logo-small.png" alt="Chat" style={{ width: 44, height: 44, objectFit: "contain" }} />
          </motion.div>
        )}

        {/* Chat overlay */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div key="chat" initial={{ opacity: 0, scale: 0.75, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 15 }} transition={{ duration: 0.4, ease: EASE }}
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
                width: 285,
                height: 335,
                borderRadius: 14,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                zIndex: 90,
                background: "rgba(255,255,255,0.98)",
                backdropFilter: "blur(20px)",
                border: `1px solid ${TEAL}25`,
                boxShadow: `0 20px 50px ${TEAL}22, 0 6px 20px rgba(0,0,0,0.08)`,
              }}>
              {/* Chat header */}
              <div style={{ background: "#DFE1E5", color: "#1E293B", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src="/logo-small.png" alt="Frosty Agent" style={{ width: 25, height: 25, objectFit: "contain" }} />
                </div>
                <span>Frosty Agent</span>
                <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 8, color: "#059669", fontWeight: 700 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981" }} /> Online
                </span>
              </div>
              {/* Chat body */}
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, flex: 1, overflowY: "auto" }}>
                <ChatBubble side="left" variant="ai" style={{ fontSize: 10.5, padding: "8px 12px" }}>Hi! Ask me anything about our products!</ChatBubble>

                {questionText && (
                  <ChatBubble side="right" variant="user" style={{ fontSize: 10.5, padding: "8px 12px" }}>{questionText}</ChatBubble>
                )}

                {showTypingDots && <TypingDots />}

                {showReply && (
                  <ChatBubble side="left" variant="ai" delay={0} style={{ fontSize: 10.5, padding: "8px 12px" }}>
                    <div>sure, yes its in stock. You can further continue from whatsapp on you number 1234XXXXX</div>
                  </ChatBubble>
                )}
              </div>
              {/* Input bar */}
              <div style={{ padding: "9px 12px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, background: "#FAFAFA" }}>
                <div style={{ flex: 1, background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 7, padding: "6px 10px", fontSize: 9.5, color: "#94A3B8" }}>Ask Frosty…</div>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BEAT 2: WHATSAPP AGENT (Cinematic 8-Scene Storytelling Experience)
   Lockscreen Notification ➔ Swipe to Open ➔ Live Conversation ➔
   AI Intent Recognition ➔ Recommended Plan Card ➔ Lead Qualification ➔
   Ecosystem Zoom-Out Graph ➔ Outcome Banner
   ═══════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════
   BEAT 2: WHATSAPP AGENT (Cinematic Notification ➔ Swipe to Open)
   Centered OLED Smartphone ➔ Notification drops in ➔ Swipe up unlocks
   ═══════════════════════════════════════════════════════════════════ */
function WhatsAppAgentBeat({ phase }: { phase: number }) {
  // Touch Swipe Gesture for Phase 1
  const [swipeProgress, setSwipeProgress] = useState(0);
  useEffect(() => {
    if (phase === 1) {
      const t1 = setTimeout(() => setSwipeProgress(1), 300);
      return () => clearTimeout(t1);
    } else if (phase === 0) {
      setSwipeProgress(0);
    }
  }, [phase]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "14px 24px",
        background: "#FFFFFF",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── CENTERED: Hyper-Realistic WhatsApp Smartphone Device Frame ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{
          width: 250,
          height: 472,
          borderRadius: 36,
          border: "6px solid #1E293B",
          background: "#1E293B",
          boxShadow: "0 28px 70px -10px rgba(0,0,0,0.35), 0 10px 22px -5px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          flexShrink: 0,
          overflow: "hidden",
          zIndex: 20,
        }}
      >
        {/* Physical Side Buttons */}
        <div style={{ position: "absolute", right: -7, top: 95, width: 2.5, height: 42, background: "#334155", borderRadius: "0 2px 2px 0" }} />
        <div style={{ position: "absolute", right: -7, top: 148, width: 2.5, height: 26, background: "#334155", borderRadius: "0 2px 2px 0" }} />

        {/* Device Screen Glass Container */}
        <div
          style={{
            flex: 1,
            borderRadius: 28,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            background: "#070A13",
            position: "relative",
          }}
        >
          {/* Status Bar */}
          <div
            style={{
              background: "transparent",
              color: "#FFF",
              padding: "6px 14px 4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 8.5,
              fontWeight: 700,
              flexShrink: 0,
              zIndex: 30,
            }}
          >
            <span>10:04</span>
            <div style={{ display: "flex", alignItems: "center", gap: 3.5 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 7 }}>
                <div style={{ width: 1.5, height: 2.5, background: "#FFF", borderRadius: 0.5 }} />
                <div style={{ width: 1.5, height: 4, background: "#FFF", borderRadius: 0.5 }} />
                <div style={{ width: 1.5, height: 5.5, background: "#FFF", borderRadius: 0.5 }} />
                <div style={{ width: 1.5, height: 7, background: "#FFF", borderRadius: 0.5 }} />
              </div>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="#FFF"><path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4z" /></svg>
              <div style={{ width: 14, height: 7, border: "1px solid #FFF", borderRadius: 2, padding: 0.5, display: "flex", alignItems: "center" }}>
                <div style={{ width: "90%", height: "100%", background: "#34D399", borderRadius: 1 }} />
              </div>
            </div>
          </div>

          {/* ── OLED LOCKSCREEN WITH INCOMING NOTIFICATION & SWIPE GESTURE ── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              paddingTop: 36,
              paddingLeft: 12,
              paddingRight: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 22,
              background: "radial-gradient(ellipse at 50% 20%, #0D1C2E 0%, #050811 80%)",
              zIndex: 25,
            }}
          >
            {/* Lock Icon & Time */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 3 }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em", lineHeight: 1 }}>10:04</div>
              <div style={{ fontSize: 7, color: "#94A3B8", fontWeight: 600, marginTop: 2 }}>Tuesday, September 1</div>
            </div>

            {/* Incoming WhatsApp Notification Card with Slide-Down & Bounce */}
            <motion.div
              initial={{ opacity: 0, y: -60, scale: 0.88 }}
              animate={{
                opacity: swipeProgress === 1 ? 0 : 1,
                y: swipeProgress === 1 ? -50 : 0,
                scale: swipeProgress === 1 ? 0.92 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 360,
                damping: 22,
                delay: phase === 0 ? 0.1 : 0,
              }}
              style={{
                width: "100%",
                background: "rgba(30, 41, 59, 0.78)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 14,
                padding: "9px 11px",
                boxShadow: "0 16px 36px rgba(0, 0, 0, 0.5), 0 0 22px rgba(37, 211, 102, 0.25)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Glowing perimeter sheen */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(37,211,102,0.15) 0%, transparent 60%)", pointerEvents: "none" }} />

              {/* Notification Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 15, height: 15, borderRadius: 4, background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", boxShadow: "0 2px 6px rgba(37,211,102,0.4)" }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="#FFF"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" /></svg>
                  </div>
                  <span style={{ fontSize: 7.5, fontWeight: 850, color: "#F1F5F9", letterSpacing: "0.03em" }}>WHATSAPP</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3.5 }}>
                  {/* Pulsing soundwave audio ping bars */}
                  <motion.div animate={{ height: [3, 8, 3] }} transition={{ duration: 0.75, repeat: Infinity }} style={{ width: 1.5, background: "#25D366", borderRadius: 1 }} />
                  <motion.div animate={{ height: [5, 10, 5] }} transition={{ duration: 0.75, repeat: Infinity, delay: 0.2 }} style={{ width: 1.5, background: "#25D366", borderRadius: 1 }} />
                  <span style={{ fontSize: 6.5, color: "#94A3B8" }}>now</span>
                </div>
              </div>

              {/* Notification Message Content */}
              <div>
                <div style={{ fontSize: 8.8, fontWeight: 800, color: "#FFFFFF" }}>New message · Frosty Agent</div>
                <div style={{ fontSize: 8, color: "#CBD5E1", marginTop: 2, lineHeight: 1.3 }}>
                  “Hi, I wanted to know more about your pricing.”
                </div>
              </div>
            </motion.div>

            {/* Swipe to Open Cue & Finger Swipe Gesture */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative" }}>
              <motion.div
                animate={{ y: [0, -3, 0], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 99,
                  padding: "3px 11px",
                  fontSize: 7,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span>Swipe up to open</span>
                <span>↑</span>
              </motion.div>

              {/* Animated Finger Swipe Gesture in Phase 1 */}
              {phase === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -45 }}
                  transition={{ duration: 1.1, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    bottom: 25,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.45)",
                    border: "2px solid #FFFFFF",
                    boxShadow: "0 0 14px rgba(255,255,255,0.7)",
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Home Bar */}
              <div style={{ width: 65, height: 2.5, background: "rgba(255,255,255,0.4)", borderRadius: 99 }} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   WHATSAPP CONVERSATION (Beats 3 & 5)
   Priya Human Handoff & Interactive Slot Booking
   ═══════════════════════════════════════════════════════════════════ */
function WhatsAppConversationBeat({ beat, phase }: { beat: number; phase: number }) {
  const b3 = beat === 3;
  const b5 = beat === 6;

  const sched = useMemo(() => getDynamicSchedule(), []);

  const showWAThread = true;
  const showNewReply = b3 || b5;
  const showComplexQ = (b3 && phase >= 1) || b5;
  const showHandoff = (b3 && phase >= 2) || b5;
  const showHumanReply = (b3 && phase >= 3) || b5;
  const showUserCounterQ = (b3 && phase >= 4) || b5;
  const showPriyaCallReply = (b3 && phase >= 5) || b5;
  const showCalendarScan = (b3 && phase >= 6) || (b5 && phase >= 0);

  // In Beat 5 (WhatsApp slot booking):
  const showSlotOptions = b5 && phase >= 0;
  const slotSelected = b5 && phase >= 2;
  const showUserConfirmedMsg = b5 && phase >= 2;
  const showPriyaLockingMsg = b5 && phase >= 3;

  /* Step-by-step kinetic reveal based on phase */
  const showB3Solution = b3 && phase >= 1;
  const showB5Solution = b5 && phase >= 1;

  /* Auto-scroll container */
  const chatScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [phase, beat]);

  return (
    <div style={{
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "14px 24px",
      background: "#FFFFFF",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* ── SPLASH SCREEN OVERLAY ── */}
      <AnimatePresence mode="wait">
        {phase === 0 && b3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "absolute",
              inset: 0,
              background: "#FFFFFF",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: 40,
            }}
          >
            {b3 ? (
              <motion.div
                key="text-human-handoff"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: 500 }}
              >
                <KineticWordHeadline
                  delay={0.15}
                  fontSize="clamp(32px, 4.5vw, 44px)"
                  centered={true}
                  words={[
                    { text: "Chat" },
                    // { text: "Human" },
                    { text: "Continues", breakAfter: true },
                    { text: "On", highlight: true },
                    { text: "Whatsapp", highlight: true },
                  ]}
                />
                <div style={{ marginTop: 8 }}>
                  <KineticDescription
                    delay={0.32}
                    text="When custom volume pricing is negotiated, Frosty loops in your sales executive with live calendar scheduling."
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="text-whatsapp-slot"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: 500 }}
              >
                <KineticWordHeadline
                  delay={0.15}
                  fontSize="clamp(32px, 4.5vw, 44px)"
                  centered={true}
                  words={[
                    { text: "1-Tap" },
                    { text: "WhatsApp" },
                    { text: "Booking.", breakAfter: true },
                    { text: "Locks", highlight: true },
                    { text: "executive", highlight: true },
                    { text: "slots", highlight: true },
                    { text: "without", highlight: true },
                    { text: "leaving", highlight: true },
                    { text: "chat.", highlight: true },
                  ]}
                />
                <div style={{ marginTop: 8 }}>
                  <KineticDescription
                    delay={0.32}
                    text="Buyers pick their preferred meeting time directly in WhatsApp with zero friction."
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HYPER-REALISTIC WHATSAPP SMARTPHONE DEVICE FRAME ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: (b3 && phase === 0) ? 0 : 1, scale: (b3 && phase === 0) ? 0.94 : 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{
          width: 250,
          height: 472,
          borderRadius: 36,
          border: "6px solid #1E293B",
          background: "#1E293B",
          boxShadow: "0 28px 70px -10px rgba(0,0,0,0.35), 0 10px 22px -5px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {/* Physical Side Buttons */}
        <div style={{ position: "absolute", right: -7, top: 95, width: 2.5, height: 42, background: "#334155", borderRadius: "0 2px 2px 0" }} />
        <div style={{ position: "absolute", right: -7, top: 148, width: 2.5, height: 26, background: "#334155", borderRadius: "0 2px 2px 0" }} />

        {/* Device Screen Glass Container */}
        <div style={{ flex: 1, borderRadius: 28, overflow: "hidden", display: "flex", flexDirection: "column", background: "#ECE5DD", position: "relative" }}>
          {/* Status Bar (Clean & Seamless) */}
          <div style={{ background: "#075E54", color: "#FFF", padding: "5px 12px 3px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 8.5, fontWeight: 700, flexShrink: 0 }}>
            <span style={{ fontSize: 8.5 }}>{sched.phoneClock}</span>
            {/* Status Icons */}
            <div style={{ display: "flex", alignItems: "center", gap: 3.5, fontSize: 8 }}>
              {/* Signal Bars */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 7 }}>
                <div style={{ width: 1.5, height: 2.5, background: "#FFF", borderRadius: 0.5 }} />
                <div style={{ width: 1.5, height: 4, background: "#FFF", borderRadius: 0.5 }} />
                <div style={{ width: 1.5, height: 5.5, background: "#FFF", borderRadius: 0.5 }} />
                <div style={{ width: 1.5, height: 7, background: "#FFF", borderRadius: 0.5 }} />
              </div>
              {/* Wifi */}
              <svg width="9" height="9" viewBox="0 0 24 24" fill="#FFF"><path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4z" /></svg>
              {/* Battery */}
              <div style={{ width: 14, height: 7, border: "1px solid #FFF", borderRadius: 2, padding: 0.5, display: "flex", alignItems: "center" }}>
                <div style={{ width: "85%", height: "100%", background: "#34D399", borderRadius: 1 }} />
              </div>
            </div>
          </div>

          {/* WhatsApp Official App Header (Matching Reference Image) */}
          <div style={{ background: "#075E54", color: "#FFF", padding: "5px 10px 6px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
            {/* Back Arrow */}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, cursor: "pointer" }}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {/* Frosty Logo with white circular background */}
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#DFE1E5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <img src="/logo-small.png" alt="Frosty Agent" style={{ width: 24, height: 24, objectFit: "contain" }} />
            </div>
            {/* Contact Name & Status */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3.5 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Frosty Agent</span>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="#38BDF8" style={{ flexShrink: 0 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
              </div>
              <div style={{ fontSize: 7, color: "#A7F3D0", fontWeight: 500, lineHeight: 1, marginTop: 1 }}>
                online
              </div>
            </div>
            {/* Action Icons */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.95, flexShrink: 0 }}>
              {/* Video Call */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFF"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" /></svg>
              {/* Voice Call */}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFF"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.28-.27.36-.66.25-1.01A11.36 11.36 0 0 1 9 4.38c0-.55-.45-1-1-1H4.5c-.55 0-1 .45-1 1C3.5 13.06 10.94 20.5 20.01 20.5c.55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-.12z" /></svg>
              {/* 3 Vertical Dots */}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFF"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
            </div>
          </div>

          {/* WhatsApp Chat Stream with Smooth Auto-Scroll */}
          <div ref={chatScrollRef} style={{ flex: 1, position: "relative", overflowY: "auto", background: "#ECE5DD", padding: "8px 8px 12px", display: "flex", flexDirection: "column", gap: 6, scrollBehavior: "smooth" }}>
            {/* Timestamp date divider */}
            <div style={{ alignSelf: "center", background: "#FFFFFF", padding: "2px 8px", borderRadius: 6, fontSize: 7, fontWeight: 700, color: "#64748B", boxShadow: "0 1px 2px rgba(0,0,0,0.06)", textTransform: "uppercase" }}>
              Today
            </div>

            {/* WhatsApp thread */}
            {showWAThread && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                style={{ display: "flex", flexDirection: "column", gap: 5 }}>

                {/* 1. Context message from website */}
                <div style={{ alignSelf: "flex-end", maxWidth: "86%" }}>
                  <div style={{ background: "#D9FDD3", borderRadius: "8px 8px 2px 8px", padding: "5px 8px", color: DARK, fontSize: 9, lineHeight: 1.35, boxShadow: "0 1px 1.5px rgba(11,20,26,0.12)" }}>
                    I want sony silver headphone, can you update me on whatsapp +91 12345XXXXX
                    <div style={{ fontSize: 6.5, color: "#53BDEB", textAlign: "right", marginTop: 2, fontWeight: 700 }}>{sched.msgTime1} <span style={{ color: "#53BDEB" }}>✓✓</span></div>
                  </div>
                </div>

                {/* 2. Frosty answer */}
                <div style={{ alignSelf: "flex-start", maxWidth: "86%", background: "#FFFFFF", borderRadius: "8px 8px 8px 2px", padding: "5px 8px", color: DARK, fontSize: 9, lineHeight: 1.35, boxShadow: "0 1px 1.5px rgba(11,20,26,0.12)" }}>
                  sure, yes its in stock..you canfurther continue from whatsapp on you number 1234XXXXX
                  <div style={{ fontSize: 6.5, color: "#667781", textAlign: "right", marginTop: 2 }}>{sched.msgTime1}</div>
                </div>

                {/* 3. Follow up */}
                {showNewReply && (
                  <div style={{ alignSelf: "flex-start", maxWidth: "86%", background: "#FFFFFF", borderRadius: "8px 8px 8px 2px", padding: "5px 8px", color: DARK, fontSize: 9, lineHeight: 1.35, boxShadow: "0 1px 1.5px rgba(11,20,26,0.12)" }}>
                    Want me to reserve one? I can share the checkout link directly.
                    <div style={{ fontSize: 6.5, color: "#667781", textAlign: "right", marginTop: 2 }}>{sched.msgTime1}</div>
                  </div>
                )}

                {/* 4. Complex Question */}
                {showComplexQ && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                    style={{ alignSelf: "flex-end", maxWidth: "86%", background: "#D9FDD3", borderRadius: "8px 8px 2px 8px", padding: "5px 8px", color: DARK, fontSize: 9, lineHeight: 1.35, boxShadow: "0 1px 1.5px rgba(11,20,26,0.12)" }}>
                    I want to negotiate a bulk order — 50 units. Can someone help with custom pricing?
                    <div style={{ fontSize: 6.5, color: "#53BDEB", textAlign: "right", marginTop: 2, fontWeight: 700 }}>{sched.msgTime2} <span style={{ color: "#53BDEB" }}>✓✓</span></div>
                  </motion.div>
                )}

                {/* 5. Priya Handoff Card (Removed per user request) */}

                {/* 6. Priya: 14% offer */}
                {showHumanReply && (
                  <div style={{ alignSelf: "flex-start", maxWidth: "86%", background: "#FFFFFF", borderRadius: "8px 8px 8px 2px", padding: "6px 8px", color: DARK, fontSize: 9, lineHeight: 1.35, boxShadow: "0 1px 1.5px rgba(11,20,26,0.12)" }}>
                    <div style={{ fontSize: 7, fontWeight: 800, color: "#0ea5e9", marginBottom: 2 }}>
                      Frosty Agent
                    </div>
                    Hi! For 50 units I can offer ₹21,500/unit — 14% off. Shall I send a formal quote?
                    <div style={{ fontSize: 6.5, color: "#667781", textAlign: "right", marginTop: 2 }}>{sched.msgTime2}</div>
                  </div>
                )}

                {/* 7. User: 20% counter */}
                {showUserCounterQ && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                    style={{ alignSelf: "flex-end", maxWidth: "86%", background: "#D9FDD3", borderRadius: "8px 8px 2px 8px", padding: "5px 8px", color: DARK, fontSize: 9, lineHeight: 1.35, boxShadow: "0 1px 1.5px rgba(11,20,26,0.12)" }}>
                    We&apos;re looking for 20% off (₹20,000/unit) for immediate procurement. Can we schedule a quick call today to finalize?
                    <div style={{ fontSize: 6.5, color: "#53BDEB", textAlign: "right", marginTop: 2, fontWeight: 700 }}>{sched.msgTime3} <span style={{ color: "#53BDEB" }}>✓✓</span></div>
                  </motion.div>
                )}

                {/* 8. Priya: Let me check VIP calendar */}
                {showPriyaCallReply && (
                  <div style={{ alignSelf: "flex-start", maxWidth: "86%", background: "#FFFFFF", borderRadius: "8px 8px 8px 2px", padding: "6px 8px", color: DARK, fontSize: 9, lineHeight: 1.35, boxShadow: "0 1px 1.5px rgba(11,20,26,0.12)" }}>
                    <div style={{ fontSize: 7, fontWeight: 800, color: "#0ea5e9", marginBottom: 2 }}>
                      Frosty Agent
                    </div>
                    Let me check our VIP sales calendar for an open slot with me {sched.isTomorrow ? "tomorrow" : "today"}…
                    <div style={{ fontSize: 6.5, color: "#667781", textAlign: "right", marginTop: 2 }}>{sched.msgTime3}</div>
                  </div>
                )}

                {/* 9. Scanning Live Calendar (Removed per user request) */}

                {/* 10. (Beat 5) Automated Booking Confirmation */}
                {b5 && phase >= 0 && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                    style={{ alignSelf: "flex-start", maxWidth: "86%", background: "#FFFFFF", borderRadius: "8px 8px 8px 2px", padding: "6px 8px", color: DARK, fontSize: 9, lineHeight: 1.35, boxShadow: "0 1px 1.5px rgba(11,20,26,0.12)" }}>
                    <div style={{ fontSize: 7, fontWeight: 800, color: TEAL, marginBottom: 2 }}>
                      Frosty Agent
                    </div>
                    Hi! This is Priya. Your meeting has been booked for 5:30 pm...
                    <div style={{ fontSize: 6.5, color: "#667781", textAlign: "right", marginTop: 2 }}>{sched.msgTime3}</div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>

          {/* Authentic WhatsApp Floating Input Dock (Matching Reference Image) */}
          <div style={{ background: "#ECE5DD", padding: "5px 8px 6px", display: "flex", flexDirection: "column", gap: 3, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {/* White rounded pill input box */}
              <div style={{ flex: 1, background: "#FFFFFF", borderRadius: 20, padding: "5px 9px", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }}>
                {/* Outline Smile Icon */}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8696A0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, cursor: "pointer" }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
                </svg>
                <span style={{ fontSize: 9, color: "#8696A0", flex: 1, fontWeight: 400 }}>Message</span>
                {/* Outline Paperclip Icon */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8696A0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, cursor: "pointer" }}>
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                {/* Outline Camera Icon */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8696A0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, cursor: "pointer" }}>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              {/* Circular Green Audio Record Action Button */}
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#00A884", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1.5px 4px rgba(0,168,132,0.3)", flexShrink: 0, cursor: "pointer" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFF"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
              </div>
            </div>
            {/* Subtle Home Indicator Bar */}
            <div style={{ width: 50, height: 2.5, background: "#CBD5E1", borderRadius: 999, margin: "2px auto 0" }} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONTENT GROUP: WHATSAPP (Beats 2, 3, and 5)
   ═══════════════════════════════════════════════════════════════════ */
function WhatsAppGroupContent({ beat, phase }: { beat: number; phase: number }) {
  if (beat === 2) {
    return <WhatsAppAgentBeat phase={phase} />;
  }
  return <WhatsAppConversationBeat beat={beat} phase={phase} />;
}

/* ═══════════════════════════════════════════════════════════════════
   CONTENT GROUP: MERCHANT CONSOLE TAKEOVER (Beat 5)
   Priya takes over the dashboard, toggles to Human mode,
   and sends the meeting booking confirmation.
   ═══════════════════════════════════════════════════════════════════ */
function MerchantConsoleTakeoverContent({ beat, phase }: { beat: number; phase: number }) {
  const [humanMode, setHumanMode] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean; visible: boolean }>({
    x: 48, y: 52, clicking: false, visible: true,
  });

  const typedMessage = useTypingText("Hi! This is Priya. Your meeting has been booked for 5:30 pm...", phase === 2, 28);

  useEffect(() => {
    if (phase === 0) {
      // Dashboard opens with Sneha Kapoor selected
      setHumanMode(false);
      setMessageSent(false);
      setCursor({ x: 48, y: 52, clicking: false, visible: true });
    } else if (phase === 1) {
      // Cursor moves to AI/HUMAN toggle and clicks
      setCursor({ x: 88, y: 13, clicking: false, visible: true });
      const t1 = setTimeout(() => {
        setCursor({ x: 88, y: 13, clicking: true, visible: true });
      }, 550);
      const t2 = setTimeout(() => {
        setHumanMode(true);
        setCursor({ x: 88, y: 13, clicking: false, visible: true });
      }, 650);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else if (phase === 2) {
      // Cursor moves to chat input, typing starts
      setHumanMode(true);
      setCursor({ x: 65, y: 92, clicking: false, visible: true });
    } else if (phase === 3) {
      // Cursor moves to send button and clicks
      setHumanMode(true);
      setCursor({ x: 95.5, y: 92, clicking: false, visible: true });
      const t1 = setTimeout(() => {
        setCursor({ x: 95.5, y: 92, clicking: true, visible: true });
      }, 400);
      const t2 = setTimeout(() => {
        setMessageSent(true);
        setCursor({ x: 95.5, y: 92, clicking: false, visible: true });
      }, 500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [phase]);

  const sidebarNav = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "web", label: "Web Agent", icon: Globe, hasChevron: true },
    { id: "whatsapp", label: "WhatsApp Agent", icon: MessageCircle, hasChevron: true },
    { id: "unified", label: "Unified Assistant", icon: Inbox, badge: "LIVE" },
    { id: "email", label: "Email Agent", icon: Mail },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 490,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        background: "#F1F3F5",
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* ── Browser Chrome ── */}
      <div style={{ background: "#F1F3F5", borderBottom: "1px solid #E2E5E9", padding: "7px 14px 0", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 5, paddingBottom: 7 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#FF5F56" }} />
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#27C93F" }} />
        </div>
        <div style={{ background: "#FFF", borderRadius: "10px 10px 0 0", padding: "4.5px 16px", fontSize: 9.5, fontWeight: 700, color: "#1E293B", display: "flex", alignItems: "center", gap: 6, border: "1px solid #E2E5E9", borderBottom: "1px solid #FFF", marginBottom: -1, zIndex: 1, boxShadow: "0 -1px 3px rgba(0,0,0,0.02)" }}>
          <img src="/logo-small.png" alt="Frosty" style={{ width: 12, height: 12, objectFit: "contain" }} />
          <span>Frosty — Merchant Console</span>
        </div>
      </div>
      {/* Address bar */}
      <div style={{ background: "#FFF", borderBottom: "1px solid #E9ECEF", padding: "6px 14px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 5, opacity: 0.35 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2"><path d="M9 18l6-6-6-6" /></svg>
        </div>
        <div style={{ flex: 1, background: "#F4F4F6", borderRadius: 8, padding: "4px 12px", fontSize: 10, color: "#475569", display: "flex", alignItems: "center", gap: 6, border: "1px solid #E2E8F0" }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          <span style={{ fontWeight: 600, fontSize: 10 }}>app.frostyagent.com/console</span>
        </div>
      </div>

      {/* ── Main Console Layout ── */}
      <div
        style={{
          flex: 1,
          background: "#FFFFFF",
          display: "grid",
          gridTemplateColumns: "135px 1fr",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Local Precision-Synced Cursor */}
        <SimCursor {...cursor} />

        {/* ── Left Sidebar ── */}
        <aside style={{ borderRight: "1px solid #F1F5F9", background: "#FFFFFF", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
          <div style={{ overflowY: "auto", overflowX: "hidden", padding: "8px 6px 4px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 4px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <img src="/logo-small.png" alt="Frosty" style={{ width: 20, height: 20 }} />
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 900, color: "#0F172A", lineHeight: 1.1 }}>Frosty</div>
                  <div style={{ fontSize: 5.8, color: "#64748B", fontWeight: 500 }}>Merchant Console</div>
                </div>
              </div>
              <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 8, color: "#475569", lineHeight: 1 }}>☰</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 1.5, marginTop: 4 }}>
              {sidebarNav.map((item) => {
                const IconComponent = item.icon;
                const isAct = item.id === "unified";
                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "3.5px 6px", borderRadius: 6, fontSize: 7.2,
                      fontWeight: isAct ? 800 : 500,
                      color: isAct ? "#0D9488" : "#64748B",
                      background: isAct ? "#F0FDFA" : "transparent",
                      border: isAct ? "1px solid #CCFBF1" : "1px solid transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <IconComponent style={{ width: 10, height: 10, color: isAct ? "#0D9488" : "#94A3B8" }} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span style={{ fontSize: 5.5, fontWeight: 900, background: "#DCFCE7", color: "#16A34A", padding: "1px 3.5px", borderRadius: 3 }}>{item.badge}</span>
                    ) : item.hasChevron ? (
                      <ChevronRight style={{ width: 8, height: 8, color: "#CBD5E1" }} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom: Growth Plan */}
          <div style={{ padding: "4px 6px 6px", background: "#FFFFFF", borderTop: "1px solid #F1F5F9" }}>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 6px", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 7, fontWeight: 800, color: "#0F172A" }}>Growth Plan</span>
                <span style={{ fontSize: 7.5 }}>👑</span>
              </div>
              <div style={{ fontSize: 5.8, color: "#64748B", marginTop: 1 }}>76% of limit used</div>
              <div style={{ width: "100%", height: 3, background: "#E2E8F0", borderRadius: 99, marginTop: 3, overflow: "hidden" }}>
                <div style={{ width: "76%", height: "100%", background: "linear-gradient(90deg, #0396A6, #22D3EE)", borderRadius: 99 }} />
              </div>
              <div style={{ marginTop: 4, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 5, padding: "2px 4px", fontSize: 6, fontWeight: 800, color: "#0F172A", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                <span>Upgrade Plan</span><span>➔</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 3px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 15, height: 15, borderRadius: "50%", background: "#F1F5F9", fontSize: 6.5, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center" }}>YT</div>
                <div>
                  <div style={{ fontSize: 7, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>Your team</div>
                  <div style={{ fontSize: 5.5, color: "#94A3B8" }}>Super Admin</div>
                </div>
              </div>
              <span style={{ fontSize: 6.5, color: "#94A3B8" }}>▾</span>
            </div>
          </div>
        </aside>

        {/* ── Main Workspace ── */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#FAFAFC", overflow: "hidden", position: "relative" }}>
          {/* Top Header */}
          <div style={{ height: 32, minHeight: 32, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", borderBottom: "1px solid #F1F5F9", background: "#FFFFFF", flexShrink: 0, gap: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.01)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flexShrink: 0 }}>
              <div style={{ width: 17, height: 17, borderRadius: 4.5, background: "linear-gradient(135deg, rgba(3,150,166,0.12), rgba(34,211,238,0.18))", border: "1px solid rgba(3,150,166,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Inbox style={{ width: 9.5, height: 9.5, color: "#0396A6" }} />
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: "#0F172A", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>Unified Assistant</span>
            </div>
            <div style={{ flex: "0 1 140px", minWidth: 80, height: 19, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 5, padding: "0 6px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, flexShrink: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3.5, minWidth: 0, overflow: "hidden" }}>
                <Search style={{ width: 7.5, height: 7.5, color: "#94A3B8", flexShrink: 0 }} />
                <span style={{ fontSize: 6.5, color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Search anything...</span>
              </div>
              <kbd style={{ fontSize: 5.5, fontWeight: 700, color: "#64748B", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 3, padding: "0.5px 3px", lineHeight: 1, flexShrink: 0, fontFamily: "inherit" }}>⌘K</kbd>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4.5, flexShrink: 0 }}>
              <div style={{ position: "relative", width: 19, height: 19, borderRadius: "50%", background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bell style={{ width: 8.5, height: 8.5, color: "#475569" }} />
                <span style={{ position: "absolute", top: -2, right: -2, minWidth: 8.5, height: 8.5, borderRadius: 99, background: "#EF4444", color: "#FFF", fontSize: 5, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 1.5px", border: "1px solid #FFFFFF", lineHeight: 1 }}>3</span>
              </div>
              <span style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0", fontSize: 6.2, fontWeight: 800, padding: "1.5px 5.5px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap", flexShrink: 0 }}>
                <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 3px #22C55E", display: "inline-block" }} />
                <span>Live</span>
              </span>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 5, padding: "1.5px 4.5px", whiteSpace: "nowrap", flexShrink: 0 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#0F172A", fontSize: 5.2, fontWeight: 800, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>YT</div>
                <span style={{ fontSize: 6.2, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap" }}>Your team</span>
                <span style={{ fontSize: 5, color: "#94A3B8", marginLeft: -0.5 }}>▾</span>
              </div>
            </div>
          </div>

          {/* Conversations Grid */}
          <div style={{ flex: 1, padding: "7px 10px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "205px 1fr", height: "100%", background: "#FFFFFF", borderRadius: 8, border: "1px solid #E2E8F0", overflow: "hidden" }}>

              {/* ── Left: CONVERSATIONS List ── */}
              <div style={{ borderRight: "1px solid #E2E8F0", background: "#FFFFFF", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "7px 9px 5px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <MessageCircle style={{ width: 10, height: 10, color: "#0396A6" }} />
                    <span style={{ fontSize: 7.8, fontWeight: 900, color: "#0F172A", letterSpacing: "0.04em" }}>CONVERSATIONS</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <RefreshCw style={{ width: 8, height: 8, color: "#64748B" }} />
                    <span style={{ fontSize: 8, color: "#64748B", lineHeight: 1 }}>✕</span>
                  </div>
                </div>

                <div style={{ padding: "4px 8px", display: "flex", gap: 3, background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
                  <span style={{ fontSize: 6.2, fontWeight: 800, background: "#FFFFFF", color: "#0F172A", border: "1px solid #E2E8F0", padding: "2px 6px", borderRadius: 99, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>All (50)</span>
                  <span style={{ fontSize: 6.2, fontWeight: 600, color: "#64748B", padding: "2px 5px", borderRadius: 99 }}>🌐 Web (36)</span>
                  <span style={{ fontSize: 6.2, fontWeight: 600, color: "#64748B", padding: "2px 5px", borderRadius: 99 }}>📱 WA (14)</span>
                </div>

                <div style={{ padding: "4px 8px", display: "flex", alignItems: "center", gap: 3, borderBottom: "1px solid #F1F5F9" }}>
                  <div style={{ flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 99, padding: "2.5px 7px", display: "flex", alignItems: "center", gap: 4 }}>
                    <Search style={{ width: 7.5, height: 7.5, color: "#94A3B8" }} />
                    <span style={{ fontSize: 6.2, color: "#94A3B8" }}>Search name, message, ID...</span>
                  </div>
                  <div style={{ width: 17, height: 17, borderRadius: 5, border: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Filter style={{ width: 8, height: 8, color: "#64748B" }} />
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                  {/* Sneha Kapoor (Selected) */}
                  <div style={{ padding: "5px 8px", background: "#F0FDFA", borderLeft: "3px solid #0396A6", borderBottom: "1px solid #CCFBF1", display: "flex", gap: 5, alignItems: "flex-start" }}>
                    <div style={{ position: "relative", flexShrink: 0, marginTop: 1 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#CCFBF1", color: "#0F766E", fontSize: 6.8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>SK</div>
                      <span style={{ position: "absolute", bottom: -1, right: -1, width: 4.5, height: 4.5, borderRadius: "50%", background: "#0396A6", border: "1px solid #FFF" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 7.2, fontWeight: 900, color: "#0F172A" }}>Sneha Kapoor</span>
                        <span style={{ fontSize: 5.5, color: "#64748B", fontWeight: 600 }}>NOW</span>
                      </div>
                      <div style={{ fontSize: 6.2, color: "#475569", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Let me check our VIP sales calendar...</div>
                      <div style={{ marginTop: 2 }}>
                        <span style={{ fontSize: 5.5, fontWeight: 800, background: "#CCFBF1", color: "#0F766E", padding: "1px 4px", borderRadius: 3 }}>📱 WA AGENT</span>
                      </div>
                    </div>
                  </div>

                  {/* #WEB-132762 */}
                  <div style={{ padding: "5px 8px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 5, alignItems: "flex-start", opacity: 0.85 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#E0F2FE", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <UserIcon style={{ width: 9, height: 9 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 7, fontWeight: 800, color: "#0F172A" }}>#WEB-132762</span>
                        <span style={{ fontSize: 5.5, color: "#94A3B8" }}>5 HOURS AGO</span>
                      </div>
                      <div style={{ fontSize: 6.2, color: "#64748B", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>hi</div>
                      <div style={{ marginTop: 2 }}>
                        <span style={{ fontSize: 5.5, fontWeight: 800, background: "#F0FDFA", color: "#0D9488", border: "1px solid #CCFBF1", padding: "1px 4px", borderRadius: 3 }}>🌐 WEB AGENT</span>
                      </div>
                    </div>
                  </div>

                  {/* Dr. Meenakshi Sundaram */}
                  <div style={{ padding: "5px 8px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 5, alignItems: "flex-start", opacity: 0.85 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#DCFCE7", color: "#16A34A", fontSize: 6.8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>DS</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 7, fontWeight: 800, color: "#0F172A" }}>Dr. Meenakshi Sundaram</span>
                        <span style={{ fontSize: 5.5, color: "#94A3B8" }}>YESTERDAY</span>
                      </div>
                      <div style={{ fontSize: 6.2, color: "#64748B", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>We support full data isolation,...</div>
                      <div style={{ marginTop: 2 }}>
                        <span style={{ fontSize: 5.5, fontWeight: 800, background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0", padding: "1px 4px", borderRadius: 3 }}>📱 WA AGENT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right: Active Conversation Feed (Sneha Kapoor - WhatsApp messages from Beats 2-3) ── */}
              <div style={{ background: "#FAF8F5", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Chat Header */}
                <div style={{ padding: "6px 12px", background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#CCFBF1", color: "#0F766E", fontSize: 7.8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>SK</div>
                      <span style={{ position: "absolute", bottom: -1, right: -1, width: 5, height: 5, borderRadius: "50%", background: "#0396A6", border: "1px solid #FFF" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 8.8, fontWeight: 900, color: "#0F172A" }}>Sneha Kapoor</span>
                      <span style={{ fontSize: 5.8, fontWeight: 700, background: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D", padding: "1px 4px", borderRadius: 3 }}>ACTIVE</span>
                    </div>
                  </div>

                  {/* AI / HUMAN Toggle */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 6.2, fontWeight: 800, color: humanMode ? "#64748B" : "#0D9488" }}>AI</span>
                      <div style={{ width: 26, height: 14, borderRadius: 99, background: humanMode ? "#F59E0B" : "#0396A6", padding: 1.5, display: "flex", alignItems: "center", cursor: "pointer", transition: "background 0.25s ease" }}>
                        <motion.div
                          animate={{ x: humanMode ? 12 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          style={{ width: 11, height: 11, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
                        />
                      </div>
                      <span style={{ fontSize: 6.2, fontWeight: 800, color: humanMode ? "#B45309" : "#64748B" }}>HUMAN</span>
                    </div>
                    <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <UserIcon style={{ width: 9, height: 9, color: "#64748B" }} />
                    </div>
                  </div>
                </div>

                {/* Messages Feed — WhatsApp conversation from Beats 2-3 */}
                <div style={{ flex: 1, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
                  {/* 1. Customer: Bulk order request */}
                  <div style={{ alignSelf: "flex-start", maxWidth: "80%", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "6px 9px", borderRadius: "10px 10px 10px 2px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: 6.8, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>Sneha Kapoor</div>
                    <div style={{ fontSize: 7.2, color: "#1E293B", lineHeight: 1.4 }}>I want to negotiate a bulk order — 50 units. Can someone help with custom pricing?</div>
                    <div style={{ textAlign: "right", fontSize: 5.5, color: "#94A3B8", marginTop: 3 }}>11:42 AM</div>
                  </div>

                  {/* 2. Priya: 14% offer */}
                  <div style={{ alignSelf: "flex-end", maxWidth: "82%", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "6px 9px", borderRadius: "10px 10px 2px 10px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: 6.8, fontWeight: 900, color: "#0ea5e9", marginBottom: 2 }}>Priya (Sales Lead)</div>
                    <div style={{ fontSize: 7.2, color: "#1E293B", lineHeight: 1.4 }}>Hi! For 50 units I can offer ₹21,500/unit — 14% off. Shall I send a formal quote?</div>
                    <div style={{ textAlign: "right", fontSize: 5.5, color: "#0396A6", marginTop: 3, fontWeight: 600 }}>11:42 AM <span style={{ color: "#0284C7" }}>✓✓</span></div>
                  </div>

                  {/* 3. Customer: 20% counter */}
                  <div style={{ alignSelf: "flex-start", maxWidth: "80%", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "6px 9px", borderRadius: "10px 10px 10px 2px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: 6.8, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>Sneha Kapoor</div>
                    <div style={{ fontSize: 7.2, color: "#1E293B", lineHeight: 1.4 }}>We&apos;re looking for 20% off (₹20,000/unit) for immediate procurement. Can we schedule a quick call today to finalize?</div>
                    <div style={{ textAlign: "right", fontSize: 5.5, color: "#94A3B8", marginTop: 3 }}>11:43 AM</div>
                  </div>

                  {/* 4. Priya: VIP calendar */}
                  <div style={{ alignSelf: "flex-end", maxWidth: "82%", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "6px 9px", borderRadius: "10px 10px 2px 10px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: 6.8, fontWeight: 900, color: "#0ea5e9", marginBottom: 2 }}>Priya (Sales Lead)</div>
                    <div style={{ fontSize: 7.2, color: "#1E293B", lineHeight: 1.4 }}>Let me check our VIP sales calendar for an open slot with me today…</div>
                    <div style={{ textAlign: "right", fontSize: 5.5, color: "#0396A6", marginTop: 3, fontWeight: 600 }}>11:43 AM <span style={{ color: "#0284C7" }}>✓✓</span></div>
                  </div>

                  {/* 5. Priya: Meeting booked (appears after send) */}
                  {messageSent && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        alignSelf: "flex-end",
                        maxWidth: "85%",
                        background: "#FEF3C7",
                        color: "#78350F",
                        border: "1px solid #FCD34D",
                        padding: "6px 9px",
                        borderRadius: "10px 10px 2px 10px",
                        boxShadow: "0 2px 6px rgba(245,158,11,0.1)",
                      }}
                    >
                      <div style={{ fontSize: 6.2, fontWeight: 900, color: "#B45309", marginBottom: 1, display: "flex", alignItems: "center", gap: 3 }}>
                        <span>👨‍💼</span>
                        <span>Priya S. (Human Takeover)</span>
                      </div>
                      <div style={{ fontSize: 7.2, lineHeight: 1.4 }}>Hi! This is Priya. Your meeting has been booked for 5:30 pm...</div>
                      <div style={{ textAlign: "right", fontSize: 5.5, color: "#B45309", marginTop: 2 }}>Just now ✓✓</div>
                    </motion.div>
                  )}
                </div>

                {/* Input Footer */}
                <div style={{ padding: "5px 12px 7px", background: "#FFFFFF", borderTop: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: 5.8, color: humanMode ? "#B45309" : "#0D9488", fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: humanMode ? "#F59E0B" : "#0D9488" }} />
                    <span>{humanMode ? "Human Co-Pilot active — toggle off to return to AI" : "AI auto-reply is active — toggle off to type"}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 99, padding: "4px 10px", fontSize: 6.8, color: humanMode ? "#0F172A" : "#94A3B8", minHeight: 14 }}>
                      {humanMode ? (typedMessage || <span style={{ color: "#94A3B8" }}>Type reply as merchant...</span>) : "Turn off AI auto-reply to type..."}
                      {humanMode && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} style={{ borderRight: "1.5px solid #0396A6", marginLeft: 1 }} />}
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: humanMode ? "#0396A6" : "#2DD4BF", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 5px rgba(3,150,166,0.3)", flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONTENT GROUP: MEETING & CALENDAR (Beats 4 & 6)
   Left Side: Calendar & Slot Matching Engine
   Right Side: Kinetic Storytelling Typography
   ═══════════════════════════════════════════════════════════════════ */
function MeetingGroupContent({ beat, phase }: { beat: number; phase: number }) {
  const b6 = beat === 7;
  const sched = useMemo(() => getDynamicSchedule(), []);

  const showEvents = b6;
  const showHighlight = b6;
  const showReasoning = b6;

  // We are showing the Google Calendar Clone UI instead of the mini-hero.
  // The storytelling elements (Scanning, Highlighting, Booking) are integrated into the main grid.
  return (
    <div style={{
      height: "100%",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#FFFFFF",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Google Sans', Roboto, Arial, sans-serif"
    }}>
      {/* ── SPLASH SCREEN OVERLAY ── */}
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "absolute",
              inset: 0,
              background: "#FFFFFF",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: 40,
            }}
          >
            {/* Same kinetic splash content as before */}
            <motion.div
              key="text-meeting-locked"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: 500 }}
            >
              <>
                <KineticWordHeadline
                  delay={0.15}
                  fontSize="clamp(32px, 4.5vw, 44px)"
                  centered={true}
                  words={[
                    { text: "Lead" },
                    { text: "Conversion.", breakAfter: true },
                    { text: "From", highlight: true },
                    { text: "WhatsApp", highlight: true },
                    { text: "to", highlight: true },
                    { text: "calendar", highlight: true },
                    { text: "invite.", highlight: true },
                  ]}
                />
                <div style={{ marginTop: 8 }}>
                  <KineticDescription
                    delay={0.32}
                    text="Meeting locked in 10 seconds. Automated Google Meet links generated, calendar invites dispatched, and CRM pipeline updated."
                  />
                </div>
              </>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: phase === 0 ? 0 : 1, scale: phase === 0 ? 0.98 : 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 10
        }}
      >
        {/* ── TOP HEADER (Google Calendar Style) ── */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #DADCE0', flexShrink: 0, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Hamburger */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#5F6368"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 22, height: 22, position: 'relative' }}>
                <svg viewBox="0 0 42 42" fill="none">
                  <path d="M3 8C3 5.23858 5.23858 3 8 3H34C36.7614 3 39 5.23858 39 8V12H3V8Z" fill="#4285F4" />
                  <path d="M3 12H39V34C39 36.7614 36.7614 39 34 39H8C5.23858 39 3 36.7614 3 34V12Z" fill="#E8EAED" />
                  <text x="21" y="30" fontSize="20" fontWeight="bold" fill="#1A73E8" textAnchor="middle" fontFamily="sans-serif">31</text>
                </svg>
              </div>
              <span style={{ fontSize: 18, color: '#3C4043', fontWeight: 400, letterSpacing: '-0.5px' }}>Calendar</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {/* Chevron Left */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#5F6368"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" /></svg>
              {/* Chevron Right */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#5F6368"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
            </div>
            <div style={{ fontSize: 16, color: '#3C4043', fontWeight: 400, whiteSpace: 'nowrap' }}>
              {sched.isTomorrow ? 'Tomorrow' : '31 August 2026'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#5F6368"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#5F6368"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" /></svg>
            <SettingsIcon style={{ width: 18, height: 18, color: '#5F6368' }} />

            <div style={{ display: 'flex', alignItems: 'center', background: '#F1F3F4', borderRadius: 24, padding: '2px' }}>
              <div style={{ background: '#D2E3FC', padding: '2px 8px', borderRadius: 20, color: '#1967D2' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9h-2V7h-2v5H6v2h2v5h2v-5h2v-2z" /></svg></div>
              <div style={{ padding: '2px 8px', color: '#5F6368' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg></div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#5F6368"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" /></svg>
          </div>
        </div>

        {/* ── MAIN CONTENT (No Sidebar + Grid) ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* ── MAIN CALENDAR GRID ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

            {/* AI Status Overlay / Bar (only shown during scanning/highlighting, not for b6 booked state) */}
            <AnimatePresence>
              {showEvents && !b6 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ background: showHighlight ? TEAL : "#0F172A", color: "#FFF", padding: "10px 24px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, transition: "background 0.5s ease" }}
                >
                  {showHighlight ? (
                    <><Sparkles style={{ width: 16, height: 16 }} /> <span>Optimal slot found. No calendar conflicts.</span></>
                  ) : showEvents ? (
                    <><Search style={{ width: 16, height: 16 }} /> <span>Scanning open slots...</span></>
                  ) : (
                    <><RefreshCw style={{ width: 16, height: 16 }} /> <span>Syncing Google & Outlook calendars...</span></>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Date Header Strip - Circle moved to left gutter */}
            <div style={{ display: 'flex', borderBottom: '1px solid #DADCE0', paddingBottom: 4 }}>
              <div style={{ width: 52, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #DADCE0', paddingTop: 3, paddingBottom: 2 }}>
                <span style={{ fontSize: 9, color: '#70757A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {sched.isTomorrow ? 'TUE' : 'MON'}
                </span>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1A73E8', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 400, marginTop: 1 }}>
                  {sched.isTomorrow ? '1' : '31'}
                </div>
              </div>
              <div style={{ flex: 1 }} />
            </div>

            {/* Timeline Scrollable Area */}
            <div style={{ flex: 1, overflowY: 'auto', position: 'relative', display: 'flex' }}>

              {/* Time Labels (Y-Axis) */}
              <div style={{ width: 52, position: 'relative', borderRight: '1px solid #DADCE0', flexShrink: 0 }}>
                {["2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM"].map((time, i) => (
                  <div key={time} style={{ position: "absolute", top: `${(i / 6) * 100}%`, right: 6, fontSize: 10, color: "#70757A", fontWeight: 500, transform: "translateY(-50%)" }}>
                    {time}
                  </div>
                ))}
              </div>

              {/* Grid Lines & Events Container */}
              <div style={{ flex: 1, position: 'relative' }}>
                {/* Horizontal Lines */}
                {[...Array(7)].map((_, i) => (
                  <div key={`h-${i}`} style={{ position: "absolute", top: `${(i / 6) * 100}%`, left: 0, right: 0, height: 1, background: "#DADCE0" }} />
                ))}

                <AnimatePresence>
                  {showEvents && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: "absolute", inset: 0 }}>

                      {/* Busy Event: Team Standup 3:30 PM - 4:00 PM */}
                      <div style={{ position: "absolute", top: `${(1.5 / 6) * 100}%`, left: 12, right: 16, height: `${(0.5 / 6) * 100}%`, background: "#7986CB", borderRadius: 4, padding: "2px 8px", display: "flex", alignItems: "center", zIndex: 10, borderLeft: '3px solid #5C6BC0', color: '#FFF' }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>Team Standup</div>
                      </div>

                      {/* Current Time Indicator ~4:40 PM */}
                      <div style={{ position: "absolute", top: `${(2.67 / 6) * 100}%`, left: 0, right: 0, display: "flex", alignItems: "center", zIndex: 15 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EA4335", marginLeft: -5 }} />
                        <div style={{ flex: 1, height: 2, background: "#EA4335" }} />
                      </div>

                      {/* The Recommended/Booked Slot: 5:30 PM - 6:00 PM */}
                      <div style={{ position: "absolute", top: `${(3.5 / 6) * 100}%`, left: 12, right: 16, height: `${(0.5 / 6) * 100}%`, zIndex: 10 }}>
                        <AnimatePresence mode="wait">
                          {!b6 ? (
                            <motion.div
                              key="slot-recommended"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1, background: showHighlight ? "#E8F0FE" : "transparent", border: showHighlight ? `2px solid #1A73E8` : "1.5px dashed #CBD5E1" }}
                              transition={{ duration: 0.4 }}
                              style={{ width: "100%", height: "100%", borderRadius: 4, display: "flex", alignItems: "center", padding: "0 8px" }}
                            >
                              <div style={{ fontSize: 12, fontWeight: 600, color: showHighlight ? "#1A73E8" : "#94A3B8", display: "flex", alignItems: "center", gap: 6 }}>
                                {showHighlight && <Sparkles style={{ width: 13, height: 13 }} />}
                                5:30 PM - 6:00 PM
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="slot-booked"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              style={{ width: "100%", height: "100%", background: "#D50000", borderRadius: 4, padding: "2px 8px", display: "flex", alignItems: "center", borderLeft: '3px solid #B71C1C', color: '#FFF' }}
                            >
                              <div style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                                <CheckCircle2 style={{ width: 13, height: 13 }} /> VIP Call - Product Walkthrough
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONTENT GROUP: TRANSITION / CHAOS (Beat 7)
   ═══════════════════════════════════════════════════════════════════ */
function MerchantChaosTransitionContent({ beat, phase }: { beat: number; phase: number }) {
  const isHook = phase === 0;
  const isChaos = phase === 1;
  const isCore = phase >= 2;
  const isZooming = phase === 3;

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 18px 12px",
        background: "radial-gradient(ellipse at 50% 30%, #F0FDFA 0%, #F8FAFC 55%, #FFFFFF 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background subtle grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.15,
          pointerEvents: "none",
        }}
      />

      {/* ── Top Storytelling Typography ── */}
      <motion.div
        animate={{
          scale: isZooming ? 1.25 : 1,
          opacity: isZooming ? 0 : 1,
          filter: isZooming ? "blur(8px)" : "blur(0px)",
        }}
        transition={{ duration: 0.45, ease: [0.12, 0.8, 0.18, 1] }}
        style={{
          width: "100%",
          maxWidth: 600,
          textAlign: "center",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <AnimatePresence mode="wait">
          {!isCore ? (
            <motion.div
              key="merchant-hook"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
              <motion.div
                initial={{ opacity: 0, x: -12, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#64748B",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase"
                }}
              >
                <Eye style={{ width: 13, height: 13, strokeWidth: 2.5 }} />
                <span>Behind the scenes · Business owner view</span>
              </motion.div>
              <KineticWordHeadline
                fontSize="clamp(22px, 2.5vw, 28px)"
                delay={0.15}
                centered={true}
                words={[
                  { text: "How" },
                  { text: "Do" },
                  { text: "You" },
                  { text: "Run" },
                  { text: "All", breakAfter: true },
                  { text: "These", highlight: true },
                  { text: "Moving", highlight: true },
                  { text: "Parts", highlight: true },
                  { text: "Seamlessly?", highlight: true },
                ]}
              />
              <KineticDescription
                delay={0.32}
                text="Lead segregation, quotations, CRM pipelines, team dispatch, and conversion analytics — all at once."
              />
            </motion.div>
          ) : (
            <motion.div
              key="merchant-frosty-title"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
              <motion.div
                initial={{ opacity: 0, x: -12, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  color: TEAL,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase"
                }}
              >
                <Layers style={{ width: 13, height: 13, strokeWidth: 2.5 }} />
                <span>One single unified AI platform</span>
              </motion.div>
              <KineticWordHeadline
                fontSize="clamp(22px, 2.5vw, 28px)"
                delay={0.15}
                centered={true}
                words={[
                  { text: "Let" },
                  { text: "Frosty" },
                  { text: "Handle" },
                  { text: "It.", breakAfter: true },
                  { text: "One", highlight: true },
                  { text: "Intelligent", highlight: true },
                  { text: "Workspace.", highlight: true },
                ]}
              />
              <KineticDescription
                delay={0.32}
                text="Every lead scored, every quotation drafted, every calendar slot booked — handled autonomously in one dashboard."
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Center Stage: Widget Row OR Radiant Frosty Core ── */}
      <div
        style={{
          flex: 1,
          width: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 220,
          padding: "0 12px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* ── Horizontal Scrolling 8 Moving Parts Stream (Shows 4 at a time, smoothly scrolls to 5-8) ── */}
        <AnimatePresence>
          {!isCore && (
            <motion.div
              key="horizontal-carousel-wrapper"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: "100%",
                maxWidth: 780,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
              }}
            >
              {/* Masked Horizontal Viewport Container */}
              <div
                style={{
                  width: "100%",
                  overflow: "hidden",
                  padding: "6px 2px",
                  boxSizing: "border-box",
                  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 2.5%, black 97.5%, transparent 100%)",
                  maskImage: "linear-gradient(to right, transparent 0%, black 2.5%, black 97.5%, transparent 100%)",
                }}
              >
                <motion.div
                  drag="x"
                  dragConstraints={{ left: -784, right: 0 }}
                  animate={{ x: isChaos ? -784 : 0 }}
                  transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: "flex",
                    gap: 14,
                    width: "max-content",
                    cursor: "grab",
                  }}
                >
                  {[
                    // ── Card 1: Lead Scoring ──
                    {
                      icon: <Flame style={{ width: 14, height: 14, color: "#64748B" }} />,
                      badge: "124 LEADS",
                      badgeColor: "#475569",
                      content: (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: DARK }}>Lead Scoring</div>
                          <div style={{ fontSize: 9, color: "#475569", fontWeight: 600, marginTop: 3 }}>85% Enterprise B2B</div>
                          <div style={{ width: "100%", height: 4, background: "#E2E8F0", borderRadius: 3, marginTop: 6, overflow: "hidden" }}>
                            <div style={{ width: "85%", height: "100%", background: "#334155", borderRadius: 3 }} />
                          </div>
                          <div style={{ fontSize: 8, color: "#94A3B8", fontWeight: 500, paddingTop: 8, marginTop: 10 }}>32 Warm Retailers</div>
                        </div>
                      ),
                    },
                    // ── Card 2: Smart Quotes ──
                    {
                      icon: <Receipt style={{ width: 14, height: 14, color: "#64748B" }} />,
                      badge: "14% OFF",
                      badgeColor: "#475569",
                      content: (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: DARK }}>Smart Quotes</div>
                          <div style={{ fontSize: 9, color: "#64748B", marginTop: 3, fontWeight: 500 }}>50x Sony XM5</div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: DARK, marginTop: 2 }}>₹21,500<span style={{ fontSize: 9.5, color: "#64748B" }}>/unit</span></div>
                          <div style={{ fontSize: 8, color: "#64748B", fontWeight: 600, marginTop: 8 }}>Draft #Q-849 Auto-Generated</div>
                        </div>
                      ),
                    },
                    // ── Card 3: Catalog Sync ──
                    {
                      icon: <ShoppingBag style={{ width: 14, height: 14, color: "#64748B" }} />,
                      badge: "18 IN STOCK",
                      badgeColor: "#475569",
                      content: (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: DARK }}>Catalog Sync</div>
                          <div style={{ fontSize: 9, color: "#334155", fontWeight: 600, marginTop: 3 }}>Sony WH-1000XM5</div>
                          <div style={{ fontSize: 8, color: "#64748B", fontWeight: 500, paddingTop: 8, marginTop: 14 }}>✓ Real-Time Stock Matched</div>
                        </div>
                      ),
                    },
                    // ── Card 4: Omnichannel CRM ──
                    {
                      icon: <Layers style={{ width: 14, height: 14, color: "#64748B" }} />,
                      badge: "₹48.5L ACTIVE",
                      badgeColor: "#475569",
                      content: (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: DARK }}>Omnichannel CRM</div>
                          <div style={{ fontSize: 9, color: "#475569", fontWeight: 600, marginTop: 3 }}>6 Deals Won Today</div>
                          <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                            <div style={{ flex: 1, height: 4, background: "#334155", borderRadius: 3 }} />
                            <div style={{ flex: 1, height: 4, background: "#334155", borderRadius: 3 }} />
                            <div style={{ flex: 1, height: 4, background: "#E2E8F0", borderRadius: 3 }} />
                          </div>
                          <div style={{ fontSize: 8, color: "#94A3B8", fontWeight: 500, paddingTop: 8, marginTop: 10 }}>Auto-Synced Across Channels</div>
                        </div>
                      ),
                    },
                    // ── Card 5: Conversion Radar ──
                    {
                      icon: <TrendingUp style={{ width: 14, height: 14, color: "#64748B" }} />,
                      badge: "+28% REV",
                      badgeColor: "#475569",
                      content: (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: DARK }}>Conversion Radar</div>
                          <div style={{ fontSize: 9, color: "#475569", fontWeight: 600, marginTop: 3 }}>45% Lead Rate</div>
                          <div style={{ width: "100%", height: 4, background: "#E2E8F0", borderRadius: 3, marginTop: 6, overflow: "hidden" }}>
                            <div style={{ width: "45%", height: "100%", background: "#334155", borderRadius: 3 }} />
                          </div>
                          <div style={{ fontSize: 8, color: "#94A3B8", fontWeight: 500, paddingTop: 8, marginTop: 10 }}>1.1s Avg AI Response Time</div>
                        </div>
                      ),
                    },
                    // ── Card 6: Inbox Router ──
                    {
                      icon: <Radio style={{ width: 14, height: 14, color: "#64748B" }} />,
                      badge: "32 NEW",
                      badgeColor: "#475569",
                      content: (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: DARK }}>Inbox Router</div>
                          <div style={{ fontSize: 9, color: "#475569", fontWeight: 600, marginTop: 3 }}>WhatsApp · Web · Email</div>
                          <div style={{ fontSize: 8, color: "#64748B", fontWeight: 500, paddingTop: 8, marginTop: 14 }}>✓ Zero Context Lost</div>
                        </div>
                      ),
                    },
                    // ── Card 7: Team Dispatch ──
                    {
                      icon: <UserCheck style={{ width: 14, height: 14, color: "#64748B" }} />,
                      badge: "CO-PILOT",
                      badgeColor: "#475569",
                      content: (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: DARK }}>Team Dispatch</div>
                          <div style={{ fontSize: 9, color: "#475569", fontWeight: 600, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22C55E" }} />
                            <span>Assigned: Priya S.</span>
                          </div>
                          <div style={{ fontSize: 8, color: "#94A3B8", fontWeight: 500, paddingTop: 8, marginTop: 11 }}>Full Chat Journey Synced</div>
                        </div>
                      ),
                    },
                    // ── Card 8: Slot Engine ──
                    {
                      icon: <CalendarDays style={{ width: 14, height: 14, color: "#64748B" }} />,
                      badge: "1-TAP",
                      badgeColor: "#475569",
                      content: (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: DARK }}>Slot Engine</div>
                          <div style={{ fontSize: 9, color: "#334155", fontWeight: 600, marginTop: 3 }}>Google Meet & Cal</div>
                          <div style={{ fontSize: 8, color: "#64748B", fontWeight: 500, paddingTop: 8, marginTop: 14 }}>Today · 5:30 PM Locked</div>
                        </div>
                      ),
                    },
                  ].map((card, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: i % 2 === 0 ? -4 : 4 }}
                      transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        flex: "0 0 182px",
                        width: 182,
                        minHeight: 180,
                        background: "#FFFFFF",
                        borderRadius: 12,
                        border: "1px solid #E2E8F0",
                        padding: "13px 14px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        userSelect: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {card.icon}
                        <span style={{ color: card.badgeColor, fontSize: 7.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, border: "1px solid #E2E8F0", whiteSpace: "nowrap", marginLeft: 4 }}>{card.badge}</span>
                      </div>
                      {card.content}
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Sleek Pagination & Stream Indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.85)", border: "1px solid #E2E8F0", padding: "2.5px 8px", borderRadius: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: !isChaos ? TEAL : "#CBD5E1", transition: "all 0.35s ease" }} />
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: isChaos ? TEAL : "#CBD5E1", transition: "all 0.35s ease" }} />
                  <span style={{ fontSize: 7.2, color: "#64748B", fontWeight: 700, marginLeft: 3 }}>
                    {!isChaos ? "1–4 of 8 Moving Parts" : "5–8 of 8 Moving Parts"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Phase 2: Radiant Glowing Frosty AI Core ── */}
        <AnimatePresence>
          {isCore && (
            <motion.div
              key="frosty-core-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isZooming ? 6.5 : [0.94, 1.04, 0.94],
                opacity: isZooming ? 0 : 1,
                filter: isZooming ? "blur(14px)" : "blur(0px)",
              }}
              transition={{
                scale: isZooming ? { duration: 0.45, ease: [0.12, 0.8, 0.18, 1] } : { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: isZooming ? 0.45 : 0.4 },
                filter: { duration: 0.45 },
              }}
              style={{
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 180,
                height: 180,
                zIndex: 40,
              }}
            >
              {/* Outer Concentric Aura Ring */}
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute",
                  inset: -40,
                  borderRadius: "50%",
                  border: `1.5px dashed ${TEAL}60`,
                  background: `radial-gradient(circle, ${TEAL}10 0%, transparent 60%)`,
                }}
              />
              {/* Aura Ring 2 */}
              <motion.div
                animate={{ rotate: -360, scale: [1.02, 0.98, 1.02] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute",
                  inset: -20,
                  borderRadius: "50%",
                  border: `1.5px solid #22D3EE90`,
                  boxShadow: `0 0 60px ${TEAL}50`,
                }}
              />
              {/* Central Metallic Glowing Shield */}
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 30,
                  background: `linear-gradient(135deg, ${TEAL}, #0284C7, #0F172A)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFF",
                  boxShadow: `0 24px 60px ${TEAL}70, 0 0 0 4px rgba(255,255,255,0.6)`,
                  position: "relative",
                  zIndex: 20,
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 40%)" }} />
                <motion.div
                  animate={{ scale: [0.94, 1.06, 0.94] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ zIndex: 10 }}
                >
                  <Bot style={{ width: 48, height: 48, color: "#FFF" }} />
                </motion.div>
                <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}>
                  <Sparkles style={{ width: 16, height: 16, color: "#67E8F9" }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Subtle Indicator */}
      <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, zIndex: 30 }}>
        <span>Unified Merchant Intelligence</span>
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════════
   CONTENT GROUP: ONE SHARED BRAIN & KNOWLEDGE BASE (Beat 8)
   Exact Recreation of Reference: Clean White Central Frosty Hub + Left/Right Agent Cards + Metrics
   ═══════════════════════════════════════════════════════════════════ */
function SharedBrainKnowledgeContent({ beat, phase }: { beat: number; phase: number }) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px 14px",
        background: "#FFFFFF",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* ── Top Header Section ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", zIndex: 10, gap: 4 }}>
        {/* Top Badge - Clean uppercase text */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: "#64748B",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          One shared knowledge base · Real-time sync
        </motion.div>

        {/* Hero Title */}
        <div style={{ marginTop: 2 }}>
          <h2 style={{ fontSize: "clamp(20px, 2.4vw, 28px)", fontWeight: 900, color: "#0F172A", margin: 0, lineHeight: 1.15, letterSpacing: "-0.025em" }}>
            One Shared Brain.
          </h2>
          <h2 style={{ fontSize: "clamp(20px, 2.4vw, 28px)", fontWeight: 900, margin: "1px 0 0", lineHeight: 1.15, letterSpacing: "-0.025em", color: TEAL }}>
            Instant Cross-Channel Memory.
          </h2>
          <p style={{ fontSize: 9.5, color: "#64748B", fontWeight: 500, margin: "4px 0 0", maxWidth: 500 }}>
            Both Website and WhatsApp agents think from the exact same real-time memory matrix.
          </p>
        </div>
      </div>

      {/* ── Main 3-Node Connected Diagram: Website Agent ↔ Frosty Hub ↔ WhatsApp Agent ── */}
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 10,
          margin: "4px 0",
        }}
      >
        {/* ── Left Card: Website Agent ── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            flex: "0 0 178px",
            width: 178,
            background: "#FFFFFF",
            borderRadius: 12,
            border: "1px solid #E2E8F0",
            padding: "13px 13px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: 9,
            zIndex: 20,
            position: "relative",
          }}
        >
          {/* Top Header Row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Globe style={{ width: 16, height: 16, color: "#0396A6" }} />
            <span style={{ color: "#475569", border: "1px solid #E2E8F0", fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#22C55E" }} />
              LIVE
            </span>
          </div>

          {/* Agent Info */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>Website Agent</div>
            <div style={{ fontSize: 9.5, color: "#94A3B8", marginTop: 2, fontWeight: 500 }}>yourwebsite.com</div>
          </div>

          {/* Feature Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 2 }}>
            <div style={{ fontSize: 8.5, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
              <Check style={{ width: 11, height: 11, color: "#0396A6" }} />
              <span>Catalog &amp; Live Price Synced</span>
            </div>
            <div style={{ fontSize: 8.5, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
              <Check style={{ width: 11, height: 11, color: "#0396A6" }} />
              <span>Cart: ₹34,900 · Visitor #4c1a</span>
            </div>
          </div>
        </motion.div>

        {/* ── Left Connection Line ── */}
        <div style={{ flex: "1 1 40px", height: 1, minWidth: 24, maxWidth: 75, borderTop: "1.5px dashed rgba(3,150,166,0.35)" }} />

        {/* ── Center Hub: Logo from public folder ── */}
        <div
          style={{
            position: "relative",
            width: 130,
            height: 130,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {/* Outer Ring */}
          <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", border: "1px solid rgba(3,150,166,0.2)", pointerEvents: "none" }} />

          {/* Inner Dashed Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute", width: 95, height: 95, borderRadius: "50%", border: "1px dashed rgba(3,150,166,0.25)", pointerEvents: "none" }}
          />

          {/* Central Logo */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#FFFFFF",
              border: "1px solid rgba(3,150,166,0.2)",
              boxShadow: "0 2px 8px rgba(3,150,166,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 25,
            }}
          >
            <img src="/logo-small.png" alt="Frosty" style={{ width: 44, height: 44, objectFit: "contain" }} />
          </div>
        </div>

        {/* ── Right Connection Line ── */}
        <div style={{ flex: "1 1 40px", height: 1, minWidth: 24, maxWidth: 75, borderTop: "1.5px dashed rgba(3,150,166,0.35)" }} />

        {/* ── Right Card: WhatsApp Agent ── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            flex: "0 0 178px",
            width: 178,
            background: "#FFFFFF",
            borderRadius: 12,
            border: "1px solid #E2E8F0",
            padding: "13px 13px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: 9,
            zIndex: 20,
            position: "relative",
          }}
        >
          {/* Top Header Row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <MessageCircle style={{ width: 16, height: 16, color: "#0396A6" }} />
            <span style={{ color: "#475569", border: "1px solid #E2E8F0", fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#22C55E" }} />
              ACTIVE
            </span>
          </div>

          {/* Agent Info */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>WhatsApp Agent</div>
            <div style={{ fontSize: 9.5, color: "#94A3B8", marginTop: 2, fontWeight: 500 }}>+91 98765 43210</div>
          </div>

          {/* Feature Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 2 }}>
            <div style={{ fontSize: 8.5, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
              <Check style={{ width: 11, height: 11, color: "#0396A6" }} />
              <span>Full History &amp; Deals Synced</span>
            </div>
            <div style={{ fontSize: 8.5, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
              <Check style={{ width: 11, height: 11, color: "#0396A6" }} />
              <span>Arjun Mehta (92% Intent) · 14% Off</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Metrics ── */}
      <div style={{ width: "100%", maxWidth: 620, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 10 }}>
        <div
          style={{
            width: "100%",
            background: "#FFFFFF",
            borderRadius: 12,
            border: "1px solid #E2E8F0",
            padding: "8px 16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            alignItems: "center",
            boxSizing: "border-box",
          }}
        >
          {[
            { label: "18M+", sub: "Stock Matched" },
            { label: "14%", sub: "Bulk Tier Locked" },
            { label: "Arjun Mehta", sub: "92% Intent Lead" },
            { label: "5:30 PM", sub: "Google Meet" },
          ].map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>{m.label}</div>
              <div style={{ fontSize: 8, color: "#94A3B8", fontWeight: 500 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Footer text */}
        <div style={{ fontSize: 8.5, color: "#94A3B8", fontWeight: 500 }}>
          Context never resets · 0.0ms latency
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONTENT GROUP: DASHBOARD (Beats 10–11)
   CRM dashboard → Analytics dashboard
   ═══════════════════════════════════════════════════════════════════ */
function DashboardGroupContent({ beat, phase }: { beat: number; phase: number }) {
  return (
    <div style={{ height: "100%", position: "relative" }}>
      {/* Beat 10: Merchant Live Console */}
      <motion.div
        animate={{ opacity: beat === 10 ? 1 : 0 }}
        transition={{ duration: 0.35 }}
        style={{ position: "absolute", inset: 0, pointerEvents: beat === 10 ? "auto" : "none" }}
      >
        <CRMDashboardBeat phase={beat === 10 ? phase : -1} />
      </motion.div>

      {/* Beat 11: Analytics Dashboard */}
      <motion.div
        animate={{ opacity: beat === 11 ? 1 : 0 }}
        transition={{ duration: 0.35 }}
        style={{ position: "absolute", inset: 0, pointerEvents: beat === 11 ? "auto" : "none" }}
      >
        <AnalyticsDashboardBeat phase={beat === 11 ? phase : -1} />
      </motion.div>
    </div>
  );
}

/* ── Beat 9: Master Frosty Merchant Overview Dashboard & Co-Pilot Takeover ── */
function CRMDashboardBeat({ phase }: { phase: number }) {
  const [activeNavTab, setActiveNavTab] = useState<"overview" | "unified" | "analytics">("overview");
  const [selectedTimeRange, setSelectedTimeRange] = useState<"7d" | "14d" | "30d" | "90d">("30d");
  const [selectedVisitor, setSelectedVisitor] = useState(false);
  const [humanMode, setHumanMode] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [dealClosed, setDealClosed] = useState(false);

  // Analytics Embedded State
  const [analyticsConfig, setAnalyticsConfig] = useState<DashboardConfig>(DEFAULT_DASHBOARD_CONFIG);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [analyticsToast, setAnalyticsToast] = useState(false);
  const [analyticsHoveredPoint, setAnalyticsHoveredPoint] = useState<MetricPointDetails | null>(null);
  const [analyticsHoveredSlice, setAnalyticsHoveredSlice] = useState<string | null>(null);
  const [analyticsHoveredKpi, setAnalyticsHoveredKpi] = useState<string | null>(null);

  const currentAnalyticsColor = resolveChartColor(analyticsConfig);

  const handleApplyAnalyticsChanges = (newCfg: DashboardConfig) => {
    setAnalyticsConfig(newCfg);
    setIsAnalyticsModalOpen(false);
    setAnalyticsToast(true);
    setTimeout(() => setAnalyticsToast(false), 3500);
  };

  // Local precision cursor inside the console container (percentage-based)
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean; visible: boolean }>({
    x: 48,
    y: 52,
    clicking: false,
    visible: true,
  });

  useEffect(() => {
    if (phase === 0) {
      setActiveNavTab("overview");
      setSelectedVisitor(false);
      setHumanMode(false);
      setMessageSent(false);
      setDealClosed(false);
      setSelectedTimeRange("30d");
      setCursor({ x: 48, y: 52, clicking: false, visible: true });
    } else if (phase === 1) {
      // Step 1: Cursor moves to [Unified Assistant] in sidebar and clicks
      setCursor({ x: 6.5, y: 15.5, clicking: false, visible: true });
      const t1 = setTimeout(() => {
        setCursor({ x: 6.5, y: 15.5, clicking: true, visible: true });
      }, 550);
      const t2 = setTimeout(() => {
        setActiveNavTab("unified");
        setCursor({ x: 6.5, y: 15.5, clicking: false, visible: true });
      }, 650);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else if (phase === 2) {
      // Step 2: In Unified CONVERSATIONS view, cursor clicks Sneha Kapoor in the list
      setActiveNavTab("unified");
      setCursor({ x: 23, y: 35, clicking: false, visible: true });
      const t1 = setTimeout(() => {
        setCursor({ x: 23, y: 35, clicking: true, visible: true });
      }, 550);
      const t2 = setTimeout(() => {
        setSelectedVisitor(true);
        setCursor({ x: 23, y: 35, clicking: false, visible: true });
      }, 650);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else if (phase === 3) {
      // Step 3: Top-right toggle switch [AI ===🔘 HUMAN] clicked to activate Human Mode
      setActiveNavTab("unified");
      setSelectedVisitor(true);
      setCursor({ x: 88, y: 13, clicking: false, visible: true });
      const t1 = setTimeout(() => {
        setCursor({ x: 88, y: 13, clicking: true, visible: true });
      }, 550);
      const t2 = setTimeout(() => {
        setHumanMode(true);
        setCursor({ x: 88, y: 13, clicking: false, visible: true });
      }, 650);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else if (phase === 4) {
      // Step 4: Types live in chat input and clicks circular teal Send button ✈
      setActiveNavTab("unified");
      setSelectedVisitor(true);
      setHumanMode(true);
      setCursor({ x: 65, y: 92, clicking: false, visible: true });
      const t1 = setTimeout(() => {
        setCursor({ x: 95.5, y: 92, clicking: false, visible: true });
      }, 1900);
      const t2 = setTimeout(() => {
        setCursor({ x: 95.5, y: 92, clicking: true, visible: true });
      }, 2350);
      const t3 = setTimeout(() => {
        setMessageSent(true);
        setCursor({ x: 95.5, y: 92, clicking: false, visible: true });
      }, 2450);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else if (phase === 5) {
      // Step 5: Deal closed -> Cursor smoothly glides to Analytics tab in the sidebar and clicks it!
      setActiveNavTab("unified");
      setSelectedVisitor(true);
      setHumanMode(true);
      setMessageSent(true);
      setCursor({ x: 95.5, y: 92, clicking: false, visible: true });

      const t1 = setTimeout(() => {
        setDealClosed(true);
      }, 300);

      // Glides from the chat send button towards the Analytics tab in the sidebar
      const t2 = setTimeout(() => {
        setCursor({ x: 6.5, y: 21.5, clicking: false, visible: true });
      }, 700);

      // Clicks on the Analytics tab with ripple wave
      const t3 = setTimeout(() => {
        setCursor({ x: 6.5, y: 21.5, clicking: true, visible: true });
      }, 1550);

      // Activates the Analytics tab in the sidebar
      const t4 = setTimeout(() => {
        setActiveNavTab("analytics");
        setCursor({ x: 6.5, y: 21.5, clicking: false, visible: true });
      }, 1850);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }

  }, [phase]);

  const typedMerchantReply = useTypingText("Hey! I can offer an extra 2% discount if you complete checkout now.", phase === 4, 22);

  const sidebarNav = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "web", label: "Web Agent", icon: Globe, hasChevron: true },
    { id: "whatsapp", label: "WhatsApp Agent", icon: MessageCircle, hasChevron: true },
    { id: "unified", label: "Unified Assistant", icon: Inbox, badge: "LIVE" },
    { id: "email", label: "Email Agent", icon: Mail },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "kb", label: "Knowledge Base", icon: BookOpen },
    { id: "inbox", label: "Inbox", icon: Inbox },
    { id: "leads", label: "Leads", icon: UserIcon },
    { id: "quotations", label: "Quotations", icon: Receipt },
    { id: "workspace", label: "Workspace", icon: Building2 },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];


  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 490,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        background: "#F1F3F5",
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* ── Browser Chrome ── */}
      {/* Tab bar */}
      <div style={{ background: "#F1F3F5", borderBottom: "1px solid #E2E5E9", padding: "7px 14px 0", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: 5, paddingBottom: 7 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#FF5F56" }} />
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#27C93F" }} />
        </div>
        {/* Tab with smooth rounded top corners */}
        <div style={{ background: "#FFF", borderRadius: "10px 10px 0 0", padding: "4.5px 16px", fontSize: 9.5, fontWeight: 700, color: "#1E293B", display: "flex", alignItems: "center", gap: 6, border: "1px solid #E2E5E9", borderBottom: "1px solid #FFF", marginBottom: -1, zIndex: 1, boxShadow: "0 -1px 3px rgba(0,0,0,0.02)" }}>
          <img src="/logo-small.png" alt="Frosty" style={{ width: 12, height: 12, objectFit: "contain" }} />
          <span>Frosty — Merchant Console</span>
        </div>

      </div>
      {/* Address bar */}
      <div style={{ background: "#FFF", borderBottom: "1px solid #E9ECEF", padding: "6px 14px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 5, opacity: 0.35 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2"><path d="M9 18l6-6-6-6" /></svg>
        </div>
        <div style={{ flex: 1, background: "#F4F4F6", borderRadius: 8, padding: "4px 12px", fontSize: 10, color: "#475569", display: "flex", alignItems: "center", gap: 6, border: "1px solid #E2E8F0" }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          <span style={{ fontWeight: 600, fontSize: 10 }}>app.frostyagent.com/console</span>
        </div>
      </div>

      {/* ── Main Console Layout: Sidebar + Master Overview Workspace ── */}
      <div
        style={{
          flex: 1,
          background: "#FFFFFF",
          display: "grid",
          gridTemplateColumns: "135px 1fr",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Local Precision-Synced Cursor */}
        <SimCursor {...cursor} />

        {/* ── Left Sidebar matching Reference Image ── */}
        <aside
          style={{
            borderRight: "1px solid #F1F5F9",
            background: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
          }}
        >
          {/* Top Logo & Nav List */}
          <div style={{ overflowY: "auto", overflowX: "hidden", padding: "8px 6px 4px" }}>
            {/* Header: Frosty Brand & Menu */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 4px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <img src="/logo-small.png" alt="Frosty" style={{ width: 20, height: 20 }} />
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 900, color: "#0F172A", lineHeight: 1.1 }}>Frosty</div>
                  <div style={{ fontSize: 5.8, color: "#64748B", fontWeight: 500 }}>Merchant Console</div>
                </div>
              </div>
              <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 8, color: "#475569", lineHeight: 1 }}>☰</span>
              </div>
            </div>

            {/* Navigation Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 1.5, marginTop: 4 }}>
              {sidebarNav.map((item) => {
                const IconComponent = item.icon;
                const isAct = item.id === activeNavTab;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.id === "overview" || item.id === "unified" || item.id === "analytics") {
                        setActiveNavTab(item.id as "overview" | "unified" | "analytics");
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "3.5px 6px",
                      borderRadius: 6,
                      fontSize: 7.2,
                      fontWeight: isAct ? 800 : 500,
                      color: isAct ? "#0D9488" : "#64748B",
                      background: isAct ? "#F0FDFA" : "transparent",
                      border: isAct ? "1px solid #CCFBF1" : "1px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <IconComponent style={{ width: 10, height: 10, color: isAct ? "#0D9488" : "#94A3B8" }} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span style={{ fontSize: 5.5, fontWeight: 900, background: "#DCFCE7", color: "#16A34A", padding: "1px 3.5px", borderRadius: 3 }}>
                        {item.badge}
                      </span>
                    ) : item.hasChevron ? (
                      <ChevronRight style={{ width: 8, height: 8, color: "#CBD5E1" }} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Sidebar: Growth Plan & Profile */}
          <div style={{ padding: "4px 6px 6px", background: "#FFFFFF", borderTop: "1px solid #F1F5F9" }}>
            {/* Growth Plan Card */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 6px", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 7, fontWeight: 800, color: "#0F172A" }}>Growth Plan</span>
                <span style={{ fontSize: 7.5 }}>👑</span>
              </div>
              <div style={{ fontSize: 5.8, color: "#64748B", marginTop: 1 }}>76% of limit used</div>
              <div style={{ width: "100%", height: 3, background: "#E2E8F0", borderRadius: 99, marginTop: 3, overflow: "hidden" }}>
                <div style={{ width: "76%", height: "100%", background: "linear-gradient(90deg, #0396A6, #22D3EE)", borderRadius: 99 }} />
              </div>
              <div style={{ marginTop: 4, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 5, padding: "2px 4px", fontSize: 6, fontWeight: 800, color: "#0F172A", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                <span>Upgrade Plan</span>
                <span>➔</span>
              </div>
            </div>

            {/* Profile Row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 3px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 15, height: 15, borderRadius: "50%", background: "#F1F5F9", fontSize: 6.5, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center" }}>YT</div>
                <div>
                  <div style={{ fontSize: 7, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>Your team</div>
                  <div style={{ fontSize: 5.5, color: "#94A3B8" }}>Super Admin</div>
                </div>
              </div>
              <span style={{ fontSize: 6.5, color: "#94A3B8" }}>▾</span>
            </div>
          </div>
        </aside>

        {/* ── Main Workspace Body (Pure Awwwards Light Theme) ── */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#FAFAFC", overflow: "hidden", position: "relative" }}>
          {/* Top Header Bar */}
          <div
            style={{
              height: 32,
              minHeight: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              borderBottom: "1px solid #F1F5F9",
              background: "#FFFFFF",
              flexShrink: 0,
              gap: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.01)",
            }}
          >
            {/* Left: Title & Live Channels Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flexShrink: 0 }}>
              {activeNavTab === "unified" ? (
                <>
                  <div
                    style={{
                      width: 17,
                      height: 17,
                      borderRadius: 4.5,
                      background: "linear-gradient(135deg, rgba(3,150,166,0.12), rgba(34,211,238,0.18))",
                      border: "1px solid rgba(3,150,166,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Inbox style={{ width: 9.5, height: 9.5, color: "#0396A6" }} />
                  </div>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      color: "#0F172A",
                      whiteSpace: "nowrap",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Unified Assistant
                  </span>

                </>
              ) : activeNavTab === "analytics" ? (
                <>
                  <div
                    style={{
                      width: 17,
                      height: 17,
                      borderRadius: 4.5,
                      background: "linear-gradient(135deg, rgba(3,150,166,0.15), rgba(34,211,238,0.2))",
                      border: "1px solid rgba(3,150,166,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <BarChart3 style={{ width: 9.5, height: 9.5, color: "#0396A6" }} />
                  </div>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      color: "#0F172A",
                      whiteSpace: "nowrap",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Overview Analytics
                  </span>
                  <span
                    style={{
                      fontSize: 6.2,
                      fontWeight: 750,
                      background: "#F0FDFA",
                      color: "#0D9488",
                      border: "1px solid #CCFBF1",
                      padding: "1.5px 5.5px",
                      borderRadius: 99,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >

                  </span>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: 17,
                      height: 17,
                      borderRadius: 4.5,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <LayoutGrid style={{ width: 9.5, height: 9.5, color: "#0396A6" }} />
                  </div>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      color: "#0F172A",
                      whiteSpace: "nowrap",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Overview Console
                  </span>
                  <span
                    style={{
                      fontSize: 6.2,
                      fontWeight: 750,
                      background: "#F8FAFC",
                      color: "#64748B",
                      border: "1px solid #E2E8F0",
                      padding: "1.5px 5.5px",
                      borderRadius: 99,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    <span>Realtime Telemetry</span>
                  </span>
                </>
              )}
            </div>

            {/* Center / Search Input with ⌘K */}
            <div
              style={{
                flex: "0 1 140px",
                minWidth: 80,
                height: 19,
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 5,
                padding: "0 6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 4,
                flexShrink: 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 3.5, minWidth: 0, overflow: "hidden" }}>
                <Search style={{ width: 7.5, height: 7.5, color: "#94A3B8", flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: 6.5,
                    color: "#94A3B8",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Search anything...
                </span>
              </div>
              <kbd
                style={{
                  fontSize: 5.5,
                  fontWeight: 700,
                  color: "#64748B",
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: 3,
                  padding: "0.5px 3px",
                  lineHeight: 1,
                  flexShrink: 0,
                  fontFamily: "inherit",
                }}
              >
                ⌘K
              </kbd>
            </div>

            {/* Right Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 4.5, flexShrink: 0 }}>
              {/* Bell with badge */}
              <div
                style={{
                  position: "relative",
                  width: 19,
                  height: 19,
                  borderRadius: "50%",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Bell style={{ width: 8.5, height: 8.5, color: "#475569" }} />
                <span
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    minWidth: 8.5,
                    height: 8.5,
                    borderRadius: 99,
                    background: "#EF4444",
                    color: "#FFF",
                    fontSize: 5,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 1.5px",
                    border: "1px solid #FFFFFF",
                    lineHeight: 1,
                  }}
                >
                  3
                </span>
              </div>

              {/* Live Pill */}
              <span
                style={{
                  background: "#F0FDF4",
                  color: "#16A34A",
                  border: "1px solid #BBF7D0",
                  fontSize: 6.2,
                  fontWeight: 800,
                  padding: "1.5px 5.5px",
                  borderRadius: 99,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 3.5,
                    height: 3.5,
                    borderRadius: "50%",
                    background: "#22C55E",
                    boxShadow: "0 0 3px #22C55E",
                    display: "inline-block",
                  }}
                />
                <span>Live</span>
              </span>

              {/* User Pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 5,
                  padding: "1.5px 4.5px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: "#0F172A",
                    fontSize: 5.2,
                    fontWeight: 800,
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  YT
                </div>
                <span style={{ fontSize: 6.2, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap" }}>
                  Your team
                </span>
                <span style={{ fontSize: 5, color: "#94A3B8", marginLeft: -0.5 }}>▾</span>
              </div>
            </div>
          </div>

          {/* Main Scrollable Content */}
          <div style={{ flex: 1, padding: "7px 10px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
            {activeNavTab === "unified" ? (
              /* ── Production Frosty Unified CONVERSATIONS Layout matching User Reference ── */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "205px 1fr",
                  height: "100%",
                  background: "#FFFFFF",
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  overflow: "hidden",
                }}
              >
                {/* ── Left Column: CONVERSATIONS List ── */}
                <div
                  style={{
                    borderRight: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  {/* Header */}
                  <div style={{ padding: "7px 9px 5px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MessageCircle style={{ width: 10, height: 10, color: "#0396A6" }} />
                      <span style={{ fontSize: 7.8, fontWeight: 900, color: "#0F172A", letterSpacing: "0.04em" }}>CONVERSATIONS</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <RefreshCw style={{ width: 8, height: 8, color: "#64748B", cursor: "pointer" }} />
                      <span style={{ fontSize: 8, color: "#64748B", cursor: "pointer", lineHeight: 1 }}>✕</span>
                    </div>
                  </div>

                  {/* Channel Filter Pills */}
                  <div style={{ padding: "4px 8px", display: "flex", gap: 3, background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
                    <span style={{ fontSize: 6.2, fontWeight: 800, background: "#FFFFFF", color: "#0F172A", border: "1px solid #E2E8F0", padding: "2px 6px", borderRadius: 99, boxShadow: "0 1px 2px rgba(0,0,0,0.03)", cursor: "pointer" }}>
                      All (50)
                    </span>
                    <span style={{ fontSize: 6.2, fontWeight: 600, color: "#64748B", padding: "2px 5px", borderRadius: 99, cursor: "pointer" }}>
                      🌐 Web (36)
                    </span>
                    <span style={{ fontSize: 6.2, fontWeight: 600, color: "#64748B", padding: "2px 5px", borderRadius: 99, cursor: "pointer" }}>
                      📱 WA (14)
                    </span>
                  </div>

                  {/* Search Bar + Filter Icon */}
                  <div style={{ padding: "4px 8px", display: "flex", alignItems: "center", gap: 3, borderBottom: "1px solid #F1F5F9" }}>
                    <div style={{ flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 99, padding: "2.5px 7px", display: "flex", alignItems: "center", gap: 4 }}>
                      <Search style={{ width: 7.5, height: 7.5, color: "#94A3B8" }} />
                      <span style={{ fontSize: 6.2, color: "#94A3B8" }}>Search name, message, ID...</span>
                    </div>
                    <div style={{ width: 17, height: 17, borderRadius: 5, border: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Filter style={{ width: 8, height: 8, color: "#64748B" }} />
                    </div>
                  </div>

                  {/* Conversations Scroll List */}
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                    {/* Item 1: #WEB-132762 */}
                    <div style={{ padding: "5px 8px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 5, alignItems: "flex-start", opacity: 0.85 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#E0F2FE", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <UserIcon style={{ width: 9, height: 9 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 7, fontWeight: 800, color: "#0F172A" }}>#WEB-132762</span>
                          <span style={{ fontSize: 5.5, color: "#94A3B8" }}>5 HOURS AGO</span>
                        </div>
                        <div style={{ fontSize: 6.2, color: "#64748B", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>hi</div>
                        <div style={{ marginTop: 2 }}>
                          <span style={{ fontSize: 5.5, fontWeight: 800, background: "#F0FDFA", color: "#0D9488", border: "1px solid #CCFBF1", padding: "1px 4px", borderRadius: 3 }}>
                            🌐 WEB AGENT
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Item 2: Sneha Kapoor (Active Selected) */}
                    <div style={{ padding: "5px 8px", background: "#F0FDFA", borderLeft: "3px solid #0396A6", borderBottom: "1px solid #CCFBF1", display: "flex", gap: 5, alignItems: "flex-start" }}>
                      <div style={{ position: "relative", flexShrink: 0, marginTop: 1 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#CCFBF1", color: "#0F766E", fontSize: 6.8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          SK
                        </div>
                        <span style={{ position: "absolute", bottom: -1, right: -1, width: 4.5, height: 4.5, borderRadius: "50%", background: "#0396A6", border: "1px solid #FFF" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 7.2, fontWeight: 900, color: "#0F172A" }}>Sneha Kapoor</span>
                          <span style={{ fontSize: 5.5, color: "#64748B", fontWeight: 600 }}>6 HOURS AGO</span>
                        </div>
                        <div style={{ fontSize: 6.2, color: "#475569", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          Support team left the chat.
                        </div>
                        <div style={{ marginTop: 2 }}>
                          <span style={{ fontSize: 5.5, fontWeight: 800, background: "#CCFBF1", color: "#0F766E", padding: "1px 4px", borderRadius: 3 }}>
                            🌐 WEB AGENT
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Item 3: Dr. Meenakshi Sundaram */}
                    <div style={{ padding: "5px 8px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 5, alignItems: "flex-start", opacity: 0.85 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#DCFCE7", color: "#16A34A", fontSize: 6.8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        DS
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 7, fontWeight: 800, color: "#0F172A" }}>Dr. Meenakshi Sundaram</span>
                          <span style={{ fontSize: 5.5, color: "#94A3B8" }}>YESTERDAY</span>
                        </div>
                        <div style={{ fontSize: 6.2, color: "#64748B", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          We support full data isolation,...
                        </div>
                        <div style={{ marginTop: 2 }}>
                          <span style={{ fontSize: 5.5, fontWeight: 800, background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0", padding: "1px 4px", borderRadius: 3 }}>
                            📱 WA AGENT
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Item 4: Rohan Desai */}
                    <div style={{ padding: "5px 8px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 5, alignItems: "flex-start", opacity: 0.75 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#F1F5F9", color: "#64748B", fontSize: 6.8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        RD
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 7, fontWeight: 700, color: "#0F172A" }}>Rohan Desai</span>
                          <span style={{ fontSize: 5.5, color: "#94A3B8" }}>2 DAYS AGO</span>
                        </div>
                        <div style={{ fontSize: 6.2, color: "#94A3B8", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          Payment link generated
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Right Column: Active Conversation Feed ── */}
                <div
                  style={{
                    background: "#FAF8F5",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  {/* Top Chat Header */}
                  <div style={{ padding: "6px 12px", background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ position: "relative" }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#CCFBF1", color: "#0F766E", fontSize: 7.8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          SK
                        </div>
                        <span style={{ position: "absolute", bottom: -1, right: -1, width: 5, height: 5, borderRadius: "50%", background: "#0396A6", border: "1px solid #FFF" }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 8.8, fontWeight: 900, color: "#0F172A" }}>Sneha Kapoor</span>
                        <span style={{ fontSize: 5.8, fontWeight: 700, background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0", padding: "1px 4px", borderRadius: 3 }}>
                          CLOSED
                        </span>
                      </div>
                    </div>

                    {/* AI / HUMAN Toggle Switch + User Icon */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 6.2, fontWeight: 800, color: humanMode ? "#64748B" : "#0D9488" }}>AI</span>
                        {/* Switch Slider */}
                        <div
                          onClick={() => setHumanMode(!humanMode)}
                          style={{
                            width: 26,
                            height: 14,
                            borderRadius: 99,
                            background: humanMode ? "#F59E0B" : "#0396A6",
                            padding: 1.5,
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            transition: "background 0.25s ease",
                          }}
                        >
                          <motion.div
                            animate={{ x: humanMode ? 12 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            style={{ width: 11, height: 11, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
                          />
                        </div>
                        <span style={{ fontSize: 6.2, fontWeight: 800, color: humanMode ? "#B45309" : "#64748B" }}>HUMAN</span>
                      </div>

                      <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <UserIcon style={{ width: 9, height: 9, color: "#64748B" }} />
                      </div>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div style={{ flex: 1, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
                    {/* Customer Message */}
                    <div style={{ alignSelf: "flex-start", maxWidth: "80%", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "6px 9px", borderRadius: "10px 10px 10px 2px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                      <div style={{ fontSize: 6.8, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>Sneha Kapoor</div>
                      <div style={{ fontSize: 7.2, color: "#1E293B", lineHeight: 1.4 }}>
                        Does that include WhatsApp and live voice synthesis?
                      </div>
                      <div style={{ textAlign: "right", fontSize: 5.5, color: "#94A3B8", marginTop: 3 }}>6 days ago</div>
                    </div>

                    {/* AI Response Message */}
                    <div style={{ alignSelf: "flex-end", maxWidth: "82%", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "6px 9px", borderRadius: "10px 10px 2px 10px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                      <div style={{ fontSize: 6.8, fontWeight: 900, color: "#0396A6", marginBottom: 2 }}>AI</div>
                      <div style={{ fontSize: 7.2, color: "#1E293B", lineHeight: 1.4 }}>
                        Yes, annual Growth subscribers get WhatsApp integration and 100,000 complimentary voice synthesis characters included.
                      </div>
                      <div style={{ textAlign: "right", fontSize: 5.5, color: "#0396A6", marginTop: 3, fontWeight: 600 }}>
                        6 days ago <span style={{ color: "#0284C7" }}>✓✓</span>
                      </div>
                    </div>

                    {/* Merchant Human Reply (Appears in Phase 4 & 5) */}
                    {messageSent && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          alignSelf: "flex-end",
                          maxWidth: "85%",
                          background: "#FEF3C7",
                          color: "#78350F",
                          border: "1px solid #FCD34D",
                          padding: "6px 9px",
                          borderRadius: "10px 10px 2px 10px",
                          boxShadow: "0 2px 6px rgba(245,158,11,0.1)",
                        }}
                      >
                        <div style={{ fontSize: 6.2, fontWeight: 900, color: "#B45309", marginBottom: 1, display: "flex", alignItems: "center", gap: 3 }}>
                          <span>👨‍💼</span>
                          <span>Priya S. (Merchant Takeover)</span>
                        </div>
                        <div style={{ fontSize: 7.2, lineHeight: 1.4 }}>Hey! I can offer an extra 2% discount if you complete checkout now.</div>
                        <div style={{ textAlign: "right", fontSize: 5.5, color: "#B45309", marginTop: 2 }}>Just now ✓✓</div>
                      </motion.div>
                    )}

                    {/* Customer Live Acceptance (Appears in Phase 5) */}
                    {dealClosed && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.2 }}
                        style={{
                          alignSelf: "flex-start",
                          maxWidth: "80%",
                          background: "#16A34A",
                          color: "#FFFFFF",
                          padding: "6px 9px",
                          borderRadius: "10px 10px 10px 2px",
                          boxShadow: "0 3px 8px rgba(22,163,74,0.25)",
                        }}
                      >
                        <div style={{ fontSize: 7.2, fontWeight: 800 }}>Done! Placing order right now, thanks! 🎉</div>
                        <div style={{ textAlign: "right", fontSize: 5.5, color: "#DCFCE7", marginTop: 2 }}>Just now ✓✓</div>
                      </motion.div>
                    )}
                  </div>

                  {/* Status Indicator & Input Footer Bar */}
                  <div style={{ padding: "5px 12px 7px", background: "#FFFFFF", borderTop: "1px solid #F1F5F9" }}>
                    <div style={{ fontSize: 5.8, color: humanMode ? "#B45309" : "#0D9488", fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: humanMode ? "#F59E0B" : "#0D9488" }} />
                      <span>{humanMode ? "Human Co-Pilot active — toggle off to return to AI" : "AI auto-reply is active — toggle off to type"}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 99, padding: "4px 10px", fontSize: 6.8, color: humanMode ? "#0F172A" : "#94A3B8", minHeight: 14 }}>
                        {humanMode ? (typedMerchantReply || <span style={{ color: "#94A3B8" }}>Type reply as merchant...</span>) : "Turn off AI auto-reply to type..."}
                        {humanMode && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} style={{ borderRight: "1.5px solid #0396A6", marginLeft: 1 }} />}
                      </div>

                      {/* Circular Teal Floating Action Send Button with Paper Plane */}
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: humanMode ? "#0396A6" : "#2DD4BF",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          boxShadow: "0 2px 5px rgba(3,150,166,0.3)",
                          flexShrink: 0,
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeNavTab === "analytics" ? (
              /* ── Embedded SaaS Analytics Dashboard View ── */
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5.5, position: "relative", minHeight: 0, height: "100%" }}>
                {/* Confirmation Toast */}
                <AnimatePresence>
                  {analyticsToast && (
                    <motion.div
                      initial={{ opacity: 0, y: -16, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -12, scale: 0.95 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 10,
                        zIndex: 70,
                        background: "#0F172A",
                        color: "#FFFFFF",
                        borderRadius: 8,
                        padding: "6px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: 5, background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF" }}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <div>
                        <div style={{ fontSize: 8.5, fontWeight: 800, color: "#FFFFFF" }}>Analytics updated</div>
                        <div style={{ fontSize: 6.8, color: "#94A3B8" }}>Your dashboard preferences have been saved.</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Customization Modal */}
                <AnalyticsCustomizationModal
                  isOpen={isAnalyticsModalOpen}
                  onClose={() => setIsAnalyticsModalOpen(false)}
                  initialConfig={analyticsConfig}
                  onApply={handleApplyAnalyticsChanges}
                />

                {/* Analytics Header & Quick Controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 4, borderBottom: "1px solid #E2E8F0", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div>
                      <div style={{ fontSize: 9.5, fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>Performance &amp; Traffic Overview</div>
                      <div style={{ fontSize: 6, color: "#64748B", fontWeight: 500 }}>Updated 10:04 AM · cached ≤5m</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3.5, padding: "2.5px 6px", borderRadius: 5, background: "#FFFFFF", border: "1px solid #E2E8F0", fontSize: 6.8, fontWeight: 650, color: "#334155" }}>
                      <Calendar size={7.5} style={{ color: "#64748B" }} />
                      <span>Aug 25 – Sep 01, 2026</span>
                    </div>

                    <motion.button
                      whileHover={{ y: -1, scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setIsAnalyticsModalOpen(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "3px 9px",
                        borderRadius: 6,
                        background: "rgba(3, 150, 166, 0.1)",
                        border: "1px solid rgba(3, 150, 166, 0.35)",
                        color: "#0396A6",
                        fontSize: 7.5,
                        fontWeight: 800,
                        cursor: "pointer",
                        boxShadow: "0 1px 4px rgba(3,150,166,0.1)",
                      }}
                    >
                      <SlidersHorizontal size={9} strokeWidth={2.4} />
                      <span>Customize</span>
                    </motion.button>
                  </div>
                </div>

                {/* 6 KPI Cards Strip */}
                {analyticsConfig.widgets.kpi && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4.5, margin: "2px 0", flexShrink: 0 }}>
                    {SAAS_KPIS.map((kpi) => {
                      const isHov = analyticsHoveredKpi === kpi.id;
                      return (
                        <motion.div
                          key={kpi.id}
                          animate={{ y: isHov ? -2 : 0, scale: isHov ? 1.02 : 1 }}
                          whileHover={{ y: -2, scale: 1.02 }}
                          onMouseEnter={() => setAnalyticsHoveredKpi(kpi.id)}
                          onMouseLeave={() => setAnalyticsHoveredKpi(null)}
                          style={{
                            background: isHov ? "#F0FDFA" : "#FFFFFF",
                            border: isHov ? "1px solid #0396A6" : "1px solid #E2E8F0",
                            borderRadius: 6,
                            padding: "3.5px 5px",
                            boxShadow: isHov ? "0 4px 12px rgba(3,150,166,0.1)" : "0 1px 2px rgba(0,0,0,0.02)",
                            cursor: "default",
                            transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 1.5 }}>
                            <span style={{ fontSize: 5.5, fontWeight: 750, color: isHov ? "#0396A6" : "#94A3B8", letterSpacing: "0.03em" }}>{kpi.label}</span>
                            <kpi.icon size={7.5} style={{ color: isHov ? "#0396A6" : "#94A3B8" }} />
                          </div>
                          <div style={{ fontSize: 11.5, fontWeight: 800, color: isHov ? "#0396A6" : "#0F172A", lineHeight: 1 }}>{kpi.value}</div>
                          <div style={{ fontSize: 5.5, color: isHov ? "#0F766E" : "#64748B", fontWeight: isHov ? 750 : 600, marginTop: 1.2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isHov ? "100%" : 42 }}>{isHov ? kpi.hoverDetail : kpi.sub}</span>
                            {!isHov && <span style={{ color: kpi.positive ? "#16A34A" : "#64748B", fontWeight: 750, flexShrink: 0 }}>{kpi.trend}</span>}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Main Analytics Grid */}
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: analyticsConfig.widgets.topics ? "1.4fr 1fr" : "1fr", gap: 6, minHeight: 140, overflow: "hidden" }}>
                  {analyticsConfig.widgets.chart && (
                    <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E2E8F0", padding: "6px 8px 4px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <span style={{ fontSize: 7.8, fontWeight: 800, color: "#0F172A" }}>Conversations &amp; Messages</span>
                          <span style={{ fontSize: 5.5, color: "#94A3B8" }}>ⓘ</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 5.5 }}>
                          {analyticsConfig.selectedMetrics.includes("msg") && (
                            <span style={{ display: "flex", alignItems: "center", gap: 2, color: "#64748B", fontWeight: 700 }}>
                              <i style={{ width: 4, height: 4, borderRadius: "50%", background: currentAnalyticsColor.hex }} />
                              Messages
                            </span>
                          )}
                          {analyticsConfig.selectedMetrics.includes("conv") && (
                            <span style={{ display: "flex", alignItems: "center", gap: 2, color: "#64748B", fontWeight: 700 }}>
                              <i style={{ width: 4, height: 4, borderRadius: "50%", background: "#F59E0B" }} />
                              Sessions
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ flex: 1, minHeight: 95, position: "relative" }}>
                        <DynamicAnalyticsChart
                          config={analyticsConfig}
                          hoveredPoint={analyticsHoveredPoint}
                          setHoveredPoint={setAnalyticsHoveredPoint}
                          hoveredSlice={analyticsHoveredSlice}
                          setHoveredSlice={setAnalyticsHoveredSlice}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 2.5, borderTop: "1px solid #F1F5F9", fontSize: 5.8, color: "#64748B", fontWeight: 650 }}>
                        <span>Peak: Aug 27 (98 msg)</span>
                        <span style={{ color: "#16A34A" }}>+18% volume vs last week</span>
                      </div>
                    </div>
                  )}

                  {analyticsConfig.widgets.topics && (
                    <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E2E8F0", padding: "6px 8px 4px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 7.8, fontWeight: 800, color: "#0F172A" }}>Top Topics</span>
                        <span style={{ fontSize: 5.8, fontWeight: 700, color: "#0396A6" }}>44 Topics</span>
                      </div>

                      <div style={{ flex: 1, minHeight: 95, position: "relative" }}>
                        <DynamicAnalyticsChart
                          config={{ ...analyticsConfig, chartType: "donut" }}
                          hoveredPoint={analyticsHoveredPoint}
                          setHoveredPoint={setAnalyticsHoveredPoint}
                          hoveredSlice={analyticsHoveredSlice}
                          setHoveredSlice={setAnalyticsHoveredSlice}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 2.5, borderTop: "1px solid #F1F5F9", fontSize: 5.8, color: "#64748B", fontWeight: 650 }}>
                        <span>Top intent: FAQ (80%)</span>
                        <span style={{ color: "#0396A6" }}>100% resolved</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom AI Insight & Performance Strip */}
                <div style={{ display: "grid", gridTemplateColumns: analyticsConfig.widgets.performance ? "1.5fr 1fr" : "1fr", gap: 6, flexShrink: 0 }}>
                  {analyticsConfig.widgets.insights && (
                    <div style={{ background: "linear-gradient(135deg, #F0FDFA 0%, #E0F2FE 100%)", border: "1px solid #CCFBF1", borderRadius: 7, padding: "4px 8px", display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#0396A6", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Sparkles size={8.5} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 6.5, fontWeight: 800, color: "#0F766E" }}>✨ AI Automated Insight</div>
                        <div style={{ fontSize: 5.8, color: "#334155", fontWeight: 600, lineHeight: 1.25 }}>
                          Conversion rate improved by 12% this week. International shoppers most active between 5AM–8AM UTC.
                        </div>
                      </div>
                    </div>
                  )}

                  {analyticsConfig.widgets.performance && (
                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 7, padding: "4px 7px", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 5.2, color: "#94A3B8", fontWeight: 700 }}>Conversion</div>
                        <div style={{ fontSize: 7.8, fontWeight: 800, color: "#16A34A" }}>39%</div>
                      </div>
                      <div style={{ width: 1, height: 14, background: "#F1F5F9" }} />
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 5.2, color: "#94A3B8", fontWeight: 700 }}>Avg Response</div>
                        <div style={{ fontSize: 7.8, fontWeight: 800, color: "#0396A6" }}>2.1s</div>
                      </div>
                      <div style={{ width: 1, height: 14, background: "#F1F5F9" }} />
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 5.2, color: "#94A3B8", fontWeight: 700 }}>CSAT</div>
                        <div style={{ fontSize: 7.8, fontWeight: 800, color: "#F59E0B" }}>4.6/5</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── Master Overview Dashboard View ── */
              <>


                {/* Section 1: "Needs Attention" Action Bar */}
                <div style={{ background: "#FFFBEB", border: "1.2px solid #FEF3C7", borderRadius: 10, padding: "5px 9px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 10 }}>⚠️</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 7.5, fontWeight: 800, color: "#78350F" }}>Needs Attention</div>
                      <div style={{ fontSize: 5.8, color: "#92400E" }}>3 items require your action</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 4.5, flex: 1, justifyContent: "flex-end" }}>
                    <div style={{ background: "#FFFFFF", border: "1px solid #FEF3C7", borderRadius: 7, padding: "2.5px 6px", display: "flex", alignItems: "center", gap: 4, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                      <span style={{ fontSize: 8 }}>🎧</span>
                      <div style={{ fontSize: 6.8, fontWeight: 800, color: "#0F172A" }}>6 <span style={{ fontWeight: 500, fontSize: 6, color: "#64748B" }}>Handoffs waiting</span></div>
                      <span style={{ fontSize: 6.5, color: "#92400E", fontWeight: 800 }}>➔</span>
                    </div>

                    <div style={{ background: "#FFFFFF", border: "1px solid #FEF3C7", borderRadius: 7, padding: "2.5px 6px", display: "flex", alignItems: "center", gap: 4, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                      <span style={{ fontSize: 8 }}>📅</span>
                      <div style={{ fontSize: 6.8, fontWeight: 800, color: "#0F172A" }}>4 <span style={{ fontWeight: 500, fontSize: 6, color: "#64748B" }}>Meetings need confirm</span></div>
                      <span style={{ fontSize: 6.5, color: "#92400E", fontWeight: 800 }}>➔</span>
                    </div>

                    <div style={{ background: "#FFFFFF", border: "1px solid #FEF3C7", borderRadius: 7, padding: "2.5px 6px", display: "flex", alignItems: "center", gap: 4, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                      <span style={{ fontSize: 8 }}>💬</span>
                      <div style={{ fontSize: 6.8, fontWeight: 800, color: "#0F172A" }}>12 <span style={{ fontWeight: 500, fontSize: 6, color: "#64748B" }}>Open conversations</span></div>
                      <span style={{ fontSize: 6.5, color: "#92400E", fontWeight: 800 }}>➔</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Quick Action Buttons & Time Range Selector */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 99, padding: "2px 7px", fontSize: 6.5, fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
                      <RefreshCw style={{ width: 7.5, height: 7.5, color: "#0396A6" }} />
                      <span>Clear Cache</span>
                    </div>
                    <div style={{ background: "linear-gradient(135deg, #0396A6, #0284C7)", borderRadius: 99, padding: "2px 8px", fontSize: 6.5, fontWeight: 800, color: "#FFFFFF", display: "flex", alignItems: "center", gap: 3, cursor: "pointer", boxShadow: "0 2px 5px rgba(3,150,166,0.25)" }}>
                      <span>Configure Bot</span>
                      <span>➔</span>
                    </div>
                  </div>

                  {/* Time Range Pills */}
                  <div style={{ display: "flex", background: "#F1F5F9", padding: "1.5px", borderRadius: 99, gap: 1 }}>
                    {(["7d", "14d", "30d", "90d"] as const).map((key) => {
                      const labelMap = { "7d": "7 Days", "14d": "14 Days", "30d": "30 Days", "90d": "90 Days" };
                      const isAct = selectedTimeRange === key;
                      return (
                        <motion.span
                          key={key}
                          animate={{
                            background: isAct ? "#0284C7" : "transparent",
                            color: isAct ? "#FFFFFF" : "#64748B",
                          }}
                          style={{
                            padding: "1.5px 6px",
                            borderRadius: 99,
                            fontSize: 6.2,
                            fontWeight: isAct ? 800 : 600,
                            cursor: "pointer",
                          }}
                        >
                          {labelMap[key]}
                        </motion.span>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Radiant Hero Promo Banner with 3D Bot */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #08505E 0%, #0384A6 55%, #0284C7 100%)",
                    borderRadius: 10,
                    padding: "7px 11px",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "relative",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ zIndex: 1, maxWidth: "68%" }}>
                    <div style={{ fontSize: 8.8, fontWeight: 900, letterSpacing: "-0.01em" }}>Unlock Unlimited AI Conversations &amp; Custom Bots</div>
                    <div style={{ fontSize: 6.2, opacity: 0.88, marginTop: 1.5, lineHeight: 1.3 }}>Upgrade to Growth tier today and receive 20% bonus conversation credits for your team.</div>
                    <div style={{ marginTop: 4, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.35)", backdropFilter: "blur(6px)", borderRadius: 99, padding: "2px 8px", fontSize: 6, fontWeight: 800, color: "#FFFFFF", display: "inline-block" }}>
                      Learn More
                    </div>
                  </div>

                  {/* 3D Cute AI Robot Visual */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, zIndex: 1 }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(4px)", borderRadius: 5, padding: "1.5px 4px", fontSize: 5.5, color: "#FFFFFF", marginBottom: 2, display: "flex", alignItems: "center", gap: 2 }}>
                        <span>💬</span>
                        <span>Ready to assist!</span>
                      </div>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "radial-gradient(circle, #FFFFFF 0%, #E0F2FE 80%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }}>
                        <Bot style={{ width: 20, height: 20, color: "#0369A1" }} />
                      </div>
                    </div>
                    <span style={{ position: "absolute", top: 5, right: 6, fontSize: 7, opacity: 0.6, cursor: "pointer" }}>✕</span>
                  </div>
                </div>

                {/* Section 4: 4 Modern Metric KPI Cards with Sparklines */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5, flexShrink: 0 }}>
                  {/* KPI 1: Conversations */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 7px 5px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderBottom: "2.5px solid #0284C7" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MessageCircle style={{ width: 9, height: 9, color: "#2563EB" }} />
                      </div>
                      <svg width="34" height="12" viewBox="0 0 40 14" fill="none">
                        <path d="M 0 10 Q 10 12, 18 6 T 30 4 T 40 8" stroke="#0284C7" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>21</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 1 }}>
                      <span style={{ fontSize: 5.5, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.04em" }}>CONVERSATIONS</span>
                      <span style={{ fontSize: 5.5, fontWeight: 800, color: "#16A34A" }}>+1 today</span>
                    </div>
                  </div>

                  {/* KPI 2: Messages */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 7px 5px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderBottom: "2.5px solid #7C3AED" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Bot style={{ width: 9, height: 9, color: "#7C3AED" }} />
                      </div>
                      <svg width="34" height="12" viewBox="0 0 40 14" fill="none">
                        <path d="M 0 12 Q 10 11, 20 5 T 30 7 T 40 11" stroke="#7C3AED" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>275</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 1 }}>
                      <span style={{ fontSize: 5.5, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.04em" }}>MESSAGES</span>
                      <span style={{ fontSize: 5.5, fontWeight: 600, color: "#64748B" }}>275 grounded</span>
                    </div>
                  </div>

                  {/* KPI 3: Leads Captured */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 7px 5px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderBottom: "2.5px solid #16A34A" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Users style={{ width: 9, height: 9, color: "#16A34A" }} />
                      </div>
                      <svg width="34" height="12" viewBox="0 0 40 14" fill="none">
                        <path d="M 0 11 Q 12 11, 20 4 T 30 6 T 40 11" stroke="#16A34A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>15</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 1 }}>
                      <span style={{ fontSize: 5.5, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.04em" }}>LEADS CAPTURED</span>
                      <span style={{ fontSize: 5.5, fontWeight: 600, color: "#64748B" }}>42 in 30d</span>
                    </div>
                  </div>

                  {/* KPI 4: Credits Left */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 7px 5px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderBottom: "2.5px solid #EA580C" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Zap style={{ width: 9, height: 9, color: "#EA580C" }} />
                      </div>
                      <svg width="34" height="12" viewBox="0 0 40 14" fill="none">
                        <path d="M 0 4 Q 10 5, 20 8 T 32 10 T 40 12" stroke="#EA580C" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>5,237</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 1 }}>
                      <span style={{ fontSize: 5.5, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.04em" }}>CREDITS LEFT</span>
                      <span style={{ fontSize: 5.5, fontWeight: 600, color: "#64748B" }}>2020 used</span>
                    </div>
                  </div>
                </div>

                {/* Section 5: 3-Column Bottom Overview Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", gap: 5, flexShrink: 0 }}>
                  {/* Column 1: Recent Conversations */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 7px", display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 7.2, fontWeight: 800, color: "#0F172A" }}>Recent Conversations</span>
                      <span style={{ fontSize: 5.8, fontWeight: 700, color: "#0396A6", cursor: "pointer" }}>View all</span>
                    </div>
                    <div style={{ background: "#F8FAFC", border: "1px solid #F1F5F9", borderRadius: 6, padding: "3.5px 5px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 15, height: 15, borderRadius: "50%", background: "#DCFCE7", color: "#16A34A", fontSize: 6, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>AM</div>
                        <div>
                          <div style={{ fontSize: 6.8, fontWeight: 800, color: "#0F172A" }}>Arjun Mehta</div>
                          <div style={{ fontSize: 5.5, color: "#64748B" }}>Bulk order for Sony WH-1000XM5</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 5.2, color: "#94A3B8" }}>03:42 PM</div>
                        <span style={{ display: "inline-block", width: 3.5, height: 3.5, borderRadius: "50%", background: "#22C55E", marginTop: 1 }} />
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Upcoming Meetings */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 7px", display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 7.2, fontWeight: 800, color: "#0F172A" }}>Upcoming Meetings</span>
                      <span style={{ fontSize: 5.8, fontWeight: 700, color: "#0396A6", cursor: "pointer" }}>View all</span>
                    </div>
                    <div style={{ background: "#F8FAFC", border: "1px solid #F1F5F9", borderRadius: 6, padding: "3.5px 5px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 15, height: 15, borderRadius: 4, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Calendar style={{ width: 8, height: 8, color: "#2563EB" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 6.8, fontWeight: 800, color: "#0F172A" }}>Team Sync Meeting</div>
                          <div style={{ fontSize: 5.5, color: "#64748B" }}>Today • 5:30 PM • Google Meet</div>
                        </div>
                      </div>
                      <span style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 4, padding: "1.5px 4.5px", fontSize: 5.8, fontWeight: 800, color: "#0F172A" }}>Join</span>
                    </div>
                  </div>

                  {/* Column 3: Top Agents */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 7px", display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 7.2, fontWeight: 800, color: "#0F172A" }}>Top Agents</span>
                      <span style={{ fontSize: 5.8, fontWeight: 700, color: "#0396A6", cursor: "pointer" }}>View all</span>
                    </div>
                    <div style={{ background: "#F8FAFC", border: "1px solid #F1F5F9", borderRadius: 6, padding: "3.5px 5px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                        <div style={{ width: 15, height: 15, borderRadius: 4, background: "#F0FDFA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Globe style={{ width: 8, height: 8, color: "#0D9488" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 6.8, fontWeight: 800, color: "#0F172A" }}>Website Agent</span>
                            <span style={{ fontSize: 5.8, fontWeight: 800, color: "#0D9488" }}>92%</span>
                          </div>
                          <div style={{ width: "100%", height: 2.5, background: "#E2E8F0", borderRadius: 99, marginTop: 2, overflow: "hidden" }}>
                            <div style={{ width: "92%", height: "100%", background: "#0D9488", borderRadius: 99 }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




/* ── Beat 10: Autonomous Enterprise CRM Database & Multi-Column Deep Pipeline ── */
const CRM_DATABASE_ROWS = [
  {
    id: "lead-1",
    avatar: "AM",
    avatarBg: "#DCFCE7",
    avatarFg: "#16A34A",
    name: "Arjun Mehta",
    company: "VP Procurement · Apex Retail Corp",
    channel: "WhatsApp",
    channelType: "whatsapp",
    intent: "92%",
    intentLabel: "HOT",
    intentColor: "#DC2626",
    intentBg: "#FEF2F2",
    dealValue: "₹10,75,000",
    dealDetail: "50 units Sony WH-1000XM5",
    summary: "Calculated 14% bulk tier. Google Meet scheduled for final contract.",
    email: "arjun.mehta@apexretail.in",
    emailVerified: true,
    phone: "+91 98201 44819",
    meeting: "📅 Google Meet 🔗",
    stage: "Deal Won 🏆",
    stageColor: "#15803D",
    stageBg: "#DCFCE7",
    followup: "✓ Auto-Sent (WhatsApp)",
    lastActive: "Just now",
  },
  {
    id: "lead-2",
    avatar: "4C",
    avatarBg: "#E0F2FE",
    avatarFg: "#0284C7",
    name: "Visitor #4c1a (Neha Sharma)",
    company: "Studio Owner · Pune Design Labs",
    channel: "Website",
    channelType: "website",
    intent: "88%",
    intentLabel: "READY TO BUY",
    intentColor: "#0284C7",
    intentBg: "#F0F9FF",
    dealValue: "₹68,400",
    dealDetail: "2x Studio Pro Wireless",
    summary: "Inquired Pune express shipping. Offered 2% checkout incentive. Paid via Razorpay UPI.",
    email: "neha.sharma@punestudio.com",
    emailVerified: true,
    phone: "+91 98765 43210",
    meeting: "✓ Instant Razorpay Receipt",
    stage: "Deal Won 🏆",
    stageColor: "#15803D",
    stageBg: "#DCFCE7",
    followup: "✓ Receipt Synced",
    lastActive: "2m ago",
  },
  {
    id: "lead-3",
    avatar: "RV",
    avatarBg: "#FEF3C7",
    avatarFg: "#D97706",
    name: "Rohan Verma",
    company: "Founder · TechNova Labs",
    channel: "WhatsApp",
    channelType: "whatsapp",
    intent: "84%",
    intentLabel: "WARM",
    intentColor: "#D97706",
    intentBg: "#FEF3C7",
    dealValue: "₹14,999",
    dealDetail: "1x Quick Creator Kit",
    summary: "Confirmed warranty & delivery window. Payment link generated.",
    email: "rohan@technovalabs.io",
    emailVerified: false,
    phone: "+91 99887 76655",
    meeting: "💳 Payment Link Sent",
    stage: "In Negotiation 💬",
    stageColor: "#B45309",
    stageBg: "#FEF3C7",
    followup: "⏳ Scheduled 24h",
    lastActive: "14m ago",
  },
  {
    id: "lead-4",
    avatar: "VS",
    avatarBg: "#F3E8FF",
    avatarFg: "#7E22CE",
    name: "Vikram Singhal",
    company: "Director · Singhal Logistics",
    channel: "Website",
    channelType: "website",
    intent: "96%",
    intentLabel: "ENTERPRISE",
    intentColor: "#7E22CE",
    intentBg: "#F3E8FF",
    dealValue: "₹4,50,000",
    dealDetail: "Custom Fleet SLA (20 seats)",
    summary: "Requested enterprise SLA contract & GST invoice for fleet onboarding.",
    email: "v.singhal@singhallogistics.com",
    emailVerified: true,
    phone: "+91 98112 33445",
    meeting: "📅 Tomorrow 11:00 AM · Zoom 🔗",
    stage: "Contract Sent 📄",
    stageColor: "#0369A1",
    stageBg: "#E0F2FE",
    followup: "✓ Follow-Up Queued",
    lastActive: "1h ago",
  },
  {
    id: "lead-5",
    avatar: "PS",
    avatarBg: "#F1F5F9",
    avatarFg: "#64748B",
    name: "Pooja Sharma",
    company: "Founder · Luxe Crafts Studio",
    channel: "WhatsApp",
    channelType: "whatsapp",
    intent: "76%",
    intentLabel: "INQUIRY",
    intentColor: "#475569",
    intentBg: "#F1F5F9",
    dealValue: "₹28,500",
    dealDetail: "Wholesale Sample Pack (3 items)",
    summary: "Digital catalog shared. Selected 3 items for sample delivery evaluation.",
    email: "pooja@luxecrafts.in",
    emailVerified: false,
    phone: "+91 97654 11223",
    meeting: "📦 Sample Tracking Synced",
    stage: "Proposal Sent 📑",
    stageColor: "#64748B",
    stageBg: "#F1F5F9",
    followup: "✓ Auto-Delivered",
    lastActive: "3h ago",
  },
];



/* ═══════════════════════════════════════════════════════════════════
   Beat 11: Real SaaS Analytics Dashboard & Complete Customization Workflow
   Dashboard → Customize → Configuration Modal → Live Preview Changes → Apply → Updated Dashboard
   ═══════════════════════════════════════════════════════════════════ */

type ChartTypeOption = "line" | "bar" | "area" | "pie" | "donut";

interface DashboardConfig {
  chartType: ChartTypeOption;
  selectedMetrics: string[]; // ids from AVAILABLE_METRICS
  colorId: string;           // "teal" | "blue" | "purple" | "green" | "orange" | "red" | "custom"
  customColorHex: string;
  timeRange: "7d" | "14d" | "30d" | "90d" | "custom";
  showLegend: boolean;
  showGrid: boolean;
  showDataLabels: boolean;
  showTooltip: boolean;
  smoothLines: boolean;
  widgets: {
    kpi: boolean;
    chart: boolean;
    topics: boolean;
    insights: boolean;
    performance: boolean;
    funnel: boolean;
    responseTime: boolean;
  };
}

const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  chartType: "line",
  selectedMetrics: ["conv", "msg"],
  colorId: "teal",
  customColorHex: "#0396A6",
  timeRange: "7d",
  showLegend: true,
  showGrid: true,
  showDataLabels: false,
  showTooltip: true,
  smoothLines: true,
  widgets: {
    kpi: true,
    chart: true,
    topics: true,
    insights: true,
    performance: true,
    funnel: false,
    responseTime: false,
  },
};

const COLOR_PRESETS = [
  { id: "teal", name: "Teal", hex: "#0396A6", fill: "rgba(3, 150, 166, 0.22)" },
  { id: "blue", name: "Blue", hex: "#2563EB", fill: "rgba(37, 99, 235, 0.22)" },
  { id: "purple", name: "Purple", hex: "#7C3AED", fill: "rgba(124, 58, 237, 0.22)" },
  { id: "green", name: "Green", hex: "#10B981", fill: "rgba(16, 185, 129, 0.22)" },
  { id: "orange", name: "Orange", hex: "#F97316", fill: "rgba(249, 115, 22, 0.22)" },
  { id: "red", name: "Red", hex: "#EF4444", fill: "rgba(239, 68, 68, 0.22)" },
];

function resolveChartColor(cfg: DashboardConfig): { hex: string; fill: string } {
  if (cfg.colorId === "custom") {
    const hex = cfg.customColorHex || "#0396A6";
    return { hex, fill: `${hex}33` };
  }
  const found = COLOR_PRESETS.find((c) => c.id === cfg.colorId);
  return found ? { hex: found.hex, fill: found.fill } : { hex: "#0396A6", fill: "rgba(3, 150, 166, 0.22)" };
}

const AVAILABLE_METRICS = [
  { id: "conv", label: "Conversations", color: "#0396A6", val: "23" },
  { id: "msg", label: "Messages", color: "#F59E0B", val: "98" },
  { id: "leads", label: "Leads", color: "#10B981", val: "9" },
  { id: "conv_rate", label: "Conversion Rate", color: "#8B5CF6", val: "39%" },
  { id: "resp_time", label: "Response Time", color: "#06B6D4", val: "2.1s" },
  { id: "res_rate", label: "Resolution Rate", color: "#EC4899", val: "86%" },
  { id: "csat", label: "Customer Satisfaction", color: "#EAB308", val: "4.6/5" },
];

interface MetricPointDetails {
  day: string;
  fullDate: string;
  msg: number;
  conv: number;
  leads: number;
  conv_rate: number;
  resp: number;
  aiResolved: number;
  x: number;
  yMsg: number;
  isPeak?: boolean;
  highlightText: string;
}

const METRIC_DATA_POINTS: MetricPointDetails[] = [
  { day: "Aug 25", fullDate: "Sun, Aug 25", msg: 28, conv: 7, leads: 2, conv_rate: 32, resp: 2.4, aiResolved: 82, x: 24, yMsg: 82, highlightText: "Weekend inquiries auto-handled" },
  { day: "Aug 26", fullDate: "Mon, Aug 26", msg: 42, conv: 11, leads: 3, conv_rate: 35, resp: 2.2, aiResolved: 86, x: 72, yMsg: 70, highlightText: "Early week volume pickup" },
  { day: "Aug 27", fullDate: "Tue, Aug 27 · Peak Traffic", msg: 98, conv: 23, leads: 9, conv_rate: 39, resp: 1.8, aiResolved: 89, x: 120, yMsg: 18, isPeak: true, highlightText: "Peak volume: 89% AI resolved in <2s" },
  { day: "Aug 28", fullDate: "Wed, Aug 28", msg: 36, conv: 9, leads: 3, conv_rate: 34, resp: 2.1, aiResolved: 88, x: 168, yMsg: 74, highlightText: "Steady qualified conversions" },
  { day: "Aug 29", fullDate: "Thu, Aug 29", msg: 24, conv: 6, leads: 2, conv_rate: 31, resp: 2.5, aiResolved: 85, x: 216, yMsg: 85, highlightText: "High satisfaction ratings" },
  { day: "Aug 30", fullDate: "Fri, Aug 30", msg: 32, conv: 8, leads: 3, conv_rate: 36, resp: 2.3, aiResolved: 87, x: 264, yMsg: 78, highlightText: "Afternoon conversion surge" },
  { day: "Sep 01", fullDate: "Sun, Sep 01", msg: 54, conv: 14, leads: 5, conv_rate: 38, resp: 2.0, aiResolved: 91, x: 312, yMsg: 60, highlightText: "Month-start promotion boost" },
];

const SAAS_KPIS = [
  { id: "conv", label: "CONVERSATIONS", value: "23", sub: "sessions", trend: "-12%", icon: MessageCircle, positive: false, hoverDetail: "Avg length 3m 40s · 100% replied" },
  { id: "msg", label: "MESSAGES", value: "98", sub: "user + AI + agent", trend: "+18%", icon: Activity, positive: true, hoverDetail: "72 AI generated · 26 user messages" },
  { id: "leads", label: "LEADS", value: "9", sub: "captured", trend: "+33%", icon: Users, positive: true, hoverDetail: "₹4,20,000 estimated sales pipeline" },
  { id: "conv_rate", label: "CONVERSION", value: "39%", sub: "leads + convs", trend: "+12%", icon: TrendingUp, positive: true, hoverDetail: "3.2x above e-commerce benchmark" },
  { id: "avg_session", label: "AVG/SESSION", value: "4.3", sub: "messages", trend: "0.2s faster", icon: Clock, positive: true, hoverDetail: "Sub-second autonomous replies" },
  { id: "peak_hour", label: "PEAK HOUR", value: "6am", sub: "UTC busiest", trend: "Tue peak", icon: Zap, positive: true, hoverDetail: "Most international shoppers active" },
];

const DONUT_TOPICS_LIST = [
  { id: "faq", label: "FAQ", count: 35, pct: 80, color: "#0396A6", desc: "Pricing, shipping & store policies", aiRate: "100% automated" },
  { id: "pricing", label: "Pricing & Discounts", count: 3, pct: 7, color: "#F59E0B", desc: "Enterprise plan quotes", aiRate: "Instant quote delivered" },
  { id: "booking", label: "Appointments", count: 3, pct: 7, color: "#10B981", desc: "Consultation calendar booked", aiRate: "Cal.com synced" },
  { id: "support", label: "Technical Support", count: 3, pct: 6, color: "#6366F1", desc: "Integration troubleshooting", aiRate: "Escalated to Slack" },
];

const WIDGET_OPTIONS = [
  { id: "kpi" as const, label: "KPI Overview", desc: "6 metric cards at top of dashboard" },
  { id: "chart" as const, label: "Conversations & Messages", desc: "Primary time-series volume chart" },
  { id: "topics" as const, label: "Top Topics", desc: "Intent classification donut breakdown" },
  { id: "insights" as const, label: "AI Insights", desc: "Autonomous highlights and anomalies" },
  { id: "performance" as const, label: "Performance", desc: "Resolution rate and customer satisfaction" },
  { id: "funnel" as const, label: "Leads Funnel", desc: "Funnel drop-off and capture pipeline" },
  { id: "responseTime" as const, label: "Response Time", desc: "Latency & handoff telemetry" },
];

/* ── Dynamic Chart Component (used in both Dashboard and Modal Live Preview) ── */
function DynamicAnalyticsChart({
  config,
  isLivePreview = false,
  hoveredPoint,
  setHoveredPoint,
  hoveredSlice,
  setHoveredSlice,
}: {
  config: DashboardConfig;
  isLivePreview?: boolean;
  hoveredPoint?: MetricPointDetails | null;
  setHoveredPoint?: (pt: MetricPointDetails | null) => void;
  hoveredSlice?: string | null;
  setHoveredSlice?: (id: string | null) => void;
}) {
  const chartColor = resolveChartColor(config);
  const showMessages = config.selectedMetrics.includes("msg");
  const showConvs = config.selectedMetrics.includes("conv");

  // Donut geometry
  const donutR = isLivePreview ? 28 : 34;
  const donutC = 2 * Math.PI * donutR;
  let donutOffset = 0;
  const selectedTopic = DONUT_TOPICS_LIST.find((s) => s.id === hoveredSlice);

  if (config.chartType === "donut" || config.chartType === "pie") {
    const isPie = config.chartType === "pie";
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "0 6px",
          position: "relative",
        }}
      >
        <div style={{ position: "relative", width: isLivePreview ? 76 : 94, height: isLivePreview ? 76 : 94, flexShrink: 0 }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ transform: "rotate(-90deg)" }}>
            {DONUT_TOPICS_LIST.map((slice) => {
              const len = (donutC * slice.pct) / 100;
              const isHov = hoveredSlice === slice.id;
              const offset = donutOffset;
              donutOffset += len;

              return (
                <motion.circle
                  key={slice.id}
                  initial={{ strokeDasharray: `0 ${donutC}` }}
                  animate={{
                    strokeDasharray: `${len.toFixed(1)} ${(donutC - len).toFixed(1)}`,
                    strokeWidth: isPie ? 40 : isHov ? 15 : 11,
                  }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  cx="50"
                  cy="50"
                  r={isPie ? 25 : donutR}
                  fill="none"
                  stroke={slice.color}
                  strokeDashoffset={-offset.toFixed(1)}
                  strokeLinecap={isPie ? "butt" : "round"}
                  onMouseEnter={() => setHoveredSlice?.(slice.id)}
                  onMouseLeave={() => setHoveredSlice?.(null)}
                  style={{ cursor: "pointer", filter: isHov ? "drop-shadow(0 2px 8px rgba(0,0,0,0.25))" : "none" }}
                />
              );
            })}
          </svg>

          {!isPie && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <span style={{ fontSize: isLivePreview ? 11 : 13, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>
                44
              </span>
              <span style={{ fontSize: 5.5, fontWeight: 700, color: "#94A3B8", marginTop: 1, textTransform: "uppercase" }}>
                Topics
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: isLivePreview ? 2.5 : 3.5, minWidth: isLivePreview ? 100 : 130 }}>
          {DONUT_TOPICS_LIST.map((slice) => {
            const isHov = hoveredSlice === slice.id;
            return (
              <motion.div
                key={slice.id}
                onMouseEnter={() => setHoveredSlice?.(slice.id)}
                onMouseLeave={() => setHoveredSlice?.(null)}
                animate={{ scale: isHov ? 1.05 : 1, x: isHov ? 2 : 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 6,
                  padding: "1.5px 4px",
                  borderRadius: 4,
                  background: isHov ? "#FFFFFF" : "transparent",
                  boxShadow: isHov ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 3.5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: slice.color, flexShrink: 0 }} />
                  <span style={{ fontSize: isLivePreview ? 6.2 : 6.8, fontWeight: isHov ? 800 : 650, color: "#1E293B" }}>
                    {slice.label}
                  </span>
                </div>
                <span style={{ fontSize: isLivePreview ? 6.2 : 6.8, fontWeight: 800, color: slice.color }}>
                  {slice.pct}%
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Floating Topic Insight Detail Badge when hovered */}
        <AnimatePresence>
          {selectedTopic && !isLivePreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.18, ease: EASE }}
              style={{
                position: "absolute",
                bottom: 2,
                left: 6,
                right: 6,
                background: "rgba(15, 23, 42, 0.95)",
                color: "#FFFFFF",
                padding: "3.5px 8px",
                borderRadius: 6,
                fontSize: 6.8,
                zIndex: 35,
                pointerEvents: "none",
                border: "1px solid rgba(255,255,255,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: selectedTopic.color }}>
                  {selectedTopic.label} ({selectedTopic.count} queries · {selectedTopic.pct}%)
                </div>
                <div style={{ color: "#CBD5E1", fontSize: 5.8 }}>{selectedTopic.desc}</div>
              </div>
              <div style={{ fontWeight: 800, color: "#4ADE80", fontSize: 6.2, background: "rgba(34,197,94,0.15)", padding: "1px 5px", borderRadius: 4 }}>
                {selectedTopic.aiRate}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Bar Chart with Hover Highlights & Tooltip
  if (config.chartType === "bar") {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "visible" }}>
        {/* Floating Rich Tooltip */}
        <AnimatePresence>
          {hoveredPoint && config.showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.92 }}
              transition={{ duration: 0.18, ease: EASE }}
              style={{
                position: "absolute",
                left: Math.min(Math.max(hoveredPoint.x, isLivePreview ? 60 : 75), isLivePreview ? 210 : 250),
                top: Math.max(0, hoveredPoint.yMsg - (isLivePreview ? 52 : 68)),
                transform: "translateX(-50%)",
                background: "rgba(15, 23, 42, 0.96)",
                backdropFilter: "blur(10px)",
                color: "#FFFFFF",
                padding: isLivePreview ? "4px 8px" : "6px 10px",
                borderRadius: 8,
                boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                fontSize: isLivePreview ? 6.5 : 7.5,
                zIndex: 50,
                pointerEvents: "none",
                border: "1px solid rgba(255,255,255,0.15)",
                minWidth: isLivePreview ? 115 : 140,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 2 }}>
                <span style={{ fontWeight: 800, color: "#38BDF8", fontSize: isLivePreview ? 6.2 : 7 }}>{hoveredPoint.fullDate}</span>
                {hoveredPoint.isPeak && (
                  <span style={{ background: "#F59E0B", color: "#000", fontSize: 5.5, fontWeight: 850, padding: "0.5px 3.5px", borderRadius: 3 }}>
                    PEAK
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3.5, color: "#E2E8F0" }}>
                    <span style={{ width: 4.5, height: 4.5, borderRadius: "50%", background: chartColor.hex }} />
                    Messages
                  </span>
                  <span style={{ fontWeight: 800, color: "#FFFFFF" }}>{hoveredPoint.msg}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3.5, color: "#E2E8F0" }}>
                    <span style={{ width: 4.5, height: 4.5, borderRadius: "50%", background: "#F59E0B" }} />
                    Sessions
                  </span>
                  <span style={{ fontWeight: 750, color: "#FFFFFF" }}>{hoveredPoint.conv}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3.5, color: "#94A3B8" }}>
                    ⚡ AI Auto-Resolved
                  </span>
                  <span style={{ fontWeight: 750, color: "#4ADE80" }}>{hoveredPoint.aiResolved}%</span>
                </div>
              </div>

              <div style={{ marginTop: 3, paddingTop: 2.5, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: isLivePreview ? 5.5 : 6.2, color: "#94A3B8", fontStyle: "italic" }}>
                {hoveredPoint.highlightText}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <svg viewBox="0 0 340 115" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: "visible" }}>
          {config.showGrid &&
            [25, 55, 85].map((y) => (
              <line key={y} x1="14" y1={y} x2="330" y2={y} stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3 3" />
            ))}

          {METRIC_DATA_POINTS.map((pt, i) => {
            const isPeak = pt.day === "Aug 27";
            const isHov = hoveredPoint?.day === pt.day;
            const barW = isLivePreview ? 13 : 16;
            const barH = (pt.msg / 98) * (isLivePreview ? 65 : 78);
            const barY = 100 - barH;

            return (
              <g
                key={pt.day}
                onMouseEnter={() => setHoveredPoint?.(pt)}
                onMouseLeave={() => setHoveredPoint?.(null)}
                style={{ cursor: "pointer" }}
              >
                <motion.rect
                  initial={{ height: 0, y: 100 }}
                  animate={{
                    height: isHov ? barH + 3 : barH,
                    y: isHov ? barY - 3 : barY,
                    fill: isHov || isPeak ? chartColor.hex : `${chartColor.hex}B0`,
                    filter: isHov ? `drop-shadow(0 4px 10px ${chartColor.hex}60)` : "none",
                  }}
                  transition={{ duration: 0.35, delay: i * 0.03, ease: EASE }}
                  x={pt.x - barW / 2}
                  width={barW}
                  rx="3.5"
                />
                <rect x={pt.x - barW / 2 + 1.5} y={barY + 1.5} width={barW - 3} height="2" rx="1" fill="rgba(255,255,255,0.4)" />
                <text
                  x={pt.x}
                  y="112"
                  textAnchor="middle"
                  fontSize="6"
                  fontFamily="system-ui, sans-serif"
                  fill={isPeak || isHov ? chartColor.hex : "#94A3B8"}
                  fontWeight={isPeak || isHov ? "800" : "500"}
                >
                  {pt.day}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // Line or Area Chart with Smooth Glowing Crosshair Scanline & Floating Tooltip
  const isArea = config.chartType === "area";
  const curveD = config.smoothLines
    ? "M 24,82 C 48,76 54,70 72,70 C 94,70 102,18 120,18 C 140,18 152,74 168,74 C 188,74 200,85 216,85 C 238,85 248,78 264,78 C 286,78 298,60 312,60"
    : "M 24,82 L 72,70 L 120,18 L 168,74 L 216,85 L 264,78 L 312,60";

  const areaD = `${curveD} L 312,100 L 24,100 Z`;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "visible" }}>
      {/* Floating Rich Tooltip Card showing deep data insights */}
      <AnimatePresence>
        {hoveredPoint && config.showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ duration: 0.18, ease: EASE }}
            style={{
              position: "absolute",
              left: Math.min(Math.max(hoveredPoint.x, isLivePreview ? 60 : 75), isLivePreview ? 210 : 250),
              top: Math.max(0, hoveredPoint.yMsg - (isLivePreview ? 52 : 68)),
              transform: "translateX(-50%)",
              background: "rgba(15, 23, 42, 0.96)",
              backdropFilter: "blur(10px)",
              color: "#FFFFFF",
              padding: isLivePreview ? "4px 8px" : "6px 10px",
              borderRadius: 8,
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              fontSize: isLivePreview ? 6.5 : 7.5,
              zIndex: 50,
              pointerEvents: "none",
              border: "1px solid rgba(255,255,255,0.15)",
              minWidth: isLivePreview ? 115 : 140,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 2 }}>
              <span style={{ fontWeight: 800, color: "#38BDF8", fontSize: isLivePreview ? 6.2 : 7 }}>{hoveredPoint.fullDate}</span>
              {hoveredPoint.isPeak && (
                <span style={{ background: "#F59E0B", color: "#000", fontSize: 5.5, fontWeight: 850, padding: "0.5px 3.5px", borderRadius: 3 }}>
                  PEAK
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3.5, color: "#E2E8F0" }}>
                  <span style={{ width: 4.5, height: 4.5, borderRadius: "50%", background: chartColor.hex }} />
                  Messages
                </span>
                <span style={{ fontWeight: 800, color: "#FFFFFF" }}>{hoveredPoint.msg}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3.5, color: "#E2E8F0" }}>
                  <span style={{ width: 4.5, height: 4.5, borderRadius: "50%", background: "#F59E0B" }} />
                  Sessions
                </span>
                <span style={{ fontWeight: 750, color: "#FFFFFF" }}>{hoveredPoint.conv}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3.5, color: "#94A3B8" }}>
                  ⚡ AI Auto-Resolved
                </span>
                <span style={{ fontWeight: 750, color: "#4ADE80" }}>{hoveredPoint.aiResolved}%</span>
              </div>
            </div>

            <div style={{ marginTop: 3, paddingTop: 2.5, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: isLivePreview ? 5.5 : 6.2, color: "#94A3B8", fontStyle: "italic" }}>
              {hoveredPoint.highlightText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <svg viewBox="0 0 340 115" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={`chartGrad-${config.colorId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColor.hex} stopOpacity={isArea ? 0.35 : 0.12} />
            <stop offset="100%" stopColor={chartColor.hex} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Dotted Grid lines */}
        {config.showGrid &&
          [25, 55, 85].map((y) => (
            <line key={y} x1="14" y1={y} x2="330" y2={y} stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3 3" />
          ))}

        {/* Glowing Vertical Crosshair Scanline on Active Hover */}
        {hoveredPoint && (
          <line
            x1={hoveredPoint.x}
            y1={10}
            x2={hoveredPoint.x}
            y2={100}
            stroke={chartColor.hex}
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.65"
          />
        )}

        {/* Area Gradient Fill */}
        {(isArea || config.chartType === "line") && (
          <motion.path
            key={`area-fill-${config.colorId}-${config.chartType}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
            d={areaD}
            fill={`url(#chartGrad-${config.colorId})`}
          />
        )}

        {/* Secondary Conversations Line */}
        {showConvs && (
          <motion.path
            key={`conv-line-${config.colorId}`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
            d="M 24,95 C 48,92 54,88 72,88 C 94,88 102,74 120,74 C 140,74 152,90 168,90 C 188,90 200,96 216,96 C 238,96 248,92 264,92 C 286,92 298,84 312,84"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}

        {/* Primary Messages Line */}
        {showMessages && (
          <motion.path
            key={`msg-line-${config.colorId}-${config.chartType}`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            d={curveD}
            fill="none"
            stroke={chartColor.hex}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        )}

        {/* Data points with Glowing Halos & Hover Handlers */}
        {METRIC_DATA_POINTS.map((pt) => {
          const isPeak = pt.day === "Aug 27";
          const isHov = hoveredPoint?.day === pt.day;

          return (
            <g
              key={pt.day}
              onMouseEnter={() => setHoveredPoint?.(pt)}
              onMouseLeave={() => setHoveredPoint?.(null)}
              style={{ cursor: "pointer" }}
            >
              <circle cx={pt.x} cy={pt.yMsg} r="12" fill="transparent" />

              {/* Peak indicator halo */}
              {isPeak && (
                <motion.circle
                  animate={{ r: [4, 8.5, 4], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  cx={pt.x}
                  cy={pt.yMsg}
                  fill={chartColor.hex}
                />
              )}

              {/* Active Hover Halo */}
              {isHov && (
                <motion.circle
                  initial={{ r: 4, opacity: 0.8 }}
                  animate={{ r: [6, 11, 6], opacity: [0.8, 0.2, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  cx={pt.x}
                  cy={pt.yMsg}
                  fill={chartColor.hex}
                />
              )}

              <motion.circle
                animate={{
                  r: isHov ? 5.5 : isPeak ? 4.2 : 3,
                  fill: isHov || isPeak ? chartColor.hex : "#FFFFFF",
                  stroke: chartColor.hex,
                }}
                transition={{ duration: 0.2 }}
                cx={pt.x}
                cy={pt.yMsg}
                strokeWidth={isPeak || isHov ? 2.2 : 1.6}
              />
            </g>
          );
        })}

        {/* Date Labels along bottom */}
        {METRIC_DATA_POINTS.map((pt) => (
          <text
            key={`lbl-${pt.day}`}
            x={pt.x}
            y="112"
            textAnchor="middle"
            fontSize="6"
            fontFamily="system-ui, sans-serif"
            fill={pt.day === "Aug 27" || hoveredPoint?.day === pt.day ? chartColor.hex : "#94A3B8"}
            fontWeight={pt.day === "Aug 27" || hoveredPoint?.day === pt.day ? "800" : "500"}
          >
            {pt.day}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ── Customization Modal Component (Linear/Stripe Style) ── */
function AnalyticsCustomizationModal({
  isOpen,
  onClose,
  initialConfig,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: DashboardConfig;
  onApply: (cfg: DashboardConfig) => void;
}) {
  const [stagedConfig, setStagedConfig] = useState<DashboardConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<"chart" | "layout" | "metrics" | "color" | "display">("chart");
  const [hoveredPoint, setHoveredPoint] = useState<(typeof METRIC_DATA_POINTS)[0] | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStagedConfig(initialConfig);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const currentChartColor = resolveChartColor(stagedConfig);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.48)",
          backdropFilter: "blur(4px)",
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 10,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.35, ease: EASE }}
          style={{
            width: "100%",
            maxWidth: 630,
            height: 440,
            background: "#FFFFFF",
            borderRadius: 16,
            border: "1px solid #E2E8F0",
            boxShadow: "0 28px 70px -12px rgba(15, 23, 42, 0.3), 0 10px 30px rgba(0, 0, 0, 0.12)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              padding: "10px 16px 9px",
              borderBottom: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#FFFFFF",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: "rgba(3, 150, 166, 0.1)",
                  border: "1px solid rgba(3, 150, 166, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0396A6",
                }}
              >
                <SlidersHorizontal size={12} strokeWidth={2.4} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>
                  Customize Analytics
                </h4>
                <p style={{ margin: 0, fontSize: 8, color: "#64748B", fontWeight: 500 }}>
                  Personalize how your analytics dashboard looks and what you want to track.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                color: "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <X size={12} />
            </button>
          </div>

          {/* Modal Quick Nav Tabs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              padding: "4px 14px",
              background: "#F8FAFC",
              borderBottom: "1px solid #F1F5F9",
              flexShrink: 0,
            }}
          >
            {[
              { id: "chart" as const, label: "Chart Type", icon: BarChart3 },
              { id: "metrics" as const, label: "Metrics", icon: Activity },
              { id: "color" as const, label: "Chart Color", icon: Palette },
              { id: "layout" as const, label: "Layout", icon: LayoutGrid },
              { id: "display" as const, label: "Display & Time", icon: Eye },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  borderRadius: 5,
                  fontSize: 7.5,
                  fontWeight: activeTab === t.id ? 800 : 600,
                  background: activeTab === t.id ? "#FFFFFF" : "transparent",
                  color: activeTab === t.id ? "#0396A6" : "#64748B",
                  border: activeTab === t.id ? "1px solid #E2E8F0" : "1px solid transparent",
                  boxShadow: activeTab === t.id ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
                  cursor: "pointer",
                }}
              >
                <t.icon size={9} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Modal Body: 2-Column Split (Left: Controls, Right: Realtime Live Preview) */}
          <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
            {/* ── LEFT: Settings Controls (Scrollable) ── */}
            <div
              style={{
                width: "48%",
                borderRight: "1px solid #F1F5F9",
                padding: "10px 14px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* SECTION: Chart Type */}
              {activeTab === "chart" && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#0F172A", marginBottom: 3 }}>
                    Chart Type
                  </div>
                  <div style={{ fontSize: 7, color: "#64748B", marginBottom: 8 }}>
                    Select how the primary telemetry data should be rendered.
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                    {(["line", "bar", "area", "pie", "donut"] as ChartTypeOption[]).map((t) => {
                      const isSel = stagedConfig.chartType === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setStagedConfig((p) => ({ ...p, chartType: t }))}
                          style={{
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: isSel ? "1.5px solid #0396A6" : "1px solid #E2E8F0",
                            background: isSel ? "#F0FDFA" : "#FFFFFF",
                            color: isSel ? "#0396A6" : "#1E293B",
                            fontSize: 8,
                            fontWeight: isSel ? 800 : 600,
                            textTransform: "capitalize",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 4,
                            transition: "all 0.2s",
                          }}
                        >
                          {t}
                          {isSel && <Check size={8} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION: Metrics Selection */}
              {activeTab === "metrics" && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>
                    What do you want to visualize?
                  </div>
                  <div style={{ fontSize: 7, color: "#64748B", marginBottom: 8 }}>
                    Pick one or multiple data streams to track.
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {AVAILABLE_METRICS.map((m) => {
                      const isChecked = stagedConfig.selectedMetrics.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setStagedConfig((prev) => {
                              const exists = prev.selectedMetrics.includes(m.id);
                              if (exists && prev.selectedMetrics.length === 1) return prev; // keep at least 1
                              const next = exists
                                ? prev.selectedMetrics.filter((x) => x !== m.id)
                                : [...prev.selectedMetrics, m.id];
                              return { ...prev, selectedMetrics: next };
                            });
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "4.5px 8px",
                            borderRadius: 6,
                            background: isChecked ? "#F0FDFA" : "#F8FAFC",
                            border: isChecked ? "1px solid #CCFBF1" : "1px solid #F1F5F9",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 3,
                                border: isChecked ? "1px solid #0396A6" : "1px solid #CBD5E1",
                                background: isChecked ? "#0396A6" : "#FFFFFF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#FFF",
                              }}
                            >
                              {isChecked && <Check size={8} strokeWidth={3} />}
                            </div>
                            <span style={{ fontSize: 8, fontWeight: isChecked ? 750 : 600, color: "#0F172A" }}>
                              {m.label}
                            </span>
                          </div>
                          <span style={{ fontSize: 7.5, fontWeight: 700, color: m.color }}>
                            {m.val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION: Chart Color Customization */}
              {activeTab === "color" && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>
                    Chart Color
                  </div>
                  <div style={{ fontSize: 7, color: "#64748B", marginBottom: 8 }}>
                    Select a preset or enter a custom hex palette.
                  </div>

                  {/* Color Presets */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, marginBottom: 10 }}>
                    {COLOR_PRESETS.map((p) => {
                      const isSel = stagedConfig.colorId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setStagedConfig((prev) => ({ ...prev, colorId: p.id }))}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4.5px 6px",
                            borderRadius: 6,
                            background: isSel ? "#F8FAFC" : "#FFFFFF",
                            border: isSel ? `1.5px solid ${p.hex}` : "1px solid #E2E8F0",
                            cursor: "pointer",
                          }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.hex }} />
                          <span style={{ fontSize: 7.5, fontWeight: isSel ? 800 : 600, color: "#0F172A" }}>
                            {p.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Hex Color Picker */}
                  <div
                    style={{
                      padding: "6px 8px",
                      borderRadius: 7,
                      border: stagedConfig.colorId === "custom" ? "1.5px solid #0396A6" : "1px solid #E2E8F0",
                      background: "#F8FAFC",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="color"
                        value={stagedConfig.customColorHex}
                        onChange={(e) =>
                          setStagedConfig((prev) => ({
                            ...prev,
                            colorId: "custom",
                            customColorHex: e.target.value,
                          }))
                        }
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          background: "transparent",
                        }}
                      />
                      <span style={{ fontSize: 7.5, fontWeight: 700, color: "#0F172A" }}>
                        Custom color
                      </span>
                    </div>
                    <span style={{ fontSize: 7.5, fontWeight: 800, color: "#64748B", fontFamily: "monospace" }}>
                      {stagedConfig.customColorHex}
                    </span>
                  </div>
                </div>
              )}

              {/* SECTION: Layout & Widgets Selection */}
              {activeTab === "layout" && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>
                    Dashboard Layout
                  </div>
                  <div style={{ fontSize: 7, color: "#64748B", marginBottom: 8 }}>
                    Enable, disable, or reorder widgets on your dashboard.
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
                    {WIDGET_OPTIONS.map((w) => {
                      const isChecked = stagedConfig.widgets[w.id];
                      return (
                        <div
                          key={w.id}
                          onClick={() =>
                            setStagedConfig((prev) => ({
                              ...prev,
                              widgets: { ...prev.widgets, [w.id]: !isChecked },
                            }))
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "4.5px 7px",
                            borderRadius: 6,
                            border: isChecked ? "1px solid #CCFBF1" : "1px solid #F1F5F9",
                            background: isChecked ? "#F0FDFA" : "#FFFFFF",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <GripVertical size={9} style={{ color: "#94A3B8" }} />
                            <div>
                              <div style={{ fontSize: 7.8, fontWeight: 750, color: "#0F172A" }}>{w.label}</div>
                              <div style={{ fontSize: 6.2, color: "#64748B" }}>{w.desc}</div>
                            </div>
                          </div>

                          <div
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 3,
                              border: isChecked ? "1px solid #0396A6" : "1px solid #CBD5E1",
                              background: isChecked ? "#0396A6" : "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#FFF",
                            }}
                          >
                            {isChecked && <Check size={8} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION: Display Options & Time Range */}
              {activeTab === "display" && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>
                    Time Range & Display Options
                  </div>
                  <div style={{ fontSize: 7, color: "#64748B", marginBottom: 8 }}>
                    Fine-tune visualization aids and sampling intervals.
                  </div>

                  {/* Time Range Pills */}
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 7.2, fontWeight: 750, color: "#64748B", display: "block", marginBottom: 4 }}>
                      Time Range
                    </span>
                    <div style={{ display: "flex", gap: 3.5 }}>
                      {(["7d", "14d", "30d", "90d", "custom"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setStagedConfig((prev) => ({ ...prev, timeRange: r }))}
                          style={{
                            padding: "3px 6px",
                            borderRadius: 4.5,
                            border: stagedConfig.timeRange === r ? "1px solid #0396A6" : "1px solid #E2E8F0",
                            background: stagedConfig.timeRange === r ? "#0396A6" : "#FFFFFF",
                            color: stagedConfig.timeRange === r ? "#FFFFFF" : "#64748B",
                            fontSize: 7.2,
                            fontWeight: stagedConfig.timeRange === r ? 800 : 600,
                            textTransform: "uppercase",
                            cursor: "pointer",
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggle list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {[
                      { key: "showLegend" as const, label: "Show Legend" },
                      { key: "showGrid" as const, label: "Show Grid" },
                      { key: "showDataLabels" as const, label: "Show Data Labels" },
                      { key: "showTooltip" as const, label: "Show Tooltip" },
                      { key: "smoothLines" as const, label: "Smooth Lines" },
                    ].map((tog) => (
                      <div
                        key={tog.key}
                        onClick={() =>
                          setStagedConfig((prev) => ({
                            ...prev,
                            [tog.key]: !prev[tog.key],
                          }))
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "4px 7px",
                          borderRadius: 5,
                          background: "#F8FAFC",
                          border: "1px solid #F1F5F9",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: 7.5, fontWeight: 650, color: "#1E293B" }}>
                          {tog.label}
                        </span>
                        <div
                          style={{
                            width: 22,
                            height: 12,
                            borderRadius: 99,
                            background: stagedConfig[tog.key] ? "#0396A6" : "#CBD5E1",
                            position: "relative",
                            transition: "background 0.2s",
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#FFFFFF",
                              position: "absolute",
                              top: 2,
                              left: stagedConfig[tog.key] ? 12 : 2,
                              transition: "left 0.2s",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Real-Time Live Preview ── */}
            <div
              style={{
                width: "52%",
                background: "#F8FAFC",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                overflow: "hidden",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 6.5, fontWeight: 800, color: "#0396A6", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      LIVE PREVIEW
                    </span>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: "#0F172A" }}>
                      Conversations & Messages
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 6.5,
                      fontWeight: 700,
                      background: "#ECFDF5",
                      color: "#059669",
                      border: "1px solid #A7F3D0",
                      padding: "1px 5px",
                      borderRadius: 99,
                    }}
                  >
                    {stagedConfig.timeRange.toUpperCase()}
                  </span>
                </div>

                {/* Live Preview Card */}
                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 10,
                    border: "1px solid #E2E8F0",
                    padding: "8px",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                    height: 180,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                  }}
                >
                  <div style={{ flex: 1, minHeight: 140, position: "relative" }}>
                    <DynamicAnalyticsChart
                      config={stagedConfig}
                      isLivePreview={true}
                      hoveredPoint={hoveredPoint}
                      setHoveredPoint={setHoveredPoint}
                      hoveredSlice={hoveredSlice}
                      setHoveredSlice={setHoveredSlice}
                    />
                  </div>

                  {stagedConfig.showLegend && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 3,
                        borderTop: "1px solid #F1F5F9",
                        fontSize: 6,
                        color: "#64748B",
                        fontWeight: 700,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                          <i style={{ width: 4, height: 4, borderRadius: "50%", background: currentChartColor.hex, display: "inline-block" }} />
                          Messages
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                          <i style={{ width: 4, height: 4, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
                          Conversations
                        </span>
                      </div>
                      <span style={{ color: currentChartColor.hex, fontWeight: 800 }}>
                        {stagedConfig.chartType.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Helper Note */}
              <div style={{ fontSize: 6.8, color: "#64748B", fontStyle: "italic", textAlign: "center", marginTop: 4 }}>
                Changes update in real-time. Click Apply Changes to save.
              </div>
            </div>
          </div>

          {/* Modal Bottom Actions Bar */}
          <div
            style={{
              padding: "8px 16px",
              borderTop: "1px solid #F1F5F9",
              background: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setStagedConfig(DEFAULT_DASHBOARD_CONFIG)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "transparent",
                border: "none",
                color: "#64748B",
                fontSize: 7.8,
                fontWeight: 650,
                cursor: "pointer",
                padding: "3px 6px",
              }}
            >
              <RotateCcw size={9} />
              <span>Reset</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={onClose}
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 6,
                  padding: "4.5px 10px",
                  fontSize: 8,
                  fontWeight: 700,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => onApply(stagedConfig)}
                style={{
                  background: "linear-gradient(135deg, #0396A6 0%, #0D9488 100%)",
                  border: "none",
                  borderRadius: 6,
                  padding: "4.5px 14px",
                  fontSize: 8.5,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(3, 150, 166, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Check size={9} strokeWidth={3} />
                <span>Apply Changes</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Main Beat 11 Component: Real SaaS Analytics Dashboard ── */
function AnalyticsDashboardBeat({ phase }: { phase: number }) {
  const [appliedConfig, setAppliedConfig] = useState<DashboardConfig>(DEFAULT_DASHBOARD_CONFIG);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<MetricPointDetails | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [hoveredKpi, setHoveredKpi] = useState<string | null>(null);
  const [manualOverride, setManualOverride] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<"overview" | "unified" | "analytics">("analytics");

  // Precision-synced animated cursor for Step 11 (picks up directly from Step 10 click position on Analytics tab)
  const [simCursor, setSimCursor] = useState<{ x: number; y: number; clicking: boolean; visible: boolean }>({
    x: 6.5,
    y: 21.5,
    clicking: false,
    visible: true,
  });

  const currentColor = resolveChartColor(appliedConfig);

  const sidebarNav = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "web", label: "Web Agent", icon: Globe, hasChevron: true },
    { id: "whatsapp", label: "WhatsApp Agent", icon: MessageCircle, hasChevron: true },
    { id: "unified", label: "Unified Assistant", icon: Inbox, badge: "LIVE" },
    { id: "email", label: "Email Agent", icon: Mail },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "kb", label: "Knowledge Base", icon: BookOpen },
    { id: "inbox", label: "Inbox", icon: Inbox },
    { id: "leads", label: "Leads", icon: UserIcon },
    { id: "quotations", label: "Quotations", icon: Receipt },
    { id: "workspace", label: "Workspace", icon: Building2 },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  // Hero Product Tour Flow: Walkthrough of the customization story + rich hover demonstration with visible cursor
  useEffect(() => {
    if (manualOverride) return;

    if (phase <= 0) {
      // Step 1: Dashboard appears — cursor smoothly starts from Analytics tab in sidebar and glides towards Customize button
      setIsModalOpen(false);
      setShowToast(false);
      setAppliedConfig(DEFAULT_DASHBOARD_CONFIG);
      setHoveredPoint(null);
      setHoveredSlice(null);
      setHoveredKpi(null);
      setSimCursor({ x: 6.5, y: 21.5, clicking: false, visible: true });

      const t1 = setTimeout(() => {
        setSimCursor({ x: 93, y: 11, clicking: false, visible: true });
      }, 500);
      return () => clearTimeout(t1);
    } else if (phase === 1) {
      // Step 2: Dashboard is active; Cursor hovers on Customize button and clicks it
      setIsModalOpen(false);
      setShowToast(false);
      setHoveredPoint(null);
      setHoveredSlice(null);
      setHoveredKpi(null);
      setSimCursor({ x: 93, y: 11, clicking: false, visible: true });
      const tc1 = setTimeout(() => setSimCursor({ x: 93, y: 11, clicking: true, visible: true }), 1100);
      const tc2 = setTimeout(() => setSimCursor({ x: 93, y: 11, clicking: false, visible: true }), 1500);
      return () => {
        clearTimeout(tc1);
        clearTimeout(tc2);
      };
    } else if (phase === 2) {
      // Step 3: User clicks Customize -> Configuration modal opens, cursor selects Area & glides to Apply
      setIsModalOpen(true);
      setShowToast(false);
      setHoveredPoint(null);
      setHoveredSlice(null);
      setHoveredKpi(null);
      setSimCursor({ x: 50, y: 50, clicking: false, visible: true });

      const tc1 = setTimeout(() => setSimCursor({ x: 48, y: 38, clicking: false, visible: true }), 400);  // glides to Area chart
      const tc2 = setTimeout(() => setSimCursor({ x: 48, y: 38, clicking: true, visible: true }), 900);   // clicks Area
      const tc3 = setTimeout(() => setSimCursor({ x: 48, y: 38, clicking: false, visible: true }), 1200);
      const tc4 = setTimeout(() => setSimCursor({ x: 88, y: 91, clicking: false, visible: true }), 2000); // glides to Apply Changes button
      return () => {
        clearTimeout(tc1);
        clearTimeout(tc2);
        clearTimeout(tc3);
        clearTimeout(tc4);
      };
    } else if (phase === 3) {
      // Step 4: Staged changes applied -> Cursor clicks Apply Changes, modal closes with updated chart
      setSimCursor({ x: 88, y: 91, clicking: true, visible: true });
      setAppliedConfig({
        ...DEFAULT_DASHBOARD_CONFIG,
        chartType: "area",
        colorId: "teal",
      });
      setIsModalOpen(false);
      setShowToast(true);

      const tc1 = setTimeout(() => setSimCursor({ x: 88, y: 91, clicking: false, visible: false }), 400);
      const tToast = setTimeout(() => setShowToast(false), 2400);
      return () => {
        clearTimeout(tc1);
        clearTimeout(tToast);
      };
    } else if (phase >= 4) {
      // Step 5: AFTER CUSTOMIZATION — Cursor smoothly glides across data points to show rich insights
      setIsModalOpen(false);
      setShowToast(false);

      // Smooth simulated hover tour across data points and topic breakdown:
      const t1 = setTimeout(() => {
        // 1. Cursor glides to Aug 26 (42 messages)
        setSimCursor({ x: 32, y: 56, clicking: false, visible: true });
        setHoveredPoint(METRIC_DATA_POINTS[1]!);
      }, 400);

      const t2 = setTimeout(() => {
        // 2. Cursor smoothly glides up to the peak on Aug 27 (Messages: 98, Sessions: 23, 89% AI resolved)
        setSimCursor({ x: 41, y: 44, clicking: false, visible: true });
        setHoveredPoint(METRIC_DATA_POINTS[2]!);
      }, 1500);

      const t3 = setTimeout(() => {
        // 3. Cursor glides over to Donut topic slice (FAQ: 35 queries, 80%)
        setHoveredPoint(null);
        setSimCursor({ x: 78, y: 54, clicking: false, visible: true });
        setHoveredSlice("faq");
      }, 2800);

      const t4 = setTimeout(() => {
        // 4. Cursor moves up to highlight the Conversion KPI card (39% Conversion rate)
        setHoveredSlice(null);
        setSimCursor({ x: 65, y: 18, clicking: false, visible: true });
        setHoveredKpi("conv_rate");
      }, 3700);

      const t5 = setTimeout(() => {
        setSimCursor({ x: 65, y: 18, clicking: false, visible: false });
      }, 4300);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
      };
    }
  }, [phase, manualOverride]);

  const handleApplyChanges = (newCfg: DashboardConfig) => {
    setAppliedConfig(newCfg);
    setIsModalOpen(false);
    setShowToast(true);
    setManualOverride(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 490,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        background: "#F1F3F5",
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* ── Browser Chrome (Mac Window) ── */}
      <div style={{ background: "#F1F3F5", borderBottom: "1px solid #E2E5E9", padding: "7px 14px 0", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: 5.5, paddingBottom: 7 }}>
          <div style={{ width: 8.5, height: 8.5, borderRadius: "50%", background: "#FF5F56" }} />
          <div style={{ width: 8.5, height: 8.5, borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: 8.5, height: 8.5, borderRadius: "50%", background: "#27C93F" }} />
        </div>
        {/* Tab with smooth rounded top corners */}
        <div style={{ background: "#FFF", borderRadius: "10px 10px 0 0", padding: "4.5px 16px", fontSize: 9.5, fontWeight: 700, color: "#1E293B", display: "flex", alignItems: "center", gap: 6, border: "1px solid #E2E5E9", borderBottom: "1px solid #FFF", marginBottom: -1, zIndex: 1, boxShadow: "0 -1px 3px rgba(0,0,0,0.02)" }}>
          <img src="/logo-small.png" alt="Frosty" style={{ width: 12, height: 12, objectFit: "contain" }} />
          <span>Frosty — Merchant Console</span>
        </div>

      </div>

      {/* Address bar */}
      <div style={{ background: "#FFF", borderBottom: "1px solid #E9ECEF", padding: "6px 14px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 5, opacity: 0.35 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2"><path d="M9 18l6-6-6-6" /></svg>
        </div>
        <div style={{ flex: 1, background: "#F4F4F6", borderRadius: 8, padding: "4px 12px", fontSize: 10, color: "#475569", display: "flex", alignItems: "center", gap: 6, border: "1px solid #E2E8F0" }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          <span style={{ fontWeight: 600, fontSize: 10 }}>app.frostyagent.com/console</span>
        </div>
      </div>

      {/* ── Main Console Layout: Sidebar + Master Workspace ── */}
      <div
        style={{
          flex: 1,
          background: "#FFFFFF",
          display: "grid",
          gridTemplateColumns: "135px 1fr",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Local Precision-Synced Cursor */}
        {!manualOverride && <SimCursor {...simCursor} />}

        {/* ── Confirmation Toast (When Changes Are Applied) ── */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.25, ease: EASE }}
              style={{
                position: "absolute",
                top: 38,
                right: 14,
                zIndex: 70,
                background: "#0F172A",
                color: "#FFFFFF",
                borderRadius: 8,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  background: "#10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                }}
              >
                <Check size={11} strokeWidth={3} />
              </div>
              <div>
                <div style={{ fontSize: 8.5, fontWeight: 800, color: "#FFFFFF" }}>Analytics updated</div>
                <div style={{ fontSize: 6.8, color: "#94A3B8" }}>Your dashboard preferences have been saved.</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Customization Modal Over Dashboard ── */}
        <AnalyticsCustomizationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setManualOverride(true);
          }}
          initialConfig={appliedConfig}
          onApply={handleApplyChanges}
        />

        {/* ── Left Sidebar matching Reference Image ── */}
        <aside
          style={{
            borderRight: "1px solid #F1F5F9",
            background: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
          }}
        >
          {/* Top Logo & Nav List */}
          <div style={{ overflowY: "auto", overflowX: "hidden", padding: "8px 6px 4px" }}>
            {/* Header: Frosty Brand & Menu */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 4px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <img src="/logo-small.png" alt="Frosty" style={{ width: 16, height: 16, objectFit: "contain" }} />
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 900, color: "#0F172A", lineHeight: 1.1 }}>Frosty</div>
                  <div style={{ fontSize: 5.8, color: "#64748B", fontWeight: 500 }}>Merchant Console</div>
                </div>
              </div>
              <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 8, color: "#475569", lineHeight: 1 }}>☰</span>
              </div>
            </div>

            {/* Navigation Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 1.5, marginTop: 4 }}>
              {sidebarNav.map((item) => {
                const IconComponent = item.icon;
                const isAct = item.id === activeNavTab;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.id === "overview" || item.id === "unified" || item.id === "analytics") {
                        setActiveNavTab(item.id as "overview" | "unified" | "analytics");
                        setManualOverride(true);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "3.5px 6px",
                      borderRadius: 6,
                      fontSize: 7.2,
                      fontWeight: isAct ? 800 : 500,
                      color: isAct ? "#0D9488" : "#64748B",
                      background: isAct ? "#F0FDFA" : "transparent",
                      border: isAct ? "1px solid #CCFBF1" : "1px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <IconComponent style={{ width: 10, height: 10, color: isAct ? "#0D9488" : "#94A3B8" }} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span style={{ fontSize: 5.5, fontWeight: 900, background: "#DCFCE7", color: "#16A34A", padding: "1px 3.5px", borderRadius: 3 }}>
                        {item.badge}
                      </span>
                    ) : item.hasChevron ? (
                      <ChevronRight style={{ width: 8, height: 8, color: "#CBD5E1" }} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Sidebar: Growth Plan & Profile */}
          <div style={{ padding: "4px 6px 6px", background: "#FFFFFF", borderTop: "1px solid #F1F5F9" }}>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 6px", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 7, fontWeight: 800, color: "#0F172A" }}>Growth Plan</span>
                <span style={{ fontSize: 7.5 }}>👑</span>
              </div>
              <div style={{ fontSize: 5.8, color: "#64748B", marginTop: 1 }}>76% of limit used</div>
              <div style={{ width: "100%", height: 3, background: "#E2E8F0", borderRadius: 99, marginTop: 3, overflow: "hidden" }}>
                <div style={{ width: "76%", height: "100%", background: "linear-gradient(90deg, #0396A6, #22D3EE)", borderRadius: 99 }} />
              </div>
              <div style={{ marginTop: 4, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 5, padding: "2px 4px", fontSize: 6, fontWeight: 800, color: "#0F172A", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                <span>Upgrade Plan</span>
                <span>➔</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 3px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 15, height: 15, borderRadius: "50%", background: "#F1F5F9", fontSize: 6.5, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center" }}>YT</div>
                <div>
                  <div style={{ fontSize: 7, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>Your team</div>
                  <div style={{ fontSize: 5.5, color: "#94A3B8" }}>Super Admin</div>
                </div>
              </div>
              <span style={{ fontSize: 6.5, color: "#94A3B8" }}>▾</span>
            </div>
          </div>
        </aside>

        {/* ── Main Workspace Body ── */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#FAFAFC", overflow: "hidden", position: "relative" }}>
          {/* Top Header Bar */}
          <div
            style={{
              height: 32,
              minHeight: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              borderBottom: "1px solid #F1F5F9",
              background: "#FFFFFF",
              flexShrink: 0,
              gap: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.01)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flexShrink: 0 }}>
              <div
                style={{
                  width: 17,
                  height: 17,
                  borderRadius: 4.5,
                  background: "linear-gradient(135deg, rgba(3,150,166,0.15), rgba(34,211,238,0.2))",
                  border: "1px solid rgba(3,150,166,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <BarChart3 style={{ width: 9.5, height: 9.5, color: "#0396A6" }} />
              </div>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  color: "#0F172A",
                  whiteSpace: "nowrap",
                  letterSpacing: "-0.01em",
                }}
              >
                Overview Analytics
              </span>
              <span
                style={{
                  fontSize: 6.2,
                  fontWeight: 750,
                  background: "#F0FDFA",
                  color: "#0D9488",
                  border: "1px solid #CCFBF1",
                  padding: "1.5px 5.5px",
                  borderRadius: 99,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <Sparkles style={{ width: 6.5, height: 6.5, color: "#0D9488" }} />
                <span>Live Telemetry</span>
              </span>
            </div>

            {/* Center / Search Input with ⌘K */}
            <div
              style={{
                flex: "0 1 140px",
                minWidth: 80,
                height: 19,
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 5,
                padding: "0 6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 4,
                flexShrink: 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 3.5, minWidth: 0, overflow: "hidden" }}>
                <Search style={{ width: 7.5, height: 7.5, color: "#94A3B8", flexShrink: 0 }} />
                <span style={{ fontSize: 6.5, color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Search anything...
                </span>
              </div>
              <kbd style={{ fontSize: 5.5, fontWeight: 700, color: "#64748B", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 3, padding: "0.5px 3px", lineHeight: 1, flexShrink: 0, fontFamily: "inherit" }}>
                ⌘K
              </kbd>
            </div>

            {/* Right Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 4.5, flexShrink: 0 }}>
              <div style={{ position: "relative", width: 19, height: 19, borderRadius: "50%", background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bell style={{ width: 8.5, height: 8.5, color: "#475569" }} />
                <span style={{ position: "absolute", top: -2, right: -2, minWidth: 8.5, height: 8.5, borderRadius: 99, background: "#EF4444", color: "#FFF", fontSize: 5, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 1.5px", border: "1px solid #FFFFFF", lineHeight: 1 }}>
                  3
                </span>
              </div>

              <span style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0", fontSize: 6.2, fontWeight: 800, padding: "1.5px 5.5px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap", flexShrink: 0 }}>
                <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 3px #22C55E", display: "inline-block" }} />
                <span>Live</span>
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: 3.5, padding: "1.5px 5px", borderRadius: 5, background: "#F8FAFC", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#0F172A", fontSize: 5.2, fontWeight: 800, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  YT
                </div>
                <span style={{ fontSize: 6.2, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap" }}>
                  Your team
                </span>
                <span style={{ fontSize: 5, color: "#94A3B8", marginLeft: -0.5 }}>▾</span>
              </div>
            </div>
          </div>

          {/* Main Scrollable Workspace Body */}
          <div style={{ flex: 1, padding: "7px 10px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", minHeight: 0 }}>
            {/* The Actual SaaS Analytics Dashboard */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                filter: isModalOpen ? "blur(1.5px)" : "none",
                opacity: isModalOpen ? 0.75 : 1,
                transition: "filter 0.3s, opacity 0.3s",
                gap: 5.5,
              }}
            >
              {/* 1. Header Action Bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 4, borderBottom: "1px solid #E2E8F0", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, background: "linear-gradient(135deg, rgba(3,150,166,0.15), rgba(34,211,238,0.2))", border: "1px solid rgba(3,150,166,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src="/logo-small.png" alt="Frosty" style={{ width: 10, height: 10, objectFit: "contain" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>Performance &amp; Traffic Overview</div>
                    <div style={{ fontSize: 6, color: "#64748B", fontWeight: 500 }}>Updated 10:04 AM · cached ≤5m</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 3.5, padding: "2.5px 6px", borderRadius: 5, background: "#FFFFFF", border: "1px solid #E2E8F0", fontSize: 6.8, fontWeight: 650, color: "#334155" }}>
                    <Calendar size={7.5} style={{ color: "#64748B" }} />
                    <span>Aug 25 – Sep 01, 2026</span>
                  </div>

                  <motion.button
                    animate={
                      phase === 1 && !isModalOpen
                        ? {
                          scale: [1, 1.05, 1],
                          boxShadow: [
                            "0 0 0 0 rgba(3,150,166,0)",
                            "0 0 0 6px rgba(3,150,166,0.2)",
                            "0 0 0 0 rgba(3,150,166,0)",
                          ],
                        }
                        : {}
                    }
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    whileHover={{ y: -1, scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setIsModalOpen(true);
                      setManualOverride(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 9px",
                      borderRadius: 6,
                      background: "rgba(3, 150, 166, 0.1)",
                      border: "1px solid rgba(3, 150, 166, 0.35)",
                      color: "#0396A6",
                      fontSize: 7.5,
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 1px 4px rgba(3,150,166,0.1)",
                    }}
                  >
                    <SlidersHorizontal size={9} strokeWidth={2.4} />
                    <span>Customize</span>
                  </motion.button>
                </div>
              </div>

              {/* 2. 6 KPI Cards Strip */}
              {appliedConfig.widgets.kpi && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4.5, margin: "2px 0", flexShrink: 0 }}>
                  {SAAS_KPIS.map((kpi) => {
                    const isHov = hoveredKpi === kpi.id;
                    return (
                      <motion.div
                        key={kpi.id}
                        animate={{ y: isHov ? -2 : 0, scale: isHov ? 1.02 : 1 }}
                        whileHover={{ y: -2, scale: 1.02 }}
                        onMouseEnter={() => setHoveredKpi(kpi.id)}
                        onMouseLeave={() => setHoveredKpi(null)}
                        style={{
                          background: isHov ? "#F0FDFA" : "#FFFFFF",
                          border: isHov ? "1px solid #0396A6" : "1px solid #E2E8F0",
                          borderRadius: 6,
                          padding: "3.5px 5px",
                          boxShadow: isHov ? "0 4px 12px rgba(3,150,166,0.1)" : "0 1px 2px rgba(0,0,0,0.02)",
                          cursor: "default",
                          transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 1.5 }}>
                          <span style={{ fontSize: 5.5, fontWeight: 750, color: isHov ? "#0396A6" : "#94A3B8", letterSpacing: "0.03em" }}>{kpi.label}</span>
                          <kpi.icon size={7.5} style={{ color: isHov ? "#0396A6" : "#94A3B8" }} />
                        </div>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: isHov ? "#0396A6" : "#0F172A", lineHeight: 1 }}>{kpi.value}</div>
                        <div style={{ fontSize: 5.5, color: isHov ? "#0F766E" : "#64748B", fontWeight: isHov ? 750 : 600, marginTop: 1.2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isHov ? "100%" : 42 }}>{isHov ? kpi.hoverDetail : kpi.sub}</span>
                          {!isHov && <span style={{ color: kpi.positive ? "#16A34A" : "#64748B", fontWeight: 750, flexShrink: 0 }}>{kpi.trend}</span>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* 3. Main Analytics Grid */}
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: appliedConfig.widgets.topics ? "1.4fr 1fr" : "1fr", gap: 6, minHeight: 140, overflow: "hidden" }}>
                {appliedConfig.widgets.chart && (
                  <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E2E8F0", padding: "6px 8px 4px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 7.8, fontWeight: 800, color: "#0F172A" }}>Conversations &amp; Messages</span>
                        <span style={{ fontSize: 5.5, color: "#94A3B8" }}>ⓘ</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 5.5 }}>
                        {appliedConfig.selectedMetrics.includes("msg") && (
                          <span style={{ display: "flex", alignItems: "center", gap: 2, color: "#64748B", fontWeight: 700 }}>
                            <i style={{ width: 4, height: 4, borderRadius: "50%", background: currentColor.hex }} />
                            Messages
                          </span>
                        )}
                        {appliedConfig.selectedMetrics.includes("conv") && (
                          <span style={{ display: "flex", alignItems: "center", gap: 2, color: "#64748B", fontWeight: 700 }}>
                            <i style={{ width: 4, height: 4, borderRadius: "50%", background: "#F59E0B" }} />
                            Sessions
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ flex: 1, minHeight: 95, position: "relative" }}>
                      <DynamicAnalyticsChart
                        config={appliedConfig}
                        hoveredPoint={hoveredPoint}
                        setHoveredPoint={setHoveredPoint}
                        hoveredSlice={hoveredSlice}
                        setHoveredSlice={setHoveredSlice}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 2.5, borderTop: "1px solid #F1F5F9", fontSize: 5.8, color: "#64748B", fontWeight: 650 }}>
                      <span>Peak: Aug 27 (98 msg)</span>
                      <span style={{ color: "#16A34A" }}>+18% volume vs last week</span>
                    </div>
                  </div>
                )}

                {appliedConfig.widgets.topics && (
                  <div style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E2E8F0", padding: "6px 8px 4px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 7.8, fontWeight: 800, color: "#0F172A" }}>Top Topics</span>
                      <span style={{ fontSize: 5.8, fontWeight: 700, color: "#0396A6" }}>44 Topics</span>
                    </div>

                    <div style={{ flex: 1, minHeight: 95, position: "relative" }}>
                      <DynamicAnalyticsChart
                        config={{ ...appliedConfig, chartType: "donut" }}
                        hoveredPoint={hoveredPoint}
                        setHoveredPoint={setHoveredPoint}
                        hoveredSlice={hoveredSlice}
                        setHoveredSlice={setHoveredSlice}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 2.5, borderTop: "1px solid #F1F5F9", fontSize: 5.8, color: "#64748B", fontWeight: 650 }}>
                      <span>Top intent: FAQ (80%)</span>
                      <span style={{ color: "#0396A6" }}>100% resolved</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Bottom Row: AI Insight Card & Performance Summary */}
              <div style={{ display: "grid", gridTemplateColumns: appliedConfig.widgets.performance ? "1.5fr 1fr" : "1fr", gap: 6, flexShrink: 0 }}>
                {appliedConfig.widgets.insights && (
                  <div style={{ background: "linear-gradient(135deg, #F0FDFA 0%, #E0F2FE 100%)", border: "1px solid #CCFBF1", borderRadius: 7, padding: "4px 8px", display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#0396A6", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Sparkles size={8.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 6.5, fontWeight: 800, color: "#0F766E" }}>✨ AI Automated Insight</div>
                      <div style={{ fontSize: 5.8, color: "#334155", fontWeight: 600, lineHeight: 1.25 }}>
                        Conversion rate improved by 12% this week. International shoppers most active between 5AM–8AM UTC.
                      </div>
                    </div>
                  </div>
                )}

                {appliedConfig.widgets.performance && (
                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 7, padding: "4px 7px", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 5.2, color: "#94A3B8", fontWeight: 700 }}>Conversion</div>
                      <div style={{ fontSize: 7.8, fontWeight: 800, color: "#16A34A" }}>39%</div>
                    </div>
                    <div style={{ width: 1, height: 14, background: "#F1F5F9" }} />
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 5.2, color: "#94A3B8", fontWeight: 700 }}>Avg Response</div>
                      <div style={{ fontSize: 7.8, fontWeight: 800, color: "#0396A6" }}>2.1s</div>
                    </div>
                    <div style={{ width: 1, height: 14, background: "#F1F5F9" }} />
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 5.2, color: "#94A3B8", fontWeight: 700 }}>CSAT</div>
                      <div style={{ fontSize: 7.8, fontWeight: 800, color: "#F59E0B" }}>4.6/5</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Beat 12: The Grand Closing Verdict & Choice ── */
function ClosingVerdictContent({ beat, phase }: { beat: number; phase: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 490,
        padding: "40px 40px 30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#FFFFFF",
        position: "relative",
        textAlign: "center",
      }}
    >
      {/* Top Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
        <img src="/logo-small.png" alt="Frosty" style={{ width: 32, height: 32, objectFit: "contain" }} />
        <span style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>Frosty</span>
      </div>

      {/* Main Messaging - Clean Typography */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, maxWidth: 540 }}>
        <AnimatePresence mode="wait">
          {phase === 0 ? (
            <motion.div
              key="p0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                The Crossroads
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", lineHeight: 1.2, margin: 0, letterSpacing: "-0.02em" }}>
                Stay trapped in tool chaos.<br />Or scale with Frosty.
              </h2>
              <p style={{ fontSize: 14, color: "#475569", margin: 0, maxWidth: 400, lineHeight: 1.5 }}>
                Lost 3 AM leads, manual copy-pasting, and disconnected tools — or one unified autonomous AI.
              </p>
            </motion.div>
          ) : phase === 1 ? (
            <motion.div
              key="p1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                The Old Reality vs. The Frosty Way
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", lineHeight: 1.2, margin: 0, letterSpacing: "-0.02em" }}>
                1 unified brain. Zero context lost.<br />24/7 revenue.
              </h2>
              <p style={{ fontSize: 14, color: "#475569", margin: 0, maxWidth: 400, lineHeight: 1.5 }}>
                Your entire storefront, WhatsApp, calendar, and CRM connected in real-time.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="close-p2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
            >
              <KineticWordHeadline
                fontSize="clamp(21px, 2.5vw, 26px)"
                delay={0.12}
                words={[
                  { text: "Stop" },
                  { text: "Trading" },
                  { text: "Your", breakAfter: true },
                  { text: "Time", highlight: true },
                  { text: "For", highlight: true },
                  { text: "Manual", highlight: true },
                  { text: "Chats.", highlight: true },
                ]}
              />
              <KineticDescription delay={0.25} text="Deploy Frosty in 2 minutes and turn your store into an autonomous 24/7 conversion engine." />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Side-by-Side Reality Comparison Cards (Large, Highly Readable) */}
      <div style={{ width: "100%", maxWidth: 580, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 8 }}>
        {/* The Old Way */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: "#FFF7F7",
            border: "1.5px solid #FECACA",
            borderRadius: 12,
            padding: "14px 16px",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#DC2626", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 13 }}>❌</span> The Fragmented Way
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5.5, fontSize: 8.8, color: "#7F1D1D", lineHeight: 1.35 }}>
              <div>• 5+ Disconnected Apps &amp; Tabs</div>
              <div>• Manual chat copy-paste to CRM</div>
              <div>• 0 Replies while you sleep</div>
              <div>• High cart abandonment rate</div>
            </div>
          </div>
          <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #FEE2E2", fontSize: 7.2, color: "#991B1B", fontWeight: 700 }}>
            High merchant burnout &amp; lost deals
          </div>
        </motion.div>

        {/* The Frosty Way */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            background: "#F0FDFA",
            border: "1.5px solid #5EEAD4",
            borderRadius: 12,
            padding: "14px 16px",
            textAlign: "left",
            boxShadow: "0 10px 30px rgba(3,150,166,0.16)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: TEAL, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
              The Frosty Way
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5.5, fontSize: 8.8, color: "#0F766E", fontWeight: 700, lineHeight: 1.35 }}>
              <div>• 1 Autonomous Shared Brain</div>
              <div>• Instant WhatsApp &amp; Calendar Sync</div>
              <div>• 24/7 Conversions on Auto-Pilot</div>
              <div>• 45% Verified Lead Conversion</div>
            </div>
          </div>
          <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #CCFBF1", fontSize: 7.2, color: "#0D9488", fontWeight: 800 }}>
            100% Pipeline auto-generated in real time
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONTENT GROUP: SPLASH SCREEN (Beat 4)
   ═══════════════════════════════════════════════════════════════════ */
function SplashGroupContent() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FFFFFF", padding: 40, textAlign: "center" }}>
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: "#111B21", lineHeight: 1.3, marginBottom: 28, letterSpacing: "-0.5px" }}>
          Seamlessly transition<br />from AI to Human
        </h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} style={{ width: 14, height: 14, borderRadius: "50%", background: "#0396A6", boxShadow: "0 4px 12px rgba(3,150,166,0.3)" }} />
          <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} style={{ width: 14, height: 14, borderRadius: "50%", background: "#111B21", boxShadow: "0 4px 12px rgba(17,27,33,0.3)" }} />
          <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} style={{ width: 14, height: 14, borderRadius: "50%", background: "#F97316", boxShadow: "0 4px 12px rgba(249,115,22,0.3)" }} />
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function LiveProductTour() {
  const [beat, setBeat] = useState(0);
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);
  const [looping, setLooping] = useState(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Detect reduced motion */
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  /* Clear all scheduled timers */
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  /* ── Master timer ── */
  useEffect(() => {
    if (paused) return;

    const beatDef = BEATS[beat];
    if (!beatDef) return;

    let timer: ReturnType<typeof setTimeout>;
    let loopTimer: ReturnType<typeof setTimeout>;

    if (phase < beatDef.phases.length - 1) {
      timer = setTimeout(() => {
        setPhase(p => p + 1);
      }, beatDef.phases[phase]);
    } else {
      timer = setTimeout(() => {
        const next = (beat + 1) % TOTAL_BEATS;
        if (next === 0) {
          setLooping(true);
          loopTimer = setTimeout(() => {
            setLooping(false);
            setBeat(0);
            setPhase(0);
          }, 600);
        } else {
          setBeat(next);
          setPhase(0);
        }
      }, beatDef.phases[phase]);
    }

    return () => {
      clearTimeout(timer);
      if (loopTimer) clearTimeout(loopTimer);
    };
  }, [beat, phase, paused]);

  /* Cleanup on unmount */
  useEffect(() => () => { clearTimers(); if (resumeRef.current) clearTimeout(resumeRef.current); }, [clearTimers]);

  /* Hover/focus pause */
  const handleMouseEnter = useCallback(() => {
    setPaused(true);
    if (resumeRef.current) clearTimeout(resumeRef.current);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => {
      setPaused(false);
    }, 800);
  }, []);

  /* Jump to beat via dot click */
  const jumpToBeat = useCallback((index: number) => {
    clearTimers();
    setBeat(index);
    setPhase(0);
    setPaused(false);
  }, [clearTimers]);

  /* Derived state */
  const sceneDef = BEATS[beat];
  const contentKey =
    beat <= 1
      ? "browser"
      : beat === 2 || beat === 3 || beat === 6
        ? "whatsapp"
        : beat === 4
          ? "splash"
          : beat === 5
            ? "merchantConsole"
            : beat === 7
              ? "meeting"
              : beat === 8
                ? "transition"
                : beat === 9
                  ? "knowledge"
                  : beat <= 11
                    ? "dashboard"
                    : "closing";
  const cursor = reducedMotion ? { x: 50, y: 50, clicking: false, visible: false } : getCursorState(beat, phase);

  /* Transition config */
  const motionDur = reducedMotion ? 0 : 0.35;

  return (
    <motion.div
      animate={reducedMotion ? {} : { y: [0, -3.5, 0] }}
      transition={reducedMotion ? {} : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      style={{ position: "relative", width: "100%", maxWidth: 670 }}
      className="mx-auto lg:mx-0"
    >
      {/* ── Main Canvas Frame (Everything inside) ── */}
      <motion.div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: EASE }}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          background: "#FFFFFF",
          boxShadow: "0 32px 84px rgba(3,150,166,0.13), 0 12px 32px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06)",
          position: "relative",
          height: 490,
          outline: "none",
        }}
        tabIndex={0}
        role="region"
        aria-label="Live product tour — interactive demo of Frosty Agent"
      >
        {/* Content layer — crossfades between groups */}
        <AnimatePresence initial={false}>
          <motion.div
            key={contentKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: motionDur, ease: EASE }}
            style={{ position: "absolute", inset: 0 }}
          >
            {contentKey === "browser" && <BrowserGroupContent beat={beat} phase={phase} />}
            {contentKey === "whatsapp" && <WhatsAppGroupContent beat={beat} phase={phase} />}
            {contentKey === "splash" && <SplashGroupContent />}
            {contentKey === "merchantConsole" && <MerchantConsoleTakeoverContent beat={beat} phase={phase} />}
            {contentKey === "meeting" && <MeetingGroupContent beat={beat} phase={phase} />}
            {contentKey === "transition" && <MerchantChaosTransitionContent beat={beat} phase={phase} />}
            {contentKey === "knowledge" && <SharedBrainKnowledgeContent beat={beat} phase={phase} />}
            {contentKey === "dashboard" && <DashboardGroupContent beat={beat} phase={phase} />}
            {contentKey === "closing" && <ClosingVerdictContent beat={beat} phase={phase} />}
          </motion.div>
        </AnimatePresence>

        {/* SimCursor */}
        {!reducedMotion && <SimCursor {...cursor} />}

        {/* Loop fade overlay (Soft Frosty sheen, zero blue flash) */}
        <motion.div
          animate={{ opacity: looping ? 1 : 0 }}
          transition={{ duration: 0.35 }}
          style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.75)", zIndex: 300, pointerEvents: "none" }}
        />
      </motion.div>

      {/* Atmospheric glow */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "120%", height: "120%", background: "radial-gradient(ellipse at center, rgba(3,150,166,0.08) 0%, transparent 65%)", pointerEvents: "none", zIndex: -1 }} />
    </motion.div>
  );
}
