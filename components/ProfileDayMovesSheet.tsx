"use client";

import { useCallback, useRef, type CSSProperties, type ReactNode } from "react";
import {
  SHEET_DISMISS_DRAG_PX,
  SHEET_DRAG_REGION_STYLE,
  SHEET_EXIT_MS,
  SHEET_SPRING,
  SHEET_TRANSFORM_SETTLED_CENTERED,
} from "@/lib/sheetMotion";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useSheetScrollPullDown } from "@/hooks/useSheetScrollPullDown";
import { localNoonFromDateKey, toDateKey } from "@/types/workout";

export function formatProfileDaySheetDateLabel(dateStr: string): string {
  const today = toDateKey(new Date());
  if (dateStr === today) return "Today";
  const d = localNoonFromDateKey(dateStr);
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
  const listScrollRef = useRef<HTMLDivElement>(null);
  const sheetDragRef = useRef({ active: false, startY: 0, dy: 0 });

  const active = open && dateKey != null;
  useLockBodyScroll(active);

  const endVerticalSheetDrag = useCallback(() => {
    const { dy } = sheetDragRef.current;

    if (dy > SHEET_DISMISS_DRAG_PX) {
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
          sheetRef.current.style.transform = SHEET_TRANSFORM_SETTLED_CENTERED;
        }
      }, SHEET_EXIT_MS);
    }
    sheetDragRef.current.dy = 0;
  }, [onClose]);

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
    endVerticalSheetDrag();
  };

  const onScrollEdgePullMove = useCallback((dy: number) => {
    sheetDragRef.current.dy = dy;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
      sheetRef.current.style.transform = `translateX(-50%) translateY(${dy}px)`;
    }
  }, []);

  useSheetScrollPullDown({
    enabled: active,
    scrollRef: listScrollRef,
    onPullMove: onScrollEdgePullMove,
    onPullCommit: endVerticalSheetDrag,
  });

  if (dateKey == null) return null;

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
          overscrollBehavior: "contain",
        }}
      >
        <div
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          style={{
            flexShrink: 0,
            cursor: "grab",
            touchAction: "none",
            userSelect: "none",
          }}
        >
          <div style={SHEET_DRAG_REGION_STYLE}>
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "var(--drag-handle)",
              }}
            />
          </div>
          <div style={{ padding: "4px 70px 4px 20px" }}>
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
                margin: 0,
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
          ref={listScrollRef}
          style={{
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
            WebkitOverflowScrolling: "touch" as CSSProperties["WebkitOverflowScrolling"],
            scrollbarWidth: "none" as CSSProperties["scrollbarWidth"],
            overscrollBehaviorY: "contain",
            touchAction: "pan-y",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: "12px 20px 0",
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
