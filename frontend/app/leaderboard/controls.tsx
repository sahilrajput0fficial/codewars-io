"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Search, SlidersHorizontal, Globe, ChevronLeft, ChevronRight } from "lucide-react";

// ─── Search Bar ──────────────────────────────────────────────────────────────

export function LeaderboardSearch() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const qParam = searchParams.get("q") ?? "";
  const [searchTerm, setSearchTerm] = useState(qParam);

  // Sync state with URL when search parameter changes externally
  useEffect(() => {
    setSearchTerm(qParam);
  }, [qParam]);

  // Debounced navigation effect
  useEffect(() => {
    if (searchTerm === qParam) {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm) {
        params.set("q", searchTerm);
        params.set("offset", "0");
      } else {
        params.delete("q");
      }
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, qParam, pathname, router, searchParams]);

  return (
    <div className="relative flex-1 max-w-md">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
        style={{ color: "var(--color-text-tertiary)" }}
      />
      <input
        id="leaderboard-search"
        type="text"
        placeholder="Search warriors..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full text-sm pl-10 pr-4 h-10 rounded-lg focus:outline-none transition-colors"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-primary)",
        }}
        onFocus={(e) =>
          (e.currentTarget.style.borderColor = "var(--color-accent)")
        }
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = "var(--color-border)")
        }
      />
    </div>
  );
}

// ─── Sort Filter ─────────────────────────────────────────────────────────────

export function SortFilter() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const current = searchParams.get("sort_by") ?? "elo";

  const options = [
    { value: "elo",            label: "ELO" },
    { value: "wins",           label: "Wins" },
    { value: "matches_played", label: "Matches" },
  ];

  const set = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort_by", value);
    params.set("offset", "0");
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-xs flex items-center gap-1"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" /> Sort
      </span>

      {options.map((o) => {
        const active = current === o.value;
        return (
          <button
            key={o.value}
            id={`sort-${o.value}`}
            onClick={() => set(o.value)}
            className="px-3 h-8 text-xs font-medium rounded border transition-colors"
            style={{
              borderColor:     active ? "var(--color-accent)"          : "var(--color-border)",
              color:           active ? "var(--color-accent)"          : "var(--color-text-secondary)",
              background:      active ? "var(--color-accent-muted)"    : "var(--color-surface)",
            }}
          >
            {o.label}
          </button>
        );
      })}

      <button
        id="scope-global"
        className="ml-2 px-3 h-8 text-xs font-medium rounded border flex items-center gap-1.5 transition-colors"
        style={{
          borderColor: "var(--color-border)",
          color:       "var(--color-text-secondary)",
          background:  "var(--color-surface)",
        }}
      >
        <Globe className="w-3.5 h-3.5" /> Global
      </button>
    </div>
  );
}

// ─── Pagination Controls ──────────────────────────────────────────────────────

interface HATEOASLink {
  rel: string;
  label: string;
  offset: number | null;
  is_active: boolean;
}

export function Pagination({
  total,
  limit,
  offset,
  links,
}: {
  total: number;
  limit: number;
  offset: number;
  links?: HATEOASLink[];
}) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const from = offset + 1;
  const to   = Math.min(offset + limit, total);

  const go = (newOffset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("offset", String(newOffset));
    router.replace(`${pathname}?${params.toString()}`);
  };

  const btnStyle = {
    borderColor: "var(--color-border)",
    color:       "var(--color-text-secondary)",
    background:  "var(--color-surface)",
  };

  const activeStyle = {
    borderColor: "var(--color-accent)",
    color:       "var(--color-accent)",
    background:  "var(--color-accent-muted)",
  };

  let renderLinks = links || [];
  if (renderLinks.length === 0 && total > 0) {
    const totalPages  = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    // 1. Previous button link
    renderLinks.push({
      rel: "prev",
      label: "Previous",
      offset: currentPage > 1 ? Math.max(0, offset - limit) : null,
      is_active: false,
    });

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        renderLinks.push({
          rel: "page",
          label: String(i),
          offset: (i - 1) * limit,
          is_active: i === currentPage,
        });
      }
    } else {
      // First page
      renderLinks.push({
        rel: "first",
        label: "1",
        offset: 0,
        is_active: currentPage === 1,
      });

      if (currentPage > 3) {
        renderLinks.push({
          rel: "ellipsis",
          label: "...",
          offset: null,
          is_active: false,
        });
      }

      const start = Math.max(2, currentPage - 1);
      const end   = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (i > 1 && i < totalPages) {
          renderLinks.push({
            rel: "page",
            label: String(i),
            offset: (i - 1) * limit,
            is_active: i === currentPage,
          });
        }
      }

      if (currentPage < totalPages - 2) {
        renderLinks.push({
          rel: "ellipsis",
          label: "...",
          offset: null,
          is_active: false,
        });
      }

      // Last page
      renderLinks.push({
        rel: "last",
        label: String(totalPages),
        offset: (totalPages - 1) * limit,
        is_active: currentPage === totalPages,
      });
    }

    // 2. Next button link
    renderLinks.push({
      rel: "next",
      label: "Next",
      offset: currentPage < totalPages ? offset + limit : null,
      is_active: false,
    });
  }

  return (
    <div
      className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0 justify-between px-4 py-3 border-t"
      style={{ borderColor: "var(--color-border)" }}
    >
      <span
        className="text-xs font-mono"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        Showing {from.toLocaleString()}–{to.toLocaleString()} of{" "}
        {total.toLocaleString()}
      </span>

      <div className="flex items-center gap-1 flex-wrap">
        {renderLinks.map((link, idx) => {
          if (link.rel === "ellipsis") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-xs font-mono select-none"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                ...
              </span>
            );
          }

          const disabled = link.offset === null;
          const active   = link.is_active;

          return (
            <button
              key={`${link.rel}-${link.label}-${idx}`}
              disabled={disabled}
              onClick={() => link.offset !== null && go(link.offset)}
              className={`text-xs font-semibold rounded border transition-colors font-mono disabled:opacity-30 flex items-center justify-center ${
                link.rel === "prev" || link.rel === "next" ? "px-3 h-8" : "w-8 h-8"
              }`}
              style={active ? activeStyle : btnStyle}
            >
              {link.rel === "prev" && <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />}
              {link.label}
              {link.rel === "next" && <ChevronRight className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Jump to Me sticky bar ────────────────────────────────────────────────────

export function JumpToMeBar({
  rank,
  total,
}: {
  rank: number;
  total: number;
}) {
  const pct = ((rank / total) * 100).toFixed(2);

  return (
    <div
      id="jump-to-me-bar"
      className="fixed bottom-0 right-0 z-50 flex items-center justify-between px-6 py-3 border-t animate-in fade-in slide-in-from-bottom-4 duration-300 transition-all"
      style={{
        left: "var(--sidebar-width, 0px)",
        background:  "var(--color-surface-2)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center gap-3 text-sm">
        <span
          className="w-2 h-2 rounded-full inline-block animate-pulse"
          style={{ background: "var(--color-accent)" }}
        />
        <span style={{ color: "var(--color-text-secondary)" }}>
          Your current position:{" "}
          <span
            className="font-mono font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            #{rank.toLocaleString()}
          </span>
        </span>
        <span style={{ color: "var(--color-text-tertiary)" }}>|</span>
        <span style={{ color: "var(--color-text-secondary)" }}>
          Top{" "}
          <span className="font-mono" style={{ color: "var(--color-text-primary)" }}>
            {pct}%
          </span>{" "}
          of all users
        </span>
      </div>

      <button
        id="jump-to-me-btn"
        className="px-4 h-8 text-xs font-semibold rounded border flex items-center gap-2 transition-colors hover:border-[var(--color-text-secondary)]"
        style={{
          background:  "var(--color-surface)",
          borderColor: "var(--color-border)",
          color:       "var(--color-text-primary)",
        }}
        onClick={() => {
          document
            .getElementById("personal-standings-bar")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      >
        <span style={{ color: "var(--color-text-tertiary)" }}>⊕</span> Jump to Me
      </button>
    </div>
  );
}
