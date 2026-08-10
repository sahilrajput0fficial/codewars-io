"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4 text-white">
      <div className="w-10 h-10 rounded-full border-4 border-t-blue-500 border-neutral-800/80 animate-spin" />
      <p className="text-sm text-neutral-400 font-medium tracking-wide">Redirecting to dashboard...</p>
    </div>
  );
}
