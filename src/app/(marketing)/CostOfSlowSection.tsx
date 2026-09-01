'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Users, Clock, Trophy } from 'lucide-react';
import PremiumOddsDashboard from './PremiumOddsDashboard';
import HourglassSandCanvas from '@/components/HourglassSandCanvas';

export default function CostOfSlowSection() {
    return (
        <section id="cost" className="relative py-10 lg:py-14 bg-transparent overflow-hidden">
            <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* 3-Column Layout: Stretched to ensure bottom cards align on the exact same horizontal baseline */}
                <div className="flex flex-col lg:flex-row items-start lg:items-stretch justify-between gap-8 lg:gap-3 xl:gap-6 w-full">

                    {/* ═════════════════════════════════════════════════════════════════════ */}
                    {/* COLUMN 1 (LEFT): Headline, Paragraph, 3 Cards & Trophy Banner         */}
                    {/* ═════════════════════════════════════════════════════════════════════ */}
                    <div className="w-full lg:w-[40%] xl:w-[39%] flex flex-col justify-between z-10 shrink-0">

                        <div className="mb-5">
                            {/* Eyebrow Badge */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0396A6]/[0.08] border border-[#0396A6]/20 mb-3.5 backdrop-blur-sm shadow-2xs">
                                <Zap className="w-3.5 h-3.5 text-[#0396A6]" />
                                <span className="text-[10.5px] font-bold tracking-widest uppercase text-[#0396A6]">
                                    THE COST OF A SLOW REPLY
                                </span>
                            </div>

                            {/* Heading */}
                            <h2 className="text-3xl sm:text-4xl lg:text-[40px] xl:text-[44px] font-serif font-bold text-[#0F172A] leading-[1.12] tracking-tight mb-4">
                                The first five minutes <br />
                                decide who they <span className="text-[#0396A6] relative inline-block">
                                    talk to.
                                    <span className="absolute -bottom-1 left-0 w-20 h-[3px] bg-[#0396A6] rounded-full" />
                                </span>
                            </h2>

                            {/* Body */}
                            <p className="text-sm sm:text-[14.5px] text-slate-600 leading-relaxed max-w-lg">
                                Reply inside five minutes and your odds of qualifying the lead multiply – and almost nobody replies that fast. Frosty is built to win that window, every time.
                            </p>
                        </div>

                        {/* 3 Stat Cards */}
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-4">

                            {/* Card 1: Qualification (Teal) */}
                            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-xl sm:rounded-2xl p-2 sm:p-3.5 text-center flex flex-col items-center justify-between shadow-xs min-h-[120px] sm:min-h-[155px]">
                                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0396A6] stroke-[2.2] shrink-0" />
                                    <span className="text-[8px] sm:text-[10px] font-extrabold text-[#0396A6] tracking-wider uppercase font-sans">
                                        QUALIFICATION
                                    </span>
                                </div>
                                <div className="text-xl sm:text-3xl font-extrabold font-sans text-[#0396A6] leading-none my-1">
                                    7x
                                </div>
                                <div className="text-[8.5px] sm:text-[11px] text-slate-600 leading-tight font-sans">
                                    more likely to qualify<br />the lead
                                </div>
                            </div>

                            {/* Card 2: Advantage (Orange Shade 1: Bright Amber-Orange #F97316) */}
                            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-xl sm:rounded-2xl p-2 sm:p-3.5 text-center flex flex-col items-center justify-between shadow-xs min-h-[120px] sm:min-h-[155px]">
                                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F97316] stroke-[2.2] shrink-0" />
                                    <span className="text-[8px] sm:text-[10px] font-extrabold text-[#F97316] tracking-wider uppercase font-sans">
                                        ADVANTAGE
                                    </span>
                                </div>
                                <div className="text-xl sm:text-3xl font-extrabold font-sans text-[#F97316] leading-none my-1">
                                    60x
                                </div>
                                <div className="text-[8.5px] sm:text-[11px] text-slate-600 leading-tight font-sans">
                                    more likely to connect<br />before competitors
                                </div>
                            </div>

                            {/* Card 3: Average (Orange Shade 2: Deep Crimson-Orange #EA580C) */}
                            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-xl sm:rounded-2xl p-2 sm:p-3.5 text-center flex flex-col items-center justify-between shadow-xs min-h-[120px] sm:min-h-[155px]">
                                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EA580C] stroke-[2.2] shrink-0" />
                                    <span className="text-[8px] sm:text-[10px] font-extrabold text-[#EA580C] tracking-wider uppercase font-sans">
                                        AVERAGE
                                    </span>
                                </div>
                                <div className="text-xl sm:text-3xl font-extrabold font-sans text-[#EA580C] leading-none my-1">
                                    0.4%
                                </div>
                                <div className="text-[8.5px] sm:text-[11px] text-slate-600 leading-tight font-sans">
                                    of leads get a fast<br />human response
                                </div>
                            </div>

                        </div>

                        {/* Bottom Trophy Banner */}
                        <div className="w-full bg-white rounded-2xl p-3 sm:p-3.5 border border-teal-100/80 shadow-xs flex items-center gap-3.5">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0396A6] flex items-center justify-center shrink-0 shadow-sm">
                                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[12px] sm:text-[12.5px] font-bold text-slate-900 leading-tight font-sans">
                                    Frosty Agent replies in seconds – before this chart even starts.
                                </div>
                                <div className="text-[11px] sm:text-[11.5px] text-slate-600 mt-0.5 font-sans">
                                    While others respond, Frosty Agent converts.
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ═════════════════════════════════════════════════════════════════════ */}
                    {/* COLUMN 2 (CENTER): Hourglass (Aligned vertically from 100 to 0)      */}
                    {/* ═════════════════════════════════════════════════════════════════════ */}
                    <div className="hidden lg:flex w-[22%] xl:w-[23%] justify-center items-start pt-[88px] xl:pt-[96px] relative z-20 pointer-events-none">
                        <motion.div
                            animate={{ y: [-4, 4, -4] }}
                            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-[355px] xl:w-[380px] h-[295px] xl:h-[305px] relative items-center justify-center -ml-16 xl:-ml-20"
                        >
                            <div className="relative w-full h-full" style={{
                                backgroundImage: "url('/glowing_hourglass2.png')",
                                backgroundSize: 'contain',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat'
                            }}>
                                {/* Animated Sand Canvas Simulation */}
                                <HourglassSandCanvas />

                                {/* Ambient Top Teal Chamber Glow */}
                                <motion.div
                                    animate={{ opacity: [0.35, 0.65, 0.35], scale: [0.96, 1.04, 0.96] }}
                                    transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute left-1/2 -translate-x-1/2 top-[34%] -translate-y-1/2 w-[85px] h-[28px] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.45)_0%,rgba(3,150,166,0.2)_45%,transparent_75%)] blur-[9px] rounded-full pointer-events-none"
                                />

                                {/* Ambient Bottom Orange Mound Glow */}
                                <motion.div
                                    animate={{ opacity: [0.45, 0.85, 0.45], scale: [0.96, 1.04, 0.96] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute left-1/2 -translate-x-1/2 top-[67%] -translate-y-1/2 w-[85px] h-[24px] bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.45)_0%,rgba(234,88,12,0.25)_45%,transparent_75%)] blur-[9px] rounded-full pointer-events-none"
                                />

                                {/* ── Callout 1 (Top Right): Teal Dot Touching Glass Surface Outline (59.1%) ── */}
                                <div className="absolute left-[59.1%] top-[24%] flex items-center pointer-events-none z-30">
                                    <div className="w-[5px] h-[5px] rounded-full bg-[#0396A6] shrink-0 z-10" />
                                    <div className="w-5 h-[1.5px] bg-[#0396A6] shrink-0 -ml-[0.5px]" />
                                    <div className="text-[12px] xl:text-[12.5px] font-sans leading-[1.15] text-left shrink-0 ml-2">
                                        <div className="font-semibold text-slate-800">Every</div>
                                        <div className="font-bold text-[#0396A6]">second</div>
                                        <div className="font-semibold text-slate-800">counts</div>
                                    </div>
                                </div>

                                {/* ── Callout 2 (Bottom Right): Orange Dot Fixed (60.4%) ── */}
                                <div className="absolute left-[60.4%] top-[72%] flex items-center pointer-events-none z-30">
                                    <div className="w-[5px] h-[5px] rounded-full bg-[#EA580C] shrink-0 z-10" />
                                    <div className="w-5 h-[1.5px] bg-[#EA580C] shrink-0 -ml-[0.5px]" />
                                    <div className="text-[12px] xl:text-[12.5px] font-sans leading-[1.15] text-left shrink-0 ml-2">
                                        <div className="font-bold text-[#EA580C]">Miss it,</div>
                                        <div className="font-semibold text-slate-800">and you</div>
                                        <div className="font-semibold text-slate-800">miss the lead</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ═════════════════════════════════════════════════════════════════════ */}
                    {/* COLUMN 3 (RIGHT): Relative Odds Chart Shifted Left                    */}
                    {/* ═════════════════════════════════════════════════════════════════════ */}
                    <div className="w-full lg:w-[38%] xl:w-[38%] flex flex-col justify-between z-10 shrink-0 lg:-ml-4 xl:-ml-6">
                        <PremiumOddsDashboard />
                    </div>

                </div>
            </div>
        </section>
    );
}
