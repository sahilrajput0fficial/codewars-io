/**
 * features/leaderboard/constants.ts
 * Static config for the leaderboard feature — AGENTS.md requires this to be
 * separated from component logic.
 */

/** Rows returned per leaderboard page. Must match backend default. */
export const PAGE_SIZE = 10;

export const SORT_OPTIONS = [
  { value: "elo",            label: "ELO" },
  { value: "wins",           label: "Wins" },
  { value: "matches_played", label: "Matches" },
] as const;

export const TIMEFRAME_OPTIONS = ["24h", "7D", "30D", "Seasonal"] as const;

export const QUEUE_OPTIONS = ["Ranked Solo", "Ranked Duo", "Custom Arena"] as const;

export type SortValue = typeof SORT_OPTIONS[number]["value"];
export type Timeframe  = typeof TIMEFRAME_OPTIONS[number];
