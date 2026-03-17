"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFriends } from "@/hooks/use-friends";
import { useUser } from "@/hooks/use-user";
import { AthletesCounter } from "@/components/AthletesCounter";
import type { FriendData, User } from "@/types/user";

// ─── virtual canvas ───────────────────────────────────────────────────────────
const VWIDTH = 2000;
const VHEIGHT = 1800;
const CX = VWIDTH / 2;
const CY = VHEIGHT / 2;
const GOLDEN = 2.39996323;
const ZOOM_MIN = 0.15;
const ZOOM_MAX = 3;
// tab bar nav pill height (6px padding * 2 + nav-item 42px = 54px)
const NAV_HEIGHT = 54;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function nodePos(i: number) {
  const r = 90 + Math.sqrt(i + 1) * 130;
  return {
    x: CX + Math.cos(i * GOLDEN) * r,
    y: CY + Math.sin(i * GOLDEN) * r * 0.82,
  };
}

interface View {
  px: number;
  py: number;
  z: number;
}

// ─── Avatar (sharp at any zoom) ────────────────────────────────────────────────
function Avatar({
  avatarUrl,
  name,
  size,
}: {
  avatarUrl?: string;
  name: string;
  size: number;
}) {
  if (avatarUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          background: "#111",
          flexShrink: 0,
        }}
      >
        <img
          src={avatarUrl}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
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
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.28,
        fontWeight: 800,
        color: "var(--accent)",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ─── AvatarNode ───────────────────────────────────────────────────────────────
function AvatarNode({
  friend,
  x,
  y,
  zoom,
  onClick,
}: {
  friend: FriendData;
  x: number;
  y: number;
  zoom: number;
  onClick: () => void;
}) {
  const showLabel = zoom >= 0.65;

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
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 7,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
      }}
    >
      {/* ring */}
      <div
        style={{
          borderRadius: "50%",
          padding: friend.following ? 2.5 : 1.5,
          background: friend.following ? "var(--accent)" : "rgba(255,255,255,0.18)",
        }}
      >
        <Avatar avatarUrl={friend.avatarUrl} name={friend.name} size={56} />
      </div>

      {/* labels */}
      <div
        style={{
          opacity: showLabel ? 1 : 0,
          transition: "opacity 0.22s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pointerEvents: "none",
          gap: 2,
          transform: "translateZ(0)",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--foreground)",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
        >
          {friend.name}
        </span>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 500,
            color: "var(--foreground-subtle)",
            whiteSpace: "nowrap",
          }}
        >
          @{friend.handle}
        </span>
      </div>
    </div>
  );
}

// ─── YouNode ──────────────────────────────────────────────────────────────────
function YouNode({ user, zoom }: { user: User; zoom: number }) {
  const showLabel = zoom >= 0.5;

  return (
    <div
      style={{
        position: "absolute",
        left: CX,
        top: CY,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 7,
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: "var(--accent)",
          textTransform: "uppercase",
          opacity: showLabel ? 1 : 0,
          transition: "opacity 0.22s ease",
        }}
      >
        YOU
      </span>

      <div
        style={{
          borderRadius: "50%",
          padding: 3,
          background: "var(--accent)",
        }}
      >
        <Avatar avatarUrl={user.avatarUrl} name={user.name} size={68} />
      </div>

      <div
        style={{
          opacity: showLabel ? 1 : 0,
          transition: "opacity 0.22s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          transform: "translateZ(0)",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--foreground)",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
        >
          {user.name}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: "var(--foreground-subtle)",
            whiteSpace: "nowrap",
          }}
        >
          @{user.handle}
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
    // small delay so the overlay animation settles first
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
        {/* ── top bar ─────────────────────────────────────────────────────── */}
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
              fontFamily: "var(--font-sans), sans-serif",
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

          {/* X button — exact same style as the search button */}
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
              background: "rgba(255, 255, 255, 0.58)",
              border: "1px solid rgba(255, 255, 255, 0.55)",
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

        {/* ── results list ────────────────────────────────────────────────── */}
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

  const [view, setView] = useState<View>({ px: 0, py: 0, z: 1 });
  const viewRef = useRef<View>({ px: 0, py: 0, z: 1 });
  const [searchOpen, setSearchOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // pointer tracking
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const prevPinchDist = useRef(0);

  // pan inertia
  const rafPanRef = useRef<number | null>(null);
  const velRef = useRef({ x: 0, y: 0 });
  const ptrHistory = useRef<Array<{ x: number; y: number; t: number }>>([]);

  // pinch zoom inertia
  const rafZoomRef = useRef<number | null>(null);
  const zoomVelRef = useRef(1); // multiplicative scale per frame (1 = stopped)
  const zoomMidRef = useRef({ x: 0, y: 0 });
  const pinchHistory = useRef<Array<{ dist: number; t: number }>>([]);

  // wheel zoom — smooth ease-to-target
  const rafWheelRef = useRef<number | null>(null);
  const wheelTargetRef = useRef<number | null>(null);
  const wheelCursorRef = useRef({ x: 0, y: 0 });

  // ── initial centering ──────────────────────────────────────────────────────
  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const z = clamp(
      Math.min(vw / VWIDTH, vh / VHEIGHT) * 0.92,
      ZOOM_MIN,
      ZOOM_MAX
    );
    const v: View = {
      px: (vw - VWIDTH * z) / 2,
      py: (vh - VHEIGHT * z) / 2,
      z,
    };
    viewRef.current = v;
    setView(v);
  }, []);

  const commit = useCallback((v: View) => {
    viewRef.current = v;
    setView(v);
  }, []);

  // ── inertia helpers ────────────────────────────────────────────────────────
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

  const startInertia = useCallback(() => {
    const FRICTION = 0.95;
    const MIN_VEL = 0.25;

    const step = () => {
      velRef.current.x *= FRICTION;
      velRef.current.y *= FRICTION;

      if (
        Math.abs(velRef.current.x) < MIN_VEL &&
        Math.abs(velRef.current.y) < MIN_VEL
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

  const startZoomInertia = useCallback(() => {
    const FRICTION = 0.95; // same glide as pan
    const MIN_DELTA = 0.0001;

    const step = () => {
      zoomVelRef.current = 1 + (zoomVelRef.current - 1) * FRICTION;

      if (Math.abs(zoomVelRef.current - 1) < MIN_DELTA) {
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

  // Smooth wheel zoom — lerp actual zoom toward an accumulated target each frame.
  // New wheel events just update the target; the loop is already running.
  const startWheelEase = useCallback(() => {
    if (rafWheelRef.current !== null) return;
    const EASE = 0.13; // fraction of remaining distance per frame → glidy feel
    const MIN_DIFF = 0.0006;

    const step = () => {
      const target = wheelTargetRef.current;
      if (target === null) {
        rafWheelRef.current = null;
        return;
      }

      const { z, px, py } = viewRef.current;
      const { x: cx, y: cy } = wheelCursorRef.current;
      const diff = target - z;

      if (Math.abs(diff) < MIN_DIFF) {
        // snap to exact target, anchored to cursor
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

  // ── wheel zoom — non-passive, smooth ease-to-target ───────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Kill pan + pinch inertia, but leave the wheel ease loop running
      if (rafPanRef.current) { cancelAnimationFrame(rafPanRef.current); rafPanRef.current = null; velRef.current = { x: 0, y: 0 }; }
      if (rafZoomRef.current) { cancelAnimationFrame(rafZoomRef.current); rafZoomRef.current = null; zoomVelRef.current = 1; }

      const { z } = viewRef.current;
      const factor = e.ctrlKey ? 0.012 : 0.0008;
      const scaleFactor = 1 + (-e.deltaY * factor);
      // Stack onto the current target so rapid events accumulate smoothly
      const prev = wheelTargetRef.current ?? z;
      wheelTargetRef.current = clamp(prev * scaleFactor, ZOOM_MIN, ZOOM_MAX);
      wheelCursorRef.current = { x: e.clientX, y: e.clientY };
      startWheelEase();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [startWheelEase]);

  // ── pointer events ─────────────────────────────────────────────────────────
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      stopInertia();
      ptrHistory.current = [];
      pinchHistory.current = [];
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

        const now = performance.now();
        ptrHistory.current.push({ x: e.clientX, y: e.clientY, t: now });
        ptrHistory.current = ptrHistory.current.filter((p) => now - p.t < 80);

        commit({ px: px + dx, py: py + dy, z });
      } else if (ptrs.current.size === 2) {
        const [a, b] = Array.from(ptrs.current.values());
        const newDist = Math.hypot(b.x - a.x, b.y - a.y);
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const scale =
          prevPinchDist.current > 0 ? newDist / prevPinchDist.current : 1;
        const newZ = clamp(z * scale, ZOOM_MIN, ZOOM_MAX);
        const ratio = newZ / z;
        prevPinchDist.current = newDist;

        // record pinch distance history for zoom inertia
        const now = performance.now();
        pinchHistory.current.push({ dist: newDist, t: now });
        pinchHistory.current = pinchHistory.current.filter(
          (p) => now - p.t < 80
        );
        // keep the midpoint fresh — we'll use the last one on release
        zoomMidRef.current = { x: midX, y: midY };

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

      if (prevSize === 2 && ptrs.current.size === 1) {
        // one pinch finger lifted — launch zoom inertia, keep remaining finger fresh
        const h = pinchHistory.current;
        if (h.length >= 2) {
          const last = h[h.length - 1];
          const cutoff = last.t - 40;
          const recent = h.filter((p) => p.t >= cutoff);
          const base = recent.length >= 2 ? recent[0] : h[h.length - 2];
          const dt = last.t - base.t;
          if (dt > 0 && base.dist > 0) {
            // log-space velocity → multiplicative scale per frame
            const logVel = (Math.log(last.dist) - Math.log(base.dist)) / dt * (1000 / 60);
            const frameScale = Math.exp(logVel);
            // only launch if the gesture had meaningful speed; cap so it can't fly away
            const clamped = clamp(frameScale, 0.88, 1.12);
            if (Math.abs(clamped - 1) > 0.002) {
              zoomVelRef.current = clamped;
              startZoomInertia();
            }
          }
        }
        pinchHistory.current = [];
        // let the remaining finger start a fresh pan arc
        ptrHistory.current = [];
      }

      // launch pan inertia on last-finger-up
      if (ptrs.current.size === 0) {
        const history = ptrHistory.current;
        if (history.length >= 2) {
          const last = history[history.length - 1];
          const cutoff = last.t - 30;
          const recent = history.filter((p) => p.t >= cutoff);
          const base = recent.length >= 2 ? recent[0] : history[history.length - 2];
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

  const positions = useMemo(() => friends.map((_, i) => nodePos(i)), [friends]);

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
      {/* ── canvas ──────────────────────────────────────────────────────────── */}
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
          {/* dot grid */}
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

          {friends.map((f, i) => (
            <AvatarNode
              key={f.id}
              friend={f}
              x={positions[i].x}
              y={positions[i].y}
              zoom={z}
              onClick={() => handleSelect(f.id)}
            />
          ))}

          <YouNode user={user} zoom={z} />
        </div>
      </div>

      {/* ── loading ──────────────────────────────────────────────────────────── */}
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

      {/* ── title ────────────────────────────────────────────────────────────── */}
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
          <AthletesCounter count={friends.length + 1} />
        </div>
      </div>

      {/* ── search button — matches liquid-glass-nav ────────────────────────── */}
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
          background: "rgba(255, 255, 255, 0.58)",
          border: "1px solid rgba(255, 255, 255, 0.55)",
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

      {/* ── search overlay ────────────────────────────────────────────────────── */}
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
