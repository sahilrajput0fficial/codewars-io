"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DuelInviteRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const code = (typeof params.code === "string" ? params.code : Array.isArray(params.code) ? params.code[0] : "").toUpperCase();

  useEffect(() => {
    if (code) {
      router.replace(`/duel/${code}`);
    }
  }, [code, router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-neutral-400 font-mono">
      <Loader2 className="h-6 w-6 animate-spin text-red-500 mr-3" />
      CONNECTING TO DUEL LOBBY...
    </div>
  );
}
