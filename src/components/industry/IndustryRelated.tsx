import React from 'react';
import Link from 'next/link';
import { Industry } from '@/lib/industries';
import { ArrowRight, BookOpen, Layers } from 'lucide-react';

interface Props {
  industry: Industry;
}

export function IndustryRelated({ industry }: Props) {
  const hasSolutions = industry.related_solutions && industry.related_solutions.length > 0;
  const hasReading = industry.related_reading && industry.related_reading.length > 0;

  if (!hasSolutions && !hasReading) return null;

  return (
    <section className="py-20 bg-[#FAFAFA] border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-12">
          Related
        </h2>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Related Solutions */}
          {hasSolutions && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#0396A6]/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-[#0396A6]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Related Solutions</h3>
              </div>
              <div className="space-y-4">
                {industry.related_solutions!.map((sol, idx) => (
                  <Link 
                    key={idx} 
                    href={sol.url}
                    className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-[#0396A6]/50 hover:shadow-sm transition-all"
                  >
                    <span className="font-medium text-slate-700 group-hover:text-[#0396A6] transition-colors">
                      {sol.anchor_text}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0396A6] group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Reading */}
          {hasReading && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Related Reading</h3>
              </div>
              <div className="space-y-4">
                {industry.related_reading!.map((read, idx) => (
                  <Link 
                    key={idx} 
                    href={read.url}
                    className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-500/50 hover:shadow-sm transition-all"
                  >
                    <span className="font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                      {read.title}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
