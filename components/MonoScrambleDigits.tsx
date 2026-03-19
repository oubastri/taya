"use client";

import { useEffect, useState } from "react";

const TICK_MS = 75;
const DIGIT_POOL = "0123456789";

function randomScrambleFromPool(length: number, pool: string): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += pool[Math.floor(Math.random() * pool.length)];
  }
  return s;
}

export function MonoScrambleText({
  text: target,
  scramblePool,
  tickMs = TICK_MS,
  replay = 0,
  className,
  style,
  tabularNums = false,
}: {
  text: string;
  scramblePool: string;
  tickMs?: number;
  replay?: number;
  className?: string;
  style?: React.CSSProperties;
  tabularNums?: boolean;
}) {
  const len = target.length;
  const [revealedLength, setRevealedLength] = useState(0);
  const [scrambleChars, setScrambleChars] = useState(() =>
    randomScrambleFromPool(len, scramblePool),
  );

  useEffect(() => {
    setRevealedLength(0);
    setScrambleChars(randomScrambleFromPool(len, scramblePool));
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < len; i++) {
      const t = setTimeout(() => {
        setScrambleChars(randomScrambleFromPool(len, scramblePool));
        setRevealedLength(i + 1);
      }, (i + 1) * tickMs);
      timeouts.push(t);
    }
    return () => timeouts.forEach((x) => clearTimeout(x));
  }, [target, replay, len, tickMs, scramblePool]);

  let display = "";
  for (let i = 0; i < len; i++) {
    if (i < revealedLength) {
      display += target[i];
    } else {
      const ch = target[i];
      display += ch === " " ? " " : (scrambleChars[i] ?? scramblePool[0]);
    }
  }

  return (
    <span
      className={className}
      style={{
        fontVariantNumeric: tabularNums ? "tabular-nums" : undefined,
        display: "inline-block",
        minWidth: tabularNums && len > 0 ? `${len}ch` : undefined,
        ...style,
      }}
    >
      {display}
    </span>
  );
}

const LETTER_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export { LETTER_POOL };

export function MonoScrambleDigits({
  value,
  minDigits = 3,
  tickMs = TICK_MS,
  replay = 0,
  className,
  style,
}: {
  value: number;
  minDigits?: number;
  tickMs?: number;
  replay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const safe = Math.max(0, Math.floor(value));
  const raw = String(safe);
  const digitCount = Math.max(minDigits, raw.length);
  const target = raw.padStart(digitCount, "0");

  return (
    <MonoScrambleText
      text={target}
      scramblePool={DIGIT_POOL}
      tickMs={tickMs}
      replay={replay}
      className={className}
      style={style}
      tabularNums
    />
  );
}
