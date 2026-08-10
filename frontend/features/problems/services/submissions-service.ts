import { BASE_URL } from "@/lib/api-client";

export type SubmissionLanguage = "python" | "cpp" | "javascript";

export type SubmissionVerdict =
  | "pending"
  | "accepted"
  | "wrong_answer"
  | "time_limit_exceeded"
  | "memory_limit_exceeded"
  | "runtime_error"
  | "compilation_error";

export interface SubmissionRequest {
  problem_id: string;
  language: SubmissionLanguage;
  source_code: string;
  match_id?: string;
}

export interface TestCaseResult {
  test_case_id: string;
  order_index: number;
  passed: boolean;
  input?: string | null;
  expected_output?: string | null;
  actual_output?: string | null;
}

export interface SubmissionResult {
  id: string;
  verdict: SubmissionVerdict;
  runtime_ms: number | null;
  memory_kb: number | null;
  passed_testcases: number;
  total_testcases: number;
  compile_output: string | null;
  stderr: string | null;
  score: number;
  submitted_at: string;
  judged_at: string | null;
  test_cases?: TestCaseResult[];
}

/**
 * POST /submissions/
 * Auth is handled via the access_token cookie (sent automatically via credentials:'include').
 */


export async function getSubmission(submissionId: string): Promise<SubmissionResult> {
  const res = await fetch(`${BASE_URL}/submissions/${submissionId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch submission (${res.status}): ${text}`);
  }
  return res.json();
}

export async function pollSubmissionResult(submissionId: string): Promise<SubmissionResult> {
  const maxAttempts = 20; // 20 * 500ms = 10s max timeout
  for (let i = 0; i < maxAttempts; i++) {
    const sub = await getSubmission(submissionId);
    if (sub.verdict !== "pending") {
      return sub;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return getSubmission(submissionId);
}

export async function runCode(
  payload: SubmissionRequest
): Promise<SubmissionResult> {
  const res = await fetch(`${BASE_URL}/submissions/?env=f2ca9155`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",          // sends access_token cookie to backend
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Submission failed (${res.status}): ${text}`);
  }

  const initial: SubmissionResult = await res.json();
  if (initial.verdict === "pending") {
    return pollSubmissionResult(initial.id);
  }
  return initial;
}


export async function submitCode(
  payload: SubmissionRequest
): Promise<SubmissionResult> {
  const res = await fetch(`${BASE_URL}/submissions/?env=b0c66f5b`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",          // sends access_token cookie to backend
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Submission failed (${res.status}): ${text}`);
  }

  const initial: SubmissionResult = await res.json();
  if (initial.verdict === "pending") {
    return pollSubmissionResult(initial.id);
  }
  return initial;
}

/** Convert backend verdict → frontend TestStatus display */
export function verdictToStatus(
  verdict: SubmissionVerdict
): "accepted" | "wrong_answer" | "failed" | "running" {
  if (verdict === "accepted") return "accepted";
  if (verdict === "wrong_answer") return "wrong_answer";
  if (verdict === "pending") return "running";
  return "failed";
}

/** Format runtime_ms → "48 ms" */
export function formatRuntime(ms: number | null): string | undefined {
  if (ms === null || ms === undefined) return undefined;
  return `${ms} ms`;
}

/** Format memory_kb → "17.4 MB" */
export function formatMemory(kb: number | null): string | undefined {
  if (kb === null || kb === undefined) return undefined;
  return `${(kb / 1024).toFixed(1)} MB`;
}
