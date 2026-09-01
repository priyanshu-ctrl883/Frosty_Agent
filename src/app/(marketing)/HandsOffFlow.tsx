import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Globe, Brain, Headphones } from 'lucide-react';

export default function HandsOffFlow({ onComplete }: { onComplete?: () => void }) {
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
            <motion.line x1="100" y1="80" x2="400" y2="80" stroke="#0396A6" strokeWidth="2.5" strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1, delay: 0.8 }} />
            <motion.line x1="400" y1="80" x2="400" y2="380" stroke="#14B8A6" strokeWidth="2.5" strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1, delay: 2.2 }} />
            <motion.line x1="400" y1="380" x2="100" y2="380" stroke="#EA580C" strokeWidth="2.5" strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1, delay: 4 }} />
            <motion.line x1="100" y1="380" x2="100" y2="80" stroke="#E11D48" strokeWidth="2.5" strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1, delay: 5.5 }} />

            {/* Node: User (top left) */}
            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
              <circle cx="100" cy="80" r="24" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
              <foreignObject x="88" y="68" width="24" height="24" className="overflow-visible pointer-events-none">
                <div className="w-6 h-6 flex items-center justify-center text-slate-700">
                  <User className="w-5 h-5" strokeWidth={1.75} />
                </div>
              </foreignObject>
            </motion.g>

            {/* Node: Website (top right) */}
            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: 'spring' }}>
              <circle cx="400" cy="80" r="24" fill="#F0FDFA" stroke="#0396A6" strokeWidth="1.5" />
              <foreignObject x="388" y="68" width="24" height="24" className="overflow-visible pointer-events-none">
                <div className="w-6 h-6 flex items-center justify-center">
                  <img loading="lazy" decoding="async" src="/web.svg" alt="Website" className="w-5 h-5 object-contain" />
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

            {/* Node: Headset/Human (bottom left) */}
            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.8, type: 'spring' }}>
              <circle cx="100" cy="380" r="24" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.5" />
              <foreignObject x="88" y="368" width="24" height="24" className="overflow-visible pointer-events-none">
                <div className="w-6 h-6 flex items-center justify-center text-[#EA580C]">
                  <Headphones className="w-5 h-5" strokeWidth={1.75} />
                </div>
              </foreignObject>
            </motion.g>

            {/* Bubble 1: User request */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.4 }}>
              <rect x="155" y="56" width="190" height="46" rx="14" fill="#0396A6" />
              <text x="250" y="76" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">&quot;I&apos;d rather speak</text>
              <text x="250" y="91" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">to a person.&quot;</text>
            </motion.g>

            {/* Bubble 2: Escalating */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3, duration: 0.4 }}>
              <rect x="310" y="215" width="160" height="28" rx="14" fill="#FFFFFF" stroke="#0396A6" strokeWidth="1" />
              <text x="390" y="234" textAnchor="middle" fill="#0396A6" fontSize="11" fontWeight="700">Escalating priority…</text>
            </motion.g>

            {/* Bubble 3: Transferring */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.8, duration: 0.4 }}>
              <rect x="130" y="367" width="240" height="28" rx="14" fill="#FFFFFF" stroke="#EA580C" strokeWidth="1" />
              <text x="250" y="386" textAnchor="middle" fill="#EA580C" fontSize="11" fontWeight="700">Transferring full chat history…</text>
            </motion.g>

            {/* Bubble 4: Handed over */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 6.5, duration: 0.4 }}>
              <rect x="20" y="195" width="160" height="46" rx="14" fill="#E11D48" />
              <text x="100" y="215" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Live chat handed</text>
              <text x="100" y="230" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">to your team!</text>
            </motion.g>
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}
