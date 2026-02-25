"use client";

import { useLogSheet } from "@/contexts/log-sheet";

const FAB_SIZE = 84;

export function BottomNav() {
  const { open } = useLogSheet();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        pointerEvents: "none",
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "flex-end",
        padding: `0 16px max(16px, env(safe-area-inset-bottom))`,
      }}
    >
      <button
        type="button"
        onClick={() => open()}
        aria-label="Log a workout"
        style={{
          pointerEvents: "auto",
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: "50%",
          backgroundColor: "#01EF54",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          boxShadow: "0 4px 20px rgba(1, 239, 84, 0.4), 0 4px 16px rgba(0,0,0,0.12)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        className="active:scale-95"
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#000"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
