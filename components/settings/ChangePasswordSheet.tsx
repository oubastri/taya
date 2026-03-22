"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/contexts/toast";
import {
  hubCard,
  labelText,
  valueInput,
  pillBtn,
  fieldErrorText,
} from "@/components/settings/settingsHubStyles";

const SPRING = "0.38s cubic-bezier(0.32, 0.72, 0, 1)";
const NAV_HEIGHT = 54;

interface ChangePasswordSheetProps {
  onClose: () => void;
}

export function ChangePasswordSheet({ onClose }: ChangePasswordSheetProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errCurrent, setErrCurrent] = useState<string | null>(null);
  const [errNext, setErrNext] = useState<string | null>(null);
  const [errConfirm, setErrConfirm] = useState<string | null>(null);
  const [errGeneral, setErrGeneral] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startY: 0, dy: 0 });

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setShowCurrent(false);
    setShowNext(false);
    setErrCurrent(null);
    setErrNext(null);
    setErrConfirm(null);
    setErrGeneral(null);
  }

  const close = useCallback(() => {
    reset();
    setOpen(false);
    setTimeout(onClose, 380);
  }, [onClose]);

  useEffect(() => {
    document.body.classList.add("search-open");
    return () => document.body.classList.remove("search-open");
  }, []);

  useEffect(() => {
    let cancelled = false;
    const outer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setOpen(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(outer);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 420);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const onHandleDown = (e: React.PointerEvent) => {
    dragRef.current = { active: true, startY: e.clientY, dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };

  const onHandleMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dy = Math.max(0, e.clientY - dragRef.current.startY);
    dragRef.current.dy = dy;
    if (sheetRef.current) sheetRef.current.style.transform = `translateX(-50%) translateY(${dy}px)`;
  };

  const onHandleUp = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const { dy } = dragRef.current;

    if (dy > 90) {
      const vh = window.innerHeight;
      if (sheetRef.current) {
        sheetRef.current.style.transition = `transform ${SPRING}`;
        sheetRef.current.style.transform = `translateX(-50%) translateY(${vh}px)`;
      }
      if (scrimRef.current) {
        scrimRef.current.style.transition = "opacity 0.38s ease";
        scrimRef.current.style.opacity = "0";
      }
      setTimeout(() => {
        reset();
        onClose();
      }, 380);
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = `transform ${SPRING}`;
        sheetRef.current.style.transform = "translateX(-50%) translateY(0)";
        setTimeout(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transition = "";
            sheetRef.current.style.transform = "";
          }
        }, 380);
      }
    }
  };

  async function submit() {
    setErrCurrent(null);
    setErrNext(null);
    setErrConfirm(null);
    setErrGeneral(null);

    if (next.length < 8) {
      setErrNext("Use at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setErrConfirm("New passwords don’t match.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const email = user?.email;
      if (!email) {
        setErrGeneral("No email on this account.");
        return;
      }

      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (signErr) {
        setErrCurrent("Current password is incorrect.");
        return;
      }

      const { error: updErr } = await supabase.auth.updateUser({ password: next });
      if (updErr) {
        setErrNext(updErr.message || "Couldn’t update password.");
        return;
      }

      toast("Password updated", "success");
      close();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Scrim — matches athletes SearchSheet */}
      <div
        ref={scrimRef}
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99,
          background: "var(--overlay)",
          opacity: open ? 1 : 0,
          transition: `opacity ${SPRING}`,
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          width: "100%",
          maxWidth: 428,
          height: "fit-content",
          maxHeight: "85svh",
          zIndex: 100,
          background: "var(--sheet-bg)",
          backdropFilter: "blur(40px) saturate(1.8)",
          WebkitBackdropFilter: "blur(40px) saturate(1.8)",
          borderRadius: "32px 32px 0 0",
          boxShadow: "var(--sheet-shadow)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "var(--font-sans), sans-serif",
          transform: open ? "translateX(-50%)" : "translateX(-50%) translateY(100%)",
          transition: `transform ${SPRING}`,
        }}
      >
        <div
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          style={{
            padding: "12px 24px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
            cursor: "grab",
            touchAction: "none",
            userSelect: "none",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "var(--drag-handle)",
            }}
          />
        </div>

        <button
          type="button"
          onClick={close}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1,
            width: NAV_HEIGHT,
            height: NAV_HEIGHT,
            borderRadius: "100px",
            background: "var(--close-btn-bg)",
            border: "1px solid var(--close-btn-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            flexShrink: 0,
          }}
          aria-label="Close"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--close-btn-icon)"
            strokeWidth="2.6"
            strokeLinecap="round"
            aria-hidden
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <div
          style={{
            padding: "16px 84px 18px 24px",
            flexShrink: 0,
          }}
        >
          <p
            style={{
              margin: 0,
              padding: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(26px, 7vw, 32px)",
              fontWeight: 500,
              letterSpacing: "-0.04em",
              color: "var(--input-color)",
            }}
          >
            Change password
          </p>
        </div>

        <div
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            touchAction: "pan-y",
            padding: "16px 24px calc(env(safe-area-inset-bottom) + 40px)",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={hubCard}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ ...labelText, margin: 0 }}>Current password</p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    minHeight: 32,
                  }}
                >
                  <input
                    ref={inputRef}
                    type={showCurrent ? "text" : "password"}
                    value={current}
                    onChange={(e) => {
                      setErrCurrent(null);
                      setErrGeneral(null);
                      setCurrent(e.target.value);
                    }}
                    autoComplete="current-password"
                    style={{ ...valueInput, flex: 1, minWidth: 0, display: "block" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                    style={{
                      flexShrink: 0,
                      border: "none",
                      background: "none",
                      padding: 6,
                      marginRight: -6,
                      cursor: "pointer",
                      color: "var(--foreground-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <EyeIcon open={showCurrent} />
                  </button>
                </div>
                {errCurrent ? (
                  <p role="alert" style={{ ...fieldErrorText, marginTop: 4 }}>
                    {errCurrent}
                  </p>
                ) : null}
              </div>
            </div>

            <div style={hubCard}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ ...labelText, margin: 0 }}>New password</p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    minHeight: 32,
                  }}
                >
                  <input
                    type={showNext ? "text" : "password"}
                    value={next}
                    onChange={(e) => {
                      setErrNext(null);
                      setErrGeneral(null);
                      setNext(e.target.value);
                    }}
                    autoComplete="new-password"
                    style={{ ...valueInput, flex: 1, minWidth: 0, display: "block" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNext((v) => !v)}
                    aria-label={showNext ? "Hide password" : "Show password"}
                    style={{
                      flexShrink: 0,
                      border: "none",
                      background: "none",
                      padding: 6,
                      marginRight: -6,
                      cursor: "pointer",
                      color: "var(--foreground-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <EyeIcon open={showNext} />
                  </button>
                </div>
                {errNext ? (
                  <p role="alert" style={{ ...fieldErrorText, marginTop: 4 }}>
                    {errNext}
                  </p>
                ) : null}
              </div>
            </div>

            <div style={hubCard}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ ...labelText, margin: 0 }}>Confirm new password</p>
                <input
                  type={showNext ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => {
                    setErrConfirm(null);
                    setErrGeneral(null);
                    setConfirm(e.target.value);
                  }}
                  autoComplete="new-password"
                  style={{ ...valueInput, display: "block", minHeight: 32 }}
                />
                {errConfirm ? (
                  <p role="alert" style={{ ...fieldErrorText, marginTop: 4 }}>
                    {errConfirm}
                  </p>
                ) : null}
              </div>
            </div>

            {errGeneral ? (
              <div style={hubCard}>
                <p role="alert" style={fieldErrorText}>
                  {errGeneral}
                </p>
              </div>
            ) : null}

            <div style={{ marginTop: 4 }}>
              <button
                type="button"
                disabled={busy || !current || !next || !confirm}
                onClick={() => submit()}
                style={{
                  ...pillBtn,
                  background: "var(--cta-bg)",
                  color: "var(--cta-color)",
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy || !current || !next || !confirm ? 0.45 : 1,
                }}
                className="active:opacity-90"
              >
                {busy ? "Updating…" : "Update password"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 3l18 18M10.5 10.5a3 3 0 004 4M9.9 4.24A9 9 0 0112 3c7 0 11 8 11 8a18 18 0 01-4.12 5.18M6.2 6.2A9 9 0 003 11c0 0 4 8 11 8 1.06 0 2.07-.18 3-.5M2 2l20 20"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}
