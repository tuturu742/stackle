import { GROUND_Y } from '../config';
import { GIFTS, SNOWBALLS, type SnowballKind } from './goods';
import { drawLoose, sizeOf, type ItemKind } from './item';
import { Offer } from './offer';
import type { Perch } from './perch';

export type VehicleKind = 'tractor' | 'wagon' | 'sleigh' | 'postvan' | 'plough' | 'barrow';

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
  /** Something it carries to give out, one at a time, and where it sits. */
  gives?: { kinds: ItemKind[]; dx: number; up: number };
}

/** How far the snow plough drives to roll each size of snowball. */
const SNOW_DISTANCE = [120, 360, 660, 1000];

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
  // A sleigh on runners with a seat at the front and a gift waiting on the back.
  sleigh: {
    half: 100,
    height: 110,
    wheels: [],
    seats: [{ dx: 16, up: 46 }],
    gives: { kinds: GIFTS, dx: -52, up: 62 },
  },
  // The post van: a parcel on its roof rack, and a seat at the open side door.
  postvan: {
    half: 104,
    height: 124,
    wheels: [
      { dx: -56, r: 22 },
      { dx: 58, r: 22 },
    ],
    seats: [{ dx: 58, up: 60 }],
    gives: { kinds: ['parcel'], dx: -34, up: 118 },
  },
  // The snow plough rolls a snowball in front of its blade as it drives.
  plough: {
    half: 112,
    height: 124,
    wheels: [
      { dx: -46, r: 28 },
      { dx: 34, r: 24 },
    ],
    seats: [{ dx: -42, up: 72 }],
  },
  // A wooden wheelbarrow: one wheel at the front, handles at the back, room for one in the tray.
  barrow: {
    half: 60,
    height: 70,
    wheels: [{ dx: 38, r: 16 }],
    seats: [{ dx: -4, up: 44 }],
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
  /** What it gives out (the sleigh's gifts, the van's parcels), if anything. */
  readonly offer: Offer | null;
  /** The snow plough: how far it has driven since its last snowball. */
  private snow = 0;

  constructor(
    readonly kind: VehicleKind,
    public x: number,
  ) {
    this.look = LOOK[kind];
    this.offer = this.look.gives ? new Offer(this.look.gives.kinds) : null;
  }

  /** Where the thing it gives sits: its middle, and its bottom. */
  private get offerSpot(): { x: number; bottom: number } {
    const g = this.look.gives!;
    return { x: this.x + g.dx * SCALE, bottom: this.depth - g.up * SCALE };
  }

  offerAt(px: number, py: number, slop: number): { dist: number } | null {
    if (!this.offer) return null;
    const { x, bottom } = this.offerSpot;
    return this.offer.at(px, py, x, bottom, slop);
  }

  /** Take the gift or parcel it carries; another comes up after it. */
  take(): { kind: ItemKind; x: number; bottom: number } {
    const { x, bottom } = this.offerSpot;
    return { kind: this.offer!.take(), x, bottom };
  }

  /** The snowball rolling in front of the blade, once it has driven far enough. */
  get snowball(): SnowballKind | null {
    let size = -1;
    for (let i = 0; i < SNOW_DISTANCE.length; i++) if (this.snow >= SNOW_DISTANCE[i]) size = i;
    return size < 0 ? null : SNOWBALLS[size];
  }

  /** Driving the plough gathers snow into a ball, up to the biggest. */
  gather(moved: number): void {
    if (this.kind === 'plough') this.snow = Math.min(SNOW_DISTANCE[SNOW_DISTANCE.length - 1], this.snow + Math.abs(moved));
  }

  /** Let go of the plough: its snowball is left in front of the blade, if it has one. */
  dropBall(): { kind: SnowballKind; x: number; bottom: number } | null {
    const kind = this.snowball;
    this.snow = 0;
    if (!kind) return null;
    return { kind, x: this.ballX(kind), bottom: this.depth + 6 };
  }

  private ballX(kind: SnowballKind): number {
    return this.x + 118 * SCALE + sizeOf(kind).radius;
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
    else if (this.kind === 'wagon') this.drawWagon(ctx);
    else if (this.kind === 'sleigh') this.drawSleigh(ctx);
    else if (this.kind === 'postvan') this.drawVan(ctx);
    else if (this.kind === 'barrow') this.drawBarrow(ctx);
    else this.drawPlough(ctx);
    for (const w of this.look.wheels) this.drawWheel(ctx, this.x + w.dx, this.depth - w.r, w.r);
    ctx.restore();
    if (this.offer) {
      const { x, bottom } = this.offerSpot;
      this.offer.draw(ctx, x, bottom);
    }
    const ball = this.snowball;
    if (ball) {
      const { height } = sizeOf(ball);
      // The ball turns as it rolls.
      drawLoose(ctx, ball, this.ballX(ball), this.depth + 6 - height / 2, this.turn * 0.4, 1, 1);
    }
  }

  private drawSleigh(ctx: CanvasRenderingContext2D): void {
    const g = this.depth;
    const x = this.x;
    // Runners, curling up at the front.
    ctx.strokeStyle = '#c9a24a';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 92, g - 4);
    ctx.lineTo(x + 70, g - 4);
    ctx.quadraticCurveTo(x + 100, g - 4, x + 98, g - 26);
    ctx.quadraticCurveTo(x + 96, g - 40, x + 84, g - 36);
    ctx.stroke();
    ctx.lineWidth = 6;
    for (const dx of [-60, 40]) {
      ctx.beginPath();
      ctx.moveTo(x + dx, g - 4);
      ctx.lineTo(x + dx, g - 22);
      ctx.stroke();
    }
    // The body: a high back, a dip for the seat, a curl at the front.
    ctx.fillStyle = '#d9574f';
    ctx.beginPath();
    ctx.moveTo(x - 86, g - 22);
    ctx.lineTo(x - 90, g - 66);
    ctx.quadraticCurveTo(x - 88, g - 80, x - 72, g - 78);
    ctx.lineTo(x - 20, g - 62);
    ctx.quadraticCurveTo(x + 10, g - 40, x + 44, g - 54);
    ctx.quadraticCurveTo(x + 74, g - 68, x + 78, g - 46);
    ctx.quadraticCurveTo(x + 80, g - 22, x + 56, g - 22);
    ctx.closePath();
    ctx.fill();
    // Gold trim and a swirl.
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 80, g - 30);
    ctx.lineTo(x + 56, g - 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 62, g - 46, 9, Math.PI * 0.2, Math.PI * 1.8);
    ctx.stroke();
    ctx.fillStyle = '#b8443d';
    ctx.beginPath();
    ctx.roundRect(x - 2, g - 50, 34, 10, 5);
    ctx.fill();
  }

  private drawVan(ctx: CanvasRenderingContext2D): void {
    const g = this.depth;
    const x = this.x;
    // Cargo box and a rounded cab in front.
    ctx.fillStyle = '#4f8fc9';
    ctx.beginPath();
    ctx.roundRect(x - 98, g - 108, 130, 92, 12);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + 24, g - 84, 76, 68, [24, 12, 10, 10]);
    ctx.fill();
    // Windscreen, and a stripe along the side.
    ctx.fillStyle = '#cfe8f6';
    ctx.beginPath();
    ctx.roundRect(x + 64, g - 78, 30, 28, [16, 8, 4, 4]);
    ctx.fill();
    ctx.fillStyle = '#f2c14e';
    ctx.fillRect(x - 98, g - 46, 198, 10);
    // The open side door, where something can sit.
    ctx.fillStyle = '#2f5f8f';
    ctx.beginPath();
    ctx.roundRect(x + 30, g - 78, 30, 38, 6);
    ctx.fill();
    // An envelope shape on the side.
    ctx.fillStyle = '#f6efe0';
    ctx.beginPath();
    ctx.roundRect(x - 60, g - 92, 56, 36, 5);
    ctx.fill();
    ctx.strokeStyle = '#d9574f';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 58, g - 90);
    ctx.lineTo(x - 32, g - 72);
    ctx.lineTo(x - 6, g - 90);
    ctx.stroke();
    // Roof rack and headlight.
    ctx.fillStyle = '#4b4f58';
    ctx.fillRect(x - 84, g - 116, 104, 6);
    for (const dx of [-80, 12]) ctx.fillRect(x + dx, g - 116, 5, 10);
    ctx.fillStyle = '#fff1b8';
    ctx.beginPath();
    ctx.arc(x + 98, g - 34, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawPlough(ctx: CanvasRenderingContext2D): void {
    const g = this.depth;
    const x = this.x;
    // A box at the back to sit on, the cab up front looking over the blade, and a short hood.
    ctx.fillStyle = '#f0883e';
    ctx.beginPath();
    ctx.roundRect(x - 84, g - 72, 84, 44, 10);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x - 6, g - 126, 66, 98, [18, 18, 6, 6]);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + 52, g - 74, 34, 46, [4, 12, 6, 4]);
    ctx.fill();
    ctx.fillStyle = '#d9722f';
    ctx.fillRect(x - 84, g - 50, 170, 8);
    // Windows: the front one looking forward, toward the blade.
    ctx.fillStyle = '#cfe8f6';
    ctx.beginPath();
    ctx.roundRect(x + 26, g - 116, 28, 38, [4, 12, 4, 4]);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + 2, g - 116, 18, 30, 4);
    ctx.fill();
    // A warning light on the roof.
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.roundRect(x + 20, g - 136, 14, 12, [7, 7, 2, 2]);
    ctx.fill();
    // Arm and the big blade in front, curved to scoop the snow forward.
    ctx.fillStyle = '#4b4f58';
    ctx.fillRect(x + 82, g - 48, 18, 10);
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.moveTo(x + 106, g - 2);
    ctx.quadraticCurveTo(x + 86, g - 40, x + 106, g - 82);
    ctx.lineTo(x + 116, g - 82);
    ctx.quadraticCurveTo(x + 96, g - 40, x + 116, g - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4b4f58';
    ctx.fillRect(x + 104, g - 4, 14, 4);
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

  private drawBarrow(ctx: CanvasRenderingContext2D): void {
    const g = this.depth;
    const x = this.x;
    // Handles back to where hands would hold them, and a leg to rest on.
    ctx.strokeStyle = '#8d5c4f';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 30, g - 22);
    ctx.lineTo(x - 58, g - 44);
    ctx.moveTo(x - 30, g - 34);
    ctx.lineTo(x - 34, g - 2);
    ctx.stroke();
    ctx.fillStyle = '#6b4a3e';
    ctx.beginPath();
    ctx.roundRect(x - 64, g - 48, 14, 9, 4);
    ctx.fill();
    // The tray: wider at the top, sloping to the wheel.
    ctx.fillStyle = '#c98c5e';
    ctx.beginPath();
    ctx.moveTo(x - 42, g - 52);
    ctx.lineTo(x + 40, g - 52);
    ctx.quadraticCurveTo(x + 44, g - 52, x + 40, g - 46);
    ctx.lineTo(x + 26, g - 26);
    ctx.lineTo(x - 30, g - 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b77a4f';
    ctx.beginPath();
    ctx.roundRect(x - 44, g - 56, 88, 8, 4);
    ctx.fill();
    ctx.fillRect(x - 20, g - 46, 4, 18);
    ctx.fillRect(x + 8, g - 46, 4, 18);
  }
}
