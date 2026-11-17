import { GROUND_Y } from '../config';

// Spring's backdrop: far-off pastel hills with copses of blossom trees and
// flowering orchards, a low flowering hedge along the back of the ground in
// place of the farm's fence, and clover and daisies dotted over the grass.

/** A steady pseudo-random number from 0 to 1 for each whole number, so the meadow never changes. */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const BLOSSOM = ['#f7c6d6', '#fbe3ea', '#f39ab6', '#fff6f8'];

interface Row {
  parallax: number;
  /** Width of each stretch along the row. */
  cell: number;
  /** How high the hills rise above the ground at most. */
  tall: number;
  hill: string;
  /** A paler strip along the hilltops, as if lit by the sun. */
  light: string;
  trunk: string;
  /** Blossom colours are mixed toward this, so the far row looks hazier. */
  haze: number;
}

const ROWS: Row[] = [
  { parallax: 0.3, cell: 190, tall: 250, hill: '#c6e6ac', light: '#d6eec1', trunk: '#b8a693', haze: 0.3 },
  { parallax: 0.6, cell: 230, tall: 150, hill: '#ade08f', light: '#bfe7a5', trunk: '#a88c74', haze: 0 },
];

/** Spring's far-off meadow: two rows of rolling hills with blossom copses, scrolling slower than the ground. */
export function drawMeadow(ctx: CanvasRenderingContext2D, left: number, right: number, travelled: number): void {
  for (const row of ROWS) drawRow(ctx, left, right, travelled * row.parallax, row);
}

function drawRow(ctx: CanvasRenderingContext2D, left: number, right: number, shift: number, row: Row): void {
  // Measured from the distance travelled, like the winter town, so the hills never jump where the world loops.
  const first = Math.floor(shift / row.cell) - 1;
  const last = Math.floor((right - left + shift) / row.cell) + 1;
  // Each stretch gets a hump of its own height; the outline eases between them.
  const top = (n: number) => GROUND_Y - row.tall * (0.45 + 0.55 * hash(n * 7 + row.cell));
  const at = (n: number) => n * row.cell + left - shift;
  ctx.fillStyle = row.hill;
  ctx.beginPath();
  ctx.moveTo(at(first), GROUND_Y + 2);
  ctx.lineTo(at(first), top(first));
  for (let n = first; n < last; n++) {
    const x0 = at(n) + row.cell / 2;
    const x1 = at(n + 1) + row.cell / 2;
    ctx.quadraticCurveTo(x0 + row.cell * 0.25, top(n) - 6, (x0 + x1) / 2, (top(n) + top(n + 1)) / 2);
  }
  ctx.lineTo(at(last), GROUND_Y + 2);
  ctx.closePath();
  ctx.fill();
  // A soft paler band of meadow just under the tops.
  ctx.fillStyle = row.light;
  for (let n = first; n <= last; n++) {
    const cx = at(n) + row.cell / 2;
    ctx.beginPath();
    ctx.ellipse(cx, top(n) + 26, row.cell * 0.32, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let n = first; n <= last; n++) {
    const cx = at(n) + row.cell / 2;
    const r = hash(n * 3 + row.cell);
    const y = top(n) + 18;
    if (r < 0.35) copse(ctx, cx - row.cell * 0.15, y, row, n);
    else if (r < 0.55) orchard(ctx, cx, y + 6, row, n);
    else if (r < 0.62 && row.parallax > 0.5) stream(ctx, cx, y + 30, row.cell);
    else flowerPatch(ctx, cx, y + 10, row.cell, n);
  }
}

/** A blossom colour, hazier for the far row. */
function blossom(i: number, row: Row): string {
  const c = BLOSSOM[((i % BLOSSOM.length) + BLOSSOM.length) % BLOSSOM.length];
  return row.haze > 0 ? mixHex(c, '#e8f2df', row.haze) : c;
}

/** A little clump of two or three round blossom trees. */
function copse(ctx: CanvasRenderingContext2D, cx: number, y: number, row: Row, n: number): void {
  const count = 2 + Math.floor(hash(n * 11) * 2);
  const size = row.parallax > 0.5 ? 30 : 20;
  for (let k = 0; k < count; k++) {
    const x = cx + k * size * 1.3;
    const s = size * (0.8 + 0.4 * hash(n * 13 + k));
    ctx.fillStyle = row.trunk;
    ctx.fillRect(x - 2.5, y - s * 0.4, 5, s * 0.9);
    ctx.fillStyle = blossom(n + k, row);
    ctx.beginPath();
    ctx.arc(x, y - s, s, 0, Math.PI * 2);
    ctx.arc(x - s * 0.6, y - s * 0.7, s * 0.6, 0, Math.PI * 2);
    ctx.arc(x + s * 0.6, y - s * 0.75, s * 0.6, 0, Math.PI * 2);
    ctx.fill();
    // A few white flecks of blossom catching the light.
    ctx.fillStyle = blossom(n + k + 1, row);
    for (let d = 0; d < 3; d++) {
      ctx.beginPath();
      ctx.arc(x + (hash(n * 17 + k * 5 + d) - 0.5) * s * 1.2, y - s - (hash(n + d * 7) - 0.3) * s * 0.8, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A row of small flowering fruit trees, evenly spaced like an orchard. */
function orchard(ctx: CanvasRenderingContext2D, cx: number, y: number, row: Row, n: number): void {
  const size = row.parallax > 0.5 ? 15 : 11;
  for (let k = -2; k <= 2; k++) {
    const x = cx + k * size * 2.6;
    ctx.fillStyle = row.trunk;
    ctx.fillRect(x - 1.5, y - size * 0.3, 3, size * 0.8);
    ctx.fillStyle = blossom(n + k + 2, row);
    ctx.beginPath();
    ctx.arc(x, y - size * 0.75, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A gentle stream winding across the meadow, catching the light. */
function stream(ctx: CanvasRenderingContext2D, cx: number, y: number, cell: number): void {
  ctx.strokeStyle = '#bfe3f2';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - cell * 0.4, y + 6);
  ctx.quadraticCurveTo(cx - cell * 0.1, y - 8, cx + cell * 0.15, y + 2);
  ctx.quadraticCurveTo(cx + cell * 0.3, y + 10, cx + cell * 0.45, y - 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - cell * 0.2, y - 1);
  ctx.lineTo(cx - cell * 0.08, y - 3);
  ctx.stroke();
}

/** A drift of tiny yellow and pink flowers over the grass. */
function flowerPatch(ctx: CanvasRenderingContext2D, cx: number, y: number, cell: number, n: number): void {
  for (let k = 0; k < 7; k++) {
    ctx.fillStyle = k % 3 === 0 ? '#f6d86b' : k % 3 === 1 ? '#f7c6d6' : '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + (hash(n * 23 + k) - 0.5) * cell * 0.6, y + hash(n * 29 + k) * 14, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Blend two #rrggbb colours: t = 0 gives a, 1 gives b. */
function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

// --- The park in a little town ----------------------------------------------

const HOUSES = ['#f7d9c4', '#f6e7b8', '#d8e8f3', '#f3d3df', '#dfeccd', '#e9ddf2'];
const ROOFS = ['#e39a86', '#9fb8d9', '#d98c9f', '#8fbf9e', '#c9a0c9'];
const TOWN_CELL = 110;
const PARK_CELL = 150;

/**
 * Spring's backdrop: a little town of pastel houses with pointed roofs far off,
 * and nearer, the park's own round trees and lamp posts along a lawn, all
 * scrolling slower than the ground.
 */
export function drawParkTown(ctx: CanvasRenderingContext2D, left: number, right: number, travelled: number): void {
  // A soft green rise the town sits on.
  ctx.fillStyle = '#c6e6ac';
  ctx.fillRect(left, GROUND_Y - 120, right - left, 124);
  townRow(ctx, left, right, travelled * 0.3);
  // The lawn between the town and the park.
  ctx.fillStyle = '#b4e09a';
  ctx.fillRect(left, GROUND_Y - 70, right - left, 74);
  parkRow(ctx, left, right, travelled * 0.6);
}

function townRow(ctx: CanvasRenderingContext2D, left: number, right: number, shift: number): void {
  const first = Math.floor(shift / TOWN_CELL) - 1;
  const last = Math.floor((right - left + shift) / TOWN_CELL) + 1;
  const base = GROUND_Y - 110;
  for (let n = first; n <= last; n++) {
    const x = n * TOWN_CELL + left - shift;
    const w = TOWN_CELL - 14;
    const h = 70 + Math.floor(hash(n * 5 + 1) * 3) * 26;
    const wall = mixHex(HOUSES[Math.floor(hash(n * 7) * HOUSES.length)], '#eef5e6', 0.25);
    const roof = mixHex(ROOFS[Math.floor(hash(n * 11 + 3) * ROOFS.length)], '#eef5e6', 0.25);
    ctx.fillStyle = wall;
    ctx.beginPath();
    ctx.roundRect(x + 7, base - h, w, h + 4, [4, 4, 0, 0]);
    ctx.fill();
    // A pointed roof, or now and then a rounded one, or a little tower.
    ctx.fillStyle = roof;
    ctx.beginPath();
    const kind = hash(n * 13 + 2);
    if (kind < 0.6) {
      ctx.moveTo(x + 1, base - h + 2);
      ctx.lineTo(x + 7 + w / 2, base - h - 38);
      ctx.lineTo(x + 13 + w, base - h + 2);
    } else if (kind < 0.85) {
      ctx.ellipse(x + 7 + w / 2, base - h + 2, w / 2 + 5, 24, 0, Math.PI, Math.PI * 2);
    } else {
      ctx.moveTo(x + 7 + w * 0.3, base - h + 2);
      ctx.lineTo(x + 7 + w / 2, base - h - 60);
      ctx.lineTo(x + 7 + w * 0.7, base - h + 2);
    }
    ctx.closePath();
    ctx.fill();
    // Rows of little windows.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let fy = base - h + 16; fy < base - 20; fy += 26) {
      for (const fx of [x + 7 + w * 0.28, x + 7 + w * 0.72]) {
        ctx.beginPath();
        ctx.roundRect(fx - 7, fy, 14, 14, 4);
        ctx.fill();
      }
    }
  }
}

function parkRow(ctx: CanvasRenderingContext2D, left: number, right: number, shift: number): void {
  const first = Math.floor(shift / PARK_CELL) - 1;
  const last = Math.floor((right - left + shift) / PARK_CELL) + 1;
  const base = GROUND_Y - 4;
  for (let n = first; n <= last; n++) {
    const x = n * PARK_CELL + left - shift + PARK_CELL / 2;
    const r = hash(n * 17 + 9);
    if (r < 0.55) {
      // A round park tree, plain green.
      const s = 34 + hash(n * 19) * 18;
      ctx.fillStyle = '#a88c74';
      ctx.fillRect(x - 4, base - s * 1.3, 8, s * 1.3);
      ctx.fillStyle = hash(n * 23) < 0.5 ? '#8fcf7e' : '#9fd88a';
      ctx.beginPath();
      ctx.arc(x, base - s * 1.7, s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.beginPath();
      ctx.arc(x - s * 0.35, base - s * 2, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (r < 0.75) {
      // A lamp post with a round lamp.
      ctx.fillStyle = '#8a8f99';
      ctx.fillRect(x - 3, base - 110, 6, 110);
      ctx.beginPath();
      ctx.arc(x, base - 116, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#fff3c4';
      ctx.fill();
    } else {
      // A clipped round hedge with a few flowers.
      ctx.fillStyle = HEDGE_DARK;
      ctx.beginPath();
      ctx.ellipse(x, base - 18, 46, 24, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      for (let k = 0; k < 4; k++) {
        blossomDot(ctx, x - 30 + k * 20, base - 22 - hash(n * 29 + k) * 14, HEDGE_FLOWERS[k % HEDGE_FLOWERS.length]);
      }
    }
  }
}

/** One screen: the path's wave repeats each screen, so it meets itself where the world loops. */
const PATH_REPEAT = 1024;
const PATH_TOP = GROUND_Y + 72;
const PATH_BOTTOM = GROUND_Y + 122;

/** The path's edge at a point: it bends gently up and down along the park. */
function pathEdge(x: number, top: boolean): number {
  const a = (x / PATH_REPEAT) * Math.PI * 2;
  const wave = Math.sin(a) * 5 + Math.sin(a * 3 + 1) * 3;
  return (top ? PATH_TOP : PATH_BOTTOM) + wave;
}

/** A sandy path running the length of the park, with a paler edge and a few pebbles. */
export function drawPath(ctx: CanvasRenderingContext2D, left: number, right: number): void {
  const step = 32;
  const x0 = Math.floor(left / step) * step - step;
  const x1 = right + step;
  const band = (off: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x0, pathEdge(x0, true) - off);
    for (let x = x0; x <= x1; x += step) ctx.lineTo(x, pathEdge(x, true) - off);
    for (let x = x1; x >= x0; x -= step) ctx.lineTo(x, pathEdge(x, false) + off);
    ctx.closePath();
    ctx.fill();
  };
  band(4, '#e4cfa6');
  band(0, '#f0deb8');
  // Pebbles, the same every time.
  const first = Math.floor(left / PATCH) - 1;
  const last = Math.floor(right / PATCH) + 1;
  ctx.fillStyle = '#ddc79c';
  for (let n = first; n <= last; n++) {
    const k = ((n % PATCHES_PER_REPEAT) + PATCHES_PER_REPEAT) % PATCHES_PER_REPEAT;
    const x = n * PATCH + hash(k * 53) * PATCH;
    const y = pathEdge(x, true) + 8 + hash(k * 59 + 1) * 32;
    ctx.beginPath();
    ctx.ellipse(x, y, 3 + hash(k * 61) * 2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

const HEDGE = '#7fbf6a';
const HEDGE_DARK = '#6aab58';
const HEDGE_LIGHT = '#94cd7e';
const HEDGE_FLOWERS = ['#f39ab6', '#ffffff', '#f6d86b', '#f7c6d6'];
/** The hedge's bumps; 16 of them make 1024, which goes evenly into every world's width. */
const BUMP = 64;
const BUMPS_PER_REPEAT = 16;

/**
 * A low, rounded flowering hedge along the back of the ground, in place of the
 * farm's fence. It repeats every 1024 world units, so it meets itself where the
 * world loops. Here and there a gap shows a few tulips.
 */
export function drawHedge(ctx: CanvasRenderingContext2D, left: number, right: number): void {
  const top = GROUND_Y - 46;
  const first = Math.floor(left / BUMP) - 1;
  const last = Math.floor(right / BUMP) + 1;
  for (let n = first; n <= last; n++) {
    const k = ((n % BUMPS_PER_REPEAT) + BUMPS_PER_REPEAT) % BUMPS_PER_REPEAT;
    const x = n * BUMP + BUMP / 2;
    if (hash(k * 5 + 3) < 0.12) {
      tulips(ctx, x, k);
      continue;
    }
    const lift = 8 * hash(k * 7 + 1);
    ctx.fillStyle = HEDGE_DARK;
    ctx.beginPath();
    ctx.roundRect(x - BUMP / 2 - 2, top + 14 - lift, BUMP + 4, GROUND_Y + 4 - (top + 14 - lift), [22, 22, 0, 0]);
    ctx.fill();
    ctx.fillStyle = HEDGE;
    ctx.beginPath();
    ctx.arc(x - 14, top + 18 - lift, 22, 0, Math.PI * 2);
    ctx.arc(x + 14, top + 14 - lift, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = HEDGE_LIGHT;
    ctx.beginPath();
    ctx.ellipse(x + 6, top + 4 - lift, 12, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Blossoms dotted over the leaves.
    for (let d = 0; d < 4; d++) {
      const fx = x + (hash(k * 13 + d) - 0.5) * BUMP * 0.9;
      const fy = top + 6 - lift + hash(k * 17 + d * 3) * 34;
      blossomDot(ctx, fx, fy, HEDGE_FLOWERS[(k + d) % HEDGE_FLOWERS.length]);
    }
  }
}

/** A five-petal blossom with a yellow middle. */
function blossomDot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  for (let p = 0; p < 5; p++) {
    const a = (p / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 3, y + Math.sin(a) * 3, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(x, y, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

const TULIPS = ['#f28b82', '#f6c26b', '#f39ab6', '#b39ddb'];

/** A gap in the hedge with a few tulips standing in it. */
function tulips(ctx: CanvasRenderingContext2D, x: number, k: number): void {
  for (let t = 0; t < 3; t++) {
    const tx = x - 18 + t * 18;
    const h = 26 + 8 * hash(k * 3 + t);
    ctx.fillStyle = '#6aab58';
    ctx.fillRect(tx - 1.5, GROUND_Y - h, 3, h + 2);
    ctx.beginPath();
    ctx.ellipse(tx + 5, GROUND_Y - h * 0.35, 3, 9, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = TULIPS[(k + t) % TULIPS.length];
    ctx.beginPath();
    ctx.moveTo(tx - 7, GROUND_Y - h - 10);
    ctx.lineTo(tx - 3.5, GROUND_Y - h - 4);
    ctx.lineTo(tx, GROUND_Y - h - 11);
    ctx.lineTo(tx + 3.5, GROUND_Y - h - 4);
    ctx.lineTo(tx + 7, GROUND_Y - h - 10);
    ctx.quadraticCurveTo(tx + 7, GROUND_Y - h + 4, tx, GROUND_Y - h + 4);
    ctx.quadraticCurveTo(tx - 7, GROUND_Y - h + 4, tx - 7, GROUND_Y - h - 10);
    ctx.fill();
  }
}

/** The grass's dots; 32 cells make 1024, so the pattern meets itself where the world loops. */
const PATCH = 32;
const PATCHES_PER_REPEAT = 32;

/**
 * Clover leaves, daisies and buttercups dotted sparsely over the grass, the same
 * every time; drawn after the ground, before anything standing on it.
 */
export function drawSpringGround(ctx: CanvasRenderingContext2D, left: number, right: number): void {
  const first = Math.floor(left / PATCH) - 1;
  const last = Math.floor(right / PATCH) + 1;
  for (let n = first; n <= last; n++) {
    const k = ((n % PATCHES_PER_REPEAT) + PATCHES_PER_REPEAT) % PATCHES_PER_REPEAT;
    // About one in each cell (~32 per screen), most of them small clover.
    const r = hash(k * 31 + 7);
    const x = n * PATCH + hash(k * 37) * PATCH;
    const y = GROUND_Y + 14 + hash(k * 41 + 2) * 140;
    if (r < 0.55) clover(ctx, x, y);
    else if (r < 0.8) daisy(ctx, x, y, '#ffffff');
    else daisy(ctx, x, y, '#f6d86b');
    // Further down, toward the viewer, a few more.
    if (hash(k * 43 + 5) < 0.3) clover(ctx, x + 11, y + 4 + hash(k * 47) * 6);
  }
}

function clover(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#7cc164';
  for (const a of [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6]) {
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 3.2, y + Math.sin(a) * 2.4, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function daisy(ctx: CanvasRenderingContext2D, x: number, y: number, petals: string): void {
  ctx.fillStyle = petals;
  for (let p = 0; p < 6; p++) {
    const a = (p / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * 3.4, y + Math.sin(a) * 2.4, 2.4, 1.6, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = petals === '#ffffff' ? '#f2c14e' : '#e8a43a';
  ctx.beginPath();
  ctx.arc(x, y, 1.8, 0, Math.PI * 2);
  ctx.fill();
}
