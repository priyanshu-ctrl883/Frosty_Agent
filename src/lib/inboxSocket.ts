"use client";

import { API_URL } from "@/lib/constants";
import { getToken } from "@/lib/session";
import type { InboxEvent } from "@/lib/types";

/**
 * The inbox WebSocket, `GET /v1/inbox/ws`.
 *
 * ⚠️ THE TOKEN RIDES IN THE SUBPROTOCOL, NOT A HEADER, and that is not a style choice: the browser
 * WebSocket API cannot set request headers at all. The server reads
 * `Sec-WebSocket-Protocol: bearer, <token>` and accepts with `subprotocol="bearer"` — so the second
 * protocol entry IS the credential, and `new WebSocket(url, ["bearer", token])` is the only shape
 * that authenticates.
 *
 * ⚠️ THE SERVER RE-AUTHORISES EVERY 45 SECONDS AND CLOSES 4401 WHEN THE ANSWER CHANGES. A member
 * removed from the team, or a merchant suspended for non-payment, must lose a live socket rather
 * than keep streaming customer conversations.
 *
 * It does NOT close on client silence — an earlier version of this comment said it did, and said the
 * ping below "is how the socket stays authorised". Both were wrong: `ws.py` re-authorises itself on
 * its own timer and simply continues when the read times out. The ping is an ordinary keepalive for
 * proxies, and nothing breaks if it is late.
 *
 * Close codes worth telling apart:
 *   * **4401** — was authorised and no longer is. Terminal: retrying cannot change the answer.
 *   * **4403** — the intent is "refused at the handshake", but ⚠️ A BROWSER NEVER SEES IT. `ws.py`
 *     closes BEFORE `accept()`, so Starlette answers the handshake with HTTP 403 and the browser
 *     reports `onclose` with **1006** — an application close code is not delivered over a handshake
 *     that never completed. The branch is kept because a non-browser client does observe it, but it
 *     cannot be relied on, which is why the attempt cap below exists.
 *   * anything else — transport. Reconnect with backoff, and RESUME from the last event id, because
 *     `inbox_events` is durable and the gap is replayable.
 *
 * ⚠️ AND THE RETRIES ARE CAPPED. Without a cap, an unauthorised caller reconnects forever behind
 * "Reconnecting…" instead of being told they cannot use the screen — the 4403 branch cannot catch
 * them, per above. The screen itself already gates on `inbox:read` and `human_handoff`, so this is
 * the second line rather than the first, but "retry until the tab is closed" is not a resting state
 * for any cause: a server that is genuinely down produces the same silent loop.
 */
export type InboxSocketHandlers = {
  onEvent: (event: InboxEvent) => void;
  onStatus: (status: "connecting" | "live" | "closed", detail?: string) => void;
};

const PING_MS = 20_000; // the server re-authorises at 45s; stay well inside it
const MAX_BACKOFF_MS = 30_000;
/** Consecutive failures with no successful open before we stop and say so. ~60s of retrying. */
const MAX_ATTEMPTS = 8;

export function openInboxSocket(handlers: InboxSocketHandlers): () => void {
  let socket: WebSocket | null = null;
  let pingTimer: number | null = null;
  let retryTimer: number | null = null;
  let attempt = 0;
  let lastEventId: number | null = null;
  let stopped = false;

  function clearTimers() {
    if (pingTimer !== null) window.clearInterval(pingTimer);
    if (retryTimer !== null) window.clearTimeout(retryTimer);
    pingTimer = null;
    retryTimer = null;
  }

  async function connect() {
    if (stopped) return;
    handlers.onStatus("connecting");
    const token = await getToken();
    if (!token || stopped) {
      handlers.onStatus("closed", "Not signed in.");
      return;
    }
    // http(s) -> ws(s). `API_URL` is an origin, so this is a scheme swap and nothing more.
    const url = `${API_URL.replace(/^http/, "ws")}/v1/inbox/ws`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url, ["bearer", token]);
    } catch {
      handlers.onStatus("closed", "Could not open the live connection.");
      return;
    }
    socket = ws;

    ws.onopen = () => {
      attempt = 0;
      pingTimer = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
      }, PING_MS);
      // Ask for anything missed while disconnected. Durable rows, so the gap is real history rather
      // than a best-effort replay.
      if (lastEventId !== null) {
        ws.send(JSON.stringify({ type: "resume", last_event_id: lastEventId }));
      }
    };

    ws.onmessage = (msg) => {
      let frame: InboxEvent;
      try {
        frame = JSON.parse(String(msg.data)) as InboxEvent;
      } catch {
        return; // one unreadable frame is not the whole socket
      }
      if (typeof frame.id === "number") lastEventId = frame.id;
      if (frame.kind === "ready") handlers.onStatus("live");
      handlers.onEvent(frame);
    };

    ws.onclose = (e) => {
      clearTimers();
      socket = null;
      if (stopped) return;
      if (e.code === 4403 || e.code === 4401) {
        handlers.onStatus(
          "closed",
          e.code === 4403
            ? "The live inbox is not available to you — your role or your plan does not include it."
            : "Your access changed and the live connection was closed. Reload to try again.",
        );
        return; // terminal: retrying cannot fix an authorisation answer
      }
      attempt += 1;
      if (attempt >= MAX_ATTEMPTS) {
        handlers.onStatus(
          "closed",
          "The live connection could not be established. This is usually a permissions or plan "
            + "issue, or the service being unavailable — reload to try again.",
        );
        return;
      }
      handlers.onStatus("closed", "Reconnecting…");
      const delay = Math.min(MAX_BACKOFF_MS, 500 * 2 ** Math.min(attempt, 6));
      retryTimer = window.setTimeout(() => void connect(), delay);
    };
  }

  void connect();

  return () => {
    stopped = true;
    clearTimers();
    socket?.close();
    socket = null;
  };
}
