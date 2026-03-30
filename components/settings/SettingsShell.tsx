"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  SETTINGS_GLASS_BACK,
  SETTINGS_STICKY_TOP_BAR,
} from "./settingsChrome";

interface SettingsShellProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  onBack?: () => void;
  /** Settings home — 48px pill back, no centered title, 16px gutters (Figma hub). */
  variant?: "default" | "hub";
}

export function SettingsShell({
  title,
  children,
  onBack,
  variant = "default",
}: SettingsShellProps) {
  const router = useRouter();
  const back = onBack ?? (() => router.back());
  const isHub = variant === "hub";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--settings-page-bg)",
        paddingBottom: "max(64px, env(safe-area-inset-bottom))",
      }}
    >
      <header
        style={{
          ...SETTINGS_STICKY_TOP_BAR,
          ...(isHub ? { paddingBottom: 8 } : {}),
        }}
      >
        {isHub ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              minHeight: 40,
            }}
          >
            <button
              type="button"
              onClick={back}
              aria-label="Go back"
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--settings-hub-back-bg)",
                border: "1px solid var(--settings-hub-back-border)",
                boxShadow: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                WebkitTapHighlightColor: "transparent",
                padding: 0,
              }}
              className="active:scale-[0.97]"
            >
              <Image
                src="/icons/nav/arrow-left.svg"
                alt=""
                width={20}
                height={20}
                aria-hidden
                className="nav-btn-icon"
              />
            </button>
          </div>
        ) : (
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 40,
            }}
          >
            <button
              type="button"
              onClick={back}
              aria-label="Go back"
              style={{
                ...SETTINGS_GLASS_BACK,
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
              }}
              className="app-glass-icon-btn active:scale-[0.97]"
            >
              <Image
                src="/icons/nav/arrow-left.svg"
                alt=""
                width={18}
                height={18}
                aria-hidden
                className="nav-btn-icon"
              />
            </button>
            {title ? (
              <h1
                style={{
                  margin: 0,
                  color: "var(--foreground)",
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  letterSpacing: "-0.025em",
                }}
              >
                {title}
              </h1>
            ) : null}
          </div>
        )}
      </header>

      <div
        style={{
          width: "100%",
          maxWidth: 428,
          margin: "0 auto",
          padding: isHub ? "0 16px 0" : "8px 20px 0",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </main>
  );
}
