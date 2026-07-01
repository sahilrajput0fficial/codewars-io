"use client";

/**
 * features/auth/components/avatar.tsx
 * Circular avatar with tier-colored border.
 * AGENTS.md: single responsibility — presentational only.
 */

import React from "react";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({
  username,
  avatarUrl,
  size,
  tierColor,
}: {
  username:  string;
  avatarUrl: string | null;
  size:      string;
  tierColor: string;
}) {
  return (
    <div
      className={`${size} rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-mono font-black text-cw-text-secondary border-2`}
      style={{ background: "var(--color-surface-2)", borderColor: tierColor }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
      ) : (
        <span style={{ color: tierColor }}>{getInitials(username)}</span>
      )}
    </div>
  );
}
