"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Fixed-size dot cursor for the Athletes globe (portaled to body for correct stacking).
 */
export function CustomCursor() {
  const [mode, setMode] = useState<"pending" | "on" | "off">("pending");
  const [xy, setXy] = useState({ x: 0, y: 0 });
  const [onScreen, setOnScreen] = useState(false);
  const rafRef = useRef(0);
  const latestRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse) {
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
  }, []);

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
      <div className="custom-cursor-shape" />
    </div>,
    document.body
  );
}
