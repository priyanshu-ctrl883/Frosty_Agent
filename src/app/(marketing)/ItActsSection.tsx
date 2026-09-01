// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './FrostyPage.css';
import AnswersQualifiesFlow from './AnswersQualifiesFlow';
import BooksMeetingsFlow from './BooksMeetingsFlow';
import ProposalsQuotesFlow from './ProposalsQuotesFlow';
import CapturesLeadFlow from './CapturesLeadFlow';
import HandsOffFlow from './HandsOffFlow';
import { MessageSquare, Calendar, FileText, TrendingUp, Headphones, Brain, Check } from 'lucide-react';

const ACTS = [
    {
        icon: MessageSquare,
        h: "Answers & qualifies", 
        p: "Understands the question and asks the right ones back.",
        q: "Do you work with clinics like ours?", 
        via: "Website", 
        out: "Intent understood · tagged WARM", 
        c: "act-purple"
    },
    {
        icon: Calendar, 
        h: "Books meetings", 
        p: "Drops a slot straight onto your team's calendar.",
        q: "Can someone walk me through it this week?", 
        via: "WA", 
        out: "Meeting booked · Thu 4:30 PM", 
        c: "act-blue"
    },
    {
        icon: FileText, 
        h: "Sends proposals & quotes", 
        p: "Shares the right document at the right moment.",
        q: "Send me pricing for 50 seats.", 
        via: "Website", 
        out: "Quotation #218 sent on WA", 
        c: "act-orange"
    },
    {
        icon: TrendingUp, 
        h: "Captures the lead", 
        p: "Pulls contact and intent from a natural chat.",
        q: "I'm interested - here's my number.", 
        via: "WA", 
        out: "Lead saved · synced to your CRM", 
        c: "act-green"
    },
    {
        icon: Headphones, 
        h: "Hands off to a human", 
        p: "Escalates to your team with the full history.",
        q: "I'd rather speak to a person.", 
        via: "Website", 
        out: "Live chat handed to your team", 
        c: "act-rose"
    }
];

function ActsDiagram({ active, onSelect, setHeld }: { active: number, onSelect: (i: number) => void, setHeld: (h: boolean) => void }) {
    const [paths, setPaths] = useState<string[]>([]);
    const [feed, setFeed] = useState("");
    const wrap = useRef<HTMLDivElement>(null), core = useRef<HTMLDivElement>(null), tilt = useRef<HTMLDivElement>(null), enq = useRef<HTMLDivElement>(null);
    const nodes = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        const el = wrap.current; if (!el) return;
        const curve = (x1: number, y1: number, x2: number, y2: number) => {
            const m = (x1 + x2) / 2;
            return `M${x1.toFixed(1)},${y1.toFixed(1)} C${m.toFixed(1)},${y1.toFixed(1)} ${m.toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
        };
        const measure = () => {
            const w = el.getBoundingClientRect(), c = core.current?.getBoundingClientRect();
            if (!c) return;
            const cx = c.left - w.left + c.width / 2, cy = c.top - w.top + c.height / 2;
            const e = enq.current?.getBoundingClientRect();
            setFeed(e ? curve(e.right - w.left, e.top - w.top + e.height / 2, cx, cy) : "");
            setPaths(nodes.current.map((n) => {
                if (!n) return "";
                const r = n.getBoundingClientRect();
                return curve(cx, cy, r.left - w.left, r.top - w.top + r.height / 2);
            }));
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const el = tilt.current; if (!el) return;
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            el.style.setProperty("--tx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
            el.style.setProperty("--ty", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        };
        const out = () => { el.style.setProperty("--tx", "0"); el.style.setProperty("--ty", "0"); };
        el.addEventListener("pointermove", move as EventListener);
        el.addEventListener("pointerleave", out as EventListener);
        return () => { el.removeEventListener("pointermove", move as EventListener); el.removeEventListener("pointerleave", out as EventListener); };
    }, []);

    const cur = ACTS[active];
    return (
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.7 }} className="fx-acts">
            <div className="fx-acts-3d" ref={tilt}>
                <div className="fx-acts-grid" ref={wrap}>
                    <svg className={`fx-acts-svg ${cur.c}`} aria-hidden="true">
                        {feed && <path className="fx-link on" d={feed} style={{ stroke: '#0396A6' }} />}
                        {paths.map((d, i) => d && <path key={i} className={"fx-link" + (i === active ? " on" : "")} d={d} />)}
                        {feed && <path className="fx-pulse" d={feed} pathLength="100" style={{ stroke: '#0396A6' }} />}
                        {paths[active] && <path className="fx-pulse lag" d={paths[active]} pathLength="100" />}
                    </svg>

                    <div className="fx-enq" ref={enq}>
                        <span className="lbl">Enquiry in</span>
                        <p>“{cur.q}”</p>
                        <span className="via">via {cur.via}</span>
                    </div>

                    <div className="fx-brain">
                        <div className="node" ref={core}>
                            <Brain className="w-8 h-8 text-[#0396A6]" strokeWidth={1.75} />
                        </div>
                        <small>Reads intent</small>
                    </div>

                    <div className="fx-act-list">
                        {ACTS.map((a, i) => {
                            const IconComponent = a.icon;
                            return (
                                <button
                                    key={a.h}
                                    ref={(n) => { nodes.current[i] = n; }}
                                    className={`fx-act ${a.c}` + (i === active ? " on" : "")}
                                    aria-pressed={i === active}
                                    onClick={() => { onSelect(i); setHeld(true); }}
                                    onMouseEnter={() => { onSelect(i); setHeld(true); }}
                                    onMouseLeave={() => setHeld(false)}
                                    onFocus={() => { onSelect(i); setHeld(true); }}
                                    onBlur={() => setHeld(false)}
                                >
                                    <span className="ic">
                                        <IconComponent className="w-4 h-4" strokeWidth={1.75} />
                                    </span>
                                    <b>{a.h}</b>
                                    <span className="fx-sr">. {a.p} Example: “{a.q}” - {a.out}.</span>
                                    <span className="tick">
                                        <Check className="w-4 h-4" strokeWidth={2.5} />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

const ACTIVE_TAB_STYLES = [
  "border-[#0396A6] text-[#0396A6] bg-teal-50",
  "border-[#FF7A5E] text-[#FF7A5E] bg-sky-50",
  "border-[#D97706] text-[#D97706] bg-amber-50",
  "border-[#16A34A] text-[#16A34A] bg-green-50",
  "border-[#E11D48] text-[#E11D48] bg-rose-50",
];

const TAB_DOT_COLORS = [
  "bg-[#0396A6]",
  "bg-[#FF7A5E]",
  "bg-[#D97706]",
  "bg-[#16A34A]",
  "bg-[#E11D48]",
];

function MobileTabs({ active, onSelect, setHeld }: { active: number; onSelect: (i: number) => void; setHeld: (h: boolean) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeBtn = container.children[active] as HTMLElement;
    if (!activeBtn) return;
    const scrollLeft = activeBtn.offsetLeft - container.offsetWidth / 2 + activeBtn.offsetWidth / 2;
    container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  }, [active]);

  return (
    <div className="w-full lg:hidden">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-2 pb-2 w-full snap-x scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {ACTS.map((a, i) => {
          const isActive = i === active;
          return (
            <button
              key={a.h}
              onClick={() => {
                onSelect(i);
                setHeld(true);
                setTimeout(() => setHeld(false), 8000);
              }}
              className={`snap-center flex-none flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold border transition-all duration-300 ${
                isActive
                  ? ACTIVE_TAB_STYLES[i]
                  : 'bg-white text-slate-600 border-slate-200 shadow-sm'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-none ${isActive ? TAB_DOT_COLORS[i] : 'bg-slate-300'}`} />
              <span className="whitespace-nowrap">{a.h}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FeatureShowcase() {
    const [active, setActive] = useState(0);
    const [held, setHeld] = useState(false);

    const handleComplete = () => {
        if (!held) {
            setActive(a => (a + 1) % 5);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16 xl:gap-24 mt-6 sm:mt-12 w-full max-w-[1520px] mx-auto">
            {/* Mobile: Tabs on top */}
            <MobileTabs active={active} onSelect={setActive} setHeld={setHeld} />

            {/* Desktop: Full diagram on left */}
            <div className="hidden lg:block lg:w-[45%] xl:w-[43%]"
              onMouseEnter={() => setHeld(true)}
              onMouseLeave={() => setHeld(false)}
            >
                <ActsDiagram active={active} onSelect={setActive} setHeld={setHeld} />
            </div>

            {/* Flow Animations — full original size, shifted right */}
            <div className="w-full lg:w-[50%] xl:w-[52%] flex items-center justify-center lg:justify-end lg:translate-x-6 xl:translate-x-10">
                <div className="w-full max-w-[500px] lg:max-w-none aspect-square lg:aspect-auto lg:min-h-[460px] flex items-center justify-center">
                    {active === 0 && <AnswersQualifiesFlow onComplete={handleComplete} />}
                    {active === 1 && <BooksMeetingsFlow onComplete={handleComplete} />}
                    {active === 2 && <ProposalsQuotesFlow onComplete={handleComplete} />}
                    {active === 3 && <CapturesLeadFlow onComplete={handleComplete} />}
                    {active === 4 && <HandsOffFlow onComplete={handleComplete} />}
                </div>
            </div>
        </div>
    );
}

export default function ItActsSection() {
    return (
        <section className="relative pt-4 sm:pt-8 pb-8 sm:pb-12 lg:pb-14 overflow-hidden bg-transparent" id="how">
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 relative z-10">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.7 }} className="text-center mx-auto flex flex-col items-center" style={{ maxWidth: 640 }}>
                    <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#0396A6] flex items-center mb-3 sm:mb-4">Not a chatbot</span>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#0F172A] leading-[1.15] tracking-tight mb-3 sm:mb-6">
                        It doesn&apos;t just chat. <span className="text-[#0396A6] font-bold">It acts.</span>
                    </h2>
                    <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl px-2 sm:px-0">
                        Rule-based bots frustrate people with scripts. Frosty understands intent and takes the next step on its own.
                    </p>
                </motion.div>
                <FeatureShowcase />
            </div>
        </section>
    );
}
