"use client";

/**
 * features/auth/components/section-card.tsx
 * Card wrapper with header strip containing an icon + title.
 * Used throughout the profile page to group related stats.
 */

import React from "react";

export function SectionCard({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title:     string;
  icon:      React.ComponentType<{ className?: string }>;
  children:  React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-cw-border bg-cw-surface overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-cw-border bg-cw-surface-2">
        <Icon className="w-3.5 h-3.5 text-cw-text-secondary" />
        <span className="text-[11px] font-black uppercase tracking-widest text-cw-text-secondary">
          {title}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
