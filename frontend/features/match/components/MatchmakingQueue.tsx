"use client";

/**
 * features/match/components/MatchmakingQueue.tsx
 *
 * Shown after the user hits "Find Match" — animated queue waiting state.
 * DESIGN.md compliance:
 *  - §10.2 — LiveDot (searching state)
 *  - §10.5 — rise-in entrance
 *  - §10.6 — count-tick on elapsed timer
 *  - §7    — clip-corner-all shape on the panel
 *  - §3    — accent on the cancel button only
 */

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ArenaLevel } from "../constants";

interface MatchmakingQueueProps {
  arena: ArenaLevel;
  onCancel: () => void;
}

export function MatchmakingQueue({ arena, onCancel }: MatchmakingQueueProps) {
  const [elapsed, setElapsed] = useState(0);
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
      setTick(true);
      setTimeout(() => setTick(false), 150);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;


  return (
    <div
      className="animate-[rise-in_220ms_cubic-bezier(0.16,1,0.3,1)_both] clip-corner-all bg-[var(--color-surface)] border border-[var(--color-border)] p-8 flex flex-col items-center gap-6"
      role="status"
      aria-live="polite"
      aria-label={`Searching for match in ${arena.name}`}
    >
      {/* Searching pulse ring — the ONE looping animation (DESIGN.md §10.2) */}
      <div className="relative flex items-center justify-center">
        <span className="absolute h-20 w-20 rounded-full border-2 animate-[ring-ping_1.6s_cubic-bezier(0.4,0,0.2,1)_infinite] " style={{ borderColor: arena.tierHex }}
       />
        <span className="absolute h-14 w-14 rounded-full border animate-[ring-ping_1.6s_cubic-bezier(0.4,0,0.2,1)_0.4s_infinite] opacity-60" style={{ borderColor: arena.tierHex }} />
        <span
          className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 animate-[pulse-live_1.8s_ease-in-out_infinite]"
        >
          {/* Inner dot in tier color */}
          <span className="h-3 w-3 rounded-full" style={{ borderColor: arena.tierHex }}/>
        </span>
      </div>

      {/* Status text */}
      <div className="text-center space-y-1">
        <p className="font-sans text-[var(--color-text-primary)] font-semibold text-base">
          Searching for opponent
        </p>
        <p className="font-sans text-[var(--color-text-secondary)] text-sm">
          {arena.name} · {arena.difficulty}
        </p>
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
        <span className="ml-1.5">elapsed</span>
      </div>

      {/* Players in queue indicator */}
      <div className="flex items-center gap-2 text-xs font-sans text-[var(--color-text-secondary)]">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] animate-[ring-ping_1.6s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
        </span>
        <span className="font-mono text-[var(--color-success)]">{arena.onlinePlayers}</span>
        <span>players online in this arena</span>
      </div>

      {/* Cancel — accent border (DESIGN.md §3 item 2) */}
      <button
        onClick={onCancel}
        className="mt-2 flex items-center gap-2 border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-muted)] transition-colors duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)] px-4 py-2 clip-corner-br text-sm font-sans"
        aria-label="Cancel matchmaking"
      >
        <X size={14} />
        Cancel Search
      </button>
    </div>
  );
}
