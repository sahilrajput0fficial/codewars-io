import { useEffect, useRef, useState } from "react";
import { BASE_URL } from "@/lib/api-client";

export interface UseMatchSocketOptions {
  userId?: string;
  arenaId?: string;
  elo?: number;
  enabled?: boolean;
  onMatchFound?: (data: any) => void;
  onMatchStart?: (data: any) => void;
  onMatchAbandoned?: (data: any) => void;
  onMatchUpdate?: (data: any) => void;
}

export function useMatchSocket({
  userId,
  arenaId = "kabul",
  elo = 1000,
  enabled = false,
  onMatchFound,
  onMatchStart,
  onMatchAbandoned,
  onMatchUpdate,
}: UseMatchSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const onMatchFoundRef = useRef(onMatchFound);
  const onMatchStartRef = useRef(onMatchStart);
  const onMatchAbandonedRef = useRef(onMatchAbandoned);
  const onMatchUpdateRef = useRef(onMatchUpdate);

  useEffect(() => {
    onMatchFoundRef.current = onMatchFound;
    onMatchStartRef.current = onMatchStart;
    onMatchAbandonedRef.current = onMatchAbandoned;
    onMatchUpdateRef.current = onMatchUpdate;
  }, [onMatchFound, onMatchStart, onMatchAbandoned, onMatchUpdate]);

  const activeUserId = userId;

  // Only connect once we actually have a real userId. Connecting with an
  // empty/placeholder id and then reconnecting once the real id resolves
  // creates a race: a match can be created against the throwaway
  // connection, and the "real" connection that opens afterward is never
  // part of that match, so match.start never reaches it.
  const canConnect = enabled && !!activeUserId;

  useEffect(() => {
    if (!canConnect) {
      if (socketRef.current) {
        console.log("[WebSocket] Disconnecting from queue...");
        socketRef.current.close();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Helper to read cookies in browser client
    const getCookie = (name: string): string | null => {
      if (typeof document === "undefined") return null;
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };
    const accessToken = getCookie("access_token") || "";
    const identifier = activeUserId || accessToken;

    // Convert BASE_URL from http(s) to ws(s)
    const wsBaseUrl = BASE_URL.replace(/^http/, "ws");
    const wsUrl = `${wsBaseUrl}/matches/ws/queue?arena_id=${encodeURIComponent(arenaId.toLowerCase())}&user_id=${encodeURIComponent(identifier)}&elo=${elo}`;

    console.log(`[WebSocket] Connecting to queue at: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("[WebSocket] Successfully connected to queue ws/queue");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      console.log("[WebSocket] Queue event received:", event.data);

      // Only JSON parsing is guarded here. Callback errors must NOT be
      // swallowed by this catch block, or failures inside onMatchFound /
      // onMatchStart silently look like "nothing happened" with no trace
      // in the console.
      let parsed: any;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        // Raw/non-JSON text frame — nothing to do.
        return;
      }

      console.log("[WebSocket] Event details:", parsed);

      // 1. Ready Check (Match Found)
      if (parsed.event === "match.found") {
        onMatchFoundRef.current?.(parsed.match || parsed);
      }
      // 2. Both Accepted (Match Starts)
      else if (parsed.event === "match.start" || parsed.event === "matched") {
        onMatchStartRef.current?.(parsed.match || parsed);
      }
      // 3. Match Abandoned / Declined / Cancelled
      else if (parsed.event === "match.abandoned" || parsed.event === "match.cancelled") {
        onMatchAbandonedRef.current?.(parsed);
      }
      // 4. Match updates (submissions, score changes, solved problems)
      else if (parsed.event === "match.update") {
        onMatchUpdateRef.current?.(parsed);
      }
    };

    ws.onerror = (error) => {
      console.error("[WebSocket] Queue websocket error:", error);
    };

    ws.onclose = (event) => {
      console.log(`[WebSocket] Queue websocket closed (code: ${event.code}, reason: ${event.reason || "N/A"})`);
      setIsConnected(false);
      socketRef.current = null;
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        console.log("[WebSocket] Cleaning up queue connection...");
        ws.close();
      }
    };
  }, [canConnect]);


  // Sends a queue action over the socket. If the socket is momentarily not
  // open (brief reconnect gap — e.g. dev Fast Refresh, or a real network
  // blip in production) it retries for up to ~1s instead of failing the
  // click outright, since accept/decline are time-sensitive user actions.
  const sendAction = (action: "accept_match" | "decline_match", matchId: string, attempt = 0) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log(`[WebSocket] Sending ${action}: ${matchId}`);
      ws.send(JSON.stringify({ action, match_id: matchId }));
      return;
    }
    if (attempt >= 5) {
      console.error(`[WebSocket] ${action} failed — socket not open after retries`, matchId);
      return;
    }
    console.warn(`[WebSocket] ${action} called but socket is not open, retrying (${attempt + 1}/5)...`);
    setTimeout(() => sendAction(action, matchId, attempt + 1), 200);
  };

  // Client helper to send "accept_match" action over WebSocket
  const acceptMatch = (matchId: string) => sendAction("accept_match", matchId);

  // Client helper to send "decline_match" action over WebSocket
  const declineMatch = (matchId: string) => sendAction("decline_match", matchId);

  return {
    isConnected,
    socket: socketRef.current,
    acceptMatch,
    declineMatch,
  };
}