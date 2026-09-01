"use client";

import React, { useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  LifeBuoy,
  X,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Paperclip,
  Trash2,
  Loader2,
} from "lucide-react";
import { apiRequest, ApiClientError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import styles from "./tickets.module.css";

import { TicketAttachment, TicketAttachmentUploader } from "./TicketAttachments";

export type TicketCategory =
  | "Billing"
  | "Technical / Agent"
  | "WhatsApp / Channel"
  | "Knowledge Base"
  | "Account / Access"
  | "Feature Request"
  | "Other";

export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export interface TicketCreatedResponse {
  id: string;
  ticket_number: string;
  merchant_id: string;
  created_by_name: string;
  created_by_email?: string | null;
  subject: string;
  category: string;
  priority: string;
  description: string;
  related_resource?: string | null;
  attachments?: any[];
  status: string;
  created_at: string;
  updated_at?: string;
}

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSubject?: string;
  defaultCategory?: TicketCategory;
  defaultRelatedResource?: string;
  onTicketCreated?: (ticket: TicketCreatedResponse) => void;
}

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "Billing", label: "Billing & Subscriptions" },
  { value: "Technical / Agent", label: "Technical / Agent Intelligence" },
  { value: "WhatsApp / Channel", label: "WhatsApp / Channel Integrations" },
  { value: "Knowledge Base", label: "Knowledge Base & Documents" },
  { value: "Account / Access", label: "Account & Team Access" },
  { value: "Feature Request", label: "Feature Request / Suggestion" },
  { value: "Other", label: "Other Inquiries" },
];

const PRIORITIES: {
  value: TicketPriority;
  label: string;
  dotColor: string;
  desc: string;
  tone: string;
}[] = [
  { value: "Low", label: "Low", dotColor: "#94a3b8", desc: "Non-critical questions or minor inquiries (48h SLA)", tone: "neutral" },
  { value: "Medium", label: "Medium", dotColor: "#0396A6", desc: "Standard support requests & workflow questions (24h SLA)", tone: "info" },
  { value: "High", label: "High", dotColor: "#f59e0b", desc: "Significant degradation affecting daily workflows (8h SLA)", tone: "warning" },
  { value: "Urgent", label: "Urgent", dotColor: "rgb(255, 122, 94)", desc: "Critical outage, revenue block, or data corruption (2h SLA)", tone: "critical" },
];


export function CreateTicketModal({
  open,
  onOpenChange,
  defaultSubject = "",
  defaultCategory = "Technical / Agent",
  defaultRelatedResource = "",
  onTicketCreated,
}: CreateTicketModalProps) {
  const { showToast } = useToast();

  const [subject, setSubject] = useState(defaultSubject);
  const [category, setCategory] = useState<TicketCategory>(defaultCategory);
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [description, setDescription] = useState("");
  const [relatedResource, setRelatedResource] = useState(defaultRelatedResource);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);

  // Validation & UI state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<TicketCreatedResponse | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const isSubjectInvalid = touched.subject && !subject.trim();
  const isDescriptionInvalid = touched.description && !description.trim();

  const resetForm = () => {
    setSubject(defaultSubject);
    setCategory(defaultCategory);
    setPriority("Medium");
    setDescription("");
    setRelatedResource(defaultRelatedResource);
    setAttachments([]);
    setTouched({});
    setApiError(null);
    setCreatedTicket(null);
    setCopiedId(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      resetForm();
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ subject: true, description: true });

    if (!subject.trim() || !description.trim()) {
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      const envInfo = {
        browser: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        platform: typeof navigator !== "undefined" ? navigator.platform : "unknown",
        language: typeof navigator !== "undefined" ? navigator.language : "en",
        url: typeof window !== "undefined" ? window.location.pathname : "",
      };

      const result = await apiRequest<TicketCreatedResponse>("/v1/merchant/tickets", {
        method: "POST",
        body: {
          subject: subject.trim(),
          category,
          priority,
          description: description.trim(),
          related_resource: relatedResource.trim() || null,
          attachments,
          environment_info: envInfo,
        },
      });

      setCreatedTicket(result);
      if (onTicketCreated) {
        onTicketCreated(result);
      }


      showToast("Ticket submitted successfully. Our team will respond shortly.", {
        type: "success",
        title: "Ticket Submitted",
      });
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Failed to submit ticket. Please check your network and try again.";
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyTicketId = () => {
    if (!createdTicket) return;
    navigator.clipboard.writeText(createdTicket.ticket_number);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.modalContent} aria-describedby="ticket-dialog-desc">
          {/* Header */}
          <div className={styles.modalHeader}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div className={styles.headerIconWrap}>
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className={styles.headerTitle}>
                  {createdTicket ? "Ticket Submitted" : "Raise Support Ticket"}
                </Dialog.Title>
                <Dialog.Description id="ticket-dialog-desc" className={styles.headerDesc}>
                  {createdTicket
                    ? "Your issue has been logged and assigned to our technical team."
                    : "Report an issue or request assistance from our support engineering team."}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close className={styles.closeBtn} aria-label="Close modal">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          {/* Success View */}
          {createdTicket ? (
            <div className={styles.successContainer}>
              <div className={styles.successIconWrap}>
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className={styles.successTitle}>Ticket #{createdTicket.ticket_number} Created</h3>
              <p className={styles.successMessage}>
                Ticket submitted successfully. Our team will respond shortly via email and in your
                notifications.
              </p>

              <div className={styles.ticketBadgeBox}>
                <span className={styles.ticketBadgeLabel}>Reference ID:</span>
                <span className={styles.ticketBadgeCode}>{createdTicket.ticket_number}</span>
                <button
                  type="button"
                  onClick={handleCopyTicketId}
                  className={styles.copyBadgeBtn}
                  title="Copy Ticket ID"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className={styles.successActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => {
                    resetForm();
                  }}
                >
                  Raise Another Ticket
                </button>
                <button type="button" className={styles.submitBtn} onClick={handleClose}>
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <div className={styles.modalBody}>
                {apiError && (
                  <div className={styles.errorBanner} role="alert">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                {/* Subject */}
                <div className={styles.field}>
                  <label htmlFor="ticket-subject" className={styles.label}>
                    Subject <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="ticket-subject"
                    type="text"
                    className={`${styles.input} ${isSubjectInvalid ? styles.inputError : ""}`}
                    placeholder="e.g. WhatsApp messages not syncing with inbox"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      if (touched.subject) setTouched((prev) => ({ ...prev, subject: false }));
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, subject: true }))}
                    maxLength={200}
                    disabled={submitting}
                    autoFocus
                  />
                  {isSubjectInvalid && (
                    <p className={styles.errorText}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      Subject is required
                    </p>
                  )}
                </div>

                {/* Category & Priority in 2-column on desktop */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Category */}
                  <div className={styles.field}>
                    <label htmlFor="ticket-category" className={styles.label}>
                      Category <span className={styles.required}>*</span>
                    </label>
                    <select
                      id="ticket-category"
                      className={styles.select}
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TicketCategory)}
                      disabled={submitting}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div className={styles.field}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>Priority</label>
                    </div>
                    <div className={styles.priorityGroup}>
                      {PRIORITIES.map((p) => {
                        const isActive = priority === p.value;
                        const isUrgent = p.value === "Urgent";
                        return (
                          <button
                            key={p.value}
                            type="button"
                            className={`${styles.priorityBtn} ${
                              isActive
                                ? isUrgent
                                  ? styles.priorityBtnActiveUrgent
                                  : styles.priorityBtnActive
                                : ""
                            }`}
                            onClick={() => setPriority(p.value)}
                            disabled={submitting}
                          >
                            <span
                              className={styles.priorityDot}
                              style={{ background: p.dotColor }}
                            />
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label htmlFor="ticket-desc" className={styles.label}>
                      Description <span className={styles.required}>*</span>
                    </label>
                    <span className={styles.charCount}>{description.length} / 5000</span>
                  </div>
                  <textarea
                    id="ticket-desc"
                    className={`${styles.textarea} ${
                      isDescriptionInvalid ? styles.textareaError : ""
                    }`}
                    rows={4}
                    placeholder="Describe the issue in detail, what you expected to happen, and steps to reproduce..."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (touched.description)
                        setTouched((prev) => ({ ...prev, description: false }));
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
                    maxLength={5000}
                    disabled={submitting}
                  />
                  {isDescriptionInvalid && (
                    <p className={styles.errorText}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      Description is required
                    </p>
                  )}
                </div>

                {/* Related Resource */}
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label htmlFor="ticket-resource" className={styles.label}>
                      Related Resource
                    </label>
                    <span className={styles.optionalBadge}>Optional</span>
                  </div>
                  <input
                    id="ticket-resource"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Conversation ID, Agent Name, Order ID, Invoice #"
                    value={relatedResource}
                    onChange={(e) => setRelatedResource(e.target.value)}
                    maxLength={200}
                    disabled={submitting}
                  />
                </div>

                {/* Attachments */}
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>Attachments</label>
                    <span className={styles.optionalBadge}>Optional</span>
                  </div>
                  <TicketAttachmentUploader
                    attachments={attachments}
                    onChange={setAttachments}
                    disabled={submitting}
                  />
                </div>
              </div>


              {/* Footer Actions */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Ticket…</span>
                    </>
                  ) : (
                    <span>Submit Ticket</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
