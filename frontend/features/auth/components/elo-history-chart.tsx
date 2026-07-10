"use client";

/**
 * features/auth/components/elo-history-chart.tsx
 *
 * ELO history line chart built with recharts + shadcn ChartContainer.
 * - Smooth natural curve (type="natural") with visible dots
 * - Full-width via ResponsiveContainer inside ChartContainer
 * - Colors from DESIGN.md tokens only — never raw hex
 * - Numbers in font-mono (DESIGN.md §6)
 * - No decorative animation (DESIGN.md §10.0 / §10.8)
 *
 * Swap DEMO_ELO_HISTORY for a real EloDataPoint[] prop when backend is ready.
 */

import { TrendingUp, TrendingDown, Lock } from "lucide-react";
import Link from "next/link";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EloDataPoint {
  date: string;
  elo: number;
  result?: "win" | "loss";
}

// ─── Visual background mock data when chart is locked ─────────────────────────

const MOCK_LOCKED_DATA: EloDataPoint[] = [
  { date: "Match 1", elo: 500 },
  { date: "Match 2", elo: 745 },
  { date: "Match 3", elo: 895 },
  { date: "Match 4", elo: 1030 },
  { date: "Match 5", elo: 920 },
];

// ─── Custom dot — green for win, red for loss ─────────────────────────────────

function ResultDot(props: {
  cx?: number;
  cy?: number;
  payload?: EloDataPoint;
}) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;

  const fill =
    payload?.result === "win"  ? "var(--color-success)" :
    payload?.result === "loss" ? "var(--color-danger)"  :
                                  "var(--color-accent)";

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={fill}
      stroke="var(--color-surface)"
      strokeWidth={2}
    />
  );
}

// ─── Custom active dot ────────────────────────────────────────────────────────

function ActiveResultDot(props: {
  cx?: number;
  cy?: number;
  payload?: EloDataPoint;
}) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;

  const fill =
    payload?.result === "win"  ? "var(--color-success)" :
    payload?.result === "loss" ? "var(--color-danger)"  :
                                  "var(--color-accent)";

  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={fill}
      stroke="var(--color-surface)"
      strokeWidth={2.5}
    />
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function EloTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as EloDataPoint;

  const resultColor =
    point.result === "win"  ? "var(--color-success)" :
    point.result === "loss" ? "var(--color-danger)"  :
                               "var(--color-text-tertiary)";

  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{
        background: "var(--color-surface-2)",
        borderColor: "var(--color-border)",
      }}
    >
      <div style={{ color: "var(--color-text-secondary)" }}>{point.date}</div>
      <div
        className="font-mono font-bold tabular-nums text-sm mt-0.5"
        style={{ color: "var(--color-text-primary)" }}
      >
        {point.elo.toLocaleString()} ELO
      </div>
      {point.result && (
        <div
          className="mt-0.5 uppercase text-[10px] font-semibold tracking-widest"
          style={{ color: resultColor }}
        >
          {point.result === "win" ? "▲ Win" : "▼ Loss"}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface EloHistoryChartProps {
  data: EloDataPoint[];
  height?: number;
  matchesPlayed?: number;
}

export function EloHistoryChart({
  data,
  height = 220,
  matchesPlayed,
}: EloHistoryChartProps) {
  const matchesCount = matchesPlayed !== undefined ? matchesPlayed : data.length;
  const isLocked = matchesCount < 3;

  // Use visual background dataset if chart is locked
  const chartData = isLocked ? MOCK_LOCKED_DATA : data;

  if (!isLocked && chartData.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center text-center text-xs text-cw-text-secondary font-mono"
        style={{ height }}
      >
        No ELO history data available
      </div>
    );
  }

  const firstElo = chartData[0]?.elo ?? 0;
  const lastElo  = chartData[chartData.length - 1]?.elo ?? 0;
  const delta    = lastElo - firstElo;
  const isUp     = delta >= 0;

  const minElo = Math.min(...chartData.map((d) => d.elo));
  const maxElo = Math.max(...chartData.map((d) => d.elo));
  
  // Benchmark at 500 ELO to stabilize scale and prevent extreme visual fluctuations
  const lowerBound = Math.min(500, minElo);
  const yPad = Math.ceil((maxElo - minElo) * 0.12) || 20;
  const upperBound = maxElo + yPad;

  return (
    <div className="relative w-full flex flex-col gap-3" style={{ minHeight: height }}>
      {/* Blurred background chart container when locked */}
      <div className={`w-full transition-all duration-base ${isLocked ? "opacity-40 blur-[2px] pointer-events-none select-none" : ""}`} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--color-border)"
              strokeWidth={0.75}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tick={{
                fontSize: 9,
                fill: "var(--color-text-tertiary)",
                fontFamily: "var(--font-inter)",
              }}
              interval={Math.floor(chartData.length / 4)}
            />
            <YAxis
              domain={[lowerBound, upperBound]}
              axisLine={false}
              tickLine={false}
              tickMargin={4}
              width={36}
              tick={{
                fontSize: 9,
                fill: "var(--color-text-tertiary)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}
              tickFormatter={(v: number) => String(v)}
            />
            <Tooltip
              cursor={{
                stroke: "var(--color-border)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              content={<EloTooltip />}
            />
            <Line
              type="natural"
              dataKey="elo"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={<ResultDot />}
              activeDot={<ActiveResultDot />}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer: legend + delta badge (only show if not locked) */}
      {!isLocked && (
        <div
          className="flex items-center gap-4 pt-2 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-success)" }} />
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Win
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-danger)" }} />
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Loss
            </span>
          </div>
          <div
            className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md"
            style={{
              background: isUp ? "rgba(16,185,129,0.10)" : "rgba(224,70,70,0.10)",
              color: isUp ? "var(--color-success)" : "var(--color-danger)",
            }}
          >
            {isUp
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            <span className="font-mono text-xs font-bold tabular-nums">
              {isUp ? "+" : ""}{delta}
            </span>
            <span className="text-[10px]">this period</span>
          </div>
        </div>
      )}

      {/* Lock Overlay UI (overlay centered over chart) */}
      {isLocked && (
        <div 
          className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 rounded-xl border border-cw-border"
          style={{ backgroundColor: "rgba(9, 9, 11, 0.6)" }}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-cw-border bg-cw-surface text-cw-accent mb-3">
            <Lock className="w-4.5 h-4.5" />
          </div>
          
          <h3 className="text-xs text-white tracking-widest uppercase mb-1">
            ELO Progression Locked
          </h3>
          
          <p className="text-[10px] text-white max-w-xs leading-relaxed uppercase tracking-wider font-mono">
            Unlocks after 3 completed matches.
          </p>

          {/* Progress bar matchesCount / 3 */}
          <div className="w-full max-w-[200px] mt-4">
            <div className="flex justify-between text-[9px] font-mono text-white uppercase tracking-wider mb-1">
              <span>Placement Matches</span>
              <span className="font-bold">{matchesCount}/3 completed</span>
            </div>
            <div className="h-1.5 w-full bg-cw-surface-2 border border-cw-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-cw-accent rounded-full transition-all duration-base" 
                style={{ width: `${(matchesCount / 3) * 100}%` }} 
              />
            </div>
          </div>

          <Link
            href="/play"
            className="mt-5 px-5 h-8 bg-cw-accent hover:bg-cw-accent-hover text-cw-text-on-accent text-xs font-bold flex items-center justify-center transition-colors duration-base ease-snap"
            style={{
              clipPath: "polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%)",
            }}
          >
            FIND A MATCH
          </Link>
        </div>
      )}
    </div>
  );
}
