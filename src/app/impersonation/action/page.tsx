"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, Clock, Check, X, AlertTriangle, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/constants";

type CapabilityPreview = {
  status: "pending" | "expired" | "approved" | "denied" | "invalid";
  merchant_name?: string;
  staff_email?: string;
  reason?: string;
  ttl_minutes?: number;
  expires_at?: string;
};

function CapabilityActionInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<CapabilityPreview | null>(null);
  const [acting, setActing] = useState(false);
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setPreview({ status: "invalid" });
      return;
    }

    async function fetchPreview() {
      try {
        const res = await fetch(`${API_URL}/v1/impersonation/capability-action?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setPreview(json.data);
        } else {
          setPreview({ status: "invalid" });
        }
      } catch (err) {
        setPreview({ status: "invalid" });
      } finally {
        setLoading(false);
      }
    }

    void fetchPreview();
  }, [token]);

  async function handleAction(decision: "approve" | "deny") {
    if (!token) return;
    setActing(true);
    try {
      const res = await fetch(`${API_URL}/v1/impersonation/capability-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, decision }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setResult({
          status: json.data.status,
          message:
            json.data.status === "approved"
              ? "Access approved! The support agent has been granted temporary dashboard navigation."
              : "Access request was denied.",
        });
      } else {
        setResult({
          status: "error",
          message: json.error?.message || "This link may have expired or already been used.",
        });
      }
    } catch (err) {
      setResult({
        status: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
          <p className="text-sm font-medium">Validating access link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 sm:p-8 text-zinc-900 dark:text-zinc-100">
        <div className="flex items-center gap-3 text-cyan-600 dark:text-cyan-400 mb-6">
          <div className="p-3 bg-cyan-500/10 rounded-xl">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight">Frostrek Support Access</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Single-use secure authorization</p>
          </div>
        </div>

        {result ? (
          <div
            className={`p-4 rounded-xl border text-sm font-medium mb-6 ${
              result.status === "approved"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                : result.status === "denied"
                ? "bg-zinc-500/10 border-zinc-500/20 text-zinc-700 dark:text-zinc-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300"
            }`}
          >
            {result.message}
          </div>
        ) : preview?.status === "pending" ? (
          <>
            <div className="space-y-3 mb-6 text-sm text-zinc-600 dark:text-zinc-300">
              <p>
                Frostrek support staff member{" "}
                <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{preview.staff_email}</strong> has
                requested <strong>{preview.ttl_minutes || 30}-minute</strong> temporary access to assist with your workspace{" "}
                <strong>{preview.merchant_name}</strong>.
              </p>

              {preview.reason ? (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Stated Reason:</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{preview.reason}</span>
                </div>
              ) : null}

              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                <Clock className="w-4 h-4 shrink-0" />
                <span>This authorization link is single-use and will expire in 10 minutes.</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => void handleAction("deny")}
                disabled={acting}
                className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                Deny
              </button>
              <button
                onClick={() => void handleAction("approve")}
                disabled={acting}
                className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {acting ? "Processing..." : "Approve"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold mb-1">Invalid or Expired Request</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
              This support authorization link has expired, already been resolved, or is invalid.
            </p>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
          <a
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            Go to Merchant Dashboard &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CapabilityActionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      }
    >
      <CapabilityActionInner />
    </Suspense>
  );
}
