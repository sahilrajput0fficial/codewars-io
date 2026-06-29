import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── DESIGN.md §6 — typography ──────────────────────────────────────
      fontFamily: {
        sans: ["var(--font-inter)", "Arial", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "Courier New", "monospace"],
      },

      colors: {
        // ── shadcn/ui tokens (keep untouched) ───────────────────────────
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },

        // ── DESIGN.md §1 tokens ─────────────────────────────────────────
        // Tailwind prefix: `cw-*`  (avoids collision with built-in names)
        // CSS variable:   `--color-*`  (matches DESIGN.md exactly)
        //
        // Usage:  className="bg-cw-surface text-cw-text-primary"
        //         style={{ color: "var(--color-accent)" }}    ← inline style
        cw: {
          bg:              "var(--color-bg)",
          surface:         "var(--color-surface)",
          "surface-2":     "var(--color-surface-2)",
          border:          "var(--color-border)",
          "text-primary":  "var(--color-text-primary)",
          "text-secondary":"var(--color-text-secondary)",
          "text-tertiary": "var(--color-text-tertiary)",
          "text-on-accent":"var(--color-text-on-accent)",
          accent:          "var(--color-accent)",
          "accent-hover":  "var(--color-accent-hover)",
          "accent-muted":  "var(--color-accent-muted)",
          success:         "var(--color-success)",
          warning:         "var(--color-warning)",
          danger:          "var(--color-danger)",
        },
        // Tier colors — icons/borders/badges only, never large fills
        tier: {
          bronze:  "var(--color-tier-bronze)",
          silver:  "var(--color-tier-silver)",
          gold:    "var(--color-tier-gold)",
          diamond: "var(--color-tier-diamond)",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // ── DESIGN.md §10.1 — Motion tokens ────────────────────────────────
      transitionTimingFunction: {
        snap:   "cubic-bezier(0.4, 0, 0.2, 1)",
        settle: "cubic-bezier(0.16, 1, 0.3, 1)",
        sharp:  "cubic-bezier(0.7, 0, 0.84, 0)",
      },
      transitionDuration: {
        instant: "100ms",
        fast:    "150ms",
        base:    "220ms",
        slow:    "400ms",
        ambient: "900ms",
      },

      // ── DESIGN.md §10 — Keyframes ───────────────────────────────────────
      keyframes: {
        "pulse-live": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.4" },
        },
        "ring-ping": {
          "0%":   { transform: "scale(0.9)", opacity: "0.7" },
          "70%":  { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "tick-flash": {
          "0%":   { color: "var(--color-text-primary)" },
          "40%":  { color: "var(--color-accent)" },
          "100%": { color: "var(--color-text-primary)" },
        },
        "rise-in": {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "count-tick": {
          "0%":   { transform: "translateY(-2px)", opacity: "0.4" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },

        // ── Podium animations ────────────────────────────────────────────
        "avatar-bob": {
          "0%, 100%": { transform: "translateY(0px)"  },
          "30%":      { transform: "translateY(-6px)" },
          "60%":      { transform: "translateY(-2px)" },
        },
        "crown-float": {
          "0%, 100%": { transform: "translateY(0px) rotate(-3deg)" },
          "50%":      { transform: "translateY(-5px) rotate(3deg)" },
        },
        "bar-shimmer": {
          "0%":   { opacity: "0",   transform: "translateX(-100%)" },
          "40%":  { opacity: "0.6" },
          "100%": { opacity: "0",   transform: "translateX(100%)"  },
        },
        "rank-beat": {
          "0%":   { transform: "scale(1)"    },
          "40%":  { transform: "scale(1.18)" },
          "70%":  { transform: "scale(0.96)" },
          "100%": { transform: "scale(1)"    },
        },
      },

      // ── DESIGN.md §10 — Animation utilities ─────────────────────────────
      animation: {
        "pulse-live":   "pulse-live 1.8s ease-in-out infinite",
        "ring-ping":    "ring-ping 1.6s cubic-bezier(0.4,0,0.2,1) infinite",
        "tick-flash":   "tick-flash 600ms ease-out",
        "rise-in":      "rise-in 220ms cubic-bezier(0.16,1,0.3,1) both",
        "count-tick":   "count-tick 150ms ease-out both",
        "fade-in":      "fade-in 400ms cubic-bezier(0.16,1,0.3,1) both",
        // Podium
        "avatar-bob":   "avatar-bob 2.4s cubic-bezier(0.4,0,0.2,1) infinite",
        "crown-float":  "crown-float 2.8s cubic-bezier(0.4,0,0.2,1) infinite",
        "bar-shimmer":  "bar-shimmer 900ms cubic-bezier(0.16,1,0.3,1) forwards",
        "rank-beat":    "rank-beat 500ms cubic-bezier(0.16,1,0.3,1) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
