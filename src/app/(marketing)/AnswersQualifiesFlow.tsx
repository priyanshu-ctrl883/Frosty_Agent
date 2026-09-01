import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Globe, Brain } from 'lucide-react';

export default function AnswersQualifiesFlow({ onComplete }: { onComplete?: () => void }) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStarted(true), 400);
    const t2 = setTimeout(() => { if (onComplete) onComplete(); }, 8500);
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
            {/* Dashed background lines */}
            <line x1="250" y1="80" x2="420" y2="380" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="420" y1="380" x2="80" y2="380" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="80" y1="380" x2="250" y2="80" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 4" />

            {/* Animated lines */}
            <motion.line x1="250" y1="80" x2="420" y2="380" stroke="#0396A6" strokeWidth="2.5" strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.2, delay: 0.8 }} />
            <motion.line x1="420" y1="380" x2="80" y2="380" stroke="#14B8A6" strokeWidth="2.5" strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.2, delay: 2.5 }} />
            <motion.line x1="80" y1="380" x2="250" y2="80" stroke="#10B981" strokeWidth="2.5" strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.2, delay: 4.5 }} />

            {/* Node: User (top center) */}
            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
              <circle cx="250" cy="80" r="24" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
              <foreignObject x="238" y="68" width="24" height="24" className="overflow-visible pointer-events-none">
                <div className="w-6 h-6 flex items-center justify-center text-slate-700">
                  <User className="w-5 h-5" strokeWidth={1.75} />
                </div>
              </foreignObject>
            </motion.g>

            {/* Node: Website (bottom right) */}
            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: 'spring' }}>
              <circle cx="420" cy="380" r="24" fill="#F0FDFA" stroke="#0396A6" strokeWidth="1.5" />
              <foreignObject x="408" y="368" width="24" height="24" className="overflow-visible pointer-events-none">
                <div className="w-6 h-6 flex items-center justify-center">
                  <img loading="lazy" decoding="async" src="/web.svg" alt="Website" className="w-5 h-5 object-contain" />
                </div>
              </foreignObject>
            </motion.g>

            {/* Node: Brain (bottom left) */}
            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6, type: 'spring' }}>
              <circle cx="80" cy="380" r="24" fill="#F0FDFA" stroke="#14B8A6" strokeWidth="1.5" />
              <foreignObject x="68" y="368" width="24" height="24" className="overflow-visible pointer-events-none">
                <div className="w-6 h-6 flex items-center justify-center text-[#14B8A6]">
                  <Brain className="w-5 h-5" strokeWidth={1.75} />
                </div>
              </foreignObject>
            </motion.g>

            {/* Bubble 1: User question */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.4 }}>
              <rect x="280" y="190" width="160" height="46" rx="14" fill="#0396A6" />
              <text x="360" y="210" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">&quot;Do you work with</text>
              <text x="360" y="225" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">clinics like ours?&quot;</text>
            </motion.g>

            {/* Bubble 2: Intent analysis */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2, duration: 0.4 }}>
              <rect x="155" y="370" width="190" height="28" rx="14" fill="#FFFFFF" stroke="#0396A6" strokeWidth="1" />
              <text x="250" y="389" textAnchor="middle" fill="#0396A6" fontSize="11" fontWeight="700">Analyzing intent… tagged WARM</text>
            </motion.g>

            {/* Bubble 3: AI reply */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.5, duration: 0.4 }}>
              <rect x="85" y="200" width="160" height="46" rx="14" fill="#16A34A" />
              <text x="165" y="220" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">&quot;Yes we do! How many</text>
              <text x="165" y="235" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">locations do you have?&quot;</text>
            </motion.g>
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}
