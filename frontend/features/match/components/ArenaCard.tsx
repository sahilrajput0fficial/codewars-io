"use client";

/**
 * features/match/components/ArenaCard.tsx
 *
 * Single arena-level selection card.
 * DESIGN.md compliance:
 *  - §7  — clip-corner-all (angular/competitive shape)
 *  - §5  — tier color as border only (1–2px)
 *  - §3  — accent used ONLY on the active CTA border
 *  - §10.2 — LiveDot for online player count
 *  - §10.5 — rise-in on mount
 */

import React, { useState } from "react";
import { Users, Clock, Shield } from "lucide-react";
import { ArenaLevel, DIFFICULTY_CLASS } from "../constants";

interface ArenaCardProps {
  arena: ArenaLevel;
  isSelected: boolean;
  isLocked: boolean;
  userElo: number;
  onSelect: (id: string) => void;
  /** Staggered animation delay in ms */
  animDelay?: number;
}

export function ArenaCard({
  arena,
  isSelected,
  isLocked,
  userElo,
  onSelect,
  animDelay = 0,
}: ArenaCardProps) {
  const tierColor = arena.tierHex;

  return (
    <button
      onClick={() => !isLocked && onSelect(arena.id)}
      disabled={isLocked}
      aria-pressed={isSelected}
      aria-label={`Select ${arena.name} arena`}
      className={[
        // Base layout
        "relative w-full text-left transition-colors duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        // Angular shape (DESIGN.md §7)
        "clip-corner-all",
        // Background surface
        "bg-[var(--color-surface)] border border-[var(--color-border)]",
        // Selected ring — accent as left-edge indicator (DESIGN.md §3 item 2)
        isSelected
          ? "outline outline-1 outline-offset-[-1px] outline-[var(--color-accent)]"
          : "outline-none",
        // Locked
        isLocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-[var(--color-surface-2)]",
        // Entrance animation (DESIGN.md §10.5)
        "animate-rise-in",
      ].join(" ")}
      style={{
        animationDelay: `${animDelay}ms`,
        animationFillMode: "both",
      }}
    >
      {/* Tier accent bar — left edge, 2px, tier color only (DESIGN.md §5) */}
      <span
        className="absolute inset-y-0 left-0 w-[2px]"
        style={{ backgroundColor: tierColor }}
        aria-hidden="true"
      />

      <div className="p-5 pl-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* Tier badge — border only (DESIGN.md §5) */}
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 border text-[11px] uppercase tracking-widest font-sans mb-2"
              style={{ borderColor: tierColor, color: tierColor }}
            >
              <Shield size={10} />
              {arena.tierLabel}
            </span>

            <h3 className="text-[var(--color-text-primary)] font-sans font-semibold text-lg leading-tight">
              {arena.name}
            </h3>
            <p className="text-[var(--color-text-secondary)] font-sans text-xs mt-0.5">
              {arena.subtitle}
            </p>
          </div>

          {/* Online players — LiveDot + count (DESIGN.md §10.2, §10.6) */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              {/* LiveDot (DESIGN.md §10.2) */}
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] animate-[ring-ping_1.6s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-success)] animate-[pulse-live_1.8s_ease-in-out_infinite]" />
              </span>
              <span className="font-mono text-xs text-[var(--color-success)]">
                {arena.onlinePlayers.toLocaleString()}
              </span>
            </div>
            <span className="font-sans text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider">
              online
            </span>
          </div>
        </div>

        {/* Lore */}
        <p className="mt-3 text-[var(--color-text-secondary)] font-sans text-sm leading-relaxed line-clamp-2">
          {arena.lore}
        </p>

        {/* Meta row */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* ELO requirement */}
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-[var(--color-text-secondary)]" />
            <span className="font-sans text-xs text-[var(--color-text-secondary)]">ELO</span>
            <span className="font-mono text-xs text-[var(--color-text-primary)]">
              {arena.eloMin}
              {arena.eloMax ? `–${arena.eloMax}` : "+"}
            </span>
          </div>

          {/* Time limit */}
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-[var(--color-text-secondary)]" />
            <span className="font-mono text-xs text-[var(--color-text-primary)]">
              {arena.timeLimitMin}
            </span>
            <span className="font-sans text-xs text-[var(--color-text-secondary)]">min</span>
          </div>

          {/* Difficulty word (DESIGN.md §4) */}
          <span className={`font-sans text-xs font-medium ${DIFFICULTY_CLASS[arena.difficulty]}`}>
            {arena.difficulty}
          </span>
        </div>

        {/* Locked overlay message */}
        {isLocked && (
          <div className="mt-3 text-[10px] font-sans text-[var(--color-text-tertiary)] uppercase tracking-widest">
            Requires ELO {arena.eloMin}+
          </div>
        )}
      </div>

      {/* Selected indicator — thin bottom bar in accent (DESIGN.md §3 item 2) */}
      {isSelected && (
        <span
          className="absolute inset-x-0 bottom-0 h-[2px] bg-[var(--color-accent)]"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
