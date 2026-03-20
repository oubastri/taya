"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@/types/user";
import { createClient } from "@/lib/supabase/client";
import {
  getAdapter,
  isRealMode,
  fetchUserProfile,
  updateUserProfile,
  clearAuthCache,
} from "@/lib/data-adapter";

const adapter = getAdapter();

const DEFAULT_USER: User = {
  id: "me",
  name: "You",
  handle: "me",
};

let sharedUser: User = DEFAULT_USER;
let sharedHydrated = false;
const subscribers = new Set<(u: User) => void>();

function notifyAll() {
  subscribers.forEach((fn) => fn(sharedUser));
}

function hydrateOnce() {
  if (sharedHydrated) return;

  if (isRealMode) {
    fetchUserProfile()
      .then((u) => {
        if (u) sharedUser = u;
      })
      .catch(() => {
        /* keep DEFAULT_USER; still unblock UI */
      })
      .finally(() => {
        sharedHydrated = true;
        notifyAll();
      });
  } else {
    sharedHydrated = true;
    const CORRECT_AVATAR_URL = "/profilephotos/user10.jpg";
    let stored = adapter.getUser();
    if (stored && stored.avatarUrl !== CORRECT_AVATAR_URL) {
      stored = { ...stored, avatarUrl: CORRECT_AVATAR_URL };
      adapter.setUser(stored);
    }
    if (stored) sharedUser = stored;
    notifyAll();
  }
}

export function useUser() {
  const [user, setUser] = useState<User>(sharedUser);
  const [hydrated, setHydrated] = useState(sharedHydrated);

  useEffect(() => {
    const listener = (u: User) => {
      setUser(u);
      setHydrated(true);
    };
    subscribers.add(listener);

    if (sharedHydrated) {
      setUser(sharedUser);
      setHydrated(true);
    }

    hydrateOnce();

    return () => { subscribers.delete(listener); };
  }, []);

  useEffect(() => {
    if (!isRealMode) return;

    const client = createClient();
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        clearAuthCache();
        sharedUser = DEFAULT_USER;
        sharedHydrated = true;
        adapter.setUser(sharedUser);
        notifyAll();
        return;
      }
      if (
        session?.user &&
        (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
      ) {
        clearAuthCache();
        void fetchUserProfile().then((u) => {
          if (u) {
            sharedUser = u;
            adapter.setUser(sharedUser);
            notifyAll();
          }
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    sharedUser = { ...sharedUser, ...updates };
    adapter.setUser(sharedUser);
    notifyAll();
    if (isRealMode) {
      updateUserProfile(updates);
    }
  }, []);

  return { user, hydrated, updateUser };
}
