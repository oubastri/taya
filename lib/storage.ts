import type { Workout } from "@/types/workout";
import type { User, FriendData } from "@/types/user";

const OLD_KEY = "to-all-you-athletes-workouts";
const WORKOUTS_KEY = "taya-v2-workouts";
const USER_KEY = "taya-v2-user";
const FRIENDS_KEY = "taya-v2-friends";
const SEEDED_KEY = "taya-v2-seeded";

export function loadWorkouts(): Workout[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WORKOUTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as Workout[]) : [];
    }
    // Migrate from old key
    const oldRaw = localStorage.getItem(OLD_KEY);
    if (oldRaw) {
      const parsed = JSON.parse(oldRaw) as unknown;
      if (Array.isArray(parsed)) {
        const migrated = (parsed as Workout[]).map((w) => ({
          ...w,
          activityType: w.activityType ?? ('other' as const),
        }));
        saveWorkouts(migrated);
        return migrated;
      }
    }
    return [];
  } catch {
    return [];
  }
}

export function saveWorkouts(workouts: Workout[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
  } catch {
    // ignore
  }
}

export function loadUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function saveUser(user: User): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function loadFriends(): FriendData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as FriendData[]) : [];
  } catch {
    return [];
  }
}

export function saveFriends(friends: FriendData[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
  } catch {
    // ignore
  }
}

export function isSeeded(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SEEDED_KEY) === "true";
}

export function markSeeded(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEEDED_KEY, "true");
}
