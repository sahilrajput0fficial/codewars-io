"use client";

import React, { useState } from "react";
import type { TopicTag } from "../types";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TagCloudProps {
  tags: TopicTag[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function TagCloud({ tags, selectedTag, onSelectTag }: TagCloudProps) {
  const [expanded, setExpanded] = useState(false);

  const displayedTags = expanded ? tags : tags.slice(0, 12);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-1.5 transition-all duration-slow ease-settle">
        {displayedTags.map((tag) => {
          const isActive = selectedTag === tag.label;
          return (
            <button
              key={tag.label}
              onClick={() => onSelectTag(isActive ? null : tag.label)}
              className="px-4 py-2 rounded text-xs font-medium border transition-all duration-fast ease-snap flex items-center gap-1.5 cursor-pointer"
              style={{
                background: isActive ? "var(--color-accent)" : "var(--color-surface)",
                borderColor: isActive ? "var(--color-accent)" : "var(--color-border)",
                color: isActive ? "var(--color-accent-on-hover)" : "var(--color-text-secondary)",
              }}
            >
              <span className="font-sans leading-none">{tag.label}</span>
              <span
                className="font-mono text-[9px] tabular-nums font-bold leading-none"
                style={{
                  color: isActive ? "var(--color-primary)" : "var(--color-text-tertiary)",
                }}
              >
                {tag.count}
              </span>
            </button>
          );
        })}
      </div>

      {tags.length > 12 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="self-start flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-cw-text-secondary hover:text-cw-text-primary transition-colors cursor-pointer"
        >
          <span>{expanded ? "Show Less" : "Show All Topics"}</span>
          {expanded ? (
            <ChevronUp className="w-3 h-3 text-cw-text-tertiary" />
          ) : (
            <ChevronDown className="w-3 h-3 text-cw-text-tertiary" />
          )}
        </button>
      )}
    </div>
  );
}
