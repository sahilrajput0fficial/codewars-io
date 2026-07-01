"use client";

/**
 * features/leaderboard/components/scroll-reveal.tsx
 * Re-exports the hook and provides two ready-made wrapper components.
 */

import React from "react";
import { useScrollReveal } from "../hooks/use-scroll-reveal";

export { useScrollReveal };

// ─── ScrollRevealDiv ──────────────────────────────────────────────────────────

export function ScrollRevealDiv({
  children,
  className = "",
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const [ref, visible] = useScrollReveal<HTMLDivElement>(0.1);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 220ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 220ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── ScrollRevealRow ──────────────────────────────────────────────────────────

export function ScrollRevealRow({
  children,
  delay = 0,
  style,
  className = "",
  id,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  className?: string;
  id?: string;
}) {
  const [ref, visible] = useScrollReveal<HTMLTableRowElement>(0.05);

  return (
    <tr
      ref={ref}
      id={id}
      className={className}
      style={{
        ...style,
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateX(0)" : "translateX(-8px)",
        transition: `opacity 220ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 220ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </tr>
  );
}
