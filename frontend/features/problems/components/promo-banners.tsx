import React from "react";
import type { PromoBanner } from "../types";
import { ArrowRight } from "lucide-react";

interface PromoBannersProps {
  banners: PromoBanner[];
}

export function PromoBanners({ banners }: PromoBannersProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin select-none">
      {banners.map((banner) => (
        <a
          key={banner.id}
          href={banner.link}
          className="flex-shrink-0 w-80 h-36 rounded-xl border border-cw-border relative overflow-hidden group transition-all duration-base ease-snap hover:-translate-y-1 hover:border-cw-accent/40"
          style={{
            background: "var(--color-surface)",
          }}
        >
          {/* Accent-colored pattern fill */}
          <div
            className="absolute inset-0 opacity-40 mix-blend-color-dodge transition-opacity duration-slow group-hover:opacity-60"
            style={{
              backgroundImage: banner.bgPattern,
            }}
          />

          <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
            <div>
              <h3 className="text-sm font-bold text-cw-text-primary tracking-wide line-clamp-1">
                {banner.title}
              </h3>
              <p className="text-[11px] text-cw-text-secondary mt-1.5 line-clamp-2 leading-relaxed">
                {banner.description}
              </p>
            </div>

            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-cw-text-tertiary group-hover:text-cw-accent transition-colors duration-fast">
              <span>View course</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-fast group-hover:translate-x-1" />
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
