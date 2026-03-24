"use client";

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function initialsFromName(first: string, last: string): string {
  const f = first.trim();
  const l = last.trim();
  if (f && l) return (f[0]! + l[0]!).toUpperCase();
  if (f.length >= 2) return f.slice(0, 2).toUpperCase();
  if (f.length === 1) return f.toUpperCase();
  return "?";
}

type OnboardingPhotoPlaceholderProps = {
  firstName: string;
  lastName: string;
  size?: number;
};

/** Empty avatar: vivid blurred gradient + grain, deterministic per name; initials in Lexend Deca medium. */
export function OnboardingPhotoPlaceholder({
  firstName,
  lastName,
  size = 84,
}: OnboardingPhotoPlaceholderProps) {
  const seed = `${firstName}|${lastName}`;
  const h = hashSeed(seed);
  const h1 = h % 360;
  const h2 = ((Math.imul(h, 1103515245) + 12345) >>> 0) % 360;
  const h3 = ((Math.imul(h, 2097152) + h2) >>> 0) % 360;
  const h4 = (h1 + 118 + (h % 97)) % 360;
  const angle = (h % 220) - 40;
  const initials = initialsFromName(firstName, lastName);
  const noiseSeed = h % 500;

  const noiseDataUri = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="4" stitchTiles="stitch" seed="${noiseSeed}"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity="0.55"/></svg>`,
  )}`;

  const fontSize = Math.round(size * 0.34);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 32,
        overflow: "hidden",
        position: "relative",
        background: "#12081a",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-50%",
          background: `conic-gradient(from ${angle}deg, hsl(${h1} 96% 56%), hsl(${h2} 90% 50%), hsl(${h3} 94% 52%), hsl(${h4} 88% 48%), hsl(${h1} 96% 58%))`,
          filter: "blur(36px) saturate(1.75) contrast(1.08)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-20%",
          background: `radial-gradient(ellipse 80% 70% at 30% 20%, hsl(${(h2 + 40) % 360} 100% 62% / 0.55), transparent 55%), radial-gradient(ellipse 90% 80% at 80% 90%, hsl(${(h3 + 200) % 360} 95% 45% / 0.5), transparent 50%)`,
          filter: "blur(18px)",
          mixBlendMode: "screen",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${noiseDataUri}")`,
          backgroundSize: "cover",
          opacity: 0.5,
          mixBlendMode: "overlay",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 48px rgba(0,0,0,0.18)",
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          fontWeight: 500,
          fontSize,
          letterSpacing: "-0.04em",
          color: "rgba(255,255,255,0.96)",
          textShadow:
            "0 2px 20px rgba(0,0,0,0.4), 0 0 2px rgba(0,0,0,0.35), 0 1px 0 rgba(0,0,0,0.2)",
        }}
      >
        {initials}
      </span>
    </div>
  );
}
