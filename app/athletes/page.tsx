"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFriends } from "@/hooks/use-friends";
import { useUser } from "@/hooks/use-user";
import AthletesGlobeView from "@/components/athletes/AthletesGlobeView";

function AthletesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openSearchFromQuery = searchParams.get("sheet") === "search";

  useEffect(() => {
    if (!openSearchFromQuery) return;
    router.replace("/athletes", { scroll: false });
  }, [openSearchFromQuery, router]);

  const { friends, hydrated } = useFriends();
  const { user } = useUser();

  const allUsers = useMemo(
    () => [
      {
        id: user.id,
        name: user.name,
        handle: user.handle,
        avatarUrl: user.avatarUrl,
        isYou: true as const,
      },
      ...friends.map((f) => ({
        id: f.id,
        name: f.name,
        handle: f.handle,
        avatarUrl: f.avatarUrl,
        isYou: false as const,
      })),
    ],
    [user.id, user.name, user.handle, user.avatarUrl, friends],
  );

  return (
    <AthletesGlobeView
      mode="app"
      users={allUsers}
      hydrated={hydrated}
      friendsForSearch={friends}
      openSearchOnMount={openSearchFromQuery}
      onNavigateToProfile={(id) => router.push(`/profile/${id}`)}
    />
  );
}

function AthletesFallback() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--background)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--foreground-muted)",
        fontSize: 14,
      }}
    >
      Loading…
    </div>
  );
}

export default function FriendsPage() {
  return (
    <Suspense fallback={<AthletesFallback />}>
      <AthletesPageInner />
    </Suspense>
  );
}
