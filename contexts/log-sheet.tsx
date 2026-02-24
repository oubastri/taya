"use client";

import { createContext, useCallback, useContext, useState } from "react";

type LogSheetContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const LogSheetContext = createContext<LogSheetContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function LogSheetProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <LogSheetContext.Provider value={{ isOpen, open, close }}>
      {children}
    </LogSheetContext.Provider>
  );
}

export function useLogSheet() {
  return useContext(LogSheetContext);
}
