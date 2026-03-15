"use client";

import { useState } from "react";
import { getAdapter } from "@/lib/data-adapter";

// Only rendered in mock mode — a floating pill at the bottom of the screen
// that lets you toggle between "sample data" and "empty/FTUX" without redeploying.

const isMockMode = process.env.NEXT_PUBLIC_DATA_MODE !== "real";

export function DevPanel() {
  const [open, setOpen] = useState(false);

  if (!isMockMode) return null;

  function loadSampleData() {
    const adapter = getAdapter();
    adapter.setSeedEnabled(true);
    window.location.reload();
  }

  function startEmpty() {
    const adapter = getAdapter();
    adapter.setSeedEnabled(false);
    adapter.clearAll();
    window.location.reload();
  }

  return (
    <>
      {/* Floating trigger pill */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: 100,
          right: 16,
          zIndex: 9999,
          padding: "6px 14px",
          borderRadius: 9999,
          border: "1.5px solid var(--border-strong)",
          backgroundColor: "var(--surface)",
          boxShadow: "var(--shadow-card)",
          fontSize: 11,
          fontWeight: 800,
          fontFamily: "inherit",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--foreground-subtle)",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
        aria-label="Open dev panel"
      >
        DEV
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 142,
            right: 16,
            zIndex: 9999,
            backgroundColor: "var(--surface)",
            borderRadius: "var(--radius-lg)",
            border: "1.5px solid var(--border-strong)",
            boxShadow: "var(--shadow-card-hover)",
            padding: "16px",
            width: 230,
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--foreground-subtle)",
            }}
          >
            Mock data
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              onClick={loadSampleData}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                backgroundColor: "var(--accent)",
                color: "var(--foreground)",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
                textAlign: "left",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Load sample data
            </button>

            <button
              type="button"
              onClick={startEmpty}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                border: "1.5px solid var(--border-strong)",
                backgroundColor: "transparent",
                color: "var(--foreground)",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
                textAlign: "left",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Start empty (FTUX)
            </button>
          </div>

          <p
            style={{
              margin: "12px 0 0",
              fontSize: 11,
              color: "var(--foreground-faint)",
              lineHeight: 1.5,
            }}
          >
            Reloads the page after switching. Only visible in mock mode.
          </p>
        </div>
      )}
    </>
  );
}
