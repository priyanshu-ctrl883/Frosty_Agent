"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { canFeature } from "@/lib/entitlements";
import { useWorkspace } from "@/lib/workspace";
import type { Agent, WaAccount } from "@/lib/types";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Lock,
} from "lucide-react";

interface Props {
  onCompleted?: () => void;
  onRefreshWorkspace?: () => void;
}

export function StepConnectWhatsApp({ onCompleted, onRefreshWorkspace }: Props) {
  const { entitlements } = useWorkspace();
  const allowsWhatsApp =
    canFeature(entitlements, "channel_whatsapp") ||
    entitlements?.plan_slug === "growth" ||
    entitlements?.plan_slug === "scale" ||
    entitlements?.plan_slug === "max";

  const [accounts, setAccounts] = useState<WaAccount[]>([]);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    waba_id: "",
    phone_number_id: "",
    access_token: "",
    label: "",
  });

  const load = useCallback(async () => {
    setError(null);
    try {
      const agents = await apiRequest<Agent[]>("/v1/agents");
      const wa =
        (agents || []).find((a) => a.mode === "whatsapp") ||
        (agents || []).find((a) => a.mode === "unified") ||
        null;
      setAgentId(wa?.id || null);
      const list = wa
        ? await apiRequest<WaAccount[]>(
            `/v1/wa/accounts?agent_id=${encodeURIComponent(wa.id)}`,
          )
        : [];
      setAccounts(list || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load WhatsApp accounts");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.waba_id.trim() || !form.phone_number_id.trim() || !form.access_token.trim()) {
      return;
    }
    if (!agentId) {
      setError("Create a WhatsApp agent first, then connect a number to it.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest("/v1/wa/connect", {
        method: "POST",
        body: {
          phone_number_id: form.phone_number_id.trim(),
          waba_id: form.waba_id.trim(),
          access_token: form.access_token.trim(),
          label: form.label.trim() || undefined,
          agent_id: agentId,
        },
      });
      setForm({ waba_id: "", phone_number_id: "", access_token: "", label: "" });
      await load();
      onRefreshWorkspace?.();
      onCompleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">Checking WhatsApp…</p>
      </div>
    );
  }

  if (!allowsWhatsApp) {
    return (
      <div className="space-y-4 max-w-lg">
        <div className="rounded-xl border border-border bg-surface-container-low/60 p-4 flex gap-3">
          <Lock className="w-5 h-5 text-on-surface-variant shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-on-surface">WhatsApp not on this plan</h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Your website widget can go live without WhatsApp. Upgrade Billing when you want a Meta
              Business number on the same agent.
            </p>
            <Link
              href="/billing"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mt-3 hover:underline"
            >
              Open Billing <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const connected = accounts.length > 0;

  return (
    <div className="space-y-5 max-w-lg">
      <p className="text-xs text-on-surface-variant leading-relaxed">
        Optional after website go-live. Paste Cloud API credentials — Frosty validates them with Meta
        and turns on continue-on-WhatsApp for entitled agents.
      </p>

      {connected ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-emerald-900">WhatsApp connected</h3>
            <ul className="mt-2 space-y-1">
              {accounts.map((a) => (
                <li key={a.id} className="text-xs text-emerald-800 truncate">
                  {a.label || a.phone_number || a.phone_number_id}
                  {a.is_default ? " · default" : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex gap-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border p-4 bg-surface">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-on-surface">
            {connected ? "Connect another number" : "Connect Meta WhatsApp"}
          </h3>
        </div>
        {(
          [
            ["waba_id", "WABA ID"],
            ["phone_number_id", "Phone number ID"],
            ["access_token", "Access token"],
            ["label", "Label (optional)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              {label}
            </span>
            <input
              type={key === "access_token" ? "password" : "text"}
              value={form[key]}
              onChange={(ev) => setForm((f) => ({ ...f, [key]: ev.target.value }))}
              required={key !== "label"}
              className="mt-1 w-full rounded-lg border border-border bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              autoComplete="off"
            />
          </label>
        ))}
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
        >
          {submitting ? "Connecting…" : "Connect WhatsApp"}
        </button>
      </form>

      <Link
        href="/whatsapp/connect"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        Full connect guide <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}
