"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchOnboardingStatus, type OnboardingStatus } from "@/lib/onboarding";
import { canFeature } from "@/lib/entitlements";
import { useWorkspace } from "@/lib/workspace";
import {
  Rocket,
  CheckCircle2,
  AlertCircle,
  Bot,
  FileText,
  Code,
  LayoutDashboard,
  ExternalLink,
  Globe,
  FlaskConical,
  MessageCircle,
} from "lucide-react";

interface Props {
  onRefreshWorkspace?: () => void;
}

type Card = {
  title: string;
  desc: string;
  done: boolean;
  optional?: boolean;
  icon: typeof CheckCircle2;
};

export function StepGoLive({ onRefreshWorkspace }: Props) {
  const { entitlements } = useWorkspace();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchOnboardingStatus()
      .then((st) => {
        if (!cancelled) setStatus(st);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loading && onRefreshWorkspace) onRefreshWorkspace();
  }, [loading, onRefreshWorkspace]);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">Checking channel readiness…</p>
      </div>
    );
  }

  const planReady = Boolean(entitlements?.plan_slug);
  const planDesc = entitlements?.plan_name
    ? `${entitlements.plan_name}${entitlements.subscription_status ? ` · ${entitlements.subscription_status}` : ""}`
    : entitlements?.plan_slug
      ? `Plan: ${entitlements.plan_slug}`
      : "Open Billing if plan details are missing";

  const allowsWhatsApp =
    canFeature(entitlements, "channel_whatsapp") ||
    entitlements?.plan_slug === "growth" ||
    entitlements?.plan_slug === "scale" ||
    entitlements?.plan_slug === "max";

  const trafficReady = Boolean(
    status?.hasAgent && status?.hasPublished && status?.hasChannel,
  );

  const cards: Card[] = [
    {
      title: "Plan",
      desc: planDesc,
      done: planReady,
      icon: CheckCircle2,
    },
    {
      title: "AI agent",
      desc: status?.hasAgent ? "Agent configured" : "Create an agent first",
      done: Boolean(status?.hasAgent),
      icon: Bot,
    },
    {
      title: "Knowledge base",
      desc: status?.hasKnowledge
        ? "Indexed sources ready for grounding"
        : "Optional — without Ready sources, answers may refuse or stay generic",
      done: Boolean(status?.hasKnowledge),
      optional: true,
      icon: FileText,
    },
    {
      title: "Sandbox preview",
      desc: status?.hasTested
        ? "You confirmed a draft preview"
        : "Confirm a sandbox reply before relying on live answers",
      done: Boolean(status?.hasTested),
      icon: FlaskConical,
    },
    {
      title: "Published version",
      desc: status?.hasPublished
        ? "A version is published for visitors"
        : "Publish a draft from the Publish step",
      done: Boolean(status?.hasPublished),
      icon: Code,
    },
    {
      title: "Website channel",
      desc: status?.hasChannel
        ? "Website channel enabled"
        : "Enable the website channel in Widget settings",
      done: Boolean(status?.hasChannel),
      icon: Globe,
    },
  ];

  return (
    <div className="space-y-6">
      <div
        className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          trafficReady
            ? "bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border-primary/20"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              trafficReady
                ? "bg-primary text-primary-foreground"
                : "bg-amber-500 text-white"
            }`}
          >
            {trafficReady ? <Rocket className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-bold text-lg text-on-surface font-display">
              {trafficReady
                ? "Channels ready — finish install on your site"
                : "Not fully ready for live traffic yet"}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xl leading-relaxed">
              {trafficReady
                ? "Agent is published and the website channel is on. Paste the install snippet (Publish / Widget settings) on your site, then watch the Inbox for visitors. Knowledge is optional but improves grounding."
                : "Go live needs a published agent and an enabled website channel. Complete the cards below marked Pending, then install the widget on your site."}
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 shrink-0"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Open dashboard</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((item) => (
          <div
            key={item.title}
            className="p-4 rounded-xl bg-surface-container-low border border-border/80 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  item.done
                    ? "bg-emerald-100 text-emerald-700"
                    : item.optional
                      ? "bg-surface-container text-on-surface-variant"
                      : "bg-amber-100 text-amber-800"
                }`}
              >
                <item.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-on-surface">
                  {item.title}
                  {item.optional ? (
                    <span className="ml-1.5 text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">
                      Optional
                    </span>
                  ) : null}
                </p>
                <p className="text-[11px] text-on-surface-variant leading-snug">{item.desc}</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                item.done
                  ? "bg-emerald-100 text-emerald-800"
                  : item.optional
                    ? "bg-surface-container text-on-surface-variant"
                    : "bg-amber-100 text-amber-900"
              }`}
            >
              {item.done ? "Ready" : item.optional ? "Skipped" : "Pending"}
            </span>
          </div>
        ))}
      </div>

      <div className="p-4 bg-surface rounded-xl border border-border/80 space-y-3">
        <p className="text-xs text-on-surface-variant font-medium">Next actions</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/widget"
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>Install / Widget settings</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          {allowsWhatsApp && (
            <Link
              href="/whatsapp?tab=settings"
              className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs font-semibold text-on-surface transition-colors flex items-center gap-1.5"
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp Connect</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
          <Link
            href="/settings/domain"
            className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs font-semibold text-on-surface transition-colors flex items-center gap-1.5"
          >
            <Globe className="w-3 h-3" />
            <span>Domain verification</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            href="/inbox"
            className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs font-semibold text-on-surface transition-colors flex items-center gap-1.5"
          >
            <span>Unified Inbox</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        {!allowsWhatsApp && (
          <p className="text-[11px] text-on-surface-variant">
            WhatsApp is not on your current plan — upgrade from Billing if you need it.
          </p>
        )}
      </div>
    </div>
  );
}
