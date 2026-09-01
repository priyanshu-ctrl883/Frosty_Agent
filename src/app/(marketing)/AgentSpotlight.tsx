// @ts-nocheck
'use client';

import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

import FrostyIcon from '@/components/FrostyIcon';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* ── Service data ───────────────────────────────────────────── */
const SERVICES = [
  {
    id: 'website',
    title: 'Web Agent',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    accentColor: '#0396A6',
    borderColor: 'rgba(99, 90, 128,0.45)',
    bg: '#070d1a',
    atmoColor: 'rgba(99, 90, 128,0.12)',
    desc: 'Embeds directly into your site. Automates visitor queries, captures leads, and schedules meetings the moment they land.',
  },
  {
    id: 'whatsapp',
    title: 'WA Agent',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path fill="currentColor" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.188 8.188 0 01-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.39-.12-.56.12-.16.25-.64.82-.78.99-.15.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.12-.24-.01-.39.11-.5.11-.11.25-.27.37-.41.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.11-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01z"/>
        </svg>
    ),
    accentColor: '#25D366',
    borderColor: 'rgba(37,211,102,0.45)',
    bg: '#060e0a',
    atmoColor: 'rgba(37,211,102,0.10)',
    desc: '24/7 conversational commerce and automated support natively inside WhatsApp using the Meta Cloud API.',
  },

  {
    id: 'unified',
    title: 'Unified Agent',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    accentColor: '#0396A6',
    borderColor: 'rgba(3, 150, 166,0.45)',
    bg: '#060a14',
    atmoColor: 'rgba(3, 150, 166,0.12)',
    desc: 'The central nervous system. Syncs all agents into a single omni-channel dashboard with human handoff on demand.',
  },
];

/* ── Blueprint SVGs ─────────────────────────────────────────── */
function WebsiteSVG() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.22 }}>
      {Array.from({ length: 5 }).map((_, i) => <line key={`wh${i}`} x1="0" y1={i * 32} x2="300" y2={i * 32} stroke="#0396A6" strokeWidth="0.5" />)}
      {Array.from({ length: 7 }).map((_, i) => <line key={`wv${i}`} x1={i * 50} y1="0" x2={i * 50} y2="160" stroke="#0396A6" strokeWidth="0.5" />)}
      <rect x="30" y="18" width="180" height="120" rx="6" fill="none" stroke="#0396A6" strokeWidth="1.2" />
      <rect x="30" y="18" width="180" height="18" rx="6" fill="#0396A6" fillOpacity="0.1" />
      <circle cx="43" cy="27" r="3.5" fill="#0396A6" fillOpacity="0.5" />
      <circle cx="54" cy="27" r="3.5" fill="#0396A6" fillOpacity="0.3" />
      <circle cx="65" cy="27" r="3.5" fill="#0396A6" fillOpacity="0.2" />
      <rect x="40" y="48" width="90" height="6" rx="3" fill="#0396A6" fillOpacity="0.3" />
      <rect x="40" y="60" width="65" height="4" rx="2" fill="#0396A6" fillOpacity="0.18" />
      <rect x="40" y="70" width="80" height="4" rx="2" fill="#0396A6" fillOpacity="0.13" />
      <rect x="40" y="82" width="50" height="4" rx="2" fill="#0396A6" fillOpacity="0.1" />
      <circle cx="240" cy="120" r="5" fill="#0396A6" fillOpacity="0.3" />
      <circle cx="50" cy="140" r="4" fill="#0396A6" fillOpacity="0.2" />
    </svg>
  );
}

function WhatsAppSVG() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.26 }}>
      <rect x="16" y="18" width="120" height="34" rx="17" fill="none" stroke="#25D366" strokeWidth="1.2" />
      <rect x="27" y="27" width="80" height="7" rx="3" fill="#25D366" fillOpacity="0.4" />
      <rect x="27" y="38" width="54" height="5" rx="2" fill="#25D366" fillOpacity="0.22" />
      <rect x="140" y="60" width="125" height="30" rx="15" fill="none" stroke="#25D366" strokeWidth="1" />
      <rect x="152" y="70" width="75" height="6" rx="3" fill="#25D366" fillOpacity="0.3" />
      <rect x="16" y="106" width="110" height="28" rx="14" fill="none" stroke="#25D366" strokeWidth="0.9" />
      <rect x="27" y="115" width="62" height="5" rx="2" fill="#25D366" fillOpacity="0.2" />
      <rect x="140" y="140" width="115" height="14" rx="7" fill="none" stroke="#25D366" strokeWidth="0.7" />
      <circle cx="258" cy="35" r="5" fill="#25D366" fillOpacity="0.35" />
      <circle cx="13" cy="148" r="4" fill="#25D366" fillOpacity="0.22" />
    </svg>
  );
}

function UnifiedSVG() {
  const nodes: [number, number, number, number][] = [
    [55, 28, 8, 0.6], [150, 75, 11, 0.8], [245, 28, 8, 0.6],
    [88, 125, 7, 0.5], [212, 125, 7, 0.5], [150, 152, 7, 0.45],
  ];
  const edges: [number, number, number, number][] = [
    [55, 28, 150, 75], [245, 28, 150, 75],
    [150, 75, 88, 125], [150, 75, 212, 125],
    [88, 125, 150, 152], [212, 125, 150, 152],
  ];
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.3 }}>
      {edges.map(([x1, y1, x2, y2], i) => (
        <line key={`e${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0396A6" strokeWidth="0.9" />
      ))}
      {nodes.map(([cx, cy, r, op], i) => (
        <circle key={`n${i}`} cx={cx} cy={cy} r={r} fill="#0396A6" fillOpacity={op} />
      ))}
    </svg>
  );
}

const SVGS = [WebsiteSVG, WhatsAppSVG, UnifiedSVG];

/* ── Main Component ─────────────────────────────────────────── */
export default function AgentSpotlight() {
  const containerRef = useRef<HTMLElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const [iconRotation, setIconRotation] = useState(0);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const linesRef = useRef<(SVGPathElement | null)[]>([]);
  const pulseLinesRef = useRef<(SVGPathElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);

    // 1. Independent Rotation for the Icon
    gsap.to({}, {
      duration: 10,
      repeat: -1,
      ease: "none",
      onUpdate: function() {
        setIconRotation(this.progress() * Math.PI * 2);
      }
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=2500',
        pin: true,
        scrub: 1.2,
      },
    });

    // 2. Initial State
    gsap.set(hubRef.current, { scale: 0.5, opacity: 0 });
    gsap.set(cardsRef.current, { opacity: 0, scale: 0.8 });
    gsap.set(linesRef.current, { strokeDasharray: 500, strokeDashoffset: 500 });
    gsap.set(pulseLinesRef.current, { opacity: 0 });

    tl
      // 3. Expand Central Hub
      .to(hubRef.current, { scale: 1, opacity: 1, duration: 1, ease: 'power2.out' })
      
      // 4. Draw Connection Lines and Reveal Cards
      .addLabel('connecting');

    SERVICES.forEach((_, i) => {
      tl.to(linesRef.current[i], { strokeDashoffset: 0, duration: 0.8, ease: 'none' }, 'connecting+=' + (i * 0.2))
        .to(cardsRef.current[i], { opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.7)' }, 'connecting+=' + (i * 0.2 + 0.3))
        // Enable pulse lines after connection is established
        .to(pulseLinesRef.current[i], { opacity: 1, duration: 0.3 }, 'connecting+=' + (i * 0.2 + 0.5));
    });

    // 5. Spotlight detail text reveal
    SERVICES.forEach((_, i) => {
      tl.to(textRefs.current[i], { height: 'auto', opacity: 1, duration: 0.5 }, '+=0.2');
    });

    // 6. Pulse effect animation (looping)
    pulseLinesRef.current.forEach((el, i) => {
      if (el) {
        gsap.to(el, {
          strokeDashoffset: -500,
          duration: 3,
          repeat: -1,
          ease: "none",
          delay: i * 0.5
        });
      }
    });

  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      style={{ padding: '100px 6%', background: 'transparent' }}
      className="w-full min-h-screen flex flex-col items-center justify-center"
    >
      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 10 }}>
        <div className="agent-header-el" style={{
          display: 'inline-flex', alignItems: 'center',
          fontSize: 11, letterSpacing: '2px', color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase', marginBottom: 18, fontWeight: 700,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 100, padding: '6px 18px' }}>
          AUTONOMOUS AGENTS
        </div>
        <h2 style={{
          fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800,
          letterSpacing: '-1.5px', color: '#fff', lineHeight: 1.1, marginBottom: 10 }}>
          Deploy your AI workforce.
        </h2>
        <p style={{ 
          fontSize: 14, color: '#475569', letterSpacing: '0.02em' }}>
          Scroll to visualize the hub-and-spoke connection.
        </p>
      </div>

      <div className="relative w-full max-w-6xl h-[600px] flex items-center justify-center">
        {/* Central Hub (Frosty) */}
        <div 
          ref={hubRef}
          className="absolute z-30 w-32 h-32 md:w-44 md:h-44 flex items-center justify-center"
        >
          <FrostyIcon size={120} rotation={iconRotation} glow={0} />
        </div>

        {/* Connection Lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible" viewBox="0 0 1000 600" preserveAspectRatio="none">
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0396A6" />
              <stop offset="100%" stopColor="#0396A6" />
            </linearGradient>
          </defs>
          {SERVICES.map((_, i) => {
            // Coordinate mapping for 1000x600 viewBox
            const coords = [
              { x: 180, y: 120 }, // Top Left
              { x: 820, y: 120 }, // Top Right
              { x: 180, y: 480 }, // Bottom Left
              { x: 820, y: 480 }  // Bottom Right
            ];
            const end = coords[i];
            const pathData = `M 500 300 L ${end.x} ${end.y}`;
            return (
              <React.Fragment key={`group-${i}`}>
                {/* Static Background Wire (Thin Grey) */}
                <path
                  ref={el => { linesRef.current[i] = el; }}
                  d={pathData}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1"
                  fill="none"
                />
                {/* Pulsing Beam (Cyan) */}
                <path
                  ref={el => { pulseLinesRef.current[i] = el; }}
                  d={pathData}
                  stroke="#0396A6"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="30, 600"
                  opacity="0"
                  filter="url(#glow)"
                />
              </React.Fragment>
            );
          })}
        </svg>

        {/* Agent Cards Surround */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          {SERVICES.map((service, i) => {
            const SVGComponent = SVGS[i] || SVGS[0];
            const xPos = i % 2 === 0 ? 'left-[5%]' : 'right-[5%]';
            const yPos = i < 2 ? 'top-[5%]' : 'bottom-[5%]';
            
            return (
              <div
                key={service.id}
                ref={el => { cardsRef.current[i] = el; }}
                className={`absolute w-full max-w-[280px] md:max-w-[320px] ${xPos} ${yPos}`}
                style={{
                  background: service.bg,
                  border: `1px solid ${service.borderColor}`,
                  borderRadius: 24, overflow: 'hidden',
                  willChange: 'transform, opacity' }}
              >
                {/* Same card content as before but restricted width */}
                <div style={{ position: 'relative', height: 120, overflow: 'hidden', zIndex: 1 }}>
                  <SVGComponent />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 30,
                    background: `linear-gradient(to top, ${service.bg}, transparent)` }} />
                </div>

                <div style={{ padding: '14px 18px 20px', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 14,
                      background: `${service.accentColor}18`, border: `1px solid ${service.borderColor}` }}>
                      {service.icon}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#000' }}>{service.title}</h3>
                  </div>

                  <div ref={el => { textRefs.current[i] = el; }} style={{ overflow: 'hidden', opacity: 0, height: 0 }}>
                    <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8 }}>
                      {service.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
