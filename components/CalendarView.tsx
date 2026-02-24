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

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

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
    const firstDay = (first.getDay() + 6) % 7;
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
      <div className="flex w-full items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200 hover:bg-black/6 active:scale-95"
          style={{ color: "var(--foreground)" }}
          aria-label="Previous month"
        >
          <ChevronLeft />
        </button>
        <span
          className="text-center font-semibold"
          style={{
            letterSpacing: "-0.025em",
            fontSize: "clamp(1.125rem, 2.5vw, 1.375rem)",
            color: "var(--foreground)",
          }}
        >
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200 hover:bg-black/6 active:scale-95"
          style={{ color: "var(--foreground)" }}
          aria-label="Next month"
        >
          <ChevronRight />
        </button>
      </div>

      <div
        className="grid w-full text-center font-medium"
        style={{
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0,
          fontSize: "clamp(0.8rem, 2vw, 0.95rem)",
          color: "var(--foreground-subtle)",
          letterSpacing: "0.03em",
        }}
      >
        {DAYS.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      <div
        className="grid w-full text-center"
        style={{
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
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

          const defaultRadius = 14;
          const circleRadius = "50%";
          const canViewWorkout = hasWorkout && onSelectDate;
          const canAddWorkout = !hasWorkout && onAddWorkout;

          let bg: string;
          let color: string;
          let border: string;
          let radius: number | string = defaultRadius;
          let boxShadow = "none";

          if (hasWorkout) {
            bg = "var(--accent)";
            color = "#fff";
            border = "none";
            radius = circleRadius;
            boxShadow = "0 2px 8px var(--accent-glow)";
          } else if (canAddWorkout && isHovered) {
            bg = "var(--accent)";
            color = "#fff";
            border = "none";
            radius = circleRadius;
            boxShadow = "0 2px 8px var(--accent-glow)";
          } else if (isToday) {
            bg = "var(--surface)";
            color = "var(--foreground)";
            border = "2px solid var(--foreground)";
          } else {
            bg = "rgba(0,0,0,0.06)";
            color = "var(--foreground-subtle)";
            border = "none";
          }

          const inner = (
            <div
              className="flex h-full w-full items-center justify-center font-semibold"
              style={{
                backgroundColor: bg,
                color,
                border,
                borderRadius: radius,
                boxShadow,
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "clamp(0.875rem, 2.2vw, 1.1rem)",
                transition: "all 0.25s var(--ease-out-expo)",
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
                className="flex aspect-square w-full cursor-pointer items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black active:scale-95"
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
                className="flex aspect-square w-full cursor-pointer items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black active:scale-95"
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
