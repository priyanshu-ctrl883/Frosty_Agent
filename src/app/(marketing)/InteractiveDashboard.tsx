'use client';

import { useState, useEffect, type JSX } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import FrostyIcon from '@/components/FrostyIcon';

// --- CountUp Component for animated digits ---
function CountUp({ to, duration = 1.5, decimals = 0 }: { to: number; duration?: number; decimals?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      // Easing out quint
      const easeProgress = 1 - Math.pow(1 - progress, 5);
      setCount(easeProgress * to);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(to);
      }
    };
    window.requestAnimationFrame(step);
  }, [to, duration]);

  return <span>{count.toFixed(decimals)}</span>;
}

const chatScript = [
  { role: 'user', text: "Hi! I'm looking for pricing details.", label: 'Website Visitor', time: '10:30 AM' },
  { role: 'bot', text: "Sure! I'd be happy to help you with our pricing. Can I know how many users are you looking for?", label: 'Frosty', time: '10:30 AM' },
  { role: 'user', text: "We're a team of 15.", label: 'Website Visitor', time: '10:31 AM' },
  { role: 'bot', text: <><span className="block mb-1 text-slate-900">Great! I've scheduled a demo for you.</span><span className="inline-flex items-center gap-1.5 text-slate-700 font-medium bg-slate-100 border border-slate-200 px-2 py-1 rounded-md mb-1 shadow-sm"><svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Tomorrow, 11:00 AM</span><span className="block text-slate-600">Our team will connect with you then.</span></>, label: 'Frosty', time: '10:31 AM' },
];

function SidebarIcon({ type, active }: { type: string; active?: boolean }) {
  const cls = `w-[18px] h-[18px] ${active ? 'text-white' : 'text-slate-500'}`;
  const icons: Record<string, JSX.Element> = {
    home: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    chat: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    calendar: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
    chart: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>,
    users: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  };
  return icons[type] || null;
}

function DashboardPanel() {
  return (
    <div className="flex-1 flex flex-col min-h-[420px] sm:min-h-[480px] max-h-[540px] bg-white overflow-hidden">
      <div className="px-3 sm:px-6 pt-4 sm:pt-5 pb-2 sm:pb-3 shrink-0 flex items-start justify-between">
        <div>
          <div className="text-[17px] sm:text-[22px] font-sans font-bold !text-slate-900 leading-tight" style={{ fontFamily: "var(--sans, 'Outfit', sans-serif)" }}>Dashboard Overview</div>
          <p className="text-[10px] sm:text-[11px] font-medium !text-slate-500">Welcome back to your workspace</p>
        </div>
        <span className="text-[8.5px] sm:text-[9.5px] font-semibold text-slate-500 bg-teal-50/80 border border-teal-200/60 px-1.5 sm:px-2 py-0.5 rounded-full mt-0.5">
          Product preview
        </span>
      </div>
      
      <div className="flex-1 px-3 sm:px-6 pb-4 sm:pb-5 overflow-y-auto flex flex-col gap-3 sm:gap-4 min-w-0">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-[14px] p-3 border border-[#CCFBF1] shadow-[0_2px_10px_rgba(3, 150, 166,0.03)] flex flex-col justify-between h-[86px]">
            <div className="w-6 h-6 rounded-md bg-[#CCFBF1] text-[#14B8A6] flex items-center justify-center shrink-0 mb-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <div>
              <p className="text-[20px] font-bold !text-slate-900 leading-none mb-1"><CountUp to={284} /></p>
              <p className="text-[7px] font-bold !text-slate-500 uppercase tracking-wider">Conversations</p>
            </div>
          </div>
          
          <div className="bg-white rounded-[14px] p-3 border border-[#CCFBF1] shadow-[0_2px_10px_rgba(3, 150, 166,0.03)] flex flex-col justify-between h-[86px]">
            <div className="w-6 h-6 rounded-md bg-[#FEF3C7] text-[#F59E0B] flex items-center justify-center shrink-0 mb-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <div>
              <p className="text-[20px] font-bold !text-slate-900 leading-none mb-1"><CountUp to={1420} /></p>
              <p className="text-[7px] font-bold !text-slate-500 uppercase tracking-wider">Messages</p>
            </div>
          </div>
          
          <div className="bg-white rounded-[14px] p-3 border border-[#CCFBF1] shadow-[0_2px_10px_rgba(3, 150, 166,0.03)] flex flex-col justify-between h-[86px]">
            <div className="w-6 h-6 rounded-md bg-[#CCFBF1] text-[#14B8A6] flex items-center justify-center shrink-0 mb-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <div>
              <p className="text-[20px] font-bold !text-slate-900 leading-none mb-1"><CountUp to={48} /></p>
              <p className="text-[7px] font-bold !text-slate-500 uppercase tracking-wider">Leads Captured</p>
            </div>
          </div>
          
          <div className="bg-white rounded-[14px] p-3 border border-[#CCFBF1] shadow-[0_2px_10px_rgba(3, 150, 166,0.03)] flex flex-col justify-between h-[86px]">
            <div className="flex justify-between items-start">
               <div className="w-6 h-6 rounded-md bg-[#FFEDD5] text-[#F97316] flex items-center justify-center shrink-0">
                 <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
               </div>
               <span className="text-[7px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-emerald-200">
                 <span className="w-1 h-1 rounded-full bg-emerald-600"></span> 98.4% Valid
               </span>
            </div>
            <div>
              <p className="text-[20px] font-bold !text-slate-900 leading-none mb-1"><CountUp to={1850} /></p>
              <p className="text-[7px] font-bold !text-slate-500 uppercase tracking-wider">Credits Left</p>
            </div>
          </div>
        </div>

        {/* Charts Mock */}
        <div className="mt-2 flex-1 flex flex-col">
           <div className="text-[14px] font-sans font-bold !text-slate-900 mb-2.5 flex items-center gap-1.5" style={{ fontFamily: "var(--sans, 'Outfit', sans-serif)" }}>
             <svg className="w-4 h-4 text-[#14B8A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
             Custom Analytics Charts
           </div>
           <div className="bg-white rounded-[14px] p-4 border border-[#CCFBF1] shadow-[0_2px_10px_rgba(3, 150, 166,0.03)] flex-1 flex flex-col min-h-[140px]">
              <div className="text-[11px] font-sans font-bold !text-slate-900 mb-3" style={{ fontFamily: "var(--sans, 'Outfit', sans-serif)" }}>Conversation Volume</div>
              <div className="flex-1 relative border-l border-b border-[#CCFBF1] flex items-end overflow-hidden pb-1">
                {/* Y Axis labels */}
                <div className="absolute left-[-16px] top-0 bottom-0 flex flex-col justify-between text-[8px] font-medium !text-slate-400 py-1">
                  <span>8</span>
                  <span>6</span>
                  <span>4</span>
                </div>
                {/* Complex Curve SVG Graph */}
                <svg viewBox="0 0 320 110" className="absolute inset-0 w-[calc(100%-8px)] h-full overflow-visible ml-2" preserveAspectRatio="none">
                  <motion.path 
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    d="M 0,100 C 30,100 50,70 90,80 C 130,90 150,30 200,40 C 250,50 270,10 320,10" 
                    fill="none" 
                    stroke="#14B8A6" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                  />
                  {/* Subtle area fill underneath the curve */}
                  <motion.path 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    d="M 0,100 C 30,100 50,70 90,80 C 130,90 150,30 200,40 C 250,50 270,10 320,10 L 320,110 L 0,110 Z" 
                    fill="url(#gradientDashboard)" 
                  />
                  <defs>
                    <linearGradient id="gradientDashboard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

const ANALYTICS_DATA = {
  '7d': {
    kpi: { conv: 8, msg: 0, leads: 1, convRate: 13 },
    yAxis: [52, 39, 26, 13, 0],
    path: "M 0,100 L 50,100 L 100,100 L 150,100 L 200,100 L 250,100 L 300,90 L 350,10",
    fill: "M 0,100 L 50,100 L 100,100 L 150,100 L 200,100 L 250,100 L 300,90 L 350,10 L 350,100 Z",
    dots: [
      { cx: 0, cy: 100 }, { cx: 50, cy: 100 }, { cx: 100, cy: 100 }, { cx: 150, cy: 100 },
      { cx: 200, cy: 100 }, { cx: 250, cy: 100 }, { cx: 300, cy: 90 }, { cx: 350, cy: 10 }
    ],
    xLabels: ['08/04', '08/06', '08/08', '08/10', '08/11']
  },
  '14d': {
    kpi: { conv: 24, msg: 12, leads: 3, convRate: 12 },
    yAxis: [100, 75, 50, 25, 0],
    path: "M 0,100 L 50,80 L 100,85 L 150,60 L 200,40 L 250,50 L 300,20 L 350,5",
    fill: "M 0,100 L 50,80 L 100,85 L 150,60 L 200,40 L 250,50 L 300,20 L 350,5 L 350,100 Z",
    dots: [
      { cx: 0, cy: 100 }, { cx: 50, cy: 80 }, { cx: 100, cy: 85 }, { cx: 150, cy: 60 },
      { cx: 200, cy: 40 }, { cx: 250, cy: 50 }, { cx: 300, cy: 20 }, { cx: 350, cy: 5 }
    ],
    xLabels: ['07/28', '08/01', '08/04', '08/08', '08/11']
  },
  '30d': {
    kpi: { conv: 142, msg: 89, leads: 22, convRate: 15 },
    yAxis: [500, 375, 250, 125, 0],
    path: "M 0,90 L 50,70 L 100,40 L 150,45 L 200,20 L 250,25 L 300,10 L 350,0",
    fill: "M 0,90 L 50,70 L 100,40 L 150,45 L 200,20 L 250,25 L 300,10 L 350,0 L 350,100 Z",
    dots: [
      { cx: 0, cy: 90 }, { cx: 50, cy: 70 }, { cx: 100, cy: 40 }, { cx: 150, cy: 45 },
      { cx: 200, cy: 20 }, { cx: 250, cy: 25 }, { cx: 300, cy: 10 }, { cx: 350, cy: 0 }
    ],
    xLabels: ['07/11', '07/18', '07/25', '08/01', '08/11']
  },
  '90d': {
    kpi: { conv: 520, msg: 410, leads: 95, convRate: 18 },
    yAxis: [2000, 1500, 1000, 500, 0],
    path: "M 0,80 L 50,75 L 100,60 L 150,55 L 200,40 L 250,30 L 300,15 L 350,5",
    fill: "M 0,80 L 50,75 L 100,60 L 150,55 L 200,40 L 250,30 L 300,15 L 350,5 L 350,100 Z",
    dots: [
      { cx: 0, cy: 80 }, { cx: 50, cy: 75 }, { cx: 100, cy: 60 }, { cx: 150, cy: 55 },
      { cx: 200, cy: 40 }, { cx: 250, cy: 30 }, { cx: 300, cy: 15 }, { cx: 350, cy: 5 }
    ],
    xLabels: ['May', 'Jun', 'Jul', 'Aug', 'Sep']
  }
} as const;

type TimeFilter = keyof typeof ANALYTICS_DATA;

function AnalyticsPanelV2() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');
  const data = ANALYTICS_DATA[timeFilter];

  return (
    <div className="flex-1 flex flex-col min-h-[440px] sm:min-h-[480px] max-h-[540px] bg-white overflow-hidden">
      <div className="px-4 sm:px-6 pt-5 pb-3 shrink-0">
        <div className="text-[22px] font-sans font-bold !text-slate-900 leading-tight" style={{ fontFamily: "var(--sans, 'Outfit', sans-serif)" }}>Analytics</div>
        <p className="text-[11px] font-medium !text-slate-500">Real-time insights and metrics</p>
      </div>

      <div className="flex-1 px-4 sm:px-6 pb-5 overflow-y-auto flex flex-col gap-4 min-w-0">
        {/* Top Hero Metrics Card (Now exactly 4 metrics) */}
        <div className="bg-white rounded-[14px] border border-[#CCFBF1] shadow-[0_2px_10px_rgba(3, 150, 166,0.03)] p-4 flex flex-col gap-4">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 pb-3 border-b border-[#CCFBF1]">
             <div className="flex items-center gap-2">
               <div className="w-7 h-7 rounded bg-[#CCFBF1] text-[#14B8A6] flex items-center justify-center shadow-sm">
                 <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
               </div>
               <div>
                 <p className="text-[12px] font-bold !text-slate-900 leading-tight">Analytics</p>
                 <p className="text-[9px] font-medium !text-slate-500">Real-time insights and metrics</p>
               </div>
             </div>
             <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
               {(['7d', '14d', '30d', '90d'] as TimeFilter[]).map(d => (
                 <span 
                   key={d} 
                   onClick={() => setTimeFilter(d)}
                   className={`text-[9px] font-bold px-2.5 py-1 rounded-md cursor-pointer transition-colors ${d === timeFilter ? 'bg-[#14B8A6] text-white shadow-sm' : '!text-slate-500 hover:bg-slate-50'}`}
                 >
                   {d}
                 </span>
               ))}
               <span className="!text-slate-500 px-1.5 py-1 flex items-center justify-center cursor-pointer hover:bg-slate-50 rounded-md">
                 <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
               </span>
             </div>
           </div>
           
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-2">
             <div className="flex flex-col items-start justify-center">
               <div className="flex items-center gap-1.5 mb-1">
                 <div className="w-5 h-5 rounded bg-[#CCFBF1] text-[#14B8A6] flex items-center justify-center"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></div>
                 <p className="text-[7px] font-bold !text-slate-500 uppercase tracking-wider">Conversations</p>
               </div>
               <p className="text-[18px] font-extrabold !text-slate-900 leading-none mb-0.5 mt-0.5"><CountUp to={data.kpi.conv} key={data.kpi.conv} /></p>
               <p className="text-[8px] font-medium !text-slate-500">sessions</p>
             </div>
             <div className="flex flex-col items-start justify-center">
               <div className="flex items-center gap-1.5 mb-1">
                 <div className="w-5 h-5 rounded bg-[#CCFBF1] text-[#14B8A6] flex items-center justify-center"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg></div>
                 <p className="text-[7px] font-bold !text-slate-500 uppercase tracking-wider">Messages</p>
               </div>
               <p className="text-[18px] font-extrabold !text-slate-900 leading-none mb-0.5 mt-0.5"><CountUp to={data.kpi.msg} key={data.kpi.msg} /></p>
               <p className="text-[8px] font-medium !text-slate-500">exchanged</p>
             </div>
             <div className="flex flex-col items-start justify-center">
               <div className="flex items-center gap-1.5 mb-1">
                 <div className="w-5 h-5 rounded bg-[#CCFBF1] text-[#14B8A6] flex items-center justify-center"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg></div>
                 <p className="text-[7px] font-bold !text-slate-500 uppercase tracking-wider">Leads</p>
               </div>
               <p className="text-[18px] font-extrabold !text-slate-900 leading-none mb-0.5 mt-0.5"><CountUp to={data.kpi.leads} key={data.kpi.leads} /></p>
               <p className="text-[8px] font-medium !text-slate-500">captured</p>
             </div>
             <div className="flex flex-col items-start justify-center">
               <div className="flex items-center gap-1.5 mb-1">
                 <div className="w-5 h-5 rounded bg-[#E6F4F1] text-[#0D9488] flex items-center justify-center"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg></div>
                 <p className="text-[7px] font-bold !text-slate-500 uppercase tracking-wider">Conversion</p>
               </div>
               <p className="text-[18px] font-extrabold !text-slate-900 leading-none mb-0.5 mt-0.5"><CountUp to={data.kpi.convRate} key={data.kpi.convRate} />%</p>
               <p className="text-[8px] font-medium !text-slate-500">lead rate</p>
             </div>
           </div>
        </div>

        {/* Full Width Line Chart */}
        <div className="flex-1 bg-white rounded-[14px] border border-[#CCFBF1] shadow-[0_2px_10px_rgba(3, 150, 166,0.03)] p-4 flex flex-col relative overflow-hidden min-h-[160px]">
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-2 xl:gap-0 mb-4 z-10">
             <div className="text-[12px] font-sans font-bold !text-slate-900" style={{ fontFamily: "var(--sans, 'Outfit', sans-serif)" }}>Conversations & Messages</div>
             <div className="flex items-center gap-3 text-[9px] font-semibold !text-slate-500">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#26B3AA]" /> Conversations</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" /> Messages</span>
             </div>
          </div>
          <div className="flex-1 relative w-[calc(100%-1.25rem)] flex items-end ml-5">
            {/* Y Axis */}
            <div className="absolute left-[-24px] top-0 bottom-6 flex flex-col justify-between text-[8px] font-medium !text-slate-400">
              {data.yAxis.map((y, i) => <span key={i}>{y}</span>)}
            </div>
            {/* Horizontal Grid */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 opacity-30">
              {[1,2,3,4,5].map(i => <div key={i} className="w-full h-px bg-slate-300 border-b border-dashed border-slate-300" />)}
            </div>
            {/* SVG paths animating in */}
            <svg viewBox="0 0 355 110" className="absolute inset-0 w-[calc(100%-5px)] h-[calc(100%-24px)] overflow-visible" preserveAspectRatio="none">
              <AnimatePresence mode="popLayout">
                <motion.path 
                  key={`path-${timeFilter}`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                  d={data.path}
                  fill="none" stroke="#26B3AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
                <motion.path 
                  key={`fill-${timeFilter}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  d={data.fill}
                  fill="#CCFBF1" 
                />
                {/* Data Dots appearing sequentially */}
                {data.dots.map((pt, i) => (
                  <motion.circle 
                    key={`dot-${timeFilter}-${i}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1), type: "spring" }}
                    cx={pt.cx} 
                    cy={pt.cy} 
                    r="2.5" 
                    fill="#26B3AA" 
                  />
                ))}
              </AnimatePresence>
            </svg>
            {/* X Labels */}
            <div className="absolute bottom-1 left-0 right-0 flex justify-between text-[8px] font-medium !text-slate-400 translate-x-[-10px]">
              {data.xLabels.map((lbl, i) => (
                <span key={i}>{lbl}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CalendarPanel() {
  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const meetingDays = [3, 7, 12, 15, 18, 22, 25, 29];

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div className="flex-1 flex flex-col min-h-[440px] sm:min-h-[480px] max-h-[540px] bg-white overflow-hidden">
      <div className="h-[46px] sm:h-[50px] border-b border-[#CCFBF1] px-3 sm:px-5 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-[13px] sm:text-[14px] font-bold !text-slate-900 truncate">Scheduled Meetings</span>
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#14B8A6] shrink-0" />
        </div>
        <span className="text-[9px] sm:text-[11px] font-bold text-[#14B8A6] bg-[#CCFBF1] px-2.5 py-1 rounded-md border border-[#CCFBF1] shrink-0 shadow-sm">{currentMonth}</span>
      </div>

      <div className="flex-1 px-3 sm:px-5 py-2 sm:py-3 flex flex-col justify-between overflow-y-auto bg-transparent min-w-0">
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <span key={i} className="text-[9px] font-bold !text-slate-500 uppercase tracking-wider">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 my-auto">
          {days.map((day, i) => {
            const isToday = day === today.getDate();
            const hasMeeting = day && meetingDays.includes(day);
            return (
              <motion.div
                key={i}
                whileHover={day ? { scale: 1.05 } : {}}
                className={`relative text-[11px] sm:text-[12px] font-semibold h-[32px] sm:h-[34px] flex items-center justify-center rounded-lg transition-all cursor-pointer select-none
                  ${!day ? '' : isToday ? 'bg-[#14B8A6] text-white shadow-md shadow-[#14B8A6]/30' : hasMeeting ? 'bg-[#CCFBF1] text-[#26B3AA] border border-[#CCFBF1]' : '!text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm'}
                `}
              >
                {day}
                {hasMeeting && !isToday && (
                  <span className="absolute bottom-[3px] w-1 h-1 rounded-full bg-[#14B8A6]" />
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-[#CCFBF1] mt-2">
          <p className="text-[9px] font-bold !text-slate-500 uppercase tracking-wider mb-2">Upcoming Meetings</p>
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
            {[
              { time: '10:00 AM', title: 'Demo - Acme Corp', color: '#14B8A6' },
              { time: '2:30 PM', title: 'Follow-up - GrowthLabs', color: '#F59E0B' },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#CCFBF1] shadow-[0_2px_4px_rgba(0,0,0,0.02)] min-w-0">
                <div className="w-1 h-6 rounded-full shrink-0" style={{ background: m.color }} />
                <div className="overflow-hidden min-w-0">
                  <p className="text-[10px] font-bold !text-slate-900 truncate leading-none">{m.title}</p>
                  <p className="text-[9px] font-medium !text-slate-500 mt-1">{m.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamPanel() {
  const users = [
    { name: 'sarah.jenkins', role: 'Owner', email: 'sarah.jenkins@acme.com', status: 'Active', joined: '12 days ago' },
    { name: 'michael.chen', role: 'Agent', email: 'michael.chen@acme.com', status: 'Active', joined: '6 days ago' },
    { name: 'emma.watson', role: 'Manager', email: 'emma.watson@acme.com', status: 'Active', joined: '6 days ago' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-[440px] sm:min-h-[480px] max-h-[540px] bg-white overflow-hidden">
      <div className="px-4 sm:px-6 pt-5 pb-3 shrink-0 flex items-center justify-between gap-2 overflow-hidden">
        <div className="min-w-0">
          <div className="text-[20px] sm:text-[22px] font-sans font-bold !text-slate-900 truncate" style={{ fontFamily: "var(--sans, 'Outfit', sans-serif)" }}>Team Management</div>
          <p className="text-[10px] sm:text-[11px] font-medium !text-slate-500 truncate">Manage your team members, assign roles...</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
           <button className="text-[8px] sm:text-[9px] font-bold !text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-sm hover:bg-slate-50">Roles & Permissions</button>
           <button className="flex items-center gap-1.5 bg-[#26B3AA] hover:bg-[#027D8A] text-white text-[8px] sm:text-[9px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm transition-colors">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
             Invite Teammate
           </button>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 pb-5 flex flex-col gap-4 overflow-y-auto overflow-x-hidden min-w-0">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 shrink-0">
           <div className="bg-white rounded-[14px] p-2.5 sm:p-3 border border-[#CCFBF1] shadow-[0_2px_10px_rgba(3, 150, 166,0.03)] flex flex-col justify-between">
              <p className="text-[7px] font-bold !text-slate-500 uppercase tracking-wider mb-2 truncate">Total Members</p>
              <p className="text-[18px] sm:text-[20px] font-sans font-bold !text-slate-900 leading-none mb-2"><CountUp to={4} /></p>
              <p className="text-[8px] font-bold text-[#26B3AA] flex items-center gap-1"><svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> <span className="truncate">4 active</span></p>
           </div>
           <div className="bg-white rounded-[14px] p-2.5 sm:p-3 border border-[#CCFBF1] shadow-[0_2px_10px_rgba(3, 150, 166,0.03)] flex flex-col justify-between">
              <p className="text-[7px] font-bold !text-slate-500 uppercase tracking-wider mb-2 truncate">Active Now</p>
              <p className="text-[18px] sm:text-[20px] font-sans font-bold !text-slate-900 leading-none mb-2"><CountUp to={4} /></p>
              <p className="text-[8px] font-bold text-[#F59E0B] flex items-center gap-1"><svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> <span className="truncate">4 pending invites</span></p>
           </div>
           <div className="bg-white rounded-[14px] p-2.5 sm:p-3 border border-[#CCFBF1] shadow-[0_2px_10px_rgba(3, 150, 166,0.03)] flex flex-col justify-between">
              <p className="text-[7px] font-bold !text-slate-500 uppercase tracking-wider mb-2 truncate">Roles in Use</p>
              <p className="text-[18px] sm:text-[20px] font-sans font-bold !text-slate-900 leading-none mb-2"><CountUp to={3} /></p>
              <p className="text-[8px] font-medium !text-slate-500 flex items-center gap-1"><svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> <span className="truncate">owner, agent...</span></p>
           </div>
           <div className="bg-white rounded-[14px] p-2.5 sm:p-3 border border-[#CCFBF1] shadow-[0_2px_10px_rgba(3, 150, 166,0.03)] flex flex-col justify-between">
              <p className="text-[7px] font-bold !text-slate-500 uppercase tracking-wider mb-2 truncate">Seat Usage</p>
              <p className="text-[18px] sm:text-[20px] font-sans font-bold !text-slate-900 leading-none mb-1"><CountUp to={8} /> <span className="text-slate-400 text-[10px] sm:text-[12px] font-sans font-medium">/ 20</span></p>
              <div className="w-full h-[3px] bg-slate-100 rounded-full mb-1 overflow-hidden mt-1">
                 <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} transition={{ duration: 1.5 }} className="h-full bg-[#0396A6] rounded-full" />
              </div>
              <div className="flex justify-between items-center text-[7px] font-medium text-slate-500 mt-1">
                <span className="truncate">40% utilized</span>
              </div>
           </div>
        </div>

        {/* Team Table */}
        <div className="bg-white rounded-[14px] border border-[#CCFBF1] shadow-[0_2px_10px_rgba(3, 150, 166,0.03)] overflow-hidden flex-1 flex flex-col min-h-[160px] min-w-0">
          <div className="px-3 sm:px-4 py-2 border-b border-[#CCFBF1] flex items-center justify-between bg-white overflow-hidden gap-2 shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
               <div className="text-[11px] sm:text-[13px] font-sans font-bold !text-slate-900" style={{ fontFamily: "var(--sans, 'Outfit', sans-serif)" }}>Teammates</div>
               <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                  <span className="text-[8px] sm:text-[9px] bg-[#CCFBF1] text-[#14B8A6] font-bold px-2 py-1 rounded-full cursor-pointer whitespace-nowrap">All</span>
               </div>
            </div>
            <a href="#" className="text-[8px] sm:text-[9px] font-bold text-[#26B3AA] flex items-center gap-1 hover:underline whitespace-nowrap shrink-0">
               Permissions <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>
          </div>
          
          <div className="flex-1 overflow-auto bg-white min-w-0">
             <table className="w-full text-left border-collapse whitespace-nowrap min-w-[500px]">
                <thead>
                   <tr className="border-b border-[#CCFBF1]">
                      <th className="px-3 sm:px-4 py-2 text-[7px] sm:text-[8px] font-bold !text-slate-400 uppercase tracking-wider">Name</th>
                      <th className="px-3 sm:px-4 py-2 text-[7px] sm:text-[8px] font-bold !text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-3 sm:px-4 py-2 text-[7px] sm:text-[8px] font-bold !text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="px-3 sm:px-4 py-2 text-[7px] sm:text-[8px] font-bold !text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-4 py-2 text-[7px] sm:text-[8px] font-bold !text-slate-400 uppercase tracking-wider">Joined</th>
                   </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <motion.tr 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: i * 0.1 }}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-3 sm:px-4 py-2">
                         <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FEF3C7] text-[#F59E0B] font-bold text-[9px] sm:text-[10px] flex items-center justify-center shrink-0">
                              {u.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                               <p className="text-[9px] sm:text-[10px] font-bold !text-slate-900 leading-tight mb-0.5">{u.name}</p>
                               <p className="text-[7px] sm:text-[8px] font-medium !text-slate-500">{u.role}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] font-medium !text-slate-700">{u.email}</td>
                      <td className="px-3 sm:px-4 py-2">
                         <span className={`inline-block text-[7px] sm:text-[8px] font-bold px-2 py-0.5 rounded uppercase ${
                           u.role === 'Owner' ? 'text-[#F59E0B] bg-[#FEF3C7]' :
                           u.role === 'Agent' ? 'text-[#FF7A5E] bg-[#DBEAFE]' :
                           'text-[#14B8A6] bg-[#CCFBF1]'
                         }`}>
                           {u.role}
                         </span>
                      </td>
                      <td className="px-3 sm:px-4 py-2">
                         <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold !text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span> {u.status}
                         </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] font-medium !text-slate-500">{u.joined}</td>
                    </motion.tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const TABS = ['home', 'chart', 'chat', 'calendar', 'users'] as const;
type TabType = typeof TABS[number];

export default function InteractiveDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [visibleMsgs, setVisibleMsgs] = useState<typeof chatScript>([]);
  const [typing, setTyping] = useState(false);

  // Auto-switch tab every 3 seconds, reset whenever activeTab changes
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => {
        const currentIndex = TABS.indexOf(prev);
        const nextIndex = (currentIndex + 1) % TABS.length;
        return TABS[nextIndex] ?? 'home';
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [activeTab]);

  useEffect(() => {
    let step = 0;
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>(r => { timers.push(setTimeout(r, ms)); });

    if (activeTab === 'chat') {
      (async () => {
        await wait(150);
        while (alive) {
          const firstMsg = chatScript[0];
          if (firstMsg) setVisibleMsgs([firstMsg]);
          setTyping(false);
          step = 1;
          await wait(300);
          for (; step < chatScript.length && alive; step++) {
            const m = chatScript[step];
            if (!m) continue;
            if (m.role === 'bot') {
              setTyping(true);
              await wait(600);
              setTyping(false);
            }
            if (!alive) break;
            setVisibleMsgs((prev) => [...prev, m]);
            await wait(m.role === 'bot' ? 1200 : 800);
          }
          await wait(2500);
        }
      })();
    }

    return () => { alive = false; timers.forEach(clearTimeout); };
  }, [activeTab]);

  return (
    <div className="relative w-full max-w-[720px] mx-auto bg-white rounded-[24px] sm:rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/80 overflow-hidden">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-[48px] sm:w-[56px] bg-[#F8FAFC] flex flex-col items-center py-4 sm:py-5 gap-4 sm:gap-5 shrink-0 border-r border-slate-200">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[10px] sm:rounded-xl bg-white shadow-sm flex items-center justify-center mb-1 sm:mb-2 p-1 border border-slate-200">
            <FrostyIcon size={20} />
          </div>
          {(['home', 'chart', 'chat', 'calendar', 'users'] as const).map((icon) => (
            <div
              key={icon}
              onClick={() => setActiveTab(icon)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === icon ? 'bg-[#0396A6] shadow-sm text-white' : 'hover:bg-slate-200/60 text-slate-500'
              }`}
            >
              <SidebarIcon type={icon} active={activeTab === icon} />
            </div>
          ))}
        </div>

        {/* Content panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex-1 flex flex-col min-w-0"
          >
            {activeTab === 'home' && <DashboardPanel />}
            {activeTab === 'chart' && <AnalyticsPanelV2 />}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-[440px] sm:min-h-[480px] max-h-[540px] bg-white overflow-hidden">
                <div className="h-[46px] sm:h-[50px] border-b border-[#CCFBF1] px-3 sm:px-5 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="text-[13px] sm:text-[14px] font-bold !text-slate-900 truncate">New Lead</span>
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#14B8A6] shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#10B981]" />
                    <span className="text-[9px] sm:text-[10px] font-bold !text-slate-700">Online</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 sm:py-4 flex flex-col gap-3 scrollbar-hide bg-transparent">
                  {visibleMsgs.filter(Boolean).map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                      className={`flex flex-col max-w-[82%] ${msg?.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div className={`px-3.5 py-2.5 text-[12px] sm:text-[13px] font-medium leading-[1.5] rounded-2xl shadow-sm ${
                        msg?.role === 'user'
                          ? 'bg-[#0396A6] text-white rounded-tr-md'
                          : 'bg-white border border-slate-200 !text-slate-900 rounded-tl-md'
                      }`}>
                        {typeof msg?.text === 'string' ? (msg.text as string).split('\n').map((line, li) => (
                          <span key={li}>{line}{li < (msg.text as string).split('\n').length - 1 && <br />}</span>
                        )) : msg?.text}
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-semibold !text-slate-500 mt-1 px-1">
                        {msg?.label} • {msg?.time}
                      </span>
                    </motion.div>
                  ))}

                  {typing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="self-start bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm flex items-center gap-1.5"
                    >
                      {[0, 0.15, 0.3].map((d, i) => (
                        <motion.div key={i} animate={{ y: [0, -3, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: d }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'calendar' && <CalendarPanel />}
            {activeTab === 'users' && <TeamPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
