import { useEffect } from "react";
import { useUserStore } from "@/stores/user-store";
import { fetchMyProfile } from "@/features/auth/services/auth-service";

export function useCurrentUser() {
  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);
  const setUser = useUserStore((state) => state.setUser);
  const setLoading = useUserStore((state) => state.setLoading);

  useEffect(() => {
    if (user) return;

    let active = true;

    async function loadUser() {
      setLoading(true);
      try {
        const profile = await fetchMyProfile();
        if (active) {
          setUser(profile);
        }
      } catch (err) {
        console.error("Failed to load current user profile:", err);
        if (active) setUser(null);
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
  }, [user, setUser, setLoading]);

  return { user, isLoading };
}
