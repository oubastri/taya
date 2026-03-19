"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LikePerson } from "@/types/likes";

const NAV_HEIGHT = 54;
const SPRING = "0.38s cubic-bezier(0.32, 0.72, 0, 1)";

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
    setTimeout(onClose, 380);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

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
    const { dy } = dragRef.current;

    if (dy > 90) {
      const vh = window.innerHeight;
      if (sheetRef.current) {
        sheetRef.current.style.transition = `transform ${SPRING}`;
        sheetRef.current.style.transform = `translateX(-50%) translateY(${vh}px)`;
      }
      if (scrimRef.current) {
        scrimRef.current.style.transition = `opacity 0.38s ease`;
        scrimRef.current.style.opacity = "0";
      }
      setTimeout(onClose, 380);
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = `transform ${SPRING}`;
        sheetRef.current.style.transform = "translateX(-50%) translateY(0)";
        setTimeout(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transition = "";
            sheetRef.current.style.transform = "";
          }
        }, 380);
      }
    }
  };

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
          transition: `opacity ${SPRING}`,
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
          backdropFilter: "blur(40px) saturate(1.8)",
          WebkitBackdropFilter: "blur(40px) saturate(1.8)",
          borderRadius: "32px 32px 0 0",
          boxShadow: "var(--sheet-shadow)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "var(--font-sans), sans-serif",
          transform: open ? "translateX(-50%)" : "translateX(-50%) translateY(100%)",
          transition: `transform ${SPRING}`,
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

        <div
          style={{
            padding: "16px 84px 18px 24px",
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

        <div style={{ height: "0.5px", background: "var(--separator)", flexShrink: 0 }} />

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            touchAction: "pan-y",
          }}
        >
          {people.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelectProfile?.(f.id)}
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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.avatarUrl}
                    alt={f.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
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
            </button>
          ))}

          <div style={{ height: "max(env(safe-area-inset-bottom), 24px)" }} />
        </div>
      </div>
    </>,
    document.body,
  );
}
