"use client";

import { useEffect, useState } from "react";
import { loadUser } from "@/lib/storage";
import FeedHome from "@/components/FeedHome";
import HomeLanding from "@/components/HomeLanding";

/**
 * Mock mode has no server session. Route `/` between marketing landing and feed
 * using the same persisted user key as the rest of the mock adapter.
 */
export default function MockHomeEntry() {
  const [hasUser, setHasUser] = useState<boolean | null>(null);

  useEffect(() => {
    setHasUser(loadUser() !== null);
  }, []);

  if (hasUser === null) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "var(--surface)",
        }}
        aria-hidden
      />
    );
  }

  return hasUser ? <FeedHome /> : <HomeLanding serverLandingProfiles={null} />;
}
