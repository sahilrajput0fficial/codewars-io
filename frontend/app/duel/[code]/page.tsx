"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Check, Play, ShieldAlert, Users, ArrowLeft, Loader2, Zap } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMatchSocket } from "@/hooks/use-match-socket";
import { getDuelRoom, joinDuelRoom, startDuelRoom, leaveDuelRoom, DuelRoomData } from "@/services/match-service";

export default function DuelLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (typeof params.code === "string" ? params.code : Array.isArray(params.code) ? params.code[0] : "").toUpperCase();

  const { user, isLoading: userLoading } = useCurrentUser();
  const [room, setRoom] = useState<DuelRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Fetch initial room state
  const loadRoom = useCallback(async () => {
    if (!code) return;
    try {
      setLoading(true);
      const data = await getDuelRoom(code);
      setRoom(data);
      setError(null);

      // Auto-join if authenticated, not the host, and slot is empty
      if (user && user.id !== data.host_id && !data.guest_id) {
        try {
          const joinedData = await joinDuelRoom(code);
          setRoom(joinedData);
        } catch (joinErr: any) {
          console.warn("Auto-join warning:", joinErr);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load duel lobby");
    } finally {
      setLoading(false);
    }
  }, [code, user]);

  useEffect(() => {
    if (!userLoading) {
      loadRoom();
    }
  }, [userLoading, loadRoom]);

  // Real-time WebSocket updates
  useMatchSocket({
    userId: user?.id,
    enabled: !!user?.id,
    onDuelGuestJoined: (updatedRoom: DuelRoomData) => {
      console.log("[Duel Lobby] Guest joined:", updatedRoom);
      setRoom(updatedRoom);
    },
    onDuelGuestLeft: (updatedRoom: DuelRoomData) => {
      console.log("[Duel Lobby] Guest left:", updatedRoom);
      setRoom(updatedRoom);
    },
    onDuelStarted: (data: { match_id: string; redirect_url: string }) => {
      console.log("[Duel Lobby] Duel started! Redirecting to match:", data.match_id);
      router.push(data.redirect_url || `/match/${data.match_id}`);
    },
    onDuelCancelled: (data: { reason: string }) => {
      alert(data.reason || "The duel room was cancelled by the host.");
      router.push("/play");
    },
  });

  const isHost = user && room && user.id === room.host_id;
  const isGuest = user && room && user.id === room.guest_id;
  const isReadyToStart = isHost && !!room?.guest_id && room?.status === "ready";

  const handleStartDuel = async () => {
    if (!isReadyToStart || isStarting) return;
    try {
      setIsStarting(true);
      const startedRoom = await startDuelRoom(code);
      if (startedRoom.match_id) {
        router.push(`/match/${startedRoom.match_id}`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to start duel");
      setIsStarting(false);
    }
  };

  const handleLeaveLobby = async () => {
    try {
      await leaveDuelRoom(code);
    } catch (err) {
      console.error(err);
    }
    router.push("/play");
  };

  const shareableUrl = typeof window !== "undefined" ? `${window.location.origin}/duel/${code}` : "";

  const handleCopy = (text: string, type: "link" | "code") => {
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-neutral-400 font-mono">
        <Loader2 className="h-6 w-6 animate-spin text-red-500 mr-3" />
        INITIALIZING SECURE LOBBY...
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 font-mono text-center">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2 uppercase">LOBBY ERROR</h2>
        <p className="text-sm text-neutral-400 max-w-md mb-6">{error || "This duel lobby has expired or does not exist."}</p>
        <Link
          href="/play"
          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-black font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO BATTLEGROUNDS
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono flex flex-col relative overflow-hidden">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f1f1f_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      {/* Top Navigation */}
      <header className="border-b border-neutral-900 px-6 py-4 flex items-center justify-between z-10 bg-[#080808]/80 backdrop-blur-md">
        <Link href="/play" className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> LEAVE LOBBY
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 uppercase tracking-widest">ARENA:</span>
          <span className="text-xs px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-400 font-bold uppercase tracking-wider">
            {room.arena_slug}
          </span>
          <span className="text-xs px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-neutral-400 uppercase">
            {room.is_ranked ? "RANKED" : "CASUAL (UNRANKED)"}
          </span>
        </div>
      </header>

      {/* Main Lobby Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 max-w-4xl mx-auto w-full">
        {/* Title Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            <Zap className="h-3.5 w-3.5" /> PRIVATE 1V1 DUEL LOBBY
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white uppercase">
            CHALLENGE YOUR COMRADE
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider">
            SHARE THIS CODE OR URL TO BEGIN BATTLE IMMEDIATELY
          </p>
        </div>

        {/* Invite Code & Link Bar */}
        <div className="w-full bg-[#0d0d0d] border border-neutral-800 p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400 uppercase">ROOM CODE:</span>
            <span className="text-lg font-bold text-red-400 tracking-widest px-3 py-1 bg-red-950/40 border border-red-500/40">
              {room.code}
            </span>
            <button
              onClick={() => handleCopy(room.code, "code")}
              className="p-2 border border-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white transition-colors"
              title="Copy Code"
            >
              {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleCopy(shareableUrl, "link")}
              className="w-full sm:w-auto px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-white uppercase font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedLink ? "LINK COPIED!" : "COPY INVITE LINK"}
            </button>
          </div>
        </div>

        {/* ── 1V1 VS BATTLE COMPOSITION ── */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 w-full items-stretch mb-8">
          {/* Host Card (Left 5 Cols) */}
          <div className="md:col-span-5 bg-[#0a0a0a] border border-red-500/30 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.05)]">
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-black font-bold text-[9px] uppercase tracking-wider">
              HOST
            </div>
            <div className="w-20 h-20 rounded-full border-2 border-red-500 overflow-hidden bg-neutral-900 flex items-center justify-center mb-3 mt-2">
              {room.host_avatar ? (
                <img src={room.host_avatar} alt={room.host_name} className="w-full h-full object-cover" />
              ) : (
                <Users className="h-8 w-8 text-neutral-600" />
              )}
            </div>
            <h3 className="font-bold text-lg text-white uppercase tracking-wide">{room.host_name}</h3>
            <span className="text-xs text-emerald-400 mt-1">READY FOR DUEL</span>
          </div>

          {/* Center VS Emblem (1 Col) */}
          <div className="md:col-span-1 flex items-center justify-center py-2">
            <div className="w-12 h-12 rounded-full border border-neutral-800 bg-[#0d0d0d] flex items-center justify-center font-bold text-sm text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              VS
            </div>
          </div>

          {/* Guest Card (Right 5 Cols) */}
          <div className={`md:col-span-5 bg-[#0a0a0a] border p-6 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all ${
            room.guest_id ? "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.05)]" : "border-neutral-800/80 border-dashed"
          }`}>
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-neutral-800 text-neutral-300 font-bold text-[9px] uppercase tracking-wider">
              GUEST
            </div>

            {room.guest_id ? (
              <>
                <div className="w-20 h-20 rounded-full border-2 border-emerald-500 overflow-hidden bg-neutral-900 flex items-center justify-center mb-3 mt-2">
                  {room.guest_avatar ? (
                    <img src={room.guest_avatar} alt={room.guest_name || "Guest"} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="h-8 w-8 text-neutral-600" />
                  )}
                </div>
                <h3 className="font-bold text-lg text-white uppercase tracking-wide">{room.guest_name || "Comrade"}</h3>
                <span className="text-xs text-emerald-400 mt-1">CONNECTED & READY</span>
              </>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-neutral-800 flex items-center justify-center mb-3 animate-pulse text-neutral-600">
                  <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
                </div>
                <h3 className="font-bold text-sm text-neutral-400 uppercase tracking-wide">WAITING FOR COMRADE...</h3>
                <p className="text-[10px] text-neutral-600 mt-1 uppercase max-w-[200px]">
                  SEND ROOM CODE TO INVITE A FRIEND
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Action Controls Bar ── */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-900">
          <button
            onClick={handleLeaveLobby}
            className="w-full sm:w-auto px-6 py-3 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            {isHost ? "CANCEL DUEL" : "LEAVE LOBBY"}
          </button>

          {isHost ? (
            <button
              disabled={!isReadyToStart || isStarting}
              onClick={handleStartDuel}
              className={`w-full sm:w-auto px-8 py-3.5 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                isReadyToStart
                  ? "bg-red-500 hover:bg-red-600 text-black shadow-[0_0_20px_rgba(239,68,68,0.3)] active:scale-95 cursor-pointer"
                  : "bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed"
              }`}
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> STARTING MATCH...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" /> START DUEL NOW
                </>
              )}
            </button>
          ) : (
            <div className="text-xs text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> WAITING FOR HOST TO START...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
