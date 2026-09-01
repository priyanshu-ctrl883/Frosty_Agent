'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import {
    Sparkles,
    MessageSquare,
    Zap,
    Check
} from 'lucide-react';

/* ─── Two-Sparkle Frosty Brand Logo ─── */
function TwoSparklesIcon({ className = "w-9 h-9 sm:w-10 sm:h-10", size = 36 }: { className?: string; size?: number }) {
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

/* ─── Qualified Lead User Silhouette + Checkmark Badge (Matching SS4) ─── */
function QualifiedLeadIcon({ className = "w-10 h-10" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* User Head Outline */}
            <circle cx="11.5" cy="7.5" r="4.5" stroke="#0396A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* User Body Arc Outline */}
            <path d="M4 22v-1.5a6.5 6.5 0 0 1 11-4.8" stroke="#0396A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Solid Teal Circular Checkmark Badge on Bottom Right */}
            <circle cx="19.5" cy="17.5" r="5" fill="#0396A6" />
            {/* White Checkmark inside Badge */}
            <path d="M17.5 17.5l1.5 1.5 3-3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    );
}

/* ─── Bottom Banner SVG Icons (Matching SS3 Reference) ─── */
{/* 1. Solid Filled Lightning Bolt */}
function SolidLightningIcon({ className = "w-6 h-6 sm:w-7 sm:h-7" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="#0396A6"
            stroke="none"
        >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
    );
}

{/* 2. Outlined Shield with Checkmark */}
function ShieldCheckCustomIcon({ className = "w-6 h-6 sm:w-7 sm:h-7" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="#0396A6"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" strokeWidth="2" />
        </svg>
    );
}

{/* 3. Concentric Target with Arrow */}
function TargetCustomIcon({ className = "w-6 h-6 sm:w-7 sm:h-7" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="#0396A6"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="9.5" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2.5" fill="#0396A6" />
            <path d="M16 8l5-5m0 0h-4m4 0v4" strokeWidth="1.85" />
        </svg>
    );
}

{/* 4. Ascending Bar Chart with Trend Arrow */}
function RevenueChartCustomIcon({ className = "w-6 h-6 sm:w-7 sm:h-7" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="#0396A6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {/* 4 Ascending Vertical Bars */}
            <rect x="2" y="15" width="2.8" height="6" rx="0.5" fill="#0396A6" />
            <rect x="6.8" y="12" width="2.8" height="9" rx="0.5" fill="#0396A6" />
            <rect x="11.6" y="9" width="2.8" height="12" rx="0.5" fill="#0396A6" />
            <rect x="16.4" y="6" width="2.8" height="15" rx="0.5" fill="#0396A6" />
            {/* Upward trend line with arrow */}
            <path d="M3 10l5-4 5 3 8-6" stroke="#0396A6" strokeWidth="2" fill="none" />
            <path d="M17 3h4v4" stroke="#0396A6" strokeWidth="2" fill="none" />
        </svg>
    );
}

/* ─── Data Constants ───────────────────────────────────────────── */
const FEATURES = [
    {
        icon: <Sparkles className="w-5 h-5 text-[#0396A6]" strokeWidth={1.75} />,
        title: 'Understands your business',
        description: 'Learns your goals, products and audience.'
    },
    {
        icon: <MessageSquare className="w-5 h-5 text-[#0396A6]" strokeWidth={1.75} />,
        title: 'Engages across every channel',
        description: 'Web, WhatsApp, social and more.'
    },
    {
        icon: <Zap className="w-5 h-5 text-[#0396A6]" strokeWidth={1.75} />,
        title: 'Takes action that drives results',
        description: 'Qualifies leads and moves conversations forward.'
    }
];

const CHANNELS = [
    {
        id: 'website',
        title: 'Website',
        subtitle: 'New enquiry',
        icon: <img loading="lazy" decoding="async" src="/web.svg" alt="Website" className="w-5 h-5 object-contain shrink-0" />
    },
    {
        id: 'whatsapp',
        title: 'WhatsApp',
        subtitle: 'New message',
        icon: <img loading="lazy" decoding="async" src="/whatsapp.png" alt="WhatsApp" className="w-5 h-5 object-contain shrink-0" />
    },
    {
        id: 'email',
        title: 'Email',
        subtitle: 'New email',
        icon: <img loading="lazy" decoding="async" src="/gmail.png" alt="Email" className="w-5 h-5 object-contain shrink-0" />
    }
];

export default function IntroducingFrostySection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: false, margin: '-60px' });
    const [pulseKey, setPulseKey] = useState(0);

    // Periodic heartbeat glow trigger for Frosty central core
    useEffect(() => {
        if (!isInView) return;
        const interval = setInterval(() => {
            setPulseKey((k) => k + 1);
        }, 2800);
        return () => clearInterval(interval);
    }, [isInView]);

    return (
        <section
            ref={sectionRef}
            className="relative w-full min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[920px] flex flex-col justify-between py-6 sm:py-8 lg:py-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden bg-transparent select-none"
        >
            {/* Main Content (Split 2-Column on Desktop) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center flex-1 my-auto relative z-10 w-full">
                
                {/* ── Left Column: Intro & Features ── */}
                <div className="lg:col-span-5 flex flex-col justify-center text-left lg:pr-2 xl:pr-4">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                        {/* Eyebrow Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0396A6]/[0.08] border border-[#0396A6]/20 mb-3.5 backdrop-blur-xs shadow-2xs">
                            <Sparkles className="w-3.5 h-3.5 text-[#0396A6]" strokeWidth={2} />
                            <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#0396A6] font-sans">
                                INTRODUCING FROSTY AGENT
                            </span>
                        </div>

                        {/* Heading */}
                        <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-serif font-bold text-[#0F172A] leading-[1.12] tracking-tight m-0 mb-3">
                            Meet{' '}
                            <span className="text-[#0396A6] font-bold" style={{ color: '#0396A6' }}>
                                Frosty Agent.
                            </span>
                        </h2>

                        {/* Subtitle */}
                        <p className="text-sm sm:text-[15px] text-slate-600 font-normal leading-relaxed max-w-lg m-0 mb-4 font-sans">
                            An AI workforce that engages customers, qualifies leads, and takes action 24/7.
                        </p>

                        {/* Subtle Accent Line */}
                        <div className="w-12 h-1 bg-[#0396A6]/80 rounded-full mb-5" />

                        {/* 3 Core Feature Items */}
                        <div className="flex flex-col gap-3.5 sm:gap-4">
                            {FEATURES.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -14 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 0.15 + idx * 0.1, ease: 'easeOut' }}
                                    className="flex items-start gap-3.5 group"
                                >
                                    <div className="shrink-0 mt-1 text-[#0396A6]">
                                        {item.icon}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug font-sans">
                                            {item.title}
                                        </span>
                                        <span className="text-xs sm:text-[13px] text-slate-500 font-normal leading-relaxed mt-0.5 font-sans">
                                            {item.description}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* ── Right Column: Interactive Diagram Flow (3 Clean Channels) ── */}
                <div className="lg:col-span-7 flex items-center justify-center w-full relative overflow-visible py-2 sm:py-0">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                        className="relative w-[660px] h-[340px] sm:h-[360px] mx-auto flex items-center shrink-0 origin-center scale-[0.45] min-[360px]:scale-[0.52] min-[400px]:scale-[0.58] sm:scale-[0.8] md:scale-[0.92] lg:scale-100 -my-18 min-[360px]:-my-14 sm:-my-6 lg:my-0 pointer-events-auto"
                    >
                        {/* 1. Left Sub-Column: 3 Input Cards */}
                        <div className="absolute left-0 top-0 bottom-0 w-[140px] sm:w-[155px] flex flex-col justify-between py-4 z-20">
                            {CHANNELS.map((ch, idx) => (
                                <motion.div
                                    key={ch.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
                                    whileHover={{ scale: 1.03, x: 2 }}
                                    className="h-[68px] sm:h-[72px] p-2.5 sm:p-3 bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_22px_rgba(3,150,166,0.12)] hover:border-[#0396A6]/40 transition-all flex items-center gap-2 sm:gap-2.5 cursor-pointer backdrop-blur-xs"
                                >
                                    <div className="shrink-0 flex items-center justify-center pl-0.5">
                                        {ch.icon}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight truncate font-sans">
                                            {ch.title}
                                        </span>
                                        <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-tight mt-0.5 truncate font-sans">
                                            {ch.subtitle}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* 2. Middle Central Hub: Frosty Agent Circle */}
                        <div className="absolute left-[47%] -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
                            {/* Ambient Glow */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.08, 1],
                                    opacity: [0.35, 0.6, 0.35]
                                }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute w-[210px] h-[210px] sm:w-[230px] sm:h-[230px] rounded-full bg-[radial-gradient(circle,_rgba(3,150,166,0.22)_0%,_transparent_70%)] blur-xl pointer-events-none"
                            />

                            {/* Outer Subtle Pulse Ring */}
                            <motion.div
                                key={`pulse-${pulseKey}`}
                                initial={{ scale: 0.95, opacity: 0.8 }}
                                animate={{ scale: 1.25, opacity: 0 }}
                                transition={{ duration: 1.8, ease: 'easeOut' }}
                                className="absolute w-[165px] h-[165px] sm:w-[185px] sm:h-[185px] rounded-full border border-[#0396A6]/40 pointer-events-none"
                            />

                            {/* Frosty Agent Main Circular Card with Vivid Teal Border on Hover (SS2) */}
                            <motion.div
                                whileHover={{
                                    scale: 1.04,
                                    borderColor: '#0396A6',
                                    borderWidth: '2.5px',
                                    boxShadow: '0 0 28px rgba(3, 150, 166, 0.4), 0 8px 32px rgba(3, 150, 166, 0.2)'
                                }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                className="relative w-[165px] h-[165px] sm:w-[185px] sm:h-[185px] rounded-full bg-white border-2 border-[#0396A6]/30 shadow-[0_8px_32px_rgba(3,150,166,0.12)] hover:border-[#0396A6] hover:shadow-[0_0_28px_rgba(3,150,166,0.4)] flex flex-col items-center justify-center text-center p-3 cursor-pointer group transition-all duration-300"
                            >
                                <motion.div
                                    whileHover={{ rotate: 90, scale: 1.1 }}
                                    transition={{ duration: 0.4 }}
                                    className="mb-1"
                                >
                                    <TwoSparklesIcon size={34} />
                                </motion.div>

                                <span className="font-bold text-[15px] sm:text-[17px] text-[#0396A6] tracking-tight leading-tight font-sans">
                                    Frosty Agent
                                </span>

                                <div className="mt-1.5 flex flex-col items-center gap-0.5">
                                    <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 tracking-wider font-sans">
                                        Understand <span className="text-[#0396A6] mx-0.5">•</span> Respond
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 tracking-wider font-sans">
                                        Qualify <span className="text-[#0396A6] mx-0.5">•</span> Act
                                    </span>
                                </div>
                            </motion.div>
                        </div>

                        {/* 3. Right Sub-Column: Qualified Lead Card (Matching SS4) */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[125px] sm:w-[140px] z-20">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                whileHover={{ scale: 1.04, y: -2 }}
                                className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_22px_rgba(3,150,166,0.12)] hover:border-[#0396A6]/40 transition-all flex flex-col items-center text-center cursor-pointer"
                            >
                                <QualifiedLeadIcon className="w-9 h-9 sm:w-10 sm:h-10 mb-1" />

                                <span className="text-xs sm:text-[13px] font-bold text-slate-900 mt-1.5 mb-2 leading-tight font-sans">
                                    Qualified Lead
                                </span>

                                <div className="flex flex-col gap-1 w-full text-left">
                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-600 font-medium leading-tight font-sans">
                                        <Check className="w-3.5 h-3.5 text-[#0396A6] stroke-[2.5] shrink-0" />
                                        <span className="truncate">CRM Updated</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-600 font-medium leading-tight font-sans">
                                        <Check className="w-3.5 h-3.5 text-[#0396A6] stroke-[2.5] shrink-0" />
                                        <span className="truncate">Follow-up Ready</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* 4. SVG Connecting Paths & Animated Data Packets (3 Clean Channels) */}
                        <svg
                            className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
                            viewBox="0 0 660 360"
                            preserveAspectRatio="none"
                        >
                            <defs>
                                {/* Directional Arrow Markers */}
                                <marker
                                    id="teal-arrow"
                                    viewBox="0 0 10 10"
                                    refX="6"
                                    refY="5"
                                    markerWidth="5"
                                    markerHeight="5"
                                    orient="auto"
                                >
                                    <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#0396A6" />
                                </marker>

                                {/* Packet Glow Filter */}
                                <filter id="pulse-glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Path 1: Website (Top) -> Frosty */}
                            <path
                                id="path-website"
                                d="M 152 50 L 210 50 Q 225 50 225 65 L 225 115 Q 225 125 238 128 L 255 132"
                                fill="none"
                                stroke="#0396A6"
                                strokeWidth="1.5"
                                strokeDasharray="3.5 3.5"
                                strokeOpacity="0.75"
                                markerEnd="url(#teal-arrow)"
                            />

                            {/* Path 2: WhatsApp (Center) -> Frosty */}
                            <path
                                id="path-whatsapp"
                                d="M 152 180 L 255 180"
                                fill="none"
                                stroke="#0396A6"
                                strokeWidth="1.5"
                                strokeDasharray="3.5 3.5"
                                strokeOpacity="0.75"
                                markerEnd="url(#teal-arrow)"
                            />

                            {/* Path 3: Email (Bottom) -> Frosty */}
                            <path
                                id="path-email"
                                d="M 152 310 L 210 310 Q 225 310 225 295 L 225 245 Q 225 235 238 232 L 255 228"
                                fill="none"
                                stroke="#0396A6"
                                strokeWidth="1.5"
                                strokeDasharray="3.5 3.5"
                                strokeOpacity="0.75"
                                markerEnd="url(#teal-arrow)"
                            />

                            {/* Path 4: Frosty -> Qualified Lead (Right) */}
                            <path
                                id="path-lead"
                                d="M 405 180 L 522 180"
                                fill="none"
                                stroke="#0396A6"
                                strokeWidth="1.5"
                                strokeDasharray="3.5 3.5"
                                strokeOpacity="0.75"
                                markerEnd="url(#teal-arrow)"
                            />

                            {/* ── Animated Flowing Data Packets (Synchronized) ── */}
                            {/* Packet 1: Website */}
                            <circle r="3" fill="#0396A6" filter="url(#pulse-glow)">
                                <animateMotion
                                    dur="2.4s"
                                    repeatCount="indefinite"
                                    path="M 152 50 L 210 50 Q 225 50 225 65 L 225 115 Q 225 125 238 128 L 255 132"
                                    keyPoints="0;1"
                                    keyTimes="0;1"
                                />
                            </circle>

                            {/* Packet 2: WhatsApp */}
                            <circle r="3" fill="#0396A6" filter="url(#pulse-glow)">
                                <animateMotion
                                    dur="2.4s"
                                    repeatCount="indefinite"
                                    path="M 152 180 L 255 180"
                                    keyPoints="0;1"
                                    keyTimes="0;1"
                                />
                            </circle>

                            {/* Packet 3: Email */}
                            <circle r="3" fill="#0396A6" filter="url(#pulse-glow)">
                                <animateMotion
                                    dur="2.4s"
                                    repeatCount="indefinite"
                                    path="M 152 310 L 210 310 Q 225 310 225 295 L 225 245 Q 225 235 238 232 L 255 228"
                                    keyPoints="0;1"
                                    keyTimes="0;1"
                                />
                            </circle>

                            {/* Packet 4: Frosty -> Qualified Lead (Repeats rhythmically) */}
                            <circle r="3.2" fill="#0396A6" filter="url(#pulse-glow)">
                                <animateMotion
                                    dur="1.8s"
                                    begin="0.8s"
                                    repeatCount="indefinite"
                                    path="M 405 180 L 522 180"
                                    keyPoints="0;1"
                                    keyTimes="0;1"
                                />
                            </circle>
                            <circle r="3.2" fill="#0396A6" filter="url(#pulse-glow)">
                                <animateMotion
                                    dur="1.8s"
                                    begin="1.7s"
                                    repeatCount="indefinite"
                                    path="M 405 180 L 522 180"
                                    keyPoints="0;1"
                                    keyTimes="0;1"
                                />
                            </circle>
                        </svg>
                    </motion.div>
                </div>

            </div>

            {/* ── Bottom Metrics Banner (Matching SS3 Reference with Solid Lightning, Shield, Target & Revenue Chart) ── */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
                className="w-full relative z-10 mt-4 lg:mt-2"
            >
                <div className="w-full rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-xs px-4 sm:px-8 py-3.5 sm:py-4 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-0 items-center lg:divide-x divide-slate-200/70">
                        
                        {/* Stat 1: Instant Response (Solid Filled Lightning Bolt) */}
                        <div className="flex items-center gap-3 sm:gap-3.5 lg:px-6 first:lg:pl-2">
                            <div className="shrink-0 flex items-center justify-center">
                                <SolidLightningIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight font-sans">
                                    Instant Response
                                </span>
                                <span className="text-[10.5px] sm:text-[11.5px] text-slate-500 font-normal leading-tight mt-0.5 font-sans">
                                    Engage in seconds
                                </span>
                            </div>
                        </div>

                        {/* Stat 2: Never Miss a Lead (Outlined Shield with Checkmark) */}
                        <div className="flex items-center gap-3 sm:gap-3.5 lg:px-6">
                            <div className="shrink-0 flex items-center justify-center">
                                <ShieldCheckCustomIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight font-sans">
                                    Never Miss a Lead
                                </span>
                                <span className="text-[10.5px] sm:text-[11.5px] text-slate-500 font-normal leading-tight mt-0.5 font-sans">
                                    24/7 coverage
                                </span>
                            </div>
                        </div>

                        {/* Stat 3: Higher Conversions (Concentric Archery Target with Arrow) */}
                        <div className="flex items-center gap-3 sm:gap-3.5 lg:px-6">
                            <div className="shrink-0 flex items-center justify-center">
                                <TargetCustomIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight font-sans">
                                    Higher Conversions
                                </span>
                                <span className="text-[10.5px] sm:text-[11.5px] text-slate-500 font-normal leading-tight mt-0.5 font-sans">
                                    Turn more leads into sales
                                </span>
                            </div>
                        </div>

                        {/* Stat 4: More Revenue (Ascending Bar Chart with Trend Arrow) */}
                        <div className="flex items-center gap-3 sm:gap-3.5 lg:px-6 last:lg:pr-2">
                            <div className="shrink-0 flex items-center justify-center">
                                <RevenueChartCustomIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight font-sans">
                                    More Revenue
                                </span>
                                <span className="text-[10.5px] sm:text-[11.5px] text-slate-500 font-normal leading-tight mt-0.5 font-sans">
                                    Grow your business
                                </span>
                            </div>
                        </div>

                    </div>
                </div>
            </motion.div>

        </section>
    );
}
