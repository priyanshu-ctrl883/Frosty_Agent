"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { ErrorBox, Loading, PageState } from "@/components/ui/PageState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiRequest } from "@/lib/api";
import { shortId, titleCase } from "@/lib/format";
import { can } from "@/lib/permissions";
import type { Agent, AgentVersion } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import styles from "./versions.module.css";

interface VersionDiffOut {
  v1_id: string;
  v2_id: string;
  v1_version_number: number;
  v2_version_number: number;
  added: Record<string, unknown>;
  modified: Record<string, { old: unknown; new: unknown }>;
  removed: Record<string, unknown>;
}

export default function AgentVersionsPage() {
  const params = useParams();
  const agentId = String(params?.id || "");
  const { me } = useWorkspace();
  const canConfig = can(me?.permissions, "agent:config");

  const [agent, setAgent] = useState<Agent | null>(null);
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rawPromptEntitled, setRawPromptEntitled] = useState<boolean>(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [diff, setDiff] = useState<VersionDiffOut | null>(null);

  const load = useCallback(async () => {
    if (!agentId) {
      setError("Missing agent ID");
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [ag, vers, entRes] = await Promise.all([
        apiRequest<Agent>(`/v1/agents/${agentId}`),
        apiRequest<AgentVersion[]>(`/v1/agents/${agentId}/versions`),
        apiRequest<{ features?: Record<string, boolean> }>("/v1/entitlements").catch(() => null),
      ]);
      setAgent(ag);
      setRawPromptEntitled(Boolean(entRes?.features?.raw_prompt));

      // Sort newest version number first
      setVersions(vers.sort((a, b) => b.version_number - a.version_number));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load agent versions");
    } finally {
      setLoading(false);
    }
  }, [agentId]);


  useEffect(() => {
    void load();
  }, [load]);

  async function handleCompareDiff(ver: AgentVersion) {
    if (!agent?.current_version_id) return;
    setError(null);
    try {
      const res = await apiRequest<VersionDiffOut>(
        `/v1/agents/${agentId}/versions/diff?v1=${agent.current_version_id}&v2=${ver.id}`
      );
      setDiff(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load version diff");
    }
  }

  async function handlePublish(ver: AgentVersion) {
    if (!canConfig) return;
    setBusyId(ver.id);
    setError(null);
    setNotice(null);
    try {
      const isRollback =
        agent?.current_version_id &&
        versions.some(
          (v) =>
            v.id === agent.current_version_id &&
            v.version_number > ver.version_number,
        );
      const actionEndpoint = isRollback ? "rollback" : "publish";
      await apiRequest(
        `/v1/agents/${agentId}/versions/${ver.id}/${actionEndpoint}`,
        { method: "POST" },
      );
      setNotice(
        `Version v${ver.version_number} is now live and published to active channels.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish version");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <AppShell title="Agent Versions" requires="agent:config">
        <div className="pt-4">
          <PageSkeleton />
        </div>
      </AppShell>
    );
  }
  if (error && !agent) return <ErrorBox message={error} onRetry={() => void load()} />;
  if (!agent) {
    return (
      <PageState
        icon="smart_toy"
        title="Agent not found"
        description="This agent does not exist or has been removed."
        primaryHref="/agents"
        primaryLabel="Back to Agents"
      />
    );
  }

  return (
    <AppShell
      title={`${agent.agent_name || "Agent"} Versions`}
      subtitle="History of saved configurations, system instructions, and knowledge grounding."
      requires="agent:config"
      actions={
        <Link href={`/agents/${agentId}`}>
          <Button variant="ghost">Back to Agent</Button>
        </Link>
      }
    >
      {error ? <ErrorBox message={error} onRetry={() => void load()} /> : null}
      {notice ? (
        <div className="mb-6 p-4 rounded-lg bg-emerald-700/10 border border-emerald-700/20 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
          {notice}
        </div>
      ) : null}

      {diff ? (
        <div className={styles.diffBox}>
          <div className={styles.diffHeader}>
            <h3 className={styles.diffTitle}>
              <span className={`material-symbols-outlined ${styles.diffTitleIcon}`}>difference</span>
              Diff Comparison: LIVE (v{diff.v1_version_number}) vs Target (v{diff.v2_version_number})
            </h3>
            <Button variant="ghost" onClick={() => setDiff(null)}>
              Close Diff
            </Button>
          </div>

          <div>
            {Object.keys(diff.modified).length > 0 ? (
              <div className={styles.diffSection}>
                <span className={`${styles.diffLabel} ${styles.diffLabelMod}`}>Modified Fields:</span>
                <ul className={styles.diffList}>
                  {Object.entries(diff.modified).map(([key, val]) => (
                    <li key={key} className={styles.diffItem}>
                      <span className={styles.diffKey}>{key}:</span>{" "}
                      <span className={styles.diffOld}>{JSON.stringify(val.old)}</span> →{" "}
                      <span className={styles.diffNew}>{JSON.stringify(val.new)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {Object.keys(diff.added).length > 0 ? (
              <div className={styles.diffSection}>
                <span className={`${styles.diffLabel} ${styles.diffLabelAdd}`}>Added Fields:</span>
                <ul className={styles.diffList}>
                  {Object.entries(diff.added).map(([key, val]) => (
                    <li key={key} className={`${styles.diffItem} ${styles.diffAdd}`}>
                      + <span className={styles.diffKey}>{key}:</span> {JSON.stringify(val)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {Object.keys(diff.removed).length > 0 ? (
              <div className={styles.diffSection}>
                <span className={`${styles.diffLabel} ${styles.diffLabelRem}`}>Removed Fields:</span>
                <ul className={styles.diffList}>
                  {Object.entries(diff.removed).map(([key, val]) => (
                    <li key={key} className={`${styles.diffItem} ${styles.diffRemove}`}>
                      - <span className={styles.diffKey}>{key}:</span> {JSON.stringify(val)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {!Object.keys(diff.modified).length &&
            !Object.keys(diff.added).length &&
            !Object.keys(diff.removed).length ? (
              <p className="text-neutral-400 italic">No configuration differences between these versions.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {!versions.length ? (
        <PageState
          icon="history"
          title="No versions saved yet"
          description="Save changes to your agent configuration to create a version snapshot."
          primaryHref={`/agents/${agentId}`}
          primaryLabel="Configure Agent"
          card={false}
        />
      ) : (
        <ul className={styles.list}>
          {versions.map((ver) => {
            const isCurrent = agent.current_version_id === ver.id;
            const isBusy = busyId === ver.id;

            return (
              <li
                key={ver.id}
                className={[styles.card, isCurrent ? styles.cardActive : ""].join(
                  " ",
                )}
              >
                <div className={styles.infoColumn}>
                  <div className={styles.versionTitleRow}>
                    <span className={styles.versionNum}>
                      v{ver.version_number}
                    </span>
                    <span className={styles.versionId}>ID: {shortId(ver.id)}</span>
                    <span className={styles.chip} style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                      {ver.prompt_mode || ver.config?.prompt_mode || "guided"} Mode
                    </span>
                    {isCurrent ? (
                      <StatusBadge label="LIVE (CURRENT)" tone="pine" />
                    ) : (
                      <StatusBadge label="ARCHIVED / DRAFT" tone="neutral" />
                    )}
                  </div>

                  {(ver.prompt_mode === "raw" || ver.config?.prompt_mode === "raw") && !rawPromptEntitled ? (
                    <div style={{ marginTop: 8, marginBottom: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(249, 115, 22, 0.08)", border: "1px solid rgba(249, 115, 22, 0.2)", fontSize: "12px", color: "#c2410c" }}>
                      ⚠️ This is a raw-prompt version. Your current plan doesn't include raw prompts, so you can view this but can't create new raw-prompt versions or republish this one until you upgrade.
                    </div>
                  ) : null}

                  <p className={styles.summary}>
                    {ver.config?.prompt_mode === "raw"
                      ? (ver.config.raw_prompt ? ver.config.raw_prompt.slice(0, 120) + (ver.config.raw_prompt.length > 120 ? "…" : "") : "Raw system instructions.")
                      : (ver.config?.persona?.business_info
                          ? ver.config.persona.business_info.slice(0, 120) +
                            (ver.config.persona.business_info.length > 120 ? "…" : "")
                          : "Standard system persona configuration.")}
                  </p>

                  <div className={styles.configPreview}>
                    <span className={styles.chip}>
                      <strong>Mode</strong>{" "}
                      {titleCase(ver.prompt_mode || ver.config?.prompt_mode || "guided")}
                    </span>
                    <span className={styles.chip}>
                      <strong>Guardrail</strong>{" "}
                      v{ver.config?.guardrail_version ?? 3}
                    </span>
                    <span className={styles.chip}>
                      <strong>Tone</strong>{" "}
                      {titleCase(ver.config?.persona?.tone || "friendly")}
                    </span>
                  </div>

                </div>

                <div className={styles.actionsColumn}>
                  {!isCurrent && agent.current_version_id ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void handleCompareDiff(ver)}
                    >
                      <span className="material-symbols-outlined">difference</span>
                      Compare Diff
                    </Button>
                  ) : null}

                  {isCurrent ? (
                    <Button disabled variant="ghost">
                      Currently Live
                    </Button>
                  ) : canConfig ? (
                    <Button
                      type="button"
                      loading={isBusy}
                      disabled={busyId !== null}
                      onClick={() => void handlePublish(ver)}
                    >
                      <span className="material-symbols-outlined">
                        publish
                      </span>
                      Publish v{ver.version_number}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
