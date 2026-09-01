'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  Lock,
  FileText,
  AlertTriangle,
  Scale,
  Users,
  Building2,
  Globe,
  Database,
  Mail,
  ChevronRight,
  Copy,
  Check,
  Server,
  Eye,
  Clock,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import GlassNavbar from '@/components/GlassNavbar';
import FooterSection from '../FooterSection';
import { ParallaxStarfield } from '@/components/FrostyEngineHero';
import '../FrostyPage.css';

const SECTIONS = [
  { id: 'section-1', num: '01', title: 'Introduction & Operating Roles' },
  { id: 'part-a', num: 'A', title: 'Part A — Merchants (We are Controller)' },
  { id: 'section-2', num: '02', title: 'What We Collect from Merchants' },
  { id: 'section-3', num: '03', title: 'Lawful Basis & No Model Training' },
  { id: 'section-4', num: '04', title: 'Merchant Data Retention Schedule' },
  { id: 'section-5', num: '05', title: 'Merchant Rights under Indian & EU Law' },
  { id: 'part-b', num: 'B', title: 'Part B — Visitors (Merchant is Controller)' },
  { id: 'section-6', num: '06', title: 'What is Processed during Conversations' },
  { id: 'section-6b', num: '6b', title: 'Ad Measurement & Meta Conversions API' },
  { id: 'section-7', num: '07', title: 'AI Transparency & Profiling Safeguards' },
  { id: 'section-8', num: '08', title: 'Browser Local Storage & Cookies' },
  { id: 'section-9', num: '09', title: 'Why Processed & Retention Ceilings' },
  { id: 'section-10', num: '10', title: 'Visitor Rights & Merchant Routing' },
  { id: 'part-c', num: 'C', title: 'Part C — General (Applies to Everyone)' },
  { id: 'section-11', num: '11', title: 'Data Request Handling & SLAs' },
  { id: 'section-12', num: '12', title: 'Sub-processors & Third Parties' },
  { id: 'section-13', num: '13', title: 'Data Residency & Transfers' },
  { id: 'section-14', num: '14', title: 'Security Architecture & RLS' },
  { id: 'section-15', num: '15', title: 'Breach Notification Timelines' },
  { id: 'section-16', num: '16', title: 'United States — California (CCPA)' },
  { id: 'section-17', num: '17', title: 'Other International Countries' },
  { id: 'section-18', num: '18', title: 'Children & Minor Data Protection' },
  { id: 'section-19', num: '19', title: 'Grievance Officer & Contact Details' },
  { id: 'section-20', num: '20', title: 'Governing Law & Severability' },
];

export default function PrivacyPage() {
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
    navigator.clipboard.writeText('privacy@frostyagent.com');
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
                  PRIVACY SECTIONS
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
                  placeholder="Filter sections..."
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

              {/* Compact DPO Desk Footer */}
              <div className="pt-2.5 mt-2 border-t border-slate-100 shrink-0">
                <button
                  onClick={handleCopyEmail}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 hover:border-[#0396A6]/40 transition-all text-xs font-mono group"
                >
                  <span className="font-semibold text-slate-800 text-[11px] truncate">privacy@frostyagent.com</span>
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0396A6] shrink-0" />}
                </button>
              </div>
            </div>
          </aside>

          {/* ── RIGHT PANE: LEGAL CONTENT (100% 1-to-1 Match with TOC) ── */}
          <div
            ref={contentPaneRef}
            id="legal-content-pane"
            data-lenis-prevent
            className="lg:col-span-8 h-[calc(100vh-6.5rem)] overflow-y-auto pr-2 space-y-6 overscroll-contain [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#0396A6]/40"
          >
            {/* Section 1 */}
            <section id="section-1" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  01
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Introduction & Operating Roles
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>1.1.</strong> Frostrek LLP (“Frostrek”, “we”, “us”, “our”) provides Frosty Agent, an AI sales and support agent that businesses deploy on their own website and messaging channels. This policy explains what we do with personal data.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>1.2.</strong> This policy covers frostyagent.com, the Frosty Agent dashboards, the chat widget, and the agent itself wherever it operates.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>1.3. Dual Roles:</strong> We act in two different roles, and which one applies determines your rights and who you contact:
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-800">
                      <th className="py-2.5 px-3 font-semibold">If You Are</th>
                      <th className="py-2.5 px-3 font-semibold">Our Role</th>
                      <th className="py-2.5 px-3 font-semibold">Who Decides Data Use</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-900">A merchant using Frosty Agent</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Controller (Data Fiduciary)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium">Us</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-900">A visitor talking to a merchant’s agent</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Processor (Data Processor)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium">The merchant</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs sm:text-sm leading-relaxed space-y-2">
                <p>
                  <strong>1.4. Note for Visitors:</strong> If you spoke to an AI agent on a company’s website or on WhatsApp, that company decides how your data is used and is the first place to go with a request. We process it on their instructions. If you cannot reach the company, write to{' '}
                  <a href="mailto:privacy@frostyagent.com" className="font-bold underline">
                    privacy@frostyagent.com
                  </a>{' '}
                  and we will route your request to them.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-medium">
                <strong>1.6. Binding Commitment:</strong> We do not sell personal data. We do not use your data, or your visitors’ conversations, to train foundation models.
              </div>
            </section>

            {/* PART A HEADER */}
            <section id="part-a" className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  A
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#0396A6] block">Scope 1</span>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                    Part A — Merchants (We are the Controller)
                  </h2>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                This Part explains how Frostrek handles personal data belonging to merchants who register for, configure, and use the Frosty Agent platform.
              </p>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  02
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  What We Collect from Merchants
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li><strong>2.1. Account data:</strong> Name, business email, phone number, company name, role, and hashed password.</li>
                <li><strong>2.2. Business data:</strong> GSTIN, billing address, plan, invoices and payment references. Razorpay handles payment details securely.</li>
                <li><strong>2.3. Configuration:</strong> Knowledge base, product catalogue, agent settings, and branding assets.</li>
                <li><strong>2.4. Usage data:</strong> Logins, actions in the dashboard, audit logs, IP address, device, and browser.</li>
                <li><strong>2.5. Support communications:</strong> Messages you send us and our replies.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  03
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Lawful Basis & No Model Training
                </h2>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-800">
                      <th className="py-2 px-3 font-semibold">Purpose</th>
                      <th className="py-2 px-3 font-semibold">Basis — India (DPDP Act, 2023)</th>
                      <th className="py-2 px-3 font-semibold">Basis — EU/UK (GDPR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Providing the Service</td>
                      <td className="py-2 px-3">Consent, Section 6</td>
                      <td className="py-2 px-3">Art 6(1)(b) — contract</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Billing, invoicing and tax</td>
                      <td className="py-2 px-3">Certain legitimate use, Section 7(d) (Income-tax Act 1961, CGST Act 2017)</td>
                      <td className="py-2 px-3">Art 6(1)(b) & 6(1)(c)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Security & abuse prevention</td>
                      <td className="py-2 px-3">Consent, Section 6; and Section 7(d) for CERT-In Directions</td>
                      <td className="py-2 px-3">Art 6(1)(f) — legitimate interests</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Marketing emails</td>
                      <td className="py-2 px-3">Consent, Section 6 (withdrawable anytime)</td>
                      <td className="py-2 px-3">Art 6(1)(a) — consent</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>3.3. Contractual Commitment:</strong> We never use your content, configuration or visitors’ conversations to train or fine-tune any AI model —{' '}
                <Link href="/terms#section-12" className="text-[#0396A6] font-bold underline hover:text-[#027D8A]">
                  clause 12.4 of our Terms of Service
                </Link>{' '}
                makes that a binding contractual commitment.
              </p>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  04
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Merchant Data Retention Schedule
                </h2>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-800">
                      <th className="py-2 px-3 font-semibold">Data Category</th>
                      <th className="py-2 px-3 font-semibold">Retention Period</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Account & configuration</td>
                      <td className="py-2 px-3">For the life of the account, then 30 days</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Invoices and tax records</td>
                      <td className="py-2 px-3">8 years (statutory requirement)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Audit logs</td>
                      <td className="py-2 px-3">365 days</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Backups</td>
                      <td className="py-2 px-3">30 days (overwritten in rolling purge)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  05
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Merchant Rights under Indian & EU Law
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li>
                  <strong>Under DPDP Act, 2023:</strong> Right to access summary of data (Section 11), correction & erasure (Section 12), grievance redressal (Section 13), and nomination upon death/incapacity (Section 14).
                </li>
                <li>
                  <strong>Consent withdrawal:</strong> Withdraw consent anytime via{' '}
                  <a href="mailto:privacy@frostyagent.com" className="text-[#0396A6] font-semibold underline">
                    privacy@frostyagent.com
                  </a>
                  . Data is erased within 30 days (except statutory tax records).
                </li>
                <li>
                  <strong>Registered Consent Managers:</strong> We accept instructions from consent managers registered under Section 6(7) of the DPDP Act.
                </li>
                <li>
                  <strong>GDPR Rights:</strong> Articles 15 to 21 rights (Access, Rectification, Erasure, Portability, Restriction, and Objection).
                </li>
              </ul>
            </section>

            {/* PART B HEADER */}
            <section id="part-b" className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  B
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#0396A6] block">Scope 2</span>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                    Part B — Visitors (Merchant is Controller; We are Processor)
                  </h2>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                This Part applies to end-users and visitors interacting with a merchant’s AI agent deployed via chat widget, WhatsApp, or API.
              </p>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  06
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  What is Processed during Conversations
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li>Full conversation transcripts and audio notes.</li>
                <li>Contact details (name, email, phone) provided during chat.</li>
                <li>WhatsApp numbers or website session identifiers.</li>
                <li>Advertising click identifiers (e.g. Click-to-WhatsApp <code className="text-[11px]">ctwa_clid</code>, and web click IDs) when a visitor arrives from an ad — used for campaign attribution in the merchant dashboard, and optionally for Meta Conversions API when the merchant enables it (see Section 6b).</li>
                <li>Meeting bookings and quotation requests.</li>
                <li>Technical data (IP address, city-level location, browser, device).</li>
                <li><strong>Sensitive data warning:</strong> Do not send health info, credit cards, bank details, Aadhaar, or PAN numbers.</li>
              </ul>
            </section>

            {/* Section 6b — Ad measurement / Meta CAPI (D271) */}
            <section id="section-6b" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  6b
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Ad Measurement &amp; Meta Conversions API
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>Purpose (new).</strong> When a visitor arrives from a Meta / WhatsApp ad (or another ad with a click ID), the merchant may use Frosty to measure which ads led to outcomes such as a qualified lead, a booked meeting, or an accepted quote. That measurement may include sending conversion events to Meta’s Conversions API (CAPI) so the merchant can optimise ads.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>Roles.</strong> The merchant is the controller for end-customer data and is responsible for notices and, where required, consent for ad measurement. Frostrek acts as a processor on the merchant’s instructions. Frostrek does <strong>not</strong> collect a separate consent prompt inside the chat for this purpose.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li><strong>What may be sent (when CAPI is enabled by the merchant and platform gates allow):</strong> event name, event time, a deduplicating event ID, <code className="text-[11px]">action_source=business_messaging</code>, <code className="text-[11px]">messaging_channel=whatsapp</code>, and the Click-to-WhatsApp click ID (<code className="text-[11px]">ctwa_clid</code>). Events without a valid <code className="text-[11px]">ctwa_clid</code>, or outside a 7-day click window, are not sent.</li>
                <li><strong>Defaults:</strong> live CAPI sending is off (merchant toggle + platform control). Merchants can suppress individual contacts from CAPI in the CRM.</li>
                <li><strong>Cross-border:</strong> Meta may process conversion payloads outside India under Meta’s terms.</li>
              </ul>
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs sm:text-sm leading-relaxed">
                Enabling live CAPI for a workspace additionally requires Frostrek’s contractual package (updated DPA warrant and, where applicable, the 30-day notice under DPDP section 12.1a) to be completed. Until then, conversion attempts are recorded only for debugging and are not posted to Meta.
              </div>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  07
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  AI Transparency & Profiling Safeguards
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li>The agent is automated software and will state that it is an AI if asked.</li>
                <li>Enquiry scoring estimates interest for merchant staff prioritization (GDPR Art. 4(4) profiling).</li>
                <li>
                  Automated decisions with legal or significant effects are prohibited without human review (<Link href="/acceptable-use#section-1" className="text-[#0396A6] font-bold underline">Section 1 AUP</Link>).
                </li>
                <li>Quotations drafted by AI are indicative until approved by the merchant.</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  08
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Browser Local Storage & Cookies
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The widget uses local storage solely to persist active conversations across page reloads. We do not use persistent tracking cookies, cross-site tracking technologies, or advertising identifiers. You can clear your browser storage at any time to delete stored local session IDs.
              </p>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  09
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Why Processed & Retention Ceilings
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Whatever retention a merchant selects, Frostrek enforces these maximum retention ceilings:
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-800">
                      <th className="py-2 px-3 font-semibold">Visitor Data Category</th>
                      <th className="py-2 px-3 font-semibold">Maximum Retention Ceiling</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Conversation transcripts</td>
                      <td className="py-2 px-3">24 months from last message</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Voice recordings</td>
                      <td className="py-2 px-3">7 days (audio purged after transcription)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Captured lead contacts</td>
                      <td className="py-2 px-3">24 months or until merchant deletes</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Tax & quote records</td>
                      <td className="py-2 px-3">8 years if statutory; otherwise 24 months</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Technical logs (IP)</td>
                      <td className="py-2 px-3">90 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  10
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Visitor Rights & Merchant Routing
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Because the merchant is your Data Controller, please direct access, correction, and deletion requests to them first. If you cannot reach the merchant, email{' '}
                <a href="mailto:privacy@frostyagent.com" className="text-[#0396A6] font-semibold underline">
                  privacy@frostyagent.com
                </a>{' '}
                with the merchant website URL and conversation date, and we will forward your request to the merchant within 48 hours.
              </p>
            </section>

            {/* PART C HEADER */}
            <section id="part-c" className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  C
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#0396A6] block">Scope 3</span>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                    Part C — General Provisions (Applies to Everyone)
                  </h2>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                This Part sets out cross-cutting governance standards, sub-processors, security architecture, and regulatory compliance.
              </p>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  11
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Data Request Handling & SLAs
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li><strong>Identity verification:</strong> We verify the requestor’s identity before disclosing or erasing data.</li>
                <li><strong>Resolution SLA:</strong> Requests are processed within 30 days of verification (extendable by 30 days for complex inquiries with notice).</li>
                <li><strong>Fee standard:</strong> Data requests are handled free of charge, except where requests are manifestly unfounded or excessive.</li>
              </ul>
            </section>

            {/* Section 12 */}
            <section id="section-12" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  12
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Sub-processors & Third Parties
                </h2>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-800">
                      <th className="py-2 px-3 font-semibold">Sub-processor</th>
                      <th className="py-2 px-3 font-semibold">Role</th>
                      <th className="py-2 px-3 font-semibold">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Supabase</td>
                      <td className="py-2 px-3">Database, auth, file storage</td>
                      <td className="py-2 px-3">India (Mumbai region)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Google</td>
                      <td className="py-2 px-3">AI inference / Calendar</td>
                      <td className="py-2 px-3">Global</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Meta</td>
                      <td className="py-2 px-3">WhatsApp delivery; optional ad measurement / Conversions API when the merchant enables CAPI (Section 6b)</td>
                      <td className="py-2 px-3">Global</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Razorpay</td>
                      <td className="py-2 px-3">Payment processing</td>
                      <td className="py-2 px-3">India</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-900">Resend & Upstash</td>
                      <td className="py-2 px-3">Email & rate limiting</td>
                      <td className="py-2 px-3">Global</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 13 */}
            <section id="section-13" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  13
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Data Residency & Transfers
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Primary merchant databases and vector embeddings reside in India (Mumbai region). Where cross-border processing occurs for global model inference or WhatsApp routing, transfers are executed under Standard Contractual Clauses (SCCs) and DPDP cross-border whitelist mechanisms.
              </p>
            </section>

            {/* Section 14 */}
            <section id="section-14" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  14
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Security Architecture & RLS
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li><strong>Encryption:</strong> TLS 1.2+ in transit, AES-256 at rest.</li>
                <li><strong>Multi-tenant isolation:</strong> Enforced via PostgreSQL Row-Level Security (RLS) policies preventing cross-tenant leakage.</li>
                <li><strong>Access controls:</strong> Mandatory MFA for staff and least-privilege role boundaries.</li>
              </ul>
            </section>

            {/* Section 15 */}
            <section id="section-15" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  15
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Breach Notification Timelines
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li><strong>DPDP Act (India):</strong> Notification to Data Protection Board and affected users without delay under Rule 7(a).</li>
                <li><strong>GDPR (EU/UK):</strong> Supervisory authority notice within 72 hours under Article 33.</li>
                <li><strong>CERT-In (India):</strong> Cybersecurity incidents reported within 6 hours under Section 70B(6) of IT Act 2000.</li>
              </ul>
            </section>

            {/* Section 16 */}
            <section id="section-16" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  16
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  United States — California (CCPA)
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Under the California Consumer Privacy Act (CCPA) as amended by CPRA, Frostrek operates as a <strong>Service Provider</strong> (Cal. Civ. Code § 1798.140(ag)). We do not sell or share personal information and do not retain consumer data across unrelated business accounts.
              </p>
            </section>

            {/* Section 17 */}
            <section id="section-17" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  17
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Other International Countries
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We respect national data protection laws including the UK Data Protection Act 2018, Singapore Personal Data Protection Act (PDPA), and UAE Federal Decree-Law No. 45/2021.
              </p>
            </section>

            {/* Section 18 */}
            <section id="section-18" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  18
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Children & Minor Data Protection
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The platform is designed for businesses. We do not knowingly collect personal data from children under 18 without verifiable parental consent under Section 9 of the DPDP Act. If we learn of unauthorized processing of a child’s data, we promptly purge it.
              </p>
            </section>

            {/* Section 19: Grievance Desk Bento (WHITE THEME) */}
            <section id="section-19" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 text-[#0A1A2F] space-y-5 scroll-mt-2 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  19
                </span>
                <div>
                  <h2 className="text-xl font-bold text-[#0A1A2F]">Grievance Officer & Contact Details</h2>
                  <p className="text-xs text-slate-500">Statutory officer under Section 13 of the Digital Personal Data Protection Act, 2023</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Grievance Officer</span>
                  <strong className="text-sm text-slate-900 block">Anurag Tripathi</strong>
                  <a href="mailto:grievance@frostyagent.com" className="text-[#0396A6] hover:underline font-mono block font-medium">
                    grievance@frostyagent.com
                  </a>
                </div>
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Registered Office</span>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    Frostrek LLP · LLPIN AAW-5223<br />
                    4th Floor, 422, Success Tower, Golf Course Ext Rd, Sector 62, Gurugram, Haryana 122002, India.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
                <strong>Resolution SLA:</strong> We acknowledge grievances within 48 hours and resolve them within 30 days. You may also lodge complaints directly with the Data Protection Board of India.
              </p>
            </section>

            {/* Section 20 */}
            <section id="section-20" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 scroll-mt-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#0396A6]/10 text-[#0396A6] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  20
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#0A1A2F]">
                  Governing Law & Severability
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                This Privacy Policy is governed by the laws of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in Gurugram, Haryana, India. If any provision is held invalid by a court or authority, the remaining provisions remain in full force and effect.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <FooterSection />
    </div>
  );
}
