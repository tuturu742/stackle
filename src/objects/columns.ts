import { GROUND_Y } from '../config';
import { mix } from '../color';
import type { Perch } from './perch';

const ICE = '#cfeaf5';
const ICE_LIGHT = '#eef8fc';
const ICE_SHADE = '#b3d9ea';
const WIDTH = 46;
const SPACING = 78;
/** Heights of the columns, left to right. */
const HEIGHTS = [150, 200, 250, 200, 150];

/**
 * A row of ice columns. Anything can stand on top of one, and a candle standing
 * on one gives the ice its colour, until it is taken off again.
 */
export class IceColumns implements Perch {
  readonly depth = GROUND_Y + 14;
  readonly seatCount = HEIGHTS.length;
  /** Each column's colour, or null for plain ice. */
  colors: (string | null)[] = HEIGHTS.map(() => null);
  /** 1 just coloured, fading to 0: a soft shimmer. */
  private shine = HEIGHTS.map(() => 0);

  constructor(readonly x: number) {}

  get width(): number {
    return (HEIGHTS.length - 1) * SPACING + WIDTH;
  }

  seatX(i: number): number {
    return this.x + (i - (HEIGHTS.length - 1) / 2) * SPACING;
  }

  seatTop(i: number): number {
    return this.depth - HEIGHTS[i];
  }

  seatReach(): number {
    return WIDTH / 2 + 14;
  }

  /** The colour of the candle standing on top, or null for none: the ice shimmers as it changes. */
  tint(i: number, color: string | null): void {
    if (this.colors[i] === color) return;
    this.colors[i] = color;
    if (color) this.shine[i] = 1;
  }

  update(dt: number): void {
    this.shine = this.shine.map((s) => Math.max(0, s - dt * 1.2));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < HEIGHTS.length; i++) {
      const x = this.seatX(i);
      const top = this.seatTop(i);
      const color = this.colors[i];
      const body = color ? mix(ICE, color, 0.55) : ICE;
      const light = color ? mix(ICE_LIGHT, color, 0.25) : ICE_LIGHT;
      const shade = color ? mix(ICE_SHADE, color, 0.7) : ICE_SHADE;
      // Base and capital, a little wider than the shaft.
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.roundRect(x - WIDTH / 2 - 8, this.depth - 16, WIDTH + 16, 16, 5);
      ctx.roundRect(x - WIDTH / 2 - 6, top, WIDTH + 12, 14, 5);
      ctx.fill();
      ctx.fillStyle = body;
      ctx.fillRect(x - WIDTH / 2, top + 14, WIDTH, this.depth - 16 - top - 14);
      // Shine down one side, and fluting.
      ctx.fillStyle = light;
      ctx.fillRect(x - WIDTH / 2 + 6, top + 18, 8, this.depth - top - 40);
      ctx.fillStyle = shade;
      ctx.globalAlpha = 0.5;
      for (const dx of [6, 16]) ctx.fillRect(x + dx - 2, top + 18, 3, this.depth - top - 40);
      ctx.globalAlpha = 1;
      if (this.shine[i] > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.shine[i] * 0.6})`;
        ctx.fillRect(x - WIDTH / 2, top, WIDTH, this.depth - top);
      }
    }
  }

  /** At night a coloured column glows softly. */
  drawGlow(ctx: CanvasRenderingContext2D, night: number, lit: boolean[]): void {
    if (night <= 0) return;
    for (let i = 0; i < HEIGHTS.length; i++) {
      if (!lit[i]) continue;
      const x = this.seatX(i);
      const y = this.seatTop(i) - 30;
      const glow = ctx.createRadialGradient(x, y, 4, x, y, 70);
      glow.addColorStop(0, `rgba(255, 220, 140, ${0.55 * night})`);
      glow.addColorStop(1, 'rgba(255, 220, 140, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 70, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
