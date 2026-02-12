"use client";

import { useState, useRef } from "react";

const MAX_LENGTH = 150;

type Props = {
  dateKey: string;
  initialDescription: string;
  onSubmit: (description: string) => void;
  onCancel?: () => void;
};

const DATE_TITLE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-sans), sans-serif",
  color: "#000",
  fontSize: "60px",
  fontStyle: "normal",
  fontWeight: 500,
  lineHeight: "50px",
  letterSpacing: "-2.4px",
  maxWidth: 380,
};

function formatDateLabelParts(dateKey: string): { prefix: string; day: string; suffix: string } {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const prefix = date.toLocaleDateString("en-US", { weekday: "long", month: "long" });
  const suffix = date.toLocaleDateString("en-US", { year: "numeric" });
  return { prefix: prefix + " ", day: String(d), suffix: ", " + suffix };
}

export function AddWorkoutForm({
  dateKey,
  initialDescription,
  onSubmit,
  onCancel,
}: Props) {
  const [value, setValue] = useState(initialDescription);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value.trim());
    setValue("");
  };

  const { prefix, day, suffix } = formatDateLabelParts(dateKey);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-8">
      <p style={DATE_TITLE_STYLE}>
        {prefix}
        <span style={{ color: "#11EB0E" }}>{day}</span>
        {suffix}
      </p>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="Tell me about your workout?"
          maxLength={MAX_LENGTH}
          rows={4}
          className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-lg text-black placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
        <span className="absolute bottom-2 right-3 text-sm text-gray-400">
          {value.length}/{MAX_LENGTH}
        </span>
      </div>
      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border-2 border-black py-3.5 text-lg font-bold text-black"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="flex-1 rounded-xl py-3.5 text-lg font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ background: "var(--accent)" }}
        >
          Save
        </button>
      </div>
    </form>
  );
}
