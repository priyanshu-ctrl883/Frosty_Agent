'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    Clock,
    User,
    X,
    UserCheck,
    ArrowRight
} from 'lucide-react';

/* ─── Two-Sparkle Frosty Brand Logo ─── */
function TwoSparklesIcon({ className = "w-7 h-7", size = 28 }: { className?: string; size?: number }) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ width: size, height: size, flexShrink: 0 }}
        >
            {/* Big teal 4-pointed diamond sparkle */}
            <path
                d="M13 2C13 8.075 8.075 13 2 13C8.075 13 13 17.925 13 24C13 17.925 17.925 13 24 13C17.925 13 13 8.075 13 2Z"
                fill="#0396A6"
            />
            {/* Small coral 4-pointed diamond sparkle */}
            <path
                d="M23 18C23 21.314 20.314 24 17 24C20.314 24 23 26.686 23 30C23 26.686 25.686 24 29 24C25.686 24 23 21.314 23 18Z"
                fill="#FF7A5E"
            />
        </svg>
    );
}

/* ─── Color-Masked Custom Asset Icon ─── */
function MaskIcon({ src, color, size = 20, className = "" }: { src: string; color: string; size?: number; className?: string }) {
    return (
        <span
            className={`inline-block shrink-0 ${className}`}
            style={{
                width: size,
                height: size,
                backgroundColor: color,
                WebkitMaskImage: `url('${src}')`,
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskImage: `url('${src}')`,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
            }}
        />
    );
}

export default function ProblemSection() {
    const [pulse, setPulse] = useState(0);

    // Continuous smooth animation timer for connecting pulses
    useEffect(() => {
        const interval = setInterval(() => {
            setPulse((p) => (p + 1) % 100);
        }, 30);
        return () => clearInterval(interval);
    }, []);

    const channels = [
        { name: 'Website', sub: 'New enquiry', img: '/web.svg' },
        { name: 'WhatsApp', sub: 'New message', img: '/whatsapp.png' },
        { name: 'Email', sub: 'New email', img: '/gmail.png' },
    ];

    return (
        <section className="relative w-full overflow-hidden py-8 sm:py-10 lg:py-12 bg-transparent flex flex-col justify-center min-h-[calc(100vh-76px)]" id="problem">
            <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 my-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
                    
                    {/* ═════════════════════════════════════════════════════════════════════ */}
                    {/* LEFT COLUMN: Problem Statement, Metrics & Callout                    */}
                    {/* ═════════════════════════════════════════════════════════════════════ */}
                    <div className="lg:col-span-5 flex flex-col justify-center">
                        {/* Problem Tag */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0396A6]/10 border border-[#0396A6]/20 mb-3 backdrop-blur-sm self-start"
                        >
                            <AlertTriangle className="w-3.5 h-3.5 text-[#0396A6] stroke-[1.75]" />
                            <span className="text-[10.5px] font-bold tracking-widest uppercase text-[#0396A6]">
                                THE PROBLEM
                            </span>
                        </motion.div>

                        {/* Heading */}
                        <motion.h2
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#0F172A] leading-[1.1] tracking-tight mb-2.5"
                        >
                            Hot leads <br />
                            <span className="text-[#0396A6] relative inline-block">
                                don&apos;t wait.
                                <span className="absolute -bottom-1 left-0 w-16 h-[3px] bg-[#0396A6] rounded-full" />
                            </span>
                        </motion.h2>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.05 }}
                            className="text-slate-600 text-sm sm:text-base leading-relaxed mb-5 max-w-lg"
                        >
                            Every enquiry is an opportunity. <br className="hidden sm:inline" />
                            But when leads wait for a reply, they move on.
                        </motion.p>

                        {/* 3 Metric Stat Cards (Compact, Centered: SVG -> Name -> Text) */}
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-4">
                            {/* Stat Card 1: 7X */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="min-h-[120px] sm:min-h-[155px] p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 hover:border-[#0396A6]/30 transition-colors"
                            >
                                <div className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 flex items-center justify-center mb-0.5">
                                    <Clock className="w-[20px] h-[20px] sm:w-[23px] sm:h-[23px] text-[#0396A6] stroke-[1.85]" />
                                </div>
                                <div className="text-xl sm:text-3xl font-bold text-[#0396A6] leading-none font-sans">
                                    7X
                                </div>
                                <div className="text-[8.5px] sm:text-[11px] text-slate-600 leading-tight font-sans text-center">
                                    more likely to convert if you respond in 5 mins
                                </div>
                            </motion.div>

                            {/* Stat Card 2: 80% (New Analytics Icon from public/analytics.png in Orange) */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.15 }}
                                className="min-h-[120px] sm:min-h-[155px] p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 hover:border-[#EA580C]/30 transition-colors"
                            >
                                <div className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 flex items-center justify-center mb-0.5">
                                    <MaskIcon src="/analytics.png" color="#EA580C" size={20} className="sm:scale-110" />
                                </div>
                                <div className="text-xl sm:text-3xl font-bold text-[#EA580C] leading-none font-sans">
                                    80%
                                </div>
                                <div className="text-[8.5px] sm:text-[11px] text-slate-600 leading-tight font-sans text-center">
                                    of leads choose competitors due to slow response
                                </div>
                            </motion.div>

                            {/* Stat Card 3: Lost (Coin Icon from public/coin.png in Teal) */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="min-h-[120px] sm:min-h-[155px] p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 hover:border-[#0396A6]/30 transition-colors"
                            >
                                <div className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 flex items-center justify-center mb-0.5 overflow-visible">
                                    <MaskIcon src="/coin.png" color="#0396A6" size={22} className="sm:scale-115" />
                                </div>
                                <div className="text-xl sm:text-3xl font-bold text-[#0396A6] leading-none font-sans">
                                    Lost
                                </div>
                                <div className="text-[8.5px] sm:text-[11px] text-slate-600 leading-tight font-sans text-center">
                                    revenue and time on every missed opportunity
                                </div>
                            </motion.div>
                        </div>

                        {/* Bottom Banner Card with Sparkle Logo */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.25 }}
                            className="p-3.5 sm:p-4 rounded-2xl bg-[#F0FDFA]/60 border border-teal-100 shadow-2xs flex items-center gap-3.5"
                        >
                            <div className="shrink-0 flex items-center justify-center">
                                <TwoSparklesIcon size={28} />
                            </div>
                            <div className="text-xs sm:text-sm font-sans">
                                <div className="font-bold text-slate-900 leading-tight">
                                    One AI agent. Every conversation.
                                </div>
                                <div className="font-bold text-[#0396A6] leading-tight mt-0.5">
                                    No lead left waiting.
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ═════════════════════════════════════════════════════════════════════ */}
                    {/* RIGHT COLUMN: Generous, Balanced Comparison Flow Diagram             */}
                    {/* ═════════════════════════════════════════════════════════════════════ */}
                    <div className="lg:col-span-7 flex flex-col justify-center">
                        <div className="w-full relative">
                            
                            {/* ── TOP FLOW: WITHOUT FROSTY AGENT ── */}
                            <div className="relative">
                                <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                                    <span className="text-[11px] font-bold tracking-wider text-slate-800 uppercase">
                                        WITHOUT FROSTY AGENT
                                    </span>
                                </div>

                                {/* Flow Row Container */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-0 relative">
                                    
                                    {/* 1. Channel Pills (Compact 3-column row on mobile, vertical stack on desktop) */}
                                    <div className="w-full sm:w-[136px] lg:w-[146px] grid grid-cols-3 sm:flex sm:flex-col gap-1.5 sm:gap-2.5 shrink-0 z-10">
                                        {channels.map((ch) => (
                                            <div
                                                key={`without-${ch.name}`}
                                                className="p-1.5 sm:p-2 sm:px-3 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col sm:flex-row items-center gap-1 sm:gap-2.5 hover:border-[#0396A6]/30 transition-colors text-center sm:text-left"
                                            >
                                                <div className="shrink-0 flex items-center justify-center">
                                                    <img loading="lazy" decoding="async" src={ch.img} alt={ch.name} className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-none truncate">
                                                        {ch.name}
                                                    </div>
                                                    <div className="text-[8px] sm:text-[9.5px] text-slate-500 leading-none mt-0.5 truncate">
                                                        {ch.sub}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mobile Vertical Flow Connector Wire */}
                                    <div className="flex sm:hidden items-center justify-center w-full h-[20px] my-0.5 relative overflow-visible">
                                        <svg className="w-[120px] h-[20px] overflow-visible" viewBox="0 0 120 20" fill="none">
                                            <path d="M 60 0 L 60 20" stroke="#0396A6" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.75" markerEnd="url(#teal-arrow-without)" />
                                            <circle r="2.5" fill="#0396A6" filter="url(#wire-glow-without)">
                                                <animateMotion dur="1.5s" repeatCount="indefinite" path="M 60 0 L 60 20" keyPoints="0;1" keyTimes="0;1" />
                                            </circle>
                                        </svg>
                                    </div>

                                    {/* 2. Desktop SVG Wires Connector with Flowing Atoms */}
                                    <div className="hidden sm:flex items-center justify-center w-[36px] lg:w-[44px] h-[106px] lg:h-[114px] shrink-0 relative overflow-visible">
                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 44 114" fill="none">
                                            <defs>
                                                <marker id="teal-arrow-without" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                                                    <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#0396A6" />
                                                </marker>
                                                <filter id="wire-glow-without" x="-50%" y="-50%" width="200%" height="200%">
                                                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                                    <feMerge>
                                                        <feMergeNode in="coloredBlur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>

                                            {/* 3 incoming branch paths - extending all the way to 44 to touch Box 1 border */}
                                            <path d="M 0 19 L 22 19 Q 26 19 26 23 L 26 57 L 44 57" stroke="#0396A6" strokeWidth="1.5" strokeDasharray="3.5 3.5" strokeOpacity="0.75" markerEnd="url(#teal-arrow-without)" />
                                            <path d="M 0 57 L 44 57" stroke="#0396A6" strokeWidth="1.5" strokeDasharray="3.5 3.5" strokeOpacity="0.75" markerEnd="url(#teal-arrow-without)" />
                                            <path d="M 0 95 L 22 95 Q 26 95 26 91 L 26 57 L 44 57" stroke="#0396A6" strokeWidth="1.5" strokeDasharray="3.5 3.5" strokeOpacity="0.75" markerEnd="url(#teal-arrow-without)" />

                                            {/* Flowing Atoms (Synchronous start) */}
                                            <circle r="2.8" fill="#0396A6" filter="url(#wire-glow-without)">
                                                <animateMotion
                                                    dur="2.4s"
                                                    repeatCount="indefinite"
                                                    path="M 0 19 L 22 19 Q 26 19 26 23 L 26 57 L 44 57"
                                                    keyPoints="0;1"
                                                    keyTimes="0;1"
                                                />
                                            </circle>
                                            <circle r="2.8" fill="#0396A6" filter="url(#wire-glow-without)">
                                                <animateMotion
                                                    dur="2.4s"
                                                    repeatCount="indefinite"
                                                    path="M 0 57 L 44 57"
                                                    keyPoints="0;1"
                                                    keyTimes="0;1"
                                                />
                                            </circle>
                                            <circle r="2.8" fill="#0396A6" filter="url(#wire-glow-without)">
                                                <animateMotion
                                                    dur="2.4s"
                                                    repeatCount="indefinite"
                                                    path="M 0 95 L 22 95 Q 26 95 26 91 L 26 57 L 44 57"
                                                    keyPoints="0;1"
                                                    keyTimes="0;1"
                                                />
                                            </circle>
                                        </svg>
                                    </div>

                                    {/* 3. Steps Pipeline */}
                                    <div className="flex-1 flex flex-col justify-center relative sm:pl-0">
                                        
                                        {/* Overpass Arch Callout */}
                                        <div className="hidden sm:flex items-center justify-center mb-1.5 relative">
                                            <svg className="absolute -top-1 w-full max-w-[350px] h-[20px] pointer-events-none" viewBox="0 0 350 20" fill="none">
                                                <path d="M 15 18 Q 175 -4 335 18" stroke="#0396A6" strokeWidth="1.25" strokeDasharray="3 3" />
                                            </svg>
                                            <div className="relative z-10 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-800 text-[9.5px] font-bold shadow-2xs">
                                                <span className="w-2.5 h-2.5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[8px] font-extrabold leading-none">
                                                    !
                                                </span>
                                                <span>Slow reply = Lost customers</span>
                                            </div>
                                        </div>

                                        {/* 3 Balanced Squared Blocks */}
                                        <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-0">
                                            
                                            {/* Block 1: Waiting for response */}
                                            <div className="flex-1 sm:flex-initial w-full sm:w-[108px] lg:w-[118px] h-[96px] sm:h-[110px] lg:h-[115px] p-2 sm:p-3 rounded-xl sm:rounded-[16px] border border-slate-200/90 bg-white text-center flex flex-col items-center justify-center shadow-2xs shrink-0">
                                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#0396A6] stroke-[1.75] mb-1 sm:mb-1.5 shrink-0" />
                                                <span className="text-[9.5px] sm:text-[11px] font-bold text-slate-800 leading-tight font-sans">
                                                    Waiting for <br /> response
                                                </span>
                                            </div>

                                            {/* Wire Connector: Touching Box 1 and Box 2 */}
                                            <div className="hidden sm:flex items-center justify-center w-[28px] lg:w-[34px] h-[20px] shrink-0 relative overflow-visible">
                                                <svg className="w-full h-full overflow-visible" viewBox="0 0 34 20" fill="none">
                                                    <path d="M 0 10 L 34 10" stroke="#0396A6" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.75" markerEnd="url(#teal-arrow-without)" />
                                                    <circle r="2.5" fill="#0396A6" filter="url(#wire-glow-without)">
                                                        <animateMotion dur="1.8s" repeatCount="indefinite" path="M 0 10 L 34 10" keyPoints="0;1" keyTimes="0;1" />
                                                    </circle>
                                                </svg>
                                            </div>

                                            {/* Block 2: Delayed follow up */}
                                            <div className="flex-1 sm:flex-initial w-full sm:w-[108px] lg:w-[118px] h-[96px] sm:h-[110px] lg:h-[115px] p-2 sm:p-3 rounded-xl sm:rounded-[16px] border border-slate-200/90 bg-white text-center flex flex-col items-center justify-center shadow-2xs shrink-0">
                                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#0396A6] stroke-[1.75] mb-1 sm:mb-1.5 shrink-0" />
                                                <span className="text-[9.5px] sm:text-[11px] font-bold text-slate-800 leading-tight font-sans">
                                                    Delayed <br /> follow up
                                                </span>
                                            </div>

                                            {/* Disconnected Gap: NO line leading into Box 3 */}
                                            <div className="hidden sm:flex w-[28px] lg:w-[34px] h-[20px] shrink-0" />

                                            {/* Block 3: Lead lost - Shaking animation signifying lost lead */}
                                            <motion.div
                                                animate={{
                                                    x: [0, -3, 3, -3, 3, -1.5, 1.5, 0],
                                                    rotate: [0, -1, 1, -1, 1, 0],
                                                }}
                                                transition={{
                                                    duration: 0.6,
                                                    repeat: Infinity,
                                                    repeatDelay: 2.2,
                                                    ease: "easeInOut"
                                                }}
                                                className="flex-1 sm:flex-initial w-full sm:w-[108px] lg:w-[118px] h-[96px] sm:h-[110px] lg:h-[115px] p-2 sm:p-3 rounded-xl sm:rounded-[16px] border border-[#FED7AA] bg-[#FFF9F5] text-center flex flex-col items-center justify-center shadow-2xs shrink-0"
                                            >
                                                <X className="w-4 h-4 sm:w-5 sm:h-5 text-[#EA580C] stroke-[2.5] mb-1 sm:mb-1.5 shrink-0" />
                                                <span className="text-[9.5px] sm:text-[11px] font-bold text-slate-900 leading-tight font-sans">
                                                    Lead lost
                                                </span>
                                                <span className="text-[8px] sm:text-[9px] font-semibold text-[#EA580C] leading-none mt-0.5 font-sans">
                                                    Opportunity <br /> gone forever
                                                </span>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── CENTRAL DIVIDER WITH MATCHING TEAL LINE & SOLID TEAL VS BADGE ── */}
                            <div className="relative my-3 sm:my-5 flex items-center justify-center">
                                <div className="w-full h-[1.5px] bg-[#0396A6]/35" />
                                <div className="absolute w-8 h-8 rounded-full bg-[#0396A6] text-white flex items-center justify-center font-bold text-[10.5px] tracking-wider shadow-sm ring-4 ring-white">
                                    VS
                                </div>
                            </div>

                            {/* ── BOTTOM FLOW: WITH FROSTY AGENT ── */}
                            <div className="relative">
                                <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                                    <span className="text-[11px] font-bold tracking-wider text-[#0396A6] uppercase">
                                        WITH FROSTY AGENT
                                    </span>
                                </div>

                                {/* Flow Row Container */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-0 relative">
                                    
                                    {/* 1. Left Channel Column (3 pills: Website, WhatsApp, Email) */}
                                    <div className="w-full sm:w-[136px] lg:w-[146px] grid grid-cols-3 sm:flex sm:flex-col gap-1.5 sm:gap-2.5 shrink-0 z-10">
                                        {channels.map((ch) => (
                                            <div
                                                key={`with-${ch.name}`}
                                                className="p-1.5 sm:p-2 sm:px-3 rounded-xl border border-teal-200/80 bg-white shadow-2xs flex flex-col sm:flex-row items-center gap-1 sm:gap-2.5 hover:border-[#0396A6]/40 transition-colors text-center sm:text-left"
                                            >
                                                <div className="shrink-0 flex items-center justify-center">
                                                    <img loading="lazy" decoding="async" src={ch.img} alt={ch.name} className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-none truncate">
                                                        {ch.name}
                                                    </div>
                                                    <div className="text-[8px] sm:text-[9.5px] text-[#0396A6] font-semibold leading-none mt-0.5 truncate">
                                                        {ch.sub}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mobile Vertical Flow Connector Wire */}
                                    <div className="flex sm:hidden items-center justify-center w-full h-[20px] my-0.5 relative overflow-visible">
                                        <svg className="w-[120px] h-[20px] overflow-visible" viewBox="0 0 120 20" fill="none">
                                            <path d="M 60 0 L 60 20" stroke="#0396A6" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.75" markerEnd="url(#teal-arrow-with)" />
                                            <circle r="2.5" fill="#0396A6" filter="url(#wire-glow-with)">
                                                <animateMotion dur="1.5s" repeatCount="indefinite" path="M 60 0 L 60 20" keyPoints="0;1" keyTimes="0;1" />
                                            </circle>
                                        </svg>
                                    </div>

                                    {/* 2. Desktop SVG Wires Connector with Flowing Atoms - Touching Frosty Agent card */}
                                    <div className="hidden sm:flex items-center justify-center w-[36px] lg:w-[44px] h-[106px] lg:h-[114px] shrink-0 relative overflow-visible">
                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 44 114" fill="none">
                                            <defs>
                                                <marker id="teal-arrow-with" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                                                    <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#0396A6" />
                                                </marker>
                                                <filter id="wire-glow-with" x="-50%" y="-50%" width="200%" height="200%">
                                                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                                    <feMerge>
                                                        <feMergeNode in="coloredBlur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>

                                            {/* 3 incoming branch lines from channel pills - extending all the way to 44 to touch Frosty Agent border */}
                                            <path d="M 0 19 L 22 19 Q 26 19 26 23 L 26 57 L 44 57" stroke="#0396A6" strokeWidth="1.5" strokeDasharray="3.5 3.5" strokeOpacity="0.75" markerEnd="url(#teal-arrow-with)" />
                                            <path d="M 0 57 L 44 57" stroke="#0396A6" strokeWidth="1.5" strokeDasharray="3.5 3.5" strokeOpacity="0.75" markerEnd="url(#teal-arrow-with)" />
                                            <path d="M 0 95 L 22 95 Q 26 95 26 91 L 26 57 L 44 57" stroke="#0396A6" strokeWidth="1.5" strokeDasharray="3.5 3.5" strokeOpacity="0.75" markerEnd="url(#teal-arrow-with)" />

                                            {/* Flowing Atoms (Synchronous start) */}
                                            <circle r="2.8" fill="#0396A6" filter="url(#wire-glow-with)">
                                                <animateMotion
                                                    dur="2.4s"
                                                    repeatCount="indefinite"
                                                    path="M 0 19 L 22 19 Q 26 19 26 23 L 26 57 L 44 57"
                                                    keyPoints="0;1"
                                                    keyTimes="0;1"
                                                />
                                            </circle>
                                            <circle r="2.8" fill="#0396A6" filter="url(#wire-glow-with)">
                                                <animateMotion
                                                    dur="2.4s"
                                                    repeatCount="indefinite"
                                                    path="M 0 57 L 44 57"
                                                    keyPoints="0;1"
                                                    keyTimes="0;1"
                                                />
                                            </circle>
                                            <circle r="2.8" fill="#0396A6" filter="url(#wire-glow-with)">
                                                <animateMotion
                                                    dur="2.4s"
                                                    repeatCount="indefinite"
                                                    path="M 0 95 L 22 95 Q 26 95 26 91 L 26 57 L 44 57"
                                                    keyPoints="0;1"
                                                    keyTimes="0;1"
                                                />
                                            </circle>
                                        </svg>
                                    </div>

                                    {/* 3. Steps Pipeline (Frosty Agent Card & Qualified Lead Card) */}
                                    <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-0 pl-0">
                                        
                                        {/* Block 4: Frosty Agent Centerpiece Card with Sparkle Logo */}
                                        <div className="flex-1 sm:max-w-[240px] lg:max-w-[260px] p-3 sm:p-4 rounded-2xl sm:rounded-[18px] border border-teal-200/90 bg-white shadow-2xs text-center flex flex-col items-center justify-center shrink-0">
                                            <TwoSparklesIcon size={30} className="mb-1 sm:mb-1.5" />
                                            <div
                                                className="text-xs sm:text-[13px] font-extrabold text-[#0396A6] tracking-wider uppercase leading-tight font-sans"
                                                style={{ fontFamily: "'Outfit', -apple-system, sans-serif" }}
                                            >
                                                FROSTY AGENT
                                            </div>
                                            <p className="text-[10px] sm:text-[10.5px] font-semibold text-slate-700 leading-tight mt-0.5 font-sans">
                                                Responds instantly in seconds
                                            </p>
                                            <span className="mt-1 sm:mt-1.5 inline-block text-[8.5px] sm:text-[9px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-[#0396A6]/10 text-[#0396A6] border border-[#0396A6]/20 font-sans">
                                                24/7 • Instant • Accurate
                                            </span>
                                        </div>

                                        {/* Mobile Vertical Wire Connector (Between Frosty Agent & Qualified Lead) */}
                                        <div className="flex sm:hidden items-center justify-center w-full h-[22px] my-0.5 relative overflow-visible">
                                            <svg className="w-[120px] h-[22px] overflow-visible" viewBox="0 0 120 22" fill="none">
                                                <path d="M 60 0 L 60 22" stroke="#0396A6" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.75" markerEnd="url(#teal-arrow-with)" />
                                                <circle r="2.5" fill="#0396A6" filter="url(#wire-glow-with)">
                                                    <animateMotion dur="1.5s" repeatCount="indefinite" path="M 60 0 L 60 22" keyPoints="0;1" keyTimes="0;1" />
                                                </circle>
                                            </svg>
                                        </div>

                                        {/* Desktop Wire Connector with Animated Flowing Atoms - Touching Frosty Agent and Qualified Lead */}
                                        <div className="hidden sm:flex items-center justify-center w-[36px] lg:w-[44px] h-[24px] shrink-0 relative overflow-visible">
                                            <svg className="w-full h-full overflow-visible" viewBox="0 0 44 24" fill="none">
                                                <path d="M 0 12 L 44 12" stroke="#0396A6" strokeWidth="1.5" strokeDasharray="3.5 3.5" strokeOpacity="0.75" markerEnd="url(#teal-arrow-with)" />
                                                <circle r="3" fill="#0396A6" filter="url(#wire-glow-with)">
                                                    <animateMotion
                                                        dur="1.8s"
                                                        repeatCount="indefinite"
                                                        path="M 0 12 L 44 12"
                                                        keyPoints="0;1"
                                                        keyTimes="0;1"
                                                    />
                                                </circle>
                                                <circle r="3" fill="#0396A6" filter="url(#wire-glow-with)">
                                                    <animateMotion
                                                        dur="1.8s"
                                                        begin="0.9s"
                                                        repeatCount="indefinite"
                                                        path="M 0 12 L 44 12"
                                                        keyPoints="0;1"
                                                        keyTimes="0;1"
                                                    />
                                                </circle>
                                            </svg>
                                        </div>

                                        {/* Block 5: Qualified Lead Card */}
                                        <div className="flex-1 sm:max-w-[150px] lg:max-w-[165px] p-3 sm:p-4 rounded-2xl sm:rounded-[18px] border border-teal-200/90 bg-white shadow-2xs text-center flex flex-col items-center justify-center shrink-0">
                                            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#0396A6] stroke-[1.75] mb-1 sm:mb-1.5" />
                                            <div
                                                className="text-xs sm:text-[12.5px] font-bold text-slate-900 leading-tight font-sans"
                                                style={{ fontFamily: "'Outfit', -apple-system, sans-serif" }}
                                            >
                                                Qualified Lead
                                            </div>
                                            <p className="text-[9px] sm:text-[9.5px] text-slate-600 leading-tight mt-0.5 font-sans">
                                                Happy customer <br />
                                                Higher conversions
                                            </p>
                                            <span className="text-[9.5px] sm:text-[10px] font-bold text-[#0396A6] mt-1 block font-sans">
                                                More revenue
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}


