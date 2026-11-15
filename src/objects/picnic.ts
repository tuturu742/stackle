import { GROUND_Y } from '../config';
import { settings } from '../settings';
import { drawGood, GOODS, TREATS, type TreatKind } from './goods';
import { isFruit, isVeg, type Item } from './item';
import { drawLantern, drawLanternGlow, LANTERN_R } from './lantern';
import type { Perch } from './perch';

const LANTERN_COLORS = ['#f28b82', '#f6c26b', '#81c7e8', '#a5d68f', '#b39ddb'];
const SAG = 50;
const STRING_Y = GROUND_Y - 240;

interface StringLantern {
  lit: boolean;
  /** Sways after a tap: 1 just tapped. */
  swing: number;
}

/**
 * The picnic place: a checked blanket on the grass with a string of paper
 * lanterns above it. Each lantern switches on or off with its own tap and
 * glows at night.
 */
export class Picnic {
  /** The blanket lies flat, under anything put on it. */
  readonly depth = GROUND_Y + 0.5;
  /** The lanterns hang behind everything. */
  readonly backDepth = GROUND_Y - 1;
  private readonly lanterns: StringLantern[];
  private time = 0;

  constructor(
    readonly x: number,
    readonly width: number,
  ) {
    const [a, b] = this.poles;
    const n = Math.max(4, Math.round((b - a) / 56));
    this.lanterns = Array.from({ length: n - 1 }, () => ({ lit: true, swing: 0 }));
  }

  private get poles(): [number, number] {
    return [this.x - this.width / 2 - 30, this.x + this.width / 2 + 30];
  }

  /** A point along the sagging string, 0 at one pole to 1 at the other. */
  private along(t: number): { x: number; y: number } {
    const [a, b] = this.poles;
    return { x: a + (b - a) * t, y: STRING_Y + SAG * 4 * t * (1 - t) };
  }

  /** Where lantern `i` hangs from the string, and its angle as it sways. */
  private hang(i: number): { x: number; y: number; angle: number } {
    const p = this.along((i + 1) / (this.lanterns.length + 1));
    const l = this.lanterns[i];
    const swing = settings.reduceMotion ? 0.3 : 1;
    return { ...p, angle: Math.sin(this.time * 7 + i) * l.swing * 0.35 * swing };
  }

  /** The lantern at this point, if any. */
  lanternAt(px: number, py: number, slop: number): number | null {
    let best: number | null = null;
    let bestDist = Infinity;
    this.lanterns.forEach((_, i) => {
      const h = this.hang(i);
      const d = Math.hypot(px - h.x, py - (h.y + 6 + LANTERN_R));
      if (d <= LANTERN_R + 10 + slop && d < bestDist) {
        best = i;
        bestDist = d;
      }
    });
    return best;
  }

  /** Switch a lantern on or off; returns whether it is now on. */
  toggle(i: number): boolean {
    const l = this.lanterns[i];
    l.lit = !l.lit;
    l.swing = 1;
    return l.lit;
  }

  update(dt: number): void {
    this.time += dt;
    for (const l of this.lanterns) l.swing = Math.max(0, l.swing - dt * 0.7);
  }

  drawBack(ctx: CanvasRenderingContext2D): void {
    const [a, b] = this.poles;
    ctx.fillStyle = '#b07d5b';
    for (const px of [a, b]) {
      ctx.beginPath();
      ctx.roundRect(px - 5, GROUND_Y - 250, 10, 252, 5);
      ctx.fill();
    }
    ctx.strokeStyle = '#6b5a4e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let t = 0; t <= 1.001; t += 0.05) {
      const p = this.along(t);
      if (t === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    this.lanterns.forEach((l, i) => {
      const h = this.hang(i);
      drawLantern(ctx, h.x, h.y, LANTERN_COLORS[i % LANTERN_COLORS.length], l.lit, h.angle);
    });
  }

  /** At night the lit lanterns glow over the dark. */
  drawGlow(ctx: CanvasRenderingContext2D, night: number): void {
    this.lanterns.forEach((l, i) => {
      if (!l.lit) return;
      const h = this.hang(i);
      drawLanternGlow(ctx, h.x, h.y, LANTERN_COLORS[i % LANTERN_COLORS.length], night, h.angle);
    });
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

/** A round grill on legs. Fruit or a vegetable placed on it bakes into a pie, corn pops, flour makes tortillas. */
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
    return isFruit(bottom.kind) || isVeg(bottom.kind) || ['pie', 'flour', 'popcorn', 'tortilla'].includes(bottom.kind);
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
