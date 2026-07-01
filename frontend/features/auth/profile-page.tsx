"use client";

/**
 * features/auth/profile-page.tsx  (root feature component — AGENTS.md §feature-structure)
 * Orchestrates sub-components and hooks.  No business logic lives here.
 *
 * Component tree:
 *   ProfilePage
 *   ├── EditProfileModal   (components/edit-profile-modal.tsx)
 *   └── <main>
 *       ├── HeroBanner     (inline — pure layout, no logic)
 *       ├── IdentitySection
 *       │   ├── Avatar     (components/avatar.tsx)
 *       │   ├── LiveDot    (components/live-dot.tsx)
 *       │   └── CopyLinkButton / EditProfileButton / ChallengeButton
 *       ├── StatsStrip
 *       │   └── StatChip × 8 (components/stat-chip.tsx)
 *       └── TwoColumnBody
 *           ├── SectionCard (components/section-card.tsx)
 *           │   ├── MatchRow × n (components/match-row.tsx)
 *           │   └── AchievementGrid
 *           └── SectionCard × 3 (right column)
 *               ├── WinRatioRing  (components/win-ratio-ring.tsx)
 *               └── DifficultyBreakdown
 */

import { useEffect, useState }   from "react";
import Link                      from "next/link";
import {
  Trophy,
  Swords,
  Target,
  Zap,
  Clock,
  TrendingUp,
  Award,
  Flame,
  Star,
  ChevronRight,
  Pencil,
  Loader2,
} from "lucide-react";
import { getTier }                from "@/constants/elo-tiers";

// Feature imports (AGENTS.md: services, hooks, components, constants, types)
import type { ProfileUser, RecentMatch } from "./types";
import { DEMO_ACHIEVEMENTS, formatJoinDate, formatDuration } from "./constants";
import { useEditProfile }         from "./hooks/use-edit-profile";
import { EditProfileDrawer }      from "./components/edit-profile-drawer";
import { Avatar }                 from "./components/avatar";
import { LiveDot }                from "./components/live-dot";
import { WinRatioRing }           from "./components/win-ratio-ring";
import { StatChip }               from "./components/stat-chip";
import { MatchRow }               from "./components/match-row";
import { SectionCard }            from "./components/section-card";
import { CopyLinkButton }         from "./components/copy-link-button";
import { fetchUserMatches }       from "./services/auth-service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function winRate(wins: number, played: number) {
  if (played === 0) return 0;
  return Math.round((wins / played) * 100);
}

function mapToRecentMatch(m: any, currentUserId: string): RecentMatch {
  const isP1 = m.player_one.id === currentUserId;
  const opponent = isP1 
    ? (m.player_two || { username: "Bot", avatar_url: null, elo: m.bot_elo || 1200, elo_tiers: "bronze" })
    : m.player_one;

  const rawOpponentTier = opponent.elo_tiers || "bronze";
  const opponent_tier = (rawOpponentTier.charAt(0).toUpperCase() + rawOpponentTier.slice(1).toLowerCase()) as RecentMatch["opponent_tier"];

  const elo_delta = isP1 ? m.p1_elo_delta : m.p2_elo_delta;
  const result = m.winner_id === currentUserId ? "win" : "loss";

  const rawDifficulty = m.difficulty_config?.difficulty || "Medium";
  const problem_difficulty = (rawDifficulty.charAt(0).toUpperCase() + rawDifficulty.slice(1).toLowerCase()) as RecentMatch["problem_difficulty"];

  return {
    id: m.id,
    opponent_username: opponent.username,
    opponent_avatar_url: opponent.avatar_url,
    opponent_elo: opponent.elo,
    opponent_tier,
    result,
    elo_delta,
    problem_title: m.difficulty_config?.title || "1v1 DSA Battle",
    problem_difficulty,
    solved_at: m.ended_at || m.created_at,
    duration_ms: m.ended_at && m.started_at ? (new Date(m.ended_at).getTime() - new Date(m.started_at).getTime()) : 0
  };
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────

export default function ProfilePage({
  isOwnProfile = false,
  initialUser,
}: {
  isOwnProfile?: boolean;
  initialUser?:  ProfileUser;
}) {
  const [user, setUser] = useState<ProfileUser | null>(initialUser || null);
  const [matches, setMatches] = useState<RecentMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [activeTab, setActiveTab] = useState<"All" | "Wins" | "Losses">("All");
  const achievements = DEMO_ACHIEVEMENTS;

  // Keep state synced if page transitions to a new user
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    } else {
      setUser(null);
    }
  }, [initialUser]);

  useEffect(() => {
    if (!user) return;
    const { username, id } = user;
    let active = true;
    async function loadMatches() {
      setLoadingMatches(true);
      const data = await fetchUserMatches(username, 10, 0);
      if (data && active) {
        const mapped = data.matches.map(m => mapToRecentMatch(m, id));
        setMatches(mapped);
      }
      setLoadingMatches(false);
    }
    loadMatches();
    return () => {
      active = false;
    };
  }, [user?.username, user?.id]);

  const filteredMatches = matches.filter((match) => {
    if (activeTab === "Wins") return match.result === "win";
    if (activeTab === "Losses") return match.result === "loss";
    return true;
  });

  const { editOpen, openEdit, closeEdit, handleSaveProfile } = useEditProfile(setUser);

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-cw-bg">
        <Swords className="w-12 h-12 text-cw-text-tertiary mb-4 animate-bounce" />
        <h1 className="text-sm font-black text-cw-text-primary uppercase tracking-widest mb-2">
          Player Not Found
        </h1>
        <p className="text-[10px] text-cw-text-secondary max-w-sm mb-6 uppercase tracking-wider">
          The player profile you are looking for does not exist or has left the arena.
        </p>
        <Link 
          href="/leaderboard" 
          className="inline-flex items-center justify-center px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-fast ease-snap"
          style={{
            background: "var(--color-accent)",
            color: "var(--color-text-on-accent)",
            clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
          }}
        >
          Back to Leaderboard
        </Link>
      </div>
    );
  }

  const tier = getTier(user.elo_tier);
  const wr   = winRate(user.wins, user.matches_played);

  return (
    <>
      <EditProfileDrawer
        open={editOpen}
        onClose={closeEdit}
        displayName={user.display_name}
        bio={user.bio}
        avatarUrl={user.avatar_url}
        bannerUrl={user.banner_url}
        hideOnlineStatus={user.hide_online_status || false}
        showAchievements={user.show_achievements !== false}
        onSave={handleSaveProfile}
      />

      <main
        className="min-h-screen animate-rise-in"
        style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}
      >
        {/* ── Hero Banner ── */}
        <div className="relative h-48 overflow-hidden bg-cw-surface">
          {/* Banner background */}
          {user.banner_url ? (
            <div className="relative w-full h-full">
              <img src={user.banner_url} alt="Profile Banner" className="w-full h-full object-cover" />
              {/* Bottom gradient fade to blend with page background and protect details */}
              <div className="absolute inset-0 bg-gradient-to-t from-cw-bg via-transparent to-black/40" />
            </div>
          ) : (
            <>
              <div className="absolute inset-0" style={{ background: "var(--color-surface)" }} />
              {/* Subtle diagonal texture lines — structural, not decorative glow */}
              <svg className="absolute inset-0 w-full h-full opacity-5" preserveAspectRatio="none">
                <defs>
                  <pattern id="diag" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="40" x2="40" y2="0" stroke="var(--color-text-primary)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#diag)" />
              </svg>
            </>
          )}
          {/* Tier color accent bar at top */}
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: tier.colorVar }} />
        </div>

        {/* ── Profile Identity Section ── */}
        <div className="px-6 md:px-10 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
            {/* Avatar — large with tier border */}
            <Avatar
              username={user.username}
              avatarUrl={user.avatar_url}
              size="w-24 h-24 text-2xl"
              tierColor={tier.colorVar}
            />

            {/* Name, tier, join date */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-cw-text-primary leading-tight">
                  {user.display_name}
                </h1>
                {user.is_online && !user.hide_online_status && (
                  <div className="flex items-center gap-1.5">
                    <LiveDot />
                    <span className="text-[10px] font-semibold text-cw-success uppercase tracking-wider">
                      Online
                    </span>
                  </div>
                )}
                {/* Tier badge — angular per DESIGN.md §7 */}
                <span
                  className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-cw-bg"
                  style={{
                    background: tier.colorVar,
                    clipPath:   "polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%)",
                  }}
                >
                  {tier.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-cw-text-tertiary font-medium">
                @{user.username} · Joined {formatJoinDate(user.joined_at)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pb-1">
              <CopyLinkButton />
              {isOwnProfile ? (
                /* Edit Profile — own profile view */
                <button
                  id="profile-edit-btn"
                  onClick={openEdit}
                  className="flex items-center gap-1.5 px-4 h-8 text-xs font-bold border border-cw-border text-cw-text-secondary hover:text-cw-text-primary hover:border-cw-text-tertiary rounded-lg transition-colors duration-fast ease-snap"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              ) : (
                /* Challenge CTA — viewing someone else's profile (primary, angular) */
                <button
                  id="profile-find-battle"
                  className="flex items-center gap-1.5 px-4 h-8 text-xs font-bold transition-colors duration-fast ease-snap hover:opacity-90"
                  style={{
                    background: "var(--color-accent)",
                    color:      "var(--color-text-on-accent)",
                    clipPath:   "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
                  }}
                >
                  <Swords className="w-3.5 h-3.5" />
                  Challenge
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          <p className="mt-3 text-sm max-w-lg" style={{ color: "var(--color-text-secondary)" }}>
            {user.bio}
          </p>
        </div>

        {/* ── Stats Strip ── */}
        <div className="mt-6 mx-6 md:mx-10 rounded-xl border border-cw-border bg-cw-surface overflow-hidden">
          <div className="flex divide-x divide-cw-border overflow-x-auto">
            <StatChip label="ELO"      value={user.elo.toLocaleString()} accent />
            <StatChip label="Rank"     value={`#${user.rank}`} />
            <StatChip label="Matches"  value={user.matches_played} />
            <StatChip label="Wins"     value={user.wins} />
            <StatChip label="Losses"   value={user.losses} />
            <StatChip label="Win Rate" value={`${wr}%`} />
            <StatChip label="Avg Time" value={formatDuration(user.avg_solve_time_ms)} />
            <StatChip label="Streak"   value={`${user.current_streak}🔥`} />
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div className="mt-6 px-6 md:px-10 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

          {/* ── LEFT: Recent Matches + Achievements ── */}
          <div className="flex flex-col gap-6">
            <SectionCard title="Recent Matches" icon={Swords}>
              {/* Filter tabs */}
              <div className="flex gap-6 mb-4 border-b border-cw-border -mx-4 px-4">
                {(["All", "Wins", "Losses"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="pb-2.5 text-xs font-semibold uppercase tracking-widest transition-colors duration-fast ease-snap"
                    style={{
                      color:        tab === activeTab ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                      borderBottom: tab === activeTab ? "2px solid var(--color-accent)"    : "2px solid transparent",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {/* Match list */}
              <div className="-mx-4 px-4">
                {loadingMatches ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-cw-accent animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-cw-text-tertiary">
                      Loading Matches...
                    </span>
                  </div>
                ) : filteredMatches.length > 0 ? (
                  filteredMatches.map((match, i) => (
                    <MatchRow key={match.id} match={match} index={i} />
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-3 border border-dashed border-cw-border rounded-lg bg-cw-surface-2 animate-rise-in">
                    <Swords className="w-8 h-8 text-cw-text-tertiary" />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-cw-text-primary">No Battles Fought Yet</span>
                      <span className="text-[10px] text-cw-text-tertiary max-w-[240px]">
                        Step into the arena, prove your skills in DSA battles, and climb the ELO ladder.
                      </span>
                    </div>
                    <Link
                      href="/play"
                      className="mt-2 inline-flex items-center justify-center px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-fast ease-snap"
                      style={{
                        background: "var(--color-accent)",
                        color: "var(--color-text-on-accent)",
                        clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
                      }}
                    >
                      Find a Match
                    </Link>
                  </div>
                )}
              </div>
              {matches.length > 0 && (
                <button className="mt-4 w-full flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-cw-text-tertiary hover:text-cw-text-secondary transition-colors duration-fast ease-snap">
                  View All Matches
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </SectionCard>

            {user.show_achievements !== false && (
              <SectionCard title="Achievements" icon={Award}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {achievements.map((ach, i) => (
                    <div
                      key={ach.id}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-cw-border bg-cw-surface-2 text-center animate-rise-in"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <span className="text-2xl">{ach.icon}</span>
                      <span className="text-[11px] font-bold text-cw-text-primary leading-tight">{ach.label}</span>
                      <span className="text-[10px] text-cw-text-tertiary leading-tight">{ach.description}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {/* ── RIGHT: Competitive Stats ── */}
          <div className="flex flex-col gap-6">
            {/* Competitive Overview */}
            <SectionCard title="Competitive Overview" icon={Target}>
              <div className="flex items-center gap-4 mb-4">
                <WinRatioRing wins={user.wins} losses={user.losses} />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--color-success)" }} />
                    <span className="text-xs text-cw-text-secondary">
                      Wins — <span className="font-mono font-bold text-cw-text-primary">{user.wins}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--color-danger)", opacity: 0.6 }} />
                    <span className="text-xs text-cw-text-secondary">
                      Losses — <span className="font-mono font-bold text-cw-text-primary">{user.losses}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Trophy className="w-3.5 h-3.5" style={{ color: tier.colorVar }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: tier.colorVar }}>
                      {tier.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* W/L record pill — angular */}
              <div
                className="flex items-center justify-between px-4 py-2.5 rounded"
                style={{ background: "var(--color-surface-2)", clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-cw-text-primary tabular-nums">{user.wins}W</span>
                  <span className="text-cw-text-tertiary text-xs">/</span>
                  <span className="font-mono text-sm font-black text-cw-text-secondary tabular-nums">{user.losses}L</span>
                </div>
                <span className="font-mono text-xs font-bold tabular-nums" style={{ color: "var(--color-success)" }}>
                  {wr}% WR
                </span>
              </div>
            </SectionCard>

            {/* Performance Stats */}
            <SectionCard title="Performance" icon={TrendingUp}>
              <div className="flex flex-col gap-3">
                {[
                  { icon: Star,  label: "ELO Rating",     value: user.elo.toLocaleString(), color: tier.colorVar },
                  { icon: Trophy, label: "Global Rank",   value: `#${user.rank}`,           color: "var(--color-text-primary)" },
                  { icon: Clock,  label: "Avg Solve Time",value: formatDuration(user.avg_solve_time_ms), color: "var(--color-text-primary)" },
                  { icon: Zap,    label: "Problems Solved",value: String(user.problems_solved), color: "var(--color-text-primary)" },
                  { icon: Flame,  label: "Best Streak",   value: `${user.longest_win_streak} W`, color: "var(--color-text-primary)" },
                  { icon: Flame,  label: "Current Streak",value: `${user.current_streak} W 🔥`, color: "var(--color-warning)" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-cw-text-tertiary" />
                      <span className="text-xs text-cw-text-secondary">{label}</span>
                    </div>
                    <span className="font-mono text-sm font-bold tabular-nums" style={{ color }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Difficulty breakdown */}
            <SectionCard title="Match Difficulty" icon={Target}>
              <div className="flex flex-col gap-3">
                {([
                  { label: "Easy",   color: "var(--color-success)" },
                  { label: "Medium", color: "var(--color-warning)" },
                  { label: "Hard",   color: "var(--color-danger)"  },
                ] as const).map(({ label, color }) => {
                  const w     = matches.filter((m) => m.problem_difficulty === label && m.result === "win").length;
                  const total = matches.filter((m) => m.problem_difficulty === label).length;
                  const pct   = total === 0 ? 0 : Math.round((w / total) * 100);
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold" style={{ color }}>{label}</span>
                        <span className="font-mono text-xs text-cw-text-secondary tabular-nums">{w}/{total} · {pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-cw-surface-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-[transform] duration-slow ease-settle origin-left"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    </>
  );
}
