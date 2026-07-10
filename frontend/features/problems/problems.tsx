"use client";

import React, { useEffect, useState } from "react";
import type { Problem, TopicTag, PromoBanner } from "./types";
import { fetchPromoBanners, fetchTopicTags, fetchProblems } from "./services/problems-service";
//import { PromoBanners } from "./components/promo-banners";
import { TagCloud } from "./components/tag-cloud";
import { ProblemsTable } from "./components/problems-table";
import { Search, ChevronDown, Award } from "lucide-react";

export function ProblemsFeature() {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [tags, setTags] = useState<TopicTag[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [activeCategory, setActiveCategory] = useState<string>("All Topics");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState("");
  const [difficulty, setDifficulty] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [status, setStatus] = useState<"All" | "solved" | "attempted" | "todo">("All");

  // Load initial banners and tags
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [bannerData, tagData] = await Promise.all([
          fetchPromoBanners(),
          fetchTopicTags(),
        ]);
        setBanners(bannerData);
        setTags(tagData);
      } catch (err) {
        console.error("Failed to load metadata", err);
      }
    }
    loadMetadata();
  }, []);

  // Fetch problems when filter states change
  useEffect(() => {
    async function loadProblems() {
      setIsLoading(true);
      try {
        const data = await fetchProblems({
          category: activeCategory,
          tag: selectedTag || undefined,
          search: searchVal || undefined,
          difficulty,
          status,
        });
        setProblems(data);
      } catch (err) {
        console.error("Failed to load problems", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProblems();
  }, [activeCategory, selectedTag, searchVal, difficulty, status]);

  // Categories derived from standard list
  const CATEGORIES = ["All Topics", "Algorithms", "Database", "Shell", "Concurrency", "JavaScript"];

  // Solved Stats (Local Mock)
  const totalSolved = 525;
  const totalProblems = 1757;
  const solvedPercentage = (totalSolved / totalProblems) * 100;

  return (
    <div className="w-full flex flex-col gap-6 animate-rise-in">
      {/* 1. Banners */}
      {/*banners.length > 0 && <PromoBanners banners={banners} />*/}

      {/* 2. Tag Cloud Section */}
      {tags.length > 0 && (
        <div className="p-4 rounded-xl border border-cw-border bg-cw-surface">
          <TagCloud
            tags={tags}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
          />
        </div>
      )}

      {/* 3. Category Selectors (Filter Pills) */}
      <div className="flex flex-wrap gap-1.5 border-b border-cw-border pb-1">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSelectedTag(null); // Reset sub-tag
              }}
              className="px-8 pb-4 text-xs font-black uppercase tracking-widest transition-colors duration-fast ease-snap cursor-pointer relative"
              style={{
                color: isActive ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
              }}
            >
              {cat}
              {isActive && (
                <div
                  className="absolute bottom-0 left-3.5 right-3.5 h-[2px]"
                  style={{
                    background: "var(--color-accent)",
                    boxShadow: "0 0 8px var(--color-accent-muted)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Solved Progress & Sub-Filters Row */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 rounded-xl border border-cw-border bg-cw-surface/20">
        {/* Progress tracker */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center border flex-shrink-0"
            style={{
              borderColor: "var(--color-accent)",
              background: "var(--color-accent-muted)",
              color: "var(--color-accent)",
            }}
          >
            <Award className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-end justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-widest text-cw-text-secondary font-black">
                Training Progress
              </span>
              <span className="font-mono text-xs font-bold text-cw-text-primary tabular-nums">
                {totalSolved} / {totalProblems} Solved
              </span>
            </div>
            <div className="w-full h-2 bg-cw-surface-2 border border-cw-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-slow ease-settle"
                style={{
                  width: `${solvedPercentage}%`,
                  background: "var(--color-accent)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Input Fields / Filter Panel */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cw-text-tertiary" />
            <input
              type="text"
              placeholder="Search challenges..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full text-xs pl-8 pr-3 h-8 rounded-lg focus:outline-none bg-cw-surface border border-cw-border text-cw-text-primary focus:border-cw-accent transition-colors placeholder:text-cw-text-tertiary font-sans"
            />
          </div>

          {/* Difficulty Dropdown */}
          <div className="relative">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="appearance-none pr-8 pl-3 h-8 text-xs font-bold rounded-lg bg-cw-surface border border-cw-border text-cw-text-secondary focus:outline-none focus:border-cw-accent cursor-pointer font-sans"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-cw-text-tertiary pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="appearance-none pr-8 pl-3 h-8 text-xs font-bold rounded-lg bg-cw-surface border border-cw-border text-cw-text-secondary focus:outline-none focus:border-cw-accent cursor-pointer font-sans"
            >
              <option value="All">All Status</option>
              <option value="solved">Solved</option>
              <option value="attempted">Attempting</option>
              <option value="todo">Todo</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-cw-text-tertiary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 5. Problems Table */}
      <ProblemsTable problems={problems} isLoading={isLoading} />
    </div>
  );
}
