import { GROUND_Y } from '../config';
import type { Perch } from './perch';

// Spring's garden things: a glass greenhouse with a potting bench to put things
// on, a little arched footbridge over the stream, a birdhouse whose babies peep
// out when tapped, and a ribbon pole that swirls.

const WOOD = '#c98c5e';
const WOOD_DARK = '#a8714a';
const WOOD_LIGHT = '#dba578';
const FRAME = '#f7f3ea';
const GLASS = 'rgba(207, 234, 245, 0.75)';
const GLASS_SHINE = 'rgba(255, 255, 255, 0.55)';

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

const GH_HALF = 150;
const GH_WALL = 170;
const GH_PEAK = 260;
/** The potting bench's two shelves, above the ground line, and where along them things stand. */
const SHELF_LOW = 46;
const SHELF_HIGH = 104;
const SHELF_DX = [-64, 64];

/**
 * A glass greenhouse with a white frame and a sloped glass roof, seedlings in
 * pots and a hanging basket inside. In front stands a potting bench with two
 * shelves: anything put on a shelf stands there.
 */
export class Greenhouse implements Perch {
  readonly depth = GROUND_Y + 12;
  /** Seats 0 and 1 are on the low shelf, 2 and 3 on the high one. */
  readonly seatCount = 4;

  constructor(readonly x: number) {}

  seatX(i: number): number {
    return this.x + SHELF_DX[i % 2];
  }

  seatTop(i: number): number {
    return this.depth - (i < 2 ? SHELF_LOW : SHELF_HIGH);
  }

  seatReach(): number {
    return 34;
  }

  hits(px: number, py: number, slop: number): boolean {
    return Math.abs(px - this.x) <= GH_HALF + slop && py >= this.depth - GH_PEAK - slop && py <= this.depth + slop;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const g = this.depth;
    const wallTop = g - GH_WALL;
    const peak = g - GH_PEAK;
    // A low brick footing, then the glass walls and roof.
    box(ctx, x - GH_HALF - 4, g - 26, GH_HALF * 2 + 8, 28, [6, 6, 0, 0], '#d98c74');
    ctx.fillStyle = GLASS;
    ctx.beginPath();
    ctx.moveTo(x - GH_HALF, g - 26);
    ctx.lineTo(x - GH_HALF, wallTop);
    ctx.lineTo(x, peak);
    ctx.lineTo(x + GH_HALF, wallTop);
    ctx.lineTo(x + GH_HALF, g - 26);
    ctx.closePath();
    ctx.fill();
    // Inside: seedlings in pots on the ground, and a hanging basket of flowers.
    for (const dx of [-110, -78, 84, 116]) {
      box(ctx, x + dx - 10, g - 50, 20, 22, [2, 2, 6, 6], '#d98c74');
      ctx.fillStyle = '#7cc164';
      ctx.beginPath();
      ctx.ellipse(x + dx - 5, g - 58, 5, 9, -0.5, 0, Math.PI * 2);
      ctx.ellipse(x + dx + 5, g - 58, 5, 9, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#a8a29a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 60, wallTop + 6);
    ctx.lineTo(x - 72, wallTop + 40);
    ctx.moveTo(x - 60, wallTop + 6);
    ctx.lineTo(x - 48, wallTop + 40);
    ctx.stroke();
    ctx.fillStyle = '#7cc164';
    ctx.beginPath();
    ctx.ellipse(x - 60, wallTop + 44, 24, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    box(ctx, x - 78, wallTop + 40, 36, 18, [2, 2, 10, 10], WOOD_LIGHT);
    for (const [dx, c] of [
      [-74, '#f39ab6'],
      [-62, '#f6d86b'],
      [-50, '#ffffff'],
      [-66, '#b39ddb'],
    ] as const) {
      dot(ctx, x + dx, wallTop + 38 + (dx === -66 ? -6 : 0), 4, c);
    }
    // The white frame: corner posts, glazing bars and the roof ridge.
    ctx.strokeStyle = FRAME;
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - GH_HALF, g - 24);
    ctx.lineTo(x - GH_HALF, wallTop);
    ctx.lineTo(x, peak);
    ctx.lineTo(x + GH_HALF, wallTop);
    ctx.lineTo(x + GH_HALF, g - 24);
    ctx.moveTo(x - GH_HALF, wallTop);
    ctx.lineTo(x + GH_HALF, wallTop);
    ctx.stroke();
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (const dx of [-100, -50, 0, 50, 100]) {
      ctx.moveTo(x + dx, g - 24);
      ctx.lineTo(x + dx, wallTop);
      // The roof bars run up toward the ridge.
      const k = 1 - Math.abs(dx) / GH_HALF;
      ctx.moveTo(x + dx, wallTop);
      ctx.lineTo(x + dx * 0.98, wallTop - (GH_PEAK - GH_WALL) * k);
    }
    ctx.stroke();
    // Shine on the glass.
    ctx.fillStyle = GLASS_SHINE;
    for (const dx of [-138, 12]) {
      ctx.beginPath();
      ctx.moveTo(x + dx, wallTop + 16);
      ctx.lineTo(x + dx + 14, wallTop + 16);
      ctx.lineTo(x + dx + 2, wallTop + 70);
      ctx.lineTo(x + dx - 12, wallTop + 70);
      ctx.closePath();
      ctx.fill();
    }
    dot(ctx, x, peak + 2, 6, FRAME);
    // The potting bench in front: legs, a low shelf and a high shelf.
    for (const dx of [-108, 100]) box(ctx, x + dx, g - SHELF_HIGH, 8, SHELF_HIGH, 3, WOOD_DARK);
    box(ctx, x - 116, g - SHELF_LOW - 2, 232, 12, 5, WOOD);
    box(ctx, x - 116, g - SHELF_HIGH - 2, 232, 12, 5, WOOD);
    box(ctx, x - 112, g - SHELF_HIGH - 2, 224, 4, 2, WOOD_LIGHT);
    box(ctx, x - 112, g - SHELF_LOW - 2, 224, 4, 2, WOOD_LIGHT);
  }
}

/**
 * A small arched wooden footbridge with rails, over a stream (the stream is a
 * puddle the game draws under it). Anything can stand on the arch: three spots
 * along the top, each at the arch's height there.
 */
export class Bridge implements Perch {
  readonly depth = GROUND_Y + 44;
  readonly seatCount = 3;

  constructor(
    readonly x: number,
    readonly width: number,
  ) {}

  /** How high the arch rises in the middle: a longer bridge arches a little higher. */
  private get rise(): number {
    return 34 + this.width * 0.05;
  }

  /** The deck's top at a point along the bridge, 0 at its left foot, 1 at its right. */
  private deck(t: number): number {
    return this.depth - 18 - this.rise * Math.sin(Math.PI * t);
  }

  private seatT(i: number): number {
    return 0.25 + i * 0.25;
  }

  seatX(i: number): number {
    return this.x - this.width / 2 + this.seatT(i) * this.width;
  }

  seatTop(i: number): number {
    return this.deck(this.seatT(i));
  }

  seatReach(): number {
    return this.width / 8;
  }

  hits(px: number, py: number, slop: number): boolean {
    const t = (px - (this.x - this.width / 2)) / this.width;
    if (t < 0 || t > 1) return false;
    const y = this.deck(t);
    return py >= y - 50 - slop && py <= y + 20 + slop;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const left = this.x - this.width / 2;
    const steps = 24;
    const point = (t: number) => ({ x: left + t * this.width, y: this.deck(t) });
    // The arch underneath, a little darker, then the deck planks on top.
    ctx.fillStyle = WOOD_DARK;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const p = point(i / steps);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    for (let i = steps; i >= 0; i--) {
      const p = point(i / steps);
      ctx.lineTo(p.x, p.y + 22 - 10 * Math.sin((Math.PI * i) / steps));
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = WOOD;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const p = point(i / steps);
      if (i === 0) ctx.moveTo(p.x, p.y + 4);
      else ctx.lineTo(p.x, p.y + 4);
    }
    ctx.stroke();
    // Plank joins along the deck, one every 30 or so whatever its length.
    const planks = Math.max(8, Math.round(this.width / 30));
    ctx.strokeStyle = WOOD_DARK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 1; i < planks; i++) {
      const p = point(i / planks);
      ctx.moveTo(p.x, p.y - 1);
      ctx.lineTo(p.x, p.y + 9);
    }
    ctx.stroke();
    // The rail: posts at the ends and between, and a handrail following the arch.
    ctx.strokeStyle = WOOD_LIGHT;
    ctx.lineWidth = 5;
    ctx.beginPath();
    // Posts about every 110 along it.
    const spans = Math.max(4, Math.round(this.width / 110));
    for (let k = 0; k <= spans; k++) {
      const p = point(0.04 + (0.92 * k) / spans);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y - 38);
    }
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = 0.04 + (0.92 * i) / steps;
      const p = point(t);
      if (i === 0) ctx.moveTo(p.x, p.y - 38);
      else ctx.lineTo(p.x, p.y - 38);
    }
    ctx.stroke();
    for (const t of [0.04, 0.96]) {
      const p = point(t);
      dot(ctx, p.x, p.y - 40, 5, WOOD);
    }
  }
}

/** Seconds the baby birds stay out after a tap, and how quickly they pop up and duck back. */
const PEEP_SECONDS = 2.5;
const POP = 0.25;
const BABIES = ['#f6d86b', '#9ccbe8', '#f7c6d6'];

/**
 * A little birdhouse on a pole with a round door. A tap brings three baby birds
 * popping their heads out of the door, beaks opening, for a moment; then they
 * duck back in.
 */
export class Birdhouse {
  readonly depth = GROUND_Y + 2;
  /** Seconds left with the babies out; 0 when they are tucked inside. */
  private out = 0;
  private time = 0;

  constructor(readonly x: number) {}

  private get top(): number {
    return this.depth - 210;
  }

  hits(px: number, py: number, slop: number): boolean {
    const onHouse = Math.abs(px - this.x) <= 46 + slop && py >= this.top - 40 - slop && py <= this.top + 74 + slop;
    const onPole = Math.abs(px - this.x) <= 8 + slop && py >= this.top && py <= this.depth + slop;
    return onHouse || onPole;
  }

  tap(): void {
    // Already out, they stay out a little longer.
    this.out = Math.max(this.out, PEEP_SECONDS);
  }

  update(dt: number): void {
    this.time += dt;
    this.out = Math.max(0, this.out - dt);
  }

  /** 0 tucked in, 1 heads right out. */
  private get rise(): number {
    if (this.out <= 0) return 0;
    const up = Math.min(1, (PEEP_SECONDS - this.out) / POP);
    const down = Math.min(1, this.out / POP);
    const k = Math.min(up, down);
    return 1 - (1 - k) * (1 - k);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const top = this.top;
    box(ctx, x - 5, top + 60, 10, this.depth - top - 58, 3, WOOD_DARK);
    // The house: walls, a pointed roof with a little overhang, the perch.
    box(ctx, x - 36, top + 4, 72, 68, 8, '#f2c58a');
    ctx.fillStyle = '#e8665c';
    ctx.beginPath();
    ctx.moveTo(x - 46, top + 12);
    ctx.quadraticCurveTo(x - 30, top - 14, x, top - 34);
    ctx.quadraticCurveTo(x + 30, top - 14, x + 46, top + 12);
    ctx.quadraticCurveTo(x, top + 2, x - 46, top + 12);
    ctx.fill();
    dot(ctx, x, top - 34, 5, '#f7c6d6');
    // The door, dark inside, and the babies peeping out of it.
    const doorY = top + 34;
    dot(ctx, x, doorY, 17, '#6e4b3a');
    const rise = this.rise;
    if (rise > 0) {
      ctx.save();
      // Seen only through the door, and above it once they lean out.
      ctx.beginPath();
      ctx.arc(x, doorY, 17, 0, Math.PI * 2);
      ctx.rect(x - 40, doorY - 60, 80, 60);
      ctx.clip();
      BABIES.forEach((color, i) => {
        const dx = (i - 1) * 12;
        const lift = rise * (16 + (i === 1 ? 6 : 0)) + Math.sin(this.time * 10 + i * 2) * 1.2 * rise;
        const hy = doorY + 10 - lift;
        dot(ctx, x + dx, hy, 9, color);
        dot(ctx, x + dx - 3, hy - 2, 1.8, '#4b4f58');
        dot(ctx, x + dx + 3, hy - 2, 1.8, '#4b4f58');
        // A beak opening and closing, as if cheeping.
        const open = (Math.sin(this.time * 14 + i * 1.7) * 0.5 + 0.5) * 3 * rise;
        ctx.fillStyle = '#f2a541';
        ctx.beginPath();
        ctx.moveTo(x + dx - 3.5, hy + 2);
        ctx.lineTo(x + dx + 3.5, hy + 2);
        ctx.lineTo(x + dx, hy + 6 - open * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + dx - 3, hy + 2 + open * 0.4);
        ctx.lineTo(x + dx + 3, hy + 2 + open * 0.4);
        ctx.lineTo(x + dx, hy + 5 + open);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();
    }
    box(ctx, x - 14, top + 58, 28, 6, 3, WOOD);
    // A little heart above the door.
    ctx.fillStyle = '#f7c6d6';
    ctx.beginPath();
    ctx.arc(x - 3, top + 12, 3, 0, Math.PI * 2);
    ctx.arc(x + 3, top + 12, 3, 0, Math.PI * 2);
    ctx.moveTo(x - 6, top + 13);
    ctx.lineTo(x, top + 19);
    ctx.lineTo(x + 6, top + 13);
    ctx.fill();
  }
}

const POLE_HEIGHT = 300;
const RIBBONS = ['#f7c6d6', '#f6d86b', '#9ccbe8', '#b39ddb', '#a8dba0', '#f2b48c'];
const RIBBON_LENGTH = 210;
/** Seconds the ribbons swirl round after a tap. */
const SWIRL_SECONDS = 3;

/**
 * A tall pole with a crown of flowers and six long pastel ribbons fluttering
 * gently from its top. A tap sets the ribbons swirling round the pole, flying
 * out wide, until they slow and settle again.
 */
export class RibbonPole {
  readonly depth = GROUND_Y + 4;
  /** 1 just tapped, easing back to 0. */
  private swirl = 0;
  /** How far the ribbons have gone round the pole. */
  private turn = 0;

  constructor(readonly x: number) {}

  private get top(): number {
    return this.depth - POLE_HEIGHT;
  }

  hits(px: number, py: number, slop: number): boolean {
    const onPole = Math.abs(px - this.x) <= 14 + slop && py >= this.top - 20 - slop && py <= this.depth + slop;
    const onRibbons = Math.abs(px - this.x) <= 40 + 60 * this.swirl + slop && py >= this.top && py <= this.top + RIBBON_LENGTH;
    return onPole || onRibbons;
  }

  tap(): void {
    this.swirl = 1;
  }

  update(dt: number): void {
    this.turn += dt * this.swirl * 4.5;
    this.swirl = Math.max(0, this.swirl - dt / SWIRL_SECONDS);
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const x = this.x;
    const top = this.top;
    // How far out the ribbons fly: eases off as the swirl slows.
    const spread = this.swirl * this.swirl * (2 - this.swirl);
    const ribbon = (i: number) => {
      const a = (i / RIBBONS.length) * Math.PI * 2 + this.turn;
      const reach = 18 + 120 * spread;
      const endX = x + Math.cos(a) * reach + Math.sin(time * 1.6 + i) * 6 * (1 - spread);
      const endY = top + RIBBON_LENGTH - 90 * spread + Math.sin(time * 2 + i * 1.3) * 4;
      const midX = x + Math.cos(a - 0.6 * spread) * reach * 0.55 + Math.sin(time * 2.2 + i) * 5;
      const midY = top + RIBBON_LENGTH * 0.45 - 30 * spread;
      return { behind: Math.sin(a) < 0, endX, endY, midX, midY };
    };
    const drawRibbon = (i: number, dim: boolean) => {
      const r = ribbon(i);
      ctx.strokeStyle = RIBBONS[i];
      ctx.globalAlpha = dim ? 0.75 : 1;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, top + 8);
      ctx.quadraticCurveTo(r.midX, r.midY, r.endX, r.endY);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    // Ribbons going round behind the pole first, then the pole, then those in front.
    for (let i = 0; i < RIBBONS.length; i++) if (ribbon(i).behind) drawRibbon(i, true);
    box(ctx, x - 6, top, 12, this.depth - top + 2, 6, '#f7f3ea');
    ctx.fillStyle = '#e8d9c4';
    for (let y = top + 30; y < this.depth - 10; y += 46) ctx.fillRect(x - 6, y, 12, 6);
    for (let i = 0; i < RIBBONS.length; i++) if (!ribbon(i).behind) drawRibbon(i, false);
    // The crown of flowers on top.
    ctx.fillStyle = '#7cc164';
    ctx.beginPath();
    ctx.ellipse(x, top + 4, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const [dx, dy, c] of [
      [-16, 2, '#f39ab6'],
      [-6, -4, '#ffffff'],
      [6, -4, '#f6d86b'],
      [16, 2, '#b39ddb'],
      [0, 6, '#f7c6d6'],
    ] as const) {
      dot(ctx, x + dx, top + dy, 6, c);
      dot(ctx, x + dx, top + dy, 2.2, '#f2c14e');
    }
  }
}
