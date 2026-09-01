'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import FrostyIcon from '@/components/FrostyIcon';

function Icon({ n }: { n: string }) {
    const p: Record<string, React.ReactNode> = {
        chat: <path d="M4 5h16v11H8l-4 4V5z" />,
        shield: <path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3zM9 12l2 2 4-4" />,
        bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
        bag: <path d="M2.6 4.6h2.3l2.5 10.6h9.4l2.2-7.5H6.4M9.6 19.4a1.3 1.3 0 10-.1-2.6 1.3 1.3 0 00.1 2.6zM17 19.4a1.3 1.3 0 10-.1-2.6 1.3 1.3 0 00.1 2.6z" />,
        house: <path d="M3.5 11L12 4.6l8.5 6.4M6 9.9V20h12V9.9M10 20v-5.4h4V20" />,
        cross: <path d="M3.8 8.6h16.4v10.6H3.8zM9 8.6V6.7a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5v1.9M12 11.2v5M9.5 13.7h5" />,
        cap: <path d="M2.6 9.4L12 5l9.4 4.4L12 13.8 2.6 9.4zM6.6 11.6V16c0 1.4 2.4 2.6 5.4 2.6s5.4-1.2 5.4-2.6v-4.4M20.4 10v4.6" />,
        car: <path d="M3.6 14.4h16.8M6 14.4l1.7-5a1.2 1.2 0 011.1-.8h6.4a1.2 1.2 0 011.1.8l1.7 5M7.8 11.4h8.4M4.4 14.4v2.8M19.6 14.4v2.8M8.4 17.6a1.3 1.3 0 10-.1-2.6 1.3 1.3 0 00.1 2.6zM15.6 17.6a1.3 1.3 0 10-.1-2.6 1.3 1.3 0 00.1 2.6z" />,
        horn: <path d="M3.6 10.2v3.6a1 1 0 001 1h2.2l6.4 3.8V5.4L6.8 9.2H4.6a1 1 0 00-1 1zM16.8 9.2a4.2 4.2 0 010 5.6M19.4 7.2a7.6 7.6 0 010 9.6" />,
        bank: <path d="M3.4 9.6L12 4.8l8.6 4.8M5.6 10.4v7.8M9.8 10.4v7.8M14.2 10.4v7.8M18.4 10.4v7.8M3 19.4h18" />,
        plane: <path d="M20.8 3.4L3.4 10.4l7.1 3.2 3.2 7.1 7.1-17.3z" />,
        tools: <path d="M17.4 4.6a4.6 4.6 0 00-6.1 6.1l-6.6 6.6a1.9 1.9 0 002.7 2.7l6.6-6.6a4.6 4.6 0 006.1-6.1l-2.9 2.9-2.7-.6-.6-2.7 2.9-2.9z" />,
        scales: <path d="M12 4.4v15M7.6 19.4h8.8M4.6 8.4h14.8M4.6 8.4L2.5 13a2.4 2.4 0 004.2 0L4.6 8.4zM19.4 8.4L17.3 13a2.4 2.4 0 004.2 0l-2.1-4.6z" />,
    };
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p[n]}</svg>;
}

const HUB_ITEMS = [
    { id: "bag", label: "E-commerce", x: 25, y: 15, desc: "Handles order tracking, returns & sizing FAQs instantly", color: "#0396A6", lightBg: "#F0FDFA" },
    { id: "house", label: "Real estate", x: 50, y: 10, desc: "Qualifies buyers, schedules viewings & shares property brochures", color: "#0396A6", lightBg: "#F0FDFA" },
    { id: "cross", label: "Healthcare", x: 75, y: 15, desc: "Books appointments, triage questions & clinic hours 24/7", color: "#0396A6", lightBg: "#F0FDFA" },
    { id: "cap", label: "Education", x: 12, y: 36, desc: "Answers course queries, fee structures & application deadlines", color: "#0396A6", lightBg: "#F0FDFA" },
    { id: "car", label: "Automobile", x: 88, y: 36, desc: "Schedules test drives, service bookings & financing queries", color: "#0396A6", lightBg: "#F0FDFA" },
    { id: "horn", label: "Marketing", x: 12, y: 58, desc: "Qualifies agency leads, shares case studies & books calls", color: "#0396A6", lightBg: "#F0FDFA" },
    { id: "bank", label: "Finance", x: 88, y: 58, desc: "Answers loan queries, KYC guidance & account FAQs", color: "#0396A6", lightBg: "#F0FDFA" },
    { id: "tools", label: "Home services", x: 24, y: 74, desc: "Dispatches technicians, provides instant quotes & books jobs", color: "#0396A6", lightBg: "#F0FDFA" },
    { id: "plane", label: "Travel", x: 50, y: 76, desc: "Handles flight/hotel bookings, vacation itineraries & support 24/7", color: "#0396A6", lightBg: "#F0FDFA" },
    { id: "scales", label: "Legal", x: 76, y: 74, desc: "Collects case details, qualifies retainers & schedules consultations", color: "#0396A6", lightBg: "#F0FDFA" },
];

function RadialIndustryHub() {
    const [activeId, setActiveId] = useState("plane");

    return (
        <div className="w-full relative flex flex-col items-center justify-center">
            {/* Radial Hub */}
            <div className="relative w-full max-w-[780px] h-[380px] sm:h-[460px] xl:h-[520px] mx-auto select-none my-2 overflow-hidden sm:overflow-visible">
                <style>{`
                    @keyframes dash-flow {
                        to { stroke-dashoffset: -24; }
                    }
                    .animate-dash-flow {
                        animation: dash-flow 1.5s linear infinite;
                    }
                `}</style>
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <defs>
                        <radialGradient id="hubGlowLight" cx="50%" cy="46%" r="42%">
                            <stop offset="0%" stopColor="#0396A6" stopOpacity="0.06" />
                            <stop offset="100%" stopColor="#0396A6" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#hubGlowLight)" />

                    {HUB_ITEMS.map((item, index) => {
                        const isActive = activeId === item.id;
                        const isMobileVisible = index === 1 || index === 3 || index === 4 || index === 8;
                        return (
                            <g key={item.id} className={isMobileVisible ? '' : 'hidden sm:block'}>
                                <line x1="50%" y1="46%" x2={`${item.x}%`} y2={`${item.y}%`}
                                    stroke={isActive ? item.color : "#CBD5E1"} strokeWidth={isActive ? "2.5" : "1"}
                                    strokeDasharray={isActive ? "6 6" : "3 3"} 
                                    strokeOpacity={isActive ? "1" : "0.5"}
                                    className={`transition-all duration-300 ${isActive ? 'animate-dash-flow' : ''}`} />
                                <circle cx={`${50 + (item.x - 50) * 0.45}%`} cy={`${46 + (item.y - 46) * 0.45}%`}
                                    r={isActive ? "4" : "2"} fill={isActive ? item.color : "#94A3B8"}
                                    fillOpacity={isActive ? "1" : "0.5"} className="transition-all duration-300" />
                            </g>
                        );
                    })}
                </svg>

                {/* Wireframe rings */}
                <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center scale-75 sm:scale-100">
                    <div className="w-[240px] h-[270px] xl:w-[280px] xl:h-[310px] border border-[#0396A6]/15 animate-[pulse_4s_ease-in-out_infinite]"
                        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                    <div className="absolute w-[360px] h-[360px] xl:w-[400px] xl:h-[400px] rounded-full border border-[#0396A6]/10" />
                    <div className="absolute w-[360px] h-[360px] xl:w-[400px] xl:h-[400px] rounded-full border border-[#0396A6]/15 animate-ping opacity-25" style={{ animationDuration: '5s' }} />
                    <div className="absolute w-[180px] h-[180px] rounded-full bg-[#0396A6]/5 blur-lg" />
                </div>

                {/* Center hub */}
                <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center scale-50 sm:scale-100">
                    <div className="relative group cursor-pointer">
                        <div className="absolute -inset-6 bg-[#0396A6]/15 rounded-full blur-2xl opacity-80 group-hover:opacity-100 group-hover:bg-[#0396A6]/25 animate-[pulse_4s_ease-in-out_infinite] transition-all duration-500" />
                        <div className="w-28 h-32 xl:w-32 xl:h-36 bg-white shadow-[0_10px_35px_rgba(3, 150, 166,0.15)] flex items-center justify-center border-2 border-[#0396A6]/40 transition-transform duration-500 hover:scale-110 group-hover:border-[#0396A6] relative overflow-hidden"
                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                            <div className="absolute inset-0 flex flex-col items-center justify-center -mt-2">
                                <div className="drop-shadow-[0_2px_10px_rgba(3, 150, 166,0.3)] animate-[pulse_3s_ease-in-out_infinite]">
                                  <FrostyIcon size={60} glow={0.6} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Industry cards */}
                {HUB_ITEMS.map((item, index) => {
                    const isActive = activeId === item.id;
                    const isMobileVisible = index === 1 || index === 3 || index === 4 || index === 8;
                    return (
                        <div key={item.id} onMouseEnter={() => setActiveId(item.id)} onClick={() => setActiveId(item.id)}
                            className={`absolute z-20 cursor-pointer group flex justify-center ${isMobileVisible ? 'block' : 'hidden sm:block'}`}
                            style={{ left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%, -50%)' }}>
                            <motion.div animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 3 + (index % 3), repeat: Infinity, ease: "easeInOut" }}
                                className={`flex flex-col items-center justify-center bg-white/95 backdrop-blur-md border shadow-sm hover:shadow-md rounded-[14px] p-1.5 xl:p-2 transition-all duration-300 w-[44px] sm:w-[84px] group-hover:w-[84px] ${
                                    isActive ? 'scale-110 z-30 shadow-[0_10px_30px_rgba(3, 150, 166,0.15)] border-2 !w-[84px] sm:!w-[94px]' : 'border-slate-200 hover:border-[#0396A6]/40 hover:scale-105 hover:bg-white'
                                }`}
                                style={{ 
                                    borderColor: isActive ? item.color : undefined,
                                }}>
                                <div className={`relative flex items-center justify-center ${isActive ? 'mb-1' : 'mb-0 sm:mb-1 group-hover:mb-1'}`}>
                                    <div className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[#0396A6] transition-transform duration-300">
                                        <span className="w-5 h-5 flex items-center justify-center"><Icon n={item.id} /></span>
                                    </div>
                                </div>
                                <span className={`text-[10px] xl:text-[11px] font-bold text-center tracking-tight leading-tight transition-colors duration-300 truncate w-full px-0.5 ${isActive ? 'block' : 'hidden sm:block group-hover:block'}`}
                                    style={{ color: isActive ? item.color : '#334155' }}>
                                    {item.label}
                                </span>
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function IndustriesSection() {
    return (
        <section id="who-its-for" className="relative w-full overflow-hidden font-sans pt-8 sm:pt-12 pb-8 sm:pb-12 bg-transparent">
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 relative z-10">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-8 w-full relative z-10">
                    {/* Left Column */}
                    <div className="w-full lg:w-[45%] flex flex-col items-start text-left lg:pr-8 xl:pr-12 pt-1 sm:pt-2">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 relative group bg-[#0396A6]/[0.08] border border-[#0396A6]/20 backdrop-blur-sm shadow-xs"
                        >
                            <Users className="w-3.5 h-3.5 text-[#0396A6]" />
                            <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#0396A6]">WHO IS FROSTY FOR?</span>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
                            className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#0F172A] leading-[1.15] tracking-tight m-0 mb-6"
                        >
                            If your business relies on leads,<br />
                            <span className="text-[#0396A6] font-bold" style={{ color: '#0396A6' }}>Frosty turns them</span><br />
                            into customers 24/7.
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                            className="text-sm md:text-base text-slate-600 font-normal leading-relaxed max-w-xl m-0 mb-6"
                        >
                            From e-commerce to clinics to car showrooms — if your leads arrive through a website or WhatsApp, Frosty can answer them, qualify them, and act on them automatically 24/7.
                        </motion.p>
                    </div>

                    {/* Right Column */}
                    <div className="w-full lg:w-[55%] relative flex flex-col justify-center items-center pt-8 lg:pt-0">
                        <RadialIndustryHub />
                    </div>
                </div>
            </div>
        </section>
    );
}
