import { apiRequest } from "@/lib/api";
import type { Agent, AgentChannel } from "@/lib/types";

/** Primary live channel for a hub (website / whatsapp / both for unified). */
export function hubChannelsForMode(mode: string): ("website" | "whatsapp")[] {
  if (mode === "unified") return ["website", "whatsapp"];
  if (mode === "whatsapp") return ["whatsapp"];
  return ["website"];
}

export function channelEnabled(agent: Agent | null | undefined, channel: string): boolean {
  const rows = agent?.channels;
  if (!rows?.length) return Boolean(agent?.is_active);
  const row = rows.find((c) => c.channel === channel);
  return row?.enabled ?? false;
}

/** Hub "Active" means every primary channel for this mode is enabled. */
export function agentLiveOnHub(agent: Agent | null | undefined): boolean {
  if (!agent) return false;
  return hubChannelsForMode(agent.mode).every((ch) => channelEnabled(agent, ch));
}

/**
 * Pause / resume live traffic without soft-deleting.
 * D210: hubs must NOT PATCH `is_active` — that flag is delete; list/get hide inactive rows
 * so "pause" could never be undone.
 */
export async function setAgentHubLive(agent: Agent, live: boolean): Promise<Agent> {
  const targets = hubChannelsForMode(agent.mode);
  for (const channel of targets) {
    await apiRequest(`/v1/agents/${agent.id}/channels/${channel}`, {
      method: "PATCH",
      body: { enabled: live },
    });
  }
  const refreshedList = await apiRequest<Agent[]>("/v1/agents?include_channels=true");
  return (refreshedList || []).find((a) => a.id === agent.id) || {
    ...agent,
    channels: (agent.channels || []).map((c) =>
      targets.includes(c.channel as "website" | "whatsapp") ? { ...c, enabled: live } : c,
    ),
  };
}

export async function listAgentsWithChannels(mode?: string): Promise<Agent[]> {
  try {
    const list = await apiRequest<Agent[]>("/v1/agents?include_channels=true");
    const rows = Array.isArray(list) ? list : [];
    if (!mode) return rows;
    return rows.filter((a) => a.mode === mode);
  } catch (err) {
    console.warn("listAgentsWithChannels failed:", err);
    return [];
  }
}

export type { AgentChannel };
