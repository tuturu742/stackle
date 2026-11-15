import { GROUND_Y, REGROW_SECONDS } from '../config';
import * as audio from '../audio';
import { settings } from '../settings';
import { drawVeg, VEG } from './veg';

const SPACING = 64;
/** Half the width of a clearing in the corn. */
const CLEARING = 95;
/** Rain makes corn grow back this many times faster, like fruit. */
const RAIN_BOOST = 3;

export interface Cob {
  x: number;
  /** Centre of the cob when ripe. */
  y: number;
  stalk: number;
  growth: number;
}

/** A field of tall corn. Each stalk has a cob to pick, which grows back. A clearing can be left for a scarecrow. */
export class CornField {
  /** A backdrop: behind anything standing on the ground. */
  readonly depth = GROUND_Y - 2;
  readonly cobs: Cob[] = [];

  constructor(
    readonly x: number,
    readonly width: number,
    /** Middle of a stretch left without corn, if any. */
    clearing?: number,
  ) {
    const n = Math.max(1, Math.floor(width / SPACING));
    for (let i = 0; i < n; i++) {
      const cx = x - width / 2 + (i + 0.5) * (width / n);
      if (clearing !== undefined && Math.abs(cx - clearing) < CLEARING) continue;
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

/** Seconds for the ladybird to fly from one flower to another. */
const FLIGHT_SECONDS = 1.1;

/**
 * A field of sunflowers. A tapped flower nods and plays its own soft note.
 * A ladybird sits on one of them; tapped, it flies off to another flower, any one.
 */
export class SunflowerField {
  readonly depth = GROUND_Y - 2;
  private readonly flowers: Sunflower[] = [];
  /** Which flower the ladybird is on (or flying to), and how far through its flight it is: 1 landed. */
  private bug = 2;
  private bugFrom = 2;
  private flight = 1;

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

  /** Where the ladybird sits on a flower's head. */
  private bugSpot(i: number): { x: number; y: number } {
    const f = this.flowers[Math.min(i, this.flowers.length - 1)];
    return { x: f.x + 8, y: GROUND_Y - f.height - 9 };
  }

  private get bugAt(): { x: number; y: number } {
    const a = this.bugSpot(this.bugFrom);
    const b = this.bugSpot(this.bug);
    const t = this.flight;
    // A soft arc up and over.
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 90 };
  }

  /** Tap the ladybird or a flower head; returns whether one was hit. */
  tap(px: number, py: number, slop: number): boolean {
    const bug = this.bugAt;
    if (this.flight >= 1 && Math.hypot(px - bug.x, py - bug.y) <= 24 + slop) {
      this.bugFrom = this.bug;
      // Off to any other flower.
      this.bug = (this.bug + 1 + Math.floor(Math.random() * (this.flowers.length - 1))) % this.flowers.length;
      this.flight = 0;
      audio.buzz();
      return true;
    }
    const i = this.flowers.findIndex((f) => Math.hypot(px - f.x, py - (GROUND_Y - f.height)) <= 34 + slop);
    if (i < 0) return false;
    this.flowers[i].nodSpeed += settings.reduceMotion ? 1.5 : 4;
    audio.flowerNote(i);
    return true;
  }

  update(dt: number): void {
    this.flight = Math.min(1, this.flight + dt / FLIGHT_SECONDS);
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
    this.drawLadybird(ctx);
  }

  private drawLadybird(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.bugAt;
    const flying = this.flight < 1;
    if (flying) {
      // Clear wings flutter while it flies.
      const flap = Math.abs(Math.sin(this.flight * 60)) * 6;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(x + side * 9, y - 6, 8, 4 + flap * 0.4, side * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#3f3f4a';
    ctx.beginPath();
    ctx.arc(x, y - 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8473f';
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3f3f4a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x, y + 9);
    ctx.stroke();
    ctx.fillStyle = '#3f3f4a';
    for (const [dx, dy] of [
      [-4, -3],
      [4, -3],
      [-4, 4],
      [4, 4],
    ]) {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
