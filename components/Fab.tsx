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
      className="fixed bottom-8 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-none transition-[transform,background-color] duration-200 ease-out hover:-translate-y-px hover:bg-[color-mix(in_srgb,var(--accent)_97%,#ffffff)] motion-reduce:hover:translate-y-0 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0)" }}
      aria-label={ariaLabel}
    >
      <span className="text-2xl leading-none">+</span>
    </button>
  );
}
