"use client";

import React from "react";
import { FrostyAgentMark, FROSTY_LOGO_INK } from "@/components/FrostyAgentMark";

export type FrostyAgentLogoProps = {
  height?: number;
  variant?: "full" | "icon";
  /** Dark backgrounds: white wordmark + monochrome mark. */
  forceLight?: boolean;
  className?: string;
  alt?: string;
};

function FrostyAgentWordmark({
  height,
  light,
  className = "",
}: {
  height: number;
  light?: boolean;
  className?: string;
}) {
  const color = light ? "#FFFFFF" : FROSTY_LOGO_INK;
  const fontSize = Math.round(height * 0.72);

  return (
    <span
      className={`whitespace-nowrap ${className}`}
      style={{
        fontFamily:
          "var(--font-outfit), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        color,
      }}
    >
      <span style={{ fontWeight: 700 }}>Frosty</span>
      <span style={{ fontWeight: 400 }}> Agent</span>
    </span>
  );
}

export function FrostyAgentLogo({
  height = 32,
  variant = "full",
  forceLight = false,
  className = "",
  alt = "Frosty Agent",
}: FrostyAgentLogoProps) {
  const markSize = Math.round(height * 0.88);
  const gap = Math.round(height * 0.22);

  if (variant === "icon") {
    return (
      <span className={`inline-flex items-center ${className}`} role="img" aria-label={alt}>
        <FrostyAgentMark
          size={markSize}
          monochrome={forceLight ? "#FFFFFF" : undefined}
        />
      </span>
    );
  }

  if (forceLight) {
    return (
      <span
        className={`inline-flex items-center ${className}`}
        style={{ gap }}
        role="img"
        aria-label={alt}
      >
        <FrostyAgentMark size={markSize} monochrome="#FFFFFF" />
        <FrostyAgentWordmark height={height} light />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap }}
      role="img"
      aria-label={alt}
    >
      <FrostyAgentMark size={markSize} />
      <FrostyAgentWordmark height={height} />
    </span>
  );
}

export default FrostyAgentLogo;
