"use client";

/**
 * features/match/components/LiveBattleFeed.tsx
 *
 * Feed of recent/live 1v1 battle results and ongoing matches.
 * DESIGN.md compliance:
 *  - §7    — clip-corner-all for competitive elements
 *  - §6    — font-mono for numbers, ELO, stats, and durations
 *  - §3    — accent used sparingly
 *  - §10.2 — LiveDot indicator
 */

import React from "react";
import { Swords, Trophy, Clock, Zap } from "lucide-react";

export interface LiveMatch {
  id: string;
  arenaName: string;
  p1: { name: string; elo: number; lang: string };
  p2: { name: string; elo: number; lang: string };
  problemName: string;
  difficulty: "Easy" | "Medium" | "Hard";
  winnerName: string;
  duration: string;
  eloDelta: number;
}

const DEMO_MATCHES: LiveMatch[] = [
  {
    id: "m-101",
    arenaName: "Mumbai Gauntlet",
    p1: { name: "Xenon_77", elo: 1490, lang: "C++" },
    p2: { name: "ByteCoder", elo: 1465, lang: "Python" },
    problemName: "Trapping Rain Water",
    difficulty: "Hard",
    winnerName: "Xenon_77",
    duration: "04:12",
    eloDelta: 18,
  },
  {
    id: "m-102",
    arenaName: "Bengaluru Blitz",
    p1: { name: "DevDynamo", elo: 1120, lang: "TypeScript" },
    p2: { name: "AlgoRhythm", elo: 1180, lang: "Rust" },
    problemName: "LRU Cache",
    difficulty: "Medium",
    winnerName: "AlgoRhythm",
    duration: "06:45",
    eloDelta: 24,
  },
  {
    id: "m-103",
    arenaName: "Delhi Cyberhub",
    p1: { name: "ShadowHacker", elo: 890, lang: "Go" },
    p2: { name: "CodeNinja99", elo: 915, lang: "Java" },
    problemName: "Valid Parentheses",
    difficulty: "Easy",
    winnerName: "CodeNinja99",
    duration: "01:30",
    eloDelta: 12,
  },
];

interface LiveBattleFeedProps {
  matches?: LiveMatch[];
  className?: string;
}

export function LiveBattleFeed({ matches = DEMO_MATCHES, className = "" }: LiveBattleFeedProps) {
  return (
    <div className={`clip-corner-all border border-[var(--color-border,#262626)] bg-[var(--color-surface,#121212)] p-4 ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border,#262626)] pb-3">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-[var(--color-accent,#FF5722)]" />
          <h3 className="text-sm font-semibold tracking-wide text-[var(--color-text-primary,#FFFFFF)] uppercase">
            Live Battle Feed
          </h3>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary,#A1A1AA)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-success,#22C55E)] opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-success,#22C55E)]" />
          </span>
          <span className="font-mono text-xs">LIVE</span>
        </span>
      </div>

      {/* Match Cards List */}
      <div className="flex flex-col gap-3">
        {matches.map((match) => {
          const isP1Winner = match.winnerName === match.p1.name;
          const isP2Winner = match.winnerName === match.p2.name;

          return (
            <div
              key={match.id}
              className="clip-corner-all border border-[var(--color-border,#262626)] bg-[var(--color-surface-hover,#1A1A1A)] p-3 transition-colors hover:border-[var(--color-border-hover,#404040)]"
            >
              {/* Arena & Problem info */}
              <div className="mb-2 flex items-center justify-between text-xs text-[var(--color-text-secondary,#A1A1AA)]">
                <span className="font-medium text-[var(--color-text-primary,#FFFFFF)]">{match.arenaName}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase ${
                      match.difficulty === "Easy"
                        ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800/40"
                        : match.difficulty === "Medium"
                        ? "text-amber-400 bg-amber-950/40 border border-amber-800/40"
                        : "text-rose-400 bg-rose-950/40 border border-rose-800/40"
                    }`}
                  >
                    {match.difficulty}
                  </span>
                  <span className="font-mono flex items-center gap-1 text-[11px]">
                    <Clock className="h-3 w-3" />
                    {match.duration}
                  </span>
                </div>
              </div>

              {/* Matchup row */}
              <div className="flex items-center justify-between gap-2 py-1 text-xs">
                {/* Player 1 */}
                <div className={`flex flex-1 items-center gap-1.5 ${isP1Winner ? "font-semibold text-emerald-400" : "text-[var(--color-text-secondary,#A1A1AA)]"}`}>
                  {isP1Winner && <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                  <span className="truncate">{match.p1.name}</span>
                  <span className="font-mono text-[10px] opacity-70">({match.p1.elo})</span>
                </div>

                {/* VS Badge */}
                <span className="font-mono text-[10px] text-[var(--color-text-muted,#71717A)] px-1">VS</span>

                {/* Player 2 */}
                <div className={`flex flex-1 items-center justify-end gap-1.5 ${isP2Winner ? "font-semibold text-emerald-400" : "text-[var(--color-text-secondary,#A1A1AA)]"}`}>
                  <span className="font-mono text-[10px] opacity-70">({match.p2.elo})</span>
                  <span className="truncate">{match.p2.name}</span>
                  {isP2Winner && <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                </div>
              </div>

              {/* ELO Delta */}
              <div className="mt-2 flex items-center justify-between border-t border-[var(--color-border,#262626)] pt-1.5 text-[11px] text-[var(--color-text-muted,#71717A)]">
                <span className="truncate font-mono">{match.problemName}</span>
                <span className="font-mono font-medium text-emerald-400 flex items-center gap-0.5">
                  <Zap className="h-3 w-3" />+{match.eloDelta} ELO
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
