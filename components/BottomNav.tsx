"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogSheet } from "@/contexts/log-sheet";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      {active ? (
        <>
          <path
            d="M3 10.5L12 3L21 10.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z"
            fill="currentColor"
          />
          <path d="M9 21V13h6v8" fill="rgba(255,255,255,0.7)" />
        </>
      ) : (
        <>
          <path
            d="M3 10.5L12 3L21 10.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M9 21V13h6v8"
            stroke="currentColor"
            strokeWidth="1.75"
          />
        </>
      )}
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const w = active ? 2 : 1.75;
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { open } = useLogSheet();

  const feedActive = pathname === "/";
  const profileActive = pathname === "/profile";

  const linkStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    borderRadius: 9999,
    textDecoration: "none",
    color: active ? "#000" : "rgba(0,0,0,0.4)",
    WebkitTapHighlightColor: "transparent",
    position: "relative",
    // Liquid glass selected: translucent pill, top highlight, soft depth
    backgroundColor: active ? "rgba(255, 255, 255, 0.55)" : "transparent",
    backdropFilter: active ? "saturate(180%) blur(12px)" : "none",
    WebkitBackdropFilter: active ? "saturate(180%) blur(12px)" : "none",
    border: active ? "0.5px solid rgba(255, 255, 255, 0.7)" : "none",
    boxShadow: active
      ? "inset 0 1px 0 0 rgba(255, 255, 255, 0.6), 0 0 0 0.5px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.06)"
      : "none",
    transition:
      "color 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
  });

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        padding: "0 20px max(20px, env(safe-area-inset-bottom))",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <nav
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          maxWidth: 320,
          width: "100%",
          padding: "8px 10px 8px 10px",
          borderRadius: 9999,
          background: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.08), 0 12px 48px rgba(0,0,0,0.06)",
        }}
        aria-label="Main navigation"
      >
        <Link href="/" style={linkStyle(feedActive)} aria-label="Feed">
          <HomeIcon active={feedActive} />
        </Link>

        {/* Add — emphasized, center */}
        <button
          type="button"
          onClick={open}
          aria-label="Log a workout"
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            backgroundColor: "#11EB0E",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            WebkitTapHighlightColor: "transparent",
            boxShadow: "0 2px 12px rgba(17, 235, 14, 0.45), 0 4px 16px rgba(0,0,0,0.12)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          className="active:scale-95"
        >
          <svg
            width="24"
            height="24"
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

        <Link href="/profile" style={linkStyle(profileActive)} aria-label="Profile">
          <ProfileIcon active={profileActive} />
        </Link>
      </nav>
    </div>
  );
}
