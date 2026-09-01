/**
 * A foreground colour that stays readable on the merchant's own brand colour.
 *
 * ⚠️ THIS FIXES A REAL ACCESSIBILITY BUG IN THE SHIPPED WIDGET. `styles.css` pinned
 * `--on-accent: #ffffff` and `embed.ts` hardcoded `color:#fff` on the launcher — correct for the
 * pine default and unreadable for any light brand colour a merchant can legitimately choose. A
 * merchant whose brand is `#ffdd00` got white on yellow: about 1.2:1, against a 4.5:1 floor.
 *
 * Found while building the dashboard's widget preview (Phase E). The preview computes a readable
 * foreground, so leaving the widget alone would have made the preview LIE — worse than both being
 * wrong, because the merchant would ship a colour the dashboard showed as fine.
 *
 * ⚠️ IT PICKS THE BETTER OF THE TWO CANDIDATES, NOT A LUMINANCE THRESHOLD, AND A TEST IS WHY.
 * The first version used the conventional `luminance > 0.5` cut and I wrote a comment claiming that
 * at the boundary both choices land near 4.5:1. **That was wrong, and `contrast.test.ts` caught it
 * on our own palette**: Thermal's frost `#3e8ea8` sits just under the cut, so it took white at
 * **3.72:1** — while dark text on it measures 4.80:1. Comparing the two ratios costs four lines and
 * removes the guess.
 *
 * ⚠️ THIS FILE IS A DELIBERATE DUPLICATE of `apps/widget/src/contrast.ts`, and they must agree — the
 * preview on this screen is a promise about what the widget will do, so a divergence here is a
 * preview that lies. It is duplicated rather than shared because the widget bundle is served to
 * every merchant's site and imports nothing from the monorepo; a shared package for thirty lines
 * would add a build edge to the one artifact that has to stay small and dependency-free. The widget
 * suite owns the tests (`tests/contrast.test.ts`, 5 of them), including the two failures that
 * shaped the implementation.
 */

const DARK = "#111a17";
const LIGHT = "#ffffff";

/** WCAG relative luminance of a `#rrggbb`, or null when the input is not one. */
function luminance(colour: string): number | null {
  const hex = colour.trim().replace(/^#/, "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const channel = (i: number): number => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

function ratio(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * The contrast ratio between two colours, or null if either is not a hex colour.
 *
 * Exported so a caller can WARN rather than silently accept: a mid-tone brand colour exists for
 * which neither black nor white reaches 4.5:1, and the only honest response to that is to tell the
 * merchant their colour is unreadable — not to pick the least-bad option and say nothing.
 */
export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  return ratio(la, lb);
}

export function readableOn(background: string, fallback = LIGHT): string {
  const l = luminance(background);
  if (l === null) return fallback;
  return ratio(l, luminance(DARK)!) >= ratio(l, luminance(LIGHT)!) ? DARK : LIGHT;
}
