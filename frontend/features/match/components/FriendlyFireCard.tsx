"use client";

/**
 * features/match/components/FriendlyFireCard.tsx
 *
 * Friendly Fire card:
 *  - Left red accent bar
 *  - Title: FRIENDLY FIRE: DUEL A COMRADE
 *  - Subtitle: CHALLENGE YOUR ALLIES IN PRIVATE SKIRMISHES. NO ELO LOSS, ALL THE GLORY.
 *  - Green Outline CTA: GENERATE INVITE CODE (calls createDuelRoom API)
 *  - Input + Red Button Group: ENTER BATTLE CODE + JOIN BATTLE (calls joinDuelRoom API)
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Play, Loader2 } from "lucide-react";
import { createDuelRoom, joinDuelRoom } from "@/services/match-service";

interface FriendlyFireCardProps {
  arenaSlug?: string;
  onJoinMatch?: (code: string) => void;
  onCreateMatch?: (code: string) => void;
}

export function FriendlyFireCard({ arenaSlug = "kabul", onJoinMatch, onCreateMatch }: FriendlyFireCardProps) {
  const router = useRouter();
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleGenerateCode = async () => {
    try {
      setIsCreating(true);
      setErrorMsg("");
      const roomData = await createDuelRoom(arenaSlug, false);
      setCreatedCode(roomData.code);
      if (onCreateMatch) onCreateMatch(roomData.code);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create duel room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdCode) return;
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterLobby = () => {
    if (!createdCode) return;
    router.push(`/duel/${createdCode}`);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg("ENTER BATTLE CODE REQUIRED");
      return;
    }

    try {
      setIsJoining(true);
      setErrorMsg("");
      await joinDuelRoom(cleanCode);
      if (onJoinMatch) onJoinMatch(cleanCode);
      router.push(`/duel/${cleanCode}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to join duel");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="col-span-full w-full bg-[#0d0d0d] border border-neutral-800 relative overflow-hidden flex flex-col md:flex-row items-stretch md:items-center justify-between p-4 md:px-6 md:py-4 gap-4">
      {/* Left Red Vertical Bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />

      {/* Left Section: Title & Subtitle */}
      <div className="pl-3 flex flex-col justify-center">
        <h3 className="font-mono font-bold text-lg md:text-xl text-white tracking-wide uppercase leading-tight">
          FRIENDLY FIRE: DUEL A COMRADE
        </h3>
        <p className="font-mono text-[10px] md:text-[11px] text-neutral-400 tracking-wider uppercase mt-1">
          CHALLENGE YOUR ALLIES IN PRIVATE SKIRMISHES. NO ELO LOSS, ALL THE GLORY.
        </p>
        {errorMsg && (
          <span className="font-mono text-[10px] text-red-400 uppercase tracking-wide mt-1">
            ⚠️ {errorMsg}
          </span>
        )}
      </div>

      {/* Right Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 shrink-0 pl-3 md:pl-0">
        {/* Green Outline Button / Generated Code display */}
        {createdCode ? (
          <div className="flex items-center gap-2 border border-emerald-500/80 bg-emerald-950/30 px-3 py-2 font-mono text-xs text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <span className="font-bold tracking-widest">{createdCode}</span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1 text-emerald-400 hover:text-white transition-colors"
              title="Copy Code"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleEnterLobby}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase flex items-center gap-1 ml-1"
            >
              <Play className="h-3 w-3 fill-current" />
              LOBBY
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isCreating}
            onClick={handleGenerateCode}
            className="border border-emerald-500 text-emerald-400 hover:bg-emerald-950/40 font-mono text-xs uppercase px-4 py-2.5 tracking-wider transition-colors shadow-[0_0_10px_rgba(16,185,129,0.1)] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            GENERATE INVITE CODE
          </button>
        )}

        {/* Input + Red Button Attached Group */}
        <form onSubmit={handleJoin} className="flex items-stretch">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => {
              setInputCode(e.target.value.toUpperCase());
              if (errorMsg) setErrorMsg("");
            }}
            placeholder="ENTER BATTLE CODE"
            maxLength={10}
            className="bg-black text-neutral-300 placeholder:text-neutral-600 font-mono text-xs uppercase px-3 py-2.5 border border-neutral-800 border-r-0 outline-none w-44 md:w-48 tracking-wider focus:border-red-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isJoining}
            className="bg-red-500 hover:bg-red-600 text-black font-mono font-bold text-xs uppercase px-4 py-2.5 tracking-wider transition-colors shrink-0 flex items-center justify-center active:scale-95 disabled:opacity-50"
          >
            {isJoining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "JOIN BATTLE"}
          </button>
        </form>
      </div>
    </div>
  );
}
