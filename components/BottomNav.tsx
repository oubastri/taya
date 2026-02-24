"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogSheet } from "@/contexts/log-sheet";

function FeedIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" aria-hidden>
      <path d="M8.5 10L13.6343 7.97846" strokeLinecap="butt" />
      <path d="M15.5 2L13.6266 8.00743L14.9792 14.5505L14.9587 14.4514" />
      <path d="M11.0523 15.8995L11.0962 16.001L8.5 10L3 10" />
      <path d="M17 18C15.9331 17.7141 14.8364 18.3473 14.5505 19.4142C14.2647 20.4811 14.8978 21.5778 15.9648 21.8637C17.0317 22.1496 18.1284 21.5164 18.4142 20.4495C18.7001 19.3826 18.067 18.2859 17 18Z" />
      <path d="M21 12.5L11 16L11 22" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" aria-hidden>
      <circle cx="12" cy="3" r="2" />
      <path d="M5,15l1.586-5.549c.245-.859,1.03-1.451,1.923-1.451h6.983c.893,0,1.678,.592,1.923,1.451l1.586,5.549" />
      <line x1="15" y1="23" x2="15" y2="12" />
      <line x1="9" y1="17" x2="15" y2="17" />
      <line x1="9" y1="12" x2="9" y2="23" />
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
          <FeedIcon />
        </Link>

        {/* Add — emphasized, center */}
        <button
          type="button"
          onClick={() => open()}
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
          <ProfileIcon />
        </Link>
      </nav>
    </div>
  );
}
