"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { AthletesCounter } from "@/components/AthletesCounter";
import { UserAvatar } from "@/components/UserAvatar";
import {
  SHEET_DISMISS_DRAG_PX,
  SHEET_DRAG_REGION_STYLE,
  SHEET_EXIT_MS,
  SHEET_SPRING,
  SHEET_TRANSFORM_SETTLED_CENTERED,
} from "@/lib/sheetMotion";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useSheetScrollPullDown } from "@/hooks/useSheetScrollPullDown";
import type { FriendData } from "@/types/user";
import {
  SPHERE,
  SphereMotion,
  buildPeriodGrid,
  cellHash,
  clamp,
  easeOutBack,
  lens,
  userAtCell,
  warp,
  type MotionSnapshot,
  type PeriodGrid,
} from "@/components/athletes/sphereField";

// ─── chrome constants ─────────────────────────────────────────────────────────
const NAV_HEIGHT = 54;
const FONT = '"Lexend Deca", -apple-system, sans-serif';

const APP_TOP_BAR_GLASS_BTN: CSSProperties = {
  width: NAV_HEIGHT,
  height: NAV_HEIGHT,
  borderRadius: "100px",
  backdropFilter: "blur(24px) saturate(1.8)",
  WebkitBackdropFilter: "blur(24px) saturate(1.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  padding: 0,
  flexShrink: 0,
};

// ─── types ────────────────────────────────────────────────────────────────────
export type AthletesGlobeUser = {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  isYou: boolean;
  /** Full line, e.g. "@paulito went for a run" — reserved for future label modes */
  activityLine?: string;
  /** Structured moves — reserved for future label modes */
  movesStats?: { total: number; month: number; week: number };
  /** Fallback if movesStats omitted */
  statsLine?: string;
};

type UserEntry = AthletesGlobeUser;

export type AthletesGlobeViewProps = {
  mode: "app" | "landing";
  users: AthletesGlobeUser[];
  hydrated: boolean;
  friendsForSearch?: FriendData[];
  onNavigateToProfile: (userId: string) => void;
  /** Default true. When false, only avatar tiles are drawn (no names or handles). */
  showAvatarLabels?: boolean;
  /**
   * Landing: second canvas draws only dots above `chromeOverlay`, while avatars
   * (+ vignette) stay below it — scrims hide photos but membrane dots stay
   * visible on the fade.
   */
  dotsOverlayAboveChrome?: boolean;
  /** Rendered between avatar and dot canvases (fixed, pointer-events: none). */
  chromeOverlay?: ReactNode;
  /** App mode: open the search sheet once on mount (e.g. dev menu `?sheet=search`). */
  openSearchOnMount?: boolean;
  /**
   * True while something opaque covers the globe (e.g. the landing manifesto):
   * the field stops ticking and drawing until uncovered.
   */
  paused?: boolean;
};

// ─── small helpers ────────────────────────────────────────────────────────────
// Draw a rounded rectangle path using arcTo (universally supported)
function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  const minR = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + minR, y);
  ctx.lineTo(x + w - minR, y);
  ctx.arcTo(x + w, y, x + w, y + minR, minR);
  ctx.lineTo(x + w, y + h - minR);
  ctx.arcTo(x + w, y + h, x + w - minR, y + h, minR);
  ctx.lineTo(x + minR, y + h);
  ctx.arcTo(x, y + h, x, y + h - minR, minR);
  ctx.lineTo(x, y + minR);
  ctx.arcTo(x, y, x + minR, y, minR);
  ctx.closePath();
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const ACCENT_HEX = "#01EF54";
const ACCENT_RGB = { r: 0x01, g: 0xef, b: 0x54 };

type RGB = { r: number; g: number; b: number };

/** Parse a CSS color custom-property value (#rgb / #rrggbb / rgb()) to RGB. */
function parseColor(value: string, fallback: RGB): RGB {
  const v = value.trim();
  if (v.startsWith("#")) {
    const hex = v.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length >= 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
  }
  const m = v.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  return fallback;
}

const rgba = (c: RGB, a: number) => `rgba(${c.r},${c.g},${c.b},${a})`;

/**
 * Persists landing pan/zoom + entrance state across HomeLanding
 * unmount/remount (navigating to /login or /signup and back).
 */
type LandingSphereSnapshot = MotionSnapshot & { settled: boolean };
let landingSphereSnapshot: LandingSphereSnapshot | null = null;
// ─── SearchSheet ──────────────────────────────────────────────────────────────
function SearchSheet({
  friends,
  onClose,
  onSelect,
}: {
  friends: FriendData[];
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startY: 0, dy: 0 });

  // Trigger enter animation on next paint
  useEffect(() => {
    let cancelled = false;
    const outer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setOpen(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(outer);
    };
  }, []);

  // Focus input after sheet settles
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 420);
    return () => clearTimeout(t);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(onClose, SHEET_EXIT_MS);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useLockBodyScroll(true);

  const endVerticalSheetDrag = useCallback(() => {
    const { dy } = dragRef.current;

    if (dy > SHEET_DISMISS_DRAG_PX) {
      const vh = window.innerHeight;
      if (sheetRef.current) {
        sheetRef.current.style.transition = `transform ${SHEET_SPRING}`;
        sheetRef.current.style.transform = `translateX(-50%) translateY(${vh}px)`;
      }
      if (scrimRef.current) {
        scrimRef.current.style.transition = `opacity ${SHEET_SPRING}`;
        scrimRef.current.style.opacity = "0";
      }
      window.setTimeout(onClose, SHEET_EXIT_MS);
    } else if (sheetRef.current) {
      sheetRef.current.style.transition = `transform ${SHEET_SPRING}`;
      sheetRef.current.style.transform = "translateX(-50%) translateY(0)";
        window.setTimeout(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transition = "";
            sheetRef.current.style.transform = SHEET_TRANSFORM_SETTLED_CENTERED;
          }
        }, SHEET_EXIT_MS);
    }
    dragRef.current.dy = 0;
  }, [onClose]);

  const onHandleDown = (e: React.PointerEvent) => {
    dragRef.current = { active: true, startY: e.clientY, dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };

  const onHandleMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dy = Math.max(0, e.clientY - dragRef.current.startY);
    dragRef.current.dy = dy;
    if (sheetRef.current) sheetRef.current.style.transform = `translateX(-50%) translateY(${dy}px)`;
  };

  const onHandleUp = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    endVerticalSheetDrag();
  };

  const onScrollEdgePullMove = useCallback((dy: number) => {
    dragRef.current.dy = dy;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
      sheetRef.current.style.transform = `translateX(-50%) translateY(${dy}px)`;
    }
  }, []);

  useSheetScrollPullDown({
    enabled: open,
    scrollRef: listScrollRef,
    onPullMove: onScrollEdgePullMove,
    onPullCommit: endVerticalSheetDrag,
  });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) => f.name.toLowerCase().includes(q) || f.handle.toLowerCase().includes(q),
    );
  }, [friends, query]);

  return (
    <>
      <style>{`#taya-search-input::placeholder { color: var(--input-placeholder); }`}</style>

      {/* Scrim */}
      <div
        ref={scrimRef}
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99,
          background: "var(--overlay)",
          opacity: open ? 1 : 0,
          transition: `opacity ${SHEET_SPRING}`,
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          width: "100%",
          maxWidth: 428,
          height: "85svh",
          zIndex: 100,
          background: "var(--sheet-bg)",
          borderRadius: "32px 32px 0 0",
          boxShadow: "var(--sheet-shadow)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "var(--font-sans), sans-serif",
          transform: open ? "translateX(-50%)" : "translateX(-50%) translateY(100%)",
          transition: `transform ${SHEET_SPRING}`,
          overscrollBehavior: "contain",
        }}
      >
        {/* Drag handle */}
        <div
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          style={SHEET_DRAG_REGION_STYLE}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "var(--drag-handle)",
            }}
          />
        </div>

        {/* Close button — anchored to top-right of sheet */}
        <button
          type="button"
          onClick={close}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1,
            width: NAV_HEIGHT,
            height: NAV_HEIGHT,
            borderRadius: "100px",
            background: "var(--close-btn-bg)",
            border: "1px solid var(--close-btn-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            flexShrink: 0,
          }}
          aria-label="Close search"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--close-btn-icon)"
            strokeWidth="2.6"
            strokeLinecap="round"
            aria-hidden
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        {/* Input row */}
        <div
          style={{
            padding: "16px 84px 18px 24px",
            flexShrink: 0,
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
              width: "100%",
              padding: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(26px, 7vw, 32px)",
              fontWeight: 500,
              letterSpacing: "-0.04em",
              color: "var(--input-color)",
              caretColor: "var(--input-color)",
              minWidth: 0,
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        {/* Separator */}
        <div style={{ height: "0.5px", background: "var(--separator)", flexShrink: 0 }} />

        {/* Results */}
        <div
          ref={listScrollRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorY: "contain",
            touchAction: "pan-y",
          }}
        >
          {results.map((f, i) => (
            <div
              key={f.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(f.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(f.id);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                width: "100%",
                padding: "13px 24px",
                background: "none",
                border: "none",
                borderBottom:
                  i < results.length - 1 ? "0.5px solid var(--row-border)" : "none",
                cursor: "pointer",
                fontFamily: "var(--font-sans), sans-serif",
                textAlign: "left",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "var(--avatar-placeholder-bg)",
                }}
              >
                {f.avatarUrl ? (
                  <UserAvatar avatarUrl={f.avatarUrl} name={f.name} fillParent />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--avatar-placeholder-text)",
                      fontFamily: "var(--font-sans), sans-serif",
                    }}
                  >
                    {getInitials(f.name)}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--foreground)",
                    letterSpacing: "-0.025em",
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
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 13,
                    color: "var(--foreground-subtle)",
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
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--foreground-subtle)",
                    letterSpacing: "-0.01em",
                    flexShrink: 0,
                  }}
                >
                  Following
                </span>
              )}
            </div>
          ))}

          {results.length === 0 && (
            <p
              style={{
                margin: "36px 24px 0",
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 15,
                color: "var(--foreground-muted)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              No one found
            </p>
          )}

          <div style={{ height: "max(env(safe-area-inset-bottom), 24px)" }} />
        </div>
      </div>
    </>
  );
}

// ─── AthletesGlobeView ────────────────────────────────────────────────────────

// ─── the sphere ───────────────────────────────────────────────────────────────
/**
 * Canvas-rendered port of the iOS athlete sphere (AthleteGridView.swift):
 * an infinite pannable field of avatars over a dotted membrane, warped so the
 * plane reads as the face of a globe. Physics, projection, and constants live
 * in sphereField.ts; this component owns canvases, pointers, and drawing.
 *
 * Layers (inside a fixed inset-0 wrapper that paints --background):
 *   app:     dots canvas z0 → avatar canvas z1 (vignette + avatars)
 *   landing: avatar canvas z1 → chromeOverlay z2 (scrims) → dots canvas z3
 * The avatar canvas is transparent and carries the micro-tilt CSS transform.
 */

type PlacedAvatar = {
  userIdx: number;
  x: number;        // screen center
  y: number;
  size: number;     // screen px
  alpha: number;
  worldCX: number;  // world-space center (for the magnetic settle)
  worldCY: number;
  isYou: boolean;
};

export default function AthletesGlobeView({
  mode,
  users: allUsers,
  hydrated,
  friendsForSearch = [],
  onNavigateToProfile,
  showAvatarLabels = true,
  dotsOverlayAboveChrome = false,
  chromeOverlay = null,
  openSearchOnMount = false,
  paused = false,
}: AthletesGlobeViewProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (mode !== "app" || !openSearchOnMount) return;
    setSearchOpen(true);
  }, [mode, openSearchOnMount]);

  // Hide bottom nav while search sheet is open (in-app athletes tab only)
  useEffect(() => {
    if (mode !== "app") return;
    document.body.classList.toggle("search-open", searchOpen);
    return () => document.body.classList.remove("search-open");
  }, [mode, searchOpen]);

  // ── core refs ─────────────────────────────────────────────────────────────
  const avatarCanvasRef = useRef<HTMLCanvasElement>(null);
  const dotsCanvasRef = useRef<HTMLCanvasElement>(null);
  const motionRef = useRef<SphereMotion | null>(null);
  if (!motionRef.current) motionRef.current = new SphereMotion();

  const imagesRef = useRef(new Map<string, HTMLImageElement>());
  const gridRef = useRef<PeriodGrid | null>(null);
  const placedRef = useRef<PlacedAvatar[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const colorsRef = useRef({ bg: { r: 243, g: 243, b: 243 }, fg: { r: 10, g: 10, b: 10 } });
  const entranceStartRef = useRef<number | null>(null);
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const didInitViewRef = useRef(false);

  // Latest props for the rAF loop without re-subscribing.
  const stateRef = useRef({ mode, allUsers, showAvatarLabels, paused, hydrated, onNavigateToProfile });
  stateRef.current = { mode, allUsers, showAvatarLabels, paused, hydrated, onNavigateToProfile };

  // Cell geometry: label mode gets taller cells so names never collide.
  const tileDims = useCallback(() => {
    const labels = stateRef.current.showAvatarLabels;
    return labels
      ? { tw: 170, th: 215, labelPad: 45 }
      : { tw: SPHERE.tile, th: SPHERE.tile, labelPad: 0 };
  }, []);

  /** Deterministic per-cell jitter, adapted to the active cell size. */
  const jitterFor = useCallback((col: number, row: number) => {
    const { tw, th, labelPad } = tileDims();
    const h = cellHash(col, row);
    const rx = Math.max(8, tw - SPHERE.avatarSize - 20);
    const ry = Math.max(8, th - SPHERE.avatarSize - 20 - labelPad);
    return {
      jx: 10 + ((h >>> 8) & 0xffff) / 65535 * rx,
      jy: 10 + ((h >>> 16) & 0xffff) / 65535 * ry,
    };
  }, [tileDims]);

  // ── reduced motion ────────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      motionRef.current!.reducedMotion = mq.matches;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // ── image preloading — crossOrigin required for canvas drawImage ─────────
  useEffect(() => {
    allUsers.forEach((u) => {
      if (!u.avatarUrl || imagesRef.current.has(u.id)) return;
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = u.avatarUrl;
      imagesRef.current.set(u.id, img);
    });
  }, [allUsers]);

  // ── period grid + entrance ────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    gridRef.current = buildPeriodGrid(allUsers.length, w, h);
    if (allUsers.length > 0 && entranceStartRef.current === null) {
      entranceStartRef.current = performance.now() / 1000 + 0.1;
    }
  }, [allUsers, hydrated, showAvatarLabels]);

  // ── initial view (once) ───────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated || didInitViewRef.current) return;
    didInitViewRef.current = true;
    const motion = motionRef.current!;

    if (mode === "landing" && landingSphereSnapshot) {
      motion.restore(landingSphereSnapshot);
      // Returning visitor within the session: field arrives already settled.
      entranceStartRef.current = performance.now() / 1000 - 10;
      return;
    }
    // Center the origin cell's avatar (slot 0 = self in app mode).
    const j = jitterFor(0, 0);
    motion.panX = -(j.jx + SPHERE.avatarSize / 2);
    motion.panY = -(j.jy + SPHERE.avatarSize / 2);
    const z = mode === "landing" ? 1.1 : 1.0;
    motion.zoom = clamp(z, SPHERE.minZoom, SPHERE.maxZoom);
    motion.zoomTarget = motion.zoom;
  }, [hydrated, mode, jitterFor]);

  // Save the landing view across unmount/remount.
  useEffect(() => {
    if (mode !== "landing") return;
    const motion = motionRef.current!;
    return () => {
      landingSphereSnapshot = { ...motion.snapshot(), settled: true };
    };
  }, [mode]);

  // ── pointers ──────────────────────────────────────────────────────────────
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; midX: number; midY: number } | null>(null);
  const downRef = useRef({ x: 0, y: 0, moved: 0 });
  const nowSec = () => performance.now() / 1000;

  const hitTest = useCallback((sx: number, sy: number): PlacedAvatar | null => {
    let best: PlacedAvatar | null = null;
    let bestD = Infinity;
    for (const p of placedRef.current) {
      const d = Math.hypot(sx - p.x, sy - p.y);
      if (d <= p.size / 2 + SPHERE.touchPadding && d < bestD) {
        best = p;
        bestD = d;
      }
    }
    return best;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size === 1) {
      motionRef.current!.beginDrag(nowSec());
      downRef.current = { x: e.clientX, y: e.clientY, moved: 0 };
      pointerPosRef.current = { x: e.clientX, y: e.clientY };
    } else if (ptrs.current.size === 2) {
      const [a, b] = Array.from(ptrs.current.values());
      motionRef.current!.beginPinch();
      pinchRef.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
      };
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const motion = motionRef.current!;
    if (!ptrs.current.has(e.pointerId)) {
      // Hover (app mode): pointer cursor over a tappable avatar.
      if (stateRef.current.mode === "app") {
        const hit = hitTest(e.clientX, e.clientY);
        e.currentTarget.style.cursor = hit && !hit.isYou ? "pointer" : "";
      }
      return;
    }
    const prev = ptrs.current.get(e.pointerId)!;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (ptrs.current.size === 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      motion.dragBy(dx, dy, nowSec());
      downRef.current.moved += Math.hypot(dx, dy);
      pointerPosRef.current = { x: e.clientX, y: e.clientY };
    } else if (ptrs.current.size === 2 && pinchRef.current) {
      const [a, b] = Array.from(ptrs.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const { w, h } = sizeRef.current;
      if (pinchRef.current.dist > 0) {
        motion.zoomBy(dist / pinchRef.current.dist, midX, midY, w / 2, h / 2);
      }
      motion.panX += (midX - pinchRef.current.midX) / motion.zoom;
      motion.panY += (midY - pinchRef.current.midY) / motion.zoom;
      pinchRef.current = { dist, midX, midY };
    }
  }, [hitTest]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.delete(e.pointerId);
    const motion = motionRef.current!;

    if (pinchRef.current) {
      if (ptrs.current.size < 2) {
        motion.endPinch();
        pinchRef.current = null;
        if (ptrs.current.size === 1) {
          // One finger stays down: resume dragging from here.
          motion.beginDrag(nowSec());
          const rest = Array.from(ptrs.current.values())[0];
          downRef.current = { x: rest.x, y: rest.y, moved: 99 }; // never a tap
        }
      }
      return;
    }

    if (ptrs.current.size === 0) {
      const wasTap = downRef.current.moved <= SPHERE.tapSlop;
      motion.endDrag(nowSec());
      if (wasTap) {
        // Hit at the DOWN location — matches iOS.
        const hit = hitTest(downRef.current.x, downRef.current.y);
        if (hit && stateRef.current.mode === "app") {
          const u = stateRef.current.allUsers[hit.userIdx];
          if (u && !u.isYou) stateRef.current.onNavigateToProfile(u.id);
        }
      }
    }
  }, [hitTest]);

  const onPointerLeaveGlobe = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.style.cursor = "";
  }, []);

  // ── canvases, theme, wheel, and the render loop ───────────────────────────
  useEffect(() => {
    const avatarCanvas = avatarCanvasRef.current;
    const dotsCanvas = dotsCanvasRef.current;
    if (!avatarCanvas || !dotsCanvas) return;
    const motion = motionRef.current!;

    function readColors() {
      const cs = getComputedStyle(document.documentElement);
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      colorsRef.current = {
        bg: parseColor(cs.getPropertyValue("--background"), dark
          ? { r: 13, g: 13, b: 13 } : { r: 243, g: 243, b: 243 }),
        fg: parseColor(cs.getPropertyValue("--foreground"), dark
          ? { r: 255, g: 255, b: 255 } : { r: 10, g: 10, b: 10 }),
      };
    }

    function resizeBoth() {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      sizeRef.current = { w, h };
      for (const c of [avatarCanvas!, dotsCanvas!]) {
        c.width = w * dpr;
        c.height = h * dpr;
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
      }
      if (stateRef.current.hydrated) {
        gridRef.current = buildPeriodGrid(stateRef.current.allUsers.length, w, h);
      }
      readColors();
    }

    resizeBoth();
    window.addEventListener("resize", resizeBoth);

    const themeObserver = new MutationObserver(readColors);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class", "style"],
    });

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0008));
      const { w, h } = sizeRef.current;
      motion.zoomBy(factor, e.clientX, e.clientY, w / 2, h / 2);
      motion.zoomTarget = clamp(motion.zoom, SPHERE.minZoom, SPHERE.maxZoom);
    };
    avatarCanvas.addEventListener("wheel", onWheel, { passive: false });

    // ── per-frame placement + draw ──────────────────────────────────────────
    function placeAvatars(now: number): PlacedAvatar[] {
      const grid = gridRef.current;
      const users = stateRef.current.allUsers;
      if (!grid || users.length === 0) return [];
      const { w, h } = sizeRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const rimX = w * SPHERE.rimFractionX;
      const rimY = h * SPHERE.rimFractionY;
      const { panX, panY, zoom } = motion;
      const labels = stateRef.current.showAvatarLabels;
      const tw = labels ? 170 : SPHERE.tile;
      const th = labels ? 215 : SPHERE.tile;
      const labelPad = labels ? 45 : 0;

      // Screen → world bounds, inflated by the worst-case rim decompression:
      // world = (screen - center) / (zoom · compress) - pan, compress ≥ 0.78.
      const margin = SPHERE.avatarSize * 2;
      const inv = 1 / (zoom * (1 - SPHERE.rimCompression));
      const colMin = Math.floor((((0 - margin) - cx) * inv - panX) / tw) - 1;
      const colMax = Math.ceil((((w + margin) - cx) * inv - panX) / tw) + 1;
      const rowMin = Math.floor((((0 - margin) - cy) * inv - panY) / th) - 1;
      const rowMax = Math.ceil((((h + margin) - cy) * inv - panY) / th) + 1;

      const entrance = entranceStartRef.current;
      const reduced = motion.reducedMotion;
      const placed: PlacedAvatar[] = [];

      for (let row = rowMin; row <= rowMax; row++) {
        for (let col = colMin; col <= colMax; col++) {
          const idx = userAtCell(grid, col, row);
          if (idx < 0 || idx >= users.length) continue;
          const hsh = cellHash(col, row);
          const rx = Math.max(8, tw - SPHERE.avatarSize - 20);
          const ry = Math.max(8, th - SPHERE.avatarSize - 20 - labelPad);
          const jx = 10 + ((hsh >>> 8) & 0xffff) / 65535 * rx;
          const jy = 10 + ((hsh >>> 16) & 0xffff) / 65535 * ry;
          const worldCX = col * tw + jx + SPHERE.avatarSize / 2;
          const worldCY = row * th + jy + SPHERE.avatarSize / 2;

          const wp = warp(worldCX, worldCY, panX, panY, zoom, cx, cy, rimX, rimY);
          if (wp.scale <= 0.01 || wp.alpha <= 0.01) continue;
          if (wp.x < -margin || wp.x > w + margin || wp.y < -margin || wp.y > h + margin) continue;

          let scale = wp.scale;
          let alpha = wp.alpha;
          const boost = lens(wp.x, wp.y, cx, cy);
          scale *= 1 + SPHERE.lensBoost * boost;
          alpha += (1 - alpha) * SPHERE.lensLift * boost;

          if (entrance !== null && !reduced) {
            const delay = (hsh & 7) * SPHERE.entranceStepDelay;
            const e = clamp((now - entrance - delay) / SPHERE.entranceDuration, 0, 1);
            if (e <= 0) continue;
            scale *= easeOutBack(e);
            alpha *= e;
          }

          placed.push({
            userIdx: idx,
            x: wp.x,
            y: wp.y,
            size: SPHERE.avatarSize * scale * zoom,
            alpha,
            worldCX,
            worldCY,
            isYou: users[idx].isYou,
          });
        }
      }
      return placed;
    }

    function drawAvatars(placed: PlacedAvatar[]) {
      const ctx = avatarCanvas!.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const { w, h } = sizeRef.current;
      const users = stateRef.current.allUsers;
      const labels = stateRef.current.showAvatarLabels;
      const { bg, fg } = colorsRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Rim vignette: sinks the field's edge into the page background.
      // Elliptical, matching the warp's per-axis rim (strong top/bottom).
      const cx = w / 2;
      const cy = h / 2;
      const rimX = w * SPHERE.rimFractionX;
      const rimY = h * SPHERE.rimFractionY;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(rimX, rimY);
      const grad = ctx.createRadialGradient(0, 0, 0.5, 0, 0, 1.15);
      grad.addColorStop(0, rgba(bg, 0));
      grad.addColorStop(1, rgba(bg, 0.45));
      ctx.fillStyle = grad;
      ctx.fillRect(-2, -2, 4, 4);
      ctx.restore();

      for (const p of placed) {
        const u = users[p.userIdx];
        const size = p.size;
        const x = p.x - size / 2;
        const y = p.y - size / 2;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        roundedRectPath(ctx, x, y, size, size, size * 0.29);
        ctx.clip();
        const img = u.avatarUrl ? imagesRef.current.get(u.id) : undefined;
        if (img && img.complete && img.naturalWidth > 0) {
          // Cover-crop the source to a square.
          const s = Math.min(img.naturalWidth, img.naturalHeight);
          ctx.drawImage(
            img,
            (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s,
            x, y, size, size,
          );
        } else {
          ctx.fillStyle = rgba(fg, 0.08);
          ctx.fillRect(x, y, size, size);
          ctx.fillStyle = rgba(fg, 0.55);
          ctx.font = `600 ${Math.max(10, size * 0.3)}px ${FONT}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(getInitials(u.name), p.x, p.y);
        }
        ctx.restore();

        if (labels && p.alpha > 0.08 && size > 26) {
          const fs = clamp(size / SPHERE.avatarSize, 0.7, 1.1);
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
          ctx.fillStyle = rgba(fg, 1);
          ctx.font = `600 ${12 * fs}px ${FONT}`;
          ctx.fillText(u.name, p.x, p.y + size / 2 + 16 * fs);
          ctx.fillStyle = rgba(fg, 0.55);
          ctx.font = `${11 * fs}px ${FONT}`;
          ctx.fillText(`@${u.handle}`, p.x, p.y + size / 2 + 30 * fs);
          ctx.restore();
        }
      }
    }

    function drawDots(placed: PlacedAvatar[], now: number) {
      const ctx = dotsCanvas!.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const { w, h } = sizeRef.current;
      const { fg } = colorsRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const entrance = entranceStartRef.current;
      const fieldFade = entrance === null
        ? 0
        : clamp((now - entrance) / SPHERE.fieldFadeIn, 0, 1);
      if (fieldFade <= 0) return;

      const cx = w / 2;
      const cy = h / 2;
      const rimX = w * SPHERE.rimFractionX;
      const rimY = h * SPHERE.rimFractionY;
      const { panX, panY, zoom } = motion;
      const reduced = motion.reducedMotion;

      // LOD: keep projected pitch ≥ 18 px.
      let sp = SPHERE.dotSpacing;
      while (sp * zoom < SPHERE.dotLodMinPx) sp *= 2;

      // Spatial hash of avatars for the hug pass.
      const bucketSize = 100;
      const buckets = new Map<string, number[]>();
      placed.forEach((p, i) => {
        const key = `${Math.floor(p.x / bucketSize)},${Math.floor(p.y / bucketSize)}`;
        const arr = buckets.get(key);
        if (arr) arr.push(i);
        else buckets.set(key, [i]);
      });

      const rip = reduced ? 0 : motion.rippleAmount;
      const grab = reduced ? 0 : motion.grabAmount;
      const pointer = pointerPosRef.current;

      const inv = 1 / (zoom * (1 - SPHERE.rimCompression));
      const colMin = Math.floor((((0 - 8) - cx) * inv - panX) / sp) - 1;
      const colMax = Math.ceil((((w + 8) - cx) * inv - panX) / sp) + 1;
      const rowMin = Math.floor((((0 - 8) - cy) * inv - panY) / sp) - 1;
      const rowMax = Math.ceil((((h + 8) - cy) * inv - panY) / sp) + 1;

      for (let row = rowMin; row <= rowMax; row++) {
        for (let col = colMin; col <= colMax; col++) {
          const wp = warp(col * sp, row * sp, panX, panY, zoom, cx, cy, rimX, rimY);
          if (wp.r > 1.05) continue;
          let px = wp.x;
          let py = wp.y;
          if (px < -8 || px > w + 8 || py < -8 || py > h + 8) continue;

          // Hug: dots gather onto a ring around nearby avatars.
          let hug = 0;
          let selfHug = 0;
          const bx = Math.floor(px / bucketSize);
          const by = Math.floor(py / bucketSize);
          for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
              const arr = buckets.get(`${bx + ox},${by + oy}`);
              if (!arr) continue;
              for (const i of arr) {
                const a = placed[i];
                const dx = px - a.x;
                const dy = py - a.y;
                const d = Math.hypot(dx, dy) || 0.001;
                const ringR = a.size / 2 + SPHERE.hugGap;
                const outer = ringR + SPHERE.hugFalloff;
                if (d >= outer) continue;
                const t = d / outer;
                const mapped = ringR + Math.pow(t, SPHERE.hugCurve) * (outer - ringR);
                px += (dx / d) * (mapped - d);
                py += (dy / d) * (mapped - d);
                const hh = 1 - (mapped - ringR) / (outer - ringR);
                hug = Math.max(hug, hh);
                if (a.isYou) selfHug = Math.max(selfHug, hh);
              }
            }
          }

          // Touch ripple / grab.
          if ((rip > 0.01 || grab > 0.01) && pointer) {
            const dx = px - pointer.x;
            const dy = py - pointer.y;
            const d = Math.hypot(dx, dy) || 0.001;
            if (d < SPHERE.rippleRadius) {
              const t = 1 - d / SPHERE.rippleRadius;
              let push = t * t * (SPHERE.rippleStrength * rip - SPHERE.grabStrength * grab);
              push = Math.max(push, -d * 0.8);
              px += (dx / d) * push;
              py += (dy / d) * push;
            }
          }

          let radius = Math.max(1.6 * wp.scale * zoom, 0.7);
          radius *= 1 + SPHERE.hugSwell * hug;
          radius *= 1 + SPHERE.selfRingSwell * selfHug;

          let alpha = (0.04 + (1 - Math.min(wp.r, 1)) * 0.12) * wp.alpha;
          alpha *= 1 + SPHERE.hugGlow * hug * hug;
          if (!reduced) {
            const phase = (cellHash(col ^ 0x2f, row ^ 0x71) & 0xffff) / 65535 * Math.PI * 2;
            alpha *= 1 + SPHERE.shimmerAmount * Math.sin(now * SPHERE.shimmerSpeed + phase);
          }
          alpha *= fieldFade;

          // Self ring: dots hugging the signed-in athlete blend to accent.
          const s = selfHug * selfHug;
          const color = s > 0.001
            ? {
                r: fg.r + (ACCENT_RGB.r - fg.r) * s,
                g: fg.g + (ACCENT_RGB.g - fg.g) * s,
                b: fg.b + (ACCENT_RGB.b - fg.b) * s,
              }
            : fg;
          const finalAlpha = s > 0.001
            ? alpha + (SPHERE.selfRingMaxOpacity * fieldFade - alpha) * s
            : alpha;
          if (finalAlpha <= 0.003) continue;

          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color.r | 0},${color.g | 0},${color.b | 0},${finalAlpha})`;
          ctx.fill();
        }
      }
    }

    // ── the loop ────────────────────────────────────────────────────────────
    let raf = 0;
    let lastT = 0;
    const loop = (tms: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || stateRef.current.paused || !stateRef.current.hydrated) {
        lastT = 0; // clock reset: no giant dt on resume
        return;
      }
      const now = tms / 1000;
      if (!lastT) lastT = now;
      const dt = Math.min(now - lastT, 1 / 30);
      lastT = now;

      motion.tick(dt, now);

      const placed = placeAvatars(now);
      placedRef.current = placed;

      // Feed the magnetic settle the avatar nearest to center (within reach).
      const { w, h } = sizeRef.current;
      let candidate: { x: number; y: number } | null = null;
      let bestD: number = SPHERE.settleReach;
      for (const p of placed) {
        const d = Math.hypot(p.x - w / 2, p.y - h / 2);
        if (d < bestD) {
          bestD = d;
          candidate = { x: p.worldCX, y: p.worldCY };
        }
      }
      motion.setSettleCandidate(candidate);

      drawAvatars(placed);
      drawDots(placed, now);

      // Micro-tilt: one shared 3D lean on the avatar layer, against travel.
      // Always applied so it eases continuously to identity — snapping the
      // transform off at a threshold reads as a size glitch on release.
      const t = motion.tilt();
      avatarCanvas!.style.transform =
        `perspective(900px) rotate3d(${t.ax.toFixed(4)},${t.ay.toFixed(4)},0,${t.deg.toFixed(3)}deg)`;
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resizeBoth);
      avatarCanvas.removeEventListener("wheel", onWheel);
      themeObserver.disconnect();
    };
  }, []);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--background)" }}>
      {/* dots: above scrims on landing (z 3), beneath avatars in-app (z 0) */}
      <canvas
        ref={dotsCanvasRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: dotsOverlayAboveChrome ? 3 : 0,
          pointerEvents: "none",
        }}
      />
      <canvas
        ref={avatarCanvasRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          touchAction: "none",
          willChange: "transform",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeaveGlobe}
      />
      {chromeOverlay ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          {chromeOverlay}
        </div>
      ) : null}

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
            style={{ width: 80, height: 80, borderRadius: 20 }}
          />
        </div>
      )}

      {mode === "app" && (
        <>
          {/* ── title / counter ──────────────────────────────────────────── */}
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
              <AthletesCounter count={allUsers.length} />
            </div>
          </div>

          {/* ── search ── */}
          <div
            style={{
              position: "fixed",
              top: "max(env(safe-area-inset-top), 20px)",
              right: 16,
              zIndex: 50,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              style={APP_TOP_BAR_GLASS_BTN}
              className="app-glass-icon-btn active:scale-95"
              aria-label="Search people"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--glass-btn-icon)"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="22" y2="22" />
              </svg>
            </button>
          </div>

          {/* ── search sheet ─────────────────────────────────────────────── */}
          {searchOpen && (
            <SearchSheet
              friends={friendsForSearch}
              onClose={() => setSearchOpen(false)}
              onSelect={(id) => {
                setSearchOpen(false);
                onNavigateToProfile(id);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
