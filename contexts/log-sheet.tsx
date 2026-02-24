"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { Workout } from "@/types/workout";

type LogSheetContextValue = {
  isOpen: boolean;
  initialDateKey: string | null;
  workoutToEdit: Workout | null;
  open: (dateKey?: string) => void;
  openForEdit: (workout: Workout) => void;
  close: () => void;
};

const LogSheetContext = createContext<LogSheetContextValue>({
  isOpen: false,
  initialDateKey: null,
  workoutToEdit: null,
  open: () => {},
  openForEdit: () => {},
  close: () => {},
});

export function LogSheetProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialDateKey, setInitialDateKey] = useState<string | null>(null);
  const [workoutToEdit, setWorkoutToEdit] = useState<Workout | null>(null);

  const open = useCallback((dateKey?: string) => {
    setWorkoutToEdit(null);
    setInitialDateKey(dateKey ?? null);
    setIsOpen(true);
  }, []);

  const openForEdit = useCallback((workout: Workout) => {
    setWorkoutToEdit(workout);
    setInitialDateKey(workout.date);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setInitialDateKey(null);
    setWorkoutToEdit(null);
  }, []);

  return (
    <LogSheetContext.Provider value={{ isOpen, initialDateKey, workoutToEdit, open, openForEdit, close }}>
      {children}
    </LogSheetContext.Provider>
  );
}

export function useLogSheet() {
  return useContext(LogSheetContext);
}
