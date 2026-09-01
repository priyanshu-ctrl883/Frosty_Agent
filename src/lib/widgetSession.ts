/** Persist public-widget simulator session in first-party storage (matches production embed). */

export type WidgetSessionSnapshot = {
  webSession: string;
  conversationId: string;
  pollCursor: number;
  humanActive?: boolean;
};

const VERSION = "v1";

function storageKey(merchantId: string): string {
  return `frosty:widget:${VERSION}:${merchantId}`;
}

export function loadWidgetSession(merchantId: string): WidgetSessionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(merchantId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WidgetSessionSnapshot;
    if (!parsed?.webSession || !parsed?.conversationId) return null;
    return {
      webSession: parsed.webSession,
      conversationId: parsed.conversationId,
      pollCursor: typeof parsed.pollCursor === "number" ? parsed.pollCursor : 0,
      humanActive: Boolean(parsed.humanActive),
    };
  } catch {
    return null;
  }
}

export function saveWidgetSession(merchantId: string, snapshot: WidgetSessionSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(merchantId), JSON.stringify(snapshot));
  } catch {
    /* quota — in-memory session still works for this visit */
  }
}

export function clearWidgetSession(merchantId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(merchantId));
}
