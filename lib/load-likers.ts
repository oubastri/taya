"use client";

import {
  isRealMode,
  fetchWorkoutLikersSupabase,
} from "@/lib/data-adapter";
import { getLocalLikers, isSupabaseWorkoutLikeTarget } from "@/lib/likes-local";
import type { LikePerson } from "@/types/likes";

export async function loadLikersForEntity(
  entityId: string,
  followingIds?: Set<string>,
): Promise<LikePerson[]> {
  let people: LikePerson[];
  if (isSupabaseWorkoutLikeTarget(entityId, isRealMode)) {
    people = await fetchWorkoutLikersSupabase(entityId);
  } else {
    people = getLocalLikers(entityId);
  }
  if (!followingIds?.size) return people;
  return people.map((p) => ({
    ...p,
    following: followingIds.has(p.id),
  }));
}
