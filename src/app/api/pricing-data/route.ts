import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEFAULT_PRICING_CSV_BUNDLE } from "@/lib/pricingEngine";
import {
  buildCatalogFromPublicPlans,
  type DbPricingCatalog,
  type PublicPlanRow,
} from "@/lib/planCatalogFromApi";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

const readCsvBundle = () => {
  try {
    const dataDir = path.join(process.cwd(), "src", "data");
    const plans = fs.readFileSync(path.join(dataDir, "pricing_plans.csv"), "utf-8");
    const discounts = fs.readFileSync(path.join(dataDir, "pricing_discounts.csv"), "utf-8");
    const addons = fs.readFileSync(path.join(dataDir, "pricing_addons.csv"), "utf-8");
    if (plans && discounts && addons) {
      return { plans, discounts, addons };
    }
  } catch {
    /* serverless / missing files — fall through */
  }
  return {
    plans: DEFAULT_PRICING_CSV_BUNDLE.plans,
    discounts: DEFAULT_PRICING_CSV_BUNDLE.discounts,
    addons: DEFAULT_PRICING_CSV_BUNDLE.addons,
  };
};

const fetchPublicPlans = async (market: "in" | "intl"): Promise<PublicPlanRow[]> => {
  const res = await fetch(`${API_URL}/v1/public/plans?market=${market}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`public plans ${market} returned ${res.status}`);
  }
  const body = (await res.json()) as { data?: PublicPlanRow[] };
  return body.data ?? [];
};

const buildDbCatalog = async (): Promise<DbPricingCatalog | null> => {
  try {
    const [inPlans, intlPlans] = await Promise.all([
      fetchPublicPlans("in"),
      fetchPublicPlans("intl"),
    ]);
    if (!inPlans.length && !intlPlans.length) {
      return null;
    }
    return {
      source: "db",
      IN: buildCatalogFromPublicPlans(inPlans, "IN"),
      INTL: buildCatalogFromPublicPlans(intlPlans, "INTL"),
    };
  } catch {
    return null;
  }
};

// Serves marketing pricing: plan rows from DB catalog when API is reachable; addons/discounts from CSV.
export async function GET(req: NextRequest) {
  const country =
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-country-code") ||
    req.headers.get("x-geo-country") ||
    null;

  const csv = readCsvBundle();
  const catalog = await buildDbCatalog();

  if (catalog) {
    return NextResponse.json(
      {
        source: "db" as const,
        catalog,
        discounts: csv.discounts,
        addons: csv.addons,
        country,
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" } },
    );
  }

  return NextResponse.json(
    {
      source: "csv" as const,
      plans: csv.plans,
      discounts: csv.discounts,
      addons: csv.addons,
      country,
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
