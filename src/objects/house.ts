import { GROUND_Y } from '../config';
import { drawLantern, drawLanternGlow, LANTERN_R } from './lantern';
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
/** How far the windows are from the middle: downstairs a little further, to leave room by the door. */
const WIN_DX = [146, 130];
const DOOR_W = 96;
const DOOR_H = 150;
const CHIMNEY_X = 90;
const CHIMNEY_W = 36;
const CHIMNEY_TOP = ROOF_TOP - 6;
/** Seconds between puffs of smoke, and how long each lasts. */
const PUFF_EVERY = 0.45;
const PUFF_SECONDS = 4;
/** Two lanterns hang over the door from the trim between the floors, this far either side. */
const LAMP_DX = 26;
const LAMP_COLOR = '#f2c14e';
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
/**
 * The farmhouse's colours, the winter town's and the autumn wood's log cabin: walls, trim, roof,
 * chimney (and its cap), window and door frames, shutters, the door; snow on the roof (town), or
 * walls of round logs with a shingled roof and a stone chimney (cabin).
 */
const STYLES = {
  farm: {
    wall: '#f5dd8a',
    trim: '#ead07a',
    roof: '#e07a5f',
    chimney: '#c0614f',
    chimneyTop: '#a9513f',
    frame: '#f6efe0',
    shutter: ['#6fa3c9', '#5f93b9', '#5a8cb3'],
    door: '#5fa8a0',
    snow: false,
    logs: false,
  },
  town: {
    wall: '#e9a68b',
    trim: '#d98f75',
    roof: '#7d8fa8',
    chimney: '#a9786a',
    chimneyTop: '#8f6457',
    frame: '#f6efe0',
    shutter: ['#6fa3c9', '#5f93b9', '#5a8cb3'],
    door: '#5fa8a0',
    snow: true,
    logs: false,
  },
  cabin: {
    wall: '#b07a50',
    trim: '#946140',
    roof: '#7c5b43',
    chimney: '#a39c90',
    chimneyTop: '#8c867c',
    frame: '#d9b98c',
    shutter: ['#c0703f', '#a85f34', '#9c5630'],
    door: '#8a5a3c',
    snow: false,
    logs: true,
  },
};
/** The cabin's logs: how tall each round log is, and their colours. */
const LOG_H = 26;
const LOG_LIGHT = '#c08a5e';
const LOG_SHADE = '#946140';
const MOSS = '#8aa35a';

/** The town house's string of bulbs along the eaves: where it hangs, and its colours. */
const EAVE_Y = WALL_TOP + 12;
const EAVE_BULBS = 15;
const BULB_COLORS = ['#f28b82', '#f2c14e', '#8fd18a', '#81c7e8', '#f3a3c4'];
const HOLLY = '#4f8f5a';
const BERRY = '#d9463f';

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
  /** The two lanterns by the door, left and right. */
  readonly lamps = [true, true];
  private puffs: Puff[] = [];
  private sincePuff = 0;
  /** Shutters, per window: 0 shut, 1 open. */
  readonly open: number[];
  readonly isOpen: boolean[];
  /** The town house's eave lights: each bulb on or off. */
  lights: boolean[] = Array.from({ length: EAVE_BULBS }, () => true);

  private readonly look: (typeof STYLES)['farm'];

  constructor(
    readonly x: number,
    openWindows: boolean[] = [false, true, true, false],
    style: keyof typeof STYLES = 'farm',
  ) {
    this.look = STYLES[style];
    this.isOpen = [...openWindows];
    this.open = openWindows.map((o) => (o ? 1 : 0));
  }

  private readonly windows = [0, 1, 2, 3];

  private get doorTop(): number {
    return this.frontDepth - DOOR_H;
  }

  private winX(i: number): number {
    const dx = WIN_DX[i < 2 ? 0 : 1];
    return this.x + (i % 2 === 0 ? -dx : dx);
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

  private get lampY(): number {
    return FLOOR_Y + 12;
  }

  /** The lantern by the door at this point, if any. */
  lampAt(px: number, py: number, slop: number): number | null {
    for (const i of [0, 1]) {
      const lx = this.x + (i ? LAMP_DX : -LAMP_DX);
      if (Math.hypot(px - lx, py - (this.lampY + 6 + LANTERN_R)) <= LANTERN_R + 10 + slop) return i;
    }
    return null;
  }

  /** Returns whether it is now on. */
  toggleLamp(i: number): boolean {
    this.lamps[i] = !this.lamps[i];
    return this.lamps[i];
  }

  /** At night the lit lanterns (and the town house's eave lights) glow over the dark. */
  drawGlow(ctx: CanvasRenderingContext2D, night: number): void {
    this.lamps.forEach((lit, i) => {
      if (lit) drawLanternGlow(ctx, this.x + (i ? LAMP_DX : -LAMP_DX), this.lampY, LAMP_COLOR, night);
    });
    if (!this.look.snow || night <= 0) return;
    for (const [i, b] of this.eaveBulbs().entries()) {
      if (!this.lights[i]) continue;
      const glow = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, 24);
      glow.addColorStop(0, `rgba(255, 236, 170, ${0.5 * night})`);
      glow.addColorStop(1, 'rgba(255, 236, 170, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = night;
      dot(ctx, b.x, b.y, 6, '#fff3c4');
      dot(ctx, b.x, b.y, 4, b.color);
      ctx.globalAlpha = 1;
    }
  }

  /** The bulbs along the eaves, hanging in little swags. */
  private eaveBulbs(): { x: number; y: number; color: string }[] {
    const left = this.x - WIDTH / 2 - 20;
    const step = (WIDTH + 40) / (EAVE_BULBS - 1);
    return Array.from({ length: EAVE_BULBS }, (_, i) => ({
      x: left + i * step,
      y: EAVE_Y + (i % 2 ? 7 : 0),
      color: BULB_COLORS[i % BULB_COLORS.length],
    }));
  }

  /** The town house's eave bulb under this point, or -1. */
  bulbAt(px: number, py: number, slop: number): number {
    if (!this.look.snow) return -1;
    let near = -1;
    let best = 14 + slop;
    this.eaveBulbs().forEach((b, i) => {
      const d = Math.hypot(px - b.x, py - b.y);
      if (d < best) {
        best = d;
        near = i;
      }
    });
    return near;
  }

  /** Switch one eave bulb; returns whether it is on now. */
  toggleBulb(i: number): boolean {
    this.lights[i] = !this.lights[i];
    return this.lights[i];
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
      ctx.fillStyle = this.look.logs ? '#6e4830' : '#4f958d';
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
    // In the town house, a little decorated tree stands in the room downstairs on the right.
    if (this.look.snow) this.drawRoomTree(ctx, this.winX(1) + 22, this.winTop(1) + WIN_H - 4);
  }

  private drawRoomTree(ctx: CanvasRenderingContext2D, x: number, bottom: number): void {
    ctx.fillStyle = '#a7724c';
    ctx.fillRect(x - 4, bottom - 10, 8, 10);
    ctx.fillStyle = '#4f8f73';
    for (const [w, y0, h] of [
      [40, bottom - 8, 26],
      [32, bottom - 24, 24],
      [22, bottom - 40, 22],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y0);
      ctx.lineTo(x + w / 2, y0);
      ctx.lineTo(x, y0 - h);
      ctx.closePath();
      ctx.fill();
    }
    for (const [dx, dy, c] of [
      [-10, -14, '#e8665c'],
      [8, -18, '#6b9fe0'],
      [-4, -32, '#f2c14e'],
      [6, -40, '#ef8fb4'],
    ] as const) {
      dot(ctx, x + dx, bottom + dy, 3, c);
    }
    star(ctx, x, bottom - 64, 6, '#f2c14e');
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const left = this.x - WIDTH / 2;
    const right = this.x + WIDTH / 2;
    const ground = this.frontDepth;
    // Chimney behind the roof, with its smoke.
    this.drawSmoke(ctx);
    ctx.fillStyle = this.look.chimney;
    ctx.fillRect(this.x + CHIMNEY_X, CHIMNEY_TOP, CHIMNEY_W, 100);
    if (this.look.logs) this.drawStones(ctx);
    ctx.fillStyle = this.look.chimneyTop;
    ctx.fillRect(this.x + CHIMNEY_X - 5, CHIMNEY_TOP - 4, CHIMNEY_W + 10, 12);
    // Walls with the windows cut out.
    const walls = () => {
      ctx.beginPath();
      ctx.rect(left, WALL_TOP, WIDTH, ground - WALL_TOP);
      for (const i of this.windows) ctx.rect(this.winX(i) - WIN_W / 2, this.winTop(i), WIN_W, WIN_H);
      ctx.rect(this.x - DOOR_W / 2, this.doorTop, DOOR_W, DOOR_H);
    };
    ctx.fillStyle = this.look.wall;
    walls();
    ctx.fill('evenodd');
    if (this.look.logs) this.drawLogs(ctx, walls, left, right, ground);
    // Trim between the floors, and a round window upstairs in the middle.
    ctx.fillStyle = this.look.trim;
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
    ctx.fillStyle = this.look.roof;
    ctx.beginPath();
    ctx.moveTo(left - 30, WALL_TOP + 6);
    ctx.lineTo(this.x, ROOF_TOP);
    ctx.lineTo(right + 30, WALL_TOP + 6);
    ctx.closePath();
    ctx.fill();
    if (this.look.logs) this.drawShingles(ctx, left, right);
    if (this.look.snow) {
      // A thick layer of snow along the roof, with a soft wavy edge.
      ctx.fillStyle = '#f7fafd';
      ctx.beginPath();
      ctx.moveTo(left - 34, WALL_TOP + 8);
      ctx.lineTo(this.x, ROOF_TOP - 8);
      ctx.lineTo(right + 34, WALL_TOP + 8);
      for (let i = 0; i <= 8; i++) {
        const t = 1 - i / 8;
        const px = left - 34 + t * (WIDTH + 68);
        const along = Math.abs(px - this.x) / (WIDTH / 2 + 34);
        const py = ROOF_TOP + (WALL_TOP + 6 - ROOF_TOP) * along + 18 + (i % 2) * 8;
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    // Door frame and step; the door itself is drawn with the shutters.
    ctx.strokeStyle = this.look.frame;
    ctx.lineWidth = 8;
    ctx.strokeRect(this.x - DOOR_W / 2, this.doorTop, DOOR_W, DOOR_H + 4);
    ctx.fillStyle = '#e8d3a6';
    ctx.fillRect(this.x - DOOR_W / 2 - 14, ground - 8, DOOR_W + 28, 10);
    // Two lanterns hanging over the door.
    this.lamps.forEach((lit, i) => drawLantern(ctx, this.x + (i ? LAMP_DX : -LAMP_DX), this.lampY, LAMP_COLOR, lit));
    // Window frames and sills.
    for (const i of this.windows) {
      const wx = this.winX(i);
      const top = this.winTop(i);
      ctx.strokeStyle = this.look.frame;
      ctx.lineWidth = 8;
      ctx.strokeRect(wx - WIN_W / 2, top, WIN_W, WIN_H);
      ctx.fillStyle = this.look.frame;
      ctx.fillRect(wx - WIN_W / 2 - 10, top + WIN_H, WIN_W + 20, 10);
      // Holly on the sill's corners.
      if (this.look.snow) for (const side of [-1, 1]) holly(ctx, wx + side * (WIN_W / 2 + 2), top + WIN_H + 4);
    }
    if (this.look.snow) this.drawFestive(ctx);
    if (this.look.logs) this.drawHarvest(ctx, ground);
  }

  /** The cabin's walls of round logs: a shaded seam under each, clipped round the windows and door, and log ends at the corners. */
  private drawLogs(ctx: CanvasRenderingContext2D, walls: () => void, left: number, right: number, ground: number): void {
    ctx.save();
    walls();
    ctx.clip('evenodd');
    for (let y = ground - LOG_H; y > WALL_TOP - LOG_H; y -= LOG_H) {
      ctx.fillStyle = LOG_LIGHT;
      ctx.fillRect(left, y + 4, WIDTH, 6);
      ctx.fillStyle = LOG_SHADE;
      ctx.fillRect(left, y + LOG_H - 5, WIDTH, 5);
    }
    ctx.restore();
    // The log ends sticking out past each corner, with their rings.
    for (const cx of [left - 4, right + 4]) {
      for (let y = ground - LOG_H / 2; y > WALL_TOP; y -= LOG_H) {
        dot(ctx, cx, y, LOG_H / 2 + 1, '#d9b48a');
        dot(ctx, cx, y, LOG_H / 2 - 5, '#c99f74');
        dot(ctx, cx, y, 3, '#b08660');
      }
    }
  }

  /** Rounded stones on the cabin's chimney. */
  private drawStones(ctx: CanvasRenderingContext2D): void {
    const x0 = this.x + CHIMNEY_X;
    ctx.fillStyle = '#b8b1a4';
    for (let row = 0; row < 6; row++) {
      for (let k = 0; k < 3; k++) {
        const sx = x0 + 4 + k * 12 + (row % 2) * 6;
        if (sx + 8 > x0 + CHIMNEY_W) continue;
        ctx.beginPath();
        ctx.ellipse(sx + 4, CHIMNEY_TOP + 14 + row * 15, 5.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /** Rows of shingles on the cabin's roof, darker toward each row's lower edge, and soft patches of moss. */
  private drawShingles(ctx: CanvasRenderingContext2D, left: number, right: number): void {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(left - 30, WALL_TOP + 6);
    ctx.lineTo(this.x, ROOF_TOP);
    ctx.lineTo(right + 30, WALL_TOP + 6);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = '#6c4f3a';
    for (let y = ROOF_TOP + 16; y < WALL_TOP + 6; y += 18) {
      for (let x = left - 40 + ((y / 18) % 2) * 14; x < right + 40; x += 28) {
        ctx.beginPath();
        ctx.roundRect(x, y, 26, 6, [0, 0, 6, 6]);
        ctx.fill();
      }
    }
    ctx.fillStyle = MOSS;
    for (const [dx, dy, rx, ry] of [
      [-120, 70, 34, 10],
      [60, 40, 26, 8],
      [150, 82, 30, 9],
      [-30, 18, 18, 6],
    ]) {
      ctx.beginPath();
      ctx.ellipse(this.x + dx, ROOF_TOP + dy, rx, ry, (dx < 0 ? -1 : 1) * 0.24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** The cabin dressed for autumn: a string of dried leaves over the door, and a pumpkin by the step. */
  private drawHarvest(ctx: CanvasRenderingContext2D, ground: number): void {
    const gl = this.x - DOOR_W / 2 - 16;
    const gr = this.x + DOOR_W / 2 + 16;
    const gy = this.doorTop - 6;
    ctx.strokeStyle = '#8a6a4a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const px = gl + (gr - gl) * t;
      const py = gy + Math.sin(t * Math.PI) * 14;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    const leaves = ['#e8873a', '#d9603b', '#f2b544', '#b9773f'];
    for (let i = 1; i < 12; i++) {
      const t = i / 12;
      const px = gl + (gr - gl) * t;
      const py = gy + Math.sin(t * Math.PI) * 14 + 6;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate((i % 2 ? 0.5 : -0.5) + Math.PI / 2);
      ctx.fillStyle = leaves[i % leaves.length];
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.quadraticCurveTo(0, -6, 9, 0);
      ctx.quadraticCurveTo(0, 6, -9, 0);
      ctx.fill();
      ctx.restore();
    }
    // A pumpkin sitting by the step, to the right of the door.
    const px = this.x + DOOR_W / 2 + 40;
    const py = ground - 22;
    ctx.fillStyle = '#e8873a';
    for (const dx of [-12, 12, 0]) {
      ctx.beginPath();
      ctx.ellipse(px + dx, py, 15, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f2a04e';
    ctx.beginPath();
    ctx.ellipse(px - 4, py - 6, 5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a8a4a';
    ctx.beginPath();
    ctx.roundRect(px - 3, py - 26, 6, 10, 3);
    ctx.fill();
  }

  /** The town house dressed up: a garland over the door, and bulbs along the eaves. */
  private drawFestive(ctx: CanvasRenderingContext2D): void {
    // A green garland swagged over the door frame, with berries.
    const gl = this.x - DOOR_W / 2 - 14;
    const gr = this.x + DOOR_W / 2 + 14;
    const gy = this.doorTop - 4;
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const px = gl + (gr - gl) * t;
      const py = gy + Math.sin(t * Math.PI * 2) ** 2 * 10;
      dot(ctx, px, py, 9, i % 2 ? HOLLY : '#5fa06a');
    }
    for (const t of [0.25, 0.5, 0.75]) dot(ctx, gl + (gr - gl) * t, gy + 6, 4, BERRY);
    // The string of bulbs along the eaves: a dark wire and the bulbs, dull when switched off.
    const bulbs = this.eaveBulbs();
    ctx.strokeStyle = '#4b4f58';
    ctx.lineWidth = 2;
    ctx.beginPath();
    bulbs.forEach((b, i) => (i ? ctx.lineTo(b.x, b.y - 5) : ctx.moveTo(b.x, b.y - 5)));
    ctx.stroke();
    bulbs.forEach((b, i) => {
      ctx.fillStyle = '#4b4f58';
      ctx.fillRect(b.x - 2, b.y - 8, 4, 4);
      dot(ctx, b.x, b.y, 5, b.color);
      if (!this.lights[i]) dot(ctx, b.x, b.y, 5, 'rgba(70, 76, 96, 0.5)');
    });
  }

  /** Shutters and the door go on top of whatever sits on the sills or in the doorway. */
  drawShutters(ctx: CanvasRenderingContext2D): void {
    // The door swings inward on its left hinge, narrowing until it is open.
    const hinge = this.x - DOOR_W / 2;
    const width = DOOR_W * Math.cos((this.door * Math.PI) / 2);
    if (width > 4) {
      ctx.fillStyle = this.look.door;
      ctx.beginPath();
      ctx.roundRect(hinge, this.doorTop, width, DOOR_H, [Math.min(30, width / 2), Math.min(30, width / 2), 0, 0]);
      ctx.fill();
      if (width > 30) {
        ctx.fillStyle = '#f2c14e';
        ctx.beginPath();
        ctx.arc(hinge + width - 16, this.doorTop + DOOR_H * 0.55, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      // The town house's door wears a wreath with a red bow, turning away with the door.
      if (this.look.snow && width > 20) {
        const k = width / DOOR_W;
        const cx = hinge + width / 2;
        const cy = this.doorTop + 44;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(k, 1);
        ctx.strokeStyle = HOLLY;
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.arc(0, 0, 21, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          dot(ctx, Math.cos(a) * 21, Math.sin(a) * 21, 3, i % 2 ? BERRY : '#6fb07a');
        }
        ctx.fillStyle = BERRY;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(0, 20);
          ctx.lineTo(side * 14, 12);
          ctx.lineTo(side * 14, 28);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(0, 22);
          ctx.lineTo(side * 8, 40);
          ctx.lineTo(side * 2, 40);
          ctx.closePath();
          ctx.fill();
        }
        dot(ctx, 0, 20, 5, '#b8362f');
        ctx.restore();
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
        const [face, back, slat] = this.look.shutter;
        ctx.fillStyle = w >= 0 ? face : back;
        ctx.fillRect(a, top, width, WIN_H);
        if (width > 14) {
          ctx.fillStyle = slat;
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

/** Two holly leaves and three berries. */
function holly(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = HOLLY;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + side * 7, y, 9, 4, side * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const [dx, dy] of [
    [-3, -3],
    [3, -3],
    [0, 2],
  ]) {
    dot(ctx, x + dx, y + dy, 3, BERRY);
  }
}
