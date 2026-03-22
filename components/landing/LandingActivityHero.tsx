"use client";

import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ActivityIcon, ACTIVITY_COLORS } from "@/components/ActivityIcon";
import {
  ACTIVITY_FEED_HIGHLIGHT,
  ACTIVITY_FEED_PHRASE,
  ACTIVITY_TYPES,
  type ActivityType,
} from "@/types/workout";

const sans = 'var(--font-sans), system-ui, sans-serif';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SPRING_LAYOUT = { type: "spring" as const, stiffness: 400, damping: 38, mass: 0.88 };
const STAGGER = 0.04;
const BASE_INTERVAL_MS = 3600;
const JITTER_MS = 700;

const PROFILE_PHOTOS = [
  "/profilephotos/user1.png",
  "/profilephotos/user2.png",
  "/profilephotos/user3.png",
  "/profilephotos/user4.png",
  "/profilephotos/user5.png",
  "/profilephotos/user6.jpg",
  "/profilephotos/user7.jpg",
  "/profilephotos/user8.jpg",
  "/profilephotos/user9.jpg",
  "/profilephotos/user10.jpg",
  "/profilephotos/user11.jpg",
  "/profilephotos/user12.jpg",
  "/profilephotos/user13.jpg",
  "/profilephotos/user14.jpg",
  "/profilephotos/user15.jpg",
  "/profilephotos/user16.jpg",
  "/profilephotos/user17.jpg",
  "/profilephotos/user18.jpg",
  "/profilephotos/user19.jpg",
  "/profilephotos/user20.jpg",
] as const;

const HANDLES = [
  "@paulito",
  "@marisol",
  "@kai_runs",
  "@devin.lift",
  "@noura_swims",
  "@theo.bike",
  "@sammy_yoga",
  "@ivy_tracks",
  "@marcus_w",
  "@lena_pace",
  "@rio_field",
  "@cami_flow",
  "@jules_tri",
  "@ada_strength",
  "@omar_rows",
  "@tessa_hills",
  "@vic_laps",
  "@noah_runs",
  "@mia_miles",
  "@eli_tempo",
] as const;

type HeroSlide = {
  handle: string;
  photo: string;
  activityType: ActivityType;
};

function splitFeedPhrase(type: ActivityType): { before: string; highlight: string; after: string } {
  const phrase = ACTIVITY_FEED_PHRASE[type] ?? ACTIVITY_FEED_PHRASE.other;
  const highlight = ACTIVITY_FEED_HIGHLIGHT[type] ?? ACTIVITY_FEED_HIGHLIGHT.other;
  const i = phrase.indexOf(highlight);
  if (i < 0) {
    return { before: phrase, highlight: "", after: "" };
  }
  return {
    before: phrase.slice(0, i),
    highlight,
    after: phrase.slice(i + highlight.length),
  };
}

function randomSlide(prev: HeroSlide | null): HeroSlide {
  const pick = () => ({
    handle: HANDLES[Math.floor(Math.random() * HANDLES.length)]!,
    photo: PROFILE_PHOTOS[Math.floor(Math.random() * PROFILE_PHOTOS.length)]!,
    activityType: ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)]!,
  });
  let next = pick();
  let guard = 0;
  while (
    prev &&
    next.handle === prev.handle &&
    next.photo === prev.photo &&
    next.activityType === prev.activityType &&
    guard++ < 40
  ) {
    next = pick();
  }
  return next;
}

function useCompactHero(breakpointPx: number) {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const on = () => setCompact(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [breakpointPx]);
  return compact;
}

function SlotText({
  children,
  tokenKey,
  reduceMotion,
  style,
  motionStyle,
  delay = 0,
}: {
  children: ReactNode;
  tokenKey: string;
  reduceMotion: boolean;
  style?: React.CSSProperties;
  /** Applied to the animated inner span (e.g. wrapping / alignment) */
  motionStyle?: React.CSSProperties;
  delay?: number;
}) {
  const t = reduceMotion
    ? { duration: 0.12, delay }
    : { duration: 0.5, ease: EASE, delay };

  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        verticalAlign: "baseline",
        ...style,
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={tokenKey}
          initial={reduceMotion ? { opacity: 0 } : { y: 20, opacity: 0, filter: "blur(5px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={reduceMotion ? { opacity: 0 } : { y: -14, opacity: 0, filter: "blur(4px)" }}
          transition={t}
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            willChange: reduceMotion ? undefined : "transform, opacity, filter",
            ...motionStyle,
          }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function SlotAvatar({
  src,
  tokenKey,
  reduceMotion,
  sizeCss,
  delay = 0,
}: {
  src: string;
  tokenKey: string;
  reduceMotion: boolean;
  sizeCss: string;
  delay?: number;
}) {
  const t = reduceMotion
    ? { duration: 0.12, delay }
    : { duration: 0.58, ease: EASE, delay };

  return (
    <span
      style={{
        position: "relative",
        width: sizeCss,
        height: sizeCss,
        flexShrink: 0,
        borderRadius: "clamp(12px, 3.2vw, 16px)",
        overflow: "hidden",
        background: "var(--avatar-placeholder-bg)",
        boxShadow:
          "0 0 0 2px var(--surface), 0 0 0 3px color-mix(in srgb, var(--foreground) 10%, transparent), 0 8px 20px rgba(0,0,0,0.08)",
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={tokenKey}
          initial={reduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0, rotate: -4 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { scale: 0.94, opacity: 0, rotate: 3 }}
          transition={t}
          style={{
            position: "absolute",
            inset: 0,
            display: "block",
            willChange: reduceMotion ? undefined : "transform, opacity",
          }}
        >
          <Image src={src} alt="" fill sizes="96px" style={{ objectFit: "cover" }} />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function SlotActivityIcon({
  activityType,
  tokenKey,
  reduceMotion,
  boxCss,
  iconSize,
  delay = 0,
}: {
  activityType: ActivityType;
  tokenKey: string;
  reduceMotion: boolean;
  boxCss: string;
  iconSize: number;
  delay?: number;
}) {
  const t = reduceMotion
    ? { duration: 0.12, delay }
    : { duration: 0.52, ease: EASE, delay };
  const tint = ACTIVITY_COLORS[activityType] ?? ACTIVITY_COLORS.other;

  return (
    <span
      style={{
        position: "relative",
        width: boxCss,
        height: boxCss,
        flexShrink: 0,
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={tokenKey}
          initial={reduceMotion ? { opacity: 0 } : { y: 16, opacity: 0, scale: 0.88 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: -12, opacity: 0, scale: 0.9 }}
          transition={t}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "clamp(12px, 3vw, 16px)",
            background: `color-mix(in srgb, ${tint} 20%, var(--card-icon-bg))`,
            border: `1px solid color-mix(in srgb, ${tint} 38%, var(--border))`,
            boxShadow: "0 1px 0 color-mix(in srgb, var(--foreground) 6%, transparent)",
            willChange: reduceMotion ? undefined : "transform, opacity",
          }}
        >
          <ActivityIcon type={activityType} size={iconSize} />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function PhraseContent({
  phrase,
}: {
  phrase: { before: string; highlight: string; after: string };
}) {
  return (
    <>
      <span>{phrase.before}</span>
      {phrase.highlight ? (
        <span style={{ color: "var(--accent)", fontWeight: 600 }}>{phrase.highlight}</span>
      ) : null}
      <span>{phrase.after}</span>
    </>
  );
}

export default function LandingActivityHero() {
  const compact = useCompactHero(640);
  const reduceMotion = useReducedMotion();
  const [slide, setSlide] = useState<HeroSlide>(() => randomSlide(null));
  const tokenKey = `${slide.handle}|${slide.activityType}|${slide.photo}`;
  const phrase = splitFeedPhrase(slide.activityType);
  const fullPhrase = ACTIVITY_FEED_PHRASE[slide.activityType] ?? ACTIVITY_FEED_PHRASE.other;

  const tickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schedule = useCallback(() => {
    if (tickRef.current) clearTimeout(tickRef.current);
    const ms = BASE_INTERVAL_MS + Math.random() * JITTER_MS;
    tickRef.current = setTimeout(() => {
      setSlide((prev) => randomSlide(prev));
      schedule();
    }, ms);
  }, []);

  useEffect(() => {
    schedule();
    return () => {
      if (tickRef.current) clearTimeout(tickRef.current);
    };
  }, [schedule]);

  const layoutTransition = reduceMotion ? { duration: 0.15 } : SPRING_LAYOUT;
  const d1 = reduceMotion ? 0 : STAGGER;
  const d2 = reduceMotion ? 0 : STAGGER * 2;
  const d3 = reduceMotion ? 0 : STAGGER * 3;

  const avatarPx = compact ? "clamp(48px, 12.5vw, 64px)" : "clamp(56px, 10vw, 80px)";
  const iconBox = compact ? "clamp(44px, 11vw, 56px)" : "clamp(50px, 9vw, 64px)";
  const iconInner = compact ? 26 : 30;

  const fontHandle = compact ? "clamp(1.05rem, 4.2vw, 1.3rem)" : "clamp(1.2rem, 2.4vw, 2.85rem)";
  const fontPhrase = compact ? "clamp(0.92rem, 3.9vw, 1.15rem)" : "clamp(1.12rem, 2.1vw, 2.45rem)";

  const cardStyle: React.CSSProperties = {
    borderRadius: compact ? 22 : 28,
    background: "var(--surface-elevated)",
    border: "1px solid var(--border)",
    boxShadow:
      "0 1px 0 color-mix(in srgb, var(--foreground) 6%, transparent), 0 22px 56px -16px rgba(0,0,0,0.14), 0 10px 28px -12px rgba(0,0,0,0.08)",
    maxWidth: "100%",
  };

  return (
    <LayoutGroup id="landing-activity-hero">
      <p className="sr-only" aria-live="polite">
        {slide.handle} {fullPhrase}
      </p>
      <div
        style={{
          width: "100%",
          maxWidth: compact ? 400 : 920,
          margin: "0 auto",
          padding: "0 2px",
          boxSizing: "border-box",
        }}
      >
        <motion.div layout transition={layoutTransition} style={cardStyle}>
          {compact ? (
            <div
              style={{
                padding: "20px 16px 22px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  width: "100%",
                }}
              >
                <SlotText
                  tokenKey={tokenKey}
                  reduceMotion={!!reduceMotion}
                  delay={0}
                  style={{ fontFamily: sans }}
                  motionStyle={{ fontSize: fontHandle, fontWeight: 600, letterSpacing: "-0.04em", color: "var(--foreground)" }}
                >
                  <span>{slide.handle}</span>
                </SlotText>
                <SlotAvatar
                  src={slide.photo}
                  tokenKey={tokenKey}
                  reduceMotion={!!reduceMotion}
                  sizeCss={avatarPx}
                  delay={d1}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  gap: "8px 10px",
                  width: "100%",
                }}
              >
                <SlotText
                  tokenKey={`${tokenKey}-phrase`}
                  reduceMotion={!!reduceMotion}
                  delay={d2}
                  style={{ fontFamily: sans, maxWidth: "100%", justifyContent: "center" }}
                  motionStyle={{
                    fontSize: fontPhrase,
                    fontWeight: 500,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.4,
                    color: "var(--foreground)",
                    whiteSpace: "normal",
                    textAlign: "center",
                    maxWidth: "min(100%, 320px)",
                  }}
                >
                  <PhraseContent phrase={phrase} />
                </SlotText>
                <SlotActivityIcon
                  activityType={slide.activityType}
                  tokenKey={tokenKey}
                  reduceMotion={!!reduceMotion}
                  boxCss={iconBox}
                  iconSize={iconInner}
                  delay={d3}
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "clamp(10px, 1.8vw, 18px)",
                padding: "clamp(18px, 2.5vw, 26px) clamp(20px, 3vw, 32px)",
                boxSizing: "border-box",
              }}
            >
              <motion.div layout transition={layoutTransition} style={{ display: "inline-flex", alignItems: "baseline" }}>
                <SlotText
                  tokenKey={tokenKey}
                  reduceMotion={!!reduceMotion}
                  delay={0}
                  style={{ fontFamily: sans }}
                  motionStyle={{
                    fontSize: fontHandle,
                    fontWeight: 600,
                    letterSpacing: "-0.045em",
                    color: "var(--foreground)",
                  }}
                >
                  <span>{slide.handle}</span>
                </SlotText>
              </motion.div>
              <motion.div layout transition={layoutTransition} style={{ display: "flex", alignItems: "center" }}>
                <SlotAvatar
                  src={slide.photo}
                  tokenKey={tokenKey}
                  reduceMotion={!!reduceMotion}
                  sizeCss={avatarPx}
                  delay={d1}
                />
              </motion.div>
              <motion.div layout transition={layoutTransition} style={{ display: "inline-flex", alignItems: "baseline", minWidth: 0 }}>
                <SlotText
                  tokenKey={`${tokenKey}-phrase`}
                  reduceMotion={!!reduceMotion}
                  delay={d2}
                  style={{ fontFamily: sans }}
                  motionStyle={{
                    fontSize: fontPhrase,
                    fontWeight: 500,
                    letterSpacing: "-0.035em",
                    lineHeight: 1.08,
                    color: "var(--foreground)",
                  }}
                >
                  <PhraseContent phrase={phrase} />
                </SlotText>
              </motion.div>
              <motion.div layout transition={layoutTransition} style={{ display: "flex", alignItems: "center" }}>
                <SlotActivityIcon
                  activityType={slide.activityType}
                  tokenKey={tokenKey}
                  reduceMotion={!!reduceMotion}
                  boxCss={iconBox}
                  iconSize={iconInner}
                  delay={d3}
                />
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </LayoutGroup>
  );
}
