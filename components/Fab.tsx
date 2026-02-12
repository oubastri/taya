"use client";

type Props = {
  onClick: () => void;
  ariaLabel?: string;
};

export function Fab({ onClick, ariaLabel = "Add workout" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-8 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0)" }}
      aria-label={ariaLabel}
    >
      <span className="text-2xl leading-none">+</span>
    </button>
  );
}
