"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "default" | "error" | "success";

/** Same asset as settings verified handle badge */
const TOAST_VERIFY_ICON = "/icons/nav/verify.svg?v=6";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  exiting: boolean;
}

/** Match `.toast-item--out` duration in globals.css (`--duration-fast` = 0.2s) + small buffer */
const TOAST_EXIT_MS = 240;

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

let _nextId = 0;

const TOAST_MS: Record<ToastVariant, number> = {
  success: 4400,
  default: 3400,
  error: 4200,
};

function ToastLeading({ variant }: { variant: ToastVariant }) {
  if (variant === "error") {
    return (
      <svg
        className="toast-item__icon"
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" fill="rgba(255, 69, 58, 0.2)" />
        <path
          d="M12 8v5M12 16h.01"
          stroke="#ff453a"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <img
      src={TOAST_VERIFY_ICON}
      alt=""
      width={22}
      height={22}
      className="toast-item__verify"
      decoding="async"
      aria-hidden
    />
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "default") => {
      const id = ++_nextId;
      setToasts((prev) => [...prev, { id, message, variant, exiting: false }]);
      window.setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
        );
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, TOAST_EXIT_MS);
      }, TOAST_MS[variant]);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-host" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === "error" ? "alert" : "status"}
            className={`toast-item toast-item--${t.variant} ${
              t.exiting ? "toast-item--out" : "toast-item--in"
            }`}
          >
            <ToastLeading variant={t.variant} />
            <div className="toast-item__body">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
