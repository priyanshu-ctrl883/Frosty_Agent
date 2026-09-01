'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Cookie, ShieldCheck, Lock } from 'lucide-react';
import GlassNavbar from '@/components/GlassNavbar';
import FooterSection from '../FooterSection';

export default function CookiesPolicyPage() {
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
            <Cookie className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Cookie Policy
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Last updated: {new Date().getFullYear()} · Frostrek AI
            </p>
          </div>
        </div>

        <div className="mt-8 prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-6">
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">1. What Are Cookies?</h2>
            <p>
              Cookies and local storage are small data files stored on your device that enable our platform to securely authenticate sessions, remember merchant preferences, and ensure optimal AI agent performance across visits.
            </p>
          </section>

          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">2. How We Use Cookies</h2>
            <p>We use essential and functional cookies solely to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-slate-300">
              <li>Maintain secure merchant login sessions with token encryption.</li>
              <li>Preserve conversational widget context during live visitor sessions.</li>
              <li>Prevent cross-site request forgery and authenticate API interactions.</li>
            </ul>
          </section>

          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">3. Managing Preferences</h2>
            <p>
              You can control or clear cookies via your browser settings at any time. Disabling essential authentication cookies will prevent access to the merchant workspace.
            </p>
            <p className="mt-4 text-xs text-slate-400">
              For any questions regarding our cookie practices, contact us at{' '}
              <a href="mailto:sales@frostrek.com" className="text-[#0092A2] underline">
                sales@frostrek.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
