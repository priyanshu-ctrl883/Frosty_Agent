"use client";

import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { useCallback, useRef, type ReactNode } from "react";

import styles from "./AuthFormCardGlow.module.css";

type AuthFormCardGlowProps = {
  children: ReactNode;
  isExiting?: boolean;
  className?: string;
  maxWidthClass?: string;
};

const spring = { stiffness: 52, damping: 20, mass: 0.65 };

export function AuthFormCardGlow({
  children,
  isExiting = false,
  className = "",
  maxWidthClass = "max-w-[440px]",
}: AuthFormCardGlowProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, spring);
  const smoothY = useSpring(pointerY, spring);

  const tealX = useTransform(smoothX, (v) => v * -22);
  const tealY = useTransform(smoothY, (v) => v * -16);
  const warmX = useTransform(smoothX, (v) => v * 30);
  const warmY = useTransform(smoothY, (v) => v * 24);
  const coreX = useTransform(smoothX, (v) => v * 14);
  const coreY = useTransform(smoothY, (v) => v * 12);

  const tealOriginX = useTransform(smoothX, (v) => `${38 + v * 6}%`);
  const tealOriginY = useTransform(smoothY, (v) => `${48 + v * 5}%`);
  const warmOriginX = useTransform(smoothX, (v) => `${62 + v * 10}%`);
  const warmOriginY = useTransform(smoothY, (v) => `${52 + v * 8}%`);
  const coreOriginX = useTransform(smoothX, (v) => `${48 + v * 5}%`);
  const coreOriginY = useTransform(smoothY, (v) => `${46 + v * 4}%`);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width - 0.5;
    const ny = (clientY - rect.top) / rect.height - 0.5;
    pointerX.set(nx * 2);
    pointerY.set(ny * 2);
  }, [pointerX, pointerY]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduceMotion) return;
      handlePointerMove(e.clientX, e.clientY);
    },
    [handlePointerMove, reduceMotion],
  );

  const handleMouseLeave = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
  }, [pointerX, pointerY]);

  return (
    <div
      ref={rootRef}
      className={`${styles.authGlowRoot} ${maxWidthClass}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {!reduceMotion ? (
        <div className={styles.authGlowStack} aria-hidden>
          <motion.div
            className={styles.authGlowParallax}
            style={{ x: tealX, y: tealY }}
          >
            <motion.div
              className={`${styles.authGlowLayer} ${styles.authGlowOuter}`}
              style={
                {
                  "--glow-origin-x": tealOriginX,
                  "--glow-origin-y": tealOriginY,
                } as React.CSSProperties
              }
            />
          </motion.div>

          <motion.div
            className={styles.authGlowParallax}
            style={{ x: warmX, y: warmY }}
          >
            <motion.div
              className={`${styles.authGlowLayer} ${styles.authGlowWarm}`}
              style={
                {
                  "--glow-origin-x": warmOriginX,
                  "--glow-origin-y": warmOriginY,
                } as React.CSSProperties
              }
            />
          </motion.div>

          <motion.div
            className={styles.authGlowParallax}
            style={{ x: coreX, y: coreY }}
          >
            <motion.div
              className={`${styles.authGlowLayer} ${styles.authGlowCore}`}
              style={
                {
                  "--glow-origin-x": coreOriginX,
                  "--glow-origin-y": coreOriginY,
                } as React.CSSProperties
              }
            />
          </motion.div>
        </div>
      ) : (
        <div
          className={styles.authGlowStack}
          aria-hidden
          style={{
            background:
              "radial-gradient(circle at 40% 48%, rgba(0,146,162,0.2) 0%, transparent 58%), radial-gradient(circle at 64% 52%, #FF7A5E 0%, rgba(255,122,94,0.25) 45%, transparent 62%)",
            filter: "blur(40px)",
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={isExiting ? { opacity: 0, y: -12, scale: 0.97 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className={`${styles.authGlowCard} ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
