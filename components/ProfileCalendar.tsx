"use client";

import { useMemo, useState } from "react";
import { useDayDetailSheet } from "@/contexts/day-detail-sheet";
import { useLogSheet } from "@/contexts/log-sheet";
import type { Workout } from "@/types/workout";
import { toDateKey } from "@/types/workout";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

interface ProfileCalendarProps {
  workouts: Workout[];
  readOnly?: boolean;
  /** When readOnly, optionally control which day is selected (black circle tap). */
  selectedDateKey?: string | null;
  /** When readOnly, called when user taps a day that has a workout. */
  onSelectDate?: (dateKey: string) => void;
}

export function ProfileCalendar({
  workouts,
  readOnly = false,
  selectedDateKey = null,
  onSelectDate,
}: ProfileCalendarProps) {
  const { open: openLogSheet } = useLogSheet();
  const { open: openDayDetail } = useDayDetailSheet();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const today = toDateKey(now);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const workoutDates = useMemo(
    () => new Set(workouts.map((w) => w.date)),
    [workouts]
  );

  const goBack = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };

  const goForward = () => {
    if (isCurrentMonth) return;
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const weeks = useMemo(() => {
    const first = new Date(year, month, 1);
    const dow = first.getDay();
    const toMon = dow === 0 ? -6 : 1 - dow;
    const cursor = new Date(year, month, 1 + toMon);

    const result: Date[][] = [];
    for (let w = 0; w < 6; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      result.push(week);
    }

    const last = result[5];
    if (last.every((d) => d.getMonth() !== month)) result.pop();

    return result;
  }, [year, month]);

  const CELL = 47;
  const dayFontPx = 17.625;

  return (
    <div style={{ userSelect: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          onClick={goBack}
          aria-label="Previous month"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            backgroundColor: "var(--chip-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            WebkitTapHighlightColor: "transparent",
            transition: "background-color 0.2s ease, transform 0.15s ease",
          }}
          className="active:scale-95"
        >
          <img src="/icons/nav/arrow-left.svg?v=1" alt="" width={14} height={14} aria-hidden className="activity-icon-auto" style={{ display: "block" }} />
        </button>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "normal",
              color: "var(--foreground)",
              lineHeight: "normal",
            }}
          >
            {MONTHS[month]} {year}
          </div>
        </div>

        <button
          type="button"
          onClick={goForward}
          disabled={isCurrentMonth}
          aria-label="Next month"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            backgroundColor: isCurrentMonth ? "transparent" : "var(--chip-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: isCurrentMonth ? "default" : "pointer",
            flexShrink: 0,
            opacity: isCurrentMonth ? 0.35 : 1,
            WebkitTapHighlightColor: "transparent",
            transition: "opacity 0.2s ease, transform 0.15s ease",
          }}
          className="active:scale-95"
        >
          <img src="/icons/nav/arrow-right.svg?v=1" alt="" width={14} height={14} aria-hidden className="activity-icon-auto" style={{ display: "block" }} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 8 }}>
        {DAY_LABELS.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: "center",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: dayFontPx,
              fontWeight: 400,
              letterSpacing: "normal",
              lineHeight: "normal",
              color: "var(--cal-dow)",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", gap: 0 }}>
            {week.map((date, di) => {
              const dk = toDateKey(date);
              const inMonth = date.getMonth() === month;
              const hasWorkout = workoutDates.has(dk);
              const isToday = dk === today;
              const isFuture = dk > today;

              if (!inMonth) {
                return (
                  <div
                    key={di}
                    style={{ flex: 1, minWidth: 0, height: CELL, display: "flex", alignItems: "center", justifyContent: "center" }}
                  />
                );
              }

              let bg: string;
              let border: string;
              let color: string;

              if (isToday) {
                bg = "var(--chip-bg)";
                border = "2px solid var(--foreground)";
                color = "var(--foreground)";
              } else if (hasWorkout) {
                bg = "var(--foreground)";
                border = "none";
                color = "var(--background)";
              } else if (isFuture) {
                bg = "var(--chip-bg)";
                border = "none";
                color = "var(--cal-day-muted)";
              } else {
                bg = "var(--chip-bg)";
                border = "none";
                color = "var(--cal-day-muted)";
              }

              const handleDateClick = () => {
                if (onSelectDate) {
                  onSelectDate(dk);
                  return;
                }
                if (readOnly) return;
                if (hasWorkout) openDayDetail(dk);
                else openLogSheet(dk);
              };

              const isSelected = selectedDateKey === dk;
              const dayNum = date.getDate();
              const selectionBorder =
                isSelected && !isToday ? "2px solid var(--foreground)" : border;
              const selectionRing =
                isSelected && isToday ? "2px solid var(--foreground)" : selectionBorder;

              return (
                <div
                  key={di}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: CELL,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleDateClick}
                    disabled={readOnly && !hasWorkout}
                    aria-label={
                      readOnly
                        ? (hasWorkout ? `View post for ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : undefined)
                        : hasWorkout
                          ? `View logs for ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                          : `Select ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    }
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: "50%",
                      backgroundColor: bg,
                      border: selectionRing,
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background-color 0.25s var(--ease-out-expo), border-color 0.2s ease, transform 0.15s ease",
                      cursor: readOnly ? (hasWorkout ? "pointer" : "default") : "pointer",
                      padding: 0,
                      font: "inherit",
                      WebkitTapHighlightColor: "transparent",
                    }}
                    className={readOnly && hasWorkout ? "active:scale-95" : readOnly ? undefined : "active:scale-95"}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-sans), sans-serif",
                        fontSize: dayFontPx,
                        fontWeight: 500,
                        color,
                        letterSpacing: "normal",
                        lineHeight: 1,
                      }}
                    >
                      {dayNum}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
