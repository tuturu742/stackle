import { GROUND_Y } from '../config';
import type { Perch } from './perch';

const WIDTH = 420;
const WALL_TOP = GROUND_Y - 380;
const ROOF_TOP = GROUND_Y - 490;
/** The band of trim between the two floors. */
const FLOOR_Y = GROUND_Y - 206;
const WIN_W = 100;
const WIN_H = 92;
/** Window tops: downstairs, then upstairs. */
const WIN_TOPS = [GROUND_Y - 176, GROUND_Y - 346];
const WIN_DX = 130;
const DOOR_W = 96;
const DOOR_H = 150;
const CHIMNEY_X = 90;
const CHIMNEY_W = 36;
const CHIMNEY_TOP = ROOF_TOP - 6;
/** Seconds between puffs of smoke, and how long each lasts. */
const PUFF_EVERY = 0.45;
const PUFF_SECONDS = 4;
/** The doorway is the fifth seat, after the four windows. */
const DOOR_SEAT = 4;

interface Puff {
  age: number;
  seed: number;
}
/** Shutters swing out to lie flat against the wall. */
const OPEN_ANGLE = Math.PI * 0.92;

/**
 * The two-storey farmhouse. Its four windows have shutters and its door opens,
 * each tapped open or shut. Things sit on the window sills, like the model ship,
 * or stand in the doorway; behind a shut shutter or door they are out of sight
 * and reach. Tapping the chimney starts smoke puffing, and tapping again stops it.
 */
export class House implements Perch {
  /** The rooms seen through the windows; things on the sills are drawn just after. */
  readonly depth = GROUND_Y + 2;
  /** The front wall and shutters. */
  readonly frontDepth = GROUND_Y + 10;
  /** Windows 0 and 1 downstairs (left, right), 2 and 3 upstairs, then the doorway. */
  readonly seatCount = 5;
  doorOpen = false;
  /** The door: 0 shut, 1 open. */
  private door = 0;
  smoking = false;
  private puffs: Puff[] = [];
  private sincePuff = 0;
  /** Shutters, per window: 0 shut, 1 open. */
  readonly open: number[];
  readonly isOpen: boolean[];

  constructor(
    readonly x: number,
    openWindows: boolean[] = [false, true, true, false],
  ) {
    this.isOpen = [...openWindows];
    this.open = openWindows.map((o) => (o ? 1 : 0));
  }

  private readonly windows = [0, 1, 2, 3];

  private get doorTop(): number {
    return this.frontDepth - DOOR_H;
  }

  private winX(i: number): number {
    return this.x + (i % 2 === 0 ? -WIN_DX : WIN_DX);
  }

  private winTop(i: number): number {
    return WIN_TOPS[i < 2 ? 0 : 1];
  }

  seatX(i: number): number {
    return i === DOOR_SEAT ? this.x : this.winX(i);
  }

  seatTop(i: number): number {
    return i === DOOR_SEAT ? this.frontDepth - 6 : this.winTop(i) + WIN_H - 6;
  }

  seatReach(i: number): number {
    return i === DOOR_SEAT ? DOOR_W / 2 - 8 : WIN_W / 2 - 6;
  }

  private shown(i: number): number {
    return i === DOOR_SEAT ? this.door : this.open[i];
  }

  accepts(i: number): boolean {
    return this.shown(i) > 0.5;
  }

  hides(i: number): boolean {
    return this.shown(i) < 0.5;
  }

  clip(ctx: CanvasRenderingContext2D, i: number): void {
    ctx.beginPath();
    if (i === DOOR_SEAT) ctx.rect(this.x - DOOR_W / 2, this.doorTop, DOOR_W, DOOR_H);
    else ctx.rect(this.winX(i) - WIN_W / 2, this.winTop(i), WIN_W, WIN_H);
    ctx.clip();
  }

  /** The door at this point: the doorway, or the open door lying against the wall. */
  doorAt(px: number, py: number, slop: number): boolean {
    const left = this.x - DOOR_W / 2 - (this.doorOpen ? DOOR_W : 0);
    return px >= left - slop && px <= this.x + DOOR_W / 2 + slop && py >= this.doorTop - slop && py <= this.frontDepth;
  }

  /** Returns whether it is opening. */
  toggleDoor(): boolean {
    this.doorOpen = !this.doorOpen;
    return this.doorOpen;
  }

  chimneyAt(px: number, py: number, slop: number): boolean {
    const cx = this.x + CHIMNEY_X + CHIMNEY_W / 2;
    return Math.abs(px - cx) <= CHIMNEY_W / 2 + slop && py >= CHIMNEY_TOP - slop * 2 && py <= CHIMNEY_TOP + 60;
  }

  /** Returns whether it is now smoking. */
  toggleSmoke(): boolean {
    this.smoking = !this.smoking;
    this.sincePuff = PUFF_EVERY;
    return this.smoking;
  }

  /** The window (with its shutters, open or shut) at this point. */
  windowAt(px: number, py: number, slop: number): number | null {
    for (const i of this.windows) {
      const reach = this.isOpen[i] ? WIN_W : WIN_W / 2;
      const top = this.winTop(i);
      if (Math.abs(px - this.winX(i)) <= reach + slop && py >= top - slop && py <= top + WIN_H + slop) return i;
    }
    return null;
  }

  toggle(i: number): void {
    this.isOpen[i] = !this.isOpen[i];
  }

  /** Nothing stands behind the front wall. */
  behindWall(x: number, floor: number): boolean {
    return Math.abs(x - this.x) <= WIDTH / 2 + 10 && floor < this.frontDepth + 2;
  }

  update(dt: number, reduceMotion = false): void {
    for (const i of this.windows) this.open[i] += ((this.isOpen[i] ? 1 : 0) - this.open[i]) * Math.min(1, dt * 6);
    this.door += ((this.doorOpen ? 1 : 0) - this.door) * Math.min(1, dt * 6);
    for (const p of this.puffs) p.age += dt;
    this.puffs = this.puffs.filter((p) => p.age < PUFF_SECONDS);
    if (!this.smoking) return;
    this.sincePuff += dt;
    const every = reduceMotion ? PUFF_EVERY * 2 : PUFF_EVERY;
    if (this.sincePuff >= every) {
      this.sincePuff = 0;
      this.puffs.push({ age: 0, seed: Math.random() * 10 });
    }
  }

  drawBack(ctx: CanvasRenderingContext2D): void {
    // The hall behind the door: warm walls, a rug on the floor.
    const dl = this.x - DOOR_W / 2;
    ctx.fillStyle = '#f0d3a8';
    ctx.fillRect(dl, this.doorTop, DOOR_W, DOOR_H);
    ctx.fillStyle = '#c99a6e';
    ctx.fillRect(dl, this.frontDepth - 30, DOOR_W, 30);
    ctx.fillStyle = '#d9695f';
    ctx.beginPath();
    ctx.ellipse(this.x, this.frontDepth - 12, DOOR_W / 2 - 8, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b04c';
    ctx.beginPath();
    ctx.arc(this.x + 22, this.doorTop + 40, 10, 0, Math.PI * 2);
    ctx.fill();
    // The open door, seen edge-on against the inside of the hinge side.
    if (this.door > 0.5) {
      ctx.fillStyle = '#4f958d';
      ctx.fillRect(dl, this.doorTop, 14, DOOR_H);
    }
    for (const i of this.windows) {
      const left = this.winX(i) - WIN_W / 2;
      const top = this.winTop(i);
      ctx.fillStyle = i < 2 ? '#f3dcb4' : '#e9d8f0';
      ctx.fillRect(left, top, WIN_W, WIN_H);
      ctx.fillStyle = i < 2 ? '#e6c793' : '#d8c3e3';
      ctx.fillRect(left, top + WIN_H * 0.55, WIN_W, WIN_H * 0.45);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const left = this.x - WIDTH / 2;
    const right = this.x + WIDTH / 2;
    const ground = this.frontDepth;
    // Chimney behind the roof, with its smoke.
    this.drawSmoke(ctx);
    ctx.fillStyle = '#c0614f';
    ctx.fillRect(this.x + CHIMNEY_X, CHIMNEY_TOP, CHIMNEY_W, 100);
    ctx.fillStyle = '#a9513f';
    ctx.fillRect(this.x + CHIMNEY_X - 5, CHIMNEY_TOP - 4, CHIMNEY_W + 10, 12);
    // Walls with the windows cut out.
    ctx.fillStyle = '#f5dd8a';
    ctx.beginPath();
    ctx.rect(left, WALL_TOP, WIDTH, ground - WALL_TOP);
    for (const i of this.windows) ctx.rect(this.winX(i) - WIN_W / 2, this.winTop(i), WIN_W, WIN_H);
    ctx.rect(this.x - DOOR_W / 2, this.doorTop, DOOR_W, DOOR_H);
    ctx.fill('evenodd');
    // Trim between the floors, and a round window upstairs in the middle.
    ctx.fillStyle = '#ead07a';
    ctx.fillRect(left, FLOOR_Y, WIDTH, 12);
    ctx.fillStyle = '#f6efe0';
    ctx.beginPath();
    ctx.arc(this.x, WIN_TOPS[1] + WIN_H / 2, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bfe3f2';
    ctx.beginPath();
    ctx.arc(this.x, WIN_TOPS[1] + WIN_H / 2, 19, 0, Math.PI * 2);
    ctx.fill();
    // Roof.
    ctx.fillStyle = '#e07a5f';
    ctx.beginPath();
    ctx.moveTo(left - 30, WALL_TOP + 6);
    ctx.lineTo(this.x, ROOF_TOP);
    ctx.lineTo(right + 30, WALL_TOP + 6);
    ctx.closePath();
    ctx.fill();
    // Door frame and step; the door itself is drawn with the shutters.
    ctx.strokeStyle = '#f6efe0';
    ctx.lineWidth = 8;
    ctx.strokeRect(this.x - DOOR_W / 2, this.doorTop, DOOR_W, DOOR_H + 4);
    ctx.fillStyle = '#e8d3a6';
    ctx.fillRect(this.x - DOOR_W / 2 - 14, ground - 8, DOOR_W + 28, 10);
    // Window frames and sills.
    for (const i of this.windows) {
      const wx = this.winX(i);
      const top = this.winTop(i);
      ctx.strokeStyle = '#f6efe0';
      ctx.lineWidth = 8;
      ctx.strokeRect(wx - WIN_W / 2, top, WIN_W, WIN_H);
      ctx.fillStyle = '#f6efe0';
      ctx.fillRect(wx - WIN_W / 2 - 10, top + WIN_H, WIN_W + 20, 10);
    }
  }

  /** Shutters and the door go on top of whatever sits on the sills or in the doorway. */
  drawShutters(ctx: CanvasRenderingContext2D): void {
    // The door swings inward on its left hinge, narrowing until it is open.
    const hinge = this.x - DOOR_W / 2;
    const width = DOOR_W * Math.cos((this.door * Math.PI) / 2);
    if (width > 4) {
      ctx.fillStyle = '#5fa8a0';
      ctx.beginPath();
      ctx.roundRect(hinge, this.doorTop, width, DOOR_H, [Math.min(30, width / 2), Math.min(30, width / 2), 0, 0]);
      ctx.fill();
      if (width > 30) {
        ctx.fillStyle = '#f2c14e';
        ctx.beginPath();
        ctx.arc(hinge + width - 16, this.doorTop + DOOR_H * 0.55, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const i of this.windows) {
      const wx = this.winX(i);
      const top = this.winTop(i);
      const angle = this.open[i] * OPEN_ANGLE;
      for (const side of [-1, 1]) {
        const hinge = wx + (side * WIN_W) / 2;
        const w = (WIN_W / 2) * Math.cos(angle);
        const x0 = hinge - side * Math.max(0, w);
        const x1 = hinge - side * Math.min(0, w);
        const a = Math.min(x0, x1);
        const width = Math.max(2, Math.abs(x1 - x0));
        ctx.fillStyle = w >= 0 ? '#6fa3c9' : '#5f93b9';
        ctx.fillRect(a, top, width, WIN_H);
        if (width > 14) {
          ctx.fillStyle = '#5a8cb3';
          for (let y = top + 14; y < top + WIN_H - 8; y += 16) ctx.fillRect(a + 6, y, width - 12, 4);
        }
      }
    }
  }

  private drawSmoke(ctx: CanvasRenderingContext2D): void {
    const cx = this.x + CHIMNEY_X + CHIMNEY_W / 2;
    for (const p of this.puffs) {
      const t = p.age / PUFF_SECONDS;
      const r = 12 + 30 * t;
      ctx.globalAlpha = 0.7 * (1 - t) * Math.min(1, p.age * 4);
      ctx.fillStyle = '#eef0f2';
      ctx.beginPath();
      ctx.arc(cx + Math.sin(p.age * 1.3 + p.seed) * 14 + p.age * 12, CHIMNEY_TOP - 6 - p.age * 55, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
