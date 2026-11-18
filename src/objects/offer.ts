import type { ItemKind } from './item';
import { drawLoose, sizeOf } from './item';

/** A thing waiting at a giver to be taken: what it is, its middle and its bottom. */
export interface Offered {
  kind: ItemKind;
  x: number;
  bottom: number;
}

/** Seconds for the next thing to rise into place after one is taken. */
const RISE_SECONDS = 0.45;

/**
 * Something offered from a list: a gift on the sleigh, a parcel on the post van.
 * The owner says where it sits; taking it lets another (picked at random, never
 * the same twice running) rise up from behind, only while not too many are out.
 */
export class Offer {
  private next = 0;
  /** 0 still hidden, 1 sitting there ready to take. */
  private up = 1;

  constructor(readonly kinds: ItemKind[]) {}

  get kind(): ItemKind {
    return this.kinds[this.next];
  }

  /** Is it sitting there, ready to take? */
  get ready(): boolean {
    return this.up >= 1;
  }

  get turn(): number {
    return this.next;
  }

  set turn(n: number) {
    this.next = ((n % this.kinds.length) + this.kinds.length) % this.kinds.length;
  }

  /** The thing sitting at (x, bottom), if it is up and under the finger. */
  at(px: number, py: number, x: number, bottom: number, slop: number): { dist: number } | null {
    if (this.up < 1) return null;
    const { radius, height } = sizeOf(this.kind as never);
    const dist = Math.hypot(px - x, py - (bottom - height / 2));
    return dist <= Math.max(radius, height / 2) + slop ? { dist } : null;
  }

  /** Take it; the next one starts rising. */
  take(): ItemKind {
    const kind = this.kind;
    if (this.kinds.length > 1) {
      const other = Math.floor(Math.random() * (this.kinds.length - 1));
      this.next = other >= this.next ? other + 1 : other;
    }
    this.up = 0;
    return kind;
  }

  /** Returns true as the next one arrives. */
  update(dt: number, canGive: boolean): boolean {
    if (this.up >= 1 || !canGive) return false;
    this.up = Math.min(1, this.up + dt / RISE_SECONDS);
    return this.up >= 1;
  }

  /** Drawn rising from behind its spot: hidden below `bottom` until it is up. */
  draw(ctx: CanvasRenderingContext2D, x: number, bottom: number): void {
    if (this.up <= 0) return;
    const kind = this.kind as never;
    const { height } = sizeOf(kind);
    const t = 1 - Math.pow(1 - this.up, 3);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 120, bottom - 300, 240, 300);
    ctx.clip();
    drawLoose(ctx, kind, x, bottom - height / 2 + (1 - t) * (height + 6), 0, 1, 1);
    ctx.restore();
  }
}
