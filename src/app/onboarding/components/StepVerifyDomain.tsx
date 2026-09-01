"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { DomainVerificationStatus } from "@/lib/onboarding";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Globe,
  Info,
  ShieldCheck,
} from "lucide-react";

interface Props {
  onCompleted?: () => void;
  onRefreshWorkspace?: () => void;
}

export function StepVerifyDomain({ onCompleted, onRefreshWorkspace }: Props) {
  const [status, setStatus] = useState<DomainVerificationStatus | null>(null);
  const [domainInput, setDomainInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"meta" | "dns" | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiRequest<DomainVerificationStatus>(
        "/v1/settings/domain-verification",
      );
      setStatus(res);
      if (res.domain) setDomainInput(res.domain);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load domain status");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleClaim(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await apiRequest<DomainVerificationStatus>(
        "/v1/settings/domain-verification/claim",
        { method: "POST", body: { domain: domainInput.trim() } },
      );
      setStatus(res);
      if (res.domain) setDomainInput(res.domain);
      onRefreshWorkspace?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not claim domain");
    } finally {
      setBusy(false);
    }
  }

  async function handleCheck() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiRequest<DomainVerificationStatus>(
        "/v1/settings/domain-verification/check",
        { method: "POST", body: {} },
      );
      setStatus(res);
      onRefreshWorkspace?.();
      if (res.verified) onCompleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification check failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyText(kind: "meta" | "dns", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
    } catch {
      setCopied(null);
    }
  }

  if (loading) {
    return (
      <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">Loading domain verification…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div className="rounded-xl border border-border bg-surface-container-low/50 p-3 flex gap-2 text-xs text-on-surface-variant">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
        <span>
          Optional brand ownership check (meta tag or DNS TXT). The website widget still works if
          you skip this — verification does not block embeds.
        </span>
      </div>

      {status?.verified ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <div className="text-xs text-emerald-900">
            <p className="font-semibold inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              {status.domain} verified
            </p>
            {status.verified_at ? (
              <p className="mt-1 opacity-80">Verified at {new Date(status.verified_at).toLocaleString()}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex gap-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={handleClaim} className="space-y-3 rounded-xl border border-border p-4 bg-surface">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-on-surface">Claim your website domain</h3>
        </div>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Domain
          </span>
          <input
            type="text"
            required
            value={domainInput}
            onChange={(ev) => setDomainInput(ev.target.value)}
            placeholder="example.com"
            className="mt-1 w-full rounded-lg border border-border bg-surface-container-lowest px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-xl border border-border text-xs font-semibold disabled:opacity-50 cursor-pointer hover:bg-surface-container"
        >
          {busy ? "Saving…" : status?.token ? "Update claim" : "Claim domain"}
        </button>
      </form>

      {status?.token ? (
        <div className="space-y-3 rounded-xl border border-border p-4 bg-surface-container-lowest">
          <p className="text-xs text-on-surface-variant">
            Add one of these to prove you control {status.domain || "the site"}, then Check.
          </p>
          {status.meta_tag ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                HTML meta tag
              </p>
              <div className="flex gap-2 items-start">
                <code className="flex-1 text-[10px] break-all bg-surface px-2 py-1.5 rounded-lg border border-border">
                  {status.meta_tag}
                </code>
                <button
                  type="button"
                  onClick={() => void copyText("meta", status.meta_tag!)}
                  className="shrink-0 px-2 py-1.5 rounded-lg border border-border text-xs inline-flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  {copied === "meta" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          ) : null}
          {status.dns_txt ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                DNS TXT value
              </p>
              <div className="flex gap-2 items-start">
                <code className="flex-1 text-[10px] break-all bg-surface px-2 py-1.5 rounded-lg border border-border">
                  {status.dns_txt}
                </code>
                <button
                  type="button"
                  onClick={() => void copyText("dns", status.dns_txt!)}
                  className="shrink-0 px-2 py-1.5 rounded-lg border border-border text-xs inline-flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  {copied === "dns" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            disabled={busy || status.verified}
            onClick={() => void handleCheck()}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
          >
            {busy ? "Checking…" : status.verified ? "Already verified" : "Check verification"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
