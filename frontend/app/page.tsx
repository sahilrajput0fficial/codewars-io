"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { ArrowRight, Trophy, Code, Shield, Swords } from "lucide-react";


// ─── Animated stat bar used in the hero section ────────────────────────────────

function AnimatedBar({
  label,
  value,
  height,
  color,
  delay,
}: {
  label: string;
  value: string;
  height: number;   // % of the container
  color: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Hero bars animate on mount (they're above the fold)
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="flex flex-col items-center gap-2" style={{ flex: 1 }}>
      {/* Value label above bar */}
      <p
        className="font-mono text-xs font-black tabular-nums"
        style={{
          color,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-6px)",
          transition: `opacity 300ms cubic-bezier(0.16,1,0.3,1) ${delay + 200}ms, transform 300ms cubic-bezier(0.16,1,0.3,1) ${delay + 200}ms`,
        }}
      >
        {value}
      </p>

      {/* Bar track */}
      <div
        className="w-full relative overflow-hidden"
        style={{
          height: 160,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Filled portion — grows upward */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            background: color,
            height: visible ? `${height}%` : "0%",
            transition: `height 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
          }}
        />
      </div>

      {/* Label below bar */}
      <p
        className="text-[9px] font-black tracking-widest text-center"
        style={{
          color: "var(--color-text-tertiary)",
          opacity: visible ? 1 : 0,
          transition: `opacity 300ms ease ${delay + 400}ms`,
        }}
      >
        {label}
      </p>
    </div>
  );
}

// ─── Animated feature card ─────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="p-6 space-y-3"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        clipPath: "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 300ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 300ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      <div
        className="w-10 h-10 flex items-center justify-center"
        style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)",
        }}
      >
        <Icon className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
      </div>
      <h3
        className="text-base font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {description}
      </p>
    </div>
  );
}

// ─── Home page ─────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center relative overflow-hidden font-sans"
      style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}
    >
      {/* Navigation */}
      <nav
        className="w-full flex justify-center h-16 sticky top-0 z-50"
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="w-full max-w-5xl flex justify-between items-center px-6">
          {/* Wordmark */}
          <div className="flex items-center gap-2 font-bold">
            <Swords
              className="w-4 h-4"
              style={{ color: "var(--color-accent)" }}
            />
            <span
              className="text-sm tracking-wider font-black"
              style={{ color: "var(--color-text-primary)" }}
            >
              code<span style={{ color: "var(--color-accent)" }}>{">"}</span>wars
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-semibold transition-colors duration-fast ease-snap"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Sign in
            </Link>
            <Link
              href="/auth/login"
              className="px-4 py-1.5 text-sm font-black tracking-wider transition-colors duration-fast ease-snap"
              style={{
                background: "var(--color-accent)",
                color: "var(--color-text-on-accent)",
                clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
              }}
            >
              ENTER ARENA
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="w-full max-w-5xl px-6 pt-16 pb-12 relative z-10"
        style={{ animation: "rise-in 220ms cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left: Copy */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Live badge */}
            <div className="flex items-center gap-2">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] animate-[ring-ping_1.6s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-success)] animate-[pulse-live_1.8s_ease-in-out_infinite]" />
              </span>
              <span
                className="text-[10px] font-black tracking-widest"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                ARENA LIVE · RANKED 1v1
              </span>
            </div>

            {/* Headline */}
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]"
              style={{ color: "var(--color-text-primary)" }}
            >
              The Ranked<br />
              <span style={{ color: "var(--color-accent)" }}>1v1 Coding</span><br />
              Arena
            </h1>

            <p
              className="text-base leading-relaxed max-w-md"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Challenge opponents of equal skill. Solve DSA problems under
              pressure. Earn ELO. Climb the global leaderboard.
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="flex items-center gap-2 px-6 py-3 text-sm font-black tracking-wider transition-colors duration-fast"
                style={{
                  background: "var(--color-accent)",
                  color: "var(--color-text-on-accent)",
                  clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                }}
              >
                Find a Match <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#features"
                className="px-6 py-3 text-sm font-semibold transition-colors duration-fast"
                style={{
                  background: "var(--color-surface)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border)",
                  clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                }}
              >
                View Features
              </Link>
            </div>
          </div>

          {/* Right: Animated ELO bar chart — the "alive" visual */}
          <div className="flex-shrink-0 w-full max-w-xs lg:max-w-sm">
            <div className="flex items-end gap-2">
              {/* Bar 1 — Wins */}
              <AnimatedBar
                label="WINS"
                value="1,204"
                height={75}
                color="var(--color-success)"
                delay={100}
              />
              {/* Bar 2 — ELO (tallest — this is the key stat) */}
              <AnimatedBar
                label="ELO"
                value="2,847"
                height={100}
                color="var(--color-tier-gold)"
                delay={0}
              />
              {/* Bar 3 — Matches */}
              <AnimatedBar
                label="MATCHES"
                value="1,891"
                height={88}
                color="var(--color-tier-silver)"
                delay={160}
              />
              {/* Bar 4 — Win rate */}
              <AnimatedBar
                label="WIN RATE"
                value="63%"
                height={63}
                color="var(--color-accent)"
                delay={240}
              />
            </div>

            {/* Base line */}
            <div
              className="h-px w-full mt-0"
              style={{ background: "var(--color-border)" }}
            />

            {/* Caption */}
            <p
              className="text-[9px] font-black tracking-widest mt-2 text-right"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              TOP WARRIOR · GLOBAL #1
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        className="w-full max-w-5xl px-6"
        style={{ borderTop: "1px solid var(--color-border)" }}
      />

      {/* ── Features Grid ─────────────────────────────────────────────── */}
      <section id="features" className="w-full max-w-5xl px-6 py-16 relative z-10">
        <div
          className="flex items-center gap-3 mb-8"
          style={{ animation: "rise-in 220ms cubic-bezier(0.16,1,0.3,1) 60ms both" }}
        >
          <div
            className="w-0.5 h-4 flex-shrink-0"
            style={{ background: "var(--color-accent)" }}
          />
          <p
            className="text-[10px] font-black tracking-widest"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            PLATFORM FEATURES
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            icon={Code}
            title="Head-to-Head Duels"
            description="Match with opponents of similar ELO. Code fast, debug smart, submit first. No time to waste."
            delay={0}
          />
          <FeatureCard
            icon={Trophy}
            title="ELO Rating"
            description="Every match adjusts your ELO. Win streaks accelerate your climb. Losses are calculated fairly."
            delay={80}
          />
          <FeatureCard
            icon={Shield}
            title="Global Leaderboard"
            description="Track rank history, compare stats, and see exactly where you stand against every warrior worldwide."
            delay={160}
          />
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer
        className="w-full max-w-5xl px-6 py-8 flex items-center justify-between"
        style={{
          borderTop: "1px solid var(--color-border)",
          color: "var(--color-text-tertiary)",
        }}
      >
        <p className="text-xs font-mono">© 2026 CodeWars.IO</p>
        <p className="text-[10px] tracking-widest font-black">
          code<span style={{ color: "var(--color-accent)" }}>{">"}</span>wars
        </p>
      </footer>
    </main>
  );
}
