import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Trophy } from "lucide-react";

import { BASE_URL } from "@/proxy";
import { getTier } from "@/constants/elo-tiers";
import { Pagination, JumpToMeBar } from "./controls";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { ScrollRevealDiv, ScrollRevealRow } from "@/features/leaderboard/scroll-reveal";
import { LeaderboardHeader } from "@/features/leaderboard/leaderboard-header";
import { FilterBar } from "@/features/leaderboard/filter-bar";
import { AnimatedPodium } from "@/features/leaderboard/top-warrior-card";
import type { LeaderboardEntry } from "@/features/leaderboard/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HATEOASLink {
  rel: string;
  label: string;
  offset: number | null;
  is_active: boolean;
}

interface LeaderboardResponse {
  total: number;
  total_global: number;
  limit: number;
  offset: number;
  sort_by: string;
  entries: LeaderboardEntry[];
  links: HATEOASLink[];
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchLeaderboard(
  sortBy: string,
  limit: number,
  offset: number,
  q: string = ""
): Promise<LeaderboardResponse | null> {
  try {
    const queryParam = q ? `&q=${encodeURIComponent(q)}` : "";
    const res = await fetch(
      `${BASE_URL}/leaderboard/?sort_by=${sortBy}&limit=${limit}&offset=${offset}&sort_order=desc${queryParam}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchTop3(sortBy: string): Promise<LeaderboardEntry[]> {
  const data = await fetchLeaderboard(sortBy, 3, 0);
  return data?.entries ?? [];
}

async function fetchMe(token: string): Promise<LeaderboardEntry | null> {
  try {
    const res = await fetch(`${BASE_URL}/leaderboard/me`, {
      headers: { Cookie: `access_token=${token}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function winRate(wins: number, matches: number) {
  if (matches === 0) return "—";
  return `${Math.round((wins / matches) * 100)}%`;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  user,
  size = "md",
}: {
  user: LeaderboardEntry;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
  };
  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold font-mono flex-shrink-0 overflow-hidden`}
      style={{
        background: "var(--color-surface-2)",
        color: "var(--color-text-secondary)",
      }}
    >
      {user.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar_url}
          alt={user.username}
          className="w-full h-full object-cover"
        />
      ) : (
        getInitials(user.username)
      )}
    </div>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function TableRow({
  entry,
  isMe,
  index,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
  index: number;
}) {
  const tier = getTier(entry.elo_tier);
  const wr = winRate(entry.wins, entry.matches_played);

  return (
    <ScrollRevealRow
      id={isMe ? "my-row" : undefined}
      className={`group transition-colors duration-150 hover:bg-cw-surface-2/60 cursor-pointer ${isMe ? "bg-cw-accent-muted" : ""
        }`}
      delay={index * 30}
    >
      {/* Col 1: Place */}
      <td className="py-3.5 pl-4 pr-3 w-16 relative">
        <div
          className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-1 transition-[width] duration-fast ease-snap bg-cw-accent"
        />
        <span
          className="font-mono text-sm font-bold tabular-nums relative z-10 text-cw-text-secondary"
        >
          {entry.rank}
        </span>
      </td>

      {/* Col 2: Player name */}
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-3 relative z-10">
          <Avatar user={entry} size="sm" />
          <div>
            <p className="text-sm font-bold flex items-center gap-1.5 leading-tight text-cw-text-primary">
              {entry.username}
              {isMe && (
                <span className="text-[9px] font-black px-1.5 py-0.5 tracking-widest rounded bg-cw-accent  border border-accent/30 text-white">
                  YOU
                </span>
              )}
            </p>
          </div>
        </div>
      </td>

      {/* Col 3: Lokal Stats */}
      <td className="py-3.5 pr-4 text-left">
        <span className="font-mono text-sm font-bold text-cw-text-secondary tabular-nums relative z-10">
          {entry.wins} - {entry.losses}
        </span>
      </td>

      {/* Col 4: Winrate */}
      <td className="py-3.5 pr-4 text-left w-32">
        <div className="flex flex-col gap-1 relative z-10">
          <span className="font-mono text-sm font-bold text-cw-text-primary tabular-nums">
            {wr}
          </span>
          <div className="w-20 h-1 bg-cw-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: wr === "—" ? "0%" : wr,
                background: "var(--color-success)",
              }}
            />
          </div>
        </div>
      </td>

      {/* Col 5: ELO Rating */}
      <td className="py-3.5 pr-4 text-left">
        <span
          className="font-mono text-sm font-black tabular-nums relative z-10"
          style={{ color: tier.colorVar }}
        >
          {entry.elo.toLocaleString()}
        </span>
      </td>

      {/* Col 6: Rank (Tier) */}
      <td className="py-3.5 pr-4 text-left">
        <div className="flex items-center gap-2 relative z-10">
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center border"
            style={{
              borderColor: tier.colorVar,
              background: `${tier.colorVar}11`,
            }}
          >
            <Trophy className="w-2.5 h-2.5" style={{ color: tier.colorVar }} />
          </div>
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: tier.colorVar }}
          >
            {tier.label}
          </span>
        </div>
      </td>
    </ScrollRevealRow>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) redirect("/auth/login");

  const params = await searchParams;
  const sortBy = params.sort_by ?? "elo";
  const limit = 10;
  const offset = parseInt(params.offset ?? "0", 10);
  const q = params.q ?? "";

  const [data, top3, me] = await Promise.all([
    fetchLeaderboard(sortBy, limit, offset, q),
    fetchTop3(sortBy),
    fetchMe(token as string),
  ]);

  if (!data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg)" }}
      >
        <p style={{ color: "var(--color-text-secondary)" }}>
          Failed to load leaderboard.
        </p>
      </div>
    );
  }

  const { entries, total, total_global } = data;

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}
    >
      <Sidebar />

      <div className="flex-1 min-h-screen pb-24 overflow-x-hidden">
        <Navbar
          breadcrumbs={[
            { label: "Rankings", href: "/leaderboard" },
            { label: "Global Standings" },
          ]}
        />

        {/* Upgraded Header Banner - Full Width */}
        <LeaderboardHeader me={me} />

        <div className="w-full px-8 py-8">
          {/* Upgraded Filter Bar Controls */}
          <FilterBar me={me} />

          {/* Upgraded Top 3 Horizontal Player Cards */}
          {!q && top3.length >= 3 && <AnimatedPodium top3={top3} />}

          {/* Table list */}
          <ScrollRevealDiv delay={100} className="mt-8">
            <div
              className="overflow-hidden rounded-xl border border-cw-border bg-cw-surface"
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-cw-border bg-cw-surface-2">
                    <th className="py-3.5 pl-4 pr-3 text-left text-[10px] font-black tracking-widest uppercase text-cw-text-tertiary w-16">
                      Place
                    </th>
                    <th className="py-3.5 pr-4 text-left text-[10px] font-black tracking-widest uppercase text-cw-text-tertiary">
                      Player name
                    </th>
                    <th className="py-3.5 pr-4 text-left text-[10px] font-black tracking-widest uppercase text-cw-text-tertiary">
                      Local stats
                    </th>
                    <th className="py-3.5 pr-4 text-left text-[10px] font-black tracking-widest uppercase text-cw-text-tertiary w-32">
                      Winrate
                    </th>
                    <th className="py-3.5 pr-4 text-left text-[10px] font-black tracking-widest uppercase text-cw-text-tertiary">
                      ELO
                    </th>
                    <th className="py-3.5 pr-4 text-left text-[10px] font-black tracking-widest uppercase text-cw-text-tertiary">
                      Tier
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-cw-border bg-cw-surface/40">
                  {entries.map((entry, i) => (
                    <TableRow
                      key={entry.id}
                      entry={entry}
                      isMe={entry.id === me?.id}
                      index={i}
                    />
                  ))}
                </tbody>
              </table>

              <Suspense>
                <Pagination
                  total={total}
                  limit={limit}
                  offset={offset}
                  links={data.links}
                />
              </Suspense>
            </div>
          </ScrollRevealDiv>
        </div>

        {/* Jump to Me sticky bar */}
        {me && me.rank && (
          <JumpToMeBar rank={me.rank} total={total_global ?? total} />
        )}
      </div>
    </div>
  );
}
