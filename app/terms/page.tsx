import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms · TAYA",
  description: "Terms of use for TAYA (To All You Athletes)",
};

export default function TermsPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--background)",
        color: "var(--foreground)",
        padding: "max(24px, env(safe-area-inset-top)) 20px max(32px, env(safe-area-inset-bottom))",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            fontSize: 14,
            color: "var(--foreground-muted)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          ← Back
        </Link>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            margin: "24px 0 16px",
          }}
        >
          Terms of use
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--foreground-muted)", marginBottom: 20 }}>
          Last updated: March 22, 2026. These terms are a starter template. Have them reviewed by counsel
          before you rely on them for a public product.
        </p>
        <section style={{ fontSize: 15, lineHeight: 1.65, display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: "8px 0 0" }}>The service</h2>
          <p style={{ margin: 0, color: "var(--foreground-muted)" }}>
            TAYA is provided as-is. We may change or discontinue features. You are responsible for your use
            of the app and for content you post.
          </p>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: "8px 0 0" }}>Accounts</h2>
          <p style={{ margin: 0, color: "var(--foreground-muted)" }}>
            You agree to provide accurate information and keep credentials secure. You are responsible for
            activity under your account.
          </p>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: "8px 0 0" }}>Acceptable use</h2>
          <p style={{ margin: 0, color: "var(--foreground-muted)" }}>
            Do not misuse the service, harass others, or break the law. We may suspend access for violations.
          </p>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: "8px 0 0" }}>Disclaimer</h2>
          <p style={{ margin: 0, color: "var(--foreground-muted)" }}>
            The app is not medical advice. Consult a professional for health and training decisions.
          </p>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: "8px 0 0" }}>Contact</h2>
          <p style={{ margin: 0, color: "var(--foreground-muted)" }}>
            Add your legal or support contact before launch.
          </p>
        </section>
      </div>
    </div>
  );
}
