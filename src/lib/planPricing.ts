import type { Plan } from "@/lib/types";
import type { BillingTerm } from "@/lib/corePlans";
import { inr } from "@/lib/format";

/** API / subscribe billing_cycle values. */
export type ApiBillingCycle = "monthly" | "quarterly" | "semi_annual" | "annual";

export const GST_RATE = 0.18;

const TERM_MONTHS: Record<ApiBillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  semi_annual: 6,
  annual: 12,
};

export const uiTermToApiCycle = (term: BillingTerm): ApiBillingCycle =>
  term === "semiannual" ? "semi_annual" : term;

/** Ex-GST total charged each billing period — DB catalog (tenant_admin.plans). */
export const catalogTermTotal = (plan: Plan, cycle: ApiBillingCycle): number => {
  const raw =
    cycle === "monthly"
      ? plan.price_monthly ?? plan.price_monthly_inr
      : cycle === "quarterly"
        ? plan.price_quarterly ?? plan.price_quarterly_inr
        : cycle === "semi_annual"
          ? plan.price_semi_annual ?? plan.price_semi_annual_inr
          : plan.price_annual ?? plan.price_annual_inr;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Overage per extra conversation from DB plan row. */
export const planOverageRate = (plan: Plan): number => {
  const fromDb = Number(plan.overage_rate ?? plan.overage_rate_inr ?? plan.overage_rate_usd ?? 0);
  return Number.isFinite(fromDb) && fromDb > 0 ? fromDb : 0;
};

/** Ex-GST per-month equivalent for the selected billing term. */
export const planPerMonthExGst = (plan: Plan, cycle: ApiBillingCycle): number => {
  const total = catalogTermTotal(plan, cycle);
  const months = TERM_MONTHS[cycle];
  return months > 0 ? Math.round(total / months) : total;
};

export const gstInclusiveInr = (exGst: number): number =>
  Math.round(exGst * (1 + GST_RATE));

export type PlanChargeDisplay = {
  cycle: ApiBillingCycle;
  exGstPerMonth: number;
  exGstPeriodTotal: number;
  gstInclusivePeriodTotal: number;
};

export const planChargeDisplay = (plan: Plan, term: BillingTerm): PlanChargeDisplay => {
  const cycle = uiTermToApiCycle(term);
  const exGstPeriodTotal = catalogTermTotal(plan, cycle);
  const exGstPerMonth = planPerMonthExGst(plan, cycle);
  return {
    cycle,
    exGstPerMonth,
    exGstPeriodTotal,
    gstInclusivePeriodTotal: gstInclusiveInr(exGstPeriodTotal),
  };
};

export type PlanDisplayPricing = PlanChargeDisplay & {
  termSavings: number;
  strikethroughPerMonth: string | null;
  showLaunchBadge: boolean;
};

const listPriceMonthly = (plan: Plan): number => {
  const raw = plan.list_price_monthly ?? plan.list_price_monthly_inr;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** UI pricing card — DB catalog; optional list price from plan entitlements (super admin). */
export const planDisplayPricing = (plan: Plan, term: BillingTerm): PlanDisplayPricing => {
  const charge = planChargeDisplay(plan, term);
  const months = TERM_MONTHS[charge.cycle];
  const monthlyBenchmark = catalogTermTotal(plan, "monthly");
  const termSavings =
    term !== "monthly" && monthlyBenchmark > 0
      ? Math.max(0, monthlyBenchmark * months - charge.exGstPeriodTotal)
      : 0;

  const listMonthly = listPriceMonthly(plan);
  const strikethroughPerMonth =
    listMonthly > charge.exGstPerMonth ? `${inr(listMonthly)}` : null;

  return {
    ...charge,
    termSavings,
    strikethroughPerMonth,
    showLaunchBadge: Boolean(plan.show_launch_badge),
  };
};

export const billingCycleShortLabel = (term: BillingTerm): string => {
  if (term === "annual") return "annually";
  if (term === "semiannual") return "every 6 months";
  if (term === "quarterly") return "quarterly";
  return "monthly";
};

export const billedPeriodLabel = (term: BillingTerm, periodTotalInr: number): string => {
  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { maximumFractionDigits: 0, style: "currency", currency: "INR" });
  if (term === "monthly") return "Billed monthly";
  if (term === "quarterly") return `Billed quarterly (${fmt(periodTotalInr)})`;
  if (term === "semiannual") return `Billed every 6 months (${fmt(periodTotalInr)})`;
  return `Billed annually (${fmt(periodTotalInr)})`;
};

const billingPeriodAutopayLabel = (cycle: ApiBillingCycle): string => {
  if (cycle === "annual") return "every year";
  if (cycle === "semi_annual") return "every 6 months";
  if (cycle === "quarterly") return "every 3 months";
  return "every month";
};

/** Context for /billing/pay — explains ₹5 mandate auth vs deferred plan charge. */
export const subscriptionCheckoutContext = (
  plan: Plan,
  cycle: ApiBillingCycle,
  trialDays = 7,
) => {
  const term: BillingTerm = cycle === "semi_annual" ? "semiannual" : cycle;
  const display = planChargeDisplay(plan, term);
  return {
    planLabel: plan.name,
    gstInclusiveInr: display.gstInclusivePeriodTotal,
    billingPeriodLabel: billingPeriodAutopayLabel(cycle),
    trialDays,
  };
};

export { TERM_MONTHS };
