'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, MessageCircle, Mail, Check } from 'lucide-react';

/* ─── Sparkle Star SVG Logo ────────────────────────────────────── */
function FrostySparkleIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Primary Teal Star */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full text-[#0396A6] fill-current drop-shadow-[0_2px_8px_rgba(3,150,166,0.35)]"
      >
        <path d="M 50 8 C 50 35 35 50 8 50 C 35 50 50 65 50 92 C 50 65 65 50 92 50 C 65 50 50 35 50 8 Z" />
      </svg>
      {/* Secondary Orange Star */}
      <svg
        viewBox="0 0 100 100"
        className="w-[45%] h-[45%] absolute -bottom-0.5 -right-0.5 text-[#F59E0B] fill-current drop-shadow-[0_1px_4px_rgba(245,158,11,0.4)]"
      >
        <path d="M 50 8 C 50 35 35 50 8 50 C 35 50 50 65 50 92 C 50 65 65 50 92 50 C 65 50 50 35 50 8 Z" />
      </svg>
    </div>
  );
}

export default function UnifiedChannelsSection() {
  const [step, setStep] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    let isAlive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>(r => { 
      const t = setTimeout(r, ms);
      timers.push(t);
    });

    const runSequence = async () => {
      while (isAlive) {
        setStep(0);
        await wait(600);
        
        // Website Flow
        setStep(1);
        await wait(600);
        setStep(2);
        await wait(650);
        setStep(3);
        await wait(700);
        setStep(4);
        await wait(450);
        setStep(5);
        await wait(800);

        // WA Flow
        setStep(6);
        await wait(650);
        setStep(7);
        await wait(700);
        setStep(8);
        await wait(450);
        setStep(9);
        await wait(500);

        // Unified Profile Update
        setStep(10);
        await wait(900);
        
        // Unified Conversation Update
        setStep(11);
        await wait(900);
        setStep(12);
        await wait(2500);
      }
    };

    runSequence();

    return () => {
      isAlive = false;
      timers.forEach(clearTimeout);
    };
  }, [inView]);

  return (
    <section ref={containerRef} className="relative w-full pt-1 pb-2 lg:pt-1 lg:pb-3 overflow-hidden z-10 flex flex-col items-center bg-transparent select-none">
      {/* MAIN UNIFIED VISUALIZATION CANVAS (515px Height 1:1 with SVG viewBox) */}
      <div className="relative w-full max-w-[1280px] mx-auto h-[515px] hidden lg:block z-10">
        
        {/* ── 0. TOP-LEFT HEADING & DESCRIPTION ── */}
        <div className="absolute left-[55px] top-[10px] w-[310px] z-20 text-left">
          {/* Eyebrow Badge */}
          <motion.div 
             initial={{ opacity: 0, y: 15 }}
             animate={inView ? { opacity: 1, y: 0 } : {}}
             className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#0396A6]/30 bg-[#0396A6]/10 text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#0396A6] mb-2.5 shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 text-[#0396A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            OMNI-CHANNEL. UNIFIED AGENT.
          </motion.div>
          
          {/* Headline */}
          <motion.h2 
             initial={{ opacity: 0, y: 15 }}
             animate={inView ? { opacity: 1, y: 0 } : {}}
             transition={{ delay: 0.1 }}
             className="text-2xl md:text-3xl lg:text-[32px] font-serif font-bold text-[#0F172A] leading-[1.15] tracking-tight mb-2"
          >
            Website. WhatsApp. Email.<br />
            <span className="text-[#0396A6] font-bold" style={{ color: '#0396A6' }}>Unified.</span>
          </motion.h2>
          
          {/* Subtitle */}
          <motion.p 
             initial={{ opacity: 0, y: 15 }}
             animate={inView ? { opacity: 1, y: 0 } : {}}
             transition={{ delay: 0.2 }}
             className="text-xs sm:text-[12.5px] text-slate-600 leading-relaxed max-w-sm mb-3"
          >
            Different channels. One agent. One memory.<br />
            One conversation that never breaks.
          </motion.p>
        </div>

        {/* ── 1. LEFT FEATURES LIST (Styled with horizontal dividers matching ss2) ── */}
        <div className="absolute left-[55px] top-[210px] w-[310px] z-20">
           <div className="divide-y divide-slate-200/70 border-t border-slate-200/70">
              {/* Feature 1 */}
              <div className="flex gap-3 items-start py-2.5 group">
                 <div className="shrink-0 text-[#0396A6] mt-0.5">
                    <svg className="w-4 h-4 text-[#0396A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                       <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                       <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                       <line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                 </div>
                 <div>
                    <h5 className="text-[12px] font-bold text-slate-900 leading-tight">All channels connected</h5>
                    <p className="text-[10px] text-slate-500 leading-snug mt-0.5">Website, WhatsApp, Email and custom portals.</p>
                 </div>
              </div>
              
              {/* Feature 2 */}
              <div className="flex gap-3 items-start py-2.5 group">
                 <div className="shrink-0 text-[#0396A6] mt-0.5">
                    <svg className="w-4 h-4 text-[#0396A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                       <circle cx="12" cy="12" r="10"/>
                       <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                 </div>
                 <div>
                    <h5 className="text-[12px] font-bold text-slate-900 leading-tight">One memory</h5>
                    <p className="text-[10px] text-slate-500 leading-snug mt-0.5">Every interaction. Every detail. Always in context.</p>
                 </div>
              </div>
              
              {/* Feature 3 */}
              <div className="flex gap-3 items-start py-2.5 group">
                 <div className="shrink-0 text-[#0396A6] mt-0.5">
                    <svg className="w-4 h-4 text-[#0396A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                       <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                 </div>
                 <div>
                    <h5 className="text-[12px] font-bold text-slate-900 leading-tight">Instant sync</h5>
                    <p className="text-[10px] text-slate-500 leading-snug mt-0.5">Real-time updates across every channel.</p>
                 </div>
              </div>
              
              {/* Feature 4 */}
              <div className="flex gap-3 items-start py-2.5 group">
                 <div className="shrink-0 text-[#0396A6] mt-0.5">
                    <svg className="w-4 h-4 text-[#0396A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                       <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                       <circle cx="12" cy="7" r="4"/>
                    </svg>
                 </div>
                 <div>
                    <h5 className="text-[12px] font-bold text-slate-900 leading-tight">One customer view</h5>
                    <p className="text-[10px] text-slate-500 leading-snug mt-0.5">Unified profile. Complete conversation history.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* ── 2. SVG DOTTED CONNECTION LINES & DATA PARTICLES (1:1 with 1280x515) ── */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1280 515" preserveAspectRatio="none">
           {/* Top 3 Incoming Lines converging cleanly into center top at X=670 */}
           {/* Website -> Convergence */}
           <motion.path 
              d="M 485,175 L 485,202 Q 485,216 500,216 L 655,216 Q 670,216 670,230 L 670,275" 
              fill="none" 
              stroke="#0396A6" 
              strokeWidth="1.5" 
              strokeDasharray="3 3.5" 
              className="opacity-70" 
           />
           {/* WhatsApp -> Convergence (Straight Down through X=670) */}
           <motion.path 
              d="M 670,175 L 670,275" 
              fill="none" 
              stroke="#10B981" 
              strokeWidth="1.5" 
              strokeDasharray="3 3.5" 
              className="opacity-70" 
           />
           {/* Email -> Convergence */}
           <motion.path 
              d="M 855,175 L 855,202 Q 855,216 840,216 L 685,216 Q 670,216 670,230 L 670,275" 
              fill="none" 
              stroke="#EA4335" 
              strokeWidth="1.5" 
              strokeDasharray="3 3.5" 
              className="opacity-70" 
           />

           {/* Convergence Intersection Dot */}
           <circle cx="670" cy="216" r="3" fill="#10B981" />

           {/* Central Circle to 4 Radial Badges */}
           {/* Top-Left: Context stitched */}
           <path d="M 640,320 L 525,306" fill="none" stroke="#0396A6" strokeWidth="1.5" strokeDasharray="3 3.5" className="opacity-70" />
           <circle cx="575" cy="311.5" r="2.5" fill="#0396A6" />

           {/* Bottom-Left: Intent recognised */}
           <path d="M 640,360 L 525,376" fill="none" stroke="#0396A6" strokeWidth="1.5" strokeDasharray="3 3.5" className="opacity-70" />
           <circle cx="575" cy="369.5" r="2.5" fill="#0396A6" />

           {/* Top-Right: History unified */}
           <path d="M 700,320 L 805,306" fill="none" stroke="#0396A6" strokeWidth="1.5" strokeDasharray="3 3.5" className="opacity-70" />
           <circle cx="765" cy="311.5" r="2.5" fill="#0396A6" />

           {/* Bottom-Right: Memory updated */}
           <path d="M 700,360 L 805,376" fill="none" stroke="#0396A6" strokeWidth="1.5" strokeDasharray="3 3.5" className="opacity-70" />
           <circle cx="765" cy="369.5" r="2.5" fill="#0396A6" />

           {/* Outgoing Vertical Dotted Line: Frosty (405) -> Unified Conversation (423) */}
           <motion.path 
              d="M 670,405 L 670,423" 
              fill="none" 
              stroke="#0396A6" 
              strokeWidth="1.5" 
              strokeDasharray="3 3.5" 
              className="opacity-60" 
           />

           {/* ── Animated Data Packets (Faster durations) ── */}
           {/* Website Packet */}
           <motion.circle cx="-100" cy="-100" r="3.5" fill="#0396A6" opacity="0" filter="drop-shadow(0 0 4px #0396A6)">
              <animateMotion dur="0.7s" path="M 485,175 L 485,202 Q 485,216 500,216 L 655,216 Q 670,216 670,230 L 670,275" begin={step === 4 ? "0s" : "indefinite"} fill="freeze" />
              <animate attributeName="opacity" values="0;1;0" dur="0.7s" begin={step === 4 ? "0s" : "indefinite"} />
           </motion.circle>

           {/* WhatsApp Packet */}
           <motion.circle cx="-100" cy="-100" r="3.5" fill="#10B981" opacity="0" filter="drop-shadow(0 0 4px #10B981)">
              <animateMotion dur="0.6s" path="M 670,175 L 670,275" begin={step === 8 ? "0s" : "indefinite"} fill="freeze" />
              <animate attributeName="opacity" values="0;1;0" dur="0.6s" begin={step === 8 ? "0s" : "indefinite"} />
           </motion.circle>

           {/* Core to Conversation Packet */}
           <motion.circle cx="-100" cy="-100" r="4" fill="#0396A6" opacity="0" filter="drop-shadow(0 0 4px #0396A6)">
              <animateMotion dur="0.4s" path="M 670,405 L 670,423" begin={step === 9 ? "0s" : "indefinite"} fill="freeze" />
              <animate attributeName="opacity" values="0;1;0" dur="0.4s" begin={step === 9 ? "0s" : "indefinite"} />
           </motion.circle>
        </svg>

        {/* ── 3. TOP 1: WEBSITE CARD ── */}
        <div className="absolute left-[400px] top-[15px] z-20">
           <motion.div 
              className="w-[170px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.04)] overflow-hidden"
              whileHover={{ scale: 1.02, boxShadow: '0 16px 36px rgba(3, 150, 166,0.12)' }}
           >
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-1.5">
                    <img loading="lazy" decoding="async" src="/web.svg" alt="Website" className="w-4 h-4 object-contain shrink-0" />
                    <span className="text-slate-900 text-[11.5px] font-bold">Website</span>
                 </div>
                 <div className="flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      {step >= 1 && step <= 4 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0396A6] opacity-75"></span>}
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0396A6]"></span>
                    </span>
                    <span className="text-[9px] text-[#0396A6] font-semibold">Live</span>
                 </div>
              </div>
              
              <div className="p-2.5 min-h-[125px] flex flex-col gap-1.5 overflow-hidden relative">
                 {step >= 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-0">
                       <span className="text-[9.5px] text-slate-500 font-medium">New visit on Pricing Page</span>
                       <div className="text-[8.5px] text-slate-400">10:24 AM • Bengaluru, India</div>
                    </motion.div>
                 )}
                 
                 <AnimatePresence>
                   {step >= 2 && (
                      <motion.div key="web-msg1" initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex flex-col max-w-[95%] self-end items-end relative mt-0.5">
                         <div className="px-2.5 py-1 text-[10px] bg-slate-100 text-slate-900 rounded-xl rounded-tr-xs border border-slate-200">Hi, looking for 100 units pricing.</div>
                         <span className="text-[8px] text-slate-400 mt-0.5">10:24 AM</span>
                      </motion.div>
                   )}
                   {step >= 4 && (
                      <motion.div key="web-msg2" initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex flex-col max-w-[95%] self-start items-start relative mt-0.5">
                         <div className="px-2.5 py-1 text-[10px] bg-[#0396A6] text-white rounded-xl rounded-tl-xs shadow-2xs flex items-center gap-1">
                            <span>I can help! We have bulk discounts.</span>
                         </div>
                      </motion.div>
                   )}
                 </AnimatePresence>

                 {step === 3 && (
                    <motion.div key="web-typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="self-start mt-0.5 px-2 py-0.5 flex items-center gap-1 text-[9.5px] text-[#0396A6] font-medium">
                       Typing...
                       <div className="flex gap-0.5 ml-0.5">
                          {[0,1,2].map(i => <motion.div key={i} animate={{ opacity: [0.3,1,0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i*0.2 }} className="w-1 h-1 rounded-full bg-[#0396A6]" />)}
                       </div>
                    </motion.div>
                 )}
              </div>
           </motion.div>
        </div>

        {/* ── 4. TOP 2: WHATSAPP CARD ── */}
        <div className="absolute left-[585px] top-[15px] z-20">
           <motion.div 
              className="w-[170px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.04)] overflow-hidden"
              whileHover={{ scale: 1.02, boxShadow: '0 16px 36px rgba(37,211,102,0.12)' }}
           >
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-1.5">
                    <img loading="lazy" decoding="async" src="/whatsapp.png" alt="WhatsApp" className="w-4 h-4 object-contain shrink-0" />
                    <span className="text-slate-900 text-[11.5px] font-bold">WhatsApp</span>
                 </div>
                 <div className="flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      {step >= 6 && step <= 8 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>}
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10B981]"></span>
                    </span>
                    <span className="text-[9px] text-[#10B981] font-semibold">Live</span>
                 </div>
              </div>
              
              <div className="p-2.5 min-h-[125px] flex flex-col gap-1.5 overflow-hidden relative">
                 {step >= 5 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-0">
                       <span className="text-[9.5px] text-slate-500 font-medium">New message</span>
                       <div className="text-[8.5px] text-slate-400">10:25 AM</div>
                    </motion.div>
                 )}
                 <AnimatePresence>
                   {step >= 6 && (
                      <motion.div key="wa-msg1" initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex flex-col max-w-[95%] self-start items-start relative mt-0">
                         <div className="px-2.5 py-1 text-[10px] bg-slate-100 text-slate-900 rounded-lg rounded-tl-none border border-slate-200">Any discounts for bulk orders?</div>
                         <span className="text-[8px] text-slate-400 mt-0.5 self-end">10:25 AM</span>
                      </motion.div>
                   )}
                   {step >= 8 && (
                      <motion.div key="wa-msg2" initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex flex-col max-w-[95%] self-end items-end relative mt-0.5">
                         <div className="px-2.5 py-1 text-[10px] bg-[#16A34A] text-white rounded-lg rounded-tr-none shadow-2xs flex flex-col gap-0.5">
                            <span>Yes! Here's a quote based on our website chat.</span>
                         </div>
                      </motion.div>
                   )}
                 </AnimatePresence>
                 {step === 7 && (
                    <motion.div key="wa-typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="self-start mt-0.5 px-2 py-0.5 flex items-center gap-1 text-[9.5px] text-[#16A34A] font-medium">
                       Replying...
                       <div className="flex gap-0.5 ml-0.5">
                          {[0,1,2].map(i => <motion.div key={i} animate={{ opacity: [0.3,1,0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i*0.2 }} className="w-1 h-1 rounded-full bg-[#16A34A]" />)}
                       </div>
                    </motion.div>
                 )}
              </div>
           </motion.div>
        </div>

        {/* ── 5. TOP 3: EMAIL CARD ── */}
        <div className="absolute left-[770px] top-[15px] z-20">
           <motion.div 
              className="w-[170px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.04)] overflow-hidden"
              whileHover={{ scale: 1.02, boxShadow: '0 16px 36px rgba(234,67,53,0.15)' }}
           >
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-1.5">
                    <img loading="lazy" decoding="async" src="/gmail.png" alt="Email" className="w-4 h-4 object-contain shrink-0" />
                    <span className="text-slate-900 text-[11.5px] font-bold">Email</span>
                 </div>
                 <div className="flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#EA4335]"></span>
                    </span>
                    <span className="text-[9px] text-[#EA4335] font-semibold">Live</span>
                 </div>
              </div>
              
              <div className="p-2.5 min-h-[125px] flex flex-col gap-1.5 relative overflow-hidden">
                 <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1">
                     <img loading="lazy" decoding="async" className="w-5 h-5 rounded-full shrink-0 object-cover border border-slate-200" src="https://i.pravatar.cc/150?img=68" alt="James Carter" />
                     <div className="flex flex-col min-w-0">
                         <span className="text-slate-900 text-[9.5px] font-semibold leading-tight truncate">James Carter</span>
                         <span className="text-[8px] text-slate-500 truncate">james.carter@email.com</span>
                     </div>
                 </div>
                 
                 <AnimatePresence>
                   {step >= 1 && (
                      <motion.div key="email-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-0.5 mt-0.5">
                         <div className="text-[9.5px] text-slate-900 font-bold">Bulk order timeline?</div>
                         <div className="text-[8.5px] text-slate-600 leading-relaxed">
                            Hi team, can I get timelines for 100 units?<br/>
                            Thanks, James
                         </div>
                      </motion.div>
                   )}
                 </AnimatePresence>
              </div>
           </motion.div>
        </div>

        {/* ── 6. CENTRAL FROSTY CORE ── */}
        <div className="absolute left-[605px] top-[275px] w-[130px] h-[130px] flex items-center justify-center z-30">
           {/* Core Glow */}
           <motion.div 
              className="absolute inset-[-25px] bg-[#0396A6]/10 rounded-full blur-[40px] z-0 pointer-events-none"
              animate={
                 (step === 4 || step === 8 || step === 9) 
                 ? { opacity: 0.6, scale: 1.15 } 
                 : { opacity: 0.25, scale: 1 }
              }
              transition={{ duration: 0.5 }}
           />
           
           {/* Central Circle */}
           <motion.div 
              className="relative w-[130px] h-[130px] rounded-full bg-white border-2 border-[#0396A6]/30 shadow-[0_10px_35px_rgba(3,150,166,0.12)] flex flex-col items-center justify-center overflow-hidden z-20"
              animate={
                 (step === 4 || step === 8 || step === 9) 
                 ? { scale: 1.06, borderColor: '#0396A6', boxShadow: '0 15px 45px rgba(3, 150, 166,0.22)' } 
                 : { scale: 1, borderColor: 'rgba(3, 150, 166,0.3)' }
              }
              transition={{ duration: 0.4 }}
           >
              <div className="mb-0.5 relative z-10 flex items-center justify-center">
                 <FrostySparkleIcon className="w-8 h-8" />
              </div>
              <span className="text-[13.5px] font-bold text-slate-900 relative z-10 tracking-tight">Frosty</span>
              <span className="text-[8px] font-bold text-[#0396A6] relative z-10 uppercase tracking-widest mt-0.5">UNIFIED AGENT</span>
           </motion.div>
        </div>

        {/* ── 6b. RADIAL FLOATING BADGES (Pixel-Perfect Alignment with SVG lines) ── */}
        {/* Top-Left: Context stitched */}
        <motion.div 
           animate={step >= 4 ? { opacity: 1, scale: 1.02 } : { opacity: 0.75, scale: 1 }}
           className="absolute left-[415px] top-[290px] text-[10px] bg-white border border-slate-200/90 px-3 py-1.5 rounded-full text-slate-800 font-semibold whitespace-nowrap shadow-xs flex items-center gap-1.5 z-20"
        >
           <svg className="w-3.5 h-3.5 text-[#0396A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M6 9v12"/><path d="M18 9v3a3 3 0 0 1-3 3H6"/></svg>
           <span>Context stitched</span>
        </motion.div>
        
        {/* Bottom-Left: Intent recognised */}
        <motion.div 
           animate={step >= 8 ? { opacity: 1, scale: 1.02 } : { opacity: 0.75, scale: 1 }}
           className="absolute left-[415px] top-[360px] text-[10px] bg-white border border-slate-200/90 px-3 py-1.5 rounded-full text-slate-800 font-semibold whitespace-nowrap shadow-xs flex items-center gap-1.5 z-20"
        >
           <svg className="w-3.5 h-3.5 text-[#0396A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
           <span>Intent recognised</span>
        </motion.div>
        
        {/* Top-Right: History unified */}
        <motion.div 
           animate={step >= 9 ? { opacity: 1, scale: 1.02 } : { opacity: 0.75, scale: 1 }}
           className="absolute left-[785px] top-[290px] text-[10px] bg-white border border-slate-200/90 px-3 py-1.5 rounded-full text-slate-800 font-semibold whitespace-nowrap shadow-xs flex items-center gap-1.5 z-20"
        >
           <svg className="w-3.5 h-3.5 text-[#0396A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
           <span>History unified</span>
        </motion.div>
        
        {/* Bottom-Right: Memory updated */}
        <motion.div 
           animate={step >= 10 ? { opacity: 1, scale: 1.02 } : { opacity: 0.75, scale: 1 }}
           className="absolute left-[785px] top-[360px] text-[10px] bg-white border border-slate-200/90 px-3 py-1.5 rounded-full text-slate-800 font-semibold whitespace-nowrap shadow-xs flex items-center gap-1.5 z-20"
        >
           <svg className="w-3.5 h-3.5 text-[#0396A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
           <span>Memory updated</span>
        </motion.div>

        {/* ── 7. RIGHT SIDE: CUSTOMER PROFILE CARD (Compact Width w-[270px] at left-[965px]) ── */}
        <motion.div 
           className="absolute left-[965px] top-[180px] w-[270px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.06)] overflow-hidden z-20"
           initial={{ opacity: 0, y: 20 }}
           animate={step >= 10 ? { opacity: 1, y: 0, boxShadow: '0 15px 40px rgba(3, 150, 166,0.08)' } : { opacity: 0, y: 20, boxShadow: 'none' }}
           transition={{ duration: 0.5 }}
        >
           <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-slate-800 text-[12px] font-bold">Customer Profile</span>
              <button 
                type="button" 
                onClick={() => setShowProfileModal(true)}
                className="text-[#0396A6] text-[10px] font-semibold hover:text-[#027A87] hover:underline cursor-pointer transition-colors focus:outline-none"
              >
                View full
              </button>
           </div>
           <div className="p-3.5">
              <div className="flex items-center gap-2.5 mb-2.5">
                 <div className="w-9 h-9 rounded-full border border-slate-200 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center shadow-xs">
                    <img loading="lazy" decoding="async" src="https://i.pravatar.cc/150?img=68" alt="James Carter" className="w-full h-full object-cover" />
                 </div>
                 <div className="min-w-0">
                    <div className="text-slate-900 text-[12px] font-bold flex items-center gap-1.5">
                       <span className="truncate">James Carter</span>
                       <motion.span 
                          className="text-[8px] bg-teal-50 border border-[#0396A6]/30 px-1 py-0.5 rounded text-[#0396A6] font-bold uppercase tracking-wider shrink-0"
                          animate={step >= 10 ? { opacity: 1 } : { opacity: 0.4 }}
                       >
                          HIGH INTENT
                       </motion.span>
                    </div>
                    <div className="text-[9.5px] text-slate-500 leading-tight mt-0.5 truncate">james.carter@email.com<br/>+1 (415) 555-0198</div>
                 </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-2.5">
                 <span className="text-[8.5px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium">Pricing page visited</span>
                 <span className="text-[8.5px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium">Asked about bulk order</span>
                 <span className="text-[8.5px] bg-teal-50 text-[#0396A6] px-1.5 py-0.5 rounded font-medium border border-[#0396A6]/20">100 units quote</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                 <span className="text-slate-800 text-[10.5px] font-bold mb-1.5 block">Lead Score</span>
                 <div className="flex items-center gap-2.5">
                    <div className="relative w-11 h-11 shrink-0">
                       <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
                          <motion.path 
                             d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                             fill="none" 
                             stroke={step >= 10 ? "#0396A6" : "#94A3B8"} 
                             strokeWidth="3.5" 
                             strokeDasharray="100, 100" 
                             initial={{ strokeDashoffset: 50 }}
                             animate={step >= 10 ? { strokeDashoffset: 18 } : { strokeDashoffset: 50 }}
                             transition={{ duration: 0.8 }}
                          />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-slate-900 font-bold text-[13px] leading-none">{step >= 10 ? '82' : '50'}</span>
                          <span className="text-slate-500 text-[7px] uppercase font-bold mt-0.5">{step >= 10 ? 'High' : 'Med'}</span>
                       </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5">
                       <div className="flex justify-between text-[9.5px]">
                          <span className="text-slate-500 font-medium">Intent</span>
                          <span className={step >= 10 ? "text-slate-900 font-bold" : "text-slate-500 font-medium"}>{step >= 10 ? 'High' : 'Med'}</span>
                       </div>
                       <div className="flex justify-between text-[9.5px]">
                          <span className="text-slate-500 font-medium">Engagement</span>
                          <span className={step >= 10 ? "text-slate-900 font-bold" : "text-slate-500 font-medium"}>{step >= 10 ? 'High' : 'Low'}</span>
                       </div>
                       <div className="flex justify-between text-[9.5px]">
                          <span className="text-slate-500 font-medium">Fit</span>
                          <span className="text-slate-900 font-bold">Good</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </motion.div>

        {/* ── 8. BOTTOM CENTER: UNIFIED CONVERSATION (Compact Height, left-[400px]) ── */}
        <motion.div 
           className="absolute left-[400px] top-[423px] w-[540px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.05)] overflow-hidden z-20"
           initial={{ opacity: 0, y: 20 }}
           animate={step >= 9 ? { opacity: 1, y: 0, boxShadow: '0 12px 30px rgba(3, 150, 166,0.08)' } : { opacity: 0, y: 20, boxShadow: 'none' }}
           transition={{ duration: 0.5 }}
        >
           <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                 <span className="text-amber-500 text-xs">✨</span>
                 <span className="text-slate-900 text-[11.5px] font-bold">Unified Conversation</span>
              </div>
              <div className="flex items-center gap-1">
                 <span className="relative flex h-1.5 w-1.5">
                   {step >= 12 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0396A6] opacity-75"></span>}
                   <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0396A6]"></span>
                 </span>
                 <span className="text-[9px] text-[#0396A6] font-semibold">Live</span>
              </div>
           </div>
           
           <div className="px-3 py-2 flex gap-2.5 items-center">
              <div className="w-7 h-7 rounded-full bg-[#F0FDFA] border border-[#0396A6]/20 flex items-center justify-center shrink-0">
                 <FrostySparkleIcon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-slate-900 text-[11.5px] font-bold leading-tight">Hi James! 👋</p>
                 <p className="text-[10.5px] text-slate-600 leading-snug mt-0.5">
                    Thanks for reaching out across different channels. I can help you with pricing, discounts and delivery timelines for 100 units.
                 </p>
              </div>
           </div>
        </motion.div>

      </div>

      {/* ── 9. CUSTOMER PROFILE FULL DETAILS MODAL ── */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0396A6]"></div>
                  <h3 className="font-bold text-slate-900 text-sm">Unified Customer Profile</h3>
                </div>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3.5 p-3 rounded-xl bg-teal-50/50 border border-teal-100/60">
                  <img loading="lazy" decoding="async" src="https://i.pravatar.cc/150?img=68" alt="James Carter" className="w-12 h-12 rounded-full border border-teal-200 object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">James Carter</span>
                      <span className="px-2 py-0.5 bg-[#0396A6] text-white text-[9px] font-bold rounded-full uppercase tracking-wider">HIGH INTENT (82/100)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">james.carter@email.com • +1 (415) 555-0198</p>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">Omnichannel History</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[#0396A6] font-bold shrink-0">10:24 AM</span>
                      <span className="text-slate-600"><strong className="text-slate-800">Website:</strong> Visited Pricing page & asked about 100 units bulk discount.</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[#10B981] font-bold shrink-0">10:25 AM</span>
                      <span className="text-slate-600"><strong className="text-slate-800">WhatsApp:</strong> Connected via WhatsApp; Frosty recognized past context instantly.</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[#EA4335] font-bold shrink-0">10:26 AM</span>
                      <span className="text-slate-600"><strong className="text-slate-800">Email:</strong> Inquired about delivery turnaround time for 100 units.</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex justify-end gap-2">
                  <button 
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2 text-xs font-semibold bg-[#0396A6] hover:bg-[#027A87] text-white rounded-lg transition-colors shadow-xs"
                  >
                    Export to CRM
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE RESPONSIVE CHANNELS VIEW (< 1024px) */}
      <div className="relative w-full max-w-lg mx-auto px-4 py-6 flex flex-col gap-5 lg:hidden z-10">
         {/* Mobile Section Header */}
         <div className="text-left w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#0396A6]/30 bg-[#0396A6]/10 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-[#0396A6] mb-3 shadow-2xs">
               <svg className="w-3.5 h-3.5 text-[#0396A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/>
               </svg>
               OMNI-CHANNEL. UNIFIED AGENT.
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F172A] leading-[1.15] tracking-tight mb-2 font-serif">
               Website. WhatsApp. Email.<br />
               <span className="text-[#0396A6] font-bold" style={{ color: '#0396A6' }}>Unified.</span>
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
               One customer. Multiple touchpoints. Frosty connects the dots across Website and WhatsApp in real time so conversations never lose context.
            </p>
         </div>

         {/* 3 Mobile Channel Chips */}
         <div className="grid grid-cols-3 gap-2 w-full">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col items-center text-center">
               <div className="w-6 h-6 rounded-lg bg-teal-50 text-[#0396A6] flex items-center justify-center mb-1">
                  <Globe className="w-3.5 h-3.5" />
               </div>
               <span className="text-[10.5px] sm:text-[11.5px] font-bold text-slate-800 font-sans">Website</span>
               <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium">Pricing visited</span>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col items-center text-center">
               <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                  <MessageCircle className="w-3.5 h-3.5" />
               </div>
               <span className="text-[10.5px] sm:text-[11.5px] font-bold text-slate-800 font-sans">WhatsApp</span>
               <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium">Asked quote</span>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col items-center text-center">
               <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                  <Mail className="w-3.5 h-3.5" />
               </div>
               <span className="text-[10.5px] sm:text-[11.5px] font-bold text-slate-800 font-sans">Email</span>
               <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium">Timeline shared</span>
            </div>
         </div>

         {/* Unified Customer Memory Card */}
         <div className="p-4 rounded-2xl bg-white border border-teal-200/80 shadow-[0_8px_30px_rgba(3,150,166,0.08)] flex flex-col gap-3 w-full">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
               <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0396A6] to-teal-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                     JC
                  </div>
                  <div>
                     <div className="text-[13px] font-bold text-slate-900 leading-tight">James Carter</div>
                     <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active on Web & WhatsApp
                     </div>
                  </div>
               </div>
               <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-[#0396A6]/10 text-[#0396A6] border border-[#0396A6]/20">
                  82/100 Intent
               </span>
            </div>

            {/* AI Unified Response Bubble */}
            <div className="p-3 rounded-xl bg-[#F0FDFA] border border-teal-100 flex flex-col gap-1.5">
               <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-[#0396A6] uppercase tracking-wider">
                  <FrostySparkleIcon className="w-3 h-3 text-[#0396A6]" />
                  <span>Frosty Agent Unified Reply</span>
               </div>
               <p className="text-[11.5px] text-slate-700 leading-snug">
                  &ldquo;Hi James! Thanks for checking our pricing page earlier. I have your custom quote ready for review.&rdquo;
               </p>
            </div>

            {/* Bottom Sync Pill */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
               <span className="flex items-center gap-1 font-medium">
                  <Check className="w-3 h-3 text-[#0396A6]" /> CRM synced in real time
               </span>
               <span className="font-semibold text-[#0396A6]">Zero context lost</span>
            </div>
         </div>
      </div>

    </section>
  );
}
