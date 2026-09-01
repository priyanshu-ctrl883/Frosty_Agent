'use client';

import React, { useState } from 'react';
import type { Industry } from '@/lib/industries';
import { Plus, Minus } from 'lucide-react';

interface Props {
  industry: Industry;
}

export function GlassFAQ({ industry }: Props) {
  const faqs = industry.faqs;
  if (!faqs || faqs.length === 0) return null;

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const leftCol = faqs.filter((_, i) => i % 2 === 0);
  const rightCol = faqs.filter((_, i) => i % 2 !== 0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const renderFaq = (faq: any, originalIdx: number) => {
    const isOpen = openIndex === originalIdx;
    
    return (
      <div 
        key={originalIdx} 
        className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-[#0396A6]/40 shadow-md shadow-[#0396A6]/5' : 'border-[#0396A6]/20 hover:shadow-md hover:shadow-[#0396A6]/5 hover:border-[#0396A6]/30'}`}
      >
        <button 
          onClick={() => toggle(originalIdx)}
          className="w-full flex items-center justify-between p-5 lg:p-6 cursor-pointer select-none text-left focus:outline-none"
        >
          <div className="flex items-center gap-4 lg:gap-5 pr-4">
             <div className="w-10 h-10 lg:w-11 lg:h-11 shrink-0 rounded-xl bg-[#0396A6]/10 flex items-center justify-center font-extrabold text-[#0396A6] text-sm">
                {String(originalIdx + 1).padStart(2, '0')}
             </div>
             <span className={`text-base lg:text-lg font-bold transition-colors leading-snug ${isOpen ? 'text-[#0396A6]' : 'text-slate-900'}`}>
               {faq.question}
             </span>
          </div>
          
          <div className="shrink-0">
            {isOpen ? (
              <div className="w-8 h-8 rounded-full bg-[#0396A6] flex items-center justify-center text-white shadow-sm transition-all duration-300">
                <Minus className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0396A6]/10 flex items-center justify-center text-[#0396A6] transition-all hover:bg-[#0396A6]/20">
                <Plus className="w-4 h-4" />
              </div>
            )}
          </div>
        </button>
        
        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="px-5 pb-6 lg:px-6 lg:pl-[5.25rem] pl-[4.5rem] text-slate-600 leading-relaxed text-[15px] pt-1">
              {faq.answer}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="py-24 bg-[#FAFAFA] relative px-4 border-t border-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 flex flex-col items-center">
          <div className="flex items-center gap-6">
            <div className="w-12 md:w-24 h-[1px] bg-slate-300"></div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest m-0">
              {industry.faq_heading || "Common questions"}
            </h2>
            <div className="w-12 md:w-24 h-[1px] bg-slate-300"></div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 lg:gap-6 items-start">
          <div className="flex flex-col gap-4 lg:gap-6 flex-1 w-full">
            {leftCol.map((faq, i) => renderFaq(faq, i * 2))}
          </div>
          <div className="flex flex-col gap-4 lg:gap-6 flex-1 w-full">
            {rightCol.map((faq, i) => renderFaq(faq, i * 2 + 1))}
          </div>
        </div>
      </div>
    </section>
  );
}
