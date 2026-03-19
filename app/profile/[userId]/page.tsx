"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useFriends } from "@/hooks/use-friends";
import { useLikes } from "@/hooks/use-likes";
import { ProfileCalendar } from "@/components/ProfileCalendar";
import { ProfileSegmentedControl, type ProfileSection } from "@/components/ProfileSegmentedControl";
import { FeedPost } from "@/components/FeedPost";
import { ProfileStatNumber } from "@/components/ProfileStatNumber";
import { ProfileAboutSection } from "@/components/ProfileAboutSection";
import type { FeedItem } from "@/hooks/use-friends";
import { UserAvatar } from "@/components/UserAvatar";
import type { Workout } from "@/types/workout";
import { shareUrl } from "@/lib/share";

const NAV_BTN_SIZE = 54;
const NAV_BTN_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: NAV_BTN_SIZE,
  height: NAV_BTN_SIZE,
  borderRadius: "100px",
  backdropFilter: "blur(24px) saturate(1.8)",
  WebkitBackdropFilter: "blur(24px) saturate(1.8)",
  background: "var(--glass-btn-bg)",
  border: "1px solid var(--glass-btn-border)",
  boxShadow: "var(--glass-btn-shadow)",
  cursor: "pointer",
  flexShrink: 0,
  WebkitTapHighlightColor: "transparent",
  padding: 0,
};

function formatDateLabel(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
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
    23, 59, 59, 999
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
    <div style={{ padding: "0 20px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        <div className="skeleton" style={{ width: 84, height: 84, borderRadius: 28 }} />
        <div className="skeleton" style={{ width: 160, height: 28, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 100, height: 14, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: 220, height: 14, borderRadius: 4 }} />
      </div>
      <div className="skeleton" style={{ height: 48, borderRadius: 9999, marginBottom: 20 }} />
      <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = typeof params.userId === "string" ? params.userId : "";
  const { friends, hydrated: fh, follow, unfollow } = useFriends();
  const [section, setSection] = useState<ProfileSection>("about");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDateKey, setSheetDateKey] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const sheetDragRef = useRef({ active: false, startY: 0, dy: 0 });
  const SPRING = "0.38s cubic-bezier(0.32, 0.72, 0, 1)";

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
    }
  }, [isMe, fh, router]);

  const openSheet = useCallback((dk: string) => {
    setSheetDateKey(dk);
    setSheetOpen(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetOpen(true)));
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setTimeout(() => setSheetDateKey(null), 420);
  }, []);

  const onHandleDown = (e: React.PointerEvent) => {
    sheetDragRef.current = { active: true, startY: e.clientY, dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };

  const onHandleMove = (e: React.PointerEvent) => {
    if (!sheetDragRef.current.active) return;
    const dy = Math.max(0, e.clientY - sheetDragRef.current.startY);
    sheetDragRef.current.dy = dy;
    if (sheetRef.current) sheetRef.current.style.transform = `translateX(-50%) translateY(${dy}px)`;
  };

  const onHandleUp = () => {
    if (!sheetDragRef.current.active) return;
    sheetDragRef.current.active = false;
    const { dy } = sheetDragRef.current;
    if (dy > 90) {
      const vh = window.innerHeight;
      if (sheetRef.current) {
        sheetRef.current.style.transition = `transform ${SPRING}`;
        sheetRef.current.style.transform = `translateX(-50%) translateY(${vh}px)`;
      }
      if (scrimRef.current) {
        scrimRef.current.style.transition = `opacity 0.38s ease`;
        scrimRef.current.style.opacity = "0";
      }
      setSheetOpen(false);
      setTimeout(() => setSheetDateKey(null), 420);
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = `transform ${SPRING}`;
        sheetRef.current.style.transform = "translateX(-50%) translateY(0)";
        setTimeout(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transition = "";
            sheetRef.current.style.transform = "";
          }
        }, 400);
      }
    }
  };

  if (!fh || isMe) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: 96 }}>
        <div style={{ padding: "max(env(safe-area-inset-top), 20px) 20px 0" }}>
          <div style={{ height: 44, marginBottom: 20 }} />
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
        <div style={{ marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            style={NAV_BTN_STYLE}
            className="active:scale-95"
          >
            <Image
              src="/icons/nav/arrow-left.svg"
              alt=""
              width={18}
              height={18}
              aria-hidden
              className="nav-btn-icon"
            />
          </button>
        </div>
        <p style={{ fontSize: 17, color: "var(--foreground-muted)", letterSpacing: "-0.3px" }}>
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
      {/* Back button — fixed top-left */}
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Go back"
        style={{
          ...NAV_BTN_STYLE,
          position: "fixed",
          top: "max(env(safe-area-inset-top), 20px)",
          left: 16,
          zIndex: 50,
        }}
        className="active:scale-95"
      >
        <Image
          src="/icons/nav/arrow-left.svg"
          alt=""
          width={20}
          height={20}
          aria-hidden
          className="nav-btn-icon"
        />
      </button>

      {/* Settings + Share — fixed top-right */}
      <div
        style={{
          position: "fixed",
          top: "max(env(safe-area-inset-top), 20px)",
          right: 16,
          zIndex: 50,
          display: "flex",
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/settings")}
          aria-label="Settings"
          style={NAV_BTN_STYLE}
          className="active:scale-95"
        >
          <Image
            src="/icons/nav/settings.svg"
            alt=""
            width={20}
            height={20}
            aria-hidden
            className="nav-btn-icon"
          />
        </button>
        <button
          type="button"
          onClick={handleShareProfile}
          aria-label="Share profile"
          style={NAV_BTN_STYLE}
          className="active:scale-95"
        >
          <Image
            src="/icons/nav/share.svg"
            alt=""
            width={20}
            height={20}
            aria-hidden
            className="nav-btn-icon"
          />
        </button>
      </div>

      {/* Spacer to push content below fixed buttons */}
      <div style={{ height: "calc(max(env(safe-area-inset-top), 20px) + 54px + 20px)" }} />

      {/* Content */}
      <div
        style={{
          width: "100%",
          maxWidth: 428,
          margin: "0 auto",
          padding: "0 16px",
          boxSizing: "border-box",
        }}
      >
        {/* Identity block */}
        <div style={{ marginBottom: 40 }}>
          {/* Avatar */}
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 28,
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--foreground-subtle)",
              marginBottom: 16,
            }}
          >
            <UserAvatar avatarUrl={friend.avatarUrl} name={friend.name} fillParent />
          </div>

          {/* Name + Follow row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 32,
                fontWeight: 500,
                letterSpacing: "-1.2px",
                color: "var(--foreground)",
                margin: 0,
                lineHeight: 1,
              }}
            >
              {friend.name}
            </h1>
            <button
              type="button"
              onClick={() => (isFollowing ? unfollow(friend.id) : follow(friend.id))}
              style={{
                padding: "8px 12px",
                height: 37,
                borderRadius: 9999,
                border: isFollowing ? "1px solid var(--border-strong)" : "none",
                backgroundColor: isFollowing ? "transparent" : "var(--accent)",
                color: isFollowing ? "var(--foreground)" : "#000",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: "-0.2px",
                cursor: "pointer",
                flexShrink: 0,
                WebkitTapHighlightColor: "transparent",
                fontFamily: "inherit",
                transition: "background-color 0.2s ease, color 0.2s ease",
                backdropFilter: "blur(10px)",
              }}
              className="active:scale-95"
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          </div>

          {/* Handle + location */}
          <p
            style={{
              margin: "0 0 2px",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "-0.2px",
              color: "var(--foreground-subtle)",
            }}
          >
            @{friend.handle}{friend.location ? ` · ${friend.location}` : ""}
          </p>

          {/* Followers / following */}
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "-0.2px",
              color: "var(--foreground-subtle)",
            }}
          >
            {friend.followersCount ?? 0} followers · {workouts.length} following
          </p>
        </div>

        {/* Segmented control */}
        <div style={{ marginBottom: 48 }}>
          <ProfileSegmentedControl value={section} onChange={setSection} />
        </div>

        {/* Section content */}
        <div
          key={section}
          className="animate-fade-in-up"
          style={{
            animationDuration: "0.3s",
            animationTimingFunction: "var(--ease-out-expo)",
          }}
        >
          {section === "about" && (
            <ProfileAboutSection
              tagline={friend.tagline}
              prompts={friend.prompts}
            />
          )}

          {section === "moves" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Stats sentence */}
              <p
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 32,
                  fontWeight: 400,
                  lineHeight: "32px",
                  letterSpacing: "-1.28px",
                  color: "var(--foreground)",
                  margin: 0,
                }}
              >
                <ProfileStatNumber variant={0}>{workouts.length}</ProfileStatNumber> total moves.{" "}
                <ProfileStatNumber variant={1}>{stats.thisMonth}</ProfileStatNumber> this month.{" "}
                <ProfileStatNumber variant={2}>{stats.thisWeek}</ProfileStatNumber> this week.
              </p>

              {/* Calendar */}
              <div
                style={{
                  backgroundColor: "var(--surface)",
                  borderRadius: 32,
                  padding: "20px 18px",
                }}
              >
                <ProfileCalendar
                  workouts={workouts}
                  readOnly
                  onSelectDate={openSheet}
                />
              </div>

              {/* Posts */}
              {movesByMonth.length === 0 ? (
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--foreground-muted)",
                    textAlign: "center",
                    padding: "40px 0",
                    letterSpacing: "-0.2px",
                    margin: 0,
                  }}
                >
                  No moves yet.
                </p>
              ) : (
                movesByMonth.map(({ key, label, workouts: monthWorkouts }) => (
                  <section key={key}>
                    <h2
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--foreground-subtle)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        margin: "0 0 10px",
                      }}
                    >
                      {label}
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {monthWorkouts.map(renderFeedPost)}
                    </div>
                  </section>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Day detail sheet */}
      {sheetDateKey !== null && (() => {
        const sheetWorkouts = workouts
          .filter((w) => w.date === sheetDateKey)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return (
          <>
            <div
              ref={scrimRef}
              onClick={closeSheet}
              aria-hidden
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 99,
                background: "var(--overlay)",
                opacity: sheetOpen ? 1 : 0,
                transition: `opacity ${SPRING}`,
              }}
            />
            <div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label={`Moves on ${sheetDateKey}`}
              style={{
                position: "fixed",
                bottom: 0,
                left: "50%",
                width: "100%",
                maxWidth: 428,
                zIndex: 100,
                background: "var(--sheet-bg)",
                backdropFilter: "blur(40px) saturate(1.8)",
                WebkitBackdropFilter: "blur(40px) saturate(1.8)",
                borderRadius: "32px 32px 0 0",
                boxShadow: "var(--sheet-shadow)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                maxHeight: "82svh",
                transform: sheetOpen ? "translateX(-50%)" : "translateX(-50%) translateY(100%)",
                transition: `transform ${SPRING}`,
              }}
            >
              <div
                onPointerDown={onHandleDown}
                onPointerMove={onHandleMove}
                onPointerUp={onHandleUp}
                onPointerCancel={onHandleUp}
                style={{
                  padding: "12px 24px 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                  cursor: "grab",
                  touchAction: "none",
                  userSelect: "none",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    background: "var(--drag-handle)",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={closeSheet}
                aria-label="Close"
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  zIndex: 1,
                  width: 54,
                  height: 54,
                  borderRadius: "100px",
                  background: "var(--close-btn-bg)",
                  border: "1px solid var(--close-btn-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  flexShrink: 0,
                }}
                className="active:scale-95"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--close-btn-icon)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
              <div
                style={{
                  overflowY: "auto",
                  flex: 1,
                  WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
                  scrollbarWidth: "none" as React.CSSProperties["scrollbarWidth"],
                }}
              >
                <div style={{ padding: "20px 20px 0" }}>
                  <h2
                    style={{
                      fontFamily: "var(--font-sans), sans-serif",
                      fontSize: "clamp(26px, 7vw, 32px)",
                      fontWeight: 500,
                      lineHeight: 1.15,
                      letterSpacing: "-0.04em",
                      color: "var(--foreground)",
                      margin: "0 0 4px",
                    }}
                  >
                    {formatDateLabel(sheetDateKey)}
                  </h2>
                  <p
                    style={{
                      margin: "0 0 20px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--foreground-subtle)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {sheetWorkouts.length} {sheetWorkouts.length === 1 ? "move" : "moves"}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    padding: "0 20px",
                    paddingBottom: "max(28px, env(safe-area-inset-bottom))",
                  }}
                >
                  {sheetWorkouts.map(renderFeedPost)}
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </main>
  );
}
