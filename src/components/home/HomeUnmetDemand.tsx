"use client";

import Link from "next/link";
import useSWR from "swr";
import { Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/api";

export type UnmetDemandItem = {
  feature: string;
  goal: string | null;
  conversations: number;
  last_asked_at: string | null;
};

export type UnmetDemandResponse = {
  window_days: number;
  total_count: number;
  returned_count: number;
  items: UnmetDemandItem[];
};

type Props = {
  days: number;
};

/**
 * Upsell signal from refused tool calls (D124 / D153) — peers surface “demand you don’t sell”.
 */
export function HomeUnmetDemand({ days }: Props) {
  const { data, error, isLoading } = useSWR<UnmetDemandResponse | null>(
    `/v1/analytics/unmet-demand?days=${days}`,
    (url: string) => apiRequest<UnmetDemandResponse>(url).catch(() => null),
    { refreshInterval: 120_000, revalidateOnFocus: true },
  );

  if (isLoading || error || !data || data.total_count === 0 || data.items.length === 0) {
    return null;
  }

  const top = data.items.slice(0, 3);

  return (
    <div className="mb-8 sm:mb-12 rounded-[26px] sm:rounded-[30px] border border-[var(--line)] bg-card p-5 sm:p-7 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <TrendingUp className="w-6 h-6 text-[#0396A6] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold font-sans text-foreground inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0396A6]" />
              Unmet demand
            </h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              Visitors asked for features your plan does not include · last {data.window_days}d ·{" "}
              {data.total_count} conversation{data.total_count === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <Link
          href="/billing"
          className="text-xs font-bold text-[#0396A6] hover:underline inline-flex items-center gap-1 shrink-0"
        >
          Review plans <ArrowRight className="w-3 h-3 text-[#0396A6]" />
        </Link>
      </div>
      <ul className="space-y-2.5">
        {top.map((row) => (
          <li
            key={`${row.feature}-${row.goal ?? ""}`}
            className="flex items-center justify-between gap-3 text-xs px-4 py-3 rounded-xl bg-[var(--surf-1)]/60 border border-[var(--line)] hover:border-[#0396A6]/30 transition-all"
          >
            <span className="font-semibold text-foreground truncate">
              {row.feature}
              {row.goal ? (
                <span className="font-normal text-muted-foreground"> · {row.goal}</span>
              ) : null}
            </span>
            <span className="tabular-nums font-bold text-[#0396A6] shrink-0">
              {row.conversations} ask{row.conversations === 1 ? "" : "s"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
