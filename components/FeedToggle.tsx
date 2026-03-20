"use client";

export type FeedMode = "team" | "stadium";

const LABELS: Record<FeedMode, string> = {
  team: "FRIENDS",
  stadium: "WORLD",
};

const ICONS: Record<FeedMode, string> = {
  team: "/icons/tabbar/friend-selected.svg",
  stadium: "/icons/tabbar/globe-selected.svg",
};

interface FeedToggleProps {
  value: FeedMode;
  onChange: (value: FeedMode) => void;
}

/** Matches the log sheet “Today” date chip (pill, mono label, trailing chevron). */
export function FeedToggle({ value, onChange }: FeedToggleProps) {
  const toggle = () => onChange(value === "team" ? "stadium" : "team");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        value === "team"
          ? "Friends feed. Switch to world feed."
          : "World feed. Switch to friends feed."
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 100,
        border: "none",
        background: "var(--chip-bg)",
        cursor: "pointer",
        fontFamily: '"B612 Mono", ui-monospace, monospace',
        fontSize: 12,
        fontWeight: 500,
        color: "var(--chip-color)",
        letterSpacing: "-0.48px",
        WebkitTapHighlightColor: "transparent",
        lineHeight: "normal",
        transition: "background 0.18s, color 0.18s",
      }}
      className="active:opacity-90"
    >
      <img
        src={ICONS[value]}
        alt=""
        width={14}
        height={14}
        aria-hidden
        draggable={false}
        className="activity-icon-auto"
        style={{
          display: "block",
          width: 14,
          height: 14,
          flexShrink: 0,
          opacity: 0.9,
          objectFit: "contain",
        }}
      />
      {LABELS[value]}
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        style={{ opacity: 0.85, flexShrink: 0 }}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );
}
