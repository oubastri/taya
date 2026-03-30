"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/use-theme";
import { createClient } from "@/lib/supabase/client";
import { isRealMode, clearAuthCache } from "@/lib/data-adapter";
import { getFeedbackMailto } from "@/lib/feedback";
import { SHEET_EXIT_MS, SHEET_SPRING } from "@/lib/sheetMotion";

const MOBILE_MENU_MQ = "(max-width: 599px)";

function isMobileMenuViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_MENU_MQ).matches;
}

/** Match assets in `public/icons/settings/` */
const ICON = {
  editProfile: "/icons/settings/edit-profile.svg",
  /** Shown when the app is in light mode (pick dark). */
  lightMode: "/icons/settings/light-mode.svg",
  /** Shown when the app is already in dark mode (pick light). */
  darkMode: "/icons/settings/dark-mode.svg",
  feedback: "/icons/settings/feedback.svg",
  logout: "/icons/settings/logout.svg",
} as const;

const TRIGGER_GLASS_BASE: CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: "100px",
  backdropFilter: "blur(24px) saturate(1.8)",
  WebkitBackdropFilter: "blur(24px) saturate(1.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  padding: 0,
  flexShrink: 0,
};

type AccountMenuProps = {
  /** Optional style override; merged with glass circle defaults (e.g. Feed header). */
  triggerStyle?: CSSProperties;
};

export function AccountMenu({ triggerStyle }: AccountMenuProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLButtonElement>(null);
  const sheetDragRef = useRef({ active: false, startY: 0, dy: 0 });
  const sheetClosingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [sheetAnimOpen, setSheetAnimOpen] = useState(false);
  const [mobileSheet, setMobileSheet] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_MENU_MQ).matches,
  );
  const [popover, setPopover] = useState<{
    top: number;
    right: number;
    minWidth: number;
  } | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(MOBILE_MENU_MQ);
    const sync = () => setMobileSheet(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const updatePopoverPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPopover({
      top: r.bottom + 10,
      right: Math.max(12, window.innerWidth - r.right),
      minWidth: Math.min(272, window.innerWidth - 24),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    if (mobileSheet) return;
    updatePopoverPosition();
    const onWin = () => updatePopoverPosition();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open, mobileSheet, updatePopoverPosition]);

  useEffect(() => {
    if (!open || !mobileSheet) {
      setSheetAnimOpen(false);
      sheetClosingRef.current = false;
      return;
    }
    setSheetAnimOpen(false);
    let cancelled = false;
    const outer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setSheetAnimOpen(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(outer);
    };
  }, [open, mobileSheet]);

  const close = useCallback(() => {
    if (isMobileMenuViewport() && open) {
      if (sheetClosingRef.current) return;
      sheetClosingRef.current = true;
      setSheetAnimOpen(false);
      window.setTimeout(() => {
        setOpen(false);
        sheetClosingRef.current = false;
      }, SHEET_EXIT_MS);
      return;
    }
    setOpen(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open || !mobileSheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, mobileSheet]);

  const go = useCallback(
    (href: string) => {
      const mobile = isMobileMenuViewport();
      close();
      window.setTimeout(() => router.push(href), mobile ? SHEET_EXIT_MS : 0);
    },
    [close, router],
  );

  const onFeedback = useCallback(() => {
    const mail = getFeedbackMailto();
    const mobile = isMobileMenuViewport();
    close();
    window.setTimeout(() => {
      window.location.href = mail;
    }, mobile ? SHEET_EXIT_MS : 0);
  }, [close]);

  const onSheetHandleDown = useCallback((e: React.PointerEvent) => {
    sheetDragRef.current = { active: true, startY: e.clientY, dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  }, []);

  const onSheetHandleMove = useCallback((e: React.PointerEvent) => {
    if (!sheetDragRef.current.active) return;
    const dy = Math.max(0, e.clientY - sheetDragRef.current.startY);
    sheetDragRef.current.dy = dy;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
    }
  }, []);

  const onSheetHandleUp = useCallback(() => {
    if (!sheetDragRef.current.active) return;
    sheetDragRef.current.active = false;
    const { dy } = sheetDragRef.current;

    if (dy > 90) {
      const vh = window.innerHeight;
      if (sheetRef.current) {
        sheetRef.current.style.transition = `transform ${SHEET_SPRING}`;
        sheetRef.current.style.transform = `translateY(${vh}px)`;
      }
      if (scrimRef.current) {
        scrimRef.current.style.transition = `opacity ${SHEET_SPRING}`;
        scrimRef.current.style.opacity = "0";
      }
      sheetClosingRef.current = true;
      window.setTimeout(() => {
        setOpen(false);
        sheetClosingRef.current = false;
        if (sheetRef.current) {
          sheetRef.current.style.transition = "";
          sheetRef.current.style.transform = "";
        }
        if (scrimRef.current) {
          scrimRef.current.style.transition = "";
          scrimRef.current.style.opacity = "";
        }
      }, SHEET_EXIT_MS);
    } else if (sheetRef.current) {
      sheetRef.current.style.willChange = "transform";
      sheetRef.current.style.transition = `transform ${SHEET_SPRING}`;
      sheetRef.current.style.transform = "translateY(0)";
      window.setTimeout(() => {
        if (sheetRef.current) {
          sheetRef.current.style.transition = "";
          sheetRef.current.style.transform = "";
          sheetRef.current.style.willChange = "";
        }
      }, SHEET_EXIT_MS);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      if (isRealMode) {
        const supabase = createClient();
        await supabase.auth.signOut();
        clearAuthCache();
      }
      const mobile = isMobileMenuViewport();
      close();
      window.setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, mobile ? SHEET_EXIT_MS : 0);
    } finally {
      setSigningOut(false);
    }
  }, [close, router]);

  const triggerMerged: CSSProperties = { ...TRIGGER_GLASS_BASE, ...triggerStyle };

  const panelContent = (
    <>
      <button
        type="button"
        role="menuitem"
        className="account-menu__row"
        onClick={() => go("/settings")}
      >
        <span className="account-menu__row-icon" aria-hidden>
          <img src={ICON.editProfile} alt="" width={20} height={20} className="account-menu__icon-img" />
        </span>
        <span className="account-menu__row-label">Edit profile</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className="account-menu__row account-menu__row--switch"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onClick={() => toggleTheme()}
      >
        <span className="account-menu__row-icon" aria-hidden>
          <img
            src={theme === "dark" ? ICON.darkMode : ICON.lightMode}
            alt=""
            width={20}
            height={20}
            className="account-menu__icon-img"
          />
        </span>
        <span className="account-menu__row-label">
          {theme === "dark" ? "Dark mode" : "Light mode"}
        </span>
        <span
          className={`account-menu__switch ${theme === "dark" ? "account-menu__switch--on" : ""}`}
          aria-hidden
        >
          <span className="account-menu__switch-thumb" />
        </span>
      </button>

      <button type="button" role="menuitem" className="account-menu__row" onClick={onFeedback}>
        <span className="account-menu__row-icon" aria-hidden>
          <img src={ICON.feedback} alt="" width={20} height={20} className="account-menu__icon-img" />
        </span>
        <span className="account-menu__row-label">Feedback</span>
      </button>

      <div className="account-menu__sep" role="presentation" />

      <button
        type="button"
        role="menuitem"
        className="account-menu__row account-menu__row--danger"
        disabled={signingOut}
        onClick={() => void handleSignOut()}
      >
        <span className="account-menu__row-icon" aria-hidden>
          <img src={ICON.logout} alt="" width={20} height={20} className="account-menu__icon-img" />
        </span>
        <span className="account-menu__row-label">
          {signingOut ? "Signing out…" : "Log out"}
        </span>
      </button>
    </>
  );

  const overlay =
    open && typeof document !== "undefined"
      ? createPortal(
          <>
            {mobileSheet ? (
              <>
                <button
                  ref={scrimRef}
                  type="button"
                  aria-label="Close menu"
                  onClick={close}
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 99,
                    border: "none",
                    padding: 0,
                    margin: 0,
                    background: "var(--overlay)",
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                    opacity: sheetAnimOpen ? 1 : 0,
                    transition: `opacity ${SHEET_SPRING}`,
                  }}
                />
                <div
                  ref={sheetRef}
                  className="account-menu__sheet"
                  role="menu"
                  id={menuId}
                  aria-label="Account"
                  style={{
                    zIndex: 100,
                    transform: sheetAnimOpen ? "translateY(0)" : "translateY(100%)",
                    transition: `transform ${SHEET_SPRING}`,
                  }}
                >
                  <div
                    className="account-menu__sheet-handle-wrap"
                    aria-hidden
                    onPointerDown={onSheetHandleDown}
                    onPointerMove={onSheetHandleMove}
                    onPointerUp={onSheetHandleUp}
                    onPointerCancel={onSheetHandleUp}
                    style={{
                      cursor: "grab",
                      touchAction: "none",
                      userSelect: "none",
                    }}
                  >
                    <div className="account-menu__sheet-handle" />
                  </div>
                  <div className="account-menu__sheet-inner">{panelContent}</div>
                </div>
              </>
            ) : (
              <button
                type="button"
                aria-label="Close menu"
                className="account-menu__backdrop"
                onClick={close}
              />
            )}
            {!mobileSheet && popover ? (
              <div
                className="account-menu__popover"
                style={{
                  top: popover.top,
                  right: popover.right,
                  minWidth: popover.minWidth,
                }}
                role="menu"
                id={menuId}
                aria-label="Account"
              >
                {panelContent}
              </div>
            ) : null}
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (open) close();
          else setOpen(true);
        }}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        style={triggerMerged}
        className="app-glass-icon-btn active:scale-95"
      >
        <Image
          src="/icons/nav/dots.svg"
          alt=""
          width={20}
          height={20}
          aria-hidden
          className="nav-btn-icon"
        />
      </button>
      {overlay}
    </>
  );
}
