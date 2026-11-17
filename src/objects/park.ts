import { GROUND_Y } from '../config';
import { settings } from '../settings';
import type { Perch } from './perch';

// Spring's town park playground: a slide that takes whatever is put on its top
// down to the ground, a seesaw that tips toward the heavier end and rocks when
// tapped, a little carousel whose four seats go round after a push, and a
// fountain that bubbles and, tapped, sends up a tall jet for a moment.

const METAL = '#c9cfd8';
const METAL_DARK = '#a9b1bd';
const RED = '#ef8a7a';
const YELLOW = '#f2c14e';
const BLUE = '#7fb6e6';
const MINT = '#8fd1b4';
const PINK = '#f6a9c4';
const WOOD = '#c98c5e';
const WOOD_DARK = '#a8714a';
const STONE = '#e3ddd3';
const STONE_DARK = '#cfc7ba';
const WATER = '#9fd6ec';
const WATER_LIGHT = '#d4eef8';

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[], color: string): void {
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

function line(ctx: CanvasRenderingContext2D, color: string, width: number, points: number[]): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.stroke();
}

// --- Slide ------------------------------------------------------------------

/** Seconds something sits on top before it sets off, and roughly how long the ride takes. */
const SLIDE_WAIT = 0.5;
const SLIDE_SECONDS = 1.1;
/** The platform's height above the ground line, and the chute from its edge to its foot. */
const PLATFORM_UP = 200;
const CHUTE_TOP = { dx: -40, up: PLATFORM_UP };
const CHUTE_FOOT = { dx: 150, up: 22 };

/**
 * A slide: a ladder up to a little platform with a roof, and a yellow chute
 * curving down to the right. Anything put on the platform waits a moment, goes
 * down the chute and is left on the ground just past its foot.
 */
export class Slide implements Perch {
  readonly depth = GROUND_Y + 24;
  readonly seatCount = 1;
  /** Going down the chute. */
  sliding = false;
  private wait = 0;
  /** 0 at the top of the chute, 1 at its foot. */
  private ride = 0;
  private speed = 0;

  constructor(readonly x: number) {}

  /** A point down the chute, 0 at the top and 1 at the foot: steep at first, flattening out. */
  private chute(t: number): { x: number; y: number } {
    const x0 = this.x + CHUTE_TOP.dx;
    const x1 = this.x + CHUTE_FOOT.dx;
    const y0 = this.depth - CHUTE_TOP.up;
    const y1 = this.depth - CHUTE_FOOT.up;
    // A quadratic curve whose control point sits low under the top, so it starts steep.
    const cx = x0 + (x1 - x0) * 0.35;
    const cy = y1 + 10;
    const u = 1 - t;
    return { x: u * u * x0 + 2 * u * t * cx + t * t * x1, y: u * u * y0 + 2 * u * t * cy + t * t * y1 };
  }

  seatX(): number {
    return this.sliding ? this.chute(this.ride).x : this.x - 72;
  }

  seatTop(): number {
    return this.sliding ? this.chute(this.ride).y - 4 : this.depth - PLATFORM_UP;
  }

  seatReach(): number {
    return 70;
  }

  /** Where whatever rode down is left: just past the foot of the chute, on the ground in front. */
  get landX(): number {
    return this.x + CHUTE_FOOT.dx + 36;
  }

  get landFloor(): number {
    return this.depth + 14;
  }

  hits(px: number, py: number, slop: number): boolean {
    return px >= this.x - 190 - slop && px <= this.x + CHUTE_FOOT.dx + 20 + slop && py >= this.depth - 290 - slop && py <= this.depth + slop;
  }

  /** Runs the ride while something sits on it; returns true as it reaches the foot. */
  update(dt: number, occupied: boolean): boolean {
    if (!occupied) {
      this.reset();
      return false;
    }
    if (!this.sliding) {
      this.wait += dt;
      if (this.wait < SLIDE_WAIT) return false;
      this.sliding = true;
      this.ride = 0;
      this.speed = 0.4;
    }
    // Speeds up down the steep part, like a real slide.
    this.speed = Math.min(1.8, this.speed + (dt * 2.2) / SLIDE_SECONDS);
    this.ride = Math.min(1, this.ride + this.speed * dt);
    return this.ride >= 1;
  }

  reset(): void {
    this.sliding = false;
    this.wait = 0;
    this.ride = 0;
    this.speed = 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const g = this.depth;
    const x = this.x;
    const top = g - PLATFORM_UP;
    // The ladder leaning on the tower's left side: two rails and rungs.
    line(ctx, METAL_DARK, 8, [x - 186, g, x - 128, top + 4]);
    line(ctx, METAL_DARK, 8, [x - 150, g, x - 110, top + 14]);
    for (let k = 1; k < 7; k++) {
      const t = k / 7;
      line(ctx, METAL, 6, [x - 186 + 58 * t, g - (PLATFORM_UP - 4) * t, x - 150 + 40 * t, g - (PLATFORM_UP - 14) * t]);
    }
    // The tower: two posts under the platform, and a little pointed roof over it.
    for (const dx of [-108, -38]) box(ctx, x + dx - 5, top - 70, 10, g - top + 70, 4, BLUE);
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.moveTo(x - 124, top - 66);
    ctx.lineTo(x - 73, top - 112);
    ctx.lineTo(x - 22, top - 66);
    ctx.closePath();
    ctx.fill();
    dot(ctx, x - 73, top - 114, 7, YELLOW);
    // A rail round the platform, then the platform itself.
    line(ctx, BLUE, 6, [x - 108, top - 34, x - 38, top - 34]);
    box(ctx, x - 116, top, 86, 14, 6, YELLOW);
    // The chute: a wide yellow band with a darker lip along its side.
    const steps = 20;
    const edge = (off: number) => {
      for (let i = 0; i <= steps; i++) {
        const p = this.chute(i / steps);
        if (i === 0) ctx.moveTo(p.x, p.y + off);
        else ctx.lineTo(p.x, p.y + off);
      }
    };
    ctx.strokeStyle = '#e0a93a';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    edge(6);
    ctx.stroke();
    ctx.strokeStyle = YELLOW;
    ctx.lineWidth = 14;
    ctx.beginPath();
    edge(2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    edge(-2);
    ctx.stroke();
    // A leg under the middle of the chute and a foot at its end.
    const mid = this.chute(0.45);
    line(ctx, METAL_DARK, 7, [mid.x, mid.y + 12, mid.x + 6, g]);
    const foot = this.chute(1);
    line(ctx, METAL_DARK, 7, [foot.x - 6, foot.y + 12, foot.x - 6, g]);
  }
}

// --- Seesaw -------------------------------------------------------------------

/** Half the plank's length, the pivot's height, and the most it tips either way. */
const PLANK_HALF = 150;
const PIVOT_UP = 46;
const MAX_TILT = 0.24;

/**
 * A seesaw: a long plank on a pivot with a seat and handle at each end. It
 * tips toward whichever end holds more, and a tap gives it a push so it rocks
 * the other way and settles back.
 */
export class Seesaw implements Perch {
  readonly depth = GROUND_Y + 30;
  readonly seatCount = 2;
  /** Positive tips the right end down. */
  private tilt = 0;
  private spin = 0;

  constructor(readonly x: number) {}

  private get pivotY(): number {
    return this.depth - PIVOT_UP;
  }

  /** Where along the plank's top an end seat is (-1 left, 1 right). */
  private end(i: number): { x: number; y: number } {
    const side = i === 0 ? -1 : 1;
    const reach = PLANK_HALF - 26;
    return { x: this.x + side * reach * Math.cos(this.tilt), y: this.pivotY - 8 + side * reach * Math.sin(this.tilt) };
  }

  seatX(i: number): number {
    return this.end(i).x;
  }

  seatTop(i: number): number {
    return this.end(i).y - 6;
  }

  seatReach(): number {
    return 60;
  }

  hits(px: number, py: number, slop: number): boolean {
    return Math.abs(px - this.x) <= PLANK_HALF + slop && py >= this.pivotY - 70 - slop && py <= this.depth + slop;
  }

  /** A push: whichever end is up comes down, and it rocks back. */
  tap(): void {
    const kick = settings.reduceMotion ? 1.4 : 2.6;
    this.spin += this.tilt > 0.02 ? -kick : this.tilt < -0.02 ? kick : this.spin >= 0 ? kick : -kick;
  }

  /** Tips toward the heavier end, springing there gently. */
  update(dt: number, left: number, right: number): void {
    const target = MAX_TILT * Math.tanh((right - left) / 1500);
    this.spin += (target - this.tilt) * 14 * dt;
    this.spin *= Math.exp(-2.4 * dt);
    this.tilt += this.spin * dt;
    // The ends bump softly on the ground and stop there.
    if (Math.abs(this.tilt) > MAX_TILT) {
      this.tilt = Math.sign(this.tilt) * MAX_TILT;
      this.spin *= -0.25;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const g = this.depth;
    const x = this.x;
    // The pivot: a little red stand.
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.moveTo(x - 26, g);
    ctx.lineTo(x - 8, this.pivotY);
    ctx.lineTo(x + 8, this.pivotY);
    ctx.lineTo(x + 26, g);
    ctx.closePath();
    ctx.fill();
    // The plank, turned by the tilt, with a seat and a handle at each end.
    ctx.save();
    ctx.translate(x, this.pivotY);
    ctx.rotate(this.tilt);
    box(ctx, -PLANK_HALF, -8, PLANK_HALF * 2, 14, 7, WOOD);
    box(ctx, -PLANK_HALF, 2, PLANK_HALF * 2, 4, 2, WOOD_DARK);
    for (const side of [-1, 1]) {
      const sx = side * (PLANK_HALF - 26);
      box(ctx, sx - 26, -14, 52, 8, 4, side < 0 ? BLUE : MINT);
      const hx = side * (PLANK_HALF - 64);
      line(ctx, METAL_DARK, 6, [hx, -8, hx, -40]);
      line(ctx, METAL_DARK, 6, [hx - 12, -40, hx + 12, -40]);
      dot(ctx, hx - 12, -40, 5, YELLOW);
      dot(ctx, hx + 12, -40, 5, YELLOW);
    }
    ctx.restore();
    dot(ctx, x, this.pivotY, 7, YELLOW);
  }
}

// --- Carousel -----------------------------------------------------------------

/** How far round from the middle the seats ride (an ellipse seen from the front), and how high. */
const RING_X = 104;
const RING_Y = 18;
const SEAT_UP = 40;
const SEAT_COLORS = [RED, BLUE, YELLOW, MINT];
/** The fastest it turns, and how quickly it slows. */
const MAX_TURN = 2.4;

/**
 * A little round carousel under a striped canopy: a platform turning about a
 * pole, with four seats round it. A tap gives it a push; it turns, slowing
 * gently, carrying whatever sits on the seats round to the back and front.
 */
export class Carousel implements Perch {
  readonly depth = GROUND_Y + 28;
  readonly seatCount = 4;
  /** The pole, canopy and the front seats are drawn here, over riders on the back seats. */
  readonly frontDepth = GROUND_Y + 30;
  private angle = 0;
  private turn = 0;

  constructor(readonly x: number) {}

  /** A seat's place round the ring: positive sin is at the front, nearer the viewer. */
  private seatAngle(i: number): number {
    return this.angle + Math.PI / 4 + (i * Math.PI) / 2;
  }

  private get floorY(): number {
    return this.depth - 26;
  }

  seatX(i: number): number {
    return this.x + RING_X * Math.cos(this.seatAngle(i));
  }

  seatTop(i: number): number {
    return this.floorY + RING_Y * Math.sin(this.seatAngle(i)) - SEAT_UP;
  }

  seatReach(): number {
    return 48;
  }

  private front(i: number): boolean {
    return Math.sin(this.seatAngle(i)) > 0;
  }

  /** Riders at the back go behind the pole; riders at the front over it and their seats. */
  seatDepth(i: number): number {
    return this.front(i) ? this.frontDepth + 1 : this.depth + 1;
  }

  hits(px: number, py: number, slop: number): boolean {
    return Math.abs(px - this.x) <= RING_X + 40 + slop && py >= this.depth - 270 - slop && py <= this.depth + slop;
  }

  /** A push: it turns a little faster, up to a gentle most. */
  tap(): void {
    const push = settings.reduceMotion ? 0.7 : 1.2;
    this.turn = Math.min(settings.reduceMotion ? MAX_TURN / 2 : MAX_TURN, this.turn + push);
  }

  update(dt: number): void {
    this.angle = (this.angle + this.turn * dt) % (Math.PI * 2);
    this.turn = Math.max(0, this.turn - dt * (0.25 + this.turn * 0.18));
  }

  private drawSeat(ctx: CanvasRenderingContext2D, i: number): void {
    const sx = this.seatX(i);
    const top = this.seatTop(i);
    const bottom = this.floorY + RING_Y * Math.sin(this.seatAngle(i));
    // A bright little seat on a post: it narrows a little as it goes round the side.
    const w = 30 + 14 * Math.abs(Math.sin(this.seatAngle(i)));
    box(ctx, sx - 3, top, 6, bottom - top, 3, METAL_DARK);
    box(ctx, sx - w / 2, top, w, 12, 6, SEAT_COLORS[i]);
  }

  /** The platform and the seats round the back. */
  draw(ctx: CanvasRenderingContext2D, _time: number): void {
    const x = this.x;
    const fy = this.floorY;
    ctx.fillStyle = WOOD_DARK;
    ctx.beginPath();
    ctx.ellipse(x, fy + 10, RING_X + 30, RING_Y + 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e7d3b5';
    ctx.beginPath();
    ctx.ellipse(x, fy, RING_X + 30, RING_Y + 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Painted stripes on the platform, turning with it.
    ctx.strokeStyle = '#d9c09b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = this.angle + (k * Math.PI) / 4;
      ctx.moveTo(x, fy);
      ctx.lineTo(x + Math.cos(a) * (RING_X + 26), fy + Math.sin(a) * (RING_Y + 9));
    }
    ctx.stroke();
    for (let i = 0; i < this.seatCount; i++) if (!this.front(i)) this.drawSeat(ctx, i);
  }

  /** The pole and canopy, then the seats round the front. */
  drawFront(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const fy = this.floorY;
    const roof = this.depth - 250;
    box(ctx, x - 6, roof, 12, fy - roof, 6, METAL);
    // The canopy: a striped dome with a scalloped edge and a flag on top.
    const stripes = 8;
    for (let k = 0; k < stripes; k++) {
      const x0 = x - RING_X - 30 + ((RING_X + 30) * 2 * k) / stripes;
      const x1 = x - RING_X - 30 + ((RING_X + 30) * 2 * (k + 1)) / stripes;
      ctx.fillStyle = k % 2 ? '#fff6f8' : PINK;
      ctx.beginPath();
      ctx.moveTo(x, roof - 44);
      ctx.lineTo(x0, roof + 4);
      ctx.lineTo(x1, roof + 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc((x0 + x1) / 2, roof + 4, (x1 - x0) / 2, 0, Math.PI);
      ctx.fill();
    }
    line(ctx, METAL_DARK, 3, [x, roof - 44, x, roof - 72]);
    ctx.fillStyle = YELLOW;
    ctx.beginPath();
    ctx.moveTo(x, roof - 72);
    ctx.lineTo(x + 22, roof - 65);
    ctx.lineTo(x, roof - 58);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < this.seatCount; i++) if (this.front(i)) this.drawSeat(ctx, i);
  }
}

// --- Fountain -----------------------------------------------------------------

/** Seconds the tall jet lasts after a tap. */
const JET_SECONDS = 1.8;

/**
 * A round stone fountain in the middle of the park: a basin of water with a
 * little bowl on a column, bubbling over. A tap sends up a tall jet that falls
 * back in soft drops.
 */
export class Fountain {
  readonly depth = GROUND_Y + 20;
  private jet = 0;

  constructor(readonly x: number) {}

  hits(px: number, py: number, slop: number): boolean {
    return Math.abs(px - this.x) <= 120 + slop && py >= this.depth - 200 - slop && py <= this.depth + slop;
  }

  tap(): void {
    this.jet = JET_SECONDS;
  }

  update(dt: number): void {
    this.jet = Math.max(0, this.jet - dt);
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const x = this.x;
    const g = this.depth;
    const calm = settings.reduceMotion;
    // The basin: a wide stone rim around the water.
    box(ctx, x - 116, g - 50, 232, 50, [20, 20, 12, 12], STONE_DARK);
    ctx.fillStyle = STONE;
    ctx.beginPath();
    ctx.ellipse(x, g - 50, 118, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = WATER;
    ctx.beginPath();
    ctx.ellipse(x, g - 50, 102, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Rings spreading slowly on the water.
    ctx.strokeStyle = WATER_LIGHT;
    ctx.lineWidth = 2;
    for (let k = 0; k < 2; k++) {
      const p = (time * 0.4 + k * 0.5) % 1;
      ctx.globalAlpha = 1 - p;
      ctx.beginPath();
      ctx.ellipse(x, g - 50, 20 + p * 70, 3 + p * 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // The column and the little bowl on it.
    box(ctx, x - 12, g - 112, 24, 64, 6, STONE_DARK);
    ctx.fillStyle = STONE;
    ctx.beginPath();
    ctx.ellipse(x, g - 112, 44, 9, 0, 0, Math.PI);
    ctx.lineTo(x - 44, g - 112);
    ctx.fill();
    box(ctx, x - 46, g - 120, 92, 10, 5, STONE);
    // Water bubbling up out of the bowl and spilling over its sides.
    const bob = calm ? 0 : Math.sin(time * 4) * 2;
    ctx.fillStyle = WATER;
    ctx.beginPath();
    ctx.ellipse(x, g - 124 + bob * 0.5, 14, 8 + bob, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = WATER;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * 44, g - 116);
      ctx.quadraticCurveTo(x + side * 58, g - 108, x + side * 60, g - 58);
      ctx.stroke();
    }
    // After a tap: a tall jet rising and falling back in drops.
    if (this.jet > 0) {
      const t = 1 - this.jet / JET_SECONDS;
      const height = (calm ? 90 : 160) * Math.sin(Math.PI * Math.min(1, t * 1.2));
      box(ctx, x - 5, g - 128 - height, 10, height + 4, 5, WATER);
      dot(ctx, x, g - 128 - height, 9, WATER_LIGHT);
      for (let k = 0; k < 6; k++) {
        const side = k % 2 ? 1 : -1;
        const p = (t * 2 + k / 6) % 1;
        const dx = side * (10 + p * 34);
        const dy = -height + p * p * (height + 60);
        ctx.globalAlpha = Math.min(1, this.jet);
        dot(ctx, x + dx, g - 128 + dy, 4, WATER);
      }
      ctx.globalAlpha = 1;
    }
  }
}
