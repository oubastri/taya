"use client";

import { useState, useEffect, useCallback } from "react";

const DURATION_MS = 320;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  title?: string;
};

export function BottomSheet({ isOpen, onClose, children, title }: Props) {
  const [entered, setEntered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const close = useCallback(() => {
    setIsClosing(true);
    const t = setTimeout(() => {
      onClose();
      setIsClosing(false);
      setEntered(false);
    }, DURATION_MS);
    return () => clearTimeout(t);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setEntered(false);
    setIsClosing(false);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(t);
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const sheetVisible = entered && !isClosing;
  const backdropVisible = entered && !isClosing;

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-end"
      style={{
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Sheet"}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/25 transition-opacity duration-300 ease-out"
        style={{ opacity: backdropVisible ? 1 : 0 }}
        onClick={close}
        aria-hidden
      />

      {/* Sheet */}
      <div
        className="relative z-10 flex max-h-[85vh] flex-col rounded-t-3xl bg-[var(--background)] pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-out"
        style={{
          transform: sheetVisible ? "translateY(0)" : "translateY(100%)",
        }}
      >
        {/* Drag handle */}
        <div className="flex flex-shrink-0 justify-center pt-3 pb-1">
          <div
            className="h-1 w-10 rounded-full bg-black/20"
            aria-hidden
          />
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {typeof children === "function" ? children(close) : children}
        </div>
      </div>
    </div>
  );
}
