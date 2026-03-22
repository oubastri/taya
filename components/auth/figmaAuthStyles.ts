import type { CSSProperties } from "react";

/** White field cards — Figma Create account 457:3067 */
export const figmaFieldCard: CSSProperties = {
  background: "var(--figma-auth-field-bg)",
  borderRadius: 24,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  width: "100%",
  boxSizing: "border-box",
};

export const figmaFieldLabel: CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 12,
  fontWeight: 400,
  letterSpacing: "-1px",
  textTransform: "uppercase",
  color: "var(--figma-auth-label)",
  lineHeight: "normal",
  margin: 0,
};

export const figmaFieldInput: CSSProperties = {
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: 24,
  fontWeight: 400,
  lineHeight: "32px",
  letterSpacing: "-0.96px",
  width: "100%",
  border: "none",
  background: "transparent",
  outline: "none",
  padding: 0,
  margin: 0,
  boxSizing: "border-box",
};

/** Grey screen title under wordmark — node 457:3145 */
export const figmaPageTitle: CSSProperties = {
  margin: "12px 0 0",
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: "clamp(32px, 8.5vw, 38px)",
  fontWeight: 500,
  letterSpacing: "-0.1em",
  lineHeight: 1.05,
  color: "var(--figma-auth-screen-title)",
};

/** Black pill CTA — node 457:3123 */
export const figmaPrimaryBtn: CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 50,
  border: "none",
  padding: "12px 16px",
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: 16,
  fontWeight: 400,
  lineHeight: "normal",
  color: "var(--cta-color)",
  background: "var(--cta-bg)",
  cursor: "pointer",
  backdropFilter: "blur(14.524px)",
  WebkitBackdropFilter: "blur(14.524px)",
  WebkitTapHighlightColor: "transparent",
  boxSizing: "border-box",
};

export const figmaPrimaryBtnDisabled: CSSProperties = {
  opacity: 0.45,
  cursor: "not-allowed",
};

/** 48px circular back — node 457:3057 */
export const figmaBackButton: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  background: "var(--figma-auth-back-bg)",
  border: "1px solid var(--figma-auth-back-border)",
  boxShadow: "var(--figma-auth-back-shadow)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
  WebkitTapHighlightColor: "transparent",
  padding: 0,
};

export const figmaErrorText: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-sans), system-ui, sans-serif",
  fontSize: 14,
  fontWeight: 500,
  color: "#ff3a3a",
  lineHeight: 1.35,
};

export const figmaFooterText: CSSProperties = {
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: 16,
  fontWeight: 400,
  lineHeight: "21px",
  letterSpacing: "-0.04em",
  color: "var(--foreground)",
  textAlign: "center",
};

export const figmaFooterLink: CSSProperties = {
  ...figmaFooterText,
  textDecoration: "underline",
  textUnderlineOffset: 3,
  cursor: "pointer",
  background: "none",
  border: "none",
  padding: 0,
  font: "inherit",
};
