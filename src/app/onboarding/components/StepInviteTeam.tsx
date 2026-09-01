"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { buildInviteUrl } from "@/lib/invite-url";
import type { InviteCreated, Team } from "@/lib/types";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Users,
} from "lucide-react";

interface Props {
  onCompleted?: () => void;
  onRefreshWorkspace?: () => void;
}

const ROLES = [
  { value: "manager", label: "Manager" },
  { value: "agent", label: "Agent" },
  { value: "viewer", label: "Viewer" },
] as const;

export function StepInviteTeam({ onCompleted, onRefreshWorkspace }: Props) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("agent");
  const [lastInvite, setLastInvite] = useState<InviteCreated | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiRequest<Team>("/v1/team");
      setTeam(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load team");
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const inviteUrl =
    lastInvite?.invite_token && typeof window !== "undefined"
      ? buildInviteUrl(window.location.origin, lastInvite.invite_token)
      : null;

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiRequest<InviteCreated>("/v1/team/invites", {
        method: "POST",
        body: { email: trimmed, role_name: role },
      });
      setLastInvite(res);
      setCopied(false);
      setEmail("");
      await load();
      onRefreshWorkspace?.();
      onCompleted?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to invite";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (loading) {
    return (
      <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">Loading team…</p>
      </div>
    );
  }

  const members = team?.members || [];
  const invites = team?.pending_invites || [];
  const hasAccess = members.length > 1 || invites.length > 0;

  return (
    <div className="space-y-5 max-w-lg">
      <p className="text-xs text-on-surface-variant leading-relaxed">
        Optional — invite someone who should see Inbox, meetings, or settings. Seats are enforced by
        your plan; the invite link is always shown so you can share it if email delivery is off.
      </p>

      {hasAccess ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <div className="text-xs text-emerald-900 space-y-1">
            <p className="font-semibold">Team access set up</p>
            <p>
              {members.length} member{members.length === 1 ? "" : "s"}
              {invites.length > 0 ? ` · ${invites.length} pending invite(s)` : ""}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface-container-low/50 p-3 flex gap-2 text-xs text-on-surface-variant">
          <Users className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Only you have access right now. Invite a teammate when you are ready.</span>
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-2 text-xs text-red-800">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          {/seat/i.test(error) ? (
            <Link href="/billing" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline pl-6">
              Add seats in Billing <ExternalLink className="w-3 h-3" />
            </Link>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleInvite} className="space-y-3 rounded-xl border border-border p-4 bg-surface">
        <h3 className="text-sm font-semibold text-on-surface">Invite by email</h3>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-container-lowest px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="teammate@company.com"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Role
          </span>
          <select
            value={role}
            onChange={(ev) => setRole(ev.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-container-lowest px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
        >
          {busy ? "Sending…" : "Send invite"}
        </button>
      </form>

      {lastInvite && inviteUrl ? (
        <div className="rounded-xl border border-border p-4 space-y-2 bg-surface-container-lowest">
          <p className="text-xs font-semibold text-on-surface">
            Invite for {lastInvite.invited_email}
            {lastInvite.delivery ? ` · delivery: ${lastInvite.delivery}` : ""}
          </p>
          <div className="flex gap-2 items-center">
            <code className="flex-1 text-[10px] break-all bg-surface-container px-2 py-1.5 rounded-lg border border-border">
              {inviteUrl}
            </code>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="shrink-0 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer hover:bg-surface-container"
            >
              <Copy className="w-3 h-3" />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : null}

      <Link
        href="/team"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        Open Team page <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}
