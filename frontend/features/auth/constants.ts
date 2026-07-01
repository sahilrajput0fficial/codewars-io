/**
 * features/auth/constants.ts
 * Demo payload + pure helper functions for the Auth & Profiles feature.
 * Separated from types.ts per AGENTS.md — static data and helpers live here,
 * type declarations live in types.ts.
 *
 * TODO (M1): Replace DEMO_* exports with real API fetches from auth-service.ts
 *            once the FastAPI backend is wired up.
 */

import type { ProfileUser, RecentMatch, ProfileAchievement } from "./types";

// ─── Demo payload ─────────────────────────────────────────────────────────────

export const DEMO_USER: ProfileUser = {
  id:                 "usr_demo_001",
  username:           "Empre55ive",
  display_name:       "Empre55ive",
  avatar_url:         null,
  banner_url:         null,
  bio:                "Diamond coder. Algorithm enthusiast. Always looking for the next challenge ❤️",
  joined_at:          "2022-04-12T00:00:00Z",
  elo:                2347,
  elo_tier:           "Diamond",
  rank:               14,
  wins:               86,
  losses:             12,
  matches_played:     98,
  longest_win_streak: 13,
  current_streak:     7,
  avg_solve_time_ms:  18 * 60 * 1000,
  problems_solved:    247,
  is_online:          true,
};

export const DEMO_RECENT_MATCHES: RecentMatch[] = [
  {
    id:                  "m1",
    opponent_username:   "SimmyCool",
    opponent_avatar_url: null,
    opponent_elo:        2198,
    opponent_tier:       "Diamond",
    result:              "win",
    elo_delta:           18,
    problem_title:       "Longest Palindromic Substring",
    problem_difficulty:  "Medium",
    solved_at:           new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    duration_ms:         17 * 60 * 1000,
  },
  {
    id:                  "m2",
    opponent_username:   "NarcJacobs",
    opponent_avatar_url: null,
    opponent_elo:        2450,
    opponent_tier:       "Diamond",
    result:              "loss",
    elo_delta:           -14,
    problem_title:       "Median of Two Sorted Arrays",
    problem_difficulty:  "Hard",
    solved_at:           new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    duration_ms:         22 * 60 * 1000,
  },
  {
    id:                  "m3",
    opponent_username:   "VoidCipher",
    opponent_avatar_url: null,
    opponent_elo:        1980,
    opponent_tier:       "Gold",
    result:              "win",
    elo_delta:           22,
    problem_title:       "Binary Tree Level Order Traversal",
    problem_difficulty:  "Easy",
    solved_at:           new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    duration_ms:         11 * 60 * 1000,
  },
  {
    id:                  "m4",
    opponent_username:   "ZenAlpha",
    opponent_avatar_url: null,
    opponent_elo:        2100,
    opponent_tier:       "Diamond",
    result:              "win",
    elo_delta:           16,
    problem_title:       "Word Break II",
    problem_difficulty:  "Hard",
    solved_at:           new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    duration_ms:         26 * 60 * 1000,
  },
  {
    id:                  "m5",
    opponent_username:   "ByteStorm",
    opponent_avatar_url: null,
    opponent_elo:        1750,
    opponent_tier:       "Gold",
    result:              "win",
    elo_delta:           12,
    problem_title:       "Merge Intervals",
    problem_difficulty:  "Medium",
    solved_at:           new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(),
    duration_ms:         14 * 60 * 1000,
  },
];

export const DEMO_ACHIEVEMENTS: ProfileAchievement[] = [
  { id: "a1", label: "First Blood",     description: "Won your very first ranked match",          icon: "🗡️", earned_at: "2022-04-15T00:00:00Z" },
  { id: "a2", label: "Diamond Climber", description: "Reached Diamond tier",                      icon: "💎", earned_at: "2023-01-09T00:00:00Z" },
  { id: "a3", label: "Speed Demon",     description: "Solved a Hard problem in under 10 minutes", icon: "⚡", earned_at: "2023-03-22T00:00:00Z" },
  { id: "a4", label: "Win Streak ×10",  description: "Won 10 matches in a row",                   icon: "🔥", earned_at: "2023-06-14T00:00:00Z" },
  { id: "a5", label: "Problem Crusher", description: "Solved 200+ unique problems",               icon: "💪", earned_at: "2024-02-01T00:00:00Z" },
  { id: "a6", label: "Fearless",        description: "Challenged opponents rated 400+ above you", icon: "🛡️", earned_at: "2024-05-18T00:00:00Z" },
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function formatJoinDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "long",
    year:  "numeric",
  });
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function formatRelativeTime(isoString: string): string {
  const diff    = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
