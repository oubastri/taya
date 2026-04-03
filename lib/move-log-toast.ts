function bravoMessage(handle: string) {
  const h = handle.replace(/^@/, "").trim() || "there";
  return `Bravo @${h} keep inspiring us`;
}

let queuedHandle: string | null = null;

/** Call when a move is saved; flush after feed entrance or via fallback timeout. */
export function queueMoveLogToast(handle: string) {
  queuedHandle = handle;
}

/** Fire the toast if a handle was queued; clears queue. */
export function flushMoveLogToast(notify: (message: string) => void) {
  if (!queuedHandle) return;
  const h = queuedHandle;
  queuedHandle = null;
  notify(bravoMessage(h));
}
