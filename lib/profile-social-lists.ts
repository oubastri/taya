import type { LikePerson } from "@/types/likes";
import type { FriendData } from "@/types/user";

export function friendToLikePerson(f: FriendData, followingIds: Set<string>): LikePerson {
  return {
    id: f.id,
    name: f.name,
    handle: f.handle,
    avatarUrl: f.avatarUrl,
    following: followingIds.has(f.id),
  };
}

function sortedOthers(profileUserId: string, friends: FriendData[]): FriendData[] {
  return friends.filter((f) => f.id !== profileUserId).sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Friends list is the discoverable graph; we only have explicit follows for the
 * current user. For other profiles, following/fans lists are capped slices for demo.
 */
export function buildProfileFollowingPeople(
  profileUserId: string,
  friends: FriendData[],
  followingCount: number,
  isOwnProfile: boolean,
  viewerFollowingIds: Set<string>,
): LikePerson[] {
  if (isOwnProfile) {
    return friends
      .filter((f) => f.following)
      .map((f) => friendToLikePerson(f, viewerFollowingIds));
  }
  const pool = sortedOthers(profileUserId, friends);
  const n = Math.min(Math.max(0, followingCount), pool.length);
  return pool.slice(0, n).map((f) => friendToLikePerson(f, viewerFollowingIds));
}

export function buildProfileFansPeople(
  profileUserId: string,
  friends: FriendData[],
  fansCount: number,
  viewerFollowingIds: Set<string>,
): LikePerson[] {
  const pool = sortedOthers(profileUserId, friends);
  if (pool.length === 0) return [];
  const rotated = [...pool.slice(1), pool[0]!];
  const n = Math.min(Math.max(0, fansCount), rotated.length);
  return rotated.slice(0, n).map((f) => friendToLikePerson(f, viewerFollowingIds));
}
