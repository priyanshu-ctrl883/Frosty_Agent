"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  Printer,
  Mail,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { FrostrekLogo } from "@/components/FrostrekLogo";
import { LegalFooter } from "./LegalFooter";

export interface LegalTOCItem {
  id: string;
  title: string;
}

export interface LegalPageTemplateProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  effectiveDate?: string;
  toc: LegalTOCItem[];
  children: React.ReactNode;
}

const LEGAL_DOCUMENTS = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/accessibility", label: "Accessibility" },
] as const;

export function LegalPageTemplate({
  title,
  subtitle,
  lastUpdated,
  effectiveDate = "August 2026",
  toc,
  children,
}: LegalPageTemplateProps) {
  const pathname = usePathname();
  const [activeId, setActiveId] = useState<string>(toc[0]?.id || "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Active section tracking for Desktop (inside right scroll container) and Mobile (window)
  const updateActiveSection = useCallback(() => {
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    const container = scrollContainerRef.current;

    const sections = toc
      .map((item) => {
        const el = document.getElementById(item.id);
        return el ? { id: item.id, top: el.offsetTop, height: el.offsetHeight } : null;
      })
      .filter((s): s is { id: string; top: number; height: number } => s !== null);

    if (!sections.length) return;

    if (isDesktop && container) {
      setShowBackToTop(container.scrollTop > 300);

      // Check if user scrolled near bottom of container -> activate last section
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 70;
      if (isAtBottom) {
        const lastSection = sections[sections.length - 1];
        if (lastSection) {
          setActiveId(lastSection.id);
          return;
        }
      }

      const firstSection = sections[0];
      if (!firstSection) return;

      const scrollPos = container.scrollTop + 120;
      let currentId = firstSection.id;
      for (const s of sections) {
        if (scrollPos >= s.top) {
          currentId = s.id;
        }
      }
      setActiveId(currentId);
    } else {
      setShowBackToTop(window.scrollY > 300);

      // Check if user scrolled near bottom of page -> activate last section
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;
      if (isAtBottom) {
        const lastSection = sections[sections.length - 1];
        if (lastSection) {
          setActiveId(lastSection.id);
          return;
        }
      }

      const firstSection = sections[0];
      if (!firstSection) return;

      const scrollPos = window.scrollY + 120;
      let currentId = firstSection.id;
      for (const s of sections) {
        if (scrollPos >= s.top) {
          currentId = s.id;
        }
      }
      setActiveId(currentId);
    }
  }, [toc]);

  useEffect(() => {
    const container = scrollContainerRef.current;

    const onDesktopScroll = () => {
      window.requestAnimationFrame(updateActiveSection);
    };

    const onWindowScroll = () => {
      window.requestAnimationFrame(updateActiveSection);
    };

    if (container) {
      container.addEventListener("scroll", onDesktopScroll, { passive: true });
    }
    window.addEventListener("scroll", onWindowScroll, { passive: true });

    updateActiveSection();

    return () => {
      if (container) {
        container.removeEventListener("scroll", onDesktopScroll);
      }
      window.removeEventListener("scroll", onWindowScroll);
    };
  }, [updateActiveSection]);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (!element) return;

    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    const container = scrollContainerRef.current;

    if (isDesktop && container) {
      container.scrollTo({
        top: element.offsetTop - 20,
        behavior: "smooth",
      });
    } else {
      const topOffset = element.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({
        top: topOffset,
        behavior: "smooth",
      });
    }

    setActiveId(id);
    if (typeof window !== "undefined" && window.history) {
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  const scrollToTop = () => {
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    const container = scrollContainerRef.current;
    if (isDesktop && container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const activeItem = toc.find((item) => item.id === activeId) || toc[0];

  return (
    <div className="h-screen overflow-hidden bg-[#FCFDFD] text-[#111827] flex flex-col font-sans selection:bg-[#EAF8F8] selection:text-[#0396A6]">
      {/* ── Top Header Navigation Bar (Fixed 56px height) ── */}
      <header className="sticky top-0 z-50 h-14 bg-white/95 backdrop-blur-md border-b border-[#D9EDEE] px-4 sm:px-8 flex items-center justify-between shrink-0 transition-all">
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="flex items-center gap-2 text-xs font-bold text-[#5F6B73] hover:text-[#0396A6] transition-colors group p-1.5 -ml-1.5 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-[#0396A6]" />
            <span className="hidden sm:inline">Back to login</span>
          </Link>
          <div className="h-4 w-[1px] bg-[#D9EDEE] hidden sm:block" />

          {/* Official Brand Logo — Simply "Frosty" */}
          <Link href="/login" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-[#0396A6] text-white flex items-center justify-center shadow-sm group-hover:bg-[#087681] transition-colors">
              <FrostrekLogo size={16} color="#ffffff" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-[#111827]">
              Frosty
            </span>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9EDEE] text-xs font-semibold text-[#5F6B73] hover:text-[#111827] hover:bg-[#F7FDFD] transition-all cursor-pointer shadow-sm"
            title="Print document"
          >
            <Printer className="w-3.5 h-3.5 text-[#0396A6]" />
            <span>Print PDF</span>
          </button>

          {/* Contact Frosty CTA */}
          <a
            href="mailto:sales@frostrek.com?subject=Legal%20Inquiry"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0396A6] text-white text-xs font-bold hover:bg-[#087681] active:bg-[#065E6A] transition-all shadow-sm shadow-[#0396A6]/20 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Frosty</span>
          </a>
        </div>
      </header>

      {/* ── Mobile Compact Section Selector (< 1024px) ── */}
      <div className="lg:hidden sticky top-14 z-40 bg-white/95 backdrop-blur-md border-b border-[#D9EDEE] px-4 py-2.5 shadow-sm shrink-0">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F7FDFD] border border-[#D9EDEE] text-xs font-bold text-[#111827] shadow-sm active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-[#0396A6] font-semibold">On this page:</span>
            <span className="truncate text-[#111827] font-bold">{activeItem?.title || "Table of Contents"}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#5F6B73] shrink-0 transition-transform duration-200 ${
              mobileMenuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {mobileMenuOpen && (
          <div className="mt-2 py-2 px-1 bg-white rounded-xl border border-[#D9EDEE] shadow-xl space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
            {/* Legal Docs Quick Nav on mobile */}
            <div className="px-3.5 py-1.5 text-[10px] font-bold text-[#8B9DA4] uppercase tracking-wider border-b border-[#D9EDEE]/60 mb-1">
              Legal Documents
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 mb-2">
              {LEGAL_DOCUMENTS.map((doc) => {
                const isCurrentDoc = pathname === doc.href;
                return (
                  <Link
                    key={doc.href}
                    href={doc.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-2.5 py-2 rounded-lg text-[11px] font-bold text-center truncate transition-colors ${
                      isCurrentDoc
                        ? "bg-[#0396A6] text-white"
                        : "bg-[#F7FDFD] text-[#5F6B73] hover:text-[#111827]"
                    }`}
                  >
                    {doc.label}
                  </Link>
                );
              })}
            </div>

            <div className="px-3.5 py-1.5 text-[10px] font-bold text-[#8B9DA4] uppercase tracking-wider border-b border-[#D9EDEE]/60 mb-1">
              Sections
            </div>
            {toc.map((item, idx) => {
              const isSelected = activeId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors min-h-[44px] ${
                    isSelected
                      ? "bg-[#EAF8F8] text-[#0396A6] font-bold"
                      : "text-[#5F6B73] hover:text-[#111827] hover:bg-[#F7FDFD]"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span className="font-mono text-[11px] opacity-60">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0396A6]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Main Two-Column Middle Region (Header above, Footer below) ── */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        
        {/* ── Desktop Left Sidebar (100% STATIONARY, Never Scrolls, Zero Scrollbar) ── */}
        <aside className="hidden lg:flex w-72 xl:w-80 shrink-0 h-full p-6 border-r border-[#D9EDEE] bg-white flex-col justify-between overflow-hidden">
          <div className="space-y-5">
            {/* Legal Documents Quick Switcher */}
            <div>
              <h3 className="text-[10px] font-bold text-[#8B9DA4] uppercase tracking-wider mb-2.5 px-1">
                Legal Documents
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {LEGAL_DOCUMENTS.map((doc) => {
                  const isCurrentDoc = pathname === doc.href;
                  return (
                    <Link
                      key={doc.href}
                      href={doc.href}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-center transition-all truncate ${
                        isCurrentDoc
                          ? "bg-[#0396A6] text-white shadow-sm shadow-[#0396A6]/20"
                          : "bg-[#F7FDFD] text-[#5F6B73] hover:text-[#111827] hover:bg-[#EAF8F8]/60"
                      }`}
                    >
                      {doc.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="h-[1px] bg-[#D9EDEE]" />

            {/* Current Page Table of Contents */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-[10px] font-bold text-[#8B9DA4] uppercase tracking-wider">
                  Table of Contents
                </h3>
                <span className="text-[10px] font-semibold text-[#8B9DA4]">
                  {toc.length} sections
                </span>
              </div>

              {/* Numbered TOC list with live active state */}
              <nav aria-label="Table of contents" className="space-y-0.5">
                {toc.map((item, idx) => {
                  const isCurrent = activeId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center justify-between group cursor-pointer ${
                        isCurrent
                          ? "bg-[#EAF8F8] text-[#0396A6] font-bold shadow-sm"
                          : "text-[#5F6B73] hover:text-[#111827] hover:bg-[#F7FDFD]"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            isCurrent ? "text-[#0396A6]" : "text-[#8B9DA4] group-hover:text-[#5F6B73]"
                          }`}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate">{item.title}</span>
                      </div>
                      <ChevronRight
                        className={`w-3 h-3 shrink-0 transition-transform ${
                          isCurrent
                            ? "text-[#0396A6] translate-x-0.5"
                            : "text-transparent group-hover:text-[#8B9DA4]"
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Need Help / Contact Frosty at Bottom of Sidebar */}
          <div className="pt-4 border-t border-[#D9EDEE] text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B9DA4]">
              Need help?
            </span>
            <h4 className="text-xs font-bold text-[#111827] mt-0.5">
              Contact Frosty
            </h4>
            <p className="text-[11px] text-[#5F6B73] mt-0.5 leading-relaxed">
              Have a question about our policies?
            </p>
            <a
              href="mailto:sales@frostrek.com?subject=Legal%20Inquiry"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-[#0396A6] hover:text-[#087681] hover:underline group"
            >
              <span>sales@frostrek.com</span>
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </a>
          </div>
        </aside>

        {/* ── Right Content Area (THE ONLY SCROLLABLE REGION) ── */}
        <div
          ref={scrollContainerRef}
          className="flex-1 h-full overflow-y-auto px-4 sm:px-8 lg:px-12 py-8 lg:py-10 space-y-10 scroll-smooth"
        >
          <main className="max-w-3xl space-y-10 pb-16">
            {/* Clean Document Title Header without category chips */}
            <div className="pb-8 border-b border-[#D9EDEE] space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111827] tracking-tight leading-[1.15] font-serif">
                {title}
              </h1>

              <p className="text-base sm:text-lg text-[#5F6B73] font-medium leading-relaxed">
                {subtitle}
              </p>

              {/* Document Metadata Strip */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 text-xs text-[#5F6B73] font-medium">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#0396A6]" />
                  <span>Last revised: <strong className="text-[#111827] font-semibold">{lastUpdated}</strong></span>
                </div>
                <span className="hidden sm:inline text-[#D9EDEE]">·</span>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#0396A6]" />
                  <span>Effective: <strong className="text-[#111827] font-semibold">{effectiveDate}</strong></span>
                </div>
                <span className="hidden sm:inline text-[#D9EDEE]">·</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0396A6]" />
                  <span>Jurisdiction: <strong className="text-[#111827] font-semibold">India & GDPR Compliant</strong></span>
                </div>
              </div>
            </div>

            {/* Article Sections */}
            <div className="space-y-12">
              {children}
            </div>

            {/* Bottom Contact Card */}
            <LegalContactCard />
          </main>
        </div>
      </div>

      {/* ── Fixed Bottom Footer (Always Fixed at Window Bottom) ── */}
      <footer className="h-12 border-t border-[#D9EDEE] bg-white px-4 sm:px-8 shrink-0 z-40 flex items-center justify-between text-xs text-[#5F6B73] w-full">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FrostrekLogo size={14} color="#0396A6" />
            <span className="font-bold text-[#111827]">Frosty</span>
            <span>· All rights reserved.</span>
          </div>
          <LegalFooter showCopyright={false} />
        </div>
      </footer>

      {/* ── Floating "Back to Top" Button ── */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-16 right-6 z-40 p-3 rounded-full bg-[#0396A6] text-white shadow-lg shadow-[#0396A6]/30 hover:bg-[#087681] hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0396A6] focus-visible:ring-offset-2 cursor-pointer"
          aria-label="Back to top"
          title="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

/**
 * Clean Section Container for editorial legal documents
 */
export function LegalSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number?: string | number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4">
      <div className="flex items-center gap-3 pb-2.5 border-b border-[#D9EDEE]/80">
        {number && (
          <span className="w-7 h-7 rounded-lg bg-[#EAF8F8] border border-[#B8E0E2] text-[#0396A6] font-mono text-xs font-extrabold flex items-center justify-center shrink-0">
            {typeof number === "number" ? String(number).padStart(2, "0") : number}
          </span>
        )}
        <h2 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight font-serif">
          {title}
        </h2>
      </div>
      <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[#374151]">
        {children}
      </div>
    </section>
  );
}

/**
 * Editorial Callout Highlight Card
 */
export function LegalCallout({
  title,
  children,
  type = "info",
}: {
  title?: string;
  children: React.ReactNode;
  type?: "info" | "warning" | "success";
}) {
  const styles = {
    info: {
      bg: "bg-[#EAF8F8]/60",
      border: "border-[#B8E0E2]",
      text: "text-[#0396A6]",
    },
    warning: {
      bg: "bg-amber-50/70",
      border: "border-amber-200",
      text: "text-amber-800",
    },
    success: {
      bg: "bg-emerald-50/70",
      border: "border-emerald-200",
      text: "text-emerald-800",
    },
  }[type];

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border ${styles.bg} ${styles.border} my-4 space-y-1.5 shadow-sm`}>
      {title && (
        <h4 className={`text-xs font-bold uppercase tracking-wider ${styles.text}`}>
          {title}
        </h4>
      )}
      <div className="text-xs sm:text-sm leading-relaxed text-[#374151]">
        {children}
      </div>
    </div>
  );
}

/**
 * Polished Contact Frosty Section Component
 */
export function LegalContactCard() {
  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#D9EDEE] shadow-sm space-y-3 mt-8">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0396A6] px-2.5 py-1 rounded-full bg-[#EAF8F8] border border-[#B8E0E2] inline-block">
        Need help?
      </span>
      <h3 className="text-lg font-bold text-[#111827]">Contact Frosty</h3>
      <p className="text-xs sm:text-sm text-[#5F6B73] leading-relaxed">
        Our team can help with legal, privacy, and compliance questions.
      </p>
      <div className="pt-2 flex flex-wrap items-center gap-3">
        <a
          href="mailto:sales@frostrek.com?subject=Legal%20Inquiry"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0396A6] hover:bg-[#087681] active:bg-[#065E6A] text-white text-xs font-bold shadow-sm shadow-[#0396A6]/20 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Contact Frosty</span>
        </a>
        <a
          href="mailto:sales@frostrek.com?subject=Legal%20Inquiry"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#0396A6] hover:underline group"
        >
          <span>sales@frostrek.com</span>
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </a>
      </div>
    </div>
  );
}
