/**
 * features/leaderboard/index.ts
 * Barrel re-export — all external consumers (app/leaderboard/page.tsx, etc.)
 * import from here so internal moves don't break call sites.
 *
 * AGENTS.md: "keep API calls inside services/, components in components/, etc."
 */

// Types
export type { LeaderboardEntry } from "./types";

// Constants
export { PAGE_SIZE, SORT_OPTIONS, TIMEFRAME_OPTIONS, QUEUE_OPTIONS } from "./constants";
export type { SortValue, Timeframe } from "./constants";

// Services (server-side only — import directly for server components)
export { fetchLeaderboard, fetchTop3, fetchMe } from "./services/leaderboard-service";
export type { LeaderboardResponse, HATEOASLink } from "./services/leaderboard-service";

// Hooks
export { useScrollReveal } from "./hooks/use-scroll-reveal";
export { useLeaderboardFilter } from "./hooks/use-leaderboard-filter";

// Components
export { ScrollRevealDiv, ScrollRevealRow } from "./components/scroll-reveal";
export { CountdownTimer }                   from "./components/countdown-timer";
export { LeaderboardHeader }               from "./components/leaderboard-header";
export { FilterBar }                        from "./components/filter-bar";
export { TopWarriorCard, AnimatedPodium }  from "./components/top-warrior-card";
