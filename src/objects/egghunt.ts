import { settings } from '../settings';
import { GOODS, PAINTED_EGGS, drawGood, type PaintedEggKind } from './goods';
import type { ItemKind } from './item';

// The egg hunt: painted eggs tucked half out of sight round a level, peeking from
// a tuft of grass, a clump of flowers, a heap of leaves or between two pebbles.
// A found egg is an item like any other. An empty spot gets a fresh egg only
// after a while, while it is off screen, so nothing appears in front of the child.

export type EggCover = 'grass' | 'flowers' | 'leaves' | 'stones';

export interface EggSpot {
  readonly x: number;
  readonly depth: number;
  readonly cover: EggCover;
  kind: PaintedEggKind;
  present: boolean;
  /** Seconds since its egg was taken. */
  empty: number;
  /** A little tilt, so the eggs don't all sit the same way. */
  readonly tilt: number;
}

/** An empty spot waits at least this long before it can get another egg. */
const REFILL_SECONDS = 8;
/** How far the egg's bottom sits below the ground line at its spot: it is nestled in. */
const SINK = 2;

export class EggHunt {
  readonly spots: EggSpot[];
  /** Which design goes into the next refilled spot. */
  private next: number;

  constructor(spots: { x: number; depth: number; cover: EggCover }[]) {
    this.spots = spots.map((s, i) => ({
      ...s,
      kind: PAINTED_EGGS[i % PAINTED_EGGS.length],
      present: true,
      empty: 0,
      tilt: (((i * 37) % 7) - 3) * 0.06,
    }));
    this.next = spots.length % PAINTED_EGGS.length;
  }

  private bottom(spot: EggSpot): number {
    return spot.depth + SINK;
  }

  /** A present egg under the finger: the egg itself, or the top of its cover. */
  at(px: number, py: number, slop: number): { spot: number; dist: number } | null {
    let best: { spot: number; dist: number } | null = null;
    this.spots.forEach((spot, i) => {
      if (!spot.present) return;
      const { radius, height } = GOODS[spot.kind];
      const cy = this.bottom(spot) - height / 2;
      const dist = Math.hypot(px - spot.x, (py - cy) * 0.8);
      if (dist <= Math.max(radius, height / 2) + 14 + slop && (!best || dist < best.dist)) best = { spot: i, dist };
    });
    return best;
  }

  /** The egg comes out; the game makes a held stack where its bottom was. */
  take(i: number): { kind: ItemKind; x: number; bottom: number } {
    const spot = this.spots[i];
    spot.present = false;
    spot.empty = 0;
    return { kind: spot.kind, x: spot.x, bottom: this.bottom(spot) };
  }

  /** Returns true if an egg was hidden again this step (never while its spot can be seen). */
  update(dt: number, canHide: boolean, offScreen: (x: number) => boolean): boolean {
    let hid = false;
    for (const spot of this.spots) {
      if (spot.present) continue;
      spot.empty += dt;
      if (spot.empty < REFILL_SECONDS || !canHide || !offScreen(spot.x)) continue;
      spot.kind = PAINTED_EGGS[this.next];
      this.next = (this.next + 1) % PAINTED_EGGS.length;
      spot.present = true;
      hid = true;
      // One at a time, so the cap counts each one.
      canHide = false;
    }
    return hid;
  }

  snapshot(): boolean[] {
    return this.spots.map((s) => s.present);
  }

  restore(present: boolean[]): void {
    present.forEach((p, i) => {
      if (this.spots[i]) this.spots[i].present = p;
    });
  }

  /** The egg (if it is there), then its cover over its lower half. */
  drawSpot(ctx: CanvasRenderingContext2D, i: number, time: number): void {
    const spot = this.spots[i];
    const { height } = GOODS[spot.kind];
    const bottom = this.bottom(spot);
    if (spot.present) {
      drawGood(ctx, spot.kind, spot.x, bottom - height / 2, spot.tilt, 1, 1);
      if (!settings.reduceMotion) sparkle(ctx, spot.x, bottom - height, time + i * 1.7);
    }
    COVERS[spot.cover](ctx, spot.x, spot.depth, i);
  }
}

/** Every few seconds a small soft twinkle near the top of the egg. */
function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  const t = (time % 5) / 0.8;
  if (t >= 1) return;
  const s = Math.sin(t * Math.PI) * 5;
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#ffffff';
  ctx.translate(x + 10, y + 6);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(0, 0, s, 0);
  ctx.quadraticCurveTo(0, 0, 0, s);
  ctx.quadraticCurveTo(0, 0, -s, 0);
  ctx.quadraticCurveTo(0, 0, 0, -s);
  ctx.fill();
  ctx.restore();
}

function blob(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, rx: number, ry: number, a = 0): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, a, 0, Math.PI * 2);
  ctx.fill();
}

const COVERS: Record<EggCover, (ctx: CanvasRenderingContext2D, x: number, g: number, seed: number) => void> = {
  grass(ctx, x, g) {
    // A tuft of rounded blades, darker behind and lighter in front.
    blob(ctx, '#7fbf68', x, g, 34, 10);
    for (const [dx, h, a, color] of [
      [-26, 30, -0.35, '#7fbf68'],
      [-14, 36, -0.15, '#8fcd74'],
      [-2, 28, 0.05, '#7fbf68'],
      [10, 36, 0.18, '#8fcd74'],
      [24, 30, 0.38, '#7fbf68'],
      [-20, 24, -0.25, '#a3d985'],
      [16, 24, 0.28, '#a3d985'],
      [2, 22, 0, '#a3d985'],
    ] as const) {
      ctx.save();
      ctx.translate(x + dx, g + 4);
      ctx.rotate(a);
      blob(ctx, color, 0, -h * 0.33, 5, h * 0.33);
      ctx.restore();
    }
  },
  flowers(ctx, x, g, seed) {
    blob(ctx, '#86c26e', x, g, 36, 11);
    blob(ctx, '#9bd17f', x - 14, g - 4, 18, 9);
    blob(ctx, '#9bd17f', x + 16, g - 3, 18, 8);
    const colors = ['#f6a9c0', '#f6d36a', '#ffffff'];
    [
      [-24, -12],
      [-6, -18],
      [12, -14],
      [28, -8],
      [0, -4],
    ].forEach(([dx, dy], k) => {
      const color = colors[(k + seed) % colors.length];
      for (let p = 0; p < 5; p++) {
        const a = (p * Math.PI * 2) / 5;
        blob(ctx, color, x + dx + Math.cos(a) * 4, g + dy * 0.6 + Math.sin(a) * 4, 3.4, 3.4);
      }
      blob(ctx, color === '#f6d36a' ? '#f2a64b' : '#f6d36a', x + dx, g + dy * 0.6, 2.4, 2.4);
    });
  },
  leaves(ctx, x, g, seed) {
    // A soft heap of fallen leaves: mostly greens, a few blossom pinks.
    blob(ctx, '#8cc477', x, g, 38, 10);
    const colors = ['#a6d38a', '#7fb86a', '#f4bfd0', '#b8de9c'];
    [
      [-28, -6, -0.6],
      [-14, -14, 0.4],
      [0, -18, -0.2],
      [14, -13, 0.7],
      [28, -5, 0.2],
      [-6, -6, 1.2],
      [10, -3, -0.9],
    ].forEach(([dx, dy, a], k) => blob(ctx, colors[(k + seed) % colors.length], x + dx, g + dy * 0.6, 12, 6, a));
  },
  stones(ctx, x, g) {
    // Two rounded pebbles either side, the egg nestled between them.
    blob(ctx, '#b8b2aa', x - 20, g - 8, 20, 15);
    blob(ctx, '#ccc6be', x - 24, g - 14, 9, 5, -0.2);
    blob(ctx, '#aaa49c', x + 22, g - 6, 18, 13);
    blob(ctx, '#c2bcb4', x + 18, g - 11, 8, 4, 0.2);
    blob(ctx, '#9cc784', x, g + 2, 16, 5);
  },
};
