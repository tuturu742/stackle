import { GROUND_Y } from '../config';
import * as audio from '../audio';
import { settings } from '../settings';
import type { Item } from './item';
import type { Perch } from './perch';

export type DecorKind = 'bush' | 'rock' | 'flowers' | 'leafpile' | 'log';

/** The fence's top rail, where birds sit. */
export const FENCE_TOP = GROUND_Y - 46;

/** Shakes in a row that bring an animal out of a bush, and how long a pause forgets them. */
const SHAKES_TO_COME_OUT = 3;
const SHAKE_PAUSE = 2;
/** How far either side of a bush's middle a let-go puts an animal into it. */
const BUSH_REACH = 85;

/** A wooden fence along the ground between `left` and `right`, behind everything. */
export function drawFence(ctx: CanvasRenderingContext2D, left: number, right: number, rail = '#d9b48a', post = '#c99f74'): void {
  const spacing = 64;
  ctx.fillStyle = rail;
  ctx.fillRect(left, FENCE_TOP, right - left, 9);
  ctx.fillRect(left, FENCE_TOP + 22, right - left, 9);
  ctx.fillStyle = post;
  for (let x = Math.floor(left / spacing) * spacing; x <= right + spacing; x += spacing) {
    ctx.beginPath();
    ctx.roundRect(x - 6, FENCE_TOP - 8, 12, GROUND_Y + 4 - (FENCE_TOP - 8), [6, 6, 0, 0]);
    ctx.fill();
  }
}

const FLOWER_COLORS = ['#f28b82', '#f6c26b', '#b39ddb', '#f7f3ea', '#81c7e8'];
const LEAF_COLORS = ['#e8873a', '#d9603b', '#f2b544', '#b9773f', '#e4a03c'];

/** A soft leaf shape, pointed at both ends, centred on (x, y). */
function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-size, 0);
  ctx.quadraticCurveTo(0, -size * 0.7, size, 0);
  ctx.quadraticCurveTo(0, size * 0.7, -size, 0);
  ctx.fill();
  ctx.restore();
}

/**
 * Scenery along the farm. Bushes rustle and flowers wiggle with a note when
 * tapped. A bush is also a hiding place for one animal: let go anywhere over
 * the bush it goes in out of sight, and a few shakes bring it out again. A pile
 * of autumn leaves is a hiding place just the same; a tap puffs leaves up out of it.
 * So is a hollow fallen log in the autumn wood: a tap rocks it and a leaf or two slip off.
 */
export class Decor implements Perch {
  /** Behind anything standing on the ground. */
  readonly depth = GROUND_Y - 1;
  private wiggle = 0;
  /** Shakes in a row, and seconds since the last; they are forgotten after a pause. */
  private shakes = 0;
  private sinceShake = 0;

  constructor(
    readonly kind: DecorKind,
    readonly x: number,
    /** Which flower colours and note: a fixed number, so each patch stays the same. */
    private readonly seed = 0,
  ) {}

  /** Bushes, leaf piles and hollow logs are hiding places for one animal. */
  get hiding(): boolean {
    return this.kind === 'bush' || this.kind === 'leafpile' || this.kind === 'log';
  }

  get seatCount(): number {
    return this.hiding ? 1 : 0;
  }

  seatX(): number {
    return this.x;
  }

  seatTop(): number {
    return GROUND_Y - 52;
  }

  seatReach(): number {
    return 60;
  }

  accepts(_i: number, bottom: Item): boolean {
    return !!bottom.animal;
  }

  /**
   * Its body anywhere over the leaves. Let go standing on the ground in front
   * of the bush, it stays out there.
   */
  catches(_i: number, x: number, bottom: number, height: number): boolean {
    const middle = bottom - Math.min(height, 90) / 2;
    return Math.abs(x - this.x) <= BUSH_REACH && middle >= GROUND_Y - 130 && middle <= GROUND_Y - 12 && bottom <= GROUND_Y + 8;
  }

  /** A shake; returns true on the shake that is enough to bring out what hides inside. */
  shake(): boolean {
    this.tap();
    this.shakes = this.sinceShake < SHAKE_PAUSE ? this.shakes + 1 : 1;
    this.sinceShake = 0;
    if (this.shakes < SHAKES_TO_COME_OUT) return false;
    this.shakes = 0;
    return true;
  }

  hides(): boolean {
    return true;
  }

  /** Something going in rustles the leaves. */
  seated(): void {
    this.tap();
  }

  hits(px: number, py: number, slop: number): boolean {
    if (this.kind === 'rock') return false;
    const w = this.kind === 'bush' ? 70 : this.kind === 'leafpile' ? 80 : this.kind === 'log' ? 95 : 40;
    const h = this.kind === 'bush' ? 80 : this.kind === 'log' ? 72 : 60;
    return Math.abs(px - this.x) <= w + slop && py <= GROUND_Y + 10 && py >= GROUND_Y - h - slop;
  }

  tap(): void {
    this.wiggle = 1;
    if (this.hiding) audio.rustle();
    else audio.flowerNote(this.seed);
  }

  update(dt: number): void {
    this.wiggle = Math.max(0, this.wiggle - dt * 1.5);
    this.sinceShake += dt;
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const amount = settings.reduceMotion ? 0.3 : 1;
    const w = Math.sin(time * 18) * this.wiggle * amount;
    if (this.kind === 'rock') {
      ctx.fillStyle = '#b8bcc2';
      ctx.beginPath();
      ctx.ellipse(this.x, GROUND_Y - 10, 34, 22, 0, Math.PI, Math.PI * 2);
      ctx.ellipse(this.x + 26, GROUND_Y - 4, 18, 12, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9cdd2';
      ctx.beginPath();
      ctx.ellipse(this.x - 8, GROUND_Y - 20, 12, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.kind === 'leafpile') {
      this.drawLeafPile(ctx, amount);
    } else if (this.kind === 'log') {
      this.drawLog(ctx, w * 0.04, amount);
    } else if (this.kind === 'bush') {
      ctx.save();
      ctx.translate(this.x, GROUND_Y);
      ctx.rotate(w * 0.05);
      ctx.fillStyle = '#6fae5a';
      for (const [dx, dy, r] of [
        [-38, -26, 30],
        [38, -24, 28],
        [0, -44, 40],
        [-14, -20, 30],
        [18, -20, 30],
      ]) {
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#7dbb66';
      ctx.beginPath();
      ctx.arc(-10, -54, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      for (let i = 0; i < 4; i++) {
        const fx = this.x - 30 + i * 20;
        const h = 34 + ((i * 13 + this.seed * 7) % 22);
        const tip = fx + w * 6 * (i % 2 ? 1 : -1);
        ctx.strokeStyle = '#6fae5a';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(fx, GROUND_Y + 4);
        ctx.quadraticCurveTo(fx, GROUND_Y - h / 2, tip, GROUND_Y - h);
        ctx.stroke();
        ctx.fillStyle = FLOWER_COLORS[(i + this.seed) % FLOWER_COLORS.length];
        for (let k = 0; k < 5; k++) {
          const a = (k * Math.PI * 2) / 5;
          ctx.beginPath();
          ctx.arc(tip + Math.cos(a) * 6, GROUND_Y - h + Math.sin(a) * 6, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#f6d36b';
        ctx.beginPath();
        ctx.arc(tip, GROUND_Y - h, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * A big hollow log lying along the ground, its open end turned toward the
   * viewer, with moss on top and a little toadstool. Just after a tap it rocks,
   * and a couple of leaves slip off its back.
   */
  private drawLog(ctx: CanvasRenderingContext2D, rock: number, amount: number): void {
    const x = this.x;
    const g = GROUND_Y + 4;
    ctx.save();
    ctx.translate(x, g);
    ctx.rotate(rock);
    // The bark: a long rounded body, darker underneath, with a few grooves.
    ctx.fillStyle = '#8a5f42';
    ctx.beginPath();
    ctx.roundRect(-92, -64, 150, 62, 30);
    ctx.fill();
    ctx.fillStyle = '#7a523a';
    ctx.beginPath();
    ctx.roundRect(-90, -26, 146, 24, [0, 0, 24, 24]);
    ctx.fill();
    ctx.fillStyle = '#9c6d4c';
    for (const [dx, dy, w] of [
      [-70, -50, 44],
      [-30, -40, 56],
      [-60, -16, 38],
    ]) {
      ctx.beginPath();
      ctx.roundRect(dx, dy, w, 5, 2.5);
      ctx.fill();
    }
    // Moss along its top.
    ctx.fillStyle = '#8aa35a';
    for (const [dx, r] of [
      [-70, 14],
      [-48, 18],
      [-24, 13],
      [-4, 15],
    ]) {
      ctx.beginPath();
      ctx.arc(dx, -62, r, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    // The open end, seen at an angle: a ring of pale wood round a dark hollow.
    ctx.fillStyle = '#d7b58a';
    ctx.beginPath();
    ctx.ellipse(58, -33, 30, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c49c6e';
    ctx.beginPath();
    ctx.ellipse(58, -33, 24, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a3326';
    ctx.beginPath();
    ctx.ellipse(60, -32, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    // A small toadstool at its foot.
    ctx.fillStyle = '#f3ead8';
    ctx.beginPath();
    ctx.roundRect(-84, -18, 7, 16, 3);
    ctx.fill();
    ctx.fillStyle = '#d9603b';
    ctx.beginPath();
    ctx.ellipse(-80, -18, 13, 9, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7efe1';
    ctx.beginPath();
    ctx.arc(-84, -22, 2, 0, Math.PI * 2);
    ctx.arc(-76, -21, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // A leaf or two resting on its back. After a tap they slip off and fade, as new ones settle back.
    const t = 1 - this.wiggle;
    const fall = Math.min(1, t * 1.3);
    for (let i = 0; i < 2; i++) {
      const color = LEAF_COLORS[(i + this.seed) % LEAF_COLORS.length];
      ctx.globalAlpha = 1 - this.wiggle;
      leaf(ctx, x - 40 + i * 50, g - 70, 11, i * 2, color);
      if (this.wiggle <= 0) continue;
      ctx.globalAlpha = this.wiggle;
      const lx = x - 40 + i * 50 + fall * (i ? 30 : -30) * amount + Math.sin(t * 10 + i) * 5 * fall;
      leaf(ctx, lx, g - 70 + fall * 66, 11, i * 2 + t * 4 * fall, color);
    }
    ctx.globalAlpha = 1;
  }

  /** A low mound of leaves; just after a tap, a few fly up out of it and flutter back down. */
  private drawLeafPile(ctx: CanvasRenderingContext2D, amount: number): void {
    const x = this.x;
    ctx.fillStyle = '#c9773b';
    ctx.beginPath();
    ctx.ellipse(x, GROUND_Y + 2, 82, 50, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // Loose leaves lying all over the mound, the same every time.
    for (let i = 0; i < 40; i++) {
      const a = Math.PI * (0.06 + 0.88 * ((i * 0.618 + this.seed * 0.13) % 1));
      const reach = 0.2 + 0.75 * ((i * 0.7549 + 0.3) % 1);
      const lx = x - Math.cos(a) * 78 * reach;
      const ly = GROUND_Y + 2 - Math.sin(a) * 48 * reach;
      leaf(ctx, lx, ly, 11 + (i % 3) * 2, i * 1.7, LEAF_COLORS[(i + this.seed) % LEAF_COLORS.length]);
    }
    if (this.wiggle <= 0) return;
    // The puff: leaves rise, spread and drift back down as the wiggle fades.
    const t = 1 - this.wiggle;
    for (let i = 0; i < 9; i++) {
      const dir = (i / 8 - 0.5) * 2;
      const up = Math.sin(Math.min(1, t * 1.6) * Math.PI) * (70 + (i % 3) * 22) * amount;
      const lx = x + dir * (30 + t * 50) * amount + Math.sin(t * 12 + i) * 6;
      const ly = GROUND_Y - 40 - up;
      ctx.globalAlpha = Math.min(1, this.wiggle * 2);
      leaf(ctx, lx, ly, 10, t * 8 + i, LEAF_COLORS[i % LEAF_COLORS.length]);
    }
    ctx.globalAlpha = 1;
  }
}

/**
 * A little bird on the fence. Touched, it flutters away; it is back on its post
 * only once that spot is out of sight, so it never pops up unprompted.
 */
export class Bird {
  readonly depth = GROUND_Y - 1;
  private state: 'perched' | 'flying' | 'away' = 'perched';
  private fx = 0;
  private fy = 0;
  private vx = 0;
  private vy = 0;
  private hop = 0;
  /** The way it faces, and flies off: 1 right, -1 left. */
  private readonly dir: number;

  constructor(
    readonly x: number,
    private readonly color: string,
    /** Where it sits: on the fence unless told otherwise (a crow on the scarecrow). */
    private readonly perchY = FENCE_TOP - 14,
    private readonly voice: 'chirp' | 'caw' = 'chirp',
  ) {
    this.dir = Math.round(x / 100) % 2 ? 1 : -1;
  }

  hits(px: number, py: number, slop: number): boolean {
    return this.state === 'perched' && Math.hypot(px - this.x, py - this.perchY) <= 22 + slop;
  }

  scare(): void {
    if (this.state !== 'perched') return;
    this.state = 'flying';
    this.fx = this.x;
    this.fy = this.perchY;
    this.vx = this.dir * 160;
    this.vy = -220;
    if (this.voice === 'caw') audio.caw();
    else audio.chirp();
  }

  /** `seen` says whether the bird's post is on screen right now. */
  update(dt: number, seen: boolean): void {
    this.hop += dt;
    if (this.state === 'flying') {
      this.fx += this.vx * dt;
      this.fy += this.vy * dt;
      this.vy -= 40 * dt;
      if (this.fy < -100) this.state = 'away';
    } else if (this.state === 'away' && !seen) {
      this.state = 'perched';
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.state === 'away') return;
    const flying = this.state === 'flying';
    const x = flying ? this.fx : this.x;
    const y = flying ? this.fy : this.perchY;
    // Drawn facing right, mirrored when it faces left.
    ctx.save();
    ctx.translate(x, 0);
    ctx.scale(this.dir, 1);
    ctx.translate(-x, 0);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(x, y, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 9, y - 9, 8, 0, Math.PI * 2);
    ctx.fill();
    const flap = flying ? Math.sin(this.hop * 30) * 10 : 0;
    ctx.fillStyle = '#f7f3ea';
    ctx.beginPath();
    ctx.ellipse(x - 3, y - 2 - flap, 8, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2a541';
    ctx.beginPath();
    ctx.moveTo(x + 16, y - 10);
    ctx.lineTo(x + 23, y - 8);
    ctx.lineTo(x + 16, y - 6);
    ctx.fill();
    ctx.fillStyle = '#4a3f45';
    ctx.beginPath();
    ctx.arc(x + 11, y - 11, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
