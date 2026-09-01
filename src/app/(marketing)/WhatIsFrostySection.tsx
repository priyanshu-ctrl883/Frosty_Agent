'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import InteractiveDashboard from './InteractiveDashboard';

export default function WhatIsFrostySection() {
    return (
        <section id="what-is-frosty" className="relative pt-8 sm:pt-12 pb-6 lg:pb-8 bg-transparent overflow-hidden">
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 flex flex-col lg:flex-row items-start gap-8 sm:gap-12 lg:gap-8">
                <div className="w-full lg:w-[50%] flex flex-col justify-start pt-1 sm:pt-2 relative z-20 xl:pr-10">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0396A6]/[0.08] border border-[#0396A6]/20 mb-6 backdrop-blur-sm shadow-xs w-fit">
                        <span className="w-4 h-4 rounded-full bg-[#0396A6]/20 flex items-center justify-center">
                            <Layers className="w-2.5 h-2.5 text-[#0396A6]" />
                        </span>
                        <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#0396A6]">PRODUCT OVERVIEW</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#0F172A] leading-[1.15] tracking-tight text-balance max-w-[20ch] m-0 mb-6">
                        What is Frosty Agent?
                    </h2>
                    <p className="text-sm md:text-base text-slate-600 font-normal leading-relaxed max-w-xl m-0 mb-6">
                        Frosty Agent is a 24/7 AI sales assistant that answers website and WhatsApp enquiries in seconds, qualifies leads, sends quotes, and books meetings directly into your calendar. It responds strictly using your own business content so it never misquotes or makes false promises. Everything syncs into one dashboard where your team can step in anytime. Set it up yourself in under 5 minutes with zero coding.
                    </p>
                </div>

                <div className="w-full lg:w-[50%] relative py-2 sm:py-4">
                    <div className="w-full flex justify-center lg:justify-end">
                        <InteractiveDashboard />
                    </div>
                </div>
            </div>
        </section>
    );
}
