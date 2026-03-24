"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { loadLikersForEntity } from "@/lib/load-likers";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useWorkouts } from "@/hooks/use-workouts";
import { useLikes } from "@/hooks/use-likes";
import { useFriends } from "@/hooks/use-friends";
import { ProfileCalendar } from "@/components/ProfileCalendar";
import { ProfileSegmentedControl, type ProfileSection } from "@/components/ProfileSegmentedControl";
import { FeedPost } from "@/components/FeedPost";
import { ProfileStatNumber } from "@/components/ProfileStatNumber";
import { ProfileAboutSection } from "@/components/ProfileAboutSection";
import { ProfileStatStrip } from "@/components/ProfileStatStrip";
import { LikersSheet } from "@/components/LikersSheet";
import { ProfileDayMovesSheet } from "@/components/ProfileDayMovesSheet";
import { useLogSheet } from "@/contexts/log-sheet";
import {
  buildProfileFansPeople,
  buildProfileFollowingPeople,
} from "@/lib/profile-social-lists";
import type { FeedItem } from "@/hooks/use-friends";
import type { LikePerson } from "@/types/likes";
import { UserAvatar } from "@/components/UserAvatar";
import { useTheme } from "@/hooks/use-theme";

/** Sticky top bar — stays pinned while profile content scrolls */
const PROFILE_STICKY_TOP_BAR: CSSProperties = {
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

/** 54px — matches `NAV_HEIGHT` in `app/athletes/page.tsx` */
const PROFILE_GLASS_CIRCLE_STYLE: CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: "100px",
  backdropFilter: "blur(24px) saturate(1.8)",
  WebkitBackdropFilter: "blur(24px) saturate(1.8)",
  background: "var(--glass-btn-bg)",
  border: "1px solid var(--glass-btn-border)",
  boxShadow: "var(--glass-btn-shadow)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
  WebkitTapHighlightColor: "transparent",
  padding: 0,
};

const AVATAR_RADIUS = 32.789;

const PROFILE_NAME_TAGLINE_TEXT: CSSProperties = {
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: 32,
  fontWeight: 400,
  lineHeight: "32px",
  letterSpacing: "-0.04em",
};

function ProfileSkeleton() {
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

export default function ProfilePage() {
  const router = useRouter();
  const { user, hydrated: uh, updateUser } = useUser();
  const { workouts, stats, hydrated: wh, deleteWorkout } = useWorkouts();
  const { friends } = useFriends();
  const { openForEdit } = useLogSheet();
  const { theme, toggle: toggleTheme } = useTheme();
  const [exitingTheme, setExitingTheme] = useState<"light" | "dark" | null>(null);
  const themeExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleToggleTheme = useCallback(() => {
    setExitingTheme(theme);
    if (themeExitTimerRef.current) clearTimeout(themeExitTimerRef.current);
    themeExitTimerRef.current = setTimeout(() => setExitingTheme(null), 200);
    toggleTheme();
  }, [theme, toggleTheme]);
  const [section, setSection] = useState<ProfileSection>("about");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDateKey, setSheetDateKey] = useState<string | null>(null);
  const [socialSheet, setSocialSheet] = useState<{
    title: string;
    people: LikePerson[];
  } | null>(null);

  const workoutIds = useMemo(() => workouts.map((w) => w.id), [workouts]);
  const promptLikeIds = useMemo(
    () => (user.prompts ?? []).map((_, i) => `profile-prompt:${user.id}:${i}`),
    [user.id, user.prompts],
  );
  const likeEntityIds = useMemo(
    () => [...workoutIds, ...promptLikeIds],
    [workoutIds, promptLikeIds],
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
  const { getLike, toggleLike, likeIfNeeded } = useLikes(likeEntityIds, likeViewer);

  const openFollowingSheet = useCallback(() => {
    setSocialSheet({
      title: "Following",
      people: buildProfileFollowingPeople(user.id, friends, 0, true, followingIds),
    });
  }, [user.id, friends, followingIds]);

  const openFansSheet = useCallback(() => {
    setSocialSheet({
      title: "Fans",
      people: buildProfileFansPeople(user.id, friends, user.followersCount ?? 0, followingIds),
    });
  }, [user.id, friends, user.followersCount, followingIds]);

  const onSelectSocialProfile = useCallback(
    (userId: string) => {
      setSocialSheet(null);
      if (userId === user.id) router.push("/profile");
      else router.push(`/profile/${userId}`);
    },
    [router, user.id],
  );

  useEffect(() => {
    if (uh) setNameInput(user.name || "");
  }, [uh, user.name]);

  useEffect(() => {
    if (!socialSheet) return;
    document.body.classList.add("search-open");
    return () => document.body.classList.remove("search-open");
  }, [socialSheet]);

  useEffect(() => {
    return () => {
      if (themeExitTimerRef.current) clearTimeout(themeExitTimerRef.current);
    };
  }, []);

  const handleNameBlur = () => {
    if (nameInput.trim()) updateUser({ name: nameInput.trim() });
    setEditingName(false);
  };

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

  if (!uh || !wh) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: 96 }}>
        <div style={{ padding: "max(env(safe-area-inset-top), 20px) 16px 0" }}>
          <div style={{ height: 44, marginBottom: 20 }} />
        </div>
        <div style={{ maxWidth: 428, margin: "0 auto" }}>
          <ProfileSkeleton />
        </div>
      </main>
    );
  }

  const displayName = user.name || "Athlete";
  const tagline = (user.tagline || user.bio)?.trim() || "";
  const followingCount = friends.filter((f) => f.following).length;
  const followersCount = user.followersCount ?? 0;

  function renderFeedPost(workout: typeof workouts[number]) {
    const feedItem: FeedItem = {
      ...workout,
      userId: user.id,
      userName: displayName,
      userHandle: user.handle,
      userAvatarUrl: user.avatarUrl,
    };
    const like = getLike(workout.id);
    return (
      <FeedPost
        key={workout.id}
        workout={feedItem}
        currentUserId={user.id}
        liked={like.likedByMe}
        likeCount={like.count}
        onToggleLike={() => toggleLike(workout.id)}
        onLikeIfNeeded={() => likeIfNeeded(workout.id)}
        resolveLikers={resolveLikers}
      />
    );
  }

  function renderCalendarSheetFeedPost(workout: typeof workouts[number]) {
    const feedItem: FeedItem = {
      ...workout,
      userId: user.id,
      userName: displayName,
      userHandle: user.handle,
      userAvatarUrl: user.avatarUrl,
    };
    const like = getLike(workout.id);
    return (
      <FeedPost
        key={workout.id}
        workout={feedItem}
        currentUserId={user.id}
        liked={like.likedByMe}
        likeCount={like.count}
        onToggleLike={() => toggleLike(workout.id)}
        onLikeIfNeeded={() => likeIfNeeded(workout.id)}
        resolveLikers={resolveLikers}
        postActions={{
          onEdit: () => {
            openForEdit(workout);
            closeSheet();
          },
          onDelete: () => {
            if (typeof window !== "undefined" && !window.confirm("Remove this log?")) return;
            const othersSameDay = workouts.filter(
              (w) => w.date === sheetDateKey && w.id !== workout.id,
            );
            deleteWorkout(workout.id);
            if (othersSameDay.length === 0) closeSheet();
          },
        }}
      />
    );
  }

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
        <header style={{ ...PROFILE_STICKY_TOP_BAR, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="theme-toggle-btn active:scale-95"
            style={{ ...PROFILE_GLASS_CIRCLE_STYLE, overflow: "hidden" }}
          >
            {exitingTheme && (
              <Image
                key={`exit-${exitingTheme}`}
                src={`/icons/dark-light-mode/${exitingTheme === "dark" ? "sun" : "moon"}.svg`}
                alt=""
                width={22}
                height={22}
                aria-hidden
                className={`activity-icon-auto theme-icon-exit`}
              />
            )}
            <Image
              key={`enter-${theme}`}
              src={`/icons/dark-light-mode/${theme === "dark" ? "sun" : "moon"}.svg`}
              alt=""
              width={22}
              height={22}
              aria-hidden
              className={`activity-icon-auto theme-icon-enter`}
            />
          </button>
          <button
            type="button"
            onClick={() => router.push("/settings")}
            aria-label="Settings"
            style={PROFILE_GLASS_CIRCLE_STYLE}
            className="active:scale-95"
          >
            <Image
              src="/icons/nav/dots.svg"
              alt=""
              width={20}
              height={20}
              aria-hidden
              className="nav-btn-icon"
            />
          </button>
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
              <UserAvatar avatarUrl={user.avatarUrl} name={displayName} fillParent />
            </div>
            <ProfileStatStrip
              followingCount={followingCount}
              fansCount={followersCount}
              moves={workouts.length}
              onFollowingPress={openFollowingSheet}
              onFansPress={openFansSheet}
            />
          </div>

          {editingName ? (
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  setNameInput(displayName);
                  setEditingName(false);
                }
              }}
              autoFocus
              style={{
                ...PROFILE_NAME_TAGLINE_TEXT,
                color: "var(--foreground)",
                border: "none",
                borderBottom: "2px solid var(--accent)",
                background: "transparent",
                outline: "none",
                padding: "2px 0",
                width: "100%",
                marginBottom: 0,
                display: "block",
              }}
            />
          ) : (
            <h1
              onClick={() => {
                setEditingName(true);
                setNameInput(displayName);
              }}
              style={{
                ...PROFILE_NAME_TAGLINE_TEXT,
                color: "var(--foreground)",
                margin: "0 0 0",
                cursor: "text",
              }}
            >
              {displayName}
            </h1>
          )}

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

        <div style={{ marginBottom: section === "about" ? 36 : 48 }}>
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
            <ProfileAboutSection
              prompts={user.prompts}
              promptLikeIds={promptLikeIds}
              getLike={getLike}
              toggleLike={toggleLike}
              likeIfNeeded={likeIfNeeded}
              resolveLikers={resolveLikers}
              currentUserId={user.id}
            />
          )}

          {section === "moves" && (
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
                }}
              >
                <ProfileCalendar
                  workouts={workouts}
                  selectedDateKey={sheetOpen ? sheetDateKey : null}
                  onSelectDate={openSheet}
                />
              </div>

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
                  No moves yet. Log a move to see it here.
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
                      {monthWorkouts.map(renderFeedPost)}
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
          {sheetWorkouts.map(renderCalendarSheetFeedPost)}
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
