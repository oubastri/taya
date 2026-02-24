"use client";

import { useRef, useState } from "react";
import { useLogSheet } from "@/contexts/log-sheet";
import { useWorkouts } from "@/hooks/use-workouts";
import { ActivityIcon, ACTIVITY_COLORS } from "./ActivityIcon";
import { ACTIVITY_LABELS, ACTIVITY_TYPES, toDateKey } from "@/types/workout";
import type { ActivityType } from "@/types/workout";

export function LogSheet() {
  const { isOpen, close } = useLogSheet();
  const { addWorkout } = useWorkouts();

  const [selected, setSelected] = useState<ActivityType | null>(null);
  const [description, setDescription] = useState("");
  const [date] = useState(() => toDateKey(new Date()));
  const [dragOffset, setDragOffset] = useState(0);

  const startYRef = useRef(0);
  const dragging = useRef(false);

  const reset = () => {
    setSelected(null);
    setDescription("");
    setDragOffset(0);
  };

  const handleClose = () => {
    close();
    setTimeout(reset, 400); // after animation
  };

  const handleSubmit = () => {
    if (!selected) return;
    addWorkout(date, description.trim(), selected);
    handleClose();
  };

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
      handleClose();
    } else {
      setDragOffset(0);
    }
  };

  const today = toDateKey(new Date());
  const ready = selected !== null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "var(--overlay)",
          zIndex: 100,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Sheet */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Log a workout"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "var(--surface)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          zIndex: 101,
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
        {/* Drag handle */}
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

        {/* Activity grid */}
        <div
          style={{
            padding: "0 16px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6,
          }}
        >
          {ACTIVITY_TYPES.map((activity) => {
            const isSel = selected === activity;
            return (
              <button
                key={activity}
                type="button"
                onClick={() => setSelected(isSel ? null : activity)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "14px 6px 12px",
                  borderRadius: 12,
                  border: "none",
                  backgroundColor: isSel
                    ? ACTIVITY_COLORS[activity]
                    : "rgba(0,0,0,0.05)",
                  color: isSel ? "#fff" : "#000",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  WebkitTapHighlightColor: "transparent",
                  transition: "background-color 0.15s ease, color 0.15s ease",
                }}
              >
                <ActivityIcon type={activity} size={24} />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    lineHeight: 1,
                    opacity: isSel ? 0.9 : 0.6,
                  }}
                >
                  {ACTIVITY_LABELS[activity]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Date + description row */}
        <div style={{ padding: "20px 20px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "rgba(0,0,0,0.35)",
                padding: "4px 10px",
                borderRadius: 20,
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            >
              {date === today ? "Today" : date}
            </span>
          </div>

          <textarea
            placeholder="add a note…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{
              width: "100%",
              resize: "none",
              border: "none",
              borderRadius: 0,
              borderTop: "1px solid rgba(0,0,0,0.07)",
              padding: "14px 0 0",
              fontSize: 15,
              fontFamily: "inherit",
              backgroundColor: "transparent",
              outline: "none",
              boxSizing: "border-box",
              color: "#000",
              letterSpacing: "-0.01em",
            }}
          />
        </div>

        {/* Submit */}
        <div style={{ padding: "16px 20px 0" }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!ready}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 14,
              border: "none",
              backgroundColor: ready ? "var(--foreground)" : "rgba(0,0,0,0.06)",
              color: ready ? "var(--surface)" : "var(--foreground-faint)",
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "inherit",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: ready ? "pointer" : "default",
              transition: "background-color 0.2s ease, color 0.2s ease",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Log it
          </button>
        </div>
      </div>
    </>
  );
}
