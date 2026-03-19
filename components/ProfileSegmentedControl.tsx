"use client";

export type ProfileSection = "calendar" | "posts";

interface ProfileSegmentedControlProps {
  value: ProfileSection;
  onChange: (value: ProfileSection) => void;
}

export function ProfileSegmentedControl({ value, onChange }: ProfileSegmentedControlProps) {
  const isCalendar = value === "calendar";

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "stretch",
        backgroundColor: "var(--chip-bg)",
        borderRadius: 9999,
        padding: 5,
        minHeight: 44,
      }}
    >
      {/* Sliding pill — full height of container, flush to track edges */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "50%",
          borderRadius: 9999,
          backgroundColor: "var(--foreground)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          transform: isCalendar ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s var(--ease-out-expo)",
          pointerEvents: "none",
        }}
      />
      <button
        type="button"
        onClick={() => onChange("calendar")}
        aria-pressed={isCalendar}
        aria-label="Calendar"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 18px",
          borderRadius: 9999,
          border: "none",
          backgroundColor: "transparent",
          color: isCalendar ? "var(--background)" : "var(--foreground)",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 15,
          fontWeight: 500,
          flex: 1,
          WebkitTapHighlightColor: "transparent",
          transition: "color 0.25s ease",
        }}
        className="active:scale-[0.98]"
      >
        Calendar
      </button>
      <button
        type="button"
        onClick={() => onChange("posts")}
        aria-pressed={!isCalendar}
        aria-label="Moves"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 18px",
          borderRadius: 9999,
          border: "none",
          backgroundColor: "transparent",
          color: !isCalendar ? "var(--background)" : "var(--foreground)",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 15,
          fontWeight: 500,
          flex: 1,
          WebkitTapHighlightColor: "transparent",
          transition: "color 0.25s ease",
        }}
        className="active:scale-[0.98]"
      >
        Moves
      </button>
    </div>
  );
}
