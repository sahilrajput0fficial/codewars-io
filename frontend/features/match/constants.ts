/**
 * features/match/constants.ts
 * Arena-level definitions for the matchmaking screen.
 *
 * City-themed names (DESIGN.md §0 — competitive, not SaaS).
 * bgGradient  — dark atmospheric gradient fallback (shown when no image).
 * bgImage     — static poster image path (default visible state).
 * bgVideo     — cinematic clip path (plays on card hover, pauses on leave).
 * tierColor   — references CSS vars (DESIGN.md §5 — border/icon only).
 * avgEloGain  — demo stat for the selected-card panel.
 */

export type Tier = "bronze" | "silver" | "gold" | "diamond";

export interface ArenaLevel {
  id: string;
  /** Short display name on the card */
  name: string;
  /** Shown below the name — lore sub-line */
  subtitle: string;
  /** Lore sentence for the expanded detail */
  lore: string;
  tier: Tier;
  tierLabel: string;
  /** Tier-hex color used for borders & text only — never fills */
  tierHex: string;
  eloMin: number;
  eloMax: number | null;
  onlinePlayers: number;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  timeLimitMin: number;
  /** Average ELO gained on a win */
  avgEloGain: number;
  /** CSS radial-gradient — used as fallback when bgImage is absent */
  bgGradient: string;
  /**
   * Static poster image shown by default.
   * Place files in frontend/public/arenas/ (e.g. /arenas/kabul.jpg).
   * Optional — gradient is used until files are added.
   */
  bgImage?: string;
  /**
   * Short cinematic video (10–20 s loop) that plays on hover.
   * Prefer .webm (VP9) for size; add .mp4 as fallback.
   * Optional — image stays visible until this is provided.
   */
  bgVideo?: string;
}

export const ARENA_LEVELS: ArenaLevel[] = [
  {
    id: "kabul",
    name: "Kabul Circuit",
    subtitle: "Dust Wastes  ·  Open Gates",
    lore: "Every warrior starts here. No gate, no glory — but this is where legends are first forged.",
    tier: "bronze",
    tierLabel: "BRONZE TIER",
    tierHex: "#8B6543",
    eloMin: 0,
    eloMax: 899,
    onlinePlayers: 312,
    difficulty: "Easy",
    timeLimitMin: 30,
    avgEloGain: 28,
    bgGradient:
      "radial-gradient(ellipse at 50% 0%, #3d1a00 0%, #1a0900 55%, #0a0500 100%)",
    bgImage: "/arenas/kabul.jpg",
    bgVideo: "/arenas/kabul.webm",
  },
  {
    id: "mumbai",
    name: "Mumbai Gauntlet",
    subtitle: "The Grind Belt  ·  Silver Standard",
    lore: "The city never sleeps, and neither does your opponent. Fast hands, faster minds.",
    tier: "silver",
    tierLabel: "SILVER TIER",
    tierHex: "#9CA3AF",
    eloMin: 900,
    eloMax: 1299,
    onlinePlayers: 197,
    difficulty: "Medium",
    timeLimitMin: 25,
    avgEloGain: 45,
    bgGradient:
      "radial-gradient(ellipse at 50% 0%, #0d1e3a 0%, #070d18 55%, #03050c 100%)",
    bgImage: "/arenas/mumbai.jpg",
    bgVideo: "/arenas/mumbai.webm",
  },
  {
    id: "birmingham",
    name: "Birmingham Forge",
    subtitle: "Molten Forge  ·  Steel & Syntax",
    lore: "Only those who've taken losses dare enter. The forges of Birmingham harden the weak.",
    tier: "gold",
    tierLabel: "GOLD TIER",
    tierHex: "#C9A227",
    eloMin: 1300,
    eloMax: 1699,
    onlinePlayers: 84,
    difficulty: "Hard",
    timeLimitMin: 20,
    avgEloGain: 62,
    bgGradient:
      "radial-gradient(ellipse at 50% 0%, #3a1800 0%, #190c00 55%, #090500 100%)",
    bgImage: "/arenas/birmingham.jpg",
    bgVideo: "/arenas/birmingham.webm",
  },
  {
    id: "manchester",
    name: "Manchester Stadium",
    subtitle: "Astral Apex  ·  The True Arena",
    lore: "No mercy. No hints. The crown sits at the top, and few ever reach it.",
    tier: "diamond",
    tierLabel: "DIAMOND TIER",
    tierHex: "#5EA8D9",
    eloMin: 1700,
    eloMax: null,
    onlinePlayers: 31,
    difficulty: "Expert",
    timeLimitMin: 15,
    avgEloGain: 90,
    bgGradient:
      "radial-gradient(ellipse at 50% 0%, #041530 0%, #020810 55%, #010204 100%)",
    bgImage: "/arenas/manchester.jpg",
    bgVideo: "/arenas/manchester.webm",
  },
];

export const DIFFICULTY_CLASS: Record<ArenaLevel["difficulty"], string> = {
  Easy: "text-[var(--color-success)]",
  Medium: "text-[var(--color-warning)]",
  Hard: "text-[var(--color-danger)]",
  Expert: "text-[var(--color-danger)]",
};

export const DEMO_LEADERBOARD: { rank: string; name: string; elo: number }[] = [
  { rank: "01", name: "Xenon_77", elo: 1490 },
  { rank: "02", name: "ByteRipper", elo: 1485 },
  { rank: "03", name: "Ghost_Ops", elo: 1420 },
  { rank: "04", name: "NullPointer", elo: 1405 },
  { rank: "05", name: "DeltaX_99", elo: 1380 },
  { rank: "06", name: "SyntaxGhost", elo: 1352 },
];
