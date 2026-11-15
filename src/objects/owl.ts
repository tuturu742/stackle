import { GROUND_Y } from '../config';

/**
 * An owl in a hollow high in a tree. By day it sleeps, and a tap only makes it
 * open one eye for a moment; at night it is awake and hoots when tapped.
 */
export class Owl {
  readonly depth = GROUND_Y - 3;
  readonly y: number;
  /** Seconds left of its response to a tap. */
  private react = 0;
  private awake = false;

  constructor(
    readonly x: number,
    height: number,
  ) {
    this.y = GROUND_Y - height;
  }

  hits(px: number, py: number, slop: number): boolean {
    return Math.hypot(px - this.x, py - this.y) <= 30 + slop;
  }

  /** Returns whether it is awake (and hoots) or just peeks. */
  tap(night: boolean): boolean {
    this.react = night ? 1.2 : 1;
    this.awake = night;
    return night;
  }

  update(dt: number): void {
    this.react = Math.max(0, this.react - dt);
  }

  /** Move to the owl's middle, tilted while it hoots. */
  private place(ctx: CanvasRenderingContext2D): void {
    const tilt = this.react > 0 && this.awake ? Math.sin(this.react * 8) * 0.12 : 0;
    ctx.translate(this.x, this.y + 10);
    ctx.rotate(tilt);
  }

  /** At night its open eyes are drawn again over the darkened landscape, so they glow. */
  drawGlow(ctx: CanvasRenderingContext2D, night: number): void {
    if (night <= 0.5) return;
    ctx.save();
    this.place(ctx);
    ctx.globalAlpha = night;
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#f6d36b';
      ctx.beginPath();
      ctx.arc(side * 10, -6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f3f4a';
      ctx.beginPath();
      ctx.arc(side * 10, -6, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  draw(ctx: CanvasRenderingContext2D, night: number): void {
    const { x, y } = this;
    // The hollow in the trunk.
    ctx.fillStyle = '#4e6b3f';
    ctx.beginPath();
    ctx.ellipse(x, y + 6, 32, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    this.place(ctx);
    // Body, face disc and ear tufts.
    ctx.fillStyle = '#a8825f';
    ctx.beginPath();
    ctx.ellipse(0, 6, 24, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 18, -12);
      ctx.lineTo(side * 20, -30);
      ctx.lineTo(side * 8, -18);
      ctx.fill();
    }
    ctx.fillStyle = '#e9d4b4';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * 10, -6, 11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#d8bf98';
    ctx.beginPath();
    ctx.ellipse(0, 16, 13, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2a541';
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.lineTo(0, 7);
    ctx.fill();
    // Eyes: wide open at night, closed by day, one eye peeking when woken.
    const open = night > 0.5;
    const peek = !open && this.react > 0;
    for (const side of [-1, 1]) {
      const ex = side * 10;
      if (open || (peek && side === 1)) {
        ctx.fillStyle = '#f6d36b';
        ctx.beginPath();
        ctx.arc(ex, -6, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3f3f4a';
        ctx.beginPath();
        ctx.arc(ex, -6, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#6b5a4e';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(ex, -8, 6, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
