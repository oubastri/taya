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
      className="font-sans font-medium text-white transition-all duration-200 ease-out hover:scale-[1.02] hover:opacity-90 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      style={{
        background: "#000000",
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
