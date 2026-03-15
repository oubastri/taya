"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastVariant = "default" | "error" | "success";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

let _nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "default") => {
      const id = ++_nextId;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        3000,
      );
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: "max(24px, env(safe-area-inset-bottom))",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column-reverse",
          gap: 8,
          zIndex: 9999,
          pointerEvents: "none",
          maxWidth: "calc(100vw - 48px)",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-fade-in-up"
            style={{
              padding: "12px 24px",
              borderRadius: "var(--radius-full)",
              backgroundColor:
                t.variant === "error" ? "#e53e3e" : "var(--foreground)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              textAlign: "center",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              pointerEvents: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
