/**
 * features/auth/index.ts
 * Barrel re-export — consumers import from @/features/auth.
 *
 * AGENTS.md: each feature must expose an index.ts barrel.
 */

// Types
export type { ProfileUser, RecentMatch, ProfileAchievement, EditProfilePayload } from "./types";

// Constants & helpers
export {
  DEMO_ACHIEVEMENTS,
  formatJoinDate,
  formatDuration,
  formatRelativeTime,
} from "./constants";

// Services
export { fetchProfile, fetchMyProfile, updateProfile, fetchEloHistory } from "./services/auth-service";

// Hooks
export { useEditProfile } from "./hooks/use-edit-profile";

// Components
export { Avatar }              from "./components/avatar";
export { StatChip }            from "./components/stat-chip";
export { MatchRow }            from "./components/match-row";
export { SectionCard }         from "./components/section-card";
export { CopyLinkButton }      from "./components/copy-link-button";
export { EditProfileDrawer }   from "./components/edit-profile-drawer";
export { ProfileSkeleton }     from "./components/profile-skeleton";
export { EloHistoryChart }     from "./components/elo-history-chart";
export type { EloDataPoint }   from "./components/elo-history-chart";

// Root feature component
export { default as ProfilePage } from "./profile-page";
