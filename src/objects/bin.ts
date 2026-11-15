import { GROUND_Y } from '../config';
import type { Sink } from './sink';

const WIDTH = 120;
const HEIGHT = 140;
/** How far outside the opening a let-go still counts, to be kind to small hands. */
const MARGIN = 14;

/**
 * An open bin. Food and hats placed on its opening, or thrown or dropped in
 * through it, go in one at a time, with a gulp each and a burp at the end. An
 * animal just sits on it.
 */
export class Bin implements Sink {
  /** Its front stands on this ground line. */
  readonly depth = GROUND_Y + 30;
  readonly rim = this.depth - HEIGHT;
  readonly drownY = this.rim;
  private gulp = 0;

  constructor(readonly x: number) {}

  /** The dark opening's half-width and half-height, around the line `rim + 4`. */
  static readonly openingRx = WIDTH / 2 - 6;
  static readonly openingRy = 10;

  holds(x: number, bottom: number): boolean {
    return Math.abs(x - this.x) <= WIDTH / 2 + MARGIN && bottom >= this.rim - 50 && bottom <= this.rim + 30;
  }

  /** Something falling from `from` to `to` this step drops in through the opening. */
  catches(x: number, from: number, to: number): boolean {
    return Math.abs(x - this.x) <= WIDTH / 2 && from < this.rim && to >= this.rim;
  }

  floatBottom(): number {
    return this.rim - 4;
  }

  floatX(x: number, radius: number): number {
    const reach = Math.max(0, WIDTH / 2 - radius * 0.5);
    return Math.max(this.x - reach, Math.min(this.x + reach, x));
  }

  swallow(): void {
    this.gulp = 1;
  }

  update(dt: number): void {
    this.gulp = Math.max(0, this.gulp - dt * 4);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const g = Math.sin(this.gulp * Math.PI) * 0.08;
    const w = WIDTH * (1 + g);
    const top = this.rim + HEIGHT * g;
    // Body, a little narrower at the bottom.
    ctx.fillStyle = '#6fb08d';
    ctx.beginPath();
    ctx.moveTo(this.x - w / 2 + 2, top + 6);
    ctx.lineTo(this.x + w / 2 - 2, top + 6);
    ctx.lineTo(this.x + w / 2 - 12, this.depth - 10);
    ctx.quadraticCurveTo(this.x + w / 2 - 14, this.depth, this.x + w / 2 - 24, this.depth);
    ctx.lineTo(this.x - w / 2 + 24, this.depth);
    ctx.quadraticCurveTo(this.x - w / 2 + 14, this.depth, this.x - w / 2 + 12, this.depth - 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#62a180';
    for (const dx of [-28, 0, 28]) {
      ctx.beginPath();
      ctx.roundRect(this.x + dx - 5, top + 30, 10, HEIGHT - 50, 5);
      ctx.fill();
    }
    // The open top: a rim around the dark inside.
    ctx.fillStyle = '#7dc29c';
    ctx.beginPath();
    ctx.ellipse(this.x, top + 4, w / 2 + 4, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f6b55';
    ctx.beginPath();
    ctx.ellipse(this.x, top + 4, w / 2 - 6, Bin.openingRy, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
