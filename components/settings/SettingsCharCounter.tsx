"use client";

import { forwardRef, type CSSProperties } from "react";

/** Last N chars before max — hold amber, then ramp to red. */
const CHAR_LIMIT_WARN_TAIL = 10;
const warnAt = (max: number) => max - CHAR_LIMIT_WARN_TAIL;
/** Below this length the count uses --settings-hub-label; at this length jump to amber. */
const CHAR_COUNT_RAMP_START = 40;

const WARN = [239, 203, 1] as const;
const FULL = [255, 58, 58] as const;
const AMBER_HEX = "#EFCB01";

function lerpChannel(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function lerpRgb(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): string {
  const x = Math.min(1, Math.max(0, t));
  return `rgb(${lerpChannel(a[0], b[0], x)}, ${lerpChannel(a[1], b[1], x)}, ${lerpChannel(a[2], b[2], x)})`;
}

function currentCountColor(length: number, max: number): string {
  if (length < CHAR_COUNT_RAMP_START) return "var(--settings-hub-label)";
  if (length >= max) return "#FF3A3A";
  const w = warnAt(max);
  if (length < w) return AMBER_HEX;
  return lerpRgb(WARN, FULL, (length - w) / (max - w));
}

export type SettingsCharCounterProps = {
  length: number;
  max: number;
  /** Row styles (e.g. `labelText` + margin). Do not rely on `color` here — it is applied per segment. */
  style?: CSSProperties;
};

/** Current count: label color → amber → red; "/max" stays on --settings-hub-label. */
export const SettingsCharCounter = forwardRef<HTMLParagraphElement, SettingsCharCounterProps>(
  function SettingsCharCounter({ length, max, style }, ref) {
    const currentColor = currentCountColor(length, max);

    return (
      <p
        ref={ref}
        style={{
          ...style,
          display: "inline-block",
          color: undefined,
        }}
      >
        <span
          style={{
            color: currentColor,
            transition: "color 0.2s ease-out",
          }}
        >
          {length}
        </span>
        <span style={{ color: "var(--settings-hub-label)" }}>/{max}</span>
      </p>
    );
  },
);
