export interface LeaderboardEntry {
  id: string;
  username: string;
  email: string;
  elo: number;
  wins: number;
  losses: number;
  matches_played: number;
  streak_days: number;
  avatar_url: string | null;
  rank: number;
  elo_tier: string;
}
