"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import { Navbar } from "@/components/layout/navbar";
import { fetchProblemBySlug, fetchProblems, type FetchProblemDetailResponse, type Problem } from "../services/problems-service";
import {
  submitCode,
  runCode,
  verdictToStatus,
  formatRuntime,
  formatMemory,
  type SubmissionLanguage,
} from "../services/submissions-service";
import {
  HelpCircle,
  RotateCcw,
  BookOpen,
  Play,
  Upload,
  FileCode,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Terminal,
  Clock,
  MemoryStick,
  ThumbsUp,
  Tag,
  Home,
  Search,
  ArrowLeft,
  X,
} from "lucide-react";

// ── Language Configuration ────────────────────────────────────────────────────
type LangKey = "python" | "cpp" | "javascript";

interface LangConfig {
  label: string;
  monacoLang: string;
  solutionExt: string;
  defaultSolution: string;
}

const LANGUAGES: Record<LangKey, LangConfig> = {
  python: {
    label: "Python",
    monacoLang: "python",
    solutionExt: "solution.py",
    defaultSolution:
`def solve(grid: list[list[int]], energy: int) -> int:
    # Initialize district map
    max_area = 0
    rows = len(grid)
    cols = len(grid[0])

    # Start processing districts
    for r in range(rows):
        for c in range(cols):
            # Logic for symmetry check
            pass

    return max_area`,
  },
  cpp: {
    label: "C++",
    monacoLang: "cpp",
    solutionExt: "solution.cpp",
    defaultSolution:
`#include <vector>
#include <algorithm>
using namespace std;

int solve(vector<vector<int>>& grid, int energy) {
    // Initialize district map
    int maxArea = 0;
    int rows = grid.size();
    int cols = grid[0].size();

    // Start processing districts
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            // Logic for symmetry check
        }
    }

    return maxArea;
}`,
  },
  javascript: {
    label: "JavaScript",
    monacoLang: "javascript",
    solutionExt: "solution.js",
    defaultSolution:
`function solve(grid, energy) {
  // Initialize district map
  let maxArea = 0;
  const rows = grid.length;
  const cols = grid[0].length;

  // Start processing districts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Logic for symmetry check
    }
  }

  return maxArea;
}

module.exports = { solve };`,
  },
};

// ── Test result types ─────────────────────────────────────────────────────────
type TestStatus = "idle" | "running" | "passed" | "failed" | "accepted" | "wrong_answer";

interface TestCaseResult {
  id: number;
  input: string;
  expected: string;
  output: string;
  passed: boolean;
  runtime?: string;
}

interface RunResult {
  status: TestStatus;
  cases: TestCaseResult[];
  runtime?: string;
  memory?: string;
  message?: string;
  isSubmit?: boolean;
}


export function ProblemDetailsFeature({ initialToken }: { initialToken?: string }) {
  const params = useParams();
  const slug = params?.slug as string;

  // ── States ──
  const [activeLanguage, setActiveLanguage] = useState<LangKey>("python");
  const [langDropdownOpen, setLangDropdownOpen] = useState<boolean>(false);
  const [problem, setProblem] = useState<FetchProblemDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeResultTab, setActiveResultTab] = useState<number>(0);

  // Per-language solution code map
  const [solutionCodes, setSolutionCodes] = useState<Record<LangKey, string>>({
    python: LANGUAGES.python.defaultSolution,
    cpp: LANGUAGES.cpp.defaultSolution,
    javascript: LANGUAGES.javascript.defaultSolution,
  });

  // Run / submit states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Resizable panel state
  const [leftWidth, setLeftWidth] = useState<number>(28);
  const [rightWidth, setRightWidth] = useState<number>(28);
  const [isLeftClosed, setIsLeftClosed] = useState<boolean>(false);
  const [isRightClosed, setIsRightClosed] = useState<boolean>(false);

  // Custom sidebar navigation states
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sidebarProblems, setSidebarProblems] = useState<Problem[]>([]);
  const [sidebarSearch, setSidebarSearch] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);

  // ── Fetch problem details ──
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchProblemBySlug(slug)
      .then((data) => {
        setProblem(data);
        if (data.starter_code) {
          setSolutionCodes({
            python: data.starter_code.python || LANGUAGES.python.defaultSolution,
            cpp: data.starter_code.cpp || LANGUAGES.cpp.defaultSolution,
            javascript: data.starter_code.javascript || LANGUAGES.javascript.defaultSolution,
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching problem:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  // ── Listen to toggle-sidebar event ──
  useEffect(() => {
    const handleToggle = () => {
      setSidebarOpen((prev) => !prev);
    };
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  // ── Fetch problems for sidebar navigation ──
  useEffect(() => {
    fetchProblems()
      .then((data) => {
        setSidebarProblems(data);
      })
      .catch((err) => {
        console.error("Error fetching problems for sidebar:", err);
      });
  }, []);

  // ── Drag Resizing Handlers ──
  const handleLeftResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const initialWidth = leftWidth;
    const containerWidth = containerRef.current?.getBoundingClientRect().width || 1;

    const onMove = (ev: MouseEvent) => {
      const delta = ((ev.clientX - startX) / containerWidth) * 100;
      setLeftWidth(Math.max(18, Math.min(42, initialWidth + delta)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleRightResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const initialWidth = rightWidth;
    const containerWidth = containerRef.current?.getBoundingClientRect().width || 1;

    const onMove = (ev: MouseEvent) => {
      const delta = ((startX - ev.clientX) / containerWidth) * 100;
      setRightWidth(Math.max(18, Math.min(42, initialWidth + delta)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Get test cases from loaded problem
  const activeTestCases: TestCaseResult[] = (problem?.sample_test_cases ?? []).map((tc, idx) => ({
    id: idx + 1,
    input: tc.input,
    expected: tc.expected_output,
    output: "",
    passed: false,
  }));

  // ── Handlers ──
  const handleReset = () => {
    const defaultCode = problem?.starter_code?.[activeLanguage] || LANGUAGES[activeLanguage].defaultSolution;
    setSolutionCodes((prev) => ({ ...prev, [activeLanguage]: defaultCode }));
    setRunResult(null);
  };

  const handleLanguageChange = (key: LangKey) => {
    setActiveLanguage(key);
    setLangDropdownOpen(false);
    setRunResult(null);
  };

  const handleRun = async () => {
    if (isRunning || isSubmitting) return;
    if (!problem?.id) return;

    setIsRunning(true);
    setSubmitError(null);
    setRunResult({ status: "running", cases: [] });
    setActiveResultTab(0);
    setIsRightClosed(false);

    try {
      const result = await runCode(
        { problem_id: problem.id, language: activeLanguage as SubmissionLanguage, source_code: solutionCodes[activeLanguage] }
      );
      const status = verdictToStatus(result.verdict);
      const allPassed = result.verdict === "accepted";
      const cases = (result.test_cases ?? []).map((tcr, idx) => {
        const isHidden = tcr.input === null || tcr.input === undefined;
        return {
          id: idx + 1,
          input: isHidden ? "[hidden]" : tcr.input!,
          expected: isHidden ? "[hidden]" : tcr.expected_output!,
          output: isHidden ? "[hidden]" : (tcr.actual_output ?? ""),
          passed: tcr.passed,
        };
      });
      setRunResult({
        status,
        cases,
        runtime: formatRuntime(result.runtime_ms),
        memory: formatMemory(result.memory_kb),
        isSubmit: false,
        message: allPassed
          ? `Passed ${result.passed_testcases}/${result.total_testcases} test cases.`
          : result.compile_output || result.stderr || undefined,
      });
    } catch (err: any) {
      setSubmitError(err.message ?? "Run failed");
      setRunResult({ status: "failed", cases: [], isSubmit: false, message: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (isRunning || isSubmitting) return;
    if (!problem?.id) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setRunResult({ status: "running", cases: [] });
    setActiveResultTab(0);
    setIsRightClosed(false);

    try {
      const result = await submitCode(
        { problem_id: problem.id, language: activeLanguage as SubmissionLanguage, source_code: solutionCodes[activeLanguage] }
      );
      const status = verdictToStatus(result.verdict);
      const allPassed = result.verdict === "accepted";
      const cases = (result.test_cases ?? []).map((tcr, idx) => {
        const isHidden = tcr.input === null || tcr.input === undefined;
        return {
          id: idx + 1,
          input: isHidden ? "[hidden]" : tcr.input!,
          expected: isHidden ? "[hidden]" : tcr.expected_output!,
          output: isHidden ? "[hidden]" : (tcr.actual_output ?? ""),
          passed: tcr.passed,
        };
      });
      setRunResult({
        status,
        cases,
        runtime: formatRuntime(result.runtime_ms),
        memory: formatMemory(result.memory_kb),
        isSubmit: true,
        message: allPassed
          ? `Passed ${result.passed_testcases}/${result.total_testcases} test cases — Score: ${result.score}`
          : result.compile_output || result.stderr || `Failed ${result.total_testcases - result.passed_testcases} test case(s).`,
      });
    } catch (err: any) {
      setSubmitError(err.message ?? "Submission failed");
      setRunResult({ status: "failed", cases: [], message: err.message ?? "Submission failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };


  // Derived
  const lang = LANGUAGES[activeLanguage];
  const currentEditorValue = solutionCodes[activeLanguage];

  // Derived submission placeholders
  const totalSubmissions = problem?.times_used ? (problem.times_used * 7 + 12) : 18900;
  const acceptedSubmissions = problem?.times_used ? Math.round(totalSubmissions * 0.751) : 14200;
  const acceptanceRate = totalSubmissions > 0 
    ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1) 
    : "75.1";

  const displayTitle = problem?.title || "The Architect's Puzzle";
  const displayDifficulty = problem?.difficulty 
    ? problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)
    : "Medium";
  const displayDifficultyColor = displayDifficulty === "Easy"
    ? "text-cw-success border-cw-success/30 bg-cw-success/10"
    : displayDifficulty === "Hard"
    ? "text-cw-danger border-cw-danger/30 bg-cw-danger/10"
    : "text-tier-gold border-tier-gold/30 bg-tier-gold/10";

  // Safe constraints parsing
  const constraintsList = (() => {
    const raw = problem?.constraints;
    if (!raw) {
      return ["1 ≤ grid.length, grid[0].length ≤ 1000", "grid[i][j] ∈ {0, 1}", "0 ≤ energy ≤ 10⁶"];
    }
    if (Array.isArray(raw)) {
      return raw.filter(Boolean);
    }
    if (typeof raw === "string") {
      return raw.split("\n").filter(Boolean);
    }
    return [];
  })();

  return (
    <div className="h-full flex flex-col overflow-hidden bg-cw-bg text-cw-text-primary relative" id="problem-page-wrapper">
      {/* ── Custom Navigation Sidebar Drawer ── */}
      {sidebarOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Slide-out Panel */}
          <div
            className="fixed left-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden"
            style={{
              width: "320px",
              background: "var(--color-bg)",
              borderRight: "1px solid var(--color-border)",
              boxShadow: "4px 0 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* ── Header ── */}
            <div
              className="flex-shrink-0 flex flex-col"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              {/* Brand row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black"
                    style={{ background: "var(--color-accent)", color: "#fff" }}
                  >
                    CW
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black tracking-widest font-mono" style={{ color: "var(--color-text-primary)" }}>
                      CODEWARS
                    </span>
                    <span className="text-[9px] font-mono tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
                      PROBLEM ARENA
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: "var(--color-text-secondary)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Back to Problems CTA */}
              <div className="px-4 pb-3">
                <Link
                  href="/problems"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[11px] font-bold font-mono tracking-wide transition-all group"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--color-accent)";
                    el.style.color = "var(--color-accent)";
                    el.style.background = "color-mix(in srgb, var(--color-accent) 8%, var(--color-surface))";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--color-border)";
                    el.style.color = "var(--color-text-secondary)";
                    el.style.background = "var(--color-surface)";
                  }}
                >
                  <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Back to Problem List</span>
                </Link>
              </div>

              {/* Search */}
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search
                    className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "var(--color-text-secondary)" }}
                  />
                  <input
                    type="text"
                    placeholder="Search problems…"
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-[11px] rounded-lg font-mono outline-none transition-all"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
                  />
                </div>
              </div>

              {/* Problems count */}
              <div className="px-4 pb-2">
                <span className="text-[9px] font-black tracking-widest font-mono" style={{ color: "var(--color-text-secondary)" }}>
                  {sidebarProblems.filter(p => p.title.toLowerCase().includes(sidebarSearch.toLowerCase())).length} PROBLEMS
                </span>
              </div>
            </div>

            {/* ── Problem List ── */}
            <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: "thin" }}>
              <div className="flex flex-col py-2 px-3 gap-0.5">
                {sidebarProblems
                  .filter((p) => p.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
                  .map((p) => {
                    const isActive = p.slug === slug;
                    const difficultyAccent =
                      p.difficulty === "Easy"
                        ? "var(--color-success)"
                        : p.difficulty === "Hard"
                        ? "var(--color-danger)"
                        : "var(--color-warning)";
                    const difficultyLabel =
                      p.difficulty === "Easy" ? "E" : p.difficulty === "Hard" ? "H" : "M";

                    return (
                      <Link
                        key={p.id}
                        href={`/problem/${p.slug}`}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition-all group relative"
                        style={{
                          background: isActive ? "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface))" : "transparent",
                          border: isActive ? "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)" : "1px solid transparent",
                        }}
                        onMouseEnter={e => {
                          if (!isActive) {
                            (e.currentTarget as HTMLElement).style.background = "var(--color-surface)";
                            (e.currentTarget as HTMLElement).style.border = "1px solid var(--color-border)";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                            (e.currentTarget as HTMLElement).style.border = "1px solid transparent";
                          }
                        }}
                      >
                        {/* Difficulty accent bar */}
                        <div
                          className="w-0.5 self-stretch rounded-full flex-shrink-0 mt-0.5"
                          style={{ background: difficultyAccent }}
                        />

                        {/* Index chip */}
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black font-mono flex-shrink-0 mt-0.5"
                          style={{
                            background: isActive ? "var(--color-accent)" : "var(--color-surface-2)",
                            color: isActive ? "#fff" : "var(--color-text-secondary)",
                            minWidth: "20px",
                          }}
                        >
                          {p.index}
                        </div>

                        {/* Problem info */}
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <span
                              className="text-xs font-semibold font-mono leading-snug line-clamp-1"
                              style={{ color: isActive ? "var(--color-accent)" : "var(--color-text-primary)" }}
                            >
                              {p.title}
                            </span>
                            <span
                              className="text-[8px] font-black font-mono px-1 py-0.5 rounded-sm flex-shrink-0"
                              style={{
                                color: difficultyAccent,
                                background: `color-mix(in srgb, ${difficultyAccent} 12%, transparent)`,
                              }}
                            >
                              {difficultyLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono" style={{ color: "var(--color-text-secondary)" }}>
                              {p.acceptanceRate.toFixed(0)}% success
                            </span>
                            {(p.tags || []).slice(0, 1).map((t) => (
                              <span
                                key={t}
                                className="text-[8px] font-mono px-1 rounded-sm"
                                style={{
                                  background: "var(--color-surface-2)",
                                  color: "var(--color-text-secondary)",
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>

            {/* ── Footer ── */}
            <div
              className="flex-shrink-0 px-4 py-3"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <Link
                href="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 text-[10px] font-mono font-bold transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text-primary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-secondary)")}
              >
                <Home className="w-3.5 h-3.5" />
                Back to Home
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ── Navbar ── */}
      <Navbar
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Problems", href: "/problems" },
          { label: displayTitle },
        ]}
      />

      {/* ── Three-column split workspace ── */}
      <div ref={containerRef} className="flex-1 min-h-0 flex flex-row overflow-hidden relative">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* COLUMN 1 — Problem description                                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {!isLeftClosed ? (
          <div
            style={{ width: `${leftWidth}%` }}
            className="h-full min-h-0 flex flex-col bg-cw-surface/20 border-r border-cw-border flex-shrink-0 overflow-hidden"
          >
            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-5 arena-panel">

              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1.5">
                  <h1 className="text-base font-black text-cw-text-primary leading-tight">
                    {displayTitle}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm border ${displayDifficultyColor}`}>
                      {displayDifficulty}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-cw-text-secondary">
                      <ThumbsUp className="w-3 h-3" />
                      94.2%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsLeftClosed(true)}
                  className="p-1 text-cw-text-secondary hover:text-cw-text-primary rounded hover:bg-cw-surface-2 transition-colors duration-instant flex-shrink-0"
                  title="Collapse panel"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-cw-border" />

              {/* Description */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black tracking-widest text-cw-text-secondary uppercase">Description</span>
                <div className="text-xs text-cw-text-secondary leading-relaxed whitespace-pre-wrap">
                  {problem?.description_md}
                </div>
              </div>

              {/* Input Format + Output Format */}
              {(problem?.input_format || problem?.output_format) && (
                <div className="flex flex-col gap-2.5">
                  {problem.input_format && (
                    <div className="rounded-lg border border-cw-border overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-cw-surface-2 border-b border-cw-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                        <span className="text-[9px] font-black tracking-widest text-cw-text-secondary uppercase">Input Format</span>
                      </div>
                      <div className="px-3 py-2.5 bg-cw-surface/30 font-mono text-[11px] text-cw-text-primary leading-relaxed">
                        {problem.input_format.replace(/\\n/g, "\n").split("\n").map((line, i) => (
                          <div key={i}>{line || <br />}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {problem.output_format && (
                    <div className="rounded-lg border border-cw-border overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-cw-surface-2 border-b border-cw-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-cw-success flex-shrink-0" />
                        <span className="text-[9px] font-black tracking-widest text-cw-text-secondary uppercase">Output Format</span>
                      </div>
                      <div className="px-3 py-2.5 bg-cw-surface/30 font-mono text-[11px] text-cw-text-primary leading-relaxed">
                        {problem.output_format.replace(/\\n/g, "\n").split("\n").map((line, i) => (
                          <div key={i}>{line || <br />}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Examples */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black tracking-widest text-cw-text-secondary uppercase font-mono">Examples</span>

                {problem?.sample_test_cases && problem.sample_test_cases.length > 0 ? (
                  problem.sample_test_cases.map((tc, idx) => (
                    <div key={tc.id || idx} className="bg-cw-surface-2 border border-cw-border rounded-lg overflow-hidden font-mono text-xs">
                      <div className="px-3 py-1.5 border-b border-cw-border text-cw-text-secondary text-[10px]">Example {idx + 1}</div>
                      <div className="flex flex-col divide-y divide-cw-border">
                        {/* Input */}
                        <div className="px-3 py-2">
                          <div className="text-[9px] font-black tracking-widest text-cw-text-secondary uppercase mb-1">Input</div>
                          <pre className="text-cw-text-primary text-[11px] leading-relaxed whitespace-pre-wrap m-0 font-mono">{tc.input}</pre>
                        </div>
                        {/* Output */}
                        <div className="px-3 py-2">
                          <div className="text-[9px] font-black tracking-widest text-cw-text-secondary uppercase mb-1">Output</div>
                          <pre className="text-cw-text-primary text-[11px] leading-relaxed whitespace-pre-wrap m-0 font-mono">{tc.expected_output}</pre>
                        </div>
                        {/* Explanation */}
                        {tc.explanation && (
                          <div className="px-3 py-2 text-cw-text-secondary text-[10px] leading-relaxed">
                            {tc.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="bg-cw-surface-2 border border-cw-border rounded-lg p-3 font-mono text-xs leading-relaxed">
                      <div className="text-cw-text-secondary text-[10px] mb-1">Example 1</div>
                      <div className="flex flex-col gap-0.5">
                        <div><span className="text-cw-text-secondary">Input: </span><span className="text-cw-text-primary">grid = [[1,0,1],[0,1,0]], energy = 10</span></div>
                        <div><span className="text-cw-text-secondary">Output: </span><span className="text-cw-text-primary">6</span></div>
                        <div className="text-cw-text-secondary mt-1">// Full grid is symmetrical</div>
                      </div>
                    </div>
                    <div className="bg-cw-surface-2 border border-cw-border rounded-lg p-3 font-mono text-xs leading-relaxed">
                      <div className="text-cw-text-secondary text-[10px] mb-1">Example 2</div>
                      <div className="flex flex-col gap-0.5">
                        <div><span className="text-cw-text-secondary">Input: </span><span className="text-cw-text-primary">grid = [[1,1],[1,1]], energy = 4</span></div>
                        <div><span className="text-cw-text-secondary">Output: </span><span className="text-cw-text-primary">4</span></div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Constraints */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black tracking-widest text-cw-text-secondary uppercase font-mono">Constraints</span>
                <ul className="flex flex-col gap-1">
                  {constraintsList.map((c, idx) => (
                    <li key={idx} className="text-[11px] text-cw-text-secondary font-mono flex gap-2 items-start">
                      <span className="text-cw-text-tertiary mt-0.5">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black tracking-widest text-cw-text-secondary uppercase flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(problem?.topic_tags || ["Array", "Dynamic Programming", "Matrix"]).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-[10px] font-mono text-cw-text-secondary border border-cw-border bg-cw-surface-2 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hint box */}
              <div className="bg-cw-surface-2 border border-cw-border rounded-lg p-3 flex gap-2.5 items-start">
                <HelpCircle className="w-4 h-4 text-cw-text-secondary flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 text-cw-text-secondary text-[11px] leading-relaxed">
                  <span className="font-bold text-cw-text-primary">Optimization is key.</span>
                  <span>O(N³) solutions will time out. Aim for O(N²) or better.</span>
                </div>
              </div>
            </div>

            {/* Acceptance stats footer */}
            <div className="flex-shrink-0 px-5 py-3 border-t border-cw-border bg-cw-surface/30 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Accepted", value: acceptedSubmissions.toLocaleString() },
                { label: "Submissions", value: totalSubmissions.toLocaleString() },
                { label: "Acceptance", value: `${acceptanceRate}%` },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[9px] font-black font-mono text-cw-text-secondary uppercase">{s.label}</div>
                  <div className="text-xs font-bold font-mono text-cw-text-primary mt-0.5">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Left collapsed strip */
          <div
            onClick={() => setIsLeftClosed(false)}
            className="h-full w-9 bg-cw-surface border-r border-cw-border flex flex-col items-center pt-5 cursor-pointer hover:bg-cw-surface-2 transition-colors duration-fast select-none flex-shrink-0"
            title="Expand problem"
          >
            <ChevronRight className="w-4.5 h-4.5 text-cw-text-secondary mb-5" />
            <span className="text-[9px] font-black uppercase tracking-widest text-cw-text-secondary [writing-mode:vertical-lr] rotate-180">
              Problem
            </span>
          </div>
        )}

        {/* Left drag bar */}
        {!isLeftClosed && (
          <div
            onMouseDown={handleLeftResizeStart}
            className="h-full w-1 cursor-col-resize hover:bg-cw-accent active:bg-cw-accent bg-cw-border transition-colors z-30 flex-shrink-0 select-none"
          />
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* COLUMN 2 — Code editor                                            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div
          style={{ width: `${100 - (isLeftClosed ? 0 : leftWidth) - (isRightClosed ? 0 : rightWidth)}%` }}
          className="h-full min-h-0 flex flex-col bg-cw-bg flex-grow overflow-hidden"
        >
          {/* Tab / lang bar */}
          <div className="h-11 border-b border-cw-border bg-cw-surface/40 flex items-center justify-between px-4 flex-shrink-0">
            {/* Static file tab */}
            <div className="h-11 px-4 flex items-center gap-2 text-xs font-bold border-b-2 border-cw-accent text-cw-text-primary bg-cw-surface/30">
              <FileCode className="w-3.5 h-3.5" />
              <span>{lang.solutionExt}</span>
            </div>

            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen((o) => !o)}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-1.5 h-7 px-3 border border-cw-border bg-cw-surface hover:border-cw-text-secondary disabled:opacity-50 transition-colors duration-fast rounded-lg text-[11px] font-bold font-mono text-cw-text-primary select-none"
              >
                <span className="text-cw-text-secondary uppercase tracking-wider text-[9px] font-black">LANG</span>
                <span>{lang.label}</span>
                <ChevronDown className={`w-3 h-3 text-cw-text-secondary transition-transform duration-fast ${langDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {langDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangDropdownOpen(false)} />
                  <div className="absolute right-0 top-9 z-50 w-36 bg-cw-surface border border-cw-border rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden">
                    {(Object.keys(LANGUAGES) as LangKey[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => handleLanguageChange(key)}
                        className={`w-full px-3 py-2.5 text-left text-xs font-bold font-mono flex items-center justify-between transition-colors duration-instant ${
                          activeLanguage === key
                            ? "bg-cw-accent/10 text-cw-accent"
                            : "text-cw-text-secondary hover:bg-cw-surface-2 hover:text-cw-text-primary"
                        }`}
                      >
                        <span>{LANGUAGES[key].label}</span>
                        {activeLanguage === key && <span className="w-1.5 h-1.5 rounded-full bg-cw-accent" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Monaco editor */}
          <div className="flex-1 min-h-0 w-full bg-[#1e1e1e] relative overflow-hidden">
            <Editor
              height="100%"
              theme="vs-dark"
              language={lang.monacoLang}
              value={currentEditorValue}
              onChange={(value) => setSolutionCodes((prev) => ({ ...prev, [activeLanguage]: value || "" }))}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "var(--font-jetbrains-mono)",
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: isRunning || isSubmitting,
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Bottom action bar */}
          <div className="h-14 border-t border-cw-border bg-cw-surface/40 flex items-center justify-between px-5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                disabled={isRunning || isSubmitting}
                className="h-8 px-3.5 border border-cw-border text-cw-text-secondary hover:text-cw-text-primary disabled:opacity-50 hover:border-cw-text-secondary transition-all text-xs font-bold flex items-center gap-1.5 rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                disabled={isRunning || isSubmitting}
                className="h-8 px-3.5 border border-cw-border text-cw-text-secondary hover:text-cw-text-primary disabled:opacity-50 hover:border-cw-text-secondary transition-all text-xs font-bold flex items-center gap-1.5 rounded-lg"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Docs
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Run */}
              <button
                onClick={handleRun}
                disabled={isRunning || isSubmitting}
                className="h-8 px-4 border border-cw-border text-cw-text-secondary hover:text-cw-text-primary disabled:opacity-50 hover:border-cw-text-secondary transition-all text-xs font-bold flex items-center gap-1.5 rounded-lg bg-cw-surface/50"
              >
                {isRunning ? (
                  <div className="w-3 h-3 border-2 border-cw-text-secondary/20 border-t-cw-text-secondary rounded-full animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                Run
              </button>
              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting}
                className="h-8 px-5 bg-cw-accent hover:bg-cw-accent-hover disabled:bg-cw-accent/50 text-cw-text-on-accent transition-colors duration-fast text-xs font-black uppercase tracking-widest flex items-center gap-1.5 rounded-lg"
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* Right drag bar */}
        {!isRightClosed && (
          <div
            onMouseDown={handleRightResizeStart}
            className="h-full w-1 cursor-col-resize hover:bg-cw-accent active:bg-cw-accent bg-cw-border transition-colors z-30 flex-shrink-0 select-none"
          />
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* COLUMN 3 — Test results / console                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {!isRightClosed ? (
          <div
            style={{ width: `${rightWidth}%` }}
            className="h-full min-h-0 flex flex-col bg-cw-surface/20 border-l border-cw-border flex-shrink-0 overflow-hidden"
          >
            {/* Panel header */}
            <div className="h-11 flex-shrink-0 border-b border-cw-border bg-cw-surface/40 flex items-center justify-between px-4">
              <span className="text-[9px] font-black tracking-widest text-cw-text-secondary uppercase flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                Test Results
              </span>
              <button
                onClick={() => setIsRightClosed(true)}
                className="p-1 text-cw-text-secondary hover:text-cw-text-primary rounded hover:bg-cw-surface-2 transition-colors duration-instant"
                title="Collapse panel"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable results body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4 arena-panel">

              {/* ── Idle state ── */}
              {!runResult && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-12">
                  <div className="w-12 h-12 rounded-xl border border-cw-border bg-cw-surface-2 flex items-center justify-center">
                    <Play className="w-5 h-5 text-cw-text-secondary" />
                  </div>
                  <p className="text-xs text-cw-text-secondary max-w-[160px] leading-relaxed">
                    Press <span className="text-cw-text-primary font-bold">Run</span> to test your code against sample cases, or <span className="text-cw-text-primary font-bold">Submit</span> for full evaluation.
                  </p>
                </div>
              )}

              {/* ── Running spinner ── */}
              {runResult?.status === "running" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
                  <div className="w-8 h-8 border-2 border-cw-border border-t-cw-accent rounded-full animate-spin" />
                  <span className="text-xs text-cw-text-secondary font-mono">Executing…</span>
                </div>
              )}

              {/* ── Result banner ── */}
              {runResult && runResult.status !== "running" && (
                <>
                  {/* Status banner */}
                  <div className={`rounded-lg border p-3 flex items-center gap-3 ${
                    runResult.status === "accepted"
                      ? "border-cw-success/30 bg-cw-success/10"
                      : "border-cw-danger/30 bg-cw-danger/10"
                  }`}>
                    {runResult.status === "accepted" ? (
                      <CheckCircle2 className="w-5 h-5 text-cw-success flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-cw-danger flex-shrink-0" />
                    )}
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-sm font-black uppercase tracking-wide ${
                        runResult.status === "accepted" ? "text-cw-success" : "text-cw-danger"
                      }`}>
                        {runResult.status === "accepted"
                          ? "Accepted"
                          : runResult.status === "wrong_answer"
                          ? "Wrong Answer"
                          : "Failed"}
                      </span>
                      {runResult.message && (
                        <span className="text-[11px] text-cw-text-secondary">{runResult.message}</span>
                      )}
                    </div>
                  </div>

                  {/* Runtime / Memory stats */}
                  {runResult.isSubmit && (runResult.runtime || runResult.memory) && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border border-cw-border bg-cw-surface-2/50 rounded-lg p-3 flex flex-col gap-1">
                        <span className="text-[9px] font-black font-mono uppercase text-cw-text-secondary flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Runtime
                        </span>
                        <span className="text-sm font-bold font-mono text-cw-text-primary">{runResult.runtime}</span>
                      </div>
                      <div className="border border-cw-border bg-cw-surface-2/50 rounded-lg p-3 flex flex-col gap-1">
                        <span className="text-[9px] font-black font-mono uppercase text-cw-text-secondary flex items-center gap-1">
                          <MemoryStick className="w-3 h-3" /> Memory
                        </span>
                        <span className="text-sm font-bold font-mono text-cw-text-primary">{runResult.memory}</span>
                      </div>
                    </div>
                  )}

                  {/* Test case results */}
                  {runResult.cases.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <span className="text-[9px] font-black tracking-widest text-cw-text-secondary uppercase">
                        Test Cases — {runResult.cases.filter((c) => c.passed).length}/{runResult.cases.length} passed
                      </span>
                      
                      {!runResult.isSubmit ? (
                        <>
                          {/* Tabs selector */}
                          <div className="flex flex-wrap gap-1.5 border-b border-cw-border pb-2">
                            {runResult.cases.map((tc, idx) => {
                              const isActive = activeResultTab === idx;
                              return (
                                <button
                                  key={tc.id || idx}
                                  onClick={() => setActiveResultTab(idx)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 border ${
                                    isActive
                                      ? "bg-cw-surface border-cw-accent text-cw-text-primary shadow-sm"
                                      : "bg-cw-surface-2 border-cw-border text-cw-text-secondary hover:text-cw-text-primary"
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${tc.passed ? "bg-cw-success" : "bg-cw-danger"}`} />
                                  Case {idx + 1}
                                </button>
                              );
                            })}
                          </div>

                          {/* Detailed View for Active Tab */}
                          {runResult.cases[activeResultTab] && (
                            <div className="border border-cw-border bg-cw-surface-2/30 rounded-lg overflow-hidden flex flex-col font-mono text-[10px] mt-1">
                              <div className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold border-b border-cw-border ${
                                runResult.cases[activeResultTab].passed ? "bg-cw-success/10 text-cw-success border-cw-success/15" : "bg-cw-danger/10 text-cw-danger border-cw-danger/15"
                              }`}>
                                {runResult.cases[activeResultTab].passed
                                  ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-cw-success" />
                                  : <XCircle className="w-3.5 h-3.5 flex-shrink-0 text-cw-danger" />
                                }
                                Case {activeResultTab + 1} Result
                              </div>
                              
                              <div className="px-3.5 py-3 flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                  <span className="text-cw-text-secondary font-semibold">Input</span>
                                  <div className="bg-cw-surface-2 border border-cw-border rounded p-2 text-cw-text-primary break-all max-h-[120px] overflow-y-auto">
                                    <pre className="font-mono text-[11px] whitespace-pre-wrap break-all m-0 p-0 bg-transparent border-none text-cw-text-primary">{runResult.cases[activeResultTab].input}</pre>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-cw-text-secondary font-semibold">Expected Output</span>
                                  <div className="bg-cw-surface-2 border border-cw-border rounded p-2 text-cw-success font-bold max-h-[120px] overflow-y-auto">
                                    <pre className="font-mono text-[11px] whitespace-pre-wrap break-all m-0 p-0 bg-transparent border-none text-cw-success">{runResult.cases[activeResultTab].expected}</pre>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-cw-text-secondary font-semibold">Your Output</span>
                                  <div className={`bg-cw-surface-2 border border-cw-border rounded p-2 font-bold max-h-[120px] overflow-y-auto ${runResult.cases[activeResultTab].passed ? "text-cw-success font-bold" : "text-cw-danger font-bold"}`}>
                                    {runResult.cases[activeResultTab].output ? (
                                      <pre className={`font-mono text-[11px] whitespace-pre-wrap break-all m-0 p-0 bg-transparent border-none ${runResult.cases[activeResultTab].passed ? "text-cw-success" : "text-cw-danger"}`}>
                                        {runResult.cases[activeResultTab].output}
                                      </pre>
                                    ) : (
                                      <span>{runResult.cases[activeResultTab].passed ? runResult.cases[activeResultTab].expected : "No Output / Crash"}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        // Submit Results: Show details only for the first failed case (if any)
                        (() => {
                          const firstFailedCase = runResult.cases.find((c) => !c.passed);
                          if (!firstFailedCase) return null;
                          return (
                            <div className="border border-cw-border bg-cw-surface-2/30 rounded-lg overflow-hidden flex flex-col font-mono text-[10px] mt-1">
                              <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold border-b border-cw-border bg-cw-danger/10 text-cw-danger border-cw-danger/15">
                                <XCircle className="w-3.5 h-3.5 flex-shrink-0 text-cw-danger" />
                                Failed on Test Case {firstFailedCase.id}
                              </div>
                              
                              <div className="px-3.5 py-3 flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                  <span className="text-cw-text-secondary font-semibold">Input</span>
                                  <div className="bg-cw-surface-2 border border-cw-border rounded p-2 text-cw-text-primary break-all max-h-[120px] overflow-y-auto">
                                    <pre className="font-mono text-[11px] whitespace-pre-wrap break-all m-0 p-0 bg-transparent border-none text-cw-text-primary">{firstFailedCase.input}</pre>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-cw-text-secondary font-semibold">Expected Output</span>
                                  <div className="bg-cw-surface-2 border border-cw-border rounded p-2 text-cw-success font-bold max-h-[120px] overflow-y-auto">
                                    <pre className="font-mono text-[11px] whitespace-pre-wrap break-all m-0 p-0 bg-transparent border-none text-cw-success">{firstFailedCase.expected}</pre>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-cw-text-secondary font-semibold">Your Output</span>
                                  <div className="bg-cw-surface-2 border border-cw-border rounded p-2 font-bold max-h-[120px] overflow-y-auto text-cw-danger">
                                    {firstFailedCase.output ? (
                                      <pre className="font-mono text-[11px] whitespace-pre-wrap break-all m-0 p-0 bg-transparent border-none text-cw-danger">
                                        {firstFailedCase.output}
                                      </pre>
                                    ) : (
                                      <span>No Output / Crash</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          /* Right collapsed strip */
          <div
            onClick={() => setIsRightClosed(false)}
            className="h-full w-9 bg-cw-surface border-l border-cw-border flex flex-col items-center pt-5 cursor-pointer hover:bg-cw-surface-2 transition-colors duration-fast select-none flex-shrink-0"
            title="Expand results"
          >
            <ChevronLeft className="w-4.5 h-4.5 text-cw-text-secondary mb-5" />
            <span className="text-[9px] font-black uppercase tracking-widest text-cw-text-secondary [writing-mode:vertical-lr]">
              Results
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
