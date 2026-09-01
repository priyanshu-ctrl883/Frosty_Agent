"use client";

import React, { useEffect, useState } from "react";
import { RemoteCursor } from "./RemoteCursor";
import { ClickRipple } from "./ClickRipple";
import type { RemoteCursorState, RemoteClickState, RemoteFocusState } from "@/lib/coBrowse/types";

interface CoBrowseOverlayProps {
  remoteCursor: RemoteCursorState | null;
  remoteClicks: RemoteClickState[];
  remoteFocus: RemoteFocusState | null;
}

export function CoBrowseOverlay({
  remoteCursor,
  remoteClicks,
  remoteFocus,
}: CoBrowseOverlayProps) {
  const [focusBox, setFocusBox] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  // Position the highlight box around the remotely focused element
  useEffect(() => {
    if (!remoteFocus?.selector) {
      setFocusBox(null);
      return;
    }

    try {
      const el = document.querySelector(remoteFocus.selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setFocusBox({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setFocusBox(null);
      }
    } catch {
      setFocusBox(null);
    }
  }, [remoteFocus?.selector]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9990] overflow-hidden">
      {/* Remote Cursor */}
      <RemoteCursor cursor={remoteCursor} />

      {/* Remote Click Ripples */}
      <ClickRipple clicks={remoteClicks} />

      {/* Remote Focus Highlight Ring */}
      {focusBox && (
        <div
          className={`absolute rounded-lg pointer-events-none transition-all duration-150 border-2 ${
            remoteFocus?.role === "admin"
              ? "border-teal-400 bg-teal-400/5 shadow-[0_0_12px_rgba(20,184,166,0.3)]"
              : "border-amber-400 bg-amber-400/5 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
          }`}
          style={{
            top: `${focusBox.top - window.scrollY}px`,
            left: `${focusBox.left - window.scrollX}px`,
            width: `${focusBox.width}px`,
            height: `${focusBox.height}px`,
          }}
        >
          {remoteFocus?.label && (
            <span
              className={`absolute -top-5 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded shadow ${
                remoteFocus.role === "admin"
                  ? "bg-teal-500 text-white"
                  : "bg-amber-500 text-black"
              }`}
            >
              {remoteFocus.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
