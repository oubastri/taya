import type { CSSProperties } from "react";

/** Sticky bar — solid, matches settings page background. */
export const SETTINGS_STICKY_TOP_BAR: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 51,
  width: "100vw",
  maxWidth: "100vw",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  boxSizing: "border-box",
  paddingTop: "max(env(safe-area-inset-top), 20px)",
  paddingBottom: 14,
  paddingLeft: 16,
  paddingRight: 16,
  background: "var(--settings-page-bg)",
  borderBottom: "none",
};

export const SETTINGS_GLASS_BACK: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: "100px",
  backdropFilter: "blur(24px) saturate(1.8)",
  WebkitBackdropFilter: "blur(24px) saturate(1.8)",
  background: "var(--glass-btn-bg)",
  border: "1px solid var(--glass-btn-border)",
  boxShadow: "var(--glass-btn-shadow)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
  WebkitTapHighlightColor: "transparent",
  padding: 0,
};

/** Grouped settings card — solid surface (reference UI). */
export const SETTINGS_GLASS_CARD: CSSProperties = {
  background: "var(--settings-card-bg)",
  borderRadius: 22,
  border: "1px solid var(--settings-card-border)",
  boxShadow: "none",
  overflow: "hidden",
};

/** Small icon plate inside rows. */
export const SETTINGS_ROW_ICON_WELL: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 12,
  background: "var(--settings-icon-well-bg)",
  border: "1px solid var(--settings-icon-well-border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  color: "var(--foreground-muted)",
};

/** Legacy export name — same as glass card for profile hero inset if needed */
export const CARD_OUTER = SETTINGS_GLASS_CARD;

export const SECTION_LABEL: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: "var(--foreground-subtle)",
  margin: "0 0 8px 14px",
};
