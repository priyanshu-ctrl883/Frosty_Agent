/** Billing term keys shared by onboarding and dashboard (prices come from API / DB only). */

export type BillingTerm = "monthly" | "quarterly" | "semiannual" | "annual";

export const CORE_PLAN_TERMS: { id: BillingTerm; label: string; badge?: string }[] = [
  { id: "annual", label: "Annual", badge: "Save 20%" },
  { id: "semiannual", label: "6 Months", badge: "Save 15%" },
  { id: "quarterly", label: "Quarterly", badge: "Save 5%" },
  { id: "monthly", label: "Monthly" },
];

/** Billing page cycle toggles — keys match API `billing_cycle`. */
export const DASHBOARD_BILLING_CYCLES = [
  { key: "annual" as const, label: "Annual", save: "Save 20%" },
  { key: "semi_annual" as const, label: "6 Months", save: "Save 15%" },
  { key: "quarterly" as const, label: "Quarterly", save: "Save 5%" },
  { key: "monthly" as const, label: "Monthly", save: null as string | null },
];

export const toCoreBillingTerm = (
  cycle: "monthly" | "quarterly" | "semi_annual" | "annual",
): BillingTerm => (cycle === "semi_annual" ? "semiannual" : cycle);

const CORE_SLUG_ORDER: Record<string, number> = {
  starter: 1,
  growth: 2,
  scale: 3,
  max: 4,
};

/** Core tiers from GET /v1/billing/plans — same order as billing tab. */
export const sortCorePlans = <T extends { slug: string }>(plans: T[]): T[] =>
  [...plans]
    .filter((p) => p.slug in CORE_SLUG_ORDER)
    .sort((a, b) => (CORE_SLUG_ORDER[a.slug] ?? 99) - (CORE_SLUG_ORDER[b.slug] ?? 99));
