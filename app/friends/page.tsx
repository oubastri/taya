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

const COLS = 3;
const AVATAR_SIZE = 110;   // rounded-square side length
const AVATAR_RADIUS = 32;  // corner radius
const COL_SPACING = 136;   // left-edge to left-edge of adjacent columns (= avatar + 26px gap)
const ROW_SPACING = 170;   // top-edge to top-edge of adjacent rows (avatar + text + bottom margin)

const ZOOM_MIN = 0.55;
const ZOOM_MAX = 4;

// ── Bowl warp ── screen-space distortion that makes the grid look like a dish
const BOWL_K     = 0.55;  // how far edges are pushed outward (fraction × r²)
const BOWL_SCALE = 0.35;  // edge avatars are (1 + BOWL_SCALE × r²) times larger
const BOWL_TILT  = 1.05;  // max radial-compression angle in radians (~60° at the lip)

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ─── types ────────────────────────────────────────────────────────────────────
type UserEntry = {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  isYou: boolean;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

// Deterministic Fisher-Yates shuffle seeded with a 32-bit integer
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Build a display grid padded to ROWS×COLS:
//   - shuffles users deterministically so the order looks organic
//   - fills any remainder slots by repeating users, but never places a user
//     adjacent (H or V) to a duplicate of itself, and respects the tile
//     wrap-around seam so tiling looks seamless
function buildDisplayGrid(users: UserEntry[], cols: number): UserEntry[] {
  if (users.length === 0) return [];
  const n = users.length;
  const rows = Math.ceil(n / cols);
  const target = rows * cols;

  // Derive a stable seed from user IDs so the layout is the same every render
  const seed = users.reduce((acc, u, i) => {
    const h = u.id
      .split("")
      .reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 0);
    return acc ^ Math.imul(h, (i + 1) * 2654435761);
  }, 0x9e3779b9);

  const shuffled = seededShuffle([...users], seed >>> 0);
  if (n >= target) return shuffled;

  const grid: UserEntry[] = [...shuffled];

  for (let i = n; i < target; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const excluded = new Set<string>();

    // Orthogonal neighbors already placed
    if (row > 0) excluded.add(grid[(row - 1) * cols + col].id); // above
    if (col > 0) excluded.add(grid[i - 1].id);                   // left

    // Vertical tile-seam: bottom row will tile onto top row
    if (rows > 1 && row === rows - 1) excluded.add(grid[col].id);
    // Horizontal tile-seam: last col will tile onto first col
    if (col === cols - 1) excluded.add(grid[row * cols].id);

    const startOffset = ((seed >>> 0) * (i + 1)) % n;
    let chosen = shuffled[0];
    for (let k = 0; k < n; k++) {
      const c = shuffled[(startOffset + k) % n];
      if (!excluded.has(c.id)) { chosen = c; break; }
    }
    grid.push(chosen);
  }

  return grid;
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

  // ── YOU: thin border ───────────────────────────────────────────────────
  if (user.isYou) {
    roundedRectPath(ctx, -half, -half, S, S, R);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

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
        f.name.toLowerCase().includes(q) || f.handle.toLowerCase().includes(q),
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
              caretColor: "#000",
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
              border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 0 0 0.5px rgba(0,0,0,0.09), 0 4px 20px rgba(0,0,0,0.07)",
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
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#888",
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
                    color: "#000",
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

  // ── Display grid: shuffled + last-row padded, no adjacent duplicates ────
  const displayGrid = useMemo(
    () => buildDisplayGrid(allUsers, COLS),
    [allUsers],
  );

  const GRID_N = displayGrid.length;
  const ROWS = Math.max(Math.ceil(GRID_N / COLS), 1);
  const TILE_W = COLS * COL_SPACING;
  const TILE_H = ROWS * ROW_SPACING;

  const basePositions = useMemo(
    () =>
      Array.from({ length: GRID_N }, (_, i) => ({
        x: (i % COLS) * COL_SPACING,
        y: Math.floor(i / COLS) * ROW_SPACING,
      })),
    [GRID_N],
  );

  // ── Core refs ────────────────────────────────────────────────────────────
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const viewRef       = useRef({ px: 0, py: 90, z: 1 });
  const imagesRef     = useRef(new Map<string, HTMLImageElement>());
  const rafDrawRef    = useRef<number | null>(null);
  // Offscreen canvases for motion-blur compositing
  const offCanvasRef  = useRef<HTMLCanvasElement | null>(null);
  const offCtxRef     = useRef<CanvasRenderingContext2D | null>(null);
  const blurCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const blurCtxRef    = useRef<CanvasRenderingContext2D | null>(null);

  // Live grid data — always up to date for the draw loop and pointer handlers
  const gridRef = useRef({ TILE_W, TILE_H, basePositions, allUsers: displayGrid });
  useEffect(() => {
    gridRef.current = { TILE_W, TILE_H, basePositions, allUsers: displayGrid };
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

  // ── Initial view: fit tile width to screen, start just below counter ────
  useEffect(() => {
    if (!hydrated) return;
    const vw = window.innerWidth;
    const z = clamp((vw * 0.62) / TILE_W, ZOOM_MIN, ZOOM_MAX);
    viewRef.current = {
      px: (vw - TILE_W * z) / 2,
      py: 90,
      z,
    };
  }, [hydrated, TILE_W]);

  // ── Canvas DPR resize + perpetual draw loop ──────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      if (!canvas) return;
      const dpr   = window.devicePixelRatio || 1;
      const physW = window.innerWidth  * dpr;
      const physH = window.innerHeight * dpr;
      canvas.width  = physW;
      canvas.height = physH;
      canvas.style.width  = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      if (!offCanvasRef.current)  offCanvasRef.current  = document.createElement("canvas");
      if (!blurCanvasRef.current) blurCanvasRef.current = document.createElement("canvas");
      offCanvasRef.current.width   = physW;
      offCanvasRef.current.height  = physH;
      blurCanvasRef.current.width  = physW;
      blurCanvasRef.current.height = physH;
      offCtxRef.current  = offCanvasRef.current.getContext("2d");
      blurCtxRef.current = blurCanvasRef.current.getContext("2d");
    }

    resize();
    window.addEventListener("resize", resize);

    let running = true;

    function draw() {
      if (!running || !canvas) return;
      const mainCtx    = canvas.getContext("2d");
      const offCanvas  = offCanvasRef.current;
      const offCtx     = offCtxRef.current;
      const blurCanvas = blurCanvasRef.current;
      const blurCtx    = blurCtxRef.current;
      if (!mainCtx || !offCanvas || !offCtx || !blurCanvas || !blurCtx) {
        rafDrawRef.current = requestAnimationFrame(draw);
        return;
      }

      const dpr  = window.devicePixelRatio || 1;
      const cssW = canvas.width  / dpr;
      const cssH = canvas.height / dpr;
      const { px, py, z } = viewRef.current;
      const {
        TILE_W: tw,
        TILE_H: th,
        basePositions: bpos,
        allUsers: users,
      } = gridRef.current;

      // Visible world range (extra margin so bowl-warp can't hide edge tiles)
      const margin    = AVATAR_SIZE * 2;
      const visLeft   = (-px / z) - margin;
      const visRight  = ((cssW - px) / z) + margin;
      const visTop    = (-py / z) - margin;
      const visBottom = ((cssH - py) / z) + margin;
      const txMin = Math.floor(visLeft  / tw) - 1;
      const txMax = Math.ceil(visRight  / tw) + 1;
      const tyMin = Math.floor(visTop   / th) - 1;
      const tyMax = Math.ceil(visBottom / th) + 1;

      const scx  = cssW / 2;
      const scy  = cssH / 2;
      const maxR = Math.hypot(cssW, cssH) * 0.5;

      // ── Render current frame to offscreen canvas (transparent bg) ─────────
      offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
      offCtx.save();
      offCtx.scale(dpr, dpr);

      for (let ty = tyMin; ty <= tyMax; ty++) {
        for (let tx = txMin; tx <= txMax; tx++) {
          const offX = tx * tw;
          const offY = ty * th;
          for (let i = 0; i < users.length; i++) {
            const wx  = bpos[i].x + offX + AVATAR_SIZE / 2;
            const wy  = bpos[i].y + offY + AVATAR_SIZE / 2;
            const sx0 = px + wx * z;
            const sy0 = py + wy * z;
            const dvx = sx0 - scx;
            const dvy = sy0 - scy;
            const dist = Math.hypot(dvx, dvy);
            const r    = dist / maxR;
            const warp = 1 + BOWL_K * r * r;
            const sx   = scx + dvx * warp;
            const sy   = scy + dvy * warp;
            const depthScale = 1 + BOWL_SCALE * r * r;
            const S = AVATAR_SIZE * z * depthScale;
            if (sx + S < 0 || sx - S > cssW || sy + S < 0 || sy - S > cssH) continue;
            const tiltAngle     = BOWL_TILT * Math.min(r, 1);
            const radialCompress = Math.cos(tiltAngle);
            const radialAngle   = dist > 0.5 ? Math.atan2(dvy, dvx) : 0;
            drawUserBowl(
              offCtx, sx, sy, S,
              users[i],
              imagesRef.current.get(users[i].id),
              z, radialCompress, radialAngle,
            );
          }
        }
      }

      offCtx.restore();

      // ── Composite: white bg + sharp current frame ─────────────────────────
      mainCtx.clearRect(0, 0, canvas.width, canvas.height);
      mainCtx.fillStyle = "#ffffff";
      mainCtx.fillRect(0, 0, canvas.width, canvas.height);
      mainCtx.drawImage(offCanvas, 0, 0);

      // ── Motion blur: ghost copies → blurCanvas → edge-mask → composite ────
      const isDragging = ptrs.current.size > 0;
      const bvx    = isDragging ? instantVelRef.current.x : velRef.current.x;
      const bvy    = isDragging ? instantVelRef.current.y : velRef.current.y;
      const bSpeed = Math.hypot(bvx, bvy);
      const BLUR_MAX = 40;
      const speedT   = Math.min(bSpeed / BLUR_MAX, 1);

      if (speedT > 0.03) {
        const STEPS = 12;
        const dirX  = bvx / bSpeed;
        const dirY  = bvy / bSpeed;

        blurCtx.clearRect(0, 0, blurCanvas.width, blurCanvas.height);
        blurCtx.save();
        blurCtx.scale(dpr, dpr);

        // Leading-direction ghosts (primary smear at leading edge)
        for (let i = STEPS; i >= 1; i--) {
          const t     = i / STEPS;
          const alpha = speedT * 0.13 * (1 - t * 0.55);
          if (alpha < 0.003) continue;
          // Offset in direction of motion + radial zoom outward from center
          const ox    = dirX * bSpeed * 3.0 * t;
          const oy    = dirY * bSpeed * 3.0 * t;
          const scale = 1 + speedT * 0.35 * t;
          blurCtx.globalAlpha = alpha;
          blurCtx.save();
          blurCtx.translate(cssW / 2 + ox, cssH / 2 + oy);
          blurCtx.scale(scale, scale);
          blurCtx.translate(-cssW / 2, -cssH / 2);
          blurCtx.drawImage(offCanvas, 0, 0, cssW, cssH);
          blurCtx.restore();
        }

        // Trailing-direction ghosts (lighter smear at trailing edge)
        for (let i = STEPS; i >= 1; i--) {
          const t     = i / STEPS;
          const alpha = speedT * 0.06 * (1 - t * 0.55);
          if (alpha < 0.003) continue;
          const ox    = -dirX * bSpeed * 1.5 * t;
          const oy    = -dirY * bSpeed * 1.5 * t;
          const scale = 1 + speedT * 0.18 * t;
          blurCtx.globalAlpha = alpha;
          blurCtx.save();
          blurCtx.translate(cssW / 2 + ox, cssH / 2 + oy);
          blurCtx.scale(scale, scale);
          blurCtx.translate(-cssW / 2, -cssH / 2);
          blurCtx.drawImage(offCanvas, 0, 0, cssW, cssH);
          blurCtx.restore();
        }

        blurCtx.globalAlpha = 1;
        blurCtx.restore();

        // Apply radial edge-only mask: erase ghost from the center, keep periphery
        const hw     = blurCanvas.width  / 2;
        const hh     = blurCanvas.height / 2;
        const innerR = Math.min(hw, hh) * 0.22;
        const outerR = Math.hypot(hw, hh) * 0.62;
        const mask = blurCtx.createRadialGradient(hw, hh, innerR, hw, hh, outerR);
        mask.addColorStop(0,    "rgba(0,0,0,0)");
        mask.addColorStop(0.42, "rgba(0,0,0,0)");
        mask.addColorStop(1,    "rgba(0,0,0,1)");
        blurCtx.globalCompositeOperation = "destination-in";
        blurCtx.fillStyle = mask;
        blurCtx.fillRect(0, 0, blurCanvas.width, blurCanvas.height);
        blurCtx.globalCompositeOperation = "source-over";

        // Overlay edge-smear layer on top of the sharp current frame
        mainCtx.drawImage(blurCanvas, 0, 0);
      }

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
  const instantVelRef = useRef({ x: 0, y: 0 }); // live per-frame drag velocity for blur effect

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
      wheelTargetRef.current = clamp(prev * (1 + -e.deltaY * factor), ZOOM_MIN, ZOOM_MAX);
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

      const margin = AVATAR_SIZE * 2;
      const txMin = Math.floor((-px / z - margin) / tw) - 1;
      const txMax = Math.ceil(((vw - px) / z + margin) / tw) + 1;
      const tyMin = Math.floor((-py / z - margin) / th) - 1;
      const tyMax = Math.ceil(((vh - py) / z + margin) / th) + 1;

      for (let ty = tyMin; ty <= tyMax; ty++) {
        for (let tx = txMin; tx <= txMax; tx++) {
          for (let i = 0; i < users.length; i++) {
            const wx = bpos[i].x + tx * tw + AVATAR_SIZE / 2;
            const wy = bpos[i].y + ty * th + AVATAR_SIZE / 2;
            const sx0 = px + wx * z;
            const sy0 = py + wy * z;
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

        instantVelRef.current = { x: dx, y: dy };

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

      {/* ── search overlay ───────────────────────────────────────────────── */}
      {searchOpen && (
        <SearchOverlay
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
