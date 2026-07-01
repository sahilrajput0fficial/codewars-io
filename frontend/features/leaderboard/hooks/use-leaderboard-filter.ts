"use client";

/**
 * features/leaderboard/hooks/use-leaderboard-filter.ts
 * Encapsulates URL search-param reading, sort/timeframe state, and the
 * debounced search-input sync.  Extracted from filter-bar.tsx per AGENTS.md.
 */

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { SortValue, Timeframe } from "../constants";
import { TIMEFRAME_OPTIONS } from "../constants";

export interface LeaderboardFilterState {
  searchVal:    string;
  setSearchVal: (v: string) => void;
  currentSort:  string;
  handleSort:   (sortVal: string) => void;
  timeframe:    Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  queue:        string;
  setQueue:     (q: string) => void;
}

export function useLeaderboardFilter(): LeaderboardFilterState {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const currentSort  = searchParams.get("sort_by") ?? "elo";
  const currentQuery = searchParams.get("q") ?? "";

  const [searchVal, setSearchVal] = useState(currentQuery);
  const [timeframe, setTimeframe] = useState<Timeframe>(TIMEFRAME_OPTIONS[3]);
  const [queue,     setQueue]     = useState("Ranked Solo");

  // keep local state in sync when URL params change externally
  useEffect(() => {
    setSearchVal(currentQuery);
  }, [currentQuery]);

  // debounced search → URL update
  useEffect(() => {
    if (searchVal === currentQuery) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchVal) {
        params.set("q", searchVal);
        params.set("offset", "0");
      } else {
        params.delete("q");
      }
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal, currentQuery, pathname, router, searchParams]);

  function handleSort(sortVal: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort_by", sortVal as SortValue);
    params.set("offset", "0");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return {
    searchVal,
    setSearchVal,
    currentSort,
    handleSort,
    timeframe,
    setTimeframe,
    queue,
    setQueue,
  };
}
