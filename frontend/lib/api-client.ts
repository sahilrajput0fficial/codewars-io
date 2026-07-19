/**
 * lib/api-client.ts
 * Shared API configuration and a thin fetch wrapper for FastAPI calls.
 *
 * AGENTS.md: "Keep API calls inside `services/` files — never call `fetch()`
 *              directly inside a component or page file."
 *
 * All service files should import BASE_URL and apiFetch from here — NOT from
 * `@/proxy`, which is the Next.js middleware file and should not export
 * application-level constants.
 */

// ── Base URL ──────────────────────────────────────────────────────────────────

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
    ? "https://codewars-io.vercel.app/_/backend/v1"
    : "http://localhost:8000");

// ── Thin fetch wrapper ────────────────────────────────────────────────────────

type ApiRequestInit = Omit<RequestInit, "body"> & {
  /** JSON-serialisable body — will be serialised and Content-Type set automatically. */
  json?: unknown;
};

/**
 * A lightweight wrapper around `fetch` for backend API calls.
 *
 * - Automatically sets `Content-Type: application/json` when a `json` body is provided.
 * - Uses `credentials: "include"` by default so the browser forwards session cookies.
 * - Accepts an optional `cookieHeader` string for server-side (SSR/RSC) requests where
 *   the browser cookie jar is not available — pass `(await cookies()).toString()`.
 *
 * @example — client component
 *   const res = await apiFetch(`${BASE_URL}/submissions`, { method: "POST", json: payload });
 *
 * @example — server component / page
 *   const cookieHeader = (await cookies()).toString();
 *   const res = await apiFetch(`${BASE_URL}/leaderboard/me`, { cookieHeader });
 */
export async function apiFetch(
  url: string,
  options: ApiRequestInit & { cookieHeader?: string } = {}
): Promise<Response> {
  const { json, cookieHeader, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(extraHeaders as Record<string, string>),
  };

  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  // On the server we can't use credentials:"include" (no browser jar), so we
  // forward the full cookie header string obtained from next/headers cookies().
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }

  return fetch(url, {
    credentials: cookieHeader ? undefined : "include",
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : (rest as RequestInit).body,
  });
}
