import { GROUND_Y } from '../config';
import type { Perch } from './perch';

export type VehicleKind = 'tractor' | 'wagon';

interface Wheel {
  dx: number;
  r: number;
}

interface Look {
  /** Half-width, for grabbing. */
  half: number;
  height: number;
  wheels: Wheel[];
  /** Where things can sit, relative to the vehicle's ground point. */
  seats: { dx: number; up: number }[];
}

const LOOK: Record<VehicleKind, Look> = {
  tractor: {
    half: 100,
    height: 150,
    wheels: [
      { dx: -42, r: 46 },
      { dx: 62, r: 28 },
    ],
    seats: [{ dx: -42, up: 112 }],
  },
  wagon: {
    half: 100,
    height: 80,
    wheels: [
      { dx: -56, r: 24 },
      { dx: 56, r: 24 },
    ],
    seats: [
      { dx: -44, up: 60 },
      { dx: 44, up: 60 },
    ],
  },
};

/** Vehicles are drawn from the shapes above at this size. */
const SCALE = 1.5;

/** Something on wheels that animals can sit on. Drag it along the ground to drive it. */
export class Vehicle implements Perch {
  /** The wheels stand on this ground line, a little in front of the puddles' middle. */
  readonly depth = GROUND_Y + 66;
  private turn = 0;
  private readonly look: Look;

  constructor(
    readonly kind: VehicleKind,
    public x: number,
  ) {
    this.look = LOOK[kind];
  }

  get seatCount(): number {
    return this.look.seats.length;
  }

  get wheels(): Wheel[] {
    return this.look.wheels.map((w) => ({ dx: w.dx * SCALE, r: w.r * SCALE }));
  }

  get half(): number {
    return this.look.half * SCALE;
  }

  seatX(i: number): number {
    return this.x + this.look.seats[i].dx * SCALE;
  }

  seatTop(i: number): number {
    return this.depth - this.look.seats[i].up * SCALE;
  }

  seatReach(): number {
    return 42 * SCALE;
  }

  hits(px: number, py: number, slop: number): boolean {
    return Math.abs(px - this.x) <= this.half + slop && py <= this.depth + slop && py >= this.depth - this.look.height * SCALE - slop;
  }

  /** Drive to a new spot, `moved` along the ground; the wheels turn with the distance. */
  moveTo(x: number, moved = x - this.x): void {
    this.turn += moved / (30 * SCALE);
    this.x = x;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.depth);
    ctx.scale(SCALE, SCALE);
    ctx.translate(-this.x, -this.depth);
    if (this.kind === 'tractor') this.drawTractor(ctx);
    else this.drawWagon(ctx);
    for (const w of this.look.wheels) this.drawWheel(ctx, this.x + w.dx, this.depth - w.r, w.r);
    ctx.restore();
  }

  private drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.fillStyle = '#4b4f58';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    // A spot on the hub shows the wheel turning.
    ctx.fillStyle = '#d9a63a';
    ctx.beginPath();
    ctx.arc(x + Math.cos(this.turn * (30 / r)) * r * 0.28, y + Math.sin(this.turn * (30 / r)) * r * 0.28, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawTractor(ctx: CanvasRenderingContext2D): void {
    const g = this.depth;
    ctx.fillStyle = '#4d8fd1';
    // Hood in front, body over the big wheel.
    ctx.beginPath();
    ctx.roundRect(this.x - 20, g - 92, 112, 52, 14);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(this.x - 80, g - 104, 80, 60, 16);
    ctx.fill();
    // Exhaust pipe and grille.
    ctx.fillStyle = '#4b4f58';
    ctx.beginPath();
    ctx.roundRect(this.x + 40, g - 128, 10, 40, 5);
    ctx.fill();
    ctx.fillStyle = '#3b78b8';
    ctx.beginPath();
    ctx.roundRect(this.x + 80, g - 86, 10, 38, 5);
    ctx.fill();
    // Seat and steering wheel.
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.roundRect(this.x - 76, g - 118, 68, 14, 7);
    ctx.roundRect(this.x - 84, g - 150, 14, 46, 7);
    ctx.fill();
    ctx.strokeStyle = '#4b4f58';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x + 2, g - 92);
    ctx.lineTo(this.x - 10, g - 122);
    ctx.stroke();
  }

  private drawWagon(ctx: CanvasRenderingContext2D): void {
    const g = this.depth;
    ctx.fillStyle = '#c98c5e';
    ctx.beginPath();
    ctx.roundRect(this.x - 96, g - 62, 192, 26, 8);
    ctx.fill();
    ctx.fillStyle = '#b77a4f';
    for (const dx of [-96, 84]) {
      ctx.beginPath();
      ctx.roundRect(this.x + dx, g - 80, 12, 30, 6);
      ctx.fill();
    }
    // Handle to pull it by.
    ctx.strokeStyle = '#8d5c4f';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x + 96, g - 46);
    ctx.lineTo(this.x + 140, g - 70);
    ctx.stroke();
  }
}
