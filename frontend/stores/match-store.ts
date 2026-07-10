import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface MatchState {
  matchId: string | null;
  status: "idle" | "searching" | "matched" | "in_progress" | "completed" | "abandoned";
  role: "player_one" | "player_two" | null;
  opponent: {
    username: string;
    avatarUrl: string | null;
    elo: number;
    tier: string;
  } | null;
  problem: {
    id: string;
    title: string;
    slug: string;
    difficulty: "Easy" | "Medium" | "Hard";
    description: string;
  } | null;
  timeLeft: number; // in seconds
  score: {
    p1: number;
    p2: number;
  };
  eloDelta: number | null;
}

export interface MatchActions {
  startQueue: () => void;
  cancelQueue: () => void;
  setMatch: (match: Partial<MatchState>) => void;
  updateTimeLeft: (time: number) => void;
  setScore: (score: { p1: number; p2: number }) => void;
  setEloDelta: (delta: number | null) => void;
  resetMatch: () => void;
}

export type MatchStore = MatchState & MatchActions;

const initialMatchState: MatchState = {
  matchId: null,
  status: "idle",
  role: null,
  opponent: null,
  problem: null,
  timeLeft: 0,
  score: { p1: 0, p2: 0 },
  eloDelta: null,
};

export const useMatchStore = create<MatchStore>()(
  subscribeWithSelector((set) => ({
    ...initialMatchState,
    startQueue: () => set({ status: "searching" }),
    cancelQueue: () => set({ status: "idle" }),
    setMatch: (match) => set((state) => ({ ...state, ...match })),
    updateTimeLeft: (timeLeft) => set({ timeLeft }),
    setScore: (score) => set({ score }),
    setEloDelta: (eloDelta) => set({ eloDelta }),
    resetMatch: () => set(initialMatchState),
  }))
);
