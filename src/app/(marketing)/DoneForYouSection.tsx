// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldCheck, Sparkles, ArrowRight, ArrowLeft, Check, Globe, Zap } from 'lucide-react';

const STEPS_DATA = [
  {
    stepNumber: "01",
    stepLabel: "Step 1 of 3",
    title: "Tell us about your business",
    description: "A short onboarding session to understand your services, products, pricing, FAQs, and brand tone.",
    items: [
      "Your services & offerings",
      "Pricing & common queries",
      "Tone, rules & brand voice",
      "Preferred messaging platforms"
    ],
    time: "20-30 MIN",
  },
  {
    stepNumber: "02",
    stepLabel: "Step 2 of 3",
    title: "We customize and train Frosty",
    description: "Built around your content, tested against real customer questions. We tune AI guardrails and conversation flow to match your exact standards.",
    items: [
      "Custom knowledge base ingestion",
      "Rigorous QA & test scenarios",
      "Guardrails & fallback protocols",
      "Brand voice refinement"
    ],
    time: "48-72 HOURS",
  },
  {
    stepNumber: "03",
    stepLabel: "Step 3 of 3",
    title: "We deploy – you convert",
    description: "We launch Frosty on your website and WhatsApp and keep tuning it while you focus on closing deals. Continuous learning from real interactions.",
    items: [
      "One-click website widget setup",
      "Direct WhatsApp Business integration",
      "Real-time analytics & transcript monitoring",
      "Continuous optimization & tuning"
    ],
    time: "GO LIVE FAST",
  }
];

export default function DoneForYouSection() {
  const [currentStep, setCurrentStep] = useState(0);
  const activeStep = STEPS_DATA[currentStep];

  return (
    <section id="setup" className="relative py-24 overflow-hidden border-t border-white/5" style={{ background: 'rgba(5, 8, 18, 0.95)' }}>
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4 text-xs font-bold tracking-widest text-emerald-400 uppercase">
            <Clock className="w-3.5 h-3.5" />
            UP AND RUNNING IN MINUTES
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Done-for-you <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">AI Deployment</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Three simple steps. No engineers required. Your custom AI workforce live in under 5 minutes.
          </p>
        </div>

        {/* Step Navigation Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#16305A]/80 border border-white/10 gap-2">
            {STEPS_DATA.map((s, idx) => (
              <button
                key={s.stepNumber}
                onClick={() => setCurrentStep(idx)}
                className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                  currentStep === idx 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{s.stepNumber}.</span>
                <span>{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step Detail Card */}
        <div className="max-w-4xl mx-auto rounded-3xl p-8 md:p-12 bg-[#020617]/90 border border-[#16305A]/50 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-8 border-b border-white/10">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase mb-2 block">
                {activeStep.stepLabel}
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white">
                {activeStep.title}
              </h3>
            </div>
            
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold shrink-0">
              ⏱ {activeStep.time}
            </div>
          </div>

          <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-8">
            {activeStep.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {activeStep.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 text-sm text-slate-200">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Previous Step
            </button>

            <button
              onClick={() => setCurrentStep(prev => Math.min(STEPS_DATA.length - 1, prev + 1))}
              disabled={currentStep === STEPS_DATA.length - 1}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
