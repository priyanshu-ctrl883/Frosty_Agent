"use client";

import { apiRequest } from "@/lib/api";
import type { Agent, AgentChannel, KbSource, Team, WaAccount, WidgetSettings } from "@/lib/types";

/**
 * The go-live checklist, DERIVED from the API rather than stored.
 *
 * Steps are derived from what they produce (not a service_onboarding table):
 *   * agent exists              -> GET /v1/agents
 *   * knowledge ready (optional)-> GET /v1/kb/sources
 *   * agent version published   -> agents[].current_version_id (D194)
 *   * channel enabled           -> GET /v1/agents/{id}/channels
 *   * sandbox confirmed         -> localStorage (D193)
 *   * WhatsApp connected (opt)  -> GET /v1/wa/accounts (D199)
 *   * team invite (opt)         -> GET /v1/team (D199)
 * Domain ownership lives under Settings → Domain (D200), not the hub checklist.
 */
export type DomainVerificationStatus = {
  domain: string | null;
  token: string | null;
  verified_at: string | null;
  verified: boolean;
  meta_tag: string | null;
  dns_txt: string | null;
  blocks_embed: boolean;
  instructions?: {
    meta: string | null;
    dns: string | null;
  };
};

export type OnboardingStepStatus = "pending" | "completed" | "skipped";

export type OnboardingStep = {
  key: string;
  order: number;
  title: string;
  description: string;
  deep_link: string;
  is_prominent: boolean;
  is_skippable: boolean;
  status: OnboardingStepStatus;
  completed_at: string | null;
  skipped_at: string | null;
  is_auto_detected: boolean;
};

export type OnboardingChecklist = {
  steps: OnboardingStep[];
  total_steps: number;
  completed_steps: number;
  skipped_steps: number;
  pending_steps: number;
  percent_completed: number;
  is_all_completed: boolean;
  next_step_key: string | null;
};

export async function fetchOnboardingChecklist(): Promise<OnboardingChecklist> {
  return apiRequest<OnboardingChecklist>("/v1/onboarding/steps");
}

export async function completeOnboardingStep(stepKey: string): Promise<OnboardingChecklist> {
  return apiRequest<OnboardingChecklist>(`/v1/onboarding/steps/${stepKey}/complete`, {
    method: "PATCH",
  });
}

export async function skipOnboardingStep(stepKey: string): Promise<OnboardingChecklist> {
  return apiRequest<OnboardingChecklist>(`/v1/onboarding/steps/${stepKey}/skip`, {
    method: "PATCH",
  });
}

export async function resetOnboardingStep(stepKey: string): Promise<OnboardingChecklist> {
  return apiRequest<OnboardingChecklist>(`/v1/onboarding/steps/${stepKey}/reset`, {
    method: "PATCH",
  });
}


export type OnboardingStatus = {
  hasAgent: boolean;
  hasKnowledge: boolean;
  /** True when the preferred website/unified agent has a published version (current_version_id). */
  hasPublished: boolean;
  /**
   * @deprecated Alias of hasPublished — kept so older call sites compile during the rename.
   */
  hasWidget: boolean;
  hasChannel: boolean;
  /**
   * True after the merchant explicitly confirms a sandbox preview ("Looks good") for this agent.
   * Persisted in localStorage (keyed by agent id) — not automatic on any model reply.
   */
  hasTested: boolean;
  /** At least one connected WhatsApp Business number. */
  hasWhatsApp: boolean;
  /** More than one active member, or any pending invite. */
  hasTeamInvite: boolean;
  /** Website path complete — optionals (WA / team) are not required. */
  allDone: boolean;
  agentId: string | null;
};

export function sandboxTestedStorageKey(agentId: string): string {
  return `frosty.onboarding.sandbox_tested.${agentId}`;
}

export function markSandboxTested(agentId: string): void {
  if (typeof window === "undefined" || !agentId) return;
  try {
    localStorage.setItem(sandboxTestedStorageKey(agentId), "1");
  } catch {
    // private mode / quota — checklist simply won't persist across reloads
  }
}

export function readSandboxTested(agentId: string | null | undefined): boolean {
  if (typeof window === "undefined" || !agentId) return false;
  try {
    return localStorage.getItem(sandboxTestedStorageKey(agentId)) === "1";
  } catch {
    return false;
  }
}

async function quiet<T>(path: string): Promise<T | null> {
  try {
    return await apiRequest<T>(path);
  } catch {
    return null;
  }
}

export async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  const agentsPromise = quiet<Agent[]>("/v1/agents");
  const sourcesPromise = quiet<KbSource[]>("/v1/kb/sources");
  // Still fetched so callers/UI can use widget settings elsewhere; not used for Publish Done.
  const widgetPromise = quiet<WidgetSettings>("/v1/widget/settings");
  const waPromise = quiet<WaAccount[]>("/v1/wa/accounts");
  const teamPromise = quiet<Team>("/v1/team");

  const channelsPromise = agentsPromise.then((agentsRes) => {
    const preferred =
      (agentsRes || []).find((a) => a.is_active && a.mode !== "whatsapp") ||
      (agentsRes || [])[0];
    return preferred ? quiet<AgentChannel[]>(`/v1/agents/${preferred.id}/channels`) : null;
  });

  const [agentsRes, sources, , channels, waAccounts, team] = await Promise.all([
    agentsPromise,
    sourcesPromise,
    widgetPromise,
    channelsPromise,
    waPromise,
    teamPromise,
  ]);

  const agents = agentsRes || [];
  const agent =
    agents.find((a) => a.is_active && a.mode !== "whatsapp") || agents[0] || null;

  const hasAgent = agents.length > 0;
  const hasKnowledge = (sources || []).some(
    (s) => s.status === "completed" || s.status === "ready",
  );
  const hasPublished = Boolean(agent?.current_version_id);
  const hasChannel = (channels || []).some((c) => c.enabled);
  const hasTested = readSandboxTested(agent?.id ?? null);
  const hasWhatsApp = (waAccounts || []).some((a) => a.is_active !== false);
  const members = team?.members || [];
  const invites = team?.pending_invites || [];
  const hasTeamInvite = members.length > 1 || invites.length > 0;

  return {
    hasAgent,
    hasKnowledge,
    hasPublished,
    hasWidget: hasPublished,
    hasChannel,
    hasTested,
    hasWhatsApp,
    hasTeamInvite,
    // Knowledge + WA + team remain optional for "all done".
    allDone: hasAgent && hasPublished && hasChannel && hasTested,
    agentId: agent?.id ?? null,
  };
}

/**
 * Legacy 0-based index used by older step wizards.
 * Hub order is plan → agent → knowledge → sandbox → publish → go-live → optionals.
 */
export function firstIncompleteStep(s: OnboardingStatus): number {
  const steps = [s.hasAgent, s.hasKnowledge, s.hasChannel, s.hasPublished, s.hasTested];
  const i = steps.indexOf(false);
  return i === -1 ? steps.length : i;
}
