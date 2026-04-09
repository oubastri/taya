"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ActivityIcon } from "@/components/ActivityIcon";
import { LandingSlotStrip } from "@/components/landing/LandingSlotStrip";
import type { ActivityType } from "@/types/workout";
import type { LandingHeroStripProfile } from "@/lib/landing-profiles";
import {
  ACTIVITY_FEED_HIGHLIGHT,
  ACTIVITY_FEED_PHRASE,
  ACTIVITY_TYPES,
} from "@/types/workout";

export type { LandingHeroStripProfile };

/** Landing demo only — skip generic “other / something” (no icon, not a showcase activity) */
const LANDING_ACTIVITY_TYPES = ACTIVITY_TYPES.filter((t) => t !== "other");

const sans = 'var(--font-sans), system-ui, sans-serif';

const PROFILE_ROTATE_MS = 2800;
const ACTIVITY_ROTATE_MS = 3200;

/** Tighter on narrow viewports so profile + activity stay side-by-side; min bumped for mobile legibility */
const HERO_FONT_SIZE = "clamp(17px, 4.1vw, 70px)";
const AVATAR_PX = "clamp(42px, 9.2vw, 108px)";
const SLOT_MIN_H = "clamp(46px, 10.2vw, 112px)";
const ICON_BOX_PX = "clamp(42px, 9.2vw, 108px)";
const HERO_INNER_GAP = "clamp(7px, 1.55vw, 18px)";
const HERO_COLUMN_GAP = "clamp(10px, 2.8vw, 40px)";
const HERO_DEMO_TILE_RADIUS = "32%";

/** Horizontal padding aligned with landing header */
const PAGE_PAD_X = "max(20px, env(safe-area-inset-left))";
const PAGE_PAD_RIGHT = "max(20px, env(safe-area-inset-right))";

const STRIP_FALLBACK: LandingHeroStripProfile[] = [
  { avatarUrl: null, handle: "taya", name: "TAYA" },
];

function activityConnectorHighlight(type: ActivityType): {
  connector: string;
  highlight: string;
} {
  const phrase = ACTIVITY_FEED_PHRASE[type];
  const h = ACTIVITY_FEED_HIGHLIGHT[type];
  if (phrase.endsWith(h)) {
    return {
      connector: phrase.slice(0, phrase.length - h.length).trimEnd(),
      highlight: h,
    };
  }
  const i = phrase.lastIndexOf(h);
  if (i >= 0) {
    return {
      connector: phrase.slice(0, i).trimEnd(),
      highlight: phrase.slice(i).trim(),
    };
  }
  return { connector: phrase, highlight: h };
}

function shuffleOrder<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** ~50–58% of demo tile — keeps glyph smaller than the green box on phones */
function useIconSizeForLanding() {
  const [iconSize, setIconSize] = useState(48);
  useLayoutEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      if (w < 400) setIconSize(22);
      else if (w < 480) setIconSize(26);
      else if (w < 640) setIconSize(34);
      else if (w < 720) setIconSize(38);
      else if (w < 1100) setIconSize(48);
      else setIconSize(56);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);
  return iconSize;
}

type LandingFigmaHeroProps = {
  /** Real TAYA users for the left strip; cycles avatar + @handle */
  stripProfiles: LandingHeroStripProfile[];
};

export function LandingFigmaHero({ stripProfiles }: LandingFigmaHeroProps) {
  const iconSize = useIconSizeForLanding();

  const stripRows = useMemo(
    () => (stripProfiles.length > 0 ? stripProfiles : STRIP_FALLBACK),
    [stripProfiles],
  );

  const activityOrder = useMemo(
    () => shuffleOrder([...LANDING_ACTIVITY_TYPES], 42),
    [],
  );

  const [pi, setPi] = useState(0);
  const [ai, setAi] = useState(0);

  useEffect(() => {
    const n = stripRows.length;
    const t = window.setInterval(() => {
      setPi((p) => (p + 1) % n);
    }, PROFILE_ROTATE_MS);
    return () => clearInterval(t);
  }, [stripRows.length]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setAi((a) => (a + 1) % activityOrder.length);
    }, ACTIVITY_ROTATE_MS);
    return () => clearInterval(t);
  }, [activityOrder.length]);

  const profile = stripRows[Math.min(pi, stripRows.length - 1)]!;
  const handleLabel = `@${profile.handle}`;
  const activityType = activityOrder[ai];
  const { connector, highlight } = activityConnectorHighlight(activityType);

  const typeStyle: CSSProperties = {
    fontFamily: sans,
    fontSize: HERO_FONT_SIZE,
    fontWeight: 500,
    letterSpacing: "-0.04em",
    color: "var(--foreground)",
    lineHeight: 1.25,
  };

  const profileInitial = (profile.name || profile.handle).charAt(0).toUpperCase();

  const profileBlock = (
    <LandingSlotStrip
      anchor="left"
      slotKey={handleLabel}
      minHeight={SLOT_MIN_H}
      style={{ width: "100%", minWidth: 0 }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: HERO_INNER_GAP,
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: AVATAR_PX,
            height: AVATAR_PX,
            borderRadius: HERO_DEMO_TILE_RADIUS,
            overflow: "hidden",
            flexShrink: 0,
            background: "var(--avatar-placeholder-bg)",
          }}
        >
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt=""
              width={220}
              height={220}
              sizes="(max-width: 768px) 120px, 220px"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: sans,
                fontSize: "clamp(18px, 5vw, 52px)",
                fontWeight: 600,
                color: "var(--foreground-muted)",
              }}
            >
              {profileInitial}
            </span>
          )}
        </div>
        <span
          style={{
            ...typeStyle,
            whiteSpace: "nowrap",
            flexShrink: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {handleLabel}
        </span>
      </div>
    </LandingSlotStrip>
  );

  const activityBlock = (
    <LandingSlotStrip
      anchor="right"
      slotKey={activityType}
      minHeight={SLOT_MIN_H}
      style={{ width: "100%" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: HERO_INNER_GAP,
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            ...typeStyle,
            whiteSpace: "nowrap",
            flexShrink: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "right",
          }}
        >
          {connector && (
            <span style={{ color: "var(--foreground)" }}>{connector} </span>
          )}
          <span style={{ color: "var(--accent)" }}>{highlight}</span>
        </span>
        <div
          style={{
            width: ICON_BOX_PX,
            height: ICON_BOX_PX,
            borderRadius: HERO_DEMO_TILE_RADIUS,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ActivityIcon type={activityType} size={iconSize} monochromeBlack />
        </div>
      </div>
    </LandingSlotStrip>
  );

  return (
    <section
      aria-label="Example activity"
      style={{
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        paddingLeft: PAGE_PAD_X,
        paddingRight: PAGE_PAD_RIGHT,
        minHeight: SLOT_MIN_H,
        display: "grid",
        /* Fixed tracks only (no content-sized column) — profile handle ellipsis inside cell */
        gridTemplateColumns: "minmax(0, 0.88fr) minmax(0, 1.12fr)",
        alignItems: "center",
        columnGap: HERO_COLUMN_GAP,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {profileBlock}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {activityBlock}
      </div>
    </section>
  );
}
