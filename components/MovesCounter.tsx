"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface MovesCounterProps {
  count: number;
  className?: string;
}

const DIGIT_COUNT = 5;
const TICK_MS = 100; // 4 ticks → 400ms full reveal
const REFRESH_INTERVAL_MS = 10000;

/** Characters for the scramble effect (digits, letters, symbols – airport-board style). */
const SCRAMBLE_POOL =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;':\",.<>?/~`";

function getRandomCode(length: number): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];
  }
  return s;
}

/** Pads count to at least 5 digits with leading zeros (e.g. 32 → "00032"). */
function formatCount(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return String(n).padStart(DIGIT_COUNT, "0");
}

export function MovesCounter({ count, className = "" }: MovesCounterProps) {
  const safeCount = typeof count === "number" ? count : 0;
  const [displayCount, setDisplayCount] = useState(safeCount);
  const [revealedLength, setRevealedLength] = useState(DIGIT_COUNT);
  const [scrambleChars, setScrambleChars] = useState(() => getRandomCode(DIGIT_COUNT));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const animationTargetRef = useRef(safeCount);

  const runBoardAnimation = useCallback((countOverride?: number) => {
    if (countOverride !== undefined) {
      setDisplayCount(countOverride);
      animationTargetRef.current = countOverride;
    } else {
      animationTargetRef.current = displayCount;
    }
    setRevealedLength(1);
    setScrambleChars(getRandomCode(DIGIT_COUNT));
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
    for (let i = 1; i < DIGIT_COUNT; i++) {
      const t = setTimeout(() => {
        setScrambleChars(getRandomCode(DIGIT_COUNT));
        setRevealedLength(i + 1);
      }, i * TICK_MS);
      timeoutsRef.current.push(t);
    }
  }, [displayCount]);

  // Sync count from props and run animation when count changes
  useEffect(() => {
    setDisplayCount(safeCount);
    animationTargetRef.current = safeCount;
    runBoardAnimation(safeCount);
  }, [safeCount, runBoardAnimation]);

  // Every 10 seconds, run the board flip (random codes then trickle to real number)
  useEffect(() => {
    intervalRef.current = setInterval(() => runBoardAnimation(), REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      timeoutsRef.current.forEach((t) => clearTimeout(t));
    };
  }, [runBoardAnimation]);

  const target = formatCount(
    revealedLength < DIGIT_COUNT ? animationTargetRef.current : displayCount
  );
  const displayStr =
    revealedLength >= DIGIT_COUNT
      ? target
      : target.slice(0, revealedLength) + scrambleChars.slice(revealedLength, DIGIT_COUNT);

  return (
    <div
      className={className}
      role="status"
      aria-label={`${displayCount.toLocaleString()} bodies in motion`}
      title="Total moves ever logged — updates when anyone adds a move"
      onMouseEnter={() => runBoardAnimation()}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        gap: 10,
        marginBottom: 12,
      }}
    >
      <style>{`
        @keyframes moves-counter-pulse {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
      <span
        style={{
          display: "inline-flex",
          padding: "2px 4px",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
          borderRadius: 4,
          border: "1px dashed #919191",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#000",
            flexShrink: 0,
            animation: "moves-counter-pulse 1.5s ease-in-out infinite",
          }}
          aria-hidden
        />
        <span
          style={{
            color: "#000",
            fontFamily: '"B612 Mono", ui-monospace, monospace',
            fontSize: 12,
            fontStyle: "normal",
            fontWeight: 400,
            lineHeight: "normal",
            letterSpacing: "-0.48px",
          }}
        >
          {displayStr}
        </span>
      </span>
      <span
        style={{
          color: "#000",
          fontFamily: '"B612 Mono", ui-monospace, monospace',
          fontSize: 12,
          fontStyle: "normal",
          fontWeight: 400,
          lineHeight: "normal",
          letterSpacing: "-0.48px",
          textTransform: "uppercase",
        }}
      >
        BODIES IN MOTION
      </span>
    </div>
  );
}
