"use client";

/**
 * features/auth/components/profile-skeleton.tsx
 * Reusable skeleton loader matching the dynamic ProfilePage layout.
 * Premium dark styling, pulsing animations, and clean wireframe blocks.
 */

export function ProfileSkeleton() {
  return (
    <div className="w-full min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* ── Hero Banner Skeleton ── */}
      <div className="relative h-48 bg-cw-surface border-b border-cw-border overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-cw-surface-2 animate-pulse" />
      </div>

      {/* ── Profile Identity Section Skeleton ── */}
      <div className="px-6 md:px-10 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
          {/* Avatar Skeleton */}
          <div className="w-24 h-24 rounded-full bg-cw-surface-2 border-2 border-cw-border animate-pulse flex-shrink-0" />

          {/* Name, tier, join date Skeleton */}
          <div className="flex-1 pb-1 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="h-7 w-48 bg-cw-surface-2 rounded animate-pulse" />
              <div className="h-5 w-20 bg-cw-surface-2 rounded-sm animate-pulse" style={{ clipPath: "polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%)" }} />
            </div>
            <div className="h-4 w-60 bg-cw-surface-2 rounded animate-pulse" />
          </div>

          {/* Actions Skeleton */}
          <div className="flex items-center gap-2 pb-1">
            <div className="h-8 w-32 bg-cw-surface-2 rounded-lg animate-pulse" />
            <div className="h-8 w-28 bg-cw-surface-2 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Bio Skeleton */}
        <div className="mt-4 flex flex-col gap-2 max-w-lg">
          <div className="h-4 w-full bg-cw-surface-2 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-cw-surface-2 rounded animate-pulse" />
        </div>
      </div>

      {/* ── Stats Strip Skeleton ── */}
      <div className="mt-6 mx-6 md:mx-10 rounded-xl border border-cw-border bg-cw-surface overflow-hidden">
        <div className="flex divide-x divide-cw-border overflow-x-auto py-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 px-6 flex-1 min-w-[100px] flex-shrink-0">
              <div className="h-5 w-12 bg-cw-surface-2 rounded animate-pulse" />
              <div className="h-3 w-16 bg-cw-surface-2 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Two-column body Skeleton ── */}
      <div className="mt-6 px-6 md:px-10 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Recent Matches */}
          <div className="rounded-xl border border-cw-border bg-cw-surface overflow-hidden">
            <div className="h-10 bg-cw-surface-2 border-b border-cw-border px-4 flex items-center">
              <div className="h-4 w-32 bg-cw-surface rounded animate-pulse" />
            </div>
            <div className="p-4 flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-cw-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cw-surface-2 animate-pulse" />
                    <div className="flex flex-col gap-1.5">
                      <div className="h-4 w-28 bg-cw-surface-2 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-cw-surface-2 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="h-4 w-12 bg-cw-surface-2 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-cw-surface-2 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Overview */}
          <div className="rounded-xl border border-cw-border bg-cw-surface overflow-hidden">
            <div className="h-10 bg-cw-surface-2 border-b border-cw-border px-4 flex items-center">
              <div className="h-4 w-40 bg-cw-surface rounded animate-pulse" />
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-cw-surface-2 animate-pulse" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-4 w-32 bg-cw-surface-2 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-cw-surface-2 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
