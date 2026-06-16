import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms · To All You Athletes",
  description: "Terms of use for To All You Athletes",
};

const headingStyle = { fontSize: 17, fontWeight: 600, margin: "8px 0 0" } as const;
const bodyStyle = { margin: 0, color: "var(--foreground-muted)" } as const;

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
          Last updated: June 15, 2026. These Terms of Use (&quot;Terms&quot;) are a legal agreement between
          you and Alexander Oubari (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), the operator of To
          All You Athletes, governing your use of the To All You Athletes mobile application and related
          services (the &quot;Service&quot;). By creating an account or using the Service, you agree to these
          Terms. If you do not agree, do not use the Service.
        </p>
        <section style={{ fontSize: 15, lineHeight: 1.65, display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={headingStyle}>Eligibility</h2>
          <p style={bodyStyle}>
            You must be at least 13 years old to use the Service. By using To All You Athletes, you confirm
            that you meet this requirement and that the information you provide is accurate.
          </p>

          <h2 style={headingStyle}>Your account</h2>
          <p style={bodyStyle}>
            You are responsible for your account and for keeping your login credentials secure. You are
            responsible for all activity that occurs under your account.
          </p>

          <h2 style={headingStyle}>Your content</h2>
          <p style={bodyStyle}>
            You retain ownership of the content you post (workouts, comments, profile information, and other
            materials). By posting content, you grant us a limited license to host, display, and distribute
            that content as needed to operate the Service. You are solely responsible for the content you
            post.
          </p>

          <h2 style={headingStyle}>Zero tolerance for objectionable content and abusive behavior</h2>
          <div
            style={{
              borderLeft: "3px solid #01EF54",
              paddingLeft: 14,
              color: "var(--foreground-muted)",
            }}
          >
            <p style={{ margin: 0 }}>
              <strong>We have a zero-tolerance policy for objectionable content and abusive users.</strong>{" "}
              You agree not to post, share, or transmit content that is unlawful, harassing, abusive,
              threatening, hateful, defamatory, sexually explicit, violent, or otherwise objectionable, and
              you agree not to harass, bully, impersonate, or abuse other users.
            </p>
          </div>
          <p style={bodyStyle}>Objectionable content and abusive behavior include, without limitation:</p>
          <ul style={{ margin: 0, paddingLeft: 20, color: "var(--foreground-muted)" }}>
            <li>Harassment, bullying, threats, or hate speech;</li>
            <li>Sexually explicit, violent, or graphic content;</li>
            <li>Spam, scams, or deceptive content;</li>
            <li>Impersonation of another person or entity;</li>
            <li>Content that infringes others&apos; rights or violates any law.</li>
          </ul>

          <h2 style={headingStyle}>Reporting, blocking, and enforcement</h2>
          <p style={bodyStyle}>
            The Service provides tools to report objectionable content and to block abusive users. We review
            reported content and will act on objectionable content and the users who post it, including
            removing content and ejecting offending users, within 24 hours of a report where appropriate. We
            may remove content or suspend or terminate accounts at our discretion, with or without notice, for
            any violation of these Terms.
          </p>

          <h2 style={headingStyle}>Termination</h2>
          <p style={bodyStyle}>
            You may stop using the Service and delete your account at any time from within the app. We may
            suspend or terminate your access if you violate these Terms or if we discontinue the Service.
          </p>

          <h2 style={headingStyle}>Disclaimer</h2>
          <p style={bodyStyle}>
            The Service is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any
            kind, to the fullest extent permitted by law. The app is not medical advice; consult a
            professional for health and training decisions.
          </p>

          <h2 style={headingStyle}>Limitation of liability</h2>
          <p style={bodyStyle}>
            To the fullest extent permitted by law, Alexander Oubari will not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from your use of the Service.
          </p>

          <h2 style={headingStyle}>Governing law</h2>
          <p style={bodyStyle}>
            These Terms are governed by the laws of the State of California, USA, without regard to its
            conflict-of-laws principles.
          </p>

          <h2 style={headingStyle}>Apple App Store</h2>
          <p style={bodyStyle}>
            This agreement is between you and Alexander Oubari only, and not with Apple. Apple is not
            responsible for the Service or its content. Apple and its subsidiaries are third-party
            beneficiaries of these Terms and may enforce them against you.
          </p>

          <h2 style={headingStyle}>Changes to these Terms</h2>
          <p style={bodyStyle}>
            We may update these Terms from time to time. When we do, we will revise the &quot;Last updated&quot;
            date above. Continued use of the Service after changes take effect means you accept the updated
            Terms.
          </p>

          <h2 style={headingStyle}>Contact</h2>
          <p style={bodyStyle}>
            Questions about these Terms? Contact us at{" "}
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
