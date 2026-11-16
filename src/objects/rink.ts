import { GROUND_Y } from '../config';

/** Seconds a skate scratch takes to fade away. */
const SCRATCH_SECONDS = 4;
const MAX_SCRATCHES = 240;

interface Scratch {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  age: number;
}

/** How high the snowy terrace under the rink stands above the ground line. */
const RISE = 78;

/**
 * A frozen rink up on a snowy terrace, off the road. Whatever is let go on it
 * keeps sliding, slowly slowing, bouncing softly off the edges, and leaves thin
 * scratches on the ice that fade away.
 */
export class Rink {
  /** The middle of the ice, and how far it reaches toward and away from the viewer. */
  readonly cy = GROUND_Y - RISE;
  readonly ry = 34;
  /** Drawn behind everything standing on it. */
  readonly depth = this.cy - this.ry - 6;
  private scratches: Scratch[] = [];

  constructor(
    readonly x: number,
    readonly width: number,
  ) {}

  get rx(): number {
    return this.width / 2;
  }

  /** Is a stack standing at (x, floor) on the ice? `x` is relative to the loop near the rink. */
  holds(x: number, floor: number): boolean {
    const dx = (x - this.x) / this.rx;
    const dy = (floor - this.cy) / this.ry;
    return dx * dx + dy * dy <= 1;
  }

  /** How far either side of the middle the ice reaches on this ground line, less a margin. */
  reach(floor: number, margin: number): number {
    const dy = Math.min(1, Math.abs(floor - this.cy) / this.ry);
    return Math.max(0, this.rx * Math.sqrt(1 - dy * dy) - margin);
  }

  scratch(x1: number, x2: number, y: number): void {
    this.scratches.push({ x1, y1: y, x2, y2: y + (Math.random() - 0.5) * 3, age: 0 });
    if (this.scratches.length > MAX_SCRATCHES) this.scratches.shift();
  }

  /** A tap ripples nothing, but leaves a little star of scratches. */
  update(dt: number): void {
    for (const s of this.scratches) s.age += dt;
    this.scratches = this.scratches.filter((s) => s.age < SCRATCH_SECONDS);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // The terrace: a snowy bank with a soft shaded front and a few steps up at each end.
    const left = this.x - this.rx - 30;
    const right = this.x + this.rx + 30;
    ctx.fillStyle = '#dbe7f4';
    ctx.beginPath();
    ctx.moveTo(left - 40, GROUND_Y + 4);
    ctx.quadraticCurveTo(left - 30, this.cy, left + 20, this.cy - 4);
    ctx.lineTo(right - 20, this.cy - 4);
    ctx.quadraticCurveTo(right + 30, this.cy, right + 40, GROUND_Y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c8daee';
    ctx.beginPath();
    ctx.moveTo(left - 10, GROUND_Y + 4);
    ctx.quadraticCurveTo(left, this.cy + this.ry + 10, left + 60, this.cy + this.ry + 8);
    ctx.lineTo(right - 60, this.cy + this.ry + 8);
    ctx.quadraticCurveTo(right, this.cy + this.ry + 10, right + 10, GROUND_Y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f4f8fc';
    for (const side of [-1, 1]) {
      const edge = side < 0 ? left : right;
      for (let k = 0; k < 3; k++) {
        const w = 34;
        const sx = edge - side * (k * 18) - (side < 0 ? w : 0);
        ctx.beginPath();
        ctx.roundRect(sx - side * 10, GROUND_Y - 4 - k * 24, w, 10, 4);
        ctx.fill();
      }
    }
    // A snowy rim, then the ice with soft streaks of light.
    ctx.fillStyle = '#f4f8fc';
    ctx.beginPath();
    ctx.ellipse(this.x, this.cy, this.rx + 18, this.ry + 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bfe3f0';
    ctx.beginPath();
    ctx.ellipse(this.x, this.cy, this.rx, this.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (const [dx, w] of [
      [-0.55, 0.12],
      [-0.2, 0.06],
      [0.3, 0.1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(this.x + dx * this.rx, this.cy + this.ry);
      ctx.lineTo(this.x + (dx + w) * this.rx, this.cy + this.ry);
      ctx.lineTo(this.x + (dx + w + 0.25) * this.rx, this.cy - this.ry);
      ctx.lineTo(this.x + (dx + 0.25) * this.rx, this.cy - this.ry);
      ctx.fill();
    }
    // Each scratch is a thin bright line with a blue cut under it, fading away.
    ctx.lineCap = 'round';
    for (const [color, width, dy] of [
      ['143, 190, 214', 3.5, 1.5],
      ['255, 255, 255', 2.5, 0],
    ] as const) {
      ctx.lineWidth = width;
      for (const s of this.scratches) {
        ctx.strokeStyle = `rgba(${color}, ${1 - s.age / SCRATCH_SECONDS})`;
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1 + dy);
        ctx.lineTo(s.x2, s.y2 + dy);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
