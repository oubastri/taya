"use client";

import Link from "next/link";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AthletesGlobeView, {
  type AthletesGlobeUser,
} from "@/components/athletes/AthletesGlobeView";
import {
  LandingFigmaHero,
  LANDING_DEMO_PROFILE_ROWS,
} from "@/components/landing/LandingFigmaHero";
import { TayaWordmark } from "@/components/TayaWordmark";
import { useTheme } from "@/hooks/use-theme";

function buildLandingGlobeUsers(): AthletesGlobeUser[] {
  return LANDING_DEMO_PROFILE_ROWS.map((row, i) => {
    const handle = row.handle.replace(/^@/, "");
    return {
      id: `landing-globe-${i}-${handle}`,
      name: handle
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      handle,
      avatarUrl: row.src,
      isYou: false,
    };
  });
}

const sans = 'var(--font-sans), system-ui, sans-serif';

export default function HomeLanding() {
  const landingGlobeUsers = useMemo(() => buildLandingGlobeUsers(), []);
  const { theme, toggle: toggleTheme } = useTheme();
  const [exitingTheme, setExitingTheme] = useState<"light" | "dark" | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleToggleTheme = useCallback(() => {
    setExitingTheme(theme);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => setExitingTheme(null), 200);
    toggleTheme();
  }, [theme, toggleTheme]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  const headerScrim =
    "linear-gradient(to bottom, var(--background) 0%, var(--background) 12%, color-mix(in srgb, var(--background) 96%, transparent) 38%, color-mix(in srgb, var(--background) 78%, transparent) 62%, color-mix(in srgb, var(--background) 42%, transparent) 84%, transparent 100%)";
  const footerScrim =
    "linear-gradient(to top, var(--background) 0%, var(--background) 14%, color-mix(in srgb, var(--background) 96%, transparent) 40%, color-mix(in srgb, var(--background) 76%, transparent) 64%, color-mix(in srgb, var(--background) 38%, transparent) 86%, transparent 100%)";

  const landingChromeOverlay = (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "min(17vh, 185px)",
          background: headerScrim,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "min(20vh, 220px)",
          background: footerScrim,
        }}
      />
    </>
  );

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        isolation: "isolate",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
        }}
      >
        <AthletesGlobeView
          mode="landing"
          users={landingGlobeUsers}
          hydrated
          onNavigateToProfile={() => {}}
          showCustomCursor={false}
          showAvatarLabels={false}
          dotsOverlayAboveChrome
          chromeOverlay={landingChromeOverlay}
        />
      </div>

      <header
        style={{
          flexShrink: 0,
          position: "relative",
          zIndex: 20,
          paddingTop: "max(env(safe-area-inset-top), 20px)",
          paddingLeft: "max(20px, env(safe-area-inset-left))",
          paddingRight: "max(20px, env(safe-area-inset-right))",
          paddingBottom: 20,
          marginBottom: -8,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          rowGap: 14,
        }}
      >
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <TayaWordmark variant="landing" />
        </div>
        <nav
          aria-label="Account"
          className="landing-nav"
          style={{
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {/* Theme toggle — styled as a sibling to the Login / Create account buttons */}
          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="theme-toggle-btn landing-nav-toggle active:opacity-85 active:scale-[0.98]"
            style={{
              borderRadius: 100,
              border: "2px solid var(--foreground)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              overflow: "hidden",
              padding: 0,
              flexShrink: 0,
            }}
          >
            {exitingTheme && (
              <Image
                key={`exit-${exitingTheme}`}
                src={`/icons/dark-light-mode/${exitingTheme === "dark" ? "sun" : "moon"}.svg`}
                alt=""
                width={20}
                height={20}
                aria-hidden
                className="activity-icon-auto theme-icon-exit"
              />
            )}
            <Image
              key={`enter-${theme}`}
              src={`/icons/dark-light-mode/${theme === "dark" ? "sun" : "moon"}.svg`}
              alt=""
              width={20}
              height={20}
              aria-hidden
              className="activity-icon-auto theme-icon-enter"
            />
          </button>

          <div className="landing-nav-auth-pair">
            <Link
              href="/login"
              className="landing-nav-login landing-nav-auth-cta active:opacity-85 active:scale-[0.98]"
              style={{
                fontFamily: sans,
                fontWeight: 400,
                letterSpacing: "-0.02em",
                borderRadius: 100,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                WebkitTapHighlightColor: "transparent",
                border: "2px solid var(--foreground)",
              }}
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="landing-nav-signup landing-nav-auth-cta active:opacity-90 active:scale-[0.98]"
              style={{
                fontFamily: sans,
                fontWeight: 400,
                letterSpacing: "-0.02em",
                borderRadius: 100,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                WebkitTapHighlightColor: "transparent",
                background: "var(--cta-bg)",
                color: "var(--cta-color)",
                border: "1px solid color-mix(in srgb, var(--foreground) 14%, transparent)",
                backdropFilter: "blur(14px) saturate(1.2)",
                WebkitBackdropFilter: "blur(14px) saturate(1.2)",
              }}
            >
              Create account
            </Link>
          </div>
        </nav>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          minHeight: 0,
          position: "relative",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            paddingTop: "clamp(36px, 11vh, 96px)",
            paddingBottom: "max(20px, env(safe-area-inset-bottom))",
          }}
        >
          <LandingFigmaHero />
        </div>
      </main>
    </div>
  );
}
