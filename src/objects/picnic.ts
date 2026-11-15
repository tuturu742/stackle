import { GROUND_Y } from '../config';
import { settings } from '../settings';
import { drawGood, GOODS, TREATS, type TreatKind } from './goods';
import { isFruit, isVeg, type Item } from './item';
import type { Perch } from './perch';

const FLAG_COLORS = ['#f28b82', '#f6c26b', '#81c7e8', '#a5d68f', '#b39ddb'];

/** The picnic place: a checked blanket on the grass with bunting strung above it. */
export class Picnic {
  /** The blanket lies flat, under anything put on it. */
  readonly depth = GROUND_Y + 0.5;
  /** The bunting hangs behind everything. */
  readonly backDepth = GROUND_Y - 1;
  private flutter = 0;

  constructor(
    readonly x: number,
    readonly width: number,
  ) {}

  private get poles(): [number, number] {
    return [this.x - this.width / 2 - 30, this.x + this.width / 2 + 30];
  }

  /** The string of flags, to flutter when tapped. */
  hitsBunting(px: number, py: number, slop: number): boolean {
    const [a, b] = this.poles;
    return px >= a && px <= b && py >= GROUND_Y - 260 - slop && py <= GROUND_Y - 170 + slop;
  }

  tapBunting(): void {
    this.flutter = 1;
  }

  update(dt: number): void {
    this.flutter = Math.max(0, this.flutter - dt * 0.8);
  }

  drawBack(ctx: CanvasRenderingContext2D, time: number): void {
    const [a, b] = this.poles;
    ctx.fillStyle = '#b07d5b';
    for (const px of [a, b]) {
      ctx.beginPath();
      ctx.roundRect(px - 5, GROUND_Y - 250, 10, 252, 5);
      ctx.fill();
    }
    const sag = 50;
    const at = (t: number) => ({ x: a + (b - a) * t, y: GROUND_Y - 240 + sag * 4 * t * (1 - t) });
    ctx.strokeStyle = '#efe3c8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let t = 0; t <= 1.001; t += 0.05) {
      const p = at(t);
      if (t === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    const n = Math.max(4, Math.round((b - a) / 44));
    const swing = settings.reduceMotion ? 0.3 : 1;
    for (let i = 1; i < n; i++) {
      const p = at(i / n);
      const sway = Math.sin(time * 14 + i) * this.flutter * 0.5 * swing;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(sway);
      ctx.fillStyle = FLAG_COLORS[i % FLAG_COLORS.length];
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 26);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const top = GROUND_Y + 8;
    const bottom = GROUND_Y + 50;
    const left = this.x - this.width / 2;
    const slant = 30;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(left + slant, top);
    ctx.lineTo(left + this.width + slant, top);
    ctx.lineTo(left + this.width, bottom);
    ctx.lineTo(left, bottom);
    ctx.closePath();
    ctx.fillStyle = '#f7f3ea';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = '#f2a59b';
    const cell = 28;
    for (let row = 0; row * 14 < bottom - top; row++) {
      for (let col = -2; col * cell < this.width + slant; col++) {
        if ((row + col) % 2) continue;
        const y = top + row * 14;
        const x = left + col * cell + slant * (1 - (row * 14) / (bottom - top));
        ctx.fillRect(x, y, cell, 14);
      }
    }
    ctx.restore();
  }
}

/** Seconds for the next treat to rise out of the basket once one is taken. */
const RISE_SECONDS = 0.45;

/**
 * The picnic basket, open at the top. A treat sits on it, ready to take; once
 * it is taken the next one rises out from inside, always in the same order.
 */
export class Basket {
  readonly depth = GROUND_Y + 22;
  private next = 0;
  /** The treat on top: 0 still inside, 1 sitting up there ready to take. */
  private up = 1;

  constructor(readonly x: number) {}

  private get top(): number {
    return this.depth - 56;
  }

  /** Where the treat on top has its centre, and its bottom when ready. */
  private treatY(kind: TreatKind, up: number): number {
    const h = GOODS[kind].height;
    return this.top + 6 - h / 2 + (1 - up) * (h + 10);
  }

  hits(px: number, py: number, slop: number): boolean {
    return Math.abs(px - this.x) <= 50 + slop && py >= this.top - slop && py <= this.depth + slop;
  }

  /** The treat on top, if it is up and under the finger. */
  treatAt(px: number, py: number, slop: number): { dist: number } | null {
    if (this.up < 1) return null;
    const kind = TREATS[this.next];
    const dist = Math.hypot(px - this.x, py - this.treatY(kind, 1));
    return dist <= GOODS[kind].radius + slop ? { dist } : null;
  }

  /** Take the treat on top; the next one starts rising. */
  take(): { kind: TreatKind; x: number; bottom: number } {
    const kind = TREATS[this.next];
    const bottom = this.treatY(kind, 1) + GOODS[kind].height / 2;
    this.next = (this.next + 1) % TREATS.length;
    this.up = 0;
    return { kind, x: this.x, bottom };
  }

  get turn(): number {
    return this.next;
  }

  set turn(n: number) {
    this.next = n % TREATS.length;
  }

  /** The next treat rises only while there are not too many out already. Returns true as it arrives. */
  update(dt: number, canGive: boolean): boolean {
    if (this.up >= 1 || !canGive) return false;
    this.up = Math.min(1, this.up + dt / RISE_SECONDS);
    return this.up >= 1;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const top = this.top;
    // Handle, and the inside behind the treat.
    ctx.strokeStyle = '#a7724c';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(this.x, top, 34, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#8d5c4f';
    ctx.beginPath();
    ctx.ellipse(this.x, top, 48, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // The treat on top, coming up out of the basket.
    if (this.up > 0) {
      const kind = TREATS[this.next];
      const t = 1 - Math.pow(1 - this.up, 3);
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.x - 80, top - 200, 160, 200);
      ctx.clip();
      drawGood(ctx, kind, this.x, this.treatY(kind, t), 0, 1, 1);
      ctx.restore();
    }
    // Front of the basket.
    ctx.fillStyle = '#c98c5e';
    ctx.beginPath();
    ctx.moveTo(this.x - 48, top);
    ctx.quadraticCurveTo(this.x, top + 10, this.x + 48, top);
    ctx.lineTo(this.x + 40, this.depth);
    ctx.lineTo(this.x - 40, this.depth);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b77a4f';
    ctx.lineWidth = 3;
    for (const y of [top + 18, top + 36]) {
      ctx.beginPath();
      ctx.moveTo(this.x - 44, y);
      ctx.lineTo(this.x + 44, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#f28b82';
    ctx.beginPath();
    ctx.roundRect(this.x - 50, top - 3, 100, 9, 4);
    ctx.fill();
  }
}

/** Seconds on the grill before fruit or a vegetable is a pie. */
export const BAKE_SECONDS = 3;

/** A round grill on legs. Fruit or a vegetable placed on it bakes into a pie. */
export class Grill implements Perch {
  readonly depth = GROUND_Y + 18;
  readonly seatCount = 1;
  /** Seconds the thing on it has been baking. */
  baking = 0;

  constructor(readonly x: number) {}

  seatX(): number {
    return this.x;
  }

  seatTop(): number {
    return this.depth - 96;
  }

  seatReach(): number {
    return 50;
  }

  accepts(_i: number, bottom: Item): boolean {
    return isFruit(bottom.kind) || isVeg(bottom.kind) || bottom.kind === 'pie';
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const top = this.seatTop();
    ctx.strokeStyle = '#4b4f58';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const dx of [-30, 0, 30]) {
      ctx.moveTo(this.x + dx * 0.5, top + 40);
      ctx.lineTo(this.x + dx, this.depth);
    }
    ctx.stroke();
    ctx.fillStyle = '#5b6170';
    ctx.beginPath();
    ctx.ellipse(this.x, top + 6, 56, 46, 0, 0, Math.PI);
    ctx.fill();
    // Glowing embers, brighter while something bakes.
    const glow = this.baking > 0 ? 0.7 + 0.3 * Math.sin(time * 9) : 0.35;
    ctx.fillStyle = `rgba(242, 128, 74, ${glow})`;
    ctx.beginPath();
    ctx.ellipse(this.x, top + 6, 48, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8d9399';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(this.x, top + 4, 54, 9, 0, 0, Math.PI * 2);
    for (const dx of [-30, -10, 10, 30]) {
      ctx.moveTo(this.x + dx, top - 3);
      ctx.lineTo(this.x + dx, top + 11);
    }
    ctx.stroke();
    // Soft smoke while baking.
    if (this.baking > 0 && !settings.reduceMotion) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let i = 0; i < 3; i++) {
        const t = (time * 0.6 + i / 3) % 1;
        ctx.beginPath();
        ctx.arc(this.x - 30 + i * 30 + Math.sin(t * 6) * 6, top - 20 - t * 90, 8 + t * 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
