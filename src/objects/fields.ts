import { GROUND_Y, REGROW_SECONDS } from '../config';
import * as audio from '../audio';
import { settings } from '../settings';
import { drawVeg, VEG } from './veg';

const SPACING = 64;
/** Rain makes corn grow back this many times faster, like fruit. */
const RAIN_BOOST = 3;

export interface Cob {
  x: number;
  /** Centre of the cob when ripe. */
  y: number;
  stalk: number;
  growth: number;
}

/** A field of tall corn. Each stalk has a cob to pick, which grows back. */
export class CornField {
  /** A backdrop: behind anything standing on the ground. */
  readonly depth = GROUND_Y - 2;
  readonly cobs: Cob[] = [];

  constructor(
    readonly x: number,
    readonly width: number,
  ) {
    const n = Math.max(1, Math.floor(width / SPACING));
    for (let i = 0; i < n; i++) {
      const cx = x - width / 2 + (i + 0.5) * (width / n);
      const stalk = 210 + 40 * Math.sin(i * 1.7) + 20 * Math.cos(i * 0.9);
      this.cobs.push({ x: cx, y: GROUND_Y - stalk * 0.5, stalk, growth: 1 });
    }
  }

  cobAt(px: number, py: number, slop: number): { cob: Cob; dist: number } | null {
    let best: { cob: Cob; dist: number } | null = null;
    for (const cob of this.cobs) {
      if (cob.growth < 1) continue;
      const dist = Math.hypot(px - cob.x - 12, py - cob.y);
      if (dist <= VEG.corn.radius + 12 + slop && (!best || dist < best.dist)) best = { cob, dist };
    }
    return best;
  }

  pick(cob: Cob): void {
    cob.growth = 0;
  }

  update(dt: number, wet: (x: number) => boolean, canGrow: boolean): void {
    if (!canGrow) return;
    for (const cob of this.cobs) {
      if (cob.growth >= 1) continue;
      const speed = wet(cob.x) ? RAIN_BOOST : 1;
      cob.growth = Math.min(1, cob.growth + (dt * speed) / (REGROW_SECONDS * 2));
      if (cob.growth === 1) audio.grown();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const cob of this.cobs) {
      const top = GROUND_Y - cob.stalk;
      ctx.strokeStyle = '#7fb85e';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cob.x, GROUND_Y + 4);
      ctx.lineTo(cob.x, top);
      ctx.stroke();
      ctx.fillStyle = '#8fc76b';
      for (const [dy, side] of [
        [0.25, -1],
        [0.42, 1],
        [0.62, -1],
        [0.8, 1],
      ]) {
        const y = GROUND_Y - cob.stalk * dy;
        ctx.beginPath();
        ctx.ellipse(cob.x + side * 22, y, 26, 7, side * -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Tassel on top.
      ctx.strokeStyle = '#e3c46a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (const dx of [-8, 0, 8]) {
        ctx.moveTo(cob.x, top);
        ctx.lineTo(cob.x + dx, top - 18);
      }
      ctx.stroke();
      // The cob: small and green while growing, full and yellow once it can be picked.
      if (cob.growth >= 1) drawVeg(ctx, 'corn', cob.x + 12, cob.y, 0.15, 1, 1);
      else {
        const s = 0.3 + 0.3 * cob.growth;
        ctx.fillStyle = '#a9d47f';
        ctx.beginPath();
        ctx.ellipse(cob.x + 9, cob.y + 10, 10 * s + 3, 26 * s + 4, 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

interface Sunflower {
  x: number;
  height: number;
  nod: number;
  nodSpeed: number;
}

/** A field of sunflowers. A tapped flower nods and plays its own soft note. */
export class SunflowerField {
  readonly depth = GROUND_Y - 2;
  private readonly flowers: Sunflower[] = [];

  constructor(
    readonly x: number,
    readonly width: number,
  ) {
    const n = Math.max(1, Math.floor(width / 70));
    for (let i = 0; i < n; i++) {
      this.flowers.push({
        x: x - width / 2 + (i + 0.5) * (width / n),
        height: 190 + 50 * Math.sin(i * 2.3) + 25 * Math.cos(i * 1.1),
        nod: 0,
        nodSpeed: 0,
      });
    }
  }

  /** Tap a flower head; returns whether one was hit. */
  tap(px: number, py: number, slop: number): boolean {
    const i = this.flowers.findIndex((f) => Math.hypot(px - f.x, py - (GROUND_Y - f.height)) <= 34 + slop);
    if (i < 0) return false;
    this.flowers[i].nodSpeed += settings.reduceMotion ? 1.5 : 4;
    audio.flowerNote(i);
    return true;
  }

  update(dt: number): void {
    for (const f of this.flowers) {
      f.nodSpeed += (-40 * f.nod - 3 * f.nodSpeed) * dt;
      f.nod += f.nodSpeed * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const f of this.flowers) {
      const top = GROUND_Y - f.height;
      ctx.strokeStyle = '#7fb85e';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(f.x, GROUND_Y + 4);
      ctx.lineTo(f.x, top);
      ctx.stroke();
      ctx.fillStyle = '#8fc76b';
      for (const [dy, side] of [
        [0.3, -1],
        [0.55, 1],
      ]) {
        ctx.beginPath();
        ctx.ellipse(f.x + side * 18, GROUND_Y - f.height * dy, 20, 9, side * -0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.save();
      ctx.translate(f.x, top);
      ctx.rotate(f.nod * 0.3);
      ctx.fillStyle = '#f5c842';
      for (let k = 0; k < 12; k++) {
        const a = (k * Math.PI) / 6;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 22, Math.sin(a) * 22, 13, 7, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#8a5a3c';
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
