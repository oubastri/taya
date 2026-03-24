"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { getAdapter, isRealMode } from "@/lib/data-adapter";
import { useLogSheet } from "@/contexts/log-sheet";

const isMockMode = !isRealMode;

/** Clears bottom nav; FAB sits above it */
const DEV_FAB_BOTTOM_PX = 100;
const DEV_FAB_SIZE_PX = 48;
/** Space between dev panel bottom edge and top of round FAB */
const DEV_PANEL_GAP_PX = 14;
const DEV_PANEL_BOTTOM_PX = DEV_FAB_BOTTOM_PX + DEV_FAB_SIZE_PX + DEV_PANEL_GAP_PX;

function showDevChrome(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  return process.env.NEXT_PUBLIC_DEV_MENU === "1";
}

/** Terminal palette — fixed dark “native shell” look in light and dark app themes */
const T = {
  bg: "#0a0b0d",
  bgLine: "#12141a",
  border: "rgba(1, 239, 84, 0.45)",
  borderDim: "rgba(1, 239, 84, 0.2)",
  text: "#b5bdc6",
  dim: "#6e7681",
  accent: "#01ef54",
  accentMuted: "rgba(1, 239, 84, 0.85)",
  prompt: "#79c0ff",
  err: "#ff7b72",
  mono: 'var(--font-mono), ui-monospace, "Cascadia Code", "SF Mono", Menlo, monospace',
} as const;

const NAV_LINKS: { cmd: string; href: string }[] = [
  { cmd: "/", href: "/" },
  { cmd: "/login", href: "/login" },
  { cmd: "/signup", href: "/signup" },
  { cmd: "/forgot-password", href: "/forgot-password" },
  { cmd: "/onboarding", href: "/onboarding" },
  { cmd: "/athletes", href: "/athletes" },
  { cmd: "/profile", href: "/profile" },
  { cmd: "/settings", href: "/settings" },
  { cmd: "/privacy", href: "/privacy" },
  { cmd: "/terms", href: "/terms" },
];

const MOCK_PROFILE_SAMPLE_ID = "jordan";

function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DevPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profileIdInput, setProfileIdInput] = useState("");
  const { open: openLogSheet } = useLogSheet();

  const visible = showDevChrome();
  const modeEnv = isRealMode ? "real" : "mock";

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const runSheet = useCallback(
    (fn: () => void) => {
      setOpen(false);
      fn();
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!visible) return null;

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

  function openProfileById() {
    const id = profileIdInput.trim();
    if (!id) return;
    go(`/profile/${encodeURIComponent(id)}`);
  }

  const btnBase: CSSProperties = {
    width: "100%",
    padding: "6px 10px",
    borderRadius: 2,
    border: `1px solid ${T.borderDim}`,
    background: T.bgLine,
    color: T.accentMuted,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: T.mono,
    cursor: "pointer",
    textAlign: "left",
    WebkitTapHighlightColor: "transparent",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close dev console" : "Open dev console"}
        aria-expanded={open}
        style={{
          position: "fixed",
          bottom: DEV_FAB_BOTTOM_PX,
          right: 16,
          zIndex: 10001,
          width: DEV_FAB_SIZE_PX,
          height: DEV_FAB_SIZE_PX,
          borderRadius: "50%",
          border: `2px solid ${T.accent}`,
          background: T.bg,
          boxShadow: `0 0 0 1px rgba(0,0,0,0.5), 0 4px 20px rgba(1, 239, 84, 0.15)`,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 0,
          overflow: "hidden",
          padding: 0,
        }}
      >
        <Image
          src="/icons/dev-app-stack.svg"
          alt=""
          width={26}
          height={26}
          style={{ display: "block", opacity: open ? 0.92 : 1 }}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Developer console"
          aria-modal="false"
          className="dev-console-panel"
          style={{
            position: "fixed",
            bottom: DEV_PANEL_BOTTOM_PX,
            right: 16,
            zIndex: 10000,
            backgroundColor: T.bg,
            borderRadius: 4,
            border: `1px solid ${T.border}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.55), 0 0 1px rgba(1,239,84,0.3)",
            padding: "10px 12px 10px",
            width: "min(340px, calc(100vw - 28px))",
            maxHeight: `min(calc(100dvh - ${DEV_PANEL_BOTTOM_PX + 24}px), 560px)`,
            overflowY: "auto",
            fontFamily: T.mono,
            fontSize: 11,
            lineHeight: 1.45,
            color: T.text,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: `1px solid ${T.borderDim}`,
              userSelect: "none",
            }}
          >
            <div style={{ color: T.dim, minWidth: 0 }}>
              <span style={{ color: T.prompt }}>taya</span>
              <span style={{ color: T.dim }}>@</span>
              <span style={{ color: T.accentMuted }}>dev</span>
              <span style={{ color: T.dim }}>:~$ </span>
              <span style={{ color: T.text }}>console</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Dismiss dev console"
              style={{
                flexShrink: 0,
                padding: "4px 10px",
                borderRadius: 2,
                border: `1px solid ${T.borderDim}`,
                background: T.bgLine,
                color: T.accentMuted,
                fontSize: 10,
                fontWeight: 700,
                fontFamily: T.mono,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              dismiss
            </button>
          </div>

          <pre
            style={{
              margin: "0 0 10px",
              padding: "8px 10px",
              background: T.bgLine,
              border: `1px solid ${T.borderDim}`,
              borderRadius: 2,
              color: T.dim,
              fontFamily: T.mono,
              fontSize: 10,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            <span style={{ color: T.accentMuted }}>NEXT_PUBLIC_DATA_MODE</span>=
            <span style={{ color: T.text }}>{modeEnv}</span>
            {"\n"}
            <span style={{ color: T.dim }}>
              # switch: .env.local → restart npm run dev
            </span>
          </pre>

          <div style={{ color: T.dim, margin: "10px 0 4px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            # sheets
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
            <button
              type="button"
              style={btnBase}
              onClick={() => runSheet(() => openLogSheet())}
            >
              open LogSheet <span style={{ color: T.dim }}>— new move</span>
            </button>
            <button
              type="button"
              style={btnBase}
              onClick={() => runSheet(() => openLogSheet(todayDateKey()))}
            >
              open LogSheet <span style={{ color: T.dim }}>— date {todayDateKey()}</span>
            </button>
            <button
              type="button"
              style={btnBase}
              onClick={() => go("/athletes?sheet=search")}
            >
              open SearchSheet <span style={{ color: T.dim }}>— /athletes?sheet=search</span>
            </button>
          </div>

          <div style={{ color: T.dim, margin: "10px 0 4px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            # routes
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
            {NAV_LINKS.map(({ cmd, href }) => (
              <button key={href} type="button" onClick={() => go(href)} style={btnBase}>
                cd <span style={{ color: T.prompt }}>{cmd}</span>
              </button>
            ))}
            {isMockMode ? (
              <button
                type="button"
                onClick={() => go(`/profile/${MOCK_PROFILE_SAMPLE_ID}`)}
                style={btnBase}
              >
                cd <span style={{ color: T.prompt }}>/profile/{MOCK_PROFILE_SAMPLE_ID}</span>
                <span style={{ color: T.dim }}> # seed</span>
              </button>
            ) : null}
          </div>

          <div style={{ color: T.dim, margin: "10px 0 4px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            # profile by id
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <input
              value={profileIdInput}
              onChange={(e) => setProfileIdInput(e.target.value)}
              placeholder={isMockMode ? "jordan" : "uuid"}
              style={{
                flex: 1,
                minWidth: 0,
                padding: "6px 8px",
                borderRadius: 2,
                border: `1px solid ${T.borderDim}`,
                background: T.bgLine,
                color: T.text,
                fontSize: 11,
                fontFamily: T.mono,
              }}
            />
            <button
              type="button"
              onClick={openProfileById}
              style={{
                ...btnBase,
                width: "auto",
                flexShrink: 0,
                borderColor: T.border,
                color: T.accent,
              }}
            >
              go
            </button>
          </div>

          {isMockMode ? (
            <>
              <div style={{ color: T.dim, margin: "10px 0 4px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                # mock fs
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                <button type="button" style={btnBase} onClick={loadSampleData}>
                  ./seed.sh <span style={{ color: T.dim }}>— load sample</span>
                </button>
                <button type="button" style={btnBase} onClick={startEmpty}>
                  rm -rf <span style={{ color: T.err }}>./data</span>
                  <span style={{ color: T.dim }}> — empty FTUX</span>
                </button>
              </div>
              <div style={{ color: T.dim, fontSize: 10 }}>reloads page · real mode uses Supabase</div>
            </>
          ) : null}

          <div style={{ marginTop: 12, paddingTop: 8, borderTop: `1px solid ${T.borderDim}`, color: T.dim, fontSize: 10 }}>
            esc close ·{" "}
            <button type="button" onClick={() => go("/privacy")} style={termLinkBtn}>
              privacy
            </button>{" "}
            ·{" "}
            <button type="button" onClick={() => go("/terms")} style={termLinkBtn}>
              terms
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const termLinkBtn: CSSProperties = {
  padding: 0,
  border: "none",
  background: "none",
  font: "inherit",
  fontSize: "inherit",
  color: T.accentMuted,
  textDecoration: "underline",
  cursor: "pointer",
};
