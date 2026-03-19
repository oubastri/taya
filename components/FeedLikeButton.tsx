"use client";

import { useState } from "react";

const HEART_COLOR = "#ff3b5c";
const HEART_GRAY = "var(--text-secondary)";

export function FeedLikeButton({
  liked,
  likeCount,
  onToggleHeart,
  onOpenLikers,
}: {
  liked: boolean;
  likeCount: number;
  onToggleHeart: () => void;
  onOpenLikers?: () => void;
}) {
  const [animating, setAnimating] = useState(false);
  const canOpenLikers = likeCount > 0 && Boolean(onOpenLikers);

  const heartPress = () => {
    onToggleHeart();
    if (!liked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 500);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        data-feed-like-heart
        onClick={(e) => {
          e.stopPropagation();
          heartPress();
        }}
        aria-label={liked ? "Unlike" : "Like"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px 0",
          border: "none",
          background: "none",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            transform: animating ? "scale(1.35)" : liked ? "scale(1.1)" : "scale(1)",
            transition:
              "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease",
          }}
        >
          <HeartIcon filled={liked} />
        </span>
      </button>
      {canOpenLikers ? (
        <button
          type="button"
          data-feed-like-count
          onClick={(e) => {
            e.stopPropagation();
            onOpenLikers?.();
          }}
          aria-label={`${likeCount} likes. Show who liked`}
          style={{
            padding: "6px 0",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: liked ? HEART_COLOR : HEART_GRAY,
            letterSpacing: "-0.56px",
            transition: "color 0.2s ease",
            WebkitTapHighlightColor: "transparent",
            minWidth: "1ch",
          }}
        >
          {likeCount}
        </button>
      ) : (
        <span
          style={{
            padding: "6px 0",
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: liked ? HEART_COLOR : HEART_GRAY,
            letterSpacing: "-0.56px",
            userSelect: "none",
            minWidth: "1ch",
          }}
          aria-hidden
        >
          {likeCount}
        </span>
      )}
    </div>
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
