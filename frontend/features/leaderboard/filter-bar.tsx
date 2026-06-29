"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
import { LeaderboardEntry } from "./types";

interface FilterBarProps {
  me: LeaderboardEntry | null;
}

export function FilterBar({ me }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort_by") ?? "elo";
  const currentQuery = searchParams.get("q") ?? "";

  const [searchVal, setSearchVal] = useState(currentQuery);
  const [timeframe, setTimeframe] = useState("Seasonal");
  const [queue, setQueue] = useState("Ranked Solo");

  useEffect(() => {
    setSearchVal(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    if (searchVal === currentQuery) return;
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchVal) {
        params.set("q", searchVal);
        params.set("offset", "0");
      } else {
        params.delete("q");
      }
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal, currentQuery, pathname, router, searchParams]);

  const handleSort = (sortVal: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort_by", sortVal);
    params.set("offset", "0");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleShowMyPlace = () => {
    const myRow = document.getElementById("my-row");
    if (myRow) {
      myRow.scrollIntoView({ behavior: "smooth", block: "center" });
      myRow.style.backgroundColor = "rgba(224, 70, 70, 0.25)";
      setTimeout(() => {
        myRow.style.backgroundColor = "";
      }, 1500);
    } else if (me && me.rank) {
      const userOffset = Math.floor((me.rank - 1) / 10) * 10;
      const params = new URLSearchParams();
      params.set("offset", String(userOffset));
      params.set("jump", "true");
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="flex flex-col gap-3 mb-6 lg:flex-row lg:items-center lg:justify-between">
      {/* Left: Grouped selectors */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort Tabs */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-cw-surface-2 border border-cw-border">
          {[
            { label: "Rank", value: "elo" },
            { label: "Win Rate", value: "wins" },
            { label: "KDA", value: "matches_played" },
          ].map((tab) => {
            const active = currentSort === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleSort(tab.value)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  active
                    ? "bg-cw-bg text-cw-text-primary shadow-sm"
                    : "text-cw-text-secondary hover:text-cw-text-primary"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Timeframe Tabs */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-cw-surface-2 border border-cw-border">
          {["24h", "7D", "30D", "Seasonal"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                timeframe === tf
                  ? "bg-cw-bg text-cw-text-primary shadow-sm"
                  : "text-cw-text-secondary hover:text-cw-text-primary"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Right side options */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cw-text-secondary" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full text-xs pl-8 pr-3 h-8 rounded-lg focus:outline-none bg-cw-surface border border-cw-border text-cw-text-primary focus:border-cw-accent transition-colors placeholder:text-cw-text-tertiary"
          />
        </div>

        <div className="relative">
          <select
            value={queue}
            onChange={(e) => setQueue(e.target.value)}
            className="appearance-none pr-7 pl-3 h-8 text-xs font-semibold rounded-lg bg-cw-surface border border-cw-border text-cw-text-primary focus:outline-none focus:border-cw-accent cursor-pointer"
          >
            <option>Ranked Solo</option>
            <option>Ranked Duo</option>
            <option>Custom Arena</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-cw-text-secondary pointer-events-none" />
        </div>

        {me && (
          <button
            onClick={handleShowMyPlace}
            className="px-3 h-8 text-[11px] font-semibold rounded-lg border border-cw-border bg-cw-surface-2 text-cw-text-secondary hover:text-cw-text-primary transition-colors whitespace-nowrap"
          >
            Show my place
          </button>
        )}
      </div>
    </div>
  );
}
