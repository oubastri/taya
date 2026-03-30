"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FeedItem } from "@/hooks/use-friends";
import { ACTIVITY_FEED_PHRASE, ACTIVITY_FEED_HIGHLIGHT } from "@/types/workout";
import type { ActivityType } from "@/types/workout";
import type { LikePerson } from "@/types/likes";
import { ActivityIcon } from "./ActivityIcon";
import { UserAvatar } from "./UserAvatar";
import { FeedLikeButton } from "./FeedLikeButton";
import { LikersSheet } from "./LikersSheet";

const ACTIVITY_GREEN = "#01EF54";

function getActivityPhrase(activityType: string): string {
  return ACTIVITY_FEED_PHRASE[activityType as ActivityType] ?? ACTIVITY_FEED_PHRASE.other;
}

interface FeedPostProps {
  workout: FeedItem;
  currentUserId?: string;
  liked?: boolean;
  likeCount?: number;
  onToggleLike?: () => void;
  /** Double-tap / one-shot like (does not unlike if already liked). */
  onLikeIfNeeded?: () => void;
  /** Load people who liked this entity (workout or prompt id). */
  resolveLikers?: (entityId: string) => Promise<LikePerson[]>;
  /** Defaults to `workout.id` when omitted. */
  likeEntityId?: string;
  density?: "default" | "compact";
  /** Your own post: compact edit/delete controls (e.g. profile calendar day sheet). */
  postActions?: {
    onEdit: () => void;
    onDelete: () => void;
  };
}

export function FeedPost({
  workout,
  currentUserId,
  liked: likedProp,
  likeCount: likeCountProp,
  onToggleLike,
  onLikeIfNeeded,
  resolveLikers,
  likeEntityId,
  density = "default",
  postActions,
}: FeedPostProps) {
  const AVATAR_SIZE = density === "compact" ? 32 : 44;
  const ICON_SIZE = density === "compact" ? 24 : 28;
  const OVERLAP = density === "compact" ? 6 : 10;
  const AVATAR_RADIUS = density === "compact" ? 10.67 : 14;
  const activityType = (workout.activityType ?? "other") as ActivityType;
  const phrase = getActivityPhrase(activityType);
  const highlight = ACTIVITY_FEED_HIGHLIGHT[activityType] ?? ACTIVITY_FEED_HIGHLIGHT.other;
  const isMe = currentUserId ? workout.userId === currentUserId : workout.userId === "me";
  const showPostActions = isMe && postActions;
  const hasDescription = Boolean(workout.description?.trim());
  const beforeHighlight = phrase.slice(0, phrase.indexOf(highlight));
  const afterHighlight = phrase.slice(phrase.indexOf(highlight) + highlight.length);

  const router = useRouter();
  const profileHref = isMe ? "/profile" : `/profile/${workout.userId}`;

  const entityId = likeEntityId ?? workout.id;

  const managed = likedProp !== undefined && onToggleLike !== undefined;
  const [localLiked, setLocalLiked] = useState(false);
  const [localCount, setLocalCount] = useState(0);

  const liked = managed ? likedProp : localLiked;
  const likeCount = managed ? (likeCountProp ?? 0) : localCount;

  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCardTapRef = useRef<{ t: number; id: string } | null>(null);

  const [likersOpen, setLikersOpen] = useState(false);
  const [likersPeople, setLikersPeople] = useState<LikePerson[]>([]);
  const [likersLoading, setLikersLoading] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  const clearNavTimer = () => {
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
  };

  useEffect(() => () => clearNavTimer(), []);

  useEffect(() => setPortalReady(true), []);

  const scheduleNav = () => {
    clearNavTimer();
    navTimerRef.current = setTimeout(() => {
      navTimerRef.current = null;
      router.push(profileHref);
    }, 320);
  };

  const handleLike = () => {
    if (managed) {
      onToggleLike?.();
      return;
    }
    if (localLiked) {
      setLocalLiked(false);
      setLocalCount((c) => Math.max(0, c - 1));
    } else {
      setLocalLiked(true);
      setLocalCount((c) => c + 1);
    }
  };

  const applyDoubleTapLike = () => {
    if (managed) {
      if (!liked) onLikeIfNeeded?.();
      return;
    }
    if (!localLiked) handleLike();
  };

  const onCardPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.closest(
        "button, a, [data-feed-like-heart], [data-feed-like-count]",
      )
    ) {
      return;
    }

    const now = Date.now();
    const prev = lastCardTapRef.current;
    if (prev && prev.id === entityId && now - prev.t < 380) {
      clearNavTimer();
      lastCardTapRef.current = null;
      applyDoubleTapLike();
      return;
    }
    lastCardTapRef.current = { t: now, id: entityId };
    clearNavTimer();
    scheduleNav();
  };

  const openLikers = useCallback(async () => {
    if (!resolveLikers || likeCount <= 0) return;
    setLikersPeople([]);
    setLikersLoading(true);
    setLikersOpen(true);
    try {
      const people = await resolveLikers(entityId);
      setLikersPeople(people);
    } finally {
      setLikersLoading(false);
    }
  }, [resolveLikers, likeCount, entityId]);

  const onSelectLiker = useCallback(
    (userId: string) => {
      setLikersOpen(false);
      if (currentUserId && userId === currentUserId) router.push("/profile");
      else router.push(`/profile/${userId}`);
    },
    [router, currentUserId],
  );

  useEffect(() => {
    if (!likersOpen) return;
    document.body.classList.add("search-open");
    return () => document.body.classList.remove("search-open");
  }, [likersOpen]);

  return (
    <>
      <article
        onPointerUp={onCardPointerUp}
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: 32,
          padding: density === "compact" ? 16 : "16px 16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
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
            {workout.userAvatarUrl ? (
              <div
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderRadius: AVATAR_RADIUS,
                  overflow: "hidden",
                  border: "1px solid var(--card-ring)",
                  flexShrink: 0,
                }}
              >
                <UserAvatar
                  avatarUrl={workout.userAvatarUrl}
                  name={workout.userName}
                  fillParent
                  expandable
                />
              </div>
            ) : (
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
                    borderRadius: AVATAR_RADIUS,
                    overflow: "hidden",
                    border: "1px solid var(--card-ring)",
                    flexShrink: 0,
                  }}
                >
                  <UserAvatar name={workout.userName} fillParent />
                </div>
              </Link>
            )}
            <div
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_RADIUS,
                backgroundColor: "var(--card-icon-bg)",
                border: "1px solid var(--card-ring)",
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
              gap: 8,
              flexShrink: 0,
            }}
          >
            {showPostActions ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    postActions.onEdit();
                  }}
                  aria-label="Edit move"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "1px solid var(--card-ring)",
                    backgroundColor: "var(--card-icon-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                  className="active:scale-95"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--foreground)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    postActions.onDelete();
                  }}
                  aria-label="Delete move"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "1px solid var(--card-ring)",
                    backgroundColor: "var(--card-icon-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                  className="active:scale-95"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--foreground)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </>
            ) : null}
            <FeedLikeButton
              liked={liked}
              likeCount={likeCount}
              onToggleHeart={handleLike}
              onOpenLikers={
                managed && resolveLikers && likeCount > 0 ? openLikers : undefined
              }
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 16,
            fontWeight: 400,
            letterSpacing: "-0.64px",
            color: "var(--foreground)",
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
                {workout.userHandle}
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
            <span style={{ color: ACTIVITY_GREEN }}>{highlight}</span>
            <span>{afterHighlight}.</span>
          </p>
          {hasDescription && (
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "var(--text-secondary)",
                letterSpacing: "-0.56px",
                lineHeight: "normal",
              }}
            >
              {workout.description}
            </p>
          )}
        </div>
      </article>

      {portalReady &&
        likersOpen &&
        likersLoading &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--overlay)",
              fontFamily: "var(--font-sans), sans-serif",
              color: "var(--foreground-muted)",
            }}
            role="status"
            aria-live="polite"
          >
            Loading…
          </div>,
          document.body,
        )}

      {likersOpen && !likersLoading && (
        <LikersSheet
          people={likersPeople}
          onClose={() => setLikersOpen(false)}
          onSelectProfile={onSelectLiker}
        />
      )}
    </>
  );
}
