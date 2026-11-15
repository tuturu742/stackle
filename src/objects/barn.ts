import { GROUND_Y } from '../config';
import { drawGood, GOODS } from './goods';

const HAY = GOODS.hay;

const WIDTH = 340;
const WALL_TOP = GROUND_Y - 200;
const ROOF_TOP = GROUND_Y - 300;
const DOOR_W = 150;
const DOOR_H = 170;
/** Each door is half the doorway wide and slides this far to clear it. */
const PANEL = DOOR_W / 2;
/** Seconds for a hay bale to come back after it is taken. */
const HAY_SECONDS = 6;

export interface HayBale {
  x: number;
  /** 0 just taken, 1 there to take. */
  growth: number;
}

/**
 * A barn with two sliding doors: drag a door along its rail, or tap it to slide
 * it open or shut. Things put inside through the doorway stay in there, hidden
 * behind a shut door. Bales of hay inside can be taken and fed to the animals.
 */
export class Barn {
  /** The inside is drawn here, behind whatever is in the barn. */
  readonly backDepth = GROUND_Y + 2;
  /** Things inside stand on this line. */
  readonly insideFloor = GROUND_Y + 6;
  /** The front wall and doors are drawn here, in front of what is inside. */
  readonly depth = GROUND_Y + 10;
  /** How far each door (left, right) has slid open: 0 shut, 1 clear of the doorway. */
  readonly slide: [number, number] = [0, 0];
  /** Where a tapped door is sliding to, or null while a finger has it or it has arrived. */
  private target: [number | null, number | null] = [null, null];
  readonly hay: HayBale[];

  constructor(readonly x: number) {
    this.hay = [-42, 40].map((dx) => ({ x: x + dx, growth: 1 }));
  }

  private get doorTop(): number {
    return this.depth - DOOR_H;
  }

  /** Left and right edges of a door panel where it is now. */
  private panel(side: 0 | 1): [number, number] {
    const shift = this.slide[side] * PANEL;
    return side === 0
      ? [this.x - PANEL - shift, this.x - shift]
      : [this.x + shift, this.x + PANEL + shift];
  }

  /** The door at this point, if any. */
  doorAt(px: number, py: number, slop: number): 0 | 1 | null {
    if (py < this.doorTop - slop || py > this.depth + slop) return null;
    for (const side of [0, 1] as const) {
      const [a, b] = this.panel(side);
      if (px >= a - slop / 2 && px <= b + slop / 2) return side;
    }
    return null;
  }

  /** Slide a door under a finger. */
  drag(side: 0 | 1, slide: number): void {
    this.slide[side] = Math.max(0, Math.min(1, slide));
    this.target[side] = null;
  }

  /** A tap slides the door all the way open, or shut. Returns whether it is now opening. */
  toggle(side: 0 | 1): boolean {
    const opening = this.slide[side] < 0.5;
    this.target[side] = opening ? 1 : 0;
    return opening;
  }

  /** Which way a door opens: the left one slides left, the right one right. */
  static direction(side: 0 | 1): number {
    return side === 0 ? -1 : 1;
  }

  static get panelWidth(): number {
    return PANEL;
  }

  /** Is this point in the doorway hidden behind a door? */
  covered(x: number): boolean {
    return ([0, 1] as const).some((side) => {
      const [a, b] = this.panel(side);
      return x > a && x < b;
    });
  }

  /** Let go low in the doorway, where no door is in the way: it goes inside. */
  takesIn(x: number, bottom: number): boolean {
    return Math.abs(x - this.x) <= DOOR_W / 2 && !this.covered(x) && bottom >= GROUND_Y - 40 && bottom < this.depth;
  }

  /** Keep something inside within the doorway, so it can be seen and taken out again. */
  insideX(x: number, radius: number): number {
    const reach = Math.max(0, DOOR_W / 2 - radius * 0.6);
    return Math.max(this.x - reach, Math.min(this.x + reach, x));
  }

  /** Is a thing standing on this line here inside the barn? */
  isInside(x: number, floor: number): boolean {
    return Math.abs(x - this.x) <= WIDTH / 2 && floor > this.backDepth && floor < this.depth;
  }

  /** Is a ground line here behind the front wall, where nothing may stand unless inside? */
  behindWall(x: number, floor: number): boolean {
    return Math.abs(x - this.x) <= WIDTH / 2 + 10 && floor < this.depth + 2;
  }

  /** Things inside are clipped to the doorway, so a tall tower never pokes out through the roof. */
  clipInside(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.rect(this.x - DOOR_W / 2, this.doorTop, DOOR_W, DOOR_H);
    ctx.clip();
  }

  /** Centre of a bale that can be taken: there, and not behind a door. */
  hayAt(px: number, py: number, slop: number): { bale: HayBale; dist: number } | null {
    let best: { bale: HayBale; dist: number } | null = null;
    for (const bale of this.hay) {
      if (bale.growth < 1 || this.covered(bale.x)) continue;
      const dist = Math.hypot(px - bale.x, py - this.haySeat);
      if (dist <= HAY.radius + slop && (!best || dist < best.dist)) best = { bale, dist };
    }
    return best;
  }

  /** Where a bale's centre sits on the barn floor. */
  get haySeat(): number {
    return this.insideFloor - HAY.height / 2;
  }

  takeHay(bale: HayBale): void {
    bale.growth = 0;
  }

  update(dt: number, canGrow: boolean): void {
    for (const side of [0, 1] as const) {
      const target = this.target[side];
      if (target === null) continue;
      const step = dt * 3;
      const d = target - this.slide[side];
      this.slide[side] = Math.abs(d) <= step ? target : this.slide[side] + Math.sign(d) * step;
      if (this.slide[side] === target) this.target[side] = null;
    }
    if (canGrow) for (const bale of this.hay) bale.growth = Math.min(1, bale.growth + dt / HAY_SECONDS);
  }

  drawBack(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#5b3a33';
    ctx.fillRect(this.x - DOOR_W / 2, this.doorTop, DOOR_W, DOOR_H);
    ctx.fillStyle = '#7a5245';
    ctx.fillRect(this.x - DOOR_W / 2, this.depth - 14, DOOR_W, 14);
    // Bales grow back as a loose pile that firms up into a bale.
    for (const bale of this.hay) {
      if (bale.growth <= 0.05) continue;
      const s = bale.growth < 1 ? 0.3 + 0.4 * bale.growth : 1;
      drawGood(ctx, 'hay', bale.x, this.insideFloor - (HAY.height * s) / 2, 0, s, s, bale.growth < 1 ? 0.7 : 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const left = this.x - WIDTH / 2;
    const right = this.x + WIDTH / 2;
    // Front wall with the doorway cut out of it.
    ctx.fillStyle = '#d9695f';
    ctx.beginPath();
    ctx.moveTo(left, this.depth);
    ctx.lineTo(left, WALL_TOP);
    ctx.lineTo(this.x, ROOF_TOP + 26);
    ctx.lineTo(right, WALL_TOP);
    ctx.lineTo(right, this.depth);
    ctx.closePath();
    ctx.rect(this.x - DOOR_W / 2, this.doorTop, DOOR_W, DOOR_H);
    ctx.fill('evenodd');
    // Roof.
    ctx.strokeStyle = '#8d5c4f';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(left - 14, WALL_TOP + 8);
    ctx.lineTo(this.x, ROOF_TOP + 6);
    ctx.lineTo(right + 14, WALL_TOP + 8);
    ctx.stroke();
    // Round hayloft window.
    ctx.fillStyle = '#f6efe0';
    ctx.beginPath();
    ctx.arc(this.x, WALL_TOP + 10, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5b3a33';
    ctx.beginPath();
    ctx.arc(this.x, WALL_TOP + 10, 18, 0, Math.PI * 2);
    ctx.fill();
    // The rail the doors hang from.
    ctx.fillStyle = '#6f4a40';
    ctx.beginPath();
    ctx.roundRect(this.x - DOOR_W - 10, this.doorTop - 14, DOOR_W * 2 + 20, 10, 5);
    ctx.fill();
    for (const side of [0, 1] as const) {
      const [a, b] = this.panel(side);
      ctx.fillStyle = '#f0e6d4';
      ctx.fillRect(a, this.doorTop - 4, b - a, DOOR_H + 4);
      ctx.strokeStyle = '#d9695f';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a + 8, this.doorTop + 6);
      ctx.lineTo(b - 8, this.depth - 6);
      ctx.moveTo(b - 8, this.doorTop + 6);
      ctx.lineTo(a + 8, this.depth - 6);
      ctx.stroke();
      // Rollers on the rail.
      ctx.fillStyle = '#4b4f58';
      for (const rx of [a + 14, b - 14]) {
        ctx.beginPath();
        ctx.arc(rx, this.doorTop - 9, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
