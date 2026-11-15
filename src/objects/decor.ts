import { GROUND_Y } from '../config';
import * as audio from '../audio';
import { settings } from '../settings';

export type DecorKind = 'bush' | 'rock' | 'flowers';

/** The fence's top rail, where birds sit. */
export const FENCE_TOP = GROUND_Y - 46;

const FLOWER_COLORS = ['#f28b82', '#f6c26b', '#b39ddb', '#f7f3ea', '#81c7e8'];

/** Scenery along the farm. Bushes rustle and flowers wiggle with a note when tapped. */
export class Decor {
  /** Behind anything standing on the ground. */
  readonly depth = GROUND_Y - 1;
  private wiggle = 0;

  constructor(
    readonly kind: DecorKind,
    readonly x: number,
    /** Which flower colours and note: a fixed number, so each patch stays the same. */
    private readonly seed = 0,
  ) {}

  hits(px: number, py: number, slop: number): boolean {
    if (this.kind === 'rock') return false;
    const w = this.kind === 'bush' ? 70 : 40;
    const h = this.kind === 'bush' ? 80 : 60;
    return Math.abs(px - this.x) <= w + slop && py <= GROUND_Y + 10 && py >= GROUND_Y - h - slop;
  }

  tap(): void {
    this.wiggle = 1;
    if (this.kind === 'bush') audio.rustle();
    else audio.flowerNote(this.seed);
  }

  update(dt: number): void {
    this.wiggle = Math.max(0, this.wiggle - dt * 1.5);
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const amount = settings.reduceMotion ? 0.3 : 1;
    const w = Math.sin(time * 18) * this.wiggle * amount;
    if (this.kind === 'rock') {
      ctx.fillStyle = '#b8bcc2';
      ctx.beginPath();
      ctx.ellipse(this.x, GROUND_Y - 10, 34, 22, 0, Math.PI, Math.PI * 2);
      ctx.ellipse(this.x + 26, GROUND_Y - 4, 18, 12, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9cdd2';
      ctx.beginPath();
      ctx.ellipse(this.x - 8, GROUND_Y - 20, 12, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.kind === 'bush') {
      ctx.save();
      ctx.translate(this.x, GROUND_Y);
      ctx.rotate(w * 0.05);
      ctx.fillStyle = '#6fae5a';
      for (const [dx, dy, r] of [
        [-38, -26, 30],
        [38, -24, 28],
        [0, -44, 40],
        [-14, -20, 30],
        [18, -20, 30],
      ]) {
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#7dbb66';
      ctx.beginPath();
      ctx.arc(-10, -54, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      for (let i = 0; i < 4; i++) {
        const fx = this.x - 30 + i * 20;
        const h = 34 + ((i * 13 + this.seed * 7) % 22);
        const tip = fx + w * 6 * (i % 2 ? 1 : -1);
        ctx.strokeStyle = '#6fae5a';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(fx, GROUND_Y + 4);
        ctx.quadraticCurveTo(fx, GROUND_Y - h / 2, tip, GROUND_Y - h);
        ctx.stroke();
        ctx.fillStyle = FLOWER_COLORS[(i + this.seed) % FLOWER_COLORS.length];
        for (let k = 0; k < 5; k++) {
          const a = (k * Math.PI * 2) / 5;
          ctx.beginPath();
          ctx.arc(tip + Math.cos(a) * 6, GROUND_Y - h + Math.sin(a) * 6, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#f6d36b';
        ctx.beginPath();
        ctx.arc(tip, GROUND_Y - h, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/**
 * A little bird on the fence. Touched, it flutters away; it is back on its post
 * only once that spot is out of sight, so it never pops up unprompted.
 */
export class Bird {
  readonly depth = GROUND_Y - 1;
  private state: 'perched' | 'flying' | 'away' = 'perched';
  private fx = 0;
  private fy = 0;
  private vx = 0;
  private vy = 0;
  private hop = 0;
  /** The way it faces, and flies off: 1 right, -1 left. */
  private readonly dir: number;

  constructor(
    readonly x: number,
    private readonly color: string,
  ) {
    this.dir = Math.round(x / 100) % 2 ? 1 : -1;
  }

  hits(px: number, py: number, slop: number): boolean {
    return this.state === 'perched' && Math.hypot(px - this.x, py - (FENCE_TOP - 14)) <= 22 + slop;
  }

  scare(): void {
    this.state = 'flying';
    this.fx = this.x;
    this.fy = FENCE_TOP - 14;
    this.vx = this.dir * 160;
    this.vy = -220;
    audio.chirp();
  }

  /** `seen` says whether the bird's post is on screen right now. */
  update(dt: number, seen: boolean): void {
    this.hop += dt;
    if (this.state === 'flying') {
      this.fx += this.vx * dt;
      this.fy += this.vy * dt;
      this.vy -= 40 * dt;
      if (this.fy < -100) this.state = 'away';
    } else if (this.state === 'away' && !seen) {
      this.state = 'perched';
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.state === 'away') return;
    const flying = this.state === 'flying';
    const x = flying ? this.fx : this.x;
    const y = flying ? this.fy : FENCE_TOP - 14;
    // Drawn facing right, mirrored when it faces left.
    ctx.save();
    ctx.translate(x, 0);
    ctx.scale(this.dir, 1);
    ctx.translate(-x, 0);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(x, y, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 9, y - 9, 8, 0, Math.PI * 2);
    ctx.fill();
    const flap = flying ? Math.sin(this.hop * 30) * 10 : 0;
    ctx.fillStyle = '#f7f3ea';
    ctx.beginPath();
    ctx.ellipse(x - 3, y - 2 - flap, 8, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2a541';
    ctx.beginPath();
    ctx.moveTo(x + 16, y - 10);
    ctx.lineTo(x + 23, y - 8);
    ctx.lineTo(x + 16, y - 6);
    ctx.fill();
    ctx.fillStyle = '#4a3f45';
    ctx.beginPath();
    ctx.arc(x + 11, y - 11, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
