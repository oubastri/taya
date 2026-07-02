"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

/**
 * The manifesto, mirroring the iOS app's landing experience: the exact same
 * text, typed out one character at a time in mono with a blinking accent
 * cursor, over the app background, with a "Get started" / "Log in" way in.
 *
 * `variant="backdrop"` renders it statically (fully typed, no CTA/close) for use
 * as the dimmed background behind the auth modal.
 */
const MANIFESTO = `Some people live on Strava. Some have never timed a mile. You’re both in the right place.

An athlete, to us, is simply someone who moves. The marathoner and the morning walker, the pilates regular and the weekend surfer, the yogi and the lifter. All the same. This is the quieter, friendlier side of it all: less about splits and suffer scores, more about what your crew is up to and how everyone’s keeping well.

Log your moves and keep a small circle in the loop. A nudge here, a bit of applause there. The simple business of staying healthy humans, together.

Now, go move.`;

const sans = "var(--font-sans), system-ui, sans-serif";
const mono = "var(--font-mono), ui-monospace, monospace";
const BLOCK = "▌"; // ▌ block cursor

/** Cadence matching the iOS TypewriterText: quick per-char, a breath after
 *  sentence/clause punctuation, spaces zipped past so the cursor never lingers. */
function delayAt(index: number, chars: string[]): number {
  const next = index + 1 < chars.length ? chars[index + 1] : null;
  if (next && /\s/.test(next)) return 20;
  const justTyped = chars[index];
  if (/\s/.test(justTyped)) {
    const prev = index - 1 >= 0 ? chars[index - 1] : null;
    if (prev && ".!?".includes(prev)) return 450;
    if (prev && ",:;".includes(prev)) return 170;
  }
  return 45;
}

function Typewriter({ play }: { play: boolean }) {
  const chars = Array.from(MANIFESTO);
  const [count, setCount] = useState(play ? 0 : chars.length);
  const [cursorOn, setCursorOn] = useState(true);

  // Type out on mount (only when playing).
  useEffect(() => {
    if (!play) {
      setCount(chars.length);
      return;
    }
    setCount(0);
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setCount(i + 1);
      const d = delayAt(i, chars);
      i += 1;
      if (i < chars.length) timer = setTimeout(tick, d);
    };
    timer = setTimeout(tick, 320); // a small beat before it starts
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  // Blinking cursor.
  useEffect(() => {
    const blink = setInterval(() => setCursorOn((c) => !c), 500);
    return () => clearInterval(blink);
  }, []);

  const len = chars.length;
  const finished = count >= len;
  const typed = chars.slice(0, count).join("");

  // The whole string is always laid out (untyped text is transparent) so words
  // never reflow. In mono, the block cursor is the same width as any glyph, so
  // it can sit on the next non-space character without shifting anything.
  let cursor: ReactNode = null;
  let rest = "";
  if (!finished) {
    const nextChar = chars[count];
    if (cursorOn && !/\s/.test(nextChar)) {
      cursor = <span style={{ color: "var(--accent)" }}>{BLOCK}</span>;
      rest = chars.slice(count + 1).join("");
    } else {
      rest = chars.slice(count).join("");
    }
  }

  return (
    <p
      style={{
        margin: 0,
        whiteSpace: "pre-wrap",
        fontFamily: mono,
        fontSize: "clamp(13px, 3.5vw, 15px)",
        lineHeight: 1.65,
        letterSpacing: "-0.01em",
        color: "var(--foreground)",
      }}
    >
      <span>{typed}</span>
      {cursor}
      {rest ? <span style={{ color: "transparent" }}>{rest}</span> : null}
      {finished
        ? cursorOn
          ? <span style={{ color: "var(--accent)" }}>{BLOCK}</span>
          : <span style={{ color: "transparent" }}>{" "}</span>
        : null}
    </p>
  );
}

export default function ManifestoView({
  variant = "page",
}: {
  variant?: "page" | "backdrop";
}) {
  const isPage = variant === "page";

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      {isPage ? (
        <Link
          href="/"
          aria-label="Close"
          className="active:scale-[0.96] transition-transform"
          style={{
            position: "absolute",
            top: "max(16px, env(safe-area-inset-top))",
            right: 16,
            zIndex: 20,
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid var(--foreground)",
            color: "var(--foreground)",
            textDecoration: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
            />
          </svg>
        </Link>
      ) : null}

      <div
        style={{
          flex: 1,
          overflowY: isPage ? "auto" : "hidden",
          width: "100%",
          maxWidth: 720,
          margin: "0 auto",
          padding: "clamp(52px, 9vh, 88px) clamp(20px, 6vw, 40px) 24px",
        }}
      >
        <div
          style={{
            fontFamily: sans,
            fontWeight: 500,
            letterSpacing: "-0.06em",
            lineHeight: 1.04,
            fontSize: "clamp(30px, 8.5vw, 44px)",
            marginBottom: "clamp(20px, 4vh, 34px)",
          }}
        >
          <div>To All You</div>
          <div style={{ color: "var(--accent)" }}>Athletes</div>
        </div>

        <Typewriter play={isPage} />
      </div>

      {isPage ? (
        <div
          style={{
            width: "100%",
            maxWidth: 720,
            margin: "0 auto",
            padding:
              "12px clamp(20px, 6vw, 40px) max(20px, env(safe-area-inset-bottom))",
            background: "var(--background)",
          }}
        >
          <Link
            href="/signup"
            className="app-cta landing-nav-signup active:scale-[0.98] active:opacity-90"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 100,
              fontFamily: sans,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              textDecoration: "none",
              WebkitTapHighlightColor: "transparent",
              border: "1px solid color-mix(in srgb, var(--foreground) 14%, transparent)",
            }}
          >
            Get started
          </Link>
          <div
            style={{
              marginTop: 14,
              textAlign: "left",
              fontFamily: sans,
              fontSize: 14,
              color: "color-mix(in srgb, var(--foreground) 55%, transparent)",
            }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "var(--foreground)",
                textDecoration: "underline",
              }}
            >
              Log in
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
