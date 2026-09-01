"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Send, Bot, Mic, Square, MessageSquare, X, Sparkles, ChevronDown, Phone, PhoneOff } from "lucide-react";
import { useTheme } from "next-themes";

// ═══════════════════════════════════════════════════════════════════
// THEME TOKENS — matched to Frostrek website (tailwind.config.js)
// ═══════════════════════════════════════════════════════════════════
const DARK = {
  void: "#2D241E",
  pane: "#322d27",
  card: "#373027",
  surface: "#443A2F",
  input: "#2a2622",
  text: "#f9fafb",
  textMuted: "#A89A8A",
  textDim: "#8C7E72",
  bronze: "#B07552",
  bronzeDark: "#8A5A35",
  bronzeLight: "#C48F71",
  gold: "#D4BB75",
  goldDark: "#9E8547",
  goldLight: "#E0CC94",
  accent: "#bf8440",
  error: "#D73357",
  userBubbleBg: `linear-gradient(135deg, #B07552, #8A5A35)`,
  userBubbleText: "#FDFBF7",
  scrollThumb: `linear-gradient(180deg, #B07552 0%, #8A5A35 100%)`,
  scrollThumbHover: `linear-gradient(180deg, #C48F71 0%, #B07552 100%)`,
};

const LIGHT = {
  void: "#FDFBF7",
  pane: "#F7F5F0",
  card: "#FFFFFF",
  surface: "#E6D0C6",
  input: "#FAF6F3",
  text: "#2D241E",
  textMuted: "#5D5046",
  textDim: "#8C7E72",
  bronze: "#B07552",
  bronzeDark: "#8A5A35",
  bronzeLight: "#C48F71",
  gold: "#D4BB75",
  goldDark: "#9E8547",
  goldLight: "#E0CC94",
  accent: "#A97142",
  error: "#D73357",
  userBubbleBg: `linear-gradient(135deg, #B07552, #A97142)`,
  userBubbleText: "#FFFFFF",
  scrollThumb: `linear-gradient(180deg, #B07552 0%, #8A5A35 100%)`,
  scrollThumbHover: `linear-gradient(180deg, #8A5A35 0%, #6E4629 100%)`,
};

// --- DYNAMIC GEMINI-STYLE LOADER COMPONENT ---
export const DynamicGeminiLoader = ({ T }: { T: typeof DARK }) => {
  const phrases = [
    "Analyzing request...",
    "Scanning knowledge base...",
    "Drafting response...",
    "Synthesizing...",
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [phrases.length]);

  return (
    <div className="flex flex-col gap-2 w-full max-w-[85%] mt-1 mb-2">
      <style>{`
        @keyframes shine {
          to { background-position: 200% center; }
        }
        @keyframes magical-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fade-up {
          0% { opacity: 0; transform: translateY(4px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
        .magical-glow {
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, transparent 0%, ${T.bronze} 25%, ${T.gold} 50%, ${T.accent} 75%, transparent 100%);
          animation: magical-spin 2s linear infinite;
          filter: blur(4px);
        }
        .text-shimmer {
          background-size: 200% auto;
          animation: shine 3s linear infinite;
        }
        .phrase-animate {
          animation: fade-up 2s ease-in-out forwards;
        }
      `}</style>
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
          <div className="magical-glow" style={{ boxShadow: `0 0 15px ${T.bronze}99` }}></div>
          <div className="relative z-10 rounded-full w-full h-full flex items-center justify-center" style={{ background: T.void, border: `1px solid ${T.surface}` }}>
            <Sparkles className="w-4 h-4 animate-pulse" style={{ color: T.gold }} />
          </div>
        </div>
        <div className="flex flex-col w-full pt-1">
          <div className="h-[28px] flex items-center relative">
            <span key={index} className="absolute flex items-center text-xs font-semibold tracking-wide text-transparent bg-clip-text text-shimmer phrase-animate py-1" style={{ backgroundImage: `linear-gradient(to right, ${T.bronze}, ${T.gold}, ${T.accent})` }}>
              {phrases[index]}
            </span>
          </div>
          <div className="flex gap-2 mt-1.5 opacity-80">
            <div className="h-1.5 w-full max-w-[70px] rounded-full text-shimmer" style={{ backgroundImage: `linear-gradient(to right, transparent, ${T.bronze}80, transparent)`, boxShadow: `0 0 8px ${T.bronze}66` }}></div>
            <div className="h-1.5 w-full max-w-[40px] rounded-full text-shimmer" style={{ backgroundImage: `linear-gradient(to right, transparent, ${T.gold}80, transparent)`, boxShadow: `0 0 8px ${T.gold}66`, animationDelay: "1s" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SMOOTH TYPING EFFECT COMPONENT ---
const renderMessageWithLinks = (text: string, keyPrefix = "lnk"): React.ReactNode[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={`${keyPrefix}-a-${i}`} href={part} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {part}
        </a>
      );
    }
    return <React.Fragment key={`${keyPrefix}-t-${i}`}>{part}</React.Fragment>;
  });
};

const renderInlineMarkdown = (text: string, keyPrefix: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let k = 0;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...renderMessageWithLinks(text.slice(lastIndex, match.index), `${keyPrefix}-${k++}`));
    }
    nodes.push(<strong key={`${keyPrefix}-b-${k++}`}>{match[1]}</strong>);
    lastIndex = boldRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(...renderMessageWithLinks(text.slice(lastIndex), `${keyPrefix}-${k++}`));
  }

  return nodes.length ? nodes : renderMessageWithLinks(text, keyPrefix);
};

const renderMarkdownMessage = (text: string): React.ReactNode => {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  const listItems: React.ReactNode[] = [];
  let key = 0;

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(
      <ul key={`ul-${key++}`} className="list-disc pl-5 my-2 space-y-1.5">
        {listItems.splice(0, listItems.length)}
      </ul>
    );
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^[*\-•]\s+(.*)$/);

    if (bulletMatch) {
      listItems.push(
        <li key={`li-${key++}`}>{renderInlineMarkdown(bulletMatch[1], `li-${key}`)}</li>
      );
      continue;
    }

    flushList();

    if (!trimmed) {
      if (blocks.length) blocks.push(<div key={`sp-${key++}`} className="h-2" />);
      continue;
    }

    blocks.push(
      <p key={`p-${key++}`} className={blocks.length ? "mt-2 first:mt-0" : ""}>
        {renderInlineMarkdown(line, `p-${key}`)}
      </p>
    );
  }

  flushList();
  return blocks.length ? <>{blocks}</> : null;
};


const SmoothTypingMessage = ({ content, onUpdate }: { content: string, onUpdate?: () => void }) => {
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    onUpdate?.();
  }, [displayedContent, onUpdate]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    // Safety snap if the final content is completely different from the stream
    // (e.g. it was streaming JSON syntax and then snapped to the parsed text)
    if (displayedContent.length > 0 && !content.startsWith(displayedContent) && content !== displayedContent) {
      setDisplayedContent(content);
      return;
    }

    if (displayedContent.length < content.length) {
      interval = setInterval(() => {
        setDisplayedContent(prev => {
          if (!content.startsWith(prev)) return content;
          const nextChars = content.slice(prev.length, prev.length + 2);
          const nextStr = prev + nextChars;
          if (nextStr.length >= content.length) {
            clearInterval(interval);
            return content;
          }
          return nextStr;
        });
      }, 15);
    } else if (displayedContent !== content) {
      setDisplayedContent(content);
    }
    return () => clearInterval(interval);
  }, [content, displayedContent]);

  return <>{renderMarkdownMessage(displayedContent)}</>;
};

const SplashAnimation = ({ isDark }: { isDark: boolean }) => {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        background: isDark ? 'rgba(15, 15, 18, 0.4)' : 'rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
      }}>

      {/* 5-second timeline container */}
      <div className="relative w-full h-full flex flex-col items-center justify-center animate-[splashTimeline_5s_ease-in-out_forwards]">

        <div className="relative w-40 h-40 flex items-center justify-center animate-[breathe_3s_ease-in-out_infinite]">
          {/* Ring 1 - Outer */}
          <div className="absolute w-36 h-36 rounded-full border border-transparent animate-[spin_3s_linear_infinite]"
            style={{ borderTopColor: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)', borderRightColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}>
          </div>

          {/* Ring 2 - Middle (Counter-spin) */}
          <div className="absolute w-28 h-28 rounded-full border border-transparent animate-[spin_2s_linear_infinite_reverse]"
            style={{ borderBottomColor: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)', borderLeftColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}>
          </div>

          {/* Ring 3 - Inner */}
          <div className="absolute w-20 h-20 rounded-full border border-transparent animate-[spin_1.5s_linear_infinite]"
            style={{ borderTopColor: isDark ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,0.8)', borderLeftColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)' }}>
          </div>

          {/* Core Pulse */}
          <div className="absolute w-12 h-12 flex items-center justify-center rounded-full animate-ping opacity-20"
            style={{ background: isDark ? '#ffffff' : '#000000' }}>
          </div>

          {/* Center Bot Icon */}
          <div className="relative z-10 p-4 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', backdropFilter: 'blur(4px)' }}>
            <Bot className="w-7 h-7" style={{ color: isDark ? '#ffffff' : '#333333' }} />
          </div>
        </div>

        {/* Engaging Timeline Text */}
        <div className="mt-8 flex flex-col items-center h-14 relative w-full">

          {/* Text slider mask (exactly the height of one line) */}
          <div className="h-6 overflow-hidden flex flex-col items-center w-full relative">
            <div className="flex flex-col items-center transition-transform animate-[textSlide_5s_ease-in-out_forwards]">
              <span className="h-6 flex items-center justify-center text-[11px] font-[500] tracking-[0.2em] uppercase opacity-70" style={{ color: isDark ? '#ffffff' : '#111111' }}>Initializing</span>
              <span className="h-6 flex items-center justify-center text-[11px] font-[500] tracking-[0.2em] uppercase opacity-70" style={{ color: isDark ? '#ffffff' : '#111111' }}>Connecting</span>
              <span className="h-6 flex items-center justify-center text-[11px] font-[500] tracking-[0.2em] uppercase opacity-70" style={{ color: isDark ? '#ffffff' : '#111111' }}>Ready</span>
            </div>
          </div>

          {/* Bouncing dots under the text */}
          <div className="flex gap-1.5 mt-2 opacity-50">
            <div className="w-1.5 h-1.5 rounded-full animate-[bounce_1s_infinite]" style={{ background: isDark ? '#fff' : '#000', animationDelay: '0s' }}></div>
            <div className="w-1.5 h-1.5 rounded-full animate-[bounce_1s_infinite]" style={{ background: isDark ? '#fff' : '#000', animationDelay: '0.2s' }}></div>
            <div className="w-1.5 h-1.5 rounded-full animate-[bounce_1s_infinite]" style={{ background: isDark ? '#fff' : '#000', animationDelay: '0.4s' }}></div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes splashTimeline {
          0% { opacity: 0; transform: scale(0.95); filter: blur(5px); }
          10% { opacity: 1; transform: scale(1); filter: blur(0px); }
          90% { opacity: 1; transform: scale(1); filter: blur(0px); }
          100% { opacity: 0; transform: scale(1.1); filter: blur(15px); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes textSlide {
          0%, 25% { transform: translateY(0); }
          35%, 65% { transform: translateY(-24px); }
          75%, 100% { transform: translateY(-48px); }
        }
      `}</style>
    </div>
  );
};

const API_KEY = "frosty_7d8c26a6_02PANWIYtPQcO69WytiGRsy8NvmmlS5A";

const normalizeChannel = (channel: string) => {
  const value = String(channel || "website").trim().toLowerCase();
  if (value === "website_bot" || value === "dashboard-preview" || value === "web") {
    return "website";
  }
  return value || "website";
};

let tenantContextCache: { apiKey: string; tenantId: string } | null = null;
const WARMUP_SESSION_ID = "__frosty_prewarm__";


interface ChatWidgetProps {
  apiKey?: string;
  botName?: string;
  botTagline?: string;
  channel?: string;
}

type SlotOffer = {
  account_id: string;
  owner_name?: string;
  owner_email?: string;
  slots: Array<{
    start: string;
    end: string;
    start_iso?: string;
    end_iso?: string;
  }>;
};

type ChatMessage = {
  role: string;
  content: string;
  rawBuffer?: string;
  statusLine?: string;
  slotOffers?: SlotOffer[];
};

export default function ChatWidget({
  apiKey = API_KEY,
  botName = "AI Assistant",
  botTagline = "Online & Ready",
  channel = "website"
}: ChatWidgetProps) {
  const resolvedApiKey = String(apiKey || "").trim();
  const resolvedChannel = normalizeChannel(channel);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const activeTheme = mounted ? (theme === "system" ? resolvedTheme : theme) : "dark";
  const isDark = activeTheme === "dark";
  const T = useMemo(() => (isDark ? DARK : LIGHT), [isDark]);

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSplashing, setIsSplashing] = useState(false);
  const [hasWarmedUp, setHasWarmedUp] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'ai' | 'human'>('ai');
  const chatModeRef = useRef<'ai' | 'human'>('ai');
  const wsRef = useRef<WebSocket | null>(null);
  const wsConnectRef = useRef<Promise<WebSocket | null> | null>(null);
  const wsReconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tenantIdRef = useRef<string>("default");
  const sessionIdRef = useRef<string>("");
  const lastWarmupAtRef = useRef<number>(0);
  const greetingWarmupRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    chatModeRef.current = chatMode;
  }, [chatMode]);

  const isOpenRef = useRef(false);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Mic state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Voice call state
  const [isInCall, setIsInCall] = useState(false);
  const [callStatus, setCallStatus] = useState<"connecting" | "listening" | "thinking" | "speaking" | "idle">("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const callWsRef = useRef<WebSocket | null>(null);
  const callMediaRef = useRef<MediaRecorder | null>(null);
  const callStreamRef = useRef<MediaStream | null>(null);
  const callAudioQueueRef = useRef<Uint8Array[]>([]);
  const callAudioElRef = useRef<HTMLAudioElement | null>(null);
  const callAudioUrlRef = useRef<string | null>(null);
  const callTurnIdRef = useRef(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Click-outside refs
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLDivElement>(null);

  // ── Drag state for FAB ──
  const [fabPos, setFabPos] = useState<{ x: number; y: number }>({ x: 1000, y: 24 });
  const fabPosRef = useRef<{ x: number; y: number }>({ x: 1000, y: 24 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; fabX: number; fabY: number } | null>(null);
  const hasDraggedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const init = { x: Math.max(24, window.innerWidth - 88), y: 24 };
      setFabPos(init);
      fabPosRef.current = init;
    }
  }, []);

  const getFabPosition = () => fabPosRef.current;

  // Is FAB on right half of screen?
  const isFabOnRight = () => {
    if (typeof window === 'undefined') return true;
    return getFabPosition().x > window.innerWidth / 2;
  };

  // Is FAB on top half of screen?
  const isFabOnTop = () => {
    if (typeof window === 'undefined') return false;
    return getFabPosition().y > window.innerHeight / 2;
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    const pos = getFabPosition();
    dragStartRef.current = { x: clientX, y: clientY, fabX: pos.x, fabY: pos.y };
    hasDraggedRef.current = false;
    isDraggingRef.current = true;
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current || !dragStartRef.current) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = dragStartRef.current.y - clientY; // inverted because y is from bottom
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 5) hasDraggedRef.current = true;
    if (!hasDraggedRef.current) return;

    const absX = dragStartRef.current.fabX + dx;
    const absY = dragStartRef.current.fabY - (clientY - dragStartRef.current.y);
    const newPos = {
      x: Math.max(12, Math.min(window.innerWidth - 76, absX)),
      y: Math.max(12, Math.min(window.innerHeight - 76, absY)),
    };
    fabPosRef.current = newPos;
    setFabPos(newPos);
  };

  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    dragStartRef.current = null;

    // Magnetic pull: snap to nearest bottom corner (left or right) upon release
    if (typeof window !== 'undefined') {
      const buttonWidth = 64; // w-16 = 64px
      const padding = 24; // margin from screen edge
      const screenWidth = window.innerWidth;
      const currentX = fabPosRef.current.x;
      const centerX = currentX + buttonWidth / 2;

      // Snap to left corner (24px) or right corner (screenWidth - buttonWidth - padding)
      const snappedX = centerX < screenWidth / 2 
        ? padding 
        : Math.max(padding, screenWidth - buttonWidth - padding);
      const snappedY = padding; // Always snap to bottom corner

      const snappedPos = { x: snappedX, y: snappedY };
      fabPosRef.current = snappedPos;
      setFabPos(snappedPos);
    }
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const onMouseUp = () => handleDragEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleDragEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Animated close
  const triggerClose = () => {
    if (!isOpen || isClosing) return;
    setIsClosing(true);
    if (wsReconnectTimerRef.current) {
      clearTimeout(wsReconnectTimerRef.current);
      wsReconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 700);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        isOpen && !isClosing &&
        chatWindowRef.current && !chatWindowRef.current.contains(e.target as Node) &&
        fabRef.current && !fabRef.current.contains(e.target as Node)
      ) triggerClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, isClosing]);

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Polling for admin/human messages + authoritative session mode
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(async () => {
      const sid = sessionIdRef.current;
      if (!sid) return;
      try {
        const apiBase = resolveApiBase();
        const bridged = getBridgedSessionId(sid);
        const res = await fetch(`${apiBase}/chat/messages?session_id=${encodeURIComponent(bridged)}`, {
          headers: { 'x-api-key': apiKey || API_KEY },
        });
        if (res.ok) {
          const data = await res.json();
          const serverMode = String(data?.mode || "").toLowerCase();
          if (serverMode === "ai" || serverMode === "human") {
            setChatMode((prev) => {
              if (prev !== serverMode) {
                const notice =
                  serverMode === "human"
                    ? "You are connected to a support agent."
                    : prev === "human"
                      ? "AI assistant is now active."
                      : "";
                if (notice) {
                  setMessages((msgs) => {
                    if (msgs.some((m) => m.role === "system" && m.content === notice)) return msgs;
                    return [...msgs, { role: "system", content: notice }];
                  });
                }
              }
              if (prev === serverMode) return prev;
              return serverMode as "ai" | "human";
            });
            if (serverMode === "human") {
              void connectSocket(sid);
            }
          }
          if (data.messages && Array.isArray(data.messages) && serverMode === "human") {
            setMessages((prev) => {
              const serverMsgs: ChatMessage[] = data.messages.map((m: any) => ({
                role: m.role === "admin" ? "assistant" : m.role,
                content: m.content,
              }));
              const hasNewAdminMsg = data.messages.some((m: any) =>
                m.role === "admin" &&
                !prev.some((pm) => pm.content === m.content)
              );
              if (!hasNewAdminMsg) return prev;

              // Merge: keep local system notices + optimistic user msgs not yet on server.
              const systemMsgs = prev.filter((m) => m.role === "system");
              const serverKeys = new Set(
                serverMsgs.map((m) => `${m.role}::${String(m.content || "").trim()}`)
              );
              const pendingUser = prev.filter(
                (m) =>
                  m.role === "user" &&
                  String(m.content || "").trim() &&
                  !serverKeys.has(`user::${String(m.content || "").trim()}`)
              );
              const next = [...serverMsgs, ...pendingUser];
              for (const s of systemMsgs) {
                if (!next.some((m) => m.role === "system" && m.content === s.content)) {
                  next.push(s);
                }
              }
              return next;
            });
          }
        }
      } catch (e) {
        // silent fallback
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, apiKey]);

  // Scroll to bottom immediately (used during streaming)
  const scrollToBottom = (smooth = true) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  };

  // Removed custom wheel event that broke scrolling. 
  // Using native CSS overscroll-contain instead.

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const threshold = 60;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setIsAtBottom(atBottom);
  };


  const generateSessionId = () => {
    let sid = sessionStorage.getItem("frosty_session");
    if (!sid) {
      sid = "sess_" + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem("frosty_session", sid);
    }
    return sid;
  };

  const getBridgedSessionId = (sid: string) => {
    if (!sid) return sid;
    if (sid.includes("--")) return sid;
    const tid = tenantIdRef.current || "default";
    return `${tid}--${resolvedChannel}--${sid}`;
  };


  const resolveApiBase = () => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      // Local: hit langgraph directly (matches .env.development.local).
      if (host === "localhost" || host === "127.0.0.1") {
        const envBot = (process.env.NEXT_PUBLIC_BOT_URL || "").trim();
        if (envBot && /localhost|127\.0\.0\.1|:8001/.test(envBot)) {
          return envBot.replace(/\/$/, "");
        }
        return "http://localhost:8001";
      }
      // Production / staged host: always same-origin /bot-api so nginx
      // routes to langgraph (works even if build-time domain differs).
      return `${window.location.protocol}//${window.location.host}/bot-api`;
    }
    const envBot = (process.env.NEXT_PUBLIC_BOT_URL || "").trim();
    if (envBot) return envBot.replace(/\/$/, "");
    return "http://localhost:8001";
  };

  const resolveWsBases = () => {
    const out: string[] = [];

    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") {
        const envWs = (process.env.NEXT_PUBLIC_WS_URL || "").trim();
        if (envWs) out.push(envWs.replace(/\/$/, ""));
        out.push("ws://localhost:8001");
      } else {
        // Prefer same-origin bot-api WS (langgraph proxies to backend live chat).
        const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
        out.push(`${wsProto}//${window.location.host}/bot-api`);
        // Admin live handoff also accepts /ws on the API host.
        out.push(`${wsProto}//${window.location.host}`);
      }
    }

    const apiBase = resolveApiBase();
    if (/^https?:\/\//i.test(apiBase)) {
      try {
        const parsed = new URL(apiBase);
        const wsProto = parsed.protocol === "https:" ? "wss:" : "ws:";
        out.push(`${wsProto}//${parsed.host}${parsed.pathname.replace(/\/$/, "")}`);
      } catch {
        // Ignore parse issues and keep fallback candidates.
      }
    }

    return Array.from(new Set(out));
  };

  const attachSocketHandlers = (ws: WebSocket) => {
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const role = String(data?.role || "").toLowerCase();
        const text = String(data?.text || "").trim();

        if (data.mode === "ai" || data.mode === "human") {
          setChatMode(data.mode);
          if (data.mode === "human" && sessionIdRef.current) {
            void connectSocket(sessionIdRef.current);
          }
        }

        if (!text) return;

        if (role === "assistant") {
          // Backend only returns assistant replies on the chat WS when mode is AI.
          if (data.mode !== "human") {
            setChatMode("ai");
          }
          setMessages(prev => [...prev, { role: 'assistant', content: text }]);
        } else if (role === "admin" || role === "agent") {
          setChatMode("human");
          // Normalize to assistant so it renders properly with an avatar
          setMessages(prev => [...prev, { role: 'assistant', content: text }]);
        } else {
          const lower = text.toLowerCase();
          if (lower.includes("connected to a support agent")) {
            setChatMode("human");
            if (sessionIdRef.current) void connectSocket(sessionIdRef.current);
          } else if (
            lower.includes("ai assistant is now active") ||
            lower.includes("ai is now active")
          ) {
            setChatMode("ai");
          }
          setMessages(prev => {
            if (prev.some((m) => m.role === "system" && m.content === text)) return prev;
            return [...prev, { role: 'system', content: text }];
          });
        }

        setIsLoading(false);
        setTimeout(() => scrollToBottom(), 50);
      } catch {
        // Ignore malformed ws payloads.
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      setIsLoading(false);
      // Keep trying while Live Support is active — claim/release notices need a live WS.
      if (chatModeRef.current === "human" && sessionIdRef.current && isOpenRef.current) {
        if (wsReconnectTimerRef.current) clearTimeout(wsReconnectTimerRef.current);
        wsReconnectTimerRef.current = setTimeout(() => {
          if (chatModeRef.current === "human" && sessionIdRef.current && isOpenRef.current) {
            void connectSocket(sessionIdRef.current);
          }
        }, 2000);
      }
    };
  };

  const connectSocket = async (sessionId: string): Promise<WebSocket | null> => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }
    if (wsConnectRef.current) {
      return wsConnectRef.current;
    }

    const attempt = async (): Promise<WebSocket | null> => {
      const bases = resolveWsBases();
      const rawId = sessionId.includes("--") ? sessionId : getBridgedSessionId(sessionId);
      const bridgedId = encodeURIComponent(rawId);
      for (const base of bases) {
        const url = `${base.replace(/\/$/, "")}/ws/chat/${bridgedId}`;
        try {
          const ws = await new Promise<WebSocket>((resolve, reject) => {
            const candidate = new WebSocket(url);
            const timer = setTimeout(() => {
              try { candidate.close(); } catch { }
              reject(new Error("timeout"));
            }, 2500);

            candidate.onopen = () => {
              clearTimeout(timer);
              resolve(candidate);
            };
            candidate.onerror = () => {
              clearTimeout(timer);
              try { candidate.close(); } catch { }
              reject(new Error("error"));
            };
            candidate.onclose = () => {
              clearTimeout(timer);
              reject(new Error("closed"));
            };
          });

          wsRef.current = ws;
          attachSocketHandlers(ws);
          return ws;
        } catch {
          // Try next candidate.
        }
      }
      return null;
    };

    wsConnectRef.current = attempt();
    const connected = await wsConnectRef.current;
    wsConnectRef.current = null;
    return connected;
  };

  const ensureTenantContext = async () => {
    if (!resolvedApiKey) return;
    if (
      tenantContextCache?.apiKey === resolvedApiKey &&
      tenantContextCache.tenantId &&
      tenantContextCache.tenantId !== "default"
    ) {
      tenantIdRef.current = tenantContextCache.tenantId;
      return;
    }
    try {
      const apiBase = resolveApiBase();
      const res = await fetch(`${apiBase}/tenant/bot-config`, {
        headers: {
          "x-api-key": resolvedApiKey,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      const tenantId = String(data?.tenant_id || data?.tenant?.tenant_id || "").trim();
      if (tenantId) {
        tenantIdRef.current = tenantId;
        tenantContextCache = { apiKey: resolvedApiKey, tenantId };
      }
    } catch {
      // Keep default tenant fallback.
    }
  };

  const streamResponse = async (
    fetchPromise: Promise<Response>,
    opts?: { onFirstToken?: () => void }
  ) => {
    const response = await fetchPromise;
    if (!response.ok) throw new Error("Network response was not ok");

    const reader = response.body!.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        if (part.startsWith("data: ")) {
          const jsonStr = part.replace("data: ", "").trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.status) {
              setMessages((prev) => {
                const updated = [...prev];
                const targetIdx = updated.map(m => m.role).lastIndexOf("assistant");
                if (targetIdx >= 0) {
                  updated[targetIdx] = {
                    ...updated[targetIdx],
                    statusLine: String(data.status),
                  };
                }
                return updated;
              });
            }

            if (data.token) {
              opts?.onFirstToken?.();
              setMessages((prev) => {
                const updated = [...prev];
                const targetIdx = updated.map(m => m.role).lastIndexOf("assistant");
                if (targetIdx === -1) return updated;
                const prevMsg = updated[targetIdx];
                
                const newRaw = (prevMsg.rawBuffer !== undefined ? prevMsg.rawBuffer : prevMsg.content) + data.token;
                let displayStr = newRaw;
                
                const trimmedRaw = newRaw.trimStart();
                if (trimmedRaw.startsWith("{") && trimmedRaw.includes('"reply"')) {
                  const replyIndex = newRaw.indexOf('"reply"');
                  if (replyIndex !== -1) {
                     const afterReply = newRaw.substring(replyIndex + 7);
                     const colonMatch = afterReply.match(/^\s*:\s*"/);
                     if (colonMatch) {
                        const start = colonMatch[0].length;
                        let innerStr = afterReply.substring(start);
                        if (innerStr.endsWith('"}') || innerStr.endsWith('"\n}')) {
                            innerStr = innerStr.replace(/"\s*}$/, '');
                        }
                        displayStr = innerStr.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
                     } else {
                        displayStr = "";
                     }
                  } else {
                     displayStr = "";
                  }
                } else if (trimmedRaw.startsWith("{")) {
                  displayStr = "";
                }

                updated[targetIdx] = {
                  ...prevMsg,
                  rawBuffer: newRaw,
                  content: displayStr,
                };
                return updated;
              });
              // Auto-scroll on every token if user is near bottom
              const container = scrollContainerRef.current;
              if (container) {
                const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
                if (nearBottom) container.scrollTop = container.scrollHeight;
              }
            }

            // Human takeover: switch to live support immediately (agent already claimed).
            if (data.human_takeover) {
              setMessages((prev) => {
                // Remove trailing empty assistant bubble
                let updated = [...prev];
                const targetIdx = updated.map(m => m.role).lastIndexOf("assistant");
                if (targetIdx !== -1 && !updated[targetIdx].content) {
                  updated.splice(targetIdx, 1);
                }
                const notice = "You are connected to a support agent.";
                if (!updated.some((m) => m.role === "system" && m.content === notice)) {
                  updated = [...updated, { role: "system", content: notice }];
                }
                return updated;
              });
              setChatMode("human");
              if (sessionIdRef.current) void connectSocket(sessionIdRef.current);
              setIsLoading(false);
              return; // stop processing this stream
            }

            if (data.final && data.final.reply) {
              let finalText = String(data.final.reply || "");
              // Safety: never show raw classifier JSON in the bubble
              const trimmed = finalText.trim();
              if (trimmed.startsWith("{") && trimmed.includes('"reply"')) {
                try {
                  const parsed = JSON.parse(trimmed);
                  if (parsed && typeof parsed.reply === "string" && parsed.reply.trim()) {
                    finalText = parsed.reply;
                  }
                } catch {
                  // keep original
                }
              }
              setMessages((prev) => {
                const updated = [...prev];
                const targetIdx = updated.map(m => m.role).lastIndexOf("assistant");
                if (targetIdx === -1) return updated;
                updated[targetIdx] = {
                  ...updated[targetIdx],
                  content: finalText,
                  statusLine: undefined,
                  slotOffers: data.final.slot_offers || undefined,
                };
                return updated;
              });
              setIsLoading(false);
              // Scroll to bottom when final reply arrives
              setTimeout(() => scrollToBottom(), 50);
            }

            // Handle final with empty reply (e.g. disabled/human mode)
            if (data.final && data.final.reply === "") {
              setMessages((prev) => {
                const targetIdx = prev.map(m => m.role).lastIndexOf("assistant");
                if (targetIdx !== -1 && !prev[targetIdx].content) {
                  const updated = [...prev];
                  updated.splice(targetIdx, 1);
                  return updated;
                }
                return prev;
              });
            }


          } catch (e) {
            // Ignore malformed chunks
          }
        }
      }
    }
  };

  const runSilentWarmup = async (sessionId: string = WARMUP_SESSION_ID) => {
    try {
      await ensureTenantContext();
      const apiBase = resolveApiBase();
      const response = await fetch(`${apiBase}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": resolvedApiKey,
        },
        body: JSON.stringify({
          message: "hi",
          session_id: getBridgedSessionId(sessionId),
          channel: resolvedChannel,
        }),
      });
      if (!response.ok || !response.body) return;
      const reader = response.body.getReader();
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    } catch {
      // Warmup is best-effort and should never disrupt UX.
    }
  };

  const runGreetingWarmup = async () => {
    if (!resolvedApiKey) return;
    if (greetingWarmupRef.current) {
      await greetingWarmupRef.current;
      return;
    }
    greetingWarmupRef.current = runSilentWarmup(WARMUP_SESSION_ID);
    await greetingWarmupRef.current;
  };

  useEffect(() => {
    if (!resolvedApiKey) return;
    void runGreetingWarmup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedApiKey, resolvedChannel]);

  const handleOpenWidget = async () => {
    setIsOpen(true);
    const sessionId = generateSessionId();
    sessionIdRef.current = sessionId;

    if (!hasWarmedUp) {
      // ── Show splash + loader IMMEDIATELY — before any network calls ────
      setHasWarmedUp(true);
      setIsSplashing(true);
      setIsLoading(true);
      lastWarmupAtRef.current = Date.now();
      setMessages([{ role: "assistant", content: "" }]);

      await ensureTenantContext();
      await runGreetingWarmup();
      void connectSocket(sessionId);

      const apiBase = resolveApiBase();
      const splashTimer = setTimeout(() => setIsSplashing(false), 2000);
      let splashDismissed = false;
      const dismissSplash = () => {
        if (splashDismissed) return;
        splashDismissed = true;
        clearTimeout(splashTimer);
        setIsSplashing(false);
      };

      // Stream the warmup "hi" — dismiss splash on first token or 2s timeout
      void streamResponse(
        fetch(`${apiBase}/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": resolvedApiKey,
          },
          body: JSON.stringify({
            message: "hi",
            session_id: getBridgedSessionId(sessionId),
            channel: resolvedChannel,
          }),
        }),
        { onFirstToken: dismissSplash }
      )
        .catch(() => {
          setMessages([{ role: "assistant", content: "Hi there! How can I help you today?" }]);
        })
        .finally(() => {
          dismissSplash();
          setIsLoading(false);
        });

      return;
    }

    // Widget re-opened after first warmup — resolve tenant + reconnect silently
    await ensureTenantContext();
    void connectSocket(sessionId);

    const now = Date.now();
    if (now - lastWarmupAtRef.current > 30000) {
      lastWarmupAtRef.current = now;
      void runSilentWarmup(sessionId);
    }
  };


  const sendHiddenMessage = async (hiddenText: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    const sessionId = sessionIdRef.current || generateSessionId();
    sessionIdRef.current = sessionId;
    await ensureTenantContext();
    try {
      const apiBase = resolveApiBase();
      await streamResponse(
        fetch(`${apiBase}/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": resolvedApiKey,
          },
          body: JSON.stringify({
            message: hiddenText,
            session_id: getBridgedSessionId(sessionId),
            channel: resolvedChannel,
          }),
        }),
      );
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Sorry, I couldn't complete that booking. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);

    const sessionId = sessionIdRef.current || generateSessionId();
    sessionIdRef.current = sessionId;

    if (chatMode === "human") {
      const bridgedId = getBridgedSessionId(sessionId);
      try {
        const apiBase = resolveApiBase();
        const res = await fetch(`${apiBase}/chat/handoff-message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": resolvedApiKey,
          },
          body: JSON.stringify({
            message: userText,
            session_id: bridgedId,
            channel: resolvedChannel,
          }),
        });
        if (!res.ok) throw new Error(`handoff-message ${res.status}`);
        void connectSocket(sessionId);
        return;
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "system", content: "Could not deliver your message to live support. Please try again." },
        ]);
        return;
      }
    }

    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "" },
    ]);
    setTimeout(() => scrollToBottom(false), 20);

    await ensureTenantContext();

    try {
      const apiBase = resolveApiBase();
      await streamResponse(
        fetch(`${apiBase}/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": resolvedApiKey,
          },
          body: JSON.stringify({
            message: userText,
            session_id: getBridgedSessionId(sessionId),
            channel: resolvedChannel,
          }),
        })
      );
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };



  // ── Voice Call ──────────────────────────────────────────────────────────────
  const audioContextRef = useRef<AudioContext | null>(null);
  const pcmWorkletRef = useRef<AudioWorkletNode | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      callStreamRef.current = stream;
      setIsInCall(true);
      setCallStatus("connecting");
      setLiveTranscript("");
      flushPlayback();

      const apiBase = resolveApiBase();
      const wsBase = apiBase.replace(/^http/, "ws");
      const sid = getBridgedSessionId(sessionIdRef.current || generateSessionId());
      const wsUrl = `${wsBase}/ws/voice-call/${encodeURIComponent(sid)}`;
      const ws = new WebSocket(wsUrl);
      callWsRef.current = ws;

      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        // Send init handshake with API key
        ws.send(JSON.stringify({ api_key: resolvedApiKey }));
      };

      ws.onmessage = async (event) => {
        if (event.data instanceof ArrayBuffer) {
          playPcmChunk(new Uint8Array(event.data));
          return;
        }
        if (event.data instanceof Blob) {
          const buf = await event.data.arrayBuffer();
          playPcmChunk(new Uint8Array(buf));
          return;
        }

        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "ready") {
            setCallStatus("listening");
            startMicStream(ws, stream);
          }
          else if (msg.type === "transcript") {
            setLiveTranscript(msg.text);
          }
          else if (msg.type === "user_final") {
            setMessages(prev => [...prev, { role: "user", content: msg.text }]);
            setLiveTranscript("");
          }
          else if (msg.type === "thinking") {
            setCallStatus("thinking");
          }
          else if (msg.type === "bot_reply") {
            setMessages(prev => [...prev, { role: "assistant", content: msg.text }]);
          }
          else if (msg.type === "audio_end") {
            setCallStatus("listening");
          }
          else if (msg.type === "interrupted") {
            // Barge-in: flush all queued audio immediately
            flushPlayback();
            setCallStatus("listening");
          }
          else if (msg.type === "error") {
            console.error("[CALL] Server error:", msg.message);
            endCall();
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (callWsRef.current === ws) {
          endCall();
        }
      };

      ws.onerror = () => {
        console.error("[CALL] WebSocket error");
        endCall();
      };

    } catch (err) {
      console.error("[CALL] Mic error:", err);
      alert("Cannot access microphone. Please check browser permissions.");
      setIsInCall(false);
      setCallStatus("idle");
    }
  };

  const startMicStream = async (ws: WebSocket, stream: MediaStream) => {
    try {
      const ctx = new AudioContext({ sampleRate: 16000 });
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      audioContextRef.current = ctx;

      // Register inline PCM processor worklet
      const processorCode = `
        class PcmProcessor extends AudioWorkletProcessor {
          process(inputs) {
            const input = inputs[0]?.[0];
            if (input) {
              const pcm16 = new Int16Array(input.length);
              for (let i = 0; i < input.length; i++) {
                const s = Math.max(-1, Math.min(1, input[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
            }
            return true;
          }
        }
        registerProcessor("pcm-processor", PcmProcessor);
      `;
      const blob = new Blob([processorCode], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      await ctx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);

      const source = ctx.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(ctx, "pcm-processor");
      pcmWorkletRef.current = worklet;

      worklet.port.onmessage = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(e.data); // Send raw PCM Int16 bytes
        }
      };

      source.connect(worklet);
      // Do NOT connect worklet to destination — we don't want local echo
      setCallStatus("listening");
    } catch (err) {
      console.error("[Frosty] AudioWorklet setup failed, falling back to MediaRecorder", err);
      // Fallback to MediaRecorder for browsers without AudioWorklet support
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      callMediaRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) ws.send(e.data); };
      rec.start(250);
    }
  };

  const playPcmChunk = (pcmBytes: Uint8Array) => {
    if (!pcmBytes.length) return;
    setCallStatus("speaking");

    try {
      if (!playbackCtxRef.current || playbackCtxRef.current.state === "closed") {
        playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
        nextPlayTimeRef.current = 0;
      }
      const ctx = playbackCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Convert raw PCM 16-bit LE to Float32 safely using DataView
      const samplesCount = Math.floor(pcmBytes.byteLength / 2);
      if (samplesCount === 0) return;
      const dataView = new DataView(pcmBytes.buffer, pcmBytes.byteOffset, pcmBytes.byteLength);
      const float32 = new Float32Array(samplesCount);
      for (let i = 0; i < samplesCount; i++) {
        float32[i] = dataView.getInt16(i * 2, true) / 32768.0;
      }

      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      const startTime = Math.max(now, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + buffer.duration;
    } catch (err) {
      console.warn("[Frosty] PCM playback error", err);
    }
  };

  const flushPlayback = () => {
    // Close and recreate playback context to instantly stop all queued audio
    try {
      playbackCtxRef.current?.close();
    } catch {}
    playbackCtxRef.current = null;
    nextPlayTimeRef.current = 0;
  };

  const endCall = () => {
    // Clean up AudioWorklet
    try { pcmWorkletRef.current?.disconnect(); } catch {}
    pcmWorkletRef.current = null;
    try { audioContextRef.current?.close(); } catch {}
    audioContextRef.current = null;

    // Clean up MediaRecorder fallback
    if (callMediaRef.current && callMediaRef.current.state !== "inactive") {
      callMediaRef.current.stop();
    }
    callMediaRef.current = null;

    // Stop stream tracks
    if (callStreamRef.current) {
      callStreamRef.current.getTracks().forEach(t => t.stop());
      callStreamRef.current = null;
    }

    // Close WebSocket
    if (callWsRef.current) {
      try { callWsRef.current.send(JSON.stringify({ type: "hangup" })); } catch { }
      try { callWsRef.current.close(); } catch { }
      callWsRef.current = null;
    }

    // Clean up playback
    flushPlayback();

    setIsInCall(false);
    setCallStatus("idle");
    setLiveTranscript("");
    callAudioQueueRef.current = [];
  };


  return (
    <>
      <style>{`
        .frostrek-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .frostrek-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .frostrek-scrollbar::-webkit-scrollbar-thumb {
          background: ${T.scrollThumb};
          border-radius: 10px;
        }
        .frostrek-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${T.scrollThumbHover};
        }
      `}</style>

      <style>{`
        @keyframes fab-pop-in {
          0%   { transform: scale(0) rotate(-200deg); opacity:0; }
          65%  { transform: scale(1.18) rotate(12deg);  opacity:1; }
          82%  { transform: scale(0.93) rotate(-6deg); }
          100% { transform: scale(1) rotate(0deg);     opacity:1; }
        }
        @keyframes fab-pop-out {
          0%   { transform: scale(1) rotate(0deg);   opacity:1; }
          100% { transform: scale(0) rotate(180deg); opacity:0; }
        }
        @keyframes window-open {
          0%   { transform: scale(0.45) translateY(80px);  opacity:0; filter:blur(16px); }
          55%  { transform: scale(1.03) translateY(-6px);  opacity:1; filter:blur(0); }
          75%  { transform: scale(0.98) translateY(3px); }
          100% { transform: scale(1)    translateY(0);    opacity:1; filter:blur(0); }
        }
        @keyframes window-close {
          0%   { transform: scale(1) translateY(0) rotate(0deg);     opacity:1; filter:blur(0); }
          25%  { transform: scale(1.04) translateY(-10px) rotate(0deg); opacity:1; }
          100% { transform: scale(0.08) translateY(140px) rotate(10deg); opacity:0; filter:blur(20px); }
        }
      `}</style>

      {/* ── Floating Action Button ── */}
      <div
        ref={fabRef}
        className="fixed z-50"
        style={{
          left: getFabPosition().x,
          bottom: getFabPosition().y,
          transition: isDraggingRef.current
            ? 'none'
            : 'left 0.35s cubic-bezier(0.25, 1, 0.5, 1), bottom 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          animation: isOpen
            ? 'fab-pop-out 0.38s cubic-bezier(0.4,0,1,1) forwards'
            : 'fab-pop-in 0.72s cubic-bezier(0.34,1.56,0.64,1) forwards',
          pointerEvents: isOpen ? 'none' : 'auto',
          cursor: isDraggingRef.current ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
        onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientX, e.clientY); }}
        onTouchStart={(e) => { if (e.touches.length === 1) handleDragStart(e.touches[0].clientX, e.touches[0].clientY); }}
      >
        <button
          onClick={(e) => { if (!hasDraggedRef.current) handleOpenWidget(); }}
          className="relative group w-16 h-16 flex items-center justify-center rounded-full p-[2px] transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${T.bronze}, ${T.gold}, ${T.accent})`,
            boxShadow: `0 0 30px ${T.bronze}66, 0 8px 32px rgba(0,0,0,0.3)`,
          }}
        >
          <div className="absolute inset-0 rounded-full opacity-50 blur-xl group-hover:opacity-80 transition-opacity" style={{ background: `linear-gradient(135deg, ${T.bronze}, ${T.gold})` }}></div>
          <div className="relative w-full h-full rounded-full flex items-center justify-center group-hover:bg-transparent transition-colors duration-300 overflow-hidden" style={{ background: T.void }}>
            <MessageSquare className="w-7 h-7 transition-colors relative z-10" style={{ color: T.gold }} />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(135deg, ${T.bronze}, ${T.gold})` }}></div>
          </div>
        </button>
      </div>

      {/* ── Chat Window ── */}
      <div
        ref={chatWindowRef}
        className="fixed w-[400px] h-[650px] max-h-[85vh] max-w-[calc(100vw-3rem)] flex flex-col z-50 rounded-3xl"
        style={{
          left: isFabOnRight() ? undefined : getFabPosition().x,
          right: isFabOnRight() ? (typeof window !== 'undefined' ? window.innerWidth - getFabPosition().x - 64 : 24) : undefined,
          top: isFabOnTop() ? (typeof window !== 'undefined' ? window.innerHeight - getFabPosition().y - 64 : 24) : undefined,
          bottom: isFabOnTop() ? undefined : getFabPosition().y,
          transformOrigin: isFabOnTop()
            ? (isFabOnRight() ? 'top right' : 'top left')
            : (isFabOnRight() ? 'bottom right' : 'bottom left'),
          animation: (!isOpen && !isClosing)
            ? 'none'
            : isClosing
              ? 'window-close 0.70s cubic-bezier(0.4,0,1,1) forwards'
              : 'window-open  0.72s cubic-bezier(0.34,1.56,0.64,1) forwards',
          pointerEvents: (!isOpen || isClosing) ? 'none' : 'auto',
          display: (!isOpen && !isClosing) ? 'none' : 'flex',
        }}
      >
        {/* Warm glow behind glass */}
        <div className="absolute inset-0 blur-3xl -z-10 rounded-3xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${T.bronze}1A, ${T.gold}0D, ${T.accent}0D)` }}></div>

        {/* Main Glass Panel */}
        <div className="flex-1 flex flex-col backdrop-blur-2xl rounded-3xl overflow-hidden relative transition-colors duration-300" style={{
          background: isDark ? `${T.pane}E6` : `${T.pane}F2`,
          border: `1px solid ${isDark ? T.surface + '55' : T.surface + '88'}`,
          boxShadow: isDark
            ? `0 20px 60px -15px rgba(0,0,0,0.5), 0 0 40px -10px ${T.bronze}26`
            : `0 20px 60px -15px rgba(0,0,0,0.15), 0 0 40px -10px ${T.bronze}1A`,
        }}>

          {isSplashing && <SplashAnimation isDark={isDark} />}

          {/* Wrapper to fade in the actual chat contents after splash */}
          <div className={`absolute inset-0 flex flex-col transition-opacity duration-1000 ${isSplashing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

            {/* Noise overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

            {/* Header */}
            <div className="relative px-5 py-4 flex items-center justify-between transition-colors duration-300" style={{
              borderBottom: `1px solid ${isDark ? T.surface + '44' : T.surface + '66'}`,
              background: isDark
                ? `linear-gradient(to bottom, ${T.card}CC, transparent)`
                : `linear-gradient(to bottom, ${T.card}CC, transparent)`,
            }}>
              {/* Top edge warm highlight */}
              <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: `linear-gradient(to right, transparent, ${T.bronze}66, transparent)` }}></div>

              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full flex items-center justify-center p-[2px] overflow-hidden group">
                  <div className="absolute inset-0 animate-[spin_4s_linear_infinite] group-hover:animate-[spin_2s_linear_infinite]" style={{ background: `linear-gradient(135deg, ${T.bronze}, ${T.gold}, ${T.accent})` }}></div>
                  <div className="relative w-full h-full rounded-full flex items-center justify-center backdrop-blur-md shadow-inner" style={{ background: T.void }}>
                    <Bot className="w-5 h-5" style={{ color: isDark ? T.gold : T.bronzeDark }} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h3 className="font-['Raleway'] font-semibold tracking-wide text-[15px] flex items-center gap-2" style={{ color: T.text }}>
                    {botName}
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: T.gold }}></span>
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: T.gold }}></span>
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="font-['Quicksand'] text-[11px] uppercase tracking-wider" style={{ color: T.textMuted }}>{botTagline}</p>
                    {chatMode === 'human' && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter" style={{ background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b44' }}>
                        Live Support
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={triggerClose}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-black/20 dark:hover:bg-white/20"
                style={{ color: T.textMuted, background: 'transparent' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="relative flex-1 bg-transparent overflow-hidden flex flex-col pt-2">
              <div
                ref={scrollContainerRef}
                className="absolute inset-0 overflow-y-auto overscroll-contain p-5 pb-[80px] space-y-6 scroll-smooth frostrek-scrollbar"
                onScroll={handleScroll}
              >
                {messages.map((msg, i) => {
                  const normalizedRole = String(msg.role || "").toLowerCase();
                  const isUser = normalizedRole === "user";
                  const isAdmin = normalizedRole === "admin" || normalizedRole === "agent";
                  const isAssistant = normalizedRole === "assistant";
                  const isSystem = normalizedRole === "system";
                  if (isSystem) {
                    return (
                      <div key={i} className="flex justify-center px-2">
                        <div
                          className="text-[11px] font-semibold text-center px-3 py-1.5 rounded-full"
                          style={{
                            color: "#0D9488",
                            background: "#0D948812",
                            border: "1px dashed #0D948855",
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={i} className={`flex gap-3 group ${isUser ? "justify-end" : "justify-start"}`}>

                      {/* Agent / Admin Avatar */}
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm relative overflow-hidden" style={{
                          background: isAssistant && !isAdmin ? `linear-gradient(135deg, ${T.bronze}33, ${T.gold}33)` : `linear-gradient(135deg, #00BFA633, #00BFA666)`,
                          border: `1px solid ${isDark ? T.surface + '44' : T.surface + '66'}`,
                        }}>
                          {isAdmin ? (
                            <div className="text-[10px] font-bold text-[#00BFA6]">STAFF</div>
                          ) : (
                            <Sparkles className="w-4 h-4" style={{ color: T.bronze }} />
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-1 max-w-[82%]">
                        {isAdmin && (
                          <div className="text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: T.textMuted }}>Live Support</div>
                        )}
                        <div
                          className="relative px-4 py-3 text-sm transition-colors duration-300 shadow-sm"
                          style={isUser
                            ? {
                              background: T.userBubbleBg,
                              color: T.userBubbleText,
                              borderRadius: "1rem 0.25rem 1rem 1rem",
                              boxShadow: `0 4px 15px ${T.bronze}33, inset 0 1px 0 ${T.bronzeLight}44`,
                            }
                            : {
                              background: isAdmin ? (isDark ? `linear-gradient(135deg, #00BFA610, #00BFA630)` : `linear-gradient(135deg, #00BFA610, #00BFA620)`) : (isDark ? `linear-gradient(135deg, ${T.card}D9, ${T.surface}55)` : `linear-gradient(135deg, ${T.card}, ${T.pane})`),
                              border: `1px solid ${isAdmin ? '#00BFA644' : (isDark ? T.surface + '55' : T.surface + '88')}`,
                              color: T.text,
                              borderRadius: "0.25rem 1rem 1rem 1rem",
                              fontFamily: "'Quicksand', sans-serif",
                              lineHeight: "1.6",
                              letterSpacing: "0.01em",
                            }
                          }
                        >
                          {(isAssistant || isAdmin) && (
                            <div className="frostrek-markdown">
                              {msg.statusLine ? (
                                <div className="text-xs italic mb-2 opacity-80">{msg.statusLine}</div>
                              ) : null}
                              {msg.content ? <SmoothTypingMessage content={msg.content} onUpdate={() => { if (isAtBottom) scrollToBottom(false); }} /> : <DynamicGeminiLoader T={T} />}
                            </div>
                          )}
                          {!isAssistant && !isAdmin && <div className="whitespace-pre-wrap">{renderMessageWithLinks(msg.content)}</div>}
                          {msg.slotOffers && msg.slotOffers.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              {msg.slotOffers.map((offer) => (
                                <div
                                  key={offer.account_id}
                                  className="rounded-lg border p-2"
                                  style={{ borderColor: isDark ? T.surface + '66' : T.surface + '99' }}
                                >
                                  <div className="text-xs font-bold">{offer.owner_name || offer.owner_email}</div>
                                  {offer.owner_email ? (
                                    <div className="text-[10px] opacity-70 mb-2">{offer.owner_email}</div>
                                  ) : null}
                                  <div className="flex flex-wrap gap-2">
                                    {offer.slots.map((slot, si) => (
                                      <button
                                        key={`${offer.account_id}-${si}`}
                                        type="button"
                                        onClick={() =>
                                          void sendHiddenMessage(
                                            `__BOOK_SLOT__${JSON.stringify({
                                              account_id: offer.account_id,
                                              start_iso: slot.start_iso,
                                              end_iso: slot.end_iso,
                                              owner_name: offer.owner_name || offer.owner_email,
                                            })}`,
                                          )
                                        }
                                        className="text-[11px] px-2 py-1 rounded border"
                                        style={{ borderColor: T.bronze + '66', color: T.bronze }}
                                      >
                                        {slot.start} – {slot.end}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Bottom fade */}
              <div className="absolute bottom-0 inset-x-0 h-12 pointer-events-none" style={{ background: `linear-gradient(to top, ${isDark ? T.pane + 'E6' : T.pane + 'F2'}, transparent)` }}></div>

              {/* Jump to bottom */}
              <div className={`absolute left-0 right-0 bottom-6 flex justify-center transition-all duration-300 ${isAtBottom ? 'translate-y-10 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
                <button
                  onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="backdrop-blur-md p-2 rounded-full shadow-lg transition-all z-10"
                  style={{
                    background: isDark ? `${T.card}E6` : `${T.card}F2`,
                    border: `1px solid ${isDark ? T.surface + '44' : T.surface + '66'}`,
                    color: T.text,
                  }}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Input Area */}
            <div className="relative p-4 pb-2 flex flex-col z-10 backdrop-blur-lg transition-colors duration-300" style={{
              borderTop: `1px solid ${isDark ? T.surface + '44' : T.surface + '66'}`,
              background: isDark ? `${T.void}66` : `${T.card}99`,
            }}>

              <form onSubmit={sendMessage} className="relative flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={isInCall ? endCall : startCall}
                  disabled={(isLoading && !isInCall) || chatMode === 'human'}
                  title={isInCall ? "End call" : "Start voice call"}
                  className={`flex-shrink-0 w-[42px] h-[42px] flex items-center justify-center rounded-full transition-all duration-300 ${isInCall ? "animate-pulse" : "disabled:opacity-40"
                    }`}
                  style={isInCall
                    ? { background: `${T.error}33`, color: T.error, border: `1px solid ${T.error}4D`, boxShadow: `0 0 15px ${T.error}66` }
                    : { background: isDark ? T.input : T.pane, color: T.textMuted, border: `1px solid ${isDark ? T.surface + '33' : T.surface + '55'}` }
                  }
                >
                  {isInCall ? <PhoneOff className="w-4 h-4 fill-current" /> : <Phone className="w-4 h-4" />}
                </button>

                <div className="relative flex-1 group">
                  {isInCall ? (
                    <div
                      className="w-full rounded-full py-3 pl-5 pr-5 text-[13px] transition-all flex items-center justify-between"
                      style={{
                        background: isDark ? `${T.input}CC` : T.input,
                        border: `1px solid ${isDark ? T.surface + '44' : T.surface + '88'}`,
                        color: T.text,
                        boxShadow: isDark ? `inset 0 2px 4px rgba(0,0,0,0.3)` : `inset 0 2px 4px rgba(0,0,0,0.05)`,
                      }}
                    >
                      <span className="truncate flex-1">
                        {liveTranscript || (
                          <span className="opacity-50 italic">
                            {callStatus === "connecting" && "Connecting..."}
                            {callStatus === "listening" && "Listening..."}
                            {callStatus === "thinking" && "Thinking..."}
                            {callStatus === "speaking" && "Speaking..."}
                            {callStatus === "idle" && "Call ended"}
                          </span>
                        )}
                      </span>
                      <div className="flex gap-1 ml-2">
                        <div className={`w-2 h-2 rounded-full ${callStatus === 'listening' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${callStatus === 'thinking' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${callStatus === 'speaking' ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`}></div>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Message ${botName}...`}
                      disabled={isLoading || isInCall}
                      className="w-full rounded-full py-3.5 pl-5 pr-14 text-[13px] focus:outline-none transition-all disabled:opacity-50"
                      style={{
                        background: isDark ? `${T.input}CC` : T.input,
                        border: `1px solid ${isDark ? T.surface + '44' : T.surface + '88'}`,
                        color: T.text,
                        boxShadow: isDark ? `inset 0 2px 4px rgba(0,0,0,0.3)` : `inset 0 2px 4px rgba(0,0,0,0.05)`,
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = `${T.bronze}80`;
                        e.currentTarget.style.background = isDark ? T.card : '#FFFFFF';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = isDark ? `${T.surface}44` : `${T.surface}88`;
                        e.currentTarget.style.background = isDark ? `${T.input}CC` : T.input;
                      }}
                    />
                  )}
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading || isInCall}
                    className="absolute right-[5px] top-[5px] bottom-[5px] min-w-[36px] flex items-center justify-center rounded-full transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                    style={{
                      background: `linear-gradient(135deg, ${T.bronze}, ${T.accent})`,
                      color: "#FDFBF7",
                      boxShadow: `0 0 12px ${T.bronze}4D`,
                    }}
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </form>

              {/* Frostrek Footer */}
              <div className="flex justify-center items-center pb-1">
                <span className="text-[10px] font-['Quicksand'] font-medium tracking-wider uppercase flex items-center gap-1.5" style={{ color: `${T.textDim}80` }}>
                  Powered by
                  <span className="font-semibold tracking-widest text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${T.bronze}, ${T.gold})` }}>FROSTREK</span>
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
