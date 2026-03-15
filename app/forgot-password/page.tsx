"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/auth/callback?next=/settings` },
      );

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
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: 40 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--foreground-subtle)",
            }}
          >
            To All You
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 38,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "var(--foreground)",
            }}
          >
            Athletes
            <span style={{ color: "var(--accent)" }}>.</span>
          </h1>
        </div>

        {sent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--foreground)",
              }}
            >
              Check your email
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                color: "var(--foreground-muted)",
                lineHeight: 1.5,
              }}
            >
              We sent a password reset link to{" "}
              <strong style={{ color: "var(--foreground)" }}>{email}</strong>.
              It may take a minute to arrive.
            </p>
            <Link
              href="/login"
              style={{
                marginTop: 8,
                textAlign: "center",
                fontSize: 14,
                color: "var(--foreground)",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--foreground)",
              }}
            >
              Reset your password
            </p>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 15,
                color: "var(--foreground-muted)",
                lineHeight: 1.5,
              }}
            >
              Enter your email and we&apos;ll send you a link to reset your
              password.
            </p>

            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--foreground-subtle)",
                  marginBottom: 8,
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "1.5px solid var(--border-strong)",
                  backgroundColor: "var(--surface)",
                  fontSize: 15,
                  fontFamily: "inherit",
                  fontWeight: 500,
                  color: "var(--foreground)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#e53e3e",
                  padding: "10px 14px",
                  backgroundColor: "rgba(229,62,62,0.08)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                width: "100%",
                padding: "16px",
                borderRadius: "var(--radius-full)",
                border: "none",
                backgroundColor: loading
                  ? "var(--foreground-subtle)"
                  : "var(--foreground)",
                color: "var(--surface)",
                fontSize: 15,
                fontWeight: 800,
                fontFamily: "inherit",
                letterSpacing: "-0.02em",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s ease",
              }}
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>

            <Link
              href="/login"
              style={{
                marginTop: 12,
                textAlign: "center",
                fontSize: 14,
                color: "var(--foreground-muted)",
                textDecoration: "none",
                display: "block",
              }}
            >
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
