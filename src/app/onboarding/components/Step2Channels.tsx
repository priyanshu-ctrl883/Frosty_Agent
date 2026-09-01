"use client";

import { ArrowRight, Globe, MessageSquare, Layers, Check } from "lucide-react";

interface Step2ChannelsProps {
  selectedChannels: string[];
  onToggleChannel: (channelId: string) => void;
  onContinue: () => void;
  onSkip?: () => void;
}

interface ChannelOption {
  id: "website" | "whatsapp" | "unified";
  name: string;
  badge?: string;
  description: string;
  details: string;
  icon: typeof Globe;
}

const CHANNEL_OPTIONS: ChannelOption[] = [
  {
    id: "unified",
    name: "Omnichannel (Website + WhatsApp)",
    badge: "Recommended",
    description: "Deploy a single synchronized AI brain across your web properties and WhatsApp number.",
    details: "Shared knowledge base · Unified conversation logs · Automated routing",
    icon: Layers,
  },
  {
    id: "website",
    name: "Website Live Widget",
    description: "Embed a lightweight, branded chat assistant directly into your website or web app.",
    details: "1-line JavaScript snippet · Custom colors & positioning · Sub-second latency",
    icon: Globe,
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business API",
    description: "Connect your official WhatsApp business phone number via Meta Cloud API.",
    details: "Direct customer messaging · 24/7 autonomous replies · Template support",
    icon: MessageSquare,
  },
];

export function Step2Channels({
  selectedChannels,
  onToggleChannel,
  onContinue,
  onSkip,
}: Step2ChannelsProps) {
  const hasWebsite = selectedChannels.includes("website");
  const hasWhatsapp = selectedChannels.includes("whatsapp");
  const isUnified = hasWebsite && hasWhatsapp;

  const handleSelectOption = (id: "website" | "whatsapp" | "unified") => {
    if (id === "unified") {
      if (!hasWebsite) onToggleChannel("website");
      if (!hasWhatsapp) onToggleChannel("whatsapp");
    } else if (id === "website") {
      if (!hasWebsite) onToggleChannel("website");
      if (hasWhatsapp) onToggleChannel("whatsapp");
    } else if (id === "whatsapp") {
      if (hasWebsite) onToggleChannel("website");
      if (!hasWhatsapp) onToggleChannel("whatsapp");
    }
  };

  const getIsActive = (id: "website" | "whatsapp" | "unified") => {
    if (id === "unified") return isUnified;
    if (id === "website") return hasWebsite && !hasWhatsapp;
    if (id === "whatsapp") return hasWhatsapp && !hasWebsite;
    return false;
  };

  return (
    <div className="w-full max-w-[560px] mx-auto animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-[11px] font-semibold tracking-wider text-[#0396A6] uppercase mb-1.5">
          Step 3 of 6 · Deployment Channels
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
          Where should your AI agent operate?
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          Select your primary customer interaction channels. You can adjust and configure keys later.
        </p>
      </div>

      {/* Options List */}
      <div className="space-y-2.5 mb-6">
        {CHANNEL_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = getIsActive(option.id);

          return (
            <div
              key={option.id}
              role="radio"
              aria-checked={active}
              tabIndex={0}
              onClick={() => handleSelectOption(option.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectOption(option.id);
                }
              }}
              className={`w-full p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer flex items-start gap-3.5 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0396A6] ${
                active
                  ? "border-[#0396A6] bg-[#F7FDFD] shadow-xs"
                  : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              {/* Channel Icon */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  active
                    ? "bg-[#0396A6] text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-slate-900">
                    {option.name}
                  </span>
                  {option.badge && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#EAF8F8] text-[#0396A6] border border-[#B8E0E2]/60">
                      {option.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                  {option.description}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-mono tracking-tight">
                  {option.details}
                </p>
              </div>

              {/* Radio Check Indicator */}
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all ${
                  active
                    ? "border-[#0396A6] bg-[#0396A6] text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action CTA */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={onContinue}
          className="w-full h-10 rounded-lg bg-[#0396A6] hover:bg-[#087681] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-[0.99]"
        >
          <span>Continue to Model Selection</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors text-center font-medium"
          >
            Skip and configure channels later
          </button>
        )}
      </div>
    </div>
  );
}
