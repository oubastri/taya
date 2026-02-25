"use client";

import { useRef, useState } from "react";
import { useDayDetailSheet } from "@/contexts/day-detail-sheet";
import { useLogSheet } from "@/contexts/log-sheet";
import { useWorkouts } from "@/hooks/use-workouts";
import { ActivityIcon, BRAND_GREEN } from "./ActivityIcon";
import { ACTIVITY_LABELS, toDateKey } from "@/types/workout";
import type { ActivityType } from "@/types/workout";
import type { Workout } from "@/types/workout";

function formatDateLabel(dateStr: string): string {
  const today = toDateKey(new Date());
  if (dateStr === today) return "Today";
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function DayDetailSheet() {
  const { isOpen, dateKey, close } = useDayDetailSheet();
  const { open: openLogSheet, openForEdit } = useLogSheet();
  const { workoutsOnDate, deleteWorkout } = useWorkouts();
  const [dragOffset, setDragOffset] = useState(0);

  const startYRef = useRef(0);
  const dragging = useRef(false);

  const workouts = dateKey ? workoutsOnDate(dateKey) : [];
  const dateLabel = dateKey ? formatDateLabel(dateKey) : "";

  const onTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    dragging.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) setDragOffset(dy);
  };

  const onTouchEnd = () => {
    dragging.current = false;
    if (dragOffset > 90) {
      close();
    } else {
      setDragOffset(0);
    }
  };

  const handleDelete = (w: Workout) => {
    if (typeof window === "undefined") return;
    if (!window.confirm("Remove this log?")) return;
    deleteWorkout(w.id);
    if (workouts.length <= 1) close();
  };

  const handleAddAnother = () => {
    if (dateKey) openLogSheet(dateKey);
  };

  if (!dateKey) return null;

  return (
    <>
      <div
        onClick={close}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "var(--overlay)",
          zIndex: 98,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label={`Logs for ${dateLabel}`}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "var(--surface)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          zIndex: 99,
          transform: isOpen ? `translateY(${dragOffset}px)` : "translateY(105%)",
          transition:
            dragOffset === 0
              ? `transform ${isOpen ? "0.42s" : "0.32s"} cubic-bezier(0.32, 0.72, 0, 1)`
              : "none",
          maxHeight: "88vh",
          overflowY: "auto",
          paddingBottom: "max(28px, env(safe-area-inset-bottom))",
          WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
          scrollbarWidth: "none" as React.CSSProperties["scrollbarWidth"],
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 12,
            paddingBottom: 20,
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: "var(--border-strong)",
            }}
          />
        </div>

        <div style={{ padding: "0 20px 20px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--foreground)",
            }}
          >
            {dateLabel}
          </h2>
          <p
            style={{
              margin: "4px 0 16px",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--foreground-subtle)",
              letterSpacing: "0.02em",
            }}
          >
            {workouts.length} {workouts.length === 1 ? "move" : "moves"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {workouts
              .sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              )
              .map((w) => {
                const type = (w.activityType ?? "other") as ActivityType;
                return (
                  <div
                    key={w.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 16px",
                      borderRadius: 14,
                      backgroundColor: "rgba(0,0,0,0.04)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: BRAND_GREEN,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <ActivityIcon type={type} size={24} invert />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--foreground)",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {ACTIVITY_LABELS[type]}
                      </div>
                      {w.description.trim() ? (
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 13,
                            color: "var(--foreground-muted)",
                            lineHeight: 1.35,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {w.description}
                        </div>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => openForEdit(w)}
                        aria-label="Edit"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          border: "none",
                          backgroundColor: "rgba(0,0,0,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          WebkitTapHighlightColor: "transparent",
                        }}
                        className="active:scale-95"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(w)}
                        aria-label="Delete"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          border: "none",
                          backgroundColor: "rgba(0,0,0,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          WebkitTapHighlightColor: "transparent",
                        }}
                        className="active:scale-95"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          <button
            type="button"
            onClick={handleAddAnother}
            style={{
              marginTop: 16,
              width: "100%",
              height: 52,
              borderRadius: 14,
              border: "2px dashed var(--border-strong)",
              backgroundColor: "transparent",
              color: "var(--foreground)",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "inherit",
              letterSpacing: "0.04em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              WebkitTapHighlightColor: "transparent",
              transition: "background-color 0.2s ease, border-color 0.2s ease",
            }}
            className="hover:bg-black/5 active:scale-[0.98]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add another move
          </button>
        </div>
      </div>
    </>
  );
}
