"use client";

/**
 * /impersonate/session-ended — shown to the Frostrek admin when the merchant
 * revokes their support session (or the session expires / is ended server-side).
 *
 * The admin arrives here because ImpersonationContext redirects them the moment
 * a `support_session_ended` WebSocket frame is received and the admin's
 * impersonation token is cleared from sessionStorage.
 */

import React from "react";
import { ShieldOff, LogOut, ArrowLeft } from "lucide-react";

export default function ImpersonateSessionEndedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 text-zinc-900 dark:text-zinc-100">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <ShieldOff className="w-8 h-8 text-amber-500" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-xl font-bold text-center mb-2">Support session ended</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6 leading-relaxed">
          The merchant has revoked this support session. Your access token is no
          longer valid and all activity has been audited.
        </p>

        {/* Info box */}
        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
          <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">What happened?</p>
          <p>
            The merchant clicked &ldquo;Revoke access&rdquo; in their dashboard, ending your
            impersonation session immediately. All actions taken during the session
            remain in the audit log.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => window.close()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <LogOut className="w-4 h-4" />
            Close this tab
          </button>

          <button
            type="button"
            onClick={() => {
              // Try to go back to wherever the admin came from (Frostrek Dashboard).
              // If history is empty (new tab), this is a no-op and we fall back to the close button.
              window.history.length > 1 ? window.history.back() : window.close();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back to Frostrek Dashboard
          </button>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
          Frostrek Support &mdash; All sessions are audited end-to-end.
        </p>
      </div>
    </div>
  );
}
