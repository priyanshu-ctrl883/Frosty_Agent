"use client";

import { motion } from "framer-motion";

const PLANS = [
  {
    code: "growth",
    name: "Growth",
    retainer: 30000,
    conversations: 1000,
    overage: 35,
    analytics: false,
  },
  {
    code: "dominance",
    name: "Dominance",
    retainer: 50000,
    conversations: 2000,
    overage: 30,
    analytics: true,
  },
];

export default function LiquidPricing() {
  return (
    <div id="pricing" className="w-full py-20 px-4 flex flex-col items-center">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4">
          Simple monthly plans
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Setup ₹30,000 once. Monthly retainer includes website + WhatsApp. Overage billed per conversation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
        {PLANS.map((plan) => (
          <motion.div
            key={plan.code}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-8"
          >
            <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
            <p className="text-3xl font-extrabold text-[#0396A6] mt-2">
              ₹{plan.retainer.toLocaleString()}
              <span className="text-sm text-slate-500 font-normal">/month</span>
            </p>
            <ul className="mt-6 space-y-2 text-slate-300 text-sm">
              <li>{plan.conversations.toLocaleString()} conversations included</li>
              <li>₹{plan.overage} per extra conversation</li>
              <li>1 Website + 1 WhatsApp channel</li>
              {plan.analytics && <li>Advanced AI Analytics</li>}
            </ul>
            <a
              href="/login"
              className="mt-8 inline-block rounded-full bg-white text-black px-6 py-2.5 text-sm font-semibold"
            >
              Start free trial
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
