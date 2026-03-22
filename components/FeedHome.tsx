"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { loadLikersForEntity } from "@/lib/load-likers";
import Image from "next/image";
import { useUser } from "@/hooks/use-user";
import { useWorkouts } from "@/hooks/use-workouts";
import { useFriends } from "@/hooks/use-friends";
import { useLikes } from "@/hooks/use-likes";
import { useTheme } from "@/hooks/use-theme";
import { FeedPost } from "@/components/FeedPost";
import { MovesCounter } from "@/components/MovesCounter";
import { FeedToggle, type FeedMode } from "@/components/FeedToggle";
import { TayaWordmark } from "@/components/TayaWordmark";

function FeedSkeleton() {
  return (
    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: 120, borderRadius: 32 }}
        />
      ))}
    </div>
  );
}

export default function FeedHome() {
  const { user, hydrated: uh } = useUser();
  const { workouts, hydrated: wh } = useWorkouts();
  const { friends, getFeedWorkouts, getAllFeedWorkouts, hydrated: fh } =
    useFriends();

  const [feedMode, setFeedMode] = useState<FeedMode>("team");
  const { theme, toggle: toggleTheme } = useTheme();
  const [exitingTheme, setExitingTheme] = useState<"light" | "dark" | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleToggleTheme = useCallback(() => {
    setExitingTheme(theme);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => setExitingTheme(null), 200);
    toggleTheme();
  }, [theme, toggleTheme]);

  const hydrated = uh && wh && fh;

  const currentUser = useMemo(
    () => ({ id: user.id, name: user.name, handle: user.handle, avatarUrl: user.avatarUrl }),
    [user.id, user.name, user.handle, user.avatarUrl],
  );

  const teamItems = useMemo(
    () => (hydrated ? getFeedWorkouts(workouts, currentUser) : []),
    [hydrated, workouts, getFeedWorkouts, currentUser]
  );

  const stadiumItems = useMemo(
    () => (hydrated ? getAllFeedWorkouts(workouts, currentUser) : []),
    [hydrated, workouts, getAllFeedWorkouts, currentUser]
  );

  const feedItems = feedMode === "team" ? teamItems : stadiumItems;

  const sortedFeedItems = useMemo(
    () =>
      [...feedItems].sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [feedItems]
  );

  const workoutIds = useMemo(
    () => sortedFeedItems.map((item) => item.id),
    [sortedFeedItems],
  );
  const likeViewer = useMemo(
    () =>
      uh
        ? {
            id: user.id,
            name: user.name,
            handle: user.handle,
            avatarUrl: user.avatarUrl,
          }
        : null,
    [uh, user.id, user.name, user.handle, user.avatarUrl],
  );
  const followingIds = useMemo(
    () => new Set(friends.filter((f) => f.following).map((f) => f.id)),
    [friends],
  );
  const resolveLikers = useCallback(
    (entityId: string) => loadLikersForEntity(entityId, followingIds),
    [followingIds],
  );
  const { getLike, toggleLike, likeIfNeeded } = useLikes(workoutIds, likeViewer);

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  function dateLabel(dateStr: string): string {
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    const [y, m, day] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  const groupedFeedItems = useMemo(() => {
    const groups: { date: string; items: typeof sortedFeedItems }[] = [];
    for (const item of sortedFeedItems) {
      const last = groups[groups.length - 1];
      if (last && last.date === item.date) {
        last.items.push(item);
      } else {
        groups.push({ date: item.date, items: [item] });
      }
    }
    return groups;
  }, [sortedFeedItems]);

  const handleFeedModeChange = useCallback((mode: FeedMode) => {
    setFeedMode(mode);
  }, []);

  const contentMaxWidth = 428;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        paddingBottom: 112,
      }}
    >
      <header
        style={{
          padding: "max(env(safe-area-inset-top), 20px) 20px 56px",
          position: "relative",
        }}
      >
        <TayaWordmark variant="feed" />

        <button
          type="button"
          onClick={handleToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="theme-toggle-btn"
          style={{
            position: "absolute",
            top: "max(env(safe-area-inset-top), 20px)",
            right: 20,
            width: 54,
            height: 54,
            borderRadius: "100px",
            backdropFilter: "blur(24px) saturate(1.8)",
            WebkitBackdropFilter: "blur(24px) saturate(1.8)",
            background: "var(--glass-btn-bg)",
            border: "1px solid var(--glass-btn-border)",
            boxShadow: "var(--glass-btn-shadow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            overflow: "hidden",
          }}
        >
          {exitingTheme && (
            <Image
              key={`exit-${exitingTheme}`}
              src={`/icons/dark-light-mode/${exitingTheme === "dark" ? "sun" : "moon"}.svg`}
              alt=""
              width={22}
              height={22}
              aria-hidden
              className={`activity-icon-auto theme-icon-exit`}
            />
          )}
          <Image
            key={`enter-${theme}`}
            src={`/icons/dark-light-mode/${theme === "dark" ? "sun" : "moon"}.svg`}
            alt=""
            width={22}
            height={22}
            aria-hidden
            className={`activity-icon-auto theme-icon-enter`}
          />
        </button>
      </header>

      <div
        style={{
          width: "100%",
          maxWidth: contentMaxWidth,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            padding: "0 16px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {hydrated ? (
            <MovesCounter count={feedItems.length} />
          ) : (
            <div className="skeleton" style={{ width: 200, height: 28, borderRadius: 4 }} />
          )}
          <FeedToggle value={feedMode} onChange={handleFeedModeChange} />
        </div>

        {!hydrated && <FeedSkeleton />}

        {hydrated && sortedFeedItems.length === 0 && (
          <div style={{ padding: "0 24px" }}>
            <p
              style={{
                margin: 0,
                fontSize: 36,
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                color: "var(--foreground)",
              }}
            >
              {feedMode === "team" ? "Start moving." : "No moves yet."}
            </p>
            <p
              style={{
                margin: "16px 0 0",
                fontSize: 15,
                fontWeight: 500,
                color: "var(--foreground-muted)",
                lineHeight: 1.5,
              }}
            >
              {feedMode === "team"
                ? "Tap the + button to log your first workout. Your friends will see when you move."
                : "Be the first to log a workout and show up in the Stadium."}
            </p>
          </div>
        )}

        {hydrated && (
          <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 0 }}>
            {groupedFeedItems.map((group, gi) => {
              let cardIndex = groupedFeedItems
                .slice(0, gi)
                .reduce((sum, g) => sum + g.items.length, 0);
              return (
                <div key={group.date}>
                  <p
                    style={{
                      margin: 0,
                      padding: gi === 0 ? "0 0 10px" : "24px 0 10px",
                      fontFamily: "var(--font-sans), sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      textTransform: "uppercase",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {dateLabel(group.date)}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {group.items.map((item) => {
                      const like = getLike(item.id);
                      const i = cardIndex++;
                      return (
                        <div
                          key={`${item.userId}-${item.id}-${feedMode}`}
                          style={{ animationDelay: `${i * 40}ms` }}
                          className="animate-fade-in-up"
                        >
                          <FeedPost
                            workout={item}
                            currentUserId={user.id}
                            liked={like.likedByMe}
                            likeCount={like.count}
                            onToggleLike={() => toggleLike(item.id)}
                            onLikeIfNeeded={() => likeIfNeeded(item.id)}
                            resolveLikers={resolveLikers}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
