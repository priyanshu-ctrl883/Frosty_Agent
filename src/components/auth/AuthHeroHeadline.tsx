"use client";

import { motion } from "framer-motion";

type AuthHeroVariant = "login" | "signup";

const slideBlur = {
  initial: { x: -56, opacity: 0, filter: "blur(14px)" },
  animate: { x: 0, opacity: 1, filter: "blur(0px)" },
  transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] as const, delay: 0.06 },
};

function HeroUnderline() {
  return (
    <svg
      className="absolute -bottom-1.5 left-0 w-[102%] h-4 overflow-visible pointer-events-none"
      viewBox="0 0 240 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
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
  );
}

export function AuthHeroHeadline({ variant }: { variant: AuthHeroVariant }) {
  return (
    <motion.div
      key={variant}
      initial={slideBlur.initial}
      animate={slideBlur.animate}
      transition={slideBlur.transition}
      className="will-change-transform"
      style={{ willChange: "transform, opacity, filter" }}
    >
      {variant === "login" ? (
        <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-black text-[#0A1A2F] tracking-tight leading-[1.08]">
          Welcome back! <br />
          let&apos;s <span className="text-[#0092A2]">pick up</span> <br />
          <span className="relative inline-block text-[#FF7A5E] pb-1">
            where we left.
            <HeroUnderline />
          </span>
        </h1>
      ) : (
        <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-black text-[#0A1A2F] tracking-tight leading-[1.08]">
          Everything you <br />
          need to <span className="text-[#0092A2]">sell</span> <br />
          <span className="relative inline-block text-[#FF7A5E] pb-1">
            smarter.
            <HeroUnderline />
          </span>
        </h1>
      )}

      <motion.p
        initial={{ x: -40, opacity: 0, filter: "blur(10px)" }}
        animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1], delay: 0.14 }}
        className="text-sm sm:text-[14.5px] text-slate-500 font-normal mt-5 max-w-lg leading-relaxed"
      >
        Your AI-powered merchant workspace to engage customers, automate conversations and turn every
        interaction into revenue.
      </motion.p>
    </motion.div>
  );
}
