"use client";

/**
 * SupportActivityPanel (Prompt 9 — Real-time Impersonation Activity Feed).
 *
 * Slide-over drawer / popup panel showing real-time actions taken under the
 * active Frostrek support session.
 *
 * Consumes `recentActivities` from `ImpersonationContext`.
 */

import React from "react";
import { useImpersonation } from "@/lib/ImpersonationContext";
import {
  Activity,
  X,
  Eye,
  Edit3,
  Trash2,
  Settings,
  CreditCard,
  MessageSquare,
  Sparkles,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { relative } from "@/lib/format";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

function getActionIcon(action: string) {
  if (action.includes("view")) return <Eye className="w-3.5 h-3.5 text-blue-500" />;
  if (action.includes("update") || action.includes("edit") || action.includes("save"))
    return <Edit3 className="w-3.5 h-3.5 text-amber-500" />;
  if (action.includes("delete") || action.includes("remove"))
    return <Trash2 className="w-3.5 h-3.5 text-red-500" />;
  if (action.includes("setting"))
    return <Settings className="w-3.5 h-3.5 text-purple-500" />;
  if (action.includes("bill") || action.includes("payment"))
    return <CreditCard className="w-3.5 h-3.5 text-emerald-500" />;
  if (action.includes("message") || action.includes("chat") || action.includes("reply"))
    return <MessageSquare className="w-3.5 h-3.5 text-cyan-500" />;
  return <Sparkles className="w-3.5 h-3.5 text-zinc-500" />;
}

export function SupportActivityPanel({ isOpen, onClose }: Props) {
  const { recentActivities, adminName } = useImpersonation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[250] bg-black/40 backdrop-blur-xs flex justify-end transition-opacity duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Live Support Activity
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold">
                  {recentActivities.length}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Audited stream for {adminName || "Frostrek Support"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            aria-label="Close activity drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audit banner notice */}
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/50 dark:border-amber-900/30 flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Every navigation and mutation is recorded immutably in the audit log.</span>
        </div>

        {/* Activity feed list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {recentActivities.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-600 space-y-2">
              <Activity className="w-8 h-8 stroke-1 opacity-50" />
              <p className="text-xs font-medium">No activity recorded yet</p>
              <p className="text-[11px] text-zinc-400 max-w-xs">
                As the support agent navigates and assists you, real-time events will stream here.
              </p>
            </div>
          ) : (
            recentActivities.map((event, idx) => {
              const date = new Date(event.timestamp);
              const timeStr = !Number.isNaN(date.getTime())
                ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                : "Just now";

              return (
                <div
                  key={`${event.timestamp}-${idx}`}
                  className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/60 transition-colors space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs shrink-0">
                        {getActionIcon(event.action)}
                      </div>
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                        {event.label || event.action}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {timeStr}
                    </span>
                  </div>

                  {event.path && (
                    <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate pl-7">
                      {event.path}
                    </div>
                  )}

                  {event.admin_name && (
                    <div className="text-[10px] text-zinc-400 pl-7">
                      By <span className="font-medium text-zinc-600 dark:text-zinc-300">{event.admin_name}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 text-center text-[11px] text-zinc-400">
          Showing last {Math.min(50, recentActivities.length)} real-time events
        </div>
      </div>
    </div>
  );
}
