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

