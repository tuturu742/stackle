import { GROUND_Y } from '../config';
import type { Perch } from './perch';

const HALF = 120;
const TALL = 170;
/** The doorway: half its width at the ground, and how high it reaches. */
const DOOR_HALF = 46;
const DOOR_UP = 120;
const STRIPES = ['#e8875a', '#f4dcb8'];
const FLAP = '#d9714a';

/**
 * A striped camping tent with a pennant on its pole and guy lines pegged out.
 * One animal can sit inside, in the doorway; a tap rolls the flap down over it
 * (hidden and out of reach) or up again.
 */
export class Tent implements Perch {
  readonly depth = GROUND_Y + 18;
  /** The flap goes in front of whoever sits inside. */
  readonly frontDepth = this.depth + 0.2;
  readonly seatCount = 1;
  open = true;

  constructor(readonly x: number) {}

  seatX(): number {
    return this.x;
  }

  seatTop(): number {
    return this.depth - 4;
  }

  seatReach(): number {
    return 50;
  }

  hides(): boolean {
    return !this.open;
  }

  /** Whoever sits inside shows only through the doorway. */
  clip(ctx: CanvasRenderingContext2D): void {
    doorway(ctx, this.x, this.depth);
    ctx.clip();
  }

  /** Opens or shuts the flap; returns true as it opens. */
  toggle(): boolean {
    this.open = !this.open;
    return this.open;
  }

  hits(px: number, py: number, slop: number): boolean {
    const dy = this.depth - py;
    if (dy < -slop || dy > TALL + slop) return false;
    // Inside the triangle, widened by the slop.
    return Math.abs(px - this.x) <= HALF * (1 - Math.max(0, dy) / TALL) + slop;
  }

  /** Guy lines, the striped canvas and the dark inside of the doorway. */
  draw(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const g = this.depth;
    const peak = g - TALL;
    // Guy lines from the peak to pegs on the ground either side.
    ctx.strokeStyle = '#b89a7c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const side of [-1, 1]) {
      ctx.moveTo(x + side * 10, peak + 14);
      ctx.lineTo(x + side * (HALF + 46), g - 2);
    }
    ctx.stroke();
    for (const side of [-1, 1]) box(ctx, x + side * (HALF + 46) - 3, g - 8, 6, 10, 2, '#8f6a4e');
    // The pole and its pennant.
    box(ctx, x - 3, peak - 40, 6, 44, 3, '#8f6a4e');
    ctx.fillStyle = '#f2b544';
    ctx.beginPath();
    ctx.moveTo(x + 3, peak - 40);
    ctx.lineTo(x + 38, peak - 31);
    ctx.lineTo(x + 3, peak - 22);
    ctx.closePath();
    ctx.fill();
    // The canvas in soft stripes, rounded a little at the corners.
    ctx.save();
    canvas(ctx, x, g);
    ctx.clip();
    const w = (HALF * 2) / 6;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = STRIPES[i % 2];
      ctx.fillRect(x - HALF + i * w, peak - 4, w + 1, TALL + 6);
    }
    // A gentle shade down the right-hand slope.
    ctx.fillStyle = 'rgba(120, 70, 40, 0.12)';
    ctx.beginPath();
    ctx.moveTo(x, peak);
    ctx.lineTo(x + HALF + 4, g + 2);
    ctx.lineTo(x + 40, g + 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // The dark inside.
    ctx.fillStyle = '#5a3f33';
    doorway(ctx, x, g);
    ctx.fill();
  }

  /** The flap: tied back in two rolls when open, hanging down over the doorway when shut. */
  drawFront(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const g = this.depth;
    ctx.fillStyle = FLAP;
    if (!this.open) {
      doorway(ctx, x, g);
      ctx.fill();
      // The seam down the middle, and a little toggle.
      ctx.fillStyle = 'rgba(120, 70, 40, 0.25)';
      ctx.fillRect(x - 1, g - DOOR_UP + 12, 2, DOOR_UP - 12);
      dot(ctx, x, g - DOOR_UP * 0.45, 4, '#8f6a4e');
      return;
    }
    // Rolled back to each side of the doorway, tied with a cord.
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * 2, g - DOOR_UP + 2);
      ctx.quadraticCurveTo(x + side * DOOR_HALF * 0.5, g - DOOR_UP * 0.62, x + side * DOOR_HALF * 0.82, g - DOOR_UP * 0.42);
      ctx.quadraticCurveTo(x + side * DOOR_HALF * 0.86, g - DOOR_UP * 0.2, x + side * (DOOR_HALF + 4), g);
      ctx.lineTo(x + side * (DOOR_HALF + 14), g);
      ctx.quadraticCurveTo(x + side * DOOR_HALF * 0.6, g - DOOR_UP * 0.7, x + side * 2, g - DOOR_UP + 2);
      ctx.closePath();
      ctx.fill();
      dot(ctx, x + side * DOOR_HALF * 0.85, g - DOOR_UP * 0.42, 4, '#8f6a4e');
    }
  }
}

/** The tent's outline: a tall triangle with softened corners. */
function canvas(ctx: CanvasRenderingContext2D, x: number, g: number): void {
  ctx.beginPath();
  ctx.moveTo(x - HALF, g);
  ctx.quadraticCurveTo(x - 6, g - TALL - 6, x, g - TALL);
  ctx.quadraticCurveTo(x + 6, g - TALL - 6, x + HALF, g);
  ctx.quadraticCurveTo(x, g + 6, x - HALF, g);
  ctx.closePath();
}

/** The doorway: an arch-topped triangle opening at the ground. */
function doorway(ctx: CanvasRenderingContext2D, x: number, g: number): void {
  ctx.beginPath();
  ctx.moveTo(x - DOOR_HALF, g);
  ctx.quadraticCurveTo(x - DOOR_HALF * 0.4, g - DOOR_UP * 0.7, x, g - DOOR_UP);
  ctx.quadraticCurveTo(x + DOOR_HALF * 0.4, g - DOOR_UP * 0.7, x + DOOR_HALF, g);
  ctx.closePath();
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
