"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HardDrive, AlertTriangle, ArrowUpRight, RefreshCw, X, FileText, CheckCircle2 } from "lucide-react";
import { useStorageUsage } from "@/lib/useStorageUsage";

interface StorageUsageCardProps {
  compact?: boolean;
  showManageLink?: boolean;
  className?: string;
}

export function StorageUsageCard({
  compact = false,
  showManageLink = true,
  className = "",
}: StorageUsageCardProps) {
  const { usage, loading, error, refresh, isAtLimit, isNearLimit } = useStorageUsage();
  const [warningDismissed, setWarningDismissed] = useState(false);

  if (loading && !usage) {
    return (
      <div
        className={`rounded-2xl p-4 sm:p-5 bg-card border border-border/80 shadow-xs animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-muted" />
            <div className="w-24 h-4 bg-muted rounded-md" />
          </div>
          <div className="w-14 h-5 bg-muted rounded-full" />
        </div>
        <div className="w-36 h-6 bg-muted rounded-md mb-3" />
        <div className="w-full h-2 bg-muted rounded-full mb-2" />
        <div className="w-48 h-3 bg-muted rounded-md" />
      </div>
    );
  }

  if (error && !usage) {
    return null;
  }

  if (!usage) return null;

  const usedPct = Math.round(usage.usage_percentage * 10) / 10;
  const isOver = isAtLimit || usedPct >= 100;
  const isNear = isNearLimit || usedPct >= 90;
  const isWarn = usedPct >= 70 && !isNear && !isOver;

  // Visual tones
  const statusColor = isOver || isNear ? "rgb(255, 122, 94)" : isWarn ? "#f59e0b" : "#0396A6";
  const statusBg = isOver || isNear ? "rgba(255, 122, 94, 0.12)" : isWarn ? "rgba(245, 158, 11, 0.12)" : "rgba(3, 150, 166, 0.12)";
  const statusText = isOver ? "Limit Reached" : isNear ? "Near Limit" : isWarn ? "Elevated" : "Healthy";

  if (compact) {
    return (
      <div
        className={`rounded-xl p-3 bg-card border border-border/80 shadow-xs flex flex-col gap-2 ${className}`}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <HardDrive size={13} style={{ color: statusColor }} />
            <span>Storage</span>
          </div>
          <span className="font-bold" style={{ color: statusColor }}>
            {usage.used_formatted} / {usage.limit_formatted}
          </span>
        </div>
        <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, usedPct))}%`,
              backgroundColor: statusColor,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 bg-card border border-border/80 shadow-xs flex flex-col transition-all relative overflow-hidden ${className}`}
    >
      {/* Header with Title and Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: statusBg, color: statusColor }}
          >
            <HardDrive size={16} />
          </div>
          <div>
            <h4
              style={{ fontFamily: "Outfit, sans-serif" }}
              className="text-xs sm:text-sm font-bold text-foreground leading-tight"
            >
              Storage Usage
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {usage.remaining_formatted} remaining
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ backgroundColor: statusBg, color: statusColor }}
          >
            {statusText}
          </span>
          <button
            type="button"
            onClick={() => refresh()}
            className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/30 transition-colors"
            title="Refresh storage meter"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Primary Figures */}
      <div className="mb-2.5">
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{
              fontFamily: "Outfit, sans-serif",
              color: isOver ? "rgb(255, 122, 94)" : "var(--foreground)",
            }}
          >
            {usage.used_formatted}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            of {usage.limit_formatted}
          </span>
          <span className="ml-auto text-xs font-bold" style={{ color: statusColor }}>
            {usedPct}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mb-2.5">
        <div
          className="h-full rounded-full transition-all duration-400 ease-out"
          style={{
            width: `${Math.min(100, Math.max(0, usedPct))}%`,
            backgroundColor: statusColor,
          }}
        />
      </div>

      {/* Helper text */}
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
        Includes Knowledge Base files, images, and ticket attachments.
      </p>

      {/* Warning Notice for Near / Over Limit */}
      {isOver ? (
        <div
          className="rounded-xl p-2.5 mb-3 flex items-start gap-2 text-xs"
          style={{
            backgroundColor: "rgba(255, 122, 94, 0.1)",
            border: "1px solid rgba(255, 122, 94, 0.5)",
            color: "rgb(210, 60, 30)",
          }}
        >
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>Uploads blocked.</strong> Storage limit exceeded. Delete files or contact support to free up space.
          </div>
        </div>
      ) : isNear && !warningDismissed ? (
        <div
          className="rounded-xl p-2.5 mb-3 flex items-start gap-2 text-xs relative"
          style={{
            backgroundColor: "rgba(255, 122, 94, 0.08)",
            border: "1px dashed rgba(255, 122, 94, 0.5)",
            color: "rgb(210, 60, 30)",
          }}
        >
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <div className="flex-1 pr-4">
            <strong>Storage is {usedPct}% full.</strong> You are approaching your quota limit.
          </div>
          <button
            type="button"
            onClick={() => setWarningDismissed(true)}
            className="text-muted-foreground hover:text-foreground p-0.5 absolute top-1.5 right-1.5"
            title="Dismiss notice"
          >
            <X size={12} />
          </button>
        </div>
      ) : null}

      {/* Action footer */}
      {showManageLink && (
        <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Free up capacity:</span>
          <Link
            href="/knowledge?tab=manage"
            className="inline-flex items-center gap-1 font-semibold text-[#0396A6] hover:text-[#027D8A] hover:underline"
          >
            <span>Manage Files</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}
