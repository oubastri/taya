/**
 * sphereField — the motion + projection engine behind AthletesGlobeView,
 * ported constant-for-constant from the iOS sphere (AthleteGridView.swift).
 *
 * The experience: an infinite, pannable 2D field of avatars over a dotted
 * membrane. A radial "spherical" projection compresses, shrinks, and fades
 * everything toward the screen rim so the flat plane reads like the face of
 * a globe. Drag pans with momentum and a magnetic settle; idle drifts;
 * everything is deterministic per world cell.
 *
 * All lengths are world units (CSS px at zoom 1) unless noted.
 */

// ─── field constants (iOS parity) ────────────────────────────────────────────
export const SPHERE = {
  tile: 150,            // one avatar slot per 150×150 world cell
  avatarSize: 60,       // base avatar side at scale 1
  dotSpacing: 26,       // dot lattice pitch
  rimCompression: 0.22, // radial position compression at the rim
  rimShrink: 0.45,      // avatar scale loss at the rim
  rimFade: 0.55,        // alpha loss at the rim
  rimFractionX: 0.94,   // × screen width  — gentle fade at the sides
  rimFractionY: 0.46,   // × screen height — strong fade top/bottom (iPhone-portrait proportions)
  lensRadius: 110,      // center lens reach (screen px)
  lensBoost: 0.08,      // +8% scale at dead center
  lensLift: 0.5,        // halves the remaining fade at center
  settleReach: 70,      // px from center an avatar can be "grabbed" by settle
  settleRate: 2.5,      // /s exponential ease toward center
  settleWindow: 1.8,    // s after a glide dies
  hugGap: 8,            // dot standoff ring beyond avatar radius
  hugFalloff: 44,       // px over which dots gather onto the ring
  hugCurve: 1.7,        // packing exponent
  hugSwell: 0.25,
  hugGlow: 0.45,
  rippleRadius: 140,
  rippleStrength: 22,
  grabStrength: 12,
  tapSlop: 10,
  touchPadding: 8,
  tiltMaxDeg: 4,
  tiltSpeedNorm: 1500,  // world px/s that produces max tilt
  selfRingMaxOpacity: 0.75,
  selfRingSwell: 0.15,
  shimmerAmount: 0.12,
  shimmerSpeed: 1.1,    // rad/s
  entranceDuration: 0.45,
  entranceStepDelay: 0.06,
  fieldFadeIn: 0.8,
  minZoom: 0.65,
  maxZoom: 1.5,
  zoomHardMin: 0.4,
  zoomHardMax: 2.2,
  overPinch: 0.35,      // resistance past zoom limits
  zoomSpringRate: 10,   // /s spring-back
  driftSpeed: 11,       // world px/s
  driftDirX: -0.82,
  driftDirY: -0.57,
  driftRamp: 1.2,       // s ease-in after going idle
  maxFlingSpeed: 2600,  // world px/s
  frictionBase: 0.94,   // per-frame @60fps → 0.94^(dt·60)
  stopSpeed: 4,         // world px/s
  velocityWindow: 0.12, // s of trailing samples for release velocity
  emptySlotChance: 3,   // slotHash % 10 < 3 → ~30% breathing gaps
  dotLodMinPx: 18,      // double dot spacing below this projected pitch
  accent: "#01EF54",
} as const;

// ─── deterministic hashing (SplitMix64-flavored, 2×32-bit) ───────────────────
// Exact bit-parity with Swift isn't required — determinism and good spread are.
function mix32(h: number): number {
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  return (h ^ (h >>> 15)) >>> 0;
}

/** Hash of a world cell — drives jitter + shimmer phase + entrance stagger. */
export function cellHash(col: number, row: number): number {
  return mix32(mix32((col | 0) * 0x9e3779b9) ^ Math.imul(row | 0, 0x85ebca6b));
}

/** Hash of a period slot — drives cluster ragging + breathing gaps. */
export function slotHash(s: number): number {
  return mix32((s | 0) + 0x51515151);
}

// ─── per-cell jitter ─────────────────────────────────────────────────────────
export function cellJitter(col: number, row: number): { jx: number; jy: number } {
  const h = cellHash(col, row);
  const range = SPHERE.tile - SPHERE.avatarSize - 20; // 70
  return {
    jx: 10 + ((h >>> 8) & 0xffff) / 65535 * range,
    jy: 10 + (((h >>> 24) | (h << 8)) >>> 16 & 0xffff) / 65535 * range,
  };
}

// ─── period grid (infinite tiling without visible repeats) ───────────────────
export type PeriodGrid = {
  cols: number;
  rows: number;
  /** slot index → user index, or -1 for a breathing gap / empty slot */
  slots: Int32Array;
};

/**
 * Assign n users to a repeating block of slots that (a) is bigger than the
 * worst-case on-screen span so nobody appears twice at once, and (b) clusters
 * users around the origin with ~30% deterministic gaps, ragged at the edge.
 * User 0 (the signed-in athlete when present) always takes slot 0.
 */
export function buildPeriodGrid(
  n: number,
  screenW: number,
  screenH: number,
): PeriodGrid {
  const totalSlots = Math.max(1, Math.ceil(n / 0.7));
  const naturalCols = Math.ceil(Math.sqrt(totalSlots));
  const naturalRows = Math.ceil(totalSlots / naturalCols);

  // Worst-case visible span at min zoom with max rim decompression.
  const margin = SPHERE.avatarSize * 2;
  const inv = 1 / (SPHERE.minZoom * (1 - SPHERE.rimCompression));
  const spanCols =
    Math.ceil((screenW / 2 + margin) * inv / SPHERE.tile) * 2 + 1;
  const spanRows =
    Math.ceil((screenH / 2 + margin) * inv / SPHERE.tile) * 2 + 1;

  // Strictly avoiding duplicates would demand a period at least as big as
  // the worst-case screen span — with a small roster that's a vast empty
  // belt between cluster copies. Cap at 2× the natural cluster size instead:
  // the cluster is never more than one cluster-width of membrane away, and
  // any duplicate pair can only co-occur near opposite rims, where the
  // falloff has already faded them.
  const cols = Math.max(naturalCols, Math.min(spanCols, naturalCols * 2));
  const rows = Math.max(naturalRows, Math.min(spanRows, naturalRows * 2));
  const slots = new Int32Array(cols * rows).fill(-1);

  // Rank slots by wrapped distance from origin, jittered to rag the edge.
  const ranked: { slot: number; rank: number }[] = [];
  for (let s = 0; s < cols * rows; s++) {
    const sc = s % cols;
    const sr = Math.floor(s / cols);
    const dc = Math.min(sc, cols - sc);
    const dr = Math.min(sr, rows - sr);
    const jitter = (slotHash(s) % 1000) / 1000;
    ranked.push({ slot: s, rank: Math.hypot(dc, dr) + jitter * 1.5 });
  }
  ranked.sort((a, b) => a.rank - b.rank);

  let placed = 0;
  const skipped: number[] = [];
  for (const { slot } of ranked) {
    if (placed >= n) break;
    if (slot === 0) {
      slots[0] = 0; // self / first profile anchors the origin
      placed = Math.max(placed, 1);
      continue;
    }
    if (placed === 0) continue; // slot 0 not ranked first? keep origin reserved
    if (slotHash(slot + 0x5151) % 10 < SPHERE.emptySlotChance) {
      skipped.push(slot);
      continue; // breathing gap
    }
    slots[slot] = placed;
    placed += 1;
  }
  // Tiny-roster safety: fill gap slots if we ran out of ranked space.
  for (const slot of skipped) {
    if (placed >= n) break;
    slots[slot] = placed;
    placed += 1;
  }
  return { cols, rows, slots };
}

/** World cell → user index (or -1) through the period grid. */
export function userAtCell(grid: PeriodGrid, col: number, row: number): number {
  const sc = ((col % grid.cols) + grid.cols) % grid.cols;
  const sr = ((row % grid.rows) + grid.rows) % grid.rows;
  return grid.slots[sr * grid.cols + sc];
}

// ─── the sphere projection ───────────────────────────────────────────────────
export type Warped = {
  x: number;
  y: number;
  scale: number; // pre-zoom falloff scale (multiply by zoom for px)
  alpha: number;
  r: number;     // normalized radius (clamped to 1.4)
};

/**
 * Radial compression + shrink + fade, quadratic in normalized radius.
 * `maxR = hypot(screenW, screenH) * rimRadiusFraction`.
 */
export function warp(
  worldX: number,
  worldY: number,
  panX: number,
  panY: number,
  zoom: number,
  centerX: number,
  centerY: number,
  rimX: number,
  rimY: number,
): Warped {
  const dvx = (worldX + panX) * zoom;
  const dvy = (worldY + panY) * zoom;
  const r = Math.min(Math.hypot(dvx / rimX, dvy / rimY), 1.4);
  const rr = Math.min(r, 1);
  const falloff = rr * rr;
  const compress = 1 - SPHERE.rimCompression * falloff;
  return {
    x: centerX + dvx * compress,
    y: centerY + dvy * compress,
    scale: 1 - SPHERE.rimShrink * falloff,
    alpha: 1 - SPHERE.rimFade * falloff,
    r,
  };
}

/** Center-lens lift: smoothstepped boost within lensRadius of screen center. */
export function lens(
  screenX: number,
  screenY: number,
  centerX: number,
  centerY: number,
): number {
  const d = Math.hypot(screenX - centerX, screenY - centerY);
  if (d >= SPHERE.lensRadius) return 0;
  const t = 1 - d / SPHERE.lensRadius;
  return t * t * (3 - 2 * t);
}

/** easeOutBack for the entrance pop (c1 = 1.70158). */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const u = t - 1;
  return 1 + (c1 + 1) * u * u * u + c1 * u * u;
}

// ─── motion ──────────────────────────────────────────────────────────────────
export type MotionSnapshot = {
  panX: number;
  panY: number;
  zoom: number;
  idleTime: number;
};

/**
 * Pan/zoom physics: drag 1:1, fling with exponential friction, magnetic
 * settle onto the nearest avatar after a glide dies, idle drift when
 * untouched, zoom rubber-band + spring-back. All rates are per-second, so
 * behavior is identical at any refresh rate.
 */
export class SphereMotion {
  panX = 0;
  panY = 0;
  zoom = 1;
  zoomTarget = 1;

  private vx = 0;
  private vy = 0;
  private dragging = false;
  private pinching = false;
  private samples: { t: number; x: number; y: number }[] = [];
  private settleUntil = 0;
  private settleWorld: { x: number; y: number } | null = null;
  private idleTime = 0;

  // Smoothed field velocity → micro-tilt.
  tiltVX = 0;
  tiltVY = 0;
  // Dot feedback ramps.
  rippleAmount = 0;
  grabAmount = 0;

  reducedMotion = false;

  get isDragging(): boolean {
    return this.dragging;
  }

  get speed(): number {
    return Math.hypot(this.vx, this.vy);
  }

  beginDrag(now: number): void {
    this.dragging = true;
    this.vx = 0;
    this.vy = 0;
    this.settleWorld = null;
    this.settleUntil = 0;
    this.idleTime = 0;
    this.grabAmount = 1;
    this.samples = [{ t: now, x: this.panX, y: this.panY }];
  }

  /** Screen-space drag delta (divided by zoom into world units here). */
  dragBy(dx: number, dy: number, now: number): void {
    this.panX += dx / this.zoom;
    this.panY += dy / this.zoom;
    this.samples.push({ t: now, x: this.panX, y: this.panY });
    if (this.samples.length > 10) this.samples.shift();
  }

  endDrag(now: number): void {
    this.dragging = false;
    this.idleTime = 0;
    if (this.reducedMotion) return;
    // Release velocity from the trailing window.
    const oldest = this.samples.find(
      (s) => now - s.t < SPHERE.velocityWindow,
    );
    if (!oldest || now - oldest.t <= 0.008) return;
    const dt = now - oldest.t;
    let vx = (this.panX - oldest.x) / dt;
    let vy = (this.panY - oldest.y) / dt;
    const speed = Math.hypot(vx, vy);
    if (speed > SPHERE.maxFlingSpeed) {
      vx *= SPHERE.maxFlingSpeed / speed;
      vy *= SPHERE.maxFlingSpeed / speed;
    }
    this.vx = vx;
    this.vy = vy;
  }

  beginPinch(): void {
    this.pinching = true;
    this.vx = 0;
    this.vy = 0;
  }

  endPinch(): void {
    this.pinching = false;
    this.zoomTarget = clamp(this.zoom, SPHERE.minZoom, SPHERE.maxZoom);
  }

  /**
   * Apply a raw zoom factor about a screen anchor, with rubber-band past the
   * soft limits. Keeps the world point under the anchor fixed.
   */
  zoomBy(factor: number, anchorX: number, anchorY: number, centerX: number, centerY: number): void {
    let z = this.zoom * factor;
    if (z > SPHERE.maxZoom) z = SPHERE.maxZoom + (z - SPHERE.maxZoom) * SPHERE.overPinch;
    if (z < SPHERE.minZoom) z = SPHERE.minZoom - (SPHERE.minZoom - z) * SPHERE.overPinch;
    z = clamp(z, SPHERE.zoomHardMin, SPHERE.zoomHardMax);
    const inv = 1 / z - 1 / this.zoom;
    this.panX += (anchorX - centerX) * inv;
    this.panY += (anchorY - centerY) * inv;
    this.zoom = z;
  }

  /** Wheel zoom: eased toward a clamped target about the cursor. */
  wheelZoom(deltaFactor: number): void {
    this.zoomTarget = clamp(
      this.zoomTarget * deltaFactor,
      SPHERE.minZoom,
      SPHERE.maxZoom,
    );
  }

  /** The view feeds the nearest-to-center avatar's world point each frame. */
  setSettleCandidate(world: { x: number; y: number } | null): void {
    this.settleWorld = world;
  }

  snapshot(): MotionSnapshot {
    return { panX: this.panX, panY: this.panY, zoom: this.zoom, idleTime: this.idleTime };
  }

  restore(s: MotionSnapshot): void {
    this.panX = s.panX;
    this.panY = s.panY;
    this.zoom = clamp(s.zoom, SPHERE.minZoom, SPHERE.maxZoom);
    this.zoomTarget = this.zoom;
    this.idleTime = s.idleTime;
  }

  /** One physics step. dt in seconds (clamp upstream to ≤ 1/30). */
  tick(dt: number, now: number): void {
    // Zoom spring-back toward target (pinch release, wheel ease).
    if (!this.pinching && Math.abs(this.zoom - this.zoomTarget) > 1e-4) {
      if (this.reducedMotion) {
        this.zoom = this.zoomTarget;
      } else {
        this.zoom += (this.zoomTarget - this.zoom) * Math.min(1, dt * SPHERE.zoomSpringRate);
      }
    }

    // Feedback ramps.
    this.rippleAmount += ((this.dragging ? 1 : 0) - this.rippleAmount) *
      Math.min(1, dt * (this.dragging ? 9 : 6));
    this.grabAmount += (0 - this.grabAmount) * Math.min(1, dt * 7);

    if (!this.dragging && !this.pinching) {
      const speed = this.speed;
      if (speed > SPHERE.stopSpeed) {
        // Momentum glide.
        this.panX += this.vx * dt;
        this.panY += this.vy * dt;
        const decay = Math.pow(SPHERE.frictionBase, dt * 60);
        this.vx *= decay;
        this.vy *= decay;
        if (this.speed <= SPHERE.stopSpeed) {
          this.vx = 0;
          this.vy = 0;
          this.settleUntil = now + SPHERE.settleWindow;
        }
        this.idleTime = 0;
      } else if (now < this.settleUntil && this.settleWorld && !this.reducedMotion) {
        // Magnetic settle: ease the candidate's world point to screen center.
        const tx = -this.settleWorld.x;
        const ty = -this.settleWorld.y;
        const k = Math.min(1, dt * SPHERE.settleRate);
        this.panX += (tx - this.panX) * k;
        this.panY += (ty - this.panY) * k;
        this.idleTime = 0;
      } else if (!this.reducedMotion) {
        // Idle drift, eased in.
        this.idleTime += dt;
        const ramp = Math.min(1, this.idleTime / SPHERE.driftRamp);
        this.panX += SPHERE.driftDirX * SPHERE.driftSpeed * dt * ramp;
        this.panY += SPHERE.driftDirY * SPHERE.driftSpeed * dt * ramp;
      }
    }

    // Smoothed velocity for tilt (low-pass at 12/s). While dragging, derive
    // instantaneous velocity from the trailing samples.
    let fvx = this.vx;
    let fvy = this.vy;
    if (this.dragging && this.samples.length >= 2) {
      const a = this.samples[this.samples.length - 2];
      const b = this.samples[this.samples.length - 1];
      const sdt = Math.max(1e-3, b.t - a.t);
      fvx = (b.x - a.x) / sdt;
      fvy = (b.y - a.y) / sdt;
    }
    const k = Math.min(1, dt * 12);
    this.tiltVX += (fvx - this.tiltVX) * k;
    this.tiltVY += (fvy - this.tiltVY) * k;
  }

  /** Current tilt: degrees + rotation axis (perpendicular to travel). */
  tilt(): { deg: number; ax: number; ay: number } {
    const speed = Math.hypot(this.tiltVX, this.tiltVY);
    if (speed < 1 || this.reducedMotion) return { deg: 0, ax: 0, ay: 1 };
    const deg = Math.min(speed / SPHERE.tiltSpeedNorm, 1) * SPHERE.tiltMaxDeg;
    return { deg, ax: this.tiltVY / speed, ay: -this.tiltVX / speed };
  }
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
