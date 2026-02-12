"use client";

import { useCallback, useEffect, useState } from "react";
import type { Workout } from "@/types/workout";
import { toDateKey } from "@/types/workout";
import { loadWorkouts, saveWorkouts } from "@/lib/storage";

export type Stats = {
  total: number;
  thisYear: number;
  thisMonth: number;
  thisWeek: number;
};

function getStats(workouts: Workout[]): Stats {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const weekStart = getWeekStart(now);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return {
    total: workouts.length,
    thisYear: workouts.filter((w) => w.date.startsWith(String(year))).length,
    thisMonth: workouts.filter((w) => {
      const [y, m] = w.date.split("-").map(Number);
      return y === year && m === month + 1;
    }).length,
    thisWeek: workouts.filter((w) => {
      const d = new Date(w.date + "T12:00:00");
      return d >= weekStart && d <= endOfToday;
    }).length,
  };
}

function getWeekStart(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

/** Rhythm: consistency over last 4 weeks. Simple: (workouts in period / 12) capped at 100%. */
function getRhythmScore(workouts: Workout[]): number {
  const now = new Date();
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const inPeriod = workouts.filter((w) => {
    const d = new Date(w.date + "T12:00:00");
    return d >= fourWeeksAgo && d <= now;
  }).length;
  const target = 12;
  return Math.min(100, Math.round((inPeriod / target) * 100));
}

/** Current streak: consecutive days with at least one workout ending today. */
function getStreak(workouts: Workout[]): number {
  const keys = Array.from(new Set(workouts.map((w) => w.date))).sort().reverse();
  if (keys.length === 0) return 0;
  const today = toDateKey(new Date());
  if (keys[0] !== today) return 0;
  let streak = 0;
  let cursor = new Date(today + "T12:00:00");
  const set = new Set(keys);
  while (set.has(toDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setWorkouts(loadWorkouts());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: Workout[]) => {
    setWorkouts(next);
    saveWorkouts(next);
  }, []);

  const addWorkout = useCallback(
    (date: string, description: string) => {
      const id = crypto.randomUUID();
      const created = new Date().toISOString();
      const w: Workout = { id, date, description, createdAt: created };
      persist([...workouts, w]);
    },
    [workouts, persist]
  );

  const updateWorkout = useCallback(
    (date: string, description: string) => {
      const rest = workouts.filter((w) => w.date !== date);
      if (description.trim()) {
        const existing = workouts.find((w) => w.date === date);
        const w: Workout = existing
          ? { ...existing, description }
          : {
              id: crypto.randomUUID(),
              date,
              description,
              createdAt: new Date().toISOString(),
            };
        persist([...rest, w]);
      } else {
        persist(rest);
      }
    },
    [workouts, persist]
  );

  const getWorkoutByDate = useCallback(
    (date: string) => workouts.find((w) => w.date === date),
    [workouts]
  );

  const deleteWorkout = useCallback(
    (date: string) => {
      persist(workouts.filter((w) => w.date !== date));
    },
    [workouts, persist]
  );

  const stats = getStats(workouts);
  const rhythmScore = getRhythmScore(workouts);
  const streak = getStreak(workouts);

  return {
    workouts,
    hydrated,
    stats,
    rhythmScore,
    streak,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    getWorkoutByDate,
    hasWorkoutOn: (date: string) => workouts.some((w) => w.date === date),
  };
}
