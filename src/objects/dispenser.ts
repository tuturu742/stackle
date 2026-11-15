import { GROUND_Y } from '../config';
import { drawHat, HAT_KINDS, type HatKind } from './hat';

const WIDTH = 150;
const HEIGHT = 210;

/**
 * The hat machine: tap it and a hat slides out of the chute. The hats come in
 * the same order every time, and only so many are out in the world at once.
 */
export class Dispenser {
  readonly depth = GROUND_Y + 16;
  next = 0;
  private press = 0;

  constructor(readonly x: number) {}

  private get top(): number {
    return this.depth - HEIGHT;
  }

  hits(px: number, py: number, slop: number): boolean {
    return Math.abs(px - this.x) <= WIDTH / 2 + slop && py >= this.top - 40 - slop && py <= this.depth + slop;
  }

  /** Where a new hat comes out, and the kind it is. */
  dispense(): { kind: HatKind; x: number; bottom: number } {
    const kind = HAT_KINDS[this.next];
    this.next = (this.next + 1) % HAT_KINDS.length;
    this.press = 1;
    return { kind, x: this.x + WIDTH / 2 + 26, bottom: this.depth - 34 };
  }

  /** Pressed with nothing to give: the button still moves. */
  pressEmpty(): void {
    this.press = 1;
  }

  update(dt: number): void {
    this.press = Math.max(0, this.press - dt * 4);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const left = this.x - WIDTH / 2;
    // Chute on the right, where the hats slide out.
    ctx.fillStyle = '#7f9fc4';
    ctx.beginPath();
    ctx.moveTo(this.x + WIDTH / 2 - 10, this.depth - 80);
    ctx.lineTo(this.x + WIDTH / 2 + 50, this.depth - 30);
    ctx.lineTo(this.x + WIDTH / 2 + 50, this.depth - 14);
    ctx.lineTo(this.x + WIDTH / 2 - 10, this.depth - 46);
    ctx.fill();
    ctx.fillStyle = '#9dbbe0';
    ctx.beginPath();
    ctx.roundRect(left, this.top, WIDTH, HEIGHT, 22);
    ctx.fill();
    // Glass dome with the next hat waiting inside.
    ctx.fillStyle = '#e4f3fb';
    ctx.beginPath();
    ctx.ellipse(this.x, this.top + 6, WIDTH / 2 - 14, 52, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    drawHat(ctx, HAT_KINDS[this.next], this.x, this.top - 18, 0, 0.8, 0.8);
    ctx.fillStyle = '#86a8d2';
    ctx.fillRect(left + 6, this.top - 2, WIDTH - 12, 12);
    // The big button.
    const sink = Math.sin(this.press * Math.PI) * 6;
    ctx.fillStyle = '#d65a5a';
    ctx.beginPath();
    ctx.ellipse(this.x, this.top + 92, 34, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef7b74';
    ctx.beginPath();
    ctx.ellipse(this.x, this.top + 88 + sink, 30, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#86a8d2';
    ctx.beginPath();
    ctx.roundRect(this.x - 40, this.depth - 60, 80, 34, 12);
    ctx.fill();
  }
}
