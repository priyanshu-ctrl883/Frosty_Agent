
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Snowflake, Sun, Globe, Mail, MessageCircle, AlertCircle, User, ArrowRight, NotebookPen, Users } from 'lucide-react';

interface Interaction {
  id: string;
  channel: 'Website' | 'WhatsApp' | 'Email';
  action: string;
  time: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface Lead {
  id: string;
  name: string;
  action: string;
  score: number;
  state: 'entering' | 'scoring' | 'segregating' | 'done';
  category?: 'hot' | 'warm' | 'cold';
  avatar: string;
}

const INITIAL_INTERACTIONS: Interaction[] = [
  { id: '1', channel: 'Website', action: 'Visited pricing page', time: '10:24 AM', icon: <img loading="lazy" decoding="async" src="/web.svg" alt="Website" className="w-4 h-4 object-contain" />, color: 'text-[#0396A6]', bgColor: 'bg-transparent' },
  { id: '2', channel: 'WhatsApp', action: 'Asked for bulk order discount', time: '10:26 AM', icon: <img loading="lazy" decoding="async" src="/whatsapp.png" alt="WhatsApp" className="w-4 h-4 object-contain" />, color: 'text-green-600', bgColor: 'bg-transparent' }
];

const INCOMING_LEADS = [
  { name: 'Sarah Jenkins', action: 'Viewed case study', score: 55, avatar: 'https://i.pravatar.cc/150?img=5', category: 'warm' as const },
  { name: 'James Carter', action: 'Requested proposal', score: 82, avatar: 'https://i.pravatar.cc/150?img=68', category: 'hot' as const, isTrigger: true },
  { name: 'Emily Davis', action: 'Pricing enquiry', score: 68, avatar: 'https://i.pravatar.cc/150?img=20', category: 'warm' as const },
  { name: 'David Wilson', action: 'Downloaded brochure', score: 45, avatar: 'https://i.pravatar.cc/150?img=33', category: 'cold' as const }
];

export default function CRMLeadIntelligenceSection() {
  const containerRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  // CRM State
  const [showProfile, setShowProfile] = useState(false);
  const [crmScore, setCrmScore] = useState(72);
  const [interactions, setInteractions] = useState<Interaction[]>(INITIAL_INTERACTIONS);
  const [showInsight, setShowInsight] = useState(false);

  // Live Leads State
  const [activeLeads, setActiveLeads] = useState<Lead[]>([
    { id: 'l1', name: 'Jessica Taylor', action: 'Pricing enquiry', score: 76, state: 'done', avatar: 'https://i.pravatar.cc/150?img=44' },
    { id: 'l2', name: 'Robert Brown', action: 'Request for quote', score: 76, state: 'done', avatar: 'https://i.pravatar.cc/150?img=60' },
    { id: 'l3', name: 'Amanda White', action: 'Downloaded brochure', score: 61, state: 'done', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: 'l4', name: 'Thomas Miller', action: 'Website visit', score: 42, state: 'done', avatar: 'https://i.pravatar.cc/150?img=8' }
  ]);

  const leadIndex = useRef(0);

  // Segregation Stats
  const [hotCount, setHotCount] = useState(12);
  const [warmCount, setWarmCount] = useState(28);
  const [coldCount, setColdCount] = useState(46);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting) setInView(true);
    }, { threshold: 0.2 });
    
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!showProfile) return;
    let isAlive = true;

    const runProfileAnim = async () => {
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      await wait(450);
      if (!isAlive) return;
      
      setInteractions(prev => [
        ...prev, 
        { id: '3', channel: 'Email', action: 'Requested proposal', time: '10:31 AM', icon: <img loading="lazy" decoding="async" src="/gmail.png" alt="Email" className="w-4 h-4 object-contain" />, color: 'text-[#0396A6]', bgColor: 'bg-transparent' }
      ]);
      
      await wait(350);
      if (!isAlive) return;
      setCrmScore(78);
      
      await wait(350);
      if (!isAlive) return;
      setShowInsight(true);
    };

    runProfileAnim();
    return () => { isAlive = false; };
  }, [showProfile]);

  useEffect(() => {
    if (!inView) return;
    let isAlive = true;

    const processLeads = async () => {
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      while (isAlive) {
        await wait(1400);
        if (!isAlive) break;

        const nextLeadData = INCOMING_LEADS[leadIndex.current % INCOMING_LEADS.length];
        if (!nextLeadData) continue;
        leadIndex.current++;

        const newId = `lead-${Date.now()}`;
        const newLead: Lead = {
          id: newId,
          name: nextLeadData.name,
          action: nextLeadData.action,
          score: nextLeadData.score,
          state: 'entering',
          category: nextLeadData.category,
          avatar: nextLeadData.avatar
        };

        setActiveLeads(prev => [newLead, ...prev.slice(0, 3)]);

        await wait(350);
        if (!isAlive) break;

        setActiveLeads(prev => prev.map(l => l.id === newId ? { ...l, state: 'scoring' } : l));

        await wait(550);
        if (!isAlive) break;

        setActiveLeads(prev => prev.map(l => l.id === newId ? { ...l, state: 'segregating' } : l));

        if (nextLeadData.category === 'hot') setHotCount(c => c + 1);
        else if (nextLeadData.category === 'warm') setWarmCount(c => c + 1);
        else setColdCount(c => c + 1);

        if (nextLeadData.name === 'James Carter') {
          setTimeout(() => {
            if (isAlive) setShowProfile(true);
          }, 150);
        }

        await wait(400);
        if (!isAlive) break;

        setActiveLeads(prev => prev.map(l => l.id === newId ? { ...l, state: 'done' } : l));
      }
    };

    processLeads();
    return () => { isAlive = false; };
  }, [inView]);

  return (
    <section ref={containerRef} className="relative w-full pt-16 pb-8 lg:pt-20 lg:pb-12 overflow-hidden z-10 flex flex-col items-center bg-transparent font-sans">
      {/* HEADER */}
      <div className="relative z-10 text-center mb-8 max-w-2xl px-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0396A6]/[0.08] border border-[#0396A6]/20 mb-6 backdrop-blur-sm shadow-xs">
          <Users className="w-3.5 h-3.5 text-[#0396A6]" />
          <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#0396A6]">CRM + LEAD INTELLIGENCE</span>
        </div>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#0F172A] leading-[1.15] tracking-tight m-0 mb-6">
          Know every customer. <span className="text-[#0396A6] font-bold" style={{ color: '#0396A6' }}>Focus on the right ones.</span>
        </h2>
        <p className="text-sm md:text-base text-slate-600 font-normal leading-relaxed max-w-xl mx-auto m-0 mb-6">
          Frosty keeps every interaction in one place and automatically prioritizes the leads that matter most.
        </p>
      </div>

      <div className="w-full flex flex-col items-center mt-2 sm:mt-4 sm:transform sm:scale-[0.85] sm:origin-top sm:-mb-[100px]">
        
        <div className="mb-4">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-white/90 border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
            Product preview · sample data
          </span>
        </div>

        {/* DYNAMIC COLUMN LAYOUT */}
        <motion.div 
          layout
          className={`relative z-10 w-full mx-auto px-3 sm:px-6 grid grid-cols-1 gap-6 lg:gap-8 items-start ${showProfile ? 'max-w-[1280px] lg:grid-cols-[1.1fr_1fr_1.1fr]' : 'max-w-[900px] lg:grid-cols-2'}`}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          
          {/* LEFT: CRM PROFILE */}
          <AnimatePresence mode="popLayout">
            {showProfile && (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9, x: -30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                className="bg-white/95 border border-slate-200 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] flex flex-col relative overflow-hidden"
              >
                {/* Profile Header */}
                <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6 relative z-10">
                  <div className="w-[52px] h-[52px] sm:w-[68px] sm:h-[68px] rounded-full bg-slate-100 border-[3px] border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                     <img loading="lazy" decoding="async" src="https://i.pravatar.cc/150?img=68" alt="James Carter" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 pt-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <h3 className="text-slate-900 font-bold text-base sm:text-[19px] truncate">James Carter</h3>
                      <div className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 flex items-center gap-1 shadow-sm shrink-0">
                        <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" strokeWidth={2.5} /> High Intent
                      </div>
                    </div>
                    <p className="text-slate-500 text-[10.5px] sm:text-[12px] font-medium truncate">Bengaluru, India &bull; Repeat visitor</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-slate-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-0.5">Lead Score</div>
                    <div className="flex flex-col items-end">
                       <motion.div key={crmScore} className="text-2xl sm:text-[32px] font-bold text-slate-900 leading-none tracking-tight" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.3 }}>
                         {crmScore}
                       </motion.div>
                       {crmScore > 72 ? (
                         <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-green-600 text-[10px] sm:text-[11px] font-bold mt-1 flex items-center">
                           <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 rotate-[-45deg] mr-0.5" /> +{crmScore - 72}
                         </motion.div>
                       ) : (
                         <div className="h-[16px] sm:h-[20px]" />
                       )}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 sm:gap-6 border-b border-slate-200 mb-4 sm:mb-6 relative z-10 overflow-x-auto">
                  <div className="text-slate-900 text-[11px] sm:text-[12px] font-bold pb-2.5 sm:pb-3 border-b-2 border-[#0396A6] shrink-0">Overview</div>
                  <div className="text-slate-500 hover:text-slate-700 text-[11px] sm:text-[12px] font-semibold pb-2.5 sm:pb-3 cursor-pointer transition-colors shrink-0">Conversations</div>
                  <div className="text-slate-500 hover:text-slate-700 text-[11px] sm:text-[12px] font-semibold pb-2.5 sm:pb-3 cursor-pointer transition-colors shrink-0">Notes</div>
                  <div className="text-slate-500 hover:text-slate-700 text-[11px] sm:text-[12px] font-semibold pb-2.5 sm:pb-3 cursor-pointer transition-colors shrink-0">Deals</div>
                </div>

                <div className="flex-1 relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="text-slate-900 text-[13px] font-bold">Recent Interactions</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] text-green-600 font-bold tracking-wide">Live</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6 relative">
                    <div className="absolute left-[13px] top-[10px] bottom-[10px] w-px bg-slate-200 z-0" />
                    
                    <AnimatePresence>
                      {interactions.map((interaction) => (
                        <motion.div 
                          key={interaction.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="relative z-10 flex items-center gap-4"
                        >
                          <div className="relative">
                             <div className={`absolute -left-1 top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-white border-2 border-slate-400 z-10`} />
                             <div className="w-6 h-6 ml-4 flex items-center justify-center shrink-0">
                               {interaction.icon}
                             </div>
                          </div>
                          
                          <div className="flex-1 flex justify-between items-center py-1">
                            <div>
                              <div className="text-slate-900 text-[12.5px] font-bold mb-0.5">{interaction.channel}</div>
                              <div className="text-slate-600 text-[11.5px]">{interaction.action}</div>
                            </div>
                            <div className="text-slate-400 text-[10px] font-medium">{interaction.time}</div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* AI Insight Box */}
                  <AnimatePresence>
                    {showInsight && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="bg-[#F0FDFA] border border-[#0396A6]/25 rounded-xl p-4 overflow-hidden relative"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0396A6]" />
                        <div className="flex items-center gap-2 mb-2 pl-2">
                          <AlertCircle className="w-4 h-4 text-[#0396A6]" />
                          <span className="text-slate-900 text-[12px] font-bold">AI Insight</span>
                        </div>
                        <p className="text-slate-600 text-[12px] leading-[1.6] pl-2">
                          High buying intent. Interested in 100+ units.<br/>
                          Best time to reach out: <strong className="text-slate-900 font-semibold">Today.</strong>
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mt-5 sm:mt-8 relative z-10">
                  <button className="w-full sm:flex-1 bg-[#0396A6] hover:bg-[#0A1A2F] text-white text-[12px] sm:text-[12.5px] font-semibold py-2.5 sm:py-3 px-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
                    <MessageCircle className="w-4 h-4 shrink-0" /> Start Conversation
                  </button>
                  <button className="w-full sm:flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 text-[12px] sm:text-[12.5px] font-semibold py-2.5 sm:py-3 px-3 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                    <NotebookPen className="w-4 h-4 text-slate-500 shrink-0" /> Add Note
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CENTER: LIVE LEADS STREAM */}
          <motion.div layout className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 flex flex-col relative overflow-hidden h-auto min-h-[440px] sm:min-h-[500px] lg:h-[600px] shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            
            <div className="flex items-center justify-between mb-4 sm:mb-6 z-10 relative">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h3 className="text-slate-900 font-bold text-sm sm:text-[15px]">Live Leads</h3>
              </div>
              <div className="bg-teal-50 border border-[#0396A6]/25 px-2.5 sm:px-3 py-1 rounded-full text-[#0396A6] text-[9px] sm:text-[10px] font-bold tracking-wide">
                12 this hour
              </div>
            </div>
            <p className="text-slate-500 text-[10.5px] sm:text-[11.5px] mb-4 sm:mb-5 z-10 relative">New leads coming in</p>

            <div className="flex-1 relative z-10 w-full">
               <AnimatePresence initial={false}>
                 {activeLeads.map((lead) => (
                   <motion.div
                      key={lead.id}
                      layout
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0, 
                        scale: lead.state === 'scoring' ? 1.02 : 1,
                        x: lead.state === 'segregating' ? 40 : 0
                      }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className={`mb-2.5 sm:mb-3 p-2.5 sm:p-3 rounded-[14px] sm:rounded-[16px] flex items-center gap-2.5 sm:gap-3 border transition-colors duration-300 relative overflow-visible ${
                        lead.state === 'scoring' || lead.state === 'segregating'
                          ? (lead.category === 'hot' ? 'bg-red-50/80 border-red-200'
                             : lead.category === 'warm' ? 'bg-amber-50/80 border-amber-200'
                             : 'bg-blue-50/80 border-blue-200')
                          : 'bg-slate-50/50 border-slate-100'
                      }`}
                   >
                      <div className="w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-full bg-slate-200 border border-slate-300 overflow-hidden shrink-0">
                        <img loading="lazy" decoding="async" src={lead.avatar} alt={lead.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-900 text-xs sm:text-[13px] font-bold truncate">{lead.name}</div>
                        <div className="text-slate-500 text-[10px] sm:text-[11px] truncate">{lead.action}</div>
                      </div>
                      <div className="text-right pl-1.5 sm:pl-2 pr-1.5 sm:pr-2 shrink-0">
                        <motion.div 
                          className={`text-base sm:text-[18px] font-bold ${
                            (lead.state === 'scoring' || lead.state === 'segregating') 
                               ? (lead.category === 'hot' ? 'text-red-600' : lead.category === 'warm' ? 'text-amber-600' : 'text-blue-600') 
                               : 'text-slate-400'
                          }`}
                          animate={lead.state === 'scoring' ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          {lead.score}
                        </motion.div>
                      </div>

                      {/* Animated arrow shooting across - Only visible on desktop when columns are side-by-side */}
                      {lead.state === 'scoring' && (
                        <motion.div 
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 80 }}
                          className="hidden lg:flex absolute right-[-80px] top-1/2 -translate-y-1/2 items-center z-50 pointer-events-none"
                        >
                          <div className={`h-[1px] w-full opacity-50 ${lead.category === 'hot' ? 'bg-gradient-to-r from-red-500' : lead.category === 'warm' ? 'bg-gradient-to-r from-amber-500' : 'bg-gradient-to-r from-blue-500'} to-transparent`} />
                          <ArrowRight className={`w-5 h-5 absolute right-0 -translate-y-1/2 top-1/2 ${lead.category === 'hot' ? 'text-red-500' : lead.category === 'warm' ? 'text-amber-500' : 'text-blue-500'}`} />
                        </motion.div>
                      )}
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>
            
            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 sm:h-40 bg-gradient-to-t from-white to-transparent pointer-events-none z-20" />
          </motion.div>

          {/* RIGHT: LEAD SEGREGATION */}
          <motion.div layout className="flex flex-col relative h-auto min-h-[440px] sm:min-h-[480px] lg:h-[600px]">
            
            <div className="flex items-center justify-between mb-4 sm:mb-8 px-1 sm:px-2">
              <h3 className="text-slate-900 font-bold text-sm sm:text-[15px]">Smart Lead Segregation</h3>
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#0396A6]/10 border border-[#0396A6]/25">
                <span className="w-3 h-3 text-[#0396A6]"><Flame className="w-full h-full" /></span>
                <span className="text-[8.5px] sm:text-[9px] text-[#0396A6] font-bold uppercase tracking-wider">Auto prioritizing</span>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
              
              {/* HOT LEADS */}
              <motion.div 
                className="relative p-3.5 sm:p-5 rounded-2xl sm:rounded-[20px] border flex flex-col group overflow-hidden bg-red-50/80 border-red-200 shadow-sm"
                animate={activeLeads.some(l => l.state === 'segregating' && l.category === 'hot') ? { scale: 1.02, borderColor: 'rgba(239,68,68,0.6)', boxShadow: '0 8px 30px rgba(239,68,68,0.15)' } : { scale: 1, borderColor: '#FECACA' }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3 relative z-10">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-[36px] h-[36px] sm:w-[42px] sm:h-[42px] rounded-full bg-white border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
                      <Flame className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-slate-900 font-bold text-sm sm:text-[15px]">Hot Leads</div>
                      <div className="text-slate-500 text-[10.5px] sm:text-[11.5px] font-medium">Ready to engage</div>
                    </div>
                  </div>
                  <motion.div 
                    className="text-2xl sm:text-[32px] font-bold text-slate-900 leading-none"
                    key={hotCount}
                    initial={{ scale: 1.3, color: '#DC2626' }}
                    animate={{ scale: 1, color: '#0F172A' }}
                  >
                    {hotCount}
                  </motion.div>
                </div>
                <div className="flex items-center gap-3 pl-[48px] sm:pl-[58px]">
                   <div className="flex -space-x-2">
                     <img loading="lazy" decoding="async" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?img=1" alt="avatar" />
                     <img loading="lazy" decoding="async" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?img=2" alt="avatar" />
                     <img loading="lazy" decoding="async" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?img=3" alt="avatar" />
                   </div>
                   <div className="text-[#0396A6] text-[9.5px] sm:text-[10px] font-bold">+8</div>
                </div>
              </motion.div>

              {/* WARM LEADS */}
              <motion.div 
                className="relative p-3.5 sm:p-5 rounded-2xl sm:rounded-[20px] border border-amber-200 bg-amber-50/80 shadow-sm flex flex-col group overflow-hidden"
                animate={activeLeads.some(l => l.state === 'segregating' && l.category === 'warm') ? { scale: 1.02, borderColor: 'rgba(245,158,11,0.6)', boxShadow: '0 8px 30px rgba(245,158,11,0.15)' } : { scale: 1, borderColor: '#FDE68A' }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3 relative z-10">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-[36px] h-[36px] sm:w-[42px] sm:h-[42px] rounded-full bg-white border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
                      <Sun className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-slate-900 font-bold text-sm sm:text-[15px]">Warm Leads</div>
                      <div className="text-slate-500 text-[10.5px] sm:text-[11.5px] font-medium">Showing interest</div>
                    </div>
                  </div>
                  <motion.div 
                    className="text-2xl sm:text-[32px] font-bold text-slate-900 leading-none"
                    key={warmCount}
                    initial={{ scale: 1.3, color: '#D97706' }}
                    animate={{ scale: 1, color: '#0F172A' }}
                  >
                    {warmCount}
                  </motion.div>
                </div>
                <div className="flex items-center gap-3 pl-[48px] sm:pl-[58px]">
                   <div className="flex -space-x-2">
                     <img loading="lazy" decoding="async" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?img=4" alt="avatar" />
                     <img loading="lazy" decoding="async" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?img=5" alt="avatar" />
                     <img loading="lazy" decoding="async" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?img=6" alt="avatar" />
                   </div>
                   <div className="text-[#0396A6] text-[9.5px] sm:text-[10px] font-bold">+24</div>
                </div>
              </motion.div>

              {/* COLD LEADS */}
              <motion.div 
                className="relative p-3.5 sm:p-5 rounded-2xl sm:rounded-[20px] border border-blue-200 bg-blue-50/80 shadow-sm flex flex-col group overflow-hidden"
                animate={activeLeads.some(l => l.state === 'segregating' && l.category === 'cold') ? { scale: 1.02, borderColor: 'rgba(59,130,246,0.6)', boxShadow: '0 8px 30px rgba(59,130,246,0.15)' } : { scale: 1, borderColor: '#BFDBFE' }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3 relative z-10">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-[36px] h-[36px] sm:w-[42px] sm:h-[42px] rounded-full bg-white border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
                      <Snowflake className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-slate-900 font-bold text-sm sm:text-[15px]">Cold Leads</div>
                      <div className="text-slate-500 text-[10.5px] sm:text-[11.5px] font-medium">Low intent</div>
                    </div>
                  </div>
                  <motion.div 
                    className="text-2xl sm:text-[32px] font-bold text-slate-900 leading-none"
                    key={coldCount}
                    initial={{ scale: 1.3, color: '#FF7A5E' }}
                    animate={{ scale: 1, color: '#0F172A' }}
                  >
                    {coldCount}
                  </motion.div>
                </div>
                <div className="flex items-center gap-3 pl-[48px] sm:pl-[58px]">
                   <div className="flex -space-x-2">
                     <img loading="lazy" decoding="async" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?img=7" alt="avatar" />
                     <img loading="lazy" decoding="async" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?img=8" alt="avatar" />
                     <img loading="lazy" decoding="async" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?img=9" alt="avatar" />
                   </div>
                   <div className="text-[#0396A6] text-[9.5px] sm:text-[10px] font-bold">+42</div>
                </div>
              </motion.div>

            </div>
          </motion.div>

        </motion.div>

      </div>

    </section>
  );
}
