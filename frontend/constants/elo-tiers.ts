/**
 * Tier thresholds and helpers — single source of truth.
 *
 * DESIGN.md §5: tier colors are used ONLY for icons, borders, and
 * small badges. Never as large fills or backgrounds.
 *
 * colorVar values MUST reference CSS custom properties — no raw hex.
 */

export interface TierInfo {
  label: "Bronze" | "Silver" | "Gold" | "Diamond";
  /** CSS custom-property reference, e.g. `var(--color-tier-gold)` */
  colorVar: string;
}

/** ELO floor for each tier, highest first */
const TIERS: Array<{ min: number } & TierInfo> = [
  { min: 2000, label: "Diamond", colorVar: "var(--color-tier-diamond)" },
  { min: 1500, label: "Gold",    colorVar: "var(--color-tier-gold)" },
  { min: 1000, label: "Silver",  colorVar: "var(--color-tier-silver)" },
  { min: 0,   label: "Bronze",  colorVar: "var(--color-tier-bronze)" },
];

export function getTier(tierName: string): TierInfo {
  const name = tierName || "";
  const found = TIERS.find((t) => t.label.toLowerCase() === name.toLowerCase());
  return found ?? TIERS[TIERS.length - 1];
}

/** ELO required to reach a tier */
export const TIER_THRESHOLDS = {
  Diamond: 2000,
  Gold: 1500,
  Silver: 1000,
  Bronze: 0,
} as const;
