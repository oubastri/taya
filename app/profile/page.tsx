"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useWorkouts } from "@/hooks/use-workouts";
import { ProfileCalendar } from "@/components/ProfileCalendar";
import { ProfileSegmentedControl, type ProfileSection } from "@/components/ProfileSegmentedControl";
import { FeedPost } from "@/components/FeedPost";
import { ProfileStatNumber } from "@/components/ProfileStatNumber";
import type { FeedItem } from "@/hooks/use-friends";
import { UserAvatar } from "@/components/UserAvatar";

const PROFILE_PHOTO_URL = "/pfp/profile.jpg";

export default function ProfilePage() {
  const { user, hydrated: uh, updateUser } = useUser();
  const { workouts, stats, hydrated: wh } = useWorkouts();
  const [section, setSection] = useState<ProfileSection>("calendar");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    if (uh) setNameInput(user.name || "Breezy De Vrij");
  }, [uh, user.name]);

  useEffect(() => {
    if (!uh || user.avatarUrl === PROFILE_PHOTO_URL) return;
    updateUser({ avatarUrl: PROFILE_PHOTO_URL });
  }, [uh, user.avatarUrl, updateUser]);

  const handleBlur = () => {
    if (nameInput.trim()) updateUser({ name: nameInput.trim() });
    setEditingName(false);
  };

  const postsSorted = useMemo(
    () => [...workouts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [workouts]
  );
  const activeDaysThisMonth = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const dates = new Set(workouts.filter((w) => w.date.startsWith(prefix)).map((w) => w.date));
    return dates.size;
  }, [workouts]);

  if (!uh || !wh) return null;

  const displayName = user.name || "Breezy De Vrij";
  const handle = user.handle || "breezyv";
  const contentMaxWidth = 428;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        paddingBottom: 96,
      }}
    >
      {/* Top bar - full bleed */}
      <div style={{ padding: "max(env(safe-area-inset-top), 52px) 16px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 12,
              color: "var(--foreground)",
              textDecoration: "none",
              WebkitTapHighlightColor: "transparent",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
            aria-label="Back to feed"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
              aria-hidden
            >
              <path d="M21 12H3" />
              <path d="M10 19L3 12l7-7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Content - constrained column */}
      <div
        style={{
          width: "100%",
          maxWidth: contentMaxWidth,
          margin: "0 auto",
          padding: "0 16px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 32,
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--foreground)",
              marginBottom: 12,
            }}
          >
            <UserAvatar
              avatarUrl={user.avatarUrl ?? PROFILE_PHOTO_URL}
              name={displayName}
              fillParent
            />
          </div>
          {editingName ? (
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  setNameInput(displayName);
                  setEditingName(false);
                }
              }}
              autoFocus
              style={{
                fontFamily: '"Lexend Deca", var(--font-sans), sans-serif',
                fontSize: 32,
                fontStyle: "normal",
                fontWeight: 400,
                lineHeight: "normal",
                letterSpacing: "-1.28px",
                color: "#000",
                border: "none",
                borderBottom: "2px solid var(--accent)",
                background: "transparent",
                outline: "none",
                padding: "2px 0",
                textAlign: "left",
                width: "100%",
              }}
            />
          ) : (
            <h1
              onClick={() => {
                setEditingName(true);
                setNameInput(displayName);
              }}
              style={{
                fontFamily: '"Lexend Deca", var(--font-sans), sans-serif',
                fontSize: 32,
                fontStyle: "normal",
                fontWeight: 400,
                lineHeight: "normal",
                letterSpacing: "-1.28px",
                color: "#000",
                margin: 0,
                cursor: "text",
                textAlign: "left",
              }}
            >
              {displayName}
            </h1>
          )}
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--foreground-subtle)",
              textAlign: "left",
            }}
          >
            @{handle}
          </p>
        </div>

        <div style={{ marginBottom: 28 }}>
          <ProfileSegmentedControl value={section} onChange={setSection} />
        </div>

        <p
          style={{
            fontFamily: '"Lexend Deca", var(--font-sans), sans-serif',
            fontSize: 32,
            fontStyle: "normal",
            fontWeight: 400,
            lineHeight: "normal",
            letterSpacing: "-1.28px",
            color: "#000",
            marginTop: 28,
            marginBottom: 40,
            overflow: "visible",
          }}
        >
          <ProfileStatNumber variant={0}>{workouts.length}</ProfileStatNumber> total moves.{" "}
          <ProfileStatNumber variant={1}>{stats.thisMonth}</ProfileStatNumber> this month.{" "}
          <ProfileStatNumber variant={2}>{stats.thisWeek}</ProfileStatNumber> this week.
        </p>

        <div
          key={section}
          className="animate-fade-in-up"
          style={{
            animationDuration: "0.35s",
            animationTimingFunction: "var(--ease-out-expo)",
          }}
        >
        {section === "calendar" && (
          <div>
            <div
              style={{
                backgroundColor: "var(--surface)",
                borderRadius: 8,
                border: "1px solid var(--border)",
                padding: "22px 20px",
              }}
            >
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  color: "var(--foreground-muted)",
                  marginBottom: 20,
                }}
              >
                {activeDaysThisMonth} active {activeDaysThisMonth === 1 ? "day" : "days"} this month
              </p>
              <ProfileCalendar workouts={workouts} />
            </div>
          </div>
        )}

        {section === "posts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {postsSorted.length === 0 ? (
              <p
                style={{
                  fontSize: 16,
                  color: "var(--foreground-muted)",
                  textAlign: "center",
                  padding: "32px 0",
                }}
              >
                No posts yet. Log a move to see it here.
              </p>
            ) : (
              postsSorted.map((workout) => {
                const feedItem: FeedItem = {
                  ...workout,
                  userId: "me",
                  userName: displayName,
                  userHandle: handle,
                  userAvatarUrl: user.avatarUrl,
                };
                return (
                  <FeedPost
                    key={workout.id}
                    workout={feedItem}
                  />
                );
              })
            )}
          </div>
        )}
        </div>
      </div>
    </main>
  );
}
