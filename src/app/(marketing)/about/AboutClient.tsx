'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Zap,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Building2,
  Globe,
  MapPin,
  ExternalLink,
  ArrowRight,
  ChevronRight,
  Database,
  Cpu,
  Layers,
  Bot,
  Users,
  MessageSquare,
  BarChart3,
  Flame,
  Lock,
  Workflow,
  Check,
  ArrowUpRight,
  Code2,
  Boxes,
  Activity,
  FileCheck,
  Lightbulb,
} from 'lucide-react';
import GlassNavbar from '@/components/GlassNavbar';
import FooterSection from '../FooterSection';
import { ParallaxStarfield } from '@/components/FrostyEngineHero';
import '../FrostyPage.css';

/* ─── Kinetic Typography Components ─── */

/**
 * KineticBlurHeading: Fluid, balanced kinetic heading reveal with subtle blur-to-focus slides
 */
function KineticBlurHeading({
  text,
  className = '',
  as = 'h2',
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'div';
  delay?: number;
}) {
  const words = text.split(' ');
  const Component = motion[as as keyof typeof motion] as any;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 14,
      filter: 'blur(6px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <Component
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-30px' }}
      className={`inline-flex flex-wrap items-center gap-x-[0.26em] gap-y-0.5 ${className}`}
    >
      {words.map((word, i) => (
        <motion.span key={i} variants={wordVariants} className="inline-block will-change-transform">
          {word}
        </motion.span>
      ))}
    </Component>
  );
}

/**
 * TypewriterUnderlined: Dynamic kinetic typewriter text that cycles through words with an animated cursor & underline
 */
function TypewriterUnderlined({
  words = ['Intelligent Systems', 'Autonomous Agents', 'Multi-Agent Swarms', 'Enterprise RAG', 'Zero Hallucinations'],
}: {
  words?: string[];
}) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const targetWord = words[currentWordIndex] || '';
    const typingSpeed = isDeleting ? 40 : 85;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < targetWord.length) {
          setCurrentText(targetWord.slice(0, currentText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(targetWord.slice(0, currentText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words]);

  return (
    <span className="relative inline-flex items-baseline text-[#0396A6] font-bold select-none">
      <span>
        {currentText}
        <span className="inline-block w-[2.5px] h-[0.8em] bg-[#0396A6] ml-1 align-middle rounded-full animate-pulse" />
      </span>
      <motion.span
        className="absolute -bottom-1 left-0 h-[2.5px] bg-gradient-to-r from-[#0396A6] via-[#26B3AA] to-transparent rounded-full"
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </span>
  );
}

/**
 * StopwatchStatCounter: Smooth stopwatch-style counter that counts up to the target value when scrolled into view
 */
function StopwatchStatCounter({
  targetValue,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.6,
}: {
  targetValue: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const [currentValue, setCurrentValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const spanRef = React.useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (spanRef.current) {
      observer.observe(spanRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp: number | null = null;
    const durationMs = duration * 1000;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / durationMs, 1);

      // Fast-to-settle stopwatch ease curve
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const val = targetValue * ease;

      setCurrentValue(val);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCurrentValue(targetValue);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [hasStarted, targetValue, duration]);

  return (
    <span ref={spanRef} className="tabular-nums inline-block font-bold">
      {prefix}
      {currentValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/* ─── Timeline Data ─── */
const TIMELINE_EVENTS = [
  {
    year: 'Feb 2026',
    badge: 'Foundation',
    title: 'Inception & Core Architecture',
    description: 'Conceived Frosty to solve high-velocity sales qualification with specialized multi-agent swarms.',
    icon: <Sparkles className="w-4 h-4 text-[#0396A6]" />,
  },
  {
    year: 'Q1 2026',
    badge: 'Core Engine',
    title: 'Autonomous Reasoning & RAG Mesh',
    description: 'Engineered sub-second contextual response engine with tenant-isolated data guardrails.',
    icon: <Workflow className="w-4 h-4 text-[#0396A6]" />,
  },
  {
    year: 'Present',
    badge: 'Active Building',
    title: 'Capability Expansion & Integrations',
    description: 'Actively extending omnichannel sync (WhatsApp, Web, CRM), dynamic scheduling, and smart lead routing.',
    icon: <Layers className="w-4 h-4 text-[#0396A6]" />,
  },
  {
    year: 'Next',
    badge: 'Upcoming',
    title: 'Private Beta & Pilot Program',
    description: 'Rolling out targeted pilot deployments with select enterprise partners to fine-tune conversation conversion.',
    icon: <Building2 className="w-4 h-4 text-[#0396A6]" />,
  },
  {
    year: 'Roadmap',
    badge: 'Future Horizon',
    title: 'Public Launch & Global Scale',
    description: 'General availability rollout, self-serve onboarding, voice agent workflows, and global cloud clusters.',
    icon: <Globe className="w-4 h-4 text-[#0396A6]" />,
  },
];

/* ─── Global Offices Data ─── */
const GLOBAL_OFFICES = [
  {
    city: 'Gurugram',
    country: 'India (Global HQ)',
    flag: '🇮🇳',
    address: '4th Floor, JMD Empire, 455, Golf Course Ext Rd, Sector 62',
    postal: 'Gurugram, Haryana 122102',
    phone: '+91 6399999955',
    tag: 'Global Engineering & AI Research HQ',
    mapLink: 'https://maps.google.com/?q=JMD+Empire+Sector+62+Gurugram',
  },
  {
    city: 'Austin',
    country: 'Texas, USA',
    flag: '🇺🇸',
    address: '701 Tillery Street, Unit 12-3227',
    postal: 'Austin, TX 78702',
    phone: '+1 (512) 888-FROST',
    tag: 'North America Enterprise Operations',
    mapLink: 'https://maps.google.com/?q=701+Tillery+Street+Austin+TX+78702',
  },
  {
    city: 'London',
    country: 'United Kingdom',
    flag: '🇬🇧',
    address: '24-26 Arcadia Avenue, Fin009/8701',
    postal: 'London N3 2JU',
    phone: '+44 20 7946 0912',
    tag: 'EMEA Client Success & Partnerships',
    mapLink: 'https://maps.google.com/?q=24-26+Arcadia+Avenue+London+N3+2JU',
  },
];

/* ─── Core Values Data ─── */
const CORE_VALUES = [
  {
    title: 'Uncompromising Accuracy',
    desc: 'Every response is strictly grounded in your verified business content. Zero guesswork, zero hallucinations.',
    icon: <Target className="w-5 h-5 text-[#0396A6]" />,
    accent: 'border-[#0396A6]/30',
    bg: 'bg-[#0396A6]/5',
  },
  {
    title: 'Client-Centric Autonomy',
    desc: 'We build agents engineered around real revenue outcomes—capturing leads, booking calls, and automating support.',
    icon: <Flame className="w-5 h-5 text-[#FF7A5E]" />,
    accent: 'border-[#FF7A5E]/30',
    bg: 'bg-[#FF7A5E]/5',
  },
  {
    title: 'Enterprise Security by Design',
    desc: 'ISO 27001, ISO 9001, GDPR, and HIPAA compliance built into every model tier with complete tenant data isolation.',
    icon: <ShieldCheck className="w-5 h-5 text-[#10B981]" />,
    accent: 'border-[#10B981]/30',
    bg: 'bg-[#10B981]/5',
  },
  {
    title: 'Continuous Evolution',
    desc: 'Neural learning loops adapt as your catalog, pricing, and business knowledge change, keeping your agent always updated.',
    icon: <Cpu className="w-5 h-5 text-[#027D8A]" />,
    accent: 'border-[#027D8A]/30',
    bg: 'bg-[#027D8A]/5',
  },
];

export default function AboutClient() {
  const [activeEngineTab, setActiveEngineTab] = useState<number>(0);

  const engineTabs = [
    {
      title: 'Multi-Agent Swarm',
      desc: 'Multiple specialized AI sub-agents working in parallel to verify facts, evaluate intent, and trigger live calendar or CRM actions.',
      icon: <Workflow className="w-4 h-4" />,
    },
    {
      title: 'Enterprise RAG Mesh',
      desc: 'Deterministic vector retrieval across website URLs, PDFs, and internal documents with sub-second retrieval latency.',
      icon: <Database className="w-4 h-4" />,
    },
    {
      title: 'Compliance Firewall',
      desc: 'Real-time PII scrubbing, guardrail filters, and tenant-isolated cryptographic memory meeting strict SOC 2 & ISO standards.',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      title: 'Unified Channel Sync',
      desc: 'Single shared memory mesh syncing conversations across Website widgets, WhatsApp Business API, and your CRM dashboard.',
      icon: <Globe className="w-4 h-4" />,
    },
  ];

  return (
    <div className="fx-root min-h-screen bg-[#FFFFFF] text-[#0A1A2F] selection:bg-[#0396A6]/15 selection:text-[#0396A6] relative overflow-hidden">
      {/* ── Ambient Background Depth ── */}
      <ParallaxStarfield />
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-[#0396A6]/8 via-[#0396A6]/3 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-[45%] right-[-10%] w-[450px] h-[450px] bg-[#FF7A5E]/4 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-[#0396A6]/6 blur-[110px] rounded-full" />
      </div>

      {/* ── Glass Navbar ── */}
      <GlassNavbar />

      <main className="pt-24 sm:pt-28 md:pt-36 pb-20">
        {/* ══════════════════════════════════════════════════════════════════
            HERO SECTION: REVOLUTIONIZING AI (Synchronized Typography & Gaps)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-5 flex flex-col items-center"
          >
            {/* Synchronized Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0396A6]/10 border border-[#0396A6]/20 text-[#0396A6] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0396A6] animate-pulse" />
              <Bot className="w-3.5 h-3.5 text-[#0396A6]" />
              <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase">
                FROSTREK ENTERPRISE AI
              </span>
            </div>

            {/* Harmonized Headline matching Landing Page hierarchy */}
            <div className="flex flex-col items-center max-w-4xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#0A1A2F] leading-[1.2] tracking-tight flex flex-col items-center text-center">
                <KineticBlurHeading
                  text="Architecting the Future"
                  as="span"
                  className="font-serif text-[#0A1A2F] text-center justify-center"
                />
                <span className="block font-serif italic text-slate-500 font-normal text-2xl sm:text-3xl md:text-4xl lg:text-5xl my-1 sm:my-2 text-center select-none">
                  of
                </span>
                <span className="block text-center">
                  <TypewriterUnderlined
                    words={[
                      'Intelligent Systems',
                      'Autonomous Swarms',
                      'Enterprise RAG',
                      'Zero Hallucinations',
                      'Multi-Channel AI',
                    ]}
                  />
                </span>
              </h1>
            </div>

            {/* Synchronized Paragraph copy with Frosty First */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed mt-6 sm:mt-8"
              style={{ marginTop: '24px' }}
            >
              Meet <strong>Frosty</strong>, our flagship multi-channel autonomous AI agent engineered by Frostrek to eliminate missed leads and operational bottlenecks with strict factual grounding, unified memory across Website & WhatsApp, and 24/7 instant conversions.
            </motion.p>

            {/* Action Buttons Synchronized with Landing Page Styles */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3.5 justify-center pt-2"
            >
              <button
                onClick={() => {
                  document.getElementById('the-vision')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs md:text-sm font-semibold text-white bg-[#0396A6] hover:bg-[#027D8A] shadow-md shadow-[#0396A6]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Discover Our Vision</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            STATS SECTION (Stopwatch Counter with Interactive Card Hover)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-20 md:mb-28">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5">
            {[
              {
                value: 99.4,
                prefix: '',
                suffix: '%',
                decimals: 1,
                label: 'Factual Accuracy',
                color: 'text-[#0396A6]',
              },
              {
                value: 20,
                prefix: '',
                suffix: '+',
                decimals: 0,
                label: 'Happy Clients',
                color: 'text-[#0A1A2F]',
              },
              {
                value: 100,
                prefix: '',
                suffix: 'k+',
                decimals: 0,
                label: 'Conversations Handled',
                color: 'text-[#FF7A5E]',
              },
              {
                value: 1.2,
                prefix: '< ',
                suffix: 's',
                decimals: 1,
                label: 'Avg Response Speed',
                color: 'text-[#027D8A]',
              },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -6, scale: 1.025 }}
                className="group relative p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-[#0396A6]/50 hover:shadow-[0_16px_36px_-8px_rgba(3,150,166,0.16),0_4px_12px_rgba(0,0,0,0.03)] text-center transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Subtle Hover Gradient Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0396A6]/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />

                <div className={`relative z-10 text-2xl sm:text-3xl md:text-4xl font-bold ${stat.color} tracking-tight transition-transform duration-300 group-hover:scale-105`}>
                  <StopwatchStatCounter
                    targetValue={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                    duration={1.6}
                  />
                </div>
                <div className="relative z-10 text-[11px] sm:text-xs font-semibold text-slate-500 group-hover:text-slate-700 mt-1.5 transition-colors duration-200">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1: THE INCEPTION OF FROSTY (REAL MERCHANT ORIGIN STORY)
        ══════════════════════════════════════════════════════════════════ */}
        <section id="the-vision" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-28 md:mb-36 scroll-mt-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-center">
            {/* Left Story */}
            <div className="md:col-span-7 flex flex-col items-start text-left">
              <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#0396A6] flex items-center mb-3.5 before:content-[''] before:inline-block before:w-[18px] before:h-[1.5px] before:bg-current before:opacity-45 before:mr-[8px]">
                WHY WE BUILT FROSTY
              </span>
              <KineticBlurHeading
                text="The Inception of Frosty"
                as="h2"
                className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#0A1A2F] leading-[1.15] tracking-tight text-left"
              />
              <div className="space-y-4 text-sm md:text-[15px] text-slate-600 leading-relaxed mt-6 sm:mt-7" style={{ marginTop: '24px' }}>
                <p>
                  Every single day, we saw the exact same painful scenario: high-intent buyers visiting a store, asking a question on WhatsApp or live chat, waiting hours for an answer, and leaving to buy from a competitor.
                </p>
                <p>
                  Merchants were waking up to missed revenue, while their support teams burned out answering the same repetitive questions about sizing, delivery times, and pricing. Rigid button-based bots frustrated customers, while generic AI models hallucinated false info and damaged brand trust.
                </p>
                <p className="font-medium text-[#0A1A2F]">
                  We built Frosty to bridge this gap: an autonomous agent that deeply understands your store's exact catalog and policies, responds in under one second without hallucinations, and converts chats into booked calls and sales 24/7.
                </p>
              </div>
            </div>

            {/* Right Clean Minimalist Card */}
            <div className="md:col-span-5 relative">
              <div className="p-6 sm:p-7 bg-white border border-slate-200/80 shadow-xs rounded-2xl space-y-5">
                <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-[#0396A6]/10 flex items-center justify-center text-[#0396A6] shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0A1A2F]">The Merchant Challenge</h3>
                    <p className="text-[11px] text-slate-400">Why speed & accuracy win</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A5E] shrink-0 mt-1.5" />
                    <div>
                      <strong className="text-slate-800 block mb-0.5">The Drop-off Problem</strong>
                      <span className="text-slate-500 leading-relaxed">78% of buyers purchase from whoever responds first. Delays kill conversion.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0396A6] shrink-0 mt-1.5" />
                    <div>
                      <strong className="text-slate-800 block mb-0.5">Zero Hallucinations</strong>
                      <span className="text-slate-500 leading-relaxed">Responses stay strictly factual to your products, URLs, and policy files.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#027D8A] shrink-0 mt-1.5" />
                    <div>
                      <strong className="text-slate-800 block mb-0.5">Instant Action</strong>
                      <span className="text-slate-500 leading-relaxed">Qualifies buyer intent and books meetings straight into your calendar.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2: FROSTY'S JOURNEY: VERTICAL TIMELINE
        ══════════════════════════════════════════════════════════════════ */}
        <section id="our-journey" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-28 md:mb-36 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-14 flex flex-col items-center">
            <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#0396A6] flex items-center justify-center mb-3.5 before:content-[''] before:inline-block before:w-[18px] before:h-[1.5px] before:bg-current before:opacity-45 before:mr-[8px] after:content-[''] after:inline-block after:w-[18px] after:h-[1.5px] after:bg-current after:opacity-45 after:ml-[8px]">
              PRODUCT EVOLUTION
            </span>
            <KineticBlurHeading
              text="Frosty's Journey"
              as="h2"
              className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#0A1A2F] leading-[1.15] tracking-tight justify-center text-center"
            />
            <p className="text-sm md:text-[15px] text-slate-600 leading-relaxed mt-6 sm:mt-7" style={{ marginTop: '24px' }}>
              From initial architecture in Feb 2026 to actively expanding autonomous sales agent capabilities.
            </p>
          </div>

          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-4 md:left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#0396A6]/0 via-[#0396A6]/35 to-[#0396A6]/0 md:-translate-x-1/2" />

            <div className="space-y-6 md:space-y-8 relative">
              {TIMELINE_EVENTS.map((event, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <motion.div
                    key={`${event.year}-${event.title}`}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: idx * 0.08 }}
                    className={`relative flex items-center gap-4 md:gap-8 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                      }`}
                  >
                    <div className="absolute left-4 md:left-1/2 w-3.5 h-3.5 rounded-full bg-[#0396A6] border-2 border-white shadow-xs z-10 md:-translate-x-1/2 -translate-x-[6px]" />

                    <div className={`ml-9 md:ml-0 flex-1 min-w-0 ${isEven ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left'}`}>
                      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-sm p-4 sm:p-5 transition-all">
                        <div className={`flex flex-col gap-1.5 ${isEven ? 'md:items-end' : 'md:items-start'}`}>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0396A6]/10 text-[#0396A6]">
                              {event.year}
                            </span>
                            {event.icon}
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-[#0A1A2F]">{event.title}</h3>
                          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{event.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:block flex-1 min-w-0" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3: ABOUT FROSTREK (THE COMPANY & STORY)
        ══════════════════════════════════════════════════════════════════ */}
        <section id="about-frostrek" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-28 md:mb-36 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Story */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#0396A6] flex items-center mb-3.5 before:content-[''] before:inline-block before:w-[18px] before:h-[1.5px] before:bg-current before:opacity-45 before:mr-[8px]">
                THE COMPANY
              </span>
              <KineticBlurHeading
                text="Accelerate growth at the new speed of business"
                as="h2"
                className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#0A1A2F] leading-[1.15] tracking-tight text-left"
              />
              <div className="space-y-4 text-slate-600 text-sm md:text-[15px] leading-relaxed mb-8 mt-6 sm:mt-7" style={{ marginTop: '24px' }}>
                <p>
                  Frostrek partners with organizations to build next-generation agentic solutions, automating complex
                  workflows with unmatched speed, accuracy, and security filters.
                </p>
                <p>
                  From high-throughput customer conversation engines like Frosty to custom enterprise model training, our
                  systems scale seamlessly on auto-scaling cloud clusters.
                </p>
              </div>

              {/* Verified Badges */}
              <div className="grid grid-cols-2 gap-3 w-full">
                {[
                  'ISO 27001 Certified',
                  'ISO 9001 Certified',
                  'SOC 2 Type II Architecture',
                  'GDPR & HIPAA Compliant',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-[#0396A6] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Innovation Interactive Tabs */}
            <div className="lg:col-span-6 p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <span className="text-xs font-bold text-[#0A1A2F] uppercase tracking-wider">Innovation Engine</span>
                <span className="text-[10px] font-bold text-[#0396A6] bg-[#0396A6]/10 px-2.5 py-0.5 rounded-full">
                  Architecture
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {engineTabs.map((tab, idx) => (
                  <button
                    key={tab.title}
                    onClick={() => setActiveEngineTab(idx)}
                    className={`p-3 rounded-xl text-left transition-all text-xs font-semibold flex items-center gap-2 ${activeEngineTab === idx
                      ? 'bg-[#0396A6] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    {tab.icon}
                    <span>{tab.title}</span>
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed min-h-[75px] flex items-center">
                {engineTabs[activeEngineTab]?.desc || ''}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            CORE VALUES
        ══════════════════════════════════════════════════════════════════ */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-28 md:mb-36">
          <div className="text-center max-w-2xl mx-auto mb-14 flex flex-col items-center">
            <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#0396A6] flex items-center justify-center mb-3.5 before:content-[''] before:inline-block before:w-[18px] before:h-[1.5px] before:bg-current before:opacity-45 before:mr-[8px] after:content-[''] after:inline-block after:w-[18px] after:h-[1.5px] after:bg-current after:opacity-45 after:ml-[8px]">
              PRINCIPLES
            </span>
            <KineticBlurHeading
              text="Core Values"
              as="h2"
              className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#0A1A2F] leading-[1.15] tracking-tight justify-center text-center"
            />
            <p className="text-sm md:text-[15px] text-slate-600 leading-relaxed mt-6 sm:mt-7" style={{ marginTop: '24px' }}>
              The foundational tenets guiding our research, product roadmap, and client partnerships.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {CORE_VALUES.map((val, idx) => (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -3 }}
                className={`p-5 rounded-2xl bg-white border ${val.accent} shadow-2xs hover:shadow-md transition-all flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl ${val.bg} flex items-center justify-center`}>{val.icon}</div>
                  <h4 className="text-sm sm:text-base font-bold text-[#0A1A2F]">{val.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{val.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            GLOBAL OFFICES
        ══════════════════════════════════════════════════════════════════ */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-28 md:mb-36">
          <div className="text-center max-w-2xl mx-auto mb-14 flex flex-col items-center">
            <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#0396A6] flex items-center justify-center mb-3.5 before:content-[''] before:inline-block before:w-[18px] before:h-[1.5px] before:bg-current before:opacity-45 before:mr-[8px] after:content-[''] after:inline-block after:w-[18px] after:h-[1.5px] after:bg-current after:opacity-45 after:ml-[8px]">
              FOOTPRINT
            </span>
            <KineticBlurHeading
              text="Our Global Offices"
              as="h2"
              className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#0A1A2F] leading-[1.15] tracking-tight justify-center text-center"
            />
            <p className="text-sm md:text-[15px] text-slate-600 leading-relaxed mt-6 sm:mt-7" style={{ marginTop: '24px' }}>
              Operating internationally with strategic engineering and client success hubs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {GLOBAL_OFFICES.map((office, idx) => (
              <motion.div
                key={office.city}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -3 }}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-[#0396A6]/40"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{office.flag}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {office.tag.includes('HQ') ? 'HQ' : 'Hub'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-[#0A1A2F]">{office.city}</h4>
                    <p className="text-xs font-semibold text-[#0396A6]">{office.country}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0396A6] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      {office.address}
                      <br />
                      {office.postal}
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <a
                    href={office.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0396A6] hover:text-[#027D8A] transition-colors"
                  >
                    View on Map <ArrowUpRight size={13} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            HIGH-CONVERSION CTA (Clean Light Theme Banner)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto my-6 md:my-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="py-8 sm:py-9 md:py-10 px-6 sm:px-8 md:px-12 rounded-2xl bg-white text-slate-900 shadow-sm border border-slate-200/90 flex flex-col items-center justify-center text-center relative overflow-hidden w-full"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#0396A6]/[0.05] rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FF7A5E]/[0.05] rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-3xl mx-auto w-full">
              <span
                className="text-[10px] font-bold uppercase tracking-widest bg-[#0396A6]/10 px-3 py-1 rounded-full border border-[#0396A6]/20 inline-block mb-3 text-center text-[#0396A6]"
              >
                GET STARTED
              </span>

              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold tracking-tight leading-snug mb-3 text-center text-slate-900 w-full"
              >
                Ready to deploy Frosty or build custom enterprise AI?
              </h2>

              <p
                className="text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed text-center text-slate-600 mt-2"
              >
                Start your free trial with Frosty in minutes, or schedule an enterprise architecture consultation with the Frostrek engineering team.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3.5 w-full mt-7 md:mt-8">
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-full font-semibold text-xs sm:text-sm bg-[#0396A6] hover:bg-[#027D8A] !text-white hover:!text-white shadow-sm hover:shadow-md shadow-[#0396A6]/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="!text-white">Start Free Trial with Frosty</span>
                  <ArrowRight size={14} className="!text-white" />
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3 rounded-full font-semibold text-xs sm:text-sm bg-slate-50 hover:bg-slate-100 hover:text-[#0396A6] text-slate-800 border border-slate-200/80 hover:border-[#0396A6]/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Book Enterprise Demo</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ── Global Footer ── */}
      <FooterSection />
    </div>
  );
}
