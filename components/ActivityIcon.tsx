"use client";

import type { ActivityType } from "@/types/workout";

// Per-activity palette — used by FeedPost, LogSheet, etc.
export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  run:        "#FF5C35",
  walk:       "#32D74B",
  cycle:      "#0A84FF",
  swim:       "#30B0C7",
  yoga:       "#BF5AF2",
  lift:       "#FF453A",
  hiit:       "#FF9F0A",
  pilates:    "#FF375F",
  basketball: "#FF6B00",
  tennis:     "#ACE53A",
  soccer:     "#30D158",
  climb:      "#A2845E",
  surf:       "#64D2FF",
  hike:       "#34C759",
  other:      "#8E8E93",
};

interface ActivityIconProps {
  type: ActivityType;
  size?: number;
  /** When true, wraps the icon in a colored rounded-square badge */
  badge?: boolean;
  className?: string;
}

export function ActivityIcon({
  type,
  size = 24,
  badge = false,
  className = "",
}: ActivityIconProps) {
  const color = ACTIVITY_COLORS[type];
  const iconSize = badge ? Math.round(size * 0.52) : size;
  const radius = Math.round(size * 0.28);

  const svgEl = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={badge ? "" : className}
    >
      <IconContent type={type} />
    </svg>
  );

  if (!badge) return svgEl;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "#fff",
      }}
    >
      {svgEl}
    </div>
  );
}

// ── Individual icon paths ────────────────────────────────────────────────────

function IconContent({ type }: { type: ActivityType }) {
  const rnd = {
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  switch (type) {
    // Running figure — forward lean, one leg up
    case "run":
      return (
        <g {...rnd}>
          <circle cx="15" cy="4" r="2" fill="currentColor" stroke="none" />
          {/* body */}
          <path d="M13.5 6.5 L11 12" strokeWidth="2.5" />
          {/* back arm */}
          <path d="M12 8.5 L9 7.5" strokeWidth="2" />
          {/* front arm */}
          <path d="M12 8.5 L14.5 10.5" strokeWidth="2" />
          {/* front leg */}
          <path d="M11 12 L13.5 16 L12 20.5" strokeWidth="2.5" />
          {/* back leg — airborne */}
          <path d="M11 12 L8.5 15 L7 13" strokeWidth="2.5" />
        </g>
      );

    // Walking figure — upright
    case "walk":
      return (
        <g {...rnd}>
          <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
          <path d="M12 6.5 L11.5 13" strokeWidth="2.5" />
          <path d="M11.5 9 L9 8" strokeWidth="2" />
          <path d="M11.5 9 L14 11" strokeWidth="2" />
          <path d="M11.5 13 L9.5 18.5 L8 21" strokeWidth="2.5" />
          <path d="M11.5 13 L14 17.5" strokeWidth="2.5" />
        </g>
      );

    // Bicycle — two wheels + frame
    case "cycle":
      return (
        <g {...rnd} strokeWidth="2">
          <circle cx="6" cy="17" r="4" />
          <circle cx="18" cy="17" r="4" />
          {/* frame */}
          <path d="M6 17 L12 9 L18 17" strokeWidth="2.5" />
          <path d="M12 17 L12 9" />
          <path d="M10 7 L14 7" strokeWidth="2.5" />
          {/* handlebar */}
          <path d="M16 10 L20 9" strokeWidth="2" />
        </g>
      );

    // Swimmer — horizontal figure in water
    case "swim":
      return (
        <g {...rnd}>
          <circle cx="19" cy="9" r="2.5" fill="currentColor" stroke="none" />
          {/* extended arm */}
          <path d="M17 9.5 L5 11" strokeWidth="2.5" />
          {/* kick */}
          <path d="M17 10.5 L21 13" strokeWidth="2" />
          <path d="M17 10.5 L20 7.5" strokeWidth="2" />
          {/* wave */}
          <path d="M3 16 Q6 13.5 9 16 Q12 18.5 15 16 Q18 13.5 21 16" strokeWidth="2" />
        </g>
      );

    // Yoga — seated lotus, arms out
    case "yoga":
      return (
        <g {...rnd}>
          <circle cx="12" cy="4.5" r="2" fill="currentColor" stroke="none" />
          {/* spine */}
          <path d="M12 6.5 L12 13.5" strokeWidth="2.5" />
          {/* arms */}
          <path d="M12 9.5 L6 12.5" strokeWidth="2" />
          <path d="M12 9.5 L18 12.5" strokeWidth="2" />
          {/* crossed legs */}
          <path d="M12 13.5 L7.5 17.5 L11 18.5" strokeWidth="2" />
          <path d="M12 13.5 L16.5 17.5 L13 18.5" strokeWidth="2" />
        </g>
      );

    // Overhead press — person with barbell
    case "lift":
      return (
        <g {...rnd}>
          <circle cx="12" cy="11" r="2" fill="currentColor" stroke="none" />
          {/* barbell */}
          <line x1="5" y1="4" x2="19" y2="4" stroke="currentColor" strokeWidth="2.5" />
          <rect x="2" y="2" width="3.5" height="4" rx="1" fill="currentColor" stroke="none" />
          <rect x="18.5" y="2" width="3.5" height="4" rx="1" fill="currentColor" stroke="none" />
          {/* arms */}
          <path d="M10 9 L7 5.5" strokeWidth="2" />
          <path d="M14 9 L17 5.5" strokeWidth="2" />
          {/* legs */}
          <path d="M12 13 L10 18 L8 21" strokeWidth="2.5" />
          <path d="M12 13 L14 18 L16 21" strokeWidth="2.5" />
        </g>
      );

    // HIIT — bold lightning bolt
    case "hiit":
      return (
        <path
          d="M14 2 L7 13 H12.5 L10 22 L17.5 11 H12 Z"
          fill="currentColor"
          stroke="none"
        />
      );

    // Pilates — V-sit / teaser
    case "pilates":
      return (
        <g {...rnd}>
          <circle cx="6" cy="14" r="2" fill="currentColor" stroke="none" />
          {/* torso leaning back */}
          <path d="M6 16 L8 20 L14 20" strokeWidth="2.5" />
          {/* legs raised */}
          <path d="M8 20 L16 12" strokeWidth="2.5" />
          {/* arms reaching */}
          <path d="M7 15 L13 11" strokeWidth="2" />
        </g>
      );

    // Basketball — ball with seams
    case "basketball":
      return (
        <g {...rnd} strokeWidth="2">
          <circle cx="12" cy="12" r="9" strokeWidth="2.5" />
          <path d="M12 3 C15.5 7 15.5 17 12 21" />
          <path d="M12 3 C8.5 7 8.5 17 12 21" />
          <line x1="3" y1="12" x2="21" y2="12" />
        </g>
      );

    // Tennis — ball (circle with curved seams)
    case "tennis":
      return (
        <g {...rnd} strokeWidth="2.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M5 6.5 Q9 12 5 17.5" />
          <path d="M19 6.5 Q15 12 19 17.5" />
        </g>
      );

    // Soccer — ball with pentagon patch
    case "soccer":
      return (
        <g {...rnd} strokeWidth="2">
          <circle cx="12" cy="12" r="9" strokeWidth="2.5" />
          <polygon
            points="12,7 15.5,9.5 14,13.5 10,13.5 8.5,9.5"
            fill="currentColor"
            stroke="none"
          />
          <line x1="12" y1="3" x2="12" y2="7" />
          <line x1="20.5" y1="7.5" x2="17" y2="9.5" />
          <line x1="18.5" y1="18" x2="15.5" y2="14" />
          <line x1="5.5" y1="18" x2="8.5" y2="14" />
          <line x1="3.5" y1="7.5" x2="7" y2="9.5" />
        </g>
      );

    // Climb — figure on rock face
    case "climb":
      return (
        <g {...rnd}>
          {/* wall */}
          <path d="M19 2 L19 22" stroke="currentColor" strokeWidth="3" />
          {/* person reaching up */}
          <circle cx="13" cy="9" r="2" fill="currentColor" stroke="none" />
          <path d="M13 11 L12 15" strokeWidth="2.5" />
          {/* arms reaching for holds */}
          <path d="M12.5 12 L10 10" strokeWidth="2" />
          <path d="M12.5 12 L16 8 L19 8" strokeWidth="2" />
          {/* feet on wall */}
          <path d="M12 15 L15 17 L19 17" strokeWidth="2" />
          <path d="M12 15 L10 19" strokeWidth="2" />
        </g>
      );

    // Surf — person on board over wave
    case "surf":
      return (
        <g {...rnd}>
          {/* wave */}
          <path d="M2 16 Q7 10 13 13 Q17 15 20 11 Q22 8.5 23 10" strokeWidth="2.5" />
          {/* board */}
          <path d="M8 14.5 L18 12" strokeWidth="3" strokeLinecap="round" />
          {/* surfer crouching */}
          <circle cx="14" cy="9" r="2" fill="currentColor" stroke="none" />
          <path d="M14 11 L13 13.5" strokeWidth="2.5" />
          <path d="M13.5 11.5 L16 12.5" strokeWidth="2" />
          <path d="M13.5 11.5 L11.5 13" strokeWidth="2" />
        </g>
      );

    // Hike — mountains + hiker silhouette
    case "hike":
      return (
        <g {...rnd}>
          {/* mountains */}
          <path d="M2 21 L9 7 L16 21" strokeWidth="2.5" />
          <path d="M11 21 L17 9 L23 21" strokeWidth="2.5" />
          {/* snow cap */}
          <path d="M9 7 L11 12 L7 12" strokeWidth="1.5" />
          {/* hiker dot */}
          <circle cx="6" cy="16" r="1.5" fill="currentColor" stroke="none" />
        </g>
      );

    // Other — four-point sparkle
    default:
      return (
        <path
          d="M12 2 L13.6 10.4 L22 12 L13.6 13.6 L12 22 L10.4 13.6 L2 12 L10.4 10.4 Z"
          fill="currentColor"
          stroke="none"
        />
      );
  }
}
