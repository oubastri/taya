"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { ActivityIcon } from "@/components/ActivityIcon";
import { LandingSlotStrip } from "@/components/landing/LandingSlotStrip";
import type { ActivityType } from "@/types/workout";
import {
  ACTIVITY_FEED_HIGHLIGHT,
  ACTIVITY_FEED_PHRASE,
  ACTIVITY_TYPES,
} from "@/types/workout";

/** Landing demo only — skip generic “other / something” (no icon, not a showcase activity) */
const LANDING_ACTIVITY_TYPES = ACTIVITY_TYPES.filter((t) => t !== "other");

const sans = 'var(--font-sans), system-ui, sans-serif';

const PROFILE_ROTATE_MS = 2800;
const ACTIVITY_ROTATE_MS = 3200;

const HERO_FONT_SIZE = "clamp(22px, 4.2vw, 70px)";
const AVATAR_PX = "clamp(44px, 9vw, 108px)";
const SLOT_MIN_H = "clamp(48px, 10vw, 112px)";
const ICON_BOX_PX = "clamp(44px, 9vw, 108px)";

/** Horizontal padding aligned with landing header */
const PAGE_PAD_X = "max(20px, env(safe-area-inset-left))";
const PAGE_PAD_RIGHT = "max(20px, env(safe-area-inset-right))";

/** Shared with landing globe / demos — profile strip + spatial view */
export const LANDING_DEMO_PROFILE_ROWS: { src: string; handle: string }[] = [
  { src: "/profilephotos/user1.png", handle: "@paulito" },
  { src: "/profilephotos/user2.png", handle: "@mara_runs" },
  { src: "/profilephotos/user3.png", handle: "@jas_lift" },
  { src: "/profilephotos/user4.png", handle: "@zoetrails" },
  { src: "/profilephotos/user5.png", handle: "@swimdean" },
  { src: "/profilephotos/user6.jpg", handle: "@court_volley" },
  { src: "/profilephotos/user7.jpg", handle: "@nicospin" },
  { src: "/profilephotos/user8.jpg", handle: "@alex_box" },
  { src: "/profilephotos/user9.jpg", handle: "@gracie_golf" },
  { src: "/profilephotos/user10.jpg", handle: "@luis_surf" },
  { src: "/profilephotos/user11.jpg", handle: "@han_hiit" },
  { src: "/profilephotos/user12.jpg", handle: "@rowan_row" },
  { src: "/profilephotos/user13.jpg", handle: "@skikiwi" },
  { src: "/profilephotos/user14.jpg", handle: "@mia_dance" },
  { src: "/profilephotos/user15.jpg", handle: "@zenyuki" },
  { src: "/profilephotos/user16.jpg", handle: "@carter_cf" },
  { src: "/profilephotos/user17.jpg", handle: "@pete_pickle" },
  { src: "/profilephotos/user18.jpg", handle: "@tess_tennis" },
  { src: "/profilephotos/user19.jpg", handle: "@liv_hike" },
  { src: "/profilephotos/user20.jpg", handle: "@mo_mobility" },
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

function useIconSizeForLanding() {
  const [iconSize, setIconSize] = useState(52);
  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      if (w < 480) setIconSize(30);
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

/** Below this width, stack profile / activity vertically (readable on phones & narrow tablets). */
const STACK_BREAKPOINT_PX = 760;

function useStackedHero() {
  const [stacked, setStacked] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${STACK_BREAKPOINT_PX}px)`);
    const on = () => setStacked(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return stacked;
}

export function LandingFigmaHero() {
  const iconSize = useIconSizeForLanding();
  const stacked = useStackedHero();

  const activityOrder = useMemo(
    () => shuffleOrder([...LANDING_ACTIVITY_TYPES], 42),
    [],
  );

  const [pi, setPi] = useState(0);
  const [ai, setAi] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setPi((p) => (p + 1) % LANDING_DEMO_PROFILE_ROWS.length);
    }, PROFILE_ROTATE_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => {
      setAi((a) => (a + 1) % activityOrder.length);
    }, ACTIVITY_ROTATE_MS);
    return () => clearInterval(t);
  }, [activityOrder.length]);

  const profile = LANDING_DEMO_PROFILE_ROWS[pi];
  const activityType = activityOrder[ai];
  const { connector, highlight } = activityConnectorHighlight(activityType);

  const typeStyle: CSSProperties = {
    fontFamily: sans,
    fontSize: HERO_FONT_SIZE,
    fontWeight: 500,
    letterSpacing: "-0.04em",
    color: "var(--foreground)",
    lineHeight: 1.05,
  };

  const profileBlock = (
    <LandingSlotStrip
      anchor="left"
      slotKey={profile.handle}
      minHeight={SLOT_MIN_H}
      style={{ width: "100%" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(10px, 1.6vw, 18px)",
        }}
      >
        <div
          style={{
            width: AVATAR_PX,
            height: AVATAR_PX,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            background: "var(--avatar-placeholder-bg)",
          }}
        >
          <Image
            src={profile.src}
            alt=""
            width={220}
            height={220}
            sizes="(max-width: 768px) 96px, 220px"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
        <span style={{ ...typeStyle, whiteSpace: "nowrap" }}>
          {profile.handle}
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
          alignItems: "center",
          gap: "clamp(10px, 1.6vw, 18px)",
          flexWrap: "wrap",
        }}
      >
        <span style={{ ...typeStyle }}>
          {connector && (
            <span style={{ color: "var(--foreground)" }}>{connector} </span>
          )}
          <span style={{ color: "var(--accent)" }}>{highlight}</span>
        </span>
        <div
          style={{
            width: ICON_BOX_PX,
            height: ICON_BOX_PX,
            borderRadius: "32%",
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

  if (stacked) {
    return (
      <section
        aria-label="Example activity"
        style={{
          width: "100%",
          paddingLeft: PAGE_PAD_X,
          paddingRight: PAGE_PAD_RIGHT,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: "clamp(8px, 3vw, 16px)",
        }}
      >
        <div style={{ alignSelf: "flex-start", width: "100%" }}>
          {profileBlock}
        </div>
        <div style={{ alignSelf: "flex-end", width: "100%" }}>
          {activityBlock}
        </div>
      </section>
    );
  }

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
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        alignItems: "center",
        columnGap: "clamp(16px, 3vw, 40px)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          width: "100%",
          minWidth: 0,
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
        }}
      >
        {activityBlock}
      </div>
    </section>
  );
}
