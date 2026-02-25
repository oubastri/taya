"use client";

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
  /** View count shown next to eye icon (default 0) */
  viewCount?: number;
}

export function FeedPost({ workout, viewCount = 0 }: FeedPostProps) {
  const activityType = (workout.activityType ?? "other") as ActivityType;
  const phrase = getActivityPhrase(activityType);
  const highlight = ACTIVITY_FEED_HIGHLIGHT[activityType] ?? ACTIVITY_FEED_HIGHLIGHT.other;
  const isMe = workout.userId === "me";
  const hasDescription = Boolean(workout.description?.trim());
  const timeStr = formatTime(workout.createdAt);
  const dateLabel = formatDateLabel(workout.createdAt);
  const beforeHighlight = phrase.slice(0, phrase.indexOf(highlight));
  const afterHighlight = phrase.slice(phrase.indexOf(highlight) + highlight.length);

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
      {/* Top row: avatar + overlapping activity icon (left), eye + view count (right) */}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            flexShrink: 0,
          }}
        >
          <EyeIcon />
          <span
            style={{
              fontFamily: '"Lexend Deca", var(--font-sans), sans-serif',
              fontSize: 14,
              fontWeight: 400,
              color: "#919191",
              letterSpacing: "-0.56px",
            }}
          >
            {viewCount}
          </span>
        </div>
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

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      style={{ color: "#919191", flexShrink: 0 }}
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="currentColor" strokeWidth="2" />
      <path d="M1.125 12S4.989 4 12 4s10.875 8 10.875 8c0 0-3.865 8-10.875 8S1.125 12 1.125 12z" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
