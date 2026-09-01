"use client";

import React from "react";
import type { RemoteClickState } from "@/lib/coBrowse/types";

interface ClickRippleProps {
  clicks: RemoteClickState[];
}

export function ClickRipple({ clicks }: ClickRippleProps) {
  if (clicks.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden">
      {clicks.map((click) => {
        const isAdmin = click.role === "admin";
        const color = isAdmin ? "rgba(20, 184, 166, 0.6)" : "rgba(245, 158, 11, 0.6)";

        return (
          <div
            key={click.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none animate-ping"
            style={{
              left: `${click.xRatio * 100}vw`,
              top: `${click.yRatio * 100}vh`,
              width: "28px",
              height: "28px",
              backgroundColor: color,
              animationDuration: "750ms",
            }}
          />
        );
      })}
    </div>
  );
}
