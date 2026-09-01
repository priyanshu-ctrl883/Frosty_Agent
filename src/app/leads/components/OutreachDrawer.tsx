"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Send,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Globe,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WhatsAppLogo } from "@/components/ui/WhatsAppLogo";
import type { Lead, FollowUpDelivery } from "@/lib/types";
import { sendLeadFollowUp, listLeadFollowUps, generateLeadDraft } from "@/lib/leads/api";

export type ToneOption = "professional" | "consultative" | "urgent" | "special_offer";

interface ToneConfig {
  value: ToneOption;
  label: string;
}

const TONE_OPTIONS: ToneConfig[] = [
  { value: "professional", label: "Professional" },
  { value: "consultative", label: "Consultative" },
  { value: "urgent", label: "Urgent" },
  { value: "special_offer", label: "Special Offer" },
];

interface Props {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onRequestTemplateModal: (lead: Lead) => void;
}

export function OutreachDrawer({ open, lead, onClose, onSuccess, onRequestTemplateModal }: Props) {
  const [selectedTone, setSelectedTone] = useState<ToneOption>("professional");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelWa, setChannelWa] = useState(false);

  const [hasGenerated, setHasGenerated] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");

  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [history, setHistory] = useState<FollowUpDelivery[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(new Set());
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);

  const toggleExpandHistory = (id: string) => {
    setExpandedHistoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyHistoryItem = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHistoryId(id);
    setTimeout(() => setCopiedHistoryId(null), 2000);
  };

  const fetchHistory = useCallback(async (leadId: number) => {
    setLoadingHistory(true);
    try {
      const deliveries = await listLeadFollowUps(leadId);
      setHistory(Array.isArray(deliveries) ? deliveries : []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Initialize drawer state on open or lead change
  useEffect(() => {
    if (!open || !lead) return;
    setSendResult(null);

    // Auto-select channels based on lead info & original channel
    const hasEmail = Boolean(lead.email);
    const hasPhone = Boolean(lead.phone);
    const isWaOriginal = lead.channel === "whatsapp";

    if (isWaOriginal && hasPhone) {
      setChannelWa(true);
      setChannelEmail(false);
    } else {
      setChannelEmail(hasEmail);
      setChannelWa(!hasEmail && hasPhone);
    }

    setDraftSubject("");
    setDraftBody("");
    setHasGenerated(false);
    setCustomInstruction("");
    fetchHistory(lead.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead?.id]);

  if (!open || !lead) return null;

  // Check 24-hour window rule for WhatsApp
  const lastActiveDate = lead.updated_at ? new Date(lead.updated_at) : new Date(lead.created_at);
  const isOutside24Hours = Date.now() - lastActiveDate.getTime() > 24 * 60 * 60 * 1000;
  // WhatsApp window expiration ONLY applies when WhatsApp channel is actively selected
  const isWhatsAppChannelActive = channelWa && Boolean(lead.phone);
  const isWhatsAppWindowExpired = isWhatsAppChannelActive && isOutside24Hours;

  const handleGenerateAIDraft = async (tone: ToneOption | null = null) => {
    const toneToUse = tone || selectedTone;
    if (tone) setSelectedTone(tone);

    setDrafting(true);
    setSendResult(null);
    try {
      if (!lead) return;
      const generated = await generateLeadDraft(lead.id, toneToUse, customInstruction);
      setDraftSubject(generated.subject || "");
      setDraftBody(generated.body || "");
      setHasGenerated(true);
    } catch (err: any) {
      setSendResult({ ok: false, msg: err?.message || "Failed to generate AI draft" });
    } finally {
      setDrafting(false);
    }
  };

  const handleCopyDraft = () => {
    const text = draftSubject ? `Subject: ${draftSubject}\n\n${draftBody}` : draftBody;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    setSendResult(null);

    const channels: ("email" | "whatsapp")[] = [];
    if (channelEmail && lead.email) channels.push("email");
    if (channelWa && lead.phone) channels.push("whatsapp");

    if (!channels.length) {
      setSendResult({ ok: false, msg: "Please select at least one delivery channel (Email or WhatsApp)." });
      return;
    }

    // WhatsApp 24-Hour Policy Check:
    // If WhatsApp is targeted and lead is outside the 24-hour window, open Meta Template Modal
    if (channels.includes("whatsapp") && isOutside24Hours) {
      onRequestTemplateModal(lead);
      return;
    }

    setSending(true);
    try {
      const res = await sendLeadFollowUp(lead.id, {
        channels,
        subject: draftSubject,
        body: draftBody,
      });

      if (res && res.queued && res.queued.length > 0) {
        setSendResult({
          ok: true,
          msg: `Follow-up queued successfully via ${res.queued.join(" & ")}.`,
        });
        onSuccess(`Follow-up queued for ${lead.name || "lead"}`);
        fetchHistory(lead.id);
      } else if (res && res.skipped && res.skipped.length > 0) {
        if (res.skipped.some((s) => s.includes("window_expired") || s.includes("template"))) {
          onRequestTemplateModal(lead);
          return;
        }
        setSendResult({ ok: false, msg: `Delivery skipped: ${res.skipped.join(", ")}` });
      } else {
        setSendResult({ ok: true, msg: "Follow-up message dispatched." });
        onSuccess(`Follow-up sent to ${lead.name || "lead"}`);
        fetchHistory(lead.id);
      }
    } catch (err: any) {
      if (err?.message?.includes("24h") || err?.message?.includes("window_expired") || err?.status === 409) {
        onRequestTemplateModal(lead);
      } else {
        setSendResult({ ok: false, msg: err?.message || "Failed to send follow-up" });
      }
    } finally {
      setSending(false);
    }
  };

  const isWaOnly = channelWa && !channelEmail;
  const isEmailOnly = channelEmail && !channelWa;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-stretch justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className="relative w-full sm:max-w-xl bg-background border-t sm:border-t-0 sm:border-l border-border h-[92vh] sm:h-full rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-border bg-muted/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-bold">
              <Send size={16} />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-foreground leading-tight">AI Outreach & Follow-up</h2>
              <p className="text-[11px] text-muted-foreground font-medium">
                Draft, personalize, and send lead follow-ups
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="w-8 h-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Lead Summary Profile Card */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border bg-[#0396A6]/10 text-[#0396A6] border-[#0396A6]/20">
                  {(lead.name || "L").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-foreground truncate">
                    {lead.name || "Anonymous Lead"}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-2 mt-0.5">
                    <span>Score: <strong className="text-foreground">{lead.score}</strong></span>
                  </div>
                </div>
              </div>

              {/* Channel text */}
              <span className="text-xs font-medium text-foreground shrink-0">
                {lead.channel === "whatsapp" ? "WhatsApp" : "Website"}
              </span>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 border-t border-border/50 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground truncate">
                <Mail size={12} className="shrink-0 text-muted-foreground/70" />
                <span className="truncate">{lead.email || <span className="italic">No email provided</span>}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground truncate font-mono text-[11px]">
                <Phone size={12} className="shrink-0 text-muted-foreground/70" />
                <span className="truncate">{lead.phone || <span className="italic font-sans">No phone provided</span>}</span>
              </div>
            </div>
          </div>

          {/* Delivery Channels Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Deliver Via Channels
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Email channel card */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  channelEmail && lead.email
                    ? "bg-[#0396A6]/10 border-[#0396A6]/40 shadow-xs"
                    : !lead.email
                    ? "bg-muted/20 border-border/50 opacity-60 cursor-not-allowed"
                    : "bg-card border-border hover:bg-muted/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={channelEmail}
                  disabled={!lead.email}
                  onChange={(e) => setChannelEmail(e.target.checked)}
                  className="rounded text-[#0396A6] focus:ring-[#0396A6] h-4 w-4 cursor-pointer mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Mail size={12} className="text-[#0396A6] shrink-0" />
                    <span>Email Delivery</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate pl-[18px] mt-0.5">
                    {lead.email || "No email available"}
                  </div>
                </div>
              </label>

              {/* WhatsApp channel card */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  channelWa && lead.phone
                    ? "bg-green-500/10 border-green-500/40 shadow-xs"
                    : !lead.phone
                    ? "bg-muted/20 border-border/50 opacity-60 cursor-not-allowed"
                    : "bg-card border-border hover:bg-muted/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={channelWa}
                  disabled={!lead.phone}
                  onChange={(e) => setChannelWa(e.target.checked)}
                  className="rounded text-[#25D366] focus:ring-[#25D366] h-4 w-4 cursor-pointer mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <WhatsAppLogo size={14} className="text-[#25D366] shrink-0" />
                    <span>WhatsApp Delivery</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate pl-[20px] mt-0.5">
                    {lead.phone || "No phone available"}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* WhatsApp 24h Policy Notice (ONLY when WhatsApp delivery is selected and 24h passed) */}
          {isWhatsAppWindowExpired && (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in duration-200">
              <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-xs text-amber-800 dark:text-amber-300">
                  WhatsApp 24-Hour Window Expired
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  Last conversation was active on {lastActiveDate.toLocaleDateString()}. To reach out via WhatsApp, Meta requires a pre-approved template.
                </div>
                <button
                  type="button"
                  onClick={() => onRequestTemplateModal(lead)}
                  className="text-xs font-bold text-amber-900 dark:text-amber-200 underline mt-1.5 inline-flex items-center gap-1 hover:opacity-80 cursor-pointer"
                >
                  <span>Select Meta Approved Template</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* AI Follow-up Drafter Section */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#0396A6]" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {isWaOnly ? "AI WhatsApp Draft" : isEmailOnly ? "AI Email Draft" : "AI Outreach Draft"}
                </span>
              </div>
              {draftBody && (
                <button
                  type="button"
                  onClick={handleCopyDraft}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold cursor-pointer transition-colors"
                  disabled={drafting}
                >
                  {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  <span>{copied ? "Copied" : "Copy Draft"}</span>
                </button>
              )}
            </div>

            {/* Tone Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setSelectedTone(t.value);
                    if (hasGenerated) handleGenerateAIDraft(t.value);
                  }}
                  disabled={drafting}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                    selectedTone === t.value
                      ? "bg-[#0396A6] text-white border-[#0396A6] shadow-sm shadow-[#0396A6]/20"
                      : "bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  } ${drafting ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {!hasGenerated && (
              <Button
                type="button"
                onClick={() => handleGenerateAIDraft()}
                loading={drafting}
                className="w-full bg-gradient-to-r from-[#0396A6] to-[#02808E] hover:from-[#028493] hover:to-[#026f7b] text-white font-bold h-10 rounded-xl shadow-sm cursor-pointer"
              >
                <Sparkles size={14} className="mr-2" />
                Generate AI Draft
              </Button>
            )}

            {/* Subject Input (shown if email channel is included) */}
            {channelEmail && (
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Subject Line
                </label>
                {drafting ? (
                  <div className="h-10 w-full bg-muted/40 animate-pulse rounded-xl border border-border"></div>
                ) : (
                  <input
                    type="text"
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    placeholder="e.g. Following up on your inquiry..."
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-[#0396A6]/20 focus:border-[#0396A6] transition-all"
                  />
                )}
              </div>
            )}

            {/* Message Body Textarea */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Message Body
              </label>
              {drafting ? (
                <div className="h-[140px] w-full bg-muted/40 animate-pulse rounded-xl border border-border"></div>
              ) : (
                <textarea
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  rows={6}
                  placeholder="Type or customize your personalized message..."
                  className="w-full bg-background border border-border rounded-xl p-3.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#0396A6]/20 focus:border-[#0396A6] leading-relaxed resize-y font-normal transition-all"
                />
              )}
            </div>

            {/* Custom Instructions for Regeneration */}
            {hasGenerated && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder="Ask AI to refine (e.g. 'Make it concise')..."
                  className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-[#0396A6]/20 focus:border-[#0396A6] transition-all"
                  disabled={drafting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleGenerateAIDraft()}
                  loading={drafting}
                  className="h-9 px-3.5 font-bold border border-border text-foreground hover:bg-muted rounded-xl"
                >
                  <RefreshCw size={13} className="mr-1.5" />
                  Refine
                </Button>
              </div>
            )}

            {/* Send Result Banner */}
            {sendResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in ${
                  sendResult.ok
                    ? "bg-green-500/10 text-green-700 border-green-500/20"
                    : "bg-red-500/10 text-red-600 border-red-500/20"
                }`}
              >
                {sendResult.ok ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
                <span>{sendResult.msg}</span>
              </div>
            )}
          </div>

          {/* Outreach & Follow-up History Section */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-muted-foreground" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Activity History ({history.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => fetchHistory(lead.id)}
                disabled={loadingHistory}
                className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title="Refresh history"
              >
                <RefreshCw size={12} className={loadingHistory ? "animate-spin" : ""} />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-[#0396A6]/30 border-t-[#0396A6] rounded-full animate-spin" />
                Loading activity history...
              </div>
            ) : history.length === 0 ? (
              <div className="py-5 px-4 bg-muted/15 border border-border/60 rounded-xl text-center text-xs text-muted-foreground">
                No previous follow-ups recorded for this lead yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {history.map((item) => {
                  const isWa = item.channel === "whatsapp";
                  const isExpanded = expandedHistoryIds.has(item.id);
                  const isCopiedThis = copiedHistoryId === item.id;
                  const messageText = item.body
                    ? item.subject
                      ? `Subject: ${item.subject}\n\n${item.body}`
                      : item.body
                    : "";

                  return (
                    <div
                      key={item.id}
                      className="bg-card border border-border rounded-xl p-3.5 space-y-2 hover:border-[#0396A6]/40 transition-all shadow-xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-foreground">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isWa ? "bg-green-500/10 text-[#25D366]" : "bg-[#0396A6]/10 text-[#0396A6]"
                            }`}
                          >
                            {isWa ? <WhatsAppLogo size={14} className="text-[#25D366]" /> : <Mail size={13} />}
                          </div>
                          <div>
                            <span className="capitalize">{item.channel} Outreach</span>
                            <span className="ml-2 text-xs font-semibold text-[#0396A6]">
                              Step {item.sequence_step}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-foreground capitalize">
                          {item.status}
                        </span>
                      </div>

                      {item.recipient && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                          <span className="text-foreground/70">To:</span>
                          <span className="text-foreground font-mono text-[10.5px]">{item.recipient}</span>
                        </div>
                      )}

                      {item.subject && (
                        <div className="text-xs font-semibold text-foreground bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/50">
                          <span className="text-muted-foreground font-normal mr-1.5">Subject:</span>
                          {item.subject}
                        </div>
                      )}

                      {item.body && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => toggleExpandHistory(item.id)}
                              className="text-[11px] text-[#0396A6] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              {isExpanded ? <EyeOff size={12} /> : <Eye size={12} />}
                              <span>{isExpanded ? "Hide content" : "View content"}</span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            {isExpanded && (
                              <button
                                type="button"
                                onClick={() => handleCopyHistoryItem(item.id, messageText)}
                                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
                              >
                                {isCopiedThis ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
                                <span>{isCopiedThis ? "Copied" : "Copy"}</span>
                              </button>
                            )}
                          </div>

                          {isExpanded ? (
                            <div className="bg-muted/30 border border-border/70 rounded-xl p-3 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
                              {item.body}
                            </div>
                          ) : (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed italic">
                              "{item.body.slice(0, 120)}..."
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                        <span className="capitalize">Trigger: {item.trigger_kind || "manual"}</span>
                        <span>{new Date(item.sent_at || item.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-border bg-background/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-muted-foreground truncate hidden sm:block">
            {channelEmail && channelWa
              ? "Sending via Email & WhatsApp"
              : channelEmail
              ? "Sending via Email"
              : channelWa
              ? "Sending via WhatsApp"
              : "Select a delivery channel"}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-10 px-4 font-bold border border-border text-foreground hover:bg-muted rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              loading={sending}
              disabled={drafting || (!channelEmail && !channelWa)}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-[#0396A6] to-[#02808E] hover:from-[#028493] hover:to-[#026f7b] text-white font-bold h-10 px-5 rounded-xl shadow-md shadow-[#0396A6]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send size={14} />
              <span>Send Follow-up</span>
            </Button>
            {isWhatsAppWindowExpired && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onRequestTemplateModal(lead)}
                className="border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 font-bold h-10 px-3.5 rounded-xl"
                title="Send Meta-Approved Template"
              >
                <MessageCircle size={14} className="mr-1.5" />
                <span>Meta Template</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
