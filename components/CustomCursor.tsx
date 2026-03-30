"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

let siteCursorSuppressed = false;
const siteCursorListeners = new Set<() => void>();

function subscribeSiteCursor(s: () => void) {
  siteCursorListeners.add(s);
  return () => siteCursorListeners.delete(s);
}

function getSiteCursorSuppressed() {
  return siteCursorSuppressed;
}

/** Unauthenticated / marketing surfaces hide the site cursor so the immersive globe stays calm. */
export function setSiteCustomCursorSuppressed(on: boolean) {
  if (siteCursorSuppressed === on) return;
  siteCursorSuppressed = on;
  siteCursorListeners.forEach((l) => l());
}

const POINTER_ROLES = new Set([
  "button",
  "link",
  "tab",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "switch",
  "checkbox",
  "radio",
  "slider",
  "spinbutton",
]);

function isInteractiveElement(el: Element): boolean {
  const tag = el.tagName;
  if (tag === "A" && el.hasAttribute("href")) return true;
  if (tag === "BUTTON") {
    const b = el as HTMLButtonElement;
    return !b.disabled;
  }
  if (tag === "INPUT") {
    const inp = el as HTMLInputElement;
    if (inp.disabled) return false;
    const type = inp.type;
    if (type === "hidden" || type === "file") return false;
    return true;
  }
  if (tag === "TEXTAREA" || tag === "SELECT") {
    return !(el as HTMLTextAreaElement | HTMLSelectElement).disabled;
  }
  if (tag === "OPTION") return true;
  if (tag === "LABEL") return true;
  if (tag === "SUMMARY") return true;
  const role = el.getAttribute("role");
  if (role && POINTER_ROLES.has(role)) return true;
  if (el.hasAttribute("onclick")) return true;
  const ti = el.getAttribute("tabindex");
  if (ti !== null && ti !== "-1") return true;
  if ((el as HTMLElement).isContentEditable) return false;

  const c = window.getComputedStyle(el).cursor;
  if (c === "pointer") return true;
  return false;
}

function wantsPointerVisual(el: Element | null): boolean {
  if (!el || el === document.documentElement) return false;
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const c = window.getComputedStyle(node).cursor;
    if (c === "text" || c === "vertical-text" || c === "not-allowed") return false;
    if (isInteractiveElement(node)) return true;
    node = node.parentElement;
  }
  return false;
}

/**
 * Site-wide dot cursor (same look as the Athletes globe). On clickable targets it eases into a minimal pointer.
 */
export function CustomCursor() {
  const [mode, setMode] = useState<"pending" | "on" | "off">("pending");
  const [xy, setXy] = useState({ x: 0, y: 0 });
  const [onScreen, setOnScreen] = useState(false);
  const [pointer, setPointer] = useState(false);
  const rafRef = useRef(0);
  const latestRef = useRef({ x: 0, y: 0 });

  const suppressed = useSyncExternalStore(
    subscribeSiteCursor,
    getSiteCursorSuppressed,
    () => false,
  );

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse || suppressed) {
      setMode("off");
      return;
    }

    const root = document.documentElement;
    root.setAttribute("data-custom-cursor", "on");
    setMode("on");

    const flush = () => {
      const { x, y } = latestRef.current;
      setXy({ x, y });

      const off =
        x < 0 ||
        y < 0 ||
        x > window.innerWidth ||
        y > window.innerHeight;
      if (off) {
        setOnScreen(false);
        return;
      }
      setOnScreen(true);

      const under = document.elementFromPoint(x, y);
      setPointer(wantsPointerVisual(under));
    };

    const onMove = (e: MouseEvent) => {
      latestRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        flush();
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      root.removeAttribute("data-custom-cursor");
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [suppressed]);

  if (mode !== "on" || typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-hidden
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        transform: `translate3d(${xy.x}px, ${xy.y}px, 0)`,
        pointerEvents: "none",
        zIndex: 2147483647,
        opacity: onScreen ? 1 : 0,
        transition: "opacity 0.15s ease",
      }}
    >
      <div className="custom-cursor-visual" data-pointer={pointer ? "true" : "false"}>
        <div className="custom-cursor-shape" />
        <div className="custom-cursor-mark" aria-hidden>
          <img
            className="custom-cursor-mark-img"
            src="/icons/cursor.svg"
            alt=""
            width={15}
            height={15}
            draggable={false}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
