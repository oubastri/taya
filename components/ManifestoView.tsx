"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";

const SENTENCES = [
  "Fitness got weird.",
  "Somewhere between the influencers and the algorithms, between the before-and-afters and the gym selfies,",
  "it stopped being about moving and started being about being seen moving.",
  "Your body became content.",
  "Your sweat became strategy.",
  "Your rest day became a caption.",
  "We're done with that.",
  "TAYA is for the people who show up anyway.",
  "The 6am run in the rain. The session nobody filmed. The workout you logged for yourself and the three friends who actually care.",
  "No strangers. No performance.",
  "No algorithm deciding if your effort was worth seeing.",
  "Just your people.",
  "Watching you show up. Showing up because you are.",
  "That's the whole thing.",
  "Every face on this page moved today.",
  "Not for an audience. For each other.",
  "To all you athletes, we see you.",
  "This is my love letter to all you athletes.",
];

/** No accent color on this line (plain greeting). */
const GREETING_SENTENCE_INDEX = SENTENCES.length - 2;

const GREEN_SET = new Set([
  "TAYA",
  "Athletes",
  "athletes",
  "athlete",
  "Athlete",
]);

const LOVE_LETTER_SENTENCE_INDEX = SENTENCES.length - 1;

/** Signup modal over manifesto (see AuthLandingScaffold `bg=manifesto`). */
const MANIFESTO_SIGNUP_HREF = "/signup?bg=manifesto";

const MANIFESTO_SCROLL_RESTORE_KEY = "manifesto-scroll-restore";

/** Line breaks before these token indices once `wordsToShow` reveals past the prior line. */
const LINE_BREAK_BEFORE_TOKEN: ReadonlyMap<number, readonly number[]> =
  new Map([
    // Before "moving" so it stays with "and …" (avoids "moving" alone on a wrapped line).
    [2, [4]],
    [8, [6, 10]],
    // "No strangers." / "No performance." on separate lines.
    [9, [2]],
    // Slide 13: manual line breaks; nowrap pairs keep tiny words with their neighbors (see MANIFESTO_SLIDE_13_NOWRAP_PAIRS).
    [12, [4, 6]],
    [15, [4]],
    [LOVE_LETTER_SENTENCE_INDEX, [5]],
  ]);

/**
 * Slide 13 (sentence index 12): word pairs that must not soft-wrap apart
 * (`inline-block` tokens otherwise allow orphans like “up.” or “up”).
 */
const MANIFESTO_SLIDE_13_NOWRAP_PAIRS: readonly (readonly [number, number])[] =
  [
    [0, 1],
    [2, 3],
    [4, 5],
    [7, 8],
  ];

const MANIFESTO_SLIDE_13_SKIP_TOKEN = new Set(
  MANIFESTO_SLIDE_13_NOWRAP_PAIRS.map(([, end]) => end)
);

/** Word vs trailing punctuation so commas/periods stay default color. */
function splitWordTrailingPunct(token: string): { word: string; trail: string } {
  const m = token.match(/^(.+?)([.,;:!?]+)$/);
  if (!m) return { word: token, trail: "" };
  const word = m[1];
  if (!/[A-Za-z0-9]/.test(word)) return { word: token, trail: "" };
  return { word, trail: m[2] };
}

function accentWordCore(
  sentenceIdx: number,
  tokenIdx: number,
  wordCore: string
): boolean {
  if (sentenceIdx === GREETING_SENTENCE_INDEX) {
    return false;
  }
  if (sentenceIdx === LOVE_LETTER_SENTENCE_INDEX) {
    return tokenIdx >= 5 && tokenIdx <= 8;
  }
  return GREEN_SET.has(wordCore.replace(/[^a-zA-Z]/g, ""));
}

function tokenize(s: string): string[] {
  return s.split(/\s+/).filter(Boolean);
}

const ALL_TOKENS = SENTENCES.map(tokenize);

/** Slide 1: only “Fitness” types letter-by-letter; “got” / “weird.” follow as words. */
const FIRST_SLIDE_FITNESS_CHARS = Array.from("Fitness");
const FIRST_SLIDE_FITNESS_CHAR_COUNT = FIRST_SLIDE_FITNESS_CHARS.length;
const FIRST_SLIDE_TAIL_WORD_COUNT = ALL_TOKENS[0].length - 1;

/**
 * Vertical px budget per word while a line is “typing”.
 * Higher = slower progression and harder to accidentally skip slides when scrolling fast.
 */
const SCROLL_PER_WORD = 84;
/**
 * Slide 1 only: px per character while “typing”.
 */
const SCROLL_PER_CHAR = 30;
/**
 * After a line is complete, scroll this much on the same “slide” before the next starts.
 * Larger = clearer pause between slides (helps fast trackpad / mouse wheels).
 */
const REST_SCROLL = 320;

interface ScrollZone {
  /** Present on slide 1: scroll [offset, preludeEnd) keeps text empty (caret only). */
  preludeEnd?: number;
  typeStart: number;
  typeEnd: number;
  end: number;
}

/** Scroll distance on slide 1 before the first letter appears (empty frame + caret). */
const FIRST_SLIDE_INTRO_SCROLL = 260;

const SCROLL_ZONES: ScrollZone[] = (() => {
  let offset = 0;
  return ALL_TOKENS.map((tokens, i) => {
    let preludeEnd: number | undefined;
    let typeStart = offset;
    if (i === 0) {
      preludeEnd = offset + FIRST_SLIDE_INTRO_SCROLL;
      typeStart = preludeEnd;
    }
    const typeSpan =
      i === 0
        ? FIRST_SLIDE_FITNESS_CHAR_COUNT * SCROLL_PER_CHAR +
          FIRST_SLIDE_TAIL_WORD_COUNT * SCROLL_PER_WORD
        : tokens.length * SCROLL_PER_WORD;
    const typeEnd = typeStart + typeSpan;
    const end = typeEnd + REST_SCROLL;
    offset = end;
    return { preludeEnd, typeStart, typeEnd, end };
  });
})();

/** Min document scroll height; extra padding added client-side so tall viewports can reach the last slide + CTA. */
const LAST_ZONE_END = SCROLL_ZONES[SCROLL_ZONES.length - 1].end;

function getFontSize(wordCount: number): string {
  if (wordCount <= 4) return "clamp(52px, 9vw, 108px)";
  if (wordCount <= 10) return "clamp(38px, 6.5vw, 80px)";
  if (wordCount <= 18) return "clamp(28px, 5vw, 64px)";
  return "clamp(22px, 3.8vw, 50px)";
}

export default function ManifestoView() {
  const [scrollY, setScrollY] = useState(0);
  const [spacerHeight, setSpacerHeight] = useState(
    () => LAST_ZONE_END + 2600
  );
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(MANIFESTO_SCROLL_RESTORE_KEY);
      if (raw != null) {
        sessionStorage.removeItem(MANIFESTO_SCROLL_RESTORE_KEY);
        const y = Number.parseInt(raw, 10);
        if (Number.isFinite(y)) {
          requestAnimationFrame(() => {
            window.scrollTo(0, y);
          });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const pad = () =>
      Math.max(960, Math.round(window.innerHeight + 480));
    setSpacerHeight(LAST_ZONE_END + pad());
    const onResize = () => setSpacerHeight(LAST_ZONE_END + pad());
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          setScrollY(y);
          rafRef.current = null;
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  let currentIdx = 0;
  let wordsToShow = 1;
  /** Slide 1: letters typed in “Fitness” (0 = intro only). */
  let fitnessCharsToShow = 0;
  /** Slide 1: “got” / “weird.” after Fitness is complete. */
  let firstSlideTailWordsToShow = 0;
  let sentenceComplete = false;

  let foundZone = false;
  for (let i = 0; i < SCROLL_ZONES.length; i++) {
    const zone = SCROLL_ZONES[i];
    if (scrollY < zone.end) {
      foundZone = true;
      currentIdx = i;
      const wc = ALL_TOKENS[i].length;
      if (scrollY < zone.typeStart) {
        sentenceComplete = false;
        if (i === 0) {
          fitnessCharsToShow = 0;
          firstSlideTailWordsToShow = 0;
        } else {
          wordsToShow = 1;
        }
      } else if (scrollY < zone.typeEnd) {
        const zoneSpan = zone.typeEnd - zone.typeStart;
        if (i === 0) {
          const into = scrollY - zone.typeStart;
          const prefixScroll =
            FIRST_SLIDE_FITNESS_CHAR_COUNT * SCROLL_PER_CHAR;
          if (into < prefixScroll) {
            const p = Math.min(1, Math.max(0, into / prefixScroll));
            fitnessCharsToShow = Math.min(
              FIRST_SLIDE_FITNESS_CHAR_COUNT,
              Math.floor(p * FIRST_SLIDE_FITNESS_CHAR_COUNT) + 1
            );
            firstSlideTailWordsToShow = 0;
          } else {
            fitnessCharsToShow = FIRST_SLIDE_FITNESS_CHAR_COUNT;
            const tailScroll = FIRST_SLIDE_TAIL_WORD_COUNT * SCROLL_PER_WORD;
            const intoTail = into - prefixScroll;
            const p2 = Math.min(1, Math.max(0, intoTail / tailScroll));
            firstSlideTailWordsToShow = Math.min(
              FIRST_SLIDE_TAIL_WORD_COUNT,
              Math.floor(p2 * FIRST_SLIDE_TAIL_WORD_COUNT) + 1
            );
          }
          sentenceComplete =
            fitnessCharsToShow >= FIRST_SLIDE_FITNESS_CHAR_COUNT &&
            firstSlideTailWordsToShow >= FIRST_SLIDE_TAIL_WORD_COUNT;
        } else {
          const progress = Math.min(
            1,
            Math.max(0, (scrollY - zone.typeStart) / zoneSpan)
          );
          wordsToShow = Math.min(wc, Math.floor(progress * wc) + 1);
          sentenceComplete = wordsToShow >= wc;
        }
      } else {
        if (i === 0) {
          fitnessCharsToShow = FIRST_SLIDE_FITNESS_CHAR_COUNT;
          firstSlideTailWordsToShow = FIRST_SLIDE_TAIL_WORD_COUNT;
        } else {
          wordsToShow = wc;
        }
        sentenceComplete = true;
      }
      break;
    }
  }

  if (!foundZone) {
    const last = SCROLL_ZONES.length - 1;
    currentIdx = last;
    wordsToShow = ALL_TOKENS[last].length;
    fitnessCharsToShow = FIRST_SLIDE_FITNESS_CHAR_COUNT;
    firstSlideTailWordsToShow = FIRST_SLIDE_TAIL_WORD_COUNT;
    sentenceComplete = true;
  }

  const isVeryEnd = currentIdx === SENTENCES.length - 1 && sentenceComplete;
  /** Bar tracks content depth; full when the final slide’s line is complete (no dead zone short of 100%). */
  const overallProgress =
    LAST_ZONE_END > 0
      ? Math.min(
          1,
          sentenceComplete && currentIdx === SENTENCES.length - 1
            ? 1
            : scrollY / LAST_ZONE_END
        )
      : 0;
  const zone0 = SCROLL_ZONES[0];
  const showFirstSlideScrollCue = currentIdx === 0 && scrollY < zone0.end;
  const showFirstSlideIntroCaret =
    currentIdx === 0 && fitnessCharsToShow === 0 && !sentenceComplete;

  const tokens = ALL_TOKENS[currentIdx];
  const fontSize = getFontSize(tokens.length);

  const firstSlideTailTokens = ALL_TOKENS[0].slice(1);

  /** OS-style caret: next sibling in one inline run, flush after last typed character. */
  const caretEl = <span className="manifesto-type-caret" aria-hidden />;

  const firstSlideLine =
    currentIdx === 0 ? (
      <span className="manifesto-typewriter-line">
        {showFirstSlideIntroCaret ? (
          caretEl
        ) : fitnessCharsToShow < FIRST_SLIDE_FITNESS_CHAR_COUNT ? (
          <>
            <span>
              {FIRST_SLIDE_FITNESS_CHARS.slice(0, fitnessCharsToShow).join("")}
            </span>
            {caretEl}
          </>
        ) : (
          <>
            <span>{FIRST_SLIDE_FITNESS_CHARS.join("")}</span>
            {firstSlideTailWordsToShow === 0 && !sentenceComplete
              ? caretEl
              : null}
            {firstSlideTailWordsToShow > 0 ? (
              <>
                {" "}
                {firstSlideTailTokens
                  .slice(0, firstSlideTailWordsToShow)
                  .map((token, ti) => {
                    const { word, trail } = splitWordTrailingPunct(token);
                    const showAccent = accentWordCore(0, ti + 1, word);
                    return (
                      <Fragment key={`s0w-${ti}`}>
                        {ti > 0 ? " " : null}
                        <span
                          style={{
                            color: showAccent ? "var(--accent)" : "inherit",
                          }}
                        >
                          {word}
                        </span>
                        {trail ? (
                          <span style={{ color: "inherit" }}>{trail}</span>
                        ) : null}
                      </Fragment>
                    );
                  })}
                {firstSlideTailWordsToShow < FIRST_SLIDE_TAIL_WORD_COUNT &&
                !sentenceComplete
                  ? caretEl
                  : null}
              </>
            ) : null}
          </>
        )}
      </span>
    ) : null;

  return (
    <>
      {/* Scroll spacer */}
      <div style={{ height: spacerHeight }} aria-hidden />

      {/* Fixed canvas */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding:
            "max(64px, env(safe-area-inset-top)) clamp(20px, 6vw, 80px) max(48px, env(safe-area-inset-bottom))",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {/* Progress bar */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${overallProgress * 100}%`,
              background: "var(--accent)",
            }}
          />
        </div>

        {/* Close button — uses close.svg icon */}
        <Link
          href="/"
          aria-label="Close"
          className="manifesto-close-btn"
          style={{
            position: "absolute",
            top: "max(16px, env(safe-area-inset-top))",
            left: "max(16px, env(safe-area-inset-left))",
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.6)",
            textDecoration: "none",
            WebkitTapHighlightColor: "transparent",
            flexShrink: 0,
            transition: "border-color 0.2s ease, color 0.2s ease",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </Link>

        {/* Sentence — full final line breaks + stable column width so centering doesn’t reflow */}
        <div
          style={{
            boxSizing: "border-box",
            alignSelf: "stretch",
            width: "100%",
            maxWidth: "min(900px, 92vw)",
            marginLeft: "auto",
            marginRight: "auto",
            minWidth: 0,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            fontSize,
            lineHeight: 1.15,
            fontWeight: 600,
            color: "#fff",
            letterSpacing: "-0.03em",
            textAlign: "center",
          }}
        >
          {currentIdx === 0 ? (
            firstSlideLine
          ) : (
            tokens.map((token, i) => {
              if (currentIdx === 12 && MANIFESTO_SLIDE_13_SKIP_TOKEN.has(i)) {
                return null;
              }
              if (currentIdx === 12) {
                const pair = MANIFESTO_SLIDE_13_NOWRAP_PAIRS.find(
                  ([start]) => start === i
                );
                if (pair) {
                  const [a, b] = pair;
                  const breakTokens = LINE_BREAK_BEFORE_TOKEN.get(currentIdx);
                  const lineBreakBefore = Boolean(breakTokens?.includes(a));
                  return (
                    <Fragment key={`${currentIdx}-${a}-${b}`}>
                      {lineBreakBefore ? <br aria-hidden /> : null}
                      <span style={{ whiteSpace: "nowrap" }}>
                        {[a, b].map((j) => {
                          const t = tokens[j];
                          const { word, trail } = splitWordTrailingPunct(t);
                          const showAccent = accentWordCore(currentIdx, j, word);
                          return (
                            <span
                              key={j}
                              style={{
                                display: "inline-block",
                                opacity: j < wordsToShow ? 1 : 0,
                                marginRight:
                                  j < tokens.length - 1 ? "0.28em" : 0,
                                pointerEvents:
                                  j < wordsToShow ? undefined : "none",
                              }}
                            >
                              <span
                                style={{
                                  color: showAccent
                                    ? "var(--accent)"
                                    : "inherit",
                                }}
                              >
                                {word}
                              </span>
                              {trail ? (
                                <span style={{ color: "inherit" }}>{trail}</span>
                              ) : null}
                            </span>
                          );
                        })}
                      </span>
                    </Fragment>
                  );
                }
              }
              const { word, trail } = splitWordTrailingPunct(token);
              const showAccent = accentWordCore(currentIdx, i, word);
              const breakTokens = LINE_BREAK_BEFORE_TOKEN.get(currentIdx);
              const lineBreakBefore = Boolean(breakTokens?.includes(i));
              return (
                <Fragment key={`${currentIdx}-${i}`}>
                  {lineBreakBefore ? <br aria-hidden /> : null}
                  <span
                    style={{
                      display: "inline-block",
                      opacity: i < wordsToShow ? 1 : 0,
                      marginRight: i < tokens.length - 1 ? "0.28em" : 0,
                      pointerEvents: i < wordsToShow ? undefined : "none",
                    }}
                  >
                    <span
                      style={{
                        color: showAccent ? "var(--accent)" : "inherit",
                      }}
                    >
                      {word}
                    </span>
                    {trail ? (
                      <span style={{ color: "inherit" }}>{trail}</span>
                    ) : null}
                  </span>
                </Fragment>
              );
            })
          )}
        </div>

        {/* Sentence counter */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "max(22px, env(safe-area-inset-bottom))",
            right: "max(20px, env(safe-area-inset-right))",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.18)",
            fontWeight: 400,
            textTransform: "uppercase",
            userSelect: "none",
          }}
        >
          {currentIdx + 1} / {SENTENCES.length}
        </div>

        {/* Scroll cue: after first line finishes typing, fade in + pulsing chevron */}
        {showFirstSlideScrollCue && (
          <div
            aria-hidden
            className="manifesto-scroll-hint manifesto-scroll-hint--intro"
            style={{
              position: "absolute",
              bottom: "max(28px, env(safe-area-inset-bottom))",
              left: "50%",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              fontSize: 12,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.94)",
              fontWeight: 500,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 7,
              userSelect: "none",
              textShadow: "0 1px 2px rgba(0,0,0,0.85)",
            }}
          >
            <span>scroll</span>
            <svg
              className="manifesto-scroll-hint__chevron"
              width="11"
              height="15"
              viewBox="0 0 10 14"
              fill="none"
              aria-hidden
            >
              <path
                d="M5 1v12M1 9l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {/* End CTA */}
        {isVeryEnd && (
          <div
            className="manifesto-end-cta"
            style={{
              position: "absolute",
              bottom: "max(48px, calc(env(safe-area-inset-bottom) + 24px))",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Link
              href={MANIFESTO_SIGNUP_HREF}
              className="app-cta manifesto-signup-cta active:opacity-90 active:scale-[0.98]"
              onClick={() => {
                try {
                  sessionStorage.setItem(
                    MANIFESTO_SCROLL_RESTORE_KEY,
                    String(window.scrollY)
                  );
                } catch {
                  /* ignore */
                }
              }}
            >
              Join TAYA
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
