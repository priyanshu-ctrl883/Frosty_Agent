// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Calendar, FileText, UserCheck, Headset, Sparkles, Check, ArrowRight, Bot, Zap } from 'lucide-react';

const ACTS = [
  {
    id: 'qualifies',
    icon: MessageSquare,
    title: "Answers & qualifies",
    desc: "Understands the question and asks the right follow-up queries.",
    question: "Do you work with clinics like ours?",
    via: "Website Widget",
    outcome: "Intent understood · Tagged WARM",
    accent: "#0396A6",
    glow: "rgba(3, 150, 166, 0.2)"
  },
  {
    id: 'meetings',
    icon: Calendar,
    title: "Books meetings",
    desc: "Drops a slot straight onto your team's Google Calendar.",
    question: "Can someone walk me through it this week?",
    via: "WhatsApp",
    outcome: "Meeting booked · Thu 4:30 PM",
    accent: "#0396A6",
    glow: "rgba(99, 90, 128, 0.2)"
  },
  {
    id: 'proposals',
    icon: FileText,
    title: "Sends proposals & quotes",
    desc: "Shares the right document & pricing breakdown at the exact right moment.",
    question: "Send me pricing for 50 seats.",
    via: "Website Widget",
    outcome: "Quotation PDF #218 sent instantly",
    accent: "#F59E0B",
    glow: "rgba(245, 158, 11, 0.2)"
  },
  {
    id: 'leads',
    icon: UserCheck,
    title: "Captures the lead",
    desc: "Pulls contact info, email, and intent from a natural conversation.",
    question: "I'm interested - here's my phone number.",
    via: "WhatsApp",
    outcome: "Lead saved · Synced to Dashboard",
    accent: "#10B981",
    glow: "rgba(16, 185, 129, 0.2)"
  },
  {
    id: 'handoff',
    icon: Headset,
    title: "Hands off to a human",
    desc: "Escalates to your admin team with full chat transcript & history.",
    question: "I'd rather speak to a real person.",
    via: "Website Widget",
    outcome: "Live support handoff initiated",
    accent: "#EC4899",
    glow: "rgba(236, 72, 153, 0.2)"
  },
];

export default function ActsDiagramSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeAct = ACTS[activeIdx];

  return (
    <section className="relative py-24 overflow-hidden" style={{ background: 'rgba(5, 9, 20, 0.8)' }}>
      {/* Background Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[140px] pointer-events-none transition-colors duration-700 opacity-20"
        style={{ background: activeAct.accent }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 text-xs font-bold tracking-widest text-cyan-400 uppercase">
            <Zap className="w-3.5 h-3.5" />
            INTERACT · THINK · EXECUTE · CONVERT
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Anatomy of an <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0396A6] via-[#0396A6] to-[#0396A6]">Autonomous Action</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Watch how Frosty routes logic through AI models, triggers your tech stack, and puts lead capture on autopilot. Select an action below to see live execution flow.
          </p>
        </div>

        {/* Interactive Diagram Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Live Inquiry Simulation */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Inquiry Card */}
            <div className="rounded-3xl p-6 bg-slate-950/80 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold">Incoming Inquiry</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {activeAct.via}
                </span>
              </div>
              <p className="text-lg font-medium text-white mb-6 italic">
                &ldquo;{activeAct.question}&rdquo;
              </p>
              
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="text-white font-semibold">Frosty Reasoner</div>
                  <div className="text-slate-400">Evaluated in 0.2s</div>
                </div>
              </div>
            </div>

            {/* Outcome Card */}
            <div className="rounded-3xl p-6 bg-[#121212]/60 border border-white/10 relative overflow-hidden backdrop-blur-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-3 h-3 rounded-full animate-ping"
                  style={{ background: activeAct.accent }}
                />
                <span className="text-xs font-bold tracking-wider uppercase text-slate-300">Automated Execution</span>
              </div>
              <p className="text-base font-bold text-white mb-2">
                {activeAct.outcome}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {activeAct.desc}
              </p>
            </div>

          </div>

          {/* Right Column: 5 Action Selector Buttons */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {ACTS.map((act, idx) => {
              const IconComp = act.icon;
              const isSelected = idx === activeIdx;

              return (
                <button
                  key={act.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`w-full text-left p-5 rounded-2xl transition-all duration-300 flex items-center justify-between border ${
                    isSelected 
                      ? 'bg-[#121212]/90 shadow-lg translate-x-1.5' 
                      : 'bg-slate-950/40 border-white/5 hover:border-white/15 hover:bg-[#121212]/40'
                  }`}
                  style={{
                    borderColor: isSelected ? act.accent : undefined,
                    boxShadow: isSelected ? `0 10px 30px -10px ${act.glow}` : undefined
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300"
                      style={{ 
                        background: isSelected ? `${act.accent}25` : 'rgba(255,255,255,0.05)',
                        color: isSelected ? act.accent : '#94a3b8',
                        border: isSelected ? `1px solid ${act.accent}50` : '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white mb-0.5">{act.title}</h4>
                      <p className="text-xs text-slate-400 hidden sm:block">{act.desc}</p>
                    </div>
                  </div>

                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isSelected ? 'bg-white/10 text-white' : 'text-slate-600'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
