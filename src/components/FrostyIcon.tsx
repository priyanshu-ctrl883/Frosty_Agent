"use client";

import React from "react";
import { FrostyAgentMark } from "@/components/FrostyAgentMark";

export default function FrostyIcon({
  size = 28,
  rotation = 0,
  glow = 1,
  alpha = 1,
  className = "",
  color,
}: {
  size?: number;
  rotation?: number;
  glow?: number;
  alpha?: number;
  className?: string;
  color?: string;
}) {
  const invert =
    color === "#ffffff" ||
    color === "#fff" ||
    color === "white" ||
    color === "#FFFFFF";

  const filters = [
    glow > 0 ? `drop-shadow(0 0 ${glow * 8}px rgba(79, 209, 197, 0.45))` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{
        height: size,
        width: size,
        opacity: alpha,
        transform: rotation ? `rotate(${rotation}rad)` : undefined,
        filter: filters || undefined,
      }}
    >
      <img
        src="/logo-small.png"
        alt="Frosty Logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}
