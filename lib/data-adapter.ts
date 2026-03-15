import type { User, FriendData } from "@/types/user";
import type { Workout, ActivityType } from "@/types/workout";
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
  const { data: { user } } = await supabase().auth.getUser();
  cachedAuthUserId = user?.id ?? null;
  return cachedAuthUserId;
}

export function clearAuthCache() {
  cachedAuthUserId = null;
}

// ---- User / Profile ----

export async function fetchUserProfile(): Promise<User | null> {
  const uid = await getAuthUserId();
  if (!uid) return null;

  const { data } = await supabase()
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .single();

  if (!data) return null;

  const user: User = {
    id: data.id,
    name: data.name ?? "",
    handle: data.handle ?? "",
    avatarUrl: data.avatar_url ?? undefined,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
  };
  supabaseCache.user = user;
  return user;
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

  const friendIds = (profiles ?? []).map((p) => p.id);
  const workoutsByUser: Record<string, Workout[]> = {};

  if (friendIds.length > 0) {
    const { data: wRows } = await supabase()
      .from("workouts")
      .select("*")
      .in("user_id", friendIds);

    for (const w of wRows ?? []) {
      const mapped: Workout = {
        id: w.id,
        date: w.date,
        description: w.description ?? "",
        createdAt: w.created_at,
        activityType: (w.activity_type ?? "other") as ActivityType,
      };
      (workoutsByUser[w.user_id] ??= []).push(mapped);
    }
  }

  const friends: FriendData[] = (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.name ?? "",
    handle: p.handle ?? "",
    avatarUrl: p.avatar_url ?? undefined,
    email: p.email ?? undefined,
    phone: p.phone ?? undefined,
    following: followingIds.has(p.id),
    workouts: workoutsByUser[p.id] ?? [],
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
