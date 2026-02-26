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

  const monthCount = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return workouts.filter((w) => w.date.startsWith(prefix)).length;
  }, [workouts, year, month]);

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

  return (
    <div style={{ userSelect: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
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
            backgroundColor: "rgba(0,0,0,0.05)",
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
          <img src="/icons/nav/arrow-left.svg?v=1" alt="" width={14} height={14} aria-hidden style={{ display: "block" }} />
        </button>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--foreground)",
              lineHeight: 1,
            }}
          >
            {MONTHS[month]} {year}
          </div>
          {monthCount > 0 && (
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                fontWeight: 700,
                color: "var(--accent)",
                letterSpacing: "0.02em",
              }}
            >
              {monthCount} {monthCount === 1 ? "move" : "moves"}
            </div>
          )}
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
            backgroundColor: isCurrentMonth ? "transparent" : "rgba(0,0,0,0.05)",
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
          <img src="/icons/nav/arrow-right.svg?v=1" alt="" width={14} height={14} aria-hidden style={{ display: "block" }} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 6 }}>
        {DAY_LABELS.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "var(--foreground-subtle)",
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
                    style={{ flex: 1, aspectRatio: "1", minWidth: 0 }}
                  />
                );
              }

              let bg: string;
              let border: string;
              let scale = 1;

              if (isToday && hasWorkout) {
                bg = "var(--accent)";
                border = "2.5px solid var(--foreground)";
                scale = 1;
              } else if (isToday) {
                bg = "transparent";
                border = "2px solid var(--accent)";
              } else if (hasWorkout) {
                bg = "var(--accent)";
                border = "none";
              } else if (isFuture) {
                bg = "rgba(0,0,0,0.04)";
                border = "none";
              } else {
                bg = "rgba(0,0,0,0.08)";
                border = "none";
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
              const isGreenCircle = hasWorkout || (isToday && hasWorkout);
              const dayLabelColor =
                isGreenCircle ? "#000" : isToday ? "var(--accent)" : "var(--foreground-muted)";

              return (
                <div
                  key={di}
                  style={{
                    flex: 1,
                    aspectRatio: "1",
                    minWidth: 0,
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
                      width: "100%",
                      height: "100%",
                      minWidth: 0,
                      minHeight: 0,
                      borderRadius: "50%",
                      backgroundColor: bg,
                      border: isSelected ? "1.5px solid var(--foreground)" : border,
                      boxSizing: "border-box",
                      transform: `scale(${scale})`,
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
                        fontSize: 11,
                        fontWeight: 800,
                        color: dayLabelColor,
                        letterSpacing: "-0.03em",
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
