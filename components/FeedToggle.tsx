"use client";

import { useState, useCallback, useEffect } from "react";

export type FeedMode = "team" | "stadium";

interface FeedToggleProps {
  value: FeedMode;
  onChange: (value: FeedMode) => void;
}

export function FeedToggle({ value, onChange }: FeedToggleProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isTeam = value === "team";

  const handleSelect = useCallback(
    (mode: FeedMode) => {
      if (mode !== value) onChange(mode);
    },
    [value, onChange]
  );

  return (
    <div
      role="tablist"
      aria-label="Feed filter"
      className="feed-toggle-track"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "stretch",
        borderRadius: 12,
        padding: 4,
        minHeight: 38,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
        border: "1px solid rgba(0,0,0,0.08)",
        background: "rgba(0,0,0,0.03)",
        isolation: "isolate",
      }}
    >
      {/* Sliding pill */}
      <div
        className="feed-toggle-pill"
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: 4,
          width: "calc(50% - 4px)",
          borderRadius: 8,
          transform: isTeam ? "translateX(0)" : "translateX(100%)",
          transition: mounted
            ? "transform 0.45s cubic-bezier(0.32, 0.72, 0, 1)"
            : "none",
          zIndex: 1,
          pointerEvents: "none",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          border: "0.5px solid rgba(255,255,255,0.7)",
          boxShadow:
            "0 0.5px 1px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)",
        }}
      />

      {/* Team tab */}
      <button
        type="button"
        role="tab"
        aria-selected={isTeam}
        onClick={() => handleSelect("team")}
        className="active:scale-[0.97]"
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px 24px",
          borderRadius: 8,
          border: "none",
          backgroundColor: "transparent",
          color: isTeam ? "var(--foreground)" : "var(--foreground-muted)",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: isTeam ? 600 : 400,
          flex: 1,
          minWidth: 72,
          WebkitTapHighlightColor: "transparent",
          transition:
            "color 0.3s cubic-bezier(0.32, 0.72, 0, 1), font-weight 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          letterSpacing: "-0.01em",
        }}
      >
        Team
      </button>

      {/* Stadium tab */}
      <button
        type="button"
        role="tab"
        aria-selected={!isTeam}
        onClick={() => handleSelect("stadium")}
        className="active:scale-[0.97]"
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px 24px",
          borderRadius: 8,
          border: "none",
          backgroundColor: "transparent",
          color: !isTeam ? "var(--foreground)" : "var(--foreground-muted)",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: !isTeam ? 600 : 400,
          flex: 1,
          minWidth: 72,
          WebkitTapHighlightColor: "transparent",
          transition:
            "color 0.3s cubic-bezier(0.32, 0.72, 0, 1), font-weight 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          letterSpacing: "-0.01em",
        }}
      >
        Stadium
      </button>
    </div>
  );
}
