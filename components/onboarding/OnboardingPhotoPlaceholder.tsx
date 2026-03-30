"use client";

function initialsFromName(first: string, last: string): string {
  const f = first.trim();
  const l = last.trim();
  if (f && l) return (f[0]! + l[0]!).toUpperCase();
  if (f.length >= 2) return f.slice(0, 2).toUpperCase();
  if (f.length === 1) return f.toUpperCase();
  return "?";
}

type OnboardingPhotoPlaceholderProps = {
  firstName: string;
  lastName: string;
  size?: number;
};

/** Empty onboarding avatar: neutral placeholder surface + muted initials (matches `--avatar-placeholder-*`). */
export function OnboardingPhotoPlaceholder({
  firstName,
  lastName,
  size = 84,
}: OnboardingPhotoPlaceholderProps) {
  const initials = initialsFromName(firstName, lastName);
  const fontSize = Math.round(size * 0.36);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 32,
        overflow: "hidden",
        position: "relative",
        background: "var(--avatar-placeholder-bg)",
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          fontWeight: 600,
          fontSize,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: "var(--avatar-placeholder-text)",
        }}
      >
        {initials}
      </span>
    </div>
  );
}
