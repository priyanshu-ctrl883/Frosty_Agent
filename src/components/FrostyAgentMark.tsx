import React from "react";

export const FROSTY_LOGO_INK = "#0A1A2F";
export const FROSTY_LOGO_TEAL = "#4FD1C5";

export type FrostyAgentMarkProps = {
  size?: number;
  className?: string;
  ink?: string;
  teal?: string;
  /** Render mark in a single color (e.g. white on dark backgrounds). */
  monochrome?: string;
};

/**
 * Vector mark: stylised “F” bars + teal sparkle.
 * viewBox 0 0 40 28 — scale via `size` (height in px).
 */
export function FrostyAgentMark({
  size = 28,
  className = "",
  ink = FROSTY_LOGO_INK,
  teal = FROSTY_LOGO_TEAL,
  monochrome,
}: FrostyAgentMarkProps) {
  const width = Math.round((size * 40) / 28);
  const fill = monochrome ?? ink;
  const accent = monochrome ?? teal;

  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 40 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Vertical stem */}
      <path
        d="M8 2.5C6.2 2.5 5 3.6 5 5.2V21.8C5 24.2 6.4 25.5 8.8 25.5"
        stroke={fill}
        strokeWidth="4.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Top bar */}
      <rect x="5.5" y="0.8" width="28.5" height="5.2" rx="2.6" fill={fill} />
      {/* Middle bar */}
      <rect x="5.5" y="10.6" width="21.5" height="5.2" rx="2.6" fill={fill} />
      {/* Bottom bar */}
      <rect x="5.5" y="20.4" width="10.5" height="5.2" rx="2.6" fill={fill} />
      {/* Sparkle */}
      <path
        d="M32.2 8.2L33.1 11.1L36.1 11.6L33.1 12.1L32.2 15L31.3 12.1L28.3 11.6L31.3 11.1L32.2 8.2Z"
        fill={accent}
      />
    </svg>
  );
}

export default FrostyAgentMark;
