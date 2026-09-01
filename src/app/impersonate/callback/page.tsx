"use client";

/**
 * /impersonate/callback — entry point for Frostrek support sessions.
 *
 * The Frostrek Dashboard opens a session via POST /platform/merchants/{id}/impersonate
 * and the API returns a redirect_url pointing here:
 *
 *   https://<merchant-app>/impersonate/callback?token=<impersonation_token>
 *
 * This page:
 *   1. Reads `?token` from the URL.
 *   2. Exchanges it with the backend to get session metadata (and to validate it).
 *   3. Stores the payload in sessionStorage via lib/impersonation.ts.
 *   4. Clears the token from the URL bar (replaceState) so it is not in browser history.
 *   5. Calls ImpersonationContext.refresh() so the banner / context are live immediately.
 *   6. Redirects to /home.
 *
 * If the token is missing, expired, or the backend rejects it the page shows a clear
 * error and does NOT enter the app.
 */

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, AlertTriangle, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/constants";
import { storeImpersonation, type ImpersonationPayload } from "@/lib/impersonation";
import { useImpersonation } from "@/lib/ImpersonationContext";

// Shape returned by GET /v1/impersonation/session (validate endpoint)
type SessionInfo = {
  session_id: string;
  merchant_id: string;
  admin_name: string | null;
  admin_user_id: string;
  reason: string | null;
  ticket_id: string | null;
  expires_at: string;
  status: "active";
};

type Phase = "validating" | "storing" | "error";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useImpersonation();

  const [phase, setPhase] = useState<Phase>("validating");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const raw = searchParams.get("token");

    if (!raw) {
      setErrorMsg("No impersonation token found in the URL.");
      setPhase("error");
      return;
    }

    async function run() {
      try {
        // Step 1: Validate the token by hitting the backend with it as the auth header.
        // GET /v1/impersonation/session returns session metadata when the token is valid.
        const res = await fetch(`${API_URL}/v1/impersonation/session`, {
          headers: {
            Authorization: `Bearer ${raw}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          let message = "This support session link has expired or is invalid.";
          try {
            const body = (await res.json()) as { error?: { message?: string } };
            if (body.error?.message) message = body.error.message;
          } catch { /* ignore parse errors */ }
          setErrorMsg(message);
          setPhase("error");
          return;
        }

        const body = (await res.json()) as { data: SessionInfo };
        const info = body.data;

        // Step 2: Store the full payload in sessionStorage.
        setPhase("storing");
        const payload: ImpersonationPayload = {
          token: raw!,
          session_id: info.session_id,
          merchant_id: info.merchant_id,
          admin_name: info.admin_name,
          reason: info.reason,
          ticket_id: info.ticket_id,
          expires_at: info.expires_at,
          stored_at: new Date().toISOString(),
        };
        storeImpersonation(payload);

        // Step 3: Remove the token from the URL bar BEFORE navigating so it never
        // appears in browser history or is captured by analytics / Referer headers.
        window.history.replaceState({}, "", "/impersonate/callback");

        // Step 4: Notify the context so the banner etc. activate immediately.
        refresh();

        // Step 5: Enter the app.
        router.replace("/home");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
        setErrorMsg(msg);
        setPhase("error");
      }
    }

    void run();
    // Only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── loading ───────────────────────────────────────────────────────────────
  if (phase === "validating" || phase === "storing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="flex flex-col items-center gap-4 text-zinc-500">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
              <Shield className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
            </div>
            <Loader2 className="w-5 h-5 text-cyan-600 absolute -bottom-1 -right-1 animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm">
              {phase === "validating" ? "Validating support session…" : "Starting session…"}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              You will be redirected in a moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── error ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-rose-500/10 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Session Error</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Frostrek support access
            </p>
          </div>
        </div>

        {/* Error message */}
        <div className="p-4 rounded-xl bg-rose-500/8 border border-rose-500/20 text-sm text-rose-700 dark:text-rose-300 mb-6">
          {errorMsg ?? "This support session link has expired or is invalid."}
        </div>

        {/* Context */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
          Support sessions are short-lived and single-use. If you need access, ask
          your Frostrek support contact to start a new session from the Frostrek
          Dashboard.
        </p>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <a
            href="/login"
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            Go to login →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ImpersonateCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
