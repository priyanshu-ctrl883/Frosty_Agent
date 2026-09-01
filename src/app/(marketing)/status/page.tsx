import React from 'react';
import Link from 'next/link';
import BrandLogo from '../BrandLogo';

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] text-stone-700 font-sans selection:bg-[#0396A6]/20">
      <nav className="w-full p-6 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-50">
        <Link href="/">
          <BrandLogo />
        </Link>
        <Link href="/" className="text-sm font-bold text-stone-600 hover:text-stone-900 transition-colors">
          Back to Home
        </Link>
      </nav>

      <section className="relative w-full py-24 px-6 flex flex-col items-center justify-center border-b border-stone-200 overflow-hidden bg-white/50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            All Systems Operational
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 tracking-tight mb-4">
            System Status
          </h1>
          <p className="text-stone-600 text-lg">
            Live health telemetry and availability across all global Frosty regions and edge inference nodes.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto py-16 px-6 space-y-6">
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-900 text-lg">Web Chat Widget Nodes</h3>
            <p className="text-sm text-stone-500">Global edge CDN response latency: 18ms</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">100.0% Uptime</span>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-900 text-lg">WhatsApp Cloud API Gateway</h3>
            <p className="text-sm text-stone-500">Meta Graph Webhook processing pipeline</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">99.99% Uptime</span>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-900 text-lg">Gemini Neural Routing Cluster</h3>
            <p className="text-sm text-stone-500">Model inference and RAG vector search</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">100.0% Uptime</span>
        </div>
      </section>
    </main>
  );
}
