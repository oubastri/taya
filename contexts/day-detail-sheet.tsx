"use client";

import { createContext, useCallback, useContext, useState } from "react";

type DayDetailSheetContextValue = {
  isOpen: boolean;
  dateKey: string | null;
  open: (dateKey: string) => void;
  close: () => void;
};

const DayDetailSheetContext = createContext<DayDetailSheetContextValue>({
  isOpen: false,
  dateKey: null,
  open: () => {},
  close: () => {},
});

export function DayDetailSheetProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateKey, setDateKey] = useState<string | null>(null);

  const open = useCallback((key: string) => {
    setDateKey(key);
    setIsOpen(false);
    // Next frame: paint sheet at translateY(100%), then open so it animates up
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsOpen(true));
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Clear dateKey after sheet finishes animating out (0.32s)
    setTimeout(() => setDateKey(null), 320);
  }, []);

  return (
    <DayDetailSheetContext.Provider value={{ isOpen, dateKey, open, close }}>
      {children}
    </DayDetailSheetContext.Provider>
  );
}

export function useDayDetailSheet() {
  return useContext(DayDetailSheetContext);
}
