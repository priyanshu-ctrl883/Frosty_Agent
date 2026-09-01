import {
  formatCurrencyAmount,
  type PlanDetails,
  type Region,
  type TierPricing,
} from "@/lib/pricingEngine";

/** Shape returned by GET /v1/public/plans (subset of merchant Plan). */
export type PublicPlanRow = {
  slug: string;
  name: string;
  plan_family: string;
  market: "in" | "intl";
  currency: "INR" | "USD";
  price_monthly: string;
  price_quarterly: string | null;
  price_semi_annual: string | null;
  price_annual: string;
  monthly_available: boolean;
  included_conversations: number | null;
  included_seats: number | null;
  overage_rate: string | null;
  allows_whatsapp: boolean;
  list_price_monthly?: string | null;
  show_launch_badge?: boolean;
};

const parseNum = (raw: string | null | undefined): number => {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

const tierPricing = (
  region: Region,
  benchmarkMonthly: number,
  termTotal: number,
  months: number,
  billingNote: string,
  strikethroughPrice: string,
): TierPricing => {
  const perMonth = months > 0 ? Math.round(termTotal / months) : termTotal;
  const annualizedSavings = (benchmarkMonthly - perMonth) * 12;
  return {
    price: formatCurrencyAmount(perMonth, region),
    rawPrice: perMonth,
    period: "/mo",
    billingNote,
    savings:
      annualizedSavings > 0
        ? `Save ${formatCurrencyAmount(annualizedSavings, region)}/yr`
        : undefined,
    totalBilled: termTotal,
    strikethroughPrice,
  };
};

const buildCorePricing = (
  region: Region,
  plan: PublicPlanRow,
  benchmarkMonthly: number,
  strikethroughPrice: string,
  termTotals: {
    monthly: number;
    quarterly: number;
    biannual: number;
    annual: number;
  },
): Record<string, TierPricing> => {
  const { monthly, quarterly, biannual, annual } = termTotals;

  const pricing: Record<string, TierPricing> = {};
  if (annual > 0) {
    pricing.annual = tierPricing(
      region,
      benchmarkMonthly,
      annual,
      12,
      `Billed annually (${formatCurrencyAmount(annual, region)})`,
      strikethroughPrice,
    );
  }
  if (biannual > 0) {
    pricing.biannual = tierPricing(
      region,
      benchmarkMonthly,
      biannual,
      6,
      `Billed 6 months (${formatCurrencyAmount(biannual, region)})`,
      strikethroughPrice,
    );
  }
  if (quarterly > 0) {
    pricing.quarterly = tierPricing(
      region,
      benchmarkMonthly,
      quarterly,
      3,
      `Billed quarterly (${formatCurrencyAmount(quarterly, region)})`,
      strikethroughPrice,
    );
  }
  if (monthly > 0 && plan.monthly_available) {
    pricing.monthly = tierPricing(
      region,
      benchmarkMonthly,
      monthly,
      1,
      "Billed monthly",
      strikethroughPrice,
    );
  }
  return pricing;
};

const buildCommercePricing = (
  region: Region,
  plan: PublicPlanRow,
  benchmarkMonthly: number,
  strikethroughPrice: string,
  termTotals: {
    trimonthly: number;
    biannual: number;
    annual: number;
  },
): Record<string, TierPricing> => {
  const { trimonthly, biannual, annual } = termTotals;

  const pricing: Record<string, TierPricing> = {};
  if (annual > 0) {
    pricing.annual = tierPricing(
      region,
      benchmarkMonthly,
      annual,
      12,
      `Billed annually (${formatCurrencyAmount(annual, region)})`,
      strikethroughPrice,
    );
  }
  if (biannual > 0) {
    pricing.biannual = tierPricing(
      region,
      benchmarkMonthly,
      biannual,
      6,
      `Billed 6 months (${formatCurrencyAmount(biannual, region)})`,
      strikethroughPrice,
    );
  }
  if (trimonthly > 0) {
    pricing.trimonthly = tierPricing(
      region,
      benchmarkMonthly,
      trimonthly,
      3,
      `Billed 3 months (${formatCurrencyAmount(trimonthly, region)}) · Min Term`,
      strikethroughPrice,
    );
  }
  return pricing;
};

export const publicPlanToDetails = (plan: PublicPlanRow, region: Region): PlanDetails => {
  const family = (plan.plan_family || "core").toLowerCase();
  const convos = plan.included_conversations ?? 0;
  const seats = plan.included_seats ?? 2;
  const overage =
    region === "IN"
      ? plan.overage_rate
        ? `₹${parseNum(plan.overage_rate)}`
        : ""
      : plan.overage_rate
        ? `$${parseNum(plan.overage_rate)}`
        : "";

  const monthly = parseNum(plan.price_monthly);
  const quarterly = parseNum(plan.price_quarterly);
  const biannual = parseNum(plan.price_semi_annual);
  const annual = parseNum(plan.price_annual);

  const listMonthly = parseNum(plan.list_price_monthly);
  const perMonthAnnual = annual > 0 ? Math.round(annual / 12) : 0;
  const benchmarkMonthly = listMonthly > 0 ? listMonthly : monthly || perMonthAnnual;
  const strikethroughPrice =
    listMonthly > 0 && (perMonthAnnual > 0 ? listMonthly > perMonthAnnual : listMonthly > monthly)
      ? formatCurrencyAmount(listMonthly, region)
      : "";
  const showLaunchBadge = Boolean(plan.show_launch_badge);

  const pricing =
    family === "commerce"
      ? buildCommercePricing(region, plan, benchmarkMonthly, strikethroughPrice, {
          trimonthly: quarterly || monthly,
          biannual,
          annual,
        })
      : buildCorePricing(region, plan, benchmarkMonthly, strikethroughPrice, {
          monthly,
          quarterly,
          biannual,
          annual,
        });

  return {
    tag: plan.name.toUpperCase(),
    name: plan.name,
    conversations: `${convos.toLocaleString()} conversations`,
    monthlyConvosNum: convos,
    seats: `${seats} team seats`,
    seatsNum: seats,
    webChannels: 1,
    waChannels: plan.allows_whatsapp ? 1 : 0,
    overage,
    cta: "Start 7-Day Free Trial",
    ctaLink: "/login",
    highlighted: plan.slug === "growth",
    strikethroughPrice,
    showLaunchBadge,
    pricing,
  };
};

export const buildCatalogFromPublicPlans = (
  plans: PublicPlanRow[],
  region: Region,
): { core: PlanDetails[]; commerce: PlanDetails[] } => {
  const core: PlanDetails[] = [];
  const commerce: PlanDetails[] = [];
  for (const row of plans) {
    const details = publicPlanToDetails(row, region);
    if ((row.plan_family || "core").toLowerCase() === "commerce") {
      commerce.push(details);
    } else {
      core.push(details);
    }
  }
  return { core, commerce };
};

export type DbPricingCatalog = {
  source: "db";
  IN: { core: PlanDetails[]; commerce: PlanDetails[] };
  INTL: { core: PlanDetails[]; commerce: PlanDetails[] };
};
