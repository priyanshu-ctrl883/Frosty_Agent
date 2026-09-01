'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import FrostyIcon from '@/components/FrostyIcon';

gsap.registerPlugin(ScrollTrigger);

/* ─── Premium Magnetic Button ─── */
function MagneticButton() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const xTo = gsap.quickTo(buttonRef.current, "x", { duration: 0.6, ease: "expo.out" });
    const yTo = gsap.quickTo(buttonRef.current, "y", { duration: 0.6, ease: "expo.out" });
    const textXTo = gsap.quickTo(textRef.current, "x", { duration: 0.8, ease: "expo.out" });
    const textYTo = gsap.quickTo(textRef.current, "y", { duration: 0.8, ease: "expo.out" });

    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current) return;
      
      const { clientX, clientY } = e;
      const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
      
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      
      const distanceX = clientX - centerX;
      const distanceY = clientY - centerY;
      const distance = Math.hypot(distanceX, distanceY);
      
      if (distance < 120) {
        xTo(distanceX * 0.4);
        yTo(distanceY * 0.4);
        textXTo(distanceX * 0.15);
        textYTo(distanceY * 0.15);
      } else {
        xTo(0); yTo(0); textXTo(0); textYTo(0);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, { scope: triggerRef });

  return (
    <div ref={triggerRef} className="relative py-6 px-20">
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#00F0FF]/15 blur-2xl rounded-full"
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.button
        ref={buttonRef}
        className="relative px-10 py-5 bg-transparent border border-[#00F0FF]/30 rounded-2xl font-bold text-white tracking-wide overflow-hidden transition-shadow duration-300 group"
        style={{ boxShadow: '0 0 30px rgba(0, 240, 255, 0.05)' }}
        whileHover={{ borderColor: 'rgba(0, 240, 255, 0.6)', boxShadow: '0 0 40px rgba(0, 240, 255, 0.2)' }}
      >
        <span ref={textRef} className="relative z-10 flex items-center gap-3">
          <span className="text-lg">Awaken Frosty</span>
          <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
        </span>
        <motion.div className="absolute inset-0 border border-[#00F0FF]/40 rounded-2xl" animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 3, repeat: Infinity }} />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#00F0FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>
    </div>
  );
}

/* ─── Fanned Agent Cards ─── */
function FannedCards() {
  const cards = [
    { 
      label: 'Website', color: '#0396A6', 
      desc: 'Automates visitor queries, captures leads, and schedules meetings instantly. Click the card to awaken.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )
    },
    { 
      label: 'WhatsApp', color: '#25D366', 
      desc: '24/7 conversational commerce and automated support natively inside WhatsApp. Click the card to awaken.',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path fill="currentColor" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.188 8.188 0 01-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.39-.12-.56.12-.16.25-.64.82-.78.99-.15.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.12-.24-.01-.39.11-.5.11-.11.25-.27.37-.41.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.11-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01z"/>
        </svg>
      )
    },
    { 
      label: 'Unified', color: '#0396A6', 
      desc: 'The central nervous system. Syncs all agents into a single dashboard. Click the card to awaken.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <polyline points="16 16 12 12 8 16" />
          <line x1="12" y1="12" x2="12" y2="21" />
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          <polyline points="16 16 12 12 8 16" />
        </svg>
      )
    },
  ];

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center mb-0 px-6">
      <div className="relative w-full max-w-sm h-full flex items-center justify-center">
        {cards.map((card, i) => {
          const rotation = (i - (cards.length - 1) / 2) * 18;
          const xOffset = (i - (cards.length - 1) / 2) * 32;
          
          return (
            <Link key={card.label} href="/login">
              <motion.div
                className="absolute w-52 h-72 rounded-3xl border border-white/[0.05] backdrop-blur-3xl flex flex-col p-5 shadow-2xl cursor-pointer"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  transformOrigin: 'bottom center',
                  zIndex: 10 + i,
                  left: "50%",
                  marginLeft: "-6.5rem", // half of w-52
                  bottom: "120px",
                  willChange: "transform, opacity, box-shadow"
                }}
                initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                whileInView={{
                  opacity: 1, 
                  scale: 1,
                  rotate: rotation,
                  x: xOffset }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 260, damping: 20, mass: 1, delay: 0.1 + i * 0.05 }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                whileHover={{ 
                  y: -60, 
                  scale: 1.25, 
                  rotate: 0,
                  x: xOffset,
                  zIndex: 1000, 
                  borderColor: card.color,
                  boxShadow: `0 40px 80px -12px ${card.color}44`,
                  transition: { type: "spring", stiffness: 400, damping: 25, mass: 0.8 }
                }}
              >
                
                {/* Ambient Aura */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                  <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-30 transition-opacity duration-500" style={{ background: card.color, opacity: hoveredIndex === i ? 0.5 : 0.2 }} />
                  <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-3xl opacity-20 transition-opacity duration-500" style={{ background: card.color, opacity: hoveredIndex === i ? 0.3 : 0.1 }} />
                </div>
                {/* Corner Accents */}
                <div className="absolute top-4 right-4 w-8 h-8 opacity-20 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: card.color }} />
                <div className="absolute bottom-4 left-4 w-4 h-4 opacity-20 border-b-2 border-l-2 rounded-bl-sm" style={{ borderColor: card.color }} />

                {/* Status Badge */}
                <div className="absolute top-5 right-5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 opacity-40">
                  <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: card.color }} />
                  <span className="text-[6px] font-bold text-white uppercase tracking-widest">System Ready</span>
                </div>

                <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center shadow-inner transition-colors" style={{ background: hoveredIndex === i ? `${card.color}30` : `${card.color}15`, border: `1px solid ${card.color}40`, color: card.color }}>
                  {card.icon}
                </div>
                <span className="text-sm font-black tracking-[0.25em] text-white uppercase">{card.label}</span>
                
                <div className="mt-4 overflow-hidden flex-1">
                  {hoveredIndex === i ? (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1, 
                        textShadow: [
                          '0 0 12px rgba(99, 90, 128, 0.8)', 
                          '0 0 12px rgba(99, 90, 128, 0.8)', 
                          '0 0 0px rgba(99, 90, 128, 0)'
                        ]
                      }}
                      className="text-sm leading-relaxed text-slate-100 font-medium"
                      transition={{ 
                        opacity: { duration: 0.3 },
                        textShadow: { 
                          duration: 0.5, 
                          delay: card.desc.length * 0.01,
                          times: [0, 0.8, 1]
                        } 
                      }}
                    >
                      {card.desc.split('').map((char, index) => (
                        <motion.span 
                          key={index} 
                          initial={{ opacity: 0, textShadow: '0 0 0px rgba(99, 90, 128, 0)' }} 
                          animate={{ opacity: 1 }} 
                          transition={{ delay: index * 0.01, duration: 0.01 }}
                        >
                          {char}
                        </motion.span>
                      ))}
                    </motion.p>
                  ) : (
                    <div className="mt-auto flex flex-col gap-1.5 opacity-30">
                      <div className="h-1 w-full bg-white/10 rounded-full" />
                      <div className="h-1 w-2/3 bg-white/10 rounded-full" />
                    </div>
                  )}
                </div>
              
                {/* Decorative Bottom Line */}
                <div className="mt-auto pt-4 relative">
                  <div className="absolute bottom-0 left-0 w-full h-[1px] opacity-10" style={{ background: `linear-gradient(90deg, transparent, ${card.color}, transparent)` }} />
                  <div className="flex justify-between items-end opacity-20">
                    <div className="flex gap-0.5">
                      {[...Array(4)].map((_, idx) => (
                        <div key={idx} className="w-0.5 h-1 bg-white" />
                      ))}
                    </div>
                    <span className="text-[5px] font-mono text-white">0x{['a3f', 'b7c', 'e2d', '1f9'][i]}</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}

        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 1, opacity: 0.2 }}>
          {[...Array(3)].map((_, i) => (
            <motion.circle
              key={i} r="1" fill="#0396A6"
              initial={{ offsetDistance: "0%" }}
              animate={{ offsetDistance: "100%" }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: "linear", delay: i * 0.8 }}
              style={{ 
                offsetPath: `path('M ${100 + i * 50} 300 Q 150 150 ${200 - i * 50} -100')`,
                filter: 'blur(1px) drop-shadow(0 0 5px #0396A6)'
              }}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ─── Main IgnitionCTA ─── */
export default function IgnitionCTA() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const revealEls = containerRef.current?.querySelectorAll('.ignition-reveal');
    if (revealEls?.length) {
      gsap.fromTo(revealEls,
        { y: 30, opacity: 0, filter: 'blur(10px)' },
        {
          y: 0, opacity: 1, filter: 'blur(0px)',
          duration: 1, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          }
        }
      );
    }
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef}
      id="ignition" 
      className="w-full py-20 px-6 relative flex flex-col items-center"
    >
      <div className="text-center mb-6 relative z-10 flex flex-col items-center">
        <div className="ignition-reveal inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6" style={{ opacity: 0 }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0396A6] animate-pulse" />
          <span className="text-sm font-bold tracking-[0.2em] text-slate-400 uppercase">Final Pipeline</span>
        </div>
        <h2 className="ignition-reveal text-5xl md:text-7xl font-extrabold text-white tracking-tighter leading-[0.95] mb-6" style={{ opacity: 0 }}>
          Initialize Your Agent.
        </h2>
        <p className="ignition-reveal text-slate-500 text-sm md:text-lg max-w-xl mx-auto" style={{ opacity: 0 }}>
          Deploy your autonomous workforce in minutes and watch your conversion metrics soar.
        </p>
      </div>

      <div className="w-full max-w-4xl relative flex flex-col items-center">
        <div className="w-full flex flex-col items-center gap-0 mb-20">
          <FannedCards />
          <div className="relative z-50 -mt-10">
            <Link href="/login">
              <MagneticButton />
            </Link>
          </div>
        </div>

        <div className="w-full pt-12 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B1221]/80 border border-white/10 backdrop-blur-md mb-8 cursor-default select-none">
            <div className="text-sm drop-shadow-[0_0_8px_rgba(99, 90, 128,0.6)]">
              <FrostyIcon size={14} glow={0} />
            </div>
            <span className="text-white font-bold tracking-tight text-sm">Frosty</span>
            <span className="text-slate-500 text-sm font-bold tracking-[0.2em] uppercase ml-1 border-l border-white/10 pl-3 py-0.5">By Frostrek LLP</span>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Connect Your Data, Measure ROI.</h4>
            <p className="text-slate-500 text-sm font-medium tracking-wide">Agentic flow which increases margin and ops efficiency.</p>
          </div>
        </div>

        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#0396A6]/5 blur-3xl rounded-full -z-10" />
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-500/5 blur-3xl rounded-full -z-10" />
      </div>
    </section>
  );
}
