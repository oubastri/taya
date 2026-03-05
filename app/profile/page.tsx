"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useWorkouts } from "@/hooks/use-workouts";
import { useLogSheet } from "@/contexts/log-sheet";
import { ProfileCalendar } from "@/components/ProfileCalendar";
import { ProfileSegmentedControl, type ProfileSection } from "@/components/ProfileSegmentedControl";
import { FeedPost } from "@/components/FeedPost";
import { ProfileStatNumber } from "@/components/ProfileStatNumber";
import type { FeedItem } from "@/hooks/use-friends";
import { UserAvatar } from "@/components/UserAvatar";
import { shareUrl } from "@/lib/share";

const PROFILE_PHOTO_URL = "/profilephotos/user10.jpg";

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

  /** Group workouts by month (year-month from date), newest month first */
  const movesByMonth = useMemo(() => {
    const map = new Map<string, typeof workouts>();
    for (const w of postsSorted) {
      const key = w.date.slice(0, 7); // "YYYY-MM"
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

  if (!uh || !wh) return null;

  const displayName = user.name || "Breezy De Vrij";
  const handle = user.handle || "breezyv";
  const contentMaxWidth = 428;

  const handleShareProfile = useCallback(async () => {
    await shareUrl("/profile/me", {
      title: "TAYA",
      text: `Check out my profile on TAYA — ${displayName}`,
    });
  }, [displayName]);

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
          <button
            type="button"
            onClick={handleShareProfile}
            aria-label="Share profile"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 12,
              color: "var(--foreground)",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
            className="active:opacity-80"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
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
                        return dayWorkouts.map((workout) => {
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
                        });
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
                    {monthWorkouts.map((workout) => {
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
                    })}
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
