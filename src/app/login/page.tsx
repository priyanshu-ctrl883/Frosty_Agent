"use client";

import Link from "next/link";
import { Suspense, useMemo, FormEvent, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SUPABASE_CONFIGURED } from "@/lib/constants";
import { provisionMerchantIfNeeded } from "@/lib/pendingSignup";
import { signIn, signInWithGoogle } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { safeNextPath } from "@/lib/authPaths";
import { GoogleContinueButton } from "@/components/auth/GoogleContinueButton";
import { AuthHeroHeadline } from "@/components/auth/AuthHeroHeadline";
import { AuthBrandLogo } from "@/components/auth/AuthBrandLogo";
import { AuthFormCardGlow } from "@/components/auth/AuthFormCardGlow";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Bot,
  CalendarCheck,
  BarChart3,
  Check,
  Sparkles,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = useMemo(() => safeNextPath(params.get("next"), "/home"), [params]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const entering = useRef(false);
  const fromForm = useRef(false);

  const handleNavigate = (path: string) => {
    setIsExiting(true);
    setTimeout(() => {
      router.push(path);
    }, 220);
  };

  async function enterApp(token?: string) {
    if (entering.current) return;
    entering.current = true;
    if (next.startsWith("/invite")) {
      window.location.assign(next);
      return;
    }
    const outcome = await provisionMerchantIfNeeded(token);
    if (outcome === "needs_company") {
      window.location.assign("/signup/google");
      return;
    }
    window.location.assign(next);
  }

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    const { data } = supabase().auth.onAuthStateChange((event, session) => {
      if (fromForm.current) return;
      if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && session?.access_token) {
        setLoading(true);
        void enterApp(session.access_token).catch(() => {
          entering.current = false;
          setLoading(false);
        });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    fromForm.current = true;
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      await enterApp();
    } catch (err) {
      fromForm.current = false;
      entering.current = false;
      setError(err instanceof Error ? err.message : "Sign-in failed");
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
          <AuthBrandLogo className="mb-6" />

          {/* Main Headline */}
          <AuthHeroHeadline variant="login" />

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

            {/* Connecting Dashed Line with Smooth Traveling Glow Pulse */}
            <div className="flex-1 relative mx-2.5 h-6 flex items-center overflow-hidden">
              <div className="w-full border-t-2 border-dashed border-[#C3E8EA]" />
              <motion.div
                animate={{ x: ["-100%", "250%"], opacity: [0, 0.9, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
                className="absolute w-6 h-1 rounded-full bg-gradient-to-r from-transparent via-[#0092A2] to-transparent blur-[1px]"
                style={{ willChange: "transform" }}
              />
            </div>

            {/* Step 2: AI Agent (Active Highlight with Breathing Glow) */}
            <motion.div
              animate={{
                scale: [1, 1.03, 1],
              }}
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

            {/* Connecting Dashed Line with Smooth Traveling Glow Pulse */}
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

            {/* Connecting Dashed Line with Smooth Traveling Glow Pulse */}
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

          {/* ── 3 Interactive Floating Chat Cards: Lead Capture & Meeting Scheduling ── */}
          <div className="mt-8 relative pt-3 pb-2 max-w-lg">
            {/* Ambient Connecting Glowing Ring / Path with Gentle Breathing Aura */}
            <motion.div
              animate={{ opacity: [0.65, 0.95, 0.65] }}
              transition={{ duration: 5, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
              className="absolute inset-0 border border-[#BEE7E9]/70 rounded-[34px] bg-gradient-to-br from-white/40 via-[#EAF8F8]/25 to-white/60 pointer-events-none"
            />

            {/* Hand-Drawn Paper-Sketch Curved Dotted Flow Arrows (Card 1 -> Card 2 -> Card 3) */}
            <svg
              className="hidden sm:block absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible"
              viewBox="0 0 500 220"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Dynamically auto-orienting arrowhead aligned with the curve tangent */}
                <marker
                  id="sketch-arrow"
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

              {/* Arrow 1: Arching cleanly above from Card 1 -> Card 2 */}
              <motion.path
                d="M 115 58 C 130 18, 155 12, 178 22"
                stroke="#0092A2"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
                opacity="0.9"
                markerEnd="url(#sketch-arrow)"
                animate={{ strokeDashoffset: [0, -16] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />

              {/* Arrow 2: Arching cleanly above from Card 2 -> Card 3 */}
              <motion.path
                d="M 322 22 C 345 12, 370 18, 385 58"
                stroke="#0092A2"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
                opacity="0.9"
                markerEnd="url(#sketch-arrow)"
                animate={{ strokeDashoffset: [0, -16] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </svg>

            {/* Tiny Decorative Sparkles with Twinkle Animation */}
            <motion.div
              animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.2, 0.95, 1] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
              className="absolute top-2 right-9 text-[#0092A2] pointer-events-none flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 opacity-80" />
            </motion.div>

            <div className="relative z-10 flex flex-wrap sm:flex-nowrap items-end justify-between gap-3 p-3">
              
              {/* Card 1: Inbound Lead Inquiry with Gentle Levitation */}
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

              {/* Card 2 (Elevated Center): Frosty AI Lead Qualification & Calendar Sync */}
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
                
                {/* Typing / Activity Bar */}
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

              {/* Card 3: Frosty Instant Meeting Confirmation */}
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

        {/* ── RIGHT COLUMN: Elevated White Sign-in Card with Smooth Fade In/Out ── */}
        <div className="w-full lg:w-[42%] flex flex-col items-center justify-center overflow-visible">
          <AuthFormCardGlow
            isExiting={isExiting}
            maxWidthClass="max-w-[420px]"
            className="w-full bg-white rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] transition-all duration-300"
          >
            
            <AuthBrandLogo variant="mark" className="mx-auto mb-4" />

            {/* Card Title & Subtitle */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Sign in to your merchant workspace
              </p>
            </div>

            {/* Google 1-Click Sign-in */}
            <GoogleContinueButton
              onClick={() => {
                setOauthLoading(true);
                setError(null);
                void signInWithGoogle("/signup/google").catch((err) => {
                  setOauthLoading(false);
                  setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
                });
              }}
              disabled={!SUPABASE_CONFIGURED || loading || oauthLoading}
              loading={oauthLoading}
              className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 text-xs font-bold flex items-center justify-center gap-2.5 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
            />

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-slate-200/80" />
              <span className="px-2.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                OR SIGN IN WITH EMAIL
              </span>
              <div className="flex-1 border-t border-slate-200/80" />
            </div>

            {/* Email / Password Form */}
            <form className="space-y-3.5" onSubmit={onSubmit}>
              {/* Email Address */}
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
                    placeholder="yash.saraswat@frostrek.com"
                    autoComplete="email"
                    required
                    className="w-full bg-white hover:bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-[#0092A2] rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0092A2]/15 transition-all font-medium h-11"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5 ml-0.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => handleNavigate("/forgot-password")}
                    className="text-xs font-bold text-[#0092A2] hover:underline transition-colors cursor-pointer bg-transparent border-0 p-0"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full bg-white hover:bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-[#0092A2] rounded-xl pl-10 pr-10 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0092A2]/15 transition-all font-medium h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Supabase Not Configured Warning */}
              {!SUPABASE_CONFIGURED && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                  Sign-in is not configured for this build.
                </p>
              )}

              {/* Error Message Banner */}
              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-2 text-xs text-rose-800 animate-in fade-in-50 duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || oauthLoading || !SUPABASE_CONFIGURED}
                className="w-full h-11 bg-[#0092A2] hover:bg-[#007D8B] active:bg-[#065E6A] text-white rounded-xl text-xs font-bold shadow-md shadow-[#0092A2]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 mt-4 cursor-pointer"
              >
                <span>{loading ? "Accessing Workspace..." : "Access Workspace"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Switch to Sign Up with Fade Out Navigation */}
            <div className="mt-5 text-center text-xs text-slate-500 font-medium">
              Don&apos;t have a merchant account?{" "}
              <button
                type="button"
                onClick={() => handleNavigate("/signup")}
                className="text-[#0092A2] font-bold hover:underline cursor-pointer bg-transparent border-0 p-0 inline font-medium"
              >
                Sign up
              </button>
            </div>
          </AuthFormCardGlow>
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400 font-sans">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
