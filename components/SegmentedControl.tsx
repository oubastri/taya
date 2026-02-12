"use client";

import { useState } from "react";

export type SegmentId = "mooves" | "calendar" | "manifesto";

type SegmentedControlProps = {
  value: SegmentId;
  onChange: (value: SegmentId) => void;
};

const segments: { id: SegmentId; label: string }[] = [
  { id: "mooves", label: "moves" },
  { id: "calendar", label: "calendar" },
  { id: "manifesto", label: "manifesto" },
];

/* Fluid scaling: smaller on mobile, smooth change as viewport resizes */
const defaultStyle: React.CSSProperties = {
  padding: "clamp(6px, 1.2vw + 4px, 12px) clamp(12px, 3vw + 6px, 32px)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "clamp(4px, 0.8vw + 2px, 10px)",
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: "clamp(11px, 2vw + 8px, 24px)",
  fontWeight: 400,
  lineHeight: 1.4,
  letterSpacing: "-0.04em",
  color: "#000",
  backgroundColor: "#FFF",
  border: "1.5px solid #000",
  borderRadius: "clamp(6px, 1.2vw, 12px)",
  cursor: "pointer",
  transition: "border-radius 0.3s ease, background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease",
};

const activeStyle: React.CSSProperties = {
  ...defaultStyle,
  backgroundColor: "#000",
  color: "#FFF",
  borderRadius: "clamp(16px, 6vw, 42px)",
};

const hoverStyle: React.CSSProperties = {
  ...defaultStyle,
  backgroundColor: "#11EB0E",
  color: "#000",
  borderRadius: "clamp(16px, 6vw, 42px)",
  border: "1.5px solid transparent",
};

export function SegmentedControl({ value, onChange }: SegmentedControlProps) {
  const [hovered, setHovered] = useState<SegmentId | null>(null);

  return (
    <div
      role="tablist"
      aria-label="View toggle"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "clamp(4px, 0.8vw, 8px)",
      }}
    >
      {segments.map(({ id, label }) => {
        const isActive = value === id;
        const isHover = hovered === id;
        let style = { ...defaultStyle };
        if (isActive) style = { ...activeStyle };
        else if (isHover) style = { ...hoverStyle };

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={label}
            style={style}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onChange(id)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
