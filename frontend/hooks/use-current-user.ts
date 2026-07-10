import { useEffect } from "react";
import { useUserStore } from "@/stores/user-store";
import { BASE_URL } from "@/proxy";
import { mapBackendProfile } from "@/features/auth/services/auth-service";

export function useCurrentUser() {
  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);
  const setUser = useUserStore((state) => state.setUser);
  const setLoading = useUserStore((state) => state.setLoading);

  useEffect(() => {
    // Only fetch if we don't have a user and aren't already loading
    if (user || isLoading) return;

    let active = true;

    async function loadUser() {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/u/me`, {
          credentials: "include",
        });
        if (response.ok && active) {
          const data = await response.json();
          setUser(mapBackendProfile(data));
        }
      } catch (err) {
        console.error("Failed to load current user profile:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [user, isLoading, setUser, setLoading]);

  return { user, isLoading };
}
