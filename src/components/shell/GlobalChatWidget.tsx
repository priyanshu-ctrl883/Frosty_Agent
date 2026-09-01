"use client";

import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Sparkles,
  RefreshCw,
  Bot,
  User,
  ShieldAlert,
  Minimize2,
  X,
  ChevronUp,
  Terminal,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiRequest } from "@/lib/api";
import { API_URL } from "@/lib/constants";
import { getToken } from "@/lib/session";
import type { Agent, WidgetSettings } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import { clearWidgetSession, loadWidgetSession, saveWidgetSession } from "@/lib/widgetSession";

type BrainEvent =
  | { event: "run.started"; data: Record<string, unknown> }
  | { event: "token"; data: { text?: string } }
  | { event: "message.completed"; data: { text?: string } }
  | { event: "suggested_replies"; data: { replies?: string[] } }
  | { event: "handoff_requested"; data: Record<string, unknown> }
  | { event: "capacity"; data: Record<string, unknown> }
  | { event: "paced"; data: Record<string, unknown> }
  | { event: "paused"; data: Record<string, unknown> }
  | { event: "refuse"; data: Record<string, unknown> }
  | { event: "conversation_closed"; data: Record<string, unknown> }
  | { event: "run.finished"; data: Record<string, unknown> }
  | { event: "error"; data: { code?: string; text?: string; reason?: string } };

type ChatLine = {
  id: string;
  who: "user" | "ai" | "agent" | "system";
  text: string;
  meta?: string;
  timestamp: string;
};

const HUMAN_TAKEOVER_COPY = "You are connected to support team.";
const HUMAN_LEFT_COPY = "Support team left the chat.";

const DEFAULT_BRAND_COLOR = "#0396A6";
const POLL_INTERVAL_MS = 4000;

export function GlobalChatWidget() {
  const { me, merchant } = useWorkspace();
  const isOwner = Boolean(me?.is_owner);
  const merchantId = merchant?.id ?? null;

  const [isOpen, setIsOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoaded, setAgentsLoaded] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [simulationMode, setSimulationMode] = useState<"public" | "sandbox">("public");

  const hasWebsiteAgent = useMemo(() => {
    return agents.some((a) => a.mode === "website" || a.mode === "unified");
  }, [agents]);

  // Session state
  const [webSession, setWebSession] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"idle" | "connecting" | "active" | "error" | "closed">("idle");
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);

  // Chat transcript & input state
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [humanActive, setHumanActive] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [copied, setCopied] = useState<"web" | "conv" | null>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);
  const pollInFlightRef = useRef(false);
  const cursorRef = useRef(0);
  const conversationIdRef = useRef<string | null>(null);
  const webSessionRef = useRef<string | null>(null);
  const bootPromiseRef = useRef<Promise<{ conversation_id: string; web_session: string } | null> | null>(null);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    webSessionRef.current = webSession;
  }, [webSession]);

  // Drag & Magnetic Snap state
  const [corner, setCorner] = useState<"bottom-left" | "bottom-right">("bottom-right");
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragDataRef = useRef<{
    startPointerX: number;
    startPointerY: number;
    startWidgetX: number;
    startWidgetY: number;
    hasMoved: boolean;
    activePointerId: number | null;
    renderedX: number;
    renderedY: number;
  }>({
    startPointerX: 0,
    startPointerY: 0,
    startWidgetX: 0,
    startWidgetY: 0,
    hasMoved: false,
    activePointerId: null,
    renderedX: 0,
    renderedY: 0,
  });
  const snapTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("frosty__chat_widget_corner");
      if (saved === "bottom-left" || saved === "bottom-right") {
        setCorner(saved);
      }
    } catch {
      /* noop */
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const target = e.target as HTMLElement;
    if (target.closest("button, select, input, a")) return;

    if (isSnapping && snapTimerRef.current) {
      clearTimeout(snapTimerRef.current);
      setIsSnapping(false);
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    dragDataRef.current = {
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startWidgetX: rect.left,
      startWidgetY: rect.top,
      hasMoved: false,
      activePointerId: e.pointerId,
      renderedX: rect.left,
      renderedY: rect.top,
    };

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* fallback */
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const data = dragDataRef.current;
    if (data.activePointerId !== e.pointerId) return;

    const deltaX = e.clientX - data.startPointerX;
    const deltaY = e.clientY - data.startPointerY;

    if (!data.hasMoved && Math.hypot(deltaX, deltaY) >= 5) {
      data.hasMoved = true;
      setIsDragging(true);
    }

    if (data.hasMoved && containerRef.current) {
      const MARGIN = 24;
      const rect = containerRef.current.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      const minX = MARGIN;
      const maxX = Math.max(MARGIN, window.innerWidth - w - MARGIN);
      const minY = MARGIN;
      const maxY = Math.max(MARGIN, window.innerHeight - h - MARGIN);

      const rawX = Math.min(Math.max(data.startWidgetX + deltaX, minX), maxX);
      const rawY = Math.min(Math.max(data.startWidgetY + deltaY, minY), maxY);

      // Magnetic anchors (strictly bottom-left and bottom-right)
      const anchorBL = { x: minX, y: maxY };
      const anchorBR = { x: maxX, y: maxY };

      const distBL = Math.hypot(rawX - anchorBL.x, rawY - anchorBL.y);
      const distBR = Math.hypot(rawX - anchorBR.x, rawY - anchorBR.y);

      const nearest = distBL < distBR ? anchorBL : anchorBR;
      const minDist = Math.min(distBL, distBR);

      const MAGNETIC_RADIUS = 220;
      const PULL_STRENGTH = 0.38;

      let targetX = rawX;
      let targetY = rawY;

      if (minDist < MAGNETIC_RADIUS) {
        const pullRatio = (MAGNETIC_RADIUS - minDist) / MAGNETIC_RADIUS;
        const pullIntensity = Math.pow(pullRatio, 1.5) * PULL_STRENGTH;
        targetX = rawX + (nearest.x - rawX) * pullIntensity;
        targetY = rawY + (nearest.y - rawY) * pullIntensity;
      }

      data.renderedX = targetX;
      data.renderedY = targetY;

      const baseX = corner === "bottom-left" ? minX : maxX;
      const baseY = maxY;

      setDragOffset({ x: targetX - baseX, y: targetY - baseY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const data = dragDataRef.current;
    if (data.activePointerId !== e.pointerId) return;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* fallback */
    }
    data.activePointerId = null;

    if (!data.hasMoved) {
      if (!isOpen) {
        setIsOpen(true);
      }
      return;
    }

    if (containerRef.current) {
      const MARGIN = 24;
      const rect = containerRef.current.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      const minX = MARGIN;
      const maxX = Math.max(MARGIN, window.innerWidth - w - MARGIN);
      const maxY = Math.max(MARGIN, window.innerHeight - h - MARGIN);

      const centerX = data.renderedX + w / 2;
      const targetCorner: "bottom-left" | "bottom-right" =
        centerX < window.innerWidth / 2 ? "bottom-left" : "bottom-right";

      const snapTargetX = targetCorner === "bottom-left" ? minX : maxX;
      const snapTargetY = maxY;

      const baseX = corner === "bottom-left" ? minX : maxX;
      const baseY = maxY;

      setIsSnapping(true);
      setDragOffset({ x: snapTargetX - baseX, y: snapTargetY - baseY });

      snapTimerRef.current = setTimeout(() => {
        setIsSnapping(false);
        setIsDragging(false);
        setCorner(targetCorner);
        setDragOffset({ x: 0, y: 0 });
        try {
          localStorage.setItem("frosty__chat_widget_corner", targetCorner);
        } catch {
          /* noop */
        }
      }, 430);
    }
  };

  // Load widget settings only when a website-capable agent exists.
  const loadSettings = useCallback(async () => {
    if (!hasWebsiteAgent) {
      setWidgetSettings(null);
      return;
    }
    try {
      const url = selectedAgentId
        ? `/v1/widget/settings?agent_id=${encodeURIComponent(selectedAgentId)}`
        : "/v1/widget/settings";
      const snap = await apiRequest<WidgetSettings>(url);
      if (isMounted.current) {
        setWidgetSettings(snap);
      }
    } catch {
      if (isMounted.current) {
        setWidgetSettings(null);
      }
    }
  }, [hasWebsiteAgent, selectedAgentId]);

  const handleAgentChange = useCallback((newAgentId: string) => {
    setSelectedAgentId(newAgentId);
    conversationIdRef.current = null;
    webSessionRef.current = null;
    bootPromiseRef.current = null;
    setWebSession(null);
    setConversationId(null);
    setCursor(0);
    setHumanActive(false);
    setLines([]);
    setSessionStatus("idle");
    setSessionError(null);
    if (merchantId) {
      clearWidgetSession(merchantId);
    }
  }, [merchantId]);

  useEffect(() => {
    if (agentsLoaded) {
      if (hasWebsiteAgent) {
        void loadSettings();
      } else {
        setWidgetSettings(null);
      }
    }
    return () => {
      isMounted.current = false;
    };
  }, [agentsLoaded, hasWebsiteAgent, loadSettings]);

  // Restore the same visitor identity the production embed would — without this, every reload
  // mints a new contact/conversation and Inbox handoff targets a different id than the widget.
  useEffect(() => {
    if (!merchantId) return;
    const saved = loadWidgetSession(merchantId);
    if (saved) {
      conversationIdRef.current = saved.conversationId;
      webSessionRef.current = saved.webSession;
      setWebSession(saved.webSession);
      setConversationId(saved.conversationId);
      setCursor(saved.pollCursor);
      if (saved.humanActive) setHumanActive(true);
      setSessionStatus("active");

      // Load full message history so multi-turn transcript and context are preserved
      fetch(`${API_URL}/v1/public/widget/sessions/${encodeURIComponent(saved.conversationId)}/messages?since=0`, {
        headers: { Accept: "application/json" },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (!json?.data?.messages || !isMounted.current) return;
          const rows = json.data.messages as Array<{
            id: number;
            sender_type: string;
            text: string;
            created_at: string;
          }>;
          if (rows.length > 0) {
            const historyLines: ChatLine[] = rows.map((m) => ({
              id: `history-${m.id}`,
              who: m.sender_type === "user" ? "user" : m.sender_type === "agent" ? "agent" : "ai",
              text: m.text,
              meta: m.sender_type === "agent" ? "Human Agent Reply" : undefined,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }));
            setLines(historyLines);
            const maxId = Math.max(...rows.map((r) => r.id));
            setCursor(maxId);
          }
        })
        .catch(() => {});
    }
    setSessionRestored(true);
  }, [merchantId]);

  useEffect(() => {
    if (!merchantId || !webSession || !conversationId || sessionStatus !== "active") return;
    saveWidgetSession(merchantId, { webSession, conversationId, pollCursor: cursor, humanActive });
  }, [merchantId, webSession, conversationId, cursor, sessionStatus, humanActive]);

  // Load Agents
  useEffect(() => {
    let cancelled = false;
    apiRequest<Agent[]>("/v1/agents")
      .then((list) => {
        if (cancelled || !Array.isArray(list)) return;
        setAgents(list);
        setAgentsLoaded(true);
        if (list.length > 0) {
          const pref = list.find((a) => a.mode === "website") || list.find((a) => a.mode === "unified") || list[0];
          if (pref) setSelectedAgentId(pref.id);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAgents([]);
          setAgentsLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll transcript on new lines
  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  // Boot Visitor Session
  const bootSession = useCallback(
    async (existingWebSession: string | null = null) => {
      if (conversationIdRef.current && sessionStatus === "active") {
        return { conversation_id: conversationIdRef.current, web_session: webSessionRef.current || "" };
      }
      if (bootPromiseRef.current) {
        return await bootPromiseRef.current;
      }
      if (!hasWebsiteAgent) {
        setSessionStatus("error");
        setSessionError("No website agent configured. Create a website agent to test live chat.");
        return null;
      }

      setSessionStatus("connecting");
      setSessionError(null);

      const runBoot = async () => {
        try {
          let key = widgetSettings?.publishable_key;

          // Auto-mint key if missing and user is owner
          if (!key && isOwner && hasWebsiteAgent) {
            try {
              const keyResult = await apiRequest<{ api_key: string }>("/v1/widget/key", { method: "POST" });
              const snap = await apiRequest<WidgetSettings>("/v1/widget/settings");
              if (isMounted.current) setWidgetSettings(snap);
              key = keyResult?.api_key || snap?.publishable_key;
            } catch {}
          }

          if (!key) {
            setSessionStatus("error");
            setSessionError("No public publishable key configured.");
            return null;
          }

          const storedSnapshot = merchantId ? loadWidgetSession(merchantId) : null;
          const sessionToPass = existingWebSession || webSessionRef.current || storedSnapshot?.webSession;
          const payload: { api_key: string; web_session?: string; agent_id?: string } = {
            api_key: key,
          };
          if (selectedAgentId) {
            payload.agent_id = selectedAgentId;
          }
          if (sessionToPass) {
            payload.web_session = sessionToPass;
          }

          let res = await fetch(`${API_URL}/v1/public/widget/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload),
          });

          // If key is invalid/rotated, auto-rotate key once if owner and retry
          if (res.status === 404 && isOwner && hasWebsiteAgent) {
            try {
              const keyResult = await apiRequest<{ api_key: string }>("/v1/widget/key", { method: "POST" });
              const snap = await apiRequest<WidgetSettings>("/v1/widget/settings");
              if (isMounted.current) setWidgetSettings(snap);
              key = keyResult?.api_key || snap?.publishable_key;
              if (key) {
                payload.api_key = key;
                res = await fetch(`${API_URL}/v1/public/widget/sessions`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Accept: "application/json" },
                  body: JSON.stringify(payload),
                });
              }
            } catch {}
          }

          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
            throw new Error(body.error?.message || `Boot failed (${res.status})`);
          }

          const json = (await res.json()) as {
            data: { conversation_id: string; web_session: string };
          };

          conversationIdRef.current = json.data.conversation_id;
          webSessionRef.current = json.data.web_session;

          if (isMounted.current) {
            const sameConversation = json.data.conversation_id === conversationId;
            const nextCursor = sameConversation && cursor > 0 ? cursor : 0;
            setWebSession(json.data.web_session);
            setConversationId(json.data.conversation_id);
            setSessionStatus("active");
            setCursor(nextCursor);
            if (merchantId) {
              saveWidgetSession(merchantId, {
                webSession: json.data.web_session,
                conversationId: json.data.conversation_id,
                pollCursor: nextCursor,
                humanActive,
              });
            }
          }
          return json.data;
        } catch (err) {
          if (isMounted.current) {
            setSessionStatus("error");
            setSessionError(err instanceof Error ? err.message : "Session boot failed");
          }
          return null;
        } finally {
          bootPromiseRef.current = null;
        }
      };

      bootPromiseRef.current = runBoot();
      return await bootPromiseRef.current;
    },
    [widgetSettings?.publishable_key, isOwner, merchantId, conversationId, cursor, humanActive, hasWebsiteAgent, sessionStatus]
  );

  const pollAgentReplies = useCallback(
    async (convId: string, since: number) => {
      if (pollInFlightRef.current) return since;
      pollInFlightRef.current = true;
      try {
        const res = await fetch(
          `${API_URL}/v1/public/widget/sessions/${encodeURIComponent(convId)}/messages?since=${since}`,
          { headers: { Accept: "application/json" } },
        );
        if (!res.ok || !isMounted.current) return since;

        const json = (await res.json()) as {
          data: {
            messages?: Array<{ id: number; sender_type: string; text: string; created_at: string }>;
            cursor?: number;
          };
        };
        const rows = json.data?.messages ?? [];
        const nextCursor =
          typeof json.data?.cursor === "number"
            ? Math.max(since, json.data.cursor)
            : rows.length > 0
              ? Math.max(since, ...rows.map((m) => m.id))
              : since;

        if (rows.length > 0 && isMounted.current) {
          const left = rows.some(
            (m) => m.sender_type === "system" && m.text.startsWith(HUMAN_LEFT_COPY),
          );
          const connected = rows.some(
            (m) =>
              m.sender_type === "agent" ||
              (m.sender_type === "system" && m.text.startsWith(HUMAN_TAKEOVER_COPY)),
          );
          if (left) setHumanActive(false);
          else if (connected) setHumanActive(true);

          const newLines: ChatLine[] = rows
            .filter((m) => m.id > since)
            .map((m) => ({
              id: `polled-${m.id}`,
              who: m.sender_type === "agent" ? "agent" : "system",
              text: m.text,
              meta: m.sender_type === "agent" ? "Human Agent Reply" : undefined,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }));

          if (newLines.length > 0) {
            setLines((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const filtered = newLines.filter((n) => !existingIds.has(n.id));
              return filtered.length ? [...prev, ...filtered] : prev;
            });
          }
        }

        if (isMounted.current && nextCursor > since) {
          setCursor(nextCursor);
        }
        return nextCursor;
      } catch {
        return since;
      } finally {
        pollInFlightRef.current = false;
      }
    },
    [],
  );

  // Auto-boot session once widgetSettings arrive (reuse stored web_session when present).
  useEffect(() => {
    if (widgetSettings?.publishable_key && sessionStatus === "idle" && sessionRestored && !conversationId) {
      void bootSession(webSession);
    }
  }, [widgetSettings, sessionStatus, bootSession, webSession, sessionRestored, conversationId]);

  // Key Generation Helper
  const handleGenerateKey = useCallback(async () => {
    if (!hasWebsiteAgent) {
      setSessionError("No website agent configured. Create a website agent to test live chat.");
      setSessionStatus("error");
      return;
    }
    setGeneratingKey(true);
    setSessionError(null);
    try {
      const keyResult = await apiRequest<{ api_key: string }>("/v1/widget/key", { method: "POST" });
      const snap = await apiRequest<WidgetSettings>("/v1/widget/settings");
      setWidgetSettings(snap);

      const activeKey = keyResult?.api_key || snap?.publishable_key;
      if (activeKey) {
        const resSession = await fetch(`${API_URL}/v1/public/widget/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ api_key: activeKey }),
        });
        if (resSession.ok) {
          const json = (await resSession.json()) as {
            data: { conversation_id: string; web_session: string };
          };
          if (isMounted.current) {
            setWebSession(json.data.web_session);
            setConversationId(json.data.conversation_id);
            setSessionStatus("active");
            setCursor(0);
            if (merchantId) {
              saveWidgetSession(merchantId, {
                webSession: json.data.web_session,
                conversationId: json.data.conversation_id,
                pollCursor: 0,
                humanActive: false,
              });
            }
          }
        }
      }
    } catch (err) {
      if (isMounted.current) {
        setSessionError(err instanceof Error ? err.message : "Key generation failed");
        setSessionStatus("error");
      }
    } finally {
      if (isMounted.current) setGeneratingKey(false);
    }
  }, [hasWebsiteAgent, merchantId]);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  // Poll for inbound agent replies (the web lane's delivery half — item 12A).
  useEffect(() => {
    if (!conversationId || sessionStatus !== "active" || simulationMode !== "public") return;

    let cancelled = false;
    const intervalMs = humanActive ? 2000 : POLL_INTERVAL_MS;

    const tick = async () => {
      if (cancelled) return;
      await pollAgentReplies(conversationId, cursorRef.current);
    };

    void tick();
    const interval = setInterval(() => void tick(), intervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId, sessionStatus, simulationMode, humanActive, pollAgentReplies]);

  // Send Message & SSE Stream
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      let activeConvId = conversationIdRef.current || conversationId;

      if (simulationMode === "public" && !activeConvId) {
        const booted = await bootSession(webSessionRef.current || webSession);
        if (booted) {
          activeConvId = booted.conversation_id;
        }
      }

      if (simulationMode === "public" && !activeConvId) {
        setSessionError("Could not connect a public visitor session. Wait for the session to finish connecting, then try again.");
        setBusy(false);
        return;
      }

      const activeMode = simulationMode;

      setBusy(true);
      setSuggestedReplies([]);
      setSessionError(null);

      const userMsgId = `user-${Date.now()}`;
      const aiMsgId = humanActive ? null : `ai-${Date.now()}`;
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setLines((l) => {
        const next: ChatLine[] = [...l, { id: userMsgId, who: "user", text, timestamp: now }];
        if (aiMsgId) next.push({ id: aiMsgId, who: "ai", text: "", timestamp: now });
        return next;
      });

      try {
        let res: Response;
        if (activeMode === "sandbox" && selectedAgentId) {
          const token = await getToken();
          res = await fetch(`${API_URL}/v1/agents/${encodeURIComponent(selectedAgentId)}/sandbox/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ message: text }),
          });
        } else {
          if (!activeConvId) {
            throw new Error("No active conversation session.");
          }
          const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          res = await fetch(
            `${API_URL}/v1/public/widget/sessions/${encodeURIComponent(activeConvId)}/messages`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
              body: JSON.stringify({ text, idempotency_key: idempotencyKey }),
            }
          );
        }

        if (!res.ok || !res.body) {
          setSessionError(`Turn failed (${res.status}).`);
          if (aiMsgId) setLines((l) => l.filter((line) => line.id !== aiMsgId));
          setBusy(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const onEvent = (evt: BrainEvent) => {
          switch (evt.event) {
            case "token":
              if (aiMsgId && evt.data.text) {
                setLines((l) =>
                  l.map((line) => (line.id === aiMsgId ? { ...line, text: line.text + evt.data.text } : line))
                );
              }
              break;
            case "message.completed":
              if (aiMsgId && evt.data.text) {
                setLines((l) =>
                  l.map((line) => (line.id === aiMsgId ? { ...line, text: evt.data.text! } : line))
                );
              }
              break;
            case "paused":
              setHumanActive(true);
              setLines((l) => (aiMsgId ? l.filter((line) => line.id !== aiMsgId) : l));
              break;
            case "suggested_replies":
              if (evt.data.replies) {
                setSuggestedReplies(evt.data.replies.filter((r) => typeof r === "string" && r.trim()));
              }
              break;
            case "handoff_requested":
              // The AI reply already carries the transferring sentence. Do not add a second line.
              break;
            case "refuse": {
              const reason =
                typeof evt.data.reason_code === "string" ? evt.data.reason_code : "";
              // Production widget ignores `refuse` — only `message.completed` is shown. This hint
              // is merchant-preview-only and must not fire for automation blocks (not a KB gap).
              if (reason === "ungrounded_defer") {
                setLines((l) => [
                  ...l,
                  {
                    id: `sys-${Date.now()}`,
                    who: "system",
                    text: "The agent could not find a matching answer in your knowledge base.",
                    timestamp: now,
                  },
                ]);
              }
              break;
            }
            case "capacity":
              if (evt.data.message) {
                setLines((l) =>
                  l.map((line) => (line.id === aiMsgId ? { ...line, text: String(evt.data.message) } : line))
                );
              }
              break;
            case "error":
              setSessionError(evt.data.text || evt.data.reason || "AI runtime error");
              break;
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const block of parts) {
            const linesInBlock = block.split("\n");
            let eventName = "";
            let dataStr = "";

            for (const line of linesInBlock) {
              if (line.startsWith("event:")) eventName = line.slice(6).trim();
              else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
            }

            if (eventName && dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                onEvent({ event: eventName, data: parsed } as BrainEvent);
              } catch {}
            }
          }
        }
      } catch (err) {
        setSessionError(err instanceof Error ? err.message : "Network error during turn.");
        if (aiMsgId) setLines((l) => l.filter((line) => line.id !== aiMsgId));
      } finally {
        setBusy(false);
      }
    },
    [conversationId, simulationMode, selectedAgentId, sessionStatus, bootSession, webSession, humanActive]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    await sendMessage(text);
  };

  const copyText = (text: string, type: "web" | "conv") => {
    void navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const brandColor = widgetSettings?.appearance?.color || DEFAULT_BRAND_COLOR;
  const logoUrl = widgetSettings?.appearance?.logo_url;
  const title = widgetSettings?.appearance?.title;

  return (
    <div
      ref={containerRef}
      className={`fixed z-50 select-none hidden md:block ${
        corner === "bottom-left" ? "left-6 right-auto" : "right-6 left-auto"
      } bottom-6`}
      style={{
        transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) ${
          isDragging ? "scale(1.02)" : "scale(1)"
        }`,
        transition: isSnapping
          ? "transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.15)"
          : isDragging
          ? "none"
          : "transform 0.15s ease",
        touchAction: "none",
      }}
    >
      {/* Minimized Floating Trigger Button */}
      {!isOpen && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`flex flex-col ${
            corner === "bottom-left" ? "items-start" : "items-end"
          } gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300 cursor-grab active:cursor-grabbing`}
          title="Drag to move or click to open"
        >
          <div
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card text-foreground text-xs font-semibold border border-border/60 shadow-2xl hover:bg-muted transition-all pointer-events-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Simulate AI Widget</span>
          </div>

          <button
            type="button"
            className="w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 relative cursor-grab active:cursor-grabbing"
            style={{ backgroundColor: brandColor }}
            title="Open AI Chatbot Simulator"
          >
            <MessageSquare className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-background animate-ping" />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-background" />
          </button>
        </div>
      )}

      {/* Expanded Floating Chatbot Window */}
      {isOpen && (
        <div className="w-[390px] h-[560px] rounded-2xl border border-slate-700 dark:border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col opacity-100 backdrop-blur-none z-50 animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Draggable Header */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="px-4 py-3 flex items-center justify-between text-white shadow-md shrink-0 opacity-100 cursor-grab active:cursor-grabbing"
            style={{ backgroundColor: brandColor }}
            title="Drag header to move chat widget"
          >
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain rounded pointer-events-none" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[11px] pointer-events-none">
                  AI
                </div>
              )}
              <div className="flex flex-col text-left pointer-events-none">
                <span className="font-semibold text-xs leading-tight">
                  {title ? `${title} Assistant` : "Live Support Chat"}
                </span>
                <span className="text-[10px] opacity-90 flex items-center gap-1 font-medium">
                  <span className={`w-1.5 h-1.5 rounded-full ${humanActive ? "bg-amber-300" : "bg-emerald-400"} animate-pulse`} />
                  {humanActive ? "Team member active" : "Online • AI Powered"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowDebug(!showDebug)}
                className={`p-1 rounded-md text-[10px] font-mono px-2 transition-colors ${
                  showDebug ? "bg-white/30 text-white font-bold" : "hover:bg-white/20 text-white/80"
                }`}
                title="Toggle session debugger"
              >
                Debug
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                title="Minimize Widget"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mode & Agent Controls Strip */}
          <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 text-xs shrink-0 font-sans text-slate-200 opacity-100">
            {/* Agent Select */}
            {agents.length > 0 && (
              <div className="flex items-center gap-1.5 truncate">
                <Bot className="w-3.5 h-3.5 text-primary shrink-0" />
                <select
                  value={selectedAgentId || ""}
                  onChange={(e) => handleAgentChange(e.target.value)}
                  disabled={busy}
                  className="bg-slate-900 border border-slate-700 text-slate-100 rounded px-1.5 py-0.5 font-semibold focus:outline-none cursor-pointer text-[11px] truncate max-w-[170px]"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.agent_name || a.slug} ({a.mode.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 text-[10px] font-medium bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-700">
              <button
                type="button"
                onClick={() => setSimulationMode("public")}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  simulationMode === "public" ? "bg-emerald-500/20 text-emerald-400 font-bold" : "text-slate-400"
                }`}
                title="Live DB Public Session"
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setSimulationMode("sandbox")}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  simulationMode === "sandbox" ? "bg-primary/20 text-primary font-bold" : "text-slate-400"
                }`}
                title="Direct Sandbox Stream"
              >
                Sandbox
              </button>
            </div>
          </div>

          {/* Optional Session Debugger Drawer */}
          {showDebug && (
            <div className="p-3 bg-slate-950 border-b border-slate-800 text-[11px] font-mono space-y-2 shrink-0 animate-in slide-in-from-top-2 duration-200 opacity-100">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-primary" />
                  <span>Session Trace</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] uppercase font-bold text-slate-200 border border-slate-800">
                  {sessionStatus}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 p-1.5 rounded bg-slate-900 text-[10px]">
                <span className="truncate text-slate-300">Visitor: {webSession || "None"}</span>
                {webSession && (
                  <button onClick={() => copyText(webSession, "web")} className="text-primary font-semibold">
                    {copied === "web" ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-1.5 rounded bg-slate-900 text-[10px]">
                <span className="truncate text-slate-300">Conv ID: {conversationId || "None"}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {conversationId && (
                    <button onClick={() => copyText(conversationId, "conv")} className="text-primary font-semibold">
                      {copied === "conv" ? "Copied" : "Copy"}
                    </button>
                  )}
                  {merchantId && (
                    <button
                      type="button"
                      onClick={() => {
                        clearWidgetSession(merchantId);
                        conversationIdRef.current = null;
                        webSessionRef.current = null;
                        bootPromiseRef.current = null;
                        setWebSession(null);
                        setConversationId(null);
                        setCursor(0);
                        setHumanActive(false);
                        setLines([]);
                        setSessionStatus("idle");
                      }}
                      className="text-amber-400 font-semibold"
                      title="Start a fresh visitor session (use when testing handoff)"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Transcript Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900 text-xs text-left opacity-100" ref={transcriptRef}>
            {!lines.length && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white mb-2 shadow-md"
                  style={{ backgroundColor: brandColor }}
                >
                  <Bot className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-100 text-xs">How can I help you today?</p>
                <p className="text-[11px] mt-1 text-slate-400">
                  Ask questions, request quotes, or schedule a meeting with our team.
                </p>
              </div>
            )}

            {lines.map((l) => (
              <div
                key={l.id}
                className={`flex items-start gap-2 ${l.who === "user" ? "justify-end" : "justify-start"}`}
              >
                {l.who !== "user" && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 text-[10px] font-bold shadow-xs"
                    style={{
                      backgroundColor:
                        l.who === "system" ? "#64748B" : l.who === "agent" ? "#059669" : brandColor,
                    }}
                  >
                    {l.who === "system" ? "S" : l.who === "agent" ? "H" : "AI"}
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                    l.who === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none font-medium"
                      : l.who === "system"
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium"
                      : l.who === "agent"
                      ? "bg-emerald-500/15 text-emerald-100 border border-emerald-500/30 rounded-tl-none"
                      : "bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{l.text || (busy ? "…" : "")}</p>
                  {l.meta && <span className="block mt-1 text-[10px] opacity-75 font-semibold">{l.meta}</span>}
                  <span className="block mt-1 text-[9px] opacity-60 text-right">{l.timestamp}</span>
                </div>

                {l.who === "user" && (
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 shrink-0 mt-0.5 text-[10px]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Suggested Reply Chips */}
          {suggestedReplies.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-800 bg-slate-950 flex flex-wrap gap-1.5 shrink-0 text-left opacity-100">
              {suggestedReplies.map((reply, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={busy}
                  onClick={() => void sendMessage(reply)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 transition-colors font-medium shadow-2xs"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Session Error Inline Banner */}
          {sessionStatus === "error" && (
            <div className="px-3 py-2 bg-red-500/15 border-b border-red-500/30 text-red-400 text-xs flex items-center justify-between font-medium shrink-0 opacity-100">
              <div className="flex items-center gap-1.5 truncate">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{sessionError || "Session error"}</span>
              </div>
              {!widgetSettings?.publishable_key ? (
                isOwner ? (
                  <button
                    type="button"
                    onClick={() => void handleGenerateKey()}
                    disabled={generatingKey}
                    className="px-2.5 py-1 rounded bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-90 transition-all disabled:opacity-50 shrink-0 shadow-xs"
                  >
                    {generatingKey ? "Generating…" : "Generate Key"}
                  </button>
                ) : (
                  <Link
                    href="/widget"
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-all shrink-0 border border-slate-700"
                  >
                    Widget Settings
                  </Link>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => void bootSession(webSession)}
                  className="underline text-[11px] hover:text-red-300 ml-2 shrink-0 font-semibold"
                >
                  Connect
                </button>
              )}
            </div>
          )}

          {/* Pinned Chat Composer Form */}
          <form onSubmit={(e) => void handleSubmit(e)} className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2 shrink-0 opacity-100">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                sessionStatus === "closed"
                  ? "Conversation closed."
                  : sessionStatus === "connecting"
                  ? "Connecting visitor session…"
                  : "Type a message as a simulated visitor…"
              }
              disabled={busy || sessionStatus === "closed"}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-100 placeholder:text-slate-500 disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={busy || !draft.trim() || sessionStatus === "closed"}
              className="px-3 py-2 text-xs font-semibold h-auto"
            >
              {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
