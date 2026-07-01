import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { ProfileSkeleton } from "@/features/auth";

export default function UserProfileLoading() {
  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}
    >
      <Sidebar />

      <div className="flex-1 min-h-screen overflow-x-hidden">
        <Navbar
          breadcrumbs={[
            { label: "Players", href: "/leaderboard" },
            { label: "Loading..." },
          ]}
        />

        <ProfileSkeleton />
      </div>
    </div>
  );
}
