// @ts-nocheck
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldCheck, Sparkles, ArrowRight, ArrowLeft, Diamond, Check, Globe } from 'lucide-react';

const STEPS_DATA = [
    {
        stepNumber: "01",
        stepLabel: "Step 1 of 3",
        title: "Connect your content & website",
        description: "Drop your website URL, upload product PDFs, or paste your pricing and FAQs. Frosty Agent ingests your knowledge base in seconds.",
        items: [
            "One-click website URL scan",
            "Upload PDFs, docs & brochures",
            "Pricing rules & FAQ knowledge",
            "Custom tone & brand guidelines"
        ],
        time: "1-2 MIN",
        summaryTitle: "Connect your content\n& website",
        summaryDesc: "Drop your website URL, upload product PDFs, or paste pricing & FAQs."
    },
    {
        stepNumber: "02",
        stepLabel: "Step 2 of 3",
        title: "Customize & test in simulator",
        description: "Test real customer scenarios in your live simulator. Set AI guardrails, customize chat widget colors, and configure booking & quotation rules.",
        items: [
            "Interactive chat playground",
            "Strict guardrails — 0 hallucinations",
            "Custom widget branding & colors",
            "Calendar & quotation triggers"
        ],
        time: "2 MIN",
        summaryTitle: "Customize & test\nin simulator",
        summaryDesc: "Set strict AI guardrails, customize branding, and test live chat scenarios."
    },
    {
        stepNumber: "03",
        stepLabel: "Step 3 of 3",
        title: "Deploy & start converting",
        description: "Paste a single line of code on your website and connect your WhatsApp Business number. Frosty Agent starts answering, qualifying, and booking 24/7.",
        items: [
            "One-line website embed snippet",
            "Official WhatsApp Business connect",
            "Unified lead capture dashboard",
            "Instant live human takeover"
        ],
        time: "INSTANT",
        summaryTitle: "Deploy & start\nconverting",
        summaryDesc: "Embed on your site, connect WhatsApp, and capture leads 24/7."
    }
];

export default function DoneForYou() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const activeStep = STEPS_DATA[currentStep];

    const renderCompactPreview = (stepIdx: number) => {
        if (stepIdx === 0) {
            return (
                <div className="bg-[#F0FDFA] text-slate-900 rounded-xl px-3.5 h-[46px] mb-5 flex items-center justify-between text-[11px] shadow-sm border border-[#0396A6]/25 shrink-0">
                    <div className="flex items-center gap-2 truncate pr-2">
                        <span className="flex h-2 w-2 relative shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0396A6] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0396A6]"></span>
                        </span>
                        <span className="font-mono text-slate-700 truncate text-[10px] sm:text-[11px]"><strong className="text-[#0396A6] font-bold">Scanner Active:</strong> <span className="hidden sm:inline">Ingesting URLs, pricing, rules & FAQs...</span></span>
                    </div>
                    <span className="bg-[#0396A6]/15 text-[#0396A6] font-mono px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] shrink-0 border border-[#0396A6]/30 font-bold">100% READY</span>
                </div>
            );
        } else if (stepIdx === 1) {
            return (
                <div className="bg-[#F0FDFA] text-slate-900 rounded-xl px-3.5 h-[46px] mb-5 flex items-center justify-between text-[11px] shadow-sm border border-[#0396A6]/25 shrink-0">
                    <div className="flex items-center gap-2 truncate pr-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#0396A6] shrink-0" />
                        <span className="font-mono text-slate-700 truncate text-[10px] sm:text-[11px]"><strong className="text-[#0396A6] font-bold">Simulator Active:</strong> <span className="hidden sm:inline">Testing guardrails, quotes & replies</span></span>
                    </div>
                    <span className="bg-[#0396A6]/15 text-[#0396A6] font-mono px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] shrink-0 border border-[#0396A6]/30 font-bold">VERIFIED</span>
                </div>
            );
        } else {
            return (
                <div className="bg-[#F0FDFA] text-slate-900 rounded-xl px-3.5 h-[46px] mb-5 flex items-center justify-between text-[11px] shadow-sm border border-[#0396A6]/25 shrink-0">
                    <div className="flex items-center gap-2 truncate pr-2">
                        <Globe className="w-3.5 h-3.5 text-[#0396A6] shrink-0" />
                        <span className="font-mono text-slate-700 truncate text-[10px] sm:text-[11px]"><strong className="text-[#0396A6] font-bold">Live Omnichannel:</strong> <span className="hidden sm:inline">Active on Web Widget & WhatsApp</span></span>
                    </div>
                    <span className="bg-[#0396A6] text-white font-mono px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] shrink-0 font-bold animate-pulse">CONVERTING</span>
                </div>
            );
        }
    };

    return (
        <section id="setup" className="relative w-full overflow-hidden font-sans pt-6 sm:pt-10 pb-8 sm:pb-12 bg-transparent">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <svg className="absolute bottom-0 left-0 w-full h-full opacity-15" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                    <path d="M0,1000 C200,800 400,1000 1000,600" fill="none" stroke="#0396A6" strokeWidth="0.8" strokeDasharray="4 8" />
                    <path d="M0,900 C300,700 500,900 1000,500" fill="none" stroke="#0396A6" strokeWidth="0.8" strokeDasharray="4 8" />
                </svg>
            </div>

            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 relative z-10">

            <div className="flex flex-col lg:flex-row items-start justify-between gap-8 sm:gap-12 lg:gap-8 w-full relative z-10">
                
                {/* Left Column */}
                <div className="w-full lg:w-[45%] flex flex-col justify-center">
                    
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 relative w-max bg-[#0396A6]/[0.08] border border-[#0396A6]/20 backdrop-blur-sm shadow-xs"
                    >
                        <span className="w-4 h-4 rounded-full bg-[#0396A6]/20 flex items-center justify-center">
                            <Sparkles className="w-2.5 h-2.5 text-[#0396A6]" />
                        </span>
                        <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#0396A6]">SELF-SERVE SETUP</span>
                    </motion.div>

                    {/* Heading */}
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
                        className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#0F172A] leading-[1.15] tracking-tight m-0 mb-6"
                    >
                        <span className="text-[#0396A6] font-bold" style={{ color: '#0396A6' }}>Live in 5 minutes.</span><br />
                        Set up Frosty Agent in 3 easy steps.
                    </motion.h2>

                    {/* Paragraph */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                        className="text-sm md:text-base text-slate-600 font-normal leading-relaxed max-w-xl m-0 mb-6 space-y-3"
                    >
                        <p className="text-slate-600 font-normal">
                            Sign up, connect your website URL or documents, and let Frosty Agent build its knowledge base automatically.
                        </p>
                        <p className="text-slate-600 font-normal">
                            Customize your branding, test guardrails in the simulator, and paste one snippet to deploy. No complex onboarding required.
                        </p>
                    </motion.div>

                    {/* Features Row */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.2 }}
                        transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' }}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-6"
                    >
                        {/* Feature 1 */}
                        <div className="flex flex-row sm:flex-col lg:flex-row items-center sm:items-start lg:items-center gap-3 group">
                            <div className="shrink-0 group-hover:scale-105 transition-transform duration-300">
                                <Clock className="w-6 h-6 text-[#0396A6] stroke-[1.85]" />
                            </div>
                            <div>
                                <h4 className="text-[13px] font-bold text-slate-900 leading-tight">Setup in 5 min</h4>
                                <p className="text-[12px] text-slate-500 font-medium">No coding required</p>
                            </div>
                        </div>
                        {/* Feature 2 */}
                        <div className="flex flex-row sm:flex-col lg:flex-row items-center sm:items-start lg:items-center gap-3 group">
                            <div className="shrink-0 group-hover:scale-105 transition-transform duration-300">
                                <Sparkles className="w-6 h-6 text-[#0396A6] stroke-[1.85]" />
                            </div>
                            <div>
                                <h4 className="text-[13px] font-bold text-slate-900 leading-tight">Auto-learning</h4>
                                <p className="text-[12px] text-slate-500 font-medium">From URLs & docs</p>
                            </div>
                        </div>
                        {/* Feature 3 */}
                        <div className="flex flex-row sm:flex-col lg:flex-row items-center sm:items-start lg:items-center gap-3 group">
                            <div className="shrink-0 group-hover:scale-105 transition-transform duration-300">
                                <ShieldCheck className="w-6 h-6 text-[#0396A6] stroke-[1.85]" />
                            </div>
                            <div>
                                <h4 className="text-[13px] font-bold text-slate-900 leading-tight">Strict guardrails</h4>
                                <p className="text-[12px] text-slate-500 font-medium">0 false promises</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Bottom Progress Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.2 }}
                        transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                        className="mt-8 pt-6 border-t border-slate-200 w-full relative"
                    >
                        <div className="flex items-start w-full relative px-2 sm:px-4">
                            <div className="absolute top-2 left-[16.66%] right-[16.66%] h-[2px] bg-slate-200" />
                            <div 
                                className="absolute top-2 left-[16.66%] h-[2px] bg-[#0396A6] transition-all duration-500 ease-out" 
                                style={{ width: isCompleted ? '66.66%' : currentStep === 0 ? '0%' : currentStep === 1 ? '33.33%' : '66.66%' }} 
                            />

                            {/* Stage 1 */}
                            <div onClick={() => { setCurrentStep(0); setIsCompleted(false); }} className="flex-1 flex flex-col items-center relative cursor-pointer group">
                                <div className={`w-4 h-4 rounded-full transition-all duration-300 z-10 mb-3 shadow-sm flex items-center justify-center ${
                                    isCompleted || currentStep > 0 
                                        ? 'bg-[#0396A6] text-white border-2 border-[#0396A6]' 
                                        : currentStep === 0 
                                        ? 'bg-white border-[2.5px] border-[#0396A6] shadow-[0_0_0_4px_rgba(3, 150, 166,0.15)] scale-110' 
                                        : 'bg-white border-[2px] border-slate-300 group-hover:border-[#0396A6]'
                                }`}>
                                    {(isCompleted || currentStep > 0) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                </div>
                                <h5 className={`text-[13px] font-bold transition-colors duration-300 mb-1 ${
                                    isCompleted || currentStep >= 0 ? 'text-[#0396A6]' : 'text-slate-800 group-hover:text-[#0396A6]'
                                }`}>Import</h5>
                                <div className="text-[11px] text-center max-w-[130px] leading-tight">
                                    {isCompleted || currentStep > 0 ? (
                                        <span className="text-[#0396A6] font-semibold flex items-center justify-center gap-1">✓ Completed</span>
                                    ) : currentStep === 0 ? (
                                        <span className="text-[#0396A6] font-semibold">● In Progress</span>
                                    ) : (
                                        <span className="text-slate-500">Connect URLs & docs</span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Stage 2 */}
                            <div onClick={() => { setCurrentStep(1); setIsCompleted(false); }} className="flex-1 flex flex-col items-center relative cursor-pointer group">
                                <div className={`w-4 h-4 rounded-full transition-all duration-300 z-10 mb-3 shadow-sm flex items-center justify-center ${
                                    isCompleted || currentStep > 1 
                                        ? 'bg-[#0396A6] text-white border-2 border-[#0396A6]' 
                                        : currentStep === 1 
                                        ? 'bg-white border-[2.5px] border-[#0396A6] shadow-[0_0_0_4px_rgba(3, 150, 166,0.15)] scale-110' 
                                        : 'bg-white border-[2px] border-slate-300 group-hover:border-[#0396A6]'
                                }`}>
                                    {(isCompleted || currentStep > 1) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                </div>
                                <h5 className={`text-[13px] font-bold transition-colors duration-300 mb-1 ${
                                    isCompleted || currentStep >= 1 ? 'text-[#0396A6]' : 'text-slate-800 group-hover:text-[#0396A6]'
                                }`}>Customize</h5>
                                <div className="text-[11px] text-center max-w-[130px] leading-tight">
                                    {isCompleted || currentStep > 1 ? (
                                        <span className="text-[#0396A6] font-semibold flex items-center justify-center gap-1">✓ Completed</span>
                                    ) : currentStep === 1 ? (
                                        <span className="text-[#0396A6] font-semibold">● In Progress</span>
                                    ) : (
                                        <span className="text-slate-500">Test & set guardrails</span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Stage 3 */}
                            <div onClick={() => { setCurrentStep(2); if (isCompleted) setIsCompleted(false); }} className="flex-1 flex flex-col items-center relative cursor-pointer group">
                                <div className={`w-4 h-4 rounded-full transition-all duration-300 z-10 mb-3 shadow-sm flex items-center justify-center ${
                                    isCompleted 
                                        ? 'bg-[#0396A6] text-white border-2 border-[#0396A6]' 
                                        : currentStep === 2 
                                        ? 'bg-white border-[2.5px] border-[#0396A6] shadow-[0_0_0_4px_rgba(3, 150, 166,0.15)] scale-110' 
                                        : 'bg-white border-[2px] border-slate-300 group-hover:border-[#0396A6]'
                                }`}>
                                    {isCompleted && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                </div>
                                <h5 className={`text-[13px] font-bold transition-colors duration-300 mb-1 ${
                                    isCompleted || currentStep === 2 ? 'text-[#0396A6]' : 'text-slate-800 group-hover:text-[#0396A6]'
                                }`}>Deploy</h5>
                                <div className="text-[11px] text-center max-w-[130px] leading-tight">
                                    {isCompleted ? (
                                        <span className="text-[#0396A6] font-semibold flex items-center justify-center gap-1">✓ Completed</span>
                                    ) : currentStep === 2 ? (
                                        <span className="text-[#0396A6] font-semibold">● In Progress</span>
                                    ) : (
                                        <span className="text-slate-500">Live on Web & WhatsApp</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
                
                {/* Right Column */}
                <div className="w-full lg:w-[55%] relative flex flex-col pt-8 lg:pt-14">
                    
                    <div className="relative flex flex-col md:flex-row gap-8 lg:gap-12 w-full h-full">
                        
                        {/* The Main Card */}
                        <div className="relative md:w-[60%] shrink-0 flex flex-col">
                            <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-[#0396A6]/10 to-blue-500/5 blur-xl opacity-70 pointer-events-none" />
                            
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ once: false, amount: 0.15 }}
                                transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                                className="bg-white/95 rounded-[28px] p-5 sm:p-6 lg:p-8 shadow-[0_15px_50px_-12px_rgba(0,0,0,0.06)] border border-slate-200 relative z-20 flex flex-col justify-between hover:shadow-[0_25px_60px_-12px_rgba(3, 150, 166,0.1)] transition-all duration-500 min-h-[300px] lg:min-h-[320px] w-full"
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`${currentStep}-${isCompleted}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.25, ease: "easeInOut" }}
                                        className="flex flex-col flex-grow justify-center"
                                    >
                                        {/* Studio Header */}
                                        <div className="flex items-center justify-between mb-4 shrink-0">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-[13px] shadow-sm transition-all duration-300 ${
                                                    isCompleted ? 'bg-[#0396A6] text-white' : 'bg-teal-50 text-[#0396A6] border border-teal-200'
                                                }`}>
                                                    {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> : activeStep.stepNumber}
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block leading-none">{activeStep.stepLabel}</span>
                                                </div>
                                            </div>
                                            
                                            {isCompleted && (
                                                <button 
                                                    onClick={() => { setIsCompleted(false); setCurrentStep(0); }} 
                                                    className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-[#0396A6] px-3 py-1.5 rounded-xl border border-teal-200 text-[11px] font-bold transition-all duration-300 cursor-pointer shadow-sm shrink-0"
                                                >
                                                    <span>Restart</span>
                                                    <span className="text-[12px] leading-none">↻</span>
                                                </button>
                                            )}
                                        </div>
                                        
                                        <h3 className="text-xl lg:text-2xl font-bold text-slate-900 mb-6 leading-tight shrink-0 line-clamp-2">
                                            {activeStep.title}
                                        </h3>
                                        
                                        {/* Checklist Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 shrink-0">
                                            {activeStep.items.map((item, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl border transition-all duration-300 ${
                                                        isCompleted 
                                                            ? 'bg-teal-50 border-teal-200' 
                                                            : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-[#0396A6]/40 shadow-xs'
                                                    }`}
                                                >
                                                    <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0 transition-colors duration-300 ${
                                                        isCompleted ? 'bg-[#0396A6] text-white' : 'bg-[#0396A6]/10 text-[#0396A6]'
                                                    }`}>
                                                        <Check className="w-3 h-3" strokeWidth={2.5} />
                                                    </div>
                                                    <span className={`text-[12px] font-medium leading-tight truncate ${
                                                        isCompleted ? 'text-slate-900 font-semibold' : 'text-slate-700'
                                                    }`}>{item}</span>
                                                </div>
                                            ))}
                                        </div>

                                    </motion.div>
                                </AnimatePresence>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto shrink-0">
                                    <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs shrink-0">
                                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0396A6]" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-[#0396A6] uppercase leading-none mb-0.5">Time</span>
                                            <span className="text-[10px] sm:text-[11px] font-bold leading-none text-slate-800">
                                                {isCompleted ? "COMPLETED" : activeStep.time}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => {
                                                if (isCompleted) {
                                                    setIsCompleted(false);
                                                }
                                                setCurrentStep(prev => Math.max(0, prev - 1));
                                            }}
                                            disabled={currentStep === 0 && !isCompleted}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                                                currentStep === 0 && !isCompleted
                                                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 cursor-pointer shadow-sm'
                                            }`}
                                            title="Previous step"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>

                                        {!isCompleted ? (
                                            <button 
                                                onClick={() => {
                                                    if (currentStep < STEPS_DATA.length - 1) {
                                                        setCurrentStep(prev => prev + 1);
                                                    } else {
                                                        setIsCompleted(true);
                                                    }
                                                }}
                                                className="px-3 sm:px-5 h-9 rounded-full flex items-center gap-1.5 sm:gap-2 font-semibold text-[11px] sm:text-[12.5px] bg-[#0396A6] text-white hover:bg-[#0A1A2F] active:scale-95 cursor-pointer shadow-md hover:shadow-lg transition-all duration-300 shrink-0 whitespace-nowrap"
                                                title={currentStep === STEPS_DATA.length - 1 ? "Complete Setup" : "Next step"}
                                            >
                                                <span>{currentStep === STEPS_DATA.length - 1 ? "Finish" : "Next Step"}</span>
                                                {currentStep === STEPS_DATA.length - 1 ? <Check className="w-3.5 h-3.5 shrink-0" /> : <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    setIsCompleted(false);
                                                    setCurrentStep(0);
                                                }}
                                                className="px-4 h-9 rounded-full flex items-center gap-1.5 font-semibold text-[12.5px] bg-[#0396A6] text-white hover:bg-[#0A1A2F] active:scale-95 cursor-pointer shadow-md transition-all duration-300"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Restart</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                        
                        {/* Side Steps List */}
                        <div className="md:w-[40%] hidden md:flex flex-col justify-center gap-6 relative z-10 pl-8 md:pl-0 border-l-2 md:border-l-0 border-slate-200 ml-4 md:ml-0">
                            
                            <div className="hidden md:block absolute top-[25%] -left-12 w-12 border-t border-dashed border-slate-300 z-0" />
                            <div className="hidden md:block absolute top-[75%] -left-12 w-12 border-t border-dashed border-slate-300 z-0" />
                            <div className="hidden md:block absolute top-[25%] left-0 w-px h-[50%] border-l border-dashed border-slate-300 z-0" />

                            <AnimatePresence mode="popLayout">
                                {STEPS_DATA.filter((_, idx) => idx !== currentStep).map((step) => {
                                    const originalIndex = STEPS_DATA.findIndex(s => s.stepNumber === step.stepNumber);
                                    const isStepDone = isCompleted || originalIndex < currentStep;

                                    return (
                                        <motion.div
                                            key={step.stepNumber}
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                            onClick={() => { setCurrentStep(originalIndex); if (isCompleted) setIsCompleted(false); }}
                                            className="relative cursor-pointer group p-3.5 -ml-3 rounded-2xl hover:bg-slate-100/70 hover:shadow-sm transition-all duration-300 border border-transparent hover:border-slate-200"
                                        >
                                            <div className={`absolute -left-[17px] md:-left-4 top-3.5 w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px] transition-all duration-300 shadow-sm z-10 ${
                                                isStepDone 
                                                    ? 'bg-[#0396A6] text-white border border-[#0396A6]' 
                                                    : 'bg-white text-slate-700 border border-slate-200 group-hover:bg-[#0396A6] group-hover:text-white group-hover:border-[#0396A6]'
                                            }`}>
                                                {isStepDone ? <Check className="w-4 h-4 text-white" strokeWidth={2.5} /> : step.stepNumber}
                                            </div>
                                            <div className="pl-4 md:pl-10">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h4 className={`text-[15px] font-bold leading-snug transition-colors duration-300 ${
                                                        isStepDone ? 'text-slate-800' : 'text-slate-900 group-hover:text-[#0396A6]'
                                                    }`}>
                                                        {step.summaryTitle.replace('\n', ' ')}
                                                    </h4>
                                                    {isStepDone ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0396A6]/10 text-[#0396A6] border border-[#0396A6]/25 uppercase tracking-wider">
                                                            ✓ Done
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                                                            Next
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[12.5px] text-slate-500 leading-relaxed">
                                                    {step.summaryDesc}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                        </div>
                    </div>

                </div>

            </div>
            </div>
        </section>
    );
}
