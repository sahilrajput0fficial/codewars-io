"use client";

/**
 * app/play/page.tsx — Arena Selection / Matchmaking
 *
 * Wraps with the app's shared Sidebar + Navbar layout (same as leaderboard).
 * Bento arena grid with atmospheric tier backgrounds, selected expansion,
 * match conditions panel, leaderboard panel, and queue overlay state.
 *
 * DESIGN.md compliance:
 *  §3  — accent on CTA button only
 *  §5  — tier colors as top-border & text labels, never fills
 *  §7  — clip-path angular corner on competitive elements
 *  §10.2 — LiveDot on online counts
 *  §10.5 — rise-in entrance on content panels
 *  §10.6 — count-tick on fluctuating player counts
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Swords,
  Clock,
  Globe,
  TrendingUp,
  Users,
  X,
  Zap,
  Trophy,
  Lock,
  Play,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import {
  ARENA_LEVELS,
  ArenaLevel,
  DEMO_LEADERBOARD,
} from "@/features/match/constants";
import { FriendlyFireCard } from "@/features/match/components/FriendlyFireCard";


/* ─── Demo constants ─────────────────────────────────────────────────────── */
const DEMO_USER_ELO = 1050;

/* ─── Live-status dot (DESIGN.md §10.2) ─────────────────────────────────── */
function LiveDot({ color = "var(--color-success)" }: { color?: string }) {
  return (
    <span className="relative inline-flex h-2 w-2 flex-shrink-0">
      <span
        className="absolute inline-flex h-full w-full rounded-full animate-[ring-ping_1.6s_cubic-bezier(0.4,0,0.2,1)_infinite]"
        style={{ backgroundColor: color, opacity: 0.7 }}
      />
      <span
        className="relative inline-flex h-2 w-2 rounded-full animate-[pulse-live_1.8s_ease-in-out_infinite]"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Page                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function PlayPage() {
  const [selectedId, setSelectedId] = useState("mumbai");
  const [isQueuing, setIsQueuing] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(ARENA_LEVELS.map((a) => [a.id, a.onlinePlayers]))
  );
  const [ticking, setTicking] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const arena = ARENA_LEVELS[Math.floor(Math.random() * ARENA_LEVELS.length)];
      const delta = Math.random() > 0.5 ? 1 : -1;
      setCounts((prev) => ({
        ...prev,
        [arena.id]: Math.max(1, (prev[arena.id] ?? 0) + delta),
      }));
      setTicking(arena.id);
      setTimeout(() => setTicking(null), 150);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const totalOnline = Object.values(counts).reduce((a, b) => a + b, 0);
  const selected = ARENA_LEVELS.find((a) => a.id === selectedId)!;

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}
    >
      {/* ── Shared sidebar ─────────────────────────────────────────────── */}
      <Sidebar />

      {/* ── Main column ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-screen pb-24 overflow-x-hidden">
        {/* ── Shared top navbar ────────────────────────────────────────── */}
        <Navbar
          breadcrumbs={[
            { label: "Play", href: "/play" },
            { label: "Arena Selection" },
          ]}
        />

        {/* ── Page body ────────────────────────────────────────────────── */}
        <div className="px-6 pt-6">
          {/* Hero title row */}
          <div
            className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6 animate-[rise-in_220ms_cubic-bezier(0.16,1,0.3,1)_both]"
          >
            <div>
              <h1 className="font-sans font-bold text-3xl md:text-4xl uppercase tracking-tighter text-[var(--color-text-primary)]">
                Arena Selection
              </h1>
              <p className="font-mono text-[11px] text-[var(--color-text-secondary)] mt-2 max-w-md uppercase tracking-wider">
                Choose your theater of engagement. Higher arenas demand superior
                tactical efficiency and reward massive ELO gains.
              </p>
            </div>

            {/* Online pill (DESIGN.md §10.2) */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)]">
              <LiveDot />
              <span className="font-mono text-[11px] text-[var(--color-success)] uppercase tracking-widest">
                <span
                  key={totalOnline}
                  className="inline-block"
                  style={{ animation: ticking ? "count-tick 150ms ease-out" : undefined }}
                >
                  {totalOnline.toLocaleString()}
                </span>{" "}
                Warriors Online
              </span>
            </div>
          </div>

          {isQueuing ? (
            /* ── Queue overlay ─────────────────────────────────────────── */
            <QueueOverlay
              arena={selected}
              count={counts[selected.id] ?? selected.onlinePlayers}
              onCancel={() => setIsQueuing(false)}
            />
          ) : (
            <>
              {/* ── Bento arena grid ──────────────────────────────────── */}
              <div
                className="grid grid-cols-1 md:grid-cols-4 gap-3"
                style={{ animation: "rise-in 220ms cubic-bezier(0.16,1,0.3,1) 60ms both" }}
              >
                {ARENA_LEVELS.map((arena, idx) => (
                  <ArenaCard
                    key={arena.id}
                    arena={arena}
                    isSelected={selectedId === arena.id}
                    isLocked={DEMO_USER_ELO < arena.eloMin}
                    liveCount={counts[arena.id] ?? arena.onlinePlayers}
                    isTicking={ticking === arena.id}
                    onSelect={() => setSelectedId(arena.id)}
                    onFindMatch={() => setIsQueuing(true)}
                    animDelay={idx * 70}
                  />
                ))}
              </div>

              {/* ── Friendly Fire Card (Width equal to 4 Arena Cards) ─────── */}
              <div className="mt-4">
                <FriendlyFireCard
                  onJoinMatch={(code) => {
                    setIsQueuing(true);
                  }}
                  onCreateMatch={(code) => {
                    console.log(`Created friendly match with code: ${code}`);
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Arena Card                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

interface ArenaCardProps {
  arena: ArenaLevel;
  isSelected: boolean;
  isLocked: boolean;
  liveCount: number;
  isTicking: boolean;
  onSelect: () => void;
  onFindMatch: () => void;
  animDelay: number;
}

function ArenaCard({
  arena,
  isSelected,
  isLocked,
  liveCount,
  isTicking,
  onSelect,
  onFindMatch,
  animDelay,
}: ArenaCardProps) {
  const { tierHex, bgGradient, bgImage, bgVideo, tierLabel, name, eloMin, avgEloGain, difficulty } = arena;

  // Video ref — controlled imperatively so hover start/stop is instant
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [videoVisible, setVideoVisible] = React.useState(false);

  function handleMouseEnter() {
    if (!bgVideo || !videoRef.current) return;
    setVideoVisible(true);
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {/* autoplay blocked — silently ignore */});
  }

  function handleMouseLeave() {
    if (!bgVideo || !videoRef.current) return;
    setVideoVisible(false);
    videoRef.current.pause();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      aria-pressed={isSelected}
      aria-label={`Select ${name} arena`}
      className={[
        "relative overflow-hidden cursor-pointer select-none",
        "min-h-[260px] md:h-[540px]",
        "transition-transform duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        isSelected ? "outline outline-1 outline-offset-[-1px]" : "outline-none",
        isLocked ? "opacity-60" : "hover:-translate-y-1",
      ].join(" ")}
      style={{
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
        outlineColor: isSelected ? tierHex : "transparent",
        boxShadow: isSelected ? `0 0 24px 2px ${tierHex}30` : "none",
        animation: `rise-in 220ms cubic-bezier(0.16,1,0.3,1) ${animDelay}ms both`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Layer 1 — CSS gradient fallback (always present, sits furthest back) */}
      <div className="absolute inset-0" style={{ background: bgGradient }} />

      {/* Layer 2 — Static poster image (default visible state) */}
      {bgImage && (
        <img
          src={bgImage}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{
            // Fade out slightly when video is playing so crossfade looks clean
            opacity: videoVisible ? 0.3 : 1,
            transition: "opacity 500ms ease",
          }}
        />
      )}

      {/* Layer 3 — Cinematic video (plays on hover, fades in/out over the image) */}
      {bgVideo && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          style={{
            opacity: videoVisible ? 1 : 0,
            transition: "opacity 500ms ease",
          }}
        >
          <source src={bgVideo} type="video/webm" />
          {/* mp4 fallback — drop /arenas/*.mp4 alongside .webm for Safari */}
          <source src={bgVideo.replace(".webm", ".mp4")} type="video/mp4" />
        </video>
      )}

      {/* Dark overlay — sits over all artwork for 100% text legibility */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Bottom-to-center gradient scrim — ensures white text stands out crystal clear over arena media */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 via-50% to-transparent" />

      {/* Tier top border (DESIGN.md §5 — border only) */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: tierHex }} />

      {/* Header row — "SELECTED" badge & ELO gain on same baseline with consistent 20px edge margin */}
      {isSelected && (
        <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-20 pointer-events-none">
          <div
            className="px-2.5 py-1 border font-mono text-[10px] font-semibold uppercase tracking-widest bg-black/60 backdrop-blur-sm shadow-sm"
            style={{ borderColor: tierHex, color: tierHex }}
          >
            SELECTED
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm border border-[rgba(255,255,255,0.12)] shadow-sm">
            <span className="font-mono text-xs font-semibold" style={{ color: tierHex }}>
              ELO +{avgEloGain}
            </span>
            <span className="font-mono text-[10px] text-gray-300 uppercase tracking-wider">
              / AVG WIN
            </span>
          </div>
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6 z-10">
        <div
          className="font-mono text-xs font-bold uppercase tracking-[0.2em] mb-1 text-shadow"
          style={{ color: tierHex }}
        >
          {tierLabel}
        </div>
        <h2 className="font-sans font-extrabold text-2xl md:text-3xl uppercase tracking-tight text-white leading-none drop-shadow-md">
          {name}
        </h2>

        {isSelected ? (
          /* Expanded state */
          <div className="mt-4 flex flex-col gap-4" style={{ animation: "rise-in 180ms cubic-bezier(0.16,1,0.3,1) both" }}>
            {/* Stat grid (equal internal padding, matching height, aligned text) */}
            <div className="grid grid-cols-2 gap-3">
              <StatCell label="Latency" value="12ms (Prime)" />
              <StatCell label="Activity" value="HIGH" />
            </div>

            {/* Queue indicator — clean vertical spacing */}
            <div className="flex items-center gap-2 py-0.5">
              <LiveDot />
              <span
                key={liveCount}
                className="font-mono text-xs font-semibold text-[var(--color-success)]"
                style={isTicking ? { animation: "count-tick 150ms ease-out" } : undefined}
              >
                {liveCount}
              </span>
              <span className="font-mono text-[11px] text-[var(--color-text-secondary)] uppercase tracking-wider">
                IN QUEUE
              </span>
            </div>

            {/* CTA button — high impact battle action button */}
            <button
              onClick={(e) => { e.stopPropagation(); if (!isLocked) onFindMatch(); }}
              disabled={isLocked}
              className={[
                "relative group overflow-hidden w-full py-3.5 px-4 font-mono text-xs uppercase tracking-[0.18em]",
                "flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98]",
                !isLocked
                  ? "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-text-on-accent)] font-extrabold shadow-[0_4px_20px_rgba(234,179,8,0.25)] hover:shadow-[0_4px_28px_rgba(234,179,8,0.45)] border border-[var(--color-accent)] cursor-pointer"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-border)] font-semibold cursor-not-allowed opacity-90",
              ].join(" ")}
              style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
            >
              {!isLocked && (
                <span className="absolute inset-0 w-1/2 bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 pointer-events-none" />
              )}
              {isLocked ? (
                <>
                  <Lock size={14} className="text-[var(--color-text-secondary)]" />
                  <span>REQUIRES ELO {eloMin}+</span>
                </>
              ) : (
                <>
                  <Swords size={15} className="text-[var(--color-text-on-accent)] transition-transform group-hover:rotate-12" />
                  <span>FIND MATCH</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Collapsed footer */
          <div
            className="mt-3 flex justify-between items-center border-t pt-2 font-mono text-[11px] text-[var(--color-text-secondary)] border-[var(--color-border)]"
          >
            <span>Min ELO: {eloMin}</span>
            <span className={isLocked ? "text-[var(--color-danger)] uppercase tracking-wider text-[10px]" : "text-[10px]"}>
              {isLocked ? "Locked" : difficulty}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="p-3 border border-[var(--color-border)] bg-[var(--color-surface)]/90 dark:bg-black/60 backdrop-blur-sm flex flex-col justify-between h-[54px]"
      style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)" }}
    >
      <span className="font-mono text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider block leading-none">
        {label}
      </span>
      <span className="font-mono text-xs font-semibold text-[var(--color-success)] tracking-tight leading-none">
        {value}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Match Conditions Panel                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Match Conditions Panel                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

function MatchConditionsPanel({ arena }: { arena: ArenaLevel }) {
  const [queueSecs, setQueueSecs] = useState(42);
  useEffect(() => {
    const id = setInterval(() => {
      setQueueSecs((p) => Math.max(10, p + (Math.random() > 0.5 ? 3 : -5)));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const rows = [
    {
      icon: <Clock size={15} className="text-[var(--color-text-secondary)]" />,
      label: "Est. Queue Time",
      value: `${String(Math.floor(queueSecs / 60)).padStart(2, "0")}:${String(queueSecs % 60).padStart(2, "0")}s`,
      badge: "LIVE TICK",
    },
    {
      icon: <Globe size={15} className="text-[var(--color-text-secondary)]" />,
      label: "Active Region",
      value: "EU-CENTRAL",
      badge: "LOW LATENCY",
    },
    {
      icon: <TrendingUp size={15} className="text-[var(--color-text-secondary)]" />,
      label: "XP Multiplier",
      value: "1.5× BONUS",
      accent: true,
    },
  ];

  return (
    <div
      className="relative bg-[var(--color-surface)] border border-[var(--color-border)] p-5 md:p-6 flex flex-col justify-between overflow-hidden shadow-lg"
      style={{
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)",
      }}
    >
      {/* Top accent bar matching selected arena tier */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ backgroundColor: arena.tierHex }}
      />

      <div className="flex flex-col gap-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs font-semibold text-[var(--color-accent)] uppercase tracking-widest flex items-center gap-2">
            <Zap size={14} className="text-[var(--color-accent)]" />
            Match Conditions
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface-2)]">
            REALTIME
          </span>
        </div>

        {/* Condition Rows */}
        <div className="flex flex-col divide-y divide-[var(--color-border)] border-t border-b border-[var(--color-border)]">
          {rows.map(({ icon, label, value, accent, badge }) => (
            <div key={label} className="flex justify-between items-center py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                  {icon}
                </div>
                <span className="font-sans text-xs font-medium text-[var(--color-text-primary)]">
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {badge && (
                  <span className="font-mono text-[9px] px-1.5 py-0.5 text-[var(--color-text-secondary)] bg-[var(--color-surface-2)] border border-[var(--color-border)] uppercase tracking-widest hidden sm:inline-block">
                    {badge}
                  </span>
                )}
                <span
                  className="font-mono text-xs font-semibold"
                  style={{ color: accent ? "var(--color-success)" : "var(--color-text-primary)" }}
                >
                  {value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Arena Pill */}
      <div
        className="mt-4 flex items-center justify-between p-3 border border-[var(--color-border)] bg-[var(--color-surface-2)]"
        style={{
          clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: arena.tierHex }}
          />
          <span className="font-mono text-[11px] text-[var(--color-text-primary)] font-semibold uppercase tracking-wider">
            {arena.name}
          </span>
        </div>
        <span className="font-mono text-[10px] text-[var(--color-text-secondary)] uppercase tracking-widest">
          {arena.timeLimitMin}M · {arena.difficulty}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Leaderboard Panel                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

function LeaderboardPanel({ arena }: { arena: ArenaLevel }) {
  // Rank badge styling for top 3 contenders
  const rankColors: Record<string, string> = {
    "01": "#C9A227", // Gold
    "02": "#9CA3AF", // Silver
    "03": "#8B6543", // Bronze
  };

  return (
    <div
      className="md:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] p-5 md:p-6 relative overflow-hidden flex flex-col justify-between shadow-lg"
      style={{
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)",
      }}
    >
      {/* Ambient background glow matching selected arena */}
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-[0.07] pointer-events-none"
        style={{ backgroundColor: arena.tierHex }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--color-border)]">
          <div>
            <h3 className="font-mono text-xs font-semibold text-[var(--color-accent)] uppercase tracking-widest flex items-center gap-2">
              <Trophy size={14} className="text-[var(--color-accent)]" />
              Regional Leaderboard:{" "}
              <span style={{ color: arena.tierHex }}>
                {arena.tier.toUpperCase()} DIVISION
              </span>
            </h3>
            <p className="font-mono text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider mt-0.5">
              Top gladiators competing in {arena.name}
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="font-mono text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] uppercase tracking-wider transition-colors duration-[150ms] flex items-center gap-1 self-start sm:self-auto hover:underline"
          >
            Full Rankings →
          </Link>
        </div>

        {/* Leaderboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {DEMO_LEADERBOARD.map(({ rank, name, elo }) => {
            const rankAccent = rankColors[rank] || "var(--color-text-secondary)";
            return (
              <div
                key={rank}
                className="group flex items-center justify-between p-2.5 bg-[var(--color-surface-2)]/60 dark:bg-black/40 border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:translate-x-0.5 transition-all duration-[150ms] cursor-pointer"
                style={{
                  clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)",
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <span
                    className="font-mono text-xs font-bold w-6 text-center"
                    style={{ color: rankAccent }}
                  >
                    {rank}
                  </span>

                  {/* Avatar container */}
                  <div
                    className="w-8 h-8 flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface-2)] group-hover:border-[var(--color-accent)] transition-colors"
                    style={{
                      clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%)",
                    }}
                  >
                    <Users size={13} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors" />
                  </div>

                  {/* Player Name */}
                  <span className="font-sans text-xs font-semibold text-[var(--color-text-primary)] group-hover:text-white transition-colors">
                    {name}
                  </span>
                </div>

                {/* ELO Stat */}
                <div className="text-right">
                  <span className="font-mono text-xs font-semibold text-[var(--color-text-primary)] block leading-none">
                    {elo.toLocaleString()}
                  </span>
                  <span className="font-mono text-[9px] text-[var(--color-text-secondary)] uppercase tracking-wider">
                    ELO
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decorative watermark icon */}
      <div className="absolute bottom-2 right-4 opacity-[0.03] pointer-events-none select-none">
        <Trophy size={110} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Queue Overlay                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

function QueueOverlay({ arena, count, onCancel }: { arena: ArenaLevel; count: number; onCancel: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((p) => p + 1);
      setTick(true);
      setTimeout(() => setTick(false), 150);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const { tierHex, tierLabel, name, difficulty } = arena;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="flex flex-col items-center justify-center min-h-[480px] gap-8" style={{ animation: "rise-in 220ms cubic-bezier(0.16,1,0.3,1) both" }}>
      {/* Pulsing ring (DESIGN.md §10.2 — the ONE looping animation) */}
      <div className="relative flex items-center justify-center">
        <span className="absolute h-28 w-28 rounded-full border-2 animate-[ring-ping_1.6s_cubic-bezier(0.4,0,0.2,1)_infinite]" style={{ borderColor: tierHex }} />
        <span className="absolute h-20 w-20 rounded-full border animate-[ring-ping_1.6s_cubic-bezier(0.4,0,0.2,1)_0.3s_infinite] opacity-50" style={{ borderColor: tierHex }} />
        <span
          className="relative flex h-12 w-12 items-center justify-center border-2 animate-[pulse-live_1.8s_ease-in-out_infinite]"
          style={{ borderColor: tierHex, clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
        >
          <Swords size={18} style={{ color: tierHex }} />
        </span>
      </div>

      {/* Status */}
      <div className="text-center space-y-1">
        <p className="font-sans font-semibold text-lg text-[var(--color-text-primary)]">
          Searching for opponent
        </p>
        <div className="flex items-center justify-center gap-2">
          <span
            className="font-mono text-[11px] uppercase tracking-widest"
            style={{ color: tierHex }}
          >
            {tierLabel}
          </span>
          <span className="text-[var(--color-text-secondary)] text-[11px]">·</span>
          <span className="font-mono text-[11px] text-[var(--color-text-secondary)]">
            {name}
          </span>
          <span className="text-[var(--color-text-secondary)] text-[11px]">·</span>
          <span className="font-mono text-[11px] text-[var(--color-text-secondary)]">
            {difficulty}
          </span>
        </div>
      </div>

      {/* Elapsed timer (DESIGN.md §10.6 — count-tick) */}
      <div className="font-mono text-[var(--color-text-secondary)] text-sm tabular-nums">
        <span
          key={elapsed}
          className="inline-block"
          style={tick ? { animation: "count-tick 150ms ease-out" } : undefined}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
        <span className="ml-2 text-[var(--color-text-secondary)]">elapsed</span>
      </div>

      {/* Online count */}
      <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-secondary)]">
        <LiveDot />
        <span className="text-[var(--color-success)]">{count}</span>
        <span>players online in this arena</span>
      </div>

      {/* Cancel — accent border (DESIGN.md §3 item 2) */}
      <button
        onClick={onCancel}
        className="flex items-center gap-2 border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-muted)] transition-colors duration-[150ms] px-5 py-2.5 font-mono text-xs uppercase tracking-widest active:scale-95"
        style={{
          clipPath:
            "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)",
        }}
        aria-label="Cancel matchmaking"
      >
        <X size={13} />
        Cancel Search
      </button>
    </div>
  );
}
