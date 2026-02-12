"use client";

type View = "stats" | "calendar";

type Props = {
  value: View;
  onChange: (v: View) => void;
};

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-6">
      <button
        type="button"
        onClick={() => onChange("stats")}
        className={`flex items-center gap-2 text-xl font-normal transition-colors ${
          value === "stats" ? "text-black" : "text-gray-400"
        }`}
        aria-label="Moves view"
      >
        {value === "stats" && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-black" aria-hidden />
        )}
        moves
      </button>
      <button
        type="button"
        onClick={() => onChange("calendar")}
        className={`flex items-center gap-2 text-xl font-normal transition-colors ${
          value === "calendar" ? "text-black" : "text-gray-400"
        }`}
        aria-label="Calendar view"
      >
        {value === "calendar" && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-black" aria-hidden />
        )}
        calendar
      </button>
    </div>
  );
}
