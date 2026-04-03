"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LikePerson } from "@/types/likes";
import {
  SHEET_DISMISS_DRAG_PX,
  SHEET_DRAG_REGION_STYLE,
  SHEET_EXIT_MS,
  SHEET_SPRING,
  SHEET_TRANSFORM_SETTLED_CENTERED,
} from "@/lib/sheetMotion";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useSheetScrollPullDown } from "@/hooks/useSheetScrollPullDown";
import { UserAvatar } from "@/components/UserAvatar";

const NAV_HEIGHT = 54;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function LikersSheet({
  people,
  title = "Likes",
  onClose,
  onSelectProfile,
}: {
  people: LikePerson[];
  /** Header title (default: Likes). */
  title?: string;
  onClose: () => void;
  /** Same contract as SearchSheet `onSelect`: parent closes sheet + navigates. */
  onSelectProfile?: (userId: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startY: 0, dy: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
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
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(onClose, SHEET_EXIT_MS);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useLockBodyScroll(true);

  const endVerticalSheetDrag = useCallback(() => {
    const { dy } = dragRef.current;

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
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = `transform ${SHEET_SPRING}`;
        sheetRef.current.style.transform = "translateX(-50%) translateY(0)";
        window.setTimeout(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transition = "";
            sheetRef.current.style.transform = SHEET_TRANSFORM_SETTLED_CENTERED;
          }
        }, SHEET_EXIT_MS);
      }
    }
    dragRef.current.dy = 0;
  }, [onClose]);

  const onHandleDown = (e: React.PointerEvent) => {
    dragRef.current = { active: true, startY: e.clientY, dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };

  const onHandleMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dy = Math.max(0, e.clientY - dragRef.current.startY);
    dragRef.current.dy = dy;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateX(-50%) translateY(${dy}px)`;
    }
  };

  const onHandleUp = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    endVerticalSheetDrag();
  };

  const onScrollEdgePullMove = useCallback((dy: number) => {
    dragRef.current.dy = dy;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
      sheetRef.current.style.transform = `translateX(-50%) translateY(${dy}px)`;
    }
  }, []);

  useSheetScrollPullDown({
    enabled: open,
    scrollRef: listScrollRef,
    onPullMove: onScrollEdgePullMove,
    onPullCommit: endVerticalSheetDrag,
  });

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        ref={scrimRef}
        onClick={close}
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
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          width: "100%",
          maxWidth: 428,
          height: "85svh",
          zIndex: 100,
          background: "var(--sheet-bg)",
          borderRadius: "32px 32px 0 0",
          boxShadow: "var(--sheet-shadow)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "var(--font-sans), sans-serif",
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
          <div
            style={{
              padding: "0 84px 18px 24px",
              flexShrink: 0,
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "clamp(26px, 7vw, 32px)",
                fontWeight: 500,
                letterSpacing: "-0.04em",
                color: "var(--input-color)",
              }}
            >
              {title}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={close}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1,
            width: NAV_HEIGHT,
            height: NAV_HEIGHT,
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
          aria-label={`Close ${title}`}
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

        <div style={{ height: "0.5px", background: "var(--separator)", flexShrink: 0 }} />

        <div
          ref={listScrollRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorY: "contain",
            touchAction: "pan-y",
          }}
        >
          {people.map((f, i) => (
            <div
              key={f.id}
              role="button"
              tabIndex={onSelectProfile ? 0 : undefined}
              onClick={() => onSelectProfile?.(f.id)}
              onKeyDown={(e) => {
                if (!onSelectProfile) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectProfile(f.id);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                width: "100%",
                padding: "13px 24px",
                background: "none",
                border: "none",
                borderBottom:
                  i < people.length - 1 ? "0.5px solid var(--row-border)" : "none",
                cursor: onSelectProfile ? "pointer" : "default",
                fontFamily: "var(--font-sans), sans-serif",
                textAlign: "left",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "var(--avatar-placeholder-bg)",
                }}
              >
                {f.avatarUrl ? (
                  <UserAvatar avatarUrl={f.avatarUrl} name={f.name} fillParent />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--avatar-placeholder-text)",
                      fontFamily: "var(--font-sans), sans-serif",
                    }}
                  >
                    {getInitials(f.name)}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--foreground)",
                    letterSpacing: "-0.025em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.name}
                </p>
                <p
                  style={{
                    margin: "1px 0 0",
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 13,
                    color: "var(--foreground-subtle)",
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                  }}
                >
                  @{f.handle}
                </p>
              </div>
              {f.following && (
                <span
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--foreground-subtle)",
                    letterSpacing: "-0.01em",
                    flexShrink: 0,
                  }}
                >
                  Following
                </span>
              )}
            </div>
          ))}

          <div style={{ height: "max(env(safe-area-inset-bottom), 24px)" }} />
        </div>
      </div>
    </>,
    document.body,
  );
}
