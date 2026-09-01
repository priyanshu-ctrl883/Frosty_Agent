"use client";

import React from "react";

export type TimelineRange = {
  label: string;
  labelFull?: string;
  labelMobile?: string;
  days: number;
};

export const DEFAULT_TIMELINE_RANGES: TimelineRange[] = [
  { label: "7d", labelMobile: "7D", labelFull: "7 Days", days: 7 },
  { label: "14d", labelMobile: "14D", labelFull: "14 Days", days: 14 },
  { label: "30d", labelMobile: "30D", labelFull: "30 Days", days: 30 },
  { label: "90d", labelMobile: "90D", labelFull: "90 Days", days: 90 },
];

export type TimelineFilterProps = {
  value: number;
  onChange: (days: number) => void;
  ranges?: TimelineRange[];
  disabled?: boolean;
  className?: string;
};

export function TimelineFilter({
  value,
  onChange,
  ranges = DEFAULT_TIMELINE_RANGES,
  disabled = false,
  className = "",
}: TimelineFilterProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Select timeline range"
      className={`inline-flex h-9 items-center rounded-full border border-[#E5E1DA] bg-[#F7F5F1] p-1 select-none ${className}`}
    >
      {ranges.map((r) => {
        const isActive = value === r.days;
        const shortLabel = (r.labelMobile || r.label).toUpperCase();
        return (
          <button
            key={r.days}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(r.days)}
            disabled={disabled}
            className={`inline-flex h-full min-w-[52px] items-center justify-center rounded-full px-4 text-[12px] leading-none transition-all duration-200 ${
              isActive
                ? "bg-white font-bold text-[#1A1A1A] shadow-[0_1px_4px_rgba(0,0,0,0.1),0_0_1px_rgba(0,0,0,0.06)]"
                : "bg-transparent font-semibold text-[#9D9891] hover:text-[#5A5650]"
            } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0396A6]/30`}
            style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}
          >
            {shortLabel}
          </button>
        );
      })}
    </div>
  );
}
