"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useUser } from "@/hooks/use-user";
import { useWorkouts } from "@/hooks/use-workouts";
import { useFriends, type FeedItem } from "@/hooks/use-friends";
import { FeedPost } from "@/components/FeedPost";
import { UserAvatar } from "@/components/UserAvatar";

export default function FeedPage() {
  const { user, hydrated: uh } = useUser();
  const { workouts, hydrated: wh } = useWorkouts();
  const { getFeedWorkouts, hydrated: fh } = useFriends();

  const hydrated = uh && wh && fh;
  const feedItems = useMemo(
    () => (hydrated ? getFeedWorkouts(workouts, user.avatarUrl) : []),
    [hydrated, workouts, getFeedWorkouts, user.avatarUrl]
  );
  const sortedFeedItems = useMemo(
    () =>
      [...feedItems].sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [feedItems]
  );

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
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
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
        <Link
          href="/profile"
          style={{
            flexShrink: 0,
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
              Start moving.
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
              Tap the + button to log your first workout. Your friends will see when you move.
            </p>
          </div>
        )}

        {/* Feed */}
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          {sortedFeedItems.map((item, i) => (
            <div
              key={`${item.userId}-${item.id}`}
              style={{ animationDelay: `${i * 40}ms` }}
              className="animate-fade-in-up"
            >
              <FeedPost workout={item} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
