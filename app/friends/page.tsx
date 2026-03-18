"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFriends } from "@/hooks/use-friends";
import { useUser } from "@/hooks/use-user";
import { AthletesCounter } from "@/components/AthletesCounter";
import type { FriendData } from "@/types/user";

// ─── constants ───────────────────────────────────────────────────────────────
const NAV_HEIGHT = 54;
const FONT = '"Lexend Deca", -apple-system, sans-serif';

const AVATAR_SIZE = 110;   // rounded-square side length
const AVATAR_RADIUS = 32;  // corner radius
const WORLD_W = 2800;      // globe world-space period width  — wide enough to give desktop room to zoom out
const WORLD_H = 3600;      // globe world-space period height — tall enough to exceed any phone screen
// Reference cluster size in world-units at the landing zoom.
// Using a square reference (geometric mean of portrait viewport dims) so
// avatars spread in a circular/2-D pattern rather than stacking vertically.
const LANDING_Z      = 68 / AVATAR_SIZE;                      // landing zoom (must match TARGET_Z below)
const REF_VP_W       = 390  / LANDING_Z;                      // ≈ 549 world units
const REF_VP_H       = 844  / LANDING_Z;                      // ≈ 1365 world units
const REF_VP_SIZE    = Math.sqrt(REF_VP_W * REF_VP_H);        // geometric mean ≈ 866 (square reference)
const TARGET_IN_VIEW = 4;                                      // desired avatars visible on first load
const DOT_SPACING = 42;    // distance between dot-grid points in world units
const DOT_RADIUS  = 1.8;   // dot radius in CSS px at z=1, before depth scaling

// ZOOM_MIN is computed dynamically from the viewport so the world always fills
// the screen (no seam ever visible).  See zoomMinRef below.
const ZOOM_MAX = 4;

// ── Bowl warp ── screen-space distortion that makes the grid look like a dish
const BOWL_K     = 0.55;  // how far edges are pushed outward (fraction × r²)
const BOWL_SCALE = 0.35;  // edge avatars are (1 + BOWL_SCALE × r²) times larger
const BOWL_TILT  = 1.05;  // max radial-compression angle in radians (~60° at the lip)

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Push overlapping avatar positions apart so neither the image nor the text
// label below clips a neighbour.  Uses an axis-aligned bounding box (AABB):
// each slot is SLOT_W wide (image only) and SLOT_H tall (image + name + handle).
const SLOT_W = AVATAR_SIZE + 16;   // horizontal clearance
const SLOT_H = AVATAR_SIZE + 56;   // vertical clearance — extra 56 for text below

function resolveOverlaps(
  positions: { x: number; y: number }[],
  bx0: number, by0: number, bx1: number, by1: number,
): { x: number; y: number }[] {
  if (positions.length < 2) return positions;
  const res = positions.map((p) => ({ x: p.x, y: p.y }));
  for (let pass = 0; pass < 120; pass++) {
    let moved = false;
    for (let i = 0; i < res.length; i++) {
      for (let j = i + 1; j < res.length; j++) {
        const dx = res[j].x - res[i].x;
        const dy = res[j].y - res[i].y;
        const overlapX = SLOT_W - Math.abs(dx);
        const overlapY = SLOT_H - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        moved = true;
        if (overlapX < overlapY) {
          const push = overlapX / 2 + 0.5;
          const sign = dx >= 0 ? 1 : -1;
          res[i].x = clamp(res[i].x - sign * push, bx0, bx1 - AVATAR_SIZE);
          res[j].x = clamp(res[j].x + sign * push, bx0, bx1 - AVATAR_SIZE);
        } else {
          const push = overlapY / 2 + 0.5;
          const sign = dy >= 0 ? 1 : -1;
          res[i].y = clamp(res[i].y - sign * push, by0, by1 - AVATAR_SIZE);
          res[j].y = clamp(res[j].y + sign * push, by0, by1 - AVATAR_SIZE);
        }
      }
    }
    if (!moved) break;
  }
  return res;
}

// ─── types ────────────────────────────────────────────────────────────────────
type UserEntry = {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  isYou: boolean;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

// Stable seeded hash for a user ID (used to derive a deterministic position).
function seedHash(userId: string): number {
  let h = 0xdeadbeef;
  for (let i = 0; i < userId.length; i++) {
    h = Math.imul(h ^ userId.charCodeAt(i), 0x9e3779b9);
    h = (h ^ (h >>> 16)) >>> 0;
  }
  return h;
}

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

// Draw a single user in screen space.
// cx/cy = avatar center in CSS pixels (already bowl-warped).
// S     = avatar side length in CSS pixels (already depth-scaled).
// The tilt transform (radial compression) is applied once and all drawing
// (image, border, text) happens inside that compressed coordinate space.
function drawUserBowl(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  S: number,
  user: UserEntry,
  img: HTMLImageElement | undefined,
  zoom: number,
  radialCompress: number,
  radialAngle: number,
) {
  const R = (AVATAR_RADIUS / AVATAR_SIZE) * S;

  ctx.save();

  // Move origin to avatar center, apply radial tilt, then draw around (0,0)
  ctx.translate(cx, cy);
  if (radialCompress < 0.998) {
    ctx.rotate(radialAngle);
    ctx.scale(radialCompress, 1);
    ctx.rotate(-radialAngle);
  }

  const half = S / 2;

  // ── clip + draw image (or initials placeholder) ───────────────────────
  ctx.save();
  roundedRectPath(ctx, -half, -half, S, S, R);
  ctx.clip();
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -half, -half, S, S);
  } else {
    ctx.fillStyle = "#e8e8ef";
    ctx.fillRect(-half, -half, S, S);
    ctx.fillStyle = "#999";
    ctx.font = `700 ${Math.round(S * 0.28)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(getInitials(user.name), 0, 0);
  }
  ctx.restore();

  // ── text labels ────────────────────────────────────────────────────────
  if (zoom >= 0.3) {
    const alpha = Math.min(1, (zoom - 0.3) / 0.15);
    const ts = S / AVATAR_SIZE;
    const nameY = half + 18 * ts;
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#111";
    ctx.font = `700 ${13 * ts}px ${FONT}`;
    ctx.fillText(user.name, 0, nameY, S * 1.2);
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.font = `500 ${11 * ts}px ${FONT}`;
    ctx.fillText(`@${user.handle}`, 0, nameY + 17 * ts, S * 1.2);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

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
  const dragRef = useRef({ active: false, startY: 0, dy: 0 });
  const SPRING = "0.38s cubic-bezier(0.32, 0.72, 0, 1)";

  // Trigger enter animation on next paint
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setOpen(true)),
    );
    return () => cancelAnimationFrame(raf);
  }, []);

  // Focus input after sheet settles
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 420);
    return () => clearTimeout(t);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setTimeout(onClose, 380);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // ── Drag-to-dismiss on the handle ────────────────────────────────────────
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
    const { dy } = dragRef.current;

    if (dy > 90) {
      // Dismiss: animate sheet and scrim out in px so units match
      const vh = window.innerHeight;
      if (sheetRef.current) {
        sheetRef.current.style.transition = `transform ${SPRING}`;
        sheetRef.current.style.transform = `translateX(-50%) translateY(${vh}px)`;
      }
      if (scrimRef.current) {
        scrimRef.current.style.transition = `opacity 0.38s ease`;
        scrimRef.current.style.opacity = "0";
      }
      setTimeout(onClose, 380);
    } else {
      // Snap back
      if (sheetRef.current) {
        sheetRef.current.style.transition = `transform ${SPRING}`;
        sheetRef.current.style.transform = "translateX(-50%) translateY(0)";
        setTimeout(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transition = "";
            sheetRef.current.style.transform = "";
          }
        }, 380);
      }
    }
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) => f.name.toLowerCase().includes(q) || f.handle.toLowerCase().includes(q),
    );
  }, [friends, query]);

  return (
    <>
      <style>{`#taya-search-input::placeholder { color: rgba(0,0,0,0.28); }`}</style>

      {/* Scrim */}
      <div
        ref={scrimRef}
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99,
          background: "rgba(0,0,0,0.32)",
          opacity: open ? 1 : 0,
          transition: `opacity ${SPRING}`,
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
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(40px) saturate(1.8)",
          WebkitBackdropFilter: "blur(40px) saturate(1.8)",
          borderRadius: "32px 32px 0 0",
          boxShadow: "0 -1px 0 rgba(0,0,0,0.07), 0 -12px 48px rgba(0,0,0,0.13)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "var(--font-sans), sans-serif",
          transform: open ? "translateX(-50%)" : "translateX(-50%) translateY(100%)",
          transition: `transform ${SPRING}`,
        }}
      >
        {/* Drag handle */}
        <div
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          style={{
            padding: "12px 24px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
            cursor: "grab",
            touchAction: "none",
            userSelect: "none",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "rgba(0,0,0,0.16)",
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
            background: "rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.07)",
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
            stroke="rgba(0,0,0,0.55)"
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
              color: "#000",
              caretColor: "#000",
              minWidth: 0,
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        {/* Separator */}
        <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", flexShrink: 0 }} />

        {/* Results */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
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
                padding: "13px 24px",
                background: "none",
                border: "none",
                borderBottom:
                  i < results.length - 1 ? "0.5px solid rgba(0,0,0,0.07)" : "none",
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
                  background: "#e8e8ef",
                }}
              >
                {f.avatarUrl ? (
                  <img
                    src={f.avatarUrl}
                    alt={f.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
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
                      color: "#999",
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
                    color: "#000",
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
                    color: "rgba(0,0,0,0.38)",
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
                    color: "rgba(0,0,0,0.32)",
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
                margin: "36px 24px 0",
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 15,
                color: "rgba(0,0,0,0.3)",
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

// ─── FriendsPage ──────────────────────────────────────────────────────────────
export default function FriendsPage() {
  const router = useRouter();
  const { friends, hydrated } = useFriends();
  const { user } = useUser();
  const [searchOpen, setSearchOpen] = useState(false);

  // Hide bottom nav while search sheet is open
  useEffect(() => {
    document.body.classList.toggle("search-open", searchOpen);
    return () => document.body.classList.remove("search-open");
  }, [searchOpen]);

  // ── All users: YOU first, then friends ──────────────────────────────────
  const allUsers = useMemo(
    (): UserEntry[] => [
      {
        id: user.id,
        name: user.name,
        handle: user.handle,
        avatarUrl: user.avatarUrl,
        isYou: true,
      },
      ...friends.map((f) => ({
        id: f.id,
        name: f.name,
        handle: f.handle,
        avatarUrl: f.avatarUrl,
        isYou: false,
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user.id, user.name, user.handle, user.avatarUrl, friends],
  );

  // ── Avatar positions: dynamic cluster scaled to user count ───────────────
  const basePositions = useMemo(() => {
    const n = allUsers.length;
    if (n === 0) return [];

    // Cluster grows as √(n / TARGET_IN_VIEW) × a square reference size so
    // avatars spread in all directions equally (circular scatter, not vertical stack).
    const k    = Math.sqrt(n / TARGET_IN_VIEW);
    const clW  = clamp(k * REF_VP_SIZE, REF_VP_SIZE * 0.85, WORLD_W * 0.92);
    const clH  = clamp(k * REF_VP_SIZE, REF_VP_SIZE * 0.85, WORLD_H * 0.92);
    const clX  = (WORLD_W - clW) / 2;
    const clY  = (WORLD_H - clH) / 2;

    const raw = allUsers.map((u) => {
      let h = seedHash(u.id);
      const x = clX + (h % Math.max(1, Math.floor(clW - AVATAR_SIZE)));
      h = Math.imul(h ^ 0x5f3759df, 2246822519) >>> 0;
      const y = clY + (h % Math.max(1, Math.floor(clH - AVATAR_SIZE)));
      return { x, y };
    });

    return resolveOverlaps(raw, clX, clY, clX + clW, clY + clH);
  }, [allUsers]);

  // ── Core refs ────────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef({ px: 0, py: 90, z: 1 });
  // Minimum zoom is the level at which the world exactly fills the screen —
  // guarantees the tiling seam is never visible.
  const zoomMinRef = useRef(0.5);
  const imagesRef = useRef(new Map<string, HTMLImageElement>());
  const rafDrawRef = useRef<number | null>(null);

  // Live grid data — always up to date for the draw loop and pointer handlers
  const gridRef = useRef({ TILE_W: WORLD_W, TILE_H: WORLD_H, basePositions, allUsers });
  useEffect(() => {
    gridRef.current = { TILE_W: WORLD_W, TILE_H: WORLD_H, basePositions, allUsers };
  });

  // ── Image preloading — only unique users need a load ─────────────────────
  useEffect(() => {
    allUsers.forEach((u) => {
      if (!u.avatarUrl || imagesRef.current.has(u.id)) return;
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = u.avatarUrl;
      imagesRef.current.set(u.id, img);
    });
  }, [allUsers]);

  // ── Initial view: world fills screen, zoom in 30 % so edges bleed ───────
  useEffect(() => {
    if (!hydrated) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // zoomMin = the level at which the world exactly covers the screen (no seam visible).
    const zoomMin = Math.max(vw / WORLD_W, vh / WORLD_H);
    zoomMinRef.current = zoomMin;
    // Fixed target avatar size on landing (~84 px) consistent across devices.
    const TARGET_Z = 68 / AVATAR_SIZE; // z ≈ 0.62
    const z = clamp(TARGET_Z, zoomMin, ZOOM_MAX);

    // Center on the centroid of all avatar positions so avatars are always
    // in view on landing rather than the geometric center of an empty world.
    const bpos = gridRef.current.basePositions;
    let worldCx = WORLD_W / 2;
    let worldCy = WORLD_H / 2;
    if (bpos.length > 0) {
      worldCx = bpos.reduce((s, p) => s + p.x + AVATAR_SIZE / 2, 0) / bpos.length;
      worldCy = bpos.reduce((s, p) => s + p.y + AVATAR_SIZE / 2, 0) / bpos.length;
    }
    viewRef.current = {
      px: vw / 2 - worldCx * z,
      py: vh / 2 - worldCy * z,
      z,
    };
  }, [hydrated]);

  // ── Canvas DPR resize + perpetual draw loop ──────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      // Keep zoomMin in sync so the seam is never visible after orientation change
      zoomMinRef.current = Math.max(window.innerWidth / WORLD_W, window.innerHeight / WORLD_H);
      if (viewRef.current.z < zoomMinRef.current) {
        viewRef.current = { ...viewRef.current, z: zoomMinRef.current };
      }
    }

    resize();
    window.addEventListener("resize", resize);

    let running = true;

    function draw() {
      if (!running || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;
      const { px, py, z } = viewRef.current;
      const {
        TILE_W: tw,
        TILE_H: th,
        basePositions: bpos,
        allUsers: users,
      } = gridRef.current;

      // Clear to white
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Visible world range (extra margin so bowl-warp can't clip edge tiles)
      const margin = AVATAR_SIZE * 2;
      const visLeft   = (-px / z) - margin;
      const visRight  = ((cssW - px) / z) + margin;
      const visTop    = (-py / z) - margin;
      const visBottom = ((cssH - py) / z) + margin;

      // Bowl warp is screen-space — only DPR scaling applied globally
      const scx = cssW / 2;
      const scy = cssH / 2;
      const maxR = Math.hypot(cssW, cssH) * 0.5;

      ctx.save();
      ctx.scale(dpr, dpr);

      // ── Dot-grid pass ─────────────────────────────────────────────────────
      // Dots tile at DOT_SPACING (independent of the avatar world period).
      // All dots share one path; a radial gradient fill fades them at the
      // globe horizon, matching the bowl-warp curvature.
      // Gradient reaches the screen corners so dots are visible edge-to-edge
      const globeR    = Math.hypot(cssW, cssH) * 0.55;
      const dotGrad   = ctx.createRadialGradient(scx, scy, 0, scx, scy, globeR);
      dotGrad.addColorStop(0.0,  "rgba(0,0,0,0.22)");
      dotGrad.addColorStop(0.55, "rgba(0,0,0,0.18)");
      dotGrad.addColorStop(0.85, "rgba(0,0,0,0.10)");
      dotGrad.addColorStop(1.0,  "rgba(0,0,0,0.04)");

      const gcMin = Math.floor(visLeft  / DOT_SPACING) - 1;
      const gcMax = Math.ceil(visRight  / DOT_SPACING) + 1;
      const grMin = Math.floor(visTop   / DOT_SPACING) - 1;
      const grMax = Math.ceil(visBottom / DOT_SPACING) + 1;

      ctx.beginPath();
      for (let gr = grMin; gr <= grMax; gr++) {
        for (let gc = gcMin; gc <= gcMax; gc++) {
          const wx  = gc * DOT_SPACING;
          const wy  = gr * DOT_SPACING;
          const sx0 = px + wx * z;
          const sy0 = py + wy * z;
          const dvx = sx0 - scx;
          const dvy = sy0 - scy;
          const dist = Math.hypot(dvx, dvy);
          const r = dist / maxR;
          if (r > 1.05) continue; // trim only what's well off-screen
          const warp       = 1 + BOWL_K * r * r;
          const sx         = scx + dvx * warp;
          const sy         = scy + dvy * warp;
          if (sx < -8 || sx > cssW + 8 || sy < -8 || sy > cssH + 8) continue;
          const depthScale = 1 + BOWL_SCALE * r * r;
          const dR         = Math.max(DOT_RADIUS * z * depthScale, 0.6);
          ctx.moveTo(sx + dR, sy);
          ctx.arc(sx, sy, dR, 0, Math.PI * 2);
        }
      }
      ctx.fillStyle = dotGrad;
      ctx.fill();

      // ── Avatar pass ───────────────────────────────────────────────────────
      // Normalise px/py into one world period so the viewport is always
      // "inside" the first tile.  A 2×2 neighbourhood covers the seam at
      // the edges; because ZOOM_MIN ensures WORLD_W*z >= cssW and
      // WORLD_H*z >= cssH, each avatar is visible at most once at a time.
      const periodX = tw * z;
      const periodY = th * z;
      const normPx = -(((-px % periodX) + periodX) % periodX);
      const normPy = -(((-py % periodY) + periodY) % periodY);

      for (let ty = 0; ty <= 1; ty++) {
        for (let tx = 0; tx <= 1; tx++) {
          for (let i = 0; i < users.length; i++) {
            const wx = bpos[i].x + AVATAR_SIZE / 2 + tx * tw;
            const wy = bpos[i].y + AVATAR_SIZE / 2 + ty * th;

            const sx0 = normPx + wx * z;
            const sy0 = normPy + wy * z;
            const dvx = sx0 - scx;
            const dvy = sy0 - scy;
            const dist = Math.hypot(dvx, dvy);
            const r = dist / maxR;
            const warp = 1 + BOWL_K * r * r;
            const sx = scx + dvx * warp;
            const sy = scy + dvy * warp;
            const depthScale = 1 + BOWL_SCALE * r * r;
            const S = AVATAR_SIZE * z * depthScale;

            if (sx + S < 0 || sx - S > cssW || sy + S < 0 || sy - S > cssH) continue;

            const tiltAngle = BOWL_TILT * Math.min(r, 1);
            const radialCompress = Math.cos(tiltAngle);
            const radialAngle = dist > 0.5 ? Math.atan2(dvy, dvx) : 0;

            drawUserBowl(
              ctx, sx, sy, S,
              users[i],
              imagesRef.current.get(users[i].id),
              z,
              radialCompress,
              radialAngle,
            );
          } // users
        } // tx
      } // ty

      ctx.restore();
      rafDrawRef.current = requestAnimationFrame(draw);
    }

    rafDrawRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      window.removeEventListener("resize", resize);
      if (rafDrawRef.current !== null) {
        cancelAnimationFrame(rafDrawRef.current);
        rafDrawRef.current = null;
      }
    };
  }, []); // empty deps — runs once, reads all data via refs

  // ── commit: write to viewRef only (draw loop picks it up via rAF) ───────
  const commit = useCallback((v: { px: number; py: number; z: number }) => {
    viewRef.current = v;
  }, []);

  // ── Inertia refs ─────────────────────────────────────────────────────────
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

  const startInertia = useCallback(() => {
    const FRICTION = 0.95;
    const step = () => {
      velRef.current.x *= FRICTION;
      velRef.current.y *= FRICTION;
      if (Math.abs(velRef.current.x) < 0.25 && Math.abs(velRef.current.y) < 0.25) {
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
    const FRICTION = 0.95;
    const step = () => {
      zoomVelRef.current = 1 + (zoomVelRef.current - 1) * FRICTION;
      if (Math.abs(zoomVelRef.current - 1) < 0.0001) {
        rafZoomRef.current = null;
        return;
      }
      const { px, py, z } = viewRef.current;
      const newZ = clamp(z * zoomVelRef.current, zoomMinRef.current, ZOOM_MAX);
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

  // Wheel — non-passive so we can preventDefault
  useEffect(() => {
    const el = canvasRef.current;
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
      wheelTargetRef.current = clamp(prev * (1 + -e.deltaY * factor), zoomMinRef.current, ZOOM_MAX);
      wheelCursorRef.current = { x: e.clientX, y: e.clientY };
      startWheelEase();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [startWheelEase]);

  // ── Tap hit-test ──────────────────────────────────────────────────────────
  // Because the bowl warp means a world position no longer maps linearly to
  // screen space, we forward-project each visible avatar (same math as the
  // draw loop) and check whether the tap lands inside its warped bounds.
  const detectTap = useCallback(
    (screenX: number, screenY: number) => {
      const { px, py, z } = viewRef.current;
      const { TILE_W: tw, TILE_H: th, basePositions: bpos, allUsers: users } =
        gridRef.current;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scx = vw / 2;
      const scy = vh / 2;
      const maxR = Math.hypot(vw, vh) * 0.5;

      // Same normalised-viewport math as the draw loop
      const periodX = tw * z;
      const periodY = th * z;
      const normPx = -(((-px % periodX) + periodX) % periodX);
      const normPy = -(((-py % periodY) + periodY) % periodY);

      // Forward-project each avatar using the same 2×2 tile seam approach
      // and check whether the tap lands inside its warped bounds.
      for (let tty = 0; tty <= 1; tty++) {
        for (let ttx = 0; ttx <= 1; ttx++) {
          for (let i = 0; i < users.length; i++) {
            const wx = bpos[i].x + AVATAR_SIZE / 2 + ttx * tw;
            const wy = bpos[i].y + AVATAR_SIZE / 2 + tty * th;
            const sx0 = normPx + wx * z;
            const sy0 = normPy + wy * z;
            const dvx = sx0 - scx;
            const dvy = sy0 - scy;
            const dist = Math.hypot(dvx, dvy);
            const r = dist / maxR;
            const warp = 1 + BOWL_K * r * r;
            const sx = scx + dvx * warp;
            const sy = scy + dvy * warp;
            const depthScale = 1 + BOWL_SCALE * r * r;
            const S = AVATAR_SIZE * z * depthScale;
            if (
              screenX >= sx - S / 2 && screenX <= sx + S / 2 &&
              screenY >= sy - S / 2 && screenY <= sy + S / 2
            ) {
              if (!users[i].isYou) router.push(`/profile/${users[i].id}`);
              return;
            }
          }
        }
      }
    },
    [router],
  );

  // ── Pointer handlers ─────────────────────────────────────────────────────
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
    [stopInertia],
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
        const newZ = clamp(z * scale, zoomMinRef.current, ZOOM_MAX);
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
    [commit],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const prevSize = ptrs.current.size;
      ptrs.current.delete(e.pointerId);
      if (ptrs.current.size < 2) prevPinchDist.current = 0;

      // Tap detection: single-finger lift with no drag
      if (!didDragRef.current && prevSize === 1 && ptrs.current.size === 0) {
        detectTap(e.clientX, e.clientY);
      }

      // Pinch zoom inertia on finger lift
      if (prevSize === 2 && ptrs.current.size === 1) {
        const h = pinchHistory.current;
        if (h.length >= 2) {
          const last = h[h.length - 1];
          const base = h.filter((p) => p.t >= last.t - 40)[0] ?? h[h.length - 2];
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
            history.filter((p) => p.t >= last.t - 30)[0] ?? history[history.length - 2];
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
    [startInertia, startZoomInertia, detectTap],
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff" }}>
      {/* ── infinite canvas ──────────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      {/* ── loading skeleton ─────────────────────────────────────────────── */}
      {!hydrated && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10,
            background: "#fff",
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
          <AthletesCounter count={allUsers.length} />
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
          background: "rgba(255,255,255,0.72)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 0 0 0.5px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.08)",
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
          stroke="rgba(0,0,0,0.6)"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
      </button>

      {/* ── search sheet ─────────────────────────────────────────────────── */}
      {searchOpen && (
        <SearchSheet
          friends={friends}
          onClose={() => setSearchOpen(false)}
          onSelect={(id) => {
            setSearchOpen(false);
            router.push(`/profile/${id}`);
          }}
        />
      )}
    </div>
  );
}
