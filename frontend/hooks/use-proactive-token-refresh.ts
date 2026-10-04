import { useEffect } from "react";
import { refreshToken } from "@/lib/api-client";

interface UseProactiveTokenRefreshOptions {
  enabled?: boolean;
  intervalMs?: number;
}

const isDev = process.env.NODE_ENV === "development";

export function useProactiveTokenRefresh({
  enabled = true,
  intervalMs = 10 * 60 * 1000,
}: UseProactiveTokenRefreshOptions = {}) {
  useEffect(() => {
    if (!enabled) return;

    if (isDev) {
      console.log("[TokenRefresh] Active match detected — running proactive token refresh");
    }
    refreshToken();
    const timer = setInterval(() => {
      if (isDev) {
        console.log("[TokenRefresh] Periodically refreshing access token for active match");
      }
      refreshToken();
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [enabled, intervalMs]);
}
