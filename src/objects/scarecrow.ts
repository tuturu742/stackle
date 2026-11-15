import { GROUND_Y } from '../config';
import { settings } from '../settings';
import { Bird } from './decor';
import { isHat, type Item } from './item';
import type { Perch } from './perch';

const HEAD_Y = GROUND_Y - 232;
const HEAD_R = 27;
const ARMS_Y = GROUND_Y - 186;
const ARM = 78;

/**
 * A scarecrow standing in a clearing in the corn, with crows on its arms. It
 * wears any hat put on its head, and that sends the crows flying; a tap only
 * makes it wobble. A crow tapped on its own flies off alone. Each is back only
 * once its spot is out of sight.
 */
export class Scarecrow implements Perch {
  readonly depth = GROUND_Y - 1;
  readonly seatCount = 1;
  readonly crows: Bird[];
  private wobble = 0;

  constructor(readonly x: number) {
    this.crows = [-ARM + 16, ARM - 10].map((dx) => new Bird(x + dx, '#3f3f4a', ARMS_Y - 22, 'caw'));
  }

  seatX(): number {
    return this.x;
  }

  seatTop(): number {
    return HEAD_Y - HEAD_R + 6;
  }

  seatReach(): number {
    return 40;
  }

  accepts(_i: number, bottom: Item): boolean {
    return isHat(bottom.kind);
  }

  /** Given a hat: it wobbles and the crows fly off. */
  seated(): void {
    this.wobble = 1;
    for (const crow of this.crows) crow.scare();
  }

  hits(px: number, py: number, slop: number): boolean {
    const onHead = Math.hypot(px - this.x, py - HEAD_Y) <= HEAD_R + slop;
    const onBody = Math.abs(px - this.x) <= ARM + slop && py >= ARMS_Y - 20 && py <= GROUND_Y - 60;
    return onHead || onBody;
  }

  tap(): void {
    this.wobble = 1;
  }

  update(dt: number): void {
    this.wobble = Math.max(0, this.wobble - dt * 1.2);
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const tilt = Math.sin(time * 10) * this.wobble * (settings.reduceMotion ? 0.02 : 0.06);
    ctx.save();
    ctx.translate(this.x, GROUND_Y);
    ctx.rotate(tilt);
    ctx.translate(-this.x, -GROUND_Y);
    // Pole and crossbar.
    ctx.fillStyle = '#9b6a4e';
    ctx.fillRect(this.x - 6, ARMS_Y - 30, 12, GROUND_Y - ARMS_Y + 34);
    ctx.fillRect(this.x - ARM, ARMS_Y - 6, ARM * 2, 10);
    // Shirt with sleeves along the arms.
    ctx.fillStyle = '#7fa8d9';
    ctx.beginPath();
    ctx.roundRect(this.x - ARM + 14, ARMS_Y - 14, ARM * 2 - 28, 26, 10);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.x - 34, ARMS_Y - 12);
    ctx.lineTo(this.x + 34, ARMS_Y - 12);
    ctx.lineTo(this.x + 28, ARMS_Y + 78);
    ctx.lineTo(this.x - 28, ARMS_Y + 78);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#6b93c4';
    for (const dx of [-14, 8]) ctx.fillRect(this.x + dx, ARMS_Y - 12, 6, 90);
    ctx.fillRect(this.x - ARM + 14, ARMS_Y - 4, ARM * 2 - 28, 5);
    // Straw poking out of the cuffs and hem.
    ctx.strokeStyle = '#e8cf7a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const side of [-1, 1]) {
      for (const dy of [-8, 0, 8]) {
        ctx.moveTo(this.x + side * (ARM - 14), ARMS_Y + dy * 0.6);
        ctx.lineTo(this.x + side * (ARM + 2), ARMS_Y + dy);
      }
    }
    for (const dx of [-20, -8, 4, 16]) {
      ctx.moveTo(this.x + dx, ARMS_Y + 76);
      ctx.lineTo(this.x + dx + 2, ARMS_Y + 92);
    }
    ctx.stroke();
    // Sack head with button eyes and a stitched smile.
    ctx.fillStyle = '#e6cf9c';
    ctx.beginPath();
    ctx.arc(this.x, HEAD_Y, HEAD_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9a26b';
    ctx.fillRect(this.x - 14, HEAD_Y + HEAD_R - 6, 28, 8);
    ctx.fillStyle = '#4a3f45';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(this.x + side * 10, HEAD_Y - 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#4a3f45';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(this.x, HEAD_Y + 2, 12, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
    for (const dx of [-8, 0, 8]) {
      ctx.beginPath();
      ctx.moveTo(this.x + dx, HEAD_Y + 10);
      ctx.lineTo(this.x + dx, HEAD_Y + 17);
      ctx.stroke();
    }
    ctx.restore();
  }
}
