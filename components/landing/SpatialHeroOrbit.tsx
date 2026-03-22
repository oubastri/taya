"use client";

import Image from "next/image";
import type { MotionValue } from "framer-motion";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useMemo } from "react";
import {
  LandingUIMockFeed,
  LandingUIMockMoves,
  LandingUIMockTeam,
} from "@/components/landing/LandingUIMocks";

export type SpatialOrbitSlide =
  | { kind: "photo"; src: string; alt: string }
  | { kind: "ui"; id: string; render: () => React.ReactNode };

const PHOTOS: { src: string; alt: string }[] = [
  {
    src: "/vibe-photos/2782c5b469f8e6870e60b95982e42448.jpg",
    alt: "Athletic training moment outdoors",
  },
  {
    src: "/vibe-photos/4718844fbdd2773f524a44a3c932faf0.webp",
    alt: "Runner in motion on a track",
  },
  {
    src: "/vibe-photos/4b1553420e55df99ae24164344a5e5cb.webp",
    alt: "Strength and conditioning session",
  },
  {
    src: "/vibe-photos/65f9e901da6fe26a7242360dd558f15d.jpg",
    alt: "Team practice and camaraderie",
  },
  {
    src: "/vibe-photos/eb70d5918e0f8987d65a7779c04a2aff.jpg",
    alt: "Outdoor fitness and movement",
  },
  {
    src: "/vibe-photos/f1ab03035d92231c45a39315d5cd76b0.jpg",
    alt: "Focused athlete in training",
  },
];

export const SPATIAL_ORBIT_SLIDES: SpatialOrbitSlide[] = [
  { kind: "photo", ...PHOTOS[0]! },
  { kind: "photo", ...PHOTOS[1]! },
  { kind: "ui", id: "feed", render: () => <LandingUIMockFeed /> },
  { kind: "photo", ...PHOTOS[2]! },
  { kind: "ui", id: "moves", render: () => <LandingUIMockMoves /> },
  { kind: "photo", ...PHOTOS[3]! },
  { kind: "ui", id: "team", render: () => <LandingUIMockTeam /> },
  { kind: "photo", ...PHOTOS[4]! },
  { kind: "photo", ...PHOTOS[5]! },
];

const DEPTH_CYCLE = [0, 18, -12, 22, -8, 14, -14, 10, -6];

const cardShellStyle: React.CSSProperties = {
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-card)",
  border: "1px solid var(--border)",
  overflow: "hidden",
  background: "var(--surface)",
};

function OrbitSlot({
  slide,
  theta,
  rotate,
  index,
  cardW,
  cardH,
  radius,
  translateZ,
}: {
  slide: SpatialOrbitSlide;
  theta: number;
  rotate: MotionValue<number>;
  index: number;
  cardW: string;
  cardH: string;
  radius: string;
  translateZ: number;
}) {
  const counterRotate = useTransform(rotate, (r) => -(r + theta));

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: cardW,
        height: cardH,
        transform: `translate(-50%, -50%) rotate(${theta}deg) translateY(calc(-1 * ${radius})) translateZ(${translateZ}px)`,
        transformOrigin: "center center",
        transformStyle: "preserve-3d",
      }}
    >
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          rotate: counterRotate,
          transformStyle: "preserve-3d",
          ...cardShellStyle,
        }}
      >
        {slide.kind === "photo" ? (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="(max-width: 480px) 24vw, 128px"
              style={{ objectFit: "cover" }}
              priority={index < 2}
            />
          </div>
        ) : (
          <div style={{ width: "100%", height: "100%" }}>{slide.render()}</div>
        )}
      </motion.div>
    </div>
  );
}

function SpatialHeroOrbitStatic({ compact }: { compact: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "center",
        alignContent: "center",
        maxWidth: compact ? 300 : 340,
        margin: "0 auto",
        transform: compact ? "scale(0.92)" : undefined,
        transformOrigin: "center center",
      }}
    >
      {SPATIAL_ORBIT_SLIDES.map((slide, i) => (
        <div
          key={slide.kind === "photo" ? slide.src : slide.id}
          style={{
            position: "relative",
            width: 88,
            aspectRatio: "3 / 4",
            transform: `rotate(${(i - 4) * 3.5}deg)`,
            ...cardShellStyle,
          }}
        >
          {slide.kind === "photo" ? (
            <Image
              src={slide.src}
              alt=""
              fill
              sizes="88px"
              style={{ objectFit: "cover" }}
              aria-hidden
            />
          ) : (
            slide.render()
          )}
        </div>
      ))}
    </div>
  );
}

function SpatialHeroOrbitMotion({ compact }: { compact: boolean }) {
  const rotate = useMotionValue(0);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  useAnimationFrame((_, delta) => {
    rotate.set((rotate.get() + delta * 0.095) % 360);
  });

  const rotateX = useSpring(useTransform(my, [-1, 1], [11, -11]), {
    stiffness: 80,
    damping: 18,
    mass: 0.4,
  });
  const rotateY = useSpring(useTransform(mx, [-1, 1], [-13, 13]), {
    stiffness: 80,
    damping: 18,
    mass: 0.4,
  });

  const n = SPATIAL_ORBIT_SLIDES.length;
  const angles = useMemo(
    () => Array.from({ length: n }, (_, i) => (360 / n) * i),
    [n],
  );

  const stageSize = compact ? "min(70vmin, 320px)" : "min(76vmin, 400px)";
  const cardW = compact ? "clamp(68px, 19vw, 100px)" : "clamp(76px, 21vw, 124px)";
  const cardH = `calc(${cardW} * 4 / 3)`;
  const radius = compact ? "clamp(88px, 28vmin, 150px)" : "clamp(104px, 31vmin, 188px)";

  const onPointerMove = (e: React.PointerEvent) => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1;
    const h = typeof window !== "undefined" ? window.innerHeight : 1;
    mx.set((e.clientX / w) * 2 - 1);
    my.set((e.clientY / h) * 2 - 1);
  };

  const onPointerLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div
      role="presentation"
      aria-hidden
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{
        width: "100%",
        maxWidth: 520,
        aspectRatio: "1",
        maxHeight: compact ? "min(40dvh, 300px)" : "min(52dvh, 420px)",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: stageSize,
          height: stageSize,
          perspective: 1100,
        }}
      >
        <motion.div
          style={{
            width: "100%",
            height: "100%",
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
        >
          <motion.div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              rotate,
              transformStyle: "preserve-3d",
            }}
          >
            {SPATIAL_ORBIT_SLIDES.map((slide, i) => (
              <OrbitSlot
                key={slide.kind === "photo" ? slide.src : slide.id}
                slide={slide}
                theta={angles[i]!}
                rotate={rotate}
                index={i}
                cardW={cardW}
                cardH={cardH}
                radius={radius}
                translateZ={DEPTH_CYCLE[i % DEPTH_CYCLE.length]!}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SpatialHeroOrbit({ compact = false }: { compact?: boolean }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <SpatialHeroOrbitStatic compact={compact} />;
  return <SpatialHeroOrbitMotion compact={compact} />;
}
