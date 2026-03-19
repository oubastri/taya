"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { FeedItem } from "@/hooks/use-friends";
import { UserAvatar } from "@/components/UserAvatar";
import { shareUrl } from "@/lib/share";

const NAV_BTN_SIZE = 54;
const NAV_BTN_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: NAV_BTN_SIZE,
  height: NAV_BTN_SIZE,
  borderRadius: "100px",
  backdropFilter: "blur(24px) saturate(1.8)",
  WebkitBackdropFilter: "blur(24px) saturate(1.8)",
  background: "var(--glass-btn-bg)",
  border: "1px solid var(--glass-btn-border)",
  boxShadow: "var(--glass-btn-shadow)",
  cursor: "pointer",
  flexShrink: 0,
  WebkitTapHighlightColor: "transparent",
  padding: 0,
};

function ProfileSkeleton() {
  return (
    <div style={{ padding: "0 16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        <div className="skeleton" style={{ width: 84, height: 84, borderRadius: 28 }} />
        <div className="skeleton" style={{ width: 160, height: 28, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 100, height: 14, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: 200, height: 14, borderRadius: 4 }} />
      </div>
      <div className="skeleton" style={{ height: 48, borderRadius: 9999, marginBottom: 20 }} />
      <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, hydrated: uh, updateUser } = useUser();
  const { workouts, stats, hydrated: wh } = useWorkouts();
  const { friends } = useFriends();
  const [section, setSection] = useState<ProfileSection>("about");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");

  const workoutIds = useMemo(() => workouts.map((w) => w.id), [workouts]);
  const { getLike, toggleLike } = useLikes(workoutIds);

  useEffect(() => {
    if (uh) {
      setNameInput(user.name || "");
      setBioInput(user.bio ?? "");
    }
  }, [uh, user.name, user.bio]);

  const handleNameBlur = () => {
    if (nameInput.trim()) updateUser({ name: nameInput.trim() });
    setEditingName(false);
  };

  const handleBioBlur = () => {
    updateUser({ bio: bioInput.trim() || undefined });
    setEditingBio(false);
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

  const handleShareProfile = useCallback(async () => {
    const name = user.name || "Breezy De Vrij";
    await shareUrl("/profile/me", {
      title: "TAYA",
      text: `Check out my profile on TAYA — ${name}`,
    });
  }, [user.name]);

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
  const handle = user.handle || "you";
  const followingCount = friends.filter((f) => f.following).length;
  const followersCount = user.followersCount ?? 0;

  function renderFeedPost(workout: typeof workouts[number]) {
    const feedItem: FeedItem = {
      ...workout,
      userId: user.id,
      userName: displayName,
      userHandle: handle,
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
      {/* Settings + Share — fixed top-right */}
      <div
        style={{
          position: "fixed",
          top: "max(env(safe-area-inset-top), 20px)",
          right: 16,
          zIndex: 50,
          display: "flex",
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/settings")}
          aria-label="Settings"
          style={NAV_BTN_STYLE}
          className="active:scale-95"
        >
          <Image
            src="/icons/nav/settings.svg"
            alt=""
            width={20}
            height={20}
            aria-hidden
            className="nav-btn-icon"
          />
        </button>
        <button
          type="button"
          onClick={handleShareProfile}
          aria-label="Share profile"
          style={NAV_BTN_STYLE}
          className="active:scale-95"
        >
          <Image
            src="/icons/nav/share.svg"
            alt=""
            width={20}
            height={20}
            aria-hidden
            className="nav-btn-icon"
          />
        </button>
      </div>

      {/* Spacer to push content below fixed buttons */}
      <div style={{ height: "calc(max(env(safe-area-inset-top), 20px) + 54px + 20px)" }} />

      {/* Content */}
      <div
        style={{
          width: "100%",
          maxWidth: 428,
          margin: "0 auto",
          padding: "0 16px",
          boxSizing: "border-box",
        }}
      >
        {/* Identity block */}
        <div style={{ marginBottom: 40 }}>
          {/* Avatar */}
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 28,
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--foreground-subtle)",
              marginBottom: 16,
            }}
          >
            <UserAvatar avatarUrl={user.avatarUrl} name={displayName} fillParent />
          </div>

          {/* Name */}
          {editingName ? (
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") { setNameInput(displayName); setEditingName(false); }
              }}
              autoFocus
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 32,
                fontWeight: 500,
                letterSpacing: "-1.2px",
                color: "var(--foreground)",
                border: "none",
                borderBottom: "2px solid var(--accent)",
                background: "transparent",
                outline: "none",
                padding: "2px 0",
                width: "100%",
                marginBottom: 4,
                display: "block",
                lineHeight: 1,
              }}
            />
          ) : (
            <h1
              onClick={() => { setEditingName(true); setNameInput(displayName); }}
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 32,
                fontWeight: 500,
                letterSpacing: "-1.2px",
                color: "var(--foreground)",
                margin: "0 0 4px",
                cursor: "text",
                lineHeight: 1,
              }}
            >
              {displayName}
            </h1>
          )}

          {/* Handle + location */}
          <p
            style={{
              margin: "0 0 2px",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "-0.2px",
              color: "var(--foreground-subtle)",
            }}
          >
            @{handle}{user.location ? ` · ${user.location}` : ""}
          </p>

          {/* Followers / following */}
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "-0.2px",
              color: "var(--foreground-subtle)",
            }}
          >
            {followersCount} followers · {followingCount} following
          </p>
        </div>

        {/* Segmented control */}
        <div style={{ marginBottom: 48 }}>
          <ProfileSegmentedControl value={section} onChange={setSection} />
        </div>

        {/* Section content */}
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
              tagline={user.tagline}
              prompts={user.prompts}
            />
          )}

          {section === "moves" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Stats sentence */}
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

              {/* Calendar */}
              <div
                style={{
                  backgroundColor: "var(--surface)",
                  borderRadius: 32,
                  padding: "20px 18px",
                }}
              >
                <ProfileCalendar workouts={workouts} />
              </div>

              {/* Posts */}
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
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {monthWorkouts.map(renderFeedPost)}
                    </div>
                  </section>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
