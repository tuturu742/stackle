import { GROUND_Y, palette } from '../config';
import type { Sink } from './sink';

/** Half the puddle's height on screen: tall enough for small hands to hit. */
export const PUDDLE_RY = 36;

interface Ripple {
  x: number;
  age: number;
  size: number;
}

/**
 * A puddle lies flat on the ground. A disposable thing let go directly on its
 * water drowns with a splash; anything else just stays on the ground around it.
 */
export class Puddle implements Sink {
  /** Depth of the water's centre line, for drawing order. Set a little forward on the ground. */
  readonly depth = GROUND_Y + 40;
  readonly surfaceY = this.depth;
  /** Where a drowning tower's bottom rests while it goes under. */
  readonly drownY = this.depth - 2;
  /** Water colours: deep edge, surface, and the light of ripples and splashes. */
  readonly deep: string = palette.waterDeep;
  readonly water: string = palette.water;
  readonly light: string = palette.waterLight;
  private ripples: Ripple[] = [];
  /** The moon's reflection shivers after a tap: 1 just tapped, fading to 0. */
  private wobble = 0;

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

  /** Is a bottom edge at this point on the water (with a little margin around it)? */
  holds(x: number, bottom: number): boolean {
    const dx = (x - this.x) / (this.width / 2);
    const dy = (bottom - this.depth) / (PUDDLE_RY + 18);
    return dx * dx + dy * dy <= 1;
  }

  /** A finger taps the water. */
  tap(x: number): void {
    this.ripple(x, 0.5);
    this.wobble = 1;
  }

  ripple(x: number, size: number): void {
    this.ripples.push({ x, age: 0, size });
  }

  update(dt: number): void {
    this.wobble = Math.max(0, this.wobble - dt * 0.7);
    for (const r of this.ripples) r.age += dt;
    this.ripples = this.ripples.filter((r) => r.age < 1.4);
  }

  /**
   * The moon on the water, shivering after a tap. Drawn over the darkened
   * landscape at night, so it shines; `night` from 0 (day) to 1.
   */
  drawMoon(ctx: CanvasRenderingContext2D, time: number, night: number): void {
    if (night <= 0) return;
    const w = this.wobble;
    const mx = this.x + (this.width / 2) * 0.2;
    ctx.fillStyle = '#fbf3d0';
    ctx.globalAlpha = 0.6 * night;
    for (let k = 0; k < 4; k++) {
      const shift = Math.sin(time * 14 + k * 1.7) * 10 * w;
      ctx.beginPath();
      ctx.ellipse(mx + shift, this.depth - 9 + k * 5, 22 - k * 3 + w * 4, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const rx = this.width / 2;
    const ry = PUDDLE_RY;
    const cy = this.depth;

    ctx.fillStyle = this.deep;
    ctx.beginPath();
    ctx.ellipse(this.x, cy + 3, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.water;
    ctx.beginPath();
    ctx.ellipse(this.x, cy, rx - 6, ry - 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(this.x, cy, rx - 6, ry - 4, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = this.light;
    ctx.globalAlpha = 0.6;
    const shimmer = Math.sin(time * 1.5) * 8;
    ctx.beginPath();
    ctx.ellipse(this.x - rx * 0.35 + shimmer, cy - ry * 0.4, rx * 0.25, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = this.light;
    ctx.lineWidth = 3;
    for (const r of this.ripples) {
      const t = r.age / 1.4;
      ctx.globalAlpha = (1 - t) * 0.9;
      // Big splashes ripple across the puddle; raindrops make small rings.
      const w = 12 + t * Math.min(rx * 0.9, 30 + 100 * r.size);
      ctx.beginPath();
      ctx.ellipse(r.x, cy, w, (w * ry) / rx, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * A mud puddle: everything a puddle does, in brown. An animal floating in it
 * comes out muddy, until it is washed in clean water or rain.
 */
export class Mud extends Puddle {
  override readonly deep = '#7d5f46';
  override readonly water = '#9c7a5c';
  override readonly light = '#b8987a';
}
