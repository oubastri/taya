"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { FigmaAuthHeader } from "@/components/auth/FigmaAuthHeader";
import { FigmaFieldCard } from "@/components/auth/FigmaFieldCard";
import {
  figmaFieldInput,
  figmaPrimaryBtn,
  figmaPrimaryBtnDisabled,
  figmaErrorText,
  figmaFooterText,
} from "@/components/auth/figmaAuthStyles";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell embedded showBack dismissIcon="close" onBack={() => router.push("/login")}>
      <FigmaAuthHeader title="Reset password" showWordmark={false} />

      {sent ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ ...figmaFooterText, textAlign: "left", fontSize: 22, fontWeight: 500 }}>
            Check your email
          </p>
          <p style={{ ...figmaFooterText, textAlign: "left", color: "var(--foreground-muted)" }}>
            We sent a password reset link to{" "}
            <strong style={{ color: "var(--foreground)" }}>{email}</strong>. It may take a minute to
            arrive.
          </p>
          <Link
            href="/login"
            style={{
              ...figmaFooterText,
              marginTop: 8,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p
            style={{
              margin: "0 0 4px",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 15,
              color: "var(--foreground-muted)",
              lineHeight: 1.5,
            }}
          >
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          <FigmaFieldCard label="Email">
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="figma-auth-input"
              style={figmaFieldInput}
              placeholder="Enter email"
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
            {loading ? "Sending…" : "Send reset link"}
          </button>

          <Link
            href="/login"
            style={{
              ...figmaFooterText,
              marginTop: 12,
              textAlign: "center",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              color: "var(--foreground-muted)",
            }}
          >
            Back to sign in
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
