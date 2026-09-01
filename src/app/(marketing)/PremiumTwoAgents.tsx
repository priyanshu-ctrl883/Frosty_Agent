'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Globe, MessageSquare, Brain, User, Sparkles, Check, ArrowRight } from 'lucide-react';

export default function PremiumTwoAgents() {
  const [active, setActive] = useState<'website' | 'whatsapp' | null>(null);
  
  // Mouse tracking for whole section spotlight
  const sectionRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });
  
  // Drag coordinates for the brain logo thread
  const logoDragX = useMotionValue(0);
  const logoDragY = useMotionValue(0);
  const threadX2 = useTransform(logoDragX, x => x + 48);
  const threadY2 = useTransform(logoDragY, y => y + 80);
  
  const [isHoveringSection, setIsHoveringSection] = useState(false);
  const [logoDropped, setLogoDropped] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const glowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBrainClick = () => {
    const newDropped = !logoDropped;
    setLogoDropped(newDropped);
    
    if (newDropped) {
      setIsGlowing(true);
      if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
      glowTimeoutRef.current = setTimeout(() => {
        setIsGlowing(false);
      }, 2000);
    } else {
      setIsGlowing(false);
      if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const { left, top } = sectionRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  useEffect(() => {
    if (sectionRef.current) {
      const { width, height } = sectionRef.current.getBoundingClientRect();
      mouseX.set(width / 2);
      mouseY.set(height / 2);
    }
  }, [mouseX, mouseY]);

  return (
    <section 
      ref={sectionRef}
      className="relative py-24 overflow-hidden border-y border-white/5" 
      style={{ background: 'rgba(8, 13, 26, 0.6)', backdropFilter: 'blur(20px)' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHoveringSection(true)}
      onMouseLeave={() => {
        setIsHoveringSection(false);
        setActive(null);
      }}
    >
      
      {/* Interactive Section Spotlight */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          className="absolute rounded-full blur-[120px]"
          style={{
            width: 800,
            height: 800,
            x: springX,
            y: springY,
            translateX: "-50%",
            translateY: "-50%",
          }}
          animate={{
            background: active === 'website'
              ? 'radial-gradient(circle, rgba(0,229,255,0.12) 0%, transparent 70%)'
              : active === 'whatsapp'
              ? 'radial-gradient(circle, rgba(37,211,102,0.12) 0%, transparent 70%)'
              : isHoveringSection 
              ? 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(59,130,246,0) 0%, transparent 70%)',
            scale: isHoveringSection ? 1 : 0.8,
          }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="relative z-10 max-w-[1280px] mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4 text-xs font-bold tracking-widest text-blue-400 uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            TWO CHANNELS · ONE CONVERSATION
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Deploy on your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400">Website & WhatsApp</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            The same AI, same knowledge base, same brand persona — everywhere your visitors reach out. Hover or tap an agent to inspect its capabilities.
          </p>
        </div>

        {/* 2-Agent Interactive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* 1. WEBSITE AGENT CARD */}
          <motion.div 
            className={`relative rounded-3xl p-8 transition-all duration-500 cursor-pointer overflow-hidden border flex flex-col justify-between ${
              active === 'website' 
                ? 'bg-slate-900/90 border-cyan-500/50 shadow-[0_20px_60px_rgba(0,229,255,0.15)]' 
                : 'bg-slate-950/60 border-white/10 hover:border-cyan-500/30'
            }`}
            onMouseEnter={() => setActive('website')}
            onMouseLeave={() => setActive(null)}
            whileHover={{ y: -4 }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                  <Globe className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                  Website Widget
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">Website Autonomous Agent</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Embeds into any site in under 60 seconds. Engages visitors in real time, answers questions instantly with RAG memory, collects lead contact info, and schedules meetings straight to your calendar.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-white/10">
              {[
                'Instant embed with 1 line of HTML script',
                '24/7 lead capture & custom form fields',
                'Integrated Google Calendar scheduler',
                'Custom brand theme & glassmorphic styling'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 2. WHATSAPP AGENT CARD */}
          <motion.div 
            className={`relative rounded-3xl p-8 transition-all duration-500 cursor-pointer overflow-hidden border flex flex-col justify-between ${
              active === 'whatsapp' 
                ? 'bg-slate-900/90 border-emerald-500/50 shadow-[0_20px_60px_rgba(37,211,102,0.15)]' 
                : 'bg-slate-950/60 border-white/10 hover:border-emerald-500/30'
            }`}
            onMouseEnter={() => setActive('whatsapp')}
            onMouseLeave={() => setActive(null)}
            whileHover={{ y: -4 }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  WhatsApp API
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">WhatsApp Business Agent</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Reaches prospects on the world&apos;s most active messaging platform. Handles inbound inquiries automatically, logs chat history, sends media attachments, and alerts your team for human takeover.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-white/10">
              {[
                'Official Meta WhatsApp Cloud API integration',
                'Real-time webhook sync & multi-tenant isolation',
                'One-click human agent pause & resume',
                'Shared conversation memory across web & WA'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
