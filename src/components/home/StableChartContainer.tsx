"use client";

import {
  cloneElement,
  useRef,
  useState,
  useEffect,
  type ReactElement,
} from "react";

/**
 * Drop-in replacement for Recharts' ResponsiveContainer.
 *
 * Recharts' built-in ResponsiveContainer triggers infinite setState loops
 * inside flex/grid layouts because its internal ResizeObserver fires setState
 * on every sub-pixel change, which triggers a re-render, which changes layout,
 * which fires the observer again.
 *
 * This component:
 *  1. Measures the wrapper div once on mount via ResizeObserver.
 *  2. Debounces with rAF.
 *  3. Applies a 4 px dead-band so sub-pixel jitter is silently swallowed.
 *  4. Passes explicit width + height to the chart child via cloneElement.
 *     The `as any` cast is intentional — Recharts chart components accept
 *     width/height as number props at runtime; the constraint is TS-only.
 */
export function StableChartContainer({
  children,
  minWidth = 50,
  minHeight = 50,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: ReactElement<any>;
  minWidth?: number;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const raf = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      const w = Math.floor(width);
      const h = Math.floor(height);
      if (w < 1 || h < 1) return;
      setDims((prev) => {
        if (!prev) return { w, h };
        // Dead-band: ignore sub-5px jitter to prevent feedback loops
        if (Math.abs(prev.w - w) < 5 && Math.abs(prev.h - h) < 5) return prev;
        return { w, h };
      });
    };

    update(); // initial measurement

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(update);
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf.current);
    };
  }, []);

  const w = dims ? Math.max(dims.w, minWidth) : 0;
  const h = dims ? Math.max(dims.h, minHeight) : 0;

  return (
    <div
      ref={ref}
      style={{ width: "100%", height: "100%", minWidth, minHeight, overflow: "hidden" }}
    >
      {dims ? cloneElement(children, { width: w, height: h }) : null}
    </div>
  );
}
