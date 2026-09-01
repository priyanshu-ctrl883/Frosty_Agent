import type { Plan } from "@/lib/types";
import type { BillingTerm } from "@/lib/corePlans";
import { getMarketingLaunchRates, getMarketingPresentation } from "@/lib/planMarketingPresentation";
import { DEFAULT_PRICING_CSV_BUNDLE } from "@/lib/pricingEngine";
import {
  catalogTermTotal,
  uiTermToApiCycle,
  type ApiBillingCycle,
} from "@/lib/planPricing";

const TERM_MONTHS: Record<ApiBillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  semi_annual: 6,
  annual: 12,
};

const launchTermTotal = (
  launch: NonNullable<ReturnType<typeof getMarketingLaunchRates>>,
  cycle: ApiBillingCycle,
): number => {
  switch (cycle) {
    case "monthly":
      return launch.monthly;
    case "quarterly":
      return launch.quarterly;
    case "semi_annual":
      return launch.semi_annual;
    case "annual":
      return launch.annual;
    default:
      return 0;
  }
};

export type PlanMarketingDisplay = {
  periodTotal: number;
  perMonth: number;
  termSavings: number;
  strikethroughPerMonth: string | null;
  showLaunchBadge: boolean;
};

/** Same launch-rate overlay as the marketing PricingSection (CSV when present, else DB). */
export const planMarketingDisplay = (
  plan: Plan,
  term: BillingTerm,
  marketingCsv: string = DEFAULT_PRICING_CSV_BUNDLE.plans,
): PlanMarketingDisplay => {
  const cycle = uiTermToApiCycle(term);
  const launch = getMarketingLaunchRates(plan.slug, "IN", marketingCsv);
  const presentation = getMarketingPresentation(plan.slug, "IN", marketingCsv);

  const dbPeriodTotal = catalogTermTotal(plan, cycle);
  const launchPeriodTotal = launch ? launchTermTotal(launch, cycle) : 0;
  const periodTotal = launchPeriodTotal > 0 ? launchPeriodTotal : dbPeriodTotal;

  const months = TERM_MONTHS[cycle];
  const perMonth = months > 0 ? Math.round(periodTotal / months) : periodTotal;

  const monthlyBenchmark = launch?.monthly ?? catalogTermTotal(plan, "monthly");
  const termSavings =
    term !== "monthly" && monthlyBenchmark > 0
      ? Math.max(0, monthlyBenchmark * months - periodTotal)
      : 0;

  return {
    periodTotal,
    perMonth,
    termSavings,
    strikethroughPerMonth: presentation?.strikethroughPrice || null,
    showLaunchBadge: Boolean(presentation?.showLaunchBadge),
  };
};
