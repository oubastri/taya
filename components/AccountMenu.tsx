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

const MOBILE_MENU_MQ = "(max-width: 599px)";

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
  const [open, setOpen] = useState(false);
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
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open || !mobileSheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, mobileSheet]);

  const close = useCallback(() => setOpen(false), []);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  const onFeedback = useCallback(() => {
    close();
    window.location.href = getFeedbackMailto();
  }, [close]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      if (isRealMode) {
        const supabase = createClient();
        await supabase.auth.signOut();
        clearAuthCache();
      }
      close();
      router.push("/login");
      router.refresh();
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
            <button
              type="button"
              aria-label="Close menu"
              className="account-menu__backdrop"
              onClick={close}
            />
            {mobileSheet ? (
              <div
                className="account-menu__sheet"
                role="menu"
                id={menuId}
                aria-label="Account"
              >
                <div className="account-menu__sheet-handle-wrap" aria-hidden>
                  <div className="account-menu__sheet-handle" />
                </div>
                <div className="account-menu__sheet-inner">{panelContent}</div>
              </div>
            ) : popover ? (
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
        onClick={() => setOpen((o) => !o)}
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
