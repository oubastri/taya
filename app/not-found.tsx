import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--background)",
        color: "var(--foreground)",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
        Page not found
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.5, color: "var(--foreground-muted)", margin: "0 0 24px", maxWidth: 360 }}>
        That URL doesn&apos;t match anything here.
      </p>
      <Link
        href="/"
        style={{
          padding: "12px 20px",
          borderRadius: "var(--radius-full)",
          border: "none",
          background: "var(--accent)",
          color: "var(--foreground)",
          fontSize: 15,
          fontWeight: 700,
          fontFamily: "inherit",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        Back home
      </Link>
    </div>
  );
}
