import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import ProfilePage from "@/features/auth/profile-page";
import { fetchMyProfile } from "@/features/auth";
import { redirect } from "next/navigation";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "My Profile — CodeWars.IO",
  description: "Your CodeWars.IO competitive coding profile, ELO rating, match history, and achievements.",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MyProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  
  if (!token) {
    redirect("/login");
  }

  // Fetch logged-in user's profile from the backend
  const user = await fetchMyProfile(`access_token=${token}`);
  if (!user) {
    redirect("/login");
  }

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
            { label: user.username },
            { label: "My Profile" },
          ]}
        />

        {/* isOwnProfile=true → shows Edit Profile button instead of Challenge */}
        <ProfilePage 
          isOwnProfile={true} 
          initialUser={user} 
        />
      </div>
    </div>
  );
}

