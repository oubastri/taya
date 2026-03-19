"use client";

export type FeedMode = "team" | "stadium";

const LABELS: Record<FeedMode, string> = {
  team: "FRIENDS",
  stadium: "WORLD",
};

interface FeedToggleProps {
  value: FeedMode;
  onChange: (value: FeedMode) => void;
}

export function FeedToggle({ value, onChange }: FeedToggleProps) {
  const toggle = () => onChange(value === "team" ? "stadium" : "team");

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={`Viewing ${LABELS[value]} — tap to switch`}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") toggle();
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 8px",
        borderRadius: 4,
        border: "1px dashed var(--mono-border)",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
        fontFamily: '"B612 Mono", ui-monospace, monospace',
        fontSize: 12,
        fontWeight: 400,
        letterSpacing: "-0.48px",
        lineHeight: "normal",
        color: "var(--foreground)",
      }}
    >
      {LABELS[value]}
    </span>
  );
}
