"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@/types/user";
import { loadUser, saveUser } from "@/lib/storage";

const DEFAULT_USER: User = {
  id: "me",
  name: "You",
  handle: "me",
};

export function useUser() {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [hydrated, setHydrated] = useState(false);

  const CORRECT_AVATAR_URL = "/pfp/profile.jpg"; // user10 from :profilephotos:

  useEffect(() => {
    let stored = loadUser();
    // Force current user's profile photo to user10 (profile.jpg) — migrate any old URL
    if (stored && stored.avatarUrl !== CORRECT_AVATAR_URL) {
      stored = { ...stored, avatarUrl: CORRECT_AVATAR_URL };
      saveUser(stored);
    }
    if (stored) setUser(stored);
    setHydrated(true);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      saveUser(next);
      return next;
    });
  }, []);

  return { user, hydrated, updateUser };
}
