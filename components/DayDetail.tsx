"use client";

type Props = {
  dateKey: string;
  description: string | undefined;
  onEdit: () => void;
  onBack?: () => void;
};

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function DayDetail({ dateKey, description, onEdit, onBack }: Props) {
  const label = formatDateLabel(dateKey);
  return (
    <div className="flex flex-col gap-6 pt-8">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 self-start text-base font-medium text-gray-500 hover:text-black"
        >
          ← Back to calendar
        </button>
      )}
      <p className="text-xl font-bold text-black">{label}</p>
      {description ? (
        <p className="whitespace-pre-wrap text-lg text-black">{description}</p>
      ) : (
        <p className="text-lg text-gray-500">No workout logged for this day.</p>
      )}
      <button
        type="button"
        onClick={onEdit}
        className="w-full rounded-xl border-2 border-black bg-transparent py-3.5 text-lg font-bold text-black"
      >
        Edit
      </button>
    </div>
  );
}
