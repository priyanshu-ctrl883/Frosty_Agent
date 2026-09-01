import {
  DEFAULT_PRICING_CSV_BUNDLE,
  formatCurrencyAmount,
  parseCSV,
  type Region,
} from "@/lib/pricingEngine";

/** Launch-rate marketing overlay (standard/strikethrough monthly) keyed by plan slug. */
export type MarketingPresentation = {
  benchmarkMonthly: number;
  strikethroughPrice: string;
  showLaunchBadge: boolean;
};

type PresentationByRegion = Record<Region, MarketingPresentation | null>;

/** Launch-rate term totals for marketing display (CSV per-month × term length). */
export type MarketingLaunchRates = {
  monthly: number;
  quarterly: number;
  semi_annual: number;
  annual: number;
};

type LaunchRatesByRegion = Record<Region, MarketingLaunchRates | null>;

let presentationBySlug: Map<string, PresentationByRegion> | null = null;
let launchRatesBySlug: Map<string, LaunchRatesByRegion> | null = null;
let presentationCsvSource: string | null = null;

const slugFromCsvRow = (planName: string, category: string): string =>
  category === "commerce"
    ? `commerce_${planName.toLowerCase()}`
    : planName.toLowerCase();

const parsePresentation = (
  strikethroughRaw: string,
  baseMonthly: number,
  region: Region,
): MarketingPresentation | null => {
  const strikethroughNum = parseFloat(strikethroughRaw);
  const hasStrikethrough = Number.isFinite(strikethroughNum) && strikethroughNum > 0;
  const benchmarkMonthly = hasStrikethrough ? strikethroughNum : baseMonthly;
  if (!Number.isFinite(benchmarkMonthly) || benchmarkMonthly <= 0) {
    return null;
  }
  return {
    benchmarkMonthly,
    strikethroughPrice: hasStrikethrough
      ? formatCurrencyAmount(strikethroughNum, region)
      : "",
    showLaunchBadge: region === "IN" && hasStrikethrough,
  };
};

const parseLaunchRates = (row: Record<string, string>, region: Region): MarketingLaunchRates | null => {
  const monthlyPerMo = parseFloat(region === "IN" ? row.base_inr || "0" : row.base_usd || "0");
  const quarterlyPerMo = parseFloat(
    region === "IN" ? row.inr_quarterly || "0" : row.usd_quarterly || "0",
  );
  const biannualPerMo = parseFloat(
    region === "IN" ? row.inr_biannual || "0" : row.usd_biannual || "0",
  );
  const annualPerMo = parseFloat(region === "IN" ? row.inr_annual || "0" : row.usd_annual || "0");
  if (!Number.isFinite(monthlyPerMo) || monthlyPerMo <= 0) {
    return null;
  }
  return {
    monthly: monthlyPerMo,
    quarterly: quarterlyPerMo > 0 ? quarterlyPerMo * 3 : 0,
    semi_annual: biannualPerMo > 0 ? biannualPerMo * 6 : 0,
    annual: annualPerMo > 0 ? annualPerMo * 12 : 0,
  };
};

const buildCsvIndexes = (csv: string): {
  presentation: Map<string, PresentationByRegion>;
  launchRates: Map<string, LaunchRatesByRegion>;
} => {
  const presentation = new Map<string, PresentationByRegion>();
  const launchRates = new Map<string, LaunchRatesByRegion>();
  for (const row of parseCSV(csv)) {
    const slug = slugFromCsvRow(row.plan ?? "", row.category ?? "core");
    const baseInr = parseFloat(row.base_inr || "0");
    const baseUsd = parseFloat(row.base_usd || "0");
    presentation.set(slug, {
      IN: parsePresentation(row.inr_strikethrough || "", baseInr, "IN"),
      INTL: parsePresentation(row.usd_strikethrough || "", baseUsd, "INTL"),
    });
    launchRates.set(slug, {
      IN: parseLaunchRates(row, "IN"),
      INTL: parseLaunchRates(row, "INTL"),
    });
  }
  return { presentation, launchRates };
};

const ensureCsvIndexes = (csv: string): void => {
  if (!presentationBySlug || !launchRatesBySlug || presentationCsvSource !== csv) {
    const indexes = buildCsvIndexes(csv);
    presentationBySlug = indexes.presentation;
    launchRatesBySlug = indexes.launchRates;
    presentationCsvSource = csv;
  }
};

export const getMarketingPresentation = (
  slug: string,
  region: Region,
  csv: string = DEFAULT_PRICING_CSV_BUNDLE.plans,
): MarketingPresentation | null => {
  ensureCsvIndexes(csv);
  return presentationBySlug!.get(slug)?.[region] ?? null;
};

/** CSV launch term totals — marketing display when DB catalog is stale on one tier. */
export const getMarketingLaunchRates = (
  slug: string,
  region: Region,
  csv: string = DEFAULT_PRICING_CSV_BUNDLE.plans,
): MarketingLaunchRates | null => {
  ensureCsvIndexes(csv);
  return launchRatesBySlug!.get(slug)?.[region] ?? null;
};

/** Test helper — reload after CSV edits in dev/tests. */
export const resetMarketingPresentationCache = (): void => {
  presentationBySlug = null;
  launchRatesBySlug = null;
  presentationCsvSource = null;
};
