import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy · To All You Athletes",
  description: "Privacy policy for To All You Athletes",
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

export default function PrivacyPage() {
  return (
    <div className="legal-doc">
      <style>{css}</style>
      <div className="legal-inner">
        <h1>Privacy Policy</h1>
        <p className="updated">Last updated: August 5, 2026</p>

        <p>
          This Privacy Policy explains how To All You Athletes, operated by Alexander Oubari (&quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;), collects, uses, and protects your information when you use the
          To All You Athletes mobile application and related services (the &quot;Service&quot;). By using the
          Service, you agree to the practices described here.
        </p>

        <h2>1. Information We Collect</h2>
        <p>We collect the following information when you create an account and use the Service:</p>
        <ul>
          <li>
            <strong>Account information:</strong> your name, username (handle), email address, and (if you
            provide it) phone number.
          </li>
          <li>
            <strong>Profile information:</strong> profile photo, location, tagline, bio, and the prompt
            answers you choose to share.
          </li>
          <li>
            <strong>Content you create:</strong> workouts you log, comments you post, likes, and the accounts
            you follow.
          </li>
          <li>
            <strong>Contacts (optional):</strong> if you choose to sync your contacts, the phone numbers in
            your address book. This is off until you turn it on — see Section 2.
          </li>
          <li>
            <strong>Technical information:</strong> basic log and device data needed to operate and secure the
            Service, handled through our infrastructure provider.
          </li>
        </ul>

        <h2>2. Contacts and Finding Friends</h2>
        <p>
          The Service can show you which of your phone contacts already use TAYA, and let you know when
          someone you know joins. This feature is optional and does nothing until you turn it on.
        </p>
        <ul>
          <li>
            <strong>Only with your permission.</strong> We access your contacts only after you grant
            permission on your device and choose to sync. You can turn it off at any time in the app&apos;s
            settings or your device settings, and the rest of the Service works without it.
          </li>
          <li>
            <strong>What we receive.</strong> When you sync, your device sends us the phone numbers in your
            contacts. We do not receive or store the names, email addresses, or any other details of the
            people in your address book.
          </li>
          <li>
            <strong>How they are stored.</strong> Phone numbers are converted on our servers into
            irreversible hashes using a secret key, and only those hashes are kept. They cannot be turned
            back into phone numbers, and they are not visible to other users.
          </li>
          <li>
            <strong>What we do with them.</strong> We compare those hashes against the verified numbers of
            other accounts, so we can show you people you already know and tell you when one of your
            contacts joins. We do not use them for advertising, and we do not build profiles of people who
            are not on the Service.
          </li>
          <li>
            <strong>Your own number.</strong> If you verify a phone number, we store it so that people who
            already have you in their contacts can find you. Your number is never shown to other users.
          </li>
          <li>
            <strong>Re-syncing and deletion.</strong> Each sync replaces whatever we previously stored for
            you, so contacts you delete stop matching. All of it is removed when you delete your account.
          </li>
          <li>
            <strong>Invitations.</strong> If you invite someone, the message is written and sent from your
            own device using your own messaging app. We never send messages on your behalf and we never
            contact people in your address book.
          </li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To create and manage your account.</li>
          <li>To operate core features — your activity feed, profiles, search, comments, likes, and follows.</li>
          <li>
            If you turn on contact syncing, to show you people you already know and to notify you when one
            of your contacts joins (see Section 2).
          </li>
          <li>To keep the Service safe, including reviewing reports and enforcing our Terms.</li>
          <li>To respond to your requests and provide support.</li>
        </ul>

        <h2>4. How Your Information Is Stored and Shared</h2>
        <p>
          Your data is stored using Supabase, our backend and database provider, which processes data on our
          behalf. We do not sell your personal information. We share information only as needed to operate the
          Service, comply with the law, or protect the rights and safety of our users.
        </p>

        <h2>5. Your Choices and Rights</h2>
        <ul>
          <li>
            <strong>Access and update:</strong> you can edit your profile information at any time in the
            app&apos;s settings.
          </li>
          <li>
            <strong>Account deletion:</strong> you can permanently delete your account from within the app
            (Settings → Delete Account). This removes your profile and the content associated with it.
          </li>
          <li>
            <strong>Blocking:</strong> you can block other users so that you and they no longer see each other.
          </li>
          <li>
            <strong>Contacts:</strong> you can turn contact syncing on or off at any time in the app
            (Settings → Contacts). Turning it off stops further syncing, and deleting your account removes
            everything we stored from it.
          </li>
        </ul>

        <h2>6. Data Retention</h2>
        <p>
          We keep your information for as long as your account is active. When you delete your account, we
          remove your associated personal data, except where we are required to retain certain information by
          law.
        </p>

        <h2>7. Children&apos;s Privacy</h2>
        <p>
          The Service is not directed to children under 13, and we do not knowingly collect personal
          information from them. If you believe a child has provided us information, please contact us and we
          will delete it.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. When we do, we will revise the &quot;Last
          updated&quot; date above. Continued use of the Service after changes take effect means you accept the
          updated policy.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, contact us at{" "}
          <a href="mailto:alexander.oubari@gmail.com">alexander.oubari@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
