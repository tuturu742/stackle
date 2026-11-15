import { GROUND_Y } from '../config';
import { settings } from '../settings';

const HUB_Y = GROUND_Y - 300;
const BLADE = 170;
const MAX_SPIN = 9;
const BREEZE = 0.3;

/**
 * A windmill. Its sails can be turned round with a finger and flicked to spin;
 * a tap gives them a push. They slowly come back to a gentle breeze.
 */
export class Windmill {
  readonly depth = GROUND_Y - 1;
  private angle = 0;
  private spin = BREEZE;
  /** While a finger turns the sails: the finger's angle around the hub last step. */
  private held: number | null = null;

  constructor(readonly x: number) {}

  hits(px: number, py: number, slop: number): boolean {
    const onTower = Math.abs(px - this.x) <= 50 + slop && py >= HUB_Y && py <= this.depth;
    return this.hitsSails(px, py, slop) || onTower;
  }

  hitsSails(px: number, py: number, slop: number): boolean {
    return Math.hypot(px - this.x, py - HUB_Y) <= BLADE + slop;
  }

  private get maxSpin(): number {
    return settings.reduceMotion ? 2 : MAX_SPIN;
  }

  push(): void {
    this.spin = Math.min(this.maxSpin, this.spin + 3);
  }

  grab(px: number, py: number): void {
    this.held = Math.atan2(py - HUB_Y, px - this.x);
  }

  /** The sails follow the finger round the hub; how fast it moves is the spin it keeps. */
  follow(px: number, py: number, dt: number): void {
    if (this.held === null) return;
    const a = Math.atan2(py - HUB_Y, px - this.x);
    let turn = a - this.held;
    if (turn > Math.PI) turn -= Math.PI * 2;
    if (turn < -Math.PI) turn += Math.PI * 2;
    this.held = a;
    this.angle += turn;
    this.spin = this.spin * 0.6 + (turn / dt) * 0.4;
  }

  letGo(): void {
    this.held = null;
    this.spin = Math.max(-this.maxSpin, Math.min(this.maxSpin, this.spin));
  }

  update(dt: number): void {
    if (this.held !== null) return;
    // A gentle breeze always keeps it turning a little.
    this.spin = BREEZE + (this.spin - BREEZE) * Math.exp(-0.35 * dt);
    this.angle += this.spin * dt;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#c7ccd1';
    ctx.beginPath();
    ctx.moveTo(this.x - 46, this.depth);
    ctx.lineTo(this.x - 10, HUB_Y);
    ctx.lineTo(this.x + 10, HUB_Y);
    ctx.lineTo(this.x + 46, this.depth);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b3b9bf';
    for (const y of [0.3, 0.6]) {
      const yy = HUB_Y + (this.depth - HUB_Y) * y;
      const half = 10 + 36 * y;
      ctx.fillRect(this.x - half, yy - 4, half * 2, 8);
    }
    // Tail vane behind the hub.
    ctx.fillStyle = '#e07a5f';
    ctx.beginPath();
    ctx.moveTo(this.x + 10, HUB_Y - 6);
    ctx.lineTo(this.x + 90, HUB_Y - 28);
    ctx.lineTo(this.x + 90, HUB_Y + 16);
    ctx.lineTo(this.x + 10, HUB_Y + 6);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = this.angle + (i * Math.PI) / 3;
      ctx.save();
      ctx.translate(this.x, HUB_Y);
      ctx.rotate(a);
      ctx.fillStyle = i % 2 ? '#f6efe0' : '#eadfca';
      ctx.beginPath();
      ctx.roundRect(10, -16, BLADE - 10, 32, 14);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#8d9399';
    ctx.beginPath();
    ctx.arc(this.x, HUB_Y, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}
