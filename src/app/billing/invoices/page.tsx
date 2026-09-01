"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ErrorBox, Loading, PageState } from "@/components/ui/PageState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { apiPage, apiRequest } from "@/lib/api";
import { dateOnly, dateTime, inr, titleCase } from "@/lib/format";
import { can } from "@/lib/permissions";
import type { LedgerEntry, MerchantSettings, TaxInvoice } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import styles from "./invoices.module.css";

export default function InvoicesPage() {
  const { me } = useWorkspace();
  const canWrite = can(me?.permissions, "billing:manage");

  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoicePageSize, setInvoicePageSize] = useState(10);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(10);
  const [settings, setSettings] = useState<MerchantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [form, setForm] = useState({
    company_name: "",
    gstin: "",
    phone: "",
  });

  const load = useCallback(async () => {
    setError(null);
    try {
      const [p, inv] = await Promise.all([
        apiPage<LedgerEntry[]>("/v1/billing/ledger?limit=50"),
        apiRequest<TaxInvoice[] | { data?: TaxInvoice[] }>("/v1/billing/invoices").catch(() => [] as TaxInvoice[]),
      ]);
      setLedger(p.data || []);
      setInvoices(Array.isArray(inv) ? inv : ((inv as { data?: TaxInvoice[] })?.data || []));

      try {
        const st = await apiRequest<MerchantSettings>("/v1/settings");
        setSettings(st);
        setForm({
          company_name: st.company_name || "",
          gstin: st.gstin || "",
          phone: st.phone || "",
        });
      } catch {
        setSettings(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load invoice history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await apiRequest<MerchantSettings>("/v1/settings", {
        method: "PATCH",
        body: {
          company_name: form.company_name || null,
          gstin: form.gstin || null,
          phone: form.phone || null,
        },
      });
      setSettings(updated);
      setNotice("Billing profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update billing profile");
    } finally {
      setBusy(false);
    }
  }

  function printReceipt() {
    window.print();
  }

  const paginatedInvoices = invoices.slice(
    (invoicePage - 1) * invoicePageSize,
    invoicePage * invoicePageSize
  );

  const paginatedLedger = ledger.slice(
    (ledgerPage - 1) * ledgerPageSize,
    ledgerPage * ledgerPageSize
  );

  if (loading) {
    return (
      <AppShell title="Invoices & Billing Profile" requires="billing:view">
        <div className="pt-4">
          <PageSkeleton />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Invoices & Billing Profile"
      subtitle="Your transaction history, credit ledger, and GSTIN registration for invoicing."
      requires="billing:view"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={printReceipt}>
            <span className="material-symbols-outlined">print</span>
            Print Ledger
          </Button>
          <Link href="/billing">
            <Button variant="ghost">Back to Billing</Button>
          </Link>
        </div>
      }
    >
      {error ? <ErrorBox message={error} onRetry={() => void load()} /> : null}
      {notice ? (
        <div className="mb-6 p-4 rounded-xl bg-[#EAF8F8] border border-[#B8E0E2] text-[#0396A6] text-sm font-semibold">
          {notice}
        </div>
      ) : null}

      <div className={styles.grid}>
        <div className={styles.mainColumn}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Tax invoices</h2>
            {!invoices.length ? (
              <PageState
                icon="receipt_long"
                title="No GST invoices yet"
                description="Subscription, overage, and setup invoices appear here after they are issued."
                card={false}
              />
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Number</th>
                        <th>Type</th>
                        <th>Issued</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td><span className={styles.code}>{inv.invoice_number}</span></td>
                          <td>{titleCase(inv.invoice_type.replace(/_/g, " "))}</td>
                          <td>{dateOnly(inv.issued_at)}</td>
                          <td>{inr(Number(inv.total_inr))}</td>
                          <td>
                            <StatusBadge
                              label={titleCase(inv.status)}
                              tone={inv.status === "paid" ? "pine" : "neutral"}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={invoicePage}
                  pageSize={invoicePageSize}
                  totalItems={invoices.length}
                  onPageChange={setInvoicePage}
                  onPageSizeChange={setInvoicePageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                  itemLabel="invoices"
                  className="mt-2.5 px-0 py-1 border-t border-slate-100 bg-transparent"
                />
              </>
            )}
          </div>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Credit Ledger</h2>
            {!ledger.length ? (
              <PageState
                icon="receipt_long"
                title="No transactions yet"
                description="Your credit usage, topups, and plan invoices will appear here as you use Frosty."
                card={false}
              />
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Transaction #</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Credits</th>
                        <th>INR Amount</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLedger.map((row) => {
                        const credNum = Number(row.credits || "0");
                        const isPlus = credNum > 0;
                        return (
                          <tr key={row.id}>
                            <td>
                              <span className={styles.code}>TX-{row.id}</span>
                            </td>
                            <td>
                              <StatusBadge
                                label={titleCase(row.transaction_type)}
                                tone={
                                  row.transaction_type === "topup" ||
                                  row.transaction_type === "subscription"
                                    ? "pine"
                                    : "neutral"
                                }
                              />
                            </td>
                            <td>{dateTime(row.created_at)}</td>
                            <td className={isPlus ? styles.amtPlus : styles.amtMinus}>
                              {isPlus ? `+${row.credits}` : row.credits}
                            </td>
                            <td>
                              {row.amount_inr ? inr(Number(row.amount_inr)) : "—"}
                            </td>
                            <td className="text-muted-foreground text-xs">
                              {row.notes || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={ledgerPage}
                  pageSize={ledgerPageSize}
                  totalItems={ledger.length}
                  onPageChange={setLedgerPage}
                  onPageSizeChange={setLedgerPageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                  itemLabel="transactions"
                  className="mt-2.5 px-0 py-1 border-t border-slate-100 bg-transparent"
                />
              </>
            )}
          </div>
        </div>

        <div className={styles.sideColumn}>
          <form className={styles.card} onSubmit={(e) => void handleSaveProfile(e)}>
            <h2 className={styles.cardTitle}>Billing Profile & GSTIN</h2>
            <div className={styles.formGroup}>
              <Field
                label="Company Legal Name"
                name="company_name"
                value={form.company_name}
                disabled={busy || !canWrite}
                onChange={(v) => setForm((f) => ({ ...f, company_name: v }))}
              />
              <Field
                label="GSTIN (Goods and Services Tax ID)"
                name="gstin"
                value={form.gstin}
                disabled={busy || !canWrite}
                hint="Used for tax input credit on official invoices."
                onChange={(v) => setForm((f) => ({ ...f, gstin: v.toUpperCase() }))}
              />
              <Field
                label="Billing Phone"
                name="phone"
                value={form.phone}
                disabled={busy || !canWrite}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              />

              {canWrite ? (
                <div className={styles.actions}>
                  <Button type="submit" loading={busy}>
                    Save Billing Profile
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
