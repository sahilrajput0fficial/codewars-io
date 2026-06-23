export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BASE_URL } from "@/proxy";
import { LogoutButton } from "@/components/logout-button";

interface UserProfile {
  id: string;
  username: string;
  email: string;
}

async function getUserProfile(): Promise<UserProfile> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  
  if (!token) {
    redirect("/auth/login");
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        Cookie: `access_token=${token}`
      },
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      redirect("/auth/login");
    }

    return await res.json();
  } catch (err) {
    console.error("Error fetching user profile:", err);
    redirect("/auth/login");
  }
}

export default async function DashboardPage() {
  const user = await getUserProfile();

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col items-center justify-center gap-6 font-sans">
      <div className="p-8 rounded-[2rem] border border-neutral-800 bg-[#0a0a0c] max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <h1 className="text-2xl font-bold text-neutral-100">Hello, {user.username}!</h1>
          <p className="text-xs text-neutral-400">Welcome to your CodeWars dashboard.</p>
        </div>

        <div className="pt-2 relative z-10 w-full">
          <LogoutButton className="w-full" />
        </div>
      </div>
    </div>
  );
}

