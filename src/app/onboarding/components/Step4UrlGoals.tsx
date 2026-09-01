"use client";

import { useState, FormEvent } from "react";
import { ArrowRight, Globe, Sparkles } from "lucide-react";

interface Step4UrlGoalsProps {
  websiteUrl: string;
  selectedGoal: string;
  onChangeUrl: (url: string) => void;
  onSelectGoal: (goalId: string) => void;
  onContinue: () => void;
  onSkip?: () => void;
}

export function Step4UrlGoals({
  websiteUrl,
  onChangeUrl,
  onContinue,
  onSkip,
}: Step4UrlGoalsProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (
      websiteUrl &&
      !/^https?:\/\//i.test(websiteUrl) &&
      !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(websiteUrl)
    ) {
      setError("Please enter a valid website address (e.g. https://mycompany.com)");
      return;
    }
    setError(null);
    onContinue();
  };

  return (
    <div className="w-full max-w-[560px] mx-auto animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-[11px] font-semibold tracking-wider text-[#0396A6] uppercase mb-1.5">
          Step 4 of 6 · Knowledge Base Setup
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
          Connect your business knowledge
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          Provide your website or documentation URL. Frostrek will automatically extract and index your content.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Website Input Card */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs">
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            Website or Documentation URL
          </label>
          <div className="relative flex items-center">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => {
                setError(null);
                onChangeUrl(e.target.value);
              }}
              placeholder="https://example.com"
              className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-[#F7FDFD] border border-[#D9EDEE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0396A6]/20 focus:border-[#0396A6] transition-all h-9.5"
            />
          </div>
          {error && <p className="text-xs font-semibold text-rose-600 mt-1.5">{error}</p>}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0396A6] shrink-0" />
            <span>We&apos;ll automatically crawl public FAQ, product pages, and service policies.</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            className="w-full h-10 rounded-lg bg-[#0396A6] hover:bg-[#087681] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-[0.99]"
          >
            <span>Continue to Review & Launch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors text-center font-medium"
            >
              Skip and add knowledge later
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
