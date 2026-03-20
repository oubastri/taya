"use client";

export function IosSwitch({
  checked,
  onToggle,
  ariaLabel,
}: {
  checked: boolean;
  onToggle: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onToggle}
      style={{
        width: 46,
        height: 28,
        borderRadius: 14,
        border: "none",
        padding: 2,
        background: checked ? "var(--settings-switch-on)" : "var(--settings-switch-off-track)",
        cursor: "pointer",
        flexShrink: 0,
        boxSizing: "border-box",
        transition: "background 0.2s ease",
        WebkitTapHighlightColor: "transparent",
      }}
      className="active:opacity-90"
    >
      <span
        style={{
          display: "block",
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "var(--settings-switch-thumb)",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.22s var(--ease-out-expo)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
        }}
      />
    </button>
  );
}
