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
 * Center column fills its grid cell and flex-centers text (no translateX(-50%) — that fights variable widths).
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

  const motionPos = reduce
    ? ({} as const)
    : ({
        position: "absolute" as const,
        top: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        ...(isCenter
          ? {
              left: 0,
              right: 0,
              justifyContent: "center" as const,
              width: "auto",
            }
          : anchor === "right"
            ? {
                left: "auto",
                right: 0,
                justifyContent: "flex-end" as const,
                width: "max-content",
                maxWidth: "100%",
              }
            : {
                left: 0,
                right: "auto",
                justifyContent: "flex-start" as const,
                width: "max-content",
                maxWidth: "100%",
              }),
      } satisfies CSSProperties);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflowX: "visible",
        overflowY: "hidden",
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
            willChange: reduce ? undefined : "transform, opacity",
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
