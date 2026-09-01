// @ts-nocheck
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

const BARS_DATA = [
  {
    time: "5 min",
    valLabel: "100",
    percentage: 100,
    barColor: "bg-gradient-to-b from-[#06B6D4] to-[#0396A6]",
    badgeBg: "bg-teal-50 border border-teal-200/90 text-[#0396A6]",
    arrowColor: "border-t-teal-200",
  },
  {
    time: "10 min",
    valLabel: "25",
    percentage: 25,
    barColor: "bg-[#D8B896]",
    badgeBg: "bg-[#F7EFE8] border border-[#E8D7C8] text-[#8C6D58]",
    arrowColor: "border-t-[#E8D7C8]",
  },
  {
    time: "30 min",
    valLabel: "4.8",
    percentage: 5,
    barColor: "bg-[#E29578]",
    badgeBg: "bg-[#FBEBEB] border border-[#F2D1D1] text-[#B85D5D]",
    arrowColor: "border-t-[#F2D1D1]",
  },
];

export default function PremiumOddsDashboard() {
  return (
    <div className="w-full h-full flex flex-col justify-between font-sans z-10 pt-0 lg:pt-[88px] xl:pt-[98px]">

      {/* Chart Canvas Area: Stretched taller in vertical with slimmer bars */}
      <div className="relative w-full pt-2 sm:pt-4">

        {/* Y-Axis scale + Horizontal Grid Lines */}
        <div className="relative pl-7 sm:pl-8 pr-1 sm:pr-2">

          {/* Y-Axis numbers */}
          <div className="absolute top-0 left-0 bottom-0 flex flex-col justify-between text-[10px] sm:text-[11px] font-semibold text-slate-500 py-[2px]">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>

          {/* Grid lines & Bars Box */}
          <div className="relative h-[220px] sm:h-[250px] lg:h-[265px] w-full border-b border-slate-200/90 flex items-end justify-between px-2 sm:px-8 lg:px-10 pb-[1px]">

            {/* Horizontal Grid lines */}
            {[0, 25, 50, 75, 100].map((val) => (
              <div
                key={val}
                className="absolute left-0 right-0 h-px bg-slate-200/70 pointer-events-none"
                style={{ bottom: `${val}%` }}
              />
            ))}

            {/* 3 Slimmer Bars */}
            {BARS_DATA.map((item, i) => (
              <div
                key={item.time}
                className="relative flex flex-col justify-end items-center w-1/3 max-w-[68px] sm:max-w-[76px] lg:max-w-[82px] h-full z-10"
              >
                {/* Floating Tooltip + Number Label Positioned Directly Above Bar Top */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="absolute flex flex-col items-center pointer-events-none"
                  style={{ bottom: `calc(${item.percentage}% + 5px)` }}
                >
                  {/* Tooltip Pill */}
                  <div className={`px-1.5 sm:px-2.5 py-0.5 rounded-md text-[9px] sm:text-[10.5px] font-extrabold shadow-2xs whitespace-nowrap ${item.badgeBg}`}>
                    {item.time}
                  </div>
                  {/* Tooltip Pointer Triangle */}
                  <div className={`w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[4px] ${item.arrowColor}`} />

                  {/* Numerical Value right above bar */}
                  <div className="mt-1 text-xs sm:text-sm font-bold text-slate-800 leading-none">
                    {item.valLabel}
                  </div>
                </motion.div>

                {/* Solid Animated Bar reaching exact grid line */}
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${item.percentage}%` }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 70, damping: 15, delay: 0.1 + i * 0.1 }}
                  style={{ height: `${item.percentage}%` }}
                  className={`w-full rounded-t-xl shadow-2xs relative overflow-hidden ${item.barColor}`}
                >
                  {/* Specular Top Shine */}
                  <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent" />
                </motion.div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Sub-label floating centered in the middle gap with clean breathing room above and below */}
      <div className="w-full text-center py-1.5 my-auto">
        <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-slate-400 uppercase font-sans">
          RELATIVE ODDS (INDEX)
        </span>
      </div>

      {/* Bottom Lightbulb Callout Card - Aligned to exact same baseline as left Trophy Card */}
      <div className="w-full bg-[#F0FDFA]/70 border border-teal-100/90 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3.5 shadow-2xs">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0396A6] flex items-center justify-center text-white shrink-0 shadow-sm">
          <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
        </div>
        <div className="text-[12px] sm:text-[12.5px] text-slate-800 leading-snug font-sans">
          Responding within 5 minutes makes you <span className="font-bold text-[#0396A6]">7x</span> more likely to qualify the lead.
        </div>
      </div>

    </div>
  );
}
