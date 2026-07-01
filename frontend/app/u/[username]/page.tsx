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
  
  // 1. Initiate cookies and token access
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  // 2. Fetch profiles in parallel to avoid network waterfalls
  const fetchedUserPromise = fetchProfile(username);
  const myUserPromise = token ? fetchMyProfile(`access_token=${token}`) : Promise.resolve(null);

  const [fetchedUser, myUser] = await Promise.all([
    fetchedUserPromise,
    myUserPromise
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

