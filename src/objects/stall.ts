import { GROUND_Y } from '../config';
import { CANDLES, FASTFOOD, ICE_BLOCKS, ORNAMENTS, SWEETS, WARM, drawCandleFlame, isCandle } from './goods';
import { WINTER_HATS } from './hat';
import { drawLoose, sizeOf, type ItemKind, type LooseKind } from './item';

// Winter stalls that each give one kind of thing, like the picnic basket: the
// next one sits ready on the counter (or in the chest's opening); take it and
// another, picked at random, rises up from behind the counter, while not too
// many are out. Each stall's string lights switch on or off with a tap.

export type StallLook = 'icechest' | 'candles' | 'sweets' | 'cocoa' | 'hats' | 'food' | 'ornaments';

/** Seconds for the next thing to rise into place. */
const RISE_SECONDS = 0.45;

interface Shape {
  /** Half the width of the whole stall, for taps. */
  half: number;
  /** How tall it stands above its ground line. */
  height: number;
  /** Where the offered thing stands: sideways from the middle, and its bottom above the ground line. */
  spotDx: number;
  spotUp: number;
}

const SHAPE: Record<StallLook, Shape> = {
  icechest: { half: 104, height: 200, spotDx: 0, spotUp: 78 },
  candles: { half: 116, height: 300, spotDx: 34, spotUp: 118 },
  sweets: { half: 126, height: 330, spotDx: 38, spotUp: 122 },
  cocoa: { half: 126, height: 310, spotDx: 42, spotUp: 120 },
  hats: { half: 130, height: 340, spotDx: 0, spotUp: 118 },
  food: { half: 140, height: 310, spotDx: 30, spotUp: 120 },
  ornaments: { half: 120, height: 360, spotDx: 0, spotUp: 116 },
};

const KINDS: Record<StallLook, readonly ItemKind[]> = {
  icechest: ICE_BLOCKS,
  candles: CANDLES,
  sweets: SWEETS,
  cocoa: WARM,
  hats: WINTER_HATS,
  food: FASTFOOD,
  ornaments: ORNAMENTS,
};

/** The ice chest gives mostly plain cubes; the rest are blocks with windows and tower tops. */
const ICE_WEIGHT: Partial<Record<ItemKind, number>> = { icecube: 0.6, icewindow: 0.2, icetop: 0.2 };

const BULBS = ['#f28b82', '#f2c14e', '#8fd18a', '#81c7e8', '#f3a3c4'];
const SNOW = '#f6f9fd';
const SNOW_SHADE = '#dce7f3';

interface Bulb {
  x: number;
  y: number;
  color: string;
}

export class Stall {
  readonly depth = GROUND_Y + 20;
  readonly kinds: ItemKind[];
  private readonly shape: Shape;
  private next = 0;
  /** The thing on offer: 0 still hidden, 1 standing ready to take. */
  private up = 1;
  /** Little string lights, glowing at night. */
  private readonly bulbs: Bulb[];
  /** Whether the string lights are on. */
  lights = true;

  constructor(
    readonly look: StallLook,
    readonly x: number,
  ) {
    this.kinds = [...KINDS[look]];
    this.shape = SHAPE[look];
    this.bulbs = this.makeBulbs();
  }

  private get spotX(): number {
    return this.x + this.shape.spotDx;
  }

  /** The line the offered thing stands on (it rises up from below it). */
  private get spotY(): number {
    return this.depth - this.shape.spotUp;
  }

  private get kind(): ItemKind {
    return this.kinds[this.next];
  }

  /** Centre of the thing on offer, `up` of the way risen. */
  private itemY(up: number): number {
    const h = sizeOf(this.kind as LooseKind).height;
    return this.spotY - h / 2 + (1 - up) * (h + 12);
  }

  hits(px: number, py: number, slop: number): boolean {
    const s = this.shape;
    return Math.abs(px - this.x) <= s.half + slop && py >= this.depth - s.height - slop && py <= this.depth + slop;
  }

  /** The thing on offer, if it is ready and under the finger. */
  offerAt(px: number, py: number, slop: number): { dist: number } | null {
    if (this.up < 1) return null;
    const { radius, height } = sizeOf(this.kind as LooseKind);
    const dist = Math.hypot(px - this.spotX, py - this.itemY(1));
    return dist <= Math.max(radius, height / 2) + slop ? { dist } : null;
  }

  /** Take the thing on offer; the next one starts rising. */
  take(): { kind: ItemKind; x: number; bottom: number } {
    const kind = this.kind;
    const bottom = this.spotY;
    this.next = this.pickNext();
    this.up = 0;
    return { kind, x: this.spotX, bottom };
  }

  /** Another kind at random: never the same twice running, except the ice chest's mostly plain cubes. */
  private pickNext(): number {
    const n = this.kinds.length;
    if (n === 1) return 0;
    if (this.look === 'icechest') {
      let roll = Math.random();
      for (let i = 0; i < n; i++) {
        roll -= ICE_WEIGHT[this.kinds[i]] ?? 1 / n;
        if (roll < 0) return i;
      }
      return 0;
    }
    return (this.next + 1 + Math.floor(Math.random() * (n - 1))) % n;
  }

  /** Switch the string lights on or off; returns whether they are on now. */
  toggleLights(): boolean {
    this.lights = !this.lights;
    return this.lights;
  }

  get turn(): number {
    return this.next;
  }

  set turn(n: number) {
    this.next = ((n % this.kinds.length) + this.kinds.length) % this.kinds.length;
  }

  /** The next thing rises only while not too many are out. Returns true as it arrives. */
  update(dt: number, canGive: boolean): boolean {
    if (this.up >= 1 || !canGive) return false;
    this.up = Math.min(1, this.up + dt / RISE_SECONDS);
    return this.up >= 1;
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    BACK[this.look](ctx, this.x, this.depth, time);
    this.drawOffer(ctx);
    FRONT[this.look](ctx, this.x, this.depth, time);
    for (const b of this.bulbs) {
      dot(ctx, b.x, b.y, 5, b.color);
      // Switched off, the bulbs look dull.
      if (!this.lights) dot(ctx, b.x, b.y, 5, 'rgba(70, 76, 96, 0.5)');
    }
  }

  /** At night the string lights glow over the dark. */
  drawGlow(ctx: CanvasRenderingContext2D, night: number): void {
    if (night <= 0 || !this.lights) return;
    for (const b of this.bulbs) {
      const glow = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, 26);
      glow.addColorStop(0, `rgba(255, 236, 170, ${0.5 * night})`);
      glow.addColorStop(1, 'rgba(255, 236, 170, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = night;
      dot(ctx, b.x, b.y, 5, '#fff3c4');
      dot(ctx, b.x, b.y, 3, b.color);
      ctx.globalAlpha = 1;
    }
  }

  /** The thing on offer, coming up from behind the counter. */
  private drawOffer(ctx: CanvasRenderingContext2D): void {
    if (this.up <= 0) return;
    const t = 1 - Math.pow(1 - this.up, 3);
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.spotX - 90, this.spotY - 240, 180, 240);
    ctx.clip();
    drawLoose(ctx, this.kind as LooseKind, this.spotX, this.itemY(t), 0, 1, 1);
    // Candles come lit.
    if (isCandle(this.kind)) drawCandleFlame(ctx, this.spotX, this.itemY(t), 0, 1, 1, true, performance.now() / 1000);
    ctx.restore();
  }

  private makeBulbs(): Bulb[] {
    const x = this.x;
    const g = this.depth;
    const swag = (x0: number, y0: number, x1: number, y1: number, sag: number, n: number): Bulb[] =>
      Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n;
        return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t + sag * 4 * t * (1 - t), color: BULBS[i % BULBS.length] };
      });
    switch (this.look) {
      case 'icechest':
        return [];
      case 'candles':
        return swag(x - 100, g - 236, x + 100, g - 236, 14, 7);
      case 'sweets':
        return swag(x - 116, g - 230, x + 116, g - 230, 10, 8);
      case 'cocoa':
        return swag(x - 110, g - 222, x + 110, g - 222, 16, 7);
      case 'hats':
        return [...swag(x - 124, g - 238, x, g - 300, 8, 4), ...swag(x, g - 300, x + 124, g - 238, 8, 4)];
      case 'food':
        return swag(x - 124, g - 244, x + 124, g - 244, 12, 9);
      case 'ornaments':
        return [...swag(x - 110, g - 222, x, g - 262, 10, 4), ...swag(x, g - 262, x + 110, g - 222, 10, 4)];
    }
  }
}

// --- Drawing helpers ------------------------------------------------------

type Draw = (ctx: CanvasRenderingContext2D, x: number, g: number, time: number) => void;

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string): void {
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

/** A soft lump of snow resting along a top edge from x0 to x1. */
function snowCap(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, depth = 12): void {
  const n = Math.max(2, Math.round((x1 - x0) / 34));
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.moveTo(x0 - 4, y + 3);
  for (let i = 0; i < n; i++) {
    const a = x0 + ((x1 - x0) * i) / n;
    const b = x0 + ((x1 - x0) * (i + 1)) / n;
    ctx.quadraticCurveTo((a + b) / 2, y - depth * (i % 2 ? 0.8 : 1.15), b + (i === n - 1 ? 4 : 0), y + (i === n - 1 ? 3 : 0));
  }
  ctx.lineTo(x1 + 4, y + 6);
  ctx.quadraticCurveTo((x0 + x1) / 2, y + 12, x0 - 4, y + 6);
  ctx.closePath();
  ctx.fill();
}

/** A drift of snow banked against the foot of a stall. */
function drift(ctx: CanvasRenderingContext2D, x: number, g: number, half: number): void {
  ctx.fillStyle = SNOW_SHADE;
  ctx.beginPath();
  ctx.ellipse(x, g - 2, half, 12, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.ellipse(x - half * 0.15, g - 2, half * 0.8, 9, 0, Math.PI, Math.PI * 2);
  ctx.fill();
}

/** A scalloped, striped awning hanging between two x's, top at y. */
function awning(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, h: number, a: string, b: string, n: number): void {
  const w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const left = x0 + i * w;
    ctx.fillStyle = i % 2 ? b : a;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + w, y);
    ctx.lineTo(left + w, y + h);
    ctx.arc(left + w / 2, y + h, w / 2, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
  }
}

/** A gabled roof from x0 to x1 resting on y, rising to a peak h above it. */
function gable(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, h: number, color: string, over = 14): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x0 - over, y);
  ctx.lineTo((x0 + x1) / 2, y - h);
  ctx.lineTo(x1 + over, y);
  ctx.quadraticCurveTo(x1 + over, y + 10, x1 + over - 8, y + 10);
  ctx.lineTo(x0 - over + 8, y + 10);
  ctx.quadraticCurveTo(x0 - over, y + 10, x0 - over, y);
  ctx.fill();
  // Snow along both slopes.
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.moveTo(x0 - over + 2, y - 2);
  ctx.lineTo((x0 + x1) / 2, y - h - 8);
  ctx.lineTo(x1 + over - 2, y - 2);
  ctx.quadraticCurveTo(x1 + over - 14, y + 6, x1 + over - 26, y - 1);
  ctx.lineTo((x0 + x1) / 2, y - h + 14);
  ctx.lineTo(x0 - over + 26, y - 1);
  ctx.quadraticCurveTo(x0 - over + 14, y + 6, x0 - over + 2, y - 2);
  ctx.fill();
}

/** A counter: its top edge at y, from x0 to x1, down to the ground. */
function counter(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, g: number, body: string, top: string): void {
  box(ctx, x0, y + 4, x1 - x0, g - y - 4, 10, body);
  box(ctx, x0 - 8, y - 2, x1 - x0 + 16, 14, 7, top);
}

// --- The looks ------------------------------------------------------------

const BACK: Record<StallLook, Draw> = {
  icechest: (ctx, x, g) => {
    // The lid stands propped open behind the chest, with an iron band across it.
    ctx.save();
    ctx.translate(x, g - 86);
    ctx.rotate(-0.18);
    box(ctx, -96, -108, 192, 104, 18, '#a7724c');
    box(ctx, -96, -64, 192, 14, 4, '#7f8794');
    for (const dx of [-60, 60]) box(ctx, dx - 7, -108, 14, 104, 4, '#7f8794');
    snowCap(ctx, -92, 92, -106, 10);
    ctx.restore();
    // The dark inside of the chest's opening, where the next cube waits.
    box(ctx, x - 90, g - 94, 180, 24, 10, '#5b4c48');
  },
  candles: (ctx, x, g) => {
    // Back wall with a peaked roof, and a high shelf of candles waiting their turn.
    box(ctx, x - 104, g - 236, 208, 236, 12, '#cfe0ef');
    gable(ctx, x - 104, x + 104, g - 236, 54, '#8d6e9e');
    box(ctx, x - 90, g - 196, 180, 10, 5, '#a7826a');
    const colors = ['#e8665c', '#f2c14e', '#7fb85e', '#6b93e0', '#f3a3c4'];
    colors.forEach((c, i) => {
      const cx = x - 72 + i * 36;
      box(ctx, cx - 7, g - 226, 14, 30, 4, c);
      dot(ctx, cx, g - 230, 3, '#fff3c4');
    });
    // A row of drippy wax hanging off the shelf.
    ctx.fillStyle = '#f7efe1';
    for (let i = 0; i < 6; i++) box(ctx, x - 84 + i * 32, g - 188, 8, 10 + (i % 3) * 6, 4, '#f7efe1');
    // A window behind the counter.
    box(ctx, x - 80, g - 170, 70, 46, 10, '#fff3d6');
  },
  sweets: (ctx, x, g) => {
    box(ctx, x - 112, g - 230, 224, 230, 14, '#fbe4ec');
    // Shelves of jars to one side behind the counter...
    box(ctx, x - 98, g - 196, 92, 74, 10, '#fff7fa');
    box(ctx, x - 98, g - 162, 92, 6, 3, '#e8b3c6');
    const jar = (cx: number, y: number, fill: string) => {
      box(ctx, cx - 11, y - 24, 22, 24, 6, 'rgba(255, 255, 255, 0.9)');
      box(ctx, cx - 9, y - 16, 18, 15, 4, fill);
      box(ctx, cx - 9, y - 28, 18, 6, 3, '#d98fab');
    };
    ['#f28b82', '#8fd18a', '#81c7e8'].forEach((c, i) => jar(x - 80 + i * 28, g - 164, c));
    ['#f2c14e', '#c3a3e8', '#f3a3c4'].forEach((c, i) => jar(x - 80 + i * 28, g - 128, c));
    // ...and a calm plain panel behind where the sweet sits, so it stands out.
    box(ctx, x - 2, g - 208, 92, 90, 12, '#5f9e94');
    box(ctx, x + 4, g - 202, 80, 78, 9, '#78b5aa');
    // A big lollipop sign on the roof.
    ctx.strokeStyle = '#f7efe1';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, g - 262);
    ctx.lineTo(x, g - 300);
    ctx.stroke();
    dot(ctx, x, g - 308, 24, '#f3a3c4');
    ctx.strokeStyle = '#fbe4ec';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, g - 308, 14, 0, Math.PI * 1.5);
    ctx.stroke();
    // Roof.
    box(ctx, x - 124, g - 266, 248, 30, 12, '#e8a0bb');
    snowCap(ctx, x - 122, x + 122, g - 266, 12);
  },
  cocoa: (ctx, x, g, time) => {
    // A little log hut with a snowy roof.
    box(ctx, x - 110, g - 222, 220, 222, 10, '#b98763');
    ctx.fillStyle = '#a77654';
    for (let y = g - 200; y < g; y += 22) box(ctx, x - 110, y, 220, 5, 2, '#a77654');
    gable(ctx, x - 110, x + 110, g - 222, 66, '#8d5c4f');
    // The serving window, warm inside.
    box(ctx, x - 92, g - 196, 184, 80, 12, '#ffe7c2');
    box(ctx, x - 92, g - 196, 184, 16, 8, '#f6d3a2');
    // A steaming pot on the counter.
    box(ctx, x - 78, g - 156, 56, 40, 12, '#c0533f');
    box(ctx, x - 84, g - 160, 68, 10, 5, '#a9442f');
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const sx = x - 64 + i * 14;
      const rise = (time * 0.6 + i * 0.33) % 1;
      ctx.globalAlpha = 0.8 * (1 - rise);
      ctx.beginPath();
      for (let k = 0; k <= 6; k++) {
        const y = g - 166 - k * 7 - rise * 26;
        const wx = sx + Math.sin(k * 0.9 + time * 2 + i) * 5;
        if (k === 0) ctx.moveTo(wx, y);
        else ctx.lineTo(wx, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // A cup-shaped sign hanging off the roof edge.
    box(ctx, x + 70, g - 270, 34, 30, 8, '#f7efe1');
    ctx.strokeStyle = '#f7efe1';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x + 106, g - 256, 9, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  },
  hats: (ctx, x, g) => {
    // Posts and a back curtain.
    box(ctx, x - 118, g - 240, 14, 240, 6, '#a7826a');
    box(ctx, x + 104, g - 240, 14, 240, 6, '#a7826a');
    box(ctx, x - 104, g - 232, 208, 120, 8, '#e3ecf6');
    // A peaked fabric roof in two colours.
    ctx.fillStyle = '#6b93e0';
    ctx.beginPath();
    ctx.moveTo(x - 134, g - 232);
    ctx.lineTo(x, g - 302);
    ctx.lineTo(x + 134, g - 232);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f7efe1';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x, g - 302);
      ctx.lineTo(x - 134 + i * 67 + 22, g - 232);
      ctx.lineTo(x - 134 + i * 67 + 44, g - 232);
      ctx.closePath();
      ctx.fill();
    }
    snowCap(ctx, x - 40, x + 40, g - 286, 8);
    // The sign: a big knitted hat with a bobble.
    const sy = g - 312;
    ctx.fillStyle = '#e8665c';
    ctx.beginPath();
    ctx.moveTo(x - 34, sy + 8);
    ctx.quadraticCurveTo(x - 34, sy - 36, x, sy - 38);
    ctx.quadraticCurveTo(x + 34, sy - 36, x + 34, sy + 8);
    ctx.closePath();
    ctx.fill();
    box(ctx, x - 38, sy, 76, 16, 8, '#f7efe1');
    dot(ctx, x, sy - 42, 11, '#f7efe1');
    ctx.strokeStyle = '#d85a50';
    ctx.lineWidth = 3;
    for (const dx of [-16, 0, 16]) {
      ctx.beginPath();
      ctx.moveTo(x + dx, sy - 28 + Math.abs(dx) * 0.4);
      ctx.lineTo(x + dx, sy - 2);
      ctx.stroke();
    }
    // Hats hung up on the back curtain, waiting their turn.
    const knit = (cx: number, y: number, c: string) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(cx, y, 14, Math.PI, 0);
      ctx.fill();
      box(ctx, cx - 16, y - 2, 32, 7, 3, '#f7efe1');
    };
    knit(x - 70, g - 180, '#7fb85e');
    knit(x + 70, g - 180, '#f2c14e');
    knit(x - 70, g - 140, '#b39ddb');
    knit(x + 70, g - 140, '#81c7e8');
  },
  food: (ctx, x, g) => {
    // A booth on two posts, with a warm back wall and a menu board of pictures.
    box(ctx, x - 128, g - 246, 16, 246, 6, '#c98c5e');
    box(ctx, x + 112, g - 246, 16, 246, 6, '#c98c5e');
    box(ctx, x - 112, g - 240, 224, 124, 8, '#fff1d6');
    box(ctx, x - 98, g - 222, 82, 66, 10, '#5b6b78');
    // Little pictures on the board: a hot dog, fries, a pretzel loop.
    box(ctx, x - 90, g - 210, 30, 10, 5, '#e8665c');
    box(ctx, x - 92, g - 212, 34, 4, 2, '#f2c14e');
    box(ctx, x - 52, g - 214, 22, 20, 4, '#e8665c');
    for (const dx of [-48, -42, -36]) box(ctx, x + dx, g - 222, 4, 10, 2, '#f2c14e');
    ctx.strokeStyle = '#c98c5e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x - 68, g - 176, 9, 0, Math.PI * 2);
    ctx.arc(x - 48, g - 176, 9, 0, Math.PI * 2);
    ctx.stroke();
    // A big hot-dog sign on top of the roof.
    box(ctx, x - 62, g - 316, 124, 34, 17, '#f2c14e');
    box(ctx, x - 70, g - 306, 140, 16, 8, '#d9574f');
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 50, g - 299);
    for (let k = 1; k <= 10; k++) ctx.lineTo(x - 50 + k * 10, g - 299 + (k % 2 ? -4 : 0));
    ctx.stroke();
    box(ctx, x - 5, g - 284, 10, 20, 3, '#c98c5e');
  },
  ornaments: (ctx, x, g) => {
    box(ctx, x - 108, g - 222, 14, 222, 6, '#a7826a');
    box(ctx, x + 94, g - 222, 14, 222, 6, '#a7826a');
    box(ctx, x - 94, g - 216, 188, 100, 8, '#dbe8f4');
    // Small ornaments hanging along the back.
    const colors = ['#e8665c', '#6b93e0', '#f2c14e', '#7fb85e', '#c3a3e8'];
    colors.forEach((c, i) => {
      const cx = x - 72 + i * 36;
      const y = g - 196 + (i % 2) * 22;
      ctx.strokeStyle = '#a7826a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, g - 216);
      ctx.lineTo(cx, y - 10);
      ctx.stroke();
      dot(ctx, cx, y, 11, c);
      box(ctx, cx - 4, y - 14, 8, 5, 2, '#d9c08b');
      dot(ctx, cx - 4, y - 4, 3, 'rgba(255, 255, 255, 0.5)');
    });
    gable(ctx, x - 108, x + 108, g - 222, 40, '#4f8f73');
    // A giant bauble sitting on the roof.
    const by = g - 300;
    dot(ctx, x, by, 40, '#5fb0c8');
    box(ctx, x - 40, by - 4, 80, 10, 5, '#f7efe1');
    dot(ctx, x - 14, by - 16, 9, 'rgba(255, 255, 255, 0.5)');
    box(ctx, x - 12, by - 52, 24, 14, 4, '#d9c08b');
    ctx.strokeStyle = '#d9c08b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, by - 56, 7, Math.PI, 0);
    ctx.stroke();
  },
};

const FRONT: Record<StallLook, Draw> = {
  icechest: (ctx, x, g) => {
    // Body of the chest, banded in iron, half in a drift of snow.
    box(ctx, x - 98, g - 84, 196, 84, 14, '#b98763');
    box(ctx, x - 98, g - 84, 196, 14, 7, '#a7724c');
    for (const dx of [-62, 62]) box(ctx, x + dx - 8, g - 84, 16, 84, 4, '#7f8794');
    box(ctx, x - 14, g - 70, 28, 26, 6, '#d9c08b');
    dot(ctx, x, g - 58, 4, '#7f8794');
    drift(ctx, x + 20, g + 4, 120);
  },
  candles: (ctx, x, g) => {
    counter(ctx, x - 100, x + 100, g - 118, g, '#b39ddb', '#8d6e9e');
    // Wax drips down the counter's edge.
    for (let i = 0; i < 7; i++) box(ctx, x - 92 + i * 28, g - 108, 10, 12 + (i % 3) * 8, 5, '#f7efe1');
    drift(ctx, x - 30, g + 4, 110);
  },
  sweets: (ctx, x, g) => {
    counter(ctx, x - 108, x + 108, g - 122, g, '#f3b8cc', '#e8a0bb');
    // Candy-stripe panels on the front.
    for (let i = 0; i < 5; i++) box(ctx, x - 92 + i * 40, g - 100, 22, 78, 8, '#fbe4ec');
    awning(ctx, x - 118, x + 118, g - 238, 28, '#f3a3c4', '#ffffff', 8);
    drift(ctx, x + 40, g + 4, 100);
  },
  cocoa: (ctx, x, g) => {
    counter(ctx, x - 104, x + 104, g - 120, g, '#a77654', '#8d5c4f');
    // A mug painted on the front.
    box(ctx, x - 24, g - 90, 40, 42, 10, '#f7efe1');
    ctx.strokeStyle = '#f7efe1';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x + 18, g - 70, 10, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    box(ctx, x - 20, g - 86, 32, 8, 4, '#8d5c4f');
    drift(ctx, x - 20, g + 4, 120);
  },
  hats: (ctx, x, g) => {
    counter(ctx, x - 112, x + 112, g - 116, g, '#e3c8a6', '#c99f74');
    // Knit-stitch rows on the counter.
    ctx.strokeStyle = '#d6b893';
    ctx.lineWidth = 3;
    for (let y = g - 90; y < g - 10; y += 18) {
      ctx.beginPath();
      for (let k = 0; k <= 20; k++) {
        const px = x - 100 + k * 10;
        if (k === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y + (k % 2 ? 5 : 0));
      }
      ctx.stroke();
    }
    drift(ctx, x + 30, g + 4, 110);
  },
  food: (ctx, x, g) => {
    counter(ctx, x - 116, x + 116, g - 120, g, '#f2c14e', '#e0a93b');
    // Red and white panels on the front, and a striped awning with snow on top.
    for (let i = 0; i < 4; i++) box(ctx, x - 100 + i * 52, g - 98, 36, 76, 9, i % 2 ? '#f7efe1' : '#e8665c');
    box(ctx, x - 140, g - 270, 280, 26, 10, '#e8665c');
    snowCap(ctx, x - 138, x + 138, g - 270, 10);
    awning(ctx, x - 140, x + 140, g - 246, 26, '#e8665c', '#f7efe1', 8);
    drift(ctx, x + 10, g + 4, 140);
  },
  ornaments: (ctx, x, g) => {
    counter(ctx, x - 104, x + 104, g - 116, g, '#7fae96', '#4f8f73');
    // Little stars on the front.
    ctx.fillStyle = '#f2c14e';
    for (const [dx, dy] of [
      [-60, -70],
      [0, -50],
      [60, -76],
    ]) {
      star(ctx, x + dx, g + dy, 12);
    }
    drift(ctx, x - 30, g + 4, 110);
  },
};

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}
