"use client";

import { useEffect, useState } from "react";

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);

      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatNum = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 font-mono text-xs text-cw-text-secondary">
      <span className="text-[10px] uppercase tracking-wider font-bold text-cw-text-primary">
        Leaderboard resets in:
      </span>
      <div className="flex items-center gap-1">
        <span className="bg-cw-surface-2 border border-cw-border px-2 py-0.5 rounded text-cw-text-primary font-bold tabular-nums">
          {formatNum(timeLeft.hours)}
        </span>
        <span className="text-cw-text-tertiary font-black animate-pulse">:</span>
        <span className="bg-cw-surface-2 border border-cw-border px-2 py-0.5 rounded text-cw-text-primary font-bold tabular-nums">
          {formatNum(timeLeft.minutes)}
        </span>
        <span className="text-cw-text-tertiary font-black animate-pulse">:</span>
        <span className="bg-cw-surface-2 border border-cw-border px-2 py-0.5 rounded text-cw-text-primary font-bold tabular-nums">
          {formatNum(timeLeft.seconds)}
        </span>
      </div>
    </div>
  );
}
