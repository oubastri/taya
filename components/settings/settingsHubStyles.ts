import type { CSSProperties } from "react";

export const hubCard: CSSProperties = {
  background: "var(--settings-card-bg)",
  borderRadius: 24,
  padding: "16px",
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid var(--settings-hub-card-border)",
};

export const labelText: CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 12,
  fontWeight: 400,
  letterSpacing: "-1px",
  textTransform: "uppercase",
  color: "var(--settings-hub-label)",
  lineHeight: "normal",
};

export const valueText: CSSProperties = {
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: 24,
  fontWeight: 400,
  lineHeight: "32px",
  letterSpacing: "-0.96px",
  color: "var(--foreground)",
};

export const valueInput: CSSProperties = {
  ...valueText,
  width: "100%",
  border: "none",
  background: "transparent",
  outline: "none",
  padding: 0,
  margin: 0,
  WebkitAppearance: "none",
  appearance: "none",
  boxSizing: "border-box",
};

/** Auth / password rows — slightly smaller than hub display fields */
export const authValueInput: CSSProperties = {
  ...valueInput,
  fontSize: 18,
  lineHeight: "24px",
  letterSpacing: "-0.5px",
};

export const pillBtn: CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 50,
  padding: "12px 16px",
  border: "none",
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: 16,
  fontWeight: 400,
  lineHeight: "normal",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  backdropFilter: "blur(14.524px)",
  WebkitBackdropFilter: "blur(14.524px)",
  boxSizing: "border-box",
};

export const pillBtnPrimary: CSSProperties = {
  ...pillBtn,
  background: "var(--cta-bg)",
  color: "var(--cta-color)",
};

export const fieldErrorText: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "#ff3b30",
  lineHeight: 1.35,
};
