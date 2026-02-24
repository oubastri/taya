"use client";

import type { FeedItem } from "@/hooks/use-friends";
import { ACTIVITY_LABELS, ACTIVITY_VERB } from "@/types/workout";
import { ActivityIcon, ACTIVITY_COLORS } from "./ActivityIcon";
import { UserAvatar } from "./UserAvatar";

function timeAgo(isoString: string): string {
  const sec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 86400 * 7) return `${Math.floor(sec / 86400)}d ago`;
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

interface FeedPostProps {
  workout: FeedItem;
  ordinals?: { week: number; month: number };
}

export function FeedPost({ workout, ordinals }: FeedPostProps) {
  const activityType = workout.activityType ?? "other";
  const label = ACTIVITY_LABELS[activityType];
  const verb = ACTIVITY_VERB[activityType];
  const color = ACTIVITY_COLORS[activityType];
  const isMe = workout.userId === "me";

  return (
    <article
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: 30,
        padding: "18px 20px 20px",
        border: "1px solid var(--border)",
      }}
    >
      {/* Top row: 48x48 icon then photo with -8px between (overlap 8px); photo on top (z-index), white stroke on photo */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 48 + 48 - 8,
            height: 48,
            flexShrink: 0,
          }}
        >
          {/* Activity icon container: 48x48, radius 16 (behind) */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: color,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              zIndex: 0,
            }}
          >
            <ActivityIcon type={activityType} size={26} />
          </div>
          {/* Avatar: 48x48, full circle, 1.5px white stroke, above icon */}
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 0,
              width: 48,
              height: 48,
              borderRadius: "50%",
              overflow: "hidden",
              boxShadow: "0 0 0 1.5px #fff",
              zIndex: 1,
            }}
          >
            <UserAvatar
              avatarUrl={workout.userAvatarUrl}
              name={workout.userName}
              size="md"
            />
          </div>
        </div>

        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--foreground-subtle)",
            flexShrink: 0,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {timeAgo(workout.createdAt)}
        </span>
      </div>

      {/* Main line + stats: same typography, single block so 28px line-height is even between all three */}
      <div
        style={{
          fontFamily: '"Lexend Deca", var(--font-sans), sans-serif',
          color: "#000",
          fontSize: 24,
          fontStyle: "normal",
          fontWeight: 400,
          lineHeight: "28px",
          letterSpacing: "-0.96px",
        }}
      >
        {isMe ? (
          <span style={{ textDecoration: "underline" }}>You</span>
        ) : (
          <>
            @<span style={{ textDecoration: "underline" }}>{workout.userHandle}</span>
          </>
        )}
        <span> {verb} </span>
        <span style={{ color }}>{label.toLowerCase()}.</span>
        {ordinals && (
          <>
            <br />
            {ordinal(ordinals.week)} move this week.
            <br />
            {ordinal(ordinals.month)} this month.
          </>
        )}
      </div>

      {/* Optional note */}
      {workout.description && (
        <p
          style={{
            margin: "12px 0 0",
            fontSize: 14,
            fontWeight: 400,
            color: "var(--foreground-muted)",
            lineHeight: 1.45,
            letterSpacing: "-0.01em",
          }}
        >
          {workout.description}
        </p>
      )}

      {/* Engagement: heart, comment */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--foreground-subtle)",
          }}
        >
          <HeartIcon />
          0
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--foreground-subtle)",
          }}
        >
          <CommentIcon />
          0
        </span>
      </div>
    </article>
  );
}

function HeartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
