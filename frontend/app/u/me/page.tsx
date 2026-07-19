import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import ProfilePage from "@/features/auth/profile-page";
import { fetchMyProfile } from "@/features/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "My Profile — CodeWars.IO",
  description: "Your CodeWars.IO competitive coding profile, ELO rating, match history, and achievements.",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MyProfilePage() {
  // Use the Supabase server client to check session — this correctly validates
  // the full session (not just the raw access_token cookie), honouring token
  // refreshes that the proxy middleware performed.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Forward the full cookie header to FastAPI so it can validate the JWT
  // (access_token, refresh_token, and any other Supabase cookies are included).
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const profile = await fetchMyProfile(cookieHeader);
  if (!profile) {
    redirect("/auth/login");
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
            { label: profile.username },
            { label: "My Profile" },
          ]}
        />

        {/* isOwnProfile=true → shows Edit Profile button instead of Challenge */}
        <ProfilePage
          isOwnProfile={true}
          initialUser={profile}
        />
      </div>
    </div>
  );
}
