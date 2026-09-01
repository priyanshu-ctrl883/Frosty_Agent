// @ts-nocheck — legacy component; has async/type mismatches with current API
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bot,
  Settings,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity as ActivityIcon,
  CheckCircle2,
  Globe,
  Search,
  Filter,
  Play,
  Trash2,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Zap,
  Heart,
  Sparkles,
  Upload,
  X,
  Undo2,
  Redo2,
  Cpu,
  LayoutDashboard,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lock,
  MessageSquare,
  Clipboard as ClipboardIcon,
  Palette,
  Code,
  FileText,
  ShieldCheck,
  Mail,
  Smartphone,
  Key,
  Phone,
  Link2,
  User as UserIcon,
  Save,
  MoreVertical,
  AlertTriangle,
  Video as VideoIcon,
  PhoneCall,
  Smile,
  Paperclip,
  Mic,
  Check,
  Database,
  Share2,
  MessageCircle,
  Users,
  Signal,
  Wifi,
  EyeOff,
  Send,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { useSearchParams } from "next/navigation";
import { getToken } from "@/lib/session";
import { useWorkspace } from "@/lib/workspace";
import { API_URL as API } from "@/lib/constants";
import {
  CONVERSATION_LIST_POLL_MS,
  conversationToSession,
  formatActivityTime,
  formatContactLabel,
  getConversationBridge,
  getConversationSummary,
  listConversations,
  loadTranscript,
  postMessageFeedback,
  sendHumanReply,
  summarizeConversation,
  toggleHumanHandoff,
} from "@/lib/conversations";
import { apiRequest } from "@/lib/api";
import { getMetaConfigId, initMetaSdk, META_SDK_SCRIPT_URL } from "@/lib/metaSdk";
import { Select } from "@/components/ui/Select";

function useAuth() {
  const { me, refresh } = useWorkspace();
  return { 
    tenant: me ? { id: me.workspace_id, tenant_id: me.workspace_id, api_key: (me as any).api_key || '' } : null,
    loading: !me,
    refreshTenant: refresh
  };
}

const adminHeaders = async () => {
  const t = await getToken();
  return { Authorization: `Bearer ${t}` };
}

const getApiBase = () => (process.env.NEXT_PUBLIC_API_URL || API || "http://localhost:8000").replace(/\/+$/, "");

import CreditManager from "./CreditManager";
import { buildWidgetEmbedSnippet } from "@/lib/unified-legacy/botEmbed";
import { formatCreditsAsRupees } from "@/lib/unified-legacy/creditsMoney";
import {
  motion,
  AnimatePresence,
  useAnimation,
  type Variants,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";

function toAdminWsUrl(tenantId: string): string {
  const encoded = encodeURIComponent(tenantId);
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  const isLocal = /^(localhost|127\.0\.0\.1|::1)$/i.test(host);
  if (isLocal) {
    return `ws://${host}:8000/ws/admin/${encoded}`;
  }
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${window.location.host}/ws/admin/${encoded}`;
}

function getChannelPrefix(session: any, fallbackChannel = 'website'): 'UNI' | 'WA' | 'WB' {
  const rawId = typeof session === 'string' ? session : (session?.session_id || '');
  const ch = (typeof session === 'object' && (session?.channel || session?._channel)) || fallbackChannel;
  const sLow = String(rawId).toLowerCase();
  const cLow = String(ch).toLowerCase();

  if (cLow.includes('unified') || sLow.includes('--unified--') || sLow.includes('uni_')) {
     return 'UNI';
  }
  if (cLow.includes('wa') || cLow.includes('whatsapp') || sLow.includes('--whatsapp--') || sLow.includes('wa_') || sLow.includes(':whatsapp:')) {
     return 'WA';
  }
  return 'WB';
}

function getFormattedVisitorId(session: any, fallbackChannel = 'website'): string {
  const vid = typeof session === 'object' ? session?.visitor_id : null;
  const prefixType = getChannelPrefix(session, fallbackChannel);

  if (vid && String(vid).trim()) {
     let cleanVid = String(vid).trim().replace(/^#/, '');
     if (!cleanVid.startsWith('UNI-') && !cleanVid.startsWith('WA-') && !cleanVid.startsWith('WB-')) {
        cleanVid = `${prefixType}-${cleanVid}`;
     }
     return `#${cleanVid}`;
  }

  const rawId = typeof session === 'string' ? session : (session?.session_id || '');
  let hash = 0;
  for (let i = 0; i < rawId.length; i++) {
     hash = ((hash << 5) - hash) + rawId.charCodeAt(i);
     hash |= 0;
  }
  const alphaNum = Math.abs(hash).toString(36).toUpperCase().padStart(6, 'X').slice(-6);
  return `#${prefixType}-${alphaNum}`;
}

function getSessionDisplayName(session: any, fallbackChannel = 'website'): string {
  if (typeof session !== 'object' || !session) {
     return getFormattedVisitorId(session, fallbackChannel);
  }
  const name = session.user_name || session.name;
  if (name && String(name).trim() && String(name).trim().toLowerCase() !== 'unknown') {
     return String(name).trim();
  }
  const email = session.user_email || session.email;
  if (email && String(email).trim()) {
     return String(email).trim();
  }
  const phone = session.user_phone || session.phone;
  if (phone && String(phone).trim()) {
     return String(phone).trim();
  }
  return getFormattedVisitorId(session, fallbackChannel);
}

const FONT = "var(--font-outfit), Outfit, sans-serif";
const DISPLAY_FONT = "var(--font-cormorant), Cormorant Garamond, serif";
const SUB_FONT = "var(--font-space), Space Grotesk, sans-serif";

const T = {
  card: "#FFFFFF",
  surface: "#FCFBFD",
  border: "#E2DCEF",
  divider: "rgba(103,62,190,0.1)",
  primary: "#673EBE",
  primaryHover: "#7C4EFE",
  sage: "#673EBE",
  lightSage: "#F0EAFF",
  gold: "#FFC555",
  text: "#111318",
  textSec: "#2D2F36",
  textMuted: "#8A8D98",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
};

// ─── Reusable Animated Toggle ────────────────────────────────────────────────
const SpringToggle = ({
  checked,
  onChange,
  activeColor = T.primary,
}: {
  checked: boolean;
  onChange: () => void;
  activeColor?: string;
}) => (
  <motion.button
    type="button"
    onClick={onChange}
    className="relative flex items-center p-1 rounded-full cursor-pointer outline-none border-none"
    style={{
      width: 54,
      height: 32,
      background: checked ? activeColor : "rgba(0,0,0,0.06)",
      boxShadow: checked
        ? `inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 12px ${activeColor}40`
        : "inset 0 2px 6px rgba(0,0,0,0.08)",
    }}
    animate={{ background: checked ? activeColor : "rgba(0,0,0,0.06)" }}
    transition={{ duration: 0.3 }}
  >
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 600, damping: 30 }}
      className="w-6 h-6 bg-white rounded-full flex items-center justify-center"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
      animate={{ x: checked ? 22 : 0 }}
    >
      {checked ? (
        <Check size={12} color={activeColor} />
      ) : (
        <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
      )}
    </motion.div>
  </motion.button>
);

// ─── Animated Number Counter ─────────────────────────────────────────────────
const AnimatedNumber = ({
  value,
  suffix = "",
}: {
  value: number | string;
  suffix?: string;
}) => {
  const numericValue = typeof value === "string" ? value : value;
  return (
    <span
      style={{
        fontSize: 36,
        fontWeight: 700,
        color: T.text,
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}
    >
      {numericValue}
      {suffix}
    </span>
  );
};

// ─── Custom Chart Tooltip ────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-2xl px-4 py-3 border bg-white/90 backdrop-blur-xl"
        style={{
          borderColor: T.border,
          boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>
          {label}
        </p>
        <p style={{ fontSize: 12, color: T.textMuted, margin: "4px 0 0" }}>
          {payload[0].value} interactions
        </p>
      </div>
    );
  }
  return null;
};

// ─── Stagger Animation Variants ──────────────────────────────────────────────
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

// ─── Floating Tab Bar ────────────────────────────────────────────────────────
const TAB_ITEMS = [
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "conversations", label: "Conversations", icon: MessageSquare },
  { id: "leads", label: "Leads", icon: UserIcon },
  { id: "meetings", label: "Meetings", icon: Calendar },
  { id: "settings", label: "Settings", icon: Settings },
];

function FloatingTabBar({
  mainTab,
  setMainTab,
}: {
  mainTab: string;
  setMainTab: (id: string) => void;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const shouldBeScrolled = latest > 80;
    if (shouldBeScrolled !== isScrolled) {
      setIsScrolled(shouldBeScrolled);
    }
  });

  return (
    <>
      {/* Placeholder to prevent layout jump when the bar becomes fixed */}
      {isScrolled && <div className="h-[88px]" aria-hidden="true" />}

      <motion.div
        layout
        transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
        className={`z-50 aww-fade aww-d1 ${isScrolled ? "fixed top-1/2 right-4 -translate-y-1/2 pointer-events-none" : "relative mb-8 pt-0"}`}
      >
        <motion.div
          layout
          className={`relative flex ${isScrolled ? "justify-end" : "justify-start border-b"}`}
          style={{
            borderColor: isScrolled ? "transparent" : "rgba(0,0,0,0.08)",
          }}
        >
          <motion.div
            layout
            className={`no-scrollbar flex overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isScrolled ? "flex-col items-end gap-2 bg-panel dark:bg-panel backdrop-blur-xl shadow-2xl border border-panel-border rounded-[32px] px-2 py-4 pointer-events-auto" : "flex-row items-center gap-6"}`}
          >
            {TAB_ITEMS.map((t) => {
              const isActive = mainTab === t.id;
              const Icon = t.icon;
              return (
                <motion.button
                  layout
                  key={t.id}
                  onClick={() => setMainTab(t.id)}
                  className={`relative flex items-center transition-colors duration-300 outline-none ${isScrolled ? "px-3 py-3 rounded-full" : "px-2 py-4 max-md:px-4 max-md:py-2.5 max-md:rounded-full max-md:backdrop-blur-md max-md:bg-white/30 max-md:border max-md:border-white/40 max-md:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"}`}
                  style={{
                    color: isActive ? T.primary : T.textMuted,
                    fontSize: isScrolled ? 13 : 15,
                    fontWeight: isActive ? 600 : 500,
                  }}
                  initial="rest"
                  animate="rest"
                  whileHover={isScrolled ? "hover" : { scale: 1.02 }}
                  whileTap={{ scale: isScrolled ? 0.95 : 0.98 }}
                >
                  {isScrolled && isActive ? (
                    <motion.div
                      layoutId="activeTabBg_ubd"
                      className="absolute inset-0 rounded-full"
                      style={{ background: "rgba(73, 93, 68, 0.12)" }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  ) : null}

                  <Icon
                    size={isScrolled ? 18 : 16}
                    className="relative z-10 shrink-0"
                    style={{ order: 0 }}
                  />

                  <motion.span
                    className="relative z-10 tracking-wide overflow-hidden whitespace-nowrap"
                    initial={false}
                    animate={isScrolled ? "rest" : "expanded"}
                    variants={
                      isScrolled
                        ? {
                            rest: {
                              width: 0,
                              opacity: 0,
                              paddingRight: 0,
                              paddingLeft: 0,
                            },
                            hover: {
                              width: "auto",
                              opacity: 1,
                              paddingRight: 12,
                              paddingLeft: 4,
                            },
                          }
                        : {
                            expanded: {
                              width: "auto",
                              opacity: 1,
                              paddingLeft: 10,
                              paddingRight: 0,
                            },
                          }
                    }
                    style={{
                      order: isScrolled ? -1 : 1,
                      textAlign: isScrolled ? "right" : "left",
                    }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    {t.label}
                  </motion.span>

                  {!isScrolled && isActive && (
                    <motion.div
                      layoutId="activeTabUnderline_ubd"
                      className="absolute bottom-[-1px] left-0 right-0 h-[3px] rounded-t-md hidden md:block"
                      style={{ background: T.primary }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                  {!isScrolled && isActive && (
                    <motion.div
                      layoutId="activeTabBg_mobile_ubd"
                      className="absolute inset-0 rounded-full md:hidden"
                      style={{ background: "var(--chart-pie-remaining)" }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function UnifiedBotDashboard({
  tenantId,
  allocatedCredits = 0,
  mainBalance = 0,
  isEnabled = true,
  onManageCredits,
  refreshBalances,
  hubTab: propHubTab,
  onHubTabChange,
}: {
  tenantId: string;
  allocatedCredits?: number;
  mainBalance?: number;
  isEnabled?: boolean;
  onManageCredits?: () => void;
  refreshBalances?: () => void;
  hubTab?: "analytics" | "chats" | "leads" | "meetings" | "settings";
  onHubTabChange?: (
    tab: "analytics" | "chats" | "leads" | "meetings" | "settings",
  ) => void;
}) {
  const { tenant, refreshTenant } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get("tab") as any) || "analytics";
  const [mainTab, setMainTab] = useState<
    "analytics" | "conversations" | "leads" | "meetings" | "settings"
  >(initialTab);
  
  const [isMobileView, setIsMobileView] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (propHubTab) {
      if (propHubTab === "chats") {
        setMainTab("conversations");
      } else {
        setMainTab(propHubTab as any);
      }
    }
  }, [propHubTab]);

  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (
      tab &&
      ["analytics", "conversations", "leads", "meetings", "settings"].includes(
        tab,
      )
    ) {
      setMainTab(tab as any);
    }
    const sub = searchParams?.get("sub");
    if (
      sub &&
      [
        "credits",
        "persona",
        "knowledge",
        "whatsapp",
        "aesthetics",
      ].includes(sub)
    ) {
      setActiveSettingTab(sub as any);
    }
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<"website" | "whatsapp">("website");
  const [sessionSidebarOpen, setSessionSidebarOpen] = useState(true);

  const initialSubTab = (searchParams?.get("sub") as any) || "persona";
  const [activeSettingTab, setActiveSettingTab] = useState<
    "credits" | "persona" | "knowledge" | "whatsapp" | "aesthetics"
  >(initialSubTab);
  const [isBotOn, setIsBotOn] = useState(isEnabled);
  const [isSavingToggle, setIsSavingToggle] = useState(false);

  useEffect(() => {
    setIsBotOn(isEnabled);
  }, [isEnabled]);

  const [period, setPeriod] = useState<7 | 14 | 30>(30);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [enabledChannels, setEnabledChannels] = useState<string[]>(["website"]);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── CHANNEL HELPERS ───
  const isWhatsAppChannelEnabled = enabledChannels
    .map((c) => c.toLowerCase())
    .includes("whatsapp");
  const getSessionChannel = (
    sessionId: string | null | undefined,
    explicit?: string,
  ): "website" | "whatsapp" => {
    if (explicit === "whatsapp" || explicit === "website") return explicit;
    if (!sessionId) return "website";
    const id = String(sessionId);
    // Website widget sessions must never appear under WhatsApp
    if (id.includes("--website--") || id.includes(":website:"))
      return "website";
    if (id.startsWith("wa_")) return "whatsapp";
    if (id.includes(":whatsapp:")) return "whatsapp";
    if (id.includes("--whatsapp--")) return "whatsapp";
    // Pure E.164-ish phone (WhatsApp log session_id)
    if (/^\+?\d{10,15}$/.test(id.replace(/\s+/g, ""))) return "whatsapp";
    return "website";
  };

  const formatSessionLabel = (
    sessionId: string,
    channel: "website" | "whatsapp",
  ) => {
    const id = String(sessionId || "");
    if (channel === "whatsapp") {
      let phone = id;
      if (phone.includes("--whatsapp--"))
        phone = phone.split("--whatsapp--").pop() || phone;
      if (phone.includes(":whatsapp:"))
        phone = phone.split(":whatsapp:").pop() || phone;
      phone = phone.replace(/^wa_/, "").replace(/^\+/, "");
      return phone ? `+${phone}` : "WhatsApp user";
    }
    const visitor = id.includes("--website--")
      ? id.split("--website--").pop() || id
      : id.includes(":")
        ? id.split(":").pop() || id
        : id.replace(/^wa_/, "");
    return `User #${String(visitor).slice(-6)}`;
  };

  // ─── BOT CONFIG STATE ───
  const [cfg, setCfg] = useState({
    bot_name: "",
    persona: "",
    tone: "Professional",
    language: "English",
    fallback_message: "I'm sorry, I didn't understand that.",
  });
  const [isSavingCfg, setIsSavingCfg] = useState(false);

  // ─── WA CONNECTION HANDLERS ───
  const [waStatus, setWaStatus] = useState<{
    connected: boolean;
    phone?: string;
  }>({ connected: false });
  const [waConnecting, setWaConnecting] = useState(false);

  useEffect(() => {
    // Load Meta SDK
    if (typeof window !== "undefined" && !(window as any).FB) {
      (window as any).fbAsyncInit = function () {
        initMetaSdk((window as any).FB);
      };

      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = META_SDK_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
    }
  }, []);

  const fetchWaStatus = async () => {
    if (!tenantId) return;
    try {
      const accounts = await apiRequest<any[]>("/v1/wa/accounts");
      const list = Array.isArray(accounts) ? accounts : [];
      const active = list.find((a) => a.is_active) || list[0];
      if (active) {
        setWaStatus({ connected: true, phone: active.phone_number });
        setEnabledChannels((prev) =>
          prev.some((c) => c.toLowerCase() === "whatsapp")
            ? prev
            : [...prev, "whatsapp"],
        );
        setWaCredentials((prev) => ({
          ...prev,
          phone_number_id: active.phone_number_id || prev.phone_number_id,
          waba_id: active.waba_id || prev.waba_id,
          token: prev.token?.startsWith("•") ? "" : prev.token,
        }));
      } else {
        setWaStatus({ connected: false });
      }
    } catch (e) {
      console.warn("Failed to fetch WA accounts", e);
    }
  };

  const connectWhatsApp = () => {
    if (!(window as any).FB) {
      alert("Meta SDK is not loaded yet. Please wait a moment.");
      return;
    }

    // Meta rejects FB.login on any http:// page (including localhost).
    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:"
    ) {
      alert(
        "WhatsApp Login requires HTTPS.\n\n" +
          "Open this app via an HTTPS URL (e.g. your ngrok tunnel), then try Connect again.\n" +
          "http://localhost will not work with Meta Embedded Signup.",
      );
      return;
    }

    (window as any).FB.login(
      (response: any) => {
        if (response.authResponse?.code) {
          exchangeMetaCode(response.authResponse.code);
        }
      },
      {
        config_id: getMetaConfigId(),
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "3",
        },
      },
    );
  };

  const exchangeMetaCode = async (_code: string) => {
    window.location.assign("/whatsapp?tab=settings");
  };

  const disconnectWhatsAppAction = async () => {
    if (!confirm("Disconnect WhatsApp Business account?")) return;
    const token = await getToken();
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/integrations/whatsapp/disconnect`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    ).catch(() => {});
    setWaStatus({ connected: false });
  };

  // ─── WHATSAPP CREDENTIALS STATE (Legacy) ───
  const [waCredentials, setWaCredentials] = useState({
    token: "",
    phone_number_id: "",
    waba_id: "",
    verify_token: "assistant_whatsapp_" + tenantId.slice(0, 8),
  });
  const [isSavingCreds, setIsSavingCreds] = useState(false);

  const handleSaveManualWaCreds = async () => {
    if (
      !waCredentials.token ||
      !waCredentials.phone_number_id ||
      !waCredentials.waba_id
    ) {
      alert("Please fill Phone Number ID, WABA ID, and Access Token.");
      return;
    }
    if (waCredentials.token.startsWith("•")) {
      alert("Paste a full Meta access token (masked values cannot be saved).");
      return;
    }
    setIsSavingCreds(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${API}/auth/whatsapp/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tenantId: tenantId,
            whatsapp_access_token: waCredentials.token,
            whatsapp_business_account_id: waCredentials.waba_id,
            whatsapp_phone_number_id: waCredentials.phone_number_id,
          }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        alert("WhatsApp credentials saved securely for this tenant.");
        setWaCredentials((prev) => ({ ...prev, token: "" }));
        setWaStatus((prev) => ({ ...prev, connected: true }));
        await fetchWaStatus();
      } else {
        alert(data.detail?.error || data.error || data.detail || "Save failed");
      }
    } catch {
      alert("Failed to save credentials.");
    } finally {
      setIsSavingCreds(false);
    }
  };

  // ─── KNOWLEDGE BASE STATE (Website) ───
  const [docs, setDocs] = useState<any[]>([]);
  const [docsPage, setDocsPage] = useState(1);
  const [isFetchingDocs, setIsFetchingDocs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── WIDGET CONFIG STATE (Website) ───
  const [widgetTheme, setWidgetTheme] = useState("#00d4ff");
  const [widgetPosition, setWidgetPosition] = useState("right");

  // ─── ANALYTICS STATE (Combined) ───
  const [analytics, setAnalytics] = useState({
    total_chats: 0,
    total_wa_messages: 0,
    total_leads: 0,
    total_docs: 0,
    meetings_scheduled: 0,
    weekly_activity: [
      { name: "Mon", count: 12 },
      { name: "Tue", count: 28 },
      { name: "Wed", count: 15 },
      { name: "Thu", count: 42 },
      { name: "Fri", count: 25 },
      { name: "Sat", count: 5 },
      { name: "Sun", count: 8 },
    ],
  });

  const openWhatsAppSettings = () => {
    setMainTab("settings");
    setActiveSettingTab("whatsapp");
  };

  // ─── SESSIONS & CONVERSATIONS STATE ───
  const [sessions, setSessions] = useState<any[]>([]);
  const [fetchingSessions, setFetchingSessions] = useState(false);
  const [selSession, setSelSession] = useState<string | null>(null);
  const [sessionSearch, setSessionSearch] = useState("");
  const [convoStats, setConvoStats] = useState<
    Record<string, { tokens: number; credits: number }>
  >({});
  const [loadingSummary, setLoadingSummary] = useState<Record<string, boolean>>(
    {},
  );
  const [togglingHandoff, setTogglingHandoff] = useState<
    Record<string, boolean>
  >({});
  const [websiteHumanMode, setWebsiteHumanMode] = useState<
    Record<string, boolean>
  >({});
  const [handoffInput, setHandoffInput] = useState("");
  const [sendingHandoff, setSendingHandoff] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const handoffInputRef = useRef<HTMLInputElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const [leads, setLeads] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [meetingsConnected, setMeetingsConnected] = useState<boolean | null>(
    null,
  );
  const [convos, setConvos] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [bridgeLinks, setBridgeLinks] = useState<
    Record<string, { linked_channel: string; linked_conversation_id: string; user_phone: string }>
  >({});
  const [messageFeedback, setMessageFeedback] = useState<Record<string, string>>({});
  const [leadSearch, setLeadSearch] = useState("");
  const [leadDateFilter, setLeadDateFilter] = useState("");
  const [leadChannelFilter, setLeadChannelFilter] = useState("");
  const [leadsPage, setLeadsPage] = useState(1);
  const [expandedLeads, setExpandedLeads] = useState<Record<string, boolean>>({});
  const LEADS_PER_PAGE = 10;
  const [isCopied, setIsCopied] = useState(false);
  const [isWaTokenVisible, setIsWaTokenVisible] = useState(false);
  const [isWaTokenCopied, setIsWaTokenCopied] = useState(false);

  const [hoveredChannel, setHoveredChannel] = useState<{
    name: string;
    value: number;
  } | null>(null);

  // ─── API HANDLERS ───

  const getNormId = (id: string | null) => {
    if (!id) return "";
    const parts = id.split("--");
    const core = parts[parts.length - 1];
    return core
      .toLowerCase()
      .replace("sess_", "")
      .replace("wa_", "")
      .split(":whatsapp:")[0]
      .trim();
  };

  const isSessionHuman = (sid: string | null) => {
    if (!sid) return false;
    const selected = sessions.find((s) => s.session_id === sid);
    const channel = getSessionChannel(sid, selected?._channel);
    if (channel === "whatsapp") return Boolean(selected?.bot_paused);
    return Boolean(websiteHumanMode[sid] || selected?.mode === "human");
  };

  const handleViewLead = (sid: string) => {
    setMainTab("leads");
    setLeadSearch(sid);
  };

  const handleToggleHandoff = async () => {
    if (!selSession || togglingHandoff[selSession]) return;
    const currentlyHuman = isSessionHuman(selSession);

    setTogglingHandoff((prev) => ({ ...prev, [selSession]: true }));
    try {
      const out = await toggleHumanHandoff(selSession, currentlyHuman);
      if (!currentlyHuman && out.claimed === false) {
        alert("Someone else claimed this conversation first.");
        return;
      }
      const nextHuman = out.human;
      setWebsiteHumanMode((prev) => ({ ...prev, [selSession]: nextHuman }));
      setSessions((prev) =>
        prev.map((s) =>
          s.session_id === selSession
            ? { ...s, bot_paused: nextHuman, mode: nextHuman ? "human" : "ai" }
            : s,
        ),
      );
      if (nextHuman) {
        const rows = await loadTranscript(selSession, "human");
        setConvos((prev) => {
          const others = prev.filter((c) => c.session_id !== selSession);
          return [...others, ...rows];
        });
      }
    } catch (e: any) {
      console.error("Toggle handoff failed", e);
      alert(e?.message || "Failed to toggle human handoff.");
    } finally {
      setTogglingHandoff((prev) => ({ ...prev, [selSession]: false }));
    }
  };

  const updateSessionWithNewMessage = (msg: any) => {
    setSessions((prev) => {
      const existing = prev.find((s) => s.session_id === msg.session_id);
      let newList;
      if (existing) {
        newList = prev.map((s) =>
          s.session_id === msg.session_id
            ? { ...s, content: msg.content, created_at: msg.created_at }
            : s,
        );
      } else {
        newList = [{ ...msg }, ...prev];
      }
      return newList.sort(
        (a, b) =>
          new Date((b.created_at || "").replace(" ", "T")).getTime() -
          new Date((a.created_at || "").replace(" ", "T")).getTime(),
      );
    });
  };

  const handleSendHandoff = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = handoffInput.trim();
    if (!text || !selSession || sendingHandoff || !isSessionHuman(selSession))
      return;

    const selected = sessions.find((s) => s.session_id === selSession);
    const channel = getSessionChannel(selSession, selected?._channel);
    const mode = isSessionHuman(selSession) ? "human" : "ai";

    const optimistic = {
      id: `optimistic-${Date.now()}`,
      session_id: selSession,
      content: text,
      role: channel === "whatsapp" ? "assistant" : "admin",
      created_at: new Date().toISOString(),
    };
    setConvos((prev) => [...prev, optimistic]);
    updateSessionWithNewMessage(optimistic);
    setHandoffInput("");
    setSendingHandoff(true);

    try {
      await sendHumanReply(selSession, text, mode);
      if (mode !== "human") {
        setWebsiteHumanMode((prev) => ({ ...prev, [selSession]: true }));
        setSessions((prev) =>
          prev.map((s) =>
            s.session_id === selSession
              ? { ...s, mode: "human", bot_paused: true }
              : s,
          ),
        );
      }
      const rows = await loadTranscript(selSession, "human");
      setConvos((prev) => {
        const others = prev.filter((c) => c.session_id !== selSession);
        return [...others, ...rows];
      });
    } catch (err: any) {
      console.error("Send handoff failed", err);
      setConvos((prev) => prev.filter((c) => c.id !== optimistic.id));
      setHandoffInput(text);
      alert(err?.message || "Failed to send message.");
    } finally {
      setSendingHandoff(false);
      handoffInputRef.current?.focus();
    }
  };

  const fetchBotConfig = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tenant/bot-config`,
        { headers: await adminHeaders() },
      );
      const data = await res.json();
      if (data) {
        setCfg((prev) => ({ ...prev, ...data }));
        if (
          Array.isArray(data.enabled_channels) &&
          data.enabled_channels.length > 0
        ) {
          setEnabledChannels(data.enabled_channels);
        } else {
          setEnabledChannels(["website"]);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch bot config:", e);
    }
  };

  const refreshSessions = async () => {
    try {
      const [websiteConvs, waConvs] = await Promise.all([
        listConversations({ channel: "website", limit: 50 }),
        listConversations({ channel: "whatsapp", limit: 50 }),
      ]);
      const modeMap: Record<string, boolean> = {};
      const websiteRows = websiteConvs.map((c) => {
        const human = c.mode === "human";
        modeMap[c.id] = human;
        return conversationToSession(c);
      });
      setWebsiteHumanMode(modeMap);
      const waRows = waConvs.map((c) => conversationToSession(c));
      const sessionList = [...websiteRows, ...waRows].sort(
        (a, b) =>
          new Date((b.created_at || "").replace(" ", "T")).getTime() -
          new Date((a.created_at || "").replace(" ", "T")).getTime(),
      );
      setSessions(sessionList);
      return { sessionList, websiteRows, waRows };
    } catch (e) {
      console.warn("Failed to refresh conversations:", e);
      return null;
    }
  };

  const fetchAllData = async () => {
    setIsLoadingAnalytics(true);
    setFetchingSessions(true);
    try {
      const sessionData = await refreshSessions();
      setConvos([]);
      setConvoStats({});

      let lList: any[] = [];
      try {
        const leadsData = await apiRequest<any>("/v1/leads");
        lList = leadsData?.items || leadsData?.leads || (Array.isArray(leadsData) ? leadsData : []);
      } catch (leadsErr) {
        console.warn("Failed to fetch leads data:", leadsErr);
      }
      setLeads(lList);

      let meetData: any = { meetings: [], connected: false };
      try {
        meetData = await apiRequest<any>("/v1/meetings");
      } catch (meetErr) {
        console.warn("Failed to fetch meetings data:", meetErr);
      }
      setMeetings(meetData.meetings || meetData?.items || []);
      setMeetingsConnected(Boolean(meetData.connected));

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const today = new Date();
      const weeklyData: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        weeklyData.push({
          name: days[d.getDay()],
          count: 0,
          date: d.toISOString().split("T")[0],
        });
      }

      sessionData?.sessionList.forEach((s: any) => {
        if (!s.created_at) return;
        const d = new Date(s.created_at);
        if (isNaN(d.getTime())) return;
        const dateStr = d.toISOString().split("T")[0];
        const dayMatch = weeklyData.find((w) => w.date === dateStr);
        if (dayMatch) {
          dayMatch.count += 1;
        }
      });

      setAnalytics((prev) => ({
        ...prev,
        total_chats: sessionData?.websiteRows.length ?? 0,
        total_wa_messages: sessionData?.waRows.length ?? 0,
        total_leads: lList.length,
        meetings_scheduled:
          (meetData.meetings || meetData?.items || [])?.filter((m: any) => !!m.session_id)
            .length || 0,
        weekly_activity: weeklyData,
      }));
    } catch (e) {
      console.warn("Failed to fetch dashboard data:", e);
    } finally {
      setIsLoadingAnalytics(false);
      setFetchingSessions(false);
    }
  };

  const fetchKnowledge = async () => {
    setIsFetchingDocs(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tenant/knowledge`,
        { headers: await adminHeaders() },
      );
      const data = await res.json();
      const dList = data.documents || [];
      setDocs(dList);
      setAnalytics((prev) => ({ ...prev, total_docs: dList.length }));
    } catch (e) {
      console.error("Failed to fetch docs", e);
    } finally {
      setIsFetchingDocs(false);
    }
  };

  const toggleBotOn = async (nextValue?: boolean) => {
    const newVal = typeof nextValue === "boolean" ? nextValue : !isBotOn;
    setIsBotOn(newVal);
    setIsSavingToggle(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tenant/features/unified_bot/toggle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await adminHeaders()) },
          body: JSON.stringify({ enabled: newVal }),
        },
      );
      if (!res.ok) {
        throw new Error(`Toggle failed with status ${res.status}`);
      }
    } catch (e) {
      console.error("Failed to toggle bot", e);
      setIsBotOn(!newVal);
    } finally {
      setIsSavingToggle(false);
    }
  };

  useEffect(() => {
    if (!tenantId) return;
    fetchBotConfig();
    fetchAllData();
    fetchKnowledge();
    fetchWaStatus();
  }, [tenantId, allocatedCredits]);

  useEffect(() => {
    if (!tenantId) return;
    const id = window.setInterval(() => void refreshSessions(), CONVERSATION_LIST_POLL_MS);
    return () => window.clearInterval(id);
  }, [tenantId]);

  // -- Analytics API fetch -- replaces broken manual count from page-limited arrays --
  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      const headers = await adminHeaders();
      const apiBase = getApiBase();

    Promise.allSettled([
      fetch(
        `${apiBase}/tenant/analytics/overview?days=${period}&channel=website`,
        { headers },
      ),
      fetch(
        `${apiBase}/tenant/analytics/overview?days=${period}&channel=whatsapp`,
        { headers },
      ),
      fetch(
        `${apiBase}/tenant/analytics/conversations-over-time?days=${period}&channel=all`,
        { headers },
      ),
    ])
      .then(async ([webOvRes, waOvRes, conRes]) => {
        let webConvs = 0,
          webLeads = 0,
          webTrend = 0;
        let waConvs = 0,
          waLeads = 0;

        if (webOvRes.status === "fulfilled" && webOvRes.value.ok) {
          const d = await webOvRes.value.json();
          webConvs = d.total_conversations ?? 0;
          webLeads = d.total_leads ?? 0;
          webTrend = d.trends?.conversations ?? 0;
        }
        if (waOvRes.status === "fulfilled" && waOvRes.value.ok) {
          const d = await waOvRes.value.json();
          waConvs = d.total_conversations ?? 0;
          waLeads = d.total_leads ?? 0;
        }

        const cutoff = Date.now() - period * 24 * 60 * 60 * 1000;
        const meetingsInPeriod = meetings.filter(
          (m) =>
            new Date(m.start_time || m.start || m.created_at || "").getTime() >=
            cutoff,
        ).length;

        setAnalytics((prev) => ({
          ...prev,
          total_chats: webConvs,
          total_wa_messages: waConvs,
          total_leads: webLeads + waLeads,
          meetings_scheduled: meetingsInPeriod,
        }));

        // -- Conversations over time -> area chart (combined channel) --
        if (conRes.status === "fulfilled" && conRes.value.ok) {
          const d = await conRes.value.json();
          const now = Date.now();
          const dayMap = new Map();
          for (let i = period - 1; i >= 0; i--) {
            const dt = new Date(now - i * 24 * 60 * 60 * 1000);
            const iso = dt.toISOString().slice(0, 10);
            const label =
              period === 7
                ? dt.toLocaleDateString("en-US", { weekday: "short" })
                : dt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
            dayMap.set(iso, { name: label, count: 0, date: iso });
          }
          (d.data || []).forEach((r: any) => {
            const key = String(r.day).slice(0, 10);
            if (dayMap.has(key)) dayMap.get(key).count = r.conversations || 0;
          });
          setAnalytics((prev) => ({
            ...prev,
            weekly_activity: Array.from(dayMap.values()),
          }));
        }
      })
      .catch((e) => console.error("Unified analytics API fetch failed", e));
    })();
  }, [period, tenantId, meetings.length]);

  // Load transcript for the selected session from the correct source.
  // Only re-fetch when the *selected session* changes — NOT when sessions
  // metadata updates (timestamps, bot_paused), otherwise optimistic admin
  // messages get overwritten by a stale REST response.
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

  useEffect(() => {
    if (!selSession || !tenantId) return;
    const selected = sessionsRef.current.find((s) => s.session_id === selSession);
    const mode =
      selected?.mode === "human" ||
      selected?.bot_paused ||
      websiteHumanMode[selSession]
        ? "human"
        : "ai";
    let cancelled = false;

    (async () => {
      try {
        const rows = await loadTranscript(selSession, mode);
        if (cancelled) return;
        setConvos((prev) => {
          const others = prev.filter((c) => c.session_id !== selSession);
          return [...others, ...rows];
        });
        try {
          const summaryRow = await getConversationSummary(selSession);
          if (!cancelled && summaryRow.summary) {
            setSummaries((prev) => ({ ...prev, [selSession]: summaryRow.summary as string }));
          }
        } catch {
          // no summary yet
        }
        try {
          const bridge = await getConversationBridge(selSession);
          if (!cancelled && bridge) {
            setBridgeLinks((prev) => ({
              ...prev,
              [selSession]: {
                linked_channel: bridge.linked_channel,
                linked_conversation_id: bridge.linked_conversation_id,
                user_phone: bridge.user_phone,
              },
            }));
          } else if (!cancelled) {
            setBridgeLinks((prev) => {
              const next = { ...prev };
              delete next[selSession];
              return next;
            });
          }
        } catch {
          if (!cancelled) {
            setBridgeLinks((prev) => {
              const next = { ...prev };
              delete next[selSession];
              return next;
            });
          }
        }
      } catch (e) {
        console.error("Failed to load session messages", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selSession, tenantId]);

  // Poll the open thread (AI or human) so new customer messages appear without refresh.
  useEffect(() => {
    if (!selSession || !tenantId) return;

    const poll = async () => {
      const selected = sessionsRef.current.find((s) => s.session_id === selSession);
      const mode =
        websiteHumanMode[selSession] ||
        selected?.mode === "human" ||
        selected?.bot_paused
          ? "human"
          : "ai";
      try {
        const rows = await loadTranscript(selSession, mode);
        if (rows.length === 0) return;
        setConvos((prev) => {
          const others = prev.filter((c) => c.session_id !== selSession);
          return [...others, ...rows];
        });
      } catch {
        // silent — next tick will retry
      }
    };
    const id = window.setInterval(poll, CONVERSATION_LIST_POLL_MS);
    return () => window.clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selSession, tenantId, websiteHumanMode]);

  // Auto-scroll to bottom of messages when session changes or new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [selSession, convos]);

  const hasWhatsAppSessions = sessions.some(
    (s) => getSessionChannel(s.session_id, s._channel) === "whatsapp",
  );
  const hasWhatsAppCredentials = Boolean(
    waCredentials.phone_number_id ||
    waCredentials.waba_id ||
    waCredentials.token,
  );
  const isWhatsAppEnabled = waStatus.connected;

  const handleSaveConfig = async () => {
    setIsSavingCfg(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tenant/bot-config`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await adminHeaders()) },
          body: JSON.stringify(cfg),
        },
      );
      if (res.ok) alert("✅ Settings saved successfully!");
    } catch (e) {
      alert("❌ Failed to save settings.");
    } finally {
      setIsSavingCfg(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "general");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tenant/knowledge/upload`,
        {
          method: "POST",
          headers: { Authorization: (await adminHeaders()).Authorization },
          body: formData,
        },
      );
      if (res.ok) {
        fetchKnowledge();
      }
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };



  const handleDeleteDoc = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tenant/knowledge/${encodeURIComponent(filename)}`,
        {
          method: "DELETE",
          headers: await adminHeaders(),
        },
      );
      if (res.ok) {
        fetchKnowledge();
      }
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const handleSummarize = async (sid: string) => {
    setLoadingSummary((prev) => ({ ...prev, [sid]: true }));
    try {
      const data = await summarizeConversation(sid);
      if (data.summary) {
        setSummaries((prev) => ({ ...prev, [sid]: data.summary as string }));
      }
    } catch (e) {
      console.error(e);
      alert("Could not summarize this conversation.");
    } finally {
      setLoadingSummary((prev) => ({ ...prev, [sid]: false }));
    }
  };

  // Admin websocket — website human replies + WhatsApp live pause/message events
  useEffect(() => {
    if (!tenantId) return;
    const wsUrl = toAdminWsUrl(tenantId);
    if (!wsUrl) return;

    let cleanedUp = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let socket: WebSocket | null = null;

    const connect = () => {
      if (cleanedUp) return;
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data || "{}"));
          if (data.type === "bot_paused") {
            const sid = String(data.session_id || "");
            const paused = Boolean(data.bot_paused);
            setSessions((prev) =>
              prev.map((s) =>
                s.session_id === sid ? { ...s, bot_paused: paused } : s,
              ),
            );
            return;
          }
          if (data.type === "new_message" && data.message) {
            const sid = String(
              data.session_id || data.message.session_id || "",
            );
            const msg = { ...data.message, session_id: sid };
            setConvos((prev) => {
              const exists = prev.some(
                (m) =>
                  m.session_id === sid &&
                  String(m.content || "") === String(msg.content || "") &&
                  String(m.created_at || "") === String(msg.created_at || ""),
              );
              if (exists) return prev;
              return [...prev, msg];
            });
            return;
          }
          // Website live user/admin events: { session_id, role, text }
          const sid = String(data.session_id || "").trim();
          const text = String(data.text || "").trim();
          if (sid && text) {
            setConvos((prev) => [
              ...prev,
              {
                session_id: sid,
                content: text,
                role: String(data.role || "user").toLowerCase(),
                created_at: new Date().toISOString(),
              },
            ]);
            if (String(data.mode || "").toLowerCase() === "human") {
              setWebsiteHumanMode((prev) => ({ ...prev, [sid]: true }));
            }
          }
        } catch {
          // ignore malformed events
        }
      };

      socket.onclose = () => {
        if (cleanedUp) return;
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      cleanedUp = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      if (wsRef.current === socket) wsRef.current = null;
    };
  }, [tenantId]);

  useEffect(() => {
    setHandoffInput("");
  }, [selSession]);

  const embedCode = buildWidgetEmbedSnippet(tenant?.api_key || "", {
    theme: widgetTheme,
    channel: "website",
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  MAIN DASHBOARD RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="font-sans" style={{ overflowX: "hidden" }}>
      <style>{`
        .aww-fade { animation: awwFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .aww-d1 { animation-delay: 0.1s; } .aww-d2 { animation-delay: 0.2s; } .aww-d3 { animation-delay: 0.3s; }
        @keyframes awwFadeUp {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ub-orb {
          position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.3; z-index: 0; pointer-events: none;
          animation: ubFloat 20s infinite ease-in-out alternate;
        }
        @keyframes ubFloat {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, -60px) scale(1.15); }
        }
        .stat-card:hover .stat-icon { transform: scale(1.1) rotate(-5deg); }
        .stat-card:hover { box-shadow: 0 20px 40px rgba(0,0,0,0.06); transform: translateY(-4px); }
        .session-item:hover { background: rgba(73,93,68,0.04); }
        .chat-bubble-enter { animation: bubbleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div className="relative space-y-0">
        {!propHubTab && (
          <>
            {/* ═══ AMBIENT ORBS ═══ */}
            <div
              className="ub-orb"
              style={{
                background: T.primary,
                width: 500,
                height: 500,
                top: -200,
                left: -200,
              }}
            />
            <div
              className="ub-orb"
              style={{
                background: T.gold,
                width: 400,
                height: 400,
                top: 300,
                right: -200,
                animationDelay: "-7s",
              }}
            />

            {/* ═══ 1. HERO HEADER ═══ */}
            <div className="relative z-10 aww-fade">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-10 pt-4 gap-6">
                {/* Left: Title + Icon */}
                <div className="flex items-center gap-6">
                  <div className="relative flex items-center justify-center w-[72px] h-[72px]">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0 rounded-full border border-dashed opacity-20"
                      style={{ borderColor: T.primary }}
                    />
                    <div
                      className="absolute inset-[6px] rounded-full flex items-center justify-center shadow-xl"
                      style={{
                        background: `linear-gradient(135deg, ${T.primary}, ${T.sage})`,
                      }}
                    >
                      <Bot size={28} color="#fff" />
                    </div>
                    {/* Live pulse */}
                    {isBotOn && (
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full"
                        style={{ background: T.success }}
                      />
                    )}
                  </div>
                  <div>
                    <h1
                      style={{
                        fontSize: 40,
                        fontWeight: 700,
                        color: T.text,
                        margin: 0,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.1,
                      }}
                    >
                      Unified Assistant
                    </h1>
                    <p
                      style={{
                        fontSize: 16,
                        color: T.textMuted,
                        margin: "6px 0 0",
                        fontStyle: "italic",
                      }}
                    >
                      Synced intelligence across Website & WhatsApp.
                    </p>
                  </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-4">
                  {/* Budget Pill */}
                  <div
                    className="flex items-center gap-3 px-5 py-2.5 rounded-full border bg-white/50 backdrop-blur-md"
                    style={{ borderColor: T.border }}
                  >
                    <Zap size={14} style={{ color: T.gold }} />
                    <div className="flex flex-col">
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 1.5,
                          color: T.textMuted,
                        }}
                      >
                        Budget
                      </span>
                      <span
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: T.text,
                          lineHeight: 1.1,
                          letterSpacing: "-0.02em",
                          display: "flex",
                          alignItems: "baseline",
                          gap: 6,
                        }}
                      >
                        <span>{allocatedCredits.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>

                  {/* Bot Toggle */}
                  <div
                    className="flex items-center gap-3 px-4 py-2 rounded-full border bg-white/50 backdrop-blur-md cursor-pointer transition-all hover:shadow-md"
                    style={{ borderColor: T.border }}
                    onClick={() => !isSavingToggle && toggleBotOn()}
                  >
                    <div className="flex items-center gap-2">
                      {isBotOn && (
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-2 h-2 rounded-full"
                          style={{ background: T.success }}
                        />
                      )}
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          color: isBotOn ? T.success : T.textMuted,
                        }}
                      >
                        {isBotOn ? "Online" : "Offline"}
                      </span>
                    </div>
                    <SpringToggle
                      checked={isBotOn}
                      onChange={() => !isSavingToggle && toggleBotOn()}
                      activeColor={T.sage}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ 2. TAB NAVIGATION ═══ */}
            <FloatingTabBar mainTab={mainTab} setMainTab={setMainTab as any} />
          </>
        )}

        {/* ═══ 3. ANALYTICS TAB ═══ */}
        {mainTab === "analytics" && (
          <>
            {isBotOn ? (
              <div className="relative z-10 space-y-8">
                {/* ── Analytics Grid ── */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 aww-fade aww-d2 mb-3"
                >
                  {[
                    {
                      title: "Web Chats",
                      value: analytics.total_chats,
                      icon: Globe,
                      color: "#495D44",
                      bg: "rgba(73,93,68,0.08)",
                    },
                    {
                      title: "WhatsApp",
                      value: analytics.total_wa_messages,
                      icon: MessageCircle,
                      color: "#075e54",
                      bg: "rgba(7,94,84,0.06)",
                    },
                    {
                      title: "Leads",
                      value: analytics.total_leads,
                      icon: Users,
                      color: "#C59A55",
                      bg: "rgba(197,154,85,0.08)",
                    },
                    {
                      title: "Knowledge",
                      value: analytics.total_docs,
                      icon: Database,
                      color: "#67C9CE",
                      bg: "rgba(122,140,104,0.08)",
                    },
                    {
                      title: "Meetings",
                      value: analytics.meetings_scheduled,
                      icon: Calendar,
                      color: "#8B7355",
                      bg: "rgba(139,115,85,0.08)",
                    },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      variants={itemVariants}
                      className="stat-card rounded-[24px] p-5 border flex flex-col justify-between transition-all duration-700 cursor-default bg-white/40 backdrop-blur-xl relative overflow-hidden group shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:bg-white/60 hover:-translate-y-1"
                      style={{ borderColor: T.border }}
                    >
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[24px]"
                        style={{
                          background: `radial-gradient(circle at 50% 0%, ${stat.color}20, transparent 70%)`,
                        }}
                      />
                      <div className="flex items-center justify-between mb-2 relative z-10">
                        <div
                          className="stat-icon w-10 h-10 rounded-[12px] flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-sm"
                          style={{ background: stat.bg }}
                        >
                          <stat.icon size={18} style={{ color: stat.color }} />
                        </div>
                        <TrendingUp
                          size={14}
                          style={{ color: T.textMuted }}
                          className="opacity-40 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                      <div className="relative z-10 mt-4">
                        <div
                          style={{
                            fontFamily: FONT,
                            fontSize: 32,
                            fontWeight: 700,
                            color: T.text,
                            lineHeight: 1,
                          }}
                        >
                          {stat.value}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 1.5,
                            color: T.textMuted,
                            marginTop: 8,
                          }}
                        >
                          {stat.title}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* ── Area Chart (Engagement Over Time) ── */}
                <motion.div
                  variants={itemVariants}
                  className="aww-fade aww-d3 p-6 rounded-[32px] border bg-white/40 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative overflow-hidden"
                  style={{ borderColor: T.border }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 100% 0%, ${T.primary}05, transparent 50%)`,
                    }}
                  />
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                      <h3
                        style={{
                          fontFamily: FONT,
                          fontSize: 20,
                          fontWeight: 600,
                          color: T.text,
                        }}
                      >
                        Engagement Over Time
                      </h3>
                      <p
                        style={{
                          fontSize: 14,
                          color: T.textMuted,
                          marginTop: 4,
                        }}
                      >
                        Total conversations per day over the last week
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-2 px-4 py-2 rounded-full border bg-white/50"
                      style={{ borderColor: T.divider }}
                    >
                      <Calendar size={14} style={{ color: T.textMuted }} />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: T.textMuted,
                        }}
                      >
                        Last 7 Days
                      </span>
                    </div>
                  </div>
                  
                  {isMobileView && period !== 7 && (
                    <div className="md:hidden mt-2 mb-4 p-3 rounded-lg bg-[rgba(197,154,85,0.08)] border border-[rgba(197,154,85,0.2)]">
                      <p className="text-xs font-medium" style={{ color: T.gold }}>
                        Showing 7-day view. 14D and 30D views are best experienced on desktop.
                      </p>
                    </div>
                  )}

                  <div className="h-[320px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={isMobileView && period > 7 ? analytics.weekly_activity.slice(-7) : analytics.weekly_activity}
                        margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorCount"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={T.primary}
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor={T.primary}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="rgba(0,0,0,0.04)"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 12,
                            fill: T.textMuted,
                            fontWeight: 500,
                          }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 12,
                            fill: T.textMuted,
                            fontWeight: 500,
                          }}
                          dx={-10}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 16,
                            border: `1px solid ${T.border}`,
                            boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
                            background: "rgba(255,255,255,0.85)",
                            backdropFilter: "blur(12px)",
                            fontFamily: FONT,
                            fontWeight: 600,
                            color: T.text,
                          }}
                          itemStyle={{
                            color: T.primary,
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke={T.primary}
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorCount)"
                          activeDot={{ r: 8, strokeWidth: 0, fill: T.primary }}
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* ── Split Data Section ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 aww-fade aww-d4 relative z-10">
                  {/* Channel Breakdown */}
                  <motion.div
                    variants={itemVariants}
                    className="p-6 rounded-[32px] border bg-white/40 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between"
                    style={{ borderColor: T.border }}
                  >
                    <h3
                      style={{
                        fontFamily: FONT,
                        fontSize: 18,
                        fontWeight: 600,
                        color: T.text,
                        marginBottom: 16,
                      }}
                    >
                      Channel Breakdown
                    </h3>
                    <div className="h-[220px] flex items-center justify-center relative w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Website",
                                realValue: analytics.total_chats,
                                value: Math.max(analytics.total_chats, 0.01),
                              },
                              {
                                name: "WhatsApp",
                                realValue: analytics.total_wa_messages,
                                value: Math.max(
                                  analytics.total_wa_messages,
                                  0.01,
                                ),
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={105}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            onMouseEnter={(data: any) =>
                              setHoveredChannel({
                                name: data.name || "",
                                value:
                                  data.realValue ??
                                  data.payload?.realValue ??
                                  0,
                              })
                            }
                            onMouseLeave={() => setHoveredChannel(null)}
                          >
                            <Cell key="cell-0" fill={T.primary} />
                            <Cell key="cell-1" fill="var(--chart-pie-unread)" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
                        <div
                          style={{
                            fontFamily: FONT,
                            fontSize: 28,
                            fontWeight: 700,
                            color: T.text,
                            lineHeight: 1,
                          }}
                        >
                          {hoveredChannel
                            ? hoveredChannel.value
                            : analytics.total_chats +
                              analytics.total_wa_messages}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 1.2,
                            color: T.textMuted,
                            marginTop: 4,
                          }}
                        >
                          {hoveredChannel ? hoveredChannel.name : "Total"}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-4 relative z-10">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: T.primary }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: T.textMuted,
                          }}
                        >
                          Website{" "}
                          <span style={{ color: T.text }}>
                            ({analytics.total_chats})
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[var(--chart-pie-unread)]" />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: T.textMuted,
                          }}
                        >
                          WhatsApp{" "}
                          <span style={{ color: T.text }}>
                            ({analytics.total_wa_messages})
                          </span>
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* AI Performance Insights */}
                  <motion.div
                    variants={itemVariants}
                    className="p-6 rounded-[32px] border bg-white/40 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between"
                    style={{ borderColor: T.border }}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 100% 100%, ${T.gold}10, transparent 70%)`,
                      }}
                    />
                    <h3
                      style={{
                        fontFamily: FONT,
                        fontSize: 18,
                        fontWeight: 600,
                        color: T.text,
                        marginBottom: 16,
                      }}
                      className="relative z-10"
                    >
                      AI Performance Insights
                    </h3>

                    <div className="flex flex-col items-center justify-center relative z-10 h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart
                          cx="50%"
                          cy="50%"
                          outerRadius="78%"
                          data={[
                            { subject: "Speed", Score: 95, fullMark: 100 },
                            { subject: "Resolution", Score: 92, fullMark: 100 },
                            { subject: "Conversion", Score: 88, fullMark: 100 },
                            { subject: "Empathy", Score: 89, fullMark: 100 },
                            { subject: "Accuracy", Score: 98, fullMark: 100 },
                          ]}
                        >
                          <PolarGrid stroke="rgba(0,0,0,0.05)" />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{
                              fill: T.text,
                              fontSize: 13,
                              fontWeight: 700,
                              fontFamily: FONT,
                            }}
                          />
                          <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                          />
                          <defs>
                            <radialGradient
                              id="radarMultiGlow"
                              cx="50%"
                              cy="50%"
                              r="50%"
                            >
                              <stop
                                offset="0%"
                                stopColor="#C59A55"
                                stopOpacity={0.7}
                              />
                              <stop
                                offset="50%"
                                stopColor={T.primary}
                                stopOpacity={0.5}
                              />
                              <stop
                                offset="100%"
                                stopColor="var(--chart-pie-unread)"
                                stopOpacity={0.1}
                              />
                            </radialGradient>
                          </defs>
                          <Radar
                            name="Score"
                            dataKey="Score"
                            stroke={T.primary}
                            strokeWidth={4}
                            fill="url(#radarMultiGlow)"
                            fillOpacity={1}
                            isAnimationActive={true}
                            animationEasing="ease-out"
                            animationDuration={2000}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: 12,
                              border: `1px solid ${T.border}`,
                              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                              background: "rgba(255,255,255,0.9)",
                              backdropFilter: "blur(8px)",
                              fontFamily: FONT,
                              fontWeight: 600,
                              color: T.text,
                            }}
                            itemStyle={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: T.text,
                            }}
                            cursor={false}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </div>

                {/* ROW 1: Conversion Funnel & Channel Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 aww-fade aww-d2 mb-6 relative z-10">
                  {/* Conversion Funnel (Vertical) */}
                  <div
                    className="p-6 rounded-[32px] border shadow-sm"
                    style={{
                      backgroundColor: T.surface,
                      borderColor: T.border,
                    }}
                  >
                    <div
                      className="text-sm font-bold mb-6 flex items-center justify-between"
                      style={{ color: T.text }}
                    >
                      <span>Unified Conversion Funnel</span>
                      <span
                        className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md"
                        style={{
                          color: T.textMuted,
                          backgroundColor: "rgba(0,0,0,0.05)",
                        }}
                      >
                        Last {period} Days
                      </span>
                    </div>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            {
                              name: "Total Chats",
                              value:
                                analytics.total_chats +
                                  analytics.total_wa_messages || 0,
                              fill: T.primary,
                            },
                            {
                              name: "Leads",
                              value: analytics.total_leads || 0,
                              fill: "var(--chart-leads)",
                            },
                            {
                              name: "Meetings",
                              value: analytics.meetings_scheduled || 0,
                              fill: "var(--chart-meetings)",
                            },
                          ]}
                          margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: T.textMuted,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                            dy={10}
                          />
                          <YAxis hide />
                          <Tooltip
                            cursor={{ fill: "transparent" }}
                            contentStyle={{
                              borderRadius: 12,
                              border: `1px solid ${T.border}`,
                              background: "rgba(255,255,255,0.85)",
                              backdropFilter: "blur(12px)",
                              fontSize: "12px",
                            }}
                            itemStyle={{ color: T.primary, fontWeight: 600 }}
                            labelStyle={{ fontWeight: 600, color: T.text }}
                            formatter={(val) => [val, "count"]}
                          />
                          <Bar
                            dataKey="value"
                            fill={T.primary}
                            radius={[4, 4, 0, 0]}
                            barSize={40}
                          >
                            {[
                              {
                                name: "Total Chats",
                                value:
                                  analytics.total_chats +
                                  analytics.total_wa_messages,
                                fill: T.primary,
                              },
                              {
                                name: "Leads",
                                value: analytics.total_leads,
                                fill: "var(--chart-leads)",
                              },
                              {
                                name: "Meetings",
                                value: analytics.meetings_scheduled,
                                fill: "var(--chart-meetings)",
                              },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Channel Breakdown (Pie Chart) */}
                  <div
                    className="p-6 rounded-[32px] border shadow-sm flex flex-col justify-between"
                    style={{
                      backgroundColor: T.surface,
                      borderColor: T.border,
                    }}
                  >
                    <div
                      className="text-sm font-bold mb-4 flex items-center justify-between"
                      style={{ color: T.text }}
                    >
                      <span>Channel Breakdown</span>
                      <span
                        className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md"
                        style={{
                          color: T.textMuted,
                          backgroundColor: "rgba(0,0,0,0.05)",
                        }}
                      >
                        Last {period} Days
                      </span>
                    </div>
                    <div className="flex-1 w-full relative flex flex-col items-center justify-center min-h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Website",
                                realValue: analytics.total_chats,
                                value: Math.max(analytics.total_chats, 0.01),
                              },
                              {
                                name: "WhatsApp",
                                realValue: analytics.total_wa_messages,
                                value: Math.max(
                                  analytics.total_wa_messages,
                                  0.01,
                                ),
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius="65%"
                            outerRadius="85%"
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={4}
                            onMouseEnter={(data: any) =>
                              setHoveredChannel({
                                name: data.name || "",
                                value:
                                  data.realValue ??
                                  data.payload?.realValue ??
                                  0,
                              })
                            }
                            onMouseLeave={() => setHoveredChannel(null)}
                          >
                            <Cell key="cell-0" fill={T.primary} />
                            <Cell key="cell-1" fill="var(--chart-pie-unread)" />
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: 12,
                              border: `1px solid ${T.border}`,
                              background: "rgba(255,255,255,0.85)",
                              backdropFilter: "blur(12px)",
                              fontSize: "12px",
                            }}
                            itemStyle={{ color: T.primary, fontWeight: 600 }}
                            labelStyle={{ fontWeight: 600, color: T.text }}
                            formatter={(val, name, props) => [
                              props.payload.realValue,
                              name,
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
                        <span
                          className="text-3xl font-bold"
                          style={{ color: T.text, lineHeight: 1 }}
                        >
                          {hoveredChannel
                            ? hoveredChannel.value
                            : analytics.total_chats +
                              analytics.total_wa_messages}
                        </span>
                        <span
                          className="text-[10px] uppercase font-bold tracking-widest mt-2"
                          style={{ color: T.textMuted }}
                        >
                          {hoveredChannel ? hoveredChannel.name : "Total Chats"}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-4 relative z-10">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: T.primary }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: T.textMuted,
                          }}
                        >
                          Website{" "}
                          <span style={{ color: T.text }}>
                            ({analytics.total_chats})
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[var(--chart-pie-unread)]" />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: T.textMuted,
                          }}
                        >
                          WhatsApp{" "}
                          <span style={{ color: T.text }}>
                            ({analytics.total_wa_messages})
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROW 2: Engagement Over Time */}
                <motion.div
                  variants={itemVariants}
                  className="aww-fade aww-d3 p-6 rounded-[32px] border shadow-sm relative overflow-hidden mb-6"
                  style={{ backgroundColor: T.surface, borderColor: T.border }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 100% 0%, ${T.primary}05, transparent 50%)`,
                    }}
                  />
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                      <h3
                        style={{ fontSize: 20, fontWeight: 600, color: T.text }}
                      >
                        Engagement Over Time
                      </h3>
                      <p
                        style={{
                          fontSize: 14,
                          color: T.textMuted,
                          marginTop: 4,
                        }}
                      >
                        Total conversations per day over the last week
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-2 px-4 py-2 rounded-full border bg-white/50"
                      style={{ borderColor: T.divider }}
                    >
                      <Calendar size={14} style={{ color: T.textMuted }} />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: T.textMuted,
                        }}
                      >
                        Last {period} Days
                      </span>
                    </div>
                  </div>
                  <div className="h-[320px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analytics.weekly_activity}
                        margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorCountUnified"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={T.primary}
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor={T.primary}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="rgba(0,0,0,0.04)"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 12,
                            fill: T.textMuted,
                            fontWeight: 500,
                          }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 12,
                            fill: T.textMuted,
                            fontWeight: 500,
                          }}
                          dx={-10}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 16,
                            border: `1px solid ${T.border}`,
                            boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
                            background: "rgba(255,255,255,0.85)",
                            backdropFilter: "blur(12px)",
                            fontWeight: 600,
                            color: T.text,
                          }}
                          itemStyle={{
                            color: T.primary,
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        />
                        <Area
                          type="linear"
                          dataKey="count"
                          stroke={T.primary}
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorCountUnified)"
                          dot={{ r: 4, fill: T.primary }}
                          activeDot={{ r: 8, strokeWidth: 0, fill: T.primary }}
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* ROW 3: Latest Conversations */}
                <motion.div
                  variants={itemVariants}
                  className="aww-fade aww-d4 p-6 rounded-[32px] border shadow-sm flex flex-col min-h-[120px] mb-6"
                  style={{ backgroundColor: T.surface, borderColor: T.border }}
                >
                  <div
                    className="text-sm font-bold mb-4 flex justify-between items-center"
                    style={{ color: T.text }}
                  >
                    <span>Latest Conversations</span>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md"
                        style={{
                          color: T.textMuted,
                          backgroundColor: "rgba(0,0,0,0.05)",
                        }}
                      >
                        Last {period} Days
                      </span>
                      {sessions.filter(
                        (s) =>
                          new Date(
                            (s.created_at || "").replace(" ", "T"),
                          ).getTime() >=
                          Date.now() - period * 24 * 60 * 60 * 1000,
                      ).length > 5 && (
                        <button
                          onClick={() => setMainTab("conversations")}
                          className="text-xs border rounded px-2 py-1 transition-all"
                          style={{
                            color: T.textMuted,
                            borderColor: T.border,
                            backgroundColor: "transparent",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "rgba(0,0,0,0.05)")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                        >
                          View All
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {sessions
                      .filter(
                        (s) =>
                          new Date(
                            (s.created_at || "").replace(" ", "T"),
                          ).getTime() >=
                          Date.now() - period * 24 * 60 * 60 * 1000,
                      )
                      .slice(0, 5)
                      .map((s, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setMainTab("conversations");
                            setSelSession(s.session_id);
                          }}
                          className="p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between"
                          style={{
                            borderColor: T.divider,
                            backgroundColor: "transparent",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "rgba(0,0,0,0.02)")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                              style={{
                                backgroundColor: `${T.primary}1A`,
                                color: T.primary,
                              }}
                            >
                              {s.session_id
                                .replace("sess_", "")
                                .slice(0, 2)
                                .toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <div
                                className="text-sm font-bold truncate"
                                style={{ color: T.text }}
                              >
                                User #{getNormId(s.session_id)}
                              </div>
                              <div
                                className="text-sm line-clamp-1 max-w-[400px]"
                                style={{ color: T.textMuted }}
                              >
                                "{s.content || "Start of conversation"}"
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row items-end md:items-center gap-1.5 md:gap-3 shrink-0 whitespace-nowrap">
                            <span
                              className="text-xs md:text-sm font-medium"
                              style={{ color: T.textMuted }}
                            >
                              {new Date(
                                (s.created_at || "").replace(" ", "T"),
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span
                              className="px-2.5 py-1 rounded-md text-[10px] md:text-xs font-bold shrink-0"
                              style={{
                                backgroundColor: `${T.primary}1A`,
                                color: T.primary,
                              }}
                            >
                              Open
                            </span>
                          </div>
                        </div>
                      ))}
                    {sessions.filter(
                      (s) =>
                        new Date(
                          (s.created_at || "").replace(" ", "T"),
                        ).getTime() >=
                        Date.now() - period * 24 * 60 * 60 * 1000,
                    ).length === 0 && (
                      <div
                        className="text-center text-xs py-6"
                        style={{ color: T.textMuted }}
                      >
                        No recent conversations
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border border-dashed rounded-2xl bg-panel border-panel-border">
                <div className="text-center">
                  <Globe
                    size={32}
                    style={{ color: T.textMuted }}
                    className="mx-auto mb-3 opacity-50"
                  />
                  <h3 style={{ color: T.text }} className="font-semibold mb-1">
                    Agent is Paused
                  </h3>
                  <p style={{ color: T.textMuted, fontSize: 13 }}>
                    Toggle the switch above to start answering chats.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ 3. CONVERSATIONS TAB ═══ */}
        {mainTab === "conversations" && (
          <>
            {isBotOn ? (
              <div className="relative z-10 space-y-8">
                {/* ── Conversations Hub ── */}
                <div
                  className="rounded-[24px] border border-panel-border overflow-hidden flex flex-col bg-panel shadow-sm"
                  style={{ height: 650 }}
                >
                  {/* Hub Header */}
                  <div className="flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b border-panel-border bg-input-bg gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background:
                            activeTab === "website"
                              ? "rgba(73,93,68,0.1)"
                              : "rgba(7,94,84,0.08)",
                        }}
                      >
                        {activeTab === "website" ? (
                          <Globe size={16} style={{ color: T.primary }} />
                        ) : (
                          <MessageCircle size={16} color="#075e54" />
                        )}
                      </div>
                      <h3
                        className="truncate"
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: T.text,
                          margin: 0,
                        }}
                      >
                        {activeTab === "website"
                          ? "Website Console"
                          : "WhatsApp Stream"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                      {/* Channel Switcher */}
                      <div className="flex p-1 rounded-full border border-panel-border bg-input-bg">
                        <button
                          onClick={() => setActiveTab("website")}
                          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                          style={{
                            background:
                              activeTab === "website"
                                ? T.primary
                                : "transparent",
                            color:
                              activeTab === "website" ? "#fff" : T.textMuted,
                          }}
                        >
                          <Globe size={12} /> Website
                        </button>
                        <div className="relative group">
                          <button
                            onClick={() => {
                              if (isWhatsAppEnabled) {
                                setActiveTab("whatsapp");
                                return;
                              }
                              openWhatsAppSettings();
                            }}
                            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                            style={{
                              background:
                                activeTab === "whatsapp"
                                  ? "#075e54"
                                  : "transparent",
                              color:
                                activeTab === "whatsapp" ? "#fff" : T.textMuted,
                              opacity: !isWhatsAppEnabled ? 0.5 : 1,
                            }}
                          >
                            <MessageCircle size={12} /> WhatsApp
                            {!isWhatsAppEnabled && <Lock size={10} />}
                          </button>
                          {!isWhatsAppEnabled && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-[10px] font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 border border-white/10">
                              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-white/10" />
                              Click to connect WhatsApp
                            </div>
                          )}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.3 }}
                        onClick={fetchAllData}
                        className="w-8 h-8 rounded-full flex items-center justify-center border border-panel-border text-muted transition-all"
                      >
                        <RefreshCw
                          size={14}
                          className={fetchingSessions ? "animate-spin" : ""}
                        />
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden relative">
                    {/* Sidebar re-open toggle (visible when sidebar is closed) */}
                    {!sessionSidebarOpen && (
                      <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSessionSidebarOpen(true)}
                        className="absolute top-3 left-3 z-30 w-9 h-9 rounded-xl flex items-center justify-center border border-panel-border bg-panel text-[#0396A6] shadow-lg transition-all hover:shadow-xl hidden lg:flex"
                        title="Show sessions"
                      >
                        <ChevronRight size={16} />
                      </motion.button>
                    )}

                    {/* Left: Session Sidebar */}
                    <AnimatePresence>
                      {sessionSidebarOpen && (!selSession || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                        <motion.div
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: typeof window !== 'undefined' && window.innerWidth < 1024 ? "100%" : 320, opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={{
                            type: "spring",
                            bounce: 0,
                            duration: 0.35,
                          }}
                          className={`border-r border-panel-border flex flex-col overflow-hidden shrink-0 bg-panel/60 ${selSession ? "hidden lg:flex w-full lg:w-[320px]" : "w-full lg:w-[320px]"}`}
                        >
                          <div className="p-4 shrink-0">
                            <div className="flex items-center gap-2">
                              <div
                                className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border"
                                style={{
                                  borderColor: T.border,
                                  background: T.surface,
                                }}
                              >
                                <Search
                                  size={14}
                                  style={{ color: T.textMuted }}
                                />
                                <input
                                  type="text"
                                  placeholder={`Filter ${activeTab} sessions...`}
                                  value={searchQuery}
                                  onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                  }
                                  className="bg-transparent text-sm w-full outline-none placeholder:opacity-50"
                                  style={{ color: T.text }}
                                />
                              </div>
                              <button
                                onClick={() => setSessionSidebarOpen(false)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-all hover:bg-black/5"
                                style={{
                                  borderColor: T.border,
                                  color: T.textMuted,
                                }}
                                title="Close sidebar"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
                            {(() => {
                              const tabSessions = sessions
                                .filter(
                                  (s) =>
                                    getSessionChannel(
                                      s.session_id,
                                      s._channel,
                                    ) === activeTab,
                                )
                                .filter((s) => {
                                  if (!searchQuery.trim()) return true;
                                  const q = searchQuery.toLowerCase();
                                  return (
                                    s.session_id.toLowerCase().includes(q) ||
                                    (s.content || "")
                                      .toLowerCase()
                                      .includes(q) ||
                                    (s.user_email || "")
                                      .toLowerCase()
                                      .includes(q)
                                  );
                                });
                              if (tabSessions.length === 0)
                                return (
                                  <div className="flex flex-col items-center justify-center p-10 text-center space-y-4 h-full">
                                    <Bot
                                      size={32}
                                      style={{
                                        color: T.textMuted,
                                        opacity: 0.4,
                                      }}
                                    />
                                    <div
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: 2,
                                        color: T.textMuted,
                                        opacity: 0.5,
                                      }}
                                    >
                                      {searchQuery.trim()
                                        ? `No matches for "${searchQuery}"`
                                        : `No active ${activeTab} chats`}
                                    </div>
                                  </div>
                                );
                              return tabSessions.map((s, i) => {
                                const ch = getSessionChannel(
                                  s.session_id,
                                  s._channel,
                                );
                                const displayName = formatContactLabel(s.contact_label, {
                                  channel: ch,
                                });
                                const isSelected = selSession === s.session_id;
                                return (
                                  <motion.button
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileHover={{ scale: 1.01, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ delay: i * 0.03 }}
                                    onClick={() => setSelSession(s.session_id)}
                                    className="session-item w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl transition-all duration-300 border hover:shadow-md"
                                    style={{
                                      borderColor: isSelected
                                        ? ch === "whatsapp"
                                          ? "#075e5430"
                                          : `${T.primary}30`
                                        : "transparent",
                                      background: isSelected
                                        ? ch === "whatsapp"
                                          ? "rgba(7,94,84,0.05)"
                                          : "rgba(73,93,68,0.05)"
                                        : "transparent",
                                    }}
                                  >
                                    <div className="relative">
                                      <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                                        style={{
                                          background:
                                            ch === "whatsapp"
                                              ? "rgba(7,94,84,0.08)"
                                              : "rgba(73,93,68,0.08)",
                                          color:
                                            ch === "whatsapp"
                                              ? "#075e54"
                                              : T.primary,
                                        }}
                                      >
                                        {displayName.slice(0, 2).toUpperCase()}
                                      </div>
                                      <div
                                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white shadow-sm"
                                        style={{
                                          background:
                                            ch === "whatsapp"
                                              ? "var(--chart-pie-unread)"
                                              : T.primary,
                                          border: "2px solid white",
                                        }}
                                      >
                                        {ch === "whatsapp" ? (
                                          <MessageCircle size={7} />
                                        ) : (
                                          <Globe size={7} />
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                      <div className="flex justify-between items-center mb-0.5">
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className="font-semibold text-xs truncate"
                                            style={{ color: T.text }}
                                          >
                                            {displayName}
                                          </span>
                                          {isSessionHuman(s.session_id) && (
                                            <span
                                              className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
                                              style={{
                                                background: "#FFEAE5",
                                                color: "#D84315",
                                                border: "1px solid #FFAB91",
                                              }}
                                            >
                                              Human
                                            </span>
                                          )}
                                        </div>
                                        <span
                                          style={{
                                            fontSize: 10,
                                            color: T.textMuted,
                                          }}
                                        >
                                          {formatActivityTime(s.created_at)}
                                        </span>
                                      </div>
                                      <div
                                        className="text-[11px] truncate"
                                        style={{
                                          color: T.textMuted,
                                          fontStyle: "italic",
                                        }}
                                      >
                                        &quot;{s.content || "..."}&quot;
                                      </div>
                                    </div>
                                  </motion.button>
                                );
                              });
                            })()}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Right: Chat Area */}
                    <div
                      className={`flex-1 flex flex-col relative overflow-hidden ${!selSession ? "hidden lg:flex" : "w-full flex"}`}
                      style={{ background: "rgba(255,255,255,0.2)" }}
                    >
                      {selSession ? (
                        <div
                          className="flex flex-col h-full"
                          style={
                            activeTab === "whatsapp"
                              ? {
                                  backgroundImage:
                                    "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                                  backgroundSize: "cover",
                                  backgroundBlendMode: "overlay",
                                  opacity: 0.95,
                                }
                              : {}
                          }
                        >
                          {/* Chat Header */}
                          <div
                            className="px-3 md:px-6 py-3 md:py-4 flex items-center justify-between shrink-0 border-b z-10 gap-2"
                            style={{
                              borderColor: T.divider,
                              background: "rgba(255,255,255,0.7)",
                              backdropFilter: "blur(16px)",
                            }}
                          >
                            <div className="flex items-center gap-2 md:gap-3 min-w-0">
                              <button
                                onClick={() => setSelSession("")}
                                className="lg:hidden p-2 text-foreground hover:bg-muted/10 rounded-xl transition-all shrink-0 flex items-center justify-center border border-panel-border"
                                title="Back to session list"
                              >
                                <ArrowLeft size={16} />
                              </button>
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-md"
                                style={{
                                  background:
                                    activeTab === "whatsapp"
                                      ? "#075e54"
                                      : T.primary,
                                }}
                              >
                                {selSession
                                  .replace("wa_", "")
                                  .slice(-2)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div
                                  className="text-sm font-bold"
                                  style={{ color: T.text }}
                                >
                                  Session Details
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Signal
                                    size={10}
                                    style={{
                                      color:
                                        activeTab === "whatsapp"
                                          ? "#075e54"
                                          : T.primary,
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                      letterSpacing: 1,
                                      color:
                                        activeTab === "whatsapp"
                                          ? "#075e54"
                                          : T.primary,
                                    }}
                                  >
                                    {activeTab === "whatsapp"
                                      ? "WhatsApp Direct"
                                      : "Website Widget"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleViewLead(selSession)}
                                className="px-4 py-1.5 rounded-full text-[10px] font-bold border flex items-center gap-2 transition-all"
                                style={{
                                  background: `${T.gold}10`,
                                  color: T.gold,
                                  borderColor: `${T.gold}30`,
                                }}
                              >
                                <Heart size={11} /> Lead
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSummarize(selSession)}
                                className="px-4 py-1.5 rounded-full text-[10px] font-bold text-white flex items-center gap-2 shadow-lg"
                                style={{
                                  background: `linear-gradient(135deg, ${T.primary}, ${T.sage})`,
                                  boxShadow: `0 4px 16px rgba(73,93,68,0.2)`,
                                }}
                              >
                                {loadingSummary[selSession] ? (
                                  <RefreshCw
                                    size={11}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Sparkles size={11} />
                                )}{" "}
                                Insights
                              </motion.button>
                              {(() => {
                                const isHuman = isSessionHuman(selSession);
                                const isSyncing = Boolean(
                                  togglingHandoff[selSession!],
                                );
                                return (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleToggleHandoff}
                                    disabled={isSyncing}
                                    className={`flex items-center bg-panel border rounded-full px-3 py-1.5 gap-2.5 shadow-sm cursor-pointer transition-all ml-1 disabled:opacity-60 ${
                                      isHuman
                                        ? "border-amber-500/30 bg-amber-500/5"
                                        : "border-[#0396A6]/30 bg-[#0396A6]/5"
                                    }`}
                                    title="Toggle between AI Auto-Reply and Manual Human Mode"
                                  >
                                    {isSyncing ? (
                                      <RefreshCw
                                        size={12}
                                        className="animate-spin text-muted"
                                      />
                                    ) : isHuman ? (
                                      <UserIcon size={12} className="text-amber-600" />
                                    ) : (
                                      <Bot size={12} className="text-[#0396A6]" />
                                    )}
                                    <span
                                      className={`text-[11px] font-bold tracking-tight ${isHuman ? "text-amber-600" : "text-[#0396A6]"}`}
                                    >
                                      {isSyncing
                                        ? "SYNCING..."
                                        : isHuman
                                          ? "MANUAL MODE"
                                          : "AI AUTO-REPLY"}
                                    </span>
                                    <div
                                      className={`w-7 h-4 rounded-full relative transition-colors ${isHuman ? "bg-amber-500" : "bg-[#0396A6]"}`}
                                    >
                                      <div
                                        className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isHuman ? "left-0.5" : "right-0.5"}`}
                                      ></div>
                                    </div>
                                  </motion.button>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Messages */}
                          <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto p-6 space-y-3"
                          >
                            {convos
                              .filter((c) => c.session_id === selSession)
                              .sort(
                                (a, b) =>
                                  new Date(
                                    (a.created_at || "").replace(" ", "T"),
                                  ).getTime() -
                                  new Date(
                                    (b.created_at || "").replace(" ", "T"),
                                  ).getTime(),
                              )
                              .map((m, i) => (
                                <div
                                  key={i}
                                  className={`chat-bubble-enter flex ${m.role === "user" ? "justify-start" : "justify-end"}`}
                                  style={{ animationDelay: `${i * 0.05}s` }}
                                >
                                  <div
                                    className="p-4 rounded-2xl text-[12.5px] font-medium max-w-[75%] shadow-sm relative"
                                    style={{
                                      ...(m.role === "user"
                                        ? {
                                            background: T.card,
                                            borderBottomLeftRadius: 4,
                                            border: `1px solid ${T.border}`,
                                            color: T.text,
                                          }
                                        : activeTab === "whatsapp"
                                          ? {
                                              background: "#dcf8c6",
                                              borderBottomRightRadius: 4,
                                              color: "#1a3a2a",
                                            }
                                          : {
                                              background: `linear-gradient(135deg, ${T.primary}, ${T.sage})`,
                                              borderBottomRightRadius: 4,
                                              color: "#fff",
                                            }),
                                    }}
                                  >
                                    {(m.content || "")
                                      .split(/(\*\*[^*]+\*\*)/)
                                      .map((part: string, i: number) =>
                                        /^\*\*(.+)\*\*$/.test(part) ? (
                                          <strong key={i}>
                                            {part.slice(2, -2)}
                                          </strong>
                                        ) : (
                                          <span key={i}>{part}</span>
                                        ),
                                      )}
                                    <div className="flex items-center justify-end gap-1 mt-1.5">
                                      {m.role !== "user" && m.id && !Number.isNaN(Number(m.id)) ? (
                                        <span className="flex gap-1 mr-2">
                                          <button
                                            type="button"
                                            className="opacity-70 hover:opacity-100"
                                            onClick={() => {
                                              void postMessageFeedback(
                                                selSession,
                                                Number(m.id),
                                                "thumbs_up",
                                              ).then(() =>
                                                setMessageFeedback((prev) => ({
                                                  ...prev,
                                                  [String(m.id)]: "thumbs_up",
                                                })),
                                              );
                                            }}
                                            aria-label="Good reply"
                                          >
                                            👍
                                          </button>
                                          <button
                                            type="button"
                                            className="opacity-70 hover:opacity-100"
                                            onClick={() => {
                                              void postMessageFeedback(
                                                selSession,
                                                Number(m.id),
                                                "thumbs_down",
                                              ).then(() =>
                                                setMessageFeedback((prev) => ({
                                                  ...prev,
                                                  [String(m.id)]: "thumbs_down",
                                                })),
                                              );
                                            }}
                                            aria-label="Poor reply"
                                          >
                                            👎
                                          </button>
                                        </span>
                                      ) : null}
                                      <span
                                        style={{
                                          fontSize: 9,
                                          fontWeight: 600,
                                          opacity: 0.5,
                                        }}
                                      >
                                        {new Date(
                                          (m.created_at || "").replace(
                                            " ",
                                            "T",
                                          ),
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                      {m.role !== "user" && (
                                        <Check
                                          size={12}
                                          style={{ opacity: 0.6 }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>

                          {/* Footer — composer only in HUMAN mode */}
                          {isSessionHuman(selSession) ? (
                            <form
                              onSubmit={handleSendHandoff}
                              className="p-4 shrink-0 flex items-center gap-3 border-t"
                              style={{
                                borderColor: "#FFAB91",
                                background: "rgba(255,234,229,0.4)",
                                backdropFilter: "blur(12px)",
                              }}
                            >
                              <div className="flex-1">
                                <input
                                  ref={handoffInputRef}
                                  type="text"
                                  value={handoffInput}
                                  onChange={(e) =>
                                    setHandoffInput(e.target.value)
                                  }
                                  placeholder="Type a reply as human agent..."
                                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all"
                                  style={{
                                    borderColor: "#FFAB91",
                                    background: T.surface,
                                    color: T.text,
                                  }}
                                  disabled={sendingHandoff}
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={
                                  sendingHandoff || !handoffInput.trim()
                                }
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                style={{
                                  background:
                                    activeTab === "whatsapp"
                                      ? "#075e54"
                                      : "#D84315",
                                }}
                              >
                                {sendingHandoff ? (
                                  <RefreshCw
                                    size={18}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Send size={18} />
                                )}
                              </button>
                            </form>
                          ) : (
                            <div
                              className="p-4 shrink-0 flex items-center gap-3 border-t"
                              style={{
                                borderColor: T.divider,
                                background: "rgba(255,255,255,0.6)",
                                backdropFilter: "blur(12px)",
                              }}
                            >
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value=""
                                  placeholder="Switch to HUMAN MODE to reply manually..."
                                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all opacity-70"
                                  style={{
                                    borderColor: T.border,
                                    background: T.card,
                                    color: T.text,
                                  }}
                                  readOnly
                                />
                              </div>
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 shadow-lg"
                                style={{
                                  background:
                                    activeTab === "whatsapp"
                                      ? "#075e54"
                                      : T.primary,
                                }}
                              >
                                <Mic size={18} />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-5">
                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="w-20 h-20 rounded-[24px] border flex items-center justify-center shadow-xl"
                            style={{
                              borderColor: T.border,
                              background: T.card,
                              color: T.textMuted,
                            }}
                          >
                            <MessageSquare size={36} />
                          </motion.div>
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: 3,
                                color: T.textMuted,
                                opacity: 0.5,
                              }}
                            >
                              Select a stream
                            </div>
                            <p
                              style={{
                                fontSize: 14,
                                color: T.textMuted,
                                margin: "8px 0 0",
                                fontStyle: "italic",
                              }}
                            >
                              Monitoring real-time interactions across all
                              channels
                            </p>
                          </div>
                        </div>
                      )}

                      {/* INSIGHTS SIDEBAR */}
                      <AnimatePresence>
                        {selSession && summaries[selSession] && (
                          <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{
                              type: "spring",
                              bounce: 0,
                              duration: 0.4,
                            }}
                            className="absolute top-0 right-0 bottom-0 w-80 bg-white border-l shadow-2xl flex flex-col z-[40]"
                            style={{ borderColor: T.divider }}
                          >
                            <div
                              className="p-4 border-b flex justify-between items-center"
                              style={{
                                borderColor: T.divider,
                                background: T.surface,
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <ActivityIcon
                                  size={14}
                                  style={{ color: T.primary }}
                                />
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    letterSpacing: 2,
                                    color: T.text,
                                  }}
                                >
                                  AI Briefing
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  setSummaries((prev) => {
                                    const n = { ...prev };
                                    delete n[selSession];
                                    return n;
                                  })
                                }
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                              <p
                                style={{
                                  fontSize: 13,
                                  fontStyle: "italic",
                                  color: T.textSec,
                                  lineHeight: 1.6,
                                  margin: 0,
                                }}
                              >
                                {summaries[selSession]}
                              </p>
                              {bridgeLinks[selSession] ? (
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: T.textSec,
                                    marginTop: 16,
                                    lineHeight: 1.5,
                                  }}
                                >
                                  Unified bridge: linked {bridgeLinks[selSession].linked_channel}{" "}
                                  thread
                                  {bridgeLinks[selSession].user_phone
                                    ? ` · ${bridgeLinks[selSession].user_phone}`
                                    : ""}
                                </p>
                              ) : null}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Bot Offline State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-28 rounded-[28px] border text-center relative overflow-hidden"
                style={{
                  borderColor: T.border,
                  background: "rgba(255,255,255,0.4)",
                }}
              >
                <div
                  className="ub-orb"
                  style={{
                    background: T.primary,
                    width: 200,
                    height: 200,
                    top: -50,
                    left: -50,
                    opacity: 0.15,
                  }}
                />
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-8 relative z-10"
                  style={{
                    background: T.surface,
                    border: `2px dashed ${T.border}`,
                  }}
                >
                  <Bot size={44} style={{ color: T.textMuted, opacity: 0.4 }} />
                </motion.div>
                <h2
                  style={{
                    fontSize: 32,
                    fontWeight: 600,
                    color: T.text,
                    margin: 0,
                  }}
                  className="relative z-10"
                >
                  Unified AI is Dormant
                </h2>
                <p
                  style={{
                    fontSize: 15,
                    color: T.textMuted,
                    maxWidth: 320,
                    margin: "12px auto 32px",
                    fontStyle: "italic",
                  }}
                  className="relative z-10"
                >
                  Reconnect your assistant to start managing website and
                  WhatsApp visitors.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleBotOn(true)}
                  className="px-8 py-3.5 text-white font-semibold rounded-full shadow-xl relative z-10"
                  style={{
                    background: `linear-gradient(135deg, ${T.primary}, ${T.sage})`,
                    boxShadow: "0 12px 32px rgba(73,93,68,0.3)",
                  }}
                >
                  Wake Up Unified Agent
                </motion.button>
              </motion.div>
            )}
          </>
        )}

        {/* ═══ 4. LEADS TAB ═══ */}
        {mainTab === "leads" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="rounded-[24px] border border-panel-border overflow-hidden flex flex-col bg-panel shadow-sm relative z-10"
            style={{ minHeight: 600 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-panel-border bg-input-bg">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${T.gold}12` }}
                >
                  <UserIcon size={16} style={{ color: T.gold }} />
                </div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: T.text,
                    margin: 0,
                  }}
                >
                  Captured Leads
                </h3>
              </div>
              <motion.button
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                onClick={fetchAllData}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-panel-border text-muted transition-all"
              >
                <RefreshCw
                  size={14}
                  className={isLoadingAnalytics ? "animate-spin" : ""}
                />
              </motion.button>
            </div>

            <div className="p-6 pb-6">
              {/* Filters Section */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-panel-border bg-input-bg">
                  <Search size={14} style={{ color: T.textMuted }} />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs w-48"
                    style={{ color: T.text }}
                  />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-panel-border bg-input-bg">
                  <Calendar size={14} style={{ color: T.textMuted }} />
                  <input
                    type="date"
                    value={leadDateFilter}
                    onChange={(e) => setLeadDateFilter(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs"
                    style={{ color: T.text }}
                  />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-panel-border bg-input-bg">
                  <Filter size={14} style={{ color: T.textMuted }} />
                  <Select
                    value={leadChannelFilter}
                    onChange={setLeadChannelFilter}
                    style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, paddingRight: 16, color: T.text, minHeight: 'auto', height: 'auto' }}
                    options={[
                      { value: "", label: "All Channels" },
                      { value: "web", label: "Web Chat" },
                      { value: "whatsapp", label: "WhatsApp" }
                    ]}
                  />
                </div>
              </div>

              {leads.length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center gap-4">
                  <UserIcon
                    size={44}
                    style={{ color: T.textMuted, opacity: 0.3 }}
                  />
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 2,
                      color: T.textMuted,
                      opacity: 0.5,
                    }}
                  >
                    No leads captured yet.
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${T.divider}` }}>
                          {[
                            "Visitor",
                            "Contact Info",
                            "Summary / Goal",
                            "Channel",
                            "Captured At",
                            "Session",
                          ].map((h) => (
                            <th
                              key={h}
                              className="pb-4 px-3"
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 2,
                                color: T.textMuted,
                                textAlign: h === "Session" ? "right" : "left",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {leads
                          .filter((l) => {
                            const searchMatch =
                              !leadSearch ||
                              [
                                l.name,
                                l.email,
                                l.phone,
                                l.summary,
                                l.session_id,
                              ].some((v) =>
                                v
                                  ?.toLowerCase()
                                  .includes(leadSearch.toLowerCase()),
                              ) ||
                              getNormId(l.session_id) === getNormId(leadSearch);
                            const dateMatch =
                              !leadDateFilter ||
                              (l.created_at &&
                                l.created_at.startsWith(leadDateFilter));
                            const channelMatch =
                              !leadChannelFilter ||
                              getSessionChannel(l.session_id) ===
                                leadChannelFilter;
                            return searchMatch && dateMatch && channelMatch;
                          })
                          .slice(
                            (leadsPage - 1) * LEADS_PER_PAGE,
                            leadsPage * LEADS_PER_PAGE,
                          )
                          .map((l, i) => (
                            <React.Fragment key={i}>
                              <motion.tr
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="group transition-colors"
                                style={{ borderBottom: `1px solid ${T.divider}` }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(73,93,68,0.02)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "transparent")
                                }
                              >
                                <td className="py-4 px-3">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border"
                                      style={{
                                        borderColor: T.border,
                                        color: T.primary,
                                        background: T.surface,
                                      }}
                                    >
                                      {String(l.name || "U")
                                        .slice(0, 1)
                                        .toUpperCase()}
                                    </div>
                                    <span
                                      className="text-sm font-semibold"
                                      style={{ color: T.text }}
                                    >
                                      {l.name || "Anonymous User"}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-3">
                                  <div className="flex flex-col gap-1">
                                    {l.email && (
                                      <div
                                        className="text-xs font-medium flex items-center gap-1.5"
                                        style={{ color: T.primary }}
                                      >
                                        <Mail size={11} /> {l.email}
                                      </div>
                                    )}
                                    {l.phone && (
                                      <div
                                        className="text-[11px] font-medium flex items-center gap-1.5"
                                        style={{ color: T.textMuted }}
                                      >
                                        <Phone size={10} /> {l.phone}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-3 max-w-[200px]">
                                  <div
                                    className="flex items-center gap-2 text-sm cursor-default"
                                    style={{ color: T.textSec }}
                                  >
                                    <MessageSquare
                                      size={13}
                                      className="shrink-0 mt-0.5 self-start opacity-70"
                                    />
                                    <span className="truncate block w-full text-xs font-medium">
                                      {l.summary ||
                                        l.interest ||
                                        "Lead captured during chat."}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-3">
                                  <div
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                                    style={{
                                      background:
                                        getSessionChannel(l.session_id) ===
                                        "whatsapp"
                                          ? "rgba(7,94,84,0.06)"
                                          : "rgba(73,93,68,0.06)",
                                      color:
                                        getSessionChannel(l.session_id) ===
                                        "whatsapp"
                                          ? "#075e54"
                                          : T.primary,
                                      borderColor:
                                        getSessionChannel(l.session_id) ===
                                        "whatsapp"
                                          ? "#075e5420"
                                          : `${T.primary}20`,
                                    }}
                                  >
                                    {getSessionChannel(l.session_id) ===
                                    "whatsapp" ? (
                                      <MessageCircle size={10} />
                                    ) : (
                                      <Globe size={10} />
                                    )}
                                    {getSessionChannel(
                                      l.session_id,
                                    ).toUpperCase()}
                                  </div>
                                </td>
                                <td className="py-4 px-3">
                                  <div
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      color: T.textSec,
                                    }}
                                  >
                                    {new Date(
                                      (l.created_at || "").replace(" ", "T"),
                                    ).toLocaleDateString()}{" "}
                                    <br />
                                    <span style={{ opacity: 0.6, fontSize: 10 }}>
                                      {new Date(
                                        (l.created_at || "").replace(" ", "T"),
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-3 text-right">
                                  <div className="flex flex-col items-end gap-2">
                                    <div
                                      className="text-[10px] font-mono"
                                      style={{ color: T.textMuted, opacity: 0.5 }}
                                      title={l.session_id}
                                    >
                                      ID: {getNormId(l.session_id)}
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        onClick={() => {
                                          setMainTab("conversations");
                                          setActiveTab(
                                            getSessionChannel(l.session_id),
                                          );
                                          setSelSession(l.session_id);
                                        }}
                                        className="px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all border"
                                        style={{
                                          background: `${T.primary}08`,
                                          color: T.primary,
                                          borderColor: `${T.primary}20`,
                                        }}
                                      >
                                        <MessageSquare size={10} /> View Chat
                                      </motion.button>
                                      <button
                                        onClick={() => {
                                          const key = l.session_id || String(i);
                                          setExpandedLeads((prev) => ({
                                            ...prev,
                                            [key]: !prev[key],
                                          }));
                                        }}
                                        className="p-1.5 rounded-lg border transition-all flex items-center justify-center"
                                        style={{
                                          background: expandedLeads[l.session_id || String(i)] ? T.primary : T.surface,
                                          color: expandedLeads[l.session_id || String(i)] ? "#fff" : T.textMuted,
                                          borderColor: expandedLeads[l.session_id || String(i)] ? T.primary : T.border,
                                        }}
                                        title={
                                          expandedLeads[l.session_id || String(i)]
                                            ? "Collapse Details"
                                            : "Expand Details & Summary"
                                        }
                                      >
                                        {expandedLeads[l.session_id || String(i)] ? (
                                          <ChevronUp size={14} />
                                        ) : (
                                          <ChevronDown size={14} />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </motion.tr>
                              {expandedLeads[l.session_id || String(i)] && (
                                <tr style={{ background: T.surface, borderBottom: `1px solid ${T.divider}` }}>
                                  <td colSpan={6} className="p-6">
                                    <div className="space-y-4 animate-in fade-in duration-200">
                                      <div className="flex items-center justify-between pb-3" style={{ borderBottom: `1px solid ${T.divider}` }}>
                                        <div className="flex items-center gap-2">
                                          <Sparkles size={16} style={{ color: T.primary }} />
                                          <h4 className="text-sm font-bold" style={{ color: T.text }}>
                                            Complete Lead Summary &amp; Insights
                                          </h4>
                                        </div>
                                        <span className="text-xs font-mono px-2.5 py-1 rounded-md border" style={{ background: T.card, color: T.textMuted, borderColor: T.border }}>
                                          ID: {l.session_id || "N/A"}
                                        </span>
                                      </div>
                                      <div className="p-4 rounded-xl border shadow-sm text-xs leading-relaxed whitespace-pre-wrap font-sans" style={{ background: T.card, color: T.text, borderColor: T.border }}>
                                        {l.summary || l.interest || "No summary recorded for this lead."}
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                                        <div className="p-3 rounded-xl border flex flex-col gap-1" style={{ background: T.card, borderColor: T.border }}>
                                          <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: T.textMuted }}>
                                            <UserIcon size={12} style={{ color: T.primary }} /> Full Name
                                          </span>
                                          <span className="text-xs font-semibold truncate" style={{ color: T.text }}>
                                            {l.name || "Anonymous User"}
                                          </span>
                                        </div>
                                        <div className="p-3 rounded-xl border flex flex-col gap-1" style={{ background: T.card, borderColor: T.border }}>
                                          <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: T.textMuted }}>
                                            <Mail size={12} style={{ color: T.primary }} /> Email Address
                                          </span>
                                          <span className="text-xs font-mono truncate" style={{ color: T.text }}>
                                            {l.email || "Not provided"}
                                          </span>
                                        </div>
                                        <div className="p-3 rounded-xl border flex flex-col gap-1" style={{ background: T.card, borderColor: T.border }}>
                                          <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: T.textMuted }}>
                                            <Phone size={12} style={{ color: T.primary }} /> Phone Number
                                          </span>
                                          <span className="text-xs font-mono truncate" style={{ color: T.text }}>
                                            {l.phone || "Not provided"}
                                          </span>
                                        </div>
                                        <div className="p-3 rounded-xl border flex flex-col gap-1" style={{ background: T.card, borderColor: T.border }}>
                                          <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: T.textMuted }}>
                                            <Globe size={12} style={{ color: T.primary }} /> Channel
                                          </span>
                                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: T.primary }}>
                                            {getSessionChannel(l.session_id)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {(() => {
                    const filteredLeadsCount = leads.filter((l) => {
                      const searchMatch =
                        !leadSearch ||
                        [
                          l.name,
                          l.email,
                          l.phone,
                          l.summary,
                          l.session_id,
                        ].some((v) =>
                          v?.toLowerCase().includes(leadSearch.toLowerCase()),
                        ) ||
                        getNormId(l.session_id) === getNormId(leadSearch);
                      const dateMatch =
                        !leadDateFilter ||
                        (l.created_at &&
                          l.created_at.startsWith(leadDateFilter));
                      const channelMatch =
                        !leadChannelFilter ||
                        getSessionChannel(l.session_id) === leadChannelFilter;
                      return searchMatch && dateMatch && channelMatch;
                    }).length;
                    const totalPages = Math.ceil(
                      filteredLeadsCount / LEADS_PER_PAGE,
                    );
                    if (totalPages <= 1) return null;

                    return (
                      <div
                        className="flex items-center justify-center mt-2 px-2 pt-6 border-t"
                        style={{ borderColor: T.divider }}
                      >
                        <div className="flex items-center gap-6 sm:gap-12">
                          {/* PREV BUTTON */}
                          <motion.button
                            whileHover={{ x: -4 }}
                            onClick={() =>
                              setLeadsPage((p) => Math.max(1, p - 1))
                            }
                            disabled={leadsPage === 1}
                            className="flex items-center gap-3 group disabled:opacity-30 cursor-pointer transition-all"
                          >
                            <div
                              className="w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 group-hover:bg-[#495D44] group-hover:border-[#495D44]"
                              style={{ borderColor: T.border, color: T.text }}
                            >
                              <ChevronLeft
                                size={16}
                                className="group-hover:text-white transition-colors duration-300"
                              />
                            </div>
                            <span
                              className="text-[10px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 group-hover:text-[#495D44] hidden sm:block"
                              style={{ color: T.text }}
                            >
                              Prev
                            </span>
                          </motion.button>

                          {/* PAGE NUMBERS */}
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-baseline gap-2">
                              <span
                                style={{
                                  fontSize: 32,
                                  fontWeight: 300,
                                  color: T.text,
                                  lineHeight: 1,
                                }}
                              >
                                {String(leadsPage).padStart(2, "0")}
                              </span>
                              <span
                                style={{
                                  fontSize: 16,
                                  color: T.textMuted,
                                  fontWeight: 300,
                                }}
                              >
                                / {String(totalPages).padStart(2, "0")}
                              </span>
                            </div>
                            <span
                              className="uppercase tracking-widest text-[8px] font-bold opacity-50"
                              style={{ color: T.textMuted }}
                            >
                              {filteredLeadsCount} Leads Found
                            </span>
                          </div>

                          {/* NEXT BUTTON */}
                          <motion.button
                            whileHover={{ x: 4 }}
                            onClick={() => setLeadsPage((p) => p + 1)}
                            disabled={leadsPage >= totalPages}
                            className="flex items-center gap-3 group disabled:opacity-30 cursor-pointer transition-all"
                          >
                            <span
                              className="text-[10px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 group-hover:text-[#495D44] hidden sm:block"
                              style={{ color: T.text }}
                            >
                              Next
                            </span>
                            <div
                              className="w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 group-hover:bg-[#495D44] group-hover:border-[#495D44]"
                              style={{ borderColor: T.border, color: T.text }}
                            >
                              <ChevronRight
                                size={16}
                                className="group-hover:text-white transition-colors duration-300"
                              />
                            </div>
                          </motion.button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ 5. MEETINGS TAB ═══ */}

        {mainTab === "meetings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="rounded-[24px] border border-panel-border overflow-hidden flex flex-col bg-panel shadow-sm relative z-10"
            style={{ minHeight: 600 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-panel-border bg-input-bg">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(139,115,85,0.08)" }}
                >
                  <Calendar size={16} style={{ color: "#8B7355" }} />
                </div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: T.text,
                    margin: 0,
                  }}
                >
                  Meeting Schedule
                </h3>
              </div>
              <motion.button
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                onClick={fetchAllData}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-panel-border text-muted transition-all"
              >
                <RefreshCw
                  size={14}
                  className={isLoadingAnalytics ? "animate-spin" : ""}
                />
              </motion.button>
            </div>

            <div className="p-6">
              {meetingsConnected === false ? (
                <div className="py-24 text-center flex flex-col items-center gap-6">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: T.surface,
                      border: `2px dashed ${T.border}`,
                    }}
                  >
                    <Lock
                      size={32}
                      style={{ color: T.textMuted, opacity: 0.4 }}
                    />
                  </motion.div>
                  <div>
                    <h3
                      style={{
                        fontSize: 22,
                        fontWeight: 600,
                        color: T.text,
                        margin: 0,
                      }}
                    >
                      Google Calendar Not Connected
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        color: T.textMuted,
                        margin: "8px auto 0",
                        maxWidth: 320,
                        fontStyle: "italic",
                      }}
                    >
                      Connect your calendar to allow the AI to schedule
                      bookings.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openWhatsAppSettings}
                    className="px-6 py-2.5 text-white font-semibold rounded-full text-xs flex items-center gap-2 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${T.primary}, ${T.sage})`,
                      boxShadow: "0 8px 24px rgba(73,93,68,0.2)",
                    }}
                  >
                    <Link2 size={14} /> Connect Calendar
                  </motion.button>
                </div>
              ) : meetings.filter((m: any) => !!m.session_id).length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center gap-4">
                  <Calendar
                    size={44}
                    style={{ color: T.textMuted, opacity: 0.3 }}
                  />
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 2,
                      color: T.textMuted,
                      opacity: 0.5,
                    }}
                  >
                    No upcoming meetings.
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto pb-24">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.divider}` }}>
                        {[
                          "Event",
                          "Scheduled At",
                          "Duration",
                          "Actions",
                          "Context",
                        ].map((h) => (
                          <th
                            key={h}
                            className="pb-4 px-3"
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: 2,
                              color: T.textMuted,
                              textAlign: h === "Context" ? "right" : "left",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {meetings
                        .filter((m: any) => !!m.session_id)
                        .map((m: any, i: number) => (
                          <motion.tr
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="group transition-colors"
                            style={{ borderBottom: `1px solid ${T.divider}` }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "rgba(73,93,68,0.02)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <td className="py-4 px-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm"
                                  style={{
                                    borderColor: T.border,
                                    background: T.card,
                                  }}
                                >
                                  <VideoIcon
                                    size={14}
                                    style={{ color: T.primary }}
                                  />
                                </div>
                                <div>
                                  <div
                                    className="text-sm font-bold"
                                    style={{ color: T.text }}
                                  >
                                    {m.title || m.summary || "Meeting"}
                                  </div>
                                  <div
                                    className="text-[10px] font-medium cursor-default relative group/desc"
                                    style={{ color: T.textMuted }}
                                  >
                                    <div className="flex items-center gap-1 max-w-[150px]">
                                      <span className="truncate">
                                        {m.description ||
                                          m.attendees ||
                                          "Customer Meeting"}
                                      </span>
                                    </div>
                                    {m.description && (
                                      <div className="absolute left-0 top-full mt-2 w-max max-w-[300px] z-50 opacity-0 invisible group-hover/desc:opacity-100 group-hover/desc:visible transition-all duration-300 pointer-events-none">
                                        <div className="bg-gray-900 border border-gray-800 shadow-xl rounded-xl p-4 text-xs text-white leading-relaxed whitespace-pre-wrap">
                                          {m.description}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-3">
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: T.text,
                                }}
                              >
                                {new Date(
                                  m.start_time || m.start,
                                ).toLocaleDateString(undefined, {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}{" "}
                                <br />
                                <span
                                  style={{ color: T.primary, fontSize: 11 }}
                                >
                                  {new Date(
                                    m.start_time || m.start,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-3">
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  letterSpacing: 1,
                                  color: T.textMuted,
                                }}
                              >
                                30 Mins
                              </span>
                            </td>
                            <td className="py-4 px-3">
                              {(m.join_url ||
                                m.meeting_link ||
                                m.hangoutLink) && (
                                <motion.a
                                  whileHover={{ scale: 1.05 }}
                                  href={
                                    m.join_url ||
                                    m.meeting_link ||
                                    m.hangoutLink
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white shadow-lg"
                                  style={{
                                    background: `linear-gradient(135deg, ${T.primary}, ${T.sage})`,
                                    boxShadow: "0 4px 16px rgba(73,93,68,0.2)",
                                  }}
                                >
                                  <VideoIcon size={12} /> Join
                                </motion.a>
                              )}
                            </td>
                            <td className="py-4 px-3 text-right">
                              <div className="flex flex-col items-end gap-2">
                                {m.session_id && (
                                  <>
                                    <div
                                      className="text-[10px] font-mono"
                                      style={{
                                        color: T.textMuted,
                                        opacity: 0.5,
                                      }}
                                      title={m.session_id}
                                    >
                                      ID: {getNormId(m.session_id)}
                                    </div>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      onClick={() => {
                                        setMainTab("conversations");
                                        setActiveTab(
                                          getSessionChannel(m.session_id),
                                        );
                                        setSelSession(m.session_id);
                                      }}
                                      className="px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all border"
                                      style={{
                                        background: `${T.primary}08`,
                                        color: T.primary,
                                        borderColor: `${T.primary}20`,
                                      }}
                                    >
                                      <MessageSquare size={10} /> View Chat
                                    </motion.button>
                                  </>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ 5. SETTINGS TAB ═══ */}
        {mainTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="flex flex-col gap-8 aww-fade"
          >
            {/* Premium Horizontal Tabs for Settings */}
            <div className="flex items-center md:justify-center overflow-x-auto no-scrollbar w-full px-2">
              <div className="flex items-center gap-2 p-2 rounded-full border border-panel-border bg-panel shadow-sm w-max">
                {[
                  { id: "credits", label: "Credits & Budget", icon: Zap },
                  { id: "persona", label: "AI Persona", icon: Bot },
                  { id: "knowledge", label: "Knowledge Base", icon: Database },
                  {
                    id: "whatsapp",
                    label: "Meta Cloud API",
                    icon: MessageCircle,
                  },
                  { id: "aesthetics", label: "Widget Styling", icon: Palette },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveSettingTab(t.id as any)}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-full transition-all duration-300 whitespace-nowrap group relative"
                    style={{
                      color: activeSettingTab === t.id ? T.text : T.textMuted,
                    }}
                  >
                    {activeSettingTab === t.id && (
                      <div
                        className="absolute inset-0 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                        style={{ background: T.card, zIndex: 0 }}
                      />
                    )}
                    <t.icon
                      size={16}
                      className={`relative z-10 transition-transform duration-300 ${activeSettingTab === t.id ? "scale-110" : "group-hover:scale-110"}`}
                      style={{
                        color: activeSettingTab === t.id ? T.gold : "inherit",
                      }}
                    />
                    <span
                      className="relative z-10"
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                      }}
                    >
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Settings Content Area */}
            <div
              className="rounded-[32px] border border-panel-border bg-panel p-10 relative z-10 shadow-sm"
              style={{ minHeight: 600 }}
            >
              {activeSettingTab === "credits" ? (
                <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CreditManager
                    feature={{
                      id: "unified_bot",
                      name: "Unified Agent",
                      allocated_credits: allocatedCredits,
                    }}
                    mainBalance={mainBalance}
                    onSuccess={refreshBalances}
                  />
                </div>
              ) : activeSettingTab === "persona" ? (
                <div className="w-full flex flex-col lg:flex-row gap-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* ── LEFT: Visual Identity Preview ── */}
                  <div className="flex-1 flex flex-col justify-center relative">
                    <h2
                      style={{
                        fontSize: 56,
                        fontWeight: 700,
                        color: T.text,
                        lineHeight: 1.1,
                        marginBottom: 24,
                        textShadow: "0 4px 24px rgba(0,0,0,0.05)",
                      }}
                    >
                      Define Your <br />
                      <span style={{ color: T.primary }}>AI Identity.</span>
                    </h2>
                    <p
                      style={{
                        fontSize: 15,
                        color: T.textMuted,
                        lineHeight: 1.6,
                        marginBottom: 48,
                        maxWidth: 360,
                      }}
                    >
                      Shape the personality, tone, and foundational knowledge of
                      your assistant. This core identity will be perfectly
                      synchronized across all your channels.
                    </p>

                    {/* Glassmorphic ID Card Preview */}
                    <div
                      className="relative w-full max-w-[400px] aspect-[1.586/1] rounded-[32px] p-8 overflow-hidden group shadow-[0_24px_48px_rgba(0,0,0,0.05)] border transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_32px_64px_rgba(73,93,68,0.15)]"
                      style={{
                        borderColor: "rgba(255,255,255,0.4)",
                        background: `linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 100%)`,
                        backdropFilter: "blur(24px)",
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                          background: `url('https://www.transparenttextures.com/patterns/cubes.png')`,
                        }}
                      />
                      <div
                        className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 group-hover:opacity-40"
                        style={{ background: T.primary }}
                      />

                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20"
                            style={{
                              background: `linear-gradient(135deg, ${T.primary}, ${T.sage})`,
                            }}
                          >
                            <Bot size={28} />
                          </div>
                          <div
                            className="px-4 py-1.5 rounded-full border bg-white/60 backdrop-blur-md shadow-sm"
                            style={{ borderColor: T.border }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: 2,
                                color: T.primary,
                              }}
                            >
                              {cfg.tone || "Neutral"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: 3,
                              color: T.textMuted,
                              marginBottom: 6,
                            }}
                          >
                            Agent Name
                          </div>
                          <div
                            style={{
                              fontSize: 36,
                              fontWeight: 700,
                              color: T.text,
                            }}
                          >
                            {cfg.bot_name || "Unnamed Agent"}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: T.textSec,
                              letterSpacing: 2,
                              marginTop: 16,
                              opacity: 0.6,
                            }}
                          >
                            ID:{" "}
                            {Math.random()
                              .toString(36)
                              .substring(7)
                              .toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── RIGHT: Configuration Form ── */}
                  <div className="flex-[1.2] flex flex-col gap-10 relative">
                    {/* Beautiful Input */}
                    <div className="space-y-4">
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: 2,
                          color: T.textMuted,
                        }}
                      >
                        Agent Name
                      </label>
                      <input
                        value={cfg.bot_name}
                        onChange={(e) =>
                          setCfg({ ...cfg, bot_name: e.target.value })
                        }
                        className="w-full bg-transparent border-b-2 outline-none transition-all pb-4 placeholder:opacity-20"
                        style={{
                          borderColor: T.border,
                          color: T.text,
                          fontSize: 40,
                          fontWeight: 600,
                        }}
                        placeholder="e.g. Frosty"
                      />
                    </div>

                    {/* Tone Selector Grid */}
                    <div className="space-y-4">
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: 2,
                          color: T.textMuted,
                        }}
                      >
                        Conversational Tone
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {["Professional", "Friendly", "Casual", "Formal"].map(
                          (t) => (
                            <button
                              key={t}
                              onClick={() => setCfg({ ...cfg, tone: t })}
                              className="py-4 px-4 rounded-[20px] border text-center transition-all duration-300 relative overflow-hidden group hover:scale-[1.02] hover:shadow-md"
                              style={{
                                borderColor:
                                  cfg.tone === t ? T.primary : T.border,
                                background:
                                  cfg.tone === t
                                    ? `${T.primary}08`
                                    : "rgba(255,255,255,0.4)",
                              }}
                            >
                              {cfg.tone === t && (
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-1.5"
                                  style={{ background: T.primary }}
                                />
                              )}
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: cfg.tone === t ? 800 : 600,
                                  textTransform: "uppercase",
                                  letterSpacing: 1,
                                  color: cfg.tone === t ? T.text : T.textSec,
                                }}
                              >
                                {t}
                              </span>
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    {/* Sprawling Textarea */}
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="flex items-center justify-between">
                        <label
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: 2,
                            color: T.textMuted,
                          }}
                        >
                          Core Instructions
                        </label>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: T.textMuted,
                            opacity: 0.6,
                          }}
                        >
                          MARKDOWN SUPPORTED
                        </span>
                      </div>
                      <textarea
                        value={cfg.persona}
                        onChange={(e) =>
                          setCfg({ ...cfg, persona: e.target.value })
                        }
                        className="w-full flex-1 p-8 rounded-[32px] border outline-none transition-all resize-none custom-scrollbar focus:ring-4 focus:ring-opacity-10"
                        style={{
                          borderColor: T.border,
                          background: "rgba(255,255,255,0.5)",
                          color: T.text,
                          fontSize: 16,
                          lineHeight: 1.7,
                          boxShadow: "inset 0 2px 12px rgba(0,0,0,0.02)",
                        }}
                        placeholder="You are a helpful assistant for our platform. Your goal is to..."
                      />
                    </div>

                    {/* Floating Save Button */}
                    <button
                      onClick={handleSaveConfig}
                      disabled={isSavingCfg}
                      className="w-full py-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 active:scale-[0.98] disabled:opacity-50 overflow-hidden group relative hover:-translate-y-1 hover:shadow-2xl"
                      style={{
                        background: T.primary,
                        color: "#fff",
                        boxShadow: `0 12px 32px ${T.primary}40`,
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                      {isSavingCfg ? (
                        <>
                          <RefreshCw
                            size={20}
                            className="animate-spin relative z-10"
                          />{" "}
                          <span
                            className="relative z-10"
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: 2,
                            }}
                          >
                            Synchronizing Identity...
                          </span>
                        </>
                      ) : (
                        <>
                          <Save
                            size={20}
                            className="relative z-10 group-hover:scale-110 transition-transform"
                          />{" "}
                          <span
                            className="relative z-10"
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: 2,
                            }}
                          >
                            Save AI Identity
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : activeSettingTab === "knowledge" ? (
                <div className="w-full flex flex-col lg:flex-row gap-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* ── LEFT: The Brain & Upload Zone ── */}
                  <div className="flex-1 flex flex-col justify-center relative">
                    <h2
                      style={{
                        fontSize: 56,
                        fontWeight: 700,
                        color: T.text,
                        lineHeight: 1.1,
                        marginBottom: 24,
                        textShadow: "0 4px 24px rgba(0,0,0,0.05)",
                      }}
                    >
                      The Neural <br />
                      <span style={{ color: T.gold }}>Knowledge Core.</span>
                    </h2>
                    <p
                      style={{
                        fontSize: 15,
                        color: T.textMuted,
                        lineHeight: 1.6,
                        marginBottom: 48,
                        maxWidth: 360,
                      }}
                    >
                      Upload PDFs, Word documents, or text files. The AI will
                      instantly ingest this knowledge and use it across all
                      conversations.
                    </p>

                    {/* Massive Upload Dropzone Card */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-full max-w-[400px] aspect-[1.586/1] rounded-[32px] p-8 overflow-hidden group shadow-[0_24px_48px_rgba(0,0,0,0.02)] border border-dashed transition-all duration-500 hover:-translate-y-2 cursor-pointer flex flex-col items-center justify-center text-center"
                      style={{
                        borderColor: T.gold,
                        background: `linear-gradient(135deg, ${T.surface} 0%, rgba(212,176,120,0.05) 100%)`,
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                          background: `url('https://www.transparenttextures.com/patterns/cubes.png')`,
                        }}
                      />
                      <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 group-hover:scale-150 group-hover:opacity-40"
                        style={{ background: T.gold }}
                      />

                      <div className="relative z-10">
                        <div
                          className="w-20 h-20 mx-auto rounded-full mb-6 flex items-center justify-center text-white shadow-xl transition-transform duration-500 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${T.gold}, #B8860B)`,
                          }}
                        >
                          {isUploading ? (
                            <RefreshCw size={32} className="animate-spin" />
                          ) : (
                            <Upload size={32} />
                          )}
                        </div>
                        <h3
                          style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: T.text,
                            marginBottom: 8,
                          }}
                        >
                          {isUploading
                            ? "Ingesting Data..."
                            : "Upload Knowledge"}
                        </h3>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: 2,
                            color: T.gold,
                            opacity: 0.8,
                          }}
                        >
                          Click to browse files
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>

                  {/* ── RIGHT: Document Grid ── */}
                  <div className="flex-[1.2] flex flex-col relative">
                    <div
                      className="flex items-center justify-between mb-8 pb-6 border-b"
                      style={{ borderColor: T.divider }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: 2,
                            color: T.text,
                          }}
                        >
                          Active Documents
                        </h3>
                        <p
                          style={{
                            fontSize: 12,
                            color: T.textMuted,
                            marginTop: 4,
                          }}
                        >
                          {docs.length} files currently in the AI's brain
                        </p>
                      </div>
                      <div
                        className="w-12 h-12 rounded-full border flex items-center justify-center"
                        style={{ borderColor: T.border, background: T.surface }}
                      >
                        <Database size={20} style={{ color: T.gold }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                      {isFetchingDocs ? (
                        <div className="col-span-1 sm:col-span-2 flex flex-col items-center justify-center py-20 opacity-50">
                          <RefreshCw
                            size={32}
                            className="animate-spin mb-4"
                            style={{ color: T.gold }}
                          />
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: 2,
                              color: T.textMuted,
                            }}
                          >
                            Syncing Neural Link
                          </span>
                        </div>
                      ) : docs.length === 0 ? (
                        <div
                          className="col-span-1 sm:col-span-2 flex flex-col items-center justify-center py-20 opacity-40 border-2 border-dashed rounded-[32px]"
                          style={{ borderColor: T.divider }}
                        >
                          <FileText
                            size={48}
                            className="mb-4"
                            style={{ color: T.textMuted }}
                          />
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: 2,
                              color: T.textMuted,
                            }}
                          >
                            Knowledge Base is Empty
                          </span>
                        </div>
                      ) : (
                        docs
                          .slice((docsPage - 1) * 6, docsPage * 6)
                          .map((doc, idx) => (
                            <div
                              key={idx}
                              className="relative p-6 md:py-8 rounded-xl border group transition-all duration-500 hover:-translate-y-1 hover:shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 bg-white/40 backdrop-blur-sm flex items-center gap-5"
                              style={{
                                borderColor: T.border,
                                animationDelay: `${idx * 50}ms`,
                              }}
                            >
                              <div
                                className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-all duration-700 pointer-events-none"
                                style={{ background: T.gold }}
                              />

                              <div
                                className="w-14 h-14 shrink-0 rounded-[14px] flex items-center justify-center shadow-sm border relative z-10"
                                style={{
                                  background: "#fff",
                                  borderColor: T.border,
                                }}
                              >
                                <FileText size={22} style={{ color: T.gold }} />
                              </div>

                              <div className="flex-1 min-w-0 relative z-20 flex items-center group/title">
                                <h4
                                  className="truncate relative cursor-default"
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: T.text,
                                  }}
                                >
                                  {doc.filename}
                                </h4>
                                <div className="absolute left-0 -top-10 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover/title:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
                                  {doc.filename}
                                  <div className="absolute left-4 -bottom-1 w-2 h-2 bg-gray-900 transform rotate-45" />
                                </div>
                              </div>

                              <button
                                onClick={() => handleDeleteDoc(doc.filename)}
                                className="relative z-10 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 text-red-400 hover:text-red-600 shrink-0 ml-auto"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                    {/* Pagination Controls */}
                    {docs.length > 6 && (
                      <div
                        className="flex flex-col items-center justify-center gap-4 mt-6 pt-6 pb-24 border-t"
                        style={{ borderColor: T.divider }}
                      >
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: T.textMuted,
                          }}
                        >
                          Showing {(docsPage - 1) * 6 + 1} -{" "}
                          {Math.min(docsPage * 6, docs.length)} of {docs.length}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setDocsPage((p) => Math.max(1, p - 1))
                            }
                            disabled={docsPage === 1}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5"
                            style={{ borderColor: T.border, color: T.text }}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            onClick={() =>
                              setDocsPage((p) =>
                                Math.min(Math.ceil(docs.length / 6), p + 1),
                              )
                            }
                            disabled={docsPage >= Math.ceil(docs.length / 6)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5"
                            style={{ borderColor: T.border, color: T.text }}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeSettingTab === "whatsapp" ? (
                <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
                  {/* Hero Integration Header */}
                  <div
                    className="relative w-full rounded-[32px] overflow-hidden border p-8 md:p-12 bg-white"
                    style={{ borderColor: T.border }}
                  >
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                        <div
                          className="w-24 h-24 rounded-[28px] shadow-2xl flex items-center justify-center shrink-0 relative overflow-hidden"
                          style={{
                            background:
                              "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                            boxShadow: "0 12px 32px rgba(37, 211, 102, 0.3)"
                          }}
                        >
                          <svg viewBox="0 0 24 24" className="w-12 h-12 fill-white drop-shadow-md">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.461c-1.852 0-3.67-.498-5.266-1.442l-.377-.224-3.914 1.026 1.044-3.816-.246-.392A10.279 10.279 0 0 1 1.77 11.64c0-5.674 4.617-10.292 10.29-10.292 2.748 0 5.33 1.071 7.273 3.016a10.236 10.236 0 0 1 3.013 7.273c0 5.676-4.617 10.293-10.295 10.293m0-18.577c-4.567 0-8.283 3.716-8.283 8.284 0 1.8.583 3.468 1.579 4.825l.235.322-.65 2.376 2.433-.638.312.185a8.23 8.23 0 0 0 4.374 1.239c4.569 0 8.285-3.716 8.285-8.285 0-4.567-3.716-8.283-8.285-8.283z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <h2
                              style={{
                                fontSize: 36,
                                fontWeight: 700,
                                color: T.text,
                                lineHeight: 1.1,
                              }}
                            >
                              Meta Cloud API
                            </h2>
                            {waStatus.connected ? (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 border border-green-200">
                                Active
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 border border-gray-200">
                                Disconnected
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: 16,
                              color: T.textMuted,
                              maxWidth: 500,
                              lineHeight: 1.6,
                            }}
                          >
                            Connect your agent directly to WhatsApp to automate
                            customer interactions, capture leads, and provide
                            24/7 support.
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {waStatus.connected ? (
                          <div className="flex flex-col items-end gap-3">
                            <div
                              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold shadow-sm"
                              style={{
                                background: "#f0fdf4",
                                color: "#166534",
                                border: "1px solid #bbf7d0",
                              }}
                            >
                              <CheckCircle2 size={18} /> {waStatus.phone}
                            </div>
                            <button
                              onClick={disconnectWhatsAppAction}
                              className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest"
                            >
                              Disconnect Integration
                            </button>
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={connectWhatsApp}
                            disabled={waConnecting}
                            className="px-10 py-5 text-white font-bold rounded-[20px] flex items-center gap-3 shadow-2xl transition-all"
                            style={{
                              background: "#128C7E",
                              boxShadow: "0 20px 40px rgba(18,140,126,0.3)",
                            }}
                          >
                            {waConnecting ? (
                              <RefreshCw size={22} className="animate-spin" />
                            ) : (
                              <Link2 size={22} />
                            )}
                            <span style={{ fontSize: 16 }}>
                              Connect WhatsApp
                            </span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Features / Steps Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                      className="p-8 rounded-[24px] border bg-white hover:shadow-xl transition-shadow"
                      style={{ borderColor: T.border }}
                    >
                      <div className="w-14 h-14 rounded-[20px] bg-green-50 text-green-600 flex items-center justify-center mb-6">
                        <Zap size={28} />
                      </div>
                      <h4
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: T.text,
                          marginBottom: 8,
                        }}
                      >
                        Real-time Sync
                      </h4>
                      <p
                        style={{
                          fontSize: 14,
                          color: T.textMuted,
                          lineHeight: 1.6,
                        }}
                      >
                        Messages sent to your WhatsApp Business number are
                        routed to your AI instantly via Webhooks.
                      </p>
                    </div>
                    <div
                      className="p-8 rounded-[24px] border bg-white hover:shadow-xl transition-shadow"
                      style={{ borderColor: T.border }}
                    >
                      <div className="w-14 h-14 rounded-[20px] bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                        <Users size={28} />
                      </div>
                      <h4
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: T.text,
                          marginBottom: 8,
                        }}
                      >
                        Lead Generation
                      </h4>
                      <p
                        style={{
                          fontSize: 14,
                          color: T.textMuted,
                          lineHeight: 1.6,
                        }}
                      >
                        Automatically capture and organize customer phone
                        numbers into your CRM dashboard.
                      </p>
                    </div>
                    <div
                      className="p-8 rounded-[24px] border bg-white hover:shadow-xl transition-shadow"
                      style={{ borderColor: T.border }}
                    >
                      <div className="w-14 h-14 rounded-[20px] bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                        <ShieldCheck size={28} />
                      </div>
                      <h4
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: T.text,
                          marginBottom: 8,
                        }}
                      >
                        End-to-End Security
                      </h4>
                      <p
                        style={{
                          fontSize: 14,
                          color: T.textMuted,
                          lineHeight: 1.6,
                        }}
                      >
                        Built on the official Meta Cloud API, ensuring your
                        customer data remains fully encrypted.
                      </p>
                    </div>
                  </div>

                  {/* Developer Section */}
                  <div
                    className="w-full rounded-[32px] border overflow-hidden"
                    style={{ borderColor: T.border }}
                  >
                    <div
                      className="p-8 border-b bg-gray-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                      style={{ borderColor: T.divider }}
                    >
                      <div className="flex items-center gap-5">
                        <div
                          className="w-12 h-12 rounded-full bg-white border shadow-sm flex items-center justify-center"
                          style={{ borderColor: T.border }}
                        >
                          <Code size={20} style={{ color: T.textSec }} />
                        </div>
                        <div>
                          <h4
                            style={{
                              fontSize: 22,
                              fontWeight: 700,
                              color: T.text,
                            }}
                          >
                            Developer Configuration
                          </h4>
                          <p style={{ fontSize: 14, color: T.textMuted }}>
                            Manual API keys for custom Meta App integrations.
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        onClick={handleSaveManualWaCreds}
                        disabled={isSavingCreds}
                        className="px-8 py-4 rounded-xl font-bold text-xs tracking-widest transition-all uppercase shadow-md disabled:opacity-50"
                        style={{ background: T.primary, color: "#fff" }}
                      >
                        {isSavingCreds ? 'Saving...' : 'Save Configuration'}
                      </motion.button>
                    </div>
                    <div className="p-8 bg-white grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: 2,
                              color: T.textSec,
                            }}
                          >
                            Phone Number ID
                          </span>
                          <span style={{ fontSize: 10, color: T.textMuted }}>
                            Required
                          </span>
                        </label>
                        <input
                          value={waCredentials.phone_number_id}
                          onChange={(e) =>
                            setWaCredentials({
                              ...waCredentials,
                              phone_number_id: e.target.value,
                            })
                          }
                          className="w-full px-5 py-4 rounded-[16px] border text-sm font-mono shadow-sm outline-none transition-all focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                          style={{
                            borderColor: T.border,
                            background: "#fafafa",
                            color: T.text,
                          }}
                          placeholder="e.g. 10423..."
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: 2,
                              color: T.textSec,
                            }}
                          >
                            WABA ID
                          </span>
                          <span style={{ fontSize: 10, color: T.textMuted }}>
                            Required
                          </span>
                        </label>
                        <input
                          value={waCredentials.waba_id}
                          onChange={(e) =>
                            setWaCredentials({
                              ...waCredentials,
                              waba_id: e.target.value,
                            })
                          }
                          className="w-full px-5 py-4 rounded-[16px] border text-sm font-mono shadow-sm outline-none transition-all focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                          style={{
                            borderColor: T.border,
                            background: "#fafafa",
                            color: T.text,
                          }}
                          placeholder="e.g. 10984..."
                        />
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <label className="flex items-center justify-between">
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: 2,
                              color: T.textSec,
                            }}
                          >
                            Permanent Access Token
                          </span>
                          <span style={{ fontSize: 10, color: T.textMuted }}>
                            Keep this secret
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type={isWaTokenVisible ? "text" : "password"}
                            value={waCredentials.token}
                            onChange={(e) =>
                              setWaCredentials({
                                ...waCredentials,
                                token: e.target.value,
                              })
                            }
                            className="w-full px-5 py-4 pr-24 rounded-[16px] border text-sm font-mono shadow-sm outline-none transition-all focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                            style={{
                              borderColor: T.border,
                              background: "#fafafa",
                              color: T.text,
                            }}
                            placeholder="EAAG..."
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setIsWaTokenVisible(!isWaTokenVisible)
                              }
                              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              {isWaTokenVisible ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (waCredentials.token) {
                                  navigator.clipboard.writeText(
                                    waCredentials.token,
                                  );
                                  setIsWaTokenCopied(true);
                                  setTimeout(
                                    () => setIsWaTokenCopied(false),
                                    2000,
                                  );
                                }
                              }}
                              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              {isWaTokenCopied ? (
                                <CheckCircle2
                                  size={16}
                                  className="text-green-500"
                                />
                              ) : (
                                <ClipboardIcon size={16} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col lg:flex-row gap-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* LEFT: Configuration */}
                  <div className="flex-1 min-w-0 space-y-12">
                    <div className="space-y-4">
                      <h3
                        style={{
                          fontSize: 42,
                          fontWeight: 700,
                          color: T.text,
                          lineHeight: 1.1,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        Widget <br />{" "}
                        <span style={{ color: T.primary }}>Aesthetics.</span>
                      </h3>
                      <p
                        style={{
                          fontSize: 16,
                          color: T.textMuted,
                          lineHeight: 1.6,
                          maxWidth: 400,
                        }}
                      >
                        Design the perfect chat widget to match your brand's
                        visual identity. Changes reflect instantly on your site.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: 2,
                          color: T.textMuted,
                        }}
                      >
                        Brand Primary Color
                      </label>
                      <div className="flex items-center gap-6">
                        <div
                          className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-inner border-2"
                          style={{ borderColor: T.border }}
                        >
                          <input
                            type="color"
                            value={widgetTheme}
                            onChange={(e) => setWidgetTheme(e.target.value)}
                            className="absolute -top-4 -left-4 w-32 h-32 cursor-pointer"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span
                            className="text-xl font-mono font-bold uppercase"
                            style={{ color: T.text }}
                          >
                            {widgetTheme}
                          </span>
                          <span style={{ fontSize: 13, color: T.textMuted }}>
                            Click swatch to customize
                          </span>
                        </div>
                      </div>

                      {/* Quick color palettes */}
                      <div className="flex items-center gap-3 pt-4">
                        {[
                          "#000000",
                          "#2563eb",
                          "#16a34a",
                          "#dc2626",
                          "#9333ea",
                          "#ea580c",
                        ].map((c) => (
                          <button
                            key={c}
                            onClick={() => setWidgetTheme(c)}
                            className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                            style={{
                              backgroundColor: c,
                              borderColor:
                                widgetTheme === c ? T.text : "transparent",
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div
                      className="space-y-4 pt-6 border-t"
                      style={{ borderColor: T.divider }}
                    >
                      <div className="flex items-center justify-between">
                        <label
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: 2,
                            color: T.textMuted,
                          }}
                        >
                          Embed Snippet
                        </label>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(embedCode);
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                          }}
                          className="flex items-center gap-2 text-xs font-bold transition-colors"
                          style={{
                            color: isCopied
                              ? T.success || "#10b981"
                              : T.primary,
                          }}
                        >
                          {isCopied ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <ClipboardIcon size={14} />
                          )}{" "}
                          {isCopied ? "Copied!" : "Copy Code"}
                        </button>
                      </div>
                      <div className="relative group max-w-full">
                        <code
                          className="block p-6 bg-[#0a0a0a] border text-[#a5b4fc] text-[11px] font-mono rounded-[24px] overflow-x-auto whitespace-pre custom-scrollbar max-w-full"
                          style={{ borderColor: "rgba(255,255,255,0.1)" }}
                        >
                          {embedCode}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Live Preview Canvas */}
                  <div className="flex-[1.2] flex flex-col relative min-w-0">
                    <div
                      className="w-full h-[650px] rounded-[32px] border overflow-hidden relative shadow-2xl flex flex-col bg-white"
                      style={{ borderColor: T.border }}
                    >
                      {/* Fake Browser Chrome */}
                      <div
                        className="h-14 border-b flex items-center px-6 gap-2 bg-gray-50/50 backdrop-blur-md"
                        style={{ borderColor: T.border }}
                      >
                        <div className="flex gap-2">
                          <div className="w-3.5 h-3.5 rounded-full bg-red-400" />
                          <div className="w-3.5 h-3.5 rounded-full bg-amber-400" />
                          <div className="w-3.5 h-3.5 rounded-full bg-green-400" />
                        </div>
                        <div
                          className="mx-auto h-8 w-1/3 rounded-lg bg-white border shadow-sm flex items-center justify-center"
                          style={{ borderColor: T.border }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: T.textMuted,
                              fontWeight: 600,
                            }}
                          >
                            yourwebsite.com
                          </span>
                        </div>
                      </div>

                      {/* Fake Website Content */}
                      <div className="flex-1 p-12 space-y-8 opacity-40 pointer-events-none">
                        <div className="w-1/3 h-12 rounded-2xl bg-gray-100" />
                        <div className="space-y-4">
                          <div className="w-full h-4 rounded-full bg-gray-100" />
                          <div className="w-full h-4 rounded-full bg-gray-100" />
                          <div className="w-3/4 h-4 rounded-full bg-gray-100" />
                        </div>
                        <div className="grid grid-cols-3 gap-6 pt-10">
                          <div className="h-32 rounded-2xl bg-gray-100" />
                          <div className="h-32 rounded-2xl bg-gray-100" />
                          <div className="h-32 rounded-2xl bg-gray-100" />
                        </div>
                      </div>

                      {/* Floating Chat Widget Preview */}
                      <div className="absolute bottom-8 right-8 flex flex-col items-end gap-5">
                        {/* Open Chat Window */}
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0, y: 20 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          transition={{
                            delay: 0.2,
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                          }}
                          className="w-[340px] h-[450px] rounded-[24px] shadow-2xl bg-white border flex flex-col overflow-hidden relative"
                          style={{ borderColor: T.border }}
                        >
                          <div
                            className="h-20 flex items-center px-6 text-white shrink-0 shadow-sm"
                            style={{ background: widgetTheme }}
                          >
                            <div>
                              <h4 style={{ fontWeight: 700, fontSize: 16 }}>
                                {cfg.bot_name || "AI Assistant"}
                              </h4>
                              <span style={{ fontSize: 12, opacity: 0.8 }}>
                                Online
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 p-6 flex flex-col justify-end gap-4 bg-gray-50/50">
                            <div
                              className="w-4/5 p-4 rounded-2xl rounded-tl-sm text-sm shadow-sm"
                              style={{
                                background: "#fff",
                                color: "#1f2937",
                                border: `1px solid ${T.border}`,
                              }}
                            >
                              {cfg.fallback_message ||
                                "Hello! How can I help you today?"}
                            </div>
                          </div>
                          <div
                            className="h-[72px] border-t flex items-center px-4 bg-white shrink-0"
                            style={{ borderColor: T.border }}
                          >
                            <div
                              className="w-full h-11 rounded-full border px-5 flex items-center text-xs text-gray-400 bg-gray-50"
                              style={{ borderColor: T.border }}
                            >
                              Type your message...
                            </div>
                          </div>
                        </motion.div>

                        {/* Chat Launcher Button */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="w-[60px] h-[60px] rounded-full shadow-2xl flex items-center justify-center text-white cursor-pointer relative"
                          style={{
                            backgroundColor: widgetTheme,
                            boxShadow: `0 8px 32px ${widgetTheme}60`,
                          }}
                        >
                          <Bot size={28} />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
