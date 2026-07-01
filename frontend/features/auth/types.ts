/**
 * features/auth/types.ts
 * Domain types for the Auth & Profiles module (M1).
 * Shapes mirror the backend Pydantic schemas — wiring in live data requires
 * no structural changes here.
 *
 * AGENTS.md: "Request/response models belong in schemas.py of their modules."
 * Frontend mirror: types live here.
 */

export interface ProfileUser {
  id:                 string;
  username:           string;
  display_name:       string;
  avatar_url:         string | null;
  banner_url:         string | null;
  bio:                string;
  joined_at:          string; // ISO date string
  elo:                number;
  elo_tier:           "Bronze" | "Silver" | "Gold" | "Diamond";
  rank:               number;
  wins:               number;
  losses:             number;
  matches_played:     number;
  longest_win_streak: number;
  current_streak:     number;
  avg_solve_time_ms:  number; // milliseconds
  problems_solved:    number;
  is_online:          boolean;
  hide_online_status?: boolean;
  show_achievements?: boolean;
}

export interface RecentMatch {
  id:                  string;
  opponent_username:   string;
  opponent_avatar_url: string | null;
  opponent_elo:        number;
  opponent_tier:       "Bronze" | "Silver" | "Gold" | "Diamond";
  result:              "win" | "loss";
  elo_delta:           number;
  problem_title:       string;
  problem_difficulty:  "Easy" | "Medium" | "Hard";
  solved_at:           string; // ISO date string
  duration_ms:         number;
}

export interface ProfileAchievement {
  id:          string;
  label:       string;
  description: string;
  icon:        string; // emoji or icon name
  earned_at:   string;
}

export interface EditProfilePayload {
  display_name?: string;
  bio?:          string;
  avatar_url?:   string | null;
  banner_url?:   string | null;
  hide_online_status?: boolean;
  show_achievements?:  boolean;
}
