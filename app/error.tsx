"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        Something went wrong
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.5, color: "var(--foreground-muted)", margin: "0 0 24px", maxWidth: 360 }}>
        An unexpected error occurred. You can try again or go back home.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "12px 20px",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: "var(--accent)",
            color: "var(--foreground)",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <a
          href="/"
          style={{
            padding: "12px 20px",
            borderRadius: "var(--radius-full)",
            border: "1.5px solid var(--border-strong)",
            background: "transparent",
            color: "var(--foreground)",
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "inherit",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Home
        </a>
      </div>
    </div>
  );
}
