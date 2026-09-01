import React from 'react';
import { Industry } from '@/lib/industries';
import { Quote } from 'lucide-react';

interface Props {
  industry: Industry;
}

export function IndustryProof({ industry }: Props) {
  if (!industry.proof_render || !industry.proof_body) return null;

  return (
    <section className="py-20 md:py-28 bg-[#0396A6]/5 border-t border-[#0396A6]/10">
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        
        {industry.proof_heading && (
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-10">
            {industry.proof_heading}
          </h2>
        )}

        <div className="relative">
          <Quote className="w-12 h-12 text-[#0396A6]/20 absolute -top-4 -left-6 md:-left-8 -z-10 rotate-180" />
          
          <blockquote className="text-xl md:text-3xl text-slate-800 font-medium leading-relaxed mb-8">
            &ldquo;{industry.proof_body}&rdquo;
          </blockquote>
          
          <Quote className="w-12 h-12 text-[#0396A6]/20 absolute -bottom-8 -right-4 md:-right-8 -z-10" />
        </div>

        {industry.proof_source && (
          <div className="mt-8 pt-6 border-t border-slate-200/50 inline-block">
            <div className="font-bold text-slate-900 uppercase tracking-widest text-sm">
              {industry.proof_source}
            </div>
            {industry.proof_type && (
              <div className="text-slate-500 text-sm mt-1">
                {industry.proof_type}
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
