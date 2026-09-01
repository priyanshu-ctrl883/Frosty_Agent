'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ShieldCheck,
    Lock,
    Zap,
    Users,
    Sparkles,
    Info,
    Check,
    ArrowRight,
    MessageCircle,
    BadgePercent,
    Mic,
    History,
    FileCheck2,
    Languages,
    ShoppingBag,
    Bot,
    ChevronDown,
    Building2,
    HelpCircle,
    CheckCircle2,
    PlusCircle,
    Globe
} from 'lucide-react';

import {
    Region,
    PlanFamily,
    CoreBillingTerm,
    CommerceBillingTerm,
    BillingTerm,
    PlanDetails,
    TierPricing,
    PricingCSVBundle,
    DEFAULT_PRICING_CSV_BUNDLE,
    getComputedPlans,
    getComputedAddons
} from '@/lib/pricingEngine';
import type { DbPricingCatalog } from '@/lib/planCatalogFromApi';

/* ─── Conversation Info Tooltip ─── */
function ConversationInfoTooltip({ align = 'right' }: { align?: 'left' | 'center' | 'right' }) {
    const [open, setOpen] = useState(false);
    return (
        <div
            className="relative inline-flex items-center normal-case font-normal tracking-normal text-slate-700"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
                className="p-0.5 rounded-full text-[#0396A6] hover:text-[#027A87] hover:bg-[#0396A6]/10 transition-colors cursor-pointer focus:outline-none"
                aria-label="What counts as a conversation?"
            >
                <Info className="w-3.5 h-3.5 text-[#0396A6]" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute top-full mt-2 w-[265px] sm:w-[280px] p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-[0_12px_32px_rgba(0,0,0,0.14)] z-50 text-left pointer-events-auto normal-case font-normal tracking-normal ${align === 'left'
                                ? 'right-[-25px] sm:right-[-32px] md:right-[-38px]'
                                : align === 'center'
                                    ? 'right-[-10px] sm:right-[-18px]'
                                    : 'right-0'
                            }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0396A6] mb-2 pb-1.5 border-b border-slate-100 normal-case tracking-normal">
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            <span>What counts as a conversation?</span>
                        </div>
                        <ul className="space-y-2 text-[11px] text-slate-600 font-normal leading-relaxed normal-case tracking-normal">
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0396A6] mt-1.5 shrink-0" />
                                <span className="normal-case">
                                    <strong className="text-slate-900 font-semibold">1 Conversation = Up to 12 replies</strong> from the Frosty agent. A 13th reply automatically starts a new conversation.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0396A6] mt-1.5 shrink-0" />
                                <span className="normal-case">
                                    <strong className="text-slate-900 font-semibold">Customer messages are unlimited and never counted.</strong> Only the agent&apos;s outgoing responses count toward your monthly allowance.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                <span className="normal-case">
                                    Unused conversation allowances do not roll over between billing cycles.
                                </span>
                            </li>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Guarantee Info Tooltip ─── */
function GuaranteeInfoTooltip() {
    const [open, setOpen] = useState(false);
    return (
        <div 
            className="relative inline-flex items-center normal-case font-normal tracking-normal text-slate-700" 
            onMouseEnter={() => setOpen(true)} 
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
                className="p-1 rounded-full text-[#0396A6] hover:text-[#027A87] hover:bg-[#0396A6]/10 transition-colors cursor-pointer focus:outline-none inline-flex items-center justify-center"
                aria-label="View Full Guarantee Terms & FAQ"
            >
                <Info className="w-4 h-4 text-[#0396A6]" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 right-0 sm:right-auto sm:left-0 w-[290px] sm:w-[350px] max-w-[calc(100vw-2.5rem)] p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-[0_16px_36px_rgba(0,0,0,0.16)] z-50 text-left pointer-events-auto normal-case font-normal tracking-normal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0396A6] mb-2 pb-1.5 border-b border-slate-100 normal-case tracking-normal">
                            <ShieldCheck className="w-4 h-4 shrink-0 text-[#0396A6]" />
                            <span>Full Guarantee Terms & Policy</span>
                        </div>
                        <ul className="space-y-2 text-[11px] text-slate-600 font-normal leading-relaxed normal-case tracking-normal">
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0396A6] mt-1.5 shrink-0" />
                                <span className="normal-case">
                                    The 14 days start when the agent goes live (published and connected to at least one channel) or 14 days after payment, whichever comes first.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0396A6] mt-1.5 shrink-0" />
                                <span className="normal-case">
                                    Available once per customer, on a first purchase only. Not available on renewals or upgrades.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                <span className="normal-case">
                                    Monthly plans do not need it — cancel anytime and the plan simply ends at the close of the current monthly billing period.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                <span className="normal-case">
                                    Refunds are processed to the original payment method, typically within 5–7 business days.
                                </span>
                            </li>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Launch Rate Badge with Interactive Tooltip ─── */
function LaunchRateBadge({ size = 'normal' }: { size?: 'normal' | 'small' }) {
    const [open, setOpen] = useState(false);
    return (
        <div
            className="relative inline-flex items-center shrink-0"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <span
                className={`inline-flex items-center font-bold bg-[#0396A6]/10 text-[#0396A6] border border-[#0396A6]/20 tracking-tight rounded-full cursor-default select-none transition-all duration-150 hover:bg-[#0396A6]/15 hover:border-[#0396A6]/35 whitespace-nowrap ${
                    size === 'small'
                        ? 'px-2 py-0.5 text-[10px]'
                        : 'px-2.5 py-0.5 text-[10.5px] sm:text-[11px] shadow-2xs'
                }`}
            >
                Launch rate
            </span>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 2, scale: 0.95 }}
                        transition={{ duration: 0.14, ease: 'easeOut' }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-xl bg-white text-slate-800 text-[11px] font-semibold whitespace-nowrap shadow-[0_10px_25px_rgba(0,0,0,0.12)] border border-slate-200/90 z-50 pointer-events-none flex items-center gap-1.5 select-none"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-[#0396A6] shrink-0" />
                        <span className="text-slate-800 tracking-tight font-semibold">For only first 100 customers</span>
                        {/* White Caret pointing down */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-white border-r border-b border-slate-200/90 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Anchor / Strikethrough Price Calculation (X - 30% = P => X = P / 0.7) ─── */
function getOriginalStrikethroughPrice(priceStr: string): string {
    if (!priceStr) return '';
    const isRupee = priceStr.includes('₹');
    const isDollar = priceStr.includes('$');
    const cleanStr = priceStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    if (isNaN(num) || num <= 0) return '';

    // Formula: (x - 30% = price) => 0.7 * x = price => x = price / 0.7
    const orig = Math.round(num / 0.7);

    if (isRupee) {
        return `₹${orig.toLocaleString('en-IN')}`;
    }
    if (isDollar) {
        return `$${orig.toLocaleString('en-US')}`;
    }
    return `${orig}`;
}

export default function PricingSection() {
    const [region, setRegion] = useState<Region>('IN');
    const [planFamily, setPlanFamily] = useState<PlanFamily>('core');
    const [coreTerm, setCoreTerm] = useState<CoreBillingTerm>('annual');
    const [commerceTerm, setCommerceTerm] = useState<CommerceBillingTerm>('annual');
    const [showGuaranteeModal, setShowGuaranteeModal] = useState(false);

    // CSV fallback bundle; DB catalog preferred when /api/pricing-data returns source=db
    const [csvData, setCsvData] = useState<PricingCSVBundle>(DEFAULT_PRICING_CSV_BUNDLE);
    const [dbCatalog, setDbCatalog] = useState<DbPricingCatalog | null>(null);
    const [pricingSource, setPricingSource] = useState<'db' | 'csv'>('csv');

    useEffect(() => {
        fetch('/api/pricing-data')
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
                if (data?.source === 'db' && data.catalog) {
                    setDbCatalog(data.catalog as DbPricingCatalog);
                    setPricingSource('db');
                } else if (data && data.plans && data.addons) {
                    setCsvData(data);
                    setPricingSource('csv');
                }
                if (data?.addons) {
                    setCsvData((prev) => ({
                        plans: prev.plans,
                        discounts: data.discounts ?? prev.discounts,
                        addons: data.addons,
                    }));
                }
                if (data?.country) {
                    setRegion(data.country.toUpperCase() === 'IN' ? 'IN' : 'INTL');
                }
            })
            .catch(() => {
                // DEFAULT_PRICING_CSV_BUNDLE is already loaded — silent fallback is fine
            });
    }, []);

    // Multi-tier Geo-Lock Detection
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const queryGeo = params.get('geo')?.toLowerCase() || params.get('region')?.toLowerCase() || params.get('country')?.toLowerCase();
                if (queryGeo === 'intl' || queryGeo === 'us' || queryGeo === 'global' || queryGeo === 'usd') {
                    setRegion('INTL');
                    return;
                }
                if (queryGeo === 'in' || queryGeo === 'india' || queryGeo === 'inr') {
                    setRegion('IN');
                    return;
                }
            }
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            const isIndianTimezone = tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('India');
            setRegion(isIndianTimezone ? 'IN' : 'INTL');

            // Tier 1: Primary ipapi.co
            fetch('https://ipapi.co/json/')
                .then(res => res.json())
                .then(data => {
                    if (data?.country_code) {
                        setRegion(data.country_code === 'IN' ? 'IN' : 'INTL');
                    }
                })
                .catch(() => {
                    // Tier 2: Fallback to ipwho.is
                    fetch('https://ipwho.is/')
                        .then(res => res.json())
                        .then(data => {
                            if (data?.country_code) {
                                setRegion(data.country_code === 'IN' ? 'IN' : 'INTL');
                            }
                        })
                        .catch(() => {
                            // Tier 3: Fallback to api.country.is
                            fetch('https://api.country.is/')
                                .then(res => res.json())
                                .then(data => {
                                    if (data?.country) {
                                        setRegion(data.country === 'IN' ? 'IN' : 'INTL');
                                    }
                                })
                                .catch(() => {});
                        });
                });
        } catch {
            setRegion('IN');
        }
    }, []);

    const plansCsv = csvData?.plans ?? '';
    const addonsCsv = csvData?.addons ?? '';

    const indiaCorePlans =
        dbCatalog?.IN.core ??
        (plansCsv ? getComputedPlans(plansCsv, 'IN', 'core') : []);
    const indiaCommercePlans =
        dbCatalog?.IN.commerce ??
        (plansCsv ? getComputedPlans(plansCsv, 'IN', 'commerce') : []);
    const intlCorePlans =
        dbCatalog?.INTL.core ??
        (plansCsv ? getComputedPlans(plansCsv, 'INTL', 'core') : []);
    const intlCommercePlans =
        dbCatalog?.INTL.commerce ??
        (plansCsv ? getComputedPlans(plansCsv, 'INTL', 'commerce') : []);

    const commerceAvailable =
        pricingSource !== 'db' ||
        indiaCommercePlans.length > 0 ||
        intlCommercePlans.length > 0;

    const rawAddons = addonsCsv ? getComputedAddons(addonsCsv, region) : [];
    const addonsData = rawAddons.map(addon => ({
        ...addon,
        icon:
            addon.id === 'seats' ? (
                <Users className="w-5 h-5 text-[#0396A6]" />
            ) : addon.id === 'website' ? (
                <Globe className="w-5 h-5 text-[#0396A6]" />
            ) : addon.id === 'whatsapp' ? (
                <img loading="lazy" decoding="async" src="/whatsapp.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
            ) : (
                <Sparkles className="w-5 h-5 text-[#0396A6]" />
            )
    }));

    const currentPlans =
        planFamily === 'core'
            ? region === 'IN'
                ? indiaCorePlans
                : intlCorePlans
            : region === 'IN'
                ? indiaCommercePlans
                : intlCommercePlans;

    const currentTerm: BillingTerm = planFamily === 'core' ? coreTerm : commerceTerm;

    const universalFeatures = [
        {
            icon: <Lock className="w-5 h-5 text-[#0396A6]" />,
            title: 'Strict Factual Grounding',
            desc: 'Answers strictly grounded in your verified content. Invented prices, phone numbers, and false promises are removed before the customer sees them.'
        },
        {
            icon: <MessageCircle className="w-5 h-5 text-[#0396A6]" />,
            title: 'One Shared Memory',
            desc: 'Continuous shared customer memory across Website and WhatsApp — conversations pick up with zero lost context.'
        },
        {
            icon: <ShieldCheck className="w-5 h-5 text-[#0396A6]" />,
            title: 'Approval Gates',
            desc: 'Human-in-the-loop review gates for bookings, custom quotations, and high-value workflows before customer dispatch.'
        },
        {
            icon: <History className="w-5 h-5 text-[#0396A6]" />,
            title: 'Agent Versioning & Rollback',
            desc: 'Full agent versioning history with instant one-click rollback for system prompts, knowledge documents, and tools.'
        },
        {
            icon: <FileCheck2 className="w-5 h-5 text-[#0396A6]" />,
            title: 'GST Quotations as PDF',
            desc: 'Instantly build verified quotes with GST calculations and render downloadable branded PDFs directly in the chat.'
        },
        {
            icon: <Mic className="w-5 h-5 text-[#0396A6]" />,
            title: 'WhatsApp Voice Notes',
            desc: 'Transcribes, parses intent, and responds naturally to WhatsApp audio voice notes in real-time.'
        },
        {
            icon: <Users className="w-5 h-5 text-[#0396A6]" />,
            title: 'RBAC & Audit Trails',
            desc: 'Granular role permissions, complete message audit logs, and security controls for enterprise compliance.'
        },
        {
            icon: <Languages className="w-5 h-5 text-[#0396A6]" />,
            title: 'Multilingual Intelligence',
            desc: 'English, 10 Indian regional languages, and 6 global languages. Frosty responds in the exact dialect the customer writes.'
        },
        {
            icon: <Zap className="w-5 h-5 text-[#0396A6]" />,
            title: 'Lead Re-engagement & Routing',
            desc: 'Proactively re-engages quiet leads, logs knowledge gaps, and routes conversations with AI/Human fallback rules.'
        }
    ];

    return (
        <section className="relative w-full overflow-hidden pt-8 sm:pt-10 lg:pt-12 pb-14 sm:pb-16 bg-transparent" id="pricing">
            <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0396A6]/[0.08] border border-[#0396A6]/20 mb-4 backdrop-blur-sm shadow-xs"
                    >
                        <span className="w-4 h-4 rounded-full bg-[#0396A6]/20 flex items-center justify-center">
                            <Sparkles className="w-2.5 h-2.5 text-[#0396A6]" />
                        </span>
                        <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#0396A6]">
                            TRANSPARENT, VOLUME-BASED PRICING
                        </span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#0F172A] leading-[1.15] tracking-tight m-0 mb-3"
                    >
                        Every plan includes every feature.
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.05 }}
                        className="text-slate-600 font-normal text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed m-0 mb-2"
                    >
                        Plans differ on conversation volume, seats and support only.
                    </motion.p>

                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mt-1 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>No setup fee, no onboarding fee, no implementation fee — on any plan, in any market.</span>
                    </div>

                    {/* Plan Family Switcher (Structured 3-column segmented bar on mobile, flex on desktop) */}
                    <div className="mt-8 flex justify-center w-full px-2 sm:px-0">
                        <div className={`grid ${commerceAvailable ? 'grid-cols-3' : 'grid-cols-2'} sm:flex p-1 sm:p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200 shadow-inner w-full sm:w-auto max-w-md sm:max-w-none gap-1`}>
                            <button
                                type="button"
                                onClick={() => setPlanFamily('core')}
                                className={`relative px-1.5 sm:px-6 py-2 sm:py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap ${planFamily === 'core'
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Bot className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${planFamily === 'core' ? 'text-[#0396A6]' : 'text-slate-400'}`} />
                                <span>Core<span className="hidden min-[380px]:inline"> Plans</span></span>
                            </button>

                            {commerceAvailable ? (
                            <button
                                type="button"
                                onClick={() => setPlanFamily('commerce')}
                                className={`relative px-1.5 sm:px-6 py-2 sm:py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap ${planFamily === 'commerce'
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <ShoppingBag className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${planFamily === 'commerce' ? 'text-[#0396A6]' : 'text-slate-400'}`} />
                                <span>Commerce<span className="hidden min-[380px]:inline"> Plans</span></span>
                                <span className="hidden lg:inline text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-50 text-[#0396A6] border border-teal-200/60">
                                    Store Sync
                                </span>
                            </button>
                            ) : null}

                            <button
                                type="button"
                                onClick={() => setPlanFamily('addons')}
                                className={`relative px-1.5 sm:px-6 py-2 sm:py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap ${planFamily === 'addons'
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <PlusCircle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${planFamily === 'addons' ? 'text-[#0396A6]' : 'text-slate-400'}`} />
                                <span>Add-ons<span className="hidden min-[410px]:inline"> & Extras</span></span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-medium">
                        {planFamily === 'core' ? (
                            <span>Full-featured agent for websites, WhatsApp, knowledge base, quotes & lead management.</span>
                        ) : planFamily === 'commerce' ? (
                            <span>
                                Live store integration: answers &ldquo;where is my order&rdquo;, tracks shipments & handles returns from live order data. (3-month min, no setup fee).
                            </span>
                        ) : (
                            <span>
                                Flexible add-ons to scale your team seats, WhatsApp channels, conversation capacity, and custom integrations.
                            </span>
                        )}
                    </div>

                    {/* Billing Term Switcher (Partitioned grid on mobile, snug inline-flex pill on desktop) */}
                    {planFamily !== 'addons' && (
                        <div className="mt-5 flex justify-center items-center w-full px-2 sm:px-0">
                            <div className="grid grid-cols-2 divide-x divide-y divide-slate-200/90 rounded-2xl sm:rounded-full bg-slate-100/90 border border-slate-200/90 overflow-hidden w-full max-w-sm sm:w-auto sm:max-w-none sm:inline-flex sm:divide-x-0 sm:divide-y-0 sm:p-1 sm:gap-0.5 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => (planFamily === 'core' ? setCoreTerm('annual') : setCommerceTerm('annual'))}
                                    className={`relative py-2.5 sm:py-1.5 px-2.5 sm:px-4 rounded-none sm:rounded-full text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${currentTerm === 'annual'
                                        ? 'bg-[#0396A6] !text-white shadow-sm font-bold'
                                        : 'text-slate-600 hover:text-slate-900 bg-slate-50/50 sm:bg-transparent'
                                        }`}
                                >
                                    <span>Annual</span>
                                    <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap ${currentTerm === 'annual' ? 'bg-white/20 !text-white' : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                        Save 20%
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => (planFamily === 'core' ? setCoreTerm('biannual') : setCommerceTerm('biannual'))}
                                    className={`relative py-2.5 sm:py-1.5 px-2.5 sm:px-4 rounded-none sm:rounded-full text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${currentTerm === 'biannual'
                                        ? 'bg-[#0396A6] !text-white shadow-sm font-bold'
                                        : 'text-slate-600 hover:text-slate-900 bg-slate-50/50 sm:bg-transparent'
                                        }`}
                                >
                                    <span>6 Months</span>
                                    <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap ${currentTerm === 'biannual' ? 'bg-white/20 !text-white' : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                        {planFamily === 'commerce' ? 'Save 10%' : 'Save 15%'}
                                    </span>
                                </button>

                                {planFamily === 'core' && (
                                    <button
                                        type="button"
                                        onClick={() => setCoreTerm('quarterly')}
                                        className={`relative py-2.5 sm:py-1.5 px-2.5 sm:px-4 rounded-none sm:rounded-full text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${currentTerm === 'quarterly'
                                            ? 'bg-[#0396A6] !text-white shadow-sm font-bold'
                                            : 'text-slate-600 hover:text-slate-900 bg-slate-50/50 sm:bg-transparent'
                                            }`}
                                    >
                                        <span>Quarterly</span>
                                        <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap ${currentTerm === 'quarterly' ? 'bg-white/20 !text-white' : 'bg-emerald-100 text-emerald-800'
                                            }`}>
                                            Save 5%
                                        </span>
                                    </button>
                                )}

                                {planFamily === 'core' && (
                                    <button
                                        type="button"
                                        onClick={() => setCoreTerm('monthly')}
                                        className={`relative py-2.5 sm:py-1.5 px-2.5 sm:px-4 rounded-none sm:rounded-full text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${currentTerm === 'monthly'
                                            ? 'bg-[#0396A6] !text-white shadow-sm font-bold'
                                            : 'text-slate-600 hover:text-slate-900 bg-slate-50/50 sm:bg-transparent'
                                            }`}
                                    >
                                        <span>Monthly</span>
                                    </button>
                                )}

                                {planFamily === 'commerce' && (
                                    <button
                                        type="button"
                                        onClick={() => setCommerceTerm('trimonthly')}
                                        className={`relative py-2.5 sm:py-1.5 px-2.5 sm:px-4 rounded-none sm:rounded-full text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer col-span-2 sm:col-span-1 whitespace-nowrap ${currentTerm === 'trimonthly'
                                            ? 'bg-[#0396A6] !text-white shadow-sm font-bold'
                                            : 'text-slate-600 hover:text-slate-900 bg-slate-50/50 sm:bg-transparent'
                                            }`}
                                    >
                                        <span>3 Months</span>
                                        <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap ${currentTerm === 'trimonthly' ? 'bg-white/20 !text-white' : 'bg-slate-200 text-slate-700'}`}>
                                            Min Term · List Price
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {planFamily === 'addons' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-4 xl:gap-5 items-stretch w-full">
                        {addonsData.map((addon, index) => (
                            <motion.div
                                key={addon.name}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.25 }}
                                whileHover={{ y: -5, transition: { duration: 0.18, ease: 'easeOut' } }}
                                className="relative flex flex-col rounded-[22px] p-5 lg:p-5 xl:p-6 h-full bg-white border border-slate-200/90 shadow-xs hover:border-[#0396A6]/40 hover:shadow-[0_8px_30px_rgba(3,150,166,0.08)] transition-all duration-200"
                            >
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="shrink-0 text-[#0396A6]">
                                            {addon.icon}
                                        </div>
                                        <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                            {addon.tag}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold tracking-tight text-[#0396A6] bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
                                        {addon.badge}
                                    </span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight mb-2 min-h-[48px] sm:min-h-[54px] flex items-center">
                                    {addon.name}
                                </h3>
                                <div className="w-full h-px bg-slate-100 mb-4" />
                                <div className="flex flex-col mb-3 min-h-[64px] justify-center">
                                    {addon.strikethroughPrice ? (
                                        <div className="flex items-center gap-1.5 mb-1 h-5">
                                            <span className="text-xs sm:text-sm font-semibold text-slate-400/80 line-through decoration-slate-400/80 tracking-tight decoration-[1.5px] select-none">
                                                {addon.strikethroughPrice}/mo
                                            </span>
                                            <span className="text-[10.5px] font-semibold text-slate-400/80 tracking-tight select-none">
                                                Standard rate
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="h-5 mb-1" />
                                    )}
                                    <div className="flex items-center justify-between gap-1.5 flex-nowrap">
                                        <div className="flex items-baseline gap-0.5 shrink-0">
                                            <span className="text-2xl sm:text-3xl xl:text-[32px] font-extrabold text-slate-900 tracking-tight leading-none">
                                                {addon.price}
                                            </span>
                                            {addon.price !== 'Custom' && addon.price && region === 'IN' && (
                                                <sup className="text-xs sm:text-sm font-bold text-slate-600 -top-2 sm:-top-2.5 select-none">*</sup>
                                            )}
                                            {addon.period && addon.price !== 'Custom' && (
                                                <span className="text-xs text-slate-500 font-medium ml-0.5">
                                                    {addon.period}
                                                </span>
                                            )}
                                        </div>
                                        {addon.showLaunchBadge && (
                                            <LaunchRateBadge size="small" />
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium mt-1 min-h-[16px]">
                                        {addon.billingNote}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed mb-4 min-h-[48px] sm:min-h-[52px]">
                                    {addon.desc}
                                </p>
                                <div className="my-2 flex flex-col gap-1.5 text-[11px] text-slate-600 flex-1">
                                    {addon.bullets.map((b, bi) => (
                                        <div key={bi} className="flex items-start gap-1.5">
                                            <Check className="w-3.5 h-3.5 text-[#0396A6] shrink-0 stroke-[2.5] mt-0.5" />
                                            <span>{b}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-auto pt-4 flex flex-col gap-2">
                                    <Link
                                        href={addon.ctaLink}
                                        className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-[13px] transition-all duration-200 flex items-center justify-center gap-1.5 text-center group cursor-pointer bg-stone-50 border border-slate-200 text-slate-800 hover:bg-[#0396A6] hover:!text-white hover:border-[#0396A6] active:scale-[0.98]"
                                    >
                                        <span className="transition-colors duration-200 group-hover:!text-white">{addon.cta}</span>
                                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:!text-white" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-4 xl:gap-5 items-stretch">
                        <AnimatePresence mode="wait">
                            {currentPlans.map((plan, index) => {
                                const currentPricing: TierPricing = plan.pricing[currentTerm] || plan.pricing['annual'] || Object.values(plan.pricing)[0] || {
                                    price: '',
                                    rawPrice: 0,
                                    period: '',
                                    billingNote: '',
                                    totalBilled: 0,
                                    strikethroughPrice: ''
                                };
                                return (
                                    <motion.div
                                        key={`${region}-${planFamily}-${plan.name}`}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ delay: index * 0.05, duration: 0.25 }}
                                        whileHover={{ y: -5, transition: { duration: 0.18, ease: 'easeOut' } }}
                                        className={`relative flex flex-col rounded-[22px] p-5 lg:p-4.5 xl:p-6 h-full transition-all duration-200 ${plan.highlighted
                                            ? 'bg-white border-2 border-[#0396A6] shadow-[0_8px_30px_rgba(3,150,166,0.12)] ring-1 ring-[#0396A6]/20'
                                            : 'bg-white border border-slate-200/90 shadow-xs hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                                                {plan.name}
                                            </h3>
                                            {currentPricing.savings ? (
                                                <span className="text-[10.5px] font-bold tracking-tight text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                                    <BadgePercent className="w-3 h-3 text-emerald-600" />
                                                    {currentPricing.savings}
                                                </span>
                                            ) : plan.highlighted ? (
                                                <span className="text-[10px] font-bold tracking-wider text-[#0396A6] bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full uppercase shrink-0">
                                                    Most Popular
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className={`w-full h-px mb-4 ${plan.highlighted ? 'bg-[#0396A6]/20' : 'bg-slate-100'}`} />
                                        <div className="flex flex-col min-h-[64px] justify-center mb-4">
                                            {plan.strikethroughPrice && (
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-sm sm:text-base font-semibold text-slate-400/80 line-through decoration-slate-400/80 tracking-tight decoration-[1.5px] select-none">
                                                        {plan.strikethroughPrice}/mo
                                                    </span>
                                                    <span className="text-xs sm:text-sm font-semibold text-slate-400/80 tracking-tight select-none">
                                                        Standard rate
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between gap-1 flex-nowrap">
                                                <div className="flex items-baseline gap-0.5 shrink-0">
                                                    <span className="text-3xl sm:text-[34px] lg:text-[30px] xl:text-[36px] font-extrabold text-slate-900 tracking-tight leading-none">
                                                        {currentPricing.price}
                                                    </span>
                                                    {region === 'IN' && (
                                                        <sup className="text-xs sm:text-sm font-bold text-slate-600 -top-2.5 sm:-top-3 select-none">*</sup>
                                                    )}
                                                    {currentPricing.period && (
                                                        <span className="text-xs sm:text-sm text-slate-500 font-medium ml-0.5">
                                                            {currentPricing.period}
                                                        </span>
                                                    )}
                                                </div>
                                                {plan.showLaunchBadge && (
                                                    <LaunchRateBadge size="small" />
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium mt-1">
                                                {currentPricing.billingNote}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 my-3 flex-1 text-xs text-slate-600">
                                            {/* 1. Monthly Conversations */}
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center justify-between gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                                                        <span>{plan.conversations.replace(' conversations', '')} monthly conversations included</span>
                                                    </div>
                                                    <ConversationInfoTooltip align={index === 0 ? 'left' : index === 3 ? 'right' : 'center'} />
                                                </div>
                                                <div className="pl-[22px] text-[11px] text-[#0396A6] font-medium">
                                                    Extra: {plan.overage.includes('extra conversation') ? plan.overage : `${plan.overage} / extra conversation`}
                                                </div>
                                            </div>

                                            {/* 2. Team Seats */}
                                            <div className="flex items-center gap-2">
                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                                                <span>{plan.seats.replace(' team seats', '')} team seats included</span>
                                            </div>

                                            {/* 3. Website Channel */}
                                            <div className="flex items-center gap-2">
                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                                                <span>{plan.webChannels || 1} website channel included</span>
                                            </div>

                                            {/* 4. WhatsApp Channel */}
                                            <div className="flex items-center gap-2">
                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                                                <span>
                                                    {plan.waChannels || 1} WhatsApp channel included
                                                    {region === 'INTL' && <span className="text-[10.5px] text-slate-500 font-normal ml-1">(Meta + 5%)</span>}
                                                </span>
                                            </div>

                                            {/* 5. All platform features included */}
                                            <div className="flex items-center gap-2">
                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                                                <span>All platform features included</span>
                                            </div>

                                            {/* 6. Zero setup or onboarding fees */}
                                            <div className="flex items-center gap-2">
                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                                                <span>Zero setup or onboarding fees</span>
                                            </div>

                                            {/* 7. 7-day free trial */}
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Sparkles className="w-3.5 h-3.5 text-[#0396A6] shrink-0" />
                                                <span>7-day free trial (up to 50 convos)</span>
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-2 flex flex-col gap-2">
                                            <Link
                                                href={plan.ctaLink}
                                                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-[13px] transition-all duration-200 flex items-center justify-center gap-1.5 text-center group cursor-pointer ${plan.highlighted
                                                    ? 'bg-[#0396A6] !text-white hover:!text-white hover:bg-[#027A87] shadow-sm hover:shadow-md active:scale-[0.98]'
                                                    : 'bg-stone-50 border border-slate-200 text-slate-800 hover:bg-white hover:border-[#0396A6]/40 hover:text-[#0396A6] active:scale-[0.98]'
                                                    }`}
                                            >
                                                <span className={plan.highlighted ? '!text-white' : ''}>{plan.cta}</span>
                                                <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 ${plan.highlighted ? '!text-white' : ''}`} />
                                            </Link>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {/* ── Pricing Disclaimer / Footnote Box (Compact & Centered) ── */}
                <div className="mt-6 flex justify-center w-full">
                    <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-teal-50/60 border border-teal-200/70 shadow-2xs text-center max-w-full">
                        <Sparkles className="w-4 h-4 text-[#0396A6] shrink-0" />
                        <p className="text-xs sm:text-[12.5px] text-slate-600 leading-normal m-0 font-normal">
                            {region === 'IN' ? (
                                <>
                                    All prices per month, in ₹, exclusive of applicable taxes. 18% GST will be charged on all plans.* Longer terms are billed in advance for the full term.
                                </>
                            ) : (
                                <>
                                    All prices per month, in USD. Longer terms are billed in advance for the full term.
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <div className="mt-6 p-6 sm:p-7 rounded-[22px] bg-white border border-slate-200/90 shadow-sm hover:border-[#0396A6]/40 transition-all duration-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-teal-50/40 to-transparent pointer-events-none" />
                    <div className="flex items-start gap-4 relative z-10">
                        <Building2 className="w-8 h-8 text-[#0396A6] shrink-0 mt-1" />
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0396A6]/10 border border-[#0396A6]/20 text-[10.5px] font-bold tracking-wider uppercase text-[#0396A6]">
                                    Enterprise Plan
                                </span>
                                <span className="text-xs font-semibold text-slate-500">
                                    Custom Volume · Dedicated Infrastructure · Custom SLA
                                </span>
                            </div>
                            <h4 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-1.5">
                                Need custom scale, bespoke integrations, or dedicated SLAs?
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl mb-3.5">
                                Everything in Max plus custom conversation volume, dedicated account manager, multi-region data residency, custom security reviews, and direct Slack/Teams engineer bridge.
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-800">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                                    Custom volume & rollover
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-800">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                                    99.9% Uptime SLA
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-800">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                                    Dedicated Account Manager
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-800">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                                    Custom Invoicing & PO
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0 w-full lg:w-auto relative z-10 flex flex-col sm:flex-row lg:flex-col gap-2.5 items-stretch sm:items-center lg:items-end">
                        <div className="text-left lg:text-right">
                            <span className="text-2xl font-bold text-slate-900 block">Custom</span>
                            <span className="text-xs text-slate-500 font-medium">Billed per agreement</span>
                        </div>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0396A6] hover:bg-[#027A87] !text-white hover:!text-white font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer text-center group"
                            style={{ color: '#FFFFFF' }}
                        >
                            <span className="!text-white text-white font-bold">Talk to Sales</span>
                            <ArrowRight className="w-4 h-4 !text-white text-white transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>


                {/* ── 14-Day Money-Back Guarantee Section ── */}
                <div className="mt-8 p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-teal-50/70 via-white to-slate-50 border border-teal-200/80 shadow-xs relative flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
                    <div className="max-w-3xl flex-1">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0396A6]/10 border border-[#0396A6]/20 mb-2.5">
                            <ShieldCheck className="w-4.5 h-4.5 text-[#0396A6]" />
                            <span className="text-xs sm:text-[13px] font-bold tracking-wider text-[#0396A6] uppercase">Risk-Free Purchase Guarantee</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                                14-day money-back guarantee
                            </h3>
                            <GuaranteeInfoTooltip />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            If Frosty isn&apos;t right for you, cancel within 14 days of going live and we&apos;ll refund what you&apos;ve paid.{' '}
                            <strong className="text-slate-900 font-semibold">
                                Your first 20% of the monthly conversation allowance is free
                            </strong>{' '}
                            — if you use more than that, we only charge for the conversations beyond it, at your plan&apos;s rate.
                        </p>

                        <p className="mt-3 text-xs text-slate-500">
                            Available on Quarterly, 6-Month, Annual, and all Commerce plans.
                        </p>
                    </div>

                    {/* Right Side: Apple/Google-Style 3D Guarantee Emblem Badge */}
                    <div className="shrink-0 flex flex-col items-center justify-center lg:pr-2">
                        <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            className="relative group cursor-pointer select-none"
                        >
                            <img loading="lazy" decoding="async" src="/guarantee_badge.png"
                                alt="14-Day Money-Back Guarantee Trust Seal"
                                className="relative w-36 h-36 sm:w-40 sm:h-40 xl:w-44 xl:h-44 object-contain transition-transform duration-300 group-hover:scale-105 pointer-events-none drop-shadow-[0_8px_24px_rgba(3,150,166,0.18)]"
                            />
                        </motion.div>
                    </div>
                </div>

                {/* ── Universal Platform Capabilities ── */}
                <div className="pt-12 sm:pt-14 border-t border-slate-200/80 mt-12">
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/60 mb-2.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#0396A6]" />
                            <span className="text-[10px] sm:text-[11px] font-bold tracking-widest text-[#0396A6] uppercase">
                                Full Product Included
                            </span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2.5">
                            Everything you need, included in every plan
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600">
                            We never lock or gate core capabilities behind enterprise paywalls. Every Frosty subscription unlocks the entire AI conversion engine from day one.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                        {universalFeatures.map((feat, idx) => (
                            <motion.div
                                key={feat.title}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.03, duration: 0.25 }}
                                whileHover={{ y: -4, scale: 1.015 }}
                                className="group relative p-4.5 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-[#0396A6]/50 hover:shadow-[0_12px_28px_-6px_rgba(3,150,166,0.12),0_4px_12px_rgba(0,0,0,0.03)] transition-all duration-300 flex flex-col cursor-pointer overflow-hidden"
                            >
                                {/* Subtle Hover Background Gradient Glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#0396A6]/[0.04] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                <div className="mb-2.5 text-[#0396A6] shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-0.5">
                                    {feat.icon}
                                </div>
                                <h4 className="text-[13.5px] font-bold text-slate-900 mb-1 transition-colors duration-200 group-hover:text-[#0396A6]">
                                    {feat.title}
                                </h4>
                                <p className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-600 transition-colors duration-200">
                                    {feat.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
