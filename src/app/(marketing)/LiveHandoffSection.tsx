'use client';

import React, { useEffect } from 'react';
import { motion, useAnimate, useInView } from 'framer-motion';
import FrostyIcon from '@/components/FrostyIcon';

export default function LiveHandoffSection() {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: true, margin: "0px 0px -300px 0px" });

  useEffect(() => {
    if (!isInView) return;
    let isSubscribed = true;
    let currentTimer: NodeJS.Timeout;

    const sleep = (ms: number) => new Promise(resolve => {
      currentTimer = setTimeout(resolve, ms);
    });

    const sequence = async () => {
      // Small buffer to ensure DOM is hydration complete
      await sleep(800);

      const fireTriplePulse = async (baseClass: string, isLeft: boolean = false) => {
        const promises: Promise<any>[] = [];
        const xTarget = isLeft ? -220 : 220;
        
        for (let i = 0; i < 3; i++) {
          const cls = `.${baseClass}-${i}`;
          const p = new Promise<void>(async (resolve) => {
            await sleep(i * 60);
            animate(cls, { display: 'flex' }, { duration: 0 });
            animate(cls, { opacity: 1 }, { duration: 0.15 });
            await animate(cls, { x: xTarget }, { duration: 0.75, ease: "easeInOut" });
            animate(cls, { opacity: 0 }, { duration: 0.1 });
            animate(cls, { display: 'none', x: 0 }, { duration: 0 });
            resolve();
          });
          promises.push(p);
        }
        await Promise.all(promises);
      };

      while (isSubscribed) {
        try {
          // --- 0. RESET STATE ---
          animate('.ai-typing', { opacity: 0, display: 'none' }, { duration: 0 });
          animate('.ai-bubble', { opacity: 0, y: 10, display: 'none' }, { duration: 0 });
          animate('.right-ai-msg', { opacity: 0, y: 5, display: 'none' }, { duration: 0 });
          
          animate('.admin-btn', { 
            background: 'rgba(255,255,255,0.05)', color: 'var(--text-body)', borderColor: 'var(--border)', boxShadow: 'none' 
          }, { duration: 0 });
          
          animate('.user-msg-left', { opacity: 0, y: 10, display: 'none' }, { duration: 0 });
          animate('.user-msg-right', { opacity: 0, y: 10, display: 'none' }, { duration: 0 });
          
          animate('.admin-badge', { opacity: 0, scale: 0.95, display: 'none' }, { duration: 0 });
          animate('.admin-msg-right', { opacity: 0, y: 10, display: 'none' }, { duration: 0 });
          animate('.admin-msg-left', { opacity: 0, y: 10, display: 'none' }, { duration: 0 });
          animate('.typing-right', { opacity: 0, display: 'none' }, { duration: 0 });
          
          // Reset all triple packets
          ['packet-to-console', 'packet-to-widget', 'packet-user-msg', 'packet-autopilot'].forEach(base => {
            for(let i=0; i<3; i++) {
              animate(`.${base}-${i}`, { opacity: 0, display: 'none', x: 0 }, { duration: 0 });
            }
          });
          
          animate('.fake-cursor', { opacity: 0, y: 30, x: 30, scale: 1 }, { duration: 0 });
          animate('.ai-paused-tooltip', { opacity: 0, scale: 0.8, y: 10 }, { duration: 0 });
          animate('.btn-state-takeover', { opacity: 1, display: 'flex' }, { duration: 0 });
          animate('.btn-state-return', { opacity: 0, display: 'none' }, { duration: 0 });

          animate('.right-session-box', { borderLeftColor: 'transparent', background: 'transparent' }, { duration: 0 });
          animate('.status-ai', { display: 'inline-block' }, { duration: 0 });
          animate('.status-human', { display: 'none' }, { duration: 0 });

          await sleep(50);
          if (!isSubscribed) break;
          await sleep(1000);

          // --- 1. USER SENDS MSG ---
          animate('.user-msg-left', { display: 'flex' }, { duration: 0 });
          await animate('.user-msg-left', { opacity: 1, y: 0 }, { duration: 0.4, type: 'spring' });

          await fireTriplePulse('packet-user-msg');

          animate('.user-msg-right', { display: 'flex' }, { duration: 0 });
          await animate('.user-msg-right', { opacity: 1, y: 0 }, { duration: 0.4, type: 'spring' });

          // --- 2. AI TYPES, THEN RESPONDS ---
          animate('.ai-typing', { display: 'flex' }, { duration: 0 });
          animate('.ai-typing', { opacity: 1 }, { duration: 0.2 });
          await sleep(1500);
          if (!isSubscribed) break;
          
          animate('.ai-typing', { opacity: 0 }, { duration: 0.2 }).then(() => {
            animate('.ai-typing', { display: 'none' }, { duration: 0 });
          });
          
          animate('.ai-bubble', { display: 'flex' }, { duration: 0 });
          await animate('.ai-bubble', { opacity: 1, y: 0 }, { duration: 0.4, type: 'spring' });
          
          await fireTriplePulse('packet-to-console');

          animate('.right-ai-msg', { display: 'flex' }, { duration: 0 });
          animate('.right-ai-msg', { opacity: 1, y: 0 }, { duration: 0.4 });
          
          await sleep(1000);

          // --- 3. ADMIN TAKES OVER ---
          animate('.fake-cursor', { opacity: 1, y: -45, x: -160 }, { duration: 0.6, ease: "easeOut" });
          await sleep(600);

          animate('.fake-cursor', { scale: 0.85 }, { duration: 0.1 });
          animate('.admin-btn', { scale: 0.96, background: 'rgba(3, 150, 166,0.3)', borderColor: 'rgba(3, 150, 166,0.5)' }, { duration: 0.1 });
          await sleep(150);

          animate('.fake-cursor', { scale: 1 }, { duration: 0.1 });
          animate('.admin-btn', { 
            scale: 1,
            background: 'rgba(3, 150, 166,0.15)', 
            color: '#FFB09F', 
            borderColor: 'rgba(3, 150, 166,0.5)',
            boxShadow: '0 0 20px rgba(3, 150, 166,0.3)'
          }, { duration: 0.2 });
          
          animate('.btn-state-takeover', { opacity: 0, display: 'none' }, { duration: 0 });
          animate('.btn-state-return', { opacity: 1, display: 'flex' }, { duration: 0 });
          animate('.ai-paused-tooltip', { opacity: 1, scale: 1, y: 0 }, { duration: 0.4, type: 'spring' });

          await sleep(400);
          animate('.fake-cursor', { opacity: 0, y: -20, x: -180 }, { duration: 0.4 });

          animate('.status-ai', { display: 'none' }, { duration: 0 });
          animate('.status-human', { display: 'inline-block' }, { duration: 0 });
          animate('.right-session-box', { borderLeftColor: '#ef4444', background: 'rgba(239,68,68,0.05)' }, { duration: 0.3 });

          animate('.admin-badge', { display: 'flex' }, { duration: 0 });
          await animate('.admin-badge', { opacity: 1, scale: 1 }, { duration: 0.4, type: 'spring' });

          await sleep(800);

          // --- 4. ADMIN TYPES ON RIGHT ---
          animate('.typing-right', { opacity: 1, display: 'inline-block' }, { duration: 0.2 });
          await sleep(1800);
          animate('.typing-right', { opacity: 0 }, { duration: 0.2 }).then(() => {
            animate('.typing-right', { display: 'none' }, { duration: 0 });
          });

          animate('.admin-msg-right', { display: 'flex' }, { duration: 0 });
          await animate('.admin-msg-right', { opacity: 1, y: 0 }, { duration: 0.4, type: 'spring' });

          await fireTriplePulse('packet-to-widget', true);

          // --- 5. HUMAN MSG PUSHED TO LEFT WIDGET ---
          animate('.admin-msg-left', { display: 'flex' }, { duration: 0 });
          await animate('.admin-msg-left', { opacity: 1, y: 0 }, { duration: 0.4, type: 'spring' });

          // --- 6. HAND BACK TO AI ---
          await sleep(2000);
          animate('.fake-cursor', { opacity: 1, y: -45, x: -160, scale: 1 }, { duration: 0.6, ease: "easeOut" });
          await sleep(600);

          animate('.fake-cursor', { scale: 0.85 }, { duration: 0.1 });
          animate('.admin-btn', { scale: 0.96, background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border)' }, { duration: 0.1 });
          await sleep(150);

          animate('.fake-cursor', { scale: 1 }, { duration: 0.1 });
          animate('.admin-btn', { 
            scale: 1,
            background: 'rgba(255,255,255,0.05)', 
            color: 'var(--text-body)', 
            borderColor: 'var(--border)',
            boxShadow: 'none'
          }, { duration: 0.2 });

          animate('.ai-paused-tooltip', { opacity: 0, scale: 0.8, y: 10 }, { duration: 0.3 });
          animate('.btn-state-return', { opacity: 0, display: 'none' }, { duration: 0 });
          animate('.btn-state-takeover', { opacity: 1, display: 'flex' }, { duration: 0 });

          animate('.status-human', { display: 'none' }, { duration: 0 });
          animate('.status-ai', { display: 'inline-block' }, { duration: 0 });
          animate('.right-session-box', { borderLeftColor: 'transparent', background: 'transparent' }, { duration: 0.3 });

          await sleep(400);
          animate('.fake-cursor', { opacity: 0, y: -20, x: -180 }, { duration: 0.4 });

          await fireTriplePulse('packet-autopilot', true);

          animate('.ai-typing', { opacity: 1, display: 'flex' }, { duration: 0.2 });
          await sleep(1500);
          animate('.ai-typing', { opacity: 0 }, { duration: 0.2 });

          await sleep(4000);
        } catch (error) {
          if (!isSubscribed) break;
          await sleep(1000);
        }
      }
    };
    sequence();

    return () => {
      isSubscribed = false;
    };
  }, [animate, isInView]);

  return (
    <div ref={scope} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: 0, alignItems: 'stretch' }}>

      {/* CENTER CHANNEL — Packet animation lane, col 2 */}
      <div style={{ position: 'relative', zIndex: 20, pointerEvents: 'none', gridColumn: '2', gridRow: '1' }}>
        {/* Subtle center divider line */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'rgba(255,255,255,0.04)', transform: 'translateX(-50%)' }} />

        {/* Data Packets — staggered triple pulses */}
        {/* User Msg -> Right */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={`user-p-${i}`}
            className={`packet-user-msg-${i}`}
            style={{
              position: 'absolute', left: '50%', top: `calc(50% + ${(i - 1) * 8}px)`,
              transform: 'translate(-50%, -50%)',
              opacity: 0, display: 'none',
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 100, padding: i === 1 ? '4px 10px' : '3px 6px',
              boxShadow: '0 0 12px rgba(255,255,255,0.15)',
              color: '#fff', fontSize: 9.5, fontWeight: 700,
              backdropFilter: 'blur(4px)', whiteSpace: 'nowrap'
            }}>
            {i === 1 ? <span>→</span> : null}
          </motion.div>
        ))}

        {/* Bot -> Right */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={`bot-p-${i}`}
            className={`packet-to-console-${i}`}
            style={{
              position: 'absolute', left: '50%', top: `calc(50% + ${(i - 1) * 8}px)`,
              transform: 'translate(-50%, -50%)',
              opacity: 0, display: 'none',
              background: 'rgba(3, 150, 166,0.2)', border: '1px solid rgba(3, 150, 166,0.45)',
              borderRadius: 100, padding: i === 1 ? '4px 10px' : '3px 6px',
              boxShadow: '0 0 16px rgba(3, 150, 166,0.35)',
              color: '#FFB09F', fontSize: 9.5, fontWeight: 700,
              backdropFilter: 'blur(4px)', whiteSpace: 'nowrap'
            }}>
            {i === 1 ? <span>→</span> : null}
          </motion.div>
        ))}

        {/* Human -> Left */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={`human-p-${i}`}
            className={`packet-to-widget-${i}`}
            style={{
              position: 'absolute', left: '50%', top: `calc(50% + ${(i - 1) * 8}px)`,
              transform: 'translate(-50%, -50%)',
              opacity: 0, display: 'none',
              background: 'rgba(3, 150, 166,0.2)', border: '1px solid rgba(3, 150, 166,0.45)',
              borderRadius: 100, padding: i === 1 ? '4px 10px' : '3px 6px',
              boxShadow: '0 0 16px rgba(3, 150, 166,0.35)',
              color: '#A5B4FC', fontSize: 9.5, fontWeight: 700,
              backdropFilter: 'blur(4px)', whiteSpace: 'nowrap'
            }}>
            {i === 1 ? <span>←</span> : null}
          </motion.div>
        ))}

        {/* Resuming -> Left */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={`resume-p-${i}`}
            className={`packet-autopilot-${i}`}
            style={{
              position: 'absolute', left: '50%', top: `calc(50% + ${(i - 1) * 8}px)`,
              transform: 'translate(-50%, -50%)',
              opacity: 0, display: 'none',
              background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.45)',
              borderRadius: 100, padding: i === 1 ? '4px 10px' : '3px 6px',
              boxShadow: '0 0 16px rgba(16,185,129,0.35)',
              color: '#6EE7B7', fontSize: 9.5, fontWeight: 700,
              backdropFilter: 'blur(4px)', whiteSpace: 'nowrap'
            }}>
            {i === 1 ? <span>←</span> : null}
          </motion.div>
        ))}
      </div>

      {/* LEFT — Widget Mockup */}
      <div
        data-reveal
        style={{
          background: 'var(--card-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          overflow: 'hidden',
          gridColumn: '1',
          transitionDelay: '0.1s',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
        }}
      >
        {/* Widget header */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          position: 'relative',
          borderBottom: '1px solid var(--border)' }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '4px' }}>
            <FrostyIcon size={20} glow={0} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Frosty</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
              <span style={{ color: '#6B7280' }}>Online</span>
            </div>
          </div>
          <div style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 100, padding: '3px 10px' }}>
            <span className="live-dot" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', letterSpacing: '0.08em' }}>LIVE</span>
          </div>
        </div>

        {/* Chat area */}
        <div style={{ padding: '16px 18px', minHeight: 260, flex: 1 }}>
          {/* User bubble */}
          <motion.div className="user-msg-left" style={{ opacity: 0, display: 'none', justifyContent: 'flex-end', marginBottom: 16 }}>
            <div style={{
              maxWidth: '85%', padding: '10px 14px', borderRadius: '18px 18px 4px 18px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              fontSize: 13, color: '#fff', lineHeight: 1.6,
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              I need help with enterprise pricing
            </div>
          </motion.div>

          {/* AI Typing Indicator */}
          <motion.div className="ai-typing" style={{ opacity: 0, display: 'none', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
            <div style={{ flexShrink: 0, padding: '2px', marginRight: '6px' }}>
                <FrostyIcon size={14} glow={0} />
              </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '12px 16px', borderRadius: '4px 18px 18px 18px',
              background: 'rgba(3, 150, 166,0.05)', border: '1px solid rgba(3, 150, 166,0.2)' }}>
              <span className="typing-dot" style={{ background: '#0396A6' }} />
              <span className="typing-dot" style={{ background: '#0396A6', animationDelay: '0.2s' }} />
              <span className="typing-dot" style={{ background: '#0396A6', animationDelay: '0.4s' }} />
            </div>
          </motion.div>

          {/* AI bubble */}
          <motion.div className="ai-bubble" style={{ opacity: 0, display: 'none', justifyContent: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, padding: '2px', marginRight: '6px' }}>
                <FrostyIcon size={14} glow={0} />
              </div>
              <div style={{
                maxWidth: '85%', padding: '10px 14px', borderRadius: '4px 18px 18px 18px',
                background: 'rgba(3, 150, 166,0.05)', border: '1px solid rgba(3, 150, 166,0.2)',
                fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6 }}>
                Sure! Let me pull up our enterprise options —
              </div>
            </div>
          </motion.div>
          
          {/* Admin bubble (Pushed left) */}
          <motion.div className="admin-msg-left" style={{ opacity: 0, display: 'none', justifyContent: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(3, 150, 166,0.15)', border: '1px solid rgba(3, 150, 166,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, color: '#A5B4FC', fontWeight: 700 }}>R</div>
              <div style={{
                maxWidth: '85%', padding: '10px 14px', borderRadius: '4px 18px 18px 18px',
                background: 'rgba(3, 150, 166,0.05)', border: '1px solid rgba(3, 150, 166,0.3)',
                fontSize: 13, color: '#A5B4FC', lineHeight: 1.6 }}>
                Hi! I'm handling this personally. Let's talk enterprise—what's your team size?
              </div>
            </div>
          </motion.div>

        </div>

        {/* Input bar */}
        <div style={{
          padding: '16px 20px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 12, background: 'rgba(255,255,255,0.02)' }}>
          <div style={{
            flex: 1, height: 40, borderRadius: 12,
            background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', paddingLeft: 16,
            fontSize: 13, color: 'var(--text-body)' }}>Type a message…</div>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #0396A6 0%, #FF7A5E 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#fff',
            boxShadow: '0 4px 12px rgba(3, 150, 166,0.3)'
          }}>↑</div>
        </div>
      </div>

      {/* RIGHT — Live Console */}
      <div
        data-reveal
        style={{
          background: 'var(--card-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          overflow: 'hidden',
          gridColumn: '3',
          transitionDelay: '0.2s',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
        }}
      >
        {/* Console header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Website Live Console</span>
        </div>

        {/* Console body: two sub-panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', flex: 1 }}>

          {/* Session list */}
          <div style={{ borderRight: '1px solid var(--border)', padding: '12px 0', background: 'rgba(255,255,255,0.01)' }}>
            <motion.div
              className="right-session-box"
              style={{
                padding: '12px 16px',
                borderLeft: '3px solid transparent', // animated via scope
                marginBottom: 2, cursor: 'default' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0396A6', display: 'inline-block', flexShrink: 0, boxShadow: '0 0 8px #0396A6' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Ayush</span>
              </div>
              <motion.span className="status-ai" style={{
                fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                background: 'rgba(3, 150, 166,0.1)', border: '1px solid rgba(3, 150, 166,0.3)',
                color: '#FFB09F', letterSpacing: '0.05em' }}>AI AGENT</motion.span>
              <motion.span className="status-human" style={{
                fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)',
                color: '#ef4444', letterSpacing: '0.05em', display: 'none'
              }}>HUMAN ACTIVE</motion.span>
            </motion.div>
          </div>

          {/* Live feed */}
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
            <div style={{ fontSize: 10, color: 'var(--text-body)', opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Session Instance · Ayush</div>
            
            {/* User msg */}
            <motion.div className="user-msg-right" style={{ opacity: 0, display: 'none', justifyContent: 'flex-start' }}>
              <div style={{ maxWidth: '85%', padding: '8px 12px', borderRadius: 12, fontSize: 12.5, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                I need help with enterprise pricing
              </div>
            </motion.div>
            
            {/* Bot msg (Initially hidden) */}
            <motion.div className="right-ai-msg" style={{ display: 'none', justifyContent: 'flex-end', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div className="status-ai" style={{ display: 'inline-block', background: 'rgba(3, 150, 166,0.1)', border: '1px solid rgba(3, 150, 166,0.3)', color: '#FFB09F', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800 }}>AI</div>
                <div style={{
                  maxWidth: '85%', padding: '8px 12px', borderRadius: 12, fontSize: 12.5, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'var(--text-body)', lineHeight: 1.6
                }}>
                  Sure! Let me pull up our enterprise options —
                </div>
              </div>
            </motion.div>

            {/* Admin takeover badge */}
            <motion.div className="admin-badge" style={{
              display: 'none', alignItems: 'center', gap: 10,
              padding: '10px 20px', borderRadius: 12,
              background: 'rgba(3, 150, 166,0.15)', border: '1px solid rgba(3, 150, 166,0.4)',
              fontSize: 12, fontWeight: 700, color: '#A5B4FC',
              alignSelf: 'center', boxShadow: '0 0 20px rgba(3, 150, 166,0.1)'
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Human Takeover Active
            </motion.div>

            {/* Admin typing ... */}
            <motion.div className="typing-right" style={{ display: 'none', color: '#374151', fontSize: 11, marginTop: 4, textAlign: 'right' }}>
              Ayush typing...
            </motion.div>

            {/* Admin msg */}
            <motion.div className="admin-msg-right" style={{ display: 'none', justifyContent: 'flex-end' }}>
              <div style={{ maxWidth: '85%', padding: '8px 12px', borderRadius: 12, fontSize: 12.5, background: 'rgba(3, 150, 166,0.1)', border: '1px solid rgba(3, 150, 166,0.3)', color: '#A5B4FC', lineHeight: 1.6 }}>
                Hi! I'm handling this personally. Let's talk enterprise—what's your team size?
              </div>
            </motion.div>
          </div>
        </div>

        {/* Takeover button */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <motion.button className="admin-btn" style={{
               width: '100%', height: 44, position: 'relative',
               padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700,
               background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-body)',
               cursor: 'default', transformOrigin: 'center',
               display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <motion.span className="btn-state-takeover" style={{ position: 'absolute' }}>Take Over Session</motion.span>
              <motion.span className="btn-state-return" style={{ position: 'absolute', opacity: 0, display: 'none' }}>Return to AI Autopilot</motion.span>
            </motion.button>
            
            {/* Tooltip to explain Bot pausing */}
            <motion.div className="ai-paused-tooltip" style={{
              position: 'absolute', top: -42, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(239,68,68,0.9)', border: '1px solid rgba(248,113,113,0.5)', color: 'white',
              padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, 
              pointerEvents: 'none', backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 15px rgba(239,68,68,0.3)'
            }}>
               CRITICAL: Agent Paused
            </motion.div>
            
            {/* Mouse Cursor Animation */}
            <motion.div className="fake-cursor" style={{
              opacity: 0, position: 'absolute', bottom: -50, right: -20, pointerEvents: 'none', zIndex: 100
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>
                <path d="M4 4l7.07 17 2.51-7.39L21 11.07z" fill="white" stroke="#1C1C1C" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </div>
        </div>
      </div>

    </div>
  );
}
