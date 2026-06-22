"use client"

import { useEffect } from "react"
import { supabase } from "@/app/utility/supabase"
import { useRouter } from "next/navigation"
import { BASE_URL } from "@/proxy"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return

      try {
        const res = await fetch(`${BASE_URL}/auth/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ access_token: session.access_token }),
        })

        if (res.ok) {
          router.push("/dashboard")
        } else {
          const errorData = await res.json()
          console.error("Exchange error:", errorData)
          router.push(`/auth/login?error=${encodeURIComponent(errorData.detail || "Authentication exchange failed")}`)
        }
      } catch (err) {
        console.error("Error during session exchange:", err)
        router.push("/auth/login?error=Failed to sync session with backend")
      }
    })
  }, [router])

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4 text-white">
      <div className="w-10 h-10 rounded-full border-4 border-t-blue-500 border-neutral-800/80 animate-spin" />
      <p className="text-sm text-neutral-400 font-medium tracking-wide">Syncing session with database...</p>
    </div>
  )
}
