import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Trophy, Code, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col items-center relative overflow-hidden font-sans">
      {/* Background neon glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="w-full flex justify-center border-b border-neutral-900 bg-neutral-950/40 backdrop-blur-md h-16 sticky top-0 z-50">
        <div className="w-full max-w-5xl flex justify-between items-center px-6">
          <div className="flex items-center gap-3 font-semibold">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center shadow-md shadow-blue-500/20">
              <span className="font-bold text-sm text-white">C</span>
            </div>
            <span className="text-md tracking-wider bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
              CodeWars.IO
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Suspense fallback={<div className="w-20 h-8 bg-neutral-900 rounded-md animate-pulse" />}>
              <AuthButton />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 space-y-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-xs text-blue-400 font-medium tracking-wide">
          <Zap className="w-3.5 h-3.5" /> Beta Arena Now Active
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-neutral-100 max-w-3xl">
          The Ultimate Real-Time <br />
          <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
            Competitive Coding Arena
          </span>
        </h1>

        <p className="text-neutral-400 text-md md:text-lg max-w-2xl leading-relaxed">
          Challenge your peers, solve complex algorithms under pressure, increase your ELO rank, and claim your place on the global leaderboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/10 px-8 h-12 rounded-xl transition-all">
            <Link href="/auth/login" className="flex items-center gap-2">
              Enter the Arena <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-neutral-800 bg-neutral-900/20 text-neutral-200 hover:bg-neutral-900 hover:text-white px-8 h-12 rounded-xl transition-all">
            <Link href="#features">View Features</Link>
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="w-full max-w-5xl px-6 py-16 md:py-24 border-t border-neutral-900 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-neutral-200">Head-to-Head</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Match with opponents of similar skill in real-time. Code fast, debug smart, and submit to win.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-neutral-200">ELO Rating System</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Track your rank progress using a standardized competitive ELO rating engine after every duel.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-neutral-200">Global Leaderboard</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Compare stats, review history, and climb ranks to showcase your competitive programming dominance.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full flex items-center justify-between max-w-5xl px-6 border-t border-neutral-900 text-xs text-neutral-500 py-10 relative z-10">
        <p>© 2026 CodeWars.IO. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
        </div>
      </footer>
    </main>
  );
}
