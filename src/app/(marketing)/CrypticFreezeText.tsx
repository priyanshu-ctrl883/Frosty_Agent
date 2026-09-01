// @ts-nocheck
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useInView } from 'framer-motion';
import type { JSX } from 'react';

/* ─── Character pool for the scramble phase ──────────────────── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:<>?/~`';
const randomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

export interface CrypticFreezeTextProps {
  /** The final text to reveal */
  text: string;
  /** Optional HTML tag, defaults to 'span' */
  as?: keyof JSX.IntrinsicElements;
  /** Duration of the initial scramble phase in ms (default 400) */
  scrambleDuration?: number;
  /** Time in ms for each character to freeze, left-to-right (default 40) */
  freezeStagger?: number;
  /** Additional CSS class */
  className?: string;
  /** Inline style override */
  style?: React.CSSProperties;
  /** If true, re-trigger animation each time it enters viewport */
  once?: boolean;
  /** If false, won't trigger even if in view (useful for sync with splash) */
  ready?: boolean;
}

/**
 * CrypticFreezeText — When entering the viewport, the text scrambles
 * through random characters, then freezes left-to-right into the target
 * text with a cyan glow flash on each character lock.
 */
export default function CrypticFreezeText({
  text,
  as = 'span',
  scrambleDuration = 400,
  freezeStagger = 40,
  className,
  style,
  once = true,
  ready = true,
}: CrypticFreezeTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once, margin: '0px 0px -250px 0px' });
  const [displayChars, setDisplayChars] = useState<string[]>(() => text.split(''));
  const [frozenUpTo, setFrozenUpTo] = useState(-1);
  const [hasStarted, setHasStarted] = useState(false);
  const [glowIndex, setGlowIndex] = useState(-1);

  const chars = text.split('');
  const totalLen = chars.length;

  // Phase 1: Scramble — rapidly cycle random characters
  // Phase 2: Freeze — lock characters left-to-right
  const animate = useCallback(() => {
    if (hasStarted) return;
    setHasStarted(true);

    const scrambleInterval = 30; // ms between scramble ticks
    let elapsed = 0;
    const scrambleTimer = setInterval(() => {
      elapsed += scrambleInterval;
      setDisplayChars(
        chars.map((c, i) => {
          // Preserve spaces always
          if (c === ' ') return ' ';
          return randomChar();
        })
      );

      if (elapsed >= scrambleDuration) {
        clearInterval(scrambleTimer);
        // Begin freeze phase
        let freezeIdx = 0;
        const freezeTimer = setInterval(() => {
          if (freezeIdx >= totalLen) {
            clearInterval(freezeTimer);
            setGlowIndex(-1);
            return;
          }
          // Skip spaces
          if (chars[freezeIdx] === ' ') {
            setFrozenUpTo(freezeIdx);
            freezeIdx++;
            return;
          }
          setFrozenUpTo(freezeIdx);
          setGlowIndex(freezeIdx);
          // Clear glow after a flash
          const gi = freezeIdx;
          setTimeout(() => {
            setGlowIndex((prev) => (prev === gi ? -1 : prev));
          }, 120);
          freezeIdx++;
        }, freezeStagger);
      }
    }, scrambleInterval);
  }, [chars, freezeStagger, hasStarted, scrambleDuration, totalLen]);

  useEffect(() => {
    if (isInView && ready && !hasStarted) {
      animate();
    }
  }, [isInView, ready, hasStarted, animate]);

  // Compute displayed characters: frozen chars show real text, others show scramble
  const rendered = chars.map((c, i) => {
    if (c === ' ') return ' ';
    if (i <= frozenUpTo) return c;
    return displayChars[i] ?? c;
  });

  // Use a local any-cast for the dynamic tag to resolve TS errors with ref/style
  const Tag = as as any;

  return (
    <Tag
      ref={containerRef}
      className={className}
      style={{ ...style, display: 'inline' }}
    >
      {rendered.map((ch, i) => {
        const isFrozen = i <= frozenUpTo;
        const isGlowing = i === glowIndex;
        const isSpace = ch === ' ';

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              minWidth: isSpace ? '0.25em' : undefined,
              color: isFrozen ? 'inherit' : 'rgba(255,255,255,0.3)',
              textShadow: isGlowing
                ? '0 0 8px rgba(0,255,255,0.6), 0 0 16px rgba(0,255,255,0.3)'
                : 'none',
              transition: 'color 0.1s, text-shadow 0.12s'
            }}
          >
            {isSpace ? '\u00A0' : ch}
          </span>
        );
      })}
    </Tag>
  );
}
