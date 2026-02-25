"use client";

/** Three unique hand-drawn imperfect circles – wobbly radius, each different. */
const CIRCLE_PATHS: Record<0 | 1 | 2, string> = {
  // Slightly squashed top, bulge bottom-right
  0: "M 50 14 Q 90 18 88 50 Q 92 84 52 88 Q 10 82 12 50 Q 14 16 50 14 Z",
  // Bulge top-left, flatter right
  1: "M 48 10 Q 14 16 10 50 Q 18 86 50 90 Q 88 84 90 50 Q 82 12 48 10 Z",
  // Gentle wobble all around, rounder
  2: "M 50 16 Q 84 12 88 48 Q 86 86 50 88 Q 16 86 14 50 Q 12 18 50 16 Z",
};

/** Kid-drawn style imperfect circle outline in brand green, overlaid on the number. Does not affect text spacing. */
export function ProfileStatNumber({
  children,
  variant = 0,
}: {
  children: React.ReactNode;
  variant?: 0 | 1 | 2;
}) {
  const pathD = CIRCLE_PATHS[variant];

  return (
    <span
      style={{
        position: "relative",
        display: "inline",
      }}
    >
      <svg
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "1.85em",
          height: "1.85em",
          pointerEvents: "none",
        }}
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden
      >
        <path
          d={pathD}
          stroke="var(--accent)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span style={{ position: "relative", zIndex: 1, color: "var(--accent)" }}>{children}</span>
    </span>
  );
}
