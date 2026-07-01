"use client";

/**
 * features/leaderboard/components/top-warrior-card.tsx
 * Podium cards for the top-3 warriors and the AnimatedPodium layout wrapper.
 * Moved to components/ per AGENTS.md feature structure.
 */

import { Trophy } from "lucide-react";
import { getTier } from "@/constants/elo-tiers";
import { useScrollReveal } from "../hooks/use-scroll-reveal";
import type { LeaderboardEntry } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function winRate(wins: number, matches: number) {
  if (matches === 0) return "—";
  return `${Math.round((wins / matches) * 100)}%`;
}

// ─── TopWarriorCard ───────────────────────────────────────────────────────────

export function TopWarriorCard({
  user,
  position,
  trophyColor,
  delay,
}: {
  user:        LeaderboardEntry;
  position:    number;
  trophyColor: string;
  delay:       number;
}) {
  const [ref, visible] = useScrollReveal<HTMLDivElement>(0.1);
  const wr   = winRate(user.wins, user.matches_played);
  const tier = getTier(user.elo_tier);

  return (
    <div
      ref={ref}
      className="relative flex flex-col overflow-hidden rounded-xl border border-cw-border bg-cw-surface min-h-[160px]"
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 350ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 350ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {/* Rank-colored top accent strip */}
      <div className="h-[3px] w-full flex-shrink-0" style={{ background: trophyColor }} />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header: Position + Avatar + Name + Trophy */}
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-xl font-black leading-none tabular-nums w-5 flex-shrink-0 opacity-80"
            style={{ color: trophyColor }}
          >
            {position}
          </span>

          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-cw-border bg-cw-surface-2 flex-shrink-0 flex items-center justify-center font-bold text-sm text-cw-text-secondary">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              getInitials(user.username)
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-cw-text-primary text-sm truncate leading-tight">
              {user.username}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: trophyColor }} />
              <span className="text-[10px] font-medium text-cw-text-tertiary uppercase tracking-wider">
                {tier.label}
              </span>
            </div>
          </div>

          <Trophy className="w-3.5 h-3.5 flex-shrink-0 opacity-40" style={{ color: trophyColor }} />
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 border-t border-cw-border pt-3">
          <div className="pr-3">
            <div className="text-[9px] font-semibold uppercase tracking-widest text-cw-text-tertiary mb-1">W&nbsp;/&nbsp;L</div>
            <div className="font-mono text-xs font-bold text-cw-text-primary tabular-nums">{user.wins}&nbsp;–&nbsp;{user.losses}</div>
          </div>

          <div className="px-3 border-x border-cw-border">
            <div className="text-[9px] font-semibold uppercase tracking-widest text-cw-text-tertiary mb-1">Winrate</div>
            <div className="font-mono text-xs font-bold text-cw-text-primary tabular-nums">{wr}</div>
            <div className="w-full h-[2px] bg-cw-surface-2 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: wr === "—" ? "0%" : wr, background: "var(--color-success)" }}
              />
            </div>
          </div>

          <div className="pl-3">
            <div className="text-[9px] font-semibold uppercase tracking-widest text-cw-text-tertiary mb-1">ELO</div>
            <div className="font-mono text-xs font-black tabular-nums" style={{ color: trophyColor }}>
              {user.elo.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AnimatedPodium ───────────────────────────────────────────────────────────

export function AnimatedPodium({ top3 }: { top3: LeaderboardEntry[] }) {
  const [first, second, third] = top3;
  return (
    <section className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {first  && <TopWarriorCard user={first}  position={1} trophyColor="var(--color-tier-gold)"    delay={0} />}
        {second && <TopWarriorCard user={second} position={2} trophyColor="var(--color-tier-silver)"  delay={100} />}
        {third  && <TopWarriorCard user={third}  position={3} trophyColor="var(--color-tier-bronze)"  delay={200} />}
      </div>
    </section>
  );
}
