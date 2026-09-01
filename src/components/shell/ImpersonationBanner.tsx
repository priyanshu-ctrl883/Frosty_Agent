"use client";

/**
 * ImpersonationBanner (Prompts 8 & 9 — Persistent sticky banner, live presence & activity trigger).
 *
 * High-visibility, non-dismissible amber status bar shown whenever a Frostrek
 * support session is active in the workspace.
 *
 * Features:
 *   - Live countdown timer derived from expiresAt.
 *   - Admin identity, ticket ID, stated reason.
 *   - "Activity Feed (N)" button that toggles SupportActivityPanel.
 *   - "Exit session" (admin) / "Revoke access" (merchant) button.
 */

import React, { useEffect, useState } from "react";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { Shield, Clock, Loader2, LogOut, Activity, Radio, Users } from "lucide-react";
import { SupportActivityPanel } from "./SupportActivityPanel";

export function ImpersonationBanner() {
  const {
    isImpersonating,
    isSupportActive,
    adminName,
    reason,
    ticketId,
    expiresAt,
    recentActivities,
    drivingMode,
    isDriver,
    setDrivingMode,
    endSession,
  } = useImpersonation();

  const [ending, setEnding] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsRemaining(null);
      return;
    }
    const exp = new Date(expiresAt).getTime();
    if (Number.isNaN(exp)) return;

    function updateTimer() {
      const diff = Math.max(0, Math.floor((exp - Date.now()) / 1000));
      setSecondsRemaining(diff);
      if (diff === 0) {
        void endSession();
      }
    }

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, endSession]);

  if (!isSupportActive && !isImpersonating) {
    return null;
  }

  async function handleExit() {
    setEnding(true);
    try {
      await endSession();
    } finally {
      setEnding(false);
    }
  }

  const mins = secondsRemaining !== null ? Math.floor(secondsRemaining / 60) : null;
  const secs = secondsRemaining !== null ? secondsRemaining % 60 : null;
  const countdownFormatted =
    mins !== null && secs !== null
      ? `${mins}m ${secs < 10 ? "0" : ""}${secs}s`
      : null;

  return (
    <>
      <aside
        className="sticky top-0 z-[200] w-full shrink-0 bg-amber-500 text-amber-950 dark:bg-amber-500 dark:text-amber-950 border-b border-amber-600/30 shadow-md transition-all"
        role="region"
        aria-label="Active support session alert"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-medium">
          {/* Left: Indicator & Staff Details */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial">
            <div className="relative flex items-center justify-center p-1.5 bg-amber-950/10 rounded-lg shrink-0">
              <Shield className="w-4 h-4 text-amber-950" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-900 animate-pulse" />
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
              <span className="font-bold tracking-tight whitespace-nowrap">
                {isImpersonating ? "Support Mode:" : "Support Viewing Account:"}
              </span>
              <span className="text-amber-950/90 truncate">
                {adminName || "Frostrek Support"}
                {ticketId ? ` (#${ticketId})` : ""}
              </span>
              {reason ? (
                <span className="hidden xl:inline text-amber-950/75 italic">
                  — “{reason}”
                </span>
              ) : null}
            </div>
          </div>

          {/* Right: Co-Browse Status, Controls, Activity Drawer Toggle, Timer & Exit Button */}
          <div className="flex items-center gap-2 self-auto shrink-0 flex-wrap">
            {/* Live Co-Browse Status Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/15 border border-emerald-900/20 text-emerald-950 rounded-md text-xs font-semibold"
              title="Real-time co-browsing and cursor mirroring is live"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <Radio className="w-3 h-3 text-emerald-900" />
              <span className="hidden md:inline">Live Co-Browse</span>
            </div>

            {/* Driving Mode Selector */}
            <div className="inline-flex items-center gap-1 bg-amber-950/10 rounded-lg p-0.5 text-[11px] font-semibold">
              <Users className="w-3 h-3 text-amber-950 ml-1.5" />
              <select
                value={drivingMode}
                onChange={(e) => setDrivingMode(e.target.value as "admin" | "merchant" | "both")}
                className="bg-transparent text-amber-950 text-[11px] font-bold py-0.5 pl-1 pr-1.5 rounded focus:outline-none cursor-pointer"
                title="Change who drives page navigation and interactions"
              >
                <option value="admin" className="text-black bg-white">Driver: Support</option>
                <option value="merchant" className="text-black bg-white">Driver: Merchant</option>
                <option value="both" className="text-black bg-white">Driver: Both</option>
              </select>
            </div>

            {/* Live Activity Button */}
            <button
              type="button"
              onClick={() => setShowActivityDrawer(true)}
              className="flex items-center gap-1.5 px-2 py-1 bg-amber-950/10 hover:bg-amber-950/20 active:bg-amber-950/25 text-amber-950 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Open real-time activity stream"
            >
              <Activity className="w-3.5 h-3.5 text-amber-950 animate-pulse" />
              <span className="hidden sm:inline">Activity</span>
              {recentActivities.length > 0 && (
                <span className="font-mono text-[10px] bg-amber-950/20 px-1.5 py-0.2 rounded-full">
                  {recentActivities.length}
                </span>
              )}
            </button>

            {countdownFormatted ? (
              <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-2 py-1 bg-amber-950/15 rounded-md text-amber-950">
                <Clock className="w-3.5 h-3.5" />
                <span>{countdownFormatted}</span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleExit}
              disabled={ending}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950 hover:bg-amber-900 active:bg-amber-950 text-amber-50 rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-950 cursor-pointer"
            >
              {ending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span>{isImpersonating ? "Exit" : "Revoke"}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Slide-over Activity Feed Drawer */}
      <SupportActivityPanel
        isOpen={showActivityDrawer}
        onClose={() => setShowActivityDrawer(false)}
      />
    </>
  );
}
