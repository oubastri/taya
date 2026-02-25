"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useFriends } from "@/hooks/use-friends";
import { ProfileCalendar } from "@/components/ProfileCalendar";
import { ProfileSegmentedControl, type ProfileSection } from "@/components/ProfileSegmentedControl";
import { FeedPost } from "@/components/FeedPost";
import { ProfileStatNumber } from "@/components/ProfileStatNumber";
import type { FeedItem } from "@/hooks/use-friends";
import { UserAvatar } from "@/components/UserAvatar";
import type { Workout } from "@/types/workout";

function getStats(workouts: Workout[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );
  return {
    thisMonth: workouts.filter((w) => {
      const [y, m] = w.date.split("-").map(Number);
      return y === year && m === month + 1;
    }).length,
    thisWeek: workouts.filter((w) => {
      const d = new Date(w.date + "T12:00:00");
      return d >= weekStart && d <= endOfToday;
    }).length,
  };
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = typeof params.userId === "string" ? params.userId : "";
  const { friends, hydrated: fh, follow, unfollow } = useFriends();
  const [section, setSection] = useState<ProfileSection>("calendar");

  const isMe = userId === "me";
  const friend = !isMe ? friends.find((f) => f.id === userId) : null;
  const workouts = friend?.workouts ?? [];

  const postsSorted = useMemo(
    () => [...workouts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [workouts]
  );
  const activeDaysThisMonth = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return new Set(workouts.filter((w) => w.date.startsWith(prefix)).map((w) => w.date)).size;
  }, [workouts]);

  const stats = friend ? getStats(workouts) : { thisMonth: 0, thisWeek: 0 };
  const isFollowing = friend?.following ?? false;
  const contentMaxWidth = 428;

  useEffect(() => {
    if (!fh) return;
    if (isMe) {
      router.replace("/profile");
      return;
    }
  }, [isMe, fh, router]);

  if (!fh || isMe) return null;

  if (!friend) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          padding: "max(env(safe-area-inset-top), 52px) 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <Link
            href="/"
            aria-label="Back to feed"
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
        <p style={{ fontSize: 18, color: "var(--foreground-muted)", letterSpacing: "-0.02em" }}>
          User not found.
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        paddingBottom: 96,
      }}
    >
      {/* Top bar - full bleed (same as profile) */}
      <div style={{ padding: "max(env(safe-area-inset-top), 52px) 16px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-start", minWidth: 0 }}>
            <Link
              href="/"
              aria-label="Back to feed"
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
              className="active:opacity-80"
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
          <p
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: 500,
              color: "var(--foreground)",
              margin: 0,
              textAlign: "center",
              minWidth: 0,
            }}
          >
            @{friend.handle}
          </p>
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", minWidth: 0 }}>
            <button
              type="button"
              onClick={() => (isFollowing ? unfollow(friend.id) : follow(friend.id))}
              style={{
                padding: "8px 12px",
                borderRadius: 33,
                border: "none",
                backgroundColor: isFollowing ? "rgba(0,0,0,0.08)" : "var(--accent)",
                color: "var(--foreground)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                flexShrink: 0,
                WebkitTapHighlightColor: "transparent",
              }}
              className="active:opacity-90"
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          </div>
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
            <UserAvatar avatarUrl={friend.avatarUrl} name={friend.name} fillParent />
          </div>
          <h1
            style={{
              fontFamily: '"Lexend Deca", var(--font-sans), sans-serif',
              fontSize: 32,
              fontStyle: "normal",
              fontWeight: 400,
              lineHeight: "normal",
              letterSpacing: "-1.28px",
              color: "#000",
              margin: 0,
              textAlign: "left",
            }}
          >
            {friend.name}
          </h1>
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
      </div>

      <div
        key={section}
        className="animate-fade-in-up"
        style={{
          width: "100%",
          maxWidth: contentMaxWidth,
          margin: "0 auto",
          padding: "0 16px",
          boxSizing: "border-box",
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
              <ProfileCalendar workouts={workouts} readOnly />
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
                No posts yet.
              </p>
            ) : (
              postsSorted.map((workout) => {
                const feedItem: FeedItem = {
                  ...workout,
                  userId: friend.id,
                  userName: friend.name,
                  userHandle: friend.handle,
                  userAvatarUrl: friend.avatarUrl,
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
    </main>
  );
}
