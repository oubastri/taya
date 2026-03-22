"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACTIVITY_TYPES_WITH_SVG_FILE,
  activityTypeToIconPath,
} from "@/components/ActivityIcon";
import { CustomCursor } from "@/components/CustomCursor";

const LANDING_GLOBE_ICON_PATHS = ACTIVITY_TYPES_WITH_SVG_FILE.map(activityTypeToIconPath);

const WORLD_W = 2800;
const WORLD_H = 3600;
const DOT_SPACING = 42;
const DOT_RADIUS = 1.8;
const ZOOM_MAX = 4;
const BOWL_K = 0.55;
const BOWL_SCALE = 0.35;
const BOWL_TILT = 1.05;
/** Corner roundness as a fraction of on-screen tile size (stable look at every zoom) */
const TILE_CORNER_RADIUS_FRAC = 0.14;
/** Inset from tile edge to icon (fraction of min tile side) */
const ICON_INSET_FRAC = 0.2;
/** World-space gap between grid cells */
const GRID_GAP = 18;
/** Target pitch (cell + gap); larger → bigger thumbnails (uses narrow side for column count) */
const GRID_TARGET_PITCH = 188;
/** Minimum world-space tile width (short side of portrait cell) */
const GRID_MIN_CELL_W = 56;
/** Portrait tiles: width / height (4:5) */
const GRID_CELL_ASPECT_WH = 4 / 5;
/** Fallback span for zoom before layout resolves */
const ZOOM_REF_FALLBACK = 120;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Deterministic PRNG for stable layout across reloads */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
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

type GlobeTileItem = {
  id: string;
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * Portrait grid that fills WORLD_W × WORLD_H exactly (origin 0,0).
 * If gridW < WORLD_W, tiling repeats leave a wide empty band between periods — reads as a vertical “hole” near center when panned.
 */
function buildPhotoLayout(paths: string[]): GlobeTileItem[] {
  if (paths.length === 0) return [];

  const gap = GRID_GAP;
  const ar = GRID_CELL_ASPECT_WH;
  const minRatio = 1 / ar;

  let cols = Math.max(4, Math.floor((WORLD_W + gap) / GRID_TARGET_PITCH));
  let rows = Math.max(4, Math.floor((WORLD_H + gap) / GRID_TARGET_PITCH));

  const dims = (c: number, r: number) => {
    const cellW = (WORLD_W - (c - 1) * gap) / c;
    const cellH = (WORLD_H - (r - 1) * gap) / r;
    return { cellW, cellH, ratio: cellH / cellW };
  };

  for (let iter = 0; iter < 80; iter++) {
    const { cellW, cellH, ratio } = dims(cols, rows);
    if (cellW < GRID_MIN_CELL_W && cols > 4) {
      cols -= 1;
      continue;
    }
    if (ratio < minRatio - 1e-9) {
      if (rows > 4) {
        rows -= 1;
        continue;
      }
      cols += 1;
      continue;
    }
    break;
  }

  let { cellW, cellH } = dims(cols, rows);
  while (cellW < GRID_MIN_CELL_W && cols > 4) {
    cols -= 1;
    ({ cellW, cellH } = dims(cols, rows));
  }

  const nSlots = rows * cols;
  const deck = Array.from({ length: nSlots }, (_, i) => paths[i % paths.length]!);
  const rng = mulberry32(0x4c4e4447);
  for (let i = nSlots - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = deck[i]!;
    const b = deck[j]!;
    deck[i] = b;
    deck[j] = a;
  }

  const jitterYMax = Math.max(
    0,
    Math.min(gap * 0.32, cellH * 0.045),
  );

  const out: GlobeTileItem[] = [];
  let k = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const src = deck[k]!;
      k++;
      const jy = jitterYMax > 0 ? (rng() - 0.5) * 2 * jitterYMax : 0;
      out.push({
        id: `globe-tile-${row}-${col}`,
        src,
        x: col * (cellW + gap),
        y: row * (cellH + gap) + jy,
        w: cellW,
        h: cellH,
      });
    }
  }
  return out;
}

function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (iw <= 0 || ih <= 0) return;
  const scale = Math.min(dw / iw, dh / ih);
  const rw = iw * scale;
  const rh = ih * scale;
  const ox = dx + (dw - rw) / 2;
  const oy = dy + (dh - rh) / 2;
  ctx.drawImage(img, 0, 0, iw, ih, ox, oy, rw, rh);
}

function drawActivityTileBowl(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sw: number,
  sh: number,
  img: HTMLImageElement | undefined,
  radialCompress: number,
  radialAngle: number,
  isDark: boolean,
) {
  ctx.save();
  ctx.translate(cx, cy);
  if (radialCompress < 0.998) {
    ctx.rotate(radialAngle);
    ctx.scale(radialCompress, 1);
    ctx.rotate(-radialAngle);
  }

  const halfW = sw / 2;
  const halfH = sh / 2;
  const minSide = Math.min(sw, sh);
  const r = Math.min(TILE_CORNER_RADIUS_FRAC * minSide, halfW, halfH);

  ctx.save();
  roundedRectPath(ctx, -halfW, -halfH, sw, sh, r);
  ctx.clip();

  ctx.fillStyle = isDark ? "#35353D" : "#E2E2E8";
  ctx.fillRect(-halfW, -halfH, sw, sh);

  if (img && img.complete && img.naturalWidth > 0) {
    const pad = minSide * ICON_INSET_FRAC;
    const ix = -halfW + pad;
    const iy = -halfH + pad;
    const iwBox = sw - 2 * pad;
    const ihBox = sh - 2 * pad;
    ctx.save();
    if (isDark) ctx.filter = "invert(1)";
    drawImageContain(ctx, img, ix, iy, iwBox, ihBox);
    ctx.restore();
  }

  ctx.restore();

  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)";
  ctx.lineWidth = 1;
  roundedRectPath(ctx, -halfW, -halfH, sw, sh, r);
  ctx.stroke();

  ctx.restore();
}

export default function LandingPhotoGlobe() {
  const [items, setItems] = useState<GlobeTileItem[] | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef({ px: 0, py: 90, z: 1 });
  const zoomMinRef = useRef(0.5);
  const imagesRef = useRef(new Map<string, HTMLImageElement>());
  const gridRef = useRef<{ TILE_W: number; TILE_H: number; items: GlobeTileItem[] }>({
    TILE_W: WORLD_W,
    TILE_H: WORLD_H,
    items: [],
  });
  const rafDrawRef = useRef<number | null>(null);
  const maxWorldSpanRef = useRef(220);

  useEffect(() => {
    let cancelled = false;
    const loaded = new Map<string, HTMLImageElement>();
    let remaining = LANDING_GLOBE_ICON_PATHS.length;

    const finish = () => {
      if (cancelled || remaining > 0) return;
      const paths = LANDING_GLOBE_ICON_PATHS.filter((p) => loaded.has(p));
      if (paths.length === 0) {
        setItems([]);
        return;
      }
      imagesRef.current = loaded;
      const layout = buildPhotoLayout(paths);
      let maxSpan = 0;
      for (const it of layout) {
        maxSpan = Math.max(maxSpan, it.w, it.h);
      }
      maxWorldSpanRef.current = maxSpan;
      setItems(layout);
    };

    for (const src of LANDING_GLOBE_ICON_PATHS) {
      const im = new window.Image();
      im.onload = () => {
        if (cancelled) return;
        loaded.set(src, im);
        remaining -= 1;
        finish();
      };
      im.onerror = () => {
        if (cancelled) return;
        remaining -= 1;
        finish();
      };
      im.src = src;
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!items || items.length === 0) return;
    gridRef.current = { TILE_W: WORLD_W, TILE_H: WORLD_H, items };
  }, [items]);

  useEffect(() => {
    if (!items || items.length === 0) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const zoomMin = Math.max(vw / WORLD_W, vh / WORLD_H);
    zoomMinRef.current = zoomMin;
    const refWorld = Math.max(maxWorldSpanRef.current || ZOOM_REF_FALLBACK, ZOOM_REF_FALLBACK);
    const TARGET_Z = 78 / refWorld;
    const z = clamp(TARGET_Z, zoomMin, ZOOM_MAX);
    const worldCx = WORLD_W / 2;
    const worldCy = WORLD_H / 2;
    viewRef.current = {
      px: vw / 2 - worldCx * z,
      py: vh / 2 - worldCy * z,
      z,
    };
  }, [items]);

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
      const { TILE_W: tw, TILE_H: th, items: photoItems } = gridRef.current;

      const isDark = document.documentElement.getAttribute("data-theme") === "dark";

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = isDark ? "#0D0D0D" : "#F3F3F3";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const margin = maxWorldSpanRef.current * 1.2;
      const visLeft = -px / z - margin;
      const visRight = (cssW - px) / z + margin;
      const visTop = -py / z - margin;
      const visBottom = (cssH - py) / z + margin;

      const scx = cssW / 2;
      const scy = cssH / 2;
      const maxR = Math.hypot(cssW, cssH) * 0.5;

      ctx.save();
      ctx.scale(dpr, dpr);

      const globeR = Math.hypot(cssW, cssH) * 0.55;
      const dotGrad = ctx.createRadialGradient(scx, scy, 0, scx, scy, globeR);
      if (isDark) {
        dotGrad.addColorStop(0.0, "rgba(255,255,255,0.18)");
        dotGrad.addColorStop(0.55, "rgba(255,255,255,0.13)");
        dotGrad.addColorStop(0.85, "rgba(255,255,255,0.07)");
        dotGrad.addColorStop(1.0, "rgba(255,255,255,0.02)");
      } else {
        dotGrad.addColorStop(0.0, "rgba(0,0,0,0.22)");
        dotGrad.addColorStop(0.55, "rgba(0,0,0,0.18)");
        dotGrad.addColorStop(0.85, "rgba(0,0,0,0.10)");
        dotGrad.addColorStop(1.0, "rgba(0,0,0,0.04)");
      }

      const gcMin = Math.floor(visLeft / DOT_SPACING) - 1;
      const gcMax = Math.ceil(visRight / DOT_SPACING) + 1;
      const grMin = Math.floor(visTop / DOT_SPACING) - 1;
      const grMax = Math.ceil(visBottom / DOT_SPACING) + 1;

      ctx.beginPath();
      for (let gr = grMin; gr <= grMax; gr++) {
        for (let gc = gcMin; gc <= gcMax; gc++) {
          const wx = gc * DOT_SPACING;
          const wy = gr * DOT_SPACING;
          const sx0 = px + wx * z;
          const sy0 = py + wy * z;
          const dvx = sx0 - scx;
          const dvy = sy0 - scy;
          const dist = Math.hypot(dvx, dvy);
          const r = dist / maxR;
          if (r > 1.05) continue;
          const warp = 1 + BOWL_K * r * r;
          const sx = scx + dvx * warp;
          const sy = scy + dvy * warp;
          if (sx < -8 || sx > cssW + 8 || sy < -8 || sy > cssH + 8) continue;
          const depthScale = 1 + BOWL_SCALE * r * r;
          const dR = Math.max(DOT_RADIUS * z * depthScale, 0.6);
          ctx.moveTo(sx + dR, sy);
          ctx.arc(sx, sy, dR, 0, Math.PI * 2);
        }
      }
      ctx.fillStyle = dotGrad;
      ctx.fill();

      const periodX = tw * z;
      const periodY = th * z;
      const normPx = -(((-px % periodX) + periodX) % periodX);
      const normPy = -(((-py % periodY) + periodY) % periodY);

      for (let ty = 0; ty <= 1; ty++) {
        for (let tx = 0; tx <= 1; tx++) {
          for (let i = 0; i < photoItems.length; i++) {
            const it = photoItems[i]!;
            const wx = it.x + it.w / 2 + tx * tw;
            const wy = it.y + it.h / 2 + ty * th;

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
            const sw = it.w * z * depthScale;
            const sh = it.h * z * depthScale;

            if (sx + sw / 2 < 0 || sx - sw / 2 > cssW || sy + sh / 2 < 0 || sy - sh / 2 > cssH) {
              continue;
            }

            const tiltAngle = BOWL_TILT * Math.min(r, 1);
            const radialCompress = Math.cos(tiltAngle);
            const radialAngle = dist > 0.5 ? Math.atan2(dvy, dvx) : 0;

            drawActivityTileBowl(
              ctx,
              sx,
              sy,
              sw,
              sh,
              imagesRef.current.get(it.src),
              radialCompress,
              radialAngle,
              isDark,
            );
          }
        }
      }

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
  }, []);

  const commit = useCallback((v: { px: number; py: number; z: number }) => {
    viewRef.current = v;
  }, []);

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

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (rafPanRef.current !== null) {
        cancelAnimationFrame(rafPanRef.current);
        rafPanRef.current = null;
        velRef.current = { x: 0, y: 0 };
      }
      if (rafZoomRef.current !== null) {
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

      if (prevSize === 2 && ptrs.current.size === 1) {
        const h = pinchHistory.current;
        if (h.length >= 2) {
          const last = h[h.length - 1]!;
          const base = h.filter((p) => p.t >= last.t - 40)[0] ?? h[h.length - 2]!;
          const dt = last.t - base.t;
          if (dt > 0 && base.dist > 0) {
            const logVel = ((Math.log(last.dist) - Math.log(base.dist)) / dt) * (1000 / 60);
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

      if (ptrs.current.size === 0) {
        const history = ptrHistory.current;
        if (history.length >= 2) {
          const last = history[history.length - 1]!;
          const base = history.filter((p) => p.t >= last.t - 30)[0] ?? history[history.length - 2]!;
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
    [startInertia, startZoomInertia],
  );

  const ready = items !== null && items.length > 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--background)" }}>
      <CustomCursor />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      {!ready && (
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
          <div className="skeleton" style={{ width: 80, height: 80, borderRadius: 20 }} />
        </div>
      )}
    </div>
  );
}
