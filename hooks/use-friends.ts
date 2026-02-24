"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FriendData } from "@/types/user";
import type { Workout } from "@/types/workout";
import { loadFriends, saveFriends, isSeeded, markSeeded } from "@/lib/storage";
import { SEED_FRIENDS } from "@/lib/seed-data";

export type FeedItem = Workout & {
  userId: string;
  userName: string;
  userHandle: string;
  userAvatarUrl?: string;
};

export function useFriends() {
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isSeeded()) {
      const seeded: FriendData[] = SEED_FRIENDS.map((f) => ({ ...f, following: true }));
      saveFriends(seeded);
      markSeeded();
      setFriends(seeded);
    } else {
      setFriends(loadFriends());
    }
    setHydrated(true);
  }, []);

  const follow = useCallback((id: string) => {
    setFriends((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, following: true } : f));
      saveFriends(next);
      return next;
    });
  }, []);

  const unfollow = useCallback((id: string) => {
    setFriends((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, following: false } : f));
      saveFriends(next);
      return next;
    });
  }, []);

  const followedFriends = useMemo(
    () => friends.filter((f) => f.following),
    [friends]
  );

  const getFeedWorkouts = useCallback(
    (myWorkouts: Workout[], currentUserAvatarUrl?: string): FeedItem[] => {
      const myItems: FeedItem[] = myWorkouts.map((w) => ({
        ...w,
        userId: "me",
        userName: "You",
        userHandle: "me",
        userAvatarUrl: currentUserAvatarUrl,
      }));
      const friendItems: FeedItem[] = followedFriends.flatMap((f) =>
        f.workouts.map((w) => ({
          ...w,
          userId: f.id,
          userName: f.name,
          userHandle: f.handle,
          userAvatarUrl: f.avatarUrl,
        }))
      );
      return [...myItems, ...friendItems].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );
    },
    [followedFriends]
  );

  return { friends, hydrated, follow, unfollow, followedFriends, getFeedWorkouts };
}
