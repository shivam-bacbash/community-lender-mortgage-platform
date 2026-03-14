"use client";

import { create } from "zustand";

import { isRole as matchesRole } from "@/lib/auth/profile";
import type { Profile, Role } from "@/types/auth";

interface AuthStore {
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  clearProfile: () => void;
  isRole: (role: Role | Role[]) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  clearProfile: () => set({ profile: null }),
  isRole: (role) => {
    const profile = get().profile;

    if (!profile) {
      return false;
    }

    return matchesRole(profile.role, role);
  },
}));
