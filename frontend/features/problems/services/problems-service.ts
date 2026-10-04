import type { Problem, ProblemList, TopicTag, PromoBanner } from "../types";
import { BASE_URL, apiFetch } from "@/lib/api-client";
import { MOCK_PROBLEMS } from "../constants";

// ─── Tag API ──────────────────────────────────────────────────────────────────

/**
 * Fetch all problem tags from the dedicated /problems/tags/ endpoint.
 *
 * Each tag includes `id`, `name`, `slug`, `description`, and `count` (number of
 * problems linked to it). Tags are ordered by count desc on the backend so the
 * most-used topics appear first in TagCloud.
 *
 * Called once on mount in ProblemsFeature; not re-fetched on filter changes.
 */
export async function fetchTags(cookieHeader?: string): Promise<TopicTag[]> {
  const res = await apiFetch(`${BASE_URL}/problems/tags/`, {
    cookieHeader,
    next: { revalidate: 60 }, // cache for 60 s — tags change infrequently
  });
  if (!res.ok) {
    throw new Error(`Failed to load tags: HTTP ${res.status}`);
  }
  const data: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    count: number;
  }> = await res.json();

  return data.map((t) => ({
    id:          t.id,
    name:        t.name,
    slug:        t.slug,
    description: t.description,
    count:       t.count ?? 0,
  }));
}


// ─── Problems API ─────────────────────────────────────────────────────────────

export interface FetchProblemsParams {
  category?:  string;
  tag?:       string;   // tag slug — passed as ?tag= to the backend
  search?:    string;
  difficulty?: "Easy" | "Medium" | "Hard" | "All";
  status?:    "solved" | "attempted" | "todo" | "All";
}

export async function fetchProblems(
  params: FetchProblemsParams = {},
  cookieHeader?: string
): Promise<ProblemList> {
  const queryParams = new URLSearchParams();
  queryParams.set("limit", "100");

  if (params.difficulty && params.difficulty !== "All") {
    queryParams.set("difficulty", params.difficulty.toLowerCase());
  }
  if (params.tag) {
    // Backend expects the tag *slug* (not the display name)
    queryParams.set("tag", params.tag);
  }
  if (params.search) {
    queryParams.set("q", params.search);
  }

  const res = await apiFetch(`${BASE_URL}/problems/?${queryParams.toString()}`, {
    cookieHeader,
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`HTTP status ${res.status}`);
  }

  const data = await res.json();

  // Map backend ProblemListItem → frontend Problem.
  // `p.tags` is now an array of {id, name, slug, description} objects —
  // NOT the deprecated `p.topic_tags` string array.
  const items: Problem[] = data.items.map((p: any, idx: number) => ({
    id:             p.id,
    index:          idx + 1,
    title:          p.title,
    slug:           p.slug,
    acceptanceRate: 75.1, // Placeholder until backend exposes this
    difficulty:     (
      p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1)
    ) as Problem["difficulty"],
    status:   "todo" as const,    // Placeholder until user-submission state is tracked
    category: "Algorithms" as const, // Placeholder until backend exposes category
    tags:     (p.tags ?? []).map((t: any) => ({
      id:          t.id,
      name:        t.name,
      slug:        t.slug,
      description: t.description ?? undefined,
      count:       t.count ?? 0,
    })) as TopicTag[],
  }));

  return { items, total: data.total ?? items.length };
}


// ─── Problem Detail API ───────────────────────────────────────────────────────

export interface FetchProblemDetailResponse {
  id:           string;
  title:        string;
  slug:         string;
  difficulty:   "easy" | "medium" | "hard";
  // Normalised tags from problem_tags (replaces topic_tags string array)
  tags?:        Array<{ id: string; name: string; slug: string; description?: string }>;
  description_md:  string;
  input_format?:   string;
  output_format?:  string;
  constraints?:    string;
  starter_code?:   Record<string, string>;
  time_limit_ms:   number;
  memory_limit_mb: number;
  times_used:      number;
  created_at:      string;
  updated_at:      string;
  sample_test_cases: {
    id:           string;
    input:        string;
    expected_output: string;
    explanation?: string;
    order_index:  number;
  }[];
}

// Full fallback mock for "the-architects-puzzle" in case the db table doesn't have it yet
const MOCK_PROBLEM_DETAIL: FetchProblemDetailResponse = {
  id:    "8c9fb27a-8f92-4ec4-bc48-cf90c4fb263c",
  title: "The Architect's Puzzle",
  slug:  "the-architects-puzzle",
  difficulty: "medium",
  // Mock uses old-style string array; field renamed to tags (objects) in real response
  tags: [
    { id: "00000000-0000-0000-0000-000000000001", name: "Array",              slug: "array" },
    { id: "00000000-0000-0000-0000-000000000002", name: "Dynamic Programming", slug: "dynamic-programming" },
    { id: "00000000-0000-0000-0000-000000000003", name: "Matrix",             slug: "matrix" },
  ],
  description_md: "In a grid representing a futuristic city, find the maximum area of a perfectly symmetrical district under limited energy constraints.\n\nEach cell of the grid has a value of 0 or 1. You may use at most energy operations to flip cells.",
  constraints: "1 ≤ grid.length, grid[0].length ≤ 1000\ngrid[i][j] ∈ {0, 1}\n0 ≤ energy ≤ 10⁶",
  starter_code: {
    python:     "def solve(grid: list[list[int]], energy: int) -> int:\n    # Initialize district map\n    max_area = 0\n    rows = len(grid)\n    cols = len(grid[0])\n\n    # Start processing districts\n    for r in range(rows):\n        for c in range(cols):\n            # Logic for symmetry check\n            pass\n\n    return max_area",
    cpp:        "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint solve(vector<vector<int>>& grid, int energy) {\n    // Initialize district map\n    int maxArea = 0;\n    int rows = grid.size();\n    int cols = grid[0].size();\n\n    // Start processing districts\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            // Logic for symmetry check\n        }\n    }\n\n    return maxArea;\n}",
    javascript: "function solve(grid, energy) {\n  // Initialize district map\n  let maxArea = 0;\n  const rows = grid.length;\n  const cols = grid[0].length;\n\n  // Start processing districts\n  for (let r = 0; r < rows; r++) {\n    for (let c = 0; c < cols; c++) {\n      // Logic for symmetry check\n    }\n  }\n\n  return maxArea;\n}\n\nmodule.exports = { solve };",
  },
  time_limit_ms:  2000,
  memory_limit_mb: 256,
  times_used:     124,
  created_at:     new Date().toISOString(),
  updated_at:     new Date().toISOString(),
  sample_test_cases: [
    { id: "1", input: "grid = [[1,0,1],[0,1,0]], energy = 10", expected_output: "6", explanation: "Full grid is symmetrical", order_index: 1 },
    { id: "2", input: "grid = [[1,1],[1,1]], energy = 4",       expected_output: "4", order_index: 2 },
    { id: "3", input: "grid = [[0]], energy = 1",              expected_output: "0", order_index: 3 },
  ],
};

export async function fetchProblemBySlug(
  slug: string,
  cookieHeader?: string
): Promise<FetchProblemDetailResponse> {
  try {
    const res = await apiFetch(`${BASE_URL}/problems/${slug}`, {
      cookieHeader,
      // Don't cache — editors need to see updates immediately
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`Failed fetching problem from backend API, using mock/fallback:`, error);
    // Return the detailed mock for the known slug, or a generic fallback
    if (slug === "the-architects-puzzle") return MOCK_PROBLEM_DETAIL;
    return {
      ...MOCK_PROBLEM_DETAIL,
      title: slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      slug,
    };
  }
}
