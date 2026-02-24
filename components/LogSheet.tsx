"use client";

import { useEffect, useRef, useState } from "react";
import { useLogSheet } from "@/contexts/log-sheet";
import { useWorkouts } from "@/hooks/use-workouts";
import { ActivityIcon, ACTIVITY_COLORS } from "./ActivityIcon";
import { ACTIVITY_LABELS, ACTIVITY_TYPES, toDateKey } from "@/types/workout";
import type { ActivityType } from "@/types/workout";

export function LogSheet() {
  const { isOpen, close, initialDateKey, workoutToEdit } = useLogSheet();
  const { addWorkout, updateWorkout } = useWorkouts();

  const [selected, setSelected] = useState<ActivityType | null>(null);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    if (workoutToEdit) {
      setDate(workoutToEdit.date);
      setDescription(workoutToEdit.description ?? "");
      setSelected((workoutToEdit.activityType ?? "other") as ActivityType);
    } else {
      setDate(initialDateKey ?? toDateKey(new Date()));
      setDescription("");
      setSelected(null);
    }
  }, [isOpen, initialDateKey, workoutToEdit]);

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
    if (workoutToEdit) {
      updateWorkout(workoutToEdit.id, {
        date,
        description: description.trim(),
        activityType: selected,
      });
    } else {
      addWorkout(date, description.trim(), selected);
    }
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
  const isEditing = !!workoutToEdit;

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
        aria-label={isEditing ? "Edit workout" : "Log a workout"}
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
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 16 }}>
          <div
            style={{
              width: 32,
              height: 3,
              borderRadius: 2,
              backgroundColor: "rgba(0,0,0,0.12)",
            }}
          />
        </div>

        {/* Activity picker */}
        <div style={{ padding: "0 20px 20px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            {ACTIVITY_TYPES.map((activity) => {
              const isSel = selected === activity;
              const color = ACTIVITY_COLORS[activity];
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
                    gap: 6,
                    padding: "12px 6px 10px",
                    borderRadius: 12,
                    border: isSel ? `2px solid ${color}` : "1px solid rgba(0,0,0,0.08)",
                    backgroundColor: isSel ? `${color}18` : "transparent",
                    color: isSel ? color : "rgba(0,0,0,0.6)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 11,
                    fontWeight: 500,
                    WebkitTapHighlightColor: "transparent",
                    transition: "border-color 0.2s, background-color 0.2s, color 0.2s",
                  }}
                >
                  <ActivityIcon type={activity} size={32} invert={false} />
                  <span style={{ textAlign: "center", lineHeight: 1.2 }}>
                    {ACTIVITY_LABELS[activity]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date + note */}
        <div style={{ padding: "0 20px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(0,0,0,0.5)" }}>
            {date === today ? "Today" : date}
          </p>
          <div
            style={{
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 12,
              backgroundColor: "rgba(0,0,0,0.03)",
              overflow: "hidden",
            }}
          >
            <textarea
              placeholder="Note (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{
                width: "100%",
                resize: "none",
                border: "none",
                padding: "12px 14px",
                fontSize: 15,
                fontFamily: "inherit",
                backgroundColor: "transparent",
                outline: "none",
                boxSizing: "border-box",
                color: "#000",
                WebkitTapHighlightColor: "transparent",
              }}
            />
          </div>
        </div>

        {/* Submit */}
        <div style={{ padding: "0 20px max(20px, env(safe-area-inset-bottom))" }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!ready}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              border: "none",
              backgroundColor: ready ? "var(--foreground)" : "rgba(0,0,0,0.06)",
              color: ready ? "var(--surface)" : "rgba(0,0,0,0.35)",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: ready ? "pointer" : "default",
              transition: "background-color 0.2s, color 0.2s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {isEditing ? "Save" : "Log"}
          </button>
        </div>
      </div>
    </>
  );
}
