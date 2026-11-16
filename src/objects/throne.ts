import { GROUND_Y } from '../config';
import type { Perch } from './perch';

const VELVET = '#c7433d';
const VELVET_DARK = '#a83632';
const VELVET_LIGHT = '#d9574f';
const GOLD = '#e8b84a';
const GOLD_DARK = '#c99a35';
/** The cushion's top, above the ground line. */
const SEAT_UP = 72;
const BACK_UP = 262;
const BACK_HALF = 92;
const ARM_DX = 96;
/** The top of the arms' rolled scrolls, above the ground line. */
const ARM_UP = 146;

/**
 * A big cosy red velvet armchair with gold trim and a candy cane leaning on it.
 * One animal sits in it, on the cushion in front of the tall back, with the
 * chair's arms drawn in front of it; a small one more can sit on each arm.
 */
export class SantaChair implements Perch {
  readonly depth = GROUND_Y + 16;
  /** The arms go in front of whoever sits in the chair. */
  readonly frontDepth = this.depth + 0.2;
  readonly seatCount = 3;

  constructor(readonly x: number) {}

  /** Seat 0 is the cushion, 1 and 2 the tops of the left and right arms. */
  seatX(i: number): number {
    return this.x + (i === 0 ? 0 : i === 1 ? -ARM_DX : ARM_DX);
  }

  seatTop(i: number): number {
    return this.depth - (i === 0 ? SEAT_UP : ARM_UP);
  }

  seatReach(i: number): number {
    return i === 0 ? 60 : 34;
  }

  /** Whoever sits on an arm is drawn in front of it. */
  seatDepth(i: number): number {
    return i === 0 ? this.depth + 0.1 : this.frontDepth + 0.1;
  }

  /** How far either side of its middle it stands, hiding whatever is behind. */
  readonly half = ARM_DX + 30;

  hits(px: number, py: number, slop: number): boolean {
    return Math.abs(px - this.x) <= ARM_DX + 30 + slop && py >= this.depth - BACK_UP - 20 - slop && py <= this.depth + slop;
  }

  /** The back, the seat and the decorations around it; the arms come after whoever sits in it. */
  draw(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const g = this.depth;
    this.drawCandyCane(ctx, x - ARM_DX - 66, g);
    // Gold legs.
    for (const dx of [-ARM_DX + 6, ARM_DX - 6]) box(ctx, x + dx - 8, g - 20, 16, 20, 5, GOLD_DARK);
    // The tall rounded back, gold-edged, with buttoned velvet.
    const top = g - BACK_UP;
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(x - BACK_HALF - 8, g - SEAT_UP + 4);
    ctx.lineTo(x - BACK_HALF - 8, top + 70);
    ctx.quadraticCurveTo(x - BACK_HALF - 8, top - 8, x, top - 10);
    ctx.quadraticCurveTo(x + BACK_HALF + 8, top - 8, x + BACK_HALF + 8, top + 70);
    ctx.lineTo(x + BACK_HALF + 8, g - SEAT_UP + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = VELVET;
    ctx.beginPath();
    ctx.moveTo(x - BACK_HALF, g - SEAT_UP + 4);
    ctx.lineTo(x - BACK_HALF, top + 72);
    ctx.quadraticCurveTo(x - BACK_HALF, top, x, top - 2);
    ctx.quadraticCurveTo(x + BACK_HALF, top, x + BACK_HALF, top + 72);
    ctx.lineTo(x + BACK_HALF, g - SEAT_UP + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = VELVET_LIGHT;
    ctx.beginPath();
    ctx.ellipse(x - 40, top + 60, 22, 40, -0.2, 0, Math.PI * 2);
    ctx.fill();
    for (const [dx, dy] of [
      [-44, 110],
      [0, 80],
      [44, 110],
      [-22, 150],
      [22, 150],
    ]) {
      dot(ctx, x + dx, top + dy, 4, VELVET_DARK);
    }
    // A gold star on top of the back.
    star(ctx, x, top - 18, 16, GOLD);
    // The seat: the base and a plump cushion.
    box(ctx, x - ARM_DX - 4, g - SEAT_UP + 4, (ARM_DX + 4) * 2, SEAT_UP - 22, 12, VELVET_DARK);
    box(ctx, x - ARM_DX - 4, g - 24, (ARM_DX + 4) * 2, 8, 4, GOLD);
    box(ctx, x - 78, g - SEAT_UP - 6, 156, 22, 11, VELVET_LIGHT);
  }

  /** The chair's arms, drawn in front of whoever sits in it. */
  drawFront(ctx: CanvasRenderingContext2D): void {
    const g = this.depth;
    for (const side of [-1, 1]) {
      const ax = this.x + side * ARM_DX;
      // A rolled arm: an upright, a round scroll on top, gold trim.
      box(ctx, ax - 18, g - 128, 36, 108, 14, VELVET);
      dot(ctx, ax, g - 128, 22, VELVET_LIGHT);
      dot(ctx, ax, g - 128, 10, GOLD);
      dot(ctx, ax, g - 128, 5, GOLD_DARK);
      box(ctx, ax - 18, g - 34, 36, 8, 4, GOLD);
    }
  }

  /** A big candy cane leaning on the chair's side. */
  private drawCandyCane(ctx: CanvasRenderingContext2D, x: number, g: number): void {
    ctx.save();
    ctx.translate(x, g);
    ctx.rotate(0.18);
    ctx.lineCap = 'round';
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -150);
      ctx.arc(18, -150, 18, Math.PI, 0);
      ctx.lineTo(36, -136);
    };
    ctx.strokeStyle = '#f7efe1';
    ctx.lineWidth = 14;
    path();
    ctx.stroke();
    ctx.strokeStyle = '#e8665c';
    ctx.lineWidth = 14;
    ctx.setLineDash([12, 12]);
    path();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}
