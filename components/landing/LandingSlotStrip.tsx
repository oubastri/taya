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
  /** Fixed strip height (shell + absolute layers share this box) */
  minHeight: string | number;
  /** Horizontal alignment inside the strip */
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
 * Soft edge for the swap: content fades through a masked zone at the strip's
 * top/bottom instead of appearing along a hard overflow-clip line. The shell
 * grows by this much on each side (offset by negative margins, so flow layout
 * is unchanged) and the mask's fade lives entirely in that bleed — resting
 * content never sits inside it.
 */
const EDGE_FADE = 8;

const toCss = (v: string | number) => (typeof v === "number" ? `${v}px` : v);

/**
 * Vertical slot swap with `mode="wait"`. Motion layers are position:absolute inside a fixed-height
 * shell so enter/exit don’t change flow width/height (reduces landing grid/header jitter).
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

  const justify =
    isCenter
      ? ("center" as const)
      : anchor === "right"
        ? ("flex-end" as const)
        : ("flex-start" as const);

  const layerStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: justify,
    boxSizing: "border-box",
    maxWidth: "100%",
    overflow: "hidden",
  };

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        /* Fixed block size: in-flow min-height alone let AnimatePresence / motion reflow siblings */
        height: `calc(${toCss(minHeight)} + ${EDGE_FADE * 2}px)`,
        minHeight: `calc(${toCss(minHeight)} + ${EDGE_FADE * 2}px)`,
        margin: `${-EDGE_FADE}px 0`,
        maskImage: `linear-gradient(to bottom, transparent 0, black ${EDGE_FADE}px, black calc(100% - ${EDGE_FADE}px), transparent 100%)`,
        WebkitMaskImage: `linear-gradient(to bottom, transparent 0, black ${EDGE_FADE}px, black calc(100% - ${EDGE_FADE}px), transparent 100%)`,
        minWidth: minWidthProp,
        width: reduce ? "auto" : "100%",
        ...style,
      }}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={slotKey}
          layout={false}
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
          style={layerStyle}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
