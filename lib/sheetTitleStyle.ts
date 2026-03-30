import type { CSSProperties } from "react";

/** Primary title in sheets (LogSheet, onboarding steps, etc.) */
export const sheetHeroTitle: CSSProperties = {
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: "clamp(26px, 7vw, 32px)",
  fontWeight: 500,
  lineHeight: 1.15,
  letterSpacing: "-0.04em",
  color: "var(--foreground)",
  margin: 0,
};
