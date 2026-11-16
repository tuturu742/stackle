import { GROUND_Y } from '../config';
import { SNOWBALLS, type SnowballKind } from './goods';
import { drawLoose, sizeOf } from './item';

/** Seconds of holding for the biggest snowball. */
const CHARGE_SECONDS = 2;
/** The barrel starts pointing up and to the right at this angle, and can turn this far either way from straight up. */
const AIM = -0.7;
const MAX_TILT = 1.3;
const BARREL = 96;

/**
 * A snow cannon. Press and hold it: a snowball grows in its mouth, bigger the
 * longer the press, up to the biggest. Moving the finger while holding turns
 * the barrel toward it. Let go and it puffs the ball out in an arc onto the snow.
 */
export class Cannon {
  readonly depth = GROUND_Y + 30;
  /** 0 to 1 while held. */
  charge = 0;
  holding = false;
  /** Which way the barrel points (radians; straight up is -PI/2). */
  aim = AIM;
  /** 1 just fired, fading to 0: the barrel kicks back. */
  private kick = 0;

  constructor(readonly x: number) {}

  private get pivot(): { x: number; y: number } {
    return { x: this.x - 20, y: this.depth - 62 };
  }

  private get mouth(): { x: number; y: number } {
    const p = this.pivot;
    const len = BARREL - this.kick * 14;
    return { x: p.x + Math.cos(this.aim) * len, y: p.y + Math.sin(this.aim) * len };
  }

  hits(px: number, py: number, slop: number): boolean {
    return Math.abs(px - this.x) <= 90 + slop && py >= this.depth - 160 - slop && py <= this.depth + slop;
  }

  /** The ball growing in its mouth, if there is one yet. */
  get ball(): SnowballKind | null {
    if (!this.holding) return null;
    return SNOWBALLS[Math.min(SNOWBALLS.length - 1, Math.floor(this.charge * SNOWBALLS.length))];
  }

  /** Turn the barrel toward a finger, keeping it pointing upward. */
  aimAt(px: number, py: number): void {
    const p = this.pivot;
    const up = -Math.PI / 2;
    const a = Math.atan2(Math.min(py - p.y, -10), px - p.x);
    this.aim = Math.max(up - MAX_TILT, Math.min(up + MAX_TILT, a));
  }

  press(): void {
    this.holding = true;
    this.charge = 0;
  }

  /** Let go: the ball flies out, a bigger one a little slower. */
  fire(): { kind: SnowballKind; x: number; bottom: number; vx: number; vy: number } {
    const kind = this.ball ?? SNOWBALLS[0];
    const size = SNOWBALLS.indexOf(kind) / (SNOWBALLS.length - 1);
    this.holding = false;
    this.charge = 0;
    this.kick = 1;
    const m = this.mouth;
    const speed = 640 - size * 140;
    const { height } = sizeOf(kind);
    return { kind, x: m.x, bottom: m.y + height / 2, vx: Math.cos(this.aim) * speed, vy: Math.sin(this.aim) * speed };
  }

  update(dt: number): void {
    if (this.holding) this.charge = Math.min(1, this.charge + dt / CHARGE_SECONDS);
    this.kick = Math.max(0, this.kick - dt * 3);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const g = this.depth;
    const p = this.pivot;
    // Wheels and carriage.
    ctx.fillStyle = '#7a5a46';
    ctx.beginPath();
    ctx.roundRect(this.x - 70, g - 52, 110, 26, 10);
    ctx.fill();
    // The barrel: a fat rounded tube, ice blue with stripes.
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(this.aim);
    ctx.translate(-this.kick * 14, 0);
    ctx.fillStyle = '#6fa8d6';
    ctx.beginPath();
    ctx.roundRect(-34, -30, BARREL + 34, 60, 26);
    ctx.fill();
    ctx.fillStyle = '#9cc7e8';
    ctx.beginPath();
    ctx.roundRect(-26, -24, BARREL + 20, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#e8665c';
    for (const at of [10, 46]) ctx.fillRect(at, -30, 12, 60);
    // The mouth.
    ctx.fillStyle = '#4f7fa8';
    ctx.beginPath();
    ctx.ellipse(BARREL, 0, 10, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // The snowball growing in its mouth.
    const ball = this.ball;
    if (ball) {
      const m = this.mouth;
      const grow = 0.85 + 0.15 * ((this.charge * SNOWBALLS.length) % 1);
      drawLoose(ctx, ball, m.x, m.y, 0, grow, grow);
    }
    for (const dx of [-46, 24]) {
      ctx.fillStyle = '#4b4f58';
      ctx.beginPath();
      ctx.arc(this.x + dx, g - 26, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.arc(this.x + dx, g - 26, 11, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
