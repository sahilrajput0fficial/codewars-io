"use client";

/**
 * features/auth/components/stat-chip.tsx
 * Single stat display inside the horizontal stats strip.
 * Features an intelligent parser that separates digits from letters/emojis,
 * rendering digits in monospace and other characters in sans-serif to prevent
 * overlap/clipping on Windows and small screens.
 */

export function StatChip({
  label,
  value,
  accent,
}: {
  label:   string;
  value:   string | number;
  accent?: boolean;
}) {
  // Split the value into numeric parts (including punctuation like commas) and others
  const parts = value.toString().split(/([\d,.]+)/);

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-4 px-6 flex-1 min-w-[100px] flex-shrink-0 select-none text-center">
      <div className="flex items-baseline justify-center">
        {parts.map((part, i) => {
          if (!part) return null;
          
          // If the part is numeric (digits, commas, periods)
          const isNumeric = /^[\d,.]+$/.test(part);
          
          if (isNumeric) {
            return (
              <span
                key={i}
                className="font-mono text-xl font-black tracking-tight tabular-nums"
                style={{ color: accent ? "var(--color-accent)" : "var(--color-text-primary)" }}
              >
                {part}
              </span>
            );
          }

          // If the part is letters, emojis, or symbols (%, #, etc.)
          // Emojis need standard sans-serif spacing to avoid clipping/overlapping in monospace spans
          const isEmoji = /[\uD800-\uDFFF\u2600-\u27BF]/.test(part);
          return (
            <span
              key={i}
              className={`font-sans font-bold leading-none select-none ${
                isEmoji ? "text-base ml-1" : "text-xs text-cw-text-secondary mx-0.5"
              }`}
            >
              {part}
            </span>
          );
        })}
      </div>
      
      <span className="text-[10px] font-black uppercase tracking-widest text-cw-text-secondary">
        {label}
      </span>
    </div>
  );
}
