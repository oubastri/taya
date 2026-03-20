import type { CSSProperties } from "react";

export const INSET_ROW: CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid var(--row-border)",
};

export const INSET_ROW_LAST: CSSProperties = {
  padding: "12px 14px",
};

export const FIELD_LABEL: CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--foreground-subtle)",
  marginBottom: 6,
};

export const FIELD_INPUT: CSSProperties = {
  width: "100%",
  border: "none",
  background: "transparent",
  fontSize: 14,
  fontWeight: 500,
  fontFamily: "inherit",
  color: "var(--foreground)",
  outline: "none",
  padding: 0,
  boxSizing: "border-box",
};

export const READ_ONLY_VALUE: CSSProperties = {
  ...FIELD_INPUT,
  color: "var(--foreground-muted)",
  cursor: "default",
};
