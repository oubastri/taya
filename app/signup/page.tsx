"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
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
          gap: 0,
        }}
      >
        {/* Wordmark */}
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
          <p
            style={{
              margin: "12px 0 0",
              fontSize: 15,
              color: "var(--foreground-muted)",
              lineHeight: 1.5,
            }}
          >
            Create your account to start logging moves and following friends.
          </p>
        </div>

        {checkEmail ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 0",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: "var(--foreground)",
                letterSpacing: "-0.02em",
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
              We sent a confirmation link to <strong style={{ color: "var(--foreground)" }}>{email}</strong>.
              Click it to finish creating your account.
            </p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

          <div>
            <label
              htmlFor="password"
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
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              placeholder="Min. 8 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
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
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              placeholder="••••••••"
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
              backgroundColor: loading ? "var(--foreground-subtle)" : "var(--foreground)",
              color: "var(--surface)",
              fontSize: 15,
              fontWeight: 800,
              fontFamily: "inherit",
              letterSpacing: "-0.02em",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s ease",
            }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        )}

        <p
          style={{
            marginTop: 28,
            textAlign: "center",
            fontSize: 14,
            color: "var(--foreground-muted)",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--foreground)",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
