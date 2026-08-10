"use client";

/**
 * features/match/components/MatchArena.tsx
 *
**/

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Navbar } from "@/components/layout/navbar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMatchSocket } from "@/hooks/use-match-socket";
import {
  runCode,
  submitCode,
  verdictToStatus,
  formatRuntime,
  formatMemory,
  type SubmissionLanguage,
} from "@/features/problems/services/submissions-service";
import {
  MatchArenaData,
  MatchProblemSpec,
  MatchDifficulty,
  TestCaseResult,
  SubmissionVerdict,
  LiveActivityEvent,
} from "../types";
import {
  Play,
  Upload,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Trophy,
  Swords,
  ChevronDown,
  ArrowLeft,
  Flame,
  ShieldAlert,
  Search,
  X,
  FileCode,
  Check,
} from "lucide-react";

// ── Language Configuration matching problem-page.tsx ──────────────────────────
type LangKey = "python" | "cpp" | "javascript";

interface LangConfig {
  label: string;
  monacoLang: string;
  solutionExt: string;
}

const LANGUAGES: Record<LangKey, LangConfig> = {
  python: { label: "Python 3.10", monacoLang: "python", solutionExt: "solution.py" },
  cpp: { label: "C++ 20", monacoLang: "cpp", solutionExt: "solution.cpp" },
  javascript: { label: "JavaScript (Node)", monacoLang: "javascript", solutionExt: "solution.js" },
};

interface MatchArenaProps {
  initialMatchData?: MatchArenaData;
}

export function MatchArena({ initialMatchData }: MatchArenaProps) {
  const { user } = useCurrentUser();
  const { theme, resolvedTheme } = useTheme();

  // ── Player / Opponent identity & elo — MUST be declared before
  // useMatchSocket() below, since we pass `myElo` into that call. Declaring
  // these after the hook call caused a temporal-dead-zone ReferenceError
  // on every render (Fix #1). ──────────────────────────────────────────────
  const myUsername = initialMatchData?.me.displayName || user?.display_name || user?.username || "You";
  const myElo = initialMatchData?.me.elo || user?.elo || 1250;
  const oppUsername = initialMatchData?.opponent.displayName || "Opponent";
  const oppElo = initialMatchData?.opponent.elo ?? 1280;

  // Active Problem & Language State
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [activeLanguage, setActiveLanguage] = useState<LangKey>("python");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Theme calculation (supports system / light / dark)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted && (theme === "light" || resolvedTheme === "light");

  // Match Problems List from backend
  const problems = initialMatchData?.problems || [];
  const activeProblem = problems[activeProblemIdx] || problems[0];

  // Code state per problem-language
  const [solutionCodes, setSolutionCodes] = useState<Record<string, Record<string, string>>>(() => {
    const map: Record<string, Record<string, string>> = {};
    problems.forEach((p) => {
      map[p.id] = {};
      if (p.starterCode) {
        Object.entries(p.starterCode).forEach(([lang, code]) => {
          map[p.id][lang] = code;
        });
      }
      map[p.id]["python"] = map[p.id]["python"] || p.starterCode?.python || "";
      map[p.id][activeLanguage] = map[p.id][activeLanguage] || p.starterCode?.[activeLanguage] || p.starterCode?.python || "";
    });
    return map;
  });

  // Update starter code when active problem or language changes
  useEffect(() => {
    if (!activeProblem) return;
    setSolutionCodes((prev) => {
      const existingProb = prev[activeProblem.id] || {};
      if (existingProb[activeLanguage] !== undefined) return prev;
      return {
        ...prev,
        [activeProblem.id]: {
          ...existingProb,
          [activeLanguage]:
            activeProblem.starterCode?.[activeLanguage] ||
            activeProblem.starterCode?.python ||
            "",
        },
      };
    });
  }, [activeProblem, activeLanguage]);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");

  // Player & Opponent State
  const [meScore, setMeScore] = useState(initialMatchData?.me.currentScore || 0);
  const [oppScore, setOppScore] = useState(initialMatchData?.opponent.currentScore || 0);
  const [meSolved, setMeSolved] = useState<string[]>(initialMatchData?.me.solvedProblemIds || []);
  const [oppSolved, setOppSolved] = useState<string[]>(initialMatchData?.opponent.solvedProblemIds || []);

  // Refs mirroring meSolved/oppSolved so the WS callback (created once by
  // useMatchSocket, potentially not re-subscribed every render) always
  // reads the CURRENT solved list rather than a stale one captured at
  // mount time (Fix #2). Kept in sync via the effects below.
  const meSolvedRef = useRef<string[]>(meSolved);
  const oppSolvedRef = useRef<string[]>(oppSolved);
  useEffect(() => {
    meSolvedRef.current = meSolved;
  }, [meSolved]);
  useEffect(() => {
    oppSolvedRef.current = oppSolved;
  }, [oppSolved]);

  // Timer & Mount State
  const [timeLeft, setTimeLeft] = useState(1200);
  const [isMounted, setIsMounted] = useState(false);
  const [isMatchEnded, setIsMatchEnded] = useState(false);
  const [winner, setWinner] = useState<"me" | "opponent" | "draw" | null>(null);
  // Authoritative ELO delta for the current user, populated only once the
  // server's match.end event arrives (Fix #3). Null until then.
  const [myEloDelta, setMyEloDelta] = useState<number | null>(null);

  // Resizable panels
  const [leftWidth, setLeftWidth] = useState(38);
  const [consoleTab, setConsoleTab] = useState<"testcases" | "live_feed">("testcases");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastVerdict, setLastVerdict] = useState<SubmissionVerdict | null>(null);

  // Live Activity Feed (initialized empty to prevent SSR/locale hydration mismatch)
  const [activityFeed, setActivityFeed] = useState<LiveActivityEvent[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize client-only states on mount
  useEffect(() => {
    setIsMounted(true);
    if (initialMatchData?.timerEndUnix) {
      const calculated = Math.max(0, initialMatchData.timerEndUnix - Math.floor(Date.now() / 1000));
      setTimeLeft(calculated);
    }
    setActivityFeed([
      {
        id: "ev-1",
        timestamp: new Date().toLocaleTimeString(),
        type: "match_started",
        actorName: "System",
        actorType: "system",
        message: `1v1 Ranked Match Started! Arena: ${initialMatchData?.arenaName || "Iron Citadel"}`,
      },
    ]);
  }, [initialMatchData]);

  // Listen to toggle-sidebar event from Navbar
  useEffect(() => {
    const handleToggle = () => {
      setSidebarOpen((prev) => !prev);
    };
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  // Server-authoritative match end. Call this instead of computing the
  // winner from local score state (Fix #3). Falls back to a client-side
  // guess (old behavior) ONLY if invoked without a server payload, so the
  // UI still resolves gracefully if the WS event is ever missed — but the
  // real fix is to make sure onMatchEnd below always fires before the
  // timer-based fallback in the effect underneath it.
  const endMatch = (serverPayload?: {
    winnerId?: string | null;
    eloDelta?: number;
    p1Score?: number;
    p2Score?: number;
  }) => {
    setIsMatchEnded(true);

    if (serverPayload) {
      const meId = initialMatchData?.me.id;
      if (!serverPayload.winnerId) {
        setWinner("draw");
      } else if (serverPayload.winnerId === meId) {
        setWinner("me");
      } else {
        setWinner("opponent");
      }
      if (typeof serverPayload.eloDelta === "number") {
        setMyEloDelta(serverPayload.eloDelta);
      }
      return;
    }

    // Fallback — no server confirmation yet. Marked clearly in the UI via
    // myEloDelta staying null (see the modal, which shows "Pending..."
    // rather than inventing a number).
    if (meScore > oppScore) {
      setWinner("me");
    } else if (oppScore > meScore) {
      setWinner("opponent");
    } else {
      setWinner("draw");
    }
  };

  // Connect to the match WebSocket connection
  useMatchSocket({
    userId: user?.id,
    arenaId: initialMatchData?.arenaSlug || "kabul",
    elo: myElo,
    enabled: !!user?.id,
    onMatchUpdate: (data) => {
      console.log("[MatchArena] Received match update event:", data);
      const isMe = data.user_id === user?.id;
      const scores = data.scores;
      const solvedIds = data.solved_problem_ids;

      if (isMe) {
        const mySolvedList = initialMatchData?.me.id === data.user_id ? solvedIds.p1 : solvedIds.p2;
        setMeSolved(mySolvedList || []);
        const myNewScore = initialMatchData?.me.id === data.user_id ? scores.p1 : scores.p2;
        setMeScore(myNewScore);
      } else {
        const oppSolvedList = initialMatchData?.opponent.id === data.user_id ? solvedIds.p1 : solvedIds.p2;

        // Compare against the ref (always current), not the `oppSolved`
        // closed over when this callback was created (Fix #2).
        const newlySolved = (oppSolvedList || []).filter(
          (id: string) => !oppSolvedRef.current.includes(id)
        );

        if (newlySolved.length > 0) {
          setOppSolved(oppSolvedList);
          const oppNewScore = initialMatchData?.opponent.id === data.user_id ? scores.p1 : scores.p2;
          setOppScore(oppNewScore);

          newlySolved.forEach((pid: string) => {
            const solvedProb = problems.find((p) => p.id === pid);
            const probTitle = solvedProb?.title || "a problem";
            const addedPts = (solvedProb?.scoreValue || 0) * 100;

            setActivityFeed((prev) => [
              {
                id: `ev-${Date.now()}-${pid}`,
                timestamp: new Date().toLocaleTimeString(),
                type: "problem_solved",
                actorName: oppUsername,
                actorType: "opponent",
                message: `${oppUsername} solved ${probTitle} (+${addedPts} pts)`,
                scoreChange: addedPts,
              },
              ...prev,
            ]);
          });

          // NOTE: we no longer trigger endMatch() speculatively here.
          // The server's match.end event (onMatchEnd below) is the single
          // source of truth for when the match is actually over.
        } else {
          // Opponent failed/attempted submission
          const failedProb = problems.find((p) => p.id === data.problem_id);
          const probTitle = failedProb?.title || "a problem";
          const isAccepted = data.verdict === "accepted";

          if (!isAccepted) {
            setActivityFeed((prev) => [
              {
                id: `ev-${Date.now()}-${data.problem_id}`,
                timestamp: new Date().toLocaleTimeString(),
                type: "submission_failed",
                actorName: oppUsername,
                actorType: "opponent",
                message: `${oppUsername} failed submission on ${probTitle}`,
              },
              ...prev,
            ]);
          }
        }
      }
    },
    // Assumed shape per the WS Event Schema in DESIGN docs:
    // { winner_id, elo_delta, p1_score, p2_score }. If useMatchSocket
    // doesn't expose this callback yet, this is the integration point to
    // add on the hook / backend side so match end is never client-decided.
    onMatchEnd: (data: any) => {
      endMatch({
        winnerId: data?.winner_id ?? null,
        eloDelta:
          initialMatchData?.me.id === initialMatchData?.me.id // always true; kept for clarity
            ? (initialMatchData?.me.id === data?.winner_id ? data?.elo_delta : -Math.abs(data?.elo_delta ?? 0))
            : undefined,
        p1Score: data?.p1_score,
        p2Score: data?.p2_score,
      });
    },
  });

  // Countdown timer effect — client-side fallback only. Recomputes from the
  // server-issued timerEndUnix each tick (rather than blindly decrementing)
  // to resist background-tab throttling drift. When it hits 0, it calls
  // endMatch() WITHOUT a server payload as a last resort; the modal shows
  // "Pending..." for ELO until the real match.end event lands.
  useEffect(() => {
    if (isMatchEnded) return;

    const timer = setInterval(() => {
      if (initialMatchData?.timerEndUnix) {
        const remaining = Math.max(0, initialMatchData.timerEndUnix - Math.floor(Date.now() / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
          endMatch();
        }
        return;
      }
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          endMatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMatchEnded, initialMatchData?.timerEndUnix]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getDifficultyColor = (diff: MatchDifficulty) => {
    switch (diff) {
      case "easy":
        return isLight
          ? "text-emerald-700 bg-emerald-50 border-emerald-300"
          : "text-emerald-400 bg-emerald-950/40 border-emerald-800/40";
      case "medium":
        return isLight
          ? "text-amber-700 bg-amber-50 border-amber-300"
          : "text-amber-400 bg-amber-950/40 border-amber-800/40";
      case "hard":
        return isLight
          ? "text-rose-700 bg-rose-50 border-rose-300"
          : "text-rose-400 bg-rose-950/40 border-rose-800/40";
      default:
        return "text-zinc-500 bg-zinc-100 border-zinc-300";
    }
  };

  const handleReset = () => {
    if (!activeProblem) return;
    const defaultCode = activeProblem.starterCode?.[activeLanguage] || activeProblem.starterCode?.python || "";
    setSolutionCodes((prev) => ({
      ...prev,
      [activeProblem.id]: {
        ...(prev[activeProblem.id] || {}),
        [activeLanguage]: defaultCode,
      },
    }));
    setLastVerdict(null);
  };

  // Run Test Cases via shared problem submission service
  const handleRun = async () => {
    if (!activeProblem || isRunning || isSubmitting) return;

    setIsRunning(true);
    setConsoleTab("testcases");

    try {
      const result = await runCode({
        problem_id: activeProblem.id,
        language: activeLanguage as SubmissionLanguage,
        source_code: solutionCodes[activeProblem.id]?.[activeLanguage] || "",
        match_id: initialMatchData?.matchId,
      });

      const status = verdictToStatus(result.verdict);
      const cases: TestCaseResult[] = (result.test_cases || []).map((tc: any, i: number) => ({
        id: i + 1,
        status: tc.passed ? "accepted" : "wrong_answer",
        input: tc.input || activeProblem.sampleCases[i]?.input || "[hidden]",
        expectedOutput: tc.expected_output || activeProblem.sampleCases[i]?.expectedOutput || "[hidden]",
        actualOutput: tc.actual_output || "",
        executionTimeMs: result.runtime_ms || 12,
        memoryKb: result.memory_kb || 14000,
      }));

      setLastVerdict({
        status: status === "accepted" ? "accepted" : "wrong_answer",
        score: result.score || (status === "accepted" ? 100 : 0),
        passCount: result.passed_testcases ?? (status === "accepted" ? cases.length : 0),
        totalCount: result.total_testcases || cases.length || 1,
        runtimeMs: result.runtime_ms || 14,
        memoryKb: result.memory_kb || 14200,
        results: cases,
      });
    } catch (err) {
      console.error("[MatchArena] Run error:", err);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Solution to backend & update live match state.
  //
  // Fix #4: we intentionally do NOT mutate meScore/meSolved here anymore.
  // The backend's create_and_evaluate_submission broadcasts a
  // "match.update" WS event to BOTH players (including the submitter)
  // once the verdict is judged — that event, handled in onMatchUpdate
  // above, is now the single source of truth for score/solved state. This
  // avoids the double-update / flicker risk where the optimistic local
  // bump and the server's authoritative broadcast could briefly disagree
  // (e.g. if server-side scoring differs from the client's local
  // scoreValue mapping).
  const handleSubmit = async () => {
    if (!activeProblem || isRunning || isSubmitting) return;

    setIsSubmitting(true);
    setConsoleTab("testcases");

    try {
      const result = await submitCode({
        problem_id: activeProblem.id,
        language: activeLanguage as SubmissionLanguage,
        source_code: solutionCodes[activeProblem.id]?.[activeLanguage] || "",
        match_id: initialMatchData?.matchId,
      });

      const status = verdictToStatus(result.verdict);
      const isAccepted = status === "accepted";
      const cases: TestCaseResult[] = (result.test_cases || []).map((tc: any, i: number) => ({
        id: i + 1,
        status: tc.passed ? "accepted" : "wrong_answer",
        input: tc.input || activeProblem.sampleCases[i]?.input || "[hidden]",
        expectedOutput: tc.expected_output || activeProblem.sampleCases[i]?.expectedOutput || "[hidden]",
        actualOutput: tc.actual_output || "",
        executionTimeMs: result.runtime_ms || 15,
        memoryKb: result.memory_kb || 14000,
      }));

      setLastVerdict({
        status: isAccepted ? "accepted" : "wrong_answer",
        score: result.score || (isAccepted ? 100 : 0),
        passCount: result.passed_testcases ?? (isAccepted ? cases.length : 0),
        totalCount: result.total_testcases || cases.length || 1,
        runtimeMs: result.runtime_ms || 18,
        memoryKb: result.memory_kb || 14500,
        results: cases,
      });

      // Local, non-authoritative feedback only: log the accepted submission
      // to the activity feed immediately for snappy UX. The authoritative
      // meScore/meSolved/opponent-solved updates arrive via onMatchUpdate.
      if (isAccepted && !meSolvedRef.current.includes(activeProblem.id)) {
        setActivityFeed((prev) => [
          {
            id: `ev-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            type: "problem_solved",
            actorName: myUsername,
            actorType: "me",
            message: `Solved ${activeProblem.title} — awaiting confirmation...`,
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      console.error("[MatchArena] Submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drag resizing for left/right split
  const handleLeftResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const initialWidth = leftWidth;
    const containerWidth = containerRef.current?.getBoundingClientRect().width || 1;

    const onMove = (ev: MouseEvent) => {
      const delta = ((ev.clientX - startX) / containerWidth) * 100;
      setLeftWidth(Math.max(25, Math.min(55, initialWidth + delta)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden select-none"
      style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}
    >
      {/* ── Top Navbar with Live Timer & Match Score centered in Navbar ──────── */}
      <Navbar
        breadcrumbs={[
          { label: "CodeWars Arena", href: "/play" },
          { label: "1v1 Match" },
        ]}
        extra={
          <div
            className="flex items-center gap-3 px-3 py-1 rounded-full border font-mono text-xs shadow-sm"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{myUsername}</span>
              <span className="font-bold text-emerald-500">{meScore} pts</span>
            </div>

            <div
              className="flex items-center gap-1 px-2.5 py-0.5 rounded border font-bold"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            >
              <Clock className={`w-3.5 h-3.5 ${timeLeft < 180 ? "text-red-500 animate-pulse" : "text-[var(--color-text-secondary)]"}`} />
              <span className={timeLeft < 180 ? "text-red-500 font-mono" : "font-mono"}>
                {isMounted ? formatTimer(timeLeft) : "20:00"}
              </span>

            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-red-500">{oppScore} pts</span>
              <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{oppUsername}</span>
            </div>
          </div>
        }
      />

      {/* ── Custom Match Sidebar Drawer ─────────────────────────────────────── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />

          <div
            className="fixed left-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden transition-all duration-200"
            style={{
              width: "340px",
              background: "var(--color-bg)",
              borderRight: "1px solid var(--color-border)",
              boxShadow: "4px 0 40px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex flex-col border-b" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black text-white"
                    style={{ background: "var(--color-accent)" }}
                  >
                    1v1
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black tracking-widest font-mono" style={{ color: "var(--color-text-primary)" }}>
                      MATCH PROBLEMS
                    </span>
                    <span className="text-[9px] font-mono tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
                      {problems.length} PROBLEMS IN BATTLE
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-2)] transition"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Back to Arena CTA */}
              <div className="px-4 pb-3">
                <Link
                  href="/play"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[11px] font-bold font-mono tracking-wide border transition"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Exit Match to Arena</span>
                </Link>
              </div>

              {/* Search filter */}
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }} />
                  <input
                    type="text"
                    placeholder="Search match problems..."
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-[11px] rounded-lg font-mono outline-none border transition"
                    style={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Match Problem Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {problems
                .filter((p) => p.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
                .map((p, idx) => {
                  const isActive = idx === activeProblemIdx;
                  const isSolvedByMe = meSolved.includes(p.id);
                  const isSolvedByOpp = oppSolved.includes(p.id);

                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveProblemIdx(idx);
                        setSidebarOpen(false);
                      }}
                      className="w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3"
                      style={{
                        background: isActive ? "var(--color-surface-2)" : "var(--color-surface)",
                        borderColor: isActive ? "var(--color-accent)" : "var(--color-border)",
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "var(--color-surface-2)", color: "var(--color-text-primary)" }}
                      >
                        P{idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{p.title}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-mono border ${getDifficultyColor(p.difficulty)}`}>
                            {p.difficulty}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2 text-[11px] font-mono">
                          <span className="text-emerald-500 font-semibold">+{p.scoreValue * 100} PTS</span>
                          <div className="flex items-center gap-2">
                            {isSolvedByMe && (
                              <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> You
                              </span>
                            )}
                            {isSolvedByOpp && (
                              <span className="flex items-center gap-1 text-red-500 font-semibold">
                                <Flame className="w-3.5 h-3.5" /> Opponent
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </>
      )}

      {/* ── Main Workspace split layout ───────────────────────────────────────── */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Problem Statement */}
        {activeProblem ? (
          <div
            className="flex flex-col border-r overflow-y-auto p-5"
            style={{ width: `${leftWidth}%`, background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{activeProblem.title}</h2>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-mono uppercase border ${getDifficultyColor(activeProblem.difficulty)}`}>
                  {activeProblem.difficulty}
                </span>
                <span
                  className="font-mono text-xs font-semibold px-2 py-0.5 rounded border text-emerald-500"
                  style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
                >
                  +{activeProblem.scoreValue * 100} PTS
                </span>
              </div>
            </div>

            <div className="prose max-w-none text-xs space-y-4 font-sans leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              <p className="whitespace-pre-line text-sm" style={{ color: "var(--color-text-primary)" }}>{activeProblem.description}</p>

              {activeProblem.inputFormat && (
                <div className="space-y-1">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider font-semibold" style={{ color: "var(--color-text-secondary)" }}>Input Format</h4>
                  <p className="text-xs font-mono p-2.5 rounded border" style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
                    {activeProblem.inputFormat}
                  </p>
                </div>
              )}

              {activeProblem.outputFormat && (
                <div className="space-y-1">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider font-semibold" style={{ color: "var(--color-text-secondary)" }}>Output Format</h4>
                  <p className="text-xs font-mono p-2.5 rounded border" style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
                    {activeProblem.outputFormat}
                  </p>
                </div>
              )}

              {activeProblem.sampleCases?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider font-semibold" style={{ color: "var(--color-text-secondary)" }}>Sample Cases</h4>
                  {activeProblem.sampleCases.map((sc, i) => (
                    <div
                      key={i}
                      className="rounded border p-3 space-y-1.5 font-mono text-xs"
                      style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
                    >
                      <div>
                        <span style={{ color: "var(--color-text-secondary)" }}>Input:</span>
                        <div style={{ color: "var(--color-text-primary)" }}>{sc.input}</div>
                      </div>
                      <div>
                        <span style={{ color: "var(--color-text-secondary)" }}>Expected Output:</span>
                        <div className="text-emerald-500 font-semibold">{sc.expectedOutput}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeProblem.constraints?.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider font-semibold" style={{ color: "var(--color-text-secondary)" }}>Constraints</h4>
                  <ul className="list-disc list-inside text-xs font-mono space-y-0.5" style={{ color: "var(--color-text-secondary)" }}>
                    {activeProblem.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs" style={{ width: `${leftWidth}%`, color: "var(--color-text-secondary)" }}>
            Loading match problem statement...
          </div>
        )}

        {/* Drag Resizer Bar */}
        <div
          onMouseDown={handleLeftResizeStart}
          className="w-1 hover:w-1.5 cursor-col-resize hover:bg-[var(--color-accent)] transition-all shrink-0 z-10"
          style={{ background: "var(--color-border)" }}
        />

        {/* Right Panel: Monaco Editor & Output Console */}
        <div className="flex-1 flex flex-col h-full min-w-0" style={{ background: "var(--color-bg)" }}>
          {/* Top Code Bar Toolbar */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b shrink-0"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 border font-mono text-xs px-3 py-1 rounded transition"
                style={{
                  background: "var(--color-surface-2)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              >
                <FileCode className="w-3.5 h-3.5" style={{ color: "var(--color-text-secondary)" }} />
                <span>{LANGUAGES[activeLanguage].label}</span>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--color-text-secondary)" }} />
              </button>

              {langDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-44 border rounded shadow-xl py-1 z-30 font-mono text-xs"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {(Object.keys(LANGUAGES) as LangKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveLanguage(key);
                        setLangDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-surface-2)] transition flex items-center justify-between"
                    >
                      <span>{LANGUAGES[key].label}</span>
                      {activeLanguage === key && <Check className="w-3.5 h-3.5 text-red-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-mono transition"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Code</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              theme={isLight ? "light" : "vs-dark"}
              language={LANGUAGES[activeLanguage].monacoLang}
              value={activeProblem ? solutionCodes[activeProblem.id]?.[activeLanguage] || "" : ""}
              onChange={(val) => {
                if (!activeProblem) return;
                setSolutionCodes((prev) => ({
                  ...prev,
                  [activeProblem.id]: {
                    ...(prev[activeProblem.id] || {}),
                    [activeLanguage]: val || "",
                  },
                }));
              }}
              options={{
                fontSize: 13,
                fontFamily: "JetBrains Mono, monospace",
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* Console / Output Tabs */}
          <div
            className="h-44 border-t flex flex-col shrink-0"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center justify-between px-4 py-1.5 border-b bg-[var(--color-surface-2)]" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setConsoleTab("testcases")}
                  className={`text-xs font-mono pb-1 border-b-2 transition ${
                    consoleTab === "testcases"
                      ? "border-red-500 font-semibold text-[var(--color-text-primary)]"
                      : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  Test Results {lastVerdict && `(${lastVerdict.passCount}/${lastVerdict.totalCount})`}
                </button>
                <button
                  onClick={() => setConsoleTab("live_feed")}
                  className={`text-xs font-mono pb-1 border-b-2 transition ${
                    consoleTab === "live_feed"
                      ? "border-red-500 font-semibold text-[var(--color-text-primary)]"
                      : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  2-Player Live Feed ({activityFeed.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRun}
                  disabled={isRunning || isSubmitting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition disabled:opacity-50"
                  style={{
                    background: "var(--color-surface-2)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <Play className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                  <span>{isRunning ? "Running..." : "Run Tests"}</span>
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isRunning || isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-mono font-bold text-white transition shadow-sm disabled:opacity-50"
                  style={{ background: "var(--color-accent)" }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Submitting..." : "Submit Solution"}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
              {consoleTab === "testcases" ? (
                <div>
                  {!lastVerdict ? (
                    <div className="flex items-center gap-2 py-4 justify-center" style={{ color: "var(--color-text-secondary)" }}>
                      <Terminal className="w-4 h-4" />
                      <span>Run or submit your solution to view test case results.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: "var(--color-border)" }}>
                        <div className="flex items-center gap-2">
                          {lastVerdict.status === "accepted" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span
                            className="font-bold text-sm uppercase"
                            style={{
                              color: lastVerdict.status === "accepted" ? "var(--color-emerald-500, #10b981)" : "var(--color-red-500, #ef4444)",
                            }}
                          >
                            {lastVerdict.status === "accepted" ? "Accepted" : "Wrong Answer"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          <span>Runtime: <strong style={{ color: "var(--color-text-primary)" }}>{lastVerdict.runtimeMs} ms</strong></span>
                          <span>Memory: <strong style={{ color: "var(--color-text-primary)" }}>{(lastVerdict.memoryKb / 1024).toFixed(2)} MB</strong></span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {lastVerdict.results.map((res) => (
                          <div
                            key={res.id}
                            className="p-2 rounded border"
                            style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span style={{ color: "var(--color-text-secondary)" }}>Case {res.id}</span>
                              {res.status === "accepted" ? (
                                <span className="text-emerald-500 font-semibold">PASSED</span>
                              ) : (
                                <span className="text-red-500 font-semibold">FAILED</span>
                              )}
                            </div>
                            <div className="text-[11px] truncate" style={{ color: "var(--color-text-primary)" }}>Input: {res.input}</div>
                            {res.status === "accepted" ? (
                              <div className="text-emerald-500 text-[11px] truncate">Output: {res.actualOutput}</div>
                            ) : (
                              <div className="text-red-500 text-[11px] truncate">Output: {res.actualOutput}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {activityFeed.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between py-1 border-b text-xs"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>{ev.timestamp}</span>
                        <span
                          className={`font-semibold ${
                            ev.actorType === "me"
                              ? "text-emerald-500"
                              : ev.actorType === "opponent"
                              ? "text-red-500"
                              : "text-amber-500"
                          }`}
                        >
                          [{ev.actorName}]
                        </span>
                        <span style={{ color: "var(--color-text-primary)" }}>{ev.message}</span>
                      </div>
                      {ev.scoreChange && <span className="text-emerald-500 font-bold">+{ev.scoreChange} pts</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── End Match Modal ─────────────────────────────────────────────────── */}
      {isMatchEnded && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-md border rounded-lg p-6 text-center space-y-5 shadow-2xl"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            {winner === "me" ? (
              <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-center text-emerald-500 mx-auto">
                <Trophy className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-500/50 flex items-center justify-center text-red-500 mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
            )}

            <div>
              <h2 className="text-2xl font-extrabold uppercase" style={{ color: "var(--color-text-primary)" }}>
                {winner === "me" ? "VICTORY!" : winner === "opponent" ? "DEFEAT" : "DRAW MATCH"}
              </h2>
            </div>

            <div
              className="rounded border p-4 space-y-2 font-mono text-xs"
              style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
            >
              <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--color-border)" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Match Rating</span>
                {myEloDelta === null ? (
                  <span className="font-bold" style={{ color: "var(--color-text-secondary)" }}>
                    Pending...
                  </span>
                ) : (
                  <span className={`font-bold ${myEloDelta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {myEloDelta >= 0 ? "+" : ""}
                    {myEloDelta} ELO
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-primary)" }}>{myUsername} Score</span>
                <span className="font-bold text-emerald-500">{meScore} pts</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-primary)" }}>{oppUsername} Score</span>
                <span className="font-bold text-red-500">{oppScore} pts</span>
              </div>
            </div>

            <div className="w-full">
              <Link
                href="/play"
                className="block w-full py-2.5 rounded text-xs font-mono font-bold text-white transition"
                style={{ background: "var(--color-accent)" }}
              >
                Return to Arena
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}