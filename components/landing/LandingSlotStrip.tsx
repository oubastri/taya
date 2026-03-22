"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

export type LandingSlotAnchor = "left" | "center" | "right";

type LandingSlotStripProps = {
  slotKey: string;
  children: ReactNode;
  /** Min height so percent-based slide does not collapse layout */
  minHeight: string | number;
  /** Horizontal anchor for the strip; animated layers are absolutely positioned so width stays stable */
  anchor: LandingSlotAnchor;
  /** Optional floor width (needed for center anchor so the box does not collapse to 0) */
  minWidth?: string | number;
  className?: string;
  style?: CSSProperties;
};

/** Aggressive ease-out for enter — fast start, graceful deceleration */
const EASE_ENTER = [0.16, 1, 0.3, 1] as const;
/** Ease-in for exit — content accelerates away */
const EASE_EXIT = [0.55, 0, 1, 0.45] as const;

/** Enter: deliberate enough to read, snappy enough to feel alive */
const SLOT_DURATION_ENTER = 0.38;
const SLOT_OPACITY_ENTER = 0.18;
/** Exit: gets out of the way quickly */
const SLOT_DURATION_EXIT = 0.13;
const SLOT_OPACITY_EXIT = 0.08;
/** Tighter travel reads crisper at larger font sizes */
const SLOT_Y = "55%" as const;

/**
 * Vertical slot swap: outgoing exits, then incoming enters (`wait` avoids two lines visible at once).
 * Motion layer is in-flow (relative) so slot height grows with wrapped text; minHeight is a floor only.
 */
export function LandingSlotStrip({
  slotKey,
  children,
  minHeight,
  anchor,
  minWidth: minWidthProp,
  className,
  style,
}: LandingSlotStripProps) {
  const reduce = useReducedMotion();
  const isCenter = anchor === "center";

  /** In-flow height so wrapped text / descenders are not clipped; width fills the grid cell */
  const flexRow = {
    display: "flex" as const,
    alignItems: "center" as const,
    width: "100%" as const,
    maxWidth: "100%" as const,
    boxSizing: "border-box" as const,
    ...(isCenter
      ? { justifyContent: "center" as const }
      : anchor === "right"
        ? { justifyContent: "flex-end" as const }
        : { justifyContent: "flex-start" as const }),
  } satisfies CSSProperties;

  const motionPos = reduce
    ? flexRow
    : ({ position: "relative" as const, ...flexRow } satisfies CSSProperties);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight,
        minWidth: minWidthProp,
        width: reduce ? "auto" : "100%",
        ...style,
      }}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={slotKey}
          initial={reduce ? false : { y: `-${SLOT_Y}`, opacity: 0 }}
          animate={
            reduce
              ? { y: 0, opacity: 1 }
              : {
                  y: 0,
                  opacity: 1,
                  transition: {
                    y: { duration: SLOT_DURATION_ENTER, ease: EASE_ENTER },
                    opacity: { duration: SLOT_OPACITY_ENTER, ease: "easeOut" },
                  },
                }
          }
          exit={
            reduce
              ? undefined
              : {
                  y: SLOT_Y,
                  opacity: 0,
                  transition: {
                    y: { duration: SLOT_DURATION_EXIT, ease: EASE_EXIT },
                    opacity: { duration: SLOT_OPACITY_EXIT, ease: "easeIn" },
                  },
                }
          }
          style={{
            ...motionPos,
            minHeight,
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
