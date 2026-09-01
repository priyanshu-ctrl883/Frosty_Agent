"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { EntitlementGate } from "@/components/entitlements/EntitlementGate";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ErrorBox, Loading, PageState } from "@/components/ui/PageState";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { dateTime, inr, titleCase } from "@/lib/format";
import { can } from "@/lib/permissions";
import { QUOTE_STATUSES, type Quotation } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import {
  ArrowLeft,
  FileText,
  Download,
  Send,
  Sparkles,
  RotateCw,
  Check,
  Copy,
  User,
  Calendar,
  ShieldAlert,
  IndianRupee,
  TrendingUp,
  Save,
  Play,
  Pause,
} from "lucide-react";
import styles from "./quote-detail.module.css";

function QuoteDetailBody() {
  const params = useParams();
  const quoteId = String(params?.id || "");
  const { me } = useWorkspace();
  const canSend = can(me?.permissions, "quotations:send");

  const [quote, setQuote] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const setError = useCallback(
    (msg: string | null) => {
      if (msg) showToast(msg, { type: "error" });
    },
    [showToast]
  );
  const setNotice = useCallback(
    (msg: string | null) => {
      if (msg) showToast(msg, { type: "success" });
    },
    [showToast]
  );
  const [busy, setBusy] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [form, setForm] = useState({
    title: "",
    recipient_name: "",
    recipient_email: "",
    recipient_phone: "",
    content: "",
    status: "draft",
  });

  const load = useCallback(async () => {
    if (!quoteId) {
      setError("Missing quotation ID");
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const q = await apiRequest<Quotation>(`/v1/quotations/${quoteId}`);
      setQuote(q);
      setForm({
        title: q.title || "",
        recipient_name: q.recipient_name || "",
        recipient_email: q.recipient_email || "",
        recipient_phone: q.recipient_phone || "",
        content: q.content || "",
        status: q.status || "draft",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load quotation");
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!quote || !canSend) return;
    if (
      (form.status === "accepted" || form.status === "rejected") &&
      form.status !== quote.status
    ) {
      const label = form.status === "accepted" ? "Accepted (Won)" : "Rejected (Lost)";
      if (
        !window.confirm(
          `Mark this quotation as ${label}?\n\nThis locks the quote and stops any active follow-up nudges.`,
        )
      ) {
        return;
      }
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await apiRequest<Quotation>(`/v1/quotations/${quote.id}`, {
        method: "PATCH",
        body: {
          title: form.title.trim() || null,
          recipient_name: form.recipient_name.trim() || null,
          recipient_email: form.recipient_email.trim() || null,
          recipient_phone: form.recipient_phone.trim() || null,
          content: form.content.trim() || null,
          status: form.status,
        },
      });
      setQuote(updated);
      setNotice("Quotation details saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update quotation");
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkOutcome(outcome: "accepted" | "rejected") {
    if (!quote || !canSend) return;
    const label = outcome === "accepted" ? "Accepted (Won)" : "Rejected (Lost)";
    if (
      !window.confirm(
        `Mark this quotation as ${label}?\n\nThis locks the quote and stops any active follow-up nudges.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await apiRequest<Quotation>(`/v1/quotations/${quote.id}`, {
        method: "PATCH",
        body: { status: outcome },
      });
      setQuote(updated);
      setForm((f) => ({ ...f, status: updated.status }));
      setNotice(`Marked as ${label}. Follow-ups stopped.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevise() {
    if (!quote || !canSend) return;
    if (
      !window.confirm(
        "Create a new draft revision?\n\nThe current quote will be marked Revised and its follow-ups will stop.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const created = await apiRequest<Quotation>(`/v1/quotations/${quote.id}/revise`, {
        method: "POST",
        body: {},
      });
      setNotice("Revision created. Opening the new draft…");
      window.location.href = `/quotes/${created.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create revision");
      setBusy(false);
    }
  }

  async function handleResumeFollowup() {
    if (!quote || !canSend) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await apiRequest<Quotation>(`/v1/quotations/${quote.id}/followup/resume`, {
        method: "POST",
        body: {},
      });
      setQuote(updated);
      setNotice("Quote follow-up drip resumed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resume follow-up");
    } finally {
      setBusy(false);
    }
  }

  async function handlePauseFollowup() {
    if (!quote || !canSend) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await apiRequest<Quotation>(`/v1/quotations/${quote.id}/followup/pause`, {
        method: "POST",
        body: {},
      });
      setQuote(updated);
      setNotice("Quote follow-up drip paused.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not pause follow-up");
    } finally {
      setBusy(false);
    }
  }

  async function handleSend() {
    if (!quote || !canSend) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest(`/v1/quotations/${quote.id}/send`, {
        method: "POST",
        body: { channel: "email" },
      });
      setNotice("Quotation sent via email.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send quotation");
    } finally {
      setBusy(false);
    }
  }

  async function handleGeneratePdf() {
    if (!quote || !canSend) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest(`/v1/quotations/${quote.id}/pdf`, { method: "POST" });
      setNotice("PDF generated successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate PDF");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownloadPdf() {
    if (!quote) return;
    setBusy(true);
    setError(null);
    try {
      const out = await apiRequest<{ url?: string; signed_url?: string }>(
        `/v1/quotations/${quote.id}/pdf`,
      );
      const targetUrl = out.url || out.signed_url;
      if (targetUrl) {
        window.open(targetUrl, "_blank");
      } else {
        setError("PDF URL not available. Try generating PDF first.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not download PDF");
    } finally {
      setBusy(false);
    }
  }

  const copyShareLink = () => {
    if (!quote) return;
    const url = `${window.location.origin}/quotes/${quote.id}`;
    void navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  function getStatusTone(st: string) {
    if (st === "accepted") return "success";
    if (st === "viewed") return "warning";
    if (st === "sent") return "pine";
    if (st === "rejected" || st === "expired") return "danger";
    return "neutral";
  }

  if (loading) return <Loading label="Loading quotation…" />;
  if (!quote) {
    return (
      <PageState
        icon="description"
        title="Quotation not found"
        description="This quotation may have been removed or never existed."
        primaryHref="/quotes"
        primaryLabel="Back to Quotes"
      />
    );
  }

  const items = quote.items || [];
  const subtotal = Number(quote.amount || 0);
  const gstRate = Number(quote.gst_rate || 0);
  const gstAmt = Number(quote.gst_amount || 0);
  const grandTotal = Number(quote.total_with_gst || 0);

  return (
    <div className="space-y-5 pb-16">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/quotes"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to all quotations</span>
        </Link>
      </div>

      {/* Header Info & Actions */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {quote.title || "Untitled Proposal"}
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              #{quote.id.slice(0, 8)}
            </span>
          </div>

          <div className={styles.metaRow}>
            <StatusBadge tone={getStatusTone(quote.status)} label={titleCase(quote.status)} />
            <span className={styles.sub}>Created {dateTime(quote.created_at)}</span>
            {quote.viewed_at ? (
              <span className={styles.sub}>
                • <strong className="text-amber-700 dark:text-amber-400">Viewed {dateTime(quote.viewed_at)}</strong>
              </span>
            ) : null}
            {quote.recipient_email ? (
              <span className={styles.sub}>• To: <strong className="text-foreground">{quote.recipient_email}</strong></span>
            ) : null}
          </div>
          {quote.followup && quote.followup.status !== "none" ? (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-[11px] text-muted-foreground">
                Follow-up: <strong className="capitalize text-foreground">{quote.followup.status}</strong>
                {quote.followup.status === "active" && quote.followup.next_scheduled_at
                  ? ` · next ${dateTime(quote.followup.next_scheduled_at)}`
                  : null}
              </p>
              {quote.followup.status === "paused" && !quote.followup_opt_out && !["accepted", "rejected", "expired", "revised"].includes(quote.status) ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void handleResumeFollowup()}
                  className="text-[11px] h-6 px-2 text-sky-700 border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/30"
                >
                  <Play className="w-2.5 h-2.5 mr-1" />
                  Resume
                </Button>
              ) : null}
              {quote.followup.status === "active" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void handlePauseFollowup()}
                  className="text-[11px] h-6 px-2 text-amber-700 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  <Pause className="w-2.5 h-2.5 mr-1" />
                  Pause
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-1">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => void handleGeneratePdf()}
            className="w-full justify-center text-xs font-semibold border border-border/80 hover:bg-muted h-9"
          >
            {quote.pdf_file_object_id ? (
              <RotateCw className="w-3.5 h-3.5 mr-1.5 text-[#03A8CB]" />
            ) : (
              <FileText className="w-3.5 h-3.5 mr-1.5 text-[#03A8CB]" />
            )}
            {quote.pdf_file_object_id ? "Regenerate PDF" : "Generate PDF"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={busy || !quote.pdf_file_object_id}
            onClick={() => void handleDownloadPdf()}
            className="w-full justify-center text-xs font-semibold border border-border/80 hover:bg-muted h-9 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download PDF
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={copyShareLink}
            className="w-full justify-center text-xs font-semibold border border-border/80 hover:bg-muted h-9"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 mr-1.5" />
            )}
            {copiedLink ? "Copied!" : "Copy Link"}
          </Button>

          {canSend ? (
            <Button
              type="button"
              disabled={busy || quote.status === "accepted"}
              onClick={() => void handleSend()}
              className="w-full justify-center text-xs font-semibold shadow-xs h-9 bg-[#03A8CB] hover:bg-[#0284A6] text-white"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Send Quote
            </Button>
          ) : null}
        </div>
        {canSend && quote.status !== "accepted" && quote.status !== "rejected" ? (
          <div className="flex flex-wrap gap-2 w-full pt-2">
            <Button
              type="button"
              disabled={busy}
              onClick={() => void handleMarkOutcome("accepted")}
              className="text-xs font-semibold h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
              Mark Accepted (Won)
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void handleMarkOutcome("rejected")}
              className="text-xs font-semibold h-8 bg-red-600 hover:bg-red-700 text-white"
            >
              Mark Rejected (Lost)
            </Button>
            {quote.status !== "revised" ? (
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => void handleRevise()}
                className="text-xs font-semibold h-8 border border-border"
              >
                <RotateCw className="w-3.5 h-3.5 mr-1.5" />
                Create Revision
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={styles.grid}>
        {/* Main Column */}
        <div className={styles.mainColumn}>
          {/* Line Items Card */}
          <div className={styles.card}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={styles.cardTitle}>
                <FileText className="w-4 h-4 mr-1.5 text-primary" />
                Line Items
              </h2>
              <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/60 px-2 py-0.5 rounded-full">
                Catalogue Pricing
              </span>
            </div>

            {items.length > 0 ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Product / Description</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td>
                          <strong className="font-semibold text-foreground">{it.description || "Item"}</strong>
                        </td>
                        <td>{it.quantity}</td>
                        <td>{inr(Number(it.unit_price))}</td>
                        <td style={{ textAlign: "right" }}>
                          <strong className="font-bold text-foreground">
                            {inr(Number(it.line_total || Number(it.quantity || "1") * Number(it.unit_price || "0")))}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-4 text-center border border-dashed border-border rounded-xl">
                No items attached to this quotation.
              </p>
            )}

            {/* Totals Summary Block */}
            <div className={styles.totalBox}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">{inr(subtotal)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>GST ({gstRate}%)</span>
                <span className="font-semibold text-foreground">{inr(gstAmt)}</span>
              </div>
              <div className={styles.totalRowFinal}>
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Grand Total (INR)
                </span>
                <span>{inr(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Notes Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Terms & Conditions</h2>
            <Field
              label="Quotation Content / Notes"
              name="content"
              value={form.content}
              disabled={busy || !canSend}
              hint="Additional terms or notes rendered on the quotation PDF."
              placeholder="e.g. Annual AI agent license, payment terms, validity…"
              onChange={(v) => setForm((f) => ({ ...f, content: v }))}
            />
          </div>
        </div>

        {/* Side Column */}
        <div className={styles.sideColumn}>
          <form className={styles.card} onSubmit={(e) => void handleSave(e)}>
            <h2 className={styles.cardTitle}>Quote Details</h2>
            <div className={styles.formGroup}>
              <Field
                label="Quotation Title"
                name="title"
                value={form.title}
                disabled={busy || !canSend}
                placeholder="e.g. Growth plan quote"
                onChange={(v) => setForm((f) => ({ ...f, title: v }))}
              />
              <Field
                label="Recipient Name"
                name="recipient_name"
                value={form.recipient_name}
                disabled={busy || !canSend}
                placeholder="Full name"
                onChange={(v) => setForm((f) => ({ ...f, recipient_name: v }))}
              />
              <Field
                label="Recipient Email"
                name="recipient_email"
                type="email"
                value={form.recipient_email}
                disabled={busy || !canSend}
                placeholder="name@company.com"
                onChange={(v) => setForm((f) => ({ ...f, recipient_email: v }))}
              />
              <Field
                label="Recipient Phone"
                name="recipient_phone"
                value={form.recipient_phone}
                disabled={busy || !canSend}
                placeholder="+91 98765 43210"
                onChange={(v) => setForm((f) => ({ ...f, recipient_phone: v }))}
              />

              <div className="space-y-1 text-xs">
                <span className="font-semibold text-foreground">GST Rate (Snapshot)</span>
                <div className="px-3 py-2 rounded-xl border border-border bg-muted/30 text-xs font-semibold text-muted-foreground flex items-center justify-between">
                  <span>{quote.tax_treatment === "export" ? "0% (Zero-rated Export LUT)" : `${gstRate}% GST`}</span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/80">{quote.tax_treatment || "domestic"}</span>
                </div>
              </div>

              <label className={styles.select}>
                <span>Status</span>
                <Select
                  value={form.status}
                  disabled={busy || !canSend || quote.status === "accepted" || quote.status === "rejected"}
                  onChange={(val) => setForm((f) => ({ ...f, status: val }))}
                  options={QUOTE_STATUSES.map((s) => ({
                    value: s,
                    label: titleCase(s),
                  }))}
                />
              </label>

              {canSend ? (
                <Button type="submit" loading={busy} className="gap-1.5 text-xs font-semibold w-full mt-2">
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function QuoteDetailPage() {
  return (
    <AppShell
      title="Quotation Detail"
      subtitle="View items, edit pricing, generate PDF or send to customer."
      requires="quotations:view"
    >
      <EntitlementGate feature="quotations">
        <QuoteDetailBody />
      </EntitlementGate>
    </AppShell>
  );
}
