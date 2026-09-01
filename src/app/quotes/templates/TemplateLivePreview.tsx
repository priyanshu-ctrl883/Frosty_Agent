"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import type { MerchantMe } from "@/lib/types";

type Props = {
  template: {
    name: string;
    intro: string;
    terms: string;
    footer: string;
    validity_days: string;
  };
  merchant: MerchantMe | null;
};

export function TemplateLivePreview({ template, merchant }: Props) {
  const [showRawPlaceholders, setShowRawPlaceholders] = useState(false);

  const validityDays = Number(template.validity_days) || 14;
  const today = new Date();
  const validUntilDate = new Date(today);
  validUntilDate.setDate(today.getDate() + validityDays);

  const dateStr = today.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const validUntilStr = validUntilDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const companyName = merchant?.company_name || "Your Company Name";
  const gstin = merchant?.gstin;
  const phone = merchant?.phone;

  function renderText(rawText: string) {
    if (showRawPlaceholders) return rawText;
    return rawText
      .replace(/\{\{\s*customer_name\s*\}\}/g, "Asha Sharma")
      .replace(/\{\{\s*customer_email\s*\}\}/g, "asha@example.test")
      .replace(/\{\{\s*company_name\s*\}\}/g, companyName)
      .replace(/\{\{\s*date\s*\}\}/g, dateStr)
      .replace(/\{\{\s*valid_until\s*\}\}/g, validUntilStr);
  }

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
      {/* Top Bar with Mode Switcher */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Document Live Preview
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            {template.name || "Untitled Template"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-0.5 rounded-lg border border-border text-xs">
          <button
            type="button"
            onClick={() => setShowRawPlaceholders(false)}
            className={`px-2.5 py-1 rounded-md font-medium border transition-colors ${
              !showRawPlaceholders
                ? "bg-white text-primary border-border font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Rendered
          </button>
          <button
            type="button"
            onClick={() => setShowRawPlaceholders(true)}
            className={`px-2.5 py-1 rounded-md font-medium border transition-colors ${
              showRawPlaceholders
                ? "bg-white text-primary border-border font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Placeholders
          </button>
        </div>
      </div>

      {/* Simulated Document Paper */}
      <div className="p-6 md:p-8 space-y-6 bg-white text-foreground font-sans">
        {/* Letterhead Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-border/80">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground tracking-tight">{companyName}</h2>
            <div className="text-xs text-muted-foreground space-y-0.5">
              {gstin && <p>GSTIN: {gstin}</p>}
              {phone && <p>Phone: {phone}</p>}
              <p>Official Sales Proposal & Estimate</p>
            </div>
          </div>

          <div className="text-xs text-right sm:text-right space-y-1 self-start sm:self-auto p-2.5 rounded-sm border border-border/40 bg-white">
            <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
              <Calendar className="w-3.5 h-3.5" />
              <span>Date: <strong>{dateStr}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-semibold justify-end">
              <span>Valid Until: {validUntilStr} ({validityDays} days)</span>
            </div>
          </div>
        </div>

        {/* Recipient — plain text, no badge or icon box */}
        <div className="text-xs text-foreground space-y-0.5">
          <p>
            <span className="text-muted-foreground">Recipient:</span>{" "}
            <span className="font-medium">
              {showRawPlaceholders ? "{{customer_name}}" : "Asha Sharma"}
            </span>
            {!showRawPlaceholders ? (
              <span className="text-muted-foreground">
                {" "}
                · asha@example.test
              </span>
            ) : (
              <span className="text-muted-foreground">
                {" "}
                · {"{{customer_email}}"}
              </span>
            )}
          </p>
        </div>

        {/* Intro Section */}
        <div className="space-y-1">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Proposal Introduction
          </h4>
          <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed bg-white p-3.5 rounded-xl border border-border/40">
            {renderText(template.intro) || "(No intro provided)"}
          </p>
        </div>

        {/* Line Items Sample Table */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Quotation Line Items (Filled from Catalogue)
            </h4>
            <span className="text-[10px] text-muted-foreground">Sample Preview Data</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60 bg-white">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60">
                <tr>
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-3 text-center">Qty</th>
                  <th className="py-2 px-3 text-right">Unit Price</th>
                  <th className="py-2 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                <tr>
                  <td className="py-2.5 px-3 font-medium">Standard Service Package</td>
                  <td className="py-2.5 px-3 text-center">1</td>
                  <td className="py-2.5 px-3 text-right">₹4,999.00</td>
                  <td className="py-2.5 px-3 text-right font-semibold">₹4,999.00</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium">Add-on Warranty & Protection</td>
                  <td className="py-2.5 px-3 text-center">1</td>
                  <td className="py-2.5 px-3 text-right">₹1,200.00</td>
                  <td className="py-2.5 px-3 text-right font-semibold">₹1,200.00</td>
                </tr>
              </tbody>
              <tfoot className="bg-muted/20 border-t border-border/60 font-semibold text-xs">
                <tr>
                  <td colSpan={3} className="py-1.5 px-3 text-right text-muted-foreground">
                    Subtotal:
                  </td>
                  <td className="py-1.5 px-3 text-right">₹6,199.00</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-1.5 px-3 text-right text-muted-foreground">
                    GST (18%):
                  </td>
                  <td className="py-1.5 px-3 text-right">₹1,115.82</td>
                </tr>
                <tr className="text-sm font-bold text-primary border-t border-border/60">
                  <td colSpan={3} className="py-2 px-3 text-right">
                    Total (incl. GST):
                  </td>
                  <td className="py-2 px-3 text-right">₹7,314.82</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Terms Section */}
        <div className="space-y-1">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Terms & Conditions
          </h4>
          <p className="text-xs text-foreground/80 whitespace-pre-line leading-relaxed bg-white p-3.5 rounded-xl border border-border/40 font-mono text-[11px]">
            {renderText(template.terms) || "(No terms provided)"}
          </p>
        </div>

        {/* Footer Sign-off */}
        <div className="pt-2 border-t border-border/60 space-y-1 text-xs text-muted-foreground">
          <p className="whitespace-pre-line font-medium text-foreground">
            {renderText(template.footer) || "(No closing footer)"}
          </p>
        </div>
      </div>
    </div>
  );
}
