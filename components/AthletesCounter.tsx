"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const ACTIVITY_ICONS = [
  "/icons/run.svg",
  "/icons/cycle.svg",
  "/icons/walk.svg",
  "/icons/hike.svg",
  "/icons/rowing.svg",
  "/icons/surf.svg",
  "/icons/ski.svg",
  "/icons/tennis.svg",
  "/icons/volleyball.svg",
  "/icons/boxing.svg",
  "/icons/martial_arts.svg",
  "/icons/dance.svg",
  "/icons/pilates.svg",
  "/icons/stretch.svg",
];

const ICON_CYCLE_MS = 200;

interface AthletesCounterProps {
  count: number;
  className?: string;
}

const DIGIT_COUNT = 5;
const TEXT_SUFFIX = " TAYA ATHLETES";
const TOTAL_CHARS = DIGIT_COUNT + TEXT_SUFFIX.length;
const TICK_MS = 75;
const REFRESH_INTERVAL_MS = 10000;
const SCRAMBLE_POOL = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function getRandomScramble(length: number): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];
  }
  return s;
}

function formatCount(count: number): string {
  return String(Math.max(0, Math.floor(count))).padStart(DIGIT_COUNT, "0");
}

export function AthletesCounter({ count, className = "" }: AthletesCounterProps) {
  const safeCount = typeof count === "number" ? count : 0;
  const [displayCount, setDisplayCount] = useState(safeCount);
  const [revealedLength, setRevealedLength] = useState(TOTAL_CHARS);
  const [scrambleChars, setScrambleChars] = useState(() => getRandomScramble(TOTAL_CHARS));
  const [iconIndex, setIconIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iconIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const animationTargetRef = useRef(safeCount);

  const runBoardAnimation = useCallback((countOverride?: number) => {
    if (countOverride !== undefined) {
      setDisplayCount(countOverride);
      animationTargetRef.current = countOverride;
    }
    setRevealedLength(0);
    setScrambleChars(getRandomScramble(TOTAL_CHARS));
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
    for (let i = 0; i < TOTAL_CHARS; i++) {
      const t = setTimeout(() => {
        setScrambleChars(getRandomScramble(TOTAL_CHARS));
        setRevealedLength(i + 1);
      }, (i + 1) * TICK_MS);
      timeoutsRef.current.push(t);
    }
  }, []);

  useEffect(() => {
    animationTargetRef.current = safeCount;
    runBoardAnimation(safeCount);
  }, [safeCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    intervalRef.current = setInterval(() => runBoardAnimation(), REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      timeoutsRef.current.forEach((t) => clearTimeout(t));
    };
  }, [runBoardAnimation]);

  useEffect(() => {
    iconIntervalRef.current = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % ACTIVITY_ICONS.length);
    }, ICON_CYCLE_MS);
    return () => {
      if (iconIntervalRef.current) clearInterval(iconIntervalRef.current);
    };
  }, []);

  const fullTarget =
    formatCount(revealedLength >= TOTAL_CHARS ? displayCount : animationTargetRef.current) +
    TEXT_SUFFIX;

  let displayStr = fullTarget.slice(0, revealedLength);
  for (let i = revealedLength; i < TOTAL_CHARS; i++) {
    displayStr += fullTarget[i] === " " ? " " : (scrambleChars[i] ?? SCRAMBLE_POOL[0]);
  }

  return (
    <div
      className={className}
      role="status"
      aria-label={`${displayCount.toLocaleString()} athletes on TAYA`}
      title="Total athletes on TAYA"
      onMouseEnter={() => runBoardAnimation()}
      style={{ display: "inline-flex" }}
    >
      <span
        style={{
          display: "inline-flex",
          padding: "4px 8px",
          alignItems: "center",
          gap: 6,
          borderRadius: 4,
          border: "1px dashed #919191",
        }}
      >
        <Image
          src={ACTIVITY_ICONS[iconIndex]}
          alt=""
          width={14}
          height={14}
          aria-hidden
          style={{ flexShrink: 0 }}
        />
        <span
          style={{
            color: "#000",
            fontFamily: '"B612 Mono", ui-monospace, monospace',
            fontSize: 12,
            fontWeight: 400,
            lineHeight: "normal",
            letterSpacing: "-0.48px",
          }}
        >
          {displayStr}
        </span>
      </span>
    </div>
  );
}
