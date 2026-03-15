"use client";

import { useCallback, useEffect, useState } from "react";
import type { Workout, ActivityType } from "@/types/workout";
import {
  getAdapter,
  isRealMode,
  fetchWorkouts,
  addWorkoutSupabase,
  deleteWorkoutSupabase,
  updateWorkoutSupabase,
} from "@/lib/data-adapter";
import { useToast } from "@/contexts/toast";

const adapter = getAdapter();

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
  const { toast } = useToast();

  useEffect(() => {
    if (isRealMode) {
      fetchWorkouts()
        .then((w) => {
          setWorkouts(w);
          setHydrated(true);
        })
        .catch(() => {
          toast("Failed to load workouts", "error");
          setHydrated(true);
        });
    } else {
      setWorkouts(adapter.getWorkouts());
      setHydrated(true);
    }

    const handler = () => setWorkouts(adapter.getWorkouts());
    window.addEventListener(WORKOUTS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(WORKOUTS_CHANGED_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((next: Workout[]) => {
    setWorkouts(next);
    adapter.setWorkouts(next);
    window.dispatchEvent(new CustomEvent(WORKOUTS_CHANGED_EVENT));
  }, []);

  const addWorkout = useCallback(
    (date: string, description: string, activityType: ActivityType = "other") => {
      if (isRealMode) {
        addWorkoutSupabase(date, description, activityType)
          .then((w) => {
            if (w) {
              setWorkouts((prev) => [w, ...prev]);
              adapter.setWorkouts(adapter.getWorkouts());
              window.dispatchEvent(new CustomEvent(WORKOUTS_CHANGED_EVENT));
            } else {
              toast("Couldn't save workout — try again", "error");
            }
          })
          .catch(() => {
            toast("Couldn't save workout — try again", "error");
          });
        return;
      }
      const id = crypto.randomUUID();
      const created = new Date().toISOString();
      const newWorkout: Workout = { id, date, description, createdAt: created, activityType };
      const current = adapter.getWorkouts();
      persist([...current, newWorkout]);
    },
    [persist, toast],
  );

  const deleteWorkout = useCallback(
    (id: string) => {
      if (isRealMode) {
        setWorkouts((prev) => {
          const next = prev.filter((w) => w.id !== id);
          adapter.setWorkouts(next);
          return next;
        });
        window.dispatchEvent(new CustomEvent(WORKOUTS_CHANGED_EVENT));
        deleteWorkoutSupabase(id).catch(() => {
          fetchWorkouts().then((fresh) => {
            setWorkouts(fresh);
            adapter.setWorkouts(fresh);
            window.dispatchEvent(new CustomEvent(WORKOUTS_CHANGED_EVENT));
          });
          toast("Couldn't delete workout — try again", "error");
        });
        return;
      }
      const current = adapter.getWorkouts();
      persist(current.filter((w) => w.id !== id));
    },
    [persist, toast],
  );

  const updateWorkout = useCallback(
    (
      id: string,
      updates: { date?: string; description?: string; activityType?: ActivityType },
    ) => {
      if (isRealMode) {
        setWorkouts((prev) => {
          const next = prev.map((w) => (w.id === id ? { ...w, ...updates } : w));
          adapter.setWorkouts(next);
          return next;
        });
        window.dispatchEvent(new CustomEvent(WORKOUTS_CHANGED_EVENT));
        updateWorkoutSupabase(id, updates).catch(() => {
          fetchWorkouts().then((fresh) => {
            setWorkouts(fresh);
            adapter.setWorkouts(fresh);
            window.dispatchEvent(new CustomEvent(WORKOUTS_CHANGED_EVENT));
          });
          toast("Couldn't update workout — try again", "error");
        });
        return;
      }
      const current = adapter.getWorkouts();
      persist(current.map((w) => (w.id === id ? { ...w, ...updates } : w)));
    },
    [persist, toast],
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
