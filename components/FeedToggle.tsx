"use client";

import { motion, useReducedMotion } from "framer-motion";

export type FeedMode = "team" | "stadium";

const LABELS: Record<FeedMode, string> = {
  team: "FRIENDS",
  stadium: "WORLD",
};

interface FeedToggleProps {
  value: FeedMode;
  onChange: (value: FeedMode) => void;
}

/** Pill chip: mono label + trailing swap affordance. */
export function FeedToggle({ value, onChange }: FeedToggleProps) {
  const reduceMotion = useReducedMotion();
  const toggle = () => onChange(value === "team" ? "stadium" : "team");

  const layoutTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 34, mass: 0.85 };

  const iconTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 320, damping: 26, mass: 0.6 };

  return (
    <motion.button
      type="button"
      layout
      transition={{ layout: layoutTransition }}
      onClick={toggle}
      aria-label={
        value === "team"
          ? "Friends feed. Switch to world feed."
          : "World feed. Switch to friends feed."
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 100,
        border: "none",
        background: "var(--chip-bg)",
        cursor: "pointer",
        fontFamily: '"B612 Mono", ui-monospace, monospace',
        fontSize: 12,
        fontWeight: 500,
        color: "var(--chip-color)",
        letterSpacing: "-0.48px",
        WebkitTapHighlightColor: "transparent",
        lineHeight: "normal",
        transition: "background 0.18s ease, color 0.18s ease",
      }}
      className="active:opacity-90"
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
    >
      <motion.span
        layout="position"
        style={{ display: "inline-block", whiteSpace: "nowrap" }}
        transition={{ layout: layoutTransition }}
      >
        {LABELS[value]}
      </motion.span>
      <motion.img
        src="/icons/nav/swap.svg"
        alt=""
        width={14}
        height={14}
        aria-hidden
        draggable={false}
        className="activity-icon-auto"
        animate={{
          rotate: value === "stadium" ? 180 : 0,
        }}
        transition={iconTransition}
        style={{
          display: "block",
          width: 14,
          height: 14,
          flexShrink: 0,
          opacity: 0.9,
          objectFit: "contain",
          transformOrigin: "50% 50%",
        }}
      />
    </motion.button>
  );
}
