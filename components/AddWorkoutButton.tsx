"use client";

type Props = {
  onClick: () => void;
  label?: string;
};

export function AddWorkoutButton({ onClick, label = "Add move" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="app-cta font-sans font-medium active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      style={{
        padding: "12px 24px",
        borderRadius: "9999px",
        letterSpacing: "-0.02em",
        fontSize: "clamp(15px, 3.2vw, 17px)",
      }}
      aria-label={label}
    >
      {label}
    </button>
  );
}
