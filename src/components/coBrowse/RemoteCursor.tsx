"use client";

import React from "react";
import type { RemoteCursorState } from "@/lib/coBrowse/types";

interface RemoteCursorProps {
  cursor: RemoteCursorState | null;
}

export function RemoteCursor({ cursor }: RemoteCursorProps) {
  if (!cursor || !cursor.visible) return null;

  const isAdmin = cursor.role === "admin";
  const name = cursor.name || (isAdmin ? "Frostrek Support" : "Merchant Owner");
  const badgeColor = isAdmin
    ? "bg-teal-500 text-white shadow-teal-500/30"
    : "bg-amber-500 text-black shadow-amber-500/30";
  const arrowColor = isAdmin ? "#14b8a6" : "#f59e0b";

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 z-[9999] transition-transform duration-75 ease-out will-change-transform"
      style={{
        transform: `translate3d(${cursor.xRatio * 100}vw, ${cursor.yRatio * 100}vh, 0)`,
      }}
    >
      {/* SVG Arrow */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={arrowColor}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* Name Label Badge */}
      <div
        className={`absolute left-4 top-4 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap shadow-lg flex items-center gap-1 ${badgeColor}`}
      >
        <span>{isAdmin ? "🛡️" : "👤"}</span>
        <span>{name}</span>
      </div>
    </div>
  );
}
