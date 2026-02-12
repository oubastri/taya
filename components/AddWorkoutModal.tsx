"use client";

import { useState, useRef } from "react";
import { fromDateKey } from "@/types/workout";

const MAX_LENGTH = 150;

const DATE_TITLE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-sans), sans-serif",
  color: "#000",
  fontSize: "60px",
  fontStyle: "normal",
  fontWeight: 500,
  lineHeight: "50px",
  letterSpacing: "-2.4px",
  maxWidth: 450,
};

function formatDayTitleParts(dateKey: string): { prefix: string; day: string } {
  const date = fromDateKey(dateKey);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate().toString();
  return { prefix: `${weekday} ${month} `, day };
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  dateKey: string;
  initialDescription: string;
  onSubmit: (description: string) => void;
};

export function AddWorkoutModal({
  isOpen,
  onClose,
  dateKey,
  initialDescription,
  onSubmit,
}: Props) {
  const [value, setValue] = useState(initialDescription);
  const [hoverClose, setHoverClose] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const iconButtonStyle = (hovered: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "none",
    backgroundColor: hovered ? "#11EB0E" : "#EFEFEF",
    color: "#000",
    cursor: "pointer",
    transition: "border-radius 0.3s ease, background-color 0.3s ease",
    flexShrink: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value.trim());
    onClose();
  };

  const { prefix, day } = formatDayTitleParts(dateKey);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-workout-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      <div
        className="relative flex flex-col rounded-2xl border border-black/10 bg-white p-6 animate-modal-in"
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          width: "min(92vw, 520px)",
          height: "min(88vh, 520px)",
          maxHeight: "calc(100vh - 2rem)",
        }}
      >
        {/* Same structure as DayDetailModal: top-aligned, gap-5, so date/title stay in same place */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
          {/* Icon row: sticky so it stays visible when scrolling */}
          <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between bg-white pb-2">
            <div className="min-w-[96px]" aria-hidden />
            <button
              type="button"
              onClick={onClose}
              onMouseEnter={() => setHoverClose(true)}
              onMouseLeave={() => setHoverClose(false)}
              style={iconButtonStyle(hoverClose)}
              aria-label="Close"
            >
              <XIcon />
            </button>
          </div>

          {/* Title - same position as DayDetailModal */}
          <h2 id="add-workout-title" style={DATE_TITLE_STYLE} className="shrink-0 mt-6">
            {prefix}
            <span style={{ color: "#11EB0E" }}>{day}</span>
          </h2>

          {/* Body: 48px below title, then field + 24px + CTA; spacer keeps CTA 24px from modal bottom */}
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-6 pt-12">
            <div className="relative h-[124px] shrink-0">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value.slice(0, MAX_LENGTH))}
                placeholder="What did you do?"
                maxLength={MAX_LENGTH}
                className="absolute inset-0 w-full resize-none rounded-xl border border-black/10 bg-[#FAFAFA] px-4 py-3 text-black placeholder:text-gray-400 focus:border-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-colors duration-150"
                style={{
                  fontSize: "clamp(1rem, 2vw, 1.125rem)",
                  lineHeight: 1.65,
                  letterSpacing: "-0.01em",
                }}
              />
              <span className="absolute bottom-2.5 right-3.5 text-xs text-gray-400 pointer-events-none tabular-nums">
                {value.length}/{MAX_LENGTH}
              </span>
            </div>
            <button
              type="submit"
              className="w-full shrink-0 rounded-2xl py-3.5 text-lg font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: "#000" }}
            >
              Save
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
