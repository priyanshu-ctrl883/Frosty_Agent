"use client";

import { useState } from "react";
import { BrainCircuit, CheckCircle2, Lock, Mail, Plug } from "lucide-react";
import { WebsiteKnowledgeTab } from "@/components/website/WebsiteKnowledgeTab";
import { Button } from "@/components/ui/Button";
import {
  disconnectEmailGoogle,
  startEmailGoogleConnect,
  type EmailStatus,
} from "@/lib/emailAutomation";

type Props = {
  /** The selected Email Agent (Multi Email Agent — D269). Connect/disconnect and the KB are scoped
   *  to this agent. */
  agentId: string;
  status: EmailStatus | null;
  /** Whether the current user holds `kb:edit`. Without it the Knowledge Base API refuses every
   *  write, so we show a read-only notice instead of upload/import actions that would 403. */
  canEditKb: boolean;
  /** Whether the current user holds `inbox:reply` — required to connect/disconnect the inbox. */
  canManage: boolean;
  /** Refetch status after a connect/disconnect so the card and the rest of the page stay in sync. */
  onStatusChange: () => void;
};

/**
 * The Email Agent's "Settings" tab: a single dedicated Email Knowledge Base. The merchant uploads
 * the file(s) describing everything the email agent should know (prices, policies, FAQs) here, and
 * that content is the source of truth for every drafted / auto-sent reply — replies quote only what
 * is in these files and never invent prices or policies. No agent selection: uploads land in the
 * exact KB the drafter retrieves from (`status.agent_id`).
 */
export function EmailSettingsTab({ agentId, status, canEditKb, canManage, onStatusChange }: Props) {
  const kbAgentId = status?.agent_id ?? agentId;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto" data-lenis-prevent>
      <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-6">
        <EmailAccountCard
          agentId={agentId}
          status={status}
          canManage={canManage}
          onStatusChange={onStatusChange}
        />

        {/* Intro card */}
        <section className="rounded-2xl border border-[#d9edee] bg-white p-5 shadow-[0_1px_2px_rgba(33,29,25,0.04)]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f6f7] text-[#0396A6]">
              <BrainCircuit size={18} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-zinc-900">Knowledge brain for replies</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Upload the file(s) that describe everything your email agent should know &mdash;
                prices, policies, FAQs, and details. After an email is classified, the agent
                retrieves matching context from these files and drafts a reply with Gemini. It quotes
                only what is in the files and will never invent a price or policy that is not here.
              </p>
            </div>
          </div>
        </section>

        {/* The dedicated Email Knowledge Base — only for users who can edit it */}
        {!canEditKb ? (
          <section className="rounded-2xl border border-[#d9edee] bg-white p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
              <Lock size={18} strokeWidth={1.8} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">
              You don&apos;t have access to edit the Knowledge Base
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
              Managing the email Knowledge Base requires the <code>kb:edit</code> permission. Ask a
              workspace owner or manager to grant it, or sign in with an account that has it.
            </p>
          </section>
        ) : kbAgentId ? (
          <section className="rounded-2xl border border-[#d9edee] bg-white p-5 shadow-[0_1px_2px_rgba(33,29,25,0.04)]">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Email Knowledge Base</h3>
            <WebsiteKnowledgeTab webAgentId={kbAgentId} showLibraryImport={false} />
          </section>
        ) : (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm text-amber-700">
              Your workspace has no agent yet, so there is nowhere to store the email knowledge.
              Create an agent first, then upload your email knowledge file here.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * The Email Agent's DEDICATED Gmail connection (D268), managed here and stored separately from the
 * workspace/calendar Google account. This inbox is what the agent reads and sends from — strictly:
 * the agent shows "not connected" until a merchant connects one here, even if a calendar Google
 * account exists.
 */
function EmailAccountCard({
  agentId,
  status,
  canManage,
  onStatusChange,
}: {
  agentId: string;
  status: EmailStatus | null;
  canManage: boolean;
  onStatusChange: () => void;
}) {
  const [busy, setBusy] = useState<"connect" | "disconnect" | null>(null);
  const connected = !!status?.google_connected;
  const needsReconnect = status?.state === "needs_reconnect";
  const unconfigured = status?.state === "oauth_unconfigured";

  const onConnect = async () => {
    setBusy("connect");
    try {
      const { authorization_url } = await startEmailGoogleConnect(agentId);
      window.location.href = authorization_url;
    } catch {
      setBusy(null);
    }
  };

  const onDisconnect = async () => {
    setBusy("disconnect");
    try {
      await disconnectEmailGoogle(agentId);
      onStatusChange();
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-2xl border border-[#d9edee] bg-white p-5 shadow-[0_1px_2px_rgba(33,29,25,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f6f7] text-[#0396A6]">
            <Mail size={18} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900">Email account</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Connect the Gmail account this agent should manage. It is separate from your
              calendar/workspace Google connection &mdash; the email agent reads and replies only
              from the inbox you connect here.
            </p>

            {connected ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 size={13} strokeWidth={2} />
                  {needsReconnect ? "Connected (needs reconnect)" : "Connected"}
                </span>
                {status?.connected_email ? (
                  <span className="text-sm font-medium text-zinc-700">{status.connected_email}</span>
                ) : null}
              </div>
            ) : (
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
                  <Plug size={13} strokeWidth={2} />
                  {unconfigured ? "Unavailable on this deployment" : "Not connected"}
                </span>
              </div>
            )}

            {needsReconnect ? (
              <p className="mt-2 text-xs text-amber-600">
                This inbox is connected but has not granted permission to read mail yet. Reconnect
                once to enable email automation.
              </p>
            ) : null}
          </div>
        </div>

        {!unconfigured ? (
          <div className="flex shrink-0 items-center gap-2">
            {connected ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!canManage || busy !== null}
                  onClick={() => void onConnect()}
                >
                  {busy === "connect" ? "Opening…" : "Reconnect"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={!canManage || busy !== null}
                  onClick={() => void onDisconnect()}
                >
                  {busy === "disconnect" ? "Disconnecting…" : "Disconnect"}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                disabled={!canManage || busy !== null}
                onClick={() => void onConnect()}
              >
                {busy === "connect" ? "Opening…" : "Connect Gmail"}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
