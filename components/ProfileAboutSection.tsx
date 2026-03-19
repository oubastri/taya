"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { ProfilePrompt } from "@/types/user";
import type { LikePerson, LikeState } from "@/types/likes";
import { FeedLikeButton } from "@/components/FeedLikeButton";
import { LikersSheet } from "@/components/LikersSheet";

interface ProfileAboutSectionProps {
  prompts?: ProfilePrompt[];
  promptLikeIds?: string[];
  getLike?: (id: string) => LikeState;
  toggleLike?: (id: string) => void;
  likeIfNeeded?: (id: string) => void;
  resolveLikers?: (id: string) => Promise<LikePerson[]>;
  currentUserId?: string;
}

export function ProfileAboutSection({
  prompts,
  promptLikeIds,
  getLike,
  toggleLike,
  likeIfNeeded,
  resolveLikers,
  currentUserId,
}: ProfileAboutSectionProps) {
  const router = useRouter();
  const [localLikes, setLocalLikes] = useState<Record<number, LikeState>>({});
  const lastTapRef = useRef<{ t: number; id: string } | null>(null);

  const [likersOpen, setLikersOpen] = useState(false);
  const [likersPeople, setLikersPeople] = useState<LikePerson[]>([]);
  const [likersLoading, setLikersLoading] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  const getPromptLike = useCallback(
    (index: number): LikeState => {
      const id = promptLikeIds?.[index];
      if (id && getLike) return getLike(id);
      return localLikes[index] ?? { count: 0, likedByMe: false };
    },
    [getLike, localLikes, promptLikeIds],
  );

  const handleTogglePrompt = useCallback(
    (index: number) => {
      const id = promptLikeIds?.[index];
      if (id && toggleLike) {
        toggleLike(id);
        return;
      }
      setLocalLikes((prev) => {
        const cur = prev[index] ?? { count: 0, likedByMe: false };
        return {
          ...prev,
          [index]: {
            count: cur.likedByMe ? Math.max(0, cur.count - 1) : cur.count + 1,
            likedByMe: !cur.likedByMe,
          },
        };
      });
    },
    [promptLikeIds, toggleLike],
  );

  const openLikers = useCallback(
    async (entityId: string) => {
      if (!resolveLikers) return;
      setLikersPeople([]);
      setLikersLoading(true);
      setLikersOpen(true);
      try {
        const people = await resolveLikers(entityId);
        setLikersPeople(people);
      } finally {
        setLikersLoading(false);
      }
    },
    [resolveLikers],
  );

  const onSelectLiker = useCallback(
    (userId: string) => {
      setLikersOpen(false);
      if (currentUserId && userId === currentUserId) router.push("/profile");
      else router.push(`/profile/${userId}`);
    },
    [router, currentUserId],
  );

  useEffect(() => setPortalReady(true), []);

  useEffect(() => {
    if (!likersOpen) return;
    document.body.classList.add("search-open");
    return () => document.body.classList.remove("search-open");
  }, [likersOpen]);

  const onPromptPointerUp = (
    e: React.PointerEvent,
    index: number,
    like: LikeState,
  ) => {
    const id = promptLikeIds?.[index];
    if (!id || !likeIfNeeded) return;
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
    const prev = lastTapRef.current;
    if (prev && prev.id === id && now - prev.t < 380) {
      lastTapRef.current = null;
      if (!like.likedByMe) likeIfNeeded(id);
      return;
    }
    lastTapRef.current = { t: now, id };
  };

  const hasContent = prompts && prompts.length > 0;

  if (!hasContent) {
    return (
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
        Nothing here yet.
      </p>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {prompts!.map((prompt, i) => {
          const like = getPromptLike(i);
          const entityId = promptLikeIds?.[i];
          return (
            <div
              key={i}
              onPointerUp={(e) => onPromptPointerUp(e, i, like)}
              style={{
                backgroundColor: "var(--surface)",
                borderRadius: 32,
                padding: "24px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 36,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-mono), "B612 Mono", monospace',
                    fontSize: 12,
                    fontWeight: 400,
                    textTransform: "uppercase",
                    letterSpacing: "-1px",
                    color: "var(--foreground-subtle)",
                    lineHeight: "normal",
                    maxWidth: 205,
                    flex: "1 1 auto",
                    minWidth: 0,
                  }}
                >
                  {prompt.question}
                </p>
                <FeedLikeButton
                  liked={like.likedByMe}
                  likeCount={like.count}
                  onToggleHeart={() => handleTogglePrompt(i)}
                  onOpenLikers={
                    entityId && resolveLikers && like.count > 0
                      ? () => openLikers(entityId)
                      : undefined
                  }
                />
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 24,
                  fontWeight: 400,
                  lineHeight: "32px",
                  letterSpacing: "-0.96px",
                  color: "var(--foreground)",
                }}
              >
                {prompt.answer}
              </p>
            </div>
          );
        })}
      </div>

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
