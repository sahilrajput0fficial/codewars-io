import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { ProfileUser } from "@/features/auth/types";

export interface UserState {
  user: ProfileUser | null;
  accessToken: string | null;
  isLoading: boolean;
}

export interface UserActions {
  setUser: (user: ProfileUser | null) => void;
  setAccessToken: (token: string | null) => void;
  setSessionToken?: (token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  clear: () => void;
}

export type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  subscribeWithSelector((set) => ({
    user: null,
    accessToken: null,
    isLoading: false,
    setUser: (user) => set({ user }),
    setAccessToken: (token) => set({ accessToken: token }),
    setSessionToken: (token) => set({ accessToken: token }),
    setLoading: (isLoading) => set({ isLoading }),
    clear: () => set({ user: null, accessToken: null, isLoading: false }),
  }))
);
