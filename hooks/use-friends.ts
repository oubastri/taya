"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FriendData } from "@/types/user";
import type { Workout } from "@/types/workout";
import {
  getAdapter,
  isRealMode,
  fetchFriends,
  followUserSupabase,
  unfollowUserSupabase,
} from "@/lib/data-adapter";
import { useToast } from "@/contexts/toast";
import { SEED_FRIENDS } from "@/lib/seed-data";

const adapter = getAdapter();

export type FeedItem = Workout & {
  userId: string;
  userName: string;
  userHandle: string;
  userAvatarUrl?: string;
};

export function useFriends() {
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isRealMode) {
      fetchFriends()
        .then((f) => {
          setFriends(f);
          setHydrated(true);
        })
        .catch(() => {
          toast("Failed to load friends", "error");
          setHydrated(true);
        });
    } else {
      if (!adapter.isSeeded()) {
        if (adapter.shouldUseSeed()) {
          const seeded: FriendData[] = SEED_FRIENDS.map((f) => ({ ...f, following: true }));
          adapter.setFriends(seeded);
          adapter.markSeeded();
          setFriends(seeded);
        } else {
          adapter.markSeeded();
          setFriends([]);
        }
      } else {
        setFriends(adapter.getFriends());
      }
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const follow = useCallback((id: string) => {
    setFriends((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, following: true } : f));
      adapter.setFriends(next);
      return next;
    });
    if (isRealMode) {
      followUserSupabase(id).catch(() => {
        setFriends((prev) => {
          const rollback = prev.map((f) => (f.id === id ? { ...f, following: false } : f));
          adapter.setFriends(rollback);
          return rollback;
        });
        toast("Couldn't follow — try again", "error");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unfollow = useCallback((id: string) => {
    setFriends((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, following: false } : f));
      adapter.setFriends(next);
      return next;
    });
    if (isRealMode) {
      unfollowUserSupabase(id).catch(() => {
        setFriends((prev) => {
          const rollback = prev.map((f) => (f.id === id ? { ...f, following: true } : f));
          adapter.setFriends(rollback);
          return rollback;
        });
        toast("Couldn't unfollow — try again", "error");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const followedFriends = useMemo(
    () => friends.filter((f) => f.following),
    [friends],
  );

  const getFeedWorkouts = useCallback(
    (myWorkouts: Workout[], currentUser: { id: string; name: string; handle: string; avatarUrl?: string }): FeedItem[] => {
      const myItems: FeedItem[] = myWorkouts.map((w) => ({
        ...w,
        userId: currentUser.id,
        userName: currentUser.name,
        userHandle: currentUser.handle,
        userAvatarUrl: currentUser.avatarUrl,
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
        b.createdAt.localeCompare(a.createdAt),
      );
    },
    [followedFriends],
  );

  const getAllFeedWorkouts = useCallback(
    (myWorkouts: Workout[], currentUser: { id: string; name: string; handle: string; avatarUrl?: string }): FeedItem[] => {
      const myItems: FeedItem[] = myWorkouts.map((w) => ({
        ...w,
        userId: currentUser.id,
        userName: currentUser.name,
        userHandle: currentUser.handle,
        userAvatarUrl: currentUser.avatarUrl,
      }));
      const allFriendItems: FeedItem[] = friends.flatMap((f) =>
        f.workouts.map((w) => ({
          ...w,
          userId: f.id,
          userName: f.name,
          userHandle: f.handle,
          userAvatarUrl: f.avatarUrl,
        }))
      );
      return [...myItems, ...allFriendItems].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
    },
    [friends],
  );

  return { friends, hydrated, follow, unfollow, followedFriends, getFeedWorkouts, getAllFeedWorkouts };
}
