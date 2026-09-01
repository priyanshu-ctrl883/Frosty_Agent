"use client";

import { openInboxSocket, type InboxSocketHandlers } from "@/lib/inboxSocket";
import type { InboxEvent } from "@/lib/types";

type Status = "connecting" | "live" | "closed";
type StatusHandler = (status: Status, detail?: string) => void;
type EventHandler = (event: InboxEvent) => void;

/** One WebSocket for the whole dashboard — inbox queue, bell badge, and alerts share it. */
let refCount = 0;
let closeSocket: (() => void) | null = null;
let lastStatus: Status = "connecting";
let lastStatusDetail: string | undefined;
const statusHandlers = new Set<StatusHandler>();
const eventHandlers = new Set<EventHandler>();

function ensureSocket() {
  if (closeSocket) return;
  const bridge: InboxSocketHandlers = {
    onStatus: (status, detail) => {
      lastStatus = status;
      lastStatusDetail = detail;
      statusHandlers.forEach((h) => h(status, detail));
    },
    onEvent: (event) => {
      eventHandlers.forEach((h) => h(event));
    },
  };
  closeSocket = openInboxSocket(bridge);
}

function maybeCloseSocket() {
  if (refCount === 0 && closeSocket) {
    closeSocket();
    closeSocket = null;
    lastStatus = "connecting";
    lastStatusDetail = undefined;
  }
}

/** Subscribe to inbox realtime frames. Returns an unsubscribe function. */
export function subscribeInboxRealtime(handlers: {
  onEvent?: EventHandler;
  onStatus?: StatusHandler;
}): () => void {
  refCount += 1;
  ensureSocket();

  if (handlers.onStatus) {
    statusHandlers.add(handlers.onStatus);
    handlers.onStatus(lastStatus, lastStatusDetail);
  }
  if (handlers.onEvent) eventHandlers.add(handlers.onEvent);

  return () => {
    refCount = Math.max(0, refCount - 1);
    if (handlers.onStatus) statusHandlers.delete(handlers.onStatus);
    if (handlers.onEvent) eventHandlers.delete(handlers.onEvent);
    maybeCloseSocket();
  };
}

const IGNORED: ReadonlySet<string> = new Set(["ready", "pong", "resumed"]);

/** True for frames that mean queue, alerts, or a thread changed — refetch lists. */
export function isInboxChangeEvent(event: InboxEvent): boolean {
  return !IGNORED.has(event.kind);
}
