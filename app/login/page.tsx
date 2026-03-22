"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthLandingScaffold } from "@/components/auth/AuthLandingScaffold";
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

export default function LoginPage() {
  const router = useRouter();
  const closeToHome = () => router.push("/");
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
    <AuthLandingScaffold>
    <AuthShell embedded showBack onBack={closeToHome}>
      <FigmaAuthHeader title="Log in" />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="figma-auth-input"
            style={figmaFieldInput}
            placeholder="Enter password"
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
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <Link
          href="/forgot-password"
          style={{
            ...figmaFooterText,
            textDecoration: "underline",
            textUnderlineOffset: 3,
            color: "var(--foreground-muted)",
          }}
        >
          Forgot password?
        </Link>
      </div>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span style={figmaFooterText}>Don&apos;t have an account?</span>
        <Link href="/signup" style={{ ...figmaFooterText, textDecoration: "underline", textUnderlineOffset: 3 }}>
          Sign up
        </Link>
      </div>
    </AuthShell>
    </AuthLandingScaffold>
  );
}
