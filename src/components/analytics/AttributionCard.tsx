"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Megaphone, Save } from "lucide-react";
import { apiRequest, ApiClientError } from "@/lib/api";
import type { AttributionReport } from "@/lib/types";

type Props = {
  days: number;
  channel?: "website" | "whatsapp" | null;
};

export function AttributionCard({ days, channel = null }: Props) {
  const [data, setData] = useState<AttributionReport | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [spendDraft, setSpendDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams({ days: String(days) });
      if (channel) q.set("channel", channel);
      const res = await apiRequest<AttributionReport>(
        `/v1/analytics/attribution?${q.toString()}`,
      );
      setData(res);
      setErr("");
    } catch (e) {
      setErr(
        e instanceof ApiClientError ? e.message : "Could not load attribution.",
      );
    }
  }, [days, channel]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSpend = async (campaignKey: string) => {
    setBusy(true);
    setErr("");
    try {
      const amount = Number(spendDraft);
      if (!Number.isFinite(amount) || amount < 0) {
        setErr("Enter a valid spend amount (≥ 0).");
        return;
      }
      await apiRequest("/v1/analytics/attribution/spend", {
        method: "PUT",
        body: JSON.stringify({
          campaign_key: campaignKey,
          channel: "all",
          amount,
          currency: "INR",
          period_month: data?.period_month,
        }),
      });
      setEditingKey(null);
      setSpendDraft("");
      await load();
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : "Could not save spend.");
    } finally {
      setBusy(false);
    }
  };

  const campaigns = data?.campaigns ?? [];
  const totals = data?.totals;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm col-span-full mb-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Megaphone className="w-4 h-4 shrink-0 text-teal-700" strokeWidth={1.8} />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 truncate">
              Campaign attribution
            </h3>
            <p className="text-xs text-slate-500">
              Conversations by ad / UTM over the last {days} days. Missing source =
              unknown (not organic). Enter monthly spend to see cost per conversation.
            </p>
          </div>
        </div>
        {totals && (
          <div className="text-right text-xs text-slate-500 shrink-0">
            <div>
              <span className="font-semibold text-slate-800">{totals.conversations}</span>{" "}
              conv
            </div>
            <div>
              {totals.attributed} attributed · {totals.unknown} unknown
            </div>
          </div>
        )}
      </div>

      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}

      {!data && !err ? (
        <p className="text-sm text-slate-500">Loading attribution…</p>
      ) : campaigns.length === 0 ? (
        <p className="text-sm text-slate-500">
          No attributed conversations in this window yet. WhatsApp Click-to-WhatsApp
          referrals and website UTM / gclid / fbclid will appear here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3 font-medium">Campaign / source</th>
                <th className="py-2 pr-3 font-medium">Conv</th>
                <th className="py-2 pr-3 font-medium">Leads</th>
                <th className="py-2 pr-3 font-medium">WA / Web</th>
                <th className="py-2 pr-3 font-medium">Spend (month)</th>
                <th className="py-2 font-medium">Cost / conv</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const title =
                  c.display_label ||
                  c.utm_campaign ||
                  c.source_id ||
                  c.campaign_key;
                const isUnknown = c.campaign_key === "unknown" && !c.display_label;
                return (
                  <tr key={c.campaign_key} className="border-b border-slate-100">
                    <td className="py-2.5 pr-3">
                      <div
                        className="font-medium text-slate-800 max-w-[240px] truncate"
                        title={isUnknown ? "Unknown source (not organic)" : String(title || "")}
                      >
                        {isUnknown ? "Unknown" : title}
                      </div>
                      {!isUnknown && c.source_id && c.display_label && (
                        <div className="text-xs text-slate-400 font-mono">
                          id {c.source_id}
                        </div>
                      )}
                      {!isUnknown && !c.display_label && c.source_id && (
                        <div className="text-xs text-slate-400">Raw ad id (names later)</div>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">{c.conversations}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{c.leads}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-500">
                      {c.whatsapp} / {c.website}
                    </td>
                    <td className="py-2.5 pr-3">
                      {editingKey === c.campaign_key ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="w-24 rounded border border-slate-200 px-2 py-1 text-sm"
                            value={spendDraft}
                            onChange={(e) => setSpendDraft(e.target.value)}
                            disabled={busy}
                          />
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded bg-teal-700 text-white px-2 py-1 text-xs"
                            onClick={() => void saveSpend(c.campaign_key)}
                            disabled={busy}
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            type="button"
                            className="text-xs text-slate-500 px-1"
                            onClick={() => {
                              setEditingKey(null);
                              setSpendDraft("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="text-sm text-teal-800 hover:underline tabular-nums"
                          onClick={() => {
                            setEditingKey(c.campaign_key);
                            setSpendDraft(
                              c.spend_amount != null ? String(c.spend_amount) : "",
                            );
                          }}
                        >
                          {c.spend_amount != null
                            ? `₹${c.spend_amount}`
                            : "Add spend"}
                        </button>
                      )}
                    </td>
                    <td className="py-2.5 tabular-nums text-slate-700">
                      {c.cost_per_conversation != null
                        ? `₹${c.cost_per_conversation}`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
