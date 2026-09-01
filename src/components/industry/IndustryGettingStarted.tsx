import React from 'react';
import Link from 'next/link';
import type { Industry } from '@/lib/industries';
import { ArrowRight, Upload, ShieldCheck, Rocket } from 'lucide-react';

interface Props {
  industry: Industry;
}

export function IndustryGettingStarted({ industry }: Props) {
  if (!industry.started_heading) return null;

  return (
    <section className="py-20 md:py-28 bg-[#FAFAFA] border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            {industry.started_heading}
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            From your first document upload to a fully deployed agent — a structured process that gets it right.
          </p>
        </div>

        {/* Steps */}
        {industry.setup_steps && industry.setup_steps.length > 0 && (
          <div className="relative mb-24 max-w-5xl mx-auto">
            {/* Horizontal dotted line */}
            <div className="hidden md:block absolute top-[48px] left-[16.66%] right-[16.66%] h-px border-t-[2px] border-dotted border-slate-300 z-0" />
            
            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              {industry.setup_steps.map((step, idx) => {
                const icons: any[] = [Upload, ShieldCheck, Rocket];
                const Icon = icons[idx % icons.length] as any;
                
                return (
                  <div key={idx} className="flex flex-col items-center text-center relative px-2">
                    
                    <div className="bg-[#FAFAFA] px-6 mb-6 z-10">
                       <div className="w-24 h-24 rounded-full bg-[#0396A6]/10 border border-[#0396A6]/20 flex items-center justify-center">
                         <Icon className="w-10 h-10 text-slate-800" strokeWidth={1.5} />
                       </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-[#0396A6] mb-3 px-4">
                      {step.title}
                    </h3>
                    
                    <p className="text-slate-600 leading-relaxed px-4">
                      {step.description}
                    </p>
                    
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pricing Box */}
        {industry.pricing_summary && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-200/50 relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0396A6] to-emerald-400" />
              
              <h3 className="text-xl font-bold text-slate-900 mb-4">Pricing</h3>
              
              <p className="text-slate-600 leading-relaxed mb-8 font-medium max-w-2xl mx-auto">
                {industry.pricing_summary}
              </p>
              
              {industry.pricing_link && (
                <Link 
                  href={industry.pricing_link}
                  className="inline-flex items-center text-[#0396A6] font-bold hover:text-[#027D8A] transition-colors group bg-[#0396A6]/5 px-6 py-3 rounded-full hover:bg-[#0396A6]/10"
                >
                  View full pricing 
                  <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
