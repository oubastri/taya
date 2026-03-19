"use client";

import { useEffect, useState } from "react";
import { MonoScrambleDigits, MonoScrambleText, LETTER_POOL } from "@/components/MonoScrambleDigits";

/** Same cadence as `AthletesCounter` / `MovesCounter` (`REFRESH_INTERVAL_MS`). */
const SCRAMBLE_AUTO_REFRESH_MS = 10_000;

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 400,
  letterSpacing: "-0.48px",
  color: "inherit",
};

const ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "2px 4px",
  borderRadius: 4,
  border: `1px dashed var(--mono-border)`,
  fontFamily: 'var(--font-mono), "B612 Mono", monospace',
  fontSize: 12,
  fontWeight: 400,
  letterSpacing: "-0.48px",
  lineHeight: "normal",
  color: "var(--foreground)",
  whiteSpace: "nowrap",
  gap: 8,
};

export interface ProfileStatStripProps {
  followingCount: number;
  fansCount: number;
  moves: number;
  onFollowingPress?: () => void;
  onFansPress?: () => void;
}

export function ProfileStatStrip({
  followingCount,
  fansCount,
  moves,
  onFollowingPress,
  onFansPress,
}: ProfileStatStripProps) {
  const rows: {
    value: number;
    label: string;
    onPress?: () => void;
  }[] = [
    { value: followingCount, label: "FOLLOWING", onPress: onFollowingPress },
    { value: fansCount, label: "FANS", onPress: onFansPress },
    { value: moves, label: "MOVES" },
  ];

  const [replay, setReplay] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setReplay((n) => n + 1);
    }, SCRAMBLE_AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      onMouseEnter={() => setReplay((n) => n + 1)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        width: 117,
        flexShrink: 0,
      }}
    >
      {rows.map(({ value, label, onPress }) =>
        onPress ? (
          <button
            key={label}
            type="button"
            onClick={onPress}
            style={{
              ...ROW_STYLE,
              width: "100%",
              background: "transparent",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
            className="active:opacity-80"
          >
            <MonoScrambleDigits value={value} replay={replay} style={LABEL_STYLE} />
            <MonoScrambleText text={label} scramblePool={LETTER_POOL} replay={replay} style={LABEL_STYLE} />
          </button>
        ) : (
          <div key={label} style={ROW_STYLE}>
            <MonoScrambleDigits value={value} replay={replay} style={LABEL_STYLE} />
            <MonoScrambleText text={label} scramblePool={LETTER_POOL} replay={replay} style={LABEL_STYLE} />
          </div>
        ),
      )}
    </div>
  );
}
