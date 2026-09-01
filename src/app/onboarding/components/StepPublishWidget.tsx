"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { completeOnboardingStep } from "@/lib/onboarding";
import { useWorkspace } from "@/lib/workspace";

import type { Agent, AgentVersion, WidgetSettings } from "@/lib/types";
import {
  Code,
  Rocket,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  Info,
  Palette,
} from "lucide-react";
import { WidgetInstallMethods } from "@/components/widget/WidgetInstallMethods";

interface Props {
  onCompleted?: () => void;
  onRefreshWorkspace?: () => void;
}

export function StepPublishWidget({ onCompleted, onRefreshWorkspace }: Props) {
  const { entitlements } = useWorkspace();
  const setupBlocked = Boolean(
    entitlements?.setup_fee_required && !entitlements?.setup_fee_paid,
  );

  const [agent, setAgent] = useState<Agent | null>(null);
  const [latestVersion, setLatestVersion] = useState<AgentVersion | null>(null);
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setWidgetError(null);
    try {
      const agents = await apiRequest<Agent[]>("/v1/agents");
      const preferred =
        (agents || []).find((a) => a.is_active && a.mode !== "whatsapp") || (agents || [])[0];
      if (preferred) {
        setAgent(preferred);
        const versions = await apiRequest<AgentVersion[]>(`/v1/agents/${preferred.id}/versions`);
        const latest = (versions || [])[0] || null;
        setLatestVersion(latest);
        setPublished(Boolean(preferred.current_version_id));
      } else {
        setAgent(null);
        setLatestVersion(null);
        setPublished(false);
      }

      try {
        const ws = await apiRequest<WidgetSettings>("/v1/widget/settings");
        setWidgetSettings(ws);
      } catch (err) {
        setWidgetSettings(null);
        const msg = err instanceof Error ? err.message : "Could not load widget settings";
        setWidgetError(msg);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load publish data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePublish() {
    if (!agent || !latestVersion) return;
    if (setupBlocked) {
      setError("Setup fee is unpaid. Complete setup payment on Billing before publishing.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await apiRequest<Agent>(
        `/v1/agents/${agent.id}/versions/${latestVersion.id}/publish`,
        { method: "POST" },
      );
      setAgent(updated);
      setPublished(Boolean(updated.current_version_id));
      void completeOnboardingStep("configure_channels").catch(() => null);
      if (onRefreshWorkspace) onRefreshWorkspace();
      if (onCompleted) onCompleted();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish agent");
    } finally {
      setBusy(false);
    }
  }

  const snippet = widgetSettings?.embed_snippet?.trim() || null;
  const channelOn = widgetSettings?.channel_enabled !== false;
  const versionLabel = latestVersion
    ? `v${latestVersion.version_number}`
    : null;
  const isLatestPublished =
    Boolean(agent?.current_version_id) &&
    Boolean(latestVersion?.id) &&
    agent?.current_version_id === latestVersion?.id;

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">Loading publish & embed settings…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="p-3.5 rounded-xl border border-border/80 bg-surface-container-low flex gap-3 text-xs text-on-surface-variant leading-relaxed">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>
            <span className="font-semibold text-on-surface">Two separate actions.</span>{" "}
            <strong className="text-on-surface">Publish</strong> makes this agent version serve
            visitors. <strong className="text-on-surface">Embed</strong> installs the launcher on
            your site. Neither alone is “go live” — that is the next checklist step (channels).
          </p>
          <p>
            Customize color, logo, and consent on{" "}
            <Link href="/widget" className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5">
              Widget settings
              <ExternalLink className="w-3 h-3" />
            </Link>
            .
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {setupBlocked && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-amber-950">Setup fee required</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Your plan requires the one-time setup fee before an agent version can be published.
            </p>
          </div>
          <Link
            href="/billing"
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 shrink-0 text-center"
          >
            Pay setup fee
          </Link>
        </div>
      )}

      {published && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-950">Agent version published</p>
              <p className="text-xs text-emerald-700">
                {isLatestPublished
                  ? "Latest draft is live for this agent. Paste the snippet on your site, then finish Go live."
                  : "A version is published. Re-publish if you want the newest draft to serve visitors."}
              </p>
            </div>
          </div>
          {onCompleted && (
            <button
              type="button"
              onClick={onCompleted}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>Next: Go live</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {!channelOn && widgetSettings && (
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Website channel is <strong>off</strong>. Publishing a version will not show the widget
            until the channel is enabled in Widget settings.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-surface-container-low border border-border/80 space-y-3">
            <h4 className="font-bold text-sm text-on-surface font-display flex items-center gap-2">
              <Code className="w-4 h-4 text-primary" />
              <span>Install on your site</span>
            </h4>
            <WidgetInstallMethods
              embedSnippet={snippet}
              publishableKey={widgetSettings?.publishable_key}
              position={widgetSettings?.appearance?.position}
              agentId={widgetSettings?.agent_id}
              loadError={widgetError}
              compact
            />
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-low border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider text-on-surface">
                Publish agent version
              </h5>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {!agent
                  ? "Create an agent first"
                  : !latestVersion
                    ? "No draft version to publish"
                    : isLatestPublished
                      ? `${agent.agent_name || "Agent"} ${versionLabel} is the published version`
                      : `Publish draft ${versionLabel} of ${agent.agent_name || "your agent"} for visitors`}
              </p>
            </div>

            <button
              type="button"
              disabled={busy || !latestVersion || setupBlocked || !agent}
              onClick={() => void handlePublish()}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <Rocket className="w-4 h-4" />
              <span>
                {busy
                  ? "Publishing…"
                  : isLatestPublished
                    ? "Re-publish latest"
                    : "Publish version"}
              </span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 bg-surface-container-lowest border border-border/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-primary" />
              Appearance
            </span>
          </div>

          <div className="p-5 bg-surface rounded-xl border border-border/80 space-y-3 text-xs text-on-surface-variant leading-relaxed">
            <p>
              Launcher color, logo, position, and consent are edited on the full Widget page — not
              duplicated here — so this step stays focused on publish + install.
            </p>
            <p className="text-on-surface font-semibold">
              Position in snippet:{" "}
              {widgetSettings?.appearance?.position || "bottom-right"}
            </p>
            <Link
              href="/widget"
              className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline"
            >
              Open Widget settings
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <ul className="text-[11px] text-on-surface-variant space-y-1.5 list-disc pl-4">
            <li>Publish does not place the script on your website.</li>
            <li>Copying the snippet does not publish the draft.</li>
            <li>WhatsApp and other channels are configured in Go live.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
