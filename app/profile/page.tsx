"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useWorkouts } from "@/hooks/use-workouts";
import { useLikes } from "@/hooks/use-likes";
import { useLogSheet } from "@/contexts/log-sheet";
import { ProfileCalendar } from "@/components/ProfileCalendar";
import { ProfileSegmentedControl, type ProfileSection } from "@/components/ProfileSegmentedControl";
import { FeedPost } from "@/components/FeedPost";
import { ProfileStatNumber } from "@/components/ProfileStatNumber";
import type { FeedItem } from "@/hooks/use-friends";
import { UserAvatar } from "@/components/UserAvatar";
import { IconButton } from "@/components/IconButton";
import { shareUrl } from "@/lib/share";
import { isRealMode } from "@/lib/data-adapter";

const PROFILE_PHOTO_URL = "/profilephotos/user10.jpg";

function ProfileSkeleton() {
  return (
    <div style={{ padding: "0 16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        <div className="skeleton" style={{ width: 84, height: 84, borderRadius: 32 }} />
        <div className="skeleton" style={{ width: 180, height: 32, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 100, height: 16, borderRadius: 6 }} />
      </div>
      <div className="skeleton" style={{ height: 40, borderRadius: 8, marginBottom: 28 }} />
      <div className="skeleton" style={{ height: 300, borderRadius: 8 }} />
    </div>
  );
}

export default function ProfilePage() {
  const { user, hydrated: uh, updateUser } = useUser();
  const { workouts, stats, hydrated: wh } = useWorkouts();
  const { open: openLogSheet } = useLogSheet();
  const [section, setSection] = useState<ProfileSection>("calendar");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [calendarDisplayKey, setCalendarDisplayKey] = useState<string | null>(null);
  const [calendarExiting, setCalendarExiting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const workoutIds = useMemo(() => workouts.map((w) => w.id), [workouts]);
  const { getLike, toggleLike } = useLikes(workoutIds);

  useEffect(() => {
    if (uh) setNameInput(user.name || "");
  }, [uh, user.name]);

  useEffect(() => {
    if (isRealMode) return;
    if (!uh || user.avatarUrl === PROFILE_PHOTO_URL) return;
    updateUser({ avatarUrl: PROFILE_PHOTO_URL });
  }, [uh, user.avatarUrl, updateUser]);

  const handleBlur = () => {
    if (nameInput.trim()) updateUser({ name: nameInput.trim() });
    setEditingName(false);
  };

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

  const handleShareProfile = useCallback(async () => {
    const name = user.name || "Breezy De Vrij";
    await shareUrl("/profile/me", {
      title: "TAYA",
      text: `Check out my profile on TAYA — ${name}`,
    });
  }, [user.name]);

  if (!uh || !wh) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: 96 }}>
        <div style={{ padding: "max(env(safe-area-inset-top), 20px) 16px 0" }}>
          <div style={{ height: 44, marginBottom: 24 }} />
        </div>
        <div style={{ maxWidth: 428, margin: "0 auto" }}>
          <ProfileSkeleton />
        </div>
      </main>
    );
  }

  const displayName = user.name || "Athlete";
  const handle = user.handle || "you";
  const contentMaxWidth = 428;

  function renderFeedPost(workout: typeof workouts[number]) {
    const feedItem: FeedItem = {
      ...workout,
      userId: user.id,
      userName: displayName,
      userHandle: handle,
      userAvatarUrl: user.avatarUrl,
    };
    const like = getLike(workout.id);
    return (
      <FeedPost
        key={workout.id}
        workout={feedItem}
        currentUserId={user.id}
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
      {/* Top bar - full bleed */}
      <div style={{ padding: "max(env(safe-area-inset-top), 20px) 16px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <IconButton href="/settings" label="Settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </IconButton>
            <IconButton onClick={handleShareProfile} label="Share profile">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </IconButton>
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
            <UserAvatar
              avatarUrl={user.avatarUrl}
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
                      {(() => {
                        const dayWorkouts = workouts
                          .filter((w) => w.date === calendarDisplayKey)
                          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                        if (dayWorkouts.length === 0) {
                          return (
                            <div
                              style={{
                                textAlign: "center",
                                padding: "24px 0",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 16,
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 16,
                                  color: "var(--foreground-muted)",
                                  margin: 0,
                                }}
                              >
                                No moves this day
                              </p>
                              <button
                                type="button"
                                onClick={() => openLogSheet(calendarDisplayKey)}
                                style={{
                                  padding: "12px 24px",
                                  borderRadius: 12,
                                  border: "1px solid var(--border)",
                                  backgroundColor: "rgba(0,0,0,0.06)",
                                  color: "var(--foreground)",
                                  fontSize: 15,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  font: "inherit",
                                  WebkitTapHighlightColor: "transparent",
                                }}
                                className="active:scale-95"
                              >
                                Log a move
                              </button>
                            </div>
                          );
                        }
                        return dayWorkouts.map(renderFeedPost);
                      })()}
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
                No posts yet. Log a move to see it here.
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
      </div>
    </main>
  );
}
