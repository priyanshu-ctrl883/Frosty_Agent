'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

export default function ProblemConclusion() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };

    const wordVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <section suppressHydrationWarning className="relative w-full flex flex-col items-center text-center pt-6 sm:pt-8 pb-3 sm:pb-4 bg-transparent z-10 overflow-hidden">
            <motion.h3
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ margin: "-100px", once: true }}
                className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#0F172A] leading-[1.12] tracking-tight m-0 mb-3"
            >
                <span className="inline-block mr-2 md:mr-0">
                    <motion.span variants={wordVariants} className="inline-block mr-[0.25em]">The</motion.span>
                    <motion.span variants={wordVariants} className="inline-block mr-[0.25em]">customer</motion.span>
                    <motion.span variants={wordVariants} className="inline-block mr-[0.25em]">was</motion.span>
                    <motion.span variants={wordVariants} className="inline-block text-[#0396A6] font-bold">ready.</motion.span>
                </span>
                <br className="hidden md:block" />
                <span className="inline-block md:mt-1.5 mb-1.5">
                    <motion.span variants={wordVariants} className="inline-block mr-[0.25em]">The</motion.span>
                    <motion.span variants={wordVariants} className="inline-block mr-[0.25em]">business</motion.span>
                    <motion.span variants={wordVariants} className="inline-block text-[#FF7A5E] font-bold">wasn&apos;t.</motion.span>
                </span>
            </motion.h3>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-100px", once: true }}
                transition={{ duration: 0.8, delay: 1.8 }}
                className="text-[#0396A6] text-[11px] sm:text-sm font-bold tracking-[0.1em] sm:tracking-[0.2em] uppercase m-0 mb-3 px-2 text-center"
            >
                There has to be a better way.
            </motion.p>

            {/* Glowing Dot and Connecting Line */}
            <div className="relative flex flex-col items-center h-[90px] sm:h-[110px] z-20 mt-2">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ margin: "0px", once: true }}
                    transition={{ duration: 0.5, type: "spring", delay: 2.4 }}
                    className="w-2.5 h-2.5 rounded-full bg-[#0396A6] shadow-[0_0_16px_4px_rgba(3, 150, 166,0.4)] relative z-10"
                />
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    whileInView={{ height: '100%', opacity: 1 }}
                    viewport={{ margin: "0px", once: true }}
                    transition={{ duration: 1, delay: 2.7 }}
                    className="w-[1.5px] bg-gradient-to-b from-[#0396A6] via-[#14B8A6] to-transparent relative z-0 -mt-[1px]"
                />
            </div>
        </section>
    );
}
