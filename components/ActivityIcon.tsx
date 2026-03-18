"use client";

import type { ActivityType } from "@/types/workout";

/** Brand green used for activity icon backgrounds on moves cards */
export const BRAND_GREEN = "#01EF54";

// Per-activity palette — used by LogSheet activity picker, etc.
export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  run: "#FF5C35",
  walk: "#32D74B",
  cycle: "#0A84FF",
  swim: "#30B0C7",
  yoga: "#BF5AF2",
  lift: "#FF453A",
  hiit: "#FF9F0A",
  crossfit: "#E85D04",
  pilates: "#FF375F",
  basketball: "#FF6B00",
  tennis: "#ACE53A",
  soccer: "#30D158",
  climb: "#A2845E",
  surf: "#64D2FF",
  hike: "#34C759",
  boxing: "#E63946",
  dance: "#9B59B6",
  golf: "#2E7D32",
  martial_arts: "#5D4037",
  pickleball: "#43A047",
  rowing: "#1565C0",
  ski: "#42A5F5",
  spin: "#7E57C2",
  stretch: "#EC407A",
  volleyball: "#EF6C00",
  other: "#8E8E93",
};

/** Activity types that have an SVG in /public/icons/{type}.svg */
const ACTIVITY_WITH_ICON_FILE = new Set<ActivityType>([
  "run", "walk", "cycle", "swim", "yoga", "lift", "hiit", "crossfit", "pilates",
  "basketball", "tennis", "soccer", "climb", "surf", "hike",
  "boxing", "dance", "golf", "martial_arts", "pickleball", "rowing", "ski", "spin", "stretch", "volleyball",
]);

interface ActivityIconProps {
  type: ActivityType;
  size?: number;
  /** When true, wraps the icon in a colored rounded-square badge */
  badge?: boolean;
  /** When true, render icon as white (e.g. on colored background). Only affects asset icons. */
  invert?: boolean;
  className?: string;
}

export function ActivityIcon({
  type,
  size = 24,
  badge = false,
  invert = false,
  className = "",
}: ActivityIconProps) {
  const iconSize = badge ? Math.round(size * 0.52) : size;
  const radius = Math.round(size * 0.28);
  const useAsset = ACTIVITY_WITH_ICON_FILE.has(type);
  const showWhite = badge || invert;

  const iconEl = useAsset ? (
    <img
      src={`/icons/${type}.svg`}
      alt=""
      width={iconSize}
      height={iconSize}
      aria-hidden
      draggable={false}
      style={{
        width: iconSize,
        height: iconSize,
        objectFit: "contain",
        pointerEvents: "none",
        ...(showWhite ? { filter: "brightness(0) invert(1)" } : {}),
      }}
    />
  ) : (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ color: showWhite ? "#fff" : "currentColor" }}
    >
      <OtherSparkle />
    </svg>
  );

  if (!badge) return <span className={className} style={{ display: "inline-flex", flexShrink: 0 }}>{iconEl}</span>;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: BRAND_GREEN,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {iconEl}
    </div>
  );
}

function OtherSparkle() {
  return (
    <path
      d="M12 2 L13.6 10.4 L22 12 L13.6 13.6 L12 22 L10.4 13.6 L2 12 L10.4 10.4 Z"
      fill="currentColor"
      stroke="none"
    />
  );
}
