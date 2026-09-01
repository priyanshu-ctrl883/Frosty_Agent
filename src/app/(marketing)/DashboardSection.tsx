// @ts-nocheck
'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useTransform } from 'framer-motion';
import { MessageCircle, Tags, FileText, Headset, BarChart3, SlidersHorizontal } from 'lucide-react';
import { FrostyAgentMark } from '@/components/FrostyAgentMark';
import './FrostyPage.css';

function Icon({ n }: { n: string }) {
    const p: Record<string, React.ReactNode> = {
        layers: <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" />,
        plug: <path d="M9 3v6M15 3v6M7 9h10v3a5 5 0 01-10 0V9zM12 17v4" />,
        doc: <path d="M7 3h7l4 4v14H7V3zM14 3v4h4M9 12h7M9 16h7" />,
        chart: <path d="M4 20V4M4 20h16M8 16l3-4 3 2 4-6" />,
        infinity: <path d="M6 9a3 3 0 100 6c2 0 3-2 6-3s4-3 6-3a3 3 0 110 6c-2 0-3-2-6-3S8 9 6 9z" />,
        bank: <path d="M3.4 9.6L12 4.8l8.6 4.8M5.6 10.4v7.8M9.8 10.4v7.8M14.2 10.4v7.8M18.4 10.4v7.8M3 19.4h18" />,
        model: <path d="M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v10M7 12h10M8.5 8.5l7 7M15.5 8.5l-7 7" />,
    };
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p[n]}</svg>;
}

const DX_NAV = [["layers", "Overview"], ["plug", "Services"], ["doc", "Knowledge Base"],
["chart", "Analytics"], ["infinity", "Integrations"], ["bank", "Billing"], ["model", "Settings"]];
const DX_TABS = ["Analytics", "Conversations", "AI identity"];
const DX_ACTIVE = [3, 1, 1];
const DX_STATS = [["CONVERSATIONS", "214", "sessions"], ["MESSAGES", "1,480", "exchanged"],
["LEADS", "96", "captured"], ["CONVERSION", "45%", "lead rate"],
["AVG/SESSION", "6.9", "messages"], ["PEAK HOUR", "7pm", "Tue busiest"]];
const DX_TOPICS: [string, number, string][] = [["Pricing", 11, "#0396A6"], ["Delivery", 9, "#0396A6"], ["Booking", 6, "#FFB09F"],
["Sizing", 6, "#2DD4BF"], ["Warranty", 5, "#5EEAD4"], ["Other", 3, "#99F6E4"]];
const DX_SESSIONS = [["A7", "Visitor #a7f2", "Could you share your email so we can stay in touch?", "03:19 PM"],
["4C", "Visitor #4c1a", "Do you deliver to Pune?", "02:59 PM"],
["9B", "Visitor #9be3", "What is included in the package?", "01:06 PM"],
["2D", "Visitor #2dd8", "Can I speak to someone today?", "11:30 AM"]];

function DashboardPreview({ scrollTab }: { scrollTab?: number }) {
    const [internalTab, setInternalTab] = useState(0);
    const tab = scrollTab !== undefined ? scrollTab : internalTab;
    const setTab = (v: number) => { if (scrollTab === undefined) setInternalTab(v); };
    const onKey = (e: React.KeyboardEvent) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        setTab((tab + (e.key === "ArrowRight" ? 1 : DX_TABS.length - 1)) % DX_TABS.length);
    };
    const C = 2 * Math.PI * 32, total = DX_TOPICS.reduce((s, t) => s + (t[1] as number), 0);
    let acc = 0;

    return (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.7 }} className="fx-dxwrap" style={{ filter: 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.4))' }}>
            <div className="fx-dashx" id="dxpanel" role="tabpanel" aria-labelledby={"dxt-" + tab} onKeyDown={onKey} tabIndex={0}>
                <aside className="fx-dx-side" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="fx-dx-brand"><FrostyAgentMark size={18} monochrome="#ffffff" /> Frosty</div>
                    <div className="fx-dx-ws">
                        <div className="lb">WORKSPACE</div>
                        <div className="nm">Northline Interiors</div>
                    </div>
                    <div className="fx-dx-nav">
                        {DX_NAV.map(([ic, label], i) => (
                            <span key={label} className={i === DX_ACTIVE[tab] ? "on" : ""}><Icon n={ic} /> {label}</span>
                        ))}
                    </div>
                    <div className="fx-dx-user"><i>YT</i><b>Your team</b></div>
                </aside>

                <div className="fx-dx-main" style={{ position: 'relative', overflow: 'hidden' }}>
                    <AnimatePresence mode="wait">
                    {tab === 0 && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -30, filter: 'blur(6px)' }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="fx-dx-h">Performance</div>
                            <div className="fx-dx-sub">Insights and metrics for your workspace.</div>
                            <div className="fx-dx-card" style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                <div className="fx-dx-pills"><b>7d</b><b>14d</b><b className="on">30d</b><b>90d</b></div>
                                <div className="fx-dx-btn">Export</div>
                            </div>
                            <div className="fx-dx-stats">
                                {DX_STATS.map(([l, n, s]) => (
                                    <div className="fx-dx-stat" key={l}><div className="lb">{l}</div><div className="n">{n}</div><div className="su">{s}</div></div>
                                ))}
                            </div>
                            <div className="fx-dx-2col">
                                <div className="fx-dx-card" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <div className="fx-dx-ct">Conversations &amp; messages</div>
                                    <svg viewBox="0 0 320 92" width="100%" height="92" preserveAspectRatio="none" aria-hidden="true">
                                        {[18, 42, 66].map((y) => <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
                                        <path d="M0,72 C42,44 72,24 112,31 C152,38 190,56 232,46 C262,39 292,25 320,20 L320,92 L0,92 Z" fill="rgba(3, 150, 166,0.15)" />
                                        <path d="M0,72 C42,44 72,24 112,31 C152,38 190,56 232,46 C262,39 292,25 320,20" fill="none" stroke="#0396A6" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                                        <path d="M0,84 C52,79 92,73 132,75 C182,77 222,69 262,65 C292,62 306,58 320,55" fill="none" stroke="#F59E0B" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                                    </svg>
                                    <div className="fx-dx-legend">
                                        <span><i style={{ background: "#0396A6" }} />Messages</span>
                                        <span><i style={{ background: "#F59E0B" }} />Conversations</span>
                                    </div>
                                </div>
                                <div className="fx-dx-card" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <div className="fx-dx-ct">Top topics</div>
                                    <svg viewBox="0 0 100 100" width="100%" height="104" aria-hidden="true">
                                        <g transform="rotate(-90 50 50)">
                                            {DX_TOPICS.map(([label, v, col]) => {
                                                const len = (C * (v as number)) / total, node = (
                                                    <circle key={label} cx="50" cy="50" r="32" fill="none" stroke={col as string} strokeWidth="13"
                                                        strokeDasharray={`${len.toFixed(2)} ${(C - len).toFixed(2)}`} strokeDashoffset={-acc.toFixed(2)} />
                                                );
                                                acc += len; return node;
                                            })}
                                        </g>
                                        <text x="50" y="48" textAnchor="middle" fontSize="15" fontFamily="Fraunces, serif" fill="#F8FAFC" fontWeight="600">{total}</text>
                                        <text x="50" y="59" textAnchor="middle" fontSize="6.5" fontFamily="Outfit, sans-serif" fill="#94A3B8">mentions</text>
                                    </svg>
                                    <div className="fx-dx-legend">
                                        {DX_TOPICS.slice(0, 4).map(([label, v, col]) => (
                                            <span key={label}><i style={{ background: col as string }} />{label} {v}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {tab === 1 && (
                        <motion.div
                            key="conversations"
                            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -30, filter: 'blur(6px)' }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                                <div><div className="fx-dx-h">Website console</div><div className="fx-dx-sub">Every session, web and WhatsApp, in one place.</div></div>
                                <div className="fx-dx-pills"><b className="on">Website</b><b>WhatsApp</b></div>
                            </div>
                            <div className="fx-dx-split">
                                <div>
                                    {DX_SESSIONS.map(([av, who, what, when], i) => (
                                        <div className={"fx-dx-sess" + (i === 0 ? " on" : "")} key={who}>
                                            <i>{av}</i>
                                            <div className="w"><b>{who}</b><span>{what}</span></div>
                                            <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--d-mut)", flex: "none" }}>{when}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="fx-dx-card" style={{ display: "flex", flexDirection: "column", background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                                        <span className="fx-dx-btn" style={{ background: "transparent", color: "var(--d-mut)", border: "1px solid var(--d-line)" }}>Lead</span>
                                        <span className="fx-dx-btn" style={{ background: "#0396A6", borderColor: "#0396A6", color: "white" }}>Insights</span>
                                        <span className="fx-dx-btn">AI mode</span>
                                    </div>
                                    <div className="fx-dx-bub u" style={{ background: '#1E293B' }}>hi</div>
                                    <div className="fx-dx-bub b" style={{ background: '#0396A6' }}>Hi there - happy to help. What should I call you?</div>
                                    <div className="fx-dx-bub u" style={{ background: '#1E293B' }}>Ravi</div>
                                    <div className="fx-dx-bub b" style={{ background: '#0396A6' }}>Great to meet you, Ravi. Could you share your email so we can stay in touch about our services?</div>
                                    <div className="fx-dx-input">Switch to human mode to reply manually…</div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {tab === 2 && (
                        <motion.div
                            key="identity"
                            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -30, filter: 'blur(6px)' }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="fx-dx-h">Define your AI identity.</div>
                            <div className="fx-dx-sub">Shape the personality, tone and knowledge of your agent. Synchronised across every channel.</div>
                            <div className="fx-dx-field">
                                <div className="lb">AGENT NAME</div>
                                <div className="val">Frosty</div>
                            </div>
                            <div className="fx-dx-field">
                                <div className="lb">CONVERSATIONAL TONE</div>
                                <div className="fx-dx-tones">
                                    <b className="on">PROFESSIONAL</b><b>FRIENDLY</b><b>CASUAL</b><b>FORMAL</b>
                                </div>
                            </div>
                            <div className="fx-dx-field">
                                <div className="lb">CORE INSTRUCTIONS</div>
                                <div className="fx-dx-area">You are the front desk for Northline Interiors. Answer from our catalogue and pricing, qualify budget and timeline, and book a design consultation when the fit is right…</div>
                            </div>
                            <div className="fx-dx-save">SAVE AI IDENTITY</div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

export default function DashboardSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState(0);
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

    useMotionValueEvent(scrollYProgress, "change", (v) => {
        // Only cycle tabs when in the "centered" phase (0.2 to 0.8)
        const tabProgress = Math.max(0, Math.min(1, (v - 0.2) / 0.6));
        const newTab = tabProgress < 0.33 ? 0 : tabProgress < 0.66 ? 1 : 2;
        setActiveTab(newTab);
    });

    // Left text remains visible and readable at all times while scrolling
    const textOpacity = 1;
    const textBlur = 'blur(0px)';
    const textX = '0px';

    // Dashboard right side animations (subtle scale and positioning so it doesn't collide with left text)
    const dashX = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], ['0%', '-2%', '-2%', '0%']);
    const dashScale = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [1, 1.03, 1.03, 1]);
    const dashFilter = useTransform(
        scrollYProgress, 
        [0, 0.15, 0.85, 1], 
        [
            'drop-shadow(0px 4px 10px rgba(0,0,0,0.2))', 
            'drop-shadow(0px 30px 80px rgba(0,0,0,0.6))', 
            'drop-shadow(0px 30px 80px rgba(0,0,0,0.6))', 
            'drop-shadow(0px 4px 10px rgba(0,0,0,0.2))'
        ]
    );

    return (
        <motion.section
            ref={sectionRef}
            id="dashboard"
            style={{ position: 'relative', height: '300vh', backgroundColor: '#020617', zIndex: 10 }}
        >
            <div style={{
                position: 'sticky',
                top: 0,
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
            }}>
                <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 xl:px-12 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8 w-full relative">
                        {/* Left Side (40%) */}
                        <motion.div 
                            className="w-full lg:w-[40%] flex flex-col justify-center items-start text-left lg:pr-4"
                            style={{ opacity: textOpacity, filter: textBlur, x: textX }}
                        >
                            <span className="text-[12.5px] font-semibold tracking-[0.16em] uppercase text-[#0396A6] flex items-center mb-4">Your command centre</span>
                            <h2 className="text-[40px] sm:text-[52px] lg:text-[64px] leading-[1.05] tracking-tight text-white mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                Every lead - and everything about it in one place.
                            </h2>
                            <p className="text-[17px] text-slate-400 leading-[1.6] mb-8">
                                Everything both agents do lands in one live dashboard, so your team works the hottest leads first without digging.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 w-full">
                                {[
                                    { icon: <MessageCircle className="w-5 h-5 text-[#0396A6]" />, title: 'All conversations stored', desc: 'Web and WhatsApp, old, new and live.' },
                                    { icon: <Tags className="w-5 h-5 text-[#0396A6]" />, title: 'Warm / hot tagging by intent', desc: 'To rules you control.' },
                                    { icon: <FileText className="w-5 h-5 text-[#0396A6]" />, title: 'Full activity log', desc: 'Meetings, proposals and quotes, per lead.' },
                                    { icon: <Headset className="w-5 h-5 text-[#0396A6]" />, title: 'One-click human takeover', desc: 'With full conversation history.' },
                                    { icon: <BarChart3 className="w-5 h-5 text-[#0396A6]" />, title: 'Analytics & CRM sync', desc: 'Track funnel drop-offs and seamlessly sync data.' },
                                    { icon: <SlidersHorizontal className="w-5 h-5 text-[#0396A6]" />, title: 'Tone & instructions you control', desc: 'Expertly tuned and monitored by our team.' },
                                ].map((f, i) => (
                                    <div key={i} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 border border-[rgba(255,255,255,0.08)] shadow-[0_2px_10px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_24px_-4px_rgba(3, 150, 166,0.15)] cursor-default group hover:-translate-y-0.5">
                                        <div className="shrink-0 mt-0.5 text-[#0396A6]">
                                            {f.icon}
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-[14.5px] font-bold text-slate-100 leading-tight">{f.title}</span>
                                            <span className="text-[13px] leading-snug text-slate-400 mt-1">{f.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                        
                        {/* Right Side (60%) - Scroll-animated dashboard */}
                        <motion.div
                            className="w-full lg:w-[60%] flex justify-end items-center origin-right pl-0"
                            style={{ x: dashX, scale: dashScale, filter: dashFilter }}
                        >
                            <DashboardPreview scrollTab={activeTab} />
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
