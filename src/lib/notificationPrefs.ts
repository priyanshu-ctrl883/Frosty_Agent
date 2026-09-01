import type { InboxEvent } from "@/lib/types";

/** Client-only prefs (snooze, throttle) — not synced to server. */
export type ClientNotificationPrefs = {
  soundEnabled: boolean;
  volume: number;
  alertOnNewSession: boolean;
  alertOnHandoff: boolean;
  alertOnEveryMessage: boolean;
  throttleCooldownMs: number;
  snoozedUntil: number | null;
};

/** Server-persisted notification_prefs keys (jsonb on merchant_settings). */
export type ServerNotificationPrefs = {
  email?: boolean;
  hot_lead?: boolean;
  handoff?: boolean;
  quotes?: boolean;
  wa?: boolean;
  billing?: boolean;
  in_app?: boolean;
  in_app_hot_lead?: boolean;
  in_app_handoff?: boolean;
  in_app_quotes?: boolean;
  in_app_wa?: boolean;
  in_app_billing?: boolean;
  browser_notifications?: boolean;
  desktop_toast?: boolean;
  sound_enabled?: boolean;
  sound_volume?: number;
  alert_on_new_session?: boolean;
  alert_on_handoff?: boolean;
  alert_on_every_message?: boolean;
};

export type MergedNotificationPrefs = ClientNotificationPrefs & {
  server: ServerNotificationPrefs;
};

const CLIENT_STORAGE_KEY = "frosty_notification_prefs";

export const DEFAULT_CLIENT_PREFS: ClientNotificationPrefs = {
  soundEnabled: true,
  volume: 60,
  alertOnNewSession: true,
  alertOnHandoff: true,
  alertOnEveryMessage: false,
  throttleCooldownMs: 30000,
  snoozedUntil: null,
};

export const DEFAULT_SERVER_PREFS: ServerNotificationPrefs = {
  email: true,
  hot_lead: true,
  handoff: true,
  quotes: true,
  wa: true,
  billing: true,
  in_app: true,
  in_app_hot_lead: true,
  in_app_handoff: true,
  in_app_quotes: true,
  in_app_wa: true,
  in_app_billing: true,
  browser_notifications: false,
  desktop_toast: true,
  sound_enabled: true,
  sound_volume: 60,
  alert_on_new_session: true,
  alert_on_handoff: true,
  alert_on_every_message: false,
};

export function loadClientPrefs(): ClientNotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_CLIENT_PREFS;
  try {
    const raw = localStorage.getItem(CLIENT_STORAGE_KEY);
    return raw ? { ...DEFAULT_CLIENT_PREFS, ...JSON.parse(raw) } : DEFAULT_CLIENT_PREFS;
  } catch {
    return DEFAULT_CLIENT_PREFS;
  }
}

export function saveClientPrefs(prefs: ClientNotificationPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(prefs));
}

export function parseServerNotificationPrefs(raw: Record<string, unknown> | null | undefined): ServerNotificationPrefs {
  const p = raw || {};
  return {
    email: p.email !== false,
    hot_lead: p.hot_lead !== false,
    handoff: p.handoff !== false,
    quotes: p.quotes !== false,
    wa: p.wa !== false,
    billing: p.billing !== false,
    in_app: p.in_app !== false,
    in_app_hot_lead: p.in_app_hot_lead !== false,
    in_app_handoff: p.in_app_handoff !== false,
    in_app_quotes: p.in_app_quotes !== false,
    in_app_wa: p.in_app_wa !== false,
    in_app_billing: p.in_app_billing !== false,
    browser_notifications: p.browser_notifications === true,
    desktop_toast: p.desktop_toast !== false,
    sound_enabled: p.sound_enabled !== false,
    sound_volume: typeof p.sound_volume === "number" ? p.sound_volume : DEFAULT_SERVER_PREFS.sound_volume,
    alert_on_new_session: p.alert_on_new_session !== false,
    alert_on_handoff: p.alert_on_handoff !== false,
    alert_on_every_message: p.alert_on_every_message === true,
  };
}

/** Merge server sound/in-app prefs into client prefs after a settings load. */
export function mergeServerIntoClient(
  server: ServerNotificationPrefs,
  client: ClientNotificationPrefs,
): ClientNotificationPrefs {
  return {
    ...client,
    soundEnabled: server.sound_enabled !== false,
    volume: server.sound_volume ?? client.volume,
    alertOnNewSession: server.alert_on_new_session !== false,
    alertOnHandoff: server.alert_on_handoff !== false,
    alertOnEveryMessage: server.alert_on_every_message === true,
  };
}

export function buildNotificationPrefsPatch(args: {
  email: boolean;
  prefHotLead: boolean;
  prefHandoff: boolean;
  prefQuotes: boolean;
  prefWa: boolean;
  prefBilling: boolean;
  prefInApp: boolean;
  prefInAppHotLead: boolean;
  prefInAppHandoff: boolean;
  prefInAppQuotes: boolean;
  prefInAppWa: boolean;
  prefInAppBilling: boolean;
  prefBrowserNotifs: boolean;
  prefDesktopToast: boolean;
  prefs: ClientNotificationPrefs;
}): Record<string, unknown> {
  return {
    email: args.email,
    hot_lead: args.prefHotLead,
    handoff: args.prefHandoff,
    quotes: args.prefQuotes,
    wa: args.prefWa,
    billing: args.prefBilling,
    in_app: args.prefInApp,
    in_app_hot_lead: args.prefInAppHotLead,
    in_app_handoff: args.prefInAppHandoff,
    in_app_quotes: args.prefInAppQuotes,
    in_app_wa: args.prefInAppWa,
    in_app_billing: args.prefInAppBilling,
    browser_notifications: args.prefBrowserNotifs,
    desktop_toast: args.prefDesktopToast,
    sound_enabled: args.prefs.soundEnabled,
    sound_volume: args.prefs.volume,
    alert_on_new_session: args.prefs.alertOnNewSession,
    alert_on_handoff: args.prefs.alertOnHandoff,
    alert_on_every_message: args.prefs.alertOnEveryMessage,
  };
}

export function isSnoozed(prefs: ClientNotificationPrefs): boolean {
  return prefs.snoozedUntil !== null && prefs.snoozedUntil > Date.now();
}

let audioCtx: AudioContext | null = null;
let lastChimeAt = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

/** Play a short two-tone chime. `urgent` uses a higher pitch pair. */
export function playNotificationChime(volumePercent: number, variant: "default" | "urgent" = "default"): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const vol = Math.max(0, Math.min(100, volumePercent)) / 100;
  const now = ctx.currentTime;
  const freqs = variant === "urgent" ? [880, 1175] : [660, 880];

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.18);
    gain.gain.setValueAtTime(0, now + i * 0.18);
    gain.gain.linearRampToValueAtTime(vol * 0.22, now + i * 0.18 + 0.04);
    gain.gain.linearRampToValueAtTime(0, now + i * 0.18 + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.18);
    osc.stop(now + i * 0.18 + 0.32);
  });
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function showBrowserNotification(title: string, body: string, href?: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;

  const n = new Notification(title, {
    body,
    icon: "/favicon.ico",
    tag: "frosty-workspace-alert",
  });
  n.onclick = () => {
    window.focus();
    if (href) window.location.href = href;
    n.close();
  };
}

export type InAppToastDetail = {
  title: string;
  body: string;
  href?: string;
  variant?: "default" | "urgent";
};

export function dispatchInAppToast(detail: InAppToastDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("frosty:in-app-toast", { detail }));
}

const HANDOFF_KINDS = new Set(["queued", "released"]);
const MESSAGE_KINDS = new Set(["inbound_message", "human_reply"]);

function shouldThrottle(prefs: ClientNotificationPrefs): boolean {
  const now = Date.now();
  if (now - lastChimeAt < prefs.throttleCooldownMs) return true;
  lastChimeAt = now;
  return false;
}

/** React to a realtime inbox frame — sound, browser notification, in-app toast. */
export function handleInboxEventForNotifications(
  event: InboxEvent,
  client: ClientNotificationPrefs,
  server: ServerNotificationPrefs,
): void {
  if (isSnoozed(client)) return;
  if (server.in_app === false && !client.soundEnabled) return;

  const kind = event.kind;
  if (!kind || kind === "ready" || kind === "pong" || kind === "resumed" || kind === "resync") return;

  let title: string | null = null;
  let body: string | null = null;
  let href: string | null = null;
  let playSound = false;
  let urgent = false;

  if (HANDOFF_KINDS.has(kind)) {
    if (client.alertOnHandoff && server.in_app_handoff !== false) {
      title = "Human handoff requested";
      body = "A visitor needs your team — open the inbox to respond.";
      href = "/inbox";
      playSound = client.soundEnabled;
      urgent = true;
    }
  } else if (MESSAGE_KINDS.has(kind)) {
    if (client.alertOnEveryMessage) {
      title = "New message";
      body = "A customer sent a new message.";
      href = event.conversation_id ? `/inbox?conversation=${event.conversation_id}` : "/inbox";
      playSound = client.soundEnabled;
    }
  } else if (kind === "send_failed" || kind === "delivery_status") {
    if (server.in_app_wa !== false) {
      title = "Message delivery issue";
      body = "A WhatsApp message could not be delivered.";
      href = "/whatsapp";
      playSound = client.soundEnabled;
    }
  }

  if (!title) return;
  if (playSound && !shouldThrottle(client)) {
    playNotificationChime(client.volume, urgent ? "urgent" : "default");
  }

  if (server.desktop_toast !== false && server.in_app !== false) {
    dispatchInAppToast({ title, body: body || "", href: href || undefined, variant: urgent ? "urgent" : "default" });
  }

  if (server.browser_notifications) {
    showBrowserNotification(title, body || "", href || undefined);
  }
}
