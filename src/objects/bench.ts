import { GROUND_Y } from '../config';
import type { Perch } from './perch';

const W = 170;
const SEAT_Y = 46;
const BACK_H = 52;

/** A garden bench with room for two to sit, side by side. */
export class Bench implements Perch {
  readonly depth = GROUND_Y + 34;
  readonly seatCount = 2;

  constructor(readonly x: number) {}

  seatX(i: number): number {
    return this.x + (i === 0 ? -W / 4 : W / 4);
  }

  seatTop(): number {
    return this.depth - SEAT_Y;
  }

  seatReach(): number {
    return W / 4;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const left = this.x - W / 2;
    const seat = this.depth - SEAT_Y;
    ctx.fillStyle = '#8d5c4f';
    // Back legs and backrest posts.
    for (const dx of [14, W - 22]) ctx.fillRect(left + dx, seat - BACK_H, 8, BACK_H + SEAT_Y - 4);
    ctx.fillStyle = '#c98c5e';
    for (const dy of [BACK_H, BACK_H - 24]) {
      ctx.beginPath();
      ctx.roundRect(left, seat - dy, W, 14, 6);
      ctx.fill();
    }
    // Seat and front legs.
    ctx.fillStyle = '#8d5c4f';
    for (const dx of [8, W - 16]) ctx.fillRect(left + dx, seat, 8, SEAT_Y);
    ctx.fillStyle = '#d9a36b';
    ctx.beginPath();
    ctx.roundRect(left - 6, seat - 4, W + 12, 14, 6);
    ctx.fill();
  }
}
