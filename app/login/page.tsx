"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", authData.user.id)
        .single();

      if (!profile?.onboarding_completed) {
        router.push("/onboarding");
      } else {
        router.push("/");
      }
      router.refresh();
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
        </div>

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
              autoComplete="current-password"
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div
          style={{
            marginTop: 12,
            textAlign: "center",
          }}
        >
          <Link
            href="/forgot-password"
            style={{
              fontSize: 14,
              color: "var(--foreground-muted)",
              textDecoration: "none",
            }}
          >
            Forgot password?
          </Link>
        </div>

        <p
          style={{
            marginTop: 20,
            textAlign: "center",
            fontSize: 14,
            color: "var(--foreground-muted)",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            style={{
              color: "var(--foreground)",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
