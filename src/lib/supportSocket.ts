"use client";

/**
 * Support WebSocket client (Prompt 8 — live presence & session lifecycle).
 *
 * Endpoint: `/v1/support/ws`
 * Subprotocol: `["bearer", token]`
 *
 * Connects when the dashboard loads (both for normal merchants and for impersonating admins).
 * Receives presence events:
 *   - support_session_started
 *   - support_session_ended
 *   - support_heartbeat
 *   - support_activity
 */

import { getToken } from "@/lib/session";
import { loadImpersonation } from "@/lib/impersonation";

export type SupportAccessRequestedEvent = {
  type: "support_access_requested";
  session_id: string;
  merchant_id: string;
  admin: {
    id: string;
    name: string | null;
    email?: string | null;
  };
  reason: string | null;
  ticket_id: string | null;
  requested_ttl_minutes: number;
  requested_at: string | null;
  request_expires_at: string | null;
  snapshot?: boolean;
};

export type SupportAccessApprovedEvent = {
  type: "support_access_approved";
  session_id: string;
  merchant_id: string;
  admin_id: string;
  expires_at: string;
};

export type SupportAccessDeniedEvent = {
  type: "support_access_denied";
  session_id: string;
  merchant_id: string;
  reason?: string | null;
};

export type SupportSessionStartedEvent = {
  type: "support_session_started";
  session_id: string;
  admin_name: string | null;
  reason: string | null;
  ticket_id: string | null;
  started_at: string;
  expires_at: string;
  snapshot?: boolean;
};

export type SupportSessionEndedEvent = {
  type: "support_session_ended";
  session_id: string;
  ended_at: string;
  reason?: string | null;
};

export type SupportActivityEvent = {
  type: "support_activity";
  session_id: string;
  admin_name: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  label: string | null;
  path: string | null;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
};

export type SupportHeartbeatEvent = {
  type: "support_heartbeat";
  timestamp: string;
  active: boolean;
};

export type SupportReadyEvent = {
  type: "support_ready";
  channel: string;
  merchant_id?: string;
  active_session?: boolean;
};

export type SupportCoBrowseEvent = {
  type: "co_browse";
  event: "cursor" | "scroll" | "navigate" | "input" | "focus" | "click" | "state_snapshot" | "driving_change" | string;
  session_id: string;
  sender_id: string;
  sender_role: "admin" | "merchant";
  sender_name?: string | null;
  payload: Record<string, any>;
  timestamp?: string;
};

export type SupportWsFrame =
  | SupportAccessRequestedEvent
  | SupportAccessApprovedEvent
  | SupportAccessDeniedEvent
  | SupportSessionStartedEvent
  | SupportSessionEndedEvent
  | SupportActivityEvent
  | SupportHeartbeatEvent
  | SupportReadyEvent
  | SupportCoBrowseEvent
  | { type: "pong" };

export type SupportSocketHandlers = {
  onEvent: (event: SupportWsFrame) => void;
  onStatus?: (status: "connecting" | "live" | "closed", detail?: string) => void;
};

const PING_INTERVAL_MS = 20_000;
const MAX_BACKOFF_MS = 30_000;
const MAX_ATTEMPTS = 10;

let _activeSocket: WebSocket | null = null;

export function sendSupportFrame(frame: Record<string, unknown>): boolean {
  if (_activeSocket && _activeSocket.readyState === WebSocket.OPEN) {
    try {
      _activeSocket.send(JSON.stringify(frame));
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

function getSupportWsUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${base.replace(/^http/, "ws")}/v1/support/ws`;
}

export function openSupportSocket(handlers: SupportSocketHandlers): () => void {
  let socket: WebSocket | null = null;
  let pingTimer: number | null = null;
  let retryTimer: number | null = null;
  let attempt = 0;
  let stopped = false;

  function clearTimers() {
    if (pingTimer !== null) window.clearInterval(pingTimer);
    if (retryTimer !== null) window.clearTimeout(retryTimer);
    pingTimer = null;
    retryTimer = null;
  }

  async function connect() {
    if (stopped) return;
    handlers.onStatus?.("connecting");

    // Token resolution: impersonation token takes priority if active, else normal merchant JWT
    const imp = loadImpersonation();
    const token = imp?.token ?? (await getToken());

    if (!token || stopped) {
      handlers.onStatus?.("closed", "Not signed in.");
      // If not signed in, retry after a delay (in case auth is hydrating)
      retryTimer = window.setTimeout(() => void connect(), 3000);
      return;
    }

    const url = getSupportWsUrl();
    let ws: WebSocket;
    try {
      ws = new WebSocket(url, ["bearer", token]);
    } catch {
      handlers.onStatus?.("closed", "Could not open support connection.");
      return;
    }
    socket = ws;

    ws.onopen = () => {
      attempt = 0;
      _activeSocket = ws;
      handlers.onStatus?.("live");
      pingTimer = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (msg) => {
      let frame: SupportWsFrame;
      try {
        frame = JSON.parse(String(msg.data)) as SupportWsFrame;
      } catch {
        return;
      }
      handlers.onEvent(frame);
    };

    ws.onclose = (e) => {
      clearTimers();
      if (_activeSocket === ws) _activeSocket = null;
      socket = null;
      if (stopped) return;

      if (e.code === 4403 || e.code === 4401) {
        handlers.onStatus?.("closed", "Support connection closed by server.");
        attempt += 1;
        if (attempt < MAX_ATTEMPTS) {
          const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.min(attempt, 4));
          retryTimer = window.setTimeout(() => void connect(), delay);
        }
        return;
      }

      attempt += 1;
      if (attempt >= MAX_ATTEMPTS) {
        handlers.onStatus?.("closed", "Unable to establish live support stream.");
        return;
      }

      handlers.onStatus?.("closed", "Reconnecting…");
      const delay = Math.min(MAX_BACKOFF_MS, 500 * 2 ** Math.min(attempt, 5));
      retryTimer = window.setTimeout(() => void connect(), delay);
    };
  }

  void connect();

  return () => {
    stopped = true;
    clearTimers();
    if (_activeSocket === socket) _activeSocket = null;
    socket?.close();
    socket = null;
  };
}
