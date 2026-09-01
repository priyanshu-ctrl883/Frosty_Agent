/** Persist merchant Sandbox UI state across dashboard navigation (same browser tab), isolated per agent. */

export type SandboxLine = { who: "user" | "ai" | "system"; text: string; meta?: string };

export type SandboxSessionSnapshot = {
  agentId: string;
  conversationId: string | null;
  lines: SandboxLine[];
  replies: string[];
};

const VERSION = "v1";

function storageKey(merchantId: string, agentId?: string): string {
  return agentId
    ? `frosty:sandbox:${VERSION}:${merchantId}:${agentId}`
    : `frosty:sandbox:${VERSION}:${merchantId}`;
}

export function loadSandboxSession(merchantId: string, agentId?: string): SandboxSessionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(merchantId, agentId)) || (agentId ? sessionStorage.getItem(storageKey(merchantId)) : null);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SandboxSessionSnapshot;
    if (!parsed || typeof parsed.agentId !== "string") return null;
    if (agentId && parsed.agentId !== agentId) return null;
    return {
      agentId: parsed.agentId,
      conversationId: typeof parsed.conversationId === "string" ? parsed.conversationId : null,
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
      replies: Array.isArray(parsed.replies) ? parsed.replies : [],
    };
  } catch {
    return null;
  }
}

export function saveSandboxSession(merchantId: string, snapshot: SandboxSessionSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(merchantId, snapshot.agentId), JSON.stringify(snapshot));
  } catch {
    /* quota or private mode — in-memory state still works for this visit */
  }
}

export function clearSandboxSession(merchantId: string, agentId?: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(storageKey(merchantId, agentId));
  if (!agentId) {
    sessionStorage.removeItem(storageKey(merchantId));
  }
}
