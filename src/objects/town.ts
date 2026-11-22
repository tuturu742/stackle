import { GROUND_Y } from '../config';
import type { Perch } from './perch';

// The winter town's backdrop: rows of snowy roofs and pines far off, a snow bank
// along the ground in place of the farm's fence, street lamps and pine trees.

const SNOW = '#f6f9fd';
const SNOW_SHADE = '#dce7f3';

/** A steady pseudo-random number from 0 to 1 for each whole number, so the town never changes. */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

interface Row {
  parallax: number;
  /** Width of each plot along the row. */
  cell: number;
  /** Tallest a building reaches above the ground. */
  tall: number;
  body: string;
  roof: string;
  window: string;
  snow: string;
}

const ROWS: Row[] = [
  { parallax: 0.3, cell: 190, tall: 380, body: '#c9d7ea', roof: '#b9c9e0', window: '#dbe5f2', snow: '#eef3fa' },
  { parallax: 0.6, cell: 240, tall: 250, body: '#b3c5df', roof: '#a1b5d4', window: '#d3def0', snow: '#f3f7fc' },
];

/** Far-off snowy roofs and pines, in two rows that scroll slower than the ground. */
export function drawTown(ctx: CanvasRenderingContext2D, left: number, right: number, travelled: number): void {
  for (const row of ROWS) drawRow(ctx, left, right, travelled * row.parallax, row);
}

function drawRow(ctx: CanvasRenderingContext2D, left: number, right: number, shift: number, row: Row): void {
  // Plot n covers u from n*cell up, where u = x - left + shift: measured from the
  // distance travelled, so the town never jumps where the world loops.
  const first = Math.floor(shift / row.cell) - 1;
  const last = Math.floor((right - left + shift) / row.cell) + 1;
  for (let n = first; n <= last; n++) {
    const x = n * row.cell + left - shift;
    const r = hash(n + row.cell);
    const w = row.cell * (0.6 + 0.3 * hash(n * 3 + 1));
    const cx = x + row.cell / 2;
    if (r < 0.25) pineShape(ctx, cx, row.tall * (0.55 + 0.3 * hash(n * 5)), row.roof, row.snow);
    else house(ctx, cx, w, row.tall * (0.5 + 0.45 * hash(n * 7 + 2)), r > 0.7, row);
  }
}

function house(ctx: CanvasRenderingContext2D, cx: number, w: number, h: number, chimney: boolean, row: Row): void {
  const roofH = w * 0.38;
  const wallTop = GROUND_Y - h + roofH;
  if (chimney) {
    ctx.fillStyle = row.roof;
    ctx.fillRect(cx + w * 0.18, wallTop - roofH * 0.95, w * 0.12, roofH * 0.7);
    ctx.fillStyle = row.snow;
    ctx.beginPath();
    ctx.roundRect(cx + w * 0.16, wallTop - roofH * 0.98, w * 0.16, 7, 4);
    ctx.fill();
  }
  ctx.fillStyle = row.body;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, wallTop, w, GROUND_Y - wallTop + 2, [6, 6, 0, 0]);
  ctx.fill();
  // Roof, with snow lying thick on it.
  ctx.fillStyle = row.roof;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - 8, wallTop + 4);
  ctx.lineTo(cx, wallTop - roofH);
  ctx.lineTo(cx + w / 2 + 8, wallTop + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = row.snow;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - 8, wallTop + 2);
  ctx.lineTo(cx, wallTop - roofH - 4);
  ctx.lineTo(cx + w / 2 + 8, wallTop + 2);
  ctx.quadraticCurveTo(cx + w / 4, wallTop - roofH * 0.25, cx, wallTop - roofH * 0.55);
  ctx.quadraticCurveTo(cx - w / 4, wallTop - roofH * 0.25, cx - w / 2 - 8, wallTop + 2);
  ctx.fill();
  // A few soft windows.
  ctx.fillStyle = row.window;
  const rows = Math.max(1, Math.floor((GROUND_Y - wallTop - 20) / 44));
  for (let i = 0; i < rows; i++) {
    for (const k of [-0.22, 0.22]) {
      ctx.beginPath();
      ctx.roundRect(cx + k * w - 8, wallTop + 16 + i * 44, 16, 20, 5);
      ctx.fill();
    }
  }
}

function pineShape(ctx: CanvasRenderingContext2D, cx: number, h: number, color: string, snow: string): void {
  const tiers = 3;
  for (let i = 0; i < tiers; i++) {
    const base = GROUND_Y - h * 0.12 - (i * h * 0.8) / tiers;
    const w = h * (0.5 - i * 0.11);
    const top = base - h * 0.42;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, base);
    ctx.lineTo(cx, top);
    ctx.lineTo(cx + w / 2, base);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = snow;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.16, top + h * 0.14);
    ctx.lineTo(cx, top);
    ctx.lineTo(cx + w * 0.16, top + h * 0.14);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.fillRect(cx - 5, GROUND_Y - h * 0.14, 10, h * 0.14 + 2);
}

/**
 * A soft, wavy bank of snow along the back of the ground. Its waves repeat every
 * 256 world units, which goes evenly into the world's width, so it meets itself
 * where the world loops.
 */
export function drawSnowBank(ctx: CanvasRenderingContext2D, left: number, right: number): void {
  const edge = (x: number) =>
    GROUND_Y - 14 - 7 * Math.sin((x * Math.PI * 2) / 256) - 4 * Math.sin((x * Math.PI * 2) / 128 + 1.3);
  const start = Math.floor(left / 16) * 16;
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.moveTo(start, GROUND_Y + 14);
  for (let x = start; x <= right + 16; x += 16) ctx.lineTo(x, edge(x));
  ctx.lineTo(right + 16, GROUND_Y + 14);
  ctx.closePath();
  ctx.fill();
  // A pale blue shadow along its foot.
  ctx.fillStyle = SNOW_SHADE;
  ctx.beginPath();
  ctx.moveTo(start, GROUND_Y + 14);
  for (let x = start; x <= right + 16; x += 16) ctx.lineTo(x, GROUND_Y + 6 + 3 * Math.sin((x * Math.PI * 2) / 128));
  ctx.lineTo(right + 16, GROUND_Y + 18);
  ctx.lineTo(start, GROUND_Y + 18);
  ctx.closePath();
  ctx.fill();
}

const LAMP_HEIGHT = 260;

/** An old-fashioned street lamp. A tap switches it on or off; lit, it glows at night. */
export class StreetLamp {
  readonly depth = GROUND_Y - 1;
  on = true;
  /** Eases toward on (1) or off (0), so it never flicks. */
  private bright = 1;

  constructor(readonly x: number) {}

  private get headY(): number {
    return GROUND_Y - LAMP_HEIGHT;
  }

  hits(px: number, py: number, slop: number): boolean {
    const nearHead = Math.abs(px - this.x) <= 26 + slop && py >= this.headY - 30 - slop && py <= this.headY + 50 + slop;
    const nearPost = Math.abs(px - this.x) <= 10 + slop && py >= this.headY && py <= GROUND_Y + slop;
    return nearHead || nearPost;
  }

  /** Returns whether it is now on. */
  toggle(): boolean {
    this.on = !this.on;
    return this.on;
  }

  update(dt: number): void {
    const target = this.on ? 1 : 0;
    this.bright += (target - this.bright) * Math.min(1, dt * 6);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const top = this.headY;
    ctx.fillStyle = '#4b4f58';
    // Base, post and the arm the lantern hangs from.
    ctx.beginPath();
    ctx.roundRect(x - 16, GROUND_Y - 34, 32, 36, [10, 10, 2, 2]);
    ctx.fill();
    ctx.fillRect(x - 5, top + 10, 10, LAMP_HEIGHT - 40);
    ctx.beginPath();
    ctx.roundRect(x - 12, top + 4, 24, 12, 4);
    ctx.fill();
    // The lantern head: a cap, glass panes, and a little finial.
    ctx.fillStyle = this.bright > 0.5 ? '#fff3c4' : '#cfd8e6';
    ctx.beginPath();
    ctx.roundRect(x - 18, top - 36, 36, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#4b4f58';
    ctx.fillRect(x - 2, top - 36, 4, 40);
    ctx.beginPath();
    ctx.moveTo(x - 26, top - 34);
    ctx.lineTo(x, top - 54);
    ctx.lineTo(x + 26, top - 34);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, top - 58, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = SNOW;
    ctx.beginPath();
    ctx.moveTo(x - 24, top - 36);
    ctx.lineTo(x, top - 53);
    ctx.lineTo(x + 24, top - 36);
    ctx.quadraticCurveTo(x, top - 42, x - 24, top - 36);
    ctx.fill();
    // A red bow tied round the post.
    ctx.fillStyle = '#e8665c';
    ctx.beginPath();
    ctx.ellipse(x - 10, top + 60, 10, 6, -0.4, 0, Math.PI * 2);
    ctx.ellipse(x + 10, top + 60, 10, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, top + 60, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  /** At night, a lit lamp pools warm light round its head and onto the snow below. */
  drawGlow(ctx: CanvasRenderingContext2D, night: number): void {
    const k = night * this.bright;
    if (k <= 0.01) return;
    const x = this.x;
    const cy = this.headY - 16;
    const glow = ctx.createRadialGradient(x, cy, 6, x, cy, 120);
    glow.addColorStop(0, `rgba(255, 236, 170, ${0.6 * k})`);
    glow.addColorStop(1, 'rgba(255, 236, 170, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, cy, 120, 0, Math.PI * 2);
    ctx.fill();
    // A soft pool of light on the snow.
    const pool = ctx.createRadialGradient(x, GROUND_Y + 10, 4, x, GROUND_Y + 10, 110);
    pool.addColorStop(0, `rgba(255, 236, 170, ${0.3 * k})`);
    pool.addColorStop(1, 'rgba(255, 236, 170, 0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(x, GROUND_Y + 10, 110, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = k;
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.roundRect(x - 16, cy - 18, 32, 36, 5);
    ctx.fill();
    ctx.fillStyle = '#4b4f58';
    ctx.fillRect(x - 2, cy - 18, 4, 36);
    ctx.globalAlpha = 1;
  }
}

/** Bulb colours for the strings of lights: rich, so a lit bulb never looks washed out. */
const BULBS = ['#e2453a', '#f2ad16', '#45a845', '#3d7fe0', '#e5579a'];

/** A bulb on a string, `size` times the street lamps' small one: lit in its colour, or grey glass. */
function bulb(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, lit: boolean, size = 1): void {
  ctx.fillStyle = '#4b4f58';
  ctx.fillRect(x - 2 * size, y - 7 * size, 4 * size, 4 * size);
  ctx.fillStyle = lit ? color : '#b4bcc6';
  ctx.beginPath();
  ctx.ellipse(x, y, 4.5 * size, 6.5 * size, 0, 0, Math.PI * 2);
  ctx.fill();
  // A little shine on the glass.
  ctx.fillStyle = lit ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x - 1.5 * size, y - 2 * size, 1.4 * size, 2.2 * size, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function bulbGlow(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, strength: number, size = 1): void {
  const r = 26 * size;
  const glow = ctx.createRadialGradient(x, y, 1, x, y, r);
  glow.addColorStop(0, color);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = strength;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Bulbs on each swag of a pine's string of lights, and how big they are. */
const PINE_BULBS = 4;
const PINE_BULB_SIZE = 1.5;

/**
 * A snowy pine. A tap shakes it, and a little snow puffs off its branches; a
 * tree dressed with a string of lights switches them on or off instead.
 * Anything put on its branches stays there, decorations hanging (a perch, with
 * a seat per spot, and one at the tip for a star).
 */
export class Pine implements Perch {
  readonly depth = GROUND_Y - 1;
  readonly height: number;
  /** 1 just shaken, easing back to 0. */
  private shake = 0;
  /** Its string of lights, if it has one, and whether they are on. */
  lightsOn = true;
  private readonly spots: { dx: number; dy: number }[];

  constructor(
    readonly x: number,
    readonly seed: number,
    readonly garland = false,
    height?: number,
  ) {
    this.height = height ?? 290 + 140 * hash(seed * 13 + 5);
    const h = this.height;
    // Spots along the lower edge of each tier, fewer further up, and the tip.
    this.spots = [];
    // Bigger trees have room for more. Each tier's spots sit between the ones below.
    const per = this.height > 380 ? [4, 3, 2, 1] : [3, 2, 2, 1];
    per.forEach((n, i) => {
      const base = -h * 0.12 - (i * h * 0.78) / 4;
      const w = this.width * (1 - i * 0.2);
      for (let k = 0; k < n; k++) {
        const along = n === 1 ? (i % 2 ? 0.14 : -0.14) : (k / (n - 1) - 0.5) * 0.7;
        this.spots.push({ dx: along * w, dy: base + 4 });
      }
    });
    this.spots.push({ dx: 0, dy: -h * 0.12 - (3 * h * 0.78) / 4 - h * 0.3 });
  }

  get seatCount(): number {
    return this.spots.length;
  }

  seatX(i: number): number {
    return this.x + this.spots[i].dx;
  }

  /** Things hang from the branch: their bottom a little below it. The tip has room for a star. */
  seatTop(i: number): number {
    return GROUND_Y + this.spots[i].dy + (i === this.spots.length - 1 ? 8 : 22);
  }

  seatReach(): number {
    return 40;
  }

  catches(i: number, x: number, bottom: number): boolean {
    return Math.hypot(x - this.seatX(i), bottom - this.seatTop(i)) < 50;
  }

  toggleLights(): boolean {
    this.lightsOn = !this.lightsOn;
    return this.lightsOn;
  }

  /** The bulbs on its string of lights: three swags across the tree, a few big bulbs on each. */
  private bulbs(): { x: number; y: number; color: string }[] {
    if (!this.garland) return [];
    const h = this.height;
    const out: { x: number; y: number; color: string }[] = [];
    for (const [i, from, to] of [
      [0.5, -0.4, 0.38],
      [1.6, 0.34, -0.3],
      [2.6, -0.22, 0.2],
    ]) {
      const y0 = -h * 0.12 - (i * h * 0.78) / 4;
      const w = this.width * (1 - i * 0.2);
      for (let k = 0; k < PINE_BULBS; k++) {
        const t = k / (PINE_BULBS - 1);
        out.push({
          x: this.x + (from + (to - from) * t) * w,
          y: GROUND_Y + y0 + Math.sin(t * Math.PI) * 16 - (to - from) * t * 20,
          color: BULBS[(k + Math.round(i * 2)) % BULBS.length],
        });
      }
    }
    return out;
  }

  private get width(): number {
    return this.height * 0.62;
  }

  hits(px: number, py: number, slop: number): boolean {
    const w = this.width / 2;
    if (py > GROUND_Y + slop || py < GROUND_Y - this.height - slop) return false;
    // Narrower toward the tip.
    const k = (GROUND_Y - py) / this.height;
    return Math.abs(px - this.x) <= w * (1 - k * 0.8) + slop;
  }

  tap(): boolean {
    this.shake = 1;
    return true;
  }

  update(dt: number): void {
    this.shake = Math.max(0, this.shake - dt * 1.2);
  }

  /** Its lights glow softly at night while they are on. */
  drawGlow(ctx: CanvasRenderingContext2D, night: number): void {
    if (night <= 0 || !this.lightsOn) return;
    for (const b of this.bulbs()) {
      bulbGlow(ctx, b.x, b.y, b.color, 0.7 * night, PINE_BULB_SIZE);
      // The bulb itself shines clear over the dark.
      ctx.globalAlpha = night;
      bulb(ctx, b.x, b.y, b.color, true, PINE_BULB_SIZE);
      ctx.globalAlpha = 1;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const h = this.height;
    const x = this.x;
    const angle = Math.sin((1 - this.shake) * 22) * this.shake * 0.04;
    ctx.save();
    ctx.translate(x, GROUND_Y);
    ctx.rotate(angle);
    ctx.fillStyle = '#8d6e5a';
    ctx.beginPath();
    ctx.roundRect(-10, -h * 0.16, 20, h * 0.16 + 4, 4);
    ctx.fill();
    const tiers = 4;
    for (let i = 0; i < tiers; i++) {
      const base = -h * 0.12 - (i * h * 0.78) / tiers;
      const w = this.width * (1 - i * 0.2);
      const tip = base - h * 0.34;
      ctx.fillStyle = i % 2 ? '#4f8f73' : '#5a9a7c';
      ctx.beginPath();
      ctx.moveTo(-w / 2, base);
      ctx.quadraticCurveTo(0, base + 12, w / 2, base);
      ctx.lineTo(0, tip);
      ctx.closePath();
      ctx.fill();
      // Snow lying along the tier's lower edge and on its tip.
      ctx.fillStyle = SNOW;
      ctx.beginPath();
      ctx.moveTo(-w / 2, base);
      ctx.quadraticCurveTo(0, base + 12, w / 2, base);
      ctx.quadraticCurveTo(w * 0.28, base - 6, w * 0.12, base + 1);
      ctx.quadraticCurveTo(0, base - 8, -w * 0.14, base + 1);
      ctx.quadraticCurveTo(-w * 0.3, base - 6, -w / 2, base);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-w * 0.12, tip + h * 0.09);
      ctx.lineTo(0, tip);
      ctx.lineTo(w * 0.12, tip + h * 0.09);
      ctx.quadraticCurveTo(0, tip + h * 0.06, -w * 0.12, tip + h * 0.09);
      ctx.fill();
    }
    ctx.restore();
    if (this.garland) {
      ctx.strokeStyle = '#3f6e57';
      ctx.lineWidth = 2;
      const bulbs = this.bulbs();
      ctx.beginPath();
      bulbs.forEach((b, i) => (i % PINE_BULBS === 0 ? ctx.moveTo(b.x, b.y - 8) : ctx.lineTo(b.x, b.y - 8)));
      ctx.stroke();
      for (const b of bulbs) bulb(ctx, b.x, b.y, b.color, this.lightsOn, PINE_BULB_SIZE);
    }
    // Snow puffing off the branches after a shake, drifting down.
    if (this.shake > 0) {
      const t = 1 - this.shake;
      ctx.fillStyle = SNOW;
      ctx.globalAlpha = this.shake;
      for (let i = 0; i < 9; i++) {
        const sx = x + (hash(i + this.seed * 9) - 0.5) * this.width * 0.9;
        const sy = GROUND_Y - h * (0.25 + 0.6 * hash(i * 3 + this.seed)) + t * 120;
        ctx.beginPath();
        ctx.arc(sx + Math.sin(t * 6 + i) * 6, sy, 4 + (i % 3) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
}

/** How big a string's bulbs are, and how far apart. */
const STRING_BULB_SIZE = 1.8;
const STRING_BULB_GAP = 64;

/**
 * A long string of big lights between two tall candy-cane posts, as over the rink.
 * Each bulb is on or off, never dimmed or blinking: a tap on a bulb switches that
 * bulb, a tap on a post switches the whole string.
 */
export class LightString {
  readonly depth = GROUND_Y - 1;
  /** Each bulb: switched on or not. */
  readonly on: boolean[];
  private readonly count: number;

  constructor(
    readonly x: number,
    readonly width: number,
  ) {
    this.count = Math.max(8, Math.round(width / STRING_BULB_GAP));
    this.on = Array.from({ length: this.count }, () => true);
  }

  private get top(): number {
    return GROUND_Y - 430;
  }

  private sag(t: number): number {
    return this.top + 14 + Math.sin(t * Math.PI) * 80;
  }

  private bulbAt(i: number): { x: number; y: number; color: string } {
    const t = i / (this.count - 1);
    return { x: this.x - this.width / 2 + t * this.width, y: this.sag(t), color: BULBS[i % BULBS.length] };
  }

  hits(px: number, py: number, slop: number): boolean {
    const left = this.x - this.width / 2;
    const right = this.x + this.width / 2;
    for (const postX of [left, right]) if (Math.abs(px - postX) < 14 + slop && py > this.top - 24 - slop && py < GROUND_Y) return true;
    if (px < left || px > right) return false;
    return Math.abs(py - this.sag((px - left) / this.width)) < 20 + slop;
  }

  /** A bulb under the finger switches alone; a post switches them all (on, unless all were on). */
  tap(px: number, py: number): boolean {
    let near = -1;
    let best = 36;
    for (let i = 0; i < this.count; i++) {
      const b = this.bulbAt(i);
      const d = Math.hypot(px - b.x, py - b.y);
      if (d < best) {
        best = d;
        near = i;
      }
    }
    if (near >= 0) {
      this.on[near] = !this.on[near];
      return this.on[near];
    }
    const all = !this.on.every(Boolean);
    this.on.fill(all);
    return all;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const left = this.x - this.width / 2;
    const right = this.x + this.width / 2;
    for (const postX of [left, right]) {
      // Striped posts, like candy canes, with a snowy cap.
      ctx.fillStyle = '#f6efe0';
      ctx.beginPath();
      ctx.roundRect(postX - 10, this.top - 20, 20, GROUND_Y - this.top + 22, 10);
      ctx.fill();
      ctx.fillStyle = '#e8665c';
      for (let y = this.top - 10; y < GROUND_Y - 10; y += 40) ctx.fillRect(postX - 10, y, 20, 14);
      ctx.fillStyle = SNOW;
      ctx.beginPath();
      ctx.arc(postX, this.top - 24, 15, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#4b4f58';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < this.count; i++) {
      const b = this.bulbAt(i);
      if (i === 0) ctx.moveTo(b.x, b.y - 9);
      else ctx.lineTo(b.x, b.y - 9);
    }
    ctx.stroke();
    for (let i = 0; i < this.count; i++) {
      const b = this.bulbAt(i);
      bulb(ctx, b.x, b.y, b.color, this.on[i], STRING_BULB_SIZE);
    }
  }

  drawGlow(ctx: CanvasRenderingContext2D, night: number): void {
    if (night <= 0) return;
    for (let i = 0; i < this.count; i++) {
      if (!this.on[i]) continue;
      const b = this.bulbAt(i);
      bulbGlow(ctx, b.x, b.y, b.color, 0.8 * night, STRING_BULB_SIZE);
      // The bulb itself shines clear over the dark.
      ctx.globalAlpha = night;
      bulb(ctx, b.x, b.y, b.color, true, STRING_BULB_SIZE);
      ctx.globalAlpha = 1;
    }
  }
}
