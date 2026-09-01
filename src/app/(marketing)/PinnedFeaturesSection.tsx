"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import FrostyIcon from '@/components/FrostyIcon';
import { motion, AnimatePresence, useInView } from "framer-motion";

const CHAT_DATA = {
  website: [
    { 
      from: 'bot', 
      text: (
        <span className="flex items-center gap-1.5">
          Hi! How can I help you today?
          <svg viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.82-2.82L7 15" />
          </svg>
        </span>
      )
    },
    { from: 'user', text: "I'd like to schedule a demo" },
    { from: 'bot', text: "Fantastic! Here's a link to my calendar." },
  ],
  whatsapp: [
    { 
      from: 'bot', 
      text: (
        <span className="flex items-center gap-1.5">
          Hello! I'm your Frosty AI assistant
          <svg viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.82-2.82L7 15" />
          </svg>
          How can I help?
        </span>
      )
    },
    { from: 'user', text: "What are your pricing plans?" },
    { from: 'bot', text: "Our plans start at $49/mo. Should I send over the pricing PDF?" },
  ]
};

function AnimatedChat({ channel, isActive = true }: { channel: 'website' | 'whatsapp', isActive?: boolean }) {
  const [visibleMsgs, setVisibleMsgs] = useState<number>(0);
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // trigger animation when it comes into view (-150px margin so it plays exactly when you see the card)
  const isInView = useInView(containerRef, { margin: "0px 0px -150px 0px" });

  useEffect(() => {
    let isCancelled = false;
    setVisibleMsgs(0);
    setIsTyping(false);

    if (!isInView || !isActive) return;

    const runSequence = async () => {
      // Small initial delay
      await new Promise(r => setTimeout(r, 400));
      if (isCancelled) return;
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 500));
      if (isCancelled) return;
      setIsTyping(false);
      setVisibleMsgs(1); // bot msg 1

      // Wait for user reply
      await new Promise(r => setTimeout(r, 900));
      if (isCancelled) return;
      setVisibleMsgs(2); // user msg 2

      // Bot thinks
      await new Promise(r => setTimeout(r, 500));
      if (isCancelled) return;
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 1000));
      if (isCancelled) return;
      setIsTyping(false);
      setVisibleMsgs(3); // bot msg 3
    };

    runSequence();
    return () => { isCancelled = true; };
  }, [channel, isInView, isActive]);

  const msgs = CHAT_DATA[channel];

  return (
    <div ref={containerRef} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 160, background: channel === 'whatsapp' ? 'var(--card-bg)' : 'transparent' }}>
      <AnimatePresence>
        {msgs.slice(0, visibleMsgs).map((msg, i) => (
          <motion.div 
            key={`${channel}-${i}`} 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}
          >
            <div style={{ 
              maxWidth: '85%', padding: '8px 12px', borderRadius: 10, fontSize: 11.5, 
              background: msg.from === 'bot' 
                ? 'var(--panel-header)' 
                : (channel === 'whatsapp' ? 'rgba(37,211,102,0.18)' : 'rgba(3, 150, 166,0.2)'),
              color: msg.from === 'bot' ? 'var(--text-body)' : 'var(--text-primary)', 
              border: `1px solid ${msg.from === 'bot' 
                ? 'var(--border)' 
                : (channel === 'whatsapp' ? 'rgba(37,211,102,0.25)' : 'rgba(3, 150, 166,0.3)')}` 
            }}>
              {msg.text}
            </div>
          </motion.div>
        ))}
        {isTyping && (
           <motion.div 
            key="typing"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            style={{ display: 'flex', justifyContent: 'flex-start' }}
          >
            <div style={{ 
              padding: '10px 14px', borderRadius: 10, 
              background: 'var(--panel-header)',
              border: '1px solid var(--border)',
              display: 'flex', gap: 4, alignItems: 'center', height: 35
            }}>
              <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)' }} />
              <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)' }} />
              <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

gsap.registerPlugin(useGSAP, ScrollTrigger);

function AnimatedModelCard({ isActive = true }: { isActive?: boolean }) {
  const models = ['gemini-3.5-flash', 'gemini-2.5-flash'] as const;
  const [activeModel, setActiveModel] = useState<(typeof models)[number]>('gemini-3.5-flash');
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "0px 0px -150px 0px" });

  useEffect(() => {
    if (!isInView || !isActive) return;
    const interval = setInterval(() => {
      setActiveModel(prev => prev === 'gemini-3.5-flash' ? 'gemini-2.5-flash' : 'gemini-3.5-flash');
    }, 2800);
    return () => clearInterval(interval);
  }, [isInView, isActive]);

  return (
    <div ref={containerRef}>
      <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>Your model. Your choice.</h3>
      <p style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 28 }}>
        Per-tenant Gemini model selection. Switch anytime — billing adjusts per token rate.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--bg-layer-3)', border: '1px solid var(--border)', borderRadius: 100, padding: 4, marginBottom: 28, width: 'fit-content' }}>
        {models.map((m) => (
          <button
            key={m}
            onClick={() => setActiveModel(m)}
            style={{
              position: 'relative',
              padding: '6px 18px', borderRadius: 100, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              background: 'transparent',
              color: activeModel === m ? '#FFB09F' : 'var(--text-muted)', letterSpacing: '0.05em' }}
          >
            {activeModel === m && (
              <motion.div 
                layoutId="model_pill_bg"
                style={{ position: 'absolute', inset: 0, background: 'rgba(3, 150, 166,0.2)', borderRadius: 100, zIndex: 0 }} 
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>
              {m === 'gemini-3.5-flash' ? '✦ Gemini 3.5' : '✦ Gemini 2.5'}
            </span>
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {(activeModel === 'gemini-3.5-flash'
          ? [{ label: 'Input', val: '$0.075 / 1M' }, { label: 'Output', val: '$0.30 / 1M' }]
          : [{ label: 'Input', val: '$0.10 / 1M' }, { label: 'Output', val: '$0.40 / 1M' }]
        ).map((s) => (
          <div key={s.label} style={{ background: 'var(--bg-layer-3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', overflow: 'hidden' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label} tokens</div>
            <div style={{ position: 'relative', height: 22 }}>
              <AnimatePresence mode="popLayout">
                <motion.div 
                  key={s.val}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
                  style={{ fontSize: 15, fontWeight: 700, color: '#FFB09F', display: 'flex', alignItems: 'center', position: 'absolute', top: 0, left: 0 }}
                >
                  {s.val}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimatedToolsCard({ isActive = true }: { isActive?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "0px 0px -150px 0px" });
  const [timeline, setTimeline] = useState<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    const tools = gsap.utils.toArray('.tool-item', containerRef.current);
    if (!tools.length) return;

    // Set 3D perspective so Z-translations look correct
    gsap.set(tools, { transformPerspective: 800 });

    const master = gsap.timeline({ repeat: -1 });

    tools.forEach((tool: any, i) => {
      master.to(tool, {
        scale: 1.05,
        z: 40,
        rotationX: -10,
        boxShadow: '0 20px 40px rgba(99, 90, 128, 0.2), inset 0 0 20px rgba(99, 90, 128, 0.1)',
        borderColor: 'rgba(99, 90, 128, 0.6)',
        duration: 0.35,
        ease: "back.out(2)"
      }, i * 1.0) // sequential stagger
      .to(tool, {
        scale: 1,
        z: 0,
        rotationX: 0,
        boxShadow: 'inset 0 0 20px rgba(255,255,255,0.02)',
        borderColor: 'transparent',
        duration: 0.4,
        ease: "power2.inOut"
      }, "+=0.15"); // Hold the highlight out for 0.15s
    });

    setTimeline(master);

    // Gently float icons independently
    gsap.to('.tool-icon', {
      y: -6,
      duration: 1.1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: {
        amount: 0.5,
        from: "random"
      }
    });

  }, { scope: containerRef });

  useEffect(() => {
    if (timeline) {
      if (isInView && isActive) {
        timeline.play();
      } else {
        timeline.pause();
      }
    }
  }, [isInView, isActive, timeline]);

  return (
    <div ref={containerRef}>
      <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>Tools that take action.</h3>
      <p style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 28 }}>
        Frosty doesn&apos;t just respond — it acts. Connected tools mean real outcomes, not just conversation.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, perspective: '1000px' }}>
        {[
          { 
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ), 
            name: 'Google Calendar', 
            desc: 'Book appointments' 
          },
          { 
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            ), 
            name: 'Gmail', 
            desc: 'Send follow-ups' 
          },
          { 
            icon: (
              <svg viewBox="0 0 24 24" className="w-6 h-6">
          <path fill="currentColor" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.188 8.188 0 01-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.39-.12-.56.12-.16.25-.64.82-.78.99-.15.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.12-.24-.01-.39.11-.5.11-.11.25-.27.37-.41.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.11-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01z"/>
        </svg>
            ), 
            name: 'WhatsApp', 
            desc: 'Message directly' 
          },
          { 
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            ), 
            name: 'Slack', 
            desc: 'Notify your team' 
          },
        ].map((tool) => (
          <div 
            key={tool.name} 
            className="tool-item" 
            style={{ 
              background: 'var(--bg-layer-3)', 
              border: '1px solid transparent', 
              borderRadius: 16, 
              padding: 14, 
              textAlign: 'center', 
              boxShadow: 'inset 0 0 20px rgba(255,255,255,0.02)',
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="tool-icon" style={{ fontSize: 28, marginBottom: 12, display: 'inline-block' }}>{tool.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0396A6', marginBottom: 4, letterSpacing: '0.5px' }}>{tool.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tool.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimatedLeadCard({ isActive = true }: { isActive?: boolean }) {
  const [step, setStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "0px 0px -150px 0px" });

  useEffect(() => {
    if (!isInView || !isActive) {
      setStep(0);
      return;
    }
    
    let isCancelled = false;
    const run = async () => {
      while (!isCancelled) {
        setStep(0);
        await new Promise(r => setTimeout(r, 500));
        if (isCancelled) break;
        
        // Step 1: User message appears
        setStep(1);
        await new Promise(r => setTimeout(r, 800));
        if (isCancelled) break;
        
        // Step 2: Bot replies
        setStep(2);
        await new Promise(r => setTimeout(r, 500));
        if (isCancelled) break;
        
        // Step 3: Extracting & Pulse
        setStep(3);
        await new Promise(r => setTimeout(r, 400));
        if (isCancelled) break;
        
        // Step 4: CRM Success
        setStep(4);
        await new Promise(r => setTimeout(r, 2200));
      }
    };
    run();
    return () => { isCancelled = true; };
  }, [isInView]);

  return (
    <div ref={containerRef}>
      <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>Lead generation on autopilot.</h3>
      <p style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 24 }}>
        Frosty intelligently identifies contact information and intent during natural conversations, automatically syncing qualified leads directly to your dashboard.
      </p>
      
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        
        {/* Chat Side */}
        <div style={{ flex: 1, background: 'var(--bg-layer-3)', borderRadius: 16, border: '1px solid var(--border)', padding: 16, minHeight: 120 }}>
          <AnimatePresence mode="popLayout">
            {step >= 1 && (
              <motion.div 
                key="user-msg"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}
              >
                <div style={{ background: 'rgba(3, 150, 166,0.2)', color: 'var(--text-primary)', border: '1px solid rgba(3, 150, 166,0.3)', padding: '8px 12px', borderRadius: 10, fontSize: 11.5 }}>
                  Yes, please call me at <span style={{ color: '#0396A6', fontWeight: 600 }}>555-0192</span> to discuss the enterprise plan.
                </div>
              </motion.div>
            )}
            {step >= 2 && (
               <motion.div 
               key="bot-msg"
               initial={{ opacity: 0, y: 10, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               style={{ display: 'flex', justifyContent: 'flex-start' }}
             >
               <div style={{ background: 'var(--panel-header)', color: 'var(--text-body)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 10, fontSize: 11.5 }}>
                 Got it! I&apos;ve noted your number. Our sales team will reach out shortly.
               </div>
             </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sync Arrow Flow */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: 40 }}>
          <motion.div 
             animate={{ opacity: step === 3 ? [0.2, 1, 0.2] : 0.2, scale: step === 3 ? [1, 1.2, 1] : 1 }}
             transition={{ duration: 0.6, repeat: step === 3 ? Infinity : 0 }}
             style={{ width: '100%', height: 2, background: step >= 4 ? '#22c55e' : '#0396A6', position: 'absolute' }} 
          />
          <motion.div 
             initial={{ x: -10, opacity: 0 }}
             animate={step === 3 ? { x: 10, opacity: [0, 1, 0] } : { x: 0, opacity: 0 }}
             transition={{ duration: 0.8, repeat: step === 3 ? Infinity : 0 }}
             style={{ position: 'absolute', fontSize: 18, color: '#0396A6' }}
          >
            ▶
          </motion.div>
        </div>

        {/* Dashboard CRM Card */}
        <div style={{ 
          width: 200, background: 'var(--bg-layer-3)', borderRadius: 16, padding: 16,
          border: `1px solid ${step >= 4 ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
          boxShadow: step >= 4 ? '0 0 20px rgba(34,197,94,0.15)' : 'none',
          transition: 'all 0.4s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Lead CRM</div>
            <motion.div 
               animate={{ rotate: step >= 4 ? [0, 180, 360] : 0 }}
               transition={{ duration: 1, ease: 'easeInOut' }}
               style={{ 
                 width: 12, height: 12, borderRadius: '50%', 
                 borderWidth: 2, borderStyle: 'solid', 
                 borderTopColor: 'transparent',
                 borderRightColor: step >= 4 ? '#22c55e' : 'var(--border)',
                 borderBottomColor: step >= 4 ? '#22c55e' : 'var(--border)',
                 borderLeftColor: step >= 4 ? '#22c55e' : 'var(--border)'
               }} 
            />
          </div>
          
          <div style={{ opacity: step >= 4 ? 1 : 0.2, transition: 'opacity 0.4s', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Enterprise Inquiry</div>
            <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', color: '#9ca3af' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span> 
              555-0192
            </div>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={step >= 4 ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              style={{ display: 'inline-block', background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, width: 'fit-content', marginTop: 4 }}
            >
              SYNCED ✓
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PinnedFeaturesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftTextRef = useRef<HTMLDivElement>(null);
  const rightCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const whatsappTabRef = useRef<HTMLButtonElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const hasSwitchedAuto = useRef(false);

  // State from the old Unified Engine Section
  const [activeChannel, setActiveChannel] = useState<'website' | 'whatsapp'>('website');
  const [activeIndex, setActiveIndex] = useState(0);

  useGSAP(() => {
    // Create a master timeline that controls the pin and the card reveals
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=2400", // Provide slightly more scrolling distance for 4 cards
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          // 4 cards total. Card 1 animates from 0 - 0.33
          if (p < 0.15) setActiveIndex(0);
          else if (p < 0.48) setActiveIndex(1);
          else if (p < 0.81) setActiveIndex(2);
          else setActiveIndex(3);
        }
      }
    });

    // --- Interactive Channel Switch (WhatsApp Click) ---
    // Only triggers once per "visit" to activeIndex 0
    if (activeIndex === 0 && activeChannel === 'website' && !hasSwitchedAuto.current) {
      hasSwitchedAuto.current = true;
      
      const autoTimeline = gsap.timeline({ delay: 3 });

      // 1. Reveal and Set Start Position (Bottom Right of card)
      gsap.set(cursorRef.current, { x: 400, y: 150, opacity: 0 }); // Relative to button container
      autoTimeline.to(cursorRef.current, { opacity: 1, duration: 0.4 });
      
      autoTimeline.to(cursorRef.current, {
        x: (whatsappTabRef.current?.offsetLeft || 0) + 40,
        y: (whatsappTabRef.current?.offsetTop || 0) + 15,
        duration: 1.2,
        ease: "power3.inOut"
      });

      // 2. Click Animation
      autoTimeline.to(cursorRef.current, { scale: 0.8, duration: 0.1 });
      autoTimeline.to(whatsappTabRef.current, { scale: 0.96, duration: 0.1 }, "<");
      
      // 3. Release and Switch
      autoTimeline.to(cursorRef.current, { scale: 1, duration: 0.1, delay: 0.15 });
      autoTimeline.to(whatsappTabRef.current, { 
        scale: 1, 
        duration: 0.1,
        onComplete: () => setActiveChannel('whatsapp')
      }, "<");

      // 4. Cleanup
      autoTimeline.to(cursorRef.current, { opacity: 0, duration: 0.4, delay: 0.5 });
    }

    // Reset logic: If we scroll far away, allow the demo to run again later
    if (activeIndex > 1) {
      hasSwitchedAuto.current = false;
      setActiveChannel('website'); // Optional: reset state for next visit
    }

    // Animate the cards dropping in sequentially
    rightCardsRef.current.forEach((card, index) => {
      if (!card) return;
      
      if (index === 0) {
        // The first card should be immediately visible or have a very short intro
        // so the screen doesn't look blank when the pin starts.
        tl.from(card, { 
          y: 50, 
          opacity: 0, 
          duration: 0.5 
        });
      } else {
        // Subsequent cards fly up from below the screen over the first card
        tl.from(card, { 
          y: window.innerHeight, 
          opacity: 0, 
          scale: 0.95, 
          duration: 1 
        }, "-=0.2");
      }
    });

    // Professional Entrance Animation for the Left Text Elements
    const revealElements = gsap.utils.toArray('.left-reveal', leftTextRef.current);
    if (revealElements.length > 0) {
      gsap.fromTo(revealElements, 
        { 
          y: 40, 
          opacity: 0,
          filter: 'blur(10px)' // Signature premium blur entrance
        }, 
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 1.2,
          stagger: 0.2, // cascades the reveals
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 65%', // Begin animation when the section is moving up into center-view
            toggleActions: 'play none none reverse', // Rewinds gracefully if user scrolls up fast
          }
        }
      );
    }
  }, { scope: containerRef });

  // Refresh ScrollTrigger when dynamic components (like Hero) load and shift layout
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      ScrollTrigger.refresh();
    });
    ro.observe(document.body);
    const timer = setTimeout(() => ScrollTrigger.refresh(), 500);
    
    return () => {
      ro.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <section ref={containerRef} className="h-screen w-full flex items-center justify-between overflow-hidden relative" style={{ background: 'transparent', padding: '0 6%' }}>
      
      {/* Left Pinned Text */}
      <div ref={leftTextRef} style={{ width: '45%', paddingRight: '40px' }}>
        <div className="left-reveal" style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          backdropFilter: 'blur(10px)',
          borderRadius: 100, padding: '6px 16px 6px 6px',
          marginBottom: 24, boxShadow: '0 0 20px rgba(99, 90, 128, 0.05)'
        }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px' }}>
            <FrostyIcon size={20} glow={0} />
          </div>
          <span style={{ 
            fontSize: 10, letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', 
            textTransform: 'uppercase', fontWeight: 700 
          }}>
            Anatomy Indicator
          </span>
        </div>
        <h2 className="left-reveal" style={{
          fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800,
          color: 'white', marginBottom: 24, lineHeight: 1.1, letterSpacing: '-1.5px'
        }}>
          Interact. Think. <br/> 
          <span style={{ 
            color: 'transparent', 
            backgroundClip: 'text', WebkitBackgroundClip: 'text',
            backgroundImage: 'linear-gradient(90deg, #0066FF, #0396A6)'
          }}>
            Execute. Convert.
          </span>
        </h2>
        <p className="left-reveal" style={{ fontSize: 18, color: 'var(--text-body)', lineHeight: 1.7 }}>
          Scroll to explore the complete anatomy of an autonomous agent. Watch how Frosty handles omni-channel conversations, routes logic through frontier AI models, triggers your tech stack, and puts lead capture on autopilot.
        </p>
      </div>

      {/* Right Stacking Cards */}
      <div style={{ width: '55%', position: 'relative', height: '600px', display: 'flex', alignItems: 'center' }}>
        
        {/* Card 1: Channels */}
        <div 
          ref={(el) => { rightCardsRef.current[0] = el; }}
          style={{
            position: 'absolute', top: '10%', left: 0, width: '100%', height: 480,
            background: 'var(--card-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border)', borderRadius: 24, padding: 40,
            boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            zIndex: 1
          }}
        >
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
            Two channels. One conversation.
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 28 }}>
            Deploy on your website and WhatsApp from a single dashboard. The same AI, same knowledge base, same persona — everywhere your customers are.
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, position: 'relative' }}>
            <button
              className={`ch-pill ${activeChannel === 'website' ? 'active' : 'inactive'}`}
              onClick={() => setActiveChannel('website')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Website
            </button>
            <button
              ref={whatsappTabRef}
              className={`ch-pill ${activeChannel === 'whatsapp' ? 'active' : 'inactive'}`}
              onClick={() => setActiveChannel('whatsapp')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
          <path fill="currentColor" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.188 8.188 0 01-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.39-.12-.56.12-.16.25-.64.82-.78.99-.15.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.12-.24-.01-.39.11-.5.11-.11.25-.27.37-.41.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.11-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01z"/>
        </svg>
              WhatsApp
            </button>

            {/* Mock Cursor */}
            <div 
              ref={cursorRef}
              style={{
                position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: 100,
                transform: 'translate(-50%, -50%)', top: 0, left: 0
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>
                <path d="M4 4l7.07 17 2.51-7.39L21 11.07z" fill="white" stroke="#1C1C1C" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          {activeChannel === 'website' ? (
            <div style={{ background: 'var(--bg-layer-3)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ background: 'var(--panel-header)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
                <div style={{ flexShrink: 0, padding: '2px', marginRight: '8px' }}>
                  <FrostyIcon size={14} glow={0} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Frosty Assistant</div>
                  <div style={{ fontSize: 10, color: '#22C55E' }}>● Online</div>
                </div>
              </div>
              <AnimatedChat channel="website" isActive={activeIndex === 0} />
            </div>
          ) : (
            <div style={{ background: 'var(--bg-layer-3)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ background: 'var(--panel-header)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
          <path fill="currentColor" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.188 8.188 0 01-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.39-.12-.56.12-.16.25-.64.82-.78.99-.15.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.12-.24-.01-.39.11-.5.11-.11.25-.27.37-.41.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.11-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01z"/>
        </svg>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Frosty on WhatsApp</div>
                  <div style={{ fontSize: 10, color: '#22C55E' }}>● Online</div>
                </div>
              </div>
              <AnimatedChat channel="whatsapp" isActive={activeIndex === 0} />
            </div>
          )}
        </div>

        {/* Card 2: AI Models */}
        <div 
          ref={(el) => { rightCardsRef.current[1] = el; }}
          style={{
            position: 'absolute', top: '15%', left: 0, width: '100%', height: 480,
            background: 'var(--card-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border)', borderRadius: 24, padding: 40,
            boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            zIndex: 2
          }}
        >
          <AnimatedModelCard isActive={activeIndex === 1} />
        </div>

        {/* Card 3: Tools & Integration */}
        <div 
          ref={(el) => { rightCardsRef.current[2] = el; }}
          style={{
            position: 'absolute', top: '20%', left: 0, width: '100%', height: 480,
            background: 'var(--card-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border)', borderRadius: 24, padding: 40,
            boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            zIndex: 3
          }}
        >
          <AnimatedToolsCard isActive={activeIndex === 2} />
        </div>

        {/* Card 4: White Label Terminal -> Lead Generation */}
        <div 
          ref={(el) => { rightCardsRef.current[3] = el; }}
          style={{
            position: 'absolute', top: '25%', left: 0, width: '100%', height: 480,
            background: 'var(--card-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border)', borderRadius: 24, padding: 40,
            boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            zIndex: 4
          }}
        >
          <AnimatedLeadCard isActive={activeIndex === 3} />
        </div>

      </div>

    </section>
  );
}
