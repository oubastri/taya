"use client";

import { useState } from "react";
import Link from "next/link";
import type { FeedItem } from "@/hooks/use-friends";
import { ACTIVITY_FEED_PHRASE, ACTIVITY_FEED_HIGHLIGHT } from "@/types/workout";
import type { ActivityType } from "@/types/workout";
import { ActivityIcon } from "./ActivityIcon";
import { UserAvatar } from "./UserAvatar";

const ACTIVITY_BLUE = "#0174ef";

const AVATAR_SIZE = 44;
const ICON_SIZE = 28;
const OVERLAP = 10;

/** Format time as "7:37am" from ISO string */
function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** "today" | "yesterday" | "Feb 22" based on date relative to now */
function formatDateLabel(isoString: string): string {
  const d = new Date(isoString);
  const today = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return "today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(d, yesterday)) return "yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Grammar-correct phrase for feed: "did yoga", "played golf", "went for a run", etc. */
function getActivityPhrase(activityType: string): string {
  return ACTIVITY_FEED_PHRASE[activityType as ActivityType] ?? ACTIVITY_FEED_PHRASE.other;
}

interface FeedPostProps {
  workout: FeedItem;
  /** Initial like count (default 0) */
  initialLikeCount?: number;
}

export function FeedPost({ workout, initialLikeCount = 0 }: FeedPostProps) {
  const activityType = (workout.activityType ?? "other") as ActivityType;
  const phrase = getActivityPhrase(activityType);
  const highlight = ACTIVITY_FEED_HIGHLIGHT[activityType] ?? ACTIVITY_FEED_HIGHLIGHT.other;
  const isMe = workout.userId === "me";
  const hasDescription = Boolean(workout.description?.trim());
  const timeStr = formatTime(workout.createdAt);
  const dateLabel = formatDateLabel(workout.createdAt);
  const beforeHighlight = phrase.slice(0, phrase.indexOf(highlight));
  const afterHighlight = phrase.slice(phrase.indexOf(highlight) + highlight.length);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [animating, setAnimating] = useState(false);

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      setAnimating(true);
      setTimeout(() => setAnimating(false), 500);
    }
  };

  return (
    <article
      style={{
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        overflow: "hidden",
      }}
    >
      {/* Top row: avatar + overlapping activity icon (left), like button (right) */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            marginRight: -OVERLAP,
          }}
        >
          <Link
            href={isMe ? "/profile" : `/profile/${workout.userId}`}
            style={{
              flexShrink: 0,
              textDecoration: "none",
              color: "inherit",
            }}
            aria-label={isMe ? "View your profile" : `View ${workout.userName}'s profile`}
          >
            <div
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid #fff",
                flexShrink: 0,
              }}
            >
              <UserAvatar
                avatarUrl={workout.userAvatarUrl}
                name={workout.userName}
                fillParent
              />
            </div>
          </Link>
          <div
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: 14,
              backgroundColor: "#f3f3f3",
              border: "1px solid #fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginLeft: -OVERLAP,
              overflow: "hidden",
            }}
          >
            <ActivityIcon type={activityType} size={ICON_SIZE} />
          </div>
        </div>
        <LikeButton
          liked={liked}
          likeCount={likeCount}
          animating={animating}
          onToggle={handleLike}
        />
      </div>

      {/* Content: "@handle [phrase] today at 7:37am." + optional description */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          fontFamily: '"Lexend Deca", var(--font-sans), sans-serif',
          fontSize: 16,
          fontWeight: 400,
          letterSpacing: "-0.64px",
          color: "#000",
        }}
      >
        <p style={{ margin: 0, lineHeight: "normal" }}>
          <span>@</span>
          {isMe ? (
            <Link
              href="/profile"
              style={{ textDecoration: "underline", color: "inherit" }}
              aria-label="View your profile"
            >
              me
            </Link>
          ) : (
            <Link
              href={`/profile/${workout.userId}`}
              style={{ textDecoration: "underline", color: "inherit" }}
              aria-label={`View ${workout.userName}'s profile`}
            >
              {workout.userHandle}
            </Link>
          )}
          <span> {beforeHighlight}</span>
          <span style={{ color: ACTIVITY_BLUE }}>{highlight}</span>
          <span>{afterHighlight} {dateLabel} at {timeStr}.</span>
        </p>
        {hasDescription && (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "#919191",
              letterSpacing: "-0.56px",
              lineHeight: "normal",
            }}
          >
            {workout.description}
          </p>
        )}
      </div>
    </article>
  );
}

const HEART_COLOR = "#ff3b5c";
const HEART_GRAY = "#919191";

function LikeButton({
  liked,
  likeCount,
  animating,
  onToggle,
}: {
  liked: boolean;
  likeCount: number;
  animating: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={liked ? "Unlike" : "Like"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "6px 0",
        border: "none",
        background: "none",
        cursor: "pointer",
        flexShrink: 0,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transform: animating ? "scale(1.35)" : liked ? "scale(1.1)" : "scale(1)",
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease",
        }}
      >
        <HeartIcon filled={liked} />
      </span>
      <span
        style={{
          fontFamily: '"Lexend Deca", var(--font-sans), sans-serif',
          fontSize: 14,
          fontWeight: 500,
          color: liked ? HEART_COLOR : HEART_GRAY,
          letterSpacing: "-0.56px",
          transition: "color 0.2s ease",
        }}
      >
        {likeCount}
      </span>
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  const color = filled ? HEART_COLOR : HEART_GRAY;
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, color }}
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
