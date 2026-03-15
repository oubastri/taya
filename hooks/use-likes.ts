"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  isRealMode,
  fetchLikesForWorkouts,
  toggleLikeSupabase,
} from "@/lib/data-adapter";

interface LikeState {
  count: number;
  likedByMe: boolean;
}

export function useLikes(workoutIds: string[]) {
  const [likes, setLikes] = useState<Record<string, LikeState>>({});
  const likesRef = useRef(likes);
  likesRef.current = likes;

  const idsKey = useMemo(
    () => [...workoutIds].sort().join(","),
    [workoutIds],
  );

  useEffect(() => {
    if (!isRealMode || workoutIds.length === 0) return;

    fetchLikesForWorkouts(workoutIds).then((result) => {
      setLikes(result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const toggleLike = useCallback(
    async (workoutId: string) => {
      const prev =
        likesRef.current[workoutId] ?? { count: 0, likedByMe: false };
      const optimistic: LikeState = {
        count: prev.likedByMe
          ? Math.max(0, prev.count - 1)
          : prev.count + 1,
        likedByMe: !prev.likedByMe,
      };

      setLikes((s) => ({ ...s, [workoutId]: optimistic }));

      if (!isRealMode) return;

      const result = await toggleLikeSupabase(workoutId);
      if (!result) {
        setLikes((s) => ({ ...s, [workoutId]: prev }));
      }
    },
    [],
  );

  const getLike = useCallback(
    (workoutId: string): LikeState =>
      likes[workoutId] ?? { count: 0, likedByMe: false },
    [likes],
  );

  return { getLike, toggleLike };
}
