"use client";

import { useMemo } from "react";
import type { Workout } from "@/types/workout";
import { localNoonFromDateKey, toDateKey } from "@/types/workout";

interface ProfileChartsProps {
  workouts: Workout[];
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKS = 12;

function calcWeeklyCounts(workouts: Workout[]): Array<{ count: number; monday: Date }> {
  const now = new Date();
  const todayDow = now.getDay();
  const daysToMon = todayDow === 0 ? 6 : todayDow - 1;
  const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMon);

  const result: Array<{ count: number; monday: Date }> = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    const monday = new Date(thisMonday);
    monday.setDate(monday.getDate() - w * 7);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const count = workouts.filter((wo) => {
      const d = wo.date;
      return d >= toDateKey(monday) && d <= toDateKey(sunday);
    }).length;
    result.push({ count, monday });
  }
  return result;
}

function calcMonthLabels(weeks: Array<{ monday: Date }>): string[] {
  return weeks.map((w, i) => {
    if (i === 0) return w.monday.toLocaleDateString("en-US", { month: "short" });
    const prevMonth = weeks[i - 1].monday.getMonth();
    const curMonth = w.monday.getMonth();
    return curMonth !== prevMonth
      ? w.monday.toLocaleDateString("en-US", { month: "short" })
      : "";
  });
}

export function ProfileCharts({ workouts }: ProfileChartsProps) {
  const data = useMemo(() => {
    const weeklyCounts = calcWeeklyCounts(workouts);
    const monthLabels = calcMonthLabels(weeklyCounts.map((w) => ({ monday: w.monday })));

    const dowCounts = Array(7).fill(0);
    for (const w of workouts) {
      const d = localNoonFromDateKey(w.date);
      const dow = (d.getDay() + 6) % 7;
      dowCounts[dow]++;
    }

    return { weeklyCounts, monthLabels, dowCounts };
  }, [workouts]);

  if (workouts.length === 0) return null;

  const maxWeekly = Math.max(...data.weeklyCounts.map((w) => w.count), 1);
  const maxDow = Math.max(...data.dowCounts, 1);

  return (
    <>
      {/* Consistency — 12 weeks, accent for current week */}
      <div style={{ padding: "12px 14px 0" }}>
        <div
          style={{
            backgroundColor: "var(--surface)",
            borderRadius: "var(--radius-lg)",
            padding: "22px 20px 20px",
            border: "1px solid var(--border)",
          }}
        >
          <p
            style={{
              margin: "0 0 18px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--foreground-subtle)",
            }}
          >
            Consistency
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 5,
              height: 84,
            }}
          >
            {data.weeklyCounts.map(({ count }, i) => {
              const isCurrentWeek = i === WEEKS - 1;
              const barH = count > 0 ? Math.max((count / maxWeekly) * 70, 10) : 4;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: barH,
                    borderRadius: 6,
                    backgroundColor:
                      count === 0
                        ? "rgba(0,0,0,0.06)"
                        : isCurrentWeek
                        ? "var(--accent)"
                        : "var(--foreground)",
                    transition: "height 0.4s var(--ease-out-expo)",
                  }}
                />
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
            {data.monthLabels.map((label, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  fontSize: 9,
                  fontWeight: 600,
                  color: "var(--foreground-faint)",
                  letterSpacing: "0.02em",
                  textAlign: "center",
                  overflow: "hidden",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* When You Train — day-of-week pattern */}
      <div style={{ padding: "12px 14px 0" }}>
        <div
          style={{
            backgroundColor: "var(--surface)",
            borderRadius: "var(--radius-lg)",
            padding: "22px 20px 20px",
            border: "1px solid var(--border)",
          }}
        >
          <p
            style={{
              margin: "0 0 18px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--foreground-subtle)",
            }}
          >
            When you train
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              height: 76,
            }}
          >
            {data.dowCounts.map((count, i) => {
              const barH = count > 0 ? Math.max((count / maxDow) * 58, 10) : 4;
              const isFav = count === maxDow && count > 0;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: barH,
                      borderRadius: 6,
                      backgroundColor:
                        count === 0
                          ? "rgba(0,0,0,0.06)"
                          : isFav
                          ? "var(--accent)"
                          : "var(--foreground)",
                      transition: "height 0.4s var(--ease-out-expo)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                      color: isFav ? "var(--accent)" : "var(--foreground-subtle)",
                    }}
                  >
                    {DAY_LABELS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
