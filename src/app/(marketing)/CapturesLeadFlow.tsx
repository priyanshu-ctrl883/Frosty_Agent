import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MessageCircle, Brain, TrendingUp } from 'lucide-react';

export default function CapturesLeadFlow({ onComplete }: { onComplete?: () => void }) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStarted(true), 400);
    const t2 = setTimeout(() => { if (onComplete) onComplete(); }, 9500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <div className="w-full flex items-center justify-center">
      <AnimatePresence>
        {started && (
          <motion.svg
            viewBox="0 0 500 460"
            className="w-full h-auto max-h-[340px] sm:max-h-[420px] lg:max-h-[460px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Dashed background lines (square) */}
            <line x1="100" y1="80" x2="400" y2="80" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="400" y1="80" x2="400" y2="380" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="400" y1="380" x2="100" y2="380" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="100" y1="380" x2="100" y2="80" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 4" />

            {/* Animated lines */}
            <motion.line x1="100" y1="80" x2="400" y2="80" stroke="#16A34A" strokeWidth="2.5" strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1, delay: 0.8 }} />
            <motion.line x1="400" y1="80" x2="400" y2="380" stroke="#14B8A6" strokeWidth="2.5" strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.2, delay: 2.2 }} />
            <motion.line x1="400" y1="380" x2="100" y2="380" stroke="#E11D48" strokeWidth="2.5" strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1, delay: 4 }} />
            <motion.line x1="100" y1="380" x2="100" y2="80" stroke="#16A34A" strokeWidth="2.5" strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.2, delay: 5.5 }} />

            {/* Node: User (top left) */}
            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
              <circle cx="100" cy="80" r="24" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
              <foreignObject x="88" y="68" width="24" height="24" className="overflow-visible pointer-events-none">
                <div className="w-6 h-6 flex items-center justify-center text-slate-700">
                  <User className="w-5 h-5" strokeWidth={1.75} />
                </div>
              </foreignObject>
            </motion.g>

            {/* Node: WhatsApp (top right) */}
            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: 'spring' }}>
              <circle cx="400" cy="80" r="24" fill="#F0FDF4" stroke="#16A34A" strokeWidth="1.5" />
              <foreignObject x="388" y="68" width="24" height="24" className="overflow-visible pointer-events-none">
                <div className="w-6 h-6 flex items-center justify-center">
                  <img loading="lazy" decoding="async" src="/whatsapp.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
                </div>
              </foreignObject>
            </motion.g>

            {/* Node: Brain (bottom right) */}
            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6, type: 'spring' }}>
              <circle cx="400" cy="380" r="24" fill="#F0FDFA" stroke="#14B8A6" strokeWidth="1.5" />
              <foreignObject x="388" y="368" width="24" height="24" className="overflow-visible pointer-events-none">
                <div className="w-6 h-6 flex items-center justify-center text-[#14B8A6]">
                  <Brain className="w-5 h-5" strokeWidth={1.75} />
                </div>
              </foreignObject>
            </motion.g>

            {/* Node: CRM (bottom left) */}
            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.8, type: 'spring' }}>
              <circle cx="100" cy="380" r="24" fill="#FFF1F2" stroke="#E11D48" strokeWidth="1.5" />
              <foreignObject x="88" y="368" width="24" height="24" className="overflow-visible pointer-events-none">
                <div className="w-6 h-6 flex items-center justify-center text-[#E11D48]">
                  <TrendingUp className="w-5 h-5" strokeWidth={1.75} />
                </div>
              </foreignObject>
            </motion.g>

            {/* Bubble 1: User message */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.4 }}>
              <rect x="155" y="56" width="190" height="46" rx="14" fill="#16A34A" />
              <text x="250" y="76" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">&quot;I&apos;m interested —</text>
              <text x="250" y="91" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">here&apos;s my number.&quot;</text>
            </motion.g>

            {/* Bubble 2: Extracting */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3, duration: 0.4 }}>
              <rect x="300" y="215" width="175" height="28" rx="14" fill="#FFFFFF" stroke="#0396A6" strokeWidth="1" />
              <text x="387" y="234" textAnchor="middle" fill="#0396A6" fontSize="11" fontWeight="700">Extracting contact info…</text>
            </motion.g>

            {/* Bubble 3: High intent lead */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.8, duration: 0.4 }}>
              <rect x="155" y="367" width="190" height="28" rx="14" fill="#FFFFFF" stroke="#E11D48" strokeWidth="1" />
              <text x="250" y="386" textAnchor="middle" fill="#E11D48" fontSize="11" fontWeight="700">Intent: High Intent Lead</text>
            </motion.g>

            {/* Bubble 4: Lead saved */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 6.5, duration: 0.4 }}>
              <rect x="20" y="195" width="160" height="46" rx="14" fill="#16A34A" />
              <text x="100" y="215" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Lead saved ·</text>
              <text x="100" y="230" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">synced to your CRM</text>
            </motion.g>
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}
