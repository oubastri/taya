"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { SHEET_EXIT_MS, SHEET_SPRING } from "@/lib/sheetMotion";

export function formatProfileDaySheetDateLabel(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export type ProfileDayMovesSheetProps = {
  open: boolean;
  dateKey: string | null;
  onClose: () => void;
  moveCount: number;
  children: ReactNode;
};

export function ProfileDayMovesSheet({
  open,
  dateKey,
  onClose,
  moveCount,
  children,
}: ProfileDayMovesSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const sheetDragRef = useRef({ active: false, startY: 0, dy: 0 });

  if (dateKey == null) return null;

  const onHandleDown = (e: React.PointerEvent) => {
    sheetDragRef.current = { active: true, startY: e.clientY, dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };

  const onHandleMove = (e: React.PointerEvent) => {
    if (!sheetDragRef.current.active) return;
    const dy = Math.max(0, e.clientY - sheetDragRef.current.startY);
    sheetDragRef.current.dy = dy;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateX(-50%) translateY(${dy}px)`;
    }
  };

  const onHandleUp = () => {
    if (!sheetDragRef.current.active) return;
    sheetDragRef.current.active = false;
    const { dy } = sheetDragRef.current;
    if (dy > 90) {
      const vh = window.innerHeight;
      if (sheetRef.current) {
        sheetRef.current.style.transition = `transform ${SHEET_SPRING}`;
        sheetRef.current.style.transform = `translateX(-50%) translateY(${vh}px)`;
      }
      if (scrimRef.current) {
        scrimRef.current.style.transition = `opacity ${SHEET_SPRING}`;
        scrimRef.current.style.opacity = "0";
      }
      window.setTimeout(onClose, SHEET_EXIT_MS);
    } else if (sheetRef.current) {
      sheetRef.current.style.transition = `transform ${SHEET_SPRING}`;
      sheetRef.current.style.transform = "translateX(-50%) translateY(0)";
      window.setTimeout(() => {
        if (sheetRef.current) {
          sheetRef.current.style.transition = "";
          sheetRef.current.style.transform = "";
        }
      }, SHEET_EXIT_MS);
    }
  };

  return (
    <>
      <div
        ref={scrimRef}
        onClick={onClose}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99,
          background: "var(--overlay)",
          opacity: open ? 1 : 0,
          transition: `opacity ${SHEET_SPRING}`,
        }}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Moves on ${dateKey}`}
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          width: "100%",
          maxWidth: 428,
          zIndex: 100,
          background: "var(--sheet-bg)",
          borderRadius: "32px 32px 0 0",
          boxShadow: "var(--sheet-shadow)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          maxHeight: "82svh",
          transform: open ? "translateX(-50%)" : "translateX(-50%) translateY(100%)",
          transition: `transform ${SHEET_SPRING}`,
        }}
      >
        <div
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          style={{
            padding: "12px 24px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
            cursor: "grab",
            touchAction: "none",
            userSelect: "none",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "var(--drag-handle)",
            }}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1,
            width: 54,
            height: 54,
            borderRadius: "100px",
            background: "var(--close-btn-bg)",
            border: "1px solid var(--close-btn-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            flexShrink: 0,
          }}
          className="active:scale-95"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--close-btn-icon)"
            strokeWidth="2.6"
            strokeLinecap="round"
            aria-hidden
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
        <div
          style={{
            overflowY: "auto",
            flex: 1,
            WebkitOverflowScrolling: "touch" as CSSProperties["WebkitOverflowScrolling"],
            scrollbarWidth: "none" as CSSProperties["scrollbarWidth"],
          }}
        >
          <div style={{ padding: "20px 20px 0" }}>
            <h2
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "clamp(26px, 7vw, 32px)",
                fontWeight: 500,
                lineHeight: 1.15,
                letterSpacing: "-0.04em",
                color: "var(--foreground)",
                margin: "0 0 4px",
              }}
            >
              {formatProfileDaySheetDateLabel(dateKey)}
            </h2>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--foreground-subtle)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {moveCount} {moveCount === 1 ? "move" : "moves"}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: "0 20px",
              paddingBottom: "max(28px, env(safe-area-inset-bottom))",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
