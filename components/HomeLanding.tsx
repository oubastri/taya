"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function useNarrowNav(breakpointPx: number) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [breakpointPx]);
  return narrow;
}

export default function HomeLanding() {
  const landingGlobeUsers = useMemo(() => buildLandingGlobeUsers(), []);
  const narrowNav = useNarrowNav(520);
  const { theme, toggle: toggleTheme } = useTheme();
  const [exitingTheme, setExitingTheme] = useState<"light" | "dark" | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [toggleHovered, setToggleHovered] = useState(false);
  const [loginHovered, setLoginHovered] = useState(false);
  const [signupHovered, setSignupHovered] = useState(false);

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

  const btnSize = narrowNav ? 46 : 54;
  const btnFontSize = narrowNav ? 14 : 18;
  const btnPad = narrowNav ? "0 16px" : "0 20px";
  const btnMinW = narrowNav ? 108 : 132;

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
          style={{
            display: "flex",
            alignItems: "center",
            gap: narrowNav ? 8 : 10,
            flexShrink: 0,
          }}
        >
          {/* Theme toggle — styled as a sibling to the Login/Sign up buttons */}
          <button
            type="button"
            onClick={handleToggleTheme}
            onMouseEnter={() => setToggleHovered(true)}
            onMouseLeave={() => setToggleHovered(false)}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="theme-toggle-btn active:opacity-85 active:scale-[0.98]"
            style={{
              width: btnSize,
              height: btnSize,
              borderRadius: 100,
              background: toggleHovered ? "var(--foreground)" : "var(--surface)",
              border: "2px solid var(--foreground)",
              boxShadow: toggleHovered
                ? "0 4px 16px rgba(0,0,0,0.12)"
                : "0 1px 2px rgba(0,0,0,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              overflow: "hidden",
              padding: 0,
              flexShrink: 0,
              transition:
                "transform 0.2s var(--ease-out-expo), background 0.18s ease, box-shadow 0.2s var(--ease-out-expo)",
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
                style={{ filter: toggleHovered ? "invert(1)" : undefined }}
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
              style={{ filter: toggleHovered ? "invert(1)" : undefined }}
            />
          </button>

          <Link
            href="/login"
            className="active:opacity-85 active:scale-[0.98]"
            onMouseEnter={() => setLoginHovered(true)}
            onMouseLeave={() => setLoginHovered(false)}
            style={{
              fontFamily: sans,
              fontSize: btnFontSize,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              borderRadius: 100,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: btnSize,
              minWidth: btnMinW,
              padding: btnPad,
              WebkitTapHighlightColor: "transparent",
              transition:
                "transform 0.2s var(--ease-out-expo), opacity 0.2s, box-shadow 0.2s var(--ease-out-expo), background 0.18s ease, color 0.18s ease",
              background: loginHovered ? "var(--foreground)" : "var(--surface)",
              color: loginHovered ? "var(--surface)" : "var(--foreground)",
              border: "2px solid var(--foreground)",
              boxShadow: loginHovered
                ? "0 4px 16px rgba(0,0,0,0.12)"
                : "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="active:opacity-90 active:scale-[0.98]"
            onMouseEnter={() => setSignupHovered(true)}
            onMouseLeave={() => setSignupHovered(false)}
            style={{
              fontFamily: sans,
              fontSize: btnFontSize,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              borderRadius: 100,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: btnSize,
              minWidth: btnMinW,
              padding: btnPad,
              WebkitTapHighlightColor: "transparent",
              transition:
                "transform 0.2s var(--ease-out-expo), opacity 0.2s, box-shadow 0.2s var(--ease-out-expo)",
              background: "var(--cta-bg)",
              color: "var(--cta-color)",
              border: "1px solid color-mix(in srgb, var(--foreground) 14%, transparent)",
              boxShadow: signupHovered
                ? "0 6px 28px rgba(0,0,0,0.22)"
                : "0 2px 16px rgba(0,0,0,0.12)",
              transform: signupHovered ? "scale(1.025)" : "scale(1)",
              backdropFilter: "blur(14px) saturate(1.2)",
              WebkitBackdropFilter: "blur(14px) saturate(1.2)",
            }}
          >
            Sign up
          </Link>
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
