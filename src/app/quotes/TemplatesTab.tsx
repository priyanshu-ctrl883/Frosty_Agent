"use client";

import { FormEvent, forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Field } from "@/components/ui/Field";
import { ErrorBox, PageState } from "@/components/ui/PageState";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/lib/toast";
import type { MerchantMe, QuoteTemplate } from "@/lib/types";
import {
  Plus,
  Star,
  Sparkles,
  LayoutTemplate,
  CheckCircle2,
  Trash2,
  Edit3,
  Eye,
  Layers,
  ArrowRight,
  Info,
  Clock,
} from "lucide-react";
import styles from "./quotes.module.css";
import { PRESET_TEMPLATES, type PresetTemplate } from "./templates/presetTemplates";
import { AiTemplateModal } from "./templates/AiTemplateModal";
import { TemplateLivePreview } from "./templates/TemplateLivePreview";

const PLACEHOLDERS = [
  "{{customer_name}}",
  "{{customer_email}}",
  "{{company_name}}",
  "{{date}}",
  "{{valid_until}}",
] as const;

const emptyForm = {
  name: "Default proposal",
  intro:
    "Dear {{customer_name}},\n\nPlease find our proposal for the services you asked about. Prices are from our catalogue.",
  terms: "This quotation is valid until {{valid_until}} unless withdrawn earlier.",
  footer: "Thank you for considering {{company_name}}.",
  validity_days: "14",
  is_default: true,
};

type Props = {
  merchant: MerchantMe | null;
  canEdit: boolean;
};

export type TemplatesTabHandle = {
  startCreate: () => void;
  openAiModal: () => void;
};

export const TemplatesTab = forwardRef<TemplatesTabHandle, Props>(function TemplatesTab(
  { merchant, canEdit },
  ref
) {
  const [templates, setTemplates] = useState<QuoteTemplate[] | null>(null);
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<"edit" | "preview">("edit");
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<QuoteTemplate | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await apiRequest<QuoteTemplate[]>("/v1/quotations/templates");
      setTemplates(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load templates");
      setTemplates([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startCreate() {
    setEditingId("new");
    setForm(emptyForm);
    setActiveEditorTab("edit");
    setNotice(null);
  }

  useImperativeHandle(
    ref,
    () => ({
      startCreate,
      openAiModal: () => setIsAiModalOpen(true),
    }),
    []
  );

  function startEdit(t: QuoteTemplate) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      intro: t.intro,
      terms: t.terms,
      footer: t.footer,
      validity_days: String(t.validity_days),
      is_default: t.is_default,
    });
    setActiveEditorTab("edit");
    setNotice(null);
  }

  function applyPreset(preset: PresetTemplate) {
    setEditingId("new");
    setForm({
      name: preset.name,
      intro: preset.intro,
      terms: preset.terms,
      footer: preset.footer,
      validity_days: preset.validity_days,
      is_default: templates ? templates.length === 0 : true,
    });
    setActiveEditorTab("edit");
    setNotice(`Loaded preset "${preset.title}". You can now customize and save it.`);
  }

  function applyAiGenerated(aiTemplate: {
    name: string;
    intro: string;
    terms: string;
    footer: string;
    validity_days: string;
  }) {
    setEditingId("new");
    setForm({
      name: aiTemplate.name,
      intro: aiTemplate.intro,
      terms: aiTemplate.terms,
      footer: aiTemplate.footer,
      validity_days: aiTemplate.validity_days,
      is_default: templates ? templates.length === 0 : true,
    });
    setActiveEditorTab("edit");
    setNotice(`AI Template applied! Review the fields below and save when ready.`);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    const days = Number(form.validity_days);
    if (!form.name.trim() || !Number.isFinite(days) || days < 1) {
      setError("Give the template a name and a validity of at least 1 day.");
      return;
    }
    const body = {
      name: form.name.trim(),
      intro: form.intro,
      terms: form.terms,
      footer: form.footer,
      validity_days: Math.min(365, Math.max(1, Math.round(days))),
      is_default: form.is_default,
      is_active: true,
    };
    setBusy(true);
    setError(null);
    try {
      if (editingId && editingId !== "new") {
        await apiRequest(`/v1/quotations/templates/${editingId}`, {
          method: "PATCH",
          body,
        });
        setNotice("Template saved. The bot will use the default one for new quotations.");
      } else {
        await apiRequest("/v1/quotations/templates", { method: "POST", body });
        setNotice("Template created. Mark one as default for the bot to use it.");
      }
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the template");
    } finally {
      setBusy(false);
    }
  }

  async function makeDefault(t: QuoteTemplate) {
    setBusy(true);
    try {
      await apiRequest(`/v1/quotations/templates/${t.id}`, {
        method: "PATCH",
        body: { is_default: true },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set default template");
    } finally {
      setBusy(false);
    }
  }

  async function remove(t: QuoteTemplate) {
    setBusy(true);
    try {
      await apiRequest(`/v1/quotations/templates/${t.id}`, { method: "DELETE" });
      if (editingId === t.id) setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the template");
    } finally {
      setBusy(false);
    }
  }

  if (templates === null) {
    return <p className={styles.hint}>Loading templates…</p>;
  }

  const companyBits = [
    merchant?.company_name || "Your company name",
    merchant?.gstin ? `GSTIN ${merchant.gstin}` : null,
    merchant?.phone || null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="rounded-2xl border border-border/80 bg-white p-5 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Company Letterhead & Branding
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{companyBits.join(" · ")}</p>
          </div>

          {canEdit && !editingId && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button
                type="button"
                variant="ghost"
                onClick={startCreate}
                className="text-xs font-semibold flex items-center gap-1.5 border border-border/80 bg-white hover:bg-muted/40 rounded-xl h-8.5 px-3"
              >
                <Plus className="w-3.5 h-3.5 text-[#03A8CB]" />
                New Blank Template
              </Button>
              <Button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="text-xs font-semibold bg-gradient-to-r from-[#03A8CB] to-[#0284A6] hover:from-[#0284A6] hover:to-[#03A8CB] text-white shadow-sm flex items-center gap-1.5 rounded-xl h-8.5 px-3.5"
              >
                AI Template Creator
              </Button>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          The AI bot automatically personalizes each quotation with the visitor's name, email, date, and verified catalog line items using the template marked as default.
        </p>
      </div>

      {/* Presets Gallery Section */}
      {canEdit && !editingId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Standard Industry Presets
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Click any preset to load and customize</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESET_TEMPLATES.map((preset) => (
              <div
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="group p-4 rounded-xl border border-border/70 bg-white hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#03A8CB]">
                      {preset.badge}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {preset.validity_days} days
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {preset.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-xs text-primary font-semibold">
                  <span>Use This Preset</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Editor & Live Preview Panel */}
      {editingId ? (
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary" />
              {editingId === "new" ? "Create New Quotation Template" : `Editing: ${form.name}`}
            </h3>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-0.5 rounded-lg text-xs font-medium border border-border bg-white">
                <button
                  type="button"
                  onClick={() => setActiveEditorTab("edit")}
                  className={`px-3 py-1.5 rounded-md border transition-colors ${
                    activeEditorTab === "edit"
                      ? "bg-white text-foreground border-border font-semibold shadow-xs"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEditorTab("preview")}
                  className={`px-3 py-1.5 rounded-md border transition-colors flex items-center gap-1 ${
                    activeEditorTab === "preview"
                      ? "bg-white text-primary border-border font-semibold shadow-xs"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Live Preview
                </button>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingId(null)}
                className="text-xs border border-border bg-white"
              >
                Close
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Form Editor Column */}
            <form onSubmit={(e) => void save(e)} className="rounded-2xl border border-border bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Template Details
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Placeholders: {PLACEHOLDERS.join(" ")}
                </span>
              </div>

              <Field
                label="Template Name"
                name="template_name"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                required
              />

              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Proposal Introduction
                </span>
                <textarea
                  name="intro"
                  rows={4}
                  value={form.intro}
                  onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))}
                  className="w-full text-sm rounded-xl border border-border bg-white px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-sans resize-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Terms & Conditions
                </span>
                <textarea
                  name="terms"
                  rows={4}
                  value={form.terms}
                  onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
                  className="w-full text-sm rounded-xl border border-border bg-white px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono text-xs resize-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Closing Footer / Sign-off
                </span>
                <textarea
                  name="footer"
                  rows={2}
                  value={form.footer}
                  onChange={(e) => setForm((f) => ({ ...f, footer: e.target.value }))}
                  className="w-full text-sm rounded-xl border border-border bg-white px-3.5 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-sans resize-none"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <Field
                  label="Validity Period (days)"
                  name="validity_days"
                  type="number"
                  value={form.validity_days}
                  onChange={(v) => setForm((f) => ({ ...f, validity_days: v }))}
                />

                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer pt-4">
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/30"
                  />
                  <span>Set as default template for the bot</span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                <Button type="submit" disabled={busy} className="text-xs font-semibold">
                  Save Template
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setEditingId(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </form>

            {/* Live Preview Column */}
            <div className="space-y-2">
              <TemplateLivePreview template={form} merchant={merchant} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Templates List Table */}
      {!templates.length && !editingId ? (
        <PageState
          icon="description"
          title="No quotation template yet"
          description="Pick one of the standard presets above or click 'AI Template Creator' to build your first customized quotation template."
          card={false}
        />
      ) : !editingId ? (
          <div className="rounded-xl border border-border/80 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Saved Quotation Templates
              </h3>
            </div>

            {/* Desktop table */}
            <table className="w-full text-left border-collapse text-xs hidden sm:table">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Template Name</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {templates.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">{t.name}</span>
                        {t.is_default ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Star className="w-3 h-3 fill-current" />
                            Default
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60">
                        <Clock className="w-3 h-3" />
                        {t.validity_days} days
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold text-foreground capitalize">
                        {t.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canEdit ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => startEdit(t)}
                            className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          {!t.is_default ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() => void makeDefault(t)}
                              className="h-7 px-2 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                            >
                              <Star className="w-3.5 h-3.5 mr-1" />
                              Set Default
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => void remove(t)}
                            className="h-7 px-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-border/40">
              {templates.map((t) => (
                <div key={t.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">{t.name}</span>
                        {t.is_default ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Star className="w-3 h-3 fill-current" />
                            Default
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60">
                          <Clock className="w-3 h-3" />
                          {t.validity_days} days
                        </span>
                        <span className="text-xs font-semibold text-foreground capitalize">
                          {t.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {canEdit ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => startEdit(t)}
                        className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted flex-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      {!t.is_default ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => void makeDefault(t)}
                          className="h-8 px-3 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 flex-1"
                        >
                          <Star className="w-3.5 h-3.5 mr-1" />
                          Set Default
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => setDeleteTemplateTarget(t)}
                        className="h-8 px-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-500/10"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
      ) : null}

      {/* AI Template Creator Modal */}
      <AiTemplateModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApply={applyAiGenerated}
        companyName={merchant?.company_name || undefined}
      />

      {/* Confirm Modal: Delete Template */}
      <ConfirmModal
        isOpen={Boolean(deleteTemplateTarget)}
        title="Delete Quotation Template"
        message={`Are you sure you want to delete template "${deleteTemplateTarget?.name}"? This action cannot be undone.`}
        tone="danger"
        confirmText="Delete Template"
        cancelText="Cancel"
        onConfirm={async () => {
          if (deleteTemplateTarget) {
            const target = deleteTemplateTarget;
            setDeleteTemplateTarget(null);
            await remove(target);
          }
        }}
        onClose={() => setDeleteTemplateTarget(null)}
      />
    </div>
  );
});
