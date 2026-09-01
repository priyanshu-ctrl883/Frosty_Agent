"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  AlertCircle,
  Code2,
  Globe,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  HelpCircle,
  ShoppingBag,
  Palette,
  Zap,
} from "lucide-react";
import {
  buildInstallMethods,
  parseEmbedSnippet,
  type InstallMethodId,
  type WidgetInstallParts,
} from "@/lib/widgetInstall";

type Props = {
  embedSnippet: string | null | undefined;
  /** When set, used if the snippet still has a placeholder key. */
  publishableKey?: string | null;
  position?: string | null;
  /** Pins HTML/React/GTM recipes to this website agent (D210). */
  agentId?: string | null;
  /** Compact = onboarding; default fits /widget. */
  compact?: boolean;
  className?: string;
  /** Shown when there is no website channel / settings at all. */
  loadError?: string | null;
};

const PLATFORM_GUIDES = [
  {
    id: "wordpress",
    name: "WordPress",
    icon: Globe,
    steps: [
      "Log in to your WordPress Admin Dashboard.",
      "Install and activate the 'WPCode' or 'Insert Headers and Footers' plugin (or go to Appearance → Theme File Editor).",
      "Paste the HTML snippet into the 'Footer Scripts' section before </body>.",
      "Click Save Changes — the chat widget will appear immediately.",
    ],
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: ShoppingBag,
    steps: [
      "In Shopify Admin, go to Online Store → Themes.",
      "Click the '...' button next to your active theme and choose 'Edit code'.",
      "Under the 'Layout' folder, open 'theme.liquid'.",
      "Scroll to the bottom, paste the HTML snippet right before the </body> tag, and click Save.",
    ],
  },
  {
    id: "webflow",
    name: "Webflow",
    icon: Palette,
    steps: [
      "Open Project Settings in your Webflow dashboard.",
      "Navigate to the 'Custom Code' tab.",
      "Paste the HTML snippet into the 'Footer Code' (before </body>) input box.",
      "Publish your site to see the live chat widget.",
    ],
  },
  {
    id: "wix_squarespace",
    name: "Wix / Squarespace",
    icon: Zap,
    steps: [
      "In Wix: Settings → Custom Code → + Add Custom Code → Paste snippet, place in Body - end, apply to All pages.",
      "In Squarespace: Settings → Advanced → Code Injection → Paste in Footer box and click Save.",
    ],
  },
];

export function WidgetInstallMethods({
  embedSnippet,
  publishableKey,
  position,
  agentId,
  compact = false,
  className,
  loadError,
}: Props) {
  const [tab, setTab] = useState<InstallMethodId>("html");
  const [copied, setCopied] = useState(false);
  const [openGuide, setOpenGuide] = useState<string | null>(null);

  const methods = useMemo(() => {
    let parts: WidgetInstallParts | null = parseEmbedSnippet(embedSnippet);
    if (!parts && embedSnippet && publishableKey) {
      const bundleUrl = embedSnippet.match(/\bsrc=["']([^"']+)["']/)?.[1];
      if (bundleUrl) {
        parts = {
          bundleUrl,
          publishableKey,
          position: position || "bottom-right",
          agentId: agentId || null,
        };
      }
    } else if (parts && !parts.agentId && agentId) {
      parts = { ...parts, agentId };
    }
    return parts ? buildInstallMethods(parts) : null;
  }, [embedSnippet, publishableKey, position, agentId]);

  const active = methods?.find((m) => m.id === tab) || methods?.[0];

  const copy = async () => {
    if (!active?.code) return;
    try {
      await navigator.clipboard.writeText(active.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  };

  const getFilename = (id: InstallMethodId) => {
    switch (id) {
      case "react":
        return "FrostyWidget.tsx";
      case "gtm":
        return "gtm-custom-html.html";
      default:
        return "index.html";
    }
  };

  const getLanguageLabel = (id: InstallMethodId) => {
    switch (id) {
      case "react":
        return "TypeScript / React";
      case "gtm":
        return "GTM Tag";
      default:
        return "HTML";
    }
  };

  const getMethodIcon = (id: InstallMethodId) => {
    switch (id) {
      case "react":
        return <Code2 size={13} />;
      case "gtm":
        return <Layers size={13} />;
      default:
        return <Globe size={13} />;
    }
  };

  if (!methods || !active) {
    return (
      <div
        className={
          className ||
          "p-5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-950 dark:text-amber-200 space-y-3"
        }
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <p className="font-bold text-sm">Install snippet unavailable</p>
            <p className="text-amber-900/90 dark:text-amber-200/80 leading-relaxed text-xs">
              {loadError ||
                "We need an active website agent channel and a publishable widget key. Make sure the website channel is enabled."}
            </p>
            <Link
              href="/widget"
              className="inline-flex items-center gap-1 font-bold text-[#0396A6] hover:underline text-xs mt-1"
            >
              <span>Open Widget settings</span>
              <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className || "space-y-4"}>
      {/* Method Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/40 dark:bg-zinc-800/40 rounded-xl border border-border/80">
          {methods.map((m) => {
            const isCurrent = active.id === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setTab(m.id);
                  setCopied(false);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  isCurrent
                    ? "bg-[#0396A6] text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {getMethodIcon(m.id)}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void copy()}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
            copied
              ? "bg-emerald-600 text-white"
              : "bg-[#0396A6] hover:bg-[#028391] text-white"
          }`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? "Copied to Clipboard!" : "Copy Code"}</span>
        </button>
      </div>

      {/* Hint Banner */}
      <div className="flex items-start gap-2 px-3.5 py-2.5 bg-muted/20 dark:bg-zinc-800/20 border border-border/60 rounded-xl text-xs text-muted-foreground leading-relaxed">
        <Terminal size={14} className="text-[#0396A6] shrink-0 mt-0.5" />
        <p className="flex-1">{active.hint}</p>
      </div>

      {/* IDE-Style Code Box */}
      <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#0b1320] shadow-xl">
        {/* Terminal / Code Editor Top Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#070d18] border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-3">
            {/* Mac Dots */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] inline-block opacity-80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] inline-block opacity-80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] inline-block opacity-80" />
            </div>
            {/* Filename Chip */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/70 text-slate-300 font-mono text-[11px]">
              <Code2 size={11} className="text-[#0396A6]" />
              <span>{getFilename(active.id)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {getLanguageLabel(active.id)}
            </span>
            <button
              type="button"
              onClick={() => void copy()}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copy code"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        {/* Code Content */}
        <pre
          className={`p-4 sm:p-5 text-[#E2E8F0] text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap select-all selection:bg-[#0396A6]/30 selection:text-white ${
            compact ? "max-h-56" : "max-h-80"
          }`}
        >
          <code>{active.code}</code>
        </pre>
      </div>

      {/* 3-Step Quick Process Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <div className="p-3 bg-muted/20 dark:bg-zinc-900/40 rounded-xl border border-border/60 space-y-1">
          <div className="flex items-center gap-1.5 text-[#0396A6] font-bold text-xs">
            <span className="w-4 h-4 rounded-full bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center text-[10px] font-mono">1</span>
            <span>Copy Snippet</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Click copy button above for the full script snippet.
          </p>
        </div>

        <div className="p-3 bg-muted/20 dark:bg-zinc-900/40 rounded-xl border border-border/60 space-y-1">
          <div className="flex items-center gap-1.5 text-[#0396A6] font-bold text-xs">
            <span className="w-4 h-4 rounded-full bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center text-[10px] font-mono">2</span>
            <span>Paste in HTML</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Place before closing <code className="font-mono text-foreground text-[10px]">&lt;/body&gt;</code> on your site.
          </p>
        </div>

        <div className="p-3 bg-muted/20 dark:bg-zinc-900/40 rounded-xl border border-border/60 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <CheckCircle2 size={13} />
            <span>Immediately Live</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Save &amp; refresh your site. The chat widget appears right away!
          </p>
        </div>
      </div>

      {/* Popular Platform Instructions (Accordion) */}
      {!compact && (
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <HelpCircle size={13} className="text-[#0396A6]" />
              <span>Platform-Specific Instructions</span>
            </p>
            <span className="text-[10px] text-muted-foreground">Click to view guide</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
            {PLATFORM_GUIDES.map((g) => {
              const isOpen = openGuide === g.id;
              return (
                <div
                  key={g.id}
                  className="rounded-xl border border-border/70 bg-card overflow-hidden transition-all shadow-2xs self-start"
                >
                  <button
                    type="button"
                    onClick={() => setOpenGuide(isOpen ? null : g.id)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <g.icon size={15} className="text-[#0396A6] shrink-0" />
                      <span className="text-xs font-bold text-foreground">{g.name}</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-muted-foreground transition-transform duration-300 ease-in-out ${
                        isOpen ? "rotate-180 text-foreground" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-3.5 pb-3 pt-2 border-t border-border/40 text-[11px] text-muted-foreground space-y-1.5 bg-muted/10">
                        <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
                          {g.steps.map((st, idx) => (
                            <li key={idx}>{st}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
