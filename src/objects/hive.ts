import { GROUND_Y } from '../config';
import type { ItemKind } from './item';
import { Offer, type Offered } from './offer';

const POST_UP = 70;
const BOX_W = 96;
const BOX_H = 42;
const BOXES = 2;
/** The shelf beside the hive where a honey jar waits. */
const SHELF_DX = 92;
const SHELF_UP = 66;
/** Seconds the bees are out after a tap. */
const OUT_SECONDS = 4;
const BEES = 5;

/**
 * A wooden beehive: two boxes on a post under a little roof, bees hovering at
 * its door, and a shelf beside it with a jar of honey to take. A tap on the
 * hive sends the bees out in a lazy loop round it; they come home again soon.
 */
export class Hive {
  readonly depth = GROUND_Y + 18;
  readonly offer = new Offer(['honey']);
  /** Seconds since the bees went out, or OUT_SECONDS when they are home. */
  private away = OUT_SECONDS;
  private time = 0;

  constructor(readonly x: number) {}

  private get boxTop(): number {
    return this.depth - POST_UP - BOXES * BOX_H;
  }

  /** The door the bees go in and out of, low on the bottom box. */
  private get door(): { x: number; y: number } {
    return { x: this.x, y: this.depth - POST_UP - 10 };
  }

  private get shelf(): { x: number; y: number } {
    return { x: this.x + SHELF_DX, y: this.depth - SHELF_UP };
  }

  offerAt(px: number, py: number, slop: number): { dist: number } | null {
    return this.offer.at(px, py, this.shelf.x, this.shelf.y, slop);
  }

  offered(): Offered | null {
    return this.offer.ready ? { kind: this.offer.kind, x: this.shelf.x, bottom: this.shelf.y } : null;
  }

  take(): { kind: ItemKind; x: number; bottom: number } {
    return { kind: this.offer.take(), x: this.shelf.x, bottom: this.shelf.y };
  }

  update(dt: number, canGive: boolean): boolean {
    this.time += dt;
    this.away = Math.min(OUT_SECONDS, this.away + dt);
    return this.offer.update(dt, canGive);
  }

  hits(px: number, py: number, slop: number): boolean {
    return Math.abs(px - this.x) <= BOX_W / 2 + 8 + slop && py >= this.boxTop - 30 - slop && py <= this.depth + slop;
  }

  tap(): void {
    if (!this.out) this.away = 0;
  }

  get out(): boolean {
    return this.away < OUT_SECONDS;
  }

  /** Where bee i is now: hovering at the door, or out on its loop. */
  private bee(i: number): { x: number; y: number; dir: number } {
    const d = this.door;
    const t = this.time * 2 + i * 1.7;
    const hover = { x: d.x + Math.sin(t) * 22 + (i - 2) * 9, y: d.y - 18 + Math.cos(t * 1.3) * 10 };
    if (!this.out) return { ...hover, dir: Math.cos(t) };
    // Out and back: a wide lazy loop, easing out from the door and home again.
    const p = this.away / OUT_SECONDS;
    const reach = Math.sin(p * Math.PI);
    const a = p * Math.PI * 2 + i * 1.25;
    const rx = 120 + 100 * ((i * 0.37) % 1);
    const loop = { x: d.x + Math.sin(a) * rx, y: d.y - 90 - Math.cos(a * 1.5) * 60 - i * 8 };
    return {
      x: hover.x + (loop.x - hover.x) * reach,
      y: hover.y + (loop.y - hover.y) * reach,
      dir: Math.cos(a),
    };
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const x = this.x;
    const g = this.depth;
    // The post and the shelf on its arm.
    ctx.fillStyle = '#8d6e5a';
    ctx.fillRect(x - 8, g - POST_UP, 16, POST_UP);
    const s = this.shelf;
    ctx.fillRect(s.x - 4, s.y, 8, g - s.y);
    ctx.fillRect(x, s.y + 10, s.x - x, 6);
    ctx.fillStyle = '#b08360';
    ctx.beginPath();
    ctx.roundRect(s.x - 34, s.y - 2, 68, 10, 4);
    ctx.fill();
    this.offer.draw(ctx, s.x, s.y - 2);
    // A base board, the stacked boxes, and a little pitched roof.
    ctx.fillStyle = '#b08360';
    ctx.beginPath();
    ctx.roundRect(x - BOX_W / 2 - 8, g - POST_UP - 6, BOX_W + 16, 10, 4);
    ctx.fill();
    for (let k = 0; k < BOXES; k++) {
      const top = g - POST_UP - (k + 1) * BOX_H;
      ctx.fillStyle = k % 2 ? '#f2d38a' : '#ecc56e';
      ctx.beginPath();
      ctx.roundRect(x - BOX_W / 2, top, BOX_W, BOX_H - 2, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(176, 131, 96, 0.35)';
      ctx.fillRect(x - BOX_W / 2 + 10, top + 14, BOX_W - 20, 4);
    }
    const roofY = this.boxTop;
    ctx.fillStyle = '#e8665c';
    ctx.beginPath();
    ctx.moveTo(x - BOX_W / 2 - 14, roofY + 4);
    ctx.lineTo(x, roofY - 30);
    ctx.lineTo(x + BOX_W / 2 + 14, roofY + 4);
    ctx.closePath();
    ctx.fill();
    // The door, a dark little slot.
    const d = this.door;
    ctx.fillStyle = '#6b4e3d';
    ctx.beginPath();
    ctx.roundRect(d.x - 16, d.y - 3, 32, 8, 4);
    ctx.fill();
    // The bees.
    for (let i = 0; i < BEES; i++) {
      const b = this.bee(i);
      this.drawBee(ctx, b.x, b.y, b.dir < 0 ? -1 : 1, time + i);
    }
  }

  private drawBee(ctx: CanvasRenderingContext2D, x: number, y: number, face: number, time: number): void {
    const flap = 0.6 + 0.4 * Math.abs(Math.sin(time * 30));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(x - 2 * face, y - 6, 5, 7 * flap, -0.4 * face, 0, Math.PI * 2);
    ctx.ellipse(x + 3 * face, y - 6, 4, 6 * flap, 0.4 * face, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.ellipse(x, y, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4b4f58';
    ctx.fillRect(x - 2, y - 6, 3, 12);
    ctx.fillRect(x - 6 * face - 1, y - 4, 2.5, 8);
    ctx.beginPath();
    ctx.arc(x + 6 * face, y - 1, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}
