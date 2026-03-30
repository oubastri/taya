import type { User, FriendData } from "@/types/user";
import type { LikePerson } from "@/types/likes";
import type { Workout, ActivityType } from "@/types/workout";

/** Matches `FeedMode` from the home feed toggle (RPC `fetch_feed_*`). */
export type FeedListMode = "team" | "stadium";
import {
  loadWorkouts,
  saveWorkouts,
  loadUser,
  saveUser,
  loadFriends,
  saveFriends,
  isSeeded,
  markSeeded,
} from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { normalizeHandle, validateHandleFormat } from "@/lib/handle";

export const isRealMode = process.env.NEXT_PUBLIC_DATA_MODE === "real";

const USE_SEED_KEY = "taya-v2-use-seed";

export interface DataAdapter {
  getWorkouts(): Workout[];
  setWorkouts(workouts: Workout[]): void;
  getUser(): User | null;
  setUser(user: User): void;
  getFriends(): FriendData[];
  setFriends(friends: FriendData[]): void;
  isSeeded(): boolean;
  markSeeded(): void;
  shouldUseSeed(): boolean;
  setSeedEnabled(value: boolean): void;
  clearAll(): void;
}

// ---------------------------------------------------------------------------
// Mock adapter — localStorage via storage.ts
// ---------------------------------------------------------------------------
const mockAdapter: DataAdapter = {
  getWorkouts: loadWorkouts,
  setWorkouts: saveWorkouts,
  getUser: loadUser,
  setUser: saveUser,
  getFriends: loadFriends,
  setFriends: saveFriends,
  isSeeded,
  markSeeded,

  shouldUseSeed() {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(USE_SEED_KEY);
    return stored === null ? true : stored === "true";
  },

  setSeedEnabled(value: boolean) {
    if (typeof window === "undefined") return;
    localStorage.setItem(USE_SEED_KEY, String(value));
    localStorage.removeItem("taya-v2-seeded");
    if (!value) {
      localStorage.removeItem("taya-v2-friends");
      localStorage.removeItem("taya-v2-workouts");
    }
  },

  clearAll() {
    if (typeof window === "undefined") return;
    const keys = [
      "taya-v2-seeded",
      "taya-v2-friends",
      "taya-v2-workouts",
      "taya-v2-user",
      USE_SEED_KEY,
    ];
    keys.forEach((k) => localStorage.removeItem(k));
  },
};

// ---------------------------------------------------------------------------
// Supabase adapter — in-memory cache + async helpers for real DB operations
// ---------------------------------------------------------------------------
const supabaseCache = {
  user: null as User | null,
  workouts: [] as Workout[],
  friends: [] as FriendData[],
};

const supabaseAdapter: DataAdapter = {
  getWorkouts: () => supabaseCache.workouts,
  setWorkouts: (w) => { supabaseCache.workouts = w; },
  getUser: () => supabaseCache.user,
  setUser: (u) => { supabaseCache.user = u; },
  getFriends: () => supabaseCache.friends,
  setFriends: (f) => { supabaseCache.friends = f; },
  isSeeded: () => true,
  markSeeded: () => {},
  shouldUseSeed: () => false,
  setSeedEnabled: () => {},
  clearAll: () => {
    supabaseCache.user = null;
    supabaseCache.workouts = [];
    supabaseCache.friends = [];
  },
};

// ---------------------------------------------------------------------------
// Auth user ID cache — avoids a network round-trip on every Supabase call
// ---------------------------------------------------------------------------

let cachedAuthUserId: string | null = null;

function supabase() {
  return createClient();
}

async function getAuthUserId(): Promise<string | null> {
  if (cachedAuthUserId) return cachedAuthUserId;
  const client = supabase();
  const { data: { session } } = await client.auth.getSession();
  if (session?.user?.id) {
    cachedAuthUserId = session.user.id;
    return cachedAuthUserId;
  }
  const { data: { user } } = await client.auth.getUser();
  if (user?.id) {
    cachedAuthUserId = user.id;
    return cachedAuthUserId;
  }
  return null;
}

type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

/** When `profiles` has no row or `handle` is empty, derive a valid handle from auth. */
function deriveHandleFromAuth(authUser: AuthUserLike): string {
  const meta = authUser.user_metadata ?? {};
  const metaStrings = [meta.handle, meta.preferred_username, meta.user_name];
  for (const c of metaStrings) {
    if (typeof c === "string") {
      const h = normalizeHandle(c);
      if (validateHandleFormat(h) === null) return h;
    }
  }
  const email = authUser.email;
  if (email) {
    const local = email.split("@")[0]!.toLowerCase();
    const slug = local.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "user";
    let h = normalizeHandle(slug).slice(0, 20);
    if (validateHandleFormat(h) === null) return h;
  }
  const idCompact = authUser.id.replace(/-/g, "");
  const h = normalizeHandle(("user_" + idCompact).slice(0, 20));
  if (validateHandleFormat(h) === null) return h;
  return normalizeHandle(("u_" + idCompact).slice(0, 20));
}

function mapProfileRowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: (row.name as string) ?? "",
    handle: (row.handle as string) ?? "",
    avatarUrl: (row.avatar_url as string | null) ?? undefined,
    email: (row.email as string | null) ?? undefined,
    phone: (row.phone as string | null) ?? undefined,
    location: (row.location as string | null) ?? undefined,
    tagline: (row.tagline as string | null) ?? undefined,
    bio: (row.bio as string | null) ?? undefined,
    prompts: (row.prompts as User["prompts"]) ?? undefined,
  };
}

function userFromAuthOnly(authUser: AuthUserLike): User {
  const meta = authUser.user_metadata ?? {};
  const email = authUser.email ?? undefined;
  const name =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    (email ? email.split("@")[0]! : "You");
  return {
    id: authUser.id,
    name,
    handle: deriveHandleFromAuth(authUser),
    email,
  };
}

export function clearAuthCache() {
  cachedAuthUserId = null;
}

// ---- User / Profile ----

export async function fetchUserProfile(): Promise<User | null> {
  const client = supabase();

  const { data: { session } } = await client.auth.getSession();
  const { data: { user: verifiedUser } } = await client.auth.getUser();

  /** Prefer verified JWT user; fall back to session so we still hydrate if getUser lags. */
  const authUser = verifiedUser ?? session?.user ?? null;
  if (!authUser?.id) return null;

  const uid = authUser.id;
  cachedAuthUserId = uid;

  const { data: row } = await client.from("profiles").select("*").eq("id", uid).maybeSingle();

  if (row) {
    const user = mapProfileRowToUser(row as Record<string, unknown>);
    const clean = normalizeHandle(user.handle);
    if (!clean || validateHandleFormat(clean) !== null) {
      user.handle = deriveHandleFromAuth(authUser);
    }
    supabaseCache.user = user;
    return user;
  }

  const fallback = userFromAuthOnly(authUser);
  supabaseCache.user = fallback;
  return fallback;
}

export async function updateUserProfile(updates: Partial<User>): Promise<void> {
  const uid = await getAuthUserId();
  if (!uid) return;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.handle !== undefined) dbUpdates.handle = updates.handle;
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.tagline !== undefined) dbUpdates.tagline = updates.tagline;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  if (updates.prompts !== undefined) dbUpdates.prompts = updates.prompts;

  await supabase().from("profiles").update(dbUpdates).eq("id", uid);
}

// ---- Workouts ----

export async function fetchWorkouts(): Promise<Workout[]> {
  const uid = await getAuthUserId();
  if (!uid) return [];

  const { data } = await supabase()
    .from("workouts")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });

  const workouts: Workout[] = (data ?? []).map((w) => ({
    id: w.id,
    date: w.date,
    description: w.description ?? "",
    createdAt: w.created_at,
    activityType: (w.activity_type ?? "other") as ActivityType,
  }));
  supabaseCache.workouts = workouts;
  return workouts;
}

/** All workouts for another user's profile (RLS: any authenticated reader). */
export async function fetchWorkoutsForUser(profileUserId: string): Promise<Workout[]> {
  if (!profileUserId) return [];

  const { data, error } = await supabase()
    .from("workouts")
    .select("*")
    .eq("user_id", profileUserId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((w) => ({
    id: w.id,
    date: w.date,
    description: w.description ?? "",
    createdAt: w.created_at,
    activityType: (w.activity_type ?? "other") as ActivityType,
  }));
}

export type FeedPageCursor = {
  date: string;
  createdAt: string;
  id: string;
};

export type FeedPageItem = Workout & {
  userId: string;
  userName: string;
  userHandle: string;
  userAvatarUrl?: string;
  likeCount: number;
  likedByMe: boolean;
};

type RpcFeedRow = {
  id: string;
  user_id: string;
  date: string;
  description: string;
  activity_type: string;
  created_at: string;
  author_name: string;
  author_handle: string;
  author_avatar_url: string | null;
  like_count: number | string;
  liked_by_me: boolean;
};

function mapRpcFeedRow(row: RpcFeedRow): FeedPageItem {
  const cnt =
    typeof row.like_count === "string" ? parseInt(row.like_count, 10) : row.like_count;
  return {
    id: row.id,
    date: row.date,
    description: row.description ?? "",
    createdAt: row.created_at,
    activityType: (row.activity_type ?? "other") as ActivityType,
    userId: row.user_id,
    userName: row.author_name ?? "",
    userHandle: row.author_handle ?? "",
    userAvatarUrl: row.author_avatar_url ?? undefined,
    likeCount: Number.isFinite(cnt) ? cnt : 0,
    likedByMe: Boolean(row.liked_by_me),
  };
}

export async function fetchFeedTotal(mode: FeedListMode): Promise<number> {
  const uid = await getAuthUserId();
  if (!uid) return 0;

  const { data, error } = await supabase().rpc("fetch_feed_total", {
    p_feed_mode: mode,
  });

  if (error) throw error;
  const n = data as number | string | null;
  if (n == null) return 0;
  return typeof n === "string" ? parseInt(n, 10) : n;
}

/**
 * Cursor-based page of feed rows with like counts (server-side).
 * Requests `pageSize + 1` rows to detect `hasMore`.
 */
export async function fetchFeedPage(
  mode: FeedListMode,
  cursor: FeedPageCursor | null,
  pageSize: number,
): Promise<{ items: FeedPageItem[]; hasMore: boolean }> {
  const uid = await getAuthUserId();
  if (!uid) return { items: [], hasMore: false };

  const want = Math.max(1, pageSize) + 1;
  const { data, error } = await supabase().rpc("fetch_feed_page", {
    p_feed_mode: mode,
    p_after_date: cursor?.date ?? null,
    p_after_created_at: cursor?.createdAt ?? null,
    p_after_id: cursor?.id ?? null,
    p_fetch_limit: want,
  });

  if (error) throw error;
  const rows = (data ?? []) as RpcFeedRow[];
  const hasMore = rows.length > pageSize;
  const slice = hasMore ? rows.slice(0, pageSize) : rows;
  return {
    items: slice.map(mapRpcFeedRow),
    hasMore,
  };
}

export async function addWorkoutSupabase(
  date: string,
  description: string,
  activityType: ActivityType = "other",
): Promise<Workout | null> {
  const uid = await getAuthUserId();
  if (!uid) return null;

  const { data, error } = await supabase()
    .from("workouts")
    .insert({ user_id: uid, date, description, activity_type: activityType })
    .select()
    .single();

  if (error || !data) return null;

  const workout: Workout = {
    id: data.id,
    date: data.date,
    description: data.description ?? "",
    createdAt: data.created_at,
    activityType: (data.activity_type ?? "other") as ActivityType,
  };
  supabaseCache.workouts = [workout, ...supabaseCache.workouts];
  return workout;
}

export async function deleteWorkoutSupabase(id: string): Promise<void> {
  const { error } = await supabase().from("workouts").delete().eq("id", id);
  if (error) throw error;
  supabaseCache.workouts = supabaseCache.workouts.filter((w) => w.id !== id);
}

export async function updateWorkoutSupabase(
  id: string,
  updates: { date?: string; description?: string; activityType?: ActivityType },
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.activityType !== undefined) dbUpdates.activity_type = updates.activityType;

  const { error } = await supabase().from("workouts").update(dbUpdates).eq("id", id);
  if (error) throw error;

  supabaseCache.workouts = supabaseCache.workouts.map((w) =>
    w.id === id ? { ...w, ...updates } : w,
  );
}

// ---- Friends / Follows ----

export async function fetchFriends(): Promise<FriendData[]> {
  const uid = await getAuthUserId();
  if (!uid) return [];

  const [{ data: follows }, { data: profiles }] = await Promise.all([
    supabase().from("follows").select("following_id").eq("follower_id", uid),
    supabase().from("profiles").select("*").neq("id", uid),
  ]);

  const followingIds = new Set((follows ?? []).map((f) => f.following_id));

  const friends: FriendData[] = (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.name ?? "",
    handle: p.handle ?? "",
    avatarUrl: p.avatar_url ?? undefined,
    email: p.email ?? undefined,
    phone: p.phone ?? undefined,
    location: p.location ?? undefined,
    tagline: p.tagline ?? undefined,
    bio: p.bio ?? undefined,
    prompts: p.prompts ?? undefined,
    following: followingIds.has(p.id),
    workouts: [],
  }));

  supabaseCache.friends = friends;
  return friends;
}

export async function followUserSupabase(followingId: string): Promise<void> {
  const uid = await getAuthUserId();
  if (!uid) return;
  const { error } = await supabase()
    .from("follows")
    .insert({ follower_id: uid, following_id: followingId });
  if (error) throw error;
}

export async function unfollowUserSupabase(followingId: string): Promise<void> {
  const uid = await getAuthUserId();
  if (!uid) return;
  const { error } = await supabase()
    .from("follows")
    .delete()
    .eq("follower_id", uid)
    .eq("following_id", followingId);
  if (error) throw error;
}

// ---- Likes ----

export async function fetchLikesForWorkouts(
  workoutIds: string[],
): Promise<Record<string, { count: number; likedByMe: boolean }>> {
  if (workoutIds.length === 0) return {};
  const uid = await getAuthUserId();
  if (!uid) return {};

  const { data } = await supabase()
    .from("likes")
    .select("workout_id, user_id")
    .in("workout_id", workoutIds);

  const result: Record<string, { count: number; likedByMe: boolean }> = {};
  for (const id of workoutIds) {
    result[id] = { count: 0, likedByMe: false };
  }
  for (const row of data ?? []) {
    if (!result[row.workout_id]) {
      result[row.workout_id] = { count: 0, likedByMe: false };
    }
    result[row.workout_id].count++;
    if (row.user_id === uid) {
      result[row.workout_id].likedByMe = true;
    }
  }
  return result;
}

export async function fetchWorkoutLikersSupabase(
  workoutId: string,
): Promise<LikePerson[]> {
  const { data: likeRows } = await supabase()
    .from("likes")
    .select("user_id")
    .eq("workout_id", workoutId);

  const ids = (likeRows ?? []).map((r) => r.user_id as string).filter(Boolean);
  if (ids.length === 0) return [];

  const { data: profiles } = await supabase()
    .from("profiles")
    .select("id, name, handle, avatar_url")
    .in("id", ids);

  const rows: LikePerson[] = (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.name ?? "",
    handle: p.handle ?? "",
    avatarUrl: p.avatar_url ?? undefined,
  }));

  const order = new Map(ids.map((id, i) => [id, i]));
  rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return rows;
}

export async function toggleLikeSupabase(
  workoutId: string,
): Promise<{ liked: boolean } | null> {
  const uid = await getAuthUserId();
  if (!uid) return null;

  const { data: existing } = await supabase()
    .from("likes")
    .select("user_id")
    .eq("user_id", uid)
    .eq("workout_id", workoutId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase()
      .from("likes")
      .delete()
      .eq("user_id", uid)
      .eq("workout_id", workoutId);
    if (error) return null;
    return { liked: false };
  } else {
    const { error } = await supabase()
      .from("likes")
      .insert({ user_id: uid, workout_id: workoutId });
    if (error) return null;
    return { liked: true };
  }
}

// ---------------------------------------------------------------------------
// Public accessor
// ---------------------------------------------------------------------------

export function getAdapter(): DataAdapter {
  if (isRealMode) return supabaseAdapter;
  return mockAdapter;
}
