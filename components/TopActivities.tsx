"use client";

import type { Workout, ActivityType } from "@/types/workout";
import { ACTIVITY_LABELS } from "@/types/workout";
import { ActivityIcon } from "@/components/ActivityIcon";

interface TopActivitiesProps {
  workouts: Workout[];
}

export function TopActivities({ workouts }: TopActivitiesProps) {
  const counts = new Map<ActivityType, number>();
  for (const w of workouts) {
    const type = (w.activityType ?? "other") as ActivityType;
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }

  const sorted: [ActivityType, number][] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;

  if (sorted.length === 0) {
    return (
      <p
        style={{
          fontSize: 16,
          color: "var(--foreground-muted)",
          textAlign: "center",
          padding: "40px 0",
          margin: 0,
          letterSpacing: "-0.3px",
        }}
      >
        No moves logged yet.
      </p>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: 16,
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {sorted.map(([type, count], i) => (
        <div
          key={type}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "15px 18px",
            borderTop: i > 0 ? "1px solid var(--border)" : "none",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "var(--chip-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ActivityIcon type={type} size={18} />
          </div>
          <span
            style={{
              flex: 1,
              fontSize: 15,
              fontFamily: "var(--font-sans), sans-serif",
              fontWeight: 400,
              letterSpacing: "-0.3px",
              color: "var(--foreground)",
              minWidth: 0,
            }}
          >
            {ACTIVITY_LABELS[type]}
          </span>
          <span
            style={{
              fontSize: 13,
              fontFamily: "var(--font-sans), sans-serif",
              fontWeight: 500,
              color: "var(--foreground-subtle)",
              minWidth: 22,
              textAlign: "right",
              letterSpacing: "-0.2px",
              flexShrink: 0,
            }}
          >
            {count}
          </span>
          <div
            style={{
              width: 64,
              height: 3,
              borderRadius: 9999,
              backgroundColor: "var(--border-strong)",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: `${(count / max) * 100}%`,
                height: "100%",
                borderRadius: 9999,
                backgroundColor: "var(--accent)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
