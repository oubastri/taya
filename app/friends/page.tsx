"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFriends } from "@/hooks/use-friends";
import { useUser } from "@/hooks/use-user";
import { AthletesCounter } from "@/components/AthletesCounter";
import type { FriendData } from "@/types/user";

// ─── layout constants ──────────────────────────────────────────────────────────
const NAV_HEIGHT = 54;
const FONT = '"Lexend Deca", var(--font-sans), sans-serif';
const GOLDEN = 2.39996323;

// Friend card dimensions (design units = pixels at zoom 1)
const CARD_W = 120;
const CARD_H = 168;
// "YOU" card is larger + centred
const YOU_W = 150;
const YOU_H = 210;

// Spiral geometry — radius grows as √(i+1) so density stays roughly constant
const SPIRAL_MIN_R = 230; // px from YOU centre to first friend card
const SPIRAL_STEP = 192; // additional radius per √‐unit
// Canvas padding beyond the outermost card
const CANVAS_PAD = CARD_W + 60;
// At the initial "fit-all" zoom, cards appear at least this many screen-px wide
const MIN_CARD_SCREEN_PX = 54;

const ZOOM_MIN = 0.08;
const ZOOM_MAX = 3.5;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ─── golden-ratio spiral position (centred at origin) ──────────────────────────
function spiralPos(i: number): { x: number; y: number } {
  const r = SPIRAL_MIN_R + Math.sqrt(i + 1) * SPIRAL_STEP;
  return {
    x: Math.cos(i * GOLDEN) * r,
    y: Math.sin(i * GOLDEN) * r * 0.82, // slight vertical squeeze
  };
}

// Deterministic organic tilt — each card gets a stable ±5.5° rotation
function cardTilt(i: number): number {
  return (((i * 97 + 13) % 110) - 55) / 10;
}

// ─── types ────────────────────────────────────────────────────────────────────
type PersonEntry = {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  following: boolean;
  isYou: boolean;
};

interface View {
  px: number; // canvas origin x in screen-space
  py: number; // canvas origin y in screen-space
  z: number;  // zoom
}

// ─── AvatarFill ───────────────────────────────────────────────────────────────
// Fills its parent 100%×100% — used inside the photo section of each card
function AvatarFill({ avatarUrl, name, fw }: { avatarUrl?: string; name: string; fw: number }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    );
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.04)",
        fontSize: fw * 0.26,
        fontWeight: 800,
        color: "var(--accent)",
        fontFamily: FONT,
      }}
    >
      {initials}
    </div>
  );
}

// ─── PersonCard ───────────────────────────────────────────────────────────────
// A polaroid-style card: photo on top, name strip on bottom, slight tilt.
function PersonCard({
  person,
  x,
  y,
  tilt,
  zoom,
  onClick,
}: {
  person: PersonEntry;
  x: number;
  y: number;
  tilt: number;
  zoom: number;
  onClick: () => void;
}) {
  const showLabel = zoom >= 0.46;
  const photoH = Math.round(CARD_H * 0.63);
  const labelH = CARD_H - photoH;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: CARD_W,
        height: CARD_H,
        transform: `translate(-50%, -50%) rotate(${tilt}deg)`,
        borderRadius: 13,
        background: "var(--surface)",
        border: person.following
          ? "1.5px solid var(--accent)"
          : "1px solid rgba(255,255,255,0.09)",
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* photo */}
      <div
        style={{
          height: photoH,
          overflow: "hidden",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <AvatarFill avatarUrl={person.avatarUrl} name={person.name} fw={CARD_W} />
      </div>

      {/* name strip */}
      <div
        style={{
          height: labelH,
          padding: "6px 9px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 2,
          opacity: showLabel ? 1 : 0,
          transition: "opacity 0.22s ease",
        }}
      >
        <span
          style={{
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 700,
            color: "var(--foreground)",
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {person.name}
        </span>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 9.5,
            fontWeight: 500,
            color: "var(--foreground-subtle)",
            letterSpacing: "-0.01em",
          }}
        >
          @{person.handle}
        </span>
      </div>
    </div>
  );
}

// ─── YouCard ──────────────────────────────────────────────────────────────────
// Larger, centered, accent border, "YOU" badge — non-interactive.
function YouCard({
  person,
  x,
  y,
  zoom,
}: {
  person: PersonEntry;
  x: number;
  y: number;
  zoom: number;
}) {
  const showLabel = zoom >= 0.36;
  const photoH = Math.round(YOU_H * 0.63);
  const labelH = YOU_H - photoH;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: YOU_W,
        height: YOU_H,
        transform: "translate(-50%, -50%)",
        borderRadius: 17,
        background: "var(--surface)",
        border: "2px solid var(--accent)",
        overflow: "hidden",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      {/* YOU badge */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 2,
          background: "var(--accent)",
          borderRadius: 100,
          padding: "2px 8px",
          fontFamily: FONT,
          fontSize: 7.5,
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: "#fff",
          textTransform: "uppercase",
        }}
      >
        YOU
      </div>

      {/* photo */}
      <div
        style={{
          height: photoH,
          overflow: "hidden",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <AvatarFill avatarUrl={person.avatarUrl} name={person.name} fw={YOU_W} />
      </div>

      {/* name strip */}
      <div
        style={{
          height: labelH,
          padding: "7px 10px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 2,
          opacity: showLabel ? 1 : 0,
          transition: "opacity 0.22s ease",
        }}
      >
        <span
          style={{
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--foreground)",
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {person.name}
        </span>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 10.5,
            fontWeight: 500,
            color: "var(--foreground-subtle)",
            letterSpacing: "-0.01em",
          }}
        >
          @{person.handle}
        </span>
      </div>
    </div>
  );
}

// ─── SearchOverlay ────────────────────────────────────────────────────────────
function SearchOverlay({
  friends,
  onClose,
  onSelect,
}: {
  friends: FriendData[];
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(q) || f.handle.toLowerCase().includes(q)
    );
  }, [friends, query]);

  return (
    <>
      <style>{`#taya-search-input::placeholder { color: rgba(0,0,0,0.28); }`}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "max(env(safe-area-inset-top), 20px) 20px 0",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <input
            id="taya-search-input"
            ref={inputRef}
            type="text"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              padding: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: FONT,
              fontSize: "clamp(26px, 8vw, 34px)",
              fontWeight: 500,
              letterSpacing: "-0.07em",
              color: "#000",
              caretColor: "var(--accent)",
              minWidth: 0,
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={onClose}
            style={{
              flexShrink: 0,
              width: NAV_HEIGHT,
              height: NAV_HEIGHT,
              borderRadius: "100px",
              backdropFilter: "blur(24px) saturate(1.8)",
              WebkitBackdropFilter: "blur(24px) saturate(1.8)",
              background: "rgba(255,255,255,0.58)",
              border: "1px solid rgba(255,255,255,0.55)",
              boxShadow:
                "0 0 0 0.5px rgba(0,0,0,0.09), inset 0 1px 0 rgba(255,255,255,0.85), 0 4px 20px rgba(0,0,0,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
            aria-label="Close search"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(0,0,0,0.7)"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            marginTop: 24,
            touchAction: "pan-y",
          }}
        >
          {results.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelect(f.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                width: "100%",
                padding: "11px 20px",
                background: "none",
                border: "none",
                borderBottom:
                  i < results.length - 1
                    ? "0.5px solid rgba(0,0,0,0.08)"
                    : "none",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "#eee",
                }}
              >
                {f.avatarUrl ? (
                  <img
                    src={f.avatarUrl}
                    alt={f.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 800,
                      color: "var(--accent)",
                      fontFamily: FONT,
                    }}
                  >
                    {f.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: FONT,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#000",
                    letterSpacing: "-0.02em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.name}
                </p>
                <p
                  style={{
                    margin: "1px 0 0",
                    fontFamily: FONT,
                    fontSize: 13,
                    color: "rgba(0,0,0,0.4)",
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                  }}
                >
                  @{f.handle}
                </p>
              </div>
              {f.following && (
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--accent)",
                    letterSpacing: "-0.01em",
                    flexShrink: 0,
                  }}
                >
                  Following
                </span>
              )}
            </button>
          ))}

          {results.length === 0 && (
            <p
              style={{
                margin: "32px 20px 0",
                fontFamily: FONT,
                fontSize: 15,
                color: "rgba(0,0,0,0.3)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              No one found
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// ─── FriendsPage ──────────────────────────────────────────────────────────────
export default function FriendsPage() {
  const router = useRouter();
  const { friends, hydrated } = useFriends();
  const { user } = useUser();
  const [searchOpen, setSearchOpen] = useState(false);

  const N = friends.length;

  // ── Canvas geometry (recalculates only when friend count changes) ───────────
  // All positions are in canvas-space coordinates.
  // CX/CY is where YOU sits; friend i is at canvasPositions[i].
  const { VWIDTH, VHEIGHT, CX, CY, canvasPositions } = useMemo(() => {
    const rawPos = Array.from({ length: N }, (_, i) => spiralPos(i));
    const maxR =
      rawPos.length > 0
        ? Math.max(...rawPos.map((p) => Math.hypot(p.x, p.y)))
        : SPIRAL_MIN_R + SPIRAL_STEP;
    const HALF = maxR + CANVAS_PAD;
    const VW = HALF * 2;
    const VH = HALF * 2;
    return {
      VWIDTH: VW,
      VHEIGHT: VH,
      CX: HALF,
      CY: HALF,
      canvasPositions: rawPos.map((p) => ({ x: HALF + p.x, y: HALF + p.y })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N]);

  // ── View state ────────────────────────────────────────────────────────────
  const [view, setView] = useState<View>({ px: 0, py: 0, z: 1 });
  const viewRef = useRef<View>({ px: 0, py: 0, z: 1 });
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Set initial view: centered on YOU, zoom fits content with min card size ─
  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Fit-all zoom
    const fitZ = Math.min(
      (vw * 0.88) / VWIDTH,
      ((vh - 160) * 0.88) / VHEIGHT
    );
    // Floor: cards always readable
    const minZ = MIN_CARD_SCREEN_PX / CARD_W;
    const z = clamp(Math.max(fitZ, minZ), ZOOM_MIN, ZOOM_MAX);
    const v: View = {
      // Center YOU on screen (YOU is at canvas position CX, CY)
      px: vw / 2 - CX * z,
      py: vh / 2 - CY * z,
      z,
    };
    viewRef.current = v;
    setView(v);
  }, [VWIDTH, VHEIGHT, CX, CY]);

  const commit = useCallback((v: View) => {
    viewRef.current = v;
    setView(v);
  }, []);

  // ── Inertia refs ──────────────────────────────────────────────────────────
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const prevPinchDist = useRef(0);
  const velRef = useRef({ x: 0, y: 0 });
  const ptrHistory = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const pinchHistory = useRef<Array<{ dist: number; t: number }>>([]);
  const zoomVelRef = useRef(1);
  const zoomMidRef = useRef({ x: 0, y: 0 });
  const rafPanRef = useRef<number | null>(null);
  const rafZoomRef = useRef<number | null>(null);
  const rafWheelRef = useRef<number | null>(null);
  const wheelTargetRef = useRef<number | null>(null);
  const wheelCursorRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);

  const stopInertia = useCallback(() => {
    if (rafPanRef.current !== null) {
      cancelAnimationFrame(rafPanRef.current);
      rafPanRef.current = null;
    }
    if (rafZoomRef.current !== null) {
      cancelAnimationFrame(rafZoomRef.current);
      rafZoomRef.current = null;
    }
    if (rafWheelRef.current !== null) {
      cancelAnimationFrame(rafWheelRef.current);
      rafWheelRef.current = null;
    }
    velRef.current = { x: 0, y: 0 };
    zoomVelRef.current = 1;
    wheelTargetRef.current = null;
  }, []);

  // Pan inertia
  const startInertia = useCallback(() => {
    const FRICTION = 0.95;
    const step = () => {
      velRef.current.x *= FRICTION;
      velRef.current.y *= FRICTION;
      if (
        Math.abs(velRef.current.x) < 0.25 &&
        Math.abs(velRef.current.y) < 0.25
      ) {
        rafPanRef.current = null;
        return;
      }
      const { px, py, z } = viewRef.current;
      commit({ px: px + velRef.current.x, py: py + velRef.current.y, z });
      rafPanRef.current = requestAnimationFrame(step);
    };
    rafPanRef.current = requestAnimationFrame(step);
  }, [commit]);

  // Pinch-zoom inertia
  const startZoomInertia = useCallback(() => {
    const FRICTION = 0.95;
    const step = () => {
      zoomVelRef.current = 1 + (zoomVelRef.current - 1) * FRICTION;
      if (Math.abs(zoomVelRef.current - 1) < 0.0001) {
        rafZoomRef.current = null;
        return;
      }
      const { px, py, z } = viewRef.current;
      const newZ = clamp(z * zoomVelRef.current, ZOOM_MIN, ZOOM_MAX);
      const ratio = newZ / z;
      const { x: mx, y: my } = zoomMidRef.current;
      commit({
        px: mx - (mx - px) * ratio,
        py: my - (my - py) * ratio,
        z: newZ,
      });
      rafZoomRef.current = requestAnimationFrame(step);
    };
    rafZoomRef.current = requestAnimationFrame(step);
  }, [commit]);

  // Smooth wheel-zoom ease
  const startWheelEase = useCallback(() => {
    if (rafWheelRef.current !== null) return;
    const EASE = 0.13;
    const step = () => {
      const target = wheelTargetRef.current;
      if (target === null) {
        rafWheelRef.current = null;
        return;
      }
      const { z, px, py } = viewRef.current;
      const { x: cx, y: cy } = wheelCursorRef.current;
      const diff = target - z;
      if (Math.abs(diff) < 0.0006) {
        const r = target / z;
        commit({ z: target, px: cx - (cx - px) * r, py: cy - (cy - py) * r });
        wheelTargetRef.current = null;
        rafWheelRef.current = null;
        return;
      }
      const newZ = z + diff * EASE;
      const r = newZ / z;
      commit({ z: newZ, px: cx - (cx - px) * r, py: cy - (cy - py) * r });
      rafWheelRef.current = requestAnimationFrame(step);
    };
    rafWheelRef.current = requestAnimationFrame(step);
  }, [commit]);

  // Wheel events — non-passive so we can preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (rafPanRef.current) {
        cancelAnimationFrame(rafPanRef.current);
        rafPanRef.current = null;
        velRef.current = { x: 0, y: 0 };
      }
      if (rafZoomRef.current) {
        cancelAnimationFrame(rafZoomRef.current);
        rafZoomRef.current = null;
        zoomVelRef.current = 1;
      }
      const factor = e.ctrlKey ? 0.012 : 0.0008;
      const prev = wheelTargetRef.current ?? viewRef.current.z;
      wheelTargetRef.current = clamp(
        prev * (1 + -e.deltaY * factor),
        ZOOM_MIN,
        ZOOM_MAX
      );
      wheelCursorRef.current = { x: e.clientX, y: e.clientY };
      startWheelEase();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [startWheelEase]);

  // ── Pointer handlers ──────────────────────────────────────────────────────
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      stopInertia();
      ptrHistory.current = [];
      pinchHistory.current = [];
      didDragRef.current = false;
      ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      if (ptrs.current.size === 2) {
        const [a, b] = Array.from(ptrs.current.values());
        prevPinchDist.current = Math.hypot(b.x - a.x, b.y - a.y);
      }
    },
    [stopInertia]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const prev = ptrs.current.get(e.pointerId);
      if (!prev) return;
      ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const { px, py, z } = viewRef.current;

      if (ptrs.current.size === 1) {
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) didDragRef.current = true;

        const now = performance.now();
        ptrHistory.current.push({ x: e.clientX, y: e.clientY, t: now });
        ptrHistory.current = ptrHistory.current.filter((p) => now - p.t < 80);
        commit({ px: px + dx, py: py + dy, z });
      } else if (ptrs.current.size === 2) {
        const [a, b] = Array.from(ptrs.current.values());
        const newDist = Math.hypot(b.x - a.x, b.y - a.y);
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const scale = prevPinchDist.current > 0 ? newDist / prevPinchDist.current : 1;
        const newZ = clamp(z * scale, ZOOM_MIN, ZOOM_MAX);
        const ratio = newZ / z;
        prevPinchDist.current = newDist;
        zoomMidRef.current = { x: midX, y: midY };

        const now = performance.now();
        pinchHistory.current.push({ dist: newDist, t: now });
        pinchHistory.current = pinchHistory.current.filter((p) => now - p.t < 80);

        commit({
          px: midX - (midX - px) * ratio,
          py: midY - (midY - py) * ratio,
          z: newZ,
        });
      }
    },
    [commit]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const prevSize = ptrs.current.size;
      ptrs.current.delete(e.pointerId);
      if (ptrs.current.size < 2) prevPinchDist.current = 0;

      // Pinch zoom inertia on finger lift
      if (prevSize === 2 && ptrs.current.size === 1) {
        const h = pinchHistory.current;
        if (h.length >= 2) {
          const last = h[h.length - 1];
          const base =
            h.filter((p) => p.t >= last.t - 40)[0] ?? h[h.length - 2];
          const dt = last.t - base.t;
          if (dt > 0 && base.dist > 0) {
            const logVel =
              ((Math.log(last.dist) - Math.log(base.dist)) / dt) * (1000 / 60);
            const clamped = clamp(Math.exp(logVel), 0.88, 1.12);
            if (Math.abs(clamped - 1) > 0.002) {
              zoomVelRef.current = clamped;
              startZoomInertia();
            }
          }
        }
        pinchHistory.current = [];
        ptrHistory.current = [];
      }

      // Pan inertia on last finger up
      if (ptrs.current.size === 0) {
        const history = ptrHistory.current;
        if (history.length >= 2) {
          const last = history[history.length - 1];
          const base =
            history.filter((p) => p.t >= last.t - 30)[0] ??
            history[history.length - 2];
          const dt = last.t - base.t;
          if (dt > 0) {
            const FRAME_MS = 1000 / 60;
            const vx = ((last.x - base.x) / dt) * FRAME_MS;
            const vy = ((last.y - base.y) / dt) * FRAME_MS;
            const speed = Math.hypot(vx, vy);
            const MAX_SPEED = 40;
            const s = speed > MAX_SPEED ? MAX_SPEED / speed : 1;
            velRef.current = { x: vx * s, y: vy * s };
            startInertia();
          }
        }
        ptrHistory.current = [];
      }
    },
    [startInertia, startZoomInertia]
  );

  const handleSelect = useCallback(
    (id: string) => {
      router.push(`/profile/${id}`);
    },
    [router]
  );

  const { px, py, z } = view;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "var(--background)",
      }}
    >
      {/* ── dot grid ──────────────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.028) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          pointerEvents: "none",
        }}
      />

      {/* ── infinite canvas ────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: "absolute",
          inset: 0,
          touchAction: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: VWIDTH,
            height: VHEIGHT,
            transform: `translate(${px}px, ${py}px) scale(${z})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          {/* Connection lines: YOU → followed athletes */}
          <svg
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: VWIDTH,
              height: VHEIGHT,
              pointerEvents: "none",
              overflow: "visible",
            }}
          >
            {friends.map((f, i) =>
              f.following ? (
                <line
                  key={f.id}
                  x1={CX}
                  y1={CY}
                  x2={canvasPositions[i].x}
                  y2={canvasPositions[i].y}
                  stroke="var(--accent)"
                  strokeWidth={1.5}
                  strokeOpacity={0.18}
                  strokeDasharray="4 8"
                />
              ) : null
            )}
          </svg>

          {/* Friend cards */}
          {friends.map((f, i) => (
            <PersonCard
              key={f.id}
              person={{ ...f, isYou: false }}
              x={canvasPositions[i].x}
              y={canvasPositions[i].y}
              tilt={cardTilt(i)}
              zoom={z}
              onClick={() => {
                if (didDragRef.current) return;
                handleSelect(f.id);
              }}
            />
          ))}

          {/* YOU card — centred at CX, CY */}
          <YouCard
            person={{
              id: user.id,
              name: user.name,
              handle: user.handle,
              avatarUrl: user.avatarUrl,
              following: false,
              isYou: true,
            }}
            x={CX}
            y={CY}
            zoom={z}
          />
        </div>
      </div>

      {/* ── edge vignette — cards fade toward screen edges for spatial depth ── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 38%, var(--background) 100%)",
          opacity: 0.62,
          pointerEvents: "none",
          zIndex: 8,
        }}
      />

      {/* ── loading skeleton ─────────────────────────────────────────────── */}
      {!hydrated && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10,
            background: "var(--background)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="skeleton"
            style={{ width: 80, height: 80, borderRadius: "50%" }}
          />
        </div>
      )}

      {/* ── title / counter ──────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: "max(env(safe-area-inset-top), 20px)",
          left: "50%",
          transform: "translateX(-50%)",
          height: NAV_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 49,
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <AthletesCounter count={N + 1} />
        </div>
      </div>

      {/* ── search button ────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        style={{
          position: "fixed",
          top: "max(env(safe-area-inset-top), 20px)",
          right: 16,
          zIndex: 50,
          width: NAV_HEIGHT,
          height: NAV_HEIGHT,
          borderRadius: "100px",
          backdropFilter: "blur(24px) saturate(1.8)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8)",
          background: "rgba(255,255,255,0.58)",
          border: "1px solid rgba(255,255,255,0.55)",
          boxShadow:
            "0 0 0 0.5px rgba(0,0,0,0.09), inset 0 1px 0 rgba(255,255,255,0.85), 0 4px 20px rgba(0,0,0,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
        aria-label="Search people"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(0,0,0,0.7)"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
      </button>

      {/* ── search overlay ───────────────────────────────────────────────── */}
      {searchOpen && (
        <SearchOverlay
          friends={friends}
          onClose={() => setSearchOpen(false)}
          onSelect={(id) => {
            setSearchOpen(false);
            handleSelect(id);
          }}
        />
      )}
    </div>
  );
}
