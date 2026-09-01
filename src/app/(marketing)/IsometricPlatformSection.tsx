'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Database, Users, Shield, Zap, Sparkles } from 'lucide-react';

interface TileData {
  icon: React.ReactNode;
  label: string;
  desc: string;
  x: number;
  y: number;
}

const TILES: TileData[] = [
  {
    label: 'AI Core',
    desc: 'Proprietary reasoning engine built for enterprise logic, multi-step orchestration, and secure execution.',
    x: 84, y: 22,
    icon: <Cpu size={26} strokeWidth={1.5} className="text-cyan-400" />,
  },
  {
    label: 'Knowledge Layer (RAG)',
    desc: 'Vector-embedded company data. Upload PDFs or crawl your site so answers stay 100% grounded in your content.',
    x: 6, y: 55,
    icon: <Database size={26} strokeWidth={1.5} className="text-blue-400" />,
  },
  {
    label: 'CRM & Tech Stack Sync',
    desc: 'Deep integrations. Reads from and writes directly to your database, calendar, email, and live inbox.',
    x: 90, y: 78,
    icon: <Users size={26} strokeWidth={1.5} className="text-emerald-400" />,
  },
];

export default function IsometricPlatformSection() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section className="relative py-24 overflow-hidden border-t border-white/5" style={{ background: 'rgba(7, 11, 22, 0.9)' }}>
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4 text-xs font-bold tracking-widest text-blue-400 uppercase">
            <Cpu className="w-3.5 h-3.5" />
            UNDER THE HOOD · ARCHITECTURE
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0396A6] via-[#0396A6] to-[#0396A6]">Enterprise AI Performance</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Every request flows through a purpose-built AI architecture that crawls, understands, retrieves, and reasons before generating accurate responses.
          </p>
        </div>

        {/* Feature Grid Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Tile 1: RAG Engine */}
          <div 
            className="md:col-span-2 rounded-3xl p-8 bg-slate-950/70 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 relative overflow-hidden backdrop-blur-xl group"
            onMouseEnter={() => setHoveredIdx(0)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                <Database className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Neural RAG Knowledge Engine</h3>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">
                We feed Frosty your PDFs, documents, and crawl up to 200 pages of your website. It chunks, embeds, and indexes them into a semantic vector brain — so answers are grounded in your content, never generic or hallucinated.
              </p>
            </div>
          </div>

          {/* Tile 2: Multi-Model Intelligence */}
          <div 
            className="rounded-3xl p-8 bg-slate-950/70 border border-white/10 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden backdrop-blur-xl group"
            onMouseEnter={() => setHoveredIdx(1)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Multi-Model Intelligence</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Powered by frontier Gemini 3.5 & 2.5 models under the hood. Per-tenant model selection allows you to choose your ideal balance of intelligence, speed, and token cost.
              </p>
            </div>
          </div>

          {/* Tile 3: Tool Execution */}
          <div 
            className="rounded-3xl p-8 bg-slate-950/70 border border-white/10 hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden backdrop-blur-xl group"
            onMouseEnter={() => setHoveredIdx(2)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Acts Through Your Tools</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Calendar for auto-scheduling, Gmail for instant follow-up emails, WhatsApp for chat, and direct webhook CRM synchronization.
              </p>
            </div>
          </div>

          {/* Tile 4: Security & Compliance */}
          <div 
            className="md:col-span-2 rounded-3xl p-8 bg-slate-950/70 border border-white/10 hover:border-slate-500/30 transition-all duration-300 relative overflow-hidden backdrop-blur-xl group"
            onMouseEnter={() => setHoveredIdx(3)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-slate-500/10 border border-slate-500/30 flex items-center justify-center text-slate-400 mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Secure & ISO Certified Architecture</h3>
                <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">
                  ISO 27001 & ISO 9001 certified security standards. Complete tenant data isolation — your company content trains only your own agent and is never shared.
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                  ✓ ISO 27001 Security
                </div>
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                  ✓ GDPR & Data Isolation
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
