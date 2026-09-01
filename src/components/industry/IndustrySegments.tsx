import React from 'react';
import { Industry } from '@/lib/industries';
import { Users, CheckCircle, Zap, Shield, Target, Lightbulb, Clock } from 'lucide-react';

interface Props {
  industry: Industry;
}

export function IndustrySegments({ industry }: Props) {
  if (!industry.builtfor_heading) return null;

  return (
    <>
      {/* SECTION 1: Who uses Frosty */}
      {industry.segments && industry.segments.length > 0 && (
        <section className="py-20 md:py-28 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0396A6]/10 text-[#0396A6] font-semibold text-sm mb-4">
                <Users className="w-4 h-4" />
                <span>{industry.builtfor_heading}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Who uses Frosty
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {industry.segments.map((segment, idx) => (
                <div key={idx} className="relative bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:bg-white hover:border-[#0396A6]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                  
                  {/* Faint oversized background number */}
                  <div className="absolute -right-4 -bottom-6 text-[140px] font-black text-slate-200/40 group-hover:text-[#0396A6]/5 transition-colors select-none z-0 pointer-events-none leading-none">
                    {idx + 1}
                  </div>

                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:bg-[#0396A6] group-hover:border-[#0396A6] transition-colors">
                      <span className="text-lg font-extrabold text-[#0396A6] group-hover:text-white tracking-tight">
                        0{idx + 1}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{segment.name}</h3>
                    <p className="text-slate-600 leading-relaxed">{segment.description}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* SECTION 2: Why they choose us */}
      {industry.why_points && industry.why_points.length > 0 && (
        <section className="py-20 md:py-28 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            
            <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0396A6]/10 text-[#0396A6] font-semibold text-sm mb-4">
                <CheckCircle className="w-4 h-4" />
                <span>The Advantage</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Why they choose us
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-x-12 gap-y-12 max-w-5xl mx-auto">
              {industry.why_points.map((point, idx) => {
                const icons: any[] = [CheckCircle, Zap, Shield, Target, Lightbulb, Clock];
                const Icon = icons[idx % icons.length] as any;
                
                return (
                  <div key={idx} className="flex items-start gap-5 border-b border-slate-200 pb-10">
                    <div className="w-14 h-14 rounded-2xl bg-[#0396A6]/10 flex items-center justify-center shrink-0">
                      <Icon className="w-7 h-7 text-[#0396A6]" />
                    </div>
                    
                    <div className="pt-1">
                      <h3 className="text-xl font-bold text-[#0396A6] mb-2">{point.title}</h3>
                      <p className="text-slate-600 leading-relaxed text-base">{point.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>
      )}
    </>
  );
}
