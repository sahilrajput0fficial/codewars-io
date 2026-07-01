"use client";

/**
 * features/auth/components/live-dot.tsx
 * Animated online-status indicator (DESIGN.md §10.2).
 * Uses ring-ping animation — no glow, no glassmorphism.
 */

export function LiveDot() {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-cw-success animate-ring-ping" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-cw-success animate-pulse-live" />
    </span>
  );
}
