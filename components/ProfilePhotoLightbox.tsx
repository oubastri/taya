"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function ProfilePhotoLightbox({
  open,
  onClose,
  src,
  alt,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      <button
        type="button"
        className="absolute inset-0 border-0 p-0"
        onClick={onClose}
        aria-label="Close preview"
        style={{
          background: "var(--overlay)",
          cursor: "default",
          WebkitTapHighlightColor: "transparent",
        }}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          backgroundColor: "color-mix(in srgb, var(--foreground) 12%, transparent)",
          color: "var(--foreground)",
          zIndex: 1,
          WebkitTapHighlightColor: "transparent",
        }}
        className="active:scale-95"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="relative z-[1] max-h-[85vh] w-auto max-w-[min(92vw,560px)] rounded-2xl object-contain shadow-2xl"
        style={{ height: "auto" }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}
