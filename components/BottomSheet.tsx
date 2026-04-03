"use client";

import { useState, useEffect, useCallback } from "react";
import { SHEET_EXIT_MS, SHEET_SPRING } from "@/lib/sheetMotion";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  title?: string;
};

/** Above bottom nav (nav uses z-index 50). */
export function BottomSheet({ isOpen, onClose, children, title }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setOpen(false);
      return;
    }
    setOpen(false);
    let cancelled = false;
    const outer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setOpen(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(outer);
    };
  }, [isOpen]);

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(onClose, SHEET_EXIT_MS);
  }, [onClose]);

  useLockBodyScroll(isOpen || open);

  if (!isOpen && !open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end"
      style={{
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Sheet"}
    >
      <div
        className="absolute inset-0"
        style={{
          background: "var(--overlay)",
          opacity: open ? 1 : 0,
          transition: `opacity ${SHEET_SPRING}`,
        }}
        onClick={close}
        aria-hidden
      />

      <div
        className="relative z-10 flex max-h-[85vh] flex-col rounded-t-3xl bg-[var(--sheet-bg)] pb-[env(safe-area-inset-bottom)]"
        style={{
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: `transform ${SHEET_SPRING}`,
          borderTop: "1px solid var(--border)",
          overscrollBehavior: "contain",
        }}
      >
        <div className="flex min-h-11 flex-shrink-0 touch-none select-none items-center justify-center py-2.5">
          <div className="h-1 w-10 shrink-0 rounded-full bg-[var(--drag-handle)]" aria-hidden />
        </div>
        {title ? (
          <h2 className="px-6 pb-2 text-center text-[17px] font-semibold text-[var(--foreground)]">{title}</h2>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pb-6 touch-pan-y">
          {typeof children === "function" ? children(close) : children}
        </div>
      </div>
    </div>
  );
}
