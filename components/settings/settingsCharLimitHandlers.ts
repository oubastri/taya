import type { ClipboardEvent, KeyboardEvent } from "react";

export function playCharLimitShake(el: HTMLElement | null) {
  if (!el) return;
  el.classList.remove("settings-char-limit-shake");
  void el.offsetWidth;
  el.classList.add("settings-char-limit-shake");
}

const CHAR_LIMIT_PASS_KEYS = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Escape",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

/** True if input was blocked and counter shook (at hard limit). */
export function handleCharLimitKeyDown(
  e: KeyboardEvent<HTMLTextAreaElement>,
  max: number,
  counterEl: HTMLElement | null,
): boolean {
  const el = e.currentTarget;
  if (el.value.length < max) return false;
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (CHAR_LIMIT_PASS_KEYS.has(e.key)) return false;
  const s0 = el.selectionStart;
  const s1 = el.selectionEnd;
  if (s0 !== null && s1 !== null && s0 !== s1) return false;
  if (e.key === "Enter" || e.key.length === 1) {
    playCharLimitShake(counterEl);
    e.preventDefault();
    return true;
  }
  return false;
}

export function handleCharLimitPaste(
  e: ClipboardEvent<HTMLTextAreaElement>,
  max: number,
  counterEl: HTMLElement | null,
) {
  const el = e.currentTarget;
  if (el.value.length < max) return;
  if (el.selectionStart !== el.selectionEnd) return;
  playCharLimitShake(counterEl);
  e.preventDefault();
}
