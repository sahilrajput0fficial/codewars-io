/**
 * features/problems/types.ts
 *
 * Types and interfaces for the M2 Problems & Judge module.
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
  tags: string[];
}

export interface TopicTag {
  label: string;
  count: number;
  category: string;
}

export interface PromoBanner {
  id: string;
  title: string;
  description: string;
  link: string;
  bgPattern: string; // Tailored color or style configuration
}
