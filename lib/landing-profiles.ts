import type { SupabaseClient } from "@supabase/supabase-js";

export type LandingProfilePublic = {
  id: string;
  handle: string;
  avatar_url: string | null;
  name: string;
};

/** Avatar + handle row for the landing hero left strip */
export type LandingHeroStripProfile = {
  avatarUrl: string | null;
  handle: string;
  name: string;
};

const DEFAULT_LIMIT = 400;

export async function fetchLandingProfiles(
  supabase: SupabaseClient,
  limit: number = DEFAULT_LIMIT,
): Promise<LandingProfilePublic[]> {
  const { data, error } = await supabase.rpc("get_landing_profiles", {
    limit_count: limit,
  });
  if (error) {
    console.warn("[fetchLandingProfiles]", error.message);
    return [];
  }
  return (data ?? []) as LandingProfilePublic[];
}

export function landingProfilesToGlobeUsers(profiles: LandingProfilePublic[]) {
  return profiles.map((p) => ({
    id: p.id,
    name: (p.name && p.name.trim()) || p.handle,
    handle: p.handle,
    avatarUrl: p.avatar_url?.trim() ? p.avatar_url : undefined,
    isYou: false as const,
  }));
}

export function landingProfilesToHeroStrip(
  profiles: LandingProfilePublic[],
): LandingHeroStripProfile[] {
  return profiles.map((p) => ({
    avatarUrl: p.avatar_url?.trim() ? p.avatar_url : null,
    handle: p.handle,
    name: (p.name && p.name.trim()) || p.handle,
  }));
}
