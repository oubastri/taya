import type { FriendData } from "@/types/user";
import type { Workout } from "@/types/workout";

function w(
  id: string,
  date: string,
  activityType: Workout["activityType"],
  description: string
): Workout {
  return {
    id,
    date,
    description,
    createdAt: new Date(date + "T12:00:00").toISOString(),
    activityType,
  };
}

export const SEED_FRIENDS: Omit<FriendData, "following">[] = [
  {
    id: "jordan",
    name: "Jordan Lee",
    handle: "jordan",
    phone: "+15550001234",
    avatarUrl: "/profilephotos/user1.png",
    workouts: [
      w("j1", "2026-02-19", "run", "8 miles tempo"),
      w("j2", "2026-02-17", "run", "easy 5k recovery"),
      w("j3", "2026-02-15", "hike", "trail run at Runyon"),
      w("j4", "2026-02-13", "run", "long run 12 miles"),
      w("j5", "2026-02-10", "run", ""),
      w("j6", "2026-02-08", "hike", "griffith park"),
      w("j7", "2026-02-05", "run", "10k race 🏅"),
      w("j8", "2026-02-02", "run", ""),
      w("j9", "2026-01-29", "run", "fasted morning run"),
      w("j10", "2026-01-25", "hike", ""),
      w("j11", "2026-01-21", "run", ""),
      w("j12", "2026-01-16", "run", "cold but worth it"),
      w("j13", "2026-01-10", "run", ""),
      w("j14", "2026-01-04", "run", "new year, new miles"),
    ],
  },
  {
    id: "maya",
    name: "Maya Chen",
    handle: "maya",
    phone: "+15550005678",
    avatarUrl: "/profilephotos/user2.png",
    workouts: [
      w("m1", "2026-02-18", "yoga", "morning flow 60min"),
      w("m2", "2026-02-16", "swim", "2km open water"),
      w("m3", "2026-02-14", "pilates", "reformer class"),
      w("m4", "2026-02-11", "yoga", "restorative"),
      w("m5", "2026-02-09", "swim", ""),
      w("m6", "2026-02-06", "pilates", "mat pilates"),
      w("m7", "2026-02-03", "yoga", "power yoga"),
      w("m8", "2026-01-28", "swim", "1500m"),
      w("m9", "2026-01-23", "pilates", ""),
      w("m10", "2026-01-19", "yoga", ""),
      w("m11", "2026-01-12", "swim", "masters swim"),
      w("m12", "2026-01-06", "yoga", "first class of the year"),
    ],
  },
  {
    id: "sam",
    name: "Sam Rodriguez",
    handle: "sam",
    phone: "+15550009012",
    avatarUrl: "/profilephotos/user3.png",
    workouts: [
      w("s1", "2026-02-19", "basketball", "5v5 rec league 🏀"),
      w("s2", "2026-02-16", "hiit", "45 min circuit"),
      w("s3", "2026-02-13", "lift", "chest + back"),
      w("s4", "2026-02-10", "basketball", "pickup game"),
      w("s5", "2026-02-07", "hiit", ""),
      w("s6", "2026-02-03", "lift", "leg day 🦵"),
      w("s7", "2026-01-30", "basketball", ""),
      w("s8", "2026-01-25", "hiit", "tabata intervals"),
      w("s9", "2026-01-18", "lift", ""),
      w("s10", "2026-01-08", "basketball", "first game of the year"),
    ],
  },
];
