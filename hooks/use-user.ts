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

  useEffect(() => {
    const stored = loadUser();
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
