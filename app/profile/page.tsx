"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useWorkouts } from "@/hooks/use-workouts";
import { ProfileCalendar } from "@/components/ProfileCalendar";
import { ProfileCharts } from "@/components/ProfileCharts";
import { UserAvatar } from "@/components/UserAvatar";
import { ActivityIcon, ACTIVITY_COLORS } from "@/components/ActivityIcon";
import { ACTIVITY_LABELS } from "@/types/workout";
import type { ActivityType } from "@/types/workout";

// user10 from :profilephotos: — always use this for your profile
const PROFILE_PHOTO_URL = "/pfp/profile.jpg";

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
    if (uh) setNameInput("Breezy De Vrij");
  }, [uh]);

  // Ensure profile photo is set to user10
  useEffect(() => {
    if (!uh || user.avatarUrl === PROFILE_PHOTO_URL) return;
    updateUser({ avatarUrl: PROFILE_PHOTO_URL });
  }, [uh, user.avatarUrl, updateUser]);

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
      {/* Identity + stats lockup (no container) */}
      <div style={{ padding: "max(env(safe-area-inset-top), 52px) 20px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--foreground)",
            }}
          >
            <UserAvatar
              avatarUrl={user.avatarUrl ?? PROFILE_PHOTO_URL}
              name="Breezy De Vrij"
              size="xl"
            />
          </div>
          <div style={{ minWidth: 0 }}>
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
                    setNameInput("Breezy De Vrij");
                    setEditingName(false);
                  }
                }}
                autoFocus
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.2,
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
                onClick={() => {
                  setEditingName(true);
                  setNameInput("Breezy De Vrij");
                }}
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.2,
                  margin: 0,
                  cursor: "text",
                  color: "var(--foreground)",
                }}
              >
                Breezy De Vrij
              </h1>
            )}
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--foreground-subtle)",
              }}
            >
              @breezyv
            </p>
          </div>
        </div>

        {/* Year / Month / Week inline */}
        <div
          style={{
            display: "flex",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            padding: "16px 0",
          }}
        >
          {[
            { label: "Year", value: stats.thisYear },
            { label: "Month", value: stats.thisMonth },
            { label: "Week", value: stats.thisWeek },
          ].map(({ label, value }, i) => (
            <div
              key={label}
              style={{
                flex: 1,
                textAlign: "center",
                borderLeft: i > 0 ? "1px solid var(--border)" : "none",
              }}
            >
              <div
                style={{
                  fontSize: 32,
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
                  marginTop: 4,
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
      </div>

      {/* Calendar — above consistency & when you train */}
      <div style={{ padding: "16px 14px 0" }}>
        <Card style={{ padding: "22px 20px" }}>
          <ProfileCalendar workouts={workouts} />
        </Card>
      </div>

      <ProfileCharts workouts={workouts} />

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
