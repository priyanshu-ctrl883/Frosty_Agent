"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

import type { TicketCreatedResponse } from "./CreateTicketModal";
import {
  TicketAttachment,
  TicketAttachmentList,
  TicketAttachmentUploader,
} from "./TicketAttachments";
import {
  AlertTriangle,
  ArrowDown,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  LifeBuoy,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Send,
  Tag,
  User,
  X,
} from "lucide-react";
import styles from "./tickets.module.css";

export interface MerchantTicketComment {
  id: string;
  ticket_id: string;
  merchant_id: string;
  author_user_id: string | null;
  author_name: string;
  author_email: string | null;
  author_role: "merchant" | "staff" | "system" | string;
  comment_type: "public" | "system" | string;
  body: string;
  attachments?: TicketAttachment[] | any[];
  metadata: Record<string, any>;
  created_at: string;
}


interface Props {
  ticketId: string | null;
  onClose: () => void;
  onTicketUpdated?: (updatedTicket: TicketCreatedResponse) => void;
}

export function MerchantTicketDetailDrawer({
  ticketId,
  onClose,
  onTicketUpdated,
}: Props) {
  const [ticket, setTicket] = useState<TicketCreatedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Status Action Modals
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenComment, setReopenComment] = useState("");
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeComment, setCloseComment] = useState("");

  // Comments state
  const [comments, setComments] = useState<MerchantTicketComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [composerAttachments, setComposerAttachments] = useState<TicketAttachment[]>([]);
  const [postingReply, setPostingReply] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  // Ticket header direct attachments state
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [headerAttachments, setHeaderAttachments] = useState<TicketAttachment[]>([]);
  const [attachingFiles, setAttachingFiles] = useState(false);

  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const threadContainerRef = useRef<HTMLDivElement | null>(null);


  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "nearest",
      });
    }
  }, []);

  const fetchComments = useCallback(async (id: string, background = false) => {
    if (!background) setLoadingComments(true);
    try {
      const res = await apiRequest<{ data: MerchantTicketComment[] } | MerchantTicketComment[]>(
        `/v1/merchant/tickets/${id}/comments`,
      );
      const items = Array.isArray(res) ? res : (res as { data: MerchantTicketComment[] }).data || [];
      setComments(items);
    } catch {
      // Ignore background poll errors
    } finally {
      if (!background) setLoadingComments(false);
    }
  }, []);

  const fetchTicket = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: TicketCreatedResponse } | TicketCreatedResponse>(
        `/v1/merchant/tickets/${id}`,
      );
      const data = (res as { data?: TicketCreatedResponse }).data || (res as TicketCreatedResponse);
      setTicket(data);
      fetchComments(id, false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load ticket details";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchComments]);

  useEffect(() => {
    if (ticketId) {
      fetchTicket(ticketId);
    } else {
      setTicket(null);
      setComments([]);
      setReplyText("");
    }
  }, [ticketId, fetchTicket]);

  // Polling comments while open
  useEffect(() => {
    if (!ticketId) return;
    const interval = setInterval(() => {
      fetchComments(ticketId, true);
    }, 8000);
    return () => clearInterval(interval);
  }, [ticketId, fetchComments]);

  const handleScrollThread = () => {
    if (!threadContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = threadContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowJumpToLatest(isUp);
  };

  useEffect(() => {
    if (!ticketId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (reopenModalOpen) setReopenModalOpen(false);
        else if (closeModalOpen) setCloseModalOpen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ticketId, reopenModalOpen, closeModalOpen, onClose]);

  if (!mounted || !ticketId) return null;

  const handleCopyId = () => {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.ticket_number || ticket.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReopenSubmit = async () => {
    if (!ticket || !reopenComment.trim() || updating) return;
    setUpdating(true);
    try {
      const res = await apiRequest<{ data: TicketCreatedResponse } | TicketCreatedResponse>(
        `/v1/merchant/tickets/${ticket.id}`,
        {
          method: "PATCH",
          body: {
            status: "Open",
            comment: reopenComment.trim(),
          },
        },
      );
      const updated = (res as { data?: TicketCreatedResponse }).data || (res as TicketCreatedResponse);
      setTicket(updated);
      onTicketUpdated?.(updated);
      setReopenModalOpen(false);
      setReopenComment("");
      fetchComments(ticket.id, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to re-open ticket");
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseSubmit = async () => {
    if (!ticket || updating) return;
    setUpdating(true);
    try {
      const res = await apiRequest<{ data: TicketCreatedResponse } | TicketCreatedResponse>(
        `/v1/merchant/tickets/${ticket.id}`,
        {
          method: "PATCH",
          body: {
            status: "Closed",
            comment: closeComment.trim() || undefined,
          },
        },
      );
      const updated = (res as { data?: TicketCreatedResponse }).data || (res as TicketCreatedResponse);
      setTicket(updated);
      onTicketUpdated?.(updated);
      setCloseModalOpen(false);
      setCloseComment("");
      fetchComments(ticket.id, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close ticket");
    } finally {
      setUpdating(false);
    }
  };

  const handleAttachFilesToTicket = async () => {
    if (!ticket || headerAttachments.length === 0 || attachingFiles) return;
    setAttachingFiles(true);
    try {
      const res = await apiRequest<{ data: TicketCreatedResponse } | TicketCreatedResponse>(
        `/v1/merchant/tickets/${ticket.id}/attachments`,
        {
          method: "POST",
          body: { attachments: headerAttachments },
        },
      );
      const updated = (res as { data?: TicketCreatedResponse }).data || (res as TicketCreatedResponse);
      setTicket(updated);
      setHeaderAttachments([]);
      setShowAttachModal(false);
      onTicketUpdated?.(updated);
      fetchComments(ticket.id, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attach files");
    } finally {
      setAttachingFiles(false);
    }
  };

  const handleSendReply = async () => {
    if (!ticket || (!replyText.trim() && composerAttachments.length === 0) || postingReply) return;
    setPostingReply(true);
    try {
      const res = await apiRequest<{ data: MerchantTicketComment } | MerchantTicketComment>(
        `/v1/merchant/tickets/${ticket.id}/comments`,
        {
          method: "POST",
          body: {
            body: replyText.trim() || (composerAttachments.length > 0 ? `Shared ${composerAttachments.length} attachment(s)` : ""),
            attachments: composerAttachments,
          },
        },
      );

      const newComment = (res as { data?: MerchantTicketComment }).data || (res as MerchantTicketComment);
      setComments((prev) => [...prev, newComment]);
      setReplyText("");
      setComposerAttachments([]);
      setTimeout(() => scrollToBottom(true), 50);

      // Touch ticket updated_at locally
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              updated_at: new Date().toISOString(),
            }
          : null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setPostingReply(false);
    }
  };



  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Helper styling for status
  const getStatusColor = (status: string) => {
    const s = (status || "Open").toLowerCase();
    if (s === "in progress") return { bg: "rgba(37, 99, 235, 0.1)", text: "#2563eb", dot: "#2563eb" };
    if (s === "waiting on merchant") return { bg: "rgba(255, 122, 94, 0.12)", text: "rgb(255, 122, 94)", dot: "rgb(255, 122, 94)" };
    if (s === "resolved") return { bg: "rgba(5, 150, 105, 0.1)", text: "#059669", dot: "#059669" };
    if (s === "closed") return { bg: "#f1f5f9", text: "#64748b", dot: "#64748b" };
    return { bg: "rgba(3, 150, 166, 0.1)", text: "#0396A6", dot: "#0396A6" };
  };

  const getPriorityColor = (priority: string) => {
    const p = (priority || "Medium").toLowerCase();
    if (p === "low") return { bg: "#f1f5f9", text: "#64748b" };
    if (p === "high") return { bg: "rgba(217, 119, 6, 0.1)", text: "#d97706" };
    if (p === "urgent") return { bg: "rgba(255, 122, 94, 0.14)", text: "rgb(255, 122, 94)" };
    return { bg: "rgba(3, 150, 166, 0.1)", text: "#0396A6" };
  };

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const formatRelative = (iso: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diffSec < 60) return "just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return "";
    }
  };

  const isClosed = ticket?.status === "Closed" || ticket?.status === "Resolved";

  return createPortal(
    <>
      <div className={styles.drawerBackdrop} onClick={onClose} />
      <aside
        className={styles.drawerPanel}
        role="dialog"
        aria-modal="true"
        aria-label={`Ticket ${ticket?.ticket_number || ticketId}`}
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeaderLeft}>
            <div className={styles.drawerBadgeRow}>
              {ticket && (
                <button
                  className={styles.btnCopyId}
                  onClick={handleCopyId}
                  title="Click to copy Ticket ID"
                >
                  <span>{ticket.ticket_number || ticket.id.slice(0, 8)}</span>
                  {copied ? <Check size={12} color="#0396A6" /> : <Copy size={12} />}
                </button>
              )}

              {ticket && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: getStatusColor(ticket.status).bg,
                    color: getStatusColor(ticket.status).text,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: getStatusColor(ticket.status).dot,
                    }}
                  />
                  {ticket.status}
                </span>
              )}

              {ticket && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: getPriorityColor(ticket.priority).bg,
                    color: getPriorityColor(ticket.priority).text,
                  }}
                >
                  {ticket.priority} Priority
                </span>
              )}

              {ticket?.category && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11.5,
                    fontWeight: 500,
                    backgroundColor: "#f8fafc",
                    color: "#475569",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Tag size={11} style={{ marginRight: 4 }} />
                  {ticket.category}
                </span>
              )}
            </div>

            <h2 className={styles.detailTitle}>
              {ticket ? ticket.subject : "Loading Ticket..."}
            </h2>
          </div>

          <button
            onClick={onClose}
            className={styles.btnCloseDrawer}
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Bar (Merchant close / re-open) */}
        {ticket && (
          <div className={styles.merchantActionBar}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", fontWeight: 500 }}>
              <LifeBuoy size={16} color="#0396A6" />
              <span>Frostrek Support Desk</span>
            </div>


            <div className={styles.merchantActionBtns}>
              {isClosed ? (
                <button
                  className={styles.btnSecondaryAction}
                  disabled={updating}
                  onClick={() => {
                    setReopenComment("");
                    setReopenModalOpen(true);
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Re-open Ticket</span>
                </button>
              ) : (
                <button
                  className={styles.btnDangerAction}
                  disabled={updating}
                  onClick={() => {
                    setCloseComment("");
                    setCloseModalOpen(true);
                  }}
                >
                  <CheckCircle size={13} />
                  <span>Close Ticket</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Re-open Modal */}
        {reopenModalOpen && (
          <div className={styles.modalBackdrop} onClick={() => setReopenModalOpen(false)}>
            <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Re-open Ticket</h3>
                <button
                  onClick={() => setReopenModalOpen(false)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
                >
                  <X size={18} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
                  Please tell us why you are re-opening this ticket so our support team can assist you:
                </p>
                <textarea
                  className={styles.composerTextareaMerchant}
                  placeholder="e.g. The issue is still occurring when running the morning cron..."
                  value={reopenComment}
                  onChange={(e) => setReopenComment(e.target.value)}
                  rows={3}
                  autoFocus
                />
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setReopenModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.modalSubmitBtn}
                  disabled={!reopenComment.trim() || updating}
                  onClick={handleReopenSubmit}
                >
                  <RotateCcw size={13} />
                  <span>{updating ? "Re-opening..." : "Re-open Ticket"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close Confirmation Modal */}
        {closeModalOpen && (
          <div className={styles.modalBackdrop} onClick={() => setCloseModalOpen(false)}>
            <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Close Ticket</h3>
                <button
                  onClick={() => setCloseModalOpen(false)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
                >
                  <X size={18} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
                  Are you sure you want to mark this ticket as closed?
                </p>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                  Optional closing note / feedback:
                </label>
                <textarea
                  className={styles.composerTextareaMerchant}
                  placeholder="e.g. Resolved and verified on our end, thanks!"
                  value={closeComment}
                  onChange={(e) => setCloseComment(e.target.value)}
                  rows={2}
                />
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setCloseModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`${styles.modalSubmitBtn} ${styles.modalSubmitBtnDanger}`}
                  disabled={updating}
                  onClick={handleCloseSubmit}
                >
                  <CheckCircle size={13} />
                  <span>{updating ? "Closing..." : "Confirm & Close"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attach Files Direct Modal */}
        {showAttachModal && ticket && (
          <div className={styles.modalBackdrop} onClick={() => setShowAttachModal(false)}>
            <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  Attach Files to Ticket {ticket.ticket_number}
                </h3>
                <button
                  onClick={() => setShowAttachModal(false)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
                >
                  <X size={18} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <p style={{ fontSize: 12.5, color: "#475569", margin: 0 }}>
                  Upload files directly to this ticket. They will be visible in the ticket header and logged in the activity thread.
                </p>
                <TicketAttachmentUploader
                  attachments={headerAttachments}
                  onChange={setHeaderAttachments}
                  disabled={attachingFiles}
                />
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => {
                    setHeaderAttachments([]);
                    setShowAttachModal(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.modalSubmitBtn}
                  disabled={headerAttachments.length === 0 || attachingFiles}
                  onClick={handleAttachFilesToTicket}
                >
                  <Paperclip size={14} />
                  <span>{attachingFiles ? "Attaching..." : `Attach ${headerAttachments.length} File(s)`}</span>
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Content Body */}
        <div className={styles.detailBody}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ height: 40, background: "#f1f5f9", borderRadius: 6 }} />
              <div style={{ height: 100, background: "#f1f5f9", borderRadius: 6 }} />
              <div style={{ height: 120, background: "#f1f5f9", borderRadius: 6 }} />
            </div>
          )}

          {error && !ticket && (
            <div style={{ padding: 24, textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              <AlertTriangle size={32} color="rgb(255, 122, 94)" />
              <p style={{ color: "#0f172a", fontSize: 14, fontWeight: 600, margin: 0 }}>{error}</p>
              <button
                className={styles.btnSecondaryAction}
                onClick={() => ticketId && fetchTicket(ticketId)}
              >
                Retry
              </button>
            </div>
          )}

          {error && ticket && (
            <div style={{ padding: "10px 14px", background: "rgba(255, 122, 94, 0.1)", border: "1px solid rgba(255, 122, 94, 0.3)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgb(220, 60, 30)", fontSize: 13, fontWeight: 500 }}>
                <AlertTriangle size={16} color="rgb(255, 122, 94)" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", padding: 2, display: "flex", alignItems: "center" }}
              >
                <X size={14} />
              </button>
            </div>
          )}


          {ticket && !loading && (
            <>
              {/* Metadata Cards */}
              <div className={styles.metadataGrid}>
                <div className={styles.metaCard}>
                  <span className={styles.metaLabel}>Category</span>
                  <span className={styles.metaValue}>{ticket.category}</span>
                </div>
                <div className={styles.metaCard}>
                  <span className={styles.metaLabel}>Requester</span>
                  <span className={styles.metaValue}>{ticket.created_by_name}</span>
                  {ticket.created_by_email && (
                    <span className={styles.metaSubValue}>{ticket.created_by_email}</span>
                  )}
                </div>
                <div className={styles.metaCard}>
                  <span className={styles.metaLabel}>Created</span>
                  <span className={styles.metaValue} title={formatDate(ticket.created_at)}>
                    {formatRelative(ticket.created_at)}
                  </span>
                </div>
                <div className={styles.metaCard}>
                  <span className={styles.metaLabel}>Last Updated</span>
                  <span className={styles.metaValue} title={formatDate(ticket.updated_at || ticket.created_at)}>
                    {formatRelative(ticket.updated_at || ticket.created_at)}
                  </span>
                </div>

                {ticket.related_resource && (() => {
                  const res = ticket.related_resource.toLowerCase();
                  let safeHref: string | null = null;
                  let safeLabel = ticket.related_resource;

                  if (res.startsWith("agent:") || res.startsWith("bot:")) {
                    safeHref = "/agent";
                    safeLabel = `Agent Configuration (${ticket.related_resource})`;
                  } else if (res.startsWith("conv:") || res.startsWith("conversation:")) {
                    safeHref = "/conversations";
                    safeLabel = `Conversation (${ticket.related_resource})`;
                  } else if (res.startsWith("catalog:") || res.startsWith("product:")) {
                    safeHref = "/catalog";
                    safeLabel = `Product Catalog (${ticket.related_resource})`;
                  } else if (res.startsWith("billing:") || res.startsWith("plan:")) {
                    safeHref = "/billing";
                    safeLabel = `Billing & Plans (${ticket.related_resource})`;
                  }

                  return (
                    <div className={styles.metaCard} style={{ gridColumn: "1 / -1" }}>
                      <span className={styles.metaLabel}>Related Resource</span>
                      {safeHref ? (
                        <Link href={safeHref} className={styles.resourceLinkCard}>
                          <ExternalLink size={13} />
                          <span>{safeLabel}</span>
                        </Link>
                      ) : (
                        <span className={styles.metaValue} style={{ fontFamily: "monospace" }}>
                          {ticket.related_resource}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>


              {/* Description */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionCardHeader}>
                  <FileText size={15} color="#0396A6" />
                  <h3 className={styles.sectionCardTitle}>Issue Description</h3>
                </div>
                <div className={styles.descriptionText}>{ticket.description}</div>
              </div>

              {/* Attachments */}
              <div className={styles.sectionCard}>
                <TicketAttachmentList
                  attachments={ticket.attachments || []}
                  canAttach
                  onAttachClick={() => setShowAttachModal(true)}
                />
              </div>

              {/* Conversation / Comments Thread (Feature 4) */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionCardHeader}>
                  <MessageSquare size={15} color="#0396A6" />
                  <h3 className={styles.sectionCardTitle}>
                    Conversation with Frostrek Support ({comments.length})
                  </h3>
                </div>

                <div
                  className={styles.commentsThreadMerchant}
                  ref={threadContainerRef}
                  onScroll={handleScrollThread}
                >
                  {loadingComments && comments.length === 0 ? (
                    <div style={{ height: 60, background: "#f8fafc", borderRadius: 8 }} />
                  ) : comments.length === 0 ? (
                    <div className={styles.emptyCommentsBox}>
                      <MessageSquare size={22} color="#94a3b8" />
                      <p className={styles.emptyCommentsTitle}>No messages yet</p>
                      <p className={styles.emptyCommentsSubtitle}>
                        Frostrek support will reply here. You can also send additional details below.
                      </p>
                    </div>
                  ) : (
                    comments.map((comment) => {
                      const isStaff = comment.author_role === "staff";
                      const isSystem = comment.comment_type === "system" || comment.author_role === "system";

                      if (isSystem) {
                        return (
                          <div key={comment.id} className={styles.commentSystemMsgMerchant}>
                            <Clock size={12} />
                            <span>{comment.body}</span>
                            <span>• {formatRelative(comment.created_at)}</span>
                          </div>
                        );
                      }

                      const initials = (comment.author_name || "User")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <div
                          key={comment.id}
                          className={`${styles.commentCardMerchant} ${
                            isStaff ? styles.commentCardStaff : styles.commentCardUser
                          }`}
                        >
                          <div className={styles.commentCardHeader}>
                            <div className={styles.commentAuthorMeta}>
                              <div
                                className={`${styles.commentAvatarMerchant} ${
                                  isStaff
                                    ? styles.commentAvatarStaff
                                    : styles.commentAvatarUser
                                }`}
                              >
                                {initials}
                              </div>
                              <span className={styles.commentAuthorNameMerchant}>
                                {comment.author_name}
                              </span>
                              <span
                                className={`${styles.commentRoleBadgeMerchant} ${
                                  isStaff
                                    ? styles.commentRoleStaff
                                    : styles.commentRoleUser
                                }`}
                              >
                                {isStaff ? "Frostrek Support" : "You"}
                              </span>
                            </div>
                            <span
                              className={styles.commentTimeMerchant}
                              title={formatDate(comment.created_at)}
                            >
                              {formatRelative(comment.created_at)}
                            </span>
                          </div>
                          <p className={styles.commentBodyMerchant}>{comment.body}</p>
                          {comment.attachments && comment.attachments.length > 0 && (
                            <div style={{ marginTop: "8px" }}>
                              <TicketAttachmentList
                                attachments={comment.attachments}
                                title="Attachments"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={threadEndRef} />
                </div>

                {showJumpToLatest && (
                  <button
                    className={styles.jumpToLatestBtnMerchant}
                    onClick={() => scrollToBottom(true)}
                  >
                    <ArrowDown size={12} />
                    <span>Jump to latest</span>
                  </button>
                )}

                {/* Reply Composer */}
                <div className={styles.composerBoxMerchant}>
                  <textarea
                    className={styles.composerTextareaMerchant}
                    placeholder="Type your message to Frostrek Support... (Ctrl+Enter to send)"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleReplyKeyDown}
                    disabled={postingReply}
                  />

                  {/* Attachment Uploader inside composer */}
                  <div style={{ padding: "0 12px 8px" }}>
                    <TicketAttachmentUploader
                      attachments={composerAttachments}
                      onChange={setComposerAttachments}
                      disabled={postingReply}
                    />
                  </div>

                  <div className={styles.composerBottomBarMerchant}>
                    <span className={styles.composerHintMerchant}>
                      Press <strong>Ctrl+Enter</strong> to send
                    </span>
                    <button
                      type="button"
                      className={styles.sendReplyBtnMerchant}
                      disabled={(!replyText.trim() && composerAttachments.length === 0) || postingReply}
                      onClick={handleSendReply}
                    >
                      <Send size={13} />
                      <span>{postingReply ? "Sending..." : "Send Reply"}</span>
                    </button>
                  </div>
                </div>
              </div>

            </>
          )}
        </div>
      </aside>
    </>,
    document.body,
  );
}
