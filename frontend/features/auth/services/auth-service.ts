/**
 * features/auth/services/auth-service.ts
 * Typed fetch wrappers for the M1 Auth & Profiles backend API.
 *
 * AGENTS.md: "Keep API calls inside `services/` files — never call `fetch()`
 *              directly inside a component or page file."
 *
 * All functions are stubs — they compile and type-check now so that wiring
 * in the real FastAPI endpoints is a one-line swap per function.
 */

import { BASE_URL } from "@/proxy";
import type { ProfileUser, EditProfilePayload } from "../types";

// ─── Backend Response Schema ──────────────────────────────────────────────────

export interface BackendProfileResponse {
  id:                 string;
  username:           string;
  display_name:       string | null;
  bio:                string | null;
  email:              string;
  wins:               number;
  losses:             number;
  elo:                number;
  streak_days:        number;
  avatar_url:         string | null;
  banner_url:         string | null;
  hide_online_status: boolean;
  show_achievements:  boolean;
  created_at:         string;
  last_active_date:   string | null;
  longest_win_streak: number;
  matches_played:     number;
  elo_tier:           string;
  rank:               number;
  avg_solve_time_ms:  number;
  problems_solved:    number;
  is_online:          boolean;
}


export interface BackendMatchOpponent {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  elo_tiers: string;
  elo: number;
}


export interface BackendMatchResponse {
  id: string;
  player_one: BackendMatchOpponent;
  player_two: BackendMatchOpponent | null;
  bot_elo: number | null;
  mode: string;
  status: string;
  problem_ids: string[];
  difficulty_config: Record<string, any>;
  winner_id: string | null;
  p1_score: number;
  p2_score: number;
  p1_penalty: number;
  p2_penalty: number;
  p1_elo_delta: number;
  p2_elo_delta: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}


export interface BackendMatchesListResponse {
  total: number;
  limit: number;
  offset: number;
  matches: BackendMatchResponse[];
}

// ─── Mapper Function ──────────────────────────────────────────────────────────

export function mapBackendProfile(data: BackendProfileResponse): ProfileUser {
  // Normalize casing of tier: "bronze" -> "Bronze"
  const rawTier = data.elo_tier || "bronze";
  const elo_tier = (rawTier.charAt(0).toUpperCase() + rawTier.slice(1).toLowerCase()) as ProfileUser["elo_tier"];

  return {
    id:                 data.id,
    username:           data.username,
    display_name:       data.display_name || data.username,
    avatar_url:         data.avatar_url,
    banner_url:         data.banner_url,
    bio:                data.bio || "No bio set yet. Ready to conquer the leaderboard!",
    joined_at:          data.created_at,
    elo:                data.elo,
    elo_tier,
    rank:               data.rank,
    wins:               data.wins,
    losses:             data.losses,
    matches_played:     data.matches_played,
    longest_win_streak: data.longest_win_streak,
    current_streak:     data.streak_days,
    avg_solve_time_ms:  data.avg_solve_time_ms,
    problems_solved:    data.problems_solved,
    is_online:          data.is_online,
    hide_online_status: data.hide_online_status,
    show_achievements:  data.show_achievements,
  };
}

// ─── Profile fetchers ─────────────────────────────────────────────────────────

/** Fetch any user's public profile by username. */
export async function fetchProfile(username: string): Promise<ProfileUser | null> {
  try {
    const res = await fetch(`${BASE_URL}/u/${username}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json() as BackendProfileResponse;
    return mapBackendProfile(data);
  } catch {
    return null;
  }
}

/** Fetch the current session user's own profile (requires auth cookie). */
export async function fetchMyProfile(cookie: string): Promise<ProfileUser | null> {
  try {
    const res = await fetch(`${BASE_URL}/u/me`, {
      headers: { Cookie: cookie },
      next:    { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = await res.json() as BackendProfileResponse;
    return mapBackendProfile(data);
  } catch {
    return null;
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** PATCH the current user's profile details. */
export async function updateProfile(
  payload: EditProfilePayload,
  cookie?:  string
): Promise<ProfileUser | null> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (cookie) {
      headers["Cookie"] = cookie;
    }
    const res = await fetch(`${BASE_URL}/u/me`, {
      method:  "PATCH",
      headers,
      body: JSON.stringify(payload),
      credentials: "include",
    } as RequestInit);
    if (!res.ok) return null;
    const data = await res.json() as BackendProfileResponse;
    return mapBackendProfile(data);
  } catch {
    return null;
  }
}







/** Fetch user's matches history. */
export async function fetchUserMatches(
  username: string,
  limit: number = 10,
  offset: number = 0
): Promise<BackendMatchesListResponse | null> {
  try {
    const res = await fetch(`${BASE_URL}/u/${username}/matches?limit=${limit}&offset=${offset}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return await res.json() as BackendMatchesListResponse;
  } catch {
    return null;
  }
}

