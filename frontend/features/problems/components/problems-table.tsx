import React from "react";
import type { Problem } from "../types";
import Link from "next/link";
import { Check, Flame, Play, Swords } from "lucide-react";

interface ProblemsTableProps {
  problems: Problem[];
  isLoading: boolean;
}

export function ProblemsTable({ problems, isLoading }: ProblemsTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-16 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cw-accent/20 border-t-cw-accent animate-spin" />
        <span className="text-xs font-mono text-cw-text-secondary">Loading arena challenges...</span>
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-cw-border rounded-xl">
        <span className="text-xs text-cw-text-secondary font-mono">No arena challenges match the selected filters.</span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-cw-border bg-cw-surface/40">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-cw-border bg-cw-surface-2/60">
            <th className="py-3 px-4 w-12 text-xs font-black uppercase tracking-widest text-cw-text-accent text-center">
              Status
            </th>
            <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-cw-text-accent">
              Title
            </th>
            <th className="py-3 px-4 w-28 text-xs font-black uppercase tracking-widest text-cw-text-accent text-right">
              Acceptance
            </th>
            <th className="py-3 px-4 w-24 text-xs font-black uppercase tracking-widest text-cw-text-accent text-center">
              Difficulty
            </th>
            <th className="py-3 px-4 w-20 text-xs font-black uppercase tracking-widest text-cw-text-accent text-center">
              Battle
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-cw-border">
          {problems.map((problem) => {
            const isSolved = problem.status === "solved";
            const isAttempted = problem.status === "attempted";

            // Status icon/color
            let statusEl = null;
            if (isSolved) {
              statusEl = <Check className="w-4 h-4 text-cw-success mx-auto" />;
            } else if (isAttempted) {
              statusEl = <Flame className="w-3.5 h-3.5 text-cw-warning mx-auto animate-pulse-live" />;
            }

            // Difficulty styling
            let diffColor = "var(--color-text-secondary)";
            if (problem.difficulty === "Easy") diffColor = "var(--color-success)";
            else if (problem.difficulty === "Medium") diffColor = "var(--color-warning)";
            else if (problem.difficulty === "Hard") diffColor = "var(--color-danger)";

            return (
              <tr
                key={problem.id}
                className="group hover:bg-cw-surface-2/40 transition-colors duration-fast ease-snap cursor-pointer"
              >
                {/* Col 1: Status */}
                <td className="py-3 px-4 text-center">{statusEl}</td>

                {/* Col 2: Title */}
                <td className="py-3 px-4">
                  <Link
                    href={`/problem/${problem.slug}`}
                    className="text-sm font-bold text-cw-text-primary group-hover:text-cw-accent transition-colors duration-fast"
                  >
                    {problem.index}. {problem.title}
                  </Link>
                  <div className="flex gap-1.5 mt-0.5">
                    {problem.tags.slice(0, 3).map((t) => (
                      <span
                        key={t.slug}
                        className="text-[9px] text-cw-text-tertiary uppercase tracking-wider font-semibold"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Col 3: Acceptance */}
                <td className="py-3 px-4 text-right">
                  <span className="font-mono text-xs text-cw-text-secondary tabular-nums">
                    {problem.acceptanceRate.toFixed(1)}%
                  </span>
                </td>

                {/* Col 4: Difficulty */}
                <td className="py-3 px-4 text-center">
                  <span
                    className="text-xs font-black uppercase tracking-wider"
                    style={{ color: diffColor }}
                  >
                    {problem.difficulty}
                  </span>
                </td>

                {/* Col 5: Battle Action */}
                <td className="py-3 px-4 text-center">
                  <Link
                    href={`/problem/${problem.slug}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded border border-cw-border bg-cw-surface-2 text-cw-text-secondary group-hover:bg-cw-accent group-hover:text-white group-hover:border-cw-accent transition-all duration-fast ease-snap"
                  >
                    <Swords className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
