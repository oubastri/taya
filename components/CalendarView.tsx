"use client";

import { useMemo, useState } from "react";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

type Props = {
  year: number;
  month: number;
  workoutDates: Set<string>;
  today: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate?: (dateKey: string) => void;
  onAddWorkout?: (dateKey: string) => void;
};

export function CalendarView({
  year,
  month,
  workoutDates,
  today,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onAddWorkout,
}: Props) {
  const [hoveredDateKey, setHoveredDateKey] = useState<string | null>(null);
  const { calendarDays } = useMemo(() => {
    const first = new Date(year, month, 1);
    const firstDay = (first.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
    return { calendarDays };
  }, [year, month]);

  const monthLabel = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="flex w-full flex-col items-center gap-7 px-4"
      style={{ fontFamily: "var(--font-sans), sans-serif", width: "100%" }}
    >
      {/* Month/year + arrows */}
      <div className="flex w-full items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-black hover:bg-black/5"
          aria-label="Previous month"
        >
          <ChevronLeft />
        </button>
        <span
          className="text-center font-normal text-black"
          style={{ letterSpacing: "-0.02em", fontSize: "clamp(1.125rem, 2.5vw, 1.375rem)" }}
        >
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-black hover:bg-black/5"
          aria-label="Next month"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Day headers - soft gray so day numbers stand out */}
      <div
        className="grid w-full text-center font-medium"
        style={{
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0,
          fontSize: "clamp(0.875rem, 2vw, 1rem)",
          color: "#737373",
        }}
      >
        {DAYS.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      {/* Day grid - rounded squares, full circle on hover (workout days) */}
      <div
        className="grid w-full text-center"
        style={{
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0,
        }}
      >
        {calendarDays.map((d, i) => {
          if (d === null) {
            return <div key={`e-${i}`} />;
          }
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const hasWorkout = workoutDates.has(dateKey);
          const isToday = dateKey === today;
          const isHovered = hoveredDateKey === dateKey;

          const defaultRadius = 12;
          const circleRadius = "50%";
          const canViewWorkout = hasWorkout && onSelectDate;
          const canAddWorkout = !hasWorkout && onAddWorkout;

          let bg: string;
          let color: string;
          let border: string;
          let radius: number | string = defaultRadius;

          if (hasWorkout) {
            // Workout days: green circle by default (click to view)
            bg = "#11EB0E";
            color = "#000";
            border = "none";
            radius = circleRadius;
          } else if (canAddWorkout && isHovered) {
            // Non-workout days: grey default, green on hover (no stroke)
            bg = "#11EB0E";
            color = "#000";
            border = "none";
            radius = circleRadius;
          } else if (isToday) {
            bg = "#FFF";
            color = "#000";
            border = "1.5px solid #000";
          } else {
            bg = "#EFEFEF";
            color = "#737373";
            border = "none";
          }

          const inner = (
            <div
              className="flex h-full w-full items-center justify-center font-normal"
              style={{
                backgroundColor: bg,
                color,
                border,
                borderRadius: radius,
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "clamp(0.875rem, 2.2vw, 1.125rem)",
                transition: "border-radius 0.3s ease, background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease",
              }}
            >
              {d}
            </div>
          );

          if (canViewWorkout) {
            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => onSelectDate(dateKey)}
                onMouseEnter={() => setHoveredDateKey(dateKey)}
                onMouseLeave={() => setHoveredDateKey(null)}
                className="flex aspect-square w-full cursor-pointer items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black active:scale-[0.98]"
              >
                {inner}
              </button>
            );
          }
          if (canAddWorkout) {
            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => onAddWorkout(dateKey)}
                onMouseEnter={() => setHoveredDateKey(dateKey)}
                onMouseLeave={() => setHoveredDateKey(null)}
                className="flex aspect-square w-full cursor-pointer items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black active:scale-[0.98]"
              >
                {inner}
              </button>
            );
          }
          return (
            <div
              key={dateKey}
              className="flex aspect-square items-center justify-center"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
