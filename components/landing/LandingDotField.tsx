"use client";

/**
 * Athletes-page-adjacent spatial field: dotted plane with a soft “bowl” fade,
 * without pulling in the full canvas globe.
 */
export function LandingDotField() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-15%",
          backgroundImage:
            "radial-gradient(circle, var(--foreground-faint) 1.1px, transparent 1.2px)",
          backgroundSize: "28px 28px",
          opacity: 0.55,
          maskImage:
            "radial-gradient(ellipse 72% 65% at 50% 42%, #000 0%, #000 35%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 72% 65% at 50% 42%, #000 0%, #000 35%, transparent 72%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 85% 70% at 50% 100%, var(--accent-soft) 0%, transparent 55%)",
          opacity: 0.85,
        }}
      />
    </div>
  );
}
