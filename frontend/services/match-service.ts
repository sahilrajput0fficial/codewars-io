/**
 * services/match-service.ts
 *
 * Frontend service layer for calling backend FastAPI Match & Submission endpoints.
 * Keeps API requests decoupled from components per AGENTS.md guidelines.
 */

import { apiFetch, BASE_URL } from "@/lib/api-client";
import { MatchArenaData } from "@/features/match/types";

export interface CreateSubmissionPayload {
  problem_id: string;
  language: string;
  source_code: string;
  match_id?: string;
}

/**
 * Submit code for evaluation against test cases in Judge0 via FastAPI backend.
 */
export async function submitMatchCode(
  payload: CreateSubmissionPayload,
  env: string = "production",
  cookieHeader?: string
) {
  const url = `${BASE_URL}/submissions/?env=${encodeURIComponent(env)}`;
  const response = await apiFetch(url, {
    method: "POST",
    json: payload,
    cookieHeader,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to submit code (${response.status})`);
  }

  return response.json();
}

/**
 * Fetch detailed match data by match ID from backend database.
 */
export async function fetchMatchById(matchId: string, cookieHeader?: string): Promise<MatchArenaData> {
  const url = `${BASE_URL}/matches/${matchId}`;
  const response = await apiFetch(url, {
    method: "GET",
    cookieHeader,
  });

  if (!response.ok) {
    const error = new Error(`Failed to fetch match details (${response.status})`);
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
}

export interface CompleteMatchResponse {
  status: string;
  match_id: string;
  winner_id: string | null;
  p1_score: number;
  p2_score: number;
  p1_elo_delta: number;
  p2_elo_delta: number;
}

/**
 * Request authoritative match finalization from the backend.
 */
export async function completeMatch(matchId: string, cookieHeader?: string): Promise<CompleteMatchResponse> {
  const url = `${BASE_URL}/matches/${matchId}/complete`;
  const response = await apiFetch(url, {
    method: "POST",
    cookieHeader,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to complete match (${response.status})`);
  }

  return response.json();
}

export interface DuelRoomData {
  code: string;
  url: string;
  arena_slug: string;
  is_ranked: boolean;
  host_id: string;
  host_name: string;
  host_avatar: string | null;
  guest_id: string | null;
  guest_name: string | null;
  guest_avatar: string | null;
  status: "waiting" | "ready" | "started";
  match_id: string | null;
  created_at: string;
}

/**
 * Create a new private duel room.
 */
export async function createDuelRoom(
  arenaSlug: string = "kabul",
  isRanked: boolean = false
): Promise<DuelRoomData> {
  const url = `${BASE_URL}/matches/duel/?arena_slug=${encodeURIComponent(arenaSlug)}&is_ranked=${isRanked}`;
  const response = await apiFetch(url, {
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to create duel room (${response.status})`);
  }

  return response.json();
}

/**
 * Fetch duel room status.
 */
export async function getDuelRoom(code: string): Promise<DuelRoomData> {
  const url = `${BASE_URL}/matches/duel/${encodeURIComponent(code)}`;
  const response = await apiFetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Duel room not found (${response.status})`);
  }

  return response.json();
}

/**
 * Join an existing duel room as a guest.
 */
export async function joinDuelRoom(code: string): Promise<DuelRoomData> {
  const url = `${BASE_URL}/matches/duel/join/${encodeURIComponent(code)}`;
  const response = await apiFetch(url, {
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text();
    let detail = errorText;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.detail) detail = parsed.detail;
    } catch {}
    throw new Error(detail || `Failed to join duel room (${response.status})`);
  }

  return response.json();
}

/**
 * Start the duel match (Host only).
 */
export async function startDuelRoom(code: string): Promise<DuelRoomData> {
  const url = `${BASE_URL}/matches/duel/start/${encodeURIComponent(code)}`;
  const response = await apiFetch(url, {
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text();
    let detail = errorText;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.detail) detail = parsed.detail;
    } catch {}
    throw new Error(detail || `Failed to start duel (${response.status})`);
  }

  return response.json();
}

/**
 * Leave or cancel a duel lobby.
 */
export async function leaveDuelRoom(code: string): Promise<void> {
  const url = `${BASE_URL}/matches/duel/${encodeURIComponent(code)}`;
  await apiFetch(url, {
    method: "DELETE",
  });
}


