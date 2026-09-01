"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { VerificationBadge } from "@/components/leads/VerificationBadge";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ErrorBox, PageState } from "@/components/ui/PageState";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { dateTime, relative, titleCase } from "@/lib/format";
import { fetchLead, patchLead } from "@/lib/leads/api";
import {
  REACHABLE_OWNERSHIP_NOTE,
  VERIFICATION_HELP,
  normalizeVerificationGrade,
  signalsForGrade,
} from "@/lib/leads/verification";
import { can } from "@/lib/permissions";
import { LEAD_STATUSES, LEAD_TEMPERATURES, type Lead, type LeadScoringEvent, type TimelineEntry } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import { apiRequest } from "@/lib/api";
import styles from "./lead-detail.module.css";

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = Number(params?.id);
  const { me } = useWorkspace();
  const canWrite = can(me?.permissions, "leads:write");

  const [lead, setLead] = useState<Lead | null>(null);
  const [scoreHistory, setScoreHistory] = useState<LeadScoringEvent[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [capiSuppressed, setCapiSuppressed] = useState(false);
  const [capiBusy, setCapiBusy] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "",
    budget: "",
    temperature: "warm",
    status: "new",
  });

  const load = useCallback(async () => {
    if (!leadId || Number.isNaN(leadId)) {
      setError("Invalid lead ID");
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const detail = await fetchLead(leadId, 30);
      const found = detail.lead;
      setLead(found);
      setScoreHistory(detail.score_history || []);
      setForm({
        name: found.name || "",
        email: found.email || "",
        phone: found.phone || "",
        interest: found.interest || "",
        budget: found.budget || "",
        temperature: found.temperature || "warm",
        status: found.status || "new",
      });

      if (found.contact_id) {
        try {
          const evts = await apiRequest<TimelineEntry[]>(`/v1/contacts/${found.contact_id}/timeline`);
          setTimeline(evts || []);
        } catch {
          setTimeline([]);
        }
        try {
          const capi = await apiRequest<{ capi_suppressed?: boolean }>(
            `/v1/meta-capi/contacts/${found.contact_id}/suppress`,
          );
          setCapiSuppressed(capi?.capi_suppressed === true);
        } catch {
          setCapiSuppressed(false);
        }
      } else {
        setTimeline([]);
        setCapiSuppressed(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load lead details");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!lead || !canWrite) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await patchLead(lead.id, {
        name: form.name || null,
        email: form.email || null,
        phone: form.phone || null,
        interest: form.interest || null,
        budget: form.budget || null,
        temperature: form.temperature,
        status: form.status,
      });
      setLead(updated);
      setNotice("Lead updated successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update lead");
    } finally {
      setBusy(false);
    }
  }

  function getTemperatureTone(temp: string) {
    if (temp === "hot") return "danger";
    if (temp === "warm") return "warning";
    return "info";
  }

  function getStatusTone(st: string) {
    if (st === "converted") return "success";
    if (st === "qualified") return "pine";
    if (st === "lost") return "danger";
    if (st === "contacted") return "info";
    return "neutral";
  }

  function scoreDelta(event: LeadScoringEvent) {
    if (event.previous_score == null) return null;
    const delta = event.new_score - event.previous_score;
    if (delta === 0) return null;
    return delta > 0 ? `+${delta}` : String(delta);
  }

  if (loading) {
    return (
      <AppShell title="Lead Detail" requires="leads:read">
        <div className="pt-4">
          <PageSkeleton />
        </div>
      </AppShell>
    );
  }

  if (error && !lead) {
    return (
      <AppShell title="Lead Detail" requires="leads:read">
        <ErrorBox message={error} onRetry={() => void load()} />
      </AppShell>
    );
  }

  if (!lead) {
    return (
      <AppShell title="Lead Not Found" requires="leads:read">
        <PageState
          icon="person_off"
          title="Lead not found"
          description="The lead you are looking for does not exist or was deleted."
          primaryHref="/leads"
          primaryLabel="Back to Leads"
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={lead.name || "Unnamed Lead"}
      subtitle={`Lead #${lead.id} · Captured ${dateTime(lead.created_at)}`}
      requires="leads:read"
      actions={
        <Link href="/leads">
          <Button variant="ghost">Back to list</Button>
        </Link>
      }
    >
      {error ? <ErrorBox message={error} onRetry={() => void load()} /> : null}
      {notice ? (
        <div className="mb-6 p-4 rounded-lg bg-emerald-700/10 border border-emerald-700/20 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
          {notice}
        </div>
      ) : null}

      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.metaRow}>
            <StatusBadge
              label={lead.temperature.toUpperCase()}
              tone={getTemperatureTone(lead.temperature)}
            />
            <StatusBadge
              label={titleCase(lead.status)}
              tone={getStatusTone(lead.status)}
            />
            <VerificationBadge grade={lead.verification_grade} />
            <span className={styles.sub}>Score: {lead.score}</span>
            {lead.source ? <span className={styles.sub}>Source: {titleCase(lead.source)}</span> : null}
            {lead.channel ? <span className={styles.sub}>Channel: {titleCase(lead.channel)}</span> : null}
          </div>
        </div>

        {lead.conversation_id ? (
          <Link href="/inbox">
            <Button variant="ghost">
              <span className="material-symbols-outlined">chat</span>
              View Conversation
            </Button>
          </Link>
        ) : null}
      </div>

      <div className={styles.grid}>
        <div className={styles.mainColumn}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Verification</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <VerificationBadge grade={lead.verification_grade} />
                <span className="text-sm text-muted-foreground leading-relaxed">
                  {VERIFICATION_HELP[normalizeVerificationGrade(lead.verification_grade)]}
                </span>
              </div>
              <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                {signalsForGrade(lead.verification_grade).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              {normalizeVerificationGrade(lead.verification_grade) === "reachable" ? (
                <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">
                  {REACHABLE_OWNERSHIP_NOTE}
                </p>
              ) : null}
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Contact & Intent Information</h2>
            <ul className={styles.infoList}>
              <li className={styles.infoItem}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{lead.email || "—"}</span>
              </li>
              <li className={styles.infoItem}>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>{lead.phone || "—"}</span>
              </li>
              <li className={styles.infoItem}>
                <span className={styles.infoLabel}>Interest / Query</span>
                <span className={styles.infoValue}>{lead.interest || "No interest details recorded"}</span>
              </li>
              <li className={styles.infoItem}>
                <span className={styles.infoLabel}>Budget</span>
                <span className={styles.infoValue}>{lead.budget || "Not specified"}</span>
              </li>
              <li className={styles.infoItem}>
                <span className={styles.infoLabel}>Last Updated</span>
                <span className={styles.infoValue}>{relative(lead.updated_at)}</span>
              </li>
            </ul>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Score History</h2>
            {!scoreHistory.length ? (
              <p className="text-sm text-muted-foreground">
                No score changes recorded yet. Scores update automatically during live chats.
              </p>
            ) : (
              <ul className={styles.timelineList}>
                {scoreHistory.map((event) => {
                  const delta = scoreDelta(event);
                  return (
                    <li key={event.id} className={styles.timelineItem}>
                      <div className={styles.timelineIcon}>
                        <span className="material-symbols-outlined">trending_up</span>
                      </div>
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineHeader}>
                          <span className={styles.timelineKind}>
                            {event.new_score} · {event.new_temperature.toUpperCase()}
                            {delta ? ` (${delta})` : ""}
                          </span>
                          <span className={styles.timelineTime}>
                            {dateTime(event.created_at)}
                          </span>
                        </div>
                        <p className={styles.timelineText}>{event.reason}</p>
                        <p className={styles.timelineMeta}>
                          {titleCase(event.triggered_by)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Activity Timeline</h2>
            {!timeline.length ? (
              <p className="text-sm text-muted-foreground">
                No timeline events recorded for this contact yet.
              </p>
            ) : (
              <ul className={styles.timelineList}>
                {timeline.map((item, idx) => (
                  <li key={idx} className={styles.timelineItem}>
                    <div className={styles.timelineIcon}>
                      <span className="material-symbols-outlined">
                        {item.kind === "message" ? "chat" : "history"}
                      </span>
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.timelineKind}>
                          {titleCase(String(item.kind || "Event"))}
                        </span>
                        <span className={styles.timelineTime}>
                          {dateTime(item.created_at)}
                        </span>
                      </div>
                      {item.text || item.summary || item.description ? (
                        <p className={styles.timelineText}>
                          {String(item.text || item.summary || item.description)}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className={styles.sideColumn}>
          <form className={styles.card} onSubmit={(e) => void handleSave(e)}>
            <h2 className={styles.cardTitle}>Edit Lead</h2>
            <div className={styles.formGroup}>
              <Field
                label="Name"
                name="name"
                value={form.name}
                disabled={busy || !canWrite}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              />
              <Field
                label="Email"
                name="email"
                type="email"
                value={form.email}
                disabled={busy || !canWrite}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              />
              <Field
                label="Phone"
                name="phone"
                value={form.phone}
                disabled={busy || !canWrite}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              />
              <Field
                label="Budget"
                name="budget"
                value={form.budget}
                disabled={busy || !canWrite}
                onChange={(v) => setForm((f) => ({ ...f, budget: v }))}
              />
              <Field
                label="Interest / Summary"
                name="interest"
                value={form.interest}
                disabled={busy || !canWrite}
                onChange={(v) => setForm((f) => ({ ...f, interest: v }))}
              />

              <label className={styles.select}>
                <span>Temperature</span>
                <Select
                  value={form.temperature}
                  disabled={busy || !canWrite}
                  onChange={(val) =>
                    setForm((f) => ({ ...f, temperature: val }))
                  }
                  options={LEAD_TEMPERATURES.map((t) => ({
                    value: t,
                    label: t.toUpperCase(),
                  }))}
                />
              </label>

              <label className={styles.select}>
                <span>Status</span>
                <Select
                  value={form.status}
                  disabled={busy || !canWrite}
                  onChange={(val) =>
                    setForm((f) => ({ ...f, status: val }))
                  }
                  options={LEAD_STATUSES.map((s) => ({
                    value: s,
                    label: titleCase(s),
                  }))}
                />
              </label>

              {lead.contact_id ? (
                <div className="space-y-2 border-t border-border pt-4 mt-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-foreground">Meta CAPI suppression</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        When on, conversion events for this contact are never sent to Meta — even if CAPI is enabled for the workspace.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={capiSuppressed}
                      disabled={!canWrite || capiBusy}
                      onClick={async () => {
                        if (!lead.contact_id || !canWrite) return;
                        const next = !capiSuppressed;
                        setCapiBusy(true);
                        setError(null);
                        try {
                          await apiRequest(`/v1/meta-capi/contacts/suppress`, {
                            method: "POST",
                            body: { contact_id: lead.contact_id, suppressed: next },
                          });
                          setCapiSuppressed(next);
                          setNotice(
                            next
                              ? "Contact suppressed from Meta CAPI."
                              : "CAPI suppression cleared for this contact.",
                          );
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Could not update CAPI suppression");
                        } finally {
                          setCapiBusy(false);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        capiSuppressed ? "bg-[#0396A6]" : "bg-zinc-300"
                      } ${!canWrite || capiBusy ? "opacity-50 cursor-not-allowed" : ""}`}
                      aria-label="Toggle Meta CAPI suppression for this contact"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition ${
                          capiSuppressed ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ) : null}
              {lead.contact_id ? (
                <div className={styles.actions}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        const blob = await apiRequest(
                          `/v1/contacts/${lead.contact_id}/export`,
                        );
                        const file = new Blob([JSON.stringify(blob, null, 2)], {
                          type: "application/json",
                        });
                        const url = URL.createObjectURL(file);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `contact-${lead.contact_id}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Export failed");
                      }
                    }}
                  >
                    Export contact (GDPR)
                  </Button>
                </div>
              ) : null}
              {canWrite ? (
                <div className={styles.actions}>
                  <Button type="submit" loading={busy}>
                    Save Changes
                  </Button>
                </div>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
