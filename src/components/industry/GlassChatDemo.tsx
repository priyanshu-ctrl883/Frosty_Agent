'use client';

import React, { useState, useEffect } from 'react';
import { Industry } from '@/lib/industries';
import { Bot, Check, MessageSquare, MoreHorizontal, Mic } from 'lucide-react';
import { Conversation } from '@/lib/industries';

interface Props {
  heading?: string | null;
  intro?: string | null;
  conversations?: Conversation[] | null;
}

export function GlassChatDemo({ heading, intro, conversations: initialConversations }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [chatStep, setChatStep] = useState(0);

  const conversations = initialConversations || [];
  
  useEffect(() => {
    if (conversations.length === 0) return;
    let timeoutId: NodeJS.Timeout;

    if (chatStep === 0) {
      timeoutId = setTimeout(() => setChatStep(1), 500);
    } else if (chatStep === 1) {
      timeoutId = setTimeout(() => setChatStep(2), 1200);
    } else if (chatStep === 2) {
      timeoutId = setTimeout(() => setChatStep(3), 600);
    } else if (chatStep === 3) {
      timeoutId = setTimeout(() => setChatStep(4), 1500);
    } else if (chatStep === 4) {
      timeoutId = setTimeout(() => setChatStep(5), 800);
    } else if (chatStep === 5) {
      timeoutId = setTimeout(() => {
        setChatStep(0);
        setActiveIdx((prev) => (prev + 1) % conversations.length);
      }, 4000);
    }

    return () => clearTimeout(timeoutId);
  }, [chatStep, conversations.length]);

  if (!heading || conversations.length === 0) return null;
  const activeConv = conversations[activeIdx];
  if (!activeConv) return null;

  return (
    <section className="py-24 bg-white relative overflow-hidden px-4">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0396A6]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            {heading}
          </h2>
          {intro && (
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto">
              {intro}
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 lg:gap-16 items-center relative z-10 max-w-5xl mx-auto">
          
          {/* Left: Conversation Selector */}
          <div className="flex flex-col gap-3">
            {conversations.map((conv, idx) => {
              const isActive = idx === activeIdx;
              const isVoice = conv.type === 'voice_note';
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveIdx(idx);
                    setChatStep(0);
                  }}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 text-left border ${
                    isActive 
                      ? 'bg-white shadow-lg shadow-[#0396A6]/10 border-slate-200 scale-105 z-10 relative' 
                      : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-[#0396A6]/10 text-[#0396A6]' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isVoice ? <Mic className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    </div>
                    <span className={`font-semibold text-sm truncate ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                      {conv.customer_message}
                    </span>
                  </div>
                  
                  {isActive && (
                    <div className="flex items-center gap-2 pl-2">
                      <span className="flex gap-0.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0396A6] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0396A6] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0396A6] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Interactive Chat UI Mockup */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col h-[500px]">
              
              <div className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center gap-3 relative z-20">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#027D8A] to-[#0396A6] flex items-center justify-center shadow-sm shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Frosty Assistant</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {chatStep >= 3 && chatStep < 4 ? 'Typing...' : 'Online'}
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30 flex flex-col gap-6 relative">
                <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Today at 10:42 AM
                </div>

                <div key={activeIdx} className="flex flex-col gap-6">
                  
                  {/* User Message */}
                  {chatStep >= 1 && (
                    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 border border-slate-300">
                        <span className="text-slate-600 text-[10px] font-bold">USR</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-slate-700 text-[14px] leading-relaxed shadow-sm">
                        {chatStep === 1 ? (
                          <MoreHorizontal className="w-5 h-5 text-slate-400 animate-pulse" />
                        ) : activeConv.type === 'voice_note' ? (
                          <div className="flex items-center gap-2 text-[#0396A6]">
                            <Mic className="w-4 h-4" /> <span>Voice Note (0:12)</span>
                          </div>
                        ) : (
                          activeConv.customer_message
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bot Message / Action */}
                  {chatStep >= 3 && (
                    <div className="flex gap-3 flex-row-reverse relative animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#027D8A] to-[#0396A6] flex items-center justify-center shrink-0 shadow-sm relative z-10">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col items-end gap-2 max-w-[85%]">
                        {/* We use agent_action as the bot's processing block to show what Frosty actually does */}
                        <div className="bg-[#0396A6] text-white rounded-2xl rounded-tr-none px-4 py-3 text-[14px] leading-relaxed shadow-md">
                          {chatStep === 3 ? (
                            <MoreHorizontal className="w-5 h-5 text-white/50 animate-pulse" />
                          ) : (
                            <span className="italic">{activeConv.agent_action}</span>
                          )}
                        </div>
                        
                        {chatStep >= 5 && (
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full shadow-sm mt-1 animate-in zoom-in fade-in duration-300">
                            <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                              Task Completed
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              <div className="p-4 bg-white border-t border-slate-100 z-20">
                <div className="h-10 bg-slate-100 rounded-full w-full border border-slate-200 flex items-center px-4">
                  <span className="text-slate-400 text-sm">Type a message...</span>
                </div>
              </div>

            </div>
            
            <div className="absolute inset-0 bg-[#0396A6]/20 blur-3xl -z-10 rounded-full opacity-50" />
          </div>
        </div>
      </div>
    </section>
  );
}
