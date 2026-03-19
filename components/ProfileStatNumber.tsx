"use client";

export function ProfileStatNumber({
  children,
}: {
  children: React.ReactNode;
  variant?: 0 | 1 | 2;
}) {
  return (
    <span style={{ color: "var(--accent)" }}>{children}</span>
  );
}
