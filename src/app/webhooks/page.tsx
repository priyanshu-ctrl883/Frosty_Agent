"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { EntitlementGate } from "@/components/entitlements/EntitlementGate";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ErrorBox, PageState } from "@/components/ui/PageState";
import { Select } from "@/components/ui/Select";
import { apiRequest } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { preferredWebhookEvent, webhookEventLabel } from "@/lib/webhooksCopy";
import { helpGuideHref } from "@/lib/help/catalog";
import type {
  WebhookCreated,
  WebhookDelivery,
  WebhookEndpoint,
  WebhookPing,
} from "@/lib/types";
import styles from "./webhooks.module.css";

const EVENT_FALLBACK = ["lead.created"];

type ConfirmKind = "delete" | "rotate";

/**
 * Developer webhook manager. CRM connect for non-developers lives on /integrations.
 * Signing secret is shown once (create or rotate); list responses only carry the mask.
 */
export default function WebhooksPage() {
  const [hooks, setHooks] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [eventType, setEventType] = useState("lead.created");
  const [targetUrl, setTargetUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lastSecret, setLastSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [eventOptions, setEventOptions] = useState<string[]>(EVENT_FALLBACK);
  const [openDeliveryId, setOpenDeliveryId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; hook: WebhookEndpoint } | null>(
    null,
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, dels, cat] = await Promise.all([
        apiRequest<WebhookEndpoint[]>("/v1/webhooks"),
        apiRequest<WebhookDelivery[]>("/v1/webhooks/deliveries?limit=30"),
        apiRequest<{ event_types: string[] }>("/v1/webhooks/events"),
      ]);
      setHooks(list);
      setDeliveries(dels);
      if (cat.event_types?.length) {
        setEventOptions(cat.event_types);
        setEventType((cur) =>
          cat.event_types.includes(cur) ? cur : preferredWebhookEvent(cat.event_types),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const copySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Select the secret and copy it yourself.");
    }
  };

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!targetUrl.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    setLastSecret(null);
    setCopied(false);
    try {
      const created = await apiRequest<WebhookCreated>("/v1/webhooks", {
        method: "POST",
        body: { event_type: eventType, target_url: targetUrl.trim() },
      });
      setLastSecret(created.signing_secret);
      setTargetUrl("");
      setNotice("Endpoint created. Copy the signing secret now — it will not be shown again.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(hook: WebhookEndpoint) {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/v1/webhooks/${hook.id}`, {
        method: "PATCH",
        body: { is_active: !hook.is_active },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function ping(hook: WebhookEndpoint) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const d = await apiRequest<WebhookPing>(`/v1/webhooks/${hook.id}/ping`, {
        method: "POST",
      });
      setNotice(
        d.queued
          ? "Test queued. Refresh deliveries in a few seconds — Ping does not wait for the POST."
          : `Ping → ${d.status}`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ping failed");
    } finally {
      setBusy(false);
    }
  }

  async function rotate(hook: WebhookEndpoint) {
    setBusy(true);
    setError(null);
    setNotice(null);
    setCopied(false);
    try {
      const rotated = await apiRequest<WebhookCreated>(
        `/v1/webhooks/endpoints/${hook.id}/rotate-secret`,
        { method: "POST" },
      );
      setLastSecret(rotated.signing_secret);
      setNotice("New signing secret issued. The old one no longer verifies. Copy this one now.");
      setConfirm(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rotate failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(hook: WebhookEndpoint) {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/v1/webhooks/${hook.id}`, { method: "DELETE" });
      setNotice("Endpoint deleted.");
      setConfirm(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function retryDelivery(row: WebhookDelivery) {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/v1/webhooks/deliveries/${row.id}/retry`, { method: "POST" });
      setNotice("Delivery queued to retry.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setBusy(false);
    }
  }

  const canRetry = (status: string) => status === "failed" || status === "retrying";

  return (
    <AppShell
      title="Webhooks"
      subtitle="Signed HTTPS callbacks for Zapier, Make, or your own backend."
      requires="webhooks:manage"
      actions={
        <Link href="/integrations">
          <Button variant="ghost">CRM integrations</Button>
        </Link>
      }
    >
      <EntitlementGate feature="webhooks">
        {error ? <ErrorBox message={error} onRetry={() => void load()} /> : null}
        {notice ? <p className={styles.notice}>{notice}</p> : null}

        {lastSecret ? (
          <div className={styles.secret} role="status">
            <p className={styles.secretLabel}>Signing secret — copy now. We will not show it again.</p>
            <code className={styles.secretValue}>{lastSecret}</code>
            <div className={styles.secretActions}>
              <Button type="button" size="sm" onClick={() => void copySecret(lastSecret)}>
                {copied ? "Copied" : "Copy secret"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setLastSecret(null)}>
                I have saved it
              </Button>
            </div>
          </div>
        ) : null}

        <form className={styles.form} onSubmit={onCreate}>
          <h2>Add endpoint</h2>
          <p className={styles.hint}>
            For Zoho or HubSpot, paste a{" "}
            <Link href="/integrations">Zapier Catch Hook URL</Link>. For a dry run use{" "}
            <a href="https://webhook.site" target="_blank" rel="noreferrer">
              webhook.site
            </a>
            . Each POST is signed with <code>X-Frosty-Signature</code>.
          </p>
          <div className={styles.formRow}>
            <label className={styles.select}>
              <span>Event</span>
              <Select
                value={eventType}
                onChange={setEventType}
                disabled={busy}
                options={eventOptions.map((ev) => ({
                  value: ev,
                  label: webhookEventLabel(ev),
                }))}
              />
            </label>
            <Field
              label="Target URL"
              name="target_url"
              value={targetUrl}
              onChange={setTargetUrl}
              placeholder="https://hooks.zapier.com/hooks/catch/…"
              required
              type="url"
            />
          </div>
          <Button type="submit" disabled={busy || !targetUrl.trim()}>
            Create webhook
          </Button>
        </form>

        {loading ? (
          <PageState icon="webhook" title="Loading…" description="Fetching endpoints." />
        ) : null}

        {!loading && !hooks.length ? (
          <PageState
            icon="webhook"
            title="No webhooks yet"
            description="Add a Zapier Catch Hook URL above, or open Integrations for the Zoho walkthrough."
            primaryHref="/integrations"
            primaryLabel="Connect a CRM"
            secondaryHref={helpGuideHref("connect-crm")}
            secondaryLabel="Zoho guide"
          />
        ) : null}

        {hooks.length ? (
          <ul className={styles.list}>
            {hooks.map((hook) => (
              <li key={hook.id}>
                <div>
                  <h2>{webhookEventLabel(hook.event_type)}</h2>
                  <p className={styles.url}>{hook.target_url}</p>
                  <p className={styles.meta}>
                    {hook.is_active ? "Active" : "Paused"} · secret {hook.secret || "—"}
                  </p>
                </div>
                <div className={styles.actions}>
                  <Button type="button" variant="ghost" disabled={busy} onClick={() => void ping(hook)}>
                    Ping
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void toggleActive(hook)}
                  >
                    {hook.is_active ? "Pause" : "Enable"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setConfirm({ kind: "rotate", hook })}
                  >
                    Rotate secret
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={busy}
                    onClick={() => setConfirm({ kind: "delete", hook })}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {!loading && hooks.length && !deliveries.length ? (
          <p className={styles.hint}>No deliveries yet. Ping an endpoint, or create a lead, to see the first POST.</p>
        ) : null}

        {deliveries.length ? (
          <section className={styles.deliveries}>
            <div className={styles.deliveryHead}>
              <h2>Recent deliveries</h2>
              <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void load()}>
                Refresh
              </Button>
            </div>
            <ul>
              {deliveries.map((d) => {
                const open = openDeliveryId === d.id;
                const ok = d.status === "sent";
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      className={styles.deliveryMain}
                      onClick={() => setOpenDeliveryId(open ? null : d.id)}
                      aria-expanded={open}
                    >
                      <strong>{webhookEventLabel(d.event_type)}</strong>
                      <span className={ok ? styles.ok : styles.bad}>
                        {d.status}
                        {d.response_code != null ? ` · ${d.response_code}` : ""}
                      </span>
                      <span className={styles.meta}>
                        {dateTime(d.created_at)} · attempt {d.attempt_count}
                      </span>
                    </button>
                    {canRetry(d.status) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => void retryDelivery(d)}
                      >
                        Retry
                      </Button>
                    ) : null}
                    {open && d.response_body ? (
                      <pre className={styles.response}>{d.response_body}</pre>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <ConfirmModal
          show={Boolean(confirm)}
          tone={confirm?.kind === "delete" ? "danger" : "warning"}
          title={confirm?.kind === "delete" ? "Delete this endpoint?" : "Rotate the signing secret?"}
          message={
            confirm?.kind === "delete"
              ? "New events will stop going to this URL. Past deliveries stay in the log."
              : "The current secret stops working immediately. Update Zapier or your receiver before you rotate, then copy the new secret once."
          }
          confirmText={confirm?.kind === "delete" ? "Delete" : "Rotate secret"}
          onConfirm={() => {
            if (!confirm) return;
            return confirm.kind === "delete" ? remove(confirm.hook) : rotate(confirm.hook);
          }}
          onCancel={() => setConfirm(null)}
        />
      </EntitlementGate>
    </AppShell>
  );
}
