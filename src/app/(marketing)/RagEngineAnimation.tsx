'use client';

import React, { useEffect } from 'react';
import { motion, useAnimate, useInView } from 'framer-motion';

export default function RagEngineAnimation() {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: true, margin: "0px 0px -300px 0px" });

  useEffect(() => {
    if (!isInView || !scope.current) return;
    let isSubscribed = true;

    const safeAnimate = (selector: any, keyframes: any, options?: any) => {
      if (!isSubscribed || !scope.current) return Promise.resolve();
      return animate(selector, keyframes, options);
    };

    const sequence = async () => {
      const firePulse = async (pulseClass: string) => {
        const staggerDelay = 0.06;
        const duration = 0.5;
        for (let w = 0; w < 3; w++) {
          const cls = `.${pulseClass}-w${w}`;
          setTimeout(() => {
            safeAnimate(cls, { opacity: 1 }, { duration: 0.08 });
            safeAnimate(cls, { left: '100%' }, { duration, type: 'tween', ease: 'easeInOut' }).then(() => {
              safeAnimate(cls, { opacity: 0 }, { duration: 0.08 });
            });
          }, w * staggerDelay * 1000);
        }
        await new Promise(r => setTimeout(r, duration * 1000 + staggerDelay * 2 * 1000 + 80));
      };

      const resetPulse = (pulseClass: string) => {
        for (let w = 0; w < 3; w++) {
          safeAnimate(`.${pulseClass}-w${w}`, { left: '0%', opacity: 0 }, { duration: 0 });
        }
      };

      while (isSubscribed) {
        if (!scope.current) break;
        resetPulse('pulse-1');
        resetPulse('pulse-2');
        resetPulse('pulse-3');
        resetPulse('pulse-4');
        await Promise.all([
            safeAnimate('.node-1', { scale: 1, boxShadow: '0 0 0px rgba(0,0,0,0)' }, { duration: 0 }),
            safeAnimate('.node-2', { scale: 1, boxShadow: '0 0 0px rgba(3, 150, 166,0)', borderColor: '#0396A6' }, { duration: 0 }),
            safeAnimate('.node-phase1', { scale: 1, boxShadow: '0 0 0px rgba(3, 150, 166,0)', borderColor: '#0396A6' }, { duration: 0 }),
            safeAnimate('.node-4', { scale: 1, boxShadow: '0 0 0px rgba(234,88,12,0)', borderColor: '#EA580C' }, { duration: 0 }),
            safeAnimate('.node-5', { scale: 1, boxShadow: '0 0 0px rgba(22,163,74,0)', borderColor: '#16A34A' }, { duration: 0 }),
            safeAnimate('.svg-root', { pathLength: 0, opacity: 0 }, { duration: 0 }),
            safeAnimate('.data-particle', { pathOffset: 1, opacity: 0 }, { duration: 0 }), 
            safeAnimate('.card-border', { borderColor: 'rgba(0, 0, 0, 0.08)', boxShadow: '0 0 0px transparent' }, { duration: 0 }),
        ]);

        if (!isSubscribed) break;
        await new Promise(resolve => setTimeout(resolve, 500));

        // Pulse 1: User Query → detect_category
        safeAnimate('.node-1', { scale: 1.05, boxShadow: '0 0 16px rgba(3, 150, 166,0.15)' }, { duration: 0.3, type: "tween", ease: "easeInOut" });
        await firePulse('pulse-1');
        safeAnimate('.node-1', { scale: 1, boxShadow: '0 0 0px rgba(0,0,0,0)' }, { duration: 0.4, type: "tween", ease: "easeInOut" });

        // Node 2 glow
        safeAnimate('.node-2', { scale: 1.05, boxShadow: '0 0 20px 2px rgba(3, 150, 166,0.25)', borderColor: '#0396A6' }, { duration: 0.3, type: "tween", ease: "easeInOut" });
        await new Promise(resolve => setTimeout(resolve, 200));

        // Pulse 2: detect_category → Phase 1
        safeAnimate('.node-2', { scale: 1, boxShadow: '0 0 0px rgba(3, 150, 166,0)', borderColor: '#0396A6' }, { duration: 0.4, type: "tween", ease: "easeInOut" });
        await firePulse('pulse-2');

        // Phase 1 Retrieve
        safeAnimate('.node-phase1', { 
            scale: 1.05, 
            boxShadow: '0 0 20px 2px rgba(3, 150, 166,0.25)', 
            borderColor: '#0396A6' 
        }, { duration: 0.3, type: "tween", ease: "easeInOut" });

        await new Promise(resolve => setTimeout(resolve, 100));

        // Root Growth
        safeAnimate('.svg-root', { opacity: 1 }, { duration: 0.1, type: "tween", ease: "easeInOut" });
        await safeAnimate('.svg-root', { pathLength: 1 }, { duration: 0.6, type: "tween", ease: "easeInOut" });

        // Data Extraction particles
        const wireStagger = 60;
        const branches = ['l', 'c', 'r'];
        branches.forEach((branch) => {
          for (let w = 0; w < 3; w++) {
            const cls = `.data-particle-${branch}${w}`;
            setTimeout(() => {
              safeAnimate(cls, { opacity: 1 }, { duration: 0.08 });
            }, w * wireStagger);
          }
        });

        // Card Reaction
        safeAnimate('.card-border', { 
            borderColor: 'rgba(3, 150, 166, 0.4)',
            boxShadow: '0 0 20px rgba(3, 150, 166,0.1)'
        }, { duration: 0.3, type: "tween", ease: "easeInOut" }).then(() => {
            safeAnimate('.card-border', { borderColor: 'rgba(0, 0, 0, 0.08)', boxShadow: '0 0 0px rgba(0,0,0,0)' }, { duration: 0.8, type: "tween", ease: "easeInOut" });
        });

        // Particle return
        const particleReturnPromises: Promise<any>[] = [];
        branches.forEach((branch) => {
          for (let w = 0; w < 3; w++) {
            const cls = `.data-particle-${branch}${w}`;
            const p = new Promise<void>((resolve) => {
              setTimeout(() => {
                safeAnimate(cls, { pathOffset: 0 }, { duration: 0.8, type: 'tween', ease: 'easeInOut' }).then(() => {
                  safeAnimate(cls, { opacity: 0 }, { duration: 0.15 });
                  resolve();
                });
              }, w * wireStagger);
            });
            particleReturnPromises.push(p);
          }
        });
        await Promise.all(particleReturnPromises);

        safeAnimate('.node-phase1', { scale: 1, boxShadow: '0 0 0px rgba(3, 150, 166,0)', borderColor: '#0396A6' }, { duration: 0.5, type: "tween", ease: "easeInOut" });
        safeAnimate('.svg-root', { opacity: 0 }, { duration: 0.5, type: "tween", ease: "easeInOut" });

        // Pulse 3: Phase 1 → Fallback
        await firePulse('pulse-3');

        safeAnimate('.node-4', { scale: 1.05, boxShadow: '0 0 20px 2px rgba(234,88,12,0.25)', borderColor: '#EA580C' }, { duration: 0.3, type: "tween", ease: "easeInOut" });
        await new Promise(resolve => setTimeout(resolve, 200));

        // Pulse 4: Fallback → LLM
        safeAnimate('.node-4', { scale: 1, boxShadow: '0 0 0px rgba(234,88,12,0)', borderColor: '#EA580C' }, { duration: 0.4, type: "tween", ease: "easeInOut" });
        await firePulse('pulse-4');

        safeAnimate('.node-5', { scale: 1.05, boxShadow: '0 0 20px 2px rgba(22,163,74,0.25)', borderColor: '#16A34A' }, { duration: 0.3, type: "tween", ease: "easeInOut" });
        await new Promise(resolve => setTimeout(resolve, 300));
        safeAnimate('.node-5', { scale: 1, boxShadow: '0 0 0px rgba(22,163,74,0)', borderColor: '#16A34A' }, { duration: 0.4, type: "tween", ease: "easeInOut" });

        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    };

    sequence();
    return () => { isSubscribed = false; };
  }, [animate, isInView]);

  const triWireConnector = (pulseClass: string) => (
    <div style={{ flex: 1, position: 'relative' as const, alignSelf: 'center', minWidth: 32, overflow: 'visible', height: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {[0, 1, 2].map((wireIdx) => (
        <div key={wireIdx} style={{ position: 'relative', width: '100%', height: 1 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderTop: '1px dashed rgba(0,0,0,0.15)' }} />
          <motion.div className={`${pulseClass} ${pulseClass}-w${wireIdx}`} style={{
            position: 'absolute', top: -1, width: 20, height: 2, borderRadius: '100%',
            background: '#0396A6', boxShadow: '0 0 8px 1px #0396A6',
            opacity: 0, left: 0, transform: 'translateX(-100%)', zIndex: 10
          }} />
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={scope}
      data-reveal
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.06)',
        borderRadius: 24,
        padding: 48,
        transitionDelay: '0.2s' }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .rag-no-scrollbar::-webkit-scrollbar { display: none; }
        .rag-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />
      
      {/* Pipeline row */}
      <div className="rag-no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingTop: 60, paddingBottom: 60, paddingLeft: 40, paddingRight: 40, margin: '-60px -40px', position: 'relative', zIndex: 20 }}>
        <motion.div className="node-1" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 100, whiteSpace: 'nowrap', background: '#F8FAFC', border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600, color: '#0F172A', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-700">
          <path fill="currentColor" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.188 8.188 0 01-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.39-.12-.56.12-.16.25-.64.82-.78.99-.15.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.12-.24-.01-.39.11-.5.11-.11.25-.27.37-.41.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.11-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01z"/>
        </svg>
          User Query
        </motion.div>
        {triWireConnector('pulse-1')}
        
        <motion.div className="node-2" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 100, whiteSpace: 'nowrap', background: 'rgba(3, 150, 166, 0.08)', border: '1px solid #0396A6', fontSize: 13, fontWeight: 600, color: '#0396A6', flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          detect_category()
        </motion.div>
        {triWireConnector('pulse-2')}
        
        <motion.div className="node-phase1" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 100, whiteSpace: 'nowrap', background: 'rgba(3, 150, 166, 0.06)', border: '1px solid #0396A6', fontSize: 13, fontWeight: 600, color: '#0396A6', flexShrink: 0, position: 'relative', zIndex: 30 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Phase 1 Retrieve
        </motion.div>
        
        {triWireConnector('pulse-3')}
        
        <motion.div className="node-4" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 100, whiteSpace: 'nowrap', background: '#FFF7ED', border: '1px solid #EA580C', fontSize: 13, fontWeight: 600, color: '#EA580C', flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Fallback Expand
        </motion.div>
        {triWireConnector('pulse-4')}
        
        <motion.div className="node-5" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 100, whiteSpace: 'nowrap', background: '#F0FDF4', border: '1px solid #16A34A', fontSize: 13, fontWeight: 600, color: '#16A34A', flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
          LLM + source_url
        </motion.div>
      </div>

      {/* SVG Canvas between rows */}
      <div style={{ position: 'relative', height: 80, margin: '0 0', zIndex: 10 }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }} viewBox="0 0 1000 100" preserveAspectRatio="none">
          <motion.path className="svg-root" d="M 497,0 C 497,60 163,40 163,100" stroke="rgba(0,0,0,0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="transparent" />
          <motion.path className="svg-root" d="M 500,0 C 500,60 166,40 166,100" stroke="rgba(0,0,0,0.1)" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="transparent" />
          <motion.path className="svg-root" d="M 503,0 C 503,60 169,40 169,100" stroke="rgba(0,0,0,0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="transparent" />

          <motion.path className="svg-root" d="M 497,0 L 497,100" stroke="rgba(0,0,0,0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="transparent" />
          <motion.path className="svg-root" d="M 500,0 L 500,100" stroke="rgba(0,0,0,0.1)" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="transparent" />
          <motion.path className="svg-root" d="M 503,0 L 503,100" stroke="rgba(0,0,0,0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="transparent" />

          <motion.path className="svg-root" d="M 497,0 C 497,60 830,40 830,100" stroke="rgba(0,0,0,0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="transparent" />
          <motion.path className="svg-root" d="M 500,0 C 500,60 833,40 833,100" stroke="rgba(0,0,0,0.1)" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="transparent" />
          <motion.path className="svg-root" d="M 503,0 C 503,60 836,40 836,100" stroke="rgba(0,0,0,0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="transparent" />

          {/* Energy Particles */}
          <motion.path className="data-particle data-particle-l0" d="M 497,0 C 497,60 163,40 163,100" stroke="#0396A6" strokeWidth="3" vectorEffect="non-scaling-stroke" fill="transparent" strokeLinecap="round" strokeDasharray="3 500" />
          <motion.path className="data-particle data-particle-l1" d="M 500,0 C 500,60 166,40 166,100" stroke="#0396A6" strokeWidth="4" vectorEffect="non-scaling-stroke" fill="transparent" strokeLinecap="round" strokeDasharray="3 500" />
          <motion.path className="data-particle data-particle-l2" d="M 503,0 C 503,60 169,40 169,100" stroke="#0396A6" strokeWidth="3" vectorEffect="non-scaling-stroke" fill="transparent" strokeLinecap="round" strokeDasharray="3 500" />

          <motion.path className="data-particle data-particle-c0" d="M 497,0 L 497,100" stroke="#0396A6" strokeWidth="3" vectorEffect="non-scaling-stroke" fill="transparent" strokeLinecap="round" strokeDasharray="3 500" />
          <motion.path className="data-particle data-particle-c1" d="M 500,0 L 500,100" stroke="#0396A6" strokeWidth="4" vectorEffect="non-scaling-stroke" fill="transparent" strokeLinecap="round" strokeDasharray="3 500" />
          <motion.path className="data-particle data-particle-c2" d="M 503,0 L 503,100" stroke="#0396A6" strokeWidth="3" vectorEffect="non-scaling-stroke" fill="transparent" strokeLinecap="round" strokeDasharray="3 500" />

          <motion.path className="data-particle data-particle-r0" d="M 497,0 C 497,60 830,40 830,100" stroke="#0396A6" strokeWidth="3" vectorEffect="non-scaling-stroke" fill="transparent" strokeLinecap="round" strokeDasharray="3 500" />
          <motion.path className="data-particle data-particle-r1" d="M 500,0 C 500,60 833,40 833,100" stroke="#0396A6" strokeWidth="4" vectorEffect="non-scaling-stroke" fill="transparent" strokeLinecap="round" strokeDasharray="3 500" />
          <motion.path className="data-particle data-particle-r2" d="M 503,0 C 503,60 836,40 836,100" stroke="#0396A6" strokeWidth="3" vectorEffect="non-scaling-stroke" fill="transparent" strokeLinecap="round" strokeDasharray="3 500" />
        </svg>
      </div>

      {/* Three sub-cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 0, position: 'relative', zIndex: 20 }}>
        {/* Card A: PDF Ingestion */}
        <motion.div className="card-border" style={{ background: '#FFFFFF', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ marginBottom: 12, color: '#0396A6' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>PDF Ingestion</div>
          <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.7, marginBottom: 20 }}>
            Upload your documents. Frosty chunks, embeds, and indexes them into knowledge_base_gemini instantly.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <div style={{ width: 36, height: 44, borderRadius: 6, background: '#F0FDFA', border: '1.5px solid #CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0396A6' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {[0, 0.3, 0.6].map((d) => (
                <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: '#0396A6', opacity: 0.6 }} />
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 38, height: 14, borderRadius: '50%', background: '#F0FDFA', border: '1.5px solid #CCFBF1', marginBottom: 0 }} />
              <div style={{ width: 38, height: 30, background: '#F0FDFA', border: '1.5px solid #CCFBF1', borderTop: 'none', borderRadius: '0 0 4px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0396A6' }}>DB</div>
            </div>
          </div>
        </motion.div>

        {/* Card B: Web Scraper */}
        <motion.div className="card-border" style={{ background: '#FFFFFF', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ marginBottom: 12, color: '#0396A6' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M12 2v10" />
              <path d="M18.4 4.6a10 10 0 1 1-12.8 0" />
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>BFS Web Scraper</div>
          <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.7, marginBottom: 20 }}>
            Crawl up to 200 pages with httpx + Playwright fallback. Content auto-indexed weekly.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {['/about', '/pricing', '/products', '/blog', '...197 more'].map((url, i) => (
              <div key={url} className="url-row" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: i < 4 ? 'rgba(34,197,94,0.15)' : '#F1F5F9', border: `1px solid ${i < 4 ? '#86EFAC' : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: i < 4 ? '#16A34A' : '#64748B', flexShrink: 0 }}>{i < 4 ? '✓' : '…'}</span>
                <span style={{ color: i < 4 ? '#0F172A' : '#64748B', fontWeight: i < 4 ? 600 : 400 }}>{url}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Card C: 8 Categories */}
        <motion.div className="card-border" style={{ background: '#FFFFFF', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ marginBottom: 12, color: '#0396A6' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>8-Category Detection</div>
          <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.7, marginBottom: 20 }}>
            Queries mapped to categories before retrieval — sharper results, grounded strictly in your verified content.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Pricing', 'Support', 'Booking', 'Contact', 'Product', 'General', 'Complaint', 'FAQ'].map((cat) => (
              <span key={cat} style={{ padding: '4px 12px', borderRadius: 8, background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A', fontSize: 11, fontWeight: 600 }}>{cat}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
