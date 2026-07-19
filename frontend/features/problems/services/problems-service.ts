import type { Problem, TopicTag, PromoBanner } from "../types";
import { BASE_URL } from "@/lib/api-client";
import { MOCK_PROMO_BANNERS, MOCK_TOPIC_TAGS, MOCK_PROBLEMS } from "../constants";

export async function fetchPromoBanners(): Promise<PromoBanner[]> {
  // Simulating async network call
  await new Promise((resolve) => setTimeout(resolve, 150));
  return MOCK_PROMO_BANNERS;
}

export async function fetchTopicTags(): Promise<TopicTag[]> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return MOCK_TOPIC_TAGS;
}

export interface FetchProblemsParams {
  category?: string;
  tag?: string;
  search?: string;
  difficulty?: "Easy" | "Medium" | "Hard" | "All";
  status?: "solved" | "attempted" | "todo" | "All";
}

export async function fetchProblems(params: FetchProblemsParams = {}): Promise<Problem[]> {
  const queryParams = new URLSearchParams();
  queryParams.set("limit", "100");

  if (params.difficulty && params.difficulty !== "All") {
    queryParams.set("difficulty", params.difficulty.toLowerCase());
  }
  if (params.tag) {
    queryParams.set("tag", params.tag);
  }
  if (params.search) {
    queryParams.set("q", params.search);
  }

  try {
    const res = await fetch(`${BASE_URL}/problems/?${queryParams.toString()}`);
    if (!res.ok) {
      throw new Error(`HTTP status ${res.status}`);
    }
    const data = await res.json();
    return data.items.map((p: any, idx: number) => ({
      id: p.id,
      index: idx + 1,
      title: p.title,
      slug: p.slug,
      acceptanceRate: 75.1, // Placeholder
      difficulty: (p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1)) as any,
      status: "todo",
      category: "Algorithms",
      tags: p.topic_tags || [],
    }));
  } catch (error) {
    console.warn("Failed to fetch problems from backend, using mock fallback:", error);
    let list = [...MOCK_PROBLEMS];

    if (params.category && params.category !== "All Topics") {
      list = list.filter((p) => p.category.toLowerCase() === params.category!.toLowerCase());
    }

    if (params.tag) {
      list = list.filter((p) => p.tags.includes(params.tag!));
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.index.toString().includes(q)
      );
    }

    if (params.difficulty && params.difficulty !== "All") {
      list = list.filter((p) => p.difficulty === params.difficulty);
    }

    if (params.status && params.status !== "All") {
      list = list.filter((p) => p.status === params.status);
    }

    return list;
  }
}

export interface FetchProblemDetailResponse {
  id: string;
  title: string;
  slug: string;
  difficulty: "easy" | "medium" | "hard";
  topic_tags?: string[];
  description_md: string;
  input_format?: string;
  output_format?: string;
  constraints?: string;
  starter_code?: Record<string, string>;
  time_limit_ms: number;
  memory_limit_mb: number;
  times_used: number;
  created_at: string;
  updated_at: string;
  sample_test_cases: {
    id: string;
    input: string;
    expected_output: string;
    explanation?: string;
    order_index: number;
  }[];
}

// Full fallback mock for "the-architects-puzzle" in case the db table doesn't have it yet
const MOCK_PROBLEM_DETAIL: FetchProblemDetailResponse = {
  id: "8c9fb27a-8f92-4ec4-bc48-cf90c4fb263c",
  title: "The Architect's Puzzle",
  slug: "the-architects-puzzle",
  difficulty: "medium",
  topic_tags: ["Array", "Dynamic Programming", "Matrix"],
  description_md: "In a grid representing a futuristic city, find the maximum area of a perfectly symmetrical district under limited energy constraints.\n\nEach cell of the grid has a value of 0 or 1. You may use at most energy operations to flip cells.",
  constraints: "1 ≤ grid.length, grid[0].length ≤ 1000\ngrid[i][j] ∈ {0, 1}\n0 ≤ energy ≤ 10⁶",
  starter_code: {
    python: "def solve(grid: list[list[int]], energy: int) -> int:\n    # Initialize district map\n    max_area = 0\n    rows = len(grid)\n    cols = len(grid[0])\n\n    # Start processing districts\n    for r in range(rows):\n        for c in range(cols):\n            # Logic for symmetry check\n            pass\n\n    return max_area",
    cpp: "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint solve(vector<vector<int>>& grid, int energy) {\n    // Initialize district map\n    int maxArea = 0;\n    int rows = grid.size();\n    int cols = grid[0].size();\n\n    // Start processing districts\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < cols; c++) {\n            // Logic for symmetry check\n        }\n    }\n\n    return maxArea;\n}",
    javascript: "function solve(grid, energy) {\n  // Initialize district map\n  let maxArea = 0;\n  const rows = grid.length;\n  const cols = grid[0].length;\n\n  // Start processing districts\n  for (let r = 0; r < rows; r++) {\n    for (let c = 0; c < cols; c++) {\n      // Logic for symmetry check\n    }\n  }\n\n  return maxArea;\n}\n\nmodule.exports = { solve };"
  },
  time_limit_ms: 2000,
  memory_limit_mb: 256,
  times_used: 124,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  sample_test_cases: [
    { id: "1", input: "grid = [[1,0,1],[0,1,0]], energy = 10", expected_output: "6", explanation: "Full grid is symmetrical", order_index: 1 },
    { id: "2", input: "grid = [[1,1],[1,1]], energy = 4", expected_output: "4", order_index: 2 },
    { id: "3", input: "grid = [[0]], energy = 1", expected_output: "0", order_index: 3 }
  ]
};

export async function fetchProblemBySlug(slug: string): Promise<FetchProblemDetailResponse> {
  try {
    const res = await fetch(`${BASE_URL}/problems/${slug}`, {
      // Don't cache too long so we see updates instantly
      next: { revalidate: 0 }
    });
    if (!res.ok) {
      throw new Error(`HTTP status ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`Failed fetching problem from backend API, using mock/fallback:`, error);
    // If the slug is the-architects-puzzle or similar, return our detailed mock.
    // Otherwise, generate a generic fallback problem matching the requested slug.
    if (slug === "the-architects-puzzle") {
      return MOCK_PROBLEM_DETAIL;
    }
    return {
      ...MOCK_PROBLEM_DETAIL,
      title: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      slug: slug,
    };
  }
}

