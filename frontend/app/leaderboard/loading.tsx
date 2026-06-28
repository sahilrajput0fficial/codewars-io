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

        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex justify-between mb-8">
            <div className="space-y-2">
              <div className="h-2 w-28 rounded" style={surface2Style} />
              <div className="h-8 w-56 rounded" style={surface2Style} />
            </div>
            <div className="space-y-1 text-right">
              <div className="h-2 w-20 rounded ml-auto" style={surface2Style} />
              <div className="h-7 w-32 rounded ml-auto" style={surface2Style} />
            </div>
          </div>

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
