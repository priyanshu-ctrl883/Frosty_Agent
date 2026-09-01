'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import IsometricPlatform from './IsometricPlatform';

export default function CapabilitiesSection() {
    return (
        <section id="under-the-hood" className="relative pt-12 pb-8 lg:pb-12 bg-transparent overflow-hidden">
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8 w-full relative">
                    {/* Left: text */}
                    <div className="w-full lg:w-[45%] flex flex-col items-start text-left lg:pr-8 xl:pr-12">
                        {/* Premium Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 relative group bg-[#0396A6]/[0.08] border border-[#0396A6]/20 backdrop-blur-sm shadow-xs"
                        >
                            <Settings className="w-3.5 h-3.5 text-[#0396A6]" />
                            <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#0396A6]">UNDER THE HOOD</span>
                        </motion.div>

                        {/* Editorial Heading */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
                            className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#0F172A] leading-[1.15] tracking-tight m-0 mb-6"
                        >
                            Enterprise-grade.<br />
                            <span className="text-[#0396A6] font-bold" style={{ color: '#0396A6' }}>Engineered</span><br />
                            from the ground up.
                        </motion.h2>

                        {/* Premium Paragraph */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                            className="text-sm md:text-base text-slate-600 font-normal leading-relaxed max-w-xl m-0 mb-6"
                        >
                            Every request flows through a purpose-built AI architecture that crawls, understands, retrieves and reasons before generating enterprise-grade responses.
                        </motion.p>

                        {/* Key Pillars */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="flex flex-col gap-3 w-full max-w-lg"
                        >
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/90 border border-slate-200 shadow-2xs">
                                <span className="text-xs font-bold font-mono text-[#0396A6] shrink-0 w-5">01</span>
                                <div>
                                    <h4 className="text-[13px] font-bold text-slate-900 leading-tight">Isolated Knowledge Layer</h4>
                                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Your proprietary data is vector-embedded into isolated client boundaries.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/90 border border-slate-200 shadow-2xs">
                                <span className="text-xs font-bold font-mono text-emerald-700 shrink-0 w-5">02</span>
                                <div>
                                    <h4 className="text-[13px] font-bold text-slate-900 leading-tight">Deterministic Guardrails</h4>
                                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Removes invented prices, phone numbers, and links before reaching the customer.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/90 border border-slate-200 shadow-2xs">
                                <span className="text-xs font-bold font-mono text-blue-700 shrink-0 w-5">03</span>
                                <div>
                                    <h4 className="text-[13px] font-bold text-slate-900 leading-tight">Real-Time CRM & Webhooks</h4>
                                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Syncs qualified intents and message transcripts straight into your toolstack.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                    {/* Right: isometric illustration */}
                    <div className="w-full lg:w-[50%] flex justify-center items-center">
                        <IsometricPlatform />
                    </div>
                </div>

            </div>
        </section>
    );
}
