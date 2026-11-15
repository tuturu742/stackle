import { GROUND_Y, palette } from '../config';

interface Ripple {
  x: number;
  age: number;
  size: number;
}

/**
 * A puddle lies flat on the ground. A disposable thing let go directly on its
 * water drowns with a splash; anything else just stays on the ground around it.
 */
export class Puddle {
  readonly surfaceY = GROUND_Y - 4;
  /** Depth of the water's centre line, for drawing order. */
  readonly depth = GROUND_Y + 4;
  /** Where a drowning tower's bottom rests while it goes under. */
  readonly drownY = GROUND_Y + 2;
  private ripples: Ripple[] = [];

  constructor(
    readonly x: number,
    readonly width: number,
  ) {}

  /** Floating things sit this deep: 10% of their height under the water line. */
  floatBottom(height: number): number {
    return this.depth + height * 0.1;
  }

  /** Keep a floater of this half-width over the water, not the bank. */
  floatX(x: number, radius: number): number {
    const reach = Math.max(0, this.width / 2 - radius * 0.8);
    return Math.max(this.x - reach, Math.min(this.x + reach, x));
  }

  /** Is a bottom edge at this point directly on the water? */
  holds(x: number, bottom: number): boolean {
    return Math.abs(x - this.x) <= this.width * 0.45 && bottom >= this.depth - 36 && bottom <= this.depth + 16;
  }

  ripple(x: number, size: number): void {
    this.ripples.push({ x, age: 0, size });
  }

  update(dt: number): void {
    for (const r of this.ripples) r.age += dt;
    this.ripples = this.ripples.filter((r) => r.age < 1.4);
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const rx = this.width / 2;
    const ry = 20;
    const cy = GROUND_Y + 4;

    ctx.fillStyle = palette.waterDeep;
    ctx.beginPath();
    ctx.ellipse(this.x, cy + 3, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.water;
    ctx.beginPath();
    ctx.ellipse(this.x, cy, rx - 6, ry - 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(this.x, cy, rx - 6, ry - 4, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = palette.waterLight;
    ctx.globalAlpha = 0.6;
    const shimmer = Math.sin(time * 1.5) * 8;
    ctx.beginPath();
    ctx.ellipse(this.x - rx * 0.35 + shimmer, cy - 5, rx * 0.25, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.waterLight;
    ctx.lineWidth = 3;
    for (const r of this.ripples) {
      const t = r.age / 1.4;
      ctx.globalAlpha = (1 - t) * 0.9;
      const w = 12 + t * rx * (0.6 + 0.2 * r.size);
      ctx.beginPath();
      ctx.ellipse(r.x, cy, w, w * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}
