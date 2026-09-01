'use client';

import React, { useState, useEffect } from 'react';
import type { Industry } from '@/lib/industries';
import { CheckCircle, Globe, Inbox, ArrowRightLeft, Sparkles, ChevronRight } from 'lucide-react';

interface Props {
  industry: Industry;
}

export function IndustryCapabilities({ industry }: Props) {
  if (!industry.capabilities_heading) return null;

  interface Tab {
    id: string;
    title: string;
    icon: any;
    points?: string[];
    desc?: string;
    languages?: string[];
  }
  const tabs: Tab[] = [];
  if (industry.capabilities_presale && industry.capabilities_presale.length > 0) {
    tabs.push({ id: 'presale', title: 'Before the sale', icon: ArrowRightLeft, points: industry.capabilities_presale });
  }
  if (industry.capabilities_aftersale && industry.capabilities_aftersale.length > 0) {
    tabs.push({ id: 'aftersale', title: 'After the sale', icon: Sparkles, points: industry.capabilities_aftersale });
  }
  if (industry.capabilities_leadmgmt && industry.capabilities_leadmgmt.length > 0) {
    tabs.push({ id: 'leadmgmt', title: 'Lead management', icon: Inbox, points: industry.capabilities_leadmgmt });
  }
  if (industry.capabilities_language) {
    tabs.push({ id: 'languages', title: 'Languages & Voice', icon: Globe, desc: industry.capabilities_language, languages: industry.languages });
  }

  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);
  const [isHovered, setIsHovered] = useState(false);
  
  const activeTab = tabs.find(t => t.id === activeTabId);

  // Auto-rotate tabs
  useEffect(() => {
    if (!tabs.length || isHovered) return;
    
    const interval = setInterval(() => {
      setActiveTabId((currentId) => {
        const currentIndex = tabs.findIndex(t => t.id === currentId);
        const nextIndex = (currentIndex + 1) % tabs.length;
        return tabs[nextIndex]?.id || currentId;
      });
    }, 6000); // 6 seconds
    
    return () => clearInterval(interval);
  }, [tabs.length, isHovered]);

  return (
    <section className="py-20 md:py-32 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            {industry.capabilities_heading}
          </h2>
          {industry.capabilities_intro && (
            <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed">
              {industry.capabilities_intro}
            </p>
          )}
        </div>

        <div 
          className="flex flex-col lg:flex-row gap-8 lg:gap-12 max-w-6xl mx-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          
          {/* Left: Tab Navigation */}
          <div className="lg:w-1/3 flex flex-col gap-3">
             {tabs.map((tab) => {
               const isActive = activeTabId === tab.id;
               const Icon = tab.icon;
               return (
                 <button 
                   key={tab.id}
                   onClick={() => setActiveTabId(tab.id)} 
                   className={`flex items-center justify-between p-5 rounded-2xl border text-left transition-all duration-300 ${isActive ? 'bg-white border-[#0396A6] shadow-lg shadow-[#0396A6]/5 ring-1 ring-[#0396A6]/20 scale-[1.02]' : 'bg-transparent border-transparent hover:bg-slate-200/50 hover:border-slate-300'}`}
                 >
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-[#0396A6] text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>
                          <Icon className="w-6 h-6" />
                       </div>
                       <span className={`font-bold text-lg ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                         {tab.title}
                       </span>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-all ${isActive ? 'text-[#0396A6] translate-x-1' : 'text-transparent -translate-x-2'}`} />
                 </button>
               );
             })}
          </div>

          {/* Right: Content Panel */}
          <div className="lg:w-2/3">
             <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-slate-200/40 border border-slate-100 min-h-[450px] relative overflow-hidden flex flex-col">
                
                {/* Decorative background blur */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#0396A6]/10 rounded-full blur-3xl" />

                {activeTab && (
                  <div key={activeTab.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-[#0396A6]/10 flex items-center justify-center">
                        <activeTab.icon className="w-7 h-7 text-[#0396A6]" />
                      </div>
                      <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeTab.title}</h3>
                    </div>

                    {activeTab.id !== 'languages' ? (
                      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-10 mt-4">
                        {activeTab.points?.map((point, idx) => (
                          <div key={idx} className="flex gap-4">
                            <CheckCircle className="w-6 h-6 text-[#0396A6] shrink-0" />
                            <span className="text-slate-700 leading-relaxed font-medium">{point}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col h-full flex-1">
                        <p className="text-xl text-slate-600 leading-relaxed mb-12">
                          {activeTab.desc}
                        </p>
                        
                        {activeTab.languages && activeTab.languages.length > 0 && (
                          <div className="mt-auto">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Supported Languages</h4>
                            <div className="flex flex-wrap gap-2.5">
                              {activeTab.languages.map((lang, idx) => (
                                <span key={idx} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm hover:border-[#0396A6]/30 hover:bg-white transition-colors cursor-default">
                                  {lang}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
