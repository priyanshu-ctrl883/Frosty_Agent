import { apiRequest } from "./api";
import type { Agent, AgentMode, AgentVersion, GuidedConfig, PromptTone } from "./types";

/** After a WhatsApp or Unified agent exists, Meta connect needs a published version. */
export async function publishFirstVersion(
  agentId: string,
  persona?: Record<string, unknown>,
): Promise<void> {
  const version = await apiRequest<AgentVersion>(`/v1/agents/${agentId}/versions`, {
    method: "POST",
    body: persona ? { persona } : {},
  });
  await apiRequest(`/v1/agents/${agentId}/versions/${version.id}/publish`, { method: "POST" });
}

export function needsWhatsAppConnect(mode: AgentMode | string): boolean {
  return mode === "whatsapp" || mode === "unified";
}

/** Where to send the merchant after create — the new bot’s setup page. Email agents have no
 * persona/version studio; their setup is Connect Google under the Email Agent's own Settings. */
export function afterCreateHref(agent: Pick<Agent, "id" | "mode">): string {
  if (agent.mode === "email") return `/email?agent=${agent.id}&tab=settings`;
  return `/agents/${agent.id}`;
}

export function modeLabel(mode: AgentMode | string): string {
  if (mode === "website") return "Website";
  if (mode === "whatsapp") return "WhatsApp";
  if (mode === "unified") return "Unified";
  if (mode === "email") return "Email";
  return "Agent";
}

/** @deprecated Prefer afterCreateHref(agent) so Meta connect is scoped to the new bot. */
export const WHATSAPP_CONNECT_HREF = "/whatsapp?tab=settings";

/** Hub Meta Connection for a specific agent. */
export function whatsappSettingsHref(agentId: string): string {
  return `/whatsapp?tab=settings&agent=${encodeURIComponent(agentId)}`;
}

export const ONBOARDING_LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "en", label: "English (US / Global)" },
  { value: "hi", label: "Hindi (हिन्दी)" },
  { value: "es", label: "Spanish (Español)" },
  { value: "fr", label: "French (Français)" },
  { value: "de", label: "German (Deutsch)" },
  { value: "ar", label: "Arabic (العربية)" },
];

/** Full language picker for agent configuration (BCP-47 / ISO codes). */
export const AGENT_LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "en", label: "English (US / Global)" },
  { value: "en-IN", label: "English (India)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "hi", label: "Hindi (हिन्दी)" },
  { value: "hi-Latn", label: "Hinglish (Hindi in Latin script)" },
  { value: "bn", label: "Bengali (বাংলা)" },
  { value: "ta", label: "Tamil (தமிழ்)" },
  { value: "te", label: "Telugu (తెలుగు)" },
  { value: "mr", label: "Marathi (मराठी)" },
  { value: "gu", label: "Gujarati (ગુજરાતી)" },
  { value: "kn", label: "Kannada (ಕನ್ನಡ)" },
  { value: "ml", label: "Malayalam (മലയാളം)" },
  { value: "pa", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { value: "or", label: "Odia (ଓଡ଼ିଆ)" },
  { value: "ur", label: "Urdu (اردو)" },
  { value: "as", label: "Assamese (অসমীয়া)" },
  { value: "es", label: "Spanish (Español)" },
  { value: "fr", label: "French (Français)" },
  { value: "de", label: "German (Deutsch)" },
  { value: "pt", label: "Portuguese (Português)" },
  { value: "it", label: "Italian (Italiano)" },
  { value: "nl", label: "Dutch (Nederlands)" },
  { value: "ar", label: "Arabic (العربية)" },
  { value: "zh", label: "Chinese (中文)" },
  { value: "ja", label: "Japanese (日本語)" },
  { value: "ko", label: "Korean (한국어)" },
  { value: "id", label: "Indonesian (Bahasa Indonesia)" },
  { value: "ms", label: "Malay (Bahasa Melayu)" },
  { value: "th", label: "Thai (ไทย)" },
  { value: "vi", label: "Vietnamese (Tiếng Việt)" },
  { value: "tr", label: "Turkish (Türkçe)" },
  { value: "ru", label: "Russian (Русский)" },
  { value: "pl", label: "Polish (Polski)" },
  { value: "sv", label: "Swedish (Svenska)" },
  { value: "fil", label: "Filipino (Tagalog)" },
  { value: "sw", label: "Swahili (Kiswahili)" },
];

/** Create agent + draft version only — publish stays on the Publish / WhatsApp steps. */
export async function createAgentForChannel(input: {
  agent_name: string;
  mode: AgentMode;
  persona?: Record<string, unknown>;
  guided?: GuidedConfig;
}): Promise<Agent> {
  const agent = await apiRequest<Agent>("/v1/agents", {
    method: "POST",
    body: { agent_name: input.agent_name, mode: input.mode },
  });
  try {
    if (input.persona || input.guided) {
      await apiRequest(`/v1/agents/${agent.id}/versions`, {
        method: "POST",
        body: {
          ...(input.persona ? { persona: input.persona } : {}),
          ...(input.guided ? { guided: input.guided, prompt_mode: "guided" } : {}),
        },
      });
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Could not save agent version";
    throw new Error(
      `${detail} The agent record was created — open Agents to finish the draft, or retry Save.`,
    );
  }
  return agent;
}

export type OnboardingAgentDraft = {
  agent_name: string;
  mode: AgentMode;
  tone: PromptTone;
  business_info: string;
  language: string;
  companyName: string;
};

function buildGuided(draft: OnboardingAgentDraft): GuidedConfig {
  const welcome =
    draft.tone === "professional"
      ? `Hello! I would be delighted to assist you with inquiries regarding ${draft.companyName}. How may I help you today?`
      : `Hey there! I'm excited to help you explore ${draft.companyName}. What can I help you find today?`;
  const personaText =
    draft.business_info.trim() ||
    `You are ${draft.agent_name}, the AI assistant for ${draft.companyName}.`;
  return {
    persona: personaText,
    tone: draft.tone,
    languages: [draft.language || "en"],
    welcome_message: welcome,
    fallback_message:
      "I'm not sure I have that information yet. Could you rephrase, or leave your contact details so our team can follow up?",
    business_hours: {},
  };
}

/**
 * Idempotent onboarding save: update existing agent for this mode, or create one.
 * Always writes a draft version — never auto-publishes.
 */
export async function upsertOnboardingAgent(draft: OnboardingAgentDraft): Promise<Agent> {
  const agents = await apiRequest<Agent[]>("/v1/agents");
  const existing = (agents || []).find((a) => a.mode === draft.mode) || null;
  const guided = buildGuided(draft);
  const persona = {
    agent_name: draft.agent_name,
    tone: draft.tone,
    business_info: draft.business_info.trim(),
  };

  if (existing) {
    await apiRequest<Agent>(`/v1/agents/${existing.id}`, {
      method: "PATCH",
      body: { agent_name: draft.agent_name },
    });
    try {
      await apiRequest(`/v1/agents/${existing.id}/versions`, {
        method: "POST",
        body: { persona, guided, prompt_mode: "guided" },
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Could not save agent version";
      throw new Error(detail);
    }
    return { ...existing, agent_name: draft.agent_name };
  }

  return createAgentForChannel({
    agent_name: draft.agent_name,
    mode: draft.mode,
    persona,
    guided,
  });
}

export async function loadOnboardingAgentForm(): Promise<{
  agent: Agent | null;
  tone: PromptTone;
  business_info: string;
  language: string;
} | null> {
  const agents = await apiRequest<Agent[]>("/v1/agents");
  if (!agents?.length) return null;
  const preferred =
    agents.find((a) => a.mode === "website") ||
    agents.find((a) => a.mode === "unified") ||
    agents[0];
  if (!preferred) return null;

  let tone: PromptTone = "professional";
  let business_info = "";
  let language = "en";
  try {
    const versions = await apiRequest<AgentVersion[]>(`/v1/agents/${preferred.id}/versions`);
    const latest = versions?.[0];
    const cfg = latest?.config;
    if (cfg?.persona?.tone) tone = cfg.persona.tone as PromptTone;
    if (typeof cfg?.persona?.business_info === "string") {
      business_info = cfg.persona.business_info.replace(/^Language:\s*[^\n]*\n*/i, "").trim();
    }
    const langs = cfg?.guided?.languages;
    if (Array.isArray(langs) && langs[0]) language = String(langs[0]);
  } catch {
    // Agent exists without a readable version — form still usable.
  }

  return { agent: preferred, tone, business_info, language };
}
