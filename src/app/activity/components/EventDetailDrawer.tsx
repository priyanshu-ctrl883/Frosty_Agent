"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Clock,
  User,
  Layers,
  Globe,
  Code,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import type { AuditEvent } from "@/lib/types";
import {
  actorInfo,
  describeActivity,
  GROUP_META,
} from "@/lib/activityCopy";
import { dateTime, relative } from "@/lib/format";

interface EventDetailDrawerProps {
  event: AuditEvent | null;
  isOpen: boolean;
  onClose: () => void;
  membersByUserId: Map<string, { display_name: string; email: string; role: string }>;
  timezone?: string | null;
}

export function EventDetailDrawer({
  event,
  isOpen,
  onClose,
  membersByUserId,
  timezone,
}: EventDetailDrawerProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !event) return null;

  const copy = describeActivity(event);
  const who = actorInfo(event, membersByUserId);
  const failed = Boolean(event.status && event.status !== "success");
  const meta = GROUP_META[copy.group];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const jsonString = event.details ? JSON.stringify(event.details, null, 2) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer / Sheet Panel */}
      <div
        className="relative w-full max-w-lg bg-white shadow-2xl z-10 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300 ease-out border-l border-[var(--line)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--line)] flex items-center justify-between gap-3 bg-[var(--surface-container-lowest)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`material-symbols-outlined text-[24px] shrink-0 ${
                failed ? "text-red-600" : "text-[#0396A6]"
              }`}
            >
              {copy.icon}
            </span>
            <div className="min-w-0">
              <h2 id="drawer-title" className="text-base font-semibold text-[var(--ink)] truncate">
                {copy.title}
              </h2>
              <p className="text-xs font-mono text-[var(--muted)] truncate">
                {event.action}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {failed ? (
              <span className="text-xs font-medium text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Failed
              </span>
            ) : (
              <span className="text-xs font-medium text-[var(--muted)]">
                Logged
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line-soft)] transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Summary Callout */}
          <div className="p-3.5 rounded-xl bg-[#FAF9F7] border border-[var(--line)]">
            <span className="text-[11px] font-semibold text-[var(--muted)] block mb-1">
              Event Summary
            </span>
            <p className="text-sm font-medium text-[var(--ink)] leading-relaxed">
              {copy.summary}
            </p>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 gap-4">
            {/* Timestamp & Timing */}
            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-white">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4 text-[#0396A6]" />
                <span>Timestamp</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[var(--ink)]">
                  {dateTime(event.created_at, timezone)}
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span>Relative: {relative(event.created_at)}</span>
                  <span>•</span>
                  <span>UTC: {new Date(event.created_at).toUTCString()}</span>
                </div>
              </div>
            </div>

            {/* Performed By (Actor) */}
            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  <User className="w-4 h-4 text-[#0396A6]" />
                  <span>Performed By</span>
                </div>
                <span className="text-xs font-medium text-[var(--muted)]">
                  {who.role}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--ink)] truncate">
                  {who.name}
                </p>
                {event.actor_id && (
                  <div className="flex items-center gap-1 text-xs text-[var(--muted)] font-mono truncate mt-0.5">
                    <span>ID: {event.actor_id}</span>
                    <button
                      onClick={() => handleCopy(event.actor_id || "", "actor_id")}
                      className="p-1 hover:text-[var(--ink)] text-[var(--muted)] transition-colors"
                      title="Copy actor ID"
                    >
                      {copiedKey === "actor_id" ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Target Resource */}
            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-[#0396A6]" />
                  <span>Target Resource</span>
                </div>
                <span className="text-xs font-medium text-[var(--muted)]">
                  {copy.resourceKind}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--ink)] truncate">
                    {copy.resourceName}
                  </p>
                  {event.resource_id && (
                    <div className="flex items-center gap-1 text-xs text-[var(--muted)] font-mono truncate mt-0.5">
                      <span>Ref ID: {event.resource_id}</span>
                      <button
                        onClick={() => handleCopy(event.resource_id || "", "resource_id")}
                        className="p-1 hover:text-[var(--ink)] text-[var(--muted)] transition-colors"
                        title="Copy resource ID"
                      >
                        {copiedKey === "resource_id" ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {copy.href && (
                  <Link
                    href={copy.href}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0396A6] hover:underline px-2.5 py-1.5 rounded-lg bg-[#EAF8F8] shrink-0"
                  >
                    <span>View {copy.resourceKind}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>

            {/* Network & Device Info (if available) */}
            {(event.ip_address || event.user_agent) && (
              <div className="p-3.5 rounded-xl border border-[var(--line)] bg-white">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                  <Globe className="w-4 h-4 text-[#0396A6]" />
                  <span>Origin & Network</span>
                </div>
                <div className="space-y-1.5 text-xs text-[var(--ink)]">
                  {event.ip_address && (
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--muted)] w-20 shrink-0">IP Address:</span>
                      <span className="font-mono bg-[var(--surface-container-low)] px-1.5 py-0.5 rounded">
                        {event.ip_address}
                      </span>
                    </div>
                  )}
                  {event.user_agent && (
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--muted)] w-20 shrink-0">Client:</span>
                      <span className="font-mono text-[11px] text-[var(--muted-heavy)] break-all">
                        {event.user_agent}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* JSON Payload Inspector */}
            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[#0F172A] text-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <Code className="w-4 h-4 text-[#67C9CE]" />
                  <span>Payload Details</span>
                </div>
                {jsonString && (
                  <button
                    onClick={() => handleCopy(jsonString, "payload")}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    {copiedKey === "payload" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {jsonString ? (
                <pre className="text-xs font-mono p-3 bg-slate-950/80 rounded-lg overflow-x-auto text-emerald-400 leading-relaxed max-h-64 overflow-y-auto">
                  {jsonString}
                </pre>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No additional payload data recorded for this event.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-container-lowest)] flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-[var(--muted)] font-mono">
            Event ID #{event.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[var(--ink)] bg-[var(--surface-container-low)] hover:bg-[var(--line)] rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
