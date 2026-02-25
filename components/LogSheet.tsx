"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useLogSheet } from "@/contexts/log-sheet";
import { useWorkouts } from "@/hooks/use-workouts";
import { ActivityIcon } from "./ActivityIcon";
import {
  ACTIVITY_GROUPS,
  ACTIVITY_LABELS,
  fromDateKey,
  toDateKey,
} from "@/types/workout";
import type { ActivityType } from "@/types/workout";

const MAX_DESCRIPTION_LENGTH = 150;

function formatSheetDate(dateKey: string): string {
  const d = fromDateKey(dateKey);
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  const month = d.toLocaleDateString("en-US", { month: "long" });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${weekday} ${month} ${day}, ${year}`;
}

const iconButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 44,
  height: 44,
  borderRadius: "50%",
  border: "none",
  background: "transparent",
  color: "#000",
  cursor: "pointer",
  flexShrink: 0,
  WebkitTapHighlightColor: "transparent",
};

function CloseButton({ onClick, ariaLabel = "Close" }: { onClick: () => void; ariaLabel?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={iconButtonStyle}
    >
      <img src="/icons/nav/close.svg" alt="" width={24} height={24} aria-hidden />
    </button>
  );
}

function BackButton({
  onClick,
  ariaLabel,
}: {
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={iconButtonStyle}
    >
      <svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
}

export function LogSheet() {
  const { isOpen, close, initialDateKey, workoutToEdit } = useLogSheet();
  const { addWorkout, updateWorkout } = useWorkouts();

  const [step, setStep] = useState<1 | 2>(1);
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
      setStep(2);
    } else {
      setDate(initialDateKey ?? toDateKey(new Date()));
      setDescription("");
      setSelected(null);
      setStep(1);
    }
  }, [isOpen, initialDateKey, workoutToEdit]);

  const startYRef = useRef(0);
  const dragging = useRef(false);

  const reset = () => {
    setStep(1);
    setSelected(null);
    setDescription("");
    setDragOffset(0);
  };

  const handleClose = () => {
    close();
    setTimeout(reset, 400);
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

  const isEditing = !!workoutToEdit;

  return (
    <div style={{ display: "contents" }}>
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

      {/* Sheet — fixed height so step transition doesn't resize */}
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
          height: "88vh",
          maxHeight: "88vh",
          backgroundColor: "var(--surface)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          zIndex: 101,
          transform: isOpen ? `translateY(${dragOffset}px)` : "translateY(105%)",
          transition:
            dragOffset === 0
              ? `transform ${isOpen ? "0.42s" : "0.32s"} cubic-bezier(0.32, 0.72, 0, 1)`
              : "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 16, flexShrink: 0 }}>
          <div
            style={{
              width: 32,
              height: 3,
              borderRadius: 2,
              backgroundColor: "rgba(0,0,0,0.12)",
            }}
          />
        </div>

        {/* Step panes — both rendered, slide horizontally so height never changes */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Step 1 pane */}
          <div
            aria-hidden={step !== 1}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              overflowY: "auto",
              overflowX: "hidden",
              paddingBottom: "max(28px, env(safe-area-inset-bottom))",
              WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
              scrollbarWidth: "none" as React.CSSProperties["scrollbarWidth"],
              transform: step === 1 ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
              pointerEvents: step === 1 ? "auto" : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px 8px",
              }}
            >
              <CloseButton onClick={handleClose} ariaLabel="Close" />
              <div style={{ width: 44 }} aria-hidden />
            </div>
            <h2
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 32,
                fontWeight: 400,
                lineHeight: 1.2,
                letterSpacing: "-0.04em",
                color: "#000",
                margin: "0 16px 24px",
                maxWidth: 320,
              }}
            >
              What activity did you do?
            </h2>
            <div style={{ padding: "0 16px 24px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 12,
                }}
              >
                {ACTIVITY_GROUPS.flatMap((group) =>
                  group.activities.map((activity) => (
                    <button
                      key={activity}
                      type="button"
                      onClick={() => {
                        setSelected(activity);
                        setStep(2);
                      }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        padding: 16,
                        borderRadius: 20,
                        border: "1px solid #e7e7e7",
                        backgroundColor: "#fff",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 16,
                        fontWeight: 400,
                        color: "#919191",
                        letterSpacing: "-0.04em",
                        WebkitTapHighlightColor: "transparent",
                        transition: "border-color 0.2s, background-color 0.2s, color 0.2s",
                      }}
                    >
                      <div style={{ width: 48, height: 48, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ActivityIcon type={activity} size={48} invert={false} />
                      </div>
                      <span style={{ textAlign: "center", lineHeight: 1.2 }}>
                        {ACTIVITY_LABELS[activity]}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Step 2 pane */}
          <div
            aria-hidden={step !== 2}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              overflowY: "auto",
              overflowX: "hidden",
              paddingBottom: "max(28px, env(safe-area-inset-bottom))",
              WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
              scrollbarWidth: "none" as React.CSSProperties["scrollbarWidth"],
              transform: step === 2 ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
              pointerEvents: step === 2 ? "auto" : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px 8px",
              }}
            >
              <BackButton
                onClick={() => setStep(1)}
                ariaLabel="Back to activity selection"
              />
              <div style={{ width: 44 }} aria-hidden />
            </div>
            <p
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 32,
                fontWeight: 400,
                lineHeight: 1.2,
                letterSpacing: "-0.04em",
                color: "#000",
                margin: "0 16px 24px",
              }}
            >
              {formatSheetDate(date)}
            </p>
            {selected && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  margin: "0 16px 24px",
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: "#f3f3f3",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIcon type={selected} size={56} invert={false} />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 24,
                    fontWeight: 400,
                    letterSpacing: "-0.04em",
                    color: "#000",
                  }}
                >
                  {ACTIVITY_LABELS[selected]}
                </span>
              </div>
            )}
            <div style={{ padding: "0 16px 24px" }}>
              <textarea
                placeholder="Tell us about it (optional)"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))
                }
                maxLength={MAX_DESCRIPTION_LENGTH}
                rows={3}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  resize: "none",
                  padding: 15,
                  borderRadius: 8,
                  border: "1px solid #e7e7e7",
                  backgroundColor: "#fff",
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 16,
                  fontWeight: 400,
                  color: "#000",
                  letterSpacing: "-0.04em",
                  outline: "none",
                  display: "block",
                  marginBottom: 8,
                }}
              />
              <span
                style={{
                  display: "block",
                  textAlign: "right",
                  fontSize: 12,
                  color: "rgba(0,0,0,0.4)",
                  marginBottom: 24,
                }}
              >
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            <div style={{ padding: "0 16px max(20px, env(safe-area-inset-bottom))" }}>
              <button
                type="button"
                onClick={handleSubmit}
                style={{
                  width: "100%",
                  height: 54,
                  borderRadius: 50,
                  border: "none",
                  backgroundColor: "#000",
                  color: "#fff",
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 16,
                  fontWeight: 400,
                  letterSpacing: "-0.04em",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  transition: "opacity 0.2s",
                }}
              >
                {isEditing ? "Save" : "Log move"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
