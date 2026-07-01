"use client";

/**
 * features/auth/components/difficulty-label.tsx
 * Coloured difficulty badge per DESIGN.md §4 semantic colours.
 * Shared candidate: if used in problems/ feature too, move to components/shared/.
 */

export function DifficultyLabel({
  difficulty,
}: {
  difficulty: "Easy" | "Medium" | "Hard";
}) {
  const colorMap = {
    Easy:   "var(--color-success)",
    Medium: "var(--color-warning)",
    Hard:   "var(--color-danger)",
  };

  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider"
      style={{ color: colorMap[difficulty] }}
    >
      {difficulty}
    </span>
  );
}
