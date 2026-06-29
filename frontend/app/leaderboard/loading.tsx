import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";

export default function LeaderboardLoading() {
  const surfaceStyle  = { background: "var(--color-surface)" };
  const surface2Style = { background: "var(--color-surface-2)" };

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}
    >
      {/* ── Collapsible Left Sidebar ───────────────────────────────────── */}
      <Sidebar />

      {/* ── Main Content Loading Area ─────────────────────────────────── */}
      <div className="flex-1 min-h-screen pb-20 animate-pulse overflow-hidden">
        {/* Shared Navbar */}
        <Navbar
          breadcrumbs={[
            { label: "Rankings" },
            { label: "Global Standings" },
          ]}
        />

        {/* Header Banner Skeleton - Matches h-80 full width */}
        <div 
          className="relative w-full border-b border-cw-border h-80 flex flex-col justify-between px-6 md:px-8 py-6 mb-8"
          style={{ background: "var(--color-bg)" }}
        >
          {/* Top row: Timer skeleton */}
          <div className="flex justify-end">
            <div className="h-7 w-32 rounded-full" style={surface2Style} />
          </div>

          {/* Bottom row: Info & Action Buttons skeleton */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex-shrink-0" style={surface2Style} />
              <div className="space-y-2">
                <div className="h-6 w-40 rounded animate-pulse" style={surface2Style} />
                <div className="h-4 w-72 rounded animate-pulse" style={surface2Style} />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full" style={surface2Style} />
              <div className="h-9 w-28 rounded-full" style={surface2Style} />
              <div className="h-9 w-24 rounded-full" style={surface2Style} />
              <div className="h-9 w-28 rounded-full" style={surface2Style} />
            </div>
          </div>
        </div>

        <div className="w-full px-8 py-8">

          {/* Podium skeleton */}
          <div className="flex gap-4 mb-10 items-end">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`rounded ${i === 2 ? "flex-1 h-32" : "w-44 h-40"}`}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 max-w-md h-10 rounded-lg" style={surfaceStyle} />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-16 rounded" style={surfaceStyle} />
              ))}
            </div>
          </div>

          {/* Table skeleton */}
          <div
            className="rounded border overflow-hidden"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          >
            <div className="h-10" style={surface2Style} />
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3.5 border-t"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="h-4 w-8 rounded" style={surface2Style} />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full" style={surface2Style} />
                  <div className="space-y-1">
                    <div className="h-3 w-28 rounded" style={surface2Style} />
                    <div className="h-2 w-16 rounded" style={surface2Style} />
                  </div>
                </div>
                <div className="h-4 w-12 rounded ml-auto" style={surface2Style} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
