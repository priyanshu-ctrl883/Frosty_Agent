'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

function Icon({ n }: { n: string }) {
    const p: Record<string, React.ReactNode> = {
        arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    };
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p[n]}</svg>;
}

export default function CTASection() {
    return (
        <section className="relative pt-8 sm:pt-12 pb-12 sm:pb-16 bg-transparent">
            <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 xl:px-12 relative z-10">
                <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden px-4 sm:px-8 py-8 sm:py-10 md:px-16 md:py-14 text-center bg-white border border-slate-200 shadow-sm flex flex-col justify-center">
                    <div className="relative z-10 flex flex-col items-center justify-center">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0396A6]/[0.08] border border-[#0396A6]/20 mb-6 backdrop-blur-sm shadow-xs">
                            <span className="w-4 h-4 rounded-full bg-[#0396A6]/20 flex items-center justify-center">
                                <Sparkles className="w-2.5 h-2.5 text-[#0396A6]" />
                            </span>
                            <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#0396A6]">GET STARTED</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#0F172A] leading-[1.15] tracking-tight m-0 mb-6">
                            Capture every enquiry — starting this week.
                        </h2>
                        <p className="text-sm md:text-base text-slate-600 font-normal leading-relaxed max-w-xl mx-auto m-0 mb-6 px-1">
                            Book a 20-minute demo and we&apos;ll set Frosty up on your website and WhatsApp, trained on your own content. You&apos;ll see it answer a real enquiry before you decide.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 pt-2 w-full sm:w-auto">
                            <Link 
                                href="/contact"
                                className="group relative inline-flex items-center justify-center gap-3 px-8 py-3.5 sm:py-4 rounded-full font-bold text-sm text-white bg-[#0396A6] hover:bg-[#027D8A] shadow-[0_10px_30px_rgba(3,150,166,0.3)] hover:shadow-[0_12px_36px_rgba(3,150,166,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden w-full sm:w-auto"
                                style={{ color: '#FFFFFF', textDecoration: 'none' }}
                            >
                                <span className="flex h-2 w-2 relative shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                                </span>
                                
                                <span className="relative z-10 tracking-wide font-bold text-white whitespace-nowrap">Book a demo</span>
                                
                                <span className="w-4 h-4 relative z-10 transform group-hover:translate-x-1.5 transition-transform duration-300 flex items-center justify-center text-white shrink-0">
                                    <Icon n="arrow" />
                                </span>
                            </Link>
                            
                            <a 
                                href="https://wa.me/916399999955"
                                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:py-4 rounded-full font-semibold text-slate-800 hover:text-[#0396A6] text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap w-full sm:w-auto"
                                style={{ textDecoration: 'none' }}
                            >
                                <span>Chat on WhatsApp</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
