'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Globe, MessageSquare, Brain, User, Bot } from 'lucide-react';
import FrostyIcon from '@/components/FrostyIcon';

export default function TwoAgentsSection() {
  const [active, setActive] = useState<'outbound' | 'inbound' | null>(null);
  
  // Mouse tracking for whole section spotlight
  const sectionRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });
   
  // Drag coordinates for the logo thread
  const logoDragX = useMotionValue(0);
  const logoDragY = useMotionValue(0);
  const threadX2 = useTransform(logoDragX, x => x + 48);
  const threadY2 = useTransform(logoDragY, y => y + 80);
  
  const [isHoveringSection, setIsHoveringSection] = useState(false);
  const [logoDropped, setLogoDropped] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const glowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBrainClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
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

  // Center the spotlight initially
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
      className="relative py-4 sm:py-6 lg:py-8 overflow-hidden bg-transparent"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHoveringSection(true)}
      onMouseLeave={() => {
        setIsHoveringSection(false);
        setActive(null);
      }}
    >
      
      {/* Dropping Logo Animation */}
      <AnimatePresence>
        {logoDropped && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", damping: 10, stiffness: 80, mass: 1 }}
            className="absolute top-0 left-12 lg:left-32 flex flex-col items-center z-50 pointer-events-none"
          >
            {/* Dynamic stretchy thread */}
            <svg className="absolute top-0 left-0 w-full h-[500px] pointer-events-none z-0" style={{ overflow: 'visible' }}>
              <motion.line 
                x1={48} 
                y1={0} 
                x2={threadX2} 
                y2={threadY2} 
                stroke="#0396A6"
                strokeWidth="2.5"
                strokeOpacity="0.4"
                strokeLinecap="round"
              />
            </svg>
            <motion.div 
              drag
              dragSnapToOrigin={true}
              dragElastic={0.6}
              style={{ x: logoDragX, y: logoDragY, marginTop: 80, cursor: "grab" }}
              whileDrag={{ scale: 1.1, cursor: "grabbing" }}
              className="w-24 h-24 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center border border-slate-200 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] pointer-events-auto relative z-50"
            >
              <div className="flex items-center justify-center w-full h-full pointer-events-none">
                <FrostyIcon size={40} glow={0.6} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Shared Memory Circular Animation Popup */}
      <AnimatePresence>
        {logoDropped && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            className="absolute -top-4 right-4 lg:right-10 z-50 w-[360px] pointer-events-none hidden md:block"
          >
            <div className="relative w-[360px] h-[340px] mx-auto pointer-events-none">
              
              {/* SVG Connecting Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                <motion.line
                  x1="60" y1="80" x2="300" y2="80"
                  stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4"
                />
                <motion.line
                  x1="60" y1="80" x2="300" y2="80"
                  stroke="#0396A6" strokeWidth="2" strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, delay: 1 }}
                />
                
                <motion.line
                  x1="300" y1="80" x2="300" y2="260"
                  stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4"
                />
                <motion.line
                  x1="300" y1="80" x2="300" y2="260"
                  stroke="#14B8A6" strokeWidth="2" strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 3 }}
                />

                <motion.line
                  x1="300" y1="260" x2="60" y2="260"
                  stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4"
                />
                <motion.line
                  x1="300" y1="260" x2="60" y2="260"
                  stroke="#10B981" strokeWidth="2" strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 4.5 }}
                />
                
                <motion.line
                  x1="60" y1="260" x2="60" y2="80"
                  stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4"
                />
                <motion.line
                  x1="60" y1="260" x2="60" y2="80"
                  stroke="#10B981" strokeWidth="2" strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, delay: 6 }}
                />
              </svg>

              {/* Node 1: User (Top Left) */}
              <motion.div 
                className="absolute top-[56px] left-[36px] w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 z-10 cursor-pointer pointer-events-auto shadow-md"
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ delay: 0.2, type: 'spring' }}
                whileHover={{ scale: 1.2, rotate: -10 }}
              >
                <User className="w-6 h-6 text-slate-700" />
              </motion.div>

              {/* Node 2: Website (Top Right) */}
              <motion.div 
                className="absolute top-[56px] left-[276px] w-12 h-12 flex items-center justify-center z-10 cursor-pointer pointer-events-auto"
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ delay: 0.4, type: 'spring' }}
                whileHover={{ scale: 1.2, rotate: 10 }}
              >
                <img loading="lazy" decoding="async" src="/web.svg" alt="Website" className="w-9 h-9 object-contain" />
              </motion.div>

              {/* Node 3: Brain (Bottom Right) */}
              <motion.div 
                className="absolute top-[236px] left-[276px] w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center border border-teal-200 z-10 shadow-md cursor-pointer pointer-events-auto"
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ delay: 0.6, type: 'spring' }}
                whileHover={{ scale: 1.2, rotate: -10 }}
              >
                <Brain className="w-6 h-6 text-[#0396A6]" />
              </motion.div>

              {/* Node 4: WhatsApp (Bottom Left) */}
              <motion.div 
                className="absolute top-[236px] left-[36px] w-12 h-12 flex items-center justify-center z-10 cursor-pointer pointer-events-auto"
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ delay: 0.8, type: 'spring' }}
                whileHover={{ scale: 1.2, rotate: 10 }}
              >
                <img loading="lazy" decoding="async" src="/whatsapp.png" alt="WhatsApp" className="w-9 h-9 object-contain" />
              </motion.div>
              
              {/* Message Bubbles */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                transition={{ duration: 0.5, delay: 1.5 }}
                className="absolute top-[80px] left-[180px] bg-white text-slate-800 text-[10px] p-2 rounded-2xl shadow-lg w-[130px] z-20 leading-tight text-center border border-slate-200 font-medium"
              >
                "plz tell me about ur service on wp on +91 98765 43210"
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                transition={{ duration: 0.4, delay: 3.5 }}
                className="absolute top-[170px] left-[300px] bg-teal-50 text-[#0396A6] text-[10px] font-bold px-3 py-1 rounded-full border border-teal-200 z-20 shadow-sm"
              >
                Syncing Context...
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                transition={{ duration: 0.4, delay: 5 }}
                className="absolute top-[260px] left-[180px] bg-green-50 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full border border-green-200 z-20 shadow-sm"
              >
                Context Connected!
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                transition={{ duration: 0.5, delay: 6.5 }}
                className="absolute top-[170px] left-[60px] bg-[#16A34A] text-white text-[10px] p-2 rounded-2xl shadow-lg w-[130px] z-20 leading-tight text-center font-medium"
              >
                "Hi! Here is the detailed info on our services..."
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4 sm:mb-6 max-w-[650px] mx-auto"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0396A6]/[0.08] border border-[#0396A6]/20 mb-2.5 backdrop-blur-sm shadow-xs">
            <Bot className="w-3.5 h-3.5 text-[#0396A6]" />
            <span className="text-[9.5px] md:text-[10.5px] font-bold tracking-widest uppercase text-[#0396A6]">DUAL-CHANNEL ARCHITECTURE</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-[#0F172A] leading-tight m-0 mb-2">
            Two agents.<br />
            One <span className="relative">
              <span className="relative z-10 font-bold text-[#0396A6]" style={{ color: '#0396A6' }}>conversation.</span>
              <motion.div 
                className="absolute bottom-0.5 left-0 right-0 h-2.5 bg-[#0396A6]/10 -z-10 rounded-sm"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                style={{ transformOrigin: 'left' }}
              />
            </span>
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-600 font-normal leading-normal max-w-xl mx-auto m-0">
            The web and WhatsApp agents share a single memory — so a visitor who starts on your site and finishes on WhatsApp never repeats themselves.
          </p>
        </motion.div>

        {/* Cards Layout */}
        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_180px_1fr] gap-3 lg:gap-0 items-stretch max-w-[1100px] mx-auto">
          
          {/* LEFT: WEB AGENT CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative z-10 lg:pr-4 group cursor-pointer perspective-1000"
            onMouseEnter={() => setActive('outbound')}
            onMouseLeave={() => setActive(null)}
          >
            <motion.div 
              className="h-full rounded-xl p-3.5 sm:p-4 lg:p-4 flex flex-col transition-all duration-500 overflow-hidden relative bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
              whileHover={{ scale: 1.02, rotateY: 2, rotateX: 2 }}
              style={{
                borderColor: active === 'outbound' || isGlowing ? '#0396A6' : '#E2E8F0',
                boxShadow: isGlowing 
                  ? '0 0 40px rgba(3, 150, 166,0.15), 0 0 0 4px rgba(3, 150, 166,0.08)'
                  : active === 'outbound' 
                  ? '0 20px 40px -10px rgba(3, 150, 166,0.12), 0 0 0 4px rgba(3, 150, 166,0.06)' 
                  : '0 4px 20px rgba(0,0,0,0.03)',
              }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                  <motion.div 
                    animate={{ scale: active === 'outbound' ? 1.1 : 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <img loading="lazy" decoding="async" src="/web.svg" alt="Website" className="w-6 h-6 object-contain shrink-0" />
                  </motion.div>
                  <div className="px-2 py-0.5 rounded-full bg-[#0396A6]/10 text-[9px] font-bold text-[#0396A6] tracking-wider uppercase border border-[#0396A6]/20">
                    WEB AGENT
                  </div>
                </div>

                <h3 className="text-sm sm:text-[15px] font-bold text-[#0396A6] mb-1">
                  Website Conversion Agent
                </h3>
                <p className="text-[11.5px] sm:text-xs text-slate-600 leading-normal mb-2.5 sm:mb-3">
                  Engages visitors instantly, answers complex product questions from your verified knowledge base, qualifies intent, and books meetings into your calendar.
                </p>
              </div>

              <div className="mt-auto pt-2 border-t border-slate-100 relative z-10">
                <p className="text-[9px] font-bold tracking-wider uppercase text-slate-500">
                  FOR: WEBSITE VISITORS • INBOUND LEADS • E-COMMERCE
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* CENTRAL BRAIN WITH DIRECT CIRCUMFERENCE WRAP & UPWARD POP */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-20 flex flex-col items-center justify-center py-6 lg:py-0 h-full"
          >
            {/* Defs Filter for Glowing Energy Particles */}
            <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
              <defs>
                <filter id="brain-tight-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>

            {/* Left Bridge Line (Connecting middle of Left Card to 9 o'clock of Brain) */}
            <div className="hidden lg:block absolute left-[-40px] xl:left-[-55px] right-[calc(50%+40px)] top-1/2 -translate-y-1/2 h-[4px] pointer-events-none z-10">
              <svg className="w-full h-full overflow-visible" fill="none">
                <line x1="0" y1="2" x2="100%" y2="2" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3.5" strokeOpacity="0.8" />
                <circle r="3.5" fill="#0396A6" filter="url(#brain-tight-glow)">
                  <animateMotion
                    dur="3.2s"
                    repeatCount="indefinite"
                    path="M 0 2 L 100 2"
                    keyTimes="0; 0.28; 1"
                    keyPoints="0; 1; 1"
                  />
                  <animate
                    attributeName="opacity"
                    values="0; 1; 1; 0; 0"
                    keyTimes="0; 0.05; 0.27; 0.3; 1"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </div>

            {/* Right Bridge Line (Connecting middle of Right Card to 3 o'clock of Brain) */}
            <div className="hidden lg:block absolute left-[calc(50%+40px)] right-[-40px] xl:right-[-55px] top-1/2 -translate-y-1/2 h-[4px] pointer-events-none z-10">
              <svg className="w-full h-full overflow-visible" fill="none">
                <line x1="0" y1="2" x2="100%" y2="2" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3.5" strokeOpacity="0.8" />
                <circle r="3.5" fill="#10B981" filter="url(#brain-tight-glow)">
                  <animateMotion
                    dur="3.2s"
                    repeatCount="indefinite"
                    path="M 100 2 L 0 2"
                    keyTimes="0; 0.28; 1"
                    keyPoints="0; 1; 1"
                  />
                  <animate
                    attributeName="opacity"
                    values="0; 1; 1; 0; 0"
                    keyTimes="0; 0.05; 0.27; 0.3; 1"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </div>

            {/* Central Brain Interactive Unit (Centered exactly at the vertical middle of the box) */}
            <div 
              className="relative flex flex-col items-center cursor-pointer"
              onClick={handleBrainClick}
              onMouseEnter={() => setIsGlowing(true)}
              onMouseLeave={() => setIsGlowing(false)}
            >
              {/* Main Brain Circle with Upward Pop & Glowing Halo */}
              <motion.div 
                className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-white shadow-md z-20"
                whileHover={{ scale: 1.08, y: -4 }}
                animate={{
                  y: [0, 0, -12, -2, 0],
                  scale: [1, 1, 1.1, 1.02, 1],
                  borderColor: [
                    '#CBD5E1',
                    '#CBD5E1',
                    '#0396A6',
                    '#0396A6',
                    '#CBD5E1'
                  ],
                  boxShadow: [
                    '0 4px 20px rgba(0,0,0,0.06)',
                    '0 4px 20px rgba(0,0,0,0.06)',
                    '0 18px 45px rgba(3, 150, 166, 0.45), 0 0 35px rgba(3, 150, 166, 0.35)',
                    '0 8px 25px rgba(3, 150, 166, 0.2)',
                    '0 4px 20px rgba(0,0,0,0.06)'
                  ]
                }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  times: [0, 0.55, 0.72, 0.88, 1],
                  ease: 'easeInOut'
                }}
                style={{
                  borderWidth: '2.5px',
                  borderStyle: 'solid',
                }}
              >
                {/* SVG Overlay: Exact Circumference Orbit & Wrapping Particles */}
                <svg className="absolute -inset-[4px] w-[calc(100%+8px)] h-[calc(100%+8px)] pointer-events-none overflow-visible z-10" viewBox="0 0 100 100" fill="none">
                  {/* 1. Base Dotted Orbit on exact circumference */}
                  <circle cx="50" cy="50" r="48.5" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3.5" strokeOpacity="0.75" />

                  {/* 2. Shockwave Pulse Halo on Pop */}
                  <circle cx="50" cy="50" r="48.5" fill="none" stroke="#0396A6" filter="url(#brain-tight-glow)">
                    <animate
                      attributeName="r"
                      values="48.5; 48.5; 48.5; 72; 80"
                      keyTimes="0; 0.55; 0.65; 0.88; 1"
                      dur="3.2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0; 0; 0.9; 0.2; 0"
                      keyTimes="0; 0.55; 0.65; 0.88; 1"
                      dur="3.2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="stroke-width"
                      values="2; 2; 2.5; 1; 0"
                      keyTimes="0; 0.55; 0.65; 0.88; 1"
                      dur="3.2s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* 3. Left Stream wrapping clockwise 360° around circumference */}
                  <circle r="4" fill="#0396A6" filter="url(#brain-tight-glow)">
                    <animateMotion
                      dur="3.2s"
                      repeatCount="indefinite"
                      path="M 1.5 50 A 48.5 48.5 0 1 1 98.5 50 A 48.5 48.5 0 1 1 1.5 50"
                      keyTimes="0; 0.28; 0.72; 1"
                      keyPoints="0; 0; 1; 1"
                    />
                    <animate
                      attributeName="opacity"
                      values="0; 0; 1; 1; 0; 0"
                      keyTimes="0; 0.27; 0.32; 0.7; 0.75; 1"
                      dur="3.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Left Trailing Atom */}
                  <circle r="2.8" fill="#38BDF8" filter="url(#brain-tight-glow)">
                    <animateMotion
                      dur="3.2s"
                      repeatCount="indefinite"
                      path="M 1.5 50 A 48.5 48.5 0 1 1 98.5 50 A 48.5 48.5 0 1 1 1.5 50"
                      keyTimes="0; 0.35; 0.79; 1"
                      keyPoints="0; 0; 1; 1"
                    />
                    <animate
                      attributeName="opacity"
                      values="0; 0; 1; 1; 0; 0"
                      keyTimes="0; 0.34; 0.39; 0.77; 0.82; 1"
                      dur="3.2s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* 4. Right Stream wrapping counter-clockwise 360° around circumference */}
                  <circle r="4" fill="#10B981" filter="url(#brain-tight-glow)">
                    <animateMotion
                      dur="3.2s"
                      repeatCount="indefinite"
                      path="M 98.5 50 A 48.5 48.5 0 1 0 1.5 50 A 48.5 48.5 0 1 0 98.5 50"
                      keyTimes="0; 0.28; 0.72; 1"
                      keyPoints="0; 0; 1; 1"
                    />
                    <animate
                      attributeName="opacity"
                      values="0; 0; 1; 1; 0; 0"
                      keyTimes="0; 0.27; 0.32; 0.7; 0.75; 1"
                      dur="3.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Right Trailing Atom */}
                  <circle r="2.8" fill="#34D399" filter="url(#brain-tight-glow)">
                    <animateMotion
                      dur="3.2s"
                      repeatCount="indefinite"
                      path="M 98.5 50 A 48.5 48.5 0 1 0 1.5 50 A 48.5 48.5 0 1 0 98.5 50"
                      keyTimes="0; 0.35; 0.79; 1"
                      keyPoints="0; 0; 1; 1"
                    />
                    <animate
                      attributeName="opacity"
                      values="0; 0; 1; 1; 0; 0"
                      keyTimes="0; 0.34; 0.39; 0.77; 0.82; 1"
                      dur="3.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>

                {/* Radiant Ambient Glow when converged */}
                <motion.div
                  animate={{
                    opacity: [0.15, 0.15, 0.8, 0.3, 0.15],
                    scale: [1, 1, 1.4, 1.1, 1]
                  }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    times: [0, 0.55, 0.72, 0.88, 1],
                    ease: 'easeInOut'
                  }}
                  className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(3,150,166,0.45)_0%,_transparent_70%)] blur-md pointer-events-none"
                />
                <Brain 
                  className="w-8 h-8 sm:w-9 sm:h-9 relative z-10 transition-colors duration-500 text-[#0396A6]" 
                  strokeWidth={2.5} 
                />
              </motion.div>
              
              {/* Text Label positioned cleanly below without offsetting the middle alignment */}
              <span className="absolute top-[calc(100%+6px)] text-[9.5px] font-bold text-slate-700 text-center leading-tight w-[140px] tracking-wider uppercase pointer-events-none">
                Shared contextual memory
              </span>
            </div>
          </motion.div>

          {/* RIGHT: WHATSAPP AGENT CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative z-10 lg:pl-4 group cursor-pointer perspective-1000"
            onMouseEnter={() => setActive('inbound')}
            onMouseLeave={() => setActive(null)}
          >
            <motion.div 
              className="h-full rounded-xl p-3.5 sm:p-4 lg:p-4 flex flex-col transition-all duration-500 overflow-hidden relative bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
              whileHover={{ scale: 1.02, rotateY: -2, rotateX: 2 }}
              style={{
                borderColor: active === 'inbound' || isGlowing ? '#10B981' : '#E2E8F0',
                boxShadow: isGlowing
                  ? '0 0 40px rgba(16,185,129,0.15), 0 0 0 4px rgba(16,185,129,0.08)'
                  : active === 'inbound' 
                  ? '0 20px 40px -10px rgba(16,185,129,0.12), 0 0 0 4px rgba(16,185,129,0.06)' 
                  : '0 4px 20px rgba(0,0,0,0.03)',
              }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                  <motion.div 
                    animate={{ scale: active === 'inbound' ? 1.1 : 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <img loading="lazy" decoding="async" src="/whatsapp.png" alt="WhatsApp" className="w-6 h-6 object-contain shrink-0" />
                  </motion.div>
                  <div className="px-2 py-0.5 rounded-full bg-green-50 text-[9px] font-bold text-green-700 tracking-wider uppercase border border-green-200">
                    WHATSAPP AGENT
                  </div>
                </div>

                <h3 className="text-sm sm:text-[15px] font-bold text-green-700 mb-1">
                  WhatsApp Conversation Agent
                </h3>
                <p className="text-[11.5px] sm:text-xs text-slate-600 leading-normal mb-2.5 sm:mb-3">
                  Picks up with full context, handles voice notes, and understands romanised Hinglish the way customers actually type.
                </p>
              </div>

              <div className="mt-auto pt-2 border-t border-slate-100 relative z-10">
                <p className="text-[9px] font-bold tracking-wider uppercase text-slate-500">
                  FOR: 24/7 WHATSAPP ENGAGEMENT • LEAD NURTURE • SUPPORT
                </p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
