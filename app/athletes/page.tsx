"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFriends } from "@/hooks/use-friends";
import { useUser } from "@/hooks/use-user";
import AthletesGlobeView from "@/components/athletes/AthletesGlobeView";

export default function FriendsPage() {
  const router = useRouter();
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
      onNavigateToProfile={(id) => router.push(`/profile/${id}`)}
    />
  );
}
