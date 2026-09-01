'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Clock, Copy, Check, Sparkles, BookOpen,
  ChevronRight, ExternalLink, ThumbsUp, ThumbsDown,
  Terminal, AlertTriangle, Info, Share2, ArrowRight,
  CheckCircle2, Compass
} from 'lucide-react';
import { AppShell } from '@/components/shell/AppShell';
import { Button } from '@/components/ui/Button';
import { PageState } from '@/components/ui/PageState';
import {
  getArticle,
  HELP_ARTICLES,
  HELP_CATEGORIES,
  type HelpBlock,
  type HelpArticle
} from '@/lib/help/catalog';
import { useToast } from '@/lib/toast';

// ── CODE BLOCK WITH COPY & MACOS TITLEBAR ──
function CodeSnippetBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { success: toastSuccess } = useToast();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toastSuccess('Code snippet copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [text, toastSuccess]);

  return (
    <div className="my-5 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-lg text-zinc-100 font-mono text-xs sm:text-sm">
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-[11px] font-sans font-bold text-zinc-400 ml-2 flex items-center gap-1">
            <Terminal size={12} className="text-[#0396A6]" /> Code Snippet
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400 stroke-[3]" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-4 sm:p-5 overflow-x-auto text-emerald-400/90 leading-relaxed no-scrollbar select-all">
        <code>{text}</code>
      </pre>
    </div>
  );
}

// ── RICH BLOCK RENDERER ──
function Block({ block }: { block: HelpBlock }) {
  switch (block.type) {
    case 'p':
      return (
        <p className="text-[15px] sm:text-[16px] text-zinc-700 leading-relaxed my-2.5 font-normal">
          {block.text}
        </p>
      );
    case 'h':
      return (
        <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight mt-8 mb-3 flex items-center gap-2 group">
          <span className="w-1.5 h-5 rounded-full bg-[#0396A6] inline-block shrink-0" />
          <span>{block.text}</span>
        </h2>
      );
    case 'ol':
      return (
        <ol className="my-4 space-y-2.5">
          {block.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-[14.5px] sm:text-[15.5px] text-zinc-700 leading-relaxed">
              <span className="w-6 h-6 rounded-full bg-[#0396A6]/10 text-[#0396A6] border border-[#0396A6]/20 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                {idx + 1}
              </span>
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ol>
      );
    case 'ul':
      return (
        <ul className="my-4 space-y-2">
          {block.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-[14.5px] sm:text-[15.5px] text-zinc-700 leading-relaxed">
              <span className="w-2 h-2 rounded-full bg-[#0396A6] shrink-0 mt-2" />
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'note':
      return (
        <div className="my-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FAFDFD] via-white to-[#F2F9F9] border border-[#D9EDEE] border-l-4 border-l-[#0396A6] shadow-[0_2px_12px_rgba(3,150,166,0.04)] flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center shrink-0 mt-0.5">
            <Info size={18} />
          </div>
          <div className="space-y-0.5 flex-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#0396A6]">Pro Tip &amp; Note</span>
            <p className="text-[14px] sm:text-[14.5px] text-zinc-700 leading-relaxed m-0">{block.text}</p>
          </div>
        </div>
      );
    case 'warn':
      return (
        <div className="my-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 border border-amber-200 border-l-4 border-l-amber-500 shadow-2xs flex items-start gap-3.5 text-amber-950">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={18} />
          </div>
          <div className="space-y-0.5 flex-1">
            <span className="text-xs font-black uppercase tracking-wider text-amber-900">Important Advisory</span>
            <p className="text-[14px] sm:text-[14.5px] text-amber-900 leading-relaxed m-0">{block.text}</p>
          </div>
        </div>
      );
    case 'code':
      return <CodeSnippetBlock text={block.text} />;
    default:
      return null;
  }
}

export default function HelpGuidePage() {
  const params = useParams();
  const slug = String(params?.slug || '');
  const article = getArticle(slug);
  const category = HELP_CATEGORIES.find(c => c.id === article?.category);
  const { success: toastSuccess } = useToast();

  // Scroll Progress Tracking
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'unhelpful' | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (totalScroll / windowHeight) * 100)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyLink = useCallback(() => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toastSuccess('Guide link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [toastSuccess]);

  // Next article in category or overall
  const nextArticle = useMemo(() => {
    if (!article) return null;
    const sameCatArticles = HELP_ARTICLES.filter(a => a.category === article.category && a.slug !== article.slug);
    if (sameCatArticles.length > 0) return sameCatArticles[0];
    const currentIndex = HELP_ARTICLES.findIndex(a => a.slug === article.slug);
    if (currentIndex >= 0 && currentIndex < HELP_ARTICLES.length - 1) {
      return HELP_ARTICLES[currentIndex + 1];
    }
    return null;
  }, [article]);

  if (!article) {
    return (
      <AppShell title="Guide Not Found" requires="dashboard:view">
        <PageState
          icon="menu_book"
          title="That guide is not here"
          description="It may have been updated or moved. Browse Help Center to find the right topic."
          primaryHref="/help"
          primaryLabel="Back to Help Hub"
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={article.title}
      subtitle={article.summary}
      requires="dashboard:view"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-white hover:bg-muted/30 text-muted-foreground hover:text-foreground border border-[#D9EDEE] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          <Link href="/help">
            <Button variant="ghost" className="text-xs font-bold">
              <ArrowLeft size={14} /> Back to Hub
            </Button>
          </Link>
        </div>
      }
    >
      {/* ── TOP READING PROGRESS BAR (AWWWARDS STYLE) ── */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#0396A6] via-[#058492] to-[#67C9CE] z-50 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(3,150,166,0.6)]"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-36 sm:pb-28 animate-in fade-in duration-300">
        {/* ── BREADCRUMB & CATEGORY PILL ── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-muted-foreground flex-wrap">
          <Link href="/help" className="hover:text-[#0396A6] flex items-center gap-1 transition-colors">
            <Compass size={13} className="text-[#0396A6]" />
            <span>Help Center</span>
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-[#0396A6] font-bold">{category?.name || 'Guide'}</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-foreground truncate max-w-[200px] sm:max-w-xs">{article.title}</span>
        </nav>

        {/* ── HERO GUIDE CARD (AWWWARDS AESTHETICS) ── */}
        <header className="relative overflow-hidden bg-gradient-to-br from-white via-[#FAFDFD] to-[#F2F9F9] rounded-3xl border border-[#D9EDEE] p-5 sm:p-9 shadow-[0_4px_24px_rgba(3,150,166,0.06),0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#0396A6]/10 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-56 h-56 rounded-full bg-gradient-to-tr from-[#67C9CE]/10 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Meta Tags */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#0396A6]/10 text-[#0396A6] border border-[#0396A6]/20 shadow-2xs">
                <BookOpen size={13} />
                {category?.name || 'Help Guide'}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-muted-foreground border border-[#D9EDEE] shadow-2xs">
                <Clock size={13} className="text-[#0396A6]" />
                {article.minutes} min read
              </span>

              {article.href && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={12} /> Interactive Screen Available
                </span>
              )}
            </div>

            {/* Title & Summary */}
            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
              {article.title}
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl font-medium">
              {article.summary}
            </p>
          </div>
        </header>

        {/* ── ARTICLE MAIN CONTENT CARD ── */}
        <article className="bg-white rounded-3xl border border-[#D9EDEE] p-6 sm:p-10 shadow-[0_1px_4px_rgba(0,0,0,0.02),0_8px_30px_rgba(3,150,166,0.03)] space-y-6">
          <div className="prose max-w-none">
            {article.body.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>

          {/* ── WAS THIS HELPFUL? MICRO-FEEDBACK WIDGET ── */}
          <div className="pt-8 mt-10 border-t border-[#EAF2F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-foreground">Was this guide helpful?</h3>
              <p className="text-xs text-muted-foreground">Your feedback helps us continuously improve our documentation.</p>
            </div>

            <div className="flex items-center gap-2">
              {feedbackGiven ? (
                <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 animate-in zoom-in-95">
                  <Check size={14} className="stroke-[3]" /> Thank you for your feedback!
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackGiven('helpful');
                      toastSuccess('Thank you! Glad this was helpful.');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-foreground border border-[#D9EDEE] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    <ThumbsUp size={14} className="text-emerald-600" />
                    <span>Yes, helpful</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackGiven('unhelpful');
                      toastSuccess('Thanks! We will refine this guide.');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-foreground border border-[#D9EDEE] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    <ThumbsDown size={14} className="text-rose-600" />
                    <span>Could be better</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── WORKSPACE JUMP ACTION ── */}
          {article.href && (
            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-[#FAFDFD] via-[#F2F9F9] to-white border border-[#D9EDEE] flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-[#0396A6]">Jump directly into the workspace</span>
                <p className="text-xs sm:text-sm text-foreground font-bold">
                  Ready to configure? Open the live screen directly.
                </p>
              </div>

              <Link href={article.href} className="shrink-0">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-[#0396A6] to-[#028391] hover:from-[#028391] hover:to-[#016874] text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_2px_10px_rgba(3,150,166,0.3)]">
                  <span>{article.hrefLabel || 'Open this screen'}</span>
                  <ExternalLink size={13} className="ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </article>

        {/* ── NEXT GUIDE RECOMMENDED CARD ── */}
        {nextArticle && (
          <div className="bg-gradient-to-br from-white to-[#FAFDFD] rounded-3xl border border-[#D9EDEE] p-5 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-[#BCE3E5] transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  Next Recommended Guide
                </span>
                <h4 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                  {nextArticle.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {nextArticle.summary}
                </p>
              </div>

              <Link href={`/help/guides/${nextArticle.slug}`} className="shrink-0">
                <button
                  type="button"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-[#0396A6] hover:text-white text-[#0396A6] border border-[#D9EDEE] hover:border-[#0396A6] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-98"
                >
                  <span>Read Next</span>
                  <ArrowRight size={14} />
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
