import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Industry } from '@/lib/industries';

interface Props {
  industry: Industry;
}

export function IndustryProblem({ industry }: Props) {
  if (!industry.problem_heading) return null;

  return (
    <section className="py-20 md:py-28 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        <div className="flex flex-col items-center max-w-5xl mx-auto">
          
          {/* Centered Heading */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
              {industry.problem_heading}
            </h2>
          </div>

          {/* Points in 2 columns */}
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
              {industry.problem_points?.map((point, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="shrink-0 mt-1">
                    <AlertCircle className="w-8 h-8 md:w-10 md:h-10 text-rose-500" strokeWidth={2} />
                  </div>
                  <p className="text-base md:text-lg text-slate-900 font-medium leading-relaxed">
                    {point}
                  </p>
                </div>
              ))}
            </div>

            {/* Stat Block */}
            {industry.problem_stat && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:py-6 md:px-8 relative overflow-hidden group max-w-4xl mx-auto">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0396A6]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
                
                <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
                  
                  {/* Left Column */}
                  <div className="flex-1 md:pr-8 text-center md:text-left">
                    {!industry.problem_stat.secondary ? (
                      <p className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight">
                        Did you know?
                      </p>
                    ) : (
                      <>
                        <div className="text-[#0396A6] font-bold text-4xl tracking-tight mb-2">
                          {industry.problem_stat.value.split(',')[0]}
                        </div>
                        <div className="text-slate-700 font-medium leading-snug mb-3">
                          {industry.problem_stat.value.substring(industry.problem_stat.value.indexOf(',') + 1).trim() || industry.problem_stat.value}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                          Source: {industry.problem_stat.source}, {industry.problem_stat.year}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Right Column */}
                  <div className="flex-1 md:border-l border-slate-200 md:pl-8 text-center md:text-left">
                    {!industry.problem_stat.secondary ? (
                      <>
                        <div className="text-[#0396A6] font-bold text-4xl tracking-tight mb-2">
                          {industry.problem_stat.value.split(',')[0]}
                        </div>
                        <div className="text-slate-700 font-medium leading-snug mb-3 text-base md:text-lg">
                          {industry.problem_stat.value.substring(industry.problem_stat.value.indexOf(',') + 1).trim() || industry.problem_stat.value}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mt-3">
                          Source: {industry.problem_stat.source}, {industry.problem_stat.year}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[#0396A6] font-bold text-2xl tracking-tight mb-2">
                          {industry.problem_stat.secondary.value.split(' ')[0]}
                        </div>
                        <div className="text-slate-700 font-medium leading-snug mb-3 text-sm">
                          {industry.problem_stat.secondary.value.substring(industry.problem_stat.secondary.value.indexOf(' ') + 1).trim()}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                          Source: {industry.problem_stat.secondary.source}, {industry.problem_stat.secondary.year}
                        </div>
                      </>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
