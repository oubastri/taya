"use client";

import type { ProfilePrompt } from "@/types/user";

interface ProfileAboutSectionProps {
  tagline?: string;
  prompts?: ProfilePrompt[];
}

export function ProfileAboutSection({ tagline, prompts }: ProfileAboutSectionProps) {
  const hasContent = tagline || (prompts && prompts.length > 0);

  if (!hasContent) {
    return (
      <p
        style={{
          fontSize: 15,
          color: "var(--foreground-muted)",
          textAlign: "center",
          padding: "40px 0",
          letterSpacing: "-0.2px",
          margin: 0,
        }}
      >
        Nothing here yet.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {tagline && (
        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 32,
            fontWeight: 400,
            lineHeight: "32px",
            letterSpacing: "-1.28px",
            color: "var(--foreground)",
            margin: 0,
          }}
        >
          {tagline}
        </p>
      )}

      {prompts && prompts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: tagline ? 24 : 0 }}>
          {prompts.map((prompt, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "var(--surface)",
                borderRadius: 32,
                padding: "24px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 36,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-mono), 'B612 Mono', monospace",
                  fontSize: 12,
                  fontWeight: 400,
                  textTransform: "uppercase",
                  letterSpacing: "-1px",
                  color: "rgba(0,0,0,0.4)",
                  lineHeight: 1.4,
                  maxWidth: 182,
                }}
              >
                {prompt.question}
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 32,
                  fontWeight: 400,
                  lineHeight: "32px",
                  letterSpacing: "-1.28px",
                  color: "var(--foreground)",
                }}
              >
                {prompt.answer}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
