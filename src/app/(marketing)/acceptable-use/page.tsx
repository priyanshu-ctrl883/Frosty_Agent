'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Lock,
  FileText,
  AlertTriangle,
  Mail,
  Copy,
  Check,
  ArrowLeft,
} from 'lucide-react';
import GlassNavbar from '@/components/GlassNavbar';
import FooterSection from '../FooterSection';
import { ParallaxStarfield } from '@/components/FrostyEngineHero';
import '../FrostyPage.css';

const SECTIONS = [
  { id: 'section-1', num: '01', title: 'Prohibited Deployments', desc: 'Medical, legal, financial advice, emergency replacement, and high-impact decisions.' },
  { id: 'section-1a', num: '1A', title: 'Children & DPDP Compliance', desc: 'Verifiable parental consent, age assurance, and prohibition of tracking minors.' },
  { id: 'section-2', num: '02', title: 'Agent Identity & Transparency', desc: 'Mandatory AI disclosure, no impersonation of individuals or deceptive reviews.' },
  { id: 'section-3', num: '03', title: 'Unlawful or Harmful Content', desc: 'Intellectual property, confidential data, hate speech, malware, and special category data.' },
  { id: 'section-4', num: '04', title: 'Data Misuse & Anti-Spam', desc: 'Verified opt-in consent, no unsolicited bulk messaging, and no scraping.' },
  { id: 'section-4a', num: '4A', title: 'WhatsApp Rules (Meta)', desc: 'Task-specific assistant policy (effective Jan 15, 2026), 24h messaging windows, and opt-out.' },
  { id: 'section-4b', num: '4B', title: 'Voice Recording & Consent', desc: 'Pre-recording disclosure, all-party consent jurisdictions, and biometric restrictions.' },
  { id: 'section-5', num: '05', title: 'System Security & Load Limits', desc: 'No unauthorized vulnerability probing, quota bypassing, or multi-tenant intrusion.' },
  { id: 'section-6', num: '06', title: 'Model Extraction & Subversion', desc: 'Prohibition on system prompt extraction, model distillation, and prompt injection attacks.' },
  { id: 'section-7', num: '07', title: 'Security Research & Safe Harbor', desc: 'Coordinated vulnerability reporting guidelines and safe harbor disclosure.' },
  { id: 'section-8', num: '08', title: 'Team Member Governance', desc: 'Account holder responsibility and least-privilege role assignment.' },
  { id: 'section-9', num: '09', title: 'Enforcement & Abuse Reporting', desc: 'Investigation procedures, immediate safety suspensions, and abuse escalation.' },
];

export default function AcceptableUsePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('section-1');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const contentPaneRef = useRef<HTMLDivElement>(null);
  const tocNavRef = useRef<HTMLElement>(null);
  const isManualClickRef = useRef(false);

  // Sync scroll position from right pane to active section
  useEffect(() => {
    const pane = contentPaneRef.current;
    if (!pane) return;

    const handleScroll = () => {
      if (isManualClickRef.current) return;

      const paneTop = pane.getBoundingClientRect().top;
      let currentActive = SECTIONS[0]?.id ?? 'section-1';

      for (const sec of SECTIONS) {
        const el = document.getElementById(sec.id);
        if (el) {
          const elTop = el.getBoundingClientRect().top - paneTop;
          if (elTop <= 120) {
            currentActive = sec.id;
          }
        }
      }
      setActiveSection(currentActive);
    };

    pane.addEventListener('scroll', handleScroll, { passive: true });
    return () => pane.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll left sidebar to make sure active TOC tab is always visible
  useEffect(() => {
    if (!activeSection) return;
    const tocItem = document.getElementById(`toc-${activeSection}`);
    const navContainer = tocNavRef.current;

    if (tocItem && navContainer) {
      const navTop = navContainer.getBoundingClientRect().top;
      const navBottom = navContainer.getBoundingClientRect().bottom;
      const itemTop = tocItem.getBoundingClientRect().top;
      const itemBottom = tocItem.getBoundingClientRect().bottom;

      if (itemTop < navTop + 20 || itemBottom > navBottom - 20) {
        tocItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeSection]);

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveSection(id);
    isManualClickRef.current = true;

    const target = document.getElementById(id);
    const pane = contentPaneRef.current;

    if (pane && target) {
      const paneTop = pane.getBoundingClientRect().top;
      const targetTop = target.getBoundingClientRect().top;
      const currentScroll = pane.scrollTop;
      const targetOffset = targetTop - paneTop + currentScroll - 8;
      pane.scrollTo({ top: targetOffset, behavior: 'smooth' });
    } else if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setTimeout(() => {
      isManualClickRef.current = false;
    }, 600);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('compliance@frostyagent.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const filteredSections = SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fx-root min-h-screen bg-[#FFFFFF] text-[#0A1A2F] selection:bg-[#0396A6]/15 selection:text-[#0396A6] relative overflow-x-hidden">
      {/* ── Ambient Background Depth ── */}
      <ParallaxStarfield />
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-[#0396A6]/8 via-[#0396A6]/3 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-[45%] right-[-10%] w-[450px] h-[450px] bg-[#FF7A5E]/4 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-[#0396A6]/6 blur-[110px] rounded-full" />
      </div>

      {/* ── Glass Navbar ── */}
      <GlassNavbar ready={true} />

      {/* ══════════════════════════════════════════════════════════════════
          VIEWPORT-FITTED 2-PANE VIEWER (Directly under Navbar)
      ══════════════════════════════════════════════════════════════════ */}
      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT PANE: TABLE OF CONTENTS (Independently Scrollable) ── */}
          <aside className="lg:col-span-4 h-[calc(100vh-6.5rem)] flex flex-col sticky top-20">
            <div className="h-full w-full flex flex-col p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <span className="text-xs font-bold text-[#0A1A2F] uppercase tracking-wider">
                  ACCEPTABLE USE POLICY
                </span>
                <span className="text-[10px] font-bold text-[#0396A6] bg-[#0396A6]/10 px-2.5 py-0.5 rounded-full">
                  {filteredSections.length} Sections
                </span>
              </div>

              {/* Search Filter input */}
              <div className="relative mt-2.5 shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0396A6] focus:border-[#0396A6]"
                  placeholder="Filter rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Left Pane Scroll Container with Auto-Scroll Tracking */}
              <nav
                ref={tocNavRef}
                data-lenis-prevent
                className="mt-2.5 flex-1 overflow-y-auto pr-1 space-y-1 overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#0396A6]/40 scroll-smooth"
              >
                {filteredSections.map((sec) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <a
                      id={`toc-${sec.id}`}
                      key={sec.id}
                      href={`#${sec.id}`}
                      onClick={(e) => handleSectionClick(e, sec.id)}
                      style={isActive ? { color: '#FFFFFF', backgroundColor: '#0396A6' } : undefined}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all duration-200 border cursor-pointer ${
                        isActive
                          ? 'bg-[#0396A6] border-[#0396A6] !text-white font-bold shadow-xs'
                          : 'bg-white border-slate-200/80 text-slate-700 hover:text-[#0396A6] hover:bg-slate-50 hover:border-[#0396A6]/40 font-medium'
                      }`}
                    >
                      <span
                        style={isActive ? { color: '#FFFFFF' } : undefined}
                        className={`w-5 h-5 rounded-md text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-white/20 !text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {sec.num}
                      </span>
                      <span
                        style={isActive ? { color: '#FFFFFF' } : undefined}
                        className={`truncate ${isActive ? '!text-white font-bold' : 'text-slate-700'}`}
                      >
                        {sec.title}
                      </span>
                    </a>
                  );
                })}
              </nav>

              {/* Compact Abuse Desk Footer */}
              <div className="pt-2.5 mt-2 border-t border-slate-100 shrink-0">
                <button
                  onClick={handleCopyEmail}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 hover:border-[#0396A6]/40 transition-all text-xs font-mono group"
                >
                  <span className="font-semibold text-slate-800 text-[11px] truncate">compliance@frostyagent.com</span>
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0396A6] shrink-0" />}
                </button>
              </div>
            </div>
          </aside>

          {/* ── RIGHT PANE: RULES & CONTENT (100% 1-to-1 Match with TOC) ── */}
          <div
            ref={contentPaneRef}
            id="legal-content-pane"
            data-lenis-prevent
            className="lg:col-span-8 h-[calc(100vh-6.5rem)] overflow-y-auto pr-2 space-y-6 overscroll-contain [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#0396A6]/40"
          >
            {/* Intro Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0396A6]/10 via-[#0396A6]/5 to-transparent border border-[#0396A6]/20 shadow-xs">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                This Policy forms part of the{' '}
                <Link href="/terms" className="text-[#0396A6] font-bold underline hover:text-[#027D8A]">
                  Terms of Service
                </Link>
                . It applies to you, your team members, and anyone using the Service through your account. We may suspend or terminate the Service immediately for a material breach.
              </p>
            </div>

            {/* Section 1 */}
            <section id="section-1" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  01
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Prohibited Deployments
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                You must not configure or use Frosty Agent to:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li>
                  Give <strong>medical, legal, financial or tax advice</strong> to individuals, or anything a reasonable person would rely on for a safety-critical decision;
                </li>
                <li>
                  Handle <strong>emergencies, crisis or self-harm situations</strong> as a substitute for human or emergency services;
                </li>
                <li>
                  Sell or promote illegal goods or services, weapons, controlled substances, gambling where prohibited, or adult content;
                </li>
                <li>
                  Operate in a sector where automated advice requires a licence you do not hold;
                </li>
                <li>
                  Make automated decisions with legal or similarly significant effects on an individual (credit, employment, insurance, housing) without human review.
                </li>
              </ul>
            </section>

            {/* Section 1A */}
            <section id="section-1a" className="p-6 sm:p-8 rounded-2xl bg-white border border-amber-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    1A
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                    Children & DPDP Act Compliance
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Mandatory Standard
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                If your audience may include people under 18:
              </p>
              <ul className="list-disc pl-5 space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li>
                  <strong>You are the Data Fiduciary:</strong> You must obtain verifiable parental consent under <strong>Section 9 of the Digital Personal Data Protection Act, 2023</strong> and <strong>Rule 10 of the DPDP Rules, 2025</strong> before the agent processes a child’s personal data. Where the GDPR applies, the age of consent is 13 to 16 depending on the Member State and you must meet the applicable threshold.
                </li>
                <li>
                  Do not deploy the agent to an audience you know, or ought reasonably to know, includes children unless you have implemented age assurance and parental consent to that standard.
                </li>
                <li>
                  Do not configure the agent to profile, track, behaviourally monitor or advertise to a child. <strong>Section 9(3) of the DPDP Act</strong> prohibits it outright, and no configuration of ours performs it.
                </li>
                <li>
                  Tell us if your audience includes children and we will disable lead capture, enquiry scoring and conversation persistence for your agent.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  02
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Agent Identity & Transparency
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li>Do not configure the agent to deny being an AI if a person asks directly.</li>
                <li>Do not impersonate a named real person, a government body, or another business.</li>
                <li>Do not use it to generate deceptive reviews, testimonials or endorsements.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  03
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Unlawful or Harmful Content
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                You must not upload to the knowledge base, catalogue or configuration any content that:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li>You do not have the right to use;</li>
                <li>Infringes intellectual property or contains someone else’s confidential information;</li>
                <li>Is unlawful, defamatory, harassing, hateful, or promotes violence;</li>
                <li>Contains malware or exploit code;</li>
                <li>
                  Contains special-category personal data (health, biometric, religious or political data, sexual orientation, or similar) unless you have told us in writing and we have agreed in the DPA.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  04
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Data Misuse & Anti-Spam
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li>Only send messages to people who have opted in as the relevant channel requires. For WhatsApp this is a Meta requirement and you carry it.</li>
                <li>Do not upload contact lists you have no lawful basis to process.</li>
                <li>Do not use the Service for unsolicited bulk messaging or spam.</li>
                <li>Do not attempt to re-identify, scrape or harvest data about visitors beyond what your own privacy notice discloses.</li>
              </ul>
            </section>

            {/* Section 4A */}
            <section id="section-4a" className="p-6 sm:p-8 rounded-2xl bg-white border border-emerald-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    4A
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                    WhatsApp Rules (Meta Platform Policy)
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Meta Policy
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                If you use the WhatsApp channel:
              </p>
              <ul className="list-disc pl-5 space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li>
                  <strong>Record a valid opt-in before messaging anyone:</strong> Meta requires an active, affirmative action that names your business and confirms the person wants WhatsApp messages from you. A phone number sitting in your CRM is not opt-in. If Meta audits your account you must be able to produce the consent record immediately.
                </li>
                <li>
                  <strong>Keep the agent task-specific:</strong> Since 15 January 2026 Meta permits only task-specific assistants on the WhatsApp Business Platform — support, order tracking, appointment booking and similar. Generic open-ended AI chat without a clear business purpose is prohibited and risks your WhatsApp account, not only ours.
                </li>
                <li>Provide an easy opt-out and honour it immediately.</li>
                <li>Observe messaging windows and template approval rules.</li>
              </ul>
              <p className="text-xs text-slate-500 italic">
                We may suspend the WhatsApp channel on your account if we believe your use puts our platform access at risk.
              </p>
            </section>

            {/* Section 4B */}
            <section id="section-4b" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  4B
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Voice Recording & Consent
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                If you enable voice, you are recording a person’s voice and having it transcribed:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li>Tell people before the recording starts.</li>
                <li>Some jurisdictions require all-party consent to record a conversation — several US states and a number of other countries. If you serve those markets, obtain it.</li>
                <li>Do not use voice features to attempt speaker identification, emotion inference, or any biometric categorisation of a person.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  05
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  System Security & Load Limits
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                You must not:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li>
                  Probe, scan or test the vulnerability of the Service except under a written agreement with us{' '}
                  <a href="#section-7" onClick={(e) => handleSectionClick(e, 'section-7')} className="text-[#0396A6] font-bold hover:underline">
                    (see Section 7)
                  </a>;
                </li>
                <li>Circumvent authentication, rate limits, plan entitlements, quotas or billing;</li>
                <li>Access another merchant’s data, or attempt to;</li>
                <li>Use automated means to place unreasonable load on the Service;</li>
                <li>Resell, sublicense or provide the Service to third parties as your own product without a written reseller agreement.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  06
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Model Extraction & Subversion Safeguards
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li>Do not attempt to extract system prompts, model weights, or our proprietary configuration.</li>
                <li>Do not use the Service to train a competing model.</li>
                <li>Do not deliberately use prompt injection to make the agent violate this Policy.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  07
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Security Research & Safe Harbor
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We welcome good-faith reports. Write to{' '}
                <a href="mailto:security@frostyagent.com" className="text-[#0396A6] font-bold underline">
                  security@frostyagent.com
                </a>{' '}
                before testing. Do not test against another merchant’s account, do not access data that is not yours, and give us reasonable time to fix an issue before disclosing it.
              </p>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  08
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Team Member Governance
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                You are responsible for your team members’ use, including any custom roles you create. Grant the narrowest permissions each person needs.
              </p>
            </section>

            {/* Section 9: Enforcement Bento Card (WHITE THEME) */}
            <section id="section-9" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 text-[#0A1A2F] space-y-5 scroll-mt-2 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  09
                </span>
                <h2 className="text-xl font-bold text-[#0A1A2F]">Enforcement & Abuse Reporting</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We may investigate suspected breaches and may suspend access, remove content, or terminate. Where practicable we will give notice and an opportunity to cure — but for security risks, illegal activity, or risk to other merchants we may act immediately.
              </p>
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Dedicated Abuse Reporting Desk</span>
                  <span className="text-sm font-mono text-[#0396A6] font-bold">compliance@frostyagent.com</span>
                </div>
                <a
                  href="mailto:compliance@frostyagent.com"
                  style={{ color: '#FFFFFF', backgroundColor: '#0396A6' }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0396A6] hover:bg-[#027D8A] !text-white font-semibold text-xs transition-all shadow-xs shrink-0"
                >
                  <Mail className="w-3.5 h-3.5 !text-white" style={{ color: '#FFFFFF' }} />
                  <span className="!text-white" style={{ color: '#FFFFFF' }}>Report Abuse</span>
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <FooterSection />
    </div>
  );
}
