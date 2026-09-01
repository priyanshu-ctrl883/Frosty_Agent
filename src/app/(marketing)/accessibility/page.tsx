'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, ShieldCheck, CheckCircle2 } from 'lucide-react';
import GlassNavbar from '@/components/GlassNavbar';
import FooterSection from '../FooterSection';

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-[#070E1A] text-slate-100 font-sans selection:bg-[#0092A2]/30">
      <GlassNavbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#0092A2] hover:text-[#2DD4BF] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#0092A2]/15 border border-[#0092A2]/30 text-[#0092A2] flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Accessibility Statement
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Frostrek AI · Committed to digital accessibility for all users
            </p>
          </div>
        </div>

        <div className="mt-8 prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-6">
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">Our Commitment</h2>
            <p>
              Frostrek AI is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards (WCAG 2.1 Level AA).
            </p>
          </section>

          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">Accessibility Standards & Features</h2>
            <ul className="space-y-2 text-slate-300 mt-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0092A2] shrink-0 mt-0.5" />
                <span><strong>High-contrast text & palettes:</strong> Compliant color contrast ratios across dark and light workspaces.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0092A2] shrink-0 mt-0.5" />
                <span><strong>Keyboard navigation:</strong> Full focus ring visibility, logical tab indexing, and keyboard accessibility for modal dialogs and dropdown menus.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0092A2] shrink-0 mt-0.5" />
                <span><strong>Screen-reader compatibility:</strong> Semantic HTML5 elements, ARIA live regions, and descriptive image alt tags.</span>
              </li>
            </ul>
          </section>

          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">Feedback & Assistance</h2>
            <p>
              We welcome your feedback on the accessibility of the Frostrek AI platform. If you encounter any barriers, please let us know:
            </p>
            <p className="mt-3 text-xs text-slate-300">
              Email:{' '}
              <a href="mailto:sales@frostrek.com" className="text-[#0092A2] underline font-medium">
                sales@frostrek.com
              </a>{' '}
              · Frostrek AI, Gurugram.
            </p>
          </section>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
