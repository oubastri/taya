"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  isRealMode,
  fetchLikesForWorkouts,
  toggleLikeSupabase,
} from "@/lib/data-adapter";
import {
  applyLocalLikeToggle,
  getLocalLikeState,
  isPersistedLocalEntityId,
  isSupabaseWorkoutLikeTarget,
} from "@/lib/likes-local";
import type { LikePerson, LikeState } from "@/types/likes";

export type { LikeState };
export type LikeViewer = LikePerson;

export function useLikes(entityIds: string[], viewer: LikeViewer | null) {
  const [likes, setLikes] = useState<Record<string, LikeState>>({});
  const likesRef = useRef(likes);
  likesRef.current = likes;

  const viewerId = viewer?.id ?? null;
  const likerSnapshot = viewer
    ? {
        id: viewer.id,
        name: viewer.name,
        handle: viewer.handle,
        avatarUrl: viewer.avatarUrl,
      }
    : null;

  const idsKey = useMemo(
    () => [...entityIds].sort().join(","),
    [entityIds],
  );

  useEffect(() => {
    const ids = idsKey.length ? idsKey.split(",") : [];
    if (ids.length === 0) {
      setLikes({});
      return;
    }

    let cancelled = false;

    (async () => {
      const next: Record<string, LikeState> = {};
      const localIds = ids.filter((id) =>
        isPersistedLocalEntityId(id, isRealMode),
      );
      const remoteIds = ids.filter((id) =>
        isSupabaseWorkoutLikeTarget(id, isRealMode),
      );

      for (const id of localIds) {
        next[id] = getLocalLikeState(id, viewerId);
      }

      if (remoteIds.length > 0) {
        const remote = await fetchLikesForWorkouts(remoteIds);
        if (cancelled) return;
        Object.assign(next, remote);
      }

      if (!cancelled) setLikes(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [idsKey, viewerId]);

  const toggleLike = useCallback(
    async (entityId: string) => {
      const prev =
        likesRef.current[entityId] ?? { count: 0, likedByMe: false };
      const optimistic: LikeState = {
        count: prev.likedByMe
          ? Math.max(0, prev.count - 1)
          : prev.count + 1,
        likedByMe: !prev.likedByMe,
      };

      if (isPersistedLocalEntityId(entityId, isRealMode)) {
        if (!likerSnapshot) return;
        const wantLiked = !prev.likedByMe;
        applyLocalLikeToggle(entityId, likerSnapshot, wantLiked);
        setLikes((s) => ({
          ...s,
          [entityId]: getLocalLikeState(entityId, viewerId),
        }));
        return;
      }

      setLikes((s) => ({ ...s, [entityId]: optimistic }));

      if (!isRealMode) return;

      const result = await toggleLikeSupabase(entityId);
      if (!result) {
        setLikes((s) => ({ ...s, [entityId]: prev }));
        return;
      }
      const remote = await fetchLikesForWorkouts([entityId]);
      const updated = remote[entityId];
      if (updated) {
        setLikes((s) => ({ ...s, [entityId]: updated }));
      }
    },
    [likerSnapshot, viewerId],
  );

  const likeIfNeeded = useCallback(
    async (entityId: string) => {
      const cur = likesRef.current[entityId] ?? { count: 0, likedByMe: false };
      if (cur.likedByMe) return;
      await toggleLike(entityId);
    },
    [toggleLike],
  );

  const getLike = useCallback(
    (entityId: string): LikeState =>
      likes[entityId] ?? { count: 0, likedByMe: false },
    [likes],
  );

  return { getLike, toggleLike, likeIfNeeded };
}
