/**
 * features/problems/index.ts
 *
 * Barrel re-export.
 */

// Types
export type { Problem, TopicTag, PromoBanner } from "./types";

// Components
export { ProblemsFeature } from "./problems";
export { ProblemsTable } from "./components/problems-table";
export { TagCloud } from "./components/tag-cloud";
export { PromoBanners } from "./components/promo-banners";
export { ProblemDetailsFeature } from "./components/problem-page";

// Services
export { fetchProblems, fetchProblemBySlug, fetchTags } from "./services/problems-service";
export type { FetchProblemsParams } from "./services/problems-service";

