import { GROUND_Y } from '../config';
import { ORNAMENTS } from './goods';
import type { ItemKind } from './item';
import { Offer } from './offer';
import type { Perch } from './perch';

const TABLE_HALF = 110;
const TABLE_UP = 74;
const BENCH_DX = 168;
const BENCH_HALF = 44;
const BENCH_UP = 42;
/** Where things can stand on the table top, from its middle. */
const SPOTS = [-64, 0, 64];

/**
 * A Christmas market table with a bench at each end. An animal can sit on each
 * bench, and food, drinks or anything else can stand on the table between them.
 */
export class MarketTable implements Perch {
  readonly depth = GROUND_Y + 30;
  /** Seats 0 and 1 are the benches, 2 to 4 places on the table. */
  readonly seatCount = 2 + SPOTS.length;

  constructor(readonly x: number) {}

  seatX(i: number): number {
    return this.x + (i === 0 ? -BENCH_DX : i === 1 ? BENCH_DX : SPOTS[i - 2]);
  }

  seatTop(i: number): number {
    return this.depth - (i < 2 ? BENCH_UP : TABLE_UP);
  }

  seatReach(i: number): number {
    return i < 2 ? BENCH_HALF : 30;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const g = this.depth;
    const x = this.x;
    // The benches: a plank on two legs, a cap of snow at the ends.
    for (const side of [-1, 1]) {
      const bx = x + side * BENCH_DX;
      ctx.fillStyle = '#8d5c4f';
      for (const dx of [-BENCH_HALF + 8, BENCH_HALF - 16]) ctx.fillRect(bx + dx, g - BENCH_UP, 8, BENCH_UP);
      box(ctx, bx - BENCH_HALF, g - BENCH_UP - 6, BENCH_HALF * 2, 12, 5, '#c98c5e');
    }
    // The table: legs, then a red and white checked cloth hanging over the edge.
    ctx.fillStyle = '#8d5c4f';
    for (const dx of [-TABLE_HALF + 14, TABLE_HALF - 24]) ctx.fillRect(x + dx, g - TABLE_UP, 10, TABLE_UP);
    box(ctx, x - TABLE_HALF, g - TABLE_UP - 6, TABLE_HALF * 2, 12, 5, '#c98c5e');
    const top = g - TABLE_UP - 2;
    const n = 11;
    const w = (TABLE_HALF * 2 + 8) / n;
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = k % 2 ? '#f7efe1' : '#e8665c';
      ctx.beginPath();
      ctx.roundRect(x - TABLE_HALF - 4 + k * w, top, w, 26, [0, 0, 6, 6]);
      ctx.fill();
    }
    // A sprig of holly in the middle of the cloth's edge.
    dot(ctx, x - 6, top + 14, 6, '#4f8f5a');
    dot(ctx, x + 6, top + 14, 6, '#5fa06a');
    dot(ctx, x, top + 16, 3.5, '#d64545');
  }
}

const BOX_DEPTH = GROUND_Y + 26;
const BOX_HALF = 40;
const BOX_UP = 40;

/**
 * An open box of Christmas decorations on a doorstep. The next one sits on top
 * to take (picked at random), and another comes up while not too many are out.
 */
export class DecorBox {
  readonly depth = BOX_DEPTH;
  readonly offer = new Offer([...ORNAMENTS]);

  constructor(readonly x: number) {}

  get kinds(): ItemKind[] {
    return this.offer.kinds;
  }

  private get rim(): number {
    return this.depth - BOX_UP + 10;
  }

  offerAt(px: number, py: number, slop: number): { dist: number } | null {
    return this.offer.at(px, py, this.x, this.rim, slop);
  }

  take(): { kind: ItemKind; x: number; bottom: number } {
    return { kind: this.offer.take(), x: this.x, bottom: this.rim };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const g = this.depth;
    const x = this.x;
    // The back of the box, the decoration coming up out of it, then the front with tinsel.
    box(ctx, x - BOX_HALF, g - BOX_UP - 8, BOX_HALF * 2, 20, 4, '#b57f52');
    this.offer.draw(ctx, x, this.rim);
    box(ctx, x - BOX_HALF - 4, g - BOX_UP, BOX_HALF * 2 + 8, BOX_UP, 6, '#d9a36b');
    ctx.fillStyle = '#c48a48';
    ctx.fillRect(x - BOX_HALF - 4, g - BOX_UP / 2 - 2, BOX_HALF * 2 + 8, 4);
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k <= 8; k++) {
      const tx = x - BOX_HALF + (k / 8) * BOX_HALF * 2;
      const ty = g - BOX_UP + 4 + (k % 2) * 6;
      if (k === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.stroke();
  }
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
