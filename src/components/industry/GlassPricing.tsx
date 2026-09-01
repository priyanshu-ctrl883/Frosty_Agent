import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export function GlassPricing() {
  return (
    <section className="py-24 bg-[#FAFAFA] px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0396A6]/5 via-transparent to-transparent -z-10" />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-stone-900 mb-6 tracking-tight">
            Transparent pricing. Unlimited ROI.
          </h2>
          <p className="text-lg md:text-xl text-stone-500 max-w-2xl mx-auto">
            Try any plan free for 7 days. Upgrade anytime as your workflow needs grow.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
          
          {/* Plus */}
          <div className="bg-white/80 backdrop-blur-xl border border-stone-200 rounded-[2rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-stone-900 mb-2">Plus</h3>
              <p className="text-stone-500 text-sm">For single-location operations</p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-stone-900">$40</span>
              <span className="text-stone-500 font-medium">/mo</span>
            </div>
            <Link href="/signup?plan=plus" className="w-full py-3.5 rounded-full border border-stone-300 text-stone-700 font-bold text-center hover:bg-stone-50 transition-colors mb-8">
              Start Free Trial
            </Link>
            <ul className="space-y-4 text-sm text-stone-600 flex-1">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#0396A6] shrink-0" /> <span className="font-medium text-stone-700">3,000</span> AI actions/mo</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#0396A6] shrink-0" /> 1 AI Employee</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#0396A6] shrink-0" /> Website & WhatsApp support</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#0396A6] shrink-0" /> Standard Integrations</li>
            </ul>
          </div>

          {/* Pro (Popular) */}
          <div className="bg-stone-900 backdrop-blur-2xl border border-stone-700 rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(3,150,166,0.15)] flex flex-col relative transform scale-105 z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 bg-gradient-to-r from-[#027D8A] to-[#0396A6] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
              Most Popular
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <p className="text-stone-400 text-sm">For multi-provider practices</p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">$100</span>
              <span className="text-stone-400 font-medium">/mo</span>
            </div>
            <Link href="/signup?plan=pro" className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#027D8A] to-[#0396A6] text-white font-bold text-center shadow-lg shadow-[#0396A6]/20 hover:shadow-[#0396A6]/40 transition-shadow mb-8">
              Start Free Trial
            </Link>
            <ul className="space-y-4 text-sm text-stone-300 flex-1">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#0396A6] shrink-0" /> <span className="font-bold text-white">12,000</span> AI actions/mo</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#0396A6] shrink-0" /> <span className="font-bold text-white">2</span> AI Employees</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#0396A6] shrink-0" /> Omnichannel routing</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#0396A6] shrink-0" /> Remove Frosty branding</li>
            </ul>
          </div>

          {/* Max */}
          <div className="bg-white/80 backdrop-blur-xl border border-stone-200 rounded-[2rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-stone-900 mb-2">Max</h3>
              <p className="text-stone-500 text-sm">For franchises & large orgs</p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-stone-900">$200</span>
              <span className="text-stone-500 font-medium">/mo</span>
            </div>
            <Link href="/contact" className="w-full py-3.5 rounded-full border border-stone-300 text-stone-700 font-bold text-center hover:bg-stone-50 transition-colors mb-8">
              Contact Sales
            </Link>
            <ul className="space-y-4 text-sm text-stone-600 flex-1">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-stone-400 shrink-0" /> <span className="font-medium text-stone-700">30,000</span> AI actions/mo</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-stone-400 shrink-0" /> 5 AI Employees</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-stone-400 shrink-0" /> Custom integrations</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-stone-400 shrink-0" /> Dedicated success manager</li>
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}
