"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useFriends } from "@/hooks/use-friends";
import { useUser } from "@/hooks/use-user";
import { isRealMode, fetchWorkoutsForUser } from "@/lib/data-adapter";
import { loadLikersForEntity } from "@/lib/load-likers";
import { useLikes } from "@/hooks/use-likes";
import { ProfileCalendar } from "@/components/ProfileCalendar";
import { ProfileSegmentedControl, type ProfileSection } from "@/components/ProfileSegmentedControl";
import { FeedPost } from "@/components/FeedPost";
import { ProfileStatNumber } from "@/components/ProfileStatNumber";
import { ProfileAboutSection } from "@/components/ProfileAboutSection";
import { ProfileStatStrip } from "@/components/ProfileStatStrip";
import { LikersSheet } from "@/components/LikersSheet";
import { ProfileDayMovesSheet } from "@/components/ProfileDayMovesSheet";
import {
  buildProfileFansPeople,
  buildProfileFollowingPeople,
} from "@/lib/profile-social-lists";
import type { FeedItem } from "@/hooks/use-friends";
import type { LikePerson } from "@/types/likes";
import { UserAvatar } from "@/components/UserAvatar";
import { ProfileFollowButton } from "@/components/ProfileFollowButton";
import { type Workout, localNoonFromDateKey } from "@/types/workout";

/** Matches athletes tab search control (`app/athletes/page.tsx`) */
const PROFILE_NAV_HEIGHT = 54;

/** Sticky top bar — stays pinned while profile content scrolls */
const PROFILE_STICKY_TOP_BAR: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 51,
  width: "100vw",
  maxWidth: "100vw",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  boxSizing: "border-box",
  paddingTop: "max(env(safe-area-inset-top), 20px)",
  paddingBottom: 20,
  paddingLeft: 16,
  paddingRight: 16,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const PROFILE_GLASS_CIRCLE_STYLE: React.CSSProperties = {
  width: PROFILE_NAV_HEIGHT,
  height: PROFILE_NAV_HEIGHT,
  borderRadius: "100px",
  backdropFilter: "blur(24px) saturate(1.8)",
  WebkitBackdropFilter: "blur(24px) saturate(1.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
  WebkitTapHighlightColor: "transparent",
  padding: 0,
};

const AVATAR_RADIUS = 32.789;

const PROFILE_NAME_TAGLINE_TEXT: React.CSSProperties = {
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: 32,
  fontWeight: 400,
  lineHeight: "32px",
  letterSpacing: "-0.04em",
};

function getStats(workouts: Workout[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23, 59, 59, 999
  );
  return {
    thisMonth: workouts.filter((w) => {
      const [y, m] = w.date.split("-").map(Number);
      return y === year && m === month + 1;
    }).length,
    thisWeek: workouts.filter((w) => {
      const d = localNoonFromDateKey(w.date);
      return d >= weekStart && d <= endOfToday;
    }).length,
  };
}

function UserProfileSkeleton() {
  return (
    <div style={{ padding: "0 16px" }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 84, height: 84, borderRadius: AVATAR_RADIUS }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="skeleton" style={{ height: 18, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 18, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 18, borderRadius: 4 }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: 160, height: 28, borderRadius: 6, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 48, borderRadius: 9999, marginBottom: 32 }} />
      <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = typeof params.userId === "string" ? params.userId : "";
  const { friends, hydrated: fh, follow, unfollow } = useFriends();
  const { user: me, hydrated: mh } = useUser();
  const [section, setSection] = useState<ProfileSection>("about");
  const [socialSheet, setSocialSheet] = useState<{
    title: string;
    people: LikePerson[];
  } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDateKey, setSheetDateKey] = useState<string | null>(null);

  const isMe = userId === "me";
  const friend = !isMe ? friends.find((f) => f.id === userId) : null;
  const [profileWorkouts, setProfileWorkouts] = useState<Workout[] | null>(null);

  const workouts = useMemo(() => {
    if (!friend) return [];
    if (!isRealMode) return friend.workouts;
    return profileWorkouts ?? [];
  }, [friend, profileWorkouts]);

  const workoutsReady = !isRealMode ? true : profileWorkouts !== null;

  useEffect(() => {
    if (!isRealMode || !userId || isMe) return;
    let cancelled = false;
    setProfileWorkouts(null);
    fetchWorkoutsForUser(userId)
      .then((w) => {
        if (!cancelled) setProfileWorkouts(w);
      })
      .catch(() => {
        if (!cancelled) setProfileWorkouts([]);
      });
    return () => {
      cancelled = true;
    };
    // Intentionally omit `friend` from deps: follow/unfollow only mutates `following` on the
    // same object shape, and re-running would null `profileWorkouts` and flash the skeleton.
  }, [userId, isMe]);

  const workoutIds = useMemo(() => workouts.map((w) => w.id), [workouts]);
  const promptLikeIds = useMemo(
    () =>
      friend
        ? (friend.prompts ?? []).map((_, i) => `profile-prompt:${friend.id}:${i}`)
        : [],
    [friend],
  );
  const likeEntityIds = useMemo(
    () => [...workoutIds, ...promptLikeIds],
    [workoutIds, promptLikeIds],
  );
  const likeViewer = useMemo(
    () =>
      mh
        ? {
            id: me.id,
            name: me.name,
            handle: me.handle,
            avatarUrl: me.avatarUrl,
          }
        : null,
    [mh, me.id, me.name, me.handle, me.avatarUrl],
  );
  const followingIds = useMemo(
    () => new Set(friends.filter((f) => f.following).map((f) => f.id)),
    [friends],
  );
  const resolveLikers = useCallback(
    (entityId: string) => loadLikersForEntity(entityId, followingIds),
    [followingIds],
  );
  const { getLike, toggleLike, likeIfNeeded } = useLikes(likeEntityIds, likeViewer);

  const openFollowingSheet = useCallback(() => {
    if (!friend) return;
    const followingN =
      friend.followingCount ?? Math.max(0, Math.floor((friend.followersCount ?? 0) / 4));
    setSocialSheet({
      title: "Following",
      people: buildProfileFollowingPeople(friend.id, friends, followingN, false, followingIds),
    });
  }, [friend, friends, followingIds]);

  const openFansSheet = useCallback(() => {
    if (!friend) return;
    setSocialSheet({
      title: "Fans",
      people: buildProfileFansPeople(
        friend.id,
        friends,
        friend.followersCount ?? 0,
        followingIds,
      ),
    });
  }, [friend, friends, followingIds]);

  const onSelectSocialProfile = useCallback(
    (userId: string) => {
      setSocialSheet(null);
      if (userId === me.id) router.push("/profile");
      else router.push(`/profile/${userId}`);
    },
    [router, me.id],
  );

  const postsSorted = useMemo(
    () => [...workouts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [workouts]
  );

  const movesByMonth = useMemo(() => {
    const map = new Map<string, typeof workouts>();
    for (const w of postsSorted) {
      const key = w.date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, list]) => {
        const [y, m] = key.split("-").map(Number);
        const label = new Date(y, m - 1, 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        return { key, label, workouts: list };
      });
  }, [postsSorted]);

  const stats = friend ? getStats(workouts) : { thisMonth: 0, thisWeek: 0 };
  const isFollowing = friend?.following ?? false;

  useEffect(() => {
    if (!fh) return;
    if (isMe) {
      router.replace("/profile");
    }
  }, [isMe, fh, router]);

  useEffect(() => {
    if (!socialSheet) return;
    document.body.classList.add("search-open");
    return () => document.body.classList.remove("search-open");
  }, [socialSheet]);

  const openSheet = useCallback((dk: string) => {
    setSheetDateKey(dk);
    setSheetOpen(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetOpen(true)));
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setTimeout(() => setSheetDateKey(null), 420);
  }, []);

  const sheetWorkouts = useMemo(() => {
    if (!sheetDateKey) return [];
    return workouts
      .filter((w) => w.date === sheetDateKey)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [sheetDateKey, workouts]);

  if (!fh || !mh || isMe) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: 96 }}>
        <div style={{ padding: "max(env(safe-area-inset-top), 20px) 20px 0" }}>
          <div style={{ height: 44, marginBottom: 20 }} />
        </div>
        <div style={{ maxWidth: 428, margin: "0 auto" }}>
          <UserProfileSkeleton />
        </div>
      </main>
    );
  }

  if (friend && !workoutsReady) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: 96 }}>
        <div style={{ padding: "max(env(safe-area-inset-top), 20px) 20px 0" }}>
          <div style={{ height: 44, marginBottom: 20 }} />
        </div>
        <div style={{ maxWidth: 428, margin: "0 auto" }}>
          <UserProfileSkeleton />
        </div>
      </main>
    );
  }

  if (!friend) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          padding: "max(env(safe-area-inset-top), 20px) 20px",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            style={PROFILE_GLASS_CIRCLE_STYLE}
            className="app-glass-icon-btn active:scale-95"
          >
            <Image
              src="/icons/nav/arrow-left.svg"
              alt=""
              width={20}
              height={20}
              aria-hidden
              className="nav-btn-icon"
            />
          </button>
        </div>
        <p style={{ fontSize: 17, color: "var(--foreground-muted)", letterSpacing: "-0.3px" }}>
          User not found.
        </p>
      </main>
    );
  }

  function renderFriendFeedPost(workout: Workout, showMoveDate?: boolean) {
    const feedItem: FeedItem = {
      ...workout,
      userId: friend!.id,
      userName: friend!.name,
      userHandle: friend!.handle,
      userAvatarUrl: friend!.avatarUrl,
    };
    const like = getLike(workout.id);
    return (
      <FeedPost
        key={workout.id}
        workout={feedItem}
        currentUserId={me.id}
        liked={like.likedByMe}
        likeCount={like.count}
        onToggleLike={() => toggleLike(workout.id)}
        onLikeIfNeeded={() => likeIfNeeded(workout.id)}
        resolveLikers={resolveLikers}
        showMoveDate={Boolean(showMoveDate)}
        disableProfileNavigation
      />
    );
  }

  const tagline = (friend.tagline || friend.bio)?.trim() || "";
  const crewStat =
    friend.followingCount ??
    Math.max(0, Math.floor((friend.followersCount ?? 0) / 4));

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        paddingBottom: 96,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 428,
          margin: "0 auto",
          padding: "0 16px",
          boxSizing: "border-box",
        }}
      >
        <header style={{ ...PROFILE_STICKY_TOP_BAR, justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            style={PROFILE_GLASS_CIRCLE_STYLE}
            className="app-glass-icon-btn active:scale-95"
          >
            <Image
              src="/icons/nav/arrow-left.svg"
              alt=""
              width={20}
              height={20}
              aria-hidden
              className="nav-btn-icon"
            />
          </button>

          <ProfileFollowButton
            following={isFollowing}
            onToggle={() => (isFollowing ? unfollow(friend.id) : follow(friend.id))}
          />
        </header>

        <div style={{ marginTop: 36, marginBottom: 36 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: AVATAR_RADIUS,
                overflow: "hidden",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--foreground-subtle)",
              }}
            >
              <UserAvatar avatarUrl={friend.avatarUrl} name={friend.name} fillParent expandable />
            </div>
            <ProfileStatStrip
              followingCount={crewStat}
              fansCount={friend.followersCount ?? 0}
              moves={workouts.length}
              onFollowingPress={openFollowingSheet}
              onFansPress={openFansSheet}
            />
          </div>

          <h1
            style={{
              ...PROFILE_NAME_TAGLINE_TEXT,
              color: "var(--foreground)",
              margin: 0,
            }}
          >
            {friend.name}
          </h1>

          {tagline && (
            <p
              style={{
                ...PROFILE_NAME_TAGLINE_TEXT,
                color: "var(--accent)",
                margin: "2px 0 0",
              }}
            >
              {tagline}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 48 }}>
          <ProfileSegmentedControl value={section} onChange={setSection} />
        </div>

        <div
          key={section}
          className="animate-fade-in-up"
          style={{
            animationDuration: "0.3s",
            animationTimingFunction: "var(--ease-out-expo)",
          }}
        >
          {section === "about" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <p
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 32,
                  fontWeight: 400,
                  lineHeight: "32px",
                  letterSpacing: "-1.28px",
                  color: "var(--foreground)",
                  margin: 0,
                }}
              >
                <ProfileStatNumber variant={0}>{workouts.length}</ProfileStatNumber> total moves.{" "}
                <ProfileStatNumber variant={1}>{stats.thisMonth}</ProfileStatNumber> this month.{" "}
                <ProfileStatNumber variant={2}>{stats.thisWeek}</ProfileStatNumber> this week.
              </p>

              <div
                style={{
                  backgroundColor: "var(--surface)",
                  borderRadius: 32,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <ProfileCalendar
                  workouts={workouts}
                  readOnly
                  selectedDateKey={sheetOpen ? sheetDateKey : null}
                  onSelectDate={openSheet}
                />
              </div>

              <ProfileAboutSection
                prompts={friend.prompts}
                promptLikeIds={promptLikeIds}
                getLike={getLike}
                toggleLike={toggleLike}
                likeIfNeeded={likeIfNeeded}
                resolveLikers={resolveLikers}
                currentUserId={me.id}
              />
            </div>
          )}

          {section === "moves" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {movesByMonth.length === 0 ? (
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
                  No moves yet.
                </p>
              ) : (
                movesByMonth.map(({ key, label, workouts: monthWorkouts }) => (
                  <section key={key}>
                    <h2
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--foreground-subtle)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        margin: "0 0 10px",
                      }}
                    >
                      {label}
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {monthWorkouts.map((w) => renderFriendFeedPost(w, true))}
                    </div>
                  </section>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {sheetDateKey !== null && (
        <ProfileDayMovesSheet
          open={sheetOpen}
          dateKey={sheetDateKey}
          onClose={closeSheet}
          moveCount={sheetWorkouts.length}
        >
          {sheetWorkouts.map((w) => renderFriendFeedPost(w))}
        </ProfileDayMovesSheet>
      )}

      {socialSheet && (
        <LikersSheet
          title={socialSheet.title}
          people={socialSheet.people}
          onClose={() => setSocialSheet(null)}
          onSelectProfile={onSelectSocialProfile}
        />
      )}
    </main>
  );
}
