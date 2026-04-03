import type { CSSProperties } from "react";

/** Bottom sheet slide + scrim fade — shared across app (athletes SearchSheet reference). */
export const SHEET_SPRING = "0.38s cubic-bezier(0.32, 0.72, 0, 1)" as const;

export const SHEET_EXIT_MS = 380;

/** Vertical drag past this threshold dismisses the sheet (matches existing sheets). */
export const SHEET_DISMISS_DRAG_PX = 90;

/**
 * Sheets that use `left: 50%` must keep this transform after imperative drag/snap cleanup.
 * Clearing `transform` to "" drops centering and shifts the panel to the right.
 */
export const SHEET_TRANSFORM_SETTLED_CENTERED = "translateX(-50%)";

/** Full-width bottom sheets that only translate on Y (e.g. account menu). */
export const SHEET_TRANSFORM_SETTLED_FULL_WIDTH = "translateY(0)";

/**
 * iOS-sized drag zone for the sheet grabber row — avoids needing to hit the 4px pill.
 * `touchAction: "none"` keeps the gesture on the sheet instead of scrolling the page.
 */
export const SHEET_DRAG_REGION_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  minHeight: 44,
  paddingLeft: 24,
  paddingRight: 24,
  paddingTop: 10,
  paddingBottom: 10,
  boxSizing: "border-box",
  cursor: "grab",
  touchAction: "none",
  userSelect: "none",
};

