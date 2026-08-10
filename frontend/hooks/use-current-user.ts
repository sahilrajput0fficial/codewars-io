import { useEffect } from "react";
import { useUserStore } from "@/stores/user-store";
import { BASE_URL } from "@/lib/api-client";
import { mapBackendProfile } from "@/features/auth/services/auth-service";

export function useCurrentUser() {
  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);
  const setUser = useUserStore((state) => state.setUser);
  const setLoading = useUserStore((state) => state.setLoading);

  useEffect(() => {
    // If we already have a user object in state, no need to load again
    if (user) return;

    let active = true;

    async function loadUser() {
      setLoading(true);
      try {
        let response = await fetch(`${BASE_URL}/u/me`, {
          credentials: "include",
        });

        // If access token expired (401), attempt automatic token refresh
        if (response.status === 401) {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });
          if (refreshRes.ok) {
            response = await fetch(`${BASE_URL}/u/me`, {
              credentials: "include",
            });
          }
        }

        if (response.ok && active) {
          const data = await response.json();
          setUser(mapBackendProfile(data));
        } else if (!response.ok && active) {
          setUser(null);
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
