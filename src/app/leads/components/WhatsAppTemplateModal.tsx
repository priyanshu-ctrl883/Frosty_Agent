"use client";

import React, { useState, useEffect } from "react";
import { MessageCircle, AlertTriangle, Send, X, Check, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type { Lead, WaTemplate } from "@/lib/types";
import { listWaTemplates, sendLeadFollowUp } from "@/lib/leads/api";

export interface TemplateDefinition {
  id: string;
  name: string;
  category: string;
  language: string;
  header?: string;
  body: string;
  footer?: string;
  variables: string[];
}

const DEFAULT_APPROVED_TEMPLATES: TemplateDefinition[] = [
  {
    id: "lead_followup_v1",
    name: "lead_followup_v1",
    category: "MARKETING",
    language: "en_US",
    header: "Follow-up on Your Request",
    body: "Hi {{1}}, thank you for reaching out to us regarding {{2}}. We would love to assist you further. Please let us know if you have any questions or when you are available for a quick chat!",
    footer: "Reply STOP to unsubscribe",
    variables: ["{{1}} - Lead Name", "{{2}} - Topic / Stated Interest"],
  },
  {
    id: "consultation_checkin",
    name: "consultation_checkin",
    category: "UTILITY",
    language: "en_US",
    header: "Quick Check-in",
    body: "Hello {{1}}, we noticed you were interested in {{2}}. Our specialist is ready to provide you with tailored recommendations. Would you like to schedule a quick call today?",
    footer: "Reply 1 for Yes, 2 for Later",
    variables: ["{{1}} - Lead Name", "{{2}} - Product / Service Interest"],
  },
  {
    id: "special_offer_reengage",
    name: "special_offer_reengage",
    category: "MARKETING",
    language: "en_US",
    header: "Exclusive Update for You",
    body: "Hi {{1}}, we have a special update regarding {{2}}! To help you get started, we are offering priority onboarding for your account. Reply to this message to claim this offer.",
    footer: "Terms & conditions apply",
    variables: ["{{1}} - Lead Name", "{{2}} - Inquiry Topic"],
  },
  {
    id: "quote_inquiry_update",
    name: "quote_inquiry_update",
    category: "UTILITY",
    language: "en_US",
    header: "Information Regarding Your Inquiry",
    body: "Dear {{1}}, following up on your inquiry about {{2}}. We have prepared the preliminary details for you. Please reply when convenient so we can share the full summary.",
    footer: "Customer Support Team",
    variables: ["{{1}} - Lead Name", "{{2}} - Inquired Service"],
  },
];

const FALLBACK_TEMPLATE: TemplateDefinition = {
  id: "lead_followup_v1",
  name: "lead_followup_v1",
  category: "MARKETING",
  language: "en_US",
  header: "Follow-up on Your Request",
  body: "Hi {{1}}, thank you for reaching out to us regarding {{2}}. We would love to assist you further. Please let us know if you have any questions or when you are available for a quick chat!",
  footer: "Reply STOP to unsubscribe",
  variables: ["{{1}} - Lead Name", "{{2}} - Topic / Stated Interest"],
};

interface Props {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function WhatsAppTemplateModal({ open, lead, onClose, onSuccess }: Props) {
  const [templates, setTemplates] = useState<TemplateDefinition[]>(DEFAULT_APPROVED_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_APPROVED_TEMPLATES[0]?.id || "lead_followup_v1");
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !lead) return;
    setError(null);

    // Populate initial variable interpolations from lead
    const leadName = lead.name || "there";
    const leadInterest = lead.interest || "your inquiry";

    setVarValues({
      "{{1}}": leadName,
      "{{2}}": leadInterest,
    });

    async function loadMetaTemplates() {
      setLoadingTemplates(true);
      try {
        const remoteTemplates = await listWaTemplates();
        if (Array.isArray(remoteTemplates) && remoteTemplates.length > 0) {
          const mapped: TemplateDefinition[] = remoteTemplates.map((t: WaTemplate) => ({
            id: String(t.id || t.template_name),
            name: t.template_name,
            category: t.category || "UTILITY",
            language: t.language || "en_US",
            body: `Hi {{1}}, checking in regarding {{2}}. Please reply to this message to continue our conversation.`,
            footer: "Official WhatsApp Notification",
            variables: ["{{1}} - Lead Name", "{{2}} - Topic"],
          }));
          // Merge with defaults
          setTemplates([...mapped, ...DEFAULT_APPROVED_TEMPLATES]);
          if (mapped[0]?.id) {
            setSelectedTemplateId(mapped[0].id);
          }
        }
      } catch {
        // Fallback to approved defaults
      } finally {
        setLoadingTemplates(false);
      }
    }

    loadMetaTemplates();
  }, [open, lead]);

  if (!open || !lead) return null;

  const currentTemplate: TemplateDefinition =
    templates.find((t) => t.id === selectedTemplateId) ||
    templates[0] ||
    FALLBACK_TEMPLATE;

  // Render preview body with substituted variables
  const renderedBody = currentTemplate.body
    .replace(/\{\{1\}\}/g, varValues["{{1}}"] || lead.name || "there")
    .replace(/\{\{2\}\}/g, varValues["{{2}}"] || lead.interest || "your recent inquiry");

  const handleSend = async () => {
    if (!lead) return;
    setSending(true);
    setError(null);
    try {
      const fullMessage = `${currentTemplate.header ? `*${currentTemplate.header}*\n\n` : ""}${renderedBody}${
        currentTemplate.footer ? `\n\n_${currentTemplate.footer}_` : ""
      }`;

      const res = await sendLeadFollowUp(lead.id, {
        channels: ["whatsapp"],
        body: fullMessage,
      });

      if (res && res.queued && res.queued.includes("whatsapp")) {
        onSuccess(`WhatsApp template "${currentTemplate.name}" queued and sent to ${lead.phone || lead.name}.`);
        onClose();
      } else if (res && res.skipped && res.skipped.length > 0) {
        throw new Error(`WhatsApp delivery skipped: ${res.skipped.join(", ")}`);
      } else {
        onSuccess(`WhatsApp template message dispatched.`);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to dispatch WhatsApp template");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-background border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-amber-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-xs">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                WhatsApp 24-Hour Window Expired
              </h3>
              <p className="text-xs text-muted-foreground">
                Meta policy requires an approved template to re-engage {lead.name || "this lead"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
          <strong>Why is this required?</strong> This WhatsApp conversation has been inactive for more than 24 hours.
          Free-form messages are paused by Meta. Sending an approved template opens a new 24-hour messaging window
          when the customer replies.
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Template Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Select Meta-Approved Template
            </label>
            <Select
              size="md"
              value={selectedTemplateId}
              onChange={(val) => setSelectedTemplateId(val)}
              options={templates.map((tpl) => ({
                value: tpl.id,
                label: `${tpl.name} (${tpl.category} • ${tpl.language})`,
              }))}
            />
          </div>

          {/* Variables form */}
          <div className="space-y-3 bg-muted/20 border border-border/60 rounded-xl p-4">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Template Variables</span>
              <span className="text-[10px] text-muted-foreground font-normal">Auto-filled from lead profile</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-foreground mb-1 block">{"{{1}} Lead Name"}</label>
                <input
                  type="text"
                  value={varValues["{{1}}"] || ""}
                  onChange={(e) => setVarValues((prev) => ({ ...prev, "{{1}}": e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#0396A6]"
                  placeholder="e.g. John"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-foreground mb-1 block">{"{{2}} Interest / Topic"}</label>
                <input
                  type="text"
                  value={varValues["{{2}}"] || ""}
                  onChange={(e) => setVarValues((prev) => ({ ...prev, "{{2}}": e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#0396A6]"
                  placeholder="e.g. Pricing inquiry"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp Message Preview Bubble */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Eye size={13} /> Live WhatsApp Message Preview
            </div>
            <div className="p-4 bg-[#efeae2] dark:bg-[#0b141a] rounded-2xl border border-border/80 flex flex-col shadow-inner">
              <div className="max-w-[90%] bg-white dark:bg-[#202c33] text-foreground rounded-2xl rounded-tl-sm p-4 shadow-sm border border-black/5 space-y-2">
                {currentTemplate.header && (
                  <div className="font-bold text-xs text-foreground border-b border-border/40 pb-1.5">
                    {currentTemplate.header}
                  </div>
                )}
                <div className="text-[13px] leading-relaxed whitespace-pre-wrap text-foreground">
                  {renderedBody}
                </div>
                {currentTemplate.footer && (
                  <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                    {currentTemplate.footer}
                  </div>
                )}
                <div className="text-[9px] text-muted-foreground text-right pt-0.5 font-mono">
                  {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleSend}
              loading={sending}
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold shadow-md shadow-[#25D366]/20 flex items-center gap-2 h-10 px-5"
            >
              <MessageCircle size={16} />
              <span>Send WhatsApp Template</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
