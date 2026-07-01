"use client";

/**
 * features/leaderboard/components/leaderboard-header.tsx
 * Full-bleed hero banner at the top of the leaderboard page.
 * Moved to components/ per AGENTS.md feature structure.
 */

import { useState } from "react";
import { Bookmark, RefreshCw, UserPlus } from "lucide-react";
import type { LeaderboardEntry } from "../types";
import { CountdownTimer } from "./countdown-timer";

interface LeaderboardHeaderProps {
  me: LeaderboardEntry | null;
}

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

export function LeaderboardHeader({ me }: LeaderboardHeaderProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const initials = me ? getInitials(me.username) : "CW";

  return (
    <div
      className="dark relative w-full overflow-hidden border-b border-cw-border h-80"
      style={{ animation: "rise-in 220ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
    >
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 pointer-events-none"
        style={{ backgroundImage: "url('/leaderboard_banner.png')" }}
      />
      <div className="absolute inset-0 bg-black/70 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* ASCII decoration */}
      <div
        className="absolute right-8 top-6 opacity-[0.05] font-mono text-[10px] select-none pointer-events-none hidden lg:block z-0"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <pre>{`const leaderboard = new Arena({\n  mode: "1v1",\n  ranked: true,\n  reset: "daily"\n});`}</pre>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full px-6 md:px-8 py-6">
        {/* Top row: Timer */}
        <div className="flex justify-end">
          <CountdownTimer />
        </div>

        {/* Bottom row: Avatar / Title / Buttons */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="relative w-16 h-16 rounded-full border border-cw-accent/60 flex items-center justify-center p-0.5 bg-cw-bg">
                <div className="relative w-full h-full rounded-full flex items-center justify-center font-bold text-base select-none bg-cw-surface-2 border border-cw-accent text-cw-text-primary overflow-hidden">
                  {me?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={me.avatar_url} alt={me.username} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
              </div>
            </div>

            <div>
              <h1 className="text-3xl md:text-2xl font-bold tracking-tight mb-1 text-white drop-shadow-sm">
                Inside the Fire
              </h1>
              <p className="text-sm max-w-xl leading-relaxed text-white/80 text-wrap drop-shadow-sm">
                The CodeWars elite DSA matchmaking ladder. Duel opponents in real-time,
                optimize algorithms under pressure, and reach the Challenger tier.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-white/15 hover:bg-white/10 text-white/80 hover:text-white bg-black/40 backdrop-blur-sm transition-colors"
              title="Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-current stroke-current" : ""}`} />
            </button>

            <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full border border-white/15 hover:bg-white/10 text-white/80 hover:text-white bg-black/40 backdrop-blur-sm transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              Upgrade my data
            </button>

            <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full border border-white/15 hover:bg-white/10 text-white/80 hover:text-white bg-black/40 backdrop-blur-sm transition-colors">
              Edit club
            </button>

            <button className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full transition-colors bg-cw-accent text-cw-text-primary dark:text-cw-text-on-accent hover:bg-cw-accent-hover">
              <UserPlus className="w-3.5 h-3.5" />
              Invite Friends
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
