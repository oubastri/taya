import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms · To All You Athletes",
  description: "Terms of use for To All You Athletes",
};

const css = `
.legal-doc {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #1a1a1a;
  background: #fff;
  min-height: 100dvh;
}
[data-theme="dark"] .legal-doc { color: #e6e6e6; background: #0d0d0d; }
.legal-inner { max-width: 720px; margin: 0 auto; padding: 48px 20px 120px; }
.legal-doc h1 { font-size: 28px; font-weight: 700; margin: 0 0 4px; letter-spacing: -0.02em; }
.legal-doc h2 { font-size: 19px; font-weight: 600; margin: 34px 0 0; }
.legal-doc .updated { color: #888; font-size: 14px; margin: 0 0 24px; }
.legal-doc p { margin: 10px 0; }
.legal-doc a { color: #01b840; }
.legal-doc ul { padding-left: 20px; margin: 10px 0; }
.legal-doc li { margin: 4px 0; }
.legal-doc .callout { border-left: 3px solid #01EF54; padding: 6px 0 6px 16px; margin: 16px 0; }
`;

export default function TermsPage() {
  return (
    <div className="legal-doc">
      <style>{css}</style>
      <div className="legal-inner">
        <h1>Terms of Use</h1>
        <p className="updated">Last updated: June 15, 2026</p>

        <p>
          These Terms of Use (&quot;Terms&quot;) are a legal agreement between you and Alexander Oubari
          (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), the operator of To All You Athletes, governing
          your use of the To All You Athletes mobile application and related services (the &quot;Service&quot;).
          By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use
          the Service.
        </p>

        <h2>1. Eligibility</h2>
        <p>
          You must be at least 13 years old to use the Service. By using To All You Athletes, you confirm that
          you meet this requirement and that the information you provide is accurate.
        </p>

        <h2>2. Your Account</h2>
        <p>
          You are responsible for your account and for keeping your login credentials secure. You are
          responsible for all activity that occurs under your account.
        </p>

        <h2>3. Your Content</h2>
        <p>
          You retain ownership of the content you post (workouts, comments, profile information, and other
          materials). By posting content, you grant us a limited license to host, display, and distribute that
          content as needed to operate the Service. You are solely responsible for the content you post.
        </p>

        <h2>4. Zero Tolerance for Objectionable Content and Abusive Behavior</h2>
        <div className="callout">
          <p style={{ margin: 0 }}>
            <strong>We have a zero-tolerance policy for objectionable content and abusive users.</strong> You
            agree not to post, share, or transmit content that is unlawful, harassing, abusive, threatening,
            hateful, defamatory, sexually explicit, violent, or otherwise objectionable, and you agree not to
            harass, bully, impersonate, or abuse other users.
          </p>
        </div>
        <p>Objectionable content and abusive behavior include, without limitation:</p>
        <ul>
          <li>Harassment, bullying, threats, or hate speech;</li>
          <li>Sexually explicit, violent, or graphic content;</li>
          <li>Spam, scams, or deceptive content;</li>
          <li>Impersonation of another person or entity;</li>
          <li>Content that infringes others&apos; rights or violates any law.</li>
        </ul>

        <h2>5. Reporting, Blocking, and Enforcement</h2>
        <p>
          The Service provides tools to report objectionable content and to block abusive users. We review
          reported content and will act on objectionable content and the users who post it, including removing
          content and ejecting offending users, within 24 hours of a report where appropriate. We may remove
          content or suspend or terminate accounts at our discretion, with or without notice, for any violation
          of these Terms.
        </p>

        <h2>6. Termination</h2>
        <p>
          You may stop using the Service and delete your account at any time from within the app. We may
          suspend or terminate your access if you violate these Terms or if we discontinue the Service.
        </p>

        <h2>7. Disclaimer</h2>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any
          kind, to the fullest extent permitted by law. The app is not medical advice; consult a professional
          for health and training decisions.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Alexander Oubari will not be liable for any indirect,
          incidental, special, consequential, or punitive damages arising from your use of the Service.
        </p>

        <h2>9. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the State of California, USA, without regard to its
          conflict-of-laws principles.
        </p>

        <h2>10. Apple App Store</h2>
        <p>
          This agreement is between you and Alexander Oubari only, and not with Apple. Apple is not responsible
          for the Service or its content. Apple and its subsidiaries are third-party beneficiaries of these
          Terms and may enforce them against you.
        </p>

        <h2>11. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. When we do, we will revise the &quot;Last updated&quot;
          date above. Continued use of the Service after changes take effect means you accept the updated
          Terms.
        </p>

        <h2>12. Contact Us</h2>
        <p>
          Questions about these Terms? Contact us at{" "}
          <a href="mailto:alexander.oubari@gmail.com">alexander.oubari@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
