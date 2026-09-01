import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-outfit)", "Outfit", "system-ui", "sans-serif"],
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "Georgia", "serif"],
        sub: ["var(--font-space)", "Space Grotesk", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--on-surface)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--on-primary)",
        },
        secondary: {
          DEFAULT: "var(--secondary-container)",
          foreground: "var(--on-secondary-container)",
        },
        muted: {
          DEFAULT: "var(--surface-variant)",
          foreground: "var(--on-surface-variant)",
        },
        accent: {
          DEFAULT: "var(--surface-container-high)",
          foreground: "var(--on-surface)",
        },
        card: {
          DEFAULT: "var(--lt-card)",
          foreground: "var(--on-surface)",
        },
        destructive: {
          DEFAULT: "var(--lt-error)",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "var(--lt-success)",
          foreground: "#FFFFFF",
        },
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '6.5': '1.625rem',
        '7.5': '1.875rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius)",
        sm: "var(--radius-sm)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        '2xs': '0 1px rgb(0 0 0 / 0.05)',
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        card: "var(--lt-shadow)",
        floating: "var(--shadow-floating)",
        btn: "var(--shadow-btn)",
      },
    },
  },
  plugins: [],
} satisfies Config;
