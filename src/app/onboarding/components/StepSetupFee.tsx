"use client";

import { useEffect, useState, useCallback } from "react";
import { useWorkspace } from "@/lib/workspace";
import { isCancelled, isSuspended } from "@/lib/entitlements";
import { apiRequest } from "@/lib/api";
import type { Subscription } from "@/lib/types";
import { inr } from "@/lib/format";
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Props {
  onCompleted?: () => void;
}

export function StepSetupFee({ onCompleted }: Props) {
  const { entitlements, reload } = useWorkspace();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const sub = await apiRequest<Subscription>("/v1/billing/subscription");
      setSubscription(sub);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setupFeePaid =
    (Boolean(entitlements?.setup_fee_paid) || !entitlements?.setup_fee_required) &&
    !isCancelled(entitlements) &&
    !isSuspended(entitlements);

  const handleContinueSelfServe = () => {
    if (onCompleted) onCompleted();
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">Checking setup fee status…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {setupFeePaid ? (
        <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-emerald-950 font-display">
                  {entitlements?.setup_fee_required
                    ? "Setup Fee Cleared & Active"
                    : "No Setup Fee Required"}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 uppercase tracking-wider">
                  {entitlements?.setup_fee_required ? "Verified" : "Self-serve"}
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                {entitlements?.setup_fee_required
                  ? "Your workspace onboarding fee is confirmed. You have full access to AI agent provisioning."
                  : "Your plan is self-serve — there is nothing to pay on this step. Continue to create your agent."}
              </p>
            </div>
          </div>

          {onCompleted && (
            <button
              onClick={onCompleted}
              className="px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-all flex items-center gap-2 shrink-0 shadow-sm"
            >
              <span>Continue to Create Agent</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="p-6 bg-surface-container-low border border-border/80 rounded-2xl flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-base text-on-surface font-display">One-Time Workspace Setup Fee</h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                If your selected tier includes a setup fee (e.g. Assisted Onboarding or Enterprise Tier), it is required before live production traffic can be processed. Self-serve plans do not require a setup fee.
              </p>
            </div>
          </div>

          <div className="p-4 bg-surface rounded-xl border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-on-surface-variant">Setup Verification Status</span>
              <p className="text-sm font-bold text-on-surface mt-0.5">
                {entitlements?.setup_fee_required ? "Action Required: Settle Setup Fee" : "Optional / Self-Serve Active"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {entitlements?.setup_fee_required ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      reload();
                      void load();
                    }}
                    className="px-4 py-2 bg-surface-container border border-border text-on-surface rounded-lg text-xs font-semibold hover:bg-surface-container-high transition-colors"
                  >
                    Refresh Status
                  </button>
                  <Link
                    href="/billing"
                    target="_blank"
                    className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:brightness-110 transition-all flex items-center gap-1.5"
                  >
                    <span>Go to Billing Checkout</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleContinueSelfServe}
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-sm"
                >
                  <span>Continue to Create Agent</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
