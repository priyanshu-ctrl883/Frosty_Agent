"use client";

import { ArrowRight, Check, Sparkles, MessageCircle, Shield, Languages, UserCheck } from "lucide-react";

interface Step3ModelsProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onContinue: () => void;
  onSkip?: () => void;
}

interface PersonaOption {
  id: string;
  title: string;
  badge: string;
  description: string;
  example: string;
  idealFor: string;
}

const PERSONAS: PersonaOption[] = [
  {
    id: "friendly",
    title: "Friendly & Conversational",
    badge: "Most Popular",
    description: "Warm, engaging, and approachable. Uses light emojis and natural conversational flow.",
    example: "“Hey there! 👋 Welcome to our store. Looking for something specific or want our top picks today?”",
    idealFor: "E-Commerce, D2C, Retail, Wellness, Hospitality",
  },
  {
    id: "professional",
    title: "Professional & Articulate",
    badge: "B2B / Corporate",
    description: "Polite, authoritative, and structured. Focuses on clarity, trust, and accurate answers.",
    example: "“Good morning. I would be glad to guide you through our services and connect you with our team.”",
    idealFor: "Finance, Real Estate, Consulting, Healthcare, Legal",
  },
  {
    id: "sales",
    title: "Proactive & Sales-Driven",
    badge: "High Conversion",
    description: "Consultative and persuasive. Asks qualifying questions and guides visitors toward a booking or demo.",
    example: "“Great choice! We have 2 slots open tomorrow for a personalized demo. Would 3:00 PM work for you?”",
    idealFor: "SaaS, Agencies, High-Ticket Services, Lead Generation",
  },
  {
    id: "concise",
    title: "Fast & Direct Support",
    badge: "Efficiency",
    description: "Direct and straightforward answers without fluff. Ideal for instant problem resolution.",
    example: "“Yes, domestic orders ship within 48 hours. Orders above ₹999 qualify for complimentary express delivery.”",
    idealFor: "Technical Support, Logistics, FAQs, Developer Tools",
  },
];

export function Step3Models({
  selectedModel,
  onSelectModel,
  onContinue,
  onSkip,
}: Step3ModelsProps) {
  // Normalize selection to fallback to "friendly" if an old LLM slug is present
  const currentPersonaId = PERSONAS.some((p) => p.id === selectedModel)
    ? selectedModel
    : "friendly";

  return (
    <div className="w-full max-w-[560px] mx-auto animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-[11px] font-semibold tracking-wider text-[#0396A6] uppercase mb-1.5">
          Step 4 of 8 · Persona & Tone
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
          How should your AI agent speak?
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          Select the conversational tone that represents your brand. The agent adapts dynamically across 50+ languages.
        </p>
      </div>

      {/* Persona Cards Grid */}
      <div className="space-y-2.5 mb-5">
        {PERSONAS.map((p) => {
          const isSelected = currentPersonaId === p.id;
          return (
            <div
              key={p.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onSelectModel(p.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectModel(p.id);
                }
              }}
              className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0396A6] ${
                isSelected
                  ? "border-[#0396A6] bg-[#F7FDFD] shadow-xs"
                  : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-slate-900">
                      {p.title}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        isSelected
                          ? "bg-[#EAF8F8] text-[#0396A6] border border-[#B8E0E2]/60"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {p.badge}
                    </span>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? "border-[#0396A6] bg-[#0396A6] text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-normal mb-2">{p.description}</p>

                {/* Example Quote */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-normal italic leading-relaxed">
                  {p.example}
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Best for: {p.idealFor}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Built-in Agent Capabilities Strip */}
      <div className="p-3 rounded-xl border border-slate-200/80 bg-white mb-6 space-y-2 text-left">
        <div className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#0396A6]" />
          <span>Autonomous AI Intelligence Features</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Auto-detects 50+ languages</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Smart human team handoff</span>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={onContinue}
          className="w-full h-10 rounded-lg bg-[#0396A6] hover:bg-[#087681] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-[0.99]"
        >
          <span>Continue to Knowledge Setup</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors text-center font-medium"
          >
            Skip and use default tone
          </button>
        )}
      </div>
    </div>
  );
}
