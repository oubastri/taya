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
      className="fixed bottom-8 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-[transform,box-shadow] duration-200 ease-out hover:scale-105 hover:shadow-[0_8px_28px_rgba(1,239,84,0.38),0_4px_14px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0)" }}
      aria-label={ariaLabel}
    >
      <span className="text-2xl leading-none">+</span>
    </button>
  );
}
