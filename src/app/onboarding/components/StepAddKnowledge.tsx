"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import { apiRequest, apiUpload } from "@/lib/api";
import { completeOnboardingStep } from "@/lib/onboarding";
import type { Agent, KbSource } from "@/lib/types";

import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  Upload,
  FileText,
  FileType,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Plus,
  Link2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  MessageSquarePlus,
} from "lucide-react";
import { useStorageUsage } from "@/lib/useStorageUsage";
import { StorageWarningBanner } from "@/components/storage/StorageWarningBanner";


interface Props {
  onCompleted?: () => void;
  onRefreshWorkspace?: () => void;
  onToastMessage?: (msg: string, type?: "warning" | "error" | "info") => void;
}

const MAX_UPLOAD_MB = 20;
const ACCEPT = ".pdf,.docx,.txt,.csv,.md";
const ACCEPT_LABEL = "PDF, DOCX, TXT, CSV, or MD up to 20MB";

function formatBytes(bytes: number | null | undefined) {
  const n = Number(bytes || 0);
  if (n === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${parseFloat((n / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function isReady(status: string) {
  return status === "completed" || status === "ready";
}

function isTraining(status: string) {
  return status === "queued" || status === "processing" || status === "pending";
}

function isFailed(status: string) {
  return status === "failed";
}

export function StepAddKnowledge({ onCompleted, onRefreshWorkspace, onToastMessage }: Props) {
  const {
    usage: storageUsage,
    isAtLimit: isStorageAtLimit,
    refresh: refreshStorage,
  } = useStorageUsage();
  const [sources, setSources] = useState<KbSource[]>([]);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [crawlUrl, setCrawlUrl] = useState("");
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaAnswer, setQaAnswer] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [extraTab, setExtraTab] = useState<"upload" | "crawl" | "qa">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSources = useCallback(async () => {
    try {
      const data = await apiRequest<KbSource[]>("/v1/kb/sources");
      setSources(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load sources";
      setUploadError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSources();
    void apiRequest<Agent[]>("/v1/agents")
      .then((list) => {
        const preferred =
          (list || []).find((a) => a.is_active && a.mode !== "whatsapp") || (list || [])[0];
        if (preferred) setAgentId(preferred.id);
      })
      .catch(() => undefined);
  }, [loadSources]);

  useEffect(() => {
    const inFlight = sources.some((s) => isTraining(s.status));
    if (!inFlight) return;
    const id = setInterval(() => {
      void loadSources();
    }, 3000);
    return () => clearInterval(id);
  }, [sources, loadSources]);

  const handleUpload = async (file: File) => {
    if (isStorageAtLimit) {
      setUploadError(
        `Storage limit reached. You have used ${storageUsage?.used_formatted || "all"} of ${
          storageUsage?.limit_formatted || "your limit"
        }. Please free up space or contact support to increase your limit.`
      );
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setUploadError(`File exceeds ${MAX_UPLOAD_MB} MB max limit.`);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["pdf", "docx", "txt", "csv", "md", "markdown"].includes(ext)) {
      setUploadError(`Unsupported type .${ext}. Use ${ACCEPT_LABEL}.`);
      return;
    }
    if (storageUsage && storageUsage.storage_used_bytes + file.size > storageUsage.storage_limit_bytes) {
      setUploadError(
        `Storage limit reached. You have used ${storageUsage.used_formatted} of ${storageUsage.limit_formatted}. Please free up space or contact support to increase your limit.`
      );
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (agentId) formData.append("agent_id", agentId);
      await apiUpload("/v1/kb/sources/upload", formData);
      await loadSources();
      void refreshStorage();
      void completeOnboardingStep("add_knowledge").catch(() => null);
      if (onRefreshWorkspace) onRefreshWorkspace();
      if (onToastMessage) onToastMessage(`Uploaded ${file.name}`, "info");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    try {
      await apiRequest(`/v1/kb/sources/${id}`, { method: "DELETE" });
      await loadSources();
      void refreshStorage();
      if (onRefreshWorkspace) onRefreshWorkspace();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete source";
      if (onToastMessage) onToastMessage(msg, "error");
      else setUploadError(msg);
    }
  };

  const reindex = async (sourceId: string) => {
    setBusy(true);
    setUploadError(null);
    try {
      await apiRequest(`/v1/kb/sources/${sourceId}/reindex`, { method: "POST" });
      await loadSources();
      if (onToastMessage) onToastMessage("Reindex started", "info");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Reindex failed");
    } finally {
      setBusy(false);
    }
  };

  const onCrawl = async (e: FormEvent) => {
    e.preventDefault();
    let targetUrl = crawlUrl.trim();
    if (!targetUrl) return;
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = `https://${targetUrl}`;
    setBusy(true);
    setUploadError(null);
    try {
      await apiRequest("/v1/kb/sources/crawl", {
        method: "POST",
        body: { url: targetUrl, max_depth: 2, agent_id: agentId },
      });
      setCrawlUrl("");
      await loadSources();
      void completeOnboardingStep("add_knowledge").catch(() => null);
      if (onRefreshWorkspace) onRefreshWorkspace();
      if (onToastMessage) onToastMessage("Crawl started — status will update below", "info");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Crawl failed to start");
    } finally {
      setBusy(false);
    }
  };

  const onAddQa = async (e: FormEvent) => {
    e.preventDefault();
    if (!qaQuestion.trim() || !qaAnswer.trim()) return;
    setBusy(true);
    setUploadError(null);
    try {
      await apiRequest("/v1/kb/qa", {
        method: "POST",
        body: {
          question: qaQuestion.trim(),
          answer: qaAnswer.trim(),
          agent_id: agentId,
        },
      });
      setQaQuestion("");
      setQaAnswer("");
      await loadSources();
      void completeOnboardingStep("add_knowledge").catch(() => null);
      if (onRefreshWorkspace) onRefreshWorkspace();
      if (onToastMessage) onToastMessage("Added Q&A pair", "info");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to add Q&A");
    } finally {
      setBusy(false);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) void handleUpload(e.target.files[0]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const readyCount = sources.filter((s) => isReady(s.status)).length;
  const hasTrainedSources = readyCount > 0;

  return (
    <div className="space-y-6">
      <ConfirmModal
        show={Boolean(deleteId)}
        title="Delete this source?"
        message="This removes the document and its indexed chunks from your knowledge base."
        tone="danger"
        confirmText="Delete"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteId(null)}
      />

      {uploadError && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {hasTrainedSources && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-950">
                Knowledge ready ({readyCount} of {sources.length} sources)
              </p>
              <p className="text-xs text-emerald-700">
                Your agent can ground answers on indexed documents. Add more anytime.
              </p>
            </div>
          </div>
          {onCompleted && (
            <button
              type="button"
              onClick={onCompleted}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>Next: Test in Sandbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-surface p-1 rounded-lg border border-border/60">
          {(
            [
              ["upload", "Upload"],
              ["crawl", "Website URL"],
              ["qa", "Q&A"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setExtraTab(id)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                extraTab === id
                  ? "bg-primary text-white shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Link
          href="/knowledge"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          Open full Knowledge page
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          {extraTab === "upload" && (
            <>
              <StorageWarningBanner usage={storageUsage} className="mb-3" />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isStorageAtLimit) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (!isStorageAtLimit && e.dataTransfer.files?.[0]) void handleUpload(e.dataTransfer.files[0]);
                }}
                className={`p-8 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center ${
                  isStorageAtLimit
                    ? "border-[rgb(255,122,94)] bg-[rgba(255,122,94,0.05)] cursor-not-allowed"
                    : isDragging
                    ? "border-primary bg-primary/10 cursor-pointer border-dashed"
                    : "border-border hover:border-primary/60 bg-surface-container-low cursor-pointer border-dashed"
                }`}
                onClick={() => !isStorageAtLimit && fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileChange}
                  className="hidden"
                  accept={ACCEPT}
                  disabled={isStorageAtLimit}
                />
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                    isStorageAtLimit ? "bg-[rgba(255,122,94,0.15)] text-[rgb(255,122,94)]" : "bg-primary/10 text-primary"
                  }`}
                >
                  <Upload className="w-7 h-7" />
                </div>
                <h4
                  className={`font-bold text-base font-display ${
                    isStorageAtLimit ? "text-[rgb(230,85,55)]" : "text-on-surface"
                  }`}
                >
                  {isStorageAtLimit ? "Storage limit reached (Uploads blocked)" : "Upload business documents"}
                </h4>
                <p className="text-xs text-on-surface-variant max-w-sm mt-1 mb-4 leading-relaxed">
                  {isStorageAtLimit
                    ? "You have reached your storage limit. Please free up space or contact support."
                    : `Drag & drop FAQs, pricing, catalogs, or policies. Supports ${ACCEPT_LABEL}.`}
                </p>
                <button
                  type="button"
                  disabled={uploading || isStorageAtLimit}
                  className={`px-5 py-2.5 font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-2 ${
                    isStorageAtLimit
                      ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                      : "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{isStorageAtLimit ? "Storage limit reached" : uploading ? "Uploading…" : "Browse files"}</span>
                </button>
              </div>
            </>
          )}

          {extraTab === "crawl" && (
            <form
              onSubmit={(e) => void onCrawl(e)}
              className="p-5 rounded-2xl border border-border/80 bg-surface-container-low space-y-3"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                <Link2 className="w-4 h-4 text-primary" />
                Import from website URL
              </div>
              <p className="text-xs text-on-surface-variant">
                Starts a crawl job. Pages appear below as Training, then Ready.
              </p>
              <input
                type="url"
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
                placeholder="https://example.com/pricing"
                className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                type="submit"
                disabled={busy || !crawlUrl.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {busy ? "Starting…" : "Start crawl"}
              </button>
            </form>
          )}

          {extraTab === "qa" && (
            <form
              onSubmit={(e) => void onAddQa(e)}
              className="p-5 rounded-2xl border border-border/80 bg-surface-container-low space-y-3"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                <MessageSquarePlus className="w-4 h-4 text-primary" />
                Add a Q&A pair
              </div>
              <input
                value={qaQuestion}
                onChange={(e) => setQaQuestion(e.target.value)}
                placeholder="Question"
                className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <textarea
                value={qaAnswer}
                onChange={(e) => setQaAnswer(e.target.value)}
                placeholder="Answer"
                rows={3}
                className="w-full p-3 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
              <button
                type="submit"
                disabled={busy || !qaQuestion.trim() || !qaAnswer.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {busy ? "Saving…" : "Add & index"}
              </button>
            </form>
          )}

          {uploading && (
            <div className="p-4 bg-surface rounded-xl border border-border/80 flex items-center gap-2 text-xs font-semibold text-on-surface">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
              Uploading to knowledge base…
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-surface-container-lowest border border-border/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Sources ({sources.length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-10 text-center text-xs text-on-surface-variant">
                Loading knowledge sources…
              </div>
            ) : sources.length === 0 ? (
              <div className="py-10 text-center text-xs text-on-surface-variant/70">
                No sources yet. Upload a file, crawl a URL, or add a Q&A pair.
              </div>
            ) : (
              sources.map((source) => {
                const name = source.filename || source.scrape_url || "Untitled source";
                const isPdf = name.toLowerCase().endsWith(".pdf");
                const ready = isReady(source.status);
                const training = isTraining(source.status);
                const failed = isFailed(source.status);

                return (
                  <div
                    key={source.source_id}
                    className="p-3 rounded-xl bg-surface border border-border/80 flex flex-col gap-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          {isPdf ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <FileType className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-on-surface truncate" title={name}>
                            {name}
                          </p>
                          <p className="text-[10px] text-on-surface-variant">
                            {formatBytes(source.size_bytes)}
                            {source.source_type ? ` · ${source.source_type}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {ready && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Ready
                          </span>
                        )}
                        {training && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                            Training
                          </span>
                        )}
                        {failed && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                            Failed
                          </span>
                        )}
                        {failed && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void reindex(source.source_id)}
                            className="text-on-surface-variant hover:text-primary p-1"
                            title="Reindex"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteId(source.source_id)}
                          className="text-on-surface-variant/60 hover:text-red-600 transition-colors p-1"
                          title="Delete source"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {failed && source.error && (
                      <p className="text-[10px] text-red-700 leading-snug pl-10">{source.error}</p>
                    )}
                    {training && typeof source.progress === "number" && source.progress > 0 && (
                      <div className="pl-10">
                        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, source.progress)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
