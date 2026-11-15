import { GROUND_Y } from '../config';
import { settings } from '../settings';
import type { Perch } from './perch';

const HALF_SPAN = 110;
const BAR_Y = GROUND_Y - 250;
const ROPE = 170;
const SEAT_HALF = 46;
/** Pendulum: about two seconds a swing, slowly settling. */
const OMEGA2 = 8;
const DAMPING = 0.22;

/**
 * A swing on a frame. Something sitting on it swings; each tap pushes it further
 * the way it is already going, like pushing a real swing.
 */
export class Swing implements Perch {
  readonly depth = GROUND_Y + 12;
  readonly seatCount = 1;
  angle = 0;
  private speed = 0;

  constructor(readonly x: number) {}

  seatX(): number {
    return this.x + Math.sin(this.angle) * ROPE;
  }

  /** Where something sitting on the seat rests its bottom. */
  seatTop(): number {
    return BAR_Y + Math.cos(this.angle) * ROPE - 6;
  }

  seatReach(): number {
    return SEAT_HALF;
  }

  seated(_i: number, sideways: number): void {
    this.speed += sideways / 500 + 0.4;
  }

  /** Anywhere on the swing pushes it: the seat, the ropes, the space between the legs. */
  hits(px: number, py: number, slop: number): boolean {
    const onSeat = Math.abs(px - this.seatX()) <= SEAT_HALF + slop && Math.abs(py - this.seatTop() - 4) <= 12 + slop;
    const inFrame = Math.abs(px - this.x) <= HALF_SPAN && py >= BAR_Y - slop && py <= this.depth;
    return onSeat || inFrame;
  }

  /** A push adds to the way it is moving; from still, it goes away from the finger. */
  push(fromX: number): void {
    const dir = Math.abs(this.speed) > 0.2 ? Math.sign(this.speed) : fromX < this.seatX() ? 1 : -1;
    this.speed += dir * (settings.reduceMotion ? 0.5 : 0.9);
    this.limit();
  }

  /** Never swing higher than the top: the energy is capped, so it eases into the highest point. */
  private limit(): void {
    const max = settings.reduceMotion ? 0.35 : 0.8;
    const room = OMEGA2 * (Math.cos(this.angle) - Math.cos(max));
    const most = Math.sqrt(Math.max(0, 2 * room));
    if (Math.abs(this.speed) > most) this.speed = Math.sign(this.speed) * most;
  }

  update(dt: number): void {
    this.speed += (-OMEGA2 * Math.sin(this.angle) - DAMPING * this.speed) * dt;
    this.angle += this.speed * dt;
    this.limit();
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.lineCap = 'round';
    // Legs and the top bar.
    ctx.strokeStyle = '#b07d5b';
    ctx.lineWidth = 14;
    ctx.beginPath();
    for (const side of [-1, 1]) {
      const footX = this.x + side * HALF_SPAN;
      ctx.moveTo(footX - 30, this.depth);
      ctx.lineTo(footX, BAR_Y);
      ctx.lineTo(footX + 30, this.depth);
    }
    ctx.stroke();
    ctx.strokeStyle = '#c48e69';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(this.x - HALF_SPAN - 10, BAR_Y);
    ctx.lineTo(this.x + HALF_SPAN + 10, BAR_Y);
    ctx.stroke();
    // Ropes and seat.
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    ctx.strokeStyle = '#efe3c8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (const side of [-1, 1]) {
      const topX = this.x + side * (SEAT_HALF - 8);
      ctx.moveTo(topX, BAR_Y);
      ctx.lineTo(topX + sin * ROPE, BAR_Y + cos * ROPE);
    }
    ctx.stroke();
    ctx.fillStyle = '#e07a5f';
    ctx.beginPath();
    ctx.roundRect(this.seatX() - SEAT_HALF, this.seatTop(), SEAT_HALF * 2, 12, 6);
    ctx.fill();
  }
}
