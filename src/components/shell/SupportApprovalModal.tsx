"use client";

import React, { useState } from "react";
import type { SupportAccessRequestedEvent } from "@/lib/supportSocket";

interface SupportApprovalModalProps {
  request: SupportAccessRequestedEvent | null;
  onApprove: (sessionId: string) => Promise<void>;
  onDeny: (sessionId: string, reason?: string) => Promise<void>;
}

export function SupportApprovalModal({
  request,
  onApprove,
  onDeny,
}: SupportApprovalModalProps) {
  const [submitting, setSubmitting] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!request) return null;

  const adminName = request.admin.name || "Frostrek Support Staff";
  const duration = request.requested_ttl_minutes || 30;

  async function handleApprove() {
    if (!request) return;
    setSubmitting("approve");
    setError(null);
    try {
      await onApprove(request.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve support access.");
      setSubmitting(null);
    }
  }

  async function handleDeny() {
    if (!request) return;
    setSubmitting("deny");
    setError(null);
    try {
      await onDeny(request.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deny support access.");
      setSubmitting(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-approval-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg bg-[var(--surface,#18181b)] border border-[var(--border,#27272a)] rounded-2xl shadow-2xl overflow-hidden text-[var(--foreground,#fafafa)] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border,#27272a)] bg-gradient-to-r from-amber-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-bold border border-amber-500/30">
              🛡️
            </div>
            <div>
              <h2
                id="support-approval-title"
                className="text-lg font-semibold text-[var(--foreground,#fafafa)]"
              >
                Support Access Request
              </h2>
              <p className="text-xs text-[var(--muted-foreground,#a1a1aa)]">
                A Frostrek support engineer is requesting temporary access to your workspace.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <div className="p-4 bg-[var(--background,#09090b)] rounded-xl border border-[var(--border,#27272a)] space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--muted-foreground,#a1a1aa)] font-medium">Engineer</span>
              <span className="font-semibold text-[var(--foreground,#fafafa)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                {adminName}
              </span>
            </div>

            {request.ticket_id && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--muted-foreground,#a1a1aa)] font-medium">Ticket ID</span>
                <span className="font-mono text-amber-300 font-medium">{request.ticket_id}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--muted-foreground,#a1a1aa)] font-medium">Requested Duration</span>
              <span className="font-medium text-[var(--foreground,#fafafa)]">{duration} minutes</span>
            </div>

            {request.reason && (
              <div className="pt-2 border-t border-[var(--border,#27272a)] text-xs">
                <span className="text-[var(--muted-foreground,#a1a1aa)] block mb-1 font-medium">Reason provided:</span>
                <p className="p-2.5 bg-[var(--surface,#18181b)] rounded-lg text-[var(--foreground,#fafafa)] italic">
                  &ldquo;{request.reason}&rdquo;
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs text-teal-300 flex items-start gap-2.5">
            <span className="text-base leading-none">🔒</span>
            <span>
              All actions are logged in your <strong>Security Audit Log</strong> in real time. Destructive operations (billing changes, member deletion, API key reveal) remain permanently blocked. You can revoke access at any point.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-[var(--border,#27272a)] bg-[var(--background,#09090b)]/50 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={submitting !== null}
            onClick={handleDeny}
            className="px-4 py-2 text-xs font-semibold text-[var(--muted-foreground,#a1a1aa)] hover:text-red-400 hover:bg-red-500/10 border border-[var(--border,#27272a)] hover:border-red-500/30 rounded-xl transition-all disabled:opacity-50"
          >
            {submitting === "deny" ? "Denying..." : "Deny Access"}
          </button>

          <button
            type="button"
            disabled={submitting !== null}
            onClick={handleApprove}
            className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 rounded-xl shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting === "approve" ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <span>Approve Access</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
