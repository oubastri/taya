import type { CSSProperties } from "react";
import Link from "next/link";

const linkStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--foreground-muted)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

export function LegalFooterLinks() {
  return (
    <nav
      aria-label="Legal"
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "10px 16px",
        paddingTop: 8,
      }}
    >
      <Link href="/privacy" style={linkStyle}>
        Privacy
      </Link>
      <Link href="/terms" style={linkStyle}>
        Terms
      </Link>
    </nav>
  );
}
