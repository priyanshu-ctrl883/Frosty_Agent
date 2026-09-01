"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, HardDrive, ArrowUpRight, X } from "lucide-react";
import type { StorageUsage } from "@/lib/useStorageUsage";

interface StorageWarningBannerProps {
  usage: StorageUsage | null;
  className?: string;
  showNormalUsage?: boolean;
  dismissible?: boolean;
}

export function StorageWarningBanner({
  usage,
  className = "",
  showNormalUsage = false,
  dismissible = true,
}: StorageWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!usage) return null;

  const isAtLimit = usage.storage_used_bytes >= usage.storage_limit_bytes;
  const isNearLimit = !isAtLimit && usage.usage_percentage >= 90;

  if (dismissed && !isAtLimit) {
    return null;
  }

  if (!isAtLimit && !isNearLimit && !showNormalUsage) {
    return null;
  }

  // Limit reached state (Hard cap reached)
  if (isAtLimit) {
    return (
      <div
        className={`rounded-xl p-3.5 sm:p-4 flex flex-col gap-2.5 transition-all shadow-xs ${className}`}
        style={{
          backgroundColor: "rgba(255, 122, 94, 0.08)",
          border: "1.5px solid rgb(255, 122, 94)",
        }}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "rgba(255, 122, 94, 0.18)",
              color: "rgb(255, 122, 94)",
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className="text-xs sm:text-sm font-bold tracking-tight mb-0.5"
              style={{ color: "rgb(230, 85, 55)" }}
            >
              Storage limit reached. You have used {usage.used_formatted} of {usage.limit_formatted}.
            </h4>
            <p className="text-xs text-foreground/80 leading-relaxed mb-1.5">
              Uploads are blocked. Please free up space by deleting unused files or contact support to increase your limit.
            </p>
            <Link
              href="/knowledge?tab=manage"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[rgb(210,60,30)] hover:underline"
            >
              <span>Manage & delete files</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: "100%",
              backgroundColor: "rgb(255, 122, 94)",
            }}
          />
        </div>
      </div>
    );
  }

  // Approaching limit (>= 90% warning state)
  if (isNearLimit) {
    return (
      <div
        className={`rounded-xl p-3 sm:p-3.5 flex flex-col gap-2 transition-all relative ${className}`}
        style={{
          backgroundColor: "rgba(255, 122, 94, 0.06)",
          border: "1px dashed rgba(255, 122, 94, 0.7)",
        }}
      >
        <div className="flex items-start gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{
              backgroundColor: "rgba(255, 122, 94, 0.14)",
              color: "rgb(255, 122, 94)",
            }}
          >
            <AlertTriangle size={15} />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h4
              className="text-xs sm:text-sm font-bold tracking-tight mb-0.5"
              style={{ color: "rgb(230, 85, 55)" }}
            >
              Storage warning: {usage.usage_percentage}% used ({usage.used_formatted} of {usage.limit_formatted})
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You are approaching your storage limit. Delete unused files to prevent uploads from being blocked.{" "}
              <Link
                href="/knowledge?tab=manage"
                className="font-semibold text-[rgb(210,60,30)] hover:underline inline-flex items-center gap-0.5 ml-1"
              >
                <span>Manage files</span>
                <ArrowUpRight size={11} />
              </Link>
            </p>
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground p-1 absolute top-2 right-2 rounded-md"
              title="Dismiss warning"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, usage.usage_percentage)}%`,
              backgroundColor: "rgb(255, 122, 94)",
            }}
          />
        </div>
      </div>
    );
  }

  // Optional normal usage meter
  return (
    <div
      className={`rounded-xl p-3 flex items-center justify-between gap-3 text-xs bg-muted/20 border border-border ${className}`}
    >
      <div className="flex items-center gap-2">
        <HardDrive size={14} className="text-[#0396A6]" />
        <span className="text-muted-foreground">Storage usage:</span>
        <span className="font-semibold text-foreground">
          {usage.used_formatted} / {usage.limit_formatted} ({usage.usage_percentage}%)
        </span>
      </div>
      <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, usage.usage_percentage)}%`,
            backgroundColor: "#0396A6",
          }}
        />
      </div>
    </div>
  );
}

