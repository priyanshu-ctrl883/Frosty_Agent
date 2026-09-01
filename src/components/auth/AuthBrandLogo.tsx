"use client";

import { motion, useReducedMotion } from "framer-motion";

import { FrostyAgentLogo } from "@/components/FrostyAgentLogo";

type AuthBrandLogoProps = {
  variant?: "header" | "mark";
  size?: number;
  className?: string;
};

const ease = [0.16, 1, 0.3, 1] as const;

export function AuthBrandLogo({
  variant = "header",
  size,
  className = "",
}: AuthBrandLogoProps) {
  const reduceMotion = useReducedMotion();
  const logoHeight = size ?? (variant === "header" ? 32 : 40);

  const motionProps = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
    : {
        initial: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
        transition: { duration: 0.55, ease },
      };

  return (
    <motion.div
      className={className}
      initial={motionProps.initial}
      animate={motionProps.animate}
      transition={motionProps.transition}
      style={{ willChange: "transform, opacity, filter" }}
    >
      <FrostyAgentLogo
        height={logoHeight}
        variant={variant === "mark" ? "icon" : "full"}
      />
    </motion.div>
  );
}
