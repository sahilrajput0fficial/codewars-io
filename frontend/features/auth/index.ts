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
export { fetchProfile, fetchMyProfile, updateProfile } from "./services/auth-service";

// Hooks
export { useEditProfile } from "./hooks/use-edit-profile";

// Components
export { Avatar }              from "./components/avatar";
export { LiveDot }             from "./components/live-dot";
export { WinRatioRing }        from "./components/win-ratio-ring";
export { StatChip }            from "./components/stat-chip";
export { DifficultyLabel }     from "./components/difficulty-label";
export { MatchRow }            from "./components/match-row";
export { SectionCard }         from "./components/section-card";
export { CopyLinkButton }      from "./components/copy-link-button";
export { EditProfileDrawer }   from "./components/edit-profile-drawer";
export { ProfileSkeleton }     from "./components/profile-skeleton";

// Root feature component
export { default as ProfilePage } from "./profile-page";
