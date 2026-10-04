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

import { useUserStore } from "@/stores/user-store";

// ── Base URL ──────────────────────────────────────────────────────────────────

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
    ? "https://codewars-io.vercel.app/_/backend/v1"
    : "http://localhost:8000");

// ── Types ─────────────────────────────────────────────────────────────────────

type ApiRequestInit = Omit<RequestInit, "body"> & {
  /** JSON-serialisable body — will be serialised and Content-Type set automatically. */
  json?: unknown;
};

// ── Refresh state ─────────────────────────────────────────────────────────────

/**
 * Stores the currently running token refresh request.
 *
 * If multiple API requests receive 401 at the same time, they all
 * share this same Promise instead of making multiple refresh requests.
 */
let refreshPromise: Promise<string | null> | null = null;

// ── Authentication helpers ───────────────────────────────────────────────────

function isAuthRouteHelper(url: string): boolean {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/signup") ||
    url.includes("/auth/refresh")
  );
}

/**
 * Explicitly triggers a POST /auth/refresh to obtain a fresh access token
 * using the httpOnly refresh-token cookie.
 */
export async function refreshToken(cookieHeader?: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: typeof window !== "undefined" ? "include" : undefined,
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });

    if (!res.ok) {
      if (typeof window !== "undefined") {
        useUserStore.getState().clear();

        if (
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/auth/login")
        ) {
          window.location.href = "/auth/login";
        }
      }

      return null;
    }

    const data = await res.json();

    const newAccessToken: string | null =
      typeof data.access_token === "string"
        ? data.access_token
        : null;

    if (!newAccessToken) {
      if (typeof window !== "undefined") {
        useUserStore.getState().clear();

        if (
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/auth/login")
        ) {
          window.location.href = "/auth/login";
        }
      }

      return null;
    }

    if (typeof window !== "undefined") {
      useUserStore.getState().setAccessToken(newAccessToken);
    }

    return newAccessToken;
  } catch (error) {
    console.error("[apiFetch] Error refreshing token:", error);

    if (typeof window !== "undefined") {
      useUserStore.getState().clear();

      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/auth/login")
      ) {
        window.location.href = "/auth/login";
      }
    }

    return null;
  }
}

/**
 * Returns the current refresh request.
 *
 * If a refresh is already running, return the same Promise.
 * This prevents multiple simultaneous /auth/refresh requests.
 */
function getRefreshToken(cookieHeader?: string): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshToken(cookieHeader).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

// ── API Fetch ─────────────────────────────────────────────────────────────────

/**
 * A lightweight wrapper around `fetch` for backend API calls.
 *
 * Features:
 * - Automatically sets Content-Type for JSON bodies.
 * - Automatically serialises JSON bodies.
 * - Automatically attaches the access token on the client.
 * - Sends cookies from the browser using credentials: "include".
 * - Supports forwarding cookies during SSR/RSC requests.
 * - Automatically refreshes an expired access token.
 * - Prevents multiple simultaneous refresh requests.
 * - Retries the original request only once.
 */
export async function apiFetch(
  url: string,
  options: ApiRequestInit & {
    cookieHeader?: string;
    _retry?: boolean;
  } = {}
): Promise<Response> {
  const {
    json,
    cookieHeader,
    headers: extraHeaders,
    _retry = false,
    ...rest
  } = options;

  // ── Headers ────────────────────────────────────────────────────────────────

  const headers = new Headers(extraHeaders || {});

  // Set Content-Type only if not already provided and sending JSON
  if (json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // ── Client-side access token ───────────────────────────────────────────────

  const token =
    typeof window !== "undefined"
      ? useUserStore.getState().accessToken
      : null;

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // ── Server-side cookie forwarding ──────────────────────────────────────────

  /**
   * When running inside a Next.js Server Component:
   *
   * const cookieHeader = (await cookies()).toString();
   *
   * The browser's cookies are not automatically available to the
   * server-side fetch, so we explicitly forward them.
   */
  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  // ── Actual request ─────────────────────────────────────────────────────────

  const response = await fetch(url, {
    ...rest,

    /**
     * Client:
     *   credentials: "include"
     *   → browser sends cookies.
     *
     * Server:
     *   cookieHeader is manually forwarded above.
     */
    credentials: typeof window !== "undefined" ? "include" : undefined,

    headers,

    body:
      json !== undefined
        ? JSON.stringify(json)
        : (rest as RequestInit).body,
  });

  // ── Handle 401 ─────────────────────────────────────────────────────────────

  const isAuthRoute = isAuthRouteHelper(url);

  /**
   * Only perform automatic refresh when:
   * 1. Backend returned 401
   * 2. Request isn't an auth endpoint
   * 3. This request hasn't already been retried
   */
  if (response.status === 401 && !isAuthRoute && !_retry) {
    // If another request is already refreshing, this waits for
    // the same Promise instead of creating another refresh request.
    const newToken = await getRefreshToken(cookieHeader);

    // Refresh failed.
    if (!newToken) {
      return response;
    }

    // ── Retry original request ───────────────────────────────────────────────

    const retryHeaders = new Headers(headers);

    retryHeaders.set("Authorization", `Bearer ${newToken}`);

    return apiFetch(url, {
      ...options,
      _retry: true,
      headers: retryHeaders,
    });
  }

  return response;
}