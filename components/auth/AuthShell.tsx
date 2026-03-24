"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { SETTINGS_STICKY_TOP_BAR } from "@/components/settings/settingsChrome";
import { figmaBackButton } from "./figmaAuthStyles";

const CONTENT_MAX = 428;
const GUTTER = 16;

type AuthShellProps = {
  children: React.ReactNode;
  /** When true, the sticky top bar is omitted (e.g. onboarding uses a feed-style header in `beforeBody`). */
  hideHeader?: boolean;
  /** Full-width block rendered after the optional header, before the max-width body (e.g. feed wordmark row). */
  beforeBody?: React.ReactNode;
  showBack?: boolean;
  /** When `showBack`, use arrow (default) or the same close icon as other modals (`/icons/nav/close.svg`). */
  dismissIcon?: "arrow" | "close";
  onBack?: () => void;
  title?: React.ReactNode;
  /**
   * When true, used inside `AuthLandingScaffold` — no full-page `<main>`, fills the modal / mobile panel.
   */
  embedded?: boolean;
};

export function AuthShell({
  children,
  hideHeader = false,
  beforeBody,
  showBack = true,
  dismissIcon = "arrow",
  onBack,
  title,
  embedded = false,
}: AuthShellProps) {
  const router = useRouter();
  const back = onBack ?? (() => router.back());
  const isCloseDismiss = dismissIcon === "close";

  const header = (
    <header
      style={{
        ...SETTINGS_STICKY_TOP_BAR,
        background: "var(--background)",
        flexShrink: 0,
        ...(embedded
          ? {
              position: "sticky",
              top: 0,
              width: "100%",
              maxWidth: "100%",
              marginLeft: 0,
              marginRight: 0,
              zIndex: 4,
            }
          : {}),
        ...(isCloseDismiss
          ? {
              width: "100%",
              maxWidth: "100%",
              marginLeft: 0,
              marginRight: 0,
              paddingTop: 0,
              paddingBottom: 8,
              paddingLeft: 0,
              paddingRight: 0,
            }
          : {}),
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: isCloseDismiss ? GUTTER + 48 : 48,
          maxWidth: embedded ? "none" : CONTENT_MAX,
          margin: embedded ? 0 : "0 auto",
          paddingLeft: isCloseDismiss ? 0 : GUTTER,
          paddingRight: isCloseDismiss ? 0 : GUTTER,
          boxSizing: "border-box",
        }}
      >
        {showBack ? (
          <button
            type="button"
            onClick={back}
            aria-label={isCloseDismiss ? "Close" : "Go back"}
            style={{
              ...figmaBackButton,
              position: "absolute",
              ...(isCloseDismiss
                ? {
                    top: GUTTER,
                    right: GUTTER,
                    left: "auto",
                    transform: "none",
                  }
                : {
                    left: GUTTER,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }),
            }}
            className="active:scale-[0.97]"
          >
            <Image
              src={
                dismissIcon === "close"
                  ? "/icons/nav/close.svg"
                  : "/icons/nav/arrow-left.svg"
              }
              alt=""
              width={20}
              height={20}
              aria-hidden
              className="nav-btn-icon"
            />
          </button>
        ) : null}
        {title ? (
          <div
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
              textAlign: "center",
            }}
          >
            {title}
          </div>
        ) : null}
      </div>
    </header>
  );

  const body = (
    <div
      style={{
        width: "100%",
        maxWidth: embedded ? "none" : CONTENT_MAX,
        margin: embedded ? 0 : "0 auto",
        padding: `4px ${GUTTER}px max(32px, env(safe-area-inset-bottom))`,
        boxSizing: "border-box",
        flex: embedded ? "1 1 auto" : undefined,
      }}
    >
      {children}
    </div>
  );

  if (embedded) {
    return (
      <div
        style={{
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--background)",
        }}
      >
        {!hideHeader ? header : null}
        {beforeBody}
        {body}
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
      }}
    >
      {!hideHeader ? header : null}
      {beforeBody}
      {body}
    </main>
  );
}
