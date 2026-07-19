import { cookies } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import ProfilePage from "@/features/auth/profile-page";
import { fetchProfile, fetchMyProfile } from "@/features/auth";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Forward the full cookie header to let FastAPI validate the Supabase session.
  // This includes access_token, refresh_token, and any other cookies the proxy
  // middleware may have set — more robust than extracting a single cookie value.
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  // Fetch profiles in parallel to avoid network waterfalls
  const [fetchedUser, myUser] = await Promise.all([
    fetchProfile(username),
    fetchMyProfile(cookieHeader),
  ]);

  const isSelf = !!(myUser && myUser.username.toLowerCase() === username.toLowerCase());

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
            { label: username },
          ]}
        />

        <ProfilePage
          isOwnProfile={isSelf}
          initialUser={fetchedUser || undefined}
        />
      </div>
    </div>
  );
}


