"use client";

import React, { useRef, useState } from "react";
import {
  Download,
  Eye,
  File,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { API_URL } from "@/lib/constants";
import { getToken } from "@/lib/session";
import { impersonationHeader } from "@/lib/impersonation";
import { useStorageUsage, notifyStorageUpdated } from "@/lib/useStorageUsage";
import { StorageWarningBanner } from "@/components/storage/StorageWarningBanner";
import styles from "./tickets.module.css";



const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const DISALLOWED_EXTS = new Set([
  "exe", "bat", "cmd", "sh", "ps1", "msi", "scr", "vbs", "js", "jar",
  "com", "pif", "application", "gadget", "wsf", "hta", "cpl", "msc",
]);

export interface TicketAttachment {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  url: string;
  uploaded_by_user_id?: string | null;
  uploaded_by_name?: string | null;
  created_at?: string | null;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(filename: string, mime?: string) {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  const m = (mime || "").toLowerCase();

  if (m.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
    return <ImageIcon size={15} color="#0396A6" />;
  }
  if (m === "application/pdf" || ext === "pdf") {
    return <FileText size={15} color="#ef4444" />;
  }
  if (["zip", "rar", "tar", "gz", "7z"].includes(ext)) {
    return <FileArchive size={15} color="#f59e0b" />;
  }
  if (["csv", "xlsx", "xls"].includes(ext)) {
    return <FileSpreadsheet size={15} color="#10b981" />;
  }
  if (["json", "xml", "html", "py", "ts", "js", "sql"].includes(ext)) {
    return <FileCode size={15} color="#6366f1" />;
  }
  return <File size={15} color="#64748b" />;
}

export async function uploadMerchantAttachmentFile(
  file: globalThis.File,
): Promise<TicketAttachment> {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (DISALLOWED_EXTS.has(ext)) {
    throw new Error(`File type '.${ext}' is not permitted for security reasons.`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File '${file.name}' exceeds the 25 MB size limit.`);
  }

  const token = await getToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  Object.assign(headers, impersonationHeader());

  const res = await fetch(`${API_URL}/v1/merchant/tickets/upload`, {
    method: "POST",
    headers,
    body: formData,
  });


  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || "Failed to upload file");
  }

  return json.data as TicketAttachment;
}

interface AttachmentUploaderProps {
  attachments: TicketAttachment[];
  onChange: (attachments: TicketAttachment[]) => void;
  disabled?: boolean;
}

export function TicketAttachmentUploader({
  attachments,
  onChange,
  disabled = false,
}: AttachmentUploaderProps) {
  const { usage, isAtLimit, refresh } = useStorageUsage();
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled || isAtLimit) return;
    setErrorMsg(null);

    // Pre-check storage quota
    let totalBytes = 0;
    for (let i = 0; i < files.length; i++) {
      totalBytes += files[i]?.size || 0;
    }
    if (usage && usage.storage_used_bytes + totalBytes > usage.storage_limit_bytes) {
      setErrorMsg(
        `Storage limit reached. You have used ${usage.used_formatted} of ${usage.limit_formatted}. Please free up space or contact support to increase your limit.`
      );
      return;
    }

    setUploading(true);

    const uploadedList: TicketAttachment[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      try {
        const att = await uploadMerchantAttachmentFile(file);
        uploadedList.push(att);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : `Failed to upload ${file.name}`;
        errors.push(msg);
      }
    }


    if (uploadedList.length > 0) {
      onChange([...attachments, ...uploadedList]);
      void refresh();
      notifyStorageUpdated();
    }
    if (errors.length > 0) {
      setErrorMsg(errors.join(" | "));
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = (index: number) => {
    onChange(attachments.filter((_, i) => i !== index));
    void refresh();
    notifyStorageUpdated();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isAtLimit) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isAtLimit) return;
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className={styles.uploaderWrap}>
      <StorageWarningBanner usage={usage} className="mb-2.5" />

      <div
        className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ""}`}
        style={
          isAtLimit
            ? {
                borderColor: "rgb(255, 122, 94)",
                backgroundColor: "rgba(255, 122, 94, 0.05)",
                cursor: "not-allowed",
              }
            : undefined
        }
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isAtLimit && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          disabled={disabled || uploading || isAtLimit}
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className={styles.dropzoneContent}>
            <Loader2 className={styles.spinIcon} size={20} color="#0396A6" />
            <span style={{ fontSize: "12.5px", color: "#475569", fontWeight: 500 }}>
              Uploading files securely…
            </span>
          </div>
        ) : (
          <div className={styles.dropzoneContent}>
            <UploadCloud size={20} color={isAtLimit ? "rgb(255, 122, 94)" : "#0396A6"} />
            <span
              style={{
                fontSize: "12.5px",
                color: isAtLimit ? "rgb(230, 85, 55)" : "#334155",
                fontWeight: isAtLimit ? 600 : 500,
              }}
            >
              {isAtLimit ? (
                <strong>Storage limit reached (Uploads blocked)</strong>
              ) : (
                <>
                  <strong>Click to upload</strong> or drag & drop files here
                </>
              )}
            </span>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              PNG, JPG, PDF, TXT, CSV, ZIP up to 25 MB
            </span>
          </div>
        )}
      </div>

      {errorMsg && <p className={styles.uploaderError}>{errorMsg}</p>}

      {attachments.length > 0 && (
        <div className={styles.attachedPillsList}>
          {attachments.map((att, idx) => (
            <div key={att.id || idx} className={styles.attachedPill}>
              {getFileIcon(att.filename, att.mime_type)}
              <span className={styles.attachedPillName} title={att.filename}>
                {att.filename}
              </span>
              <span className={styles.attachedPillSize}>
                ({formatFileSize(att.size_bytes)})
              </span>
              {!disabled && (
                <button
                  type="button"
                  className={styles.removePillBtn}
                  onClick={() => handleRemove(idx)}
                  title="Remove file"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AttachmentListProps {
  attachments: (TicketAttachment | any)[];
  title?: string;
  onAttachClick?: () => void;
  canAttach?: boolean;
  ticketId?: string;
  canDelete?: boolean;
  onDeleted?: (fileObjectId: string) => void;
}

export function TicketAttachmentList({
  attachments,
  title = "Attachments",
  onAttachClick,
  canAttach = false,
  ticketId,
  canDelete = false,
  onDeleted,
}: AttachmentListProps) {
  const [previewItem, setPreviewItem] = useState<TicketAttachment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (att: TicketAttachment) => {
    if (!ticketId || !att.id || deletingId) return;
    if (!window.confirm(`Delete "${att.filename}"? This cannot be undone.`)) return;
    setDeletingId(att.id);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      Object.assign(headers, impersonationHeader());
      const res = await fetch(`${API_URL}/v1/merchant/tickets/${ticketId}/attachments/${att.id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || "Failed to delete attachment");
      }
      notifyStorageUpdated();
      onDeleted?.(att.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete attachment";
      window.alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  if (!attachments || attachments.length === 0) {
    if (!canAttach) return null;
    return (
      <div className={styles.attachmentsSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <Paperclip size={15} color="#0396A6" />
            {title} (0)
          </h3>
          {onAttachClick && (
            <button
              type="button"
              className={styles.attachHeaderBtn}
              onClick={onAttachClick}
            >
              <Paperclip size={12} />
              <span>Attach Files</span>
            </button>
          )}
        </div>
        <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", margin: "4px 0 0" }}>
          No files attached directly to this ticket.
        </p>
      </div>
    );
  }

  const handleDownload = (att: TicketAttachment) => {
    if (!att.url) return;
    const link = document.createElement("a");
    link.href = att.url;
    link.download = att.filename || "download";
    link.target = "_blank";
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (att: TicketAttachment) => {
    if (att.mime_type?.startsWith("image/") || att.url?.match(/\.(png|jpg|jpeg|webp|gif)/i)) {
      setPreviewItem(att);
    } else if (att.url) {
      window.open(att.url, "_blank", "noreferrer");
    }
  };

  return (
    <div className={styles.attachmentsSection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          <Paperclip size={15} color="#0396A6" />
          {title} ({attachments.length})
        </h3>
        {canAttach && onAttachClick && (
          <button
            type="button"
            className={styles.attachHeaderBtn}
            onClick={onAttachClick}
          >
            <Paperclip size={12} />
            <span>+ Attach More</span>
          </button>
        )}
      </div>

      <div className={styles.attachmentCardsGrid}>
        {attachments.map((raw, idx) => {
          const att: TicketAttachment =
            typeof raw === "string"
              ? {
                  id: String(idx),
                  filename: raw,
                  mime_type: "application/octet-stream",
                  size_bytes: 0,
                  storage_path: "",
                  url: "",
                }
              : raw;

          const isImage =
            att.mime_type?.startsWith("image/") ||
            att.filename?.match(/\.(png|jpg|jpeg|webp|gif)$/i);

          return (
            <div key={att.id || idx} className={styles.attachmentCard}>
              <div className={styles.attachmentCardIcon}>
                {isImage && att.url ? (
                  <img
                    src={att.url}
                    alt={att.filename}
                    className={styles.attachmentThumbnail}
                    onClick={() => handlePreview(att)}
                  />
                ) : (
                  getFileIcon(att.filename, att.mime_type)
                )}
              </div>
              <div className={styles.attachmentCardInfo}>
                <span className={styles.attachmentCardName} title={att.filename}>
                  {att.filename}
                </span>
                <span className={styles.attachmentCardMeta}>
                  {formatFileSize(att.size_bytes)}
                  {att.uploaded_by_name ? ` • ${att.uploaded_by_name}` : ""}
                </span>
              </div>
              <div className={styles.attachmentCardActions}>
                {att.url && (
                  <button
                    type="button"
                    className={styles.attachmentActionBtn}
                    onClick={() => handlePreview(att)}
                    title="Preview file"
                  >
                    <Eye size={13} />
                  </button>
                )}
                {att.url && (
                  <button
                    type="button"
                    className={styles.attachmentActionBtn}
                    onClick={() => handleDownload(att)}
                    title="Download file"
                  >
                    <Download size={13} />
                  </button>
                )}
                {canDelete && ticketId && att.id && (
                  <button
                    type="button"
                    className={styles.attachmentActionBtn}
                    onClick={() => handleDelete(att)}
                    disabled={deletingId === att.id}
                    title="Delete attachment"
                    style={{ color: deletingId === att.id ? "#94a3b8" : "#ef4444" }}
                  >
                    {deletingId === att.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Preview Modal */}
      {previewItem && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setPreviewItem(null)}
          style={{ zIndex: 11000 }}
        >
          <div
            className={styles.previewModalBox}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.previewModalHeader}>
              <span className={styles.previewModalTitle}>{previewItem.filename}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className={styles.attachmentActionBtn}
                  onClick={() => handleDownload(previewItem)}
                  title="Download"
                >
                  <Download size={15} />
                </button>
                <button
                  type="button"
                  className={styles.drawerCloseBtn}
                  onClick={() => setPreviewItem(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className={styles.previewModalBody}>
              <img
                src={previewItem.url}
                alt={previewItem.filename}
                className={styles.previewModalImg}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
