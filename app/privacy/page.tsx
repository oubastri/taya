import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy · To All You Athletes",
  description: "Privacy policy for To All You Athletes",
};

const headingStyle = { fontSize: 17, fontWeight: 600, margin: "8px 0 0" } as const;
const bodyStyle = { margin: 0, color: "var(--foreground-muted)" } as const;

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
          Last updated: June 15, 2026. This Privacy Policy explains how To All You Athletes, operated by
          Alexander Oubari (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), collects, uses, and protects
          your information when you use the To All You Athletes mobile application and related services (the
          &quot;Service&quot;). By using the Service, you agree to the practices described here.
        </p>
        <section style={{ fontSize: 15, lineHeight: 1.65, display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={headingStyle}>Information we collect</h2>
          <p style={bodyStyle}>
            We collect the following information when you create an account and use To All You Athletes:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, color: "var(--foreground-muted)" }}>
            <li>
              <strong>Account information:</strong> your name, username (handle), email address, and (if you
              provide it) phone number.
            </li>
            <li>
              <strong>Profile information:</strong> profile photo, location, tagline, bio, and the prompt
              answers you choose to share.
            </li>
            <li>
              <strong>Content you create:</strong> workouts you log, comments you post, likes, and the
              accounts you follow.
            </li>
            <li>
              <strong>Technical information:</strong> basic log and device data needed to operate and secure
              the Service, handled through our infrastructure provider.
            </li>
          </ul>

          <h2 style={headingStyle}>How we use your information</h2>
          <ul style={{ margin: 0, paddingLeft: 20, color: "var(--foreground-muted)" }}>
            <li>To create and manage your account.</li>
            <li>To operate core features — your activity feed, profiles, search, comments, likes, and follows.</li>
            <li>To keep the Service safe, including reviewing reports and enforcing our Terms.</li>
            <li>To respond to your requests and provide support.</li>
          </ul>

          <h2 style={headingStyle}>How your information is stored and shared</h2>
          <p style={bodyStyle}>
            Your data is stored using Supabase, our backend and database provider, which processes data on our
            behalf. We do not sell your personal information. We share information only as needed to operate
            the Service, comply with the law, or protect the rights and safety of our users.
          </p>

          <h2 style={headingStyle}>Your choices and rights</h2>
          <ul style={{ margin: 0, paddingLeft: 20, color: "var(--foreground-muted)" }}>
            <li>
              <strong>Access and update:</strong> you can edit your profile information at any time in the
              app&apos;s settings.
            </li>
            <li>
              <strong>Account deletion:</strong> you can permanently delete your account from within the app
              (Settings → Delete Account). This removes your profile and the content associated with it.
            </li>
            <li>
              <strong>Blocking:</strong> you can block other users so that you and they no longer see each
              other.
            </li>
          </ul>

          <h2 style={headingStyle}>Data retention</h2>
          <p style={bodyStyle}>
            We keep your information for as long as your account is active. When you delete your account, we
            remove your associated personal data, except where we are required to retain certain information
            by law.
          </p>

          <h2 style={headingStyle}>Children&apos;s privacy</h2>
          <p style={bodyStyle}>
            The Service is not directed to children under 13, and we do not knowingly collect personal
            information from them. If you believe a child has provided us information, please contact us and we
            will delete it.
          </p>

          <h2 style={headingStyle}>Changes to this policy</h2>
          <p style={bodyStyle}>
            We may update this Privacy Policy from time to time. When we do, we will revise the &quot;Last
            updated&quot; date above. Continued use of the Service after changes take effect means you accept
            the updated policy.
          </p>

          <h2 style={headingStyle}>Contact us</h2>
          <p style={bodyStyle}>
            If you have questions about this Privacy Policy, contact us at{" "}
            <a href="mailto:alexander.oubari@gmail.com" style={{ color: "inherit" }}>
              alexander.oubari@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
