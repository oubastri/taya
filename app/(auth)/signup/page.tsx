"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { useAuthLandingRequestClose } from "@/components/auth/AuthLandingScaffold";
import { FigmaAuthHeader } from "@/components/auth/FigmaAuthHeader";
import { FigmaFieldCard } from "@/components/auth/FigmaFieldCard";
import {
  figmaFieldInput,
  figmaPrimaryBtn,
  figmaPrimaryBtnDisabled,
  figmaErrorText,
  figmaFooterText,
} from "@/components/auth/figmaAuthStyles";
import { LegalFooterLinks } from "@/components/LegalFooterLinks";

export default function SignupPage() {
  const router = useRouter();
  const requestCloseModal = useAuthLandingRequestClose();
  const goBack = () => {
    if (requestCloseModal) requestCloseModal();
    else router.push("/");
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.session) {
        router.push("/onboarding");
        router.refresh();
      } else {
        setCheckEmail(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell embedded showBack dismissIcon="close" onBack={goBack}>
      <FigmaAuthHeader title="Create account" showWordmark={false} />

      {checkEmail ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ ...figmaFooterText, textAlign: "left", fontSize: 22, fontWeight: 500 }}>
            Check your email
          </p>
          <p style={{ ...figmaFooterText, textAlign: "left", color: "var(--foreground-muted)" }}>
            We sent a confirmation link to{" "}
            <strong style={{ color: "var(--foreground)" }}>{email}</strong>. Click it to finish
            creating your account.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <FigmaFieldCard label="Email">
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="figma-auth-input"
              style={figmaFieldInput}
              placeholder="Enter email"
            />
          </FigmaFieldCard>

          <FigmaFieldCard label="Password">
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="figma-auth-input"
              style={figmaFieldInput}
              placeholder="Minimum 8 characters"
            />
          </FigmaFieldCard>

          <FigmaFieldCard label="Confirm password">
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="figma-auth-input"
              style={figmaFieldInput}
              placeholder="Minimum 8 characters"
            />
          </FigmaFieldCard>

          {error ? <p style={figmaErrorText}>{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...figmaPrimaryBtn,
              marginTop: 8,
              ...(loading ? figmaPrimaryBtnDisabled : {}),
            }}
            className="active:opacity-90"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span style={figmaFooterText}>Already have an account?</span>
        <Link href="/login" style={{ ...figmaFooterText, textDecoration: "underline", textUnderlineOffset: 3 }}>
          Login
        </Link>
      </div>

      <LegalFooterLinks />
    </AuthShell>
  );
}
