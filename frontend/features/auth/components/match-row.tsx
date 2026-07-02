"use client";

/**
 * features/auth/components/match-row.tsx
 * Single recent-match row: opponent, difficulty, ELO delta, relative time.
 * DESIGN.md §7: result colour strip uses angular treatment.
 */

import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { getTier } from "@/constants/elo-tiers";
import { formatRelativeTime } from "../constants";
import type { RecentMatch } from "../types";
import { Avatar }           from "./avatar";
import { DifficultyLabel }  from "./difficulty-label";
import Link from "next/link";

export function MatchRow({ match, index }: { match: RecentMatch; index: number }) {
  const opponentTier = getTier(match.opponent_tier);
  const isWin        = match.result === "win";

  return (
    <div
      className="flex items-center gap-3 py-3 border-b border-cw-border last:border-b-0 animate-rise-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Result colour strip — angular per DESIGN.md §7 */}
      <div
        className="w-1 self-stretch flex-shrink-0 rounded-sm"
        style={{ background: isWin ? "var(--color-success)" : "var(--color-danger)" }}
      />
    <Link href={`/u/${match.opponent_username}`}>
      <Avatar
        username={match.opponent_username}
        avatarUrl={match.opponent_avatar_url}
        size="w-8 h-8 text-xs"
        tierColor={opponentTier.colorVar}
      />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
            <Link href={`/u/${match.opponent_username}`}>
              <span className="text-base font-bold text-cw-text-primary truncate">
                {match.opponent_username}
              </span>
            </Link>
            <span className="font-mono text-sm font-bold tabular-nums" style={{ color: opponentTier.colorVar }}>
            {match.opponent_elo}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <DifficultyLabel difficulty={match.problem_difficulty} />
          <span className="text-xs text-cw-text-tertiary truncate max-w-[140px]">
            {match.problem_title}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span
          className="font-mono text-base font-black tabular-nums"
          style={{ color: isWin ? "var(--color-success)" : "var(--color-danger)" }}
        >
          {isWin ? "+" : ""}{match.elo_delta}
        </span>
        <span
          className="text-xs text-cw-text-tertiary font-mono"
          suppressHydrationWarning
        >
          {formatRelativeTime(match.solved_at)}
        </span>
      </div>

      {isWin ? (
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-success)" }} />
      ) : (
        <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-danger)" }} />
      )}
    </div>
  );
}
