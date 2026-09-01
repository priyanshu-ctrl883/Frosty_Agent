'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Search, ArrowLeft } from 'lucide-react';
import FooterSection from '../FooterSection';
import { ParallaxStarfield } from '@/components/FrostyEngineHero';
import GlassNavbar from '@/components/GlassNavbar';
import '../FrostyPage.css';

const FAQ_GROUPS: [string, [string, string][]][] = [
    ["About Frosty", [
        ["What is Frosty?", "Frosty is an AI agent that talks to your website visitors and WhatsApp leads for you. It answers their questions in seconds, works out what they want, books meetings, and passes qualified leads to your team, day and night. Frostrek builds, trains, and runs it around your business, so you get a working agent without adding staff."],
        ["How is Frosty different from a basic automated chat?", "A basic automated chat follows a fixed script and gets stuck the moment a customer asks something it wasn't set up for. Frosty understands the actual question, replies in a natural way, and takes real steps like booking a call or sending a quote. It works more like a junior sales rep that never sleeps than a set of pre-written replies."],
        ["Can Frosty handle both my website and WhatsApp?", "Yes. Frosty runs on your website and on WhatsApp at the same time, using one shared memory. If someone starts a chat on your site and later messages you on WhatsApp, Frosty remembers the earlier conversation, so the customer never has to repeat themselves."],
        ["Can Frosty qualify leads and book meetings on its own?", "Yes. Frosty asks the right questions to understand budget, timeline, and intent, then tags each lead as warm or hot based on rules you set. When a lead is ready, it books a meeting straight into your calendar, sends a proposal or quote, and saves the contact details for your team to follow up."],
        ["Can Frosty handle customer support, not just lead generation?", "Yes. Frosty can handle around 90% of the everyday questions your customers ask, things like hours, pricing, availability, order and service queries, and how your process works. When something needs a person, it passes the conversation to your team, so support stays fast without your staff answering the same questions all day."],
        ["Does Frosty really work 24/7?", "Yes. Frosty answers the moment a message comes in, at any hour, including nights, weekends, and holidays. That matters because most buyers go with whoever replies first, and enquiries usually arrive long after your team has logged off."],
        ["Can't I just use ChatGPT for this?", "ChatGPT is a general tool that doesn't know your business, doesn't sit on your website and WhatsApp, and can't book a meeting or hand a lead to your team. Frosty is trained on your own content and runs on your channels, so it answers as your business and takes the next step for you. It's the difference between a general assistant and one built around how you actually sell."],
    ]],
    ["Setting it up", [
        ["Do I need a developer to set up Frosty?", "No. The Frostrek team sets Frosty up for you. We customize and train the agent around your business and deploy it on your website and WhatsApp, so there's nothing for you to build or code. You tell us about your services, and we handle the rest during onboarding."],
        ["How does Frosty learn about my business?", "The Frostrek team trains and customizes Frosty around your business, your services, and your rates. It also reads the content on your website to build its knowledge, and you can share PDFs or documents to add to what it knows. That's why its answers match what you actually offer instead of sounding generic."],
        ["How long does it take to get Frosty live?", "It usually takes anywhere from a few hours to a few days. The timeline depends on the size of your knowledge base and what you need Frosty to do, so a straightforward setup goes live quickly while custom requirements take a little longer. The Frostrek team confirms the timeline with you upfront."],
        ["Will Frosty answer in my brand's voice?", "Yes. The team sets the tone Frosty uses, and it answers from your own content, so it sounds like your business rather than a generic script. You stay in control of how it speaks and what it's allowed to say."],
        ["Does Frosty work with my existing website?", "Yes. Frosty can be added to most common website setups, and the Frostrek team handles the integration for you. Your customers get the same agent on your site and on WhatsApp, working from one shared knowledge base."],
        ["Which AI models does Frosty use?", "Frosty uses a multi-model approach. The Frostrek team picks the best available model for each type of task, so the right model handles the right kind of work behind the scenes. If you have a preference, the setup can be customized to your requirements."],
    ]],
    ["How it works day to day", [
        ["How does Frosty make sure its answers are accurate?", "Frosty answers from your own content rather than making things up, so it stays grounded in what you actually offer. When it isn't confident or a question needs a person, it hands the conversation to your team instead of guessing, and that question can be added to its knowledge for next time."],
        ["Where do my conversations and leads end up?", "Everything lands in one live dashboard. You can see every conversation across your website and WhatsApp, old and new, with leads sorted by intent and every action logged, from meetings booked to quotes sent. You also get analytics on response times and where leads drop off."],
        ["Can my whole team use Frosty and take over chats?", "Yes. Frosty runs on a shared dashboard that your whole team can log into. Any team member can step into a live conversation with one click and continue with the full history in front of them, and different people can handle different conversations at the same time. Frosty picks each one back up automatically once your team is done."],
        ["Does Frosty connect with my CRM, calendar, and email?", "Yes. Frosty syncs qualified leads and their full history into your CRM, and it works with Google Calendar for bookings, Gmail for follow-ups, and Slack for team alerts. It does more than reply, it acts through the tools you already use."],
        ["What languages can Frosty speak?", "Frosty is a multi-language agent. It replies in the language your customer writes in and picks up the language automatically during the chat, so you can help visitors from different regions with one agent."],
        ["Can Frosty answer phone calls too?", "Yes, through a separate voice agent. It answers inbound calls, qualifies the caller the same way the website and WhatsApp agents do, and books a callback when no one is free to pick up. Voice is offered as an add-on, so ask the Frosty team to include it."],
    ]],
    ["Trust and getting started", [
        ["Is my data safe with Frosty?", "Yes. Frostrek is ISO 27001 and ISO 9001 certified and GDPR-ready. Your content is used only to train your own agent, and Frosty is built and hosted end to end by Frostrek rather than pieced together from other people's tools."],
        ["Who maintains and updates Frosty after it goes live?", "The Frostrek team does. We keep Frosty running, update it as your business changes, and retrain it when you add new services or content. If something needs adjusting, you have a team to reach rather than a tool you're left to manage on your own."],
        ["What types of businesses is Frosty for?", "Frosty fits any business that gets enquiries and wants to answer them fast. That includes marketing agencies, real estate, clinics and healthcare, education and study-abroad consultancies, car dealers, financial services, and online stores. If your leads come in through a website or WhatsApp, Frosty can capture and qualify them."],
        ["How much does Frosty cost?", "Plans start at ₹19,999 per month for the enterprise-grade Frosty agent. Final pricing depends on how many conversations you handle and which features you need, so contact the Frosty team and they'll walk you through the options and quote for your business."],
        ["How can I see Frosty in action?", "Book a demo and the Frostrek team will set Frosty up on a sample of your own content, so you can watch it answer a real enquiry before you decide. You can reach the Frosty team through the Book a Demo button or on WhatsApp."],
    ]],
];

const FAQ_THEMES = [
    { border: 'border-[#0396A6]/30', cardBorder: 'border-[#0396A6]/35', bgActive: 'bg-[#0396A6]/[0.02]', text: 'text-[#0396A6]', numberBg: 'bg-[#0396A6]/10', activeBg: 'bg-[#0396A6]' },
    { border: 'border-[#10B981]/30', cardBorder: 'border-[#10B981]/35', bgActive: 'bg-[#10B981]/[0.02]', text: 'text-[#10B981]', numberBg: 'bg-[#10B981]/10', activeBg: 'bg-[#10B981]' },
    { border: 'border-[#EC4899]/30', cardBorder: 'border-[#EC4899]/35', bgActive: 'bg-[#EC4899]/[0.02]', text: 'text-[#EC4899]', numberBg: 'bg-[#EC4899]/10', activeBg: 'bg-[#EC4899]' },
    { border: 'border-[#F59E0B]/30', cardBorder: 'border-[#F59E0B]/35', bgActive: 'bg-[#F59E0B]/[0.02]', text: 'text-[#D97706]', numberBg: 'bg-[#F59E0B]/10', activeBg: 'bg-[#F59E0B]' },
    { border: 'border-[#FF7A5E]/30', cardBorder: 'border-[#FF7A5E]/35', bgActive: 'bg-[#FF7A5E]/[0.02]', text: 'text-[#FF7A5E]', numberBg: 'bg-[#FF7A5E]/10', activeBg: 'bg-[#FF7A5E]' },
];

export default function FaqClient() {
    const [searchQuery, setSearchQuery] = useState('');
    const [openFaq, setOpenFaq] = useState<string | null>(null);

    const filteredGroups = FAQ_GROUPS.map(([groupName, faqs]) => {
        const filteredFaqs = faqs.filter(([q, a]) =>
            q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return [groupName, filteredFaqs] as [string, [string, string][]];
    }).filter(([_, faqs]) => faqs.length > 0);

    return (
        <div className="frosty-root" style={{
            background: 'radial-gradient(circle 800px at 100% 0%, rgba(3, 150, 166, 0.035) 0%, rgba(245, 158, 11, 0.018) 30%, transparent 100%), #FFFFFF',
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
            color: '#18181B',
            overflowX: 'hidden',
            position: 'relative'
        }}>
            <ParallaxStarfield />

            <div className="relative z-10">
                {/* PREMIUM GLASSMORPHISM NAVBAR */}
                <GlassNavbar ready={true} />

                <main className="w-full flex flex-col relative z-10">
                    <section className="min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-6 relative pt-28 pb-20">
                        <Link href="/" className="absolute top-28 left-4 md:left-12 inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors w-fit">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Back to Home</span>
                        </Link>

                        <div className="flex flex-col items-center text-center max-w-3xl mx-auto w-full">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 mb-8">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#0396A6]" />
                                <span className="text-[10px] font-bold tracking-widest text-[#0396A6] uppercase">Help Center</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-stone-900">
                                Frequently Asked Questions
                            </h1>

                            <p className="text-stone-600 text-base md:text-lg max-w-2xl" style={{ marginTop: '24px', marginBottom: '32px' }}>
                                Everything you need to know about our AI solutions, security, pricing, and technical capabilities.
                            </p>

                            <div className="relative w-full max-w-xl mx-auto">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-stone-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-12 pr-6 py-4 bg-white border border-stone-200 rounded-2xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0396A6]/30 focus:border-[#0396A6] transition-all shadow-sm text-base"
                                    placeholder="Search for answers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex flex-col gap-24 lg:gap-32 w-full pt-12 px-4 sm:px-6 md:px-8 lg:px-12 max-w-[1600px] mx-auto pb-32">
                        {filteredGroups.map(([group, qs], gIdx) => {
                            const isEven = gIdx % 2 === 1;
                            const imageNames = ["faq_about.png", "faq_setup.png", "faq_daily.png", "faq_trust.png"];

                            return (
                                <div key={group} className={`flex flex-col md:flex-row items-center gap-12 lg:gap-20 w-full ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                    {/* Image Side */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: false, margin: "-100px" }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="w-full md:w-[50%] relative group flex justify-center items-center"
                                    >
                                        <div className="relative w-full max-w-md aspect-[4/5] rounded-[2rem] overflow-hidden bg-stone-100 border border-stone-200 shadow-md group-hover:border-[#0396A6]/40 transition-all duration-500">
                                            <img loading="lazy" decoding="async" src={`/images/${imageNames[gIdx % 4]}`}
                                                alt={group}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 block"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                    </motion.div>

                                    {/* FAQ Side */}
                                    <div className="w-full md:w-[50%] flex flex-col">
                                        <motion.h3
                                            initial={{ opacity: 0, x: -30 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: false }}
                                            transition={{ duration: 0.6 }}
                                            className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-8 border-b border-stone-200 pb-6"
                                        >
                                            {group}
                                        </motion.h3>

                                        <div className="flex flex-col gap-4">
                                            {qs.map(([q, a], i) => {
                                                const globalIndex = FAQ_GROUPS.slice(0, gIdx).reduce((acc, [, faqs]) => acc + faqs.length, 0) + i;
                                                const key = `${gIdx}-${i}`;
                                                const isActive = openFaq === key;
                                                const theme = FAQ_THEMES[globalIndex % FAQ_THEMES.length] || FAQ_THEMES[0]!;

                                                return (
                                                    <motion.div
                                                        key={key}
                                                        initial={{ opacity: 0, x: -40 }}
                                                        whileInView={{ opacity: 1, x: 0 }}
                                                        viewport={{ once: false, margin: "-10px" }}
                                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                                        className={`w-full rounded-[20px] transition-all duration-300 overflow-hidden ${isActive ? `${theme.bgActive} ${theme.cardBorder} border shadow-sm` : 'bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs'
                                                            }`}
                                                    >
                                                        <button
                                                            onClick={() => setOpenFaq(isActive ? null : key)}
                                                            className="w-full flex items-center justify-between p-4 md:p-5 text-left focus:outline-none gap-4 cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-4 flex-1">
                                                                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm font-mono transition-all duration-300 ${isActive ? `${theme.activeBg} text-white border ${theme.border} shadow-sm` : `${theme.numberBg} ${theme.text} border ${theme.border}`}`}>
                                                                    {String(globalIndex + 1).padStart(2, '0')}
                                                                </div>
                                                                <span className={`text-[15px] font-semibold leading-snug transition-colors pr-2 ${isActive ? theme.text : 'text-slate-900'}`}>
                                                                    {q}
                                                                </span>
                                                            </div>
                                                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${isActive ? `${theme.numberBg} ${theme.border} ${theme.text} rotate-180` : 'bg-slate-50 border-slate-200 text-slate-500'
                                                                }`}>
                                                                {isActive ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                            </div>
                                                        </button>

                                                        <AnimatePresence>
                                                            {isActive && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                >
                                                                    <div className="px-4 md:px-5 pb-5 pt-1 text-[14px] leading-relaxed text-slate-600 pl-[4.5rem]">
                                                                        {a}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredGroups.length === 0 && (
                            <div className="text-center py-12 text-stone-500 w-full">
                                No questions found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                </main>

                <FooterSection />
            </div>
        </div>
    );
}
