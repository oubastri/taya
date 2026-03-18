"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFriends } from "@/hooks/use-friends";
import { useLikes } from "@/hooks/use-likes";
import { ProfileCalendar } from "@/components/ProfileCalendar";
import { ProfileSegmentedControl, type ProfileSection } from "@/components/ProfileSegmentedControl";
import { FeedPost } from "@/components/FeedPost";
import { ProfileStatNumber } from "@/components/ProfileStatNumber";
import type { FeedItem } from "@/hooks/use-friends";
import { UserAvatar } from "@/components/UserAvatar";
import type { Workout } from "@/types/workout";
import { shareUrl } from "@/lib/share";

function BackArrow() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Go back"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        borderRadius: 12,
        color: "var(--foreground)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden>
        <path d="M21 12H3" />
        <path d="M10 19L3 12l7-7" />
      </svg>
    </button>
  );
}

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

function UserProfileSkeleton() {
  return (
    <div style={{ padding: "0 16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        <div className="skeleton" style={{ width: 84, height: 84, borderRadius: 32 }} />
        <div className="skeleton" style={{ width: 180, height: 32, borderRadius: 8 }} />
      </div>
      <div className="skeleton" style={{ height: 40, borderRadius: 8, marginBottom: 28 }} />
      <div className="skeleton" style={{ height: 300, borderRadius: 8 }} />
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = typeof params.userId === "string" ? params.userId : "";
  const { friends, hydrated: fh, follow, unfollow } = useFriends();
  const [section, setSection] = useState<ProfileSection>("calendar");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [calendarDisplayKey, setCalendarDisplayKey] = useState<string | null>(null);
  const [calendarExiting, setCalendarExiting] = useState(false);

  const isMe = userId === "me";
  const friend = !isMe ? friends.find((f) => f.id === userId) : null;
  const workouts = useMemo(() => friend?.workouts ?? [], [friend?.workouts]);

  const workoutIds = useMemo(() => workouts.map((w) => w.id), [workouts]);
  const { getLike, toggleLike } = useLikes(workoutIds);

  const postsSorted = useMemo(
    () => [...workouts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [workouts]
  );

  const movesByMonth = useMemo(() => {
    const map = new Map<string, typeof workouts>();
    for (const w of postsSorted) {
      const key = w.date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, list]) => {
        const [y, m] = key.split("-").map(Number);
        const label = new Date(y, m - 1, 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        return { key, label, workouts: list };
      });
  }, [postsSorted]);

  const stats = friend ? getStats(workouts) : { thisMonth: 0, thisWeek: 0 };
  const isFollowing = friend?.following ?? false;
  const contentMaxWidth = 428;

  const handleShareProfile = useCallback(async () => {
    if (!friend) return;
    await shareUrl(`/profile/${friend.id}`, {
      title: "TAYA",
      text: `Check out ${friend.name}'s profile on TAYA — @${friend.handle}`,
    });
  }, [friend]);

  useEffect(() => {
    if (!fh) return;
    if (isMe) {
      router.replace("/profile");
      return;
    }
  }, [isMe, fh, router]);

  useEffect(() => {
    if (selectedDateKey !== null) {
      setCalendarDisplayKey(selectedDateKey);
      setCalendarExiting(false);
    } else if (calendarDisplayKey !== null) {
      setCalendarExiting(true);
    }
  }, [selectedDateKey, calendarDisplayKey]);

  useEffect(() => {
    if (!calendarExiting) return;
    const t = setTimeout(() => {
      setCalendarDisplayKey(null);
      setCalendarExiting(false);
    }, 200);
    return () => clearTimeout(t);
  }, [calendarExiting]);

  if (!fh || isMe) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: 96 }}>
        <div style={{ padding: "max(env(safe-area-inset-top), 20px) 16px 0" }}>
          <div style={{ height: 44, marginBottom: 24 }} />
        </div>
        <div style={{ maxWidth: 428, margin: "0 auto" }}>
          <UserProfileSkeleton />
        </div>
      </main>
    );
  }

  if (!friend) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          padding: "max(env(safe-area-inset-top), 20px) 20px",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <BackArrow />
        </div>
        <p style={{ fontSize: 18, color: "var(--foreground-muted)", letterSpacing: "-0.02em" }}>
          User not found.
        </p>
      </main>
    );
  }

  function renderFeedPost(workout: Workout) {
    const feedItem: FeedItem = {
      ...workout,
      userId: friend!.id,
      userName: friend!.name,
      userHandle: friend!.handle,
      userAvatarUrl: friend!.avatarUrl,
    };
    const like = getLike(workout.id);
    return (
      <FeedPost
        key={workout.id}
        workout={feedItem}
        liked={like.likedByMe}
        likeCount={like.count}
        onToggleLike={() => toggleLike(workout.id)}
      />
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
      <div style={{ padding: "max(env(safe-area-inset-top), 20px) 16px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-start", minWidth: 0 }}>
            <BackArrow />
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
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, minWidth: 0 }}>
            <button
              type="button"
              onClick={handleShareProfile}
              aria-label="Share profile"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: 12,
                color: "var(--foreground)",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                flexShrink: 0,
                WebkitTapHighlightColor: "transparent",
              }}
              className="active:opacity-80"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
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
              fontFamily: "var(--font-sans), sans-serif",
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
            fontFamily: "var(--font-sans), sans-serif",
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
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: 8,
              border: "1px solid var(--border)",
              padding: "22px 20px",
              overflow: "hidden",
            }}
          >
            <ProfileCalendar
              workouts={workouts}
              readOnly
              selectedDateKey={selectedDateKey}
              onSelectDate={(dk) => setSelectedDateKey((prev) => (prev === dk ? null : dk))}
            />
            <div
              style={{
                display: "grid",
                gridTemplateRows:
                  calendarDisplayKey !== null && !calendarExiting ? "1fr" : "0fr",
                transition: `grid-template-rows ${calendarExiting ? "0.2" : "0.3"}s var(--ease-out-expo)`,
                minHeight: 0,
              }}
            >
              <div style={{ minHeight: 0, overflow: "hidden" }}>
                {calendarDisplayKey && (
                  <>
                    <div
                      style={{
                        borderTop: "1px solid var(--border)",
                        marginTop: 40,
                        paddingTop: 20,
                        paddingBottom: 20,
                      }}
                    />
                    <div
                      key={calendarDisplayKey}
                      className={calendarExiting ? "calendar-post-exit" : "animate-fade-in-up"}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                        marginTop: -20,
                        animationDuration: calendarExiting ? undefined : "0.3s",
                        animationTimingFunction: "var(--ease-out-expo)",
                        paddingBottom: 10,
                      }}
                    >
                      {workouts
                        .filter((w) => w.date === calendarDisplayKey)
                        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                        .map(renderFeedPost)}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {section === "posts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {movesByMonth.length === 0 ? (
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
              movesByMonth.map(({ key, label, workouts: monthWorkouts }) => (
                <section key={key}>
                  <h2
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--foreground-subtle)",
                      letterSpacing: "0.02em",
                      margin: "0 0 12px",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {monthWorkouts.map(renderFeedPost)}
                  </div>
                </section>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
