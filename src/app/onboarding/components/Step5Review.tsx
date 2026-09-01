"use client";

import { useState } from "react";
import { ArrowRight, Sparkles, Info, Send, X, Bot, Minimize2 } from "lucide-react";

interface Step5ReviewProps {
  botName: string;
  brandColor: string;
  welcomeMessage: string;
  behaviorPrompt: string;
  websiteUrl: string;
  goal: string;
  onChangeBotName: (name: string) => void;
  onChangeColor: (color: string) => void;
  onChangeWelcome: (welcome: string) => void;
  onChangePrompt: (prompt: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

const PRESET_COLORS = [
  { name: "Teal", hex: "#0396A6" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Purple", hex: "#7C3AED" },
  { name: "Emerald", hex: "#059669" },
  { name: "Slate", hex: "#0F172A" },
];

/* A tiny in-browser demo message thread */
const DEMO_MESSAGES = [
  { from: "user", text: "Hi! What can you help me with?" },
  { from: "bot",  text: "Great question! I can help with product info, orders, pricing, and more. What would you like to know?" },
  { from: "user", text: "Do you offer free shipping?" },
  { from: "bot",  text: "Yes! Free shipping on orders over $50. Want me to check if your cart qualifies?" },
];

export function Step5Review({
  botName,
  brandColor,
  welcomeMessage,
  behaviorPrompt,
  websiteUrl,
  goal,
  onChangeBotName,
  onChangeColor,
  onChangeWelcome,
  onChangePrompt,
  onSubmit,
  onBack,
  onCancel,
  loading = false,
}: Step5ReviewProps) {
  const [generating, setGenerating] = useState(false);
  const [draftInput, setDraftInput] = useState("");

  const handleGeneratePrompt = () => {
    setGenerating(true);
    setTimeout(() => {
      let prompt = `You are a high-performing AI assistant for this business.\n`;
      if (websiteUrl) {
        prompt += `Reference public knowledge, product catalogs, and service terms from ${websiteUrl}.\n`;
      }
      if (goal === "leads") {
        prompt += `Your primary goal is to engage visitors warmly, qualify their interest, and collect their contact details to connect them with the sales team.\n`;
      } else if (goal === "support") {
        prompt += `Your primary goal is to resolve customer inquiries accurately, provide step-by-step guidance, and escalate complex issues smoothly.\n`;
      } else {
        prompt += `Answer questions accurately based on company policies, pricing, and operating hours. If uncertain, offer to take visitor details for follow-up.\n`;
      }
      prompt += `Always maintain a professional, helpful, and concise tone.`;
      onChangePrompt(prompt);
      setGenerating(false);
    }, 400);
  };

  /* Derive a text colour that contrasts against brandColor */
  const contrastText = (() => {
    const hex = brandColor.replace("#", "");
    if (hex.length < 6) return "#ffffff";
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? "#1e293b" : "#ffffff";
  })();

  const displayName = botName.trim() || "AI Assistant";
  const displayGreeting = welcomeMessage.trim() || "Hi! How can I help you today?";

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in-50 duration-200">
      {/* Title Header */}
      <div className="text-center mb-3">
        <div className="text-[11px] font-semibold tracking-wider text-[#0396A6] uppercase mb-1">
          Step 5 of 6 · Review &amp; Customize
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Review your AI agent persona
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
          Fine-tune the name, welcome message, and system instructions before deploying.
        </p>
      </div>

      {/* Split Layout: Form left | Preview right */}
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full">

        {/* ─── LEFT: Form Card ─── */}
        <div className="flex-1 min-w-0 bg-white rounded-xl p-4 shadow-xs border border-slate-200/90 space-y-3 text-left">

          {/* Row 1: Agent Name & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Agent Name
              </label>
              <input
                type="text"
                required
                value={botName}
                onChange={(e) => onChangeBotName(e.target.value)}
                placeholder="e.g. Frostrek Assistant"
                className="w-full px-3 py-2 rounded-lg border border-[#D9EDEE] bg-[#F7FDFD] text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0396A6]/20 focus:border-[#0396A6] h-9"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Brand Accent Color
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-[#D9EDEE] bg-[#F7FDFD] h-9 shrink-0">
                  <span
                    className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: brandColor }}
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => onChangeColor(e.target.value)}
                    className="w-16 text-xs font-mono font-semibold text-slate-800 focus:outline-none uppercase bg-transparent"
                    maxLength={7}
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => onChangeColor(c.hex)}
                      style={{ backgroundColor: c.hex }}
                      className={`w-5 h-5 rounded-full transition-transform cursor-pointer shrink-0 ${
                        brandColor.toLowerCase() === c.hex.toLowerCase()
                          ? "scale-110 ring-2 ring-offset-2 ring-[#0396A6]"
                          : "hover:scale-105 opacity-80 hover:opacity-100"
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Welcome Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Initial Greeting Message
            </label>
            <input
              type="text"
              required
              value={welcomeMessage}
              onChange={(e) => onChangeWelcome(e.target.value)}
              placeholder="Hi! How can I help you today?"
              className="w-full px-3 py-2 rounded-lg border border-[#D9EDEE] bg-[#F7FDFD] text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0396A6]/20 focus:border-[#0396A6] h-9"
            />
          </div>

          {/* Row 3: Behavior Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-800">
                System Instruction Prompt
              </label>
              <button
                type="button"
                onClick={handleGeneratePrompt}
                disabled={generating}
                className="text-[11px] font-semibold text-[#0396A6] hover:text-[#087681] inline-flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {generating ? "Generating…" : "Auto-enhance with AI"}
              </button>
            </div>
            <textarea
              rows={3}
              value={behaviorPrompt}
              onChange={(e) => onChangePrompt(e.target.value)}
              placeholder="Your chatbot behavior prompt will appear here..."
              className="w-full p-3 rounded-lg border border-[#D9EDEE] bg-[#F7FDFD] text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0396A6]/20 focus:border-[#0396A6] leading-relaxed resize-none"
            />
          </div>

          {/* Info Note — compact */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <Info className="w-3 h-3 shrink-0" />
            <span>Adjust temperature, webhooks &amp; handoffs in settings.</span>
          </div>
        </div>

        {/* ─── RIGHT: Live Chat Widget Preview ─── */}
        <div className="w-full lg:w-[280px] xl:w-[300px] shrink-0 flex flex-col items-center">
          {/* Preview Label */}
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Live Preview</span>
          </div>

          {/* Widget Window */}
          <div className="w-full max-w-[280px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden bg-white flex flex-col" style={{ height: 380 }}>

            {/* Chat Header */}
            <div
              className="px-4 py-3 flex items-center gap-2.5 shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              {/* Bot avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm shadow-inner"
                style={{ backgroundColor: `${brandColor}cc`, border: `2px solid ${contrastText}22` }}
              >
                <Bot className="w-4 h-4" style={{ color: contrastText }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight truncate" style={{ color: contrastText }}>
                  {displayName}
                </p>
                <p className="text-[10px] leading-tight opacity-80" style={{ color: contrastText }}>
                  Online · Typically replies instantly
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button type="button" className="opacity-70 hover:opacity-100 cursor-default">
                  <Minimize2 className="w-3.5 h-3.5" style={{ color: contrastText }} />
                </button>
                <button type="button" className="opacity-70 hover:opacity-100 cursor-default">
                  <X className="w-3.5 h-3.5" style={{ color: contrastText }} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#F8FAFC]">
              {/* Greeting bubble */}
              <div className="flex items-end gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                  style={{ backgroundColor: brandColor, color: contrastText }}
                >
                  <Bot className="w-3 h-3" />
                </div>
                <div
                  className="max-w-[75%] px-2.5 py-2 rounded-2xl rounded-bl-sm text-[11px] leading-relaxed shadow-xs"
                  style={{ backgroundColor: brandColor, color: contrastText }}
                >
                  {displayGreeting}
                </div>
              </div>

              {/* Demo conversation thread */}
              {DEMO_MESSAGES.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-end gap-1.5 ${msg.from === "user" ? "flex-row-reverse" : ""}`}
                >
                  {msg.from === "bot" && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                      style={{ backgroundColor: brandColor, color: contrastText }}
                    >
                      <Bot className="w-3 h-3" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-2.5 py-2 rounded-2xl text-[11px] leading-relaxed shadow-xs ${
                      msg.from === "user"
                        ? "bg-white border border-slate-200 text-slate-800 rounded-br-sm"
                        : "rounded-bl-sm"
                    }`}
                    style={
                      msg.from === "bot"
                        ? { backgroundColor: brandColor, color: contrastText }
                        : {}
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input Bar */}
            <div className="shrink-0 p-2.5 border-t border-slate-100 bg-white flex items-center gap-2">
              <input
                type="text"
                value={draftInput}
                onChange={(e) => setDraftInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 min-w-0"
              />
              <button
                type="button"
                onClick={() => setDraftInput("")}
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-opacity"
                style={{ backgroundColor: brandColor }}
              >
                <Send className="w-3 h-3" style={{ color: contrastText }} />
              </button>
            </div>

            {/* Powered-by footer */}
            <div className="shrink-0 py-1.5 bg-white border-t border-slate-100 text-center">
              <span className="text-[9px] text-slate-400 font-medium">Powered by </span>
              <span className="text-[9px] font-bold" style={{ color: brandColor }}>Frostrek</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation Bar */}
      <div className="w-full mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="h-10 px-5 rounded-lg bg-[#0396A6] hover:bg-[#087681] text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          <span>{loading ? "Creating agent..." : "Create AI Agent"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
