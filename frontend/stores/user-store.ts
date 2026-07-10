import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { ProfileUser } from "@/features/auth/types";

export interface UserState {
  user: ProfileUser | null;
  sessionToken: string | null;
  isLoading: boolean;
}

export interface UserActions {
  setUser: (user: ProfileUser | null) => void;
  setSessionToken: (token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  clear: () => void;
}

export type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  subscribeWithSelector((set) => ({
    user: null,
    sessionToken: null,
    isLoading: false,
    setUser: (user) => set({ user }),
    setSessionToken: (sessionToken) => set({ sessionToken }),
    setLoading: (isLoading) => set({ isLoading }),
    clear: () => set({ user: null, sessionToken: null, isLoading: false }),
  }))
);
