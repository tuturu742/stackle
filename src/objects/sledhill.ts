import { GROUND_Y } from '../config';
import type { Perch } from './perch';

/** How high the top of the slope is above the ground. */
const HEIGHT = 300;
/** The slope runs from here (top, left of the hill's x) to here (foot), then flat for a run-out. */
const TOP_DX = -260;
const FOOT_DX = 150;
const RUNOUT = 170;
/** Where the run-out ends, in slope lengths past the foot. */
const END = 1 + RUNOUT / (FOOT_DX - TOP_DX);
/** Seconds riders sit at the top before going down again. */
const WAIT_SECONDS = 1;
/** Slope lengths a second, pulled back up. */
const TOW_SPEED = 0.22;

/**
 * A snowy hill with a sled on it. Put animals on the sled (or tap the hill) and
 * it slides down, runs out on the flat, and is pulled slowly back up; with
 * riders on board it goes again and again, and empty it waits at the top.
 */
export class SledHill implements Perch {
  /** The hill is scenery just behind the ground line; the sled is drawn on its own, in front. */
  readonly hillDepth = GROUND_Y - 2;
  readonly depth = GROUND_Y + 10;
  readonly seatCount = 2;
  /** Along the slope: 0 at the top, 1 at the foot, END at the end of the run-out. */
  private u = 0;
  private v = 0;
  private state: 'top' | 'down' | 'rest' | 'up' = 'top';
  private wait = 0;
  /** Set by the game: is anyone riding? */
  riders = false;

  constructor(readonly x: number) {}

  /** The slope at `u`: where the sled's bottom is, and how steeply it tilts. */
  private path(u: number): { x: number; y: number; tilt: number } {
    const len = FOOT_DX - TOP_DX;
    if (u >= 1) return { x: this.x + FOOT_DX + (u - 1) * len, y: this.depth, tilt: 0 };
    const k = Math.max(0, u);
    const ground = this.depth - HEIGHT * (1 + Math.cos(Math.PI * k)) / 2;
    const slope = (HEIGHT * Math.PI * Math.sin(Math.PI * k)) / 2 / len;
    return { x: this.x + TOP_DX + k * len, y: ground, tilt: Math.atan(slope) };
  }

  private get sled(): { x: number; y: number; tilt: number } {
    return this.path(this.u);
  }

  seatX(i: number): number {
    const s = this.sled;
    return s.x + (i - 0.5) * 46 * Math.cos(s.tilt);
  }

  seatTop(i: number): number {
    const s = this.sled;
    return s.y - 22 + (i - 0.5) * 46 * Math.sin(s.tilt);
  }

  seatReach(): number {
    return 40;
  }

  /** Someone just sat down: off they go soon. */
  seated(): void {
    if (this.state === 'top') this.wait = Math.min(this.wait, 0.6);
  }

  /** Is this point on the hill or the sled? */
  hits(px: number, py: number, slop: number): boolean {
    const s = this.sled;
    if (Math.abs(px - s.x) < 70 + slop && py > s.y - 40 - slop && py < s.y + slop) return true;
    if (px < this.x + TOP_DX - 120 || px > this.x + FOOT_DX + 40) return false;
    const u = (px - this.x - TOP_DX) / (FOOT_DX - TOP_DX);
    return py >= this.path(u).y - slop && py <= this.depth;
  }

  /** A tap sends a waiting sled down. Returns true if it went. */
  push(): boolean {
    if (this.state !== 'top') return false;
    this.state = 'down';
    this.v = 0.2;
    return true;
  }

  /** Returns true as it starts down the slope. */
  update(dt: number, reduceMotion: boolean): boolean {
    switch (this.state) {
      case 'top':
        this.u = 0;
        if (!this.riders) {
          this.wait = WAIT_SECONDS;
          return false;
        }
        this.wait -= dt;
        if (this.wait > 0) return false;
        this.state = 'down';
        this.v = 0.2;
        return true;
      case 'down': {
        // Faster down the steep middle, then slowing on the flat.
        const steep = this.u < 1 ? Math.sin(Math.PI * Math.max(0.05, this.u)) : -1.6;
        this.v = Math.max(0, this.v + steep * (reduceMotion ? 0.8 : 1.4) * dt);
        this.u += this.v * dt;
        if (this.u >= END || (this.u > 1 && this.v === 0)) {
          this.u = Math.min(this.u, END);
          this.state = 'rest';
          this.wait = 0.8;
        }
        return false;
      }
      case 'rest':
        this.wait -= dt;
        if (this.wait <= 0) this.state = 'up';
        return false;
      case 'up':
        this.u -= TOW_SPEED * dt;
        if (this.u <= 0) {
          this.u = 0;
          this.state = 'top';
          this.wait = WAIT_SECONDS;
        }
        return false;
    }
  }

  drawHill(ctx: CanvasRenderingContext2D): void {
    // A snowy mound with a flat top and a long smooth slope.
    ctx.fillStyle = '#dbe7f4';
    ctx.beginPath();
    ctx.moveTo(this.x + TOP_DX - 160, GROUND_Y + 2);
    ctx.quadraticCurveTo(this.x + TOP_DX - 150, this.depth - HEIGHT, this.x + TOP_DX - 60, this.depth - HEIGHT);
    for (let u = 0; u <= 1.001; u += 0.05) {
      const p = this.path(u);
      ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(this.x + FOOT_DX + 40, GROUND_Y + 2);
    ctx.closePath();
    ctx.fill();
    // A soft shade down its side, and a little flag on top.
    ctx.fillStyle = '#c8daee';
    ctx.beginPath();
    ctx.moveTo(this.x + TOP_DX - 150, GROUND_Y + 2);
    ctx.quadraticCurveTo(this.x + TOP_DX - 130, this.depth - HEIGHT * 0.6, this.x + TOP_DX - 40, this.depth - HEIGHT * 0.55);
    ctx.quadraticCurveTo(this.x + TOP_DX + 40, this.depth - 40, this.x + TOP_DX + 60, GROUND_Y + 2);
    ctx.fill();
    const fx = this.x + TOP_DX - 70;
    const fy = this.depth - HEIGHT;
    ctx.fillStyle = '#8d6e5a';
    ctx.fillRect(fx - 2, fy - 70, 4, 72);
    ctx.fillStyle = '#e8665c';
    ctx.beginPath();
    ctx.moveTo(fx + 2, fy - 70);
    ctx.lineTo(fx + 34, fy - 60);
    ctx.lineTo(fx + 2, fy - 50);
    ctx.fill();
  }

  drawSled(ctx: CanvasRenderingContext2D): void {
    const s = this.sled;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.tilt);
    // Runners with a curl at the front (downhill), and wooden slats on top.
    ctx.strokeStyle = '#c0614f';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-60, -4);
    ctx.lineTo(48, -4);
    ctx.quadraticCurveTo(70, -4, 68, -20);
    ctx.quadraticCurveTo(66, -30, 56, -26);
    ctx.stroke();
    for (const dx of [-40, 30]) {
      ctx.beginPath();
      ctx.moveTo(dx, -4);
      ctx.lineTo(dx, -16);
      ctx.stroke();
    }
    ctx.fillStyle = '#d9a35b';
    ctx.beginPath();
    ctx.roundRect(-64, -24, 120, 10, 5);
    ctx.fill();
    ctx.fillStyle = '#c48a48';
    for (const dx of [-40, -10, 20]) ctx.fillRect(dx, -24, 3, 10);
    ctx.restore();
  }
}
