import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Trophy, Medal } from "lucide-react";

import { BASE_URL } from "@/proxy";
import { getTier } from "@/constants/elo-tiers";
import {
  LeaderboardSearch,
  SortFilter,
  Pagination,
  JumpToMeBar,
} from "./controls";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  id: string;
  username: string;
  email: string;
  elo: number;
  wins: number;
  losses: number;
  matches_played: number;
  streak_days: number;
  avatar_url: string | null;
  rank: number;
  elo_tier: string;
}

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

/**
 * Fetch the current user's leaderboard rank.
 *
 * Passes the JWT as a Cookie header so the backend's `get_current_user`
 * dependency can verify the session server-side.
 *
 * Returns null silently on any error so the page still renders without
 * the personal standings bar — not a blocking failure.
 */
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

// ─── Avatar initials ──────────────────────────────────────────────────────────

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

// ─── Avatar Component ─────────────────────────────────────────────────────────

function Avatar({
  user,
  size = "md",
  ring,
}: {
  user: LeaderboardEntry;
  size?: "sm" | "md" | "lg";
  ring?: string;
}) {
  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-lg",
  };

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold font-mono flex-shrink-0`}
      style={{
        background: "var(--color-surface-2)",
        color: "var(--color-text-secondary)",
        ...(ring ? { boxShadow: `0 0 0 2px ${ring}` } : {}),
      }}
    >
      {user.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar_url}
          alt={user.username}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        getInitials(user.username)
      )}
    </div>
  );
}

// ─── Podium — #1 (featured, horizontal, center) ───────────────────────────────

function PodiumCenter({ user }: { user: LeaderboardEntry }) {
  const tier = getTier(user.elo_tier);
  return (
    <div
      id="podium-rank-1"
      className="relative flex-1 p-6 flex gap-6 items-center self-stretch"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-tier-gold)",
        clipPath:
          "polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)",
      }}
    >
      {/* Trophy top-right */}
      <Trophy
        className="absolute top-3 right-4 w-5 h-5 opacity-60"
        style={{ color: "var(--color-tier-gold)" }}
      />

      {/* Avatar + champion badge */}
      <div className="relative flex-shrink-0">
        <Avatar user={user} size="lg" ring="var(--color-tier-gold)" />
        <div
          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 text-[9px] font-black tracking-widest"
          style={{
            background: "var(--color-tier-gold)",
            color: "var(--color-bg)",
            clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)",
          }}
        >
          CHAMPION
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 min-w-0">
        <p
          className="text-[10px] font-black tracking-widest leading-tight"
          style={{ color: "var(--color-tier-gold)" }}
        >
          RANK #1 WORLDWIDE
        </p>
        <h3
          className="text-lg font-bold truncate"
          style={{ color: "var(--color-text-primary)" }}
        >
          {user.username}
        </h3>
        <div className="flex items-baseline gap-3 mt-0.5">
          <div className="flex items-center gap-1">
            <span
              className="text-2xl font-mono font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {user.elo.toLocaleString()}
            </span>
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              ELO
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="text-2xl font-mono font-bold"
              style={{ color: "var(--color-success)" }}
            >
              {user.wins}
            </span>
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              WINS
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="text-2xl font-mono font-bold"
              style={{ color: "var(--color-error)" }}
            >
              {user.matches_played}
            </span>
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              MATCHES
            </span>
          </div>
        </div>
        {/* Tier badge */}
        <span
          className="mt-1 self-start px-2 py-0.5 text-[10px] font-semibold rounded capitalize"
          style={{
            color: tier.colorVar,
            border: `1px solid ${tier.colorVar}`,
          }}
        >
          {tier.label}
        </span>
        
      </div>
    </div>
  );
}

// ─── Podium — #2 / #3 (smaller vertical cards) ───────────────────────────────

function PodiumSide({
  user,
  position,
}: {
  user: LeaderboardEntry;
  position: 2 | 3;
}) {
  const ringColor = getTier(user.elo_tier).colorVar;
  const label = getTier(user.elo_tier).label;
  const Icon  = position === 2 ? Trophy : Medal;

  return (
    <div
      id={`podium-rank-${position}`}
      className="flex flex-col items-center gap-3 px-5 py-4 w-44"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
      }}
    >
      {/* Rank label */}
      <div
        className="flex items-center gap-1 text-[10px] font-bold tracking-widest self-end"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        <Icon className="w-3 h-3" style={{ color: ringColor }} />
        #{position}
      </div>

      <Avatar user={user} size="md" ring={ringColor} />

      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {user.username}
        </p>
        <p className="text-xs font-mono mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
          {user.elo.toLocaleString()} ELO
        </p>
      </div>

      <span
        className="text-[10px] font-semibold px-2 py-0.5"
        style={{
          color: ringColor,
          border: `1px solid ${ringColor}`,
          borderRadius: "4px",
        }}
      >
        {label} Prestige
      </span>
    </div>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function TableRow({
  entry,
  isMe,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
}) {
  const tier = getTier(entry.elo_tier);

  const borderStyle = isMe
    ? {
        borderTop: "2px solid var(--color-accent)",
        borderBottom: "2px solid var(--color-accent)",
      }
    : undefined;

  return (
    <tr
      id={isMe ? "my-row" : undefined}
      className="group transition-colors"
      style={{
        background: isMe ? "var(--color-accent-muted)" : undefined,
      }}
    >
      {/* Rank */}
      <td
        className="py-3.5 pl-4 pr-3 w-20"
        style={borderStyle}
      >
        <span
          className="font-mono text-sm font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {entry.rank}
        </span>
      </td>

      {/* Warrior */}
      <td
        className="py-3.5 pr-4"
        style={borderStyle}
      >
        <div className="flex items-center gap-3">
          <Avatar user={entry} size="sm" />
          <div>
            <p
              className="text-sm font-semibold flex items-center gap-1.5"
              style={{ color: "var(--color-text-primary)" }}
            >
              {entry.username}
              {isMe && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: "var(--color-accent)",
                    color: "var(--color-text-on-accent)",
                  }}
                >
                  YOU
                </span>
              )}
            </p>
            <p className="text-xs font-mono mt-0.5" style={{ color: tier.colorVar }}>
              {tier.label} tier
            </p>
          </div>
        </div>
      </td>

      {/* ELO */}
      <td
        className="py-3.5 pr-4 text-right hidden sm:table-cell"
        style={borderStyle}
      >
        <span
          className="font-mono text-sm font-semibold"
          style={{ color: tier.colorVar }}
        >
          {entry.elo.toLocaleString()}
        </span>
      </td>

      {/* Wins */}
      <td
        className="py-3.5 pr-4 text-right hidden md:table-cell"
        style={borderStyle}
      >
        <span
          className="font-mono text-sm"
          style={{ color: "var(--color-text-primary)" }}
        >
          {entry.wins.toLocaleString()}
        </span>
      </td>

      {/* Matches */}
      <td
        className="py-3.5 pr-4 text-right hidden md:table-cell"
        style={borderStyle}
      >
        <span
          className="font-mono text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {entry.matches_played.toLocaleString()}
        </span>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  // Auth — redirect() throws, so `token` is string below this guard
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) redirect("/auth/login");
  const params = await searchParams;
  const sortBy = params.sort_by ?? "elo";
  const limit  = 10;
  const offset = parseInt(params.offset ?? "0", 10);
  const q      = params.q ?? "";

  // Parallel fetches — fetchMe failure is non-blocking (returns null)
  const [data, top3, me] = await Promise.all([
    fetchLeaderboard(sortBy, limit, offset, q),
    fetchTop3(sortBy),
    fetchMe(token as string), // `token` is narrowed to string by redirect() guard
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
  const meTier = me ? getTier(me.elo_tier) : null;

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}
    >
      {/* ── Collapsible Left Sidebar ───────────────────────────────────── */}
      <Sidebar />

      {/* ── Main Content Area ──────────────────────────────────────────── */}
      <div className="flex-1 min-h-screen pb-20 overflow-x-hidden">
        {/* ── Top Navbar ────────────────────────────────────────────────── */}
        <Navbar
          breadcrumbs={[
            { label: "Rankings", href: "/leaderboard" },
            { label: "Global Standings" },
          ]}
        />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p
              className="text-xs font-bold tracking-widest mb-1"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              GLOBAL STANDINGS
            </p>
            <h1
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              World Leaderboard
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              Total Warriors
            </p>
            <p
              className="text-2xl font-mono font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {(total_global ?? total).toLocaleString()}
            </p>
          </div>
        </div>

        {/* ── Podium Top 3 ──────────────────────────────────────────────── */}
        {!q && top3.length >= 3 && (
          <div className="flex items-end gap-3 mb-8">
            {/* #2 — left, slightly shorter */}
            <div className="pb-4">
              <PodiumSide user={top3[1]} position={2} />
            </div>
            {/* #1 — center, tallest, horizontal featured card */}
            <PodiumCenter user={top3[0]} />
            {/* #3 — right, shortest */}
            <div>
              <PodiumSide user={top3[2]} position={3} />
            </div>
          </div>
        )}

        {/* ── Personal Standings Bar (replacing old jump/ellipsis layout) ─ */}
        {me && (
          <div
            id="personal-standings-bar"
            className="flex items-center justify-between p-4 mb-8 rounded border"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              borderLeft: "3px solid var(--color-accent)",
            }}
          >
            <div className="flex items-center gap-3">
              <Avatar user={me} size="md" />
              <div>
                <p
                  className="text-sm font-semibold flex items-center gap-1.5"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {me.username}
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: "var(--color-accent)",
                      color: "var(--color-text-on-accent)",
                    }}
                  >
                    YOU
                  </span>
                </p>
                <p
                  className="text-xs font-mono mt-0.5"
                  style={{ color: meTier?.colorVar }}
                >
                  {meTier?.label} tier
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 pr-2">
              <div className="text-left">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Rank
                </p>
                <p
                  className="text-lg font-mono font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  #{me.rank.toLocaleString()}
                </p>
              </div>
              <div className="text-left">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  ELO
                </p>
                <p
                  className="text-lg font-mono font-bold"
                  style={{ color: meTier?.colorVar }}
                >
                  {me.elo.toLocaleString()}
                </p>
              </div>
              <div className="text-left">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Wins
                </p>
                <p
                  className="text-lg font-mono font-bold"
                  style={{ color: "var(--color-success)" }}
                >
                  {me.wins.toLocaleString()}
                </p>
              </div>
              <div className="text-left">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Losses
                </p>
                <p
                  className="text-lg font-mono font-bold"
                  style={{ color: "var(--color-danger)" }}
                >
                  {me.losses.toLocaleString()}
                </p>
              </div>
              <div className="text-left hidden sm:block">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Matches
                </p>
                <p
                  className="text-lg font-mono font-bold"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {me.matches_played.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-4">
          <Suspense>
            <LeaderboardSearch />
          </Suspense>
          <Suspense>
            <SortFilter />
          </Suspense>
        </div>

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <div
          className="rounded overflow-hidden border"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
        >
          <table className="w-full border-collapse">
            {/* Header */}
            <thead>
              <tr
                style={{
                  background: "var(--color-surface-2)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <th
                  className="py-2.5 pl-4 pr-3 text-left text-[10px] font-bold tracking-widest w-20"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  RANK
                </th>
                <th
                  className="py-2.5 pr-4 text-left text-[10px] font-bold tracking-widest"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  WARRIOR
                </th>
                <th
                  className="py-2.5 pr-4 text-right text-[10px] font-bold tracking-widest hidden sm:table-cell"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  ELO
                </th>
                <th
                  className="py-2.5 pr-4 text-right text-[10px] font-bold tracking-widest hidden md:table-cell"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  WINS
                </th>
                <th
                  className="py-2.5 pr-4 text-right text-[10px] font-bold tracking-widest hidden md:table-cell"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  MATCHES
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
              {entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  entry={entry}
                  isMe={entry.id === me?.id}
                />
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <Suspense>
            <Pagination
              total={total}
              limit={limit}
              offset={offset}
              links={data.links}
            />
          </Suspense>
        </div>
      </div>

      {/* ── Jump to Me sticky bar ──────────────────────────────────────── */}
      {me && me.rank && (
        <JumpToMeBar rank={me.rank} total={total_global ?? total} />
      )}
      </div>
    </div>
  );
}
