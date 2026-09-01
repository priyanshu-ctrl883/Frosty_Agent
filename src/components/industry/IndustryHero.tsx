import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Industry } from '@/lib/industries';
import Image from 'next/image';

interface Props {
  industry: Industry;
}

export function IndustryHero({ industry }: Props) {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden bg-[#FAFAFA]">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#0396A6]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#0396A6]/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center text-center">
          
          {/* Text Content */}
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
              {industry.hero_h1 || `${industry.name} AI that executes.`}
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 font-medium mb-10 leading-relaxed max-w-2xl mx-auto">
              {industry.answer_block || industry.desc}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-[#0396A6] rounded-full hover:bg-[#027D8A] transition-colors shadow-lg shadow-[#0396A6]/30 w-full sm:w-auto group"
              >
                {industry.hero_cta || "Start free trial"}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
