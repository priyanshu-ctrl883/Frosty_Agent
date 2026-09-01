"use client";

import { useState, useEffect, useCallback } from "react";
import { completeOnboardingStep } from "@/lib/onboarding";
import { useWorkspace } from "@/lib/workspace";

import { canFeature } from "@/lib/entitlements";
import { Select } from "@/components/ui/Select";
import {
  ONBOARDING_LANGUAGE_OPTIONS,
  loadOnboardingAgentForm,
  upsertOnboardingAgent,
} from "@/lib/publishWaAgent";
import type { AgentMode, PromptTone } from "@/lib/types";
import {
  Bot,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Smile,
  ShieldCheck,
  Send,
  User,
  Lock,
} from "lucide-react";

interface Props {
  onCompleted?: () => void;
  onRefreshWorkspace?: () => void;
  onToastMessage?: (msg: string, type?: "warning" | "error" | "info") => void;
}

type Tone = "professional" | "friendly";

export function StepCreateAgent({ onCompleted, onRefreshWorkspace, onToastMessage }: Props) {
  const { merchant, entitlements } = useWorkspace();
  const companyName = merchant?.company_name || "Your Company";
  const canUnified = canFeature(entitlements, "channel_unified");

  const [agentName, setAgentName] = useState("");
  const [language, setLanguage] = useState("en");
  const [tone, setTone] = useState<Tone>("professional");
  const [channel, setChannel] = useState<AgentMode>("website");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingAgentId, setExistingAgentId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const hydrate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const existing = await loadOnboardingAgentForm();
      if (existing?.agent) {
        setExistingAgentId(existing.agent.id);
        setAgentName(existing.agent.agent_name || "");
        setChannel((existing.agent.mode as AgentMode) || "website");
        setTone(existing.tone === "friendly" ? "friendly" : "professional");
        setInstructions(existing.business_info);
        setLanguage(existing.language || "en");
        setSaved(true);
      } else if (merchant?.company_name) {
        setAgentName(`${merchant.company_name} Assistant`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load existing agent");
    } finally {
      setLoading(false);
    }
  }, [merchant?.company_name]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!canUnified && channel === "unified") {
      setChannel("website");
    }
  }, [canUnified, channel]);

  const displayAgentName =
    agentName.trim() || (merchant?.company_name ? `${merchant.company_name} Assistant` : "Frosty Agent");

  const previewMessage =
    tone === "professional"
      ? `Hello! I would be delighted to assist you with inquiries regarding ${companyName}. How may I help you today?`
      : `Hey there! I'm excited to help you explore ${companyName}! What can I help you find today?`;

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    try {
      if (channel === "unified" && !canUnified) {
        throw new Error("Website + WhatsApp is not on your plan. Upgrade, or choose Website only.");
      }
      const agent = await upsertOnboardingAgent({
        agent_name: displayAgentName,
        mode: channel,
        tone: tone as PromptTone,
        business_info: instructions,
        language,
        companyName,
      });
      setExistingAgentId(agent.id);
      setSaved(true);
      void completeOnboardingStep("create_agent").catch(() => null);
      if (onRefreshWorkspace) onRefreshWorkspace();
      if (onCompleted) onCompleted();

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save agent";
      if (onToastMessage) {
        onToastMessage(msg, "warning");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">Loading agent setup…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && !onToastMessage && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {saved && existingAgentId && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-950">Agent saved as draft</p>
              <p className="text-xs text-emerald-700">
                {displayAgentName} is ready for knowledge training. Publish later when you go live.
              </p>
            </div>
          </div>
          {onCompleted && (
            <button
              type="button"
              onClick={onCompleted}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>Next: Add Knowledge</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-2xl bg-surface-container-low border border-border/80 space-y-4">
            <h4 className="font-bold text-sm text-on-surface font-display flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span>Identity & Language</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                Agent Name
              </label>
              <input
                type="text"
                className="w-full h-10 px-3.5 bg-surface border border-border rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder={`e.g., '${companyName} Assistant'`}
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                Primary Language
              </label>
              <Select
                value={language}
                onChange={setLanguage}
                options={ONBOARDING_LANGUAGE_OPTIONS}
              />
              <p className="text-[11px] text-on-surface-variant mt-1.5">
                Stored as a BCP-47 language code on the agent (e.g. en, hi) — not just display text.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-low border border-border/80 space-y-4">
            <h4 className="font-bold text-sm text-on-surface font-display flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Tone & Channels</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">
                Channels
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setChannel("website")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    channel === "website"
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border bg-surface hover:bg-surface-container"
                  }`}
                >
                  <span className="text-xs font-bold text-on-surface">Website</span>
                  <p className="text-[11px] text-on-surface-variant leading-snug mt-1">
                    Chat widget on your site.
                  </p>
                </button>
                <button
                  type="button"
                  disabled={!canUnified}
                  onClick={() => {
                    if (!canUnified) {
                      if (onToastMessage) {
                        onToastMessage(
                          "Website + WhatsApp is not on your plan. Upgrade to unlock unified channel.",
                          "warning",
                        );
                      }
                      return;
                    }
                    setChannel("unified");
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    !canUnified
                      ? "border-border bg-surface-container-low opacity-70 cursor-not-allowed"
                      : channel === "unified"
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border bg-surface hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-on-surface">Website + WhatsApp</span>
                    {!canUnified && <Lock className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />}
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-snug mt-1">
                    {canUnified
                      ? "Unified agent. Connect Meta later so WhatsApp is live, not site-only."
                      : "Not on your plan — upgrade to unlock WhatsApp."}
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">
                Select Tone
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTone("professional")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    tone === "professional"
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border bg-surface hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-on-surface">Professional & Precise</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-snug">
                    Polite, concise, and focused on finding solutions efficiently.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTone("friendly")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    tone === "friendly"
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border bg-surface hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Smile className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-on-surface">Warm & Friendly</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-snug">
                    Empathetic, engaging, and conversational.
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                Custom Guidelines / Instructions (Optional)
              </label>
              <textarea
                className="w-full p-3.5 bg-surface border border-border rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                placeholder={`e.g., 'Act as the official customer concierge for ${companyName}. Answer questions accurately and encourage visitors to book a demo.'`}
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={busy || !agentName.trim()}
              onClick={() => void handleSave()}
              className="w-full py-3 px-6 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy ? (
                existingAgentId ? "Saving…" : "Creating Agent…"
              ) : (
                <>
                  <span>{existingAgentId ? "Save Agent Changes" : "Create & Save Agent"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 bg-surface-container-lowest border border-border/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Tone sample (not live)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Preview only
            </span>
          </div>

          <div className="bg-surface rounded-xl border border-border/80 overflow-hidden shadow-inner flex flex-col h-[340px]">
            <div className="p-3 bg-primary text-primary-foreground flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{displayAgentName}</p>
                <p className="text-[10px] text-white/80">Sample tone · not a live reply</p>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-end gap-3 bg-surface-container-lowest overflow-y-auto">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-on-surface-variant" />
                </div>
                <div className="p-2.5 rounded-xl rounded-tl-sm bg-surface-container text-xs text-on-surface max-w-[80%]">
                  Hi, what services do you offer?
                </div>
              </div>

              <div className="flex items-start gap-2.5 flex-row-reverse">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-2.5 rounded-xl rounded-tr-sm bg-primary/10 border border-primary/15 text-xs text-on-surface max-w-[85%] leading-relaxed">
                  {previewMessage}
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-surface border-t border-border/80 flex items-center gap-2">
              <div className="flex-1 px-3 py-1.5 bg-surface-container-low rounded-lg text-xs text-on-surface-variant/60">
                Ask a question…
              </div>
              <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <Send className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            This is a <strong>static tone sample</strong>, not a model reply. Test real answers in
            Sandbox after you add knowledge. Welcome copy can be refined later in Agent Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
