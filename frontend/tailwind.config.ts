import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
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
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
