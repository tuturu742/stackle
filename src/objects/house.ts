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
/** Shutters swing out to lie flat against the wall. */
const OPEN_ANGLE = Math.PI * 0.92;

/**
 * The two-storey farmhouse. Its four windows have shutters that open and close when tapped.
 * Things sit on the window sills, like the model ship; behind shut shutters they
 * are out of sight and reach.
 */
export class House implements Perch {
  /** The rooms seen through the windows; things on the sills are drawn just after. */
  readonly depth = GROUND_Y + 2;
  /** The front wall and shutters. */
  readonly frontDepth = GROUND_Y + 10;
  /** Windows 0 and 1 downstairs (left, right), 2 and 3 upstairs. */
  readonly seatCount = 4;
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

  private get windows(): number[] {
    return this.isOpen.map((_, i) => i);
  }

  private winX(i: number): number {
    return this.x + (i % 2 === 0 ? -WIN_DX : WIN_DX);
  }

  private winTop(i: number): number {
    return WIN_TOPS[i < 2 ? 0 : 1];
  }

  seatX(i: number): number {
    return this.winX(i);
  }

  seatTop(i: number): number {
    return this.winTop(i) + WIN_H - 6;
  }

  seatReach(): number {
    return WIN_W / 2 - 6;
  }

  accepts(i: number): boolean {
    return this.open[i] > 0.5;
  }

  hides(i: number): boolean {
    return this.open[i] < 0.5;
  }

  clip(ctx: CanvasRenderingContext2D, i: number): void {
    ctx.beginPath();
    ctx.rect(this.winX(i) - WIN_W / 2, this.winTop(i), WIN_W, WIN_H);
    ctx.clip();
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

  update(dt: number): void {
    for (const i of this.windows) this.open[i] += ((this.isOpen[i] ? 1 : 0) - this.open[i]) * Math.min(1, dt * 6);
  }

  drawBack(ctx: CanvasRenderingContext2D): void {
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
    // Chimney behind the roof.
    ctx.fillStyle = '#c0614f';
    ctx.fillRect(this.x + 90, ROOF_TOP + 20, 34, 70);
    // Walls with the windows cut out.
    ctx.fillStyle = '#f5dd8a';
    ctx.beginPath();
    ctx.rect(left, WALL_TOP, WIDTH, ground - WALL_TOP);
    for (const i of this.windows) ctx.rect(this.winX(i) - WIN_W / 2, this.winTop(i), WIN_W, WIN_H);
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
    // Door and step.
    ctx.fillStyle = '#5fa8a0';
    ctx.beginPath();
    ctx.roundRect(this.x - 36, ground - 128, 72, 128, [30, 30, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(this.x + 22, ground - 62, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8d3a6';
    ctx.fillRect(this.x - 50, ground - 8, 100, 10);
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

  /** Shutters go on top of whatever sits on the sills. */
  drawShutters(ctx: CanvasRenderingContext2D): void {
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
}
