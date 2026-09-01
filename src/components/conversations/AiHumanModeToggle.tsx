"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface AiHumanModeToggleProps {
  mode: "ai" | "human";
  onSelect: (mode: "ai" | "human") => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const AiHumanModeToggle = ({
  mode,
  onSelect,
  disabled = false,
  loading = false,
  className = "",
}: AiHumanModeToggleProps) => {
  const isAi = mode === "ai";
  const blocked = disabled || loading;

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      role="group"
      aria-label="Conversation control mode"
    >
      <button
        type="button"
        disabled={blocked}
        onClick={() => {
          if (!isAi) onSelect("ai");
        }}
        className={`text-[10px] font-extrabold uppercase tracking-wide transition-colors cursor-pointer disabled:cursor-not-allowed ${
          isAi ? "text-[#0396A6]" : "text-slate-400 hover:text-slate-600"
        }`}
        aria-pressed={isAi}
      >
        AI
      </button>

      <button
        type="button"
        disabled={blocked}
        onClick={() => onSelect(isAi ? "human" : "ai")}
        aria-label={isAi ? "Switch to human control" : "Switch to AI auto-reply"}
        className={`relative w-[38px] h-[22px] rounded-full border flex-shrink-0 transition-colors cursor-pointer disabled:cursor-not-allowed ${
          isAi
            ? "bg-[#0396A6]/12 border-[#0396A6]/35"
            : "bg-[#FF7A5E]/12 border-[#FF7A5E]/35"
        }`}
      >
        {loading ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={12} className="animate-spin text-slate-500" />
          </span>
        ) : (
          <span
            className={`absolute top-[2px] w-[16px] h-[16px] rounded-full shadow-sm transition-all duration-200 ease-out ${
              isAi
                ? "left-[2px] bg-[#0396A6]"
                : "left-[calc(100%-18px)] bg-[#FF7A5E]"
            }`}
          />
        )}
      </button>

      <button
        type="button"
        disabled={blocked}
        onClick={() => {
          if (isAi) onSelect("human");
        }}
        className={`text-[10px] font-extrabold uppercase tracking-wide transition-colors cursor-pointer disabled:cursor-not-allowed ${
          !isAi ? "text-[#FF7A5E]" : "text-slate-400 hover:text-slate-600"
        }`}
        aria-pressed={!isAi}
      >
        HUMAN
      </button>
    </div>
  );
};
