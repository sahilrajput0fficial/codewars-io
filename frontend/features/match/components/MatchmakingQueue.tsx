"use client";

/**
 * features/match/components/MatchmakingQueue.tsx
 *
 * Center-Stage Duel Matchmaking / Queue Screen for "CodeWars".
 * Real data integrated with useCurrentUser and useMatchSocket WebSocket connection.
 * Implements 15-Second Ready Check ("Enter Arena"), Dual Acceptance, and -10 ELO Abandonment Penalty.
 */

import React, { useState, useEffect, useCallback } from "react";
import { X, Check, User, Bot, ArrowRight, AlertTriangle, ShieldAlert } from "lucide-react";
import { ArenaLevel } from "../constants";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMatchSocket } from "@/hooks/use-match-socket";

interface MatchmakingQueueProps {
  arena: ArenaLevel;
  onCancel: () => void;
  onPlayVsBot?: () => void;
  onMatchFound?: (matchId: string) => void;
  onMatchStart?: (matchId: string) => void;
}

export function MatchmakingQueue({
  arena,
  onCancel,
  onPlayVsBot,
  onMatchFound,
  onMatchStart,
}: MatchmakingQueueProps) {
  const { user, isLoading: userLoading } = useCurrentUser();
  const [elapsed, setElapsed] = useState(0);
  const [tick, setTick] = useState(false);

  // Ready Check Match States: "searching" | "found" (Ready Check) | "accepted" | "abandoned"
  const [matchState, setMatchState] = useState<"searching" | "found" | "accepted" | "abandoned">("searching");
  const [readyCountdown, setReadyCountdown] = useState(15);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [abandonMessage, setAbandonMessage] = useState<string | null>(null);

  const [showBotFallback, setShowBotFallback] = useState(false);
  const [foundMatchId, setFoundMatchId] = useState<string | null>(null);

  // Real User Profile Data
  const userName = user?.display_name || user?.username || "Warrior";
  const userElo = user?.elo ?? 1000;
  const userAvatar = user?.avatar_url;

  // Real / Matched Opponent Data
  const [opponentData, setOpponentData] = useState<{
    username: string;
    elo: number;
    avatar?: string;
  } | null>(null);

  // Helper to extract opponent profile details from payload
  const parseOpponent = useCallback((matchObj: any) => {
    const myId = user?.id;
    let opponent = matchObj?.opponent;
    if (!opponent || opponent === myId) {
      opponent = matchObj?.player_one === myId ? matchObj?.player_two : matchObj?.player_one;
    }

    const opponentName =
      typeof opponent === "object"
        ? opponent?.display_name || opponent?.username || "Opponent"
        : typeof opponent === "string"
        ? opponent.slice(0, 8)
        : "Opponent";

    const opponentElo =
      typeof opponent === "object" && typeof opponent?.elo === "number"
        ? opponent.elo
        : matchObj?.opponent_elo ?? userElo;

    const opponentAvatar =
      typeof opponent === "object" ? opponent?.avatar_url : undefined;

    return {
      username: opponentName,
      elo: opponentElo,
      avatar: opponentAvatar,
    };
  }, [user?.id, userElo]);

  // Connect to backend queue WebSocket using real user credentials.
  // Gate on `!!user?.id` explicitly (not just matchState) so we never open
  // a connection with a missing/placeholder id and then have to reconnect
  // once the real id resolves — that race is what caused matches to get
  // created against a connection that isn't the one actually listening.
  const { acceptMatch, declineMatch } = useMatchSocket({
    userId: user?.id,
    arenaId: arena.id.toLowerCase(),
    elo: userElo,
    enabled: matchState !== "abandoned" && !!user?.id,

    // STEP 1: "match.found" received -> Show 15-second Ready Check screen
    onMatchFound: (data) => {
      console.log("[MatchmakingQueue] 15s Ready Check triggered:", data);
      const matchObj = data?.match || data;
      const matchId = matchObj?.match_id;
      console.log(matchId);

      if (matchId) setFoundMatchId(matchId);
      setOpponentData(parseOpponent(matchObj));
      setMatchState("found");
      setReadyCountdown(15);
      setHasAccepted(false);
      setAbandonMessage(null);
    },

    // STEP 2: Both players clicked "Enter Arena" -> Launch match!
    onMatchStart: (data) => {
      console.log("[MatchmakingQueue] Both accepted! Launching live match:", data);
      const matchObj = data?.match || data;
      console.log(matchObj);
      const matchId = matchObj?.match_id || matchObj?.id || matchObj?.matchId || foundMatchId;

      if (!matchId) {
        console.error("[MatchmakingQueue] match.start received but no matchId could be resolved", data);
        return;
      }

      onMatchStart?.(matchId);
      // Direct redirect guarantee
      window.location.href = `/match/${matchId}`;
    },

    // STEP 3: Match Abandoned or Cancelled -> Show penalty feedback
    onMatchAbandoned: (data) => {
      console.log("[MatchmakingQueue] Match cancelled/abandoned:", data);
      setMatchState("abandoned");
      if (data?.event === "match.abandoned") {
        setAbandonMessage("Match abandoned! You incurred a -10 ELO penalty.");
      } else {
        setAbandonMessage(data?.reason || "Opponent failed to accept match. Re-queuing...");
        // Re-queue after 2 seconds
        setTimeout(() => {
          setMatchState("searching");
          setAbandonMessage(null);
          setHasAccepted(false);
        }, 2200);
      }
    },
  });

  // Ready Check 15-Second Countdown Timer Effect
  useEffect(() => {
    if (matchState !== "found") return;

    const interval = setInterval(() => {
      setReadyCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // If countdown hits 0 and player hasn't accepted -> Auto decline & penalty!
          if (!hasAccepted && foundMatchId) {
            declineMatch(foundMatchId);
            setMatchState("abandoned");
            setAbandonMessage("Ready check expired! You incurred a -10 ELO abandon penalty.");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [matchState, hasAccepted, foundMatchId, declineMatch]);

  // Elapsed Queue Timer logic
  useEffect(() => {
    if (matchState !== "searching") return;

    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= 12 && !showBotFallback) {
          setShowBotFallback(true);
        }
        return next;
      });
      setTick(true);
      setTimeout(() => setTick(false), 150);
    }, 1000);

    return () => clearInterval(timer);
  }, [matchState, showBotFallback]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  // Handle clicking "ENTER ARENA NOW" (Accept Match)
  const handleAccept = () => {
    if (foundMatchId && !hasAccepted) {
      setHasAccepted(true);
      setMatchState("accepted");
      acceptMatch(foundMatchId);
    }
  };

  // Handle clicking "DECLINE MATCH" (-10 ELO Penalty)
  const handleDecline = () => {
    if (foundMatchId) {
      declineMatch(foundMatchId);
      setMatchState("abandoned");
      setAbandonMessage("You declined the match (-10 ELO penalty).");
    }
  };

  // While the current user's id hasn't resolved yet, don't render the
  // "searching" UI as if a real queue connection is active — there isn't
  // one yet, and briefly showing it invites clicking into a queue state
  // that's about to reconnect out from under it.
  if (userLoading || !user?.id) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0F] text-[var(--color-text-secondary)] font-mono text-xs uppercase tracking-widest"
        role="dialog"
        aria-modal="true"
        aria-label="Matchmaking Queue"
      >
        Loading profile...
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[#0A0A0F] text-[var(--color-text-primary)] overflow-hidden animate-[rise-in_220ms_cubic-bezier(0.16,1,0.3,1)_both]"
      role="dialog"
      aria-modal="true"
      aria-label="Matchmaking Queue"
    >
      {/* ── Background Vignette & Subtle Radial Spotlight ──────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(224,70,70,0.07)_0%,_rgba(10,10,15,0.85)_50%,_#0A0A0F_100%)] pointer-events-none" />

      {/* Subtle grid pattern background overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── MINIMAL TOP NAVBAR ─────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 md:px-10 border-b border-[var(--color-border)]/50 bg-[#0A0A0F]/60 backdrop-blur-sm">
        {/* Logo top-left */}
        <div className="font-sans font-black text-xl tracking-tighter flex items-center text-white select-none">
          <span className="font-mono text-[var(--color-accent)] mr-1">&gt;</span>
          CODEWARS
        </div>

        {/* Small close/back icon top-right */}
        <button
          onClick={onCancel}
          className="p-2 text-[var(--color-text-secondary)] hover:text-white transition-colors cursor-pointer"
          aria-label="Exit queue"
          title="Exit queue"
        >
          <X size={20} />
        </button>
      </header>

      {/* ── CENTER-STAGE DUEL COMPOSITION ──────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-5xl mx-auto w-full">
        {/* Duel Horizon Row */}
        <div className="flex items-center justify-center w-full gap-4 sm:gap-8 md:gap-14 my-auto">

          {/* ───────────────────────────────────────────────────────────── */}
          {/* LEFT CIRCLE: Current User (Player One)                        */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="flex flex-col items-center group">
            <div className="relative">
              <div
                className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full p-1 border-2 border-[var(--color-accent)] bg-[var(--color-surface)] shadow-[0_0_24px_rgba(224,70,70,0.25)] flex items-center justify-center relative transition-transform duration-300 group-hover:scale-[1.02]"
              >
                <div className="w-full h-full rounded-full overflow-hidden relative bg-[var(--color-surface-2)] flex items-center justify-center">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={48} className="text-[var(--color-text-secondary)]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Ready / Accepted Status Tag */}
              <div
                className={`absolute -bottom-1 -right-1 sm:bottom-0 sm:right-0 ${
                  hasAccepted
                    ? "bg-[var(--color-success)] text-black"
                    : "bg-[var(--color-accent)] text-white"
                } font-mono text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 border-2 border-[#0A0A0F] shadow-lg`}
              >
                <Check size={12} strokeWidth={3} />
                {hasAccepted ? "ACCEPTED" : "READY"}
              </div>
            </div>

            {/* Username & ELO Badge */}
            <div className="mt-4 text-center space-y-1">
              <h3 className="font-sans font-bold text-base sm:text-lg text-[var(--color-text-primary)] tracking-tight">
                {userName}
              </h3>
              <div className="inline-flex items-center gap-1 px-3 py-0.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-full">
                <span className="font-mono text-xs font-semibold text-[var(--color-tier-gold)]">
                  {userElo} ELO
                </span>
              </div>
            </div>
          </div>


          {/* ───────────────────────────────────────────────────────────── */}
          {/* CENTER: VS Divider & 15s Ready Check Countdown                */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-center px-2 sm:px-4 relative">
            <div className="hidden md:block w-16 lg:w-28 h-[1px] bg-gradient-to-r from-[var(--color-accent)]/80 via-[var(--color-accent)]/40 to-transparent" />

            <div className="relative px-3 sm:px-6 flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-[var(--color-accent)]/15 blur-xl rounded-full pointer-events-none" />

              <span className="font-sans font-black italic text-4xl sm:text-5xl md:text-6xl text-[var(--color-text-primary)] tracking-tighter drop-shadow-[0_0_12px_rgba(224,70,70,0.5)] select-none">
                VS
              </span>

              {matchState === "found" || matchState === "accepted" ? (
                <div className="mt-2 flex flex-col items-center">
                  <span className="font-mono text-xs font-bold text-[var(--color-accent)] uppercase tracking-widest animate-pulse">
                    READY CHECK
                  </span>
                  <div className="font-mono text-lg font-extrabold text-white bg-[var(--color-surface)] border border-[var(--color-accent)] px-2.5 py-0.5 mt-1">
                    00:{String(readyCountdown).padStart(2, "0")}s
                  </div>
                </div>
              ) : (
                <span className="font-mono text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] uppercase tracking-[0.25em] mt-1 select-none">
                  DUEL 1V1
                </span>
              )}
            </div>

            <div className="hidden md:block w-16 lg:w-28 h-[1px] bg-gradient-to-l from-[var(--color-border)] via-[var(--color-border)]/50 to-transparent" />
          </div>


          {/* ───────────────────────────────────────────────────────────── */}
          {/* RIGHT CIRCLE: Opponent (Searching or Ready Check State)        */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="flex flex-col items-center group">
            {matchState === "searching" ? (
              /* SEARCHING STATE */
              <>
                <div className="relative">
                  <div className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full border-2 border-dashed border-[var(--color-text-tertiary)]/70 bg-[var(--color-surface)]/40 flex items-center justify-center relative animate-[pulse-live_2.2s_ease-in-out_infinite]">
                    <svg
                      className="absolute -inset-1.5 w-[calc(100%+12px)] h-[calc(100%+12px)] animate-[spin_5s_linear_infinite] pointer-events-none"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="48"
                        fill="none"
                        stroke="var(--color-accent)"
                        strokeWidth="2.5"
                        strokeDasharray="40 180"
                        strokeLinecap="round"
                        opacity="0.8"
                      />
                    </svg>

                    <div className="w-[calc(100%-8px)] h-[calc(100%-8px)] rounded-full bg-[var(--color-surface-2)]/60 flex items-center justify-center">
                      <User size={48} className="text-[var(--color-text-secondary)]/50 animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center space-y-1">
                  <div className="font-sans font-medium text-sm sm:text-base text-[var(--color-text-secondary)] flex items-center justify-center gap-1">
                    <span>Searching for opponent</span>
                    <span className="inline-flex w-4 text-left font-mono font-bold animate-pulse">...</span>
                  </div>
                </div>
              </>
            ) : (
              /* MATCH FOUND / ACCEPTED STATE */
              <>
                <div className="relative animate-[rise-in_220ms_cubic-bezier(0.16,1,0.3,1)_both]">
                  <div className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full p-1 border-2 border-[var(--color-success)] bg-[var(--color-surface)] shadow-[0_0_24px_rgba(16,185,129,0.3)] flex items-center justify-center relative">
                    <div className="w-full h-full rounded-full overflow-hidden relative bg-[var(--color-surface-2)] flex items-center justify-center">
                      {opponentData?.avatar ? (
                        <img
                          src={opponentData?.avatar}
                          alt={opponentData?.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={48} className="text-[var(--color-text-secondary)]" />
                      )}
                    </div>
                  </div>

                  <div className="absolute -bottom-1 -right-1 sm:bottom-0 sm:right-0 bg-[var(--color-success)] text-black font-mono text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 border-2 border-[#0A0A0F] shadow-lg">
                    <Check size={12} strokeWidth={3} />
                    FOUND
                  </div>
                </div>

                <div className="mt-4 text-center space-y-1">
                  <h3 className="font-sans font-bold text-base sm:text-lg text-white tracking-tight">
                    {opponentData?.username || "Opponent"}
                  </h3>
                  <div className="inline-flex items-center gap-1 px-3 py-0.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-full">
                    <span className="font-mono text-xs font-semibold text-[var(--color-success)]">
                      {opponentData?.elo} ELO
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── ABANDON / PENALTY FEEDBACK BANNER ───────────────────────────── */}
        {abandonMessage && (
          <div className="mt-6 px-4 py-3 bg-[var(--color-accent-muted)] border border-[var(--color-accent)] text-white font-mono text-xs text-center flex items-center justify-center gap-2 max-w-lg mx-auto animate-[rise-in_180ms_ease-out_both]">
            <ShieldAlert size={16} className="text-[var(--color-accent)] shrink-0" />
            <span>{abandonMessage}</span>
          </div>
        )}

        {/* ── READY CHECK ACTION BUTTONS ──────────────────────────────────── */}
        {(matchState === "found" || matchState === "accepted") && (
          <div className="mt-8 flex items-center justify-center gap-4 animate-[rise-in_220ms_cubic-bezier(0.16,1,0.3,1)_both]">
            {!hasAccepted ? (
              <>
                <button
                  onClick={handleAccept}
                  className="px-8 py-3.5 bg-[var(--color-success)] hover:bg-[#0d9e6e] text-black font-mono font-extrabold text-sm uppercase tracking-[0.2em] flex items-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-200 active:scale-95 cursor-pointer"
                  style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
                >
                  <span>ENTER ARENA NOW</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>

                <button
                  onClick={handleDecline}
                  className="px-5 py-3.5 border border-[var(--color-accent)] hover:bg-[var(--color-accent-muted)] text-[var(--color-accent)] font-mono text-xs uppercase tracking-wider transition-colors active:scale-95 cursor-pointer"
                  style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)" }}
                >
                  Decline (-10 ELO)
                </button>
              </>
            ) : (
              <div className="px-8 py-3.5 bg-[var(--color-surface-2)] border border-[var(--color-success)] text-[var(--color-success)] font-mono font-bold text-xs uppercase tracking-widest flex items-center gap-2 animate-pulse">
                <Check size={16} />
                <span>WAITING FOR OPPONENT TO ENTER...</span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── BELOW THE DUEL: STATUS & CONTROLS ──────────────────────────── */}
      <footer className="relative z-20 flex flex-col items-center justify-center gap-4 px-6 py-6 border-t border-[var(--color-border)]/60 bg-[#0A0A0F]/90 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-1">
          <div className="font-mono text-xs sm:text-sm text-[var(--color-text-secondary)] tracking-widest uppercase flex items-center gap-2">
            <span>ELAPSED TIME:</span>
            <span
              key={elapsed}
              className="font-mono font-bold text-sm sm:text-base text-white tabular-nums bg-[var(--color-surface)] px-2.5 py-0.5 border border-[var(--color-border)]"
              style={tick ? { animation: "count-tick 150ms ease-out" } : undefined}
            >
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
          <p className="font-sans text-xs text-[var(--color-text-secondary)]">
            Estimated wait: <span className="font-mono text-white font-medium">~30s</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
          <button
            onClick={onCancel}
            className="px-5 py-2 border border-[var(--color-border)] hover:border-[var(--color-text-secondary)] text-[var(--color-text-secondary)] hover:text-white bg-[var(--color-surface)]/50 transition-colors duration-[150ms] font-mono text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 cursor-pointer"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)" }}
            aria-label="Cancel queue search"
          >
            <X size={14} />
            <span>Cancel Queue</span>
          </button>

          {(showBotFallback || matchState === "searching") && onPlayVsBot && (
            <button
              onClick={onPlayVsBot}
              className="px-5 py-2 border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-primary)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] transition-colors duration-[150ms] font-mono text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 cursor-pointer"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)" }}
            >
              <Bot size={14} className="text-[var(--color-accent)]" />
              <span>Play vs Bot instead</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}