import { GROUND_Y } from '../config';
import type { Perch } from './perch';

const STUMP_UP = 44;
const STUMP_HALF = 34;
const NEST_HALF = 46;
/** The hollow an egg sits in, above the ground line. */
const HOLLOW_UP = 66;

/**
 * A cosy straw nest on a short tree stump. Whatever is put in it sits in the
 * hollow, between the back of the nest and its front rim; an egg left there
 * warms up (the straw glows and stirs a little) and hatches.
 */
export class Nest implements Perch {
  readonly depth = GROUND_Y + 20;
  readonly frontDepth = this.depth + 0.2;
  readonly seatCount = 1;
  /** 0..1, set by the game while an egg is hatching. */
  warm = 0;
  private time = 0;

  constructor(readonly x: number) {}

  seatX(): number {
    return this.x;
  }

  seatTop(): number {
    return this.depth - HOLLOW_UP;
  }

  seatReach(): number {
    return 40;
  }

  seatDepth(): number {
    return this.depth + 0.1;
  }

  hits(px: number, py: number, slop: number): boolean {
    return Math.abs(px - this.x) <= NEST_HALF + slop && py >= this.depth - HOLLOW_UP - 30 - slop && py <= this.depth + slop;
  }

  /** The straw stirs a little while an egg is warming. */
  private get stir(): number {
    this.time = performance.now() / 1000;
    return Math.sin(this.time * 7) * 1.6 * this.warm;
  }

  /** The stump and the back of the nest. */
  draw(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const g = this.depth;
    // The stump: bark, a lighter cut top with rings, and a couple of roots.
    ctx.fillStyle = '#8d6e5a';
    ctx.beginPath();
    ctx.moveTo(x - STUMP_HALF - 12, g);
    ctx.quadraticCurveTo(x - STUMP_HALF, g - 6, x - STUMP_HALF, g - 16);
    ctx.lineTo(x - STUMP_HALF + 2, g - STUMP_UP);
    ctx.lineTo(x + STUMP_HALF - 2, g - STUMP_UP);
    ctx.lineTo(x + STUMP_HALF, g - 16);
    ctx.quadraticCurveTo(x + STUMP_HALF, g - 6, x + STUMP_HALF + 12, g);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7a5c4a';
    for (const dx of [-14, 10]) {
      ctx.beginPath();
      ctx.roundRect(x + dx, g - STUMP_UP + 10, 5, STUMP_UP - 14, 2.5);
      ctx.fill();
    }
    ctx.fillStyle = '#d9b48a';
    ctx.beginPath();
    ctx.ellipse(x, g - STUMP_UP, STUMP_HALF - 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // A soft warm glow round the nest while an egg is hatching.
    if (this.warm > 0) {
      const cy = this.seatTop() - 10;
      const glow = ctx.createRadialGradient(x, cy, 4, x, cy, 80);
      glow.addColorStop(0, `rgba(255, 226, 160, ${0.45 * this.warm})`);
      glow.addColorStop(1, 'rgba(255, 226, 160, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, cy, 80, 0, Math.PI * 2);
      ctx.fill();
    }
    // The back of the nest: a darker bowl of straw.
    const top = this.seatTop();
    ctx.fillStyle = '#c9a25c';
    ctx.beginPath();
    ctx.ellipse(x, top + 2, NEST_HALF - 4, 16, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a9823f';
    ctx.beginPath();
    ctx.ellipse(x, top + 4, NEST_HALF - 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /** The front rim of straw, drawn over whatever sits in the nest. */
  drawFront(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const top = this.seatTop();
    const s = this.stir;
    ctx.fillStyle = '#ddb86c';
    ctx.beginPath();
    ctx.moveTo(x - NEST_HALF, top + 2);
    ctx.quadraticCurveTo(x, top + 12, x + NEST_HALF, top + 2);
    ctx.quadraticCurveTo(x + NEST_HALF + 2, top + 22, x + NEST_HALF - 14, this.depth - STUMP_UP + 2);
    ctx.lineTo(x - NEST_HALF + 14, this.depth - STUMP_UP + 2);
    ctx.quadraticCurveTo(x - NEST_HALF - 2, top + 22, x - NEST_HALF, top + 2);
    ctx.fill();
    // Wisps of straw sticking out, stirring while it is warm.
    ctx.strokeStyle = '#c9a25c';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const [dx, dy, ex, ey] of [
      [-40, 8, -54, 2],
      [-22, 16, -34, 24],
      [6, 18, 16, 26],
      [30, 10, 50, 6],
      [40, 4, 52, -4],
    ]) {
      ctx.moveTo(x + dx, top + dy);
      ctx.lineTo(x + ex + s, top + ey - Math.abs(s) * 0.5);
    }
    ctx.stroke();
    ctx.strokeStyle = '#b8914c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const dx of [-28, -8, 12, 30]) {
      ctx.moveTo(x + dx - 8, top + 12);
      ctx.quadraticCurveTo(x + dx, top + 20, x + dx + 9, top + 14);
    }
    ctx.stroke();
  }
}
