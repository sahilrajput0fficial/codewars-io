/**
 * features/leaderboard/services/leaderboard-service.ts
 * Typed fetch wrappers for the M1 leaderboard API.
 * These mirror the inline fetches in app/leaderboard/page.tsx so they can be
 * imported there and in server actions once the backend is live.
 *
 * AGENTS.md: "Keep API calls inside `services/` files — never call `fetch()`
 *              directly inside a component or page file."
 */

import { BASE_URL } from "@/lib/api-client";
import type { LeaderboardEntry } from "../types";

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface HATEOASLink {
  rel:       string;
  label:     string;
  offset:    number | null;
  is_active: boolean;
}

export interface LeaderboardResponse {
  total:        number;
  total_global: number;
  limit:        number;
  offset:       number;
  sort_by:      string;
  entries:      LeaderboardEntry[];
  links:        HATEOASLink[];
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

export async function fetchLeaderboard(
  sortBy: string,
  limit:  number,
  offset: number,
  q = ""
): Promise<LeaderboardResponse | null> {
  try {
    const queryParam = q ? `&q=${encodeURIComponent(q)}` : "";
    const res = await fetch(
      `${BASE_URL}/leaderboard/?sort_by=${sortBy}&limit=${limit}&offset=${offset}&sort_order=desc${queryParam}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    return res.json() as Promise<LeaderboardResponse>;
  } catch {
    return null;
  }
}

export async function fetchTop3(sortBy: string): Promise<LeaderboardEntry[]> {
  const data = await fetchLeaderboard(sortBy, 3, 0);
  return data?.entries ?? [];
}

/**
 * Fetch the current user's own leaderboard entry (requires auth).
 *
 * @param cookieHeader - Full cookie header string from `(await cookies()).toString()`.
 *   Forwards every session cookie the proxy set so FastAPI can validate the JWT.
 *   Only needed in Server Components; omit in client contexts.
 */
export async function fetchMe(cookieHeader?: string): Promise<LeaderboardEntry | null> {
  try {
    const headers: Record<string, string> = {};
    if (cookieHeader) headers["Cookie"] = cookieHeader;

    const res = await fetch(`${BASE_URL}/leaderboard/me`, {
      headers,
      credentials: cookieHeader ? undefined : "include",
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<LeaderboardEntry>;
  } catch {
    return null;
  }
}
