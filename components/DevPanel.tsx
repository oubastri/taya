"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAdapter, isRealMode } from "@/lib/data-adapter";
import { useLogSheet } from "@/contexts/log-sheet";
import {
  getDevThemeMode,
  setDevThemeOverride,
  type DevThemeMode,
} from "@/lib/app-theme";
import { CustomCursor } from "@/components/CustomCursor";

const isMockMode = !isRealMode;

const DEV_CUSTOM_CURSOR_STORAGE = "taya-dev-custom-cursor";

/** Invisible hit strip at the viewport’s right edge (pointer / coarse touch). */
const EDGE_HIT_PX = 12;
const EDGE_HIT_PX_COARSE = 22;
/** Panel stacks above bottom nav + safe area */
const PANEL_BOTTOM_INSET = "max(12px, calc(env(safe-area-inset-bottom, 0px) + 76px))";
const PANEL_TOP_INSET = "max(10px, env(safe-area-inset-top, 0px))";

const TRANSFORM_OPEN = "translateX(0)";
const TRANSFORM_HIDDEN = "translateX(calc(100% + 16px))";

function showDevChrome(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  return process.env.NEXT_PUBLIC_DEV_MENU === "1";
}

/** Lexend Deca is applied app-wide via `layout.tsx` (`--font-sans`); keep name in stack for clarity. */
const fontSans = '"Lexend Deca", var(--font-sans), system-ui, sans-serif';
const fontMono = 'var(--font-mono), ui-monospace, monospace';

const type = {
  title: { fontSize: 15, fontWeight: 600 as const, letterSpacing: "-0.03em" },
  action: { fontSize: 14, fontWeight: 600 as const, letterSpacing: "-0.02em" },
  row: { fontSize: 13, fontWeight: 500 as const, letterSpacing: "-0.02em" },
  rowMeta: { fontSize: 11, fontWeight: 500 as const, letterSpacing: "-0.01em" },
  section: { fontSize: 11, fontWeight: 600 as const, letterSpacing: "0.04em" },
  foot: { fontSize: 11, fontWeight: 400 as const, letterSpacing: "-0.01em", lineHeight: 1.35 as const },
  segment: { fontSize: 12, fontWeight: 500 as const, letterSpacing: "-0.02em" },
  segmentActive: { fontSize: 12, fontWeight: 600 as const, letterSpacing: "-0.02em" },
  code: { fontSize: 12, fontWeight: 400 as const },
  codeSm: { fontSize: 11, fontWeight: 500 as const },
} as const;

const NAV_LINKS: { href: string }[] = [
  { href: "/" },
  { href: "/login" },
  { href: "/signup" },
  { href: "/forgot-password" },
  { href: "/onboarding" },
  { href: "/athletes" },
  { href: "/profile" },
  { href: "/settings" },
  { href: "/privacy" },
  { href: "/terms" },
];

const MOCK_PROFILE_SAMPLE_ID = "jordan";

function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function DevSection({
  title,
  footer,
  children,
}: {
  title: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section style={{ marginBottom: 16 }}>
      <h2
        style={{
          margin: "0 0 6px 1px",
          padding: 0,
          fontFamily: fontSans,
          fontSize: type.section.fontSize,
          fontWeight: type.section.fontWeight,
          letterSpacing: type.section.letterSpacing,
          textTransform: "uppercase",
          color: "var(--foreground-subtle)",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)",
          background: "var(--surface-elevated)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      {footer ? (
        <p
          style={{
            margin: "6px 0 0 1px",
            padding: 0,
            fontFamily: fontSans,
            fontSize: type.foot.fontSize,
            fontWeight: type.foot.fontWeight,
            letterSpacing: type.foot.letterSpacing,
            lineHeight: type.foot.lineHeight,
            color: "var(--foreground-faint)",
          }}
        >
          {footer}
        </p>
      ) : null}
    </section>
  );
}

function rowButtonBase(isLast: boolean): CSSProperties {
  return {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 12px",
    minHeight: 40,
    margin: 0,
    border: "none",
    borderBottom: isLast ? undefined : "1px solid var(--row-border)",
    borderRadius: 0,
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: fontSans,
    WebkitTapHighlightColor: "transparent",
  };
}

function DevRow({
  label,
  detail,
  onClick,
  danger,
  isLast,
  mono,
}: {
  label: string;
  detail?: string;
  onClick: () => void;
  danger?: boolean;
  isLast: boolean;
  mono?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} style={rowButtonBase(isLast)}>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: detail ? 3 : 0,
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: mono ? fontMono : fontSans,
            fontSize: mono ? type.code.fontSize : type.row.fontSize,
            fontWeight: mono ? 500 : type.row.fontWeight,
            letterSpacing: mono ? 0 : type.row.letterSpacing,
            lineHeight: 1.25,
            color: danger ? "var(--settings-logout-text)" : "var(--foreground)",
            wordBreak: mono ? "break-all" : undefined,
          }}
        >
          {label}
        </span>
        {detail ? (
          <span
            style={{
              fontFamily: fontSans,
              fontSize: type.rowMeta.fontSize,
              fontWeight: type.rowMeta.fontWeight,
              letterSpacing: type.rowMeta.letterSpacing,
              lineHeight: 1.3,
              color: "var(--foreground-muted)",
            }}
          >
            {detail}
          </span>
        ) : null}
      </span>
      <span
        style={{
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 400,
          color: "var(--foreground-faint)",
          lineHeight: 1,
          paddingLeft: 2,
        }}
      >
        ›
      </span>
    </button>
  );
}

function DevSegmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: "flex",
        padding: 3,
        gap: 2,
        background: "var(--chip-bg)",
      }}
    >
      {options.map((opt) => {
        const selected = value === opt.id;
        const t = selected ? type.segmentActive : type.segment;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.id)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "7px 5px",
              border: "none",
              borderRadius: 7,
              fontFamily: fontSans,
              fontSize: t.fontSize,
              fontWeight: t.fontWeight,
              letterSpacing: t.letterSpacing,
              color: selected ? "var(--foreground)" : "var(--foreground-muted)",
              background: selected ? "var(--surface-elevated)" : "transparent",
              boxShadow: selected ? "0 1px 2px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06)" : "none",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function DevPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profileIdInput, setProfileIdInput] = useState("");
  const [devThemeMode, setDevThemeMode] = useState<DevThemeMode>("system");
  const [devCustomCursor, setDevCustomCursor] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const { open: openLogSheet } = useLogSheet();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = showDevChrome();
  const modeEnv = isRealMode ? "real" : "mock";
  const edgeWidthPx = coarsePointer ? EDGE_HIT_PX_COARSE : EDGE_HIT_PX;

  const cancelCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClosePanel = useCallback(() => {
    cancelCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 420);
  }, [cancelCloseTimer]);

  const revealPanel = useCallback(() => {
    cancelCloseTimer();
    setOpen(true);
  }, [cancelCloseTimer]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const runSheet = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarsePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => () => cancelCloseTimer(), [cancelCloseTimer]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (open) {
          cancelCloseTimer();
          setOpen(false);
        }
        return;
      }
      if (e.altKey && e.shiftKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        cancelCloseTimer();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, visible, cancelCloseTimer]);

  useEffect(() => {
    cancelCloseTimer();
    setOpen(false);
  }, [pathname, cancelCloseTimer]);

  useEffect(() => {
    if (!open || !visible) return;
    setDevThemeMode(getDevThemeMode());
  }, [open, visible]);

  useEffect(() => {
    try {
      setDevCustomCursor(localStorage.getItem(DEV_CUSTOM_CURSOR_STORAGE) === "1");
    } catch {
      setDevCustomCursor(false);
    }
  }, []);

  const setDevCustomCursorPersist = useCallback((next: boolean) => {
    setDevCustomCursor(next);
    try {
      localStorage.setItem(DEV_CUSTOM_CURSOR_STORAGE, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

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

  const mockRows = isMockMode ? (
    <>
      <DevRow label="Load sample data" detail="Seeds & reload" onClick={loadSampleData} isLast={false} />
      <DevRow label="Reset mock storage" detail="Clear & reload" onClick={startEmpty} danger isLast />
    </>
  ) : null;

  return (
    <>
      {/* Invisible “magnetic” zone: hover or touch the right screen edge to open. */}
      <div
        aria-hidden
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse" || e.pointerType === "pen") revealPanel();
        }}
        onClick={() => {
          if (!open) revealPanel();
        }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: edgeWidthPx,
          zIndex: 10001,
          pointerEvents: open ? "none" : "auto",
          touchAction: "manipulation",
        }}
      />

      <div
        role="dialog"
        aria-label="Developer menu"
        aria-modal="false"
        aria-hidden={!open}
        className="dev-panel"
        onPointerEnter={cancelCloseTimer}
        onPointerLeave={(e) => {
          if (e.pointerType === "touch") return;
          scheduleClosePanel();
        }}
        style={{
          position: "fixed",
          top: PANEL_TOP_INSET,
          bottom: PANEL_BOTTOM_INSET,
          right: 0,
          zIndex: 10002,
          width: "min(348px, calc(100vw - 20px))",
          maxWidth: "100vw",
          backgroundColor: "var(--sheet-bg)",
          borderTopLeftRadius: "var(--radius-lg)",
          borderBottomLeftRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          borderRight: "none",
          boxShadow: "var(--shadow-card-hover)",
          padding: "14px 14px 12px",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          color: "var(--foreground)",
          transform: open ? TRANSFORM_OPEN : TRANSFORM_HIDDEN,
          transition: "transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
          pointerEvents: open ? "auto" : "none",
          willChange: "transform",
        }}
      >
          <header
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: "1px solid var(--separator)",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: fontSans,
                  fontSize: type.title.fontSize,
                  fontWeight: type.title.fontWeight,
                  letterSpacing: type.title.letterSpacing,
                  lineHeight: 1.2,
                  color: "var(--foreground)",
                }}
              >
                Developer
              </h1>
              <p
                style={{
                  margin: "3px 0 0",
                  padding: 0,
                  fontFamily: fontSans,
                  fontSize: type.foot.fontSize,
                  fontWeight: type.foot.fontWeight,
                  letterSpacing: type.foot.letterSpacing,
                  lineHeight: type.foot.lineHeight,
                  color: "var(--foreground-faint)",
                }}
              >
                Local tools · not shipped to users
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                cancelCloseTimer();
                setOpen(false);
              }}
              aria-label="Done"
              style={{
                margin: 0,
                padding: "4px 2px",
                border: "none",
                borderRadius: 8,
                background: "transparent",
                fontFamily: fontSans,
                fontSize: type.action.fontSize,
                fontWeight: type.action.fontWeight,
                letterSpacing: type.action.letterSpacing,
                color: "var(--accent)",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                flexShrink: 0,
              }}
            >
              Done
            </button>
          </header>

          <DevSection
            title="Environment"
            footer="Change NEXT_PUBLIC_DATA_MODE in .env.local, then restart the dev server."
          >
            <div style={{ ...rowButtonBase(true), cursor: "default", pointerEvents: "none" }}>
              <span
                style={{
                  fontFamily: fontSans,
                  fontSize: type.row.fontSize,
                  fontWeight: type.row.fontWeight,
                  letterSpacing: type.row.letterSpacing,
                  color: "var(--foreground)",
                }}
              >
                Data mode
              </span>
              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: type.codeSm.fontSize,
                  fontWeight: type.codeSm.fontWeight,
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: "var(--chip-bg)",
                  color: "var(--foreground)",
                  letterSpacing: "0.02em",
                }}
              >
                {modeEnv}
              </span>
            </div>
          </DevSection>

          <DevSection
            title="Theme override"
            footer="Uses device light/dark unless you pick a fixed mode for QA."
          >
            <DevSegmented
              ariaLabel="Theme override"
              options={[
                { id: "system", label: "System" },
                { id: "light", label: "Light" },
                { id: "dark", label: "Dark" },
              ]}
              value={devThemeMode}
              onChange={(mode) => {
                setDevThemeMode(mode);
                setDevThemeOverride(mode);
              }}
            />
          </DevSection>

          <DevSection title="Cursor" footer="Custom pointer is for local preview only.">
            <DevSegmented
              ariaLabel="Cursor style"
              options={[
                { id: "off", label: "System" },
                { id: "on", label: "Custom" },
              ]}
              value={devCustomCursor ? "on" : "off"}
              onChange={(id) => setDevCustomCursorPersist(id === "on")}
            />
          </DevSection>

          <DevSection title="Sheets">
            <DevRow
              label="Log workout"
              detail="New move"
              onClick={() => runSheet(() => openLogSheet())}
              isLast={false}
            />
            <DevRow
              label="Log workout"
              detail={todayDateKey()}
              onClick={() => runSheet(() => openLogSheet(todayDateKey()))}
              isLast={false}
            />
            <DevRow
              label="Athlete search"
              detail="sheet=search"
              onClick={() => go("/athletes?sheet=search")}
              isLast
            />
          </DevSection>

          <DevSection title="Routes">
            <div
              style={{
                maxHeight: 176,
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {NAV_LINKS.map(({ href }, i) => (
                <DevRow
                  key={href}
                  label={href}
                  onClick={() => go(href)}
                  isLast={i === NAV_LINKS.length - 1 && !isMockMode}
                  mono
                />
              ))}
              {isMockMode ? (
                <DevRow
                  label={`/profile/${MOCK_PROFILE_SAMPLE_ID}`}
                  detail="seed profile"
                  onClick={() => go(`/profile/${MOCK_PROFILE_SAMPLE_ID}`)}
                  isLast
                  mono
                />
              ) : null}
            </div>
          </DevSection>

          <DevSection
            title="Profile"
            footer="Opens /profile/{id}. In mock mode try the sample id."
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "10px 12px",
              }}
            >
              <label
                htmlFor="dev-panel-profile-id"
                style={{
                  fontFamily: fontSans,
                  fontSize: type.rowMeta.fontSize,
                  fontWeight: 600,
                  letterSpacing: type.rowMeta.letterSpacing,
                  color: "var(--foreground-muted)",
                }}
              >
                User id
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  value={profileIdInput}
                  onChange={(e) => setProfileIdInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openProfileById();
                  }}
                  placeholder={isMockMode ? "jordan" : "…"}
                  aria-label="Profile user id"
                  id="dev-panel-profile-id"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--border-strong)",
                    background: "var(--surface)",
                    color: "var(--input-color)",
                    fontSize: type.code.fontSize,
                    fontFamily: fontMono,
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={openProfileById}
                  style={{
                    flexShrink: 0,
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: "var(--cta-bg)",
                    color: "var(--cta-color)",
                    fontFamily: fontSans,
                    fontSize: type.row.fontSize,
                    fontWeight: 600,
                    letterSpacing: type.row.letterSpacing,
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  Go
                </button>
              </div>
            </div>
          </DevSection>

          {isMockMode ? (
            <DevSection title="Mock data" footer="Supabase is used when data mode is real.">
              {mockRows}
            </DevSection>
          ) : null}

          <p
            style={{
              margin: "4px 1px 0",
              paddingTop: 10,
              borderTop: "1px solid var(--separator)",
              fontFamily: fontSans,
              fontSize: type.foot.fontSize,
              fontWeight: type.foot.fontWeight,
              letterSpacing: type.foot.letterSpacing,
              lineHeight: type.foot.lineHeight,
              color: "var(--foreground-faint)",
            }}
          >
            Esc to dismiss · Alt+Shift+D · hover or tap the right screen edge
          </p>
        </div>

      {devCustomCursor ? <CustomCursor /> : null}
    </>
  );
}
