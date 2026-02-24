"use client";

import { useCallback, useEffect, useState } from "react";
import type { Workout, ActivityType } from "@/types/workout";
import { toDateKey } from "@/types/workout";
import { loadWorkouts, saveWorkouts } from "@/lib/storage";

export type Stats = {
  total: number;
  thisYear: number;
  thisMonth: number;
  thisWeek: number;
};

const WORKOUTS_CHANGED_EVENT = "taya:workouts-changed";

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

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setWorkouts(loadWorkouts());
    setHydrated(true);

    const handler = () => setWorkouts(loadWorkouts());
    window.addEventListener(WORKOUTS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(WORKOUTS_CHANGED_EVENT, handler);
  }, []);

  const persist = useCallback((next: Workout[]) => {
    setWorkouts(next);
    saveWorkouts(next);
    window.dispatchEvent(new CustomEvent(WORKOUTS_CHANGED_EVENT));
  }, []);

  const addWorkout = useCallback(
    (date: string, description: string, activityType: ActivityType = "other") => {
      const id = crypto.randomUUID();
      const created = new Date().toISOString();
      const newWorkout: Workout = { id, date, description, createdAt: created, activityType };
      // Reload fresh to avoid stale closures (LogSheet has its own instance)
      const current = loadWorkouts();
      persist([...current, newWorkout]);
    },
    [persist]
  );

  const deleteWorkout = useCallback(
    (id: string) => {
      const current = loadWorkouts();
      persist(current.filter((w) => w.id !== id));
    },
    [persist]
  );

  const updateWorkout = useCallback(
    (
      id: string,
      updates: { date?: string; description?: string; activityType?: ActivityType }
    ) => {
      const current = loadWorkouts();
      persist(
        current.map((w) =>
          w.id === id ? { ...w, ...updates } : w
        )
      );
    },
    [persist]
  );

  const stats = getStats(workouts);

  return {
    workouts,
    hydrated,
    stats,
    addWorkout,
    deleteWorkout,
    updateWorkout,
    hasWorkoutOn: (date: string) => workouts.some((w) => w.date === date),
    workoutsOnDate: (date: string) => workouts.filter((w) => w.date === date),
  };
}
