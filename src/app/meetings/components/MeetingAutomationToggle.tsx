"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import type { AutomationPoliciesResponse, ToolMode } from "@/lib/types";
import { Info, Loader2, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspace } from "@/lib/workspace";
import { can } from "@/lib/permissions";

const MODE_LABELS: Record<ToolMode, string> = {
  ai: "AI",
  human: "Human",
  off: "Off",
};

export function MeetingAutomationToggle() {
  const [policies, setPolicies] = useState<AutomationPoliciesResponse["policies"]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [infoHovered, setInfoHovered] = useState(false);
  const { me } = useWorkspace();
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    try {
      const pol = await apiRequest<AutomationPoliciesResponse>("/v1/automation/policies");
      setPolicies(pol.policies);
      setLoadError(false);
    } catch (err) {
      console.error("Failed to load automation policies:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const meetingPolicy = policies.find((p) => p.control_key === "meetings");

  async function handleSetMode(mode: ToolMode) {
    if (!meetingPolicy || meetingPolicy.mode === mode) return;

    setBusy(true);
    try {
      const updatedPolicies = policies.map((p) =>
        p.control_key === "meetings" ? { ...p, mode } : p
      );
      
      setPolicies(updatedPolicies);

      const updated = await apiRequest<AutomationPoliciesResponse>("/v1/automation/policies", {
        method: "PUT",
        body: {
          policies: updatedPolicies.map((p) => ({ control_key: p.control_key, mode: p.mode })),
        },
      });
      setPolicies(updated.policies);
    } catch (err) {
      console.error("Failed to update policy:", err);
      setError(err instanceof Error ? err.message : "Failed to update policy");
      setTimeout(() => setError(null), 5000);
      void load();
    } finally {
      setBusy(false);
    }
  }

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setInfoHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setInfoHovered(false);
    }, 200);
  };

  if (!can(me?.permissions, "agent:config")) {
    return null;
  }

  // If the API failed (e.g. 500), hide the toggle gracefully rather than
  // showing an infinite loading skeleton.
  if (loadError) {
    return null;
  }

  if (loading || !meetingPolicy) {
    return (
      <div className="flex items-center gap-4 border border-[var(--lt-border)] rounded-full p-1.5 shadow-sm bg-white/50 backdrop-blur-sm animate-pulse h-[44px]">
        <div className="flex gap-1 bg-muted/20 p-1 rounded-full">
          <div className="h-7 w-12 bg-muted/40 rounded-full" />
          <div className="h-7 w-14 bg-muted/40 rounded-full" />
          <div className="h-7 w-10 bg-muted/40 rounded-full" />
        </div>
        <div className="flex items-center gap-2 pr-3">
          <div className="h-4 w-24 bg-muted/40 rounded" />
          <div className="h-4 w-4 bg-muted/40 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-4 border border-[var(--lt-border)] rounded-full p-1 shadow-sm bg-white/60 backdrop-blur-md">
      
      {/* 1. Automation Toggle Segmented Control (Left) */}
      <div 
        className="flex p-0.5 rounded-full border border-[var(--lt-border)] bg-[#FDFBF7]"
        role="group" 
        aria-label="Meeting scheduling mode"
      >
        {(["ai", "human", "off"] as ToolMode[]).map((m) => {
          const isActive = meetingPolicy.mode === m;
          return (
            <button
              key={m}
              type="button"
              disabled={busy}
              onClick={() => void handleSetMode(m)}
              className={`
                relative px-3.5 py-1 text-sm font-medium rounded-full transition-all duration-200
                ${isActive 
                  ? "text-[var(--brand,#0396A6)] bg-[var(--brand,#0396A6)]/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                }
              `}
            >
              {MODE_LABELS[m]}
            </button>
          );
        })}
      </div>

      {/* 2. Label & Info Popover (Right) */}
      <div 
        className="relative flex items-center gap-1.5 font-medium pr-3 text-[#1F2937]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        AI Scheduling
        <div className="text-muted-foreground hover:text-[#1F2937] transition-colors cursor-help">
          <Info className="w-4 h-4" />
        </div>

        <AnimatePresence>
          {infoHovered && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-[calc(100%+12px)] right-0 w-80 bg-white border border-[var(--lt-border)] rounded-xl shadow-xl z-[100] overflow-hidden cursor-default font-normal"
            >
              <div className="px-4 py-3 border-b border-[var(--lt-border)] bg-[#FDFBF7]">
                <h4 className="font-semibold text-sm text-[#1F2937]">Automation Controls</h4>
              </div>
              <div className="p-4 flex flex-col gap-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-[#1F2937] font-semibold">AI</strong> — Execute immediately when entitled.
                </p>
                <p>
                  <strong className="text-[#1F2937] font-semibold">Human</strong> — Prepare the action and add it to the approval inbox below.
                </p>
                <p>
                  <strong className="text-[#1F2937] font-semibold">Off</strong> — Block server-side; the agent cannot perform the action.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-[calc(100%+12px)] right-0 w-80 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-lg z-[100] p-3 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
