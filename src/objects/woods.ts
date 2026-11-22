import { GROUND_Y } from '../config';
import { FENCE_TOP } from './decor';
import { settings } from '../settings';
import type { Item, ItemKind } from './item';
import { Offer, type Offered } from './offer';
import type { Perch } from './perch';

// The autumn wood: being deep in a forest, with trees standing behind and
// behind again in the mist, ferns and bracken along the back of the ground, a
// mossy forest floor with fallen leaves, and a woodpile to set things on.

/** A steady pseudo-random number from 0 to 1 for each whole number, so the wood never changes. */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

interface Layer {
  parallax: number;
  /** Width of each tree's plot along the layer. */
  cell: number;
  /** How far up the crowns reach above the ground (their middles), from low to high. */
  crownLow: number;
  crownHigh: number;
  /** Crown radius. */
  radius: number;
  trunkWidth: number;
  crowns: string[];
  trunk: string;
  pine: string;
}

const LAYERS: Layer[] = [
  // Far off in the mist: pale trees close together.
  {
    parallax: 0.2,
    cell: 70,
    crownLow: 260,
    crownHigh: 330,
    radius: 46,
    trunkWidth: 9,
    crowns: ['#efcfa8', '#ebc39b', '#e9cfaa'],
    trunk: '#dcc0a2',
    pine: '#d6c5a4',
  },
  // The middle of the wood: amber and rust crowns on brown trunks.
  {
    parallax: 0.45,
    cell: 120,
    crownLow: 300,
    crownHigh: 400,
    radius: 70,
    trunkWidth: 16,
    crowns: ['#e09a4a', '#d27a45', '#e6b057', '#c9764a'],
    trunk: '#a07a5a',
    pine: '#8f8a62',
  },
];

/** The nearest trees: tall dark trunks rising out of the top of the screen, their crowns overhead. */
const NEAR = { parallax: 0.75, cell: 300, trunk: '#7d5d46', crowns: ['#c96a3c', '#d98a3e', '#b9603d'] };

/** Leaf colours lying on the ground. */
const LEAVES = ['#e8873a', '#d9603b', '#f2b544', '#b9773f', '#e4a03c'];

/**
 * Inside the autumn wood: three layers of trees that scroll slower than the
 * ground, the furthest pale in the mist, the nearest tall trunks reaching up
 * past the top of the screen with their crowns overhead.
 */
export function drawWoods(ctx: CanvasRenderingContext2D, left: number, right: number, travelled: number): void {
  drawLayer(ctx, left, right, travelled * LAYERS[0].parallax, LAYERS[0]);
  mist(ctx, left, right, 0.75);
  drawLayer(ctx, left, right, travelled * LAYERS[1].parallax, LAYERS[1]);
  mist(ctx, left, right, 0.45);
  drawNear(ctx, left, right, travelled * NEAR.parallax);
}

/** A soft pale mist lying low among the trees. */
function mist(ctx: CanvasRenderingContext2D, left: number, right: number, strength: number): void {
  const g = ctx.createLinearGradient(0, GROUND_Y - 200, 0, GROUND_Y);
  g.addColorStop(0, 'rgba(251, 238, 221, 0)');
  g.addColorStop(0.7, `rgba(251, 238, 221, ${strength * 0.8})`);
  g.addColorStop(1, `rgba(251, 238, 221, ${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(left, GROUND_Y - 200, right - left, 202);
}

/** Plot n covers u from n*cell up, where u = x - left + shift: measured from the distance travelled, so the wood never jumps where the world loops. */
function plots(left: number, right: number, shift: number, cell: number, each: (n: number, x0: number) => void): void {
  const first = Math.floor(shift / cell) - 2;
  const last = Math.floor((right - left + shift) / cell) + 2;
  for (let n = first; n <= last; n++) each(n, n * cell + left - shift);
}

function drawLayer(ctx: CanvasRenderingContext2D, left: number, right: number, shift: number, layer: Layer): void {
  plots(left, right, shift, layer.cell, (n, x0) => {
    const seed = n * 17 + layer.cell;
    const cx = x0 + layer.cell * (0.25 + 0.5 * hash(seed));
    const up = layer.crownLow + (layer.crownHigh - layer.crownLow) * hash(seed + 1);
    if (hash(seed + 2) < 0.18) return pine(ctx, cx, up + layer.radius, layer.pine);
    const r = layer.radius * (0.8 + 0.35 * hash(seed + 3));
    const cy = GROUND_Y - up;
    ctx.fillStyle = layer.trunk;
    ctx.beginPath();
    ctx.roundRect(cx - layer.trunkWidth / 2, cy, layer.trunkWidth, up + 2, layer.trunkWidth / 3);
    ctx.fill();
    crown(ctx, cx, cy, r, layer.crowns[Math.floor(hash(seed + 4) * layer.crowns.length)]);
  });
}

/** A plain round crown in one soft colour, with one gentle light on its upper side. */
function crown(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const [dx, dy, k] of [
    [0, 0, 1],
    [-0.62, 0.3, 0.7],
    [0.62, 0.28, 0.72],
  ]) {
    ctx.moveTo(cx + dx * r + k * r, cy + dy * r);
    ctx.arc(cx + dx * r, cy + dy * r, k * r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 240, 210, 0.18)';
  ctx.beginPath();
  ctx.arc(cx - r * 0.25, cy - r * 0.3, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

/** A pine between the round trees: three stacked tiers on a short trunk. */
function pine(ctx: CanvasRenderingContext2D, cx: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(cx - 4, GROUND_Y - h * 0.14, 8, h * 0.14 + 2);
  for (let i = 0; i < 3; i++) {
    const base = GROUND_Y - h * 0.1 - i * h * 0.28;
    const w = h * (0.42 - i * 0.1);
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, base);
    ctx.quadraticCurveTo(cx, base + 8, cx + w / 2, base);
    ctx.lineTo(cx, base - h * 0.4);
    ctx.closePath();
    ctx.fill();
  }
}

/** The nearest trees: wide trunks from above the top of the screen down to the ground, a big crown overhead. */
function drawNear(ctx: CanvasRenderingContext2D, left: number, right: number, shift: number): void {
  plots(left, right, shift, NEAR.cell, (n, x0) => {
    const seed = n * 23 + 5;
    if (hash(seed) < 0.3) return;
    const cx = x0 + NEAR.cell * (0.2 + 0.6 * hash(seed + 1));
    const w = 30 + 14 * hash(seed + 2);
    ctx.fillStyle = NEAR.trunk;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, -20);
    ctx.lineTo(cx - w * 0.55, GROUND_Y - 30);
    ctx.quadraticCurveTo(cx - w * 0.9, GROUND_Y + 2, cx - w, GROUND_Y + 2);
    ctx.lineTo(cx + w, GROUND_Y + 2);
    ctx.quadraticCurveTo(cx + w * 0.9, GROUND_Y + 2, cx + w * 0.55, GROUND_Y - 30);
    ctx.lineTo(cx + w / 2, -20);
    ctx.closePath();
    ctx.fill();
    // A soft light down one side of the bark.
    ctx.fillStyle = 'rgba(255, 230, 200, 0.12)';
    ctx.fillRect(cx - w * 0.35, -20, w * 0.18, GROUND_Y - 30);
    crown(ctx, cx + (hash(seed + 3) - 0.5) * 60, -30 + 30 * hash(seed + 4), 110 + 30 * hash(seed + 5), NEAR.crowns[Math.floor(hash(seed + 6) * NEAR.crowns.length)]);
  });
}

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

/** Each course of the wall: its stones' middle line, their width along it and their height. */
const COURSES = [
  { y: GROUND_Y - 9, cell: 40, rx: 19, ry: 10 },
  { y: GROUND_Y - 25, cell: 36, rx: 17, ry: 9 },
  { y: GROUND_Y - 39, cell: 30, rx: 14, ry: 8 },
];

/**
 * A low dry-stone wall along the back of the ground, in place of the fence:
 * rounded stones in three courses, moss on some, drifts of fallen leaves at its
 * foot. Every stone is fixed to its place along the world, so it scrolls seamlessly.
 */
export function drawStoneWall(ctx: CanvasRenderingContext2D, left: number, right: number): void {
  // The wall's dark core, showing in the gaps between stones.
  ctx.fillStyle = '#8a7d6c';
  ctx.beginPath();
  ctx.roundRect(left - 10, FENCE_TOP + 4, right - left + 20, GROUND_Y - FENCE_TOP - 2, 8);
  ctx.fill();
  COURSES.forEach((c, row) => {
    const offset = row * 13;
    const first = Math.floor((left - offset) / c.cell) - 1;
    const last = Math.floor((right - offset) / c.cell) + 1;
    for (let n = first; n <= last; n++) {
      const seed = n * 3 + row * 1000;
      const x = n * c.cell + offset + c.cell / 2 + (hash(seed) - 0.5) * 6;
      const y = c.y + (hash(seed + 1) - 0.5) * 3;
      const rx = c.rx * (0.85 + 0.25 * hash(seed + 2));
      const shade = hash(seed + 4);
      ctx.fillStyle = shade < 0.33 ? '#a89c8a' : shade < 0.66 ? '#b5a995' : '#9d917f';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, c.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 250, 240, 0.18)';
      ctx.beginPath();
      ctx.ellipse(x - rx * 0.25, y - c.ry * 0.35, rx * 0.45, c.ry * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      // Moss on the top of some stones in the top course.
      if (row === 2 && hash(seed + 5) < 0.3) {
        ctx.fillStyle = '#8aa35a';
        ctx.beginPath();
        ctx.ellipse(x, y - c.ry * 0.6, rx * 0.7, 4, 0, Math.PI, Math.PI * 2);
        ctx.fill();
      }
    }
  });
  // Drifts of fallen leaves banked against its foot.
  const cell = 22;
  for (let n = Math.floor(left / cell) - 1; n <= Math.floor(right / cell) + 1; n++) {
    if (hash(n * 5 + 77) < 0.45) continue;
    const x = n * cell + hash(n * 5 + 78) * cell;
    leaf(ctx, x, GROUND_Y - 2 - hash(n * 5 + 79) * 6, 7, hash(n * 5 + 80) * 6, LEAVES[Math.floor(hash(n * 5 + 81) * LEAVES.length)]);
  }
}

/** The forest floor: a few soft patches of moss and fallen leaves, about forty a screen, each fixed to its spot. */
export function drawLeafLitter(ctx: CanvasRenderingContext2D, left: number, right: number): void {
  const mossCell = 340;
  for (let n = Math.floor(left / mossCell) - 1; n <= Math.floor(right / mossCell) + 1; n++) {
    const x = n * mossCell + hash(n * 3 + 40) * mossCell;
    const y = GROUND_Y + 30 + hash(n * 3 + 41) * 110;
    ctx.fillStyle = 'rgba(138, 163, 90, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y, 60 + 40 * hash(n * 3 + 42), 12 + 6 * hash(n * 3 + 43), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const cell = 28;
  for (let n = Math.floor(left / cell) - 1; n <= Math.floor(right / cell) + 1; n++) {
    const x = n * cell + hash(n * 7 + 1) * cell;
    const y = GROUND_Y + 8 + hash(n * 7 + 2) * 152;
    const size = 5 + hash(n * 7 + 3) * 3;
    ctx.globalAlpha = 0.85;
    leaf(ctx, x, y, size, hash(n * 7 + 4) * Math.PI * 2, LEAVES[Math.floor(hash(n * 7 + 5) * LEAVES.length)]);
  }
  ctx.globalAlpha = 1;
}

/** Fern and bracken colours, and the small shrubs'. */
const FERNS = ['#c9763f', '#8aa35a', '#b5853f', '#7f9a55'];
const SHRUBS = ['#9aab62', '#c48a4a', '#a8b06a'];

/**
 * Along the back of the ground, in place of a fence: ferns and bracken, small
 * round shrubs, and now and then a mossy stump or a fallen log. Every plant is
 * fixed to its place along the world, so it scrolls seamlessly.
 */
export function drawUndergrowth(ctx: CanvasRenderingContext2D, left: number, right: number): void {
  const cell = 60;
  for (let n = Math.floor(left / cell) - 1; n <= Math.floor(right / cell) + 1; n++) {
    const seed = n * 13 + 500;
    const x = n * cell + cell * (0.2 + 0.6 * hash(seed));
    const kind = hash(seed + 1);
    if (kind < 0.08) stump(ctx, x, seed);
    else if (kind < 0.14) fallenLog(ctx, x);
    else if (kind < 0.42) shrub(ctx, x, 22 + 12 * hash(seed + 2), SHRUBS[Math.floor(hash(seed + 3) * SHRUBS.length)]);
    else fern(ctx, x, 30 + 16 * hash(seed + 4), FERNS[Math.floor(hash(seed + 5) * FERNS.length)], hash(seed + 6));
  }
}

/** A fern: a fan of arching fronds, each a long leaf. */
function fern(ctx: CanvasRenderingContext2D, x: number, h: number, color: string, tilt: number): void {
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k - 2) * 0.42 + (tilt - 0.5) * 0.2;
    const tipX = x + Math.cos(a) * h;
    const tipY = GROUND_Y + Math.sin(a) * h;
    ctx.save();
    ctx.translate((x + tipX) / 2, (GROUND_Y + tipY) / 2);
    ctx.rotate(a);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, h / 2, h * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** A small round shrub sitting on the ground. */
function shrub(ctx: CanvasRenderingContext2D, x: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, GROUND_Y - r * 0.6, r, Math.PI, Math.PI * 2);
  ctx.arc(x - r * 0.7, GROUND_Y - r * 0.2, r * 0.6, 0, Math.PI * 2);
  ctx.arc(x + r * 0.7, GROUND_Y - r * 0.2, r * 0.65, 0, Math.PI * 2);
  ctx.rect(x - r, GROUND_Y - r * 0.6, r * 2, r * 0.6);
  ctx.fill();
}

/** An old stump with rings on top and moss on one side. */
function stump(ctx: CanvasRenderingContext2D, x: number, seed: number): void {
  const h = 22 + 10 * hash(seed + 7);
  ctx.fillStyle = '#9a7354';
  ctx.beginPath();
  ctx.roundRect(x - 16, GROUND_Y - h, 32, h + 2, [4, 4, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#d9b48a';
  ctx.beginPath();
  ctx.ellipse(x, GROUND_Y - h, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8aa35a';
  ctx.beginPath();
  ctx.ellipse(x - 10, GROUND_Y - h * 0.4, 7, h * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** A fallen log lying along the back, mossy on top. */
function fallenLog(ctx: CanvasRenderingContext2D, x: number): void {
  ctx.fillStyle = '#9a7354';
  ctx.beginPath();
  ctx.roundRect(x - 44, GROUND_Y - 22, 88, 22, 11);
  ctx.fill();
  ctx.fillStyle = '#d9b48a';
  ctx.beginPath();
  ctx.ellipse(x + 40, GROUND_Y - 11, 6, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8aa35a';
  ctx.beginPath();
  ctx.ellipse(x - 6, GROUND_Y - 21, 26, 5, 0, Math.PI, Math.PI * 2);
  ctx.fill();
}

const LOG_R = 16;
/** Logs in each row of the pile, bottom first. */
const LOG_ROWS = [5, 4, 3];
/** The top of the pile above the ground line, where things can be set. */
const PILE_UP = LOG_ROWS.length * LOG_R * 2;

/** Where the next log to take lies, beside the pile on the ground. */
const LOG_DX = 175;

/**
 * A neat pile of cut logs with their ringed ends showing, under a little
 * lean-to roof. Two things can sit on top of the logs, and the next log of
 * firewood lies beside it to take (for the chopping block).
 */
export class Woodpile implements Perch {
  readonly depth = GROUND_Y + 14;
  readonly seatCount = 2;
  readonly offer = new Offer(['firewood']);

  constructor(readonly x: number) {}

  offerAt(px: number, py: number, slop: number): { dist: number } | null {
    return this.offer.at(px, py, this.x + LOG_DX, this.depth, slop);
  }

  offered(): Offered | null {
    return this.offer.ready ? { kind: this.offer.kind, x: this.x + LOG_DX, bottom: this.depth } : null;
  }

  take(): { kind: ItemKind; x: number; bottom: number } {
    return { kind: this.offer.take(), x: this.x + LOG_DX, bottom: this.depth };
  }

  /** Returns true as the next log arrives. */
  update(dt: number, canGive: boolean): boolean {
    return this.offer.update(dt, canGive);
  }

  seatX(i: number): number {
    return this.x + (i === 0 ? -LOG_R * 1.6 : LOG_R * 1.6);
  }

  seatTop(): number {
    return this.depth - PILE_UP;
  }

  seatReach(): number {
    return 40;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const g = this.depth;
    // The lean-to: two posts at the back and a roof sloping down to the front.
    ctx.fillStyle = '#7a523a';
    ctx.fillRect(x - 96, g - 196, 10, 196);
    ctx.fillRect(x + 86, g - 176, 10, 176);
    ctx.fillStyle = '#6c4f3a';
    ctx.beginPath();
    ctx.moveTo(x - 112, g - 206);
    ctx.lineTo(x + 112, g - 180);
    ctx.lineTo(x + 112, g - 168);
    ctx.lineTo(x - 112, g - 192);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8aa35a';
    ctx.beginPath();
    ctx.ellipse(x - 50, g - 200, 22, 5, 0.12, 0, Math.PI * 2);
    ctx.fill();
    // The logs, end-on: bark, pale cut wood, a ring and a heart.
    LOG_ROWS.forEach((count, row) => {
      const y = g - LOG_R - row * LOG_R * 1.85;
      for (let i = 0; i < count; i++) {
        const lx = x + (i - (count - 1) / 2) * LOG_R * 2.02;
        circle(ctx, lx, y, LOG_R, '#8a5f42');
        circle(ctx, lx, y, LOG_R - 4, '#e2c08f');
        ctx.strokeStyle = '#cfa673';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lx, y, LOG_R - 8, 0, Math.PI * 2);
        ctx.stroke();
        circle(ctx, lx, y, 2.5, '#b8875e');
      }
    });
    this.offer.draw(ctx, x + LOG_DX, g);
  }
}

/** Seconds per chop: the axe rises slowly and comes down. */
const CHOP_SECONDS = 0.8;
const BLOCK_UP = 56;
const BLOCK_R = 58;
/** The axe swings from where it is held, off to the right of the block. */
const AXE_LEN = 92;

/**
 * A wide round chopping block with an axe stuck in its side. A log of
 * firewood set on top is chopped (the game swaps it for kindling): while
 * `working` counts up, the axe rises and comes down on it in a calm rhythm and
 * chips fly. The swinging axe is drawn in front of the log (`drawFront`).
 */
export class ChoppingBlock implements Perch {
  readonly depth = GROUND_Y + 20;
  readonly frontDepth = this.depth + 0.2;
  readonly seatCount = 1;
  /** Seconds a log has sat on it, set by the game. */
  working = 0;

  constructor(readonly x: number) {}

  seatX(): number {
    return this.x;
  }

  seatTop(): number {
    return this.depth - BLOCK_UP;
  }

  seatReach(): number {
    return 50;
  }

  accepts(_i: number, bottom: Item): boolean {
    return bottom.kind === 'firewood';
  }

  /** Chops landed so far on the log sitting there: sound one each time this goes up. */
  get chops(): number {
    return Math.floor(this.working / CHOP_SECONDS);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const g = this.depth;
    const top = g - BLOCK_UP;
    // The stump: bark sides, a pale cut top with its rings.
    ctx.fillStyle = '#8a5f42';
    ctx.beginPath();
    ctx.roundRect(x - BLOCK_R, top, BLOCK_R * 2, BLOCK_UP, [8, 8, 14, 14]);
    ctx.fill();
    ctx.fillStyle = '#7a523a';
    for (const dx of [-34, -8, 22, 44]) ctx.fillRect(x + dx, top + 14, 5, BLOCK_UP - 22);
    ctx.fillStyle = '#e2c08f';
    ctx.beginPath();
    ctx.ellipse(x, top, BLOCK_R, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cfa673';
    ctx.lineWidth = 2;
    for (const r of [0.65, 0.35]) {
      ctx.beginPath();
      ctx.ellipse(x, top, BLOCK_R * r, 13 * r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Resting: the axe stuck in the block's top edge, handle up to the right.
    if (this.working <= 0) axe(ctx, x + 34, top + 2, -0.55);
  }

  /** The axe at work, rising and falling onto the log, with chips flying after each chop. */
  drawFront(ctx: CanvasRenderingContext2D): void {
    if (this.working <= 0) return;
    const x = this.x;
    const top = this.seatTop();
    const p = (this.working % CHOP_SECONDS) / CHOP_SECONDS;
    // Slow lift over most of the beat, a quick fall at the end; down (0) as each chop lands.
    const lift = p < 0.75 ? Math.sin((p / 0.75) * Math.PI * 0.5) : 1 - (p - 0.75) / 0.25;
    const swing = settings.reduceMotion ? 0.5 : 1.25;
    // Held at the right; the blade end swings from resting on the log up over the held end.
    const hx = x + AXE_LEN - 10;
    const hy = top - 30;
    const a = Math.PI + lift * swing;
    axe(ctx, hx + Math.cos(a) * AXE_LEN, hy + Math.sin(a) * AXE_LEN, a + Math.PI * 1.5, AXE_LEN, -1);
    if (this.chops < 1 || p > 0.45) return;
    // Two chips flick off either side and fade.
    const t = p / 0.45;
    const reach = settings.reduceMotion ? 0.5 : 1;
    ctx.fillStyle = '#e2c08f';
    ctx.globalAlpha = 1 - t;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(x + side * (20 + t * 50 * reach), top - 34 - Math.sin(t * Math.PI) * 36 * reach + t * 20);
      ctx.rotate(t * 6 * side);
      ctx.fillRect(-6, -3, 12, 6);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}

/**
 * An axe with its blade at (bx, by), turned by `angle` (0: handle straight up
 * from the blade). The blade faces left, or right with `side` -1.
 */
function axe(ctx: CanvasRenderingContext2D, bx: number, by: number, angle: number, len = 58, side = 1): void {
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(angle);
  ctx.scale(side, 1);
  ctx.fillStyle = '#c99f74';
  ctx.beginPath();
  ctx.roundRect(-3.5, -len, 7, len, 3.5);
  ctx.fill();
  ctx.fillStyle = '#9aa1ab';
  ctx.beginPath();
  ctx.moveTo(-3, -12);
  ctx.lineTo(-18, -6);
  ctx.quadraticCurveTo(-23, 6, -16, 14);
  ctx.lineTo(-3, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
