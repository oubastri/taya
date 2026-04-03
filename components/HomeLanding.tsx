"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { setSiteCustomCursorSuppressed } from "@/components/CustomCursor";
import AthletesGlobeView, {
  type AthletesGlobeUser,
} from "@/components/athletes/AthletesGlobeView";
import {
  LandingFigmaHero,
  LANDING_DEMO_PROFILE_ROWS,
} from "@/components/landing/LandingFigmaHero";
import { TayaWordmark } from "@/components/TayaWordmark";
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

  useEffect(() => {
    setSiteCustomCursorSuppressed(true);
    return () => setSiteCustomCursorSuppressed(false);
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
          showAvatarLabels={false}
          dotsOverlayAboveChrome
          chromeOverlay={landingChromeOverlay}
        />
      </div>

      <header className="landing-header">
        <div className="landing-header__wordmark">
          <TayaWordmark variant="landing" />
        </div>

        <div className="landing-header__actions-bar">
          <nav className="landing-header__auth" aria-label="Account">
            <div className="landing-nav-auth-pair">
              <Link
                href="/manifesto"
                aria-label="Our manifesto"
                className="landing-nav-manifesto-btn landing-nav-auth-cta active:opacity-85 active:scale-[0.98]"
                style={{
                  fontFamily: sans,
                  borderRadius: "50%",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  WebkitTapHighlightColor: "transparent",
                  border: "2px solid var(--foreground)",
                  flexShrink: 0,
                  color: "var(--foreground)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    d="M9 3.79c2.795-1.235 6.412-1.089 7.648.911 1.235 1.999.383 4.324-1.735 6.119S12 13.569 12 14.98"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  />
                  <circle cx="12" cy="20.5" r="1.5" fill="currentColor" />
                </svg>
              </Link>

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
                className="app-cta landing-nav-signup landing-nav-auth-cta active:opacity-90 active:scale-[0.98]"
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
                  border: "1px solid color-mix(in srgb, var(--foreground) 14%, transparent)",
                  backdropFilter: "blur(14px) saturate(1.2)",
                  WebkitBackdropFilter: "blur(14px) saturate(1.2)",
                }}
              >
                Join TAYA
              </Link>
            </div>
          </nav>
        </div>
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
