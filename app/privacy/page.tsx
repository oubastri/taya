import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy · TAYA",
  description: "Privacy policy for TAYA (To All You Athletes)",
};

export default function PrivacyPage() {
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
          Privacy policy
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--foreground-muted)", marginBottom: 20 }}>
          Last updated: March 22, 2026. TAYA (&quot;we&quot;) runs this workout and social app. This page
          summarizes what we collect and why. Replace this draft with text your lawyer approves before a
          broad public launch.
        </p>
        <section style={{ fontSize: 15, lineHeight: 1.65, display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: "8px 0 0" }}>Information you provide</h2>
          <p style={{ margin: 0, color: "var(--foreground-muted)" }}>
            Account details (such as email), profile information (name, handle, bio, prompts, optional
            avatar), and workout logs (dates, descriptions, activity types) you enter in the app.
          </p>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: "8px 0 0" }}>How we use it</h2>
          <p style={{ margin: 0, color: "var(--foreground-muted)" }}>
            To provide the service: authentication, storing your data, showing your profile and activity to
            you and other users according to product features (for example feed and follow relationships).
          </p>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: "8px 0 0" }}>Hosting and processors</h2>
          <p style={{ margin: 0, color: "var(--foreground-muted)" }}>
            The app may use Supabase or similar providers for database, authentication, and file storage.
            Their processing is governed by their terms and your project configuration.
          </p>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: "8px 0 0" }}>Your choices</h2>
          <p style={{ margin: 0, color: "var(--foreground-muted)" }}>
            You can sign out, update profile and workouts in-app, or delete your account where the product
            provides that option. For other requests, add a contact email here.
          </p>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: "8px 0 0" }}>Contact</h2>
          <p style={{ margin: 0, color: "var(--foreground-muted)" }}>
            Add your support or privacy contact address before launch.
          </p>
        </section>
      </div>
    </div>
  );
}
