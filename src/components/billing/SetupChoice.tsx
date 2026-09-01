"use client";

import { inr } from "@/lib/format";

export type SetupPath = "self_serve" | "assisted";

type SetupChoiceProps = {
  planSlug: string;
  setupFeeInr: number;
  setupFeeRequired: boolean;
  value: SetupPath | null;
  onChange: (value: SetupPath) => void;
  disabled?: boolean;
};

/** Growth+: pick self-serve vs assisted when an optional setup fee exists. */
export function SetupChoice({
  planSlug,
  setupFeeInr,
  setupFeeRequired,
  value,
  onChange,
  disabled,
}: SetupChoiceProps) {
  if (planSlug === "free" || planSlug === "enterprise") return null;

  if (setupFeeRequired) {
    return (
      <div
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 12,
          border: "1px solid #D9EDEE",
          background: "#F7F5F1",
          fontSize: 13,
          color: "#0A1A2F",
          lineHeight: 1.5,
        }}
      >
        <strong>Setup fee required</strong>
        <p style={{ margin: "6px 0 0", color: "#475569" }}>
          This plan includes a one-time setup fee of {inr(setupFeeInr)} (plus GST),
          collected with your first subscription payment. Going live is blocked until it is paid.
        </p>
      </div>
    );
  }

  if (setupFeeInr <= 0) return null;

  const card = (path: SetupPath, title: string, body: string) => {
    const selected = value === path;
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(path)}
        style={{
          textAlign: "left",
          padding: 14,
          borderRadius: 12,
          border: selected ? "2px solid #0396A6" : "1px solid #E2E8F0",
          background: selected ? "#EAF8F8" : "#FFFFFF",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, color: "#0A1A2F", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.45 }}>{body}</div>
      </button>
    );
  };

  return (
    <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#6B6970" }}>
        How do you want to go live?
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {card(
          "self_serve",
          "Self-serve — ₹0 setup",
          "Configure the agent yourself. No setup fee.",
        )}
        {card(
          "assisted",
          `Assisted — ${inr(setupFeeInr)} setup`,
          "Frostrek configures onboarding for you. One-time fee + GST after you subscribe.",
        )}
      </div>
    </div>
  );
}

export function needsSetupChoice(plan: {
  slug: string;
  setup_fee_inr?: string | number;
  setup_fee_required?: boolean;
}): boolean {
  if (plan.slug === "free" || plan.slug === "enterprise" || plan.setup_fee_required) return false;
  return Number(plan.setup_fee_inr || 0) > 0;
}
