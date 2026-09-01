"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { Shield, Clock, Check, X, AlertTriangle, Loader2 } from "lucide-react";

export type PendingRequest = {
  has_pending: boolean;
  request_id?: string;
  staff_email?: string;
  merchant_id?: string;
  reason?: string;
  ttl_minutes?: number;
  created_at?: string;
  expires_at?: string;
};

export type ActiveSupportSession = {
  active: boolean;
  session_id?: string;
  staff_email?: string;
  reason?: string;
  started_at?: string;
  expires_at?: string;
};

export function SupportAccessIndicator({ onRevoked }: { onRevoked?: () => void }) {
  const [activeSession, setActiveSession] = useState<ActiveSupportSession | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    async function checkActive() {
      try {
        const res = await apiRequest<{ data: ActiveSupportSession }>("/v1/impersonation/active-session");
        if (res.data?.active) {
          setActiveSession(res.data);
        } else {
          setActiveSession(null);
        }
      } catch {}
    }
    void checkActive();
    const interval = setInterval(checkActive, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleRevoke() {
    if (!confirm("Revoke support access immediately? The support agent will be logged out on their next action.")) {
      return;
    }
    setRevoking(true);
    try {
      await apiRequest("/v1/impersonation/active-session/revoke", { method: "POST" });
      setActiveSession(null);
      onRevoked?.();
    } catch (err) {
      alert("Failed to revoke session. Please refresh and try again.");
    } finally {
      setRevoking(false);
    }
  }

  if (!activeSession?.active) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-medium">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong>Support Access Active:</strong> {activeSession.staff_email || "Frostrek Support"} is signed into this workspace.
        </span>
      </div>
      <button
        onClick={handleRevoke}
        disabled={revoking}
        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shrink-0 transition-colors disabled:opacity-50"
      >
        {revoking ? "Revoking..." : "Revoke Access"}
      </button>
    </div>
  );
}

export function SupportRequestModal() {
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [acting, setActing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function checkPending() {
      if (dismissed) return;
      try {
        const res = await apiRequest<{ data: PendingRequest }>("/v1/impersonation/requests/pending");
        if (res.data?.has_pending && res.data.expires_at) {
          setPending(res.data);
          const exp = new Date(res.data.expires_at).getTime();
          const diff = Math.max(0, Math.floor((exp - Date.now()) / 1000));
          setSecondsRemaining(diff);
        } else {
          setPending(null);
          setSecondsRemaining(null);
        }
      } catch {}
    }

    void checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, [dismissed]);

  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          setPending(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining]);

  async function handleApprove() {
    if (!pending?.request_id) return;
    setActing(true);
    try {
      await apiRequest(`/v1/impersonation/requests/${pending.request_id}/approve`, { method: "POST" });
      setPending(null);
      setDismissed(true);
    } catch (err) {
      alert("Could not approve request. It may have expired.");
      setPending(null);
    } finally {
      setActing(false);
    }
  }

  async function handleDeny() {
    if (!pending?.request_id) return;
    setActing(true);
    try {
      await apiRequest(`/v1/impersonation/requests/${pending.request_id}/deny`, { method: "POST" });
      setPending(null);
      setDismissed(true);
    } catch (err) {
      alert("Could not deny request.");
      setPending(null);
    } finally {
      setActing(false);
    }
  }

  if (!pending?.has_pending || secondsRemaining === 0) return null;

  const mins = Math.floor((secondsRemaining || 0) / 60);
  const secs = (secondsRemaining || 0) % 60;
  const timeFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 text-zinc-900 dark:text-zinc-100">
        <div className="flex items-center gap-3 text-cyan-600 dark:text-cyan-400 mb-4">
          <div className="p-2.5 bg-cyan-500/10 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Support Access Request</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Temporary dashboard navigation</p>
          </div>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-3">
          <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{pending.staff_email || "Frostrek Support"}</strong> has requested temporary <strong>{pending.ttl_minutes || 30}-minute</strong> access to assist you.
        </p>

        {pending.reason ? (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 rounded-lg text-xs mb-4">
            <span className="font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Reason:</span>
            <span className="text-zinc-800 dark:text-zinc-200">{pending.reason}</span>
          </div>
        ) : null}

        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg mb-6">
          <Clock className="w-4 h-4 shrink-0" />
          <span>Expires in <strong>{timeFormatted}</strong>. Critical billing actions remain blocked.</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDeny}
            disabled={acting}
            className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
          >
            Deny
          </button>
          <button
            onClick={handleApprove}
            disabled={acting}
            className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {acting ? "Approving..." : "Approve Access"}
          </button>
        </div>
      </div>
    </div>
  );
}
