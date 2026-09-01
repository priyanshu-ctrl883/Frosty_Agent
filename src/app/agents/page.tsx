"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { AgentHeadingSelector } from "@/components/shell/AgentHeadingSelector";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ErrorBox, PageState } from "@/components/ui/PageState";
import { Select } from "@/components/ui/Select";
import { apiRequest } from "@/lib/api";
import type { Agent, AgentChannel, AgentMode } from "@/lib/types";
import { AnalyticsDateFilter } from "@/components/analytics/AnalyticsDateFilter";
import styles from "./agents.module.css";

const MODE_LABEL: Record<string, string> = {
  website: "Website",
  whatsapp: "WhatsApp",
  unified: "Unified",
};

/**
 * Agents list — multiple agents per channel mode are allowed (D205).
 * Live traffic uses the enabled channel binding (toggle on agent detail).
 */
export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Agent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [days, setDays] = useState<number>(7);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [modeFilter, setModeFilter] = useState<AgentMode | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await apiRequest<Agent[]>("/v1/agents?include_channels=true");
      setAgents(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load agents");
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await apiRequest(`/v1/agents/${pendingDelete.id}`, { method: "DELETE" });
      setPendingDelete(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("frosty:agents-changed"));
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the agent");
    } finally {
      setDeleting(false);
    }
  }

  const MODE_FILTER_OPTIONS = [
    { value: "all", label: "All agent types" },
    { value: "website", label: "Website agents" },
    { value: "whatsapp", label: "WhatsApp agents" },
    { value: "unified", label: "Unified agents" },
  ] as const;

  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    if (modeFilter === "all") return agents;
    return agents.filter((a) => a.mode === modeFilter);
  }, [agents, modeFilter]);

  return (
    <AppShell
      title={
        <AgentHeadingSelector
          agentName="Agents"
          agents={agents || []}
          selectedAgentId={null}
          onSelectAgent={(targetId) => router.push(`/agents/${targetId}`)}
        />
      }
      subtitle="Create as many website, WhatsApp, or unified agents as you need."
      requires="agent:config"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={modeFilter}
            onChange={(value) => setModeFilter(value as AgentMode | "all")}
            options={MODE_FILTER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            fullWidth={false}
            className="min-w-[160px]"
            aria-label="Filter agents by type"
          />
          <AnalyticsDateFilter
            days={days}
            fromDate={fromDate}
            toDate={toDate}
            onChange={(range) => {
              setDays(range.days);
              setFromDate(range.fromDate);
              setToDate(range.toDate);
            }}
          />
          <Link href="/agents/new">
            <Button>New agent</Button>
          </Link>
        </div>
      }
    >
      {error ? <ErrorBox message={error} /> : null}
      {loading ? <PageState title="Loading agents…" description="Fetching your agent list." /> : null}
      {!loading && agents && agents.length === 0 ? (
        <PageState
          title="No agents yet"
          description="Create a website, WhatsApp, or unified agent to get started."
          primaryHref="/agents/new"
          primaryLabel="Create agent"
        />
      ) : null}
      {!loading && agents && agents.length > 0 && filteredAgents.length === 0 ? (
        <PageState
          title="No agents in this category"
          description="Try another agent type filter or create a new agent."
          primaryHref="/agents/new"
          primaryLabel="Create agent"
        />
      ) : null}
      {!loading && filteredAgents.length > 0 ? (
        <ul className={styles.list}>
          {filteredAgents.map((a) => {
            const chans: AgentChannel[] = a.channels || [];
            const liveBits = chans
              .filter((c) => c.enabled)
              .map((c) => c.channel)
              .join(", ");
            return (
              <li key={a.id}>
                <Link href={`/agents/${a.id}`} className={styles.rowMain}>
                  <h2>{a.agent_name || "Untitled"}</h2>
                  <p>
                    {liveBits
                      ? `Live on: ${liveBits}`
                      : "Channels off — enable on the agent page to take live traffic"}
                  </p>
                  <div className={styles.badges}>
                    <span className={styles.badge}>{MODE_LABEL[a.mode] || a.mode}</span>
                    {a.current_version_id ? (
                      <span className={styles.badgeOk}>Published</span>
                    ) : (
                      <span className={styles.badgeWarn}>Draft</span>
                    )}
                  </div>
                </Link>
                <div className={styles.rowActions}>
                  <Link href={`/agents/${a.id}`}>Open</Link>
                  <button
                    type="button"
                    className={styles.deleteLink}
                    onClick={() => setPendingDelete(a)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <ConfirmModal
        isOpen={!!pendingDelete}
        tone="danger"
        title="Delete this agent?"
        message={`“${pendingDelete?.agent_name || "This agent"}” will be removed from your workspace and stop taking live traffic.`}
        confirmText={deleting ? "Deleting…" : "Delete agent"}
        cancelText="Keep agent"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AppShell>
  );
}
