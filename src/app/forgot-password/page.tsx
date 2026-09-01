"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SUPABASE_CONFIGURED } from "@/lib/constants";
import { apiRequest } from "@/lib/api";
import { FrostrekLogo } from "@/components/FrostrekLogo";
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Bot,
  CalendarCheck,
  BarChart3,
  Check,
  Sparkles,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleNavigate = (path: string) => {
    setIsExiting(true);
    setTimeout(() => {
      router.push(path);
    }, 220);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiRequest("/v1/iam/forgot-password", {
        method: "POST",
        body: { email },
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans selection:bg-[#0092A2]/20 flex flex-col justify-between relative overflow-x-hidden">
      {/* ── Soft Ambient Glows ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        <div className="absolute top-[-8%] left-[-6%] w-[600px] h-[600px] bg-gradient-to-br from-[#0092A2]/10 via-[#0092A2]/3 to-transparent rounded-full blur-3xl opacity-75" />
        <div className="absolute bottom-[-10%] left-[25%] w-[650px] h-[650px] bg-gradient-to-tr from-[#38BDF8]/12 via-[#0092A2]/4 to-transparent rounded-full blur-3xl opacity-70" />
      </div>

      {/* ── Main 2-Column Split Container ── */}
      <div className="w-full max-w-[1340px] mx-auto px-5 sm:px-8 lg:px-10 py-6 sm:py-8 flex-1 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 relative z-10 my-auto">
        
        {/* ── LEFT COLUMN: Brand Hero, Process Pipeline & Live AI Chat Previews ── */}
        <div className="w-full lg:w-[56%] flex flex-col justify-center max-w-xl lg:max-w-none lg:-ml-2">
          
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 mb-6">
            <FrostrekLogo size={28} />
            <span
              className="font-serif font-bold text-2xl sm:text-[26px] text-[#0A1A2F] tracking-tight"
              style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif" }}
            >
              Frosty Agent
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-black text-[#0A1A2F] tracking-tight leading-[1.08]">
            Everything you <br />
            need to <span className="text-[#0092A2]">sell</span> <br />
            <span className="relative inline-block text-[#FF7A5E] pb-1">
              smarter.
              {/* Calligraphic Curved Underline Stroke in Orange (#FF7A5E) */}
              <svg
                className="absolute -bottom-1.5 left-0 w-[102%] h-4 overflow-visible pointer-events-none"
                viewBox="0 0 240 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 3 8.5 C 55 3.5, 145 3.5, 237 6.5"
                  stroke="#FF7A5E"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                <path
                  d="M 12 8 C 65 4.5, 140 4.5, 225 6.5 C 160 8.5, 75 8.5, 12 8 Z"
                  fill="#FF7A5E"
                />
                <path
                  d="M 18 12 C 55 10.8, 105 11.2, 160 12.8"
                  stroke="#FF7A5E"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  opacity="0.75"
                />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-[14.5px] text-slate-500 font-normal mt-5 max-w-lg leading-relaxed">
            Your AI-powered merchant workspace to engage customers, automate conversations and turn every interaction into revenue.
          </p>

          {/* 4-Step Process Pipeline */}
          <div className="mt-8 flex items-center justify-between max-w-md w-full">
            {/* Step 1: Chat */}
            <motion.div
              whileHover={{ y: -3, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="flex flex-col items-center cursor-default group"
              style={{ willChange: "transform" }}
            >
              <div className="w-10 h-10 rounded-full bg-white border border-[#D5ECEE] text-[#0092A2] flex items-center justify-center shadow-xs group-hover:border-[#0092A2] transition-colors">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-600 mt-2 group-hover:text-slate-900 transition-colors">
                Chat
              </span>
            </motion.div>

            {/* Connecting Dashed Line */}
            <div className="flex-1 relative mx-2.5 h-6 flex items-center overflow-hidden">
              <div className="w-full border-t-2 border-dashed border-[#C3E8EA]" />
              <motion.div
                animate={{ x: ["-100%", "250%"], opacity: [0, 0.9, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
                className="absolute w-6 h-1 rounded-full bg-gradient-to-r from-transparent via-[#0092A2] to-transparent blur-[1px]"
                style={{ willChange: "transform" }}
              />
            </div>

            {/* Step 2: AI Agent */}
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
              whileHover={{ y: -3, scale: 1.08 }}
              className="flex flex-col items-center cursor-default group relative"
              style={{ willChange: "transform" }}
            >
              <div className="w-10 h-10 rounded-full bg-[#DDF4F6] border border-[#0092A2]/30 text-[#0092A2] flex items-center justify-center shadow-xs shadow-[#0092A2]/20">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-2">AI Agent</span>
            </motion.div>

            {/* Connecting Dashed Line */}
            <div className="flex-1 relative mx-2.5 h-6 flex items-center overflow-hidden">
              <div className="w-full border-t-2 border-dashed border-[#C3E8EA]" />
              <motion.div
                animate={{ x: ["-100%", "250%"], opacity: [0, 0.9, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: [0.4, 0, 0.2, 1], delay: 1 }}
                className="absolute w-6 h-1 rounded-full bg-gradient-to-r from-transparent via-[#0092A2] to-transparent blur-[1px]"
                style={{ willChange: "transform" }}
              />
            </div>

            {/* Step 3: Meetings */}
            <motion.div
              whileHover={{ y: -3, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="flex flex-col items-center cursor-default group"
              style={{ willChange: "transform" }}
            >
              <div className="w-10 h-10 rounded-full bg-white border border-[#D5ECEE] text-[#0092A2] flex items-center justify-center shadow-xs group-hover:border-[#0092A2] transition-colors">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-600 mt-2 group-hover:text-slate-900 transition-colors">
                Meetings
              </span>
            </motion.div>

            {/* Connecting Dashed Line */}
            <div className="flex-1 relative mx-2.5 h-6 flex items-center overflow-hidden">
              <div className="w-full border-t-2 border-dashed border-[#C3E8EA]" />
              <motion.div
                animate={{ x: ["-100%", "250%"], opacity: [0, 0.9, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: [0.4, 0, 0.2, 1], delay: 2 }}
                className="absolute w-6 h-1 rounded-full bg-gradient-to-r from-transparent via-[#0092A2] to-transparent blur-[1px]"
                style={{ willChange: "transform" }}
              />
            </div>

            {/* Step 4: Growth */}
            <motion.div
              whileHover={{ y: -3, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="flex flex-col items-center cursor-default group"
              style={{ willChange: "transform" }}
            >
              <div className="w-10 h-10 rounded-full bg-white border border-[#D5ECEE] text-[#0092A2] flex items-center justify-center shadow-xs group-hover:border-[#0092A2] transition-colors">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-600 mt-2 group-hover:text-slate-900 transition-colors">
                Growth
              </span>
            </motion.div>
          </div>

          {/* ── 3 Interactive Floating Chat Cards ── */}
          <div className="mt-8 relative pt-3 pb-2 max-w-lg">
            <motion.div
              animate={{ opacity: [0.65, 0.95, 0.65] }}
              transition={{ duration: 5, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
              className="absolute inset-0 border border-[#BEE7E9]/70 rounded-[34px] bg-gradient-to-br from-white/40 via-[#EAF8F8]/25 to-white/60 pointer-events-none"
            />

            {/* Hand-Drawn Paper-Sketch Curved Dotted Flow Arrows */}
            <svg
              className="hidden sm:block absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible"
              viewBox="0 0 500 220"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <marker
                  id="forgot-sketch-arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path
                    d="M 1 2 L 6 5 L 1 8"
                    fill="none"
                    stroke="#0092A2"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </marker>
              </defs>

              <motion.path
                d="M 115 58 C 130 18, 155 12, 178 22"
                stroke="#0092A2"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
                opacity="0.9"
                markerEnd="url(#forgot-sketch-arrow)"
                animate={{ strokeDashoffset: [0, -16] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />

              <motion.path
                d="M 322 22 C 345 12, 370 18, 385 58"
                stroke="#0092A2"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
                opacity="0.9"
                markerEnd="url(#forgot-sketch-arrow)"
                animate={{ strokeDashoffset: [0, -16] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </svg>

            {/* Tiny Decorative Sparkles */}
            <motion.div
              animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.2, 0.95, 1] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
              className="absolute top-2 right-9 text-[#0092A2] pointer-events-none flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 opacity-80" />
            </motion.div>

            <div className="relative z-10 flex flex-wrap sm:flex-nowrap items-end justify-between gap-3 p-3">
              {/* Card 1: Prospect */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: [0, -7, 0] }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.1 },
                  y: { duration: 5.5, repeat: Infinity, ease: [0.45, 0, 0.55, 1] },
                }}
                whileHover={{ scale: 1.03, y: -10 }}
                style={{ willChange: "transform" }}
                className="bg-white rounded-2xl p-3.5 shadow-md shadow-slate-200/60 border border-slate-100/90 flex-1 min-w-[145px] max-w-[170px] cursor-default transition-shadow hover:shadow-lg hover:shadow-slate-200/80"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-rose-400 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&auto=format&fit=crop&q=80"
                      alt="Prospect"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Prospect</span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium mt-2 leading-snug">
                  Can we schedule a 15-min demo call for tomorrow?
                </p>
                <span className="text-[9px] text-slate-400 block mt-2 font-medium">
                  10:30 AM
                </span>
              </motion.div>

              {/* Card 2: Frosty AI */}
              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: [-12, -20, -12] }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.25 },
                  y: { duration: 6.2, repeat: Infinity, ease: [0.45, 0, 0.55, 1], delay: 0.5 },
                }}
                whileHover={{ scale: 1.04, y: -24 }}
                style={{ willChange: "transform" }}
                className="bg-white rounded-2xl p-3.5 shadow-xl shadow-[#0092A2]/15 border-2 border-[#0092A2]/30 flex-1 min-w-[175px] max-w-[200px] z-10 cursor-default transition-shadow hover:shadow-2xl hover:shadow-[#0092A2]/25"
              >
                <div className="flex items-center gap-1 text-xs font-extrabold text-[#0092A2]">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-[#0092A2]" />
                  </motion.div>
                  <span>Frosty AI</span>
                </div>
                
                <div className="bg-[#EEF6F8] text-slate-600 text-[10px] font-semibold px-2.5 py-1 rounded-md mt-2 w-full flex items-center justify-between">
                  <span>Syncing calendar...</span>
                  <span className="flex items-center gap-0.5 ml-1">
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0, ease: "easeInOut" }}
                      className="w-1 h-1 rounded-full bg-[#0092A2]"
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.25, ease: "easeInOut" }}
                      className="w-1 h-1 rounded-full bg-[#0092A2]"
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
                      className="w-1 h-1 rounded-full bg-[#0092A2]"
                    />
                  </span>
                </div>

                <div className="mt-2 space-y-1 text-[10px] font-bold text-slate-700">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Check className="w-3 h-3 text-[#0092A2] stroke-[3.5]" />
                    <span>Contact & intent verified</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Check className="w-3 h-3 text-[#0092A2] stroke-[3.5]" />
                    <span>Slot found: Tomorrow 2 PM</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Check className="w-3 h-3 text-[#0092A2] stroke-[3.5]" />
                    <span>Calendar invite generated</span>
                  </div>
                </div>
              </motion.div>

              {/* Card 3: Frosty Confirmation */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: [0, -7, 0] }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.4 },
                  y: { duration: 5.8, repeat: Infinity, ease: [0.45, 0, 0.55, 1], delay: 1 },
                }}
                whileHover={{ scale: 1.03, y: -10 }}
                style={{ willChange: "transform" }}
                className="bg-white rounded-2xl p-3.5 shadow-md shadow-slate-200/60 border border-slate-100/90 flex-1 min-w-[145px] max-w-[170px] cursor-default transition-shadow hover:shadow-lg hover:shadow-slate-200/80"
              >
                <div className="flex items-center gap-1 text-xs font-extrabold text-[#0092A2]">
                  <span className="text-xs">+</span>
                  <span>Frosty</span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium mt-1.5 leading-snug">
                  You&apos;re booked for tomorrow at 2:00 PM! I&apos;ve sent the invite to your email.
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[9px] text-slate-400 font-medium">10:31 AM</span>
                  <motion.div
                    animate={{ scale: [1, 1.14, 1] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
                    className="w-4 h-4 rounded-full bg-[#0092A2] text-white flex items-center justify-center text-[9px] shadow-xs shadow-[#0092A2]/30"
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Elevated White Reset Request Card with Smooth Fade In/Out ── */}
        <div className="w-full lg:w-[42%] flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={isExiting ? { opacity: 0, y: -12, scale: 0.97 } : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-[420px] bg-white rounded-[32px] p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.07),0_8px_30px_-6px_rgba(0,146,162,0.05)] border border-slate-100/90 transition-all duration-300"
          >
            
            {/* Standalone Brand Dual-Sparkle Logo (Teal & Coral) */}
            <div className="flex items-center justify-center mx-auto mb-4">
              <FrostrekLogo size={38} />
            </div>

            {/* Card Title & Subtitle */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Reset your password
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Enter your email and we&apos;ll send you a recovery link
              </p>
            </div>

            {/* Success Message */}
            {success ? (
              <div className="space-y-4">
                <div className="p-4 bg-[#EEF6F8] border border-[#BEE7E9] rounded-2xl flex items-start gap-3 text-xs text-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-[#0092A2] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#0092A2] text-sm">Check your inbox</p>
                    <p className="mt-1 text-slate-600 leading-relaxed">
                      If an account exists for <span className="font-bold text-slate-800">{email}</span>, a secure password reset link was sent.
                    </p>
                  </div>
                </div>
                <Link
                  href="/login"
                  className="w-full h-11 bg-[#0092A2] hover:bg-[#007D8B] text-white rounded-xl text-xs font-bold shadow-md shadow-[#0092A2]/20 flex items-center justify-center gap-2 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={onSubmit}>
                {error && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-2 text-xs text-rose-800 animate-in fade-in-50 duration-200">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-0.5">
                    EMAIL ADDRESS
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="merchant@company.com"
                      autoComplete="email"
                      required
                      className="w-full bg-white hover:bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-[#0092A2] rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0092A2]/15 transition-all font-medium h-11"
                    />
                  </div>
                </div>

                {!SUPABASE_CONFIGURED && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                    Password reset is not configured for this build.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !SUPABASE_CONFIGURED}
                  className="w-full h-11 bg-[#0092A2] hover:bg-[#007D8B] active:bg-[#065E6A] text-white rounded-xl text-xs font-bold shadow-md shadow-[#0092A2]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 mt-4 cursor-pointer"
                >
                  <span>{loading ? "Sending link..." : "Send Reset Link"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-xs text-slate-500 font-medium">
              Remembered your password?{" "}
              <button
                type="button"
                onClick={() => handleNavigate("/login")}
                className="text-[#0092A2] font-bold hover:underline cursor-pointer bg-transparent border-0 p-0 inline font-medium"
              >
                Sign in
              </button>
            </div>
          </motion.div>
        </div>

      </div>

      {/* ── Outer Page Footer ── */}
      <footer className="w-full max-w-[1340px] mx-auto px-5 sm:px-8 lg:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 font-medium border-t border-slate-200/50 relative z-10">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href="/privacy" className="hover:text-slate-700 transition-colors">
            Privacy
          </Link>
          <span>·</span>
          <Link href="/cookies" className="hover:text-slate-700 transition-colors">
            Cookies
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-slate-700 transition-colors">
            Terms
          </Link>
          <span>·</span>
          <Link href="/accessibility" className="hover:text-slate-700 transition-colors">
            Accessibility
          </Link>
        </div>
        <p className="text-[10px] text-slate-400 font-normal">
          © {new Date().getFullYear()} Frostrek AI, Gurugram.{" "}
          <a href="mailto:sales@frostrek.com" className="hover:text-slate-700 hover:underline">
            sales@frostrek.com
          </a>
        </p>
      </footer>
    </div>
  );
}
