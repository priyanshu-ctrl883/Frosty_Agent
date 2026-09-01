"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { sendSupportFrame, type SupportCoBrowseEvent } from "@/lib/supportSocket";
import type {
  DrivingMode,
  RemoteCursorState,
  RemoteClickState,
  RemoteFocusState,
  CoBrowseContextState,
} from "./types";

interface UseCoBrowseOptions {
  sessionId: string | null;
  isImpersonating: boolean;
  adminName: string | null;
  active: boolean;
}

function isSensitiveField(el: Element): boolean {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
    return false;
  }
  if (el instanceof HTMLInputElement && el.type === "password") return true;

  const auto = (el.getAttribute("autocomplete") || "").toLowerCase();
  if (auto.includes("cc-") || auto.includes("password")) return true;

  const identifier = `${el.name || ""} ${el.id || ""} ${el.getAttribute("placeholder") || ""}`.toLowerCase();
  return /(password|secret|token|apikey|api_key|card|cvv|cvc|ssn|auth)/i.test(identifier);
}

function getFieldSelector(el: HTMLElement): string | null {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const name = el.getAttribute("name");
  if (name) return `[name="${CSS.escape(name)}"]`;
  const cobrowseId = el.getAttribute("data-cobrowse-id");
  if (cobrowseId) return `[data-cobrowse-id="${CSS.escape(cobrowseId)}"]`;
  return null;
}

export function useCoBrowse({
  sessionId,
  isImpersonating,
  adminName,
  active,
}: UseCoBrowseOptions): CoBrowseContextState & {
  handleInboundCoBrowse: (frame: SupportCoBrowseEvent) => void;
} {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [drivingMode, setDrivingModeState] = useState<DrivingMode>("both");
  const [remoteCursor, setRemoteCursor] = useState<RemoteCursorState | null>(null);
  const [remoteClicks, setRemoteClicks] = useState<RemoteClickState[]>([]);
  const [remoteFocus, setRemoteFocus] = useState<RemoteFocusState | null>(null);

  const localRole: "admin" | "merchant" = isImpersonating ? "admin" : "merchant";
  const isDriver = drivingMode === "both" || drivingMode === localRole;

  // Stable client ID per tab session
  const clientIdRef = useRef<string>("");
  if (!clientIdRef.current) {
    clientIdRef.current = `client-${Math.random().toString(36).slice(2, 11)}`;
  }

  const fullPath = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

  // Keep latest mutable values in refs to avoid recreating callbacks
  const activeRef = useRef(active);
  activeRef.current = active;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const isImpersonatingRef = useRef(isImpersonating);
  isImpersonatingRef.current = isImpersonating;
  const adminNameRef = useRef(adminName);
  adminNameRef.current = adminName;
  const localRoleRef = useRef(localRole);
  localRoleRef.current = localRole;
  const drivingModeRef = useRef(drivingMode);
  drivingModeRef.current = drivingMode;
  const fullPathRef = useRef(fullPath);
  fullPathRef.current = fullPath;
  const routerRef = useRef(router);
  routerRef.current = router;

  // Echo and loop suppression flags
  const isApplyingRemoteScrollRef = useRef(false);
  const isApplyingRemoteInputRef = useRef(false);
  const lastNavigatedPathRef = useRef("");
  const lastNavTimeRef = useRef(0);
  const cursorRafRef = useRef<number | null>(null);
  const lastCursorSentRef = useRef({ x: -1, y: -1, time: 0 });
  const cursorHideTimerRef = useRef<number | null>(null);

  // ── Outbound Frame Dispatcher (100% stable reference) ──────────────────────
  const broadcastCoBrowse = useCallback(
    (event: string, payload: Record<string, unknown>) => {
      if (!activeRef.current || !sessionIdRef.current) return;
      sendSupportFrame({
        type: "co_browse",
        event,
        session_id: sessionIdRef.current,
        sender_id: clientIdRef.current,
        sender_role: localRoleRef.current,
        sender_name: isImpersonatingRef.current ? adminNameRef.current || "Frostrek Support" : "Merchant Owner",
        payload,
      });
    },
    []
  );

  const setDrivingMode = useCallback(
    (mode: DrivingMode) => {
      setDrivingModeState(mode);
      broadcastCoBrowse("driving_change", { driving: mode });
    },
    [broadcastCoBrowse]
  );

  // ── Inbound Frame Handler (100% stable reference) ─────────────────────────
  const handleInboundCoBrowse = useCallback(
    (frame: SupportCoBrowseEvent) => {
      if (!activeRef.current) return;
      if (frame.sender_id === clientIdRef.current) return; // Drop own echoes

      const { event, payload, sender_role, sender_name } = frame;

      switch (event) {
        case "cursor": {
          const { xRatio, yRatio, visible } = payload;
          setRemoteCursor({
            xRatio,
            yRatio,
            visible: visible !== false,
            role: sender_role,
            name: sender_name,
            lastUpdated: Date.now(),
          });

          // Auto-hide cursor after 5s of no movements
          if (cursorHideTimerRef.current) window.clearTimeout(cursorHideTimerRef.current);
          cursorHideTimerRef.current = window.setTimeout(() => {
            setRemoteCursor((prev) => (prev ? { ...prev, visible: false } : null));
          }, 5000);
          break;
        }

        case "click": {
          const { xRatio, yRatio } = payload;
          const clickId = `${Date.now()}-${Math.random()}`;
          setRemoteClicks((prev) => [
            ...prev.slice(-4),
            { id: clickId, xRatio, yRatio, role: sender_role, timestamp: Date.now() },
          ]);
          setTimeout(() => {
            setRemoteClicks((prev) => prev.filter((c) => c.id !== clickId));
          }, 800);
          break;
        }

        case "scroll": {
          if (isApplyingRemoteScrollRef.current) return;
          const { scrollYRatio } = payload;
          isApplyingRemoteScrollRef.current = true;

          // Scroll active inner overflow-y-auto containers in the dashboard
          const containers = Array.from(
            document.querySelectorAll(".overflow-y-auto, [data-lenis-prevent], main, #main-content")
          ) as HTMLElement[];

          let scrolledAny = false;
          for (const el of containers) {
            if (el.scrollHeight > el.clientHeight + 5) {
              const max = el.scrollHeight - el.clientHeight;
              el.scrollTo({ top: scrollYRatio * max, behavior: "smooth" });
              scrolledAny = true;
            }
          }

          // Fallback to window/document scroll
          const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
          window.scrollTo({ top: scrollYRatio * maxScroll, behavior: "smooth" });

          setTimeout(() => {
            isApplyingRemoteScrollRef.current = false;
          }, 350);
          break;
        }

        case "navigate": {
          const { path } = payload;
          if (!path || path === fullPathRef.current) return;

          // Check if local user is actively typing in a form
          const activeEl = document.activeElement;
          const isTyping = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;
          if (isTyping && drivingModeRef.current !== "both" && drivingModeRef.current !== "admin" && localRoleRef.current === "admin") {
            return;
          }

          lastNavigatedPathRef.current = path;
          lastNavTimeRef.current = Date.now();
          routerRef.current.push(path);
          break;
        }

        case "input": {
          const { selector, value } = payload;
          if (!selector) return;
          try {
            const el = document.querySelector(selector);
            if (
              el &&
              (el instanceof HTMLInputElement ||
                el instanceof HTMLTextAreaElement ||
                el instanceof HTMLSelectElement)
            ) {
              if (document.activeElement === el) return; // Do not overwrite actively focused element
              isApplyingRemoteInputRef.current = true;
              el.value = value;
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
              setTimeout(() => {
                isApplyingRemoteInputRef.current = false;
              }, 100);
            }
          } catch {
            // Invalid selector ignore
          }
          break;
        }

        case "focus": {
          const { selector, label } = payload;
          setRemoteFocus(selector ? { selector, label, role: sender_role } : null);
          break;
        }

        case "driving_change": {
          if (payload.driving) {
            setDrivingModeState(payload.driving);
          }
          break;
        }

        case "state_snapshot": {
          if (payload.driving) {
            setDrivingModeState(payload.driving);
          }
          if (payload.path && payload.path !== fullPathRef.current) {
            lastNavigatedPathRef.current = payload.path;
            routerRef.current.push(payload.path);
          }
          break;
        }
      }
    },
    []
  );

  // ── Outbound: Pointer Movement Tracker (30-45 FPS throttled) ─────────────
  useEffect(() => {
    if (!active) return;

    function onPointerMove(e: MouseEvent) {
      const xRatio = e.clientX / window.innerWidth;
      const yRatio = e.clientY / window.innerHeight;

      const now = Date.now();
      const dx = Math.abs(xRatio - lastCursorSentRef.current.x);
      const dy = Math.abs(yRatio - lastCursorSentRef.current.y);

      // Only dispatch if moved enough or after 22ms
      if ((dx > 0.004 || dy > 0.004) && now - lastCursorSentRef.current.time > 22) {
        lastCursorSentRef.current = { x: xRatio, y: yRatio, time: now };
        if (cursorRafRef.current) cancelAnimationFrame(cursorRafRef.current);
        cursorRafRef.current = requestAnimationFrame(() => {
          broadcastCoBrowse("cursor", { xRatio, yRatio, visible: true });
        });
      }
    }

    function onPointerLeave() {
      broadcastCoBrowse("cursor", { xRatio: 0, yRatio: 0, visible: false });
    }

    function onClick(e: MouseEvent) {
      const xRatio = e.clientX / window.innerWidth;
      const yRatio = e.clientY / window.innerHeight;
      broadcastCoBrowse("click", { xRatio, yRatio });
    }

    window.addEventListener("mousemove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave, { passive: true });
    window.addEventListener("click", onClick, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
      window.removeEventListener("click", onClick);
      if (cursorRafRef.current) cancelAnimationFrame(cursorRafRef.current);
    };
  }, [active, broadcastCoBrowse]);

  // ── Outbound: Scroll Synchronization ─────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    let scrollTimer: number | null = null;

    function onScroll(e: Event) {
      if (isApplyingRemoteScrollRef.current) return;
      if (scrollTimer !== null) window.clearTimeout(scrollTimer);

      scrollTimer = window.setTimeout(() => {
        const target = (e.target === document ? (document.scrollingElement || document.documentElement) : e.target) as HTMLElement | null;
        if (!target) return;

        let scrollYRatio = 0;
        let scrollYPx = 0;

        if (target.scrollHeight > target.clientHeight) {
          const maxScroll = Math.max(1, target.scrollHeight - target.clientHeight);
          scrollYPx = target.scrollTop;
          scrollYRatio = target.scrollTop / maxScroll;
        } else {
          const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
          scrollYPx = window.scrollY;
          scrollYRatio = window.scrollY / maxScroll;
        }

        broadcastCoBrowse("scroll", {
          scrollYRatio,
          scrollYPx,
        });
      }, 25);
    }

    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("scroll", onScroll);
      if (scrollTimer !== null) window.clearTimeout(scrollTimer);
    };
  }, [active, broadcastCoBrowse]);

  // ── Outbound: Navigation Sync ────────────────────────────────────────────
  useEffect(() => {
    if (!active || !isDriver) return;
    if (!fullPath || fullPath === lastNavigatedPathRef.current) return;

    lastNavTimeRef.current = Date.now();
    lastNavigatedPathRef.current = fullPath;

    broadcastCoBrowse("navigate", { path: fullPath });
  }, [active, isDriver, fullPath, broadcastCoBrowse]);

  // ── Outbound: Form Input & Focus Sync ────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    function onInputOrChange(e: Event) {
      if (isApplyingRemoteInputRef.current) return;
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (isSensitiveField(target)) return;

      const selector = getFieldSelector(target);
      if (!selector) return;

      const value = (target as HTMLInputElement).value ?? "";
      broadcastCoBrowse("input", { selector, value });
    }

    function onFocusIn(e: FocusEvent) {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (isSensitiveField(target)) return;

      const selector = getFieldSelector(target);
      const label = target.getAttribute("aria-label") || target.getAttribute("placeholder") || target.tagName.toLowerCase();
      broadcastCoBrowse("focus", { selector, label });
    }

    function onFocusOut() {
      broadcastCoBrowse("focus", { selector: null });
    }

    document.addEventListener("change", onInputOrChange, { capture: true, passive: true });
    document.addEventListener("focusin", onFocusIn, { capture: true, passive: true });
    document.addEventListener("focusout", onFocusOut, { capture: true, passive: true });

    return () => {
      document.removeEventListener("change", onInputOrChange, { capture: true });
      document.removeEventListener("focusin", onFocusIn, { capture: true });
      document.removeEventListener("focusout", onFocusOut, { capture: true });
    };
  }, [active, broadcastCoBrowse]);

  // ── Initial State Snapshot: broadcast ONCE when active session becomes true
  useEffect(() => {
    if (!active) return;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollYRatio = window.scrollY / maxScroll;

    broadcastCoBrowse("state_snapshot", {
      path: fullPathRef.current,
      scrollYRatio,
      driving: drivingModeRef.current,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // ── Clean Teardown on Session End ────────────────────────────────────────
  useEffect(() => {
    if (!active) {
      setRemoteCursor(null);
      setRemoteClicks([]);
      setRemoteFocus(null);
      if (cursorHideTimerRef.current) window.clearTimeout(cursorHideTimerRef.current);
    }
  }, [active]);

  return {
    isActive: active,
    drivingMode,
    isDriver,
    remoteCursor,
    remoteClicks,
    remoteFocus,
    setDrivingMode,
    handleInboundCoBrowse,
  };
}
