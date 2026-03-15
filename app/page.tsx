"use client";

import Link from "next/link";
import { useMemo, useState, useCallback } from "react";
import { useUser } from "@/hooks/use-user";
import { useWorkouts } from "@/hooks/use-workouts";
import { useFriends } from "@/hooks/use-friends";
import { FeedPost } from "@/components/FeedPost";
import { MovesCounter } from "@/components/MovesCounter";
import { UserAvatar } from "@/components/UserAvatar";
import { FeedToggle, type FeedMode } from "@/components/FeedToggle";

export default function FeedPage() {
  const { user, hydrated: uh } = useUser();
  const { workouts, hydrated: wh } = useWorkouts();
  const { getFeedWorkouts, getAllFeedWorkouts, hydrated: fh } = useFriends();

  const [feedMode, setFeedMode] = useState<FeedMode>("team");

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

  const handleFeedModeChange = useCallback((mode: FeedMode) => {
    setFeedMode(mode);
  }, []);

  const contentMaxWidth = 428;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        paddingBottom: 96,
      }}
    >
      {/* Header — full bleed */}
      <header
        style={{
          padding: "max(env(safe-area-inset-top), 20px) 20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Top row: title + toggle + actions */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <h1
            style={{
              margin: 0,
              color: "#000",
              fontFamily: '"Lexend Deca", var(--font-sans), sans-serif',
              fontSize: "50.848px",
              fontStyle: "normal",
              fontWeight: 500,
              lineHeight: "44px",
              letterSpacing: "-5.085px",
            }}
          >
            To All You
            <br />
            <span style={{ color: "#01EF54" }}>Athletes</span>
          </h1>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexShrink: 0 }}>
            <FeedToggle value={feedMode} onChange={handleFeedModeChange} />
            <Link
              href="/friends"
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--foreground)",
                textDecoration: "none",
              }}
              className="active:opacity-80"
            >
              Friends
            </Link>
            <Link
              href="/profile"
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                overflow: "hidden",
                display: "block",
                textDecoration: "none",
                color: "inherit",
              }}
              aria-label="View your profile"
            >
              <UserAvatar
                avatarUrl={user.avatarUrl}
                name={user.name}
                fillParent
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Content — constrained column */}
      <div
        style={{
          width: "100%",
          maxWidth: contentMaxWidth,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* Live counter: total moves ever logged */}
        {hydrated && (
          <div style={{ padding: "0 16px" }}>
            <MovesCounter count={feedItems.length} />
          </div>
        )}

        {/* Empty state */}
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

        {/* Feed */}
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          {sortedFeedItems.map((item, i) => (
            <div
              key={`${item.userId}-${item.id}-${feedMode}`}
              style={{ animationDelay: `${i * 40}ms` }}
              className="animate-fade-in-up"
            >
              <FeedPost workout={item} currentUserId={user.id} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
