import type { LikePerson, LikeState } from "@/types/likes";

const LOCAL_LIKES_KEY = "taya-v2-entity-likes";

type Stored = Record<string, { likers: LikePerson[] }>;

function readAll(): Stored {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_LIKES_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    return p && typeof p === "object" ? (p as Stored) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Stored): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_LIKES_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPersistedLocalEntityId(entityId: string, realMode: boolean): boolean {
  if (!entityId) return false;
  if (entityId.startsWith("profile-prompt:")) return true;
  if (!realMode) return true;
  return !UUID_RE.test(entityId);
}

/** Workout likes stored in Supabase `likes` table (UUID workout id, real mode). */
export function isSupabaseWorkoutLikeTarget(entityId: string, realMode: boolean): boolean {
  return Boolean(realMode && UUID_RE.test(entityId));
}

export function getLocalLikeState(
  entityId: string,
  viewerId: string | null,
): LikeState {
  const likers = readAll()[entityId]?.likers ?? [];
  return {
    count: likers.length,
    likedByMe: Boolean(viewerId && likers.some((l) => l.id === viewerId)),
  };
}

export function getLocalLikers(entityId: string): LikePerson[] {
  const likers = readAll()[entityId]?.likers ?? [];
  return [...likers];
}

export function applyLocalLikeToggle(
  entityId: string,
  viewer: LikePerson,
  wantLiked: boolean,
): void {
  const all = readAll();
  const cur = all[entityId]?.likers ?? [];
  let next: LikePerson[];
  if (wantLiked) {
    next = cur.some((l) => l.id === viewer.id) ? cur : [...cur, viewer];
  } else {
    next = cur.filter((l) => l.id !== viewer.id);
  }
  all[entityId] = { likers: next };
  writeAll(all);
}
