"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { 
  Swords, 
  Trophy, 
  Terminal, 
  Shield, 
  Zap, 
  Clock, 
  ChevronRight, 
  Users, 
  Activity, 
  CheckCircle2, 
  Laptop, 
  Gauge, 
  Flame,
  ArrowRight
} from 'lucide-react';

// LiveDot component matching DESIGN.md Section 10.2
export function LiveDot() {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full rounded-full bg-cw-success animate-ring-ping" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cw-success animate-pulse-live" />
    </span>
  );
}

export default function Home(): React.ReactElement {
  // ── States for Live Stats simulation (DESIGN.md Section 10.6) ──
  const [playerCount, setPlayerCount] = useState(1482);
  const [matchCount, setMatchCount] = useState(94);
  const [solutionCount, setSolutionCount] = useState(307249);
  
  const [tickPlayers, setTickPlayers] = useState(false);
  const [tickMatches, setTickMatches] = useState(false);
  const [tickSolutions, setTickSolutions] = useState(false);

  useEffect(() => {
    const statsInterval = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.3) {
        setPlayerCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
        setTickPlayers(true);
        setTimeout(() => setTickPlayers(false), 150);
      } else if (rand < 0.6) {
        setMatchCount(prev => Math.max(10, prev + (Math.random() > 0.5 ? 1 : -1)));
        setTickMatches(true);
        setTimeout(() => setTickMatches(false), 150);
      } else {
        setSolutionCount(prev => prev + Math.floor(Math.random() * 2) + 1);
        setTickSolutions(true);
        setTimeout(() => setTickSolutions(false), 150);
      }
    }, 4000);
    return () => clearInterval(statsInterval);
  }, []);

  // ── States for Arena Simulator (DESIGN.md Section 10.3 & 10.4) ──
  const [timeLeft, setTimeLeft] = useState(117); // 1:57 (critical under 2m)
  const [timeTick, setTimeTick] = useState(false);
  const [opponentProgress, setOpponentProgress] = useState([true, true, false, false]);
  const [flashOpponent, setFlashOpponent] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return 117;
        return prev - 1;
      });
      setTimeTick(true);
      setTimeout(() => setTimeTick(false), 300);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const opponentInterval = setInterval(() => {
      setOpponentProgress(prev => {
        // Toggle steps 2 and 3
        const next = [...prev];
        if (next[3]) {
          next[2] = false;
          next[3] = false;
        } else if (next[2]) {
          next[3] = true;
        } else {
          next[2] = true;
        }
        setFlashOpponent(true);
        setTimeout(() => setFlashOpponent(false), 500);
        return next;
      });
    }, 6000);
    return () => clearInterval(opponentInterval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Rank Tiers definition (DESIGN.md Section 5) ──
  const tiers = [
    { 
      name: 'BRONZE', 
      range: '< 1000 ELO', 
      borderClass: 'border-tier-bronze', 
      textClass: 'text-tier-bronze', 
      desc: 'The starting arena. Learn the core mechanics of real-time algorithmic battles under pressure.' 
    },
    { 
      name: 'SILVER', 
      range: '1000 - 1499 ELO', 
      borderClass: 'border-tier-silver', 
      textClass: 'text-tier-silver', 
      desc: 'Fierce competition starts here. Code optimization, edge-case analysis, and typing speed become critical.' 
    },
    { 
      name: 'GOLD', 
      range: '1500 - 1999 ELO', 
      borderClass: 'border-tier-gold', 
      textClass: 'text-tier-gold', 
      desc: 'Elite bracket. Advanced data structures, dynamic programming, and visual tracking skills are required.' 
    },
    { 
      name: 'DIAMOND', 
      range: '2000+ ELO', 
      borderClass: 'border-tier-diamond', 
      textClass: 'text-tier-diamond', 
      desc: 'The grandmaster summit. Fight for supremacy in the top 1% against world-class algorithmic competitors.' 
    },
  ];

  return (
    <div className="min-h-screen bg-cw-bg text-cw-text-primary flex flex-col selection:bg-cw-accent selection:text-cw-text-on-accent" id="landing-page-root">
      
      {/* ── HEADER (Calm UI - Rounded corners) ── */}
      <header className="sticky top-0 z-50 w-full border-b border-cw-border bg-cw-bg/85 backdrop-blur-md" id="header-nav">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-1.5 group" id="logo-link">
              <span className="text-xl font-extrabold tracking-wider font-sans text-cw-text-primary">
                CODE<span className="text-cw-accent">WARS</span>
              </span>
              <span className="text-xl font-extrabold font-mono text-cw-accent transition-transform duration-base ease-snap group-hover:translate-x-0.5">
                &gt;
              </span>
              <span className="text-sm font-mono text-cw-text-secondary bg-cw-surface px-1.5 py-0.5 border border-cw-border rounded ml-2">
                .IO
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6" id="main-navigation">
              <Link href="/leaderboard" className="text-sm font-medium text-cw-text-secondary hover:text-cw-text-primary transition-colors duration-fast ease-snap">
                Leaderboard
              </Link>
              <Link href="/problems" className="text-sm font-medium text-cw-text-secondary hover:text-cw-text-primary transition-colors duration-fast ease-snap">
                Problems
              </Link>
              <Link href="/play" className="text-sm font-medium text-cw-text-secondary hover:text-cw-text-primary transition-colors duration-fast ease-snap">
                Arena
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            
            <Link 
              href="/auth/login" 
              className="hidden sm:inline-flex text-sm font-medium text-cw-text-secondary hover:text-cw-text-primary transition-colors duration-fast ease-snap"
            >
              Sign In
            </Link>

            {/* Competitive CTA — Clip Corner per DESIGN.md §7 */}
            <Link 
              href="/auth/login?signup=true"
              className="px-5 h-9 bg-cw-cw-accent text-cw-cw-text-on-accent bg-cw-accent hover:bg-cw-accent-hover text-sm font-bold flex items-center justify-center transition-colors duration-base ease-snap clip-corner-all"
              id="cta-enter-arena"
            >
              ENTER ARENA
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center py-20 px-6 overflow-hidden border-b border-cw-border" id="hero-section">
        {/* Premium static dot grid background */}
        <div 
          className="absolute inset-0 z-0 opacity-40 pointer-events-none" 
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-border) 2px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
          id="hero-background-grid"
        />

        <div className="max-w-4xl mx-auto text-center z-10 relative pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cw-surface border border-cw-border text-xs font-mono tracking-wider text-cw-text-secondary mb-6 clip-corner-br">
            <span className="w-1.5 h-1.5 rounded-full bg-cw-accent animate-pulse" />
            SEASON 1 MATCHMAKING NOW ACTIVE
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] font-sans text-cw-text-primary" id="hero-title">
            CODE FAST. CLIMB THE RANKS. <br />
            <span className="text-cw-accent">DOMINATE THE ARENA.</span>
          </h1>

          <p className="text-lg md:text-xl text-cw-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed font-sans" id="hero-description">
            The ultimate 1v1 real-time DSA coding battleground. Challenge peers in intense speed duels, validate code instantly, and claim your tier.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/play" 
              className="w-full sm:w-auto px-8 h-12 bg-cw-accent hover:bg-cw-accent-hover text-cw-text-on-accent text-base font-extrabold flex items-center justify-center gap-2 transition-colors duration-base ease-snap clip-corner-all"
            >
              <Swords className="w-5 h-5" />
              FIND A MATCH
            </Link>
            
            <Link 
              href="/problems" 
              className="w-full sm:w-auto px-8 h-12 border border-cw-border bg-cw-surface/40 hover:bg-cw-surface-2 text-cw-text-primary hover:border-cw-text-secondary text-base font-extrabold flex items-center justify-center transition-colors duration-base ease-snap clip-corner-all"
            >
              VIEW CHALLENGES
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIVE STATS BAR (Dynamic Motion - DESIGN.md Section 10.6) ── */}
      <section className="bg-cw-surface py-6 border-b border-cw-border relative z-10" id="live-stats-bar">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-3">
            <Users className="w-5 h-5 text-cw-text-secondary" />
            <div>
              <span className="text-xs font-mono text-cw-text-secondary block">COMPETITORS READY</span>
              <span 
                className={`text-2xl font-bold font-mono text-cw-text-primary inline-block ${tickPlayers ? 'animate-count-tick' : ''}`}
                style={{ contentVisibility: 'auto' }}
              >
                {playerCount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3 border-y md:border-y-0 md:border-x border-cw-border py-4 md:py-0">
            <div className="flex items-center gap-2">
              <LiveDot />
              <span className="text-xs font-mono text-cw-text-secondary">ARENA DUELS LIVE</span>
            </div>
            <div>
              <span 
                className={`text-2xl font-bold font-mono text-cw-text-primary inline-block ${tickMatches ? 'animate-count-tick' : ''}`}
              >
                {matchCount}
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3">
            <Activity className="w-5 h-5 text-cw-text-secondary" />
            <div>
              <span className="text-xs font-mono text-cw-text-secondary block">SOLUTIONS EVALUATED</span>
              <span 
                className={`text-2xl font-bold font-mono text-cw-text-primary inline-block ${tickSolutions ? 'animate-count-tick' : ''}`}
              >
                {solutionCount.toLocaleString()}
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ── ARENA SIMULATOR (DESIGN.md §10.3 Opponent Progress & §10.4 Countdown) ── */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full relative z-10" id="arena-preview-section">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 font-sans text-cw-text-primary">
            THE 1V1 ARENA HUD
          </h2>
          <p className="text-lg text-cw-text-secondary max-w-xl mx-auto font-sans">
            Real-time interface designed to sustain pressure. Track matches, monitor submissions, and sprint against the timer.
          </p>
        </div>

        {/* HUD Box - Clipped Corners on Competitive UI */}
        <div className="border border-cw-border bg-cw-surface/50 clip-corner-tl-br p-1 flex flex-col" id="hud-visual-container">
          {/* HUD Top Bar */}
          <div className="bg-cw-surface px-6 py-4 flex flex-col md:flex-row items-center justify-between border-b border-cw-border gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-cw-accent clip-corner-br" />
                <span className="font-bold text-sm tracking-wider font-mono">MATCH_#8492</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-cw-surface-2 border border-cw-border font-mono text-xs text-cw-text-secondary clip-corner-br">
                DIFFICULTY: <span className="text-cw-warning font-extrabold">MEDIUM</span>
              </div>
            </div>

            {/* Countdown timer with DESIGN.md Section 10.4 logic */}
            <div className="flex items-center gap-4 bg-cw-surface-2/80 px-4 py-2 border border-cw-border clip-corner-br">
              <Clock className="w-4 h-4 text-cw-accent" />
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-mono text-cw-text-secondary uppercase tracking-widest leading-none">CRITICAL COUNTDOWN</span>
                <span 
                  className={`text-xl font-bold font-mono text-cw-accent ${timeTick ? 'animate-tick-flash' : ''}`}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>

          {/* HUD Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-cw-border">
            
            {/* Left: Code Editor (Simulated Monaco editor, static layout) */}
            <div className="lg:col-span-8 bg-cw-bg p-6 flex flex-col min-h-[400px] font-mono text-sm leading-relaxed text-cw-text-secondary">
              <div className="flex items-center justify-between border-b border-cw-border pb-3 mb-4">
                <span className="text-xs text-cw-text-secondary font-mono">// SOLUTION.cpp</span>
                <span className="text-xs text-cw-text-tertiary">Monaco Editor (TS)</span>
              </div>
              <div className="flex-1 overflow-x-auto">
                <p className="text-cw-text-tertiary">1 <span className="text-purple-400">#include</span> <span className="text-emerald-400">&lt;iostream&gt;</span></p>
                <p className="text-cw-text-tertiary">2 <span className="text-purple-400">#include</span> <span className="text-emerald-400">&lt;vector&gt;</span></p>
                <p className="text-cw-text-tertiary">3 </p>
                <p className="text-cw-text-tertiary">4 <span className="text-blue-400">int</span> <span className="text-amber-400 font-bold">findShortestPath</span>(<span className="text-blue-400">int</span> n, std::vector&lt;std::vector&lt;<span className="text-blue-400">int</span>&gt;&gt;&amp; edges) &#123;</p>
                <p className="text-cw-text-tertiary">5     <span className="text-cw-text-secondary">// TODO: Optimize BFS algorithm to prevent TLE</span></p>
                <p className="text-cw-text-tertiary">6     std::vector&lt;<span className="text-blue-400">int</span>&gt; dist(n, <span className="text-orange-400">1e9</span>);</p>
                <p className="text-cw-text-tertiary">7     dist[<span className="text-orange-400">0</span>] = <span className="text-orange-400">0</span>;</p>
                <p className="text-cw-text-tertiary">8     </p>
                <p className="text-cw-text-tertiary">9     <span className="text-purple-400">for</span> (<span className="text-blue-400">int</span> i = <span className="text-orange-400">0</span>; i &lt; n - <span className="text-orange-400">1</span>; ++i) &#123;</p>
                <p className="text-cw-text-tertiary">10         <span className="text-purple-400">for</span> (<span className="text-purple-400">auto</span>&amp; edge : edges) &#123;</p>
                <p className="text-cw-text-tertiary">11             <span className="text-blue-400">int</span> u = edge[<span className="text-orange-400">0</span>], v = edge[<span className="text-orange-400">1</span>], w = edge[<span className="text-orange-400">2</span>];</p>
                <p className="text-cw-text-tertiary">12             <span className="text-purple-400">if</span> (dist[u] != <span className="text-orange-400">1e9</span> && dist[u] + w &lt; dist[v]) &#123;</p>
                <p className="text-cw-text-tertiary">13                 dist[v] = dist[u] + w;</p>
                <p className="text-cw-text-tertiary">14             &#125;</p>
                <p className="text-cw-text-tertiary">15         &#125;</p>
                <p className="text-cw-text-tertiary">16     &#125;</p>
                <p className="text-cw-text-tertiary">17     <span className="text-purple-400">return</span> dist[n - <span className="text-orange-400">1</span>];</p>
                <p className="text-cw-text-tertiary">18 &#125;</p>
              </div>
            </div>

            {/* Right: Players & Progress panels (Section 10.3 dynamic flash simulation) */}
            <div className="lg:col-span-4 bg-cw-surface p-6 flex flex-col gap-6">
              
              {/* Me (Player) Block */}
              <div className="border border-cw-border bg-cw-surface-2 p-4 clip-corner-br">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-cw-text-secondary">YOU (COMPILING)</span>
                  <span className="text-xs font-mono font-bold text-tier-gold">GOLD [1582]</span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <div className="h-2 w-full bg-cw-border clip-corner-br overflow-hidden">
                    <div className="h-full bg-cw-success" style={{ width: '100%' }} />
                  </div>
                  <span className="text-xs font-mono text-cw-success font-bold ml-2">4/4</span>
                </div>
                <span className="text-[10px] font-mono text-cw-success flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> VERDICT: ACCEPTED
                </span>
              </div>

              {/* Opponent Block */}
              <div className="border border-cw-border bg-cw-surface-2 p-4 clip-corner-br relative overflow-hidden">
                
                {/* Simulated progress change indicator flash */}
                {flashOpponent && (
                  <div className="absolute inset-0 bg-cw-accent-muted/40 opponent-progress-flash pointer-events-none" />
                )}

                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-cw-text-secondary">OPPONENT (CODING)</span>
                  <span className="text-xs font-mono font-bold text-tier-gold">GOLD [1598]</span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  {opponentProgress.map((solved, idx) => (
                    <div 
                      key={idx} 
                      className={`h-5 flex-1 flex items-center justify-center font-mono text-[10px] font-extrabold clip-corner-br transition-all duration-base ${
                        solved 
                          ? 'bg-cw-accent/20 border border-cw-accent/40 text-cw-accent' 
                          : 'bg-cw-border text-cw-text-tertiary border border-transparent'
                      }`}
                    >
                      T{idx + 1}
                    </div>
                  ))}
                  <span className="text-xs font-mono text-cw-text-secondary font-bold ml-2">
                    {opponentProgress.filter(Boolean).length}/4
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cw-text-secondary flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-cw-accent rounded-full animate-pulse" />
                  STATUS: TYPING...
                </span>
              </div>

              {/* Instructions Brief */}
              <div className="border border-cw-border border-dashed p-4 clip-corner-br text-xs leading-relaxed text-cw-text-secondary font-mono">
                <span className="text-cw-text-primary block font-bold mb-1">TASK BRIEF:</span>
                Given an undirected graph with weighted edges, find the shortest path from vertex 0 to N-1. If no path exists, return -1. Time complexity must be O(E log V).
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ── RANK TIERS SECTION (DESIGN.md Section 5 - Tier badges visualizer) ── */}
      <section className="py-24 border-t border-cw-border bg-cw-surface/20" id="tiers-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 font-sans text-cw-text-primary">
              COMPETITIVE RANK TIERS
            </h2>
            <p className="text-lg text-cw-text-secondary max-w-xl mx-auto font-sans">
              Enter the ranking ladder. Earn ELO rating points for each match win, and unlock higher combat tiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, idx) => (
              <div 
                key={idx}
                className={`border ${tier.borderClass} bg-cw-surface p-6 clip-corner-tl-br flex flex-col justify-between hover:bg-cw-surface-2 transition-colors duration-base ease-snap group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-lg font-extrabold font-mono tracking-wider ${tier.textClass}`}>
                      {tier.name}
                    </span>
                    <Trophy className={`w-5 h-5 ${tier.textClass}`} />
                  </div>
                  <span className="text-sm font-bold font-mono text-cw-text-primary block mb-3">
                    {tier.range}
                  </span>
                  <p className="text-xs text-cw-text-secondary leading-relaxed font-sans">
                    {tier.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-cw-border flex items-center justify-between text-[10px] font-mono text-cw-text-tertiary uppercase tracking-wider">
                  <span>UNLOCKED ON ARENA</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all duration-base translate-x-[-4px] group-hover:translate-x-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DAILY QUESTS & RETENTION HUB ── */}
      <section className="py-24 border-t border-cw-border bg-cw-bg" id="quests-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 font-sans text-cw-text-primary">
              DAILY QUESTS & POTD
            </h2>
            <p className="text-lg text-cw-text-secondary max-w-xl mx-auto font-sans">
              Keep your streak alive. Solve the Daily Challenge and complete quests to earn bonus ELO and unlock unique cosmetic rewards.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Problem of the day card (Clipped corners) */}
            <div className="lg:col-span-7 border border-cw-border bg-cw-surface p-6 clip-corner-tl-br flex flex-col justify-between min-h-[350px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-cw-accent font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 animate-pulse" /> PROBLEM OF THE DAY
                  </span>
                  <span className="text-[10px] font-mono text-cw-text-secondary bg-cw-surface-2 px-2 py-0.5 border border-cw-border rounded">
                    SOLVED BY 843 PLAYERS TODAY
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold font-sans text-cw-text-primary mb-2">
                  Verify Balanced Subtree
                </h3>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-xs font-mono font-bold text-cw-success">EASY</span>
                  <span className="text-xs font-mono text-cw-text-tertiary">|</span>
                  <span className="text-xs font-mono text-cw-text-secondary">Tree, DFS, Recursion</span>
                  <span className="text-xs font-mono text-cw-text-tertiary">|</span>
                  <span className="text-xs font-mono text-cw-accent font-semibold">+25 ELO BOOSTER</span>
                </div>
                <p className="text-sm text-cw-text-secondary leading-relaxed mb-6 font-sans">
                  Given the root of a binary tree, determine if it is height-balanced. A height-balanced binary tree is defined as a binary tree in which the left and right subtrees of every node differ in height by no more than 1.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link 
                  href="/auth/login" 
                  className="w-full sm:w-auto px-6 h-10 bg-cw-accent hover:bg-cw-accent-hover text-cw-text-on-accent text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-base ease-snap clip-corner-all"
                >
                  SOLVE CHALLENGE
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right: Active Quests list (Grayscale, sharp design) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <span className="text-xs font-mono text-cw-text-secondary uppercase tracking-widest font-bold block mb-1">
                ACTIVE RECRUIT MISSIONS
              </span>

              <div className="border border-cw-border bg-cw-surface/50 p-4 clip-corner-br flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-cw-text-primary font-bold block">First Blood</span>
                  <span className="text-[11px] text-cw-text-secondary block mt-0.5">Win a 1v1 match in any programming language.</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-cw-accent font-bold block">+10 ELO</span>
                  <span className="text-[9px] font-mono text-cw-text-tertiary block mt-0.5">DAILY</span>
                </div>
              </div>

              <div className="border border-cw-border bg-cw-surface/50 p-4 clip-corner-br flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-cw-text-primary font-bold block">Executioner</span>
                  <span className="text-[11px] text-cw-text-secondary block mt-0.5">Pass 100% of test cases on your first compiler run.</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-cw-accent font-bold block">+15 ELO</span>
                  <span className="text-[9px] font-mono text-cw-text-tertiary block mt-0.5">WEEKLY</span>
                </div>
              </div>

              <div className="border border-cw-border bg-cw-surface/50 p-4 clip-corner-br flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-cw-text-primary font-bold block">Streak Warrior</span>
                  <span className="text-[11px] text-cw-text-secondary block mt-0.5">Maintain a 5-day coding puzzle solve streak.</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-cw-accent font-bold block">+40 ELO</span>
                  <span className="text-[9px] font-mono text-cw-text-tertiary block mt-0.5">STREAK</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE MATCH ENGINE PROCESS ── */}
      <section className="py-24 border-t border-cw-border bg-cw-surface/10" id="match-engine-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 font-sans text-cw-text-primary">
              HOW MATCHMAKING WORKS
            </h2>
            <p className="text-lg text-cw-text-secondary max-w-xl mx-auto font-sans">
              CodeWars matches you with rivals in real-time, executing code securely and updating stats asynchronously.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="border border-cw-border p-6 bg-cw-surface/40 clip-corner-br flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-3xl font-extrabold font-mono text-cw-accent/40 block mb-4">01</span>
                <h4 className="text-base font-bold text-cw-text-primary mb-2 font-sans">QUEUE & LOCK</h4>
                <p className="text-xs text-cw-text-secondary leading-relaxed font-sans">
                  The matchmaking queue locks onto your ELO and expands the search radius by 50 ELO every 5 seconds to guarantee a fair duel.
                </p>
              </div>
            </div>

            <div className="border border-cw-border p-6 bg-cw-surface/40 clip-corner-br flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-3xl font-extrabold font-mono text-cw-accent/40 block mb-4">02</span>
                <h4 className="text-base font-bold text-cw-text-primary mb-2 font-sans">PROVISION CONTAINER</h4>
                <p className="text-xs text-cw-text-secondary leading-relaxed font-sans">
                  FastAPI matches players and allocates an isolated execution runner. The sandbox keeps runtime evaluation completely safe.
                </p>
              </div>
            </div>

            <div className="border border-cw-border p-6 bg-cw-surface/40 clip-corner-br flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-3xl font-extrabold font-mono text-cw-accent/40 block mb-4">03</span>
                <h4 className="text-base font-bold text-cw-text-primary mb-2 font-sans">SYNC VERDICTS</h4>
                <p className="text-xs text-cw-text-secondary leading-relaxed font-sans">
                  WebSockets broadcast live status updates. Monitor your opponent's progress bar in real-time without seeing their code.
                </p>
              </div>
            </div>

            <div className="border border-cw-border p-6 bg-cw-surface/40 clip-corner-br flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-3xl font-extrabold font-mono text-cw-accent/40 block mb-4">04</span>
                <h4 className="text-base font-bold text-cw-text-primary mb-2 font-sans">ELO CALCULATION</h4>
                <p className="text-xs text-cw-text-secondary leading-relaxed font-sans">
                  The match concludes and recalculates ratings. An append-only entry is added to elo_history database, unlocking rank tiers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE COMPLETED BATTLES FEED ── */}
      <section className="py-24 border-t border-cw-border bg-cw-bg" id="recent-battles-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-mono text-cw-accent font-bold uppercase tracking-widest block mb-2">LIVE LOGS</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-sans text-cw-text-primary">
                RECENT DUELS
              </h2>
            </div>
            <p className="text-sm text-cw-text-secondary max-w-sm mt-4 md:mt-0 font-sans">
              Algorithmic conflicts resolving across the network. Updates live as Judge0 outputs compile results.
            </p>
          </div>

          <div className="border border-cw-border bg-cw-surface/30 clip-corner-tl-br p-px flex flex-col divide-y divide-cw-border">
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="text-cw-text-primary font-bold">alex_code</span>
                <span className="text-tier-gold font-bold bg-tier-gold/10 px-1 rounded">[1542]</span>
                <span className="text-cw-text-tertiary">⚔️</span>
                <span className="text-cw-text-secondary">user_90</span>
                <span className="text-tier-silver font-bold bg-tier-silver/10 px-1 rounded">[1480]</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-cw-text-secondary">Medium Difficulty</span>
                <span className="text-cw-success font-bold">alex_code won (+18 ELO)</span>
                <span className="text-cw-text-tertiary">2m ago</span>
              </div>
            </div>

            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="text-cw-text-secondary">null_ptr</span>
                <span className="text-tier-silver font-bold bg-tier-silver/10 px-1 rounded">[1290]</span>
                <span className="text-cw-text-tertiary">⚔️</span>
                <span className="text-cw-text-primary font-bold">lambda_master</span>
                <span className="text-tier-gold font-bold bg-tier-gold/10 px-1 rounded">[1510]</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-cw-text-secondary">Hard Difficulty</span>
                <span className="text-cw-success font-bold">lambda_master won (+24 ELO)</span>
                <span className="text-cw-text-tertiary">6m ago</span>
              </div>
            </div>

            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="text-cw-text-primary font-bold">compile_error</span>
                <span className="text-tier-diamond font-bold bg-tier-diamond/10 px-1 rounded">[2080]</span>
                <span className="text-cw-text-tertiary">⚔️</span>
                <span className="text-cw-text-secondary">heap_stack</span>
                <span className="text-tier-diamond font-bold bg-tier-diamond/10 px-1 rounded">[2140]</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-cw-text-secondary">Medium Difficulty</span>
                <span className="text-cw-danger font-bold">heap_stack lost (-14 ELO)</span>
                <span className="text-cw-text-tertiary">11m ago</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="py-24 border-t border-cw-border bg-cw-surface/10" id="faq-section">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 font-sans text-cw-text-primary">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <p className="text-lg text-cw-text-secondary font-sans">
              Everything you need to know about the CodeWars speed coding platform.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="border border-cw-border bg-cw-surface p-5 clip-corner-br">
              <h4 className="text-sm font-bold text-cw-text-primary font-sans mb-2">How is code correctness checked?</h4>
              <p className="text-xs text-cw-text-secondary leading-relaxed font-sans">
                Submissions are sent directly to Judge0 execution sandboxes running on isolated virtual machines. We run your code against a series of automated unit tests containing edge-cases, verifying time-complexity limit compliance (e.g. 1000ms max) and memory consumption limits.
              </p>
            </div>

            <div className="border border-cw-border bg-cw-surface p-5 clip-corner-br">
              <h4 className="text-sm font-bold text-cw-text-primary font-sans mb-2">What happens if my opponent disconnects?</h4>
              <p className="text-xs text-cw-text-secondary leading-relaxed font-sans">
                If an opponent disconnects from the live WebSocket session, a 2-minute timer begins. If they reconnect within this window, the match resumes. If they fail to return, they forfeit the match, resulting in a loss for them and ELO points for you.
              </p>
            </div>

            <div className="border border-cw-border bg-cw-surface p-5 clip-corner-br">
              <h4 className="text-sm font-bold text-cw-text-primary font-sans mb-2">How does the matchmaking ranking (ELO) recalculate?</h4>
              <p className="text-xs text-cw-text-secondary leading-relaxed font-sans">
                After a match terminates, the system calculates expected wins using the standard logistic distribution formula. If you beat a higher-rated player, you gain substantial ELO points while they lose points proportionately. Match results are immediately written into the append-only ELO history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCT FEATURES GRID (Clean Static Layout) ── */}
      <section className="py-24 border-t border-cw-border" id="features-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 bg-cw-accent/10 border border-cw-accent/20 flex items-center justify-center clip-corner-br">
                <Zap className="w-6 h-6 text-cw-accent" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-cw-text-primary font-sans">
                Real-Time Matchmaker
              </h3>
              <p className="text-sm text-cw-text-secondary leading-relaxed font-sans">
                Queue up and find algorithmic duelists matching your ELO bracket in seconds. High stakes, pure skill.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 bg-cw-accent/10 border border-cw-accent/20 flex items-center justify-center clip-corner-br">
                <Terminal className="w-6 h-6 text-cw-accent" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-cw-text-primary font-sans">
                Isolated Execution
              </h3>
              <p className="text-sm text-cw-text-secondary leading-relaxed font-sans">
                Each submission runs on dedicated, sandboxed VM clusters powered by Judge0, verifying runtime and memory constraints securely.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 bg-cw-accent/10 border border-cw-accent/20 flex items-center justify-center clip-corner-br">
                <Shield className="w-6 h-6 text-cw-accent" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-cw-text-primary font-sans">
                Anti-Cheat Protocol
              </h3>
              <p className="text-sm text-cw-text-secondary leading-relaxed font-sans">
                Dynamic test case generation, disabled cut-and-paste triggers, and browser monitoring ensure a clean competitive playfield.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION PANEL ── */}
      <section className="py-24 border-t border-cw-border bg-cw-bg relative overflow-hidden" id="cta-section">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 font-sans text-cw-text-primary">
            ARE YOU READY TO DUEL?
          </h2>
          <p className="text-base text-cw-text-secondary max-w-xl mx-auto mb-10 leading-relaxed font-sans">
            Register your profile, choose your programming language, and enter the matchmaking queue.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/auth/login?signup=true" 
              className="w-full sm:w-auto px-8 h-12 bg-cw-accent hover:bg-cw-accent-hover text-cw-text-on-accent text-base font-extrabold flex items-center justify-center gap-2 transition-colors duration-base ease-snap clip-corner-all"
            >
              CREATE COMPETE ID
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER (Calm UI - Rounded layout) ── */}
      <footer className="border-t border-cw-border bg-cw-surface py-12 px-6 mt-auto" id="landing-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold tracking-wider text-cw-text-primary font-sans">
              CODE<span className="text-cw-accent">WARS</span>.IO
            </span>
            <span className="text-xs text-cw-text-tertiary">
              &copy; {new Date().getFullYear()} ALL RIGHTS RESERVED.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-cw-text-secondary" id="footer-links">
            <Link href="/terms" className="hover:text-cw-text-primary transition-colors duration-fast ease-snap">
              Terms of Use
            </Link>
            <Link href="/privacy" className="hover:text-cw-text-primary transition-colors duration-fast ease-snap">
              Privacy
            </Link>
            <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-cw-text-primary transition-colors duration-fast ease-snap">
              Repository
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}