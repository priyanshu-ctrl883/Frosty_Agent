'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Layers,
  Loader2,
  Lock,
  Maximize2,
  MessageCircle,
  Minimize2,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import GlassNavbar from '@/components/GlassNavbar';
import FooterSection from '../FooterSection';

const DEMO_API = (process.env.NEXT_PUBLIC_DEMO_API_URL || 'http://127.0.0.1:8002').replace(
  /\/$/,
  ''
);

type SessionStatus = 'processing' | 'ready' | 'failed' | 'expired' | string;

type ChatMsg = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
};

const EXPERIENCE_PRESETS = [
  { name: 'Frostrek AI', url: 'https://frostrek.ai', tag: 'AI Platform' },
  { name: 'Stripe', url: 'https://stripe.com', tag: 'Fintech' },
  { name: 'Linear', url: 'https://linear.app', tag: 'SaaS' },
  { name: 'Supabase', url: 'https://supabase.com', tag: 'Cloud DB' },
  { name: 'Apple', url: 'https://apple.com', tag: 'Global' },
];



function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Markdown links + bold so WhatsApp deeplinks from the demo backend are clickable. */
function renderFormattedContent(text: string, isUser: boolean) {
  if (!text) return null;

  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderInlineFormatting(text.slice(lastIndex, match.index), isUser, lastIndex));
    }
    const linkText = (match[1] || '').replace(/\*\*/g, '');
    const url = match[2] || '#';
    const isWhatsApp = Boolean(url.includes('wa.me') || url.includes('whatsapp.com'));

    parts.push(
      <a
        key={`link-${match.index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 font-semibold transition-all ${
          isUser
            ? 'text-white underline hover:text-teal-100'
            : isWhatsApp
            ? 'text-[#027D8A] hover:text-[#0396A6] bg-teal-50 hover:bg-teal-100/80 px-2 py-1 rounded-md border border-teal-200/80 no-underline font-bold mt-1 shadow-2xs'
            : 'text-[#027D8A] hover:text-[#0396A6] underline'
        }`}
      >
        <span>{linkText}</span>
        <ExternalLink size={10} className="shrink-0 inline opacity-80" />
      </a>
    );
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(renderInlineFormatting(text.slice(lastIndex), isUser, lastIndex));
  }

  return <>{parts}</>;
}

function renderInlineFormatting(text: string, isUser: boolean, keyPrefix: number): React.ReactNode {
  // Bold formatting **bold**
  const boldRegex = /\*\*([^*]+)\*\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={`bold-${keyPrefix}-${match.index}`} className={isUser ? 'font-bold text-white' : 'font-semibold text-slate-900'}>
        {match[1] || ''}
      </strong>
    );
    lastIndex = boldRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function formatErrorMessage(
  rawError: string | null,
  targetHost: string,
): { title: string; desc: string; isInvalidUrl: boolean; isBackendDown: boolean } {
  if (!rawError) {
    return {
      title: `Crawler Restricted by ${targetHost}`,
      desc: `Unable to read ${targetHost}. Please try another website or one of the verified sample presets.`,
      isInvalidUrl: false,
      isBackendDown: false,
    };
  }
  const lower = rawError.toLowerCase();
  if (
    lower.includes('failed to fetch') ||
    lower.includes('content security') ||
    lower.includes('refused to connect') ||
    lower.includes('127.0.0.1') ||
    lower.includes('could not start live experience') ||
    lower.includes('networkerror')
  ) {
    return {
      title: 'Live demo backend is not reachable',
      desc: 'The crawler service did not respond. On testing it runs as siteguide behind /demo-api — not localhost:8002.',
      isInvalidUrl: false,
      isBackendDown: true,
    };
  }
  if (lower.includes('getaddrinfo') || lower.includes('name or service') || lower.includes('nodename') || lower.includes('invalid') || lower.includes('failed to parse')) {
    return {
      title: `Invalid Website URL: "${targetHost}"`,
      desc: `We could not resolve or locate this domain on the internet. Please verify that the domain name is spelled correctly and published online.`,
      isInvalidUrl: true,
      isBackendDown: false,
    };
  }
  if (lower.includes('403') || lower.includes('forbidden') || lower.includes('cloudflare') || lower.includes('waf')) {
    return {
      title: `Crawler & Embed Blocked by ${targetHost}`,
      desc: `${targetHost} has active enterprise anti-bot firewall protection (403 Forbidden). Both automated crawling and live iframe previews are restricted by their security policy.`,
      isInvalidUrl: false,
      isBackendDown: false,
    };
  }
  if (lower.includes('404') || lower.includes('not found')) {
    return {
      title: `Page Not Found (404) on ${targetHost}`,
      desc: `Could not find the requested webpage on ${targetHost}. Please verify that the page URL exists and is publicly accessible.`,
      isInvalidUrl: true,
      isBackendDown: false,
    };
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return {
      title: `Connection Timeout to ${targetHost}`,
      desc: `The target server at ${targetHost} took too long to respond. The website might be temporarily slow or undergoing maintenance.`,
      isInvalidUrl: false,
      isBackendDown: false,
    };
  }
  if (lower.includes('ssl') || lower.includes('certificate')) {
    return {
      title: `SSL Handshake Error on ${targetHost}`,
      desc: `Could not establish a secure HTTPS connection with ${targetHost}. Please check the server's SSL certificate configuration.`,
      isInvalidUrl: false,
      isBackendDown: false,
    };
  }
  return {
    title: `Crawler Restricted by ${targetHost}`,
    desc: `Unable to read ${targetHost}. Please try another website or one of the verified sample presets.`,
    isInvalidUrl: false,
    isBackendDown: false,
  };
}

function ExperienceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawUrl = (searchParams.get('url') || '').trim();

  const websiteUrl = useMemo(() => {
    if (!rawUrl) return '';
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
    return `https://${rawUrl}`;
  }, [rawUrl]);

  // Input states
  const [heroInput, setHeroInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Session State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>('processing');
  const [iframeAllowed, setIframeAllowed] = useState(true);
  const [iframeFailed, setIframeFailed] = useState(false);
  const [title, setTitle] = useState<string | null>(null);
  const [favicon, setFavicon] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);

  // Chat State (floating widget inside canvas)
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatLocked, setChatLocked] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [newUrlInput, setNewUrlInput] = useState('');

  const liveCanvasRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  const host = websiteUrl ? hostnameOf(websiteUrl) : '';
  const ready = status === 'ready';
  const processing = status === 'processing';
  const failed = status === 'failed';

  const isFrameBlocked = useMemo(() => {
    if (!websiteUrl) return false;
    return !iframeAllowed || iframeFailed;
  }, [websiteUrl, iframeAllowed, iframeFailed]);

  // Keep hero input and browser bar synced with current URL
  const [barUrl, setBarUrl] = useState('');
  useEffect(() => {
    if (websiteUrl) {
      setHeroInput(websiteUrl);
      setBarUrl(websiteUrl);
    }
  }, [websiteUrl]);

  const handleBarSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = barUrl.trim();
    if (!trimmed) return;
    handleLaunchUrl(trimmed);
  };

  // Interactive Live Resizing for Mockup Window
  const [customSize, setCustomSize] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const browserWindowRef = useRef<HTMLDivElement | null>(null);

  const handleResizeStart = (
    e: React.PointerEvent,
    direction: 'corner' | 'bottom' | 'right' | 'left'
  ) => {
    e.preventDefault();
    if (!browserWindowRef.current) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const rect = browserWindowRef.current.getBoundingClientRect();
    const startWidth = rect.width;
    const startHeight = rect.height;

    setIsDragging(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const maxWidth = Math.min(window.innerWidth - 32, 1600);
      const maxHeight = Math.min(window.innerHeight - 60, 960);

      let newW = startWidth;
      if (direction === 'corner' || direction === 'right') {
        newW = Math.max(460, Math.min(startWidth + deltaX * 2, maxWidth));
      } else if (direction === 'left') {
        newW = Math.max(460, Math.min(startWidth - deltaX * 2, maxWidth));
      }

      let newH = startHeight;
      if (direction === 'corner' || direction === 'bottom') {
        newH = Math.max(400, Math.min(startHeight + deltaY, maxHeight));
      }

      setCustomSize({
        width: Math.round(newW),
        height: Math.round(newH),
      });
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const toggleExpandMode = () => {
    if (customSize) {
      setCustomSize(null);
    } else {
      const maxW = Math.min(window.innerWidth - 48, 1540);
      const maxH = Math.min(window.innerHeight - 80, 840);
      setCustomSize({ width: maxW, height: maxH });
    }
  };

  // Dynamically compute optimal widget dimensions proportional to canvas
  const widgetDimensions = useMemo(() => {
    const canvasW = customSize?.width || 1020;
    const canvasH = customSize?.height || 560;

    // Width scales proportionally between 290px and 400px
    const targetW = Math.min(
      Math.max(290, Math.round(canvasW * 0.31)),
      400,
      Math.round(canvasW * 0.86)
    );

    // Height scales proportionally between 320px and 520px
    const targetH = Math.min(
      Math.max(320, Math.round(canvasH * 0.70)),
      520,
      Math.round(canvasH * 0.82)
    );

    return {
      width: `${targetW}px`,
      height: `${targetH}px`,
    };
  }, [customSize]);

  // Auto-scroll to live canvas when a URL is present
  useEffect(() => {
    if (websiteUrl && liveCanvasRef.current) {
      const timer = setTimeout(() => {
        liveCanvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [websiteUrl]);

  // Scroll chat messages to bottom on new message (ONLY within the chatbox container)
  useEffect(() => {
    if (chatOpen && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, status, chatOpen]);

  // Start demo session when websiteUrl changes
  useEffect(() => {
    if (!websiteUrl) {
      setSessionId(null);
      setStatus('processing');
      setMessages([]);
      setIsSubmitting(false);
      setIframeFailed(false);
      return;
    }

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    (async () => {
      try {
        setError(null);
        setStatus('processing');
        setIframeAllowed(true);
        setIframeFailed(false);
        setTitle(null);
        setFavicon(null);
        setPageCount(0);
        setMessages([]);
        setIsSubmitting(true);
        setChatOpen(false);

        const createRes = await fetch(`${DEMO_API}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ website_url: websiteUrl }),
        });
        const createJson = await createRes.json().catch(() => null);
        if (!createRes.ok || !createJson?.ok) {
          const msg =
            createJson?.error?.message ||
            createJson?.detail?.error?.message ||
            `Failed to start demo (${createRes.status})`;
          throw new Error(msg);
        }

        const data = createJson.data;
        if (cancelled) return;
        setSessionId(data.id);
        setStatus(data.status || 'processing');
        if (data.status === 'ready' || data.status === 'failed') {
          setIframeAllowed(data.iframe_allowed !== false);
          setIsSubmitting(false);
        }
        setTitle(data.website_title || null);
        setFavicon(data.website_favicon || null);

        const poll = async () => {
          if (!data.id || cancelled) return;
          try {
            const stRes = await fetch(`${DEMO_API}/sessions/${data.id}/status`, {
              headers: { Accept: 'application/json' },
            });
            const stJson = await stRes.json().catch(() => null);
            if (!stRes.ok || !stJson?.ok) return;
            const st = stJson.data;
            setStatus(st.status);
            setIframeAllowed(st.iframe_allowed !== false);
            setTitle(st.website_title || null);
            if (st.website_favicon) setFavicon(st.website_favicon);
            setPageCount(st.page_count || 0);
            setChatLocked(Boolean(st.chat_locked));
            if (st.error) setError(String(st.error));
            if (st.status === 'ready' || st.status === 'failed' || st.status === 'expired') {
              setIsSubmitting(false);
              if (pollTimer) clearInterval(pollTimer);
            }
          } catch {
            /* keep polling */
          }
        };

        await poll();
        pollTimer = setInterval(poll, 1800);
      } catch (err: any) {
        if (!cancelled) {
          setStatus('failed');
          setIsSubmitting(false);
          setError(err?.message || 'Could not start live experience demo');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [websiteUrl]);

  // Send message handler
  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText || input).trim();
      if (!text || !sessionId || sending || chatLocked || status !== 'ready') return;

      setInput('');
      setSending(true);
      const userMsg: ChatMsg = {
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const placeholderAssistant: ChatMsg = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg, placeholderAssistant]);

      try {
        const res = await fetch(`${DEMO_API}/sessions/${sessionId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
          body: JSON.stringify({ message: text }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Chat failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const line = part
              .split('\n')
              .map((l) => l.trim())
              .find((l) => l.startsWith('data:'));
            if (!line) continue;
            const payload = line.replace(/^data:\s*/, '');
            try {
              const evt = JSON.parse(payload);
              if (evt.type === 'delta' && typeof evt.content === 'string') {
                setMessages((prev) => {
                  const next = [...prev];
                  const last = next[next.length - 1];
                  if (last?.role === 'assistant') {
                    next[next.length - 1] = {
                      ...last,
                      content: last.content + evt.content,
                    };
                  }
                  return next;
                });
              }
              if (evt.type === 'done') {
                setChatLocked(Boolean(evt.chat_locked));
              }
            } catch {
              /* ignore chunk parse error */
            }
          }
        }
      } catch (err: any) {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === 'assistant' && !last.content) {
            next[next.length - 1] = {
              role: 'assistant',
              content: err?.message || 'Sorry — chat is temporarily unavailable. Please try again.',
            };
          }
          return next;
        });
      } finally {
        setSending(false);
      }
    },
    [input, sessionId, sending, chatLocked, status]
  );

  const handleLaunchUrl = (urlToLaunch: string) => {
    let clean = urlToLaunch.trim();
    if (!clean) return;
    if (!/^https?:\/\//i.test(clean)) {
      clean = `https://${clean}`;
    }
    router.push(`/experience?url=${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(3,150,166,0.09),transparent),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] text-slate-900 flex flex-col selection:bg-[#0396A6]/20 selection:text-[#027D8A]">
      {/* ── Main Glass Navbar ── */}
      <GlassNavbar ready={true} />

      {/* ── Ambient Soft Glow Gradients ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-[#0396A6]/8 blur-[120px] rounded-full" />
        <div className="absolute top-[45%] -right-40 w-[500px] h-[500px] bg-teal-400/5 blur-[150px] rounded-full" />
      </div>

      <main className="relative z-10 flex-1 pt-28 sm:pt-36 pb-16 sm:pb-20 px-3.5 sm:px-6 lg:px-8 max-w-[1680px] mx-auto w-full flex flex-col items-center">
        {/* ========================================================================= */}
        {/* ── SECTION 1: HERO & URL INPUT (SS2) ── */}
        {/* ========================================================================= */}
        <section className="w-full flex flex-col items-center justify-center text-center max-w-4xl">
          {/* Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#0396A6]/10 border border-[#0396A6]/20 text-[#0396A6] shadow-xs mb-4 sm:mb-5"
          >
            <span className="w-2 h-2 rounded-full bg-[#0396A6] animate-pulse" />
            <Bot className="w-3.5 h-3.5 text-[#0396A6]" />
            <span className="text-[9.5px] sm:text-[11px] font-bold tracking-widest uppercase">
              FROSTREK LIVE EXPERIENCE
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#0A1A2F] max-w-4xl leading-[1.15] tracking-tight"
          >
            Simulate Autonomous AI Agents on{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#027D8A] via-[#0396A6] to-[#00BFA6]">
              Any Website
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-3.5 sm:mt-5 text-xs sm:text-base md:text-lg text-slate-600 max-w-2xl leading-relaxed font-normal"
          >
            Enter your company domain. Our live crawler vectorizes product catalogs, FAQs, and
            knowledge documents into an isolated RAG memory and launches a 24/7 conversion AI agent
            in 30 seconds.
          </motion.p>

          {/* Clean URL Input Card */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="w-full max-w-[580px] mt-6 sm:mt-7"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLaunchUrl(heroInput);
              }}
              className="w-full p-1 sm:p-1.5 pl-3 sm:pl-4 bg-white/95 backdrop-blur-md rounded-full border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_36px_rgba(3,150,166,0.12)] hover:border-[#0396A6]/60 focus-within:border-[#0396A6] focus-within:ring-2 focus-within:ring-[#0396A6]/20 focus-within:shadow-[0_12px_36px_rgba(3,150,166,0.18)] transition-all duration-300 flex items-center gap-1.5 sm:gap-2"
            >
              <input
                type="text"
                value={heroInput}
                onChange={(e) => setHeroInput(e.target.value)}
                placeholder="https://yourbrand.com (or try stripe.com)"
                className="flex-1 min-w-0 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-slate-800 placeholder:text-slate-400 font-sans text-[12.5px] sm:text-[14.5px] px-1 sm:px-2 py-1.5 sm:py-2 rounded-l-full shadow-none"
                style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
              />
              <button
                type="submit"
                disabled={isSubmitting || !heroInput.trim()}
                className="shrink-0 px-3.5 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-[#0396A6] to-[#028494] hover:from-[#028494] hover:to-[#026c7a] !text-white text-[11.5px] sm:text-[14px] font-bold font-sans flex items-center gap-1 sm:gap-1.5 shadow-[0_4px_14px_rgba(3,150,166,0.35)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer border-none whitespace-nowrap"
                style={{ color: '#FFFFFF' }}
              >
                {isSubmitting || (processing && websiteUrl) ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-white" />
                    <span>Reading site…</span>
                  </>
                ) : (
                  <>
                    <span>Launch Live Demo</span>
                    <ArrowRight size={14} className="text-white" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Preset Pills */}
            <div className="mt-3.5 sm:mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium mr-1">Or try live sample:</span>
              {EXPERIENCE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleLaunchUrl(preset.url)}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border text-[11px] sm:text-xs font-medium transition-all cursor-pointer ${websiteUrl === preset.url
                      ? 'bg-teal-50 border-[#0396A6] text-[#027D8A] shadow-xs'
                      : 'bg-white hover:bg-teal-50/80 border-slate-200 hover:border-[#0396A6]/40 text-slate-700 hover:text-[#027D8A] shadow-2xs'
                    }`}
                >
                  <Globe2 size={12} className="text-[#0396A6]" />
                  <span>{preset.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({preset.tag})</span>
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ========================================================================= */}
        {/* ── SECTION 2: SINGLE CENTERED LIVE BROWSER CANVAS WITH EMBEDDED BOT ── */}
        {/* ========================================================================= */}
        <div ref={liveCanvasRef} className="w-full pt-8 sm:pt-14 scroll-mt-24">
          {websiteUrl && (
            <AnimatePresence mode="wait">
              {/* ── STATE A: INGESTION PROGRESS WINDOW (SS1 MATCHING DESIGN) ── */}
              {processing && (
                <motion.div
                  key="processing-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="max-w-2xl mx-auto w-full p-4.5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-[0_20px_50px_rgba(3,150,166,0.1)] space-y-4 sm:space-y-5"
                >
                  <div>
                    <h2 className="text-base sm:text-xl font-bold text-slate-900">Your website</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Paste your link — the AI reads your site and turns it into an agent that
                      answers your customers.
                    </p>
                  </div>

                  {/* Active URL & Reading button bar */}
                  <div className="flex items-center gap-2 p-1.5 pl-3 sm:pl-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="flex-1 font-mono text-xs sm:text-sm text-slate-800 truncate">
                      {host || websiteUrl}
                    </span>
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#0396A6] text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs shrink-0">
                      <Loader2 size={14} className="animate-spin text-white" />
                      <span>Reading your site…</span>
                    </div>
                  </div>

                  {/* Blue / Teal Progress Status Pill Box */}
                  <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-teal-50/80 border border-teal-100/90 text-teal-900 space-y-2.5 sm:space-y-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="flex items-center gap-1 text-[#0396A6]">
                        <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#0396A6] animate-bounce" />
                        <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#0396A6] animate-bounce [animation-delay:0.15s]" />
                        <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#0396A6] animate-bounce [animation-delay:0.3s]" />
                      </div>
                      <span className="font-semibold text-xs sm:text-base text-slate-800">
                        Reading your site… {pageCount > 0 ? `${pageCount} pages discovered` : 'initializing crawler'}
                      </span>
                    </div>

                    {/* Step-by-step verified RAG checklist */}
                    <div className="space-y-1.5 sm:space-y-2 pt-2 border-t border-teal-200/60 text-[11px] sm:text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-teal-600 shrink-0" />
                        <span>Domain verified and connection established</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 size={13} className="animate-spin text-[#0396A6] shrink-0" />
                        <span>Crawling multi-page DOM structure & product FAQs</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                        <span>Synthesizing vector embeddings into isolated RAG memory</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer reassurance */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-[11px] sm:text-xs text-slate-500 text-center sm:text-left">
                    <span>No signup, no credit card. We read public pages only.</span>
                    <Link href="/login" className="font-semibold text-[#0396A6] hover:underline">
                      Already have an account? Log in
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* ── STATE B: SINGLE COMPACT CENTERED CANVAS WITH EMBEDDED BOTTOM-RIGHT BOT ── */}
              {(ready || failed) && (
                <motion.div
                  key="live-single-canvas"
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    maxWidth: customSize ? `${customSize.width}px` : undefined,
                  }}
                  className={`mx-auto w-full px-2 sm:px-4 ${
                    !customSize ? 'max-w-4xl lg:max-w-5xl' : ''
                  }`}
                >
                  {/* ── Main Centered Realistic Browser Window Container (Draggable & Resizable) ── */}
                  <div
                    ref={browserWindowRef}
                    style={{
                      height: customSize ? `${customSize.height}px` : undefined,
                    }}
                    className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 bg-white shadow-[0_25px_60px_rgba(15,23,42,0.12)] flex flex-col ${
                      !customSize ? 'h-[500px] sm:h-[560px] lg:h-[620px]' : ''
                    }`}
                  >
                    {/* Browser Mac Top Bar with Live Real-Time Editable Address Bar & Controls */}
                    <div className="h-11 sm:h-13 px-3 sm:px-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/95 select-none shrink-0 z-20 gap-2">
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#FF5F57] inline-block shadow-2xs" />
                        <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#FEBC2E] inline-block shadow-2xs" />
                        <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#28C840] inline-block shadow-2xs" />
                      </div>

                      {/* Live Editable Address Bar Form */}
                      <form
                        onSubmit={handleBarSubmit}
                        className="flex-1 max-w-2xl mx-1 sm:mx-3 flex items-center min-w-0"
                      >
                        <div className="w-full rounded-lg sm:rounded-xl bg-white border border-slate-200/90 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs text-slate-700 flex items-center gap-1.5 sm:gap-2 shadow-2xs focus-within:border-[#0396A6] focus-within:ring-2 focus-within:ring-[#0396A6]/20 transition-all">
                          <Lock size={12} className="text-teal-600 shrink-0" />
                          <input
                            type="text"
                            value={barUrl}
                            onChange={(e) => setBarUrl(e.target.value)}
                            placeholder="Type or paste any website (e.g. legalhai.in, stripe.com)..."
                            className="flex-1 bg-transparent border-0 outline-none text-slate-800 font-mono text-[11px] sm:text-xs min-w-0 placeholder:text-slate-400"
                          />
                          <button
                            type="submit"
                            disabled={isSubmitting || !barUrl.trim() || barUrl.trim() === websiteUrl}
                            className="px-2 sm:px-2.5 py-0.5 rounded-md bg-gradient-to-r from-[#027D8A] to-[#0396A6] hover:opacity-95 text-white font-semibold text-[10px] sm:text-[11px] transition-all disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-2xs"
                          >
                            {isSubmitting ? 'Loading...' : 'Go'}
                          </button>
                        </div>
                      </form>

                      {/* Quick Actions & Size Toggle */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {/* Quick Size Toggle Button */}
                        <button
                          type="button"
                          onClick={toggleExpandMode}
                          title={customSize ? "Reset to Default Size" : "Expand Window"}
                          className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-100 text-slate-600 hover:text-[#0396A6] text-[11px] font-medium transition-all shadow-2xs cursor-pointer select-none"
                        >
                          {customSize ? (
                            <>
                              <Minimize2 size={12} className="text-teal-600" />
                              <span>Reset</span>
                            </>
                          ) : (
                            <>
                              <Maximize2 size={12} className="text-slate-500" />
                              <span>Expand</span>
                            </>
                          )}
                        </button>

                        <a
                          href={websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open live website in new tab"
                          className="text-slate-400 hover:text-[#0396A6] hover:bg-slate-200/60 transition-all p-1.5 rounded-lg flex items-center gap-1 text-xs"
                        >
                          <span className="hidden sm:inline text-[11px] text-slate-600 font-medium">Open</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>

                    {/* Browser Viewport Area */}
                    <div className="relative flex-1 w-full bg-slate-100 overflow-hidden">
                      {/* Scenario 1: Scraping / Ingestion Failed OR Invalid URL */}
                      {failed ? (() => {
                        const errInfo = formatErrorMessage(error, host);
                        return (
                          <div className="absolute inset-0 flex items-center justify-center p-6 bg-[radial-gradient(900px_450px_at_50%_40%,rgba(239,68,68,0.04),transparent)] text-center overflow-y-auto">
                            <div className="max-w-md space-y-4">
                              <div className="w-14 h-14 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500 shadow-sm">
                                <ShieldAlert size={28} />
                              </div>
                              <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold mb-2">
                                  <Lock size={11} className="text-rose-600" />
                                  <span>
                                    {errInfo.isBackendDown
                                      ? 'Demo backend unreachable'
                                      : errInfo.isInvalidUrl
                                        ? 'Invalid URL / Domain Not Found'
                                        : 'Domain Protection / WAF Detected'}
                                  </span>
                                </div>
                                <h3 className="text-base sm:text-xl font-bold text-slate-900">
                                  {errInfo.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed max-w-sm mx-auto">
                                  {errInfo.desc}
                                </p>
                              </div>

                              {/* Quick Sample Presets */}
                              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs space-y-2 shadow-2xs text-left">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                  TRY VERIFIED PUBLIC SAMPLES:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {EXPERIENCE_PRESETS.map((p) => (
                                    <button
                                      key={p.name}
                                      type="button"
                                      onClick={() => handleLaunchUrl(p.url)}
                                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-[#027D8A] border border-slate-200 text-[11px] font-medium transition-all cursor-pointer"
                                    >
                                      {p.name}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center justify-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setShowUrlModal(true)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0396A6] hover:bg-[#027D8A] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                                >
                                  <Search size={13} />
                                  <span>Try Another Website</span>
                                </button>
                                <a
                                  href={websiteUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all no-underline"
                                >
                                  <span>Open Site</span>
                                  <ExternalLink size={12} />
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })() : isFrameBlocked ? (
                        // Scenario 2: Crawlable YES, but In-Frame Preview Protected by Security Headers (apple.com, linear.app, etc.)
                        <div className="absolute inset-0 flex items-center justify-center p-6 bg-[radial-gradient(900px_450px_at_50%_40%,rgba(3,150,166,0.06),transparent)] text-center overflow-y-auto">
                          <div className="max-w-lg space-y-4">
                            <div className="w-14 h-14 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto text-[#0396A6] shadow-sm">
                              <ShieldCheck size={28} />
                            </div>
                            <div>
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-[#027D8A] text-xs font-semibold mb-2">
                                <Lock size={11} className="text-teal-600" />
                                <span>Security Frame-Protection Active • AI Ready</span>
                              </div>
                              <h3 className="text-base sm:text-xl font-bold text-slate-900">
                                {host} Restricts In-Frame Previews
                              </h3>
                              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed max-w-md mx-auto">
                                Like many high-security sites, <strong>{host}</strong> blocks direct iframe
                                embedding using strict <code>X-Frame-Options</code> or <code>CSP</code> headers.
                              </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-white border border-teal-200/90 text-left text-xs space-y-2 shadow-2xs">
                              <div className="font-bold text-[#027D8A] flex items-center gap-1.5 text-xs sm:text-sm">
                                <Sparkles size={14} className="text-[#0396A6]" />
                                <span>AI Knowledge Ingested Successfully ({pageCount || 1} Pages Indexed)</span>
                              </div>
                              <p className="text-slate-600 leading-relaxed">
                                Our crawler has fully indexed <strong>{host}</strong> into isolated vector memory.
                                You can test the AI agent trained on this website right now using the chat widget below!
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setChatOpen(true);
                                  setTimeout(() => chatInputRef.current?.focus({ preventScroll: true }), 150);
                                }}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#027D8A] to-[#0396A6] hover:from-[#0396A6] hover:to-[#028494] !text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                                style={{ color: '#FFFFFF' }}
                              >
                                <MessageCircle size={15} />
                                <span>Chat with Frosty AI</span>
                              </button>
                              <a
                                href={websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all no-underline"
                              >
                                <span>Open {host} in New Tab</span>
                                <ExternalLink size={14} />
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Scenario 3: Direct Live Interactive Iframe
                        <iframe
                          title={`Live Simulation of ${host}`}
                          src={websiteUrl}
                          onError={() => setIframeFailed(true)}
                          className="absolute inset-0 w-full h-full border-0 bg-white"
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                          referrerPolicy="no-referrer"
                        />
                      )}

                      {/* ========================================================================= */}
                      {/* ── EMBEDDED FLOATING CHATBOT WIDGET (Inside Canvas Bottom-Right) ── */}
                      {/* ========================================================================= */}
                      <div className="absolute bottom-2.5 right-2.5 sm:bottom-3.5 sm:right-3.5 z-40">
                        <AnimatePresence>
                          {chatOpen ? (
                            // EXPANDED CHATBOT CONSOLE (Compact & perfectly proportioned)
                            <motion.div
                              initial={{ opacity: 0, y: 15, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 12, scale: 0.95 }}
                              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                              style={{
                                width: widgetDimensions.width,
                                height: widgetDimensions.height,
                                maxWidth: 'calc(100% - 1.25rem)',
                                maxHeight: 'calc(100% - 1.25rem)',
                              }}
                              className="rounded-2xl sm:rounded-3xl bg-white/98 backdrop-blur-xl border border-slate-200/90 shadow-[0_16px_45px_rgba(3,150,166,0.22)] flex flex-col overflow-hidden transition-[width,height] duration-150 ease-out"
                            >
                              {/* Header */}
                              <div
                                className="p-2 px-3 text-white flex items-center justify-between select-none shrink-0"
                                style={{
                                  background: 'linear-gradient(135deg, #027D8A 0%, #0396A6 100%)',
                                }}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="relative shrink-0">
                                    <div
                                      className="rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold shadow-inner shrink-0"
                                      style={{
                                        width: '28px',
                                        height: '28px',
                                        minWidth: '28px',
                                        minHeight: '28px',
                                        maxWidth: '28px',
                                        maxHeight: '28px',
                                        borderRadius: '9999px',
                                        aspectRatio: '1 / 1',
                                        flexShrink: 0,
                                      }}
                                    >
                                      <Bot size={14} className="shrink-0 text-white" />
                                    </div>
                                    <span
                                      className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[#027D8A] ${failed ? 'bg-rose-400' : 'bg-emerald-400'
                                        }`}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[11.5px] sm:text-xs font-bold truncate leading-tight">
                                      Frosty
                                    </div>
                                    <div className="text-[9px] sm:text-[10px] text-teal-100 font-medium flex items-center gap-1 truncate">
                                      <span>AI Agent</span>
                                      <span>•</span>
                                      <span className="truncate max-w-[110px]">{host}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setChatOpen(false)}
                                    title="Minimize chat"
                                    className="bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer border-none flex items-center justify-center shrink-0"
                                    aria-label="Minimize chat"
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      minWidth: '26px',
                                      minHeight: '26px',
                                      maxWidth: '26px',
                                      maxHeight: '26px',
                                      borderRadius: '9999px',
                                      aspectRatio: '1 / 1',
                                      flexShrink: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: 0,
                                    }}
                                  >
                                    <X size={14} className="shrink-0 text-white" />
                                  </button>
                                </div>
                              </div>

                              {/* Message log */}
                              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 bg-slate-50/70 text-[11px] sm:text-xs">
                                {failed ? (
                                  <div className="rounded-xl bg-rose-50/90 border border-rose-200/80 p-2.5 text-[11px] text-rose-800 space-y-1 leading-relaxed shadow-2xs">
                                    <div className="font-bold flex items-center gap-1.5 text-rose-900">
                                      <ShieldAlert size={13} className="text-rose-600 shrink-0" />
                                      <span>Crawling Restricted</span>
                                    </div>
                                    <p>{formatErrorMessage(error, host).desc}</p>
                                    <p className="text-[10px] text-rose-600 font-medium pt-0.5">
                                      Please try another website or pick a verified preset.
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    {/* Welcome Bubble */}
                                    <div className="flex gap-1.5 items-start">
                                      <div
                                        className="rounded-full bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center shrink-0 mt-0.5 border border-[#0396A6]/20"
                                        style={{
                                          width: '24px',
                                          height: '24px',
                                          minWidth: '24px',
                                          minHeight: '24px',
                                          maxWidth: '24px',
                                          maxHeight: '24px',
                                          borderRadius: '9999px',
                                          aspectRatio: '1 / 1',
                                          flexShrink: 0,
                                        }}
                                      >
                                        <Sparkles size={12} className="shrink-0 text-[#0396A6]" />
                                      </div>
                                      <div className="space-y-1.5 max-w-[92%]">
                                        <div className="rounded-xl rounded-tl-xs px-2.5 py-1.5 bg-white border border-slate-200 text-slate-800 leading-relaxed shadow-2xs text-[11px] sm:text-xs">
                                          👋 Welcome! I am <strong>Frosty</strong>, trained directly on{' '}
                                          <strong>{host}</strong>. Ask me anything!
                                        </div>

                                        {/* Suggestion Chips */}
                                        {!messages.length && (
                                          <div className="space-y-1 pt-0.5">
                                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block pl-0.5">
                                              SUGGESTED INQUIRIES:
                                            </span>
                                            {[
                                              `What does ${host} offer?`,
                                              `What is the pricing?`,
                                              `How do I contact sales?`,
                                            ].map((promptText) => (
                                              <button
                                                key={promptText}
                                                onClick={() => void sendMessage(promptText)}
                                                className="w-full text-left px-2 py-1 rounded-md bg-white hover:bg-teal-50/80 border border-slate-200 hover:border-[#0396A6]/40 text-[10px] sm:text-[10.5px] text-slate-700 hover:text-[#027D8A] transition-all duration-150 flex items-center justify-between group shadow-2xs cursor-pointer"
                                              >
                                                <span className="truncate pr-1.5">{promptText}</span>
                                                <ArrowRight
                                                  size={10}
                                                  className="text-slate-400 group-hover:text-[#0396A6] shrink-0"
                                                />
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Streamed Messages */}
                                    {messages.map((m, i) => (
                                      <div
                                        key={`${m.role}-${i}`}
                                        className={`flex gap-1.5 items-start ${m.role === 'user' ? 'justify-end' : 'justify-start'
                                          }`}
                                      >
                                        {m.role === 'assistant' && (
                                          <div
                                            className="rounded-full bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center shrink-0 mt-0.5 border border-[#0396A6]/20"
                                            style={{
                                              width: '24px',
                                              height: '24px',
                                              minWidth: '24px',
                                              minHeight: '24px',
                                              maxWidth: '24px',
                                              maxHeight: '24px',
                                              borderRadius: '9999px',
                                              aspectRatio: '1 / 1',
                                              flexShrink: 0,
                                            }}
                                          >
                                            <Bot size={12} className="shrink-0 text-[#0396A6]" />
                                          </div>
                                        )}
                                        <div
                                          className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-[11px] sm:text-xs leading-relaxed whitespace-pre-wrap ${m.role === 'user'
                                              ? 'bg-gradient-to-r from-[#027D8A] to-[#0396A6] !text-white rounded-tr-xs shadow-sm'
                                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                                            }`}
                                          style={m.role === 'user' ? { color: '#FFFFFF' } : {}}
                                        >
                                          {m.content ? (
                                            renderFormattedContent(m.content, m.role === 'user')
                                          ) : sending && i === messages.length - 1 ? (
                                            <span className="inline-flex items-center gap-1 text-slate-400 italic text-[10px]">
                                              <Loader2 size={10} className="animate-spin text-[#0396A6]" />
                                              <span>Reasoning…</span>
                                            </span>
                                          ) : (
                                            ''
                                          )}
                                        </div>
                                      </div>
                                    ))}

                                    {error && (
                                      <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-[10.5px] p-2">
                                        {error}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Input bar */}
                              <form
                                className="p-1.5 sm:p-2 bg-white border-t border-slate-100 shrink-0"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  void sendMessage();
                                }}
                              >
                                <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/90 focus-within:border-[#0396A6] focus-within:ring-2 focus-within:ring-[#0396A6]/20 pl-2.5 sm:pl-3 pr-1 py-0.5 transition-all">
                                  <input
                                    ref={chatInputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={!ready || chatLocked || sending || failed}
                                    placeholder={
                                      failed
                                        ? 'Crawling restricted'
                                        : chatLocked
                                          ? 'Demo limit reached'
                                          : ready
                                            ? `Ask Frosty about ${host}…`
                                            : 'Waiting for knowledge…'
                                    }
                                    className="flex-1 min-w-0 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-[11px] sm:text-xs text-slate-800 placeholder:text-slate-400 py-1"
                                    style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                                  />
                                  <button
                                    type="submit"
                                    disabled={!ready || chatLocked || sending || !input.trim() || failed}
                                    className="rounded-full bg-[#0396A6] hover:bg-[#027D8A] !text-white flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer border-none shadow-xs shrink-0"
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      minWidth: '28px',
                                      minHeight: '28px',
                                      maxWidth: '28px',
                                      maxHeight: '28px',
                                      borderRadius: '9999px',
                                      aspectRatio: '1 / 1',
                                      flexShrink: 0,
                                      color: '#FFFFFF',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: 0,
                                    }}
                                  >
                                    {sending ? (
                                      <Loader2 size={12} className="animate-spin text-white shrink-0" />
                                    ) : (
                                      <Send size={12} className="text-white shrink-0 -ml-0.5" />
                                    )}
                                  </button>
                                </div>
                                <div
                                  style={{
                                    textAlign: 'center',
                                    fontSize: '10px',
                                    lineHeight: '14px',
                                    color: '#94A3B8',
                                    marginTop: '6px',
                                    paddingBottom: '2px',
                                    userSelect: 'none',
                                    width: '100%',
                                  }}
                                >
                                  Powered by{' '}
                                  <a
                                    href="https://frostrek.ai"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline',
                                      fontWeight: 600,
                                      color: '#027D8A',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    Frostrek
                                  </a>
                                </div>
                              </form>
                            </motion.div>
                          ) : (
                            // ── FLOATING CIRCULAR BOT BUTTON (Inside Bottom-Right of Canvas) ──
                            <motion.button
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.7 }}
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => {
                                setChatOpen(true);
                                setTimeout(() => chatInputRef.current?.focus({ preventScroll: true }), 150);
                              }}
                              className="relative bg-gradient-to-tr from-[#027D8A] via-[#0396A6] to-[#00BFA6] text-white shadow-[0_8px_25px_rgba(3,150,166,0.35)] border-2 border-white flex items-center justify-center cursor-pointer group shrink-0"
                              style={{
                                width: '48px',
                                height: '48px',
                                minWidth: '48px',
                                minHeight: '48px',
                                maxWidth: '48px',
                                maxHeight: '48px',
                                borderRadius: '9999px',
                                aspectRatio: '1 / 1',
                                flexShrink: 0,
                              }}
                              title="Open Frosty"
                              aria-label="Open Frosty"
                            >
                              <Bot size={22} className="text-white drop-shadow-xs transition-transform group-hover:scale-110 shrink-0" />
                              <span
                                className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-white shadow-2xs ${failed ? 'bg-rose-400' : 'bg-emerald-400'
                                  }`}
                              />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ── Real-Time Interactive Drag Resize Handles (Desktop / Tablet Only) ── */}
                      {/* Corner Handle */}
                      <div
                        onPointerDown={(e) => handleResizeStart(e, 'corner')}
                        title="Click and drag corner to resize window in real time"
                        className="hidden sm:flex absolute bottom-0 right-0 w-8 h-8 z-50 cursor-nwse-resize items-end justify-end p-1.5 select-none group/resize"
                      >
                        <div className="w-3.5 h-3.5 border-r-[2.5px] border-b-[2.5px] border-slate-400/80 group-hover/resize:border-[#0396A6] group-hover/resize:scale-110 transition-all rounded-br-xs pointer-events-none shadow-2xs" />
                      </div>

                      {/* Bottom Edge Handle */}
                      <div
                        onPointerDown={(e) => handleResizeStart(e, 'bottom')}
                        title="Click and drag to resize height"
                        className="hidden sm:block absolute bottom-0 left-0 right-8 h-2.5 z-40 cursor-ns-resize hover:bg-[#0396A6]/20 transition-colors select-none"
                      />

                      {/* Right Edge Handle */}
                      <div
                        onPointerDown={(e) => handleResizeStart(e, 'right')}
                        title="Click and drag to resize width"
                        className="hidden sm:block absolute top-12 bottom-8 right-0 w-2.5 z-40 cursor-ew-resize hover:bg-[#0396A6]/20 transition-colors select-none"
                      />

                      {/* Left Edge Handle */}
                      <div
                        onPointerDown={(e) => handleResizeStart(e, 'left')}
                        title="Click and drag left edge to resize width"
                        className="hidden sm:block absolute top-12 bottom-8 left-0 w-2.5 z-40 cursor-ew-resize hover:bg-[#0396A6]/20 transition-colors select-none"
                      />

                      {/* Drag overlay to prevent iframe stealing pointer focus */}
                      {isDragging && (
                        <div className="absolute inset-0 z-50 cursor-nwse-resize bg-transparent select-none" />
                      )}
                    </div>
                  </div>

                  {/* ── Helpful Hint Line Below Canvas (Desktop / Tablet Only) ── */}
                  <div className="hidden sm:flex mt-3.5 flex-wrap items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-500 text-center select-none">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#027D8A] bg-teal-50/90 border border-teal-200/80 px-2 py-0.5 rounded-md shadow-2xs">
                      <Maximize2 size={11} className="text-[#0396A6]" />
                      <span>Adjustable Canvas</span>
                    </span>
                    <span>Drag any edge or corner to resize the preview, or click <strong>Expand</strong> in the top bar.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ── SECTION 3: 4 FEATURE VALUE PILLARS ── */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mt-12 sm:mt-20 w-full text-left">
          {[
            {
              icon: Zap,
              title: 'Sub-250ms RAG Inference',
              desc: 'Real-time multi-page scraping that vectors and indexes brand content into strict semantic knowledge boundaries.',
            },
            {
              icon: ShieldCheck,
              title: 'Zero-Hallucination Guardrails',
              desc: 'Every assistant reply is strictly grounded in scraped page facts with 99.4% factual accuracy citation policies.',
            },
            {
              icon: Bot,
              title: 'Autonomous Lead Qualification',
              desc: 'Gathers prospect name, email, requirements, and auto-generates price quotes and calendar booking events.',
            },
            {
              icon: Layers,
              title: 'Omnichannel Web + WhatsApp',
              desc: 'Deploy identical agent intelligence simultaneously to your website widget and WhatsApp Business API.',
            },
          ].map((feat, idx) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + idx * 0.08 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(3,150,166,0.14)] hover:border-[#0396A6]/60 transition-all duration-300 group cursor-default overflow-hidden"
            >
              {/* Subtle top/corner glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Bottom colored accent border on hover */}
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#0396A6] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0396A6]/10 border border-[#0396A6]/20 flex items-center justify-center text-[#0396A6] group-hover:scale-110 group-hover:rotate-3 group-hover:bg-[#0396A6] group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(3,150,166,0.35)] transition-all duration-300 mb-3.5 sm:mb-4">
                  <feat.icon size={20} />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#027D8A] transition-colors duration-200 mb-1.5 sm:mb-2">
                  {feat.title}
                </h2>
                <p className="text-[11.5px] sm:text-xs text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
                  {feat.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* ========================================================================= */}
        {/* ── SECTION 4: BESPOKE ARCHITECTURE CTA BANNER ── */}
        {/* ========================================================================= */}
        <section className="mt-10 sm:mt-14 p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-teal-500/10 via-white to-teal-50/50 border border-[#0396A6]/20 w-full max-w-5xl shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 text-center md:text-left">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-[#027D8A]">
                BESPOKE AI ARCHITECTURE
              </span>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mt-1">
                Ready to deploy on your production infrastructure?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
                Connect custom CRMs, dedicated vector pipelines, and bespoke voice AI models.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
              <Link
                href="/contact"
                className="w-full sm:w-auto text-center px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white text-slate-900 border border-slate-200 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-all shadow-sm hover:scale-105"
              >
                Book Consultation
              </Link>
              <Link
                href="/login?mode=register"
                className="w-full sm:w-auto text-center px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#0396A6] !text-white font-bold text-xs sm:text-sm hover:bg-[#027D8A] transition-all shadow-md shadow-[#0396A6]/25 hover:scale-105"
                style={{ color: '#FFFFFF' }}
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Change Website URL Modal ── */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Change Website</h3>
              <button
                onClick={() => setShowUrlModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Enter another website address to immediately scrape and index for live simulation.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newUrlInput.trim()) {
                  setShowUrlModal(false);
                  handleLaunchUrl(newUrlInput);
                }
              }}
              className="space-y-3"
            >
              <input
                type="text"
                value={newUrlInput}
                onChange={(e) => setNewUrlInput(e.target.value)}
                placeholder="https://yourcompany.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 outline-none focus:border-[#0396A6] focus:ring-2 focus:ring-[#0396A6]/20"
                style={{ outline: 'none' }}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUrlModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newUrlInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#0396A6] hover:bg-[#027D8A] !text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                  style={{ color: '#FFFFFF' }}
                >
                  Launch Demo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Global Footer ── */}
      <FooterSection />
    </div>
  );
}

export default function ExperienceClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-[#0396A6]">
          <Loader2 size={32} className="animate-spin" />
        </div>
      }
    >
      <ExperienceInner />
    </Suspense>
  );
}
