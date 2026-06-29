"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  Globe,
  ChevronLeft,
  ChevronRight,
  Target,
} from "lucide-react";

// ─── Search Bar ──────────────────────────────────────────────────────────────

export function LeaderboardSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const qParam = searchParams.get("q") ?? "";
  const [searchTerm, setSearchTerm] = useState(qParam);

  useEffect(() => {
    setSearchTerm(qParam);
  }, [qParam]);

  useEffect(() => {
    if (searchTerm === qParam) return;

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
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cw-text-tertiary" />
      <input
        id="leaderboard-search"
        type="text"
        placeholder="Search warriors..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full text-sm pl-9 pr-4 h-9 rounded-xl focus:outline-none bg-cw-surface border border-cw-border text-cw-text-primary focus:border-cw-accent transition-colors placeholder-cw-text-tertiary"
      />
    </div>
  );
}

// ─── Sort Filter ─────────────────────────────────────────────────────────────

export function SortFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = searchParams.get("sort_by") ?? "elo";

  const options = [
    { value: "elo", label: "ELO" },
    { value: "wins", label: "Wins" },
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
      <span className="text-[10px] font-black tracking-widest flex items-center gap-1 text-cw-text-tertiary">
        <SlidersHorizontal className="w-3 h-3" />
        SORT
      </span>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-cw-surface-2 border border-cw-border">
        {options.map((o) => {
          const active = current === o.value;
          return (
            <button
              key={o.value}
              id={`sort-${o.value}`}
              onClick={() => set(o.value)}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors border ${
                active
                  ? "bg-cw-bg text-cw-text-primary border-cw-border shadow-sm"
                  : "bg-transparent border-transparent text-cw-text-secondary hover:text-cw-text-primary"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <button
        id="scope-global"
        className="ml-1 px-3 h-8 text-[11px] font-bold tracking-wide border rounded-xl flex items-center gap-1.5 transition-colors bg-cw-surface border-cw-border text-cw-text-tertiary hover:text-cw-text-secondary"
      >
        <Globe className="w-3 h-3" />
        Global
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = offset + 1;
  const to = Math.min(offset + limit, total);

  const go = (newOffset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("offset", String(newOffset));
    router.replace(`${pathname}?${params.toString()}`);
  };

  let renderLinks = links || [];
  if (renderLinks.length === 0 && total > 0) {
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;

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
      const end = Math.min(totalPages - 1, currentPage + 1);
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

      renderLinks.push({
        rel: "last",
        label: String(totalPages),
        offset: (totalPages - 1) * limit,
        is_active: currentPage === totalPages,
      });
    }

    renderLinks.push({
      rel: "next",
      label: "Next",
      offset: currentPage < totalPages ? offset + limit : null,
      is_active: false,
    });
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0 justify-between px-4 py-3 border-t border-cw-border">
      <span className="text-[10px] font-mono font-semibold text-cw-text-tertiary">
        {from.toLocaleString()}–{to.toLocaleString()} of{" "}
        {total.toLocaleString()} warriors
      </span>

      <div className="flex items-center gap-1 flex-wrap">
        {renderLinks.map((link, idx) => {
          if (link.rel === "ellipsis") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-xs font-mono select-none text-cw-text-tertiary"
              >
                ...
              </span>
            );
          }

          const disabled = link.offset === null;
          const active = link.is_active;

          return (
            <button
              key={`${link.rel}-${link.label}-${idx}`}
              disabled={disabled}
              onClick={() => link.offset !== null && go(link.offset)}
              className={`text-[11px] font-bold border transition-colors font-mono disabled:opacity-30 flex items-center justify-center rounded-lg ${
                link.rel === "prev" || link.rel === "next"
                  ? "px-3 h-8"
                  : "w-8 h-8"
              } ${
                active
                  ? "bg-cw-bg text-cw-text-primary border-cw-border shadow-sm font-black"
                  : "bg-cw-surface border-cw-border text-cw-text-secondary hover:text-cw-text-primary hover:bg-cw-surface-2"
              }`}
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pct = ((rank / total) * 105).toFixed(1); // normalized percentile rank

  useEffect(() => {
    if (searchParams.get("jump") === "true") {
      const t = setTimeout(() => {
        const myRow = document.getElementById("my-row");
        if (myRow) {
          myRow.scrollIntoView({ behavior: "smooth", block: "center" });
          myRow.style.backgroundColor = "var(--color-accent-muted)";
          setTimeout(() => {
            myRow.style.backgroundColor = "";
          }, 1500);

          // Clean up the jump query param
          const params = new URLSearchParams(searchParams.toString());
          params.delete("jump");
          router.replace(`${pathname}?${params.toString()}`);
        }
      }, 500);
      return () => clearTimeout(t);
    }
  }, [searchParams, router, pathname]);

  const handleJump = () => {
    const myRow = document.getElementById("my-row");
    if (myRow) {
      myRow.scrollIntoView({ behavior: "smooth", block: "center" });
      myRow.style.backgroundColor = "var(--color-accent-muted)";
      setTimeout(() => {
        myRow.style.backgroundColor = "";
      }, 1500);
    } else {
      // Clear search query and calculate correct page offset
      const userOffset = Math.floor((rank - 1) / 10) * 10;
      const params = new URLSearchParams();
      params.set("offset", String(userOffset));
      params.set("jump", "true");
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div
      id="jump-to-me-bar"
      className="fixed bottom-0 right-0 z-50 flex items-center justify-between px-6 py-3 border-t bg-cw-surface-2 border-cw-border animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{
        left: "var(--sidebar-width, 0px)",
      }}
    >
      <div className="flex items-center gap-3 text-sm">
        <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse bg-cw-accent" />
        <span className="text-cw-text-secondary">
          Your rank:{" "}
          <span className="font-mono font-bold text-cw-text-primary">
            #{rank.toLocaleString()}
          </span>
        </span>
        <span className="text-cw-border">|</span>
        <span className="text-cw-text-secondary">
          Top{" "}
          <span className="font-mono font-semibold text-cw-text-primary">
            {pct}%
          </span>{" "}
          globally
        </span>
      </div>

      <button
        id="jump-to-me-btn"
        className="px-4 h-8 text-[11px] font-bold tracking-wide border border-cw-border hover:border-cw-text-secondary bg-cw-surface text-cw-text-primary flex items-center gap-2 transition-colors"
        style={{
          clipPath:
            "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
        }}
        onClick={handleJump}
      >
        <Target className="w-3.5 h-3.5 text-cw-accent" />
        Jump to Me
      </button>
    </div>
  );
}