/**
 * features/problems/types.ts
 *
 * Types and interfaces for the M2 Problems & Judge module.
 * All shapes mirror the corresponding Pydantic response schemas on the backend.
 */

export interface Problem {
  id: string;
  index: number;
  title: string;
  slug: string;
  acceptanceRate: number; // e.g. 52.3
  difficulty: "Easy" | "Medium" | "Hard";
  status: "solved" | "attempted" | "todo";
  category: "Algorithms" | "Database" | "Shell" | "Concurrency" | "JavaScript" | "TypeScript";
  // Normalised tags — sourced from the problem_tags table via problem_tags_link.
  // Each tag object contains id, name, slug, and optional description.
  tags: TopicTag[];
}

export interface ProblemList {
  items: Problem[];
  total: number;
}

/**
 * TopicTag mirrors the backend ProblemTagResponse / ProblemTagWithCount schemas.
 *
 * - `id`, `name`, `slug` are always present.
 * - `description` is optional (may be null in DB).
 * - `count` is only present on the /problems/tags/ endpoint response;
 *   it indicates how many problems are linked to this tag.
 * - `category` is kept optional for backwards compatibility with any existing
 *   code that set it — it has no corresponding DB column.
 */
export interface TopicTag {
  id:          string;
  name:        string;
  slug:        string;
  description?: string;
  count:       number;
  category?:   string; // legacy field — not written by backend
}

export interface PromoBanner {
  id:          string;
  title:       string;
  description: string;
  link:        string;
  bgPattern:   string; // Tailored color or style configuration
}
