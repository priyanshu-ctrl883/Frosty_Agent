'use client';

import React, { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { 
  Search, Upload, Globe, FileText, RefreshCw, Trash2, CheckCircle2, 
  AlertCircle, Clock, BookOpen, ArrowUpRight, HelpCircle, Sparkles, Layers,
  ChevronRight
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { API_URL } from '@/lib/constants';
import { getToken } from '@/lib/session';
import { impersonationHeader } from '@/lib/impersonation';
import type { Agent, KbSource } from '@/lib/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';

interface WebsiteKnowledgeTabProps {
  webAgentId?: string | null;
  afterSources?: React.ReactNode;
  /** Email agent hides cross-bot import; website/unified/wa keep drsh2 library card. */
  showLibraryImport?: boolean;
}

const MAX_MB = 20;
const ACCEPT = ".pdf,.docx,.txt,.csv,.md";

export function WebsiteKnowledgeTab({
  webAgentId,
  afterSources,
  showLibraryImport = true,
}: WebsiteKnowledgeTabProps) {
  const [sources, setSources] = useState<KbSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'crawl' | 'qa' | 'search' | 'gaps'>('upload');

  // Upload Form
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState('');

  // Crawl Form
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlDepth, setCrawlDepth] = useState(2);

  // Q&A Form
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');

  // Search Preview
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Gaps
  const [gaps, setGaps] = useState<any[]>([]);
  const [gapAnswers, setGapAnswers] = useState<Record<string, string>>({});

  // Confirm Modal
  const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [useSharedKb, setUseSharedKb] = useState(false);
  const [libraryBots, setLibraryBots] = useState<{ agent_id: string; agent_name: string; source_count: number }[]>([]);
  const [importFromId, setImportFromId] = useState('');

  const load = useCallback(async () => {
    try {
      const url = webAgentId ? `/v1/kb/sources?agent_id=${webAgentId}` : '/v1/kb/sources';
      const data = await apiRequest<KbSource[]>(url);
      setSources(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load KB sources', err);
      setError(err?.message || 'Could not load sources');
    } finally {
      setLoading(false);
    }

    try {
      const gapsUrl = webAgentId ? `/v1/kb/gaps?agent_id=${webAgentId}` : '/v1/kb/gaps';
      const gapsData = await apiRequest<any[]>(gapsUrl);
      setGaps(gapsData || []);
    } catch {
      setGaps([]);
    }

    if (webAgentId) {
      try {
        const agent = await apiRequest<Agent>(`/v1/agents/${webAgentId}`);
        setUseSharedKb(Boolean(agent?.use_shared_kb));
      } catch {
        setUseSharedKb(false);
      }
      try {
        const donors = await apiRequest<{ agent_id: string; agent_name: string; source_count: number }[]>(
          '/v1/kb/library-agents',
        );
        setLibraryBots((donors || []).filter((d) => d.agent_id !== webAgentId));
      } catch {
        setLibraryBots([]);
      }
    }
  }, [webAgentId]);

  const toggleSharedKb = async (next: boolean) => {
    if (!webAgentId) return;
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/v1/agents/${webAgentId}`, {
        method: 'PATCH',
        body: { use_shared_kb: next },
      });
      setUseSharedKb(next);
      setNotice(
        next
          ? 'This bot will also answer from the shared merchant library.'
          : 'This bot now uses only its own knowledge sources.',
      );
    } catch (err: any) {
      setError(err?.message || 'Could not update shared knowledge setting');
    } finally {
      setBusy(false);
    }
  };

  const importFromBot = async () => {
    if (!webAgentId || !importFromId) return;
    setBusy(true);
    setError(null);
    try {
      const counts = await apiRequest<{ jobs?: number; chunks?: number }>(
        '/v1/kb/import',
        {
          method: 'POST',
          body: { from_agent_id: importFromId, to_agent_id: webAgentId },
        },
      );
      setNotice(
        `Imported knowledge (${counts?.jobs ?? 0} sources, ${counts?.chunks ?? 0} chunks). This bot has its own copy.`,
      );
      setImportFromId('');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  // Polling for processing items
  useEffect(() => {
    const hasInFlight = sources.some(s => s.status === 'queued' || s.status === 'processing');
    if (!hasInFlight) return;
    const interval = setInterval(() => {
      void load();
    }, 3000);
    return () => clearInterval(interval);
  }, [sources, load]);

  // Handle File Upload
  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`${file.name} exceeds ${MAX_MB}MB limit.`);
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const body = new FormData();
      body.append('file', file);
      if (webAgentId) body.append('agent_id', webAgentId);
      const token = await getToken();
      const res = await fetch(`${API_URL}/v1/kb/sources/upload`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...impersonationHeader() },
        body,
      });
      const json = (await res.json()) as { data?: KbSource; error?: { message: string } };
      if (!res.ok || json.error) throw new Error(json.error?.message || `Upload failed (${res.status})`);
      setNotice(`✅ ${file.name} uploaded and indexed successfully!`);
      if (fileRef.current) fileRef.current.value = '';
      setSelectedFileName('');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  // Handle Website Crawl
  const handleCrawl = async (e: FormEvent) => {
    e.preventDefault();
    let targetUrl = (crawlUrl || '').trim();
    if (!targetUrl) return;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest<KbSource>('/v1/kb/sources/crawl', {
        method: 'POST',
        body: {
          url: targetUrl,
          max_depth: Number(crawlDepth),
          agent_id: webAgentId || null,
        },
      });
      setNotice(`🌐 Crawl started for ${targetUrl} — progress will update in real-time.`);
      setCrawlUrl('');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Website crawl failed to start');
    } finally {
      setBusy(false);
    }
  };

  // Handle Q&A Add
  const handleAddQa = async (e: FormEvent) => {
    e.preventDefault();
    if (!qaQuestion.trim() || !qaAnswer.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest('/v1/kb/qa', {
        method: 'POST',
        body: { question: qaQuestion.trim(), answer: qaAnswer.trim(), agent_id: webAgentId || null },
      });
      setNotice('✅ Q&A pair added and vector indexed!');
      setQaQuestion('');
      setQaAnswer('');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to add Q&A pair');
    } finally {
      setBusy(false);
    }
  };

  // Handle Search Preview Test
  const handleSearchPreview = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const hits = await apiRequest<any[]>('/v1/kb/search', {
        method: 'POST',
        body: { query: searchQuery.trim(), agent_id: webAgentId || null, top_k: 5 },
      });
      setSearchResults(hits || []);
    } catch (err: any) {
      setError(err?.message || 'Search preview failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Reindex
  const handleReindex = async (id: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest(`/v1/kb/sources/${id}/reindex`, { method: 'POST' });
      setNotice('🔄 Re-indexing in progress...');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Re-index failed');
    } finally {
      setBusy(false);
    }
  };

  // Delete
  const handleDelete = (id: string, name: string | null) => {
    setConfirmState({
      show: true,
      title: 'Delete Knowledge Source',
      message: `Are you sure you want to remove "${name || 'this source'}" from the AI Agent knowledge base?`,
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, show: false }));
        setBusy(true);
        setError(null);
        try {
          await apiRequest(`/v1/kb/sources/${id}`, { method: 'DELETE' });
          setNotice('Knowledge source deleted.');
          await load();
        } catch (err: any) {
          setError(err?.message || 'Delete failed');
        } finally {
          setBusy(false);
        }
      }
    });
  };

  // Resolve Gap
  const handleResolveGap = async (gapId: string) => {
    const ans = gapAnswers[gapId];
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/v1/kb/gaps/${gapId}/resolve`, {
        method: 'POST',
        body: { answer: ans || null },
      });
      setNotice('Knowledge gap resolved!');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to resolve gap');
    } finally {
      setBusy(false);
    }
  };

  const totalChunks = sources.reduce((acc, s) => acc + (s.chunk_count || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs flex items-center gap-4">
          <div className="text-[#0396A6] flex items-center justify-center shrink-0">
            <BookOpen size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{sources.length}</div>
            <div className="text-xs font-semibold text-muted-foreground">Indexed Sources</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs flex items-center gap-4">
          <div className="text-[#0396A6] flex items-center justify-center shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{totalChunks}</div>
            <div className="text-xs font-semibold text-muted-foreground">Vector Chunks</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs flex items-center gap-4">
          <div className="text-[#0396A6] flex items-center justify-center shrink-0">
            <HelpCircle size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{gaps.length}</div>
            <div className="text-xs font-semibold text-muted-foreground">Knowledge Gaps</div>
          </div>
        </div>
      </div>

      {webAgentId && showLibraryImport ? (
        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs space-y-4">
          <div>
            <div className="text-sm font-bold text-foreground">This bot&apos;s knowledge</div>
            <p className="text-xs text-muted-foreground mt-1">
              Answers come only from sources attached to this bot unless you opt into the shared
              library. Skipping import leaves this bot with its own empty knowledge base.
            </p>
          </div>
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={useSharedKb}
              disabled={busy}
              onChange={(e) => void toggleSharedKb(e.target.checked)}
            />
            <span>
              <span className="font-semibold">Use shared knowledge base</span>
              <span className="block text-xs text-muted-foreground">
                Also retrieve merchant-wide sources that are not attached to a specific bot.
              </span>
            </span>
          </label>
          {libraryBots.length > 0 ? (
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold min-w-[16rem] flex-1">
                Import from another bot
                <select
                  className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-medium"
                  value={importFromId}
                  onChange={(e) => setImportFromId(e.target.value)}
                >
                  <option value="">Choose a bot with knowledge…</option>
                  {libraryBots.map((b) => (
                    <option key={b.agent_id} value={b.agent_id}>
                      {b.agent_name} ({b.source_count} sources)
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={busy || !importFromId}
                onClick={() => void importFromBot()}
                className="h-10 px-4 rounded-xl bg-[#0396A6] text-white text-xs font-bold disabled:opacity-50"
              >
                Import knowledge
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No other bot has completed sources to import. Upload or crawl below to train this bot.
            </p>
          )}
        </div>
      ) : null}

      {/* Notifications and Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-semibold flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Action Sub-navigation */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-border shadow-xs space-y-5 sm:space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-border/50 pb-3 -mx-1 px-1">
          {[
            { id: 'upload', label: 'Upload Documents', icon: Upload },
            { id: 'crawl', label: 'Crawl Website', icon: Globe },
            { id: 'qa', label: 'Add Q&A Pair', icon: Sparkles },
            { id: 'search', label: 'Test Retrieval Search', icon: Search },
            { id: 'gaps', label: 'Knowledge Gaps', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  active 
                    ? 'bg-[#0396A6] text-white shadow-xs' 
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. Upload Section */}
        {activeSubTab === 'upload' && (
          <form onSubmit={handleUpload} className="space-y-4 max-w-xl mx-auto text-center flex flex-col items-center">
            <div className="text-center">
              <h3 className="text-sm font-bold text-foreground">Upload Knowledge Files</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Supported formats: PDF, DOCX, TXT, CSV, Markdown (Max {MAX_MB}MB per file).
              </p>
            </div>

            <div 
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border hover:border-[#0396A6] rounded-2xl p-8 text-center cursor-pointer bg-muted/10 transition-colors"
            >
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name || '')}
              />
              <Upload className="w-8 h-8 text-[#0396A6] mx-auto mb-2 opacity-80" />
              <div className="text-xs font-bold text-foreground">
                {selectedFileName ? selectedFileName : "Click to select a file or drag & drop here"}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                {ACCEPT.replace(/\./g, ' ').toUpperCase()}
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || !selectedFileName}
              className="px-6 py-2.5 bg-[#0396A6] hover:bg-[#028391] text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              {busy ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
              Upload & Vectorize Document
            </button>
          </form>
        )}

        {/* 2. Crawl Section */}
        {activeSubTab === 'crawl' && (
          <form onSubmit={handleCrawl} className="space-y-4 max-w-xl">
            <div>
              <h3 className="text-sm font-bold text-foreground">Crawl Website URLs</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically fetch, clean, and chunk web pages to keep your Website AI bot updated.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Target Website URL
              </label>
              <input
                type="url"
                required
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
                placeholder="https://yourwebsite.com/docs or /pricing"
                className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:border-[#0396A6]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Crawl Depth (Max Linked Pages)
              </label>
              <select
                value={crawlDepth}
                onChange={(e) => setCrawlDepth(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:border-[#0396A6]"
              >
                <option value={1}>Single Page (Depth 1)</option>
                <option value={2}>Shallow Crawl (Depth 2 - Up to 10 subpages)</option>
                <option value={3}>Deep Crawl (Depth 3 - Up to 50 subpages)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={busy || !crawlUrl}
              className="px-6 py-2.5 bg-[#0396A6] hover:bg-[#255240] text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs"
            >
              {busy ? <RefreshCw size={14} className="animate-spin" /> : <Globe size={14} />}
              Start Website Ingestion Crawl
            </button>
          </form>
        )}

        {/* 3. QA Pair Section */}
        {activeSubTab === 'qa' && (
          <form onSubmit={handleAddQa} className="space-y-4 max-w-xl">
            <div>
              <h3 className="text-sm font-bold text-foreground">Direct Q&A Training</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Provide custom factual question and answer pairs that the AI assistant will prioritize.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Expected Customer Question
              </label>
              <input
                type="text"
                required
                value={qaQuestion}
                onChange={(e) => setQaQuestion(e.target.value)}
                placeholder="What is your return or refund policy?"
                className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:border-[#0396A6]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                AI Grounded Answer
              </label>
              <textarea
                rows={4}
                required
                value={qaAnswer}
                onChange={(e) => setQaAnswer(e.target.value)}
                placeholder="We offer a 30-day money back guarantee with no questions asked..."
                className="w-full p-4 bg-muted/20 border border-border rounded-xl text-xs text-foreground outline-none focus:border-[#0396A6]"
              />
            </div>

            <button
              type="submit"
              disabled={busy || !qaQuestion || !qaAnswer}
              className="px-6 py-2.5 bg-[#0396A6] hover:bg-[#255240] text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs"
            >
              {busy ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Save & Index Q&A Pair
            </button>
          </form>
        )}

        {/* 4. Search Preview Test */}
        {activeSubTab === 'search' && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-foreground">Vector Semantic Search Simulator</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Test how the AI retrieves relevant knowledge chunks for visitor queries before going live.
              </p>
            </div>

            <form onSubmit={handleSearchPreview} className="flex gap-2">
              <input
                type="text"
                required
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a sample visitor question (e.g. Do you support annual billing?)"
                className="flex-1 px-4 py-2.5 bg-muted/20 border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:border-[#0396A6]"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 bg-[#0396A6] hover:bg-[#255240] text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all flex items-center gap-2 shrink-0"
              >
                {isSearching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                Search KB
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-3 pt-3">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Matched Knowledge Chunks ({searchResults.length})
                </div>
                {searchResults.map((hit, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#0396A6]">{hit.source_name || hit.source_type || 'Source'}</span>
                      <span className="font-mono text-muted-foreground">Score: {(hit.score || 0.9).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed italic bg-background p-3 rounded-lg border border-border/40 font-mono">
                      "{hit.content || hit.text || JSON.stringify(hit)}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. Gaps Section */}
        {activeSubTab === 'gaps' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Unanswered Knowledge Gaps</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Questions asked by live website visitors where no knowledge match was found. Provide answers to resolve them.
              </p>
            </div>

            {gaps.length === 0 ? (
              <div className="py-12 text-center border border-dashed rounded-2xl bg-muted/10 text-muted-foreground text-xs">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-[#0396A6]" />
                No unresolved knowledge gaps! Your Website AI agent is well-grounded.
              </div>
            ) : (
              <div className="space-y-3">
                {gaps.map((gap) => (
                  <div key={gap.id} className="p-4 rounded-xl border border-border bg-background space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-foreground">{gap.question}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Asked on {new Date(gap.created_at || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wide shrink-0 ${
                          (gap.status || 'unresolved').toLowerCase() === 'resolved'
                            ? 'text-emerald-600'
                            : (gap.status || 'unresolved').toLowerCase() === 'open'
                            ? 'text-[#0396A6]'
                            : 'text-amber-600'
                        }`}
                      >
                        {gap.status || 'UNRESOLVED'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Provide answer for future visitors..."
                        value={gapAnswers[gap.id] || ''}
                        onChange={(e) => setGapAnswers({ ...gapAnswers, [gap.id]: e.target.value })}
                        className="flex-1 px-3 py-1.5 bg-muted/20 border border-border rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => void handleResolveGap(gap.id)}
                        disabled={busy}
                        className="px-4 py-1.5 bg-[#0396A6] text-white text-xs font-bold rounded-lg hover:bg-[#255240]"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sources List Table */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 id="active-knowledge-sources" className="text-sm font-bold text-foreground tracking-tight">Active Knowledge Sources</h3>
          <button
            type="button"
            onClick={() => void load()}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/40 transition-colors"
            title="Refresh sources"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin" /> Loading knowledge sources...
          </div>
        ) : sources.length === 0 ? (
          <div className="py-12 text-center border border-dashed rounded-2xl bg-muted/10 text-muted-foreground text-xs">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            No knowledge sources added yet. Use the upload or crawl tabs above to train your Website AI!
          </div>
        ) : (
          <div className="max-h-[min(420px,50vh)] overflow-y-auto overflow-x-auto no-scrollbar rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Source Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chunks</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {sources.map((s) => (
                  <TableRow key={s.source_id}>
                    <TableCell className="font-bold text-foreground max-w-xs truncate">
                      <div className="flex items-center gap-2">
                        {s.source_type === 'scrape' || s.source_type === 'crawl' ? (
                          <Globe size={14} className="text-[#0396A6] shrink-0" />
                        ) : s.source_type === 'qa' ? (
                          <Sparkles size={14} className="text-amber-500 shrink-0" />
                        ) : (
                          <FileText size={14} className="text-blue-500 shrink-0" />
                        )}
                        <span className="truncate">{s.filename || s.scrape_url || s.source_id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="uppercase font-bold text-[10px] text-muted-foreground">
                      {s.source_type || 'file'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wide ${
                            s.status === 'completed' || s.status === 'ready'
                              ? 'text-emerald-600'
                              : s.status === 'processing' || s.status === 'queued'
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {s.status}
                        </span>
                        {s.error ? (
                          <span className="text-[10px] text-red-600/80 max-w-[220px] leading-snug" title={s.error}>
                            {s.error}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-foreground">
                      {s.chunk_count || 0}
                    </TableCell>
                    <TableCell align="right" className="space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => void handleReindex(s.source_id)}
                        disabled={busy}
                        className="px-2.5 py-1 rounded bg-muted/40 hover:bg-muted text-foreground text-[11px] font-semibold transition-colors"
                        title="Re-index this source"
                      >
                        Re-index
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.source_id, s.filename || s.scrape_url || 'Source')}
                        disabled={busy}
                        className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 text-[11px] font-semibold transition-colors"
                      >
                        Delete
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {afterSources}

      <ConfirmModal
        isOpen={confirmState.show}
        onClose={() => setConfirmState(prev => ({ ...prev, show: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="Delete"
        tone="danger"
      />
    </div>
  );
}
