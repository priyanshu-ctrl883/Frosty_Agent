'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Lock,
  Scale,
  ShieldCheck,
  Zap,
  CreditCard,
  RefreshCw,
  Building2,
  Globe,
  Mail,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import GlassNavbar from '@/components/GlassNavbar';
import FooterSection from '../FooterSection';
import { ParallaxStarfield } from '@/components/FrostyEngineHero';
import '../FrostyPage.css';

const SECTIONS = [
  { id: 'section-1', num: '01', title: 'Introduction & Order of Precedence' },
  { id: 'section-2', num: '02', title: 'The Service & License Grant' },
  { id: 'section-3', num: '03', title: 'Your Account & Security' },
  { id: 'section-4', num: '04', title: 'Your Content & Customer Data' },
  { id: 'section-5', num: '05', title: 'AI Output — Important Limitations' },
  { id: 'section-6', num: '06', title: 'AI Providers & Sub-processors' },
  { id: 'section-7', num: '07', title: 'Third-Party Channels (WhatsApp & Calendar)' },
  { id: 'section-8', num: '08', title: 'Acceptable Use, Suspension & Appeals' },
  { id: 'section-9', num: '09', title: 'Plans, Fees & Conversation Billing' },
  { id: 'section-10', num: '10', title: 'Refunds & 14-Day Money-Back Guarantee' },
  { id: 'section-11', num: '11', title: 'Availability & Support SLAs' },
  { id: 'section-12', num: '12', title: 'Intellectual Property & No AI Training' },
  { id: 'section-13', num: '13', title: 'Confidentiality & Non-Disclosure' },
  { id: 'section-14', num: '14', title: 'Term, Suspension & Termination' },
  { id: 'section-15', num: '15', title: 'Warranties & Disclaimers' },
  { id: 'section-16', num: '16', title: 'Limitation of Liability & ₹1,00,000 Cap' },
  { id: 'section-17', num: '17', title: 'Indemnification Procedures' },
  { id: 'section-18', num: '18', title: 'Changes to these Terms' },
  { id: 'section-19', num: '19', title: 'General Provisions & Force Majeure' },
  { id: 'section-20', num: '20', title: 'Governing Law & Gurugram Jurisdiction' },
  { id: 'section-21', num: '21', title: 'Grievance Redressal Officer' },
  { id: 'section-22', num: '22', title: 'Contact Details & Notice Desks' },
];

export default function TermsPage() {
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
    navigator.clipboard.writeText('support@frostyagent.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const filteredSections = SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.num.toLowerCase().includes(searchQuery.toLowerCase())
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
                  TERMS OF SERVICE
                </span>
                <span className="text-[10px] font-bold text-[#0396A6] bg-[#0396A6]/10 px-2.5 py-0.5 rounded-full">
                  {filteredSections.length} Clauses
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
                  placeholder="Filter terms..."
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

              {/* Compact Support Desk Footer */}
              <div className="pt-2.5 mt-2 border-t border-slate-100 shrink-0">
                <button
                  onClick={handleCopyEmail}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 hover:border-[#0396A6]/40 transition-all text-xs font-mono group"
                >
                  <span className="font-semibold text-slate-800 text-[11px] truncate">support@frostyagent.com</span>
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0396A6] shrink-0" />}
                </button>
              </div>
            </div>
          </aside>

          {/* ── RIGHT PANE: ALL 22 CLAUSES (100% 1-to-1 Match with TOC) ── */}
          <div
            ref={contentPaneRef}
            id="legal-content-pane"
            data-lenis-prevent
            className="lg:col-span-8 h-[calc(100vh-6.5rem)] overflow-y-auto pr-2 space-y-6 overscroll-contain [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#0396A6]/40"
          >
            {/* Clause 1 */}
            <section id="section-1" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  01
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Introduction & Order of Precedence
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>1.1.</strong> These Terms govern your use of Frosty Agent (the “Service”), an AI sales and support agent that you deploy on your own website and messaging channels. Frostrek LLP (“Frostrek”, “we”, “us”, “our”) provides the Service.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>1.2.</strong> By creating an account or using the Service you agree to these Terms. If agreeing on behalf of a company, you confirm authority to bind it.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>1.3.</strong> You must be at least 18 and capable of entering into a contract. The Service is for business use only.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>1.4.</strong> These Terms incorporate our{' '}
                <Link href="/acceptable-use" className="text-[#0396A6] font-bold underline hover:text-[#027D8A]">
                  Acceptable Use Policy
                </Link>{' '}
                and Data Processing Addendum. Our{' '}
                <Link href="/privacy" className="text-[#0396A6] font-bold underline hover:text-[#027D8A]">
                  Privacy Policy
                </Link>{' '}
                is a notice describing how we handle personal data.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>1.5. Order of Precedence:</strong> (a) Data Processing Addendum; (b) signed enterprise order form; (c) these Terms; (d) Acceptable Use Policy.
              </p>
            </section>

            {/* Clause 2 */}
            <section id="section-2" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  02
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  The Service & License Grant
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>2.1.</strong> Frosty Agent provides an AI agent that answers visitor queries, captures leads, books meetings, prepares quotations, and hands conversations to human staff on web widgets, WhatsApp, and connected channels.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>2.2. License grant:</strong> We grant you a non-exclusive, non-transferable, worldwide right to access and use the Service for your business during an active subscription.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>2.3.</strong> We provide the software and hosted infrastructure. You remain responsible for what your agent says, the accuracy of your uploaded knowledge base, and your customer relationships.
              </p>
            </section>

            {/* Clause 3 */}
            <section id="section-3" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  03
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Your Account & Security
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li><strong>3.1. Credentials:</strong> You must keep account credentials secure and not share accounts across individuals.</li>
                <li>
                  <strong>3.2. Compromise notice:</strong> Notify{' '}
                  <a href="mailto:security@frostyagent.com" className="text-[#0396A6] font-semibold underline">
                    security@frostyagent.com
                  </a>{' '}
                  promptly if you suspect unauthorized access or credential compromise.
                </li>
                <li><strong>3.3. Team members:</strong> You are responsible for all actions taken by team members you invite to your account.</li>
              </ul>
            </section>

            {/* Clause 4 */}
            <section id="section-4" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  04
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Your Content & Customer Data
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li><strong>4.1. Your Content Ownership:</strong> Knowledge bases, catalogues, and branding assets remain your intellectual property. You grant us a limited license solely to host and run the Service for you.</li>
                <li><strong>4.2. Customer Data Roles:</strong> You are the Data Controller for your visitors’ conversations and leads; we act as your Data Processor.</li>
                <li><strong>4.3. Privacy Warranties:</strong> You warrant that you have lawful basis, necessary consents, and proper privacy notices to deploy the agent to your audience.</li>
              </ul>
            </section>

            {/* Clause 5 */}
            <section id="section-5" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  05
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  AI Output — Important Limitations
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li><strong>5.1. Model Nature:</strong> The agent generates responses using statistical large language models. It can make mistakes or hallucinate despite built-in guardrails.</li>
                <li><strong>5.2. Verification:</strong> You are responsible for configuring guardrails and reviewing your uploaded knowledge base.</li>
                <li>
                  <strong>5.3. Prohibited uses:</strong> Must not configure for medical, legal, financial advice, or automated credit/employment decisions without human review (<Link href="/acceptable-use#section-1" className="text-[#0396A6] font-bold underline">Section 1 AUP</Link>).
                </li>
                <li><strong>5.4. Emergencies:</strong> The agent is not an emergency service. English crisis detection routes to public help lines, but cannot be relied upon as a clinical safeguard.</li>
                <li><strong>5.5. Quotations:</strong> AI-drafted quotes are indicative estimates until formally approved and executed by your staff.</li>
              </ul>
            </section>

            {/* Clause 6 */}
            <section id="section-6" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  06
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  AI Providers & Sub-processors
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>6.1.</strong> We may update or route across upstream AI models and providers to ensure high availability, speed, and latency performance.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>6.2.</strong> Our active list of infrastructure sub-processors is maintained in our{' '}
                <Link href="/privacy#section-12" className="text-[#0396A6] font-bold underline hover:text-[#027D8A]">
                  Privacy Policy Section 12
                </Link>.
              </p>
            </section>

            {/* Clause 7 */}
            <section id="section-7" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  07
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Third-Party Channels (WhatsApp & Calendar)
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li><strong>7.1. Third-party terms:</strong> Connecting external integrations (e.g. WhatsApp, Google Calendar) subjects you directly to those providers’ terms and policies.</li>
                <li>
                  <strong>7.2. WhatsApp & Meta Rules:</strong> For WhatsApp, you carry sole responsibility for obtaining verifiable opt-in consent, respecting messaging windows, and adhering to Meta’s task-specific assistant rules effective January 15, 2026.
                </li>
                <li><strong>7.3. Calendar integrations:</strong> You are responsible for authorization scopes and verifying appointment conflicts.</li>
              </ul>
            </section>

            {/* Clause 8 */}
            <section id="section-8" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  08
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Acceptable Use, Suspension & Appeals
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li>
                  <strong>8.1. AUP incorporation:</strong> Use is subject to our{' '}
                  <Link href="/acceptable-use" className="text-[#0396A6] font-bold underline hover:text-[#027D8A]">
                    Acceptable Use Policy
                  </Link>.
                </li>
                <li>
                  <strong>8.2. Notice to cure:</strong> For suspected non-critical breaches, we provide 3 business days to cure. Immediate suspension applies only for platform security threats, illegal conduct, or regulatory mandates (with notice provided within 24 hours).
                </li>
                <li><strong>8.3. Targeted isolation:</strong> Where technically feasible, we suspend only the affected agent or integration channel rather than the whole account.</li>
                <li>
                  <strong>8.4. Appeal SLA:</strong> Appeals submitted to{' '}
                  <a href="mailto:support@frostyagent.com" className="text-[#0396A6] underline">
                    support@frostyagent.com
                  </a>{' '}
                  are reviewed by an independent team member within 5 business days. If wrongly suspended, fees are credited.
                </li>
              </ul>
            </section>

            {/* Clause 9 */}
            <section id="section-9" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  09
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Plans, Fees & Conversation Billing
                </h2>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <h3 className="font-bold text-slate-900">9.2. Billable Conversation Definition:</h3>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                  <li>A single exchange between one visitor and your agent consumes 1 conversation credit.</li>
                  <li>Allows up to 12 outgoing messages from the agent. Visitor messages are unlimited.</li>
                  <li>Ends after 60 minutes of inactivity. Messages sent after that start a new conversation.</li>
                  <li>The 13th outgoing message begins a new conversation credit without interrupting the chat.</li>
                  <li>Moving a visitor from website to WhatsApp begins a new conversation credit (context transfers).</li>
                </ul>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>9.3. Non-billable:</strong> Conversations where the agent produces no answer or system errors occur on our side are not charged. WhatsApp messages are charged only upon successful delivery.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>9.4–9.9. Pricing & Overage:</strong> Prices are in INR ex-GST. Credits expire at end of billing cycle. Overage can be enabled with spend caps or disabled to auto-pause. Price changes require 30 days’ advance notice.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>9.10–9.11. Razorpay Mandates & RBI Rules:</strong> Recurring renewals notify by email 7 days before monthly and 30 days before annual renewals. Banks issue 24h pre-debit notices under RBI guidelines. Turn off auto-renewal anytime in dashboard.
              </p>
            </section>

            {/* Clause 10 */}
            <section id="section-10" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  10
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Refunds & 14-Day Money-Back Guarantee
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li>
                  <strong>10.1. Cancellation:</strong> Cancel anytime in dashboard or via{' '}
                  <a href="mailto:billing@frostyagent.com" className="text-[#0396A6] underline">
                    billing@frostyagent.com
                  </a>
                  . Access continues until billing cycle end.
                </li>
                <li>
                  <strong>10.3. 14-Day Money-Back Guarantee (Quarterly / 6-Month / Annual plans):</strong> If you cancel within 14 days of first payment having consumed no more than 20% of one month’s allowance, request a 100% refund. Excludes setup/add-on fees. (Monthly plans cancel anytime with no lock-in).
                </li>
                <li>
                  <strong>10.6. SLA:</strong> Refund decisions are rendered within 5 business days, and funds remitted to original payment method within 5 to 7 business days of approval.
                </li>
              </ul>
            </section>

            {/* Clause 11 */}
            <section id="section-11" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  11
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Availability & Support SLAs
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li><strong>11.1. Availability:</strong> We target 99.5% uptime during each calendar month, excluding scheduled maintenance.</li>
                <li>
                  <strong>11.2. Support Hours:</strong> Mon–Fri, 10:00 to 19:00 IST at{' '}
                  <a href="mailto:support@frostyagent.com" className="text-[#0396A6] font-semibold underline">
                    support@frostyagent.com
                  </a>.
                </li>
                <li><strong>11.3. Maintenance:</strong> Planned maintenance is communicated at least 48 hours in advance and scheduled during low-traffic windows.</li>
              </ul>
            </section>

            {/* Clause 12 */}
            <section id="section-12" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  12
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Intellectual Property & No AI Training
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>12.1–12.3. Output Ownership:</strong> All rights in the Frosty Agent platform belong to Frostrek. You own the outputs, drafted quotes, and summaries generated by the agent for your account.
              </p>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm leading-relaxed font-medium">
                <strong>12.4. Contractual Guarantee: We Do Not Train On Your Data.</strong> We do not use your content, configuration, or customer conversations to train or fine-tune any AI model. We contractually bind all upstream AI providers to the same restriction. Any future change requires explicit, separate opt-in — continued use never constitutes consent.
              </div>
            </section>

            {/* Clause 13 */}
            <section id="section-13" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  13
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Confidentiality & Non-Disclosure
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>13.1–13.4.</strong> Both parties agree to maintain mutual reasonable care over non-public information. Confidentiality obligations survive termination for a period of 3 years (trade secrets survive indefinitely).
              </p>
            </section>

            {/* Clause 14 */}
            <section id="section-14" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  14
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Term, Suspension & Termination
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>14.1–14.3.</strong> Either party may terminate on 30 days’ notice for uncured material breach.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>14.4–14.5. 30-Day Export Window:</strong> On termination, live data is retained for 30 days for self-service export, then purged (backups overwritten within rolling 60 days). Statutory invoices are retained for 8 years.
              </p>
            </section>

            {/* Clause 15 */}
            <section id="section-15" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  15
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Warranties & Disclaimers
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>15.1–15.3.</strong> We warrant providing the Service with reasonable skill and care. Except as expressly stated, the Service is provided &ldquo;as is&rdquo; without implied warranties of merchantability or fitness for a particular purpose.
              </p>
            </section>

            {/* Clause 16 */}
            <section id="section-16" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  16
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Limitation of Liability & ₹1,00,000 Cap
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li><strong>16.1.</strong> No limits on fraud, death, or personal injury caused by negligence.</li>
                <li><strong>16.2.</strong> Exclusion of indirect, special, or consequential damages.</li>
                <li>
                  <strong>16.3–16.4. Liability Cap:</strong> Total aggregate liability of either party over any 12-month period is capped at the greater of fees paid in that period or <strong>₹1,00,000</strong>.
                </li>
                <li>
                  <strong>16.5. Uncapped Items:</strong> Caps do not apply to payment obligations, indemnities under clause 17.1, confidentiality breaches (clause 13), IP infringement, AUP breaches, or DPA/data protection breaches.
                </li>
              </ul>
            </section>

            {/* Clause 17 */}
            <section id="section-17" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  17
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Indemnification Procedures
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>17.1. Customer indemnity:</strong> You indemnify us for third-party claims arising from your content, AUP violations, unlawful instructions, or unreviewed AI output decisions.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>17.3. Provider IP indemnity:</strong> We defend and indemnify you against third-party IP infringement claims directly alleging the core Frosty Agent software infringes copyright, trademark, or patent.
              </p>
            </section>

            {/* Clause 18 */}
            <section id="section-18" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  18
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Changes to these Terms
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>18.1–18.2.</strong> We provide 30 days’ advance notice by email for material changes. Prior versions are archived with changelog dates.
              </p>
            </section>

            {/* Clause 19 */}
            <section id="section-19" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  19
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  General Provisions & Force Majeure
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li><strong>19.3. Assignment:</strong> 30 days’ advance notice with termination right for assigned party.</li>
                <li><strong>19.5. Force Majeure:</strong> Excusable delay up to 30 days with mutual termination and prepaid fee refunds thereafter.</li>
              </ul>
            </section>

            {/* Clause 20 */}
            <section id="section-20" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  20
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Governing Law & Gurugram Jurisdiction
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li><strong>20.1–20.2. Jurisdiction:</strong> Governed by laws of India; exclusive jurisdiction in courts at Gurugram, Haryana.</li>
                <li><strong>20.3. Consumer Protection:</strong> Consumer Protection Act 2019 rights preserved.</li>
                <li><strong>20.4. Commercial Mediation:</strong> Pre-institution mediation under Section 12A of Commercial Courts Act 2015 required before litigation.</li>
              </ul>
            </section>

            {/* Clause 21 */}
            <section id="section-21" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  21
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Grievance Redressal Officer
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Appointed officer under Consumer Protection (E-Commerce) Rules 2020 and DPDP Act 2023:
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700 leading-relaxed">
                <p>
                  <strong>Anurag Tripathi</strong> · Designation: Grievance Officer ·{' '}
                  <a href="mailto:grievance@frostyagent.com" className="text-[#0396A6] underline">
                    grievance@frostyagent.com
                  </a>{' '}
                  · Tel: +91 96677 88869
                </p>
                <p className="text-slate-500">
                  Registered Office: Frostrek LLP · 4th Floor, 422, Success Tower, Golf Course Extension Road, Gurugram, Haryana 122002, India.
                </p>
                <p className="text-slate-500">
                  SLA: Acknowledgement within 48 hours with ticket ID; statutory resolution within 30 days.
                </p>
              </div>
            </section>

            {/* Clause 22: Notice Desks Bento Card (WHITE THEME) */}
            <section id="section-22" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 text-[#0A1A2F] space-y-6 scroll-mt-2 shadow-xs">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3 mb-1">
                  <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    22
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A1A2F]">
                    Contact Details & Notice Desks
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Official desks for contractual notifications, billing inquiries, and compliance:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <span className="text-slate-500 font-semibold block mb-0.5">General & Support</span>
                  <a href="mailto:support@frostyagent.com" className="text-[#0396A6] font-mono hover:underline font-medium">
                    support@frostyagent.com
                  </a>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <span className="text-slate-500 font-semibold block mb-0.5">Billing & Invoices</span>
                  <a href="mailto:billing@frostyagent.com" className="text-[#0396A6] font-mono hover:underline font-medium">
                    billing@frostyagent.com
                  </a>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <span className="text-slate-500 font-semibold block mb-0.5">Privacy & Data Requests</span>
                  <a href="mailto:privacy@frostyagent.com" className="text-[#0396A6] font-mono hover:underline font-medium">
                    privacy@frostyagent.com
                  </a>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <span className="text-slate-500 font-semibold block mb-0.5">Abuse & Compliance</span>
                  <a href="mailto:compliance@frostyagent.com" className="text-[#0396A6] font-mono hover:underline font-medium">
                    compliance@frostyagent.com
                  </a>
                </div>
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
