"use client";

/**
 * features/auth/hooks/use-edit-profile.ts
 * Encapsulates the edit-profile modal state and optimistic save logic.
 * Extracted from profile-page.tsx per AGENTS.md hooks/ convention.
 *
 * TODO (M1): swap the setTimeout stub for a real updateProfile() service call.
 */

import { useState } from "react";
import type { ProfileUser, EditProfilePayload } from "../types";
import { updateProfile } from "../services/auth-service";

export interface UseEditProfileReturn {
  editOpen:         boolean;
  openEdit:         () => void;
  closeEdit:        () => void;
  handleSaveProfile: (payload: EditProfilePayload) => Promise<boolean>;
}

export function useEditProfile(
  setUser: React.Dispatch<React.SetStateAction<ProfileUser | null>> | null
): UseEditProfileReturn {
  const [editOpen, setEditOpen] = useState(false);

  function openEdit()  { setEditOpen(true);  }
  function closeEdit() { setEditOpen(false); }

  async function handleSaveProfile(payload: EditProfilePayload): Promise<boolean> {
    const updated = await updateProfile(payload);
    if (updated) {
      if (setUser) {
        setUser(updated);
      }
      return true;
    }
    return false;
  }

  return { editOpen, openEdit, closeEdit, handleSaveProfile };
}
