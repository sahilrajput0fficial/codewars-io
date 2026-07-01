"use client";

import { useEffect, useState } from "react";
import { X, User, Image as ImageIcon, UploadCloud } from "lucide-react";
import type { EditProfilePayload } from "../types";

export interface EditProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  hideOnlineStatus: boolean;
  showAchievements: boolean;
  onSave: (payload: EditProfilePayload) => Promise<boolean>;
}

export function EditProfileDrawer({
  open,
  onClose,
  displayName,
  bio,
  avatarUrl,
  bannerUrl,
  hideOnlineStatus,
  showAchievements,
  onSave,
}: EditProfileDrawerProps) {
  const [name, setName] = useState(displayName);
  const [localBio, setLocalBio] = useState(bio);
  const [avatar, setAvatar] = useState(avatarUrl || "");
  const [banner, setBanner] = useState(bannerUrl || "");
  const [hideOnline, setHideOnline] = useState(hideOnlineStatus);
  const [showAchievementsFlag, setShowAchievementsFlag] = useState(showAchievements);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [dragActiveAvatar, setDragActiveAvatar] = useState(false);
  const [dragActiveBanner, setDragActiveBanner] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Sync state with props when open changes
  useEffect(() => {
    if (open) {
      setName(displayName);
      setLocalBio(bio);
      setAvatar(avatarUrl || "");
      setBanner(bannerUrl || "");
      setHideOnline(hideOnlineStatus);
      setShowAchievementsFlag(showAchievements);
      // Wait a frame to trigger the open transition
      const frame = requestAnimationFrame(() => setActive(true));
      return () => cancelAnimationFrame(frame);
    } else {
      setActive(false);
    }
  }, [open, displayName, bio, avatarUrl, bannerUrl, hideOnlineStatus, showAchievements]);

  if (!open && !active) return null;

  async function handleAvatarUpload(file: File) {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/u/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Upload failed");
      }

      const data = await res.json();
      setAvatar(data.url);
    } catch (err: any) {
      alert("Failed to upload avatar: " + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleBannerUpload(file: File) {
    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/u/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Upload failed");
      }

      const data = await res.json();
      setBanner(data.url);
    } catch (err: any) {
      alert("Failed to upload banner: " + err.message);
    } finally {
      setUploadingBanner(false);
    }
  }

  // ── Drag and Drop handlers for Avatar ──
  const handleDragAvatar = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveAvatar(true);
    } else if (e.type === "dragleave") {
      setDragActiveAvatar(false);
    }
  };

  const handleDropAvatar = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveAvatar(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAvatarUpload(e.dataTransfer.files[0]);
    }
  };

  // ── Drag and Drop handlers for Banner ──
  const handleDragBanner = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveBanner(true);
    } else if (e.type === "dragleave") {
      setDragActiveBanner(false);
    }
  };

  const handleDropBanner = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveBanner(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleBannerUpload(e.dataTransfer.files[0]);
    }
  };

  async function handleSave() {
    setSaving(true);
    const success = await onSave({
      display_name: name.trim() || displayName,
      bio: localBio.trim(),
      avatar_url: avatar.trim() || null,
      banner_url: banner.trim() || null,
      hide_online_status: hideOnline,
      show_achievements: showAchievementsFlag,
    });
    setSaving(false);
    if (success) {
      onClose();
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-slow ${
        active ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      style={{
        background: "rgba(0,0,0,0.75)",
        transitionTimingFunction: active ? "var(--ease-settle)" : "var(--ease-sharp)",
      }}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md h-full bg-cw-surface border-l border-cw-border flex flex-col transform transition-transform duration-slow ${
          active ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          transitionTimingFunction: active ? "var(--ease-settle)" : "var(--ease-sharp)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cw-border flex-shrink-0">
          <h2 className="text-sm font-black uppercase tracking-widest text-cw-text-primary">
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-cw-text-tertiary hover:text-cw-text-secondary transition-colors duration-fast ease-snap"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          {/* Display Name */}
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-cw-text-tertiary">
              Display Name
            </span>
            <input
              type="text"
              value={name}
              maxLength={32}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-cw-border bg-cw-surface-2 text-cw-text-primary placeholder-cw-text-tertiary outline-none focus:border-cw-text-secondary transition-colors duration-fast ease-snap"
              placeholder="Display name…"
            />
          </label>

          {/* Bio */}
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-cw-text-tertiary">
              Bio
            </span>
            <textarea
              value={localBio}
              maxLength={160}
              rows={3}
              onChange={(e) => setLocalBio(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-cw-border bg-cw-surface-2 text-cw-text-primary placeholder-cw-text-tertiary outline-none resize-none focus:border-cw-text-secondary transition-colors duration-fast ease-snap"
              placeholder="Tell the arena who you are…"
            />
            <span className="text-[10px] text-cw-text-tertiary text-right font-mono tabular-nums">
              {localBio.length} / 160
            </span>
          </label>

          {/* Profile Image (Avatar) */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-cw-text-tertiary">
              Profile Image (Avatar)
            </span>
            <div className="flex justify-center py-2">
              <label
                onDragEnter={handleDragAvatar}
                onDragOver={handleDragAvatar}
                onDragLeave={handleDragAvatar}
                onDrop={handleDropAvatar}
                className={`w-28 h-28 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group transition-all duration-fast ease-snap ${
                  dragActiveAvatar
                    ? "border-cw-accent bg-cw-accent-muted/20"
                    : "border-cw-border bg-cw-surface-2 hover:border-cw-text-secondary"
                }`}
              >
                {avatar.trim() ? (
                  <>
                    <img
                      src={avatar}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector(".avatar-fallback");
                          if (fallback) fallback.classList.remove("hidden");
                        }
                      }}
                    />
                    {/* Hover edit overlay */}
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[9px] text-cw-text-primary font-bold transition-opacity duration-fast ease-snap gap-1">
                      <UploadCloud className="w-4 h-4 text-cw-text-primary" />
                      <span>Drop or Click</span>
                    </div>
                  </>
                ) : (
                  <div className="avatar-fallback flex flex-col items-center text-center p-2 text-cw-text-tertiary group-hover:text-cw-text-secondary">
                    <UploadCloud className="w-5 h-5 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                      Upload
                    </span>
                  </div>
                )}

                {/* Uploading overlay */}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[10px] text-cw-text-primary font-bold">
                    Uploading...
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
          </div>

          {/* Banner Image */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-cw-text-tertiary">
              Banner Image
            </span>
            <label
              onDragEnter={handleDragBanner}
              onDragOver={handleDragBanner}
              onDragLeave={handleDragBanner}
              onDrop={handleDropBanner}
              className={`w-full h-28 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group transition-all duration-fast ease-snap ${
                dragActiveBanner
                  ? "border-cw-accent bg-cw-accent-muted/20"
                  : "border-cw-border bg-cw-surface-2 hover:border-cw-text-secondary"
              }`}
            >
              {banner.trim() ? (
                <>
                  <img
                    src={banner}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const fallback = parent.querySelector(".banner-fallback");
                        if (fallback) fallback.classList.remove("hidden");
                      }
                    }}
                  />
                  {/* Hover edit overlay */}
                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-xs text-cw-text-primary font-bold transition-opacity duration-fast ease-snap gap-1">
                    <UploadCloud className="w-5 h-5 text-cw-text-primary" />
                    <span>Drop or Click to upload banner</span>
                  </div>
                </>
              ) : (
                <div className="banner-fallback flex flex-col items-center text-center p-4 text-cw-text-tertiary group-hover:text-cw-text-secondary">
                  <UploadCloud className="w-6 h-6 mb-1.5" />
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                    Drag & drop banner or click to upload
                  </span>
                </div>
              )}

              {/* Uploading overlay */}
              {uploadingBanner && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-xs text-cw-text-primary font-bold">
                  Uploading...
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBannerUpload(file);
                }}
                disabled={uploadingBanner}
              />
            </label>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-4 border-t border-cw-border pt-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-cw-text-tertiary">
              Privacy & Layout Settings
            </h3>
            
            {/* Hide Online Status Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-cw-text-primary">
                  Hide Online Status
                </span>
                <span className="text-[10px] text-cw-text-secondary">
                  Do not show the online status indicator on your profile page.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={hideOnline}
                onClick={() => setHideOnline(!hideOnline)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-fast ease-snap ${
                  hideOnline ? "bg-cw-accent" : "bg-cw-surface-2 border border-cw-border"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-cw-text-primary transition-transform duration-fast ease-snap ${
                    hideOnline ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Achievements Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-cw-text-primary">
                  Show Achievements
                </span>
                <span className="text-[10px] text-cw-text-secondary">
                  Display your earned achievements grid on your public profile.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showAchievementsFlag}
                onClick={() => setShowAchievementsFlag(!showAchievementsFlag)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-fast ease-snap ${
                  showAchievementsFlag ? "bg-cw-accent" : "bg-cw-surface-2 border border-cw-border"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-cw-text-primary transition-transform duration-fast ease-snap ${
                    showAchievementsFlag ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-cw-border flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 h-8 text-xs font-semibold rounded-lg border border-cw-border text-cw-text-secondary hover:text-cw-text-primary hover:border-cw-text-secondary transition-colors duration-fast ease-snap"
          >
            Cancel
          </button>
          <button
            id="profile-edit-save"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 h-8 text-xs font-bold transition-colors duration-fast ease-snap disabled:opacity-50"
            style={{
              background: "var(--color-accent)",
              color: "var(--color-text-on-accent)",
              clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
            }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
