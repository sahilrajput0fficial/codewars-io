/**
 * features/match/types.ts
 *
 * Domain types for Match Engine, 1v1 Battles, and Code Submissions.
 */

export type MatchDifficulty = "easy" | "medium" | "hard" | "extreme";

export interface MatchProblemSpec {
  id: string;
  slug: string;
  title: string;
  difficulty: MatchDifficulty;
  scoreValue: number;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  sampleCases: Array<{
    input: string;
    expectedOutput: string;
    explanation?: string;
  }>;
  starterCode: Record<string, string>; // language -> default code template
}

export interface MatchPlayerProfile {
  id: string;
  username: string;
  displayName: string;
  elo: number;
  avatarUrl?: string | null;
  solvedProblemIds: string[];
  currentScore: number;
}

export interface MatchArenaData {
  matchId: string;
  arenaSlug: string;
  arenaName: string;
  mode: "live" | "async" | "bot";
  timerEndUnix: number; // Unix timestamp in seconds
  me: MatchPlayerProfile;
  opponent: MatchPlayerProfile;
  problems: MatchProblemSpec[];
}

export interface TestCaseResult {
  id: number;
  status: "accepted" | "wrong_answer" | "time_limit_exceeded" | "runtime_error" | "pending";
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  executionTimeMs?: number;
  memoryKb?: number;
  error?: string;
}

export interface SubmissionVerdict {
  submissionId?: string;
  status: "accepted" | "wrong_answer" | "time_limit_exceeded" | "runtime_error" | "compilation_error";
  score: number;
  passCount: number;
  totalCount: number;
  runtimeMs: number;
  memoryKb: number;
  results: TestCaseResult[];
}

export interface LiveActivityEvent {
  id: string;
  timestamp: string;
  type: "problem_solved" | "submission_failed" | "time_warning" | "match_started";
  actorName: string;
  actorType: "me" | "opponent" | "system";
  message: string;
  scoreChange?: number;
}
