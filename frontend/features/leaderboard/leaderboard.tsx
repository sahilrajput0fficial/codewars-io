/**
 * features/leaderboard/leaderboard.tsx
 * Root feature component for the leaderboard.
 *
 * NOTE: The leaderboard page is a Next.js Server Component that fetches data
 * from the backend, so the "rendered" product lives in app/leaderboard/page.tsx.
 * This file acts as the mandated AGENTS.md root component entry-point and will
 * be fleshed out when the feature is refactored to a React Server Component
 * with data passed via props.
 */

export { AnimatedPodium as Leaderboard } from "./components/top-warrior-card";
