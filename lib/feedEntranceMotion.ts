/**
 * Feed “new move” choreography — keep in sync with `.feed-post-new-*` and
 * `.animate-feed-post-below-settle` in app/globals.css.
 */
export const FEED_ENTRANCE = {
  slotMs: 320,
  revealDelayMs: 160,
  revealDurationMs: 300,
  belowDurationMs: 340,
  belowStaggerMs: 28,
  /** Toast / state clear just after the last motion sample */
  choreoTailMs: 12,
} as const;

export function feedEntranceChoreoMs(nBelow: number): number {
  const {
    revealDelayMs,
    revealDurationMs,
    belowDurationMs,
    belowStaggerMs,
    choreoTailMs,
  } = FEED_ENTRANCE;
  const revealEnd = revealDelayMs + revealDurationMs + choreoTailMs;
  const belowEnd =
    nBelow <= 0
      ? 0
      : belowDurationMs + Math.max(0, nBelow - 1) * belowStaggerMs + choreoTailMs;
  return Math.max(revealEnd, belowEnd);
}

/** When the new row isn’t in the DOM yet (slow network) — still flush toast eventually */
export const FEED_ENTRANCE_FALLBACK_MS = 2000;

/** Log sheet: start save once the panel is mostly off-screen (faster than full unmount). */
export const LOG_SHEET_SAVE_HANDOFF_MS = 260;

/**
 * If home feed isn’t mounted, toast after this delay so it still shows once.
 * Should exceed: handoff + worst-case network + choreo.
 */
export const MOVE_LOG_TOAST_FALLBACK_MS = 3200;
