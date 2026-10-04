"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BASE_URL, apiFetch } from "@/lib/api-client";
import { useUserStore } from "@/stores/user-store";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();

  const logout = async () => {
    // 1. Call FastAPI backend logout to delete the access_token and refresh_token cookies
    try {
      await apiFetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Backend logout failed:", err);
    }

    // 2. Clear client-side store
    useUserStore.getState().clear();

    // 3. Redirect to login page
    router.push("/auth/login");
  };

  return (
    <Button 
      onClick={logout} 
      variant="outline" 
      className={`border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:bg-neutral-900 hover:text-white rounded-xl h-10 transition-colors flex items-center justify-center gap-2 px-4 ${className || ""}`}
    >
      <LogOut className="w-4 h-4" /> Sign Out
    </Button>
  );
}

