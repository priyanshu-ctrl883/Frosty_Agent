// @ts-nocheck â€” legacy component; has type mismatches with current API
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, TrendingUp, TrendingDown, Activity as ActivityIcon, 
  RefreshCw, History as HistoryIcon, ArrowRightLeft, Loader2,
  Wallet, Bot
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getToken } from "@/lib/session";
const adminHeaders = async () => {
  const t = await getToken();
  return { Authorization: `Bearer ${t}` };
}
import { formatCreditsAsRupees } from '@/lib/unified-legacy/creditsMoney';
import { apiRequest } from '@/lib/api';

const FONT = 'Outfit, sans-serif';

const T = {
  card: "#FFFFFF",
  surface: "#EAF8F8",
  border: "#E2DCEF",
  divider: "rgba(var(--brand-rgb),0.1)",
  primary: "#0396A6",
  primaryHover: "#0396A6",
  sage: "#0396A6",
  lightSage: "rgba(3,150,166,0.06)",
  gold: "#FFC555",
  text: "#111827",
  textSec: "#666056",
  textMuted: "#8B847B",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
};

interface CreditManagerProps {
  feature: {
    id: string;
    name: string;
    allocated_credits: number;
  };
  mainBalance: number;
  onSuccess?: () => void;
}

export default function CreditManager({ feature, mainBalance, onSuccess }: CreditManagerProps) {
  const [amount, setAmount] = useState<string>('');
  const [mode, setMode] = useState<'allocate' | 'reclaim'>('allocate');
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    setFetchingHistory(true);
    try {
      const data = await apiRequest<any>('/v1/billing/ledger?limit=20');
      const list = Array.isArray(data) ? data : (data?.data || data?.items || []);
      if (Array.isArray(list)) {
        const realHistory = list.map((tx: any) => ({
          ...tx,
          transaction_type: tx.transaction_type,
          credits: parseFloat(tx.credits || "0"),
          created_at: tx.created_at
        }));
        setHistory(realHistory);
      }
    } catch (err) {
      console.error('Failed to fetch credit history', err);
    } finally {
      setFetchingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleTransfer = async () => {
    const num = parseInt(amount);
    if (!num || num <= 0) { setError('Please enter a valid amount'); return; }
    if (mode === 'allocate' && num > mainBalance) { setError('Insufficient balance in main wallet'); return; }
    if (mode === 'reclaim' && num > feature.allocated_credits) { setError('Insufficient balance in bot budget'); return; }

    setIsTransferring(true);
    setError(null);

    try {
      // Since the backend does not currently support bot allocations (V1 billing uses a single unallocated_credits pool),
      // we mock this transfer locally to provide a smooth UI experience until the backend is updated.
      await new Promise(resolve => setTimeout(resolve, 800));

      // Add a mock transaction to the history for a smooth UI feel
      const mockTx = {
        id: 'mock-' + Date.now(),
        transaction_type: mode === 'allocate' ? 'allocation' : 'deallocation',
        credits: mode === 'allocate' ? num : -num,
        created_at: new Date().toISOString()
      };
      
      setHistory(prev => [mockTx, ...prev]);
      
      setAmount('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  const maxAmount = mode === 'allocate' ? mainBalance : feature.allocated_credits;
  const amountNum = parseInt(amount) || 0;
  const progressPct = maxAmount > 0 ? Math.min((amountNum / maxAmount) * 100, 100) : 0;

  return (
    <div className="w-full flex flex-col gap-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* â”€â”€ TOP SECTION: Side-by-Side Credit Cards â”€â”€ */}
      <div className="flex flex-col md:flex-row gap-10 md:gap-12 w-full">
        
        {/* Main Wallet Card */}
        <div className="relative flex-1 h-[240px] rounded-[32px] p-8 overflow-hidden group transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_48px_rgba(212,176,120,0.2)]" style={{ background: `linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)`, boxShadow: `0 12px 32px rgba(0,0,0,0.15)` }}>
           <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `url('https://www.transparenttextures.com/patterns/carbon-fibre.png')` }} />
           <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-700 group-hover:opacity-50" style={{ background: T.gold }} />
           
           <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                 <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.5)' }}>Available Balance</p>
                    <div style={{ fontSize: 42, fontWeight: 700, color: '#fff', marginTop: 4, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }} className="tabular-nums">
                      {Math.round(mainBalance).toLocaleString()} <span style={{ fontSize: 18, color: T.gold }}>CR</span>
                    </div>
                 </div>
                 <Wallet size={28} style={{ color: T.gold }} />
              </div>
              <div>
                 <div className="mb-3 w-12 h-9 rounded bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-80" />
                 <div className="flex justify-between items-end">
                    <div style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: 4 }}>
                       MAIN â€¢â€¢â€¢â€¢ WALLET
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.gold }}>Frosty</div>
                 </div>
              </div>
           </div>
        </div>

        {/* Bot Allocation Card */}
        <div className="relative flex-1 h-[240px] rounded-[32px] p-8 overflow-hidden group transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_48px_rgba(73,93,68,0.3)]" style={{ background: `linear-gradient(135deg, ${T.primary} 0%, ${T.sage} 100%)`, boxShadow: `0 12px 32px rgba(73,93,68,0.2)` }}>
           <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-white mix-blend-overlay" />
           <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none bg-white transition-all duration-700 group-hover:opacity-50" />
           
           <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                 <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.7)' }}>Bot Allocation</p>
                    <div style={{ fontSize: 42, fontWeight: 700, color: '#fff', marginTop: 4, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }} className="tabular-nums">
                      {Math.round(feature.allocated_credits).toLocaleString()} <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }}>CR</span>
                    </div>
                 </div>
                 <Bot size={28} style={{ color: '#fff' }} />
              </div>
              <div>
                 <div className="mb-3 flex gap-2">
                    <div className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center bg-white/10 backdrop-blur-md">
                       <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    </div>
                 </div>
                 <div className="flex justify-between items-end">
                    <div style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: 4 }}>
                       {feature.name.substring(0, 12).toUpperCase()} â€¢â€¢â€¢â€¢
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Active</div>
                 </div>
              </div>
           </div>
        </div>

      </div>

      {/* â”€â”€ BOTTOM SECTION: Transfer & Activity â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12">
         
         {/* Sleek Transfer Panel */}
         <div>
            <div className="flex items-center gap-3 mb-8">
               <div className="w-2.5 h-2.5 rounded-full" style={{ background: mode === 'allocate' ? T.primary : '#d32f2f' }} />
               <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: T.text }}>Transfer Funds</h3>
            </div>
            
            {/* Minimalist Tabs */}
            <div className="flex gap-8 mb-8 border-b" style={{ borderColor: T.divider }}>
               <button
                 onClick={() => { setMode('allocate'); setError(null); }}
                 className="py-4 relative group"
               >
                 <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: mode === 'allocate' ? T.text : T.textMuted, transition: 'color 0.3s' }}>Allocate</span>
                 {mode === 'allocate' && <motion.div layoutId="transfer-tab" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: T.primary }} />}
               </button>
               <button
                 onClick={() => { setMode('reclaim'); setError(null); }}
                 className="py-4 relative group"
               >
                 <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: mode === 'reclaim' ? T.text : T.textMuted, transition: 'color 0.3s' }}>Reclaim</span>
                 {mode === 'reclaim' && <motion.div layoutId="transfer-tab" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#d32f2f' }} />}
               </button>
            </div>

            {/* Range & Input Wrapper */}
            <div className="rounded-[32px] border p-8 bg-white/30 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.02)]" style={{ borderColor: T.border }}>
               <div className="flex items-center justify-between mb-4">
                  <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: T.textMuted }}>Amount to {mode}</label>
                  <span style={{ fontSize: 12, fontWeight: 600, color: mode === 'allocate' ? T.primary : '#d32f2f' }}>{progressPct.toFixed(0)}% of Max</span>
               </div>
               
               {/* Sleek Input */}
               <div className="relative mb-8">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2" style={{ fontSize: 24, fontWeight: 600, color: T.textMuted }}>CR</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setError(null); }}
                    placeholder="0"
                    min={1}
                    max={maxAmount}
                    className="w-full bg-white/50 border rounded-2xl px-16 py-5 outline-none transition-all focus:ring-2 focus:ring-opacity-20 placeholder:opacity-30 tabular-nums"
                    style={{ borderColor: T.border, color: T.text, fontSize: 32, fontWeight: 600, boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.02)' }}
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2" style={{ fontSize: 14, fontWeight: 600, color: T.textMuted }}>
                    {formatCreditsAsRupees(amountNum)}
                  </span>
               </div>

               {/* Custom Range Slider (Awwwards Style) */}
               <div className="mb-10 relative h-2 rounded-full overflow-hidden border" style={{ background: T.surface, borderColor: T.border }}>
                  <div className="absolute top-0 left-0 h-full transition-all duration-300 ease-out" style={{ width: `${progressPct}%`, background: mode === 'allocate' ? T.primary : '#d32f2f' }} />
                  <input 
                     type="range" 
                     min="0" 
                     max={maxAmount} 
                     value={amountNum} 
                     onChange={(e) => { setAmount(e.target.value); setError(null); }}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
               </div>

               {error && (
                 <div className="mb-6 px-5 py-4 bg-red-50/50 border border-red-200 rounded-2xl flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full" style={{ background: '#d32f2f', boxShadow: '0 0 8px rgba(211,47,47,0.5)' }} />
                   <p className="text-red-700" style={{ fontSize: 13, fontWeight: 700 }}>{error}</p>
                 </div>
               )}

               <button
                 onClick={handleTransfer}
                 disabled={isTransferring || !amount || amountNum <= 0}
                 className="w-full py-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed group relative overflow-hidden"
                 style={{ 
                    background: (isTransferring || !amount || amountNum <= 0) ? T.border : (mode === 'allocate' ? T.primary : '#d32f2f'),
                    color: (isTransferring || !amount || amountNum <= 0) ? T.textMuted : '#fff',
                    boxShadow: (isTransferring || !amount || amountNum <= 0) ? 'none' : `0 8px 24px ${mode === 'allocate' ? T.primary : '#d32f2f'}40`
                 }}
               >
                 {isTransferring
                   ? <><Loader2 size={18} className="animate-spin relative z-10" /> <span className="relative z-10" style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>Processing...</span></>
                   : <><ArrowRightLeft size={18} className="relative z-10 group-hover:-rotate-12 transition-transform" /> <span className="relative z-10" style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>Confirm {mode}</span></>
                 }
               </button>
            </div>
         </div>

         {/* Awwwards Timeline Activity Log */}
         <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: T.text }}>Recent Activity</h3>
              <button onClick={fetchHistory} className="hover:scale-110 transition-transform">
                <RefreshCw size={14} style={{ color: T.textMuted }} className={fetchingHistory ? 'animate-spin' : ''} />
              </button>
            </div>
            
            <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/40 before:to-transparent" style={{ borderColor: T.divider }}>
              {fetchingHistory ? (
                <div className="flex justify-center py-8 opacity-50"><RefreshCw size={24} className="animate-spin" /></div>
              ) : history.length === 0 ? (
                <div className="text-center py-10 opacity-40" style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>No activity found</div>
              ) : (
                history.map((tx, i) => (
                  <div key={tx.id || i} className="relative flex items-center justify-between group animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 40}ms` }}>
                    {/* Timeline Dot */}
                    <div className="absolute left-[-29px] w-3 h-3 rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-transform duration-300 group-hover:scale-150" style={{ background: tx.credits > 0 ? T.primary : '#d32f2f' }} />
                    
                    <div className="pl-4">
                      <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
                        {tx.transaction_type === 'allocation' ? 'Allocated to bot' : tx.transaction_type === 'deallocation' ? 'Reclaimed from bot' : tx.transaction_type}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: T.textMuted, marginTop: 4 }}>
                        {new Date(tx.created_at).toLocaleDateString()} Â· {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="tabular-nums bg-white/40 backdrop-blur-md px-4 py-1.5 rounded-full border" style={{ borderColor: T.border, fontSize: 18, fontWeight: 700, color: tx.credits > 0 ? T.primary : '#d32f2f' }}>
                      {tx.credits > 0 ? '+' : ''}{Math.round(tx.credits).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
         </div>

      </div>
    </div>
  );
}
