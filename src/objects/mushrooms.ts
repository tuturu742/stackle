import { GROUND_Y } from '../config';
import { settings } from '../settings';

interface Toadstool {
  dx: number;
  /** Stem height and cap radius. */
  h: number;
  r: number;
  cap: string;
  dots: boolean;
  /** 1 just tapped, easing to 0: a springy bounce. */
  bounce: number;
}

/** The toadstools, left to right (the game plays them low to high). */
const LOOKS: Omit<Toadstool, 'bounce'>[] = [
  { dx: -64, h: 30, r: 24, cap: '#b9773f', dots: false },
  { dx: -30, h: 46, r: 28, cap: '#e0574f', dots: true },
  { dx: 6, h: 24, r: 18, cap: '#d9b48a', dots: false },
  { dx: 36, h: 38, r: 24, cap: '#e0574f', dots: true },
  { dx: 64, h: 18, r: 14, cap: '#9a6bc9', dots: false },
];

/**
 * A little ring of toadstools on the ground. Each one tapped bounces, and the
 * game plays it a note of its own, so the ring can be played like a xylophone.
 */
export class Mushrooms {
  readonly depth = GROUND_Y + 8;
  private readonly stools: Toadstool[];

  constructor(
    readonly x: number,
    readonly seed = 0,
  ) {
    this.stools = LOOKS.map((look, i) => ({ ...look, h: look.h + ((i * 7 + seed * 5) % 8), bounce: 0 }));
  }

  /** The toadstool under the point (left to right), or -1. It starts to bounce. */
  tapAt(px: number, py: number, slop: number): number {
    let best = -1;
    let bestDist = Infinity;
    this.stools.forEach((s, i) => {
      const sx = this.x + s.dx;
      const capY = this.depth - s.h;
      const inside = Math.abs(px - sx) <= s.r + slop && py <= this.depth + slop && py >= capY - s.r - slop;
      const dist = Math.abs(px - sx);
      if (inside && dist < bestDist) {
        best = i;
        bestDist = dist;
      }
    });
    if (best >= 0) this.stools[best].bounce = 1;
    return best;
  }

  update(dt: number): void {
    for (const s of this.stools) s.bounce = Math.max(0, s.bounce - dt * 1.6);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const amount = settings.reduceMotion ? 0.3 : 1;
    for (const s of this.stools) {
      const sx = this.x + s.dx;
      // A squash and stretch that settles: taller, then shorter, then still.
      const k = Math.sin((1 - s.bounce) * 14) * s.bounce * amount;
      const h = s.h * (1 + k * 0.25);
      const w = 1 - k * 0.15;
      const g = this.depth;
      ctx.fillStyle = '#f3ead8';
      ctx.beginPath();
      ctx.roundRect(sx - 7 * w, g - h, 14 * w, h, [4, 4, 6, 6]);
      ctx.fill();
      ctx.fillStyle = s.cap;
      ctx.beginPath();
      ctx.ellipse(sx, g - h, s.r * w, s.r * 0.75, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e6dcc6';
      ctx.beginPath();
      ctx.ellipse(sx, g - h, s.r * w, 4, 0, 0, Math.PI);
      ctx.fill();
      if (s.dots) {
        ctx.fillStyle = '#f7f3ea';
        for (const [fx, fy, fr] of [
          [-0.45, -0.35, 0.16],
          [0.1, -0.6, 0.14],
          [0.5, -0.3, 0.12],
        ]) {
          ctx.beginPath();
          ctx.arc(sx + fx * s.r * w, g - h + fy * s.r, fr * s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}
