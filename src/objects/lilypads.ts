import type { Perch } from './perch';

const PAD_R = 44;
/** Each pad's place across the pond (fraction of the width from the middle), and how far back it floats. */
const PADS = [
  { along: -0.34, back: 6 },
  { along: 0.02, back: 14 },
  { along: 0.34, back: 4 },
];

/**
 * Round lily pads with a notch, floating on a pond. Anything can sit on a pad;
 * the pads bob gently, and a tap dips one.
 */
export class LilyPads implements Perch {
  readonly depth: number;
  readonly seatCount = PADS.length;
  private time = 0;
  /** 1 just dipped, easing back to 0, per pad. */
  private dips = PADS.map(() => 0);

  constructor(
    readonly x: number,
    readonly width: number,
    readonly surfaceY: number,
  ) {
    this.depth = surfaceY + 0.05;
  }

  private padY(i: number): number {
    const bob = Math.sin(this.time * 1.3 + i * 2.1) * 1.5;
    const dip = Math.sin(this.dips[i] * Math.PI) * 6;
    return this.surfaceY - PADS[i].back + bob + dip;
  }

  seatX(i: number): number {
    return this.x + PADS[i].along * this.width;
  }

  seatTop(i: number): number {
    return this.padY(i) - 3;
  }

  seatReach(): number {
    return 44;
  }

  padAt(px: number, py: number, slop: number): number {
    for (let i = 0; i < PADS.length; i++) {
      const dx = (px - this.seatX(i)) / (PAD_R + slop);
      const dy = (py - this.padY(i)) / (PAD_R * 0.32 + slop);
      if (dx * dx + dy * dy <= 1) return i;
    }
    return -1;
  }

  bob(i: number): void {
    if (i >= 0 && i < PADS.length) this.dips[i] = 1;
  }

  update(dt: number): void {
    this.time += dt;
    this.dips = this.dips.map((d) => Math.max(0, d - dt * 1.5));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < PADS.length; i++) this.drawPad(ctx, this.seatX(i), this.padY(i), PAD_R, i % 2 ? 0.5 : -0.4);
    // Two small spare pads, one with a water lily on it.
    const a = this.x - this.width * 0.17;
    const b = this.x + this.width * 0.19;
    this.drawPad(ctx, a, this.surfaceY + 10, 22, 2.4);
    this.drawPad(ctx, b, this.surfaceY + 12, 26, -2);
    this.drawLily(ctx, b + 2, this.surfaceY + 8);
  }

  /** A flat pad seen from the side: an ellipse with a notch cut to its middle. */
  private drawPad(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, notch: number): void {
    ctx.fillStyle = '#4f8f5a';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, r, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6fb26a';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.ellipse(x, y, r, r * 0.3, 0, notch + 0.28, notch - 0.28 + Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.2, y - r * 0.06, r * 0.45, r * 0.12, 0, Math.PI * 1.1, Math.PI * 1.7);
    ctx.stroke();
  }

  /** A pink water lily: pointed petals in two rings, a yellow heart. */
  private drawLily(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    for (const [len, color, n] of [
      [16, '#f3a3c4', 7],
      [11, '#f8c8dc', 5],
    ] as const) {
      ctx.fillStyle = color;
      for (let k = 0; k < n; k++) {
        const a = Math.PI + (k / (n - 1)) * Math.PI;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a + Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, -len / 2, 4.5, len / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(x, y - 3, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
