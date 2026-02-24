"use client";

import { useMemo, useState } from "react";
import type { Workout } from "@/types/workout";
import { toDateKey } from "@/types/workout";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

interface ProfileCalendarProps {
  workouts: Workout[];
}

export function ProfileCalendar({ workouts }: ProfileCalendarProps) {
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
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

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", gap: 6 }}>
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
                    style={{ flex: 1, aspectRatio: "1" }}
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
                bg = "var(--foreground)";
                border = "none";
              } else if (isFuture) {
                bg = "rgba(0,0,0,0.04)";
                border = "none";
              } else {
                bg = "rgba(0,0,0,0.08)";
                border = "none";
              }

              return (
                <div
                  key={di}
                  style={{
                    flex: 1,
                    aspectRatio: "1",
                    borderRadius: "50%",
                    backgroundColor: bg,
                    border,
                    boxSizing: "border-box",
                    transform: `scale(${scale})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 0.25s var(--ease-out-expo), border-color 0.2s ease",
                    boxShadow: hasWorkout && !isToday ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
                  }}
                >
                  {isToday && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: hasWorkout ? "#fff" : "var(--accent)",
                        letterSpacing: "-0.03em",
                        lineHeight: 1,
                      }}
                    >
                      {date.getDate()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
