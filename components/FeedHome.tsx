"use client";

import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
} from "react";
import { loadLikersForEntity } from "@/lib/load-likers";
import { useUser } from "@/hooks/use-user";
import { useWorkouts } from "@/hooks/use-workouts";
import { useFriends } from "@/hooks/use-friends";
import { useLikes } from "@/hooks/use-likes";
import { FeedPost } from "@/components/FeedPost";
import { MovesCounter } from "@/components/MovesCounter";
import { FeedToggle, type FeedMode } from "@/components/FeedToggle";
import { TayaWordmark } from "@/components/TayaWordmark";
import { AccountMenu } from "@/components/AccountMenu";
import {
  isRealMode,
  fetchFeedPage,
  fetchFeedTotal,
  toggleLikeSupabase,
  type FeedPageItem,
} from "@/lib/data-adapter";
import { useToast } from "@/contexts/toast";
import type { FeedItem } from "@/hooks/use-friends";

/** Shown below the feed while the next server page loads (real mode). */
function FeedLoadMoreSpinner() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading more posts"
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "22px 0 10px",
      }}
    >
      <div
        className="settings-avatar-spin"
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: "2px solid color-mix(in srgb, var(--foreground) 18%, transparent)",
          borderTopColor: "var(--foreground)",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

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

const FEED_HEADER_GLASS_BTN: CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: "100px",
  backdropFilter: "blur(24px) saturate(1.8)",
  WebkitBackdropFilter: "blur(24px) saturate(1.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  padding: 0,
  flexShrink: 0,
};

/** Initial batch and each infinite-scroll step (mock: client slice; real: RPC page). */
const FEED_PAGE_SIZE = 20;

export default function FeedHome() {
  const { toast } = useToast();
  const { user, hydrated: uh } = useUser();
  const { workouts, hydrated: wh } = useWorkouts();
  const { friends, getFeedWorkouts, getAllFeedWorkouts, hydrated: fh } =
    useFriends();

  const [feedMode, setFeedMode] = useState<FeedMode>("team");
  const [visibleCount, setVisibleCount] = useState(FEED_PAGE_SIZE);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  const mockDataReady = !isRealMode && uh && wh && fh;
  const realSocialReady = isRealMode && uh && fh;

  const [realFeedRows, setRealFeedRows] = useState<FeedPageItem[]>([]);
  const [realFeedHasMore, setRealFeedHasMore] = useState(true);
  const [realFeedLoadingInitial, setRealFeedLoadingInitial] = useState(true);
  const [realFeedLoadingMore, setRealFeedLoadingMore] = useState(false);
  const [realFeedTotal, setRealFeedTotal] = useState<number | null>(null);

  const currentUser = useMemo(
    () => ({ id: user.id, name: user.name, handle: user.handle, avatarUrl: user.avatarUrl }),
    [user.id, user.name, user.handle, user.avatarUrl],
  );

  const teamItems = useMemo(
    () => (mockDataReady ? getFeedWorkouts(workouts, currentUser) : []),
    [mockDataReady, workouts, getFeedWorkouts, currentUser],
  );

  const stadiumItems = useMemo(
    () => (mockDataReady ? getAllFeedWorkouts(workouts, currentUser) : []),
    [mockDataReady, workouts, getAllFeedWorkouts, currentUser],
  );

  const feedItems = feedMode === "team" ? teamItems : stadiumItems;

  const sortedFeedItems = useMemo(
    () =>
      [...feedItems].sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [feedItems],
  );

  useEffect(() => {
    setVisibleCount(FEED_PAGE_SIZE);
  }, [feedMode]);

  useEffect(() => {
    setVisibleCount((c) =>
      sortedFeedItems.length === 0 ? FEED_PAGE_SIZE : Math.min(c, sortedFeedItems.length),
    );
  }, [sortedFeedItems.length]);

  const visibleFeedItems = useMemo(
    () => sortedFeedItems.slice(0, visibleCount),
    [sortedFeedItems, visibleCount],
  );

  const canLoadMoreMock = !isRealMode && visibleCount < sortedFeedItems.length;

  useEffect(() => {
    if (!mockDataReady || !canLoadMoreMock) return;
    const el = loadMoreSentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        setVisibleCount((c) =>
          Math.min(c + FEED_PAGE_SIZE, sortedFeedItems.length),
        );
      },
      { root: null, rootMargin: "280px 0px", threshold: 0 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [mockDataReady, canLoadMoreMock, sortedFeedItems.length]);

  useEffect(() => {
    if (!realSocialReady) return;
    let cancelled = false;
    setRealFeedLoadingInitial(true);
    setRealFeedRows([]);
    setRealFeedHasMore(true);
    setRealFeedTotal(null);

    (async () => {
      try {
        const [total, page] = await Promise.all([
          fetchFeedTotal(feedMode),
          fetchFeedPage(feedMode, null, FEED_PAGE_SIZE),
        ]);
        if (cancelled) return;
        setRealFeedTotal(total);
        setRealFeedRows(page.items);
        setRealFeedHasMore(page.hasMore);
      } catch {
        if (!cancelled) toast("Couldn't load feed", "error");
      } finally {
        if (!cancelled) setRealFeedLoadingInitial(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [realSocialReady, feedMode]);

  const loadMoreRealFeed = useCallback(async () => {
    if (!realSocialReady || !realFeedHasMore || realFeedLoadingMore || realFeedRows.length === 0) {
      return;
    }
    const last = realFeedRows[realFeedRows.length - 1]!;
    const cursor = { date: last.date, createdAt: last.createdAt, id: last.id };

    setRealFeedLoadingMore(true);
    try {
      const page = await fetchFeedPage(feedMode, cursor, FEED_PAGE_SIZE);
      setRealFeedRows((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        const merged = [...prev];
        for (const it of page.items) {
          if (!seen.has(it.id)) {
            seen.add(it.id);
            merged.push(it);
          }
        }
        return merged;
      });
      setRealFeedHasMore(page.hasMore);
    } catch {
      toast("Couldn't load more", "error");
    } finally {
      setRealFeedLoadingMore(false);
    }
  }, [
    realSocialReady,
    realFeedHasMore,
    realFeedLoadingMore,
    realFeedRows,
    feedMode,
    toast,
  ]);

  const loadMoreRealRef = useRef(loadMoreRealFeed);
  loadMoreRealRef.current = loadMoreRealFeed;

  useEffect(() => {
    if (!realSocialReady || realFeedLoadingInitial || !realFeedHasMore || realFeedLoadingMore) {
      return;
    }
    const el = loadMoreSentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        void loadMoreRealRef.current();
      },
      { root: null, rootMargin: "280px 0px", threshold: 0 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [
    realSocialReady,
    realFeedLoadingInitial,
    realFeedHasMore,
    realFeedLoadingMore,
    realFeedRows.length,
    feedMode,
  ]);

  const applyRealLike = useCallback((row: FeedPageItem, liked: boolean, likeCount: number) => {
    setRealFeedRows((rs) =>
      rs.map((r) => (r.id === row.id ? { ...r, likedByMe: liked, likeCount } : r)),
    );
  }, []);

  const onToggleRealLike = useCallback(
    async (row: FeedPageItem) => {
      const prevLiked = row.likedByMe;
      const prevCount = row.likeCount;
      const nextLiked = !prevLiked;
      const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);
      applyRealLike(row, nextLiked, nextCount);

      const result = await toggleLikeSupabase(row.id);
      if (result === null) {
        toast("Couldn't update like", "error");
        applyRealLike(row, prevLiked, prevCount);
        return;
      }

      const newCount = result.liked
        ? prevLiked
          ? prevCount
          : prevCount + 1
        : prevLiked
          ? Math.max(0, prevCount - 1)
          : prevCount;
      applyRealLike(row, result.liked, newCount);
    },
    [applyRealLike, toast],
  );

  const workoutIds = useMemo(
    () => (isRealMode ? [] : sortedFeedItems.map((item) => item.id)),
    [isRealMode, sortedFeedItems],
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

  const groupedMockItems = useMemo(() => {
    const groups: { date: string; items: typeof visibleFeedItems }[] = [];
    for (const item of visibleFeedItems) {
      const last = groups[groups.length - 1];
      if (last && last.date === item.date) {
        last.items.push(item);
      } else {
        groups.push({ date: item.date, items: [item] });
      }
    }
    return groups;
  }, [visibleFeedItems]);

  const groupedRealItems = useMemo(() => {
    const groups: { date: string; items: FeedPageItem[] }[] = [];
    for (const item of realFeedRows) {
      const last = groups[groups.length - 1];
      if (last && last.date === item.date) {
        last.items.push(item);
      } else {
        groups.push({ date: item.date, items: [item] });
      }
    }
    return groups;
  }, [realFeedRows]);

  const handleFeedModeChange = useCallback((mode: FeedMode) => {
    setFeedMode(mode);
  }, []);

  const contentMaxWidth = 428;

  const showMockSkeleton = !isRealMode && !mockDataReady;
  const showRealSkeleton = isRealMode && (!realSocialReady || realFeedLoadingInitial);
  const showSkeleton = showMockSkeleton || showRealSkeleton;

  const movesCount = isRealMode ? realFeedTotal : feedItems.length;
  const showMovesSkeleton =
    isRealMode ? !realSocialReady || realFeedTotal === null : !mockDataReady;

  const showEmptyMock = mockDataReady && feedItems.length === 0;
  const showEmptyReal =
    realSocialReady && !realFeedLoadingInitial && realFeedRows.length === 0;
  const showEmpty = isRealMode ? showEmptyReal : showEmptyMock;

  const showListMock = mockDataReady && feedItems.length > 0;
  const showListReal = realSocialReady && !realFeedLoadingInitial && realFeedRows.length > 0;
  const showList = isRealMode ? showListReal : showListMock;

  const canLoadMoreReal =
    isRealMode && realFeedHasMore && !realFeedLoadingInitial && !realFeedLoadingMore;
  const showLoadSentinel = isRealMode ? canLoadMoreReal : canLoadMoreMock;
  const showLoadMoreSpinner = isRealMode && realFeedLoadingMore && showList;

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

        <div
          style={{
            position: "absolute",
            top: "max(env(safe-area-inset-top), 20px)",
            right: 20,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AccountMenu triggerStyle={FEED_HEADER_GLASS_BTN} />
        </div>
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
          {showMovesSkeleton ? (
            <div className="skeleton" style={{ width: 200, height: 28, borderRadius: 4 }} />
          ) : (
            <MovesCounter count={movesCount ?? 0} />
          )}
          <FeedToggle value={feedMode} onChange={handleFeedModeChange} />
        </div>

        {showSkeleton && <FeedSkeleton />}

        {!showSkeleton && showEmpty && (
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

        {!showSkeleton && showList && (
          <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 0 }}>
            {isRealMode
              ? groupedRealItems.map((group, gi) => {
                  let cardIndex = groupedRealItems
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
                                liked={item.likedByMe}
                                likeCount={item.likeCount}
                                onToggleLike={() => void onToggleRealLike(item)}
                                onLikeIfNeeded={() => {
                                  if (!item.likedByMe) void onToggleRealLike(item);
                                }}
                                resolveLikers={resolveLikers}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              : groupedMockItems.map((group, gi) => {
                  let cardIndex = groupedMockItems
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
                          const mockItem = item as FeedItem;
                          const like = getLike(mockItem.id);
                          const i = cardIndex++;
                          return (
                            <div
                              key={`${mockItem.userId}-${mockItem.id}-${feedMode}`}
                              style={{ animationDelay: `${i * 40}ms` }}
                              className="animate-fade-in-up"
                            >
                              <FeedPost
                                workout={mockItem}
                                currentUserId={user.id}
                                liked={like.likedByMe}
                                likeCount={like.count}
                                onToggleLike={() => toggleLike(mockItem.id)}
                                onLikeIfNeeded={() => likeIfNeeded(mockItem.id)}
                                resolveLikers={resolveLikers}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            {showLoadSentinel && (
              <div
                ref={loadMoreSentinelRef}
                style={{ height: 1, width: "100%", flexShrink: 0 }}
                aria-hidden
              />
            )}
            {showLoadMoreSpinner && <FeedLoadMoreSpinner />}
          </div>
        )}
      </div>
    </main>
  );
}
