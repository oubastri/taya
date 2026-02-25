"use client";

import type { Workout } from "@/types/workout";
import { ACTIVITY_LABELS, ACTIVITY_VERB } from "@/types/workout";
import { ActivityIcon, BRAND_GREEN } from "./ActivityIcon";
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

export interface ProfilePostCardProps {
  workout: Workout;
  userHandle: string;
  userAvatarUrl?: string;
  ordinals?: { week: number; month: number };
}

export function ProfilePostCard({
  workout,
  userHandle,
  userAvatarUrl,
  ordinals,
}: ProfilePostCardProps) {
  const activityType = workout.activityType ?? "other";
  const label = ACTIVITY_LABELS[activityType];
  const verb = ACTIVITY_VERB[activityType];

  return (
    <article
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: 8,
        padding: "16px 20px 14px",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: BRAND_GREEN,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ActivityIcon type={activityType} size={24} />
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              overflow: "hidden",
              boxShadow: "0 0 0 1.5px #fff",
              flexShrink: 0,
            }}
          >
            <UserAvatar
              avatarUrl={userAvatarUrl}
              name={userHandle}
              size="md"
            />
          </div>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: "var(--foreground-muted)",
            flexShrink: 0,
          }}
        >
          {timeAgo(workout.createdAt)}
        </span>
      </div>

      <div
        style={{
          fontFamily: '"Lexend Deca", var(--font-sans), sans-serif',
          color: "var(--foreground)",
          fontSize: 24,
          fontWeight: 400,
          lineHeight: "28px",
          letterSpacing: "-0.96px",
        }}
      >
        <span style={{ textDecoration: "underline" }}>@{userHandle}</span>
        <span> {verb} </span>
        <span style={{ color: "#0174ef" }}>{label.toLowerCase()}</span>
        <span>.</span>
        {ordinals && (
          <>
            <br />
            {ordinal(ordinals.week)} move this week.
            <br />
            {ordinal(ordinals.month)} this month.
          </>
        )}
      </div>

      {workout.description && (
        <p
          style={{
            margin: "12px 0 0",
            fontSize: 16,
            fontWeight: 400,
            color: "var(--foreground-muted)",
            lineHeight: 1.4,
            letterSpacing: "-0.01em",
          }}
        >
          {workout.description}
        </p>
      )}

      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--foreground-subtle)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          0
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--foreground-subtle)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          0
        </span>
      </div>
    </article>
  );
}
