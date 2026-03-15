"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@/types/user";
import { getAdapter, isRealMode, fetchUserProfile, updateUserProfile } from "@/lib/data-adapter";

const adapter = getAdapter();

const DEFAULT_USER: User = {
  id: "me",
  name: "You",
  handle: "me",
};

export function useUser() {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (isRealMode) {
      fetchUserProfile().then((u) => {
        if (u) setUser(u);
        setHydrated(true);
      });
    } else {
      const CORRECT_AVATAR_URL = "/profilephotos/user10.jpg";
      let stored = adapter.getUser();
      if (stored && stored.avatarUrl !== CORRECT_AVATAR_URL) {
        stored = { ...stored, avatarUrl: CORRECT_AVATAR_URL };
        adapter.setUser(stored);
      }
      if (stored) setUser(stored);
      setHydrated(true);
    }
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      adapter.setUser(next);
      return next;
    });
    if (isRealMode) {
      updateUserProfile(updates);
    }
  }, []);

  return { user, hydrated, updateUser };
}
