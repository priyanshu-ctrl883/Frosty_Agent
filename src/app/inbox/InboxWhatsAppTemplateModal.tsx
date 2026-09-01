"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, MessageCircle, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type { WaTemplate } from "@/lib/types";
import { listWaTemplates } from "@/lib/leads/api";
import { inboxSendTemplate } from "@/lib/conversations";

export type TemplateDefinition = {
  id: string;
  name: string;
  category: string;
  language: string;
  body: string;
  variables: string[];
};

type Props = {
  open: boolean;
  conversationId: string;
  contactName: string;
  contactTopic?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export const InboxWhatsAppTemplateModal = ({
  open,
  conversationId,
  contactName,
  contactTopic,
  onClose,
  onSuccess,
}: Props) => {
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setVarValues({
      "{{1}}": contactName || "there",
      "{{2}}": contactTopic || "your inquiry",
    });

    const loadMetaTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const remoteTemplates = await listWaTemplates();
        const approved = (remoteTemplates ?? []).filter(
          (t: WaTemplate) => (t.status || "").toUpperCase() === "APPROVED",
        );
        const mapped: TemplateDefinition[] = approved.map((t: WaTemplate) => ({
          id: String(t.id || `${t.template_name}-${t.language}`),
          name: t.template_name,
          category: t.category || "UTILITY",
          language: t.language || "en_US",
          body: "Hi {{1}}, checking in regarding {{2}}. Please reply to continue our conversation.",
          variables: ["{{1}} - Contact name", "{{2}} - Topic"],
        }));
        setTemplates(mapped);
        setSelectedTemplateId(mapped[0]?.id ?? "");
      } catch {
        setTemplates([]);
        setSelectedTemplateId("");
      } finally {
        setLoadingTemplates(false);
      }
    };

    void loadMetaTemplates();
  }, [open, contactName, contactTopic]);

  if (!open) return null;

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) ?? templates[0];

  const renderedBody = currentTemplate
    ? currentTemplate.body
        .replace(/\{\{1\}\}/g, varValues["{{1}}"] || contactName || "there")
        .replace(/\{\{2\}\}/g, varValues["{{2}}"] || contactTopic || "your inquiry")
    : "";

  const handleSend = async () => {
    if (!currentTemplate) {
      setError("No approved template selected. Sync templates from WhatsApp settings first.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const out = await inboxSendTemplate(conversationId, {
        template_name: currentTemplate.name,
        language: currentTemplate.language,
        body_parameters: [
          varValues["{{1}}"] || contactName || "there",
          varValues["{{2}}"] || contactTopic || "your inquiry",
        ],
      });
      if (out.duplicate) {
        setError("This template was already sent — not sent twice.");
        return;
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send WhatsApp template");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-background border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border bg-amber-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-foreground">
                Send WhatsApp Template
              </h3>
              <p className="text-xs text-muted-foreground">
                Re-engage {contactName || "this contact"} after the 24h window closed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loadingTemplates ? (
            <p className="text-sm text-muted-foreground">Loading approved templates…</p>
          ) : templates.length === 0 ? (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-sm text-amber-900 dark:text-amber-200 space-y-3">
              <p className="font-semibold">No approved templates found</p>
              <p className="text-xs leading-relaxed">
                Connect your WhatsApp number and sync templates from Meta. Only approved templates
                can be sent outside the 24h window.
              </p>
              <Link
                href="/whatsapp?tab=settings"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0396A6] hover:bg-[#0396A6]/90 text-white text-xs font-bold transition-colors"
              >
                <span>Go to WhatsApp templates</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Approved template
                </label>
                <Select
                  size="md"
                  value={selectedTemplateId}
                  onChange={(val) => setSelectedTemplateId(val)}
                  options={templates.map((tpl) => ({
                    value: tpl.id,
                    label: `${tpl.name} (${tpl.category} · ${tpl.language})`,
                  }))}
                />
              </div>

              <div className="space-y-3 bg-muted/20 border border-border/60 rounded-xl p-4">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Template variables
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground mb-1 block">
                      {"{{1}} Contact name"}
                    </label>
                    <input
                      type="text"
                      value={varValues["{{1}}"] || ""}
                      onChange={(e) => setVarValues((prev) => ({ ...prev, "{{1}}": e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#0396A6]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-foreground mb-1 block">
                      {"{{2}} Topic"}
                    </label>
                    <input
                      type="text"
                      value={varValues["{{2}}"] || ""}
                      onChange={(e) => setVarValues((prev) => ({ ...prev, "{{2}}": e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#0396A6]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={13} /> Preview
                </div>
                <div className="p-4 bg-[#efeae2] dark:bg-[#0b141a] rounded-2xl border border-border/80">
                  <div className="max-w-[90%] bg-white dark:bg-[#202c33] rounded-2xl rounded-tl-sm p-4 shadow-sm border border-black/5">
                    <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{renderedBody}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSend()}
            loading={sending}
            disabled={!currentTemplate}
            className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold flex items-center gap-2 h-10 px-5"
          >
            <MessageCircle size={16} />
            <span>Send WhatsApp Template</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
