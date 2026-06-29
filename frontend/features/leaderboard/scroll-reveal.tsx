"use client";

import { useEffect, useRef, useState } from "react";

// ─── useScrollReveal — triggers animation when element enters viewport ─────────

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
          obs.unobserve(el); // fire once
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

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
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
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
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-8px)",
        transition: `opacity 220ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 220ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </tr>
  );
}
