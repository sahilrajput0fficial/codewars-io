"use client";

/**
 * features/leaderboard/hooks/use-scroll-reveal.ts
 * Fires once when an element enters the viewport — used to stagger-animate
 * rows and cards into view.  Extracted from scroll-reveal.tsx per AGENTS.md.
 */

import { useEffect, useRef, useState } from "react";

export function useScrollReveal<T extends HTMLElement>(
  threshold = 0.15
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el); // fire once only
        }
      },
      { threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}
