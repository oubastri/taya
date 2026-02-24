"use client";

import { useMemo } from "react";
import { useUser } from "@/hooks/use-user";
import { useWorkouts } from "@/hooks/use-workouts";
import { useFriends, type FeedItem } from "@/hooks/use-friends";
import { FeedPost } from "@/components/FeedPost";
import { toDateKey } from "@/types/workout";

function formatDateLabel(dateStr: string): string {
  const today = toDateKey(new Date());
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yesterday = toDateKey(yest);

  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";

  const date = new Date(dateStr + "T12:00:00");
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays < 7)
    return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const toMon = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - toMon);
  return d.toISOString().slice(0, 10);
}

function getOrdinalsForFeed(items: FeedItem[]): Map<string, { week: number; month: number }> {
  const map = new Map<string, { week: number; month: number }>();
  const byUser = new Map<string, FeedItem[]>();
  for (const item of items) {
    const list = byUser.get(item.userId) ?? [];
    list.push(item);
    byUser.set(item.userId, list);
  }
  for (const [, list] of byUser) {
    const sorted = [...list].sort(
      (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
    );
    for (const item of sorted) {
      const weekKey = getWeekKey(item.date);
      const monthKey = item.date.slice(0, 7);
      const weekItems = sorted.filter((i) => getWeekKey(i.date) === weekKey);
      const weekOrdinal =
        weekItems.filter(
          (i) =>
            i.date < item.date ||
            (i.date === item.date && i.createdAt <= item.createdAt)
        ).length;
      const monthItems = sorted.filter((i) => i.date.slice(0, 7) === monthKey);
      const monthOrdinal = monthItems.filter(
        (i) =>
          i.date < item.date ||
          (i.date === item.date && i.createdAt <= item.createdAt)
      ).length;
      map.set(`${item.userId}-${item.id}`, { week: weekOrdinal, month: monthOrdinal });
    }
  }
  return map;
}

function groupByDate(
  items: FeedItem[]
): Array<{ dateKey: string; label: string; items: FeedItem[] }> {
  const sorted = [...items].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  });

  const groups: Array<{ dateKey: string; label: string; items: FeedItem[] }> =
    [];
  for (const item of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.dateKey === item.date) {
      last.items.push(item);
    } else {
      groups.push({
        dateKey: item.date,
        label: formatDateLabel(item.date),
        items: [item],
      });
    }
  }
  return groups;
}

export default function FeedPage() {
  const { user, hydrated: uh } = useUser();
  const { workouts, hydrated: wh } = useWorkouts();
  const { getFeedWorkouts, hydrated: fh } = useFriends();

  const hydrated = uh && wh && fh;
  const feedItems = useMemo(
    () => (hydrated ? getFeedWorkouts(workouts, user.avatarUrl) : []),
    [hydrated, workouts, getFeedWorkouts, user.avatarUrl]
  );
  const groups = useMemo(() => groupByDate(feedItems), [feedItems]);
  const ordinals = useMemo(
    () => getOrdinalsForFeed(feedItems),
    [feedItems]
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        paddingBottom: 96,
      }}
    >
      {/* Header — "To All You" (black) + "Athletes" (green) */}
      <header
        style={{
          padding: "max(env(safe-area-inset-top), 52px) 20px 24px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: '"Lexend Deca", var(--font-sans), sans-serif',
            fontSize: 47,
            fontStyle: "normal",
            fontWeight: 500,
            lineHeight: "normal",
            letterSpacing: "-4.7px",
            color: "var(--foreground)",
            whiteSpace: "nowrap",
          }}
        >
          To All You{" "}
          <span style={{ color: "#11EB0E" }}>Athletes</span>
        </h1>
      </header>

      {/* Empty state */}
      {hydrated && groups.length === 0 && (
        <div
          style={{
            padding: "48px 24px 0",
            maxWidth: 320,
          }}
        >
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
            Start moving.
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
            Tap the + button to log your first workout. Your friends will see when you move.
          </p>
        </div>
      )}

      {/* Feed */}
      {groups.map((group, gi) => (
        <section
          key={group.dateKey}
          style={{ padding: "0 16px" }}
        >
          <div
            style={{
              padding: "20px 4px 12px",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--foreground-subtle)",
              }}
            >
              {group.label}
            </span>
            {group.items.length > 1 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--foreground-faint)",
                  letterSpacing: "0.02em",
                }}
              >
                {group.items.length} moves
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {group.items.map((item, ii) => (
              <div
                key={`${item.userId}-${item.id}`}
                style={{
                  animationDelay: `${(gi * 2 + ii) * 40}ms`,
                }}
                className="animate-fade-in-up"
              >
                <FeedPost
                  workout={item}
                  ordinals={ordinals.get(`${item.userId}-${item.id}`)}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
