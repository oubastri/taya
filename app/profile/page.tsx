"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useWorkouts } from "@/hooks/use-workouts";
import { ProfileCalendar } from "@/components/ProfileCalendar";
import { ProfileCharts } from "@/components/ProfileCharts";
import { ActivityIcon, ACTIVITY_COLORS } from "@/components/ActivityIcon";
import { ACTIVITY_LABELS } from "@/types/workout";
import type { ActivityType } from "@/types/workout";

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { user, hydrated: uh, updateUser } = useUser();
  const { workouts, stats, hydrated: wh } = useWorkouts();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    if (uh) setNameInput(user.name);
  }, [uh, user.name]);

  const activityCounts = workouts.reduce<Record<string, number>>((acc, w) => {
    const t = w.activityType ?? "other";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const topActivities = Object.entries(activityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const maxCount = topActivities[0]?.[1] ?? 1;

  if (!uh || !wh) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        paddingBottom: 96,
      }}
    >
      {/* Identity card */}
      <div style={{ padding: "max(env(safe-area-inset-top), 52px) 14px 0" }}>
        <Card style={{ padding: "26px 22px 24px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "var(--foreground)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 80 80" fill="none" aria-hidden>
              <circle cx="43" cy="18" r="7" fill="var(--accent)" />
              <line x1="41" y1="25" x2="37" y2="40" stroke="var(--accent)" strokeWidth="5.5" strokeLinecap="round" />
              <line x1="40" y1="31" x2="54" y2="27" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
              <line x1="40" y1="31" x2="26" y2="38" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
              <line x1="37" y1="40" x2="27" y2="55" stroke="var(--accent)" strokeWidth="5.5" strokeLinecap="round" />
              <line x1="37" y1="40" x2="50" y2="52" stroke="var(--accent)" strokeWidth="5.5" strokeLinecap="round" />
            </svg>
          </div>

          {editingName ? (
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={() => {
                if (nameInput.trim()) updateUser({ name: nameInput.trim() });
                setEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") {
                  setNameInput(user.name);
                  setEditingName(false);
                }
              }}
              autoFocus
              style={{
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 1,
                border: "none",
                borderBottom: "2px solid var(--accent)",
                background: "transparent",
                outline: "none",
                fontFamily: "inherit",
                color: "var(--foreground)",
                padding: "2px 0",
                width: "100%",
              }}
            />
          ) : (
            <h1
              onClick={() => setEditingName(true)}
              style={{
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 1,
                margin: 0,
                cursor: "text",
                color: "var(--foreground)",
              }}
            >
              {user.name}
            </h1>
          )}

          <p
            style={{
              margin: "6px 0 0",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--foreground-subtle)",
            }}
          >
            @{user.handle}
          </p>
        </Card>
      </div>

      {/* Stats card */}
      <div style={{ padding: "14px 14px 0" }}>
        <Card>
          <div style={{ display: "flex" }}>
            {[
              { label: "Year", value: stats.thisYear },
              { label: "Month", value: stats.thisMonth },
              { label: "Week", value: stats.thisWeek },
            ].map(({ label, value }, i) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  padding: "24px 0 22px",
                  borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    letterSpacing: "-0.05em",
                    lineHeight: 1,
                    color: "var(--foreground)",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    marginTop: 5,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--foreground-subtle)",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <ProfileCharts workouts={workouts} />

      {/* Calendar card */}
      <div style={{ padding: "12px 14px 0" }}>
        <Card style={{ padding: "22px 20px" }}>
          <ProfileCalendar workouts={workouts} />
        </Card>
      </div>

      {/* Top activities */}
      {topActivities.length > 0 && (
        <div style={{ padding: "12px 14px 0" }}>
          <Card style={{ padding: "8px 22px 6px" }}>
            {topActivities.map(([type, count], i) => (
              <div
                key={type}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  paddingTop: 16,
                  paddingBottom: 16,
                  borderBottom:
                    i < topActivities.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                <ActivityIcon type={type as ActivityType} size={36} badge />
                <span
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "var(--foreground)",
                  }}
                >
                  {ACTIVITY_LABELS[type as ActivityType]}
                </span>
                <div
                  style={{
                    flex: 2,
                    height: 6,
                    backgroundColor: "rgba(0,0,0,0.06)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(count / maxCount) * 100}%`,
                      backgroundColor: ACTIVITY_COLORS[type as ActivityType],
                      borderRadius: 3,
                      transition: "width 0.4s var(--ease-out-expo)",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--foreground-muted)",
                    minWidth: 24,
                    textAlign: "right",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </main>
  );
}
