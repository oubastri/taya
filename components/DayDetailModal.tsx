"use client";

import { useState } from "react";
import { fromDateKey } from "@/types/workout";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  dateKey: string;
  description: string;
  onEdit: () => void;
  onDelete: () => void;
};

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

export function DayDetailModal({
  isOpen,
  onClose,
  dateKey,
  description,
  onEdit,
  onDelete,
}: Props) {
  const [hoverClose, setHoverClose] = useState(false);
  const [hoverEdit, setHoverEdit] = useState(false);
  const [hoverDelete, setHoverDelete] = useState(false);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-detail-title"
    >
      {/* Backdrop - blur + overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      {/* Modal panel - same size as AddWorkoutModal for consistent feel */}
      <div
        className="relative flex flex-col rounded-2xl border border-black/10 bg-white p-6 animate-modal-in"
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          width: "min(92vw, 520px)",
          height: "min(88vh, 520px)",
          maxHeight: "calc(100vh - 2rem)",
        }}
      >
        {/* Same structure as AddWorkoutModal: top-aligned, gap-5, so date/title stay in same place */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
          {/* Icon row: sticky so it stays visible when scrolling */}
          <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between bg-white pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onEdit}
                onMouseEnter={() => setHoverEdit(true)}
                onMouseLeave={() => setHoverEdit(false)}
                style={iconButtonStyle(hoverEdit)}
                aria-label="Edit workout"
              >
                <EditIcon />
              </button>
              <button
                type="button"
                onClick={onDelete}
                onMouseEnter={() => setHoverDelete(true)}
                onMouseLeave={() => setHoverDelete(false)}
                style={iconButtonStyle(hoverDelete)}
                aria-label="Delete workout"
              >
                <DeleteIcon />
              </button>
            </div>
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
          {/* Title - same position as AddWorkoutModal */}
          <h2
            id="day-detail-title"
            style={DATE_TITLE_STYLE}
            className="shrink-0 mt-6"
          >
            {(() => {
              const { prefix, day } = formatDayTitleParts(dateKey);
              return (
                <>
                  {prefix}
                  <span style={{ color: "#11EB0E" }}>{day}</span>
                </>
              );
            })()}
          </h2>
          <p
            className="whitespace-pre-wrap text-black min-h-0 flex-1 overflow-y-auto"
            style={{
              fontSize: "clamp(1rem, 2vw, 1.125rem)",
              lineHeight: 1.65,
              letterSpacing: "-0.01em",
            }}
          >
            {description}
          </p>
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

function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
