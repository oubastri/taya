"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLogSheet } from "@/contexts/log-sheet";
import { useWorkouts } from "@/hooks/use-workouts";
import { ActivityIcon } from "./ActivityIcon";
import {
  ACTIVITY_LABELS,
  ACTIVITY_TYPES,
  fromDateKey,
  toDateKey,
} from "@/types/workout";
import type { ActivityType } from "@/types/workout";

const DEFAULT_TOP_5: ActivityType[] = [
  "run",
  "walk",
  "cycle",
  "yoga",
  "lift",
];

const MAX_DESCRIPTION_LENGTH = 150;
const SPRING = "0.38s cubic-bezier(0.32, 0.72, 0, 1)";
const CLOSE_BTN = 54;

function formatSheetDate(dateKey: string): string {
  const today = toDateKey(new Date());
  if (dateKey === today) return "TODAY";
  const d = fromDateKey(dateKey);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = d.getDate();
  return `${weekday} ${month} ${day}`;
}

function getTop5(workouts: { activityType?: ActivityType }[]): ActivityType[] {
  if (workouts.length === 0) return [...DEFAULT_TOP_5];
  const count = new Map<ActivityType, number>();
  for (const w of workouts) {
    const t = (w.activityType ?? "other") as ActivityType;
    count.set(t, (count.get(t) ?? 0) + 1);
  }
  const sorted = Array.from(count.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([a]) => a);
  const top5: ActivityType[] = [];
  for (const a of sorted) {
    if (top5.length >= 5) break;
    top5.push(a);
  }
  for (const a of DEFAULT_TOP_5) {
    if (top5.length >= 5) break;
    if (!top5.includes(a)) top5.push(a);
  }
  return top5;
}

function getOrderedActivities(
  workouts: { activityType?: ActivityType }[]
): ActivityType[] {
  const top5 = getTop5(workouts);
  const rest = ACTIVITY_TYPES.filter((a) => !top5.includes(a));
  return [...top5, ...rest];
}

// ── Inline calendar ────────────────────────────────────────────────────────

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function buildCalendarDays(year: number, month: number) {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: { date: Date; current: boolean }[] = [];

  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrev - i), current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), current: true });
  }
  const trailing = 42 - cells.length;
  for (let d = 1; d <= trailing; d++) {
    cells.push({ date: new Date(year, month + 1, d), current: false });
  }
  return cells;
}

function CalendarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (dk: string) => void;
}) {
  const today = toDateKey(new Date());
  const initYear = parseInt(value.slice(0, 4));
  const initMonth = parseInt(value.slice(5, 7)) - 1;
  const [vy, setVy] = useState(initYear);
  const [vm, setVm] = useState(initMonth);

  useEffect(() => {
    setVy(parseInt(value.slice(0, 4)));
    setVm(parseInt(value.slice(5, 7)) - 1);
  }, [value]);

  const cells = useMemo(() => buildCalendarDays(vy, vm), [vy, vm]);

  const prev = () => {
    if (vm === 0) { setVm(11); setVy(y => y - 1); }
    else setVm(m => m - 1);
  };
  const next = () => {
    if (vm === 11) { setVm(0); setVy(y => y + 1); }
    else setVm(m => m + 1);
  };

  return (
    <div style={{ padding: "12px 0 4px" }}>
      {/* Month / year nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={prev}
          aria-label="Previous month"
          style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "none", background: "rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="rgba(0,0,0,0.6)" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 14, fontWeight: 600,
            letterSpacing: "-0.025em", color: "#000",
          }}
        >
          {MONTH_NAMES[vm]} {vy}
        </span>
        <button
          type="button"
          onClick={next}
          aria-label="Next month"
          style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "none", background: "rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="rgba(0,0,0,0.6)" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Day-of-week labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
        {DAY_LABELS.map((l, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 11, fontWeight: 500,
              color: "rgba(0,0,0,0.3)",
              paddingBottom: 6,
            }}
          >
            {l}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((cell, i) => {
          const dk = toDateKey(cell.date);
          const isSelected = dk === value;
          const isToday = dk === today;
          return (
            <button
              key={i}
              type="button"
              onClick={() => { if (cell.current) onChange(dk); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                aspectRatio: "1",
                borderRadius: "50%",
                border: isToday && !isSelected ? "1.5px solid rgba(0,0,0,0.25)" : "none",
                background: isSelected ? "#000" : "transparent",
                color: isSelected
                  ? "#fff"
                  : cell.current
                    ? isToday ? "#000" : "rgba(0,0,0,0.85)"
                    : "rgba(0,0,0,0.18)",
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 13,
                fontWeight: isSelected || isToday ? 600 : 400,
                cursor: cell.current ? "pointer" : "default",
                WebkitTapHighlightColor: "transparent",
                transition: "background 0.15s",
              }}
            >
              {cell.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LogSheet() {
  const { isOpen, close, initialDateKey, workoutToEdit } = useLogSheet();
  const { workouts, addWorkout, updateWorkout } = useWorkouts();

  const [selected, setSelected] = useState<ActivityType | null>(null);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [showAll, setShowAll] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startY: 0, dy: 0 });

  const orderedActivities = useMemo(
    () => getOrderedActivities(workouts),
    [workouts]
  );
  const top5 = useMemo(() => orderedActivities.slice(0, 5), [orderedActivities]);
  const remaining = useMemo(() => orderedActivities.slice(5), [orderedActivities]);

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

  const reset = useCallback(() => {
    setSelected(null);
    setDescription("");
    setShowAll(false);
    setDatePickerOpen(false);
  }, []);

  const handleClose = useCallback(() => {
    close();
    setTimeout(reset, 400);
  }, [close, reset]);

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
      setTimeout(() => {
        close();
        setTimeout(reset, 50);
      }, 380);
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

  const isEditing = !!workoutToEdit;

  return (
    <>
      <style>{`
        #log-sheet-chips::-webkit-scrollbar { display: none; }
        #log-sheet-note::placeholder { color: rgba(0,0,0,0.28); }
      `}</style>

      {/* Scrim */}
      <div
        ref={scrimRef}
        onClick={handleClose}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(0,0,0,0.32)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: `opacity ${SPRING}`,
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? "Edit workout" : "Log a workout"}
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          width: "100%",
          maxWidth: 428,
          zIndex: 101,
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(40px) saturate(1.8)",
          WebkitBackdropFilter: "blur(40px) saturate(1.8)",
          borderRadius: "32px 32px 0 0",
          boxShadow:
            "0 -1px 0 rgba(0,0,0,0.07), 0 -12px 48px rgba(0,0,0,0.13)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          maxHeight: "90svh",
          transform: isOpen
            ? "translateX(-50%)"
            : "translateX(-50%) translateY(100%)",
          transition: `transform ${SPRING}`,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {/* Drag handle */}
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
              background: "rgba(0,0,0,0.16)",
            }}
          />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1,
            width: CLOSE_BTN,
            height: CLOSE_BTN,
            borderRadius: "100px",
            background: "rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            flexShrink: 0,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(0,0,0,0.55)"
            strokeWidth="2.6"
            strokeLinecap="round"
            aria-hidden
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        {/* Heading + date */}
        <div style={{ padding: "20px 24px 0" }}>
          <h2
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(26px, 7vw, 32px)",
              fontWeight: 500,
              lineHeight: 1.15,
              letterSpacing: "-0.04em",
              color: "#000",
              margin: 0,
            }}
          >
            What did you do?
          </h2>

          {/* Date badge */}
          <button
            type="button"
            onClick={() => setDatePickerOpen((o) => !o)}
            aria-expanded={datePickerOpen}
            style={{
              marginTop: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px dashed #919191",
              background: "none",
              cursor: "pointer",
              fontFamily: '"B612 Mono", ui-monospace, monospace',
              fontSize: 12,
              fontWeight: 400,
              color: "#000",
              letterSpacing: "-0.48px",
              WebkitTapHighlightColor: "transparent",
              lineHeight: "normal",
            }}
          >
            {formatSheetDate(date)}
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              style={{
                transition: "transform 0.22s ease",
                transform: datePickerOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* Inline calendar — expands below the badge */}
          <div
            style={{
              overflow: "hidden",
              maxHeight: datePickerOpen ? 320 : 0,
              opacity: datePickerOpen ? 1 : 0,
              transition: "max-height 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.22s ease",
            }}
          >
            <CalendarPicker
              value={date}
              onChange={(dk) => {
                setDate(dk);
                setDatePickerOpen(false);
              }}
            />
          </div>
        </div>

        {/* Separator */}
        <div
          style={{
            height: "0.5px",
            background: "rgba(0,0,0,0.08)",
            margin: "24px 0 0",
            flexShrink: 0,
          }}
        />

        {/* Activity chips — horizontal scroll */}
        <div
          id="log-sheet-chips"
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            scrollbarWidth: "none",
            flexShrink: 0,
            touchAction: "pan-x",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "18px 24px 20px",
              width: "max-content",
            }}
          >
            {(showAll ? orderedActivities : top5).map((activity) => {
              const isSelected = selected === activity;
              return (
                <button
                  key={activity}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : activity)}
                  aria-pressed={isSelected}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "0 14px 0 10px",
                    height: 40,
                    borderRadius: 100,
                    border: "none",
                    background: isSelected ? "#000" : "rgba(0,0,0,0.06)",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                    color: isSelected ? "#fff" : "rgba(0,0,0,0.75)",
                    WebkitTapHighlightColor: "transparent",
                    transition: "background 0.18s, color 0.18s",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  <ActivityIcon type={activity} size={22} invert={isSelected} />
                  {ACTIVITY_LABELS[activity]}
                </button>
              );
            })}

            {/* View more pill */}
            {!showAll && remaining.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "0 14px",
                  height: 40,
                  borderRadius: 100,
                  border: "none",
                  background: "rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color: "rgba(0,0,0,0.75)",
                  WebkitTapHighlightColor: "transparent",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                View more
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Separator */}
        <div
          style={{
            height: "0.5px",
            background: "rgba(0,0,0,0.08)",
            flexShrink: 0,
          }}
        />

        {/* Notes */}
        <div style={{ padding: "22px 24px 0" }}>
          <textarea
            id="log-sheet-note"
            placeholder="Add a note (optional)"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))
            }
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={4}
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "none",
              padding: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 16,
              fontWeight: 400,
              color: "#000",
              letterSpacing: "-0.025em",
              lineHeight: 1.55,
              display: "block",
            }}
          />
        </div>

        {/* CTA */}
        <div
          style={{
            padding: "20px 24px",
            paddingBottom: "max(28px, env(safe-area-inset-bottom))",
          }}
        >
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
              fontWeight: 500,
              letterSpacing: "-0.03em",
              cursor: selected ? "pointer" : "default",
              WebkitTapHighlightColor: "transparent",
              transition: "opacity 0.2s",
              opacity: selected ? 1 : 0.3,
            }}
          >
            {isEditing ? "Save" : "Log move"}
          </button>
        </div>
      </div>
    </>
  );
}
