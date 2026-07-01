"use client";

/**
 * features/auth/components/win-ratio-ring.tsx
 * SVG donut chart showing W/L ratio.
 * Pure SVG — no external charting library.
 */

export function WinRatioRing({
  wins,
  losses,
}: {
  wins:   number;
  losses: number;
}) {
  const total  = wins + losses;
  const wr     = total === 0 ? 0 : wins / total;
  const radius = 42;
  const circ   = 2 * Math.PI * radius;
  const dash   = wr * circ;
  const gap    = circ - dash;

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full -rotate-90"
        aria-label={`Win ratio ${Math.round(wr * 100)}%`}
      >
        {/* Track */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-surface-2)" strokeWidth="10" />
        {/* Win arc */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-success)"   strokeWidth="10" strokeDasharray={`${dash} ${gap}`} strokeLinecap="round" />
        {/* Loss arc */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-danger)"    strokeWidth="10" strokeDasharray={`${gap} ${dash}`} strokeDashoffset={-dash} strokeLinecap="round" opacity={0.5} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-lg font-black tabular-nums leading-none" style={{ color: "var(--color-text-primary)" }}>
          {Math.round(wr * 100)}%
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
          WR
        </span>
      </div>
    </div>
  );
}
